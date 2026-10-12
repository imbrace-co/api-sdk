"""DataIQ v2 (client.dataiq) and the v1 additions that ship with it.

Mirrors ts/tests/unit/resources/dataiq.test.ts.
"""
import json
from urllib.parse import unquote

import pytest
from pytest_httpx import HTTPXMock

from imbrace import AsyncImbraceClient, DataIqError, ImbraceClient
from imbrace.exceptions import ApiError

GW = "https://app-gateway.dev.imbrace.co"
V2 = f"{GW}/data-board/v2"
DB = f"{GW}/data-board"


@pytest.fixture
def client():
    return ImbraceClient(env="develop", api_key="key")


@pytest.fixture
def aclient():
    return AsyncImbraceClient(env="develop", api_key="key")


@pytest.fixture
def no_retry_wait(monkeypatch):
    """The transport retries 5xx with back-off; skip the waiting."""
    async def _no_async_sleep(_):
        return None
    monkeypatch.setattr("imbrace.http.time.sleep", lambda _: None)
    monkeypatch.setattr("imbrace.http.asyncio.sleep", _no_async_sleep)


def _urls(httpx_mock: HTTPXMock):
    return [unquote(str(r.url)) for r in httpx_mock.get_requests()]


def _body(request):
    return json.loads(request.content)


# ── sync ─────────────────────────────────────────────────────────────────────


def test_calls_v2_and_unwraps_data(httpx_mock: HTTPXMock, client):
    httpx_mock.add_response(url=f"{V2}/boards/b1", json={"data": {"id": "b1", "fields": []}})
    board = client.dataiq.boards.get("b1")
    assert board["id"] == "b1"


def test_repeats_array_filters_and_joins_id_lists(httpx_mock: HTTPXMock, client):
    httpx_mock.add_response(json={"data": {}, "count": 2}, is_reusable=True)
    client.dataiq.boards.list(types=["General", "CRM"], team_ids=["t1", "t2"], limit=5)
    client.dataiq.boards.stats(["a", "b"])
    client.dataiq.items.delete_many("b1", ["i1", "i2"])
    client.dataiq.runs.to_confirm(["b1", "b2"])
    client.dataiq.sql.schema(tables=["x", "y"])
    assert _urls(httpx_mock) == [
        f"{V2}/boards?types=General&types=CRM&teamIds=t1&teamIds=t2&limit=5",
        f"{V2}/boards/stats?ids=a,b",
        f"{V2}/boards/b1/items/bulk-delete?ids=i1,i2",
        f"{V2}/ai/to-confirm?board_ids=b1,b2",
        f"{V2}/sql/schema?tables=x,y&format=json",
    ]


def test_omits_unset_query_params(httpx_mock: HTTPXMock, client):
    httpx_mock.add_response(url=f"{V2}/boards", json={"data": [], "total": 0, "count": 0})
    client.dataiq.boards.list()


def test_sends_typed_filters_and_sql_in_the_body(httpx_mock: HTTPXMock, client):
    httpx_mock.add_response(json={"data": [], "total": 0}, is_reusable=True)
    flt = {"match": "and", "rules": [{"fieldId": "f1", "op": "gte", "value": 100}]}
    client.dataiq.items.query("b1", {"filter": flt, "limit": 10})
    client.dataiq.sql.run("select 1", limit=5)
    q, s = httpx_mock.get_requests()
    assert (q.method, str(q.url)) == ("POST", f"{V2}/boards/b1/items/query")
    assert _body(q) == {"filter": flt, "limit": 10}
    assert (s.method, str(s.url)) == ("POST", f"{V2}/sql")
    assert _body(s) == {"sql": "select 1", "limit": 5}


def test_board_create_defaults_type_general(httpx_mock: HTTPXMock, client):
    httpx_mock.add_response(url=f"{V2}/boards", method="POST", json={"data": {"id": "b1"}})
    client.dataiq.boards.create({"name": "Invoices", "fields": [{"name": "Title", "type": "ShortText"}]})
    assert _body(httpx_mock.get_request())["type"] == "General"


