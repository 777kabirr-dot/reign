"""
ADVOCATE — legal draft generation agent.

╔══════════════════════════════════════════════════════════════════════╗
║  CRITICAL RULE — DO NOT VIOLATE                                       ║
║                                                                      ║
║  This agent ONLY creates draft records in legal_drafts with          ║
║  status='pending'. It NEVER sends emails. It NEVER makes HTTP calls   ║
║  to any external service. The only side effects permitted are:       ║
║    - reading mentions from Supabase                                   ║
║    - calling Claude to draft text                                     ║
║    - inserting pending drafts into Supabase                          ║
║                                                                      ║
║  A human (Neel) reviews and sends every draft manually from the      ║
║  dashboard. Auto-sending is a critical system error.                 ║
╚══════════════════════════════════════════════════════════════════════╝
"""
from __future__ import annotations

from typing import Any

from agents.sentinel import _parse_context
from database import client as db
from utils import claude_client

VALID_TYPES = {"takedown", "cease_desist", "platform_report", "dmca"}


def _determine_action_type(mention: dict[str, Any]) -> str:
    """Pick an appropriate legal action type from the mention's characteristics."""
    haystack = " ".join(
        str(mention.get(k, "")) for k in ("url", "source", "title", "snippet")
    ).lower()

    # Copyright/image misuse → DMCA.
    if any(w in haystack for w in ("copyright", "photo", "image", "stolen", "infring")):
        return "dmca"
    # Platform-hosted UGC (reviews/social) → platform report.
    if any(
        p in haystack
        for p in ("google", "facebook", "instagram", "twitter", "x.com", "youtube", "glassdoor", "reddit")
    ):
        return "platform_report"
    # Defamatory/threatening content → cease & desist.
    if any(w in haystack for w in ("defam", "false", "fraud", "scam", "lie")):
        return "cease_desist"
    return "takedown"


async def _draft_text(client_name: str, mention: dict[str, Any], action_type: str) -> str:
    pretty = action_type.replace("_", " ")
    prompt = (
        "You are a legal professional drafting a formal communication on behalf of a "
        "reputation management firm in India.\n"
        f"Client: {client_name}\n"
        f"Threat: {mention.get('url','')} — {mention.get('snippet','')}\n"
        f"Action required: {action_type}\n"
        f"Draft a professional {pretty}.\n"
        "Include: sender (Reign, Pune), recipient placeholder, specific URL to be removed, "
        "legal basis under Indian IT Act 2000 / Information Technology Rules 2011, and a "
        "7-day response deadline.\n"
        "Tone: Firm, professional, legally precise. No threats or inflammatory language."
    )
    return await claude_client.complete(prompt, max_tokens=1400, temperature=0.3)


async def run_advocate(client: dict[str, Any]) -> dict[str, Any]:
    """Draft pending legal communications for high/critical, new mentions.

    Creates ONLY pending draft records. Performs no sending of any kind.
    """
    fields = _parse_context(client.get("context"))
    client_name = fields.get("client name") or fields.get("name") or client.get("name", "")

    mentions = db.mentions_for_client_by_severity(
        client["id"], ["high", "critical"], status="new"
    )

    drafts_created = 0
    for mention in mentions:
        action_type = _determine_action_type(mention)
        if action_type not in VALID_TYPES:
            action_type = "takedown"
        text = await _draft_text(client_name, mention, action_type)

        # The ONLY external side effect: insert a pending draft. No send.
        db.insert_legal_draft(
            {
                "client_id": client["id"],
                "mention_id": mention["id"],
                "type": action_type,
                "draft_text": text,
                "status": "pending",
            }
        )
        # Flag the mention so it isn't re-drafted on the next run.
        db.update_mention_status(mention["id"], "flagged")
        drafts_created += 1

    return {"drafts_created": drafts_created}
