from typing import Any, Dict, List, Optional
from ..http import HttpTransport, AsyncHttpTransport


# Imbrace-specific endpoints exposed by the chat-ai service. The upstream
# OpenWebUI surface (chats, files list/upload, audio, knowledge, folders,
# prompts, tools, models) is intentionally not wrapped here: those endpoints
# require an OpenWebUI session JWT (issued only by the OpenWebUI login flow)
# and reject ``x-api-key`` / ``x-access-token`` auth.


def _sub_agent_ids(items: Any) -> Optional[List[str]]:
    """``sub_agents`` comes back as ids or ``{assistant_id, name}`` objects."""
    if not isinstance(items, list):
        return None
    ids = [x if isinstance(x, str) else ((x or {}).get("assistant_id") or (x or {}).get("id")) for x in items]
    return [i for i in ids if i]


def _with_model_defaults(body: Dict[str, Any]) -> Dict[str, Any]:
    """Default to the org's default chat model when provider/model are omitted.

    The ``"system"`` provider falls back to env-configured hosts and fails on
    orgs without them, so ``"default"`` / ``"Default"`` is used instead.
    """
    return {
        **body,
        "provider_id": body.get("provider_id") or "default",
        "model_id":    body.get("model_id")    or "Default",
    }


def _keep_fields(current: Dict[str, Any], body: Dict[str, Any]) -> Dict[str, Any]:
    """Fields the full-replace update route would otherwise drop, taken from the current agent."""
    keep = {
        "name": current.get("name"),
        "workflow_name": current.get("workflow_name"),
        "agent_type": current.get("agent_type"),
        "sub_agents": _sub_agent_ids(current.get("sub_agents")),
    }
    return {**{k: v for k, v in keep.items() if v is not None}, **body}


def _tool_servers(agent: Dict[str, Any]) -> List[Dict[str, Any]]:
    metadata = agent.get("metadata") or {}
    if metadata.get("tool_servers") is not None:
        return metadata["tool_servers"]
    return [metadata["tool_server"]] if metadata.get("tool_server") else []


