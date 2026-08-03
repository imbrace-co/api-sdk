import { HttpTransport } from "../http.js"
import type { Completion, Embedding, CompletionInput, EmbeddingInput, StreamChunk } from "../types/index.js"

// ─── AI Agent interfaces

export interface AiAgent {
  _id: string
  name: string
  description?: string
  instructions?: string
  model?: string
  mode?: 'standard' | 'advanced'
  model_id?: string
  provider_id?: string
  show_thinking_process?: boolean
  streaming?: boolean
  channel?: string
  channel_id?: string
  teams?: string | string[]
  categories?: number[]
  guardrail_id?: string
  personality_and_role?: string
  core_task?: string
  agent_type?: string
  sub_agents?: any[]
  team_leads?: any[]
  is_orchestrator?: boolean
  preload_information?: string
  tone_and_style?: string
  response_length?: string
  list_of_banned_words?: string
  files?: any
  selected_board_id?: string
  folder_ids?: string[]
  default_folder_id?: string
  board_ids?: string[]
  knowledge_hubs?: string[]
  workflow_functions?: any[]
  temperature?: number
  use_memory?: boolean
  tool_server?: any
  enable_echart?: boolean
  top_k_relevant_results?: number
  top_k?: number
  created_at?: string
  updated_at?: string
  [key: string]: unknown
}

export interface AiAgentListResponse {
  data: AiAgent[]
  total?: number
}

export interface AiAgentNameCheckResponse {
  available: boolean
  name: string
}

export interface PatchInstructionsInput {
  instructions: string
  [key: string]: unknown
}

// ─── AI Agent App interfaces

export interface AiAgentApp {
  _id: string
  name: string
  assistant_id?: string
  mode?: 'standard' | 'advanced'
  model_id?: string
  provider_id?: string
  instructions?: string
  agent_type?: string
  workflow?: Record<string, unknown>
  created_at?: string
  updated_at?: string
  [key: string]: unknown
}

export interface AiAgentAppListResponse {
  data: AiAgentApp[]
  total?: number
}

export interface CreateAiAgentAppInput {
  name: string
  workflow_name: string
  assistant_id?: string
  mode?: string
  model_id?: string
  provider_id?: string
  instructions?: string
  agent_type?: string
  [key: string]: unknown
}

export interface UpdateAiAgentAppInput {
  name?: string
  mode?: string
  model_id?: string
  provider_id?: string
  instructions?: string
  agent_type?: string
  [key: string]: unknown
}

export interface UpdateAiAgentWorkflowInput {
  workflow: Record<string, unknown>
  [key: string]: unknown
}

// ─── RAG File interfaces  

export interface RagFile {
  _id: string
  name: string
  size?: number
  status?: string
  created_at?: string
  [key: string]: unknown
}

export interface RagFileListResponse {
  data: RagFile[]
  total?: number
}

// ─── Guardrail interfaces   

export interface Guardrail {
  _id: string
  name: string
  type?: string
  config?: Record<string, unknown>
  created_at?: string
  updated_at?: string
  [key: string]: unknown
}

export interface GuardrailListResponse {
  data: Guardrail[]
  total?: number
}

export interface CreateGuardrailInput {
  name: string
  model: string
  instructions: string
  unsafe_categories?: string[]
  custom_unsafe_patterns?: string[]
  competitor_keywords?: string[]
  description?: string
  guardrail_provider_id?: string
  [key: string]: unknown
}

export interface UpdateGuardrailInput {
  name: string
  model: string
  instructions: string
  unsafe_categories?: string[]
  custom_unsafe_patterns?: string[]
  competitor_keywords?: string[]
  description?: string
  guardrail_provider_id?: string
  [key: string]: unknown
}

// ─── Guardrail Provider interfaces  

export interface GuardrailProvider {
  _id: string
  name: string
  type?: string
  config?: Record<string, unknown>
  created_at?: string
  updated_at?: string
  [key: string]: unknown
}

export interface GuardrailProviderListResponse {
  data: GuardrailProvider[]
  total?: number
}

export interface CreateGuardrailProviderInput {
  name: string
  type?: string
  config?: Record<string, unknown>
  [key: string]: unknown
}

export interface UpdateGuardrailProviderInput {
  name?: string
  config?: Record<string, unknown>
  [key: string]: unknown
}

export interface TestGuardrailProviderInput {
  prompt?: string
  [key: string]: unknown
}

export interface GuardrailProviderModelsResponse {
  models: Array<{ id: string; name: string; [key: string]: unknown }>
}

// ─── Custom Provider interfaces

