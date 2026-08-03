import json
import pytest
from pytest_httpx import HTTPXMock
from imbrace import ImbraceClient

GW = "https://app-gatewayv2.imbrace.co"
BACKEND = f"{GW}/v1/backend"


@pytest.fixture
def client():
    return ImbraceClient(api_key="test_key")


def test_list_boards(httpx_mock: HTTPXMock, client):
    httpx_mock.add_response(url=f"{BACKEND}/board?limit=20&skip=0", json={"data": []})
    res = client.boards.list()
    assert isinstance(res["data"], list)


def test_get_board(httpx_mock: HTTPXMock, client):
    httpx_mock.add_response(url=f"{BACKEND}/board/b_1", json={"id": "b_1"})
    res = client.boards.get("b_1")
    assert res["id"] == "b_1"


def test_create_board(httpx_mock: HTTPXMock, client):
    httpx_mock.add_response(url=f"{BACKEND}/board", method="POST", json={"id": "b_2"})
    res = client.boards.create("My Board")
    assert res["id"] == "b_2"


def test_create_document_ai_board_with_schema(httpx_mock: HTTPXMock, client):
    """type=DocumentAI + fields[] embed extraction schema in one POST."""
    httpx_mock.add_response(
        url=f"{BACKEND}/board",
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
    httpx_mock.add_response(url=f"{BACKEND}/board", method="POST", json={"id": "b_3"})
    client.boards.create("X", workflow_id="wf_1", managers=["u1"])
    body = json.loads(httpx_mock.get_request().content)
    assert body["workflow_id"] == "wf_1"
    assert body["managers"] == ["u1"]


def test_create_board_omits_unset_optionals(httpx_mock: HTTPXMock, client):
    httpx_mock.add_response(url=f"{BACKEND}/board", method="POST", json={"id": "b_4"})
    client.boards.create("Plain")
    body = json.loads(httpx_mock.get_request().content)
    assert body == {"name": "Plain"}


def test_update_board(httpx_mock: HTTPXMock, client):
    httpx_mock.add_response(url=f"{BACKEND}/board/b_1", method="PUT", json={"id": "b_1", "name": "Updated"})
    res = client.boards.update("b_1", {"name": "Updated"})
    assert res["name"] == "Updated"


def test_delete_board(httpx_mock: HTTPXMock, client):
    httpx_mock.add_response(url=f"{BACKEND}/board/b_1", method="DELETE", status_code=204)
    client.boards.delete("b_1")
