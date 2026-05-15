# SafeRoam — Database Plan

## Database: MongoDB via Mongoose ODM

### Collection: `users`
```javascript
{
  _id: ObjectId,
  name: String,              // required
  email: String,             // required, unique, lowercase, indexed
  phone: String,             // required, unique
  passwordHash: String,      // bcrypt, 12 rounds
  avatar: String,            // URL, optional
  isVerified: Boolean,       // default false
  notificationPrefs: {
    sms: Boolean,            // default true
    email: Boolean,          // default false
    push: Boolean            // default false
  },
  safetySettings: {
    autoSOS: Boolean,        // auto-trigger if no movement after fall
    trackingInterval: Number,// seconds between location updates (default 10)
    safeZoneRadius: Number,  // meters (default 200)
  },
  createdAt: Date,
  updatedAt: Date
}
// Indexes: { email: 1 }, { phone: 1 }
```

### Collection: `contacts`
```javascript
{
  _id: ObjectId,
  userId: ObjectId,          // ref -> users, indexed
  name: String,              // required
  phone: String,             // required
  relationship: String,      // "parent" | "spouse" | "friend" | "sibling" | "other"
  priority: Number,          // 1-based order for SOS notification
  isVerified: Boolean,       // default false
  createdAt: Date,
  updatedAt: Date
}
// Indexes: { userId: 1, priority: 1 }, { userId: 1, phone: 1 }
```

### Collection: `sos_logs`
```javascript
{
  _id: ObjectId,
  userId: ObjectId,          // ref -> users, indexed
  status: String,            // "active" | "resolved" | "cancelled"
  triggeredAt: Date,         // default now
  resolvedAt: Date,          // null until resolved
  location: {
    lat: Number,
    lng: Number,
    accuracy: Number         // meters
  },
  resolutionLocation: {
    lat: Number,
    lng: Number
  },
  message: String,           // optional user message
  contactsNotified: [{
    contactId: ObjectId,
    phone: String,
    deliveryStatus: String,  // "sent" | "failed" | "pending"
    deliveredAt: Date
  }],
  trackingSnapshot: {        // path data during SOS
    path: [{ lat: Number, lng: Number, timestamp: Date }],
    totalDistance: Number    // meters
  },
  createdAt: Date,
  updatedAt: Date
}
// Indexes: { userId: 1, status: 1, triggeredAt: -1 }
//           { status: 1, triggeredAt: -1 }  (for live monitoring)
```

### Collection: `routes`
```javascript
{
  _id: ObjectId,
  userId: ObjectId,          // ref -> users, indexed
  name: String,              // optional route name
  status: String,            // "active" | "completed" | "abandoned"
  startedAt: Date,
  endedAt: Date,
  totalDistance: Number,     // meters
  totalDuration: Number,     // seconds
  safetyScore: Number,       // 0-100 computed
  path: [{
    lat: Number,
    lng: Number,
    timestamp: Date,
    accuracy: Number
  }],
  violations: [{             // zone violations during route
    zoneName: String,
    zoneType: String,        // "unsafe" | "safe"
    action: String,          // "entered" | "exited" | "approached"
    timestamp: Date,
    lat: Number,
    lng: Number
  }],
  alertsTriggered: Number,   // count of alerts during this route
  createdAt: Date,
  updatedAt: Date
}
// Indexes: { userId: 1, startedAt: -1 }
//           { userId: 1, status: 1 }
```

### Collection: `safety_zones`
```javascript
{
  _id: ObjectId,
  name: String,              // e.g., "Connaught Place"
  type: String,              // "safe" | "unsafe" | "custom"
  coordinates: {
    lat: Number,
    lng: Number
  },
  radius: Number,            // meters (for circular zones)
  polygon: [{                // optional polygon for complex zones
    lat: Number,
    lng: Number
  }],
  riskLevel: String,         // "low" | "medium" | "high" (for unsafe zones)
  source: String,            // "system" | "user"
  userId: ObjectId,          // ref -> users (only for custom zones)
  metadata: {
    description: String,
    tags: [String],          // e.g., ["market", "metro", "crowded"]
    reportedIncidents: Number
  },
  createdAt: Date,
  updatedAt: Date
}
// Indexes: { type: 1, coordinates: "2dsphere" }
//           { userId: 1, source: 1 }
```

### Collection: `zone_alerts`
```javascript
{
  _id: ObjectId,
  userId: ObjectId,          // ref -> users, indexed
  zoneId: ObjectId,          // ref -> safety_zones
  routeId: ObjectId,         // ref -> routes
  type: String,              // "entered" | "exited" | "approaching"
  location: {
    lat: Number,
    lng: Number
  },
  acknowledged: Boolean,     // default false
  createdAt: Date
}
// Indexes: { userId: 1, createdAt: -1 }
//           { routeId: 1 }
```

## Seed Data for Delhi

### Pre-populated Safe Zones
- Connaught Place (CP) — safe, radius 500m
- India Gate — safe, radius 300m
- Lajpat Nagar Market — medium, radius 400m
- Hauz Khas Village — safe, radius 300m
- DLF Cyber City — safe, radius 500m
- Select CITYWALK — safe, radius 300m
- Delhi Metro stations — safe, radius 150m each

### Pre-populated Unsafe Zones (based on public crime data)
- Kashmiri Gate ISBT area late night — high risk
- Seelampur — high risk
- Yamuna Bazaar area — high risk
- Selected dark stretches on Outer Ring Road — medium risk
- Underpasses on Ring Road post 10 PM — medium risk

## Data Retention Policy
- SOS logs: 2 years
- Route data: 6 months (keep aggregated stats forever)
- Zone alerts: 3 months
- Active route paths: purged 24h after completion (keep summary)
