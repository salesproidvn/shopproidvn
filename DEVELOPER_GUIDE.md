# Pro ID Shop — Technical Documentation for Developers

**Version:** 1.0  
**Last Updated:** April 18, 2026  
**Platform URL:** https://shop.proid.vn

---

## 1. Overview

Pro ID Shop is a **multi-tenant SaaS e-commerce platform** that allows businesses to create and manage their own online storefronts. Each shop owner gets a fully customizable store with product management, order processing, blog, custom pages, voucher system, agent/dealer tracking, and a digital business card — all managed from a single dashboard.

The platform is operated by a **Super Admin** who controls all users, shops, limits, security configurations, and system-wide settings.

---

## 2. Architecture

```
┌─────────────────────────────────────────────────────┐
│                    Frontend (React)                  │
│  CRA + Craco · Tailwind CSS · Shadcn UI · @dnd-kit  │
└─────────────────┬───────────────────────────────────┘
                  │ HTTPS (API prefix: /api)
┌─────────────────▼───────────────────────────────────┐
│                 Backend (FastAPI)                     │
│  Python · Motor (async) · JWT Auth · Bleach (XSS)    │
│  Rate Limiting · Brute Force Protection              │
└──────┬──────────┬──────────┬────────────────────────┘
       │          │          │
  MongoDB    Cloudflare R2   Resend
  (data)     (image storage) (email)
```

| Component       | Technology                                      |
|-----------------|------------------------------------------------|
| Frontend        | React 18 (CRA + Craco), Tailwind CSS, Shadcn UI |
| Backend         | FastAPI (Python 3.11), Motor (async MongoDB)    |
| Database        | MongoDB (built-in or Atlas)                     |
| Image Storage   | Cloudflare R2 (S3-compatible)                   |
| Email Service   | Resend API                                      |
| Push Notifications | PyWebPush (VAPID)                            |
| Drag & Drop     | @dnd-kit/core, @dnd-kit/sortable                |
| Rich Text Editor| ReactQuill                                      |
| QR Code         | qrcode.react                                    |
| Auth            | JWT (access + refresh tokens, HttpOnly cookies) |

---

## 3. User Roles & Permissions

| Role | Access | Description |
|------|--------|-------------|
| **Super Admin** | Full system | Manage all users, shops, limits, security config, maintenance |
| **Sub Admin** | Limited admin | View/manage shops & users, cannot create users or access maintenance |
| **Shop Owner** | Own shop only | Full control over their shop: products, categories, orders, posts, pages, vouchers, agents, media, settings |
| **Agent/Dealer** | Agent dashboard | View assigned sales, track referral performance. Created by shop owners |
| **Customer** | Public storefront | Browse shops, view products, place orders, apply vouchers |

---

## 4. Feature List (Detailed)

### 4.1 Authentication & Authorization
- **JWT-based auth** with access tokens (localStorage) and refresh tokens (HttpOnly cookies)
- Login, Register, Forgot Password, Reset Password flows
- **Change password** without requiring old password (for logged-in users)
- Role-based routing: Super Admin → `/admin`, Shop Owner → `/dashboard`, Agent → `/agent`
- **Brute force protection**: Configurable max attempts (default 50) with 15-minute lockout per IP:email

### 4.2 Super Admin Dashboard (`/admin`)

#### 4.2.1 Overview Tab
- Total shops, orders, shop owners count
- System health metrics

#### 4.2.2 User Management Tab (merged with Shop Management)
- **Unified view**: Each user card shows user info + their shop details inline
- **User info**: Name, email, phone, role badge, status badge
- **Shop info** (if applicable): Shop name, slug, status, product/order/category counts
- **Inline controls per shop**:
  - Expiry date (date picker, clearable)
  - Max products, max posts, max pages, max categories, max agents, max images (all editable number inputs)
  - Agents toggle (ON/OFF)
  - Suspend/Activate button
