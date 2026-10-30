# Error Handling

All errors thrown by the SDK extend a single base type, so you can catch any SDK error in one place or branch on the specific subclass when you need to react differently. The hierarchy is identical across the TypeScript and Python SDKs.

## Error hierarchy

**TypeScript**

```
Error
└── ImbraceError          (base — catch-all for SDK errors)
    ├── AuthError          (401, 403 — invalid or expired credentials)
    ├── ApiError           (4xx/5xx — request rejected by the server)
    └── NetworkError       (timeout, connection refused, DNS failure)
```

**Python**

```
Exception
└── ImbraceError          (base — catch-all for SDK errors)
    ├── AuthError          (401, 403 — invalid or expired credentials)
    ├── ApiError           (4xx/5xx — request rejected by server)
    └── NetworkError       (timeout, connection refused, DNS failure)
```

For specific error messages and known fixes, see [Troubleshooting](/guides/troubleshooting.md).

---

## AuthError

Raised when the server returns **401** or **403** — credentials are invalid, expired, or revoked.

**TypeScript**

```typescript
import { AuthError } from "@imbrace/sdk";

try {
  const me = await client.platform.getMe();
} catch (e) {
  if (e instanceof AuthError) {
    console.error("Re-authenticate:", e.message);
  }
}
```

**Python**

```python
from imbrace import AuthError

try:
    me = client.platform.get_me()
except AuthError as e:
    print(f"Auth failed: {e}")
    # Re-authenticate before retrying
```

`AuthError` is **never retried**. The SDK throws/raises immediately on 401/403 — fix the credentials before trying again. For credential strategy, see [Authentication](/sdk/authentication.md).

---

## ApiError

Raised for all other **4xx and 5xx** responses (after retries are exhausted for 429/5xx).

**TypeScript**

```typescript
import { ApiError } from "@imbrace/sdk";

try {
  await client.contacts.get("nonexistent_id");
} catch (e) {
  if (e instanceof ApiError) {
    console.error(`HTTP ${e.statusCode}: ${e.message}`);
    // e.g. "HTTP 404: Contact not found"
  }
}
```

| Property     | Type     | Description                        |
| ------------ | -------- | ---------------------------------- |
| `statusCode` | `number` | HTTP status code                   |
| `message`    | `string` | Error message from server response |

**Python**

```python
from imbrace import ApiError

try:
    client.contacts.get("nonexistent_id")
except ApiError as e:
    print(f"HTTP {e.status_code}: {e}")
    # e.g. "HTTP 404: Contact not found"
```

| Attribute     | Type  | Description                        |
| ------------- | ----- | ---------------------------------- |
| `status_code` | `int` | HTTP status code                   |

---

## NetworkError

Raised when the request never reaches the server — timeout, DNS failure, or connection reset.

**TypeScript**

```typescript
import { NetworkError } from "@imbrace/sdk";

try {
  await client.platform.getMe();
} catch (e) {
  if (e instanceof NetworkError) {
    console.error("Cannot reach baseUrl:", e.message);
    // e.g. "Request timed out after 30000ms"
  }
}
```

**Python**

```python
from imbrace import NetworkError

try:
    client.platform.get_me()
except NetworkError as e:
    print(f"Network error: {e}")
    # e.g. "Network error or timeout: ConnectTimeout(...)"
```

---

## Catching all SDK errors

**TypeScript**

```typescript
import {
  ImbraceClient,
  ImbraceError,
  AuthError,
  ApiError,
  NetworkError,
} from "@imbrace/sdk";

try {
  await client.platform.getMe();
} catch (e) {
  if (e instanceof AuthError) return handleAuthError(e);
  if (e instanceof ApiError) return handleApiError(e);
  if (e instanceof NetworkError) return handleNetworkError(e);
  if (e instanceof ImbraceError) return handleUnknown(e);
  throw e; // re-throw non-SDK errors
}
```

**Python**

```python
from imbrace import ImbraceError, AuthError, ApiError, NetworkError

try:
    result = client.platform.get_me()
except AuthError as e:
    handle_auth_error(e)
except ApiError as e:
    handle_api_error(e)
except NetworkError as e:
    handle_network_error(e)
except ImbraceError as e:
    handle_unknown_sdk_error(e)
```

---

## Automatic retry behavior

The HTTP transport in both SDKs retries transient failures with exponential backoff.

**TypeScript**

