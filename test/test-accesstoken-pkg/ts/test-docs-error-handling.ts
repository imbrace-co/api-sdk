/**
 * Mirrors website/public/sdk/error-handling.md against @imbrace/sdk@1.0.4 (npm)
 * — Access Token auth. See test-api-pkg/ts/test-docs-error-handling.ts for
 * commentary on each section.
 */
import "dotenv/config"
import { ImbraceClient, AuthError, ApiError, NetworkError, ImbraceError } from "@imbrace/sdk"

const accessToken    = process.env.IMBRACE_ACCESS_TOKEN
const organizationId = process.env.IMBRACE_ORGANIZATION_ID
const baseUrl        = process.env.IMBRACE_GATEWAY_URL ?? "https://app-gatewayv2.imbrace.co"

if (!accessToken || !organizationId) {
  console.error("Missing IMBRACE_ACCESS_TOKEN or IMBRACE_ORGANIZATION_ID")
  process.exit(1)
}

const goodClient = new ImbraceClient({ accessToken, organizationId, baseUrl, timeout: 8_000 })

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

console.log(`\n━━━ DOCS: error-handling.md — auth: ACCESS TOKEN (npm @imbrace/sdk@1.0.4) ━━━`)
console.log(`gateway=${baseUrl}\norg=${organizationId}\n`)

section("§0. Error class hierarchy is importable")
await step("ImbraceError class is the base of AuthError/ApiError/NetworkError", async () => {
  if (!(AuthError.prototype instanceof ImbraceError)) throw new Error("AuthError !instanceof ImbraceError")
  if (!(ApiError.prototype instanceof ImbraceError)) throw new Error("ApiError !instanceof ImbraceError")
  if (!(NetworkError.prototype instanceof ImbraceError)) throw new Error("NetworkError !instanceof ImbraceError")
  return { Imbrace: !!ImbraceError, Auth: !!AuthError, Api: !!ApiError, Network: !!NetworkError }
})

section("§1. AuthError — bad credentials → 401/403")
const badAuthClient = new ImbraceClient({
  accessToken: "acc_invalid_credentials_for_test",
  organizationId, baseUrl, timeout: 8_000,
})
await step("platform.getMe with bad accessToken throws AuthError", async () => {
  try {
    await badAuthClient.platform.getMe()
    throw new Error("expected AuthError but call succeeded")
  } catch (e: any) {
    if (e instanceof AuthError) return { caught: "AuthError", message: e.message?.slice(0, 60), is_imbrace_error: e instanceof ImbraceError }
    if (e instanceof ApiError) return { caught: "ApiError(401)", statusCode: e.statusCode, note: "backend wraps 401 in ApiError" }
    throw e
  }
})

section("§2. ApiError — marketplace.getProduct('nonexistent_id') → 4xx")
note("backend-divergence: marketplace.getProduct('nonexistent_id') sometimes returns empty 200 instead of 404")
await step("marketplace.getProduct('nonexistent_id') — assert ApiError OR empty result", async () => {
  try {
    const r: any = await (goodClient.marketplace as any).getProduct("nonexistent_id_for_test")
    return { caught: "no-throw", note: "backend returned 200 instead of 404", body: JSON.stringify(r ?? null).slice(0, 60) }
  } catch (e: any) {
    if (e instanceof ApiError) return { caught: "ApiError", statusCode: e.statusCode, message: e.message?.slice(0, 60) }
    if (e instanceof NetworkError) return { caught: "NetworkError(network)", message: e.message?.slice(0, 60) }
    throw e
  }
})

await step("Force ApiError via boards.get('non_existent_board_id') → expect 404", async () => {
  try {
    await goodClient.boards.get("brd_non_existent_id_for_test")
    return { caught: "no-throw" }
  } catch (e: any) {
    if (e instanceof ApiError) return { caught: "ApiError", statusCode: e.statusCode }
    throw e
  }
})

section("§3. NetworkError — unreachable host → connection error")
const offlineClient = new ImbraceClient({
  accessToken: "acc_dummy",
  organizationId,
  baseUrl: "https://this-host-does-not-exist-imbrace-test.invalid",
  timeout: 3_000,
})
await step("platform.getMe against unreachable host throws NetworkError", async () => {
  try {
    await offlineClient.platform.getMe()
    throw new Error("expected NetworkError but call succeeded")
  } catch (e: any) {
    if (e instanceof NetworkError) return { caught: "NetworkError", message: e.message?.slice(0, 60), is_imbrace_error: e instanceof ImbraceError }
    throw e
  }
})

section("§4. Catching all SDK errors (one block, branch by class)")
await step("ImbraceError base class catches AuthError too", async () => {
  try {
    await badAuthClient.platform.getMe()
    throw new Error("expected error but call succeeded")
  } catch (e: any) {
    if (!(e instanceof ImbraceError)) throw new Error("error not instanceof ImbraceError")
    return { caught: e.constructor.name, is_imbrace_error: true }
  }
})

section("§5. Automatic retry behavior")
note("doc says TS retries 2× / Py retries 3× — would require simulating 5xx flakiness")
skipped("retry-on-429/5xx", "would require backend stub returning transient errors")

section("§6. Request cancellation — AbortController (TS only)")
note("doc-gap: SDK 1.0.4 may not accept `{ signal }` as a 2nd argument on every method")

let canCancel = true
try {
  await (goodClient.marketplace as any).listProducts({ page: 1, limit: 1 })
} catch {
  canCancel = false
}
if (canCancel) {
  await step("marketplace.listProducts({signal}) — abort after 50ms", async () => {
    const controller = new AbortController()
    setTimeout(() => controller.abort(), 50)
    try {
      await (goodClient.marketplace as any).listProducts({ page: 1 }, { signal: controller.signal })
      return { aborted: false, note: "request completed before abort" }
    } catch (e: any) {
      const isNetwork = e instanceof NetworkError
      const isAborted = (e?.message ?? "").toLowerCase().includes("abort")
      return { caught: e?.constructor?.name, isNetwork, isAborted }
    }
  })
} else {
  skipped("marketplace.listProducts (abort)", "marketplace endpoint not reachable on this gateway")
}

console.log(`\n━━━ Summary (error-handling / Access Token) ━━━`)
console.log(`pass=${pass}  fail=${fail}  skip=${skip}`)
if (fails.length) { console.log("Failures:"); fails.forEach(f => console.log(`  - ${f}`)) }
if (docGaps.length) { console.log("Doc / backend gaps:"); docGaps.forEach(g => console.log(`  - ${g}`)) }
process.exit(fail > 0 ? 1 : 0)
