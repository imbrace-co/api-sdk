import { HttpTransport } from "../http.js"

export interface Session {
  id: string
  directory?: string
  workspace?: string
  created_at?: string
  updated_at?: string
}

export class SessionsResource {
  constructor(private readonly http: HttpTransport, private readonly base: string) {}

  async list(params?: { directory?: string; workspace?: string }): Promise<Session[]> {
    const url = new URL(`${this.base}/session`)
    if (params?.directory) url.searchParams.set("directory", encodeURIComponent(params.directory))
    if (params?.workspace) url.searchParams.set("workspace", params.workspace)
    return this.http.getFetch()(url, { method: "GET" }).then(res => res.json())
  }

  async get(sessionID: string, params?: { directory?: string; workspace?: string }): Promise<Session> {
    const url = new URL(`${this.base}/session/${sessionID}`)
    if (params?.directory) url.searchParams.set("directory", encodeURIComponent(params.directory))
    if (params?.workspace) url.searchParams.set("workspace", params.workspace)
    return this.http.getFetch()(url, { method: "GET" }).then(res => res.json())
  }

  async create(body: { directory?: string; workspace?: string }): Promise<Session> {
    return this.http.getFetch()(`${this.base}/session`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }).then(res => res.json())
  }

  async delete(sessionID: string): Promise<{ success: boolean }> {
    return this.http.getFetch()(`${this.base}/session/${sessionID}`, { method: "DELETE" })
      .then(res => res.json())
  }
}
