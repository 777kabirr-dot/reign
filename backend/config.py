"""Environment-backed settings for the Reign backend.

Settings live in a single `.env` file next to this module. They are read at
import time and can be rewritten at runtime by the Settings page (see
`routers/settings.py`). Reading is intentionally lazy-friendly: callers should
use the getter functions so a key edited via the API is picked up on the next
request without a process restart.
"""

from __future__ import annotations

import os
from pathlib import Path

from dotenv import dotenv_values, load_dotenv

BASE_DIR = Path(__file__).resolve().parent
ENV_PATH = BASE_DIR / ".env"

# Load once at import so os.environ is primed; runtime edits go through
# get_setting() which re-reads the file.
load_dotenv(ENV_PATH)

# Keys the Settings page is allowed to manage, with display metadata.
MANAGED_KEYS = {
    "ANTHROPIC_API_KEY": "Anthropic API key",
    "SUPABASE_URL": "Supabase URL",
    "SUPABASE_KEY": "Supabase key",
    "MEDIUM_TOKEN": "Medium integration token",
    "MEDIUM_USER_ID": "Medium user id",
    "LINKEDIN_TOKEN": "LinkedIn access token",
    "LINKEDIN_AUTHOR_URN": "LinkedIn author URN",
}


def get_setting(key: str, default: str = "") -> str:
    """Return a setting, preferring the live .env file then the environment."""
    if ENV_PATH.exists():
        file_values = dotenv_values(ENV_PATH)
        if key in file_values and file_values[key] is not None:
            return file_values[key] or default
    return os.environ.get(key, default)


def set_settings(updates: dict[str, str]) -> None:
    """Persist a partial set of settings back to the .env file and process env."""
    current = dotenv_values(ENV_PATH) if ENV_PATH.exists() else {}
    current = {k: (v or "") for k, v in current.items()}
    for key, value in updates.items():
        current[key] = value or ""
        os.environ[key] = value or ""
    lines = [f"{k}={v}" for k, v in current.items()]
    ENV_PATH.write_text("\n".join(lines) + "\n")


def model_name() -> str:
    return get_setting("ANTHROPIC_MODEL", "claude-sonnet-4-6") or "claude-sonnet-4-6"


def cors_origins() -> list[str]:
    raw = get_setting("CORS_ORIGINS", "http://localhost:5173")
    return [o.strip() for o in raw.split(",") if o.strip()]


def port() -> int:
    try:
        return int(get_setting("PORT", "8000"))
    except ValueError:
        return 8000