- **Actions dropdown** (per user):
  - Edit user info (name, email, phone, shop name) — opens modal
  - Copy login credentials (email + default password `iLoveProID@`)
  - Copy shop link
  - View storefront (opens in new tab)
  - Send login email (sends credentials + login URL via Resend)
  - Block/Unblock user
  - Reset password (resets to `iLoveProID@`, shows toast confirmation)
  - Delete user (Super Admin only, cascading delete of shop + all data)
- **Bulk create**: Paste multiple `email,password,name,shop_name` lines to create users in batch
- **Search**: Filter by name, email, or shop name

#### 4.2.3 Security Dashboard Tab
- **Real-time metrics**: Active tracked IPs, blocked IPs, locked accounts, content word limit
- **Rate limiting breakdown**: Auth, Orders, Global, Contact, Register request counts
- **Blocked IPs list** with remaining lockout time
- **Locked accounts list** (brute force)
- **Editable security configuration** (saved to MongoDB, applied immediately without restart):
  - Rate limits: Global (req/min), Auth, Orders, Contact, Register
  - Brute force: Max attempts, lockout window (seconds)
  - Max request payload (MB)
  - Content word limit (words)
- **Security headers displayed**: X-Content-Type-Options, X-Frame-Options, X-XSS-Protection, Referrer-Policy, Permissions-Policy

#### 4.2.4 Maintenance Tab
- Database cleanup tools
- System maintenance operations

#### 4.2.5 Settings Tab
- Change admin password
- System preferences

### 4.3 Shop Owner Dashboard (`/dashboard`)

#### 4.3.1 Overview Tab
- Sales stats: Total revenue, orders count, products count, categories count
- Recent orders list
- Quick actions

#### 4.3.2 Products Tab
- **Product CRUD**: Create, edit, delete products
- **Rich text description** (ReactQuill editor) with **1000-word limit** (counter displayed)
- **Image management**: Multiple product images, drag thumbnails
- **Video support**: YouTube URLs + **TikTok video links** (embedded in product detail page)
- **Fields**: Name, price, SKU, category, description, images, video URL, additional video links
- **Category assignment**: Dropdown with parent/child categories
- **Inline edit** from storefront (for logged-in shop owners)
- **Fallback image**: Custom branded fallback when no product image

#### 4.3.3 Categories Tab
- **Hierarchical categories**: Parent and child (subcategory) support
- **Drag & drop reordering** (@dnd-kit with PointerSensor + TouchSensor + KeyboardSensor)
- **Category images**: Optional image per category
- Create, edit, delete categories
- Position saved to backend

#### 4.3.4 Orders Tab
- Order list with status management
- **Order statuses**: Pending → Confirmed → Completed / Cancelled
- Customer info: Name, phone, address, note
- Order items with quantities and prices
- **Agent tracking**: Orders show agent badge if placed via referral link
- **Agent sales credit**: Recorded when order status changes to confirmed/completed

#### 4.3.5 Blog Posts Tab
- Blog post CRUD with rich text editor (ReactQuill)
- **1000-word limit** with live word counter
- Thumbnail image support
- Posts displayed in carousel on storefront

#### 4.3.6 Custom Pages Tab
- Create custom info pages (About Us, Return Policy, Size Guide, etc.)
- Custom slug, title, and rich text content
- Accessible via storefront navigation

#### 4.3.7 Voucher System Tab
- **Voucher CRUD**: Create, edit, activate/deactivate vouchers
- **Discount types**: Percentage or fixed amount
- **Configuration**: Min order amount, max uses, expiry date, applicable products
- **Public validation API**: Customers apply voucher codes at checkout
- **Product search filter**: Select specific products the voucher applies to

#### 4.3.8 Agent/Dealer Management Tab
- **3-level agent hierarchy**: Level 1, Level 2, Level 3
- Create agents with auto-generated tracking codes
- **Referral URL**: `?ref={tracking_code}` appended to shop URL
- Agent dashboard shows their sales performance
- Activate/deactivate agents
- Agents can have their own login (separate auth in `agents` collection)

#### 4.3.9 Media Library
- Upload images to Cloudflare R2
- **Upload limit per shop**: Configurable `max_images` (default 500)
- Image compression (WebP conversion via Pillow)
- Browse, search, delete uploaded images
- Paginated gallery view

