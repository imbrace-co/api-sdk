from typing import Any, Dict, Optional
from ..http import HttpTransport, AsyncHttpTransport


class PlatformResource:
    """Platform domain — Sync. Users, Orgs, Teams, Apps, Rooms, etc."""

    def __init__(self, http: HttpTransport, base: str):
        self._http = http
        self._base = base.rstrip("/")

    @property
    def _v1(self) -> str:
        return f"{self._base}/v1"

    @property
    def _v2(self) -> str:
        return f"{self._base}/v2"

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
        return self._http.request("POST", f"{self._v1}/users/_archive", json={"user_id": user_id}).json()

    def reactivate_user(self, user_id: str) -> Dict[str, Any]:
        return self._http.request("POST", f"{self._v1}/users/_reactivate", json={"user_id": user_id}).json()

    def suspend_user(self, user_id: str) -> Dict[str, Any]:
        return self._http.request("POST", f"{self._v1}/users/_suspend", json={"user_id": user_id}).json()

    def deactivate_user(self, user_id: str) -> Dict[str, Any]:
        return self._http.request("POST", f"{self._v1}/users/_deactivate", json={"user_id": user_id}).json()

    def list_all_users(self, params: Optional[Dict[str, str]] = None) -> Dict[str, Any]:
        return self._http.request("GET", f"{self._v1}/users/_all", params=params or {}).json()

    def bulk_invite(self, body: Dict[str, Any]) -> Dict[str, Any]:
        return self._http.request("POST", f"{self._v1}/users/_bulk_invite", json=body).json()

    def upload_user_avatar(self, files: Any) -> Dict[str, Any]:
        return self._http.request("POST", f"{self._v1}/users/_fileupload", files=files).json()

    def get_user_workflows(self, user_id: str) -> Dict[str, Any]:
        return self._http.request("GET", f"{self._v1}/users/{user_id}/workflows").json()

    def delete_user(self, user_id: str) -> Dict[str, Any]:
        return self._http.request("DELETE", f"{self._v1}/users/{user_id}").json()

    # --- Organizations ---
    def list_orgs(self, params: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        return self._http.request("GET", f"{self._v2}/organizations", params=params or {}).json()

    def list_all_orgs(self, params: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
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
    def list_teams(self, params: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        return self._http.request("GET", f"{self._v2}/teams", params=params or {}).json()

    def get_my_teams(self) -> Dict[str, Any]:
        return self._http.request("GET", f"{self._v2}/teams/my").json()

    def create_team(self, body: Dict[str, Any]) -> Dict[str, Any]:
        return self._http.request("POST", f"{self._v1}/teams", json=body).json()

    def update_team(self, team_id: str, body: Dict[str, Any]) -> Dict[str, Any]:
        return self._http.request("PUT", f"{self._v2}/teams/{team_id}", json=body).json()

    def update_team_v1(self, team_id: str, body: Dict[str, Any]) -> Dict[str, Any]:
        return self._http.request("PUT", f"{self._v1}/teams/{team_id}", json=body).json()

    def delete_team(self, team_id: str) -> Dict[str, Any]:
        return self._http.request("DELETE", f"{self._v2}/teams/{team_id}").json()

    def add_team_users(self, body: Dict[str, Any]) -> Dict[str, Any]:
        return self._http.request("POST", f"{self._v2}/teams/_add_users", json=body).json()

    def remove_team_users(self, body: Dict[str, Any]) -> Dict[str, Any]:
        return self._http.request("POST", f"{self._v2}/teams/_remove_users", json=body).json()

    def get_team_workflows(self, team_id: str) -> Dict[str, Any]:
        return self._http.request("GET", f"{self._v1}/teams/{team_id}/workflows").json()

    def upload_team_icon(self, files: Any) -> Dict[str, Any]:
        base = self._backend_base or self._v1
        return self._http.request("POST", f"{base}/teams/_fileupload", files=files).json()

    def list_team_users(self, params: Optional[Dict[str, str]] = None) -> Dict[str, Any]:
        return self._http.request("GET", f"{self._v1}/team_users", params=params or {}).json()

    def list_team_invites(self, version: str = "v2") -> Dict[str, Any]:
        return self._http.request("GET", f"{self._base}/{version}/team_users/_invite_list").json()

    def list_team_users_v2(self, params: Optional[Dict[str, str]] = None) -> Dict[str, Any]:
        return self._http.request("GET", f"{self._v2}/team_users", params=params or {}).json()

    def accept_team_join_request(self, team_id: str, team_user_id: str) -> Dict[str, Any]:
        return self._http.request("POST", f"{self._v2}/teams/{team_id}/user/{team_user_id}/accept").json()

    def get_team_labels(self, team_id: str) -> Dict[str, Any]:
        return self._http.request("GET", f"{self._v1}/teams/{team_id}/team_labels").json()

    # --- Permissions ---
    def list_permissions(self, user_id: str) -> Dict[str, Any]:
        return self._http.request("GET", f"{self._v1}/users/{user_id}/permissions").json()

    def grant_permission(self, user_id: str, resource: str, action: str) -> Dict[str, Any]:
        return self._http.request("POST", f"{self._v1}/users/{user_id}/permissions",
                                  json={"resource": resource, "action": action}).json()

    def revoke_permission(self, user_id: str, permission_id: str) -> None:
        self._http.request("DELETE", f"{self._v1}/users/{user_id}/permissions/{permission_id}")

    # Apps/* and Email Senders removed in v1.1.0 — moved out of SDK scope.

    # --- Business Units ---
    def list_business_units(self, params: Optional[Dict[str, str]] = None) -> Dict[str, Any]:
        return self._http.request("GET", f"{self._v1}/business_units", params=params or {}).json()

    # --- Rooms ---
    def list_rooms(self, params: Optional[Dict[str, str]] = None) -> Dict[str, Any]:
        return self._http.request("GET", f"{self._v1}/rooms", params=params or {}).json()

    def get_room(self, room_id: str) -> Dict[str, Any]:
        return self._http.request("GET", f"{self._v1}/rooms/{room_id}").json()

    def update_room(self, room_id: str, body: Dict[str, Any]) -> Dict[str, Any]:
        return self._http.request("PUT", f"{self._v1}/rooms/{room_id}", json=body).json()

    def get_room_status(self, params: Optional[Dict[str, str]] = None) -> Dict[str, Any]:
        return self._http.request("GET", f"{self._v1}/rooms/_status", params=params or {}).json()

    def join_room(self, body: Dict[str, Any]) -> Dict[str, Any]:
        return self._http.request("POST", f"{self._v1}/rooms/_join", json=body).json()

    def get_room_status_count(self) -> Dict[str, Any]:
        return self._http.request("GET", f"{self._v1}/rooms/_status_count").json()

    def search_rooms(self, q: str) -> Dict[str, Any]:
        return self._http.request("GET", f"{self._v1}/rooms/_search", params={"q": q}).json()

    # --- Physical Stores ---
    def list_stores(self) -> Dict[str, Any]:
        return self._http.request("GET", f"{self._v1}/stores").json()

    def create_store(self, body: Dict[str, Any]) -> Dict[str, Any]:
        return self._http.request("POST", f"{self._v1}/stores/_create_with_fp", json=body).json()

    def update_store(self, body: Dict[str, Any]) -> Dict[str, Any]:
        return self._http.request("POST", f"{self._v1}/stores/_modify_with_fp", json=body).json()

    def get_store(self, store_id: str) -> Dict[str, Any]:
        return self._http.request("GET", f"{self._v1}/stores/{store_id}").json()

    # --- Facebook ---
    def get_facebook_pages(self, params: Optional[Dict[str, str]] = None) -> Dict[str, Any]:
        return self._http.request("GET", f"{self._v1}/facebooks", params=params or {}).json()

    def auth_facebook_pages(self, body: Dict[str, Any]) -> Dict[str, Any]:
        return self._http.request("POST", f"{self._v1}/facebook/_auth_pages", json=body).json()

    def cancel_facebook_pages(self, body: Dict[str, Any]) -> Dict[str, Any]:
        return self._http.request("POST", f"{self._v1}/facebook/_cancel_pages", json=body).json()

    # --- Mail Channels ---
    def create_mail_channel(self, body: Dict[str, Any]) -> Dict[str, Any]:
        return self._http.request("POST", f"{self._v1}/mail_channels", json=body).json()

    def get_mail_channel(self, channel_id: str) -> Dict[str, Any]:
        return self._http.request("GET", f"{self._v1}/mail_channels/{channel_id}").json()

    def init_channel(self, body: Dict[str, Any]) -> Dict[str, Any]:
        return self._http.request("POST", f"{self._v1}/init_channel", json=body).json()

    # --- Contacts v2 ---
    def get_contact_v2(self, contact_id: str) -> Dict[str, Any]:
        return self._http.request("GET", f"{self._v2}/contacts/{contact_id}").json()

    def update_contact_v2(self, contact_id: str, body: Dict[str, Any]) -> Dict[str, Any]:
        return self._http.request("PUT", f"{self._v2}/contacts/{contact_id}", json=body).json()

    # --- Credentials / n8n ---
    def list_credentials(self) -> Dict[str, Any]:
        return self._http.request("GET", f"{self._v1}/credentials").json()

    def get_credential_types(self, params: Optional[Dict[str, str]] = None) -> Dict[str, Any]:
        return self._http.request("GET", f"{self._v1}/workflow/credential-types", params=params or {}).json()

    def get_credential_type_by_name(self, name: str) -> Dict[str, Any]:
        return self._http.request("GET", f"{self._v1}/workflow/credential-types/{name}").json()

    def list_processed_credential_types(self) -> Dict[str, Any]:
        return self._http.request("GET", f"{self._v1}/workflow/processed-credential-types").json()

    # n8n_* methods removed in v1.1.0 — moved out of SDK scope.

    def get_credential_param(self, params: Optional[Dict[str, str]] = None) -> Dict[str, Any]:
        return self._http.request("GET", f"{self._v1}/workflow/_credentialParam", params=params or {}).json()

    # --- Knowledge ---
    def list_knowledge(self) -> Dict[str, Any]:
        return self._http.request("GET", f"{self._v1}/knowledge").json()

    def upload_knowledge(self, files: Any) -> Dict[str, Any]:
        return self._http.request("POST", f"{self._v1}/knowledge/upload", files=files).json()

    # --- Resources ---
    def list_resources(self) -> Dict[str, Any]:
        return self._http.request("GET", f"{self._v1}/resources").json()


class AsyncPlatformResource:
    """Platform domain — Async."""

    def __init__(self, http: AsyncHttpTransport, base: str):
        self._http = http
        self._base = base.rstrip("/")

    @property
    def _v1(self) -> str:
        return f"{self._base}/v1"

    @property
    def _v2(self) -> str:
        return f"{self._base}/v2"

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

    async def delete_user(self, user_id: str) -> Dict[str, Any]:
        res = await self._http.request("DELETE", f"{self._v1}/users/{user_id}")
        return res.json()

    async def suspend_user(self, user_id: str) -> Dict[str, Any]:
        res = await self._http.request("POST", f"{self._v1}/users/_suspend", json={"user_id": user_id})
        return res.json()

    async def deactivate_user(self, user_id: str) -> Dict[str, Any]:
        res = await self._http.request("POST", f"{self._v1}/users/_deactivate", json={"user_id": user_id})
        return res.json()

    async def bulk_invite(self, body: Dict[str, Any]) -> Dict[str, Any]:
        res = await self._http.request("POST", f"{self._v1}/users/_bulk_invite", json=body)
        return res.json()

    async def list_orgs(self, params: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        res = await self._http.request("GET", f"{self._v2}/organizations", params=params or {})
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

    async def list_permissions(self, user_id: str) -> Dict[str, Any]:
        res = await self._http.request("GET", f"{self._v1}/users/{user_id}/permissions")
        return res.json()

    async def grant_permission(self, user_id: str, resource: str, action: str) -> Dict[str, Any]:
        res = await self._http.request("POST", f"{self._v1}/users/{user_id}/permissions",
                                       json={"resource": resource, "action": action})
        return res.json()

    async def revoke_permission(self, user_id: str, permission_id: str) -> None:
        await self._http.request("DELETE", f"{self._v1}/users/{user_id}/permissions/{permission_id}")

    async def list_teams(self, params: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        res = await self._http.request("GET", f"{self._v2}/teams", params=params or {})
        return res.json()

    async def create_team(self, body: Dict[str, Any]) -> Dict[str, Any]:
        res = await self._http.request("POST", f"{self._v1}/teams", json=body)
        return res.json()

    async def update_team(self, team_id: str, body: Dict[str, Any]) -> Dict[str, Any]:
        res = await self._http.request("PUT", f"{self._v2}/teams/{team_id}", json=body)
        return res.json()

    async def delete_team(self, team_id: str) -> Dict[str, Any]:
        res = await self._http.request("DELETE", f"{self._v2}/teams/{team_id}")
        return res.json()

    # Async list_apps / get_app removed in v1.1.0 — apps moved out of SDK scope.

    async def list_rooms(self, params: Optional[Dict[str, str]] = None) -> Dict[str, Any]:
        res = await self._http.request("GET", f"{self._v1}/rooms", params=params or {})
        return res.json()

    async def get_room(self, room_id: str) -> Dict[str, Any]:
        res = await self._http.request("GET", f"{self._v1}/rooms/{room_id}")
        return res.json()

    async def change_role(self, body: Dict[str, Any]) -> Dict[str, Any]:
        _r = await self._http.request("POST", f"{self._v1}/users/_change_role", json=body)
        return _r.json()

    async def archive_user(self, user_id: str) -> Dict[str, Any]:
        _r = await self._http.request("POST", f"{self._v1}/users/_archive", json={"user_id": user_id})
        return _r.json()

    async def reactivate_user(self, user_id: str) -> Dict[str, Any]:
        _r = await self._http.request("POST", f"{self._v1}/users/_reactivate", json={"user_id": user_id})
        return _r.json()

    async def list_all_users(self, params: Optional[Dict[str, str]] = None) -> Dict[str, Any]:
        _r = await self._http.request("GET", f"{self._v1}/users/_all", params=params or {})
        return _r.json()

    async def upload_user_avatar(self, files: Any) -> Dict[str, Any]:
        _r = await self._http.request("POST", f"{self._v1}/users/_fileupload", files=files)
        return _r.json()

    async def get_user_workflows(self, user_id: str) -> Dict[str, Any]:
        _r = await self._http.request("GET", f"{self._v1}/users/{user_id}/workflows")
        return _r.json()

    async def list_all_orgs(self, params: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        _r = await self._http.request("GET", f"{self._v2}/organizations/_all", params=params or {})
        return _r.json()

    async def create_aws_org(self, body: Dict[str, Any]) -> Dict[str, Any]:
        _r = await self._http.request("POST", f"{self._v1}/organizations/aws", json=body)
        return _r.json()

    async def get_my_teams(self) -> Dict[str, Any]:
        _r = await self._http.request("GET", f"{self._v2}/teams/my")
        return _r.json()

    async def update_team_v1(self, team_id: str, body: Dict[str, Any]) -> Dict[str, Any]:
        _r = await self._http.request("PUT", f"{self._v1}/teams/{team_id}", json=body)
        return _r.json()

    async def add_team_users(self, body: Dict[str, Any]) -> Dict[str, Any]:
        _r = await self._http.request("POST", f"{self._v2}/teams/_add_users", json=body)
        return _r.json()

    async def remove_team_users(self, body: Dict[str, Any]) -> Dict[str, Any]:
        _r = await self._http.request("POST", f"{self._v2}/teams/_remove_users", json=body)
        return _r.json()

    async def get_team_workflows(self, team_id: str) -> Dict[str, Any]:
        _r = await self._http.request("GET", f"{self._v1}/teams/{team_id}/workflows")
        return _r.json()

    async def upload_team_icon(self, files: Any) -> Dict[str, Any]:
        base = self._backend_base or self._v1
        _r = await self._http.request("POST", f"{base}/teams/_fileupload", files=files)
        return _r.json()

    async def list_team_users(self, params: Optional[Dict[str, str]] = None) -> Dict[str, Any]:
        _r = await self._http.request("GET", f"{self._v1}/team_users", params=params or {})
        return _r.json()

    async def list_team_invites(self, version: str = "v2") -> Dict[str, Any]:
        _r = await self._http.request("GET", f"{self._base}/{version}/team_users/_invite_list")
        return _r.json()

    async def list_team_users_v2(self, params: Optional[Dict[str, str]] = None) -> Dict[str, Any]:
        _r = await self._http.request("GET", f"{self._v2}/team_users", params=params or {})
        return _r.json()

    async def accept_team_join_request(self, team_id: str, team_user_id: str) -> Dict[str, Any]:
        _r = await self._http.request("POST", f"{self._v2}/teams/{team_id}/user/{team_user_id}/accept")
        return _r.json()

    async def get_team_labels(self, team_id: str) -> Dict[str, Any]:
        _r = await self._http.request("GET", f"{self._v1}/teams/{team_id}/team_labels")
        return _r.json()

    async def list_business_units(self, params: Optional[Dict[str, str]] = None) -> Dict[str, Any]:
        _r = await self._http.request("GET", f"{self._v1}/business_units", params=params or {})
        return _r.json()

    async def update_room(self, room_id: str, body: Dict[str, Any]) -> Dict[str, Any]:
        _r = await self._http.request("PUT", f"{self._v1}/rooms/{room_id}", json=body)
        return _r.json()

    async def get_room_status(self, params: Optional[Dict[str, str]] = None) -> Dict[str, Any]:
        _r = await self._http.request("GET", f"{self._v1}/rooms/_status", params=params or {})
        return _r.json()

    async def join_room(self, body: Dict[str, Any]) -> Dict[str, Any]:
        _r = await self._http.request("POST", f"{self._v1}/rooms/_join", json=body)
        return _r.json()

    async def get_room_status_count(self) -> Dict[str, Any]:
        _r = await self._http.request("GET", f"{self._v1}/rooms/_status_count")
        return _r.json()

    async def search_rooms(self, q: str) -> Dict[str, Any]:
        _r = await self._http.request("GET", f"{self._v1}/rooms/_search", params={"q": q})
        return _r.json()

    async def list_stores(self) -> Dict[str, Any]:
        _r = await self._http.request("GET", f"{self._v1}/stores")
        return _r.json()

    async def create_store(self, body: Dict[str, Any]) -> Dict[str, Any]:
        _r = await self._http.request("POST", f"{self._v1}/stores/_create_with_fp", json=body)
        return _r.json()

    async def update_store(self, body: Dict[str, Any]) -> Dict[str, Any]:
        _r = await self._http.request("POST", f"{self._v1}/stores/_modify_with_fp", json=body)
        return _r.json()

    async def get_store(self, store_id: str) -> Dict[str, Any]:
        _r = await self._http.request("GET", f"{self._v1}/stores/{store_id}")
        return _r.json()

    async def get_facebook_pages(self, params: Optional[Dict[str, str]] = None) -> Dict[str, Any]:
        _r = await self._http.request("GET", f"{self._v1}/facebooks", params=params or {})
        return _r.json()

    async def auth_facebook_pages(self, body: Dict[str, Any]) -> Dict[str, Any]:
        _r = await self._http.request("POST", f"{self._v1}/facebook/_auth_pages", json=body)
        return _r.json()

    async def cancel_facebook_pages(self, body: Dict[str, Any]) -> Dict[str, Any]:
        _r = await self._http.request("POST", f"{self._v1}/facebook/_cancel_pages", json=body)
        return _r.json()

    async def create_mail_channel(self, body: Dict[str, Any]) -> Dict[str, Any]:
        _r = await self._http.request("POST", f"{self._v1}/mail_channels", json=body)
        return _r.json()

    async def get_mail_channel(self, channel_id: str) -> Dict[str, Any]:
        _r = await self._http.request("GET", f"{self._v1}/mail_channels/{channel_id}")
        return _r.json()

    async def init_channel(self, body: Dict[str, Any]) -> Dict[str, Any]:
        _r = await self._http.request("POST", f"{self._v1}/init_channel", json=body)
        return _r.json()

    async def get_contact_v2(self, contact_id: str) -> Dict[str, Any]:
        _r = await self._http.request("GET", f"{self._v2}/contacts/{contact_id}")
        return _r.json()

    async def update_contact_v2(self, contact_id: str, body: Dict[str, Any]) -> Dict[str, Any]:
        _r = await self._http.request("PUT", f"{self._v2}/contacts/{contact_id}", json=body)
        return _r.json()

    async def list_credentials(self) -> Dict[str, Any]:
        _r = await self._http.request("GET", f"{self._v1}/credentials")
        return _r.json()

    async def get_credential_types(self, params: Optional[Dict[str, str]] = None) -> Dict[str, Any]:
        _r = await self._http.request("GET", f"{self._v1}/workflow/credential-types", params=params or {})
        return _r.json()

    async def get_credential_type_by_name(self, name: str) -> Dict[str, Any]:
        _r = await self._http.request("GET", f"{self._v1}/workflow/credential-types/{name}")
        return _r.json()

    async def list_processed_credential_types(self) -> Dict[str, Any]:
        _r = await self._http.request("GET", f"{self._v1}/workflow/processed-credential-types")
        return _r.json()

    async def get_credential_param(self, params: Optional[Dict[str, str]] = None) -> Dict[str, Any]:
        _r = await self._http.request("GET", f"{self._v1}/workflow/_credentialParam", params=params or {})
        return _r.json()

    async def list_knowledge(self) -> Dict[str, Any]:
        _r = await self._http.request("GET", f"{self._v1}/knowledge")
        return _r.json()

    async def upload_knowledge(self, files: Any) -> Dict[str, Any]:
        _r = await self._http.request("POST", f"{self._v1}/knowledge/upload", files=files)
        return _r.json()

    async def list_resources(self) -> Dict[str, Any]:
        _r = await self._http.request("GET", f"{self._v1}/resources")
        return _r.json()
