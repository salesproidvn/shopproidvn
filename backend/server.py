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
import requests
import uuid as uuid_lib
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

# Object Storage Configuration
STORAGE_URL = "https://integrations.emergentagent.com/objstore/api/v1/storage"
EMERGENT_KEY = os.environ.get("EMERGENT_LLM_KEY")
APP_NAME = "the-wi-shop"
storage_key = None

# Create the main app and router
app = FastAPI()
api_router = APIRouter(prefix="/api")

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# ==================== STORAGE ====================

def init_storage():
    global storage_key
    if storage_key:
        return storage_key
    if not EMERGENT_KEY:
        logger.warning("EMERGENT_LLM_KEY not set, storage disabled")
        return None
    try:
        resp = requests.post(f"{STORAGE_URL}/init", json={"emergent_key": EMERGENT_KEY}, timeout=30)
        resp.raise_for_status()
        storage_key = resp.json()["storage_key"]
        return storage_key
    except Exception as e:
        logger.error(f"Storage init failed: {e}")
        return None

def put_object(path: str, data: bytes, content_type: str) -> dict:
    key = init_storage()
    if not key:
        raise HTTPException(status_code=500, detail="Storage not available")
    resp = requests.put(f"{STORAGE_URL}/objects/{path}", headers={"X-Storage-Key": key, "Content-Type": content_type}, data=data, timeout=120)
    resp.raise_for_status()
    return resp.json()

def get_object(path: str) -> tuple:
    key = init_storage()
    if not key:
        raise HTTPException(status_code=500, detail="Storage not available")
    resp = requests.get(f"{STORAGE_URL}/objects/{path}", headers={"X-Storage-Key": key}, timeout=60)
    resp.raise_for_status()
    return resp.content, resp.headers.get("Content-Type", "application/octet-stream")

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

# ==================== PYDANTIC MODELS ====================

class UserRegister(BaseModel):
    email: EmailStr
    password: str
    name: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

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
    stock: Optional[int] = 0
    position: Optional[int] = 0

