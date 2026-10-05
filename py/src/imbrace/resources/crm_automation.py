from typing import Any, Dict, List
from ..exceptions import ApiError
from ..http import HttpTransport, AsyncHttpTransport


class CrmAutomationResource:
    """CRM automations (data-board ``crmboard``) — Sync.

    A board automation runs a workflow when board items are created, updated,
    deleted, or on a schedule (``type``: create | update | delete | scheduled).

    ``create`` / ``update`` / ``delete`` automations need ``board_id``,
    ``workflow_id`` and ``name``; ``update`` also needs ``field_id`` (the field
    whose change triggers it). ``scheduled`` needs the scheduler settings
    (``trigger_frequency_unit``, ``trigger_frequency_value``, ``trigger_time``,
    ``start_date``, ``start_time``, ...) as in ``client.schedule.create``.

    @param base - data-board v1 base URL (``{gateway}/data-board/v1``)
    """

    def __init__(self, http: HttpTransport, base: str):
        self._http = http
        self._base = f"{base.rstrip('/')}/crmboard"

    def _list(self, path: str) -> List[Dict[str, Any]]:
        try:
            return self._http.request("GET", f"{self._base}{path}").json()
        except ApiError as e:
            # the list routes answer 404 instead of an empty array
            if e.status_code == 404:
                return []
            raise

    def list(self) -> List[Dict[str, Any]]:
        """All automations of the org."""
        return self._list("/organization/board")

    def list_by_board(self, board_id: str) -> List[Dict[str, Any]]:
        return self._list(f"/{board_id}")

    def get(self, automation_id: str) -> Dict[str, Any]:
        return self._http.request("GET", f"{self._base}/board/{automation_id}").json()

    def create(self, body: Dict[str, Any]) -> Dict[str, Any]:
        return self._http.request("POST", self._base, json=body).json()

    def update(self, automation_id: str, body: Dict[str, Any]) -> Dict[str, Any]:
        """Update an automation. ``body`` must include ``board_id``."""
        return self._http.request("PUT", f"{self._base}/board/{automation_id}", json=body).json()

    def delete(self, automation_id: str) -> Dict[str, Any]:
        """Also removes the automation's scheduler, if any."""
        return self._http.request("DELETE", f"{self._base}/board/{automation_id}").json()

    def delete_by_board(self, board_id: str) -> Dict[str, Any]:
        return self._http.request("DELETE", f"{self._base}/{board_id}").json()


class AsyncCrmAutomationResource:
    """CRM automations (data-board ``crmboard``) — Async. See :class:`CrmAutomationResource`."""

    def __init__(self, http: AsyncHttpTransport, base: str):
        self._http = http
        self._base = f"{base.rstrip('/')}/crmboard"

    async def _list(self, path: str) -> List[Dict[str, Any]]:
        try:
            res = await self._http.request("GET", f"{self._base}{path}")
        except ApiError as e:
            if e.status_code == 404:
                return []
            raise
        return res.json()

    async def list(self) -> List[Dict[str, Any]]:
        """All automations of the org."""
        return await self._list("/organization/board")

    async def list_by_board(self, board_id: str) -> List[Dict[str, Any]]:
        return await self._list(f"/{board_id}")

    async def get(self, automation_id: str) -> Dict[str, Any]:
        res = await self._http.request("GET", f"{self._base}/board/{automation_id}")
        return res.json()

    async def create(self, body: Dict[str, Any]) -> Dict[str, Any]:
        res = await self._http.request("POST", self._base, json=body)
        return res.json()

    async def update(self, automation_id: str, body: Dict[str, Any]) -> Dict[str, Any]:
        """Update an automation. ``body`` must include ``board_id``."""
        res = await self._http.request("PUT", f"{self._base}/board/{automation_id}", json=body)
        return res.json()

    async def delete(self, automation_id: str) -> Dict[str, Any]:
        """Also removes the automation's scheduler, if any."""
        res = await self._http.request("DELETE", f"{self._base}/board/{automation_id}")
        return res.json()

    async def delete_by_board(self, board_id: str) -> Dict[str, Any]:
        res = await self._http.request("DELETE", f"{self._base}/{board_id}")
        return res.json()
