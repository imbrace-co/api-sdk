import { HttpTransport } from "../http.js"
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
  parent_id?: string
  [key: string]: unknown
}

export interface CreateFolderInput {
  name: string
  organization_id?: string
  parent_id?: string
  /** Defaults to `"upload"` (the only enum value the backend currently accepts). */
  source_type?: string
  /** Defaults to `"root"` for top-level folders. Backend rejects null. */
  parent_folder_id?: string
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
  url: string
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

export interface DriveAuthResponse {
  auth_url?: string
  [key: string]: unknown
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
  ) {}

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
    return this.http.getFetch()(`${this.base}/boards/${boardId}`, { method: "GET" }).then(r => r.json())
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
    }).then(r => r.json())
  }

  async update(boardId: string, body: UpdateBoardInput): Promise<Board> {
    return this.http.getFetch()(`${this.base}/boards/${boardId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }).then(r => r.json())
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
  async createField(boardId: string, body: CreateFieldInput): Promise<BoardField> {
    return this.http.getFetch()(`${this.base}/boards/${boardId}/fields`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }).then(r => r.json())
  }

  async updateField(boardId: string, fieldId: string, body: UpdateFieldInput): Promise<BoardField> {
    return this.http.getFetch()(`${this.base}/boards/${boardId}/fields/${fieldId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }).then(r => r.json())
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
    return this.http.getFetch()(`${this.base}/boards/${boardId}/items/${itemId}`, { method: "GET" }).then(r => r.json())
  }

  async createItem(boardId: string, body: CreateItemInput): Promise<BoardItem> {
    return this.http.getFetch()(`${this.base}/boards/${boardId}/items`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }).then(r => r.json())
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
    }).then(r => r.json())
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
   * Backend requires `source_type` (only valid: `"upload"`) and `parent_folder_id`
   * (use `"root"` for top-level). This wrapper auto-fills both with sane defaults
   * if the caller omits them.
   */
  async createFolder(body: CreateFolderInput): Promise<KnowledgeFolder> {
    const wire: Record<string, unknown> = {
      source_type: "upload",
      parent_folder_id: "root",
      ...body,
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

  async initiateDriveAuth(type: string): Promise<DriveAuthResponse> {
    return this.http.getFetch()(`${this.base}/auth/${type}/initiate`, { method: "GET" }).then(r => r.json())
  }

  async listDriveFolders(type: string, params?: Record<string, string>): Promise<DriveItem[]> {
    const url = new URL(`${this.base}/${type}/folders`)
    if (params) Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v))
    return this.http.getFetch()(url, { method: "GET" }).then(r => r.json())
  }

  async listDriveFiles(type: string, params?: Record<string, string>): Promise<DriveItem[]> {
    const url = new URL(`${this.base}/${type}/files`)
    if (params) Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v))
    return this.http.getFetch()(url, { method: "GET" }).then(r => r.json())
  }

  async downloadDriveFile(type: string, params?: Record<string, string>): Promise<Response> {
    const url = new URL(`${this.base}/${type}/files/download`)
    if (params) Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v))
    return this.http.getFetch()(url, { method: "GET" })
  }

  async getOneDriveSessionStatus(): Promise<OneDriveSessionStatus> {
    return this.http.getFetch()(`${this.base}/auth/onedrive/files/session/status`, { method: "GET" }).then(r => r.json())
  }
}
