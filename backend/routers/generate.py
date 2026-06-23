"""The core generate + publish endpoint."""

from __future__ import annotations

import logging

from fastapi import APIRouter, HTTPException

import ai
import publishers
from schemas import CONTENT_TYPES, GeneratedPiece, GenerateRequest
from store import store

router = APIRouter(tags=["generate"])
log = logging.getLogger("reign.generate")


def _preview(text: str, limit: int = 280) -> str:
    text = " ".join(text.split())
    return text if len(text) <= limit else text[:limit].rstrip() + "…"


@router.post("/generate", response_model=list[GeneratedPiece])
def generate(req: GenerateRequest):
    client = store.get_client(req.client_id)
    if not client:
        raise HTTPException(status_code=404, detail="Client not found.")

    selected = [t for t in req.content_types if t in CONTENT_TYPES]
    if not selected:
        raise HTTPException(status_code=400, detail="Select at least one content type.")

    results: list[GeneratedPiece] = []
    for content_type in selected:
        meta = CONTENT_TYPES[content_type]
        try:
            piece = ai.generate_piece(content_type, client, req.custom_angle)
        except Exception as exc:  # generation itself failed — surface it
            log.exception("Generation failed for %s", content_type)
            results.append(
                GeneratedPiece(
                    type=content_type,
                    type_label=meta["label"],
                    title=f"{meta['label']} (failed)",
                    platform="draft",
                    preview="",
                    content_text="",
                    word_count=0,
                    error=f"Generation failed: {exc}",
                )
            )
            continue

        target_platform = meta["platform"]
        url = None
        platform = target_platform
        error = None
        try:
            url = publishers.publish(
                target_platform, client, piece["title"], piece["content_text"]
            )
        except Exception as exc:
            # Publishing failed (or there's nothing to publish to) — save a draft.
            platform = "draft"
            if str(exc) != "draft":
                error = f"Publish to {target_platform} failed: {exc}"
                log.warning("Publish failed for %s: %s", content_type, exc)

        saved = store.create_content(
            {
                "client_id": req.client_id,
                "title": piece["title"],
                "type": content_type,
                "platform": platform,
                "url": url,
                "content_text": piece["content_text"],
                "word_count": piece["word_count"],
            }
        )
        results.append(
            GeneratedPiece(
                id=saved.get("id"),
                type=content_type,
                type_label=meta["label"],
                title=piece["title"],
                platform=platform,
                url=url,
                preview=_preview(piece["content_text"]),
                content_text=piece["content_text"],
                word_count=piece["word_count"],
                published_at=saved.get("published_at"),
                error=error,
            )
        )

    store.touch_client(req.client_id)
    return results
