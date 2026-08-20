import { HttpTransport } from "../http.js"

export interface FileUploadResponse {
  url: string
  [key: string]: unknown
}

export interface FinancialFile {
  id: string
  filename?: string
  url?: string
  meta?: Record<string, unknown>
  created_at?: number
  updated_at?: number
  [key: string]: unknown
}

export interface FloorPlanPresignInput {
  filename: string
  content_type?: string
  [key: string]: unknown
}

export interface FloorPlanPresignResponse {
  url: string
  fields?: Record<string, string>
  [key: string]: unknown
}

export interface ContactFile {
  _id: string
  contact_id: string
  filename?: string
  url?: string
  [key: string]: unknown
}

/**
 * File-service microservice client.
 *
 * The file-service is context-aware: every upload targets a specific context
 * (boards, teams, users, contacts, conversation_messages, floor_plans,
 * account). There is no flat "upload a file" endpoint — pick the context
 * matching what the file is being attached to.
 *
 * Gateway path: `${gw}/files/v1` → service `/v1/...`.
 */
export class FileServiceResource {
  constructor(private readonly http: HttpTransport, private readonly base: string) {}

  /** Upload a file scoped to a single context (boards, teams, users, contacts, …). */
  async uploadForContext(
    context:
      | "boards"
      | "board"
      | "teams"
      | "users"
      | "contacts"
      | "conversation_messages"
      | "messages"
      | "floor_plans"
      | "account",
    body: FormData,
  ): Promise<FileUploadResponse> {
    return this.http.getFetch()(`${this.base}/${context}/_fileupload`, {
      method: "POST",
      body,
    }).then(r => r.json())
  }

  /** Upload multiple files as a board attachment (up to 10). */
  async uploadBoardAttachments(body: FormData): Promise<FileUploadResponse[]> {
    return this.http.getFetch()(`${this.base}/boards/upload`, {
      method: "POST",
      body,
    }).then(r => r.json())
  }

  /** Public form-file upload (no auth required). */
  async uploadFormFile(body: FormData): Promise<FileUploadResponse> {
    return this.http.getFetch()(`${this.base}/form-files`, {
      method: "POST",
      body,
    }).then(r => r.json())
  }

  /** Get a static file by sub-path. Returns the raw Response so callers can stream / read as needed. */
  async getStaticFile(subPath: string): Promise<Response> {
    return this.http.getFetch()(`${this.base}/files/${subPath}`, { method: "GET" })
  }

  // ── Financial files ────────────────────────────────────────────────────

  async uploadFinancialFile(body: FormData): Promise<FinancialFile> {
    return this.http.getFetch()(`${this.base}/financial/upload`, {
      method: "POST",
      body,
    }).then(r => r.json())
  }

  async getFinancialFile(id: string): Promise<FinancialFile> {
    return this.http.getFetch()(`${this.base}/financial/${id}`, { method: "GET" }).then(r => r.json())
  }

  async deleteFinancialFile(id: string): Promise<void> {
    await this.http.getFetch()(`${this.base}/financial/${id}`, { method: "DELETE" })
  }

  // ── Floor-plan presigned S3 upload URL ─────────────────────────────────

  async getFloorPlanPresignUrl(body: FloorPlanPresignInput): Promise<FloorPlanPresignResponse> {
    return this.http.getFetch()(`${this.base}/floor_plans/_presign_url`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }).then(r => r.json())
  }

  // ── Contact files ──────────────────────────────────────────────────────

  async listContactFiles(contactId: string): Promise<ContactFile[]> {
    return this.http.getFetch()(`${this.base}/contact/${contactId}/files`, { method: "GET" }).then(r => r.json())
  }
}
