# The Wi Shop - Multi-Tenant E-commerce Platform PRD

## Project Overview
A multi-tenant e-commerce platform that allows individuals and small businesses to create and manage online storefronts with unique URLs.

## Date: 2026-04-04

## What's Been Implemented

### User Roles & Permissions
- **Super Admin**: Platform owner with full access to manage all shops and users
- **Shop Owner**: Merchant account linked to one unique shop
- **Customer**: Public users who browse and order from storefronts

### Features Implemented

#### Super Admin Dashboard (/admin)
- View platform analytics (total shops, orders, revenue, shop owners)
- View and manage all registered shops
- Block/suspend shops
- View and manage all users
- Create new shop owner accounts
- Block/unblock user accounts
- Delete user accounts

#### Shop Owner Dashboard (/dashboard)
- Dashboard overview with stats (products, orders, pending orders, revenue)
- Product Management: Create, Edit, Delete products
- Category Management: Create, Edit, Delete categories
- Order Management: View orders, update status
- Shop Settings: Edit shop profile, logo, contact info, social links

#### Public Storefront (/shop/:slug)
- Unique URL for each shop (e.g., /shop/the-elite-shop)
- Product catalog with search and category filtering
- Product detail modals
- Shopping cart functionality
- Checkout/order form with customer details
- Contact info display

### Technical Implementation
- **Backend**: FastAPI with MongoDB (multi-tenant data isolation)
- **Frontend**: React with Tailwind CSS, Shadcn UI components
- **Authentication**: JWT tokens with httpOnly cookies
- **Currency**: VND (Vietnamese Dong)
- **Theme**: Blue/White color scheme

## Test Credentials
- **Super Admin**: admin@thewishop.com / admin123
- **Demo Shop Owner**: demo@thewishop.com / demo123
- **Demo Shop URL**: /shop/the-elite-shop

## API Endpoints
- Auth: /api/auth/login, /api/auth/register, /api/auth/logout, /api/auth/me
- Admin: /api/admin/stats, /api/admin/shops, /api/admin/users
- Dashboard: /api/dashboard/stats, /api/dashboard/shop, /api/dashboard/products, /api/dashboard/categories, /api/dashboard/orders
- Public: /api/shop/{slug}, /api/shop/{slug}/products, /api/shop/{slug}/categories, /api/shop/{slug}/orders

## Prioritized Backlog

### P0 (Next Priority)
- Payment integration (Stripe/MoMo for VND)
- Order confirmation emails
- Image upload for products (currently URL-based)

### P1 (High Priority)
- Shop owner onboarding flow (self-registration)
- Analytics dashboard for shop owners
- Inventory management with low stock alerts
- Customer accounts and order history

### P2 (Medium Priority)
- Product variants (size, color)
- Discount codes and promotions
- Reviews and ratings
- Multi-language support

### P3 (Future Enhancements)
- Custom domain support for shops
- Mobile app (React Native)
- Subscription plans for shop tiers
- Bulk product import/export
