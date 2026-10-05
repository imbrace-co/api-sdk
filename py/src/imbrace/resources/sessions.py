from typing import Optional, Any
from ..http import HttpTransport, AsyncHttpTransport
from .retired import retired

_REASON = "no iMBrace service serves /session anymore"


class SessionsResource:
    """Sessions domain — Sync. Deprecated: the gateway no longer serves ``/session``; every method raises."""
    def __init__(self, http: HttpTransport, base: str):
        self._http = http
        self._base = base

    def list(self, directory: Optional[str] = None, workspace: Optional[str] = None) -> Any:
        """Deprecated — raises."""
        retired("sessions.list", _REASON)

    def get(self, session_id: str, directory: Optional[str] = None) -> Any:
        """Deprecated — raises."""
        retired("sessions.get", _REASON)

    def create(self, directory: Optional[str] = None, workspace: Optional[str] = None) -> Any:
        """Deprecated — raises."""
        retired("sessions.create", _REASON)

    def delete(self, session_id: str) -> Any:
        """Deprecated — raises."""
        retired("sessions.delete", _REASON)


class AsyncSessionsResource:
    """Sessions domain — Async. Deprecated: the gateway no longer serves ``/session``; every method raises."""
    def __init__(self, http: AsyncHttpTransport, base: str):
        self._http = http
        self._base = base

    async def list(self, directory: Optional[str] = None, workspace: Optional[str] = None) -> Any:
        """Deprecated — raises."""
        retired("sessions.list", _REASON)

    async def get(self, session_id: str, directory: Optional[str] = None) -> Any:
        """Deprecated — raises."""
        retired("sessions.get", _REASON)

    async def create(self, directory: Optional[str] = None, workspace: Optional[str] = None) -> Any:
        """Deprecated — raises."""
        retired("sessions.create", _REASON)

    async def delete(self, session_id: str) -> Any:
        """Deprecated — raises."""
        retired("sessions.delete", _REASON)
