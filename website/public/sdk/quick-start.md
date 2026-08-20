# Quick Start

### 1. Initialize the client

**TypeScript — access token**

```typescript
import { ImbraceClient } from "@imbrace/sdk"

const client = new ImbraceClient({
  accessToken: "your-access-token",
  baseUrl: "https://app-gatewayv2.imbrace.co",
})
```

**TypeScript — API key**

```typescript
import { ImbraceClient } from "@imbrace/sdk"

const client = new ImbraceClient({
  apiKey: "your-api-key",
  baseUrl: "https://app-gatewayv2.imbrace.co",
})
```

**Python — access token**

```python
import os
from dotenv import load_dotenv
from imbrace import ImbraceClient

load_dotenv()

client = ImbraceClient(
    access_token=os.environ["IMBRACE_ACCESS_TOKEN"],
    base_url="https://app-gatewayv2.imbrace.co",
)
```

**Python — API key**

```python
import os
from dotenv import load_dotenv
from imbrace import ImbraceClient

load_dotenv()

client = ImbraceClient(
    api_key=os.environ["IMBRACE_API_KEY"],
    base_url="https://app-gatewayv2.imbrace.co",
)
```

See [Authentication](/sdk/authentication.md) for which credential to pick.

---

### 2. Fetch your boards

Boards are CRM pipelines — leads, deals, tasks, or any structured data. This call requires only your credential.

**TypeScript**

```typescript
const { data: boards } = await client.boards.list()

for (const board of boards) {
  console.log(board.id, board.name)
}
```

**Python**

```python
boards = client.boards.list()

for board in boards.get("data", []):
    print(board["id"], board.get("name"))
```

If you see your boards listed, the SDK is connected and authenticated.

---

### 3. Next steps

The [Full Flow Guide](/sdk/full-flow-guide.md) walks the four major workflows end-to-end. Jump straight to a section:

- **AI Agent + streamChat** → [Full Flow Guide §1](/sdk/full-flow-guide.md#1-create-an-ai-agent-and-start-chatting)
- **Workflows** → [Full Flow Guide §2](/sdk/full-flow-guide.md#2-create-a-workflow-and-bind-it-to-an-ai-agent)
- **Knowledge Hub (folders, RAG)** → [Full Flow Guide §3](/sdk/full-flow-guide.md#3-manage-knowledge-hubs-and-attach-to-an-ai-agent)
- **Boards & Items (CRM)** → [Full Flow Guide §4](/sdk/full-flow-guide.md#4-manage-data-boards-and-items-crm-pipelines)

For the per-namespace API reference, see [Resources](/sdk/resources.md).