def test_fields_add_returns_the_new_field(httpx_mock: HTTPXMock, client):
    httpx_mock.add_response(
        url=f"{V2}/boards/b1/fields", method="POST",
        json={"data": {"id": "b1", "fields": [{"id": "f1", "name": "Title"}, {"id": "f2", "name": "Status"}]}},
    )
    field = client.dataiq.fields.add("b1", {"name": "Status", "type": "SingleSelection"})
    assert field["id"] == "f2"


def test_returns_none_on_204(httpx_mock: HTTPXMock, client):
    httpx_mock.add_response(url=f"{V2}/sql/queries/q1", method="DELETE", status_code=204)
    assert client.dataiq.sql.delete_query("q1") is None


def test_unwraps_counts_and_nested_values(httpx_mock: HTTPXMock, client):
    httpx_mock.add_response(url=f"{V2}/boards/b1/items/count", json={"count": 7})
    httpx_mock.add_response(url=f"{V2}/routing/self", json={"data": {"serves": "v1"}})
    httpx_mock.add_response(url=f"{V2}/boards/b1/trash/forget", method="POST", json={"data": {"deleted": 3}})
    assert client.dataiq.items.count("b1") == 7
    assert client.dataiq.routing() == "v1"
    assert client.dataiq.trash.forget("b1", ["i1"]) == 3
    assert _body(httpx_mock.get_requests()[-1]) == {"itemIds": ["i1"]}


def test_maps_plan_limit_402_to_dataiq_error(httpx_mock: HTTPXMock, client):
    httpx_mock.add_response(status_code=402, json={"error": "records_per_board"})
    with pytest.raises(DataIqError) as exc:
        client.dataiq.items.create("b1", {"fields": {}})
    assert exc.value.code == "plan_limit"
    assert exc.value.status_code == 402


def test_maps_view_only_403_read_only_to_dataiq_error(httpx_mock: HTTPXMock, client):
    httpx_mock.add_response(status_code=403, json={"code": "read_only"})
    with pytest.raises(DataIqError) as exc:
        client.dataiq.items.update("b1", "i1", {})
    assert exc.value.code == "read_only"


def test_other_403_stays_auth_error(httpx_mock: HTTPXMock, client):
    from imbrace import AuthError
    httpx_mock.add_response(status_code=403, json={"error": "forbidden"})
    with pytest.raises(AuthError) as exc:
        client.dataiq.boards.get("b1")
    assert not isinstance(exc.value, DataIqError)


def test_404_stays_api_error(httpx_mock: HTTPXMock, client):
    httpx_mock.add_response(status_code=404, json={"error": "not found"})
    with pytest.raises(ApiError) as exc:
        client.dataiq.boards.get("b1")
    assert exc.value.status_code == 404


def test_maps_503_to_disabled(httpx_mock: HTTPXMock, client, no_retry_wait):
    httpx_mock.add_response(status_code=503, json={"error": "v2 disabled"}, is_reusable=True)
    with pytest.raises(DataIqError) as exc:
        client.dataiq.boards.list()
    assert exc.value.code == "disabled"


def test_health_unavailable_on_404(httpx_mock: HTTPXMock, client):
    httpx_mock.add_response(url=f"{V2}/health", status_code=404, text="Cannot GET")
    res = client.dataiq.health()
    assert res["status"] == "unavailable"
    assert res["enabled"] is False
    assert res["ready"] is False


def test_health_unavailable_on_503(httpx_mock: HTTPXMock, client, no_retry_wait):
    httpx_mock.add_response(url=f"{V2}/health", status_code=503, json={}, is_reusable=True)
    assert client.dataiq.health()["enabled"] is False


def test_health_ok(httpx_mock: HTTPXMock, client):
    httpx_mock.add_response(url=f"{V2}/health", json={"status": "ok", "enabled": True, "ready": True})
    assert client.dataiq.health()["enabled"] is True


# ── v1 additions ─────────────────────────────────────────────────────────────


