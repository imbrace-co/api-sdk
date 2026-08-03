# Imbrace CLI — SDK Method Reference

The CLI communicates with the Imbrace platform directly via `@imbrace/sdk`. This page maps each CLI command to the underlying SDK methods.

For the full SDK reference see the [SDK documentation](/sdk/overview.md).

---

## Data Board — `client.boards`

| CLI Command | SDK Method |
|---|---|
| `data-board list` | `client.boards.list()` |
| `data-board get <id>` | `client.boards.get(id)` |
| `data-board create` | `client.boards.create(body)` |
| `data-board delete <id>` | `client.boards.delete(id)` |
| `data-board create-field <boardId>` | `client.boards.createField(boardId, body)` |
| `data-board list-items` | `client.boards.listItems(boardId, params)` |
| `data-board create-item <boardId>` | `client.boards.createItem(boardId, body)` |
| `data-board update-item <boardId> <itemId>` | `client.boards.updateItem(boardId, itemId, body)` |
| `data-board delete-item <boardId> <itemId>` | `client.boards.deleteItem(boardId, itemId)` |
| `data-board export-csv` | `client.boards.exportCsv(boardId)` |

---

## AI Agent — `client.chatAi`, `client.ai`

| CLI Command | SDK Method |
|---|---|
| `ai-agent list` | `client.chatAi.listAiAgents()` |
| `ai-agent get <id>` | `client.chatAi.getAiAgent(id)` |
| `ai-agent create` | `client.chatAi.createAiAgent(body)` |
| `ai-agent update <id>` | `client.chatAi.updateAiAgent(id, body)` |
| `ai-agent delete <id>` | `client.chatAi.deleteAiAgent(id)` |
| `ai-agent list-providers` | `client.ai.listProviders()` |
| `ai-agent list-models --provider-id <id>` | `client.ai.listProviders()` (filtered by provider) |
| `ai-agent list-folders` | `client.boards.searchFolders(query)` |
| `ai-agent list-files --folder-id <id>` | `client.boards.searchFiles({ folderId })` |

---

## Workflow — `client.workflows`

| CLI Command | SDK Method |
|---|---|
| `workflow list` | `client.workflows.listFlows(params)` |
| `workflow get <id>` | `client.workflows.getFlow(id)` |
| `workflow create` | `client.workflows.createFlow(body)` |
| `workflow delete <id>` | `client.workflows.deleteFlow(id)` |
| `workflow move <id>` | `client.workflows.applyFlowOperation(id, CHANGE_FOLDER)` |
| `workflow publish <id>` | `client.workflows.applyFlowOperation(id, LOCK_AND_PUBLISH)` |
| `workflow enable <id>` | `client.workflows.applyFlowOperation(id, CHANGE_STATUS enabled)` |
| `workflow disable <id>` | `client.workflows.applyFlowOperation(id, CHANGE_STATUS disabled)` |
| `workflow run <id>` | `client.workflows.triggerFlow(id, payload)` |
| `workflow runs` | `client.workflows.listRuns()` |
| `workflow run-detail <runId>` | `client.workflows.getRun(runId)` |
| `workflow node list <id>` | `client.workflows.getFlow(id)` (parsed) |
| `workflow node add <id>` | `client.workflows.applyFlowOperation(id, ADD_ACTION / UPDATE_TRIGGER)` |
| `workflow node update <id> <node>` | `client.workflows.applyFlowOperation(id, UPDATE_ACTION)` |
| `workflow node delete <id> <node>` | `client.workflows.applyFlowOperation(id, DELETE_ACTION)` |
| `workflow piece list` | `client.workflows.listPieces()` |
| `workflow conn list` | `client.workflows.listConnections()` |
| `workflow conn get <connId>` | `client.workflows.getConnection(connId)` |
| `workflow conn create` | `client.workflows.upsertConnection(body)` |
| `workflow conn delete <id>` | `client.workflows.deleteConnection(id)` |
| `workflow folder list` | `client.workflows.listFolders()` |
| `workflow folder create` | `client.workflows.createFolder(body)` |
| `workflow folder update <id>` | `client.workflows.updateFolder(id, body)` |
| `workflow folder delete <id>` | `client.workflows.deleteFolder(id)` |
| `workflow mcp list` | `client.workflows.listMcpServers()` |
| `workflow mcp get <id>` | `client.workflows.getMcpServer(id)` |
| `workflow mcp create` | `client.workflows.createMcpServer(body)` |
| `workflow mcp delete <id>` | `client.workflows.deleteMcpServer(id)` |
| `workflow mcp rotate-token <id>` | `client.workflows.rotateMcpToken(id)` |
