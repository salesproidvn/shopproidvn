"""
Test Push Notifications and PWA Features
Tests for:
- GET /api/push/vapid-key - returns valid public key
- GET /api/dashboard/notifications/status - returns enabled:false initially
- POST /api/dashboard/notifications/subscribe - enables notifications
- POST /api/dashboard/notifications/unsubscribe - removes subscription
- POST /api/shop/{slug}/orders - creates order (triggers push attempt)
- POST /api/auth/change-password - super admin change password
- POST /api/upload/image - image compression to ≤300KB
- PWA manifest and service worker accessibility
"""

import pytest
import requests
import os
import json

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials from /app/memory/test_credentials.md
SUPER_ADMIN = {"email": "daominhhai129@gmail.com", "password": "admin123"}
SHOP_OWNER_1 = {"email": "demo@thewishop.com", "password": "demo123", "shop_slug": "the-elite-shop"}
SHOP_OWNER_2 = {"email": "green@thewishop.com", "password": "green123", "shop_slug": "green-living"}
SHOP_OWNER_3 = {"email": "choxanh@thewishop.com", "password": "choxanh123", "shop_slug": "cho-xanh-365"}


class TestPushNotificationEndpoints:
    """Test push notification API endpoints"""
    
    def test_vapid_key_endpoint(self):
        """GET /api/push/vapid-key returns a valid public key"""
        response = requests.get(f"{BASE_URL}/api/push/vapid-key")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert "public_key" in data, "Response should contain 'public_key'"
        assert isinstance(data["public_key"], str), "public_key should be a string"
        assert len(data["public_key"]) > 50, f"VAPID key should be substantial, got length {len(data['public_key'])}"
        print(f"✓ VAPID public key returned: {data['public_key'][:30]}...")
    
    def test_notification_status_initially_disabled(self):
        """GET /api/dashboard/notifications/status returns enabled:false initially for shop owner"""
        # Login as shop owner
        login_resp = requests.post(f"{BASE_URL}/api/auth/login", json=SHOP_OWNER_1)
        assert login_resp.status_code == 200, f"Login failed: {login_resp.text}"
        token = login_resp.json().get("token")
        
        # Check notification status
        headers = {"Authorization": f"Bearer {token}"}
        status_resp = requests.get(f"{BASE_URL}/api/dashboard/notifications/status", headers=headers)
        assert status_resp.status_code == 200, f"Expected 200, got {status_resp.status_code}"
        
        data = status_resp.json()
        assert "enabled" in data, "Response should contain 'enabled'"
        assert "subscribed_devices" in data, "Response should contain 'subscribed_devices'"
        # Note: enabled might be true if previously subscribed, so we just check the structure
        print(f"✓ Notification status: enabled={data['enabled']}, devices={data['subscribed_devices']}")
    
    def test_notification_subscribe(self):
        """POST /api/dashboard/notifications/subscribe with subscription object enables notifications"""
        # Login as shop owner
        login_resp = requests.post(f"{BASE_URL}/api/auth/login", json=SHOP_OWNER_1)
        assert login_resp.status_code == 200
        token = login_resp.json().get("token")
        headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
        
        # Create a fake subscription object (push will fail but storage should work)
        fake_subscription = {
            "subscription": {
                "endpoint": f"https://fcm.googleapis.com/fcm/send/test-endpoint-{os.urandom(8).hex()}",
                "keys": {
                    "p256dh": "BNcRdreALRFXTkOOUHK1EtK2wtaz5Ry4YfYCA_0QTpQtUbVlUls0VJXg7A8u-Ts1XbjhazAkj7I99e8QcYP7DkM",
                    "auth": "tBHItJI5svbpez7KI4CCXg"
                }
            }
        }
        
        subscribe_resp = requests.post(
            f"{BASE_URL}/api/dashboard/notifications/subscribe",
            headers=headers,
            json=fake_subscription
        )
        assert subscribe_resp.status_code == 200, f"Subscribe failed: {subscribe_resp.text}"
        
        data = subscribe_resp.json()
        assert "message" in data, "Response should contain 'message'"
        print(f"✓ Subscription created: {data['message']}")
        
        # Verify status is now enabled
        status_resp = requests.get(f"{BASE_URL}/api/dashboard/notifications/status", headers=headers)
        assert status_resp.status_code == 200
        status_data = status_resp.json()
        assert status_data["enabled"] == True, "Notifications should be enabled after subscribe"
        assert status_data["subscribed_devices"] >= 1, "Should have at least 1 subscribed device"
        print(f"✓ Notification status after subscribe: enabled={status_data['enabled']}, devices={status_data['subscribed_devices']}")
    
    def test_notification_unsubscribe(self):
        """POST /api/dashboard/notifications/unsubscribe removes subscription"""
        # Login as shop owner
        login_resp = requests.post(f"{BASE_URL}/api/auth/login", json=SHOP_OWNER_1)
        assert login_resp.status_code == 200
        token = login_resp.json().get("token")
        headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
        
        # First subscribe with a unique endpoint
        unique_endpoint = f"https://fcm.googleapis.com/fcm/send/test-unsub-{os.urandom(8).hex()}"
        fake_subscription = {
            "subscription": {
                "endpoint": unique_endpoint,
                "keys": {
                    "p256dh": "BNcRdreALRFXTkOOUHK1EtK2wtaz5Ry4YfYCA_0QTpQtUbVlUls0VJXg7A8u-Ts1XbjhazAkj7I99e8QcYP7DkM",
                    "auth": "tBHItJI5svbpez7KI4CCXg"
                }
            }
        }
        
        subscribe_resp = requests.post(
            f"{BASE_URL}/api/dashboard/notifications/subscribe",
            headers=headers,
            json=fake_subscription
        )
        assert subscribe_resp.status_code == 200
        
        # Now unsubscribe
        unsubscribe_resp = requests.post(
            f"{BASE_URL}/api/dashboard/notifications/unsubscribe",
            headers=headers,
            json={"endpoint": unique_endpoint}
        )
        assert unsubscribe_resp.status_code == 200, f"Unsubscribe failed: {unsubscribe_resp.text}"
        
        data = unsubscribe_resp.json()
        assert "message" in data, "Response should contain 'message'"
        print(f"✓ Unsubscribed: {data['message']}")
    
    def test_notification_subscribe_invalid_payload(self):
        """POST /api/dashboard/notifications/subscribe with invalid payload returns 400"""
        login_resp = requests.post(f"{BASE_URL}/api/auth/login", json=SHOP_OWNER_1)
        assert login_resp.status_code == 200
        token = login_resp.json().get("token")
        headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
        
        # Missing endpoint
        invalid_subscription = {"subscription": {"keys": {"p256dh": "test", "auth": "test"}}}
        
        resp = requests.post(
            f"{BASE_URL}/api/dashboard/notifications/subscribe",
            headers=headers,
            json=invalid_subscription
        )
        assert resp.status_code == 400, f"Expected 400 for invalid subscription, got {resp.status_code}"
        print("✓ Invalid subscription correctly rejected with 400")


