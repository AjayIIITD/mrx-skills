```
You are a full-stack developer. Generate the complete codebase for "SafeRoam" — a women safety web app for Delhi.

## Tech Stack
- Frontend: React 18 + Vite + Tailwind CSS 3 + Leaflet (react-leaflet) + React Router v6 + Axios
- Backend: Node.js 20 + Express 4 + JavaScript (ESM modules)
- Database: PostgreSQL 16 + Prisma ORM
- Auth: JWT (bcryptjs + jsonwebtoken)
- SMS: Twilio API
- Email: Nodemailer
- Geofencing: @turf/turf

## Step 1: Backend Setup

Create `backend/package.json`:
```json
{
  "name": "saferoam-backend",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "node --watch server.js",
    "start": "node server.js",
    "db:push": "npx prisma db push",
    "db:seed": "node prisma/seed.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "@prisma/client": "^5.10.0",
    "bcryptjs": "^2.4.3",
    "jsonwebtoken": "^9.0.2",
    "express-validator": "^7.0.1",
    "express-rate-limit": "^7.1.5",
    "cors": "^2.8.5",
    "helmet": "^7.1.0",
    "twilio": "^4.23.0",
    "nodemailer": "^6.9.8",
    "@turf/turf": "^6.5.0",
    "dotenv": "^16.4.1"
  },
  "devDependencies": {
    "prisma": "^5.10.0"
  }
}
```

Create `backend/.env.example`:
```
PORT=3001
DATABASE_URL=postgresql://user:pass@localhost:5432/saferoam
JWT_SECRET=your-secret-key-change-in-production
TWILIO_ACCOUNT_SID=your-twilio-sid
TWILIO_AUTH_TOKEN=your-twilio-token
TWILIO_PHONE_NUMBER=+1234567890
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
FRONTEND_URL=http://localhost:5173
```

Create `backend/prisma/schema.prisma` with these 8 models:

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum SosStatus {
  dispatched
  resolved
  false_alarm
}

enum TrackStatus {
  active
  completed
  cancelled
}

enum ZoneStatus {
  safe
  caution
  unsafe
}

enum AlertType {
  zone_entry
  zone_exit
  deviation
  prolonged_stay
}

enum NotificationStatus {
  pending
  delivered
  failed
}

model User {
  id            String   @id @default(uuid()) @db.Uuid
  name          String   @db.VarChar(100)
  email         String   @unique @db.VarChar(255)
  passwordHash  String   @map("password_hash") @db.VarChar(255)
  phone         String?  @db.VarChar(20)
  avatarUrl     String?  @map("avatar_url") @db.Text
  createdAt     DateTime @default(now()) @map("created_at") @db.Timestamptz
  updatedAt     DateTime @updatedAt @map("updated_at") @db.Timestamptz
  deletedAt     DateTime? @map("deleted_at") @db.Timestamptz

  emergencyContacts EmergencyContact[]
  sosAlerts         SosAlert[]
  tracks            Track[]

  @@map("users")
}

model EmergencyContact {
  id           String   @id @default(uuid()) @db.Uuid
  userId       String   @map("user_id") @db.Uuid
  name         String   @db.VarChar(100)
  phone        String   @db.VarChar(20)
  email        String?  @db.VarChar(255)
  relationship String?  @db.VarChar(50)
  createdAt    DateTime @default(now()) @map("created_at") @db.Timestamptz
  updatedAt    DateTime @updatedAt @map("updated_at") @db.Timestamptz

  user       User              @relation(fields: [userId], references: [id], onDelete: Cascade)
  sosNotifications SosNotification[]

  @@index([userId])
  @@map("emergency_contacts")
}

model SosAlert {
  id               String     @id @default(uuid()) @db.Uuid
  userId           String     @map("user_id") @db.Uuid
  latitude         Decimal    @db.Decimal(10, 7)
  longitude        Decimal    @db.Decimal(10, 7)
  message          String?    @db.Text
  status           SosStatus  @default(dispatched)
  contactsNotified Int        @default(0) @map("contacts_notified")
  resolvedAt       DateTime?  @map("resolved_at") @db.Timestamptz
  createdAt        DateTime   @default(now()) @map("created_at") @db.Timestamptz

  user            User              @relation(fields: [userId], references: [id], onDelete: Cascade)
  sosNotifications SosNotification[]

  @@index([userId, createdAt])
  @@index([status])
  @@map("sos_alerts")
}

model SosNotification {
  id          String             @id @default(uuid()) @db.Uuid
  sosAlertId  String             @map("sos_alert_id") @db.Uuid
  contactId   String             @map("contact_id") @db.Uuid
  channel     String             @db.VarChar(10)
  status      NotificationStatus @default(pending)
  deliveredAt DateTime?          @map("delivered_at") @db.Timestamptz
  createdAt   DateTime           @default(now()) @map("created_at") @db.Timestamptz

  sosAlert SosAlert          @relation(fields: [sosAlertId], references: [id], onDelete: Cascade)
  contact  EmergencyContact  @relation(fields: [contactId], references: [id], onDelete: Cascade)

  @@index([sosAlertId])
  @@index([status])
  @@map("sos_notifications")
}

model Track {
  id              String      @id @default(uuid()) @db.Uuid
  userId          String      @map("user_id") @db.Uuid
  startLat        Decimal     @map("start_lat") @db.Decimal(10, 7)
  startLng        Decimal     @map("start_lng") @db.Decimal(10, 7)
  endLat          Decimal     @map("end_lat") @db.Decimal(10, 7)
  endLng          Decimal     @map("end_lng") @db.Decimal(10, 7)
  destinationName String?     @map("destination_name") @db.VarChar(200)
  status          TrackStatus @default(active)
  startedAt       DateTime    @default(now()) @map("started_at") @db.Timestamptz
  endedAt         DateTime?   @map("ended_at") @db.Timestamptz
  updatedAt       DateTime    @updatedAt @map("updated_at") @db.Timestamptz

  user           User           @relation(fields: [userId], references: [id], onDelete: Cascade)
  trackLocations TrackLocation[]
  trackAlerts    TrackAlert[]

  @@index([userId, startedAt])
  @@index([status])
  @@map("tracks")
}

model TrackLocation {
  id         BigInt     @id @default(autoincrement())
  trackId    String     @map("track_id") @db.Uuid
  latitude   Decimal    @db.Decimal(10, 7)
  longitude  Decimal    @db.Decimal(10, 7)
  zoneStatus ZoneStatus @default(safe) @map("zone_status")
  recordedAt DateTime   @default(now()) @map("recorded_at") @db.Timestamptz

  track Track @relation(fields: [trackId], references: [id], onDelete: Cascade)

  @@index([trackId, recordedAt])
  @@index([zoneStatus])
  @@map("track_locations")
}

model TrackAlert {
  id             String    @id @default(uuid()) @db.Uuid
  trackId        String    @map("track_id") @db.Uuid
  alertType      AlertType @map("alert_type")
  latitude       Decimal?  @db.Decimal(10, 7)
  longitude      Decimal?  @db.Decimal(10, 7)
  message        String    @db.Text
  acknowledged   Boolean   @default(false)
  acknowledgedAt DateTime? @map("acknowledged_at") @db.Timestamptz
  createdAt      DateTime  @default(now()) @map("created_at") @db.Timestamptz

  track Track @relation(fields: [trackId], references: [id], onDelete: Cascade)

  @@index([trackId, createdAt])
  @@index([acknowledged])
  @@map("track_alerts")
}

model SafeZone {
  id          String     @id @default(uuid()) @db.Uuid
  name        String     @db.VarChar(200)
  zoneType    ZoneStatus @map("zone_type")
  description String?    @db.Text
  polygon     Json       @db.JsonB
  isActive    Boolean    @default(true) @map("is_active")
  createdAt   DateTime   @default(now()) @map("created_at") @db.Timestamptz
  updatedAt   DateTime   @updatedAt @map("updated_at") @db.Timestamptz

  @@index([zoneType, isActive])
  @@map("safe_zones")
}
```

