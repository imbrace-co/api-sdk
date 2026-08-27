"""Async execution smoke tests.

test_sync_async_parity proves the async methods exist; these prove a
representative sample actually runs through AsyncHttpTransport — including the
ones generated as async twins of sync methods, where a missing `await` would
return a coroutine instead of data.
"""
import pytest
from pytest_httpx import HTTPXMock

from imbrace import AsyncImbraceClient

GW = "https://app-gatewayv2.imbrace.co"
PL = f"{GW}/platform"
DB = f"{GW}/data-board"


@pytest.fixture
def aclient():
    return AsyncImbraceClient(api_key="test_key")


async def test_async_platform_archive_user(httpx_mock: HTTPXMock, aclient):
    """One of the 45 methods that existed only on the sync class."""
    httpx_mock.add_response(url=f"{PL}/v1/users/_archive", method="POST", json={"ok": True})
    res = await aclient.platform.archive_user("u_1")
    assert res["ok"] is True


async def test_async_platform_list_all_orgs(httpx_mock: HTTPXMock, aclient):
    httpx_mock.add_response(url=f"{PL}/v2/organizations/_all", json={"data": []})
    assert await aclient.platform.list_all_orgs() == {"data": []}


async def test_async_boards_create_field(httpx_mock: HTTPXMock, aclient):
    """One of the 28 board methods that existed only on the sync class."""
    httpx_mock.add_response(url=f"{DB}/boards/b_1/fields", method="POST", json={"id": "f_1"})
    res = await aclient.boards.create_field("b_1", {"name": "Amount"})
    assert res["id"] == "f_1"


async def test_async_boards_get_related_items_unwraps_data(httpx_mock: HTTPXMock, aclient):
    """Guards the generated split of `await request(...)` and `.json()`."""
    httpx_mock.add_response(
        url=f"{DB}/boards/b_1/items/i_1/related/b_2", json={"data": [{"id": "i_9"}]}
    )
    res = await aclient.boards.get_related_items("b_1", "i_1", "b_2")
    assert res == [{"id": "i_9"}]


async def test_async_sends_api_key_header(httpx_mock: HTTPXMock, aclient):
    httpx_mock.add_response(url=f"{PL}/v1/users", json={"data": []})
    await aclient.platform.list_users()
    assert httpx_mock.get_request().headers["x-api-key"] == "test_key"
