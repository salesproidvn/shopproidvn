from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI, APIRouter, HTTPException, Request, Response, Depends, Query, File, UploadFile
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from bson import ObjectId
import os
import logging
import bcrypt
import jwt
import secrets
import uuid as uuid_lib
import io
import json
import asyncio
import boto3
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
    client.put_object(Bucket=R2_BUCKET, Key=path, Body=data, ContentType=content_type)
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

MAX_IMAGE_SIZE_BYTES = 300 * 1024  # 300KB

def compress_image(data: bytes, content_type: str, max_bytes: int = MAX_IMAGE_SIZE_BYTES) -> tuple:
    """Resize and compress image to stay under max_bytes. Returns (compressed_bytes, content_type)."""
    try:
        img = Image.open(io.BytesIO(data))
    except Exception:
        return data, content_type  # can't process, return as-is

    # Convert RGBA to RGB for JPEG output
    if img.mode in ("RGBA", "P"):
        img = img.convert("RGB")

    # Step 1: Scale down large images proportionally
    max_dim = 1920
    if img.width > max_dim or img.height > max_dim:
        ratio = min(max_dim / img.width, max_dim / img.height)
        new_size = (int(img.width * ratio), int(img.height * ratio))
        img = img.resize(new_size, Image.LANCZOS)

    # Step 2: Progressively lower quality until under max_bytes
    out_type = "image/jpeg"
    for quality in [85, 75, 65, 55, 45, 35, 25]:
        buf = io.BytesIO()
        img.save(buf, format="JPEG", quality=quality, optimize=True)
        result = buf.getvalue()
        if len(result) <= max_bytes:
            return result, out_type

    # Step 3: If still too large, scale down further
    for scale in [0.75, 0.5, 0.35, 0.25]:
        scaled = img.resize((int(img.width * scale), int(img.height * scale)), Image.LANCZOS)
        buf = io.BytesIO()
        scaled.save(buf, format="JPEG", quality=40, optimize=True)
        result = buf.getvalue()
        if len(result) <= max_bytes:
            return result, out_type

    # Last resort: return smallest attempt
    buf = io.BytesIO()
    img.resize((400, int(400 * img.height / img.width)), Image.LANCZOS).save(buf, format="JPEG", quality=30, optimize=True)
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
        user = await db.users.find_one({"_id": ObjectId(payload["sub"])})
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
    if user.get("role") != "super_admin":
        raise HTTPException(status_code=403, detail="Super admin access required")
    return user

async def require_shop_owner(request: Request) -> dict:
    user = await get_current_user(request)
    if user.get("role") not in ["shop_owner", "super_admin"]:
        raise HTTPException(status_code=403, detail="Shop owner access required")
    return user

def generate_shop_slug(name: str) -> str:
    import re
    slug = re.sub(r'[^\w\s-]', '', name.lower().strip())
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

class ShopCreate(BaseModel):
    name: str
    description: Optional[str] = ""

class ShopUpdate(BaseModel):
    name: Optional[str] = None
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

class CategoryCreate(BaseModel):
    name: str
    description: Optional[str] = ""

class ProductCreate(BaseModel):
    name: str
    price: int
    category_id: Optional[str] = None
    description: Optional[str] = ""
    image_url: Optional[str] = ""
    images: Optional[List[str]] = []
    video_url: Optional[str] = ""
    video_links: Optional[List[str]] = []
    stock: Optional[int] = 0
    position: Optional[int] = 0
    is_featured: Optional[bool] = False

class OrderCreate(BaseModel):
    customer_name: str
    customer_phone: str
    customer_email: Optional[str] = ""
    customer_address: str
    items: List[dict]
    note: Optional[str] = ""

class OrderStatusUpdate(BaseModel):
    status: str

class ShopOwnerCreate(BaseModel):
    email: EmailStr
    password: str
    name: str
    shop_name: str

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

# ==================== AUTH ENDPOINTS ====================

