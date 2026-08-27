from typing import Any, Dict, List, Optional
from ..http import HttpTransport, AsyncHttpTransport


class TeamsResource:
    """Teams domain — Sync. All routes via platform-service."""

    def __init__(self, http: HttpTransport, base: str):
        self._http = http
        self._base = base.rstrip("/")

    @property
    def _v1(self) -> str:
        return f"{self._base}/v1"

    @property
    def _v2(self) -> str:
        return f"{self._base}/v2"

    def upload_icon(self, files: Any) -> Dict[str, Any]:
        return self._http.request("POST", f"{self._v1}/teams/_fileupload", files=files).json()

    def list(self, limit: Optional[int] = None, skip: Optional[int] = None, q: Optional[str] = None) -> Dict[str, Any]:
        params: Dict[str, Any] = {}
        if limit is not None:
            params["limit"] = limit
        if skip is not None:
            params["skip"] = skip
        if q:
            params["q"] = q
        return self._http.request("GET", f"{self._v1}/teams", params=params).json()

    def list_my(self) -> Dict[str, Any]:
        return self._http.request("GET", f"{self._v2}/teams/my").json()

    def create(self, body: Dict[str, Any]) -> Dict[str, Any]:
        return self._http.request("POST", f"{self._v1}/teams", json=body).json()

    def update(self, team_id: str, body: Dict[str, Any]) -> Dict[str, Any]:
        return self._http.request("PUT", f"{self._v2}/teams/{team_id}", json=body).json()

    def delete(self, team_id: str) -> Dict[str, Any]:
        return self._http.request("DELETE", f"{self._v2}/teams/{team_id}").json()

    def add_users(self, team_id: str, user_ids: List[str]) -> Dict[str, Any]:
        return self._http.request("POST", f"{self._v2}/teams/_add_users",
                                  json={"team_id": team_id, "user_ids": user_ids}).json()

    def remove_users(self, user_ids: List[str]) -> Dict[str, Any]:
        return self._http.request("POST", f"{self._v2}/teams/_remove_users",
                                  json={"user_ids": user_ids}).json()

    def get_users(self, team_id: str) -> Dict[str, Any]:
        return self._http.request("GET", f"{self._v1}/team_users",
                                  params={"team_id": team_id}).json()

    # --- Membership actions ---
    def get_workflows(self, team_id: str) -> Any:
        return self._http.request("GET", f"{self._v1}/teams/{team_id}/workflows").json()

    def join(self, body: Dict[str, Any]) -> Dict[str, Any]:
        return self._http.request("POST", f"{self._v2}/teams/_join_team", json=body).json()

    def leave(self, body: Dict[str, Any]) -> Dict[str, Any]:
        return self._http.request("POST", f"{self._v2}/teams/_leave", json=body).json()

    def request_join(self, team_id: str, body: Dict[str, Any]) -> Dict[str, Any]:
        return self._http.request(
            "POST", f"{self._v2}/teams/{team_id}/join_request", json=body
        ).json()

    def approve_join_request(self, team_id: str, team_user_id: str) -> Dict[str, Any]:
        return self._http.request(
            "POST", f"{self._v2}/teams/{team_id}/user/{team_user_id}/approve"
        ).json()

    def update_user_role(self, team_id: str, team_user_id: str,
                         body: Dict[str, Any]) -> Dict[str, Any]:
        return self._http.request(
            "PUT", f"{self._v2}/teams/{team_id}/user/{team_user_id}/role", json=body
        ).json()


class AsyncTeamsResource:
    """Teams domain — Async. All routes via platform-service."""

    def __init__(self, http: AsyncHttpTransport, base: str):
        self._http = http
        self._base = base.rstrip("/")

    @property
    def _v1(self) -> str:
        return f"{self._base}/v1"

    @property
    def _v2(self) -> str:
        return f"{self._base}/v2"

    async def upload_icon(self, files: Any) -> Dict[str, Any]:
        res = await self._http.request("POST", f"{self._v1}/teams/_fileupload", files=files)
        return res.json()

    async def list(self, limit: Optional[int] = None, skip: Optional[int] = None, q: Optional[str] = None) -> Dict[str, Any]:
        params: Dict[str, Any] = {}
        if limit is not None:
            params["limit"] = limit
        if skip is not None:
            params["skip"] = skip
        if q:
            params["q"] = q
        res = await self._http.request("GET", f"{self._v1}/teams", params=params)
        return res.json()

    async def list_my(self) -> Dict[str, Any]:
        res = await self._http.request("GET", f"{self._v2}/teams/my")
        return res.json()

    async def create(self, body: Dict[str, Any]) -> Dict[str, Any]:
        res = await self._http.request("POST", f"{self._v1}/teams", json=body)
        return res.json()

    async def update(self, team_id: str, body: Dict[str, Any]) -> Dict[str, Any]:
        res = await self._http.request("PUT", f"{self._v2}/teams/{team_id}", json=body)
        return res.json()

    async def delete(self, team_id: str) -> Dict[str, Any]:
        res = await self._http.request("DELETE", f"{self._v2}/teams/{team_id}")
        return res.json()

    async def add_users(self, team_id: str, user_ids: List[str]) -> Dict[str, Any]:
        res = await self._http.request("POST", f"{self._v2}/teams/_add_users",
                                       json={"team_id": team_id, "user_ids": user_ids})
        return res.json()

    # --- Membership actions ---
    async def get_workflows(self, team_id: str) -> Any:
        res = await self._http.request("GET", f"{self._v1}/teams/{team_id}/workflows")
        return res.json()

    async def join(self, body: Dict[str, Any]) -> Dict[str, Any]:
        res = await self._http.request("POST", f"{self._v2}/teams/_join_team", json=body)
        return res.json()

    async def leave(self, body: Dict[str, Any]) -> Dict[str, Any]:
        res = await self._http.request("POST", f"{self._v2}/teams/_leave", json=body)
        return res.json()

    async def request_join(self, team_id: str, body: Dict[str, Any]) -> Dict[str, Any]:
        res = await self._http.request(
            "POST", f"{self._v2}/teams/{team_id}/join_request", json=body
        )
        return res.json()

    async def approve_join_request(self, team_id: str, team_user_id: str) -> Dict[str, Any]:
        res = await self._http.request(
            "POST", f"{self._v2}/teams/{team_id}/user/{team_user_id}/approve"
        )
        return res.json()

    async def update_user_role(self, team_id: str, team_user_id: str,
                               body: Dict[str, Any]) -> Dict[str, Any]:
        res = await self._http.request(
            "PUT", f"{self._v2}/teams/{team_id}/user/{team_user_id}/role", json=body
        )
        return res.json()

    async def remove_users(self, user_ids: List[str]) -> Dict[str, Any]:
        res = await self._http.request("POST", f"{self._v2}/teams/_remove_users",
                                       json={"user_ids": user_ids})
        return res.json()

    async def get_users(self, team_id: str) -> Dict[str, Any]:
        res = await self._http.request("GET", f"{self._v1}/team_users",
                                       params={"team_id": team_id})
        return res.json()
