# EcoShop MVP — Build Plan

## Overview
A simple e-commerce MVP built as a Next.js monolith. Users can browse products, manage a cart, and checkout via Stripe. An admin panel provides product and order management. All data is stored in PostgreSQL via Prisma ORM.

## Tech Stack
- **Frontend**: Next.js 14 (App Router, React Server Components + Client Components)
- **Styling**: Tailwind CSS
- **State**: React Context (cart state, client-side)
- **Backend**: Next.js API Route Handlers (monolith, no separate server)
- **Database**: PostgreSQL + Prisma ORM
- **Auth**: NextAuth.js v5 (Auth.js) with Credentials provider, JWT strategy
- **Payments**: Stripe Checkout Sessions + Webhooks
- **Validation**: Zod schemas
- **Language**: TypeScript
- **Deployment**: Vercel (single project)

## Pages
| Route | Page | Purpose | Auth |
|-------|------|---------|------|
| / | Home / Products | Product listing grid with search | No |
| /products/[id] | Product Detail | Product details + add to cart | No |
| /cart | Cart | View/edit cart, proceed to checkout | No |
| /checkout | Checkout | Review + Stripe payment | Yes |
| /checkout/success | Order Success | Confirmation after payment | Yes |
| /orders | My Orders | Order history | Yes |
| /orders/[id] | Order Detail | Single order details | Yes |
| /login | Login | User login | No |
| /register | Register | User registration | No |
| /admin | Admin Dashboard | Overview stats | Admin |
| /admin/products | Admin Products | Product CRUD table | Admin |
| /admin/products/new | New Product | Add product form | Admin |
| /admin/products/[id]/edit | Edit Product | Edit product form | Admin |
| /admin/orders | Admin Orders | All orders + status mgmt | Admin |

## API Routes
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | /api/products | No | List published products (paginated, searchable) |
| GET | /api/products/[id] | No | Get single product |
| POST | /api/auth/register | No | Register new user |
| POST | /api/auth/login | No | Login, returns session |
| GET | /api/auth/session | No | Get current session |
| POST | /api/checkout/create-session | Yes | Create Stripe Checkout Session |
| POST | /api/webhooks/stripe | No (signed) | Stripe webhook listener |
| GET | /api/orders | Yes | List my orders |
| GET | /api/orders/[id] | Yes | Get order detail |
| GET | /api/admin/products | Admin | List all products (admin view) |
| POST | /api/admin/products | Admin | Create product |
| PUT | /api/admin/products/[id] | Admin | Update product |
| DELETE | /api/admin/products/[id] | Admin | Soft-delete product |
| GET | /api/admin/orders | Admin | List all orders |
| PUT | /api/admin/orders/[id]/status | Admin | Update order status |

## Database Schema

### User
| Field | Type | Notes |
|-------|------|-------|
| id | String (UUID) | Primary key, auto-generated cuid |
| email | String (unique) | VARCHAR(255) |
| passwordHash | String | bcrypt hash |
| name | String | VARCHAR(100) |
| role | String | 'customer' or 'admin', default 'customer' |
| createdAt | DateTime | Auto |
| updatedAt | DateTime | Auto |

### Product
| Field | Type | Notes |
|-------|------|-------|
| id | String (UUID) | Primary key |
| name | String | VARCHAR(200) |
| description | String | TEXT |
| price | Int | In cents (avoid float) |
| imageUrl | String | VARCHAR(500) |
| stock | Int | Default 0 |
| isPublished | Boolean | Default true |
| deletedAt | DateTime? | Soft delete |
| createdAt | DateTime | Auto |
| updatedAt | DateTime | Auto |

### Order
| Field | Type | Notes |
|-------|------|-------|
| id | String (UUID) | Primary key |
| userId | String | FK → User.id |
| stripeSessionId | String (unique) | Stripe session reference |
| status | OrderStatus | Enum: pending, processing, shipped, delivered, cancelled |
| total | Int | In cents |
| createdAt | DateTime | Auto |
| updatedAt | DateTime | Auto |

