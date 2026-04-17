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
- **Dynamic OG Meta Tags**: Backend endpoints `/api/og/shop/{slug}`, `/api/og/shop/{slug}/product/{id}`, `/api/og/card/{slug}` serve HTML with proper og:title, og:description, og:image for social sharing (Zalo, Facebook). Share buttons use OG URLs.
- **Voucher System**: Full CRUD (code, % or fixed discount, usage limits, expiry, per-product). Public validation endpoint.
- **Agent/Dealer System**: Max 100 agents per shop, 3 levels hierarchy, tracking codes, sales attribution on orders, agent dashboard, Super Admin toggle per shop.
- **Digital Business Card**: For shop owners and agents. Public page at `/card/{slug}`, VCF download, selectable products, OG tags for sharing.

## DB Collections
- `users` - User accounts (super_admin, sub_admin, shop_owner, customer)
- `shops` - Shop configurations (slug, theme, layout, limits, agents_enabled)
- `products` - Products per shop
- `categories` - Product categories (with parent_id for hierarchy)
- `orders` - Customer orders (with optional agent_tracking_code, agent_id)
- `posts` - Blog posts per shop
- `pages` - Custom pages per shop
- `vouchers` - Voucher codes per shop
- `agents` - Agent/dealer accounts per shop (id, email, password_hash, level, parent_agent_id, tracking_code)
- `agent_sales` - Sales attributed to agents
- `business_cards` - Business card data (owner_id, owner_type: shop_owner/agent, selected_products)
- `push_subscriptions` - Web push subscriptions
- `password_resets` - Password reset tokens
- `contacts` - Contact form submissions

## Key API Endpoints
- Auth: `/api/auth/login`, `/api/auth/me`, `/api/auth/register`
- Admin: `/api/admin/shops`, `/api/admin/users`, `/api/admin/shops/{id}/agents-toggle`
- Dashboard: `/api/dashboard/shop`, `/api/dashboard/products`, `/api/dashboard/vouchers`, `/api/dashboard/agents`, `/api/dashboard/agent-sales`, `/api/dashboard/business-card`
- Agent: `/api/agent/dashboard`, `/api/agent/business-card`
- Public: `/api/shop/{slug}`, `/api/card/{slug}`, `/api/og/shop/{slug}`

## Pending Issues
- P2: "Không thể lưu" error - needs user clarification on which form
- P2: VCF file empty info - verify VCF Blob generation in StorefrontPage

## Backlog
- P1: Sales analytics charts in dashboards
- P2: Refactor large files (server.py >2300 lines, ShopOwnerDashboard.js >3400 lines)
