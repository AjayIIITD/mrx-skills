```
You are an expert full-stack developer. Generate a complete, production-ready Next.js e-commerce MVP based on the following spec. The app is a monolith — everything in a single Next.js project.

## Tech Stack
- Next.js 14 (App Router), TypeScript, Tailwind CSS
- Prisma ORM + PostgreSQL
- NextAuth.js v5 (Auth.js) with Credentials provider, JWT strategy
- Stripe Checkout Sessions + Webhook
- Zod for validation

## Getting Started Setup
1. Initialize project: `npx create-next-app@latest ecoshop-mvp --typescript --tailwind --eslint --app --src-dir`
2. Install dependencies:
   - `npm install @prisma/client @auth/prisma-adapter next-auth bcryptjs zod stripe`
   - `npm install -D prisma @types/bcryptjs`
3. Create `.env.local` with:
   - `DATABASE_URL="postgresql://..."` (placeholder)
   - `NEXTAUTH_SECRET="..."` (generate with `openssl rand -base64 32`)
   - `NEXTAUTH_URL="http://localhost:3000"`
   - `STRIPE_SECRET_KEY="sk_test_..."`
   - `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_..."`
   - `STRIPE_WEBHOOK_SECRET="whsec_..."`

## Database Schema
Create `prisma/schema.prisma`:
```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum OrderStatus {
  pending
  processing
  shipped
  delivered
  cancelled
}

model User {
  id           String   @id @default(cuid())
  email        String   @unique @db.VarChar(255)
  passwordHash String   @db.VarChar(255)
  name         String   @db.VarChar(100)
  role         String   @default("customer") @db.VarChar(20)
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
  orders       Order[]
}

model Product {
  id          String    @id @default(cuid())
  name        String    @db.VarChar(200)
  description String    @db.Text
  price       Int
  imageUrl    String    @db.VarChar(500)
  stock       Int       @default(0)
  isPublished Boolean   @default(true)
  deletedAt   DateTime?
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
  orderItems  OrderItem[]
}

model Order {
  id              String      @id @default(cuid())
  userId          String      @db.Uuid
  stripeSessionId String      @unique @db.VarChar(255)
  status          OrderStatus @default(pending)
  total           Int
  createdAt       DateTime    @default(now())
  updatedAt       DateTime    @updatedAt
  user            User        @relation(fields: [userId], references: [id], onDelete: Cascade)
  items           OrderItem[]

  @@index([userId])
  @@index([status, createdAt])
}

model OrderItem {
  id          String @id @default(cuid())
  orderId     String @db.Uuid
  productId   String @db.Uuid
  productName String @db.VarChar(200)
  price       Int
  quantity    Int
  order       Order   @relation(fields: [orderId], references: [id], onDelete: Cascade)
  product     Product @relation(fields: [productId], references: [id], onDelete: Restrict)

  @@index([orderId])
  @@index([productId])
}
```

Create `prisma/seed.ts` to seed an admin user (email: admin@ecoshop.com, password: admin123!, role: admin) and 5 sample products. Add a `prisma` section to package.json: `"prisma": { "seed": "tsx prisma/seed.ts" }`.

## Files to Create (in order)

### Phase 1: Core Infrastructure

**src/lib/prisma.ts** — Prisma client singleton:
```ts
import { PrismaClient } from '@prisma/client'
const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }
export const prisma = globalForPrisma.prisma ?? new PrismaClient()
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
```

**src/lib/auth.ts** — NextAuth config with Credentials provider:
- authorize callback: find user by email, compare bcrypt hash, return user with id/email/name/role
- JWT callback: include user.id and user.role in token
- session callback: pass id and role to session.user
- pages: signIn: '/login'

**src/lib/stripe.ts** — Stripe client init using `new Stripe(process.env.STRIPE_SECRET_KEY!)`

**src/types/index.ts** — TypeScript interfaces for CartItem, CheckoutSession, etc.

