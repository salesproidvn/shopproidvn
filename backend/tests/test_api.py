"""
Backend API Tests for The Wi Shop E-commerce Platform
Tests: Auth, Public endpoints, Storefront, Dashboard, Admin
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestHealthCheck:
    """Health check endpoint tests"""
    
    def test_api_root(self):
        """GET /api/ returns success message"""
        response = requests.get(f"{BASE_URL}/api/")
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        assert data["message"] == "The Wi Shop API"
        print("✓ API root endpoint working")


class TestAuth:
    """Authentication endpoint tests"""
    
    def test_login_shop_owner(self):
        """POST /api/auth/login with shop owner credentials"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "demo@thewishop.com",
            "password": "demo123"
        })
        assert response.status_code == 200
        data = response.json()
        assert data["email"] == "demo@thewishop.com"
        assert data["role"] == "shop_owner"
        assert "id" in data
        assert "shop_id" in data
        print(f"✓ Shop owner login successful: {data['name']}")
    
    def test_login_super_admin(self):
        """POST /api/auth/login with super admin credentials"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "admin@thewishop.com",
            "password": "admin123"
        })
        assert response.status_code == 200
        data = response.json()
        assert data["email"] == "admin@thewishop.com"
        assert data["role"] == "super_admin"
        assert "id" in data
        print(f"✓ Super admin login successful: {data['name']}")
    
    def test_login_invalid_credentials(self):
        """POST /api/auth/login with invalid credentials returns 401"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "wrong@email.com",
            "password": "wrongpassword"
        })
        assert response.status_code == 401
        print("✓ Invalid credentials correctly rejected")
    
    def test_get_me_without_auth(self):
        """GET /api/auth/me without auth returns 401"""
        response = requests.get(f"{BASE_URL}/api/auth/me")
        assert response.status_code == 401
        print("✓ Unauthenticated /me request correctly rejected")


class TestPublicEndpoints:
    """Public product and category endpoints"""
    
    def test_get_products(self):
        """GET /api/products returns products sorted by position"""
        response = requests.get(f"{BASE_URL}/api/products")
        assert response.status_code == 200
        products = response.json()
        assert isinstance(products, list)
        assert len(products) >= 12  # At least 12 seeded products
        # Check product structure
        first_product = products[0]
        assert "id" in first_product
        assert "name" in first_product
        assert "price" in first_product
        assert "category" in first_product
        assert "images" in first_product
        assert "position" in first_product
        print(f"✓ GET /api/products returned {len(products)} products")
    
    def test_get_categories(self):
        """GET /api/categories returns categories with positions"""
        response = requests.get(f"{BASE_URL}/api/categories")
        assert response.status_code == 200
        categories = response.json()
        assert isinstance(categories, list)
        assert len(categories) >= 4  # At least 4 seeded categories
        # Check category structure - should be objects with id, name, position
        first_cat = categories[0]
        assert "id" in first_cat
        assert "name" in first_cat
        assert "position" in first_cat
        # Verify core category names exist
        cat_names = [c["name"] for c in categories]
        assert "Electronics" in cat_names
        assert "Fashion" in cat_names
        assert "Home & Garden" in cat_names
        assert "Kitchen" in cat_names
        print(f"✓ GET /api/categories returned {len(categories)} categories: {cat_names}")


