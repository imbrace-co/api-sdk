import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { TemplatesResource } from "../../../src/resources/templates.js"
import { HttpTransport } from "../../../src/http.js"
import { TokenManager } from "../../../src/auth/token-manager.js"

const GW = "https://app-gatewayv2.imbrace.co"
const BASE = `${GW}/v2/backend/templates`

function makeResource() {
  const http = new HttpTransport({ apiKey: "test_key", timeout: 5000, tokenManager: new TokenManager() })
  return new TemplatesResource(http, BASE)
}

function mockFetch(data: unknown, status = 200) {
  globalThis.fetch = vi.fn().mockResolvedValue(
    new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json" } }),
  )
}

function getCalledUrl(callIndex = 0): string {
  const arg = vi.mocked(globalThis.fetch).mock.calls[callIndex][0]
  return arg instanceof URL ? arg.toString() : String(arg)
}

function getCalledBody(callIndex = 0): any {
  const init = vi.mocked(globalThis.fetch).mock.calls[callIndex][1]!
  return JSON.parse(init.body as string)
}

describe("TemplatesResource", () => {
  let originalFetch: typeof fetch
  beforeEach(() => { originalFetch = globalThis.fetch })
  afterEach(() => { globalThis.fetch = originalFetch })

  describe("list()", () => {
    it("hits GET /v2/backend/templates", async () => {
      mockFetch({
        data: [
          { _id: "uc_1", doc_name: "UseCase", title: "Receipt Extractor", agent_type: "document_ai" },
          { _id: "uc_2", doc_name: "UseCase", title: "Hospital KB", agent_type: "rag" },
        ],
      })
      const res = await makeResource().list()
      expect(getCalledUrl()).toBe(BASE)
      expect(res.data).toHaveLength(2)
      expect(res.data[0].title).toBe("Receipt Extractor")
    })
  })

  describe("createCustom()", () => {
    it("posts full Document AI payload to /v2/custom", async () => {
      mockFetch({
        data: {
          _id: "uc_new",
          doc_name: "UseCase",
          title: "DEMO1",
          type: "custom",
          agent_type: "document_ai",
          channel_id: "ch_xxx",
          assistant_id: "fa445273-c150-4ec5-bbf0-41d5e6f5c0ec",
        },
      })

      const res = await makeResource().createCustom({
        usecase: {
          title: "DEMO1",
          short_description: "Receipt extractor",
          demo_url: "https://chat-widget.imbrace.co",
          agent_type: "document_ai",
        },
        assistant: {
          name: "DEMO1",
          mode: "advanced",
          model_id: "qwen3.5:27b",
          provider_id: "8cc8769a-uuid",
          core_task: "Step 1: Extract Data...",
          agent_type: "document_ai",
          channel: "web",
          temperature: 0.1,
          version: 2,
          document_ai: {
            vlm_provider_id: "8cc8769a-uuid",
            vlm_model: "qwen3.5:27b",
            source_languages: ["English"],
            handwriting_support: true,
            board_id: "brd_xxx",
            continue_on_failure: false,
            retry_time: 2,
          },
        },
      })

      expect(getCalledUrl()).toBe(`${BASE}/v2/custom`)
      expect(res.data._id).toBe("uc_new")
      expect(res.data.assistant_id).toBe("fa445273-c150-4ec5-bbf0-41d5e6f5c0ec")
      expect(res.data.channel_id).toBe("ch_xxx")

      const body = getCalledBody()
      expect(body.usecase.title).toBe("DEMO1")
      expect(body.usecase.agent_type).toBe("document_ai")
      expect(body.assistant.model_id).toBe("qwen3.5:27b")
      expect(body.assistant.document_ai.board_id).toBe("brd_xxx")
      expect(body.assistant.document_ai.source_languages).toEqual(["English"])
    })

    it("routes POST to /v2/backend/templates/v2/custom", async () => {
      mockFetch({ data: {} })
      await makeResource().createCustom({
        usecase: { title: "X" },
        assistant: { name: "X" },
      })
      expect(getCalledUrl()).toBe(`${BASE}/v2/custom`)
      const init = vi.mocked(globalThis.fetch).mock.calls[0][1]!
      expect(init.method).toBe("POST")
    })
  })
})
