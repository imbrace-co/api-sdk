from typing import Any, Dict, List, Literal, Optional
from ..http import HttpTransport, AsyncHttpTransport


def _json_or_none(res) -> Any:
    if res.status_code == 204 or res.headers.get("content-length") == "0":
        return None
    return res.json()


class WorkflowsResource:
    """Workflows domain — Sync.

    Includes:
    - Channel automations (via `backend` URL, v2/backend/workflows/channel_automation)
    - Flow engine (via `ap_base` URL): flows, runs, folders, connections,
      pieces, MCP servers, tables, records, invitations.

    @param backend - backend base URL (`{gateway}/v1/backend`)
    @param ap_base - workflow engine base URL (`{gateway}/activepieces`)
    """

    def __init__(self, http: HttpTransport, backend: str, ap_base: str, channel_service: str = ""):
        self._http = http
        self._backend = backend.rstrip("/")
        self._ap_base = ap_base.rstrip("/")
        self._channel_service = channel_service.rstrip("/") if channel_service else ""

    @property
    def _v2(self) -> str:
        return self._backend.replace("/v1/", "/v2/")

    def _ap_url(self, path: str) -> str:
        return f"{self._ap_base}{path}"

    def _ap_get(self, path: str, params: Optional[Dict[str, Any]] = None) -> Any:
        p = {k: v for k, v in (params or {}).items() if v is not None}
        return self._http.request("GET", self._ap_url(path), params=p).json()

    def _ap_post(self, path: str, body: Any = None) -> Any:
        return _json_or_none(self._http.request("POST", self._ap_url(path), json=body or {}))

    def _ap_delete(self, path: str) -> None:
        _json_or_none(self._http.request("DELETE", self._ap_url(path)))

    # ── Channel automation ─────────────────────────────────────────────────────

    def list_channel_automation(self, channel_type: Optional[str] = None) -> Dict[str, Any]:
        """List channel automations.

        Migrated from legacy backend (/v2/backend/workflows/...) to channel-service
        (/channel-service/v1/workflows/channel_automation) in v1.1.0.
        """
        params = {}
        if channel_type:
            params["channelType"] = channel_type
        base = self._channel_service or self._v2
        return self._http.request("GET", f"{base}/v1/workflows/channel_automation", params=params).json()

    # ── Flows ──────────────────────────────────────────────────────────────────

    def list_flows(self, limit: int = 10, cursor: Optional[str] = None,
                   project_id: Optional[str] = None, folder_id: Optional[str] = None,
                   status: Optional[str] = None) -> Dict[str, Any]:
        return self._ap_get("/v1/flows", {"limit": limit, "cursor": cursor,
                                          "projectId": project_id, "folderId": folder_id,
                                          "status": status})

    def get_flow(self, flow_id: str) -> Dict[str, Any]:
        return self._ap_get(f"/v1/flows/{flow_id}")

    def create_flow(self, display_name: str, project_id: str) -> Dict[str, Any]:
        return self._ap_post("/v1/flows", {"displayName": display_name, "projectId": project_id})

    def delete_flow(self, flow_id: str) -> None:
        self._ap_delete(f"/v1/flows/{flow_id}")

    def apply_flow_operation(self, flow_id: str, body: Dict[str, Any]) -> Dict[str, Any]:
        return self._ap_post(f"/v1/flows/{flow_id}", body)

    def trigger_flow(self, flow_id: str, payload: Optional[Dict[str, Any]] = None) -> Any:
        return self._ap_post(f"/v1/webhooks/{flow_id}", payload or {})

    def trigger_flow_sync(self, flow_id: str, payload: Optional[Dict[str, Any]] = None) -> Any:
        return self._ap_post(f"/v1/webhooks/{flow_id}/sync", payload or {})

    # ── Flow Runs ──────────────────────────────────────────────────────────────

    def list_runs(self, limit: int = 10, cursor: Optional[str] = None,
                  flow_id: Optional[str] = None, status: Optional[str] = None,
                  project_id: Optional[str] = None) -> Dict[str, Any]:
        return self._ap_get("/v1/flow-runs", {"limit": limit, "cursor": cursor,
                                              "flowId": flow_id, "status": status,
                                              "projectId": project_id})

    def get_run(self, run_id: str) -> Dict[str, Any]:
        return self._ap_get(f"/v1/flow-runs/{run_id}")

    # ── Folders ────────────────────────────────────────────────────────────────

    def list_folders(self, limit: int = 10, cursor: Optional[str] = None) -> Dict[str, Any]:
        return self._ap_get("/v1/folders", {"limit": limit, "cursor": cursor})

    def get_folder(self, folder_id: str) -> Dict[str, Any]:
        return self._ap_get(f"/v1/folders/{folder_id}")

    def create_folder(self, display_name: str, project_id: str) -> Dict[str, Any]:
        return self._ap_post("/v1/folders", {"displayName": display_name, "projectId": project_id})

    def update_folder(self, folder_id: str, display_name: str) -> Dict[str, Any]:
        return self._ap_post(f"/v1/folders/{folder_id}", {"displayName": display_name})

    def delete_folder(self, folder_id: str) -> None:
        self._ap_delete(f"/v1/folders/{folder_id}")

    # ── App Connections ────────────────────────────────────────────────────────

    def list_connections(self, limit: int = 10, cursor: Optional[str] = None,
                         project_id: Optional[str] = None,
                         piece_name: Optional[str] = None) -> Dict[str, Any]:
        return self._ap_get("/v1/app-connections", {"limit": limit, "cursor": cursor,
                                                     "projectId": project_id,
                                                     "pieceName": piece_name})

    def get_connection(self, connection_id: str) -> Dict[str, Any]:
        return self._ap_get(f"/v1/app-connections/{connection_id}")

    def upsert_connection(self, body: Dict[str, Any]) -> Dict[str, Any]:
        return self._ap_post("/v1/app-connections", body)

    def delete_connection(self, connection_id: str) -> None:
        self._ap_delete(f"/v1/app-connections/{connection_id}")

    # ── Pieces ─────────────────────────────────────────────────────────────────

    def list_pieces(self, limit: int = 10) -> List[Dict[str, Any]]:
        return self._ap_get("/v1/pieces", {"limit": limit})

    # ── Triggers ───────────────────────────────────────────────────────────────

    def get_trigger_run_status(self) -> Dict[str, Any]:
        return self._ap_get("/v1/trigger-runs/status")

    def test_trigger(self, body: Dict[str, Any]) -> Any:
        return self._ap_post("/v1/test-trigger", body)

    # ── Tables & Records ───────────────────────────────────────────────────────

    def list_tables(self, limit: int = 10, cursor: Optional[str] = None) -> Dict[str, Any]:
        return self._ap_get("/v1/tables", {"limit": limit, "cursor": cursor})

    def get_table(self, table_id: str) -> Dict[str, Any]:
        return self._ap_get(f"/v1/tables/{table_id}")

    def list_records(self, table_id: str, limit: int = 10,
                     cursor: Optional[str] = None) -> Dict[str, Any]:
        return self._ap_get("/v1/records", {"tableId": table_id, "limit": limit, "cursor": cursor})

    # ── MCP Servers ────────────────────────────────────────────────────────────

    _cached_project_id: Optional[str] = None

    def resolve_project_id(self) -> str:
        """Resolve the Workflow project id by listing first flow.

        Caches the result so repeated calls don't refetch. Raises if the org
        has no flows yet (caller must pass ``project_id`` explicitly).
        """
        if self._cached_project_id:
            return self._cached_project_id
        r = self.list_flows(limit=1)
        flows = r.get("data", []) if isinstance(r, dict) else []
        flow = flows[0] if flows else {}
        pid = flow.get("projectId") or flow.get("project_id")
        if not pid:
            raise RuntimeError(
                "workflows.resolve_project_id: org has no flows yet — cannot derive project_id. "
                "Pass it explicitly to the calling method (e.g. list_mcp_servers(project_id))."
            )
        self._cached_project_id = pid
        return pid

    def list_mcp_servers(self, project_id: Optional[str] = None) -> Dict[str, Any]:
        """List MCP servers for a project. If ``project_id`` is omitted, the SDK
        auto-resolves it via :meth:`resolve_project_id`."""
        pid = project_id if project_id is not None else self.resolve_project_id()
        return self._ap_get("/v1/mcp-servers", {"projectId": pid})

    def get_mcp_server(self, mcp_server_id: str) -> Dict[str, Any]:
        return self._ap_get(f"/v1/mcp-servers/{mcp_server_id}")

    def create_mcp_server(self, body: Dict[str, Any]) -> Dict[str, Any]:
        return self._ap_post("/v1/mcp-servers", body)

    def delete_mcp_server(self, mcp_server_id: str) -> None:
        self._ap_delete(f"/v1/mcp-servers/{mcp_server_id}")

    def rotate_mcp_token(self, mcp_server_id: str) -> Dict[str, Any]:
        return self._ap_post(f"/v1/mcp-servers/{mcp_server_id}/rotate")

    # ── User Invitations ───────────────────────────────────────────────────────

    def list_invitations(self, type: Literal["PLATFORM", "PROJECT"], limit: int = 10,
                         cursor: Optional[str] = None,
                         project_id: Optional[str] = None) -> Dict[str, Any]:
        """List user invitations.

        :param type: must be ``"PLATFORM"`` or ``"PROJECT"`` — backend enum
            rejects other values with 400 ``FST_ERR_VALIDATION``.
        """
        return self._ap_get("/v1/user-invitations", {"type": type, "limit": limit,
                                                     "cursor": cursor, "projectId": project_id})

    def delete_invitation(self, invitation_id: str) -> None:
        self._ap_delete(f"/v1/user-invitations/{invitation_id}")


