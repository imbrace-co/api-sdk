# Imbrace SDK

Official TypeScript and Python SDKs for the Imbrace Gateway — type-safe, batteries-included, production-ready.

## Why Imbrace SDK?

- **Type-safe by Design** — Full TypeScript definitions and Python type hints across all 27+ resource namespaces. Catch errors at compile time, not runtime.
- **Auto-retry & Resilience** — Built-in exponential backoff for 429 and 5xx responses. Zero configuration needed — your app stays alive under load.
- **3-Tier Authentication** — API Key, JWT Bearer, and legacy access token — all handled transparently. Switch auth strategy without changing business logic.
- **Async-first Python** — Parallel `AsyncImbraceClient` alongside the sync client. Drop into FastAPI, asyncio, or Django with one import.

## Quick Install

**TypeScript**

```bash
npm install @imbrace/sdk
```

```typescript
import { ImbraceClient } from "@imbrace/sdk";
const client = new ImbraceClient();
const me = await client.platform.getMe();
```

**Python**

```bash
pip install imbrace
```

```python
from imbrace import ImbraceClient
client = ImbraceClient()
me = client.platform.get_me()
```

## Explore the Docs

- [SDK Overview](sdk/overview/) — Architecture, resource namespaces, auth strategy. TypeScript and Python in one place.
- [Quick Start](sdk/quick-start/) — Make your first API call in 60 seconds.
- [Authentication](sdk/authentication/) — API key vs access token, the OTP login flow, and which to pick.
- [Full Flow Guide](sdk/full-flow-guide/) — End-to-end walkthrough of the four major workflows.
- [Testing Guide](guides/testing/) — Unit tests, mocking, integration test patterns.
- [Troubleshooting](guides/troubleshooting/) — Common errors, debugging tips, known issues.
