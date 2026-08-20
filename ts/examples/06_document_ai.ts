/**
 * Document AI example — list, create, process, delete a Document AI agent.
 *
 * Document AI agents extract structured JSON from unstructured documents
 * (PDFs, images, scanned forms). Each agent has a schema, instructions, and
 * an LLM model. Under the hood the resource wraps the AI Agent CRUD endpoints
 * filtered by `agent_type: "document_ai"`, plus `/v3/ai/document/` for
 * processing.
 */
import { ImbraceClient } from "../src/index.js"

const client = new ImbraceClient({
  accessToken: process.env.IMBRACE_ACCESS_TOKEN!,
  organizationId: process.env.IMBRACE_ORG_ID,
  env: "stable",
})

// 1. List Document AI agents (filter by `documentAiOnly: true` to skip generic AI agents)
const agents = await client.documentAi.listAgents({ documentAiOnly: true })
console.log("Document AI agents:", agents.length)

// 2. Create an agent — pass `schema` to define extraction fields
const agent = await client.documentAi.createAgent({
  name: "Invoice Extractor",
  instructions: "Extract invoice fields. Dates as YYYY-MM-DD.",
  model_id: "gpt-4o",
  schema: {
    invoice_number: { type: "string", description: "Invoice ID" },
    total:          { type: "number" },
    date:           { type: "string", format: "date" },
  },
})
const agentId = agent._id!
console.log("Created agent:", agentId)

// 3. Process a document — looks up the agent's model + instructions automatically
const result = await client.documentAi.process({
  agentId,
  url: "https://example.com/invoice.pdf",
  organizationId: process.env.IMBRACE_ORG_ID ?? "org_xxx",
})
console.log("Extracted data:", result.data)

// 4. Atomic end-to-end creation: Board + UseCase + AI Agent linked together
//    Returns { board_id, ai_agent_id, channel_id, usecase_id, ... }
const full = await client.documentAi.createFull({
  name: "Receipt Pipeline",
  instructions: "Step 1: Extract Data...",
  schemaFields: [
    { name: "vendor", type: "ShortText", is_identifier: true },
    { name: "total",  type: "Number" },
  ],
  modelId: "gpt-4o",
  providerId: "system",
  description: "End-to-end receipt extractor",
})
console.log("Full pipeline IDs:", {
  board_id:    full.board_id,
  ai_agent_id: full.ai_agent_id,
  channel_id:  full.channel_id,
})

// 5. Cleanup
await client.documentAi.deleteAgent(agentId)
console.log("Deleted agent:", agentId)
