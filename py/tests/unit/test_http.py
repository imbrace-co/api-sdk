from datetime import datetime, timedelta, timezone
from email.utils import format_datetime

import pytest
from pytest_httpx import HTTPXMock
import imbrace.http as imbrace_http
from imbrace import AsyncImbraceClient, ImbraceClient
from imbrace.http import AsyncHttpTransport, HttpTransport, parse_retry_after
from imbrace.auth.token_manager import TokenManager
from imbrace.exceptions import AuthError, ApiError

@pytest.fixture
def transport():
    return HttpTransport(token_manager=TokenManager(), api_key="test_key")

def test_sets_api_key_header(httpx_mock: HTTPXMock, transport):
    httpx_mock.add_response(url="https://test.com")
    transport.request("GET", "https://test.com")
    req = httpx_mock.get_requests()[0]
    assert req.headers["x-api-key"] == "test_key"
    # x-access-token is only set from a JWT access token, never from api_key
    assert "x-access-token" not in req.headers

def test_api_key_mode_excludes_token_headers(httpx_mock: HTTPXMock):
    """api_key takes full priority — no token headers sent even if token manager has a token."""
    token_manager = TokenManager()
    token_manager.set_token("tok_test")
    transport = HttpTransport(token_manager=token_manager, api_key="key_test")

    httpx_mock.add_response(url="https://test.com")
    transport.request("GET", "https://test.com")

    req = httpx_mock.get_requests()[0]
    assert req.headers["x-api-key"] == "key_test"
    assert "x-access-token" not in req.headers
    assert "authorization" not in req.headers

def test_jwt_bearer_mode(httpx_mock: HTTPXMock):
    """token + organization_id → JWT Bearer mode: Authorization: Bearer + x-organization-id.
    Only triggers when token is an actual JWT (starts with eyJ, 3 dot-separated parts).
    """
    # Minimal fake JWT format: eyJ<header>.<payload>.<sig>
    fake_jwt = "eyJhbGciOiJSUzI1NiJ9.eyJzdWIiOiJ1c2VyXzEifQ.signature"
    token_manager = TokenManager()
    token_manager.set_token(fake_jwt)
    transport = HttpTransport(token_manager=token_manager, organization_id="org_123")

    httpx_mock.add_response(url="https://test.com")
    transport.request("GET", "https://test.com")

    req = httpx_mock.get_requests()[0]
    assert req.headers["authorization"] == f"Bearer {fake_jwt}"
    assert req.headers["x-organization-id"] == "org_123"
    assert "x-access-token" not in req.headers
    assert "x-api-key" not in req.headers

def test_legacy_access_token_mode(httpx_mock: HTTPXMock):
    """token without organization_id → legacy mode: x-access-token only."""
    token_manager = TokenManager()
    token_manager.set_token("tok_legacy")
    transport = HttpTransport(token_manager=token_manager)

    httpx_mock.add_response(url="https://test.com")
    transport.request("GET", "https://test.com")

    req = httpx_mock.get_requests()[0]
    assert req.headers["x-access-token"] == "tok_legacy"
    assert "authorization" not in req.headers
    assert "x-organization-id" not in req.headers

def test_401_raises_auth_error(httpx_mock: HTTPXMock, transport):
    httpx_mock.add_response(url="https://test.com", status_code=401)
    with pytest.raises(AuthError):
        transport.request("GET", "https://test.com")


def test_403_raises_auth_error(httpx_mock: HTTPXMock, transport):
    httpx_mock.add_response(url="https://test.com", status_code=403, json={})
    with pytest.raises(AuthError):
        transport.request("GET", "https://test.com")


def test_404_raises_api_error(httpx_mock: HTTPXMock, transport):
    httpx_mock.add_response(url="https://test.com", status_code=404, json={"message": "nope"})
    with pytest.raises(ApiError):
        transport.request("GET", "https://test.com")


def test_returns_response_on_200(httpx_mock: HTTPXMock, transport):
    httpx_mock.add_response(url="https://test.com", json={"ok": True})
    res = transport.request("GET", "https://test.com")
    assert res.status_code == 200
    assert res.json() == {"ok": True}


