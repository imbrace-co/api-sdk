# Board Reference

`client.boards` is the core data store for CRM pipelines — leads, deals, tasks, or any structured data. Each board has custom fields and items. Boards can also be linked to the Knowledge Hub for AI-powered search.

For a guided walkthrough, see [DataBoards in the SDK guide](/sdk/databoard.md).

---

## Schema

### Board

| Field | Type | Description |
|-------|------|-------------|
| `object_name` | string? | Object type identifier |
| `id` | string | Unique board ID |
| `organization_id` | string | Organization this board belongs to |
| `name` | string | Board display name |
| `description` | string? | Optional description |
| `workflow_id` | string? | Linked workflow ID |
| `hidden` | boolean? | Whether the board is hidden |
| `team_ids` | string[]? | Teams with access |
| `created_at` | string | ISO 8601 creation timestamp |
| `updated_at` | string | ISO 8601 last-updated timestamp |

### BoardField

| Field | Type | Description |
|-------|------|-------------|
| `_id` | string | Unique field ID |
| `name` | string | Field display name |
| `type` | string | Field type (text, number, date, select, etc.) |
| `options` | object[]? | Type-specific configuration |
| `required` | boolean? | Whether the field is mandatory |

### CreateBoardInput

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | Yes | Board name |
| `description` | string | | Optional description |
| `type` | string | | Board type |
| `fields` | object[] | | Initial field definitions |
| `team_ids` | string[] | | Team IDs with access |
| `show_id` | boolean | | Show ID column |

---

## Methods

### Board CRUD

| Method | TypeScript | Python | Description |
|--------|-----------|--------|-------------|
| List boards | `list` | `list` | List all boards |
| Get board | `get` | `get` | Get a board by ID |
| Create board | `create` | `create` | Create a new board |
| Update board | `update` | `update` | Update board name/description |
| Delete board | `delete` | `delete` | Delete a board |
| Reorder boards | `reorder` | `reorder` | Change the display order |

### Import / Export

| Method | TypeScript | Python | Description |
|--------|-----------|--------|-------------|
| Export CSV | `exportCsv` | `export_csv` | Export all items as CSV |
| Import CSV | `importCsv` | `import_csv` | Import items from a CSV file |
| Import Excel | `importExcel` | `import_excel` | Import items from an Excel file |
| Get import progress | `getImportProgress` | `get_import_progress` | Poll the status of a running import |

### Fields

| Method | TypeScript | Python | Description |
|--------|-----------|--------|-------------|
| Create field | `createField` | `create_field` | Add a column to a board |
| Update field | `updateField` | `update_field` | Modify field config |
| Delete field | `deleteField` | `delete_field` | Remove a field |
| Reorder fields | `reorderFields` | `reorder_fields` | Change column order |
| Bulk update fields | `bulkUpdateFields` | `bulk_update_fields` | Update multiple fields at once |

### Items

| Method | TypeScript | Python | Description |
|--------|-----------|--------|-------------|
| List items | `listItems` | `list_items` | Paginated list of board items |
| Get item | `getItem` | `get_item` | Get a single item |
| Create item | `createItem` | `create_item` | Add an item to a board |
| Update item | `updateItem` | `update_item` | Update item field values |
| Delete item | `deleteItem` | `delete_item` | Remove an item |
| Bulk delete | `bulkDeleteItems` | `bulk_delete_items` | Delete multiple items by ID |
| Search | `search` | `search` | Full-text search within a board |
| Link items | `linkItems` | `link_items` | Link an item to a related board item |
| Unlink items | `unlinkItems` | `unlink_items` | Remove a link between items |

### Segments

| Method | TypeScript | Python | Description |
|--------|-----------|--------|-------------|
| List segments | `listSegments` | `list_segments` | List saved filter views |
| Create segment | `createSegment` | `create_segment` | Save a filter as a segment |
| Update segment | `updateSegment` | `update_segment` | Update a segment's filter |
| Delete segment | `deleteSegment` | `delete_segment` | Remove a segment |

---

## list / list

**TypeScript**

```typescript
const { data: boards } = await client.boards.list({ limit: 20 });
for (const board of boards) {
  console.log(board.id, board.name);
}
```

**Python**

```python
result = client.boards.list(limit=20)
for board in result.get("data", []):
    print(board["id"], board["name"])
```

---

## create / create

**TypeScript**

```typescript
const board = await client.boards.create({
  name: "Enterprise Leads",
  description: "Leads from the enterprise segment",
  fields: [
    { name: "Company", type: "text" },
    { name: "Deal Size", type: "number" },
    { name: "Stage", type: "select", options: { choices: ["Prospect", "Qualified", "Closed"] } },
  ],
});
```

**Python**

```python
board = client.boards.create(
    "Enterprise Leads",
    description="Leads from the enterprise segment",
    fields=[
        {"name": "Company", "type": "text"},
        {"name": "Deal Size", "type": "number"},
        {"name": "Stage", "type": "select", "options": {"choices": ["Prospect", "Qualified", "Closed"]}},
    ],
)
```

---

## createItem / create_item

Pass a `fields` array where each entry has a `board_field_id` (the `_id` of a `BoardField`) and the corresponding `value`.

**TypeScript**

```typescript
const item = await client.boards.createItem("board_id", {
  fields: [
    { board_field_id: "field_id_company", value: "Acme Corp" },
    { board_field_id: "field_id_deal_size", value: 50000 },
    { board_field_id: "field_id_stage", value: "Qualified" },
  ],
});
```

**Python**

```python
item = client.boards.create_item("board_id", {
    "fields": [
        {"board_field_id": "field_id_company", "value": "Acme Corp"},
        {"board_field_id": "field_id_deal_size", "value": 50000},
        {"board_field_id": "field_id_stage", "value": "Qualified"},
    ],
})
```

---

## listItems / list_items

**TypeScript**

```typescript
const page = await client.boards.listItems("board_id", { limit: 50, skip: 0 });
console.log(`${page.data.length} of ${page.total} items`);
```

**Python**

```python
page = client.boards.list_items("board_id", limit=50, skip=0)
print(f"{len(page['data'])} of {page['total']} items")
```

---

## search

Full-text search within a board's items.

**TypeScript**

```typescript
const results = await client.boards.search("board_id", {
  q: "Acme",
  limit: 20,
  offset: 0,
});
```

**Python**

```python
results = client.boards.search("board_id", q="Acme", limit=20, offset=0)
```

---

## importCsv / import_csv

**TypeScript**

```typescript
const formData = new FormData();
formData.append("file", csvBlob, "leads.csv");
const result = await client.boards.importCsv("board_id", formData);
console.log(`Imported: ${result.imported}, Errors: ${result.errors}`);
```

**Python**

```python
with open("leads.csv", "rb") as f:
    result = client.boards.import_csv("board_id", files={"file": f})
print(result)
```

---

## createField / create_field

**TypeScript**

```typescript
const field = await client.boards.createField("board_id", {
  name: "Priority",
  type: "select",
  options: { choices: ["Low", "Medium", "High"] },
});
```

**Python**

```python
field = client.boards.create_field("board_id", {
    "name": "Priority",
    "type": "select",
    "options": {"choices": ["Low", "Medium", "High"]},
})
```
