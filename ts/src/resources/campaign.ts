import { HttpTransport } from "../http.js"

export interface Campaign {
  _id: string
  name: string
  status?: string
  channel_type?: string
  created_at?: string
  updated_at?: string
  [key: string]: unknown
}

export interface CampaignListResponse {
  data: Campaign[]
  total?: number
  [key: string]: unknown
}

export interface CreateCampaignInput {
  name: string
  channel_type?: string
  [key: string]: unknown
}

export interface Touchpoint {
  _id: string
  name?: string
  type?: string
  campaign_id?: string
  created_at?: string
  [key: string]: unknown
}

export interface TouchpointListResponse {
  data: Touchpoint[]
  total?: number
  [key: string]: unknown
}

export interface CreateTouchpointInput {
  name?: string
  type?: string
  campaign_id?: string
  message?: string | Record<string, unknown>
  [key: string]: unknown
}

export interface UpdateTouchpointInput {
  name?: string
  message?: string | Record<string, unknown>
  [key: string]: unknown
}

export interface ValidateTouchpointInput {
  touchpoint_id?: string
  [key: string]: unknown
}

export interface ValidateTouchpointResponse {
  valid: boolean
  errors?: string[]
  [key: string]: unknown
}

export class CampaignResource {
  /**
   * @param base - channel-service base URL (gateway/channel-service)
   */
  constructor(private readonly http: HttpTransport, private readonly base: string) {}

  private get v1() { return `${this.base}/v1` }

  async list(params?: Record<string, string>): Promise<CampaignListResponse> {
    const url = new URL(`${this.v1}/campaign`)
    if (params) Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v))
    return this.http.getFetch()(url, { method: "GET" }).then(r => r.json())
  }

  async get(campaignId: string): Promise<Campaign> {
    return this.http.getFetch()(`${this.v1}/campaign/${campaignId}`, { method: "GET" }).then(r => r.json())
  }

  async create(body: CreateCampaignInput): Promise<Campaign> {
    return this.http.getFetch()(`${this.v1}/campaign`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }).then(r => r.json())
  }

  async delete(campaignId: string): Promise<void> {
    await this.http.getFetch()(`${this.v1}/campaign/${campaignId}`, { method: "DELETE" })
  }

  async listTouchpoints(params?: Record<string, string>): Promise<TouchpointListResponse> {
    const url = new URL(`${this.v1}/touchpoints`)
    if (params) Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v))
    return this.http.getFetch()(url, { method: "GET" }).then(r => r.json())
  }

  async getTouchpoint(touchpointId: string): Promise<Touchpoint> {
    return this.http.getFetch()(`${this.v1}/touchpoints/${touchpointId}`, { method: "GET" }).then(r => r.json())
  }

  async createTouchpoint(body: CreateTouchpointInput): Promise<Touchpoint> {
    return this.http.getFetch()(`${this.v1}/touchpoints`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }).then(r => r.json())
  }

  async updateTouchpoint(touchpointId: string, body: UpdateTouchpointInput): Promise<Touchpoint> {
    return this.http.getFetch()(`${this.v1}/touchpoints/${touchpointId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }).then(r => r.json())
  }

  async deleteTouchpoint(touchpointId: string): Promise<void> {
    await this.http.getFetch()(`${this.v1}/touchpoints/${touchpointId}`, { method: "DELETE" })
  }

  async validateTouchpoint(body: ValidateTouchpointInput): Promise<ValidateTouchpointResponse> {
    return this.http.getFetch()(`${this.v1}/touchpoints/_validate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }).then(r => r.json())
  }
}
