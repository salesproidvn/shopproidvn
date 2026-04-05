# E-commerce Platform PRD

## Original Problem Statement
Create a desktop UI for a Micro-SaaS E-commerce Platform with multi-tenant setup including Super-Admin, Shop Owner, and public Storefront views. The UI should support Vietnamese language.

## Architecture
- **Frontend:** React + Tailwind CSS + Shadcn UI (fully standalone — no backend needed)
- **Mock Layer:** Axios interceptor (`mockAdapter.js`) intercepts all API calls and returns data from `mockData.js`
- **Data Persistence:** Auth state persists via localStorage; product/order CRUD in memory

## Core Features — Completed

### Authentication & Multi-tenancy (DONE)
- JWT-based auth with cookie sessions
- Roles: super_admin, shop_owner, customer
- Shop owners tied to specific shops
- Dashboard navigation link in user dropdown when logged in

### Super Admin Dashboard (DONE)
- Overview stats (shops, owners, orders, revenue)
- Shop management (activate/suspend)
- User management (create owner, block/unblock, reset password to `iLoveProID@`, delete)
- Mobile-responsive sidebar with hamburger menu overlay

### Shop Owner Dashboard (DONE)
- Overview stats, recent orders
- Product CRUD with image upload (Emergent object storage), markdown description
- Category CRUD
- Order management with status updates
- Shop settings (profile, theme colors, preview link)
- Mobile-responsive sidebar with hamburger menu overlay

### Public Storefront (DONE)
- Per-shop storefronts at `/shop/{slug}`
- 6-column desktop / 2-column mobile product grids
- Centered product title and price
- Local cart with checkout flow
- Search and category filtering
- Product detail modals

### Vietnamese i18n (DONE — Feb 2026)
- Full Vietnamese translations across ALL components
- Language switcher (globe icon in Header) toggles VI/EN
- Translations applied to: HomePage, StorefrontPage, AuthModal, CartDrawer, ProductModal, WishlistPage, ShopOwnerDashboard, SuperAdminDashboard

### UI Navigation (DONE — Feb 2026)
- Visible "Dashboard" button in header when logged in (on both Homepage and Storefront)
- Floating action buttons (Call, Message, Info) at bottom-right on all pages
- "Add to Cart" as full-width text button below price on mobile
- Mobile-responsive sidebars on both dashboards (hamburger menu, overlay, backdrop, auto-close on nav click)
- 2-column product grids on mobile

## DB Schema
- **users:** email, password_hash, role, shop_id, name, status, created_at
- **shops:** owner_id, name, slug, theme_color, is_active, description, logo_url, contact_*, address, created_at
- **products:** shop_id, name, description, price, image_url, category, stock, is_active, created_at

## Key API Endpoints
- Auth: POST /api/auth/login, /api/auth/register, GET /api/auth/me
- Shops: GET /api/shops, /api/shops/{slug}
- Products: GET /api/products, POST/PUT/DELETE /api/dashboard/products
- Admin: GET /api/admin/stats, /api/admin/shops, /api/admin/users
- Upload: POST /api/upload/image

### Checkout & Orders (DONE — Feb 2026)
- Full-screen checkout overlay with shipping form and order summary
- Thank you page with order confirmation, order ID, and item details
- Cart drawer with quantity controls

### Shop Expiry System (DONE — Feb 2026)
- Super Admin can set expiry date per shop via date picker in Shops table
- Expired shops show blocking overlay preventing storefront access

### Product Filters (DONE — Feb 2026)
- Price bracket filters (Under 500K, 500K-1M, 1M-5M, Over 5M)
- Custom price range input (min-max)
- Applied on both HomePage and StorefrontPage

### Social Login (DONE — Feb 2026)
- Google and Facebook mock login buttons in Auth modal (MOCKED — UI only)

### Contact Page (DONE — Feb 2026)
- Full shop contact info: phone, email, address, business hours
- Social links (Facebook, Instagram)
- Contact message form
- Linked from floating action Info button

## Backlog
- P1: Order notifications (email/SMS)
- P2: Inventory alerts for low stock
- P2: Sales analytics charts in dashboards

## Credentials
- Shop Owner: demo@thewishop.com / demo123
- Super Admin: admin@thewishop.com / admin123
