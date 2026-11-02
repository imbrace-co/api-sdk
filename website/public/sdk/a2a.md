# Agent-to-Agent (A2A)

A2A is an open protocol for one agent to delegate work to another: the caller reads the callee's **Agent Card** to learn what it can do, then sends it a task over JSON-RPC and gets the answer back. The SDK speaks protocol version `0.3.0` and supports both directions.

- **`a2a` — this org's agents.** List them, read their cards, and run one to a final answer. Needs an initialized client (see [Installation](/sdk/installation.md)).
- **`A2AClient` — any agent, anywhere.** A standalone client for an agent that is not on this platform: an iMBrace agent in another organization, or a third-party agent entirely. It holds no iMBrace credential, so pointing it at an outside host cannot leak your platform token.

A2A call is one **blocking** turn: unlike [`aiAgent.streamChat`](/sdk/ai-agent.md), it returns only when the agent has finished. A remote agent runs a full tool-using loop, so allow a minute or more.

---

## Listing your agents — `client.a2a`

Each entry carries the two URLs a peer needs: `url` (the JSON-RPC endpoint) and `cardUrl`.

**TypeScript**

```typescript
const agents = await client.a2a.listAgents();
// [{ id, name, url, cardUrl }, ...]

const card = await client.a2a.getAgentCard(agents[0].id);
console.log(card.name, card.skills?.map(s => s.name));
```

**Python**

```python
agents = client.a2a.list_agents()
card = client.a2a.get_agent_card(agents[0]["id"])
print(card["name"], [s["name"] for s in card.get("skills", [])])
```

## Running an agent

`ask()` returns the answer text. `sendMessage()` / `send_message()` returns the raw A2A Task if you need its status, artifacts or `contextId`.

**TypeScript**

```typescript
const answer = await client.a2a.ask(agentId, "Summarise this week's open deals");

const task = await client.a2a.sendMessage(agentId, "And the closed ones?", {
  contextId: previousTask.contextId,   // continue the same A2A context
});
console.log(task.status.state);        // "completed"
```

**Python**

```python
answer = client.a2a.ask(agent_id, "Summarise this week's open deals")

task = client.a2a.send_message(agent_id, "And the closed ones?", context_id=previous_task["contextId"])
print(task["status"]["state"])
```

Both clients expose the same surface on `AsyncImbraceClient` with `await`.

## Letting another agent call yours

Hand the peer two things: the agent's `url` from `listAgents()`, and an API key scoped to your org — `client.apiKeys.create({ expirationDays: 7 })`. The key goes in the `x-access-token` or `x-api-key` header; your agent's card advertises this under `securitySchemes`.

Treat the key like any other credential: it carries your organization's permissions, it is shown once, and it should be given its shortest useful expiry.

---

## Calling an agent outside iMBrace — `A2AClient`

Give it a URL (the agent base or its card URL) and, if the agent wants one, a key. The key is sent as both `x-api-key` and `Authorization: Bearer`, since agents differ on which they read; `headers` covers anything else its card names.

**TypeScript**

```typescript
import { A2AClient } from "@imbrace/sdk";

const reviewer = new A2AClient({
  url: "https://reviewer.example.com",
  apiKey: process.env.REVIEWER_KEY,
  timeoutMs: 120_000,                  // default
});

console.log((await reviewer.listSkills()).map(s => s.name));
const verdict = await reviewer.ask("Review the diff on branch feat/checkout");
```

**Python**

```python
from imbrace import A2AClient

reviewer = A2AClient("https://reviewer.example.com", api_key=os.environ["REVIEWER_KEY"])
print([s["name"] for s in reviewer.list_skills()])
verdict = reviewer.ask("Review the diff on branch feat/checkout")
```

Use `AsyncA2AClient` for the async variant. The card is fetched once and cached; pass `refresh=True` / `getCard(true)` to re-read it.

### Checking an agent is reachable

`discover()` probes a remote card **from the platform**, so it answers a question a probe from your own machine cannot: whether iMBrace itself can reach that agent. Use it before wiring a remote agent into one of your own.

```typescript
const probe = await client.a2a.discover("https://reviewer.example.com", process.env.REVIEWER_KEY);
if (!probe.healthy) throw new Error("iMBrace cannot reach that agent");
```

```python
probe = client.a2a.discover("https://reviewer.example.com", os.environ["REVIEWER_KEY"])
```

---

## Reading a result yourself

`ask()` is `sendMessage()` plus `extractA2AText()`, which reads the task's status message, then its artifacts. Call it directly when you have a task from elsewhere:

```typescript
import { extractA2AText } from "@imbrace/sdk";
const text = extractA2AText(task);
```

```python
from imbrace import extract_a2a_text
text = extract_a2a_text(task)
```

## Limits

- **Text only.** The SDK sends and reads text parts; file and data parts are not handled.
- **No streaming.** A2A streaming (`message/stream`) and push notifications are not supported — the cards this platform publishes declare `streaming: false`. For token-by-token output from your own agents, use [`aiAgent.streamChat`](/sdk/ai-agent.md).
- **One method.** `message/send` only; there is no `tasks/get` polling, so an agent that returns a `submitted` task and finishes later cannot be followed up.
- **Bearer and header API keys only.** An agent whose card requires OAuth2 or OIDC is not supported.

## Errors

A JSON-RPC error from the agent, a non-2xx card fetch, and a malformed card all raise `ImbraceError`. See [Error Handling](/sdk/error-handling.md).

```typescript
import { ImbraceError } from "@imbrace/sdk";

try {
  await reviewer.ask("...");
} catch (e) {
  if (e instanceof ImbraceError) console.error(e.message);
}
```