@api_router.post("/auth/register")
async def register(user_data: UserRegister, response: Response):
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
async def login(user_data: UserLogin, response: Response):
    email = user_data.email.lower()
    user = await db.users.find_one({"email": email})
    if not user:
        raise HTTPException(status_code=401, detail="Invalid email or password")
    if user.get("status") == "blocked":
        raise HTTPException(status_code=403, detail="Account is blocked")
    if not verify_password(user_data.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    user_id = str(user["_id"])
    role = user.get("role", "customer")
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
    user = await get_current_user(request)
    return {"id": user["_id"], "email": user["email"], "name": user["name"], "role": user["role"], "shop_id": user.get("shop_id"), "status": user.get("status", "active")}

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
async def change_password(data: ChangePasswordRequest, request: Request):
    """Change password for the currently logged-in user."""
    user = await get_current_user(request)
    user_doc = await db.users.find_one({"_id": ObjectId(user["_id"])})
    if not user_doc:
        raise HTTPException(status_code=404, detail="User not found")
    if not verify_password(data.current_password, user_doc["password_hash"]):
        raise HTTPException(status_code=400, detail="Current password is incorrect")
    if len(data.new_password) < 6:
        raise HTTPException(status_code=400, detail="New password must be at least 6 characters")
    new_hash = hash_password(data.new_password)
    await db.users.update_one({"_id": ObjectId(user["_id"])}, {"$set": {"password_hash": new_hash}})
    return {"message": "Password changed successfully"}

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
            "created_at": serialize_datetime(s.get("created_at")),
            "owner": owner, "order_count": oc, "product_count": pc, "category_count": cc,
            "item_count": pc
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
    if "max_products" in body:
        update["max_products"] = int(body["max_products"])
    if "max_posts" in body:
        update["max_posts"] = int(body["max_posts"])
    if update:
        await db.shops.update_one({"_id": ObjectId(shop_id)}, {"$set": update})
    return {"message": "Limits updated"}

@api_router.get("/admin/users")
async def get_all_users(request: Request):
    await require_super_admin(request)
    users = await db.users.find({}, {"password_hash": 0}).sort("created_at", -1).to_list(100)
    result = []
    for u in users:
        shop_name = None
        if u.get("shop_id"):
            shop = await db.shops.find_one({"_id": ObjectId(u["shop_id"])}, {"name": 1})
            shop_name = shop["name"] if shop else None
        result.append({
            "id": str(u["_id"]), "email": u["email"], "name": u["name"], "role": u["role"],
            "status": u.get("status", "active"), "shop_name": shop_name, "shop_id": u.get("shop_id"),
            "created_at": serialize_datetime(u.get("created_at"))
        })
    return result

@api_router.post("/admin/users")
async def create_shop_owner(data: ShopOwnerCreate, request: Request):
    await require_super_admin(request)
    email = data.email.lower()
    if await db.users.find_one({"email": email}):
        raise HTTPException(status_code=400, detail="Email already registered")
    slug = generate_shop_slug(data.shop_name)
    if await db.shops.find_one({"slug": slug}):
        slug = f"{slug}-{secrets.token_hex(3)}"
    shop_doc = {"name": data.shop_name, "slug": slug, "description": "", "logo_url": "", "contact_phone": "", "contact_email": email, "address": "", "social_facebook": "", "social_instagram": "", "theme_color": "#0055FF", "status": "active", "expiry_date": "", "banners": [], "banner_enabled": True, "blog_enabled": True, "layout_sections": [], "footer_columns": [], "menu_items": [], "mega_menu_categories": [], "custom_pages": [], "post_carousel_position": "top", "max_products": 100, "max_posts": 50, "created_at": datetime.now(timezone.utc)}
    shop_result = await db.shops.insert_one(shop_doc)
    shop_id = str(shop_result.inserted_id)
    user_doc = {"email": email, "password_hash": hash_password(data.password), "name": data.name, "role": "shop_owner", "shop_id": shop_id, "status": "active", "created_at": datetime.now(timezone.utc)}
    user_result = await db.users.insert_one(user_doc)
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
    await require_super_admin(request)
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

@api_router.post("/admin/users/{user_id}/reset-password")
async def admin_reset_password(user_id: str, request: Request):
    await require_super_admin(request)
    user = await db.users.find_one({"_id": ObjectId(user_id)})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    default_pw = "iLoveProID@"
    await db.users.update_one({"_id": ObjectId(user_id)}, {"$set": {"password_hash": hash_password(default_pw)}})
    return {"message": f"Password reset to: {default_pw}"}

# ==================== ADMIN MAINTENANCE ====================

@api_router.get("/admin/maintenance/preview")
async def maintenance_preview(request: Request):
    await require_super_admin(request)
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
async def upload_image(file: UploadFile = File(...)):
    allowed = ["image/jpeg", "image/png", "image/gif", "image/webp"]
    if file.content_type not in allowed:
        raise HTTPException(status_code=400, detail="Invalid file type")
    data = await file.read()
    if len(data) > 10 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File too large (max 10MB before compression)")

    original_size = len(data)
    # Compress and resize to stay under 300KB
    compressed_data, out_content_type = compress_image(data, file.content_type)
    compressed_size = len(compressed_data)
    logger.info(f"Image compressed: {original_size / 1024:.0f}KB -> {compressed_size / 1024:.0f}KB ({file.filename})")

    file_id = str(uuid_lib.uuid4())
    ext = "jpg"  # always JPEG after compression
    path = f"{APP_NAME}/products/{file_id}.{ext}"
    try:
        result = put_object(path, compressed_data, out_content_type)
        await db.files.insert_one({
            "id": file_id, "storage_path": result["path"],
            "original_filename": file.filename, "content_type": out_content_type,
            "size": compressed_size, "original_size": original_size,
            "is_deleted": False, "created_at": datetime.now(timezone.utc)
        })
        return {"id": file_id, "path": result["path"], "url": f"/api/files/{file_id}",
                "size": compressed_size, "original_size": original_size}
    except Exception as e:
        logger.error(f"Upload to R2 failed: {e}")
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")

@api_router.get("/files/{file_id}")
async def get_file(file_id: str):
    file_doc = await db.files.find_one({"id": file_id, "is_deleted": False})
    if not file_doc:
        raise HTTPException(status_code=404, detail="File not found")
    try:
        data, ct = get_object(file_doc["storage_path"])
        return Response(content=data, media_type=file_doc.get("content_type", ct))
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
        "address": shop.get("address", ""), "social_facebook": shop.get("social_facebook", ""),
        "social_instagram": shop.get("social_instagram", ""), "theme_color": shop.get("theme_color", "#0055FF"),
        "status": shop.get("status", "active"), "expiry_date": shop.get("expiry_date", ""),
        "custom_domain": shop.get("custom_domain", ""),
        "banners": shop.get("banners", []), "banner_enabled": shop.get("banner_enabled", True),
        "blog_enabled": shop.get("blog_enabled", True),
        "layout_sections": shop.get("layout_sections", []),
        "footer_columns": shop.get("footer_columns", []),
        "post_carousel_position": shop.get("post_carousel_position", "top"),
        "max_products": shop.get("max_products", 100), "max_posts": shop.get("max_posts", 50),
    }