def test_retries_on_500_then_raises(httpx_mock: HTTPXMock, transport):
    """5xx is retried up to max_retries (3), so 4 requests go out in total."""
    httpx_mock.add_response(url="https://test.com", status_code=500, json={}, is_reusable=True)
    with pytest.raises(ApiError):
        transport.request("GET", "https://test.com")
    assert len(httpx_mock.get_requests()) == 4


def test_retries_on_429(httpx_mock: HTTPXMock, transport):
    """429 is retried like a 5xx; a success on the retry is returned normally."""
    httpx_mock.add_response(url="https://test.com", status_code=429, json={})
    httpx_mock.add_response(url="https://test.com", json={"ok": True})
    res = transport.request("GET", "https://test.com")
    assert res.json() == {"ok": True}
    assert len(httpx_mock.get_requests()) == 2


@pytest.fixture
def sleeps(monkeypatch):
    """Record retry waits instead of sleeping."""
    waits = []
    monkeypatch.setattr(imbrace_http.time, "sleep", lambda s: waits.append(s))

    async def fake_async_sleep(s):
        waits.append(s)

    monkeypatch.setattr(imbrace_http.asyncio, "sleep", fake_async_sleep)
    return waits


def test_max_retries_zero_makes_one_attempt(httpx_mock: HTTPXMock, sleeps):
    httpx_mock.add_response(url="https://test.com", status_code=500, is_reusable=True)
    transport = HttpTransport(token_manager=TokenManager(), api_key="k", max_retries=0)
    with pytest.raises(ApiError):
        transport.request("GET", "https://test.com")
    assert len(httpx_mock.get_requests()) == 1
    assert sleeps == []


def test_default_backoff_unchanged(httpx_mock: HTTPXMock, transport, sleeps):
    httpx_mock.add_response(url="https://test.com", status_code=503, is_reusable=True)
    with pytest.raises(ApiError):
        transport.request("POST", "https://test.com")
    assert sleeps == [1, 2, 4]


def test_retry_after_seconds_is_obeyed(httpx_mock: HTTPXMock, transport, sleeps):
    httpx_mock.add_response(url="https://test.com", status_code=429, headers={"Retry-After": "7"})
    httpx_mock.add_response(url="https://test.com", json={"ok": True})
    assert transport.request("GET", "https://test.com").json() == {"ok": True}
    assert sleeps == [7.0]


def test_retry_after_http_date_is_obeyed(httpx_mock: HTTPXMock, transport, sleeps):
    when = format_datetime(datetime.now(timezone.utc) + timedelta(seconds=10), usegmt=True)
    httpx_mock.add_response(url="https://test.com", status_code=503, headers={"Retry-After": when})
    httpx_mock.add_response(url="https://test.com", json={})
    transport.request("GET", "https://test.com")
    assert len(sleeps) == 1 and 8 <= sleeps[0] <= 10


def test_retry_after_over_cap_raises_at_once(httpx_mock: HTTPXMock, transport, sleeps):
    httpx_mock.add_response(url="https://test.com", status_code=429, headers={"Retry-After": "120"})
    with pytest.raises(ApiError):
        transport.request("GET", "https://test.com")
    assert len(httpx_mock.get_requests()) == 1
    assert sleeps == []


def test_parse_retry_after_ignores_unreadable_values():
    assert parse_retry_after(None) is None
    assert parse_retry_after("soon") is None
    assert parse_retry_after("3") == 3.0


@pytest.mark.parametrize("bad", [-1, 1.5, True, "2"])
def test_invalid_max_retries_rejected(bad):
    with pytest.raises(ValueError):
        ImbraceClient(api_key="k", max_retries=bad)


async def test_async_max_retries_and_retry_after(httpx_mock: HTTPXMock, sleeps):
    httpx_mock.add_response(url="https://test.com", status_code=429, headers={"Retry-After": "2"})
    httpx_mock.add_response(url="https://test.com", status_code=429, headers={"Retry-After": "2"})
    transport = AsyncHttpTransport(token_manager=TokenManager(), api_key="k", max_retries=1)
    with pytest.raises(ApiError):
        await transport.request("GET", "https://test.com")
    assert len(httpx_mock.get_requests()) == 2
    assert sleeps == [2.0]


def test_client_passes_max_retries_to_transport():
    assert ImbraceClient(api_key="k", max_retries=0).http.max_retries == 0
    assert AsyncImbraceClient(api_key="k").http.max_retries == 3
