"""
Test new features for iteration 25:
1. Security Dashboard API (GET /api/admin/security/dashboard)
2. Public shop API includes expiry_date
3. White screen fix - targeted state updates (frontend only)
"""
import pytest
import requests
import os
import time

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
SUPER_ADMIN_EMAIL = "daominhhai129@gmail.com"
SUPER_ADMIN_PASSWORD = "admin123"
SHOP_OWNER_EMAIL = "demo@thewishop.com"
SHOP_OWNER_PASSWORD = "demo123"
TEST_SHOP_SLUG = "the-elite-shop"
TEST_SHOP_ID = "69d75ed5d0e6605428f90b31"


class TestSecurityDashboard:
    """Test Security Dashboard API endpoint"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Login as super admin before each test"""
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
        
        # Login as super admin
        response = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "email": SUPER_ADMIN_EMAIL,
            "password": SUPER_ADMIN_PASSWORD
        })
        assert response.status_code == 200, f"Super admin login failed: {response.text}"
        data = response.json()
        self.token = data.get("token")
        self.session.headers.update({"Authorization": f"Bearer {self.token}"})
    
    def test_security_dashboard_returns_200(self):
        """Test that security dashboard endpoint returns 200 for super admin"""
        response = self.session.get(f"{BASE_URL}/api/admin/security/dashboard")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        print("✓ Security dashboard returns 200")
    
    def test_security_dashboard_has_rate_limiter_stats(self):
        """Test that security dashboard returns rate limiter stats"""
        response = self.session.get(f"{BASE_URL}/api/admin/security/dashboard")
        assert response.status_code == 200
        data = response.json()
        
        # Check rate_limiter section exists
        assert "rate_limiter" in data, "Missing rate_limiter section"
        rate_limiter = data["rate_limiter"]
        
        # Check required fields
        assert "active_tracked_ips" in rate_limiter, "Missing active_tracked_ips"
        assert "blocked_ips" in rate_limiter, "Missing blocked_ips"
        assert "total_blocked" in rate_limiter, "Missing total_blocked"
        assert "breakdown" in rate_limiter, "Missing breakdown"
        
        # Check breakdown has expected keys
        breakdown = rate_limiter["breakdown"]
        assert "auth" in breakdown, "Missing auth in breakdown"
        assert "orders" in breakdown, "Missing orders in breakdown"
        assert "global" in breakdown, "Missing global in breakdown"
        
        print(f"✓ Rate limiter stats: {rate_limiter['active_tracked_ips']} active IPs, {rate_limiter['total_blocked']} blocked")
    
    def test_security_dashboard_has_brute_force_stats(self):
        """Test that security dashboard returns brute force protection stats"""
        response = self.session.get(f"{BASE_URL}/api/admin/security/dashboard")
        assert response.status_code == 200
        data = response.json()
        
        # Check brute_force section exists
        assert "brute_force" in data, "Missing brute_force section"
        brute_force = data["brute_force"]
        
        # Check required fields
        assert "locked_accounts" in brute_force, "Missing locked_accounts"
        assert "total_locked" in brute_force, "Missing total_locked"
        
        print(f"✓ Brute force stats: {brute_force['total_locked']} locked accounts")
    
    def test_security_dashboard_has_security_config(self):
        """Test that security dashboard returns security configuration"""
        response = self.session.get(f"{BASE_URL}/api/admin/security/dashboard")
        assert response.status_code == 200
        data = response.json()
        
        # Check security_config section exists
        assert "security_config" in data, "Missing security_config section"
        config = data["security_config"]
        
        # Check required fields
        assert "rate_limits" in config, "Missing rate_limits"
        assert "brute_force_threshold" in config, "Missing brute_force_threshold"
        assert "content_word_limit" in config, "Missing content_word_limit"
        assert "max_request_size" in config, "Missing max_request_size"
        assert "security_headers" in config, "Missing security_headers"
        
        # Verify content_word_limit is 1000
        assert config["content_word_limit"] == 1000, f"Expected word limit 1000, got {config['content_word_limit']}"
        
        # Verify security headers list
        expected_headers = ["X-Content-Type-Options", "X-Frame-Options", "X-XSS-Protection", "Referrer-Policy", "Permissions-Policy"]
        for header in expected_headers:
            assert header in config["security_headers"], f"Missing security header: {header}"
        
        print(f"✓ Security config: word limit={config['content_word_limit']}, {len(config['security_headers'])} headers")
    
    def test_security_dashboard_requires_auth(self):
        """Test that security dashboard requires authentication"""
        # Create new session without auth
        session = requests.Session()
        response = session.get(f"{BASE_URL}/api/admin/security/dashboard")
        assert response.status_code == 401, f"Expected 401 without auth, got {response.status_code}"
        print("✓ Security dashboard requires authentication")
    
    def test_security_dashboard_requires_super_admin(self):
        """Test that security dashboard requires super admin role"""
        # Login as shop owner
        session = requests.Session()
        session.headers.update({"Content-Type": "application/json"})
        
        response = session.post(f"{BASE_URL}/api/auth/login", json={
            "email": SHOP_OWNER_EMAIL,
            "password": SHOP_OWNER_PASSWORD
        })
        assert response.status_code == 200, f"Shop owner login failed: {response.text}"
        token = response.json().get("token")
        session.headers.update({"Authorization": f"Bearer {token}"})
        
        # Try to access security dashboard
        response = session.get(f"{BASE_URL}/api/admin/security/dashboard")
        assert response.status_code == 403, f"Expected 403 for shop owner, got {response.status_code}"
        print("✓ Security dashboard requires super admin role")


