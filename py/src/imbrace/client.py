from __future__ import annotations
from typing import Optional, Union
import warnings

from .auth.token_manager import TokenManager
from .http import HttpTransport
from .environments import EnvironmentPreset, ServiceHosts, ENVIRONMENTS
from .service_registry import resolve_service_urls
from .resources.auth import AuthResource, SignInResponse, OtpSignInResponse
from .resources.account import AccountResource
from .resources.organizations import OrganizationsResource
from .resources.agent import AgentResource
from .resources.channel import ChannelResource
from .resources.conversations import ConversationsResource
from .resources.messages import MessagesResource
from .resources.contacts import ContactsResource
from .resources.teams import TeamsResource
from .resources.workflows import WorkflowsResource
from .resources.boards import BoardsResource
from .resources.settings import SettingsResource
from .resources.ai import AiResource
from .resources.marketplace import MarketplaceResource
from .resources.platform import PlatformResource
from .resources.ips import IpsResource
from .resources.health import HealthResource
from .resources.sessions import SessionsResource
from .resources.categories import CategoriesResource
from .resources.schedule import ScheduleResource
from .resources.campaigns import CampaignsResource
from .resources.data_files import DataFilesResource
from .resources.folders import FoldersResource
from .resources.outbounds import OutboundsResource
from .resources.message_suggestion import MessageSuggestionResource
from .resources.predict import PredictResource
from .resources.chat_ai import ChatAiResource
from .resources.file_service import FileServiceResource
from .resources.ai_agent import AiAgentResource
from .resources.document_ai import DocumentAIResource
from .resources.templates import TemplatesResource
from .resources.license import LicenseResource


