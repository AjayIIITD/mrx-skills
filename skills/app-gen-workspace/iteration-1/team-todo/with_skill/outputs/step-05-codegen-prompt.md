```
# Codegen: TeamTodo — Full-Stack Django + React Todo App

## Overview
Build a production-ready team-based todo app called "TeamTodo" with workspaces, projects, tasks, assignees, due dates, and real-time WebSocket updates. Mobile-responsive web app.

## Tech Stack
- **Frontend**: React 18 + Vite + Tailwind CSS 3 + React Router v6 + React Query (@tanstack/react-query)
- **Backend**: Django 5 + Django REST Framework + Django Channels 4
- **Database**: SQLite
- **Auth**: JWT (djangorestframework-simplejwt)
- **Real-time**: Django Channels WebSockets (in-memory channel layer)

## Directory Structure
Create two top-level directories: `backend/` and `frontend/`.

### Backend structure:
```
backend/
├── manage.py
├── requirements.txt
├── config/
│   ├── __init__.py
│   ├── settings.py
│   ├── urls.py
│   ├── asgi.py
│   └── wsgi.py
├── apps/
│   ├── __init__.py
│   ├── accounts/
│   │   ├── __init__.py
│   │   ├── models.py
│   │   ├── serializers.py
│   │   ├── views.py
│   │   └── urls.py
│   ├── workspaces/
│   │   ├── __init__.py
│   │   ├── models.py
│   │   ├── serializers.py
│   │   ├── views.py
│   │   ├── urls.py
│   │   └── permissions.py
│   ├── projects/
│   │   ├── __init__.py
│   │   ├── models.py
│   │   ├── serializers.py
│   │   ├── views.py
│   │   └── urls.py
│   └── tasks/
│       ├── __init__.py
│       ├── models.py
│       ├── serializers.py
│       ├── views.py
│       └── urls.py
├── consumers/
│   ├── __init__.py
│   ├── workspace.py
│   └── middleware.py
└── signals/
    ├── __init__.py
    └── handlers.py