#### 4.3.10 Menu & Mega Menu Management
- Custom navigation menu items (links, pages, categories)
- **Mega Menu**: Auto-populated from parent categories with subcategory dropdowns
- Enable/disable individual categories in mega menu
- Drag & drop menu ordering

#### 4.3.11 Layout Management
- Drag & drop layout sections (banner, products, blog, categories)
- Section ordering and visibility toggles

#### 4.3.12 Shop Settings
- Shop info: Name, slug, description, address, **Google Maps URL**
- Contact: Phone, email
- Social links: Facebook, Instagram
- Theme color picker
- **Change password** (no old password required)
- Push notification settings (VAPID)

#### 4.3.13 Digital Business Card
- **Public page**: `/card/{slug}`
- Avatar, display name, title, phone, email
- **QR Code modal** (qrcode.react)
- **Save Contact**: VCF download with Base64-embedded avatar image
- **Selected products**: Choose which products to display on business card
- Category filter in product selection modal

### 4.4 Public Storefront (`/shop/{slug}`)

#### 4.4.1 Home Page
- **Responsive header**: Logo + shop name (clickable → home/reload), search, navigation
- **Mobile hamburger menu**: Categories with subcategory expand, login/dashboard button
- **Banner carousel**: Swipeable image banners
- **Category grid**: 3-column mobile / 4-column tablet / 8-column desktop
- **Mega Menu**: Hover dropdowns with subcategories and product thumbnails
- **Product sections**: Grouped by category with "Load more" expand
- **Uncategorized section**: Products without category shown at bottom
- **Blog post carousel**: Latest posts
- **Category filter dropdown**: All Categories, individual categories, subcategories, Uncategorized
- **Search**: Real-time product search
- **Footer**: Custom footer columns, social links, contact info

#### 4.4.2 Product Detail Page (`/shop/{slug}/product/{productId}`)
- **Separate page** (not modal) — Android/iOS back button works correctly
- Image gallery with thumbnails
- **Video support**: YouTube + TikTok embedded players
- Product info: Name, price, SKU, category, description
- **Add to Cart** button
- **Share** button (Web Share API or clipboard copy)
- **Related products** grid with add-to-cart buttons
- **Back button** returns to shop home page

#### 4.4.3 Single Category Page (`/shop/{slug}/category/{categoryId}`)
- All products in the selected category
- Scroll to top on navigation
- Back to shop link

#### 4.4.4 Shopping Cart & Checkout
- **Floating cart icon** with item count badge
- Cart sidebar/modal: Product image, name, price, quantity controls, remove
- **Voucher code application**: Enter code → validate → apply discount
- **Checkout form**: Customer name, phone, address, note
- **Agent referral tracking**: `?ref=` parameter stored in sessionStorage, attached to order
- Order confirmation

#### 4.4.5 Bottom Navigation Bar
- **5 buttons** with labels (both mobile and desktop):
  - Call (tel: link)
  - Message (Zalo link)
  - Map (Google Maps URL or address search)
  - Save Contact (VCF download)
  - Categories (popup menu with parent categories → links to single category pages)
- **Desktop**: Floating pill style
- **Mobile**: Full-width fixed bottom bar

#### 4.4.6 Expired Shop Handling
- **Undismissable popup** when shop's `expiry_date` is past
- Shows: "Cửa hàng đã hết hạn" message
- **Contact options**: Phone button (0965784668) + Zalo OA button (zalo.me/proidvn)
- Cannot be closed — shop is completely inaccessible

### 4.5 Agent Dashboard (`/agent`)
- Agent login (separate from shop owner)
- Sales overview: Total sales amount, order count
- Recent agent sales list

### 4.6 SSR Open Graph Meta Tags
- **Dynamic OG tags** via FastAPI HTML responses for social sharing crawlers
- Routes: `/og/shop/{slug}`, `/og/card/{card_slug}`, `/og/shop/{slug}/product/{product_id}`
- Renders proper title, description, image for Facebook/Zalo/Twitter link previews

