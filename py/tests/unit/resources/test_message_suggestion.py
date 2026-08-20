import pytest
from pytest_httpx import HTTPXMock
from imbrace import ImbraceClient, AsyncImbraceClient

GW = "https://app-gatewayv2.imbrace.co"
URL = f"{GW}/v1/message-suggestion"


@pytest.fixture
def client():
    return ImbraceClient(api_key="test_key")


@pytest.fixture
async def async_client():
    client = AsyncImbraceClient(api_key="test_key")
    yield client
    await client.close()


def test_get_suggestions(httpx_mock: HTTPXMock, client):
    httpx_mock.add_response(url=URL, method="POST", json={"suggestions": ["Hi!", "Hello!"]})
    res = client.message_suggestion.get_suggestions({"message": "greet"})
    assert res["suggestions"] == ["Hi!", "Hello!"]


@pytest.mark.anyio
async def test_async_get_suggestions(httpx_mock: HTTPXMock, async_client):
    httpx_mock.add_response(url=URL, method="POST", json={"suggestions": ["Hi!"]})
    res = await async_client.message_suggestion.get_suggestions({"message": "greet"})
    assert res["suggestions"] == ["Hi!"]
