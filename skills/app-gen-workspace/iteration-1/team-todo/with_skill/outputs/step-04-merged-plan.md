# TeamTodo — Build Plan

## Overview
TeamTodo is a collaborative task management app where teams create workspaces, organize work into projects, and track tasks with assignees and due dates. Real-time WebSocket updates sync changes instantly across all members. Mobile-responsive design enables usage on any device.

## Tech Stack
- **Frontend**: React 18 + Vite + Tailwind CSS 3 + React Router v6 + React Query
- **Backend**: Django 5 + Django REST Framework 3.15 + Django Channels 4
- **Database**: SQLite (MVP), migratable to PostgreSQL later
- **Auth**: JWT via djangorestframework-simplejwt (access token: 15min, refresh: 7 days)
- **Real-time**: WebSockets via Django Channels (in-memory channel layer for MVP)
- **Styling**: Tailwind CSS with custom design tokens (primary: #6366F1)

## Pages
| Route | Page | Purpose | Auth |
|-------|------|---------|------|
| /login | Login | Email/password auth | No |
| /register | Register | New user signup | No |
| /workspaces | Workspace List | Home — list all workspaces, create new | Yes |
| /workspaces/new | Create Workspace | New workspace form | Yes |
| /workspaces/:wid | Workspace Dashboard | Workspace detail, project grid, member avatars | Yes |
| /workspaces/:wid/projects/new | Create Project | New project form | Yes |
| /workspaces/:wid/projects/:pid | Project Board | Kanban board with 3 columns (todo/in_progress/done) | Yes |
| /workspaces/:wid/projects/:pid/tasks/:tid | Task Detail | Full task view/edit modal | Yes |
| /workspaces/:wid/settings | Workspace Settings | Edit workspace, manage members | Yes |
| /profile | Profile | User profile settings | Yes |

## Navigation
- **Desktop**: Sidebar + top bar + breadcrumbs
- **Mobile**: Bottom tab bar (Home, Current Workspace, Profile) + hamburger menu
- **Breadcrumbs**: Workspaces > Workspace Name > Project Name > Task Title

## API Routes
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | /api/auth/register/ | No | Register user |
| POST | /api/auth/login/ | No | Login, get JWT |
| POST | /api/auth/token/refresh/ | No | Refresh JWT |
| GET | /api/auth/me/ | Yes | Current user profile |
| PUT | /api/auth/me/ | Yes | Update profile |
| GET | /api/workspaces/ | Yes | List user's workspaces |
| POST | /api/workspaces/ | Yes | Create workspace |
| GET | /api/workspaces/{id}/ | Yes | Workspace detail |
| PUT | /api/workspaces/{id}/ | Yes | Update workspace |
| DELETE | /api/workspaces/{id}/ | Yes | Delete workspace |
| GET | /api/workspaces/{id}/members/ | Yes | List workspace members |
| POST | /api/workspaces/{id}/members/ | Yes | Add member |
| DELETE | /api/workspaces/{id}/members/{uid}/ | Yes | Remove member |
| GET | /api/workspaces/{wid}/projects/ | Yes | List projects |
| POST | /api/workspaces/{wid}/projects/ | Yes | Create project |
| GET | /api/projects/{id}/ | Yes | Project detail |
| PUT | /api/projects/{id}/ | Yes | Update project |
| DELETE | /api/projects/{id}/ | Yes | Delete project |
| GET | /api/projects/{pid}/tasks/ | Yes | List tasks (filterable) |
| POST | /api/projects/{pid}/tasks/ | Yes | Create task |
| GET | /api/tasks/{id}/ | Yes | Task detail |
| PUT | /api/tasks/{id}/ | Yes | Update task |
| PATCH | /api/tasks/{id}/ | Yes | Partial update (drag-drop) |
| DELETE | /api/tasks/{id}/ | Yes | Delete task |
| WS | /ws/workspace/{id}/?token={jwt} | Yes | Real-time workspace events |

## Database Schema
**users** — id (PK), email (unique), password, name, is_active, date_joined, last_login

**workspaces** — id (PK), name, description, created_by (FK→users), created_at, updated_at

**workspace_members** — id (PK), workspace (FK→workspaces), user (FK→users), role (admin|member), joined_at. Unique: (workspace, user)

**projects** — id (PK), workspace (FK→workspaces), name, description, created_by (FK→users), created_at, updated_at. Index: workspace

**tasks** — id (PK), project (FK→projects), title, description, status (todo|in_progress|done), priority (low|medium|high), assignee (FK→users, nullable), due_date (nullable), created_by (FK→users), created_at, updated_at. Indexes: (project, status), (assignee), (due_date), (project, assignee, status)

## File Structure
```
team_todo_backend/
├── manage.py
├── requirements.txt
├── config/
│   ├── settings.py, urls.py, asgi.py, wsgi.py, middleware.py
├── apps/
│   ├── accounts/    — models, serializers, views, urls
│   ├── workspaces/  — models, serializers, views, urls, permissions
│   ├── projects/    — models, serializers, views, urls
│   └── tasks/       — models, serializers, views, urls
├── consumers/
│   └── workspace.py, middleware.py
├── signals/
│   └── handlers.py
└── templates/
    └── index.html

team_todo_frontend/
├── package.json, vite.config.js, tailwind.config.js
├── index.html
├── src/
│   ├── main.jsx, App.jsx
│   ├── api/          — axios instance, query hooks
│   ├── contexts/     — AuthContext, WorkspaceContext
│   ├── hooks/        — useWebSocket, useAuth
│   ├── pages/        — Login, Register, WorkspaceList, WorkspaceDetail, ProjectBoard, TaskDetail, Settings, Profile
│   ├── components/   — Button, Input, Card, KanbanColumn, TaskCard, Modal, Avatar, Badge, Breadcrumbs, etc.
│   └── utils/        — formatters, validators
```

## Key Design Decisions
1. **Django Channels** for WebSockets — native Django ecosystem, works with ASGI, no extra server needed
2. **React Query** for server state — handles caching, loading states, refetching automatically
3. **Kanban board** as primary task view — intuitive drag-drop task management
4. **Email-based auth** — no username field, email is the unique identifier
5. **In-memory channel layer** for MVP — no Redis dependency. Swap to Redis for production
6. **Hard deletes** for MVP simplicity — soft deletes can be added later