| Condition                                  | Action                                                        |
| ------------------------------------------ | ------------------------------------------------------------- |
| HTTP **429 / 503**                         | Retry up to 3 times, any method                               |
| HTTP **5xx** (other)                       | Retry up to 3 times for GET, HEAD, OPTIONS, PUT, DELETE        |
| Network error / timeout                    | Retry up to 3 times for GET, HEAD, OPTIONS, PUT, DELETE        |
| HTTP **401 / 403**                         | No retry — throw `AuthError` immediately                      |
| HTTP **4xx** (other)                       | No retry — throw `ApiError` immediately                       |

POST and PATCH are not retried on timeouts, network errors or 5xx other than 503: the server may already have run them.

**Backoff:** on 429/503 the SDK waits for the `Retry-After` header (seconds or HTTP date) when the server sends one, up to 60 s; a longer `Retry-After` throws `ApiError` at once. Otherwise `2^retryCount` seconds between attempts (1s → 2s → 4s). Total worst-case: 4 attempts.

**Configure (1.7.0+):** `maxRetries` sets the number of retries (`0` = a single attempt). `fetch` replaces the `fetch` used for every request, e.g. to add your own retry, proxy or tracing layer.

```typescript
const client = new ImbraceClient({
  apiKey: process.env.IMBRACE_API_KEY,
  maxRetries: 0,      // the SDK makes one attempt; retry in your own layer
  fetch: myFetch,     // optional
});
```

**Python**

| Condition                                  | Action                                                        |
| ------------------------------------------ | ------------------------------------------------------------- |
| HTTP **429 / 503**                         | Retry up to 3 times, any method                               |
| HTTP **5xx** (other)                       | Retry up to 3 times for GET, HEAD, OPTIONS, PUT, DELETE        |
| Network error / timeout                    | Retry up to 3 times for GET, HEAD, OPTIONS, PUT, DELETE        |
| HTTP **401 / 403**                         | No retry — raise `AuthError` immediately                      |
| HTTP **4xx** (other)                       | No retry — raise `ApiError` immediately                       |

**Backoff:** on 429/503 the SDK waits for the `Retry-After` header (seconds or HTTP date) when the server sends one, up to 60 s; a longer `Retry-After` raises `ApiError` at once. Otherwise `2^retryCount` seconds between attempts (1s → 2s → 4s). Total worst-case: 4 attempts.

**Configure (1.4.0+):** `max_retries` sets the number of retries (`0` = a single attempt).

```python
client = ImbraceClient(api_key=os.environ["IMBRACE_API_KEY"], max_retries=0)
```

---

## Request timeout

Configure the timeout when creating the client (default: **30 s**). When the timeout fires, the in-flight request is aborted and a `NetworkError` is thrown/raised.

**TypeScript**

```typescript
const client = new ImbraceClient({ timeout: 15_000 }); // milliseconds
```

**Python**

```python
client = ImbraceClient(timeout=15)  # seconds
```

## Async error handling (Python)

The async client raises identical exception types:

```python
from imbrace import AsyncImbraceClient, AuthError, ApiError

async with AsyncImbraceClient() as client:
    try:
        me = await client.platform.get_me()
    except AuthError:
        print("Re-authenticate")
    except ApiError as e:
        print(f"[{e.status_code}] {e}")
```

---

## Best practices

**TypeScript**

```typescript
// 1. Always handle AuthError separately — credentials need to be refreshed
// 2. Log ApiError.statusCode — 400 = bad params, 404 = not found, 409 = conflict
// 3. Wrap top-level entry points in try/catch
// 4. Don't retry on AuthError — won't help until credentials are fixed

async function safeGetMe(client: ImbraceClient) {
  try {
    return await client.platform.getMe();
  } catch (e) {
    if (e instanceof AuthError) {
      await refreshCredentials();
      return await client.platform.getMe();
    }
    throw e;
  }
}
```

**Python**

```python
# 1. Use a context manager so connections are closed deterministically
with ImbraceClient() as client:
    ...

# 2. Handle AuthError separately — credentials need refresh before retrying
def safe_get_me(client):
    try:
        return client.platform.get_me()
    except AuthError:
        refresh_credentials(client)
        return client.platform.get_me()

# 3. Branch on status_code for ApiError
try:
    client.contacts.update(contact_id, data)
except ApiError as e:
    if e.status_code == 409:
        print("Conflict — contact has been modified")
    elif e.status_code == 400:
        print(f"Invalid data: {e}")
```