def test_document_settings(httpx_mock: HTTPXMock, client):
    httpx_mock.add_response(url=f"{DB}/document-settings", json={"data": {"type": "dociq"}})
    httpx_mock.add_response(url=f"{DB}/document-settings?type=commsiq", method="PUT",
                            json={"data": {"type": "commsiq", "retry_time": 2}})
    assert client.document_models.get_settings()["type"] == "dociq"
    res = client.document_models.update_settings({"retry_time": 2}, type="commsiq")
    assert res["retry_time"] == 2
    assert _body(httpx_mock.get_requests()[-1]) == {"retry_time": 2}


def test_team_access(httpx_mock: HTTPXMock, client):
    httpx_mock.add_response(url=f"{DB}/team-access/t1", json={"team_id": "t1", "boards": []})
    httpx_mock.add_response(url=f"{DB}/team-access/t1", method="PUT", json={"team_id": "t1"})
    assert client.boards.get_team_access("t1")["team_id"] == "t1"
    changes = [{"kind": "board", "id": "b1", "access": "read"}]
    client.boards.update_team_access("t1", changes, team_name="Sales", confirm_restrict=True)
    assert _body(httpx_mock.get_requests()[-1]) == {
        "changes": changes, "team_name": "Sales", "confirm_restrict": True,
    }


# ── async ────────────────────────────────────────────────────────────────────


async def test_async_repeats_array_filters_and_joins_id_lists(httpx_mock: HTTPXMock, aclient):
    httpx_mock.add_response(json={"data": {}, "count": 2}, is_reusable=True)
    await aclient.dataiq.boards.list(types=["General", "CRM"], limit=5)
    await aclient.dataiq.boards.stats(["a", "b"])
    await aclient.dataiq.items.delete_many("b1", ["i1", "i2"])
    assert _urls(httpx_mock) == [
        f"{V2}/boards?types=General&types=CRM&limit=5",
        f"{V2}/boards/stats?ids=a,b",
        f"{V2}/boards/b1/items/bulk-delete?ids=i1,i2",
    ]


async def test_async_fields_add_and_unwrap(httpx_mock: HTTPXMock, aclient):
    httpx_mock.add_response(
        url=f"{V2}/boards/b1/fields", method="POST",
        json={"data": {"id": "b1", "fields": [{"id": "f1", "name": "Status"}, {"id": "f2", "name": "Status"}]}},
    )
    assert (await aclient.dataiq.fields.add("b1", {"name": "Status", "type": "ShortText"}))["id"] == "f2"


async def test_async_returns_none_on_204(httpx_mock: HTTPXMock, aclient):
    httpx_mock.add_response(url=f"{V2}/boards/b1/items/i1/fields/f1/suggestion", method="POST", status_code=204)
    assert await aclient.dataiq.runs.resolve_suggestion("b1", "i1", "f1", True) is None
    assert _body(httpx_mock.get_request()) == {"accept": True}


async def test_async_maps_read_only_and_plan_limit(httpx_mock: HTTPXMock, aclient):
    httpx_mock.add_response(method="PATCH", status_code=403, json={"code": "read_only"})
    httpx_mock.add_response(method="POST", status_code=402, json={"error": "boards_per_org"})
    with pytest.raises(DataIqError) as ro:
        await aclient.dataiq.items.update("b1", "i1", {})
    with pytest.raises(DataIqError) as pl:
        await aclient.dataiq.boards.create({"name": "X"})
    assert (ro.value.code, pl.value.code) == ("read_only", "plan_limit")


async def test_async_health_unavailable_on_404(httpx_mock: HTTPXMock, aclient):
    httpx_mock.add_response(url=f"{V2}/health", status_code=404, text="Cannot GET")
    assert (await aclient.dataiq.health())["enabled"] is False


async def test_async_team_access_and_settings(httpx_mock: HTTPXMock, aclient):
    httpx_mock.add_response(url=f"{DB}/team-access/t1", json={"team_id": "t1"})
    httpx_mock.add_response(url=f"{DB}/document-settings?type=dociq", json={"data": {"type": "dociq"}})
    assert (await aclient.boards.get_team_access("t1"))["team_id"] == "t1"
    assert (await aclient.document_models.get_settings("dociq"))["type"] == "dociq"
