"""Integration test — Task 2: access token must be accepted by the server.

How to run:
    1. Obtain an access token:
         python scripts/get_access_token.py
       (the script writes IMBRACE_ACCESS_TOKEN to .env automatically)
    2. python -m pytest tests/integration/test_access_token.py -v -m integration

Auth mode is selected automatically:
    - IMBRACE_ORGANIZATION_ID is set and token is a JWT (eyJ...) → JWT Bearer mode:
        Authorization: Bearer <token> + x-organization-id
    - IMBRACE_ORGANIZATION_ID is absent or token is not a JWT → Legacy mode:
        x-access-token: <token>
"""
import os
import pytest
from imbrace import ImbraceClient, AsyncImbraceClient
from imbrace.exceptions import AuthError

pytestmark = pytest.mark.integration


def _is_jwt(token: str) -> bool:
    parts = token.split(".")
    return len(parts) == 3 and token.startswith("eyJ")


@pytest.fixture(scope="module")
def org_id() -> str | None:
    return os.environ.get("IMBRACE_ORGANIZATION_ID")


# ── 1. Token is stored correctly   

def test_set_access_token_stores_in_manager(access_token: str):
    """set_access_token() stores the token in token_manager."""
    client = ImbraceClient(env="develop")
    client.set_access_token(access_token)

    stored = client.token_manager.get_token()
    assert stored == access_token, f"Token not stored correctly: {stored!r}"
    client.close()


def test_token_is_non_empty(access_token: str):
    """Token from env has a real value and is not empty."""
    assert len(access_token) > 20, f"Token too short, may be invalid: {access_token!r}"


# ── 2. Token is attached to requests   

def test_legacy_token_header_sent(access_token: str):
    """No org_id → legacy mode: only x-access-token, no Authorization: Bearer."""
    # Pass access_token in constructor so IMBRACE_API_KEY from env is not loaded
    client = ImbraceClient(env="develop", access_token=access_token)  # no organization_id
    captured = {}

    original = client.http._client.request

    def intercept(*args, **kwargs):
        captured["headers"] = dict(kwargs.get("headers", {}))
        return original(*args, **kwargs)

    client.http._client.request = intercept
    try:
        client.health.check()
    except Exception:
        pass

    assert captured.get("headers", {}).get("x-access-token") == access_token, (
        f"x-access-token header incorrect: {captured.get('headers')}"
    )
    assert "authorization" not in captured.get("headers", {}), (
        f"authorization must not be sent in legacy mode: {captured.get('headers')}"
    )
    client.close()


def test_jwt_bearer_header_sent():
    """JWT Bearer mode: Authorization: Bearer + x-organization-id are set correctly.

    Uses a fake JWT to test SDK header logic — no real server acceptance needed.
    Server-side auth with a real JWT is covered separately in test_server_routing.py.
    """
    # Minimal valid-format JWT (3 base64 parts, starts with eyJ)
    fake_jwt = "eyJhbGciOiJSUzI1NiJ9.eyJzdWIiOiJ1c2VyXzEifQ.signature"
    org_id = os.environ.get("IMBRACE_ORGANIZATION_ID") or "org_test_123"

    client = ImbraceClient(env="develop", organization_id=org_id)
    client.set_access_token(fake_jwt)
    captured = {}

    original = client.http._client.request

    def intercept(*args, **kwargs):
        captured["headers"] = dict(kwargs.get("headers", {}))
        return original(*args, **kwargs)

    client.http._client.request = intercept
    try:
        client.health.check()
    except Exception:
        pass

    assert captured.get("headers", {}).get("authorization") == f"Bearer {fake_jwt}", (
        f"Authorization header incorrect: {captured.get('headers')}"
    )
    assert captured.get("headers", {}).get("x-organization-id") == org_id, (
        f"x-organization-id incorrect: {captured.get('headers')}"
    )
    assert "x-access-token" not in captured.get("headers", {}), (
        f"x-access-token must not be sent in JWT Bearer mode: {captured.get('headers')}"
    )
    client.close()
    client.close()


# ── 3. Server accepts the token    

def test_account_get_with_token(access_token: str, org_id: str | None):
    """API call succeeds — server authenticates the token successfully."""
    client = ImbraceClient(
        env="develop",
        organization_id=org_id,
    )
    client.set_access_token(access_token)
    # channel-service accepts both acc_ and JWT tokens
    res = client.channel.list()
    assert res is not None
    assert isinstance(res.data, list)
    client.close()


def test_set_token_then_api_call(access_token: str, org_id: str | None):
    """Fresh client with set_access_token() can call the API immediately — no login step needed."""
    client = ImbraceClient(
        env="develop",
        organization_id=org_id,
    )
    client.set_access_token(access_token)

    channels = client.channel.list()
    assert channels is not None
    assert isinstance(channels.data, list)
    client.close()


# ── 4. Cleared token loses access  

def test_clear_token_causes_auth_error(access_token: str):
    """After clear_access_token(), the next request raises AuthError (401/403)."""
    client = ImbraceClient(env="develop")
    client.set_access_token(access_token)
    client.clear_access_token()

    assert client.token_manager.get_token() is None

    with pytest.raises(AuthError):
        client.account.get()
    client.close()


# ── 5. Async   

@pytest.mark.asyncio
async def test_async_set_token_stores(access_token: str):
    """AsyncImbraceClient.set_access_token() stores the token."""
    async with AsyncImbraceClient(env="develop") as client:
        client.set_access_token(access_token)
        assert client.token_manager.get_token() == access_token


@pytest.mark.asyncio
async def test_async_account_get_with_token(access_token: str, org_id: str | None):
    """AsyncImbraceClient: account.get() succeeds with a valid token."""
    async with AsyncImbraceClient(
        env="develop",
        organization_id=org_id,
    ) as client:
        client.set_access_token(access_token)
        res = await client.channel.list()
        assert res is not None
        assert isinstance(res.data, list)


# ── 6. JWT Bearer — server-side auth (requires platform account) ──────────────

def test_jwt_bearer_server_auth(platform_jwt: tuple[str, str]):
    """JWT Bearer mode: server validates a real JWT — channel-service returns 200.

    Runs when IMBRACE_PLATFORM_EMAIL + IMBRACE_PLATFORM_PASSWORD are set.
    See docs/TESTING_GUIDE.md for platform account setup.
    """
    jwt, org_id = platform_jwt
    client = ImbraceClient(env="develop", organization_id=org_id)
    client.set_access_token(jwt)
    res = client.channel.list()
    assert res is not None
    assert isinstance(res.data, list)
    client.close()


@pytest.mark.asyncio
async def test_async_jwt_bearer_server_auth(platform_jwt: tuple[str, str]):
    """AsyncImbraceClient JWT Bearer mode: server validates a real JWT."""
    jwt, org_id = platform_jwt
    async with AsyncImbraceClient(env="develop", organization_id=org_id) as client:
        client.set_access_token(jwt)
        res = await client.channel.list()
        assert res is not None
        assert isinstance(res.data, list)
