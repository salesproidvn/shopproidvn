#!/usr/bin/env python3
"""
Multi-tenant E-commerce Platform API Testing
Tests Super Admin, Shop Owner, and Public Storefront functionality
"""

import requests
import sys
import json
from datetime import datetime

class MultiTenantEcommerceAPITester:
    def __init__(self, base_url="https://multi-tenant-shop-14.preview.emergentagent.com/api"):
        self.base_url = base_url
        self.session = requests.Session()
        self.session.headers.update({'Content-Type': 'application/json'})
        self.tests_run = 0
        self.tests_passed = 0
        self.admin_data = None
        self.shop_owner_data = None
        self.created_shop_owner_id = None
        self.demo_shop_slug = "the-elite-shop"

    def log_test(self, name, success, details=""):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {name}")
        else:
            print(f"❌ {name} - {details}")
        return success

    def test_api_root(self):
        """Test API root endpoint"""
        try:
            response = self.session.get(f"{self.base_url}/")
            success = response.status_code == 200
            return self.log_test("API Root", success, f"Status: {response.status_code}")
        except Exception as e:
            return self.log_test("API Root", False, str(e))

    # ==================== SUPER ADMIN TESTS ====================

    def test_super_admin_login(self):
        """Test super admin login"""
        try:
            login_data = {
                "email": "admin@thewishop.com",
                "password": "admin123"
            }
            response = self.session.post(f"{self.base_url}/auth/login", json=login_data)
            success = response.status_code == 200
            if success:
                self.admin_data = response.json()
                # Check if role is super_admin
                success = self.admin_data.get("role") == "super_admin"
            return self.log_test("Super Admin Login", success, f"Status: {response.status_code}")
        except Exception as e:
            return self.log_test("Super Admin Login", False, str(e))

    def test_super_admin_stats(self):
        """Test super admin dashboard stats"""
        try:
            response = self.session.get(f"{self.base_url}/admin/stats")
            success = response.status_code == 200
            if success:
                data = response.json()
                # Check if required stats are present
                required_keys = ['total_shops', 'active_shops', 'total_orders', 'total_shop_owners', 'total_revenue']
                success = all(key in data for key in required_keys)
            return self.log_test("Super Admin Stats", success, f"Status: {response.status_code}")
        except Exception as e:
            return self.log_test("Super Admin Stats", False, str(e))

    def test_super_admin_get_shops(self):
        """Test super admin get all shops"""
        try:
            response = self.session.get(f"{self.base_url}/admin/shops")
            success = response.status_code == 200
            if success:
                shops = response.json()
                success = isinstance(shops, list) and len(shops) > 0
            return self.log_test("Super Admin Get Shops", success, f"Status: {response.status_code}")
        except Exception as e:
            return self.log_test("Super Admin Get Shops", False, str(e))

    def test_super_admin_get_users(self):
        """Test super admin get all users"""
        try:
            response = self.session.get(f"{self.base_url}/admin/users")
            success = response.status_code == 200
            if success:
                users = response.json()
                success = isinstance(users, list) and len(users) > 0
            return self.log_test("Super Admin Get Users", success, f"Status: {response.status_code}")
        except Exception as e:
            return self.log_test("Super Admin Get Users", False, str(e))

    def test_super_admin_create_shop_owner(self):
        """Test super admin create shop owner"""
        try:
            timestamp = datetime.now().strftime("%H%M%S")
            shop_owner_data = {
                "email": f"testowner{timestamp}@test.com",
                "password": "testpass123",
                "name": f"Test Owner {timestamp}",
                "shop_name": f"Test Shop {timestamp}"
            }
            response = self.session.post(f"{self.base_url}/admin/users", json=shop_owner_data)
            success = response.status_code == 200
            if success:
                created_user = response.json()
                self.created_shop_owner_id = created_user.get("id")
            return self.log_test("Super Admin Create Shop Owner", success, f"Status: {response.status_code}")
        except Exception as e:
            return self.log_test("Super Admin Create Shop Owner", False, str(e))

    # ==================== SHOP OWNER TESTS ====================

    def test_shop_owner_login(self):
        """Test shop owner login"""
        try:
            login_data = {
                "email": "demo@thewishop.com",
                "password": "demo123"
            }
            response = self.session.post(f"{self.base_url}/auth/login", json=login_data)
            success = response.status_code == 200
            if success:
                self.shop_owner_data = response.json()
                # Check if role is shop_owner and has shop_id
                success = (self.shop_owner_data.get("role") == "shop_owner" and 
                          self.shop_owner_data.get("shop_id") is not None)
            return self.log_test("Shop Owner Login", success, f"Status: {response.status_code}")
        except Exception as e:
            return self.log_test("Shop Owner Login", False, str(e))

    def test_shop_owner_dashboard_stats(self):
        """Test shop owner dashboard stats"""
        try:
            response = self.session.get(f"{self.base_url}/dashboard/stats")
            success = response.status_code == 200
            if success:
                data = response.json()
                # Check if required stats are present
                required_keys = ['total_products', 'total_orders', 'pending_orders', 'total_revenue']
                success = all(key in data for key in required_keys)
            return self.log_test("Shop Owner Dashboard Stats", success, f"Status: {response.status_code}")
        except Exception as e:
            return self.log_test("Shop Owner Dashboard Stats", False, str(e))

    def test_shop_owner_get_shop(self):
        """Test shop owner get shop details"""
        try:
            response = self.session.get(f"{self.base_url}/dashboard/shop")
            success = response.status_code == 200
            if success:
                shop = response.json()
                # Check if shop has required fields
                required_keys = ['id', 'name', 'slug']
                success = all(key in shop for key in required_keys)
            return self.log_test("Shop Owner Get Shop", success, f"Status: {response.status_code}")
        except Exception as e:
            return self.log_test("Shop Owner Get Shop", False, str(e))

    def test_shop_owner_update_shop(self):
        """Test shop owner update shop"""
        try:
            update_data = {
                "description": "Updated shop description for testing"
            }
            response = self.session.put(f"{self.base_url}/dashboard/shop", json=update_data)
            success = response.status_code == 200
            return self.log_test("Shop Owner Update Shop", success, f"Status: {response.status_code}")
        except Exception as e:
            return self.log_test("Shop Owner Update Shop", False, str(e))

    def test_shop_owner_get_products(self):
        """Test shop owner get products"""
        try:
            response = self.session.get(f"{self.base_url}/dashboard/products")
            success = response.status_code == 200
            if success:
                products = response.json()
                success = isinstance(products, list)
            return self.log_test("Shop Owner Get Products", success, f"Status: {response.status_code}")
        except Exception as e:
            return self.log_test("Shop Owner Get Products", False, str(e))

    def test_shop_owner_create_category(self):
        """Test shop owner create category"""
        try:
            timestamp = datetime.now().strftime("%H%M%S")
            category_data = {
                "name": f"Test Category {timestamp}",
                "description": "Test category description"
            }
            response = self.session.post(f"{self.base_url}/dashboard/categories", json=category_data)
            success = response.status_code == 200
            return self.log_test("Shop Owner Create Category", success, f"Status: {response.status_code}")
        except Exception as e:
            return self.log_test("Shop Owner Create Category", False, str(e))

    def test_shop_owner_get_categories(self):
        """Test shop owner get categories"""
        try:
            response = self.session.get(f"{self.base_url}/dashboard/categories")
            success = response.status_code == 200
            if success:
                categories = response.json()
                success = isinstance(categories, list)
            return self.log_test("Shop Owner Get Categories", success, f"Status: {response.status_code}")
        except Exception as e:
            return self.log_test("Shop Owner Get Categories", False, str(e))

    def test_shop_owner_create_product(self):
        """Test shop owner create product"""
        try:
            timestamp = datetime.now().strftime("%H%M%S")
            product_data = {
                "name": f"Test Product {timestamp}",
                "price": 100000,
                "description": "Test product description",
                "image_url": "https://images.unsplash.com/photo-1722891067479-5fd39edbfc3d?w=500",
                "stock": 10
            }
            response = self.session.post(f"{self.base_url}/dashboard/products", json=product_data)
            success = response.status_code == 200
            return self.log_test("Shop Owner Create Product", success, f"Status: {response.status_code}")
        except Exception as e:
            return self.log_test("Shop Owner Create Product", False, str(e))

    def test_shop_owner_get_orders(self):
        """Test shop owner get orders"""
        try:
            response = self.session.get(f"{self.base_url}/dashboard/orders")
            success = response.status_code == 200
            if success:
                orders = response.json()
                success = isinstance(orders, list)
            return self.log_test("Shop Owner Get Orders", success, f"Status: {response.status_code}")
        except Exception as e:
            return self.log_test("Shop Owner Get Orders", False, str(e))

    # ==================== PUBLIC STOREFRONT TESTS ====================

    def test_public_get_shop_by_slug(self):
        """Test public get shop by slug"""
        try:
            response = self.session.get(f"{self.base_url}/shop/{self.demo_shop_slug}")
            success = response.status_code == 200
            if success:
                shop = response.json()
                # Check if shop has required fields
                required_keys = ['id', 'name', 'slug']
                success = all(key in shop for key in required_keys)
            return self.log_test("Public Get Shop by Slug", success, f"Status: {response.status_code}")
        except Exception as e:
            return self.log_test("Public Get Shop by Slug", False, str(e))

    def test_public_get_shop_products(self):
        """Test public get shop products"""
        try:
            response = self.session.get(f"{self.base_url}/shop/{self.demo_shop_slug}/products")
            success = response.status_code == 200
            if success:
                products = response.json()
                success = isinstance(products, list) and len(products) > 0
            return self.log_test("Public Get Shop Products", success, f"Status: {response.status_code}")
        except Exception as e:
            return self.log_test("Public Get Shop Products", False, str(e))

    def test_public_get_shop_categories(self):
        """Test public get shop categories"""
        try:
            response = self.session.get(f"{self.base_url}/shop/{self.demo_shop_slug}/categories")
            success = response.status_code == 200
            if success:
                categories = response.json()
                success = isinstance(categories, list)
            return self.log_test("Public Get Shop Categories", success, f"Status: {response.status_code}")
        except Exception as e:
            return self.log_test("Public Get Shop Categories", False, str(e))

    def test_public_create_order(self):
        """Test public create order"""
        try:
            order_data = {
                "customer_name": "Test Customer",
                "customer_phone": "0123456789",
                "customer_email": "test@example.com",
                "customer_address": "123 Test Street",
                "items": [
                    {"product_id": "prod-001", "quantity": 1}
                ],
                "note": "Test order"
            }
            response = self.session.post(f"{self.base_url}/shop/{self.demo_shop_slug}/orders", json=order_data)
            success = response.status_code == 200
            if success:
                order_result = response.json()
                success = "order_id" in order_result
            return self.log_test("Public Create Order", success, f"Status: {response.status_code}")
        except Exception as e:
            return self.log_test("Public Create Order", False, str(e))

    # ==================== AUTH TESTS ====================

    def test_auth_me(self):
        """Test get current user"""
        try:
            response = self.session.get(f"{self.base_url}/auth/me")
            success = response.status_code == 200
            if success:
                user = response.json()
                success = "id" in user and "email" in user and "role" in user
            return self.log_test("Auth Me", success, f"Status: {response.status_code}")
        except Exception as e:
            return self.log_test("Auth Me", False, str(e))

    def test_logout(self):
        """Test user logout"""
        try:
            response = self.session.post(f"{self.base_url}/auth/logout")
            success = response.status_code == 200
            return self.log_test("User Logout", success, f"Status: {response.status_code}")
        except Exception as e:
            return self.log_test("User Logout", False, str(e))

    # ==================== CLEANUP TESTS ====================

    def test_cleanup_created_user(self):
        """Clean up created test user (requires super admin)"""
        if not self.created_shop_owner_id:
            return self.log_test("Cleanup Created User", True, "No user to cleanup")
        
        try:
            # Login as super admin first
            login_data = {
                "email": "admin@thewishop.com",
                "password": "admin123"
            }
            self.session.post(f"{self.base_url}/auth/login", json=login_data)
            
            # Delete the created user
            response = self.session.delete(f"{self.base_url}/admin/users/{self.created_shop_owner_id}")
            success = response.status_code == 200
            return self.log_test("Cleanup Created User", success, f"Status: {response.status_code}")
        except Exception as e:
            return self.log_test("Cleanup Created User", False, str(e))

    def run_all_tests(self):
        """Run all API tests"""
        print("🚀 Starting Multi-tenant E-commerce Platform API Tests")
        print("=" * 60)

        # Test basic endpoints
        self.test_api_root()

        # Test Super Admin functionality
        print("\n📋 Testing Super Admin Functionality...")
        self.test_super_admin_login()
        self.test_super_admin_stats()
        self.test_super_admin_get_shops()
        self.test_super_admin_get_users()
        self.test_super_admin_create_shop_owner()

        # Test Shop Owner functionality
        print("\n🏪 Testing Shop Owner Functionality...")
        self.test_shop_owner_login()
        self.test_shop_owner_dashboard_stats()
        self.test_shop_owner_get_shop()
        self.test_shop_owner_update_shop()
        self.test_shop_owner_get_products()
        self.test_shop_owner_get_categories()
        self.test_shop_owner_create_category()
        self.test_shop_owner_create_product()
        self.test_shop_owner_get_orders()

        # Test Auth functionality
        print("\n🔐 Testing Auth Functionality...")
        self.test_auth_me()

        # Test Public Storefront functionality (no auth required)
        print("\n🌐 Testing Public Storefront Functionality...")
        self.test_logout()  # Logout first to test public endpoints
        self.test_public_get_shop_by_slug()
        self.test_public_get_shop_products()
        self.test_public_get_shop_categories()
        self.test_public_create_order()

        # Cleanup
        print("\n🧹 Cleanup...")
        self.test_cleanup_created_user()

        # Print summary
        print("\n" + "=" * 60)
        print(f"📊 Test Results: {self.tests_passed}/{self.tests_run} passed")
        success_rate = (self.tests_passed / self.tests_run) * 100 if self.tests_run > 0 else 0
        print(f"📈 Success Rate: {success_rate:.1f}%")
        
        return self.tests_passed == self.tests_run

def main():
    """Main test execution"""
    tester = MultiTenantEcommerceAPITester()
    success = tester.run_all_tests()
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())