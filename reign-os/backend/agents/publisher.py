"""
PUBLISHER — content generation & distribution agent.

Generates positive, suppression-oriented content with Claude (SEO article,
press release, LinkedIn posts, optional GBP responses), publishes the article
to WordPress, submits it to the Google Indexing API, and records everything
in content_published.
"""
from __future__ import annotations

import os
import re
from typing import Any

import httpx

from agents.sentinel import _parse_context
from database import client as db
from utils import claude_client

WP_POSTS_PATH = "/wp-json/wp/v2/posts"
INDEXING_ENDPOINT = "https://indexing.googleapis.com/v3/urlNotifications:publish"


def _ctx_value(fields: dict[str, str], *keys: str, default: str = "") -> str:
    for k in keys:
        if k in fields and fields[k]:
            return fields[k]
    return default


async def _generate_article(client_name: str, context: str, tone: str, location: str, industry: str) -> dict[str, str]:
    prompt = (
        f"You are a brand storytelling expert. Write an 800-word SEO article about {client_name}.\n"
        f"Context about the client: {context}\n"
        f"Tone: {tone}\n"
        "DO NOT mention any controversies or negative content.\n"
        f"Include these keywords naturally: {client_name}, {location}, {industry}\n"
        "Format: H1 title, 4-5 H2 sections, concluding paragraph.\n"
        "Write as a third-party journalist profile piece.\n"
        "Return the article in clean HTML using <h1>, <h2> and <p> tags only."
    )
    body = await claude_client.complete(prompt, max_tokens=3000, temperature=0.7)
    title = _extract_h1(body) or f"{client_name}: A Profile"
    return {"title": title, "html": body}


def _extract_h1(html: str) -> str:
    m = re.search(r"<h1[^>]*>(.*?)</h1>", html, re.DOTALL | re.IGNORECASE)
    return re.sub(r"<[^>]+>", "", m.group(1)).strip() if m else ""


async def _generate_press_release(client_name: str, context: str) -> dict[str, str]:
    prompt = (
        f"Write a formal 250-word press release about {client_name}.\n"
        f"Context: {context}\n"
        "Formal corporate tone. Include a dateline (Pune, India), a headline, "
        "body, and a short boilerplate. Do not mention any negative content.\n"
        "Return as plain text with the headline on the first line."
    )
    text = await claude_client.complete(prompt, max_tokens=900, temperature=0.6)
    title = text.splitlines()[0].strip() if text.strip() else f"{client_name} Press Release"
    return {"title": title[:200], "text": text}


async def _generate_linkedin_posts(client_name: str, context: str) -> list[str]:
    prompt = (
        f"Write two professional first-person LinkedIn posts as {client_name} "
        f"(or their brand voice). Context: {context}\n"
        "Each post 80-120 words, thought-leadership tone, no hashtags spam "
        "(max 3 hashtags). Separate the two posts with a line containing only '---'."
    )
    text = await claude_client.complete(prompt, max_tokens=900, temperature=0.8)
    parts = [p.strip() for p in text.split("---") if p.strip()]
    return parts[:2] if parts else [text.strip()]


async def _generate_gbp_responses(client_name: str, reviews: list[dict[str, Any]]) -> list[dict[str, str]]:
    out: list[dict[str, str]] = []
    for review in reviews:
        prompt = (
            f"Write a brief, professional, empathetic Google Business Profile owner "
            f"response (under 80 words) for {client_name} to this negative review:\n"
            f"\"{review.get('snippet') or review.get('title')}\"\n"
            "Be courteous, acknowledge the concern, invite offline resolution. "
            "No defensiveness. Return only the response text."
        )
        text = await claude_client.complete(prompt, max_tokens=300, temperature=0.5)
        out.append({"review_url": review.get("url", ""), "text": text})
    return out


