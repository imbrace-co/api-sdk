from typing import Any, Dict
from ..http import HttpTransport, AsyncHttpTransport


class OrganizationsResource:
    """Organizations domain — Sync.

    @param base - platform service base URL (gateway/platform)
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

    def list(self, limit: int = 10, skip: int = 0) -> Dict[str, Any]:
        # Two endpoints, two middleware: paged `/v1/organizations` accepts the
        # `login_acc_` token (post-login/OTP picker); `/v2/organizations/_all`
        # requires an org-scoped `acc_`. Route by token prefix.
        token = self._http.token_manager.get_token()
        if token and token.startswith("login_acc_"):
            return self.list_for_login(limit=limit, skip=skip)
        return self.list_all()

    def list_for_login(self, limit: int = 10, skip: int = 0) -> Dict[str, Any]:
        """Paged `/v1/organizations` — the post-login picker endpoint.

        Accepts a `login_acc_` token. The `/v2/organizations` route rejects it
        with 401 on the prod-v2 gateway, so the login phase must use `/v1`.
        """
        return self._http.request("GET", f"{self._v1}/organizations",
                                  params={"limit": limit, "skip": skip}).json()

    def create(self, body: Dict[str, Any]) -> Dict[str, Any]:
        return self._http.request("POST", f"{self._v1}/organizations", json=body).json()

    def list_all(self) -> Dict[str, Any]:
        return self._http.request("GET", f"{self._v2}/organizations/_all").json()


class AsyncOrganizationsResource:
    """Organizations domain — Async."""

    def __init__(self, http: AsyncHttpTransport, base: str):
        self._http = http
        self._base = base.rstrip("/")

    @property
    def _v1(self) -> str:
        return f"{self._base}/v1"

    @property
    def _v2(self) -> str:
        return f"{self._base}/v2"

    async def list(self, limit: int = 10, skip: int = 0) -> Dict[str, Any]:
        # Two endpoints, two middleware: paged `/v1/organizations` accepts the
        # `login_acc_` token (post-login/OTP picker); `/v2/organizations/_all`
        # requires an org-scoped `acc_`. Route by token prefix.
        token = self._http.token_manager.get_token()
        if token and token.startswith("login_acc_"):
            return await self.list_for_login(limit=limit, skip=skip)
        return await self.list_all()

    async def list_for_login(self, limit: int = 10, skip: int = 0) -> Dict[str, Any]:
        """Paged `/v1/organizations` — the post-login picker endpoint.

        Accepts a `login_acc_` token. The `/v2/organizations` route rejects it
        with 401 on the prod-v2 gateway, so the login phase must use `/v1`.
        """
        res = await self._http.request("GET", f"{self._v1}/organizations",
                                       params={"limit": limit, "skip": skip})
        return res.json()

    async def create(self, body: Dict[str, Any]) -> Dict[str, Any]:
        res = await self._http.request("POST", f"{self._v1}/organizations", json=body)
        return res.json()

    async def list_all(self) -> Dict[str, Any]:
        res = await self._http.request("GET", f"{self._v2}/organizations/_all")
        return res.json()
