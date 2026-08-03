"""Integration test — Task 1: client must initialize successfully.

Checks:
- Client construction does not raise an exception
- health.check() returns a successful response from the real server
- Constructing with check_health=True completes without error
"""
import pytest
from imbrace import ImbraceClient, AsyncImbraceClient

pytestmark = pytest.mark.integration


def test_client_init_no_exception(api_key, gateway):
    """Client with api_key + develop env initializes without raising."""
    client = ImbraceClient(env="develop", api_key=api_key)
    client.close()


def test_health_check_returns_ok(client):
    """health.check() calls GET / on the gateway and the server returns JSON."""
    res = client.health.check()
    # Gateway root returns {"name": "App Gateway Public Server", "version": ..., "env": ...}
    assert isinstance(res, dict), f"Expected dict, got {type(res)}: {res}"
    assert "name" in res or "status" in res, f"Unexpected response from gateway root: {res}"


def test_init_with_check_health(api_key):
    """Constructing with check_health=True triggers a health check and does not raise."""
    import os
    client = ImbraceClient(
        env="develop",
        api_key=api_key,
        check_health=True,
        organization_id=os.environ.get("IMBRACE_ORGANIZATION_ID"),
    )
    client.close()


@pytest.mark.asyncio
async def test_async_client_init_no_exception(api_key):
    """AsyncImbraceClient initializes successfully."""
    async with AsyncImbraceClient(env="develop", api_key=api_key) as client:
        res = await client.health.check()
        assert isinstance(res, dict)
