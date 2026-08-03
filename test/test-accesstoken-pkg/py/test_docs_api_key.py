"""Mirrors website/public/guides/api-key.md against `imbrace==1.0.4`
(PyPI) — Access Token auth. With access-token, `auth.get_third_party_token`
should succeed.
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


print(f"\n=== DOCS: guides/api-key.md - auth: ACCESS TOKEN (PyPI imbrace==1.0.4) ===\n")

print("== §Option 2 — programmatic via SDK (access-token expected to succeed) ==")
client = ImbraceClient(access_token=ACCESS_TOKEN, organization_id=ORG_ID, gateway=GATEWAY, timeout=10)
step("client.auth.get_third_party_token(expiration_days=30)",
     lambda: client.auth.get_third_party_token(expiration_days=30))

print("== §Using the key — covered in test-api-pkg ==")
skip("ImbraceClient(api_key=...).platform.get_me()", "covered in test-api-pkg")

print(f"\n=== Summary (api-key / Access Token) ===")
print(f"pass={passed}  fail={failed}  skip={skipped_n}")
if failures:
    print("Failures:")
    for f in failures: print(f"  - {f}")
sys.exit(1 if failed > 0 else 0)
