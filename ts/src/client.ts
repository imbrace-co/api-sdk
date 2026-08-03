export * from "./errors.js"
export * from "./types/index.js"
export * from "./environments.js"
export * from "./service-registry.js"

import { type Environment, type EnvironmentPreset, ENVIRONMENTS } from "./environments.js"
import { resolveServiceUrls, type ServiceUrls } from "./service-registry.js"
import { TokenManager } from "./auth/token-manager.js"
import { HttpTransport } from "./http.js"
import { GeneratedApi } from "./generated/index.js"
import { AuthResource } from "./resources/auth.js"
import { AccountResource } from "./resources/account.js"
import { OrganizationsResource } from "./resources/organizations.js"
import { AgentResource } from "./resources/agent.js"
import { AiResource } from "./resources/ai.js"
import { ChannelResource } from "./resources/channel.js"
import { ConversationsResource } from "./resources/conversations.js"
import { MessagesResource } from "./resources/messages.js"
import { ContactsResource } from "./resources/contacts.js"
import { TeamsResource } from "./resources/teams.js"
import { WorkflowsResource } from "./resources/workflows.js"
import { BoardsResource } from "./resources/boards.js"
import { SettingsResource } from "./resources/settings.js"
import { HealthResource } from "./resources/health.js"
import { IpsResource } from "./resources/ips.js"
import { MarketplaceResource } from "./resources/marketplace.js"
import { PlatformResource } from "./resources/platform.js"
import { SessionsResource } from "./resources/sessions.js"
import { CategoriesResource } from "./resources/categories.js"
import { ScheduleResource } from "./resources/schedule.js"
import { CampaignResource } from "./resources/campaign.js"
import { OutboundResource } from "./resources/outbound.js"
import { LicenseResource } from "./resources/license.js"
import { ChatAiResource } from "./resources/chat-ai.js"
import { FileServiceResource } from "./resources/file-service.js"
import { MessageSuggestionResource } from "./resources/message-suggestion.js"
import { PredictResource } from "./resources/predict.js"
import { AiAgentResource } from "./resources/ai-agent.js"
import { DocumentAIResource } from "./resources/document-ai.js"
import { TemplatesResource } from "./resources/templates.js"

export interface ImbraceClientConfig {

  env?: Environment
  baseUrl?: string
  services?: Partial<ServiceUrls>
  apiKey?: string
  accessToken?: string
  organizationId?: string
  timeout?: number
  checkHealth?: boolean
}

/** Extract apiKey from the response of the third-party token endpoint. */
export function extractApiKey(res: { apiKey: { apiKey: string } }): string {
  return res.apiKey.apiKey
}

export class ImbraceClient {
  private readonly tokenManager: TokenManager
  private readonly http: HttpTransport
  private readonly opts: ImbraceClientConfig
  private healthChecked = false

  public readonly auth: AuthResource
  public readonly account: AccountResource
  public readonly organizations: OrganizationsResource
  public readonly agent: AgentResource
  public readonly ai: AiResource
  public readonly channel: ChannelResource
  public readonly conversations: ConversationsResource
  public readonly messages: MessagesResource
  public readonly contacts: ContactsResource
  public readonly teams: TeamsResource
  public readonly workflows: WorkflowsResource
  public readonly boards: BoardsResource
  public readonly settings: SettingsResource
  public readonly health: HealthResource
  public readonly ips: IpsResource
  public readonly marketplace: MarketplaceResource
  public readonly platform: PlatformResource
  public readonly sessions: SessionsResource
  public readonly categories: CategoriesResource
  public readonly schedule: ScheduleResource
  public readonly campaign: CampaignResource
  public readonly outbound: OutboundResource
  public readonly license: LicenseResource
  public readonly chatAi: ChatAiResource
  public readonly fileService: FileServiceResource
  public readonly messageSuggestion: MessageSuggestionResource
  public readonly predict: PredictResource
  public readonly aiAgent: AiAgentResource
  public readonly documentAi: DocumentAIResource
  public readonly templates: TemplatesResource

