# SafeRoam — Backend Plan

## Tech Stack

| Layer       | Technology        |
|-------------|-------------------|
| Runtime     | Node.js 20 LTS    |
| Framework   | Express.js 4.x    |
| Auth        | JWT (jsonwebtoken)|
| Real-time   | Socket.IO 4.x     |
| SMS         | Twilio API        |
| Maps API    | OpenStreetMap + Leaflet (frontend) |
| Validation  | Joi               |
| Security    | Helmet, CORS, express-rate-limit |
| Logging     | Morgan + Winston  |

## API Endpoints

### Auth Routes — `/api/auth`
```
POST   /register         — Create account { name, email, phone, password }
POST   /login            — Login { email, password } → returns JWT
POST   /refresh          — Refresh JWT
GET    /me               — Get current user profile
PATCH  /me               — Update profile
```

### SOS Routes — `/api/sos`
```
POST   /trigger          — Trigger SOS { lat, lng, message? }
PATCH  /:id/resolve      — Resolve active SOS
GET    /active           — Get currently active SOS (if any)
GET    /history          — Get past SOS events (paginated)
GET    /:id              — Get single SOS detail
```

### Contacts Routes — `/api/contacts`
```
GET    /                 — List emergency contacts
POST   /                 — Add contact { name, phone, relationship }
PATCH  /:id              — Update contact
DELETE /:id              — Remove contact
PUT    /reorder          — Reorder contacts for SOS priority
```

### Route Tracking Routes — `/api/track`
```
POST   /start            — Start route tracking { name? }
POST   /update           — Update location { trackId, lat, lng, timestamp }
POST   /stop             — Stop tracking { trackId }
GET    /history          — Past routes (paginated)
GET    /:id              — Single route detail with path
```

### Safe Zone Routes — `/api/zones`
```
GET    /                 — Get all safe/unsafe zones (for Delhi)
POST   /                 — Add custom safe zone { name, lat, lng, radius }
DELETE /:id              — Remove custom zone
GET    /alerts           — Get zone alerts for user
```

### Dashboard Routes — `/api/dashboard`
```
GET    /stats            — Aggregated safety stats
GET    /activity         — Recent activity timeline
GET    /weekly-report    — Weekly summary
```

## Socket.IO Events

### Client → Server
```
join:user              — { userId } — join personal room
sos:trigger            — { lat, lng } — manual SOS (redundant with REST)
location:update        — { trackId, lat, lng }
```

### Server → Client
```
sos:activated          — { sosId, userId, lat, lng, timestamp }
sos:resolved           — { sosId, resolvedAt }
zone:entered           — { zoneName, zoneType, lat, lng }
zone:approaching       — { zoneName, zoneType, distance }
zone:exited            — { zoneName, zoneType }
alert:danger-zone      — { message, lat, lng }
tracking:status        — { status: 'started' | 'stopped', trackId }
```

## Middleware Pipeline

```
Request
  → Helmet (security headers)
  → CORS (origin check)
  → Rate Limiter (global + per-route)
  → Morgan (request logging)
  → JSON Parser
  → Auth Middleware (JWT verification)
  → Validation Middleware (Joi schema check)
  → Route Handler
  → Response
```

## Error Handling Strategy

- Global error handler middleware (catch-all)
- Custom AppError class with statusCode + message
- Validation errors return 400 with field-level messages
- Auth errors return 401/403
- Not found returns 404
- Rate limit returns 429
- Internal errors return 500 (log full, return generic)

## Twilio SMS Integration

### When SOS is triggered:
1. Create SOS log in DB
2. Fetch user's emergency contacts ordered by priority
3. For each contact, send SMS:
   ```
   [SAFEROAM ALERT] Ajay has triggered an SOS!
   Location: https://maps.google.com/?q=LAT,LNG
   Track live: https://saferoam.app/sos/LIVE/SOS_ID
   ```
4. Retry logic: 3 attempts with 2s delay
5. Log delivery status per contact

### SMS Templates
- `sos_triggered` — Emergency alert with location
- `sos_resolved` — "Ajay is safe now. SOS resolved at TIME."
- `contact_invite` — "Ajay added you as emergency contact. Install SafeRoam."
