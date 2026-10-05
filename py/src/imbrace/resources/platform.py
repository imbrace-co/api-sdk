import json
import re
from typing import Any, Dict, List, NoReturn, Optional

from ..http import HttpTransport, AsyncHttpTransport
from .retired import NO_REPLACEMENT, retired, unwrap_data

_RETIRED = "its route was removed when the legacy backend was retired"


def _retire(method: str, hint: str = NO_REPLACEMENT) -> NoReturn:
    retired(f"platform.{method}", _RETIRED, hint)


def _channel_service_base(base: str, channel_service: Optional[str]) -> str:
    return (channel_service or re.sub(r"/platform/?$", "/channel-service", base)).rstrip("/")


def team_list_params(
    default_type: str,
    q: str,
    type: Optional[str] = None,
    limit: Optional[int] = None,
    skip: Optional[int] = None,
    search: Optional[str] = None,
    sort: Optional[str] = None,
) -> Dict[str, Any]:
    """Query for a teams / team_users list; platform-service rejects the call without ``type`` + ``q``."""
    params: Dict[str, Any] = {"type": type or default_type, "q": q}
    if limit is not None:
        params["limit"] = limit
    if skip is not None:
        params["skip"] = skip
    if search:
        params["search"] = search
    if sort:
        params["sort"] = sort
    return params


def add_team_users_body(
    team_id: str,
    users: Optional[List[Dict[str, str]]] = None,
    user_ids: Optional[List[str]] = None,
    role: Optional[str] = None,
    reserve_leave: Optional[bool] = None,
) -> Dict[str, Any]:
    """platform-service expects ``users: [{user_id, role}]``; ``user_ids`` is accepted as a shorthand."""
    if users is None:
        users = [{"user_id": uid, "role": role or "member"} for uid in (user_ids or [])]
    body: Dict[str, Any] = {"team_id": team_id, "users": users}
    if reserve_leave is not None:
        body["reserve_leave"] = reserve_leave
    return body


def _add_team_users_from_dict(body: Dict[str, Any]) -> Dict[str, Any]:
    return add_team_users_body(
        body["team_id"],
        users=body.get("users"),
        user_ids=body.get("user_ids"),
        role=body.get("role"),
        reserve_leave=body.get("reserve_leave"),
    )


def json_or_success(text: str) -> Dict[str, Any]:
    """platform-service answers some deletes with 200 and an empty body."""
    return json.loads(text) if text else {"success": True}


def _team_labels(res: Any) -> Any:
    if isinstance(res, list):
        return res
    if isinstance(res, dict):
        return res.get("items") or res.get("data") or res
    return res


def _merge_credential_types(res: Any) -> List[Dict[str, Any]]:
    """The service groups credential types as ``{channel, integration}``; return one list."""
    if isinstance(res, list):
        return res
    res = res or {}
    return [*(res.get("channel") or []), *(res.get("integration") or [])]


