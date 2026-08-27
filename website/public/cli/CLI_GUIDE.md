# Imbrace CLI — User Guide

> CLI tool for interacting with the Imbrace CRM platform from the terminal. Designed for both developers and coding agents (Claude, Cursor, Copilot, etc.).

## Installation

### Prerequisites

- Node.js 18+
- npm 8+

### Install from npm

```bash
npm install -g @imbrace/cli
```

### From Source

Clone the repository and run the install script:

```bash
git clone https://github.com/imbrace-co/imbrace-cli.git
cd imbrace-cli
./install.sh
```

`install.sh` runs `npm install`, `npm run build`, `npm link`, then symlinks `imbrace` into `/opt/homebrew/bin` (Apple Silicon) or `/usr/local/bin` (Intel).

### Manual Build

```bash
cd cli
npm install
npm run build
npm link
```

```bash
npm install -g @imbrace/cli
```

---

## Authentication

All commands (except `login`) auto-prompt login if not authenticated. The CLI stores credentials using the `conf` package.

```bash
# Login with API key (recommended for CI/CD and coding agents)
imbrace login --api-key api_xxx...

# Login with email + password
imbrace login --email user@example.com --password mypass

# Check current login
imbrace whoami [--json]

# Logout
imbrace logout
```

### Credential Storage Paths

| OS | Path |
|---|---|
| macOS | `~/Library/Preferences/imbrace-nodejs/config.json` |
| Linux | `~/.config/imbrace-nodejs/config.json` |
| Windows | `%APPDATA%\imbrace-nodejs\Config\config.json` |

---

## Data Board Commands

A board is a CRM pipeline — leads, deals, tasks, or any structured data.

### List Boards

```bash
imbrace data-board list [--json]
```

### Create Board

```bash
imbrace data-board create [--name <name>] [--json]
```

Without `--json`, the command interactively prompts for freestyle key-value pairs after entering the name. With `--json`, only `--name` is required.

### Create Field

```bash
imbrace data-board create-field <boardId> --name <fieldName> --type <fieldType> [--json]
```

**Valid field types (16):**
`ShortText`, `LongText`, `Number`, `Date`, `Email`, `Phone`, `Currency`, `SingleSelection`, `MultipleSelection`, `Checkbox`, `Assignee`, `MultipleAssignee`, `Link`, `Notes`, `Origin`, `Priority`

> Do NOT use `Dropdown` — backend rejects it. Use `SingleSelection` instead.

### Create Item

```bash
imbrace data-board create-item <boardId> --fields '<json>' [--json]
```

`--fields` is a JSON array of `{ board_field_id, value }` objects:

```bash
imbrace data-board create-item <boardId> --fields '[
  {"board_field_id": "<fieldId>", "value": "Acme Corp"},
  {"board_field_id": "<fieldId>", "value": "50000"}
]' --json
```

### List Items

```bash
imbrace data-board list-items --board-id <boardId> [--limit 20] [--skip 0] [--q <search>] [--json]
```

- `--limit` — number of items (default: 20)
- `--skip` — items to skip (default: 0)
- `--q` — full-text search query

### Update Item

```bash
imbrace data-board update-item <boardId> <itemId> --data '<json>' [--json]
```

`--data` is a JSON array of `{ key, value }` objects:

```bash
imbrace data-board update-item <boardId> <itemId> --data '[
  {"key": "<fieldId>", "value": "Acme Corp — Closed Won"}
]' --json
```

### Delete Item

```bash
imbrace data-board delete-item <boardId> <itemId> [--yes] [--json]
```

### Export to CSV

```bash
imbrace data-board export-csv --board-id <boardId> [--out ./board.csv]
```

Without `--out`, prints CSV to stdout.

---

## AI Agent Commands

An AI agent is a configured assistant (LLM + prompt + behavior) that appears as a card on `cloud.imbrace.co/ai-agent`. Creating one atomically provisions the assistant, a web channel, and the use-case template.

> All content (name, description, instructions, behavior fields) must be in English. The slug for `workflow_name` is derived from the name; Vietnamese diacritics get stripped and produce unreadable slugs.

### Discovery

```bash
# List all agents
imbrace ai-agent list [--json]

# List LLM providers (system + custom)
imbrace ai-agent list-providers [--json]

# List models for a provider
imbrace ai-agent list-models --provider-id <providerId> [--json]

# List Knowledge Hub folders
imbrace ai-agent list-folders [--search <query>] [--json]

# List files in a Knowledge Hub folder
imbrace ai-agent list-files --folder-id <folderId> [--json]
```

### CRUD

```bash
# Get agent details
imbrace ai-agent get <agentId> [--json]

# Delete agent
imbrace ai-agent delete <agentId> [--yes] [--json]
```

### Create / Update Flags

`create` and `update` accept the same flags. `update` preserves unchanged fields via PUT-merge.

