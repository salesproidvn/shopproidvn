"""End-to-end regression tests for Super-Admin 2FA (TOTP) flow."""
import os
import time
import pytest
import pyotp
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://multi-tenant-shop-14.preview.emergentagent.com").rstrip("/")
API = f"{BASE_URL}/api"

SUPER_ADMIN = {"email": "daominhhai129@gmail.com", "password": "admin123"}
SHOP_OWNER = {"email": "fashion@proid.vn", "password": "iLoveProID@"}


def _login(creds):
    s = requests.Session()
    r = s.post(f"{API}/auth/login", json=creds, timeout=30)
    return s, r


@pytest.fixture(scope="module")
def admin_session():
    """Login admin; if 2FA is active (leftover), try to disable via TOTP secret leaked from setup endpoint."""
    s, r = _login(SUPER_ADMIN)
    assert r.status_code == 200, f"admin login failed: {r.status_code} {r.text}"
    body = r.json()
    # If account is already 2FA-enabled from a previous run we cannot proceed – flag for cleanup at module end
    if body.get("requires_2fa"):
        pytest.skip("Admin already has 2FA enabled from prior run – manual cleanup required")
    yield s
    # Final cleanup: ensure 2FA disabled at teardown
    try:
        status = s.get(f"{API}/auth/2fa/status", timeout=15).json()
        if status.get("enabled"):
            # try to disable using current TOTP – we don't have the secret anymore here
            pass
    except Exception:
        pass


@pytest.fixture(scope="module")
def shop_owner_session():
    s, r = _login(SHOP_OWNER)
    assert r.status_code == 200, f"shop-owner login failed: {r.status_code} {r.text}"
    return s


class TestTwoFASetup:
    def test_setup_forbidden_for_shop_owner(self, shop_owner_session):
        r = shop_owner_session.post(f"{API}/auth/2fa/setup", timeout=15)
        assert r.status_code == 403
        assert "Super Admin" in r.text or "super" in r.text.lower()

    def test_setup_returns_secret_and_uri(self, admin_session):
        r = admin_session.post(f"{API}/auth/2fa/setup", timeout=15)
        assert r.status_code == 200, r.text
        data = r.json()
        for key in ("secret", "otpauth_url", "issuer", "account"):
            assert key in data
        assert data["issuer"] == "Pro ID Shop"
        assert data["account"] == SUPER_ADMIN["email"]
        assert data["otpauth_url"].startswith("otpauth://totp/")
        assert len(data["secret"]) >= 16
        pytest.shared_secret = data["secret"]

    def test_verify_setup_rejects_bad_code(self, admin_session):
        r = admin_session.post(f"{API}/auth/2fa/verify-setup", json={"code": "000000"}, timeout=15)
        assert r.status_code == 400

    def test_verify_setup_activates_and_returns_backup_codes(self, admin_session):
        secret = pytest.shared_secret
        code = pyotp.TOTP(secret).now()
        r = admin_session.post(f"{API}/auth/2fa/verify-setup", json={"code": code}, timeout=15)
        assert r.status_code == 200, r.text
        data = r.json()
        assert data["enabled"] is True
        assert isinstance(data["backup_codes"], list)
        assert len(data["backup_codes"]) == 8
        for c in data["backup_codes"]:
            assert len(c) == 9 and c[4] == "-"
        pytest.shared_backup_codes = data["backup_codes"]

    def test_status_after_enable(self, admin_session):
        r = admin_session.get(f"{API}/auth/2fa/status", timeout=15)
        assert r.status_code == 200
        data = r.json()
        assert data["enabled"] is True
        assert data["backup_codes_remaining"] == 8
        assert data["enabled_at"]


