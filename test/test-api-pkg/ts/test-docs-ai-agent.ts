/**
 * Mirrors every snippet in website/public/sdk/ai-agent.md against
 * @imbrace/sdk@1.0.4 (npm), authenticated via API key.
 *
 * Sections follow the doc:
 *   §1  Assistant CRUD (chatAi)              [doc-gap: Assistant→AiAgent rename]
 *   §2  Completions (client.ai)
 *   §3  Document AI models / processing / file extraction
 *   §4  Knowledge Hub (boards: folders + files)
 *   §5  OpenAI-compatible client.ai
 *   §6  Chat v2 streaming
 *   §7  Sub-agent chat + history
 *   §8  Prompt suggestions
 *   §9  Embeddings & Knowledge Base
 *   §10 Data Board (suggestFieldTypes)
 *   §11 Parquet
 *   §12 Distributed Tracing (Tempo)
 *   §13 Chat Client (auth, chats, messages, votes, documents)
 *   §14 Admin Guides
 *   §15 Legacy v1 chat
 */
import "dotenv/config"
import { ImbraceClient } from "@imbrace/sdk"
import { randomUUID } from "node:crypto"

const apiKey         = process.env.IMBRACE_API_KEY
const organizationId = process.env.IMBRACE_ORGANIZATION_ID
const baseUrl        = process.env.IMBRACE_GATEWAY_URL ?? "https://app-gatewayv2.imbrace.co"

if (!apiKey || !organizationId) {
  console.error("Missing IMBRACE_API_KEY or IMBRACE_ORGANIZATION_ID")
  process.exit(1)
}

const client = new ImbraceClient({ apiKey, organizationId, baseUrl, timeout: 30_000 })

let pass = 0, fail = 0, skip = 0
const fails: string[] = []
const docGaps: string[] = []

async function step(label: string, fn: () => Promise<unknown>, expectFail = false) {
  process.stdout.write(`  • ${label} ... `)
  try {
    const t0 = Date.now()
    const r = await fn()
    const dt = Date.now() - t0
    const summary = JSON.stringify(r ?? {}).slice(0, 90)
    if (expectFail) { console.log(`unexpected pass [${dt}ms]: ${summary}`); fail++; fails.push(`${label} → unexpected pass`) }
    else { console.log(`✓ [${dt}ms] ${summary}`); pass++ }
  } catch (err: any) {
    const code = err?.statusCode ?? err?.message ?? "ERR"
    if (expectFail) { console.log(`✓ (expected fail [${code}])`); pass++ }
    else { console.log(`✗ [${code}]`); fail++; fails.push(`${label} → ${code}`) }
  }
}

function skipped(label: string, reason: string) { console.log(`  - ${label}  ⏭ ${reason}`); skip++ }
function section(title: string) { console.log(`\n══ ${title} ══`) }
function note(msg: string) { console.log(`  ℹ ${msg}`); docGaps.push(msg) }

console.log(`\n━━━ DOCS: ai-agent.md — auth: API KEY (npm @imbrace/sdk@1.0.4) ━━━`)
console.log(`gateway=${baseUrl}\norg=${organizationId}\n`)

const ts = Date.now()
const state: {
  assistantId: string | null
  folderId: string | null
  fileId: string | null
  embedFileId: string | null
  chatId: string | null
  documentId: string | null
} = { assistantId: null, folderId: null, fileId: null, embedFileId: null, chatId: null, documentId: null }

// ── §1. Assistant CRUD (chatAi) ───────────────────────────────────────────

section("§1. Assistant CRUD (chatAi)")
note("doc-gap: ai-agent.md §1 uses Assistant-suffixed names (`listAssistants`, `getAssistant`, `createAssistant`, `updateAssistant`, `updateAssistantInstructions`, `deleteAssistant`). SDK 1.0.4 exposes AiAgent-suffixed names (`listAiAgents`, `getAiAgent`, `createAiAgent`, `updateAiAgent`, `updateAiAgentInstructions`, `deleteAiAgent`). Renamed in commit 7662405.")

