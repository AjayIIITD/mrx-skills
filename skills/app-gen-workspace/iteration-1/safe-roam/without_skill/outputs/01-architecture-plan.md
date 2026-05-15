# SafeRoam — Architecture Plan

## High-Level System Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Frontend (React)                      │
│  ┌──────────┐  ┌──────────┐  ┌──────────────────────┐  │
│  │ Auth UI  │  │ Dashboard│  │ Emergency / SOS UI   │  │
│  └──────────┘  └──────────┘  └──────────────────────┘  │
│  ┌──────────────────┐  ┌──────────────────────────┐     │
│  │ Route Tracking    │  │ Safe Zone Alerts        │     │
│  └──────────────────┘  └──────────────────────────┘     │
│                    React Router v6                       │
│                    Context API (state)                   │
│                    Leaflet.js (maps)                     │
│                    Socket.IO Client                      │
└──────────────────────┬──────────────────────────────────┘
                       │ HTTP / WebSocket
┌──────────────────────▼──────────────────────────────────┐
│                  Backend (Node.js)                       │
│  ┌────────────┐  ┌──────────────┐  ┌────────────────┐  │
│  │ Auth API   │  │ SOS API      │  │ Route Tracking │  │
│  │ (JWT)      │  │ (Broadcast)  │  │ (Geo-fence)   │  │
│  └────────────┘  └──────────────┘  └────────────────┘  │
│  ┌────────────┐  ┌──────────────┐  ┌────────────────┐  │
│  │ Dashboard  │  │ Emergency    │  │ Socket.IO      │  │
│  │ Analytics  │  │ Contacts CRUD│  │ Real-time      │  │
│  └────────────┘  └──────────────┘  └────────────────┘  │
│               Express.js + Middleware                    │
│               JWT Auth Middleware                        │
│               Geolocation Middleware                     │
└──────────────────────┬──────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────┐
│                    Database (MongoDB)                    │
│  ┌──────────┐  ┌──────────┐  ┌──────────────────────┐  │
│  │ Users    │  │ Contacts │  │ SafetyZones          │  │
│  ├──────────┤  ├──────────┤  ├──────────────────────┤  │
│  │ SOSLogs  │  │ Routes   │  │ SafeZoneAlerts       │  │
│  └──────────┘  └──────────┘  └──────────────────────┘  │
│               Mongoose ODM                               │
└─────────────────────────────────────────────────────────┘
```

## Component Tree

```
<App>
  <AuthProvider>
    <ThemeProvider>
      <Router>
        <Routes>
          / → <LandingPage>
          /login → <LoginPage>
          /register → <RegisterPage>
          /dashboard → <ProtectedRoute> → <DashboardLayout>
            <Sidebar>
            <Outlet>
              /dashboard → <StatsOverview>
                <SOSButton>
                <SafetyScoreCard>
                <RecentActivityFeed>
                <QuickActions>
              /dashboard/sos → <SOSPanel>
                <EmergencyContactList>
                <LiveLocationShare>
                <AlertHistory>
              /dashboard/track → <RouteTracker>
                <LiveMap>
                <SafeZoneOverlay>
                <RouteHistory>
                <AlertPreferences>
              /dashboard/contacts → <EmergencyContactsManager>
                <ContactList>
                <AddContactForm>
                <InviteContact>
              /dashboard/settings → <SettingsPage>
                <ProfileForm>
                <NotificationPreferences>
                <AccountSecurity>
```

## Data Flow

### SOS Alert Flow
```
User triggers SOS
  → Browser Geolocation API gets lat/lng
  → POST /api/sos/trigger { lat, lng }
  → Server creates SOSLog document
  → Server fetches user's emergency contacts
  → Server sends SMS via Twilio to each contact
  → Server emits real-time event via Socket.IO
  → Dashboard shows active SOS with live location
  → SOS resolves → PATCH /api/sos/resolve/:id
  → All contacts notified of resolution
```

### Route Tracking Flow
```
User starts tracking
  → POST /api/track/start { routeName }
  → Frontend watches position via watchPosition()
  → Every N seconds → POST /api/track/update { lat, lng, timestamp }
  → Server checks geo-fences
    → If approaching unsafe zone → alert via Socket.IO
    → If entering safe zone → notification
  → User stops tracking → POST /api/track/stop
  → Route analyzed for safety score
```

### Dashboard Stats Flow
```
User visits /dashboard
  → GET /api/dashboard/stats
  → Server aggregates:
    - Total SOS count (total + this month)
    - Routes tracked (total + distance sum)
    - Alert events count
    - Safety score (calculated from violations)
    - Recent activity timeline
  → Returns JSON → Frontend renders charts
```

## Security Architecture

- All endpoints behind JWT auth middleware (except /auth/*)
- Rate limiting on SOS endpoint (max 1 per 30s per user)
- Helmet.js for HTTP headers
- CORS restricted to frontend origin
- Input validation with Joi/Zod
- Geolocation data encrypted at rest
- Emergency contact phone numbers hashed in DB
- Session tokens expire in 7 days (configurable)
