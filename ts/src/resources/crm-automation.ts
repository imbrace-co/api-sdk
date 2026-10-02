import { HttpTransport } from "../http.js"
import { ApiError } from "../errors.js"

/** A board automation: runs a workflow when board items are created, updated, deleted, or on a schedule. */
export interface CrmAutomation {
  id: string
  name?: string
  board_id: string
  type: "create" | "update" | "delete" | "scheduled"
  workflow_id?: string
  field_id?: string
  is_paused?: boolean
  [key: string]: unknown
}

/**
 * Body for {@link CrmAutomationResource.create}.
 *
 * `create` / `update` / `delete` need `board_id`, `workflow_id` and `name`;
 * `update` also needs `field_id` (the field whose change triggers it).
 * `scheduled` needs the scheduler settings (`trigger_frequency_unit`,
 * `trigger_frequency_value`, `trigger_time`, `start_date`, `start_time`, …)
 * as in `client.schedule.create`.
 */
export interface CreateCrmAutomationInput {
  board_id: string
  type: "create" | "update" | "delete" | "scheduled"
  name?: string
  workflow_id?: string
  field_id?: string
  description?: string
  folder_ids?: string[]
  is_knowledge_base?: boolean
  is_paused?: boolean
  [key: string]: unknown
}

export type UpdateCrmAutomationInput = Partial<CreateCrmAutomationInput> & { board_id: string }

/** CRM automations (data-board `crmboard`). */
export class CrmAutomationResource {
  /** @param base - data-board v1 base URL (`${gateway}/data-board/v1`) */
  constructor(private readonly http: HttpTransport, private readonly base: string) {}

  private json(path: string, method: string, body?: unknown): Promise<any> {
    return this.http.getFetch()(`${this.base}/crmboard${path}`, {
      method,
      ...(body !== undefined ? { headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) } : {}),
    }).then(r => r.json())
  }

  /** All automations of the org. */
  async list(): Promise<CrmAutomation[]> {
    return this.json("/organization/board", "GET").catch(emptyOn404)
  }

  async listByBoard(boardId: string): Promise<CrmAutomation[]> {
    return this.json(`/${boardId}`, "GET").catch(emptyOn404)
  }

  async get(id: string): Promise<CrmAutomation> {
    return this.json(`/board/${id}`, "GET")
  }

  async create(body: CreateCrmAutomationInput): Promise<CrmAutomation> {
    return this.json("", "POST", body)
  }

  async update(id: string, body: UpdateCrmAutomationInput): Promise<CrmAutomation> {
    return this.json(`/board/${id}`, "PUT", body)
  }

  /** Also removes the automation's scheduler, if any. */
  async delete(id: string): Promise<{ message: string }> {
    return this.json(`/board/${id}`, "DELETE")
  }

  async deleteByBoard(boardId: string): Promise<{ message: string }> {
    return this.json(`/${boardId}`, "DELETE")
  }
}

/** The list routes answer 404 instead of an empty array. */
function emptyOn404(e: unknown): never[] {
  if (e instanceof ApiError && e.statusCode === 404) return []
  throw e
}
