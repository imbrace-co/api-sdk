# AI Agent

This page covers two related AI namespaces:

- **`chatAi` / `chat_ai`** — create and manage AI agents, document/file processing, and document AI.
- **`aiAgent` / `ai_agent`** — streaming chat (SSE), embedding management, Parquet data, distributed tracing, and the Chat Client sub-API.

The AI Agent resource connects to a dedicated service that runs on a separate base URL from the main API gateway.

For an end-to-end example that ties these together, see [Full Flow Guide §1](/sdk/full-flow-guide.md#1-create-an-ai-agent-and-start-chatting).

**TypeScript — access token**

```typescript
import { ImbraceClient } from "@imbrace/sdk"

const client = new ImbraceClient({
  accessToken: "your-access-token",
  baseUrl: "https://app-gatewayv2.imbrace.co",
})
```

**TypeScript — API key**

```typescript
import { ImbraceClient } from "@imbrace/sdk"

const client = new ImbraceClient({
  apiKey: "your-api-key",
  baseUrl: "https://app-gatewayv2.imbrace.co",
})
```

**Python**

```python
from imbrace import ImbraceClient

client = ImbraceClient(access_token="your-access-token")
# or
client = ImbraceClient(api_key="your-api-key")
```

Both sync (`ImbraceClient`) and async (`AsyncImbraceClient`) clients expose the same surface.

---

## AI Agents — `chatAi` / `chat_ai`

Manages AI agents (CRUD), runs OpenAI-compatible completions, and handles document/file processing. The same namespace also covers Knowledge Hub folders and knowledge bases.

### AI Agent CRUD

**TypeScript**

```typescript
// List all AI agents in your account
const agents = await client.chatAi.listAiAgents();
// Each AI agent has an `id` (UUID).

// List sub-agents (agents that can be delegated to by an orchestrator)
const subAgents = await client.chatAi.listAiAgentSubAgents();

// Get a single AI agent
const agent = await client.chatAi.getAiAgent("9f77692f-33d0-436a-8138-2efb268838e6");

// Create. The SDK auto-fills { provider_id: "system", model_id: "Default" }
// when omitted; "Default" routes to the org's configured default model and
// is org-portable. A literal name like "gpt-4o" only works if the org's
// system provider actually exposes it — `client.ai.listModels()` shows what's
// available. Pass `streaming: true` so /v2/chat emits text-delta SSE events
// that `streamChatText` (below) can parse; without it the server returns the
// full reply as one text/plain response and SSE parsers yield nothing.
const created = await client.chatAi.createAiAgent({
  name: "Support Bot",
  workflow_name: "support_bot_v1",
  provider_id: "system",
  model_id: "Default",
  streaming: true,
  description: "Handles tier-1 support queries",
});

// Update — all fields are optional (Partial)
const updated = await client.chatAi.updateAiAgent(created.id, {
  name: "Support Bot v2",
  workflow_name: "support_bot_v1",
});

// Update only the system instructions
await client.chatAi.updateAiAgentInstructions(
  created.id,
  "You are a helpful support agent.",
);

await client.chatAi.deleteAiAgent(created.id);
```

**Python**

```python
# List all AI agents
agents = client.chat_ai.list_ai_agents()

# List sub-agents
sub_agents = client.chat_ai.list_ai_agent_sub_agents()

# Get a single AI agent
agent = client.chat_ai.get_ai_agent("9f77692f-33d0-436a-8138-2efb268838e6")

# Create. The SDK auto-fills {"provider_id": "system", "model_id": "Default"}
# when omitted; "Default" routes to the org's configured default model and is
# org-portable. A literal name like "gpt-4o" only works if the org's system
# provider actually exposes it — `client.ai.list_models()` shows what's
# available. Pass `streaming: True` so /v2/chat emits text-delta SSE events
# that `stream_chat_text` (below) can parse; without it the server returns
# the full reply as one text/plain response and SSE parsers yield nothing.
created = client.chat_ai.create_ai_agent({
    "name":          "Support Bot",
    "workflow_name": "support_bot_v1",
    "provider_id":   "system",
    "model_id":      "Default",
    "streaming":     True,
    "description":   "Handles tier-1 support queries",
})

# Update
updated = client.chat_ai.update_ai_agent(created["id"], {
    "name":          "Support Bot v2",
    "workflow_name": "support_bot_v1",
})

# Update only the system instructions
client.chat_ai.update_ai_agent_instructions(
    created["id"],
    "You are a helpful support agent.",
)

client.chat_ai.delete_ai_agent(created["id"])
```

### Completions (via `client.ai`)

OpenAI-compatible chat completions are available on the `client.ai` namespace. See the [OpenAI-compatible AI service](#openai-compatible-ai-service--clientai) section below.

**TypeScript**

```typescript
const response = await client.ai.complete({
  model: "gpt-4o",
  messages: [
    { role: "system", content: "You are a helpful CRM assistant." },
    { role: "user", content: "Summarize this customer note: ..." },
  ],
});
console.log(response.choices[0].message.content);
```

**Python**

```python
from imbrace.types.ai import CompletionInput, CompletionMessage

response = client.ai.complete(CompletionInput(
    model="gpt-4o",
    messages=[
        CompletionMessage(role="system", content="You are a helpful CRM assistant."),
        CompletionMessage(role="user", content="Summarize this customer note: ..."),
    ],
))
print(response.choices[0].message.content)
```

### Document AI models

**TypeScript**

```typescript
const models = await client.chatAi.listDocumentModels();
```

**Python**

```python
models = client.chat_ai.list_document_models()
```

### File extraction (agent file upload)

**TypeScript**

```typescript
// Upload an agent-specific file
const formData = new FormData();
formData.append("file", fileBuffer, "report.pdf");
const uploaded = await client.chatAi.uploadAgentFile(formData);

// Extract content from an uploaded file
const extracted = await client.chatAi.extractFile(formData);
```

**Python**

```python
# Upload an agent-specific file
uploaded = client.chat_ai.upload_agent_file(files={"file": open("report.pdf", "rb")}, agent_id="asst_abc")

# Extract content from an uploaded file
extracted = client.chat_ai.extract_file(files={"file": open("report.pdf", "rb")})
```

### Knowledge Hub — folders & knowledge bases

Folders and knowledge bases are managed via `client.boards`. Pass folder IDs as `folder_ids` when creating an AI agent.

**TypeScript**

```typescript
import { type CreateFolderInput } from "@imbrace/sdk";

// Folders
const folders = await client.boards.searchFolders({ organizationId: "org_xxx" });
const folder  = await client.boards.createFolder({ name: "Q1 Reports" });
await client.boards.updateFolder(folder._id, { name: "Q1 2025 Reports" });
await client.boards.deleteFolders({ ids: [folder._id] });

// Files (knowledge base entries)
const uploaded = await client.boards.uploadFile(formData);
const files    = await client.boards.searchFiles({ folderId: folder._id });
const file     = await client.boards.getFile("file_id");
await client.boards.createFile({ name: "doc.txt", folder_id: folder._id });
await client.boards.deleteFiles({ ids: ["file_id"] });
```

**Python**

```python
# Folders
folder = client.boards.create_folder({"name": "Q1 Reports"})
folders = client.boards.search_folders()
client.boards.update_folder(folder["_id"], {"name": "Q1 2025 Reports"})
client.boards.delete_folders([folder["_id"]])

# Files (knowledge base entries)
file = client.boards.upload_file(files={"file": open("doc.pdf", "rb")})
files = client.boards.search_files(folder_id=folder["_id"])
```

---

## OpenAI-compatible AI service — `client.ai`

OpenAI-style completions, streaming, and embeddings. Also exposes management APIs for LLM models, providers, guardrails, RAG files, and AI agents.

**TypeScript**

```typescript
// Single completion
const response = await client.ai.complete({
  model: "gpt-4o",
  messages: [
    { role: "system", content: "You are a helpful CRM assistant." },
    { role: "user",   content: "Summarize this customer note: ..." },
  ],
  temperature: 0.7,
});
console.log(response.choices[0].message.content);

// Streaming
const stream = client.ai.stream({
  model: "gpt-4o",
  messages: [{ role: "user", content: "Draft a follow-up email for this lead." }],
});
for await (const chunk of stream) {
  process.stdout.write(chunk.choices[0].delta.content ?? "");
}

// Embeddings
const result = await client.ai.embed({
  model: "text-embedding-ada-002",
  input: ["customer complained about billing", "billing issue escalated"],
});
```

**Python**

```python
from imbrace.types.ai import CompletionInput, CompletionMessage, EmbeddingInput

# Single completion
response = client.ai.complete(CompletionInput(
    model="gpt-4o",
    messages=[
        CompletionMessage(role="system", content="You are a helpful CRM assistant."),
        CompletionMessage(role="user", content="Summarize this customer note: ..."),
    ],
    temperature=0.7,
))
print(response.choices[0].message.content)

# Streaming
for chunk in client.ai.stream(CompletionInput(
    model="gpt-4o",
    messages=[CompletionMessage(role="user", content="Draft a follow-up email for this lead.")],
)):
    print(chunk.choices[0].delta.content or "", end="", flush=True)

# Embeddings
result = client.ai.embed(EmbeddingInput(
    model="text-embedding-ada-002",
    input=["customer complained about billing", "billing issue escalated"],
))
```

### LLM Models

**TypeScript**

```typescript
const result = await client.ai.getLlmModels();
for (const model of result.data) {
  console.log(model.name, model.is_toolCall_available);
}
```

**Python**

```python
result = client.ai.get_llm_models()
for model in result["data"]:
    print(model["name"], model.get("is_toolCall_available"))
```

### Providers

Manage custom LLM providers. `listProviders` includes a synthetic `"system"` entry representing the built-in models.

**TypeScript**

```typescript
const providers = await client.ai.listProviders();
const custom = await client.ai.listProviders({ includeSystem: false });

const provider = await client.ai.createProvider({
  name: "My Azure OpenAI",
  type: "azure",
  api_key: "sk-...",
  base_url: "https://my-instance.openai.azure.com/",
});

await client.ai.updateProvider(provider._id, { name: "Azure OpenAI (prod)" });
await client.ai.refreshProviderModels(provider._id);
await client.ai.deleteProvider(provider._id);
```

**Python**

```python
providers = client.ai.list_providers()
custom = client.ai.list_providers(include_system=False)

provider = client.ai.create_provider({
    "name": "My Azure OpenAI",
    "type": "azure",
    "api_key": "sk-...",
    "base_url": "https://my-instance.openai.azure.com/",
})

client.ai.update_provider(provider["_id"], {"name": "Azure OpenAI (prod)"})
client.ai.refresh_provider_models(provider["_id"])
client.ai.delete_provider(provider["_id"])
```

### Guardrails

Filter AI agent output for safety, policy compliance, or brand guidelines.

**TypeScript**

```typescript
const guardrails = await client.ai.listGuardrails();
const guardrail  = await client.ai.getGuardrail("guardrail_id");

const created = await client.ai.createGuardrail({
  name: "Brand Safety",
  model: "gpt-4o",
  instructions: "Block responses that mention competitor names.",
  unsafe_categories: ["violence", "hate_speech"],
  competitor_keywords: ["CompetitorA", "CompetitorB"],
});

await client.ai.updateGuardrail(created._id, {
  name: "Brand Safety v2",
  model: "gpt-4o",
  instructions: "Updated instructions.",
});
await client.ai.deleteGuardrail(created._id);
```

**Python**

```python
guardrails = client.ai.list_guardrails()
guardrail  = client.ai.get_guardrail("guardrail_id")

created = client.ai.create_guardrail({
    "name": "Brand Safety",
    "model": "gpt-4o",
    "instructions": "Block responses that mention competitor names.",
    "unsafe_categories": ["violence", "hate_speech"],
    "competitor_keywords": ["CompetitorA", "CompetitorB"],
})

client.ai.update_guardrail(created["_id"], {
    "name": "Brand Safety v2",
    "model": "gpt-4o",
    "instructions": "Updated instructions.",
})
client.ai.delete_guardrail(created["_id"])
```

### Guardrail Providers

**TypeScript**

```typescript
const providers = await client.ai.listGuardrailProviders();
const gp = await client.ai.createGuardrailProvider({
  name: "OpenAI Moderation",
  type: "openai",
  config: { api_key: "sk-..." },
});

const testResult = await client.ai.testGuardrailProvider(gp._id, { prompt: "test prompt" });
const models     = await client.ai.getGuardrailProviderModels(gp._id);

await client.ai.updateGuardrailProvider(gp._id, { name: "OpenAI Moderation v2" });
await client.ai.deleteGuardrailProvider(gp._id);
```

**Python**

```python
providers = client.ai.list_guardrail_providers()
gp = client.ai.create_guardrail_provider({
    "name": "OpenAI Moderation",
    "type": "openai",
    "config": {"api_key": "sk-..."},
})

test_result = client.ai.test_guardrail_provider(gp["_id"], {"prompt": "test prompt"})
models      = client.ai.get_guardrail_provider_models(gp["_id"])

client.ai.update_guardrail_provider(gp["_id"], {"name": "OpenAI Moderation v2"})
client.ai.delete_guardrail_provider(gp["_id"])
```

### RAG Files

**TypeScript**

```typescript
const files = await client.ai.listRagFiles();
const file  = await client.ai.getRagFile("file_id");

const formData = new FormData();
formData.append("file", fileBuffer, "knowledge.pdf");
const uploaded = await client.ai.uploadRagFile(formData);

await client.ai.deleteRagFile(uploaded._id);
```

**Python**

```python
files = client.ai.list_rag_files()
file  = client.ai.get_rag_file("file_id")

uploaded = client.ai.upload_rag_file(files={"file": open("knowledge.pdf", "rb")})

client.ai.delete_rag_file(uploaded["_id"])
```

### AI Agents (via `client.ai`)

**TypeScript**

```typescript
const accountAgents = await client.ai.listAiAgents();
const agents = await client.ai.listAgents();
const agent = await client.ai.getAiAgent("asst_abc");

const check = await client.ai.checkAiAgentName("Support Bot");
// check.available → true / false

await client.ai.patchInstructions("asst_abc", {
  instructions: "You are a concise, helpful assistant.",
});
```

**Python**

```python
account_agents = client.ai.list_ai_agents()
agents = client.ai.list_agents()
agent = client.ai.get_ai_agent("asst_abc")

check = client.ai.check_ai_agent_name("Support Bot")
# check["available"] → True / False

client.ai.patch_instructions("asst_abc", {
    "instructions": "You are a concise, helpful assistant.",
})
```

### AI Agent Apps (via `client.ai`)

AI Agent Apps link an AI agent to a workflow or app configuration.

**TypeScript**

```typescript
const app = await client.ai.createAiAgentApp({
  name: "Support App",
  workflow_name: "support_workflow_v1",
  assistant_id: "asst_abc",
  model_id: "Default",   // org-portable; "gpt-4o" only works in orgs whose system provider exposes it
  provider_id: "system",
});

await client.ai.updateAiAgentApp(app._id, { name: "Support App v2" });
await client.ai.deleteAiAgentApp(app._id);

await client.ai.updateAiAgentWorkflow(app._id, {
  workflow: { steps: [{ id: "step1", type: "llm" }] },
});
```

**Python**

```python
apps = client.ai.list_ai_agent_apps()
app  = client.ai.get_ai_agent_app("app_id")

app = client.ai.create_ai_agent_app({
    "name": "Support App",
    "workflow_name": "support_workflow_v1",
    "assistant_id": "asst_abc",
    "model_id": "Default",   # org-portable; "gpt-4o" only works in orgs whose system provider exposes it
    "provider_id": "system",
})

client.ai.update_ai_agent_app(app["_id"], {"name": "Support App v2"})
client.ai.delete_ai_agent_app(app["_id"])

client.ai.update_ai_agent_workflow(app["_id"], {
    "workflow": {"steps": [{"id": "step1", "type": "llm"}]},
})
```

### Tool Server

**TypeScript**

```typescript
const result = await client.ai.verifyToolServer({ url: "https://my-tools.example.com/mcp" });
if (result.success) {
  console.log("Available tools:", result.tools);
}
```

**Python**

```python
result = client.ai.verify_tool_server({"url": "https://my-tools.example.com/mcp"})
if result["success"]:
    print("Available tools:", result.get("tools"))
```

---

## Chat v2 — Streaming (SSE)

`streamChat` / `stream_chat` returns a raw `Response` over `POST /ai-agent/v2/chat`. The body shape depends on the agent's `streaming` flag:

| Agent `streaming` | `Content-Type` | Body |
|---|---|---|
| `true` (recommended) | `text/event-stream` | Vercel-AI-SDK UI-Message-Stream: `data: {"type":"text-delta","delta":"..."}` events |
| `false` (default for newly-created agents) | `text/plain` | Full reply as a single string — no SSE framing |

### Preferred: `streamChatText` / `stream_chat_text`

These convenience helpers wrap `streamChat`, parse the SSE event stream, and yield plain text deltas. They assume the agent was created with `streaming: true`.

**TypeScript**

```typescript
for await (const chunk of client.aiAgent.streamChatText({
  id: "chat_id",
  assistant_id: "asst_abc",
  messages: [{ role: "user", content: "What can you do?" }],
})) {
  process.stdout.write(chunk);
}
```

**Python**

```python
for chunk in client.ai_agent.stream_chat_text({
    "id": "chat_id",
    "assistant_id": "asst_abc",
    "messages": [{"role": "user", "content": "What can you do?"}],
}):
    print(chunk, end="", flush=True)
```

> **Empty replies?** If `streamChatText` / `stream_chat_text` yields **0 chunks** even though the server returned 200 OK, the agent almost certainly has `streaming: false`. The response is `text/plain`, contains no `data:` lines, and the SSE parser silently emits nothing. Fix it by setting `streaming: true` at creation time (or via `updateAiAgent(id, { streaming: true })`), or use the content-type-aware pattern below.

### Handling both streaming and non-streaming agents

When you don't control how an agent was created, branch on `Content-Type`:

**TypeScript**

```typescript
const body = {
  id: "chat_id",
  assistant_id: "asst_abc",
  messages: [{ role: "user", content: "What can you do?" }],
};

const res = await client.aiAgent.streamChat(body);
if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`);

const contentType = res.headers.get("content-type") ?? "";
let reply = "";

if (contentType.includes("text/event-stream")) {
  // streaming agent — re-parse via the SDK helper
  for await (const chunk of client.aiAgent.streamChatText(body)) {
    reply += chunk;
    process.stdout.write(chunk);
  }
} else {
  // non-streaming agent — body is the full reply
  reply = await res.text();
  process.stdout.write(reply);
}
```

**Python**

```python
body = {
    "id": "chat_id",
    "assistant_id": "asst_abc",
    "messages": [{"role": "user", "content": "What can you do?"}],
}

res = client.ai_agent.stream_chat(body)
res.raise_for_status()

if "text/event-stream" in res.headers.get("content-type", ""):
    for chunk in client.ai_agent.stream_chat_text(body):
        print(chunk, end="", flush=True)
else:
    print(res.text)
```

**Async (Python):**

```python
import asyncio
from imbrace import AsyncImbraceClient

async def main():
    async with AsyncImbraceClient() as client:
        res = await client.ai_agent.stream_chat({
            "id": "chat_id",
            "assistant_id": "asst_abc",
            "messages": [{"role": "user", "content": "Hello"}],
        })
        res.raise_for_status()
        async for line in res.aiter_lines():
            if line:
                print(line)

asyncio.run(main())
```

---

## Sub-agent Chat v2

**TypeScript**

```typescript
const res = await client.aiAgent.streamSubAgentChat({
  assistant_id: "asst_sub",
  session_id: "sess_xyz",
  chat_id: "chat_id",
  messages: [{ role: "user", content: "Explain the data." }],
});

const history = await client.aiAgent.getSubAgentHistory({
  session_id: "sess_xyz",
  chat_id: "chat_id",
});
```

**Python**

```python
res = client.ai_agent.stream_sub_agent_chat({
    "assistant_id": "asst_sub",
    "session_id": "sess_xyz",
    "chat_id": "chat_id",
    "messages": [{"role": "user", "content": "Explain the data."}],
})

history = client.ai_agent.get_sub_agent_history(
    session_id="sess_xyz",
    chat_id="chat_id",
)
```

---

## Prompt Suggestions

**TypeScript**

```typescript
const suggestions = await client.aiAgent.getAgentPromptSuggestion("asst_abc");
```

**Python**

```python
suggestions = client.ai_agent.get_agent_prompt_suggestion("asst_abc")
```

---

## Embeddings & Knowledge Base

Upload files first via `client.boards.uploadFile` / `client.boards.upload_file`, then trigger embedding processing.

**TypeScript**

```typescript
await client.aiAgent.processEmbedding({ fileId: "file_abc" });

const files   = await client.aiAgent.listEmbeddingFiles({ page: 1, limit: 20 });
const file    = await client.aiAgent.getEmbeddingFile("file_abc");
const preview = await client.aiAgent.previewEmbeddingFile({ file_id: "file_abc" });

await client.aiAgent.updateEmbeddingFileStatus("file_abc", "active");
await client.aiAgent.deleteEmbeddingFile("file_abc");

const classification = await client.aiAgent.classifyFile({ file_id: "file_abc" });
```

**Python**

```python
client.ai_agent.process_embedding("file_abc")
client.ai_agent.process_embedding("file_abc", options={"chunk_size": 512})

files   = client.ai_agent.list_embedding_files(page=1, limit=20)
file    = client.ai_agent.get_embedding_file("file_abc")
preview = client.ai_agent.preview_embedding_file(file_id="file_abc")

client.ai_agent.update_embedding_file_status("file_abc", "active")
client.ai_agent.delete_embedding_file("file_abc")

classification = client.ai_agent.classify_file(file_id="file_abc")
```

---

## Data Board

Analyze sample documents to suggest a JSON schema for Document AI agents.

**TypeScript**

```typescript
const result = await client.aiAgent.suggestFieldTypes({
  fileUrls: [
    "https://cdn.imbrace.co/docs/invoice-1.pdf",
    "https://cdn.imbrace.co/docs/invoice-2.pdf",
  ],
});
// result.fields[i].suggestedType → "datetime" | "number" | "boolean" | ...
```

**Python**

```python
result = client.ai_agent.suggest_field_types(
    file_urls=[
        "https://cdn.imbrace.co/docs/invoice-1.pdf",
        "https://cdn.imbrace.co/docs/invoice-2.pdf",
    ],
)
# result["fields"][i]["suggestedType"] → "datetime" | "number" | "boolean" | ...
```

---

## Parquet

Generate and manage Parquet columnar data files for analytics pipelines.

**TypeScript**

```typescript
const result = await client.aiAgent.generateParquet({
  data: [{ id: 1, name: "Alice" }, { id: 2, name: "Bob" }],
  fileName: "users",
  folderName: "exports",
});

const files = await client.aiAgent.listParquetFiles();
await client.aiAgent.deleteParquetFile("exports/users.parquet");
```

**Python**

```python
result = client.ai_agent.generate_parquet(
    data=[{"id": 1, "name": "Alice"}, {"id": 2, "name": "Bob"}],
    file_name="users",
    folder_name="exports",
)

files = client.ai_agent.list_parquet_files()
client.ai_agent.delete_parquet_file("exports/users.parquet")
```

---

## Distributed Tracing (Tempo)

Query Grafana Tempo traces emitted by the AI Agent service.

**TypeScript**

```typescript
const traces = await client.aiAgent.getTraces({
  service:   "ai-agent",
  limit:     50,
  timeRange: 3600,
  orgId:     "org_abc",
  details:   true,
});

const trace    = await client.aiAgent.getTrace("trace_id_hex");
const services = await client.aiAgent.getTraceServices();
const tags     = await client.aiAgent.getTraceTags();
const values   = await client.aiAgent.getTraceTagValues("http.status_code");

const results = await client.aiAgent.searchTraceQL(
  `{ .service.name = "ai-agent" && .http.status = 500 }`
);
```

**Python**

```python
traces = client.ai_agent.get_traces(
    service="ai-agent",
    limit=50,
    time_range=3600,
    org_id="org_abc",
    details=True,
)

trace    = client.ai_agent.get_trace("trace_id_hex")
services = client.ai_agent.get_trace_services()
tags     = client.ai_agent.get_trace_tags()
values   = client.ai_agent.get_trace_tag_values("http.status_code")

results = client.ai_agent.search_traceql(
    '{ .service.name = "ai-agent" && .http.status = 500 }'
)
```

---

## Chat Client

The Chat Client sub-API powers frontend applications (e.g. the embedded chat widget).

### Auth

**TypeScript**

```typescript
await client.aiAgent.verifyChatClientCredentials({ token: "tok_xxx" });
await client.aiAgent.registerChatClient({ name: "web-app", secret: "s3cr3t" });
const user = await client.aiAgent.getChatClientUser({ token: "tok_xxx" });
```

**Python**

```python
client.ai_agent.verify_chat_client_credentials({"token": "tok_xxx"})
client.ai_agent.register_chat_client({"name": "web-app", "secret": "s3cr3t"})
user = client.ai_agent.get_chat_client_user({"token": "tok_xxx"})
```

### Chats

**TypeScript**

```typescript
await client.aiAgent.createClientChat({
  id:                     "chat_uuid",
  assistantId:            "asst_abc",
  organizationId:         "org_abc",
  userId:                 "user_xxx",
  selectedVisibilityType: "private",
  message: {
    id:        "msg_uuid",
    role:      "user",
    content:   "Hello!",
    createdAt: new Date().toISOString(),
    parts:     [{ type: "text", text: "Hello!" }],
  },
});

const chats = await client.aiAgent.listClientChats({ organization_id: "org_abc", limit: 20 });
const chat  = await client.aiAgent.getClientChat("chat_id");
await client.aiAgent.updateClientChat("chat_id", { visibility: "private" });
await client.aiAgent.deleteClientChat("chat_id");
await client.aiAgent.deleteAllClientChats({ organization_id: "org_abc" });

await client.aiAgent.generateClientChatTitle("chat_id");

const statusStream = await client.aiAgent.streamClientChatStatus("chat_id");
```

**Python**

```python
from datetime import datetime, timezone

client.ai_agent.create_client_chat({
    "id":                     "chat_uuid",
    "assistantId":            "asst_abc",
    "organizationId":         "org_abc",
    "userId":                 "user_xxx",
    "selectedVisibilityType": "private",
    "message": {
        "id":        "msg_uuid",
        "role":      "user",
        "content":   "Hello!",
        "createdAt": datetime.now(timezone.utc).isoformat(),
        "parts":     [{"type": "text", "text": "Hello!"}],
    },
})

chats = client.ai_agent.list_client_chats(organization_id="org_abc", limit=20)
chat  = client.ai_agent.get_client_chat("chat_id")
client.ai_agent.update_client_chat("chat_id", {"visibility": "private"})
client.ai_agent.delete_client_chat("chat_id")
client.ai_agent.delete_all_client_chats("org_abc")

client.ai_agent.generate_client_chat_title("chat_id")

status_stream = client.ai_agent.stream_client_chat_status("chat_id")
```

### Messages

**TypeScript**

```typescript
await client.aiAgent.persistClientMessage({ chatId: "chat_id", content: "Hello" });
const messages = await client.aiAgent.listClientMessages("chat_id");
await client.aiAgent.deleteTrailingMessages("message_id");
```

**Python**

```python
client.ai_agent.persist_client_message({"chatId": "chat_id", "content": "Hello"})
messages = client.ai_agent.list_client_messages("chat_id")
client.ai_agent.delete_trailing_messages("message_id")
```

### Votes

**TypeScript**

```typescript
const votes = await client.aiAgent.getVotes("chat_id");
await client.aiAgent.updateVote({ messageId: "msg_id", vote: "up" });
```

**Python**

```python
votes = client.ai_agent.get_votes("chat_id")
client.ai_agent.update_vote({"messageId": "msg_id", "vote": "up"})
```

### Documents (AI-generated artifacts)

**TypeScript**

```typescript
await client.aiAgent.createDocument({ kind: "text", content: "Draft..." });

const doc        = await client.aiAgent.getDocument("doc_id");
const latest     = await client.aiAgent.getDocumentLatest("doc_id");
const pub        = await client.aiAgent.getDocumentPublic("doc_id");
const byKind     = await client.aiAgent.getDocumentLatestByKind({ kind: "text" });
const suggestion = await client.aiAgent.getDocumentSuggestions("doc_id");

await client.aiAgent.deleteDocument("doc_id");
```

**Python**

```python
client.ai_agent.create_document({"kind": "text", "content": "Draft..."})

doc        = client.ai_agent.get_document("doc_id")
latest     = client.ai_agent.get_document_latest("doc_id")
pub        = client.ai_agent.get_document_public("doc_id")
by_kind    = client.ai_agent.get_document_latest_by_kind(kind="text")
suggestion = client.ai_agent.get_document_suggestions("doc_id")

client.ai_agent.delete_document("doc_id")
```

---

## Service info

**TypeScript**

```typescript
const config  = await client.aiAgent.getConfig();
const health  = await client.aiAgent.getHealth();
const details = await client.aiAgent.getHealth(true);
const version = await client.aiAgent.getVersion();
```

**Python**

```python
config  = client.ai_agent.get_config()
health  = client.ai_agent.get_health()
details = client.ai_agent.get_health(detailed=True)
version = client.ai_agent.get_version()
```

---

## Admin Guides

**TypeScript**

```typescript
const guides = await client.aiAgent.listAdminGuides();

const response = await client.aiAgent.getAdminGuide("onboarding.pdf");
const blob = await response.blob();
```

**Python**

```python
guides = client.ai_agent.list_admin_guides()

response = client.ai_agent.get_admin_guide("onboarding.pdf")
with open("onboarding.pdf", "wb") as f:
    f.write(response.content)
```

---

## Legacy v1 chat

The original REST chat endpoints persist conversation history without streaming. New code should use Chat v2 streaming above.

**TypeScript**

```typescript
const chats = await client.aiAgent.listChats({
  organization_id: "org_abc",
  user_id: "user_123",
  limit: 20,
});

const chat = await client.aiAgent.getChat("chat_id", true);

await client.aiAgent.deleteChat("chat_id", {
  organization_id: "org_abc",
  user_id: "user_123",
});
```

**Python**

```python
chats = client.ai_agent.list_chats(
    organization_id="org_abc",
    user_id="user_123",
    limit=20,
)

chat = client.ai_agent.get_chat("chat_id", include_messages=True)

client.ai_agent.delete_chat(
    "chat_id",
    organization_id="org_abc",
    user_id="user_123",
)
```
