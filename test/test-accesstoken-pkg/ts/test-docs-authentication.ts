/**
 * Mirrors website/public/sdk/authentication.md against @imbrace/sdk@1.0.4
 * (npm) — Access Token auth.
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

let pass = 0, fail = 0, skip = 0
const fails: string[] = []
const docGaps: string[] = []

async function step(label: string, fn: () => Promise<unknown>, expectFail = false) {
  process.stdout.write(`  • ${label} ... `)
  try {
    const r = await fn()
    const summary = JSON.stringify(r ?? {}).slice(0, 90)
    if (expectFail) { console.log(`unexpected pass: ${summary}`); fail++; fails.push(`${label} → unexpected pass`) }
    else { console.log(`✓ ${summary}`); pass++ }
  } catch (err: any) {
    const code = err?.statusCode ?? err?.message ?? "ERR"
    if (expectFail) { console.log(`✓ (expected fail [${code}])`); pass++ }
    else { console.log(`✗ [${code}]`); fail++; fails.push(`${label} → ${code}`) }
  }
}
function skipped(label: string, reason: string) { console.log(`  - ${label}  ⏭ ${reason}`); skip++ }
function section(title: string) { console.log(`\n══ ${title} ══`) }
function note(msg: string) { console.log(`  ℹ ${msg}`); docGaps.push(msg) }

console.log(`\n━━━ DOCS: authentication.md — auth: ACCESS TOKEN (npm @imbrace/sdk@1.0.4) ━━━`)
console.log(`gateway=${baseUrl}\norg=${organizationId}\n`)

const tokenClient = new ImbraceClient({ accessToken, organizationId, baseUrl, timeout: 10_000 })

section("§1. API Key init")
skipped("new ImbraceClient({ apiKey })", "tested in test-api-pkg")

section("§2. Access Token init + first call")
await step("tokenClient.platform.getMe()", () => tokenClient.platform.getMe())

section("§3. OTP login flow")
skipped("client.requestOtp(email)", "destructive")
skipped("client.loginWithOtp(email, otp)", "destructive")
skipped("client.auth.exchangeAccessToken(orgId)", "depends on loginWithOtp")

section("§4. Password login")
skipped("client.login(email, password)", "destructive")

section("§5. Token management")
await step("setAccessToken + clearAccessToken", async () => {
  tokenClient.setAccessToken("acc_dummy_token")
  tokenClient.clearAccessToken()
  // restore real token so cleanup doesn't break
  tokenClient.setAccessToken(accessToken)
  return { ok: true }
})

console.log(`\n━━━ Summary (authentication / Access Token) ━━━`)
console.log(`pass=${pass}  fail=${fail}  skip=${skip}`)
if (fails.length) { console.log("Failures:"); fails.forEach(f => console.log(`  - ${f}`)) }
if (docGaps.length) { console.log("Doc gaps:"); docGaps.forEach(g => console.log(`  - ${g}`)) }
process.exit(fail > 0 ? 1 : 0)