  /**
   * Every operation the services expose to agents (273 across 5 services),
   * generated from their `agent-tools` OpenAPI specs — `client.api.dataBoard`,
   * `.channel`, `.platform`, `.marketplace`, `.workflow`.
   *
   * Complete and always in sync with the specs, but responses are untyped (the
   * specs declare no response schemas), so pass a type argument when you know
   * the shape. The hand-written resources above cover the common paths with
   * real response types and remain the first choice; reach for `api` for
   * anything they don't have, instead of hand-rolling a fetch.
   */
  public readonly api: GeneratedApi

  constructor(opts?: ImbraceClientConfig) {
    this.opts = opts ?? {}

    const mergedServices = opts?.services ?? {}

    // -- Resolve environment & service URLs ----------------------------------
    const envName = opts?.env ?? 'stable'
    const gatewayOverride = opts?.baseUrl

    const basePreset: Environment | EnvironmentPreset = gatewayOverride
      ? { ...ENVIRONMENTS[envName], gateway: gatewayOverride }
      : envName

    const urls = resolveServiceUrls(basePreset, mergedServices)

    const resolvedApiKey = opts?.apiKey

    // -- Warn when no credentials ---------------------------------------------
    if (!resolvedApiKey && !opts?.accessToken) {
      console.warn(
        '[ImbraceClient] No credentials provided. ' +
        'Pass accessToken= (user login) or apiKey= (server-to-server).'
      )
    }

    // -- HTTP Transport -------------------------------------------------------

    this.tokenManager = new TokenManager(opts?.accessToken)
    this.http = new HttpTransport({
      apiKey:         resolvedApiKey,
      timeout:        opts?.timeout ?? 30000,
      tokenManager:   this.tokenManager,
      organizationId: opts?.organizationId,
    })

    // -- Wire resources with per-service base URLs ----------------------------

    // platform-service: account, users, orgs, teams, apps, business units, …
    this.account       = new AccountResource(this.http, urls.platform)
    this.platform      = new PlatformResource(this.http, urls.platform)
    this.organizations = new OrganizationsResource(this.http, urls.platform)
    this.teams         = new TeamsResource(this.http, urls.platform)
    this.settings      = new SettingsResource(this.http, urls.channelService, urls.platform)

    // channel-service: channel, contacts, conversations, messages, categories, campaign, outbound
    this.channel       = new ChannelResource(this.http, urls.channelService)
    this.contacts      = new ContactsResource(this.http, urls.channelService)
    this.conversations = new ConversationsResource(this.http, urls.channelService)
    this.messages      = new MessagesResource(this.http, urls.channelService, urls.backend)
    this.categories    = new CategoriesResource(this.http, urls.channelService)
    this.campaign      = new CampaignResource(this.http, urls.channelService)
    this.outbound      = new OutboundResource(this.http, urls.channelService)

    // data-board: boards / items / fields
    this.boards        = new BoardsResource(this.http, urls.dataBoard, urls.backend)

    // file-service
    this.fileService   = new FileServiceResource(this.http, urls.fileService)

    // marketplace + agent (templates + use-cases)
    this.marketplace   = new MarketplaceResource(this.http, urls.marketplaces, urls.gateway)
    this.agent         = new AgentResource(this.http, urls.marketplaces)
    // TODO: templates is currently still served by legacy backend at /v2/backend/templates;
    // marketplace service exposes /market-places/templates (different surface) — needs API audit.
    this.templates     = new TemplatesResource(this.http, `${urls.gateway}/v2/backend/templates`)

    // ips + scheduling
    this.ips           = new IpsResource(this.http, urls.ips)
    this.schedule      = new ScheduleResource(this.http, urls.ips)

    // ai-service-v2 / chat-ai / document-ai
    this.ai            = new AiResource(this.http, urls.ai)
    this.chatAi        = new ChatAiResource(this.http, `${urls.ai}/v3/ai`)
    this.documentAi    = new DocumentAIResource(
      this.http, `${urls.ai}/v3/ai`,
      { boards: this.boards, templates: this.templates },
    )

    // ai-agent / message-suggestion / predict
    this.aiAgent           = new AiAgentResource(this.http, urls.aiAgent)
    this.messageSuggestion = new MessageSuggestionResource(this.http, urls.messageSuggestion)
    this.predict           = new PredictResource(this.http, urls.predict)

    // workflow-engine (activepieces); pass channel-service for channel_automation
    this.workflows     = new WorkflowsResource(this.http, urls.backend, urls.workflowEngine, urls.channelService)

    // Legacy backend: auth signin and anything not yet split out
    this.auth          = new AuthResource(this.http, urls.platform, urls.gateway)

    // Gateway root: health / license / sessions
    this.health        = new HealthResource(this.http, urls.gateway)
    this.license       = new LicenseResource(this.http, urls.gateway)
    this.sessions      = new SessionsResource(this.http, urls.gateway)

    // Generated surface — every agent-tools operation, one method each.
    // These are where each service's spec paths actually resolve on the gateway,
    // which is not always `urls.<service>` verbatim: channel and platform mount
    // their spec under a `/v1` the ServiceUrls entry omits, and marketplace's
    // export is v3 — a different API from the v2 `urls.marketplaces`, not an
    // alias of it (the gateway rewrites the version into the upstream path).
    this.api = new GeneratedApi(this.http, {
      dataBoard:   urls.dataBoard,
      channel:     `${urls.channelService}/v1`,
      platform:    `${urls.platform}/v1`,
      marketplace: urls.marketplacesV3,
      workflow:    urls.workflowEngine,
    })
    }
  // -- Convenience auth ------------------------------------------------------

