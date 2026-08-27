import pytest
from pytest_httpx import HTTPXMock
from imbrace import ImbraceClient

GW = "https://app-gatewayv2.imbrace.co"
# MarketplaceResource is wired to urls.marketplaces — the marketplace
# microservice's own router, not the legacy backend.
MP = f"{GW}/marketplaces/v2"

@pytest.fixture
def client():
    return ImbraceClient(api_key="test_key")

def test_list_use_case_templates(httpx_mock: HTTPXMock, client):
    httpx_mock.add_response(url=f"{MP}/market-places/v2/templates", json={"data": []})
    res = client.marketplace.list_use_case_templates()
    assert res == {"data": []}
