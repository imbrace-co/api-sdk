/**
 * Mirrors website/public/sdk/integrations.md against @imbrace/sdk@1.0.4 (npm)
 * — Access Token auth. See test-api-pkg/ts/test-docs-integrations.ts for
 * commentary.
 */
import "dotenv/config"
import { ImbraceClient } from "@imbrace/sdk"

const accessToken    = process.env.IMBRACE_ACCESS_TOKEN
const organizationId = process.env.IMBRACE_ORGANIZATION_ID
const baseUrl        = process.env.IMBRACE_GATEWAY_URL ?? "https://app-gatewayv2.imbrace.co"

if (!accessToken || !organizationId) {
  console.error("Missing IMBRACE_ACCESS_TOKEN or IMBRACE_ORGANIZATION_ID")
  process.exit(1)
}

const client = new ImbraceClient({ accessToken, organizationId, baseUrl, timeout: 15_000 })

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

console.log(`\n━━━ DOCS: integrations.md — auth: ACCESS TOKEN (npm @imbrace/sdk@1.0.4) ━━━`)
console.log(`gateway=${baseUrl}\norg=${organizationId}\n`)

section("§1. React singleton — accept undefined accessToken without throwing")
await step("new ImbraceClient({ accessToken: undefined })", async () => {
  const c = new ImbraceClient({ accessToken: undefined as any })
  return { ok: typeof c === "object" }
})

section("§2. React data hook — marketplace.listProducts({ category })")
note("backend-known-issue: marketplace endpoint may timeout on app-gatewayv2 (FIX_PLAN_v1.0.6 §A.1)")
await step("marketplace.listProducts({ category: 'electronics' })",
  () => (client.marketplace as any).listProducts({ category: "electronics" }))

section("§3. Next.js API route GET/POST")
await step("marketplace.listProducts (GET)", () => (client.marketplace as any).listProducts({}))
skipped("marketplace.createProduct (POST)", "destructive — would create a real marketplace product")

section("§4. Node CLI script — contacts.list({ limit: 1000 })")
note("backend-known-issue: contacts/channel-service may timeout on app-gatewayv2")
await step("contacts.list ({ limit: 1000 })", () => client.contacts.list({ limit: 1000 } as any))

section("§5. OTP login flow")
skipped("client.requestOtp(email)", "destructive — would send a real OTP email")
skipped("client.loginWithOtp(email, otp)", "destructive — needs a real OTP from inbox")

console.log(`\n━━━ Summary (integrations / Access Token) ━━━`)
console.log(`pass=${pass}  fail=${fail}  skip=${skip}`)
if (fails.length) { console.log("Failures:"); fails.forEach(f => console.log(`  - ${f}`)) }
if (docGaps.length) { console.log("Doc / backend gaps:"); docGaps.forEach(g => console.log(`  - ${g}`)) }
process.exit(fail > 0 ? 1 : 0)
