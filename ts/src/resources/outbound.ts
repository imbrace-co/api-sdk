import { HttpTransport } from "../http.js"

export interface OutboundWhatsAppInput {
  to: string
  template_name?: string
  template_language?: string
  components?: unknown[]
  channel_id?: string
  [key: string]: unknown
}

export interface OutboundEmailInput {
  to: string | string[]
  subject: string
  body?: string
  html?: string
  channel_id?: string
  [key: string]: unknown
}

export interface OutboundResponse {
  success: boolean
  message_id?: string
  [key: string]: unknown
}

export class OutboundResource {
  /**
   * @param base - channel-service base URL (gateway/channel-service)
   */
  constructor(private readonly http: HttpTransport, private readonly base: string) {}

  private get v1() { return `${this.base}/v1` }

  async sendWhatsApp(body: OutboundWhatsAppInput): Promise<OutboundResponse> {
    return this.http.getFetch()(`${this.v1}/outbounds/whatsapp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }).then(r => r.json())
  }

  async sendEmail(body: OutboundEmailInput): Promise<OutboundResponse> {
    return this.http.getFetch()(`${this.v1}/outbounds/email`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }).then(r => r.json())
  }
}
