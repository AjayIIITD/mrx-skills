# SafeRoam — Build Plan

## Overview
SafeRoam is a women safety web app for Delhi that provides one-tap SOS alerts with live location sharing to emergency contacts, real-time route tracking with geofence-based safe zone alerts, and a personal safety dashboard. Built with React + Node.js/Express + PostgreSQL.

## Tech Stack
- **Frontend:** React 18 + Vite + Tailwind CSS 3 + Leaflet maps + React Router v6
- **Backend:** Node.js 20 + Express 4 + JavaScript (ESM)
- **Database:** PostgreSQL 16 with Prisma ORM
- **Auth:** JWT (bcryptjs + jsonwebtoken, 24h expiry)
- **SMS:** Twilio API
- **Email:** Nodemailer (SMTP)
- **Geofencing:** @turf/turf for point-in-polygon computations
- **Deployment:** Vercel (frontend) + Railway/Render (backend) + Neon (database)

## Architecture
```
[Browser] → React SPA (Vite) → REST API → Express Server → Prisma → PostgreSQL
                                                ↕
                                          Twilio (SMS)
                                          Nodemailer (Email)
```

## Pages
| Route | Page | Purpose | Auth |
|-------|------|---------|------|
| /login | Login | Email/password login | No |
| /register | Register | New user signup | No |
| / | Dashboard | Safety stats overview + recent activity | Yes |
| /sos | SOS Alert | One-tap SOS with live location | Yes |
| /contacts | Emergency Contacts | Manage emergency contacts | Yes |
| /tracking | Route Tracking | Start trip, view map, safe zone status | Yes |
| /history | History | Past trips and SOS alerts | Yes |
| /settings | Settings | Profile and preferences | Yes |

## Navigation
- **Mobile:** Bottom tab bar (Dashboard, SOS, Track, Contacts, History)
- **Desktop:** Same tabs collapse to sidebar + top header bar
- **Floating SOS button** always visible on all authenticated pages

## API Routes
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | /api/auth/register | No | Register new user |
| POST | /api/auth/login | No | Login, returns JWT |
| GET | /api/auth/me | Yes | Get current user profile |
| PUT | /api/auth/profile | Yes | Update profile |
| GET | /api/contacts | Yes | List emergency contacts |
| POST | /api/contacts | Yes | Add emergency contact |
| PUT | /api/contacts/:id | Yes | Update contact |
| DELETE | /api/contacts/:id | Yes | Delete contact |
| POST | /api/sos/trigger | Yes | Trigger SOS (rate limited: 10/min) |
| GET | /api/sos/history | Yes | SOS alert history |
| POST | /api/tracks/start | Yes | Start a tracked trip |
| POST | /api/tracks/update | Yes | Update location on active trip |
| POST | /api/tracks/:id/end | Yes | End a trip |
| GET | /api/tracks/history | Yes | Trip history |
| GET | /api/tracks/active | Yes | Get current active trip |
| GET | /api/tracks/alerts | Yes | Get unresolved safe zone alerts |
| PATCH | /api/tracks/alerts/:id/acknowledge | Yes | Acknowledge an alert |
| GET | /api/dashboard/stats | Yes | Aggregated safety dashboard stats |
| GET | /api/zones | Yes | List all safe/unsafe zone definitions |

## Database Schema (8 tables)

### users
| Field | Type | Constraints |
|-------|------|-------------|
| id | UUID | PK, default gen_random_uuid() |
| name | VARCHAR(100) | NOT NULL |
| email | VARCHAR(255) | UNIQUE, NOT NULL |
| password_hash | VARCHAR(255) | NOT NULL |
| phone | VARCHAR(20) | NULLABLE |
| avatar_url | TEXT | NULLABLE |
| created_at | TIMESTAMPTZ | DEFAULT NOW() |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() |
| deleted_at | TIMESTAMPTZ | NULLABLE (soft delete) |

### emergency_contacts
| Field | Type | Constraints |
|-------|------|-------------|
| id | UUID | PK |
| user_id | UUID | FK → users.id, CASCADE |
| name | VARCHAR(100) | NOT NULL |
| phone | VARCHAR(20) | NOT NULL |
| email | VARCHAR(255) | NULLABLE |
| relationship | VARCHAR(50) | NULLABLE |
| created_at | TIMESTAMPTZ | DEFAULT NOW() |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() |

### sos_alerts
| Field | Type | Constraints |
|-------|------|-------------|
| id | UUID | PK |
| user_id | UUID | FK → users.id, CASCADE |
| latitude | DECIMAL(10,7) | NOT NULL |
| longitude | DECIMAL(10,7) | NOT NULL |
| message | TEXT | NULLABLE |
| status | ENUM(sos_status) | DEFAULT 'dispatched' |
| contacts_notified | INTEGER | DEFAULT 0 |
| resolved_at | TIMESTAMPTZ | NULLABLE |
| created_at | TIMESTAMPTZ | DEFAULT NOW() |

### sos_notifications
| Field | Type | Constraints |
|-------|------|-------------|
| id | UUID | PK |
| sos_alert_id | UUID | FK → sos_alerts.id, CASCADE |
| contact_id | UUID | FK → emergency_contacts.id, CASCADE |
| channel | VARCHAR(10) | NOT NULL |
| status | ENUM(notification_status) | DEFAULT 'pending' |
| delivered_at | TIMESTAMPTZ | NULLABLE |
| created_at | TIMESTAMPTZ | DEFAULT NOW() |

