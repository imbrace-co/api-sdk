from typing import Any, AsyncIterator, Dict, Iterator, List, Optional, Union, cast
import json
from typing_extensions import TypedDict
from ..http import HttpTransport, AsyncHttpTransport
from ..types.ai import Completion, StreamChunk, Embedding, CompletionInput, EmbeddingInput


class AiAgent(TypedDict, total=False):
    _id: str
    name: str
    description: Optional[str]
    instructions: Optional[str]
    model: Optional[str]
    mode: Optional[str]
    model_id: Optional[str]
    provider_id: Optional[str]
    show_thinking_process: Optional[bool]
    streaming: Optional[bool]
    channel: Optional[str]
    channel_id: Optional[str]
    teams: Optional[Union[str, List[str]]]
    categories: Optional[List[int]]
    guardrail_id: Optional[str]
    personality_and_role: Optional[str]
    core_task: Optional[str]
    agent_type: Optional[str]
    sub_agents: Optional[List[Any]]
    team_leads: Optional[List[Any]]
    is_orchestrator: Optional[bool]
    preload_information: Optional[str]
    tone_and_style: Optional[str]
    response_length: Optional[str]
    list_of_banned_words: Optional[str]
    files: Optional[Any]
    selected_board_id: Optional[str]
    folder_ids: Optional[List[str]]
    default_folder_id: Optional[List[str]]
    board_ids: Optional[List[str]]
    knowledge_hubs: Optional[List[str]]
    workflow_functions: Optional[List[Any]]
    temperature: Optional[float]
    use_memory: Optional[bool]
    tool_server: Optional[Any]
    enable_echart: Optional[bool]
    top_k_relevant_results: Optional[int]
    top_k: Optional[int]
    created_at: Optional[str]
    updated_at: Optional[str]


class AiAgentListResponse(TypedDict, total=False):
    data: List[AiAgent]
    total: Optional[int]


class AiAgentNameCheckResponse(TypedDict):
    available: bool
    name: str


class PatchInstructionsInput(TypedDict, total=False):
    instructions: str


class AiAgentApp(TypedDict, total=False):
    _id: str
    name: str
    assistant_id: Optional[str]
    mode: Optional[str]
    model_id: Optional[str]
    provider_id: Optional[str]
    instructions: Optional[str]
    agent_type: Optional[str]
    workflow: Optional[Dict[str, Any]]
    created_at: Optional[str]
    updated_at: Optional[str]


class AiAgentAppListResponse(TypedDict, total=False):
    data: List[AiAgentApp]
    total: Optional[int]


class CreateAiAgentAppInput(TypedDict, total=False):
    name: str
    workflow_name: str
    assistant_id: str
    mode: Optional[str]
    model_id: Optional[str]
    provider_id: Optional[str]
    instructions: Optional[str]
    agent_type: Optional[str]


class UpdateAiAgentAppInput(TypedDict, total=False):
    name: str
    mode: Optional[str]
    model_id: Optional[str]
    provider_id: Optional[str]
    instructions: Optional[str]
    agent_type: Optional[str]


class UpdateAiAgentWorkflowInput(TypedDict, total=False):
    workflow: Dict[str, Any]


class RagFile(TypedDict, total=False):
    _id: str
    name: str
    size: Optional[int]
    status: Optional[str]
    created_at: Optional[str]


class RagFileListResponse(TypedDict, total=False):
    data: List[RagFile]
    total: Optional[int]


class Guardrail(TypedDict, total=False):
    _id: str
    name: str
    type: Optional[str]
    config: Optional[Dict[str, Any]]
    created_at: Optional[str]
    updated_at: Optional[str]


class GuardrailListResponse(TypedDict, total=False):
    data: List[Guardrail]
    total: Optional[int]


class CreateGuardrailInput(TypedDict, total=False):
    name: str
    model: str
    instructions: str
    unsafe_categories: Optional[List[str]]
    custom_unsafe_patterns: Optional[List[str]]
    competitor_keywords: Optional[List[str]]
    description: Optional[str]
    guardrail_provider_id: Optional[str]


