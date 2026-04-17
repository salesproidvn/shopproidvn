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
2. **Sub Admin** (`sub_admin`) - Limited admin (no user creation, bulk, maintenance)
3. **Shop Owner** (`shop_owner`) - Manages their own shop
4. **Agent** (`agent`) - Dealer for a shop, has own dashboard, tracked sales
5. **Customer** - Public storefront visitor

## Key Features (Implemented)

### Phase 1 - Core Platform (Previous sessions)
- Auth (JWT, login/register/forgot password)
- Super Admin Dashboard (user/shop management, bulk create, limits, sub-admin)
- Shop Owner Dashboard (products, categories, orders, posts, pages, media, menu, layout)
- Public Storefront (responsive, banner carousel, mega menu, product detail, blog)
- Drag & Drop layout/category management (@dnd-kit)
- Cloudflare R2 image upload + compression
- Resend email notifications
- Push notifications (VAPID)
- Multi-language (VI/EN)

### Phase 2 - New Features (April 17, 2026)
- **Cart Removed**: "Add to Cart" button removed from storefront (transitioning to agent model)
- **Dynamic OG Meta Tags**: Backend endpoints for social sharing
- **Voucher System**: Full CRUD with public validation
- **Agent/Dealer System**: Max 100 agents per shop, 3 levels hierarchy
- **Digital Business Card**: QR Code, VCF download, selectable products

### Phase 3 - Security Features (April 17, 2026)
- **Rate Limiting**: Global 120 req/min per IP, Auth endpoints 10 req/min, Orders 15 req/min, Contact form 5 req/5min, Registration 3 req/5min
- **Brute Force Protection**: 5 failed login attempts = 15 min lockout (per IP:email)
- **Content Word Limit**: 1000 words max for product descriptions and blog posts (frontend + backend)
- **XSS Sanitization**: bleach library strips dangerous HTML tags, preserves safe tags
- **Security Headers**: X-Content-Type-Options, X-Frame-Options, X-XSS-Protection, Referrer-Policy, Permissions-Policy
- **Request Size Limit**: 10MB max payload
- **Input Sanitization**: Customer names, addresses, contact form messages cleaned of HTML

## DB Collections
- `users`, `shops`, `products`, `categories`, `orders`, `posts`, `pages`
- `vouchers`, `agents`, `agent_sales`, `business_cards`
- `push_subscriptions`, `password_resets`, `contacts`

## Key API Endpoints
- Auth: `/api/auth/login`, `/api/auth/me`, `/api/auth/register`
- Admin: `/api/admin/shops`, `/api/admin/users`
- Dashboard: `/api/dashboard/products`, `/api/dashboard/posts`, `/api/dashboard/vouchers`, `/api/dashboard/agents`
- Public: `/api/shop/{slug}`, `/api/card/{slug}`
- Security: `/api/security/status`

## Pending Issues
- P2: "Không thể lưu" error - needs user clarification on which form

## Backlog
- P1: Sales analytics charts in dashboards
- P1: Automated commission calculation for Agent/Dealer system (Level 1: 10%, Level 2: 7%, Level 3: 5%)
- P0: Refactor large files (server.py >2500 lines, ShopOwnerDashboard.js >3700 lines, StorefrontPage.js >1500 lines)
