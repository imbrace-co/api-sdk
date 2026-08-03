import { HttpTransport } from "../http.js"

export interface HealthStatus {
  status: string
  name?: string
  uptime?: number
  version?: string
}

export class HealthResource {
  constructor(private readonly http: HttpTransport, private readonly base: string) {}

  async check(): Promise<HealthStatus> {
    return this.http.getFetch()(`${this.base}/`, { method: "GET" })
      .then(res => res.json())
  }
}
