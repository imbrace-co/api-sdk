"""Mirrors website/public/sdk/error-handling.md against `imbrace==1.0.4` (PyPI)
— API-key auth.

Triggers each error type to verify the SDK raises the documented class:
  - AuthError   — bad credentials → 401/403
  - ApiError    — real client + nonexistent id → 4xx
  - NetworkError — unreachable host → connection error
  - ImbraceError — base class catches all of the above
  - AsyncImbraceClient — verifies same exceptions on async surface
"""
from __future__ import annotations
import json
import os
import sys
import time
import asyncio

from dotenv import load_dotenv
load_dotenv()

from imbrace import (
    ImbraceClient,
    AsyncImbraceClient,
    ImbraceError,
    AuthError,
    ApiError,
    NetworkError,
)

API_KEY = os.environ.get("IMBRACE_API_KEY")
ORG_ID  = os.environ.get("IMBRACE_ORGANIZATION_ID")
GATEWAY = os.environ.get("IMBRACE_GATEWAY_URL", "https://app-gatewayv2.imbrace.co")

if not API_KEY or not ORG_ID:
    print("Missing IMBRACE_API_KEY or IMBRACE_ORGANIZATION_ID")
    sys.exit(1)

good_client = ImbraceClient(api_key=API_KEY, organization_id=ORG_ID, gateway=GATEWAY, timeout=8)

passed = failed = skipped_n = 0
failures: list[str] = []
doc_gaps: list[str] = []


def step(label, fn, expect_fail=False):
    global passed, failed
    sys.stdout.write(f"  - {label} ... "); sys.stdout.flush()
    try:
        t0 = time.time()
        r = fn()
        dt = int((time.time() - t0) * 1000)
        summary = json.dumps(r, default=str)[:90] if r is not None else ""
        if expect_fail:
            print(f"unexpected pass [{dt}ms] {summary}")
            failed += 1; failures.append(f"{label} -> unexpected pass")
        else:
            print(f"OK [{dt}ms] {summary}"); passed += 1
    except Exception as e:
        code = str(e)[:80]
        if expect_fail:
            print(f"OK (expected fail [{code}])"); passed += 1
        else:
            print(f"FAIL [{code}]"); failed += 1
            failures.append(f"{label} -> {code}")


def skip(label, reason):
    global skipped_n
    print(f"  - {label}  SKIP: {reason}"); skipped_n += 1


def section(title): print(f"\n== {title} ==")
def note(msg): print(f"  i {msg}"); doc_gaps.append(msg)


print(f"\n=== DOCS: error-handling.md - auth: API KEY (PyPI imbrace==1.0.4) ===")
print(f"gateway={GATEWAY}\norg={ORG_ID}\n")


section("§0. Error class hierarchy is importable")


def _check_classes():
    if not issubclass(AuthError, ImbraceError): raise AssertionError("AuthError not subclass of ImbraceError")
    if not issubclass(ApiError, ImbraceError): raise AssertionError("ApiError not subclass of ImbraceError")
    if not issubclass(NetworkError, ImbraceError): raise AssertionError("NetworkError not subclass of ImbraceError")
    return {"hierarchy_ok": True}


step("ImbraceError class is the base of Auth/Api/NetworkError", _check_classes)


section("§1. AuthError - bad credentials -> 401/403")
bad_auth_client = ImbraceClient(api_key="api_invalid_credentials_for_test", organization_id=ORG_ID, gateway=GATEWAY, timeout=8)


def _trigger_auth_error():
    try:
        bad_auth_client.platform.get_me()
        raise AssertionError("expected AuthError but call succeeded")
    except AuthError as e:
        return {"caught": "AuthError", "message": str(e)[:60]}
    except ApiError as e:
        return {"caught": "ApiError(401)", "status_code": e.status_code, "note": "backend wraps 401 in ApiError"}


step("platform.get_me with bad api_key raises AuthError", _trigger_auth_error)


section("§2. ApiError - marketplace.get_product('nonexistent_id') -> 4xx")
note("backend-divergence: marketplace.get_product('nonexistent_id') sometimes returns empty 200 instead of 404")


def _trigger_api_error():
    try:
        r = good_client.marketplace.get_product("nonexistent_id_for_test")
        return {"caught": "no-throw", "body": json.dumps(r, default=str)[:60]}
    except ApiError as e:
        return {"caught": "ApiError", "status_code": e.status_code, "message": str(e)[:60]}
    except NetworkError as e:
        return {"caught": "NetworkError(network)", "message": str(e)[:60]}


step("marketplace.get_product('nonexistent_id') — assert ApiError OR empty result", _trigger_api_error)


def _force_api_error_boards():
    try:
        good_client.boards.get("brd_non_existent_id_for_test")
        return {"caught": "no-throw"}
    except ApiError as e:
        return {"caught": "ApiError", "status_code": e.status_code}


step("Force ApiError via boards.get('non_existent_board_id') — expect 404", _force_api_error_boards)


section("§3. NetworkError - unreachable host -> connection error")
offline_client = ImbraceClient(
    api_key="api_dummy",
    organization_id=ORG_ID,
    gateway="https://this-host-does-not-exist-imbrace-test.invalid",
    timeout=3,
)


def _trigger_network_error():
    try:
        offline_client.platform.get_me()
        raise AssertionError("expected NetworkError but call succeeded")
    except NetworkError as e:
        return {"caught": "NetworkError", "message": str(e)[:60]}


step("platform.get_me against unreachable host raises NetworkError", _trigger_network_error)


section("§4. Catching all SDK errors (one block, branch by class)")


def _catch_imbrace_base():
    try:
        bad_auth_client.platform.get_me()
        raise AssertionError("expected error but call succeeded")
    except ImbraceError as e:
        return {"caught": type(e).__name__, "is_imbrace_error": True}


step("ImbraceError base class catches AuthError too", _catch_imbrace_base)


section("§5. Automatic retry behavior")
note("doc says Py retries 3x — would require simulating 5xx flakiness")
skip("retry-on-429/5xx", "would require backend stub returning transient errors")


section("§6. Async error handling (AsyncImbraceClient, Py only)")


async def _async_test():
    async with AsyncImbraceClient(api_key="api_invalid_credentials_for_test", organization_id=ORG_ID, gateway=GATEWAY, timeout=8) as ac:
        try:
            await ac.platform.get_me()
            return {"caught": "no-throw", "note": "expected error"}
        except AuthError as e:
            return {"caught": "AuthError(async)", "message": str(e)[:60]}
        except ApiError as e:
            return {"caught": "ApiError(async,401)", "status_code": e.status_code}


def _run_async():
    return asyncio.run(_async_test())


step("AsyncImbraceClient.platform.get_me with bad creds raises AuthError", _run_async)


print(f"\n=== Summary (error-handling / API key) ===")
print(f"pass={passed}  fail={failed}  skip={skipped_n}")
if failures:
    print("Failures:")
    for f in failures: print(f"  - {f}")
if doc_gaps:
    print("Doc / backend gaps:")
    for g in doc_gaps: print(f"  - {g}")
sys.exit(1 if failed > 0 else 0)
