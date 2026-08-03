import { HttpTransport } from "../http.js"
import type { IpsProfile, Identity, PagedResponse } from "../types/index.js"

export interface Scheduler {
  _id: string
  name?: string
  type?: string
  status?: string
  [key: string]: unknown
}

export interface SchedulerFilterOptions {
  options: Array<{ value: string; label: string; [key: string]: unknown }>
  [key: string]: unknown
}

export interface IpsWorkflow {
  _id: string
  name?: string
  active?: boolean
  [key: string]: unknown
}

export interface ExternalDataSync {
  _id: string
  name?: string
  status?: string
  [key: string]: unknown
}

export interface EnableExternalDataSyncInput {
  source?: string
  config?: Record<string, unknown>
  [key: string]: unknown
}

export interface EnableExternalDataSyncResponse {
  success: boolean
  sync?: ExternalDataSync
  [key: string]: unknown
}

export class IpsResource {
  /**
   * @param base - Fully resolved IPS base URL including /ips/v1
   *   develop: https://app-gateway.dev.imbrace.co/ips/v1
   *   stable:  https://app-gatewayv2.imbrace.co/ips/v1
   */
  constructor(private readonly http: HttpTransport, private readonly base: string) {}

  async getProfile(userId: string): Promise<IpsProfile> {
    return this.http.getFetch()(`${this.base}/profiles/${userId}`, { method: "GET" }).then(r => r.json())
  }

  async getMyProfile(): Promise<IpsProfile> {
    return this.http.getFetch()(`${this.base}/profiles/me`, { method: "GET" }).then(r => r.json())
  }

  async updateProfile(userId: string, body: Partial<IpsProfile>): Promise<IpsProfile> {
    return this.http.getFetch()(`${this.base}/profiles/${userId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }).then(r => r.json())
  }

  async searchProfiles(query: string, params?: { page?: number; limit?: number }): Promise<PagedResponse<IpsProfile>> {
    const url = new URL(`${this.base}/profiles`)
    url.searchParams.set("q", query)
    if (params?.page)  url.searchParams.set("page",  String(params.page))
    if (params?.limit) url.searchParams.set("limit", String(params.limit))
    return this.http.getFetch()(url, { method: "GET" }).then(r => r.json())
  }

  async follow(targetUserId: string): Promise<void> {
    await this.http.getFetch()(`${this.base}/profiles/${targetUserId}/follow`, { method: "POST" })
  }

  async unfollow(targetUserId: string): Promise<void> {
    await this.http.getFetch()(`${this.base}/profiles/${targetUserId}/follow`, { method: "DELETE" })
  }

  async getFollowers(userId: string, params?: { page?: number; limit?: number }): Promise<PagedResponse<IpsProfile>> {
    const url = new URL(`${this.base}/profiles/${userId}/followers`)
    if (params?.page)  url.searchParams.set("page",  String(params.page))
    if (params?.limit) url.searchParams.set("limit", String(params.limit))
    return this.http.getFetch()(url, { method: "GET" }).then(r => r.json())
  }

  async getFollowing(userId: string, params?: { page?: number; limit?: number }): Promise<PagedResponse<IpsProfile>> {
    const url = new URL(`${this.base}/profiles/${userId}/following`)
    if (params?.page)  url.searchParams.set("page",  String(params.page))
    if (params?.limit) url.searchParams.set("limit", String(params.limit))
    return this.http.getFetch()(url, { method: "GET" }).then(r => r.json())
  }

  async listIdentities(userId: string): Promise<Identity[]> {
    return this.http.getFetch()(`${this.base}/identities/${userId}`, { method: "GET" }).then(r => r.json())
  }

  async unlinkIdentity(userId: string, provider: string): Promise<void> {
    await this.http.getFetch()(`${this.base}/identities/${userId}/${provider}`, { method: "DELETE" })
  }

  async listSchedulers(params?: { filter?: string }): Promise<Scheduler[]> {
    const url = new URL(`${this.base}/schedulers`)
    if (params?.filter) url.searchParams.set("filter", params.filter)
    return this.http.getFetch()(url, { method: "GET" }).then(r => r.json())
  }

  async deleteScheduler(schedulerId: string): Promise<void> {
    await this.http.getFetch()(`${this.base}/schedulers/${schedulerId}`, { method: "DELETE" })
  }

  async getSchedulerFilterOptions(filter: string): Promise<SchedulerFilterOptions> {
    const url = new URL(`${this.base}/schedulers/filter_options`)
    url.searchParams.set("filter", filter)
    return this.http.getFetch()(url, { method: "GET" }).then(r => r.json())
  }

  async listWorkflows(params?: Record<string, string>): Promise<IpsWorkflow[]> {
    const url = new URL(`${this.base}/workflows/all`)
    if (params) Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v))
    return this.http.getFetch()(url, { method: "GET" }).then(r => r.json())
  }

  async listApWorkflows(params?: Record<string, string>): Promise<IpsWorkflow[]> {
    const url = new URL(`${this.base}/ap-workflows/all`)
    if (params) Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v))
    return this.http.getFetch()(url, { method: "GET" }).then(r => r.json())
  }

  async listExternalDataSync(): Promise<ExternalDataSync[]> {
    return this.http.getFetch()(`${this.base}/external-data-sync`, { method: "GET" }).then(r => r.json())
  }

  async deleteExternalDataSync(syncId: string): Promise<void> {
    await this.http.getFetch()(`${this.base}/external-data-sync/${syncId}`, { method: "DELETE" })
  }

  async enableExternalDataSync(body: EnableExternalDataSyncInput): Promise<EnableExternalDataSyncResponse> {
    return this.http.getFetch()(`${this.base}/external-data-sync/enable`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }).then(r => r.json())
  }
}