class UpdateGuardrailInput(TypedDict, total=False):
    name: str
    model: str
    instructions: str
    unsafe_categories: Optional[List[str]]
    custom_unsafe_patterns: Optional[List[str]]
    competitor_keywords: Optional[List[str]]
    description: Optional[str]
    guardrail_provider_id: Optional[str]


class GuardrailProvider(TypedDict, total=False):
    _id: str
    name: str
    type: Optional[str]
    config: Optional[Dict[str, Any]]
    created_at: Optional[str]
    updated_at: Optional[str]


class GuardrailProviderListResponse(TypedDict, total=False):
    data: List[GuardrailProvider]
    total: Optional[int]


class CreateGuardrailProviderInput(TypedDict, total=False):
    name: str
    type: str
    config: Dict[str, Any]


class UpdateGuardrailProviderInput(TypedDict, total=False):
    name: str
    config: Dict[str, Any]


class TestGuardrailProviderInput(TypedDict, total=False):
    prompt: str


class GuardrailProviderTestResponse(TypedDict, total=False):
    success: bool
    result: Optional[Dict[str, Any]]


class GuardrailProviderModelsResponse(TypedDict, total=False):
    models: List[Dict[str, Any]]


class AiProviderModel(TypedDict, total=False):
    name: str
    provider: Optional[str]
    is_toolCall_available: Optional[bool]
    is_vision_available: Optional[bool]
    is_support_thinking: Optional[bool]
    is_shown: Optional[bool]


class AiProvider(TypedDict, total=False):
    _id: str
    id: Optional[str]
    provider_id: Optional[str]
    name: str
    type: Optional[str]
    config: Optional[Dict[str, Any]]
    metadata: Optional[Dict[str, Any]]
    source: Optional[str]
    is_shown: Optional[bool]
    models: Optional[List[AiProviderModel]]
    organization_id: Optional[str]
    api_key: Optional[str]
    base_url: Optional[str]
    created_at: Optional[str]
    updated_at: Optional[str]


# Legacy wrapped shape — some endpoints may return {data, total}.
# `GET /v3/ai/providers` returns a raw List[AiProvider].
class AiProviderListResponse(TypedDict, total=False):
    data: List[AiProvider]
    total: Optional[int]


class CreateAiProviderInput(TypedDict, total=False):
    name: str
    type: str
    api_key: str
    base_url: str


class UpdateAiProviderInput(TypedDict, total=False):
    name: str
    api_key: str
    base_url: str


class WorkflowAgentModel(TypedDict, total=False):
    name: str
    is_toolCall_available: Optional[bool]
    is_vision_available: Optional[bool]
    is_support_thinking: Optional[bool]


class WorkflowAgentModelsResponse(TypedDict, total=False):
    success: bool
    message: Optional[str]
    data: List[WorkflowAgentModel]


# Legacy alias kept for backward compat.
class LlmModelsResponse(TypedDict, total=False):
    models: List[Dict[str, Any]]


class VerifyToolServerInput(TypedDict, total=False):
    url: str


class VerifyToolServerResponse(TypedDict, total=False):
    success: bool
    tools: Optional[List[Dict[str, Any]]]