await step("chatAi.listAiAgents (doc says listAssistants)", () => client.chatAi.listAiAgents())

await step("chatAi.createAiAgent (doc says createAssistant)", async () => {
  const a: any = await client.chatAi.createAiAgent({
    name: `SupportBot${ts}`,
    workflow_name: `support_bot_v1_${ts}`,
    provider_id: "system",
    model_id: "Default",
    description: "Handles tier-1 support queries",
  } as any)
  state.assistantId = a?.id ?? a?._id ?? null
  return { id: state.assistantId }
})

if (state.assistantId) {
  await step("chatAi.getAiAgent (doc says getAssistant)", () => client.chatAi.getAiAgent(state.assistantId!))
  await step("chatAi.updateAiAgent (doc says updateAssistant)", () =>
    client.chatAi.updateAiAgent(state.assistantId!, {
      name: `SupportBot v2 ${ts}`,
      workflow_name: `support_bot_v1_${ts}`,
    } as any),
  )
  await step("chatAi.updateAiAgentInstructions (doc says updateAssistantInstructions)", () =>
    client.chatAi.updateAiAgentInstructions(state.assistantId!, "You are a helpful support agent."),
  )
} else {
  skipped("chatAi.getAiAgent / updateAiAgent / updateAiAgentInstructions", "no assistant fixture")
}

// ── §2. Completions (client.ai) ───────────────────────────────────────────

section("§2. Completions (client.ai.complete)")
await step("ai.complete (gpt-4o)", () =>
  client.ai.complete({
    model: "gpt-4o",
    messages: [
      { role: "system", content: "You are a helpful CRM assistant." },
      { role: "user", content: "Summarize: customer reports app crash on launch." },
    ],
  } as any),
)

// ── §3. Document AI ───────────────────────────────────────────────────────

section("§3. Document AI models / processing / file extraction")
await step("chatAi.listDocumentModels", () => client.chatAi.listDocumentModels())

skipped("chatAi.processDocument", "needs a publicly fetchable PDF/image URL — covered in test-document-ai.ts")
skipped("chatAi.uploadAgentFile", "needs binary file fixture")
skipped("chatAi.extractFile", "needs binary file fixture")

// ── §4. Knowledge Hub via boards ──────────────────────────────────────────

section("§4. Knowledge Hub — boards: folders & files (TS uses `client.boards.*Folder*`)")

await step("boards.searchFolders ({ organizationId })", () =>
  (client.boards as any).searchFolders({ organizationId }),
)

await step("boards.createFolder ({ name })", async () => {
  const f: any = await client.boards.createFolder({
    name: `Q1 Reports ${ts}`,
    organization_id: organizationId,
    parent_folder_id: "root",
    source_type: "upload",
  } as any)
  state.folderId = f?._id ?? f?.id ?? null
  return { id: state.folderId }
})

if (state.folderId) {
  await step("boards.updateFolder (rename)", () =>
    (client.boards as any).updateFolder(state.folderId!, { name: `Q1 2025 Reports ${ts}` }),
  )
  await step("boards.searchFiles ({ folderId })", () =>
    (client.boards as any).searchFiles({ folderId: state.folderId! }),
  )
  // boards.getFile / createFile / deleteFiles / uploadFile need a real file_id
  skipped("boards.uploadFile / getFile / createFile / deleteFiles", "needs a real file fixture (covered in test-files.ts)")
  await step("boards.deleteFolders ({ ids })", () =>
    (client.boards as any).deleteFolders({ ids: [state.folderId!] }),
  )
  state.folderId = null  // consumed
} else {
  skipped("boards.updateFolder / searchFiles / deleteFolders", "no folder fixture")
}

// ── §5. OpenAI-compatible client.ai ───────────────────────────────────────

section("§5. OpenAI-compatible client.ai (complete + stream + embed)")

await step("ai.complete (with temperature 0.7)", () =>
  client.ai.complete({
    model: "gpt-4o",
    messages: [
      { role: "system", content: "You are a helpful CRM assistant." },
      { role: "user", content: "Draft a follow-up." },
    ],
    temperature: 0.7,
  } as any),
)

