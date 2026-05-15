# Data Flow Diagrams

## 1. Browse → Add to Cart → Checkout

```
User                    Next.js Server                Prisma/DB              Stripe
 │                          │                            │                     │
 │  GET /products           │                            │                     │
 │ ──────────────────────►  │   SELECT * FROM Product    │                     │
 │                          │ ────────────────────────►  │                     │
 │                          │ ◄────────────────────────  │                     │
 │  ◄── ProductGrid RSC ─── │                            │                     │
 │                          │                            │                     │
 │  Click "Add to Cart"     │                            │                     │
 │ ──────────────────────►  │   Server Action: addToCart │                     │
 │                          │   ──► Upsert CartItem      │                     │
 │                          │     ──────────────────►    │                     │
 │                          │ ◄────────────────────────  │                     │
 │  ◄── toast + badge update                            │                     │
 │                          │                            │                     │
 │  GET /cart               │                            │                     │
 │ ──────────────────────►  │   SELECT Cart + Items      │                     │
 │                          │     ──────────────────►    │                     │
 │                          │ ◄────────────────────────  │                     │
 │  ◄── Cart with items ──  │                            │                     │
 │                          │                            │                     │
 │  Click "Checkout"        │                            │                     │
 │ ──────────────────────►  │   POST /api/checkout       │                     │
 │                          │   Create Order (PENDING)   │                     │
 │                          │     ──────────────────►    │                     │
 │                          │   Create Stripe Session    │ ──────────────────► │
 │                          │ ◄── session URL ─────────  │ ◄────────────────── │
 │  ◄── 302 Redirect ────── │                            │                     │
 │                          │                            │                     │
 │  Browser → Stripe Checkout  (user pays)               │                     │
 │                          │                            │                     │
 │                          │   POST /api/webhook        │                     │
 │                          │     (checkout.session.completed)                 │
 │                          │   Update Order → PAID      │                     │
 │                          │     ──────────────────►    │                     │
 │                          │   Decrement stock          │                     │
 │                          │     ──────────────────►    │                     │
 │                          │                            │                     │
 │  Redirect to /checkout/success                        │                     │
```

## 2. Admin: Create / Edit Product

```
Admin                   Next.js Server                Prisma/DB
 │                          │                            │
 │  POST /api/products      │                            │
 │  {name, price, ...}      │                            │
 │ ──────────────────────►  │   Validate with Zod        │
 │                          │   INSERT INTO Product      │
 │                          │     ──────────────────►    │
 │                          │ ◄────────────────────────  │
 │  ◄── 201 Created ─────── │                            │
 │                          │                            │
 │  RevalidatePath(/admin/products)                      │
 │  revalidateTag('products')                            │
```

## 3. Auth Flow

```
User                   Next.js                next-auth              DB
 │                       │                       │                    │
 │ POST /auth/signup     │                       │                    │
 │ {email, password}     │                       │                    │
 │ ────────────────────► │  hash password (bcrypt)│                    │
 │                       │  INSERT User           │ ─────────────────► │
 │                       │ ◄────────────────────  │ ◄───────────────── │
 │ ◄── redirect /signin  │                       │                    │
 │                       │                       │                    │
 │ POST /auth/signin     │                       │                    │
 │ {email, password}     │                       │                    │
 │ ────────────────────► │ ──► credentials       │                    │
 │                       │     authorize()       │                    │
 │                       │     SELECT User        │ ─────────────────► │
 │                       │     compare password   │                    │
 │                       │ ◄── JWT token ───────  │                    │
 │ ◄── session cookie ──  │                       │                    │
```

## 4. Cart Context (Client-side)

```
CartProvider wraps layout
│
├── On mount:
│   GET /api/cart  (if session exists)
│   → setState(cart)
│
├── addToCart(productId, qty):
│   POST /api/cart {productId, quantity}
│   → re-fetch cart → setState
│
├── updateQuantity(productId, qty):
│   PUT /api/cart {productId, quantity}
│   → re-fetch cart → setState
│
├── removeItem(productId):
│   DELETE /api/cart?productId=xxx
│   → re-fetch cart → setState
│
└── cartCount: derived (items.reduce(sum))
```
