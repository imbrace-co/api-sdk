from typing import Any, Dict, List, Optional
from ..http import HttpTransport, AsyncHttpTransport


def _query(params: Dict[str, Any]) -> Dict[str, Any]:
    return {k: v for k, v in params.items() if v is not None}


class RolesResource:
    """Organization roles and their permissions (platform ``/v1/roles``) — Sync.

    Writes need an org admin and the ``rbac`` feature.

    @param base - platform base URL (``{gateway}/platform``)
    """

    def __init__(self, http: HttpTransport, base: str):
        self._http = http
        self._v1 = f"{base.rstrip('/')}/v1"

    def list_permissions(self, scope: Optional[str] = None) -> Dict[str, Any]:
        """Every permission a role can hold (``{groups, all, wildcard?}``). ``scope``: ``"org"`` | ``"team"``."""
        return self._http.request("GET", f"{self._v1}/roles/permissions", params=_query({"scope": scope})).json()

    def list(self, limit: Optional[int] = None, skip: Optional[int] = None,
             scope: Optional[str] = None, team_id: Optional[str] = None) -> Dict[str, Any]:
        """``{data, count, has_more}``."""
        params = _query({"limit": limit, "skip": skip, "scope": scope, "team_id": team_id})
        return self._http.request("GET", f"{self._v1}/roles", params=params).json()

    def get(self, role_id: str) -> Dict[str, Any]:
        return self._http.request("GET", f"{self._v1}/roles/{role_id}").json()

    def create(self, body: Dict[str, Any]) -> Dict[str, Any]:
        """Create a role: ``{key, name, description?, permissions?, priority?, scope?, team_id?}``.

        ``key`` is a lowercase id (``^[a-z][a-z0-9_]{1,49}$``) that must not clash with a system role.
        """
        return self._http.request("POST", f"{self._v1}/roles", json=body).json()

    def update(self, role_id: str, body: Dict[str, Any]) -> Dict[str, Any]:
        """``{name?, description?, permissions?, priority?, is_active?}``."""
        return self._http.request("PUT", f"{self._v1}/roles/{role_id}", json=body).json()

    def delete(self, role_id: str) -> Dict[str, Any]:
        """Fails with 409 while users still hold the role."""
        return self._http.request("DELETE", f"{self._v1}/roles/{role_id}").json()

    def assign(self, user_id: str, role: str) -> Dict[str, Any]:
        """Give a user a role (by role key)."""
        return self._http.request("POST", f"{self._v1}/users/_change_role",
                                  json={"user_id": user_id, "role": role}).json()

    def assign_many(self, user_ids: List[str], role: str) -> Dict[str, Any]:
        """Give several users a role in one call."""
        return self._http.request("POST", f"{self._v1}/users/_bulk_change_role",
                                  json={"user_ids": user_ids, "role": role}).json()


class AsyncRolesResource:
    """Organization roles and their permissions — Async. See :class:`RolesResource`."""

    def __init__(self, http: AsyncHttpTransport, base: str):
        self._http = http
        self._v1 = f"{base.rstrip('/')}/v1"

    async def list_permissions(self, scope: Optional[str] = None) -> Dict[str, Any]:
        res = await self._http.request("GET", f"{self._v1}/roles/permissions", params=_query({"scope": scope}))
        return res.json()

    async def list(self, limit: Optional[int] = None, skip: Optional[int] = None,
                   scope: Optional[str] = None, team_id: Optional[str] = None) -> Dict[str, Any]:
        params = _query({"limit": limit, "skip": skip, "scope": scope, "team_id": team_id})
        res = await self._http.request("GET", f"{self._v1}/roles", params=params)
        return res.json()

    async def get(self, role_id: str) -> Dict[str, Any]:
        res = await self._http.request("GET", f"{self._v1}/roles/{role_id}")
        return res.json()

    async def create(self, body: Dict[str, Any]) -> Dict[str, Any]:
        res = await self._http.request("POST", f"{self._v1}/roles", json=body)
        return res.json()

    async def update(self, role_id: str, body: Dict[str, Any]) -> Dict[str, Any]:
        res = await self._http.request("PUT", f"{self._v1}/roles/{role_id}", json=body)
        return res.json()

    async def delete(self, role_id: str) -> Dict[str, Any]:
        """Fails with 409 while users still hold the role."""
        res = await self._http.request("DELETE", f"{self._v1}/roles/{role_id}")
        return res.json()

    async def assign(self, user_id: str, role: str) -> Dict[str, Any]:
        res = await self._http.request("POST", f"{self._v1}/users/_change_role",
                                       json={"user_id": user_id, "role": role})
        return res.json()

    async def assign_many(self, user_ids: List[str], role: str) -> Dict[str, Any]:
        res = await self._http.request("POST", f"{self._v1}/users/_bulk_change_role",
                                       json={"user_ids": user_ids, "role": role})
        return res.json()
