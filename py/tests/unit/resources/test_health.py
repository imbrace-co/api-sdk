import pytest
from pytest_httpx import HTTPXMock
from imbrace import ImbraceClient, AsyncImbraceClient

BASE = "https://app-gatewayv2.imbrace.co"

@pytest.fixture
def client():
    return ImbraceClient(api_key="test_key")

@pytest.fixture
async def async_client():
    client = AsyncImbraceClient(api_key="test_key")
    yield client
    await client.close()

def test_health_check(httpx_mock: HTTPXMock, client):
    httpx_mock.add_response(url=f"{BASE}/", json={"name": "App Gateway Public Server", "version": "1.0.0"})
    res = client.health.check()
    assert res["name"] == "App Gateway Public Server"

@pytest.mark.anyio
async def test_async_health_check(httpx_mock: HTTPXMock, async_client):
    httpx_mock.add_response(url=f"{BASE}/", json={"name": "App Gateway Public Server", "version": "1.0.0"})
    res = await async_client.health.check()
    assert res["name"] == "App Gateway Public Server"
