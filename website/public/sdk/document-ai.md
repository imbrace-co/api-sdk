# Document AI

Document AI uses vision models (e.g. GPT-4o) to extract structured data from PDFs and images — invoices, forms, receipts, contracts, or any document with visible text.

The SDK exposes two namespaces:
- **`client.chatAi` / `client.chat_ai`** — direct document processing and model listing
- **`client.documentAi` / `client.document_ai`** — agent-based document processing with schema management, agent CRUD, and end-to-end orchestration

Initialize the client first (see [Installation](/sdk/installation.md) or [Quick Start](/sdk/quick-start.md)).

---

## `client.chatAi` — Processing Documents

### Listing available models

**TypeScript**

```typescript
const models = await client.chatAi.listDocumentModels();
```

**Python**

```python
models = client.chat_ai.list_document_models()
```

### Direct document processing

**TypeScript**

```typescript
const result = await client.chatAi.processDocument({
  modelName: "gpt-4o",
  url: "https://example.com/invoice.pdf",
  organizationId: "org_xxx",
});
```

**Python**

```python
result = client.chat_ai.process_document(
    model_name="gpt-4o",
    url="https://example.com/invoice.pdf",
    organization_id="org_xxx",
)
```

#### Parameter reference

| Parameter | TS field | Python param | Type | Required |
|---|---|---|---|---|
| Model name | `modelName` | `model_name` | `string` / `str` | Yes |
| Document URL | `url` | `url` | `string` / `str` | Yes |
| Organization ID | `organizationId` | `organization_id` | `string` / `str` | Yes |
| Board ID | `boardId` | `board_id` | `string` / `str` | No |
| Language | `language` | `language` | `string` / `str` | No |
| Additional instructions | `additionalInstructions` | `additional_instructions` | `string` / `str` | No |
| Additional document instructions | `additionalDocumentInstructions` | `additional_document_instructions` | `string` / `str` | No |
| Process model name | `processModelName` | `process_model_name` | `string` / `str` | No |
| File URL to fill | `fileUrlToFill` | `file_url_to_fill` | `string` / `str` | No |
| Tools | `tools` | `tools` | `Record<string, unknown>[]` / `List[Dict]` | No |
| UTC offset | `utc` | `utc` | `number` / `int` | No |
| Chunk size | `chunkSize` | `chunk_size` | `number` / `int` | No |
| Max concurrent | `maxConcurrent` | `max_concurrent` | `number` / `int` | No |
| Max retries | `maxRetries` | `max_retries` | `number` / `int` | No |
| Enhanced processing | `useEnhancedProcessing` | `use_enhanced_processing` | `boolean` / `bool` | No |

#### PDF form filling example

**TypeScript**

```typescript
const result = await client.chatAi.processDocument({
  modelName: "gpt-4o",
  url: "https://example.com/blank-invoice.pdf",
  organizationId: "org_xxx",
  fileUrlToFill: "https://example.com/blank-invoice.pdf",
  language: "en",
});

if (result.success && result.data.filledPdfUrl) {
  console.log("Filled PDF:", result.data.filledPdfUrl);
}
```

**Python**

```python
result = client.chat_ai.process_document(
    model_name="gpt-4o",
    url="https://example.com/blank-invoice.pdf",
    organization_id="org_xxx",
    file_url_to_fill="https://example.com/blank-invoice.pdf",
    language="en",
)

if result["success"] and result["data"].get("filledPdfUrl"):
    print("Filled PDF:", result["data"]["filledPdfUrl"])
```

---

## `client.documentAi` — Agent CRUD

Document AI Agents store extraction schema, instructions, and model configuration for repeated use.

### List agents

**TypeScript**

```typescript
// All agents
const agents = await client.documentAi.listAgents();

// Filter by name
const filtered = await client.documentAi.listAgents({ nameContains: "Invoice" });

// Document AI agents only (created via createFull or webapp)
const docAiAgents = await client.documentAi.listAgents({ documentAiOnly: true });
```

**Python**

```python
# All agents
agents = client.document_ai.list_agents()

# Filter by name
filtered = client.document_ai.list_agents(name_contains="Invoice")

# Document AI agents only
doc_ai_agents = client.document_ai.list_agents(document_ai_only=True)
```

### Get agent

**TypeScript**

```typescript
const agent = await client.documentAi.getAgent("agent_id");
```

**Python**

```python
agent = client.document_ai.get_agent("agent_id")
```

### Create agent

**TypeScript**

```typescript
const agent = await client.documentAi.createAgent({
  name: "Invoice Extractor",
  instructions: "Extract invoice fields. Dates as YYYY-MM-DD.",
  model_id: "gpt-4o",
  schema: {
    invoice_number: { type: "string", description: "Invoice ID" },
    total:          { type: "number" },
    date:           { type: "string", format: "date" },
  },
});
```

**Python**

```python
agent = client.document_ai.create_agent(
    name="Invoice Extractor",
    instructions="Extract invoice fields. Dates as YYYY-MM-DD.",
    model_id="gpt-4o",
    schema={
        "invoice_number": {"type": "string", "description": "Invoice ID"},
        "total":          {"type": "number"},
        "date":           {"type": "string", "format": "date"},
    },
)
```

### Update agent

**TypeScript**

```typescript
await client.documentAi.updateAgent("agent_id", {
  name: "Invoice Extractor v2",
  instructions: "Updated extraction logic.",
});
```

**Python**

```python
client.document_ai.update_agent("agent_id", {
    "name": "Invoice Extractor v2",
    "instructions": "Updated extraction logic.",
})
```

### Delete agent

**TypeScript**

```typescript
await client.documentAi.deleteAgent("agent_id");
```

**Python**

```python
client.document_ai.delete_agent("agent_id")
```

---

