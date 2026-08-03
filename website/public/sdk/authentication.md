# Authentication

The SDK supports two credential types. Pass either `apiKey` / `api_key` or `accessToken` / `access_token` to the client constructor — the transport handles headers automatically.

### Which credential should I use?

The choice depends on **what role Imbrace plays in your product**:

#### Build on Imbrace → use Access Token

Imbrace is your backend. Your end-users log into Imbrace (via OTP or password); their `acc_...` access token is the credential the SDK uses for every request. Imbrace's auth, database, and business logic (AI agents, knowledge hubs, workflows) all run on behalf of the actual logged-in user.

Typical product: a chat widget, dashboard, or mobile app where each user's identity is an Imbrace user. Imbrace records per-user history, permissions, and audit trail.

#### Wrap Imbrace → use API Key

You have your own backend, your own users, your own database. Imbrace is one capability your service calls into — alongside everything else you do. Your end-users never see Imbrace; your service calls Imbrace using a single org-level `api_...` key. Imbrace sees one identity (the API key's service user) and you handle per-user attribution on your side.

Typical product: an existing CRM, ticketing system, or internal tool that embeds Imbrace as a feature. One credential lives in your env file and serves every request.

| | Build on Imbrace (Access Token) | Wrap Imbrace (API Key) |
| --- | --- | --- |
| **Who runs auth?** | Imbrace (OTP / password login) | You (your own auth) |
| **Whose users?** | Imbrace users | Your users |
| **Whose DB is canonical?** | Imbrace's | Yours |
| **Identity Imbrace sees** | The actual end-user | One service account |
| **Per-user attribution upstream** | Built-in | Up to you |
| **Credential lifetime** | Session-scoped; refresh as needed | Long-lived; doesn't expire on its own |
| **Header sent** | `x-access-token: acc_...` | `x-api-key: api_...` |

Both credential types are first-class. Most resources accept either. A few features that depend on user context (document artifacts, per-user chat history) are only meaningful under an access token.

### Header reference

| Credential | Header sent |
| --- | --- |
| `apiKey` / `api_key` | `x-api-key: api_xxx...` |
| `accessToken` / `access_token` | `x-access-token: acc_xxx...` |

The org context is **encoded inside the credential itself** — every API key and every access token is bound to exactly one org. The gateway resolves the org on every request from whichever credential you sent. You can optionally override it by passing `organizationId` (TypeScript) or `organization_id` (Python) to the constructor.

For step-by-step credential setup (env vars, dotenv, secrets), see [Setup Guide](/getting-started/setup.md#configure-credentials).

---

### API Key

**TypeScript**

```typescript
import { ImbraceClient } from "@imbrace/sdk";

const client = new ImbraceClient({
  apiKey: "api_xxx...",
  baseUrl: "https://app-gatewayv2.imbrace.co",
});
```

**Python**

```python
import os
from imbrace import ImbraceClient

client = ImbraceClient(
    api_key=os.environ["IMBRACE_API_KEY"],
)
```

---

### Access Token

If you already have an `acc_...` token, pass it directly:

**TypeScript**

```typescript
const client = new ImbraceClient({
  accessToken: "acc_xxxxxxxxxxxxx",
  baseUrl: "https://app-gatewayv2.imbrace.co",
});
```

**Python**

```python
client = ImbraceClient(
    access_token="acc_xxxxxxxxxxxxx",
)
```

---

### OTP Login Flow

Use this flow to authenticate a user via email OTP and obtain a session token. The SDK stores the token automatically after login.

**TypeScript**

```typescript
import { ImbraceClient } from "@imbrace/sdk"

const client = new ImbraceClient({
  baseUrl: "https://app-gatewayv2.imbrace.co",
})

// Step 1: Send OTP to the user's email
await client.requestOtp("user@example.com")

// Step 2: User submits the OTP they received
const loginRes = await client.loginWithOtp("user@example.com", "ABC123")
// loginRes contains a short-lived login_acc_... token (stored internally)

// Step 3: Exchange for a long-lived access token
const { token, refresh_token } = await client.auth.exchangeAccessToken("org_your_org_id")

// Step 4: Activate the token for all subsequent calls
client.setAccessToken(token)

// Now use any resource
const { data: boards } = await client.boards.list()
```

**Python**

```python
from imbrace import ImbraceClient

client = ImbraceClient()

# Step 1: Send OTP to the user's email
client.request_otp("user@example.com")

# Step 2: User submits the OTP. login_with_otp stores the short-lived
#         login_acc_ token AND returns the user's organizations.
res = client.login_with_otp("user@example.com", "123456")
chosen = res["organizations"][0]  # ← replace with your UI's selection

# Step 3: Swap the login_acc_ for an org-scoped acc_ token.
client.select_organization(chosen["organization_id"])

# Step 4: Now use any resource
me = client.platform.get_me()
```

Async variant:

```python
from imbrace import AsyncImbraceClient

async with AsyncImbraceClient() as client:
    await client.request_otp("user@example.com")
    res = await client.login_with_otp("user@example.com", "123456")
    chosen = res["organizations"][0]
    await client.select_organization(chosen["organization_id"])
    me = await client.platform.get_me()
```

---

### Password Login

**TypeScript**

```typescript
const client = new ImbraceClient({
  baseUrl: "https://app-gatewayv2.imbrace.co",
})

await client.login("user@example.com", "password")

// Token is stored automatically — proceed with any resource
const { data: boards } = await client.boards.list()
```

**Python**

```python
client = ImbraceClient()
client.login("user@example.com", "password123")

# Token stored automatically
boards = client.boards.list()
```

---

### Token management

**TypeScript**

```typescript
// Replace token (e.g., after a refresh)
client.setAccessToken("acc_new_token...")

// Clear token (e.g., on logout)
client.clearAccessToken()
```

**Python**

```python
# Replace token (e.g., after refresh)
client.set_access_token("acc_new_token...")

# Clear token (e.g., on logout)
client.clear_access_token()
```

---

### Context manager (Python only)

Always wrap the Python client in a context manager so the underlying `httpx` connection pool is closed cleanly:

```python
# Synchronous
with ImbraceClient(api_key="api_xxx") as client:
    me = client.platform.get_me()

# Asynchronous
async with AsyncImbraceClient(api_key="api_xxx") as client:
    me = await client.platform.get_me()
```