### tracks
| Field | Type | Constraints |
|-------|------|-------------|
| id | UUID | PK |
| user_id | UUID | FK → users.id, CASCADE |
| start_lat | DECIMAL(10,7) | NOT NULL |
| start_lng | DECIMAL(10,7) | NOT NULL |
| end_lat | DECIMAL(10,7) | NOT NULL |
| end_lng | DECIMAL(10,7) | NOT NULL |
| destination_name | VARCHAR(200) | NULLABLE |
| status | ENUM(track_status) | DEFAULT 'active' |
| started_at | TIMESTAMPTZ | DEFAULT NOW() |
| ended_at | TIMESTAMPTZ | NULLABLE |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() |

### track_locations
| Field | Type | Constraints |
|-------|------|-------------|
| id | BIGSERIAL | PK |
| track_id | UUID | FK → tracks.id, CASCADE |
| latitude | DECIMAL(10,7) | NOT NULL |
| longitude | DECIMAL(10,7) | NOT NULL |
| zone_status | ENUM(zone_status) | DEFAULT 'safe' |
| recorded_at | TIMESTAMPTZ | DEFAULT NOW() |

### track_alerts
| Field | Type | Constraints |
|-------|------|-------------|
| id | UUID | PK |
| track_id | UUID | FK → tracks.id, CASCADE |
| alert_type | ENUM(alert_type) | NOT NULL |
| latitude | DECIMAL(10,7) | NULLABLE |
| longitude | DECIMAL(10,7) | NULLABLE |
| message | TEXT | NOT NULL |
| acknowledged | BOOLEAN | DEFAULT false |
| acknowledged_at | TIMESTAMPTZ | NULLABLE |
| created_at | TIMESTAMPTZ | DEFAULT NOW() |

### safe_zones
| Field | Type | Constraints |
|-------|------|-------------|
| id | UUID | PK |
| name | VARCHAR(200) | NOT NULL |
| zone_type | ENUM(zone_status) | NOT NULL |
| description | TEXT | NULLABLE |
| polygon | JSONB | NOT NULL |
| is_active | BOOLEAN | DEFAULT true |
| created_at | TIMESTAMPTZ | DEFAULT NOW() |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() |

### Enums
- **sos_status:** dispatched, resolved, false_alarm
- **track_status:** active, completed, cancelled
- **zone_status:** safe, caution, unsafe
- **alert_type:** zone_entry, zone_exit, deviation, prolonged_stay
- **notification_status:** pending, delivered, failed

## File Structure
```
saferoam/
├── frontend/
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   ├── index.html
│   ├── public/
│   │   └── favicon.svg
│   └── src/
│       ├── main.jsx
│       ├── App.jsx
│       ├── index.css
│       ├── context/
│       │   └── AuthContext.jsx
│       ├── hooks/
│       │   ├── useGeolocation.js
│       │   └── useSOS.js
│       ├── pages/
│       │   ├── Login.jsx
│       │   ├── Register.jsx
│       │   ├── Dashboard.jsx
│       │   ├── SOSAlert.jsx
│       │   ├── Contacts.jsx
│       │   ├── Tracking.jsx
│       │   ├── History.jsx
│       │   └── Settings.jsx
│       ├── components/
│       │   ├── Layout.jsx
│       │   ├── BottomNav.jsx
│       │   ├── TopBar.jsx
│       │   ├── SafetyScoreBadge.jsx
│       │   ├── StatCard.jsx
│       │   ├── SOSButton.jsx
│       │   ├── MiniMap.jsx
│       │   ├── ContactCard.jsx
│       │   ├── TripCard.jsx
│       │   ├── AlertBanner.jsx
│       │   ├── ActivityItem.jsx
│       │   ├── BottomSheet.jsx
│       │   ├── FormField.jsx
│       │   ├── LoadingSpinner.jsx
│       │   └── EmptyState.jsx
│       ├── services/
│       │   └── api.js (Axios instance + interceptors)
│       └── utils/
│           ├── constants.js
│           └── formatters.js
│
└── backend/
    ├── package.json
    ├── .env.example
    ├── server.js
    ├── prisma/
    │   ├── schema.prisma
    │   └── seed.js
    └── src/
        ├── routes/
        │   ├── auth.routes.js
        │   ├── contact.routes.js
        │   ├── sos.routes.js
        │   ├── track.routes.js
        │   ├── dashboard.routes.js
        │   └── zone.routes.js
        ├── controllers/
        │   ├── authController.js
        │   ├── contactController.js
        │   ├── sosController.js
        │   ├── trackController.js
        │   ├── dashboardController.js
        │   └── zoneController.js
        ├── services/
        │   ├── authService.js
        │   ├── contactService.js
        │   ├── sosService.js
        │   ├── trackingService.js
        │   ├── dashboardService.js
        │   ├── zoneService.js
        │   └── notificationService.js
        ├── middleware/
        │   ├── auth.js
        │   ├── validate.js
        │   ├── rateLimiter.js
        │   └── errorHandler.js
        ├── utils/
        │   ├── jwt.js
        │   ├── geofence.js
        │   ├── logger.js
        │   └── constants.js
        └── config/
            ├── index.js
            ├── twilio.js
            └── mailer.js
```

## Key Design Decisions
1. **JavaScript over TypeScript** for MVP speed — TS adds build step and type overhead for a small team
2. **REST over WebSocket** — location polling every 30s is sufficient; real-time push adds complexity
3. **Leaflet over Google Maps** — free, no API key required for basic tiles
4. **@turf/turf for geofencing** — lightweight, server-side polygon math without PostGIS extension complexity
5. **Bottom tab nav on mobile** — primary UI pattern since users will likely access from phone browser
6. **7 seed safe zones** for Delhi — MVP coverage of key areas (Connaught Place, Saket, Dwarka, Old Delhi, etc.)
