from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI, APIRouter, HTTPException, Request, Response, Depends, Query, File, UploadFile
from fastapi.responses import HTMLResponse, JSONResponse
from starlette.middleware.cors import CORSMiddleware
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.middleware.gzip import GZipMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from bson import ObjectId
import os
import logging
import bcrypt
import jwt
import secrets
import pyotp
import uuid as uuid_lib
import io
import json
import asyncio
import re
import html as html_mod
import time
import collections
import bleach
import boto3
from botocore.client import Config as BotoConfig
import resend
from PIL import Image
from pywebpush import webpush, WebPushException
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional
from datetime import datetime, timezone, timedelta

ROOT_DIR = Path(__file__).parent

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# JWT Configuration
JWT_SECRET = os.environ.get('JWT_SECRET', secrets.token_hex(32))
JWT_ALGORITHM = "HS256"

# Cloudflare R2 Configuration (S3-compatible)
R2_ACCESS_KEY = os.environ.get("R2_ACCESS_KEY")
R2_SECRET_KEY = os.environ.get("R2_SECRET_KEY")
R2_BUCKET = os.environ.get("R2_BUCKET")
R2_ENDPOINT = os.environ.get("R2_ENDPOINT")
R2_PUBLIC_URL = os.environ.get("R2_PUBLIC_URL", "")
APP_NAME = "the-wi-shop"

s3_client = None

# VAPID Configuration for Web Push
VAPID_PRIVATE_KEY = os.environ.get("VAPID_PRIVATE_KEY", "").replace("\\n", "\n")
VAPID_PUBLIC_KEY = os.environ.get("VAPID_PUBLIC_KEY", "")
VAPID_CLAIMS_EMAIL = os.environ.get("VAPID_CLAIMS_EMAIL", "mailto:daominhhai129@gmail.com")

# Resend Email Configuration
RESEND_API_KEY = os.environ.get("RESEND_API_KEY", "")
SENDER_EMAIL = os.environ.get("SENDER_EMAIL", "onboarding@resend.dev")
if RESEND_API_KEY:
    resend.api_key = RESEND_API_KEY

# Create the main app and router
app = FastAPI()
api_router = APIRouter(prefix="/api")

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# ==================== SECURITY: RATE LIMITING ====================

MAX_CONTENT_WORDS = 1000  # Max words for blog posts and product descriptions

# Mutable security config - loaded from DB at startup, editable by Super Admin
security_config = {
    "rate_global": 120,
    "rate_auth": 10,
    "rate_orders": 15,
    "rate_contact": 5,
    "rate_register": 3,
    "brute_force_max": 50,
    "brute_force_window": 900,
    "max_body_mb": 10,
    "content_word_limit": 1000,
}

class RateLimiter:
    """In-memory rate limiter with per-IP tracking and auto-cleanup."""
    def __init__(self):
        self.requests = collections.defaultdict(list)  # ip -> [timestamps]
        self.blocked_ips = {}  # ip -> unblock_time
        self.last_cleanup = time.time()

    def _cleanup(self):
        now = time.time()
        if now - self.last_cleanup < 60:
            return
        self.last_cleanup = now
        cutoff = now - 120
        for ip in list(self.requests.keys()):
            self.requests[ip] = [t for t in self.requests[ip] if t > cutoff]
            if not self.requests[ip]:
                del self.requests[ip]
        for ip in list(self.blocked_ips.keys()):
            if self.blocked_ips[ip] < now:
                del self.blocked_ips[ip]

    def is_allowed(self, ip: str, max_requests: int, window_seconds: int) -> bool:
        self._cleanup()
        now = time.time()
        if ip in self.blocked_ips and self.blocked_ips[ip] > now:
            return False
        cutoff = now - window_seconds
        self.requests[ip] = [t for t in self.requests[ip] if t > cutoff]
        if len(self.requests[ip]) >= max_requests:
            return False
        self.requests[ip].append(now)
        return True

    def block_ip(self, ip: str, duration_seconds: int):
        self.blocked_ips[ip] = time.time() + duration_seconds

rate_limiter = RateLimiter()

class LoginTracker:
    """Track failed login attempts for brute force protection."""
    def __init__(self):
        self.attempts = collections.defaultdict(list)  # key -> [timestamps]

    def record_failure(self, key: str):
        self.attempts[key].append(time.time())

    def is_locked(self, key: str, max_attempts: int = None, window_seconds: int = None) -> bool:
        if max_attempts is None:
            max_attempts = security_config["brute_force_max"]
        if window_seconds is None:
            window_seconds = security_config["brute_force_window"]
        now = time.time()
        cutoff = now - window_seconds
        self.attempts[key] = [t for t in self.attempts[key] if t > cutoff]
        return len(self.attempts[key]) >= max_attempts

    def clear(self, key: str):
        self.attempts.pop(key, None)

login_tracker = LoginTracker()

# ==================== SECURITY: INPUT SANITIZATION ====================

ALLOWED_HTML_TAGS = ['p', 'br', 'b', 'i', 'u', 'strong', 'em', 'a', 'ul', 'ol', 'li',
                     'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'img', 'div', 'span',
                     'table', 'thead', 'tbody', 'tr', 'td', 'th', 'blockquote', 'pre', 'code']
ALLOWED_HTML_ATTRS = {
    '*': ['class', 'style', 'id', 'data-testid'],
    'a': ['href', 'title', 'target', 'rel'],
    'img': ['src', 'alt', 'width', 'height'],
}

def sanitize_html(text: str) -> str:
    """Sanitize HTML content to prevent XSS."""
    if not text:
        return text
    return bleach.clean(text, tags=ALLOWED_HTML_TAGS, attributes=ALLOWED_HTML_ATTRS, strip=True)

def count_words(text: str) -> int:
    """Count words in text, stripping HTML tags first."""
    if not text:
        return 0
    clean = bleach.clean(text, tags=[], strip=True)
    return len(clean.split())

def validate_word_limit(text: str, field_name: str, max_words: int = None):
    """Validate text doesn't exceed word limit."""
    if max_words is None:
        max_words = security_config["content_word_limit"]
    wc = count_words(text)
    if wc > max_words:
        raise HTTPException(
            status_code=400,
            detail=f"{field_name} vượt quá giới hạn {max_words} từ (hiện tại: {wc} từ)"
        )

def get_client_ip(request: Request) -> str:
    """Get real client IP from headers or connection."""
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else "unknown"

# ==================== SECURITY: MIDDLEWARE ====================

class SecurityMiddleware(BaseHTTPMiddleware):
    """Combined security middleware: headers + rate limiting + request size limit."""

    async def dispatch(self, request, call_next):
        ip = get_client_ip(request)
        path = request.url.path

        content_length = request.headers.get("content-length")
        max_bytes = security_config["max_body_mb"] * 1024 * 1024
        if content_length and int(content_length) > max_bytes:
            return JSONResponse(status_code=413, content={"detail": f"Dung lượng yêu cầu quá lớn (tối đa {security_config['max_body_mb']}MB)"})

        if path in ("/api/auth/login", "/api/auth/register", "/api/auth/forgot-password"):
            if not rate_limiter.is_allowed(f"auth:{ip}", max_requests=security_config["rate_auth"], window_seconds=60):
                return JSONResponse(status_code=429, content={"detail": "Quá nhiều yêu cầu. Vui lòng thử lại sau."})
        elif path.endswith("/orders") and request.method == "POST":
            if not rate_limiter.is_allowed(f"order:{ip}", max_requests=security_config["rate_orders"], window_seconds=60):
                return JSONResponse(status_code=429, content={"detail": "Quá nhiều đơn hàng. Vui lòng thử lại sau."})
        elif path.startswith("/api/") and not (path.startswith("/api/shop/") and request.method == "GET") and not (path.startswith("/api/files/") and request.method == "GET") and not (path.startswith("/api/card/") and request.method == "GET"):
            if not rate_limiter.is_allowed(f"global:{ip}", max_requests=security_config["rate_global"], window_seconds=60):
                return JSONResponse(status_code=429, content={"detail": "Quá nhiều yêu cầu. Vui lòng thử lại sau."})

        response = await call_next(request)

        # Security headers
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "SAMEORIGIN"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=()"

        return response

# ==================== CLOUDFLARE R2 STORAGE ====================

def get_s3_client():
    global s3_client
    if s3_client:
        return s3_client
    if not all([R2_ACCESS_KEY, R2_SECRET_KEY, R2_BUCKET, R2_ENDPOINT]):
        logger.warning("Cloudflare R2 credentials not fully configured")
        return None
    s3_client = boto3.client(
        "s3",
        endpoint_url=R2_ENDPOINT,
        aws_access_key_id=R2_ACCESS_KEY,
        aws_secret_access_key=R2_SECRET_KEY,
        region_name="auto",
    )
    return s3_client

def put_object(path: str, data: bytes, content_type: str) -> dict:
    client = get_s3_client()
    if not client:
        raise HTTPException(status_code=500, detail="Storage not available - R2 not configured")
    client.put_object(
        Bucket=R2_BUCKET, Key=path, Body=data, ContentType=content_type,
        CacheControl="public, max-age=31536000, immutable",
        ContentDisposition="inline",
    )
    return {"path": path, "size": len(data)}

def get_object(path: str) -> tuple:
    client = get_s3_client()
    if not client:
        raise HTTPException(status_code=500, detail="Storage not available - R2 not configured")
    resp = client.get_object(Bucket=R2_BUCKET, Key=path)
    return resp["Body"].read(), resp.get("ContentType", "application/octet-stream")

def delete_object(path: str):
    client = get_s3_client()
    if not client:
        return
    try:
        client.delete_object(Bucket=R2_BUCKET, Key=path)
    except Exception as e:
        logger.error(f"R2 delete failed for {path}: {e}")

# ==================== IMAGE COMPRESSION ====================

MAX_IMAGE_SIZE_BYTES = 200 * 1024  # 200KB target - WebP is much more efficient

def compress_image(data: bytes, content_type: str, max_bytes: int = MAX_IMAGE_SIZE_BYTES) -> tuple:
    """Compress image to WebP format, optimized for mobile. Returns (compressed_bytes, content_type)."""
    try:
        img = Image.open(io.BytesIO(data))
    except Exception:
        return data, content_type

    # Convert RGBA/P to RGB
    if img.mode in ("RGBA", "P"):
        bg = Image.new("RGB", img.size, (255, 255, 255))
        if img.mode == "P":
            img = img.convert("RGBA")
        bg.paste(img, mask=img.split()[3])
        img = bg
    elif img.mode != "RGB":
        img = img.convert("RGB")

    # Step 1: Scale down - 1200px max is enough for mobile retina
    max_dim = 1200
    if img.width > max_dim or img.height > max_dim:
        ratio = min(max_dim / img.width, max_dim / img.height)
        new_size = (int(img.width * ratio), int(img.height * ratio))
        img = img.resize(new_size, Image.LANCZOS)

    # Step 2: WebP progressive quality reduction
    out_type = "image/webp"
    for quality in [82, 72, 62, 52, 42]:
        buf = io.BytesIO()
        img.save(buf, format="WEBP", quality=quality, method=4)
        result = buf.getvalue()
        if len(result) <= max_bytes:
            return result, out_type

    # Step 3: Scale down further if still too large
    for scale in [0.75, 0.5, 0.35]:
        scaled = img.resize((int(img.width * scale), int(img.height * scale)), Image.LANCZOS)
        buf = io.BytesIO()
        scaled.save(buf, format="WEBP", quality=50, method=4)
        result = buf.getvalue()
        if len(result) <= max_bytes:
            return result, out_type

    # Last resort
    buf = io.BytesIO()
    img.resize((600, int(600 * img.height / img.width)), Image.LANCZOS).save(buf, format="WEBP", quality=40, method=4)
    return buf.getvalue(), out_type

# ==================== AUTH UTILS ====================

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")

def verify_password(plain: str, hashed: str) -> bool:
    return bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))

def create_access_token(user_id: str, email: str, role: str) -> str:
    payload = {"sub": user_id, "email": email, "role": role, "exp": datetime.now(timezone.utc) + timedelta(hours=24), "type": "access"}
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

def create_refresh_token(user_id: str) -> str:
    payload = {"sub": user_id, "exp": datetime.now(timezone.utc) + timedelta(days=7), "type": "refresh"}
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