class ImbraceClient:
    """Synchronous Imbrace SDK Client.

    Usage:
        # Develop environment
        client = ImbraceClient(env="develop", access_token="...")

        # Stable (default)
        client = ImbraceClient(api_key="sk-...")

        # Override a single service (e.g. local dev)
        client = ImbraceClient(env="develop", services={"data_board": "http://localhost:3001/data-board"})
    """

    def __init__(
        self,
        env: Optional[Union[str, EnvironmentPreset]] = None,
        gateway: Optional[str] = None,
        services: Optional[dict] = None,
        access_token: Optional[str] = None,
        api_key: Optional[str] = None,
        organization_id: Optional[str] = None,
        timeout: int = 30,
        check_health: bool = False,
        # Legacy compat - takes precedence over env if set
        base_url: Optional[str] = None,
    ):
        resolved_key = api_key
        resolved_env = env or "stable"
        resolved_gateway = base_url or gateway
        merged_services = services or {}

        # Resolve preset
        if resolved_gateway:
            env_name = resolved_env if isinstance(resolved_env, str) else "stable"
            preset = EnvironmentPreset(
                gateway=resolved_gateway.rstrip("/"),
                service_hosts=ENVIRONMENTS[env_name].service_hosts if env_name in ENVIRONMENTS else ServiceHosts(),
            )
        else:
            preset = resolved_env

        urls = resolve_service_urls(preset, merged_services)

        if not resolved_key and not access_token:
            warnings.warn(
                "ImbraceClient: no credentials provided. "
                "Pass access_token= (user login) or api_key= (server-to-server).",
                UserWarning,
                stacklevel=2,
            )

        self.token_manager = TokenManager(access_token)
        self.http = HttpTransport(
            token_manager=self.token_manager,
            timeout=timeout,
            api_key=resolved_key,
            organization_id=organization_id,
        )

        # Auth — platform service (${gw}/platform/v1/login/*, /access/*).
        # Moved off the legacy backend in v1.2; keep on platform for parity w/ TS.
        self.auth          = AuthResource(self.http, urls.platform, urls.gateway)
        self.account       = AccountResource(self.http, urls.platform)

        # Platform group
        self.platform      = PlatformResource(self.http, urls.platform)
        self.organizations = OrganizationsResource(self.http, urls.platform)
        self.teams         = TeamsResource(self.http, urls.platform)
        self.settings      = SettingsResource(self.http, urls.channel_service, urls.platform)

        # channel-service group
        self.channel       = ChannelResource(self.http, urls.channel_service)
        self.contacts      = ContactsResource(self.http, urls.channel_service)
        self.conversations = ConversationsResource(self.http, urls.channel_service)
        self.messages      = MessagesResource(self.http, urls.channel_service, urls.backend)
        self.categories    = CategoriesResource(self.http, urls.channel_service)

        # Workflows: backend (channel automation) + workflow_engine (flow engine)
        self.workflows     = WorkflowsResource(self.http, urls.backend, urls.workflow_engine, urls.channel_service)

        # Dedicated services
        self.boards        = BoardsResource(self.http, urls.data_board, urls.backend)
        self.ips           = IpsResource(self.http, urls.ips)
        self.ai            = AiResource(self.http, urls.ai)

        # Marketplace: standalone service + platform/v2 sub-paths
        self.marketplace   = MarketplaceResource(self.http, urls.marketplaces)

        # Use Case Templates — sibling to marketplaces under /v2/backend/
        self.templates     = TemplatesResource(self.http, f"{urls.gateway}/v2/backend/templates")

        # Agent templates + use-cases
        self.agent         = AgentResource(self.http, urls.marketplaces)

        # Gateway fallback
        self.health        = HealthResource(self.http, urls.gateway)
        self.sessions      = SessionsResource(self.http, urls.gateway)
        self.schedule      = ScheduleResource(self.http, urls.ips)
        self.campaign      = CampaignsResource(self.http, urls.channel_service)
        self.data_files    = DataFilesResource(self.http, urls.data_board)
        self.folders       = FoldersResource(self.http, urls.data_board)
        self.outbound          = OutboundsResource(self.http, urls.channel_service)
        self.message_suggestion = MessageSuggestionResource(self.http, urls.message_suggestion)
        self.predict           = PredictResource(self.http, urls.predict)

        # New services
        self.chat_ai       = ChatAiResource(self.http, f"{urls.ai}/v3/ai")
        self.file_service  = FileServiceResource(self.http, urls.file_service)
        self.ai_agent      = AiAgentResource(self.http, urls.ai_agent)
        self.document_ai         = DocumentAIResource(
            self.http, f"{urls.ai}/v3/ai",
            boards=self.boards, templates=self.templates,
        )
        self.license       = LicenseResource(self.http, urls.gateway)

        if check_health:
            self.init()


        if check_health:
            self.init()

    # -- Convenience auth ------------------------------------------------------

    def login(self, email: str, password: str) -> dict:
        """Sign in with email and password.

        Uses the membership-scoped ``/login/authenticate`` flow: stores the
        returned short-lived ``login_acc_`` token and returns
        ``{ ...res, organizations }`` where every org is one the user belongs to
        (and is exchangeable). Call :meth:`select_organization` next to swap the
        token for an org-scoped ``acc_`` token.
        """
        res = self.auth.authenticate(email=email, password=password)
        token = res.get("accessToken") or res.get("token") or res.get("access_token")
        if token:
            self.set_access_token(token)
        if not isinstance(res.get("organizations"), list):
            res["organizations"] = []
        return res

    def login_with_otp(self, email: str, otp: str) -> dict:
        """Sign in with an OTP code (call request_otp() first). See :meth:`login`."""
        res = self.auth.authenticate(email=email, otp=otp)
        token = res.get("accessToken") or res.get("token") or res.get("access_token")
        if token:
            self.set_access_token(token)
        if not isinstance(res.get("organizations"), list):
            res["organizations"] = []
        return res

    def select_organization(self, organization_id: str) -> None:
        """Exchange the current ``login_acc_`` token for an org-scoped ``acc_`` token.

        After this, requests carry ``x-organization-id`` and the new token.
        """
        prev_org = self.http.organization_id
        self.http.organization_id = organization_id
        try:
            res = self.auth.exchange_access_token(organization_id)
            new_token = res.get("token") or res.get("access_token")
            if not isinstance(new_token, str):
                raise RuntimeError("exchange_access_token: response missing token")
            self.token_manager.set_token(new_token)
        except Exception:
            self.http.organization_id = prev_org
            raise

    def request_otp(self, email: str) -> None:
        """Send a one-time password to the given email address."""
        self.auth.signin_email_request(email)

    def set_access_token(self, token: str) -> None:
        self.token_manager.set_token(token)
        self.http.clear_api_key()

    def clear_access_token(self) -> None:
        self.token_manager.clear()

    def init(self) -> None:
        self.health.check()

    def close(self) -> None:
        self.http.close()

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        self.close()
