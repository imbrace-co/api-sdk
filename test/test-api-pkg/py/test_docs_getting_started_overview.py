"""Mirrors website/public/getting-started/overview.md against `imbrace==1.0.4`
(PyPI) — API-key auth. Doc has only a TS snippet; verify Py SDK at least
exposes `chat_ai.list_ai_agents`.
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

passed = failed = 0; failures: list[str] = []


def step(label, fn):
    global passed, failed
    sys.stdout.write(f"  - {label} ... "); sys.stdout.flush()
    try:
        r = fn(); print(f"OK {json.dumps(r, default=str)[:90]}"); passed += 1
    except Exception as e:
        print(f"FAIL [{str(e)[:80]}]"); failed += 1; failures.append(f"{label} -> {str(e)[:80]}")


print(f"\n=== DOCS: getting-started/overview.md - auth: API KEY (PyPI imbrace==1.0.4) ===\n")
print("== §Quick example — verify Py mirror of init + chat_ai.list_ai_agents ==")
client = ImbraceClient(api_key=API_KEY, organization_id=ORG_ID, gateway=GATEWAY, timeout=8)
step("client.chat_ai.list_ai_agents()", lambda: client.chat_ai.list_ai_agents())

print(f"\n=== Summary (getting-started/overview / API key) ===")
print(f"pass={passed}  fail={failed}  skip=0")
if failures:
    print("Failures:")
    for f in failures: print(f"  - {f}")
sys.exit(1 if failed > 0 else 0)
