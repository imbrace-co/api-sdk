import pytest
from pytest_httpx import HTTPXMock
from imbrace import ImbraceClient, AsyncImbraceClient

GW = "https://app-gatewayv2.imbrace.co"
URL = f"{GW}/predict/"


@pytest.fixture
def client():
    return ImbraceClient(api_key="test_key")


@pytest.fixture
async def async_client():
    client = AsyncImbraceClient(api_key="test_key")
    yield client
    await client.close()


def test_predict(httpx_mock: HTTPXMock, client):
    httpx_mock.add_response(url=URL, method="POST", json={"result": "yes"})
    res = client.predict.predict({"input": "data"})
    assert res["result"] == "yes"


@pytest.mark.anyio
async def test_async_predict(httpx_mock: HTTPXMock, async_client):
    httpx_mock.add_response(url=URL, method="POST", json={"result": "no"})
    res = await async_client.predict.predict({"input": "data"})
    assert res["result"] == "no"