class AsyncWorkflowsResource:
    """Workflows domain — Async.

    Includes:
    - Channel automations (via `backend` URL, v2/backend/workflows/channel_automation)
    - Flow engine (via `ap_base` URL): flows, runs, folders, connections,
      pieces, MCP servers, tables, records, invitations.
    """

    def __init__(self, http: AsyncHttpTransport, backend: str, ap_base: str, channel_service: str = ""):
        self._http = http
        self._backend = backend.rstrip("/")
        self._ap_base = ap_base.rstrip("/")
        self._channel_service = channel_service.rstrip("/") if channel_service else ""

    @property
    def _v2(self) -> str:
        return self._backend.replace("/v1/", "/v2/")

    def _ap_url(self, path: str) -> str:
        return f"{self._ap_base}{path}"

    async def _ap_get(self, path: str, params: Optional[Dict[str, Any]] = None) -> Any:
        p = {k: v for k, v in (params or {}).items() if v is not None}
        res = await self._http.request("GET", self._ap_url(path), params=p)
        return res.json()

    async def _ap_post(self, path: str, body: Any = None) -> Any:
        res = await self._http.request("POST", self._ap_url(path), json=body or {})
        return _json_or_none(res)

    async def _ap_delete(self, path: str) -> None:
        res = await self._http.request("DELETE", self._ap_url(path))
        _json_or_none(res)

    # ── Channel automation ─────────────────────────────────────────────────────

    async def list_channel_automation(self, channel_type: Optional[str] = None) -> Dict[str, Any]:
        params = {}
        if channel_type:
            params["channelType"] = channel_type
        base = self._channel_service or self._v2
        res = await self._http.request("GET", f"{base}/v1/workflows/channel_automation", params=params)
        return res.json()

    # ── Flows ──────────────────────────────────────────────────────────────────

    async def list_flows(self, limit: int = 10, cursor: Optional[str] = None,
                         project_id: Optional[str] = None, folder_id: Optional[str] = None,
                         status: Optional[str] = None) -> Dict[str, Any]:
        return await self._ap_get("/v1/flows", {"limit": limit, "cursor": cursor,
                                                 "projectId": project_id, "folderId": folder_id,
                                                 "status": status})

    async def get_flow(self, flow_id: str) -> Dict[str, Any]:
        return await self._ap_get(f"/v1/flows/{flow_id}")

    async def create_flow(self, display_name: str, project_id: str) -> Dict[str, Any]:
        return await self._ap_post("/v1/flows", {"displayName": display_name, "projectId": project_id})

    async def delete_flow(self, flow_id: str) -> None:
        await self._ap_delete(f"/v1/flows/{flow_id}")

    async def apply_flow_operation(self, flow_id: str, body: Dict[str, Any]) -> Dict[str, Any]:
        return await self._ap_post(f"/v1/flows/{flow_id}", body)

    async def trigger_flow(self, flow_id: str, payload: Optional[Dict[str, Any]] = None) -> Any:
        return await self._ap_post(f"/v1/webhooks/{flow_id}", payload or {})

    async def trigger_flow_sync(self, flow_id: str, payload: Optional[Dict[str, Any]] = None) -> Any:
        return await self._ap_post(f"/v1/webhooks/{flow_id}/sync", payload or {})

    # ── Flow Runs ──────────────────────────────────────────────────────────────

    async def list_runs(self, limit: int = 10, cursor: Optional[str] = None,
                        flow_id: Optional[str] = None, status: Optional[str] = None,
                        project_id: Optional[str] = None) -> Dict[str, Any]:
        return await self._ap_get("/v1/flow-runs", {"limit": limit, "cursor": cursor,
                                                     "flowId": flow_id, "status": status,
                                                     "projectId": project_id})

    async def get_run(self, run_id: str) -> Dict[str, Any]:
        return await self._ap_get(f"/v1/flow-runs/{run_id}")

    # ── Folders ────────────────────────────────────────────────────────────────

    async def list_folders(self, limit: int = 10, cursor: Optional[str] = None) -> Dict[str, Any]:
        return await self._ap_get("/v1/folders", {"limit": limit, "cursor": cursor})

    async def get_folder(self, folder_id: str) -> Dict[str, Any]:
        return await self._ap_get(f"/v1/folders/{folder_id}")

    async def create_folder(self, display_name: str, project_id: str) -> Dict[str, Any]:
        return await self._ap_post("/v1/folders", {"displayName": display_name, "projectId": project_id})

    async def update_folder(self, folder_id: str, display_name: str) -> Dict[str, Any]:
        return await self._ap_post(f"/v1/folders/{folder_id}", {"displayName": display_name})

    async def delete_folder(self, folder_id: str) -> None:
        await self._ap_delete(f"/v1/folders/{folder_id}")

    # ── App Connections ────────────────────────────────────────────────────────

    async def list_connections(self, limit: int = 10, cursor: Optional[str] = None,
                                project_id: Optional[str] = None,
                                piece_name: Optional[str] = None) -> Dict[str, Any]:
        return await self._ap_get("/v1/app-connections", {"limit": limit, "cursor": cursor,
                                                           "projectId": project_id,
                                                           "pieceName": piece_name})

    async def get_connection(self, connection_id: str) -> Dict[str, Any]:
        return await self._ap_get(f"/v1/app-connections/{connection_id}")

    async def upsert_connection(self, body: Dict[str, Any]) -> Dict[str, Any]:
        return await self._ap_post("/v1/app-connections", body)

    async def delete_connection(self, connection_id: str) -> None:
        await self._ap_delete(f"/v1/app-connections/{connection_id}")

    # ── Pieces ─────────────────────────────────────────────────────────────────

    async def list_pieces(self, limit: int = 10) -> List[Dict[str, Any]]:
        return await self._ap_get("/v1/pieces", {"limit": limit})

    # ── Triggers ───────────────────────────────────────────────────────────────

    async def get_trigger_run_status(self) -> Dict[str, Any]:
        return await self._ap_get("/v1/trigger-runs/status")

    async def test_trigger(self, body: Dict[str, Any]) -> Any:
        return await self._ap_post("/v1/test-trigger", body)

    # ── Tables & Records ───────────────────────────────────────────────────────

    async def list_tables(self, limit: int = 10, cursor: Optional[str] = None) -> Dict[str, Any]:
        return await self._ap_get("/v1/tables", {"limit": limit, "cursor": cursor})

    async def get_table(self, table_id: str) -> Dict[str, Any]:
        return await self._ap_get(f"/v1/tables/{table_id}")

    async def list_records(self, table_id: str, limit: int = 10,
                            cursor: Optional[str] = None) -> Dict[str, Any]:
        return await self._ap_get("/v1/records", {"tableId": table_id, "limit": limit,
                                                   "cursor": cursor})

    # ── MCP Servers ────────────────────────────────────────────────────────────

    async def list_mcp_servers(self, project_id: str) -> Dict[str, Any]:
        return await self._ap_get("/v1/mcp-servers", {"projectId": project_id})

    async def get_mcp_server(self, mcp_server_id: str) -> Dict[str, Any]:
        return await self._ap_get(f"/v1/mcp-servers/{mcp_server_id}")

    async def create_mcp_server(self, body: Dict[str, Any]) -> Dict[str, Any]:
        return await self._ap_post("/v1/mcp-servers", body)

    async def delete_mcp_server(self, mcp_server_id: str) -> None:
        await self._ap_delete(f"/v1/mcp-servers/{mcp_server_id}")

    async def rotate_mcp_token(self, mcp_server_id: str) -> Dict[str, Any]:
        return await self._ap_post(f"/v1/mcp-servers/{mcp_server_id}/rotate")

    # ── User Invitations ───────────────────────────────────────────────────────

    async def list_invitations(self, type: Literal["PLATFORM", "PROJECT"], limit: int = 10,
                                cursor: Optional[str] = None,
                                project_id: Optional[str] = None) -> Dict[str, Any]:
        return await self._ap_get("/v1/user-invitations", {"type": type, "limit": limit,
                                                            "cursor": cursor,
                                                            "projectId": project_id})

    async def delete_invitation(self, invitation_id: str) -> None:
        await self._ap_delete(f"/v1/user-invitations/{invitation_id}")