export interface AiProviderModel {
  name: string
  provider?: string
  is_toolCall_available?: boolean
  is_vision_available?: boolean
  is_support_thinking?: boolean
  is_shown?: boolean
  [key: string]: unknown
}

export interface AiProvider {
  _id: string
  id?: string
  provider_id?: string
  name: string
  type?: string
  config?: Record<string, unknown>
  metadata?: Record<string, unknown>
  source?: string
  is_shown?: boolean
  models?: AiProviderModel[]
  organization_id?: string
  api_key?: string
  base_url?: string
  created_at?: string
  updated_at?: string
  [key: string]: unknown
}

/**
 * Legacy wrapped shape — some endpoints may return `{data, total}`.
 * `GET /v3/ai/providers` returns a raw `AiProvider[]`.
 */
export interface AiProviderListResponse {
  data: AiProvider[]
  total?: number
}

export interface CreateAiProviderInput {
  name: string
  type?: string
  api_key?: string
  base_url?: string
  [key: string]: unknown
}

export interface UpdateAiProviderInput {
  name?: string
  api_key?: string
  base_url?: string
  [key: string]: unknown
}

export interface WorkflowAgentModel {
  name: string
  is_toolCall_available?: boolean
  is_vision_available?: boolean
  is_support_thinking?: boolean
  [key: string]: unknown
}

export interface WorkflowAgentModelsResponse {
  success: boolean
  message?: string
  data: WorkflowAgentModel[]
}

/** Legacy alias kept for backward compat. */
export interface LlmModelsResponse {
  models: Array<{ id: string; name: string; provider?: string; provider_id?: string; [key: string]: unknown }>
}

export interface VerifyToolServerInput {
  url: string
  [key: string]: unknown
}

export interface VerifyToolServerResponse {
  success: boolean
  tools?: Array<{ name: string; description?: string; [key: string]: unknown }>
  [key: string]: unknown
}

export class AiResource {
  /**
   * @param base - Fully resolved AI base URL (gateway/ai).
   *   Version (v2/v3) is appended per method.
   */
  constructor(private readonly http: HttpTransport, private readonly base: string) {}

  private get v2() { return `${this.base.replace(/\/$/, "")}/v2/ai` }
  private get v3() { return `${this.base.replace(/\/$/, "")}/v3/ai` }

  private get aiAgentBase() {
    return this.v3
  }

  // ─── Completions / Embeddings   

