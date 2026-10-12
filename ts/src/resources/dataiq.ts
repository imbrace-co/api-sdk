import { HttpTransport } from "../http.js"
import { ApiError, AuthError, ImbraceError } from "../errors.js"
import type {
  AiSummary, BoardSqlSchema, CameFromItem, CreateDataIqBoardInput, CreateDataIqItemInput, CreateRelationInput,
  CreateRunInput, CursorPage, DataIqBoard, DataIqHealth, DataIqItem, DataIqItemPage, DataIqMember, DataIqQueryPage,
  DataIqView, ExtractionRun, HistoryEntry, ItemFilter, LinksResult, ListDataIqBoardsParams, ListDataIqItemsParams,
  ListRunsParams, ListSourcesParams, NewDataIqField, PutBack, QueryDataIqItemsInput, RelationChange, RelationUsage,
  RunValue, SavedQuery, SavedQueryInput, SourceDetail, SourceItem, SqlResult, SqlSchema, TrashEntry,
  UpdateDataIqBoardInput, UpdateRelationInput, ViewConfig, ViewLayout, DataIqField,
} from "./dataiq-types.js"

/** A DataIQ v2 call the server refused for a known reason. `code` says which. */
export class DataIqError extends ImbraceError {
  constructor(
    /** `disabled`: v2 is off in this environment. `plan_limit`: over the plan's boards/records. `read_only`: the team is View-Only. */
    public readonly code: "disabled" | "plan_limit" | "read_only",
    public readonly statusCode: number,
    message: string,
  ) {
    super(message)
    this.name = "DataIqError"
  }
}

type Query = Record<string, string | number | boolean | string[] | undefined>
type Fetcher = <T>(method: string, path: string, opts?: { query?: Query; body?: unknown; form?: FormData }) => Promise<T>

function makeFetcher(http: HttpTransport, base: string): Fetcher {
  return async <T>(method: string, path: string, opts: { query?: Query; body?: unknown; form?: FormData } = {}) => {
    const url = new URL(`${base}${path}`)
    for (const [k, v] of Object.entries(opts.query ?? {})) {
      if (v === undefined) continue
      // arrays repeat the key (types=A&types=B); routes that take a comma list get a joined string
      if (Array.isArray(v)) v.forEach(x => url.searchParams.append(k, x))
      else url.searchParams.set(k, String(v))
    }
    const init: RequestInit = { method }
    if (opts.form) init.body = opts.form
    else if (opts.body !== undefined) {
      init.headers = { "Content-Type": "application/json" }
      init.body = JSON.stringify(opts.body)
    }
    let res: Response
    try {
      res = await http.getFetch()(url, init)
    } catch (e) {
      throw toDataIqError(e) ?? e
    }
    if (res.status === 204) return undefined as T
    const text = await res.text()
    return (text ? JSON.parse(text) : undefined) as T
  }
}

/** Map v2's documented refusals to DataIqError; anything else is rethrown as is. */
function toDataIqError(e: unknown): DataIqError | undefined {
  if (e instanceof ApiError) {
    if (e.statusCode === 503) return new DataIqError("disabled", 503, `DataIQ v2 is not available in this environment. ${e.message}`)
    if (e.statusCode === 402) return new DataIqError("plan_limit", 402, `The plan's DataIQ limit is reached. ${e.message}`)
  }
  if (e instanceof AuthError && /"code"\s*:\s*"read_only"/.test(e.message)) {
    return new DataIqError("read_only", 403, `Your team has View-Only access to this board. ${e.message}`)
  }
  return undefined
}

const data = <T>(r: { data: T }) => r.data

// ── Groups ───────────────────────────────────────────────────────────────────

class DataIqBoards {
  constructor(private readonly f: Fetcher) {}

  /** Boards of the org. */
  async list(params: ListDataIqBoardsParams = {}): Promise<{ data: DataIqBoard[]; total: number; count: number }> {
    return this.f("GET", "/boards", { query: { ...params } as Query })
  }

  async get(boardId: string): Promise<DataIqBoard> {
    return this.f<{ data: DataIqBoard }>("GET", `/boards/${boardId}`).then(data)
  }

  /** Create a board, with its columns if given. `type` defaults to `General`. */
  async create(body: CreateDataIqBoardInput): Promise<DataIqBoard> {
    return this.f<{ data: DataIqBoard }>("POST", "/boards", { body: { type: "General", ...body } }).then(data)
  }

  async update(boardId: string, body: UpdateDataIqBoardInput): Promise<DataIqBoard> {
    return this.f<{ data: DataIqBoard }>("PATCH", `/boards/${boardId}`, { body }).then(data)
  }

