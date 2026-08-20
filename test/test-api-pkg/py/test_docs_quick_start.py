"""Mirrors website/public/sdk/quick-start.md against `imbrace==1.0.4`
(PyPI) — API-key auth.
"""
from __future__ import annotations
import os, sys, json
from dotenv import load_dotenv
load_dotenv()
from imbrace import ImbraceClient

API_KEY = os.environ.get("IMBRACE_API_KEY"); ORG_ID = os.environ.get("IMBRACE_ORGANIZATION_ID")
GATEWAY = os.environ.get("IMBRACE_GATEWAY_URL", "https://app-gatewayv2.imbrace.co")
if not API_KEY or not ORG_ID:
    print("Missing IMBRACE_API_KEY or IMBRACE_ORGANIZATION_ID"); sys.exit(1)

passed = failed = 0; failures: list[str] = []


def step(label, fn):
    global passed, failed
    sys.stdout.write(f"  - {label} ... "); sys.stdout.flush()
    try:
        r = fn()
        print(f"OK {json.dumps(r, default=str)[:90]}"); passed += 1
    except Exception as e:
        code = str(e)[:80]
        print(f"FAIL [{code}]"); failed += 1; failures.append(f"{label} -> {code}")


def section(title): print(f"\n== {title} ==")


print(f"\n=== DOCS: quick-start.md - auth: API KEY (PyPI imbrace==1.0.4) ===\n")

section("§1. Initialize client (api_key)")
client = ImbraceClient(api_key=API_KEY, organization_id=ORG_ID, gateway=GATEWAY, timeout=8)

section("§2. boards.list — verify connectivity")
step("boards.list", lambda: client.boards.list())

print(f"\n=== Summary (quick-start / API key) ===")
print(f"pass={passed}  fail={failed}  skip=0")
if failures:
    print("Failures:")
    for f in failures: print(f"  - {f}")
sys.exit(1 if failed > 0 else 0)
