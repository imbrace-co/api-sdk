import { HttpTransport } from "../http.js"
import type { Account } from "../types/index.js"

export class AccountResource {
  constructor(
    private readonly http: HttpTransport,
    private readonly base: string,
  ) {}

  private get v1() { return `${this.base}/v1` }

  async getAccount(): Promise<Account> {
    return this.http.getFetch()(`${this.v1}/account`, { method: "GET" }).then(r => r.json())
  }

  async updateAccount(body: Partial<Account>): Promise<Account> {
    return this.http.getFetch()(`${this.v1}/account`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }).then(r => r.json())
  }

  async uploadAvatar(body: FormData): Promise<{ url: string }> {
    return this.http.getFetch()(`${this.v1}/account/_fileupload`, {
      method: "POST",
      body,
    }).then(r => r.json())
  }
}
