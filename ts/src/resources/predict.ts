import { HttpTransport } from "../http.js"

export interface PredictInput {
  [key: string]: unknown
}

export interface PredictResponse {
  [key: string]: unknown
}

export class PredictResource {
  constructor(private readonly http: HttpTransport, private readonly base: string) {}

  /**
   * Run prediction
   * Endpoint: /predict/
   */
  async predict(body: PredictInput): Promise<PredictResponse> {
    return this.http.getFetch()(`${this.base}/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }).then(r => r.json())
  }
}
