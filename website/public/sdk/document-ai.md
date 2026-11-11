# Document AI

Document AI uses vision models (e.g. GPT-4o) to extract structured data from PDFs and images — invoices, forms, receipts, contracts, or any document with visible text.

The SDK exposes four namespaces:
- **`client.dociq`** — upload documents to DocIQ: it matches each one to a Document Model, extracts it and writes a record on that model's board
- **`client.chatAi` / `client.chat_ai`** — direct document processing and model listing
- **`client.documentModels` / `client.document_models`** — DocIQ Document Models: which fields to extract, the board they land on, categories and extraction settings
- **`client.documentAi` / `client.document_ai`** — agent-based document processing, queued jobs, agent CRUD, and end-to-end orchestration

Initialize the client first (see [Installation](/sdk/installation.md) or [Quick Start](/sdk/quick-start.md)).

---

## `client.dociq` — Upload and extract (DocIQ)

This is the usual way documents reach DocIQ. Upload a file and submit it: DocIQ picks the Document Model that fits, extracts the fields and writes a record on that model's board. Set your models up first with [`client.documentModels`](#clientdocumentmodels--document-models-dociq).

### Upload and submit

Upload with `client.boards.uploadBoardFile()`, then pass the `url` it returns to `ingest()`. One call takes 1 to 5 files and answers at once with one submission per file; the reading runs in the background.

**TypeScript**

```typescript
const form = new FormData();
form.append("file", new Blob([pdfBytes], { type: "application/pdf" }), "invoice.pdf");
const { url } = await client.boards.uploadBoardFile(form);

const { submissions } = await client.dociq.ingest({
  files: [{ url, mime_type: "application/pdf", name: "invoice.pdf" }],
});
const submissionId = submissions[0].id;
```

**Python**

```python
with open("invoice.pdf", "rb") as f:
    url = client.boards.upload_board_file({"file": ("invoice.pdf", f, "application/pdf")})["url"]

res = client.dociq.ingest([{"url": url, "mime_type": "application/pdf", "name": "invoice.pdf"}])
submission_id = res["submissions"][0]["id"]
```

| Option | Type | Meaning |
|---|---|---|
| `files` | `{ url, mime_type, name? }[]` | 1 to 5 files. `url` is what the upload returned, or an absolute URL |
| `assistant_id` | string | Read with this DocIQ assistant's models instead of the defaults |
| `source` | `{ channel?, conversation_id? }` | Where the file came from, when it is not an upload (e.g. a messaging channel). Stored as given |

The board write runs as the calling user, so the request must carry one: a call without a user is refused with 400. The organization needs the Document Model feature.

### Follow a submission

A submission has two states. `status` is the reading: `pending`, `running`, then `succeeded`, `failed` or `canceled`. `outcome` is the board write: `saved`, `no_schema` (no model fits), `model_created`, `failed`, or `pending` until it has run.

**TypeScript**

```typescript
let sub = await client.dociq.getSubmission(submissionId);
while (sub.status === "pending" || sub.status === "running" || (sub.status === "succeeded" && sub.outcome === "pending")) {
  await new Promise(r => setTimeout(r, 5000));
  sub = await client.dociq.getSubmission(submissionId);
}

if (sub.outcome === "saved") {
  console.log(sub.documentModelName, sub.boardId, sub.boardItemId);
  console.log(sub.extractedData);  // the record
  console.log(sub.extractedMeta);  // per field: confidence, state, where it was read
}
```

**Python**

```python

sub = client.dociq.get_submission(submission_id)
while sub["status"] in ("pending", "running") or (sub["status"] == "succeeded" and sub["outcome"] == "pending"):
    time.sleep(5)
    sub = client.dociq.get_submission(submission_id)

if sub["outcome"] == "saved":
    print(sub["documentModelName"], sub["boardId"], sub["boardItemId"])
    print(sub["extractedData"])  # the record
    print(sub["extractedMeta"])  # per field: confidence, state, where it was read
```

A file that holds several documents (say, three invoices in one PDF) is split: `documents` lists each one with its own model and board, and `boardItemId` is the first record. A failed submission carries `error` and `processLog`. `getSubmissionByFile()` finds the newest submission by the File ID the results table shows (e.g. `INV-2026-001`).

