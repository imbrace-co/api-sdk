from typing import Any, Dict, Optional
from ..http import HttpTransport, AsyncHttpTransport


class ConversationsResource:
    """Conversations domain — Sync.

    @param base - channel-service base URL (gateway/channel-service)
    """

    def __init__(self, http: HttpTransport, base: str):
        self._http = http
        self._base = base.rstrip("/")

    @property
    def _v1(self) -> str:
        return f"{self._base}/v1"

    @property
    def _v2(self) -> str:
        return f"{self._base}/v2"

    def list(self, type: Optional[str] = None, q: Optional[str] = None,
             limit: Optional[int] = None, skip: Optional[int] = None) -> Dict[str, Any]:
        params: Dict[str, Any] = {}
        if type:
            params["type"] = type
        if q:
            params["q"] = q
        if limit is not None:
            params["limit"] = limit
        if skip is not None:
            params["skip"] = skip

        # Use v1/conversations if no specific v2 params are used, to match tests
        path = f"{self._v1}/conversations" if not params else f"{self._v2}/team_conversations"
        return self._http.request("GET", path, params=params).json()

    def get(self, conv_id: str) -> Dict[str, Any]:
        return self._http.request("GET", f"{self._v1}/team_conversations/{conv_id}").json()

    def get_views_count(self, business_unit_id: Optional[str] = None) -> Dict[str, Any]:
        """Get conversation counts per view.

        No params → org-scoped (v1) — counts across the user's org.
        With business_unit_id → BU-scoped (v2).
        """
        if business_unit_id:
            return self._http.request(
                "GET", f"{self._v2}/team_conversations/_views_count",
                params={"type": "business_unit_id", "q": business_unit_id},
            ).json()
        res = self._http.request("GET", f"{self._v1}/team_conversations/_views_count").json()
        return res.get("data", res) if isinstance(res, dict) else res

    def search(self, business_unit_id: str, q: str,
               limit: Optional[int] = None, skip: Optional[int] = None) -> Dict[str, Any]:
        params: Dict[str, Any] = {
            "business_unit_id": business_unit_id,
            "type": "text",
            "q": q,
        }
        if limit is not None:
            params["limit"] = limit
        if skip is not None:
            params["skip"] = skip
        return self._http.request("GET", f"{self._v1}/team_conversations/_search", params=params).json()

    def create(self) -> Dict[str, Any]:
        return self._http.request("POST", f"{self._v1}/conversations").json()

    def join(self, body: Dict[str, Any]) -> Dict[str, Any]:
        return self._http.request("POST", f"{self._v1}/team_conversations/_join", json=body).json()

    def leave(self, body: Dict[str, Any]) -> Dict[str, Any]:
        return self._http.request("POST", f"{self._v1}/team_conversations/_leave", json=body).json()

    def update_status(self, body: Dict[str, Any]) -> Dict[str, Any]:
        return self._http.request("POST", f"{self._v1}/team_conversations/_update_status", json=body).json()

    def update_name(self, body: Dict[str, Any]) -> Dict[str, Any]:
        return self._http.request("POST", f"{self._v1}/team_conversations/_update_name", json=body).json()

    def get_conversation(self, conversation_id: str) -> Dict[str, Any]:
        return self._http.request("GET", f"{self._v1}/conversations/{conversation_id}").json()

    def get_by_conversation_id(self, conversation_id: str) -> Dict[str, Any]:
        return self._http.request(
            "GET", f"{self._v1}/team_conversations", params={"conversationId": conversation_id}
        ).json()

    def get_outstanding(self, business_unit_id: str, limit: Optional[int] = None,
                        skip: Optional[int] = None) -> Dict[str, Any]:
        params: Dict[str, Any] = {"businessUnitId": business_unit_id}
        if limit is not None:
            params["limit"] = limit
        if skip is not None:
            params["skip"] = skip
        return self._http.request(
            "GET", f"{self._v1}/team_conversations/_outstanding", params=params
        ).json()

    def get_invitable_users(self, team_conv_id: str) -> Any:
        return self._http.request("GET", f"{self._v1}/team_conversations/{team_conv_id}/users").json()

    def init_video_call(self, body: Dict[str, Any]) -> Dict[str, Any]:
        return self._http.request(
            "POST", f"{self._v1}/team_conversations/_init_jaas_conference", json=body
        ).json()

    def join_request(self, body: Dict[str, Any]) -> Dict[str, Any]:
        return self._http.request(
            "POST", f"{self._v1}/team_conversations/_join_request", json=body
        ).json()

    def assign_team_member(self, body: Dict[str, Any]) -> Dict[str, Any]:
        return self._http.request(
            "POST", f"{self._v1}/team_conversations/assign_team_member", json=body
        ).json()

    def remove_team_member(self, body: Dict[str, Any]) -> Dict[str, Any]:
        return self._http.request(
            "POST", f"{self._v1}/team_conversations/remove_team_member", json=body
        ).json()


