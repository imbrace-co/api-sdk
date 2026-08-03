"""Document AI example — list, create, process, delete a Document AI agent.

Document AI agents extract structured JSON from unstructured documents
(PDFs, images, scanned forms). Each agent has a schema, instructions, and
an LLM model. Under the hood the resource wraps the AI Agent CRUD endpoints
filtered by ``agent_type='document_ai'``, plus ``/v3/ai/document/`` for
processing.
"""
import os
from imbrace import ImbraceClient

client = ImbraceClient(
    access_token=os.environ["IMBRACE_ACCESS_TOKEN"],
    env="stable",
)

# 1. List Document AI agents (filter by `document_ai_only=True` to skip generic AI agents)
agents = client.document_ai.list_agents(document_ai_only=True)
print("Document AI agents:", len(agents))

# 2. Create an agent — pass `schema` to define extraction fields
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
agent_id = agent["_id"]
print("Created agent:", agent_id)

# 3. Process a document — looks up the agent's model + instructions automatically
result = client.document_ai.process(
    agent_id=agent_id,
    url="https://example.com/invoice.pdf",
    organization_id=os.environ.get("IMBRACE_ORG_ID", "org_xxx"),
)
print("Extracted data:", result.get("data"))

# 4. Atomic end-to-end creation: Board + UseCase + AI Agent linked together
#    Returns { board_id, ai_agent_id, channel_id, usecase_id, ... }
full = client.document_ai.create_full(
    name="Receipt Pipeline",
    instructions="Step 1: Extract Data...",
    schema_fields=[
        {"name": "vendor", "type": "ShortText", "is_identifier": True},
        {"name": "total",  "type": "Number"},
    ],
    model_id="gpt-4o",
    provider_id="system",
    description="End-to-end receipt extractor",
)
print("Full pipeline IDs:", {
    "board_id":    full["board_id"],
    "ai_agent_id": full["ai_agent_id"],
    "channel_id":  full["channel_id"],
})

# 5. Cleanup
client.document_ai.delete_agent(agent_id)
print("Deleted agent:", agent_id)

client.close()
