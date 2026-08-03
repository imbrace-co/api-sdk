# Imbrace TypeScript SDK

Official TypeScript/JavaScript client for the [Imbrace](https://imbrace.co) platform. Build AI chat assistants, automate workflows, and manage CRM data from your own applications.

## Installation

```bash
npm install @imbrace/sdk
```

## Quick Start

Stream a live response from an AI assistant:

```typescript
import { ImbraceClient } from "@imbrace/sdk"

const client = new ImbraceClient({
  accessToken: "your-access-token",
  gateway: "https://app-gatewayv2.imbrace.co",
})

const response = await client.aiAgent.streamChat({
  assistant_id: "asst_xxx",
  organization_id: "org_xxx",
  messages: [{ role: "user", content: "What deals closed this quarter?" }],
  // id (session) and user_id are optional — the SDK manages them automatically
})

const reader = response.body!.getReader()
const decoder = new TextDecoder()

while (true) {
  const { done, value } = await reader.read()
  if (done) break
  const text = decoder.decode(value)
  for (const line of text.split("\n")) {
    if (!line.startsWith("data: ")) continue
    const raw = line.slice(6).trim()
    if (raw === "[DONE]") break
    try {
      const event = JSON.parse(raw)
      if (event.type === "text-delta") process.stdout.write(event.textDelta)
    } catch {}
  }
}
```

## Authentication

```typescript
// Access token — for user-facing apps
const client = new ImbraceClient({ accessToken: "acc_xxx" })

// API key — for server-to-server integrations
const client = new ImbraceClient({ apiKey: "sk-xxx" })
```

## Error Handling

```typescript
import { AuthError, ApiError, NetworkError } from "@imbrace/sdk"

try {
  await client.aiAgent.streamChat({ ... })
} catch (e) {
  if (e instanceof AuthError)    console.error("Invalid credentials")
  if (e instanceof ApiError)     console.error(`[${e.statusCode}] ${e.message}`)
  if (e instanceof NetworkError) console.error("Gateway unreachable")
}
```

## Documentation

Full reference: **[imbraceltd.github.io/api-sdk](https://imbraceltd.github.io/api-sdk/typescript/resources/)**