### OrderItem
| Field | Type | Notes |
|-------|------|-------|
| id | String (UUID) | Primary key |
| orderId | String | FK → Order.id (CASCADE) |
| productId | String | FK → Product.id (RESTRICT) |
| productName | String | Snapshot of product name at purchase |
| price | Int | Snapshot of price in cents |
| quantity | Int | |

### Indexes
- Product: (isPublished, deletedAt) — public listing
- Product: (name) — search
- Order: (userId) — user's orders
- Order: (stripeSessionId) — unique, webhook lookup
- Order: (status, createdAt) — admin filtering
- OrderItem: (orderId) — items per order
- OrderItem: (productId) — orders per product

## File Structure
```
ecoshop-mvp/
├── prisma/
│   ├── schema.prisma       # Database schema
│   └── seed.ts             # Seed data (admin user + sample products)
├── src/
│   ├── app/
│   │   ├── layout.tsx      # Root layout with providers
│   │   ├── page.tsx        # Home / products grid
│   │   ├── products/
│   │   │   └── [id]/page.tsx
│   │   ├── cart/page.tsx
│   │   ├── checkout/
│   │   │   ├── page.tsx
│   │   │   └── success/page.tsx
│   │   ├── orders/
│   │   │   ├── page.tsx
│   │   │   └── [id]/page.tsx
│   │   ├── login/page.tsx
│   │   ├── register/page.tsx
│   │   ├── admin/
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx
│   │   │   ├── products/
│   │   │   │   ├── page.tsx
│   │   │   │   ├── new/page.tsx
│   │   │   │   └── [id]/edit/page.tsx
│   │   │   └── orders/page.tsx
│   │   └── api/
│   │       ├── products/route.ts
│   │       ├── products/[id]/route.ts
│   │       ├── auth/[...nextauth]/route.ts
│   │       ├── checkout/create-session/route.ts
│   │       ├── webhooks/stripe/route.ts
│   │       ├── orders/route.ts
│   │       ├── orders/[id]/route.ts
│   │       └── admin/
│   │           ├── products/route.ts
│   │           ├── products/[id]/route.ts
│   │           ├── orders/route.ts
│   │           └── orders/[id]/status/route.ts
│   ├── components/
│   │   ├── ui/             # Button, Input, Modal, Badge, Table, LoadingSkeleton
│   │   ├── product/        # ProductCard, ProductGrid
│   │   ├── cart/           # CartItemRow, CartSummary
│   │   └── admin/          # AdminSidebar, ProductForm
│   ├── lib/
│   │   ├── prisma.ts       # Prisma client singleton
│   │   ├── stripe.ts       # Stripe SDK init
│   │   └── auth.ts         # NextAuth configuration
│   ├── services/           # Business logic: product, checkout, order services
│   ├── schemas/            # Zod validation schemas
│   ├── types/              # TypeScript type definitions
│   └── middleware.ts       # Next.js middleware for route protection
├── .env.local              # Environment variables
├── tailwind.config.ts
├── tsconfig.json
├── next.config.js
└── package.json
```

## Auth Flow
1. User registers with name + email + password
2. Password hashed with bcrypt, stored in User table with role 'customer'
3. NextAuth.js credentials provider verifies login, issues JWT session
4. API routes use `getServerSession()` to check auth
5. Admin routes check `session.user.role === 'admin'`

## Checkout Flow
1. User adds items to cart (React Context, persisted to localStorage)
2. On checkout, POST /api/checkout/create-session with cart items
3. Server creates Stripe Checkout Session with line items, success_url, cancel_url
4. User redirected to Stripe hosted checkout page
5. Stripe sends webhook `checkout.session.completed` to POST /api/webhooks/stripe
6. Server verifies webhook signature, creates Order + OrderItems in DB
7. User redirected to /checkout/success on completion
