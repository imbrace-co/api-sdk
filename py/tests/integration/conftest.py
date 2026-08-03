"""Shared fixtures for integration tests.

Integration tests require a live server. Credentials are read from .env.
Run with: python -m pytest tests/integration/ -v -m integration
"""
import os
import pytest
import httpx
from typing import Optional
from dotenv import load_dotenv
from imbrace import ImbraceClient, AsyncImbraceClient

# Load .env from the py/ directory
load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), "..", "..", ".env"))

GATEWAY = os.environ.get("IMBRACE_GATEWAY_URL", "https://app-gateway.dev.imbrace.co").rstrip("/")


def _require_env(name: str) -> str:
    val = os.environ.get(name)
    if not val:
        pytest.skip(f"Env var {name!r} not set — skipping integration test")
    return val


def _optional_env(name: str) -> Optional[str]:
    return os.environ.get(name) or None


@pytest.fixture(scope="session")
def api_key() -> str:
    return _require_env("IMBRACE_API_KEY")


@pytest.fixture(scope="session")
def test_email() -> str:
    return _require_env("IMBRACE_TEST_EMAIL")


@pytest.fixture(scope="session")
def test_password() -> str:
    return _require_env("IMBRACE_TEST_PASSWORD")


@pytest.fixture(scope="session")
def access_token() -> str:
    """acc_ access token — obtain via scripts/get_access_token.py."""
    return _require_env("IMBRACE_ACCESS_TOKEN")


@pytest.fixture(scope="session")
def platform_jwt() -> tuple[str, str]:
    """Obtain a real JWT from platform v1 sign_in (password-based).

    Returns (jwt_token, org_id).
    Skips if IMBRACE_PLATFORM_EMAIL / IMBRACE_PLATFORM_PASSWORD are not set.

    Setup:
        1. Register: POST /platform/v1/login/sign_up
        2. Verify email (click the link in your inbox)
        3. Add to .env:
               IMBRACE_PLATFORM_EMAIL=your-email@example.com
               IMBRACE_PLATFORM_PASSWORD=YourPassword@123
    """
    email = _optional_env("IMBRACE_PLATFORM_EMAIL")
    password = _optional_env("IMBRACE_PLATFORM_PASSWORD")
    if not email or not password:
        pytest.skip(
            "IMBRACE_PLATFORM_EMAIL / IMBRACE_PLATFORM_PASSWORD not set — "
            "see docs/TESTING_GUIDE.md for platform account setup"
        )

    # 1. Sign in → session token
    r = httpx.post(
        f"{GATEWAY}/platform/v1/login/sign_in",
        json={"email": email, "password": password},
        timeout=15,
    )
    if r.status_code not in (200, 201):
        pytest.skip(f"Platform sign_in failed ({r.status_code}): {r.text[:200]}")

    data = r.json()
    nested = data.get("data") or {}
    session_token = (
        data.get("token") or data.get("accessToken")
        or nested.get("token") or nested.get("accessToken")
    )
    if not session_token:
        pytest.skip(f"No token found in sign_in response: {data}")

    # 2. Fetch org list
    r2 = httpx.get(
        f"{GATEWAY}/platform/v2/organizations?limit=10&skip=0&is_active=true",
        headers={"Authorization": f"Bearer {session_token}"},
        timeout=15,
    )
    if r2.status_code != 200 or not r2.json().get("data"):
        pytest.skip(f"Failed to fetch org list: {r2.status_code} {r2.text[:200]}")

    org_id = r2.json()["data"][0]["id"]

    # 3. Exchange → org-scoped JWT
    r3 = httpx.post(
        f"{GATEWAY}/platform/v1/access/_exchange_access_token",
        json={"organization_id": org_id},
        headers={"Authorization": f"Bearer {session_token}"},
        timeout=15,
    )
    if r3.status_code not in (200, 201):
        pytest.skip(f"Exchange failed ({r3.status_code}): {r3.text[:200]}")

    d3 = r3.json()
    n3 = d3.get("data") or {}
    jwt = (
        d3.get("token") or d3.get("accessToken")
        or n3.get("token") or n3.get("accessToken")
    )
    if not jwt or not jwt.startswith("eyJ"):
        pytest.skip(f"Exchange did not return a JWT: token={jwt!r:.40}")

    return jwt, org_id


@pytest.fixture(scope="session")
def client(api_key: str) -> ImbraceClient:
    """Sync client using API Key, develop env."""
    c = ImbraceClient(
        env="develop",
        api_key=api_key,
        organization_id=os.environ.get("IMBRACE_ORGANIZATION_ID"),
    )
    yield c
    c.close()


@pytest.fixture(scope="session")
def gateway() -> str:
    return GATEWAY
