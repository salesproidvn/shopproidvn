# PRD: Micro-SaaS E-commerce Platform (The Wi Shop / Ocean Pro Web)

## Problem Statement
Multi-tenant e-commerce platform with Super Admin, Shop Owner, and public Storefront views. Originally built as a standalone mocked frontend, now migrated to a full-stack production app with FastAPI backend, MongoDB database, and Cloudflare R2 for images.

## User Personas
- **Super Admin** (daominhhai129@gmail.com): Manages all shops, users, maintenance
- **Shop Owners**: Manage their own shop's products, categories, orders, posts, pages, menus
- **Public Customers**: Browse storefronts, view products, place orders

## Architecture
- **Frontend**: React + Tailwind CSS + Shadcn UI, served on port 3000
- **Backend**: FastAPI (Python), served on port 8001, proxied via /api prefix
- **Database**: MongoDB Atlas (proidshopvn)
- **Storage**: Cloudflare R2 via boto3 for image uploads
- **Auth**: JWT Bearer tokens via localStorage
- **Notifications**: PyWebPush (VAPID) + Resend (emails)

## Core Features (Implemented)
- [x] JWT Authentication (login, register, logout, /auth/me)
- [x] Password Reset Flow (forgot-password -> token -> reset-password)
- [x] Change Password (super admin can change own password via Settings tab)
- [x] Super Admin Dashboard (stats, shops, users, maintenance, settings)
- [x] Shop Owner Dashboard (products, categories, orders, posts, pages, menu, mega-menu, banners, footer, layout, theme)
- [x] Public Storefront (shop info, products, categories, posts, custom pages, contact form, order placement)
- [x] Image Upload with auto-compression to <=300KB via Pillow
- [x] Cloudflare R2 Storage via boto3 (S3-compatible)
- [x] Database Seeding (3 shops)
- [x] PWA Support (manifest.json, service worker, installable)
- [x] Push Notifications for new orders (pywebpush/VAPID)
- [x] Email Notifications for new orders via Resend
- [x] Mobile Mega Menu (full-screen overlay)
- [x] Expanded theme color picker (24 options + custom hex)
- [x] Product SKU in grids, inline category creation, category image upload
- [x] Product description text overflow fix (break-words, overflow-hidden for HTML content with &nbsp;)
- [x] Product description rich text rendering (installed @tailwindcss/typography for prose classes - bold, lists, links)

## Upcoming Tasks
- [ ] P1: Add sales analytics charts to dashboards

## Future/Backlog Tasks
- [ ] P1: Refactor ShopOwnerDashboard.js (2400+ lines) into smaller components
- [ ] P1: Refactor StorefrontPage.js (1100+ lines) into smaller components

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
- POST /api/admin/shops/{shop_id}/status
- POST /api/admin/shops/{shop_id}/expiry
- PUT /api/admin/shops/{shop_id}/limits

### Dashboard (Shop Owner)
- GET /api/dashboard/shop
- PUT /api/dashboard/shop
- CRUD for products, categories, orders, posts, pages, menu, banners, footer, etc.

### Public Storefront
- GET /api/shop/{slug}
- GET /api/shop/{slug}/products
- GET /api/shop/{slug}/categories
- GET /api/shop/{slug}/posts
- GET /api/shop/{slug}/page/{page_slug}
- POST /api/shop/{slug}/orders
- POST /api/shop/{slug}/contact

### Upload
- POST /api/upload (R2 image upload with compression)

## Key Files
- `/app/backend/server.py` - Core backend
- `/app/frontend/src/pages/StorefrontPage.js` - Public storefront
- `/app/frontend/src/pages/ShopOwnerDashboard.js` - Shop owner dashboard
- `/app/frontend/src/pages/SuperAdminDashboard.js` - Super admin
- `/app/frontend/src/pages/LoginPage.js` - Login page
