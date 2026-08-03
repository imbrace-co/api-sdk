/**
 * Mirrors website/public/sdk/quick-start.md against @imbrace/sdk@1.0.4 (npm)
 * — Access Token auth.
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

let pass = 0, fail = 0
const fails: string[] = []

async function step(label: string, fn: () => Promise<unknown>) {
  process.stdout.write(`  • ${label} ... `)
  try {
    const r = await fn()
    console.log(`✓ ${JSON.stringify(r ?? {}).slice(0, 90)}`); pass++
  } catch (err: any) {
    const code = err?.statusCode ?? err?.message ?? "ERR"
    console.log(`✗ [${code}]`); fail++; fails.push(`${label} → ${code}`)
  }
}
function section(title: string) { console.log(`\n══ ${title} ══`) }

console.log(`\n━━━ DOCS: quick-start.md — auth: ACCESS TOKEN (npm @imbrace/sdk@1.0.4) ━━━\n`)

section("§1. Initialize client (accessToken)")
const client = new ImbraceClient({ accessToken, organizationId, baseUrl, timeout: 8_000 })

section("§2. boards.list — verify connectivity")
await step("boards.list", () => client.boards.list({}))

console.log(`\n━━━ Summary (quick-start / Access Token) ━━━`)
console.log(`pass=${pass}  fail=${fail}  skip=0`)
if (fails.length) { console.log("Failures:"); fails.forEach(f => console.log(`  - ${f}`)) }
process.exit(fail > 0 ? 1 : 0)
