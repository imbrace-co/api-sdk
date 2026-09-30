import { HttpTransport } from "../http.js"
import type { SchedulerListParams, SchedulerListResponse } from "./ips.js"

export class ScheduleResource {
  /** @param base - data-board v1 base URL (`${gateway}/data-board/v1`) */
  constructor(private readonly http: HttpTransport, private readonly base: string) {}

  async list(params?: SchedulerListParams): Promise<SchedulerListResponse> {
    const url = new URL(`${this.base}/schedulers`)
    for (const [k, v] of Object.entries(params ?? {})) {
      if (v !== undefined) url.searchParams.set(k, String(v))
    }
    return this.http.getFetch()(url, { method: "GET" }).then(r => r.json())
  }

  async delete(schedulerId: string): Promise<void> {
    await this.http.getFetch()(`${this.base}/schedulers/${schedulerId}`, { method: "DELETE" })
  }
}
