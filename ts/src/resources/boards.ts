import { HttpTransport } from "../http.js"
import { ApiError } from "../errors.js"
import type { Board, BoardItem, PagedResponse } from "../types/index.js"

/** Meilisearch-compatible envelope returned by `boards.search()`. */
export interface BoardSearchResponse {
  success: boolean
  message: {
    hits: BoardItem[]
    query?: string
    limit?: number
    offset?: number
    estimatedTotalHits?: number
    processingTimeMs?: number
    [key: string]: unknown
  }
}

export interface CreateBoardFieldInput {
  name: string
  type: string
  description?: string
  is_unique_identifier?: boolean
  is_default?: boolean
  is_identifier?: boolean
  hidden?: boolean
  hidden_on_record?: boolean
  data?: unknown[]
  board_child_mapped?: string
  [key: string]: unknown
}

export interface CreateBoardInput {
  name: string
  description?: string
  /**
   * Board kind. Use `"DocumentAI"` to create a Document AI board with
   * extraction schema embedded via `fields`. Other values: `"Contacts"`,
   * `"Opportunities"`, etc. Omit for default board type.
   */
  type?: string
  /** Schema fields, embedded at creation time (used by Document AI boards). */
  fields?: CreateBoardFieldInput[]
  team_ids?: string[]
  show_id?: boolean
  [key: string]: unknown
}

export interface UpdateBoardInput {
  name?: string
  description?: string
  [key: string]: unknown
}

export interface ReorderBoardsInput {
  order: string[]
  [key: string]: unknown
}

export interface ReorderBoardsResponse {
  success: boolean
  [key: string]: unknown
}

export interface ImportResponse {
  success: boolean
  imported?: number
  errors?: unknown[]
  [key: string]: unknown
}

export interface ImportProgressResponse {
  status: string
  progress?: number
  total?: number
  [key: string]: unknown
}

export interface BoardField {
  _id: string
  name: string
  type: string
  options?: unknown[]
  required?: boolean
  [key: string]: unknown
}

export interface CreateFieldInput {
  name: string
  type: string
  options?: unknown[]
  required?: boolean
  [key: string]: unknown
}

export interface UpdateFieldInput {
  name?: string
  options?: unknown[]
  required?: boolean
  [key: string]: unknown
}

export interface ReorderFieldsInput {
  fields: string[]
  [key: string]: unknown
}

export interface BulkUpdateFieldsInput {
  fields: Partial<BoardField>[]
  [key: string]: unknown
}

export interface FieldOperationResponse {
  success: boolean
  field?: BoardField
  [key: string]: unknown
}

export interface CreateItemInput {
  [key: string]: unknown
}

export interface UpdateItemInput {
  [key: string]: unknown
}

export interface BulkDeleteItemsInput {
  ids: string[]
  [key: string]: unknown
}

export interface BulkDeleteItemsResponse {
  success: boolean
  deleted?: number
  [key: string]: unknown
}

export interface LinkItemsInput {
  /** Related board item IDs to link. */
  relatedItemIds: string[]
  [key: string]: unknown
}

export interface LinkItemsResponse {
  success: boolean
  [key: string]: unknown
}

export interface BoardSegment {
  _id: string
  name: string
  filter?: Record<string, unknown>
  [key: string]: unknown
}

export interface CreateSegmentInput {
  name: string
  filter?: Record<string, unknown>
  [key: string]: unknown
}

export interface UpdateSegmentInput {
  name?: string
  filter?: Record<string, unknown>
  [key: string]: unknown
}

export interface KnowledgeFolder {
  _id: string
  name: string
  organization_id?: string
  /** `"root"` for a top-level folder. */
  parent_folder_id?: string
  /** @deprecated the server field is `parent_folder_id`. */
  parent_id?: string
  [key: string]: unknown
}

export interface CreateFolderInput {
  name: string
  /** Defaults to the caller's organization. */
  organization_id?: string
  /** Parent folder id; `"root"` (default) for a top-level folder. */
  parent_folder_id?: string
  /** @deprecated alias of `parent_folder_id`. */
  parent_id?: string
  /** `"upload"` (default), `"external"` or `"assistant"`. */
  source_type?: string
  description?: string
  tags?: string[]
  team_ids?: string[]
  [key: string]: unknown
}

