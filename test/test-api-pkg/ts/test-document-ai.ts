/**
 * Exhaustive documentAi resource verification — pulls @imbrace/sdk from npm.
 * Auth: API Key.
 *
 * Covers every method on the DocumentAIResource:
 *   - Agent CRUD: listAgents, getAgent, createAgent, updateAgent, deleteAgent
 *   - Process: process (with sample document URL)
 *   - Schema auto-learn: suggestSchema
 *   - Orchestrator: createFull (board + usecase + ai_agent in 1 call)
 *
 * Lifecycle test creates real resources on the org then cleans up after itself.
 * Sample document URL must be reachable from the iMBRACE Document AI worker.
 */
import "dotenv/config"
import { ImbraceClient } from "@imbrace/sdk"

const apiKey         = process.env.IMBRACE_API_KEY
const organizationId = process.env.IMBRACE_ORGANIZATION_ID
const baseUrl        = process.env.IMBRACE_GATEWAY_URL ?? "https://app-gatewayv2.imbrace.co"
const sampleDocUrl   = process.env.IMBRACE_SAMPLE_DOC_URL ?? ""
const modelId        = process.env.IMBRACE_DOC_MODEL_ID    ?? "qwen3.5-27b"
const providerId     = process.env.IMBRACE_DOC_PROVIDER_ID ?? "c95e63ad-3c48-4b6a-8ed1-49cf8408088d"

if (!apiKey || !organizationId) {
  console.error("Missing IMBRACE_API_KEY or IMBRACE_ORGANIZATION_ID")
  process.exit(1)
}

// Heavier timeout — Document AI process can take 10-30s with real LLM
const client = new ImbraceClient({ apiKey, organizationId, baseUrl, timeout: 60_000 })
const da = client.documentAi

let pass = 0, fail = 0, skip = 0
const fails: string[] = []

async function step(label: string, fn: () => Promise<any>, expectFail = false) {
  process.stdout.write(`  • ${label} ... `)
  const t0 = Date.now()
  try {
    const result = await fn()
    const dt = Date.now() - t0
    const summary = JSON.stringify(result ?? {}).slice(0, 120)
    if (expectFail) {
      console.log(`unexpected pass [${dt}ms]: ${summary}`); fail++; fails.push(`${label} → unexpected pass`)
    } else {
      console.log(`✓ [${dt}ms] ${summary}`); pass++
    }
  } catch (err: any) {
    const detail = err?.message ?? String(err)
    if (expectFail) { console.log(`✓ (expected fail [${detail.slice(0, 200)}])`); pass++ }
    else { console.log(`✗ ${detail.slice(0, 300)}`); fail++; fails.push(`${label} → ${detail.slice(0, 300)}`) }
  }
}

function skipped(label: string, reason: string) {
  console.log(`  - ${label}  ⏭ ${reason}`); skip++
}

function section(title: string) {
  console.log(`\n══ ${title} ══`)
}

console.log(`\n━━━ documentAi resource — auth: API KEY (npm @imbrace/sdk) ━━━`)
console.log(`gateway=${baseUrl}`)
console.log(`org=${organizationId}`)
console.log(`sampleDoc=${sampleDocUrl || "(unset — process tests will skip)"}`)
console.log(`modelId=${modelId}  providerId=${providerId}`)

// ── 1. List (no fixture needed) ─────────────────────────────────────────────
section("List")
await step("listAgents()",                       () => da.listAgents())
await step("listAgents({documentAiOnly:true})",  () => da.listAgents({ documentAiOnly: true }))
await step("listAgents({nameContains:'test'})",  () => da.listAgents({ nameContains: "test" }))

// ── 2. CRUD lifecycle ───────────────────────────────────────────────────────
section("CRUD lifecycle")
const stamp = Date.now()
const testAgentName = `sdk-test-doc-${stamp}`

let createdAgentId: string | null = null
await step("createAgent (lifecycle)", async () => {
  const res = await da.createAgent({
    name: testAgentName,
    instructions: "Extract invoice fields. Return JSON: {invoice_number, total, date}.",
    model_id: modelId,
    provider_id: providerId,
    schema: {
      invoice_number: { type: "string", description: "Invoice ID" },
      total:          { type: "number", description: "Total amount" },
      date:           { type: "string", format: "date" },
    },
    description: "SDK test agent — auto-cleanup",
  } as any)
  createdAgentId = (res as any)?._id ?? (res as any)?.id ?? null
  return { id: createdAgentId, name: (res as any)?.name }
})

