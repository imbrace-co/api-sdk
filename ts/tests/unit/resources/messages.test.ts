import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { MessagesResource } from "../../../src/resources/messages.js"
import { HttpTransport } from "../../../src/http.js"
import { TokenManager } from "../../../src/auth/token-manager.js"

const BASE = "https://app-gatewayv2.imbrace.co"

function makeResource() {
  const http = new HttpTransport({ apiKey: "test_key", timeout: 5000, tokenManager: new TokenManager() })
  return new MessagesResource(http, BASE)
}

function mockFetch(data: unknown, status = 200) {
  globalThis.fetch = vi.fn().mockResolvedValue(
    new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json" } })
  )
}

describe("MessagesResource", () => {
  let originalFetch: typeof fetch
  beforeEach(() => { originalFetch = globalThis.fetch })
  afterEach(() => { globalThis.fetch = originalFetch })

  it("list() calls GET /v1/conversation_messages", async () => {
    mockFetch({ data: [{ id: "msg_1", type: "text" }] })
    const res = await makeResource().list()
    const url = new URL((vi.mocked(globalThis.fetch).mock.calls[0][0] as string))
    expect(url.pathname).toBe("/v1/conversation_messages")
    expect(vi.mocked(globalThis.fetch).mock.calls[0][1]?.method).toBe("GET")
    expect(res.data[0].id).toBe("msg_1")
  })

  it("list() passes pagination params", async () => {
    mockFetch({ data: [] })
    await makeResource().list({ limit: 20, skip: 10 })
    const url = new URL((vi.mocked(globalThis.fetch).mock.calls[0][0] as string))
    expect(url.searchParams.get("limit")).toBe("20")
    expect(url.searchParams.get("skip")).toBe("10")
  })

  it("send() calls POST /v1/conversation_messages with text body", async () => {
    mockFetch({ id: "msg_new", type: "text" })
    const res = await makeResource().send({ type: "text", text: "Hello!" })
    const url = new URL((vi.mocked(globalThis.fetch).mock.calls[0][0] as string))
    expect(url.pathname).toBe("/v1/conversation_messages")
    expect(vi.mocked(globalThis.fetch).mock.calls[0][1]?.method).toBe("POST")
    const body = JSON.parse(vi.mocked(globalThis.fetch).mock.calls[0][1]?.body as string)
    expect(body.type).toBe("text")
    expect(body.text).toBe("Hello!")
    expect(res.type).toBe("text")
  })

  it("send() supports image type with url and caption", async () => {
    mockFetch({ id: "msg_2" })
    await makeResource().send({ type: "image", url: "http://img.url", caption: "Photo" })
    const body = JSON.parse(vi.mocked(globalThis.fetch).mock.calls[0][1]?.body as string)
    expect(body.type).toBe("image")
    expect(body.url).toBe("http://img.url")
    expect(body.caption).toBe("Photo")
  })

  it("sends x-api-key header", async () => {
    mockFetch({})
    await makeResource().list()
    const headers = new Headers(vi.mocked(globalThis.fetch).mock.calls[0][1]?.headers as HeadersInit)
    expect(headers.get("x-api-key")).toBe("test_key")
  })
})
