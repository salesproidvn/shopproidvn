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
- [x] Product description text overflow fix and rich text rendering
- [x] Multiple image uploads for products (max 8), posts (max 3), banners (max 8)
- [x] Dynamic internal LinkPicker for Footer and Header Menu
- [x] Image Lightbox popup for blog posts
- [x] Font size options in Quill editors
- [x] Save Contact VCF download button on storefront
- [x] Demo Autofill button on login page
- [x] Scroll restoration across storefront views
- [x] Login button on storefront header when user is logged out
- [x] WordPress-style Media Library with centralized image management
- [x] Inline editing (pencil icon) on storefront for products and posts
- [x] Scroll preservation after modal save in Dashboard
- [x] Fixed transparent background on storefront inline edit popup
- [x] **Custom Block Elements in Display Layout** (Apr 10, 2026) - 6 block types: Heading, Rich Text, Image, Image Grid, Video, URL/Link. Add/edit/delete/reorder/toggle blocks. Full storefront rendering.

## Pending Issues
- [ ] P0: Storefront product category filter dropdown not working
- [ ] P1: "không thể lưu" error (needs user clarification on which form)
- [ ] P1: VCF file download may contain empty info (needs verification)

## Upcoming Tasks
- [ ] P1: Add sales analytics charts to dashboards

## Future/Backlog Tasks
- [ ] P1: Refactor ShopOwnerDashboard.js (3000+ lines) into smaller components
- [ ] P1: Refactor StorefrontPage.js (1400+ lines) into smaller components

## API Endpoints
### Auth
- POST /api/auth/login, /api/auth/register, /api/auth/logout
- GET /api/auth/me
- POST /api/auth/forgot-password, /api/auth/reset-password

### Super Admin
- GET /api/admin/stats, /api/admin/shops
- POST /api/admin/shops/{shop_id}/status, /api/admin/shops/{shop_id}/expiry
- PUT /api/admin/shops/{shop_id}/limits

### Dashboard (Shop Owner)
- GET/PUT /api/dashboard/shop (includes layout_sections with custom blocks)
- CRUD for products, categories, orders, posts, pages, menu, banners, footer
- GET/DELETE /api/dashboard/media (Media Library)

### Public Storefront
- GET /api/shop/{slug}, /api/shop/{slug}/products, /api/shop/{slug}/categories
- GET /api/shop/{slug}/posts, /api/shop/{slug}/page/{page_slug}
- POST /api/shop/{slug}/orders, /api/shop/{slug}/contact

### Upload
- POST /api/upload (R2 image upload with compression)

## Custom Block Data Model
Custom blocks are stored in `shop.layout_sections[]` alongside built-in sections:
```json
{
  "id": "custom_1712753000",
  "type": "heading|rich_text|image|image_grid|video|url",
  "label": "User-defined label",
  "content": { /* type-specific content */ },
  "enabled": true
}
```

## Key Files
- `/app/backend/server.py` - Core backend
- `/app/frontend/src/pages/StorefrontPage.js` - Public storefront (renders custom blocks)
- `/app/frontend/src/pages/ShopOwnerDashboard.js` - Shop owner dashboard (block management UI)
- `/app/frontend/src/pages/SuperAdminDashboard.js` - Super admin
- `/app/frontend/src/pages/LoginPage.js` - Login page
- `/app/frontend/src/components/MediaLibrary.js` - WordPress-style media manager