### List submissions

**TypeScript**

```typescript
const { submissions, total } = await client.dociq.listSubmissions({
  status: "failed",
  from: "2026-11-01T00:00:00Z",
  limit: 50,
});
```

**Python**

```python
page = client.dociq.list_submissions(status="failed", from_="2026-11-01T00:00:00Z", limit=50)
```

Filters: `limit` (1–100, default 10), `skip`, `status`, `flow` (`page` for uploads, `chat` for files handed over in an agent chat), `search`, `documentModelIds`, `conversationId`, `emailId`, `sourceItemId`, `from`, `to` (`from_` in Python), `runId`. `deleteSubmission()` removes one from the list.

### When no model fits

With `outcome: "no_schema"`, the submission's `proposedModel` holds the fields DocIQ suggests. Turn them into a Document Model:

**TypeScript**

```typescript
const { schema } = await client.dociq.createModelFromSubmission(submissionId, {
  name: "Purchase order",
  category: "cat_xxx", // optional category id
});
```

**Python**

```python
res = client.dociq.create_model_from_submission(submission_id, "Purchase order", category="cat_xxx")
```

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
| Process inline or queue | `sync` | `sync` | `boolean` / `bool` | No |
| Webhook URL | `webhookUrl` | `webhook_url` | `string` / `str` | No |
| Webhook context | `meta` | `meta` | any JSON | No |
| OCR confidence | `enableOcrConfidence` | `enable_ocr_confidence` | `boolean` / `bool` | No |
| Confidence threshold (0–1) | `confidenceThreshold` | `confidence_threshold` | `number` / `float` | No |
| OCR engine | `ocrEngine` | `ocr_engine` | `string` / `str` | No |
| Timeout (seconds) | `timeout` | `timeout` | `number` / `int` | No |

