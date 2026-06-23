"""Settings: read masked API keys, write updates back to .env."""

from __future__ import annotations

from fastapi import APIRouter

from config import MANAGED_KEYS, get_setting, set_settings
from schemas import SettingsOut, SettingsUpdate

router = APIRouter(prefix="/settings", tags=["settings"])


def _mask(value: str) -> str:
    if not value:
        return ""
    if len(value) <= 8:
        return "•" * len(value)
    return f"{value[:4]}{'•' * 6}{value[-4:]}"


def _snapshot() -> SettingsOut:
    keys = {}
    for key, label in MANAGED_KEYS.items():
        value = get_setting(key)
        keys[key] = {
            "label": label,
            "configured": bool(value),
            "masked": _mask(value),
        }
    return SettingsOut(
        keys=keys,
        supabase_connected=bool(get_setting("SUPABASE_URL") and get_setting("SUPABASE_KEY")),
        anthropic_connected=bool(get_setting("ANTHROPIC_API_KEY")),
    )


@router.get("", response_model=SettingsOut)
def get_settings():
    return _snapshot()


@router.put("", response_model=SettingsOut)
def update_settings(payload: SettingsUpdate):
    # Only persist managed keys, and ignore blank values so the masked
    # placeholder isn't written over a real key.
    updates = {
        k: v
        for k, v in payload.values.items()
        if k in MANAGED_KEYS and v.strip()
    }
    if updates:
        set_settings(updates)
    return _snapshot()
