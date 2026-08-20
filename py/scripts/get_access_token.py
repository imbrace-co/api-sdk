import os
import sys
import re
import httpx
from pathlib import Path
from dotenv import load_dotenv

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")
if hasattr(sys.stderr, "reconfigure"):
    sys.stderr.reconfigure(encoding="utf-8")

ENV_FILE = Path(__file__).parent.parent / ".env"
load_dotenv(dotenv_path=ENV_FILE)

GATEWAY = os.environ.get("IMBRACE_GATEWAY_URL", "https://app-gateway.dev.imbrace.co").rstrip("/")
PLATFORM = f"{GATEWAY}/platform/v1"
PLATFORM_V2 = f"{GATEWAY}/platform/v2"
BACKEND = f"{GATEWAY}/backend/v1"
BACKEND_V2 = f"{GATEWAY}/backend/v2"


def request_otp(email: str) -> None:
    # Uses /backend/v1/ — the returned token is accepted by backend/v2/organizations
    url = f"{BACKEND}/login/_signin_email_request"
    print(f"Sending OTP to {email} ...")
    r = httpx.post(url, json={"email": email}, timeout=15)
    if r.status_code not in (200, 201):
        print(f"OTP request failed: {r.status_code} — {r.text}")
        sys.exit(1)
    print("OTP sent. Check your email.")


def signin_with_otp(email: str, otp: str) -> str:
    """Authenticate via OTP through backend/v1. Returns a session token (login_acc_...)."""
    url = f"{BACKEND}/login/_signin_with_email"
    r = httpx.post(url, json={"email": email, "otp": otp}, timeout=15)
    if r.status_code not in (200, 201):
        print(f"Login error: {r.status_code} — {r.text}")
        sys.exit(1)
    data = r.json()
    print(f"[DEBUG] OTP login response: {data}")

    nested = data.get("data") or {}
    token = (
        data.get("token") or data.get("accessToken") or data.get("access_token")
        or nested.get("token") or nested.get("accessToken") or nested.get("access_token")
    )
    if not token:
        print("No token found in response.")
        sys.exit(1)
    print(f"[DEBUG] Session token: {token[:40]}... (JWT={token.startswith('eyJ')})")
    return token


def fetch_organizations(session_token: str) -> list:
    """Fetch organizations via backend/v2 using x-access-token (login_acc_ token)."""
    url = f"{BACKEND_V2}/organizations?limit=50&skip=0&is_active=true"
    r = httpx.get(url, headers={"x-access-token": session_token}, timeout=15)
    print(f"[DEBUG] fetch_orgs status={r.status_code}")
    if r.status_code == 200:
        return r.json().get("data", [])
    print(f"[WARN] Failed to fetch org list: {r.status_code} — {r.text[:200]}")
    return []


def exchange_for_jwt(session_token: str, org_id: str) -> str | None:
    """Exchange session token + org_id → access token.

    Tries platform v1 first (may return a JWT eyJ...), falls back to backend v1 (returns acc_).
    """
    is_jwt_session = session_token.startswith("eyJ")
    candidates = [
        (f"{PLATFORM}/access/_exchange_access_token",
         {"Authorization": f"Bearer {session_token}"} if is_jwt_session else {"x-access-token": session_token}),
        (f"{BACKEND}/access/_exchange_access_token",
         {"x-access-token": session_token}),
    ]

    for url, headers in candidates:
        print(f"Exchanging token for org {org_id} via {url.split('/')[5]}/v1 ...")
        r = httpx.post(url, json={"organization_id": org_id}, headers=headers, timeout=15)
        print(f"[DEBUG] Exchange status={r.status_code} response={r.text[:400]}")
        if r.status_code not in (200, 201):
            continue
        data = r.json()
        nested = data.get("data") or {}
        token = (
            data.get("token") or data.get("accessToken") or data.get("access_token")
            or nested.get("token") or nested.get("accessToken") or nested.get("access_token")
        )
        if token:
            print(f"[DEBUG] Exchange result: {token[:40]}... (JWT={token.startswith('eyJ')})")
            return token
    return None


def write_env_value(key: str, value: str) -> None:
    content = ENV_FILE.read_text(encoding="utf-8")
    if re.search(rf"^{key}=", content, re.MULTILINE):
        content = re.sub(
            rf"^({key}=).*$",
            lambda m: f"{m.group(1)}{value}",
            content,
            flags=re.MULTILINE,
        )
    else:
        content += f"\n{key}={value}\n"
    ENV_FILE.write_text(content, encoding="utf-8")


