import { HttpTransport } from "../http.js"

export interface MessageSuggestionInput {
  message: string
  context?: any
  [key: string]: unknown
}

export interface MessageSuggestionResponse {
  suggestions: string[]
  [key: string]: unknown
}

export class MessageSuggestionResource {
  constructor(private readonly http: HttpTransport, private readonly base: string) {}

  /**
   * Get message suggestions
   * Endpoint: /v1/message-suggestion
   */
  async getSuggestions(body: MessageSuggestionInput): Promise<MessageSuggestionResponse> {
    return this.http.getFetch()(`${this.base}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }).then(r => r.json())
  }
}
