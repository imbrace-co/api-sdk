from typing import Any, Dict, List, Optional
from typing_extensions import TypedDict
from ..http import HttpTransport, AsyncHttpTransport


# ── Input shapes ──────────────────────────────────────────────────────────────


class UseCaseInput(TypedDict, total=False):
    """The ``usecase`` half of the create-custom-template payload.

    All fields optional except ``title``. ``agent_type`` distinguishes use case
    type — for Document AI agents pass ``"document_ai"``.
    """
    title: str
    short_description: Optional[str]
    demo_url: Optional[str]
    agent_type: Optional[str]


class DocumentAIAgentConfig(TypedDict, total=False):
    """Nested config inside the ``assistant.document_ai`` body slot for Document
    AI agents (wire body key kept as ``assistant`` for backend compatibility).

    Mirrors the body sent by the iMBRACE webapp when creating a Document AI agent.
    """
    vlm_provider_id: str
    vlm_model: str
    source_languages: List[str]
    handwriting_support: bool
    board_id: str
    time_offset: Optional[str]
    continue_on_failure: bool
    retry_time: int


class AiAgentInput(TypedDict, total=False):
    """The AI Agent half of the create-custom-template payload (sent on the
    wire under the ``assistant`` body key, kept as-is for backend compatibility).

    For Document AI agents, set ``agent_type="document_ai"`` and populate the
    nested ``document_ai`` config (linking the schema board, VLM provider, etc.).
    """
    name: str
    description: Optional[str]
    mode: Optional[str]                    # "advanced" | "standard"
    model_id: Optional[str]
    provider_id: Optional[str]
    core_task: Optional[str]               # = instructions for the agent
    agent_type: Optional[str]              # "document_ai" | "agent" | ...
    channel: Optional[str]                 # "web" | ...
    temperature: Optional[float]
    workflow_function_call: Optional[List[str]]
    workflow_name: Optional[str]
    credential_name: Optional[str]
    board_ids: Optional[List[str]]
    version: Optional[int]
    document_ai: Optional[DocumentAIAgentConfig]
    metadata: Optional[Dict[str, Any]]


# ── Response shapes ───────────────────────────────────────────────────────────


class UseCase(TypedDict, total=False):
    _id: str
    public_id: Optional[str]
    doc_name: str                          # "UseCase"
    title: str
    short_description: Optional[str]
    type: Optional[str]                    # "custom" | ...
    agent_type: Optional[str]
    organization_id: Optional[str]
    user_id: Optional[str]
    channel_id: Optional[str]
    assistant_id: Optional[str]
    demo_url: Optional[str]
    version: Optional[int]
    is_deleted: Optional[bool]
    features: Optional[List[Any]]
    tags: Optional[List[Any]]
    suggestion_prompts: Optional[List[Any]]
    how_it_works: Optional[List[Any]]
    supported_channels: Optional[List[Any]]
    integrations: Optional[List[Any]]
    created_at: Optional[str]
    updated_at: Optional[str]
    createdAt: Optional[str]
    updatedAt: Optional[str]


class UseCaseListResponse(TypedDict, total=False):
    data: List[UseCase]


class CreateCustomTemplateResponse(TypedDict, total=False):
    data: UseCase


# ── Resource ──────────────────────────────────────────────────────────────────


