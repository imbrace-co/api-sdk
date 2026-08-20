import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { DocumentAIResource } from "../../../src/resources/document-ai.js"
import { BoardsResource } from "../../../src/resources/boards.js"
import { TemplatesResource } from "../../../src/resources/templates.js"
import { HttpTransport } from "../../../src/http.js"
import { TokenManager } from "../../../src/auth/token-manager.js"

const BASE = "https://app-gatewayv2.imbrace.co/v3/ai"

function makeResource() {
  const http = new HttpTransport({ apiKey: "test_key", timeout: 5000, tokenManager: new TokenManager() })
  return new DocumentAIResource(http, BASE)
}

function mockFetchSequence(responses: Array<{ data: unknown; status?: number }>) {
  let i = 0
  globalThis.fetch = vi.fn().mockImplementation(() => {
    const r = responses[i++] ?? responses[responses.length - 1]
    return Promise.resolve(
      new Response(typeof r.data === "string" ? r.data : JSON.stringify(r.data), {
        status: r.status ?? 200,
        headers: { "Content-Type": "application/json" },
      }),
    )
  })
}

function mockFetch(data: unknown, status = 200) {
  mockFetchSequence([{ data, status }])
}

function getCalledUrl(callIndex = 0): string {
  const arg = vi.mocked(globalThis.fetch).mock.calls[callIndex][0]
  return arg instanceof URL ? arg.toString() : String(arg)
}

function getCalledInit(callIndex = 0) {
  return vi.mocked(globalThis.fetch).mock.calls[callIndex][1]!
}

function getCalledBody(callIndex = 0): any {
  const init = getCalledInit(callIndex)
  return JSON.parse(init.body as string)
}

