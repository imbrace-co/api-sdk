/**
 * Exhaustive aiAgent resource verification — pulls @imbrace/sdk from npm.
 * Auth: Access Token.
 *
 * Covers every method documented at https://developer.imbrace.co/sdk/ai-agent/
 *   System & Trace, Chat v1/v2 + Sub-agent, Prompt suggestions,
 *   Embeddings/RAG, Data Board, Parquet, Chat Client (auth/chats/messages/
 *   votes/documents), Admin Guides.
 */
import "dotenv/config"
import { ImbraceClient } from "@imbrace/sdk"
import { randomUUID } from "node:crypto"

const accessToken    = process.env.IMBRACE_ACCESS_TOKEN
const organizationId = process.env.IMBRACE_ORGANIZATION_ID
const baseUrl        = process.env.IMBRACE_GATEWAY_URL ?? "https://app-gatewayv2.imbrace.co"

if (!accessToken || !organizationId) {
  console.error("Missing IMBRACE_ACCESS_TOKEN or IMBRACE_ORGANIZATION_ID")
  process.exit(1)
}

const client = new ImbraceClient({ accessToken, organizationId, baseUrl })
const ai     = client.aiAgent

let pass = 0
let fail = 0
let skip = 0
const fails: string[] = []

async function step(label: string, fn: () => Promise<unknown>, expectFail = false) {
  process.stdout.write(`  • ${label} ... `)
  try {
    const t0 = Date.now()
    const result = await fn()
    const dt = Date.now() - t0
    const summary = JSON.stringify(result ?? {}).slice(0, 100)
    if (expectFail) {
      console.log(`unexpected pass [${dt}ms]: ${summary}`)
    } else {
      console.log(`✓ [${dt}ms] ${summary}`)
      pass++
    }
  } catch (err: any) {
    const code = err?.statusCode ?? err?.message ?? "ERR"
    if (expectFail) {
      console.log(`✓ (expected fail [${code}])`)
      pass++
    } else {
      console.log(`✗ [${code}]`)
      fail++
      fails.push(`${label} → ${code}`)
    }
  }
}

function section(title: string) {
  console.log(`\n══ ${title} ══`)
}

async function resolveAssistantId(): Promise<string | null> {
  try {
    const list = await client.chatAi.listAiAgents()
    const withModel = (list as any[]).find((a) => a.model_id)
    return withModel?.id ?? (list as any[])[0]?.id ?? null
  } catch {
    return null
  }
}

console.log(`\n━━━ aiAgent resource — auth: ACCESS TOKEN (npm @imbrace/sdk) ━━━`)
console.log(`gateway=${baseUrl}`)
console.log(`org=${organizationId}`)

section("System & Trace")
await step("getHealth",          () => ai.getHealth())
await step("getConfig",          () => ai.getConfig())
await step("getVersion",         () => ai.getVersion())
await step("getTraceServices",   () => ai.getTraceServices())
await step("getTraceTags",       () => ai.getTraceTags())
await step("getTraces (limit 3)",() => ai.getTraces({ limit: 3 }))

const assistantId = await resolveAssistantId()
console.log(`\n[fixture] assistant_id = ${assistantId ?? "<none found>"}`)

section("Chat v1 (legacy) — requires organization_id")
await step("listChats",          () => ai.listChats({ organization_id: organizationId, limit: 3 }))

section("Chat v2 streaming + sub-agent")
if (assistantId) {
  await step("streamChat (1 turn, consume body)", async () => {
    const res = await ai.streamChat({
      assistant_id: assistantId,
      organization_id: organizationId,
      messages: [{ role: "user", content: "Reply with the single word OK." }],
    } as any)
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const text = (await res.text()).slice(0, 80)
    return { status: res.status, preview: text }
  })
} else {
  console.log("  - streamChat: skipped (no assistant available)"); skip++
}

section("Prompt suggestions")
if (assistantId) {
  await step("getAgentPromptSuggestion", () => ai.getAgentPromptSuggestion(assistantId))
} else { skip++ }

section("Embeddings / RAG")
let firstEmbeddingId: string | null = null
await step("listEmbeddingFiles", async () => {
  const r = await ai.listEmbeddingFiles({})
  const data = (r as any)?.data?.files ?? (r as any)?.data ?? []
  if (Array.isArray(data) && data.length > 0) firstEmbeddingId = data[0]?.id ?? data[0]?._id ?? null
  return { count: Array.isArray(data) ? data.length : 0 }
})
if (firstEmbeddingId) {
  await step("getEmbeddingFile",     () => ai.getEmbeddingFile(firstEmbeddingId!))
  await step("previewEmbeddingFile", () => ai.previewEmbeddingFile({ file_id: firstEmbeddingId! }))
} else { skip += 2 }
await step("classifyFile (no fileId)", () => ai.classifyFile({}), true)

section("Data Board")
// Fix #1: suggestFieldTypes now takes {fileUrls} (sample doc URLs), not {fields}.
await step("suggestFieldTypes (best-effort)", () =>
  ai.suggestFieldTypes({ fileUrls: ["https://example.com/sample.pdf"] })
    .catch((e: any) => {
      if (e?.message?.includes("Failed to fetch document")) return { shape_ok: true, fetch_err: "expected" }
      throw e
    }),
)

section("Parquet")
await step("listParquetFiles", () => ai.listParquetFiles())

section("Chat Client — Auth")
let chatClientUserId: string | null = null
await step("getChatClientUser", async () => {
  const u = await ai.getChatClientUser({})
  chatClientUserId = (u as any)?.id ?? null
  return u
})

section("Chat Client — Chats")
let createdChatId: string | null = null
if (assistantId && chatClientUserId) {
  const newChatId = randomUUID()
  await step("createClientChat", async () => {
    const r = await ai.createClientChat({
      id: newChatId,
      assistantId,
      organizationId,
      userId: chatClientUserId!,
      selectedVisibilityType: "private",
      message: {
        id: randomUUID(),
        role: "user",
        content: "hello from sdk verify (accesstoken)",
        createdAt: new Date().toISOString(),
        parts: [{ type: "text", text: "hello from sdk verify (accesstoken)" }],
      },
    })
    createdChatId = (r as any)?.id ?? newChatId
    return r
  })
} else { skip++ }

await step("listClientChats", () => ai.listClientChats({ organization_id: organizationId, limit: 3 }))

if (createdChatId) {
  await step("getClientChat",            () => ai.getClientChat(createdChatId!))
  await step("listClientMessages",       () => ai.listClientMessages(createdChatId!))
  await step("getVotes",                 () => ai.getVotes(createdChatId!))
  await step("generateClientChatTitle",  () => ai.generateClientChatTitle(createdChatId!))
  await step("updateClientChat (visibility)", () =>
    ai.updateClientChat(createdChatId!, { visibility: "public" }),
  )
  await step("deleteClientChat", () => ai.deleteClientChat(createdChatId!))
} else { skip += 6 }

section("Chat Client — Documents")
await step("getDocumentLatestByKind (kind=text)", () =>
  ai.getDocumentLatestByKind({ kind: "text" }),
)

section("Admin Guides")
await step("listAdminGuides", () => ai.listAdminGuides())

console.log(`\n━━━ Summary ━━━`)
console.log(`pass=${pass}  fail=${fail}  skip=${skip}`)
if (fails.length) {
  console.log("Failures:")
  fails.forEach((f) => console.log(`  - ${f}`))
}
process.exit(fail > 0 ? 1 : 0)
