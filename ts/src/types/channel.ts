export type ChannelType = "web" | "facebook" | "whatsapp" | "instagram" | "wechat" | "line" | "email" | "wecom"

export interface Channel {
  object_name?: string
  id: string
  name: string
  type: ChannelType
  organization_id: string
  business_unit_id?: string
  is_active: boolean
  config?: Record<string, unknown>
  created_at: string
  updated_at: string
}
