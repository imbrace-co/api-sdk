# Setup Guide

This guide covers everything you need to go from zero to a working Imbrace SDK integration — installation, credentials, environments, and service URL overrides.

---

### System Requirements

| Requirement | Minimum version |
| ----------- | --------------- |
| Node.js     | 18.0.0+         |
| npm         | 8.0.0+          |
| Python      | 3.9+            |
| pip         | 23.0+           |

---

### Installation

**TypeScript — from npm registry:**

```bash
npm install @imbrace/sdk
# or
yarn add @imbrace/sdk
# or
pnpm add @imbrace/sdk
```

**TypeScript — monorepo / local development:**

```bash
# Step 1 — install dependencies and build
cd ts
npm install
npm run build

# Step 2 (optional) — link globally to use in another project on the same machine
npm link
```

Then in your external project:

```bash
npm link @imbrace/sdk
```

**TypeScript — verify:**

```typescript
import { ImbraceClient } from "@imbrace/sdk";
console.log("SDK loaded:", typeof ImbraceClient); // 'function'
```

**Python — from PyPI:**

```bash
pip install imbrace
# or
uv add imbrace
```

**Python — monorepo / local development (editable mode):**

```bash
cd py
pip install -e ".[dev]"
```

The `[dev]` flag installs: `pytest`, `pytest-asyncio`, `pytest-httpx`, `ruff`, `mypy`.

**Python — verify:**

```python
from imbrace import ImbraceClient
print("SDK loaded:", ImbraceClient)
```

---

### Configure Credentials

#### Create a `.env` file

The SDK does not auto-read environment variables — you pass credentials directly to the constructor. A `.env` file is a user convention for storing secrets; use `dotenv` or your framework's env loader to read them.

```env
# Credentials
IMBRACE_API_KEY=your_api_key_here
IMBRACE_ACCESS_TOKEN=your_jwt_token_here

# Organization ID — sent with every request
IMBRACE_ORGANIZATION_ID=your_org_id_here

# Optional: override the gateway URL directly
IMBRACE_GATEWAY_URL=https://app-gatewayv2.imbrace.co
```

#### Get an API Key

See [Get an API Key](/guides/api-key) for full instructions.

---

### Environments

| Name      | Gateway URL                              | Use when             |
| --------- | ---------------------------------------- | -------------------- |
| `develop` | `https://app-gateway.dev.imbrace.co`     | Internal development |
| `sandbox` | `https://app-gateway.sandbox.imbrace.co` | Integration testing  |
| `stable`  | `https://app-gatewayv2.imbrace.co`       | Production (default) |

Switch environments via the `env` constructor option, or override the URL directly with `baseUrl`:

**TypeScript**

```typescript
const client = new ImbraceClient({ env: "sandbox" });
```

**Python**

```python
client = ImbraceClient(env="sandbox")
```

---

### Initialize the Client

**TypeScript**

```typescript
import { ImbraceClient } from "@imbrace/sdk";

// Server-side — API Key
const client = new ImbraceClient({
  apiKey:         process.env.IMBRACE_API_KEY,
  organizationId: process.env.IMBRACE_ORGANIZATION_ID,
  baseUrl:        "https://app-gatewayv2.imbrace.co", // or use env: "stable"
});

// Client-side — Access Token (e.g. after a previous login, or a token you store yourself)
const client = new ImbraceClient({
  accessToken: process.env.IMBRACE_ACCESS_TOKEN,
  baseUrl:     "https://app-gatewayv2.imbrace.co",
});

// Password login (POST /v1/login/sign_in) — most common for end-user apps.
// Returns { token: "login_acc_...", organizations: [...] } in one call; pick one
// with selectOrganization() and the SDK swaps for an org-scoped acc_ token.
const anon = new ImbraceClient({ baseUrl: "https://app-gatewayv2.imbrace.co" });
const { organizations } = await anon.login("user@example.com", "password");
await anon.selectOrganization(organizations[0].id);

// OTP login flow (alternative — for email-OTP UX instead of password)
await anon.requestOtp("user@example.com");
await anon.loginWithOtp("user@example.com", "123456");
// Token is stored automatically on the client
```

**Python (sync)**

```python
import os
from imbrace import ImbraceClient

# Server-side — API Key
client = ImbraceClient(
    api_key=os.environ["IMBRACE_API_KEY"],
    organization_id=os.environ.get("IMBRACE_ORGANIZATION_ID"),
    env="stable",
)

# Client-side — Access Token
client = ImbraceClient(
    access_token="eyJhbGci...",
    organization_id="org_xxx",
)

# Password login (POST /platform/v1/login/authenticate) — most common for end-user apps.
# login() returns the user's organizations; pick one and select_organization()
# swaps the short-lived login_acc_ token for an org-scoped acc_ token.
anon = ImbraceClient(env="stable")
res = anon.login("user@example.com", "password")
anon.select_organization(res["organizations"][0]["organization_id"])

# OTP login flow (alternative — for email-OTP UX instead of password)
anon.request_otp("user@example.com")
anon.login_with_otp("user@example.com", "123456")
```

**Python (async)**