if (createdAgentId) {
  await step("getAgent(createdId)", async () => {
    const a = await da.getAgent(createdAgentId!)
    return { id: (a as any)._id ?? (a as any).id, name: (a as any).name, model_id: (a as any).model_id }
  })

  await step("updateAgent — get-merge-put (backend requires full replacement)", async () => {
    const existing: any = await da.getAgent(createdAgentId!)
    const merged = {
      ...existing,
      description: "SDK test agent — updated",
    }
    delete merged._id; delete merged.id; delete merged.assistant_id
    delete merged.created_at; delete merged.updated_at
    const a = await da.updateAgent(createdAgentId!, merged as any)
    return { id: (a as any)._id ?? (a as any).id, description: (a as any).description }
  })
} else {
  skipped("getAgent / updateAgent", "createAgent did not return an id")
}

// ── 3. Process (needs sample document URL) ──────────────────────────────────
section("Process")
if (!sampleDocUrl) {
  skipped("process / suggestSchema", "set IMBRACE_SAMPLE_DOC_URL to a public PDF/image to enable")
} else {
  if (createdAgentId) {
    await step("process(agentId, url)", () =>
      da.process({ agentId: createdAgentId!, url: sampleDocUrl, organizationId })
    )
  } else {
    skipped("process(agentId)", "no createdAgentId fixture")
  }
  await step("process(modelName, url) [direct]", () =>
    da.process({ modelName: modelId, url: sampleDocUrl, organizationId, instructions: "Extract any visible text fields as JSON." })
  )
  await step("suggestSchema(url)", () =>
    da.suggestSchema({ url: sampleDocUrl, organizationId, modelName: modelId })
  )
}

// ── 4. Cleanup created agent ────────────────────────────────────────────────
section("Cleanup")
if (createdAgentId) {
  await step("deleteAgent(createdId)", async () => {
    await da.deleteAgent(createdAgentId!)
    return { deleted: createdAgentId }
  })
} else {
  skipped("deleteAgent", "no createdAgentId fixture")
}

// ── 5. createFull orchestrator (board + usecase + ai_agent) ─────────────────
//
// KNOWN ISSUE — SDK uses board `type: "DocumentAI"` but backend enum rejects it.
// Backend valid types: Contacts, Companies, Opportunities, OptOut, Tasks,
// Products, General, KnowledgeHub. The board's real Document AI marker is
// stored elsewhere (likely the agent's `document_ai.board_id` link, with the
// board itself being type `General`). This is an SDK contract drift to fix.
section("createFull orchestrator")
const fullName = `sdk-test-docfull-${stamp}`
let fullResult: any = null
await step("createFull (board+usecase+aiAgent) [known SDK drift: board type 'DocumentAI' invalid]", async () => {
  const r = await da.createFull({
    name: fullName,
    description: "SDK test — auto-cleanup",
    instructions: "Extract invoice fields. Return JSON.",
    schemaFields: [
      { name: "invoice_number", label: "Invoice Number", type: "ShortText" },
      { name: "total",          label: "Total",          type: "Number" },
    ],
    modelId,
    providerId,
    // Override agent_type — this org stores `agent_type: "agent"` not "document_ai"
    extraAiAgent: { agent_type: "agent" } as any,
  } as any)
  fullResult = r
  return { board_id: (r as any).board_id, ai_agent_id: (r as any).ai_agent_id, usecase_id: (r as any).usecase_id }
})

// Cleanup createFull artifacts (best-effort)
if (fullResult) {
  if (fullResult.ai_agent_id) {
    await step("cleanup: deleteAgent(full.ai_agent_id)", async () => {
      await da.deleteAgent(fullResult.ai_agent_id)
      return { deleted: fullResult.ai_agent_id }
    })
  }
  if (fullResult.board_id) {
    await step("cleanup: boards.delete(full.board_id)", async () => {
      await client.boards.delete(fullResult.board_id)
      return { deleted: fullResult.board_id }
    })
  }
}

// ── Summary ─────────────────────────────────────────────────────────────────
console.log(`\n━━━ Summary ━━━`)
console.log(`pass=${pass}  fail=${fail}  skip=${skip}`)
if (fails.length) {
  console.log("Failures:")
  for (const f of fails) console.log(`  - ${f}`)
}
process.exit(fail > 0 ? 1 : 0)
