import { HttpTransport } from "../http.js"
import type { AgentTemplate } from "../types/index.js"

export interface AgentAiAgentInput {
  name?: string
  description?: string
  model?: string
  instructions?: string
  [key: string]: unknown
}

export interface AgentUseCaseInput {
  name?: string
  description?: string
  category?: string
  [key: string]: unknown
}

export interface CreateAgentInput {
  /** Wire body key kept as `assistant` for backend compatibility. */
  assistant: AgentAiAgentInput
  usecase: AgentUseCaseInput
}

export interface UpdateAgentInput {
  /** Wire body key kept as `assistant` for backend compatibility. */
  assistant?: AgentAiAgentInput
  usecase?: AgentUseCaseInput
}

export interface DeleteAgentResponse {
  success: boolean
  [key: string]: unknown
}

export interface UseCase {
  _id: string
  name?: string
  description?: string
  category?: string
  [key: string]: unknown
}

/**
 * Wire body for `POST /use-cases/v2/custom` — must contain both `usecase`
 * (the marketplace template) and `assistant` (the AI agent paired with it).
 * Backend rejects payloads missing either key with 400 "missing usecase or
 * assistant payload".
 */
export interface CreateUseCaseInput {
  usecase: {
    title: string
    description?: string
    category?: string[] | string
    demo_url?: string
    [key: string]: unknown
  }
  assistant: {
    name: string
    /** Required by ai-service `/assistant_apps` — used to generate the underlying workflow. */
    workflow_name?: string
    description?: string
    instructions?: string
    model?: string
    model_id?: string
    provider_id?: string
    file_ids?: string[]
    mode?: string
    channel?: string
    category?: string[] | string
    metadata?: Record<string, unknown>
    [key: string]: unknown
  }
  [key: string]: unknown
}

export interface UpdateUseCaseInput {
  name?: string
  description?: string
  category?: string
  [key: string]: unknown
}

export class AgentResource {
  private readonly templates: string
  private readonly useCases: string

  /**
   * @param http  - HTTP transport
   * @param base  - marketplace service base URL (gateway/marketplaces/v2)
   */
  constructor(
    private readonly http: HttpTransport,
    base: string,
  ) {
    const root = base.replace(/\/$/, "")
    this.templates = `${root}/market-places/v2/templates`
    this.useCases  = `${root}/use-cases`
  }

  // ── Marketplace Templates ─────────────────────────────────────────────

  async list(): Promise<AgentTemplate[]> {
    return this.http.getFetch()(this.templates, { method: "GET" }).then(r => r.json())
  }

  async get(templateId: string): Promise<{ data: AgentTemplate }> {
    return this.http.getFetch()(`${this.templates}/${templateId}`, { method: "GET" }).then(r => r.json())
  }

  async update(templateId: string, body: UpdateAgentInput): Promise<AgentTemplate> {
    return this.http.getFetch()(`${this.templates}/${templateId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }).then(r => r.json())
  }

  async delete(templateId: string): Promise<DeleteAgentResponse> {
    return this.http.getFetch()(`${this.templates}/${templateId}`, { method: "DELETE" }).then(r => r.json())
  }

  // ── Use-cases ─────────────────────────────────────────────────────────

  async listUseCases(): Promise<UseCase[]> {
    return this.http.getFetch()(this.useCases, { method: "GET" }).then(r => r.json())
  }

  async getUseCase(useCaseId: string): Promise<UseCase> {
    return this.http.getFetch()(`${this.useCases}/${useCaseId}`, { method: "GET" }).then(r => r.json())
  }

  async createUseCase(body: CreateUseCaseInput): Promise<UseCase> {
    // Match `chatAi.createAiAgent` ergonomics — default empty/missing
    // model_id + provider_id to the org's system LLM (gpt-4o). Without
    // these, the assistant is created but ai-agent returns 500 on chat:
    // "Assistant is missing model_id/provider_id configuration".
    const wireBody: CreateUseCaseInput = {
      ...body,
      assistant: {
        ...body.assistant,
        provider_id: body.assistant?.provider_id || "system",
        model_id:    body.assistant?.model_id    || "gpt-4o",
      },
    }
    return this.http.getFetch()(`${this.useCases}/v2/custom`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(wireBody),
    }).then(r => r.json())
  }

  async updateUseCase(useCaseId: string, body: UpdateUseCaseInput): Promise<UseCase> {
    return this.http.getFetch()(`${this.useCases}/${useCaseId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }).then(r => r.json())
  }

  async deleteUseCase(useCaseId: string): Promise<DeleteAgentResponse> {
    return this.http.getFetch()(`${this.useCases}/${useCaseId}`, { method: "DELETE" }).then(r => r.json())
  }
}