```

### Frontend structure:
```
frontend/
├── package.json
├── vite.config.js
├── tailwind.config.js
├── postcss.config.js
├── index.html
├── src/
│   ├── main.jsx
│   ├── App.jsx
│   ├── index.css
│   ├── api/
│   │   ├── axios.js
│   │   ├── auth.js
│   │   ├── workspaces.js
│   │   ├── projects.js
│   │   └── tasks.js
│   ├── contexts/
│   │   ├── AuthContext.jsx
│   │   └── WorkspaceContext.jsx
│   ├── hooks/
│   │   ├── useWebSocket.js
│   │   └── useAuth.js
│   ├── pages/
│   │   ├── Login.jsx
│   │   ├── Register.jsx
│   │   ├── WorkspaceList.jsx
│   │   ├── CreateWorkspace.jsx
│   │   ├── WorkspaceDetail.jsx
│   │   ├── CreateProject.jsx
│   │   ├── ProjectBoard.jsx
│   │   ├── TaskDetail.jsx
│   │   ├── WorkspaceSettings.jsx
│   │   └── Profile.jsx
│   └── components/
│       ├── Button.jsx
│       ├── Input.jsx
│       ├── Card.jsx
│       ├── KanbanColumn.jsx
│       ├── TaskCard.jsx
│       ├── Modal.jsx
│       ├── Avatar.jsx
│       ├── Badge.jsx
│       ├── Breadcrumbs.jsx
│       ├── Sidebar.jsx
│       ├── TopBar.jsx
│       ├── LoadingSkeleton.jsx
│       └── EmptyState.jsx
```

## Database Models

### User (apps/accounts/models.py)
- Extend AbstractUser — use email as USERNAME_FIELD, remove username field
- Fields: email (unique, required), password, name (CharField 100), is_active, date_joined, last_login
- REQUIRED_FIELDS = ['name']

### Workspace (apps/workspaces/models.py)
- id (AutoField PK), name (CharField 200), description (TextField blank=True), created_by (FK→User, CASCADE), created_at (auto_now_add), updated_at (auto_now)

### WorkspaceMember (apps/workspaces/models.py)
- id (PK), workspace (FK→Workspace, CASCADE), user (FK→User, CASCADE), role (CharField 20, choices=['admin','member'], default='member'), joined_at (auto_now_add)
- Meta: unique_together = [['workspace', 'user']]

### Project (apps/projects/models.py)
- id (PK), workspace (FK→Workspace, CASCADE, related_name='projects'), name (CharField 200), description (TextField blank=True), created_by (FK→User, CASCADE), created_at, updated_at
- Meta: indexes = [models.Index(fields=['workspace'])]

### Task (apps/tasks/models.py)
- id (PK), project (FK→Project, CASCADE, related_name='tasks'), title (CharField 300), description (TextField blank=True), status (CharField 20, choices=['todo','in_progress','done'], default='todo'), priority (CharField 10, choices=['low','medium','high'], default='medium'), assignee (FK→User, null=True, SET_NULL), due_date (DateField null=True blank=True), created_by (FK→User, CASCADE), created_at, updated_at
- Meta: indexes = [models.Index(fields=['project','status']), models.Index(fields=['assignee']), models.Index(fields=['due_date'])]

## API Routes — Build These

### Auth (/api/auth/)
- POST /register/ → RegisterSerializer → Create user → Return {id, email, name}
- POST /login/ → Obtain JWT tokens (use simplejwt's TokenObtainPairView, but customize to accept email)
- POST /token/refresh/ → Refresh JWT (simplejwt's TokenRefreshView)
- GET /me/ → Return current user
- PUT /me/ → Update name/email/password

### Workspaces (/api/workspaces/)
- GET / → List workspaces where request.user is a member (annotate with member_count)
- POST / → Create workspace + auto-create WorkspaceMember with role='admin'
- GET /{id}/ → Workspace detail with member list (check IsWorkspaceMember)
- PUT /{id}/ → Update (check IsWorkspaceAdmin)
- DELETE /{id}/ → Delete (check IsWorkspaceAdmin)
- GET /{id}/members/ → List members
- POST /{id}/members/ → Add member by email (check IsWorkspaceAdmin)
- DELETE /{id}/members/{user_id}/ → Remove member (check IsWorkspaceAdmin)

### Projects (/api/ — nested under workspaces)
- GET /workspaces/{wid}/projects/ → List projects (check workspace membership)
- POST /workspaces/{wid}/projects/ → Create project
- GET /projects/{id}/ → Project detail
- PUT /projects/{id}/ → Update
- DELETE /projects/{id}/ → Delete

### Tasks (/api/ — nested under projects)
- GET /projects/{pid}/tasks/ → List with filters (?status=&assignee=&due_before=&priority=&search=)
- POST /projects/{pid}/tasks/ → Create task → Broadcast via WebSocket
- GET /tasks/{id}/ → Task detail
- PUT /tasks/{id}/ → Full update → Broadcast via WebSocket
- PATCH /tasks/{id}/ → Partial update (status/drag-drop) → Broadcast via WebSocket
- DELETE /tasks/{id}/ → Delete → Broadcast via WebSocket

## WebSocket — WorkspaceConsumer (consumers/workspace.py)
- Path: ws/workspace/{workspace_id}/?token=JWT_TOKEN
- Auth: Verify JWT on connect, check workspace membership, then add to channel layer group "workspace_{workspace_id}"
- Signals: Connect Django signals on Task post_save/post_delete to trigger group_send
- Events sent: {"type": "task.created", "payload": {task_data}}, "task.updated", "task.deleted", "task.status_changed"
- Events received: {"type": "ping"} → respond with {"type": "pong"}

## Permissions (apps/workspaces/permissions.py)
- IsWorkspaceMember: Check if request.user is in workspace's members
- IsWorkspaceAdmin: Check if request.user is admin for the workspace
- Helper: extract workspace_id from URL kwargs or from project/task object

## Frontend Pages — Build These

### Login (/login)
- Centered card on gradient bg
- Email + password inputs, Login button
- Link to Register page
- On success: store tokens, redirect to /workspaces
- States: loading, error message

### Register (/register)
- Same layout as Login
- Name + Email + Password + Submit
- On success: auto-login, redirect to /workspaces

### WorkspaceList (/workspaces)
- Top bar with app name + user avatar dropdown
- "Your Workspaces" heading + "Create Workspace" button
- Grid of workspace cards (2 cols desktop, 1 col mobile)
- Empty state when no workspaces
- Loading: skeleton cards

### CreateWorkspace (/workspaces/new)
- Form: name (required), description (optional)
- On submit: POST to API, redirect to new workspace

### WorkspaceDetail (/workspaces/:wid)
- Breadcrumbs: Workspaces > [Name]
- Header: name, description, member avatars row, settings gear
- Projects tab: grid of project cards
- Each card: name, task count, click to navigate

### CreateProject (/workspaces/:wid/projects/new)
- Form: name (required), description (optional)

### ProjectBoard (/workspaces/:wid/projects/:pid)
- Three-column Kanban: TODO | IN PROGRESS | DONE
- Columns are horizontally scrollable on mobile
- Task cards show: title, priority dot, due date badge, assignee avatar
- Drag-and-drop between columns (desktop), tap to move (mobile)
- "+" button to create task
- Real-time: WebSocket updates column counts and card positions
- Empty states per column

### TaskDetail (route or modal at /workspaces/:wid/projects/:pid/tasks/:tid)
- Status badge, title (editable), description, assignee dropdown, due date picker, priority toggle
- Save / Delete buttons
- Delete confirmation modal

### WorkspaceSettings (/workspaces/:wid/settings)
- Edit name/description
- Members table with Remove button
- Add member by email input
- Danger zone: Delete workspace

### Profile (/profile)
- Edit name, email, password fields
- Save button

## UI Components to Build
- **Button**: variants=primary|secondary|ghost|danger|icon, states=default|hover|disabled|loading
- **Input**: variants=text|email|password|textarea|select|date|search, states=default|focused|error|disabled
- **Card**: rounded-xl, shadow-sm, hover:shadow-md, padding-4
- **KanbanColumn**: header (status name + count) + scrollable task list + droppable
- **TaskCard**: draggable, shows title(2-line truncate), priority dot, due date badge, assignee avatar
- **Modal**: backdrop overlay, centered, close on backdrop click/Escape
- **Avatar**: circular, shows initial letter, colored bg based on user id
- **Badge**: rounded-full, colored by status/priority
- **Breadcrumbs**: styled separator, last item bold
- **Sidebar**: collapsible, shows nav links, workspace switcher
- **TopBar**: app name left, user menu right (avatar + dropdown)
- **LoadingSkeleton**: shimmer animation for cards/lists
- **EmptyState**: centered illustration SVG + heading + description + CTA button

## Design Tokens (Tailwind Config)
- Colors: primary #6366F1, secondary #0EA5E9, success #22C55E, warning #F59E0B, danger #EF4444
- bg_page: #F8FAFC, bg_card: #FFFFFF
- text_primary: #1E293B, text_secondary: #64748B
- border: #E2E8F0
- Border radius: card 12px, button 8px, input 8px
- Font: Inter (include via Google Fonts in index.html)

## Implementation Order
1. **Backend setup**: Django project, settings, ASGI config, requirements.txt
2. **Accounts app**: User model, serializers, views, auth endpoints
3. **Workspaces app**: Models, permissions, views, endpoints
4. **Projects app**: Models, views, endpoints
5. **Tasks app**: Models, serializers, views, endpoints
6. **WebSocket**: Consumer, middleware, signals, routing
7. **Frontend setup**: Vite + React + Tailwind + Router + Query
8. **Auth pages**: Login, Register, AuthContext
9. **Workspace pages**: List, Create, Detail, Settings
10. **Project pages**: Create, Board (Kanban)
11. **Task pages**: Detail, TaskCard, drag-drop
12. **WebSocket integration**: useWebSocket hook, real-time updates
13. **Polish**: Loading states, empty states, error handling, responsive testing

## Error Handling
- Backend: Consistent JSON error format — {"error": {"code": "...", "message": "...", "details": []}}
- Frontend: React Query error handling, toast/alert for API errors, form field validation errors
- HTTP 401 → redirect to /login
- HTTP 403 → show "Access denied" message
- HTTP 404 → show "Not found" page
- Network error → show "Connection lost" with retry button

## Validation Rules
- Email: valid format, max 254 chars
- Password: min 8 chars
- Name: max 100 chars (user), max 200 chars (workspace/project), max 300 chars (task title)
- Due date: must be a valid date (YYYY-MM-DD), can be in past
- Status: only 'todo', 'in_progress', 'done'
- Priority: only 'low', 'medium', 'high'
- Assignee: must be a member of the workspace

Build everything now. Make it complete and functional.
```
