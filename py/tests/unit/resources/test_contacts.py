import pytest
from pytest_httpx import HTTPXMock
from imbrace import ImbraceClient

GW = "https://app-gatewayv2.imbrace.co"
CS = f"{GW}/channel-service/v1"


@pytest.fixture
def client():
    return ImbraceClient(api_key="test_key")


def test_list_contacts(httpx_mock: HTTPXMock, client):
    httpx_mock.add_response(url=f"{CS}/contacts", json={"data": []})
    res = client.contacts.list()
    assert isinstance(res["data"], list)


def test_list_contacts_with_params(httpx_mock: HTTPXMock, client):
    httpx_mock.add_response(url=f"{CS}/contacts?limit=5&skip=0", json={"data": []})
    res = client.contacts.list(limit=5, skip=0)
    assert isinstance(res["data"], list)


def test_get_contact(httpx_mock: HTTPXMock, client):
    httpx_mock.add_response(url=f"{CS}/contacts/c_1", json={"id": "c_1"})
    res = client.contacts.get("c_1")
    assert res["id"] == "c_1"


def test_search_contact(httpx_mock: HTTPXMock, client):
    httpx_mock.add_response(url=f"{CS}/contacts/_search?q=john", json={"data": []})
    res = client.contacts.search("john")
    assert isinstance(res["data"], list)


def test_update_contact(httpx_mock: HTTPXMock, client):
    httpx_mock.add_response(url=f"{CS}/contacts/c_1", method="PUT", json={"id": "c_1", "name": "New"})
    res = client.contacts.update("c_1", {"name": "New"})
    assert res["id"] == "c_1"


def test_get_contact_conversations(httpx_mock: HTTPXMock, client):
    httpx_mock.add_response(url=f"{CS}/contacts/c_1/conversations", json={"data": []})
    res = client.contacts.get_conversations("c_1")
    assert isinstance(res["data"], list)
