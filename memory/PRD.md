# E-commerce Platform PRD

## Original Problem Statement
Create a desktop UI for a Micro-SaaS E-commerce Platform with multi-tenant setup including Super-Admin, Shop Owner, and public Storefront views. The UI should support Vietnamese language. Full working app with FastAPI backend and MongoDB database.

## Architecture
- **Frontend:** React + Tailwind CSS + Shadcn UI
- **Backend:** FastAPI (Python) on port 8001
- **Database:** MongoDB (localhost:27017, DB: test_database)
- **Auth:** JWT tokens in httpOnly cookies, bcrypt password hashing
- **Storage:** Emergent Object Storage for file uploads
- **i18n:** Custom Vietnamese/English localization via LanguageContext

## Core Features — Completed

### Authentication (DONE)
- JWT-based auth with httpOnly cookie sessions
- Roles: super_admin, shop_owner, customer
- Login, register, logout, session check (/auth/me)
- Cookie-based credentials with withCredentials: true

### Super Admin Dashboard (DONE)
- Overview stats (shops, owners, orders, revenue)
- Shop management (activate/suspend, set expiry date)
- User management (create owner, block/unblock, reset password, delete)
- Mobile-responsive sidebar

### Shop Owner Dashboard (DONE)
- Overview stats, recent orders
- Product CRUD with multi-image upload, video URL, position field
- Category CRUD with position reordering (up/down arrows)
- Order management with status updates (pending → confirmed → processing → shipped → completed)
- Shop settings (profile, theme color, preview link)
- Clickable order titles open detail modal

### Product Image Gallery & Video (DONE)
- Products support multiple images (images[] array) with thumbnail gallery in modals
- Products support video URL (YouTube embed) with play button thumbnail
- All product modals (Storefront, Homepage, Dashboard) support gallery + video

### Public Storefront (DONE)
- Per-shop storefronts at /shop/{slug}
- Category-grouped product display sorted by position
- 6-column desktop / 2-column mobile grids
- Local cart with checkout flow
- Thank You page with order confirmation
- Search, category filtering, price bracket filters

### Homepage (DONE)
- Category-grouped product display with position sorting
- Category dropdown, price filters, search
- Floating action buttons

### Vietnamese i18n (DONE)
- Full Vietnamese translations across ALL components
- Language switcher (globe icon) toggles VI/EN

### In-App Notifications (DONE)
- Toast popup on new order
- Notification bell with unread badge

### Checkout & Orders (DONE)
- Full checkout form with order placement to real backend
- Orders stored in MongoDB, visible in dashboard
- Thank you page with order ID and item details

## DB Schema (MongoDB)
- **users:** email, password_hash, name, role, shop_id, status, created_at
- **shops:** name, slug, description, theme_color, custom_domain, status, expiry_date, contact_*, social_*, created_at
- **products:** id, shop_id, name, price, image_url, images[], video_url, category, category_id, stock, position, is_active, description, created_at
- **categories:** id, shop_id, name, description, position, created_at
- **orders:** id, shop_id, customer_name, customer_phone, customer_email, customer_address, items[], total_amount, note, status, created_at

## Key API Endpoints
- Auth: POST /api/auth/login, /api/auth/register, /api/auth/logout, GET /api/auth/me
- Admin: GET /api/admin/stats, /api/admin/shops, /api/admin/users, POST /api/admin/users, /api/admin/shops/{id}/status, /api/admin/shops/{id}/expiry, /api/admin/users/{id}/block, /api/admin/users/{id}/reset-password
- Dashboard: GET /api/dashboard/stats, /api/dashboard/shop, /api/dashboard/products, /api/dashboard/categories, /api/dashboard/orders
- Dashboard CRUD: POST/PUT/DELETE /api/dashboard/products/{id}, /api/dashboard/categories/{id}, PUT /api/dashboard/categories/positions
- Dashboard Orders: PUT /api/dashboard/orders/{id}/status
- Public: GET /api/products, /api/categories, /api/shop/{slug}, /api/shop/{slug}/products, /api/shop/{slug}/categories
- Orders: POST /api/shop/{slug}/orders
- Upload: POST /api/upload/image, GET /api/files/{id}

## Seed Data
- Super Admin: admin@thewishop.com / admin123
- Demo Shop Owner: demo@thewishop.com / demo123
- Shop: The Elite Shop (slug: the-elite-shop)
- 4 Categories: Electronics, Fashion, Home & Garden, Kitchen
- 12 Products with images, descriptions, positions
- 3 Sample Orders

## Backlog
- P2: Sales analytics charts in dashboards
- Refactoring: Split large components (ShopOwnerDashboard ~970 lines)
- Minor: Add VisuallyHidden DialogTitle for accessibility