  /** Deletes the board and its records. */
  async delete(boardId: string): Promise<void> {
    await this.f("DELETE", `/boards/${boardId}`)
  }

  /** Record count per board, by board id. */
  async stats(boardIds: string[]): Promise<Record<string, { count: number }>> {
    return this.f<{ data: Record<string, { count: number }> }>("GET", "/boards/stats", { query: { ids: boardIds.join(",") } }).then(data)
  }
}

class DataIqFields {
  constructor(private readonly f: Fetcher) {}

  /** Add a column. Returns the new field. */
  async add(boardId: string, field: NewDataIqField): Promise<DataIqField> {
    const board = await this.f<{ data: DataIqBoard }>("POST", `/boards/${boardId}/fields`, { body: field }).then(data)
    return pickNewField(board, field.name)
  }

  /** Change a column. Returns the board with all its fields. */
  async update(boardId: string, fieldId: string, patch: Partial<NewDataIqField>): Promise<DataIqBoard> {
    return this.f<{ data: DataIqBoard }>("PATCH", `/boards/${boardId}/fields/${fieldId}`, { body: patch }).then(data)
  }

  async delete(boardId: string, fieldId: string): Promise<void> {
    await this.f("DELETE", `/boards/${boardId}/fields/${fieldId}`)
  }
}

class DataIqItems {
  constructor(private readonly f: Fetcher) {}

  async list(boardId: string, params: ListDataIqItemsParams = {}): Promise<DataIqItemPage> {
    return this.f("GET", `/boards/${boardId}/items`, { query: { ...params } as Query })
  }

  /** Filter with typed rules, e.g. `{ match: "and", rules: [{ fieldId, op: "gte", value: 100 }] }`. */
  async query(boardId: string, body: QueryDataIqItemsInput = {}): Promise<DataIqQueryPage> {
    return this.f("POST", `/boards/${boardId}/items/query`, { body })
  }

  async count(boardId: string): Promise<number> {
    return this.f<{ count: number }>("GET", `/boards/${boardId}/items/count`).then(r => r.count)
  }

  async get(boardId: string, itemId: string): Promise<DataIqItem> {
    return this.f<{ data: DataIqItem }>("GET", `/boards/${boardId}/items/${itemId}`).then(data)
  }

  /** Values go in `fields`, keyed by field id. Computed columns (formula, rollup, auto) are refused. */
  async create(boardId: string, body: CreateDataIqItemInput): Promise<DataIqItem> {
    return this.f<{ data: DataIqItem }>("POST", `/boards/${boardId}/items`, { body }).then(data)
  }

  async createMany(boardId: string, items: CreateDataIqItemInput[]): Promise<DataIqItem[]> {
    return this.f<{ data: DataIqItem[] }>("POST", `/boards/${boardId}/items/bulk`, { body: { items } }).then(data)
  }

  /** Only the fields given change. */
  async update(boardId: string, itemId: string, fields: Record<string, unknown>): Promise<DataIqItem> {
    return this.f<{ data: DataIqItem }>("PATCH", `/boards/${boardId}/items/${itemId}`, { body: { fields } }).then(data)
  }

  /** Moves the record to the trash (kept 30 days). */
  async delete(boardId: string, itemId: string): Promise<void> {
    await this.f("DELETE", `/boards/${boardId}/items/${itemId}`)
  }

  /** Moves the records to the trash. Returns how many. */
  async deleteMany(boardId: string, itemIds: string[]): Promise<number> {
    return this.f<{ count: number }>("DELETE", `/boards/${boardId}/items/bulk-delete`, { query: { ids: itemIds.join(",") } }).then(r => r.count)
  }

  /** Search records by title, to pick one to link. */
  async lookup(boardId: string, q: string, limit = 20): Promise<{ id: string; title: string }[]> {
    return this.f<{ data: { id: string; title: string }[] }>("GET", `/boards/${boardId}/lookup`, { query: { q, limit } }).then(data)
  }
}

class DataIqRelations {
  constructor(private readonly f: Fetcher) {}

  /** Add a relation column linking to another board, optionally with a back-link column there. */
  async create(boardId: string, body: CreateRelationInput): Promise<RelationChange> {
    return this.f<{ data: RelationChange }>("POST", `/boards/${boardId}/relations`, { body }).then(data)
  }

  async update(boardId: string, fieldId: string, patch: UpdateRelationInput): Promise<RelationChange> {
    return this.f<{ data: RelationChange }>("PATCH", `/boards/${boardId}/relations/${fieldId}`, { body: patch }).then(data)
  }

