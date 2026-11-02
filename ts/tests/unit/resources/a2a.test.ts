import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { A2AResource, A2AClient, extractA2AText, agentCardUrl } from "../../../src/resources/a2a.js"
import { HttpTransport } from "../../../src/http.js"
import { TokenManager } from "../../../src/auth/token-manager.js"
import { ImbraceError } from "../../../src/errors.js"

const BASE = "https://app-gatewayv2.imbrace.co/ai-agent"
const AGENT_ID = "6100fbba-6312-474d-b2f5-e7cf655c3215"

function makeResource() {
  const http = new HttpTransport({ apiKey: "test_key", timeout: 5000, tokenManager: new TokenManager() })
  return new A2AResource(http, BASE)
}

function mockFetch(...responses: unknown[]) {
  const fn = vi.fn()
  for (const data of responses) {
    fn.mockResolvedValueOnce(
      new Response(JSON.stringify(data), { status: 200, headers: { "Content-Type": "application/json" } }),
    )
  }
  globalThis.fetch = fn
  return fn
}

const completedTask = (text: string) => ({
  jsonrpc: "2.0",
  id: "1",
  result: {
    id: "task_1",
    kind: "task",
    status: { state: "completed", message: { role: "agent", kind: "message", messageId: "m", parts: [{ kind: "text", text }] } },
  },
})

const CARD = {
  protocolVersion: "0.3.0",
  name: "QA Test Agent",
  url: `${BASE}/a2a/agents/${AGENT_ID}`,
  skills: [{ id: "chat", name: "General assistance" }],
}

describe("A2AResource", () => {
  let originalFetch: typeof fetch
  beforeEach(() => { originalFetch = globalThis.fetch })
  afterEach(() => { globalThis.fetch = originalFetch })

  it("listAgents() unwraps the { data: { agents } } envelope", async () => {
    const agents = [{ id: AGENT_ID, name: "QA Test Agent", url: "u", cardUrl: "c" }]
    const fetchMock = mockFetch({ success: true, data: { agents } })
    const res = await makeResource().listAgents()
    expect(new URL(fetchMock.mock.calls[0][0] as string).pathname).toBe("/ai-agent/a2a/agents")
    expect(res).toEqual(agents)
  })

  it("getAgentCard() reads the well-known card path", async () => {
    const fetchMock = mockFetch(CARD)
    const card = await makeResource().getAgentCard(AGENT_ID)
    expect(new URL(fetchMock.mock.calls[0][0] as string).pathname).toBe(
      `/ai-agent/a2a/agents/${AGENT_ID}/.well-known/agent-card.json`,
    )
    expect(card.name).toBe("QA Test Agent")
  })

  it("sendMessage() POSTs a JSON-RPC message/send and unwraps result", async () => {
    const fetchMock = mockFetch(completedTask("hello"))
    const task = await makeResource().sendMessage(AGENT_ID, "hi there")
    const [url, init] = fetchMock.mock.calls[0]
    expect(new URL(url as string).pathname).toBe(`/ai-agent/a2a/agents/${AGENT_ID}`)
    expect((init as RequestInit)?.method).toBe("POST")
    const body = JSON.parse((init as RequestInit)?.body as string)
    expect(body.jsonrpc).toBe("2.0")
    expect(body.method).toBe("message/send")
    expect(body.params.message.parts).toEqual([{ kind: "text", text: "hi there" }])
    expect((task as any).kind).toBe("task")
  })

  it("ask() returns the answer text", async () => {
    mockFetch(completedTask("A2A OK"))
    expect(await makeResource().ask(AGENT_ID, "ping")).toBe("A2A OK")
  })

  it("sendMessage() turns a JSON-RPC error into an ImbraceError", async () => {
    mockFetch({ jsonrpc: "2.0", id: "1", error: { code: -32601, message: "Method not found" } })
    await expect(makeResource().sendMessage(AGENT_ID, "ping")).rejects.toThrow(ImbraceError)
  })

  it("discover() posts the url and unwraps data", async () => {
    const fetchMock = mockFetch({ success: true, data: { healthy: true, name: "Claude Code" } })
    const res = await makeResource().discover("https://cc-a2a.example.com", "secret")
    const [url, init] = fetchMock.mock.calls[0]
    expect(new URL(url as string).pathname).toBe("/ai-agent/a2a/discover")
    expect(JSON.parse((init as RequestInit)?.body as string)).toEqual({
      url: "https://cc-a2a.example.com",
      key: "secret",
    })
    expect(res.healthy).toBe(true)
  })
})

describe("A2AClient", () => {
  it("derives the card URL from an agent base URL", () => {
    expect(agentCardUrl("https://a.example.com/agents/x/")).toBe(
      "https://a.example.com/agents/x/.well-known/agent-card.json",
    )
    expect(agentCardUrl("https://a.example.com/card.json")).toBe("https://a.example.com/card.json")
  })

  it("sends the key as both x-api-key and Bearer, and POSTs to card.url", async () => {
    const fetchImpl = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify(CARD), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify(completedTask("from the remote")), { status: 200 }))

    const client = new A2AClient({ url: "https://cc-a2a.example.com", apiKey: "k1", fetch: fetchImpl as any })
    expect(await client.ask("review this diff")).toBe("from the remote")

    const cardHeaders = new Headers(fetchImpl.mock.calls[0][1]?.headers)
    expect(fetchImpl.mock.calls[0][0]).toBe("https://cc-a2a.example.com/.well-known/agent-card.json")
    expect(cardHeaders.get("x-api-key")).toBe("k1")
    expect(cardHeaders.get("authorization")).toBe("Bearer k1")
    expect(fetchImpl.mock.calls[1][0]).toBe(CARD.url)
  })

  it("never attaches a credential when none was given", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(new Response(JSON.stringify(CARD), { status: 200 }))
    await new A2AClient({ url: "https://a.example.com", fetch: fetchImpl as any }).getCard()
    const headers = new Headers(fetchImpl.mock.calls[0][1]?.headers)
    expect(headers.get("x-api-key")).toBeNull()
    expect(headers.get("authorization")).toBeNull()
  })

  it("rejects a non-2xx card fetch", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(new Response("nope", { status: 401 }))
    await expect(
      new A2AClient({ url: "https://a.example.com", fetch: fetchImpl as any }).getCard(),
    ).rejects.toThrow(/HTTP 401/)
  })

  it("caches the card across calls", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(new Response(JSON.stringify(CARD), { status: 200 }))
    const client = new A2AClient({ url: "https://a.example.com", fetch: fetchImpl as any })
    await client.getCard()
    await client.listSkills()
    expect(fetchImpl).toHaveBeenCalledTimes(1)
  })
})

describe("extractA2AText", () => {
  it("prefers the status message", () => {
    expect(extractA2AText(completedTask("primary").result)).toBe("primary")
  })

  it("falls back to artifacts", () => {
    expect(
      extractA2AText({ kind: "task", status: { state: "completed" }, artifacts: [{ parts: [{ kind: "text", text: "from artifact" }] }] }),
    ).toBe("from artifact")
  })

  it("reads a bare Message", () => {
    expect(extractA2AText({ kind: "message", parts: [{ kind: "text", text: "msg" }] })).toBe("msg")
  })
})
