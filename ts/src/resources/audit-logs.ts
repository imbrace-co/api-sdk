import { HttpTransport } from "../http.js"

export interface AuditLogEntry {
  id: string
  organizationId: string
  action: string
  resource: string
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

/** Filters for {@link AuditLogsResource.list}. Multi-value filters take comma-separated values. */
export interface AuditLogListParams {
  userId?: string
  resource?: string
  resourceId?: string
  action?: string
  boardId?: string
  /** ISO date */
  from?: string
  /** ISO date */
  to?: string
  /** Text search */
  q?: string
  imports?: "only" | "exclude"
  page?: number
  /** Max 100 (default 25). */
  limit?: number
  cursor?: string
  /** Also read archived months. */
  includeArchive?: boolean
}

export interface AuditLogPage {
  data: AuditLogEntry[]
  pagination: { page: number; limit: number; total: number; totalPages: number; nextCursor?: string | null; hasMore: boolean; [key: string]: unknown }
}

/** The organization's audit trail (platform `/v1/audit-logs`). Needs the `audit_trail` feature. */
export class AuditLogsResource {
  /** @param base - platform base URL (`${gateway}/platform`) */
  constructor(private readonly http: HttpTransport, private readonly base: string) {}

  async list(params?: AuditLogListParams): Promise<AuditLogPage> {
    const url = new URL(`${this.base}/v1/audit-logs`)
    for (const [k, v] of Object.entries(params ?? {})) if (v !== undefined) url.searchParams.set(k, String(v))
    return this.http.getFetch()(url, { method: "GET" }).then(r => r.json())
  }

  /** Counts by action, resource and user over a date range. */
  async summary(params?: { from?: string; to?: string }): Promise<Record<string, unknown>> {
    const url = new URL(`${this.base}/v1/audit-logs/summary`)
    for (const [k, v] of Object.entries(params ?? {})) if (v !== undefined) url.searchParams.set(k, String(v))
    return this.http.getFetch()(url, { method: "GET" }).then(r => r.json()).then(r => r.data)
  }

  async get(id: string): Promise<AuditLogEntry> {
    return this.http.getFetch()(`${this.base}/v1/audit-logs/${id}`, { method: "GET" }).then(r => r.json()).then(r => r.data)
  }

  /** Undo the change an entry records, when `revertable`. */
  async revert(id: string): Promise<{ revertEntry: AuditLogEntry; restoredResourceId?: string }> {
    return this.http.getFetch()(`${this.base}/v1/audit-logs/${id}/revert`, { method: "POST" }).then(r => r.json()).then(r => r.data)
  }
}
