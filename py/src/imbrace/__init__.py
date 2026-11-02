from .client import ImbraceClient
from .async_client import AsyncImbraceClient
from .exceptions import ImbraceError, AuthError, ApiError, NetworkError, DataIqError
from .api_key import ImbraceApiKey, ImbraceApiKeyResponse, extract_api_key
from .environments import Environment, EnvironmentPreset, ENVIRONMENTS
from .service_registry import ServiceUrls, resolve_service_urls
from .resources.a2a import (
    A2AClient,
    AsyncA2AClient,
    agent_card_url,
    extract_a2a_text,
    text_message,
)

__all__ = [
    # Clients
    "ImbraceClient",
    "AsyncImbraceClient",
    # Errors
    "ImbraceError", "AuthError", "ApiError", "NetworkError", "DataIqError",
    # API Key helpers
    "ImbraceApiKey", "ImbraceApiKeyResponse", "extract_api_key",
    # Environment / ServiceRegistry
    "Environment", "EnvironmentPreset", "ENVIRONMENTS",
    "ServiceUrls", "resolve_service_urls",
    # Agent-to-Agent (A2A)
    "A2AClient", "AsyncA2AClient", "agent_card_url", "extract_a2a_text", "text_message",
]
__version__ = "1.0.0"
