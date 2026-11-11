import json

import pytest
from pytest_httpx import HTTPXMock

from imbrace import AsyncImbraceClient, ImbraceClient
from imbrace.exceptions import ApiError

GW = "https://app-gatewayv2.imbrace.co"
LOGS = f"{GW}/platform/v1/audit-logs"
ARCH = f"{GW}/platform/v1/audit-archives"


@pytest.fixture
def client():
    return ImbraceClient(api_key="test_key")


def test_list_joins_multi_value_filters(httpx_mock: HTTPXMock, client):
    httpx_mock.add_response(json={"data": [], "pagination": {"hasMore": False}})
    client.audit_logs.list(
        {
            "resource": ["user", "role"],
            "action": "login_failed",
            "categoryId": "cat1",
            "runId": "run1",
            "caseId": ["c1", "c2"],
            "includeArchive": True,
            "limit": 10,
        }
    )
    assert dict(httpx_mock.get_request().url.params) == {
        "resource": "user,role",
        "action": "login_failed",
        "categoryId": "cat1",
        "runId": "run1",
        "caseId": "c1,c2",
        "includeArchive": "true",
        "limit": "10",
    }


def test_summary_takes_filters(httpx_mock: HTTPXMock, client):
    httpx_mock.add_response(json={"data": {"total": 3}})
    assert client.audit_logs.summary(
        {"from": "2026-11-01", "resource": ["board", "board_item"]}
    ) == {"total": 3}
    assert dict(httpx_mock.get_request().url.params) == {
        "from": "2026-11-01",
        "resource": "board,board_item",
    }


def test_iterate_follows_cursor(httpx_mock: HTTPXMock, client):
    httpx_mock.add_response(
        url=f"{LOGS}?resource=user&limit=100",
        json={
            "data": [{"id": "a"}, {"id": "b"}],
            "pagination": {"hasMore": True, "nextCursor": "cur2"},
        },
    )
    httpx_mock.add_response(
        url=f"{LOGS}?resource=user&limit=100&cursor=cur2",
        json={"data": [{"id": "c"}], "pagination": {"hasMore": False, "nextCursor": None}},
    )
    assert [e["id"] for e in client.audit_logs.iterate({"resource": "user"})] == ["a", "b", "c"]


async def test_async_iterate(httpx_mock: HTTPXMock):
    httpx_mock.add_response(json={"data": [{"id": "a"}], "pagination": {"hasMore": False}})
    async with AsyncImbraceClient(api_key="test_key") as c:
        ids = [e["id"] async for e in c.audit_logs.iterate()]
    assert ids == ["a"]


def test_archives_list_policy_and_set(httpx_mock: HTTPXMock, client):
    retention = {"hotMonths": 3, "totalMonths": 12, "canEdit": True}
    httpx_mock.add_response(
        method="GET",
        url=ARCH,
        json={"data": {"hotFrom": "2026-09", "archives": [], "retention": retention}},
    )
    httpx_mock.add_response(method="GET", url=f"{ARCH}/policy", json={"data": retention})
    httpx_mock.add_response(
        method="PUT",
        url=f"{ARCH}/policy",
        json={"data": {"archiveMonths": 9}, "outcome": "increased", "retention": retention},
    )
    httpx_mock.add_response(
        method="DELETE",
        url=f"{ARCH}/policy/pending",
        json={"data": {"archiveMonths": 9}, "outcome": "cancelled", "retention": retention},
    )
    assert client.audit_archives.list()["hotFrom"] == "2026-09"
    assert client.audit_archives.get_policy()["totalMonths"] == 12
    change = client.audit_archives.set_policy(12)
    assert change == {
        "policy": {"archiveMonths": 9},
        "outcome": "increased",
        "retention": retention,
    }
    assert json.loads(httpx_mock.get_requests()[2].content) == {"totalMonths": 12}
    assert client.audit_archives.cancel_pending_policy()["outcome"] == "cancelled"


def test_archives_restore_extend_release(httpx_mock: HTTPXMock, client):
    httpx_mock.add_response(
        method="POST",
        url=f"{ARCH}/restore",
        status_code=202,
        json={
            "data": {
                "status": "accepted",
                "months": ["2026-05"],
                "alreadyRestored": [],
                "expiresAt": "x",
            }
        },
    )
    httpx_mock.add_response(
        method="POST",
        url=f"{ARCH}/2026-05/extend",
        json={"data": {"status": "ok", "month": "2026-05", "expiresAt": "y", "capped": False}},
    )
    httpx_mock.add_response(
        method="POST",
        url=f"{ARCH}/2026-05/release",
        json={"data": {"status": "ok", "month": "2026-05"}},
    )
    assert client.audit_archives.restore("2026-05", "2026-06")["months"] == ["2026-05"]
    assert client.audit_archives.extend("2026-05", 7)["capped"] is False
    assert client.audit_archives.release("2026-05")["status"] == "ok"
    reqs = httpx_mock.get_requests()
    assert json.loads(reqs[0].content) == {"from": "2026-05", "to": "2026-06"}
    assert json.loads(reqs[1].content) == {"days": 7}


def test_archives_download(httpx_mock: HTTPXMock, client):
    httpx_mock.add_response(
        method="GET",
        url=f"{ARCH}/2026-05/download?resource=user%2Crole",
        content=b"\x1f\x8b\x08\x00",
        headers={
            "Content-Disposition": 'attachment; filename="audit-org-2026-05.jsonl.gz"',
            "X-Archive-Sha256": "abc123",
            "X-Archive-Filtered": "resource",
        },
    )
    f = client.audit_archives.download("2026-05", resource=["user", "role"])
    assert f == {
        "data": b"\x1f\x8b\x08\x00",
        "filename": "audit-org-2026-05.jsonl.gz",
        "sha256": "abc123",
        "filtered": True,
    }


def test_archives_refusal_raises(httpx_mock: HTTPXMock, client):
    httpx_mock.add_response(
        method="POST",
        url=f"{ARCH}/restore",
        status_code=409,
        json={"error": "still live", "code": "live_month"},
    )
    with pytest.raises(ApiError):
        client.audit_archives.restore("2026-11")
