import pytest
from pytest_httpx import HTTPXMock
from imbrace import ImbraceClient

GW = "https://app-gatewayv2.imbrace.co"
MSG = f"{GW}/channel-service/v1/conversation_messages"


@pytest.fixture
def client():
    return ImbraceClient(api_key="test_key")


def test_list_messages(httpx_mock: HTTPXMock, client):
    httpx_mock.add_response(url=f"{MSG}?limit=10&skip=0", json={"data": []})
    res = client.messages.list()
    assert isinstance(res["data"], list)


def test_send_text_message(httpx_mock: HTTPXMock, client):
    httpx_mock.add_response(url=MSG, method="POST", json={"id": "msg_1"})
    res = client.messages.send(type="text", text="Hello")
    assert res["id"] == "msg_1"


def test_send_image_message(httpx_mock: HTTPXMock, client):
    httpx_mock.add_response(url=MSG, method="POST", json={"id": "msg_2"})
    res = client.messages.send(type="image", url="https://example.com/img.png", caption="photo")
    assert res["id"] == "msg_2"


# ── comments & pinning ────────────────────────────────────────────────────────

CONV = "https://app-gatewayv2.imbrace.co/channel-service/v1/conversations"


def test_add_comment(httpx_mock: HTTPXMock, client):
    httpx_mock.add_response(
        url=f"{CONV}/c_1/conversation_messages/m_1/comments", method="POST", json={"id": "cm_1"}
    )
    assert client.messages.add_comment("c_1", "m_1", {"text": "hi"})["id"] == "cm_1"


def test_update_comment(httpx_mock: HTTPXMock, client):
    httpx_mock.add_response(url=f"{CONV}/c_1/comments/cm_1", method="PUT", json={"id": "cm_1"})
    client.messages.update_comment("c_1", "cm_1", {"text": "edit"})
    assert httpx_mock.get_request().method == "PUT"


def test_delete_comment(httpx_mock: HTTPXMock, client):
    httpx_mock.add_response(url=f"{CONV}/c_1/comments/cm_1", method="DELETE", json={})
    client.messages.delete_comment("c_1", "cm_1")
    assert httpx_mock.get_request().method == "DELETE"


def test_pin_sends_action_param(httpx_mock: HTTPXMock, client):
    """pin and unpin share one endpoint, separated by the action query param."""
    httpx_mock.add_response(
        url=f"{CONV}/c_1/conversation_messages/m_1?action=pin", json={"ok": True}
    )
    client.messages.pin("c_1", "m_1")
    assert httpx_mock.get_request().url.params["action"] == "pin"


def test_unpin_sends_action_param(httpx_mock: HTTPXMock, client):
    httpx_mock.add_response(
        url=f"{CONV}/c_1/conversation_messages/m_1?action=unpin", json={"ok": True}
    )
    client.messages.unpin("c_1", "m_1")
    assert httpx_mock.get_request().url.params["action"] == "unpin"


def test_get_index(httpx_mock: HTTPXMock, client):
    httpx_mock.add_response(
        url=f"{CONV}/c_1/conversation_messages/m_1/_index", json={"index": 3}
    )
    assert client.messages.get_index("c_1", "m_1")["index"] == 3
