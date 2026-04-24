# PRD - Micro-SaaS E-commerce Platform (Ocean Pro Web / ProID Shop)

## Original Problem Statement
Multi-tenant e-commerce platform allowing shop owners to create and manage online stores. Features include product management, order processing, and a public storefront. Super Admin manages all users and shops.

## Architecture
- **Frontend**: React (CRA + Craco), Tailwind CSS, Shadcn UI, @dnd-kit
- **Backend**: FastAPI (Python), Motor (async MongoDB driver)
- **Database**: MongoDB Atlas
- **Storage**: Cloudflare R2 (S3-compatible)
- **Email**: Resend
- **Push**: PyWebPush (VAPID)

## User Roles
1. **Super Admin** (`super_admin`) - Full system access
2. **Sub Admin** (`sub_admin`) - Limited admin
3. **Shop Owner** (`shop_owner`) - Manages their own shop
4. **Agent** (`agent`) - Dealer for a shop
5. **Customer** - Public storefront visitor

## Key Features (Implemented)

### Phase 1 - Core Platform
- Auth (JWT), Super Admin Dashboard, Shop Owner Dashboard, Public Storefront
- DnD layout, R2 upload, Resend emails, Push notifications, Multi-language

### Phase 2 - E-commerce Extensions (April 17, 2026)
- Dynamic OG Meta Tags, Voucher System, Agent/Dealer System, Digital Business Card

### Phase 3 - Security Features (April 17, 2026)
- Rate Limiting (global 120/min, auth 10/min, orders 15/min, contact 5/5min)
- Brute Force Protection (5 failed = 15min lockout)
- Content Word Limit (1000 words for products/posts)
- XSS Sanitization (bleach), Security Headers, Request Size Limit (10MB)
- **Security Dashboard** for Super Admin (real-time metrics)

### Phase 4 - UX Improvements (April 17, 2026)
- **Expired Shop Popup**: Undismissable popup with phone (0965784668) and Zalo OA (zalo.me/proidvn)
- **White Screen Fix**: Targeted state updates for expiry/limits (no full fetchData reload)
- **Uncategorized Products**: "Chưa phân loại" section on storefront + filter dropdown option

### Phase 5 - Services + Bookings (April 18, 2026)
- **Product type field**: Products can now be marked as `type: "product"` (default) or `type: "service"`
- **Shop Owner Dashboard**: Product modal has "Loại" toggle (Sản phẩm/Dịch vụ); service items show black "Dịch vụ" badge in product grid
- **Public Storefront**: "Sản phẩm / Dịch vụ" tab toggle appears when shop has both types; services display Calendar icon button instead of "+"
- **Booking flow**: Simple modal form (Họ tên, SĐT, Email, Ngày/giờ, Ghi chú) on both storefront grid and product detail page
- **Dashboard Bookings**: New "Đơn đặt lịch dịch vụ" section under Orders tab with status workflow (pending → confirmed → completed / cancelled), call & delete actions
- **Agent tracking**: Bookings carry `agent_tracking_code` if referral is present (same as orders)
- **Business Card**: Instagram replaced with **TikTok** on the business card form and public card page; other pages (Storefront/Contact) keep Instagram unchanged

### Phase 6 - Product Stock Toggles + Dedicated Edit Page (April 20, 2026)
- **Removed** `stock` field entirely from `Product` model; migration unset `stock` on all 271 existing products
- **Added** `is_hidden` (ẩn sản phẩm — excludes from public listing) and kept `out_of_stock` (hết hàng — product visible but cannot be ordered)
- Public endpoints (`/api/shop/{slug}/products`, `/api/products`, `/api/card/{slug}`, `/api/og/shop/{slug}/product/...`, `/api/shop/{slug}/bookings`) filter `is_hidden:{$ne: true}`
- **New dedicated Product Edit page** at `/dashboard/product/new` and `/dashboard/product/:productId/edit` with 2-column layout and 5 numbered sections (Type&Identification, Media Gallery, Pricing&Logistics, Detailed Information, Visibility&Promotion)
- Replaces the prior in-dashboard Product Modal entirely
- Dashboard product card now shows red "Hết hàng" and grey "Ẩn" badges instead of stock count
- Storefront card + Product Detail page both hide Add-to-cart/Book button and show "Hết hàng" badge when `out_of_stock=true`

### Phase 7 - Storefront Refinements + Custom Homepage Sections (April 21, 2026)
- Removed the "All categories" dropdown filter above the storefront product grid (reduces visual noise; users still filter via header menu / category page)
- Rebuilt the **mobile mega-menu** as a 2-column grid of main categories (image thumbnail + name). Tapping a category opens `/shop/:slug/category/:id`
- **Custom homepage sections** (max 5 per shop): shop owner creates simple blocks (title + image + rich text) from the **Bố cục hiển thị** tab. Each custom section appears inside the draggable layout list alongside Banner/Categories/Featured/... with its own BẬT/TẮT toggle + inline Edit pencil, and renders inline on the public storefront at the chosen position.

### Phase 8 - Maintenance Fix + Gated Features (April 24, 2026)
- **Fixed Super Admin "Bảo trì hệ thống" (System Maintenance) scan**: backend now returns nested `{old_orders: {total, by_shop[], cutoff_date}, orphaned_images: {total, total_size_kb, items[]}}` matching frontend expectations (previously flat `{old_orders_count, orphaned_files_count}` caused UI crash)
- **Cleanup endpoints** now return `{deleted, freed_kb, message}` and use Vietnamese messages
- **Manual activation for Agent + Business Card features** (per-shop): new `business_card_enabled` flag on shops, new `PUT /api/admin/shops/{id}/business-card-toggle` endpoint, Super Admin Dashboard gains a "Danh thiếp ON/OFF" toggle beside the existing "Đại lý" toggle
- Shop Owner Dashboard **hides** Agents / Business Card menu items unless enabled by Super Admin; backend `GET/PUT /api/dashboard/business-card`, `/api/agent/business-card`, and public `/api/card/{slug}` all gate on `business_card_enabled=true`

## DB Collections
users, shops, products (+ type field), categories, orders, bookings (new), posts, pages, vouchers, agents, agent_sales, business_cards, push_subscriptions, password_resets, contacts

## Key API Endpoints
- Auth: `/api/auth/login`, `/api/auth/me`, `/api/auth/register`
- Admin: `/api/admin/shops`, `/api/admin/users`, `/api/admin/security/dashboard`
- Dashboard: `/api/dashboard/products`, `/api/dashboard/posts`, `/api/dashboard/vouchers`, `/api/dashboard/bookings`
- Public: `/api/shop/{slug}`, `/api/shop/{slug}/products?type=service`, `/api/shop/{slug}/bookings`, `/api/card/{slug}`, `/api/security/status`

## Pending Issues
- P2: "Không thể lưu" error - needs user clarification

## Backlog
- P1: Sales analytics charts
- P1: Automated commission for Agent/Dealer (L1:10%, L2:7%, L3:5%)
- P0: Refactor server.py, ShopOwnerDashboard.js, StorefrontPage.js
- Nice-to-have: Dedicated booking email template (currently reuses order email)
