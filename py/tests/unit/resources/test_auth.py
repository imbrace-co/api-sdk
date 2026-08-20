"""Tests for AuthResource — platform service login/token endpoints."""
import json
import pytest
from pytest_httpx import HTTPXMock

from imbrace import ImbraceClient

GW = "https://app-gatewayv2.imbrace.co"
# third-party token (API key generation) — requires access token, routes via private backend
TOKEN_URL = f"{GW}/private/backend/v1/third_party_token"
# auth login/token endpoints live on platform service (${GW}/platform/v1)
LOGIN_V1 = f"{GW}/platform/v1/login"


@pytest.fixture
def client():
    c = ImbraceClient(api_key="test_key")
    yield c
    c.close()


def test_get_third_party_token(httpx_mock: HTTPXMock, client):
    payload = {"apiKey": {"apiKey": "api_new_xxx"}, "expires_in": 864000}
    httpx_mock.add_response(url=TOKEN_URL, json=payload)
    result = client.auth.get_third_party_token()
    assert result["apiKey"]["apiKey"] == "api_new_xxx"
    req = httpx_mock.get_requests()[0]
    assert req.method == "POST"
    body = json.loads(req.content)
    assert body["expirationDays"] == 10


def test_get_third_party_token_custom_days(httpx_mock: HTTPXMock, client):
    httpx_mock.add_response(url=TOKEN_URL, json={"apiKey": {}})
    client.auth.get_third_party_token(expiration_days=30)
    req = httpx_mock.get_requests()[0]
    body = json.loads(req.content)
    assert body["expirationDays"] == 30


def test_get_third_party_token_sends_auth_header(httpx_mock: HTTPXMock, client):
    httpx_mock.add_response(url=TOKEN_URL, json={})
    client.auth.get_third_party_token()
    req = httpx_mock.get_requests()[0]
    # API key is sent as x-api-key; x-access-token is only set from a JWT token
    assert req.headers.get("x-api-key") == "test_key"
    assert req.headers.get("x-access-token") is None


def test_sign_in(httpx_mock: HTTPXMock, client):
    payload = {"access_token": "tok_abc", "user": {"id": "u_1"}}
    httpx_mock.add_response(url=f"{LOGIN_V1}/sign_in", json=payload)
    result = client.auth.sign_in("user@test.co", "pass123")
    assert result["access_token"] == "tok_abc"
    req = httpx_mock.get_requests()[0]
    assert req.method == "POST"
    body = json.loads(req.content)
    assert body["email"] == "user@test.co"


def test_signin_email_request(httpx_mock: HTTPXMock, client):
    httpx_mock.add_response(url=f"{LOGIN_V1}/_signin_email_request", json={"sent": True}) 
    client.auth.signin_email_request("user@test.co")
    req = httpx_mock.get_requests()[0]
    assert req.method == "POST"
    body = json.loads(req.content)
    assert body["email"] == "user@test.co"


def test_exchange_access_token(httpx_mock: HTTPXMock, client):
    payload = {"access_token": "tok_org"}
    url = f"{GW}/platform/v1/access/_exchange_access_token"
    httpx_mock.add_response(url=url, json=payload)
    result = client.auth.exchange_access_token("org_123")
    assert result["access_token"] == "tok_org"


def test_signin_with_email_otp(httpx_mock: HTTPXMock, client):
    httpx_mock.add_response(url=f"{LOGIN_V1}/_signin_with_email", json={"accessToken": "tok_otp"})
    result = client.auth.signin_with_email("user@test.co", "123456")
    assert result["accessToken"] == "tok_otp"
    req = httpx_mock.get_requests()[0]
    body = json.loads(req.content)
    assert body["email"] == "user@test.co"
    assert body["otp"] == "123456"


def test_login_stores_token(httpx_mock: HTTPXMock):
    c = ImbraceClient(api_key="test_key")
    # login() now goes through the membership-scoped /login/authenticate endpoint.
    httpx_mock.add_response(
        url=f"{LOGIN_V1}/authenticate",
        json={"accessToken": "tok_stored", "organizations": []},
    )
    res = c.login("user@test.co", "pass123")
    assert c.token_manager.get_token() == "tok_stored"
    assert res["organizations"] == []
    c.close()