@api_router.put("/dashboard/shop")
async def update_shop(request: Request):
    user = await require_shop_owner(request)
    shop_id = await resolve_shop_id(request, user)
    body = await request.json()
    if not body:
        raise HTTPException(status_code=400, detail="No data to update")
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
    max_pos = 0
    last = await db.categories.find({"shop_id": shop_id}).sort("position", -1).limit(1).to_list(1)
    if last:
        max_pos = last[0].get("position", 0)
    cat_id = f"cat-{secrets.token_hex(6)}"
    doc = {"id": cat_id, "shop_id": shop_id, "name": data.name, "description": data.description, "position": max_pos + 1, "parent_id": None, "image_url": "", "created_at": datetime.now(timezone.utc)}
    await db.categories.insert_one(doc)
    return {"id": cat_id, "name": data.name, "description": data.description, "position": max_pos + 1}

@api_router.put("/dashboard/categories/{cat_id}")
async def update_category(cat_id: str, data: CategoryCreate, request: Request):
    user = await require_shop_owner(request)
    shop_id = await resolve_shop_id(request, user)
    result = await db.categories.update_one({"id": cat_id, "shop_id": shop_id}, {"$set": {"name": data.name, "description": data.description}})
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

@api_router.put("/dashboard/categories/positions")
async def update_category_positions(request: Request):
    user = await require_shop_owner(request)
    shop_id = await resolve_shop_id(request, user)
    body = await request.json()
    positions = body.get("positions", [])
    for item in positions:
        await db.categories.update_one({"id": item["id"], "shop_id": shop_id}, {"$set": {"position": item["position"]}})
    return {"message": "Positions updated"}

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
        "stock": data.stock, "position": data.position or 0, "is_active": True,
        "is_featured": data.is_featured or False,
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
    for o in orders:
        o["created_at"] = serialize_datetime(o.get("created_at"))
    return orders

