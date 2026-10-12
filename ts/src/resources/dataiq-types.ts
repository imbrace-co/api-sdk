// Types for DataIQ v2 (`/data-board/v2`). Written by hand: v2 has no OpenAPI catalog yet.
// Shapes follow data_board's v2 Zod schemas and the DataIQ v2 web client.

// ── Boards & fields ──────────────────────────────────────────────────────────

export type DataIqFieldType =
  | "ShortText" | "LongText" | "Number" | "Email" | "Phone" | "Date" | "Datetime" | "Time"
  | "SingleSelection" | "MultipleSelection" | "Assignee" | "MultipleAssignee" | "Priority"
  | "Currency" | "Link" | "Attachment" | "Notes" | "Country" | "Origin"
  | "MapToBoard" | "TableInTable" | "Checkbox" | "Formula" | "Rating" | "Rollup"
  // filled in by the server; never written
  | "AutoId" | "CreatedTime" | "CreatedBy" | "LastEditedTime"

export interface DataIqFieldOption {
  id: string
  value: string
  color?: string
}

export type RollupFn = "count" | "sum" | "average" | "min" | "max" | "latest" | "list"

export interface RollupSettings {
  relationFieldId: string
  targetFieldId?: string
  fn: RollupFn
  /** Only linked records that match are summarised. */
  filter?: { fieldId: string; op: "is" | "is_not" | "is_empty" | "is_not_empty"; value?: string }
  /** `"number"` or `"currency:USD"`. */
  format?: string
}

/** A column AI fills: what to find, where to look, and who confirms the values. */
export interface AiColumnSettings {
  prompt: string
  where: { fileFieldIds: string[]; relationFieldIds: string[]; notes: boolean }
  runOn: "new_and_changed" | "new" | "manual"
  /** `person`: every value waits for a person. `when_sure`: values at or above `threshold` are confirmed. */
  confirm: "person" | "when_sure"
  threshold?: number
}

export interface DataIqFieldSettings {
  /** Relation columns (`MapToBoard`). */
  targetBoardId?: string
  many?: boolean
  pairFieldId?: string
  /** Set on a back-link column: the column it mirrors. */
  mirrorOf?: string
  onDelete?: "unlink" | "delete"
  rollup?: RollupSettings
  /** The expression names columns by id: `{<fieldId>}`. */
  formula?: { expression: string; result?: "number" | "text" | "boolean" | "date"; format?: string }
  ai?: AiColumnSettings
  /** `ORD-0015` is prefix `ORD`, 4 digits. */
  autoId?: { prefix: string; digits?: number }
  [key: string]: unknown
}

export interface DataIqField {
  id: string
  _id?: string
  name: string
  type: DataIqFieldType
  /** Stable column name, kept on rename; this is the column name in SQL. */
  key?: string
  description?: string
  data?: DataIqFieldOption[]
  settings?: DataIqFieldSettings
  role?: string
  hidden?: boolean
  hiddenOnRecord?: boolean
  isDefault?: boolean
  isIdentifier?: boolean
  isUniqueIdentifier?: boolean
  isDeprecated?: boolean
  [key: string]: unknown
}

export interface DataIqBoard {
  _id: string
  id: string
  organization_id: string
  name: string
  description?: string
  type: string
  hidden?: boolean
  key?: string | null
  icon?: string | null
  color?: string | null
  fields: DataIqField[]
  managers?: unknown[]
  team_ids?: string[]
  /** Set when the board was made from a Document Model. */
  from_schema_id?: string | null
  category_id?: string | null
  items_count?: number
  created_at: string
  updated_at: string
  [key: string]: unknown
}

export interface NewDataIqField {
  name: string
  type: DataIqFieldType
  /** Options of a selection column. */
  data?: { value: string; color?: string }[]
  settings?: DataIqFieldSettings
  key?: string
  role?: string
  isUniqueIdentifier?: boolean
  isDefault?: boolean
  [key: string]: unknown
}

export interface CreateDataIqBoardInput {
  name: string
  /** Defaults to `General`. */
  type?: string
  description?: string
  fields?: NewDataIqField[]
  team_ids?: string[]
  category?: string
  icon?: string
  color?: string
  [key: string]: unknown
}

export interface UpdateDataIqBoardInput {
  name?: string
  description?: string
  icon?: string | null
  color?: string | null
  hidden?: boolean
  [key: string]: unknown
}

export interface ListDataIqBoardsParams {
  search?: string
  types?: string[]
  teamIds?: string[]
  hidden?: boolean
  category_id?: string
  from_schema_id?: string
  /** Max 500. */
  limit?: number
  skip?: number
}

// ── Records ──────────────────────────────────────────────────────────────────

/** A record that a relation column links to. */
export interface RelationRef {
  id: string
  title: string
  boardId: string
}

