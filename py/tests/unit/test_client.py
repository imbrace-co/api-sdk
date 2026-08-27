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
