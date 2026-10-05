from typing import Any, Dict, List, Optional
from ..http import HttpTransport, AsyncHttpTransport


def _query(params: Dict[str, Any]) -> Dict[str, Any]:
    return {k: v for k, v in params.items() if v is not None}


def _body_or_none(res: Any) -> Any:
    if res.status_code == 204 or not res.content:
        return None
    return res.json()


def _data(res: Any) -> Any:
    return res.get("data") if isinstance(res, dict) else res


class DocumentModelsResource:
    """DocIQ Document Models — Sync.

    The schemas that tell Document AI which fields to extract, their version
    history, and the category tree they are filed in. Lives in data-board
    (``/data-board/schemas``, ``/data-board/categories``). These categories are
    not the platform conversation categories in ``client.categories``.

    An attribute is ``{id?, name, type, description?}`` where ``type`` is a board
    field type (e.g. ``ShortText``, ``Number``, ``Date``) or ``RichText``.

    @param base - data-board base URL (``{gateway}/data-board``)
    """

    def __init__(self, http: HttpTransport, base: str):
        self._http = http
        self._base = base.rstrip("/")

    def _req(self, method: str, path: str, body: Any = None, params: Optional[Dict[str, Any]] = None) -> Any:
        kwargs: Dict[str, Any] = {}
        if body is not None:
            kwargs["json"] = body
        if params:
            kwargs["params"] = _query(params)
        return _body_or_none(self._http.request(method, f"{self._base}{path}", **kwargs))

    # --- Models ---
    def list(self, search: Optional[str] = None, category_id: Optional[str] = None,
             limit: Optional[int] = None, skip: Optional[int] = None) -> Dict[str, Any]:
        """``{data, count, limit, skip}``."""
        return self._req("GET", "/schemas", params={"search": search, "categoryId": category_id,
                                                     "limit": limit, "skip": skip})

    def get(self, model_id: str) -> Dict[str, Any]:
        return _data(self._req("GET", f"/schemas/{model_id}"))

    def create(self, body: Dict[str, Any]) -> Dict[str, Any]:
        """Create a model: ``{name, description?, category?, attributes?, accessTeams?, agents?, databoards?, change_note?}``."""
        return _data(self._req("POST", "/schemas", body))

    def update(self, model_id: str, body: Dict[str, Any]) -> Dict[str, Any]:
        """Each update creates a new version."""
        return _data(self._req("PUT", f"/schemas/{model_id}", body))

    def delete(self, model_id: str) -> None:
        self._req("DELETE", f"/schemas/{model_id}")

    def update_attribute(self, model_id: str, attribute_id: str, body: Dict[str, Any]) -> Dict[str, Any]:
        """Returns the updated attribute."""
        return _data(self._req("PUT", f"/schemas/{model_id}/attributes/{attribute_id}", body))

    def delete_attribute(self, model_id: str, attribute_id: str) -> None:
        self._req("DELETE", f"/schemas/{model_id}/attributes/{attribute_id}")

    def extract_attributes(self, body: Dict[str, Any]) -> Dict[str, Any]:
        """Suggest attributes from 1-5 sample documents (``{file_urls, provider_id?, model_name?}``).

        Returns ``{attributes, similar_schema?}``.
        """
        return self._req("POST", "/schemas/_extract-attributes", body)

    def provision_boards(self, body: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Create a data board for each model, optionally linked to an assistant.

        ``body``: ``{assistant_id?, schemas: [{schema_id, data_board_name?, board_category_id?, board_deployment_access?}]}``.
        Returns ``[{board_id, schema_id}]``.
        """
        return _data(self._req("POST", "/schemas/_provision-board", body))

    # --- Versions ---
    def list_versions(self, model_id: str, limit: Optional[int] = None, skip: Optional[int] = None) -> Dict[str, Any]:
        """``{data, count, current_version, limit, skip}``."""
        return self._req("GET", f"/schemas/{model_id}/versions", params={"limit": limit, "skip": skip})

    def get_version(self, model_id: str, version: int) -> Dict[str, Any]:
        """A version including its ``snapshot`` of the full model."""
        return _data(self._req("GET", f"/schemas/{model_id}/versions/{version}"))

    def revert(self, model_id: str, version: int, change_note: Optional[str] = None) -> Dict[str, Any]:
        """Restore an older version; this itself creates a new version. Returns ``{schema, version}``."""
        body = {"change_note": change_note} if change_note is not None else {}
        return _data(self._req("POST", f"/schemas/{model_id}/versions/{version}/_revert", body))

    # --- Categories ---
    def list_categories(self, type: Optional[str] = None, search: Optional[str] = None,
                        limit: Optional[int] = None, skip: Optional[int] = None) -> Dict[str, Any]:
        """The category tree (``type``: ``"schema"`` | ``"databoard"``; all when omitted)."""
        return self._req("GET", "/categories", params={"type": type, "search": search, "limit": limit, "skip": skip})

    def get_category(self, category_id: str) -> Dict[str, Any]:
        return _data(self._req("GET", f"/categories/{category_id}"))

    def create_category(self, body: Dict[str, Any]) -> Dict[str, Any]:
        """``{name, type: "schema"|"databoard", parentId?}``."""
        return _data(self._req("POST", "/categories", body))

    def update_category(self, category_id: str, body: Dict[str, Any]) -> Dict[str, Any]:
        """``{name?, parentId?}``."""
        return _data(self._req("PUT", f"/categories/{category_id}", body))

    def delete_category(self, category_id: str) -> None:
        """Child categories move up to the deleted category's parent."""
        self._req("DELETE", f"/categories/{category_id}")


class AsyncDocumentModelsResource:
    """DocIQ Document Models — Async. See :class:`DocumentModelsResource`."""

    def __init__(self, http: AsyncHttpTransport, base: str):
        self._http = http
        self._base = base.rstrip("/")

    async def _req(self, method: str, path: str, body: Any = None, params: Optional[Dict[str, Any]] = None) -> Any:
        kwargs: Dict[str, Any] = {}
        if body is not None:
            kwargs["json"] = body
        if params:
            kwargs["params"] = _query(params)
        return _body_or_none(await self._http.request(method, f"{self._base}{path}", **kwargs))

    async def list(self, search: Optional[str] = None, category_id: Optional[str] = None,
                   limit: Optional[int] = None, skip: Optional[int] = None) -> Dict[str, Any]:
        return await self._req("GET", "/schemas", params={"search": search, "categoryId": category_id,
                                                           "limit": limit, "skip": skip})

    async def get(self, model_id: str) -> Dict[str, Any]:
        return _data(await self._req("GET", f"/schemas/{model_id}"))

    async def create(self, body: Dict[str, Any]) -> Dict[str, Any]:
        return _data(await self._req("POST", "/schemas", body))

    async def update(self, model_id: str, body: Dict[str, Any]) -> Dict[str, Any]:
        """Each update creates a new version."""
        return _data(await self._req("PUT", f"/schemas/{model_id}", body))

    async def delete(self, model_id: str) -> None:
        await self._req("DELETE", f"/schemas/{model_id}")

    async def update_attribute(self, model_id: str, attribute_id: str, body: Dict[str, Any]) -> Dict[str, Any]:
        """Returns the updated attribute."""
        return _data(await self._req("PUT", f"/schemas/{model_id}/attributes/{attribute_id}", body))

    async def delete_attribute(self, model_id: str, attribute_id: str) -> None:
        await self._req("DELETE", f"/schemas/{model_id}/attributes/{attribute_id}")

    async def extract_attributes(self, body: Dict[str, Any]) -> Dict[str, Any]:
        return await self._req("POST", "/schemas/_extract-attributes", body)

    async def provision_boards(self, body: Dict[str, Any]) -> List[Dict[str, Any]]:
        return _data(await self._req("POST", "/schemas/_provision-board", body))

    async def list_versions(self, model_id: str, limit: Optional[int] = None, skip: Optional[int] = None) -> Dict[str, Any]:
        return await self._req("GET", f"/schemas/{model_id}/versions", params={"limit": limit, "skip": skip})

    async def get_version(self, model_id: str, version: int) -> Dict[str, Any]:
        return _data(await self._req("GET", f"/schemas/{model_id}/versions/{version}"))

    async def revert(self, model_id: str, version: int, change_note: Optional[str] = None) -> Dict[str, Any]:
        body = {"change_note": change_note} if change_note is not None else {}
        return _data(await self._req("POST", f"/schemas/{model_id}/versions/{version}/_revert", body))

    async def list_categories(self, type: Optional[str] = None, search: Optional[str] = None,
                              limit: Optional[int] = None, skip: Optional[int] = None) -> Dict[str, Any]:
        return await self._req("GET", "/categories", params={"type": type, "search": search, "limit": limit, "skip": skip})

    async def get_category(self, category_id: str) -> Dict[str, Any]:
        return _data(await self._req("GET", f"/categories/{category_id}"))

    async def create_category(self, body: Dict[str, Any]) -> Dict[str, Any]:
        return _data(await self._req("POST", "/categories", body))

    async def update_category(self, category_id: str, body: Dict[str, Any]) -> Dict[str, Any]:
        return _data(await self._req("PUT", f"/categories/{category_id}", body))

    async def delete_category(self, category_id: str) -> None:
        await self._req("DELETE", f"/categories/{category_id}")
