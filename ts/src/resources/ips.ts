import { HttpTransport } from "../http.js"
import { retired as retiredMethod } from "./retired.js"
import type { IpsProfile, Identity, PagedResponse } from "../types/index.js"

export interface Scheduler {
  _id: string
  name?: string
  type?: string
  event_type?: string
  is_paused?: boolean
  is_finished?: boolean
  [key: string]: unknown
}

/** `GET /data-board/v1/schedulers` — paged list. */
export interface SchedulerListResponse {
  data: Scheduler[]
  count: number
  total: number
  has_more: boolean
}

/**
 * Query for {@link IpsResource.listSchedulers}. Any extra key is a field filter,
 * either a plain value or `"<filter type>:<value>"` (e.g. `event_type: "is:email_campaign"`).
 */
export interface SchedulerListParams {
  skip?: number
  limit?: number
  sort?: string
  order?: "asc" | "desc"
  exact?: boolean
  [field: string]: string | number | boolean | undefined
}

/** Distinct values of one field, e.g. `[{ event_type: "board_automation" }, …]`. */
export type SchedulerFilterOptions = Array<Record<string, string>>

/** @deprecated IPS workflows are gone — see {@link IpsResource.listWorkflows}. */
export interface IpsWorkflow {
  _id: string
  name?: string
  active?: boolean
  [key: string]: unknown
}

export interface ExternalDataSync {
  id: string
  organization_id?: string
  provider?: string
  connection_id?: string
  connection_name?: string
  is_active?: boolean
  last_synced_at?: string | null
  [key: string]: unknown
}

/** `GET /channel-service/v1/external-data-sync`. */
export interface ExternalDataSyncListResponse {
  data: ExternalDataSync[]
  count: number
}

export interface EnableExternalDataSyncInput {
  provider: string
  connection_id: string
  destination?: "knowledgehub" | "workflow"
  [key: string]: unknown
}

export interface EnableExternalDataSyncResponse {
  message: string
  subscription_id: string
  provider: string
  is_active: boolean
}

function retired(method: string, hint: string): never {
  return retiredMethod(`ips.${method}`, "the IPS service has been retired", hint)
}

const NO_REPLACEMENT = "There is no replacement."

/**
 * Former IPS surface. The IPS service is retired: schedulers now live in
 * data-board and external data sync in channel-service; the rest has no
 * replacement and throws.
 */
export class IpsResource {
  private readonly dataBoard: string
  private readonly channelService: string

  /**
   * @param base           - IPS base URL (`${gateway}/ips/v1`), kept for compatibility
   * @param dataBoard      - data-board base URL (`${gateway}/data-board`)
   * @param channelService - channel-service base URL (`${gateway}/channel-service`)
   */
  constructor(
    private readonly http: HttpTransport,
    base: string,
    dataBoard?: string,
    channelService?: string,
  ) {
    const gateway = base.replace(/\/ips\/v\d+\/?$/, "")
    this.dataBoard = (dataBoard ?? `${gateway}/data-board`).replace(/\/$/, "")
    this.channelService = (channelService ?? `${gateway}/channel-service`).replace(/\/$/, "")
  }

  /* eslint-disable @typescript-eslint/no-unused-vars -- retired methods keep their signatures for callers */
  /** @deprecated IPS is retired; throws. */
  async getProfile(_userId: string): Promise<IpsProfile> {
    return retired("getProfile", NO_REPLACEMENT)
  }

  /** @deprecated IPS is retired; throws. */
  async getMyProfile(): Promise<IpsProfile> {
    return retired("getMyProfile", NO_REPLACEMENT)
  }

  /** @deprecated IPS is retired; throws. */
  async updateProfile(_userId: string, _body: Partial<IpsProfile>): Promise<IpsProfile> {
    return retired("updateProfile", NO_REPLACEMENT)
  }

  /** @deprecated IPS is retired; throws. */
  async searchProfiles(_query: string, _params?: { page?: number; limit?: number }): Promise<PagedResponse<IpsProfile>> {
    return retired("searchProfiles", NO_REPLACEMENT)
  }

