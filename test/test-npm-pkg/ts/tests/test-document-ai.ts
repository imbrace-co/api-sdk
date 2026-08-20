import { pathToFileURL } from "url"
import { client, runTestSection, logResult } from "../utils/utils.js"

const SAMPLE_URL = "https://app-gatewayv2.imbrace.co/files/download/118615471-5b33f600-b7f3-11eb-94a1-78e635e66558.png"

async function testDocumentAi() {
  console.log("\n🚀 Testing Document AI Resource (high-level wrapper)...")

  const orgId = process.env.IMBRACE_ORGANIZATION_ID || ""

  // [1] listAgents — filter by agent_type=document_ai
  await runTestSection("documentAi.listAgents", async () => {
    const agents = await client.documentAi.listAgents()
    logResult("count", agents.length)
    logResult("first 3", agents.slice(0, 3).map(a => a.name).join(", "))
  })

  const agents = await client.documentAi.listAgents().catch(() => [])

  // [2] getAgent — first one
  if (agents.length > 0) {
    const firstId = ((agents[0] as any).id ?? (agents[0] as any).assistant_id ?? agents[0]._id) as string
    await runTestSection(`documentAi.getAgent(${firstId})`, async () => {
      const detail = await client.documentAi.getAgent(firstId)
      logResult("name",  detail.name)
      logResult("model", detail.model_id)
    })
  }

  // [3] process — explicit model (no agent_id)
  await runTestSection("documentAi.process (model_name only)", async () => {
    const res = await client.documentAi.process({
      url: SAMPLE_URL,
      organizationId: orgId,
      modelName: "gpt-4o",
    })
    logResult("success",   res.success)
    logResult("data keys", Object.keys(res.data || {}).join(", "))
  })

  // [4] suggestSchema — meta-prompt
  await runTestSection("documentAi.suggestSchema", async () => {
    const res = await client.documentAi.suggestSchema({
      url: SAMPLE_URL,
      organizationId: orgId,
    })
    logResult("success",   res.success)
    logResult("data keys", Object.keys(res.data || {}).join(", "))
  })

  console.log("\n✅ Document AI Resource Testing Completed.")
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  testDocumentAi().catch(console.error)
}

export { testDocumentAi }