class AiResource:
    """AI domain — Sync. Completions, embeddings, AI agents, RAG, guardrails."""

    def __init__(self, http: HttpTransport, base: str):
        self._http = http
        self._base = base.rstrip("/")

    @property
    def _v2(self) -> str:
        return f"{self._base.rstrip('/')}/v2/ai"

    @property
    def _v3(self) -> str:
        return f"{self._base.rstrip('/')}/v3/ai"

    @property
    def _ai_agent_base(self) -> str:
        return self._v3

    # --- Completions / Embeddings ---
    def complete(self, input: CompletionInput) -> Completion:
        """Create chat completion."""
        body = {**input.model_dump(exclude_none=True), "stream": False}
        res = self._http.request("POST", f"{self._v3}/completions", json=body).json()
        if "data" in res and "success" in res:
            return Completion(**res["data"])
        return Completion(**res)

    def stream(self, input: CompletionInput) -> Iterator[StreamChunk]:
        """Stream chat completion."""
        import httpx
        body = {**input.model_dump(exclude_none=True), "stream": True}

        headers: Dict[str, str] = {"Content-Type": "application/json", "Accept": "text/event-stream"}
        if self._http.api_key:
            headers["X-Api-Key"] = self._http.api_key
        token = self._http.token_manager.get_token()
        if token:
            headers["Authorization"] = f"Bearer {token}"

        with httpx.Client(timeout=None) as client:
            with client.stream("POST", f"{self._v3}/completions", json=body, headers=headers) as res:
                for line in res.iter_lines():
                    if line.startswith("data: "):
                        data = line[6:]
                        if data == "[DONE]":
                            break
                        try:
                            chunk_data = json.loads(data)
                            yield StreamChunk(**chunk_data)
                        except json.JSONDecodeError:
                            continue

    def embed(self, input: EmbeddingInput) -> Embedding:
        """Create embeddings."""
        res = self._http.request("POST", f"{self._v3}/embeddings", json=input.model_dump()).json()
        if "data" in res and "success" in res:
            return Embedding(**res["data"])
        return Embedding(**res)

    # --- AiAgents ---
    def list_ai_agents(self) -> AiAgentListResponse:
        return self._http.request("GET", f"{self._ai_agent_base}/accounts/assistants").json()

    def get_ai_agent(self, ai_agent_id: str) -> AiAgent:
        return self._http.request("GET", f"{self._ai_agent_base}/assistants/{ai_agent_id}").json()

    def check_ai_agent_name(self, name: str) -> AiAgentNameCheckResponse:
        return self._http.request("GET", f"{self._ai_agent_base}/assistants/check-name", params={"name": name}).json()

    def list_agents(self) -> AiAgentListResponse:
        return self._http.request("GET", f"{self._ai_agent_base}/assistants/agents").json()

    def patch_instructions(self, ai_agent_id: str, body: PatchInstructionsInput) -> AiAgent:
        return self._http.request("PATCH", f"{self._ai_agent_base}/assistants/{ai_agent_id}/instructions", json=body).json()

    # --- AiAgent Apps ---
    def list_ai_agent_apps(self) -> AiAgentAppListResponse:
        return self._http.request("GET", f"{self._ai_agent_base}/assistant_apps").json()

    def get_ai_agent_app(self, ai_agent_id: str) -> AiAgentApp:
        return self._http.request("GET", f"{self._ai_agent_base}/assistant_apps/{ai_agent_id}").json()

    def create_ai_agent_app(self, body: CreateAiAgentAppInput) -> AiAgentApp:
        return self._http.request("POST", f"{self._ai_agent_base}/assistant_apps", json=body).json()

    def update_ai_agent_app(self, ai_agent_id: str, body: UpdateAiAgentAppInput) -> AiAgentApp:
        return self._http.request("PUT", f"{self._ai_agent_base}/assistant_apps/{ai_agent_id}", json=body).json()

    def delete_ai_agent_app(self, ai_agent_id: str) -> None:
        self._http.request("DELETE", f"{self._ai_agent_base}/assistant_apps/{ai_agent_id}")

    def update_ai_agent_workflow(self, ai_agent_id: str, body: UpdateAiAgentWorkflowInput) -> AiAgentApp:
        return self._http.request("PUT", f"{self._ai_agent_base}/assistant_apps/{ai_agent_id}/workflow", json=body).json()

    # --- RAG Files ---
    def list_rag_files(self) -> RagFileListResponse:
        return self._http.request("GET", f"{self._v3}/rag/files").json()

    def get_rag_file(self, file_id: str) -> RagFile:
        return self._http.request("GET", f"{self._v3}/rag/files/{file_id}").json()

    def upload_rag_file(self, files: Any) -> RagFile:
        return self._http.request("POST", f"{self._v3}/rag/files", files=files).json()

    def delete_rag_file(self, file_id: str) -> None:
        self._http.request("DELETE", f"{self._v3}/rag/files/{file_id}")

    # --- Guardrails ---
    def list_guardrails(self) -> GuardrailListResponse:
        return self._http.request("GET", f"{self._v3}/guardrail/all").json()

    def get_guardrail(self, guardrail_id: str) -> Guardrail:
        return self._http.request("GET", f"{self._v3}/guardrail/{guardrail_id}").json()

    def create_guardrail(self, body: CreateGuardrailInput) -> Guardrail:
        return self._http.request("POST", f"{self._v3}/guardrail/create", json=body).json()

    def update_guardrail(self, guardrail_id: str, body: UpdateGuardrailInput) -> Guardrail:
        return self._http.request("PUT", f"{self._v3}/guardrail/update/{guardrail_id}", json=body).json()

    def delete_guardrail(self, guardrail_id: str) -> None:
        self._http.request("DELETE", f"{self._v3}/guardrail/delete/{guardrail_id}")

    # --- Guardrail Providers ---
    def list_guardrail_providers(self) -> GuardrailProviderListResponse:
        return self._http.request("GET", f"{self._v3}/guardrail-providers").json()

    def get_guardrail_provider(self, provider_id: str) -> GuardrailProvider:
        return self._http.request("GET", f"{self._v3}/guardrail-providers/{provider_id}").json()

    def create_guardrail_provider(self, body: CreateGuardrailProviderInput) -> GuardrailProvider:
        return self._http.request("POST", f"{self._v3}/guardrail-providers", json=body).json()

    def update_guardrail_provider(self, provider_id: str, body: UpdateGuardrailProviderInput) -> GuardrailProvider:
        return self._http.request("PUT", f"{self._v3}/guardrail-providers/{provider_id}", json=body).json()

    def delete_guardrail_provider(self, provider_id: str) -> None:
        self._http.request("DELETE", f"{self._v3}/guardrail-providers/{provider_id}")

    def test_guardrail_provider(self, provider_id: str, body: TestGuardrailProviderInput) -> GuardrailProviderTestResponse:
        return self._http.request("POST", f"{self._v3}/guardrail-providers/{provider_id}/test", json=body).json()

    def get_guardrail_provider_models(self, provider_id: str) -> GuardrailProviderModelsResponse:
        return self._http.request("GET", f"{self._v3}/guardrail-providers/{provider_id}/models").json()

    # --- Custom Providers ---
    def list_providers(self, include_system: bool = True) -> List[AiProvider]:
        """List AI providers — ``GET /v3/ai/providers`` returns custom providers.

        When ``include_system=True`` (default), also calls
        ``GET /v3/ai/workflow-agent/models`` and prepends an entry for the
        system-default provider with ``provider_id = "system"`` (the literal
        value backend recognizes). ``_id`` and ``id`` are ``None`` because no
        backend record exists for this entry.

        Pass ``include_system=False`` to get only the raw custom list.
        """
        custom = self._http.request("GET", f"{self._v3}/providers").json()
        if not include_system:
            return cast(List[AiProvider], custom)
        try:
            sys_res = self._http.request("GET", f"{self._v3}/workflow-agent/models").json()
            sys_models = sys_res.get("data", []) if isinstance(sys_res, dict) else []
        except Exception:
            sys_models = []
        if not sys_models:
            return cast(List[AiProvider], custom)
        system_provider: Dict[str, Any] = {
            "_id": None,
            "id": None,
            "provider_id": "system",
            "name": "System Default",
            "type": "system",
            "source": "system",
            "is_shown": True,
            "models": sys_models,
        }
        merged = [system_provider, *custom] if isinstance(custom, list) else [system_provider]
        return cast(List[AiProvider], merged)

    def create_provider(self, body: CreateAiProviderInput) -> AiProvider:
        return self._http.request("POST", f"{self._v3}/providers", json=body).json()

    def update_provider(self, provider_id: str, body: UpdateAiProviderInput) -> AiProvider:
        return self._http.request("PUT", f"{self._v3}/providers/{provider_id}", json=body).json()

    def delete_provider(self, provider_id: str) -> None:
        self._http.request("DELETE", f"{self._v3}/providers/{provider_id}")

    def refresh_provider_models(self, provider_id: str) -> AiProvider:
        return self._http.request("POST", f"{self._v3}/providers/{provider_id}/models/refresh").json()

    def get_llm_models(self) -> WorkflowAgentModelsResponse:
        """List models available for workflow-agent — `GET /v3/ai/workflow-agent/models`.

        Returns wrapped shape: ``{success, message, data: [{name, is_toolCall_available, is_vision_available}]}``.
        """
        return self._http.request("GET", f"{self._v3}/workflow-agent/models").json()

    def verify_tool_server(self, body: VerifyToolServerInput) -> VerifyToolServerResponse:
        return self._http.request("POST", f"{self._v3}/configs/tool_servers/verify", json=body).json()

    # --- AI AiAgents (v2) ---

    def list_ai_agents_v2(self) -> AiAgentListResponse:
        """List AI agents (v2)."""
        return self._http.request("GET", f"{self._v2}/ai/assistants").json()

    def create_ai_agent_v2(self, body: Dict[str, Any]) -> AiAgent:
        """Create AI agent (v2)."""
        return self._http.request("POST", f"{self._v2}/ai/assistants", json=body).json()

    def update_ai_agent_v2(self, ai_agent_id: str, body: Dict[str, Any]) -> AiAgent:
        """Update AI agent (v2)."""
        return self._http.request("PUT", f"{self._v2}/ai/assistants/{ai_agent_id}", json=body).json()

    def delete_ai_agent_v2(self, ai_agent_id: str) -> None:
        """Delete AI agent (v2)."""
        self._http.request("DELETE", f"{self._v2}/ai/assistants/{ai_agent_id}")

    def create_ai_agent_app_v2(self, body: Dict[str, Any]) -> AiAgentApp:
        """Create AI agent app (v2)."""
        return self._http.request("POST", f"{self._v2}/ai/assistant_apps", json=body).json()