  /** @deprecated IPS is retired; throws. */
  async follow(_targetUserId: string): Promise<void> {
    return retired("follow", NO_REPLACEMENT)
  }

  /** @deprecated IPS is retired; throws. */
  async unfollow(_targetUserId: string): Promise<void> {
    return retired("unfollow", NO_REPLACEMENT)
  }

  /** @deprecated IPS is retired; throws. */
  async getFollowers(_userId: string, _params?: { page?: number; limit?: number }): Promise<PagedResponse<IpsProfile>> {
    return retired("getFollowers", NO_REPLACEMENT)
  }

  /** @deprecated IPS is retired; throws. */
  async getFollowing(_userId: string, _params?: { page?: number; limit?: number }): Promise<PagedResponse<IpsProfile>> {
    return retired("getFollowing", NO_REPLACEMENT)
  }

  /** @deprecated IPS is retired; throws. */
  async listIdentities(_userId: string): Promise<Identity[]> {
    return retired("listIdentities", NO_REPLACEMENT)
  }

  /** @deprecated IPS is retired; throws. */
  async unlinkIdentity(_userId: string, _provider: string): Promise<void> {
    return retired("unlinkIdentity", NO_REPLACEMENT)
  }
  /* eslint-enable @typescript-eslint/no-unused-vars */

  /** List schedulers — `GET /data-board/v1/schedulers`. */
  async listSchedulers(params?: SchedulerListParams): Promise<SchedulerListResponse> {
    const url = new URL(`${this.dataBoard}/v1/schedulers`)
    for (const [k, v] of Object.entries(params ?? {})) {
      if (v !== undefined) url.searchParams.set(k, String(v))
    }
    return this.http.getFetch()(url, { method: "GET" }).then(r => r.json())
  }

  /** Delete a scheduler — `DELETE /data-board/v1/schedulers/:id`. */
  async deleteScheduler(schedulerId: string): Promise<void> {
    await this.http.getFetch()(`${this.dataBoard}/v1/schedulers/${schedulerId}`, { method: "DELETE" })
  }

  /** Distinct values of one field — `GET /data-board/v1/schedulers/filter_options`. */
  async getSchedulerFilterOptions(filter: "event_type" | "channel_source" | "sender"): Promise<SchedulerFilterOptions> {
    const url = new URL(`${this.dataBoard}/v1/schedulers/filter_options`)
    url.searchParams.set("filter", filter)
    return this.http.getFetch()(url, { method: "GET" }).then(r => r.json())
  }

  /* eslint-disable @typescript-eslint/no-unused-vars */
  /** @deprecated IPS is retired; throws. Use `client.workflows.listChannelAutomation()`. */
  async listWorkflows(_params?: Record<string, string>): Promise<IpsWorkflow[]> {
    return retired("listWorkflows", "Use client.workflows.listChannelAutomation() instead.")
  }

  /** @deprecated IPS is retired; throws. Use `client.workflows.listFlows()`. */
  async listApWorkflows(_params?: Record<string, string>): Promise<IpsWorkflow[]> {
    return retired("listApWorkflows", "Use client.workflows.listFlows() instead.")
  }
  /* eslint-enable @typescript-eslint/no-unused-vars */

  /** List sync subscriptions — `GET /channel-service/v1/external-data-sync`. */
  async listExternalDataSync(): Promise<ExternalDataSyncListResponse> {
    return this.http.getFetch()(`${this.channelService}/v1/external-data-sync`, { method: "GET" }).then(r => r.json())
  }

  /** Delete a sync subscription — `DELETE /channel-service/v1/external-data-sync/:id`. */
  async deleteExternalDataSync(syncId: string): Promise<void> {
    await this.http.getFetch()(`${this.channelService}/v1/external-data-sync/${syncId}`, { method: "DELETE" })
  }

  /** Enable a sync — `POST /channel-service/v1/external-data-sync/enable`. */
  async enableExternalDataSync(body: EnableExternalDataSyncInput): Promise<EnableExternalDataSyncResponse> {
    return this.http.getFetch()(`${this.channelService}/v1/external-data-sync/enable`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }).then(r => r.json())
  }
}
