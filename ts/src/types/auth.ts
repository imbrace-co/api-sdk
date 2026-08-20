export interface ImbraceApiKey {
  id: string
  apiKey: string
  organization_id: string
  user_id: string
  is_active: boolean
  expired_at: string
  created_at: string
  updated_at: string
  is_temp: boolean
}

export interface ImbraceApiKeyResponse {
  apiKey: ImbraceApiKey
  expires_in: number
}
