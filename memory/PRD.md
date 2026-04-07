# E-commerce Platform - Product Requirements Document

## Original Problem Statement
Create an admin dashboard for a Micro-SaaS E-commerce Platform. Multi-tenant setup with Super-Admin, Shop Owner, and public Storefront views. Support Vietnamese language.

## Tech Stack
- Frontend: React 19, Tailwind CSS, Shadcn/UI, react-quill-new (WYSIWYG)
- Backend: FastAPI + MongoDB (currently bypassed by frontend mock mode)
- Mode: **MOCK MODE** (mockAdapter.js intercepts all API calls)

## What's Been Implemented

### Phase 1-3 (Complete)
- Multi-tenant shop, Product CRUD, Orders, Vi/En i18n, JWT Auth
- Multi-image gallery, video URL, blog posts with WYSIWYG
- Banner slider, display layout reordering, SKU, featured products

### Phase 4 - Navigation & Footer (Complete)
- Dynamic menu bar, related products, category page, editable footer with links

### Phase 5 - Custom Pages & Menu Manager (Complete)
- Custom page builder (text/image/link/video sections), up to 10 pages
- Menu manager with quick-link dropdown (posts, pages, built-in pages), up to 10 items
- Copy link button, share button on posts, 2-col mobile attached products

### Phase 6 - Sub-categories & Video Links (Complete - Feb 2026)
- **Sub-categories**: Categories support `parent_id` for hierarchy. Root categories display sub-category chips on storefront. Category filter dropdown shows indented sub-categories. Dashboard categories tab shows parent/child tree with nested dashed-border cards. Category modal has Parent Category dropdown.
- **Product Video Links**: Each product supports up to 4 video links (YouTube, TikTok). Videos render in a 2-column iframe grid in product detail view below product info. Dashboard product modal has Add Video Link inputs with remove buttons and 4-item max limit.
- **Data**: 12 categories (6 root + 6 sub), 7 custom pages, 5 menu items

## Key Data Models
```js
// Category (with sub-categories)
{ id, shop_id, name, description, position, parent_id: null|'cat-id' }

// Product (with video links)
{ id, shop_id, name, price, category_id, stock, image_url, images[], video_url, video_links: ['url1','url2','url3','url4'], sku, is_featured, description }

// Custom Page
{ id, shop_id, title, slug, sections: [{type, content, url, text, caption}], is_published }

// Menu Item
{ id, label, url, type, enabled, position }

// Footer Column
{ title, items: [{text, url}] }
```

## Credentials
- Admin: admin@thewishop.com / admin123
- Shop Owner: demo@thewishop.com / demo123

### Phase 7 - UI Polish (Complete - Feb 2026)
- **Storefront Banner Width**: Banner slider now uses full container width (`w-full`) instead of `max-w-4xl`, aligning perfectly with blog, featured products, and product grid sections.

## Backlog
- P1: Sales analytics charts on dashboards
- P2: Refactor ShopOwnerDashboard.js (2000+ lines) and StorefrontPage.js (880+ lines)
