
export interface BaseEntity {
  _id: string
  created_at?: string
  updated_at?: string
}

export interface AiListResponse<T> {
  data: T[]
  total?: number
}


export interface AiBaseResource extends BaseEntity {
  name: string
  [key: string]: unknown
}


export enum AiRole {
  System = "system",
  User = "user",
  Assistant = "assistant",
  Tool = "tool",
}


export enum AiMode {
  Standard = "standard",
  Advanced = "advanced",
}

export enum AiStatus {
  Active = "active",
  Inactive = "inactive",
  Pending = "pending",
  Processing = "processing",
  Completed = "completed",
  Error = "error",
}


export enum AiFinishReason {
  Stop = "stop",
  Length = "length",
  ContentFilter = "content_filter",
  ToolCalls = "tool_calls",
  FunctionCall = "function_call",
}


export enum AiAgentType {
  Conversational = "conversational",
  Workflow = "workflow",
  Assistant = "assistant",
  Agent = "agent",
}
export interface CompletionInput {
  model: string
  messages: { role: AiRole | string; content: string }[]
  temperature?: number
  maxTokens?: number
  metadata?: Record<string, unknown>
  stream?: boolean
}

export interface Completion {
  id: string
  object: string
  model: string
  choices: {
    index: number
    message: { role: AiRole | string; content: string }
    finish_reason: AiFinishReason | string
  }[]
  usage?: {
    prompt_tokens: number
    completion_tokens: number
    total_tokens: number
  }
}

export interface StreamChunk {
  id: string
  object: string
  model: string
  choices: {
    index: number
    delta: { role?: AiRole | string; content?: string }
    finish_reason: AiFinishReason | string | null
  }[]
}

export interface EmbeddingInput {
  model: string
  input: string[]
}

export interface Embedding {
  object: string
  model: string
  data: { object: string; embedding: number[]; index: number }[]
  usage: { prompt_tokens: number; total_tokens: number }
}



export interface AiAgent extends AiBaseResource {
  description?: string
  instructions?: string
  model?: string
  mode?: AiMode | string
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
  agent_type?: AiAgentType | string
  // The backend answers with either a bare assistant id or an enriched
  // `{ assistant_id, name }` object, depending on the endpoint.
  sub_agents?: (string | Record<string, unknown>)[]
  team_leads?: (string | Record<string, unknown>)[]
  is_orchestrator?: boolean
  preload_information?: string
  tone_and_style?: string
  response_length?: string
  list_of_banned_words?: string
  files?: Record<string, unknown> | string[]
  selected_board_id?: string
  folder_ids?: string[]
  default_folder_id?: string
  board_ids?: string[]
  knowledge_hubs?: string[]
  workflow_functions?: Record<string, unknown>[]
  temperature?: number
  use_memory?: boolean
  tool_server?: Record<string, unknown>
  enable_echart?: boolean
  top_k_relevant_results?: number
  top_k?: number
}

export type AiAgentListResponse = AiListResponse<AiAgent>

export interface AiAgentNameCheckResponse {
  available: boolean
  name: string
}

export interface PatchInstructionsInput {
  instructions: string
  [key: string]: unknown
}



export interface AiAgentApp extends AiBaseResource {
  assistant_id?: string
  mode?: AiMode | string
  model_id?: string
  provider_id?: string
  instructions?: string
  agent_type?: AiAgentType | string
  workflow?: Record<string, unknown>
}

export type AiAgentAppListResponse = AiListResponse<AiAgentApp>

export interface CreateAiAgentAppInput {
  name: string
  assistant_id?: string
  mode?: AiMode | string
  model_id?: string
  provider_id?: string
  instructions?: string
  agent_type?: AiAgentType | string
  [key: string]: unknown
}

export interface UpdateAiAgentAppInput {
  name?: string
  mode?: AiMode | string
  model_id?: string
  provider_id?: string
  instructions?: string
  agent_type?: AiAgentType | string
  [key: string]: unknown
}

export interface UpdateAiAgentWorkflowInput {
  workflow: Record<string, unknown>
  [key: string]: unknown
}



export interface RagFile extends BaseEntity {
  name: string
  size?: number
  status?: AiStatus | string
}

export type RagFileListResponse = AiListResponse<RagFile>



export interface Guardrail extends AiBaseResource {
  type?: string
  config?: Record<string, unknown>
}

export type GuardrailListResponse = AiListResponse<Guardrail>

export interface CreateGuardrailInput {
  name: string
  type?: string
  config?: Record<string, unknown>
  [key: string]: unknown
}

export interface UpdateGuardrailInput {
  name?: string
  config?: Record<string, unknown>
  [key: string]: unknown
}



export interface GuardrailProvider extends AiBaseResource {
  type?: string
  config?: Record<string, unknown>
}

export type GuardrailProviderListResponse = AiListResponse<GuardrailProvider>

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


export interface AiProvider extends AiBaseResource {
  type?: string
  api_key?: string
  base_url?: string
}

export type AiProviderListResponse = AiListResponse<AiProvider>

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

export interface LlmModelsResponse {
  models: Array<{
    id: string
    name: string
    provider?: string
    [key: string]: unknown
  }>
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
