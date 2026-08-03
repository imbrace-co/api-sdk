import pytest
from pytest_httpx import HTTPXMock
from imbrace import ImbraceClient, AsyncImbraceClient

BASE = "https://app-gatewayv2.imbrace.co"
URL = f"{BASE}/channel-service/v1/backend/categories"

@pytest.fixture
def client():
    return ImbraceClient(api_key="test_key")

@pytest.fixture
async def async_client():
    client = AsyncImbraceClient(api_key="test_key")
    yield client
    await client.close()

def test_list_categories(httpx_mock: HTTPXMock, client):
    httpx_mock.add_response(url=URL, json=[{"id": "c1"}])
    res = client.categories.list()
    assert res[0]["id"] == "c1"

def test_get_category(httpx_mock: HTTPXMock, client):
    httpx_mock.add_response(url=f"{URL}/c1", json={"id": "c1"})
    res = client.categories.get("c1")
    assert res["id"] == "c1"

def test_create_category(httpx_mock: HTTPXMock, client):
    httpx_mock.add_response(url=URL, method="POST", json={"id": "c2"})
    res = client.categories.create({"name": "New"})
    assert res["id"] == "c2"

@pytest.mark.anyio
async def test_async_list_categories(httpx_mock: HTTPXMock, async_client):
    httpx_mock.add_response(url=URL, json=[{"id": "c1"}])
    res = await async_client.categories.list()
    assert res[0]["id"] == "c1"
