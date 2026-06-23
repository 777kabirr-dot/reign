"""Claude-backed content generation.

Each content type has a system prompt (the persona/rules) and a user prompt
built from the client's brief. We call the Messages API once per piece. Model
is `claude-sonnet-4-6` by default (configurable via ANTHROPIC_MODEL).
"""

from __future__ import annotations

import re

import anthropic

from config import get_setting, model_name

WRITER_SYSTEM = (
    "You are an expert content writer specializing in reputation management and "
    "personal branding. You write clean, publication-ready copy and never include "
    "preambles, meta-commentary, or notes to the editor."
)


def _client() -> anthropic.Anthropic:
    key = get_setting("ANTHROPIC_API_KEY")
    if not key:
        raise RuntimeError("ANTHROPIC_API_KEY is not configured. Add it in Settings.")
    return anthropic.Anthropic(api_key=key)


def _fields(client: dict) -> dict:
    return {
        "name": client.get("name", ""),
        "brand": client.get("brand") or client.get("name", ""),
        "industry": client.get("industry", "") or "their field",
        "tone": client.get("tone", "Professional"),
        "keywords": client.get("keywords", ""),
        "brief": client.get("brief", "") or "No additional context provided.",
        "location": client.get("location", ""),
    }


def _angle(custom_angle: str) -> str:
    return f"\nFocus this piece on: {custom_angle}\n" if custom_angle.strip() else ""


def _prompt(content_type: str, client: dict, custom_angle: str) -> str:
    f = _fields(client)
    angle = _angle(custom_angle)

    if content_type == "seo_article":
        return (
            f"Write an 800-word SEO-optimized article about {f['name']}.\n"
            f"Client context: {f['brief']}\n"
            f"Industry: {f['industry']}\n"
            f"Tone: {f['tone']}\n"
            f"Target keywords to use naturally: {f['keywords']}, {f['name']} {f['location']}\n"
            "Structure: Compelling H1 title, 4 H2 sections, strong conclusion.\n"
            "Style: Third-party journalistic profile. Authoritative. No fluff.\n"
            "Focus on: achievements, expertise, community impact, future vision.\n"
            "DO NOT: mention any controversies, use superlatives, sound promotional.\n"
            f"{angle}"
            "Output: Just the article in Markdown (use # for the H1 and ## for H2s). No preamble."
        )

    if content_type == "press_release":
        return (
            f"Write a professional 250-word press release about {f['name']} / {f['brand']}.\n"
            f"Context: {f['brief']}\n"
            "Format: Standard AP style press release with headline, dateline, body, "
            "boilerplate, and a contact placeholder.\n"
            "Angle: Position as industry leader / community contributor.\n"
            "Tone: Formal, newsworthy.\n"
            f"{angle}"
            "Output: Just the press release. Put the headline on the first line as a Markdown # H1. No preamble."
        )

    if content_type == "linkedin_post":
        return (
            f"Write a 150-word LinkedIn post from the perspective of {f['name']}.\n"
            f"Context about them: {f['brief']}\n"
            f"Tone: {f['tone']}\n"
            "Make it feel genuine, not promotional. Share an insight or experience.\n"
            "End with a subtle call to conversation, not a sales pitch.\n"
            "No hashtag spam. Maximum 2 relevant hashtags.\n"
            f"{angle}"
            "Output: Just the post text. No preamble, no title."
        )

    if content_type == "gbp_response":
        return (
            f"Write three short, professional Google Business Profile review responses for "
            f"{f['brand'] or f['name']} ({f['industry']}).\n"
            f"Context: {f['brief']}\n"
            f"Tone: {f['tone']}, gracious, and human.\n"
            "Cover one positive review reply, one neutral review reply, and one critical "
            "review reply. Each reply: 2-4 sentences, thanks the reviewer, reinforces a "
            "positive aspect of the business, and invites further contact. Never be defensive.\n"
            f"{angle}"
            "Output: Label each as 'Positive review reply:', 'Neutral review reply:', and "
            "'Critical review reply:' followed by the reply. No preamble."
        )

    if content_type == "faq_page":
        return (
            f"Write an FAQ page targeting people searching '{f['name']} review', "
            f"'{f['name']} complaint', '{f['name']} scam'.\n"
            f"Client context: {f['brief']}\n"
            "Generate 8 questions and detailed honest answers that address common concerns.\n"
            "Tone: Transparent, confident, factual.\n"
            "Format: Q: / A: pairs.\n"
            "Purpose: Rank on Google for these searches and redirect visitors to a positive framing.\n"
            f"{angle}"
            f"Output: Start with a Markdown # H1 like 'Frequently Asked Questions About {f['name']}', "
            "then the Q: / A: pairs. No preamble."
        )

    raise ValueError(f"Unknown content type: {content_type}")


def _extract_title(content_type: str, text: str, client: dict) -> str:
    name = client.get("name", "Client")
    # Prefer a Markdown H1.
    for line in text.splitlines():
        line = line.strip()
        if line.startswith("# "):
            return line.lstrip("#").strip()
    # Otherwise fall back to the first non-empty line, trimmed.
    for line in text.splitlines():
        if line.strip():
            return line.strip()[:120]
    defaults = {
        "linkedin_post": f"LinkedIn update from {name}",
        "gbp_response": f"Review responses for {name}",
        "press_release": f"Press release: {name}",
        "faq_page": f"FAQ about {name}",
        "seo_article": f"Profile: {name}",
    }
    return defaults.get(content_type, name)


def word_count(text: str) -> int:
    return len(re.findall(r"\b\w+\b", text))


def generate_piece(content_type: str, client: dict, custom_angle: str = "") -> dict:
    """Generate one piece. Returns a dict with title/content_text/word_count."""
    prompt = _prompt(content_type, client, custom_angle)
    # 800-word article fits comfortably under the non-streaming timeout.
    max_tokens = 3500 if content_type in ("seo_article", "faq_page") else 1200

    resp = _client().messages.create(
        model=model_name(),
        max_tokens=max_tokens,
        system=WRITER_SYSTEM,
        messages=[{"role": "user", "content": prompt}],
    )
    text = "".join(block.text for block in resp.content if block.type == "text").strip()
    title = _extract_title(content_type, text, client)
    return {
        "title": title,
        "content_text": text,
        "word_count": word_count(text),
    }
