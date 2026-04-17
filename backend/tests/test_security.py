"""
Security Features Test Suite
Tests: Rate limiting, brute force protection, word limits, XSS sanitization, security headers
"""
import pytest
import requests
import os
import time

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
SHOP_OWNER_EMAIL = "demo@thewishop.com"
SHOP_OWNER_PASSWORD = "demo123"
SUPER_ADMIN_EMAIL = "daominhhai129@gmail.com"
SUPER_ADMIN_PASSWORD = "admin123"


class TestSecurityHeaders:
    """Test security headers are present on API responses"""
    
    def test_security_headers_on_root(self):
        """Security headers should be present on root endpoint"""
        response = requests.get(f"{BASE_URL}/api/")
        assert response.status_code == 200
        
        # Check all required security headers
        assert response.headers.get("X-Content-Type-Options") == "nosniff", "Missing X-Content-Type-Options header"
        assert response.headers.get("X-Frame-Options") == "SAMEORIGIN", "Missing X-Frame-Options header"
        assert response.headers.get("X-XSS-Protection") == "1; mode=block", "Missing X-XSS-Protection header"
        assert response.headers.get("Referrer-Policy") == "strict-origin-when-cross-origin", "Missing Referrer-Policy header"
        assert "camera=()" in response.headers.get("Permissions-Policy", ""), "Missing Permissions-Policy header"
        print("✓ All security headers present on root endpoint")
    
    def test_security_headers_on_auth_endpoint(self):
        """Security headers should be present on auth endpoints"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "nonexistent@test.com",
            "password": "wrongpass"
        })
        # Even on 401, headers should be present
        assert response.headers.get("X-Content-Type-Options") == "nosniff"
        assert response.headers.get("X-Frame-Options") == "SAMEORIGIN"
        print("✓ Security headers present on auth endpoint")


class TestSecurityStatusEndpoint:
    """Test GET /api/security/status endpoint"""
    
    def test_security_status_returns_features(self):
        """Security status endpoint should return list of enabled features"""
        response = requests.get(f"{BASE_URL}/api/security/status")
        assert response.status_code == 200
        
        data = response.json()
        assert "security_features" in data
        features = data["security_features"]
        
        # Verify all expected features are listed
        assert features.get("rate_limiting") == True, "rate_limiting should be True"
        assert features.get("brute_force_protection") == True, "brute_force_protection should be True"
        assert features.get("content_word_limit") == 1000, "content_word_limit should be 1000"
        assert features.get("xss_sanitization") == True, "xss_sanitization should be True"
        assert features.get("security_headers") == True, "security_headers should be True"
        assert features.get("request_size_limit") == "10MB", "request_size_limit should be 10MB"
        print(f"✓ Security status endpoint returns correct features: {features}")


class TestBruteForceProtection:
    """Test brute force protection on login endpoint"""
    
    def test_brute_force_lockout_after_5_attempts(self):
        """5 failed login attempts should trigger lockout (429)"""
        # Use a unique email to avoid affecting other tests
        test_email = f"bruteforce_test_{int(time.time())}@test.com"
        
        # Make 5 failed login attempts
        for i in range(5):
            response = requests.post(f"{BASE_URL}/api/auth/login", json={
                "email": test_email,
                "password": "wrongpassword"
            })
            # First 5 should return 401 (invalid credentials)
            if i < 4:
                assert response.status_code == 401, f"Attempt {i+1}: Expected 401, got {response.status_code}"
                print(f"  Attempt {i+1}: 401 (expected)")
        
        # 6th attempt should be rate limited (429)
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": test_email,
            "password": "wrongpassword"
        })
        # After 5 failures, should get 429
        assert response.status_code == 429, f"Expected 429 after 5 failures, got {response.status_code}"
        print(f"✓ Brute force protection working: 429 returned after 5 failed attempts")


class TestNormalLoginStillWorks:
    """Verify normal login still works after security changes"""
    
    def test_shop_owner_login(self):
        """Shop owner should be able to login with correct credentials"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": SHOP_OWNER_EMAIL,
            "password": SHOP_OWNER_PASSWORD
        })
        assert response.status_code == 200, f"Login failed: {response.text}"
        data = response.json()
        assert "token" in data
        assert data["email"] == SHOP_OWNER_EMAIL
        print(f"✓ Shop owner login successful: {data['email']}")
    
    def test_super_admin_login(self):
        """Super admin should be able to login with correct credentials"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": SUPER_ADMIN_EMAIL,
            "password": SUPER_ADMIN_PASSWORD
        })
        assert response.status_code == 200, f"Login failed: {response.text}"
        data = response.json()
        assert "token" in data
        assert data["role"] == "super_admin"
        print(f"✓ Super admin login successful: {data['email']}")


@pytest.fixture(scope="module")
def shop_owner_token():
    """Get shop owner auth token - module scoped to avoid rate limits"""
    # Wait a bit to avoid rate limit from previous tests
    time.sleep(2)
    response = requests.post(f"{BASE_URL}/api/auth/login", json={
        "email": SHOP_OWNER_EMAIL,
        "password": SHOP_OWNER_PASSWORD
    })
    if response.status_code == 429:
        # Wait and retry if rate limited
        time.sleep(5)
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": SHOP_OWNER_EMAIL,
            "password": SHOP_OWNER_PASSWORD
        })
    assert response.status_code == 200, f"Login failed: {response.status_code} - {response.text}"
    return response.json()["token"]


class TestContentWordLimit:
    """Test word limit validation for products and posts"""
    
    def test_product_create_exceeds_word_limit(self, shop_owner_token):
        """Creating product with >1000 words in description should return 400"""
        # Generate text with >1000 words
        long_description = " ".join(["word"] * 1050)  # 1050 words
        
        response = requests.post(
            f"{BASE_URL}/api/dashboard/products",
            headers={"Authorization": f"Bearer {shop_owner_token}"},
            json={
                "name": "TEST_WordLimit_Product",
                "price": 10000,
                "description": long_description,
                "stock": 10
            }
        )
        assert response.status_code == 400, f"Expected 400 for >1000 words, got {response.status_code}"
        assert "1000" in response.text or "giới hạn" in response.text.lower()
        print(f"✓ Product creation with >1000 words rejected: {response.json()}")
    
    def test_product_create_within_word_limit(self, shop_owner_token):
        """Creating product with <1000 words should succeed"""
        short_description = " ".join(["word"] * 50)  # 50 words
        
        response = requests.post(
            f"{BASE_URL}/api/dashboard/products",
            headers={"Authorization": f"Bearer {shop_owner_token}"},
            json={
                "name": f"TEST_ValidProduct_{int(time.time())}",
                "price": 10000,
                "description": short_description,
                "stock": 10
            }
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert "id" in data
        print(f"✓ Product creation with <1000 words succeeded: {data['id']}")
        
        # Cleanup - delete the test product
        prod_id = data["id"]
        requests.delete(
            f"{BASE_URL}/api/dashboard/products/{prod_id}",
            headers={"Authorization": f"Bearer {shop_owner_token}"}
        )
    
    def test_post_create_exceeds_word_limit(self, shop_owner_token):
        """Creating post with >1000 words in description should return 400"""
        long_description = " ".join(["word"] * 1050)  # 1050 words
        
        response = requests.post(
            f"{BASE_URL}/api/dashboard/posts",
            headers={"Authorization": f"Bearer {shop_owner_token}"},
            json={
                "title": "TEST_WordLimit_Post",
                "description": long_description,
                "thumbnail": ""
            }
        )
        assert response.status_code == 400, f"Expected 400 for >1000 words, got {response.status_code}"
        assert "1000" in response.text or "giới hạn" in response.text.lower()
        print(f"✓ Post creation with >1000 words rejected: {response.json()}")
    
    def test_post_create_within_word_limit(self, shop_owner_token):
        """Creating post with <1000 words should succeed"""
        short_description = " ".join(["word"] * 50)  # 50 words
        
        response = requests.post(
            f"{BASE_URL}/api/dashboard/posts",
            headers={"Authorization": f"Bearer {shop_owner_token}"},
            json={
                "title": f"TEST_ValidPost_{int(time.time())}",
                "description": short_description,
                "thumbnail": ""
            }
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert "id" in data
        print(f"✓ Post creation with <1000 words succeeded: {data['id']}")
        
        # Cleanup
        post_id = data["id"]
        requests.delete(
            f"{BASE_URL}/api/dashboard/posts/{post_id}",
            headers={"Authorization": f"Bearer {shop_owner_token}"}
        )


class TestXSSSanitization:
    """Test XSS sanitization for user inputs"""
    
    def test_product_description_xss_sanitized(self, shop_owner_token):
        """Product description with <script> tags should have them stripped"""
        xss_description = "<p>Normal text</p><script>alert('XSS')</script><b>Bold text</b>"
        
        response = requests.post(
            f"{BASE_URL}/api/dashboard/products",
            headers={"Authorization": f"Bearer {shop_owner_token}"},
            json={
                "name": f"TEST_XSS_Product_{int(time.time())}",
                "price": 10000,
                "description": xss_description,
                "stock": 10
            }
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        
        # Verify script tags are stripped (bleach with strip=True removes tags but keeps text content)
        assert "<script>" not in data["description"], "Script tags should be stripped"
        assert "</script>" not in data["description"], "Script closing tags should be stripped"
        # Verify allowed tags are preserved
        assert "<p>" in data["description"], "Allowed <p> tag should be preserved"
        assert "<b>" in data["description"], "Allowed <b> tag should be preserved"
        print(f"✓ XSS sanitization working: script tags stripped, allowed tags preserved")
        print(f"  Original: {xss_description}")
        print(f"  Sanitized: {data['description']}")
        
        # Cleanup
        prod_id = data["id"]
        requests.delete(
            f"{BASE_URL}/api/dashboard/products/{prod_id}",
            headers={"Authorization": f"Bearer {shop_owner_token}"}
        )


class TestRateLimiting:
    """Test rate limiting on various endpoints"""
    
    def test_auth_rate_limit_info(self):
        """Verify rate limiting is configured (via security status)"""
        response = requests.get(f"{BASE_URL}/api/security/status")
        assert response.status_code == 200
        data = response.json()
        assert data["security_features"]["rate_limiting"] == True
        print("✓ Rate limiting is enabled according to security status")
    
    # Note: Full rate limit testing (120 req/min) would be too slow for unit tests
    # The brute force test above already validates the rate limiting mechanism works


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