Create `backend/prisma/seed.js` with 7 seed safe zones for Delhi (Connaught Place, India Gate, Saket as 'safe'; Dwarka sector 6-12, Old Delhi as 'caution'; Mahipalpur, Najafgarh as 'unsafe' — each with approximate polygon coordinates as JSONB).

Create `backend/server.js`:
- Import express, cors, helmet, dotenv
- Configure CORS with FRONTEND_URL origin
- Apply helmet, express.json(), rate-limiter
- Mount all 6 route files under /api
- Global error handler
- Listen on PORT (default 3001)

Create all middleware files:
- `src/middleware/auth.js` — extract JWT from Authorization Bearer header, verify with jsonwebtoken, attach user to req, send 401 if invalid
- `src/middleware/validate.js` — run validationResult from express-validator, return 400 with field-level errors
- `src/middleware/rateLimiter.js` — general 100 req/min limiter + SOS-specific 10 req/min limiter
- `src/middleware/errorHandler.js` — catch all errors, return { error: { code, message, details } }

Create all 6 route files (each imports express.Router, its controller, middleware, and validation chains):
- auth.routes.js: POST /register, POST /login, GET /me (auth), PUT /profile (auth)
- contact.routes.js: GET / (auth), POST / (auth), PUT /:id (auth), DELETE /:id (auth)
- sos.routes.js: POST /trigger (auth + SOS rate limiter), GET /history (auth)
- track.routes.js: POST /start (auth), POST /update (auth), POST /:id/end (auth), GET /history (auth), GET /active (auth), GET /alerts (auth), PATCH /alerts/:id/acknowledge (auth)
- dashboard.routes.js: GET /stats (auth)
- zone.routes.js: GET / (auth)

