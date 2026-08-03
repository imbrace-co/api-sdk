import { HttpTransport } from "../http.js"

export interface License {
  status?: string
  plan?: string
  expiry?: string
  seats?: number
  features?: string[]
  [key: string]: unknown
}

export interface ActivateLicenseInput {
  license_key: string
  [key: string]: unknown
}

export interface ActivateLicenseResponse {
  success: boolean
  license?: License
  [key: string]: unknown
}

export class LicenseResource {
  /**
   * @param base - gateway base URL
   */
  constructor(private readonly http: HttpTransport, private readonly base: string) {}

  async get(): Promise<License> {
    return this.http.getFetch()(`${this.base}/license`, { method: "GET" }).then(r => r.json())
  }

  async activate(body: ActivateLicenseInput): Promise<ActivateLicenseResponse> {
    return this.http.getFetch()(`${this.base}/license`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }).then(r => r.json())
  }
}