describe("DocumentAIResource", () => {
  let originalFetch: typeof fetch
  beforeEach(() => { originalFetch = globalThis.fetch })
  afterEach(() => { globalThis.fetch = originalFetch })

  // ── listAgents ─────────────────────────────────────────────────────────────

  describe("listAgents()", () => {
    it("returns all assistants by default (no filter)", async () => {
      mockFetch([
        { _id: "a1", name: "Receipt Extractor" },
        { _id: "a2", name: "Chat Bot" },
        { _id: "a3", name: "BC Form Mapper" },
      ])
      const agents = await makeResource().listAgents()
      expect(agents).toHaveLength(3)
    })

    it("filters by nameContains (case-insensitive)", async () => {
      mockFetch([
        { _id: "a1", name: "Receipt Extractor" },
        { _id: "a2", name: "Chat Bot" },
        { _id: "a3", name: "BC Form Mapper" },
      ])
      const agents = await makeResource().listAgents({ nameContains: "extract" })
      expect(agents).toHaveLength(1)
      expect(agents[0]._id).toBe("a1")
    })

    it("handles wrapped { data: [...] } response", async () => {
      mockFetch({ data: [{ _id: "a1", name: "X" }] })
      const agents = await makeResource().listAgents()
      expect(agents).toHaveLength(1)
    })

    it("hits /accounts/assistants", async () => {
      mockFetch([])
      await makeResource().listAgents()
      expect(getCalledUrl()).toBe(`${BASE}/accounts/assistants`)
    })

    it("documentAiOnly filters by agent_type (list endpoint leaves document_ai null)", async () => {
      mockFetch([
        { _id: "a1", name: "Receipt", agent_type: "document_ai", document_ai: null },
        { _id: "a2", name: "Chat Bot", agent_type: "agent", document_ai: null },
        { _id: "a3", name: "Legacy Doc", agent_type: "agent", document_ai: { fields: [] } },
      ])
      const agents = await makeResource().listAgents({ documentAiOnly: true })
      expect(agents.map(a => a._id)).toEqual(["a1", "a3"])
    })
  })

  // ── getAgent ───────────────────────────────────────────────────────────────

  describe("getAgent()", () => {
    it("hits /assistants/{id}", async () => {
      mockFetch({ _id: "a1", name: "Receipt", agent_type: "document_ai" })
      const a = await makeResource().getAgent("a1")
      expect(getCalledUrl()).toBe(`${BASE}/assistants/a1`)
      expect(a.name).toBe("Receipt")
    })
  })

  // ── createAgent ────────────────────────────────────────────────────────────

  describe("createAgent()", () => {
    it("POSTs /assistant_apps with sensible defaults", async () => {
      mockFetch({ _id: "new", name: "X" })
      await makeResource().createAgent({
        name: "X",
        instructions: "extract X",
        model_id: "gpt-4o",
      })
      expect(getCalledUrl()).toBe(`${BASE}/assistant_apps`)
      expect(getCalledInit().method).toBe("POST")
      const body = getCalledBody()
      expect(body.provider_id).toBe("system")
      expect(body.workflow_name).toBe("document_extraction")
      expect(body.name).toBe("X")
      expect(body.agent_type).toBe("document_ai")
    })

    it("renames `schema` → `data_schema`", async () => {
      mockFetch({})
      await makeResource().createAgent({
        name: "X", instructions: "i", model_id: "m",
        schema: { invoice_number: { type: "string" } },
      })
      const body = getCalledBody()
      expect(body.data_schema).toEqual({ invoice_number: { type: "string" } })
      expect(body.schema).toBeUndefined()
    })

    it("respects custom provider_id and workflow_name", async () => {
      mockFetch({})
      await makeResource().createAgent({
        name: "X", instructions: "i", model_id: "m",
        provider_id: "custom-uuid", workflow_name: "wf",
      })
      const body = getCalledBody()
      expect(body.provider_id).toBe("custom-uuid")
      expect(body.workflow_name).toBe("wf")
    })
  })

  // ── updateAgent ────────────────────────────────────────────────────────────

  describe("updateAgent()", () => {
    it("PUTs /assistant_apps/{id} (with merge — first call GETs existing assistant, then PUTs merged body)", async () => {
      // Default mergeMode: "merge" — first fetches existing assistant, then PUTs.
      mockFetchSequence([{ data: { id: "a1", name: "old", workflow_name: "wf_a1" } }, { data: {} }])
      await makeResource().updateAgent("a1", { name: "renamed" })
      // Call 0: GET existing
      expect(getCalledUrl(0)).toBe(`${BASE}/assistants/a1`)
      expect(getCalledInit(0).method).toBe("GET")
      // Call 1: PUT merged
      expect(getCalledUrl(1)).toBe(`${BASE}/assistant_apps/a1`)
      expect(getCalledInit(1).method).toBe("PUT")
    })

    it("renames `schema` → `data_schema` on update", async () => {
      mockFetchSequence([{ data: { id: "a1", name: "ex" } }, { data: {} }])
      await makeResource().updateAgent("a1", { schema: { x: { type: "string" } } })
      const body = getCalledBody(1)
      expect(body.data_schema).toEqual({ x: { type: "string" } })
      expect(body.schema).toBeUndefined()
    })
  })

  // ── deleteAgent ────────────────────────────────────────────────────────────

  describe("deleteAgent()", () => {
    it("DELETEs /assistant_apps/{id}", async () => {
      mockFetch({}, 200)
      await makeResource().deleteAgent("a1")
      expect(getCalledUrl()).toBe(`${BASE}/assistant_apps/a1`)
      expect(getCalledInit().method).toBe("DELETE")
    })
  })

  // ── process ────────────────────────────────────────────────────────────────

  describe("process()", () => {
    it("with explicit modelName posts to /document/", async () => {
      mockFetch({ success: true, data: {} })
      await makeResource().process({
        url: "u", organizationId: "o", modelName: "gpt-4o",
      })
      expect(getCalledUrl()).toBe(`${BASE}/document`)
      expect(getCalledInit().method).toBe("POST")
      const body = getCalledBody()
      expect(body.modelName).toBe("gpt-4o")
      expect(body.url).toBe("u")
      expect(body.organizationId).toBe("o")
    })

    it("with agentId looks up agent then processes", async () => {
      mockFetchSequence([
        // 1st call: getAgent
        { data: { _id: "a1", model_id: "claude-3-5", instructions: "extract X" } },
        // 2nd call: process
        { data: { success: true, data: { x: 1 } } },
      ])
      const r = await makeResource().process({
        url: "u", organizationId: "o", agentId: "a1",
      })
      expect(getCalledUrl(0)).toBe(`${BASE}/assistants/a1`)
      expect(getCalledUrl(1)).toBe(`${BASE}/document`)
      const body = getCalledBody(1)
      expect(body.modelName).toBe("claude-3-5")
      expect(body.additionalInstructions).toBe("extract X")
      expect(r.success).toBe(true)
    })

    it("explicit modelName overrides agent's", async () => {
      mockFetchSequence([
        { data: { _id: "a1", model_id: "claude-3-5", instructions: "X" } },
        { data: { success: true, data: {} } },
      ])
      await makeResource().process({
        url: "u", organizationId: "o", agentId: "a1", modelName: "gpt-4o",
      })
      const body = getCalledBody(1)
      expect(body.modelName).toBe("gpt-4o")
    })

    it("throws when neither agentId nor modelName given", async () => {
      mockFetch({})
      await expect(
        makeResource().process({ url: "u", organizationId: "o" }),
      ).rejects.toThrow(/agentId.*modelName/i)
    })

    it("forwards extra fields like maxRetries, chunkSize", async () => {
      mockFetch({ success: true, data: {} })
      await makeResource().process({
        url: "u", organizationId: "o", modelName: "gpt-4o",
        maxRetries: 3, chunkSize: 1024,
      })
      const body = getCalledBody()
      expect(body.maxRetries).toBe(3)
      expect(body.chunkSize).toBe(1024)
    })
  })

  // ── suggestSchema ──────────────────────────────────────────────────────────

  describe("suggestSchema()", () => {
    it("posts to /document/ with meta-prompt", async () => {
      mockFetch({ success: true, data: {} })
      await makeResource().suggestSchema({
        url: "https://example.com/sample.pdf",
        organizationId: "o",
      })
      expect(getCalledUrl()).toBe(`${BASE}/document`)
      const body = getCalledBody()
      expect(body.modelName).toBe("gpt-4o")
      expect(body.additionalInstructions).toMatch(/JSON schema/i)
    })

    it("respects custom modelName", async () => {
      mockFetch({})
      await makeResource().suggestSchema({
        url: "u", organizationId: "o", modelName: "claude-3-5",
      })
      expect(getCalledBody().modelName).toBe("claude-3-5")
    })
  })

  // ── createFull (orchestrator) ───────────────────────────────────────────────

  describe("createFull()", () => {
    const GW = "https://app-gatewayv2.imbrace.co"

    function makeWiredResource() {
      const http = new HttpTransport({ apiKey: "test_key", timeout: 5000, tokenManager: new TokenManager() })
      const boards    = new BoardsResource(http, `${GW}/data-board`, `${GW}/v1/backend`)
      const templates = new TemplatesResource(http, `${GW}/v2/backend/templates`)
      const documentAi = new DocumentAIResource(http, BASE, { boards, templates })
      return { documentAi, boards, templates }
    }

    it("runs full flow: board create → N field-adds → templates createCustom, with linked board_id", async () => {
      // 4 calls: boards.create + 2 boards.createField + templates.createCustom
      mockFetchSequence([
        { data: { _id: "brd_xxx", name: "DEMO" } },
        { data: { _id: "fld_1", name: "invoice_number" } },
        { data: { _id: "fld_2", name: "total_amount" } },
        { data: { data: {
            _id: "uc_xxx",
            title: "DEMO",
            agent_type: "document_ai",
            channel_id: "ch_xxx",
            assistant_id: "fa445273-aaaa",
        } } },
      ])

      const { documentAi } = makeWiredResource()
      const result = await documentAi.createFull({
        name: "DEMO",
        instructions: "Step 1: Extract Data...",
        schemaFields: [
          { name: "invoice_number", type: "ShortText", is_identifier: true, data: [] },
          { name: "total_amount", type: "Number", data: [] },
        ],
        modelId: "qwen3.5:27b",
        providerId: "prov-uuid",
        description: "Receipt extractor",
        sourceLanguages: ["English"],
        handwritingSupport: true,
      })

      expect(result.board_id).toBe("brd_xxx")
      expect(result.ai_agent_id).toBe("fa445273-aaaa")
      expect(result.channel_id).toBe("ch_xxx")
      expect(result.usecase_id).toBe("uc_xxx")

      // Verify URLs hit — board now on data-board, fields too, then templates on backend
      expect(getCalledUrl(0)).toBe(`${GW}/data-board/boards`)
      expect(getCalledUrl(1)).toBe(`${GW}/data-board/boards/brd_xxx/fields`)
      expect(getCalledUrl(2)).toBe(`${GW}/data-board/boards/brd_xxx/fields`)
      expect(getCalledUrl(3)).toBe(`${GW}/v2/backend/templates/v2/custom`)

      // Board POST body
      const boardBody = getCalledBody(0)
      expect(boardBody.name).toBe("DEMO")
      // createFull always sends type: "General" (DocumentAI is signaled via the
      // assistant's document_ai sub-object, not the board type).
      expect(boardBody.type).toBe("General")

      // Templates POST body — linked board_id (call 3, after the field adds)
      const tplBody = getCalledBody(3)
      expect(tplBody.usecase.title).toBe("DEMO")
      expect(tplBody.usecase.agent_type).toBe("document_ai")
      expect(tplBody.assistant.model_id).toBe("qwen3.5:27b")
      expect(tplBody.assistant.core_task).toBe("Step 1: Extract Data...")
      expect(tplBody.assistant.document_ai.board_id).toBe("brd_xxx")
      expect(tplBody.assistant.document_ai.vlm_model).toBe("qwen3.5:27b")
      expect(tplBody.assistant.document_ai.vlm_provider_id).toBe("prov-uuid")
      expect(tplBody.assistant.document_ai.handwriting_support).toBe(true)
    })

    it("vlmModel/vlmProviderId default to modelId/providerId; sourceLanguages default to ['English']", async () => {
      // 3 calls: board + 1 field + templates
      mockFetchSequence([
        { data: { _id: "brd_y" } },
        { data: { _id: "fld_1" } },
        { data: { data: {} } },
      ])
      const { documentAi } = makeWiredResource()
      await documentAi.createFull({
        name: "X", instructions: "i",
        schemaFields: [{ name: "f", type: "ShortText" }],
        modelId: "gpt-4o", providerId: "p1",
      })
      const tplBody = getCalledBody(2)
      expect(tplBody.assistant.document_ai.vlm_model).toBe("gpt-4o")
      expect(tplBody.assistant.document_ai.vlm_provider_id).toBe("p1")
      expect(tplBody.assistant.document_ai.source_languages).toEqual(["English"])
    })

    it("extraAiAgent overrides AI Agent fields on the wire body", async () => {
      mockFetchSequence([
        { data: { _id: "brd_z" } },
        { data: { _id: "fld_1" } },
        { data: { data: {} } },
      ])
      const { documentAi } = makeWiredResource()
      await documentAi.createFull({
        name: "X", instructions: "i",
        schemaFields: [{ name: "f", type: "ShortText" }],
        modelId: "m", providerId: "p",
        extraAiAgent: {
          workflow_function_call: ["wf_id_1"],
          metadata: { max_token_limit: 100 },
        },
      })
      const tplBody = getCalledBody(2)
      expect(tplBody.assistant.workflow_function_call).toEqual(["wf_id_1"])
      expect(tplBody.assistant.metadata).toEqual({ max_token_limit: 100 })
    })

    it("throws when constructed without boards+templates deps", async () => {
      const bare = makeResource() // no deps
      await expect(
        bare.createFull({
          name: "X", instructions: "i",
          schemaFields: [], modelId: "m", providerId: "p",
        }),
      ).rejects.toThrow(/boards \+ templates/)
    })
  })
})