---

## 5. Security Features

| Feature | Details |
|---------|---------|
| Rate Limiting | Global: 120 req/min, Auth: 10/min, Orders: 15/min, Contact: 5/5min, Register: 3/5min. **Public GET requests excluded** (storefront, files, business cards) |
| Brute Force Protection | 50 failed login attempts → 15-min lockout per IP:email |
| XSS Sanitization | `bleach` library strips dangerous HTML tags on all user inputs (products, posts, orders, contact forms) |
| Content Word Limit | 1000 words max for product descriptions and blog posts (frontend counter + backend validation) |
| Security Headers | X-Content-Type-Options, X-Frame-Options, X-XSS-Protection, Referrer-Policy, Permissions-Policy |
| Request Size Limit | 10MB max payload |
| Input Sanitization | Customer names, addresses, contact messages, user names cleaned of HTML |
| JWT Auth | Access token + refresh token with HttpOnly cookies |
| Password Hashing | bcrypt |
| Dynamic Config | All security settings stored in MongoDB `settings` collection, editable from Security Dashboard, applied immediately |

---

## 6. Database Schema (MongoDB Collections)

### `users`
```json
{ "_id", "email", "password_hash", "name", "phone", "role" ("super_admin"|"sub_admin"|"shop_owner"), "shop_id", "status" ("active"|"blocked"), "created_at" }
```

### `shops`
```json
{ "_id", "name", "slug", "description", "contact_phone", "contact_email", "address", "google_map_url", "theme_color", "logo_url", "status" ("active"|"suspended"), "expiry_date", "max_products", "max_posts", "max_pages", "max_categories", "max_agents", "max_images", "agents_enabled", "banners", "menu_items", "mega_menu_categories", "layout_sections", "footer_columns", "social_facebook", "social_instagram", "custom_domain", "owner_id", "created_at" }
```

### `products`
```json
{ "id", "shop_id", "name", "price", "description", "image_url", "images" [], "video_url", "video_links" [], "category_id", "category", "sku", "position", "is_active", "created_at" }
```

### `categories`
```json
{ "id", "shop_id", "name", "description", "image_url", "parent_id" (null for parent), "position", "created_at" }
```

### `orders`
```json
{ "id", "shop_id", "customer_name", "customer_phone", "customer_address", "note", "items" [{ "product_id", "name", "price", "quantity", "image_url" }], "total", "status" ("pending"|"confirmed"|"completed"|"cancelled"), "agent_tracking_code", "voucher_code", "discount_amount", "created_at" }
```

### `vouchers`
```json
{ "id", "shop_id", "code", "discount_type" ("percentage"|"fixed"), "discount_value", "min_order_amount", "max_uses", "used_count", "applicable_products" [], "expiry_date", "is_active", "created_at" }
```

### `agents`
```json
{ "id", "shop_id", "name", "email", "password_hash", "phone", "level" (1|2|3), "parent_agent_id", "tracking_code", "is_active", "created_at" }
```

### `agent_sales`
```json
{ "shop_id", "agent_id", "order_id", "amount", "created_at" }
```

### `business_cards`
```json
{ "shop_id", "slug", "display_name", "title", "avatar_url", "logo_url", "phone", "email", "selected_products" [], "owner_id", "owner_type" }
```

### `posts`
```json
{ "id", "shop_id", "title", "description" (HTML), "thumbnail", "created_at" }
```

### `pages`
```json
{ "id", "shop_id", "title", "slug", "content" (HTML), "created_at" }
```

### `files`
```json
{ "id", "shop_id", "url", "filename", "content_type", "size", "is_deleted", "created_at" }
```

### `settings`
```json
{ "key": "security_config", "value": { "rate_global", "rate_auth", "rate_orders", "rate_contact", "rate_register", "brute_force_max", "brute_force_window", "max_body_mb", "content_word_limit" } }
```

---

