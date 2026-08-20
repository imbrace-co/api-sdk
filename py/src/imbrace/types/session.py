from __future__ import annotations
from typing import Any, Dict, List, Literal, Optional, Union
from pydantic import BaseModel


class TextPart(BaseModel):
    id: Optional[str] = None
    type: Literal["text"] = "text"
    text: str
    session_id: Optional[str] = None
    message_id: Optional[str] = None


class FilePart(BaseModel):
    id: Optional[str] = None
    type: Literal["file"] = "file"
    mime: str
    url: str
    session_id: Optional[str] = None
    message_id: Optional[str] = None


Part = Union[TextPart, FilePart]


class MessageTime(BaseModel):
    created: int
    completed: Optional[int] = None


class Message(BaseModel):
    id: str
    session_id: str
    role: Literal["user", "assistant"]
    time: MessageTime
    parts: List[Part] = []
    metadata: Optional[Dict[str, Any]] = None


class Session(BaseModel):
    id: str
    title: Optional[str] = None
    directory: Optional[str] = None
    workspace: Optional[str] = None
    created_at: Optional[int] = None
    updated_at: Optional[int] = None
    parent_id: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None
