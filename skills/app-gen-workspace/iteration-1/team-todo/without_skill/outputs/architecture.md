# TeamTodo — Full Architecture Plan

## 1. High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Frontend (Browser)                       │
│  ┌─────────────┐  ┌──────────────┐  ┌──────────────────────┐   │
│  │  HTML/CSS   │  │  Vanilla JS  │  │  WebSocket Client    │   │
│  │ (responsive)│  │  (fetch API) │  │  (native WS)         │   │
│  └─────────────┘  └──────┬───────┘  └──────────┬───────────┘   │
│                          │                     │               │
└──────────────────────────┼─────────────────────┼───────────────┘
                           │ HTTP/REST           │ WS
                           ▼                     ▼
┌──────────────────────────────────────────────────────────────────┐
│              Django Server (gunicorn + daphne)                   │
│                                                                  │
│  ┌────────────┐  ┌──────────────┐  ┌────────────────────────┐   │
│  │ REST API   │  │  Django      │  │  Django Channels       │   │
│  │ (DRF)      │  │  Auth (JWT)  │  │  (WebSocket consumer)  │   │
│  └──────┬─────┘  └──────┬───────┘  └───────────┬────────────┘   │
│         │               │                       │               │
│         └───────────────┼───────────────────────┘               │
│                         ▼                                       │
│              ┌──────────────────────┐                           │
│              │     SQLite DB        │                           │
│              └──────────────────────┘                           │
│                                                                  │
│  ┌──────────────────────────────────────────────────────┐        │
│  │  ASGI — Daphne (HTTP + WebSocket on same port)      │        │
│  └──────────────────────────────────────────────────────┘        │
└──────────────────────────────────────────────────────────────────┘
```

## 2. Technology Stack

| Layer        | Technology                          | Purpose                        |
|-------------|-------------------------------------|--------------------------------|
| Backend     | Django 5.0 + Django REST Framework  | REST API + ORM                 |
| Real-time   | Django Channels 4 + Daphne          | WebSocket server               |
| Auth        | Simple JWT (DRF)                    | Token-based auth               |
| Database    | SQLite (dev), switch to Postgres    | Data persistence               |
| Frontend    | Vanilla HTML/CSS/JS (no framework)  | Lightweight, no build step     |
| CSS         | Tailwind CSS (CDN)                  | Utility-first responsive CSS   |
| WS Client   | Native WebSocket API                | Real-time sync                 |

**Why Vanilla JS + Tailwind CDN**: Zero build tooling, fast iteration, mobile-responsive out of the box. Keeps the MVP lean. Can be migrated to React/Vue later.

## 3. Directory Structure

```
teamtodo/
├── manage.py
├── requirements.txt
├── db.sqlite3
├── config/
│   ├── __init__.py
│   ├── settings.py          # Django settings + Channels config
│   ├── asgi.py              # ASGI entrypoint (Daphne)
│   ├── urls.py              # Root URL routing
│   └── ws_urls.py           # WebSocket URL routing
├── accounts/
│   ├── __init__.py
│   ├── models.py            # UserProfile (extends AbstractUser)
│   ├── serializers.py       # Registration + User serializers
│   ├── views.py             # Register, Login (JWT obtain/refresh)
│   └── urls.py
├── workspaces/
│   ├── __init__.py
│   ├── models.py            # Workspace, WorkspaceMember
│   ├── serializers.py       # Workspace + member serializers
│   ├── views.py             # ViewSets for CRUD
│   ├── urls.py
│   └── permissions.py       # Custom: IsOwnerOrAdmin, IsMember
├── projects/
│   ├── __init__.py
│   ├── models.py            # Project
│   ├── serializers.py
│   ├── views.py
│   └── urls.py
├── tasks/
│   ├── __init__.py
│   ├── models.py            # Task, TaskComment
│   ├── serializers.py
│   ├── views.py
│   ├── urls.py
│   └── filters.py           # Filtering by status, assignee, etc.
├── notifications/
│   ├── __init__.py
│   ├── consumers.py         # WebSocket consumer for real-time
│   └── routing.py
├── frontend/
│   ├── templates/
│   │   └── base.html        # Shell with nav, sidebar, main area
│   ├── static/
│   │   ├── css/
│   │   │   └── app.css      # Custom overrides (minimal)
│   │   └── js/
│   │       ├── api.js       # Centralized fetch wrapper + JWT mgmt
│   │       ├── auth.js      # Login/register page logic
│   │       ├── app.js       # Main SPA router + state
│   │       ├── workspace.js # Workspace list/detail
│   │       ├── project.js   # Project board view
│   │       ├── task.js      # Task CRUD modals
│   │       └── websocket.js # WS connection manager
│   └── views.py             # Single page that serves base.html
```

## 4. State Management (Frontend)

A simple global state object (`window.AppState`) holds:

```js
window.AppState = {
  user: null,               // { id, email, name }
  workspaces: [],           // cached workspace list
  currentWorkspace: null,   // active workspace
  currentProject: null,     // active project
  projects: [],             // projects in current workspace
  tasks: [],                // tasks in current project
  ws: null,                 // WebSocket connection
  wsConnected: false,
  page: 'login',            // 'login' | 'register' | 'workspaces' | 'project'
};
```

## 5. Data Flow

```
User Action → API Call (fetch) → Django View → Serializer → DB
                                                 ↓
                                WS broadcast (group_send) → all connected clients
```

**Real-time flow**:
1. Client A creates a task → POST /api/tasks/
2. View saves to DB → calls `async_to_sync(channel_layer.group_send)`
3. All clients in workspace group receive `{"type": "task.created", "task": {...}}`
4. Client B's WS handler updates its task list

## 6. Security

- JWT tokens (access + refresh) stored in `localStorage`
- Every REST endpoint checks: is user authenticated? is user member of workspace?
- WebSocket `on connect` validates JWT from query string
- CSRF exempt for API views (token-based auth)
- CORS configured for dev (optional, same-origin in prod)

## 7. Performance Notes

- SQLite handles concurrent writes with WAL mode (set via Django `OPTIONS`)
- WebSocket group per workspace keeps broadcasts scoped
- Frontend paginates tasks (limit 50 per page)
- N+1 queries avoided via `select_related('assignee', 'created_by')`
