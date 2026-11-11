import { HttpTransport } from "../http.js"

/** One field a Document Model extracts. `type` is a board field type (e.g. `ShortText`, `Number`, `Date`) or `RichText`. */
export interface DocumentModelAttribute {
  id?: string
  name: string
  type: string
  description?: string
  [key: string]: unknown
}

/** The product that owns a Document Model: `"DocumentAI"` is DocIQ, `"Comms"` is CommsIQ. */
export type DocumentModelType = "DocumentAI" | "Comms"

export interface DocumentModel {
  id: string
  name: string
  /** Owning product. Models saved before CommsIQ existed are `"DocumentAI"`. */
  type?: DocumentModelType
  description?: string
  category?: string
  attributes: DocumentModelAttribute[]
  current_version?: number
  [key: string]: unknown
}

export interface CreateDocumentModelInput {
  name: string
  /**
   * Owning product, `"DocumentAI"` (DocIQ) when left out. Set on create only:
   * a model never moves to another product.
   */
  type?: DocumentModelType
  description?: string
  /** Category id (see {@link DocumentModelsResource.listCategories}). */
  category?: string
  attributes?: DocumentModelAttribute[]
  accessTeams?: string[]
  /**
   * @deprecated The backend ignores this key. Link an assistant with
   * {@link DocumentModelsResource.provisionBoards} (`assistant_id`).
   */
  agents?: string[]
  /**
   * @deprecated The backend ignores this key: a model gets its board from
   * {@link DocumentModelsResource.provisionBoards}.
   */
  databoards?: string[]
  /** Stored on the version this change creates. */
  change_note?: string
  [key: string]: unknown
}

/**
 * Model fields to change, plus settings for the model's board. The board
 * settings do nothing until the board exists (see {@link DocumentModelsResource.provisionBoards}).
 */
export type UpdateDocumentModelInput = Partial<CreateDocumentModelInput> & {
  /** Rename the model's board. */
  data_board_name?: string
  /** Move the model's board to this category (a `databoard` category id). */
  board_category_id?: string
  /** Team ids that can use the model's board. Empty = all teams. */
  board_deployment_access?: string[]
}

export interface DocumentModelList {
  data: DocumentModel[]
  count: number
  limit: number
  skip: number
}

export interface DocumentModelVersion {
  version: number
  change_note?: string
  created_at?: string
  /** Full model as it was at this version (only on {@link DocumentModelsResource.getVersion}). */
  snapshot?: DocumentModel
  [key: string]: unknown
}

export interface DocumentModelVersionList {
  data: DocumentModelVersion[]
  count: number
  current_version: number
  limit: number
  skip: number
}

/** `schema` holds DocIQ models, `databoard` holds boards, `comms` holds CommsIQ models. */
export type DocumentCategoryType = "schema" | "databoard" | "comms"

export interface DocumentCategory {
  id: string
  name: string
  type: DocumentCategoryType
  parentId?: string | null
  children?: DocumentCategory[]
  [key: string]: unknown
}

export interface ExtractAttributesInput {
  /** 1 to 5 sample document URLs. */
  file_urls: string[]
  provider_id?: string
  model_name?: string
  [key: string]: unknown
}

/** How Document AI reads files for one product (DocIQ, CommsIQ, …). */
export interface UpdateDocumentSettingsInput {
  /** Vision model used to read pages. */
  vlm_provider_id?: string
  vlm_model?: string
  /** Language model used to fill the attributes. */
  llm_provider_id?: string
  llm_model?: string
  /** Empty = detect the language. */
  source_languages?: string[]
  handwriting_support?: boolean
  /** UTC offset label, e.g. `UTC+08:00`. */
  time_offset?: string
  continue_on_failure?: boolean
  /** 0–10; 0 never retries. */
  retry_time?: number
  /** Thousands of tokens per extraction call, 1–4096. */
  max_token_limit?: number
  /** `false` skips the OCR confidence pass on scans and images. */
  ocr_enabled?: boolean
  /**
   * Whole percent, 0–100. A value read with lower confidence is flagged for
   * review instead of accepted; 0 flags nothing.
   */
  confidence_score_threshold?: number
}

export interface DocumentSettings extends UpdateDocumentSettingsInput {
  id: string
  organization_id: string
  type: string
  [key: string]: unknown
}

export interface ProvisionBoardsInput {
  /** Link the new boards to this assistant. */
  assistant_id?: string
  schemas: Array<{ schema_id: string; data_board_name?: string; board_category_id?: string; board_deployment_access?: string[] }>
}

/**
 * DocIQ Document Models: the schemas that tell Document AI which fields to
 * extract, their version history, and the category tree they are filed in.
 *
 * Lives in data-board (`/data-board/schemas`, `/data-board/categories`).
 * These categories are not the platform conversation categories in `client.categories`.
 */
export class DocumentModelsResource {
  /** @param base - data-board base URL (`${gateway}/data-board`) */
  constructor(private readonly http: HttpTransport, private readonly base: string) {}

