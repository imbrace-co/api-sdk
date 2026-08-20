"""Integration test — Task 3: requests must reach the correct server.

Checks:
- Service base URLs point to the right gateway + path (develop env)
- Each service endpoint is reachable and returns 200/2xx (not 404/502)
- API Key is sent in the correct x-api-key header (not x-access-token)
"""
import pytest
from imbrace import ImbraceClient

pytestmark = pytest.mark.integration

DEV_GW = "https://app-gateway.dev.imbrace.co"


# ── 1. Verify URL construction 

def test_platform_url(client):
    assert client.auth._base == f"{DEV_GW}/platform", client.auth._base
    assert client.account._base == f"{DEV_GW}/platform", client.account._base
    assert client.organizations._base == f"{DEV_GW}/platform", client.organizations._base


def test_channel_service_url(client):
    cs = f"{DEV_GW}/channel-service"
    assert client.channel._base == cs, client.channel._base
    assert client.conversations._base == cs, client.conversations._base
    assert client.contacts._base == cs, client.contacts._base
    # messages uses channel-service as base
    assert client.messages._base == cs, client.messages._base


def test_ai_url(client):
    # ai uses gateway as base
    assert client.ai._base == DEV_GW, client.ai._base


def test_boards_url(client):
    # In develop, data-board uses a direct LAN host instead of the gateway
    assert "data-board" in client.boards._base, client.boards._base


def test_ips_url(client):
    # In develop, IPS uses a direct LAN host instead of the gateway
    assert "ips" in client.ips._base, client.ips._base


def test_health_url(client):
    assert client.health._base == DEV_GW, client.health._base


# ── 2. Verify real server calls (smoke) 

def _is_jwt(token: str) -> bool:
    parts = token.split(".")
    return len(parts) == 3 and token.startswith("eyJ")


def test_platform_responds(api_key):
    """platform service is reachable — returns a 401 auth error (not a 404/502 routing error)."""
    import httpx
    gw = "https://app-gateway.dev.imbrace.co"
    # Expect 401 (auth-gated service), not 404/502 (wrong routing)
    r = httpx.get(
        f"{gw}/platform/v1/health",
        headers={"x-api-key": api_key},
        timeout=10,
    )
    assert r.status_code != 404, f"platform/v1/health returned 404 — routing error: {r.text[:100]}"
    assert r.status_code != 502, f"platform/v1/health returned 502 — service down: {r.text[:100]}"
    assert r.status_code in (200, 201, 401, 403), (
        f"Unexpected status {r.status_code}: {r.text[:100]}"
    )


def test_channel_service_responds(access_token):
    """channel-service returns 200 — both acc_ and JWT tokens are accepted."""
    import os
    org_id = os.environ.get("IMBRACE_ORGANIZATION_ID")
    client = ImbraceClient(
        env="develop",
        access_token=access_token,
        organization_id=org_id if _is_jwt(access_token) else None,
    )
    res = client.channel.list()
    assert res is not None
    assert isinstance(res.data, list)
    client.close()


def test_api_key_header_not_access_token(api_key):
    """x-api-key is set correctly; x-access-token must not be set when only api_key is used."""
    import httpx
    from unittest.mock import patch, MagicMock

    client = ImbraceClient(env="develop", api_key=api_key)
    captured = {}

    original_request = client.http._client.request

    def capture(*args, **kwargs):
        captured["headers"] = dict(kwargs.get("headers", {}))
        return original_request(*args, **kwargs)

    with patch.object(client.http._client, "request", side_effect=capture):
        try:
            client.health.check()
        except Exception:
            pass

    assert captured.get("headers", {}).get("x-api-key") == api_key, (
        f"x-api-key not set correctly: {captured.get('headers')}"
    )
    assert "x-access-token" not in captured.get("headers", {}), (
        "x-access-token must NOT be set when only api_key is used"
    )
    client.close()
