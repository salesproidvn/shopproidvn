"""
Backend API Tests for Micro-SaaS E-commerce Platform Migration
Tests all authentication, admin, shop owner, and public storefront endpoints
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://shop-desktop-ui.preview.emergentagent.com').rstrip('/')

# Test credentials from test_credentials.md
SUPER_ADMIN = {"email": "daominhhai129@gmail.com", "password": "admin123"}
SHOP_OWNER_1 = {"email": "demo@thewishop.com", "password": "demo123", "shop_slug": "the-elite-shop"}
SHOP_OWNER_2 = {"email": "green@thewishop.com", "password": "green123", "shop_slug": "green-living"}
SHOP_OWNER_3 = {"email": "choxanh@thewishop.com", "password": "choxanh123", "shop_slug": "cho-xanh-365"}


class TestHealthCheck:
    """Basic API health check"""
    
    def test_api_root(self):
        """Test API root endpoint"""
        response = requests.get(f"{BASE_URL}/api/")
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        print(f"✓ API root: {data['message']}")


class TestAuthentication:
    """Authentication endpoint tests"""
    
    def test_super_admin_login(self):
        """Test super admin login - should return token and role=super_admin"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json=SUPER_ADMIN)
        assert response.status_code == 200, f"Login failed: {response.text}"
        data = response.json()
        assert "token" in data, "No token in response"
        assert data["role"] == "super_admin", f"Expected super_admin role, got {data['role']}"
        assert data["email"] == SUPER_ADMIN["email"]
        print(f"✓ Super admin login: {data['email']} (role: {data['role']})")
        return data["token"]
    
    def test_shop_owner_1_login(self):
        """Test shop owner 1 login - The Elite Shop"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": SHOP_OWNER_1["email"],
            "password": SHOP_OWNER_1["password"]
        })
        assert response.status_code == 200, f"Login failed: {response.text}"
        data = response.json()
        assert "token" in data
        assert data["role"] == "shop_owner"
        assert data.get("shop_id") is not None, "Shop owner should have shop_id"
        print(f"✓ Shop owner 1 login: {data['email']} (shop_id: {data['shop_id']})")
        return data["token"], data["shop_id"]
    
    def test_shop_owner_2_login(self):
        """Test shop owner 2 login - Green Living"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": SHOP_OWNER_2["email"],
            "password": SHOP_OWNER_2["password"]
        })
        assert response.status_code == 200, f"Login failed: {response.text}"
        data = response.json()
        assert "token" in data
        assert data["role"] == "shop_owner"
        print(f"✓ Shop owner 2 login: {data['email']} (shop_id: {data.get('shop_id')})")
        return data["token"], data.get("shop_id")
    
    def test_shop_owner_3_login(self):
        """Test shop owner 3 login - Cho Xanh 365"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": SHOP_OWNER_3["email"],
            "password": SHOP_OWNER_3["password"]
        })
        assert response.status_code == 200, f"Login failed: {response.text}"
        data = response.json()
        assert "token" in data
        assert data["role"] == "shop_owner"
        print(f"✓ Shop owner 3 login: {data['email']} (shop_id: {data.get('shop_id')})")
        return data["token"], data.get("shop_id")
    
    def test_invalid_login(self):
        """Test login with invalid credentials"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "invalid@test.com",
            "password": "wrongpassword"
        })
        assert response.status_code == 401
        print("✓ Invalid login correctly rejected")
    
    def test_auth_me_with_token(self):
        """Test /auth/me endpoint with valid token"""
        # First login
        login_resp = requests.post(f"{BASE_URL}/api/auth/login", json=SUPER_ADMIN)
        token = login_resp.json()["token"]
        
        # Then check /auth/me
        response = requests.get(f"{BASE_URL}/api/auth/me", headers={"Authorization": f"Bearer {token}"})
        assert response.status_code == 200
        data = response.json()
        assert data["email"] == SUPER_ADMIN["email"]
        assert data["role"] == "super_admin"
        print(f"✓ Auth me: {data['email']} (role: {data['role']})")


class TestForgotPassword:
    """Password reset flow tests"""
    
    def test_forgot_password_generates_token(self):
        """Test forgot password endpoint returns reset token"""
        response = requests.post(f"{BASE_URL}/api/auth/forgot-password", json={
            "email": SUPER_ADMIN["email"]
        })
        assert response.status_code == 200
        data = response.json()
        assert "reset_token" in data, "Should return reset_token for testing"
        print(f"✓ Forgot password: token generated for {SUPER_ADMIN['email']}")
        return data["reset_token"]
    
    def test_reset_password_with_token(self):
        """Test reset password with valid token"""
        # Get reset token
        forgot_resp = requests.post(f"{BASE_URL}/api/auth/forgot-password", json={
            "email": SUPER_ADMIN["email"]
        })
        token = forgot_resp.json()["reset_token"]
        
        # Reset password (use same password to not break other tests)
        response = requests.post(f"{BASE_URL}/api/auth/reset-password", json={
            "token": token,
            "new_password": SUPER_ADMIN["password"]  # Keep same password
        })
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        print(f"✓ Reset password: {data['message']}")
    
    def test_reset_password_invalid_token(self):
        """Test reset password with invalid token"""
        response = requests.post(f"{BASE_URL}/api/auth/reset-password", json={
            "token": "invalid_token_12345",
            "new_password": "newpassword123"
        })
        assert response.status_code == 400
        print("✓ Invalid reset token correctly rejected")