class TestStorefront:
    """Public storefront endpoints for the-elite-shop"""
    
    def test_get_shop_info(self):
        """GET /api/shop/the-elite-shop returns shop info with theme_color and custom_domain"""
        response = requests.get(f"{BASE_URL}/api/shop/the-elite-shop")
        assert response.status_code == 200
        shop = response.json()
        assert shop["name"] == "The Elite Shop"
        assert shop["slug"] == "the-elite-shop"
        assert "id" in shop
        assert "description" in shop
        assert "theme_color" in shop
        assert "custom_domain" in shop  # New feature: custom domain in public response
        print(f"✓ GET /api/shop/the-elite-shop returned: {shop['name']}, theme_color: {shop['theme_color']}")
    
    def test_get_shop_products(self):
        """GET /api/shop/the-elite-shop/products returns products sorted by position"""
        response = requests.get(f"{BASE_URL}/api/shop/the-elite-shop/products")
        assert response.status_code == 200
        products = response.json()
        assert isinstance(products, list)
        assert len(products) == 12
        # Check product has required fields
        first_product = products[0]
        assert "id" in first_product
        assert "name" in first_product
        assert "price" in first_product
        assert "images" in first_product
        assert "video_url" in first_product
        assert "position" in first_product
        print(f"✓ GET /api/shop/the-elite-shop/products returned {len(products)} products")
    
    def test_get_shop_categories(self):
        """GET /api/shop/the-elite-shop/categories returns 4 categories with positions"""
        response = requests.get(f"{BASE_URL}/api/shop/the-elite-shop/categories")
        assert response.status_code == 200
        categories = response.json()
        assert isinstance(categories, list)
        assert len(categories) == 4
        # Check category structure
        first_cat = categories[0]
        assert "id" in first_cat
        assert "name" in first_cat
        assert "position" in first_cat
        print(f"✓ GET /api/shop/the-elite-shop/categories returned {len(categories)} categories")
    
    def test_shop_not_found(self):
        """GET /api/shop/nonexistent returns 404"""
        response = requests.get(f"{BASE_URL}/api/shop/nonexistent-shop")
        assert response.status_code == 404
        print("✓ Nonexistent shop correctly returns 404")


class TestDashboardWithAuth:
    """Dashboard endpoints requiring authentication"""
    
    @pytest.fixture(autouse=True)
    def setup_session(self):
        """Login and get session with cookies"""
        self.session = requests.Session()
        response = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "email": "demo@thewishop.com",
            "password": "demo123"
        })
        assert response.status_code == 200
        yield
        # Logout
        self.session.post(f"{BASE_URL}/api/auth/logout")
    
    def test_get_me_with_auth(self):
        """GET /api/auth/me with cookie returns current user"""
        response = self.session.get(f"{BASE_URL}/api/auth/me")
        assert response.status_code == 200
        user = response.json()
        assert user["email"] == "demo@thewishop.com"
        assert user["role"] == "shop_owner"
        assert "shop_id" in user
        print(f"✓ GET /api/auth/me returned: {user['name']}")
    
    def test_get_dashboard_stats(self):
        """GET /api/dashboard/stats returns shop statistics"""
        response = self.session.get(f"{BASE_URL}/api/dashboard/stats")
        assert response.status_code == 200
        stats = response.json()
        assert "total_products" in stats
        assert "total_orders" in stats
        assert "pending_orders" in stats
        assert "total_revenue" in stats
        assert stats["total_products"] == 12
        print(f"✓ Dashboard stats: {stats['total_products']} products, {stats['total_orders']} orders")
    
    def test_get_dashboard_shop(self):
        """GET /api/dashboard/shop returns shop details with custom_domain"""
        response = self.session.get(f"{BASE_URL}/api/dashboard/shop")
        assert response.status_code == 200
        shop = response.json()
        assert shop["name"] == "The Elite Shop"
        assert shop["slug"] == "the-elite-shop"
        assert "custom_domain" in shop  # New feature: custom domain in dashboard response
        assert "theme_color" in shop
        print(f"✓ Dashboard shop: {shop['name']}, custom_domain: {shop.get('custom_domain', '')}")
    
    def test_update_shop_theme_color(self):
        """PUT /api/dashboard/shop updates theme_color"""
        # Update theme color
        response = self.session.put(f"{BASE_URL}/api/dashboard/shop", json={
            "theme_color": "#10B981"  # Green
        })
        assert response.status_code == 200
        
        # Verify the change persisted
        response = self.session.get(f"{BASE_URL}/api/dashboard/shop")
        assert response.status_code == 200
        shop = response.json()
        assert shop["theme_color"] == "#10B981"
        print(f"✓ Theme color updated to: {shop['theme_color']}")
    
    def test_update_shop_custom_domain(self):
        """PUT /api/dashboard/shop updates custom_domain"""
        # Update custom domain
        response = self.session.put(f"{BASE_URL}/api/dashboard/shop", json={
            "custom_domain": "myshop.example.com"
        })
        assert response.status_code == 200
        
        # Verify the change persisted
        response = self.session.get(f"{BASE_URL}/api/dashboard/shop")
        assert response.status_code == 200
        shop = response.json()
        assert shop["custom_domain"] == "myshop.example.com"
        print(f"✓ Custom domain updated to: {shop['custom_domain']}")
    
    def test_get_dashboard_products(self):
        """GET /api/dashboard/products returns shop products"""
        response = self.session.get(f"{BASE_URL}/api/dashboard/products")
        assert response.status_code == 200
        products = response.json()
        assert isinstance(products, list)
        assert len(products) == 12
        # Check product has multi-image and video fields
        first_product = products[0]
        assert "images" in first_product
        assert "video_url" in first_product
        print(f"✓ Dashboard products: {len(products)} products")
    
    def test_get_dashboard_categories(self):
        """GET /api/dashboard/categories returns shop categories"""
        response = self.session.get(f"{BASE_URL}/api/dashboard/categories")
        assert response.status_code == 200
        categories = response.json()
        assert isinstance(categories, list)
        assert len(categories) == 4
        # Check category has position
        first_cat = categories[0]
        assert "position" in first_cat
        print(f"✓ Dashboard categories: {len(categories)} categories")
    
    def test_get_dashboard_orders(self):
        """GET /api/dashboard/orders returns orders"""
        response = self.session.get(f"{BASE_URL}/api/dashboard/orders")
        assert response.status_code == 200
        orders = response.json()
        assert isinstance(orders, list)
        assert len(orders) >= 3  # At least 3 seeded orders
        # Check order structure
        first_order = orders[0]
        assert "id" in first_order
        assert "customer_name" in first_order
        assert "items" in first_order
        assert "total_amount" in first_order
        assert "status" in first_order
        assert "created_at" in first_order
        print(f"✓ Dashboard orders: {len(orders)} orders")


