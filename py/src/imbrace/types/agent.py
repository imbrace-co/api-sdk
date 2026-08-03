from __future__ import annotations
from typing import Any, Dict, List, Literal, Optional
from pydantic import BaseModel


AgentStatus = Literal["idle", "running", "paused", "completed", "failed", "cancelled"]


class AgentCapability(BaseModel):
    name: str
    description: Optional[str] = None
    parameters: Optional[Dict[str, Any]] = None


class Agent(BaseModel):
    id: str
    name: str
    description: Optional[str] = None
    model: Optional[str] = None
    system_prompt: Optional[str] = None
    capabilities: List[AgentCapability] = []
    tools: List[str] = []
    is_active: bool = True
    organization_id: Optional[str] = None
    created_by: Optional[str] = None
    created_at: Optional[str] = None
    updated_at: Optional[str] = None


class AgentRun(BaseModel):
    id: str
    agent_id: str
    session_id: Optional[str] = None
    status: AgentStatus = "idle"
    input: Optional[Dict[str, Any]] = None
    output: Optional[Dict[str, Any]] = None
    error: Optional[str] = None
    started_at: Optional[str] = None
    completed_at: Optional[str] = None
    duration_ms: Optional[int] = None
    metadata: Optional[Dict[str, Any]] = None
