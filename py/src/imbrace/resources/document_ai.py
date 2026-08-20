from typing import TYPE_CHECKING, Any, Dict, List, Optional, cast
from ..http import HttpTransport, AsyncHttpTransport

if TYPE_CHECKING:
    from .boards import BoardsResource, AsyncBoardsResource
    from .templates import (
        TemplatesResource, AsyncTemplatesResource,
        UseCaseInput, AiAgentInput,
    )


_SUGGEST_SCHEMA_PROMPT = (
    "Analyze this document and propose a JSON schema describing the fields. "
    "Return ONLY a JSON object where each key is a field name and the value "
    "is { type: <string|number|boolean|date>, description: <short description> }. "
    'Example: { "invoice_number": { "type": "string", "description": "Invoice ID" } }'
)


class DocumentAIResource:
    """Document AI — high-level wrapper for the iMBRACE Document AI Agent feature (Sync).

    A Document AI Agent is a specialized AI Agent configured to extract
    structured JSON from unstructured documents. Each agent has:

    - a **schema** (``data_schema`` field) defining the extraction fields
    - **instructions** guiding the LLM (business rules, formats)
    - a **model** + **provider** for the VLM/LLM
    - optional **workflow** integration

    This resource wraps AI Agent CRUD endpoints (filtered by
    ``agent_type='document_ai'``) plus the processing endpoint ``/v3/ai/document/``.

    Example::

        # Setup once
        agent = client.document_ai.create_agent(
            name="Invoice Extractor",
            instructions="Extract invoice fields. Dates as YYYY-MM-DD.",
            model_id="gpt-4o",
            schema={
                "invoice_number": {"type": "string", "description": "Invoice ID"},
                "total":          {"type": "number"},
                "date":           {"type": "string", "format": "date"},
            },
        )

        # Use many times
        result = client.document_ai.process(
            agent_id=agent["_id"],
            url="https://example.com/invoice.pdf",
            organization_id="org_xxx",
        )
    """

    def __init__(
        self,
        http: HttpTransport,
        ai_base: str,
        *,
        boards: Optional["BoardsResource"] = None,
        templates: Optional["TemplatesResource"] = None,
    ):
        self._http = http
        self._base = ai_base.rstrip("/")
        # Optional refs used by :meth:`create_full` orchestrator.
        # Auto-wired when constructed via ImbraceClient.
        self._boards = boards
        self._templates = templates

    # ── Agent CRUD ───────────────────────────────────────────────────────────

    def list_agents(
        self,
        name_contains: Optional[str] = None,
        document_ai_only: bool = False,
    ) -> List[Dict[str, Any]]:
        """List AI Agents. Optional filters.

        :param name_contains: case-insensitive name substring filter.
        :param document_ai_only: if ``True``, return ONLY AI Agents that have
            the ``document_ai`` config field populated (i.e. created via
            :meth:`create_full` or via the iMBRACE webapp Document AI flow).
            Existing agents whose names suggest "Document AI" but were not
            tagged with the ``document_ai`` config are excluded.

        Note: backend stores ``agent_type='agent'`` for ALL AI Agents, so
        that field is not a reliable filter. The reliable marker is
        ``document_ai != None`` on the wire payload.
        """
        res = self._http.request("GET", f"{self._base}/accounts/assistants").json()
        all_a = res.get("data", res) if isinstance(res, dict) else res
        if not isinstance(all_a, list):
            return []
        out = all_a
        if document_ai_only:
            # The list endpoint tags Document AI agents via
            # ``agent_type == "document_ai"`` but does NOT populate the
            # ``document_ai`` config object (only the detail endpoint does).
            out = [
                a
                for a in out
                if a.get("agent_type") == "document_ai" or a.get("document_ai") is not None
            ]
        if name_contains:
            kw = name_contains.lower()
            out = [a for a in out if kw in (a.get("name") or "").lower()]
        return out

    def get_agent(self, agent_id: str) -> Dict[str, Any]:
        """Get a single Document AI Agent by id."""
        return self._http.request("GET", f"{self._base}/assistants/{agent_id}").json()

    def create_agent(
        self,
        name: str,
        instructions: str,
        model_id: str,
        provider_id: str = "system",
        workflow_name: str = "document_extraction",
        schema: Optional[Dict[str, Any]] = None,
        description: Optional[str] = None,
        **extra_fields: Any,
    ) -> Dict[str, Any]:
        """Create a Document AI Agent.

        Wraps ``POST /v3/ai/assistant_apps`` with ``agent_type='document_ai'``.
        Pass ``schema`` to define extraction fields (stored as ``data_schema``).
        """
        body: Dict[str, Any] = {
            "name": name,
            "instructions": instructions,
            "model_id": model_id,
            "provider_id": provider_id,
            "workflow_name": workflow_name,
            # Tag as Document AI so the agent is created with the right type and
            # surfaces in list_agents(document_ai_only=True). Without this the
            # backend defaults agent_type to "agent".
            "agent_type": "document_ai",
        }
        if schema is not None:
            body["data_schema"] = schema
        if description is not None:
            body["description"] = description
        body.update(extra_fields)
        return self._http.request("POST", f"{self._base}/assistant_apps", json=body).json()

    def update_agent(
        self,
        agent_id: str,
        body: Dict[str, Any],
        *,
        merge_mode: str = "merge",
    ) -> Dict[str, Any]:
        """Update an agent with partial fields.

        Wraps ``PUT /v3/ai/assistant_apps/{id}``. Backend treats this as a
        **full replacement** (rejecting partial bodies missing required fields
        like ``name`` or ``workflow_name``), so this method auto-fetches the
        current agent and merges ``body`` on top before sending. This gives a
        true partial-update UX from the caller's side.

        :param merge_mode: ``"merge"`` (default) auto-fetches existing agent
            and merges. ``"replace"`` sends ``body`` as-is (use if you already
            have the full body and want to save a round-trip).

        If you pass ``schema`` in body it is renamed to ``data_schema`` to match backend.
        """
        if "schema" in body and "data_schema" not in body:
            body = dict(body)
            body["data_schema"] = body.pop("schema")

        if merge_mode == "merge":
            existing = self.get_agent(agent_id)
            merged: Dict[str, Any] = {**existing, **body}
            for k in ("_id", "id", "assistant_id", "created_at", "updated_at", "organization_id"):
                merged.pop(k, None)
            body = merged

        return self._http.request("PUT", f"{self._base}/assistant_apps/{agent_id}", json=body).json()

    def delete_agent(self, agent_id: str) -> None:
        """Delete an agent."""
        self._http.request("DELETE", f"{self._base}/assistant_apps/{agent_id}")

    # ── Process ──────────────────────────────────────────────────────────────

    def process(
        self,
        url: str,
        organization_id: str,
        agent_id: Optional[str] = None,
        model_name: Optional[str] = None,
        instructions: Optional[str] = None,
        **extra: Any,
    ) -> Dict[str, Any]:
        """Process a document. Pass ``agent_id`` (looked up) or ``model_name`` directly."""
        if agent_id and (not model_name or not instructions):
            agent = self.get_agent(agent_id)
            model_name   = model_name   or agent.get("model_id")
            instructions = instructions or agent.get("instructions")

        if not model_name:
            raise ValueError(
                "document_ai.process: must provide either agent_id or model_name. "
                "If agent_id was given but the agent has no model_id, pass model_name explicitly."
            )

        body: Dict[str, Any] = {
            "modelName": model_name,
            "url": url,
            "organizationId": organization_id,
        }
        if instructions:
            body["additionalInstructions"] = instructions
        for k, v in extra.items():
            if v is not None:
                body[k] = v

        return self._http.request("POST", f"{self._base}/document", json=body).json()

    # ── Schema auto-learn (provisional) ──────────────────────────────────────

    def suggest_schema(
        self,
        url: str,
        organization_id: str,
        model_name: str = "gpt-4o",
    ) -> Dict[str, Any]:
        """Suggest a JSON schema by analyzing a sample document.

        **Provisional**: uses ``process()`` with a meta-prompt asking the vision
        model to propose a schema. Will be updated to a dedicated backend endpoint
        if/when one is exposed (e.g. ``/v3/ai/document/auto-schema``).
        """
        return self.process(
            url=url,
            organization_id=organization_id,
            model_name=model_name,
            instructions=_SUGGEST_SCHEMA_PROMPT,
        )

    # ── Orchestrator ─────────────────────────────────────────────────────────

    def create_full(
        self,
        name: str,
        instructions: str,
        schema_fields: List[Dict[str, Any]],
        model_id: str,
        provider_id: str,
        *,
        description: Optional[str] = None,
        vlm_model: Optional[str] = None,
        vlm_provider_id: Optional[str] = None,
        source_languages: Optional[List[str]] = None,
        handwriting_support: bool = False,
        time_offset: str = "UTC+00:00",
        continue_on_failure: bool = False,
        retry_time: int = 2,
        temperature: float = 0.1,
        demo_url: Optional[str] = None,
        team_ids: Optional[List[str]] = None,
        extra_ai_agent: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """End-to-end Document AI agent creation.

        Wraps the 2-step flow the iMBRACE webapp performs:

        1. Create a ``General`` board (the extraction-schema container — backend
           enum doesn't accept ``DocumentAI``, so we use ``General`` and identify
           Document-AI boards via the agent's ``document_ai.board_id`` link).
           Then add each ``schema_fields`` entry as a separate field via
           :meth:`BoardsResource.create_field`.
        2. Create a UseCase + AI Agent via :meth:`TemplatesResource.create_custom`,
           linking the new board through ``assistant.document_ai.board_id`` (wire
           body key kept as ``assistant`` for backend compatibility).

        Returns aggregated ids::

            {
                "board_id":    "brd_xxx",
                "ai_agent_id": "fa445273-...",
                "channel_id":  "ch_xxx",
                "usecase_id":  "uc_xxx",
                "usecase":     <full UseCase object>,
                "board":       <full Board object>,
            }

        Defaults: ``vlm_model`` falls back to ``model_id``, ``vlm_provider_id``
        falls back to ``provider_id``, ``source_languages`` to ``["English"]``.
        Pass ``extra_ai_agent`` to override / extend AI Agent fields
        (e.g. ``{"workflow_function_call": [...], "metadata": {...}}``).

        :raises RuntimeError: if the resource was not constructed via
            ``ImbraceClient`` (no ``boards`` / ``templates`` refs available).
        """
        if self._boards is None or self._templates is None:
            raise RuntimeError(
                "document_ai.create_full requires boards + templates resources. "
                "These are auto-wired by ImbraceClient. If you constructed "
                "DocumentAIResource directly, pass boards= and templates= kwargs."
            )

        # Step 1a — create General board (backend enum doesn't include "DocumentAI").
        # Backend auto-creates a Name field with is_identifier=True on creation;
        # adding schema_fields at create-time conflicts with that ("Only one field
        # can be identifier"), so we add them one-by-one after creation.
        board = self._boards.create(
            name,
            description=description,
            type="General",
            team_ids=team_ids if team_ids is not None else [],
            show_id=False,
        )
        board_id = board.get("_id") or board.get("id")
        if not board_id:
            raise ValueError(f"boards.create did not return an _id (got {board!r})")

        # Step 1b — append schema fields as separate field-creates.
        for field in schema_fields:
            self._boards.create_field(board_id, field)

        usecase: Dict[str, Any] = {
            "title": name,
            "short_description": description or "",
            "agent_type": "document_ai",
        }
        if demo_url:
            usecase["demo_url"] = demo_url

        ai_agent: Dict[str, Any] = {
            "name": name,
            "description": description or "",
            "mode": "advanced",
            "model_id": model_id,
            "provider_id": provider_id,
            "core_task": instructions,
            "agent_type": "document_ai",
            "workflow_name": "document_extraction",
            "channel": "web",
            "temperature": temperature,
            "version": 2,
            "document_ai": {
                "vlm_provider_id": vlm_provider_id or provider_id,
                "vlm_model": vlm_model or model_id,
                "source_languages": source_languages or ["English"],
                "handwriting_support": handwriting_support,
                "board_id": board_id,
                "time_offset": time_offset,
                "continue_on_failure": continue_on_failure,
                "retry_time": retry_time,
            },
        }
        if extra_ai_agent:
            ai_agent.update(extra_ai_agent)

        res = self._templates.create_custom(
            usecase=cast("UseCaseInput", usecase),
            assistant=cast("AiAgentInput", ai_agent),
        )
        data = res.get("data", res) if isinstance(res, dict) else {}

        return {
            "board_id":     board_id,
            "ai_agent_id": data.get("assistant_id"),
            "channel_id":   data.get("channel_id"),
            "usecase_id":   data.get("_id"),
            "usecase":      data,
            "board":        board,
        }


class AsyncDocumentAIResource:
    """Document AI — async variant. See :class:`DocumentAIResource` for full docs."""

    def __init__(
        self,
        http: AsyncHttpTransport,
        ai_base: str,
        *,
        boards: Optional["AsyncBoardsResource"] = None,
        templates: Optional["AsyncTemplatesResource"] = None,
    ):
        self._http = http
        self._base = ai_base.rstrip("/")
        self._boards = boards
        self._templates = templates

    async def list_agents(
        self,
        name_contains: Optional[str] = None,
        document_ai_only: bool = False,
    ) -> List[Dict[str, Any]]:
        """See :meth:`DocumentAIResource.list_agents`."""
        res = await self._http.request("GET", f"{self._base}/accounts/assistants")
        data = res.json()
        all_a = data.get("data", data) if isinstance(data, dict) else data
        if not isinstance(all_a, list):
            return []
        out = all_a
        if document_ai_only:
            # The list endpoint tags Document AI agents via
            # ``agent_type == "document_ai"`` but does NOT populate the
            # ``document_ai`` config object (only the detail endpoint does).
            out = [
                a
                for a in out
                if a.get("agent_type") == "document_ai" or a.get("document_ai") is not None
            ]
        if name_contains:
            kw = name_contains.lower()
            out = [a for a in out if kw in (a.get("name") or "").lower()]
        return out

    async def get_agent(self, agent_id: str) -> Dict[str, Any]:
        res = await self._http.request("GET", f"{self._base}/assistants/{agent_id}")
        return res.json()

    async def create_agent(
        self,
        name: str,
        instructions: str,
        model_id: str,
        provider_id: str = "system",
        workflow_name: str = "document_extraction",
        schema: Optional[Dict[str, Any]] = None,
        description: Optional[str] = None,
        **extra_fields: Any,
    ) -> Dict[str, Any]:
        body: Dict[str, Any] = {
            "name": name,
            "instructions": instructions,
            "model_id": model_id,
            "provider_id": provider_id,
            "workflow_name": workflow_name,
            # Tag as Document AI so the agent is created with the right type and
            # surfaces in list_agents(document_ai_only=True). Without this the
            # backend defaults agent_type to "agent".
            "agent_type": "document_ai",
        }
        if schema is not None:
            body["data_schema"] = schema
        if description is not None:
            body["description"] = description
        body.update(extra_fields)
        res = await self._http.request("POST", f"{self._base}/assistant_apps", json=body)
        return res.json()

    async def update_agent(self, agent_id: str, body: Dict[str, Any]) -> Dict[str, Any]:
        if "schema" in body and "data_schema" not in body:
            body = dict(body)
            body["data_schema"] = body.pop("schema")
        res = await self._http.request("PUT", f"{self._base}/assistant_apps/{agent_id}", json=body)
        return res.json()

    async def delete_agent(self, agent_id: str) -> None:
        await self._http.request("DELETE", f"{self._base}/assistant_apps/{agent_id}")

    async def process(
        self,
        url: str,
        organization_id: str,
        agent_id: Optional[str] = None,
        model_name: Optional[str] = None,
        instructions: Optional[str] = None,
        **extra: Any,
    ) -> Dict[str, Any]:
        if agent_id and (not model_name or not instructions):
            agent = await self.get_agent(agent_id)
            model_name   = model_name   or agent.get("model_id")
            instructions = instructions or agent.get("instructions")

        if not model_name:
            raise ValueError(
                "document_ai.process: must provide either agent_id or model_name."
            )

        body: Dict[str, Any] = {
            "modelName": model_name,
            "url": url,
            "organizationId": organization_id,
        }
        if instructions:
            body["additionalInstructions"] = instructions
        for k, v in extra.items():
            if v is not None:
                body[k] = v

        res = await self._http.request("POST", f"{self._base}/document", json=body)
        return res.json()

    async def suggest_schema(
        self,
        url: str,
        organization_id: str,
        model_name: str = "gpt-4o",
    ) -> Dict[str, Any]:
        return await self.process(
            url=url,
            organization_id=organization_id,
            model_name=model_name,
            instructions=_SUGGEST_SCHEMA_PROMPT,
        )

    # ── Orchestrator ─────────────────────────────────────────────────────────

    async def create_full(
        self,
        name: str,
        instructions: str,
        schema_fields: List[Dict[str, Any]],
        model_id: str,
        provider_id: str,
        *,
        description: Optional[str] = None,
        vlm_model: Optional[str] = None,
        vlm_provider_id: Optional[str] = None,
        source_languages: Optional[List[str]] = None,
        handwriting_support: bool = False,
        time_offset: str = "UTC+00:00",
        continue_on_failure: bool = False,
        retry_time: int = 2,
        temperature: float = 0.1,
        demo_url: Optional[str] = None,
        team_ids: Optional[List[str]] = None,
        extra_ai_agent: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """End-to-end Document AI agent creation (async).

        See :meth:`DocumentAIResource.create_full` for full docs.
        """
        if self._boards is None or self._templates is None:
            raise RuntimeError(
                "document_ai.create_full requires boards + templates resources. "
                "These are auto-wired by AsyncImbraceClient."
            )

        board = await self._boards.create(
            name,
            description=description,
            type="DocumentAI",
            fields=schema_fields,
            team_ids=team_ids if team_ids is not None else [],
            show_id=False,
        )
        board_id = board.get("_id") or board.get("id")
        if not board_id:
            raise ValueError(f"boards.create did not return an _id (got {board!r})")

        usecase: Dict[str, Any] = {
            "title": name,
            "short_description": description or "",
            "agent_type": "document_ai",
        }
        if demo_url:
            usecase["demo_url"] = demo_url

        ai_agent: Dict[str, Any] = {
            "name": name,
            "description": description or "",
            "mode": "advanced",
            "model_id": model_id,
            "provider_id": provider_id,
            "core_task": instructions,
            "agent_type": "document_ai",
            "workflow_name": "document_extraction",
            "channel": "web",
            "temperature": temperature,
            "version": 2,
            "document_ai": {
                "vlm_provider_id": vlm_provider_id or provider_id,
                "vlm_model": vlm_model or model_id,
                "source_languages": source_languages or ["English"],
                "handwriting_support": handwriting_support,
                "board_id": board_id,
                "time_offset": time_offset,
                "continue_on_failure": continue_on_failure,
                "retry_time": retry_time,
            },
        }
        if extra_ai_agent:
            ai_agent.update(extra_ai_agent)

        res = await self._templates.create_custom(
            usecase=cast("UseCaseInput", usecase),
            assistant=cast("AiAgentInput", ai_agent),
        )
        data = res.get("data", res) if isinstance(res, dict) else {}

        return {
            "board_id":     board_id,
            "ai_agent_id": data.get("assistant_id"),
            "channel_id":   data.get("channel_id"),
            "usecase_id":   data.get("_id"),
            "usecase":      data,
            "board":        board,
        }
