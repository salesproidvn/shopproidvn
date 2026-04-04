from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI, APIRouter, HTTPException, Request, Response, Depends
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from bson import ObjectId
import os
import logging
import bcrypt
import jwt
import secrets
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta

ROOT_DIR = Path(__file__).parent

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# JWT Configuration
JWT_SECRET = os.environ.get('JWT_SECRET', secrets.token_hex(32))
JWT_ALGORITHM = "HS256"

# Create the main app
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# ==================== UTILITY FUNCTIONS ====================

def hash_password(password: str) -> str:
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password.encode("utf-8"), salt)
    return hashed.decode("utf-8")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return bcrypt.checkpw(plain_password.encode("utf-8"), hashed_password.encode("utf-8"))

def create_access_token(user_id: str, email: str) -> str:
    payload = {
        "sub": user_id,
        "email": email,
        "exp": datetime.now(timezone.utc) + timedelta(minutes=60),
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
        user["_id"] = str(user["_id"])
        user.pop("password_hash", None)
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

async def get_optional_user(request: Request) -> Optional[dict]:
    try:
        return await get_current_user(request)
    except HTTPException:
        return None

# ==================== PYDANTIC MODELS ====================

class UserRegister(BaseModel):
    email: EmailStr
    password: str
    name: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: str
    email: str
    name: str
    role: str

class ProductCreate(BaseModel):
    name: str
    price: int
    category: str
    description: Optional[str] = ""
    image_url: str

class ProductResponse(BaseModel):
    id: str
    name: str
    price: int
    category: str
    description: str
    image_url: str

class CartItem(BaseModel):
    product_id: str
    quantity: int

class CartItemResponse(BaseModel):
    product_id: str
    name: str
    price: int
    image_url: str
    quantity: int

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
        "role": "user",
        "created_at": datetime.now(timezone.utc),
        "wishlist": [],
        "cart": []
    }
    result = await db.users.insert_one(user_doc)
    user_id = str(result.inserted_id)
    
    access_token = create_access_token(user_id, email)
    refresh_token = create_refresh_token(user_id)
    
    response.set_cookie(key="access_token", value=access_token, httponly=True, secure=False, samesite="lax", max_age=3600, path="/")
    response.set_cookie(key="refresh_token", value=refresh_token, httponly=True, secure=False, samesite="lax", max_age=604800, path="/")
    
    return {"id": user_id, "email": email, "name": user_data.name, "role": "user"}