class TestSuperAdminEndpoints:
    """Super admin dashboard endpoints"""
    
    @pytest.fixture
    def admin_token(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json=SUPER_ADMIN)
        return response.json()["token"]
    
    def test_admin_stats(self, admin_token):
        """Test admin stats endpoint"""
        response = requests.get(f"{BASE_URL}/api/admin/stats", 
                               headers={"Authorization": f"Bearer {admin_token}"})
        assert response.status_code == 200
        data = response.json()
        assert "total_shops" in data
        assert "active_shops" in data
        assert "total_orders" in data
        assert "total_shop_owners" in data
        print(f"✓ Admin stats: {data['total_shops']} shops, {data['total_orders']} orders")
    
    def test_admin_shops_list(self, admin_token):
        """Test admin shops list - should show 3 shops"""
        response = requests.get(f"{BASE_URL}/api/admin/shops",
                               headers={"Authorization": f"Bearer {admin_token}"})
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) >= 3, f"Expected at least 3 shops, got {len(data)}"
        
        # Check shop data structure
        for shop in data:
            assert "id" in shop
            assert "name" in shop
            assert "slug" in shop
            assert "product_count" in shop
            assert "order_count" in shop
        
        shop_names = [s["name"] for s in data]
        print(f"✓ Admin shops: {shop_names}")
        return data
    
    def test_admin_users_list(self, admin_token):
        """Test admin users list"""
        response = requests.get(f"{BASE_URL}/api/admin/users",
                               headers={"Authorization": f"Bearer {admin_token}"})
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        
        # Should have at least super admin + 3 shop owners
        assert len(data) >= 4, f"Expected at least 4 users, got {len(data)}"
        
        roles = [u["role"] for u in data]
        assert "super_admin" in roles
        assert "shop_owner" in roles
        print(f"✓ Admin users: {len(data)} users")
    
    def test_maintenance_preview(self, admin_token):
        """Test maintenance preview endpoint"""
        response = requests.get(f"{BASE_URL}/api/admin/maintenance/preview",
                               headers={"Authorization": f"Bearer {admin_token}"})
        assert response.status_code == 200
        data = response.json()
        assert "old_orders_count" in data
        assert "orphaned_files_count" in data
        print(f"✓ Maintenance preview: {data['old_orders_count']} old orders, {data['orphaned_files_count']} orphaned files")


class TestShopOwnerDashboard:
    """Shop owner dashboard endpoints"""
    
    @pytest.fixture
    def shop_owner_token(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": SHOP_OWNER_1["email"],
            "password": SHOP_OWNER_1["password"]
        })
        return response.json()["token"]
    
    def test_dashboard_stats(self, shop_owner_token):
        """Test dashboard stats for shop owner"""
        response = requests.get(f"{BASE_URL}/api/dashboard/stats",
                               headers={"Authorization": f"Bearer {shop_owner_token}"})
        assert response.status_code == 200
        data = response.json()
        assert "total_products" in data
        assert "total_orders" in data
        assert "pending_orders" in data
        assert "total_revenue" in data
        print(f"✓ Dashboard stats: {data['total_products']} products, {data['total_orders']} orders")
    
    def test_dashboard_shop(self, shop_owner_token):
        """Test dashboard shop details"""
        response = requests.get(f"{BASE_URL}/api/dashboard/shop",
                               headers={"Authorization": f"Bearer {shop_owner_token}"})
        assert response.status_code == 200
        data = response.json()
        assert "id" in data
        assert "name" in data
        assert "slug" in data
        print(f"✓ Dashboard shop: {data['name']} (slug: {data['slug']})")
    
    def test_dashboard_products(self, shop_owner_token):
        """Test dashboard products list"""
        response = requests.get(f"{BASE_URL}/api/dashboard/products",
                               headers={"Authorization": f"Bearer {shop_owner_token}"})
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Dashboard products: {len(data)} products")
    
    def test_dashboard_categories(self, shop_owner_token):
        """Test dashboard categories list"""
        response = requests.get(f"{BASE_URL}/api/dashboard/categories",
                               headers={"Authorization": f"Bearer {shop_owner_token}"})
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Dashboard categories: {len(data)} categories")
    
    def test_dashboard_orders(self, shop_owner_token):
        """Test dashboard orders list"""
        response = requests.get(f"{BASE_URL}/api/dashboard/orders",
                               headers={"Authorization": f"Bearer {shop_owner_token}"})
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Dashboard orders: {len(data)} orders")
    
    def test_dashboard_posts(self, shop_owner_token):
        """Test dashboard posts list"""
        response = requests.get(f"{BASE_URL}/api/dashboard/posts",
                               headers={"Authorization": f"Bearer {shop_owner_token}"})
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Dashboard posts: {len(data)} posts")
    
    def test_dashboard_pages(self, shop_owner_token):
        """Test dashboard pages list"""
        response = requests.get(f"{BASE_URL}/api/dashboard/pages",
                               headers={"Authorization": f"Bearer {shop_owner_token}"})
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Dashboard pages: {len(data)} pages")
    
    def test_dashboard_menu(self, shop_owner_token):
        """Test dashboard menu items"""
        response = requests.get(f"{BASE_URL}/api/dashboard/menu",
                               headers={"Authorization": f"Bearer {shop_owner_token}"})
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Dashboard menu: {len(data)} menu items")
    
    def test_dashboard_mega_menu(self, shop_owner_token):
        """Test dashboard mega menu"""
        response = requests.get(f"{BASE_URL}/api/dashboard/mega-menu",
                               headers={"Authorization": f"Bearer {shop_owner_token}"})
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Dashboard mega menu: {len(data)} items")


