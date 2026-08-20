# Integrations

Framework-level wiring patterns for both SDKs. Pick the section for your stack — TypeScript covers React, Next.js, and plain Node.js; Python covers FastAPI, asyncio, Django, and Celery. The OTP login flow is documented for both.

For credential strategy (api key vs access token, env vars), see [Authentication](/sdk/authentication.md) and [Setup Guide](/getting-started/setup.md#configure-credentials).

---

## React (TypeScript)

### Singleton client

Create the client once outside the component tree and reuse it across all components. The `localStorage` token comes from the [OTP login flow](/sdk/authentication.md#otp-login-flow).

```typescript
// lib/imbrace.ts
import { ImbraceClient } from "@imbrace/sdk";

export const client = new ImbraceClient({
  accessToken:
    typeof window !== "undefined"
      ? (localStorage.getItem("imbrace_token") ?? undefined)
      : undefined,
});
```

### Data-fetching hook

```tsx
// hooks/useContacts.ts
import { useState, useEffect } from "react";
import { client } from "@/lib/imbrace";
import type { Contact } from "@imbrace/sdk";

export function useContacts(search?: string) {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    setLoading(true);
    client.contacts
      .list({ search })
      .then((res) => setContacts(res.data))
      .catch(setError)
      .finally(() => setLoading(false));
  }, [search]);

  return { contacts, loading, error };
}
```

```tsx
// components/ContactList.tsx
import { useContacts } from "@/hooks/useContacts";

export function ContactList() {
  const { contacts, loading, error } = useContacts();
  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error: {error.message}</p>;
  return (
    <ul>
      {contacts.map((c) => (
        <li key={c._id}>{c.name}</li>
      ))}
    </ul>
  );
}
```

---

## Next.js (TypeScript)

### API route (App Router)

```typescript
// app/api/contacts/route.ts
import { NextResponse } from "next/server";
import { ImbraceClient } from "@imbrace/sdk";

const client = new ImbraceClient({
  apiKey: process.env.IMBRACE_API_KEY,
});

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search") ?? undefined;
  const { data } = await client.contacts.list({ search });
  return NextResponse.json(data);
}
```

`process.env.IMBRACE_API_KEY` should be set the way your deployment platform expects (Vercel env var, `.env.local` for dev, etc.). See [Setup Guide → Configure credentials](/getting-started/setup.md#configure-credentials).

### Server component (App Router)

```tsx
// app/contacts/page.tsx
import { ImbraceClient } from "@imbrace/sdk";

const client = new ImbraceClient({
  apiKey: process.env.IMBRACE_API_KEY,
});

export default async function ContactsPage() {
  const { data: contacts } = await client.contacts.list({ limit: 20 });
  return (
    <main>
      <h1>Contacts</h1>
      <ul>{contacts.map((c) => <li key={c._id}>{c.name}</li>)}</ul>
    </main>
  );
}
```

---

## Node.js CLI script (TypeScript)

For one-shot scripts (data exports, backfills, ad-hoc queries):

```typescript
// scripts/export-contacts.ts
import { ImbraceClient } from "@imbrace/sdk";
import { writeFileSync } from "fs";

const client = new ImbraceClient();

async function exportContacts() {
  const { data: contacts } = await client.contacts.list({ limit: 1000 });
  writeFileSync("contacts.json", JSON.stringify(contacts, null, 2));
  console.log(`Exported ${contacts.length} contacts`);
}

exportContacts().catch(console.error);
```

```bash
npx ts-node scripts/export-contacts.ts
```

---

## FastAPI (Python)

### Per-request dependency injection

The simplest pattern — one async client per request, lifetime managed by the dependency:

```python
from fastapi import FastAPI, Depends
from imbrace import AsyncImbraceClient
from imbrace.types.ai import CompletionInput, CompletionMessage

app = FastAPI()

async def get_imbrace() -> AsyncImbraceClient:
    async with AsyncImbraceClient() as client:
        yield client

@app.get("/contacts")
async def list_contacts(client: AsyncImbraceClient = Depends(get_imbrace)):
    result = await client.contacts.list({"limit": 20})
    return result["data"]

@app.get("/contacts/{contact_id}")
async def get_contact(contact_id: str, client: AsyncImbraceClient = Depends(get_imbrace)):
    return await client.contacts.get(contact_id)

@app.post("/ai/chat")
async def chat(message: str, client: AsyncImbraceClient = Depends(get_imbrace)):
    return await client.ai.complete(CompletionInput(
        model="gpt-4o",
        messages=[CompletionMessage(role="user", content=message)],
    ))
```

### Global singleton (better connection reuse)

For higher throughput, share one client for the application's lifetime:

```python
from contextlib import asynccontextmanager
from fastapi import FastAPI
from imbrace import AsyncImbraceClient

imbrace: AsyncImbraceClient = None  # type: ignore

@asynccontextmanager
async def lifespan(app: FastAPI):
    global imbrace
    imbrace = AsyncImbraceClient()
    await imbrace.init()  # health check on startup
    yield
    await imbrace.close()

app = FastAPI(lifespan=lifespan)

@app.get("/me")
async def get_me():
    return await imbrace.platform.get_me()
```

---

## asyncio (Python)

### Concurrent requests

```python
import asyncio
from imbrace import AsyncImbraceClient

async def fetch_dashboard_data():
    async with AsyncImbraceClient() as client:
        me, contacts, channels = await asyncio.gather(
            client.platform.get_me(),
            client.contacts.list({"limit": 5}),
            client.channel.list(type="group"),
        )
        return {
            "user": me,
            "contacts": contacts["data"],
            "channels": channels.data,
        }

data = asyncio.run(fetch_dashboard_data())
```

### Streaming AI

```python
import asyncio
from imbrace import AsyncImbraceClient
from imbrace.types.ai import CompletionInput, CompletionMessage

async def stream_response():
    async with AsyncImbraceClient() as client:
        async for chunk in client.ai.stream(CompletionInput(
            model="gpt-4o",
            messages=[CompletionMessage(role="user", content="Explain async/await in Python.")],
        )):
            content = chunk.choices[0].delta.content or ""
            print(content, end="", flush=True)

asyncio.run(stream_response())
```

---

## Django (Python)

### Synchronous view

```python
# views.py
from django.http import JsonResponse
from imbrace import ImbraceClient, ApiError

def contact_list(request):
    with ImbraceClient() as client:
        try:
            result = client.contacts.list({
                "search": request.GET.get("search"),
                "page": int(request.GET.get("page", 1)),
            })
            return JsonResponse(result)
        except ApiError as e:
            return JsonResponse({"error": str(e)}, status=e.status_code)
```

### Settings integration

```python
# settings.py
IMBRACE_API_KEY = env("IMBRACE_API_KEY")
IMBRACE_ENV = env("IMBRACE_ENV", default="stable")

# utils/imbrace.py
from django.conf import settings
from imbrace import ImbraceClient

def get_client() -> ImbraceClient:
    return ImbraceClient(
        api_key=settings.IMBRACE_API_KEY,
        env=settings.IMBRACE_ENV,
    )
```

---

## Celery (Python)

For background-task workers, use the sync client and create one inside each task:

```python
# tasks.py
from celery import Celery
from imbrace import ImbraceClient, NetworkError

app = Celery("tasks")

@app.task(bind=True, max_retries=3)
def sync_contacts(self):
    try:
        with ImbraceClient() as client:
            result = client.contacts.list({"limit": 100})
            for contact in result["data"]:
                save_to_db(contact)
    except NetworkError as exc:
        raise self.retry(exc=exc, countdown=2 ** self.request.retries)
```

Don't share a single `ImbraceClient` instance across Celery workers — create one per task invocation using the context manager. The httpx connection pool is not safe to share across processes.

---

## OTP login flow

The OTP flow is identical conceptually in both SDKs: request an OTP for an email, then exchange it for an access token. See [Authentication → OTP login flow](/sdk/authentication.md#otp-login-flow) for the full credential lifecycle.

**TypeScript**

```tsx
// components/LoginForm.tsx
import { useState } from "react";
import { ImbraceClient, AuthError } from "@imbrace/sdk";

const client = new ImbraceClient();

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState<"email" | "otp">("email");

  async function requestOtp() {
    await client.requestOtp(email);
    setStep("otp");
  }

  async function verifyOtp() {
    try {
      await client.loginWithOtp(email, otp);
      window.location.href = "/dashboard";
    } catch (e) {
      if (e instanceof AuthError) alert("Invalid OTP");
    }
  }

  return step === "email" ? (
    <div>
      <input value={email} onChange={(e) => setEmail(e.target.value)} />
      <button onClick={requestOtp}>Send OTP</button>
    </div>
  ) : (
    <div>
      <input value={otp} onChange={(e) => setOtp(e.target.value)} />
      <button onClick={verifyOtp}>Verify</button>
    </div>
  );
}
```

**Python**

```python
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from imbrace import AsyncImbraceClient, AuthError

app = FastAPI()

class OtpRequest(BaseModel):
    email: str

class OtpVerify(BaseModel):
    email: str
    otp: str

@app.post("/auth/request-otp")
async def request_otp(body: OtpRequest):
    async with AsyncImbraceClient() as client:
        await client.auth.signin_email_request(body.email)
    return {"message": "OTP sent"}

@app.post("/auth/verify-otp")
async def verify_otp(body: OtpVerify):
    async with AsyncImbraceClient() as client:
        try:
            result = await client.auth.signin_with_email(body.email, body.otp)
            return {"access_token": result["token"]}
        except AuthError:
            raise HTTPException(status_code=401, detail="Invalid OTP")
```
