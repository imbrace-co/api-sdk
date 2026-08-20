from typing import Any, Dict
from ..http import HttpTransport, AsyncHttpTransport


class PredictResource:
    """Predict domain — Sync.

    Endpoint: /predict/
    """

    def __init__(self, http: HttpTransport, base: str):
        self._http = http
        self._base = base.rstrip("/")

    def predict(self, body: Dict[str, Any]) -> Dict[str, Any]:
        return self._http.request("POST", f"{self._base}/", json=body).json()


class AsyncPredictResource:
    """Predict domain — Async."""

    def __init__(self, http: AsyncHttpTransport, base: str):
        self._http = http
        self._base = base.rstrip("/")

    async def predict(self, body: Dict[str, Any]) -> Dict[str, Any]:
        res = await self._http.request("POST", f"{self._base}/", json=body)
        return res.json()
