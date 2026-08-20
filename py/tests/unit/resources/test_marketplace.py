import pytest
from pytest_httpx import HTTPXMock
from imbrace import ImbraceClient

GW = "https://app-gatewayv2.imbrace.co"
BACKEND = f"{GW}/v2/backend"
MP = f"{BACKEND}/marketplaces"
TP = f"{BACKEND}/templates"

@pytest.fixture
def client():
    return ImbraceClient(api_key="test_key")

def test_list_use_case_templates(httpx_mock: HTTPXMock, client):
    httpx_mock.add_response(url=f"{TP}", json={"data": []})
    res = client.marketplace.list_use_case_templates()
    assert res == {"data": []}

def test_list_products(httpx_mock: HTTPXMock, client):
    httpx_mock.add_response(url=f"{MP}/products", json={"data": []})
    res = client.marketplace.list_products()
    assert res == {"data": []}

def test_get_product(httpx_mock: HTTPXMock, client):
    httpx_mock.add_response(url=f"{MP}/products/p_1", json={"id": "p_1"})
    res = client.marketplace.get_product("p_1")
    assert res["id"] == "p_1"

def test_create_order(httpx_mock: HTTPXMock, client):
    httpx_mock.add_response(url=f"{MP}/installations/p_1", method="POST", json={"id": "o_1"})
    res = client.marketplace.create_order({"product_id": "p_1"})
    assert res["id"] == "o_1"

def test_list_orders(httpx_mock: HTTPXMock, client):
    httpx_mock.add_response(url=f"{MP}/orders", json={"data": []})
    res = client.marketplace.list_orders()
    assert res == {"data": []}

def test_update_order_status(httpx_mock: HTTPXMock, client):
    httpx_mock.add_response(url=f"{MP}/orders/o_1/status", method="PATCH", json={"success": True})
    res = client.marketplace.update_order_status("o_1", "paid")
    assert res["success"] is True

def test_list_categories(httpx_mock: HTTPXMock, client):
    httpx_mock.add_response(url=f"{MP}/categories", json={"data": []})
    res = client.marketplace.list_categories()
    assert res == {"data": []}