def create_2fa_pending_token(user_id: str, email: str, role: str) -> str:
    payload = {
        "sub": user_id, "email": email, "role": role,
        "exp": datetime.now(timezone.utc) + timedelta(minutes=5),
        "type": "2fa_pending",
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

def generate_backup_codes(n: int = 8) -> list:
    """Generate n human-readable backup codes like 'ABCD-1234'."""
    codes = []
    alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"  # no O/0/I/1
    for _ in range(n):
        part1 = "".join(secrets.choice(alphabet) for _ in range(4))
        part2 = "".join(secrets.choice(alphabet) for _ in range(4))
        codes.append(f"{part1}-{part2}")
    return codes

def hash_backup_code(code: str) -> str:
    return bcrypt.hashpw(code.upper().replace("-", "").encode("utf-8"), bcrypt.gensalt()).decode("utf-8")

def verify_backup_code(code: str, hashed: str) -> bool:
    return bcrypt.checkpw(code.upper().replace("-", "").encode("utf-8"), hashed.encode("utf-8"))

async def get_current_user(request: Request) -> dict:
    token = request.cookies.get("access_token")
    if not token:
        auth_header = request.headers.get("Authorization", "")
        if auth_header.startswith("Bearer "):
            token = auth_header[7:]
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        if payload.get("type") != "access":
            raise HTTPException(status_code=401, detail="Invalid token type")
        # Check if this is an agent token (agent IDs start with 'agt-')
        sub = payload.get("sub", "")
        if sub.startswith("agt-"):
            # This is an agent, raise HTTPException to be handled by /auth/me
            raise HTTPException(status_code=401, detail="Agent token - use agent endpoint")
        user = await db.users.find_one({"_id": ObjectId(sub)})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        if user.get("status") == "blocked":
            raise HTTPException(status_code=403, detail="Account is blocked")
        user["_id"] = str(user["_id"])
        user.pop("password_hash", None)
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

async def require_super_admin(request: Request) -> dict:
    user = await get_current_user(request)
    if user.get("role") not in ("super_admin", "sub_admin"):
        raise HTTPException(status_code=403, detail="Admin access required")
    return user

async def require_super_admin_only(request: Request) -> dict:
    user = await get_current_user(request)
    if user.get("role") != "super_admin":
        raise HTTPException(status_code=403, detail="Super admin access required")
    return user

async def require_shop_owner(request: Request) -> dict:
    user = await get_current_user(request)
    if user.get("role") not in ["shop_owner", "super_admin"]:
        raise HTTPException(status_code=403, detail="Shop owner access required")
    return user

def generate_shop_slug(name: str) -> str:
    import re, unicodedata
    nfkd = unicodedata.normalize('NFKD', name)
    ascii_str = ''.join(c for c in nfkd if not unicodedata.combining(c))
    slug = re.sub(r'[^\w\s-]', '', ascii_str.lower().strip())
    slug = slug.replace('đ', 'd').replace('Đ', 'd')
    return re.sub(r'[-\s]+', '-', slug)[:50]

def set_auth_cookies(response: Response, access_token: str, refresh_token: str):
    response.set_cookie(key="access_token", value=access_token, httponly=True, secure=False, samesite="lax", max_age=86400, path="/")
    response.set_cookie(key="refresh_token", value=refresh_token, httponly=True, secure=False, samesite="lax", max_age=604800, path="/")

def serialize_datetime(val):
    if isinstance(val, datetime):
        return val.isoformat()
    return str(val) if val else ""

async def resolve_shop_id(request: Request, user: dict) -> str:
    """Resolve shop_id: for super_admin, allow ?shop_id= override; otherwise use user's shop_id."""
    if user.get("role") == "super_admin":
        override = request.query_params.get("shop_id")
        if override:
            return override
    shop_id = user.get("shop_id")
    if not shop_id:
        raise HTTPException(status_code=400, detail="No shop associated")
    return shop_id

# ==================== PYDANTIC MODELS ====================

class UserRegister(BaseModel):
    email: EmailStr
    password: str
    name: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class ForgotPasswordRequest(BaseModel):
    email: EmailStr

class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str

class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str

class TwoFAVerifySetup(BaseModel):
    code: str

class TwoFALoginVerify(BaseModel):
    pending_token: str
    code: str

class TwoFADisable(BaseModel):
    code: str  # TOTP code or backup code

class ShopCreate(BaseModel):
    name: str
    description: Optional[str] = ""

class ShopUpdate(BaseModel):
    name: Optional[str] = None
    slug: Optional[str] = None
    description: Optional[str] = None
    logo_url: Optional[str] = None
    contact_phone: Optional[str] = None
    contact_email: Optional[str] = None
    address: Optional[str] = None
    social_facebook: Optional[str] = None
    social_instagram: Optional[str] = None
    theme_color: Optional[str] = None
    custom_domain: Optional[str] = None
    banners: Optional[List[str]] = None
    banner_enabled: Optional[bool] = None
    blog_enabled: Optional[bool] = None
    layout_sections: Optional[List[dict]] = None
    footer_columns: Optional[List[dict]] = None
    post_carousel_position: Optional[str] = None
    max_products: Optional[int] = None
    max_posts: Optional[int] = None
    max_pages: Optional[int] = None
    max_categories: Optional[int] = None

class CategoryCreate(BaseModel):
    name: str
    description: Optional[str] = ""
    image_url: Optional[str] = ""
    parent_id: Optional[str] = None

class ProductCreate(BaseModel):
    name: str
    price: int
    category_id: Optional[str] = None
    description: Optional[str] = ""
    image_url: Optional[str] = ""
    images: Optional[List[str]] = []
    video_url: Optional[str] = ""
    video_links: Optional[List[str]] = []
    position: Optional[int] = 0
    is_featured: Optional[bool] = False
    is_active: Optional[bool] = True
    is_hidden: Optional[bool] = False
    out_of_stock: Optional[bool] = False
    sku: Optional[str] = ""
    type: Optional[str] = "product"

class OrderCreate(BaseModel):
    customer_name: str
    customer_phone: str
    customer_email: Optional[str] = ""
    customer_address: str
    items: List[dict]
    note: Optional[str] = ""
    agent_tracking_code: Optional[str] = None
    voucher_code: Optional[str] = None

class OrderStatusUpdate(BaseModel):
    status: str

class BookingCreate(BaseModel):
    service_id: str
    customer_name: str
    customer_phone: str
    customer_email: Optional[str] = ""
    preferred_datetime: str  # ISO string "YYYY-MM-DDTHH:mm"
    note: Optional[str] = ""
    agent_tracking_code: Optional[str] = None

class BookingStatusUpdate(BaseModel):
    status: str

class ShopOwnerCreate(BaseModel):
    email: EmailStr
    password: str
    name: str
    shop_name: str
    phone: Optional[str] = ""
    send_email: Optional[bool] = False

class ExpiryUpdate(BaseModel):
    expiry_date: Optional[str] = None

class CategoryPositionUpdate(BaseModel):
    positions: List[dict]

class PostCreate(BaseModel):
    title: str
    description: Optional[str] = ""
    thumbnail: Optional[str] = ""
    images: Optional[List[str]] = []
    attached_products: Optional[List[str]] = []

class PageCreate(BaseModel):
    title: str
    slug: Optional[str] = ""
    is_published: Optional[bool] = True
    sections: Optional[List[dict]] = []

class MenuUpdate(BaseModel):
    items: List[dict]

class MegaMenuUpdate(BaseModel):
    items: List[dict]

class ContactForm(BaseModel):
    name: str
    email: Optional[str] = ""
    phone: Optional[str] = ""
    message: str

class ShopLimitsUpdate(BaseModel):
    max_products: Optional[int] = None
    max_posts: Optional[int] = None
    max_pages: Optional[int] = None
    max_categories: Optional[int] = None

class VoucherCreate(BaseModel):
    code: str
    discount_type: str  # "percentage" or "fixed"
    discount_value: float
    min_order_amount: Optional[float] = 0
    max_uses: Optional[int] = 0
    applicable_products: Optional[List[str]] = []
    expiry_date: Optional[str] = None
    is_active: Optional[bool] = True

class VoucherUpdate(BaseModel):
    code: Optional[str] = None
    discount_type: Optional[str] = None
    discount_value: Optional[float] = None
    min_order_amount: Optional[float] = None
    max_uses: Optional[int] = None
    applicable_products: Optional[List[str]] = None
    expiry_date: Optional[str] = None
    is_active: Optional[bool] = None

class AgentCreate(BaseModel):
    name: str
    email: EmailStr
    password: str
    phone: Optional[str] = ""
    level: int = 1  # 1, 2, or 3
    parent_agent_id: Optional[str] = None

class AgentUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    level: Optional[int] = None
    parent_agent_id: Optional[str] = None
    is_active: Optional[bool] = None

class BusinessCardUpdate(BaseModel):
    display_name: Optional[str] = None
    title: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    address: Optional[str] = None
    avatar_url: Optional[str] = None
    logo_url: Optional[str] = None
    social_facebook: Optional[str] = None
    social_instagram: Optional[str] = None
    social_tiktok: Optional[str] = None
    social_zalo: Optional[str] = None
    website: Optional[str] = None
    selected_products: Optional[List[str]] = None
    theme_color: Optional[str] = None

# ==================== AUTH ENDPOINTS ====================

@api_router.post("/auth/register")
async def register(user_data: UserRegister, request: Request, response: Response):
    # Security: Rate limit registration
    ip = get_client_ip(request)
    if not rate_limiter.is_allowed(f"register:{ip}", max_requests=security_config["rate_register"], window_seconds=300):
        raise HTTPException(status_code=429, detail="Quá nhiều đăng ký. Vui lòng thử lại sau.")
    # Security: Sanitize name
    user_data.name = bleach.clean(user_data.name, tags=[], strip=True)
    email = user_data.email.lower()
    existing = await db.users.find_one({"email": email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    hashed = hash_password(user_data.password)
    user_doc = {"email": email, "password_hash": hashed, "name": user_data.name, "role": "customer", "status": "active", "created_at": datetime.now(timezone.utc)}
    result = await db.users.insert_one(user_doc)
    user_id = str(result.inserted_id)
    access_token = create_access_token(user_id, email, "customer")
    set_auth_cookies(response, access_token, create_refresh_token(user_id))
    return {"id": user_id, "email": email, "name": user_data.name, "role": "customer", "token": access_token}

@api_router.post("/auth/login")
async def login(user_data: UserLogin, request: Request, response: Response):
    email = user_data.email.lower()
    ip = get_client_ip(request)
    lock_key = f"{ip}:{email}"

    # Brute force protection
    if login_tracker.is_locked(lock_key):
        raise HTTPException(
            status_code=429,
            detail="Quá nhiều lần đăng nhập thất bại. Vui lòng thử lại sau 15 phút."
        )

    user = await db.users.find_one({"email": email})
    if not user:
        # Check agents collection
        agent = await db.agents.find_one({"email": email})
        if agent:
            if not agent.get("is_active", True):
                raise HTTPException(status_code=403, detail="Account is blocked")
            if not verify_password(user_data.password, agent["password_hash"]):
                login_tracker.record_failure(lock_key)
                raise HTTPException(status_code=401, detail="Invalid email or password")
            login_tracker.clear(lock_key)
            agent_id = agent["id"]
            access_token = create_access_token(agent_id, email, "agent")
            set_auth_cookies(response, access_token, create_refresh_token(agent_id))
            return {"id": agent_id, "email": agent["email"], "name": agent["name"], "role": "agent", "shop_id": agent.get("shop_id"), "agent_id": agent_id, "token": access_token}
        login_tracker.record_failure(lock_key)
        raise HTTPException(status_code=401, detail="Invalid email or password")
    if user.get("status") == "blocked":
        raise HTTPException(status_code=403, detail="Account is blocked")
    if not verify_password(user_data.password, user["password_hash"]):
        login_tracker.record_failure(lock_key)
        raise HTTPException(status_code=401, detail="Invalid email or password")
    login_tracker.clear(lock_key)
    user_id = str(user["_id"])
    role = user.get("role", "customer")

    # 2FA check: if user has 2FA enabled, return pending token (no cookies yet)
    if user.get("totp_enabled") and user.get("totp_secret"):
        pending = create_2fa_pending_token(user_id, email, role)
        return {
            "requires_2fa": True,
            "pending_token": pending,
            "email": email,
        }

    access_token = create_access_token(user_id, email, role)
    set_auth_cookies(response, access_token, create_refresh_token(user_id))
    return {"id": user_id, "email": user["email"], "name": user["name"], "role": role, "shop_id": user.get("shop_id"), "token": access_token}

@api_router.post("/auth/logout")
async def logout(response: Response):
    response.delete_cookie(key="access_token", path="/", samesite="lax")
    response.delete_cookie(key="refresh_token", path="/", samesite="lax")
    return {"message": "Logged out"}

@api_router.get("/auth/me")
async def get_me(request: Request):
    try:
        user = await get_current_user(request)
        return {"id": user["_id"], "email": user["email"], "name": user["name"], "role": user["role"], "shop_id": user.get("shop_id"), "status": user.get("status", "active")}
    except HTTPException:
        # Check if it's an agent token
        token = request.cookies.get("access_token")
        if not token:
            auth_header = request.headers.get("Authorization", "")
            if auth_header.startswith("Bearer "):
                token = auth_header[7:]
        if token:
            try:
                payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
                if payload.get("role") == "agent":
                    agent = await db.agents.find_one({"id": payload["sub"]}, {"_id": 0, "password_hash": 0})
                    if agent:
                        return {"id": agent["id"], "email": agent["email"], "name": agent["name"], "role": "agent", "shop_id": agent.get("shop_id"), "agent_id": agent["id"], "level": agent.get("level", 1), "status": "active"}
            except Exception:
                pass
        raise HTTPException(status_code=401, detail="Not authenticated")

@api_router.post("/auth/forgot-password")
async def forgot_password(data: ForgotPasswordRequest):
    """Generate a password reset token. In production, this would send an email."""
    email = data.email.lower()
    user = await db.users.find_one({"email": email})
    if not user:
        return {"message": "If this email exists, a reset link has been sent."}
    token = secrets.token_urlsafe(32)
    await db.password_resets.insert_one({
        "user_id": str(user["_id"]),
        "email": email,
        "token": token,
        "used": False,
        "created_at": datetime.now(timezone.utc),
        "expires_at": datetime.now(timezone.utc) + timedelta(hours=1)
    })
    logger.info(f"Password reset token for {email}: {token}")
    return {"message": "If this email exists, a reset link has been sent.", "reset_token": token}

@api_router.post("/auth/reset-password")
async def reset_password(data: ResetPasswordRequest):
    """Reset password using token from forgot-password."""
    reset_doc = await db.password_resets.find_one({
        "token": data.token,
        "used": False,
        "expires_at": {"$gt": datetime.now(timezone.utc)}
    })
    if not reset_doc:
        raise HTTPException(status_code=400, detail="Invalid or expired reset token")
    new_hash = hash_password(data.new_password)
    await db.users.update_one({"_id": ObjectId(reset_doc["user_id"])}, {"$set": {"password_hash": new_hash}})
    await db.password_resets.update_one({"_id": reset_doc["_id"]}, {"$set": {"used": True}})
    return {"message": "Password has been reset successfully"}

@api_router.post("/auth/change-password")
async def change_password(request: Request):
    """Change password for the currently logged-in user. Old password not required."""
    user = await get_current_user(request)
    body = await request.json()
    new_password = body.get("new_password", "")
    if len(new_password) < 6:
        raise HTTPException(status_code=400, detail="Mật khẩu mới phải có ít nhất 6 ký tự")
    user_doc = await db.users.find_one({"_id": ObjectId(user["_id"])})
    if not user_doc:
        raise HTTPException(status_code=404, detail="User not found")
    new_hash = hash_password(new_password)
    await db.users.update_one({"_id": ObjectId(user["_id"])}, {"$set": {"password_hash": new_hash}})
    return {"message": "Đổi mật khẩu thành công"}

# ==================== 2FA (TOTP) ENDPOINTS ====================

@api_router.get("/auth/2fa/status")
async def get_2fa_status(request: Request):
    """Return whether 2FA is enabled for current user."""
    user = await get_current_user(request)
    user_doc = await db.users.find_one({"_id": ObjectId(user["_id"])}, {"totp_enabled": 1, "totp_backup_codes": 1, "totp_enabled_at": 1})
    if not user_doc:
        raise HTTPException(status_code=404, detail="User not found")
    backup_count = len([c for c in (user_doc.get("totp_backup_codes") or []) if not c.get("used")])
    return {
        "enabled": bool(user_doc.get("totp_enabled")),
        "enabled_at": serialize_datetime(user_doc.get("totp_enabled_at")) if user_doc.get("totp_enabled_at") else None,
        "backup_codes_remaining": backup_count,
    }

@api_router.post("/auth/2fa/setup")
async def setup_2fa(request: Request):
    """Generate a new TOTP secret and return provisioning URI. Not yet enabled until verified."""
    user = await get_current_user(request)
    if user.get("role") != "super_admin":
        raise HTTPException(status_code=403, detail="Chỉ Super Admin được bật 2FA")
    secret = pyotp.random_base32()
    issuer = "Pro ID Shop"
    account = user.get("email", "admin")
    uri = pyotp.totp.TOTP(secret).provisioning_uri(name=account, issuer_name=issuer)
    # Store pending secret (not yet enabled)
    await db.users.update_one(
        {"_id": ObjectId(user["_id"])},
        {"$set": {"totp_pending_secret": secret, "totp_pending_created_at": datetime.now(timezone.utc)}},
    )
    return {"secret": secret, "otpauth_url": uri, "issuer": issuer, "account": account}

@api_router.post("/auth/2fa/verify-setup")
async def verify_setup_2fa(data: TwoFAVerifySetup, request: Request):
    """Verify a TOTP code against the pending secret and activate 2FA. Returns backup codes (plaintext, shown once)."""
    user = await get_current_user(request)
    if user.get("role") != "super_admin":
        raise HTTPException(status_code=403, detail="Chỉ Super Admin được bật 2FA")
    user_doc = await db.users.find_one({"_id": ObjectId(user["_id"])})
    pending = user_doc.get("totp_pending_secret")
    if not pending:
        raise HTTPException(status_code=400, detail="Chưa khởi tạo 2FA. Vui lòng gọi /auth/2fa/setup trước.")
    totp = pyotp.TOTP(pending)
    if not totp.verify(data.code.strip(), valid_window=1):
        raise HTTPException(status_code=400, detail="Mã không đúng. Thử lại.")
    # Generate backup codes
    plaintext_codes = generate_backup_codes(8)
    hashed_codes = [{"hash": hash_backup_code(c), "used": False} for c in plaintext_codes]
    await db.users.update_one(
        {"_id": ObjectId(user["_id"])},
        {
            "$set": {
                "totp_secret": pending,
                "totp_enabled": True,
                "totp_enabled_at": datetime.now(timezone.utc),
                "totp_backup_codes": hashed_codes,
            },
            "$unset": {"totp_pending_secret": "", "totp_pending_created_at": ""},
        },
    )
    return {"enabled": True, "backup_codes": plaintext_codes}

@api_router.post("/auth/2fa/verify")
async def verify_2fa_login(data: TwoFALoginVerify, response: Response):
    """Second step of login: verify TOTP code against pending_token and issue full access token."""
    try:
        payload = jwt.decode(data.pending_token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        if payload.get("type") != "2fa_pending":
            raise HTTPException(status_code=400, detail="Token không hợp lệ")
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=400, detail="Phiên 2FA đã hết hạn. Vui lòng đăng nhập lại.")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=400, detail="Token không hợp lệ")

    user_id = payload["sub"]
    email = payload["email"]
    role = payload["role"]
    user_doc = await db.users.find_one({"_id": ObjectId(user_id)})
    if not user_doc or not user_doc.get("totp_enabled"):
        raise HTTPException(status_code=400, detail="2FA không được bật")

    code = data.code.strip()
    secret = user_doc.get("totp_secret")
    totp = pyotp.TOTP(secret)
    verified = False
    used_backup = False
    if totp.verify(code, valid_window=1):
        verified = True
    else:
        # Try backup codes
        codes = user_doc.get("totp_backup_codes") or []
        for idx, bc in enumerate(codes):
            if not bc.get("used") and verify_backup_code(code, bc["hash"]):
                verified = True
                used_backup = True
                codes[idx]["used"] = True
                codes[idx]["used_at"] = datetime.now(timezone.utc)
                await db.users.update_one({"_id": ObjectId(user_id)}, {"$set": {"totp_backup_codes": codes}})
                break
    if not verified:
        raise HTTPException(status_code=401, detail="Mã xác thực không đúng")

    access_token = create_access_token(user_id, email, role)
    set_auth_cookies(response, access_token, create_refresh_token(user_id))
    return {
        "id": user_id, "email": email, "name": user_doc.get("name"),
        "role": role, "shop_id": user_doc.get("shop_id"),
        "token": access_token, "used_backup_code": used_backup,
    }

@api_router.post("/auth/2fa/disable")
async def disable_2fa(data: TwoFADisable, request: Request):
    """Disable 2FA. Requires a valid TOTP or backup code."""
    user = await get_current_user(request)
    user_doc = await db.users.find_one({"_id": ObjectId(user["_id"])})
    if not user_doc.get("totp_enabled"):
        raise HTTPException(status_code=400, detail="2FA chưa được bật")
    secret = user_doc.get("totp_secret")
    code = data.code.strip()
    verified = pyotp.TOTP(secret).verify(code, valid_window=1) if secret else False
    if not verified:
        for bc in user_doc.get("totp_backup_codes") or []:
            if not bc.get("used") and verify_backup_code(code, bc["hash"]):
                verified = True
                break
    if not verified:
        raise HTTPException(status_code=401, detail="Mã xác thực không đúng")
    await db.users.update_one(
        {"_id": ObjectId(user["_id"])},
        {"$unset": {"totp_secret": "", "totp_enabled": "", "totp_enabled_at": "", "totp_backup_codes": "", "totp_pending_secret": ""}},
    )
    return {"message": "Đã tắt 2FA", "enabled": False}

@api_router.post("/auth/2fa/backup-codes/regenerate")
async def regenerate_backup_codes(data: TwoFAVerifySetup, request: Request):
    """Regenerate backup codes. Requires a valid TOTP code."""
    user = await get_current_user(request)
    user_doc = await db.users.find_one({"_id": ObjectId(user["_id"])})
    if not user_doc.get("totp_enabled"):
        raise HTTPException(status_code=400, detail="2FA chưa được bật")
    if not pyotp.TOTP(user_doc["totp_secret"]).verify(data.code.strip(), valid_window=1):
        raise HTTPException(status_code=401, detail="Mã TOTP không đúng")
    plaintext_codes = generate_backup_codes(8)
    hashed_codes = [{"hash": hash_backup_code(c), "used": False} for c in plaintext_codes]
    await db.users.update_one({"_id": ObjectId(user["_id"])}, {"$set": {"totp_backup_codes": hashed_codes}})
    return {"backup_codes": plaintext_codes}

class TwoFARecoverStart(BaseModel):
    email: EmailStr

@api_router.post("/auth/2fa/recover-start")
async def recover_2fa_start(data: TwoFARecoverStart):
    """Email-based 2FA recovery: sends a one-time link to disable 2FA."""
    email = data.email.lower()
    user = await db.users.find_one({"email": email, "totp_enabled": True, "role": "super_admin"})
    # Always return success to prevent email enumeration
    if not user:
        return {"message": "If this email exists and has 2FA enabled, a recovery link has been sent."}
    token = secrets.token_urlsafe(32)
    await db.password_resets.insert_one({
        "user_id": str(user["_id"]),
        "token": token,
        "purpose": "2fa_recovery",
        "used": False,
        "created_at": datetime.now(timezone.utc),
        "expires_at": datetime.now(timezone.utc) + timedelta(minutes=30),
    })
    recovery_link = f"{os.environ.get('FRONTEND_URL','')}/2fa-recover?token={token}"
    # Send email
    try:
        resend.api_key = os.environ.get("RESEND_API_KEY")
        resend.Emails.send({
            "from": os.environ.get("SENDER_EMAIL", "no-reply@proid.vn"),
            "to": email,
            "subject": "[Pro ID Shop] Khôi phục 2FA",
            "html": f"""
            <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px">
              <h2 style="color:#0F172A">Khôi phục 2FA</h2>
              <p>Chúng tôi nhận được yêu cầu tắt xác thực 2 bước (2FA) cho tài khoản <b>{email}</b>.</p>
              <p>Nếu đây là bạn, bấm vào nút bên dưới để xác nhận. Link hết hạn sau 30 phút.</p>
              <p><a href="{recovery_link}" style="background:#EF4444;color:white;padding:12px 24px;text-decoration:none;border-radius:6px;display:inline-block">Tắt 2FA</a></p>
              <p style="color:#64748B;font-size:12px">Nếu không phải bạn, hãy bỏ qua email này và kiểm tra tài khoản.</p>
            </div>
            """,
        })
    except Exception as e:
        logger.error(f"2FA recovery email failed: {e}")
    return {"message": "If this email exists and has 2FA enabled, a recovery link has been sent."}

class TwoFARecoverComplete(BaseModel):
    token: str

@api_router.post("/auth/2fa/recover-complete")
async def recover_2fa_complete(data: TwoFARecoverComplete):
    """Complete 2FA recovery via the email link token. Disables 2FA."""
    doc = await db.password_resets.find_one({
        "token": data.token, "used": False, "purpose": "2fa_recovery",
        "expires_at": {"$gt": datetime.now(timezone.utc)},
    })
    if not doc:
        raise HTTPException(status_code=400, detail="Token không hợp lệ hoặc đã hết hạn")
    await db.users.update_one(
        {"_id": ObjectId(doc["user_id"])},
        {"$unset": {"totp_secret": "", "totp_enabled": "", "totp_enabled_at": "", "totp_backup_codes": "", "totp_pending_secret": ""}},
    )
    await db.password_resets.update_one({"_id": doc["_id"]}, {"$set": {"used": True, "used_at": datetime.now(timezone.utc)}})
    return {"message": "Đã tắt 2FA. Bạn có thể đăng nhập và bật lại trong Profile."}

# ==================== SUPER ADMIN ENDPOINTS ====================

@api_router.get("/admin/stats")
async def get_admin_stats(request: Request):
    await require_super_admin(request)
    total_shops = await db.shops.count_documents({})
    active_shops = await db.shops.count_documents({"status": "active"})
    total_orders = await db.orders.count_documents({})
    total_users = await db.users.count_documents({"role": "shop_owner"})
    pipeline = [{"$group": {"_id": None, "total": {"$sum": "$total_amount"}}}]
    rev = await db.orders.aggregate(pipeline).to_list(1)
    return {"total_shops": total_shops, "active_shops": active_shops, "total_orders": total_orders, "total_shop_owners": total_users, "total_revenue": rev[0]["total"] if rev else 0}

@api_router.get("/admin/shops")
async def get_all_shops(request: Request):
    await require_super_admin(request)
    shops = await db.shops.find().sort("created_at", -1).to_list(100)
    result = []
    for s in shops:
        sid = str(s["_id"])
        owner = await db.users.find_one({"shop_id": sid}, {"_id": 0, "email": 1, "name": 1})
        oc = await db.orders.count_documents({"shop_id": sid})
        pc = await db.products.count_documents({"shop_id": sid})
        cc = await db.categories.count_documents({"shop_id": sid})
        result.append({
            "id": sid, "name": s["name"], "slug": s["slug"], "status": s.get("status", "active"),
            "expiry_date": s.get("expiry_date", ""), "theme_color": s.get("theme_color", "#0055FF"),
            "contact_phone": s.get("contact_phone", ""), "contact_email": s.get("contact_email", ""),
            "address": s.get("address", ""),
            "max_products": s.get("max_products", 100), "max_posts": s.get("max_posts", 50),
            "max_pages": s.get("max_pages", 20), "max_categories": s.get("max_categories", 50),
            "created_at": serialize_datetime(s.get("created_at")),
            "owner": owner, "order_count": oc, "product_count": pc, "category_count": cc,
            "item_count": pc,
            "agents_enabled": s.get("agents_enabled", False),
        })
    return result

@api_router.post("/admin/shops/{shop_id}/status")
async def update_shop_status(shop_id: str, status: str = Query(...), request: Request = None):
    await require_super_admin(request)
    if status not in ["active", "suspended"]:
        raise HTTPException(status_code=400, detail="Invalid status")
    result = await db.shops.update_one({"_id": ObjectId(shop_id)}, {"$set": {"status": status}})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Shop not found")
    return {"message": f"Shop status updated to {status}"}

@api_router.post("/admin/shops/{shop_id}/expiry")
async def update_shop_expiry(shop_id: str, data: ExpiryUpdate, request: Request):
    await require_super_admin(request)
    await db.shops.update_one({"_id": ObjectId(shop_id)}, {"$set": {"expiry_date": data.expiry_date or ""}})
    return {"message": "Expiry date updated"}

@api_router.put("/admin/shops/{shop_id}/limits")
async def update_shop_limits(shop_id: str, request: Request):
    await require_super_admin(request)
    body = await request.json()
    update = {}
    for field in ["max_products", "max_posts", "max_pages", "max_categories", "max_agents", "max_images"]:
        if field in body:
            update[field] = int(body[field])
    if update:
        await db.shops.update_one({"_id": ObjectId(shop_id)}, {"$set": update})
    return {"message": "Limits updated"}

@api_router.get("/admin/users")
async def get_all_users(request: Request):
    await require_super_admin(request)
    users = await db.users.find({}, {"password_hash": 0}).sort("created_at", -1).to_list(100)
    result = []
    for u in users:
        shop_data = None
        if u.get("shop_id"):
            shop = await db.shops.find_one({"_id": ObjectId(u["shop_id"])})
            if shop:
                sid = str(shop["_id"])
                pc = await db.products.count_documents({"shop_id": sid})
                oc = await db.orders.count_documents({"shop_id": sid})
                cc = await db.categories.count_documents({"shop_id": sid})
                ic = await db.files.count_documents({"shop_id": sid, "is_deleted": False})
                shop_data = {
                    "id": sid, "name": shop.get("name"), "slug": shop.get("slug"),
                    "status": shop.get("status", "active"),
                    "theme_color": shop.get("theme_color", "#0055FF"),
                    "contact_phone": shop.get("contact_phone", ""),
                    "contact_email": shop.get("contact_email", ""),
                    "expiry_date": shop.get("expiry_date", ""),
                    "product_count": pc, "order_count": oc, "category_count": cc, "image_count": ic,
                    "max_products": shop.get("max_products", 100),
                    "max_posts": shop.get("max_posts", 50),
                    "max_pages": shop.get("max_pages", 20),
                    "max_categories": shop.get("max_categories", 50),
                    "max_agents": shop.get("max_agents", 100),
                    "max_images": shop.get("max_images", 500),
                    "agents_enabled": shop.get("agents_enabled", False),
                }
        result.append({
            "id": str(u["_id"]), "email": u["email"], "name": u["name"], "role": u["role"],
            "status": u.get("status", "active"),
            "phone": u.get("phone", ""),
            "shop_name": shop_data["name"] if shop_data else None,
            "shop_slug": shop_data["slug"] if shop_data else None,
            "shop_id": u.get("shop_id"),
            "shop": shop_data,
            "created_at": serialize_datetime(u.get("created_at"))
        })
    return result

@api_router.post("/admin/users")
async def create_shop_owner(data: ShopOwnerCreate, request: Request):
    await require_super_admin_only(request)
    email = data.email.lower()
    if await db.users.find_one({"email": email}):
        raise HTTPException(status_code=400, detail="Email already registered")
    slug = generate_shop_slug(data.shop_name)
    if await db.shops.find_one({"slug": slug}):
        slug = f"{slug}-{secrets.token_hex(3)}"
    shop_doc = {"name": data.shop_name, "slug": slug, "description": "", "logo_url": "", "contact_phone": data.phone or "", "contact_email": email, "address": "", "social_facebook": "", "social_instagram": "", "theme_color": "#0055FF", "status": "active", "expiry_date": "", "banners": [], "banner_enabled": True, "blog_enabled": True, "layout_sections": [], "footer_columns": [], "menu_items": [], "mega_menu_categories": [], "custom_pages": [], "post_carousel_position": "top", "max_products": 100, "max_posts": 50, "max_pages": 20, "max_categories": 50, "created_at": datetime.now(timezone.utc)}
    shop_result = await db.shops.insert_one(shop_doc)
    shop_id = str(shop_result.inserted_id)
    user_doc = {"email": email, "password_hash": hash_password(data.password), "name": data.name, "role": "shop_owner", "shop_id": shop_id, "phone": data.phone or "", "status": "active", "created_at": datetime.now(timezone.utc)}
    user_result = await db.users.insert_one(user_doc)
    if data.send_email and RESEND_API_KEY:
        try:
            html = f"""<div style="font-family:Arial,sans-serif;max-width:500px;margin:0 auto;background:#fff;">
              <div style="background:linear-gradient(135deg,#0055FF,#00C2FF);padding:24px 32px;border-radius:8px 8px 0 0;">
                <h1 style="margin:0;color:#fff;font-size:20px;">Chao mung den {data.shop_name}!</h1>
              </div>
              <div style="padding:24px 32px;border:1px solid #E2E8F0;border-top:none;border-radius:0 0 8px 8px;">
                <p style="color:#334155;font-size:14px;">Xin chao <strong>{data.name}</strong>,</p>
                <p style="color:#334155;font-size:14px;">Tai khoan cua hang cua ban da duoc tao. Duoi day la thong tin dang nhap:</p>
                <div style="background:#F8FAFC;border-radius:8px;padding:16px;margin:16px 0;">
                  <p style="margin:0 0 8px;color:#0F172A;font-size:14px;"><strong>Email:</strong> {email}</p>
                  <p style="margin:0 0 8px;color:#0F172A;font-size:14px;"><strong>Mat khau:</strong> {data.password}</p>
                  <p style="margin:0;color:#0F172A;font-size:14px;"><strong>Cua hang:</strong> {data.shop_name}</p>
                </div>
                <p style="color:#64748B;font-size:12px;">Vui long doi mat khau sau khi dang nhap lan dau.</p>
              </div></div>"""
            params = {"from": SENDER_EMAIL, "to": [email], "subject": f"Thong tin dang nhap - {data.shop_name}", "html": html}
            await asyncio.to_thread(resend.Emails.send, params)
            logger.info(f"Login info email sent to {email}")
        except Exception as e:
            logger.error(f"Failed to send login email to {email}: {e}")
    return {"id": str(user_result.inserted_id), "email": email, "name": data.name, "shop_id": shop_id, "shop_name": data.shop_name}

@api_router.post("/admin/users/{user_id}/block")
async def block_user(user_id: str, request: Request):
    await require_super_admin(request)
    user = await db.users.find_one({"_id": ObjectId(user_id)})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user["role"] == "super_admin":
        raise HTTPException(status_code=400, detail="Cannot block super admin")
    new_status = "active" if user.get("status") == "blocked" else "blocked"
    await db.users.update_one({"_id": ObjectId(user_id)}, {"$set": {"status": new_status}})
    return {"message": f"User status updated to {new_status}"}

@api_router.delete("/admin/users/{user_id}")
async def delete_user(user_id: str, request: Request):
    await require_super_admin_only(request)
    user = await db.users.find_one({"_id": ObjectId(user_id)})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user["role"] == "super_admin":
        raise HTTPException(status_code=400, detail="Cannot delete super admin")
    if user.get("shop_id"):
        await db.shops.delete_one({"_id": ObjectId(user["shop_id"])})
        await db.products.delete_many({"shop_id": user["shop_id"]})
        await db.categories.delete_many({"shop_id": user["shop_id"]})
        await db.orders.delete_many({"shop_id": user["shop_id"]})
        await db.posts.delete_many({"shop_id": user["shop_id"]})
    await db.users.delete_one({"_id": ObjectId(user_id)})
    return {"message": "User deleted"}

@api_router.put("/admin/users/{user_id}")
async def admin_update_user(user_id: str, request: Request):
    await require_super_admin(request)
    body = await request.json()
    user = await db.users.find_one({"_id": ObjectId(user_id)})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user_update = {}
    if "name" in body and body["name"]:
        user_update["name"] = bleach.clean(body["name"], tags=[], strip=True)
    if "email" in body and body["email"]:
        new_email = body["email"].lower().strip()
        if new_email != user["email"]:
            existing = await db.users.find_one({"email": new_email})
            if existing:
                raise HTTPException(status_code=400, detail="Email đã tồn tại")
            user_update["email"] = new_email
    if "phone" in body:
        user_update["phone"] = bleach.clean(body["phone"] or "", tags=[], strip=True)
    if user_update:
        await db.users.update_one({"_id": ObjectId(user_id)}, {"$set": user_update})
    # Update shop name if provided
    if "shop_name" in body and body["shop_name"] and user.get("shop_id"):
        await db.shops.update_one({"_id": ObjectId(user["shop_id"])}, {"$set": {"name": bleach.clean(body["shop_name"], tags=[], strip=True)}})
    return {"message": "User updated"}

@api_router.post("/admin/users/{user_id}/reset-password")
async def admin_reset_password(user_id: str, request: Request):
    await require_super_admin(request)
    user = await db.users.find_one({"_id": ObjectId(user_id)})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    default_pw = "iLoveProID@"
    await db.users.update_one({"_id": ObjectId(user_id)}, {"$set": {"password_hash": hash_password(default_pw)}})
    return {"message": f"Password reset to: {default_pw}"}

@api_router.post("/admin/users/{user_id}/send-login-email")
async def send_login_email(user_id: str, request: Request):
    await require_super_admin(request)
    if not RESEND_API_KEY:
        raise HTTPException(status_code=400, detail="Email service not configured")
    user = await db.users.find_one({"_id": ObjectId(user_id)})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    shop_name = ""
    if user.get("shop_id"):
        shop = await db.shops.find_one({"_id": ObjectId(user["shop_id"])}, {"name": 1})
        shop_name = shop.get("name", "") if shop else ""
    default_pw = "iLoveProID@"
    await db.users.update_one({"_id": ObjectId(user_id)}, {"$set": {"password_hash": hash_password(default_pw)}})
    login_url = os.environ.get("FRONTEND_URL", "https://shop.proid.vn")
    html = f"""<div style="font-family:Arial,sans-serif;max-width:500px;margin:0 auto;background:#fff;">
      <div style="background:linear-gradient(135deg,#CC0000,#FF4444);padding:24px 32px;border-radius:8px 8px 0 0;">
        <h1 style="margin:0;color:#fff;font-size:20px;">Thông tin đăng nhập</h1>
        <p style="margin:4px 0 0;color:rgba(255,255,255,0.85);font-size:14px;">{shop_name}</p>
      </div>
      <div style="padding:24px 32px;border:1px solid #E2E8F0;border-top:none;border-radius:0 0 8px 8px;">
        <p style="color:#334155;font-size:14px;">Xin chào <strong>{user.get('name','')}</strong>,</p>
        <p style="color:#334155;font-size:14px;">Dưới đây là thông tin đăng nhập của bạn:</p>
        <div style="background:#F8FAFC;border-radius:8px;padding:16px;margin:16px 0;">
          <p style="margin:0 0 8px;color:#0F172A;font-size:14px;"><strong>Email:</strong> {user['email']}</p>
          <p style="margin:0 0 8px;color:#0F172A;font-size:14px;"><strong>Mật khẩu:</strong> {default_pw}</p>
          <p style="margin:0;color:#0F172A;font-size:14px;"><strong>Đăng nhập tại:</strong> <a href="{login_url}" style="color:#CC0000;">{login_url}</a></p>
        </div>
        <a href="{login_url}" style="display:inline-block;background:linear-gradient(135deg,#CC0000,#FF4444);color:#fff;text-decoration:none;padding:12px 32px;border-radius:8px;font-size:14px;font-weight:600;margin-top:8px;">Đăng nhập ngay</a>
        <p style="color:#64748B;font-size:12px;margin-top:16px;">Vui lòng đổi mật khẩu sau khi đăng nhập.</p>
      </div></div>"""
    try:
        params = {"from": SENDER_EMAIL, "to": [user["email"]], "subject": f"Thông tin đăng nhập - {shop_name or 'Pro ID Shop'}", "html": html}
        await asyncio.to_thread(resend.Emails.send, params)
        return {"message": f"Email sent to {user['email']}"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to send email: {str(e)}")

# ==================== ADMIN MAINTENANCE ====================

@api_router.get("/admin/maintenance/preview")
async def maintenance_preview(request: Request):
    await require_super_admin_only(request)
    one_year_ago = datetime.now(timezone.utc) - timedelta(days=365)
    old_orders = await db.orders.count_documents({"created_at": {"$lt": one_year_ago}})
    orphaned_files = await db.files.count_documents({"is_deleted": True})
    return {"old_orders_count": old_orders, "orphaned_files_count": orphaned_files}

@api_router.post("/admin/maintenance/cleanup-orders")
async def cleanup_orders(request: Request):
    await require_super_admin(request)
    one_year_ago = datetime.now(timezone.utc) - timedelta(days=365)
    result = await db.orders.delete_many({"created_at": {"$lt": one_year_ago}})
    return {"deleted_count": result.deleted_count, "message": f"Deleted {result.deleted_count} old orders"}

@api_router.post("/admin/maintenance/cleanup-images")
async def cleanup_images(request: Request):
    await require_super_admin(request)
    orphaned = await db.files.find({"is_deleted": True}).to_list(100)
    count = 0
    for f in orphaned:
        delete_object(f.get("storage_path", ""))
        await db.files.delete_one({"_id": f["_id"]})
        count += 1
    return {"deleted_count": count, "message": f"Cleaned up {count} orphaned files"}

# ==================== IMAGE UPLOAD ====================

@api_router.post("/upload/image")
async def upload_image(file: UploadFile = File(...), request: Request = None):
    allowed = ["image/jpeg", "image/png", "image/gif", "image/webp"]
    if file.content_type not in allowed:
        raise HTTPException(status_code=400, detail="Invalid file type")
    data = await file.read()
    if len(data) > 10 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File too large (max 10MB before compression)")

    original_size = len(data)
    compressed_data, out_content_type = compress_image(data, file.content_type)
    compressed_size = len(compressed_data)
    logger.info(f"Image compressed: {original_size / 1024:.0f}KB -> {compressed_size / 1024:.0f}KB ({file.filename})")

    # Try to get shop_id from auth
    shop_id = None
    try:
        user = await get_current_user(request)
        if user.get("role") == "shop_owner":
            shop_id = user.get("shop_id")
            # Check image upload limit
            if shop_id:
                shop_doc = await db.shops.find_one({"_id": ObjectId(shop_id)}, {"max_images": 1})
                max_images = (shop_doc or {}).get("max_images", 500)
                current_count = await db.files.count_documents({"shop_id": shop_id, "is_deleted": False})
                if current_count >= max_images:
                    raise HTTPException(status_code=400, detail=f"Đã đạt giới hạn {max_images} ảnh. Vui lòng xóa ảnh cũ hoặc liên hệ quản trị viên.")
        elif user.get("role") == "super_admin":
            shop_id = "admin"
    except HTTPException:
        raise
    except:
        pass

    file_id = str(uuid_lib.uuid4())
    ext = "webp"
    path = f"{APP_NAME}/products/{file_id}.{ext}"
    try:
        result = put_object(path, compressed_data, out_content_type)
        await db.files.insert_one({
            "id": file_id, "shop_id": shop_id, "storage_path": result["path"],
            "original_filename": file.filename, "content_type": out_content_type,
            "size": compressed_size, "original_size": original_size,
            "is_deleted": False, "created_at": datetime.now(timezone.utc)
        })
        return {"id": file_id, "path": result["path"], "url": f"/api/files/{file_id}",
                "size": compressed_size, "original_size": original_size}
    except Exception as e:
        logger.error(f"Upload to R2 failed: {e}")
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")

@api_router.get("/dashboard/media")
async def get_media_library(request: Request, page: int = 1, limit: int = 40):
    user = await require_shop_owner(request)
    shop_id = await resolve_shop_id(request, user)
    skip = (page - 1) * limit
    total = await db.files.count_documents({"shop_id": shop_id, "is_deleted": False})
    files = await db.files.find(
        {"shop_id": shop_id, "is_deleted": False},
        {"_id": 0, "id": 1, "original_filename": 1, "size": 1, "created_at": 1}
    ).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    for f in files:
        f["url"] = f"/api/files/{f['id']}"
        f["created_at"] = serialize_datetime(f.get("created_at"))
    return {"items": files, "total": total, "page": page, "pages": (total + limit - 1) // limit}

@api_router.delete("/dashboard/media/{file_id}")
async def delete_media(file_id: str, request: Request):
    user = await require_shop_owner(request)
    shop_id = await resolve_shop_id(request, user)
    result = await db.files.update_one({"id": file_id, "shop_id": shop_id}, {"$set": {"is_deleted": True}})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="File not found")
    return {"message": "File deleted"}


from functools import lru_cache

# In-memory file cache (up to 100 files, ~20MB max)
_file_cache = {}
_FILE_CACHE_MAX = 100

@api_router.get("/files/{file_id}")
async def get_file(file_id: str, request: Request):
    # Check If-None-Match for 304 response
    if_none_match = request.headers.get("if-none-match")
    if if_none_match and if_none_match.strip('"') == file_id:
        return Response(status_code=304)

    # Check in-memory cache first
    if file_id in _file_cache:
        data, ct = _file_cache[file_id]
        return Response(
            content=data, media_type=ct,
            headers={"Cache-Control": "public, max-age=31536000, immutable", "ETag": f'"{file_id}"'}
        )

    file_doc = await db.files.find_one({"id": file_id, "is_deleted": False})
    if not file_doc:
        raise HTTPException(status_code=404, detail="File not found")
    try:
        data, ct = get_object(file_doc["storage_path"])
        ct = file_doc.get("content_type", ct)

        # Cache in memory
        if len(_file_cache) >= _FILE_CACHE_MAX:
            oldest = next(iter(_file_cache))
            del _file_cache[oldest]
        _file_cache[file_id] = (data, ct)

        return Response(
            content=data, media_type=ct,
            headers={"Cache-Control": "public, max-age=31536000, immutable", "ETag": f'"{file_id}"'}
        )
    except Exception as e:
        logger.error(f"Download from R2 failed: {e}")
        raise HTTPException(status_code=500, detail="Download failed")

# ==================== DASHBOARD - SHOP ====================

@api_router.get("/dashboard/stats")
async def get_dashboard_stats(request: Request):
    user = await require_shop_owner(request)
    shop_id = await resolve_shop_id(request, user)
    tp = await db.products.count_documents({"shop_id": shop_id})
    to = await db.orders.count_documents({"shop_id": shop_id})
    po = await db.orders.count_documents({"shop_id": shop_id, "status": "pending"})
    pipeline = [{"$match": {"shop_id": shop_id}}, {"$group": {"_id": None, "total": {"$sum": "$total_amount"}}}]
    rev = await db.orders.aggregate(pipeline).to_list(1)
    return {"total_products": tp, "total_orders": to, "pending_orders": po, "total_revenue": rev[0]["total"] if rev else 0}

@api_router.get("/dashboard/shop")
async def get_shop_details(request: Request):
    user = await require_shop_owner(request)
    shop_id = await resolve_shop_id(request, user)
    shop = await db.shops.find_one({"_id": ObjectId(shop_id)})
    if not shop:
        raise HTTPException(status_code=404, detail="Shop not found")
    return {
        "id": str(shop["_id"]), "name": shop["name"], "slug": shop["slug"],
        "description": shop.get("description", ""), "logo_url": shop.get("logo_url", ""),
        "contact_phone": shop.get("contact_phone", ""), "contact_email": shop.get("contact_email", ""),
        "address": shop.get("address", ""), "google_map_url": shop.get("google_map_url", ""),
        "social_facebook": shop.get("social_facebook", ""),
        "social_instagram": shop.get("social_instagram", ""), "theme_color": shop.get("theme_color", "#0055FF"),
        "status": shop.get("status", "active"), "expiry_date": shop.get("expiry_date", ""),
        "custom_domain": shop.get("custom_domain", ""),
        "banners": shop.get("banners", []), "banner_enabled": shop.get("banner_enabled", True),
        "blog_enabled": shop.get("blog_enabled", True),
        "layout_sections": shop.get("layout_sections", []),
        "footer_columns": shop.get("footer_columns", []),
        "post_carousel_position": shop.get("post_carousel_position", "top"),
        "max_products": shop.get("max_products", 100), "max_posts": shop.get("max_posts", 50),
        "agents_enabled": shop.get("agents_enabled", False),
    }

@api_router.put("/dashboard/shop")
async def update_shop(request: Request):
    user = await require_shop_owner(request)
    shop_id = await resolve_shop_id(request, user)
    body = await request.json()
    if not body:
        raise HTTPException(status_code=400, detail="No data to update")
    if "slug" in body and body["slug"]:
        new_slug = body["slug"].lower().strip().replace(" ", "-")
        import re
        new_slug = re.sub(r'[^a-z0-9-]', '', new_slug).strip('-')
        if new_slug:
            existing = await db.shops.find_one({"slug": new_slug, "_id": {"$ne": ObjectId(shop_id)}})
            if existing:
                raise HTTPException(status_code=400, detail="Permalink đã tồn tại")
            body["slug"] = new_slug
        else:
            del body["slug"]
    await db.shops.update_one({"_id": ObjectId(shop_id)}, {"$set": body})
    return {"message": "Shop updated"}

# ==================== DASHBOARD - CATEGORIES ====================

@api_router.get("/dashboard/categories")
async def get_shop_categories(request: Request):
    user = await require_shop_owner(request)
    shop_id = await resolve_shop_id(request, user)
    cats = await db.categories.find({"shop_id": shop_id}, {"_id": 0}).sort("position", 1).to_list(200)
    return cats

@api_router.post("/dashboard/categories")
async def create_category(data: CategoryCreate, request: Request):
    user = await require_shop_owner(request)
    shop_id = await resolve_shop_id(request, user)
    shop = await db.shops.find_one({"_id": ObjectId(shop_id)}, {"max_categories": 1})
    max_cats = (shop or {}).get("max_categories", 50)
    count = await db.categories.count_documents({"shop_id": shop_id})
    if count >= max_cats:
        raise HTTPException(status_code=400, detail=f"Đã đạt giới hạn {max_cats} danh mục")
    max_pos = 0
    last = await db.categories.find({"shop_id": shop_id}).sort("position", -1).limit(1).to_list(1)
    if last:
        max_pos = last[0].get("position", 0)
    cat_id = f"cat-{secrets.token_hex(6)}"
    doc = {"id": cat_id, "shop_id": shop_id, "name": data.name, "description": data.description, "position": max_pos + 1, "parent_id": data.parent_id or None, "image_url": data.image_url or "", "created_at": datetime.now(timezone.utc)}
    await db.categories.insert_one(doc)
    return {"id": cat_id, "name": data.name, "description": data.description, "position": max_pos + 1, "parent_id": data.parent_id or None, "image_url": data.image_url or ""}

@api_router.put("/dashboard/categories/positions")
async def update_category_positions(request: Request):
    user = await require_shop_owner(request)
    shop_id = await resolve_shop_id(request, user)
    body = await request.json()
    positions = body.get("positions", [])
    for item in positions:
        await db.categories.update_one({"id": item["id"], "shop_id": shop_id}, {"$set": {"position": item["position"]}})
    return {"message": "Positions updated"}

@api_router.put("/dashboard/categories/{cat_id}")
async def update_category(cat_id: str, data: CategoryCreate, request: Request):
    user = await require_shop_owner(request)
    shop_id = await resolve_shop_id(request, user)
    result = await db.categories.update_one({"id": cat_id, "shop_id": shop_id}, {"$set": {"name": data.name, "description": data.description, "image_url": data.image_url or "", "parent_id": data.parent_id or None}})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Category not found")
    return {"message": "Category updated"}

@api_router.delete("/dashboard/categories/{cat_id}")
async def delete_category(cat_id: str, request: Request):
    user = await require_shop_owner(request)
    shop_id = await resolve_shop_id(request, user)
    result = await db.categories.delete_one({"id": cat_id, "shop_id": shop_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Category not found")
    await db.products.update_many({"shop_id": shop_id, "category_id": cat_id}, {"$set": {"category_id": None, "category": ""}})
    return {"message": "Category deleted"}

# ==================== DASHBOARD - PRODUCTS ====================

@api_router.get("/dashboard/products")
async def get_shop_products(request: Request):
    user = await require_shop_owner(request)
    shop_id = await resolve_shop_id(request, user)
    products = await db.products.find({"shop_id": shop_id}, {"_id": 0}).sort("position", 1).to_list(500)
    return products

@api_router.post("/dashboard/products")
async def create_product(data: ProductCreate, request: Request):
    user = await require_shop_owner(request)
    shop_id = await resolve_shop_id(request, user)
    # Security: Validate word limit for description
    validate_word_limit(data.description, "Mô tả sản phẩm")
    # Security: Sanitize HTML in description
    data.description = sanitize_html(data.description)
    shop = await db.shops.find_one({"_id": ObjectId(shop_id)}, {"max_products": 1})
    max_prods = (shop or {}).get("max_products", 100)
    count = await db.products.count_documents({"shop_id": shop_id})
    if count >= max_prods:
        raise HTTPException(status_code=400, detail=f"Đã đạt giới hạn {max_prods} sản phẩm")
    cat_name = ""
    if data.category_id and data.category_id != "none":
        cat = await db.categories.find_one({"id": data.category_id, "shop_id": shop_id})
        cat_name = cat["name"] if cat else ""
    else:
        data.category_id = None
    images = data.images or []
    if data.image_url and data.image_url not in images:
        images = [data.image_url] + images
    image_url = images[0] if images else data.image_url or ""
    prod_id = f"prod-{secrets.token_hex(6)}"
    doc = {
        "id": prod_id, "shop_id": shop_id, "name": data.name, "price": data.price,
        "category_id": data.category_id, "category": cat_name, "description": data.description,
        "image_url": image_url, "images": images, "video_url": data.video_url or "",
        "video_links": data.video_links or [],
        "position": data.position or 0,
        "is_active": data.is_active if data.is_active is not None else True,
        "is_hidden": bool(data.is_hidden),
        "out_of_stock": bool(data.out_of_stock),
        "is_featured": data.is_featured or False, "sku": data.sku or "",
        "type": data.type if data.type in ("product", "service") else "product",
        "created_at": datetime.now(timezone.utc)
    }
    await db.products.insert_one(doc)
    doc.pop("_id", None)
    return doc

@api_router.put("/dashboard/products/{prod_id}")
async def update_product(prod_id: str, request: Request):
    user = await require_shop_owner(request)
    shop_id = await resolve_shop_id(request, user)
    body = await request.json()
    # Remove deprecated field "stock" if present - we no longer use it
    body.pop("stock", None)
    # Security: Validate word limit and sanitize description
    if "description" in body and body["description"]:
        validate_word_limit(body["description"], "Mô tả sản phẩm")
        body["description"] = sanitize_html(body["description"])
    if "category_id" in body:
        cid = body["category_id"]
        if cid and cid != "none":
            cat = await db.categories.find_one({"id": cid, "shop_id": shop_id})
            body["category"] = cat["name"] if cat else ""
        else:
            body["category_id"] = None
            body["category"] = ""
    if "images" in body:
        imgs = body["images"]
        if imgs:
            body["image_url"] = imgs[0]
    result = await db.products.update_one({"id": prod_id, "shop_id": shop_id}, {"$set": body})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Product not found")
    updated = await db.products.find_one({"id": prod_id}, {"_id": 0})
    return updated

@api_router.delete("/dashboard/products/{prod_id}")
async def delete_product(prod_id: str, request: Request):
    user = await require_shop_owner(request)
    shop_id = await resolve_shop_id(request, user)
    result = await db.products.delete_one({"id": prod_id, "shop_id": shop_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Product not found")
    return {"message": "Product deleted"}

# ==================== DASHBOARD - ORDERS ====================

@api_router.get("/dashboard/orders")
async def get_shop_orders(request: Request):
    user = await require_shop_owner(request)
    shop_id = await resolve_shop_id(request, user)
    orders = await db.orders.find({"shop_id": shop_id}, {"_id": 0}).sort("created_at", -1).to_list(500)
    # Collect agent IDs and fetch agent names
    agent_ids = set(o.get("agent_id") for o in orders if o.get("agent_id"))
    agent_map = {}
    if agent_ids:
        agents = await db.agents.find({"id": {"$in": list(agent_ids)}}, {"_id": 0, "id": 1, "name": 1, "tracking_code": 1}).to_list(200)
        agent_map = {a["id"]: a for a in agents}
    for o in orders:
        o["created_at"] = serialize_datetime(o.get("created_at"))
        if o.get("agent_id") and o["agent_id"] in agent_map:
            o["agent_name"] = agent_map[o["agent_id"]]["name"]
    return orders

@api_router.put("/dashboard/orders/{order_id}/status")
async def update_order_status(order_id: str, data: OrderStatusUpdate, request: Request):
    user = await require_shop_owner(request)
    shop_id = await resolve_shop_id(request, user)
    valid = ["pending", "confirmed", "processing", "shipped", "completed", "cancelled"]
    if data.status not in valid:
        raise HTTPException(status_code=400, detail="Invalid status")
    
    # Get the order first to check for agent referral
    order = await db.orders.find_one({"id": order_id, "shop_id": shop_id})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    old_status = order.get("status", "pending")
    await db.orders.update_one({"id": order_id, "shop_id": shop_id}, {"$set": {"status": data.status, "updated_at": datetime.now(timezone.utc)}})
    
    # Record agent sale when order is confirmed/completed (and not already recorded)
    if data.status in ["confirmed", "completed"] and old_status == "pending" and order.get("agent_id"):
        existing_sale = await db.agent_sales.find_one({"order_id": order_id})
        if not existing_sale:
            await db.agent_sales.insert_one({
                "id": f"as-{uuid_lib.uuid4().hex[:12]}",
                "shop_id": shop_id,
                "agent_id": order["agent_id"],
                "order_id": order_id,
                "amount": order.get("total_amount", 0),
                "created_at": datetime.now(timezone.utc),
            })
    
    # If order is cancelled, remove agent sale record
    if data.status == "cancelled" and order.get("agent_id"):
        await db.agent_sales.delete_one({"order_id": order_id})
    
    return {"message": f"Order status updated to {data.status}"}

# ==================== DASHBOARD - POSTS ====================

@api_router.get("/dashboard/posts")
async def get_shop_posts(request: Request):
    user = await require_shop_owner(request)
    shop_id = await resolve_shop_id(request, user)
    posts = await db.posts.find({"shop_id": shop_id}, {"_id": 0}).sort("created_at", -1).to_list(100)
    for p in posts:
        p["created_at"] = serialize_datetime(p.get("created_at"))
    return posts

@api_router.post("/dashboard/posts")
async def create_post(data: PostCreate, request: Request):
    user = await require_shop_owner(request)
    shop_id = await resolve_shop_id(request, user)
    # Security: Validate word limit and sanitize HTML
    validate_word_limit(data.description, "Nội dung bài viết")
    data.description = sanitize_html(data.description)
    shop = await db.shops.find_one({"_id": ObjectId(shop_id)}, {"max_posts": 1})
    max_p = (shop or {}).get("max_posts", 50)
    count = await db.posts.count_documents({"shop_id": shop_id})
    if count >= max_p:
        raise HTTPException(status_code=400, detail=f"Đã đạt giới hạn {max_p} bài viết")
    post_id = f"post-{secrets.token_hex(6)}"
    doc = {
        "id": post_id, "shop_id": shop_id, "title": data.title,
        "description": data.description, "thumbnail": data.thumbnail,
        "images": data.images or [], "attached_products": data.attached_products or [],
        "created_at": datetime.now(timezone.utc)
    }
    await db.posts.insert_one(doc)
    doc.pop("_id", None)
    doc["created_at"] = serialize_datetime(doc["created_at"])
    return doc

@api_router.put("/dashboard/posts/{post_id}")
async def update_post(post_id: str, request: Request):
    user = await require_shop_owner(request)
    shop_id = await resolve_shop_id(request, user)
    body = await request.json()
    body.pop("id", None)
    body.pop("shop_id", None)
    # Security: Validate word limit and sanitize HTML
    if "description" in body and body["description"]:
        validate_word_limit(body["description"], "Nội dung bài viết")
        body["description"] = sanitize_html(body["description"])
    result = await db.posts.update_one({"id": post_id, "shop_id": shop_id}, {"$set": body})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Post not found")
    updated = await db.posts.find_one({"id": post_id}, {"_id": 0})
    if updated:
        updated["created_at"] = serialize_datetime(updated.get("created_at"))
    return updated

@api_router.delete("/dashboard/posts/{post_id}")
async def delete_post(post_id: str, request: Request):
    user = await require_shop_owner(request)
    shop_id = await resolve_shop_id(request, user)
    result = await db.posts.delete_one({"id": post_id, "shop_id": shop_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Post not found")
    return {"message": "Post deleted"}

# ==================== DASHBOARD - PAGES ====================

@api_router.get("/dashboard/pages")
async def get_shop_pages(request: Request):
    user = await require_shop_owner(request)
    shop_id = await resolve_shop_id(request, user)
    pages = await db.pages.find({"shop_id": shop_id}, {"_id": 0}).sort("created_at", -1).to_list(50)
    for p in pages:
        p["created_at"] = serialize_datetime(p.get("created_at"))
        p["updated_at"] = serialize_datetime(p.get("updated_at"))
    return pages

@api_router.post("/dashboard/pages")
async def create_page(data: PageCreate, request: Request):
    user = await require_shop_owner(request)
    shop_id = await resolve_shop_id(request, user)
    shop = await db.shops.find_one({"_id": ObjectId(shop_id)}, {"max_pages": 1})
    max_pg = (shop or {}).get("max_pages", 20)
    count = await db.pages.count_documents({"shop_id": shop_id})
    if count >= max_pg:
        raise HTTPException(status_code=400, detail=f"Đã đạt giới hạn {max_pg} trang")
    page_id = f"page-{secrets.token_hex(6)}"
    slug = data.slug or generate_shop_slug(data.title)
    now = datetime.now(timezone.utc)
    doc = {
        "id": page_id, "shop_id": shop_id, "title": data.title, "slug": slug,
        "is_published": data.is_published, "sections": data.sections or [],
        "created_at": now, "updated_at": now
    }
    await db.pages.insert_one(doc)
    doc.pop("_id", None)
    doc["created_at"] = serialize_datetime(doc["created_at"])
    doc["updated_at"] = serialize_datetime(doc["updated_at"])
    return doc

@api_router.put("/dashboard/pages/{page_id}")
async def update_page(page_id: str, request: Request):
    user = await require_shop_owner(request)
    shop_id = await resolve_shop_id(request, user)
    body = await request.json()
    body.pop("id", None)
    body.pop("shop_id", None)
    body["updated_at"] = datetime.now(timezone.utc)
    result = await db.pages.update_one({"id": page_id, "shop_id": shop_id}, {"$set": body})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Page not found")
    updated = await db.pages.find_one({"id": page_id}, {"_id": 0})
    if updated:
        updated["created_at"] = serialize_datetime(updated.get("created_at"))
        updated["updated_at"] = serialize_datetime(updated.get("updated_at"))
    return updated

@api_router.delete("/dashboard/pages/{page_id}")
async def delete_page(page_id: str, request: Request):
    user = await require_shop_owner(request)
    shop_id = await resolve_shop_id(request, user)
    result = await db.pages.delete_one({"id": page_id, "shop_id": shop_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Page not found")
    return {"message": "Page deleted"}

# ==================== DASHBOARD - MENU ====================

@api_router.get("/dashboard/menu")
async def get_shop_menu(request: Request):
    user = await require_shop_owner(request)
    shop_id = await resolve_shop_id(request, user)
    shop = await db.shops.find_one({"_id": ObjectId(shop_id)}, {"menu_items": 1})
    return shop.get("menu_items", []) if shop else []

@api_router.put("/dashboard/menu")
async def update_shop_menu(data: MenuUpdate, request: Request):
    user = await require_shop_owner(request)
    shop_id = await resolve_shop_id(request, user)
    await db.shops.update_one({"_id": ObjectId(shop_id)}, {"$set": {"menu_items": data.items}})
    return {"message": "Menu updated"}

# ==================== DASHBOARD - MEGA MENU ====================

@api_router.get("/dashboard/mega-menu")
async def get_mega_menu(request: Request):
    user = await require_shop_owner(request)
    shop_id = await resolve_shop_id(request, user)
    shop = await db.shops.find_one({"_id": ObjectId(shop_id)}, {"mega_menu_categories": 1})
    saved = shop.get("mega_menu_categories", []) if shop else []
    # Get all parent categories for this shop
    parent_cats = await db.categories.find({"shop_id": shop_id, "parent_id": None}, {"_id": 0}).sort("position", 1).to_list(200)
    cat_map = {c["id"]: c for c in parent_cats}
    # Build enriched list from saved config
    result = []
    seen_ids = set()
    for item in saved:
        cat = cat_map.get(item.get("category_id"))
        if cat:
            result.append({
                "category_id": cat["id"], "name": cat["name"],
                "image_url": cat.get("image_url", ""),
                "enabled": item.get("enabled", True),
                "position": item.get("position", len(result)),
            })
            seen_ids.add(cat["id"])
    # Add any new categories not in saved config
    for cat in parent_cats:
        if cat["id"] not in seen_ids:
            result.append({
                "category_id": cat["id"], "name": cat["name"],
                "image_url": cat.get("image_url", ""),
                "enabled": True,
                "position": len(result),
            })
    return result

@api_router.put("/dashboard/mega-menu")
async def update_mega_menu(data: MegaMenuUpdate, request: Request):
    user = await require_shop_owner(request)
    shop_id = await resolve_shop_id(request, user)
    await db.shops.update_one({"_id": ObjectId(shop_id)}, {"$set": {"mega_menu_categories": data.items}})
    return {"message": "Mega menu updated"}

# ==================== DASHBOARD - VOUCHERS ====================

@api_router.get("/dashboard/vouchers")
async def get_vouchers(request: Request):
    user = await require_shop_owner(request)
    shop_id = await resolve_shop_id(request, user)
    vouchers = await db.vouchers.find({"shop_id": shop_id}, {"_id": 0}).sort("created_at", -1).to_list(200)
    for v in vouchers:
        v["created_at"] = serialize_datetime(v.get("created_at"))
        v["updated_at"] = serialize_datetime(v.get("updated_at"))
    return vouchers

@api_router.post("/dashboard/vouchers")
async def create_voucher(data: VoucherCreate, request: Request):
    user = await require_shop_owner(request)
    shop_id = await resolve_shop_id(request, user)
    # Check uniqueness of code within this shop
    existing = await db.vouchers.find_one({"shop_id": shop_id, "code": data.code.upper()})
    if existing:
        raise HTTPException(status_code=400, detail="Voucher code already exists")
    voucher_id = f"vchr-{uuid_lib.uuid4().hex[:12]}"
    doc = {
        "id": voucher_id, "shop_id": shop_id,
        "code": data.code.upper(),
        "discount_type": data.discount_type,
        "discount_value": data.discount_value,
        "min_order_amount": data.min_order_amount or 0,
        "max_uses": data.max_uses or 0,
        "used_count": 0,
        "applicable_products": data.applicable_products or [],
        "expiry_date": data.expiry_date,
        "is_active": data.is_active if data.is_active is not None else True,
        "created_at": datetime.now(timezone.utc),
        "updated_at": datetime.now(timezone.utc),
    }
    await db.vouchers.insert_one(doc)
    doc.pop("_id", None)
    doc["created_at"] = serialize_datetime(doc["created_at"])
    doc["updated_at"] = serialize_datetime(doc["updated_at"])
    return doc

@api_router.put("/dashboard/vouchers/{voucher_id}")
async def update_voucher(voucher_id: str, request: Request):
    user = await require_shop_owner(request)
    shop_id = await resolve_shop_id(request, user)
    body = await request.json()
    update_fields = {}
    for key in ["code", "discount_type", "discount_value", "min_order_amount", "max_uses", "applicable_products", "expiry_date", "is_active"]:
        if key in body:
            val = body[key]
            if key == "code" and val:
                val = val.upper()
                # Check uniqueness if code changed
                existing = await db.vouchers.find_one({"shop_id": shop_id, "code": val, "id": {"$ne": voucher_id}})
                if existing:
                    raise HTTPException(status_code=400, detail="Voucher code already exists")
            update_fields[key] = val
    if not update_fields:
        raise HTTPException(status_code=400, detail="No fields to update")
    update_fields["updated_at"] = datetime.now(timezone.utc)
    result = await db.vouchers.update_one({"id": voucher_id, "shop_id": shop_id}, {"$set": update_fields})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Voucher not found")
    return {"message": "Voucher updated"}

@api_router.delete("/dashboard/vouchers/{voucher_id}")
async def delete_voucher(voucher_id: str, request: Request):
    user = await require_shop_owner(request)
    shop_id = await resolve_shop_id(request, user)
    result = await db.vouchers.delete_one({"id": voucher_id, "shop_id": shop_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Voucher not found")
    return {"message": "Voucher deleted"}

@api_router.post("/shop/{slug}/voucher/validate")
async def validate_voucher(slug: str, request: Request):
    """Public endpoint to validate a voucher code"""
    shop = await db.shops.find_one({"slug": slug, "status": "active"})
    if not shop:
        raise HTTPException(status_code=404, detail="Shop not found")
    shop_id = str(shop["_id"])
    body = await request.json()
    code = body.get("code", "").upper()
    if not code:
        raise HTTPException(status_code=400, detail="Voucher code required")
    voucher = await db.vouchers.find_one({"shop_id": shop_id, "code": code, "is_active": True}, {"_id": 0})
    if not voucher:
        raise HTTPException(status_code=404, detail="Invalid voucher code")
    # Check expiry
    if voucher.get("expiry_date"):
        try:
            from dateutil.parser import parse as parse_date
            expiry = parse_date(str(voucher["expiry_date"]))
            if expiry.tzinfo is None:
                expiry = expiry.replace(tzinfo=timezone.utc)
            if expiry < datetime.now(timezone.utc):
                raise HTTPException(status_code=400, detail="Voucher has expired")
        except (ValueError, TypeError):
            pass
    # Check usage limit
    if voucher.get("max_uses", 0) > 0 and voucher.get("used_count", 0) >= voucher["max_uses"]:
        raise HTTPException(status_code=400, detail="Voucher usage limit reached")
    voucher["created_at"] = serialize_datetime(voucher.get("created_at"))
    voucher["updated_at"] = serialize_datetime(voucher.get("updated_at"))
    return voucher

# ==================== AGENT / DEALER SYSTEM ====================

@api_router.get("/dashboard/agents")
async def get_agents(request: Request):
    user = await require_shop_owner(request)
    shop_id = await resolve_shop_id(request, user)
    # Check if agents feature is enabled
    shop = await db.shops.find_one({"_id": ObjectId(shop_id)})
    if not shop or not shop.get("agents_enabled", False):
        raise HTTPException(status_code=403, detail="Agent feature not enabled for this shop")
    agents = await db.agents.find({"shop_id": shop_id}, {"_id": 0, "password_hash": 0}).sort("created_at", -1).to_list(200)
    for a in agents:
        a["created_at"] = serialize_datetime(a.get("created_at"))
    return agents

@api_router.post("/dashboard/agents")
async def create_agent(data: AgentCreate, request: Request):
    user = await require_shop_owner(request)
    shop_id = await resolve_shop_id(request, user)
    shop = await db.shops.find_one({"_id": ObjectId(shop_id)})
    if not shop or not shop.get("agents_enabled", False):
        raise HTTPException(status_code=403, detail="Agent feature not enabled for this shop")
    # Check limit
    count = await db.agents.count_documents({"shop_id": shop_id})
    if count >= 100:
        raise HTTPException(status_code=400, detail="Maximum 100 agents reached")
    # Check email uniqueness
    existing = await db.agents.find_one({"email": data.email.lower()})
    if existing:
        raise HTTPException(status_code=400, detail="Email already used by another agent")
    # Also check users table
    existing_user = await db.users.find_one({"email": data.email.lower()})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already used by a user account")
    if data.level not in [1, 2, 3]:
        raise HTTPException(status_code=400, detail="Level must be 1, 2, or 3")
    # Validate parent_agent_id if level > 1
    if data.level > 1 and data.parent_agent_id:
        parent = await db.agents.find_one({"id": data.parent_agent_id, "shop_id": shop_id})
        if not parent:
            raise HTTPException(status_code=400, detail="Parent agent not found")
        if parent.get("level", 1) >= data.level:
            raise HTTPException(status_code=400, detail="Parent agent must be a higher level (lower number)")
    agent_id = f"agt-{uuid_lib.uuid4().hex[:12]}"
    tracking_code = f"ref-{uuid_lib.uuid4().hex[:8]}"
    doc = {
        "id": agent_id, "shop_id": shop_id,
        "name": data.name, "email": data.email.lower(),
        "password_hash": hash_password(data.password),
        "phone": data.phone or "",
        "level": data.level,
        "parent_agent_id": data.parent_agent_id if data.level > 1 else None,
        "tracking_code": tracking_code,
        "is_active": True,
        "created_at": datetime.now(timezone.utc),
    }
    await db.agents.insert_one(doc)
    doc.pop("_id", None)
    doc.pop("password_hash", None)
    doc["created_at"] = serialize_datetime(doc["created_at"])
    return doc

@api_router.put("/dashboard/agents/{agent_id}")
async def update_agent(agent_id: str, request: Request):
    user = await require_shop_owner(request)
    shop_id = await resolve_shop_id(request, user)
    body = await request.json()
    update_fields = {}
    for key in ["name", "phone", "level", "parent_agent_id", "is_active"]:
        if key in body:
            update_fields[key] = body[key]
    if "password" in body and body["password"]:
        update_fields["password_hash"] = hash_password(body["password"])
    if not update_fields:
        raise HTTPException(status_code=400, detail="No fields to update")
    result = await db.agents.update_one({"id": agent_id, "shop_id": shop_id}, {"$set": update_fields})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Agent not found")
    return {"message": "Agent updated"}

@api_router.delete("/dashboard/agents/{agent_id}")
async def delete_agent(agent_id: str, request: Request):
    user = await require_shop_owner(request)
    shop_id = await resolve_shop_id(request, user)
    result = await db.agents.delete_one({"id": agent_id, "shop_id": shop_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Agent not found")
    return {"message": "Agent deleted"}

# Agent Dashboard - for agents to view their sales
@api_router.get("/agent/dashboard")
async def get_agent_dashboard(request: Request):
    """Agent's own dashboard showing their sales data"""
    token = request.cookies.get("access_token")
    if not token:
        auth_header = request.headers.get("Authorization", "")
        if auth_header.startswith("Bearer "):
            token = auth_header[7:]
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid token")
    agent_id = payload.get("sub")
    agent = await db.agents.find_one({"id": agent_id}, {"_id": 0, "password_hash": 0})
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    shop_id = agent["shop_id"]
    shop = await db.shops.find_one({"_id": ObjectId(shop_id)}, {"_id": 0, "name": 1, "slug": 1, "logo_url": 1, "theme_color": 1})
    # Get sales attributed to this agent
    sales = await db.agent_sales.find({"agent_id": agent_id}, {"_id": 0}).sort("created_at", -1).to_list(500)
    total_sales = sum(s.get("amount", 0) for s in sales)
    for s in sales:
        s["created_at"] = serialize_datetime(s.get("created_at"))
    # Get parent info if applicable
    parent_info = None
    if agent.get("parent_agent_id"):
        parent = await db.agents.find_one({"id": agent["parent_agent_id"]}, {"_id": 0, "password_hash": 0})
        if parent:
            parent_info = {"id": parent["id"], "name": parent["name"], "level": parent.get("level", 1)}
    agent["created_at"] = serialize_datetime(agent.get("created_at"))
    return {
        "agent": agent,
        "shop": shop,
        "sales": sales[:50],
        "total_sales": total_sales,
        "total_orders": len(sales),
        "parent_info": parent_info,
    }

# Shop owner view of all agent sales
@api_router.get("/dashboard/agent-sales")
async def get_agent_sales_overview(request: Request):
    user = await require_shop_owner(request)
    shop_id = await resolve_shop_id(request, user)
    agents = await db.agents.find({"shop_id": shop_id}, {"_id": 0, "password_hash": 0}).to_list(200)
    # Get all sales for this shop
    all_sales = await db.agent_sales.find({"shop_id": shop_id}, {"_id": 0}).to_list(5000)
    # Build sales by agent
    sales_by_agent = {}
    for s in all_sales:
        aid = s.get("agent_id", "owner")
        if aid not in sales_by_agent:
            sales_by_agent[aid] = {"total": 0, "count": 0}
        sales_by_agent[aid]["total"] += s.get("amount", 0)
        sales_by_agent[aid]["count"] += 1
    # Get owner's direct sales
    owner_sales = sales_by_agent.get("owner", {"total": 0, "count": 0})
    # Map agents to their sales
    agent_data = []
    for a in agents:
        a["created_at"] = serialize_datetime(a.get("created_at"))
        s = sales_by_agent.get(a["id"], {"total": 0, "count": 0})
        agent_data.append({**a, "total_sales": s["total"], "order_count": s["count"]})
    grand_total = sum(s.get("amount", 0) for s in all_sales)
    return {
        "agents": agent_data,
        "owner_sales": owner_sales,
        "grand_total": grand_total,
        "total_agents": len(agents),
    }

# Super Admin: Toggle agents feature for a shop
@api_router.put("/admin/shops/{shop_id}/agents-toggle")
async def toggle_agents_feature(shop_id: str, request: Request):
    user = await require_super_admin_only(request)
    body = await request.json()
    enabled = body.get("agents_enabled", False)
    await db.shops.update_one({"_id": ObjectId(shop_id)}, {"$set": {"agents_enabled": enabled}})
    return {"message": f"Agents feature {'enabled' if enabled else 'disabled'}"}

# Track sale via agent referral code
@api_router.get("/shop/{slug}/ref/{tracking_code}")
async def track_agent_referral(slug: str, tracking_code: str):
    """Returns shop info with agent tracking. Frontend will store the code in session."""
    shop = await db.shops.find_one({"slug": slug, "status": "active"})
    if not shop:
        raise HTTPException(status_code=404, detail="Shop not found")
    agent = await db.agents.find_one({"tracking_code": tracking_code, "shop_id": str(shop["_id"]), "is_active": True}, {"_id": 0, "password_hash": 0})
    if not agent:
        raise HTTPException(status_code=404, detail="Invalid referral code")
    return {"agent_id": agent["id"], "agent_name": agent["name"], "tracking_code": tracking_code}

# ==================== BUSINESS CARD ====================

@api_router.get("/dashboard/business-card")
async def get_business_card(request: Request):
    user = await require_shop_owner(request)
    shop_id = await resolve_shop_id(request, user)
    card = await db.business_cards.find_one({"owner_id": user["_id"], "owner_type": "shop_owner"}, {"_id": 0})
    if not card:
        # Return default from shop info
        shop = await db.shops.find_one({"_id": ObjectId(shop_id)})
        card = {
            "id": f"card-{uuid_lib.uuid4().hex[:12]}", "shop_id": shop_id,
            "owner_id": user["_id"], "owner_type": "shop_owner",
            "display_name": user.get("name", ""), "title": "",
            "phone": shop.get("contact_phone", ""), "email": shop.get("contact_email", ""),
            "address": shop.get("address", ""), "avatar_url": "", "logo_url": shop.get("logo_url", ""),
            "social_facebook": shop.get("social_facebook", ""), "social_instagram": shop.get("social_instagram", ""),
            "social_tiktok": "", "social_zalo": "", "website": "",
            "selected_products": [], "theme_color": shop.get("theme_color", "#0055FF"),
        }
    card.pop("created_at", None)
    card.pop("updated_at", None)
    return card

@api_router.put("/dashboard/business-card")
async def update_business_card(request: Request):
    user = await require_shop_owner(request)
    shop_id = await resolve_shop_id(request, user)
    body = await request.json()
    card = await db.business_cards.find_one({"owner_id": user["_id"], "owner_type": "shop_owner"})
    update_fields = {}
    for key in ["display_name", "title", "phone", "email", "address", "avatar_url", "logo_url", "social_facebook", "social_instagram", "social_tiktok", "social_zalo", "website", "selected_products", "theme_color"]:
        if key in body:
            update_fields[key] = body[key]
    if not card:
        card_id = f"card-{uuid_lib.uuid4().hex[:12]}"
        doc = {
            "id": card_id, "shop_id": shop_id, "owner_id": user["_id"], "owner_type": "shop_owner",
            **update_fields,
            "created_at": datetime.now(timezone.utc), "updated_at": datetime.now(timezone.utc),
        }
        await db.business_cards.insert_one(doc)
    else:
        update_fields["updated_at"] = datetime.now(timezone.utc)
        await db.business_cards.update_one({"owner_id": user["_id"], "owner_type": "shop_owner"}, {"$set": update_fields})
    return {"message": "Business card updated"}

# Agent business card
@api_router.get("/agent/business-card")
async def get_agent_business_card(request: Request):
    token = request.cookies.get("access_token")
    if not token:
        auth_header = request.headers.get("Authorization", "")
        if auth_header.startswith("Bearer "):
            token = auth_header[7:]
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
    agent_id = payload.get("sub")
    agent = await db.agents.find_one({"id": agent_id}, {"_id": 0, "password_hash": 0})
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    card = await db.business_cards.find_one({"owner_id": agent_id, "owner_type": "agent"}, {"_id": 0})
    if not card:
        shop = await db.shops.find_one({"_id": ObjectId(agent["shop_id"])})
        card = {
            "id": f"card-{uuid_lib.uuid4().hex[:12]}", "shop_id": agent["shop_id"],
            "owner_id": agent_id, "owner_type": "agent",
            "display_name": agent.get("name", ""), "title": "",
            "phone": agent.get("phone", ""), "email": agent.get("email", ""),
            "address": "", "avatar_url": "", "logo_url": shop.get("logo_url", "") if shop else "",
            "social_facebook": "", "social_instagram": "", "social_tiktok": "", "social_zalo": "", "website": "",
            "selected_products": [], "theme_color": shop.get("theme_color", "#0055FF") if shop else "#0055FF",
        }
    card.pop("created_at", None)
    card.pop("updated_at", None)
    return card

@api_router.put("/agent/business-card")
async def update_agent_business_card(request: Request):
    token = request.cookies.get("access_token")
    if not token:
        auth_header = request.headers.get("Authorization", "")
        if auth_header.startswith("Bearer "):
            token = auth_header[7:]
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
    agent_id = payload.get("sub")
    agent = await db.agents.find_one({"id": agent_id})
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    body = await request.json()
    card = await db.business_cards.find_one({"owner_id": agent_id, "owner_type": "agent"})
    update_fields = {}
    for key in ["display_name", "title", "phone", "email", "address", "avatar_url", "logo_url", "social_facebook", "social_instagram", "social_tiktok", "social_zalo", "website", "selected_products", "theme_color"]:
        if key in body:
            update_fields[key] = body[key]
    if not card:
        doc = {
            "id": f"card-{uuid_lib.uuid4().hex[:12]}", "shop_id": agent["shop_id"],
            "owner_id": agent_id, "owner_type": "agent",
            **update_fields,
            "created_at": datetime.now(timezone.utc), "updated_at": datetime.now(timezone.utc),
        }
        await db.business_cards.insert_one(doc)
    else:
        update_fields["updated_at"] = datetime.now(timezone.utc)
        await db.business_cards.update_one({"owner_id": agent_id, "owner_type": "agent"}, {"$set": update_fields})
    return {"message": "Business card updated"}

# Public business card page
@api_router.get("/card/{card_slug}")
async def get_public_business_card(card_slug: str):
    """Get public business card. card_slug can be shop slug or agent tracking code."""
    # Try shop owner first (by shop slug)
    shop = await db.shops.find_one({"slug": card_slug, "status": "active"})
    if shop:
        shop_id = str(shop["_id"])
        owner = await db.users.find_one({"shop_id": shop_id})
        card = await db.business_cards.find_one({"owner_id": str(owner["_id"]) if owner else "", "owner_type": "shop_owner"}, {"_id": 0})
        if not card:
            card = {
                "display_name": owner.get("name", shop["name"]) if owner else shop["name"],
                "title": "", "phone": shop.get("contact_phone", ""),
                "email": shop.get("contact_email", ""), "address": shop.get("address", ""),
                "avatar_url": "", "logo_url": shop.get("logo_url", ""),
                "social_facebook": shop.get("social_facebook", ""), "social_instagram": shop.get("social_instagram", ""),
                "social_tiktok": "", "social_zalo": "", "website": "",
                "selected_products": [], "theme_color": shop.get("theme_color", "#0055FF"),
            }
        # Fetch selected products
        products = []
        if card.get("selected_products"):
            for pid in card["selected_products"]:
                p = await db.products.find_one({"id": pid, "shop_id": shop_id, "is_active": True, "is_hidden": {"$ne": True}}, {"_id": 0})
                if p:
                    products.append({"id": p["id"], "name": p["name"], "price": p["price"], "image_url": p.get("image_url", "")})
        card.pop("created_at", None)
        card.pop("updated_at", None)
        return {**card, "products": products, "shop_name": shop["name"], "shop_slug": shop["slug"], "card_type": "shop_owner"}
    # Try agent (by tracking code)
    agent = await db.agents.find_one({"tracking_code": card_slug, "is_active": True}, {"_id": 0, "password_hash": 0})
    if agent:
        shop = await db.shops.find_one({"_id": ObjectId(agent["shop_id"]), "status": "active"})
        card = await db.business_cards.find_one({"owner_id": agent["id"], "owner_type": "agent"}, {"_id": 0})
        if not card:
            card = {
                "display_name": agent.get("name", ""), "title": "",
                "phone": agent.get("phone", ""), "email": agent.get("email", ""),
                "address": "", "avatar_url": "", "logo_url": shop.get("logo_url", "") if shop else "",
                "social_facebook": "", "social_instagram": "", "social_tiktok": "", "social_zalo": "", "website": "",
                "selected_products": [], "theme_color": shop.get("theme_color", "#0055FF") if shop else "#0055FF",
            }
        products = []
        if card.get("selected_products") and shop:
            for pid in card["selected_products"]:
                p = await db.products.find_one({"id": pid, "shop_id": str(shop["_id"]), "is_active": True, "is_hidden": {"$ne": True}}, {"_id": 0})
                if p:
                    products.append({"id": p["id"], "name": p["name"], "price": p["price"], "image_url": p.get("image_url", "")})
        card.pop("created_at", None)
        card.pop("updated_at", None)
        return {**card, "products": products, "shop_name": shop["name"] if shop else "", "shop_slug": shop["slug"] if shop else "", "card_type": "agent", "agent_name": agent["name"]}
    raise HTTPException(status_code=404, detail="Business card not found")

# OG tags for business card
@api_router.get("/og/card/{card_slug}", response_class=HTMLResponse)
async def og_card_page(card_slug: str):
    try:
        card_data = await get_public_business_card(card_slug)
    except HTTPException:
        raise HTTPException(status_code=404, detail="Card not found")
    name = card_data.get("display_name", "")
    title = card_data.get("title", "")
    phone = card_data.get("phone", "")
    logo = card_data.get("logo_url", "") or card_data.get("avatar_url", "")
    shop_name = card_data.get("shop_name", "")
    desc = f"{title} - {shop_name}" if title else shop_name
    frontend_url = os.environ.get("FRONTEND_URL", "")
    canonical = f"{frontend_url}/card/{card_slug}"
    html = f"""<!DOCTYPE html>
<html lang="vi"><head>
<meta charset="utf-8"/><meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>{name} - {shop_name}</title>
<meta property="og:title" content="{name}"/>
<meta property="og:description" content="{desc}"/>
<meta property="og:type" content="profile"/>
<meta property="og:url" content="{canonical}"/>
{f'<meta property="og:image" content="{logo}"/>' if logo else ''}
<meta http-equiv="refresh" content="0;url={canonical}"/>
</head><body><p>Redirecting...</p><script>window.location.replace("{canonical}");</script></body></html>"""
    return HTMLResponse(content=html)

# ==================== PUSH NOTIFICATIONS ====================

async def send_push_to_shop(shop_id: str, title: str, body: str, url: str = "/dashboard", order_id: str = ""):
    """Send push notification to all subscribed devices of a shop owner."""
    if not VAPID_PRIVATE_KEY or not VAPID_PUBLIC_KEY:
        logger.warning("VAPID keys not configured, skipping push")
        return 0

    subscriptions = await db.push_subscriptions.find({"shop_id": shop_id}).to_list(50)
    sent = 0
    for sub in subscriptions:
        try:
            webpush(
                subscription_info=sub["subscription"],
                data=json.dumps({
                    "title": title,
                    "body": body,
                    "icon": "/icon-192.png",
                    "url": url,
                    "order_id": order_id,
                    "tag": f"order-{order_id}" if order_id else "notification",
                }),
                vapid_private_key=VAPID_PRIVATE_KEY,
                vapid_claims={"sub": VAPID_CLAIMS_EMAIL},
            )
            sent += 1
        except WebPushException as e:
            if e.response and e.response.status_code in [404, 410]:
                # Subscription expired/invalid, remove it
                await db.push_subscriptions.delete_one({"_id": sub["_id"]})
                logger.info(f"Removed expired push subscription for shop {shop_id}")
            else:
                logger.error(f"Push failed for shop {shop_id}: {e}")
        except Exception as e:
            logger.error(f"Push error: {e}")
    return sent

# ==================== EMAIL NOTIFICATIONS ====================

def format_vnd_email(amount):
    return f"{amount:,.0f}d".replace(",", ".")

async def send_order_email(shop_name: str, to_email: str, order_id: str, customer_name: str, customer_phone: str, customer_address: str, items: list, total: int, note: str = ""):
    """Send order notification email to shop owner via Resend."""
    if not RESEND_API_KEY:
        logger.warning("RESEND_API_KEY not set, skipping email")
        return

    items_html = ""
    for item in items:
        items_html += f"""
        <tr>
          <td style="padding:8px 12px;border-bottom:1px solid #E2E8F0;font-size:14px;color:#334155;">{item.get('name','')}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #E2E8F0;font-size:14px;color:#334155;text-align:center;">{item.get('quantity',1)}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #E2E8F0;font-size:14px;color:#334155;text-align:right;">{format_vnd_email(item.get('price',0))}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #E2E8F0;font-size:14px;color:#0F172A;text-align:right;font-weight:600;">{format_vnd_email(item.get('subtotal', item.get('price',0) * item.get('quantity',1)))}</td>
        </tr>"""

    note_html = f'<p style="margin:0 0 16px;color:#64748B;font-size:14px;"><strong>Ghi chu:</strong> {note}</p>' if note else ""

    html = f"""
    <div style="font-family:Arial,Helvetica,sans-serif;max-width:600px;margin:0 auto;background:#FFFFFF;">
      <div style="background:linear-gradient(135deg,#0055FF,#00C2FF);padding:24px 32px;border-radius:8px 8px 0 0;">
        <h1 style="margin:0;color:#FFFFFF;font-size:20px;">Don hang moi #{order_id}</h1>
        <p style="margin:4px 0 0;color:rgba(255,255,255,0.85);font-size:14px;">{shop_name}</p>
      </div>
      <div style="padding:24px 32px;border:1px solid #E2E8F0;border-top:none;border-radius:0 0 8px 8px;">
        <div style="background:#F8FAFC;border-radius:8px;padding:16px;margin-bottom:20px;">
          <h3 style="margin:0 0 12px;color:#0F172A;font-size:15px;">Thong tin khach hang</h3>
          <p style="margin:0 0 4px;color:#334155;font-size:14px;"><strong>Ho ten:</strong> {customer_name}</p>
          <p style="margin:0 0 4px;color:#334155;font-size:14px;"><strong>SDT:</strong> {customer_phone}</p>
          <p style="margin:0;color:#334155;font-size:14px;"><strong>Dia chi:</strong> {customer_address}</p>
        </div>
        {note_html}
        <table style="width:100%;border-collapse:collapse;margin-bottom:16px;">
          <thead>
            <tr style="background:#F1F5F9;">
              <th style="padding:10px 12px;text-align:left;font-size:13px;color:#64748B;font-weight:600;">San pham</th>
              <th style="padding:10px 12px;text-align:center;font-size:13px;color:#64748B;font-weight:600;">SL</th>
              <th style="padding:10px 12px;text-align:right;font-size:13px;color:#64748B;font-weight:600;">Don gia</th>
              <th style="padding:10px 12px;text-align:right;font-size:13px;color:#64748B;font-weight:600;">Thanh tien</th>
            </tr>
          </thead>
          <tbody>{items_html}</tbody>
        </table>
        <div style="text-align:right;padding:12px;background:#F0F9FF;border-radius:8px;margin-bottom:20px;">
          <span style="font-size:14px;color:#64748B;">Tong cong: </span>
          <span style="font-size:20px;font-weight:700;color:#0055FF;">{format_vnd_email(total)}</span>
        </div>
        <p style="margin:0;color:#94A3B8;font-size:12px;text-align:center;">Email nay duoc gui tu dong boi Ocean Pro Web</p>
      </div>
    </div>"""

    try:
        params = {
            "from": SENDER_EMAIL,
            "to": [to_email],
            "subject": f"[{shop_name}] Don hang moi #{order_id} - {format_vnd_email(total)}",
            "html": html,
        }
        result = await asyncio.to_thread(resend.Emails.send, params)
        logger.info(f"Order email sent to {to_email} for order {order_id}, id={result.get('id') if isinstance(result, dict) else result}")
    except Exception as e:
        logger.error(f"Failed to send order email to {to_email}: {e}")

@api_router.get("/dashboard/notifications/status")
async def get_notification_status(request: Request):
    user = await require_shop_owner(request)
    shop_id = await resolve_shop_id(request, user)
    count = await db.push_subscriptions.count_documents({"shop_id": shop_id})
    shop = await db.shops.find_one({"_id": ObjectId(shop_id)}, {"notifications_enabled": 1, "email_notifications": 1})
    enabled = shop.get("notifications_enabled", False) if shop else False
    email_enabled = shop.get("email_notifications", False) if shop else False
    return {"enabled": enabled, "subscribed_devices": count, "email_enabled": email_enabled}

@api_router.post("/dashboard/notifications/subscribe")
async def subscribe_notifications(request: Request):
    user = await require_shop_owner(request)
    shop_id = await resolve_shop_id(request, user)
    body = await request.json()
    subscription = body.get("subscription")
    if not subscription or "endpoint" not in subscription:
        raise HTTPException(status_code=400, detail="Invalid subscription object")

    # Upsert subscription by endpoint
    await db.push_subscriptions.update_one(
        {"shop_id": shop_id, "subscription.endpoint": subscription["endpoint"]},
        {"$set": {
            "shop_id": shop_id,
            "user_id": user["_id"],
            "subscription": subscription,
            "updated_at": datetime.now(timezone.utc),
        }},
        upsert=True,
    )
    # Enable notifications for this shop
    await db.shops.update_one({"_id": ObjectId(shop_id)}, {"$set": {"notifications_enabled": True}})
    return {"message": "Subscribed to notifications"}

@api_router.post("/dashboard/notifications/unsubscribe")
async def unsubscribe_notifications(request: Request):
    user = await require_shop_owner(request)
    shop_id = await resolve_shop_id(request, user)
    body = await request.json()
    endpoint = body.get("endpoint", "")
    if endpoint:
        await db.push_subscriptions.delete_one({"shop_id": shop_id, "subscription.endpoint": endpoint})
    remaining = await db.push_subscriptions.count_documents({"shop_id": shop_id})
    if remaining == 0:
        await db.shops.update_one({"_id": ObjectId(shop_id)}, {"$set": {"notifications_enabled": False}})
    return {"message": "Unsubscribed from notifications"}

@api_router.post("/dashboard/notifications/email-toggle")
async def toggle_email_notifications(request: Request):
    user = await require_shop_owner(request)
    shop_id = await resolve_shop_id(request, user)
    shop = await db.shops.find_one({"_id": ObjectId(shop_id)}, {"email_notifications": 1})
    current = shop.get("email_notifications", False) if shop else False
    await db.shops.update_one({"_id": ObjectId(shop_id)}, {"$set": {"email_notifications": not current}})
    return {"email_enabled": not current, "message": f"Email notifications {'enabled' if not current else 'disabled'}"}

@api_router.get("/push/vapid-key")
async def get_vapid_key():
    """Public endpoint to get the VAPID public key for push subscription."""
    return {"public_key": VAPID_PUBLIC_KEY}

# ==================== PUBLIC STOREFRONT ====================

@api_router.get("/shop/{slug}")
async def get_shop_by_slug(slug: str):
    shop = await db.shops.find_one({"slug": slug, "status": "active"})
    if not shop:
        raise HTTPException(status_code=404, detail="Shop not found")
    return {
        "id": str(shop["_id"]), "name": shop["name"], "slug": shop["slug"],
        "description": shop.get("description", ""), "logo_url": shop.get("logo_url", ""),
        "contact_phone": shop.get("contact_phone", ""), "contact_email": shop.get("contact_email", ""),
        "address": shop.get("address", ""), "google_map_url": shop.get("google_map_url", ""),
        "social_facebook": shop.get("social_facebook", ""),
        "social_instagram": shop.get("social_instagram", ""), "theme_color": shop.get("theme_color", "#0055FF"),
        "custom_domain": shop.get("custom_domain", ""),
        "banners": shop.get("banners", []), "banner_enabled": shop.get("banner_enabled", True),
        "blog_enabled": shop.get("blog_enabled", True),
        "layout_sections": shop.get("layout_sections", []),
        "footer_columns": shop.get("footer_columns", []),
        "menu_items": shop.get("menu_items", []),
        "mega_menu_categories": shop.get("mega_menu_categories", []),
        "custom_pages": shop.get("custom_pages", []),
        "post_carousel_position": shop.get("post_carousel_position", "top"),
        "max_products": shop.get("max_products", 100), "max_posts": shop.get("max_posts", 50),
        "expiry_date": shop.get("expiry_date", ""),
    }

@api_router.get("/shop/{slug}/products")
async def get_shop_products_public(slug: str, category: Optional[str] = None, search: Optional[str] = None, type: Optional[str] = None):
    shop = await db.shops.find_one({"slug": slug, "status": "active"}, {"_id": 1})
    if not shop:
        raise HTTPException(status_code=404, detail="Shop not found")
    shop_id = str(shop["_id"])
    query = {"shop_id": shop_id, "is_active": True, "is_hidden": {"$ne": True}}
    if category and category != "all":
        query["category_id"] = category
    if search:
        query["name"] = {"$regex": search, "$options": "i"}
    if type in ("product", "service"):
        if type == "service":
            query["type"] = "service"
        else:
            # product: include legacy docs without a type field
            query["$or"] = [{"type": "product"}, {"type": {"$exists": False}}, {"type": None}, {"type": ""}]
    products = await db.products.find(query, {"_id": 0}).sort("position", 1).to_list(500)
    return products

@api_router.get("/shop/{slug}/categories")
async def get_shop_categories_public(slug: str):
    shop = await db.shops.find_one({"slug": slug, "status": "active"})
    if not shop:
        raise HTTPException(status_code=404, detail="Shop not found")
    cats = await db.categories.find({"shop_id": str(shop["_id"])}, {"_id": 0}).sort("position", 1).to_list(200)
    return cats

@api_router.get("/shop/{slug}/posts")
async def get_shop_posts_public(slug: str):
    shop = await db.shops.find_one({"slug": slug, "status": "active"})
    if not shop:
        raise HTTPException(status_code=404, detail="Shop not found")
    posts = await db.posts.find({"shop_id": str(shop["_id"])}, {"_id": 0}).sort("created_at", -1).to_list(100)
    for p in posts:
        p["created_at"] = serialize_datetime(p.get("created_at"))
    return posts

@api_router.get("/shop/{slug}/page/{page_slug}")
async def get_shop_page_public(slug: str, page_slug: str):
    shop = await db.shops.find_one({"slug": slug, "status": "active"})
    if not shop:
        raise HTTPException(status_code=404, detail="Shop not found")
    shop_id = str(shop["_id"])
    page = await db.pages.find_one({"shop_id": shop_id, "slug": page_slug, "is_published": True}, {"_id": 0})
    if not page:
        # Also check custom_pages embedded in shop document
        for cp in shop.get("custom_pages", []):
            if cp.get("slug") == page_slug and cp.get("is_published", True):
                return cp
        raise HTTPException(status_code=404, detail="Page not found")
    page["created_at"] = serialize_datetime(page.get("created_at"))
    page["updated_at"] = serialize_datetime(page.get("updated_at"))
    return page

@api_router.post("/shop/{slug}/orders")
async def create_order(slug: str, data: OrderCreate, request: Request):
    # Security: Sanitize customer inputs
    data.customer_name = bleach.clean(data.customer_name, tags=[], strip=True)
    data.customer_address = bleach.clean(data.customer_address, tags=[], strip=True)
    data.note = bleach.clean(data.note or "", tags=[], strip=True)
    shop = await db.shops.find_one({"slug": slug, "status": "active"})
    if not shop:
        raise HTTPException(status_code=404, detail="Shop not found")
    shop_id = str(shop["_id"])
    total = 0
    items = []
    for item in data.items:
        product = await db.products.find_one({"id": item["product_id"], "shop_id": shop_id})
        if product:
            sub = product["price"] * item["quantity"]
            total += sub
            items.append({"product_id": item["product_id"], "name": product["name"], "price": product["price"], "quantity": item["quantity"], "subtotal": sub, "image_url": product.get("image_url", "")})
    order_id = f"ORD-{secrets.token_hex(6).upper()}"
    # Apply voucher discount
    discount_amount = 0
    voucher_info = None
    if data.voucher_code:
        voucher = await db.vouchers.find_one({"shop_id": shop_id, "code": data.voucher_code.upper(), "is_active": True})
        if voucher:
            # Validate expiry
            valid = True
            if voucher.get("expiry_date"):
                from dateutil.parser import parse as parse_date
                expiry = parse_date(str(voucher["expiry_date"]))
                if expiry.tzinfo is None:
                    expiry = expiry.replace(tzinfo=timezone.utc)
                if expiry < datetime.now(timezone.utc):
                    valid = False
            # Validate usage limit
            if voucher.get("max_uses", 0) > 0 and voucher.get("used_count", 0) >= voucher["max_uses"]:
                valid = False
            # Validate min order amount
            if voucher.get("min_order_amount", 0) > 0 and total < voucher["min_order_amount"]:
                valid = False
            if valid:
                applicable_products = voucher.get("applicable_products", [])
                if applicable_products:
                    applicable_total = sum(i["subtotal"] for i in items if i["product_id"] in applicable_products)
                else:
                    applicable_total = total
                if voucher["discount_type"] == "percentage":
                    discount_amount = round(applicable_total * voucher["discount_value"] / 100)
                else:
                    discount_amount = min(voucher["discount_value"], applicable_total)
                voucher_info = {"code": voucher["code"], "discount_type": voucher["discount_type"], "discount_value": voucher["discount_value"], "discount_amount": discount_amount}
                # Increment used_count
                await db.vouchers.update_one({"id": voucher["id"]}, {"$inc": {"used_count": 1}})
    
    final_total = max(0, total - discount_amount)
    doc = {"id": order_id, "shop_id": shop_id, "customer_name": data.customer_name, "customer_phone": data.customer_phone, "customer_email": data.customer_email, "customer_address": data.customer_address, "items": items, "subtotal": total, "discount_amount": discount_amount, "total_amount": final_total, "note": data.note, "status": "pending", "created_at": datetime.now(timezone.utc)}
    if voucher_info:
        doc["voucher"] = voucher_info
    # Track agent referral if provided
    agent_id_for_order = None
    if data.agent_tracking_code:
        agent = await db.agents.find_one({"tracking_code": data.agent_tracking_code, "shop_id": shop_id, "is_active": True})
        if agent:
            agent_id_for_order = agent["id"]
            doc["agent_id"] = agent_id_for_order
            doc["agent_tracking_code"] = data.agent_tracking_code
    await db.orders.insert_one(doc)
    # Agent sales will be recorded when shop owner approves the order (not immediately)

    # Send push notification to shop owner if enabled
    if shop.get("notifications_enabled"):
        from utils.format_vnd import format_vnd
        try:
            item_count = sum(i["quantity"] for i in items)
            await send_push_to_shop(
                shop_id=shop_id,
                title=f"Đơn hàng mới #{order_id}",
                body=f"{data.customer_name} - {item_count} sản phẩm - {format_vnd(total)}",
                url="/dashboard",
                order_id=order_id,
            )
        except Exception as e:
            logger.error(f"Push notification failed: {e}")

    # Send email notification to shop owner if enabled
    if shop.get("email_notifications"):
        owner = await db.users.find_one({"shop_id": shop_id}, {"email": 1})
        notify_email = shop.get("contact_email") or (owner["email"] if owner else "")
        if notify_email:
            try:
                await send_order_email(
                    shop_name=shop["name"],
                    to_email=notify_email,
                    order_id=order_id,
                    customer_name=data.customer_name,
                    customer_phone=data.customer_phone,
                    customer_address=data.customer_address,
                    items=items,
                    total=total,
                    note=data.note,
                )
            except Exception as e:
                logger.error(f"Email notification failed: {e}")

    return {"id": order_id, "order_id": order_id, "subtotal": total, "discount_amount": discount_amount, "total_amount": final_total, "voucher": voucher_info, "items": items, "message": "Order placed successfully"}

@api_router.post("/shop/{slug}/bookings")
async def create_booking(slug: str, data: BookingCreate, request: Request):
    # Security: Rate limit booking creation
    ip = get_client_ip(request)
    if not rate_limiter.is_allowed(f"booking:{ip}", max_requests=security_config.get("rate_contact", 10), window_seconds=300):
        raise HTTPException(status_code=429, detail="Quá nhiều yêu cầu đặt lịch. Vui lòng thử lại sau.")
    # Sanitize inputs
    data.customer_name = bleach.clean(data.customer_name, tags=[], strip=True)
    data.customer_phone = bleach.clean(data.customer_phone, tags=[], strip=True)
    data.note = bleach.clean(data.note or "", tags=[], strip=True)
    shop = await db.shops.find_one({"slug": slug, "status": "active"})
    if not shop:
        raise HTTPException(status_code=404, detail="Shop not found")
    shop_id = str(shop["_id"])
    service = await db.products.find_one({"id": data.service_id, "shop_id": shop_id, "is_active": True, "is_hidden": {"$ne": True}})
    if not service or service.get("type") != "service":
        raise HTTPException(status_code=404, detail="Service not found")
    booking_id = f"BK-{secrets.token_hex(6).upper()}"
    agent_id_for_booking = None
    agent_tracking = None
    if data.agent_tracking_code:
        agent = await db.agents.find_one({"tracking_code": data.agent_tracking_code, "shop_id": shop_id, "is_active": True})
        if agent:
            agent_id_for_booking = agent["id"]
            agent_tracking = data.agent_tracking_code
    doc = {
        "id": booking_id,
        "shop_id": shop_id,
        "service_id": service["id"],
        "service_name": service["name"],
        "service_price": service.get("price", 0),
        "service_image": service.get("image_url", ""),
        "customer_name": data.customer_name,
        "customer_phone": data.customer_phone,
        "customer_email": data.customer_email or "",
        "preferred_datetime": data.preferred_datetime,
        "note": data.note,
        "status": "pending",
        "created_at": datetime.now(timezone.utc),
    }
    if agent_id_for_booking:
        doc["agent_id"] = agent_id_for_booking
        doc["agent_tracking_code"] = agent_tracking
    await db.bookings.insert_one(doc)

    # Push notification
    if shop.get("notifications_enabled"):
        try:
            await send_push_to_shop(
                shop_id=shop_id,
                title=f"Đặt lịch mới #{booking_id}",
                body=f"{data.customer_name} - {service['name']} - {data.preferred_datetime}",
                url="/dashboard",
                order_id=booking_id,
            )
        except Exception as e:
            logger.error(f"Push notification failed: {e}")

    # Email notification
    if shop.get("email_notifications"):
        owner = await db.users.find_one({"shop_id": shop_id}, {"email": 1})
        notify_email = shop.get("contact_email") or (owner["email"] if owner else "")
        if notify_email:
            try:
                await send_order_email(
                    shop_name=shop["name"],
                    to_email=notify_email,
                    order_id=booking_id,
                    customer_name=data.customer_name,
                    customer_phone=data.customer_phone,
                    customer_address=f"Dịch vụ: {service['name']} - Thời gian: {data.preferred_datetime}",
                    items=[{"name": service["name"], "quantity": 1, "price": service.get("price", 0), "subtotal": service.get("price", 0)}],
                    total=service.get("price", 0),
                    note=data.note,
                )
            except Exception as e:
                logger.error(f"Email notification failed: {e}")

    doc.pop("_id", None)
    doc["created_at"] = serialize_datetime(doc["created_at"])
    return {"id": booking_id, "booking_id": booking_id, "message": "Booking placed successfully"}

@api_router.get("/dashboard/bookings")
async def get_shop_bookings(request: Request):
    user = await require_shop_owner(request)
    shop_id = await resolve_shop_id(request, user)
    bookings = await db.bookings.find({"shop_id": shop_id}, {"_id": 0}).sort("created_at", -1).to_list(500)
    agent_ids = set(b.get("agent_id") for b in bookings if b.get("agent_id"))
    agent_map = {}
    if agent_ids:
        agents = await db.agents.find({"id": {"$in": list(agent_ids)}}, {"_id": 0, "id": 1, "name": 1, "tracking_code": 1}).to_list(200)
        agent_map = {a["id"]: a for a in agents}
    for b in bookings:
        b["created_at"] = serialize_datetime(b.get("created_at"))
        if b.get("agent_id") and b["agent_id"] in agent_map:
            b["agent_name"] = agent_map[b["agent_id"]]["name"]
    return bookings

@api_router.put("/dashboard/bookings/{booking_id}/status")
async def update_booking_status(booking_id: str, data: BookingStatusUpdate, request: Request):
    user = await require_shop_owner(request)
    shop_id = await resolve_shop_id(request, user)
    valid = ["pending", "confirmed", "completed", "cancelled"]
    if data.status not in valid:
        raise HTTPException(status_code=400, detail="Invalid status")
    result = await db.bookings.update_one(
        {"id": booking_id, "shop_id": shop_id},
        {"$set": {"status": data.status, "updated_at": datetime.now(timezone.utc)}},
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Booking not found")
    return {"message": f"Booking status updated to {data.status}"}

@api_router.delete("/dashboard/bookings/{booking_id}")
async def delete_booking(booking_id: str, request: Request):
    user = await require_shop_owner(request)
    shop_id = await resolve_shop_id(request, user)
    result = await db.bookings.delete_one({"id": booking_id, "shop_id": shop_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Booking not found")
    return {"message": "Booking deleted"}

@api_router.post("/shop/{slug}/contact")
async def submit_contact(slug: str, data: ContactForm, request: Request):
    # Security: Rate limit contact form
    ip = get_client_ip(request)
    if not rate_limiter.is_allowed(f"contact:{ip}", max_requests=security_config["rate_contact"], window_seconds=300):
        raise HTTPException(status_code=429, detail="Quá nhiều tin nhắn. Vui lòng thử lại sau.")
    # Security: Sanitize inputs
    data.name = bleach.clean(data.name, tags=[], strip=True)
    data.message = bleach.clean(data.message, tags=[], strip=True)
    shop = await db.shops.find_one({"slug": slug, "status": "active"})
    if not shop:
        raise HTTPException(status_code=404, detail="Shop not found")
    await db.contacts.insert_one({
        "shop_id": str(shop["_id"]), "name": data.name, "email": data.email,
        "phone": data.phone, "message": data.message, "created_at": datetime.now(timezone.utc)
    })
    return {"message": "Contact form submitted successfully"}

# ==================== HOMEPAGE PUBLIC ENDPOINTS ====================

@api_router.get("/products")
async def get_products(category: Optional[str] = None, search: Optional[str] = None):
    query = {"is_active": {"$ne": False}, "is_hidden": {"$ne": True}}
    if category and category != "All Categories":
        query["category"] = category
    if search:
        query["name"] = {"$regex": search, "$options": "i"}
    products = await db.products.find(query, {"_id": 0}).sort("position", 1).to_list(200)
    return products

@api_router.get("/categories")
async def get_categories():
    cats = await db.categories.find({}, {"_id": 0}).sort("position", 1).to_list(200)
    seen = set()
    unique = []
    for c in cats:
        if c["name"] not in seen:
            seen.add(c["name"])
            unique.append({"id": c["id"], "name": c["name"], "position": c.get("position", 0)})
    return unique

@api_router.get("/")
async def root():
    return {"message": "The Wi Shop API"}

@api_router.get("/security/status")
async def security_status(request: Request):
    """Public endpoint to show security features enabled."""
    return {
        "security_features": {
            "rate_limiting": True,
            "brute_force_protection": True,
            "content_word_limit": MAX_CONTENT_WORDS,
            "xss_sanitization": True,
            "security_headers": True,
            "request_size_limit": "10MB",
            "cors_configured": True,
            "jwt_auth": True,
            "password_hashing": "bcrypt",
        }
    }

@api_router.get("/admin/backups")
async def list_db_backups(request: Request):
    """List DB backups stored in Cloudflare R2."""
    await require_super_admin(request)
    try:
        s3 = boto3.client(
            "s3",
            endpoint_url=os.environ.get("R2_ENDPOINT"),
            aws_access_key_id=os.environ.get("R2_ACCESS_KEY"),
            aws_secret_access_key=os.environ.get("R2_SECRET_KEY"),
            config=BotoConfig(signature_version="s3v4"),
            region_name="auto",
        )
        prefix = os.environ.get("BACKUP_R2_PREFIX", "backups/db/")
        resp = s3.list_objects_v2(Bucket=os.environ.get("R2_BUCKET"), Prefix=prefix)
        objs = resp.get("Contents", []) or []
        objs.sort(key=lambda o: o["LastModified"], reverse=True)
        return [{
            "key": o["Key"],
            "name": o["Key"].split("/")[-1],
            "size_mb": round(o["Size"] / 1024 / 1024, 2),
            "created_at": o["LastModified"].isoformat(),
        } for o in objs]
    except Exception as e:
        logger.error(f"list_db_backups failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/admin/backups/run")
async def run_db_backup_now(request: Request):
    """Trigger a full DB backup now. Super Admin only."""
    await require_super_admin(request)
    try:
        import sys as _sys
        _sp = str(Path(__file__).parent / "scripts")
        if _sp not in _sys.path:
            _sys.path.append(_sp)
        import backup_db as _bdb
        import asyncio as _asyncio
        result = await _asyncio.to_thread(_bdb.run_backup)
        return {"success": True, **result}
    except Exception as e:
        logger.error(f"manual backup failed: {e}")
        raise HTTPException(status_code=500, detail=f"Backup failed: {e}")

@api_router.get("/admin/backups/download")
async def get_db_backup_download_url(request: Request, key: str):
    """Generate a presigned URL (valid 1 hour) to download a specific backup."""
    await require_super_admin(request)
    try:
        s3 = boto3.client(
            "s3",
            endpoint_url=os.environ.get("R2_ENDPOINT"),
            aws_access_key_id=os.environ.get("R2_ACCESS_KEY"),
            aws_secret_access_key=os.environ.get("R2_SECRET_KEY"),
            config=BotoConfig(signature_version="s3v4"),
            region_name="auto",
        )
        url = s3.generate_presigned_url(
            "get_object",
            Params={"Bucket": os.environ.get("R2_BUCKET"), "Key": key},
            ExpiresIn=3600,
        )
        return {"url": url, "expires_in": 3600}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/admin/restore/db")
async def restore_db_from_backup(request: Request):
    """Restore DB from a backup archive stored in R2. DESTRUCTIVE — drops existing collections.
    Body: { "key": "backups/db/proidshopvn-YYYYMMDD-HHMMSS.tar.gz", "confirm": "RESTORE" }
    """
    await require_super_admin(request)
    body = await request.json()
    key = body.get("key")
    confirm = body.get("confirm")
    if confirm != "RESTORE":
        raise HTTPException(status_code=400, detail="Bạn phải nhập RESTORE để xác nhận")
    if not key or not key.startswith("backups/db/"):
        raise HTTPException(status_code=400, detail="Invalid backup key")
    try:
        import sys as _sys
        _sp = str(Path(__file__).parent / "scripts")
        if _sp not in _sys.path:
            _sys.path.append(_sp)
        import backup_db as _bdb
        import asyncio as _asyncio
        result = await _asyncio.to_thread(_bdb.run_restore, key)
        return {"success": True, **result}
    except Exception as e:
        logger.error(f"DB restore failed: {e}")
        raise HTTPException(status_code=500, detail=f"Restore failed: {e}")

@api_router.post("/admin/backups/media/run")
async def run_media_backup_now(request: Request, manifest_only: bool = False):
    """Trigger a media backup. By default does full copy; pass ?manifest_only=true for cheap audit-only."""
    await require_super_admin(request)
    try:
        import sys as _sys
        _sp = str(Path(__file__).parent / "scripts")
        if _sp not in _sys.path:
            _sys.path.append(_sp)
        import backup_media as _bm
        import asyncio as _asyncio
        result = await _asyncio.to_thread(_bm.run_media_backup, manifest_only)
        return {"success": True, **result}
    except Exception as e:
        logger.error(f"media backup failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/admin/backups/media")
async def list_media_backups_api(request: Request):
    await require_super_admin(request)
    try:
        import sys as _sys
        _sp = str(Path(__file__).parent / "scripts")
        if _sp not in _sys.path:
            _sys.path.append(_sp)
        import backup_media as _bm
        import asyncio as _asyncio
        return await _asyncio.to_thread(_bm.list_media_backups)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/admin/restore/media")
async def restore_media_from_backup(request: Request):
    """Restore media files from a snapshot back to uploads prefix.
    Body: { "timestamp": "YYYYMMDD-HHMMSS", "confirm": "RESTORE" }
    """
    await require_super_admin(request)
    body = await request.json()
    ts = body.get("timestamp")
    confirm = body.get("confirm")
    if confirm != "RESTORE":
        raise HTTPException(status_code=400, detail="Bạn phải nhập RESTORE để xác nhận")
    if not ts:
        raise HTTPException(status_code=400, detail="Missing timestamp")
    try:
        import sys as _sys
        _sp = str(Path(__file__).parent / "scripts")
        if _sp not in _sys.path:
            _sys.path.append(_sp)
        import backup_media as _bm
        import asyncio as _asyncio
        result = await _asyncio.to_thread(_bm.run_media_restore, ts)
        return {"success": True, **result}
    except Exception as e:
        logger.error(f"media restore failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/admin/security/dashboard")
async def security_dashboard(request: Request):
    """Security dashboard data for Super Admin."""
    await require_super_admin(request)
    now = time.time()
    active_ips = len(rate_limiter.requests)
    blocked_ips = {ip: int(unblock - now) for ip, unblock in rate_limiter.blocked_ips.items() if unblock > now}
    locked_accounts = {}
    for key, attempts in login_tracker.attempts.items():
        cutoff = now - security_config["brute_force_window"]
        recent = [t for t in attempts if t > cutoff]
        if len(recent) >= security_config["brute_force_max"]:
            locked_accounts[key] = len(recent)

    return {
        "rate_limiter": {
            "active_tracked_ips": active_ips,
            "blocked_ips": blocked_ips,
            "total_blocked": len(blocked_ips),
            "breakdown": {
                "auth": sum(1 for k in rate_limiter.requests if k.startswith("auth:")),
                "orders": sum(1 for k in rate_limiter.requests if k.startswith("order:")),
                "global": sum(1 for k in rate_limiter.requests if k.startswith("global:")),
                "contact": sum(1 for k in rate_limiter.requests if k.startswith("contact:")),
                "register": sum(1 for k in rate_limiter.requests if k.startswith("register:")),
            }
        },
        "brute_force": {
            "locked_accounts": locked_accounts,
            "total_locked": len(locked_accounts),
        },
        "security_config": security_config,
    }

@api_router.put("/admin/security/config")
async def update_security_config(request: Request):
    """Update security config - Super Admin only."""
    await require_super_admin(request)
    body = await request.json()
    allowed = ["rate_global", "rate_auth", "rate_orders", "rate_contact", "rate_register",
               "brute_force_max", "brute_force_window", "max_body_mb", "content_word_limit"]
    updates = {}
    for key in allowed:
        if key in body:
            val = int(body[key])
            if val < 1:
                raise HTTPException(status_code=400, detail=f"{key} phải >= 1")
            updates[key] = val
    if not updates:
        raise HTTPException(status_code=400, detail="Không có thay đổi")
    security_config.update(updates)
    global MAX_CONTENT_WORDS
    if "content_word_limit" in updates:
        MAX_CONTENT_WORDS = updates["content_word_limit"]
    await db.settings.update_one({"key": "security_config"}, {"$set": {"value": security_config}}, upsert=True)
    return {"message": "Cấu hình bảo mật đã được cập nhật", "config": security_config}

# ==================== OG META TAGS FOR SOCIAL SHARING ====================

@api_router.get("/og/shop/{slug}", response_class=HTMLResponse)
async def og_shop_page(slug: str):
    """Serve HTML with dynamic OG meta tags for social media crawlers (Zalo, Facebook, etc.)"""
    shop = await db.shops.find_one({"slug": slug, "status": "active"})
    if not shop:
        raise HTTPException(status_code=404, detail="Shop not found")
    
    shop_name = shop.get("name", "Shop")
    description = shop.get("description", "")
    # Strip HTML tags and entities from description
    clean_desc = html_mod.unescape(re.sub(r'<[^>]+>', '', description)).strip()[:200] if description else shop_name
    clean_desc = clean_desc.replace('"', '&quot;')
    logo_url = shop.get("logo_url", "")
    theme_color = shop.get("theme_color", "#0055FF")
    
    frontend_url = os.environ.get("FRONTEND_URL", "")
    canonical_url = f"{frontend_url}/shop/{slug}" if frontend_url else f"/shop/{slug}"
    
    html = f"""<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="utf-8"/>
    <meta name="viewport" content="width=device-width, initial-scale=1"/>
    <title>{shop_name}</title>
    <meta name="description" content="{clean_desc}"/>
    <meta property="og:title" content="{shop_name}"/>
    <meta property="og:description" content="{clean_desc}"/>
    <meta property="og:type" content="website"/>
    <meta property="og:url" content="{canonical_url}"/>
    <meta property="og:site_name" content="{shop_name}"/>
    {f'<meta property="og:image" content="{logo_url}"/>' if logo_url else ''}
    <meta name="twitter:card" content="summary"/>
    <meta name="twitter:title" content="{shop_name}"/>
    <meta name="twitter:description" content="{clean_desc}"/>
    {f'<meta name="twitter:image" content="{logo_url}"/>' if logo_url else ''}
    <meta name="theme-color" content="{theme_color}"/>
    <meta http-equiv="refresh" content="0;url={canonical_url}"/>
    <link rel="canonical" href="{canonical_url}"/>
</head>
<body>
    <p>Redirecting to <a href="{canonical_url}">{shop_name}</a>...</p>
    <script>window.location.replace("{canonical_url}");</script>
</body>
</html>"""
    return HTMLResponse(content=html)

@api_router.get("/og/shop/{slug}/product/{product_id}", response_class=HTMLResponse)
async def og_product_page(slug: str, product_id: str):
    """Serve HTML with dynamic OG meta tags for product sharing"""
    shop = await db.shops.find_one({"slug": slug, "status": "active"})
    if not shop:
        raise HTTPException(status_code=404, detail="Shop not found")
    shop_id = str(shop["_id"])
    product = await db.products.find_one({"id": product_id, "shop_id": shop_id, "is_active": True, "is_hidden": {"$ne": True}}, {"_id": 0})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    shop_name = shop.get("name", "Shop")
    prod_name = product.get("name", "")
    price = product.get("price", 0)
    price_str = f"{price:,.0f}d".replace(",", ".")
    image_url = product.get("image_url", shop.get("logo_url", ""))
    description = product.get("description", "")
    clean_desc = html_mod.unescape(re.sub(r'<[^>]+>', '', description)).strip()[:200] if description else f"{prod_name} - {price_str}"
    clean_desc = clean_desc.replace('"', '&quot;')
    
    frontend_url = os.environ.get("FRONTEND_URL", "")
    canonical_url = f"{frontend_url}/shop/{slug}?product={product_id}" if frontend_url else f"/shop/{slug}?product={product_id}"
    
    html = f"""<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="utf-8"/>
    <meta name="viewport" content="width=device-width, initial-scale=1"/>
    <title>{prod_name} - {shop_name}</title>
    <meta name="description" content="{clean_desc}"/>
    <meta property="og:title" content="{prod_name} - {price_str}"/>
    <meta property="og:description" content="{clean_desc}"/>
    <meta property="og:type" content="product"/>
    <meta property="og:url" content="{canonical_url}"/>
    <meta property="og:site_name" content="{shop_name}"/>
    {f'<meta property="og:image" content="{image_url}"/>' if image_url else ''}
    <meta name="twitter:card" content="summary_large_image"/>
    <meta name="twitter:title" content="{prod_name} - {price_str}"/>
    <meta name="twitter:description" content="{clean_desc}"/>
    {f'<meta name="twitter:image" content="{image_url}"/>' if image_url else ''}
    <meta http-equiv="refresh" content="0;url={canonical_url}"/>
    <link rel="canonical" href="{canonical_url}"/>
</head>
<body>
    <p>Redirecting to <a href="{canonical_url}">{prod_name}</a>...</p>
    <script>window.location.replace("{canonical_url}");</script>
</body>
</html>"""
    return HTMLResponse(content=html)

app.include_router(api_router)

# ==================== SECURITY MIDDLEWARE ====================

# Order matters: SecurityHeaders -> RateLimit -> RequestSizeLimit -> CORS
# Starlette middleware runs in reverse order of addition (last added = first to run)
# So we add CORS first, then security middleware

# ==================== CORS ====================

frontend_url = os.environ.get('FRONTEND_URL', 'http://localhost:3000')
cors_origins_env = os.environ.get('CORS_ORIGINS', '')

if cors_origins_env == "*":
    from starlette.responses import Response as StarletteResponse

    class CombinedMiddleware(BaseHTTPMiddleware):
        """Combined CORS + Security middleware to avoid BaseHTTPMiddleware stacking issues."""
        MAX_BODY_SIZE = 10 * 1024 * 1024  # 10MB

        async def dispatch(self, request, call_next):
            origin = request.headers.get("origin", "")
            ip = get_client_ip(request)
            path = request.url.path

            # Handle CORS preflight
            if request.method == "OPTIONS":
                resp = StarletteResponse(status_code=200)
                resp.headers["Access-Control-Allow-Origin"] = origin or "*"
                resp.headers["Access-Control-Allow-Credentials"] = "true"
                resp.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS, PATCH"
                resp.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization, X-Requested-With"
                resp.headers["Access-Control-Max-Age"] = "86400"
                return resp

            # Request size limit
            content_length = request.headers.get("content-length")
            max_bytes = security_config["max_body_mb"] * 1024 * 1024
            if content_length and int(content_length) > max_bytes:
                return JSONResponse(status_code=413, content={"detail": f"Dung lượng yêu cầu quá lớn (tối đa {security_config['max_body_mb']}MB)"})

            # Rate limiting
            if path in ("/api/auth/login", "/api/auth/register", "/api/auth/forgot-password"):
                if not rate_limiter.is_allowed(f"auth:{ip}", max_requests=security_config["rate_auth"], window_seconds=60):
                    return JSONResponse(status_code=429, content={"detail": "Quá nhiều yêu cầu. Vui lòng thử lại sau."})
            elif path.endswith("/orders") and request.method == "POST":
                if not rate_limiter.is_allowed(f"order:{ip}", max_requests=security_config["rate_orders"], window_seconds=60):
                    return JSONResponse(status_code=429, content={"detail": "Quá nhiều đơn hàng. Vui lòng thử lại sau."})
            elif path.startswith("/api/") and not (path.startswith("/api/shop/") and request.method == "GET") and not (path.startswith("/api/files/") and request.method == "GET") and not (path.startswith("/api/card/") and request.method == "GET"):
                if not rate_limiter.is_allowed(f"global:{ip}", max_requests=security_config["rate_global"], window_seconds=60):
                    return JSONResponse(status_code=429, content={"detail": "Quá nhiều yêu cầu. Vui lòng thử lại sau."})

            response = await call_next(request)

            # CORS headers
            if origin:
                response.headers["Access-Control-Allow-Origin"] = origin
                response.headers["Access-Control-Allow-Credentials"] = "true"

            # Security headers
            response.headers["X-Content-Type-Options"] = "nosniff"
            response.headers["X-Frame-Options"] = "SAMEORIGIN"
            response.headers["X-XSS-Protection"] = "1; mode=block"
            response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
            response.headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=()"

            return response

    app.add_middleware(CombinedMiddleware)
    app.add_middleware(GZipMiddleware, minimum_size=512)
else:
    allowed_origins = [frontend_url, "http://localhost:3000"]
    if cors_origins_env:
        allowed_origins.extend([o.strip() for o in cors_origins_env.split(",") if o.strip()])
    app.add_middleware(
        CORSMiddleware,
        allow_origins=allowed_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    # Add security middleware only when using standard CORS (not combined)
    app.add_middleware(SecurityMiddleware)
    app.add_middleware(GZipMiddleware, minimum_size=512)

# ==================== STARTUP - SEED DATA ====================

@app.on_event("startup")
async def startup_event():
    await db.users.create_index("email", unique=True)
    await db.shops.create_index("slug", unique=True)
    await db.products.create_index([("shop_id", 1), ("id", 1)])
    await db.orders.create_index([("shop_id", 1), ("created_at", -1)])
    await db.categories.create_index([("shop_id", 1), ("id", 1)])
    await db.posts.create_index([("shop_id", 1), ("id", 1)])
    await db.pages.create_index([("shop_id", 1), ("id", 1)])
    await db.push_subscriptions.create_index([("shop_id", 1), ("subscription.endpoint", 1)])
    await db.vouchers.create_index([("shop_id", 1), ("code", 1)], unique=True)
    await db.vouchers.create_index([("shop_id", 1), ("id", 1)])
    await db.agents.create_index("email", unique=True)
    await db.agents.create_index([("shop_id", 1), ("id", 1)])
    await db.agents.create_index("tracking_code", unique=True)
    await db.agent_sales.create_index([("shop_id", 1), ("agent_id", 1)])
    await db.agent_sales.create_index([("agent_id", 1), ("created_at", -1)])
    await db.business_cards.create_index([("owner_id", 1), ("owner_type", 1)], unique=True)
    await db.bookings.create_index([("shop_id", 1), ("created_at", -1)])

    # Load security config from DB
    saved_config = await db.settings.find_one({"key": "security_config"})
    if saved_config and saved_config.get("value"):
        security_config.update(saved_config["value"])
        global MAX_CONTENT_WORDS
        MAX_CONTENT_WORDS = security_config.get("content_word_limit", 1000)
        logger.info(f"Loaded security config from DB")

    admin_email = os.environ.get("ADMIN_EMAIL", "daominhhai129@gmail.com")
    admin_password = os.environ.get("ADMIN_PASSWORD", "admin123")

    # Seed super admin
    existing_admin = await db.users.find_one({"email": admin_email})
    if not existing_admin:
        await db.users.insert_one({"email": admin_email, "password_hash": hash_password(admin_password), "name": "Super Admin", "role": "super_admin", "status": "active", "recovery_email": admin_email, "created_at": datetime.now(timezone.utc)})
        logger.info(f"Seeded super admin: {admin_email}")

    # Also ensure old admin email is removed or updated
    old_admin = await db.users.find_one({"email": "admin@thewishop.com", "role": "super_admin"})
    if old_admin and admin_email != "admin@thewishop.com":
        await db.users.delete_one({"_id": old_admin["_id"]})
        logger.info("Removed old admin@thewishop.com account")

    # Seed sub_admin
    sub_admin_email = "sales@proid.vn"
    existing_sub = await db.users.find_one({"email": sub_admin_email})
    if not existing_sub:
        await db.users.insert_one({"email": sub_admin_email, "password_hash": hash_password("iLoveProID@"), "name": "Sales Admin", "role": "sub_admin", "status": "active", "created_at": datetime.now(timezone.utc)})
        logger.info(f"Seeded sub_admin: {sub_admin_email}")
    elif existing_sub.get("role") != "sub_admin":
        await db.users.update_one({"email": sub_admin_email}, {"$set": {"role": "sub_admin"}})

    # Seed all 3 shops from seed_data.py
    from seed_data import (
        SHOP1_USER, SHOP1, get_shop1_categories, get_shop1_products, get_shop1_orders, get_shop1_posts,
        SHOP2_USER, SHOP2, get_shop2_categories, get_shop2_products, get_shop2_orders, get_shop2_posts,
        SHOP3_USER, SHOP3, get_shop3_categories, get_shop3_products, get_shop3_orders, get_shop3_posts,
    )

    async def seed_shop(user_info, shop_info, get_cats, get_prods, get_orders, get_posts):
        existing = await db.users.find_one({"email": user_info["email"]})
        if existing:
            return
        shop_doc = {**shop_info, "created_at": datetime.now(timezone.utc)}
        try:
            shop_result = await db.shops.insert_one(shop_doc)
        except Exception as e:
            logger.warning(f"Shop {shop_info['name']} already exists or error: {e}")
            existing_shop = await db.shops.find_one({"slug": shop_info["slug"]})
            if existing_shop:
                shop_id = str(existing_shop["_id"])
                await db.users.insert_one({"email": user_info["email"], "password_hash": hash_password(user_info["password"]), "name": user_info["name"], "role": "shop_owner", "shop_id": shop_id, "status": "active", "created_at": datetime.now(timezone.utc)})
            return
        shop_id = str(shop_result.inserted_id)

        await db.users.insert_one({"email": user_info["email"], "password_hash": hash_password(user_info["password"]), "name": user_info["name"], "role": "shop_owner", "shop_id": shop_id, "status": "active", "created_at": datetime.now(timezone.utc)})

        cats = get_cats(shop_id)
        if cats:
            await db.categories.insert_many(cats)

        prods = get_prods(shop_id)
        if prods:
            await db.products.insert_many(prods)

        orders = get_orders(shop_id)
        if orders:
            await db.orders.insert_many(orders)

        posts = get_posts(shop_id)
        if posts:
            await db.posts.insert_many(posts)

        # Seed pages from custom_pages in shop_info
        custom_pages = shop_info.get("custom_pages", [])
        if custom_pages:
            for pg in custom_pages:
                pg["shop_id"] = shop_id
                pg["created_at"] = datetime.now(timezone.utc)
                pg["updated_at"] = datetime.now(timezone.utc)
            await db.pages.insert_many(custom_pages)

        logger.info(f"Seeded shop: {shop_info['name']} ({len(cats)} cats, {len(prods)} products, {len(orders)} orders, {len(posts)} posts)")

    await seed_shop(SHOP1_USER, SHOP1, get_shop1_categories, get_shop1_products, get_shop1_orders, get_shop1_posts)
    await seed_shop(SHOP2_USER, SHOP2, get_shop2_categories, get_shop2_products, get_shop2_orders, get_shop2_posts)
    await seed_shop(SHOP3_USER, SHOP3, get_shop3_categories, get_shop3_products, get_shop3_orders, get_shop3_posts)

    # Write test credentials
    memory_dir = Path("/app/memory")
    memory_dir.mkdir(exist_ok=True)
    with open(memory_dir / "test_credentials.md", "w") as f:
        f.write("# Test Credentials\n\n")
        f.write("## Super Admin\n")
        f.write(f"- Email: {admin_email}\n")
        f.write(f"- Password: {admin_password}\n\n")
        f.write("## Shop Owner 1 - The Elite Shop\n")
        f.write(f"- Email: {SHOP1_USER['email']}\n")
        f.write(f"- Password: {SHOP1_USER['password']}\n")
        f.write("- Shop slug: the-elite-shop\n\n")
        f.write("## Shop Owner 2 - Green Living\n")
        f.write(f"- Email: {SHOP2_USER['email']}\n")
        f.write(f"- Password: {SHOP2_USER['password']}\n")
        f.write("- Shop slug: green-living\n\n")
        f.write("## Shop Owner 3 - Cho Xanh 365\n")
        f.write(f"- Email: {SHOP3_USER['email']}\n")
        f.write(f"- Password: {SHOP3_USER['password']}\n")
        f.write("- Shop slug: cho-xanh-365\n")

    # Start daily DB backup scheduler (runs at 02:00 UTC = 09:00 ICT)
    try:
        from apscheduler.schedulers.asyncio import AsyncIOScheduler
        from apscheduler.triggers.cron import CronTrigger
        import asyncio as _asyncio
        import sys as _sys
        from pathlib import Path as _P
        _sp = str(_P(__file__).parent / "scripts")
        if _sp not in _sys.path:
            _sys.path.append(_sp)
        scheduler = AsyncIOScheduler()

        async def _scheduled_backup():
            try:
                import backup_db as _bdb
                result = await _asyncio.to_thread(_bdb.run_backup)
                logger.info(f"[BACKUP][CRON] OK: {result}")
            except Exception as e:
                logger.error(f"[BACKUP][CRON] failed: {e}")

        scheduler.add_job(_scheduled_backup, CronTrigger(hour=2, minute=0), id="daily_db_backup", replace_existing=True)
        scheduler.start()
        app.state.backup_scheduler = scheduler
        logger.info("Daily DB backup scheduler started (02:00 UTC)")
    except Exception as e:
        logger.error(f"Failed to start backup scheduler: {e}")

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