@api_router.put("/dashboard/orders/{order_id}/status")
async def update_order_status(order_id: str, data: OrderStatusUpdate, request: Request):
    user = await require_shop_owner(request)
    shop_id = await resolve_shop_id(request, user)
    valid = ["pending", "confirmed", "processing", "shipped", "completed", "cancelled"]
    if data.status not in valid:
        raise HTTPException(status_code=400, detail="Invalid status")
    result = await db.orders.update_one({"id": order_id, "shop_id": shop_id}, {"$set": {"status": data.status, "updated_at": datetime.now(timezone.utc)}})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Order not found")
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
    return shop.get("mega_menu_categories", []) if shop else []

@api_router.put("/dashboard/mega-menu")
async def update_mega_menu(data: MegaMenuUpdate, request: Request):
    user = await require_shop_owner(request)
    shop_id = await resolve_shop_id(request, user)
    await db.shops.update_one({"_id": ObjectId(shop_id)}, {"$set": {"mega_menu_categories": data.items}})
    return {"message": "Mega menu updated"}

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
        "address": shop.get("address", ""), "social_facebook": shop.get("social_facebook", ""),
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
    }

@api_router.get("/shop/{slug}/products")
async def get_shop_products_public(slug: str, category: Optional[str] = None, search: Optional[str] = None):
    shop = await db.shops.find_one({"slug": slug, "status": "active"})
    if not shop:
        raise HTTPException(status_code=404, detail="Shop not found")
    shop_id = str(shop["_id"])
    query = {"shop_id": shop_id, "is_active": True}
    if category and category != "all":
        query["category_id"] = category
    if search:
        query["name"] = {"$regex": search, "$options": "i"}
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
async def create_order(slug: str, data: OrderCreate):
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
    doc = {"id": order_id, "shop_id": shop_id, "customer_name": data.customer_name, "customer_phone": data.customer_phone, "customer_email": data.customer_email, "customer_address": data.customer_address, "items": items, "total_amount": total, "note": data.note, "status": "pending", "created_at": datetime.now(timezone.utc)}
    await db.orders.insert_one(doc)

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

    return {"id": order_id, "order_id": order_id, "total_amount": total, "items": items, "message": "Order placed successfully"}

@api_router.post("/shop/{slug}/contact")
async def submit_contact(slug: str, data: ContactForm):
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
    query = {"is_active": {"$ne": False}}
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

app.include_router(api_router)

# ==================== CORS ====================

frontend_url = os.environ.get('FRONTEND_URL', 'http://localhost:3000')
cors_origins_env = os.environ.get('CORS_ORIGINS', '')

if cors_origins_env == "*":
    from starlette.middleware.base import BaseHTTPMiddleware
    from starlette.responses import Response as StarletteResponse

    class DynamicCORSMiddleware(BaseHTTPMiddleware):
        async def dispatch(self, request, call_next):
            origin = request.headers.get("origin", "")
            if request.method == "OPTIONS":
                resp = StarletteResponse(status_code=200)
                resp.headers["Access-Control-Allow-Origin"] = origin or "*"
                resp.headers["Access-Control-Allow-Credentials"] = "true"
                resp.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS, PATCH"
                resp.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization, X-Requested-With"
                resp.headers["Access-Control-Max-Age"] = "86400"
                return resp
            response = await call_next(request)
            if origin:
                response.headers["Access-Control-Allow-Origin"] = origin
                response.headers["Access-Control-Allow-Credentials"] = "true"
            return response

    app.add_middleware(DynamicCORSMiddleware)
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

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
