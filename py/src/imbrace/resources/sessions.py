from typing import Optional, Any
from ..http import HttpTransport, AsyncHttpTransport


class SessionsResource:
    """Sessions domain — Sync. 1 file = 1 domain."""
    def __init__(self, http: HttpTransport, base: str):
        self._http = http
        self._base = base

    def list(self, directory: Optional[str] = None, workspace: Optional[str] = None) -> Any:
        params = {}
        if directory:
            params["directory"] = directory
        if workspace:
            params["workspace"] = workspace
        return self._http.request("GET", f"{self._base}/session", params=params).json()

    def get(self, session_id: str, directory: Optional[str] = None) -> Any:
        params = {"directory": directory} if directory else {}
        return self._http.request("GET", f"{self._base}/session/{session_id}", params=params).json()

    def create(self, directory: Optional[str] = None, workspace: Optional[str] = None) -> Any:
        body: dict = {}
        if directory:
            body["directory"] = directory
        if workspace:
            body["workspace"] = workspace
        return self._http.request("POST", f"{self._base}/session", json=body).json()

    def delete(self, session_id: str) -> Any:
        return self._http.request("DELETE", f"{self._base}/session/{session_id}").json()


class AsyncSessionsResource:
    """Sessions domain — Async. 1 file = 1 domain."""
    def __init__(self, http: AsyncHttpTransport, base: str):
        self._http = http
        self._base = base

    async def list(self, directory: Optional[str] = None, workspace: Optional[str] = None) -> Any:
        params = {}
        if directory:
            params["directory"] = directory
        if workspace:
            params["workspace"] = workspace
        res = await self._http.request("GET", f"{self._base}/session", params=params)
        return res.json()

    async def get(self, session_id: str, directory: Optional[str] = None) -> Any:
        params = {"directory": directory} if directory else {}
        res = await self._http.request("GET", f"{self._base}/session/{session_id}", params=params)
        return res.json()

    async def create(self, directory: Optional[str] = None, workspace: Optional[str] = None) -> Any:
        body: dict = {}
        if directory:
            body["directory"] = directory
        if workspace:
            body["workspace"] = workspace
        res = await self._http.request("POST", f"{self._base}/session", json=body)
        return res.json()

    async def delete(self, session_id: str) -> Any:
        res = await self._http.request("DELETE", f"{self._base}/session/{session_id}")
        return res.json()
