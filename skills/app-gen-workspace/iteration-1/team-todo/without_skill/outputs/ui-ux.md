# TeamTodo — UI/UX Plan

## 1. Design System

- **CSS Framework**: Tailwind CSS (via CDN `<script src="https://cdn.tailwindcss.com">`)
- **Icons**: Heroicons SVG inline (via CDN or inline `<svg>`)
- **Color Palette**:
  - Primary: Indigo-600 (#4F46E5)
  - Surface: White / Gray-50
  - Text: Gray-900 / Gray-500
  - Success: Emerald-500
  - Warning: Amber-500
  - Danger: Red-500
- **Typography**: Inter (via Google Fonts)
- **Breakpoints**: Tailwind defaults (sm:640, md:768, lg:1024, xl:1280)

## 2. Page / Screen Map

```
┌─────────────────────────────────────────────────────┐
│                    PUBLIC ROUTES                     │
├─────────────────────────────────────────────────────┤
│  / → redirects to /login if not authenticated       │
│  /login → Login page (email + password)             │
│  /register → Registration page (name, email, pass)  │
├─────────────────────────────────────────────────────┤
│                  APP (AUTHENTICATED)                 │
├─────────────────────────────────────────────────────┤
│  /app → Workspace list (default landing)            │
│  /app/workspace/<id> → Project list for workspace   │
│  /app/workspace/<id>/project/<id> → Board view      │
└─────────────────────────────────────────────────────┘
```

## 3. Screen Layouts

### 3.1 Auth Pages (/login, /register)

```
┌─────────────────────────────────────────────┐
│                                             │
│           ┌───────────────────┐             │
│           │      Logo/Icon    │             │
│           │                   │             │
│           │   Email input     │             │
│           │   Password input  │             │
│           │   [Sign In btn]   │             │
│           │   Or register     │             │
│           └───────────────────┘             │
│                                             │
└─────────────────────────────────────────────┘
```

- Centered card, max-w-sm
- Clean, minimal — no distractions

### 3.2 Workspace List (/app)

```
┌──────┬─────────────────────────────────────────────┐
│ ☰    │  TeamTodo                    [+ New]        │
├──────┴─────────────────────────────────────────────┤
│                                                     │
│  ┌─────────────────────────────────────────────┐   │
│  │ 🏢  Design Team                   ▶ 3 projects│   │
│  │     Created 2 days ago             👤 5 mems  │   │
│  └─────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────┐   │
│  │ 🏢  Engineering                   ▶ 7 projects│   │
│  │     Created 1 week ago            👤 12 mems  │   │
│  └─────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────┐   │
│  │ 🏢  Marketing                     ▶ 2 projects│   │
│  │     Created yesterday             👤 3 mems   │   │
│  └─────────────────────────────────────────────┘   │
│                                                     │
└─────────────────────────────────────────────────────┘
```

- Top bar: hamburger (future), app name, "+ New Workspace" button, user avatar dropdown
- Card list with hover effect, click to enter workspace

### 3.3 Project List (Workspace Detail)

```
┌──────┬─────────────────────────────────────────────┐
│ ◀    │  Design Team                 [+ New Project]│
├──────┴─────────────────────────────────────────────┤
│                                                     │
│  ┌────┐  ┌────┐  ┌────┐                            │
│  │ 🎨 │  │ 📱 │  │ 📋 │                            │
│  │ UI │  │ App│  │ Docs│                            │
│  │ 12 │  │ 8  │  │ 5  │  ← task counts            │
│  │ tsk│  │ tsk│  │ tsk│                            │
│  └────┘  └────┘  └────┘                            │
│                                                     │
│  Or list view on mobile:                            │
│  ┌─────────────────────────────────────────────┐   │
│  │ 🎨 UI Design                 12 tasks    ▶  │   │
│  └─────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────┐   │
│  │ 📱 Mobile App                 8 tasks     ▶  │   │
│  └─────────────────────────────────────────────┘   │
│                                                     │
└─────────────────────────────────────────────────────┘
```

- Grid of project cards on desktop, stacked list on mobile
- Each card shows project name, task count, color accent

### 3.4 Task Board (Project Detail) — MAIN SCREEN

```
┌──────┬─────────────────────────────────────────────┐
│ ◀    │  UI Design  ·  12 tasks   [+ Add Task] [···]│
├──────┼────────────────┬───────────────┬────────────┤
│      │   📋 To Do     │   🔄 In Prog  │   ✅ Done   │
│      ├────────────────┼───────────────┼────────────┤
│      │ ┌────────────┐ │ ┌───────────┐ │ ┌────────┐ │
│      │ │ Fix navbar │ │ │Build auth │ │ │Landing │ │
│      │ │ 🔴 High    │ │ │ 🟡 Med    │ │ │ 🟢 Low │ │
│      │ │ 👤 @ajay   │ │ │ 👤 @rani  │ │ │👤 @sam │ │
│      │ │ 📅 May 20  │ │ │ 📅 May 18 │ │ │📅 May15│ │
│      │ └────────────┘ │ └───────────┘ │ └────────┘ │
│      │ ┌────────────┐ │               │            │
│      │ │ Responsive │ │               │            │
│      │ │ 🟡 Med     │ │               │            │
│      │ │ 👤 @priya  │ │               │            │
│      │ │ 📅 May 22  │ │               │            │
│      │ └────────────┘ │               │            │
│      └────────────────┴───────────────┴────────────┘
│                                                     │
│ Mobile:                                             │
│ ┌─────────────────────────────────────────────┐     │
│ │ 📋 To Do (2)                         [＋]   │     │
│ │ ┌───────────────────────────────────┐       │     │
│ │ │ Fix navbar · 🔴 High              │       │     │
│ │ │ 👤 ajay · 📅 May 20               │       │     │
│ │ └───────────────────────────────────┘       │     │
│ │ ┌───────────────────────────────────┐       │     │
│ │ │ Responsive · 🟡 Med               │       │     │
│ │ │ 👤 priya · 📅 May 22              │       │     │
│ │ └───────────────────────────────────┘       │     │
│ └─────────────────────────────────────────────┘     │
│ ── swipeable tabs or accordion sections ──────────  │
└─────────────────────────────────────────────────────┘
```

### 3.5 Task Detail Modal

```
┌──────────────────────────────────────────────────┐
│ ✕  [Edit]                                         │
│                                                    │
│  Fix navbar responsiveness                         │
│  ─────────────────────────────────────────────     │
│                                                    │
│  Status:  ● To Do     Priority:  🔴 High          │
│  Assignee:  👤 Ajay Sharma                         │
│  Due Date:  📅 May 20, 2026                        │
│  Created:   May 15, 2026 by Ajay                   │
│  ─────────────────────────────────────────────     │
│                                                    │
│  Description:                                      │
│  The navbar breaks on screens smaller than         │
│  768px. Need to implement hamburger menu.          │
│                                                    │
│  ──── Comments ────                                │
│  ┌────────────────────────────────────────────┐    │
│  │ Rani: I can take this. ETA tomorrow.       │    │
│  │        2 hours ago                          │    │
│  └────────────────────────────────────────────┘    │
│                                                    │
│  [Write a comment...]                    [Send]    │
└──────────────────────────────────────────────────┘
```

### 3.6 Modals (Create/Edit)

- **New Workspace**: name, description fields
- **New Project**: name, description, color picker
- **New Task**: title, description, assignee dropdown, priority, due date, status
- **Invite Member**: email input → sends invite (MVP: adds directly)
- All modals: fullscreen on mobile, centered overlay on desktop

## 4. Mobile Responsive Strategy

| Component     | Desktop (>768px)              | Mobile (<768px)                |
|---------------|-------------------------------|--------------------------------|
| Navigation    | Top bar + breadcrumbs         | Hamburger slide-out menu       |
| Project list  | Grid of cards (3 cols)        | Single column list             |
| Task board    | Kanban columns side-by-side   | Stacked accordion sections     |
| Modals        | Centered overlay (max-w-lg)   | Fullscreen drawer from bottom  |
| Sidebar       | Fixed left sidebar            | Hidden, toggled via hamburger  |

## 5. User Flows

### 5.1 First-time User
```
Register → Auto-create "Personal" workspace → Empty project list → Create first project → Create first task
```

### 5.2 Daily Use
```
Login → See workspace list → Click workspace → See projects → Click project → See board → Update task status (drag or click) → Real-time sync to teammates
```

### 5.3 Collaboration
```
User A creates task → WS broadcasts → User B sees task appear in real-time → User B adds comment → WS broadcasts → User A sees comment
```

## 6. Real-time Indicators

- Green dot next to WS-connected users (future: typing indicators)
- Toast notification when a task is created/updated by another user
- Task card animates in/out on WS events
- Badge count updates live on project cards
