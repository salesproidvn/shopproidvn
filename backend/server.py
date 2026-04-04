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

# Create the main app
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# ==================== STORAGE FUNCTIONS ====================

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
        logger.info("Storage initialized successfully")
        return storage_key
    except Exception as e:
        logger.error(f"Storage init failed: {e}")
        return None

def put_object(path: str, data: bytes, content_type: str) -> dict:
    key = init_storage()
    if not key:
        raise HTTPException(status_code=500, detail="Storage not available")
    resp = requests.put(
        f"{STORAGE_URL}/objects/{path}",
        headers={"X-Storage-Key": key, "Content-Type": content_type},
        data=data, timeout=120
    )
    resp.raise_for_status()
    return resp.json()

def get_object(path: str) -> tuple:
    key = init_storage()
    if not key:
        raise HTTPException(status_code=500, detail="Storage not available")
    resp = requests.get(
        f"{STORAGE_URL}/objects/{path}",
        headers={"X-Storage-Key": key}, timeout=60
    )
    resp.raise_for_status()
    return resp.content, resp.headers.get("Content-Type", "application/octet-stream")

# ==================== UTILITY FUNCTIONS ====================

def hash_password(password: str) -> str:
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode("utf-8"), salt).decode("utf-8")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return bcrypt.checkpw(plain_password.encode("utf-8"), hashed_password.encode("utf-8"))

