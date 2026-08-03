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
}