export interface UpdateFolderInput {
  name?: string
  [key: string]: unknown
}

export interface DeleteFoldersInput {
  ids: string[]
  [key: string]: unknown
}

export interface DeleteFoldersResponse {
  success: boolean
  deleted?: number
  [key: string]: unknown
}

export interface KnowledgeFile {
  _id: string
  name: string
  folder_id?: string
  url?: string
  size?: number
  [key: string]: unknown
}

export interface CreateFileInput {
  name: string
  folder_id?: string
  content?: string
  [key: string]: unknown
}

export interface UpdateFileInput {
  name?: string
  content?: string
  [key: string]: unknown
}

export interface DeleteFilesInput {
  ids: string[]
  [key: string]: unknown
}

export interface DeleteFilesResponse {
  success: boolean
  deleted?: number
  [key: string]: unknown
}

export interface UploadFileResponse {
  id: string
  _id?: string
  name?: string
  folder_id?: string
  key?: string
  /** Not returned by the current data-board service. */
  url?: string
  /** Not returned by the current data-board service; use `id`. */
  file_id?: string
  [key: string]: unknown
}

export interface AiTagsInput {
  file_id?: string
  text?: string
  [key: string]: unknown
}

export interface AiTagsResponse {
  tags: string[]
  [key: string]: unknown
}

export interface LinkPreviewResponse {
  title?: string
  description?: string
  image?: string
  url: string
  [key: string]: unknown
}

/** `google-drive` or `onedrive`. */
export type DriveType = "google-drive" | "onedrive"

export interface DriveAuthResponse {
  /** Open this URL so the user can grant access. */
  auth_url?: string
  /** Pass to the drive list/download calls as `sessionId`. */
  session_id?: string
  [key: string]: unknown
}

export interface DriveSessionStatus {
  connected: boolean
  session_id: string
  is_expired?: boolean
  expires_at?: number
  time_remaining_ms?: number
  [key: string]: unknown
}

export interface DriveProvider {
  provider: string
  configured: boolean
}

export interface DriveItem {
  id: string
  name: string
  [key: string]: unknown
}

export interface OneDriveSessionStatus {
  status: string
  [key: string]: unknown
}

export class BoardsResource {
  /**
   * @param base    - data-board base URL (`${gateway}/data-board`) — board CRUD,
   *                  items, fields, segments, KnowledgeHub folders/files/drive
   * @param backend - legacy backend base URL (`${gateway}/v1/backend`) — only
   *                  used for link-preview + a couple of legacy endpoints that
   *                  haven't been migrated yet.
   */
  constructor(
    private readonly http: HttpTransport,
    private readonly base: string,
    private readonly backend: string,
    /** platform base URL (`${gateway}/platform`), used to look up the caller's org. */
    private readonly platform?: string,
  ) {}

  private orgId?: string

  /** The caller's organization: the client's configured org, else the account's. */
  private async resolveOrgId(): Promise<string | undefined> {
    if (this.orgId) return this.orgId
    this.orgId = this.http.getOrganizationId()
    if (!this.orgId && this.platform) {
      const me: any = await this.http.getFetch()(`${this.platform}/v1/account`, { method: "GET" }).then(r => r.json())
      this.orgId = me?.organization_id ?? me?.data?.organization_id
    }
    return this.orgId
  }

  async list(params?: { limit?: number; skip?: number; sort?: string; hidden?: boolean; types?: string }): Promise<{ data: Board[] }> {
    const url = new URL(`${this.base}/boards`)
    if (params?.limit !== undefined) url.searchParams.set("limit", String(params.limit))
    if (params?.skip !== undefined)  url.searchParams.set("skip", String(params.skip))
    if (params?.sort)                url.searchParams.set("sort", params.sort)
    if (params?.hidden !== undefined) url.searchParams.set("hidden", String(params.hidden))
    if (params?.types)               url.searchParams.set("types", params.types)
    return this.http.getFetch()(url, { method: "GET" }).then(r => r.json())
  }

  async get(boardId: string): Promise<Board> {
    return this.http.getFetch()(`${this.base}/boards/${boardId}`, { method: "GET" }).then(r => r.json()).then(unwrapData)
  }