## 7. API Endpoints Summary

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/login` | Login (returns JWT + sets cookies) |
| POST | `/api/auth/register` | Register new user |
| GET | `/api/auth/me` | Get current user |
| POST | `/api/auth/refresh` | Refresh access token |
| POST | `/api/auth/forgot-password` | Request password reset |
| POST | `/api/auth/reset-password` | Reset password with token |
| POST | `/api/auth/change-password` | Change password (no old password needed) |

### Super Admin
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/stats` | System statistics |
| GET | `/api/admin/users` | All users with shop details |
| POST | `/api/admin/users` | Create shop owner |
| PUT | `/api/admin/users/{id}` | Edit user (name, email, phone, shop_name) |
| POST | `/api/admin/users/{id}/reset-password` | Reset to iLoveProID@ |
| POST | `/api/admin/users/{id}/block` | Block/unblock user |
| DELETE | `/api/admin/users/{id}` | Delete user + shop + all data |
| POST | `/api/admin/users/{id}/send-login-email` | Send login credentials email |
| POST | `/api/admin/users/bulk` | Bulk create users |
| GET | `/api/admin/shops` | All shops with counts |
| POST | `/api/admin/shops/{id}/expiry` | Set shop expiry date |
| PUT | `/api/admin/shops/{id}/limits` | Set shop limits (products, posts, pages, categories, agents, images) |
| PUT | `/api/admin/shops/{id}/agents-toggle` | Enable/disable agents |
| GET | `/api/admin/security/dashboard` | Security metrics |
| PUT | `/api/admin/security/config` | Update security configuration |

### Shop Owner Dashboard
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET/PUT | `/api/dashboard/shop` | Shop info |
| GET/POST | `/api/dashboard/products` | Products CRUD |
| PUT/DELETE | `/api/dashboard/products/{id}` | Product update/delete |
| GET/POST | `/api/dashboard/categories` | Categories CRUD |
| PUT | `/api/dashboard/categories/positions` | Reorder categories |
| PUT/DELETE | `/api/dashboard/categories/{id}` | Category update/delete |
| GET/PUT | `/api/dashboard/orders` | Orders management |
| PUT | `/api/dashboard/orders/{id}/status` | Update order status |
| GET/POST | `/api/dashboard/posts` | Blog posts CRUD |
| PUT/DELETE | `/api/dashboard/posts/{id}` | Post update/delete |
| GET/POST | `/api/dashboard/pages` | Custom pages CRUD |
| PUT/DELETE | `/api/dashboard/pages/{id}` | Page update/delete |
| GET/POST | `/api/dashboard/vouchers` | Vouchers CRUD |
| PUT/DELETE | `/api/dashboard/vouchers/{id}` | Voucher update/delete |
| GET/POST | `/api/dashboard/agents` | Agents CRUD |
| GET/PUT | `/api/dashboard/mega-menu` | Mega menu config |
| GET/POST | `/api/dashboard/media` | Media library |
| POST | `/api/dashboard/upload` | Image upload (R2) |

### Public Storefront
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/shop/{slug}` | Shop data (includes expiry_date, google_map_url) |
| GET | `/api/shop/{slug}/products` | All products |
| GET | `/api/shop/{slug}/categories` | All categories |
| POST | `/api/shop/{slug}/orders` | Place order (with agent tracking + voucher) |
| POST | `/api/shop/{slug}/voucher/validate` | Validate voucher code |
| POST | `/api/shop/{slug}/contact` | Contact form submission |
| GET | `/api/card/{slug}` | Business card data |

### SSR (for social media crawlers)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/og/shop/{slug}` | OG meta tags for shop |
| GET | `/og/card/{slug}` | OG meta tags for business card |
| GET | `/og/shop/{slug}/product/{id}` | OG meta tags for product |

---

## 8. File Structure

