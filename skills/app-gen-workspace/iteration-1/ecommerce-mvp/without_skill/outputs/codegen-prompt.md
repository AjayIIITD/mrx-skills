# Codegen Prompt — E-Commerce MVP

> Use this prompt to generate the full Next.js 14 e-commerce application. Copy the entire prompt below into an LLM.

---

```
You are building a complete e-commerce MVP. Generate every file listed below. Use the exact directory structure and package versions specified. Do not skip any file.

## Tech Stack
- Next.js 14 (App Router), React 18
- Prisma 5 + PostgreSQL
- NextAuth 4 (Credentials provider)
- Stripe (Checkout Sessions + Webhooks)
- Tailwind CSS + shadcn/ui primitives
- react-hook-form + zod for forms
- sonner for toasts
- @tanstack/react-table for admin tables
- lucide-react for icons
- bcrypt for password hashing

## Project Setup
1. `npx create-next-app@latest ecommerce-mvp --typescript --tailwind --eslint --app --src-dir`
2. `cd ecommerce-mvp && npm install prisma @prisma/client next-auth@beta @auth/prisma-adapter stripe react-hook-form @hookform/resolvers zod sonner @tanstack/react-table lucide-react bcryptjs clsx tailwind-merge`
3. `npm install -D @types/bcryptjs`
4. `npx prisma init`

## Database Schema (prisma/schema.prisma)
Use this exact schema:
- User (id, email, name, passwordHash, role: ADMIN|CUSTOMER, createdAt, updatedAt)
- Product (id, name, description, price IN CENTS Int, compareAtPrice Int?, imageUrl String?, stock Int, isPublished Boolean default false, timestamps)
- Cart (id, userId unique FK→User, timestamps)
- CartItem (id, cartId FK→Cart, productId FK→Product, quantity Int, @@unique([cartId, productId]))
- Order (id, userId FK→User, stripePaymentIntentId String? unique, stripeSessionId String? unique, status String default PENDING, total Int, timestamps)
- OrderItem (id, orderId FK→Order, productId FK→Product, quantity Int, price Int)
- NextAuth models: Account, Session, VerificationToken

All IDs are cuid(). Use @db.Text for refresh/access tokens in Account.

## Environment (.env.local)
```
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/ecommerce_mvp"
NEXTAUTH_SECRET="your-secret-here-change-in-production"
NEXTAUTH_URL="http://localhost:3000"
STRIPE_SECRET_KEY="sk_test_..."
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
```

## Files to Generate (EXACT PATHS)

### 1. src/lib/prisma.ts
- PrismaClient singleton (prevent hot-reload duplications)
- Export `prisma` as default

### 2. src/lib/stripe.ts
- Initialize Stripe with STRIPE_SECRET_KEY
- Export `stripe`

### 3. src/lib/auth.ts
- NextAuth config with CredentialsProvider
- authorize(): find user by email, compare password with bcrypt
- pages: { signIn: "/auth/signin" }
- adapter: PrismaAdapter
- session strategy: jwt
- callbacks: jwt (pass role), session (merge role into session.user)
- Export { auth, signIn, signOut, handlers }

### 4. src/lib/utils.ts
- `cn()` using clsx + tailwind-merge
- `formatPrice(cents: number): string` → "$12.99"
- `slugify(str: string): string`

### 5. src/types/index.ts
```typescript
export interface CartItemWithProduct {
  id: string
  quantity: number
  product: {
    id: string
    name: string
    price: number
    imageUrl: string | null
  }
}

export interface CartWithItems {
  id: string
  items: CartItemWithProduct[]
}

