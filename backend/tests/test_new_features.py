"""
Test suite for new features:
- Voucher CRUD and validation
- Agent/Dealer system
- Business Card
- OG Meta Tags
"""
import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials from test_credentials.md
SUPER_ADMIN_EMAIL = "daominhhai129@gmail.com"
SUPER_ADMIN_PASSWORD = "admin123"
SHOP_OWNER_EMAIL = "demo1@proid.vn"
SHOP_OWNER_PASSWORD = "iLoveProID@"

class TestAuth:
    """Authentication tests"""
    
    def test_super_admin_login(self):
        """Test super admin login"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": SUPER_ADMIN_EMAIL,
            "password": SUPER_ADMIN_PASSWORD
        })
        assert response.status_code == 200, f"Super admin login failed: {response.text}"
        data = response.json()
        assert "token" in data, "No token in response"
        assert data.get("role") == "super_admin", f"Expected super_admin role, got {data.get('role')}"
        print(f"✓ Super admin login successful, role: {data.get('role')}")
    
    def test_shop_owner_login(self):
        """Test shop owner login"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": SHOP_OWNER_EMAIL,
            "password": SHOP_OWNER_PASSWORD
        })
        assert response.status_code == 200, f"Shop owner login failed: {response.text}"
        data = response.json()
        assert "token" in data, "No token in response"
        assert data.get("role") == "shop_owner", f"Expected shop_owner role, got {data.get('role')}"
        print(f"✓ Shop owner login successful, role: {data.get('role')}")


class TestVoucherCRUD:
    """Voucher CRUD tests"""
    
    @pytest.fixture
    def shop_owner_token(self):
        """Get shop owner token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": SHOP_OWNER_EMAIL,
            "password": SHOP_OWNER_PASSWORD
        })
        assert response.status_code == 200
        return response.json().get("token")
    
    def test_get_vouchers(self, shop_owner_token):
        """Test GET /api/dashboard/vouchers"""
        headers = {"Authorization": f"Bearer {shop_owner_token}"}
        response = requests.get(f"{BASE_URL}/api/dashboard/vouchers", headers=headers)
        assert response.status_code == 200, f"Get vouchers failed: {response.text}"
        data = response.json()
        assert isinstance(data, list), "Expected list of vouchers"
        print(f"✓ GET vouchers successful, count: {len(data)}")
    
    def test_create_voucher(self, shop_owner_token):
        """Test POST /api/dashboard/vouchers"""
        headers = {"Authorization": f"Bearer {shop_owner_token}"}
        voucher_code = f"TEST{uuid.uuid4().hex[:6].upper()}"
        payload = {
            "code": voucher_code,
            "discount_type": "percentage",
            "discount_value": 10,
            "min_order_amount": 100000,
            "max_uses": 50,
            "applicable_products": [],
            "expiry_date": "2026-12-31T23:59:59Z",
            "is_active": True
        }
        response = requests.post(f"{BASE_URL}/api/dashboard/vouchers", json=payload, headers=headers)
        assert response.status_code == 200, f"Create voucher failed: {response.text}"
        data = response.json()
        assert data.get("code") == voucher_code, f"Voucher code mismatch"
        assert data.get("discount_type") == "percentage"
        assert data.get("discount_value") == 10
        print(f"✓ CREATE voucher successful, code: {voucher_code}")
        return data.get("id")
    
    def test_update_voucher(self, shop_owner_token):
        """Test PUT /api/dashboard/vouchers/{voucher_id}"""
        headers = {"Authorization": f"Bearer {shop_owner_token}"}
        # First create a voucher
        voucher_code = f"UPD{uuid.uuid4().hex[:6].upper()}"
        create_response = requests.post(f"{BASE_URL}/api/dashboard/vouchers", json={
            "code": voucher_code,
            "discount_type": "fixed",
            "discount_value": 50000,
            "is_active": True
        }, headers=headers)
        assert create_response.status_code == 200
        voucher_id = create_response.json().get("id")
        
        # Update the voucher
        update_response = requests.put(f"{BASE_URL}/api/dashboard/vouchers/{voucher_id}", json={
            "discount_value": 75000,
            "is_active": False
        }, headers=headers)
        assert update_response.status_code == 200, f"Update voucher failed: {update_response.text}"
        print(f"✓ UPDATE voucher successful, id: {voucher_id}")
    
    def test_delete_voucher(self, shop_owner_token):
        """Test DELETE /api/dashboard/vouchers/{voucher_id}"""
        headers = {"Authorization": f"Bearer {shop_owner_token}"}
        # First create a voucher
        voucher_code = f"DEL{uuid.uuid4().hex[:6].upper()}"
        create_response = requests.post(f"{BASE_URL}/api/dashboard/vouchers", json={
            "code": voucher_code,
            "discount_type": "percentage",
            "discount_value": 5,
            "is_active": True
        }, headers=headers)
        assert create_response.status_code == 200
        voucher_id = create_response.json().get("id")
        
        # Delete the voucher
        delete_response = requests.delete(f"{BASE_URL}/api/dashboard/vouchers/{voucher_id}", headers=headers)
        assert delete_response.status_code == 200, f"Delete voucher failed: {delete_response.text}"
        print(f"✓ DELETE voucher successful, id: {voucher_id}")


class TestVoucherValidation:
    """Voucher validation tests"""
    
    @pytest.fixture
    def shop_owner_token(self):
        """Get shop owner token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": SHOP_OWNER_EMAIL,
            "password": SHOP_OWNER_PASSWORD
        })
        assert response.status_code == 200
        return response.json().get("token")
    
    @pytest.fixture
    def shop_slug(self, shop_owner_token):
        """Get shop slug"""
        headers = {"Authorization": f"Bearer {shop_owner_token}"}
        response = requests.get(f"{BASE_URL}/api/dashboard/shop", headers=headers)
        assert response.status_code == 200
        return response.json().get("slug")
    
    def test_validate_voucher_invalid_code(self, shop_slug):
        """Test voucher validation with invalid code"""
        response = requests.post(f"{BASE_URL}/api/shop/{shop_slug}/voucher/validate", json={
            "code": "INVALIDCODE123"
        })
        assert response.status_code == 404, f"Expected 404 for invalid code, got {response.status_code}"
        print(f"✓ Invalid voucher code returns 404")
    
    def test_validate_voucher_empty_code(self, shop_slug):
        """Test voucher validation with empty code"""
        response = requests.post(f"{BASE_URL}/api/shop/{shop_slug}/voucher/validate", json={
            "code": ""
        })
        assert response.status_code == 400, f"Expected 400 for empty code, got {response.status_code}"
        print(f"✓ Empty voucher code returns 400")


