import { HttpTransport } from "../http.js"
import type { Scheduler } from "./ips.js"

export class ScheduleResource {
  constructor(private readonly http: HttpTransport, private readonly base: string) {}

  async list(params?: { filter?: string }): Promise<Scheduler[]> {
    // base = ips/v1 — schedulers are in the IPS service
    const url = new URL(`${this.base}/schedulers`)
    if (params?.filter) url.searchParams.set("filter", params.filter)
    return this.http.getFetch()(url, { method: "GET" }).then(r => r.json())
  }

  async delete(schedulerId: string): Promise<void> {
    await this.http.getFetch()(`${this.base}/schedulers/${schedulerId}`, { method: "DELETE" })
  }
}
