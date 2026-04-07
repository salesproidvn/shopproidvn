# E-commerce Platform - Product Requirements Document

## Original Problem Statement
Create an admin dashboard for a Micro-SaaS E-commerce Platform. Multi-tenant setup with Super-Admin, Shop Owner, and public Storefront views. Support Vietnamese language.

## Tech Stack
- Frontend: React 19, Tailwind CSS, Shadcn/UI, react-quill-new (WYSIWYG)
- Backend: FastAPI + MongoDB (currently bypassed by frontend mock mode)
- Auth: Bearer JWT tokens in localStorage
- Mode: **MOCK MODE** (mockAdapter.js intercepts all API calls)

## Core Architecture
```
/app/frontend/src/
  pages/ - StorefrontPage, ShopOwnerDashboard, SuperAdminDashboard, HomePage, BlogPostPage, ContactPage, CategoryPage, CustomPage
  components/ - Header, ProductCard, ProductModal, PriceFilter, NotificationBell
  context/ - AuthContext, CartContext, WishlistContext, LanguageContext, NotificationContext
  utils/ - mockAdapter.js, mockData.js, i18n.js, format.js
```

## What's Been Implemented

### Phase 1 - Core Platform (Complete)
- Multi-tenant shop system with Super Admin and Shop Owner roles
- Product CRUD with categories, drag-and-drop position ordering
- Order management with status tracking
- Vietnamese (vi) and English (en) language support
- JWT authentication, dynamic theme color, custom domain mapping

### Phase 2 - Product Enhancements (Complete)
- Multi-image product gallery, video URL support, thumbnail selection
- Product grouping by category, 42 products across 6 categories

### Phase 3 - Blog & Navigation Features (Complete)
- Blog Posts with WYSIWYG editor, thumbnails, attached products
- Post Slider Carousel, Banner Slider (up to 3)
- Full-page Product View, Bottom Bar, Category Pagination
- Display Layout reordering, SKU field, Featured Product toggle

### Phase 4 - Storefront Navigation & Footer (Complete)
- Menu Bar (dynamic from shop.menu_items), Related Products
- Category Page (`/shop/:slug/categories`)
- Editable Footer with link-attachable items (`items: [{text, url}]`)

### Phase 5 - Custom Pages & Menu Manager (Complete - Feb 2026)
- **Custom Page Builder**: Shop owners can create up to 10 custom pages with section-based builder (Text/WYSIWYG, Image, Link, Video URL). Pages published at `/shop/:slug/page/:pageSlug`. Draft pages return 404 publicly.
- **Menu Manager**: Dashboard tab for adding/removing/reordering up to 10 menu items. Each item has label, URL, type, and visibility toggle. Quick Link dropdown for linking to existing posts, custom pages, and built-in pages.
- **Copy Link**: Each custom page card in dashboard has a Copy Link button.
- **Share Button**: Added to blog post detail view header.
- **Mobile 2-column**: Attached products in post detail view now 2-column on mobile.
- **Mock Data**: 7 custom pages (About Us, Shipping Policy, Size Guide, Loyalty Program, FAQ, Store Locations, Careers[draft])

## Key Data Models
```js
// Custom Page
{ id, shop_id, title, slug, sections: [{type, content, url, text, caption}], is_published, created_at, updated_at }

// Menu Item
{ id, label, url, type: 'internal'|'external'|'scroll_shop'|'custom_page', enabled, position }

// Footer Column
{ title, items: [{text, url}] }
```

## Credentials
- Admin: admin@thewishop.com / admin123
- Shop Owner: demo@thewishop.com / demo123

## Backlog
- P1: Add sales analytics charts to dashboards
- P2: Refactor ShopOwnerDashboard.js and StorefrontPage.js into smaller components
