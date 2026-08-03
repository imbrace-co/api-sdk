/**
 * Exhaustive fileService resource verification — pulls @imbrace/sdk from npm.
 * Auth: API Key.
 *
 * IMPORTANT: As of the test snapshot, the fileService is NOT deployed on the
 * default gateway (`app-gatewayv2.imbrace.co`). All endpoints return 404. This
 * test exposes the issue — failures here are BACKEND OPS (service routing) not
 * SDK bugs. To run successfully, point IMBRACE_GATEWAY_URL to a gateway with
 * fileService deployed, OR override the service URL.
 *
 * Covers the full file lifecycle:
 *   uploadFile → listFiles → searchFiles → getFile → downloadFile →
 *   downloadFileByName → getFileHtmlContent → getFileDataContent →
 *   updateFileDataContent → deleteFile
 *
 * Plus: extractFile, getPublicDownloadUrl
 *
 * Skipped:
 *   - uploadAgentFile (needs agent fixture, covered in test-document-ai.ts)
 *   - deleteAllFiles  (destructive — admin only, would wipe all org files)
 */
import "dotenv/config"
import { ImbraceClient } from "@imbrace/sdk"
import { File, Blob } from "node:buffer"

const apiKey         = process.env.IMBRACE_API_KEY
const organizationId = process.env.IMBRACE_ORGANIZATION_ID
const baseUrl        = process.env.IMBRACE_GATEWAY_URL ?? "https://app-gatewayv2.imbrace.co"

if (!apiKey || !organizationId) {
  console.error("Missing IMBRACE_API_KEY or IMBRACE_ORGANIZATION_ID")
  process.exit(1)
}

const client = new ImbraceClient({ apiKey, organizationId, baseUrl, timeout: 60_000 })
const fs = client.fileService

let pass = 0, fail = 0, skip = 0
const fails: string[] = []

async function step(label: string, fn: () => Promise<any>, expectFail = false) {
  process.stdout.write(`  • ${label} ... `)
  const t0 = Date.now()
  try {
    const result = await fn()
    const dt = Date.now() - t0
    const summary = JSON.stringify(result ?? {}).slice(0, 120)
    if (expectFail) { console.log(`unexpected pass [${dt}ms]: ${summary}`); fail++; fails.push(`${label} → unexpected pass`) }
    else { console.log(`✓ [${dt}ms] ${summary}`); pass++ }
  } catch (err: any) {
    const detail = err?.message ?? String(err)
    if (expectFail) { console.log(`✓ (expected fail [${detail.slice(0, 200)}])`); pass++ }
    else { console.log(`✗ ${detail.slice(0, 300)}`); fail++; fails.push(`${label} → ${detail.slice(0, 300)}`) }
  }
}

function skipped(label: string, reason: string) {
  console.log(`  - ${label}  ⏭ ${reason}`); skip++
}

function section(title: string) { console.log(`\n══ ${title} ══`) }

console.log(`\n━━━ fileService — auth: API KEY (npm @imbrace/sdk) ━━━`)
console.log(`gateway=${baseUrl}\norg=${organizationId}`)

// Build a small in-memory test file
const stamp = Date.now()
const fileName = `sdk-test-${stamp}.txt`
const fileContent = `SDK test file created at ${new Date().toISOString()}\nLine 2\nLine 3 — auto-cleanup`

// ── 1. List / search (read-only) ────────────────────────────────────────────
section("Read-only list / search")
await step("listFiles({content:false})", () => fs.listFiles({ content: false }))
await step("searchFiles('*.txt')", () => fs.searchFiles("*.txt", { content: false }))

// ── 2. Upload lifecycle ─────────────────────────────────────────────────────
section("Upload lifecycle")
let createdFileId: string | null = null

await step("uploadFile(text)", async () => {
  const file = new File([fileContent], fileName, { type: "text/plain" })
  const form = new FormData()
  form.append("file", file as any)
  const r: any = await fs.uploadFile(form as any)
  createdFileId = r._id ?? r.id ?? r.fileId ?? r.file_id
  return { id: createdFileId, name: r.name ?? r.filename, size: r.size }
})

if (createdFileId) {
  await step("getFile(createdId)", async () => {
    const r: any = await fs.getFile(createdFileId!)
    return { id: r._id ?? r.id, name: r.name ?? r.filename, size: r.size }
  })

  await step("downloadFile(createdId)", async () => {
    const res = await fs.downloadFile(createdFileId!)
    const text = await res.text()
    return { length: text.length, preview: text.slice(0, 50) }
  })

  await step("downloadFile(attachment=true)", async () => {
    const res = await fs.downloadFile(createdFileId!, { attachment: true })
    return { contentType: res.headers.get("content-type") }
  })

  await step("downloadFileByName(createdId, fileName)", async () => {
    const res = await fs.downloadFileByName(createdFileId!, fileName)
    return { ok: res.ok }
  })

  await step("getFileHtmlContent", async () => {
    const res = await fs.getFileHtmlContent(createdFileId!)
    return { ok: res.ok, contentType: res.headers.get("content-type") }
  })

  await step("getFileDataContent", () => fs.getFileDataContent(createdFileId!))

  await step("updateFileDataContent (rewrite)", () =>
    fs.updateFileDataContent(createdFileId!, "Updated content.\nLine 2."))

  await step("getFileDataContent (after update)", async () => {
    const r = await fs.getFileDataContent(createdFileId!)
    return { content: (r as any).content?.slice(0, 60) }
  })

  await step("getPublicDownloadUrl", async () => {
    const url = fs.getPublicDownloadUrl(createdFileId!)
    return { url }
  })

  await step("searchFiles(fileName)", async () => {
    const r = await fs.searchFiles(fileName, { content: false })
    return { count: Array.isArray(r) ? r.length : 0 }
  })
} else {
  skipped("getFile / downloadFile / getFileDataContent / updateFileDataContent / search", "uploadFile did not return a file id")
}

// ── 3. Extract ──────────────────────────────────────────────────────────────
section("Extract (PDF/text)")
await step("extractFile(text)", async () => {
  const file = new File([`Sample for extraction ${stamp}`], `extract-${stamp}.txt`, { type: "text/plain" })
  const r: any = await fs.extractFile(file as any)
  return { message: r?.message }
})

// ── 4. Cleanup ──────────────────────────────────────────────────────────────
section("Cleanup")
if (createdFileId) {
  await step("deleteFile(createdId)", () => fs.deleteFile(createdFileId!))
} else {
  skipped("deleteFile", "no createdFileId fixture")
}

// ── 5. Skipped ──────────────────────────────────────────────────────────────
section("Skipped")
skipped("uploadAgentFile", "needs agent fixture")
skipped("deleteAllFiles", "destructive admin op")

// ── Summary ─────────────────────────────────────────────────────────────────
console.log(`\n━━━ Summary ━━━`)
console.log(`pass=${pass}  fail=${fail}  skip=${skip}`)
if (fails.length) {
  console.log("Failures:")
  for (const f of fails) console.log(`  - ${f}`)
}
process.exit(fail > 0 ? 1 : 0)
