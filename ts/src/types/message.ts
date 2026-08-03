export type MessageType = "text" | "image" | "quick_reply" | "file" | "pdf"

export interface MessageContent {
  text?: string
  url?: string
  caption?: string
  title?: string
  payload?: string
}

export interface ConversationMessage {
  object_name: "message"
  id: string
  organization_id: string
  business_unit_id: string
  conversation_id: string
  from: string
  type: MessageType
  content: MessageContent
  created_at: string
  updated_at: string
}
