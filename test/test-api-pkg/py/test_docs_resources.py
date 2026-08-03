"""Mirrors website/public/sdk/resources.md against `imbrace==1.0.4` (PyPI)
— API-key auth.

Many resources here (contacts/channel-service/campaign/predict) are flagged
as unreachable on app-gatewayv2 in FIX_PLAN_v1.0.6.md §A.1 — most failures
below are backend ops issues, not SDK bugs.
"""
from __future__ import annotations
import json
import os
import sys
import time

from dotenv import load_dotenv
load_dotenv()

from imbrace import ImbraceClient

API_KEY = os.environ.get("IMBRACE_API_KEY")
ORG_ID  = os.environ.get("IMBRACE_ORGANIZATION_ID")
GATEWAY = os.environ.get("IMBRACE_GATEWAY_URL", "https://app-gatewayv2.imbrace.co")

if not API_KEY or not ORG_ID:
    print("Missing IMBRACE_API_KEY or IMBRACE_ORGANIZATION_ID")
    sys.exit(1)

client = ImbraceClient(api_key=API_KEY, organization_id=ORG_ID, gateway=GATEWAY, timeout=30)

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


print(f"\n=== DOCS: resources.md - auth: API KEY (PyPI imbrace==1.0.4) ===")
print(f"gateway={GATEWAY}\norg={ORG_ID}\n")

ts = int(time.time() * 1000)
state = {"contactId": None, "convId": None, "buId": None, "campaignId": None, "touchpointId": None}

note("backend-known-issue: contacts/channel-service/campaign/predict often timeout on app-gatewayv2 (FIX_PLAN_v1.0.6 §A.1)")


section("§1. Contacts")


def _list_contacts():
    r = client.contacts.list(limit=50)
    data = r.get("data", []) if isinstance(r, dict) else (r or [])
    state["contactId"] = data[0].get("_id") if data else None
    return {"count": len(data), "sampleId": state["contactId"]}


step("contacts.list (limit=50) + capture first id", _list_contacts)

if state["contactId"]:
    step("contacts.get(contact_id)", lambda: client.contacts.get(state["contactId"]))
    skip("contacts.update", "would mutate prod contact - destructive")
    step("contacts.get_comments(contact_id)", lambda: client.contacts.get_comments(state["contactId"]))
    step("contacts.get_files(contact_id)", lambda: client.contacts.get_files(state["contactId"]))
else:
    skip("contacts.get / update / get_comments / get_files", "no contact fixture")


section("§2. Conversations")


def _list_bu():
    bus = client.platform.list_business_units()
    state["buId"] = (bus[0] or {}).get("_id") if bus else None
    return {"count": len(bus or []), "sampleId": state["buId"]}


step("platform.list_business_units + capture first bu_id", _list_bu)

if state["buId"]:
    def _search_conv():
        r = client.conversations.search(business_unit_id=state["buId"], q="support", limit=20)
        data = r.get("data", []) if isinstance(r, dict) else []
        state["convId"] = data[0].get("_id") if data else None
        return {"count": len(data), "sampleConvId": state["convId"]}
    step("conversations.search (business_unit_id=, q='support')", _search_conv)
else:
    skip("conversations.search", "no businessUnit fixture")

step("conversations.list (limit 50) — Py docs use list (TS uses getOutstanding)",
     lambda: client.conversations.list(limit=50))

skip("conversations.update_status / assign_team_member", "destructive")

if state["convId"]:
    step("contacts.get_activities(conversation_id)",
         lambda: client.contacts.get_activities(state["convId"]))
else:
    skip("contacts.get_activities(conversation_id)", "no conversation fixture")


section("§3. Messaging")
step("channel.list", lambda: client.channel.list())
skip("messages.send", "destructive")
if state["convId"]:
    if hasattr(client.messages, "list"):
        step("messages.list (limit 20, conversation_id=)",
             lambda: client.messages.list(limit=20, conversation_id=state["convId"]))
    else:
        skip("messages.list", "method not exposed on Py SDK 1.0.4")
else:
    skip("messages.list", "needs conversation_id fixture")


section("§4. Campaigns + touchpoints")
step("campaign.list", lambda: client.campaign.list())


def _create_campaign():
    c = client.campaign.create({"name": f"TestCampaign {ts}", "type": "email"})
    state["campaignId"] = c.get("_id") if isinstance(c, dict) else getattr(c, "_id", None)
    return {"id": state["campaignId"]}


step("campaign.create (throwaway)", _create_campaign)

if state["campaignId"]:
    step("campaign.get(campaign_id)", lambda: client.campaign.get(state["campaignId"]))

step("campaign.list_touchpoints", lambda: client.campaign.list_touchpoints())

if state["campaignId"]:
    def _create_touchpoint():
        tp = client.campaign.create_touchpoint({
            "campaign_id": state["campaignId"], "type": "email", "delay_days": 3,
        })
        state["touchpointId"] = tp.get("_id") if isinstance(tp, dict) else getattr(tp, "_id", None)
        return {"id": state["touchpointId"]}
    step("campaign.create_touchpoint", _create_touchpoint)

    if state["touchpointId"]:
        step("campaign.get_touchpoint(touchpoint_id)",
             lambda: client.campaign.get_touchpoint(state["touchpointId"]))
        step("campaign.update_touchpoint(touchpoint_id, { delay_days: 5 })",
             lambda: client.campaign.update_touchpoint(state["touchpointId"], {"delay_days": 5}))

step("campaign.validate_touchpoint",
     lambda: client.campaign.validate_touchpoint({"type": "email", "template_id": "tpl_xxx"}))

if state["touchpointId"]:
    step("campaign.delete_touchpoint (cleanup)",
         lambda: client.campaign.delete_touchpoint(state["touchpointId"]))
if state["campaignId"]:
    step("campaign.delete (cleanup)", lambda: client.campaign.delete(state["campaignId"]))


section("§5. Message suggestion")
if state["convId"]:
    step("message_suggestion.get_suggestions ({ conversation_id, limit: 3 })",
         lambda: client.message_suggestion.get_suggestions({"conversation_id": state["convId"], "limit": 3}))
else:
    skip("message_suggestion.get_suggestions", "no conversation fixture")


section("§6. Predict")
note("backend-known-issue: predict.predict org-config dependent — model 'lead_score_v1' may not be deployed for this org")
step("predict.predict ({ model: 'lead_score_v1', input })",
     lambda: client.predict.predict({
         "model": "lead_score_v1",
         "input": {"company_size": 200, "industry": "saas", "mrr": 5000},
     }))


print(f"\n=== Summary (resources / API key) ===")
print(f"pass={passed}  fail={failed}  skip={skipped_n}")
if failures:
    print("Failures:")
    for f in failures: print(f"  - {f}")
if doc_gaps:
    print("Doc / backend gaps:")
    for g in doc_gaps: print(f"  - {g}")
sys.exit(1 if failed > 0 else 0)
