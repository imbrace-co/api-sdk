from __future__ import annotations
from typing import Any, Dict, List, Literal, Optional
from pydantic import BaseModel


class CompletionMessage(BaseModel):
    role: Literal["system", "user", "assistant"]
    content: str


class CompletionChoice(BaseModel):
    index: int
    message: CompletionMessage
    finish_reason: Optional[Literal["stop", "length", "tool_calls"]] = None


class CompletionUsage(BaseModel):
    prompt_tokens: int
    completion_tokens: int
    total_tokens: int


class Completion(BaseModel):
    id: str
    model: str
    choices: List[CompletionChoice]
    usage: Optional[CompletionUsage] = None
    created_at: Optional[int] = None


# --- Streaming ---

class StreamDelta(BaseModel):
    role: Optional[str] = None
    content: Optional[str] = None


class StreamChoice(BaseModel):
    index: int
    delta: StreamDelta
    finish_reason: Optional[str] = None


class StreamChunk(BaseModel):
    id: str
    model: str
    choices: List[StreamChoice]


# --- Embeddings ---

class EmbeddingData(BaseModel):
    index: int
    embedding: List[float]
    object: str = "embedding"


class Embedding(BaseModel):
    model: str
    data: List[EmbeddingData]
    usage: Optional[CompletionUsage] = None


# --- Input types ---

class CompletionInput(BaseModel):
    model: str
    messages: List[CompletionMessage]
    temperature: Optional[float] = None
    max_tokens: Optional[int] = None
    stream: bool = False
    metadata: Optional[Dict[str, Any]] = None


class EmbeddingInput(BaseModel):
    model: str
    input: List[str]