class TestAgentSystem:
    """Agent/Dealer system tests"""
    
    @pytest.fixture
    def super_admin_token(self):
        """Get super admin token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": SUPER_ADMIN_EMAIL,
            "password": SUPER_ADMIN_PASSWORD
        })
        assert response.status_code == 200
        return response.json().get("token")
    
    @pytest.fixture
    def shop_owner_token(self):
        """Get shop owner token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": SHOP_OWNER_EMAIL,
            "password": SHOP_OWNER_PASSWORD
        })
        assert response.status_code == 200
        return response.json().get("token")
    
    @pytest.fixture
    def shop_id(self, shop_owner_token):
        """Get shop ID"""
        headers = {"Authorization": f"Bearer {shop_owner_token}"}
        response = requests.get(f"{BASE_URL}/api/dashboard/shop", headers=headers)
        assert response.status_code == 200
        return response.json().get("id")
    
    def test_enable_agents_feature(self, super_admin_token, shop_id):
        """Test enabling agents feature for a shop"""
        headers = {"Authorization": f"Bearer {super_admin_token}"}
        response = requests.put(f"{BASE_URL}/api/admin/shops/{shop_id}/agents-toggle", json={
            "agents_enabled": True
        }, headers=headers)
        assert response.status_code == 200, f"Enable agents failed: {response.text}"
        print(f"✓ Agents feature enabled for shop {shop_id}")
    
    def test_get_agents_without_feature_enabled(self, shop_owner_token, super_admin_token, shop_id):
        """Test getting agents when feature is disabled"""
        # First disable agents
        admin_headers = {"Authorization": f"Bearer {super_admin_token}"}
        requests.put(f"{BASE_URL}/api/admin/shops/{shop_id}/agents-toggle", json={
            "agents_enabled": False
        }, headers=admin_headers)
        
        # Try to get agents
        headers = {"Authorization": f"Bearer {shop_owner_token}"}
        response = requests.get(f"{BASE_URL}/api/dashboard/agents", headers=headers)
        assert response.status_code == 403, f"Expected 403 when agents disabled, got {response.status_code}"
        print(f"✓ GET agents returns 403 when feature disabled")
        
        # Re-enable for other tests
        requests.put(f"{BASE_URL}/api/admin/shops/{shop_id}/agents-toggle", json={
            "agents_enabled": True
        }, headers=admin_headers)
    
    def test_get_agents(self, shop_owner_token, super_admin_token, shop_id):
        """Test GET /api/dashboard/agents"""
        # Ensure agents enabled
        admin_headers = {"Authorization": f"Bearer {super_admin_token}"}
        requests.put(f"{BASE_URL}/api/admin/shops/{shop_id}/agents-toggle", json={
            "agents_enabled": True
        }, headers=admin_headers)
        
        headers = {"Authorization": f"Bearer {shop_owner_token}"}
        response = requests.get(f"{BASE_URL}/api/dashboard/agents", headers=headers)
        assert response.status_code == 200, f"Get agents failed: {response.text}"
        data = response.json()
        assert isinstance(data, list), "Expected list of agents"
        print(f"✓ GET agents successful, count: {len(data)}")
    
    def test_create_agent(self, shop_owner_token, super_admin_token, shop_id):
        """Test POST /api/dashboard/agents"""
        # Ensure agents enabled
        admin_headers = {"Authorization": f"Bearer {super_admin_token}"}
        requests.put(f"{BASE_URL}/api/admin/shops/{shop_id}/agents-toggle", json={
            "agents_enabled": True
        }, headers=admin_headers)
        
        headers = {"Authorization": f"Bearer {shop_owner_token}"}
        agent_email = f"testagent_{uuid.uuid4().hex[:8]}@test.com"
        payload = {
            "name": "Test Agent",
            "email": agent_email,
            "password": "testpass123",
            "phone": "0901234567",
            "level": 1
        }
        response = requests.post(f"{BASE_URL}/api/dashboard/agents", json=payload, headers=headers)
        assert response.status_code == 200, f"Create agent failed: {response.text}"
        data = response.json()
        assert data.get("email") == agent_email.lower()
        assert data.get("level") == 1
        assert "tracking_code" in data
        print(f"✓ CREATE agent successful, email: {agent_email}, tracking_code: {data.get('tracking_code')}")
        return data
    
    def test_update_agent(self, shop_owner_token, super_admin_token, shop_id):
        """Test PUT /api/dashboard/agents/{agent_id}"""
        # Ensure agents enabled
        admin_headers = {"Authorization": f"Bearer {super_admin_token}"}
        requests.put(f"{BASE_URL}/api/admin/shops/{shop_id}/agents-toggle", json={
            "agents_enabled": True
        }, headers=admin_headers)
        
        headers = {"Authorization": f"Bearer {shop_owner_token}"}
        # Create agent first
        agent_email = f"updateagent_{uuid.uuid4().hex[:8]}@test.com"
        create_response = requests.post(f"{BASE_URL}/api/dashboard/agents", json={
            "name": "Update Test Agent",
            "email": agent_email,
            "password": "testpass123",
            "level": 1
        }, headers=headers)
        assert create_response.status_code == 200
        agent_id = create_response.json().get("id")
        
        # Update agent
        update_response = requests.put(f"{BASE_URL}/api/dashboard/agents/{agent_id}", json={
            "name": "Updated Agent Name",
            "is_active": False
        }, headers=headers)
        assert update_response.status_code == 200, f"Update agent failed: {update_response.text}"
        print(f"✓ UPDATE agent successful, id: {agent_id}")
    
    def test_delete_agent(self, shop_owner_token, super_admin_token, shop_id):
        """Test DELETE /api/dashboard/agents/{agent_id}"""
        # Ensure agents enabled
        admin_headers = {"Authorization": f"Bearer {super_admin_token}"}
        requests.put(f"{BASE_URL}/api/admin/shops/{shop_id}/agents-toggle", json={
            "agents_enabled": True
        }, headers=admin_headers)
        
        headers = {"Authorization": f"Bearer {shop_owner_token}"}
        # Create agent first
        agent_email = f"deleteagent_{uuid.uuid4().hex[:8]}@test.com"
        create_response = requests.post(f"{BASE_URL}/api/dashboard/agents", json={
            "name": "Delete Test Agent",
            "email": agent_email,
            "password": "testpass123",
            "level": 1
        }, headers=headers)
        assert create_response.status_code == 200
        agent_id = create_response.json().get("id")
        
        # Delete agent
        delete_response = requests.delete(f"{BASE_URL}/api/dashboard/agents/{agent_id}", headers=headers)
        assert delete_response.status_code == 200, f"Delete agent failed: {delete_response.text}"
        print(f"✓ DELETE agent successful, id: {agent_id}")
    
    def test_agent_sales_overview(self, shop_owner_token, super_admin_token, shop_id):
        """Test GET /api/dashboard/agent-sales"""
        # Ensure agents enabled
        admin_headers = {"Authorization": f"Bearer {super_admin_token}"}
        requests.put(f"{BASE_URL}/api/admin/shops/{shop_id}/agents-toggle", json={
            "agents_enabled": True
        }, headers=admin_headers)
        
        headers = {"Authorization": f"Bearer {shop_owner_token}"}
        response = requests.get(f"{BASE_URL}/api/dashboard/agent-sales", headers=headers)
        assert response.status_code == 200, f"Get agent sales failed: {response.text}"
        data = response.json()
        assert "agents" in data
        assert "grand_total" in data
        print(f"✓ GET agent-sales successful, total agents: {data.get('total_agents')}")


