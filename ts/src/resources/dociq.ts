import { HttpTransport } from "../http.js"

/** A file to read: what `client.boards.uploadBoardFile()` returns as `url`, or any absolute URL. */
export interface DociqFile {
  /** `files/download/<key>` from an upload, or an absolute URL the platform can fetch. */
  url: string
  /** e.g. `application/pdf`, `image/png`. */
  mime_type: string
  name?: string
}

export interface DociqIngestInput {
  /** 1 to 5 files. Each becomes one submission. */
  files: DociqFile[]
  /** Use this DocIQ assistant's models for the extraction instead of the defaults. */
  assistant_id?: string
  /**
   * Where the file came from, when it is not an upload on the DocIQ page (e.g. a
   * messaging channel). Stored as given, so you can match a finished submission
   * back to the conversation it belongs to.
   */
  source?: { channel?: string; conversation_id?: string }
}

/** Ingest lifecycle. `succeeded`, `failed` and `canceled` are final. */
export type DociqSubmissionStatus = "pending" | "running" | "succeeded" | "failed" | "canceled"

/**
 * What the board write did: `saved` (a record on the matching model's board),
 * `no_schema` (no Document Model matched; see `proposedModel` on the detail),
 * `model_created`, `failed`, or `pending` while it has not run yet.
 */
export type DociqSubmissionOutcome = "pending" | "saved" | "no_schema" | "model_created" | "failed"

export interface DociqIngestResult {
  submissions: Array<{ id: string; correlationId: string; status: DociqSubmissionStatus | string }>
}

/** One uploaded file and what DocIQ did with it. */
export interface DociqSubmission {
  id: string
  /** The id the results table shows (e.g. `INV-2026-001`), or the file handle before it is final. */
  fileId: string | null
  fileName: string | null
  fileUrl: string | null
  boardId: string | null
  boardName: string | null
  /** The record written (the first one, when the file held several documents). */
  boardItemId: string | null
  conversationId: string | null
  documentModelId: string | null
  documentModelName: string | null
  status: DociqSubmissionStatus
  outcome: DociqSubmissionOutcome | null
  submittedAt: string
  finalizedAt: string | null
  hasRawResult: boolean
  /** One entry per document when a file held several, each with its own model and board. */
  documents: Array<Record<string, unknown>> | null
  documentCount: number | null
  [key: string]: unknown
}

/** A submission with the extraction itself. */
export interface DociqSubmissionDetail extends DociqSubmission {
  /** The extracted record. */
  extractedData: Record<string, unknown> | null
  /** Per field: confidence, state and where in the document it was read. */
  extractedMeta: Record<string, unknown> | null
  /** The engine's whole response. */
  rawResult: unknown
  /** When no Document Model matched (`outcome: "no_schema"`): the model DocIQ suggests. */
  proposedModel: { attributes?: unknown[]; [key: string]: unknown } | null
  error: unknown
  /** The board write step by step, for a failed submission. */
  processLog: unknown
}

export interface ListDociqSubmissionsParams {
  /** 1–100, default 10. */
  limit?: number
  skip?: number
  status?: DociqSubmissionStatus
  /** `page` = uploads, `chat` = files handed over in an agent chat. */
  flow?: "page" | "chat"
  search?: string
  documentModelIds?: string[]
  conversationId?: string
  emailId?: string
  sourceItemId?: string
  /** Submitted within this window. */
  from?: string | Date
  to?: string | Date
  runId?: string
}

export interface DociqSubmissionList {
  submissions: DociqSubmission[]
  total: number
  limit: number
  skip: number
}

/**
 * DocIQ: upload documents and let the platform read them. Each file is matched
 * to a Document Model (`client.documentModels`), extracted, and written as a
 * record on that model's board.
 *
 * Routes to `/ai-agent/dociq/*`. The organization needs the Document Model feature.
 *
 * @example
 * ```ts
 * const form = new FormData()
 * form.append("file", new Blob([pdfBytes], { type: "application/pdf" }), "invoice.pdf")
 * const { url } = await client.boards.uploadBoardFile(form)
 *
 * const { submissions } = await client.dociq.ingest({
 *   files: [{ url, mime_type: "application/pdf", name: "invoice.pdf" }],
 * })
 * const detail = await client.dociq.getSubmission(submissions[0].id)
 * ```
 */
export class DociqResource {
  /** @param base - ai-agent base URL (`${gateway}/ai-agent`) */
  constructor(private readonly http: HttpTransport, private readonly base: string) {}

  private req<T>(method: string, path: string, body?: unknown): Promise<T> {
    return this.http.getFetch()(`${this.base}/dociq${path}`, {
      method,
      ...(body !== undefined ? { headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) } : {}),
    })
      .then(r => r.json())
      .then((r: any) => (r && typeof r === "object" && "data" in r ? r.data : r) as T)
  }

  /**
   * Submit 1–5 uploaded files. Returns at once (HTTP 202) with one submission per
   * file; the extraction and the board write run in the background. Follow each
   * with {@link DociqResource.getSubmission}.
   */
  async ingest(input: DociqIngestInput): Promise<DociqIngestResult> {
    return this.req("POST", "/ingest", input)
  }

  /** Submissions, newest first. */
  async listSubmissions(params: ListDociqSubmissionsParams = {}): Promise<DociqSubmissionList> {
    const q = new URLSearchParams()
    for (const [k, v] of Object.entries(params)) {
      if (v === undefined || v === null) continue
      if (Array.isArray(v)) { if (v.length) q.set(k, v.join(",")) }
      else q.set(k, v instanceof Date ? v.toISOString() : String(v))
    }
    const qs = q.toString()
    return this.req("GET", `/submissions${qs ? `?${qs}` : ""}`)
  }

  /** One submission with the extracted record, per-field confidence and, on no match, the proposed model. */
  async getSubmission(id: string): Promise<DociqSubmissionDetail> {
    return this.req("GET", `/submissions/${encodeURIComponent(id)}`)
  }

  /** The newest submission for a File ID (the id the results table shows, e.g. `INV-2026-001`). */
  async getSubmissionByFile(fileId: string): Promise<DociqSubmissionDetail> {
    return this.req("GET", `/submissions/by-file/${encodeURIComponent(fileId)}`)
  }

  /** Remove a submission from the results list. */
  async deleteSubmission(id: string): Promise<{ id: string; deleted: boolean }> {
    return this.req("DELETE", `/submissions/${encodeURIComponent(id)}`)
  }

  /**
   * For a submission that matched no Document Model (`outcome: "no_schema"`):
   * create a model from the fields DocIQ proposed. `category` is a category id.
   */
  async createModelFromSubmission(id: string, body: { name: string; category?: string }): Promise<{ schema: Record<string, unknown> }> {
    return this.req("POST", `/submissions/${encodeURIComponent(id)}/create-model`, body)
  }
}