  async usage(boardId: string, fieldId: string): Promise<RelationUsage> {
    return this.f<{ data: RelationUsage }>("GET", `/boards/${boardId}/relations/${fieldId}/usage`).then(data)
  }

  /** Replace the records one record links to through a relation column (max 1000). */
  async setLinks(boardId: string, itemId: string, fieldId: string, linkedItemIds: string[]): Promise<LinksResult> {
    return this.f<{ data: LinksResult }>("PUT", `/boards/${boardId}/items/${itemId}/relations/${fieldId}`, { body: { ids: linkedItemIds } }).then(data)
  }

  /** Add the back-link column on the target board. */
  async addBacklink(boardId: string, fieldId: string, name?: string): Promise<RelationChange> {
    return this.f<{ data: RelationChange }>("POST", `/boards/${boardId}/fields/${fieldId}/backlink`, { body: { name } }).then(data)
  }
}

class DataIqViews {
  constructor(private readonly f: Fetcher) {}

  async list(boardId: string): Promise<DataIqView[]> {
    return this.f<{ data: DataIqView[] }>("GET", `/boards/${boardId}/views`).then(data)
  }

  async create(boardId: string, body: { name: string; layout: ViewLayout; config?: ViewConfig }): Promise<DataIqView> {
    return this.f<{ data: DataIqView }>("POST", `/boards/${boardId}/views`, { body: { config: {}, ...body } }).then(data)
  }

  async update(boardId: string, viewId: string, patch: { name?: string; layout?: ViewLayout; config?: ViewConfig }): Promise<DataIqView> {
    return this.f<{ data: DataIqView }>("PATCH", `/boards/${boardId}/views/${viewId}`, { body: patch }).then(data)
  }

  async delete(boardId: string, viewId: string): Promise<void> {
    await this.f("DELETE", `/boards/${boardId}/views/${viewId}`)
  }
}

class DataIqHistory {
  constructor(private readonly f: Fetcher) {}

  /** Changes to one record, newest first. */
  async list(boardId: string, itemId: string, params: { limit?: number; before?: string } = {}): Promise<HistoryEntry[]> {
    return this.f<{ data: HistoryEntry[] }>("GET", `/boards/${boardId}/items/${itemId}/history`, { query: params }).then(data)
  }

  /** Undo one change; refused when a cell no longer holds the value that change wrote. */
  async revert(boardId: string, itemId: string, historyId: string | number): Promise<DataIqItem> {
    return this.f<{ data: DataIqItem }>("POST", `/boards/${boardId}/items/${itemId}/history/${historyId}/revert`).then(data)
  }
}

class DataIqTrash {
  constructor(private readonly f: Fetcher) {}

  async list(boardId: string, limit = 100): Promise<TrashEntry[]> {
    return this.f<{ data: TrashEntry[] }>("GET", `/boards/${boardId}/trash`, { query: { limit } }).then(data)
  }

  /** Restores the records with their links and files. */
  async restore(boardId: string, itemIds: string[]): Promise<{ restored: number; alsoRestored: number; ids: string[] }> {
    return this.f<{ data: { restored: number; alsoRestored: number; ids: string[] } }>("POST", `/boards/${boardId}/trash/restore`, { body: { itemIds } }).then(data)
  }

  /** Deletes the records for good. Returns how many. */
  async forget(boardId: string, itemIds: string[]): Promise<number> {
    return this.f<{ data: { deleted: number } }>("POST", `/boards/${boardId}/trash/forget`, { body: { itemIds } }).then(r => r.data.deleted)
  }
}

class DataIqSql {
  constructor(private readonly f: Fetcher) {}

  /** Tables and columns the org can query: one table per board, named by its fields' `key`. */
  async schema(params: { tables?: string[] } = {}): Promise<SqlSchema> {
    return this.f("GET", "/sql/schema", { query: { tables: params.tables?.join(","), format: "json" } })
  }

  /**
   * Run one read-only SELECT across the org (max 5000 rows).
   * The gateway counts every POST as a write, so the API key needs write permission.
   */
  async run(sql: string, opts: { limit?: number; offset?: number } = {}): Promise<SqlResult> {
    return this.f("POST", "/sql", { body: { sql, ...opts } })
  }

  /** The schema of one board; query it by the `root` table name. */
  async boardSchema(boardId: string): Promise<BoardSqlSchema> {
    return this.f("GET", `/boards/${boardId}/sql-schema`)
  }

