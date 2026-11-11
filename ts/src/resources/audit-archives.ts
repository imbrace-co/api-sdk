import { HttpTransport } from "../http.js"
import type { AuditResource } from "./audit-logs.js"

/**
 * - `archived`: in the archive store, out of the live feed
 * - `restoring`: being copied back; do not read yet
 * - `restored`: back in the live feed until `restoreExpiresAt`
 * - `failed`: an export or restore did not verify (`error` says why)
 * - `purged`: deleted at the end of the retention period
 */
export type AuditArchiveStatus = "archived" | "restoring" | "restored" | "failed" | "purged"

/** One organization's audit log for one month. */
export interface AuditArchive {
  id: string
  /** `YYYY-MM` */
  month: string
  status: AuditArchiveStatus
  rows: number
  /** Compressed size. */
  bytes: number | null
  /** SHA-256 of the stored file. */
  sha256: string
  /** The previous month's `sha256`: the months form a chain. */
  prevSha256: string | null
  archivedAt: string | null
  restoredAt: string | null
  restoreExpiresAt: string | null
  restoredBy: string | null
  error: string | null
  /** Counts taken at export (total, byAction, byResource, byUser, …). */
  stats: Record<string, unknown> | null
  [key: string]: unknown
}

export interface AuditRetentionPolicy {
  /** Months a file is kept after its month leaves the live feed; null = the deployment default. */
  archiveMonths: number | null
  legalHold: boolean
  legalHoldReason: string | null
  /** A shorter retention waiting out its grace period, when one is pending. */
  pendingArchiveMonths?: number | null
  pendingEffectiveAt?: string | null
  [key: string]: unknown
}

/** How long the organization keeps its audit log, in total months (live + archived). */
export interface AuditRetention {
  /** Months kept in the live feed. */
  hotMonths: number
  /** Total retention in months; null = kept for ever. */
  totalMonths: number | null
  isDefault: boolean
  defaultTotalMonths: number | null
  minTotalMonths: number
  maxTotalMonths: number
  policy: AuditRetentionPolicy | null
  /** A decrease waiting for its effective date; cancel it with {@link AuditArchivesResource.cancelPendingPolicy}. */
  pending: { totalMonths: number; requestedBy: string | null; requestedAt: string | null; effectiveAt: string | null } | null
  /** Whether the caller may change it (organization owner or admin). */
  canEdit: boolean
  [key: string]: unknown
}

export interface AuditArchiveListing {
  /** First month still in the live feed (`YYYY-MM`). */
  hotFrom: string
  /** Where archives are stored; null when the deployment has no archive store. */
  store: { kind: "s3" | "fs" } | null
  /** Restore limits: default and maximum days a restored month stays, maximum months per restore. */
  restore: { defaultDays: number; maxDays: number; maxMonths: number }
  retention: AuditRetention
  archives: AuditArchive[]
}

/**
 * - `unchanged`: nothing to do
 * - `increased`: a longer retention, applied at once
 * - `scheduled`: a shorter retention, applied after a grace period (see `retention.pending`)
 * - `cancelled`: a pending decrease was called off
 */
export type AuditRetentionOutcome = "unchanged" | "increased" | "scheduled" | "cancelled"

export interface AuditRetentionChange {
  policy: AuditRetentionPolicy
  outcome: AuditRetentionOutcome
  retention: AuditRetention
}

export interface AuditArchiveDownload {
  /** The file: gzip-compressed JSON Lines, one audit entry per line. */
  data: ArrayBuffer
  filename: string
  /** SHA-256 of `data` (of the stored file, or of what was sent when filtered by resource). */
  sha256: string | null
  /** True when `resource` narrowed the file to some entry types. */
  filtered: boolean
}

/**
 * Audit log months past the live window, kept as files (platform `/v1/audit-archives`).
 *
 * Reading the list and the retention is open to members. Downloading, restoring,
 * extending and releasing need an admin; changing the retention needs the
 * organization's owner or an admin. A legal hold is placed or lifted by iMBrace only.
 */