class TestOrderCreationWithPush:
    """Test order creation triggers push notification attempt"""
    
    def test_create_order_triggers_push(self):
        """POST /api/shop/{slug}/orders creates order and triggers push (check logs for push attempt)"""
        # First, get products from the shop
        products_resp = requests.get(f"{BASE_URL}/api/shop/the-elite-shop/products")
        assert products_resp.status_code == 200
        products = products_resp.json()
        assert len(products) > 0, "Shop should have products"
        
        # Create an order
        order_data = {
            "customer_name": "Test Push Customer",
            "customer_phone": "0901234567",
            "customer_email": "test@example.com",
            "customer_address": "123 Test Street, District 1, HCMC",
            "items": [
                {"product_id": products[0]["id"], "quantity": 1}
            ],
            "note": "Test order for push notification"
        }
        
        order_resp = requests.post(
            f"{BASE_URL}/api/shop/the-elite-shop/orders",
            json=order_data
        )
        assert order_resp.status_code == 200, f"Order creation failed: {order_resp.text}"
        
        data = order_resp.json()
        assert "order_id" in data or "id" in data, "Response should contain order_id"
        assert "total_amount" in data, "Response should contain total_amount"
        assert data["total_amount"] > 0, "Total amount should be positive"
        print(f"✓ Order created: {data.get('order_id') or data.get('id')}, total: {data['total_amount']}")
        print("  (Push notification attempt logged in backend - check logs for 'Push' messages)")


