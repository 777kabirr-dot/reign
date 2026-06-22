"""
SENTINEL — SERP & mention monitoring agent.

Monitors search results for every client across a set of search terms,
classifies each result with Claude (sentiment / severity / reason), and
persists new mentions to Supabase, skipping duplicates by URL.
"""
from __future__ import annotations

import os
import re
from typing import Any

import httpx

from database import client as db
from utils import claude_client

SERPER_ENDPOINT = "https://google.serper.dev/search"

VALID_SENTIMENT = {"positive", "neutral", "negative"}
VALID_SEVERITY = {"low", "medium", "high", "critical"}


def _parse_context(context: str | None) -> dict[str, str]:
    """Extract structured fields from a client's markdown context file.

    Looks for `key: value` lines (case-insensitive) for the fields we care
    about. Falls back gracefully when fields are missing.
    """
    fields: dict[str, str] = {}
    if not context:
        return fields
    for line in context.splitlines():
        m = re.match(r"^\s*[-*]?\s*\*{0,2}([A-Za-z ]+?)\*{0,2}\s*[:|]\s*(.+?)\s*$", line)
        if m:
            key = m.group(1).strip().lower()
            fields[key] = m.group(2).strip()
    return fields


def _build_search_terms(client: dict[str, Any], fields: dict[str, str]) -> list[str]:
    name = (
        fields.get("client name")
        or fields.get("name")
        or client.get("name")
        or ""
    ).strip()
    brand = (fields.get("brand name") or fields.get("brand") or name).strip()

    terms = [
        f'"{name}"',
        f"{name} review",
        f"{name} complaint",
        f'"{brand}"',
        f"{brand} scam",
    ]
    # Add any explicit extra keywords from context.
    extra = fields.get("key search terms") or fields.get("keywords")
    if extra:
        terms.extend(t.strip() for t in re.split(r"[;,]", extra) if t.strip())

    # De-dupe while preserving order, drop empties / bare quotes.
    seen: set[str] = set()
    out: list[str] = []
    for t in terms:
        norm = t.strip()
        if norm and norm not in ('""', '" "') and norm.lower() not in seen:
            seen.add(norm.lower())
            out.append(norm)
    return out


async def _serper_search(query: str) -> list[dict[str, Any]]:
    api_key = os.environ.get("SERPER_API_KEY")
    if not api_key:
        raise RuntimeError("SERPER_API_KEY must be set for Sentinel to run.")
    headers = {"X-API-KEY": api_key, "Content-Type": "application/json"}
    payload = {"q": query, "num": 10, "gl": "in"}
    async with httpx.AsyncClient(timeout=30) as http:
        resp = await http.post(SERPER_ENDPOINT, headers=headers, json=payload)
        resp.raise_for_status()
        data = resp.json()
    results: list[dict[str, Any]] = []
    for item in data.get("organic", []):
        results.append(
            {
                "url": item.get("link", ""),
                "title": item.get("title", ""),
                "snippet": item.get("snippet", ""),
                "source": item.get("domain")
                or _domain_from_url(item.get("link", "")),
            }
        )
    return results


def _domain_from_url(url: str) -> str:
    m = re.match(r"https?://([^/]+)/?", url or "")
    return m.group(1) if m else ""


async def _classify(client_name: str, result: dict[str, Any]) -> dict[str, str]:
    prompt = (
        f"You are an ORM analyst. Given this search result for client {client_name}, classify:\n"
        " - sentiment (positive/neutral/negative)\n"
        " - severity (low/medium/high/critical)\n"
        " - reason (one sentence)\n"
        f"Result: {result.get('title','')} — {result.get('snippet','')} — {result.get('url','')}\n"
        "Respond ONLY in JSON: {sentiment, severity, reason}"
    )
    data = await claude_client.complete_json(prompt, max_tokens=300, temperature=0.1)
    sentiment = str(data.get("sentiment", "neutral")).lower().strip()
    severity = str(data.get("severity", "low")).lower().strip()
    reason = str(data.get("reason", "")).strip()
    if sentiment not in VALID_SENTIMENT:
        sentiment = "neutral"
    if severity not in VALID_SEVERITY:
        severity = "low"
    return {"sentiment": sentiment, "severity": severity, "reason": reason}


async def run_sentinel(client: dict[str, Any]) -> dict[str, Any]:
    """Monitor SERPs for one client, classify, and persist new mentions."""
    fields = _parse_context(client.get("context"))
    client_name = (
        fields.get("client name") or fields.get("name") or client.get("name", "")
    )
    terms = _build_search_terms(client, fields)

    seen_urls: set[str] = set()
    new_threats = critical = high = 0

    for term in terms:
        try:
            results = await _serper_search(term)
        except Exception as exc:  # noqa: BLE001
            print(f"[sentinel] Serper error for '{term}': {exc}")
            continue

        for result in results:
            url = result.get("url")
            if not url or url in seen_urls:
                continue
            seen_urls.add(url)

            if db.mention_exists(client["id"], url):
                continue

            classification = await _classify(client_name, result)
            mention = {
                "client_id": client["id"],
                "url": url,
                "title": result.get("title"),
                "snippet": (result.get("snippet") or "")
                + (f"  [reason: {classification['reason']}]" if classification["reason"] else ""),
                "source": result.get("source"),
                "sentiment": classification["sentiment"],
                "severity": classification["severity"],
                "status": "new",
            }
            inserted = db.insert_mention(mention)
            if inserted:
                new_threats += 1
                if classification["severity"] == "critical":
                    critical += 1
                elif classification["severity"] == "high":
                    high += 1

    return {"new_threats": new_threats, "critical": critical, "high": high}