class TestAgentLogin:
    """Agent login and dashboard tests"""
    
    @pytest.fixture
    def super_admin_token(self):
        """Get super admin token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": SUPER_ADMIN_EMAIL,
            "password": SUPER_ADMIN_PASSWORD
        })
        assert response.status_code == 200
        return response.json().get("token")
    
    @pytest.fixture
    def shop_owner_token(self):
        """Get shop owner token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": SHOP_OWNER_EMAIL,
            "password": SHOP_OWNER_PASSWORD
        })
        assert response.status_code == 200
        return response.json().get("token")
    
    @pytest.fixture
    def shop_id(self, shop_owner_token):
        """Get shop ID"""
        headers = {"Authorization": f"Bearer {shop_owner_token}"}
        response = requests.get(f"{BASE_URL}/api/dashboard/shop", headers=headers)
        assert response.status_code == 200
        return response.json().get("id")
    
    def test_agent_login_and_dashboard(self, shop_owner_token, super_admin_token, shop_id):
        """Test agent login and dashboard access"""
        # Ensure agents enabled
        admin_headers = {"Authorization": f"Bearer {super_admin_token}"}
        requests.put(f"{BASE_URL}/api/admin/shops/{shop_id}/agents-toggle", json={
            "agents_enabled": True
        }, headers=admin_headers)
        
        # Create agent
        headers = {"Authorization": f"Bearer {shop_owner_token}"}
        agent_email = f"loginagent_{uuid.uuid4().hex[:8]}@test.com"
        agent_password = "agentpass123"
        create_response = requests.post(f"{BASE_URL}/api/dashboard/agents", json={
            "name": "Login Test Agent",
            "email": agent_email,
            "password": agent_password,
            "level": 1
        }, headers=headers)
        assert create_response.status_code == 200
        agent_data = create_response.json()
        
        # Login as agent
        login_response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": agent_email,
            "password": agent_password
        })
        assert login_response.status_code == 200, f"Agent login failed: {login_response.text}"
        login_data = login_response.json()
        assert login_data.get("role") == "agent", f"Expected agent role, got {login_data.get('role')}"
        agent_token = login_data.get("token")
        print(f"✓ Agent login successful, role: {login_data.get('role')}")
        
        # Access agent dashboard
        agent_headers = {"Authorization": f"Bearer {agent_token}"}
        dashboard_response = requests.get(f"{BASE_URL}/api/agent/dashboard", headers=agent_headers)
        assert dashboard_response.status_code == 200, f"Agent dashboard failed: {dashboard_response.text}"
        dashboard_data = dashboard_response.json()
        assert "agent" in dashboard_data
        assert "shop" in dashboard_data
        assert "total_sales" in dashboard_data
        print(f"✓ Agent dashboard accessible, total_sales: {dashboard_data.get('total_sales')}")


