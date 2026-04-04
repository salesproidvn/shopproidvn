#!/usr/bin/env python3
"""
Backend API Testing for The Wi Shop E-commerce Application
Tests all authentication, product, cart, and wishlist endpoints
"""

import requests
import sys
import json
from datetime import datetime

class WiShopAPITester:
    def __init__(self, base_url="https://shop-desktop-ui.preview.emergentagent.com/api"):
        self.base_url = base_url
        self.session = requests.Session()
        self.session.headers.update({'Content-Type': 'application/json'})
        self.tests_run = 0
        self.tests_passed = 0
        self.user_data = None
        self.test_product_id = "prod-001"  # Sony Wireless Headphones

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

    def test_get_products(self):
        """Test getting all products"""
        try:
            response = self.session.get(f"{self.base_url}/products")
            success = response.status_code == 200 and len(response.json()) > 0
            return self.log_test("Get Products", success, f"Status: {response.status_code}, Count: {len(response.json()) if success else 0}")
        except Exception as e:
            return self.log_test("Get Products", False, str(e))

    def test_get_categories(self):
        """Test getting categories"""
        try:
            response = self.session.get(f"{self.base_url}/categories")
            success = response.status_code == 200 and len(response.json()) > 0
            return self.log_test("Get Categories", success, f"Status: {response.status_code}")
        except Exception as e:
            return self.log_test("Get Categories", False, str(e))

    def test_search_products(self):
        """Test product search"""
        try:
            response = self.session.get(f"{self.base_url}/products?search=Sony")
            success = response.status_code == 200
            return self.log_test("Search Products", success, f"Status: {response.status_code}")
        except Exception as e:
            return self.log_test("Search Products", False, str(e))

    def test_filter_products_by_category(self):
        """Test filtering products by category"""
        try:
            response = self.session.get(f"{self.base_url}/products?category=Electronics")
            success = response.status_code == 200
            return self.log_test("Filter Products by Category", success, f"Status: {response.status_code}")
        except Exception as e:
            return self.log_test("Filter Products by Category", False, str(e))

    def test_get_single_product(self):
        """Test getting a single product"""
        try:
            response = self.session.get(f"{self.base_url}/products/{self.test_product_id}")
            success = response.status_code == 200
            return self.log_test("Get Single Product", success, f"Status: {response.status_code}")
        except Exception as e:
            return self.log_test("Get Single Product", False, str(e))

    def test_register_user(self):
        """Test user registration"""
        try:
            timestamp = datetime.now().strftime("%H%M%S")
            user_data = {
                "email": f"testuser{timestamp}@test.com",
                "password": "testpass123",
                "name": f"Test User {timestamp}"
            }
            response = self.session.post(f"{self.base_url}/auth/register", json=user_data)
            success = response.status_code == 200
            if success:
                self.user_data = response.json()
            return self.log_test("User Registration", success, f"Status: {response.status_code}")
        except Exception as e:
            return self.log_test("User Registration", False, str(e))

    def test_login_admin(self):
        """Test admin login"""
        try:
            login_data = {
                "email": "admin@thewishop.com",
                "password": "admin123"
            }
            response = self.session.post(f"{self.base_url}/auth/login", json=login_data)
            success = response.status_code == 200
            if success:
                self.user_data = response.json()
            return self.log_test("Admin Login", success, f"Status: {response.status_code}")
        except Exception as e:
            return self.log_test("Admin Login", False, str(e))

    def test_get_user_profile(self):
        """Test getting current user profile"""
        try:
            response = self.session.get(f"{self.base_url}/auth/me")
            success = response.status_code == 200
            return self.log_test("Get User Profile", success, f"Status: {response.status_code}")
        except Exception as e:
            return self.log_test("Get User Profile", False, str(e))

    def test_add_to_cart(self):
        """Test adding item to cart"""
        try:
            cart_item = {
                "product_id": self.test_product_id,
                "quantity": 2
            }
            response = self.session.post(f"{self.base_url}/cart/add", json=cart_item)
            success = response.status_code == 200
            return self.log_test("Add to Cart", success, f"Status: {response.status_code}")
        except Exception as e:
            return self.log_test("Add to Cart", False, str(e))

    def test_get_cart(self):
        """Test getting cart contents"""
        try:
            response = self.session.get(f"{self.base_url}/cart")
            success = response.status_code == 200
            return self.log_test("Get Cart", success, f"Status: {response.status_code}")
        except Exception as e:
            return self.log_test("Get Cart", False, str(e))

    def test_update_cart_item(self):
        """Test updating cart item quantity"""
        try:
            cart_item = {
                "product_id": self.test_product_id,
                "quantity": 3
            }
            response = self.session.post(f"{self.base_url}/cart/update", json=cart_item)
            success = response.status_code == 200
            return self.log_test("Update Cart Item", success, f"Status: {response.status_code}")
        except Exception as e:
            return self.log_test("Update Cart Item", False, str(e))

    def test_toggle_wishlist(self):
        """Test adding/removing item from wishlist"""
        try:
            response = self.session.post(f"{self.base_url}/wishlist/toggle/{self.test_product_id}")
            success = response.status_code == 200
            return self.log_test("Toggle Wishlist", success, f"Status: {response.status_code}")
        except Exception as e:
            return self.log_test("Toggle Wishlist", False, str(e))

    def test_get_wishlist(self):
        """Test getting wishlist"""
        try:
            response = self.session.get(f"{self.base_url}/wishlist")
            success = response.status_code == 200
            return self.log_test("Get Wishlist", success, f"Status: {response.status_code}")
        except Exception as e:
            return self.log_test("Get Wishlist", False, str(e))

    def test_check_wishlist_status(self):
        """Test checking if item is in wishlist"""
        try:
            response = self.session.get(f"{self.base_url}/wishlist/check/{self.test_product_id}")
            success = response.status_code == 200
            return self.log_test("Check Wishlist Status", success, f"Status: {response.status_code}")
        except Exception as e:
            return self.log_test("Check Wishlist Status", False, str(e))

    def test_remove_from_cart(self):
        """Test removing item from cart"""
        try:
            response = self.session.delete(f"{self.base_url}/cart/{self.test_product_id}")
            success = response.status_code == 200
            return self.log_test("Remove from Cart", success, f"Status: {response.status_code}")
        except Exception as e:
            return self.log_test("Remove from Cart", False, str(e))

    def test_clear_cart(self):
        """Test clearing entire cart"""
        try:
            response = self.session.delete(f"{self.base_url}/cart")
            success = response.status_code == 200
            return self.log_test("Clear Cart", success, f"Status: {response.status_code}")
        except Exception as e:
            return self.log_test("Clear Cart", False, str(e))

    def test_logout(self):
        """Test user logout"""
        try:
            response = self.session.post(f"{self.base_url}/auth/logout")
            success = response.status_code == 200
            return self.log_test("User Logout", success, f"Status: {response.status_code}")
        except Exception as e:
            return self.log_test("User Logout", False, str(e))

    def run_all_tests(self):
        """Run all API tests"""
        print("🚀 Starting The Wi Shop API Tests")
        print("=" * 50)

        # Test basic endpoints
        self.test_api_root()
        self.test_get_products()
        self.test_get_categories()
        self.test_search_products()
        self.test_filter_products_by_category()
        self.test_get_single_product()

        # Test authentication flow
        self.test_register_user()
        self.test_get_user_profile()

        # Test cart operations (requires auth)
        self.test_add_to_cart()
        self.test_get_cart()
        self.test_update_cart_item()

        # Test wishlist operations (requires auth)
        self.test_toggle_wishlist()
        self.test_get_wishlist()
        self.test_check_wishlist_status()

        # Test cleanup operations
        self.test_remove_from_cart()
        self.test_clear_cart()
        self.test_logout()

        # Test admin login
        self.test_login_admin()
        self.test_logout()

        # Print summary
        print("\n" + "=" * 50)
        print(f"📊 Test Results: {self.tests_passed}/{self.tests_run} passed")
        success_rate = (self.tests_passed / self.tests_run) * 100 if self.tests_run > 0 else 0
        print(f"📈 Success Rate: {success_rate:.1f}%")
        
        return self.tests_passed == self.tests_run

def main():
    """Main test execution"""
    tester = WiShopAPITester()
    success = tester.run_all_tests()
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())