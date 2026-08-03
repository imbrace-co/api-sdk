from __future__ import annotations
from typing import Any, Dict, List, Literal, Optional
from pydantic import BaseModel, EmailStr


class User(BaseModel):
    id: str
    email: Optional[str] = None
    username: Optional[str] = None
    display_name: Optional[str] = None
    avatar_url: Optional[str] = None
    role: Optional[str] = None
    is_active: bool = True
    organization_id: Optional[str] = None
    created_at: Optional[str] = None
    updated_at: Optional[str] = None


class Organization(BaseModel):
    id: str
    name: str
    slug: Optional[str] = None
    description: Optional[str] = None
    logo_url: Optional[str] = None
    owner_id: Optional[str] = None
    plan: Optional[str] = None
    is_active: bool = True
    metadata: Optional[Dict[str, Any]] = None
    created_at: Optional[str] = None
    updated_at: Optional[str] = None


class Permission(BaseModel):
    id: str
    user_id: str
    resource: str
    action: Literal["read", "write", "delete", "admin"]
    granted: bool = True
    created_at: Optional[str] = None
