import json
import pytest
from pytest_httpx import HTTPXMock
from imbrace import ImbraceClient

GW = "https://app-gatewayv2.imbrace.co"
DB = f"{GW}/data-board"


@pytest.fixture
def client():
    return ImbraceClient(api_key="test_key")


def test_list_boards(httpx_mock: HTTPXMock, client):
    httpx_mock.add_response(url=f"{DB}/boards?limit=20&skip=0", json={"data": []})
    res = client.boards.list()
    assert isinstance(res["data"], list)


def test_get_board(httpx_mock: HTTPXMock, client):
    httpx_mock.add_response(url=f"{DB}/boards/b_1", json={"id": "b_1"})
    res = client.boards.get("b_1")
    assert res["id"] == "b_1"


def test_create_board(httpx_mock: HTTPXMock, client):
    httpx_mock.add_response(url=f"{DB}/boards", method="POST", json={"id": "b_2"})
    res = client.boards.create("My Board")
    assert res["id"] == "b_2"


def test_create_document_ai_board_with_schema(httpx_mock: HTTPXMock, client):
    """type=DocumentAI + fields[] embed extraction schema in one POST."""
    httpx_mock.add_response(
        url=f"{DB}/boards",
        method="POST",
        json={"_id": "brd_x", "name": "DEMO", "type": "DocumentAI"},
    )
    fields = [
        {"name": "invoice_number", "type": "ShortText", "is_identifier": True, "data": []},
        {"name": "total_amount", "type": "Number", "data": []},
    ]
    client.boards.create(
        "DEMO",
        description="Receipt extractor",
        type="DocumentAI",
        fields=fields,
        team_ids=[],
        show_id=False,
    )
    req = httpx_mock.get_request()
    assert req is not None
    body = json.loads(req.content)
    assert body["name"] == "DEMO"
    assert body["description"] == "Receipt extractor"
    assert body["type"] == "DocumentAI"
    assert body["fields"] == fields
    assert body["team_ids"] == []
    assert body["show_id"] is False


def test_create_board_forwards_extra_kwargs(httpx_mock: HTTPXMock, client):
    httpx_mock.add_response(url=f"{DB}/boards", method="POST", json={"id": "b_3"})
    client.boards.create("X", workflow_id="wf_1", managers=["u1"])
    body = json.loads(httpx_mock.get_request().content)
    assert body["workflow_id"] == "wf_1"
    assert body["managers"] == ["u1"]


def test_create_board_omits_unset_optionals(httpx_mock: HTTPXMock, client):
    httpx_mock.add_response(url=f"{DB}/boards", method="POST", json={"id": "b_4"})
    client.boards.create("Plain")
    body = json.loads(httpx_mock.get_request().content)
    assert body == {"name": "Plain"}


def test_update_board(httpx_mock: HTTPXMock, client):
    httpx_mock.add_response(url=f"{DB}/boards/b_1", method="PATCH", json={"id": "b_1", "name": "Updated"})
    res = client.boards.update("b_1", {"name": "Updated"})
    assert res["name"] == "Updated"


def test_delete_board(httpx_mock: HTTPXMock, client):
    httpx_mock.add_response(url=f"{DB}/boards/b_1", method="DELETE", status_code=204)
    client.boards.delete("b_1")


# ── items ─────────────────────────────────────────────────────────────────────

def test_list_items(httpx_mock: HTTPXMock, client):
    httpx_mock.add_response(url=f"{DB}/boards/b_1/items?limit=20&skip=0", json={"data": []})
    res = client.boards.list_items("b_1")
    assert res == {"data": []}


def test_create_item(httpx_mock: HTTPXMock, client):
    httpx_mock.add_response(url=f"{DB}/boards/b_1/items", method="POST", json={"id": "i_1"})
    res = client.boards.create_item("b_1", {"name": "Row"})
    assert res["id"] == "i_1"
    assert json.loads(httpx_mock.get_request().content)["name"] == "Row"


def test_delete_item(httpx_mock: HTTPXMock, client):
    httpx_mock.add_response(url=f"{DB}/boards/b_1/items/i_1", method="DELETE", json={})
    client.boards.delete_item("b_1", "i_1")
    assert httpx_mock.get_request().method == "DELETE"


def test_bulk_delete_items(httpx_mock: HTTPXMock, client):
    httpx_mock.add_response(
        url=f"{DB}/boards/b_1/items/bulk-delete", method="DELETE", json={"deleted": 2}
    )
    res = client.boards.bulk_delete_items("b_1", {"itemIds": ["i_1", "i_2"]})
    assert res["deleted"] == 2


def test_link_items_sends_related_board_id(httpx_mock: HTTPXMock, client):
    """link_items folds relatedBoardId and relatedItemIds into one body."""
    httpx_mock.add_response(
        url=f"{DB}/boards/b_1/items/i_1/related", method="POST", json={"ok": True}
    )
    client.boards.link_items("b_1", "i_1", "b_2", {"relatedItemIds": ["i_9"]})
    body = json.loads(httpx_mock.get_request().content)
    assert body == {"relatedBoardId": "b_2", "relatedItemIds": ["i_9"]}


# ── fields / search ───────────────────────────────────────────────────────────

def test_create_field(httpx_mock: HTTPXMock, client):
    httpx_mock.add_response(url=f"{DB}/boards/b_1/fields", method="POST", json={"id": "f_1"})
    res = client.boards.create_field("b_1", {"name": "Amount", "type": "Number"})
    assert res["id"] == "f_1"


def test_search(httpx_mock: HTTPXMock, client):
    """search POSTs to /search/{board_id}, not /boards/{id}/search."""
    httpx_mock.add_response(url=f"{DB}/search/b_1", method="POST", json={"hits": []})
    res = client.boards.search("b_1", q="invoice")
    assert res == {"hits": []}


def test_search_folders_unwraps_data(httpx_mock: HTTPXMock, client):
    """search_folders returns the `data` envelope contents when present."""
    httpx_mock.add_response(
        url=f"{DB}/folders/search?q=kb", json={"data": [{"id": "fo_1"}]}
    )
    res = client.boards.search_folders(q="kb")
    assert res == [{"id": "fo_1"}]


def test_export_csv_via_mail(httpx_mock: HTTPXMock, client):
    httpx_mock.add_response(url=f"{DB}/boards/b_1/export_csv", method="POST", json={"ok": True})
    assert client.boards.export_csv_via_mail("b_1")["ok"] is True


def test_get_one_drive_session_status(httpx_mock: HTTPXMock, client):
    httpx_mock.add_response(
        url=f"{DB}/auth/onedrive/files/session/status", json={"status": "active"}
    )
    assert client.boards.get_one_drive_session_status()["status"] == "active"