await step("ai.stream (drain ≤4 chunks)", async () => {
  const stream: any = client.ai.stream({
    model: "gpt-4o",
    messages: [{ role: "user", content: "One short sentence about CRM." }],
  } as any)
  let n = 0
  for await (const chunk of stream) {
    n++
    if (n >= 4) break
    void chunk
  }
  return { chunks: n }
})

await step("ai.embed", () =>
  client.ai.embed({
    model: "text-embedding-ada-002",
    input: ["customer complained about billing", "billing issue escalated"],
  } as any),
)

// ── §6. Chat v2 streaming (covered in full-flow-guide; one short call) ────

section("§6. Chat v2 streaming (aiAgent.streamChat)")
if (state.assistantId) {
  await step("aiAgent.streamChat (drain ≤4 chunks)", async () => {
    const res = await client.aiAgent.streamChat({
      assistant_id: state.assistantId!,
      organization_id: organizationId!,
      messages: [{ role: "user", content: "What can you do?" }],
    } as any)
    const reader = (res as any).body?.getReader?.()
    if (!reader) return { drainedChunks: 0 }
    let n = 0, t0 = Date.now()
    while (n < 4 && Date.now() - t0 < 8000) {
      const { done } = await reader.read()
      if (done) break
      n++
    }
    try { reader.cancel() } catch {}
    return { drainedChunks: n }
  })
} else {
  skipped("aiAgent.streamChat", "no assistant fixture")
}

// ── §7. Sub-agent ─────────────────────────────────────────────────────────

section("§7. Sub-agent chat + history")
if (state.assistantId) {
  const sessionId = randomUUID()
  const chatId = randomUUID()
  await step("aiAgent.streamSubAgentChat", async () => {
    const res = await (client.aiAgent as any).streamSubAgentChat({
      assistant_id: state.assistantId!,
      organization_id: organizationId,
      session_id: sessionId,
      chat_id: chatId,
      messages: [{ role: "user", content: "Hi" }],
    })
    const reader = (res as any).body?.getReader?.()
    if (reader) {
      let n = 0, t0 = Date.now()
      while (n < 2 && Date.now() - t0 < 5000) {
        const { done } = await reader.read()
        if (done) break
        n++
      }
      try { reader.cancel() } catch {}
    }
    return { ok: true }
  })
  await step("aiAgent.getSubAgentHistory", () =>
    (client.aiAgent as any).getSubAgentHistory({ session_id: sessionId, chat_id: chatId }),
  )
} else {
  skipped("aiAgent.streamSubAgentChat / getSubAgentHistory", "no assistant fixture")
}

// ── §8. Prompt suggestions ────────────────────────────────────────────────

section("§8. Prompt suggestions")
if (state.assistantId) {
  await step("aiAgent.getAgentPromptSuggestion", () =>
    client.aiAgent.getAgentPromptSuggestion(state.assistantId!),
  )
} else {
  skipped("aiAgent.getAgentPromptSuggestion", "no assistant fixture")
}

// ── §9. Embeddings & Knowledge Base ───────────────────────────────────────

section("§9. Embeddings & Knowledge Base (RAG)")
await step("aiAgent.listEmbeddingFiles", () =>
  (client.aiAgent as any).listEmbeddingFiles({ page: 1, limit: 20 }),
)
skipped("aiAgent.processEmbedding / getEmbeddingFile / previewEmbeddingFile / updateEmbeddingFileStatus / deleteEmbeddingFile / classifyFile",
  "all need an existing embedding file_id; covered partly via test-files.ts upload flow")

// ── §10. Data Board ───────────────────────────────────────────────────────

section("§10. Data Board (aiAgent.suggestFieldTypes)")
await step("aiAgent.suggestFieldTypes", () =>
  (client.aiAgent as any).suggestFieldTypes({
    fields: [
      { name: "created_at", samples: ["2024-01-01", "2024-02-15"] },
      { name: "amount",     samples: [100, 200.5, 999] },
      { name: "is_active",  samples: [true, false, true] },
    ],
  }),
)

