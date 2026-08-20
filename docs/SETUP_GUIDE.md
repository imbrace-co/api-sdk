# Imbrace SDK — Setup Guide

This document explains how to install and use the Imbrace SDK for both **TypeScript/JavaScript** and **Python**, including installation inside the monorepo and installation from the outside as a standalone package.

---

## Table of contents

1. [System requirements](#1-system-requirements)
2. [Installing the TypeScript SDK](#2-installing-the-typescript-sdk)
3. [Installing the Python SDK](#3-installing-the-python-sdk)
4. [Authentication configuration](#4-authentication-configuration)
5. [Environments](#5-environments)
6. [Initializing the client](#6-initializing-the-client)
7. [Quick usage examples](#7-quick-usage-examples)
8. [Overriding service URLs](#8-overriding-service-urls)
9. [Running tests](#9-running-tests)
10. [Common troubleshooting](#10-common-troubleshooting)

---

## 1. System requirements

| Requirement | Minimum version |
|---|---|
| Node.js | 18.0.0+ |
| npm | 8.0.0+ |
| Python | 3.9+ |
| pip | 23.0+ |

---

## 2. Installing the TypeScript SDK

### Installing from the outside (npm registry)

```bash
npm install @imbrace/sdk
```

```bash
# or use yarn
yarn add @imbrace/sdk

# or use pnpm
pnpm add @imbrace/sdk
```

### Installing inside the monorepo (local development)

```bash
# Step 1: enter the ts directory and install dependencies
cd sdk/ts
npm install

# Step 2: build the package
npm run build

# Step 3 (optional): link globally to use it in another project on the same machine
npm link
```

After `npm link`, go into the external project and run:

```bash
cd /path/to/your-project
npm link @imbrace/sdk
```

### Verifying the installation

```ts
import { ImbraceClient } from '@imbrace/sdk'
console.log('SDK loaded:', typeof ImbraceClient) // 'function'
```

---

## 3. Installing the Python SDK

### Installing from the outside (PyPI)

```bash
pip install imbrace
```

```bash
# or use uv
uv add imbrace

# or add it to pyproject.toml
# dependencies = ["imbrace>=1.0.0"]
```

### Installing inside the monorepo (local development)

```bash
# Editable mode — source changes take effect immediately, no reinstall needed
cd sdk/py
pip install -e ".[dev]"
```

The `[dev]` flag also installs: `pytest`, `pytest-asyncio`, `pytest-httpx`, `ruff`, `mypy`.

### Verifying the installation

```python
from imbrace import ImbraceClient
print("SDK loaded:", ImbraceClient)
```

---

## 4. Authentication configuration

The SDK supports 2 authentication methods:

| Method | Header sent | Use when |
|---|---|---|
| **API Key** | `x-api-key` | Server-to-server, backend service |
| **Access Token** | `x-access-token` | Client-side, after logging in with email/password or OTP |

### Creating a `.env` file

```bash
# Shared by both TypeScript and Python — the template is at the repo root
cp .env.example .env
```

`.env` contents:

```env
# Environment: develop | sandbox | stable
IMBRACE_ENV=stable

# Server-side authentication (prefer this for backends)
IMBRACE_API_KEY=your_api_key_here

# Client-side authentication (use after login)
# IMBRACE_ACCESS_TOKEN=your_jwt_token_here

# Organization ID (sent with every request)
IMBRACE_ORGANIZATION_ID=your_org_id_here

# Override the gateway URL (leave empty to use the default environment)
IMBRACE_GATEWAY_URL=
```

### Getting an API Key

Option 1 — via the Portal: log in to the Imbrace Portal, go to **Settings → API Keys**.

Option 2 — via the API (requires an existing access token):

```bash
curl -X POST https://app-gatewayv2.imbrace.co/private/backend/v1/third_party_token \
  -H "x-access-token: <your_existing_token>" \
  -H "Content-Type: application/json" \
  -d '{"expirationDays": 30}'
```

The response returns `apiKey.apiKey` — that is the API Key.

---

## 5. Environments

| Name | Gateway URL | Use when |
|---|---|---|
| `develop` | `https://app-gateway.dev.imbrace.co` | Internal development |
| `sandbox` | `https://app-gateway.sandbox.imbrace.co` | Integration testing |
| `stable` | `https://app-gatewayv2.imbrace.co` | Production (default) |

---

## 6. Initializing the client

### TypeScript

```ts
import { ImbraceClient } from '@imbrace/sdk'

// Server-side — use an API Key
const client = new ImbraceClient({
  apiKey: process.env.IMBRACE_API_KEY,
  organizationId: process.env.IMBRACE_ORGANIZATION_ID,
  env: 'stable', // default if omitted
})

// Client-side — use an Access Token
const client = new ImbraceClient({
  accessToken: 'eyJhbGci...',
  organizationId: 'org_xxx',
})

// Log in with email/password to obtain an Access Token
const anonClient = new ImbraceClient({ env: 'stable' })
await anonClient.login('user@example.com', 'password')
// The access token is stored on the client automatically

// Log in with OTP
await anonClient.requestOtp('user@example.com')       // send the OTP to the email
await anonClient.loginWithOtp('user@example.com', '123456') // confirm
```

### Python (sync)

```python
import os
from imbrace import ImbraceClient

# Server-side — use an API Key
client = ImbraceClient(
    api_key=os.environ["IMBRACE_API_KEY"],
    organization_id=os.environ.get("IMBRACE_ORG_ID"),
    env="stable",
)

# Client-side — use an Access Token
client = ImbraceClient(
    access_token="eyJhbGci...",
    organization_id="org_xxx",
)

# Log in with email/password
anon = ImbraceClient(env="stable")
anon.login("user@example.com", "password")  # stores the token automatically

# Log in with OTP
anon.request_otp("user@example.com")
anon.login_with_otp("user@example.com", "123456")
```

### Python (async)

```python
from imbrace import AsyncImbraceClient

async def main():
    async with AsyncImbraceClient(api_key="sk-...") as client:
        me = await client.platform.get_me()
        print(me)
```

---

## 7. Quick usage examples

### TypeScript

```ts
import { ImbraceClient } from '@imbrace/sdk'

const client = new ImbraceClient({ apiKey: process.env.IMBRACE_API_KEY })

// Get the current user's info
const me = await client.platform.getMe()

// List channels
const channels = await client.channel.listChannels()

// Send a message
await client.channel.sendMessage('conv_123', {
  content: 'Hello!',
  type: 'text',
})

// Use AI
const result = await client.ai.complete({
  model: 'gpt-4o',
  messages: [{ role: 'user', content: 'Hello' }],
})

// AI streaming
for await (const chunk of client.ai.stream({ model: 'gpt-4o', messages: [...] })) {
  process.stdout.write(chunk.choices[0]?.delta?.content ?? '')
}

// Cleanup (not required for TS)
client.clearAccessToken()
```

### Python

```python
from imbrace import ImbraceClient

with ImbraceClient(api_key="sk-...") as client:
    # Get the user's info
    me = client.platform.get_me()

    # List channels
    channels = client.channel.list()

    # Boards
    boards = client.boards.list()
    items  = client.boards.list_items(boards[0]["id"])

    # AI
    result = client.ai.complete(
        model="gpt-4o",
        messages=[{"role": "user", "content": "Hello"}],
    )
```

---

## 8. Overriding service URLs

Use this when a microservice runs at a different address (e.g. local dev, a separate staging).

### TypeScript

```ts
const client = new ImbraceClient({
  env: 'develop',
  services: {
    dataBoard:      'http://localhost:3001/data-board',
    channelService: 'http://localhost:3002/channel-service',
  },
})
```

### Python

```python
client = ImbraceClient(
    env="develop",
    services={
        "data_board":      "http://localhost:3001/data-board",
        "channel_service": "http://localhost:3002/channel-service",
    },
)
```

Valid keys:

| Python key | TypeScript key | Service |
|---|---|---|
| `gateway` | `gateway` | App Gateway |
| `platform` | `platform` | Platform service |
| `channel_service` | `channelService` | Channel service |
| `data_board` | `dataBoard` | Data Board |
| `ips` | `ips` | IPS service |
| `ai` | `ai` | AI service |
| `marketplaces` | `marketplaces` | Marketplace service |
| `file_service` | `fileService` | File service |
| `activepieces` | `activepieces` | Workflow |

---

## 9. Running tests

### TypeScript

```bash
cd sdk/ts

# Unit tests (no credentials required)
npm test

# Integration tests (require IMBRACE_API_KEY in .env)
npm run test:integration

# All
npm run test:all

# Watch mode
npm run test:watch
```

### Python

```bash
cd sdk/py

# Unit tests
pytest tests/unit

# Integration tests (require environment variables)
IMBRACE_API_KEY=sk-... pytest tests/integration -m integration

# All
pytest
```

---

## 10. Common troubleshooting

### `Cannot find package '@imbrace/sdk'`
The package is not linked. Re-run from the `sdk/ts` directory:
```bash
npm link
cd /path/to/your-project && npm link @imbrace/sdk
```

### `ERR_MODULE_NOT_FOUND` for a file in `dist/`
The package has not been built. Run:
```bash
cd sdk/ts && npm run build
```

### `ModuleNotFoundError: No module named 'imbrace'`
The package is not installed. Run:
```bash
cd sdk/py && pip install -e ".[dev]"
```

### `401 Unauthorized`
The API Key is expired or wrong. Create a new API Key:
```bash
curl -X POST https://app-gatewayv2.imbrace.co/private/backend/v1/third_party_token \
  -H "x-access-token: <your_existing_token>" \
  -H "Content-Type: application/json" \
  -d '{"expirationDays": 30}'
```

### `UserWarning: ImbraceClient: no credentials provided`
No `api_key` or `access_token` was passed. If this is intentional (e.g. just to log in), you can ignore this warning. Otherwise, double-check your `.env` file.

---

*Imbrace SDK — MIT License*
