import json
from datetime import datetime, timezone

import pytest
from pytest_httpx import HTTPXMock

from imbrace import AsyncImbraceClient, ImbraceClient
from imbrace.exceptions import ApiError

GW = "https://app-gatewayv2.imbrace.co"
BASE = f"{GW}/ai-agent/dociq"


def wrap(data):
    return {"success": True, "data": data, "timestamp": "2026-11-11T00:00:00Z"}


@pytest.fixture
def client():
    return ImbraceClient(api_key="test_key")


def test_ingest_posts_files_and_unwraps(httpx_mock: HTTPXMock, client):
    httpx_mock.add_response(
        method="POST",
        url=f"{BASE}/ingest",
        status_code=202,
        json=wrap({"submissions": [{"id": "s1", "correlationId": "c1", "status": "pending"}]}),
    )
    res = client.dociq.ingest(
        [{"url": "files/download/abc.pdf", "mime_type": "application/pdf", "name": "invoice.pdf"}],
        assistant_id="asst_1",
        source={"channel": "whatsapp", "conversation_id": "conv_1"},
    )
    assert json.loads(httpx_mock.get_request().content) == {
        "files": [
            {"url": "files/download/abc.pdf", "mime_type": "application/pdf", "name": "invoice.pdf"}
        ],
        "assistant_id": "asst_1",
        "source": {"channel": "whatsapp", "conversation_id": "conv_1"},
    }
    assert res["submissions"][0]["id"] == "s1"


def test_ingest_sends_only_files_by_default(httpx_mock: HTTPXMock, client):
    httpx_mock.add_response(method="POST", url=f"{BASE}/ingest", json=wrap({"submissions": []}))
    client.dociq.ingest([{"url": "u", "mime_type": "image/png"}])
    assert json.loads(httpx_mock.get_request().content) == {
        "files": [{"url": "u", "mime_type": "image/png"}]
    }


def test_list_submissions_query(httpx_mock: HTTPXMock, client):
    httpx_mock.add_response(json=wrap({"submissions": [], "total": 0, "limit": 5, "skip": 0}))
    res = client.dociq.list_submissions(
        limit=5,
        status="succeeded",
        document_model_ids=["m1", "m2"],
        from_=datetime(2026, 11, 1, tzinfo=timezone.utc),
    )
    req = httpx_mock.get_request()
    assert req.url.path == "/ai-agent/dociq/submissions"
    assert dict(req.url.params) == {
        "limit": "5",
        "status": "succeeded",
        "documentModelIds": "m1,m2",
        "from": "2026-11-01T00:00:00+00:00",
    }
    assert res["total"] == 0


def test_submission_paths(httpx_mock: HTTPXMock, client):
    httpx_mock.add_response(
        method="GET",
        url=f"{BASE}/submissions/s1",
        json=wrap({"id": "s1", "outcome": "saved", "extractedData": {"total": 10}}),
    )
    httpx_mock.add_response(
        method="GET", url=f"{BASE}/submissions/by-file/INV-2026%2F001", json=wrap({"id": "s1"})
    )
    httpx_mock.add_response(
        method="DELETE", url=f"{BASE}/submissions/s1", json=wrap({"id": "s1", "deleted": True})
    )
    httpx_mock.add_response(
        method="POST",
        url=f"{BASE}/submissions/s1/create-model",
        status_code=201,
        json=wrap({"schema": {"id": "m9"}}),
    )
    assert client.dociq.get_submission("s1")["extractedData"] == {"total": 10}
    assert client.dociq.get_submission_by_file("INV-2026/001")["id"] == "s1"
    assert client.dociq.delete_submission("s1")["deleted"] is True
    assert (
        client.dociq.create_model_from_submission("s1", "Invoice", category="cat1")["schema"]["id"]
        == "m9"
    )
    assert json.loads(httpx_mock.get_requests()[-1].content) == {
        "name": "Invoice",
        "category": "cat1",
    }


def test_ingest_error_raises(httpx_mock: HTTPXMock, client):
    httpx_mock.add_response(
        method="POST",
        url=f"{BASE}/ingest",
        status_code=400,
        json={"success": False, "error": "Missing x-user-id"},
    )
    with pytest.raises(ApiError):
        client.dociq.ingest([{"url": "u", "mime_type": "application/pdf"}])


async def test_async_ingest_and_get(httpx_mock: HTTPXMock):
    httpx_mock.add_response(
        method="POST", url=f"{BASE}/ingest", json=wrap({"submissions": [{"id": "s1"}]})
    )
    httpx_mock.add_response(
        method="GET", url=f"{BASE}/submissions?limit=1", json=wrap({"submissions": [], "total": 0})
    )
    async with AsyncImbraceClient(api_key="test_key") as c:
        res = await c.dociq.ingest([{"url": "u", "mime_type": "application/pdf"}])
        lst = await c.dociq.list_submissions(limit=1)
    assert res["submissions"][0]["id"] == "s1"
    assert lst["total"] == 0
