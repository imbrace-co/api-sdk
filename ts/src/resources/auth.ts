import { HttpTransport } from "../http.js"

export interface ThirdPartyTokenResponse {
  apiKey: {
    _id: string
    apiKey: string
    organization_id: string
    user_id: string
    is_active: boolean
    expired_at: string
    created_at: string
    updated_at: string
    is_temp: boolean
  }
  expires_in: number
}

export interface SignInResponse {
  accessToken: string
  token?: string
  userId?: string
  email?: string
  [key: string]: unknown
}

/**
 * An org the authenticated user is actually a MEMBER of, as returned by
 * `/v1/login/authenticate`. Unlike the global `/v1/organizations` list, every
 * entry here is exchangeable via `selectOrganization` — same membership scope
 * the token-exchange enforces.
 */
export interface OrganizationMembership {
  organization_id: string
  display_name: string
  icon_url?: string | null
  is_paid?: boolean
  is_active?: boolean
  role?: string
  is_admin?: boolean
  status?: string
  display_name_user?: string
  avatar_url?: string
  [key: string]: unknown
}

export interface AuthenticateInput {
  email: string
  password?: string
  otp?: string
  provider_type?: string
  name?: string
  provider_id?: string
}

export interface AuthenticateResponse extends SignInResponse {
  /** Orgs the user is a member of (membership-scoped, all exchangeable). */
  organizations: OrganizationMembership[]
  user_id?: string
}

export interface SignUpInput {
  email: string
  password: string
  name: string
  organizationName?: string
}

export interface SignUpResponse {
  userId: string
  email: string
}

export interface ForgotPasswordResponse {
  message: string
}

export interface LoginProvider {
  name: string
  type: string
  url?: string
}

export interface LoginProvidersResponse {
  providers: LoginProvider[]
}

export interface SigninSSOInput {
  code: string
  state?: string
  redirectUri?: string
}

export interface SSOResponse {
  accessToken: string
  userId: string
}

export interface ExchangeAccessTokenWithTokenInput {
  token: string
  organization_id?: string
}

export interface SigninWithIdentityInput {
  identity_token: string
  provider: string
}

export interface VerifySignUpResponse {
  verified: boolean
  email: string
}

export interface AzureGroup {
  id: string
  displayName: string
}

export interface AzureGroupsResponse {
  groups: AzureGroup[]
}

export interface OidcRoleMapping {
  _id: string
  role: string
  claim: string
  value: string
}

export interface OidcRoleMappingInput {
  role: string
  claim: string
  value: string
}

export interface BulkUpdateOidcInput {
  mappings: OidcRoleMappingInput[]
}

export interface GoogleAuthInput {
  id_token: string
  access_token?: string
}

export interface GoogleAuthResponse {
  accessToken: string
  userId: string
  email?: string
}

export interface EmailIdentityInput {
  email: string
  password?: string
  otp?: string
}

export interface AwsMarketplaceInput {
  registrationToken: string
}

export interface AwsMarketplaceResponse {
  customerId: string
  productCode: string
}

export class AuthResource {
  constructor(
    private readonly http: HttpTransport,
    private readonly base: string,
    private readonly gateway: string,
  ) {}

  private get v1() { return `${this.base}/v1` }

  // ─── Third-party token  

