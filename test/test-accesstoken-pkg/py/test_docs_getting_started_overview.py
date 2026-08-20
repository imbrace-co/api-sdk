"""Mirrors website/public/getting-started/overview.md against `imbrace==1.0.4`
(PyPI) — Access Token auth.
"""
from __future__ import annotations
import os, sys, json
from dotenv import load_dotenv
load_dotenv()
from imbrace import ImbraceClient

ACCESS_TOKEN = os.environ.get("IMBRACE_ACCESS_TOKEN"); ORG_ID = os.environ.get("IMBRACE_ORGANIZATION_ID")
GATEWAY = os.environ.get("IMBRACE_GATEWAY_URL", "https://app-gatewayv2.imbrace.co")
if not ACCESS_TOKEN or not ORG_ID:
    print("Missing creds"); sys.exit(1)

passed = failed = 0; failures: list[str] = []


def step(label, fn):
    global passed, failed
    sys.stdout.write(f"  - {label} ... "); sys.stdout.flush()
    try:
        r = fn(); print(f"OK {json.dumps(r, default=str)[:90]}"); passed += 1
    except Exception as e:
        print(f"FAIL [{str(e)[:80]}]"); failed += 1; failures.append(f"{label} -> {str(e)[:80]}")


print(f"\n=== DOCS: getting-started/overview.md - auth: ACCESS TOKEN (PyPI imbrace==1.0.4) ===\n")
print("== §Quick example ==")
client = ImbraceClient(access_token=ACCESS_TOKEN, organization_id=ORG_ID, gateway=GATEWAY, timeout=8)
step("client.chat_ai.list_ai_agents()", lambda: client.chat_ai.list_ai_agents())

print(f"\n=== Summary (getting-started/overview / Access Token) ===")
print(f"pass={passed}  fail={failed}  skip=0")
if failures:
    print("Failures:")
    for f in failures: print(f"  - {f}")
sys.exit(1 if failed > 0 else 0)