class TestBusinessCard:
    """Business card tests"""
    
    @pytest.fixture
    def shop_owner_token(self):
        """Get shop owner token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": SHOP_OWNER_EMAIL,
            "password": SHOP_OWNER_PASSWORD
        })
        assert response.status_code == 200
        return response.json().get("token")
    
    @pytest.fixture
    def shop_slug(self, shop_owner_token):
        """Get shop slug"""
        headers = {"Authorization": f"Bearer {shop_owner_token}"}
        response = requests.get(f"{BASE_URL}/api/dashboard/shop", headers=headers)
        assert response.status_code == 200
        return response.json().get("slug")
    
    def test_get_business_card(self, shop_owner_token):
        """Test GET /api/dashboard/business-card"""
        headers = {"Authorization": f"Bearer {shop_owner_token}"}
        response = requests.get(f"{BASE_URL}/api/dashboard/business-card", headers=headers)
        assert response.status_code == 200, f"Get business card failed: {response.text}"
        data = response.json()
        # Should have basic fields
        assert "display_name" in data or "phone" in data or "email" in data
        print(f"✓ GET business-card successful")
    
    def test_update_business_card(self, shop_owner_token):
        """Test PUT /api/dashboard/business-card"""
        headers = {"Authorization": f"Bearer {shop_owner_token}"}
        payload = {
            "display_name": "Test Business Card",
            "title": "Shop Owner",
            "phone": "0901234567",
            "email": "test@example.com"
        }
        response = requests.put(f"{BASE_URL}/api/dashboard/business-card", json=payload, headers=headers)
        assert response.status_code == 200, f"Update business card failed: {response.text}"
        print(f"✓ PUT business-card successful")
    
    def test_get_public_business_card(self, shop_slug):
        """Test GET /api/card/{shop_slug}"""
        response = requests.get(f"{BASE_URL}/api/card/{shop_slug}")
        assert response.status_code == 200, f"Get public business card failed: {response.text}"
        data = response.json()
        assert "display_name" in data or "shop_name" in data
        assert data.get("card_type") == "shop_owner"
        print(f"✓ GET public business card successful, shop: {data.get('shop_name')}")
    
    def test_get_public_business_card_not_found(self):
        """Test GET /api/card/{invalid_slug}"""
        response = requests.get(f"{BASE_URL}/api/card/nonexistent-slug-12345")
        assert response.status_code == 404, f"Expected 404 for invalid slug, got {response.status_code}"
        print(f"✓ Invalid card slug returns 404")


class TestOGMetaTags:
    """OG Meta Tags tests"""
    
    @pytest.fixture
    def shop_owner_token(self):
        """Get shop owner token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": SHOP_OWNER_EMAIL,
            "password": SHOP_OWNER_PASSWORD
        })
        assert response.status_code == 200
        return response.json().get("token")
    
    @pytest.fixture
    def shop_slug(self, shop_owner_token):
        """Get shop slug"""
        headers = {"Authorization": f"Bearer {shop_owner_token}"}
        response = requests.get(f"{BASE_URL}/api/dashboard/shop", headers=headers)
        assert response.status_code == 200
        return response.json().get("slug")
    
    @pytest.fixture
    def product_id(self, shop_slug):
        """Get a product ID from the shop"""
        response = requests.get(f"{BASE_URL}/api/shop/{shop_slug}/products")
        assert response.status_code == 200
        products = response.json()
        if products:
            return products[0].get("id")
        return None
    
    def test_og_shop_page(self, shop_slug):
        """Test GET /api/og/shop/{slug}"""
        response = requests.get(f"{BASE_URL}/api/og/shop/{shop_slug}")
        assert response.status_code == 200, f"OG shop page failed: {response.text}"
        content = response.text
        assert "og:title" in content, "Missing og:title meta tag"
        assert "og:description" in content, "Missing og:description meta tag"
        assert "og:url" in content, "Missing og:url meta tag"
        print(f"✓ OG shop page returns HTML with meta tags")
    
    def test_og_product_page(self, shop_slug, product_id):
        """Test GET /api/og/shop/{slug}/product/{product_id}"""
        if not product_id:
            pytest.skip("No products available for testing")
        response = requests.get(f"{BASE_URL}/api/og/shop/{shop_slug}/product/{product_id}")
        assert response.status_code == 200, f"OG product page failed: {response.text}"
        content = response.text
        assert "og:title" in content, "Missing og:title meta tag"
        assert "og:type" in content, "Missing og:type meta tag"
        print(f"✓ OG product page returns HTML with meta tags")
    
    def test_og_card_page(self, shop_slug):
        """Test GET /api/og/card/{card_slug}"""
        response = requests.get(f"{BASE_URL}/api/og/card/{shop_slug}")
        assert response.status_code == 200, f"OG card page failed: {response.text}"
        content = response.text
        assert "og:title" in content, "Missing og:title meta tag"
        print(f"✓ OG card page returns HTML with meta tags")
    
    def test_og_shop_not_found(self):
        """Test OG page for non-existent shop"""
        response = requests.get(f"{BASE_URL}/api/og/shop/nonexistent-shop-12345")
        assert response.status_code == 404, f"Expected 404 for invalid shop, got {response.status_code}"
        print(f"✓ OG shop page returns 404 for invalid slug")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
