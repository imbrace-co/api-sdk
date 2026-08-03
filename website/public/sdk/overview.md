# Overview

The Imbrace SDK is the official client for the Imbrace Gateway, available in **TypeScript** and **Python**. Both SDKs wrap the same Gateway API with the same resource namespaces, the same auth model, and the same retry/error semantics — pick whichever language fits your stack.

### Key Features

| Feature | Detail |
|---|---|
| **Type safety** | TypeScript types and Python type hints across every resource |
| **Two credential types** | `apiKey` or `accessToken` — see [Authentication](/sdk/authentication.md) |
| **Auto retry** | 429 and 5xx retry with exponential backoff, no config needed |
| **Streaming AI** | SSE / async iterator for `streamChat` and AI completions |
| **Async & sync (Py)** | `ImbraceClient` (sync) and `AsyncImbraceClient` (async) |
| **Cancellation (TS)** | `AbortSignal` propagation for in-flight cancellation |

### Install

**TypeScript**

```bash
npm install @imbrace/sdk
```

**Python**

```bash
pip install imbrace
```

### Hello, world

**TypeScript**

```typescript
import { ImbraceClient } from "@imbrace/sdk"

const client = new ImbraceClient({ accessToken: "acc_your_token" })
const me = await client.platform.getMe()
```

**Python**

```python
from imbrace import ImbraceClient

with ImbraceClient(access_token="acc_your_token") as client:
    me = client.platform.get_me()
```

### Available resources

Every namespace is on both SDKs. Methods follow the language conventions — `client.aiAgent.streamChat()` in TS, `client.ai_agent.stream_chat()` in Python.

| Namespace | Microservice | Purpose |
|---|---|---|
| `client.aiAgent` / `client.ai_agent` | ai-agent | Streaming AI chat, embeddings, parquet, chat-client sub-API |
| `client.chatAi` / `client.chat_ai` | ai-service-v2 | AI Agent CRUD (create/update/delete/list AI agents) |
| `client.documentAi` / `client.document_ai` | ai-service-v2 | Document parsing, extraction, and AI over files |
| `client.agent` | marketplace | AI agent **templates** + use-cases (atomic create of assistant + workflow + channel via `createUseCase`) |
| `client.workflows` | workflow-engine | Workflow automation — flows, triggers, runs |
| `client.boards` | data-board | CRM boards — CRUD, items, fields, search, segments, CSV; KnowledgeHub folders & files |
| `client.platform`, `client.organizations`, `client.teams` | platform | Users, organizations, teams, business units |
| `client.contacts`, `client.conversations`, `client.messages`, `client.channel`, `client.categories`, `client.campaign`, `client.outbound` | channel-service | Contacts, conversations, messaging, channel/campaign management |
| `client.marketplace` | marketplace | Marketplace files, email templates, channel workflows |
| `client.fileService` | file-service | Context-aware file uploads (board attachments, contact files, financial files, presigned URLs) |
| `client.ips`, `client.schedule` | ips | Inter-process scheduling / automation rules |
| `client.ai` | ai-service-v2 | OpenAI-compatible completions, embeddings, providers, guardrails |
| `client.auth` | platform / legacy backend | Sign-in (OTP, password, SSO), token exchange |

For the complete list and method reference, see [Resources](/sdk/resources.md).

### When to pick which credential

| | API Key | Access Token |
|---|---|---|
| **Whose backend is Imbrace?** | A feature inside *your* backend | *Imbrace IS* your backend |
| **Whose users?** | Yours | Imbrace's |
| **Best for** | Server-to-server, internal scripts, CRM integrations | User-facing apps where each end-user logs in |

Full decision tree: [Authentication →](/sdk/authentication.md).

### Next steps

- [Installation →](/sdk/installation.md) — set up the package and credentials
- [Quick Start →](/sdk/quick-start.md) — make your first call in 60 seconds
- [Full Flow Guide →](/sdk/full-flow-guide.md) — end-to-end walkthrough of the four major workflows (AI agents, workflows, knowledge hub, boards)