class TestPublicStorefront:
    """Public storefront endpoints"""
    
    def test_shop_the_elite_shop(self):
        """Test public shop endpoint for The Elite Shop"""
        response = requests.get(f"{BASE_URL}/api/shop/the-elite-shop")
        assert response.status_code == 200
        data = response.json()
        assert data["slug"] == "the-elite-shop"
        assert "name" in data
        assert "theme_color" in data
        print(f"✓ Public shop: {data['name']} (slug: {data['slug']})")
    
    def test_shop_green_living(self):
        """Test public shop endpoint for Green Living"""
        response = requests.get(f"{BASE_URL}/api/shop/green-living")
        assert response.status_code == 200
        data = response.json()
        assert data["slug"] == "green-living"
        print(f"✓ Public shop: {data['name']} (slug: {data['slug']})")
    
    def test_shop_cho_xanh_365(self):
        """Test public shop endpoint for Cho Xanh 365"""
        response = requests.get(f"{BASE_URL}/api/shop/cho-xanh-365")
        assert response.status_code == 200
        data = response.json()
        assert data["slug"] == "cho-xanh-365"
        print(f"✓ Public shop: {data['name']} (slug: {data['slug']})")
    
    def test_shop_products(self):
        """Test public shop products endpoint"""
        response = requests.get(f"{BASE_URL}/api/shop/the-elite-shop/products")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Public shop products: {len(data)} products")
    
    def test_shop_categories(self):
        """Test public shop categories endpoint"""
        response = requests.get(f"{BASE_URL}/api/shop/the-elite-shop/categories")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Public shop categories: {len(data)} categories")
    
    def test_shop_posts(self):
        """Test public shop posts endpoint"""
        response = requests.get(f"{BASE_URL}/api/shop/the-elite-shop/posts")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Public shop posts: {len(data)} posts")
    
    def test_shop_contact_form(self):
        """Test public shop contact form submission"""
        response = requests.post(f"{BASE_URL}/api/shop/the-elite-shop/contact", json={
            "name": "Test User",
            "email": "test@example.com",
            "phone": "0123456789",
            "message": "This is a test message"
        })
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        print(f"✓ Contact form: {data['message']}")
    
    def test_shop_not_found(self):
        """Test non-existent shop returns 404"""
        response = requests.get(f"{BASE_URL}/api/shop/non-existent-shop-12345")
        assert response.status_code == 404
        print("✓ Non-existent shop correctly returns 404")


class TestShopLimits:
    """Test shop limits update endpoint"""
    
    def test_update_shop_limits(self):
        """Test PUT /api/admin/shops/{shop_id}/limits"""
        # Login as admin
        login_resp = requests.post(f"{BASE_URL}/api/auth/login", json=SUPER_ADMIN)
        token = login_resp.json()["token"]
        
        # Get shops list to get a shop_id
        shops_resp = requests.get(f"{BASE_URL}/api/admin/shops",
                                  headers={"Authorization": f"Bearer {token}"})
        shops = shops_resp.json()
        shop_id = shops[0]["id"]
        
        # Update limits
        response = requests.put(f"{BASE_URL}/api/admin/shops/{shop_id}/limits",
                               headers={"Authorization": f"Bearer {token}"},
                               json={"max_products": 150, "max_posts": 75})
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        print(f"✓ Shop limits updated: {data['message']}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