def signin_with_password(email: str, password: str) -> str | None:
    """Sign in with email/password via platform v1. Returns a session token (JWT) or None."""
    url = f"{PLATFORM}/login/sign_in"
    r = httpx.post(url, json={"email": email, "password": password}, timeout=15)
    print(f"[DEBUG] platform sign_in: {r.status_code} {r.text[:200]}")
    if r.status_code not in (200, 201):
        return None
    data = r.json()
    nested = data.get("data") or {}
    return (
        data.get("token") or data.get("accessToken")
        or nested.get("token") or nested.get("accessToken")
    )


def fetch_organizations_platform(session_token: str) -> list:
    """Fetch organizations via platform v2 using Authorization: Bearer."""
    url = f"{PLATFORM_V2}/organizations?limit=50&skip=0&is_active=true"
    r = httpx.get(url, headers={"Authorization": f"Bearer {session_token}"}, timeout=15)
    print(f"[DEBUG] platform orgs: {r.status_code}")
    if r.status_code == 200:
        return r.json().get("data", [])
    return []


def exchange_platform_jwt(session_token: str, org_id: str) -> str | None:
    """Exchange platform session token → org-scoped JWT."""
    url = f"{PLATFORM}/access/_exchange_access_token"
    r = httpx.post(
        url,
        json={"organization_id": org_id},
        headers={"Authorization": f"Bearer {session_token}"},
        timeout=15,
    )
    print(f"[DEBUG] platform exchange: {r.status_code} {r.text[:200]}")
    if r.status_code not in (200, 201):
        return None
    data = r.json()
    nested = data.get("data") or {}
    return (
        data.get("token") or data.get("accessToken")
        or nested.get("token") or nested.get("accessToken")
    )


def main():
    # ── Flow 1: Platform account (password) → JWT ─────────────────────────────
    platform_email = os.environ.get("IMBRACE_PLATFORM_EMAIL")
    platform_pw = os.environ.get("IMBRACE_PLATFORM_PASSWORD")

    if platform_email and platform_pw:
        print(f"\n[Platform flow] Signing in as {platform_email} ...")
        session = signin_with_password(platform_email, platform_pw)
        if session:
            orgs = fetch_organizations_platform(session)
            if orgs:
                jwt = exchange_platform_jwt(session, orgs[0]["id"])
                if jwt and jwt.startswith("eyJ"):
                    write_env_value("IMBRACE_PLATFORM_EMAIL", platform_email)
                    write_env_value("IMBRACE_PLATFORM_PASSWORD", platform_pw)
                    print(f"\n✓ Platform JWT acquired successfully!")
                    print(f"  test_jwt_bearer_server_auth will PASS with this account.")
                    print("\nDone! Run tests:")
                    print("  python -m pytest tests/integration/ -v -m integration")
                    return
                else:
                    print(f"[WARN] Platform exchange did not return a JWT: {jwt!r:.40}")
            else:
                print("[WARN] Platform account has no organizations.")
        else:
            print("[WARN] Platform sign_in failed — check email/password.")

    # ── Flow 2: Legacy OTP (backend v1) → acc_ token ──────────────────────────
    print("\n[Legacy OTP flow] Fetching acc_ token for channel-service tests ...")
    email = os.environ.get("IMBRACE_TEST_EMAIL") or input("Email: ").strip()
    if not email:
        print("Email is required.")
        sys.exit(1)

    request_otp(email)

    otp = input("Enter OTP from email: ").strip()
    if not otp:
        print("OTP is required.")
        sys.exit(1)

    session_token = signin_with_otp(email, otp)
    print(f"\nSession token: {session_token[:40]}...")

    orgs = fetch_organizations(session_token)
    if not orgs:
        print("[WARN] No organizations found.")
        write_env_value("IMBRACE_ACCESS_TOKEN", session_token)
        sys.exit(1)

    print(f"\nFound {len(orgs)} org(s):")
    for i, org in enumerate(orgs):
        print(f"  [{i}] {org['id']} — {org['name']}")

    final_token = None
    final_org_id = None
    for org in orgs:
        token = exchange_for_jwt(session_token, org["id"])
        if token:
            final_token = token
            final_org_id = org["id"]
            print(f"Exchange OK: org {org['id']} ({org['name']})")
            break

    if final_token:
        write_env_value("IMBRACE_ACCESS_TOKEN", final_token)
        write_env_value("IMBRACE_ORGANIZATION_ID", final_org_id or "")
        print(f"\nWrote IMBRACE_ACCESS_TOKEN and IMBRACE_ORGANIZATION_ID to {ENV_FILE}")
    else:
        write_env_value("IMBRACE_ACCESS_TOKEN", session_token)
        print("[WARN] Exchange failed. Saving session token instead.")

    print("\nDone! Run tests:")
    print("  python -m pytest tests/integration/ -v -m integration")


if __name__ == "__main__":
    main()