class ProductUpdate(BaseModel):
    name: Optional[str] = None
    price: Optional[int] = None
    category_id: Optional[str] = None
    description: Optional[str] = None
    image_url: Optional[str] = None
    images: Optional[List[str]] = None
    video_url: Optional[str] = None
    stock: Optional[int] = None
    position: Optional[int] = None
    is_active: Optional[bool] = None

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
        result.append({
            "id": sid, "name": s["name"], "slug": s["slug"], "status": s.get("status", "active"),
            "expiry_date": s.get("expiry_date", ""), "theme_color": s.get("theme_color", "#0055FF"),
            "created_at": s["created_at"].isoformat() if isinstance(s["created_at"], datetime) else str(s["created_at"]),
            "owner": owner, "order_count": oc
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
            "status": u.get("status", "active"), "shop_name": shop_name,
            "created_at": u["created_at"].isoformat() if isinstance(u["created_at"], datetime) else str(u["created_at"])
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
    shop_doc = {"name": data.shop_name, "slug": slug, "description": "", "logo_url": "", "contact_phone": "", "contact_email": email, "address": "", "social_facebook": "", "social_instagram": "", "theme_color": "#0055FF", "status": "active", "expiry_date": "", "created_at": datetime.now(timezone.utc)}
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

# ==================== IMAGE UPLOAD ====================

@api_router.post("/upload/image")
async def upload_image(file: UploadFile = File(...)):
    allowed = ["image/jpeg", "image/png", "image/gif", "image/webp"]
    if file.content_type not in allowed:
        raise HTTPException(status_code=400, detail="Invalid file type")
    data = await file.read()
    if len(data) > 5 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File too large (max 5MB)")
    ext = file.filename.split(".")[-1] if "." in file.filename else "jpg"
    file_id = str(uuid_lib.uuid4())
    path = f"{APP_NAME}/products/{file_id}.{ext}"
    try:
        result = put_object(path, data, file.content_type or "image/jpeg")
        await db.files.insert_one({"id": file_id, "storage_path": result["path"], "original_filename": file.filename, "content_type": file.content_type, "size": result.get("size", len(data)), "is_deleted": False, "created_at": datetime.now(timezone.utc)})
        return {"id": file_id, "path": result["path"], "url": f"/api/files/{file_id}"}
    except Exception as e:
        logger.error(f"Upload failed: {e}")
        raise HTTPException(status_code=500, detail="Upload failed")

@api_router.get("/files/{file_id}")
async def get_file(file_id: str):
    file_doc = await db.files.find_one({"id": file_id, "is_deleted": False})
    if not file_doc:
        raise HTTPException(status_code=404, detail="File not found")
    try:
        data, ct = get_object(file_doc["storage_path"])
        return Response(content=data, media_type=file_doc.get("content_type", ct))
    except Exception as e:
        logger.error(f"Download failed: {e}")
        raise HTTPException(status_code=500, detail="Download failed")

# ==================== DASHBOARD - SHOP ====================

@api_router.get("/dashboard/stats")
async def get_dashboard_stats(request: Request):
    user = await require_shop_owner(request)
    shop_id = user.get("shop_id")
    if not shop_id:
        raise HTTPException(status_code=400, detail="No shop associated")
    tp = await db.products.count_documents({"shop_id": shop_id})
    to = await db.orders.count_documents({"shop_id": shop_id})
    po = await db.orders.count_documents({"shop_id": shop_id, "status": "pending"})
    pipeline = [{"$match": {"shop_id": shop_id}}, {"$group": {"_id": None, "total": {"$sum": "$total_amount"}}}]
    rev = await db.orders.aggregate(pipeline).to_list(1)
    return {"total_products": tp, "total_orders": to, "pending_orders": po, "total_revenue": rev[0]["total"] if rev else 0}

@api_router.get("/dashboard/shop")
async def get_shop_details(request: Request):
    user = await require_shop_owner(request)
    shop_id = user.get("shop_id")
    if not shop_id:
        raise HTTPException(status_code=400, detail="No shop associated")
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
        "custom_domain": shop.get("custom_domain", "")
    }

@api_router.put("/dashboard/shop")
async def update_shop(data: ShopUpdate, request: Request):
    user = await require_shop_owner(request)
    shop_id = user.get("shop_id")
    if not shop_id:
        raise HTTPException(status_code=400, detail="No shop associated")
    update_data = {k: v for k, v in data.model_dump().items() if v is not None}
    if not update_data:
        raise HTTPException(status_code=400, detail="No data to update")
    await db.shops.update_one({"_id": ObjectId(shop_id)}, {"$set": update_data})
    return {"message": "Shop updated"}

# ==================== DASHBOARD - CATEGORIES ====================

@api_router.get("/dashboard/categories")
async def get_shop_categories(request: Request):
    user = await require_shop_owner(request)
    shop_id = user.get("shop_id")
    cats = await db.categories.find({"shop_id": shop_id}, {"_id": 0}).sort("position", 1).to_list(50)
    return cats

@api_router.post("/dashboard/categories")
async def create_category(data: CategoryCreate, request: Request):
    user = await require_shop_owner(request)
    shop_id = user.get("shop_id")
    max_pos = 0
    last = await db.categories.find({"shop_id": shop_id}).sort("position", -1).limit(1).to_list(1)
    if last:
        max_pos = last[0].get("position", 0)
    cat_id = f"cat-{secrets.token_hex(6)}"
    doc = {"id": cat_id, "shop_id": shop_id, "name": data.name, "description": data.description, "position": max_pos + 1, "created_at": datetime.now(timezone.utc)}
    await db.categories.insert_one(doc)
    return {"id": cat_id, "name": data.name, "description": data.description, "position": max_pos + 1}

@api_router.put("/dashboard/categories/{cat_id}")
async def update_category(cat_id: str, data: CategoryCreate, request: Request):
    user = await require_shop_owner(request)
    result = await db.categories.update_one({"id": cat_id, "shop_id": user.get("shop_id")}, {"$set": {"name": data.name, "description": data.description}})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Category not found")
    return {"message": "Category updated"}

@api_router.delete("/dashboard/categories/{cat_id}")
async def delete_category(cat_id: str, request: Request):
    user = await require_shop_owner(request)
    shop_id = user.get("shop_id")
    result = await db.categories.delete_one({"id": cat_id, "shop_id": shop_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Category not found")
    await db.products.update_many({"shop_id": shop_id, "category_id": cat_id}, {"$set": {"category_id": None, "category": ""}})
    return {"message": "Category deleted"}

@api_router.put("/dashboard/categories/positions")
async def update_category_positions(data: CategoryPositionUpdate, request: Request):
    user = await require_shop_owner(request)
    shop_id = user.get("shop_id")
    for item in data.positions:
        await db.categories.update_one({"id": item["id"], "shop_id": shop_id}, {"$set": {"position": item["position"]}})
    return {"message": "Positions updated"}

# ==================== DASHBOARD - PRODUCTS ====================

@api_router.get("/dashboard/products")
async def get_shop_products(request: Request):
    user = await require_shop_owner(request)
    products = await db.products.find({"shop_id": user.get("shop_id")}, {"_id": 0}).sort("position", 1).to_list(200)
    return products

@api_router.post("/dashboard/products")
async def create_product(data: ProductCreate, request: Request):
    user = await require_shop_owner(request)
    shop_id = user.get("shop_id")
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
        "stock": data.stock, "position": data.position or 0, "is_active": True,
        "created_at": datetime.now(timezone.utc)
    }
    await db.products.insert_one(doc)
    doc.pop("_id", None)
    return doc

@api_router.put("/dashboard/products/{prod_id}")
async def update_product(prod_id: str, request: Request):
    user = await require_shop_owner(request)
    shop_id = user.get("shop_id")
    body = await request.json()
    # Resolve category name
    if "category_id" in body:
        cid = body["category_id"]
        if cid and cid != "none":
            cat = await db.categories.find_one({"id": cid, "shop_id": shop_id})
            body["category"] = cat["name"] if cat else ""
        else:
            body["category_id"] = None
            body["category"] = ""
    # Sync images/image_url
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
    result = await db.products.delete_one({"id": prod_id, "shop_id": user.get("shop_id")})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Product not found")
    return {"message": "Product deleted"}

# ==================== DASHBOARD - ORDERS ====================

@api_router.get("/dashboard/orders")
async def get_shop_orders(request: Request):
    user = await require_shop_owner(request)
    orders = await db.orders.find({"shop_id": user.get("shop_id")}, {"_id": 0}).sort("created_at", -1).to_list(200)
    for o in orders:
        if isinstance(o.get("created_at"), datetime):
            o["created_at"] = o["created_at"].isoformat()
    return orders

@api_router.put("/dashboard/orders/{order_id}/status")
async def update_order_status(order_id: str, data: OrderStatusUpdate, request: Request):
    user = await require_shop_owner(request)
    valid = ["pending", "confirmed", "processing", "shipped", "completed", "cancelled"]
    if data.status not in valid:
        raise HTTPException(status_code=400, detail="Invalid status")
    result = await db.orders.update_one({"id": order_id, "shop_id": user.get("shop_id")}, {"$set": {"status": data.status, "updated_at": datetime.now(timezone.utc)}})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Order not found")
    return {"message": f"Order status updated to {data.status}"}

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
        "custom_domain": shop.get("custom_domain", "")
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
    products = await db.products.find(query, {"_id": 0}).sort("position", 1).to_list(200)
    return products

@api_router.get("/shop/{slug}/categories")
async def get_shop_categories_public(slug: str):
    shop = await db.shops.find_one({"slug": slug, "status": "active"})
    if not shop:
        raise HTTPException(status_code=404, detail="Shop not found")
    cats = await db.categories.find({"shop_id": str(shop["_id"])}, {"_id": 0}).sort("position", 1).to_list(50)
    return cats

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
    return {"id": order_id, "order_id": order_id, "total_amount": total, "items": items, "message": "Order placed successfully"}

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
    cats = await db.categories.find({}, {"_id": 0}).sort("position", 1).to_list(100)
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
    # Wildcard mode: dynamically reflect the request Origin header
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

    now = datetime.now(timezone.utc)
    admin_email = os.environ.get("ADMIN_EMAIL", "admin@thewishop.com")
    admin_password = os.environ.get("ADMIN_PASSWORD", "admin123")

    # Seed super admin
    existing_admin = await db.users.find_one({"email": admin_email})
    if not existing_admin:
        await db.users.insert_one({"email": admin_email, "password_hash": hash_password(admin_password), "name": "Super Admin", "role": "super_admin", "status": "active", "created_at": now})
        logger.info("Seeded super admin")
    elif not verify_password(admin_password, existing_admin["password_hash"]):
        await db.users.update_one({"email": admin_email}, {"$set": {"password_hash": hash_password(admin_password)}})

    # Seed demo shop owner + shop + categories + products + orders
    demo_email = "demo@thewishop.com"
    existing_demo = await db.users.find_one({"email": demo_email})
    if not existing_demo:
        # Create shop
        shop_doc = {
            "name": "The Elite Shop", "slug": "the-elite-shop",
            "description": "Premium products curated for the modern lifestyle",
            "logo_url": "", "contact_phone": "0912 345 678", "contact_email": "hello@theeliteshop.com",
            "address": "123 Nguyen Hue, District 1, HCMC", "social_facebook": "https://facebook.com/theeliteshop",
            "social_instagram": "https://instagram.com/theeliteshop", "theme_color": "#0055FF",
            "status": "active", "expiry_date": "", "created_at": now
        }
        shop_result = await db.shops.insert_one(shop_doc)
        shop_id = str(shop_result.inserted_id)

        # Create demo user
        await db.users.insert_one({"email": demo_email, "password_hash": hash_password("demo123"), "name": "Demo Shop Owner", "role": "shop_owner", "shop_id": shop_id, "status": "active", "created_at": now})
        logger.info("Seeded demo shop owner")

        # Categories
        categories = [
            {"id": "cat-1", "shop_id": shop_id, "name": "Electronics", "description": "Gadgets and devices", "position": 1, "created_at": now},
            {"id": "cat-2", "shop_id": shop_id, "name": "Fashion", "description": "Clothing and accessories", "position": 2, "created_at": now},
            {"id": "cat-3", "shop_id": shop_id, "name": "Home & Garden", "description": "Home decor and garden", "position": 3, "created_at": now},
            {"id": "cat-4", "shop_id": shop_id, "name": "Kitchen", "description": "Kitchen essentials", "position": 4, "created_at": now},
        ]
        await db.categories.insert_many(categories)

        # Products
        products = [
            {"id": "prod-1", "shop_id": shop_id, "name": "Sony Wireless Headphones", "price": 2490000, "category": "Electronics", "category_id": "cat-1", "stock": 25, "position": 1, "is_active": True, "image_url": "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=400&fit=crop", "images": ["https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=400&fit=crop", "https://images.unsplash.com/photo-1484704849700-f032a568e944?w=400&h=400&fit=crop", "https://images.unsplash.com/photo-1524678606370-a47ad25cb82a?w=400&h=400&fit=crop"], "video_url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ", "description": "Premium wireless headphones with active noise cancellation and 30h battery life.", "created_at": now},
            {"id": "prod-2", "shop_id": shop_id, "name": "Black Studio Headphones", "price": 1850000, "category": "Electronics", "category_id": "cat-1", "stock": 18, "position": 2, "is_active": True, "image_url": "https://images.unsplash.com/photo-1583394838336-acd977736f90?w=400&h=400&fit=crop", "images": ["https://images.unsplash.com/photo-1583394838336-acd977736f90?w=400&h=400&fit=crop", "https://images.unsplash.com/photo-1487215078519-e21cc028cb29?w=400&h=400&fit=crop"], "video_url": "", "description": "Professional studio-grade headphones for music production.", "created_at": now},
            {"id": "prod-3", "shop_id": shop_id, "name": "Grey Casual Sneakers", "price": 1200000, "category": "Fashion", "category_id": "cat-2", "stock": 40, "position": 1, "is_active": True, "image_url": "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&h=400&fit=crop", "images": ["https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&h=400&fit=crop", "https://images.unsplash.com/photo-1460353581641-37baddab0fa2?w=400&h=400&fit=crop", "https://images.unsplash.com/photo-1491553895911-0055eca6402d?w=400&h=400&fit=crop"], "video_url": "", "description": "Comfortable grey sneakers perfect for everyday wear.", "created_at": now},
            {"id": "prod-4", "shop_id": shop_id, "name": "Minimalist Smartphone", "price": 14500000, "category": "Electronics", "category_id": "cat-1", "stock": 10, "position": 3, "is_active": True, "image_url": "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400&h=400&fit=crop", "images": ["https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400&h=400&fit=crop", "https://images.unsplash.com/photo-1512054502232-10a0a035d672?w=400&h=400&fit=crop"], "video_url": "", "description": "Sleek smartphone with edge-to-edge display and triple camera system.", "created_at": now},
            {"id": "prod-5", "shop_id": shop_id, "name": "Minimalist Succulent Pot", "price": 320000, "category": "Home & Garden", "category_id": "cat-3", "stock": 60, "position": 1, "is_active": True, "image_url": "https://images.unsplash.com/photo-1485955900006-10f4d324d411?w=400&h=400&fit=crop", "images": ["https://images.unsplash.com/photo-1485955900006-10f4d324d411?w=400&h=400&fit=crop"], "video_url": "", "description": "Modern ceramic pot perfect for small succulents and cacti.", "created_at": now},
            {"id": "prod-6", "shop_id": shop_id, "name": "Handwoven Rattan Baskets", "price": 450000, "category": "Home & Garden", "category_id": "cat-3", "stock": 30, "position": 2, "is_active": True, "image_url": "https://images.unsplash.com/photo-1616486029423-aaa4789e8c9a?w=400&h=400&fit=crop", "images": ["https://images.unsplash.com/photo-1616486029423-aaa4789e8c9a?w=400&h=400&fit=crop"], "video_url": "", "description": "Beautifully handwoven rattan baskets for storage and decoration.", "created_at": now},
            {"id": "prod-7", "shop_id": shop_id, "name": "Ceramic Coffee Set", "price": 380000, "category": "Kitchen", "category_id": "cat-4", "stock": 20, "position": 1, "is_active": True, "image_url": "https://images.unsplash.com/photo-1514432324607-a09d9b4aefda?w=400&h=400&fit=crop", "images": ["https://images.unsplash.com/photo-1514432324607-a09d9b4aefda?w=400&h=400&fit=crop", "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400&h=400&fit=crop"], "video_url": "", "description": "Elegant ceramic coffee cup and saucer set, handmade.", "created_at": now},
            {"id": "prod-8", "shop_id": shop_id, "name": "Smart Watch Pro", "price": 3200000, "category": "Electronics", "category_id": "cat-1", "stock": 15, "position": 4, "is_active": True, "image_url": "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&h=400&fit=crop", "images": ["https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&h=400&fit=crop", "https://images.unsplash.com/photo-1546868871-af0de0ae72be?w=400&h=400&fit=crop"], "video_url": "", "description": "Feature-packed smartwatch with health tracking and GPS.", "created_at": now},
            {"id": "prod-9", "shop_id": shop_id, "name": "Leather Crossbody Bag", "price": 890000, "category": "Fashion", "category_id": "cat-2", "stock": 35, "position": 2, "is_active": True, "image_url": "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=400&h=400&fit=crop", "images": ["https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=400&h=400&fit=crop"], "video_url": "", "description": "Genuine leather crossbody bag with adjustable strap.", "created_at": now},
            {"id": "prod-10", "shop_id": shop_id, "name": "AirPods Pro Max", "price": 6500000, "category": "Electronics", "category_id": "cat-1", "stock": 8, "position": 5, "is_active": True, "image_url": "https://images.unsplash.com/photo-1606220588913-b3aacb4d2f46?w=400&h=400&fit=crop", "images": ["https://images.unsplash.com/photo-1606220588913-b3aacb4d2f46?w=400&h=400&fit=crop", "https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?w=400&h=400&fit=crop", "https://images.unsplash.com/photo-1588423771073-b8903fde1c68?w=400&h=400&fit=crop"], "video_url": "", "description": "Over-ear headphones with spatial audio and transparency mode.", "created_at": now},
            {"id": "prod-11", "shop_id": shop_id, "name": "Designer Sunglasses", "price": 1650000, "category": "Fashion", "category_id": "cat-2", "stock": 22, "position": 3, "is_active": True, "image_url": "https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=400&h=400&fit=crop", "images": ["https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=400&h=400&fit=crop"], "video_url": "", "description": "UV-protected designer sunglasses with polarized lenses.", "created_at": now},
            {"id": "prod-12", "shop_id": shop_id, "name": "Japanese Kitchen Knife Set", "price": 2100000, "category": "Kitchen", "category_id": "cat-4", "stock": 12, "position": 2, "is_active": True, "image_url": "https://images.unsplash.com/photo-1593618998160-e34014e67546?w=400&h=400&fit=crop", "images": ["https://images.unsplash.com/photo-1593618998160-e34014e67546?w=400&h=400&fit=crop", "https://images.unsplash.com/photo-1566454825481-9c31bd88bcea?w=400&h=400&fit=crop"], "video_url": "", "description": "Professional-grade Japanese steel knife set with wooden block.", "created_at": now},
        ]
        await db.products.insert_many(products)

        # Seed sample orders
        orders = [
            {"id": "ORD-DEMO001", "shop_id": shop_id, "customer_name": "Nguyen Van A", "customer_phone": "0901234567", "customer_email": "a@mail.com", "customer_address": "456 Le Loi, Q1, HCMC", "items": [{"product_id": "prod-1", "name": "Sony Wireless Headphones", "price": 2490000, "quantity": 1, "subtotal": 2490000, "image_url": "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=400&fit=crop"}], "total_amount": 2490000, "note": "", "status": "pending", "created_at": now},
            {"id": "ORD-DEMO002", "shop_id": shop_id, "customer_name": "Tran Thi B", "customer_phone": "0907654321", "customer_email": "b@mail.com", "customer_address": "789 Hai Ba Trung, Q3, HCMC", "items": [{"product_id": "prod-3", "name": "Grey Casual Sneakers", "price": 1200000, "quantity": 2, "subtotal": 2400000, "image_url": "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&h=400&fit=crop"}, {"product_id": "prod-7", "name": "Ceramic Coffee Set", "price": 380000, "quantity": 1, "subtotal": 380000, "image_url": "https://images.unsplash.com/photo-1514432324607-a09d9b4aefda?w=400&h=400&fit=crop"}], "total_amount": 2780000, "note": "Please gift wrap", "status": "confirmed", "created_at": now - timedelta(hours=2)},
            {"id": "ORD-DEMO003", "shop_id": shop_id, "customer_name": "Le Van C", "customer_phone": "0912345678", "customer_email": "c@mail.com", "customer_address": "101 Vo Van Tan, Q3, HCMC", "items": [{"product_id": "prod-4", "name": "Minimalist Smartphone", "price": 14500000, "quantity": 1, "subtotal": 14500000, "image_url": "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400&h=400&fit=crop"}], "total_amount": 14500000, "note": "", "status": "completed", "created_at": now - timedelta(days=1)},
        ]
        await db.orders.insert_many(orders)
        logger.info("Seeded demo data: categories, products, orders")

    # Write test credentials
    memory_dir = Path("/app/memory")
    memory_dir.mkdir(exist_ok=True)
    with open(memory_dir / "test_credentials.md", "w") as f:
        f.write("# Test Credentials\n\n")
        f.write("## Super Admin\n")
        f.write(f"- Email: {admin_email}\n")
        f.write(f"- Password: {admin_password}\n\n")
        f.write("## Demo Shop Owner\n")
        f.write("- Email: demo@thewishop.com\n")
        f.write("- Password: demo123\n")
        f.write("- Shop: The Elite Shop (slug: the-elite-shop)\n")

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
