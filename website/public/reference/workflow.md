# Workflow Reference

`client.workflows` manages the Imbrace flow engine: create and trigger automation flows, inspect run history, organize with folders, manage app connections and MCP servers, and access workflow tables.

For a guided walkthrough, see [Workflows in the SDK guide](/sdk/workflows.md).

---

## Schema

### Flow

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Unique flow ID |
| `created` | string | ISO 8601 creation timestamp |
| `updated` | string | ISO 8601 last-updated timestamp |
| `projectId` | string | Project this flow belongs to |
| `externalId` | string | Optional external identifier |
| `status` | `"ENABLED"` / `"DISABLED"` | Whether the flow is active |
| `operationStatus` | string | Current operation state |
| `version` | FlowVersion | Active version object |

### FlowVersion

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Unique version ID |
| `created` | string | ISO 8601 creation timestamp |
| `updated` | string | ISO 8601 last-updated timestamp |
| `flowId` | string | Flow this version belongs to |
| `displayName` | string | Human-readable flow name |
| `trigger` | object | Trigger configuration |
| `steps` | object? | Optional step configuration |
| `valid` | boolean? | Whether the version is valid |

### FlowRun

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Unique run ID |
| `created` | string | ISO 8601 creation timestamp |
| `updated` | string | ISO 8601 last-updated timestamp |
| `projectId` | string | Project ID |
| `flowId` | string | Flow that was executed |
| `flowVersionId` | string | Specific version that ran |
| `status` | `"RUNNING"` / `"SUCCEEDED"` / `"FAILED"` / `"TIMEOUT"` / `"PAUSED"` / `"STOPPED"` | Run outcome |
| `environment` | `"PRODUCTION"` / `"TESTING"` | Execution environment |
| `startTime` | string? | When the run started |
| `finishTime` | string? | When the run finished |
| `failParentOnFailure` | boolean | Whether failure propagates to parent flow |
| `tags` | string[]? | Tags attached to this run |

### AppConnection

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Unique connection ID |
| `created` | string | ISO 8601 creation timestamp |
| `updated` | string | ISO 8601 last-updated timestamp |
| `externalId` | string | External identifier |
| `displayName` | string | Human-readable name |
| `pieceName` | string | The piece (integration) this connection is for |
| `projectId` | string | Project ID |
| `type` | `"SECRET_TEXT"` / `"OAUTH2"` / `"CLOUD_OAUTH2"` / `"PLATFORM_OAUTH2"` / `"BASIC_AUTH"` / `"CUSTOM_AUTH"` | Connection auth type |

### McpServer

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Unique MCP server ID |
| `created` | string | ISO 8601 creation timestamp |
| `updated` | string | ISO 8601 last-updated timestamp |
| `projectId` | string | Project ID |
| `name` | string? | Server name |

---

## Methods

### Flows

| Method | TypeScript | Python | Description |
|--------|-----------|--------|-------------|
| List flows | `listFlows` | `list_flows` | Paginated list of flows |
| Get flow | `getFlow` | `get_flow` | Get a single flow by ID |
| Create flow | `createFlow` | `create_flow` | Create a new flow |
| Delete flow | `deleteFlow` | `delete_flow` | Delete a flow |
| Apply flow operation | `applyFlowOperation` | `apply_flow_operation` | Apply an operation (e.g. publish, enable) to a flow |
| Trigger flow | `triggerFlow` | `trigger_flow` | Trigger a flow asynchronously |
| Trigger flow sync | `triggerFlowSync` | `trigger_flow_sync` | Trigger a flow and wait for result |

### Flow Runs

| Method | TypeScript | Python | Description |
|--------|-----------|--------|-------------|
| List runs | `listRuns` | `list_runs` | List run history |
| Get run | `getRun` | `get_run` | Get a single run by ID |

### Folders

| Method | TypeScript | Python | Description |
|--------|-----------|--------|-------------|
| List folders | `listFolders` | `list_folders` | List flow folders |
| Get folder | `getFolder` | `get_folder` | Get a folder by ID |
| Create folder | `createFolder` | `create_folder` | Create a folder |
| Update folder | `updateFolder` | `update_folder` | Rename a folder |
| Delete folder | `deleteFolder` | `delete_folder` | Delete a folder |

### App Connections

| Method | TypeScript | Python | Description |
|--------|-----------|--------|-------------|
| List connections | `listConnections` | `list_connections` | List app connections |
| Get connection | `getConnection` | `get_connection` | Get a connection by ID |
| Upsert connection | `upsertConnection` | `upsert_connection` | Create or update a connection |
| Delete connection | `deleteConnection` | `delete_connection` | Remove a connection |

### MCP Servers

| Method | TypeScript | Python | Description |
|--------|-----------|--------|-------------|
| List MCP servers | `listMcpServers` | `list_mcp_servers` | List MCP servers |
| Get MCP server | `getMcpServer` | `get_mcp_server` | Get a server by ID |
| Create MCP server | `createMcpServer` | `create_mcp_server` | Register a new MCP server |
| Delete MCP server | `deleteMcpServer` | `delete_mcp_server` | Remove a server |
| Rotate token | `rotateMcpToken` | `rotate_mcp_token` | Rotate the server's auth token |

---

## listFlows / list_flows

**TypeScript**

```typescript
const page = await client.workflows.listFlows({
  limit: 10,
  status: "ENABLED",
  folderId: "folder_id",
});
for (const flow of page.data) {
  console.log(flow.id, flow.version?.displayName);
}
```

**Python**

```python
page = client.workflows.list_flows(limit=10, status="ENABLED", folder_id="folder_id")
for flow in page.get("data", []):
    print(flow["id"])
```

---

## createFlow / create_flow

**TypeScript**

```typescript
const flow = await client.workflows.createFlow({
  displayName: "New Lead Notification",
  projectId: "project_id",
});
console.log(flow.id);
```

**Python**

```python
flow = client.workflows.create_flow(
    display_name="New Lead Notification",
    project_id="project_id",
)
print(flow["id"])
```

---

## triggerFlow / trigger_flow

Trigger a flow asynchronously with an optional payload.

**TypeScript**

```typescript
await client.workflows.triggerFlow("flow_id", {
  contact_id: "contact_123",
  event: "lead_created",
});
```

**Python**

```python
client.workflows.trigger_flow("flow_id", {
    "contact_id": "contact_123",
    "event": "lead_created",
})
```

---

## listRuns / list_runs

**TypeScript**

```typescript
const page = await client.workflows.listRuns({
  flowId: "flow_id",
  status: "FAILED",
  limit: 20,
});
```

**Python**

```python
page = client.workflows.list_runs(
    flow_id="flow_id",
    status="FAILED",
    limit=20,
)
```

---

## upsertConnection / upsert_connection

Create or update an app connection (e.g. API key for a third-party service).

**TypeScript**

```typescript
const conn = await client.workflows.upsertConnection({
  displayName: "Slack Workspace",
  pieceName: "slack",
  projectId: "project_id",
  type: "SECRET_TEXT",
  value: { api_key: "xoxb-..." },
});
```

**Python**

```python
conn = client.workflows.upsert_connection({
    "displayName": "Slack Workspace",
    "pieceName": "slack",
    "projectId": "project_id",
    "type": "SECRET_TEXT",
    "value": {"api_key": "xoxb-..."},
})
```

---

## createMcpServer / create_mcp_server

**TypeScript**

```typescript
const server = await client.workflows.createMcpServer({
  name: "My MCP Server",
  projectId: "project_id",
});
```

**Python**

```python
server = client.workflows.create_mcp_server({
    "name": "My MCP Server",
    "projectId": "project_id",
})
```
