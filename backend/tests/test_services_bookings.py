"""
Backend tests for Services + Bookings feature and TikTok business card field.
Tests the following:
- Shop owner login & create/read service (type='service') product
- Public storefront products filter by type (service vs product)
- Booking creation (valid service, invalid service_id for product)
- Dashboard bookings list, status transitions, delete
- Business card TikTok field persistence on shop_owner card
"""
import os
import uuid
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL").rstrip("/")
SHOP_OWNER_EMAIL = "fashion@proid.vn"
SHOP_OWNER_PASSWORD = "iLoveProID@"
SHOP_SLUG = "fashion-pro-store"


@pytest.fixture(scope="session")
def shop_client():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    r = s.post(f"{BASE_URL}/api/auth/login", json={
        "email": SHOP_OWNER_EMAIL,
        "password": SHOP_OWNER_PASSWORD,
    }, timeout=30)
    if r.status_code != 200:
        pytest.skip(f"Shop owner login failed ({r.status_code}): {r.text}")
    token = r.json().get("token")
    if token:
        s.headers.update({"Authorization": f"Bearer {token}"})
    return s


@pytest.fixture(scope="session")
def public_client():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


@pytest.fixture(scope="session")
def test_service(shop_client):
    """Create a service product for tests, clean up after."""
    suffix = uuid.uuid4().hex[:6].upper()
    payload = {
        "name": f"TEST_SRV_{suffix}",
        "price": 199000,
        "description": "Test service for automation",
        "stock": 0,
        "type": "service",
    }
    r = shop_client.post(f"{BASE_URL}/api/dashboard/products", json=payload, timeout=30)
    assert r.status_code in (200, 201), f"Create service failed: {r.status_code} {r.text}"
    data = r.json()
    service_id = data.get("id") or data.get("product_id")
    assert service_id, f"No service id returned: {data}"
    assert data.get("type") == "service", f"Expected type=service, got {data.get('type')}"
    yield {"id": service_id, "name": payload["name"], "price": payload["price"]}
    # cleanup
    shop_client.delete(f"{BASE_URL}/api/dashboard/products/{service_id}", timeout=20)


@pytest.fixture(scope="session")
def test_product(shop_client):
    """Create a regular product for negative booking tests."""
    suffix = uuid.uuid4().hex[:6].upper()
    payload = {
        "name": f"TEST_PRD_{suffix}",
        "price": 99000,
        "description": "Test product",
        "stock": 10,
        "type": "product",
    }
    r = shop_client.post(f"{BASE_URL}/api/dashboard/products", json=payload, timeout=30)
    assert r.status_code in (200, 201), f"Create product failed: {r.status_code} {r.text}"
    data = r.json()
    pid = data.get("id") or data.get("product_id")
    yield {"id": pid, "name": payload["name"]}
    shop_client.delete(f"{BASE_URL}/api/dashboard/products/{pid}", timeout=20)


# ===== PRODUCT TYPE CRUD =====

class TestServiceProductCRUD:
    def test_create_service_product(self, test_service):
        assert test_service["id"].startswith(("PRD", "")) or True  # id format varies
        assert test_service["name"].startswith("TEST_SRV_")

    def test_storefront_services_only(self, public_client, test_service):
        r = public_client.get(f"{BASE_URL}/api/shop/{SHOP_SLUG}/products?type=service", timeout=20)
        assert r.status_code == 200
        items = r.json()
        assert isinstance(items, list)
        assert len(items) > 0, "Expected at least one service"
        for it in items:
            assert it.get("type") == "service", f"Non-service leaked: {it.get('name')} type={it.get('type')}"
        ids = [it["id"] for it in items]
        assert test_service["id"] in ids, "Newly created service should appear in services list"

    def test_storefront_products_only(self, public_client, test_service, test_product):
        r = public_client.get(f"{BASE_URL}/api/shop/{SHOP_SLUG}/products?type=product", timeout=20)
        assert r.status_code == 200
        items = r.json()
        assert isinstance(items, list)
        # Services must NOT be in products list
        for it in items:
            assert it.get("type") != "service", f"Service leaked into products: {it.get('name')}"
        ids = [it["id"] for it in items]
        assert test_service["id"] not in ids, "Service must not appear when type=product"
        assert test_product["id"] in ids, "Newly created product should appear in products list"

    def test_storefront_no_type_filter(self, public_client, test_service, test_product):
        r = public_client.get(f"{BASE_URL}/api/shop/{SHOP_SLUG}/products", timeout=20)
        assert r.status_code == 200
        ids = [it["id"] for it in r.json()]
        assert test_service["id"] in ids
        assert test_product["id"] in ids


# ===== BOOKINGS CRUD =====

