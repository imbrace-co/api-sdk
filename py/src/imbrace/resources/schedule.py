from typing import Any, Dict, Optional
from ..http import HttpTransport, AsyncHttpTransport


class ScheduleResource:
    """Schedule domain — Sync. Schedulers live in data-board.

    @param base - data-board v1 base URL (gateway/data-board/v1)
    """

    def __init__(self, http: HttpTransport, base: str):
        self._http = http
        self._base = f"{base.rstrip('/')}/schedulers"

    def list(self, params: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        return self._http.request("GET", self._base, params=params or {}).json()

    def get(self, scheduler_id: str) -> Dict[str, Any]:
        return self._http.request("GET", f"{self._base}/{scheduler_id}").json()

    def create(self, body: Dict[str, Any]) -> Dict[str, Any]:
        """Create a scheduler.

        Required: ``name``, ``event_type``, ``job`` (``{type: "kafka"|"webhook", ...}``).
        ``type="non_recurring"`` (default) runs once at ``start_date`` (``YYYY-MM-DD``)
        + ``start_time`` (``HH:mm``). ``"recurring"`` also needs
        ``trigger_frequency_unit`` (days|weeks|months|years),
        ``trigger_frequency_value`` and ``trigger_time``, plus
        ``trigger_day_of_week`` (weeks), ``trigger_day_of_month`` (months) or
        ``triger_month_and_day`` (years — the server spells it this way).
        The start must be in the future.
        """
        return self._http.request("POST", self._base, json=body).json()

    def update(self, scheduler_id: str, body: Dict[str, Any]) -> Dict[str, Any]:
        """Replace the scheduler; the server validates the full body again, so send every field."""
        return self._http.request("PUT", f"{self._base}/{scheduler_id}", json=body).json()

    def delete(self, scheduler_id: str) -> Dict[str, Any]:
        return self._http.request("DELETE", f"{self._base}/{scheduler_id}").json()

    def get_filter_options(self, filter: Optional[str] = None) -> Any:
        """Distinct values of ``filter`` (event_type | channel_source | sender)."""
        params = {"filter": filter} if filter else {}
        return self._http.request("GET", f"{self._base}/filter_options", params=params).json()


class AsyncScheduleResource:
    """Schedule domain — Async."""

    def __init__(self, http: AsyncHttpTransport, base: str):
        self._http = http
        self._base = f"{base.rstrip('/')}/schedulers"

    async def list(self, params: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        res = await self._http.request("GET", self._base, params=params or {})
        return res.json()

    async def get(self, scheduler_id: str) -> Dict[str, Any]:
        res = await self._http.request("GET", f"{self._base}/{scheduler_id}")
        return res.json()

    async def create(self, body: Dict[str, Any]) -> Dict[str, Any]:
        """Create a scheduler. See :meth:`ScheduleResource.create`."""
        res = await self._http.request("POST", self._base, json=body)
        return res.json()

    async def update(self, scheduler_id: str, body: Dict[str, Any]) -> Dict[str, Any]:
        """Replace the scheduler; send every field."""
        res = await self._http.request("PUT", f"{self._base}/{scheduler_id}", json=body)
        return res.json()

    async def delete(self, scheduler_id: str) -> Dict[str, Any]:
        res = await self._http.request("DELETE", f"{self._base}/{scheduler_id}")
        return res.json()

    async def get_filter_options(self, filter: Optional[str] = None) -> Any:
        params = {"filter": filter} if filter else {}
        res = await self._http.request("GET", f"{self._base}/filter_options", params=params)
        return res.json()
