import type { ChannelType } from "./channel.js"

export interface SimpleUser {
  object_name: "simple_user"
  id: string
  display_name: string
  avatar_url: string
}

export interface Conversation {
  object_name: "conversation"
  id: string
  organization_id: string
  business_unit_id: string
  channel_id: string
  channel_type: ChannelType
  contact_id: string
  status: string
  name: string
  timestamp: string
  users: SimpleUser[]
}
