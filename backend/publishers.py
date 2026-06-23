"""Platform publishing.

Each function attempts to publish and returns a live URL on success. On any
failure the caller falls back to saving the piece as a draft (see
routers/generate.py). Markdown is converted to lightweight HTML for platforms
that expect HTML bodies (WordPress, Medium).
"""

from __future__ import annotations

import re

import httpx

from config import get_setting


def markdown_to_html(text: str) -> str:
    """Minimal Markdown -> HTML good enough for blog bodies."""
    html_blocks: list[str] = []
    for block in re.split(r"\n\s*\n", text.strip()):
        block = block.strip()
        if not block:
            continue
        if block.startswith("### "):
            html_blocks.append(f"<h3>{block[4:].strip()}</h3>")
        elif block.startswith("## "):
            html_blocks.append(f"<h2>{block[3:].strip()}</h2>")
        elif block.startswith("# "):
            html_blocks.append(f"<h1>{block[2:].strip()}</h1>")
        else:
            # Bold + inline, then wrap as a paragraph with <br> for soft lines.
            inline = re.sub(r"\*\*(.+?)\*\*", r"<strong>\1</strong>", block)
            inline = inline.replace("\n", "<br/>")
            html_blocks.append(f"<p>{inline}</p>")
    return "\n".join(html_blocks)


def publish_wordpress(client: dict, title: str, content_md: str) -> str:
    wp_url = (client.get("wp_url") or "").rstrip("/")
    wp_user = client.get("wp_user") or ""
    wp_pass = client.get("wp_pass") or ""
    if not (wp_url and wp_user and wp_pass):
        raise RuntimeError("WordPress credentials are not configured for this client.")

    endpoint = f"{wp_url}/wp-json/wp/v2/posts"
    resp = httpx.post(
        endpoint,
        auth=(wp_user, wp_pass),
        json={
            "title": title,
            "content": markdown_to_html(content_md),
            "status": "publish",
        },
        timeout=30.0,
    )
    resp.raise_for_status()
    data = resp.json()
    return data.get("link") or f"{wp_url}/?p={data.get('id', '')}"


def publish_medium(title: str, content_md: str) -> str:
    token = get_setting("MEDIUM_TOKEN")
    user_id = get_setting("MEDIUM_USER_ID")
    if not (token and user_id):
        raise RuntimeError("Medium is not configured.")
    endpoint = f"https://api.medium.com/v1/users/{user_id}/posts"
    resp = httpx.post(
        endpoint,
        headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json"},
        json={
            "title": title,
            "contentFormat": "markdown",
            "content": content_md,
            "publishStatus": "public",
        },
        timeout=30.0,
    )
    resp.raise_for_status()
    return resp.json().get("data", {}).get("url", "")


def publish_linkedin(content_text: str) -> str:
    token = get_setting("LINKEDIN_TOKEN")
    author = get_setting("LINKEDIN_AUTHOR_URN")
    if not (token and author):
        raise RuntimeError("LinkedIn is not configured.")
    endpoint = "https://api.linkedin.com/v2/ugcPosts"
    body = {
        "author": author,
        "lifecycleState": "PUBLISHED",
        "specificContent": {
            "com.linkedin.ugc.ShareContent": {
                "shareCommentary": {"text": content_text},
                "shareMediaCategory": "NONE",
            }
        },
        "visibility": {"com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC"},
    }
    resp = httpx.post(
        endpoint,
        headers={
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json",
            "X-Restli-Protocol-Version": "2.0.0",
        },
        json=body,
        timeout=30.0,
    )
    resp.raise_for_status()
    post_id = resp.headers.get("x-restli-id") or resp.json().get("id", "")
    return f"https://www.linkedin.com/feed/update/{post_id}" if post_id else ""


def publish(platform: str, client: dict, title: str, content_md: str) -> str:
    """Dispatch to the right platform. Raises on failure; caller saves a draft."""
    if platform == "wordpress":
        return publish_wordpress(client, title, content_md)
    if platform == "medium":
        return publish_medium(title, content_md)
    if platform == "linkedin":
        return publish_linkedin(content_md)
    # 'draft' (e.g. Google Business Profile responses) — nothing to publish to.
    raise RuntimeError("draft")
