# E-commerce Platform PRD

## Original Problem Statement
Create a desktop UI for a Micro-SaaS E-commerce Platform with multi-tenant setup including Super-Admin, Shop Owner, and public Storefront views. The UI should support Vietnamese language. Fully standalone frontend — all data mocked, no backend/database needed.

## Architecture
- **Frontend:** React + Tailwind CSS + Shadcn UI (fully standalone — no backend needed)
- **Mock Layer:** Axios interceptor (`mockAdapter.js`) intercepts all API calls and returns data from `mockData.js`
- **Data Persistence:** Auth state persists via localStorage; product/order CRUD in memory

## Core Features — Completed

### Authentication & Multi-tenancy (DONE)
- JWT-based auth with cookie sessions
- Roles: super_admin, shop_owner, customer
- Shop owners tied to specific shops
- Dashboard navigation link in user dropdown when logged in

### Super Admin Dashboard (DONE)
- Overview stats (shops, owners, orders, revenue)
- Shop management (activate/suspend)
- User management (create owner, block/unblock, reset password to `iLoveProID@`, delete)
- Mobile-responsive sidebar with hamburger menu overlay
- Shop expiry date configuration

### Shop Owner Dashboard (DONE)
- Overview stats, recent orders
- Product CRUD with image upload, markdown description, position field
- Category CRUD with position reordering (up/down arrows)
- Order management with status updates
- Shop settings (profile, theme colors, preview link)
- Mobile-responsive sidebar with hamburger menu overlay

### Public Storefront (DONE)
- Per-shop storefronts at `/shop/{slug}`
- **Category-grouped product display** — products organized into category sections sorted by `category.position`, with products sorted by `product.position` within each section
- 6-column desktop / 2-column mobile product grids
- Centered product title and price
- Local cart with checkout flow (full-screen overlay)
- Thank You page with order confirmation
- Search, category filtering, and price bracket filters
- Product detail modals
- Grouped view reverts to flat grid when any filter is active

### Homepage (DONE)
- **Category-grouped product display** — same grouped sections as storefront
- Category dropdown filter, price bracket filters, search
- Floating action buttons (Call, Message, Info)

### Vietnamese i18n (DONE)
- Full Vietnamese translations across ALL components
- Language switcher (globe icon in Header) toggles VI/EN

### In-App Notifications (DONE)
- Toast popup on new order
- Notification bell with unread badge count
- Notification dropdown with history, mark-all-read, and clear

### Checkout & Orders (DONE)
- Full-screen checkout overlay with shipping form and order summary
- Thank you page with order confirmation, order ID, and item details
- New orders pushed to mock order list (visible in dashboard within same session)

### Product Filters (DONE)
- Price bracket filters (Under 500K, 500K-1M, 1M-5M, Over 5M)
- Custom price range input (min-max)

### Social Login (DONE)
- Google and Facebook mock login buttons in Auth modal (MOCKED — UI only)

### Contact Page (DONE)
- Full shop contact info: phone, email, address, business hours
- Social links, contact message form
- Linked from floating action Info button

## DB Schema (Mocked in mockData.js)
- **users:** email, password, role, shop_id, name, status
- **shops:** owner_id, name, slug, theme_color, is_active, expiry_date, contact_*, address
- **products:** shop_id, name, price, image_url, category, category_id, stock, position, is_active
- **categories:** id, shop_id, name, description, position
- **orders:** id, shop_id, customer_name, customer_phone, items, status, total_amount

## Key API Endpoints (All Mocked)
- Auth: POST /api/auth/login, /api/auth/register, GET /api/auth/me
- Shops: GET /api/shops, /api/shop/{slug}
- Products: GET /api/products, /api/shop/{slug}/products
- Categories: GET /api/categories (returns objects with positions), /api/shop/{slug}/categories
- Dashboard: GET/POST/PUT/DELETE /api/dashboard/products, /api/dashboard/categories, /api/dashboard/orders
- Category positions: PUT /api/dashboard/categories/positions
- Admin: GET /api/admin/stats, /api/admin/shops, /api/admin/users

## Backlog
- P2: Sales analytics charts in dashboards
- Refactoring: Split large components (ShopOwnerDashboard, Header) into smaller files

## Credentials
- Shop Owner: demo@thewishop.com / demo123
- Super Admin: admin@thewishop.com / admin123
