/**
 * Mirrors website/public/sdk/authentication.md against @imbrace/sdk@1.0.4
 * (npm) — API-key auth.
 *
 * Covers: API-key/access-token init, OTP flow (destructive — skipped),
 * password login (destructive — skipped), exchangeAccessToken, token
 * management (setAccessToken / clearAccessToken).
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

console.log(`\n━━━ DOCS: authentication.md — auth: API KEY (npm @imbrace/sdk@1.0.4) ━━━`)
console.log(`gateway=${baseUrl}\norg=${organizationId}\n`)

note("doc-clarification: authentication.md says \"You never pass organizationId/organization_id to the SDK\". Tests do pass it because some endpoints still require x-organization-id header. SDK accepts both.")

section("§1. API Key init + first call")
const apiKeyClient = new ImbraceClient({ apiKey, organizationId, baseUrl, timeout: 10_000 })
await step("apiKeyClient.platform.getMe()", () => apiKeyClient.platform.getMe())

section("§2. Access Token init")
note("doc covers `new ImbraceClient({ accessToken: 'acc_...' })` form. Tested in test-accesstoken-pkg/ts/* — skipped here because we're in API-key pkg")
skipped("new ImbraceClient({ accessToken })", "tested in test-accesstoken-pkg")

section("§3. OTP login flow")
skipped("client.requestOtp(email)", "destructive — would send a real OTP email")
skipped("client.loginWithOtp(email, otp)", "destructive — needs a real OTP from inbox")
skipped("client.auth.exchangeAccessToken(orgId)", "depends on a successful loginWithOtp first")

section("§4. Password login")
skipped("client.login(email, password)", "destructive — needs real credentials")

section("§5. Token management (setAccessToken / clearAccessToken)")
await step("setAccessToken('acc_dummy') then clearAccessToken()", async () => {
  apiKeyClient.setAccessToken("acc_dummy_token")
  apiKeyClient.clearAccessToken()
  return { ok: true }
})

console.log(`\n━━━ Summary (authentication / API key) ━━━`)
console.log(`pass=${pass}  fail=${fail}  skip=${skip}`)
if (fails.length) { console.log("Failures:"); fails.forEach(f => console.log(`  - ${f}`)) }
if (docGaps.length) { console.log("Doc gaps:"); docGaps.forEach(g => console.log(`  - ${g}`)) }
process.exit(fail > 0 ? 1 : 0)