  async complete(input: CompletionInput): Promise<Completion> {
    return this.http.getFetch()(`${this.v3}/completions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...input, stream: false }),
    }).then(r => r.json())
  }

  async *stream(input: Omit<CompletionInput, "stream">): AsyncGenerator<StreamChunk> {
    const res = await this.http.getFetch()(`${this.v3}/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "text/event-stream",
      },
      body: JSON.stringify({ ...input, stream: true }),
    })

    if (!res.body) throw new Error("No response body for streaming")

    const reader  = res.body.getReader()
    const decoder = new TextDecoder()
    let buffer    = ""

    try {
      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split("\n")
        buffer = lines.pop() ?? ""

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue
          const data = line.slice(6).trim()
          if (data === "[DONE]") return
          try {
            yield JSON.parse(data) as StreamChunk
          } catch {
            // skip malformed JSON lines
          }
        }
      }
    } finally {
      reader.releaseLock()
    }
  }

  async embed(input: EmbeddingInput): Promise<Embedding> {
    return this.http.getFetch()(`${this.v3}/embeddings`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    }).then(r => r.json())
  }

  // ─── AI Agents

  async listAiAgents(): Promise<AiAgentListResponse> {
    return this.http.getFetch()(`${this.aiAgentBase}/accounts/assistants`, { method: "GET" }).then(r => r.json())
  }

  async getAiAgent(aiAgentId: string): Promise<AiAgent> {
    return this.http.getFetch()(`${this.aiAgentBase}/accounts/assistants/${aiAgentId}`, { method: "GET" }).then(r => r.json())
  }

  async checkAiAgentName(name: string): Promise<AiAgentNameCheckResponse> {
    const url = new URL(`${this.aiAgentBase}/assistants/check-name`)
    url.searchParams.set("name", name)
    return this.http.getFetch()(url, { method: "GET" }).then(r => r.json())
  }

  async listAgents(): Promise<AiAgentListResponse> {
    return this.http.getFetch()(`${this.aiAgentBase}/assistants/agents`, { method: "GET" }).then(r => r.json())
  }

  async patchInstructions(aiAgentId: string, body: PatchInstructionsInput): Promise<AiAgent> {
    return this.http.getFetch()(`${this.aiAgentBase}/assistants/${aiAgentId}/instructions`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }).then(r => r.json())
  }

  // ─── AI Agent Apps

  async createAiAgentApp(body: CreateAiAgentAppInput): Promise<AiAgentApp> {
    return this.http.getFetch()(`${this.aiAgentBase}/assistant_apps`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }).then(r => r.json())
  }

  /**
   * Update an assistant app (PUT — full-object semantics).
   *
   * The backend re-validates the whole object, so a partial body that omits
   * `name` or `workflow_name` is rejected with
   * `400 "[ERROR: Invalid assistant name.]"` / `"[ERROR: Invalid workflow name.]"`,
   * even when you only meant to change one field (e.g. `folder_ids`). When
   * patching a single field, first fetch the agent and spread its existing
   * `name`, `workflow_name`, `model_id`, and `provider_id` into the body:
   *
   * ```ts
   * const a = await client.chatAi.getAiAgent(id)
   * await client.ai.updateAiAgentApp(id, {
   *   name: a.name, workflow_name: a.workflow_name,
   *   model_id: a.model_id, provider_id: a.provider_id,
   *   folder_ids: [...a.folder_ids, newFolderId],   // attach a Knowledge Hub folder
   * })
   * ```
   */
  async updateAiAgentApp(aiAgentId: string, body: UpdateAiAgentAppInput): Promise<AiAgentApp> {
    return this.http.getFetch()(`${this.aiAgentBase}/assistant_apps/${aiAgentId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }).then(r => r.json())
  }

  async deleteAiAgentApp(aiAgentId: string): Promise<void> {
    await this.http.getFetch()(`${this.aiAgentBase}/assistant_apps/${aiAgentId}`, { method: "DELETE" })
  }

  async updateAiAgentWorkflow(aiAgentId: string, body: UpdateAiAgentWorkflowInput): Promise<AiAgentApp> {
    return this.http.getFetch()(`${this.aiAgentBase}/assistant_apps/${aiAgentId}/workflow`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }).then(r => r.json())
  }

  // ─── RAG Files  

  async listRagFiles(): Promise<RagFileListResponse> {
    return this.http.getFetch()(`${this.v3}/rag/files`, { method: "GET" }).then(r => r.json())
  }

  async getRagFile(fileId: string): Promise<RagFile> {
    return this.http.getFetch()(`${this.v3}/rag/files/${fileId}`, { method: "GET" }).then(r => r.json())
  }

  async uploadRagFile(body: FormData): Promise<RagFile> {
    return this.http.getFetch()(`${this.v3}/rag/files`, {
      method: "POST",
      body,
    }).then(r => r.json())
  }

  async deleteRagFile(fileId: string): Promise<void> {
    await this.http.getFetch()(`${this.v3}/rag/files/${fileId}`, { method: "DELETE" })
  }

  // ─── Guardrails   

  async listGuardrails(): Promise<GuardrailListResponse> {
    return this.http.getFetch()(`${this.v3}/guardrail/all`, { method: "GET" }).then(r => r.json())
  }

  async getGuardrail(guardrailId: string): Promise<Guardrail> {
    return this.http.getFetch()(`${this.v3}/guardrail/${guardrailId}`, { method: "GET" }).then(r => r.json())
  }

  async createGuardrail(body: CreateGuardrailInput): Promise<Guardrail> {
    return this.http.getFetch()(`${this.v3}/guardrail/create`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }).then(r => r.json())
  }

  async updateGuardrail(guardrailId: string, body: UpdateGuardrailInput): Promise<Guardrail> {
    return this.http.getFetch()(`${this.v3}/guardrail/update/${guardrailId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }).then(r => r.json())
  }

  async deleteGuardrail(guardrailId: string): Promise<void> {
    await this.http.getFetch()(`${this.v3}/guardrail/delete/${guardrailId}`, { method: "DELETE" })
  }

  // ─── Guardrail Providers  

  async listGuardrailProviders(): Promise<GuardrailProviderListResponse> {
    return this.http.getFetch()(`${this.v3}/guardrail-providers`, { method: "GET" }).then(r => r.json())
  }

  async getGuardrailProvider(providerId: string): Promise<GuardrailProvider> {
    return this.http.getFetch()(`${this.v3}/guardrail-providers/${providerId}`, { method: "GET" }).then(r => r.json())
  }

  async createGuardrailProvider(body: CreateGuardrailProviderInput): Promise<GuardrailProvider> {
    return this.http.getFetch()(`${this.v3}/guardrail-providers`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }).then(r => r.json())
  }

  async updateGuardrailProvider(providerId: string, body: UpdateGuardrailProviderInput): Promise<GuardrailProvider> {
    return this.http.getFetch()(`${this.v3}/guardrail-providers/${providerId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }).then(r => r.json())
  }

  async deleteGuardrailProvider(providerId: string): Promise<void> {
    await this.http.getFetch()(`${this.v3}/guardrail-providers/${providerId}`, { method: "DELETE" })
  }

  async testGuardrailProvider(providerId: string, body: TestGuardrailProviderInput): Promise<VerifyToolServerResponse> {
    return this.http.getFetch()(`${this.v3}/guardrail-providers/${providerId}/test`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }).then(r => r.json())
  }

  async getGuardrailProviderModels(providerId: string): Promise<GuardrailProviderModelsResponse> {
    return this.http.getFetch()(`${this.v3}/guardrail-providers/${providerId}/models`, { method: "GET" }).then(r => r.json())
  }

  // ─── Custom Providers   

  /**
   * List AI providers — `GET /v3/ai/providers` returns custom providers.
   *
   * When `includeSystem` is `true` (default), also calls
   * `GET /v3/ai/workflow-agent/models` and prepends an entry for the
   * system-default provider with `provider_id === "system"` (the literal
   * value backend recognizes). `_id` and `id` are `null` because no backend
   * record exists for this entry.
   *
   * Pass `{ includeSystem: false }` to get only the raw custom list.
   */
  async listProviders(opts: { includeSystem?: boolean } = {}): Promise<AiProvider[]> {
    const includeSystem = opts.includeSystem ?? true
    const custom: AiProvider[] = await this.http
      .getFetch()(`${this.v3}/providers`, { method: "GET" })
      .then(r => r.json())
    if (!includeSystem) return Array.isArray(custom) ? custom : []
    let sysModels: any[] = []
    try {
      const sys = await this.http
        .getFetch()(`${this.v3}/workflow-agent/models`, { method: "GET" })
        .then(r => r.json())
      sysModels = Array.isArray(sys?.data) ? sys.data : []
    } catch {
      sysModels = []
    }
    if (sysModels.length === 0) return Array.isArray(custom) ? custom : []
    const systemProvider = {
      _id: null,
      id: null,
      provider_id: "system",
      name: "System Default",
      type: "system",
      source: "system",
      is_shown: true,
      models: sysModels,
    } as unknown as AiProvider
    return [systemProvider, ...(Array.isArray(custom) ? custom : [])]
  }

  async createProvider(body: CreateAiProviderInput): Promise<AiProvider> {
    return this.http.getFetch()(`${this.v3}/providers`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }).then(r => r.json())
  }

  async updateProvider(providerId: string, body: UpdateAiProviderInput): Promise<AiProvider> {
    return this.http.getFetch()(`${this.v3}/providers/${providerId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }).then(r => r.json())
  }

  async deleteProvider(providerId: string): Promise<void> {
    await this.http.getFetch()(`${this.v3}/providers/${providerId}`, { method: "DELETE" })
  }

  async refreshProviderModels(providerId: string): Promise<AiProvider> {
    return this.http.getFetch()(`${this.v3}/providers/${providerId}/models/refresh`, {
      method: "POST",
    }).then(r => r.json())
  }

  /**
   * List models available for workflow-agent — `GET /v3/ai/workflow-agent/models`.
   * Returns wrapped shape: `{success, message, data: [{name, is_toolCall_available, is_vision_available}]}`.
   */
  async getLlmModels(): Promise<WorkflowAgentModelsResponse> {
    return this.http.getFetch()(`${this.v3}/workflow-agent/models`, { method: "GET" }).then(r => r.json())
  }

  async verifyToolServer(body: VerifyToolServerInput): Promise<VerifyToolServerResponse> {
    return this.http.getFetch()(`${this.v3}/configs/tool_servers/verify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }).then(r => r.json())
  }


  // --- AI Agents (v2) ---

  async listAiAgentsV2(): Promise<AiAgentListResponse> {
    return this.http.getFetch()(`${this.v2}/ai/assistants`, { method: "GET" }).then(r => r.json())
  }

  async createAiAgentV2(body: any): Promise<AiAgent> {
    return this.http.getFetch()(`${this.v2}/ai/assistants`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }).then(r => r.json())
  }

  async updateAiAgentV2(aiAgentId: string, body: any): Promise<AiAgent> {
    return this.http.getFetch()(`${this.v2}/ai/assistants/${aiAgentId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }).then(r => r.json())
  }

  async deleteAiAgentV2(aiAgentId: string): Promise<void> {
    await this.http.getFetch()(`${this.v2}/ai/assistants/${aiAgentId}`, { method: "DELETE" })
  }

  async createAiAgentAppV2(body: any): Promise<AiAgentApp> {
    return this.http.getFetch()(`${this.v2}/ai/assistant_apps`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }).then(r => r.json())
  }
}
