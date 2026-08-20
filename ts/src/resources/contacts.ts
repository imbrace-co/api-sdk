import { HttpTransport } from "../http.js"
import type { Contact, Conversation, Notification, PagedResponse } from "../types/index.js"

export interface UpdateContactInput {
  name?: string
  email?: string
  phone?: string
  [key: string]: unknown
}

export interface ContactComment {
  _id: string
  text?: string
  created_at?: string
  [key: string]: unknown
}

export interface ContactFile {
  _id: string
  name?: string
  url?: string
  size?: number
  [key: string]: unknown
}

export interface ConversationActivity {
  _id: string
  type?: string
  created_at?: string
  [key: string]: unknown
}

export interface NotificationActionResponse {
  success: boolean
  [key: string]: unknown
}

export class ContactsResource {
  /**
   * @param base - channel-service base URL (gateway/channel-service)
   */
  constructor(private readonly http: HttpTransport, private readonly base: string) {}

  private get v1() { return `${this.base}/v1` }

  async list(params?: { limit?: number; skip?: number; sort?: string }): Promise<PagedResponse<Contact>> {
    const url = new URL(`${this.v1}/contacts`)
    if (params?.limit)  url.searchParams.set("limit", String(params.limit))
    if (params?.skip !== undefined) url.searchParams.set("skip", String(params.skip))
    if (params?.sort)   url.searchParams.set("sort",  params.sort)
    return this.http.getFetch()(url, { method: "GET" }).then(r => r.json())
  }

  async get(contactId: string): Promise<Contact> {
    return this.http.getFetch()(`${this.v1}/contacts/${contactId}`, { method: "GET" }).then(r => r.json())
  }

  async update(contactId: string, body: UpdateContactInput): Promise<Contact> {
    return this.http.getFetch()(`${this.v1}/contacts/${contactId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }).then(r => r.json())
  }

  async search(params: { q: string; limit?: number; skip?: number; sort?: string; type?: string }): Promise<PagedResponse<Contact>> {
    const url = new URL(`${this.v1}/contacts/_search`)
    url.searchParams.set("q", params.q)
    if (params.limit)  url.searchParams.set("limit", String(params.limit))
    if (params.skip !== undefined) url.searchParams.set("skip", String(params.skip))
    if (params.sort)   url.searchParams.set("sort",  params.sort)
    if (params.type)   url.searchParams.set("type",  params.type)
    return this.http.getFetch()(url, { method: "GET" }).then(r => r.json())
  }

  async exportCsv(params?: { sort?: string }): Promise<string> {
    const url = new URL(`${this.v1}/contacts/_export_csv`)
    if (params?.sort) url.searchParams.set("sort", params.sort)
    return this.http.getFetch()(url, { method: "GET" }).then(r => r.text())
  }

  async getConversations(contactId: string, params?: { channelTypes?: string }): Promise<Conversation[]> {
    const url = new URL(`${this.v1}/contacts/${contactId}/conversations`)
    if (params?.channelTypes) url.searchParams.set("channel_types", params.channelTypes)
    return this.http.getFetch()(url, { method: "GET" }).then(r => r.json())
  }

  async getComments(contactId: string, params?: {
    channelType?: string
    skip?: number
    limit?: number
  }): Promise<ContactComment[]> {
    const url = new URL(`${this.v1}/contacts/${contactId}/comments`)
    if (params?.channelType) url.searchParams.set("channel_types", params.channelType)
    if (params?.skip !== undefined) url.searchParams.set("skip",  String(params.skip))
    if (params?.limit) url.searchParams.set("limit", String(params.limit))
    return this.http.getFetch()(url, { method: "GET" }).then(r => r.json())
  }

  async getFiles(contactId: string): Promise<ContactFile[]> {
    return this.http.getFetch()(`${this.v1}/contact/${contactId}/files`, { method: "GET" }).then(r => r.json())
  }

  async getActivities(conversationId: string): Promise<ConversationActivity[]> {
    return this.http.getFetch()(`${this.v1}/conversations_activities/${conversationId}`, { method: "GET" }).then(r => r.json())
  }

  async uploadAvatar(body: FormData): Promise<{ url: string }> {
    return this.http.getFetch()(`${this.v1}/contacts/_fileupload`, {
      method: "POST",
      body,
    }).then(r => r.json())
  }

  async listNotifications(params?: { limit?: number; skip?: number }): Promise<PagedResponse<Notification>> {
    const url = new URL(`${this.v1}/notifications`)
    if (params?.limit)  url.searchParams.set("limit", String(params.limit))
    if (params?.skip !== undefined) url.searchParams.set("skip", String(params.skip))
    return this.http.getFetch()(url, { method: "GET" }).then(r => r.json())
  }

  async markNotificationsRead(notificationIds: string[]): Promise<NotificationActionResponse> {
    return this.http.getFetch()(`${this.v1}/notifications/read`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ notification_id: notificationIds }),
    }).then(r => r.json())
  }

  async dismissNotification(notificationId: string): Promise<NotificationActionResponse> {
    return this.http.getFetch()(`${this.v1}/notifications/dismiss`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ notification_id: notificationId }),
    }).then(r => r.json())
  }

  async dismissAllNotifications(): Promise<NotificationActionResponse> {
    return this.http.getFetch()(`${this.v1}/notifications/dismiss/all`, {
      method: "DELETE",
    }).then(r => r.json())
  }
}
