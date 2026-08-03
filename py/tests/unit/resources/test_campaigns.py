import pytest
from pytest_httpx import HTTPXMock
from imbrace import ImbraceClient, AsyncImbraceClient

GW = "https://app-gatewayv2.imbrace.co"
CAMPAIGN_URL = f"{GW}/channel-service/v1/campaign"
TOUCHPOINT_URL = f"{GW}/channel-service/v1/touchpoints"


@pytest.fixture
def client():
    return ImbraceClient(api_key="test_key")


@pytest.fixture
async def async_client():
    client = AsyncImbraceClient(api_key="test_key")
    yield client
    await client.close()


# --- Campaign CRUD ---

def test_list_campaigns(httpx_mock: HTTPXMock, client):
    httpx_mock.add_response(url=CAMPAIGN_URL, json={"data": []})
    res = client.campaign.list()
    assert res["data"] == []


def test_get_campaign(httpx_mock: HTTPXMock, client):
    httpx_mock.add_response(url=f"{CAMPAIGN_URL}/cp1", json={"_id": "cp1"})
    res = client.campaign.get("cp1")
    assert res["_id"] == "cp1"


def test_create_campaign(httpx_mock: HTTPXMock, client):
    httpx_mock.add_response(url=CAMPAIGN_URL, method="POST", json={"_id": "cp2"})
    res = client.campaign.create({"name": "New"})
    assert res["_id"] == "cp2"


def test_delete_campaign(httpx_mock: HTTPXMock, client):
    httpx_mock.add_response(url=f"{CAMPAIGN_URL}/cp1", method="DELETE", status_code=204)
    client.campaign.delete("cp1")


# --- Touchpoints (merged into campaign resource) ---

def test_list_touchpoints(httpx_mock: HTTPXMock, client):
    httpx_mock.add_response(url=TOUCHPOINT_URL, json={"data": []})
    res = client.campaign.list_touchpoints()
    assert res["data"] == []


def test_get_touchpoint(httpx_mock: HTTPXMock, client):
    httpx_mock.add_response(url=f"{TOUCHPOINT_URL}/tp1", json={"_id": "tp1"})
    res = client.campaign.get_touchpoint("tp1")
    assert res["_id"] == "tp1"


def test_create_touchpoint(httpx_mock: HTTPXMock, client):
    httpx_mock.add_response(url=TOUCHPOINT_URL, method="POST", json={"_id": "tp2"})
    res = client.campaign.create_touchpoint({"name": "TP"})
    assert res["_id"] == "tp2"


def test_update_touchpoint(httpx_mock: HTTPXMock, client):
    httpx_mock.add_response(url=f"{TOUCHPOINT_URL}/tp1", method="PUT", json={"_id": "tp1"})
    res = client.campaign.update_touchpoint("tp1", {"name": "Updated"})
    assert res["_id"] == "tp1"


def test_delete_touchpoint(httpx_mock: HTTPXMock, client):
    httpx_mock.add_response(url=f"{TOUCHPOINT_URL}/tp1", method="DELETE", status_code=204)
    client.campaign.delete_touchpoint("tp1")


def test_validate_touchpoint(httpx_mock: HTTPXMock, client):
    httpx_mock.add_response(url=f"{TOUCHPOINT_URL}/_validate", method="POST", json={"valid": True})
    res = client.campaign.validate_touchpoint({"touchpoint_id": "tp1"})
    assert res["valid"] is True


# --- Async ---

@pytest.mark.anyio
async def test_async_list_campaigns(httpx_mock: HTTPXMock, async_client):
    httpx_mock.add_response(url=CAMPAIGN_URL, json={"data": []})
    res = await async_client.campaign.list()
    assert res["data"] == []


@pytest.mark.anyio
async def test_async_list_touchpoints(httpx_mock: HTTPXMock, async_client):
    httpx_mock.add_response(url=TOUCHPOINT_URL, json={"data": []})
    res = await async_client.campaign.list_touchpoints()
    assert res["data"] == []
