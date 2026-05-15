# E-Commerce MVP — Full Architecture Plan

## 1. High-Level Architecture

```
┌─────────────────────────────────────────────────────┐
│                    Next.js App                       │
│  ┌─────────────────────────────────────────────┐    │
│  │           App Router (Pages)                 │    │
│  │  / → /products → /cart → /checkout → /orders│    │
│  │  /admin/products → /admin/orders            │    │
│  └──────────────┬──────────────────────────────┘    │
│                 │                                    │
│  ┌──────────────▼──────────────────────────────┐    │
│  │        API Routes (Route Handlers)           │    │
│  │  /api/products  /api/cart  /api/checkout    │    │
│  │  /api/orders    /api/auth  /api/webhook      │    │
│  └──────────────┬──────────────────────────────┘    │
│                 │                                    │
│  ┌──────────────▼──────────────────────────────┐    │
│  │              Server Actions / RSCs           │    │
│  └──────────────┬──────────────────────────────┘    │
└─────────────────┼───────────────────────────────────┘
                  │
┌─────────────────▼───────────────────────────────────┐
│                  Prisma ORM                          │
│  ┌──────────────▼──────────────────────────────┐    │
│  │            PostgreSQL Database               │    │
│  │  User | Product | Cart | CartItem           │    │
│  │  Order | OrderItem                          │    │
│  └─────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────┘
                  │
┌─────────────────▼───────────────────────────────────┐
│               Stripe (Payment Provider)              │
│  PaymentIntent → Checkout Session → Webhook         │
└─────────────────────────────────────────────────────┘
```

**Pattern:** Monolithic Next.js app with App Router. All backend logic lives inside Next.js API routes and Server Actions. Prisma connects to a single PostgreSQL instance. Stripe handles payment.

## 2. Tech Stack (Exact Packages)

| Layer | Package | Version (approx) |
|-------|---------|-------------------|
| Framework | next | 14.x |
| React | react / react-dom | 18.x |
| Database ORM | @prisma/client + prisma | 5.x |
| Auth | next-auth | 4.x |
| Payment | stripe | 14.x |
| UI | tailwindcss + @radix-ui/* + lucide-react | latest |
| Forms | react-hook-form + @hookform/resolvers + zod | latest |
| Validation | zod | 3.x |
| Styling | tailwindcss + clsx + tailwind-merge | latest |
| Tables (admin) | @tanstack/react-table | 8.x |
| Toasts | sonner | latest |

## 3. Directory Structure

```
├── prisma/
│   ├── schema.prisma
│   ├── seed.ts
│   └── migrations/
├── public/
│   └── images/
├── src/
│   ├── app/
│   │   ├── layout.tsx                    # Root layout, providers
│   │   ├── page.tsx                      # Home / landing
│   │   ├── globals.css                   # Tailwind entry
│   │   ├── products/
│   │   │   ├── page.tsx                  # Product listing
│   │   │   └── [id]/
│   │   │       └── page.tsx              # Product detail
│   │   ├── cart/
│   │   │   └── page.tsx                  # Shopping cart
│   │   ├── checkout/
│   │   │   ├── page.tsx                  # Stripe checkout form
│   │   │   └── success/
│   │   │       └── page.tsx              # Post-payment success
│   │   ├── orders/
│   │   │   └── page.tsx                  # Order history
│   │   ├── admin/
│   │   │   ├── layout.tsx                # Admin layout (auth guard)
│   │   │   ├── page.tsx                  # Admin dashboard
│   │   │   ├── products/
│   │   │   │   ├── page.tsx              # Product management table
│   │   │   │   ├── new/
│   │   │   │   │   └── page.tsx          # Create product form
│   │   │   │   └── [id]/
│   │   │   │       └── edit/
│   │   │   │           └── page.tsx      # Edit product form
│   │   │   └── orders/
│   │   │       └── page.tsx              # Admin order management
│   │   ├── api/
│   │   │   ├── auth/
│   │   │   │   └── [...nextauth]/
│   │   │   │       └── route.ts          # NextAuth handler
│   │   │   ├── products/
│   │   │   │   ├── route.ts              # GET (list) / POST (create)
│   │   │   │   └── [id]/
│   │   │   │       └── route.ts          # GET / PUT / DELETE
│   │   │   ├── cart/
│   │   │   │   └── route.ts              # GET / POST / PUT / DELETE
│   │   │   ├── checkout/
│   │   │   │   └── route.ts              # POST → Stripe session
│   │   │   ├── webhook/
│   │   │   │   └── route.ts              # Stripe webhook handler
│   │   │   └── orders/
│   │   │       └── route.ts              # GET (user's orders)
│   │   └── auth/
│   │       ├── signin/
│   │       │   └── page.tsx
│   │       └── signup/
│   │           └── page.tsx
│   ├── components/
│   │   ├── ui/                           # shadcn primitives
│   │   │   ├── button.tsx
│   │   │   ├── input.tsx
│   │   │   ├── card.tsx
│   │   │   ├── badge.tsx
│   │   │   ├── table.tsx
│   │   │   ├── dialog.tsx
│   │   │   ├── select.tsx
│   │   │   └── toast.tsx
│   │   ├── layout/
│   │   │   ├── header.tsx
│   │   │   ├── footer.tsx
│   │   │   └── admin-sidebar.tsx
│   │   ├── product/
│   │   │   ├── product-card.tsx
│   │   │   ├── product-grid.tsx
│   │   │   └── product-form.tsx
│   │   ├── cart/
│   │   │   ├── cart-item.tsx
│   │   │   └── cart-summary.tsx
│   │   └── providers/
│   │       ├── session-provider.tsx
│   │       └── cart-provider.tsx
│   ├── lib/
│   │   ├── prisma.ts                     # Prisma client singleton
│   │   ├── stripe.ts                     # Stripe client
│   │   ├── auth.ts                       # NextAuth config
│   │   └── utils.ts                      # cn(), formatPrice(), etc.
│   ├── actions/
│   │   ├── cart.ts                       # Server Actions for cart
│   │   └── checkout.ts                   # Server Actions for checkout
│   └── types/
│       └── index.ts                      # Shared TS types
├── .env.local
├── next.config.js
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

## 4. Key Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Auth | next-auth (credentials provider) | Simple, well-supported, fits MVP scope |
| Cart | Server-managed (DB-backed) | Persists across sessions, unlike localStorage-only |
| Payments | Stripe Checkout Sessions | Hosted UI, secure, minimal PCI scope |
| Forms | react-hook-form + zod | Type-safe, performant, great DX |
| Styling | Tailwind + shadcn/ui | Rapid development, accessible, customizable |
| State (client) | React Context (cart) | Lightweight, no extra deps for MVP |
| Server state | RSCs + Server Actions | Minimize client JS, use Next.js 14 patterns |
| Image hosting | Public `/images` or external URL | MVP simplicity; swap for S3 later |