| Flag | Maps to | Notes |
|---|---|---|
| **Identity** | | |
| `--name` / `-n` | `name` + `title` | Required for create |
| `--description` / `-d` | `description` + `short_description` | Shown under title in UI |
| `--instructions` / `-i` | `instructions` | System prompt |
| **Model** | | |
| `--model` | `model_id` | Default `Default` (system provider). Discover via `list-models`. |
| `--provider-id` | `provider_id` | UUID, default `system`. Use UUID — not the MongoDB `_id`. |
| `--mode` | `mode` | `standard` / `advanced` |
| `--temperature` | `temperature` | 0.0–2.0, default 0.1 |
| **Behavior Settings** | | |
| `--personality` | `personality_role` | |
| `--core-task` | `core_task` | |
| `--tone` | `tone_and_style` | |
| `--response-length` | `response_length` | `short` / `medium` / `long` |
| `--banned-words` | `banned_words` | Comma-separated, word-level filter on output |
| `--category` | `category` | `Support` / `Sales` / `Marketing` / `Team` / `Other` |
| `--guardrail-id` | `guardrail_id` | Attach a guardrail |
| `--preload-information` | `preload_information` | Static info auto-injected into context |
| **Knowledge Support** | | |
| `--folder-ids` | `folder_ids` | Comma-separated KH folder IDs |
| `--default-folder-id` | `default_folder_id` | |
| `--knowledge-hubs` | `knowledge_hubs` | Comma-separated KH IDs |
| `--board-ids` | `board_ids` | Comma-separated data board IDs (Document Models) |
| `--file-ids` | `file_ids` | Comma-separated file IDs |
| **Runtime toggles** (support `--no-X`) | | |
| `--show-thinking` | `show_thinking_process` | Default false |
| `--streaming` | `streaming` | Default true |
| `--use-memory` | `use_memory` | Default true |
| **Output** | | |
| `--yes` / `-y` | — | Skip confirm on delete |
| `--json` | — | Machine-readable output |
| `--id-only` | — | Print only the new agent ID (pipe-friendly) |

### Full Create Example

```bash
imbrace ai-agent create \
  --name "Customer Support Specialist" \
  --description "Senior AI customer support agent" \
  --instructions "You are a senior customer support specialist..." \
  --personality "Friendly and professional" \
  --core-task "Answer product inquiries, help track orders" \
  --tone "Polite, professional, warm" \
  --response-length "medium" \
  --banned-words "stupid, idiot" \
  --category "Support" \
  --provider-id "e2629292-7e9f-4d55-ba18-6827747eab33" \
  --model "gpt-4o-mini" \
  --temperature 0.3 \
  --folder-ids "69bb82faa2cc764639bc6bdb" \
  --board-ids "brd_e5450d76-84d4-4c34-8b13-3d0f1873b53b" \
  --json
```

---

## Workflow Commands

A workflow is a chain of nodes: a trigger fires, then actions run in sequence. Use it for automation.

**Anatomy:** 6 layers — `Flow` (container) → `Version` (snapshot) → `Nodes` (trigger + actions) → `Connections` (credentials) → `Runs` (history) → `Pieces` (integration catalog).

### Node Types

| Type | Role | CLI support |
|---|---|---|
| `PIECE_TRIGGER` | When does the flow run | `node add --type trigger` |
| `PIECE` | What runs after | `node add --type action` |
| `EMPTY` | Placeholder before trigger is set | Read-only |
| `ROUTER` | Multi-condition switch (replaces BRANCH) | `node add-raw` |
| `LOOP_ON_ITEMS` | Loop over an array | `node add-raw` |
| `CODE` | Inline JavaScript | `node add-raw` |

### Flow CRUD

```bash
# List all workflows (optionally filter by folder)
imbrace workflow list [--folder-id <id|NULL>] [--json]

# Get workflow details
imbrace workflow get <id> [--json]

# Create a new workflow
imbrace workflow create --name "<name>" [--folder-id <id>] [--json] [--id-only]

# Move workflow to a folder (NULL = unfile)
imbrace workflow move <flowId> --folder-id <id|NULL> [--json]

# Delete workflow
imbrace workflow delete <id> [--yes] [--json]
```

### Node Management

```bash
# List nodes of a workflow (flattened)
imbrace workflow node list <flowId> [--json]

# Add a trigger node
imbrace workflow node add <flowId> \
  --type trigger --piece <pieceName> \
  --trigger-name <triggerId> \
  [--input '<json>'] [--json]

# Add an action node
imbrace workflow node add <flowId> \
  --type action --piece <pieceName> \
  --action-name <actionId> \
  [--after <parentStep>] [--input '<json>'] [--json]

# Update node input/display name
imbrace workflow node update <flowId> <nodeName> \
  [--input '<json>'] [--display-name <name>] [--json]

# Delete an action node (trigger cannot be deleted)
imbrace workflow node delete <flowId> <nodeName> [--yes] [--json]

# Raw operation (for ROUTER, LOOP_ON_ITEMS, CODE types)
imbrace workflow node add-raw <flowId> --op-file <path> [--json]
# or via stdin:
imbrace workflow node add-raw <flowId> --stdin [--json]
```

