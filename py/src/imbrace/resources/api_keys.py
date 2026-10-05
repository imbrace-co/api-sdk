from typing import Any, Dict, List, Optional
from ..exceptions import ApiError
from ..http import HttpTransport, AsyncHttpTransport


def _key_listed(keys: Any, key_id: str) -> bool:
    return isinstance(keys, list) and any(isinstance(k, dict) and k.get("_id") == key_id for k in keys)


class ApiKeysResource:
    """API keys of the calling user (platform ``third_party_token`` / ``api_key_token``) — Sync.

    @param base - platform base URL (``{gateway}/platform``)
    """

    def __init__(self, http: HttpTransport, base: str):
        self._http = http
        self._base = base.rstrip("/")

    def list(self) -> List[Dict[str, Any]]:
        """The caller's keys in this org. Tokens are not included."""
        return self._http.request("GET", f"{self._base}/v1/api_key_token").json()

    def create(self, body: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """Create a key (``{name?, expirationDays?, neverExpire?, permissions?}``; expiry defaults to 365 days).

        The returned ``token`` is shown only once; store it.
        """
        res = self._http.request("POST", f"{self._base}/v1/third_party_token", json=body or {}).json()
        return res.get("apiKey") or res if isinstance(res, dict) else res

    def delete(self, key_id: str) -> None:
        try:
            self._http.request("DELETE", f"{self._base}/v1/third_party_token/{key_id}")
        except ApiError as e:
            # platform answers 404 even when it did delete the key; trust the list instead
            if e.status_code != 404 or _key_listed(self.list(), key_id):
                raise


class AsyncApiKeysResource:
    """API keys of the calling user — Async. See :class:`ApiKeysResource`."""

    def __init__(self, http: AsyncHttpTransport, base: str):
        self._http = http
        self._base = base.rstrip("/")

    async def list(self) -> List[Dict[str, Any]]:
        """The caller's keys in this org. Tokens are not included."""
        res = await self._http.request("GET", f"{self._base}/v1/api_key_token")
        return res.json()

    async def create(self, body: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """Create a key. The returned ``token`` is shown only once; store it."""
        res = (await self._http.request("POST", f"{self._base}/v1/third_party_token", json=body or {})).json()
        return res.get("apiKey") or res if isinstance(res, dict) else res

    async def delete(self, key_id: str) -> None:
        try:
            await self._http.request("DELETE", f"{self._base}/v1/third_party_token/{key_id}")
        except ApiError as e:
            if e.status_code != 404 or _key_listed(await self.list(), key_id):
                raise
