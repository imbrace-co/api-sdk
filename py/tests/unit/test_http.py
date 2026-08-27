import pytest
from pytest_httpx import HTTPXMock
from imbrace.http import HttpTransport
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