class TemplatesResource:
    """Use Case Templates — Sync.

    Wraps ``/v2/backend/templates`` endpoints. The most important method is
    :meth:`create_custom`, which atomically creates a UseCase + AI Agent pair
    used by Document AI flows (see also :class:`DocumentAIResource`).

    @param http  HTTP transport
    @param base  Templates base URL (typically ``{gateway}/v2/backend/templates``)

    Example::

        # Document AI: create UseCase + AI Agent linked to a schema board
        res = client.templates.create_custom(
            usecase={
                "title": "Receipt Extractor",
                "short_description": "Extract invoice fields",
                "demo_url": "https://chat-widget.imbrace.co",
                "agent_type": "document_ai",
            },
            assistant={
                "name": "Receipt Extractor",
                "mode": "advanced",
                "model_id": "qwen3.5:27b",
                "provider_id": "8cc8769a-...",
                "core_task": "Step 1: Extract Data...",
                "agent_type": "document_ai",
                "channel": "web",
                "temperature": 0.1,
                "version": 2,
                "document_ai": {
                    "vlm_provider_id": "8cc8769a-...",
                    "vlm_model": "qwen3.5:27b",
                    "source_languages": ["English"],
                    "handwriting_support": True,
                    "board_id": "brd_xxx",
                    "continue_on_failure": False,
                    "retry_time": 2,
                },
            },
        )
        usecase_id    = res["data"]["_id"]
        assistant_id  = res["data"]["assistant_id"]
        channel_id    = res["data"]["channel_id"]
    """

    def __init__(self, http: HttpTransport, base: str):
        self._http = http
        self._base = base.rstrip("/")

    def list(self) -> UseCaseListResponse:
        """List use case templates — ``GET /v2/backend/templates``."""
        return self._http.request("GET", self._base).json()

    def create_custom(
        self,
        usecase: UseCaseInput,
        assistant: AiAgentInput,
    ) -> CreateCustomTemplateResponse:
        """Create a custom UseCase + AI Agent in one POST.

        Routes to ``POST /v2/backend/templates/v2/custom``. Backend auto-creates
        the linked channel, workflow (ActivePieces), and assistant_app, and
        returns the assembled use case (with ``assistant_id``, ``channel_id``).

        The wire body still uses the ``assistant`` key for backend compatibility.
        """
        body = {"usecase": usecase, "assistant": assistant}
        return self._http.request("POST", f"{self._base}/v2/custom", json=body).json()

    def update_custom(self, usecase_id: str, body: Dict[str, Any]) -> CreateCustomTemplateResponse:
        """Partial update — ``PATCH /v2/backend/templates/{id}/custom``."""
        return self._http.request("PATCH", f"{self._base}/{usecase_id}/custom", json=body).json()

    def delete(self, usecase_id: str) -> None:
        """Delete v1 template — ``DELETE /v2/backend/templates/{id}``."""
        self._http.request("DELETE", f"{self._base}/{usecase_id}")

    def delete_v2(self, usecase_id: str) -> None:
        """Delete v2 template (atomic) — ``DELETE /v2/backend/templates/v2/{id}``.

        Cascades through linked AI Agent + Channel. Use this for templates
        created via :meth:`create_custom`.
        """
        self._http.request("DELETE", f"{self._base}/v2/{usecase_id}")


class AsyncTemplatesResource:
    """Use Case Templates — Async. See :class:`TemplatesResource` for full docs."""

    def __init__(self, http: AsyncHttpTransport, base: str):
        self._http = http
        self._base = base.rstrip("/")

    async def list(self) -> UseCaseListResponse:
        res = await self._http.request("GET", self._base)
        return res.json()

    async def create_custom(
        self,
        usecase: UseCaseInput,
        assistant: AiAgentInput,
    ) -> CreateCustomTemplateResponse:
        body = {"usecase": usecase, "assistant": assistant}
        res = await self._http.request("POST", f"{self._base}/v2/custom", json=body)
        return res.json()

    async def update_custom(self, usecase_id: str, body: Dict[str, Any]) -> CreateCustomTemplateResponse:
        res = await self._http.request("PATCH", f"{self._base}/{usecase_id}/custom", json=body)
        return res.json()

    async def delete(self, usecase_id: str) -> None:
        await self._http.request("DELETE", f"{self._base}/{usecase_id}")

    async def delete_v2(self, usecase_id: str) -> None:
        await self._http.request("DELETE", f"{self._base}/v2/{usecase_id}")