class TestPublicShopAPIExpiryDate:
    """Test that public shop API includes expiry_date field"""
    
    def test_public_shop_api_includes_expiry_date(self):
        """Test GET /api/shop/{slug} returns expiry_date field"""
        response = requests.get(f"{BASE_URL}/api/shop/{TEST_SHOP_SLUG}")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "expiry_date" in data, "Missing expiry_date field in public shop API response"
        print(f"✓ Public shop API includes expiry_date: '{data['expiry_date']}'")
    
    def test_public_shop_api_returns_all_expected_fields(self):
        """Test that public shop API returns all expected fields"""
        response = requests.get(f"{BASE_URL}/api/shop/{TEST_SHOP_SLUG}")
        assert response.status_code == 200
        
        data = response.json()
        expected_fields = [
            "id", "name", "slug", "description", "logo_url",
            "contact_phone", "contact_email", "address",
            "social_facebook", "social_instagram", "theme_color",
            "banners", "banner_enabled", "blog_enabled",
            "layout_sections", "footer_columns", "menu_items",
            "mega_menu_categories", "custom_pages",
            "max_products", "max_posts", "expiry_date"
        ]
        
        for field in expected_fields:
            assert field in data, f"Missing field: {field}"
        
        print(f"✓ Public shop API returns all {len(expected_fields)} expected fields")


