import { HttpTransport } from "../http.js"
import type { Scheduler, SchedulerListParams, SchedulerListResponse } from "./ips.js"

/** What a scheduler fires when it runs. */
export interface SchedulerJob {
  type: "kafka" | "webhook"
  /** kafka */
  topic?: string
  workflow_id?: string
  /** webhook */
  url?: string
  method?: string
  data?: Record<string, unknown>
  [key: string]: unknown
}

/**
 * Body for {@link ScheduleResource.create} and {@link ScheduleResource.update}.
 *
 * `non_recurring` (default) runs once at `start_date` + `start_time`.
 * `recurring` also needs `trigger_frequency_unit`, `trigger_frequency_value`
 * and `trigger_time`, plus `trigger_day_of_week` (weeks), `trigger_day_of_month`
 * (months) or `triger_month_and_day` (years — the server spells it this way).
 * The start must be in the future.
 */
export interface CreateSchedulerInput {
  name: string
  event_type: string
  job: SchedulerJob
  type?: "non_recurring" | "recurring"
  description?: string
  /** `YYYY-MM-DD` */
  start_date?: string
  /** `HH:mm` */
  start_time?: string
  start_datetime?: string
  trigger_frequency_unit?: "days" | "weeks" | "months" | "years"
  trigger_frequency_value?: number
  trigger_time?: string
  trigger_day_of_week?: string | string[]
  trigger_day_of_month?: number | number[]
  triger_month_and_day?: string
  channel_source?: string
  options?: Record<string, unknown>
  is_paused?: boolean
  [key: string]: unknown
}

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

  async get(schedulerId: string): Promise<Scheduler> {
    return this.http.getFetch()(`${this.base}/schedulers/${schedulerId}`, { method: "GET" }).then(r => r.json())
  }

  async create(body: CreateSchedulerInput): Promise<Scheduler> {
    return this.http.getFetch()(`${this.base}/schedulers`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }).then(r => r.json())
  }

  /** Replaces the scheduler; the server validates the full body again, so send every field. */
  async update(schedulerId: string, body: CreateSchedulerInput): Promise<Scheduler> {
    return this.http.getFetch()(`${this.base}/schedulers/${schedulerId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }).then(r => r.json())
  }

  async delete(schedulerId: string): Promise<void> {
    await this.http.getFetch()(`${this.base}/schedulers/${schedulerId}`, { method: "DELETE" })
  }
}
