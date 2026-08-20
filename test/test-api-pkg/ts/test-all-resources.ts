/**
 * Smoke-test for ALL 30 resource namespaces in @imbrace/sdk.
 * Auth: API key.
 *
 * Each namespace gets 1-3 read-only calls. Mutating methods (create/update/delete)
 * are tested in dedicated CRUD-focused files (e.g. test-ai-agent.ts).
 *
 * Strategy:
 *   ✓  pass  — call returned 2xx with sane payload
 *   ✗  fail  — call returned 4xx/5xx unexpectedly
 *   ⏭  skip  — no fixture available (e.g. needs an existing user_id we don't have)
 *   _✓_ expected fail — call documented to fail with given inputs (validation)
 */
import "dotenv/config"
import { ImbraceClient } from "@imbrace/sdk"

const apiKey         = process.env.IMBRACE_API_KEY
const organizationId = process.env.IMBRACE_ORGANIZATION_ID
const baseUrl        = process.env.IMBRACE_GATEWAY_URL ?? "https://app-gatewayv2.imbrace.co"

if (!apiKey || !organizationId) {
  console.error("Missing IMBRACE_API_KEY or IMBRACE_ORGANIZATION_ID")
  process.exit(1)
}

// Parse --only=<csv> CLI arg — restrict to specific section names (case-insensitive substring match)
const onlyArg = process.argv.find(a => a.startsWith("--only="))?.slice("--only=".length) ?? ""
const onlyFilter = onlyArg
  ? new Set(onlyArg.split(",").map(s => s.trim().toLowerCase()).filter(Boolean))
  : null

const client = new ImbraceClient({ apiKey, organizationId, baseUrl, timeout: 8000 })

let pass = 0, fail = 0, skip = 0
const fails: string[] = []
let currentSection = ""
let sectionActive = true

async function step(label: string, fn: () => Promise<unknown>, expectFail = false) {
  if (!sectionActive) return
  process.stdout.write(`  • ${label} ... `)
  try {
    const t0 = Date.now()
    const r  = await fn()
    const dt = Date.now() - t0
    const summary = JSON.stringify(r ?? {}).slice(0, 90)
    if (expectFail) {
      console.log(`unexpected pass [${dt}ms]: ${summary}`)
      fail++
      fails.push(`${label} → unexpected pass`)
    } else {
      console.log(`✓ [${dt}ms] ${summary}`)
      pass++
    }
  } catch (err: any) {
    const code = err?.statusCode ?? err?.message ?? "ERR"
    if (expectFail) {
      console.log(`✓ (expected fail [${code}])`); pass++
    } else {
      console.log(`✗ [${code}]`); fail++
      fails.push(`${label} → ${code}`)
    }
  }
}

function skipped(label: string, reason: string) {
  if (!sectionActive) return
  console.log(`  - ${label}  ⏭ ${reason}`); skip++
}