export interface DataIqItem {
  _id: string
  id: string
  board_id: string
  /** Values by field id. */
  fields: Record<string, unknown>
  /** Linked records per relation column. */
  relations?: Record<string, RelationRef[]>
  /** Cells AI has filled, by field id: unconfirmed until a person confirms. */
  ai?: Record<string, { state: "ai_unconfirmed" | "confirmed" | "manual"; valueId?: string | null; suggested?: boolean }>
  created_type?: string
  contact_id?: string | null
  metadata?: Record<string, unknown>
  created_at: string
  updated_at: string
  [key: string]: unknown
}

export interface ListDataIqItemsParams {
  skip?: number
  /** Max 1000. */
  limit?: number
  sort?: string
  include_parent?: boolean
}

export interface DataIqItemPage {
  data: DataIqItem[]
  count: number
  skip: number
  limit: number
  totalPages?: number
}

export type FilterOp =
  // text
  | "is" | "is_not" | "contains" | "not_contains" | "starts_with" | "ends_with"
  // number
  | "eq" | "ne" | "gt" | "gte" | "lt" | "lte"
  // date
  | "before" | "after" | "on_or_before" | "on_or_after"
  // select
  | "is_any_of" | "is_none_of"
  // multi select, relation, people
  | "contains_any" | "contains_all" | "contains_none"
  // checkbox
  | "checked" | "unchecked"
  // any column
  | "is_empty" | "is_not_empty"

export interface FilterRule {
  fieldId: string
  op: FilterOp
  value?: unknown
}

export interface ItemFilter {
  match: "and" | "or"
  /** Max 20 rules. */
  rules: FilterRule[]
}

export interface QueryDataIqItemsInput {
  filter?: ItemFilter
  /** Comma-separated; `-` sorts descending, e.g. `-created_at,fields.<fieldId>`. */
  sort?: string
  skip?: number
  /** Max 1000. */
  limit?: number
  timeZone?: string
}

export interface DataIqQueryPage {
  data: DataIqItem[]
  total: number
  /** The count stopped at the server's cap: there are at least `total`. */
  totalCapped: boolean
  skip: number
  limit: number
  hasMore: boolean
}

export interface CreateDataIqItemInput {
  /** Values by field id. */
  fields: Record<string, unknown>
  created_type?: "manual" | "import" | "api" | "automation" | "system"
  contact_id?: string
  metadata?: Record<string, unknown>
}

// ── Relations ────────────────────────────────────────────────────────────────

export interface CreateRelationInput {
  name: string
  targetBoardId: string
  many: boolean
  /** Also show the links on the target board. */
  backlink?: { enabled: boolean; name?: string }
  onDelete?: "unlink" | "delete"
}

export interface UpdateRelationInput {
  name?: string
  /** Only while the column holds no links. */
  targetBoardId?: string
  many?: boolean
  onDelete?: "unlink" | "delete"
  backlink?: { enabled: boolean; name?: string }
}

export interface RelationChange {
  board: DataIqBoard
  target: DataIqBoard
  previousTarget?: DataIqBoard
}

export interface RelationUsage {
  links: number
  records: number
  /** Records linking to more than one: they keep the relation from switching to one. */
  recordsWithSeveral: number
}

export interface LinksResult {
  id: string
  fields: Record<string, unknown>
  relations: Record<string, RelationRef[]>
}

// ── Views, history, trash ────────────────────────────────────────────────────

export type ViewLayout = "table" | "board" | "calendar"

export interface ViewConfig {
  filter?: ItemFilter
  sort?: unknown
  groupBy?: string
  dateField?: string
  hidden?: string[]
  [key: string]: unknown
}

export interface DataIqView {
  id: string
  name: string
  layout: ViewLayout
  config: ViewConfig
  [key: string]: unknown
}

export interface HistoryEntry {
  id: string | number
  at: string
  action: string
  /** `user:<id>`, `ai:<run>`, `import:<id>`. */
  actor: string
  /** `{ fieldId: [before, after] }`. */
  changes: Record<string, [unknown, unknown]>
}

export interface TrashEntry {
  itemId: string
  title: string
  deletedAt: string
  deletedBy: string | null
  /** Deleted together with these records (a relation that deletes with its record). */
  cause: string[] | null
}

// ── SQL ──────────────────────────────────────────────────────────────────────

export interface SqlColumn {
  name: string
  type: string
  label?: string
  description?: string
  field_id?: string
  field_type?: string
  is_title?: boolean
  values?: string[]
  /** `customers.id`: this column holds ids of that table. */
  references?: string
}

export interface SqlTable {
  name: string
  kind: "board" | "link" | "system"
  label: string
  board_id?: string
  storage?: "live" | "typed"
  row_count?: number
  description?: string
  columns: SqlColumn[]
  [key: string]: unknown
}

export interface SqlSchema {
  dialect: "postgresql"
  functions: string[]
  tables: SqlTable[]
  joins: Array<{ from: string; to: string; via: string }>
  limits: Record<string, number>
  rules: string[]
  examples: Array<{ purpose: string; sql: string }>
  [key: string]: unknown
}