  private json(path: string, method: string, body?: unknown): Promise<any> {
    return this.http.getFetch()(`${this.base}${path}`, {
      method,
      ...(body !== undefined ? { headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) } : {}),
    }).then(r => (r.status === 204 ? undefined : r.json()))
  }

  // ── Models ────────────────────────────────────────────────────────────────

  /** `type` narrows the list to one product; all models when left out. */
  async list(params?: { search?: string; type?: DocumentModelType; categoryId?: string; limit?: number; skip?: number }): Promise<DocumentModelList> {
    return this.json(`/schemas${query(params)}`, "GET")
  }

  async get(id: string): Promise<DocumentModel> {
    return this.json(`/schemas/${id}`, "GET").then(r => r.data)
  }

  async create(body: CreateDocumentModelInput): Promise<DocumentModel> {
    return this.json("/schemas", "POST", body).then(r => r.data)
  }

  /** Each update creates a new version. */
  async update(id: string, body: UpdateDocumentModelInput): Promise<DocumentModel> {
    return this.json(`/schemas/${id}`, "PUT", body).then(r => r.data)
  }

  async delete(id: string): Promise<void> {
    await this.json(`/schemas/${id}`, "DELETE")
  }

  /** Returns the updated attribute. */
  async updateAttribute(id: string, attributeId: string, body: Partial<DocumentModelAttribute> & { change_note?: string }): Promise<DocumentModelAttribute> {
    return this.json(`/schemas/${id}/attributes/${attributeId}`, "PUT", body).then(r => r.data)
  }

  async deleteAttribute(id: string, attributeId: string): Promise<void> {
    await this.json(`/schemas/${id}/attributes/${attributeId}`, "DELETE")
  }

  /** Suggest attributes from sample documents. */
  async extractAttributes(body: ExtractAttributesInput): Promise<{ attributes: DocumentModelAttribute[]; similar_schema?: unknown }> {
    return this.json("/schemas/_extract-attributes", "POST", body)
  }

  /** Create a data board for each model (optionally linked to an assistant). */
  async provisionBoards(body: ProvisionBoardsInput): Promise<Array<{ board_id: string; schema_id: string }>> {
    return this.json("/schemas/_provision-board", "POST", body).then(r => r.data)
  }

  // ── Versions ──────────────────────────────────────────────────────────────

  async listVersions(id: string, params?: { limit?: number; skip?: number }): Promise<DocumentModelVersionList> {
    return this.json(`/schemas/${id}/versions${query(params)}`, "GET")
  }

  async getVersion(id: string, version: number): Promise<DocumentModelVersion> {
    return this.json(`/schemas/${id}/versions/${version}`, "GET").then(r => r.data)
  }

  /** Restore an older version; this itself creates a new version. */
  async revert(id: string, version: number, changeNote?: string): Promise<{ schema: DocumentModel; version: DocumentModelVersion }> {
    return this.json(`/schemas/${id}/versions/${version}/_revert`, "POST", { change_note: changeNote }).then(r => r.data)
  }

  // ── Categories ────────────────────────────────────────────────────────────

  /**
   * The category tree; `type` defaults to all. On a `schema` listing, `count`
   * picks what each category's `boards_count` counts: `"models"` or `"boards"`.
   */
  async listCategories(params?: { type?: DocumentCategoryType; count?: "models" | "boards"; search?: string; limit?: number; skip?: number }): Promise<{ data: DocumentCategory[]; count: number }> {
    return this.json(`/categories${query(params)}`, "GET")
  }

  async getCategory(id: string): Promise<DocumentCategory> {
    return this.json(`/categories/${id}`, "GET").then(r => r.data)
  }

  async createCategory(body: { name: string; type: DocumentCategoryType; parentId?: string }): Promise<DocumentCategory> {
    return this.json("/categories", "POST", body).then(r => r.data)
  }

  async updateCategory(id: string, body: { name?: string; parentId?: string | null }): Promise<DocumentCategory> {
    return this.json(`/categories/${id}`, "PUT", body).then(r => r.data)
  }

  /** Child categories move up to the deleted category's parent. */
  async deleteCategory(id: string): Promise<void> {
    await this.json(`/categories/${id}`, "DELETE")
  }

  // ── Settings ──────────────────────────────────────────────────────────────

  /** The org's extraction settings for one product (`"DocumentAI"` or `"Comms"`); `type` defaults to DocIQ. */
  async getSettings(type?: string): Promise<DocumentSettings> {
    return this.json(`/document-settings${query({ type })}`, "GET").then(r => r.data)
  }

  /** Partial update: keys left out keep their value. */
  async updateSettings(body: UpdateDocumentSettingsInput, type?: string): Promise<DocumentSettings> {
    return this.json(`/document-settings${query({ type })}`, "PUT", body).then(r => r.data)
  }
}

function query(params?: Record<string, string | number | undefined>): string {
  const q = new URLSearchParams()
  for (const [k, v] of Object.entries(params ?? {})) if (v !== undefined) q.set(k, String(v))
  const s = q.toString()
  return s ? `?${s}` : ""
}
