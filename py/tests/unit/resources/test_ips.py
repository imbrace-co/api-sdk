"""Tests for IpsResource.

IPS is retired: schedulers moved to data-board, external data sync to
channel-service, and the rest raises ImbraceError without a request.
"""
import json
import pytest
from pytest_httpx import HTTPXMock
from imbrace import ImbraceClient, AsyncImbraceClient
from imbrace.exceptions import ImbraceError

DEV = "https://app-gateway.dev.imbrace.co"
STABLE = "https://app-gatewayv2.imbrace.co"


@pytest.fixture
def client():
    c = ImbraceClient(env="develop", api_key="test_key")
    yield c
    c.close()


# --- Schedulers → data-board ---

def test_list_schedulers_stable(httpx_mock: HTTPXMock):
    client = ImbraceClient(env="stable", api_key="test_key")
    httpx_mock.add_response(
        url=f"{STABLE}/data-board/v1/schedulers?limit=5",
        json={"data": [], "count": 0, "total": 0, "has_more": False},
    )
    result = client.ips.list_schedulers({"limit": 5})
    assert result["data"] == []


def test_delete_scheduler(httpx_mock: HTTPXMock, client):
    httpx_mock.add_response(
        url=f"{DEV}/data-board/v1/schedulers/sch_1", method="DELETE",
        json={"message": "schedule sch_1 is deleted successfully"},
    )
    assert "deleted" in client.ips.delete_scheduler("sch_1")["message"]


def test_get_scheduler_filter_options(httpx_mock: HTTPXMock, client):
    httpx_mock.add_response(
        url=f"{DEV}/data-board/v1/schedulers/filter_options?filter=event_type",
        json=[{"event_type": "board_automation"}],
    )
    result = client.ips.get_scheduler_filter_options("event_type")
    assert result[0]["event_type"] == "board_automation"


def test_schedule_resource_uses_data_board(httpx_mock: HTTPXMock, client):
    httpx_mock.add_response(url=f"{DEV}/data-board/v1/schedulers", json={"data": []})
    httpx_mock.add_response(
        url=f"{DEV}/data-board/v1/schedulers/filter_options?filter=sender", json=[],
    )
    client.schedule.list()
    client.schedule.get_filter_options("sender")


# --- External data sync → channel-service ---

def test_list_external_data_sync(httpx_mock: HTTPXMock, client):
    httpx_mock.add_response(
        url=f"{DEV}/channel-service/v1/external-data-sync",
        json={"data": [{"id": "eds_1", "provider": "clickup"}], "count": 1},
    )
    assert client.ips.list_external_data_sync()["data"][0]["id"] == "eds_1"


def test_enable_external_data_sync(httpx_mock: HTTPXMock, client):
    httpx_mock.add_response(
        url=f"{DEV}/channel-service/v1/external-data-sync/enable", method="POST",
        json={"message": "Sync enabled successfully.", "subscription_id": "eds_1",
              "provider": "clickup", "is_active": True},
    )
    result = client.ips.enable_external_data_sync({"provider": "clickup", "connection_id": "c_1"})
    assert result["subscription_id"] == "eds_1"
    body = json.loads(httpx_mock.get_requests()[0].content)
    assert body == {"provider": "clickup", "connection_id": "c_1"}


def test_delete_external_data_sync(httpx_mock: HTTPXMock, client):
    httpx_mock.add_response(
        url=f"{DEV}/channel-service/v1/external-data-sync/eds_1", method="DELETE", json={},
    )
    client.ips.delete_external_data_sync("eds_1")


def test_sends_api_key_header(httpx_mock: HTTPXMock, client):
    httpx_mock.add_response(url=f"{DEV}/channel-service/v1/external-data-sync", json={"data": []})
    client.ips.list_external_data_sync()
    assert httpx_mock.get_requests()[0].headers.get("x-api-key") == "test_key"


# --- File upload (was /v1/backend) → channel-service ---

def test_message_upload_uses_channel_service(httpx_mock: HTTPXMock, client):
    httpx_mock.add_response(
        url=f"{DEV}/channel-service/v1/conversation_messages/_fileupload", method="POST",
        json={"url": "https://files/x.png"},
    )
    result = client.messages.upload_file({"file": ("x.png", b"123", "image/png")})
    assert result["url"] == "https://files/x.png"


# --- Retired: no replacement service ---

RETIRED = [
    ("list_ap_workflows", lambda ips: ips.list_ap_workflows()),
    ("list_workflows", lambda ips: ips.list_workflows()),
    ("get_profile", lambda ips: ips.get_profile("u_1")),
    ("get_my_profile", lambda ips: ips.get_my_profile()),
    ("update_profile", lambda ips: ips.update_profile("u_1", {})),
    ("search_profiles", lambda ips: ips.search_profiles("alice")),
    ("follow", lambda ips: ips.follow("u_1")),
    ("unfollow", lambda ips: ips.unfollow("u_1")),
    ("get_followers", lambda ips: ips.get_followers("u_1")),
    ("get_following", lambda ips: ips.get_following("u_1")),
    ("list_identities", lambda ips: ips.list_identities("u_1")),
    ("unlink_identity", lambda ips: ips.unlink_identity("u_1", "google")),
]


@pytest.mark.parametrize("name,call", RETIRED, ids=[n for n, _ in RETIRED])
def test_retired_methods_raise_without_request(httpx_mock: HTTPXMock, client, name, call):
    with pytest.raises(ImbraceError, match=rf"ips\.{name}\(\) is no longer available"):
        call(client.ips)
    assert httpx_mock.get_requests() == []


@pytest.mark.parametrize("name,call", RETIRED, ids=[n for n, _ in RETIRED])
@pytest.mark.anyio
async def test_async_retired_methods_raise(httpx_mock: HTTPXMock, name, call):
    client = AsyncImbraceClient(env="develop", api_key="test_key")
    try:
        with pytest.raises(ImbraceError, match=rf"ips\.{name}\(\) is no longer available"):
            await call(client.ips)
    finally:
        await client.close()
    assert httpx_mock.get_requests() == []


@pytest.mark.anyio
async def test_async_list_external_data_sync(httpx_mock: HTTPXMock):
    client = AsyncImbraceClient(env="develop", api_key="test_key")
    httpx_mock.add_response(url=f"{DEV}/channel-service/v1/external-data-sync", json={"data": [], "count": 0})
    try:
        assert (await client.ips.list_external_data_sync())["count"] == 0
    finally:
        await client.close()
