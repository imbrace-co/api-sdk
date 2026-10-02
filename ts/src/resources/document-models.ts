import { HttpTransport } from "../http.js"

/** One field a Document Model extracts. `type` is a board field type (e.g. `ShortText`, `Number`, `Date`) or `RichText`. */
export interface DocumentModelAttribute {
  id?: string
  name: string
  type: string
  description?: string
  [key: string]: unknown
}

export interface DocumentModel {
  id: string
  name: string
  description?: string
  category?: string
  attributes: DocumentModelAttribute[]
  current_version?: number
  [key: string]: unknown
}

export interface CreateDocumentModelInput {
  name: string
  description?: string
  /** Category id (see {@link DocumentModelsResource.listCategories}). */
  category?: string
  attributes?: DocumentModelAttribute[]
  accessTeams?: string[]
  /** Assistant ids that use this model. */
  agents?: string[]
  /** Board ids the model writes to. */
  databoards?: string[]
  /** Stored on the version this change creates. */
  change_note?: string
  [key: string]: unknown
}

export type UpdateDocumentModelInput = Partial<CreateDocumentModelInput>

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

export interface DocumentCategory {
  id: string
  name: string
  type: "schema" | "databoard"
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

  async list(params?: { search?: string; categoryId?: string; limit?: number; skip?: number }): Promise<DocumentModelList> {
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

  /** The category tree; `type` defaults to all. */
  async listCategories(params?: { type?: "schema" | "databoard"; search?: string; limit?: number; skip?: number }): Promise<{ data: DocumentCategory[]; count: number }> {
    return this.json(`/categories${query(params)}`, "GET")
  }

  async getCategory(id: string): Promise<DocumentCategory> {
    return this.json(`/categories/${id}`, "GET").then(r => r.data)
  }

  async createCategory(body: { name: string; type: "schema" | "databoard"; parentId?: string }): Promise<DocumentCategory> {
    return this.json("/categories", "POST", body).then(r => r.data)
  }

  async updateCategory(id: string, body: { name?: string; parentId?: string | null }): Promise<DocumentCategory> {
    return this.json(`/categories/${id}`, "PUT", body).then(r => r.data)
  }

  /** Child categories move up to the deleted category's parent. */
  async deleteCategory(id: string): Promise<void> {
    await this.json(`/categories/${id}`, "DELETE")
  }
}

function query(params?: Record<string, string | number | undefined>): string {
  const q = new URLSearchParams()
  for (const [k, v] of Object.entries(params ?? {})) if (v !== undefined) q.set(k, String(v))
  const s = q.toString()
  return s ? `?${s}` : ""
}
