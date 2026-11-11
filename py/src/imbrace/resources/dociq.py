from datetime import datetime
from typing import Any, Dict, List, Optional, cast
from urllib.parse import quote

from ..http import AsyncHttpTransport, HttpTransport


def _unwrap(res: Any) -> Dict[str, Any]:
    """ai-agent answers ``{success, data, timestamp}``."""
    body = res.json()
    data = body["data"] if isinstance(body, dict) and "data" in body else body
    return cast(Dict[str, Any], data)


def _list_params(
    limit: Optional[int],
    skip: Optional[int],
    status: Optional[str],
    flow: Optional[str],
    search: Optional[str],
    document_model_ids: Optional[List[str]],
    conversation_id: Optional[str],
    email_id: Optional[str],
    source_item_id: Optional[str],
    from_: Any,
    to: Any,
    run_id: Optional[str],
) -> Dict[str, Any]:
    def iso(v: Any) -> Any:
        return v.isoformat() if isinstance(v, datetime) else v

    params = {
        "limit": limit,
        "skip": skip,
        "status": status,
        "flow": flow,
        "search": search,
        "documentModelIds": ",".join(document_model_ids) if document_model_ids else None,
        "conversationId": conversation_id,
        "emailId": email_id,
        "sourceItemId": source_item_id,
        "from": iso(from_),
        "to": iso(to),
        "runId": run_id,
    }
    return {k: v for k, v in params.items() if v is not None}


def _ingest_body(
    files: List[Dict[str, Any]], assistant_id: Optional[str], source: Optional[Dict[str, Any]]
) -> Dict[str, Any]:
    body: Dict[str, Any] = {"files": files}
    if assistant_id is not None:
        body["assistant_id"] = assistant_id
    if source is not None:
        body["source"] = source
    return body


def _q(value: str) -> str:
    return quote(value, safe="")


