import { HttpTransport } from "../http.js"
import type { Channel, Team } from "../types/index.js"

export interface CreateChannelInput {
  name: string
  type?: string
  config?: Record<string, unknown>
  [key: string]: unknown
}

export interface UpdateChannelInput {
  active?: boolean
  config?: Record<string, unknown>
  [key: string]: unknown
}

export interface ReplaceChannelInput {
  channel_id: string
  [key: string]: unknown
}

export interface ConvCountResponse {
  count: number
  [key: string]: unknown
}

export interface CreateFacebookInput {
  page_id: string
  access_token?: string
  credential_id?: string
  [key: string]: unknown
}

export interface CreateInstagramInput {
  page_id?: string
  access_token?: string
  credential_id?: string
  [key: string]: unknown
}

export interface CreateEmailInput {
  name: string
  email?: string
  [key: string]: unknown
}

export interface CreateWechatInput {
  app_id?: string
  app_secret?: string
  [key: string]: unknown
}

export interface CreateLineInput {
  channel_access_token?: string
  channel_secret?: string
  [key: string]: unknown
}

export interface CreateWhatsAppInput {
  phone_number_id?: string
  access_token?: string
  [key: string]: unknown
}

export interface ChannelCredential {
  _id: string
  type?: string
  name?: string
  [key: string]: unknown
}

export interface UpdateCredentialInput {
  [key: string]: unknown
}

export interface UpdateChannelWorkflowInput {
  [key: string]: unknown
}

export interface ChannelWorkflowResponse {
  success: boolean
  [key: string]: unknown
}

export interface TeamObserver {
  _id: string
  user_id?: string
  team_id?: string
  [key: string]: unknown
}

export class ChannelResource {
  /**
   * @param base - channel-service base URL (gateway/channel-service).
   *   Version (v1/v2/v3) is appended per method.
   */
  constructor(private readonly http: HttpTransport, private readonly base: string) {}

  private get v1() { return `${this.base}/v1` }
  private get v2() { return `${this.base}/v2` }
  private get v3() { return `${this.base}/v3` }

  async list(params?: { type?: string }): Promise<Channel[]> {
    const url = new URL(`${this.v1}/channels`)
    if (params?.type) url.searchParams.set("type", params.type)
    return this.http.getFetch()(url, { method: "GET" }).then(r => r.json())
  }

  async get(channelId: string): Promise<Channel> {
    return this.http.getFetch()(`${this.v1}/channels/${channelId}`, { method: "GET" }).then(r => r.json())
  }

