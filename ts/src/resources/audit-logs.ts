import { HttpTransport } from "../http.js"

/** What happened. `login_failed` is a refused sign-in; `metadata.reason` says which check failed. */
export type AuditAction =
  | "create" | "update" | "delete" | "upload" | "login" | "login_failed"
  | "revert" | "export" | "download" | "connect"

/** What it happened to. Other values may appear as the platform grows. */
export type AuditResource =
  // Data boards and Knowledge Hub
  | "board_item" | "file" | "board" | "folder" | "session" | "integration"
  // Board configuration and DocIQ
  | "segmentation" | "doc_schema" | "doc_category" | "doc_settings" | "dociq_extraction" | "scheduler" | "automation"
  // Channels
  | "channel" | "contact" | "campaign" | "message_template"
  // People, access and the organization
  | "team" | "team_user" | "user" | "role" | "api_key" | "sso_config" | "oidc_role_mapping" | "business_unit" | "organization"
  // AI, apps and workflows
  | "assistant" | "llm_provider" | "file_object" | "financial_file" | "app_install" | "app_package"
  | "marketplace_template" | "use_case" | "email_template" | "form" | "marketplace_file" | "flow" | "tool_server"
  // The audit log's own retention
  | "audit_retention" | "audit_retention_purge"

/** One value, several values (sent comma-separated), or any value the union does not list yet. */
type OneOrMany<T extends string> = T | (string & {}) | Array<T | (string & {})>

export interface AuditLogEntry {
  id: string
  organizationId: string
  action: AuditAction | (string & {})
  resource: AuditResource | (string & {})
  resourceId?: string
  resourceName?: string
  actor: { userId: string; name?: string; email?: string }
  summary?: string
  changes?: unknown
  metadata?: Record<string, unknown>
  revertable?: boolean
  createdAt: string
  [key: string]: unknown
}

/** Filters shared by {@link AuditLogsResource.list} and {@link AuditLogsResource.summary}. */
export interface AuditLogFilters {
  userId?: OneOrMany<string>
  resource?: OneOrMany<AuditResource>
  resourceId?: OneOrMany<string>
  action?: OneOrMany<AuditAction>
  boardId?: OneOrMany<string>
  /** Every board in this category (ignored when `boardId` is given). */
  categoryId?: string
  /** What one workflow or agent run did. */
  runId?: OneOrMany<string>
  /** What one AI case did. */
  caseId?: OneOrMany<string>
  /** ISO date */
  from?: string
  /** ISO date */
  to?: string
  /** Text search */
  q?: string
  imports?: "only" | "exclude"
  /** Also read archived months (slower; archived rows cannot be reverted). */
  includeArchive?: boolean
}

/** Filters and paging for {@link AuditLogsResource.list}. */
export interface AuditLogListParams extends AuditLogFilters {
  page?: number
  /** Max 100 (default 25). */
  limit?: number
  /** `pagination.nextCursor` of the previous page. */
  cursor?: string
}

export interface AuditLogPage {
  data: AuditLogEntry[]
  pagination: { page: number; limit: number; total: number; totalPages: number; nextCursor?: string | null; hasMore: boolean; [key: string]: unknown }
}

function setParams(url: URL, params: object | undefined): URL {
  for (const [k, v] of Object.entries(params ?? {})) {
    if (v === undefined || v === null) continue
    url.searchParams.set(k, Array.isArray(v) ? v.join(",") : String(v))
  }
  return url
}

/** The organization's audit trail (platform `/v1/audit-logs`). Needs the `audit_trail` feature. */
export class AuditLogsResource {
  /** @param base - platform base URL (`${gateway}/platform`) */
  constructor(private readonly http: HttpTransport, private readonly base: string) {}

  /** One page of entries, newest first. */
  async list(params?: AuditLogListParams): Promise<AuditLogPage> {
    const url = setParams(new URL(`${this.base}/v1/audit-logs`), params)
    return this.http.getFetch()(url, { method: "GET" }).then(r => r.json())
  }

  /**
   * Every entry that matches, newest first, page by page.
   *
   * @example
   * ```ts
   * for await (const entry of client.auditLogs.iterate({ from: "2026-10-01", resource: ["user", "role"] })) {
   *   console.log(entry.createdAt, entry.actor.email, entry.action, entry.resource)
   * }
   * ```
   */
  async *iterate(params?: Omit<AuditLogListParams, "page" | "cursor">): AsyncGenerator<AuditLogEntry> {
    let cursor: string | undefined
    for (;;) {
      const page = await this.list({ ...params, limit: params?.limit ?? 100, ...(cursor ? { cursor } : {}) })
      for (const entry of page.data ?? []) yield entry
      const next = page.pagination?.nextCursor
      if (!page.pagination?.hasMore || !next) return
      cursor = next
    }
  }

  /** Counts by action, resource and user for the entries that match. */
  async summary(params?: AuditLogFilters): Promise<Record<string, unknown>> {
    const url = setParams(new URL(`${this.base}/v1/audit-logs/summary`), params)
    return this.http.getFetch()(url, { method: "GET" }).then(r => r.json()).then(r => r.data)
  }

  async get(id: string): Promise<AuditLogEntry> {
    return this.http.getFetch()(`${this.base}/v1/audit-logs/${encodeURIComponent(id)}`, { method: "GET" }).then(r => r.json()).then(r => r.data)
  }

  /** Undo the change an entry records, when `revertable`. Needs the `audit_trail:write` permission. */
  async revert(id: string): Promise<{ revertEntry: AuditLogEntry; restoredResourceId?: string }> {
    return this.http.getFetch()(`${this.base}/v1/audit-logs/${encodeURIComponent(id)}/revert`, { method: "POST" }).then(r => r.json()).then(r => r.data)
  }
}
