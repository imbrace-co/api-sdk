import { HttpTransport } from "../http.js"

export interface EmailTemplate {
  _id: string
  name?: string
  subject?: string
  body?: string
  [key: string]: unknown
}

export interface CreateEmailTemplateInput {
  name: string
  subject?: string
  body?: string
  [key: string]: unknown
}

export interface ChannelWorkflowInput {
  channel_id?: string
  workflow_id?: string
  [key: string]: unknown
}

export interface ChannelWorkflowResponse {
  success: boolean
  [key: string]: unknown
}

export interface InstallFromJsonInput {
  template?: Record<string, unknown>
  [key: string]: unknown
}

export interface InstallFromJsonResponse {
  success: boolean
  [key: string]: unknown
}

export interface MarketplaceFileDetails {
  _id: string
  name?: string
  url?: string
  [key: string]: unknown
}

export interface MarketplaceFileUploadResponse {
  url: string
  file_id?: string
  [key: string]: unknown
}

export interface MarketplaceApp {
  app_key: string
  name?: string
  version?: string
  package_id?: string
  [key: string]: unknown
}

export interface AppInstall {
  id: string
  app_key: string
  version?: string
  [key: string]: unknown
}

export interface InstallTeamDefaultsInput {
  /** Teams to install agents for; `[]` installs only the org-wide ones. */
  teams: Array<{ id: string; name: string }>
  reset?: boolean
  source?: "package" | "builtin"
  kind?: "sync" | "create"
}

export interface InstallTeamDefaultsResult {
  installed: Array<{ template_id: string; team_id?: string; use_case_id: string }>
  skipped: unknown[]
  failed: unknown[]
  [key: string]: unknown
}

export class MarketplaceResource {
  /**
   * @param base    - Marketplace service base URL (gateway/marketplaces/v2)
   * @param gateway - Gateway root URL (kept for legacy download fallback)
   */
  constructor(
    private readonly http: HttpTransport,
    private readonly base: string,
    private readonly gateway: string,
  ) {}

  private get root() { return this.base.replace(/\/$/, "") }

  // ── Templates (marketplace use-case templates) ─────────────────────────

  async listUseCaseTemplates(): Promise<{ _id: string; name?: string; [key: string]: unknown }[]> {
    return this.http.getFetch()(`${this.root}/market-places/v2/templates`, { method: "GET" }).then(r => r.json())
  }

  async installFromJson(body: InstallFromJsonInput): Promise<InstallFromJsonResponse> {
    return this.http.getFetch()(`${this.root}/market-places/templates/install-from-json`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }).then(r => r.json())
  }

  // ── Files (marketplace-scoped file uploads / downloads) ────────────────

  async uploadFile(body: FormData): Promise<MarketplaceFileUploadResponse> {
    return this.http.getFetch()(`${this.root}/files`, {
      method: "POST",
      body,
    }).then(r => r.json())
  }

  async deleteFile(fileId: string): Promise<void> {
    await this.http.getFetch()(`${this.root}/files/${fileId}`, { method: "DELETE" })
  }

  async getFileDetails(fileId: string): Promise<MarketplaceFileDetails> {
    return this.http.getFetch()(`${this.root}/file-details/${fileId}`, { method: "GET" }).then(r => r.json())
  }

  async downloadMarketPlaceFile(shortPath: string): Promise<Response> {
    return this.http.getFetch()(`${this.root}/files/${shortPath}`, { method: "GET" })
  }

  // ── Email templates ────────────────────────────────────────────────────

  async listEmailTemplates(params?: Record<string, string>): Promise<EmailTemplate[]> {
    const url = new URL(`${this.root}/email-templates/search`)
    if (params) Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v))
    return this.http.getFetch()(url, { method: "GET" }).then(r => r.json())
  }

  async createEmailTemplate(body: CreateEmailTemplateInput): Promise<EmailTemplate> {
    return this.http.getFetch()(`${this.root}/email-templates`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }).then(r => r.json())
  }

  // ── Channel workflows ──────────────────────────────────────────────────

  async postChannelWorkflows(body: ChannelWorkflowInput): Promise<ChannelWorkflowResponse> {
    return this.http.getFetch()(`${this.root}/market-places/channel-workflows`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }).then(r => r.json())
  }

  // ── Apps (marketplace v3) ──────────────────────────────────────────────

  private get v3() { return `${this.gateway.replace(/\/$/, "")}/v3/marketplaces` }

  private v3json(path: string, method: string, body?: unknown): Promise<any> {
    return this.http.getFetch()(`${this.v3}${path}`, {
      method,
      ...(body !== undefined ? { headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) } : {}),
    }).then(r => r.json())
  }

  /** Apps that can be installed. */
  async listAppCatalog(): Promise<MarketplaceApp[]> {
    return this.v3json("/apps/catalog", "GET").then(r => r.data)
  }

  /** Apps installed in the org. */
  async listInstalledApps(): Promise<AppInstall[]> {
    return this.v3json("/apps/installed", "GET").then(r => r.data)
  }

  async getAppInstall(installId: string): Promise<AppInstall> {
    return this.v3json(`/apps/installs/${installId}`, "GET").then(r => r.data)
  }

  /** Install by `package_id`, or by `app_key` (+ optional `version`). */
  async installApp(body: { package_id: string } | { app_key: string; version?: string }): Promise<{ install: AppInstall; setup?: unknown }> {
    return this.v3json("/apps/install", "POST", body).then(r => r.data)
  }

  async uninstallApp(installId: string): Promise<{ id: string; app_key?: string }> {
    return this.v3json(`/apps/installs/${installId}`, "DELETE").then(r => r.data)
  }

  /**
   * Install the default team agents for the given teams (matched by team name).
   * Runs synchronously and can take minutes. `reset: true` removes them first.
   */
  async installTeamDefaults(body: InstallTeamDefaultsInput): Promise<InstallTeamDefaultsResult> {
    return this.v3json("/market-places/v2/templates/_install_team_defaults", "POST", body).then(r => r.data)
  }
}