async def _publish_to_wordpress(title: str, html: str) -> str | None:
    base = os.environ.get("WP_API_URL")
    user = os.environ.get("WP_USERNAME")
    pw = os.environ.get("WP_APP_PASSWORD")
    if not (base and user and pw):
        print("[publisher] WordPress not configured — skipping publish.")
        return None
    url = base.rstrip("/") + WP_POSTS_PATH
    try:
        async with httpx.AsyncClient(timeout=40) as http:
            resp = await http.post(
                url,
                auth=(user, pw),
                json={"title": title, "content": html, "status": "publish"},
            )
            resp.raise_for_status()
            return resp.json().get("link")
    except Exception as exc:  # noqa: BLE001
        print(f"[publisher] WordPress publish failed: {exc}")
        return None


async def _submit_to_indexing_api(url: str) -> None:
    token = os.environ.get("GOOGLE_INDEXING_KEY")
    if not token or not url:
        return
    try:
        async with httpx.AsyncClient(timeout=30) as http:
            resp = await http.post(
                INDEXING_ENDPOINT,
                headers={"Authorization": f"Bearer {token}"},
                json={"url": url, "type": "URL_UPDATED"},
            )
            if resp.status_code >= 400:
                print(f"[publisher] Indexing API responded {resp.status_code}: {resp.text[:200]}")
    except Exception as exc:  # noqa: BLE001
        print(f"[publisher] Indexing API submit failed: {exc}")


async def run_publisher(client: dict[str, Any], threat_summary: dict[str, Any]) -> dict[str, Any]:
    """Generate and distribute suppression content for one client."""
    fields = _parse_context(client.get("context"))
    context = client.get("context") or ""
    client_name = _ctx_value(fields, "client name", "name", default=client.get("name", ""))
    tone = _ctx_value(fields, "tone", default="professional, authoritative")
    location = _ctx_value(fields, "location", default="India")
    industry = _ctx_value(fields, "industry", default="business")

    published: list[dict[str, str]] = []

    # a. SEO article
    article = await _generate_article(client_name, context, tone, location, industry)
    wp_link = await _publish_to_wordpress(article["title"], article["html"])
    if wp_link:
        await _submit_to_indexing_api(wp_link)
    db.insert_content(
        {
            "client_id": client["id"],
            "title": article["title"],
            "type": "article",
            "platform": "WordPress",
            "url": wp_link,
        }
    )
    published.append({"type": "article", "title": article["title"]})

    # b. Press release
    pr = await _generate_press_release(client_name, context)
    db.insert_content(
        {
            "client_id": client["id"],
            "title": pr["title"],
            "type": "press_release",
            "platform": "EIN Presswire",
            "url": None,
        }
    )
    published.append({"type": "press_release", "title": pr["title"]})

    # c. Two LinkedIn posts
    posts = await _generate_linkedin_posts(client_name, context)
    for i, post in enumerate(posts, start=1):
        db.insert_content(
            {
                "client_id": client["id"],
                "title": f"{client_name} — LinkedIn post {i}",
                "type": "social_post",
                "platform": "LinkedIn",
                "url": None,
            }
        )
    published.append({"type": "social_post", "count": str(len(posts))})

    # d. GBP responses for sovereign/dynasty tiers, for negative Google reviews.
    gbp_count = 0
    if client.get("tier") in ("sovereign", "dynasty"):
        negatives = [
            m
            for m in db.mentions_for_client_by_severity(
                client["id"], ["high", "critical"], status="new"
            )
            if m.get("sentiment") == "negative"
            and "google" in ((m.get("source") or "") + (m.get("url") or "")).lower()
        ]
        if negatives:
            responses = await _generate_gbp_responses(client_name, negatives)
            for r in responses:
                db.insert_content(
                    {
                        "client_id": client["id"],
                        "title": f"{client_name} — GBP response",
                        "type": "gbp_response",
                        "platform": "Google Business Profile",
                        "url": r["review_url"] or None,
                    }
                )
                gbp_count += 1

    return {
        "article": 1,
        "press_release": 1,
        "social_posts": len(posts),
        "gbp_responses": gbp_count,
        "total": 2 + len(posts) + gbp_count,
    }
