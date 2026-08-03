## API Overview

iMBRACE is a multi-channel customer engagement platform (WhatsApp, Facebook, Instagram, WeChat, LINE, Email, Web). The Imbrace SDK wraps three REST gateways behind a single `ImbraceClient`.

---

## Three Gateways

### App Gateway (default)

Public REST API for client-facing apps (web, mobile, integrations).

| | |
|---|---|
| **Auth** | OTP-based (`x-access-token`) or API key (`x-api-key`) |
| **Path prefixes** | `/v1/backend/`, `/v2/backend/` |
| **Base URL** | `https://app-gatewayv2.imbrace.co` (stable) |
| **Use for** | Everything exposed to the Imbrace SDK (contacts, boards, AI agent, channels, etc.) |

### Server Gateway

Private API for server-to-server automation.

| | |
|---|---|
| **Auth** | API key (`x-api-key`) |
| **Path prefix** | `/3rd/` |
| **Use for** | Backend automation, bulk operations, third-party token generation |

Third-party token endpoint (generate an API key from an existing access token):

```bash
POST /private/backend/v1/third_party_token
x-access-token: <your_existing_token>
Content-Type: application/json

{ "expirationDays": 30 }
```

### Journey API

Developer portal for building, testing, and publishing custom apps (Journeys) to the iMBRACE Marketplace.

| | |
|---|---|
| **Path prefixes** | `/journeys/api/v1/`, `/journeys/v2/` |
| **Use for** | Marketplace app lifecycle, custom integrations |

---

## Environments

| Name | Base URL | Notes |
|---|---|---|
| `stable` (default) | `https://app-gatewayv2.imbrace.co` | Production |
| `develop` | `https://app-gateway.dev.imbrace.co` | Development |
| `sandbox` | `https://app-gateway.sandbox.imbrace.co` | Sandbox / testing |

Set `IMBRACE_BASE_URL` to override. Defaults to `stable` when unset.

---

## Authentication

Two credential modes — pick one when constructing the client:

### API Key (`apiKey` / `api_key`)

Server-to-server. Sent as `x-api-key` header on every request.

```typescript
const client = new ImbraceClient({ apiKey: process.env.IMBRACE_API_KEY })
```

```python
with ImbraceClient(api_key=os.environ["IMBRACE_API_KEY"]) as client:
    ...
```

Get an API key from the Imbrace Portal, or generate one programmatically via the Server Gateway (`POST /private/backend/v1/third_party_token`).

### Access Token (`accessToken` / `access_token`)

User-scoped OAuth token. Sent as `x-access-token` header. Obtained via the OTP login flow:

```typescript
// 1. Request OTP
await client.requestOtp("user@example.com")

// 2. Verify OTP → receive token
const { token } = await client.loginWithOtp("user@example.com", "123456")

// 3. Use the token
const authedClient = new ImbraceClient({ accessToken: token })
```

```python
client.auth.signin_email_request("user@example.com")
res = client.auth.signin_with_email("user@example.com", "123456")
authed = ImbraceClient(access_token=res["token"])
```

---

## Request conventions

| Header | Set by |
|---|---|
| `x-api-key` | API key credential |
| `x-access-token` | Access token credential |
| `x-organization-id` | `organizationId` constructor param or `IMBRACE_ORG_ID` env var |
| `Content-Type: application/json` | All JSON requests |

Paginated list responses return:

```json
{ "data": [...], "total": 100, "page": 1, "limit": 20 }
```

Fields are at the top level, not nested under a key.

---

## Resource Namespaces (30+)

| Namespace | Description |
|---|---|
| `client.aiAgent` / `client.ai_agent` | Streaming AI chat (SSE), embeddings/RAG, parquet, tracing, chat-client widget |
| `client.chatAi` / `client.chat_ai` | Assistant CRUD, LLM completions, file processing, knowledge hub |
| `client.workflows` | Workflow automation — flows, triggers, runs, connections |
| `client.boards` | CRM boards, items, fields, search, segments, CSV; KH folders & files |
| `client.contacts` | Contact management, search, files, notifications |
| `client.conversations` | Team conversations, status, assignment |
| `client.messages` | Send/list messages, comments, pins |
| `client.channel` | Channel config (WhatsApp, Facebook, Instagram, WeChat, LINE, Email, Web) |
| `client.platform` | Platform admin |
| `client.organizations` | Organization management |
| `client.teams` | Team and member management |
| `client.auth` | OTP & password login, SSO, token exchange |
| `client.ai` | OpenAI-compatible completions and embeddings |
| `client.marketplace` | Products, orders, templates, categories |
| `client.workflows` | Channel automation workflows |
| `client.campaign` | Campaign CRUD, touchpoints |
| `client.predict` | ML-based lead scoring |
| `client.message_suggestion` | AI-powered reply suggestions |
| `client.settings` | Message templates, user management |
| `client.schedule` | Scheduled messages / jobs |
| `client.sessions` | User session management |
| `client.health` | Gateway health check |
| `client.account` | Logged-in user profile |

---

## External API References

- [App Gateway — Getting Started](https://devportal.dev.imbrace.co/docs/api-document/app-apis/_gettingStarted)
- [App Gateway — Contacts](https://devportal.dev.imbrace.co/docs/api-document/app-apis/contactsApis)
- [App Gateway — Boards](https://devportal.dev.imbrace.co/docs/api-document/app-apis/boardApis)
- [App Gateway — AI Agent](https://devportal.dev.imbrace.co/docs/api-document/app-apis/aIAgentApis)
- [Server Gateway — Overview](https://devportal.dev.imbrace.co/docs/api-document/server-gateways)
- [Journey API — Overview](https://devportal.dev.imbrace.co/docs/api-document/journeyAPIReference)
- [Developer Portal](https://devportal.dev.imbrace.co/docs)