class DociqResource:
    """DocIQ: upload documents and let the platform read them (Sync).

    Each file is matched to a Document Model (``client.document_models``), extracted, and
    written as a record on that model's board. Routes to ``/ai-agent/dociq/*``. The
    organization needs the Document Model feature.

    Example::

        with open("invoice.pdf", "rb") as f:
            upload = {"file": ("invoice.pdf", f, "application/pdf")}
            url = client.boards.upload_board_file(upload)["url"]

        pdf = {"url": url, "mime_type": "application/pdf", "name": "invoice.pdf"}
        res = client.dociq.ingest([pdf])
        detail = client.dociq.get_submission(res["submissions"][0]["id"])
    """

    def __init__(self, http: HttpTransport, base: str):
        self._http = http
        self._base = f"{base.rstrip('/')}/dociq"

    def ingest(
        self,
        files: List[Dict[str, Any]],
        assistant_id: Optional[str] = None,
        source: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """Submit 1-5 files: ``[{url, mime_type, name?}]``, ``url`` being what
        ``boards.upload_board_file`` returned or an absolute URL.

        ``assistant_id`` uses that DocIQ assistant's models. ``source``
        (``{channel?, conversation_id?}``) records where the file came from.
        Returns at once with ``{submissions: [{id, correlationId, status}]}``; the
        extraction and the board write run in the background.
        """
        return _unwrap(
            self._http.request(
                "POST", f"{self._base}/ingest", json=_ingest_body(files, assistant_id, source)
            )
        )

    def list_submissions(
        self,
        limit: Optional[int] = None,
        skip: Optional[int] = None,
        status: Optional[str] = None,
        flow: Optional[str] = None,
        search: Optional[str] = None,
        document_model_ids: Optional[List[str]] = None,
        conversation_id: Optional[str] = None,
        email_id: Optional[str] = None,
        source_item_id: Optional[str] = None,
        from_: Any = None,
        to: Any = None,
        run_id: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Submissions, newest first: ``{submissions, total, limit, skip}``.

        ``status``: ``pending`` | ``running`` | ``succeeded`` | ``failed`` | ``canceled``.
        ``flow``: ``page`` (uploads) | ``chat``. ``from_`` / ``to``: ISO string or datetime.
        """
        params = _list_params(
            limit,
            skip,
            status,
            flow,
            search,
            document_model_ids,
            conversation_id,
            email_id,
            source_item_id,
            from_,
            to,
            run_id,
        )
        return _unwrap(self._http.request("GET", f"{self._base}/submissions", params=params))

    def get_submission(self, submission_id: str) -> Dict[str, Any]:
        """One submission with ``extractedData``, ``extractedMeta`` (per-field confidence),
        ``proposedModel`` (when no model matched), ``error`` and ``processLog``.

        ``status`` is the ingest lifecycle; ``outcome`` is the board write:
        ``saved`` | ``no_schema`` | ``model_created`` | ``failed`` | ``pending``.
        """
        return _unwrap(self._http.request("GET", f"{self._base}/submissions/{_q(submission_id)}"))

    def get_submission_by_file(self, file_id: str) -> Dict[str, Any]:
        """The newest submission for a File ID (the id the results table shows)."""
        return _unwrap(self._http.request("GET", f"{self._base}/submissions/by-file/{_q(file_id)}"))

    def delete_submission(self, submission_id: str) -> Dict[str, Any]:
        """Remove a submission from the results list. Returns ``{id, deleted}``."""
        return _unwrap(
            self._http.request("DELETE", f"{self._base}/submissions/{_q(submission_id)}")
        )

    def create_model_from_submission(
        self, submission_id: str, name: str, category: Optional[str] = None
    ) -> Dict[str, Any]:
        """For a submission that matched no model (``outcome == "no_schema"``): create a
        Document Model from the fields DocIQ proposed. Returns ``{schema}``."""
        body: Dict[str, Any] = {"name": name}
        if category is not None:
            body["category"] = category
        return _unwrap(
            self._http.request(
                "POST", f"{self._base}/submissions/{_q(submission_id)}/create-model", json=body
            )
        )


class AsyncDociqResource:
    """DocIQ — async. See :class:`DociqResource`."""

    def __init__(self, http: AsyncHttpTransport, base: str):
        self._http = http
        self._base = f"{base.rstrip('/')}/dociq"

    async def ingest(
        self,
        files: List[Dict[str, Any]],
        assistant_id: Optional[str] = None,
        source: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """See :meth:`DociqResource.ingest`."""
        return _unwrap(
            await self._http.request(
                "POST", f"{self._base}/ingest", json=_ingest_body(files, assistant_id, source)
            )
        )

    async def list_submissions(
        self,
        limit: Optional[int] = None,
        skip: Optional[int] = None,
        status: Optional[str] = None,
        flow: Optional[str] = None,
        search: Optional[str] = None,
        document_model_ids: Optional[List[str]] = None,
        conversation_id: Optional[str] = None,
        email_id: Optional[str] = None,
        source_item_id: Optional[str] = None,
        from_: Any = None,
        to: Any = None,
        run_id: Optional[str] = None,
    ) -> Dict[str, Any]:
        """See :meth:`DociqResource.list_submissions`."""
        params = _list_params(
            limit,
            skip,
            status,
            flow,
            search,
            document_model_ids,
            conversation_id,
            email_id,
            source_item_id,
            from_,
            to,
            run_id,
        )
        return _unwrap(await self._http.request("GET", f"{self._base}/submissions", params=params))

    async def get_submission(self, submission_id: str) -> Dict[str, Any]:
        """See :meth:`DociqResource.get_submission`."""
        return _unwrap(
            await self._http.request("GET", f"{self._base}/submissions/{_q(submission_id)}")
        )

    async def get_submission_by_file(self, file_id: str) -> Dict[str, Any]:
        """See :meth:`DociqResource.get_submission_by_file`."""
        return _unwrap(
            await self._http.request("GET", f"{self._base}/submissions/by-file/{_q(file_id)}")
        )

    async def delete_submission(self, submission_id: str) -> Dict[str, Any]:
        """See :meth:`DociqResource.delete_submission`."""
        return _unwrap(
            await self._http.request("DELETE", f"{self._base}/submissions/{_q(submission_id)}")
        )

    async def create_model_from_submission(
        self, submission_id: str, name: str, category: Optional[str] = None
    ) -> Dict[str, Any]:
        """See :meth:`DociqResource.create_model_from_submission`."""
        body: Dict[str, Any] = {"name": name}
        if category is not None:
            body["category"] = category
        return _unwrap(
            await self._http.request(
                "POST", f"{self._base}/submissions/{_q(submission_id)}/create-model", json=body
            )
        )
