"""iMBRACE AI Chat — Python edition.

A FastAPI web app that mirrors the TypeScript ai-chat-webapp, but every call
goes through the **Python** SDK (imbrace). Run it to test the Python SDK the
same way you tested the TS one: a real browser, real login -> org -> agent ->
SSE streaming chat, plus Knowledge Hub / Workflows.

    cd py
    python webapp/server.py        # serves http://localhost:8200

Each browser session gets its own ImbraceClient (keyed by a cookie), so the
auth flow (login_acc_ -> exchange -> acc_) is carried per user, just like the
TS app's shared client.
"""
from __future__ import annotations

import json
import secrets
from pathlib import Path
from typing import Any, Dict

from fastapi import Body, FastAPI, File, HTTPException, Request, Response, UploadFile
from fastapi.responses import FileResponse, StreamingResponse

from imbrace import ImbraceClient

app = FastAPI(title="iMBRACE AI Chat (Python)")

# session-id (cookie) -> per-user SDK client + remembered org id
SESSIONS: Dict[str, Dict[str, Any]] = {}
COOKIE = "imb_py_sid"


def get_session(request: Request) -> Dict[str, Any]:
    sid = request.cookies.get(COOKIE)
    if not sid or sid not in SESSIONS:
        raise HTTPException(401, "Not logged in")
    return SESSIONS[sid]


def client_of(request: Request) -> ImbraceClient:
    return get_session(request)["client"]


# ── Auth ──────────────────────────────────────────────────────────────────────

@app.post("/api/login")
def login(response: Response, body: Dict[str, str] = Body(...)):
    email = (body.get("email") or "").strip()
    password = (body.get("password") or "").strip()
    client = ImbraceClient(env="stable")
    try:
        client.login(email, password)
    except Exception as e:  # noqa: BLE001
        raise HTTPException(400, _friendly(e)) from e

    # fetch orgs for the picker (login_acc_ -> /v1/organizations)
    try:
        paged = client.organizations.list_for_login(limit=50)
        orgs = paged.get("data", []) if isinstance(paged, dict) else []
    except Exception as e:  # noqa: BLE001
        raise HTTPException(400, _friendly(e)) from e

    sid = secrets.token_hex(16)
    SESSIONS[sid] = {"client": client, "org": None}
    response.set_cookie(COOKIE, sid, httponly=True, samesite="lax")
    return {"organizations": [_norm_org(o) for o in orgs]}


@app.post("/api/select-org")
def select_org(request: Request, body: Dict[str, str] = Body(...)):
    sess = get_session(request)
    client: ImbraceClient = sess["client"]
    org_id = body.get("organization_id", "")
    # Python SDK has no select_organization() helper — exchange manually.
    client.http.organization_id = org_id
    try:
        res = client.auth.exchange_access_token(org_id)
    except Exception as e:  # noqa: BLE001
        client.http.organization_id = None
        raise HTTPException(400, _friendly(e)) from e
    token = res.get("token") or res.get("access_token")
    if not token:
        raise HTTPException(400, "Exchange returned no token")
    client.set_access_token(token)
    client.http.organization_id = org_id
    sess["org"] = org_id
    return {"ok": True}


@app.post("/api/logout")
def logout(request: Request, response: Response):
    sid = request.cookies.get(COOKIE)
    if sid:
        SESSIONS.pop(sid, None)
    response.delete_cookie(COOKIE)
    return {"ok": True}


# ── AI Agent ──────────────────────────────────────────────────────────────────

@app.get("/api/agents")
def agents(request: Request):
    res = client_of(request).chat_ai.list_ai_agents()
    arr = res if isinstance(res, list) else res.get("data", [])
    return [_norm_agent(a) for a in arr if (a.get("id") or a.get("_id"))]


@app.post("/api/chat")
def chat(request: Request, body: Dict[str, Any] = Body(...)):
    """SSE streaming chat — yields raw text chunks from the Python SDK generator."""
    client = client_of(request)
    assistant_id = body["assistant_id"]
    messages = body["messages"]

    def gen():
        try:
            for chunk in client.ai_agent.stream_chat_text(
                {"assistant_id": assistant_id, "messages": messages}
            ):
                # SSE frame; JSON-encode to preserve newlines/spaces
                yield f"data: {json.dumps({'delta': chunk})}\n\n"
        except Exception as e:  # noqa: BLE001
            yield f"data: {json.dumps({'error': _friendly(e)})}\n\n"
        yield "data: [DONE]\n\n"

    return StreamingResponse(gen(), media_type="text/event-stream")


# ── Knowledge Hub ─────────────────────────────────────────────────────────────

@app.get("/api/folders")
def folders(request: Request):
    res = client_of(request).boards.search_folders()
    arr = res if isinstance(res, list) else res.get("data", [])
    return [{"id": f.get("id") or f.get("_id"), "name": f.get("name", "Untitled"),
             "description": f.get("description") or None} for f in arr]


@app.post("/api/folders")
def create_folder(request: Request, body: Dict[str, str] = Body(...)):
    sess = get_session(request)
    f = sess["client"].boards.create_folder(
        {"name": body.get("name", "Untitled"), "organization_id": sess["org"]}
    )
    return {"id": f.get("id") or f.get("_id"), "name": f.get("name")}