## `client.documentAi` — Processing with an Agent

Process a document using a configured agent (looks up model + instructions from the agent).

**TypeScript**

```typescript
const result = await client.documentAi.process({
  agentId: "agent_id",
  url: "https://example.com/invoice.pdf",
  organizationId: "org_xxx",
});
```

**Python**

```python
result = client.document_ai.process(
    agent_id="agent_id",
    url="https://example.com/invoice.pdf",
    organization_id="org_xxx",
)
```

You can also override the agent's model or instructions:

**TypeScript**

```typescript
const result = await client.documentAi.process({
  agentId: "agent_id",
  url: "https://example.com/invoice.pdf",
  organizationId: "org_xxx",
  modelName: "gpt-4o",          // override agent's model
  instructions: "Custom prompt", // override agent's instructions
});
```

**Python**

```python
result = client.document_ai.process(
    agent_id="agent_id",
    url="https://example.com/invoice.pdf",
    organization_id="org_xxx",
    model_name="gpt-4o",
    instructions="Custom prompt",
)
```

---

## `client.documentAi` — Suggest Schema

Automatically propose a JSON schema by analyzing a sample document.

**TypeScript**

```typescript
const schema = await client.documentAi.suggestSchema({
  url: "https://example.com/invoice.pdf",
  organizationId: "org_xxx",
  modelName: "gpt-4o",  // optional, defaults to "gpt-4o"
});
```

**Python**

```python
schema = client.document_ai.suggest_schema(
    url="https://example.com/invoice.pdf",
    organization_id="org_xxx",
    model_name="gpt-4o",
)
```

---

## `client.documentAi` — Create Full (Orchestrator)

End-to-end Document AI agent creation (what the Imbrace webapp does): creates a board with extraction schema, then creates a UseCase + AI Agent linked to that board.

**TypeScript**

```typescript
const result = await client.documentAi.createFull({
  name: "Invoice Extractor",
  instructions: "Extract invoice fields. Dates as YYYY-MM-DD.",
  schemaFields: [
    { name: "invoice_number", type: "ShortText", description: "Invoice ID" },
    { name: "total",          type: "Number",    description: "Total amount" },
    { name: "date",           type: "Date",      description: "Invoice date" },
  ],
  modelId: "gpt-4o",
  providerId: "system",
});

console.log(result.board_id);     // "brd_xxx"
console.log(result.ai_agent_id);  // UUID of the created AI Agent
console.log(result.usecase_id);   // UUID of the created UseCase
```

**Python**

```python
result = client.document_ai.create_full(
    name="Invoice Extractor",
    instructions="Extract invoice fields. Dates as YYYY-MM-DD.",
    schema_fields=[
        {"name": "invoice_number", "type": "ShortText", "description": "Invoice ID"},
        {"name": "total",          "type": "Number",    "description": "Total amount"},
        {"name": "date",           "type": "Date",      "description": "Invoice date"},
    ],
    model_id="gpt-4o",
    provider_id="system",
)

print(result["board_id"])      # "brd_xxx"
print(result["ai_agent_id"])   # UUID of the created AI Agent
```

#### Create Full options

| Parameter | TS field | Python param | Type | Default |
|---|---|---|---|---|
| Name | `name` | `name` | `string` / `str` | — |
| Instructions | `instructions` | `instructions` | `string` / `str` | — |
| Schema fields | `schemaFields` | `schema_fields` | `CreateBoardFieldInput[]` / `List[Dict]` | — |
| Model ID | `modelId` | `model_id` | `string` / `str` | — |
| Provider ID | `providerId` | `provider_id` | `string` / `str` | — |
| Description | `description` | `description` | `string` / `str` | `None` |
| VLM model | `vlmModel` | `vlm_model` | `string` / `str` | `modelId` |
| VLM provider | `vlmProviderId` | `vlm_provider_id` | `string` / `str` | `providerId` |
| Source languages | `sourceLanguages` | `source_languages` | `string[]` / `List[str]` | `["English"]` |
| Handwriting support | `handwritingSupport` | `handwriting_support` | `boolean` / `bool` | `false` |
| Time offset | `timeOffset` | `time_offset` | `string` / `str` | `"UTC+00:00"` |
| Continue on failure | `continueOnFailure` | `continue_on_failure` | `boolean` / `bool` | `false` |
| Retry time | `retryTime` | `retry_time` | `number` / `int` | `2` |
| Temperature | `temperature` | `temperature` | `number` / `float` | `0.1` |
| Demo URL | `demoUrl` | `demo_url` | `string` / `str` | `None` |
| Team IDs | `teamIds` | `team_ids` | `string[]` / `List[str]` | `[]` |
| Extra AI Agent fields | `extraAiAgent` | `extra_ai_agent` | `Record<string, unknown>` / `Dict` | `None` |

---

## Async usage (Python)

```python
from imbrace import AsyncImbraceClient

async with AsyncImbraceClient() as client:
    # Direct processing (chat_ai)
    models = await client.chat_ai.list_document_models()
    result = await client.chat_ai.process_document(
        model_name="gpt-4o",
        url="https://example.com/invoice.pdf",
        organization_id="org_xxx",
    )

    # Agent-based processing (document_ai)
    agents = await client.document_ai.list_agents(document_ai_only=True)
    result2 = await client.document_ai.process(
        agent_id=agents[0]["_id"],
        url="https://example.com/receipt.pdf",
        organization_id="org_xxx",
    )
```

---

## See also

- [Full Flow Guide §3 — Knowledge Hubs](/sdk/full-flow-guide.md#3-manage-knowledge-hubs-and-attach-to-an-ai-agent) — upload files for RAG
- [AI Agent — Embeddings & Knowledge Base](/sdk/ai-agent.md#embeddings--knowledge-base) — manage embedding files for retrieval
