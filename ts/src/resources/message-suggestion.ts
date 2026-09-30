import { HttpTransport } from "../http.js"

export interface MessageSuggestionInput {
  /** Chat thread (UUID) to suggest follow-ups for. Required. */
  thread_id: string
  assistant_id?: string
  provider_id?: string
  model_id?: string
  custom_instructions?: string
  [key: string]: unknown
}

export interface MessageSuggestionResponse {
  success?: boolean
  follow_up_message?: string
  suggestions: string[]
  [key: string]: unknown
}

export class MessageSuggestionResource {
  /** @param base - suggestions endpoint (`${gateway}/ai-agent/suggestions`) */
  constructor(private readonly http: HttpTransport, private readonly base: string) {}

  /**
   * Get follow-up message suggestions for a chat thread.
   * Endpoint: `POST /ai-agent/suggestions`
   */
  async getSuggestions(body: MessageSuggestionInput): Promise<MessageSuggestionResponse> {
    return this.http.getFetch()(`${this.base}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }).then(r => r.json())
  }
}