export type OrderStatus = "PENDING" | "PAID" | "SHIPPED" | "DELIVERED" | "CANCELLED"
```

### 6. src/app/globals.css
- Tailwind directives (@tailwind base/components/utilities)
- shadcn/ui CSS variables for light/dark

### 7. src/app/layout.tsx
- Root layout with html/lang
- Import globals.css
- Wrap with SessionProvider (next-auth) + CartProvider
- Include <Header />, <main>{children}</main>, <Footer />
- <Toaster /> from sonner

### 8. src/app/page.tsx (Home)
- Hero section: heading "Your Store", subtext, CTA button linking to /products
- Featured products: fetch 4 published products from DB, display in grid using <ProductCard>
- No client components except AddToCartButton inside cards

### 9. src/app/products/page.tsx
- Server component
- Search params: `?search=&minPrice=&maxPrice=&sortBy=price_asc`
- Fetch products with Prisma where: isPublished, name contains search, price gte/lte
- Display results in <ProductGrid>
- Pass URL search params as props to FilterSidebar client component

### 10. src/app/products/[id]/page.tsx
- Server component
- fetch product by id (include: all fields)
- If not found: notFound()
- Display: image, name, description, price, stock badge
- <AddToCartForm /> client component with quantity selector + "Add to Cart" button

### 11. src/app/cart/page.tsx
- Fetch current user's cart with items + product details
- If no session: redirect to /auth/signin
- If cart empty: empty state message
- List items with image, name, price, quantity controls, remove button
- Cart summary: subtotal, "Proceed to Checkout" button
- All interactive elements are client components

### 12. src/app/checkout/page.tsx
- Fetch cart
- Display order summary (read-only)
- "Pay with Stripe" button → calls POST /api/checkout → redirects to Stripe
- Client component for the button

### 13. src/app/checkout/success/page.tsx
- Read `session_id` from search params
- Fetch order by stripeSessionId
- Display success message, order number, total
- Link to /orders

### 14. src/app/orders/page.tsx
- Fetch authenticated user's orders (include items + products)
- Display as card list: order ID, date, status badge, items summary, total
- Status badge colors: PENDING=yellow, PAID=green, SHIPPED=blue, DELIVERED=gray, CANCELLED=red

### 15. src/app/auth/signin/page.tsx
- SignInForm client component
- Email + password inputs
- react-hook-form + zod validation
- On submit: signIn("credentials", { email, password, redirect: true, callbackUrl: "/" })
- Link to /auth/signup
- Error display via URL param `?error=`

### 16. src/app/auth/signup/page.tsx
- SignUpForm client component
- name, email, password, confirmPassword
- Validate with zod (email format, password min 8 chars, confirm match)
- Server action creates user with bcrypt hash, then redirects to /auth/signin
- Link to /auth/signin

### 17. src/app/admin/layout.tsx
- Auth guard: if no session or session.user.role !== "ADMIN", redirect to /
- Sidebar nav: Dashboard, Products, Orders
- Outlet for child pages

### 18. src/app/admin/page.tsx (Dashboard)
- Fetch stats: total orders (today), total revenue (today), total products, low stock count
- Display as 4 stat cards
- Recent 5 orders table

### 19. src/app/admin/products/page.tsx
- Client component (for interactivity)
- Fetch all products (published + unpublished)
- @tanstack/react-table with columns: image, name, price, stock, status, actions
- Actions: edit (link to /admin/products/[id]/edit), delete (with confirm dialog)
- "Add Product" button → link to /admin/products/new
- Search/filter input

### 20. src/app/admin/products/new/page.tsx
- <ProductForm /> client component
- Fields: name, description (textarea), price (cents input), compareAtPrice, imageUrl, stock, isPublished (checkbox)
- Submit: POST /api/products
- On success: toast, redirect to /admin/products
- Validation: zod schema

### 21. src/app/admin/products/[id]/edit/page.tsx
- Fetch product by id
- Pre-populate <ProductForm /> with existing values
- Submit: PUT /api/products/[id]
- On success: toast, redirect to /admin/products

### 22. src/app/admin/orders/page.tsx
- Fetch all orders (include user, items, products)
- @tanstack/react-table
- Columns: order ID (truncated), customer (email), total, status, date
- Status column: dropdown select to update (client component)
- On status change: PUT /api/orders

### 23-27. API Routes

#### src/app/api/auth/[...nextauth]/route.ts
- Export GET/POST from next-auth handlers

#### src/app/api/products/route.ts
- GET: list published products (public) or all (admin). Query params: search, minPrice, maxPrice, sortBy
- POST: create product (admin only). Validate body with zod. Return 201.

#### src/app/api/products/[id]/route.ts
- GET: single product
- PUT: update product (admin only). Validate body.
- DELETE: delete product (admin only). Return 204.

#### src/app/api/cart/route.ts
- GET: get cart with items (auth required). Create cart if none exists.
- POST: add item. If already in cart, increment quantity. Return 200.
- PUT: update item quantity. If quantity ≤ 0, remove item.
- DELETE: remove item by productId query param.

#### src/app/api/checkout/route.ts
- POST: create Stripe Checkout Session
- Calculate total from cart items
- Create Order with status PENDING
- Create Stripe session: line_items from cart, success_url, cancel_url
- Attach metadata: orderId
- Return { url: session.url }

#### src/app/api/webhook/route.ts
- POST: Stripe webhook endpoint
- Verify signature with STRIPE_WEBHOOK_SECRET
- On checkout.session.completed:
  - Update Order status to PAID
  - Set stripePaymentIntentId
  - Decrement each product's stock by ordered quantity
  - Clear user's cart
- Return 200

#### src/app/api/orders/route.ts
- GET: return current user's orders (include items + product). Admin ?all=true returns all.

### 28-35. UI Components (src/components/)

#### src/components/ui/* (shadcn primitives)
Generate these shadcn/ui components using their standard implementations:
- button.tsx
- input.tsx
- card.tsx
- badge.tsx
- table.tsx (with Table, Header, Body, Row, Cell, Head)
- dialog.tsx (with Dialog, DialogContent, DialogTrigger, DialogHeader, DialogTitle, DialogDescription)
- select.tsx
- label.tsx
- textarea.tsx
- checkbox.tsx

#### src/components/providers/session-provider.tsx
- Re-export SessionProvider from next-auth

#### src/components/providers/cart-provider.tsx
```typescript
"use client"
// React Context providing:
// - cartCount: number
// - cart: CartWithItems | null
// - addToCart(productId: string, quantity?: number): Promise<void>
// - updateQuantity(productId: string, quantity: number): Promise<void>
// - removeItem(productId: string): Promise<void>
// - refreshCart(): Promise<void>
// On mount if session exists: fetch GET /api/cart
// After each mutation: re-fetch cart
```

#### src/components/layout/header.tsx
- RSC with client-inserted cart badge
- Logo, nav links, search, auth section
- CartProvider context used for badge count
- Mobile hamburger menu

#### src/components/layout/footer.tsx
- Simple footer with links, copyright

#### src/components/layout/admin-sidebar.tsx
- Sidebar with nav links for admin section
- Collapsible on mobile

#### src/components/product/product-card.tsx
- Card with image, name, price, add-to-cart button
- Receives product as prop
- AddToCartButton is a client component inside

#### src/components/product/product-grid.tsx
- Grid layout (responsive: 1 col mobile, 2 tablet, 3-4 desktop)
- Maps products to <ProductCard>

#### src/components/product/product-form.tsx
- Client component
- Fields: name, description, price (dollars input → convert to cents), compareAtPrice, imageUrl, stock, isPublished
- react-hook-form + zod resolver
- Submit calls API (POST or PUT based on `productId` prop)
- Loading state on submit button

#### src/components/cart/cart-item.tsx
- Single cart item row: image, name, unit price, quantity +/- , line total, remove button
- Quantity update via CartProvider.updateQuantity
- Remove via CartProvider.removeItem

#### src/components/cart/cart-summary.tsx
- Subtotal calculation
- "Proceed to Checkout" button (link or action)

### 36. prisma/seed.ts
- Create admin user: admin@example.com / password123
- Create 8-12 sample products (t-shirts, mugs, hats, etc.) with realistic prices in cents
- Use faker or hardcoded data

## Important Implementation Details

1. **Price in cents**: All prices stored as integers (cents). Display with formatPrice().
2. **Stripe webhook**: Must use raw body. Configure Next.js to disable body parsing for webhook route: `export const config = { api: { bodyParser: false } }`
3. **Server Actions for cart mutations**: In the CartProvider, use fetch() to call API routes, not direct server actions (to keep the pattern consistent for MVP).
4. **Revalidation**: After cart mutations, revalidate the cart page tag. After product changes (admin), revalidate `products` tag.
5. **Auth guards**: Admin routes check session.user.role === "ADMIN". Redirect to / if not authorized.
6. **Error boundaries**: Wrap each page section in error boundaries. API routes return appropriate status codes and error messages.
7. **Loading states**: All pages should have loading.tsx or React.Suspense fallbacks.
8. **Type safety**: Use Prisma-generated types. Do not use `any`.
9. **Responsive design**: All pages work on mobile, tablet, desktop.
10. **Images**: Use next/image with external URLs (placeholder images from via.placeholder.com or picsum.photos during dev).

## Package.json (scripts to add)
```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "db:generate": "prisma generate",
    "db:push": "prisma db push",
    "db:seed": "tsx prisma/seed.ts",
    "db:studio": "prisma studio",
    "lint": "next lint"
  }
}
```

## .gitignore additions
```
# env
.env.local
.env

# prisma
prisma/migrations/
```

## Final Steps (user to run)
1. Create PostgreSQL database: `createdb ecommerce_mvp`
2. `npx prisma migrate dev --name init`
3. `npm run db:seed`
4. `npm run dev`
5. Open http://localhost:3000
6. Admin: http://localhost:3000/admin (admin@example.com / password123)
```

END OF PROMPT — Copy from above into your LLM of choice to generate the full codebase.
