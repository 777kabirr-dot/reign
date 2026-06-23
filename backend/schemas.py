"""Pydantic request/response models and the content-type catalog."""

from __future__ import annotations

from typing import Optional

from pydantic import BaseModel, Field

# Canonical content types. Keys are stable identifiers used across the API,
# DB rows, and the frontend checkboxes.
CONTENT_TYPES = {
    "seo_article": {
        "label": "SEO Article",
        "hint": "800 words",
        "platform": "wordpress",
    },
    "press_release": {
        "label": "Press Release",
        "hint": "250 words",
        "platform": "wordpress",
    },
    "linkedin_post": {
        "label": "LinkedIn Post",
        "hint": "150 words",
        "platform": "linkedin",
    },
    "gbp_response": {
        "label": "Google Business Profile Response",
        "hint": "review reply",
        "platform": "draft",
    },
    "faq_page": {
        "label": "FAQ Page",
        "hint": 'targets "[name] review / complaint"',
        "platform": "wordpress",
    },
}

TONES = ["Professional", "Authoritative", "Warm", "Bold"]


class ClientIn(BaseModel):
    name: str
    brand: str = ""
    industry: str = ""
    tone: str = "Professional"
    keywords: str = ""
    brief: str = ""
    location: str = ""
    wp_url: str = ""
    wp_user: str = ""
    wp_pass: str = ""


class ClientOut(BaseModel):
    # Deliberately omits wp_pass — credentials are never returned. The boolean
    # `wp_configured` signals whether a password is on file instead.
    id: str
    name: str
    brand: str = ""
    industry: str = ""
    tone: str = "Professional"
    keywords: str = ""
    brief: str = ""
    location: str = ""
    wp_url: str = ""
    wp_user: str = ""
    last_generated_at: Optional[str] = None
    created_at: Optional[str] = None
    wp_configured: bool = False


class GenerateRequest(BaseModel):
    client_id: str
    content_types: list[str] = Field(default_factory=list)
    custom_angle: str = ""


class GeneratedPiece(BaseModel):
    id: Optional[str] = None
    type: str
    type_label: str
    title: str
    platform: str
    url: Optional[str] = None
    preview: str
    content_text: str
    word_count: int
    published_at: Optional[str] = None
    error: Optional[str] = None


class SettingsOut(BaseModel):
    keys: dict[str, dict]
    supabase_connected: bool
    anthropic_connected: bool


class SettingsUpdate(BaseModel):
    values: dict[str, str]
