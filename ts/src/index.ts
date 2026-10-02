// Main Client Entry
export * from "./client.js"

// Environment & Service Discovery
export * from "./environments.js"
export * from "./service-registry.js"

// Types (Unified Models)
export * from "./types/index.js"

// Resource input/output types added in 1.5.2
export type * from "./resources/document-models.js"
export type * from "./resources/crm-automation.js"
export type * from "./resources/api-keys.js"
export type * from "./resources/roles.js"
export type * from "./resources/audit-logs.js"
export type { CreateSchedulerInput, SchedulerJob } from "./resources/schedule.js"
export type { McpServerTool, UpdateMcpServerInput } from "./resources/workflows.js"
export type { ToolServerConfig } from "./resources/chat-ai.js"
export type { CreateContactInput } from "./resources/contacts.js"
export type { MarketplaceApp, AppInstall, InstallTeamDefaultsInput, InstallTeamDefaultsResult } from "./resources/marketplace.js"
export type { DriveType, DriveProvider, DriveSessionStatus } from "./resources/boards.js"

// Errors (For error handling)
export * from "./errors.js"

// Generated API surface — every agent-tools operation + the OPERATIONS registry
// (which is what the MCP server builds its tool list from).
export * from "./generated/index.js"
