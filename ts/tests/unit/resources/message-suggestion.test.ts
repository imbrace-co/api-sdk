import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { MessageSuggestionResource } from "../../../src/resources/message-suggestion.js"
import { HttpTransport } from "../../../src/http.js"
import { TokenManager } from "../../../src/auth/token-manager.js"

describe("MessageSuggestionResource", () => {
  let originalFetch: typeof fetch
  beforeEach(() => { originalFetch = globalThis.fetch })
  afterEach(() => { globalThis.fetch = originalFetch })

  it("getSuggestions() posts { thread_id } to /ai-agent/suggestions", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue(new Response(JSON.stringify({ success: true, follow_up_message: "", suggestions: ["Hi"] })))
    const http = new HttpTransport({ apiKey: "test_key", timeout: 5000, tokenManager: new TokenManager() })
    const res = await new MessageSuggestionResource(http, "https://app-gatewayv2.imbrace.co/ai-agent/suggestions")
      .getSuggestions({ thread_id: "3f8b1c2e-1d2a-4c3b-9a7e-2b1c3d4e5f60" })
    const [input, init] = vi.mocked(globalThis.fetch).mock.calls[0]
    expect(new URL(String(input)).pathname).toBe("/ai-agent/suggestions")
    expect(init?.method).toBe("POST")
    expect(JSON.parse(init?.body as string)).toEqual({ thread_id: "3f8b1c2e-1d2a-4c3b-9a7e-2b1c3d4e5f60" })
    expect(res.suggestions).toEqual(["Hi"])
  })
})
