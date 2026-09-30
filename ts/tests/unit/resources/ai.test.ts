import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { AiResource } from "../../../src/resources/ai.js"
import { HttpTransport } from "../../../src/http.js"
import { TokenManager } from "../../../src/auth/token-manager.js"

const BASE = "https://app-gatewayv2.imbrace.co"
const MESSAGES = [{ role: "user" as const, content: "Hello" }]

function makeResource() {
  const http = new HttpTransport({ timeout: 5000, tokenManager: new TokenManager() })
  return new AiResource(http, BASE)
}

function mockFetch(data: unknown, status = 200) {
  globalThis.fetch = vi.fn().mockResolvedValue(
    new Response(JSON.stringify(data), { status })
  )
}

describe("AiResource", () => {
  let originalFetch: typeof fetch

  beforeEach(() => { originalFetch = globalThis.fetch })
  afterEach(() => { globalThis.fetch = originalFetch })

  describe("complete()", () => {
    it("POSTs to /ai/completions with stream=false", async () => {
      const payload = { id: "cmpl_1", model: "gpt-4o", choices: [] }
      mockFetch(payload)

      const res = await makeResource().complete({ model: "gpt-4o", messages: MESSAGES })
      expect(res.id).toBe("cmpl_1")

      const init = vi.mocked(globalThis.fetch).mock.calls[0][1]!
      expect(init.method).toBe("POST")
      const body = JSON.parse(init.body as string)
      expect(body.stream).toBe(false)
      expect(body.model).toBe("gpt-4o")
    })

    it("passes temperature and maxTokens", async () => {
      mockFetch({ id: "cmpl_2" })
      await makeResource().complete({ model: "gpt-4o", messages: MESSAGES, temperature: 0.5, maxTokens: 256 })
      const body = JSON.parse(vi.mocked(globalThis.fetch).mock.calls[0][1]!.body as string)
      expect(body.temperature).toBe(0.5)
      expect(body.maxTokens).toBe(256)
    })
  })

  describe("embed()", () => {
    it("POSTs to /ai/embeddings", async () => {
      const payload = { model: "text-embedding-3-small", data: [{ index: 0, embedding: [0.1, 0.2] }] }
      mockFetch(payload)

      const res = await makeResource().embed({ model: "text-embedding-3-small", input: ["hello"] })
      expect(res.data[0].embedding).toEqual([0.1, 0.2])

      const init = vi.mocked(globalThis.fetch).mock.calls[0][1]!
      expect(init.method).toBe("POST")
      const body = JSON.parse(init.body as string)
      expect(body.input).toEqual(["hello"])
    })
  })

  describe("stream()", () => {
    it("yields parsed SSE chunks and stops at [DONE]", async () => {
      const chunks = [
        { id: "c1", model: "gpt-4o", choices: [{ index: 0, delta: { content: "Hello" } }] },
        { id: "c2", model: "gpt-4o", choices: [{ index: 0, delta: { content: " world" } }] },
      ]
      const sseBody = chunks.map(c => `data: ${JSON.stringify(c)}`).join("\n") + "\ndata: [DONE]\n"

      const encoder = new TextEncoder()
      const stream = new ReadableStream({
        start(controller) {
          controller.enqueue(encoder.encode(sseBody))
          controller.close()
        },
      })

      globalThis.fetch = vi.fn().mockResolvedValue(new Response(stream, { status: 200 }))

      const collected: unknown[] = []
      for await (const chunk of makeResource().stream({ model: "gpt-4o", messages: MESSAGES })) {
        collected.push(chunk)
      }

      expect(collected).toHaveLength(2)
      expect((collected[0] as typeof chunks[0]).id).toBe("c1")
      expect((collected[1] as typeof chunks[1]).id).toBe("c2")
    })
  })

  describe("listProviders()", () => {
    it("hits /v3/ai/providers and returns raw array", async () => {
      mockFetch([
        {
          _id: "p1", name: "test", type: "vllm",
          config: { vllm: { host: "http://x" } },
          source: "custom", is_shown: true,
          models: [{ name: "qwen3.5-27b", provider: "vllm", is_vision_available: false }],
          provider_id: "p1-uuid",
          organization_id: "org_x",
        },
      ])
      const res = await makeResource().listProviders()
      const url = vi.mocked(globalThis.fetch).mock.calls[0][0]
      expect(String(url)).toBe(`${BASE}/v3/ai/providers`)
      expect(Array.isArray(res)).toBe(true)
      expect(res).toHaveLength(1)
      expect(res[0].name).toBe("test")
      expect(res[0].models?.[0].name).toBe("qwen3.5-27b")
    })
  })

  describe("getLlmModels()", () => {
    it("hits /v3/ai/workflow-agent/models with wrapped {success, data}", async () => {
      mockFetch({
        success: true,
        message: "Models retrieved successfully",
        data: [
          { name: "Default", is_toolCall_available: true, is_vision_available: true },
        ],
      })
      const res = await makeResource().getLlmModels()
      const url = vi.mocked(globalThis.fetch).mock.calls[0][0]
      expect(String(url)).toBe(`${BASE}/v3/ai/workflow-agent/models`)
      expect(res.success).toBe(true)
      expect(res.data).toHaveLength(1)
      expect(res.data[0].name).toBe("Default")
      expect(res.data[0].is_vision_available).toBe(true)
    })
  })
})

// /v2/ai was retired; the "V2" methods now use chat-ai /v3/ai.
describe("AiResource — V2 methods on /v3/ai", () => {
  let originalFetch: typeof fetch
  beforeEach(() => { originalFetch = globalThis.fetch })
  afterEach(() => { globalThis.fetch = originalFetch })
  const calledUrl = (i = 0) => new URL(String(vi.mocked(globalThis.fetch).mock.calls[i][0]))
  const calledInit = (i = 0) => vi.mocked(globalThis.fetch).mock.calls[i][1]!

  it("listAiAgentsV2() calls /v3/ai/assistants and wraps the array as { data }", async () => {
    mockFetch([{ id: "a_1" }, { id: "a_2" }])
    const res = await makeResource().listAiAgentsV2()
    expect(calledUrl().pathname).toBe("/v3/ai/assistants")
    expect(res.data).toHaveLength(2)
  })

  it.each([
    ["createAiAgentV2", (r: AiResource) => r.createAiAgentV2({}), "POST", "/v3/ai/assistants"],
    ["updateAiAgentV2", (r: AiResource) => r.updateAiAgentV2("a_1", {}), "PUT", "/v3/ai/assistants/a_1"],
    ["deleteAiAgentV2", (r: AiResource) => r.deleteAiAgentV2("a_1"), "DELETE", "/v3/ai/assistants/a_1"],
    ["createAiAgentAppV2", (r: AiResource) => r.createAiAgentAppV2({}), "POST", "/v3/ai/assistant_apps"],
  ])("%s() uses %s %s", async (_n, call, method, path) => {
    mockFetch({})
    await call(makeResource())
    expect(calledInit().method).toBe(method)
    expect(calledUrl().pathname).toBe(path)
  })
})
