import time
import asyncio
import logging
from typing import Any, AsyncIterator, Dict, Iterator, List, Optional, Type, TypeVar
import httpx
from pydantic import BaseModel

from .auth.token_manager import TokenManager
from .exceptions import AuthError, ApiError, NetworkError

logger = logging.getLogger("imbrace")
T = TypeVar("T", bound=BaseModel)


def _is_jwt(token: str) -> bool:
    """Detect if a token is a JWT (3 dot-separated base64 parts, starts with eyJ).
    Legacy opaque tokens like 'login_acc_...' always return False.
    """
    parts = token.split(".")
    return len(parts) == 3 and token.startswith("eyJ")


class HttpTransport:
    """Synchronous HTTP Transport Layer for Imbrace SDK."""

    def __init__(
        self,
        token_manager: TokenManager,
        timeout: int = 30,
        api_key: Optional[str] = None,
        organization_id: Optional[str] = None,
    ):
        self.token_manager = token_manager
        self.timeout = timeout
        self.api_key = api_key
        self.organization_id = organization_id
        self._client = httpx.Client(
            timeout=timeout,
            limits=httpx.Limits(max_keepalive_connections=5, max_connections=10),
        )
        logger.debug("Initialized HttpTransport (sync)")

    def _auth_error(self, token: Optional[str]) -> AuthError:
        if self.api_key:
            return AuthError("Invalid or expired API key (x-api-key).")
        if token and self.organization_id and _is_jwt(token):
            return AuthError(
                "Invalid or expired JWT token (Authorization: Bearer) or organization_id not in token."
            )
        if token:
            return AuthError("Invalid or expired access token (x-access-token).")
        return AuthError(
            "No credentials provided — set access_token= (user login) or api_key= (server-to-server)."
        )

    def request(self, method: str, url: str, **kwargs) -> httpx.Response:
        retries = 0
        max_retries = 3

        headers = kwargs.pop("headers", {})
        token = self.token_manager.get_token()

        if self.api_key:
            # API Key mode: server-to-server, org resolved by gateway from key
            headers["x-api-key"] = self.api_key
        elif token and self.organization_id and _is_jwt(token):
            # JWT Bearer mode: auth-service JWT + org scope (only for real JWTs)
            headers["authorization"] = f"Bearer {token}"
            headers["x-organization-id"] = self.organization_id
        elif token:
            # Legacy access token mode (opaque tokens like login_acc_...)
            headers["x-access-token"] = token
            if self.organization_id:
                headers["x-organization-id"] = self.organization_id

        kwargs["headers"] = headers

        while True:
            try:
                logger.debug(f"Request: {method} {url}")
                res = self._client.request(method, url, **kwargs)

                if res.status_code < 400:
                    return res
                if res.status_code in [401, 403]:
                    logger.error(f"Auth error {res.status_code} at {url}")
                    raise self._auth_error(token)
                if (
                    res.status_code == 429 or res.status_code >= 500
                ) and retries < max_retries:
                    wait_time = 2**retries
                    logger.warning(
                        f"Retry {retries + 1}/{max_retries} after {wait_time}s due to status {res.status_code}"
                    )
                    retries += 1
                    time.sleep(wait_time)
                    continue

                logger.error(f"API Error {res.status_code}: {res.text}")
                raise ApiError(res.status_code, res.text)
            except httpx.RequestError as e:
                if retries < max_retries:
                    wait_time = 2**retries
                    logger.warning(
                        f"Retry {retries + 1}/{max_retries} after {wait_time}s due to network error: {str(e)}"
                    )
                    retries += 1
                    time.sleep(wait_time)
                    continue
                raise NetworkError(f"Network error or timeout: {str(e)}")

    def iterate_paged(
        self,
        method: str,
        url: str,
        model: Type[T],
        params: Optional[Dict[str, Any]] = None,
        **kwargs,
    ) -> Iterator[T]:
        """Iterate over all pages of a paginated endpoint, yielding one item at a time."""
        current_params = (params or {}).copy()
        if "page" not in current_params:
            current_params["page"] = 1

        while True:
            res = self.request(method, url, params=current_params, **kwargs).json()
            # Expected response shape: { data: [...], pagination: { has_next: bool } }
            data = res.get("data", [])
            for item in data:
                yield model(**item)

            pagination = res.get("pagination", {})
            if not pagination.get("has_next"):
                break
            current_params["page"] += 1

    def clear_api_key(self) -> None:
        self.api_key = None

    def close(self):
        self._client.close()


