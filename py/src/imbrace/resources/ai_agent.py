from typing import Any, Dict, List, Optional, TypedDict
from urllib.parse import urlencode, quote
from uuid import uuid4
from ..http import HttpTransport, AsyncHttpTransport


def _qs(params: Dict[str, Any]) -> str:
    filtered = {k: v for k, v in params.items() if v is not None}
    if not filtered:
        return ""
    return "?" + urlencode(filtered)


class StreamChatBody(TypedDict, total=False):
    """Body for `stream_chat`. Required: `assistant_id`, `messages`.

    Optional: `id`, `model_id`, `provider_id`, `user_id`.
    """
    assistant_id: str
    messages: List[Dict[str, Any]]
    id: str
    model_id: str
    provider_id: str
    user_id: str


class StreamSubAgentChatBody(TypedDict, total=False):
    """Body for `stream_sub_agent_chat`. Required: `assistant_id`, `session_id`, `chat_id`, `messages`."""
    assistant_id: str
    session_id: str
    chat_id: str
    messages: List[Dict[str, Any]]


class AiAgentResource:
    def __init__(self, http: HttpTransport, base: str):
        self._http = http
        self._base = base.rstrip("/")

    # --- System ---

    def get_config(self) -> Dict[str, Any]:
        return self._http.request("GET", f"{self._base}/config").json()

    def get_health(self, detailed: bool = False) -> Dict[str, Any]:
        return self._http.request("GET", f"{self._base}/health{_qs({'detailed': detailed or None})}").json()

    def get_version(self) -> Dict[str, Any]:
        return self._http.request("GET", f"{self._base}/version").json()

    # --- Chat v1 ---

    def list_chats(self, organization_id: Optional[str] = None, user_id: Optional[str] = None, limit: Optional[int] = None) -> Dict[str, Any]:
        """List chats. organization_id falls back to the client's configured org."""
        org = organization_id or self._http.organization_id
        return self._http.request("GET", f"{self._base}/chat{_qs({'organization_id': org, 'user_id': user_id, 'limit': limit})}").json()

    def get_chat(self, chat_id: str, include_messages: bool = False) -> Dict[str, Any]:
        return self._http.request("GET", f"{self._base}/chat/{chat_id}{_qs({'include_messages': True if include_messages else None})}").json()

    def delete_chat(self, chat_id: str, organization_id: Optional[str] = None, user_id: Optional[str] = None) -> Any:
        org = organization_id or self._http.organization_id
        return self._http.request("DELETE", f"{self._base}/chat/{chat_id}{_qs({'organization_id': org, 'user_id': user_id})}").json()

    # --- Chat v2 (streaming — returns raw httpx.Response; iterate with .iter_lines()) ---

    def stream_chat(self, body: StreamChatBody) -> Any:
        user_id = body.get("user_id")
        if not user_id:
            auth = self._http.request("POST", f"{self._base}/chat-client/auth/user").json()
            user_id = auth["id"]
        payload: Dict[str, Any] = {
            "id": str(uuid4()),
            "organization_id": self._http.organization_id,
            **body,
            "user_id": user_id,
        }
        return self._http.request("POST", f"{self._base}/v2/chat", json=payload)

    def stream_chat_text(self, body: StreamChatBody):
        """Generator yielding each text chunk as it arrives.

        Wraps `stream_chat` and parses the Vercel-AI-SDK SSE event stream
        (`data: {"type": "text-delta", "delta": "..."}`). Use:

            for chunk in client.ai_agent.stream_chat_text({"assistant_id": ..., "messages": [...]}):
                print(chunk, end="", flush=True)
        """
        import json as _json
        res = self.stream_chat(body)
        if not res.is_success:
            raise RuntimeError(f"stream_chat_text: HTTP {res.status_code} — {res.text}")
        for line in res.iter_lines():
            if not line:
                continue
            if isinstance(line, bytes):
                line = line.decode("utf-8", errors="replace")
            if not line.startswith("data:"):
                continue
            payload = line[5:].strip()
            if not payload or payload == "[DONE]":
                continue
            try:
                evt = _json.loads(payload)
            except Exception:
                continue
            # Vercel AI SDK shape: {type: "text-delta", delta: "..."}
            if evt.get("type") == "text-delta" and isinstance(evt.get("delta"), str):
                yield evt["delta"]
            # OpenAI-shape fallback
            else:
                choices = evt.get("choices")
                if isinstance(choices, list) and choices:
                    delta = (choices[0] or {}).get("delta") or {}
                    content = delta.get("content")
                    if isinstance(content, str):
                        yield content

    # --- Sub-agent chat v2 ---

    def stream_sub_agent_chat(self, body: StreamSubAgentChatBody) -> Any:
        payload: Dict[str, Any] = {
            "organization_id": self._http.organization_id,
            **body,
        }
        return self._http.request("POST", f"{self._base}/v2/sub-agent-chat", json=payload)

    def get_sub_agent_history(self, session_id: str, chat_id: str) -> Dict[str, Any]:
        return self._http.request("GET", f"{self._base}/v2/sub-agent-chat/history{_qs({'session_id': session_id, 'chat_id': chat_id})}").json()

    # --- Prompt suggestions ---

    def get_agent_prompt_suggestion(self, assistant_id: str) -> Dict[str, Any]:
        return self._http.request("GET", f"{self._base}/chat/get-agent-prompt-suggestion{_qs({'assistant_id': assistant_id})}").json()

    # --- Embeddings / files ---

    def process_embedding(self, file_id: str, options: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        return self._http.request("POST", f"{self._base}/embedding/process", json={"fileId": file_id, "options": options or {}}).json()

    def list_embedding_files(self, **params) -> Any:
        return self._http.request("GET", f"{self._base}/embedding/files{_qs(params)}").json()

    def get_embedding_file(self, file_id: str) -> Dict[str, Any]:
        return self._http.request("GET", f"{self._base}/embedding/files/{file_id}").json()

    def preview_embedding_file(self, **params) -> Any:
        return self._http.request("GET", f"{self._base}/embedding/files/preview{_qs(params)}").json()

    def update_embedding_file_status(self, file_id: str, status: str) -> Dict[str, Any]:
        return self._http.request("PUT", f"{self._base}/embedding/files/{file_id}/status", json={"status": status}).json()

    def delete_embedding_file(self, file_id: str) -> Any:
        return self._http.request("DELETE", f"{self._base}/embedding/files/{file_id}").json()

    def classify_file(self, **params) -> Any:
        return self._http.request("GET", f"{self._base}/embedding/classify{_qs(params)}").json()

    # --- Data Board ---

    def suggest_field_types(self, file_urls: List[str]) -> Dict[str, Any]:
        """Suggest a JSON schema by analyzing sample documents (PDFs/images).

        :param file_urls: array of public document URLs the AI Agent worker can fetch.
            The backend extracts visible structure and proposes a schema.
        """
        return self._http.request(
            "POST",
            f"{self._base}/data-board/suggest-field-types",
            json={"file_urls": file_urls},
        ).json()

    # --- Parquet ---

    def generate_parquet(self, data: List[Any], file_name: Optional[str] = None, folder_name: Optional[str] = None) -> Dict[str, Any]:
        body: Dict[str, Any] = {"data": data}
        if file_name:
            body["fileName"] = file_name
        if folder_name:
            body["folderName"] = folder_name
        return self._http.request("POST", f"{self._base}/parquet/generate", json=body).json()

    def list_parquet_files(self) -> Any:
        return self._http.request("GET", f"{self._base}/parquet/files").json()

    def delete_parquet_file(self, file_name: str) -> Any:
        return self._http.request("DELETE", f"{self._base}/parquet/{quote(file_name)}").json()

    # --- Trace (Tempo) ---

    def get_traces(self, service: Optional[str] = None, limit: Optional[int] = None, time_range: Optional[int] = None, org_id: Optional[str] = None, details: Optional[bool] = None) -> Dict[str, Any]:
        return self._http.request("GET", f"{self._base}/trace/traces{_qs({'service': service, 'limit': limit, 'timeRange': time_range, 'orgId': org_id, 'details': details})}").json()

    def get_trace(self, trace_id: str) -> Dict[str, Any]:
        return self._http.request("GET", f"{self._base}/trace/traces/{trace_id}").json()

    def get_trace_services(self) -> Any:
        return self._http.request("GET", f"{self._base}/trace/services").json()

    def get_trace_tags(self) -> Any:
        return self._http.request("GET", f"{self._base}/trace/tags").json()

    def search_trace_ql(self, q: str) -> Any:
        return self._http.request("GET", f"{self._base}/trace/search/traceql{_qs({'q': q})}").json()

    def get_trace_tag_values(self, tag_name: str) -> Any:
        return self._http.request("GET", f"{self._base}/trace/tags/{tag_name}/values").json()

    def search_traceql(self, q: str) -> Dict[str, Any]:
        return self._http.request("GET", f"{self._base}/trace/search/traceql{_qs({'q': q})}").json()

    # --- Chat Client — Auth ---

    def verify_chat_client_credentials(self, body: Dict[str, Any]) -> Dict[str, Any]:
        return self._http.request("POST", f"{self._base}/chat-client/auth/verify-credentials", json=body).json()

    def register_chat_client(self, body: Dict[str, Any]) -> Dict[str, Any]:
        return self._http.request("POST", f"{self._base}/chat-client/auth/register", json=body).json()

    def get_chat_client_user(self, body: Dict[str, Any]) -> Dict[str, Any]:
        return self._http.request("POST", f"{self._base}/chat-client/auth/user", json=body).json()

    # --- Chat Client — Chats ---

    def create_client_chat(self, body_or_id: Any, **kwargs) -> Dict[str, Any]:
        if isinstance(body_or_id, dict):
            payload = body_or_id
        else:
            payload = {"id": body_or_id, **kwargs}
        return self._http.request("POST", f"{self._base}/chat-client/chats", json=payload).json()

    def list_client_chats(self, organization_id: Optional[str] = None, limit: Optional[int] = None, starting_after: Optional[str] = None, ending_before: Optional[str] = None) -> Dict[str, Any]:
        return self._http.request("GET", f"{self._base}/chat-client/chats{_qs({'organization_id': organization_id, 'limit': limit, 'starting_after': starting_after, 'ending_before': ending_before})}").json()

    def delete_all_client_chats(self, organization_id: str) -> Any:
        return self._http.request("DELETE", f"{self._base}/chat-client/chats{_qs({'organization_id': organization_id})}").json()

    def get_client_chat(self, chat_id: str) -> Dict[str, Any]:
        return self._http.request("GET", f"{self._base}/chat-client/chats/{chat_id}").json()

    def update_client_chat(self, chat_id: str, body: Dict[str, Any]) -> Dict[str, Any]:
        return self._http.request("PATCH", f"{self._base}/chat-client/chats/{chat_id}", json=body).json()

    def delete_client_chat(self, chat_id: str) -> Any:
        return self._http.request("DELETE", f"{self._base}/chat-client/chats/{chat_id}").json()

    def stream_client_chat_status(self, chat_id: str) -> Any:
        return self._http.request("GET", f"{self._base}/chat-client/chats/{chat_id}/status/stream")

    def generate_client_chat_title(self, chat_id: str) -> Dict[str, Any]:
        return self._http.request("POST", f"{self._base}/chat-client/chats/{chat_id}/title").json()

    # --- Chat Client — Messages ---

    def persist_client_message(self, body: Dict[str, Any]) -> Dict[str, Any]:
        return self._http.request("POST", f"{self._base}/chat-client/messages", json=body).json()

    def list_client_messages(self, chat_id: str) -> Any:
        return self._http.request("GET", f"{self._base}/chat-client/chats/{chat_id}/messages").json()

    def delete_trailing_messages(self, message_id: str) -> Any:
        return self._http.request("DELETE", f"{self._base}/chat-client/messages/{message_id}/trailing").json()

    # --- Chat Client — Votes ---

    def get_votes(self, chat_id: str) -> Any:
        return self._http.request("GET", f"{self._base}/chat-client/chats/{chat_id}/votes").json()

    def update_vote(self, body: Dict[str, Any]) -> Any:
        return self._http.request("PATCH", f"{self._base}/chat-client/votes", json=body).json()

    # --- Chat Client — Documents ---

    def create_document(self, body: Dict[str, Any]) -> Dict[str, Any]:
        return self._http.request("POST", f"{self._base}/chat-client/documents", json=body).json()

    def get_document_latest_by_kind(self, **params) -> Any:
        return self._http.request("GET", f"{self._base}/chat-client/documents/latest-by-kind{_qs(params)}").json()

    def get_document(self, doc_id: str) -> Dict[str, Any]:
        return self._http.request("GET", f"{self._base}/chat-client/documents/{doc_id}").json()

    def get_document_latest(self, doc_id: str) -> Dict[str, Any]:
        return self._http.request("GET", f"{self._base}/chat-client/documents/{doc_id}/latest").json()

    def get_document_public(self, doc_id: str) -> Dict[str, Any]:
        return self._http.request("GET", f"{self._base}/chat-client/documents/{doc_id}/public").json()

    def delete_document(self, doc_id: str) -> Any:
        return self._http.request("DELETE", f"{self._base}/chat-client/documents/{doc_id}").json()

    def get_document_suggestions(self, document_id: str) -> Any:
        return self._http.request("GET", f"{self._base}/chat-client/documents/{document_id}/suggestions").json()

    # --- Admin Guides ---

    def list_admin_guides(self) -> Any:
        return self._http.request("GET", f"{self._base}/admin/guides").json()

    def get_admin_guide(self, filename: str) -> Any:
        return self._http.request("GET", f"{self._base}/admin/guides/{quote(filename)}")


class AsyncAiAgentResource:
    def __init__(self, http: AsyncHttpTransport, base: str):
        self._http = http
        self._base = base.rstrip("/")

    # --- System ---

    async def get_config(self) -> Dict[str, Any]:
        res = await self._http.request("GET", f"{self._base}/config")
        return res.json()

    async def get_health(self, detailed: bool = False) -> Dict[str, Any]:
        res = await self._http.request("GET", f"{self._base}/health{_qs({'detailed': detailed or None})}")
        return res.json()

    async def get_version(self) -> Dict[str, Any]:
        res = await self._http.request("GET", f"{self._base}/version")
        return res.json()

    # --- Chat v1 ---

    async def list_chats(self, organization_id: str, user_id: Optional[str] = None, limit: Optional[int] = None) -> Dict[str, Any]:
        res = await self._http.request("GET", f"{self._base}/chat{_qs({'organization_id': organization_id, 'user_id': user_id, 'limit': limit})}")
        return res.json()

    async def get_chat(self, chat_id: str, include_messages: bool = False) -> Dict[str, Any]:
        res = await self._http.request("GET", f"{self._base}/chat/{chat_id}{_qs({'include_messages': True if include_messages else None})}")
        return res.json()

    async def delete_chat(self, chat_id: str, organization_id: str, user_id: Optional[str] = None) -> Any:
        res = await self._http.request("DELETE", f"{self._base}/chat/{chat_id}{_qs({'organization_id': organization_id, 'user_id': user_id})}")
        return res.json()

    # --- Chat v2 (streaming — returns raw httpx.Response; iterate with .aiter_lines()) ---

    async def stream_chat(self, body: StreamChatBody) -> Any:
        user_id = body.get("user_id")
        if not user_id:
            res = await self._http.request("POST", f"{self._base}/chat-client/auth/user")
            user_id = res.json()["id"]
        payload = {"id": str(uuid4()), **body, "user_id": user_id}
        return await self._http.request("POST", f"{self._base}/v2/chat", json=payload)

    # --- Sub-agent chat v2 ---

    async def stream_sub_agent_chat(self, body: StreamSubAgentChatBody) -> Any:
        return await self._http.request("POST", f"{self._base}/v2/sub-agent-chat", json=body)

    async def get_sub_agent_history(self, session_id: str, chat_id: str) -> Dict[str, Any]:
        res = await self._http.request("GET", f"{self._base}/v2/sub-agent-chat/history{_qs({'session_id': session_id, 'chat_id': chat_id})}")
        return res.json()

    # --- Prompt suggestions ---

    async def get_agent_prompt_suggestion(self, assistant_id: str) -> Dict[str, Any]:
        res = await self._http.request("GET", f"{self._base}/chat/get-agent-prompt-suggestion{_qs({'assistant_id': assistant_id})}")
        return res.json()

    # --- Embeddings / files ---

    async def process_embedding(self, file_id: str, options: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        res = await self._http.request("POST", f"{self._base}/embedding/process", json={"fileId": file_id, "options": options or {}})
        return res.json()

    async def list_embedding_files(self, **params) -> Any:
        res = await self._http.request("GET", f"{self._base}/embedding/files{_qs(params)}")
        return res.json()

    async def get_embedding_file(self, file_id: str) -> Dict[str, Any]:
        res = await self._http.request("GET", f"{self._base}/embedding/files/{file_id}")
        return res.json()

    async def preview_embedding_file(self, **params) -> Any:
        res = await self._http.request("GET", f"{self._base}/embedding/files/preview{_qs(params)}")
        return res.json()

    async def update_embedding_file_status(self, file_id: str, status: str) -> Dict[str, Any]:
        res = await self._http.request("PUT", f"{self._base}/embedding/files/{file_id}/status", json={"status": status})
        return res.json()

    async def delete_embedding_file(self, file_id: str) -> Any:
        res = await self._http.request("DELETE", f"{self._base}/embedding/files/{file_id}")
        return res.json()

    async def classify_file(self, **params) -> Any:
        res = await self._http.request("GET", f"{self._base}/embedding/classify{_qs(params)}")
        return res.json()

    # --- Data Board ---

    async def suggest_field_types(self, file_urls: List[str]) -> Dict[str, Any]:
        """Suggest a JSON schema by analyzing sample documents (async)."""
        res = await self._http.request(
            "POST",
            f"{self._base}/data-board/suggest-field-types",
            json={"file_urls": file_urls},
        )
        return res.json()

    # --- Parquet ---

    async def generate_parquet(self, data: List[Any], file_name: Optional[str] = None, folder_name: Optional[str] = None) -> Dict[str, Any]:
        body: Dict[str, Any] = {"data": data}
        if file_name:
            body["fileName"] = file_name
        if folder_name:
            body["folderName"] = folder_name
        res = await self._http.request("POST", f"{self._base}/parquet/generate", json=body)
        return res.json()

    async def list_parquet_files(self) -> Any:
        res = await self._http.request("GET", f"{self._base}/parquet/files")
        return res.json()

    async def delete_parquet_file(self, file_name: str) -> Any:
        res = await self._http.request("DELETE", f"{self._base}/parquet/{quote(file_name)}")
        return res.json()

    # --- Trace (Tempo) ---

    async def get_traces(self, service: Optional[str] = None, limit: Optional[int] = None, time_range: Optional[int] = None, org_id: Optional[str] = None, details: Optional[bool] = None) -> Dict[str, Any]:
        res = await self._http.request("GET", f"{self._base}/trace/traces{_qs({'service': service, 'limit': limit, 'timeRange': time_range, 'orgId': org_id, 'details': details})}")
        return res.json()

    async def get_trace(self, trace_id: str) -> Dict[str, Any]:
        res = await self._http.request("GET", f"{self._base}/trace/traces/{trace_id}")
        return res.json()

    async def get_trace_services(self) -> Any:
        res = await self._http.request("GET", f"{self._base}/trace/services")
        return res.json()

    async def get_trace_tags(self) -> Any:
        res = await self._http.request("GET", f"{self._base}/trace/tags")
        return res.json()

    async def search_trace_ql(self, q: str) -> Any:
        res = await self._http.request("GET", f"{self._base}/trace/search/traceql{_qs({'q': q})}")
        return res.json()

    async def get_trace_tag_values(self, tag_name: str) -> Any:
        res = await self._http.request("GET", f"{self._base}/trace/tags/{tag_name}/values")
        return res.json()

    async def search_traceql(self, q: str) -> Dict[str, Any]:
        res = await self._http.request("GET", f"{self._base}/trace/search/traceql{_qs({'q': q})}")
        return res.json()

    # --- Chat Client — Auth ---

    async def verify_chat_client_credentials(self, body: Dict[str, Any]) -> Dict[str, Any]:
        res = await self._http.request("POST", f"{self._base}/chat-client/auth/verify-credentials", json=body)
        return res.json()

    async def register_chat_client(self, body: Dict[str, Any]) -> Dict[str, Any]:
        res = await self._http.request("POST", f"{self._base}/chat-client/auth/register", json=body)
        return res.json()

    async def get_chat_client_user(self, body: Dict[str, Any]) -> Dict[str, Any]:
        res = await self._http.request("POST", f"{self._base}/chat-client/auth/user", json=body)
        return res.json()

    # --- Chat Client — Chats ---

    async def create_client_chat(self, body_or_id: Any, **kwargs) -> Dict[str, Any]:
        if isinstance(body_or_id, dict):
            payload = body_or_id
        else:
            payload = {"id": body_or_id, **kwargs}
        res = await self._http.request("POST", f"{self._base}/chat-client/chats", json=payload)
        return res.json()

    async def list_client_chats(self, organization_id: Optional[str] = None, limit: Optional[int] = None, starting_after: Optional[str] = None, ending_before: Optional[str] = None) -> Dict[str, Any]:
        res = await self._http.request("GET", f"{self._base}/chat-client/chats{_qs({'organization_id': organization_id, 'limit': limit, 'starting_after': starting_after, 'ending_before': ending_before})}")
        return res.json()

    async def delete_all_client_chats(self, organization_id: str) -> Any:
        res = await self._http.request("DELETE", f"{self._base}/chat-client/chats{_qs({'organization_id': organization_id})}")
        return res.json()

    async def get_client_chat(self, chat_id: str) -> Dict[str, Any]:
        res = await self._http.request("GET", f"{self._base}/chat-client/chats/{chat_id}")
        return res.json()

    async def update_client_chat(self, chat_id: str, body: Dict[str, Any]) -> Dict[str, Any]:
        res = await self._http.request("PATCH", f"{self._base}/chat-client/chats/{chat_id}", json=body)
        return res.json()

    async def delete_client_chat(self, chat_id: str) -> Any:
        res = await self._http.request("DELETE", f"{self._base}/chat-client/chats/{chat_id}")
        return res.json()

    async def stream_client_chat_status(self, chat_id: str) -> Any:
        return await self._http.request("GET", f"{self._base}/chat-client/chats/{chat_id}/status/stream")

    async def generate_client_chat_title(self, chat_id: str) -> Dict[str, Any]:
        res = await self._http.request("POST", f"{self._base}/chat-client/chats/{chat_id}/title")
        return res.json()

    # --- Chat Client — Messages ---

    async def persist_client_message(self, body: Dict[str, Any]) -> Dict[str, Any]:
        res = await self._http.request("POST", f"{self._base}/chat-client/messages", json=body)
        return res.json()

    async def list_client_messages(self, chat_id: str) -> Any:
        res = await self._http.request("GET", f"{self._base}/chat-client/chats/{chat_id}/messages")
        return res.json()

    async def delete_trailing_messages(self, message_id: str) -> Any:
        res = await self._http.request("DELETE", f"{self._base}/chat-client/messages/{message_id}/trailing")
        return res.json()

    # --- Chat Client — Votes ---

    async def get_votes(self, chat_id: str) -> Any:
        res = await (await self._http.request("GET", f"{self._base}/chat-client/chats/{chat_id}/votes"))
        return res.json()

    async def update_vote(self, body: Dict[str, Any]) -> Any:
        res = await self._http.request("PATCH", f"{self._base}/chat-client/votes", json=body)
        return res.json()

    # --- Chat Client — Documents ---

    async def create_document(self, body: Dict[str, Any]) -> Dict[str, Any]:
        res = await self._http.request("POST", f"{self._base}/chat-client/documents", json=body)
        return res.json()

    async def get_document_latest_by_kind(self, **params) -> Any:
        res = await self._http.request("GET", f"{self._base}/chat-client/documents/latest-by-kind{_qs(params)}")
        return res.json()

    async def get_document(self, doc_id: str) -> Dict[str, Any]:
        res = await self._http.request("GET", f"{self._base}/chat-client/documents/{doc_id}")
        return res.json()

    async def get_document_latest(self, doc_id: str) -> Dict[str, Any]:
        res = await self._http.request("GET", f"{self._base}/chat-client/documents/{doc_id}/latest")
        return res.json()

    async def get_document_public(self, doc_id: str) -> Dict[str, Any]:
        res = await self._http.request("GET", f"{self._base}/chat-client/documents/{doc_id}/public")
        return res.json()

    async def delete_document(self, doc_id: str) -> Any:
        res = await self._http.request("DELETE", f"{self._base}/chat-client/documents/{doc_id}")
        return res.json()

    async def get_document_suggestions(self, document_id: str) -> Any:
        res = await self._http.request("GET", f"{self._base}/chat-client/documents/{document_id}/suggestions")
        return res.json()

    # --- Admin Guides ---

    async def list_admin_guides(self) -> Any:
        res = await self._http.request("GET", f"{self._base}/admin/guides")
        return res.json()

    async def get_admin_guide(self, filename: str) -> Any:
        return await self._http.request("GET", f"{self._base}/admin/guides/{quote(filename)}")
