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
  pages/ - StorefrontPage, ShopOwnerDashboard, SuperAdminDashboard, HomePage, BlogPostPage, ContactPage
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
- **Blog Posts**: Shop owner can create/edit/delete posts with:
  - Title, WYSIWYG rich text editor (react-quill-new), max 2000 words
  - Thumbnail image + up to 3 additional images
  - Attach existing products (shown as cards at bottom of post)
- **Post Carousel**: Shown on storefront, position configurable (top/bottom) in settings
- **Full-page Product View**: Replaces modal, with red close button (X)
- **Bottom Bar**: Fixed narrow bar with Call, Message, Map, Categories
- **Category Pagination**: Max 10 products per category, "Load More" button
- **Contact Page**: Shop info display + contact form
- **Menu**: Posts and Contact links added to storefront header
- **Floating Icons Removed**: FloatingActions component removed
- **Super Admin Limits**: Max products and max posts per shop controls

## Credentials
- Admin: admin@thewishop.com / admin123
- Shop Owner: demo@thewishop.com / demo123

## Backlog
- P1: Add sales analytics charts to dashboards
- P2: Refactor ShopOwnerDashboard.js and StorefrontPage.js into smaller components