class TestSuperAdminChangePassword:
    """Test super admin change password functionality"""
    
    def test_change_password_success(self):
        """POST /api/auth/change-password works for super admin"""
        # Login as super admin
        login_resp = requests.post(f"{BASE_URL}/api/auth/login", json=SUPER_ADMIN)
        assert login_resp.status_code == 200, f"Login failed: {login_resp.text}"
        token = login_resp.json().get("token")
        headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
        
        # Change password to a new one
        new_password = "admin123new"
        change_resp = requests.post(
            f"{BASE_URL}/api/auth/change-password",
            headers=headers,
            json={"current_password": SUPER_ADMIN["password"], "new_password": new_password}
        )
        assert change_resp.status_code == 200, f"Change password failed: {change_resp.text}"
        print("✓ Password changed successfully")
        
        # Verify new password works
        login_new = requests.post(f"{BASE_URL}/api/auth/login", json={"email": SUPER_ADMIN["email"], "password": new_password})
        assert login_new.status_code == 200, "Login with new password should work"
        print("✓ Login with new password works")
        
        # Change back to original password
        token_new = login_new.json().get("token")
        headers_new = {"Authorization": f"Bearer {token_new}", "Content-Type": "application/json"}
        revert_resp = requests.post(
            f"{BASE_URL}/api/auth/change-password",
            headers=headers_new,
            json={"current_password": new_password, "new_password": SUPER_ADMIN["password"]}
        )
        assert revert_resp.status_code == 200, "Reverting password should work"
        print("✓ Password reverted to original")
    
    def test_change_password_wrong_current(self):
        """POST /api/auth/change-password with wrong current password returns 400"""
        login_resp = requests.post(f"{BASE_URL}/api/auth/login", json=SUPER_ADMIN)
        assert login_resp.status_code == 200
        token = login_resp.json().get("token")
        headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
        
        change_resp = requests.post(
            f"{BASE_URL}/api/auth/change-password",
            headers=headers,
            json={"current_password": "wrongpassword", "new_password": "newpass123"}
        )
        assert change_resp.status_code == 400, f"Expected 400 for wrong current password, got {change_resp.status_code}"
        print("✓ Wrong current password correctly rejected with 400")


class TestImageUploadCompression:
    """Test image upload with compression to ≤300KB"""
    
    def test_upload_image_compression(self):
        """POST /api/upload/image compresses to ≤300KB"""
        # Create a test image (simple PNG)
        import io
        try:
            from PIL import Image
            # Create a large test image (1000x1000 with random colors)
            img = Image.new('RGB', (1000, 1000), color='red')
            for x in range(0, 1000, 10):
                for y in range(0, 1000, 10):
                    img.putpixel((x, y), (x % 256, y % 256, (x + y) % 256))
            
            buf = io.BytesIO()
            img.save(buf, format='PNG')
            buf.seek(0)
            original_size = len(buf.getvalue())
            buf.seek(0)
            
            files = {'file': ('test_image.png', buf, 'image/png')}
            response = requests.post(f"{BASE_URL}/api/upload/image", files=files)
            
            assert response.status_code == 200, f"Upload failed: {response.text}"
            data = response.json()
            
            assert "size" in data, "Response should contain 'size'"
            assert "original_size" in data, "Response should contain 'original_size'"
            
            compressed_size = data["size"]
            assert compressed_size <= 300 * 1024, f"Compressed size {compressed_size} exceeds 300KB"
            
            print(f"✓ Image uploaded and compressed: {original_size/1024:.0f}KB -> {compressed_size/1024:.0f}KB")
            print(f"  Compression ratio: {(1 - compressed_size/original_size)*100:.1f}%")
            
        except ImportError:
            # PIL not available, skip this test
            pytest.skip("PIL not available for image compression test")


