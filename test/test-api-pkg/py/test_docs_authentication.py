"""Mirrors website/public/sdk/authentication.md against `imbrace==1.0.4`
(PyPI) — API-key auth.
"""
from __future__ import annotations
import os
import sys
import json

from dotenv import load_dotenv
load_dotenv()

from imbrace import ImbraceClient

API_KEY = os.environ.get("IMBRACE_API_KEY")
ORG_ID  = os.environ.get("IMBRACE_ORGANIZATION_ID")
GATEWAY = os.environ.get("IMBRACE_GATEWAY_URL", "https://app-gatewayv2.imbrace.co")

if not API_KEY or not ORG_ID:
    print("Missing IMBRACE_API_KEY or IMBRACE_ORGANIZATION_ID")
    sys.exit(1)

passed = failed = skipped_n = 0
failures: list[str] = []
doc_gaps: list[str] = []


def step(label, fn, expect_fail=False):
    global passed, failed
    sys.stdout.write(f"  - {label} ... "); sys.stdout.flush()
    try:
        r = fn()
        summary = json.dumps(r, default=str)[:90] if r is not None else ""
        if expect_fail:
            print(f"unexpected pass {summary}"); failed += 1; failures.append(f"{label} -> unexpected pass")
        else:
            print(f"OK {summary}"); passed += 1
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


print(f"\n=== DOCS: authentication.md - auth: API KEY (PyPI imbrace==1.0.4) ===")
print(f"gateway={GATEWAY}\norg={ORG_ID}\n")

note("doc-clarification: authentication.md says \"You never pass organization_id to the SDK\". Tests still pass it because the SDK accepts both forms and some endpoints want the header.")


section("§1. API Key init + first call (Py uses context manager)")


def _api_key_init():
    with ImbraceClient(api_key=API_KEY, organization_id=ORG_ID, gateway=GATEWAY, timeout=10) as c:
        return c.platform.get_me()


step("with ImbraceClient(api_key=...) as c: c.platform.get_me()", _api_key_init)


section("§2. Access Token init")
skip("ImbraceClient(access_token=...)", "tested in test-accesstoken-pkg")


section("§3. OTP login flow")
skip("client.request_otp(email)", "destructive — would send a real OTP email")
skip("client.login_with_otp(email, otp)", "destructive — needs a real OTP from inbox")


section("§4. Password login")
skip("client.login(email, password)", "destructive — needs real credentials")


section("§5. Token management (set_access_token / clear_access_token)")


def _token_mgmt():
    c = ImbraceClient(api_key=API_KEY, organization_id=ORG_ID, gateway=GATEWAY, timeout=10)
    c.set_access_token("acc_dummy_token")
    c.clear_access_token()
    return {"ok": True}


step("set_access_token + clear_access_token", _token_mgmt)


section("§6. Async context manager")


def _async_ctx_mgr():
    import asyncio
    from imbrace import AsyncImbraceClient

    async def _run():
        async with AsyncImbraceClient(api_key=API_KEY, organization_id=ORG_ID, gateway=GATEWAY, timeout=10) as ac:
            return await ac.platform.get_me()
    return asyncio.run(_run())


step("async with AsyncImbraceClient(api_key=...) as ac: ac.platform.get_me()", _async_ctx_mgr)


print(f"\n=== Summary (authentication / API key) ===")
print(f"pass={passed}  fail={failed}  skip={skipped_n}")
if failures:
    print("Failures:")
    for f in failures: print(f"  - {f}")
if doc_gaps:
    print("Doc gaps:")
    for g in doc_gaps: print(f"  - {g}")
sys.exit(1 if failed > 0 else 0)