class ChatAiResource:
    def __init__(self, http: HttpTransport, base: str):
        self._http = http
        self._base = base.rstrip("/")

    # --- Files (Imbrace additions on top of OpenWebUI) ---

    def upload_agent_file(self, files: Any, agent_id: str) -> Dict[str, Any]:
        """Upload an agent-specific file."""
        return self._http.request(
            "POST", f"{self._base}/files/agent", files=files, data={"agent_id": agent_id}
        ).json()

    def extract_file(self, files: Any) -> Dict[str, Any]:
        """Extract content from an uploaded file (PDF/etc)."""
        return self._http.request("POST", f"{self._base}/files/extract", files=files).json()

    # --- Document AI ---

    def process_document(
        self,
        model_name: str,
        url: str,
        organization_id: str,
        *,
        board_id: Optional[str] = None,
        language: Optional[str] = None,
        additional_instructions: Optional[str] = None,
        additional_document_instructions: Optional[str] = None,
        process_model_name: Optional[str] = None,
        file_url_to_fill: Optional[str] = None,
        tools: Optional[List[Dict[str, Any]]] = None,
        utc: Optional[int] = None,
        chunk_size: Optional[int] = None,
        max_concurrent: Optional[int] = None,
        max_retries: Optional[int] = None,
        use_enhanced_processing: Optional[bool] = None,
    ) -> Dict[str, Any]:
        """Process a document with a vision model and extract structured data."""
        body: Dict[str, Any] = {"modelName": model_name, "url": url, "organizationId": organization_id}
        if board_id is not None: body["boardId"] = board_id
        if language is not None: body["language"] = language
        if additional_instructions is not None: body["additionalInstructions"] = additional_instructions
        if additional_document_instructions is not None: body["additionalDocumentInstructions"] = additional_document_instructions
        if process_model_name is not None: body["processModelName"] = process_model_name
        if file_url_to_fill is not None: body["fileUrlToFill"] = file_url_to_fill
        if tools is not None: body["tools"] = tools
        if utc is not None: body["utc"] = utc
        if chunk_size is not None: body["chunkSize"] = chunk_size
        if max_concurrent is not None: body["maxConcurrent"] = max_concurrent
        if max_retries is not None: body["maxRetries"] = max_retries
        if use_enhanced_processing is not None: body["useEnhancedProcessing"] = use_enhanced_processing
        return self._http.request("POST", f"{self._base}/document/", json=body).json()

    def list_document_models(self) -> List[Dict[str, Any]]:
        """List LLM providers configured for the org — models available for document AI."""
        return self._http.request("GET", f"{self._base}/providers").json()

    # --- AI Agents ---

    def list_ai_agents(self) -> List[Dict[str, Any]]:
        """List all AI agents for the account."""
        return self._http.request("GET", f"{self._base}/accounts/assistants").json()

    def get_ai_agent(self, ai_agent_id: str) -> Dict[str, Any]:
        """Get AI agent by UUID."""
        return self._http.request("GET", f"{self._base}/assistants/{ai_agent_id}").json()

    def create_ai_agent(self, body: Dict[str, Any]) -> Dict[str, Any]:
        """Create a new AI agent. Required: name, workflow_name.

        provider_id/model_id default to ``"default"`` / ``"Default"`` (the org's
        default chat model) when omitted. Pass a provider UUID and that
        provider's model id to pin one.
        """
        return self._http.request("POST", f"{self._base}/assistant_apps", json=_with_model_defaults(body)).json()

    def update_ai_agent(self, ai_agent_id: str, body: Dict[str, Any]) -> Dict[str, Any]:
        """Update an AI agent. Only the fields you pass change.

        The server replaces the whole agent on this route (a missing
        ``sub_agents`` would turn a team lead back into a plain agent), so
        ``name``, ``workflow_name``, ``agent_type`` and ``sub_agents`` are filled
        from the current agent when you leave them out.
        """
        current = self.get_ai_agent(ai_agent_id)
        return self._http.request(
            "PUT", f"{self._base}/assistant_apps/{ai_agent_id}", json=_keep_fields(current, body)
        ).json()

    # --- Orchestrator (team lead + sub-agents) ---

    def create_orchestrator(self, body: Dict[str, Any]) -> Dict[str, Any]:
        """Create an orchestrator: an agent that hands questions to its sub-agents.

        ``body`` is as for :meth:`create_ai_agent` plus ``sub_agents`` (existing
        AI agent ids). Whether it may delegate at chat time depends on the org's
        plan (the "Orchestrator" feature).
        """
        return self.create_ai_agent({**body, "agent_type": "team_lead"})

    def set_sub_agents(self, ai_agent_id: str, sub_agents: List[str]) -> Dict[str, Any]:
        """Replace the sub-agents of an agent and make it a team lead."""
        return self._update_assistant(ai_agent_id, {"agent_type": "team_lead", "sub_agents": sub_agents})

    # --- Tool servers (MCP) ---

    def set_tool_servers(self, ai_agent_id: str, servers: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Replace the MCP / OpenAPI tool servers an agent can call.

        Each server: ``{enabled, url, type?, key?, path?, auth_type?, enabled_tools?}``.
        For a workflow MCP server, ``url`` is its SSE URL (contains the server's token).
        """
        current = self.get_ai_agent(ai_agent_id)
        metadata = {**(current.get("metadata") or {}), "tool_servers": servers}
        return self.update_ai_agent(ai_agent_id, {"metadata": metadata})

    def list_tool_servers(self, ai_agent_id: str) -> List[Dict[str, Any]]:
        """The tool servers configured on an agent (``metadata.tool_servers``)."""
        return _tool_servers(self.get_ai_agent(ai_agent_id))

    def _update_assistant(self, ai_agent_id: str, body: Dict[str, Any]) -> Dict[str, Any]:
        """Partial update on ``/assistants/{id}``, which keeps the fields you leave out."""
        current = self.get_ai_agent(ai_agent_id)
        return self._http.request(
            "PUT", f"{self._base}/assistants/{ai_agent_id}", json={"name": current.get("name"), **body}
        ).json()

    def delete_ai_agent(self, ai_agent_id: str) -> bool:
        """Delete AI agent by UUID."""
        r = self._http.request("DELETE", f"{self._base}/assistant_apps/{ai_agent_id}")
        return r.is_success

    def update_ai_agent_instructions(self, ai_agent_id: str, instructions: str) -> Dict[str, Any]:
        """Update only the instructions field of an AI agent."""
        return self._http.request(
            "PATCH",
            f"{self._base}/assistants/{ai_agent_id}/instructions",
            json={"instructions": instructions},
        ).json()

    def list_ai_agent_sub_agents(self) -> List[Dict[str, Any]]:
        """List sub-agents of AI agents."""
        return self._http.request("GET", f"{self._base}/assistants/agents").json()


class AsyncChatAiResource:
    def __init__(self, http: AsyncHttpTransport, base: str):
        self._http = http
        self._base = base.rstrip("/")

    # --- Files (Imbrace additions on top of OpenWebUI) ---

    async def upload_agent_file(self, files: Any, agent_id: str) -> Dict[str, Any]:
        res = await self._http.request(
            "POST", f"{self._base}/files/agent", files=files, data={"agent_id": agent_id}
        )
        return res.json()

    async def extract_file(self, files: Any) -> Dict[str, Any]:
        res = await self._http.request("POST", f"{self._base}/files/extract", files=files)
        return res.json()

    # --- Document AI ---

    async def process_document(
        self,
        model_name: str,
        url: str,
        organization_id: str,
        *,
        board_id: Optional[str] = None,
        language: Optional[str] = None,
        additional_instructions: Optional[str] = None,
        additional_document_instructions: Optional[str] = None,
        process_model_name: Optional[str] = None,
        file_url_to_fill: Optional[str] = None,
        tools: Optional[List[Dict[str, Any]]] = None,
        utc: Optional[int] = None,
        chunk_size: Optional[int] = None,
        max_concurrent: Optional[int] = None,
        max_retries: Optional[int] = None,
        use_enhanced_processing: Optional[bool] = None,
    ) -> Dict[str, Any]:
        body: Dict[str, Any] = {"modelName": model_name, "url": url, "organizationId": organization_id}
        if board_id is not None: body["boardId"] = board_id
        if language is not None: body["language"] = language
        if additional_instructions is not None: body["additionalInstructions"] = additional_instructions
        if additional_document_instructions is not None: body["additionalDocumentInstructions"] = additional_document_instructions
        if process_model_name is not None: body["processModelName"] = process_model_name
        if file_url_to_fill is not None: body["fileUrlToFill"] = file_url_to_fill
        if tools is not None: body["tools"] = tools
        if utc is not None: body["utc"] = utc
        if chunk_size is not None: body["chunkSize"] = chunk_size
        if max_concurrent is not None: body["maxConcurrent"] = max_concurrent
        if max_retries is not None: body["maxRetries"] = max_retries
        if use_enhanced_processing is not None: body["useEnhancedProcessing"] = use_enhanced_processing
        res = await self._http.request("POST", f"{self._base}/document/", json=body)
        return res.json()

    async def list_document_models(self) -> List[Dict[str, Any]]:
        res = await self._http.request("GET", f"{self._base}/providers")
        return res.json()

    # --- AI Agents ---

    async def list_ai_agents(self) -> List[Dict[str, Any]]:
        res = await self._http.request("GET", f"{self._base}/accounts/assistants")
        return res.json()

    async def get_ai_agent(self, ai_agent_id: str) -> Dict[str, Any]:
        res = await self._http.request("GET", f"{self._base}/assistants/{ai_agent_id}")
        return res.json()

    async def create_ai_agent(self, body: Dict[str, Any]) -> Dict[str, Any]:
        """Create a new AI agent; provider/model default to ``"default"`` / ``"Default"``."""
        res = await self._http.request("POST", f"{self._base}/assistant_apps", json=_with_model_defaults(body))
        return res.json()

    async def update_ai_agent(self, ai_agent_id: str, body: Dict[str, Any]) -> Dict[str, Any]:
        """Update an AI agent; see :meth:`ChatAiResource.update_ai_agent`."""
        current = await self.get_ai_agent(ai_agent_id)
        res = await self._http.request(
            "PUT", f"{self._base}/assistant_apps/{ai_agent_id}", json=_keep_fields(current, body)
        )
        return res.json()

    # --- Orchestrator (team lead + sub-agents) ---

    async def create_orchestrator(self, body: Dict[str, Any]) -> Dict[str, Any]:
        """Create an orchestrator (``agent_type="team_lead"``) with ``sub_agents``."""
        return await self.create_ai_agent({**body, "agent_type": "team_lead"})

    async def set_sub_agents(self, ai_agent_id: str, sub_agents: List[str]) -> Dict[str, Any]:
        """Replace the sub-agents of an agent and make it a team lead."""
        return await self._update_assistant(ai_agent_id, {"agent_type": "team_lead", "sub_agents": sub_agents})

    # --- Tool servers (MCP) ---

    async def set_tool_servers(self, ai_agent_id: str, servers: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Replace the MCP / OpenAPI tool servers an agent can call."""
        current = await self.get_ai_agent(ai_agent_id)
        metadata = {**(current.get("metadata") or {}), "tool_servers": servers}
        return await self.update_ai_agent(ai_agent_id, {"metadata": metadata})

    async def list_tool_servers(self, ai_agent_id: str) -> List[Dict[str, Any]]:
        """The tool servers configured on an agent (``metadata.tool_servers``)."""
        return _tool_servers(await self.get_ai_agent(ai_agent_id))

    async def _update_assistant(self, ai_agent_id: str, body: Dict[str, Any]) -> Dict[str, Any]:
        current = await self.get_ai_agent(ai_agent_id)
        res = await self._http.request(
            "PUT", f"{self._base}/assistants/{ai_agent_id}", json={"name": current.get("name"), **body}
        )
        return res.json()

    async def delete_ai_agent(self, ai_agent_id: str) -> bool:
        r = await self._http.request("DELETE", f"{self._base}/assistant_apps/{ai_agent_id}")
        return r.is_success

    async def update_ai_agent_instructions(self, ai_agent_id: str, instructions: str) -> Dict[str, Any]:
        res = await self._http.request(
            "PATCH",
            f"{self._base}/assistants/{ai_agent_id}/instructions",
            json={"instructions": instructions},
        )
        return res.json()

    async def list_ai_agent_sub_agents(self) -> List[Dict[str, Any]]:
        res = await self._http.request("GET", f"{self._base}/assistants/agents")
        return res.json()