@app.get("/api/folders/{folder_id}/files")
def files(request: Request, folder_id: str):
    res = client_of(request).boards.search_files(folder_id)
    arr = res if isinstance(res, list) else res.get("data", [])
    return [{"id": f.get("id") or f.get("_id"), "name": f.get("name"),
             "fileType": f.get("file_type"), "fileSize": f.get("file_size")} for f in arr]


@app.post("/api/folders/{folder_id}/upload")
async def upload(request: Request, folder_id: str, file: UploadFile = File(...)):
    sess = get_session(request)
    content = await file.read()
    files_payload = {
        "file": (file.filename, content, file.content_type or "application/octet-stream"),
        "folder_id": (None, folder_id),
        "organization_id": (None, sess["org"]),
    }
    up = sess["client"].boards.upload_file(files_payload)
    return {"id": up.get("id") or up.get("file_id"), "name": up.get("name", file.filename)}


# ── Agent ↔ Knowledge ─────────────────────────────────────────────────────────

@app.get("/api/agents/{agent_id}/folders")
def agent_folders(request: Request, agent_id: str):
    a = client_of(request).chat_ai.get_ai_agent(agent_id)
    return {"folder_ids": a.get("folder_ids") or []}


@app.post("/api/agents/{agent_id}/folders")
def set_agent_folder(request: Request, agent_id: str, body: Dict[str, Any] = Body(...)):
    client = client_of(request)
    folder_id = body["folder_id"]
    attach = bool(body.get("attached"))
    a = client.chat_ai.get_ai_agent(agent_id)
    current = list(a.get("folder_ids") or [])
    nxt = list(dict.fromkeys(current + [folder_id])) if attach else [x for x in current if x != folder_id]
    # assistant_apps PUT is full-object: must echo name + workflow_name + model.
    client.ai.update_ai_agent_app(agent_id, {
        "name": a.get("name"),
        "workflow_name": a.get("workflow_name"),
        "model_id": a.get("model_id"),
        "provider_id": a.get("provider_id"),
        "folder_ids": nxt,
    })
    return {"folder_ids": nxt}


# ── Workflows ─────────────────────────────────────────────────────────────────

@app.get("/api/flows")
def flows(request: Request):
    res = client_of(request).workflows.list_flows(limit=50)
    arr = res.get("data", []) if isinstance(res, dict) else []
    return [{"id": f.get("id"),
             "name": (f.get("version") or {}).get("displayName") or f.get("displayName") or "Untitled",
             "status": f.get("status")} for f in arr]


@app.get("/api/runs")
def runs(request: Request):
    res = client_of(request).workflows.list_runs(limit=50)
    arr = res.get("data", []) if isinstance(res, dict) else []
    return [{"id": r.get("id"), "status": r.get("status"), "updated": r.get("updated")} for r in arr]


@app.post("/api/flows")
def create_flow(request: Request, body: Dict[str, str] = Body(...)):
    client = client_of(request)
    existing = client.workflows.list_flows(limit=1).get("data", [])
    if not existing:
        raise HTTPException(400, "No project to derive projectId from")
    project_id = existing[0].get("projectId")
    f = client.workflows.create_flow(body.get("display_name", "New Flow"), project_id)
    return {"id": f.get("id")}


@app.post("/api/flows/{flow_id}/trigger")
def trigger_flow(request: Request, flow_id: str):
    client_of(request).workflows.trigger_flow(flow_id, {"source": "py-webapp"})
    return {"ok": True}


# ── Data Board ────────────────────────────────────────────────────────────────

@app.get("/api/boards")
def boards(request: Request):
    res = client_of(request).boards.list(limit=100)
    arr = res.get("data", []) if isinstance(res, dict) else []
    return [{"id": b.get("_id") or b.get("id"), "name": b.get("name"),
             "type": b.get("type"), "description": b.get("description")} for b in arr]


# ── Helpers + static ──────────────────────────────────────────────────────────

def _norm_org(o: Dict[str, Any]) -> Dict[str, str]:
    return {"id": str(o.get("_id") or o.get("id") or o.get("organization_id") or ""),
            "name": str(o.get("name") or o.get("organization_name") or o.get("title") or "")}


def _norm_agent(a: Dict[str, Any]) -> Dict[str, Any]:
    return {"id": str(a.get("id") or a.get("_id") or ""),
            "name": str(a.get("name") or "Untitled agent"),
            "model_id": a.get("model_id") or "",
            "description": a.get("description") or None}


def _friendly(e: Exception) -> str:
    raw = " ".join(str(e).split())
    if "User not found in this organization" in raw:
        return "You're not a member of this organization. Pick a different one."
    # The login token (login_acc_) expires after ~30 min; once stale, the
    # org-exchange fails with one of these messages for EVERY org. Tell the user
    # to re-login rather than blame the org id.
    if "Invalid organization ID / email" in raw or "expired access token" in raw or "Invalid or expired" in raw:
        return "Your login session expired. Please sign in again and pick the org promptly (within ~30 min)."
    if "missing model_id" in raw or "model_id/provider_id" in raw:
        return "This agent has no model configured. Pick another agent."
    if "Invalid email or password" in raw:
        return "Invalid email or password."
    if "EHOSTUNREACH" in raw or "Cannot connect" in raw:
        return "AI backend temporarily unavailable (model worker down). Try again shortly."
    return raw[:200]


_STATIC = Path(__file__).parent / "static"


@app.get("/")
def index():
    return FileResponse(_STATIC / "index.html")


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="127.0.0.1", port=8200)