@api_router.post("/auth/login")
async def login(user_data: UserLogin, response: Response):
    email = user_data.email.lower()
    user = await db.users.find_one({"email": email})
    if not user:
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    if not verify_password(user_data.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    user_id = str(user["_id"])
    access_token = create_access_token(user_id, email)
    refresh_token = create_refresh_token(user_id)
    
    response.set_cookie(key="access_token", value=access_token, httponly=True, secure=False, samesite="lax", max_age=3600, path="/")
    response.set_cookie(key="refresh_token", value=refresh_token, httponly=True, secure=False, samesite="lax", max_age=604800, path="/")
    
    return {"id": user_id, "email": user["email"], "name": user["name"], "role": user["role"]}

@api_router.post("/auth/logout")
async def logout(response: Response):
    response.delete_cookie(key="access_token", path="/")
    response.delete_cookie(key="refresh_token", path="/")
    return {"message": "Logged out successfully"}

@api_router.get("/auth/me")
async def get_me(request: Request):
    user = await get_current_user(request)
    return {"id": user["_id"], "email": user["email"], "name": user["name"], "role": user["role"]}

# ==================== PRODUCT ENDPOINTS ====================

@api_router.get("/products")
async def get_products(category: Optional[str] = None, search: Optional[str] = None):
    query = {}
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
    return ["All Categories"] + categories

# ==================== CART ENDPOINTS ====================

@api_router.get("/cart")
async def get_cart(request: Request):
    user = await get_current_user(request)
    user_doc = await db.users.find_one({"_id": ObjectId(user["_id"])})
    cart = user_doc.get("cart", [])
    
    # Fetch product details for cart items
    cart_items = []
    for item in cart:
        product = await db.products.find_one({"id": item["product_id"]}, {"_id": 0})
        if product:
            cart_items.append({
                "product_id": item["product_id"],
                "name": product["name"],
                "price": product["price"],
                "image_url": product["image_url"],
                "quantity": item["quantity"]
            })
    return cart_items

@api_router.post("/cart/add")
async def add_to_cart(item: CartItem, request: Request):
    user = await get_current_user(request)
    user_id = ObjectId(user["_id"])
    
    # Check if product exists
    product = await db.products.find_one({"id": item.product_id})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    # Check if already in cart
    user_doc = await db.users.find_one({"_id": user_id})
    cart = user_doc.get("cart", [])
    
    found = False
    for cart_item in cart:
        if cart_item["product_id"] == item.product_id:
            cart_item["quantity"] += item.quantity
            found = True
            break
    
    if not found:
        cart.append({"product_id": item.product_id, "quantity": item.quantity})
    
    await db.users.update_one({"_id": user_id}, {"$set": {"cart": cart}})
    return {"message": "Added to cart"}

@api_router.post("/cart/update")
async def update_cart_item(item: CartItem, request: Request):
    user = await get_current_user(request)
    user_id = ObjectId(user["_id"])
    
    user_doc = await db.users.find_one({"_id": user_id})
    cart = user_doc.get("cart", [])
    
    if item.quantity <= 0:
        cart = [c for c in cart if c["product_id"] != item.product_id]
    else:
        for cart_item in cart:
            if cart_item["product_id"] == item.product_id:
                cart_item["quantity"] = item.quantity
                break
    
    await db.users.update_one({"_id": user_id}, {"$set": {"cart": cart}})
    return {"message": "Cart updated"}

@api_router.delete("/cart/{product_id}")
async def remove_from_cart(product_id: str, request: Request):
    user = await get_current_user(request)
    user_id = ObjectId(user["_id"])
    
    await db.users.update_one(
        {"_id": user_id},
        {"$pull": {"cart": {"product_id": product_id}}}
    )
    return {"message": "Removed from cart"}

@api_router.delete("/cart")
async def clear_cart(request: Request):
    user = await get_current_user(request)
    user_id = ObjectId(user["_id"])
    await db.users.update_one({"_id": user_id}, {"$set": {"cart": []}})
    return {"message": "Cart cleared"}

# ==================== WISHLIST ENDPOINTS ====================

@api_router.get("/wishlist")
async def get_wishlist(request: Request):
    user = await get_current_user(request)
    user_doc = await db.users.find_one({"_id": ObjectId(user["_id"])})
    wishlist = user_doc.get("wishlist", [])
    
    # Fetch product details
    products = []
    for product_id in wishlist:
        product = await db.products.find_one({"id": product_id}, {"_id": 0})
        if product:
            products.append(product)
    return products

@api_router.post("/wishlist/toggle/{product_id}")
async def toggle_wishlist(product_id: str, request: Request):
    user = await get_current_user(request)
    user_id = ObjectId(user["_id"])
    
    user_doc = await db.users.find_one({"_id": user_id})
    wishlist = user_doc.get("wishlist", [])
    
    if product_id in wishlist:
        wishlist.remove(product_id)
        message = "Removed from wishlist"
    else:
        wishlist.append(product_id)
        message = "Added to wishlist"
    
    await db.users.update_one({"_id": user_id}, {"$set": {"wishlist": wishlist}})
    return {"message": message, "in_wishlist": product_id in wishlist}

@api_router.get("/wishlist/check/{product_id}")
async def check_wishlist(product_id: str, request: Request):
    try:
        user = await get_current_user(request)
        user_doc = await db.users.find_one({"_id": ObjectId(user["_id"])})
        wishlist = user_doc.get("wishlist", [])
        return {"in_wishlist": product_id in wishlist}
    except HTTPException:
        return {"in_wishlist": False}

# ==================== ROOT ENDPOINT ====================

@api_router.get("/")
async def root():
    return {"message": "The Wi Shop API"}

# Include the router in the main app
app.include_router(api_router)

# CORS Configuration
frontend_url = os.environ.get('FRONTEND_URL', 'http://localhost:3000')
cors_origins = os.environ.get('CORS_ORIGINS', '*').split(',')
if frontend_url not in cors_origins and cors_origins != ['*']:
    cors_origins.append(frontend_url)

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
    
    # Seed products if empty
    product_count = await db.products.count_documents({})
    if product_count == 0:
        initial_products = [
            {
                "id": "prod-001",
                "name": "Sony Wireless Headphones",
                "price": 2490000,
                "category": "Electronics",
                "description": "Premium wireless headphones with noise cancellation and 30-hour battery life.",
                "image_url": "https://images.unsplash.com/photo-1722891067479-5fd39edbfc3d?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA1NDh8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjBtaW5pbWFsaXN0JTIwaGVhZHBob25lcyUyMGlzb2xhdGVkfGVufDB8fHx8MTc3NTMyMTk0MHww&ixlib=rb-4.1.0&q=85"
            },
            {
                "id": "prod-002",
                "name": "Black Studio Headphones",
                "price": 1850000,
                "category": "Electronics",
                "description": "Professional studio headphones for music production and mixing.",
                "image_url": "https://images.unsplash.com/photo-1600086827875-a63b01f1335c?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA1NDh8MHwxfHNlYXJjaHwzfHxtb2Rlcm4lMjBtaW5pbWFsaXN0JTIwaGVhZHBob25lcyUyMGlzb2xhdGVkfGVufDB8fHx8MTc3NTMyMTk0MHww&ixlib=rb-4.1.0&q=85"
            },
            {
                "id": "prod-003",
                "name": "Grey Casual Sneakers",
                "price": 1200000,
                "category": "Fashion",
                "description": "Comfortable everyday sneakers with premium cushioning.",
                "image_url": "https://images.pexels.com/photos/5526492/pexels-photo-5526492.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940"
            },
            {
                "id": "prod-004",
                "name": "Minimalist Smartphone",
                "price": 14500000,
                "category": "Electronics",
                "description": "Latest flagship smartphone with stunning display and camera.",
                "image_url": "https://images.unsplash.com/photo-1759588071782-b2091e07d737?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2OTV8MHwxfHNlYXJjaHwzfHxtb2Rlcm4lMjBtaW5pbWFsaXN0JTIwaGVhZHBob25lcyUyMGlzb2xhdGVkfGVufDB8fHx8MTc3NTMyMTk0MHww&ixlib=rb-4.1.0&q=85"
            },
            {
                "id": "prod-005",
                "name": "Minimalist Succulent Pot",
                "price": 320000,
                "category": "Home & Garden",
                "description": "Beautiful ceramic pot perfect for succulents and small plants.",
                "image_url": "https://images.unsplash.com/photo-1485955900006-10f4d324d411?w=500"
            },
            {
                "id": "prod-006",
                "name": "Handwoven Rattan Baskets",
                "price": 450000,
                "category": "Home & Garden",
                "description": "Artisan handwoven baskets for storage and decoration.",
                "image_url": "https://images.unsplash.com/photo-1595515106969-1ce29566ff1c?w=500"
            },
            {
                "id": "prod-007",
                "name": "Premium Espresso Set",
                "price": 1200000,
                "category": "Kitchen",
                "description": "Complete espresso set with cups, saucers, and accessories.",
                "image_url": "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=500"
            },
            {
                "id": "prod-008",
                "name": "Wireless Earbuds Pro",
                "price": 3500000,
                "category": "Electronics",
                "description": "True wireless earbuds with active noise cancellation.",
                "image_url": "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=500"
            },
            {
                "id": "prod-009",
                "name": "Designer Watch",
                "price": 5500000,
                "category": "Fashion",
                "description": "Elegant minimalist watch with leather strap.",
                "image_url": "https://images.unsplash.com/photo-1524592094714-0f0654e20314?w=500"
            },
            {
                "id": "prod-010",
                "name": "Smart Home Speaker",
                "price": 2800000,
                "category": "Electronics",
                "description": "Voice-controlled smart speaker with premium sound.",
                "image_url": "https://images.unsplash.com/photo-1543512214-318c7553f230?w=500"
            },
            {
                "id": "prod-011",
                "name": "Leather Laptop Bag",
                "price": 1650000,
                "category": "Fashion",
                "description": "Premium leather bag fits laptops up to 15 inches.",
                "image_url": "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=500"
            },
            {
                "id": "prod-012",
                "name": "Ceramic Tea Set",
                "price": 890000,
                "category": "Kitchen",
                "description": "Japanese-style ceramic tea set with teapot and 4 cups.",
                "image_url": "https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=500"
            }
        ]
        await db.products.insert_many(initial_products)
        logger.info("Seeded initial products")
    
    # Seed admin user
    admin_email = os.environ.get("ADMIN_EMAIL", "admin@thewishop.com")
    admin_password = os.environ.get("ADMIN_PASSWORD", "admin123")
    existing_admin = await db.users.find_one({"email": admin_email})
    if not existing_admin:
        hashed = hash_password(admin_password)
        await db.users.insert_one({
            "email": admin_email,
            "password_hash": hashed,
            "name": "Admin",
            "role": "admin",
            "created_at": datetime.now(timezone.utc),
            "wishlist": [],
            "cart": []
        })
        logger.info("Seeded admin user")
    
    # Write test credentials
    memory_dir = Path("/app/memory")
    memory_dir.mkdir(exist_ok=True)
    with open(memory_dir / "test_credentials.md", "w") as f:
        f.write("# Test Credentials\n\n")
        f.write("## Admin Account\n")
        f.write(f"- Email: {admin_email}\n")
        f.write(f"- Password: {admin_password}\n")
        f.write("- Role: admin\n\n")
        f.write("## Auth Endpoints\n")
        f.write("- POST /api/auth/register\n")
        f.write("- POST /api/auth/login\n")
        f.write("- POST /api/auth/logout\n")
        f.write("- GET /api/auth/me\n")

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
