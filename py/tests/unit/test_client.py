import os
import pytest
from imbrace import ImbraceClient
from imbrace.environments import ENVIRONMENTS


def test_default_env_is_stable():
    client = ImbraceClient(api_key="test_key")
    assert client.auth._base == f"{ENVIRONMENTS['stable'].gateway}/platform"


def test_env_develop():
    client = ImbraceClient(env="develop", api_key="test_key")
    assert client.auth._base == "https://app-gateway.dev.imbrace.co/platform"
    assert client.ips._base == "https://app-gateway.dev.imbrace.co/ips/v1"


def test_env_sandbox():
    client = ImbraceClient(env="sandbox", api_key="test_key")
    assert client.auth._base == "https://app-gateway.sandbox.imbrace.co/platform"


def test_gateway_override_via_constructor():
    client = ImbraceClient(api_key="test_key", gateway="https://my-proxy.com")
    assert client.auth._base == "https://my-proxy.com/platform"


def test_organization_id_header():
    client = ImbraceClient(api_key="test_key", organization_id="org_123")
    assert client.http.organization_id == "org_123"


def test_set_access_token():
    client = ImbraceClient(api_key="test_key")
    client.set_access_token("new_token")
    assert client.token_manager.get_token() == "new_token"
    client.clear_access_token()
    assert client.token_manager.get_token() is None


def test_strips_trailing_slash_from_gateway():
    client = ImbraceClient(api_key="k", gateway="https://my-proxy.com/")
    assert client.auth._base == "https://my-proxy.com/platform"


def test_warns_when_no_credentials():
    with pytest.warns(UserWarning):
        ImbraceClient()


def test_services_override():
    client = ImbraceClient(api_key="k", services={"platform": "https://custom/platform"})
    assert client.auth._base == "https://custom/platform"


def test_initialises_all_domain_resources():
    client = ImbraceClient(api_key="k")
    for name in ("platform", "channel", "boards", "marketplace", "workflows",
                 "agent", "document_ai", "health", "auth"):
        assert getattr(client, name) is not None, name


def test_clear_access_token():
    client = ImbraceClient(api_key="k")
    client.set_access_token("tok")
    client.clear_access_token()
    assert client.http.token_manager.get_token() is None


def test_init_pings_health(httpx_mock):
    """init() performs a health check against the gateway root."""
    client = ImbraceClient(api_key="k")
    httpx_mock.add_response(url=f"{client.health._base}/", json={"status": "ok"})
    client.init()
    assert len(httpx_mock.get_requests()) == 1
