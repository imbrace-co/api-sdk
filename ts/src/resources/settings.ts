import { HttpTransport } from "../http.js"

export interface MessageTemplate {
  _id: string
  name?: string
  body?: string
  category?: string
  language?: string
  status?: string
  [key: string]: unknown
}

export interface MessageTemplateListResponse {
  data: MessageTemplate[]
  total?: number
  [key: string]: unknown
}

export interface CreateMessageTemplateInput {
  name: string
  body?: string
  category?: string
  language?: string
  [key: string]: unknown
}

export interface UpdateMessageTemplateInput {
  name?: string
  body?: string
  category?: string
  [key: string]: unknown
}

export interface DeleteMessageTemplateResponse {
  success: boolean
  [key: string]: unknown
}

export interface SettingsUser {
  _id: string
  name?: string
  email?: string
  role?: string
  status?: string
  [key: string]: unknown
}

export interface UserRolesCountResponse {
  [role: string]: number
}

export interface BulkInviteInput {
  emails: string[]
  role?: string
  [key: string]: unknown
}

export interface BulkInviteResponse {
  invited: number
  errors?: unknown[]
  [key: string]: unknown
}

export class SettingsResource {
  constructor(
    private readonly http: HttpTransport,
    private readonly channelServiceBase: string,
    private readonly platformBase: string,
  ) {}

  private get platformV1() { return `${this.platformBase}/v1` }

  // Message templates
  async listMessageTemplates(params?: { businessUnitId?: string; limit?: number; skip?: number }): Promise<MessageTemplateListResponse> {
    const url = new URL(`${this.channelServiceBase}/v1/message_templates`)
    if (params?.businessUnitId) url.searchParams.set("type", "business_unit_id")
    if (params?.businessUnitId) url.searchParams.set("q", params.businessUnitId)
    if (params?.limit) url.searchParams.set("limit", String(params.limit))
    if (params?.skip !== undefined) url.searchParams.set("skip", String(params.skip))
    return this.http.getFetch()(url, { method: "GET" }).then(r => r.json())
  }

  async createMessageTemplate(body: CreateMessageTemplateInput): Promise<MessageTemplate> {
    return this.http.getFetch()(`${this.channelServiceBase}/v1/message_templates`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }).then(r => r.json())
  }

  async getMessageTemplate(templateId: string): Promise<MessageTemplate> {
    return this.http.getFetch()(`${this.channelServiceBase}/v1/message_templates/${templateId}`, {
      method: "GET",
    }).then(r => r.json())
  }

  async updateMessageTemplate(templateId: string, body: UpdateMessageTemplateInput): Promise<MessageTemplate> {
    return this.http.getFetch()(`${this.channelServiceBase}/v1/message_templates/${templateId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }).then(r => r.json())
  }

  async deleteMessageTemplate(templateId: string): Promise<DeleteMessageTemplateResponse> {
    return this.http.getFetch()(`${this.channelServiceBase}/v1/message_templates/${templateId}`, {
      method: "DELETE",
    }).then(r => r.json())
  }

  async searchMessageTemplates(params?: Record<string, string>): Promise<MessageTemplate[]> {
    const url = new URL(`${this.channelServiceBase}/v1/message_templates/_search`)
    if (params) Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v))
    return this.http.getFetch()(url, { method: "GET" }).then(r => r.json())
  }

  async listMessageTemplatesV2(params?: Record<string, string>): Promise<MessageTemplateListResponse> {
    const url = new URL(`${this.channelServiceBase}/v2/message_templates`)
    if (params) Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v))
    return this.http.getFetch()(url, { method: "GET" }).then(r => r.json())
  }

  // WhatsApp Templates
  async listWhatsAppTemplates(params?: Record<string, string>): Promise<MessageTemplate[]> {
    const url = new URL(`${this.channelServiceBase}/v1/whatsapp_templates`)
    if (params) Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v))
    return this.http.getFetch()(url, { method: "GET" }).then(r => r.json())
  }

  async listWhatsAppTemplatesV2(params?: Record<string, string>): Promise<MessageTemplate[]> {
    const url = new URL(`${this.channelServiceBase}/v2/whatsapp_templates`)
    if (params) Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v))
    return this.http.getFetch()(url, { method: "GET" }).then(r => r.json())
  }

  // Users
  async listUsers(params?: { skip?: number; limit?: number; search?: string; roles?: string; status?: string }): Promise<SettingsUser[]> {
    const url = new URL(`${this.platformV1}/users`)
    if (params?.skip !== undefined) url.searchParams.set("skip", String(params.skip))
    if (params?.limit) url.searchParams.set("limit", String(params.limit))
    if (params?.search) url.searchParams.set("search", params.search)
    if (params?.roles) url.searchParams.set("roles", params.roles)
    if (params?.status) url.searchParams.set("status", params.status)
    const res = await this.http.getFetch()(url, { method: "GET" }).then(r => r.json())
    // Platform-service wraps in {object_name, data}
    if (res && typeof res === "object" && Array.isArray((res as any).data)) {
      return (res as { data: SettingsUser[] }).data
    }
    return res as SettingsUser[]
  }

  async getUserRolesCount(): Promise<UserRolesCountResponse> {
    return this.http.getFetch()(`${this.platformV1}/users/_roles_count`, { method: "GET" }).then(r => r.json())
  }

  async bulkInviteUsers(body: BulkInviteInput): Promise<BulkInviteResponse> {
    return this.http.getFetch()(`${this.platformV1}/users/_bulk_invite`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }).then(r => r.json())
  }
}
