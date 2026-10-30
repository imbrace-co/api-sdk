import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { AiAgentResource } from "../../../src/resources/ai-agent.js"
import { HttpTransport } from "../../../src/http.js"
import { TokenManager } from "../../../src/auth/token-manager.js"
import { ImbraceError, NetworkError } from "../../../src/errors.js"

const BASE = "https://app-gatewayv2.imbrace.co/ai-agent"

function makeResource() {
  const http = new HttpTransport({ apiKey: "test_key", timeout: 5000, tokenManager: new TokenManager(), organizationId: "org_1" })
  return new AiAgentResource(http, BASE)
}

function mockFetch(data: unknown, status = 200) {
  globalThis.fetch = vi.fn().mockResolvedValue(
    new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json" } }),
  )
}

function mockStream(events: string[]) {
  globalThis.fetch = vi.fn().mockImplementation(async (input: RequestInfo | URL) => {
    if (String(input).endsWith("/chat-client/auth/user")) return new Response(JSON.stringify({ id: "u_1" }))
    return new Response(events.map(e => `data: ${e}\n`).join(""), { headers: { "Content-Type": "text/event-stream" } })
  })
}

describe("AiAgentResource", () => {
  let originalFetch: typeof fetch
  beforeEach(() => { originalFetch = globalThis.fetch })
  afterEach(() => { globalThis.fetch = originalFetch })
  const calledUrl = (i = 0) => new URL(String(vi.mocked(globalThis.fetch).mock.calls[i][0]))

  it("listChats() / getChat() / deleteChat() use the chat-client store", async () => {
    mockFetch({ chats: [], hasMore: false })
    await makeResource().listChats({ limit: 5 })
    expect(calledUrl().pathname).toBe("/ai-agent/chat-client/chats")
    expect(calledUrl().searchParams.get("organization_id")).toBe("org_1")
    mockFetch({})
    await makeResource().getChat("c_1")
    expect(calledUrl().pathname).toBe("/ai-agent/chat-client/chats/c_1")
    mockFetch({})
    await makeResource().deleteChat("c_1")
    expect(calledUrl().pathname).toBe("/ai-agent/chat-client/chats/c_1")
    expect(vi.mocked(globalThis.fetch).mock.calls[0][1]?.method).toBe("DELETE")
  })

  it("streamChat() and streamSubAgentChat() wire the caller's signal into every request", async () => {
    mockStream([])
    const ac = new AbortController()
    await makeResource().streamChat({ assistant_id: "a_1", messages: [] }, { signal: ac.signal })
    await makeResource().streamSubAgentChat({ assistant_id: "a_1", session_id: "s", chat_id: "c", messages: [] }, { signal: ac.signal })
    const signals = vi.mocked(globalThis.fetch).mock.calls.map(([, init]) => init?.signal)
    // user lookup + /v2/chat + /v2/sub-agent-chat
    expect(signals).toHaveLength(3)
    ac.abort()
    expect(signals.every(s => s?.aborted)).toBe(true)
    expect(JSON.parse(String(vi.mocked(globalThis.fetch).mock.calls[1][1]?.body))).not.toHaveProperty("signal")
  })

  it("streamChatText() stops when its signal aborts", async () => {
    mockStream([JSON.stringify({ type: "text-delta", delta: "a" })])
    const ac = new AbortController()
    ac.abort()
    const chunks = makeResource().streamChatText({ assistant_id: "a_1", user_id: "u", messages: [] }, { signal: ac.signal })
    await expect(chunks[Symbol.asyncIterator]().next()).rejects.toThrow("Request aborted by user")
    expect(globalThis.fetch).not.toHaveBeenCalled()
  })

  it("streamChatText() throws NetworkError when aborted mid-stream", async () => {
    globalThis.fetch = vi.fn().mockImplementation(async (_input: RequestInfo | URL, init?: RequestInit) => {
      const body = new ReadableStream<Uint8Array>({
        start(controller) {
          controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({ type: "text-delta", delta: "a" })}\n`))
          init?.signal?.addEventListener("abort", () => controller.error(new DOMException("aborted", "AbortError")))
        },
      })
      return new Response(body, { headers: { "Content-Type": "text/event-stream" } })
    })
    const ac = new AbortController()
    const chunks = makeResource().streamChatText({ assistant_id: "a_1", user_id: "u", messages: [] }, { signal: ac.signal })[Symbol.asyncIterator]()
    expect((await chunks.next()).value).toBe("a")
    ac.abort()
    const err = await chunks.next().catch((e: unknown) => e)
    expect(err).toBeInstanceOf(NetworkError)
    expect((err as Error).message).toBe("Request aborted by user")
  })

  it("streamChatText() yields text deltas", async () => {
    mockStream(['{"type":"start"}', '{"type":"text-delta","id":"0","delta":"Hel"}', '{"type":"text-delta","id":"0","delta":"lo"}', "[DONE]"])
    let out = ""
    for await (const c of makeResource().streamChatText({ assistant_id: "a_1", messages: [] })) out += c
    expect(out).toBe("Hello")
  })

  it("streamChatText() throws on a server error event instead of yielding nothing", async () => {
    mockStream(['{"type":"start"}', '{"type":"error","errorText":"The provided model identifier is invalid."}', "[DONE]"])
    const run = async () => { for await (const _ of makeResource().streamChatText({ assistant_id: "a_1", messages: [] })) { /* drain */ } }
    await expect(run()).rejects.toThrow(ImbraceError)
    await expect(run()).rejects.toThrow("model identifier is invalid")
  })

  it.each([
    ["processEmbedding", (r: AiAgentResource) => r.processEmbedding({ fileId: "f" })],
    ["listEmbeddingFiles", (r: AiAgentResource) => r.listEmbeddingFiles()],
    ["getEmbeddingFile", (r: AiAgentResource) => r.getEmbeddingFile("f")],
    ["previewEmbeddingFile", (r: AiAgentResource) => r.previewEmbeddingFile()],
    ["updateEmbeddingFileStatus", (r: AiAgentResource) => r.updateEmbeddingFileStatus("f", "done")],
    ["deleteEmbeddingFile", (r: AiAgentResource) => r.deleteEmbeddingFile("f")],
    ["classifyFile", (r: AiAgentResource) => r.classifyFile()],
  ])("%s() is retired and makes no request", async (name, call) => {
    globalThis.fetch = vi.fn()
    await expect(call(makeResource())).rejects.toThrow(`aiAgent.${name}() is no longer available`)
    expect(globalThis.fetch).not.toHaveBeenCalled()
  })
})
