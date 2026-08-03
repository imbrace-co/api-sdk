"""Document AI wrapper test — uses EXISTING Document AI agents on sandbox.

Read-only smoke test: verifies the wrapper resolves real agent data.
Does NOT create/delete agents (would mutate server state).

Usage:
    pip install ../py/dist/imbrace-X.Y.Z.whl
    PYTHONIOENCODING=utf-8 python tests/test_document_ai.py
"""
import os
import asyncio
from pathlib import Path
from imbrace import ImbraceClient
from imbrace.async_client import AsyncImbraceClient

try:
    from dotenv import load_dotenv
    load_dotenv(Path(__file__).resolve().parent.parent / ".env")
except ImportError:
    pass

try:
    ACCESS_TOKEN: str = os.environ["IMBRACE_ACCESS_TOKEN"]
    ORG_ID:       str = os.environ["IMBRACE_ORGANIZATION_ID"]
except KeyError as e:
    raise SystemExit(f"Required env var not set: {e}")
GATEWAY = os.environ.get("IMBRACE_GATEWAY_URL", "https://app-gatewayv2.imbrace.co")

SAMPLE_URL = "https://app-gatewayv2.imbrace.co/files/download/118615471-5b33f600-b7f3-11eb-94a1-78e635e66558.png"

passed = failed = 0


def ok(label, detail=""):
    global passed
    print(f"  [OK] {label}{('  -> ' + str(detail)[:120]) if detail else ''}")
    passed += 1


def fail(label, err):
    global failed
    print(f"  [FAIL] {label}: {err}")
    failed += 1


# ─────────────────────────────────────────────────────────────────────────────
# SYNC
# ─────────────────────────────────────────────────────────────────────────────

def test_sync():
    print("\n--- Sync ---")
    client = ImbraceClient(access_token=ACCESS_TOKEN, organization_id=ORG_ID, gateway=GATEWAY)
    da = client.document_ai

    # [1] list_agents — filter by agent_type
    print("\n  [1] list_agents (filter by agent_type=document_ai)")
    try:
        agents = da.list_agents()
        ok(f"found {len(agents)} document_ai agents",
           ", ".join(a.get("name", "") for a in agents[:3]))
    except Exception as e:
        fail("list_agents", str(e)[:120])
        return  # cannot continue without agents

    # [2] get_agent (first one)
    print("\n  [2] get_agent for first agent")
    if not agents:
        print("  (no agents to test)")
    else:
        first_id = agents[0].get("id") or agents[0].get("assistant_id") or agents[0].get("_id")
        try:
            detail = da.get_agent(first_id)
            ok(f"get_agent({first_id})", f"name={detail.get('name')}, model={detail.get('model_id')}")
        except Exception as e:
            fail("get_agent", str(e)[:120])

    # [3] process — direct (without agent_id)
    print("\n  [3] process (model_name only, no agent)")
    try:
        res = da.process(
            url=SAMPLE_URL,
            organization_id=ORG_ID,
            model_name="gpt-4o",
        )
        keys = list((res or {}).get("data", {}).keys())
        ok("process(model_name=gpt-4o)", f"success={res.get('success')} keys={keys[:5]}")
    except Exception as e:
        fail("process(model_name only)", str(e)[:120])

    # [4] suggest_schema
    print("\n  [4] suggest_schema (uses meta-prompt)")
    try:
        res = da.suggest_schema(url=SAMPLE_URL, organization_id=ORG_ID)
        keys = list((res or {}).get("data", {}).keys())
        ok("suggest_schema", f"success={res.get('success')} keys={keys[:5]}")
    except Exception as e:
        fail("suggest_schema", str(e)[:120])


# ─────────────────────────────────────────────────────────────────────────────
# ASYNC
# ─────────────────────────────────────────────────────────────────────────────

async def test_async():
    print("\n--- Async ---")
    async with AsyncImbraceClient(access_token=ACCESS_TOKEN, organization_id=ORG_ID, gateway=GATEWAY) as client:
        da = client.document_ai

        print("\n  [1] async list_agents")
        try:
            agents = await da.list_agents()
            ok(f"async found {len(agents)} agents")
        except Exception as e:
            fail("async list_agents", str(e)[:120])
            return

        if agents:
            first_id = agents[0].get("id") or agents[0].get("assistant_id") or agents[0].get("_id")
            print(f"\n  [2] async get_agent({first_id})")
            try:
                detail = await da.get_agent(first_id)
                ok("async get_agent", f"name={detail.get('name')}")
            except Exception as e:
                fail("async get_agent", str(e)[:120])

        print("\n  [3] async process (gpt-4o)")
        try:
            res = await da.process(
                url=SAMPLE_URL,
                organization_id=ORG_ID,
                model_name="gpt-4o",
            )
            keys = list((res or {}).get("data", {}).keys())
            ok("async process", f"success={res.get('success')} keys={keys[:5]}")
        except Exception as e:
            fail("async process", str(e)[:120])


if __name__ == "__main__":
    test_sync()
    asyncio.run(test_async())
    print(f"\n{'-' * 55}")
    print(f"  {passed} passed | {failed} failed")
    if failed > 0:
        raise SystemExit(1)
