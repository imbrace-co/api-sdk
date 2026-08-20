import pytest
from pytest_httpx import HTTPXMock
from imbrace import ImbraceClient

GW = "https://app-gatewayv2.imbrace.co"
CS = f"{GW}/channel-service"
PL = f"{GW}/platform"


@pytest.fixture
def client():
    return ImbraceClient(api_key="test_key")


def test_list_message_templates(httpx_mock: HTTPXMock, client):
    httpx_mock.add_response(url=f"{CS}/v1/message_templates", json={"data": []})
    res = client.settings.list_message_templates()
    assert isinstance(res["data"], list)


def test_create_message_template(httpx_mock: HTTPXMock, client):
    httpx_mock.add_response(url=f"{CS}/v1/message_templates", method="POST", json={"id": "tpl_1"})
    res = client.settings.create_message_template({"name": "Welcome"})
    assert res["id"] == "tpl_1"


def test_get_message_template(httpx_mock: HTTPXMock, client):
    httpx_mock.add_response(url=f"{CS}/v1/message_templates/tpl_1", json={"id": "tpl_1"})
    res = client.settings.get_message_template("tpl_1")
    assert res["id"] == "tpl_1"


def test_delete_message_template(httpx_mock: HTTPXMock, client):
    httpx_mock.add_response(url=f"{CS}/v1/message_templates/tpl_1", method="DELETE", json={"success": True})
    res = client.settings.delete_message_template("tpl_1")
    assert res["success"] is True


def test_list_users(httpx_mock: HTTPXMock, client):
    httpx_mock.add_response(url=f"{PL}/v1/users", json={"data": []})
    res = client.settings.list_users()
    assert isinstance(res["data"], list)
