import { HttpTransport } from "../http.js"

// ── Input shapes ──────────────────────────────────────────────────────────────

/**
 * The `usecase` half of the create-custom-template payload.
 * `agent_type` distinguishes use case type — for Document AI agents pass `"document_ai"`.
 */
export interface UseCaseInput {
  title: string
  short_description?: string
  demo_url?: string
  agent_type?: string
  [key: string]: unknown
}

/**
 * Nested config inside the `assistant.document_ai` body slot for Document AI
 * agents. Mirrors the body sent by the iMBRACE webapp when creating a
 * Document AI agent.
 */
export interface DocumentAIAgentConfig {
  vlm_provider_id: string
  vlm_model: string
  source_languages: string[]
  handwriting_support: boolean
  board_id: string
  time_offset?: string
  continue_on_failure?: boolean
  retry_time?: number
  [key: string]: unknown
}

/**
 * The AI Agent half of the create-custom-template payload (sent on the wire
 * under the `assistant` body key, kept as-is for backend compatibility).
 *
 * For Document AI agents: set `agent_type: "document_ai"` and populate the
 * nested `document_ai` config (linking the schema board, VLM provider, etc.).
 */
export interface AiAgentInput {
  name: string
  description?: string
  mode?: "advanced" | "standard"
  model_id?: string
  provider_id?: string
  /** = the agent's instructions / system prompt. */
  core_task?: string
  agent_type?: string
  channel?: string
  temperature?: number
  workflow_function_call?: string[]
  workflow_name?: string
  credential_name?: string
  board_ids?: string[]
  version?: number
  document_ai?: DocumentAIAgentConfig
  metadata?: Record<string, unknown>
  [key: string]: unknown
}

// ── Response shapes ───────────────────────────────────────────────────────────

export interface UseCase {
  _id: string
  public_id?: string
  doc_name?: string
  title: string
  short_description?: string
  type?: string
  agent_type?: string
  organization_id?: string
  user_id?: string
  channel_id?: string
  assistant_id?: string
  demo_url?: string
  version?: number
  is_deleted?: boolean
  features?: unknown[]
  tags?: unknown[]
  suggestion_prompts?: unknown[]
  how_it_works?: unknown[]
  supported_channels?: unknown[]
  integrations?: unknown[]
  created_at?: string
  updated_at?: string
  createdAt?: string
  updatedAt?: string
  [key: string]: unknown
}

export interface UseCaseListResponse {
  data: UseCase[]
}

export interface CreateCustomTemplateResponse {
  data: UseCase
}

// ── Resource ──────────────────────────────────────────────────────────────────

/**
 * Use Case Templates resource.
 *
 * Wraps `/v2/backend/templates` endpoints. The most important method is
 * {@link createCustom}, which atomically creates a UseCase + AI Agent pair
 * used by Document AI flows.
 *
 * @example Create a Document AI agent (UseCase + AI Agent linked to a schema board)
 * ```ts
 * const res = await client.templates.createCustom({
 *   usecase: {
 *     title: "Receipt Extractor",
 *     short_description: "Extract invoice fields",
 *     demo_url: "https://chat-widget.imbrace.co",
 *     agent_type: "document_ai",
 *   },
 *   assistant: {
 *     name: "Receipt Extractor",
 *     mode: "advanced",
 *     model_id: "qwen3.5:27b",
 *     provider_id: "8cc8769a-...",
 *     core_task: "Step 1: Extract Data...",
 *     agent_type: "document_ai",
 *     channel: "web",
 *     temperature: 0.1,
 *     version: 2,
 *     document_ai: {
 *       vlm_provider_id: "8cc8769a-...",
 *       vlm_model: "qwen3.5:27b",
 *       source_languages: ["English"],
 *       handwriting_support: true,
 *       board_id: "brd_xxx",
 *       continue_on_failure: false,
 *       retry_time: 2,
 *     },
 *   },
 * })
 * const { _id: usecaseId, assistant_id, channel_id } = res.data
 * ```
 */
export class TemplatesResource {
  /**
   * @param http  HTTP transport
   * @param base  Templates base URL (typically `${gateway}/v2/backend/templates`)
   */
  constructor(
    private readonly http: HttpTransport,
    private readonly base: string,
  ) {}

  private get root() {
    return this.base.replace(/\/$/, "")
  }

  /** List use case templates — `GET /v2/backend/templates`. */
  async list(): Promise<UseCaseListResponse> {
    return this.http.getFetch()(this.root, { method: "GET" }).then(r => r.json())
  }

  /**
   * Create a custom UseCase + AI Agent in one POST.
   *
   * Routes to `POST /v2/backend/templates/v2/custom`. Backend auto-creates the
   * linked channel, workflow (ActivePieces), and assistant_app, and returns the
   * assembled use case (with `assistant_id`, `channel_id`).
   *
   * The wire body still uses the `assistant` key for backend compatibility.
   */
  async createCustom(input: {
    usecase: UseCaseInput
    assistant: AiAgentInput
  }): Promise<CreateCustomTemplateResponse> {
    return this.http.getFetch()(`${this.root}/v2/custom`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    }).then(r => r.json())
  }
}
