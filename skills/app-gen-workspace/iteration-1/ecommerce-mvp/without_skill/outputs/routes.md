# Routes & API Endpoints

## Public Pages

| Route | Method | Description |
|-------|--------|-------------|
| `/` | GET | Landing page — hero, featured products, CTA |
| `/products` | GET | Product grid with search & filter |
| `/products/[id]` | GET | Single product detail, add-to-cart button |
| `/cart` | GET | Cart items, quantity controls, checkout CTA |
| `/checkout` | GET | Stripe Checkout redirect or embedded form |
| `/checkout/success?session_id=xxx` | GET | Success confirmation page |
| `/orders` | GET | Authenticated user's order history |
| `/auth/signin` | GET | Sign-in form (email + password) |
| `/auth/signup` | GET | Sign-up form |

## Admin Pages (guarded by `AdminGuard`)

| Route | Method | Description |
|-------|--------|-------------|
| `/admin` | GET | Dashboard — summary cards (orders, revenue, products) |
| `/admin/products` | GET | Data table of all products with search |
| `/admin/products/new` | GET | Create product form |
| `/admin/products/[id]/edit` | GET | Edit product form |
| `/admin/orders` | GET | All orders table with status management |

## API Routes

### Auth (`/api/auth/[...nextauth]`)
- `POST /api/auth/callback/credentials` — Sign in
- `GET /api/auth/session` — Get session
- `POST /api/auth/signout` — Sign out

### Products (`/api/products`)
| Method | Auth | Description |
|--------|------|-------------|
| `GET` | Public | List published products. Query: `?search=&minPrice=&maxPrice=&sortBy=` |
| `POST` | Admin | Create product. Body: `{ name, description, price, imageUrl, stock }` |

### Products by ID (`/api/products/[id]`)
| Method | Auth | Description |
|--------|------|-------------|
| `GET` | Public | Get single product with details |
| `PUT` | Admin | Update product fields |
| `DELETE` | Admin | Soft-delete or hard-delete product |

### Cart (`/api/cart`)
| Method | Auth | Description |
|--------|------|-------------|
| `GET` | User | Get current user's cart (with items + products) |
| `POST` | User | Add item: `{ productId, quantity }` |
| `PUT` | User | Update item quantity: `{ productId, quantity }` |
| `DELETE` | User | Remove item: query `?productId=xxx` |

### Checkout (`/api/checkout`)
| Method | Auth | Description |
|--------|------|-------------|
| `POST` | User | Create Stripe Checkout Session. Returns `{ url }` — redirect user there |

### Stripe Webhook (`/api/webhook`)
| Method | Auth | Description |
|--------|------|-------------|
| `POST` | Stripe-signed | Listens for `checkout.session.completed`. Updates order status from PENDING → PAID, decrements stock |

### Orders (`/api/orders`)
| Method | Auth | Description |
|--------|------|-------------|
| `GET` | User | List current user's orders (with items) |
| `GET` | Admin | Query `?all=true` — list all orders |
| `PUT` | Admin | Update order status: `{ status: "SHIPPED" }` |

## Client Component Boundaries

```
Server Component (default)
  └── <ClientComponent>   ← "use client"
        └── <ClientComponent>

Rules:
- Interactive pieces → Client (cart buttons, forms, quantity controls, nav)
- Static content, data fetching → Server (product grid shell, layout, admin tables)
- CartProvider wraps children in root layout (client boundary)
