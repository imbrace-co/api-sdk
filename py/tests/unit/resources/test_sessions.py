import pytest
from imbrace import ImbraceClient, AsyncImbraceClient
from imbrace.exceptions import ImbraceError


@pytest.fixture
def client():
    return ImbraceClient(api_key="test_key")


@pytest.mark.parametrize("call", [
    lambda c: c.sessions.list(),
    lambda c: c.sessions.get("s_1"),
    lambda c: c.sessions.create(),
    lambda c: c.sessions.delete("s_1"),
])
def test_sessions_are_retired(httpx_mock, client, call):
    """The gateway no longer serves /session; every method raises without a request."""
    with pytest.raises(ImbraceError, match=r"sessions\.\w+\(\) is no longer available: no iMBrace service serves /session anymore"):
        call(client)
    assert httpx_mock.get_requests() == []


async def test_async_sessions_are_retired(httpx_mock):
    client = AsyncImbraceClient(api_key="test_key")
    with pytest.raises(ImbraceError, match="sessions.list"):
        await client.sessions.list()
    assert httpx_mock.get_requests() == []
