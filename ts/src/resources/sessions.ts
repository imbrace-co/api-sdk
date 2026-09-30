/* eslint-disable @typescript-eslint/no-unused-vars -- retired methods keep their signatures for callers */
import { HttpTransport } from "../http.js"
import { retired } from "./retired.js"

export interface Session {
  id: string
  directory?: string
  workspace?: string
  created_at?: string
  updated_at?: string
}

const REASON = "no iMBrace service serves /session anymore"

/** @deprecated The gateway no longer serves `/session`. Every method throws. */
export class SessionsResource {
  constructor(private readonly http: HttpTransport, private readonly base: string) {}

  /** @deprecated Retired; throws. */
  async list(_params?: { directory?: string; workspace?: string }): Promise<Session[]> {
    return retired("sessions.list", REASON)
  }

  /** @deprecated Retired; throws. */
  async get(_sessionID: string, _params?: { directory?: string; workspace?: string }): Promise<Session> {
    return retired("sessions.get", REASON)
  }

  /** @deprecated Retired; throws. */
  async create(_body: { directory?: string; workspace?: string }): Promise<Session> {
    return retired("sessions.create", REASON)
  }

  /** @deprecated Retired; throws. */
  async delete(_sessionID: string): Promise<{ success: boolean }> {
    return retired("sessions.delete", REASON)
  }
}