  /** Run a SELECT on one board and the boards it links to (max 200 rows). */
  async runOnBoard(boardId: string, sql: string, opts: { limit?: number; offset?: number } = {}): Promise<SqlResult> {
    return this.f("POST", `/boards/${boardId}/sql`, { body: { sql, ...opts } })
  }

  async listQueries(): Promise<SavedQuery[]> {
    return this.f<{ data: SavedQuery[] }>("GET", "/sql/queries").then(data)
  }

  async createQuery(body: SavedQueryInput): Promise<SavedQuery> {
    return this.f<{ data: SavedQuery }>("POST", "/sql/queries", { body }).then(data)
  }

  async updateQuery(queryId: string, patch: Partial<SavedQueryInput>): Promise<SavedQuery> {
    return this.f<{ data: SavedQuery }>("PATCH", `/sql/queries/${queryId}`, { body: patch }).then(data)
  }

  async deleteQuery(queryId: string): Promise<void> {
    await this.f("DELETE", `/sql/queries/${queryId}`)
  }
}

class DataIqSources {
  constructor(private readonly f: Fetcher) {}

  /** What came in (emails, chats, files), newest first, by cursor. */
  async list(params: ListSourcesParams = {}): Promise<CursorPage<SourceItem>> {
    return this.f("GET", "/sources/items", { query: { ...params } as Query })
  }

  async get(sourceId: string): Promise<SourceDetail> {
    return this.f<{ data: SourceDetail }>("GET", `/sources/items/${sourceId}`).then(data)
  }

  async summary(): Promise<{ total: number; byOrigin: Record<string, number> }> {
    return this.f<{ data: { total: number; byOrigin: Record<string, number> } }>("GET", "/sources/summary").then(data)
  }

  async connections(): Promise<{ channels: { id: string; name: string }[]; drives: unknown[] }> {
    return this.f<{ data: { channels: { id: string; name: string }[]; drives: unknown[] } }>("GET", "/sources/connections").then(data)
  }

  /** Upload files as sources (max 10 files, 25 MB). Form field: `files`. */
  async upload(form: FormData): Promise<{ data: SourceItem[]; added: number }> {
    return this.f("POST", "/sources/uploads", { form })
  }

  async delete(sourceId: string): Promise<void> {
    await this.f("DELETE", `/sources/items/${sourceId}`)
  }

  /** The sources a record came from. */
  async cameFrom(boardId: string, itemId: string): Promise<CameFromItem[]> {
    return this.f<{ data: CameFromItem[] }>("GET", `/boards/${boardId}/items/${itemId}/sources`).then(data)
  }

  /** Replace the sources a record came from (max 200). */
  async setCameFrom(boardId: string, itemId: string, sourceIds: string[], role?: "created" | "updated" | "matched" | "mentioned"): Promise<CameFromItem[]> {
    return this.f<{ data: CameFromItem[] }>("PUT", `/boards/${boardId}/items/${itemId}/sources`, { body: { ids: sourceIds, role } }).then(data)
  }
}

/** AI extraction runs and the values a person confirms or rejects (human in the loop). */
class DataIqRuns {
  constructor(private readonly f: Fetcher) {}

  /** Ask AI to fill values. `mode: "dry_run"` proposes them without writing. */
  async create(body: CreateRunInput): Promise<ExtractionRun> {
    return this.f<{ data: ExtractionRun }>("POST", "/extraction-runs", { body }).then(data)
  }

  async list(params: ListRunsParams = {}): Promise<CursorPage<ExtractionRun>> {
    return this.f("GET", "/extraction-runs", { query: { ...params } as Query })
  }

  async get(runId: string): Promise<ExtractionRun> {
    return this.f<{ data: ExtractionRun }>("GET", `/extraction-runs/${runId}`).then(data)
  }

  /** Proposed values with the quotes they came from. */
  async values(runId: string): Promise<RunValue[]> {
    return this.f<{ data: RunValue[] }>("GET", `/extraction-runs/${runId}/values`).then(data)
  }

  /** Confirm the given values, or all of the run's when omitted. */
  async confirm(runId: string, valueIds?: string[]): Promise<{ confirmed: number }> {
    return this.f<{ data: { confirmed: number } }>("POST", `/extraction-runs/${runId}/values/confirm`, { body: { valueIds } }).then(data)
  }

  /** Reject values: the cells get their previous values back. */
  async reject(runId: string, valueIds: string[]): Promise<PutBack> {
    return this.f<{ data: PutBack }>("POST", `/extraction-runs/${runId}/values/reject`, { body: { valueIds } }).then(data)
  }