// ── §11. Parquet ─────────────────────────────────────────────────────────

section("§11. Parquet")
await step("aiAgent.generateParquet", async () => {
  await (client.aiAgent as any).generateParquet({
    data: [{ id: 1, name: "Alice" }, { id: 2, name: "Bob" }],
    fileName: `users_${ts}`,
    folderName: "exports",
  })
  return { ok: true }
})
await step("aiAgent.listParquetFiles", () => (client.aiAgent as any).listParquetFiles())
await step("aiAgent.deleteParquetFile (cleanup)", () =>
  (client.aiAgent as any).deleteParquetFile(`exports/users_${ts}.parquet`),
)

// ── §12. Distributed Tracing (Tempo) ─────────────────────────────────────

section("§12. Distributed Tracing (Tempo) — backend may return 500 if Tempo URL misconfigured")
note("backend-known-issue: Tempo URL config bug → these methods 500 on app-gatewayv2 (per FIX_PLAN_v1.0.6 §A.1)")
await step("aiAgent.getTraces ({ service, limit, timeRange })", () =>
  (client.aiAgent as any).getTraces({
    service: "ai-agent", limit: 50, timeRange: 3600, orgId: organizationId, details: true,
  }),
)
await step("aiAgent.getTraceServices", () => (client.aiAgent as any).getTraceServices())
await step("aiAgent.getTraceTags", () => (client.aiAgent as any).getTraceTags())
await step("aiAgent.getTraceTagValues ('http.status_code')", () =>
  (client.aiAgent as any).getTraceTagValues("http.status_code"),
)
await step("aiAgent.searchTraceQL", () =>
  (client.aiAgent as any).searchTraceQL(`{ .service.name = "ai-agent" && .http.status = 500 }`),
)
skipped("aiAgent.getTrace", "needs a real trace_id (depends on getTraces returning data)")

// ── §13. Chat Client (auth + chats + messages + votes + documents) ──────

section("§13. Chat Client — auth")
skipped("aiAgent.verifyChatClientCredentials / registerChatClient / getChatClientUser",
  "destructive — would register/verify against external chat-client identity")

section("§13. Chat Client — chats lifecycle")
const chatId = randomUUID()
const msgId  = randomUUID()
await step("aiAgent.createClientChat", async () => {
  const r: any = await (client.aiAgent as any).createClientChat({
    id: chatId,
    message: {
      id: msgId,
      role: "user",
      parts: [{ type: "text", text: "Hello!" }],
    },
    assistantId: state.assistantId ?? "00000000-0000-0000-0000-000000000000",
    organizationId,
  })
  state.chatId = chatId
  return r ?? { id: chatId }
})

await step("aiAgent.listClientChats (limit 20)", () =>
  (client.aiAgent as any).listClientChats({ organization_id: organizationId, limit: 20 }),
)

if (state.chatId) {
  await step("aiAgent.getClientChat", () => (client.aiAgent as any).getClientChat(state.chatId!))
  await step("aiAgent.updateClientChat (visibility=private)",
    () => (client.aiAgent as any).updateClientChat(state.chatId!, { visibility: "private" }),
  )
  await step("aiAgent.generateClientChatTitle",
    () => (client.aiAgent as any).generateClientChatTitle(state.chatId!),
  )
  // streamClientChatStatus returns a Response — drain a couple of chunks
  await step("aiAgent.streamClientChatStatus (drain ≤2 chunks)", async () => {
    const res: any = await (client.aiAgent as any).streamClientChatStatus(state.chatId!)
    const reader = res?.body?.getReader?.()
    if (!reader) return { drained: 0 }
    let n = 0, t0 = Date.now()
    while (n < 2 && Date.now() - t0 < 5000) {
      const { done } = await reader.read()
      if (done) break
      n++
    }
    try { reader.cancel() } catch {}
    return { drainedChunks: n }
  })
} else {
  skipped("getClientChat / updateClientChat / generateClientChatTitle / streamClientChatStatus", "no chat fixture")
}