/** The schema of one board, for agents: `root` is the table name to query. */
export interface BoardSqlSchema {
  dialect: "postgresql"
  root: string
  relations: unknown[]
  joins: unknown[]
  limits: Record<string, number>
  rules: string[]
  [key: string]: unknown
}

export interface SqlResult {
  columns: Array<{ name: string; type: string }>
  rows: Array<Record<string, unknown>>
  meta: { returned: number; offset: number; hasMore: boolean; truncated: boolean; plan_cost?: number; ms?: number }
  sql_executed: string
  relations_read: string[]
  tables?: Record<string, { storage: "live" | "typed"; lag_ms?: number }>
}

export type Visibility = "private" | "team" | "org"

export interface SavedQuery {
  id: string
  name: string
  description: string | null
  sql: string
  visibility: Visibility
  teamIds: string[]
  createdBy: string
  createdAt: string
  updatedAt: string
  mine: boolean
  [key: string]: unknown
}

export interface SavedQueryInput {
  name: string
  description?: string | null
  sql: string
  visibility: Visibility
}

// ── Sources ──────────────────────────────────────────────────────────────────

export type SourceFormat = "email" | "chat" | "voice" | "pdf" | "image" | "sheet" | "doc" | "video" | "audio" | "other"

/** One thing that came in: an email, a chat message, a file. */
export interface SourceItem {
  id: string
  origin: string
  kind: "thread" | "message" | "file"
  format: SourceFormat
  parentId: string | null
  title: string | null
  occurredAt: string
  snippet: string | null
  meta: Record<string, unknown>
  hasFile: boolean
  contentStatus: string
  /** How many records were read from it. */
  linkedCount: number
  [key: string]: unknown
}

export interface SourceDetail extends SourceItem {
  content: unknown
  contentVersion: number | null
  children: Array<SourceItem & { text: string | null }>
  linked: Array<{ boardId: string; boardName: string; itemId: string; title: string; role: string | null }>
}

export interface ListSourcesParams {
  origin?: string
  group?: string
  format?: string
  q?: string
  parent_id?: string
  /** Also attachments and messages. */
  nested?: boolean
  cursor?: string
  limit?: number
}

export interface CameFromItem extends SourceItem {
  role: string | null
}

// ── AI / human in the loop ───────────────────────────────────────────────────

export type RunTrigger = "source" | "ai_column" | "record_file" | "manual"
export type RunStatus = "queued" | "running" | "proposed" | "applied" | "failed" | "cancelled"

export type EvidenceAnchor =
  | { t: "chars"; start: number; end: number }
  | { t: "box"; page: number; x: number; y: number; w: number; h: number }
  | { t: "time"; start_ms: number; end_ms: number }
  | { t: "cells"; sheet?: string; range: string }
  | { t: "page"; page: number }

export interface Evidence {
  sourceItemId: string
  anchor: EvidenceAnchor
  quote: string | null
  source?: unknown
}

export interface ExtractionRun {
  id: string
  trigger: RunTrigger
  boardId: string | null
  fieldId: string | null
  target: { all?: boolean; itemIds?: string[]; [key: string]: unknown }
  sourceItemIds?: string[]
  mode: "apply" | "dry_run"
  status: RunStatus
  summary: {
    applied: number
    confirmed: number
    suggested: number
    unchanged: number
    proposed: number
    skipped: Array<{ itemId: string; fieldId: string; reason: string }>
  } | null
  error: string | null
  createdAt: string
  finishedAt: string | null
  [key: string]: unknown
}

export interface RunValue {
  id: string
  boardId: string
  itemId: string
  fieldId: string
  value: unknown
  confidence: number | null
  note: string | null
  status: string
  evidence: Evidence[]
}

export interface CreateRunInput {
  trigger: RunTrigger
  boardId?: string
  fieldId?: string
  itemIds?: string[]
  /** What to read, for trigger `source`. */
  sourceItemIds?: string[]
  /** `dry_run` proposes values without writing them. */
  mode?: "apply" | "dry_run"
  idempotencyKey?: string
  draftField?: { name: string; ai: AiColumnSettings; type?: DataIqFieldType; options?: string[] }
}

export interface ListRunsParams {
  board_id?: string
  status?: RunStatus
  trigger?: RunTrigger
  source_item_id?: string
  cursor?: string
  limit?: number
}

/** Values put back by reject / undo. */
export interface PutBack {
  undone: number
  skipped: Array<{ itemId: string; fieldId: string; reason: "confirmed" | "edited" }>
}

export interface AiSummary {
  toConfirm: { total: number; byField: Record<string, number> }
  suggestions: number
  runningRuns: number
}

// ── Misc ─────────────────────────────────────────────────────────────────────

/** A cursor page: pass `next_cursor` back as `cursor`; null when there is no more. */
export interface CursorPage<T> {
  data: T[]
  next_cursor: string | null
}

export interface DataIqMember {
  id: string
  name: string
  email: string | null
  avatarUrl: string | null
}

export interface DataIqHealth {
  status: string
  /** v2 is switched on in this environment. */
  enabled: boolean
  ready: boolean
  error: string | null
}