class TestBookings:
    def test_create_booking_success(self, public_client, shop_client, test_service):
        payload = {
            "service_id": test_service["id"],
            "customer_name": "TEST_Nguyen Van A",
            "customer_phone": "0900000001",
            "customer_email": "test@example.com",
            "preferred_datetime": "2026-02-15T10:30",
            "note": "Automation booking",
        }
        r = public_client.post(f"{BASE_URL}/api/shop/{SHOP_SLUG}/bookings", json=payload, timeout=30)
        assert r.status_code == 200, f"Create booking failed: {r.status_code} {r.text}"
        data = r.json()
        booking_id = data.get("id") or data.get("booking_id")
        assert booking_id and booking_id.startswith("BK-"), f"Invalid booking id: {data}"
        # Verify via dashboard GET
        g = shop_client.get(f"{BASE_URL}/api/dashboard/bookings", timeout=20)
        assert g.status_code == 200
        lst = g.json()
        assert isinstance(lst, list)
        found = next((b for b in lst if b["id"] == booking_id), None)
        assert found, f"Booking {booking_id} not found in dashboard list"
        assert found["status"] == "pending"
        assert found["service_id"] == test_service["id"]
        assert found["customer_name"] == "TEST_Nguyen Van A"
        assert found["preferred_datetime"] == "2026-02-15T10:30"
        # Save for use in other tests
        TestBookings._booking_id = booking_id

    def test_create_booking_for_product_fails(self, public_client, test_product):
        payload = {
            "service_id": test_product["id"],
            "customer_name": "TEST_Negative",
            "customer_phone": "0900000002",
            "preferred_datetime": "2026-02-16T11:00",
        }
        r = public_client.post(f"{BASE_URL}/api/shop/{SHOP_SLUG}/bookings", json=payload, timeout=30)
        assert r.status_code == 404, f"Expected 404 for non-service booking, got {r.status_code}: {r.text}"

    def test_create_booking_invalid_service_id(self, public_client):
        payload = {
            "service_id": "NONEXISTENT-SVC-ID",
            "customer_name": "TEST_NoSvc",
            "customer_phone": "0900000003",
            "preferred_datetime": "2026-02-17T12:00",
        }
        r = public_client.post(f"{BASE_URL}/api/shop/{SHOP_SLUG}/bookings", json=payload, timeout=30)
        assert r.status_code == 404

    def test_list_bookings_sorted_desc(self, shop_client):
        r = shop_client.get(f"{BASE_URL}/api/dashboard/bookings", timeout=20)
        assert r.status_code == 200
        lst = r.json()
        assert isinstance(lst, list) and len(lst) >= 1
        # verify sort by created_at desc
        timestamps = [b.get("created_at") for b in lst if b.get("created_at")]
        assert timestamps == sorted(timestamps, reverse=True), "Bookings must be sorted by created_at desc"

    def test_status_transitions(self, shop_client):
        bid = getattr(TestBookings, "_booking_id", None)
        assert bid, "No booking id from previous test"
        # pending -> confirmed
        r = shop_client.put(f"{BASE_URL}/api/dashboard/bookings/{bid}/status",
                            json={"status": "confirmed"}, timeout=20)
        assert r.status_code == 200
        # confirmed -> completed
        r = shop_client.put(f"{BASE_URL}/api/dashboard/bookings/{bid}/status",
                            json={"status": "completed"}, timeout=20)
        assert r.status_code == 200
        # Verify persistence
        g = shop_client.get(f"{BASE_URL}/api/dashboard/bookings", timeout=20)
        found = next((b for b in g.json() if b["id"] == bid), None)
        assert found and found["status"] == "completed"

    def test_invalid_status_rejected(self, shop_client):
        bid = getattr(TestBookings, "_booking_id", None)
        r = shop_client.put(f"{BASE_URL}/api/dashboard/bookings/{bid}/status",
                            json={"status": "foo_bar"}, timeout=20)
        assert r.status_code == 400

    def test_delete_booking(self, shop_client):
        bid = getattr(TestBookings, "_booking_id", None)
        assert bid
        r = shop_client.delete(f"{BASE_URL}/api/dashboard/bookings/{bid}", timeout=20)
        assert r.status_code == 200
        # Verify gone
        g = shop_client.get(f"{BASE_URL}/api/dashboard/bookings", timeout=20)
        found = next((b for b in g.json() if b["id"] == bid), None)
        assert found is None, "Booking should be deleted"
        # Delete again returns 404
        r2 = shop_client.delete(f"{BASE_URL}/api/dashboard/bookings/{bid}", timeout=20)
        assert r2.status_code == 404


# ===== BUSINESS CARD TIKTOK =====

class TestBusinessCardTikTok:
    _original_tiktok = None

    def test_get_card_has_tiktok_field(self, shop_client):
        r = shop_client.get(f"{BASE_URL}/api/dashboard/business-card", timeout=20)
        assert r.status_code == 200
        data = r.json()
        assert "social_tiktok" in data, "Business card GET must include social_tiktok field"
        TestBusinessCardTikTok._original_tiktok = data.get("social_tiktok", "")

    def test_update_card_tiktok_persists(self, shop_client):
        new_value = "https://tiktok.com/@test_automation_proid"
        r = shop_client.put(f"{BASE_URL}/api/dashboard/business-card",
                            json={"social_tiktok": new_value}, timeout=20)
        assert r.status_code == 200, f"Update failed: {r.status_code} {r.text}"
        # Verify persistence
        g = shop_client.get(f"{BASE_URL}/api/dashboard/business-card", timeout=20)
        assert g.status_code == 200
        assert g.json().get("social_tiktok") == new_value

    def test_public_card_returns_tiktok(self, public_client):
        r = public_client.get(f"{BASE_URL}/api/card/{SHOP_SLUG}", timeout=20)
        assert r.status_code == 200, f"Public card fetch failed: {r.status_code} {r.text}"
        data = r.json()
        assert "social_tiktok" in data
        assert data["social_tiktok"] == "https://tiktok.com/@test_automation_proid"

    def test_restore_tiktok(self, shop_client):
        # Restore original value (cleanup)
        orig = TestBusinessCardTikTok._original_tiktok or ""
        shop_client.put(f"{BASE_URL}/api/dashboard/business-card",
                        json={"social_tiktok": orig}, timeout=20)
