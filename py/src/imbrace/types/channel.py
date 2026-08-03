from __future__ import annotations
from typing import Any, Dict, List, Literal, Optional
from pydantic import BaseModel


ChannelType = Literal["direct", "group", "broadcast", "support"]


class Channel(BaseModel):
    id: str
    name: Optional[str] = None
    type: ChannelType = "direct"
    description: Optional[str] = None
    avatar_url: Optional[str] = None
    participant_ids: List[str] = []
    is_active: bool = True
    metadata: Optional[Dict[str, Any]] = None
    created_at: Optional[str] = None
    updated_at: Optional[str] = None


class Conversation(BaseModel):
    id: str
    channel_id: str
    title: Optional[str] = None
    participant_ids: List[str] = []
    last_message_at: Optional[str] = None
    unread_count: int = 0
    created_at: Optional[str] = None
    updated_at: Optional[str] = None


class ChannelMessage(BaseModel):
    id: str
    conversation_id: str
    channel_id: str
    sender_id: str
    content: str
    type: Literal["text", "image", "file", "system"] = "text"
    attachments: List[Dict[str, Any]] = []
    read_by: List[str] = []
    created_at: Optional[str] = None
    updated_at: Optional[str] = None
