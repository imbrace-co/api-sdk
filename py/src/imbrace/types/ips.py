from __future__ import annotations
from typing import Any, Dict, List, Optional
from pydantic import BaseModel


class SocialLink(BaseModel):
    platform: str
    url: str


class IpsProfile(BaseModel):
    id: str
    user_id: str
    display_name: Optional[str] = None
    bio: Optional[str] = None
    avatar_url: Optional[str] = None
    cover_url: Optional[str] = None
    social_links: List[SocialLink] = []
    skills: List[str] = []
    location: Optional[str] = None
    website: Optional[str] = None
    is_public: bool = True
    followers_count: int = 0
    following_count: int = 0
    metadata: Optional[Dict[str, Any]] = None
    created_at: Optional[str] = None
    updated_at: Optional[str] = None


class Identity(BaseModel):
    id: str
    user_id: str
    provider: str  # "google", "github", "facebook", etc.
    provider_user_id: str
    email: Optional[str] = None
    access_token: Optional[str] = None
    refresh_token: Optional[str] = None
    expires_at: Optional[str] = None
    created_at: Optional[str] = None
