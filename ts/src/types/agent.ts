export interface SupportedChannel {
  title: string
  icon: string
  _id?: string
}

export interface AgentTemplate {
  _id?: string
  object_name?: string
  id?: string
  doc_name: string
  title: string
  organization_id: string
  short_description: string
  type: string
  channel_id: string
  features: unknown[]
  tags: string[]
  demo_url: string
  suggestion_prompts: string[]
  supported_channels: SupportedChannel[]
  assistant_id?: string
  user_id?: string
  is_deleted: boolean
  how_it_works: unknown[]
  integrations: unknown[]
  public_id?: string
  created_at: string
  updated_at: string
}
