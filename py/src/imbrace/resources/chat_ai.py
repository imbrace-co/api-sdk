from typing import Any, Dict, List, Optional
from ..http import HttpTransport, AsyncHttpTransport


# Imbrace-specific endpoints exposed by the chat-ai service. The upstream
# OpenWebUI surface (chats, files list/upload, audio, knowledge, folders,
# prompts, tools, models) is intentionally not wrapped here: those endpoints
# require an OpenWebUI session JWT (issued only by the OpenWebUI login flow)
# and reject ``x-api-key`` / ``x-access-token`` auth.


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

        provider_id/model_id auto-default to {"system", "Default"} when omitted.
        "Default" routes to whatever the org has configured as its system default
        model. A literal name like "gpt-4o" is brittle because not every org's
        system provider exposes it (e.g. orgs wired to a Bedrock-only provider).
        """
        wire = {
            **body,
            "provider_id": body.get("provider_id") or "system",
            "model_id":    body.get("model_id")    or "Default",
        }
        return self._http.request("POST", f"{self._base}/assistant_apps", json=wire).json()

    def update_ai_agent(self, ai_agent_id: str, body: Dict[str, Any]) -> Dict[str, Any]:
        """Update AI agent by UUID."""
        return self._http.request("PUT", f"{self._base}/assistant_apps/{ai_agent_id}", json=body).json()

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
        wire = {
            **body,
            "provider_id": body.get("provider_id") or "system",
            "model_id":    body.get("model_id")    or "Default",
        }
        res = await self._http.request("POST", f"{self._base}/assistant_apps", json=wire)
        return res.json()

    async def update_ai_agent(self, ai_agent_id: str, body: Dict[str, Any]) -> Dict[str, Any]:
        res = await self._http.request("PUT", f"{self._base}/assistant_apps/{ai_agent_id}", json=body)
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
