from __future__ import annotations
from typing import List, Optional
from typing_extensions import TypedDict


class ImbraceApiKey(TypedDict):
    _id: str
    apiKey: str
    organization_id: str
    user_id: str
    is_active: bool
    expired_at: str
    created_at: str
    updated_at: str
    is_temp: bool


class ImbraceApiKeyResponse(TypedDict):
    apiKey: ImbraceApiKey
    expires_in: int


class SignInResponse(TypedDict):
    accessToken: str
    token: Optional[str]
    userId: Optional[str]
    email: Optional[str]


class SignUpInput(TypedDict, total=False):
    email: str
    password: str
    name: str
    organizationName: str


class SignUpResponse(TypedDict):
    userId: str
    email: str


class ForgotPasswordResponse(TypedDict):
    message: str


class LoginProvider(TypedDict):
    name: str
    type: str
    url: Optional[str]


class LoginProvidersResponse(TypedDict):
    providers: List[LoginProvider]


class OtpSignInResponse(TypedDict):
    token: str
    email: str
    expired_at: str


class ExchangeTokenResponse(TypedDict):
    access_token: str


class VerifySignUpResponse(TypedDict):
    verified: bool
    email: str


class AzureGroup(TypedDict):
    id: str
    displayName: str


class AzureGroupsResponse(TypedDict):
    groups: List[AzureGroup]


class OidcRoleMapping(TypedDict):
    _id: str
    role: str
    claim: str
    value: str


class OidcRoleMappingInput(TypedDict):
    role: str
    claim: str
    value: str


class GoogleAuthResponse(TypedDict):
    accessToken: str
    userId: str
    email: Optional[str]


class AwsMarketplaceResponse(TypedDict):
    customerId: str
    productCode: str