  async getThirdPartyToken(expirationDays: number = 10): Promise<ThirdPartyTokenResponse> {
    return this.http
      .getFetch()(`${this.gateway}/private/backend/v1/third_party_token`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ expirationDays }),
      })
      .then((r) => r.json())
  }

  // ─── Login  

  async signinEmailRequest(email: string): Promise<void> {
    await this.http.getFetch()(`${this.v1}/login/_signin_email_request`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    })
  }

  async signinWithEmail(email: string, otp: string): Promise<{ token: string; email: string; expired_at: string }> {
    return this.http.getFetch()(`${this.v1}/login/_signin_with_email`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, otp }),
    }).then(r => r.json())
  }

  async signIn(body: { email: string; password: string }): Promise<SignInResponse> {
    return this.http.getFetch()(`${this.v1}/login/sign_in`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }).then(r => r.json())
  }

  /**
   * Sign in (password, OTP, or social) and get back the `login_acc_` token
   * AND the user's MEMBER organizations in one call. Prefer this over
   * `signIn` + `organizations.list()` for the login → org-picker flow: the
   * returned `organizations` are membership-scoped, so every one is
   * exchangeable. (The standalone `/v1/organizations` list is global and
   * includes orgs the user can't enter — see `organizations.listForLogin`.)
   */
  async authenticate(body: AuthenticateInput): Promise<AuthenticateResponse> {
    const res = await this.http.getFetch()(`${this.v1}/login/authenticate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }).then(r => r.json()) as AuthenticateResponse
    if (!Array.isArray(res?.organizations)) res.organizations = []
    return res
  }

  async signUp(body: SignUpInput): Promise<SignUpResponse> {
    return this.http.getFetch()(`${this.v1}/login/sign_up`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }).then(r => r.json())
  }

  async forgotPassword(email: string): Promise<ForgotPasswordResponse> {
    const url = new URL(`${this.v1}/login/forget`)
    url.searchParams.set("email", email)
    return this.http.getFetch()(url, { method: "GET" }).then(r => r.json())
  }

  async resetPassword(body: { token: string; password: string }): Promise<ForgotPasswordResponse> {
    return this.http.getFetch()(`${this.v1}/login/forget/reset`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }).then(r => r.json())
  }

  async getLoginProviders(): Promise<LoginProvidersResponse> {
    return this.http.getFetch()(`${this.v1}/login/providers`, { method: "GET" }).then(r => r.json())
  }

  async signinSSO(body: SigninSSOInput): Promise<SSOResponse> {
    return this.http.getFetch()(`${this.v1}/sso/login-success`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }).then(r => r.json())
  }

  // ─── Access token   

  async exchangeAccessToken(organization_id: string): Promise<{ token: string; refresh_token: string }> {
    return this.http.getFetch()(`${this.v1}/access/_exchange_access_token`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ organization_id }),
    }).then(r => r.json())
  }

  async exchangeAccessTokenWithToken(body: ExchangeAccessTokenWithTokenInput): Promise<{ access_token: string }> {
    return this.http.getFetch()(`${this.v1}/access/_exchange_access_token_with_access_token`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }).then(r => r.json())
  }

  async signinWithIdentity(body: SigninWithIdentityInput): Promise<SignInResponse> {
    return this.http.getFetch()(`${this.v1}/access/_signin_with_identity`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }).then(r => r.json())
  }

  // ─── Sign-up verification   

  async verifySignUpCheck(email: string): Promise<VerifySignUpResponse> {
    const url = new URL(`${this.v1}/login/sign_up/verify/check`)
    url.searchParams.set("email", email)
    return this.http.getFetch()(url, { method: "GET" }).then(r => r.json())
  }

  async resendVerificationEmail(email: string): Promise<{ message: string }> {
    const url = new URL(`${this.v1}/login/sign_up/verify/resend`)
    url.searchParams.set("email", email)
    return this.http.getFetch()(url, { method: "GET" }).then(r => r.json())
  }

  async uploadSignUpPhoto(body: FormData): Promise<{ url: string }> {
    return this.http.getFetch()(`${this.v1}/login/sign_in/file_up_load`, {
      method: "POST",
      body,
    }).then(r => r.json())
  }

  // ─── SSO / Azure AD   

  async getAzureGroups(): Promise<AzureGroupsResponse> {
    return this.http.getFetch()(`${this.v1}/sso/azure_ad/groups/all`, { method: "GET" }).then(r => r.json())
  }

  // ─── OIDC Role Mappings   

  async listOidcRoleMappings(): Promise<OidcRoleMapping[]> {
    return this.http.getFetch()(`${this.v1}/oidc_role_mappings`, { method: "GET" }).then(r => r.json())
  }

  async createOidcRoleMapping(body: OidcRoleMappingInput): Promise<OidcRoleMapping> {
    return this.http.getFetch()(`${this.v1}/oidc_role_mappings`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }).then(r => r.json())
  }

  async bulkUpdateOidcRoleMappings(body: BulkUpdateOidcInput): Promise<OidcRoleMapping[]> {
    return this.http.getFetch()(`${this.v1}/oidc_role_mappings/bulk`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }).then(r => r.json())
  }

  // ─── Identity   

  async signupWithGoogle(body: GoogleAuthInput): Promise<GoogleAuthResponse> {
    return this.http.getFetch()(`${this.v1}/identity/_signup_google`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }).then(r => r.json())
  }

  async signinWithGoogle(body: GoogleAuthInput): Promise<GoogleAuthResponse> {
    return this.http.getFetch()(`${this.v1}/identity_access/_signin_google`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }).then(r => r.json())
  }

  async signupWithEmail(body: EmailIdentityInput): Promise<SignUpResponse> {
    return this.http.getFetch()(`${this.v1}/identity/_signup_email`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }).then(r => r.json())
  }

  async signinWithEmailIdentity(body: EmailIdentityInput): Promise<SignInResponse> {
    return this.http.getFetch()(`${this.v1}/identity_access/_signin_email`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }).then(r => r.json())
  }

  // ─── AWS Marketplace  

  async resolveAwsMarketplaceCustomer(body: AwsMarketplaceInput): Promise<AwsMarketplaceResponse> {
    return this.http.getFetch()(`${this.v1}/aws_marketplace/resolve-customer`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }).then(r => r.json())
  }
}
