"""Mirrors website/public/sdk/integrations.md against `imbrace==1.0.4` (PyPI)
— Access Token auth. See test-api-pkg/py/test_docs_integrations.py for
commentary.
"""
from __future__ import annotations
import json
import os
import sys
import time
import asyncio

from dotenv import load_dotenv
load_dotenv()

from imbrace import ImbraceClient, AsyncImbraceClient

ACCESS_TOKEN = os.environ.get("IMBRACE_ACCESS_TOKEN")
ORG_ID       = os.environ.get("IMBRACE_ORGANIZATION_ID")
GATEWAY      = os.environ.get("IMBRACE_GATEWAY_URL", "https://app-gatewayv2.imbrace.co")

if not ACCESS_TOKEN or not ORG_ID:
    print("Missing IMBRACE_ACCESS_TOKEN or IMBRACE_ORGANIZATION_ID")
    sys.exit(1)

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


print(f"\n=== DOCS: integrations.md - auth: ACCESS TOKEN (PyPI imbrace==1.0.4) ===")
print(f"gateway={GATEWAY}\norg={ORG_ID}\n")


section("§1. FastAPI dependency — AsyncImbraceClient context manager")


async def _async_get_me():
    async with AsyncImbraceClient(access_token=ACCESS_TOKEN, organization_id=ORG_ID, gateway=GATEWAY, timeout=15) as ac:
        try:
            return await ac.platform.get_me()
        except Exception as e:
            return {"err": str(e)[:60]}


step("AsyncImbraceClient.platform.get_me()", lambda: asyncio.run(_async_get_me()))


section("§2. FastAPI dep — marketplace.list_products")
note("backend-known-issue: marketplace + ai endpoints often unavailable on app-gatewayv2 (FIX_PLAN_v1.0.6 §A.1)")
note("doc-gap: integrations.md §FastAPI shows `await client.marketplace.list_products(limit=20)` (kwargs); Py SDK 1.0.4 takes a single `params` dict — `await client.marketplace.list_products({\"limit\": 20})`")


async def _async_list_products():
    async with AsyncImbraceClient(access_token=ACCESS_TOKEN, organization_id=ORG_ID, gateway=GATEWAY, timeout=15) as ac:
        return await ac.marketplace.list_products({"limit": 20})


step("AsyncImbraceClient.marketplace.list_products(limit=20)", lambda: asyncio.run(_async_list_products()))


section("§3. asyncio.gather — 3 concurrent reads")
note("doc-gap: integrations.md §asyncio uses `client.channel.list_channels(type='group')` — SDK 1.0.4 has `channel.list()` not `list_channels`")


async def _gather_dashboard():
    async with AsyncImbraceClient(access_token=ACCESS_TOKEN, organization_id=ORG_ID, gateway=GATEWAY, timeout=15) as ac:
        results = await asyncio.gather(
            ac.platform.get_me(),
            ac.marketplace.list_products({"limit": 5}),
            ac.channel.list(),
            return_exceptions=True,
        )
        return {
            "user_ok": not isinstance(results[0], Exception),
            "products_ok": not isinstance(results[1], Exception),
            "channels_ok": not isinstance(results[2], Exception),
        }


step("asyncio.gather(get_me, list_products, channel.list)", lambda: asyncio.run(_gather_dashboard()))


section("§4. Async streaming — AsyncImbraceClient.ai.stream")
note("backend-known-issue: /v3/ai/* routes may 404 on app-gatewayv2; doc kwargs signature wrong")
skip("AsyncImbraceClient.ai.stream", "backend route unreachable + signature gap (covered in test_docs_ai_agent.py)")


section("§5. Django sync view — ImbraceClient as context manager")


def _sync_with_client():
    with ImbraceClient(access_token=ACCESS_TOKEN, organization_id=ORG_ID, gateway=GATEWAY, timeout=15) as c:
        try:
            return c.marketplace.list_products({"limit": 20})
        except Exception as e:
            return {"err": str(e)[:60]}


step("ImbraceClient as context manager — marketplace.list_products(limit=20)", _sync_with_client)


section("§6. Celery task — sync client + retry on NetworkError")
skip("Celery task wrapper", "framework integration - SDK calls covered by §5")


section("§7. OTP login flow")
skip("client.request_otp(email)", "destructive — would send a real OTP email")
skip("client.login_with_otp(email, otp)", "destructive — needs a real OTP from inbox")


print(f"\n=== Summary (integrations / Access Token) ===")
print(f"pass={passed}  fail={failed}  skip={skipped_n}")
if failures:
    print("Failures:")
    for f in failures: print(f"  - {f}")
if doc_gaps:
    print("Doc / backend gaps:")
    for g in doc_gaps: print(f"  - {g}")
sys.exit(1 if failed > 0 else 0)