class TestShopExpiryUpdate:
    """Test shop expiry date update functionality"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Login as super admin before each test"""
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
        
        # Login as super admin
        response = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "email": SUPER_ADMIN_EMAIL,
            "password": SUPER_ADMIN_PASSWORD
        })
        assert response.status_code == 200, f"Super admin login failed: {response.text}"
        data = response.json()
        self.token = data.get("token")
        self.session.headers.update({"Authorization": f"Bearer {self.token}"})
    
    def test_set_expiry_date(self):
        """Test setting expiry date on a shop"""
        # Set expiry date to future
        future_date = "2027-12-31T00:00:00.000Z"
        response = self.session.post(
            f"{BASE_URL}/api/admin/shops/{TEST_SHOP_ID}/expiry",
            json={"expiry_date": future_date}
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        # Verify via public API
        response = requests.get(f"{BASE_URL}/api/shop/{TEST_SHOP_SLUG}")
        assert response.status_code == 200
        data = response.json()
        assert data["expiry_date"] == future_date, f"Expiry date not updated: {data['expiry_date']}"
        
        print(f"✓ Set expiry date to {future_date}")
        
        # Clear expiry date
        response = self.session.post(
            f"{BASE_URL}/api/admin/shops/{TEST_SHOP_ID}/expiry",
            json={"expiry_date": None}
        )
        assert response.status_code == 200
        
        # Verify cleared
        response = requests.get(f"{BASE_URL}/api/shop/{TEST_SHOP_SLUG}")
        data = response.json()
        assert data["expiry_date"] == "", f"Expiry date not cleared: {data['expiry_date']}"
        
        print("✓ Cleared expiry date")
    
    def test_set_shop_limits(self):
        """Test setting shop limits"""
        # Set max_products
        response = self.session.put(
            f"{BASE_URL}/api/admin/shops/{TEST_SHOP_ID}/limits",
            json={"max_products": 150}
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        # Verify via admin shops list
        response = self.session.get(f"{BASE_URL}/api/admin/shops")
        assert response.status_code == 200
        shops = response.json()
        shop = next((s for s in shops if s["id"] == TEST_SHOP_ID), None)
        assert shop is not None, "Shop not found in admin list"
        assert shop["max_products"] == 150, f"max_products not updated: {shop['max_products']}"
        
        print("✓ Set max_products to 150")
        
        # Reset to default
        response = self.session.put(
            f"{BASE_URL}/api/admin/shops/{TEST_SHOP_ID}/limits",
            json={"max_products": 100}
        )
        assert response.status_code == 200
        print("✓ Reset max_products to 100")


class TestLoginStillWorks:
    """Verify login still works after security changes"""
    
    def test_super_admin_login(self):
        """Test super admin can still login"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": SUPER_ADMIN_EMAIL,
            "password": SUPER_ADMIN_PASSWORD
        })
        assert response.status_code == 200, f"Super admin login failed: {response.text}"
        data = response.json()
        assert data["role"] == "super_admin", f"Expected super_admin role, got {data['role']}"
        assert "token" in data, "Missing token in response"
        print(f"✓ Super admin login works: {data['email']}")
    
    def test_shop_owner_login(self):
        """Test shop owner can still login"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": SHOP_OWNER_EMAIL,
            "password": SHOP_OWNER_PASSWORD
        })
        assert response.status_code == 200, f"Shop owner login failed: {response.text}"
        data = response.json()
        assert data["role"] == "shop_owner", f"Expected shop_owner role, got {data['role']}"
        assert "token" in data, "Missing token in response"
        print(f"✓ Shop owner login works: {data['email']}")


class TestStorefrontLoads:
    """Test that storefront loads normally for non-expired shops"""
    
    def test_storefront_api_returns_shop_data(self):
        """Test that storefront API returns shop data"""
        response = requests.get(f"{BASE_URL}/api/shop/{TEST_SHOP_SLUG}")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert data["name"] == "The Elite Shop", f"Unexpected shop name: {data['name']}"
        assert data["slug"] == TEST_SHOP_SLUG
        print(f"✓ Storefront API returns shop data: {data['name']}")
    
    def test_storefront_products_api(self):
        """Test that storefront products API works"""
        response = requests.get(f"{BASE_URL}/api/shop/{TEST_SHOP_SLUG}/products")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        products = response.json()
        assert isinstance(products, list), "Expected list of products"
        print(f"✓ Storefront products API returns {len(products)} products")
    
    def test_storefront_categories_api(self):
        """Test that storefront categories API works"""
        response = requests.get(f"{BASE_URL}/api/shop/{TEST_SHOP_SLUG}/categories")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        categories = response.json()
        assert isinstance(categories, list), "Expected list of categories"
        print(f"✓ Storefront categories API returns {len(categories)} categories")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
