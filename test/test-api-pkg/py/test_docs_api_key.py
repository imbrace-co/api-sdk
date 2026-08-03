"""Mirrors website/public/guides/api-key.md against `imbrace==1.0.4`
(PyPI) — API-key auth.

The programmatic key generation `client.auth.get_third_party_token` requires
an access-token client per the doc. With API-key auth we expect 401/403.
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

passed = failed = skipped_n = 0; failures: list[str] = []; doc_gaps: list[str] = []


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


def skip(label, reason):
    global skipped_n
    print(f"  - {label}  SKIP: {reason}"); skipped_n += 1


def note(msg): print(f"  i {msg}"); doc_gaps.append(msg)


print(f"\n=== DOCS: guides/api-key.md - auth: API KEY (PyPI imbrace==1.0.4) ===\n")

print("== §Option 2 — programmatic via SDK ==")
note("doc-gap: get_third_party_token requires access-token client; API-key call typically 401/403")
client = ImbraceClient(api_key=API_KEY, organization_id=ORG_ID, gateway=GATEWAY, timeout=10)
step("client.auth.get_third_party_token(expiration_days=30) — expected to fail with API-key auth",
     lambda: client.auth.get_third_party_token(expiration_days=30),
     expect_fail=True)

print("== §Using the key — re-init with apiKey from env ==")
def _verify():
    c = ImbraceClient(api_key=API_KEY, organization_id=ORG_ID, gateway=GATEWAY, timeout=10)
    return c.platform.get_me()
step("ImbraceClient(api_key=...).platform.get_me()", _verify)

print(f"\n=== Summary (api-key / API key) ===")
print(f"pass={passed}  fail={failed}  skip={skipped_n}")
if failures:
    print("Failures:")
    for f in failures: print(f"  - {f}")
if doc_gaps:
    print("Doc gaps:")
    for g in doc_gaps: print(f"  - {g}")
sys.exit(1 if failed > 0 else 0)
