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

### Phase 12 - Unify Mega Menu with Categories (April 27, 2026)
- **Mega Menu order = Categories order**: backend `GET /api/dashboard/mega-menu` now returns categories sorted by their natural `position` (managed via Danh mục tab drag-drop). The mega_menu_categories config is used **only for the enabled flag**, not for ordering.
- **PUT /api/dashboard/mega-menu** now accepts only `{category_id, enabled}` per item; position is derived.
- **Storefront unification**: introduced `visibleParentCategories` helper used by 3 places — desktop mega menu bar, mobile mega menu drawer, **homepage CategoryGrid**. All filter parent categories by `mega_menu_categories[].enabled`. Toggle a category OFF in Mega Menu tab → it disappears from BOTH the top nav AND the homepage category grid. Reorder in Danh mục tab → both update.
- **Dashboard UI**: removed up/down arrows in Mega Menu manager (order now driven by Danh mục tab). Added position number badge for clarity. Updated description text.

### Phase 11 - Remove Banner + Custom Sections + Add Hồ sơ shop tab (April 27, 2026)
- **Removed Banner feature**: storefront `BannerSlider`, banner case in layout switch, `bannerIndex` state, auto-slide effect, skeleton banner. Backend: removed `banners` + `banner_enabled` from /shop/{slug} response and shop_doc init. Dashboard: removed Banner Settings card from Settings tab + Banner upload UI from Layout tab. Removed `handleBannerUpload`, `removeBanner`, `bannerInputRef`.
- **Removed Custom Sections (Section tùy chỉnh)**: storefront `CustomSectionBlock` component + customSectionsById + `custom:` prefix logic in layout renderer. Backend: removed sanitize/validate logic + `custom_sections` from /shop/{slug} response. Dashboard: removed Custom Sections Manager card, modal, delete dialog, all CRUD handlers (`handleSaveCustomSection`, `handleDeleteCustomSection`, `openCreateCustomSection`, `openEditCustomSection`), state (`showCustomSectionModal`, `editingCustomSection`, `customSectionForm`, `customSectionToDelete`), `SortableElementRow` component, `buildSectionLabels`, `isCustomSectionId`.
- **Added "Hồ sơ shop" sidebar tab**: new menu item with `User` icon, dedicated tab containing the previous Shop Profile card (name, slug, logo, description, contact phone/email, address, Google Maps URL, social/marketplace links). Cài đặt now keeps password, push/email notifications, install PWA, custom domain, theme color, post carousel position, and a simplified blog toggle.

### Phase 10 - Remove Custom Pages + Hidden Product + Out-of-Stock (April 27, 2026)
- **Removed Trang tùy chỉnh (Custom Pages)**: tab + page `CustomPage.js`, endpoints `GET/POST/PUT/DELETE /api/dashboard/pages`, public `GET /api/shop/{slug}/page/{page_slug}`, route `/shop/:slug/page/:pageSlug`, `customPages` state, modal, `pageForm`, `editingPage`, `showPageModal`
- **Removed Ẩn sản phẩm (is_hidden)**: field from `Product` model, product create/update payload, ToggleRow in ProductEditPage, hidden badge in dashboard product list, storefront filters (`is_hidden: {"$ne": True}` removed from product list / featured / detail / booking queries)
- **Removed Hết hàng (out_of_stock)**: field from model + payload, ToggleRow, "Hết hàng" badge on storefront product card + product detail + dashboard product list, disabled-button logic on ProductDetailPage (Add to Cart / Đặt lịch always enabled now)
- **Note**: Existing legacy `is_hidden` / `out_of_stock` values still in MongoDB documents but no longer read or written by API; can be cleaned with `db.products.updateMany({}, {$unset: {is_hidden:"", out_of_stock:""}})` if desired

### Phase 9 - Feature Removal + Default Storefront Menu (April 27, 2026)
- **Removed Voucher feature** (UI, backend endpoints, MongoDB collection seed, cart UI). All voucher data permanently deleted from active code paths
- **Removed Agent/Đại lý feature** (collections: `agents`, `agent_sales`; endpoints `/api/dashboard/agents`, `/api/dashboard/agent-sales`, `/api/admin/shops/{id}/agents-toggle`; AgentDashboard page + tab + referral tracking from cart/booking)
- **Removed Business Card / Danh thiếp feature** (collection `business_cards`; endpoints `/api/dashboard/business-card`, `/api/agent/business-card`, public `/api/card/{slug}`, OG; BusinessCardPage + tab + Super Admin toggle)
- **Removed Quản lý Menu** (Menu Manager) feature: storefront menu is now hard-coded to **4 default items** — `Trang chủ` / `Sản phẩm` / `Bài viết` / `Liên hệ`. Mega Menu Manager (separate tab) preserved
- **Removed Footer Settings** customization. Footer simplified to: shop name + contact phone + address only (centered)
- **Removed shop fields**: `agents_enabled`, `business_card_enabled`, `max_agents`, `menu_items`, `footer_columns` from API responses (still in DB until natural cleanup)
- **Bonus**: removed `MenuLinkPicker`, `FooterLinkPicker` components, voucher/agent state hooks, modal dialogs, and ~1100 lines from `ShopOwnerDashboard.js` (4377 → 3303), ~500 lines from `server.py`

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