  /** Put back everything the run wrote that nobody has confirmed or edited since. */
  async undo(runId: string): Promise<PutBack> {
    return this.f<{ data: PutBack }>("POST", `/extraction-runs/${runId}/undo`).then(data)
  }

  async cancel(runId: string): Promise<ExtractionRun> {
    return this.f<{ data: ExtractionRun }>("POST", `/extraction-runs/${runId}/cancel`).then(data)
  }

  /** How many AI values wait for a person, per board. */
  async toConfirm(boardIds?: string[]): Promise<Record<string, number>> {
    return this.f<{ data: Record<string, number> }>("GET", "/ai/to-confirm", { query: { board_ids: boardIds?.join(",") } }).then(data)
  }

  async boardSummary(boardId: string): Promise<AiSummary> {
    return this.f<{ data: AiSummary }>("GET", `/boards/${boardId}/ai-summary`).then(data)
  }

  /** AI state of each cell of a record, the runs that touched it and pending suggestions. */
  async item(boardId: string, itemId: string): Promise<Record<string, unknown>> {
    return this.f<{ data: Record<string, unknown> }>("GET", `/boards/${boardId}/items/${itemId}/ai`).then(data)
  }

  /** Answer an AI suggestion on a cell a person had filled: `accept` uses the new value. */
  async resolveSuggestion(boardId: string, itemId: string, fieldId: string, accept: boolean): Promise<void> {
    await this.f("POST", `/boards/${boardId}/items/${itemId}/fields/${fieldId}/suggestion`, { body: { accept } })
  }
}

// ── Resource ─────────────────────────────────────────────────────────────────

/**
 * DataIQ v2 (`/data-board/v2`): boards with relations, rollups and formulas, typed record
 * filters, read-only SQL across the org, sources, and AI values a person confirms.
 *
 * v2 keeps its own data, separate from `client.boards` (v1); the two do not sync. Both can be
 * used side by side. Knowledge Hub folders, files and drives stay on `client.boards`.
 */
export class DataIqResource {
  readonly boards: DataIqBoards
  readonly fields: DataIqFields
  readonly items: DataIqItems
  readonly relations: DataIqRelations
  readonly views: DataIqViews
  readonly history: DataIqHistory
  readonly trash: DataIqTrash
  readonly sql: DataIqSql
  readonly sources: DataIqSources
  readonly runs: DataIqRuns
  private readonly f: Fetcher

  /** @param base - DataIQ v2 base URL (`${gateway}/data-board/v2`) */
  constructor(http: HttpTransport, base: string) {
    this.f = makeFetcher(http, base)
    this.boards = new DataIqBoards(this.f)
    this.fields = new DataIqFields(this.f)
    this.items = new DataIqItems(this.f)
    this.relations = new DataIqRelations(this.f)
    this.views = new DataIqViews(this.f)
    this.history = new DataIqHistory(this.f)
    this.trash = new DataIqTrash(this.f)
    this.sql = new DataIqSql(this.f)
    this.sources = new DataIqSources(this.f)
    this.runs = new DataIqRuns(this.f)
  }

  /**
   * Whether v2 is switched on and ready in this environment. Never throws for a missing v2:
   * environments without it answer `{ enabled: false }`.
   */
  async health(): Promise<DataIqHealth> {
    try {
      return await this.f<DataIqHealth>("GET", "/health")
    } catch (e) {
      // 404: this data-board has no v2 code yet; 503 (DataIqError "disabled"): v2 is switched off
      if ((e instanceof ApiError && e.statusCode === 404) || (e instanceof DataIqError && e.code === "disabled")) {
        return { status: "unavailable", enabled: false, ready: false, error: e.message }
      }
      throw e
    }
  }

  /** Which side serves this org's old `/data-board` routes: `v1` or `v2`. v2 routes work either way. */
  async routing(): Promise<"v1" | "v2"> {
    return this.f<{ data: { serves: "v1" | "v2" } }>("GET", "/routing/self").then(r => r.data.serves)
  }

  /** People in the org, to fill people columns. */
  async members(params: { q?: string; limit?: number } = {}): Promise<DataIqMember[]> {
    return this.f<{ data: DataIqMember[] }>("GET", "/members", { query: params }).then(data)
  }
}

/** Field routes return the whole board; find the field just added by name (last match wins). */
function pickNewField(board: DataIqBoard, name: string): DataIqField {
  const matches = (board.fields ?? []).filter(fl => fl.name === name)
  const field = matches[matches.length - 1]
  if (!field) throw new ImbraceError(`DataIQ: field "${name}" not found on board ${board.id} after adding it`)
  return field
}

export type { ItemFilter }