class PlatformResource:
    """Platform domain — Sync. Users, Orgs, Teams, permissions.

    Contacts, credentials and channel init moved from the retired backend to
    channel-service; methods whose route was removed raise :class:`ImbraceError`.

    @param base            - platform base URL (``{gateway}/platform``)
    @param channel_service - channel-service base URL (``{gateway}/channel-service``)
    """

    def __init__(self, http: HttpTransport, base: str, channel_service: Optional[str] = None):
        self._http = http
        self._base = base.rstrip("/")
        self._channel_service = _channel_service_base(self._base, channel_service)

    @property
    def _v1(self) -> str:
        return f"{self._base}/v1"

    @property
    def _v2(self) -> str:
        return f"{self._base}/v2"

    @property
    def _cs(self) -> str:
        return f"{self._channel_service}/v1"

    # --- Users ---
    def list_users(self, params: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        return self._http.request("GET", f"{self._v1}/users", params=params or {}).json()

    def get_user(self, user_id: str) -> Dict[str, Any]:
        return self._http.request("GET", f"{self._v1}/users/{user_id}").json()

    def get_me(self) -> Dict[str, Any]:
        return self._http.request("GET", f"{self._v1}/users/_me").json()

    def update_user(self, user_id: str, body: Dict[str, Any]) -> Dict[str, Any]:
        return self._http.request("PUT", f"{self._v1}/users/{user_id}", json=body).json()

    def change_role(self, body: Dict[str, Any]) -> Dict[str, Any]:
        return self._http.request("POST", f"{self._v1}/users/_change_role", json=body).json()

    def archive_user(self, user_id: str) -> Dict[str, Any]:
        """Deprecated — raises. Use :meth:`deactivate_user`."""
        _retire("archive_user", "Use platform.deactivate_user() instead.")

    def reactivate_user(self, user_id: str) -> Dict[str, Any]:
        return self._http.request("POST", f"{self._v1}/users/_reactivate", json={"user_id": user_id}).json()

    def suspend_user(self, user_id: str) -> Dict[str, Any]:
        """Deprecated — raises. Use :meth:`deactivate_user`."""
        _retire("suspend_user", "Use platform.deactivate_user() instead.")

    def deactivate_user(self, user_id: str) -> Dict[str, Any]:
        return self._http.request("POST", f"{self._v1}/users/_deactivate", json={"user_id": user_id}).json()

    def list_all_users(self, params: Optional[Dict[str, str]] = None) -> Dict[str, Any]:
        return self._http.request("GET", f"{self._v1}/users/_all", params=params or {}).json()

    def bulk_invite(self, body: Dict[str, Any]) -> Dict[str, Any]:
        return self._http.request("POST", f"{self._v1}/users/_bulk_invite", json=body).json()

    def upload_user_avatar(self, files: Any) -> Dict[str, Any]:
        """Upload the caller's own avatar — ``POST /platform/v1/account/_fileupload``."""
        return self._http.request("POST", f"{self._v1}/account/_fileupload", files=files).json()

    def get_user_workflows(self, user_id: str) -> Dict[str, Any]:
        """Deprecated — raises."""
        _retire("get_user_workflows")

    def delete_user(self, user_id: str) -> Dict[str, Any]:
        return self._http.request("DELETE", f"{self._v1}/users/{user_id}").json()

    # --- Organizations ---
    def list_orgs(self, params: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        return self._http.request("GET", f"{self._v2}/organizations", params=params or {}).json()

    def list_all_orgs(self, params: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """Lists the caller's organizations. Needs a user access token; API keys are rejected (401)."""
        return self._http.request("GET", f"{self._v2}/organizations/_all", params=params or {}).json()

    def get_org(self, org_id: str) -> Dict[str, Any]:
        return self._http.request("GET", f"{self._v1}/organizations/{org_id}").json()

    def create_org(self, body: Dict[str, Any]) -> Dict[str, Any]:
        return self._http.request("POST", f"{self._v1}/organizations", json=body).json()

    def update_org(self, org_id: str, body: Dict[str, Any]) -> Dict[str, Any]:
        return self._http.request("PATCH", f"{self._v1}/organizations/{org_id}", json=body).json()

    def delete_org(self, org_id: str) -> Dict[str, Any]:
        return self._http.request("DELETE", f"{self._v1}/organizations/{org_id}").json()

    def create_aws_org(self, body: Dict[str, Any]) -> Dict[str, Any]:
        return self._http.request("POST", f"{self._v1}/organizations/aws", json=body).json()

    # --- Teams ---
    def list_teams(self, q: str, type: Optional[str] = None, limit: Optional[int] = None,
                   skip: Optional[int] = None, search: Optional[str] = None) -> Dict[str, Any]:
        """Teams of a business unit.

        platform-service requires the business unit id as ``q`` (with
        ``type="business_unit_id"``, the default). Returns the platform list
        envelope (``count`` is the grand total, ``total`` the page size).
        """
        params = team_list_params("business_unit_id", q, type, limit, skip, search)
        return self._http.request("GET", f"{self._v2}/teams", params=params).json()

    def get_my_teams(self) -> Dict[str, Any]:
        return self._http.request("GET", f"{self._v2}/teams/my").json()

    def create_team(self, body: Dict[str, Any]) -> Dict[str, Any]:
        return self._http.request("POST", f"{self._v1}/teams", json=body).json()

    def update_team(self, team_id: str, body: Dict[str, Any]) -> Dict[str, Any]:
        return self._http.request("PUT", f"{self._v2}/teams/{team_id}", json=body).json()

    def update_team_v1(self, team_id: str, body: Dict[str, Any]) -> Dict[str, Any]:
        return self._http.request("PUT", f"{self._v1}/teams/{team_id}", json=body).json()

    def delete_team(self, team_id: str) -> Dict[str, Any]:
        # platform-service answers 200 with an empty body
        return json_or_success(self._http.request("DELETE", f"{self._v2}/teams/{team_id}").text)

    def add_team_users(self, body: Dict[str, Any]) -> Dict[str, Any]:
        """Add members to a team.

        ``body``: ``team_id`` plus either ``users=[{user_id, role}]`` or the
        shorthand ``user_ids`` (added with ``role``, default ``"member"``);
        optional ``reserve_leave``. Users with an unknown role are silently
        skipped by the server.
        """
        return self._http.request("POST", f"{self._v2}/teams/_add_users",
                                  json=_add_team_users_from_dict(body)).json()

    def remove_team_users(self, body: Dict[str, Any]) -> Dict[str, Any]:
        """Remove members from a team. ``body``: ``{team_id, user_ids}``."""
        return self._http.request("POST", f"{self._v2}/teams/_remove_users", json=body).json()

    def get_team_workflows(self, team_id: str) -> Dict[str, Any]:
        """Deprecated — raises."""
        _retire("get_team_workflows")

    def upload_team_icon(self, files: Any) -> Dict[str, Any]:
        return self._http.request("POST", f"{self._v1}/teams/_fileupload", files=files).json()

    def list_team_users(self, q: str, type: Optional[str] = None, limit: Optional[int] = None,
                        skip: Optional[int] = None, search: Optional[str] = None) -> Dict[str, Any]:
        """Members of a team. platform-service requires the team id as ``q`` (``type="team_id"`` by default)."""
        params = team_list_params("team_id", q, type, limit, skip, search)
        return self._http.request("GET", f"{self._v1}/team_users", params=params).json()

    def list_team_invites(self, team_id: str, version: str = "v2") -> Dict[str, Any]:
        """Pending invites of a team — ``GET /platform/{version}/team_users/_invite_list``."""
        return self._http.request("GET", f"{self._base}/{version}/team_users/_invite_list",
                                  params={"type": "team_id", "team_id": team_id}).json()

    def list_team_users_v2(self, q: str, type: Optional[str] = None, limit: Optional[int] = None,
                           skip: Optional[int] = None, search: Optional[str] = None,
                           sort: Optional[str] = None) -> Dict[str, Any]:
        """Members of a team (v2). Requires the team id as ``q`` (``type="team_id"`` by default)."""
        params = team_list_params("team_id", q, type, limit, skip, search, sort)
        return self._http.request("GET", f"{self._v2}/team_users", params=params).json()

    def accept_team_join_request(self, team_id: str, team_user_id: str) -> Dict[str, Any]:
        return self._http.request("POST", f"{self._v2}/teams/{team_id}/user/{team_user_id}/accept").json()

    def get_team_labels(self, team_id: str) -> Any:
        """Team labels as a list (unwrapped from ``{items}`` / ``{data}``)."""
        res = self._http.request("GET", f"{self._v1}/teams/{team_id}/team_labels").json()
        return _team_labels(res)

    # --- Permissions ---
    def list_permissions(self, user_id: str) -> Dict[str, Any]:
        """Deprecated — raises. Permissions are role-based: use :meth:`get_effective_permissions`."""
        _retire("list_permissions", "Use platform.get_effective_permissions(user_id) instead.")

    def get_effective_permissions(self, user_id: str) -> Dict[str, Any]:
        """A user's effective permissions, resolved from their role — ``GET /platform/v1/roles/_effective``."""
        return self._http.request("GET", f"{self._v1}/roles/_effective", params={"user_id": user_id}).json()

    def grant_permission(self, user_id: str, resource: str, action: str) -> Dict[str, Any]:
        """Deprecated — raises. Permissions come from roles: use :meth:`change_role`."""
        _retire("grant_permission", "Permissions come from roles; use platform.change_role().")

    def revoke_permission(self, user_id: str, permission_id: str) -> None:
        """Deprecated — raises. Permissions come from roles: use :meth:`change_role`."""
        _retire("revoke_permission", "Permissions come from roles; use platform.change_role().")

    # Apps/* and Email Senders removed in v1.1.0 — moved out of SDK scope.

    # --- Business Units ---
    def list_business_units(self, params: Optional[Dict[str, str]] = None) -> Any:
        res = self._http.request("GET", f"{self._v1}/business_units", params=params or {}).json()
        return unwrap_data(res)

    # --- Rooms (retired) ---
    def list_rooms(self, params: Optional[Dict[str, str]] = None) -> Dict[str, Any]:
        """Deprecated — raises."""
        _retire("list_rooms")

    def get_room(self, room_id: str) -> Dict[str, Any]:
        """Deprecated — raises."""
        _retire("get_room")

    def update_room(self, room_id: str, body: Dict[str, Any]) -> Dict[str, Any]:
        """Deprecated — raises."""
        _retire("update_room")

    def get_room_status(self, params: Optional[Dict[str, str]] = None) -> Dict[str, Any]:
        """Deprecated — raises."""
        _retire("get_room_status")

    def join_room(self, body: Dict[str, Any]) -> Dict[str, Any]:
        """Deprecated — raises."""
        _retire("join_room")

    def get_room_status_count(self) -> Dict[str, Any]:
        """Deprecated — raises."""
        _retire("get_room_status_count")

    def search_rooms(self, q: str) -> Dict[str, Any]:
        """Deprecated — raises."""
        _retire("search_rooms")

    # --- Physical Stores (retired) ---
    def list_stores(self) -> Dict[str, Any]:
        """Deprecated — raises."""
        _retire("list_stores")

    def create_store(self, body: Dict[str, Any]) -> Dict[str, Any]:
        """Deprecated — raises."""
        _retire("create_store")

    def update_store(self, body: Dict[str, Any]) -> Dict[str, Any]:
        """Deprecated — raises."""
        _retire("update_store")

    def get_store(self, store_id: str) -> Dict[str, Any]:
        """Deprecated — raises."""
        _retire("get_store")

    # --- Facebook (retired) ---
    def get_facebook_pages(self, params: Optional[Dict[str, str]] = None) -> Dict[str, Any]:
        """Deprecated — raises. Facebook channels are managed through ``client.channel``."""
        _retire("get_facebook_pages", "Facebook channels are managed through client.channel.")

    def auth_facebook_pages(self, body: Dict[str, Any]) -> Dict[str, Any]:
        """Deprecated — raises. Facebook channels are managed through ``client.channel``."""
        _retire("auth_facebook_pages", "Facebook channels are managed through client.channel.")

    def cancel_facebook_pages(self, body: Dict[str, Any]) -> Dict[str, Any]:
        """Deprecated — raises. Facebook channels are managed through ``client.channel``."""
        _retire("cancel_facebook_pages", "Facebook channels are managed through client.channel.")

    # --- Mail Channels (retired) ---
    def create_mail_channel(self, body: Dict[str, Any]) -> Dict[str, Any]:
        """Deprecated — raises. Email channels are managed through ``client.channel``."""
        _retire("create_mail_channel", "Email channels are managed through client.channel.")

    def get_mail_channel(self, channel_id: str) -> Dict[str, Any]:
        """Deprecated — raises. Email channels are managed through ``client.channel``."""
        _retire("get_mail_channel", "Email channels are managed through client.channel.")

    def init_channel(self, body: Dict[str, Any]) -> Dict[str, Any]:
        """Get or create the org's default web channel — ``POST /channel-service/v1/init_channel``.

        Returns the channel (``{id, type, ...}``).
        """
        res = self._http.request("POST", f"{self._cs}/init_channel", json=body).json()
        return unwrap_data(res)

    # --- Contacts (channel-service) ---
    def get_contact_v2(self, contact_id: str) -> Dict[str, Any]:
        """Get a contact — ``GET /channel-service/v1/contacts/{id}``."""
        res = self._http.request("GET", f"{self._cs}/contacts/{contact_id}").json()
        return unwrap_data(res)

    def update_contact_v2(self, contact_id: str, body: Dict[str, Any]) -> Dict[str, Any]:
        """Update a contact — ``PUT /channel-service/v1/contacts/{id}``."""
        res = self._http.request("PUT", f"{self._cs}/contacts/{contact_id}", json=body).json()
        return unwrap_data(res)

    # --- Credentials (channel-service) ---
    def list_credentials(self) -> Any:
        """Workflow credentials — ``GET /channel-service/v1/credentials``."""
        return unwrap_data(self._http.request("GET", f"{self._cs}/credentials").json())

    def get_credential_types(self, params: Optional[Dict[str, str]] = None) -> Dict[str, Any]:
        """Deprecated — raises. Use :meth:`list_processed_credential_types`."""
        _retire("get_credential_types", "Use platform.list_processed_credential_types() instead.")

    def get_credential_type_by_name(self, name: str) -> Dict[str, Any]:
        """One credential type's schema — ``GET /channel-service/v1/workflow/_credentialParam?type={name}``."""
        return self.get_credential_param({"type": name})

    def list_processed_credential_types(self) -> List[Dict[str, Any]]:
        """Credential types — ``GET /channel-service/v1/workflow/processed-credential-types``.

        The service groups them as ``{channel, integration}``; they are returned as one list.
        """
        res = self._http.request("GET", f"{self._cs}/workflow/processed-credential-types").json()
        return _merge_credential_types(res)

    # n8n_* methods removed in v1.1.0 — moved out of SDK scope.

    def get_credential_param(self, params: Dict[str, str]) -> Dict[str, Any]:
        """A credential type's parameters — ``GET /channel-service/v1/workflow/_credentialParam``. Requires ``type``."""
        return self._http.request("GET", f"{self._cs}/workflow/_credentialParam", params=params).json()

    # --- Knowledge (retired) ---
    def list_knowledge(self) -> Dict[str, Any]:
        """Deprecated — raises. Knowledge Hub files live in data-board folders (``client.boards``)."""
        _retire("list_knowledge", "Use the Knowledge Hub folders in client.boards instead.")

    def upload_knowledge(self, files: Any) -> Dict[str, Any]:
        """Deprecated — raises. Use ``client.boards.upload_file()``."""
        _retire("upload_knowledge", "Use client.boards.upload_file() instead.")

    # --- Resources (retired) ---
    def list_resources(self) -> Dict[str, Any]:
        """Deprecated — raises."""
        _retire("list_resources")


class AsyncPlatformResource:
    """Platform domain — Async. See :class:`PlatformResource`."""

    def __init__(self, http: AsyncHttpTransport, base: str, channel_service: Optional[str] = None):
        self._http = http
        self._base = base.rstrip("/")
        self._channel_service = _channel_service_base(self._base, channel_service)

    @property
    def _v1(self) -> str:
        return f"{self._base}/v1"

    @property
    def _v2(self) -> str:
        return f"{self._base}/v2"

    @property
    def _cs(self) -> str:
        return f"{self._channel_service}/v1"

    # --- Users ---
    async def list_users(self, params: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        res = await self._http.request("GET", f"{self._v1}/users", params=params or {})
        return res.json()

    async def get_user(self, user_id: str) -> Dict[str, Any]:
        res = await self._http.request("GET", f"{self._v1}/users/{user_id}")
        return res.json()

    async def get_me(self) -> Dict[str, Any]:
        res = await self._http.request("GET", f"{self._v1}/users/_me")
        return res.json()

    async def update_user(self, user_id: str, body: Dict[str, Any]) -> Dict[str, Any]:
        res = await self._http.request("PUT", f"{self._v1}/users/{user_id}", json=body)
        return res.json()

    async def change_role(self, body: Dict[str, Any]) -> Dict[str, Any]:
        res = await self._http.request("POST", f"{self._v1}/users/_change_role", json=body)
        return res.json()

    async def archive_user(self, user_id: str) -> Dict[str, Any]:
        """Deprecated — raises. Use :meth:`deactivate_user`."""
        _retire("archive_user", "Use platform.deactivate_user() instead.")

    async def reactivate_user(self, user_id: str) -> Dict[str, Any]:
        res = await self._http.request("POST", f"{self._v1}/users/_reactivate", json={"user_id": user_id})
        return res.json()

    async def suspend_user(self, user_id: str) -> Dict[str, Any]:
        """Deprecated — raises. Use :meth:`deactivate_user`."""
        _retire("suspend_user", "Use platform.deactivate_user() instead.")

    async def deactivate_user(self, user_id: str) -> Dict[str, Any]:
        res = await self._http.request("POST", f"{self._v1}/users/_deactivate", json={"user_id": user_id})
        return res.json()

    async def list_all_users(self, params: Optional[Dict[str, str]] = None) -> Dict[str, Any]:
        res = await self._http.request("GET", f"{self._v1}/users/_all", params=params or {})
        return res.json()

    async def bulk_invite(self, body: Dict[str, Any]) -> Dict[str, Any]:
        res = await self._http.request("POST", f"{self._v1}/users/_bulk_invite", json=body)
        return res.json()

    async def upload_user_avatar(self, files: Any) -> Dict[str, Any]:
        """Upload the caller's own avatar — ``POST /platform/v1/account/_fileupload``."""
        res = await self._http.request("POST", f"{self._v1}/account/_fileupload", files=files)
        return res.json()

    async def get_user_workflows(self, user_id: str) -> Dict[str, Any]:
        """Deprecated — raises."""
        _retire("get_user_workflows")

    async def delete_user(self, user_id: str) -> Dict[str, Any]:
        res = await self._http.request("DELETE", f"{self._v1}/users/{user_id}")
        return res.json()

    # --- Organizations ---
    async def list_orgs(self, params: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        res = await self._http.request("GET", f"{self._v2}/organizations", params=params or {})
        return res.json()

    async def list_all_orgs(self, params: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """Lists the caller's organizations. Needs a user access token; API keys are rejected (401)."""
        res = await self._http.request("GET", f"{self._v2}/organizations/_all", params=params or {})
        return res.json()

    async def get_org(self, org_id: str) -> Dict[str, Any]:
        res = await self._http.request("GET", f"{self._v1}/organizations/{org_id}")
        return res.json()

    async def create_org(self, body: Dict[str, Any]) -> Dict[str, Any]:
        res = await self._http.request("POST", f"{self._v1}/organizations", json=body)
        return res.json()

    async def update_org(self, org_id: str, body: Dict[str, Any]) -> Dict[str, Any]:
        res = await self._http.request("PATCH", f"{self._v1}/organizations/{org_id}", json=body)
        return res.json()

    async def delete_org(self, org_id: str) -> Dict[str, Any]:
        res = await self._http.request("DELETE", f"{self._v1}/organizations/{org_id}")
        return res.json()

    async def create_aws_org(self, body: Dict[str, Any]) -> Dict[str, Any]:
        res = await self._http.request("POST", f"{self._v1}/organizations/aws", json=body)
        return res.json()

    # --- Teams ---
    async def list_teams(self, q: str, type: Optional[str] = None, limit: Optional[int] = None,
                         skip: Optional[int] = None, search: Optional[str] = None) -> Dict[str, Any]:
        """Teams of a business unit. Requires the business unit id as ``q``."""
        params = team_list_params("business_unit_id", q, type, limit, skip, search)
        res = await self._http.request("GET", f"{self._v2}/teams", params=params)
        return res.json()

    async def get_my_teams(self) -> Dict[str, Any]:
        res = await self._http.request("GET", f"{self._v2}/teams/my")
        return res.json()

    async def create_team(self, body: Dict[str, Any]) -> Dict[str, Any]:
        res = await self._http.request("POST", f"{self._v1}/teams", json=body)
        return res.json()

    async def update_team(self, team_id: str, body: Dict[str, Any]) -> Dict[str, Any]:
        res = await self._http.request("PUT", f"{self._v2}/teams/{team_id}", json=body)
        return res.json()

    async def update_team_v1(self, team_id: str, body: Dict[str, Any]) -> Dict[str, Any]:
        res = await self._http.request("PUT", f"{self._v1}/teams/{team_id}", json=body)
        return res.json()

    async def delete_team(self, team_id: str) -> Dict[str, Any]:
        # platform-service answers 200 with an empty body
        res = await self._http.request("DELETE", f"{self._v2}/teams/{team_id}")
        return json_or_success(res.text)

    async def add_team_users(self, body: Dict[str, Any]) -> Dict[str, Any]:
        """Add members to a team. See :meth:`PlatformResource.add_team_users`."""
        res = await self._http.request("POST", f"{self._v2}/teams/_add_users",
                                       json=_add_team_users_from_dict(body))
        return res.json()

    async def remove_team_users(self, body: Dict[str, Any]) -> Dict[str, Any]:
        """Remove members from a team. ``body``: ``{team_id, user_ids}``."""
        res = await self._http.request("POST", f"{self._v2}/teams/_remove_users", json=body)
        return res.json()

    async def get_team_workflows(self, team_id: str) -> Dict[str, Any]:
        """Deprecated — raises."""
        _retire("get_team_workflows")

    async def upload_team_icon(self, files: Any) -> Dict[str, Any]:
        res = await self._http.request("POST", f"{self._v1}/teams/_fileupload", files=files)
        return res.json()

    async def list_team_users(self, q: str, type: Optional[str] = None, limit: Optional[int] = None,
                              skip: Optional[int] = None, search: Optional[str] = None) -> Dict[str, Any]:
        """Members of a team. Requires the team id as ``q``."""
        params = team_list_params("team_id", q, type, limit, skip, search)
        res = await self._http.request("GET", f"{self._v1}/team_users", params=params)
        return res.json()

    async def list_team_invites(self, team_id: str, version: str = "v2") -> Dict[str, Any]:
        """Pending invites of a team — ``GET /platform/{version}/team_users/_invite_list``."""
        res = await self._http.request("GET", f"{self._base}/{version}/team_users/_invite_list",
                                       params={"type": "team_id", "team_id": team_id})
        return res.json()

    async def list_team_users_v2(self, q: str, type: Optional[str] = None, limit: Optional[int] = None,
                                 skip: Optional[int] = None, search: Optional[str] = None,
                                 sort: Optional[str] = None) -> Dict[str, Any]:
        """Members of a team (v2). Requires the team id as ``q``."""
        params = team_list_params("team_id", q, type, limit, skip, search, sort)
        res = await self._http.request("GET", f"{self._v2}/team_users", params=params)
        return res.json()

    async def accept_team_join_request(self, team_id: str, team_user_id: str) -> Dict[str, Any]:
        res = await self._http.request("POST", f"{self._v2}/teams/{team_id}/user/{team_user_id}/accept")
        return res.json()

    async def get_team_labels(self, team_id: str) -> Any:
        """Team labels as a list (unwrapped from ``{items}`` / ``{data}``)."""
        res = await self._http.request("GET", f"{self._v1}/teams/{team_id}/team_labels")
        return _team_labels(res.json())

    # --- Permissions ---
    async def list_permissions(self, user_id: str) -> Dict[str, Any]:
        """Deprecated — raises. Use :meth:`get_effective_permissions`."""
        _retire("list_permissions", "Use platform.get_effective_permissions(user_id) instead.")

    async def get_effective_permissions(self, user_id: str) -> Dict[str, Any]:
        """A user's effective permissions — ``GET /platform/v1/roles/_effective``."""
        res = await self._http.request("GET", f"{self._v1}/roles/_effective", params={"user_id": user_id})
        return res.json()

    async def grant_permission(self, user_id: str, resource: str, action: str) -> Dict[str, Any]:
        """Deprecated — raises. Permissions come from roles: use :meth:`change_role`."""
        _retire("grant_permission", "Permissions come from roles; use platform.change_role().")

    async def revoke_permission(self, user_id: str, permission_id: str) -> None:
        """Deprecated — raises. Permissions come from roles: use :meth:`change_role`."""
        _retire("revoke_permission", "Permissions come from roles; use platform.change_role().")

    # --- Business Units ---
    async def list_business_units(self, params: Optional[Dict[str, str]] = None) -> Any:
        res = await self._http.request("GET", f"{self._v1}/business_units", params=params or {})
        return unwrap_data(res.json())

    # --- Rooms (retired) ---
    async def list_rooms(self, params: Optional[Dict[str, str]] = None) -> Dict[str, Any]:
        """Deprecated — raises."""
        _retire("list_rooms")

    async def get_room(self, room_id: str) -> Dict[str, Any]:
        """Deprecated — raises."""
        _retire("get_room")

    async def update_room(self, room_id: str, body: Dict[str, Any]) -> Dict[str, Any]:
        """Deprecated — raises."""
        _retire("update_room")

    async def get_room_status(self, params: Optional[Dict[str, str]] = None) -> Dict[str, Any]:
        """Deprecated — raises."""
        _retire("get_room_status")

    async def join_room(self, body: Dict[str, Any]) -> Dict[str, Any]:
        """Deprecated — raises."""
        _retire("join_room")

    async def get_room_status_count(self) -> Dict[str, Any]:
        """Deprecated — raises."""
        _retire("get_room_status_count")

    async def search_rooms(self, q: str) -> Dict[str, Any]:
        """Deprecated — raises."""
        _retire("search_rooms")

    # --- Physical Stores (retired) ---
    async def list_stores(self) -> Dict[str, Any]:
        """Deprecated — raises."""
        _retire("list_stores")

    async def create_store(self, body: Dict[str, Any]) -> Dict[str, Any]:
        """Deprecated — raises."""
        _retire("create_store")

    async def update_store(self, body: Dict[str, Any]) -> Dict[str, Any]:
        """Deprecated — raises."""
        _retire("update_store")

    async def get_store(self, store_id: str) -> Dict[str, Any]:
        """Deprecated — raises."""
        _retire("get_store")

    # --- Facebook (retired) ---
    async def get_facebook_pages(self, params: Optional[Dict[str, str]] = None) -> Dict[str, Any]:
        """Deprecated — raises."""
        _retire("get_facebook_pages", "Facebook channels are managed through client.channel.")

    async def auth_facebook_pages(self, body: Dict[str, Any]) -> Dict[str, Any]:
        """Deprecated — raises."""
        _retire("auth_facebook_pages", "Facebook channels are managed through client.channel.")

    async def cancel_facebook_pages(self, body: Dict[str, Any]) -> Dict[str, Any]:
        """Deprecated — raises."""
        _retire("cancel_facebook_pages", "Facebook channels are managed through client.channel.")

    # --- Mail Channels (retired) ---
    async def create_mail_channel(self, body: Dict[str, Any]) -> Dict[str, Any]:
        """Deprecated — raises."""
        _retire("create_mail_channel", "Email channels are managed through client.channel.")

    async def get_mail_channel(self, channel_id: str) -> Dict[str, Any]:
        """Deprecated — raises."""
        _retire("get_mail_channel", "Email channels are managed through client.channel.")

    async def init_channel(self, body: Dict[str, Any]) -> Dict[str, Any]:
        """Get or create the org's default web channel — ``POST /channel-service/v1/init_channel``."""
        res = await self._http.request("POST", f"{self._cs}/init_channel", json=body)
        return unwrap_data(res.json())

    # --- Contacts (channel-service) ---
    async def get_contact_v2(self, contact_id: str) -> Dict[str, Any]:
        """Get a contact — ``GET /channel-service/v1/contacts/{id}``."""
        res = await self._http.request("GET", f"{self._cs}/contacts/{contact_id}")
        return unwrap_data(res.json())

    async def update_contact_v2(self, contact_id: str, body: Dict[str, Any]) -> Dict[str, Any]:
        """Update a contact — ``PUT /channel-service/v1/contacts/{id}``."""
        res = await self._http.request("PUT", f"{self._cs}/contacts/{contact_id}", json=body)
        return unwrap_data(res.json())

    # --- Credentials (channel-service) ---
    async def list_credentials(self) -> Any:
        """Workflow credentials — ``GET /channel-service/v1/credentials``."""
        res = await self._http.request("GET", f"{self._cs}/credentials")
        return unwrap_data(res.json())

    async def get_credential_types(self, params: Optional[Dict[str, str]] = None) -> Dict[str, Any]:
        """Deprecated — raises. Use :meth:`list_processed_credential_types`."""
        _retire("get_credential_types", "Use platform.list_processed_credential_types() instead.")

    async def get_credential_type_by_name(self, name: str) -> Dict[str, Any]:
        """One credential type's schema — ``_credentialParam?type={name}``."""
        return await self.get_credential_param({"type": name})

    async def list_processed_credential_types(self) -> List[Dict[str, Any]]:
        """Credential types as one list (the service groups them as ``{channel, integration}``)."""
        res = await self._http.request("GET", f"{self._cs}/workflow/processed-credential-types")
        return _merge_credential_types(res.json())

    async def get_credential_param(self, params: Dict[str, str]) -> Dict[str, Any]:
        """A credential type's parameters — ``GET /channel-service/v1/workflow/_credentialParam``. Requires ``type``."""
        res = await self._http.request("GET", f"{self._cs}/workflow/_credentialParam", params=params)
        return res.json()

    # --- Knowledge (retired) ---
    async def list_knowledge(self) -> Dict[str, Any]:
        """Deprecated — raises."""
        _retire("list_knowledge", "Use the Knowledge Hub folders in client.boards instead.")

    async def upload_knowledge(self, files: Any) -> Dict[str, Any]:
        """Deprecated — raises."""
        _retire("upload_knowledge", "Use client.boards.upload_file() instead.")

    # --- Resources (retired) ---
    async def list_resources(self) -> Dict[str, Any]:
        """Deprecated — raises."""
        _retire("list_resources")
