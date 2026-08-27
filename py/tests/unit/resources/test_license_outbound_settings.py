import pytest
from pytest_httpx import HTTPXMock
from imbrace import ImbraceClient

GW = "https://app-gatewayv2.imbrace.co"
CS = f"{GW}/channel-service"


@pytest.fixture
def client():
    return ImbraceClient(api_key="test_key")


def test_license_get(httpx_mock: HTTPXMock, client):
    httpx_mock.add_response(url=f"{GW}/license", json={"plan": "pro"})
    assert client.license.get()["plan"] == "pro"


def test_license_activate(httpx_mock: HTTPXMock, client):
    httpx_mock.add_response(url=f"{GW}/license", method="POST", json={"activated": True})
    assert client.license.activate({"key": "k"})["activated"] is True


def test_outbound_send_whats_app(httpx_mock: HTTPXMock, client):
    httpx_mock.add_response(url=f"{CS}/v1/outbounds/whatsapp", method="POST", json={"id": "o_1"})
    assert client.outbound.send_whats_app({"to": "1"})["id"] == "o_1"


def test_settings_list_whats_app_templates(httpx_mock: HTTPXMock, client):
    httpx_mock.add_response(url=f"{CS}/v1/whatsapp_templates", json=[{"name": "t"}])
    assert client.settings.list_whats_app_templates()[0]["name"] == "t"


def test_settings_list_whats_app_templates_v2(httpx_mock: HTTPXMock, client):
    httpx_mock.add_response(url=f"{CS}/v2/whatsapp_templates", json=[{"name": "t2"}])
    assert client.settings.list_whats_app_templates_v2()[0]["name"] == "t2"


def test_contacts_upload_avatar(httpx_mock: HTTPXMock, client):
    httpx_mock.add_response(url=f"{CS}/v1/contacts/_fileupload", method="POST", json={"url": "u"})
    assert client.contacts.upload_avatar({"file": ("a.png", b"x")})["url"] == "u"
