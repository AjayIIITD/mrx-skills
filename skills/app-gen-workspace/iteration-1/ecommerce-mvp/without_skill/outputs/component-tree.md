# Component Tree

```
<html> (root-layout.tsx)
├── <SessionProvider>
│   └── <CartProvider>
│       ├── <Header>
│       │   ├── Logo (link to /)
│       │   ├── NavLinks
│       │   │   ├── Products
│       │   │   ├── CartButton (badge with count)
│       │   │   └── Orders
│       │   ├── AuthSection
│       │   │   ├── SignInButton  |  UserMenu
│       │   │   └── AdminLink (if role=ADMIN)
│       │   └── SearchInput (mobile expandable)
│       │
│       ├── <main>  (page content)
│       │   │
│       │   ├── [HomePage]
│       │   │   ├── HeroSection
│       │   │   ├── FeaturedProducts (RSC fetches top products)
│       │   │   │   └── <ProductCard>[] (server-rendered, each with AddToCartButton client)
│       │   │   └── NewsletterSignup
│       │   │
│       │   ├── [ProductsPage]
│       │   │   ├── FilterSidebar (client, URL-controlled)
│       │   │   │   ├── SearchInput
│       │   │   │   ├── PriceRangeSlider
│       │   │   │   └── SortSelect
│       │   │   └── <ProductGrid> (server component)
│       │   │       └── <ProductCard>[]
│       │   │           ├── Image (next/image)
│       │   │           ├── PriceBadge (compareAtPrice sale badge)
│       │   │           └── <AddToCartButton> (client)
│       │   │
│       │   ├── [ProductDetailPage]
│       │   │   ├── ImageGallery
│       │   │   ├── ProductInfo (title, description, price)
│       │   │   └── <AddToCartForm> (client, quantity selector + button)
│       │   │
│       │   ├── [CartPage]
│       │   │   ├── CartItemsList (server-rendered items)
│       │   │   │   └── <CartItemRow> (client, quantity +/- , remove)
│       │   │   └── <CartSummary> (subtotal, tax estimate, CheckoutButton)
│       │   │
│       │   ├── [CheckoutPage]
│       │   │   └── <CheckoutButton> (client → POST /api/checkout → redirect)
│       │   │
│       │   ├── [OrdersPage]
│       │   │   └── <OrderCard>[]
│       │   │       ├── StatusBadge
│       │   │       ├── OrderItems summary
│       │   │       └── Total
│       │   │
│       │   └── [AdminSection]
│       │       ├── <AdminSidebar>
│       │       │   ├── Dashboard
│       │       │   ├── Products
│       │       │   └── Orders
│       │       ├── [DashboardPage]
│       │       │   ├── StatsCard (revenue today, total orders, low stock)
│       │       │   └── RecentOrdersTable
│       │       ├── [AdminProductsPage]
│       │       │   └── <ProductsTable> (client, @tanstack/react-table)
│       │       │       ├── Search, pagination, edit/delete actions
│       │       │       └── <ProductFormDialog>
│       │       ├── [NewProductPage]
│       │       │   └── <ProductForm> (client, react-hook-form + zod)
│       │       └── [AdminOrdersPage]
│       │           └── <OrdersTable>
│       │               └── StatusSelect (client, updates via API)
│       │
│       └── <Footer>
│           ├── Links
│           └── Copyright
│
├── <Toaster> (sonner toast notifications)
└── </CartProvider>
    └── </SessionProvider>
```

## Key State Management

| State | Location | Mechanism |
|-------|----------|-----------|
| Auth session | Root layout | next-auth SessionProvider (React Context) |
| Cart items count | Header CartButton | CartContext (custom React Context) |
| Cart data | CartContext | Fetched from API, cached, invalidated on mutation |
| Product filters | ProductsPage | URL search params (server-preserved) |
| Admin tables | Admin page | @tanstack/react-table client state |
| Form state | ProductForm | react-hook-form + zod resolver |
| Toast notifications | Global | sonner <Toaster> |