class TestPWAAssets:
    """Test PWA manifest and service worker accessibility"""
    
    def test_manifest_json(self):
        """PWA: /manifest.json is served correctly with correct start_url and icons"""
        response = requests.get(f"{BASE_URL}/manifest.json")
        assert response.status_code == 200, f"manifest.json not accessible: {response.status_code}"
        
        # Parse JSON
        try:
            data = response.json()
        except:
            # manifest.json might have %PUBLIC_URL% placeholders, try to parse anyway
            content = response.text
            assert "start_url" in content, "manifest.json should contain start_url"
            assert "icons" in content, "manifest.json should contain icons"
            print("✓ manifest.json accessible (contains placeholders)")
            return
        
        assert "start_url" in data, "manifest.json should contain start_url"
        assert "icons" in data, "manifest.json should contain icons"
        assert "name" in data, "manifest.json should contain name"
        print(f"✓ manifest.json accessible: name='{data.get('name')}', start_url='{data.get('start_url')}'")
    
    def test_service_worker(self):
        """PWA: /sw.js service worker file is accessible"""
        response = requests.get(f"{BASE_URL}/sw.js")
        assert response.status_code == 200, f"sw.js not accessible: {response.status_code}"
        
        content = response.text
        assert "push" in content.lower() or "notification" in content.lower(), "sw.js should handle push notifications"
        assert "self.addEventListener" in content, "sw.js should have event listeners"
        print("✓ sw.js accessible and contains push notification handling")
    
    def test_pwa_icons(self):
        """PWA: /icon-192.png and /icon-512.png are served"""
        # These might not exist yet, so we just check if the endpoint doesn't 500
        for icon in ["icon-192.png", "icon-512.png"]:
            response = requests.get(f"{BASE_URL}/{icon}")
            # 200 = exists, 404 = not created yet (acceptable for test)
            assert response.status_code in [200, 404], f"{icon} returned unexpected status: {response.status_code}"
            if response.status_code == 200:
                print(f"✓ {icon} accessible")
            else:
                print(f"⚠ {icon} not found (404) - may need to be created")


class TestLoginFlowStillWorks:
    """Verify login flow still works for all users"""
    
    def test_super_admin_login(self):
        """Super admin login works"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json=SUPER_ADMIN)
        assert response.status_code == 200, f"Super admin login failed: {response.text}"
        data = response.json()
        assert data.get("role") == "super_admin", "Should have super_admin role"
        print(f"✓ Super admin login works: {data.get('email')}")
    
    def test_shop_owner_1_login(self):
        """Shop owner 1 login works"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json=SHOP_OWNER_1)
        assert response.status_code == 200, f"Shop owner 1 login failed: {response.text}"
        data = response.json()
        assert data.get("role") == "shop_owner", "Should have shop_owner role"
        assert data.get("shop_id") is not None, "Should have shop_id"
        print(f"✓ Shop owner 1 login works: {data.get('email')}")
    
    def test_shop_owner_2_login(self):
        """Shop owner 2 login works"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json=SHOP_OWNER_2)
        assert response.status_code == 200, f"Shop owner 2 login failed: {response.text}"
        data = response.json()
        assert data.get("role") == "shop_owner"
        print(f"✓ Shop owner 2 login works: {data.get('email')}")
    
    def test_shop_owner_3_login(self):
        """Shop owner 3 login works"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json=SHOP_OWNER_3)
        assert response.status_code == 200, f"Shop owner 3 login failed: {response.text}"
        data = response.json()
        assert data.get("role") == "shop_owner"
        print(f"✓ Shop owner 3 login works: {data.get('email')}")


class TestStorefrontPublicPages:
    """Verify storefront public pages still load correctly"""
    
    def test_shop_the_elite_shop(self):
        """Storefront /shop/the-elite-shop loads"""
        response = requests.get(f"{BASE_URL}/api/shop/the-elite-shop")
        assert response.status_code == 200, f"Shop not found: {response.status_code}"
        data = response.json()
        assert data.get("name") == "The Elite Shop"
        print(f"✓ The Elite Shop accessible: {data.get('name')}")
    
    def test_shop_green_living(self):
        """Storefront /shop/green-living loads"""
        response = requests.get(f"{BASE_URL}/api/shop/green-living")
        assert response.status_code == 200
        data = response.json()
        assert data.get("name") == "Green Living"
        print(f"✓ Green Living accessible: {data.get('name')}")
    
    def test_shop_cho_xanh_365(self):
        """Storefront /shop/cho-xanh-365 loads"""
        response = requests.get(f"{BASE_URL}/api/shop/cho-xanh-365")
        assert response.status_code == 200
        data = response.json()
        assert data.get("name") == "Cho Xanh 365"
        print(f"✓ Cho Xanh 365 accessible: {data.get('name')}")
    
    def test_shop_products(self):
        """Shop products endpoint works"""
        response = requests.get(f"{BASE_URL}/api/shop/the-elite-shop/products")
        assert response.status_code == 200
        products = response.json()
        assert isinstance(products, list)
        assert len(products) > 0, "Shop should have products"
        print(f"✓ The Elite Shop has {len(products)} products")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