section("§13. Chat Client — messages")
if (state.chatId) {
  await step("aiAgent.persistClientMessage", () =>
    (client.aiAgent as any).persistClientMessage({ chatId: state.chatId!, content: "Hello again" }),
  )
  await step("aiAgent.listClientMessages", () =>
    (client.aiAgent as any).listClientMessages(state.chatId!),
  )
  // deleteTrailingMessages requires a message_id — skip unless we have one
  skipped("aiAgent.deleteTrailingMessages", "needs a real message_id")
} else {
  skipped("persistClientMessage / listClientMessages", "no chat fixture")
}

section("§13. Chat Client — votes")
if (state.chatId) {
  await step("aiAgent.getVotes", () => (client.aiAgent as any).getVotes(state.chatId!))
  // updateVote requires a real messageId — skip
  skipped("aiAgent.updateVote", "needs a real message_id from a generated assistant reply")
} else {
  skipped("getVotes / updateVote", "no chat fixture")
}

section("§13. Chat Client — documents (AI-generated artifacts)")
await step("aiAgent.createDocument (kind=text)", async () => {
  const d: any = await (client.aiAgent as any).createDocument({ kind: "text", content: `Draft ${ts}` })
  state.documentId = d?.id ?? d?._id ?? null
  return { id: state.documentId }
})

if (state.documentId) {
  await step("aiAgent.getDocument", () => (client.aiAgent as any).getDocument(state.documentId!))
  await step("aiAgent.getDocumentLatest", () => (client.aiAgent as any).getDocumentLatest(state.documentId!))
  await step("aiAgent.getDocumentPublic", () => (client.aiAgent as any).getDocumentPublic(state.documentId!))
  await step("aiAgent.getDocumentSuggestions", () => (client.aiAgent as any).getDocumentSuggestions(state.documentId!))
  await step("aiAgent.deleteDocument (cleanup)", () => (client.aiAgent as any).deleteDocument(state.documentId!))
} else {
  skipped("getDocument / getDocumentLatest / getDocumentPublic / getDocumentSuggestions / deleteDocument", "no document fixture")
}
await step("aiAgent.getDocumentLatestByKind ({ kind: 'text' })", () =>
  (client.aiAgent as any).getDocumentLatestByKind({ kind: "text" }),
)

// ── §14. Admin Guides ───────────────────────────────────────────────────

section("§14. Admin Guides — backend may 500 if assets/guides bundle missing")
note("backend-known-issue: Admin Guides 500 'Guides asset directory missing' on app-gatewayv2 (per FIX_PLAN_v1.0.6 §A.1)")
await step("aiAgent.listAdminGuides", () => (client.aiAgent as any).listAdminGuides())
skipped("aiAgent.getAdminGuide", "needs a known guide filename")

// ── §15. Legacy v1 chat ─────────────────────────────────────────────────

section("§15. Legacy v1 chat")
await step("aiAgent.listChats (limit 20)", () =>
  (client.aiAgent as any).listChats({ organization_id: organizationId, limit: 20 }),
)
skipped("aiAgent.getChat / deleteChat", "needs a real legacy v1 chat_id")

// ── Cleanup chat client + assistant ─────────────────────────────────────

section("cleanup")
if (state.chatId) {
  await step("aiAgent.deleteClientChat (cleanup)",
    () => (client.aiAgent as any).deleteClientChat(state.chatId!),
  )
}
if (state.assistantId) {
  await step("chatAi.deleteAiAgent (cleanup; doc says deleteAssistant)",
    () => client.chatAi.deleteAiAgent(state.assistantId!),
  )
}

// ── Summary ─────────────────────────────────────────────────────────────

console.log(`\n━━━ Summary (ai-agent / API key) ━━━`)
console.log(`pass=${pass}  fail=${fail}  skip=${skip}`)
if (fails.length) {
  console.log("Failures:")
  fails.forEach(f => console.log(`  - ${f}`))
}
if (docGaps.length) {
  console.log("Doc / backend gaps:")
  docGaps.forEach(g => console.log(`  - ${g}`))
}
process.exit(fail > 0 ? 1 : 0)