class AsyncAiResource:
    """AI domain — Async. Full parity with sync AiResource."""

    def __init__(self, http: AsyncHttpTransport, base: str):
        self._http = http
        self._base = base.rstrip("/")

    @property
    def _v2(self) -> str:
        return f"{self._base.rstrip('/')}/v2/ai"

    @property
    def _v3(self) -> str:
        return f"{self._base.rstrip('/')}/v3/ai"

    @property
    def _ai_agent_base(self) -> str:
        return self._v3

    # --- Completions / Embeddings ---

    async def complete(self, input: CompletionInput) -> Completion:
        """Create chat completion (async)."""
        body = {**input.model_dump(exclude_none=True), "stream": False}
        res = await self._http.request("POST", f"{self._v3}/completions", json=body)
        data = res.json()
        if "data" in data and "success" in data:
            return Completion(**data["data"])
        return Completion(**data)

    async def stream(self, input: CompletionInput) -> AsyncIterator[StreamChunk]:
        """Stream chat completion (async)."""
        import httpx
        body = {**input.model_dump(exclude_none=True), "stream": True}

        headers: Dict[str, str] = {"Content-Type": "application/json", "Accept": "text/event-stream"}
        if self._http.api_key:
            headers["X-Api-Key"] = self._http.api_key
        token = self._http.token_manager.get_token()
        if token:
            headers["Authorization"] = f"Bearer {token}"

        async with httpx.AsyncClient(timeout=None) as client:
            async with client.stream("POST", f"{self._v3}/completions", json=body, headers=headers) as res:
                async for line in res.aiter_lines():
                    if line.startswith("data: "):
                        data = line[6:]
                        if data == "[DONE]":
                            break
                        try:
                            chunk_data = json.loads(data)
                            yield StreamChunk(**chunk_data)
                        except json.JSONDecodeError:
                            continue

    async def embed(self, model: str, input: List[str]) -> Embedding:
        """Create embeddings (async)."""
        res = await self._http.request("POST", f"{self._v3}/embeddings", json={"model": model, "input": input})
        data = res.json()
        if "data" in data and "success" in data:
            return Embedding(**data["data"])
        return Embedding(**data)

    # --- AiAgents ---

    async def list_ai_agents(self) -> AiAgentListResponse:
        res = await self._http.request("GET", f"{self._ai_agent_base}/accounts/assistants")
        return res.json()

    async def get_ai_agent(self, ai_agent_id: str) -> AiAgent:
        res = await self._http.request("GET", f"{self._ai_agent_base}/assistants/{ai_agent_id}")
        return res.json()

    async def check_ai_agent_name(self, name: str) -> AiAgentNameCheckResponse:
        res = await self._http.request("GET", f"{self._ai_agent_base}/assistants/check-name", params={"name": name})
        return res.json()

    async def list_agents(self) -> AiAgentListResponse:
        res = await self._http.request("GET", f"{self._ai_agent_base}/assistants/agents")
        return res.json()

    async def patch_instructions(self, ai_agent_id: str, body: PatchInstructionsInput) -> AiAgent:
        res = await self._http.request("PATCH", f"{self._ai_agent_base}/assistants/{ai_agent_id}/instructions", json=body)
        return res.json()

    # --- AiAgent Apps ---

    async def list_ai_agent_apps(self) -> AiAgentAppListResponse:
        res = await self._http.request("GET", f"{self._ai_agent_base}/assistant_apps")
        return res.json()

    async def get_ai_agent_app(self, ai_agent_id: str) -> AiAgentApp:
        res = await self._http.request("GET", f"{self._ai_agent_base}/assistant_apps/{ai_agent_id}")
        return res.json()

    async def create_ai_agent_app(self, body: CreateAiAgentAppInput) -> AiAgentApp:
        res = await self._http.request("POST", f"{self._ai_agent_base}/assistant_apps", json=body)
        return res.json()

    async def update_ai_agent_app(self, ai_agent_id: str, body: UpdateAiAgentAppInput) -> AiAgentApp:
        res = await self._http.request("PUT", f"{self._ai_agent_base}/assistant_apps/{ai_agent_id}", json=body)
        return res.json()

    async def delete_ai_agent_app(self, ai_agent_id: str) -> None:
        await self._http.request("DELETE", f"{self._ai_agent_base}/assistant_apps/{ai_agent_id}")

    async def update_ai_agent_workflow(self, ai_agent_id: str, body: UpdateAiAgentWorkflowInput) -> AiAgentApp:
        res = await self._http.request("PUT", f"{self._ai_agent_base}/assistant_apps/{ai_agent_id}/workflow", json=body)
        return res.json()

    # --- RAG Files ---

    async def list_rag_files(self) -> RagFileListResponse:
        res = await self._http.request("GET", f"{self._v3}/rag/files")
        return res.json()

    async def get_rag_file(self, file_id: str) -> RagFile:
        res = await self._http.request("GET", f"{self._v3}/rag/files/{file_id}")
        return res.json()

    async def upload_rag_file(self, files: Any) -> RagFile:
        res = await self._http.request("POST", f"{self._v3}/rag/files", files=files)
        return res.json()

    async def delete_rag_file(self, file_id: str) -> None:
        await self._http.request("DELETE", f"{self._v3}/rag/files/{file_id}")

    # --- Guardrails ---

    async def list_guardrails(self) -> GuardrailListResponse:
        res = await self._http.request("GET", f"{self._v3}/guardrail/all")
        return res.json()

    async def get_guardrail(self, guardrail_id: str) -> Guardrail:
        res = await self._http.request("GET", f"{self._v3}/guardrail/{guardrail_id}")
        return res.json()

    async def create_guardrail(self, body: CreateGuardrailInput) -> Guardrail:
        res = await self._http.request("POST", f"{self._v3}/guardrail/create", json=body)
        return res.json()

    async def update_guardrail(self, guardrail_id: str, body: UpdateGuardrailInput) -> Guardrail:
        res = await self._http.request("PUT", f"{self._v3}/guardrail/update/{guardrail_id}", json=body)
        return res.json()

    async def delete_guardrail(self, guardrail_id: str) -> None:
        await self._http.request("DELETE", f"{self._v3}/guardrail/delete/{guardrail_id}")

    # --- Guardrail Providers ---

    async def list_guardrail_providers(self) -> GuardrailProviderListResponse:
        res = await self._http.request("GET", f"{self._v3}/guardrail-providers")
        return res.json()

    async def get_guardrail_provider(self, provider_id: str) -> GuardrailProvider:
        res = await self._http.request("GET", f"{self._v3}/guardrail-providers/{provider_id}")
        return res.json()

    async def create_guardrail_provider(self, body: CreateGuardrailProviderInput) -> GuardrailProvider:
        res = await self._http.request("POST", f"{self._v3}/guardrail-providers", json=body)
        return res.json()

    async def update_guardrail_provider(self, provider_id: str, body: UpdateGuardrailProviderInput) -> GuardrailProvider:
        res = await self._http.request("PUT", f"{self._v3}/guardrail-providers/{provider_id}", json=body)
        return res.json()

    async def delete_guardrail_provider(self, provider_id: str) -> None:
        await self._http.request("DELETE", f"{self._v3}/guardrail-providers/{provider_id}")

    async def test_guardrail_provider(self, provider_id: str, body: TestGuardrailProviderInput) -> GuardrailProviderTestResponse:
        res = await self._http.request("POST", f"{self._v3}/guardrail-providers/{provider_id}/test", json=body)
        return res.json()

    async def get_guardrail_provider_models(self, provider_id: str) -> GuardrailProviderModelsResponse:
        res = await self._http.request("GET", f"{self._v3}/guardrail-providers/{provider_id}/models")
        return res.json()

    # --- Custom Providers ---

    async def list_providers(self, include_system: bool = True) -> List[AiProvider]:
        """See :meth:`AiResource.list_providers`."""
        res = await self._http.request("GET", f"{self._v3}/providers")
        custom = res.json()
        if not include_system:
            return cast(List[AiProvider], custom)
        try:
            sys_res = await self._http.request("GET", f"{self._v3}/workflow-agent/models")
            sys_data = sys_res.json()
            sys_models = sys_data.get("data", []) if isinstance(sys_data, dict) else []
        except Exception:
            sys_models = []
        if not sys_models:
            return cast(List[AiProvider], custom)
        system_provider: Dict[str, Any] = {
            "_id": None,
            "id": None,
            "provider_id": "system",
            "name": "System Default",
            "type": "system",
            "source": "system",
            "is_shown": True,
            "models": sys_models,
        }
        merged = [system_provider, *custom] if isinstance(custom, list) else [system_provider]
        return cast(List[AiProvider], merged)

    async def create_provider(self, body: CreateAiProviderInput) -> AiProvider:
        res = await self._http.request("POST", f"{self._v3}/providers", json=body)
        return res.json()

    async def update_provider(self, provider_id: str, body: UpdateAiProviderInput) -> AiProvider:
        res = await self._http.request("PUT", f"{self._v3}/providers/{provider_id}", json=body)
        return res.json()

    async def delete_provider(self, provider_id: str) -> None:
        await self._http.request("DELETE", f"{self._v3}/providers/{provider_id}")

    async def refresh_provider_models(self, provider_id: str) -> AiProvider:
        res = await self._http.request("POST", f"{self._v3}/providers/{provider_id}/models/refresh")
        return res.json()

    async def get_llm_models(self) -> WorkflowAgentModelsResponse:
        res = await self._http.request("GET", f"{self._v3}/workflow-agent/models")
        return res.json()

    async def verify_tool_server(self, body: VerifyToolServerInput) -> VerifyToolServerResponse:
        res = await self._http.request("POST", f"{self._v3}/configs/tool_servers/verify", json=body)
        return res.json()

    # --- AI AiAgents (v2) ---

    async def list_ai_agents_v2(self) -> AiAgentListResponse:
        """List AI agents (v2) (async)."""
        res = await self._http.request("GET", f"{self._v2}/ai/assistants")
        return res.json()

    async def create_ai_agent_v2(self, body: Dict[str, Any]) -> AiAgent:
        """Create AI agent (v2) (async)."""
        res = await self._http.request("POST", f"{self._v2}/ai/assistants", json=body)
        return res.json()

    async def update_ai_agent_v2(self, ai_agent_id: str, body: Dict[str, Any]) -> AiAgent:
        """Update AI agent (v2) (async)."""
        res = await self._http.request("PUT", f"{self._v2}/ai/assistants/{ai_agent_id}", json=body)
        return res.json()

    async def delete_ai_agent_v2(self, ai_agent_id: str) -> None:
        """Delete AI agent (v2) (async)."""
        await self._http.request("DELETE", f"{self._v2}/ai/assistants/{ai_agent_id}")

    async def create_ai_agent_app_v2(self, body: Dict[str, Any]) -> AiAgentApp:
        """Create AI agent app (v2) (async)."""
        res = await self._http.request("POST", f"{self._v2}/ai/assistant_apps", json=body)
        return res.json()