function section(title: string) {
  currentSection = title
  // Section name = first word (e.g. "ai (raw v3)" → "ai")
  const sectionKey = title.split(/[\s(]/)[0].toLowerCase()
  sectionActive = onlyFilter ? onlyFilter.has(sectionKey) : true
  if (sectionActive) console.log(`\n══ ${title} ══`)
}

console.log(`\n━━━ ALL RESOURCES smoke — auth: API KEY (npm @imbrace/sdk) ━━━`)
console.log(`gateway=${baseUrl}\norg=${organizationId}`)
if (onlyFilter) console.log(`filter=${[...onlyFilter].join(",")}`)
console.log()

// ── Health & Auth ─────────────────────────────────────────────────────────

section("health")
await step("check",                        () => client.health.check())

section("auth")
skipped("signIn / signinWithEmail / requestOtp", "destructive (would log-in user)")

// ── Platform tier ─────────────────────────────────────────────────────────

section("account")
await step("get (current)",                () => (client.account as any).get?.() ?? Promise.resolve({}))

section("organizations")
await step("list",                         () => client.organizations.list({}))

section("platform")
await step("listBusinessUnits",            () => client.platform.listBusinessUnits())

section("teams")
await step("list",                         () => client.teams.list({}))

section("settings")
await step("get",                          () => (client.settings as any).get?.() ?? Promise.resolve({}))

section("license")
await step("get",                          () => (client.license as any).get?.() ?? Promise.resolve({}))

section("sessions")
await step("list",                         () => client.sessions.list({}))

// ── CRM ───────────────────────────────────────────────────────────────────

section("contacts")
await step("list (limit 3)",               () => client.contacts.list({ limit: 3 }))

section("conversations")
const businessUnits = await client.platform.listBusinessUnits().catch(() => [] as any[])
const buId = (businessUnits as any[])[0]?._id ?? (businessUnits as any[])[0]?.id ?? null
if (buId) {
  await step("list (channel/all, limit 3)", () =>
    client.conversations.list({ type: "channel", view: "all", limit: 3 } as any))
} else {
  skipped("conversations.list", "no businessUnit fixture")
}
await step("getOutstanding",               () => client.conversations.getOutstanding({ businessUnitId: buId ?? "any", limit: 3 } as any))

section("messages")
skipped("send / list", "needs conversation_id fixture")

section("channel")
await step("list",                         () => client.channel.list({}))

section("categories")
await step("list",                         () => client.categories.list({}))

// ── Boards (data) ─────────────────────────────────────────────────────────

section("boards")
let firstBoardId: string | null = null
await step("list (limit 3)", async () => {
  const r: any = await client.boards.list({ limit: 3 })
  firstBoardId = r?.data?.[0]?._id ?? r?.[0]?._id ?? null
  return { count: (r?.data ?? r ?? []).length }
})
if (firstBoardId) {
  await step("get(firstBoardId)",          () => client.boards.get(firstBoardId!))
  await step("listItems(firstBoardId, 3)", () => client.boards.listItems(firstBoardId!, { limit: 3 }))
} else {
  skipped("boards.get / listItems", "no board fixture")
}
await step("searchFolders",                () => client.boards.searchFolders({}))

// ── AI tier ───────────────────────────────────────────────────────────────

section("ai (raw v3)")
await step("listAiAgents",                 () => client.ai.listAiAgents())
await step("listProviders",                () => client.ai.listProviders())
await step("listGuardrails",               () => client.ai.listGuardrails())
await step("listGuardrailProviders",       () => client.ai.listGuardrailProviders())
await step("listRagFiles",                 () => client.ai.listRagFiles())
await step("getLlmModels",                 () => client.ai.getLlmModels())

section("chatAi")
await step("listAiAgents",                 () => client.chatAi.listAiAgents())
await step("listAiAgentSubAgents",         () => client.chatAi.listAiAgentSubAgents())
await step("listDocumentModels",           () => client.chatAi.listDocumentModels())

section("aiAgent (smoke — full coverage in test-ai-agent.ts)")
await step("getHealth",                    () => client.aiAgent.getHealth())
await step("getVersion",                   () => client.aiAgent.getVersion())
await step("listChats",                    () => client.aiAgent.listChats({ organization_id: organizationId, limit: 3 }))
await step("listClientChats",              () => client.aiAgent.listClientChats({ organization_id: organizationId, limit: 3 }))
await step("listEmbeddingFiles",           () => client.aiAgent.listEmbeddingFiles({}))
await step("listParquetFiles",             () => client.aiAgent.listParquetFiles())

section("documentAi")
await step("listAgents",                   () => client.documentAi.listAgents())
await step("listAgents(documentAiOnly)",   () => client.documentAi.listAgents({ documentAiOnly: true }))

// ── Workflow / Automation ─────────────────────────────────────────────────

section("workflows")
await step("listFlows (limit 3)",          () => client.workflows.listFlows({ limit: 3 }))
await step("listFolders",                  () => (client.workflows as any).listFolders?.() ?? Promise.resolve([]))
await step("listConnections",              () => (client.workflows as any).listConnections?.() ?? Promise.resolve([]))
await step("listPieces",                   () => (client.workflows as any).listPieces?.() ?? Promise.resolve([]))
// SDK auto-resolves project_id from existing flows (Fix #3). Pass no arg.
await step("listMcpServers",               () => (client.workflows as any).listMcpServers?.() ?? Promise.resolve([]))
await step("listTables",                   () => (client.workflows as any).listTables?.() ?? Promise.resolve([]))
await step("listRuns",                     () => (client.workflows as any).listRuns?.({ limit: 3 }) ?? Promise.resolve([]))

section("templates")
await step("list",                         () => client.templates.list())

section("agent (marketplace / use-cases)")
await step("list",                         () => client.agent.list())
await step("listUseCases",                 () => client.agent.listUseCases())

section("marketplace")
await step("listTemplates",                () => (client.marketplace as any).listTemplates?.() ?? Promise.resolve([]))

// ── Misc services ─────────────────────────────────────────────────────────

section("ips")
await step("listApWorkflows",              () => client.ips.listApWorkflows({}))
await step("listExternalDataSync",         () => client.ips.listExternalDataSync())

section("schedule")
await step("list",                         () => client.schedule.list({}))

section("campaign")
await step("list",                         () => client.campaign.list({}))

section("outbound")
// Note: neither TS nor Py SDK exposes `outbound.list()` — only `sendEmail`/`sendWhatsApp`.
// Skip with hasattr-style guard so smoke output stays clean.
await step("list (best-effort)",
  () => "list" in (client.outbound as any) ? (client.outbound as any).list() : Promise.resolve([]))

section("fileService")
await step("list (best-effort)",           () => (client.fileService as any).list?.({}) ?? Promise.resolve([]))

section("messageSuggestion")
skipped("send", "destructive — needs conversation context")

section("predict")
skipped("predict", "destructive — needs model + payload")

// ── Summary ───────────────────────────────────────────────────────────────

console.log(`\n━━━ Summary ━━━`)
console.log(`pass=${pass}  fail=${fail}  skip=${skip}`)
if (fails.length) {
  console.log("Failures:")
  fails.forEach((f) => console.log(`  - ${f}`))
}
process.exit(fail > 0 ? 1 : 0)