```
/app/
├── backend/
│   ├── server.py           # Monolithic FastAPI (all APIs, auth, middleware, SSR)
│   ├── seed_data.py         # Database seeding
│   ├── requirements.txt     # Python dependencies
│   └── .env                 # MONGO_URL, DB_NAME, JWT keys, R2 keys, Resend, VAPID
│
├── frontend/
│   ├── public/
│   │   ├── proid-logo.png       # Platform logo
│   │   ├── product-fallback.png # Product fallback image
│   │   └── index.html
│   ├── src/
│   │   ├── App.js               # Routes definition
│   │   ├── context/
│   │   │   ├── AuthContext.js    # Auth state, login/logout, role routing
│   │   │   ├── CartContext.js    # Shopping cart state
│   │   │   └── LanguageContext.js
│   │   ├── pages/
│   │   │   ├── LoginPage.js          # Login/Register/Forgot password
│   │   │   ├── SuperAdminDashboard.js # Admin panel (users, security, settings)
│   │   │   ├── ShopOwnerDashboard.js  # Shop management (products, orders, etc.)
│   │   │   ├── StorefrontPage.js      # Public shop homepage
│   │   │   ├── ProductDetailPage.js   # Product detail (separate page)
│   │   │   ├── SingleCategoryPage.js  # Category products page
│   │   │   ├── AgentDashboard.js      # Agent portal
│   │   │   └── BusinessCardPage.js    # Digital business card
│   │   ├── utils/
│   │   │   ├── i18n.js           # Vietnamese/English translations
│   │   │   └── format.js         # Utility functions
│   │   └── components/ui/        # Shadcn UI components
│   └── .env                      # REACT_APP_BACKEND_URL
│
└── memory/
    ├── PRD.md                    # Product requirements
    └── test_credentials.md       # Test account credentials
```

---

## 9. Environment Variables

### Backend (`/app/backend/.env`)
| Variable | Description |
|----------|-------------|
| `MONGO_URL` | MongoDB connection string |
| `DB_NAME` | Database name |
| `JWT_SECRET` | JWT signing secret |
| `JWT_REFRESH_SECRET` | Refresh token secret |
| `R2_ACCESS_KEY` | Cloudflare R2 access key |
| `R2_SECRET_KEY` | Cloudflare R2 secret key |
| `R2_BUCKET` | R2 bucket name |
| `R2_ENDPOINT` | R2 endpoint URL |
| `R2_PUBLIC_URL` | R2 public URL for image access |
| `RESEND_API_KEY` | Resend email API key |
| `SENDER_EMAIL` | From email address |
| `VAPID_PRIVATE_KEY` | Push notification private key |
| `VAPID_PUBLIC_KEY` | Push notification public key |
| `FRONTEND_URL` | Frontend URL (for emails, CORS) |
| `CORS_ORIGINS` | CORS allowed origins (`*` for all) |
| `ADMIN_EMAIL` | Default super admin email |
| `ADMIN_PASSWORD` | Default super admin password |

### Frontend (`/app/frontend/.env`)
| Variable | Description |
|----------|-------------|
| `REACT_APP_BACKEND_URL` | Backend API base URL |

---

## 10. Known Technical Debt & Refactoring Needed

| File | Lines | Issue |
|------|-------|-------|
| `server.py` | ~2800 | Monolithic — should be split into route modules (`/routes/auth.py`, `/routes/admin.py`, `/routes/dashboard.py`, `/routes/public.py`) |
| `ShopOwnerDashboard.js` | ~3860 | Too large — should be split into tab components (`ProductsTab.js`, `OrdersTab.js`, etc.) |
| `StorefrontPage.js` | ~1500 | Large — could extract `MegaMenu`, `CategorySection`, `BottomBar` into components |

---

## 11. Deployment

- **Preview**: Emergent platform preview environment (built-in MongoDB)
- **Production**: Emergent deployment with custom domain `shop.proid.vn`
- **Database**: Supports both built-in MongoDB (preview) and external MongoDB Atlas (production)
- **System Keys** (production): Set `MONGO_URL`, `DB_NAME`, `REACT_APP_BACKEND_URL` in Emergent deployment settings

---

## 12. Test Credentials

| Role | Email | Password |
|------|-------|----------|
| Super Admin | daominhhai129@gmail.com | admin123 |
| Shop Owner (demo) | fashion@proid.vn | iLoveProID@ |
| Default password for new users | — | iLoveProID@ |
