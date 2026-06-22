"""
Anthropic / Claude API wrapper for Reign OS.

All AI operations in Reign OS funnel through here so model id, retries and
JSON parsing live in one place. Uses the async Anthropic client so agents can
run concurrently under asyncio.gather.
"""
from __future__ import annotations

import json
import os
import re
from typing import Any, Optional

from anthropic import AsyncAnthropic

# Per spec — all AI operations use this model.
MODEL = "claude-sonnet-4-6"

_client: Optional[AsyncAnthropic] = None


def get_async_client() -> AsyncAnthropic:
    global _client
    if _client is None:
        key = os.environ.get("ANTHROPIC_API_KEY")
        if not key:
            raise RuntimeError("ANTHROPIC_API_KEY must be set in the environment.")
        _client = AsyncAnthropic(api_key=key)
    return _client


async def complete(
    prompt: str,
    system: Optional[str] = None,
    max_tokens: int = 2048,
    temperature: float = 0.7,
) -> str:
    """Send a single user prompt to Claude and return the text response."""
    client = get_async_client()
    kwargs: dict[str, Any] = {
        "model": MODEL,
        "max_tokens": max_tokens,
        "temperature": temperature,
        "messages": [{"role": "user", "content": prompt}],
    }
    if system:
        kwargs["system"] = system

    resp = await client.messages.create(**kwargs)
    parts = [block.text for block in resp.content if getattr(block, "type", None) == "text"]
    return "".join(parts).strip()


def _extract_json(text: str) -> str:
    """Pull the first JSON object out of a model response, tolerating fences."""
    fenced = re.search(r"```(?:json)?\s*(\{.*?\})\s*```", text, re.DOTALL)
    if fenced:
        return fenced.group(1)
    brace = re.search(r"\{.*\}", text, re.DOTALL)
    if brace:
        return brace.group(0)
    return text


async def complete_json(
    prompt: str,
    system: Optional[str] = None,
    max_tokens: int = 1024,
    temperature: float = 0.2,
) -> dict[str, Any]:
    """Like complete(), but parse the response as a JSON object.

    Returns {} if the response cannot be parsed (callers treat that as a
    soft failure and fall back to safe defaults).
    """
    raw = await complete(prompt, system=system, max_tokens=max_tokens, temperature=temperature)
    try:
        return json.loads(_extract_json(raw))
    except (json.JSONDecodeError, ValueError):
        return {}
