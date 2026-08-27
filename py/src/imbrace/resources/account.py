from typing import Any, Dict, Optional
from ..http import HttpTransport, AsyncHttpTransport
from ..types.common import ApiResponse
from ..types.platform import User


class AccountResource:
    """Account domain — Sync.

    @param base - platform service base URL (gateway/platform)
    """

    def __init__(self, http: HttpTransport, base: str):
        self._http = http
        self._base = base.rstrip("/")

    @property
    def _v1(self) -> str:
        return f"{self._base}/v1"

    def get(self) -> User:
        """Get current account information."""
        res = self._http.request("GET", f"{self._v1}/account").json()
        # If the server returns a wrapped ApiResponse, extract the data.
        # Assume the server returns a User dict or ApiResponse[User] directly.
        if "data" in res and "success" in res:
            return User(**res["data"])
        return User(**res)

    def update(self, body: Dict[str, Any]) -> User:
        """Update account information."""
        res = self._http.request("PUT", f"{self._v1}/account", json=body).json()
        if "data" in res and "success" in res:
            return User(**res["data"])
        return User(**res)

    def upload_avatar(self, files: Any) -> Dict[str, Any]:
        """Upload an avatar for the current account."""
        return self._http.request("POST", f"{self._v1}/account/_fileupload", files=files).json()

    # Aliases matching the TypeScript SDK's getAccount / updateAccount names.
    def get_account(self) -> User:
        return self.get()

    def update_account(self, body: Dict[str, Any]) -> User:
        return self.update(body)


class AsyncAccountResource:
    """Account domain — Async."""

    def __init__(self, http: AsyncHttpTransport, base: str):
        self._http = http
        self._base = base.rstrip("/")

    @property
    def _v1(self) -> str:
        return f"{self._base}/v1"

    async def get(self) -> User:
        """Get current account information (async)."""
        res = await self._http.request("GET", f"{self._v1}/account")
        data = res.json()
        if "data" in data and "success" in data:
            return User(**data["data"])
        return User(**data)

    async def update(self, body: Dict[str, Any]) -> User:
        """Update account information (async)."""
        res = await self._http.request("PUT", f"{self._v1}/account", json=body)
        data = res.json()
        if "data" in data and "success" in data:
            return User(**data["data"])
        return User(**data)

    async def upload_avatar(self, files: Any) -> Dict[str, Any]:
        """Upload an avatar for the current account (async)."""
        res = await self._http.request("POST", f"{self._v1}/account/_fileupload", files=files)
        return res.json()

    # Aliases matching the TypeScript SDK's getAccount / updateAccount names.
    async def get_account(self) -> User:
        return await self.get()

    async def update_account(self, body: Dict[str, Any]) -> User:
        return await self.update(body)