  /**
   * Create a board.
   *
   * Pass `type: "DocumentAI"` + `fields: [...]` to create a Document AI board
   * with extraction schema embedded. `fields[].type` can be `ShortText`,
   * `Number`, `Date`, `Email`, `LongText`, etc.
   */
  async create(body: CreateBoardInput): Promise<Board> {
    return this.http.getFetch()(`${this.base}/boards`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }).then(r => r.json()).then(unwrapData)
  }

  async update(boardId: string, body: UpdateBoardInput): Promise<Board> {
    return this.http.getFetch()(`${this.base}/boards/${boardId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }).then(r => r.json()).then(unwrapData)
  }

  async delete(boardId: string): Promise<void> {
    await this.http.getFetch()(`${this.base}/boards/${boardId}`, { method: "DELETE" })
  }

  async reorder(body: ReorderBoardsInput): Promise<ReorderBoardsResponse> {
    return this.http.getFetch()(`${this.base}/boards/reorder`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }).then(r => r.json())
  }

  async exportCsv(boardId: string, params?: Record<string, string>): Promise<string> {
    const url = new URL(`${this.base}/boards/${boardId}/export_csv`)
    if (params) Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v))
    return this.http.getFetch()(url, { method: "GET" }).then(r => r.text())
  }

  async exportCsvViaMail(boardId: string, params?: Record<string, string>): Promise<unknown> {
    const url = new URL(`${this.base}/boards/${boardId}/export_csv`)
    if (params) Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v))
    return this.http.getFetch()(url, { method: "POST" }).then(r => r.json())
  }

  async importCsv(boardId: string, body: FormData): Promise<ImportResponse> {
    return this.http.getFetch()(`${this.base}/boards/${boardId}/import_csv`, {
      method: "POST",
      body,
    }).then(r => r.json())
  }

  async importExcel(boardId: string, body: FormData): Promise<ImportResponse> {
    return this.http.getFetch()(`${this.base}/boards/${boardId}/import`, {
      method: "POST",
      body,
    }).then(r => r.json())
  }

  async getImportProgress(boardId: string): Promise<ImportProgressResponse> {
    return this.http.getFetch()(`${this.base}/boards/${boardId}/import_progress`, { method: "GET" }).then(r => r.json())
  }

  /**
   * Add a field to a board. data-board returns the field directly (unlike
   * legacy backend which returned the full Board).
   */
  /** Adds a field. data-board responds with the whole board; the new field is returned. */
  async createField(boardId: string, body: CreateFieldInput): Promise<BoardField> {
    return this.http.getFetch()(`${this.base}/boards/${boardId}/fields`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }).then(r => r.json()).then(res => pickField(unwrapData(res), fields => [...fields].reverse().find(fl => fl.name === body.name)))
  }

  /** Updates a field. data-board responds with the whole board; the updated field is returned. */
  async updateField(boardId: string, fieldId: string, body: UpdateFieldInput): Promise<BoardField> {
    return this.http.getFetch()(`${this.base}/boards/${boardId}/fields/${fieldId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }).then(r => r.json()).then(res => pickField(unwrapData(res), fields => fields.find(fl => (fl.id ?? fl._id) === fieldId)))
  }

  async deleteField(boardId: string, fieldId: string): Promise<void> {
    await this.http.getFetch()(`${this.base}/boards/${boardId}/fields/${fieldId}`, { method: "DELETE" })
  }

  async reorderFields(boardId: string, body: ReorderFieldsInput): Promise<FieldOperationResponse> {
    return this.http.getFetch()(`${this.base}/boards/${boardId}/fields/reorder`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }).then(r => r.json())
  }

  async bulkUpdateFields(boardId: string, body: BulkUpdateFieldsInput): Promise<FieldOperationResponse> {
    return this.http.getFetch()(`${this.base}/boards/${boardId}/fields/bulk`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }).then(r => r.json())
  }

  async listItems(boardId: string, params?: { limit?: number; skip?: number }): Promise<PagedResponse<BoardItem>> {
    const url = new URL(`${this.base}/boards/${boardId}/items`)
    if (params?.limit !== undefined) url.searchParams.set("limit", String(params.limit))
    if (params?.skip !== undefined)  url.searchParams.set("skip", String(params.skip))
    return this.http.getFetch()(url, { method: "GET" }).then(r => r.json())
  }

  async getItem(boardId: string, itemId: string): Promise<BoardItem> {
    return this.http.getFetch()(`${this.base}/boards/${boardId}/items/${itemId}`, { method: "GET" }).then(r => r.json()).then(unwrapData)
  }

  async createItem(boardId: string, body: CreateItemInput): Promise<BoardItem> {
    return this.http.getFetch()(`${this.base}/boards/${boardId}/items`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }).then(r => r.json()).then(unwrapData)
  }

  /**
   * Update a board item. data-board accepts both `{fields: {fieldId: value}}`
   * (new natural shape) and `{data: [{key, value}]}` (legacy shape) — either
   * works.
   */
  async updateItem(boardId: string, itemId: string, body: UpdateItemInput): Promise<BoardItem> {
    return this.http.getFetch()(`${this.base}/boards/${boardId}/items/${itemId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }).then(r => r.json()).then(unwrapData)
  }

  async deleteItem(boardId: string, itemId: string): Promise<void> {
    await this.http.getFetch()(`${this.base}/boards/${boardId}/items/${itemId}`, { method: "DELETE" })
  }

  async bulkDeleteItems(boardId: string, body: BulkDeleteItemsInput): Promise<BulkDeleteItemsResponse> {
    return this.http.getFetch()(`${this.base}/boards/${boardId}/items/bulk-delete`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }).then(r => r.json())
  }

  async getRelatedItems(boardId: string, itemId: string, relatedBoardId: string): Promise<BoardItem[]> {
    return this.http.getFetch()(
      `${this.base}/boards/${boardId}/items/${itemId}/related/${relatedBoardId}`,
      { method: "GET" },
    ).then(r => r.json()).then((res: any) => res?.data ?? res)
  }

  async linkItems(boardId: string, itemId: string, relatedBoardId: string, body: LinkItemsInput): Promise<LinkItemsResponse> {
    return this.http.getFetch()(
      `${this.base}/boards/${boardId}/items/${itemId}/related`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ relatedBoardId, relatedItemIds: body.relatedItemIds }),
      },
    ).then(r => r.json())
  }

  async unlinkItems(boardId: string, itemId: string, relatedBoardId: string, body: LinkItemsInput): Promise<LinkItemsResponse> {
    return this.http.getFetch()(
      `${this.base}/boards/${boardId}/items/${itemId}/related`,
      {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ relatedBoardId, relatedItemIds: body.relatedItemIds }),
      },
    ).then(r => r.json())
  }

  /**
   * Search a single board. `POST /search/:boardId` (Meilisearch-compatible
   * envelope). Returns `{ success, message: { hits, ... } }` — the hits are
   * BoardItems with TableInTable fields hydrated to match the `/items` shape.
   * `organization_id` is enforced server-side, so cross-org results never leak.
   */
  async search(
    boardId: string,
    body: { q?: string; filter?: string; limit?: number; offset?: number; sort?: string[] },
  ): Promise<BoardSearchResponse> {
    return this.http.getFetch()(`${this.base}/search/${boardId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }).then(r => r.json())
  }

  async listSegments(boardId: string): Promise<BoardSegment[]> {
    return this.http.getFetch()(`${this.base}/boards/${boardId}/segmentation`, { method: "GET" }).then(r => r.json())
  }

  async createSegment(boardId: string, body: CreateSegmentInput): Promise<BoardSegment> {
    return this.http.getFetch()(`${this.base}/boards/${boardId}/segmentation`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }).then(r => r.json())
  }

  async updateSegment(boardId: string, segmentId: string, body: UpdateSegmentInput): Promise<BoardSegment> {
    return this.http.getFetch()(`${this.base}/boards/${boardId}/segmentation/${segmentId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }).then(r => r.json())
  }

  async deleteSegment(boardId: string, segmentId: string): Promise<void> {
    await this.http.getFetch()(`${this.base}/boards/${boardId}/segmentation/${segmentId}`, { method: "DELETE" })
  }

  /** All Knowledge Hub folders of the org. */
  async listFolders(params?: { ignoreAssistant?: boolean }): Promise<KnowledgeFolder[]> {
    const url = new URL(`${this.base}/folders`)
    if (params?.ignoreAssistant !== undefined) url.searchParams.set("ignore_assistant", String(params.ignoreAssistant))
    return this.http.getFetch()(url, { method: "GET" }).then(r => r.json()).then(r => r.data ?? r)
  }

  async searchFolders(params?: { organizationId?: string; q?: string }): Promise<KnowledgeFolder[]> {
    const url = new URL(`${this.base}/folders/search`)
    if (params?.organizationId) url.searchParams.set("organization_id", params.organizationId)
    if (params?.q) url.searchParams.set("q", params.q)
    return this.http.getFetch()(url, { method: "GET" }).then(r => r.json()).then(r => r.data ?? r)
  }

  async getFolder(folderId: string, params?: { recursive?: boolean }): Promise<KnowledgeFolder> {
    const url = new URL(`${this.base}/folders/${folderId}`)
    if (params?.recursive !== undefined) url.searchParams.set("recursive", String(params.recursive))
    return this.http.getFetch()(url, { method: "GET" }).then(r => r.json()).then(r => r.data?.folder ?? r.data ?? r)
  }

  /**
   * Create a Knowledge Hub folder.
   *
   * The server needs `organization_id`, `source_type` and `parent_folder_id`;
   * they default to the caller's org, `"upload"` and `"root"`.
   */
  async createFolder(body: CreateFolderInput): Promise<KnowledgeFolder> {
    const { parent_id, ...rest } = body
    const wire: Record<string, unknown> = {
      source_type: "upload",
      ...rest,
      parent_folder_id: body.parent_folder_id ?? parent_id ?? "root",
      organization_id: body.organization_id ?? await this.resolveOrgId(),
    }
    return this.http.getFetch()(`${this.base}/folders`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(wire),
    }).then(r => r.json()).then(r => r.data ?? r)
  }

  async updateFolder(folderId: string, body: UpdateFolderInput): Promise<KnowledgeFolder> {
    return this.http.getFetch()(`${this.base}/folders/${folderId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }).then(r => r.json()).then(r => r.data ?? r)
  }

  /** Turn syncing of an external (Drive) folder on or off. */
  async setFolderSync(folderId: string, enabled: boolean): Promise<KnowledgeFolder> {
    return this.http.getFetch()(`${this.base}/folders/${folderId}/sync`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_sync_enabled: enabled }),
    }).then(r => r.json()).then(r => r.data ?? r)
  }

  async deleteFolders(body: DeleteFoldersInput): Promise<DeleteFoldersResponse> {
    return this.http.getFetch()(`${this.base}/folders/delete`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }).then(r => r.json())
  }

  async searchFiles(params: { folderId: string }): Promise<KnowledgeFile[]> {
    const url = new URL(`${this.base}/files/search`)
    url.searchParams.set("folder_id", params.folderId)
    return this.http.getFetch()(url, { method: "GET" }).then(r => r.json()).then(r => r.data ?? r)
  }

  async getFile(fileId: string): Promise<KnowledgeFile> {
    return this.http.getFetch()(`${this.base}/files/${fileId}`, { method: "GET" }).then(r => r.json()).then(r => r.data ?? r)
  }

  async createFile(body: CreateFileInput): Promise<KnowledgeFile> {
    return this.http.getFetch()(`${this.base}/files`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }).then(r => r.json()).then(r => r.data ?? r)
  }

  async uploadFile(body: FormData): Promise<UploadFileResponse> {
    return this.http.getFetch()(`${this.base}/files/upload`, {
      method: "POST",
      body,
    }).then(r => r.json()).then(r => r.data ?? r)
  }

  async downloadFile(fileId: string): Promise<Response> {
    return this.http.getFetch()(`${this.base}/files/${fileId}/download`, { method: "GET" })
  }

  async deleteFiles(body: DeleteFilesInput): Promise<DeleteFilesResponse> {
    return this.http.getFetch()(`${this.base}/files/delete`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }).then(r => r.json())
  }

  async generateAiTags(body: AiTagsInput): Promise<AiTagsResponse> {
    return this.http.getFetch()(`${this.base}/ai/tag-generation`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }).then(r => r.json()).then(r => r.data ?? r)
  }

  async getLinkPreview(url: string): Promise<LinkPreviewResponse> {
    return this.http.getFetch()(`${this.base}/link_preview/getWebsiteInfo`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url }),
    }).then(r => r.json())
  }

  async uploadBoardFile(body: FormData): Promise<{ url: string }> {
    return this.http.getFetch()(`${this.base}/boards/_fileupload`, {
      method: "POST",
      body,
    }).then(r => r.json())
  }

  async uploadBoardFileV2(body: FormData): Promise<{ url: string }> {
    return this.http.getFetch()(`${this.base}/boards/upload`, {
      method: "POST",
      body,
    }).then(r => r.json())
  }

  async getFolderContents(folderId: string): Promise<KnowledgeFolder> {
    return this.http.getFetch()(`${this.base}/folders/${folderId}/contents`, { method: "GET" }).then(r => r.json()).then(r => r.data ?? r)
  }
  // data.folder = folder metadata, data.subfolders = [], data.files = []

  async updateFile(fileId: string, body: UpdateFileInput): Promise<KnowledgeFile> {
    return this.http.getFetch()(`${this.base}/files/${fileId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }).then(r => r.json()).then(r => r.data ?? r)
  }

  /** Which drive providers are configured on the server. */
  async listDriveProviders(): Promise<DriveProvider[]> {
    return this.http.getFetch()(`${this.base}/providers`, { method: "GET" }).then(r => r.json()).then(r => r.data ?? r)
  }

  /** Start the OAuth flow for a drive; returns `auth_url` and `session_id`. */
  async initiateDriveAuth(type: DriveType | string): Promise<DriveAuthResponse> {
    const url = new URL(`${this.base}/auth/${type}/initiate`)
    const org = await this.resolveOrgId()
    if (org) url.searchParams.set("organizationId", org)
    return this.http.getFetch()(url, { method: "GET" }).then(r => r.json()).then(r => r.data ?? r)
  }

  /** Whether the user finished the OAuth flow for `sessionId` (`connected: false` until they do). */
  async getDriveSessionStatus(type: DriveType | string, sessionId: string): Promise<DriveSessionStatus> {
    const url = new URL(`${this.base}/auth/${type}/session/status`)
    url.searchParams.set("sessionId", sessionId)
    try {
      const r = await this.http.getFetch()(url, { method: "GET" }).then(r => r.json())
      return { connected: true, ...(r.data ?? r) }
    } catch (e) {
      // the server only stores the session once the user has signed in
      if (e instanceof ApiError && e.statusCode === 404) return { connected: false, session_id: sessionId }
      throw e
    }
  }

  /** Folders in the drive. Params: `sessionId` (required), `parentId` (Google) or `folderId` (OneDrive), `q`, `skip`, `limit`. */
  async listDriveFolders(type: DriveType | string, params?: Record<string, string>): Promise<DriveItem[]> {
    const url = new URL(`${this.base}/${type}/folders`)
    if (params) Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v))
    return this.http.getFetch()(url, { method: "GET" }).then(r => r.json()).then(r => r.data ?? r)
  }

  /** Files in the drive. Params: `sessionId` (required), `parentId` (Google) or `folderId` (OneDrive), `recursive`. */
  async listDriveFiles(type: DriveType | string, params?: Record<string, string>): Promise<DriveItem[]> {
    const url = new URL(`${this.base}/${type}/files`)
    if (params) Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v))
    return this.http.getFetch()(url, { method: "GET" }).then(r => r.json()).then(r => r.data ?? r)
  }

  /** Background sync state of a drive. */
  async getDriveSyncStatus(type: DriveType | string): Promise<Record<string, unknown>> {
    return this.http.getFetch()(`${this.base}/${type}/sync/status`, { method: "GET" }).then(r => r.json()).then(r => r.data ?? r)
  }

  async downloadDriveFile(type: string, params?: Record<string, string>): Promise<Response> {
    const url = new URL(`${this.base}/${type}/files/download`)
    if (params) Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v))
    return this.http.getFetch()(url, { method: "GET" })
  }

  /** @deprecated use `getDriveSessionStatus("onedrive", sessionId)`. */
  async getOneDriveSessionStatus(sessionId: string): Promise<DriveSessionStatus> {
    return this.getDriveSessionStatus("onedrive", sessionId)
  }
}

/** data-board wraps single boards and items in `{ data }`. */
function unwrapData(res: any): any {
  return res && typeof res === "object" && !Array.isArray(res) && "data" in res ? res.data : res
}

/** Field endpoints return the parent board; pick the field out of `board.fields`. */
function pickField(res: any, find: (fields: any[]) => any): any {
  if (res && Array.isArray(res.fields)) return find(res.fields) ?? res
  return res
}