  async create(body: CreateChannelInput): Promise<Channel> {
    return this.http.getFetch()(`${this.v1}/channels`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }).then(r => r.json())
  }

  async update(channelId: string, body: UpdateChannelInput): Promise<Channel> {
    return this.http.getFetch()(`${this.v1}/channels/${channelId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }).then(r => r.json())
  }

  async delete(channelId: string): Promise<{ success: boolean }> {
    return this.http.getFetch()(`${this.v1}/channels/${channelId}`, { method: "DELETE" }).then(r => r.json())
  }

  async deleteV3(channelId: string): Promise<{ success: boolean }> {
    return this.http.getFetch()(`${this.v3}/channels/${channelId}`, { method: "DELETE" }).then(r => r.json())
  }

  async getCount(): Promise<{ count: number }> {
    return this.http.getFetch()(`${this.v1}/channels/_count`, { method: "GET" }).then(r => r.json())
  }

  async getConvCount(params?: { view?: string; teamId?: string }): Promise<ConvCountResponse> {
    const url = new URL(`${this.v1}/channels/_conv_count`)
    if (params?.view)   url.searchParams.set("view",    params.view)
    if (params?.teamId) url.searchParams.set("team_id", params.teamId)
    return this.http.getFetch()(url, { method: "GET" }).then(r => r.json())
  }

  async replace(body: ReplaceChannelInput): Promise<Channel> {
    return this.http.getFetch()(`${this.v1}/channels/_replace`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }).then(r => r.json())
  }

  async createWeb(body: { name: string }): Promise<Channel> {
    return this.http.getFetch()(`${this.v1}/channels/_web`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }).then(r => r.json())
  }

  async createWebV3(body: { name: string }): Promise<Channel> {
    return this.http.getFetch()(`${this.v3}/channels/_web`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }).then(r => r.json())
  }

  async getFacebookPages(credentialId: string): Promise<ChannelCredential[]> {
    return this.http.getFetch()(`${this.v1}/channels/_facebook/credential/${credentialId}`, { method: "GET" }).then(r => r.json())
  }

  async createFacebook(body: CreateFacebookInput): Promise<Channel> {
    return this.http.getFetch()(`${this.v3}/channels/_facebook`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }).then(r => r.json())
  }

  async updateFacebook(body: CreateFacebookInput): Promise<Channel> {
    return this.http.getFetch()(`${this.v2}/channels/_facebook`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }).then(r => r.json())
  }

  async createInstagram(body: CreateInstagramInput): Promise<Channel> {
    return this.http.getFetch()(`${this.v1}/channels/_instagram`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }).then(r => r.json())
  }

  async createInstagramV2(body: CreateInstagramInput): Promise<Channel> {
    return this.http.getFetch()(`${this.v1}/channels/_instagramV2`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }).then(r => r.json())
  }

  async createEmail(body: CreateEmailInput): Promise<Channel> {
    return this.http.getFetch()(`${this.v1}/channels/_email`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }).then(r => r.json())
  }

  async createWechat(body: CreateWechatInput): Promise<Channel> {
    return this.http.getFetch()(`${this.v1}/channels/_wechat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }).then(r => r.json())
  }

  async createLine(body: CreateLineInput): Promise<Channel> {
    return this.http.getFetch()(`${this.v1}/channels/_line`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }).then(r => r.json())
  }

  async createWhatsApp(body: CreateWhatsAppInput): Promise<Channel> {
    return this.http.getFetch()(`${this.v1}/channels/_whatsapp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }).then(r => r.json())
  }

  async createWhatsAppV2(body: CreateWhatsAppInput): Promise<Channel> {
    return this.http.getFetch()(`${this.v2}/channels/_whatsapp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }).then(r => r.json())
  }

  async createWhatsAppV3(body: CreateWhatsAppInput): Promise<Channel> {
    return this.http.getFetch()(`${this.v3}/channels/_whatsapp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }).then(r => r.json())
  }

  async updateWhatsApp(body: CreateWhatsAppInput): Promise<Channel> {
    return this.http.getFetch()(`${this.v2}/channels/_whatsapp`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }).then(r => r.json())
  }

  async getCredential(credentialId: string): Promise<ChannelCredential> {
    return this.http.getFetch()(`${this.v1}/channels/credentials/${credentialId}`, { method: "GET" }).then(r => r.json())
  }

  async updateCredential(credentialId: string, body: UpdateCredentialInput): Promise<ChannelCredential> {
    return this.http.getFetch()(`${this.v1}/channels/credentials/${credentialId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }).then(r => r.json())
  }

  async deleteCredential(credentialId: string): Promise<void> {
    await this.http.getFetch()(`${this.v1}/channels/credentials/${credentialId}`, { method: "DELETE" })
  }

  async updateChannelWorkflow(workflowId: string, body: UpdateChannelWorkflowInput): Promise<ChannelWorkflowResponse> {
    return this.http.getFetch()(`${this.v1}/channels/workflows/${workflowId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }).then(r => r.json())
  }

  async deleteChannelWorkflow(workflowId: string): Promise<void> {
    await this.http.getFetch()(`${this.v1}/channels/workflows/${workflowId}`, { method: "DELETE" })
  }

  async listAssignableTeams(): Promise<Team[]> {
    return this.http.getFetch()(`${this.v1}/assign/teams/all`, { method: "GET" }).then(r => r.json())
  }

  async listTeamObservers(teamId: string): Promise<TeamObserver[]> {
    return this.http.getFetch()(`${this.v1}/assign/team/${teamId}/observers`, { method: "GET" }).then(r => r.json())
  }
}
