# Installation

### Install

**TypeScript**

```bash
npm install @imbrace/sdk
# or
yarn add @imbrace/sdk
# or
pnpm add @imbrace/sdk
```

Requires Node.js 18+ (or any browser with native `fetch` and `ReadableStream`).

**Python**

```bash
pip install imbrace
# or
uv add imbrace
```

Requires Python 3.9+.

### Initialize the client

**TypeScript — access token (Build on Imbrace — Imbrace IS your backend, end-users log in via OTP)**

```typescript
import { ImbraceClient } from "@imbrace/sdk"

const client = new ImbraceClient({
  accessToken: "acc_your_token",
  baseUrl: "https://app-gatewayv2.imbrace.co",
})
```

The client is stateful — create it once and reuse it across your app.

**TypeScript — API key (Wrap Imbrace — Imbrace is a feature inside YOUR backend, your users)**

```typescript
import { ImbraceClient } from "@imbrace/sdk"

const client = new ImbraceClient({
  apiKey: "api_xxx...",
  baseUrl: "https://app-gatewayv2.imbrace.co",
})
```

**Python — access token**

```python
from imbrace import ImbraceClient

with ImbraceClient(access_token="acc_your_token") as client:
    ...
```

Python also exports `AsyncImbraceClient` (`async with ...`) for async stacks like FastAPI. The context manager closes the underlying HTTP connection pool automatically.

**Python — API key**

```python
from imbrace import ImbraceClient

with ImbraceClient(api_key="api_xxx...") as client:
    ...
```

For when to use each credential, see [Authentication](/sdk/authentication.md). For step-by-step credential setup (env vars, dotenv, secrets), see [Setup Guide](/getting-started/setup.md#configure-credentials).

### Verify

**TypeScript**

```typescript
import { ImbraceClient } from "@imbrace/sdk"
console.log("SDK loaded:", typeof ImbraceClient) // "function"
```

**Python**

```python
from imbrace import ImbraceClient
print("SDK ready:", ImbraceClient)
```

### Environment variables

The SDK does **not** auto-read environment variables. Pass credentials directly to the constructor and use a loader (`dotenv` / your framework's env handling) if you keep them in `.env`.

| Variable | Purpose |
|---|---|
| `IMBRACE_API_KEY` | Your API key (org-level credential) |
| `IMBRACE_ACCESS_TOKEN` | A user's access token (per-session credential) |
| `IMBRACE_GATEWAY_URL` | Override the gateway URL (default: `https://app-gatewayv2.imbrace.co`) |

The org id is encoded inside both API keys and access tokens. You can optionally override it by passing `organizationId` (TypeScript) or `organization_id` (Python) to the constructor. See [Authentication](/sdk/authentication.md) for details.
