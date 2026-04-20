"""Tests for product stock-field removal + is_hidden/out_of_stock toggles.

Covers:
- POST /api/dashboard/products does not persist/return 'stock'; saves is_hidden/out_of_stock
- PUT /api/dashboard/products/{id} strips 'stock' from request body; updates toggles
- Public GET /api/shop/{slug}/products excludes is_hidden=True products; keeps out_of_stock=True
- Public GET /api/shop/{slug}/category/{cat_id} filters is_hidden
- Dashboard GET /api/dashboard/products returns all (incl. hidden) for owner
"""
import os
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://multi-tenant-shop-14.preview.emergentagent.com").rstrip("/")
SHOP_EMAIL = "demo@thewishop.com"
SHOP_PASSWORD = "demo123"
SHOP_SLUG = "the-elite-shop"


@pytest.fixture(scope="module")
def owner_client():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    r = s.post(f"{BASE_URL}/api/auth/login", json={"email": SHOP_EMAIL, "password": SHOP_PASSWORD})
    assert r.status_code == 200, f"login failed: {r.status_code} {r.text}"
    token = r.json().get("token")
    assert token
    s.headers.update({"Authorization": f"Bearer {token}"})
    return s


@pytest.fixture(scope="module")
def created_ids():
    ids = []
    yield ids


def _create(owner_client, **overrides):
    payload = {
        "name": "TEST_stock_toggle_product",
        "price": 12345,
        "description": "desc",
        "is_hidden": False,
        "out_of_stock": False,
        "sku": "TEST-SKU-001",
    }
    payload.update(overrides)
    r = owner_client.post(f"{BASE_URL}/api/dashboard/products", json=payload)
    assert r.status_code == 200, f"create failed: {r.status_code} {r.text}"
    return r.json()


class TestStockRemoval:
    def test_create_has_no_stock_field(self, owner_client, created_ids):
        doc = _create(owner_client, name="TEST_no_stock")
        created_ids.append(doc["id"])
        assert "stock" not in doc, f"'stock' should not appear in response: {list(doc.keys())}"
        assert doc["is_hidden"] is False
        assert doc["out_of_stock"] is False

    def test_create_with_toggles(self, owner_client, created_ids):
        doc = _create(owner_client, name="TEST_hidden_oos", is_hidden=True, out_of_stock=True)
        created_ids.append(doc["id"])
        assert doc["is_hidden"] is True
        assert doc["out_of_stock"] is True
        assert "stock" not in doc

        # GET persistence check via dashboard listing
        r = owner_client.get(f"{BASE_URL}/api/dashboard/products")
        assert r.status_code == 200
        found = next((p for p in r.json() if p["id"] == doc["id"]), None)
        assert found, "created doc not in dashboard list"
        assert found["is_hidden"] is True
        assert found["out_of_stock"] is True
        assert "stock" not in found

    def test_update_strips_stock_field(self, owner_client, created_ids):
        doc = _create(owner_client, name="TEST_update_strip")
        created_ids.append(doc["id"])
        pid = doc["id"]

        # Attempt to update with stock field in body
        r = owner_client.put(
            f"{BASE_URL}/api/dashboard/products/{pid}",
            json={"stock": 999, "out_of_stock": True, "is_hidden": True, "name": "TEST_updated"},
        )
        assert r.status_code == 200, f"update failed: {r.text}"
        updated = r.json()
        assert updated["name"] == "TEST_updated"
        assert updated["out_of_stock"] is True
        assert updated["is_hidden"] is True
        assert "stock" not in updated, "stock field must be stripped by server"


class TestPublicVisibility:
    def test_public_list_hides_hidden_and_keeps_oos(self, owner_client, created_ids):
        # Create hidden and oos product
        hidden = _create(owner_client, name="TEST_pub_hidden", is_hidden=True, out_of_stock=False)
        oos = _create(owner_client, name="TEST_pub_oos", is_hidden=False, out_of_stock=True)
        created_ids.extend([hidden["id"], oos["id"]])

        r = requests.get(f"{BASE_URL}/api/shop/{SHOP_SLUG}/products")
        assert r.status_code == 200, r.text
        data = r.json()
        items = data.get("products") if isinstance(data, dict) else data
        ids = {p["id"] for p in items}
        assert hidden["id"] not in ids, "is_hidden=True must be excluded from public list"
        assert oos["id"] in ids, "out_of_stock=True must remain visible"
        oos_item = next(p for p in items if p["id"] == oos["id"])
        assert oos_item.get("out_of_stock") is True
        assert "stock" not in oos_item

    def test_dashboard_owner_sees_hidden(self, owner_client, created_ids):
        # Get the hidden item we created
        hidden_id = next((pid for pid in created_ids if True), None)
        r = owner_client.get(f"{BASE_URL}/api/dashboard/products")
        assert r.status_code == 200
        items = r.json()
        # Find any hidden=True
        hidden_items = [p for p in items if p.get("is_hidden") is True and p["name"].startswith("TEST_")]
        assert len(hidden_items) >= 1, "owner should see their own hidden products"

    def test_public_category_filter_hides_hidden(self, owner_client, created_ids):
        # create category
        r = owner_client.post(f"{BASE_URL}/api/dashboard/categories", json={"name": "TEST_Cat_Toggles"})
        assert r.status_code == 200
        cat_id = r.json()["id"]

        hidden_in_cat = _create(owner_client, name="TEST_cat_hidden", category_id=cat_id, is_hidden=True)
        visible_in_cat = _create(owner_client, name="TEST_cat_visible", category_id=cat_id, is_hidden=False, out_of_stock=True)
        created_ids.extend([hidden_in_cat["id"], visible_in_cat["id"]])

        r = requests.get(f"{BASE_URL}/api/shop/{SHOP_SLUG}/products", params={"category": cat_id})
        assert r.status_code == 200, r.text
        data = r.json()
        items = data.get("products") if isinstance(data, dict) else data
        ids = {p["id"] for p in items}
        assert hidden_in_cat["id"] not in ids, "hidden product must NOT be in public category-filtered list"
        assert visible_in_cat["id"] in ids, "visible/oos product must remain in public category-filtered list"

        # cleanup category
        owner_client.delete(f"{BASE_URL}/api/dashboard/categories/{cat_id}")


def test_zz_cleanup(owner_client, created_ids):
    """Delete all TEST_ products created during testing."""
    for pid in created_ids:
        try:
            owner_client.delete(f"{BASE_URL}/api/dashboard/products/{pid}")
        except Exception:
            pass