class TestAdminWithAuth:
    """Admin endpoints requiring super admin authentication"""
    
    @pytest.fixture(autouse=True)
    def setup_session(self):
        """Login as super admin"""
        self.session = requests.Session()
        response = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "email": "admin@thewishop.com",
            "password": "admin123"
        })
        assert response.status_code == 200
        yield
        self.session.post(f"{BASE_URL}/api/auth/logout")
    
    def test_get_admin_stats(self):
        """GET /api/admin/stats returns admin statistics"""
        response = self.session.get(f"{BASE_URL}/api/admin/stats")
        assert response.status_code == 200
        stats = response.json()
        assert "total_shops" in stats
        assert "active_shops" in stats
        assert "total_orders" in stats
        assert "total_shop_owners" in stats
        assert "total_revenue" in stats
        print(f"✓ Admin stats: {stats['total_shops']} shops, {stats['total_shop_owners']} owners")
    
    def test_get_admin_shops(self):
        """GET /api/admin/shops returns all shops"""
        response = self.session.get(f"{BASE_URL}/api/admin/shops")
        assert response.status_code == 200
        shops = response.json()
        assert isinstance(shops, list)
        assert len(shops) >= 1
        # Check shop structure
        first_shop = shops[0]
        assert "id" in first_shop
        assert "name" in first_shop
        assert "slug" in first_shop
        assert "status" in first_shop
        print(f"✓ Admin shops: {len(shops)} shops")
    
    def test_get_admin_users(self):
        """GET /api/admin/users returns all users"""
        response = self.session.get(f"{BASE_URL}/api/admin/users")
        assert response.status_code == 200
        users = response.json()
        assert isinstance(users, list)
        assert len(users) >= 2  # At least admin and demo user
        # Check user structure
        first_user = users[0]
        assert "id" in first_user
        assert "email" in first_user
        assert "name" in first_user
        assert "role" in first_user
        print(f"✓ Admin users: {len(users)} users")


class TestOrderCreation:
    """Test order creation flow"""
    
    def test_create_order(self):
        """POST /api/shop/the-elite-shop/orders creates an order"""
        order_data = {
            "customer_name": "TEST_Customer",
            "customer_phone": "0901234567",
            "customer_email": "test@example.com",
            "customer_address": "123 Test Street",
            "items": [
                {"product_id": "prod-1", "quantity": 1}
            ],
            "note": "Test order"
        }
        response = requests.post(f"{BASE_URL}/api/shop/the-elite-shop/orders", json=order_data)
        assert response.status_code == 200
        order = response.json()
        assert "id" in order
        assert "order_id" in order
        assert "total_amount" in order
        assert order["total_amount"] == 2490000  # Price of prod-1
        print(f"✓ Order created: {order['order_id']} with total {order['total_amount']}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
