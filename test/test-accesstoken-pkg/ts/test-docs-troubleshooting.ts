/**
 * Mirrors website/public/guides/troubleshooting.md against @imbrace/sdk@1.0.4
 * (npm) — Access Token auth.
 */
import "dotenv/config"
import { ImbraceClient } from "@imbrace/sdk"

const accessToken    = process.env.IMBRACE_ACCESS_TOKEN
const organizationId = process.env.IMBRACE_ORGANIZATION_ID
const baseUrl        = process.env.IMBRACE_GATEWAY_URL ?? "https://app-gatewayv2.imbrace.co"

if (!accessToken || !organizationId) { console.error("Missing creds"); process.exit(1) }

const client = new ImbraceClient({ accessToken, organizationId, baseUrl, timeout: 8_000 })

let pass = 0, fail = 0
const fails: string[] = []

async function step(label: string, fn: () => Promise<unknown>, expectFail = false) {
  process.stdout.write(`  • ${label} ... `)
  try {
    const r = await fn()
    if (expectFail) { console.log(`unexpected pass: ${JSON.stringify(r ?? {}).slice(0, 60)}`); fail++; fails.push(`${label} → unexpected pass`) }
    else { console.log(`✓ ${JSON.stringify(r ?? {}).slice(0, 60)}`); pass++ }
  } catch (err: any) {
    const code = err?.statusCode ?? err?.message ?? "ERR"
    if (expectFail) { console.log(`✓ (expected fail [${code}])`); pass++ }
    else { console.log(`✗ [${code}]`); fail++; fails.push(`${label} → ${code}`) }
  }
}

console.log(`\n━━━ DOCS: guides/troubleshooting.md — auth: ACCESS TOKEN (npm @imbrace/sdk@1.0.4) ━━━\n`)
console.log("══ §channel.list — doc claims missing `type` triggers 400 ══")
await step("channel.list() — expected 400 per doc",
  () => client.channel.list({} as any), /* expectFail */ true)
await step("channel.list({ type: 'web' }) — should work",
  () => client.channel.list({ type: "web" } as any))

console.log(`\n━━━ Summary (troubleshooting / Access Token) ━━━`)
console.log(`pass=${pass}  fail=${fail}  skip=0`)
if (fails.length) { console.log("Failures:"); fails.forEach(f => console.log(`  - ${f}`)) }
process.exit(fail > 0 ? 1 : 0)
