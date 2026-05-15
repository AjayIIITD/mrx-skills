# SafeRoam — Project Structure

```
saferoam/
├── client/                          # React frontend
│   ├── public/
│   │   ├── index.html
│   │   ├── manifest.json
│   │   └── favicon.ico
│   ├── src/
│   │   ├── index.jsx                # Entry point
│   │   ├── App.jsx                  # Root component + Router
│   │   ├── assets/
│   │   │   ├── images/
│   │   │   └── icons/
│   │   ├── styles/
│   │   │   ├── global.css           # CSS reset + variables
│   │   │   ├── theme.js             # Design tokens
│   │   │   └── components/          # Per-component CSS modules
│   │   ├── contexts/
│   │   │   ├── AuthContext.jsx       # Auth state + JWT management
│   │   │   ├── SOSContext.jsx        # SOS state (active/not)
│   │   │   └── SocketContext.jsx     # Socket.IO connection
│   │   ├── hooks/
│   │   │   ├── useGeolocation.js     # Browser geo + watchPosition
│   │   │   ├── useSocket.js          # Socket.IO hook
│   │   │   ├── useAuth.js            # Auth convenience hook
│   │   │   └── useDashboard.js       # Dashboard data fetching
│   │   ├── services/
│   │   │   ├── api.js               # Axios instance + interceptors
│   │   │   ├── authService.js        # Auth API calls
│   │   │   ├── sosService.js         # SOS API calls
│   │   │   ├── contactService.js     # Contacts API calls
│   │   │   ├── trackingService.js    # Tracking API calls
│   │   │   ├── zoneService.js        # Safe zone API calls
│   │   │   └── dashboardService.js   # Dashboard API calls
│   │   ├── components/
│   │   │   ├── layout/
│   │   │   │   ├── Navbar.jsx
│   │   │   │   ├── Sidebar.jsx
│   │   │   │   ├── DashboardLayout.jsx
│   │   │   │   └── BottomNav.jsx
│   │   │   ├── common/
│   │   │   │   ├── Button.jsx
│   │   │   │   ├── Card.jsx
│   │   │   │   ├── Modal.jsx
│   │   │   │   ├── Loader.jsx
│   │   │   │   ├── EmptyState.jsx
│   │   │   │   └── ProtectedRoute.jsx
│   │   │   ├── sos/
│   │   │   │   ├── SOSButton.jsx
│   │   │   │   ├── SOSConfirmDialog.jsx
│   │   │   │   ├── SOSActiveBanner.jsx
│   │   │   │   └── SOSHistoryItem.jsx
│   │   │   ├── tracking/
│   │   │   │   ├── LiveMap.jsx
│   │   │   │   ├── RouteControls.jsx
│   │   │   │   ├── RouteInfo.jsx
│   │   │   │   └── ZoneAlertItem.jsx
│   │   │   ├── dashboard/
│   │   │   │   ├── StatsCard.jsx
│   │   │   │   ├── SafetyScoreCard.jsx
│   │   │   │   ├── ActivityTimeline.jsx
│   │   │   │   └── WeeklyChart.jsx
│   │   │   └── contacts/
│   │   │       ├── ContactCard.jsx
│   │   │       ├── AddContactForm.jsx
│   │   │       └── ContactList.jsx
│   │   └── pages/
│   │       ├── LandingPage.jsx
│   │       ├── LoginPage.jsx
│   │       ├── RegisterPage.jsx
│   │       ├── dashboard/
│   │       │   ├── StatsOverview.jsx
│   │       │   ├── SOSPanel.jsx
│   │       │   ├── RouteTrackerPage.jsx
│   │       │   ├── ContactsPage.jsx
│   │       │   └── SettingsPage.jsx
│   │       └── NotFoundPage.jsx
│   ├── package.json
│   └── vite.config.js
│
├── server/                          # Node.js backend
│   ├── src/
│   │   ├── index.js                 # Entry point — start server
│   │   ├── app.js                   # Express app setup
│   │   ├── config/
│   │   │   ├── db.js                # MongoDB connection
│   │   │   ├── env.js               # Environment variables
│   │   │   └── constants.js         # App constants
│   │   ├── middleware/
│   │   │   ├── auth.js              # JWT verification
│   │   │   ├── validate.js          # Joi validation wrapper
│   │   │   ├── rateLimiter.js       # Rate limiting
│   │   │   └── errorHandler.js      # Global error handler
│   │   ├── models/
│   │   │   ├── User.js
│   │   │   ├── Contact.js
│   │   │   ├── SOSLog.js
│   │   │   ├── Route.js
│   │   │   ├── SafetyZone.js
│   │   │   └── ZoneAlert.js
│   │   ├── routes/
│   │   │   ├── auth.js
│   │   │   ├── sos.js
│   │   │   ├── contacts.js
│   │   │   ├── tracking.js
│   │   │   ├── zones.js
│   │   │   └── dashboard.js
│   │   ├── controllers/
│   │   │   ├── authController.js
│   │   │   ├── sosController.js
│   │   │   ├── contactController.js
│   │   │   ├── trackingController.js
│   │   │   ├── zoneController.js
│   │   │   └── dashboardController.js
│   │   ├── services/
│   │   │   ├── authService.js
│   │   │   ├── sosService.js
│   │   │   ├── trackingService.js
│   │   │   ├── zoneService.js
│   │   │   ├── smsService.js        # Twilio integration
│   │   │   └── dashboardService.js
│   │   ├── validators/
│   │   │   ├── authValidator.js
│   │   │   ├── sosValidator.js
│   │   │   ├── contactValidator.js
│   │   │   ├── trackingValidator.js
│   │   │   └── zoneValidator.js
│   │   ├── socket/
│   │   │   └── handler.js           # Socket.IO event handlers
│   │   └── utils/
│   │       ├── AppError.js
│   │       ├── logger.js
│   │       ├── geoUtils.js          # Distance calc, zone checking
│   │       └── safetyScore.js       # Score computation
│   ├── seeds/
│   │   └── delhi-zones.js           # Seed script for Delhi zones
│   ├── package.json
│   └── .env.example
│
├── package.json                     # Root — scripts for running both
└── README.md
```

## Root package.json scripts
```json
{
  "scripts": {
    "dev": "concurrently \"npm run dev:server\" \"npm run dev:client\"",
    "dev:server": "npm run dev --prefix server",
    "dev:client": "npm run dev --prefix client",
    "build": "npm run build --prefix client",
    "start": "npm run start --prefix server"
  }
}
```
