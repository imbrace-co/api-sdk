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