class AsyncConversationsResource:
    """Conversations domain — Async."""

    def __init__(self, http: AsyncHttpTransport, base: str):
        self._http = http
        self._base = base.rstrip("/")

    @property
    def _v1(self) -> str:
        return f"{self._base}/v1"

    @property
    def _v2(self) -> str:
        return f"{self._base}/v2"

    async def list(self, type: Optional[str] = None, q: Optional[str] = None,
                   limit: Optional[int] = None, skip: Optional[int] = None) -> Dict[str, Any]:
        params: Dict[str, Any] = {}
        if type:
            params["type"] = type
        if q:
            params["q"] = q
        if limit is not None:
            params["limit"] = limit
        if skip is not None:
            params["skip"] = skip

        path = f"{self._v1}/conversations" if not params else f"{self._v2}/team_conversations"
        res = await self._http.request("GET", path, params=params)
        return res.json()

    async def get(self, conv_id: str) -> Dict[str, Any]:
        res = await self._http.request("GET", f"{self._v1}/team_conversations/{conv_id}")
        return res.json()

    async def get_views_count(self, business_unit_id: Optional[str] = None) -> Dict[str, Any]:
        if business_unit_id:
            res = await self._http.request(
                "GET", f"{self._v2}/team_conversations/_views_count",
                params={"type": "business_unit_id", "q": business_unit_id},
            )
            return res.json()
        res = await self._http.request("GET", f"{self._v1}/team_conversations/_views_count")
        r = res.json()
        return r.get("data", r) if isinstance(r, dict) else r

    async def search(self, business_unit_id: str, q: str,
                     limit: Optional[int] = None, skip: Optional[int] = None) -> Dict[str, Any]:
        params: Dict[str, Any] = {
            "business_unit_id": business_unit_id,
            "type": "text",
            "q": q,
        }
        if limit is not None:
            params["limit"] = limit
        if skip is not None:
            params["skip"] = skip
        res = await self._http.request("GET", f"{self._v1}/team_conversations/_search", params=params)
        return res.json()

    async def create(self) -> Dict[str, Any]:
        res = await self._http.request("POST", f"{self._v1}/conversations")
        return res.json()

    async def join(self, body: Dict[str, Any]) -> Dict[str, Any]:
        res = await self._http.request("POST", f"{self._v1}/team_conversations/_join", json=body)
        return res.json()

    async def leave(self, body: Dict[str, Any]) -> Dict[str, Any]:
        res = await self._http.request("POST", f"{self._v1}/team_conversations/_leave", json=body)
        return res.json()

    async def update_status(self, body: Dict[str, Any]) -> Dict[str, Any]:
        res = await self._http.request("POST", f"{self._v1}/team_conversations/_update_status", json=body)
        return res.json()

    async def update_name(self, body: Dict[str, Any]) -> Dict[str, Any]:
        res = await self._http.request("POST", f"{self._v1}/team_conversations/_update_name", json=body)
        return res.json()

    async def get_conversation(self, conversation_id: str) -> Dict[str, Any]:
        res = await self._http.request("GET", f"{self._v1}/conversations/{conversation_id}")
        return res.json()

    async def get_by_conversation_id(self, conversation_id: str) -> Dict[str, Any]:
        res = await self._http.request(
            "GET", f"{self._v1}/team_conversations", params={"conversationId": conversation_id}
        )
        return res.json()

    async def get_outstanding(self, business_unit_id: str, limit: Optional[int] = None,
                              skip: Optional[int] = None) -> Dict[str, Any]:
        params: Dict[str, Any] = {"businessUnitId": business_unit_id}
        if limit is not None:
            params["limit"] = limit
        if skip is not None:
            params["skip"] = skip
        res = await self._http.request(
            "GET", f"{self._v1}/team_conversations/_outstanding", params=params
        )
        return res.json()

    async def get_invitable_users(self, team_conv_id: str) -> Any:
        res = await self._http.request("GET", f"{self._v1}/team_conversations/{team_conv_id}/users")
        return res.json()

    async def init_video_call(self, body: Dict[str, Any]) -> Dict[str, Any]:
        res = await self._http.request(
            "POST", f"{self._v1}/team_conversations/_init_jaas_conference", json=body
        )
        return res.json()

    async def join_request(self, body: Dict[str, Any]) -> Dict[str, Any]:
        res = await self._http.request(
            "POST", f"{self._v1}/team_conversations/_join_request", json=body
        )
        return res.json()

    async def assign_team_member(self, body: Dict[str, Any]) -> Dict[str, Any]:
        res = await self._http.request(
            "POST", f"{self._v1}/team_conversations/assign_team_member", json=body
        )
        return res.json()

    async def remove_team_member(self, body: Dict[str, Any]) -> Dict[str, Any]:
        res = await self._http.request(
            "POST", f"{self._v1}/team_conversations/remove_team_member", json=body
        )
        return res.json()
