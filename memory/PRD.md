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
- Shop Owner 1: demo@thewishop.com / demo123 (The Elite Shop)
- Shop Owner 2: green@thewishop.com / green123 (Green Living)

### Phase 7 - UI Polish (Complete - Feb 2026)
- **Storefront Banner Width**: Banner slider now uses full container width (`w-full`) instead of `max-w-4xl`, aligning perfectly with blog, featured products, and product grid sections.

### Phase 8 - Super Admin View Shop (Complete - Feb 2026)
- **Admin View Shop**: Super Admin can click "View Shop" in the Shops table to navigate to any shop owner's full dashboard (`/dashboard?shop=<shop-id>`).
- **Admin Banner**: Amber-colored banner at top shows which shop is being viewed, with "Preview Shop" link and "Back to Admin" button.
- **Data Isolation**: All dashboard API routes dynamically resolve shop_id (admin view context > query param > user's shop_id), ensuring each shop only sees its own products, categories, orders, and settings.
- **Second Mock Shop**: Added "Green Living" eco-friendly shop (6 products, 3 categories, 2 orders, 1 blog post) owned by Minh Tran (green@thewishop.com / green123).
- **Full CRUD**: Admin can manage any shop's products, categories, orders, posts, pages, menu, settings while viewing their dashboard.

### Phase 9 - Storefront UI Polish (Complete - Feb 2026)
- **Removed Price Filter**: Removed PriceFilter component from storefront, only category dropdown remains.
- **Redesigned Bottom Bar**: Taller bar (h-16), bigger icons (w-5 h-5), readable text (text-xs font-medium), grid layout, MapPin and Grid3X3 icons for clarity.
- **Themed Bottom Bar**: Bottom bar uses shop's `theme_color` as background with white icons/text.
- **Category Grid**: 8-column left-aligned grid of parent categories with square product cards below banner, 2 cols on mobile. Section titled "Danh mục sản phẩm" via `t.productCategories`.
- **Category Images**: Categories now support `image_url` field, editable in dashboard category form.
- **Single Category Page** (`/shop/:slug/category/:categoryId`): Dedicated page showing all products of a category with sub-category filter chips, category hero with image, add-to-cart buttons.
- **Layout Position Editable**: Categories section added to Display Layout settings for position reordering and toggle.

### Phase 10 - Chợ Xanh 365 Shop & Cart Fix (Complete - Feb 2026)
- **New Shop "Chợ Xanh 365"**: Vietnamese organic grocery store with 100 products across 8 categories (32 total with sub-categories), 8 orders, 2 blog posts. Green theme. Login: choxanh@thewishop.com / choxanh123.
- **Cart Bug Fix**: Fixed `addToCart(product, 1)` → `addToCart(product.id, product, 1)` in SingleCategoryPage — was passing wrong arguments to CartContext.

### Phase 11 - Category Grid Title & Checkout Back Fix (Complete - Feb 2026)
- **Category Grid Title**: Added "Danh mục sản phẩm" section heading above the category grid on the Storefront, matching other section headings.
- **Checkout Back Button**: Fixed the back arrow on the checkout page to navigate back to the Single Category Page when checkout was triggered from there (via `?checkout=1`).

## Backlog
- P1: Sales analytics charts on dashboards
- P2: Refactor ShopOwnerDashboard.js (2000+ lines) and StorefrontPage.js (880+ lines)