  /**
   * Sign in with email/password. Stores the returned `login_acc_` token and
   * (best-effort) fetches the user's organizations so the caller can show a
   * picker without a second SDK call.
   *
   * After picking one, call `selectOrganization(orgId)` to swap the
   * `login_acc_` token for an org-scoped `acc_` token.
   */
  public async login(email: string, password: string): Promise<Record<string, unknown>> {
    const res = await this.auth.authenticate({ email, password })
    const token = (res as any).accessToken
      ?? (res as any).token
      ?? (res as any).access_token
    if (typeof token === 'string') this.tokenManager.setToken(token)
    // `organizations` here are membership-scoped (from /login/authenticate),
    // so every entry is exchangeable via selectOrganization().
    return { ...(res as any), organizations: res.organizations ?? [] }
  }

  /** Sign in with an OTP (after calling requestOtp) and store the returned access token. */
  public async loginWithOtp(email: string, otp: string): Promise<Record<string, unknown>> {
    const res = await this.auth.authenticate({ email, otp })
    const token = (res as any).accessToken
      ?? (res as any).token
      ?? (res as any).access_token
    if (typeof token === 'string') this.tokenManager.setToken(token)
    return { ...(res as any), organizations: res.organizations ?? [] }
  }

  /**
   * Exchange the current `login_acc_` token for an org-scoped `acc_` token.
   * Subsequent calls go out with `x-access-token: acc_...` and `x-organization-id`.
   */
  public async selectOrganization(organizationId: string): Promise<void> {
    // Exchange endpoint requires x-organization-id on the request itself.
    this.http.setOrganizationId(organizationId)
    try {
      const res = await this.auth.exchangeAccessToken(organizationId)
      const newToken = (res as any).token ?? (res as any).access_token
      if (typeof newToken !== 'string') {
        throw new Error('exchangeAccessToken: response missing token')
      }
      this.tokenManager.setToken(newToken)
    } catch (err) {
      // Roll back the org id so the client isn't left in a half-switched state.
      this.http.setOrganizationId(this.opts.organizationId)
      throw err
    }
  }

  /** Send an OTP to the given email. Call before loginWithOtp(). */
  public async requestOtp(email: string): Promise<void> {
    await this.auth.signinEmailRequest(email)
  }

  public setAccessToken(token: string): void {
    this.tokenManager.setToken(token)
    this.http.clearApiKey() // Explicit setAccessToken switches off api_key mode
  }

  public clearAccessToken(): void {
    this.tokenManager.clear()
  }

  public async init(): Promise<void> {
    if (this.opts.checkHealth && !this.healthChecked) {
      await this.health.check()
      this.healthChecked = true
    }
  }
}

export function createImbraceClient(config?: ImbraceClientConfig): ImbraceClient {
  return new ImbraceClient(config)
}
