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
  pages/ - StorefrontPage, ShopOwnerDashboard, SuperAdminDashboard, HomePage, BlogPostPage, ContactPage, CategoryPage
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
- JWT authentication (Bearer token in localStorage)
- Dynamic theme color from shop settings
- Custom domain mapping

### Phase 2 - Product Enhancements (Complete)
- Multi-image product gallery
- Video URL support (YouTube embed)
- Thumbnail image selection
- Product grouping by category on storefront
- 42 total products across 6 categories

### Phase 3 - Blog & Navigation Features (Complete - Feb 2026)
- Blog Posts with WYSIWYG editor (react-quill-new), thumbnails, attached products
- Post Slider Carousel with arrows/dots
- Banner Slider (up to 3 banners, auto-slide)
- Full-page Product View with red close button
- Product Description WYSIWYG editor
- Bottom Bar (Call, Message, Map, Categories)
- Category Pagination with Load More
- Contact Page
- Display Layout reordering (Banner, Blog, Featured, Products)
- Super Admin limits (max products/posts)
- SKU field and Featured Product toggle

### Phase 4 - Storefront Navigation & Footer (Complete - Feb 2026)
- **Menu Bar**: Full navigation bar in storefront header with Home, Shop, Categories, Blog, Contact links (desktop + mobile hamburger menu)
- **Related Products**: Shows up to 4 products from the same category in the product detail view
- **Category Page**: Standalone `/shop/:slug/categories` route listing all categories with descriptions, product counts, product previews, and links
- **Editable Footer**: 4-column configurable footer managed from Dashboard Layout tab, rendered dynamically on storefront

## Credentials
- Admin: admin@thewishop.com / admin123
- Shop Owner: demo@thewishop.com / demo123

## Backlog
- P1: Add sales analytics charts to dashboards
- P2: Refactor ShopOwnerDashboard.js and StorefrontPage.js into smaller components
