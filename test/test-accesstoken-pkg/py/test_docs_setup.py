"""Mirrors website/public/getting-started/setup.md against `imbrace==1.0.4`
(PyPI) — Access Token auth.
"""
from __future__ import annotations
import os, sys, json, asyncio
from dotenv import load_dotenv
load_dotenv()
from imbrace import ImbraceClient, AsyncImbraceClient

ACCESS_TOKEN = os.environ.get("IMBRACE_ACCESS_TOKEN"); ORG_ID = os.environ.get("IMBRACE_ORGANIZATION_ID")
GATEWAY = os.environ.get("IMBRACE_GATEWAY_URL", "https://app-gatewayv2.imbrace.co")
if not ACCESS_TOKEN or not ORG_ID:
    print("Missing creds"); sys.exit(1)

passed = failed = skipped_n = 0; failures: list[str] = []


def step(label, fn):
    global passed, failed
    sys.stdout.write(f"  - {label} ... "); sys.stdout.flush()
    try:
        r = fn(); print(f"OK {json.dumps(r, default=str)[:90]}"); passed += 1
    except Exception as e:
        print(f"FAIL [{str(e)[:80]}]"); failed += 1; failures.append(f"{label} -> {str(e)[:80]}")


def skip(label, reason):
    global skipped_n
    print(f"  - {label}  SKIP: {reason}"); skipped_n += 1


print(f"\n=== DOCS: getting-started/setup.md - auth: ACCESS TOKEN (PyPI imbrace==1.0.4) ===\n")

print("== §Init by env preset (env='stable') ==")
step("ImbraceClient(access_token=..., env='stable').platform.get_me()",
     lambda: ImbraceClient(access_token=ACCESS_TOKEN, organization_id=ORG_ID, env="stable", timeout=8).platform.get_me())

print("== §Init by gateway URL ==")
step("ImbraceClient(access_token=..., gateway=...).platform.get_me()",
     lambda: ImbraceClient(access_token=ACCESS_TOKEN, organization_id=ORG_ID, gateway=GATEWAY, timeout=8).platform.get_me())

print("== §services override (construct only) ==")


def _services_override():
    c = ImbraceClient(
        access_token=ACCESS_TOKEN, organization_id=ORG_ID, env="develop", timeout=1,
        services={"ai_agent": "http://localhost:4000/ai-agent"},
    )
    return {"ok": c is not None}


step("ImbraceClient(services={...}) constructs ok", _services_override)

print("== §AsyncImbraceClient hello world ==")


def _async_hello():
    async def _run():
        async with AsyncImbraceClient(access_token=ACCESS_TOKEN, organization_id=ORG_ID, gateway=GATEWAY, timeout=8) as ac:
            try:
                return await ac.platform.get_me()
            except Exception as e:
                return {"err": str(e)[:60]}
    return asyncio.run(_run())


step("async with AsyncImbraceClient(access_token=...) as ac: ac.platform.get_me()", _async_hello)

print("== §Hello-world calls ==")
client = ImbraceClient(access_token=ACCESS_TOKEN, organization_id=ORG_ID, gateway=GATEWAY, timeout=8)
step("client.channel.list()", lambda: client.channel.list())
skip("messages.send / ai.complete / ai_agent.stream_chat", "destructive or covered elsewhere")

print("== §OTP login flow ==")
skip("request_otp / login_with_otp", "destructive")

print(f"\n=== Summary (setup / Access Token) ===")
print(f"pass={passed}  fail={failed}  skip={skipped_n}")
if failures:
    print("Failures:")
    for f in failures: print(f"  - {f}")
sys.exit(1 if failed > 0 else 0)
