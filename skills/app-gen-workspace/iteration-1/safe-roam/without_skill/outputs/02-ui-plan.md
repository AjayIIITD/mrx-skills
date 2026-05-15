# SafeRoam — UI Plan

## Design System

### Color Palette
```
--color-primary: #FF3366       (Alert red-pink — SOS branding)
--color-primary-dark: #E62E5C
--color-secondary: #6C63FF    (Trust purple)
--color-accent: #00C9A7       (Safe green)
--color-danger: #FF4757       (Danger)
--color-warning: #FFA502      (Warning)
--color-bg: #0F0F1A           (Dark background)
--color-surface: #1A1A2E
--color-surface-2: #252542
--color-text: #FFFFFF
--color-text-muted: #A0A0B5
```

### Typography
- Font: Inter (sans-serif)
- Scale: 12 / 14 / 16 / 18 / 24 / 32 / 48 px

### Spacing
- 4px grid system (4, 8, 12, 16, 20, 24, 32, 40, 48, 64)

### Components

#### 1. SOSButton (Floating)
- Large circular red button with pulsing animation
- Located bottom-center on all dashboard pages
- On click: confirmation dialog → immediate SOS
- States: idle, activating, active (pulsing + badge), resolving

#### 2. LiveMap (Leaflet)
- Full-height map component
- Layers:
  - User's current location marker (blue dot)
  - Safe zones (green polygons)
  - Unsafe hotspots (red polygons)
  - Route path (purple polyline)
  - Emergency contact locations (optional)
- Controls: zoom, layer toggle, recenter button

#### 3. SafetyScoreCard
- Circular gauge showing score (0-100)
- Segments: Red (0-40), Yellow (41-70), Green (71-100)
- Sub-metrics: route safety, response time, zone compliance
- Trend arrow (up/down) with percentage change

#### 4. EmergencyContactList
- Avatar + name + relationship + phone
- Quick-call button per contact
- Drag-to-reorder for SOS priority
- Empty state with "Add contact" CTA

#### 5. StatsOverview Dashboard
- 4 metric cards in a grid: SOS Logs, Routes Tracked, Alerts, Safety Score
- Activity timeline (scrollable list)
- Weekly activity chart (bar chart)
- Quick action buttons

### Page Layouts

#### Landing Page
```
┌─────────────────────────────────────────┐
│ [Logo] SafeRoam         [Login] [SignUp]│
├─────────────────────────────────────────┤
│  Hero Section: "Your Safety, Our Mission"│
│  Feature Cards (3): SOS · Tracking · Stats│
│  How It Works (step-by-step)            │
│  Testimonial / Stats counter            │
│  Footer: Links + Copyright              │
└─────────────────────────────────────────┘
```

#### Dashboard Layout
```
┌──────────┬──────────────────────────────────┐
│ Sidebar  │  Header: Breadcrumb + Notif Bell │
│ ──────── │──────────────────────────────────│
│ 📊 Stats │   <Outlet — page content>         │
│ 🆘 SOS   │                                   │
│ 🗺 Track  │                                   │
│ 👤 Contacts│                                  │
│ ⚙ Settings│                                  │
│          │                                   │
│          │                       [SOS Button] │
└──────────┴──────────────────────────────────┘
```

#### Route Tracker Page
```
┌──────────────────────────────────────────────┐
│  Route Tracker                    [Start] [Stop]│
├──────────────────────────────────────────────┤
│  ┌────────────────────────────────────────┐  │
│  │                                        │  │
│  │           LIVE MAP (Leaflet)           │  │
│  │                                        │  │
│  │  [📍 You]  [🟢 Safe Zone]  [🔴 Hotspot]│  │
│  │                                        │  │
│  └────────────────────────────────────────┘  │
├──────────────┬───────────────────────────────┤
│  Route Info  │  Safe Zone Alerts             │
│  Distance:   │  ✅ Entered Connaught Place   │
│  Duration:   │  ⚠️ Approaching Kashmiri Gate │
│  Safety: 85% │  ❌ Left Lajpat Nagar         │
└──────────────┴───────────────────────────────┘
```

## Screen Dimensions & Breakpoints

| Breakpoint | Width     | Layout        |
|------------|-----------|---------------|
| Mobile     | < 768px   | Single column, bottom nav |
| Tablet     | 768-1024  | Sidebar collapsed |
| Desktop    | > 1024px  | Full sidebar |

## Mobile-Specific Considerations
- Bottom navigation bar instead of sidebar
- SOS button larger and always visible
- Tap-to-call on emergency contacts
- Push notification support for alerts
- Battery-efficient location tracking (throttle updates)

## Responsive Behavior
- Sidebar collapses to hamburger menu on mobile
- Dashboard grid: 4 columns → 2 columns → 1 column
- Map takes full viewport height minus nav on mobile
- Tables become card lists on small screens