A long document may be queued instead of processed inline: see [Queued extraction](#queued-extraction-and-webhooks). The last seven options are explained there and under [OCR confidence](#ocr-confidence).

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

## `client.documentModels` — Document Models (DocIQ)

A Document Model lists the fields to extract from one kind of document. Each model gets one board, and every document read with it becomes a record on that board. [`client.dociq`](#clientdociq--upload-and-extract-dociq) picks the model for each document; with `documentAi.process()` you pass the board as `boardId`.

A model belongs to one product, its `type`: `"DocumentAI"` (DocIQ, the default) or `"Comms"` (CommsIQ). The type is set when the model is created and never changes.

### Create a model and its board

**TypeScript**

```typescript
const model = await client.documentModels.create({
  name: "Invoice",
  attributes: [
    { name: "Invoice number", type: "ShortText" },
    { name: "Total", type: "Number" },
    { name: "Date", type: "Date" },
  ],
});

// Creating a model does not create its board: provision it.
const [{ board_id }] = await client.documentModels.provisionBoards({
  schemas: [{ schema_id: model.id, data_board_name: "Invoices" }],
});

const result = await client.documentAi.process({
  url: "https://example.com/invoice.pdf",
  organizationId: "org_xxx",
  modelName: "gpt-4o",
  boardId: board_id,
});
```

**Python**

```python
model = client.document_models.create({
    "name": "Invoice",
    "attributes": [
        {"name": "Invoice number", "type": "ShortText"},
        {"name": "Total", "type": "Number"},
        {"name": "Date", "type": "Date"},
    ],
})

# Creating a model does not create its board: provision it.
board_id = client.document_models.provision_boards(
    {"schemas": [{"schema_id": model["id"], "data_board_name": "Invoices"}]}
)[0]["board_id"]

result = client.document_ai.process(
    url="https://example.com/invoice.pdf",
    organization_id="org_xxx",
    model_name="gpt-4o",
    boardId=board_id,
)
```

The `agents` and `databoards` keys on create are deprecated: the backend ignores them. Use `provisionBoards` (with `assistant_id` to also link an assistant).

### List models

**TypeScript**

```typescript
const all = await client.documentModels.list();                    // every product
const docIq = await client.documentModels.list({ type: "DocumentAI", search: "invoice" });
```

**Python**

```python
all_models = client.document_models.list()                         # every product
doc_iq = client.document_models.list(type="DocumentAI", search="invoice")
```

### Update a model and its board

Each update saves a new version (`listVersions`, `getVersion`, `revert`). The same call can rename the model's board, move it to another category, and choose which teams can use it. These board settings do nothing until the board has been provisioned.

**TypeScript**

```typescript
await client.documentModels.update(model.id, {
  description: "Supplier invoices",
  change_note: "Describe the model",
  data_board_name: "Supplier invoices",
  board_category_id: "cat_xxx",          // a `databoard` category
  board_deployment_access: ["team_xxx"], // empty = all teams
});
```

**Python**

```python
client.document_models.update(model["id"], {
    "description": "Supplier invoices",
    "change_note": "Describe the model",
    "data_board_name": "Supplier invoices",
    "board_category_id": "cat_xxx",          # a `databoard` category
    "board_deployment_access": ["team_xxx"], # empty = all teams
})
```

### Categories

Categories have a `type`: `"schema"` (DocIQ models), `"databoard"` (boards) or `"comms"` (CommsIQ models). On a `schema` listing, `count` picks what each category's `boards_count` counts: `"models"` or `"boards"`.

**TypeScript**

```typescript
const tree = await client.documentModels.listCategories({ type: "schema", count: "models" });
const cat = await client.documentModels.createCategory({ name: "Finance", type: "schema" });
```

**Python**

```python
tree = client.document_models.list_categories(type="schema", count="models")
cat = client.document_models.create_category({"name": "Finance", "type": "schema"})
```

### Extraction settings

One set of settings per organization and product (`type`, DocIQ when left out). An update changes only the keys you send.

**TypeScript**

```typescript
const settings = await client.documentModels.getSettings();

await client.documentModels.updateSettings({
  ocr_enabled: true,                // false skips the OCR confidence pass on scans and images
  confidence_score_threshold: 80,   // whole percent; values read below it are flagged for review
});
```

**Python**

```python
settings = client.document_models.get_settings()

client.document_models.update_settings({
    "ocr_enabled": True,               # False skips the OCR confidence pass on scans and images
    "confidence_score_threshold": 80,  # whole percent; values read below it are flagged for review
})
```

| Setting | Type | Meaning |
|---|---|---|
| `vlm_provider_id`, `vlm_model` | string | Vision model that reads the pages |
| `llm_provider_id`, `llm_model` | string | Language model that fills the fields |
| `source_languages` | string[] | Empty = detect the language |
| `handwriting_support` | boolean | Read handwriting |
| `ocr_enabled` | boolean | `false` skips the OCR confidence pass on scans and images |
| `confidence_score_threshold` | integer 0–100 | A value read with lower confidence is flagged for review; 0 flags nothing |
| `time_offset` | string | e.g. `UTC+08:00` |
| `continue_on_failure` | boolean | Keep going when a page fails |
| `retry_time` | integer 0–10 | 0 never retries |
| `max_token_limit` | integer 1–4096 | Thousands of tokens per extraction call |

> **Note:** `ocr_enabled`, `confidence_score_threshold` and the category `count` filter are new. On an environment that does not have them yet, the backend ignores them without an error.

---

## Queued extraction and webhooks

`client.documentAi.process()` and `client.chatAi.processDocument()` call the same endpoint. The server may queue a document instead of extracting it inline; by default it queues a PDF over 20 pages. A queued call answers at once (HTTP 202) with a `job_id` and no `data`.

- Pass `sync: true` to always extract inline and get `data` back.
- Pass `sync: false` to always queue.
- Follow a queued job with `getJob()`. The extracted fields are not in the job: once `status` is `done`, they are on the board row the job names, in its `RawResult` field.

**TypeScript**

```typescript
const res = await client.documentAi.process({
  url: "https://example.com/contract.pdf",
  organizationId: "org_xxx",
  modelName: "gpt-4o",
  boardId: board_id,
});

if (res.job_id) {
  let job = await client.documentAi.getJob(res.job_id);
  while (job.status === "pending" || job.status === "in_progress") {
    await new Promise(r => setTimeout(r, 5000));
    job = await client.documentAi.getJob(res.job_id);
  }
  if (job.status === "done" && job.board_id && job.board_item_id) {
    const row = await client.boards.getItem(job.board_id, job.board_item_id);
  }
} else {
  console.log(res.data);
}
```

**Python**

```python

res = client.document_ai.process(
    url="https://example.com/contract.pdf",
    organization_id="org_xxx",
    model_name="gpt-4o",
    boardId=board_id,
)

if res.get("job_id"):
    job = client.document_ai.get_job(res["job_id"])
    while job["status"] in ("pending", "in_progress"):
        time.sleep(5)
        job = client.document_ai.get_job(res["job_id"])
    if job["status"] == "done":
        row = client.boards.get_item(job["board_id"], job["board_item_id"])
else:
    print(res["data"])
```

Job `status` is `pending`, `in_progress`, `done` or `error`. The job record expires after a day by default, and `getJob()` then fails with a 404; the board row stays.

Instead of polling, pass `webhookUrl`. It is POSTed the outcome when the extraction finishes, success or error, inline or queued, with whatever you sent as `meta` echoed back:

```json
{
  "event": "document_ai.completed",
  "status": "completed",
  "job_id": "…",
  "board_id": "…",
  "board_item_id": "…",
  "data": { },
  "meta": { "ref": "r1" },
  "error": null
}
```

`job_id` is `null` when the document was processed inline. `status` is `"completed"` or `"error"`.

---

## OCR confidence

With `enableOcrConfidence`, an OCR engine reads the document next to the vision model, and each extracted field gets a grounded `{ value, box, confidence }`. `confidenceThreshold` (0–1) drops fields read with lower confidence. `ocrEngine` picks the engine: `"paddleocr-vl"` (text only), `"chandra"` (layout with boxes) or `"easyocr"` (text blocks with boxes); the server default applies when you leave it out.

**TypeScript**

```typescript
const result = await client.documentAi.process({
  url: "https://example.com/scan.png",
  organizationId: "org_xxx",
  modelName: "gpt-4o",
  boardId: board_id,
  sync: true,
  enableOcrConfidence: true,
  confidenceThreshold: 0.6,
  ocrEngine: "easyocr",
});
```

**Python**

```python
result = client.document_ai.process(
    url="https://example.com/scan.png",
    organization_id="org_xxx",
    model_name="gpt-4o",
    boardId=board_id,
    sync=True,
    enableOcrConfidence=True,
    confidenceThreshold=0.6,
    ocrEngine="easyocr",
)
```

`client.document_ai.process()` passes extra keyword arguments to the server as they are, so they keep their camelCase names. `client.chat_ai.process_document()` takes them in snake_case (`enable_ocr_confidence=True`).

---

## `client.documentAi` — Agent CRUD

A Document AI Agent stores the instructions and model for repeated use. The fields to extract do not belong on the agent: they are a [Document Model](#clientdocumentmodels--document-models-dociq), passed as `boardId`.

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
});
```

**Python**

```python
agent = client.document_ai.create_agent(
    name="Invoice Extractor",
    instructions="Extract invoice fields. Dates as YYYY-MM-DD.",
    model_id="gpt-4o",
)
```

Passing `schema` throws: the backend keeps no schema on an agent. Define the fields as a [Document Model](#clientdocumentmodels--document-models-dociq) instead.

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

End-to-end Document AI agent creation (what the iMBRACE webapp does): creates a board with extraction schema, then creates a UseCase + AI Agent linked to that board.

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
    if result2.get("job_id"):
        job = await client.document_ai.get_job(result2["job_id"])

    # Document Models (document_models)
    models = await client.document_models.list(type="DocumentAI")
```

---

## See also

- [Document Models](/learn/build-it-well/document-models.md) — choosing what DocIQ extracts
- [Full Flow Guide §3 — Knowledge Hubs](/sdk/full-flow-guide.md#3-manage-knowledge-hubs-and-attach-to-an-ai-agent) — upload files for RAG
- [AI Agent — Embeddings & Knowledge Base](/sdk/ai-agent.md#embeddings--knowledge-base) — manage embedding files for retrieval