```python
from imbrace import AsyncImbraceClient

async def main():
    async with AsyncImbraceClient(api_key="api_...") as client:
        me = await client.platform.get_me()
        print(me)
```

---

### CLI Installation

```bash
# Install globally
npm install -g @imbrace/cli

# Login to get started
imbrace login --api-key api_xxx...
```

See [CLI Installation](/cli/installation.md) for alternative install methods and [CLI Commands](/cli/commands.md) for the full command reference.

---

## Quick Usage Examples

**TypeScript**

```typescript
import { ImbraceClient } from '@imbrace/sdk'

const client = new ImbraceClient({ apiKey: process.env.IMBRACE_API_KEY })

// Get current user
const me = await client.platform.getMe()

// List channels
const channels = await client.channel.list()

// Send a message
await client.messages.send({ type: 'text', text: 'Hello!' })

// AI completion
const result = await client.ai.complete({
  model: 'gpt-4o',
  messages: [{ role: 'user', content: 'Summarize this.' }],
})

// AI streaming
for await (const chunk of client.ai.stream({ model: 'gpt-4o', messages: [...] })) {
  process.stdout.write(chunk.choices[0]?.delta?.content ?? '')
}

// AI Agent — streaming chat
const response = await client.aiAgent.streamChat({
  id: 'chat_id',
  assistant_id: 'asst_abc',
  messages: [{ role: 'user', content: 'Hello' }],
})
const reader = response.body!.getReader()
const decoder = new TextDecoder()
while (true) {
  const { done, value } = await reader.read()
  if (done) break
  console.log(decoder.decode(value))
}
```

**Python**

```python
from imbrace import ImbraceClient
from imbrace.types.ai import CompletionInput, CompletionMessage

with ImbraceClient(api_key="sk-...") as client:
    # Get current user
    me = client.platform.get_me()

    # List channels and boards
    channels = client.channel.list()
    boards_res = client.boards.list()
    boards_data = boards_res.get("data", [])
    if boards_data:
        board_id = boards_data[0].get("_id") or boards_data[0]["id"]
        items = client.boards.list_items(board_id)

    # AI completion
    result = client.ai.complete(CompletionInput(
        model="gpt-4o",
        messages=[CompletionMessage(role="user", content="Hello")],
    ))

    # AI Agent — streaming chat
    response = client.ai_agent.stream_chat({
        "id": "chat_id",
        "assistant_id": "asst_abc",
        "messages": [{"role": "user", "content": "Hello"}],
    })
    for line in response.iter_lines():
        print(line)
```

---

### Override Service URLs

Use this when a microservice runs at a different address (e.g. local dev, dedicated staging).

**TypeScript**

```typescript
const client = new ImbraceClient({
  env: "develop",
  services: {
    aiAgent: "http://localhost:4000/ai-agent",
    dataBoard: "http://localhost:3001/data-board",
    channelService: "http://localhost:3002/channel-service",
  },
});
```

**Python**

```python
client = ImbraceClient(
    env="develop",
    services={
        "ai_agent":       "http://localhost:4000/ai-agent",
        "data_board":     "http://localhost:3001/data-board",
        "channel_service":"http://localhost:3002/channel-service",
    },
)
```

All valid service keys:

| Python key           | TypeScript key      | Service                             |
| -------------------- | ------------------- | ----------------------------------- |
| `gateway`            | `gateway`           | App Gateway                         |
| `platform`           | `platform`          | Platform service                    |
| `channel_service`    | `channelService`    | Channel service                     |
| `data_board`         | `dataBoard`         | Data Board                          |
| `backend`            | `backend`           | Legacy monolith (`/v1/backend`) — auth signin, templates, a few legacy routes |
| `ips`                | `ips`               | IPS service                         |
| `ai`                 | `ai`                | AI service                          |
| `marketplaces`       | `marketplaces`      | Marketplace service                 |
| `file_service`       | `fileService`       | File service                        |
| `message_suggestion` | `messageSuggestion` | Message Suggestion service          |
| `predict`            | `predict`           | Predict service                     |
| `workflow_engine`    | `workflowEngine`    | Workflows            |
| `ai_agent`           | `aiAgent`           | AI Agent service                    |

---

### Troubleshooting

##### `Cannot find package '@imbrace/sdk'`

Package is not linked. Re-run from `ts`:

```bash
npm link
cd /path/to/your-project && npm link @imbrace/sdk
```

##### `ERR_MODULE_NOT_FOUND` for files in `dist/`

Package has not been built yet:

```bash
cd ts && npm run build
```

##### `ModuleNotFoundError: No module named 'imbrace'`

```bash
cd py && pip install -e ".[dev]"
```

##### `401 Unauthorized`

API Key expired or invalid. Generate a new one:

```bash
curl -X POST https://app-gatewayv2.imbrace.co/private/backend/v1/third_party_token \
  -H "x-access-token: <your_existing_token>" \
  -H "Content-Type: application/json" \
  -d '{"expirationDays": 30}'
```

##### `UserWarning: ImbraceClient: no credentials provided`

No `api_key` or `access_token` passed. If intentional (e.g. login-only flow), ignore this warning. Otherwise check your `.env` file.