class AsyncHttpTransport:
    """Asynchronous HTTP Transport Layer for Imbrace SDK."""

    def __init__(
        self,
        token_manager: TokenManager,
        timeout: int = 30,
        api_key: Optional[str] = None,
        organization_id: Optional[str] = None,
    ):
        self.token_manager = token_manager
        self.timeout = timeout
        self.api_key = api_key
        self.organization_id = organization_id
        self._client = httpx.AsyncClient(
            timeout=timeout,
            limits=httpx.Limits(max_keepalive_connections=5, max_connections=10),
        )
        logger.debug("Initialized AsyncHttpTransport")

    def _auth_error(self, token: Optional[str]) -> AuthError:
        if self.api_key:
            return AuthError("Invalid or expired API key (x-api-key).")
        if token and self.organization_id and _is_jwt(token):
            return AuthError(
                "Invalid or expired JWT token (Authorization: Bearer) or organization_id not in token."
            )
        if token:
            return AuthError("Invalid or expired access token (x-access-token).")
        return AuthError(
            "No credentials provided — set access_token= (user login) or api_key= (server-to-server)."
        )

    async def request(self, method: str, url: str, **kwargs) -> httpx.Response:
        retries = 0
        max_retries = 3

        headers = kwargs.pop("headers", {})
        token = self.token_manager.get_token()

        if self.api_key:
            # API Key mode: server-to-server, org resolved by gateway from key
            headers["x-api-key"] = self.api_key
        elif token and self.organization_id and _is_jwt(token):
            # JWT Bearer mode: auth-service JWT + org scope (only for real JWTs)
            headers["authorization"] = f"Bearer {token}"
            headers["x-organization-id"] = self.organization_id
        elif token:
            # Legacy access token mode (opaque tokens like login_acc_...)
            headers["x-access-token"] = token
            if self.organization_id:
                headers["x-organization-id"] = self.organization_id

        kwargs["headers"] = headers

        while True:
            try:
                res = await self._client.request(method, url, **kwargs)
                if res.status_code < 400:
                    return res
                if res.status_code in [401, 403]:
                    raise self._auth_error(token)
                if (
                    res.status_code == 429 or res.status_code >= 500
                ) and retries < max_retries:
                    wait_time = 2**retries
                    retries += 1
                    await asyncio.sleep(wait_time)
                    continue
                raise ApiError(res.status_code, res.text)
            except httpx.RequestError as e:
                if retries < max_retries:
                    wait_time = 2**retries
                    retries += 1
                    await asyncio.sleep(wait_time)
                    continue
                raise NetworkError(f"Network error or timeout: {str(e)}")

    async def iterate_paged(
        self,
        method: str,
        url: str,
        model: Type[T],
        params: Optional[Dict[str, Any]] = None,
        **kwargs,
    ) -> AsyncIterator[T]:
        """Iterate over all pages of a paginated endpoint, yielding one item at a time (async)."""
        current_params = (params or {}).copy()
        if "page" not in current_params:
            current_params["page"] = 1

        while True:
            res = await self.request(method, url, params=current_params, **kwargs)
            body = res.json()
            data = body.get("data", [])
            for item in data:
                yield model(**item)

            pagination = body.get("pagination", {})
            if not pagination.get("has_next"):
                break
            current_params["page"] += 1

    def clear_api_key(self) -> None:
        self.api_key = None

    async def close(self):
        await self._client.aclose()
