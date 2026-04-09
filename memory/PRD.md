# PRD: Micro-SaaS E-commerce Platform (The Wi Shop / Ocean Pro Web)

## Problem Statement
Multi-tenant e-commerce platform with Super Admin, Shop Owner, and public Storefront views. Originally built as a standalone mocked frontend, now migrated to a full-stack production app with FastAPI backend, MongoDB database, and Emergent Object Storage for images.

## User Personas
- **Super Admin** (daominhhai129@gmail.com): Manages all shops, users, maintenance
- **Shop Owners**: Manage their own shop's products, categories, orders, posts, pages, menus
- **Public Customers**: Browse storefronts, view products, place orders

## Architecture
- **Frontend**: React + Tailwind CSS + Shadcn UI, served on port 3000
- **Backend**: FastAPI (Python), served on port 8001, proxied via /api prefix
- **Database**: MongoDB Atlas (proidshopvn)
- **Storage**: Emergent Object Storage for image uploads
- **Auth**: JWT Bearer tokens via localStorage

## Core Features (Implemented)
- [x] JWT Authentication (login, register, logout, /auth/me)
- [x] Password Reset Flow (forgot-password -> token -> reset-password)
- [x] Change Password (super admin can change own password via Settings tab)
- [x] Super Admin Dashboard (stats, shops, users, maintenance, settings)
- [x] Shop Owner Dashboard (products, categories, orders, posts, pages, menu, mega-menu, banners, footer, layout, theme)
- [x] Public Storefront (shop info, products, categories, posts, custom pages, contact form, order placement)
- [x] Image Upload with auto-compression to ≤300KB via Pillow (resize + quality reduction)
- [x] Cloudflare R2 Storage via boto3 (S3-compatible) for all image uploads
- [x] Database Seeding (3 shops: The Elite Shop, Green Living, Cho Xanh 365)
- [x] Login page without hardcoded credentials
- [x] "Forgot Password" link on login page
- [x] Super Admin can view any shop's dashboard via ?shop_id= query parameter
- [x] Super Admin can change own password via Settings tab
- [x] Shop limits management (max_products, max_posts)
- [x] Server maintenance module (cleanup old orders, orphaned images)
- [x] PWA Support (manifest.json, service worker, installable to home screen)
- [x] Push Notifications for new orders (shop owner opt-in via Settings toggle)
- [x] Email Notifications for new orders via Resend (shop owner opt-in, sends order details to shop contact email)
- [x] PWA Install prompt + manual install instructions (Android/Chrome, iPhone/Safari)

## API Endpoints
### Auth
- POST /api/auth/login
- POST /api/auth/register
- POST /api/auth/logout
- GET /api/auth/me
- POST /api/auth/forgot-password
- POST /api/auth/reset-password

### Super Admin
- GET /api/admin/stats
- GET /api/admin/shops
- GET /api/admin/users
- POST /api/admin/users (create shop owner)
- POST /api/admin/users/{id}/block
- DELETE /api/admin/users/{id}
- POST /api/admin/users/{id}/reset-password
- POST /api/admin/shops/{id}/status
- POST /api/admin/shops/{id}/expiry
- PUT /api/admin/shops/{id}/limits
- GET /api/admin/maintenance/preview
- POST /api/admin/maintenance/cleanup-orders
- POST /api/admin/maintenance/cleanup-images

### Shop Owner Dashboard
- GET/PUT /api/dashboard/shop
- GET /api/dashboard/stats
- GET/POST /api/dashboard/products
- PUT/DELETE /api/dashboard/products/{id}
- GET/POST /api/dashboard/categories
- PUT/DELETE /api/dashboard/categories/{id}
- PUT /api/dashboard/categories/positions
- GET /api/dashboard/orders
- PUT /api/dashboard/orders/{id}/status
- GET/POST /api/dashboard/posts
- PUT/DELETE /api/dashboard/posts/{id}
- GET/POST /api/dashboard/pages
- PUT/DELETE /api/dashboard/pages/{id}
- GET/PUT /api/dashboard/menu
- GET/PUT /api/dashboard/mega-menu

### Public Storefront
- GET /api/shop/{slug}
- GET /api/shop/{slug}/products
- GET /api/shop/{slug}/categories
- GET /api/shop/{slug}/posts
- GET /api/shop/{slug}/page/{page_slug}
- POST /api/shop/{slug}/orders
- POST /api/shop/{slug}/contact

### Other
- POST /api/upload/image
- GET /api/files/{id}
- GET /api/products
- GET /api/categories

## Backlog
- P1: Sales analytics charts for dashboards
- P1: Refactor ShopOwnerDashboard.js (~2200 lines) into smaller components
- P1: Refactor StorefrontPage.js (~1000 lines) into smaller components