export class AuditArchivesResource {
  /** @param base - platform base URL (`${gateway}/platform`) */
  constructor(private readonly http: HttpTransport, private readonly base: string) {}

  private json<T>(method: string, path: string, body?: unknown): Promise<T> {
    return this.http.getFetch()(`${this.base}/v1/audit-archives${path}`, {
      method,
      ...(body !== undefined ? { headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) } : {}),
    }).then(r => r.json())
  }

  /** The archived months, the retention and the restore limits. */
  async list(): Promise<AuditArchiveListing> {
    return this.json<{ data: AuditArchiveListing }>("GET", "").then(r => r.data)
  }

  /** How long the audit log is kept. */
  async getPolicy(): Promise<AuditRetention> {
    return this.json<{ data: AuditRetention }>("GET", "/policy").then(r => r.data)
  }

  /**
   * Keep the audit log for `totalMonths` in all (live + archived), e.g. 12 for a year.
   * A longer retention applies at once; a shorter one is scheduled after a grace
   * period and can be called off with {@link AuditArchivesResource.cancelPendingPolicy}.
   */
  async setPolicy(body: { totalMonths: number }): Promise<AuditRetentionChange> {
    return this.json<{ data: AuditRetentionPolicy; outcome: AuditRetentionOutcome; retention: AuditRetention }>("PUT", "/policy", body)
      .then(r => ({ policy: r.data, outcome: r.outcome, retention: r.retention }))
  }

  /** Call off a scheduled decrease. */
  async cancelPendingPolicy(): Promise<AuditRetentionChange> {
    return this.json<{ data: AuditRetentionPolicy; outcome: AuditRetentionOutcome; retention: AuditRetention }>("DELETE", "/policy/pending")
      .then(r => ({ policy: r.data, outcome: r.outcome, retention: r.retention }))
  }

  /**
   * Download one archived month (`YYYY-MM`) as gzip-compressed JSON Lines.
   * `resource` keeps only those entry types, e.g. `["user", "role"]`.
   */
  async download(month: string, opts?: { resource?: Array<AuditResource | (string & {})> }): Promise<AuditArchiveDownload> {
    const url = new URL(`${this.base}/v1/audit-archives/${encodeURIComponent(month)}/download`)
    if (opts?.resource?.length) url.searchParams.set("resource", opts.resource.join(","))
    const res = await this.http.getFetch()(url, { method: "GET" })
    const disposition = res.headers.get("content-disposition") ?? ""
    const filename = /filename="?([^";]+)"?/.exec(disposition)?.[1] ?? `audit-${month}.jsonl.gz`
    return {
      data: await res.arrayBuffer(),
      filename,
      sha256: res.headers.get("x-archive-sha256"),
      filtered: res.headers.get("x-archive-filtered") === "resource",
    }
  }

  /**
   * Bring archived months back into the live feed (`from` to `to`, `YYYY-MM`), so
   * `auditLogs.list()` reads them again. Runs in the background: the months show
   * `restoring`, then `restored` until `expiresAt`.
   */
  async restore(body: { from: string; to?: string }): Promise<{ status: "accepted"; months: string[]; alreadyRestored: string[]; expiresAt: string }> {
    return this.json<{ data: { status: "accepted"; months: string[]; alreadyRestored: string[]; expiresAt: string } }>("POST", "/restore", body).then(r => r.data)
  }

  /** Keep a restored month in the live feed `days` longer (capped by the deployment's maximum). */
  async extend(month: string, days: number): Promise<{ status: "ok"; month: string; expiresAt: string; capped: boolean }> {
    return this.json<{ data: { status: "ok"; month: string; expiresAt: string; capped: boolean } }>("POST", `/${encodeURIComponent(month)}/extend`, { days }).then(r => r.data)
  }

  /** Send a restored month back to the archive before it expires. */
  async release(month: string): Promise<{ status: "ok"; month: string }> {
    return this.json<{ data: { status: "ok"; month: string } }>("POST", `/${encodeURIComponent(month)}/release`).then(r => r.data)
  }
}