### Piece Discovery

```bash
# List all pieces (integrations), optionally search
imbrace workflow piece list [--search <query>] [--json]

# Get piece details (triggers + actions schemas)
imbrace workflow piece detail <pieceName> [--only actions|triggers] [--json]
```

### Connections

```bash
# List all connections
imbrace workflow conn list [--json]

# Get connection details
imbrace workflow conn get <connId> [--json]

# Create a connection
imbrace workflow conn create \
  --piece <pieceName> \
  --type SECRET_TEXT|OAUTH2|CLOUD_OAUTH2|BASIC_AUTH|CUSTOM_AUTH \
  --value "<token-or-json>" \
  [--display-name <name>] [--external-id <id>] [--json] [--id-only]

# Delete a connection
imbrace workflow conn delete <connId> [--yes] [--json]
```

### Folders (Categories)

```bash
imbrace workflow folder list [--json]
imbrace workflow folder get <folderId> [--json]
imbrace workflow folder create --name "<name>" [--project-id <id>] [--json] [--id-only]
imbrace workflow folder update <folderId> --name "<newName>" [--json]
imbrace workflow folder delete <folderId> [--yes] [--json]
```

The platform auto-creates 4 system folders that show up as Categories in the UI:

| UI Category | Purpose | Folder name in API |
|---|---|---|
| Channel Workflow | Messaging / channel automation | `Channel Workflow` |
| Board Automation | Triggered by data-board events | `Board Automation` |
| AI Agent Skills | Skills callable by AI agents | `AI Agent Capabilities` |
| Others | Everything else | `Others` |

Use `workflow folder list` to discover their IDs, then `workflow create --folder-id <id>` or `workflow move <flowId> --folder-id <id>`.

### MCP Servers (Model Context Protocol)

```bash
imbrace workflow mcp list [--json]
imbrace workflow mcp get <mcpId> [--json]
imbrace workflow mcp create --name "<name>" [--project-id <id>] [--json] [--id-only]
imbrace workflow mcp delete <mcpId> [--yes] [--json]
imbrace workflow mcp rotate-token <mcpId> [--yes] [--json]
```

Token is shown once at create and at rotate.

### Lifecycle & Runs

```bash
# Publish (lock current draft as production version)
imbrace workflow publish <flowId> [--json]

# Enable / disable auto-trigger (enable requires publish first)
imbrace workflow enable <flowId> [--json]
imbrace workflow disable <flowId> [--json]

# Manually trigger a flow
imbrace workflow run <flowId> [--payload '<json>'] [--sync] [--json]

# List recent runs
imbrace workflow runs [--limit 10] [--json]

# Get run details
imbrace workflow run-detail <runId> [--json]
```

### Variable Syntax in Node Input

- `{{trigger.body.X}}` — field X from webhook payload
- `{{trigger.X}}` — top-level trigger field (for piece triggers)
- `{{step_1.output.Y}}` — output field Y from step_1
- `{{connections.<id>.access_token}}` — connection field

---

## Known Issues & Gotchas

1. **Field type `Dropdown`** — Do not use. The backend rejects it. Use `SingleSelection` instead.

2. **Provider ID vs `_id`** — When passing `--provider-id` for AI agents, use the UUID `provider_id` field, not the MongoDB `_id`. The UI matches dropdowns against the UUID.

3. **English-only agent content** — All AI agent content (name, description, instructions) must be in English because slugs are derived from the name. Vietnamese diacritics produce unreadable slugs.

4. **`workflow run --sync` timeout** — May time out at ~30s even when the flow finishes faster. Workaround: use `workflow runs` + `workflow run-detail <runId>` to fetch the result.

5. **Enable before publish** — `workflow enable` requires `workflow publish` first, otherwise returns 500 "publishedFlowVersionId is required".

6. **AI Connector `prompt` field** — Must be a nested object `{ prompt: { prompt: "text" } }`, not a plain string, or the UI renders it empty.

7. **Flow lock** — If a user has the flow open in the browser, CLI updates may be rejected or silently overwritten by UI auto-save.

8. **`--no-use-memory` at create** — May not stick due to backend default override. Workaround: update after create.

9. **System provider models** — The system provider only has one model named `Default`. Passing other names (like `gpt-4o`) makes the UI dropdown render empty even though the agent saves.

---

## For Coding Agents

Quick pipeline setup:

```bash
# 1. Verify login
imbrace whoami --json

# 2. Create a board
imbrace data-board create --name "Leads" --json

# 3. Add schema fields
imbrace data-board create-field <boardId> --name "Company" --type ShortText --json
imbrace data-board create-field <boardId> --name "Deal Value" --type Number --json

# 4. Add records
imbrace data-board create-item <boardId> --fields '[
  {"board_field_id": "<fieldId>", "value": "Acme Corp"},
  {"board_field_id": "<fieldId>", "value": "75000"}
]' --json
```

> Always use `--json` flag so output can be parsed programmatically.
> If a command returns 401, run `imbrace login --api-key api_xxx...` again.
