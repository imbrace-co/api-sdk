"""Mirrors website/public/guides/troubleshooting.md against `imbrace==1.0.4`
(PyPI) — API-key auth.

The doc shows error scenarios — we trigger the documented bug to verify
the SDK behaves as the doc claims:
  - `channel.list()` without `type` raises 400 (per doc)
  - `channel.list(type="web")` works
"""
from __future__ import annotations
import os, sys, json
from dotenv import load_dotenv
load_dotenv()
from imbrace import ImbraceClient

API_KEY = os.environ.get("IMBRACE_API_KEY"); ORG_ID = os.environ.get("IMBRACE_ORGANIZATION_ID")
GATEWAY = os.environ.get("IMBRACE_GATEWAY_URL", "https://app-gatewayv2.imbrace.co")
if not API_KEY or not ORG_ID:
    print("Missing creds"); sys.exit(1)

client = ImbraceClient(api_key=API_KEY, organization_id=ORG_ID, gateway=GATEWAY, timeout=8)
passed = failed = 0; failures: list[str] = []


def step(label, fn, expect_fail=False):
    global passed, failed
    sys.stdout.write(f"  - {label} ... "); sys.stdout.flush()
    try:
        r = fn(); summary = json.dumps(r, default=str)[:90] if r is not None else ""
        if expect_fail:
            print(f"unexpected pass {summary}"); failed += 1; failures.append(f"{label} -> unexpected pass")
        else:
            print(f"OK {summary}"); passed += 1
    except Exception as e:
        code = str(e)[:80]
        if expect_fail:
            print(f"OK (expected fail [{code}])"); passed += 1
        else:
            print(f"FAIL [{code}]"); failed += 1; failures.append(f"{label} -> {code}")


print(f"\n=== DOCS: guides/troubleshooting.md - auth: API KEY (PyPI imbrace==1.0.4) ===\n")

print("== §channel.list — doc claims missing `type` triggers 400 ==")
step("channel.list() without `type` — expected 400 per doc",
     lambda: client.channel.list(), expect_fail=True)
step("channel.list(type='web') — should work",
     lambda: client.channel.list(type="web"))

print(f"\n=== Summary (troubleshooting / API key) ===")
print(f"pass={passed}  fail={failed}  skip=0")
if failures:
    print("Failures:")
    for f in failures: print(f"  - {f}")
sys.exit(1 if failed > 0 else 0)
