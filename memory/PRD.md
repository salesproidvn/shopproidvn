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