Create all 6 controllers (thin: parse request, call service, send response):
- authController.js: register, login, getMe, updateProfile
- contactController.js: list, create, update, remove
- sosController.js: trigger, history
- trackController.js: start, updateLocation, end, history, getActive, getAlerts, acknowledgeAlert
- dashboardController.js: getStats
- zoneController.js: list

Create all 7 services with full business logic:
- authService.js: register (hash password with bcryptjs, create user, return JWT), login (find user by email, compare password, return JWT), verifyToken, getProfile, updateProfile
- contactService.js: CRUD scoped to req.user.id
- sosService.js: trigger (create alert, find all emergency contacts for user, call notificationService for each, update contacts_notified), getHistory (paginated)
- trackingService.js: startTrip (create track), updateLocation (find active track, create TrackLocation, call geofence.js to evaluate against safe_zones, if unsafe/caution create TrackAlert), endTrip, getActiveTrip, getHistory, getAlerts, acknowledgeAlert
- dashboardService.js: getStats (aggregate from sos_alerts count, tracks count, track_alerts count, compute safety_score = max(0, 100 - (sos_count * 10 + alert_count * 2)))
- zoneService.js: listAll, seedDefaultZones
- notificationService.js: sendSMS (via Twilio), sendEmail (via Nodemailer)

Create `src/config/index.js` (reads dotenv and exports config object), `src/config/twilio.js` (Twilio client), `src/config/mailer.js` (Nodemailer transporter).

Create `src/utils/jwt.js` (sign(payload) and verify(token) helpers), `src/utils/geofence.js` (pointInPolygon using @turf/turf booleanPointInPolygon — accepts [lat,lng] and polygon GeoJSON, returns boolean), `src/utils/logger.js` (console.log with timestamp), `src/utils/constants.js` (DelHI_CENTER = [28.6139, 77.2090], DEFAULT_ZOOM = 12).

## Step 2: Frontend Setup

Create `frontend/` with Vite + React.

`frontend/package.json`:
```json
{
  "name": "saferoam-frontend",
  "private": true,
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.22.0",
    "axios": "^1.6.7",
    "react-leaflet": "^4.2.1",
    "leaflet": "^1.9.4",
    "react-hot-toast": "^2.4.1"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.2.1",
    "autoprefixer": "^10.4.17",
    "postcss": "^8.4.35",
    "tailwindcss": "^3.4.1",
    "vite": "^5.1.0"
  }
}
```

`frontend/vite.config.js` — React plugin, server proxy /api → http://localhost:3001.

`frontend/tailwind.config.js` — content: ["./index.html", "./src/**/*.{js,jsx}"], theme extending colors: primary, secondary, danger, success, warning as defined in the UI spec.

`frontend/index.html` — basic HTML with Inter font from Google Fonts.

`frontend/src/index.css` — Tailwind directives (@tailwind base/components/utilities) + import leaflet CSS.

`frontend/src/main.jsx` — render App inside BrowserRouter + Toaster.

`frontend/src/App.jsx` — define all routes. Wrapped in AuthProvider. Public: /login, /register. Protected (requiring auth): / (Dashboard), /sos, /contacts, /tracking, /history, /settings. Protected routes wrapped in Layout component.

`frontend/src/context/AuthContext.jsx` — React Context with useReducer. State: { user, token, loading }. Actions: LOGIN, LOGOUT, SET_USER. On mount, check localStorage for token, call GET /api/auth/me to validate. Provides: login(email, password), register(name, email, password), logout(), user, token, loading.

`frontend/src/services/api.js` — Axios instance with baseURL='/api'. Request interceptor adds Authorization Bearer token from localStorage. Response interceptor catches 401 → logout.

`frontend/src/hooks/useGeolocation.js` — wraps navigator.geolocation.watchPosition, returns { latitude, longitude, error, loading }.

Create all page components (each in its own file under pages/):

**Login.jsx** — Form with email + password. Calls AuthContext.login(). On success navigate to /. Shows validation errors inline. Link to /register. Centered card on gradient bg with app logo placeholder.