def create_access_token(user_id: str, email: str, role: str) -> str:
    payload = {
        "sub": user_id,
        "email": email,
        "role": role,
        "exp": datetime.now(timezone.utc) + timedelta(hours=24),
        "type": "access"
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

def create_refresh_token(user_id: str) -> str:
    payload = {
        "sub": user_id,
        "exp": datetime.now(timezone.utc) + timedelta(days=7),
        "type": "refresh"
    }
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
    slug = name.lower().strip()
    slug = re.sub(r'[^\w\s-]', '', slug)
    slug = re.sub(r'[-\s]+', '-', slug)
    return slug[:50]

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
    contact_phone: Optional[str] = ""
    contact_email: Optional[str] = ""
    address: Optional[str] = ""

class ShopUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    logo_url: Optional[str] = None
    contact_phone: Optional[str] = None
    contact_email: Optional[str] = None
    address: Optional[str] = None
    social_facebook: Optional[str] = None
    social_instagram: Optional[str] = None

class CategoryCreate(BaseModel):
    name: str
    description: Optional[str] = ""

class ProductCreate(BaseModel):
    name: str
    price: int
    category_id: Optional[str] = None
    description: Optional[str] = ""
    image_url: str
    stock: Optional[int] = 0

class ProductUpdate(BaseModel):
    name: Optional[str] = None
    price: Optional[int] = None
    category_id: Optional[str] = None
    description: Optional[str] = None
    image_url: Optional[str] = None
    stock: Optional[int] = None
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

class PasswordReset(BaseModel):
    new_password: str

# ==================== AUTH ENDPOINTS ====================

@api_router.post("/auth/register")
async def register(user_data: UserRegister, response: Response):
    email = user_data.email.lower()
    existing = await db.users.find_one({"email": email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    hashed = hash_password(user_data.password)
    user_doc = {
        "email": email,
        "password_hash": hashed,
        "name": user_data.name,
        "role": "customer",
        "status": "active",
        "created_at": datetime.now(timezone.utc),
        "wishlist": [],
        "cart": []
    }
    result = await db.users.insert_one(user_doc)
    user_id = str(result.inserted_id)
    
    access_token = create_access_token(user_id, email, "customer")
    refresh_token = create_refresh_token(user_id)
    
    response.set_cookie(key="access_token", value=access_token, httponly=True, secure=False, samesite="lax", max_age=86400, path="/")
    response.set_cookie(key="refresh_token", value=refresh_token, httponly=True, secure=False, samesite="lax", max_age=604800, path="/")
    
    return {"id": user_id, "email": email, "name": user_data.name, "role": "customer"}

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
    refresh_token = create_refresh_token(user_id)
    
    response.set_cookie(key="access_token", value=access_token, httponly=True, secure=False, samesite="lax", max_age=86400, path="/")
    response.set_cookie(key="refresh_token", value=refresh_token, httponly=True, secure=False, samesite="lax", max_age=604800, path="/")
    
    return {"id": user_id, "email": user["email"], "name": user["name"], "role": role, "shop_id": user.get("shop_id")}

@api_router.post("/auth/logout")
async def logout(response: Response):
    response.delete_cookie(key="access_token", path="/")
    response.delete_cookie(key="refresh_token", path="/")
    return {"message": "Logged out successfully"}

@api_router.get("/auth/me")
async def get_me(request: Request):
    user = await get_current_user(request)
    return {
        "id": user["_id"],
        "email": user["email"],
        "name": user["name"],
        "role": user["role"],
        "shop_id": user.get("shop_id"),
        "status": user.get("status", "active")
    }

# ==================== SUPER ADMIN ENDPOINTS ====================

@api_router.get("/admin/stats")
async def get_admin_stats(request: Request):
    await require_super_admin(request)
    
    total_shops = await db.shops.count_documents({})
    active_shops = await db.shops.count_documents({"status": "active"})
    total_orders = await db.orders.count_documents({})
    total_users = await db.users.count_documents({"role": "shop_owner"})
    
    # Revenue calculation
    pipeline = [{"$group": {"_id": None, "total": {"$sum": "$total_amount"}}}]
    revenue_result = await db.orders.aggregate(pipeline).to_list(1)
    total_revenue = revenue_result[0]["total"] if revenue_result else 0
    
    return {
        "total_shops": total_shops,
        "active_shops": active_shops,
        "total_orders": total_orders,
        "total_shop_owners": total_users,
        "total_revenue": total_revenue
    }

@api_router.get("/admin/shops")
async def get_all_shops(request: Request, status: Optional[str] = None):
    await require_super_admin(request)
    
    query = {}
    if status:
        query["status"] = status
    
    shops = await db.shops.find(query).sort("created_at", -1).to_list(100)
    result = []
    for shop in shops:
        owner = await db.users.find_one({"shop_id": str(shop["_id"])}, {"_id": 0, "email": 1, "name": 1})
        order_count = await db.orders.count_documents({"shop_id": str(shop["_id"])})
        result.append({
            "id": str(shop["_id"]),
            "name": shop["name"],
            "slug": shop["slug"],
            "status": shop.get("status", "active"),
            "created_at": shop["created_at"].isoformat() if isinstance(shop["created_at"], datetime) else shop["created_at"],
            "owner": owner,
            "order_count": order_count
        })
    return result

@api_router.post("/admin/shops/{shop_id}/status")
async def update_shop_status(shop_id: str, status: str = Query(...), request: Request = None):
    await require_super_admin(request)
    
    if status not in ["active", "suspended"]:
        raise HTTPException(status_code=400, detail="Invalid status")
    
    result = await db.shops.update_one({"_id": ObjectId(shop_id)}, {"$set": {"status": status}})
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Shop not found")
    return {"message": f"Shop status updated to {status}"}

@api_router.get("/admin/users")
async def get_all_users(request: Request, role: Optional[str] = None):
    await require_super_admin(request)
    
    query = {}
    if role:
        query["role"] = role
    
    users = await db.users.find(query, {"password_hash": 0}).sort("created_at", -1).to_list(100)
    result = []
    for user in users:
        shop_name = None
        if user.get("shop_id"):
            shop = await db.shops.find_one({"_id": ObjectId(user["shop_id"])}, {"name": 1})
            shop_name = shop["name"] if shop else None
        result.append({
            "id": str(user["_id"]),
            "email": user["email"],
            "name": user["name"],
            "role": user["role"],
            "status": user.get("status", "active"),
            "shop_name": shop_name,
            "created_at": user["created_at"].isoformat() if isinstance(user["created_at"], datetime) else user["created_at"]
        })
    return result

@api_router.post("/admin/users")
async def create_shop_owner(data: ShopOwnerCreate, request: Request):
    await require_super_admin(request)
    
    email = data.email.lower()
    existing = await db.users.find_one({"email": email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Create shop first
    slug = generate_shop_slug(data.shop_name)
    existing_slug = await db.shops.find_one({"slug": slug})
    if existing_slug:
        slug = f"{slug}-{secrets.token_hex(3)}"
    
    shop_doc = {
        "name": data.shop_name,
        "slug": slug,
        "description": "",
        "logo_url": "",
        "contact_phone": "",
        "contact_email": email,
        "address": "",
        "social_facebook": "",
        "social_instagram": "",
        "status": "active",
        "created_at": datetime.now(timezone.utc)
    }
    shop_result = await db.shops.insert_one(shop_doc)
    shop_id = str(shop_result.inserted_id)
    
    # Create user
    hashed = hash_password(data.password)
    user_doc = {
        "email": email,
        "password_hash": hashed,
        "name": data.name,
        "role": "shop_owner",
        "shop_id": shop_id,
        "status": "active",
        "created_at": datetime.now(timezone.utc)
    }
    user_result = await db.users.insert_one(user_doc)
    
    return {
        "id": str(user_result.inserted_id),
        "email": email,
        "name": data.name,
        "shop_id": shop_id,
        "shop_name": data.shop_name
    }

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
    
    # Delete shop if shop owner
    if user.get("shop_id"):
        await db.shops.delete_one({"_id": ObjectId(user["shop_id"])})
        await db.products.delete_many({"shop_id": user["shop_id"]})
        await db.categories.delete_many({"shop_id": user["shop_id"]})
        await db.orders.delete_many({"shop_id": user["shop_id"]})
    
    await db.users.delete_one({"_id": ObjectId(user_id)})
    return {"message": "User deleted successfully"}

@api_router.post("/admin/users/{user_id}/reset-password")
async def admin_reset_password(user_id: str, request: Request):
    await require_super_admin(request)
    
    user = await db.users.find_one({"_id": ObjectId(user_id)})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Reset to default password
    default_password = "iLoveProID@"
    hashed = hash_password(default_password)
    await db.users.update_one({"_id": ObjectId(user_id)}, {"$set": {"password_hash": hashed}})
    return {"message": f"Password reset to default: {default_password}"}

# ==================== IMAGE UPLOAD ENDPOINT ====================

@api_router.post("/upload/image")
async def upload_image(file: UploadFile = File(...), request: Request = None):
    # Allow both authenticated and unauthenticated uploads for simplicity
    # In production, you'd want to require authentication
    
    # Validate file type
    allowed_types = ["image/jpeg", "image/png", "image/gif", "image/webp"]
    if file.content_type not in allowed_types:
        raise HTTPException(status_code=400, detail="Invalid file type. Allowed: JPEG, PNG, GIF, WebP")
    
    # Validate file size (max 5MB)
    data = await file.read()
    if len(data) > 5 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File too large. Max 5MB")
    
    # Generate unique path
    ext = file.filename.split(".")[-1] if "." in file.filename else "jpg"
    file_id = str(uuid_lib.uuid4())
    path = f"{APP_NAME}/products/{file_id}.{ext}"
    
    try:
        result = put_object(path, data, file.content_type or "image/jpeg")
        
        # Store reference in database
        file_doc = {
            "id": file_id,
            "storage_path": result["path"],
            "original_filename": file.filename,
            "content_type": file.content_type,
            "size": result.get("size", len(data)),
            "is_deleted": False,
            "created_at": datetime.now(timezone.utc)
        }
        await db.files.insert_one(file_doc)
        
        return {
            "id": file_id,
            "path": result["path"],
            "url": f"/api/files/{file_id}"
        }
    except Exception as e:
        logger.error(f"Upload failed: {e}")
        raise HTTPException(status_code=500, detail="Upload failed")

@api_router.get("/files/{file_id}")
async def get_file(file_id: str):
    file_doc = await db.files.find_one({"id": file_id, "is_deleted": False})
    if not file_doc:
        raise HTTPException(status_code=404, detail="File not found")
    
    try:
        data, content_type = get_object(file_doc["storage_path"])
        return Response(content=data, media_type=file_doc.get("content_type", content_type))
    except Exception as e:
        logger.error(f"Download failed: {e}")
        raise HTTPException(status_code=500, detail="Download failed")

# ==================== SHOP OWNER DASHBOARD ENDPOINTS ====================

@api_router.get("/dashboard/stats")
async def get_dashboard_stats(request: Request):
    user = await require_shop_owner(request)
    shop_id = user.get("shop_id")
    
    if not shop_id:
        raise HTTPException(status_code=400, detail="No shop associated with this account")
    
    total_products = await db.products.count_documents({"shop_id": shop_id})
    total_orders = await db.orders.count_documents({"shop_id": shop_id})
    pending_orders = await db.orders.count_documents({"shop_id": shop_id, "status": "pending"})
    
    pipeline = [
        {"$match": {"shop_id": shop_id}},
        {"$group": {"_id": None, "total": {"$sum": "$total_amount"}}}
    ]
    revenue_result = await db.orders.aggregate(pipeline).to_list(1)
    total_revenue = revenue_result[0]["total"] if revenue_result else 0
    
    return {
        "total_products": total_products,
        "total_orders": total_orders,
        "pending_orders": pending_orders,
        "total_revenue": total_revenue
    }

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
        "id": str(shop["_id"]),
        "name": shop["name"],
        "slug": shop["slug"],
        "description": shop.get("description", ""),
        "logo_url": shop.get("logo_url", ""),
        "contact_phone": shop.get("contact_phone", ""),
        "contact_email": shop.get("contact_email", ""),
        "address": shop.get("address", ""),
        "social_facebook": shop.get("social_facebook", ""),
        "social_instagram": shop.get("social_instagram", ""),
        "status": shop.get("status", "active")
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
    return {"message": "Shop updated successfully"}

# ==================== CATEGORY ENDPOINTS ====================

@api_router.get("/dashboard/categories")
async def get_shop_categories(request: Request):
    user = await require_shop_owner(request)
    shop_id = user.get("shop_id")
    
    categories = await db.categories.find({"shop_id": shop_id}, {"_id": 0}).to_list(50)
    return categories

@api_router.post("/dashboard/categories")
async def create_category(data: CategoryCreate, request: Request):
    user = await require_shop_owner(request)
    shop_id = user.get("shop_id")
    
    cat_id = f"cat-{secrets.token_hex(6)}"
    category_doc = {
        "id": cat_id,
        "shop_id": shop_id,
        "name": data.name,
        "description": data.description,
        "created_at": datetime.now(timezone.utc)
    }
    await db.categories.insert_one(category_doc)
    return {"id": cat_id, "name": data.name, "description": data.description}

@api_router.put("/dashboard/categories/{cat_id}")
async def update_category(cat_id: str, data: CategoryCreate, request: Request):
    user = await require_shop_owner(request)
    shop_id = user.get("shop_id")
    
    result = await db.categories.update_one(
        {"id": cat_id, "shop_id": shop_id},
        {"$set": {"name": data.name, "description": data.description}}
    )
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
    
    # Remove category from products
    await db.products.update_many({"shop_id": shop_id, "category_id": cat_id}, {"$set": {"category_id": None}})
    return {"message": "Category deleted"}

# ==================== PRODUCT MANAGEMENT ENDPOINTS ====================

@api_router.get("/dashboard/products")
async def get_shop_products(request: Request, category_id: Optional[str] = None):
    user = await require_shop_owner(request)
    shop_id = user.get("shop_id")
    
    query = {"shop_id": shop_id}
    if category_id:
        query["category_id"] = category_id
    
    products = await db.products.find(query, {"_id": 0}).sort("created_at", -1).to_list(100)
    return products

@api_router.post("/dashboard/products")
async def create_product(data: ProductCreate, request: Request):
    user = await require_shop_owner(request)
    shop_id = user.get("shop_id")
    
    prod_id = f"prod-{secrets.token_hex(6)}"
    product_doc = {
        "id": prod_id,
        "shop_id": shop_id,
        "name": data.name,
        "price": data.price,
        "category_id": data.category_id,
        "description": data.description,
        "image_url": data.image_url,
        "stock": data.stock,
        "is_active": True,
        "created_at": datetime.now(timezone.utc)
    }
    await db.products.insert_one(product_doc)
    return {k: v for k, v in product_doc.items() if k != "_id"}

@api_router.put("/dashboard/products/{prod_id}")
async def update_product(prod_id: str, data: ProductUpdate, request: Request):
    user = await require_shop_owner(request)
    shop_id = user.get("shop_id")
    
    update_data = {k: v for k, v in data.model_dump().items() if v is not None}
    if not update_data:
        raise HTTPException(status_code=400, detail="No data to update")
    
    result = await db.products.update_one(
        {"id": prod_id, "shop_id": shop_id},
        {"$set": update_data}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Product not found")
    return {"message": "Product updated"}

@api_router.delete("/dashboard/products/{prod_id}")
async def delete_product(prod_id: str, request: Request):
    user = await require_shop_owner(request)
    shop_id = user.get("shop_id")
    
    result = await db.products.delete_one({"id": prod_id, "shop_id": shop_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Product not found")
    return {"message": "Product deleted"}

# ==================== ORDER MANAGEMENT ENDPOINTS ====================

@api_router.get("/dashboard/orders")
async def get_shop_orders(request: Request, status: Optional[str] = None):
    user = await require_shop_owner(request)
    shop_id = user.get("shop_id")
    
    query = {"shop_id": shop_id}
    if status:
        query["status"] = status
    
    orders = await db.orders.find(query, {"_id": 0}).sort("created_at", -1).to_list(100)
    return orders

@api_router.put("/dashboard/orders/{order_id}/status")
async def update_order_status(order_id: str, data: OrderStatusUpdate, request: Request):
    user = await require_shop_owner(request)
    shop_id = user.get("shop_id")
    
    if data.status not in ["pending", "confirmed", "processing", "shipped", "completed", "cancelled"]:
        raise HTTPException(status_code=400, detail="Invalid status")
    
    result = await db.orders.update_one(
        {"id": order_id, "shop_id": shop_id},
        {"$set": {"status": data.status, "updated_at": datetime.now(timezone.utc)}}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Order not found")
    return {"message": f"Order status updated to {data.status}"}

# ==================== PUBLIC STOREFRONT ENDPOINTS ====================

@api_router.get("/shop/{slug}")
async def get_shop_by_slug(slug: str):
    shop = await db.shops.find_one({"slug": slug, "status": "active"})
    if not shop:
        raise HTTPException(status_code=404, detail="Shop not found")
    
    return {
        "id": str(shop["_id"]),
        "name": shop["name"],
        "slug": shop["slug"],
        "description": shop.get("description", ""),
        "logo_url": shop.get("logo_url", ""),
        "contact_phone": shop.get("contact_phone", ""),
        "contact_email": shop.get("contact_email", ""),
        "address": shop.get("address", ""),
        "social_facebook": shop.get("social_facebook", ""),
        "social_instagram": shop.get("social_instagram", "")
    }

@api_router.get("/shop/{slug}/products")
async def get_shop_products_public(slug: str, category: Optional[str] = None, search: Optional[str] = None):
    shop = await db.shops.find_one({"slug": slug, "status": "active"})
    if not shop:
        raise HTTPException(status_code=404, detail="Shop not found")
    
    shop_id = str(shop["_id"])
    query = {"shop_id": shop_id, "is_active": True}
    
    if category and category != "All Categories":
        query["category_id"] = category
    if search:
        query["name"] = {"$regex": search, "$options": "i"}
    
    products = await db.products.find(query, {"_id": 0}).to_list(100)
    return products

@api_router.get("/shop/{slug}/categories")
async def get_shop_categories_public(slug: str):
    shop = await db.shops.find_one({"slug": slug, "status": "active"})
    if not shop:
        raise HTTPException(status_code=404, detail="Shop not found")
    
    shop_id = str(shop["_id"])
    categories = await db.categories.find({"shop_id": shop_id}, {"_id": 0, "id": 1, "name": 1}).to_list(50)
    return [{"id": "all", "name": "All Categories"}] + categories

@api_router.post("/shop/{slug}/orders")
async def create_order(slug: str, data: OrderCreate):
    shop = await db.shops.find_one({"slug": slug, "status": "active"})
    if not shop:
        raise HTTPException(status_code=404, detail="Shop not found")
    
    shop_id = str(shop["_id"])
    
    # Calculate total
    total_amount = 0
    order_items = []
    for item in data.items:
        product = await db.products.find_one({"id": item["product_id"], "shop_id": shop_id})
        if product:
            subtotal = product["price"] * item["quantity"]
            total_amount += subtotal
            order_items.append({
                "product_id": item["product_id"],
                "name": product["name"],
                "price": product["price"],
                "quantity": item["quantity"],
                "subtotal": subtotal
            })
    
    order_id = f"ORD-{secrets.token_hex(6).upper()}"
    order_doc = {
        "id": order_id,
        "shop_id": shop_id,
        "customer_name": data.customer_name,
        "customer_phone": data.customer_phone,
        "customer_email": data.customer_email,
        "customer_address": data.customer_address,
        "items": order_items,
        "total_amount": total_amount,
        "note": data.note,
        "status": "pending",
        "created_at": datetime.now(timezone.utc)
    }
    await db.orders.insert_one(order_doc)
    
    return {"order_id": order_id, "total_amount": total_amount, "message": "Order placed successfully"}

# ==================== LEGACY ENDPOINTS (for existing storefront) ====================

@api_router.get("/products")
async def get_products(category: Optional[str] = None, search: Optional[str] = None):
    # Get products from the default demo shop or all active products
    query = {"is_active": {"$ne": False}}
    if category and category != "All Categories":
        query["category"] = category
    if search:
        query["name"] = {"$regex": search, "$options": "i"}
    
    products = await db.products.find(query, {"_id": 0}).to_list(100)
    return products

@api_router.get("/products/{product_id}")
async def get_product(product_id: str):
    product = await db.products.find_one({"id": product_id}, {"_id": 0})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product

@api_router.get("/categories")
async def get_categories():
    categories = await db.products.distinct("category")
    categories = [c for c in categories if c]
    return ["All Categories"] + categories

# ==================== ROOT ENDPOINT ====================

@api_router.get("/")
async def root():
    return {"message": "The Wi Shop API - Multi-tenant E-commerce Platform"}

# Include the router in the main app
app.include_router(api_router)

# CORS Configuration
frontend_url = os.environ.get('FRONTEND_URL', 'http://localhost:3000')
cors_origins = os.environ.get('CORS_ORIGINS', '*').split(',')

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=cors_origins if cors_origins != ['*'] else ["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ==================== STARTUP EVENTS ====================

@app.on_event("startup")
async def startup_event():
    # Create indexes
    await db.users.create_index("email", unique=True)
    await db.shops.create_index("slug", unique=True)
    await db.products.create_index([("shop_id", 1), ("id", 1)])
    await db.orders.create_index([("shop_id", 1), ("created_at", -1)])
    await db.categories.create_index([("shop_id", 1), ("id", 1)])
    
    # Seed Super Admin
    admin_email = os.environ.get("ADMIN_EMAIL", "admin@thewishop.com")
    admin_password = os.environ.get("ADMIN_PASSWORD", "admin123")
    
    existing_admin = await db.users.find_one({"email": admin_email})
    if not existing_admin:
        hashed = hash_password(admin_password)
        await db.users.insert_one({
            "email": admin_email,
            "password_hash": hashed,
            "name": "Super Admin",
            "role": "super_admin",
            "status": "active",
            "created_at": datetime.now(timezone.utc)
        })
        logger.info("Seeded super admin user")
    elif existing_admin.get("role") != "super_admin":
        await db.users.update_one({"email": admin_email}, {"$set": {"role": "super_admin"}})
    
    # Seed demo shop owner
    demo_email = "demo@thewishop.com"
    existing_demo = await db.users.find_one({"email": demo_email})
    if not existing_demo:
        # Create demo shop
        demo_shop = await db.shops.find_one({"slug": "the-elite-shop"})
        if not demo_shop:
            shop_doc = {
                "name": "The Elite Shop",
                "slug": "the-elite-shop",
                "description": "Premium products for modern lifestyle",
                "logo_url": "",
                "contact_phone": "+84 123 456 789",
                "contact_email": demo_email,
                "address": "123 Đường ABC, Quận 1, TP.HCM",
                "social_facebook": "https://facebook.com/theeliteshop",
                "social_instagram": "https://instagram.com/theeliteshop",
                "status": "active",
                "created_at": datetime.now(timezone.utc)
            }
            shop_result = await db.shops.insert_one(shop_doc)
            demo_shop_id = str(shop_result.inserted_id)
        else:
            demo_shop_id = str(demo_shop["_id"])
        
        # Create demo shop owner
        hashed = hash_password("demo123")
        await db.users.insert_one({
            "email": demo_email,
            "password_hash": hashed,
            "name": "Demo Shop Owner",
            "role": "shop_owner",
            "shop_id": demo_shop_id,
            "status": "active",
            "created_at": datetime.now(timezone.utc)
        })
        logger.info("Seeded demo shop owner")
        
        # Seed demo products for this shop
        demo_products = [
            {"id": "prod-001", "shop_id": demo_shop_id, "name": "Sony Wireless Headphones", "price": 2490000, "category_id": None, "category": "Electronics", "description": "Premium wireless headphones with noise cancellation.", "image_url": "https://images.unsplash.com/photo-1722891067479-5fd39edbfc3d?w=500", "stock": 50, "is_active": True, "created_at": datetime.now(timezone.utc)},
            {"id": "prod-002", "shop_id": demo_shop_id, "name": "Black Studio Headphones", "price": 1850000, "category_id": None, "category": "Electronics", "description": "Professional studio headphones.", "image_url": "https://images.unsplash.com/photo-1600086827875-a63b01f1335c?w=500", "stock": 30, "is_active": True, "created_at": datetime.now(timezone.utc)},
            {"id": "prod-003", "shop_id": demo_shop_id, "name": "Grey Casual Sneakers", "price": 1200000, "category_id": None, "category": "Fashion", "description": "Comfortable everyday sneakers.", "image_url": "https://images.pexels.com/photos/5526492/pexels-photo-5526492.jpeg?auto=compress&w=500", "stock": 100, "is_active": True, "created_at": datetime.now(timezone.utc)},
            {"id": "prod-004", "shop_id": demo_shop_id, "name": "Minimalist Smartphone", "price": 14500000, "category_id": None, "category": "Electronics", "description": "Latest flagship smartphone.", "image_url": "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=500", "stock": 25, "is_active": True, "created_at": datetime.now(timezone.utc)},
            {"id": "prod-005", "shop_id": demo_shop_id, "name": "Minimalist Succulent Pot", "price": 320000, "category_id": None, "category": "Home & Garden", "description": "Beautiful ceramic pot.", "image_url": "https://images.unsplash.com/photo-1485955900006-10f4d324d411?w=500", "stock": 200, "is_active": True, "created_at": datetime.now(timezone.utc)},
            {"id": "prod-006", "shop_id": demo_shop_id, "name": "Premium Espresso Set", "price": 1200000, "category_id": None, "category": "Kitchen", "description": "Complete espresso set.", "image_url": "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=500", "stock": 40, "is_active": True, "created_at": datetime.now(timezone.utc)},
        ]
        
        existing_products = await db.products.count_documents({"shop_id": demo_shop_id})
        if existing_products == 0:
            await db.products.insert_many(demo_products)
            logger.info("Seeded demo products")
    
    # Write test credentials
    memory_dir = Path("/app/memory")
    memory_dir.mkdir(exist_ok=True)
    with open(memory_dir / "test_credentials.md", "w") as f:
        f.write("# Test Credentials\n\n")
        f.write("## Super Admin\n")
        f.write(f"- Email: {admin_email}\n")
        f.write(f"- Password: {admin_password}\n")
        f.write("- Role: super_admin\n\n")
        f.write("## Demo Shop Owner\n")
        f.write("- Email: demo@thewishop.com\n")
        f.write("- Password: demo123\n")
        f.write("- Role: shop_owner\n")
        f.write("- Shop: The Elite Shop\n")

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