class TestTwoFALogin:
    def test_login_returns_requires_2fa(self):
        s, r = _login(SUPER_ADMIN)
        assert r.status_code == 200
        data = r.json()
        assert data.get("requires_2fa") is True
        assert data.get("pending_token")
        assert data.get("email") == SUPER_ADMIN["email"]
        # No access_token cookie should be set
        assert "access_token" not in s.cookies
        pytest.shared_pending_token = data["pending_token"]

    def test_verify_with_bad_totp_fails(self):
        r = requests.post(
            f"{API}/auth/2fa/verify",
            json={"pending_token": pytest.shared_pending_token, "code": "000000"},
            timeout=15,
        )
        assert r.status_code == 401

    def test_verify_with_valid_totp_issues_token(self):
        code = pyotp.TOTP(pytest.shared_secret).now()
        s = requests.Session()
        r = s.post(
            f"{API}/auth/2fa/verify",
            json={"pending_token": pytest.shared_pending_token, "code": code},
            timeout=15,
        )
        assert r.status_code == 200, r.text
        data = r.json()
        assert data["role"] == "super_admin"
        assert data["token"]
        assert data["used_backup_code"] is False
        # cookie set
        assert "access_token" in s.cookies

    def test_verify_with_backup_code_consumes_once(self):
        # new login to get fresh pending token
        _, r = _login(SUPER_ADMIN)
        pending = r.json()["pending_token"]
        bc = pytest.shared_backup_codes[0]
        s = requests.Session()
        r1 = s.post(f"{API}/auth/2fa/verify", json={"pending_token": pending, "code": bc}, timeout=15)
        assert r1.status_code == 200, r1.text
        assert r1.json()["used_backup_code"] is True
        # Second use must fail (on a fresh pending token)
        _, r2 = _login(SUPER_ADMIN)
        pending2 = r2.json()["pending_token"]
        r3 = requests.post(f"{API}/auth/2fa/verify", json={"pending_token": pending2, "code": bc}, timeout=15)
        assert r3.status_code == 401

    def test_verify_expired_pending_token(self):
        # Use a syntactically-invalid token to trigger 400 branch
        r = requests.post(f"{API}/auth/2fa/verify", json={"pending_token": "not.a.jwt", "code": "123456"}, timeout=15)
        assert r.status_code == 400

    def test_status_after_backup_used(self, admin_session):
        # admin_session was logged in BEFORE 2FA enabled so cookie is still valid
        r = admin_session.get(f"{API}/auth/2fa/status", timeout=15)
        assert r.status_code == 200
        assert r.json()["backup_codes_remaining"] == 7


class TestTwoFARegenerate:
    def test_regenerate_rejects_bad_code(self, admin_session):
        r = admin_session.post(f"{API}/auth/2fa/backup-codes/regenerate", json={"code": "000000"}, timeout=15)
        assert r.status_code == 401

    def test_regenerate_with_valid_totp(self, admin_session):
        # sleep to avoid the same code being considered re-used
        time.sleep(1)
        code = pyotp.TOTP(pytest.shared_secret).now()
        r = admin_session.post(f"{API}/auth/2fa/backup-codes/regenerate", json={"code": code}, timeout=15)
        assert r.status_code == 200, r.text
        new_codes = r.json()["backup_codes"]
        assert len(new_codes) == 8
        # Old codes should no longer be valid
        _, lr = _login(SUPER_ADMIN)
        pending = lr.json()["pending_token"]
        old = pytest.shared_backup_codes[1]
        r2 = requests.post(f"{API}/auth/2fa/verify", json={"pending_token": pending, "code": old}, timeout=15)
        assert r2.status_code == 401
        pytest.shared_backup_codes = new_codes


class TestTwoFARecovery:
    def test_recover_start_unknown_email_returns_success(self):
        r = requests.post(f"{API}/auth/2fa/recover-start", json={"email": "nobody-xyz-404@example.com"}, timeout=30)
        assert r.status_code == 200
        assert "recovery link" in r.text.lower() or "link" in r.text.lower()

    def test_recover_start_admin_email_returns_success(self):
        r = requests.post(f"{API}/auth/2fa/recover-start", json={"email": SUPER_ADMIN["email"]}, timeout=30)
        assert r.status_code == 200

    def test_recover_complete_invalid_token(self):
        r = requests.post(f"{API}/auth/2fa/recover-complete", json={"token": "invalid-token-xxx"}, timeout=15)
        assert r.status_code == 400


class TestTwoFADisable:
    def test_disable_rejects_bad_code(self, admin_session):
        r = admin_session.post(f"{API}/auth/2fa/disable", json={"code": "000000"}, timeout=15)
        assert r.status_code == 401

    def test_disable_with_totp_succeeds(self, admin_session):
        time.sleep(1)
        code = pyotp.TOTP(pytest.shared_secret).now()
        r = admin_session.post(f"{API}/auth/2fa/disable", json={"code": code}, timeout=15)
        assert r.status_code == 200, r.text
        assert r.json()["enabled"] is False

    def test_login_no_longer_requires_2fa(self):
        _, r = _login(SUPER_ADMIN)
        assert r.status_code == 200
        body = r.json()
        assert not body.get("requires_2fa")
        assert body.get("token")

    def test_status_after_disable(self):
        s, _ = _login(SUPER_ADMIN)
        r = s.get(f"{API}/auth/2fa/status", timeout=15)
        assert r.status_code == 200
        assert r.json()["enabled"] is False