**Register.jsx** — Form with name + email + password + phone(optional). Calls AuthContext.register(). Link to /login.

**Dashboard.jsx** — Fetches GET /api/dashboard/stats on mount. Displays: Safety Score (large circle badge with color: green >70, yellow 40-70, red <40), 3 stat cards (Total Trips, SOS Alerts, Zone Alerts), recent activity feed list. Floating SOS button at bottom-right → navigates to /sos.

**SOSAlert.jsx** — Large red pulsing SOS button in center. Shows current location from useGeolocation hook. Lists emergency contacts that will be notified (fetched from GET /api/contacts). Optional message textarea. On tap: confirm dialog → POST /api/sos/trigger with lat/lng/message → show success toast with number of contacts notified → 30s cooldown on button. Back button top-left.

**Contacts.jsx** — GET /api/contacts on mount. Lists contacts as cards (avatar circle with first letter, name, phone, relationship badge, delete button). Add button opens modal with form (name, phone, email, relationship). Empty state illustration + text. Toast on add/delete.

**Tracking.jsx** — If no active trip: form with destination name input + Start Tracking button. If active trip (GET /api/tracks/active on mount): Full-screen Leaflet map centered on user location. Bottom sheet showing trip status (Safe/⚠️ Caution/🚨 Unsafe). Polls POST /api/tracks/update every 30s with current location. Polls GET /api/tracks/alerts every 15s, shows AlertBanner for unresolved alerts with "I'm Safe" acknowledge button. "End Trip" button calls POST /api/tracks/:id/end. Map shows user marker, route path (polyline of track_locations), safe zone polygons (colored overlays from GET /api/zones).

**History.jsx** — Two tabs: Trips | SOS Alerts. Trips tab: fetches GET /api/tracks/history, renders TripCard list (date, start/end locations, duration, alerts count, tap to expand mini-map). SOS Alerts tab: fetches GET /api/sos/history, renders list (timestamp, location, contacts notified, status badge).

**Settings.jsx** — Profile section with editable name, email, phone. Preferences (future: alert radius slider, notification toggle). About section with app version. Logout button (red) clears token and redirects to /login.

Create all reusable components:

**Layout.jsx** — TopBar + main content area + BottomNav (mobile) / Sidebar (desktop). Uses React Router Outlet.

**TopBar.jsx** — SafeRoam logo/text left, user avatar/name right. Menu toggle for mobile.

**BottomNav.jsx** — 5 tabs (Dashboard, SOS, Track, Contacts, History) with icons (use emoji or SVG). active class for current route.

**SafetyScoreBadge.jsx** — Circular div showing score number. Color: green >70, yellow 40-70, red <40.

**StatCard.jsx** — Simple card with icon, label, value, colored accent border.

**SOSButton.jsx** — Large circular red button with pulsing CSS animation. Props: onClick, disabled (during cooldown), cooldownSeconds (shows countdown).

**MiniMap.jsx** — Leaflet MapContainer with small height (200px). Shows marker at given coordinates. Props: center, markers[], height.

**ContactCard.jsx** — Avatar circle (first letter), name, phone, relationship badge, delete icon button.

**TripCard.jsx** — Date badge, start→end locations, duration, stats row, click to expand MiniMap.

**AlertBanner.jsx** — Full-width colored bar. Color based on type: green=safe, yellow=caution, red=unsafe. Shows icon + message + optional action button.

**ActivityItem.jsx** — Timeline row: icon circle left, title + timestamp right.

**BottomSheet.jsx** — Fixed position bottom panel. Props: isOpen, onClose, children. Smooth slide-up transition.

**FormField.jsx** — Label + input + error message below. Props: label, type, value, onChange, error, placeholder.

**LoadingSpinner.jsx** — Centered spinning circle (Tailwind animate-spin).

**EmptyState.jsx** — Emoji/illustration + title + description + optional action button.

Create `frontend/src/utils/constants.js` — API_BASE_URL, DELHI_CENTER coords.

## Step 3: Build Order

1. Backend: Prisma schema → .env → config files → utils → middleware → services → controllers → routes → server.js → seed.js
2. Test backend with curl/Postman: register, login, get /api/zones
3. Frontend: Vite config → Tailwind → index.css → main.jsx → App.jsx → AuthContext → api.js → hooks → components → pages
4. Connect frontend to backend — verify login flow works end-to-end
5. Verify: SOS triggers SMS/email (mock Twilio if no account), tracking creates locations, dashboard shows stats

## Response Format
Return ALL files with complete, production-ready code. No placeholders or TODOs. Every function should be implemented. Every API call should have proper error handling. Every page should handle loading, empty, and error states.
```