**src/schemas/index.ts** — Zod schemas:
- `registerSchema`: { email: z.string().email(), password: z.string().min(8), name: z.string().min(1) }
- `loginSchema`: { email: z.string().email(), password: z.string() }
- `createProductSchema`: { name, description, price (positive int), imageUrl (url), stock (min 0) }
- `checkoutSchema`: { items: array of { productId: string, quantity: number } }

**src/middleware.ts** — Next.js middleware:
- Protect /admin/* routes — redirect to /login if not authenticated
- Protect /checkout/* and /orders/* — redirect to /login if not authenticated

### Phase 2: Services

**src/services/product.service.ts**:
- `listPublished(page, limit, search?)` — paginated, filter by isPublished=true + deletedAt=null
- `getById(id)` — get single product
- `create(data)`, `update(id, data)`, `softDelete(id)` — admin operations
- `listAll()` — admin: all products including soft-deleted

**src/services/checkout.service.ts**:
- `createSession(userId, items)`:
  1. Fetch products from DB to verify they exist and get current prices
  2. Calculate total
  3. Create Stripe Checkout Session with line items
  4. Return session URL
- `handleStripeWebhook(event)`:
  1. Verify signature with `stripe.webhooks.constructEvent`
  2. On `checkout.session.completed`: create Order + OrderItems in DB

**src/services/order.service.ts**:
- `listByUser(userId)` — user's orders
- `getById(id, userId)` — single order (user must own it)
- `listAll()` — admin: all orders
- `updateStatus(id, status)` — admin

### Phase 3: API Routes

Create route handlers in `src/app/api/`:

**src/app/api/auth/[...nextauth]/route.ts** — Export GET/POST from NextAuth handler

**src/app/api/products/route.ts** — GET: call productService.listPublished with query params

**src/app/api/products/[id]/route.ts** — GET: call productService.getById

**src/app/api/checkout/create-session/route.ts** — POST: get session user, validate body with checkoutSchema, call checkoutService.createSession, return { url }

**src/app/api/webhooks/stripe/route.ts** — POST: get raw body, verify Stripe signature, call checkoutService.handleStripeWebhook, return 200

**src/app/api/orders/route.ts** — GET: get session user, call orderService.listByUser

**src/app/api/orders/[id]/route.ts** — GET: get session user, call orderService.getById

**src/app/api/admin/products/route.ts** — GET: verify admin role, call productService.listAll. POST: verify admin role, validate with createProductSchema, call productService.create

**src/app/api/admin/products/[id]/route.ts** — PUT: verify admin role, update product. DELETE: verify admin role, soft delete.

**src/app/api/admin/orders/route.ts** — GET: verify admin role, call orderService.listAll

**src/app/api/admin/orders/[id]/status/route.ts** — PUT: verify admin role, validate status, update

For admin verification in API routes: `const session = await getServerSession(authOptions); if (!session || session.user.role !== 'admin') return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })`

### Phase 4: UI Components

**src/components/ui/Button.tsx** — Polymorphic button with variants: primary (blue-600), secondary (amber-500), ghost, danger. Sizes: sm/md/lg. Loading state with spinner.

**src/components/ui/Input.tsx** — Label + input + error message. Supports text, number, textarea.

**src/components/ui/Badge.tsx** — Color-coded status badge (green=delivered, yellow=pending, etc.)

**src/components/ui/Modal.tsx** — Overlay modal with title, content, confirm/cancel buttons.

**src/components/ui/LoadingSkeleton.tsx** — Animated skeleton for product cards, tables.

**src/components/product/ProductCard.tsx** — Card: image, name, price (formatted as $xx.xx), stock indicator, "Add to Cart" button.

**src/components/product/ProductGrid.tsx** — Responsive grid (2 cols mobile, 3 tablet, 4 desktop) rendering ProductCards.

**src/components/cart/CartItemRow.tsx** — Row: image, name, quantity controls (-/+, remove), line total.

**src/components/cart/CartSummary.tsx** — Subtotal, total, "Proceed to Checkout" button.

**src/components/admin/AdminSidebar.tsx** — Vertical nav: Dashboard, Products, Orders links.

**src/components/admin/ProductForm.tsx** — Form fields: name, description (textarea), price (number div 100 for display), imageUrl, stock. Used for create+edit.

### Phase 5: Pages

**src/app/layout.tsx** — Root layout: html/body with Inter font, SessionProvider wrapper, CartProvider wrapper.

**src/app/page.tsx** (Home) — Search input + ProductGrid fetching from /api/products with search params. Pagination below.

**src/app/products/[id]/page.tsx** — Fetch product from /api/products/[id]. Show image, name, description, price, stock badge, quantity selector + "Add to Cart" button (links to cart page if not authenticated or adds via CartContext).

**src/app/cart/page.tsx** — Read from CartContext, show CartItemRows + CartSummary. "Checkout" button navigates to /checkout.

**src/app/checkout/page.tsx** — Fetch /api/checkout/create-session on mount (POST with cart items from context), then redirect to the returned Stripe URL. Show order summary + loading state while redirecting.

**src/app/checkout/success/page.tsx** — Show success message with order number. Link to /orders.

**src/app/orders/page.tsx** — Fetch /api/orders. List of order cards with status badge, total, date.

**src/app/orders/[id]/page.tsx** — Fetch /api/orders/[id]. Order details with item list.

**src/app/login/page.tsx** — Login form (email, password). Submit calls signIn('credentials'). On success redirect to /.

**src/app/register/page.tsx** — Register form (name, email, password, confirm password). POST to /api/auth/register (create user), then auto signIn.

### Phase 6: Cart Context

Create `src/lib/cart-context.tsx` — React Context for cart state:
- State: `items: { productId, name, price, imageUrl, quantity }[]`
- Actions: `addItem(product, qty)`, `removeItem(productId)`, `updateQuantity(productId, qty)`, `clearCart()`, `getTotal()`
- Persist to localStorage so cart survives page refreshes
- Wrap in CartProvider in root layout

### Phase 7: Admin Pages

**src/app/admin/layout.tsx** — AdminLayout with AdminSidebar + main content area. Verify admin role client-side.

**src/app/admin/page.tsx** — Simple stats overview: total products, total orders, recent orders.

**src/app/admin/products/page.tsx** — Table: image thumb, name, price, stock, actions (edit/delete). Delete shows confirmation modal (soft delete).

**src/app/admin/products/new/page.tsx** — ProductForm. On submit: POST /api/admin/products, redirect to /admin/products.

**src/app/admin/products/[id]/edit/page.tsx** — Fetch existing product, pre-fill ProductForm. On submit: PUT /api/admin/products/[id].

**src/app/admin/orders/page.tsx** — Table: order ID, customer email, items count, total, status (dropdown to change), date. Status change calls PUT /api/admin/orders/[id]/status.

## Important Implementation Details

1. All prices are stored as integers (cents). Display as `$xx.xx` using `(price / 100).toFixed(2)`.
2. Stripe Checkout Sessions use line items with `price_data` (not price IDs) — pass product name, price in cents, currency usd, quantity.
3. Stripe webhook route must use `export const config = { api: { bodyParser: false } }` to get raw body for signature verification.
4. Use `getServerSession(authOptions)` in all API routes, never trust client-side auth for protected operations.
5. Soft deletes: `{ deletedAt: new Date() }` — not actually removing rows.
6. Orders snapshot product name and price at time of purchase (in case product is later modified).
7. Use `revalidatePath` or `router.refresh()` for cache invalidation after mutations.
8. Basic error handling: wrap API handlers in try/catch, return `{ error: { code, message } }`.
9. Seed script uses `bcryptjs.hashSync('admin123!', 10)` for the admin password.

## After Generation
1. Run `npx prisma generate && npx prisma db push && npx prisma db seed`
2. Run `npm run dev` to start the dev server
3. Login as admin: admin@ecoshop.com / admin123!
4. Test: browse products → add to cart → checkout → Stripe test payment → verify order created

Generate all files now. Make each file complete and production-ready.
```
