# SafeRoam — Complete Codegen Prompt

```
You are a senior full-stack developer. Build the complete SafeRoam women safety web application for Delhi. Use the exact architecture, structure, and specifications below.

## STACK
- Frontend: React 18 + Vite + React Router v6 + Leaflet.js + Socket.IO Client + CSS Modules
- Backend: Node.js + Express.js + Socket.IO + MongoDB (Mongoose) + JWT + Twilio
- Design: Dark theme, mobile-first responsive

## PROJECT STRUCTURE
Create this EXACT directory structure:
saferoam/
├── client/ (React Vite app)
│   ├── public/index.html, manifest.json, favicon.ico
│   ├── src/
│   │   ├── index.jsx, App.jsx
│   │   ├── assets/images/, icons/
│   │   ├── styles/global.css, theme.js, components/ (CSS modules)
│   │   ├── contexts/AuthContext.jsx, SOSContext.jsx, SocketContext.jsx
│   │   ├── hooks/useGeolocation.js, useSocket.js, useAuth.js, useDashboard.js
│   │   ├── services/api.js, authService.js, sosService.js, contactService.js, trackingService.js, zoneService.js, dashboardService.js
│   │   ├── components/layout/ (Navbar, Sidebar, DashboardLayout, BottomNav)
│   │   │               common/ (Button, Card, Modal, Loader, EmptyState, ProtectedRoute)
│   │   │               sos/ (SOSButton, SOSConfirmDialog, SOSActiveBanner, SOSHistoryItem)
│   │   │               tracking/ (LiveMap, RouteControls, RouteInfo, ZoneAlertItem)
│   │   │               dashboard/ (StatsCard, SafetyScoreCard, ActivityTimeline, WeeklyChart)
│   │   │               contacts/ (ContactCard, AddContactForm, ContactList)
│   │   └── pages/ (LandingPage, LoginPage, RegisterPage, NotFoundPage)
│   │               dashboard/ (StatsOverview, SOSPanel, RouteTrackerPage, ContactsPage, SettingsPage)
│   ├── package.json
│   └── vite.config.js
├── server/
│   ├── src/
│   │   ├── index.js, app.js
│   │   ├── config/db.js, env.js, constants.js
│   │   ├── middleware/auth.js, validate.js, rateLimiter.js, errorHandler.js
│   │   ├── models/User.js, Contact.js, SOSLog.js, Route.js, SafetyZone.js, ZoneAlert.js
│   │   ├── routes/auth.js, sos.js, contacts.js, tracking.js, zones.js, dashboard.js
│   │   ├── controllers/authController.js, sosController.js, contactController.js, trackingController.js, zoneController.js, dashboardController.js
│   │   ├── services/authService.js, sosService.js, trackingService.js, zoneService.js, smsService.js, dashboardService.js
│   │   ├── validators/authValidator.js, sosValidator.js, contactValidator.js, trackingValidator.js, zoneValidator.js
│   │   ├── socket/handler.js
│   │   └── utils/AppError.js, logger.js, geoUtils.js, safetyScore.js
│   ├── seeds/delhi-zones.js
│   ├── package.json
│   └── .env.example
├── package.json (root with concurrently scripts)
└── README.md

## DATABASE SCHEMAS (MongoDB/Mongoose)

### User
{ name: String (required), email: String (required, unique, lowercase), phone: String (required, unique), passwordHash: String (required, bcrypt 12 rounds), avatar: String, isVerified: Boolean (default false), notificationPrefs: { sms: Boolean (true), email: Boolean (false), push: Boolean (false) }, safetySettings: { autoSOS: Boolean (false), trackingInterval: Number (10), safeZoneRadius: Number (200) }, timestamps: true }
- Indexes: email (1), phone (1)

### Contact
{ userId: ObjectId (ref User, required, indexed), name: String (required), phone: String (required), relationship: String (enum: parent/spouse/friend/sibling/other), priority: Number (1-based), isVerified: Boolean (false), timestamps: true }
- Indexes: { userId, priority }, { userId, phone }

### SOSLog
{ userId: ObjectId (ref User, required, indexed), status: String (enum: active/resolved/cancelled, default active), triggeredAt: Date (default now), resolvedAt: Date (null), location: { lat: Number, lng: Number, accuracy: Number }, resolutionLocation: { lat: Number, lng: Number }, message: String, contactsNotified: [{ contactId: ObjectId, phone: String, deliveryStatus: String (enum: sent/failed/pending), deliveredAt: Date }], trackingSnapshot: { path: [{ lat, lng, timestamp }], totalDistance: Number }, timestamps: true }
- Indexes: { userId: 1, status: 1, triggeredAt: -1 }, { status: 1, triggeredAt: -1 }

### Route
{ userId: ObjectId (ref User, required, indexed), name: String, status: String (enum: active/completed/abandoned), startedAt: Date, endedAt: Date, totalDistance: Number (meters), totalDuration: Number (seconds), safetyScore: Number (0-100), path: [{ lat: Number, lng: Number, timestamp: Date, accuracy: Number }], violations: [{ zoneName: String, zoneType: String (safe/unsafe), action: String (entered/exited/approached), timestamp: Date, lat: Number, lng: Number }], alertsTriggered: Number, timestamps: true }
- Indexes: { userId, startedAt: -1 }, { userId, status }

### SafetyZone
{ name: String (required), type: String (enum: safe/unsafe/custom), coordinates: { lat: Number, lng: Number }, radius: Number (meters), polygon: [{ lat, lng }], riskLevel: String (low/medium/high), source: String (system/user), userId: ObjectId (ref User, optional), metadata: { description: String, tags: [String], reportedIncidents: Number }, timestamps: true }
- Indexes: { type: 1, coordinates: "2dsphere" }, { userId, source }

### ZoneAlert
{ userId: ObjectId (ref User, indexed), zoneId: ObjectId (ref SafetyZone), routeId: ObjectId (ref Route), type: String (entered/exited/approaching), location: { lat, lng }, acknowledged: Boolean (false), createdAt: Date }
- Indexes: { userId, createdAt: -1 }, { routeId }

## SEED DATA — Delhi Safe Zones
1. Connaught Place — safe, radius 500m, { lat: 28.6315, lng: 77.2167 }
2. India Gate — safe, radius 300m, { lat: 28.6129, lng: 77.2295 }
3. Lajpat Nagar Market — medium, radius 400m, { lat: 28.5677, lng: 77.2440 }
4. Hauz Khas Village — safe, radius 300m, { lat: 28.5494, lng: 77.2000 }
5. DLF Cyber City — safe, radius 500m, { lat: 28.4955, lng: 77.0880 }
6. Select CITYWALK — safe, radius 300m, { lat: 28.5465, lng: 77.2570 }
7. Delhi Metro (all major stations) — safe, radius 150m

## Delhi Unsafe Zones
1. Kashmiri Gate ISBT (night) — high risk, radius 400m, { lat: 28.6667, lng: 77.2280 }
2. Seelampur — high risk, radius 500m, { lat: 28.6590, lng: 77.2710 }
3. Yamuna Bazaar area — high risk, radius 400m, { lat: 28.6762, lng: 77.2500 }
4. Outer Ring Road dark stretches — medium risk, radius 300m
5. Ring Road underpasses (post 10 PM) — medium risk, radius 200m

## DESIGN SYSTEM
CSS Custom Properties (in global.css):
--color-primary: #FF3366
--color-primary-dark: #E62E5C
--color-secondary: #6C63FF
--color-accent: #00C9A7
--color-danger: #FF4757
--color-warning: #FFA502
--color-bg: #0F0F1A
--color-surface: #1A1A2E
--color-surface-2: #252542
--color-text: #FFFFFF
--color-text-muted: #A0A0B5
Font: Inter, system-ui sans-serif. 4px spacing grid. Dark theme throughout.

## API ENDPOINTS (Express.js)
All responses: { success: true/false, data: {...}, error: "message" }

### Auth — /api/auth
POST /register — { name, email, phone, password } → { token, user }
POST /login — { email, password } → { token, user }
POST /refresh — { token } → { token }
GET /me — (Auth) → user object
PATCH /me — (Auth) { name, phone, ... } → updated user

### SOS — /api/sos (all Auth)
POST /trigger — { lat, lng, message? } → { sos } (creates SOS, sends SMS via Twilio to all contacts)
PATCH /:id/resolve — → { sos } (marks resolved, notifies contacts)
GET /active — → { sos|null }
GET /history?page=1&limit=20 — → { sosLogs, total, page, pages }
GET /:id — → { sos }

### Contacts — /api/contacts (all Auth)
GET / — → { contacts }
POST / — { name, phone, relationship } → { contact }
PATCH /:id — { name?, phone?, relationship?, priority? } → { contact }
DELETE /:id — → { message }
PUT /reorder — { contactIds: [ordered array] } → { contacts }

### Tracking — /api/track (all Auth)
POST /start — { name? } → { track }
POST /update — { trackId, lat, lng, timestamp } → { ok }
POST /stop — { trackId } → { track (with safety score computed) }
GET /history?page=1&limit=20 — → { routes, total, page, pages }
GET /:id — → { route }

### Zones — /api/zones (all Auth)
GET / — → { zones } (system + user custom)
POST / — { name, lat, lng, radius } → { zone }
DELETE /:id — → { message }
GET /alerts?page=1&limit=20 — → { alerts }

### Dashboard — /api/dashboard (all Auth)
GET /stats — → { totalSOS, thisMonthSOS, totalRoutes, totalDistance, totalAlerts, safetyScore }
GET /activity?limit=10 — → { activities: [{ type, message, timestamp }] }
GET /weekly-report — → { days: [{ date, sosCount, routesCount, alertsCount }] }

## SOCKET.IO EVENTS
Server emits:
- sos:activated { sosId, userId, lat, lng, timestamp }
- sos:resolved { sosId, resolvedAt }
- zone:entered { zoneName, zoneType, lat, lng }
- zone:approaching { zoneName, zoneType, distance }
- zone:exited { zoneName, zoneType }
- alert:danger-zone { message, lat, lng }
- tracking:status { status: started/stopped, trackId }

Client emits:
- join:user { userId }
- sos:trigger { lat, lng } (redundant with REST)
- location:update { trackId, lat, lng }

## FRONTEND COMPONENTS SPECIFICATION

### App.jsx
- Set up BrowserRouter
- Wrap with AuthProvider, SOSProvider, SocketProvider
- Routes: / → LandingPage, /login → LoginPage, /register → RegisterPage, /dashboard/* → ProtectedRoute → DashboardLayout → nested routes
- 404 → NotFoundPage

### DashboardLayout.jsx
- Sidebar (desktop) or BottomNav (mobile <768px)
- Top header bar with user avatar and notification bell
- Children rendered via Outlet
- Floating SOSButton always visible bottom-center
- Socket.IO connection established here

### SOSButton.jsx
- Large circular button (80px), bg primary, pulse animation
- States:
  - idle: "SOS" text, pulse animation
  - confirming: show confirm dialog
  - active: red pulsing faster, "SOS ACTIVE" badge
- On idle click → show SOSConfirmDialog
- On active click → show resolve option

### LiveMap.jsx (Leaflet)
- Full height, fit to container
- TileLayer: OpenStreetMap
- User marker (blue circle with pulsing)
- Green circle markers for safe zones
- Red polygon/circle markers for unsafe zones
- Purple polyline for active route
- Recenter button (floating)
- Zoom controls disabled on mobile (pinch only)
- Layer toggle for safe/unsafe zones
- Props: location, routePath, zones, onMapClick

### StatsOverview.jsx (Dashboard Home)
- 4 StatsCards: SOS Logs, Routes Tracked, Alerts, Safety Score
- StatCard: icon + label + value + trend indicator
- SafetyScoreCard: circular gauge 0-100, color segments, trend
- ActivityTimeline: scrollable list of recent activities
- WeeklyChart: simple bar chart (CSS-only, no chart lib)
- QuickActions: "Start Tracking" button, "Add Contact" button

### RouteTrackerPage.jsx
- LiveMap taking ~70% of viewport
- RouteControls bar: route name input, Start/Stop buttons
- Timer showing elapsed time
- Distance counter (in km)
- Zone alerts sidebar (scrollable list of ZoneAlertItems)
- Safety score on route completion

### SOSPanel.jsx
- Current status: if active → SOSActiveBanner with live map
- If no active SOS → show past SOS list
- SOSHistoryItem per entry: date, status, location, resolution time
- Filter by status tabs: All | Active | Resolved

### ContactsPage.jsx
- ContactList with ContactCards
- AddContactForm modal
- Each ContactCard: avatar circle with initials, name, relationship badge, phone, call button, edit/delete icons
- Drag to reorder (simple up/down buttons)
- Empty state: illustration + "Add your first emergency contact"

## BACKEND LOGIC

### authService.js
- register(): check existing user, hash password with bcrypt (12 rounds), create user, return JWT
- login(): find user by email, compare password, return JWT
- JWT payload: { userId, email }, expires in 7 days

### sosService.js
- triggerSOS(userId, { lat, lng, message }):
  1. Validate no active SOS exists
  2. Create SOSLog with status "active"
  3. Fetch user's emergency contacts ordered by priority
  4. Call smsService.sendSOSAlert() for each contact (async, don't block)
  5. Emit sos:activated via Socket.IO
  6. Return SOS log

### smsService.js
- Uses Twilio REST API
- sendSOSAlert(contactPhone, userName, lat, lng, sosId):
  - Message: "[SAFEROAM ALERT] {userName} has triggered an SOS! Location: https://maps.google.com/?q={lat},{lng} Track live: https://saferoam.app/sos/live/{sosId}"
- sendSOSResolved(contactPhone, userName):
  - Message: "{userName} is safe now. SOS resolved at {time}."

### trackingService.js
- startTracking(userId, name):
  1. Check no active tracking
  2. Create Route with status "active"
  3. Return route

- updateLocation(trackId, userId, { lat, lng, timestamp }):
  1. Find active route
  2. Push point to path array
  3. Check all safety zones for proximity
  4. If approaching unsafe zone (<200m) → create ZoneAlert, emit zone:approaching
  5. If entered unsafe zone (<radius) → create ZoneAlert, emit zone:entered
  6. If entered safe zone → emit zone:entered (positive)
  7. Return alerts if any

- stopTracking(trackId, userId):
  1. Find route, set status "completed", set endedAt
  2. Calculate totalDistance from path (Haversine formula — use geoUtils)
  3. Calculate totalDuration
  4. Compute safetyScore based on violations/alerts ratio
  5. Save and return

### geoUtils.js
- haversineDistance(lat1, lng1, lat2, lng2): returns distance in meters
- isWithinZone(userLat, userLng, zone): checks if user is within zone radius
- isApproachingZone(userLat, userLng, zone, thresholdMeters=200): checks if user is within threshold of zone boundary

### safetyScore.js
- computeScore(route): 0-100
  - Base: 100
  - Deduct 10 per unsafe zone violation
  - Deduct 5 per alert triggered
  - Bonus +5 if route stays entirely in safe zones
  - Clamp to 0-100

### dashboardService.js
- getStats(userId):
  - Aggregate from SOSLogs (count, thisMonth count)
  - Aggregate from Routes (count, totalDistance sum)
  - Aggregate from ZoneAlerts (count)
  - Average safety score from last 10 routes
  - Return computed stats

### socket/handler.js
- On connection: authenticate via JWT in handshake
- On "join:user": join socket room "user:{userId}"
- On "location:update": broadcast to monitoring rooms if SOS active
- Export: setupSocket(io)

## MIDDLEWARE

### auth.js
- Extract Bearer token from Authorization header
- Verify JWT, attach user to req.user
- Return 401 if invalid/missing

### validate.js
- Factory: validate(schema, source='body') → middleware
- Validate req[source] against Joi schema
- Return 400 with field errors on failure

### rateLimiter.js
- Global: 100 req/min per IP
- SOS endpoint: 3 req/min per user
- Auth endpoints: 10 req/min per IP

### errorHandler.js
- Catch all errors
- If AppError → use its statusCode + message
- If Joi ValidationError → 400 with formatted messages
- If Mongoose ValidationError → 400 with field messages
- If MongoServerError 11000 (duplicate) → 409 with field
- Default: 500 "Internal server error"
- Log with Winston in all cases

## ENVIRONMENT VARIABLES (.env.example)
PORT=5000
MONGODB_URI=mongodb://localhost:27017/saferoam
JWT_SECRET=your-super-secret-key-change-in-production
JWT_EXPIRES_IN=7d
TWILIO_ACCOUNT_SID=your-twilio-sid
TWILIO_AUTH_TOKEN=your-twilio-token
TWILIO_PHONE_NUMBER=+1234567890
CLIENT_URL=http://localhost:5173
NODE_ENV=development

## IMPLEMENTATION REQUIREMENTS

1. Use functional components with hooks throughout
2. No TypeScript — plain JSX with propTypes where helpful
3. No external chart libraries — use CSS-only charts
4. Leaflet maps with OpenStreetMap tiles (free, no API key)
5. Mobile-first responsive CSS using CSS Modules
6. All API calls through centralized axios instance (api.js) with token refresh interceptor
7. Loading states, error states, and empty states on every page/component
8. Form validation both client-side and server-side
9. Password minimum 8 chars, at least 1 number and 1 special char
10. Phone numbers in Indian format (+91XXXXXXXXXX)
11. SOS button must work even if user is not on dashboard (global)
12. Socket connection established on login, disconnected on logout
13. Rate limiting on all sensitive endpoints

## DELIVERABLES
Generate ALL files listed in the project structure above with COMPLETE working code. Every file must be fully implemented — no placeholders, no TODOs, no "// implement later". The app should be runnable with `npm install && npm run dev` from the root.

## QUALITY CHECKLIST
- [ ] All routes work with auth middleware
- [ ] SOS triggers SMS via Twilio
- [ ] Real-time zone alerts via Socket.IO
- [ ] Dashboard stats aggregate correctly
- [ ] Map renders with all zone overlays
- [ ] Mobile responsive (sidebar → bottom nav)
- [ ] SOS button visible on all pages
- [ ] Route tracking with geofence checking
- [ ] Contacts CRUD with reorder
- [ ] Auth with JWT + refresh
- [ ] Error handling on all API endpoints
- [ ] Loading/error/empty states on all components
- [ ] Delhi seed data loads on first run
- [ ] Safety score computation works
- [ ] CORS, Helmet, rate limiting configured
```
