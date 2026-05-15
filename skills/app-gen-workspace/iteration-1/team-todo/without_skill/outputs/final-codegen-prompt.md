# TeamTodo — Full Codegen Prompt

Below is a complete, self-contained prompt you can give to any LLM code generator to build the entire TeamTodo app from scratch.

---

## INSTRUCTIONS FOR THE LLM

Build a complete team-based todo web app called **TeamTodo** with these specifications. Generate ALL files. Do not skip any file. Do not use placeholder comments — write complete, working code.

---

## TECH STACK

- **Backend**: Django 5.0, Django REST Framework, Django Channels 4, SimpleJWT
- **ASGI Server**: Daphne (handles both HTTP and WebSocket)
- **Database**: SQLite with WAL mode
- **Frontend**: Single HTML page with Tailwind CSS (CDN) + vanilla JS
- **Icons**: Heroicons SVG inline (https://heroicons.com)

---

## DIRECTORY STRUCTURE

Create this exact structure under `teamtodo/`:

```
teamtodo/
├── manage.py
├── requirements.txt
├── config/
│   ├── __init__.py
│   ├── settings.py
│   ├── asgi.py
│   ├── urls.py
│   └── ws_urls.py
├── accounts/
│   ├── __init__.py
│   ├── models.py
│   ├── serializers.py
│   ├── views.py
│   └── urls.py
├── workspaces/
│   ├── __init__.py
│   ├── models.py
│   ├── serializers.py
│   ├── views.py
│   ├── urls.py
│   └── permissions.py
├── projects/
│   ├── __init__.py
│   ├── models.py
│   ├── serializers.py
│   ├── views.py
│   └── urls.py
├── tasks/
│   ├── __init__.py
│   ├── models.py
│   ├── serializers.py
│   ├── views.py
│   ├── urls.py
│   └── filters.py
├── notifications/
│   ├── __init__.py
│   ├── consumers.py
│   └── routing.py
├── frontend/
│   ├── __init__.py
│   ├── views.py
│   │   (single view that renders the SPA shell)
│   ├── templates/
│   │   └── frontend/
│   │       └── index.html
│   └── static/
│       └── frontend/
│           ├── css/
│           │   └── app.css
│           └── js/
│               ├── api.js
│               ├── auth.js
│               ├── app.js
│               ├── router.js
│               ├── workspace.js
│               ├── project.js
│               ├── task.js
│               ├── comment.js
│               └── websocket.js
```

---

## REQUIREMENTS.TXT

```
Django>=5.0,<5.1
djangorestframework>=3.15,<3.16
djangorestframework-simplejwt>=5.3,<5.4
django-channels>=4.0,<5.0
django-filter>=24.1,<25.0
daphne>=4.0,<5.0
```

---

## DATABASE MODELS

### accounts/models.py — User
Extend `AbstractUser`. Add no extra fields now (profile can be added later). Use AUTH_USER_MODEL = "accounts.User" in settings.

### workspaces/models.py
```python
class Workspace(models.Model):
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True, default="")
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="owned_workspaces")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

class WorkspaceMember(models.Model):
    ROLE_CHOICES = [("owner", "Owner"), ("admin", "Admin"), ("member", "Member")]
    workspace = models.ForeignKey(Workspace, on_delete=models.CASCADE, related_name="memberships")
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="workspace_memberships")
    role = models.CharField(max_length=10, choices=ROLE_CHOICES, default="member")
    joined_at = models.DateTimeField(auto_now_add=True)
    class Meta: unique_together = ("workspace", "user")
```

### projects/models.py
```python
class Project(models.Model):
    workspace = models.ForeignKey(Workspace, on_delete=models.CASCADE, related_name="projects")
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True, default="")
    color = models.CharField(max_length=7, default="#6366f1")
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
```

### tasks/models.py
```python
class Task(models.Model):
    STATUS_CHOICES = [("todo", "To Do"), ("in_progress", "In Progress"), ("done", "Done")]
    PRIORITY_CHOICES = [("low", "Low"), ("medium", "Medium"), ("high", "High"), ("urgent", "Urgent")]
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name="tasks")
    title = models.CharField(max_length=500)
    description = models.TextField(blank=True, default="")
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="todo")
    priority = models.CharField(max_length=10, choices=PRIORITY_CHOICES, default="medium")
    assignee = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL, related_name="assigned_tasks")
    due_date = models.DateField(null=True, blank=True)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="created_tasks")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    order = models.PositiveIntegerField(default=0)

class TaskComment(models.Model):
    task = models.ForeignKey(Task, on_delete=models.CASCADE, related_name="comments")
    author = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
```

---

## SERIALIZERS

Write ModelSerializers for all models. Nest user data in task/comment serializers as `{ "id": 1, "username": "...", "first_name": "..." }`. Include `member_count` and `project_count` on WorkspaceListSerializer as annotated fields. Include `task_count` on ProjectListSerializer.

UserSerializer: id, username, email, first_name, last_name.

---

## VIEWS (DRF ViewSets)

### workspaces/views.py
- `WorkspaceViewSet`: queryset filtered to workspaces where user is a member. `perform_create` sets `created_by = request.user` and auto-creates owner membership. Include `members` action (GET/POST/DELETE sub-URL for membership management).
- `IsWorkspaceMember` permission class: check if user has a membership in the workspace referenced by URL kwarg.

### projects/views.py
- `ProjectViewSet`: nested under workspace. `get_queryset` filters by `workspace_id` URL kwarg. `perform_create` sets `created_by` and `workspace`. After create, broadcast via channel layer.

### tasks/views.py
- `TaskViewSet`: nested under project. Supports filtering by `status`, `assignee`, `priority` via `django-filter`. `perform_create` sets `created_by`. On create/update/delete, broadcast to workspace WS group.

### tasks/views.py (comments)
- `TaskCommentViewSet`: nested under task. `get_queryset` filtered by `task_id`. `perform_create` sets `author`.

---

## PERMISSIONS

Custom permission class in `workspaces/permissions.py`:

```python
class IsWorkspaceMember(permissions.BasePermission):
    def has_permission(self, request, view):
        workspace_id = view.kwargs.get("workspace_pk") or view.kwargs.get("pk")
        return WorkspaceMember.objects.filter(
            workspace_id=workspace_id, user=request.user
        ).exists()
```

Use this on all project, task, and comment views.

---

## URL ROUTING

### config/urls.py
```
/api/auth/        → accounts.urls
/api/workspaces/  → workspaces.urls
```

### accounts/urls.py
```
POST register/    → RegisterView (APIView)
POST login/       → TokenObtainPairView
POST refresh/     → TokenRefreshView
```

### workspaces/urls.py
DefaultRouter:
```
workspaces/           → WorkspaceViewSet
workspaces/{pk}/      → WorkspaceViewSet (detail)
workspaces/{pk}/members/ → WorkspaceViewSet (members list/create)
workspaces/{pk}/members/{member_pk}/ → WorkspaceViewSet (member delete)
workspaces/{pk}/projects/ → projects.urls (nested)
```

### projects/urls.py
DefaultRouter (registered with `workspace_pk` lookup):
```
projects/           → ProjectViewSet
projects/{pk}/      → ProjectViewSet (detail)
projects/{pk}/tasks/ → tasks.urls (nested)
```

### tasks/urls.py
DefaultRouter:
```
tasks/           → TaskViewSet
tasks/{pk}/      → TaskViewSet (detail)
tasks/{pk}/comments/ → TaskCommentViewSet
```

---

## WEBSOCKET (Django Channels)

### notifications/consumers.py
```python
class WorkspaceConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.workspace_id = self.scope["url_route"]["kwargs"]["workspace_id"]
        self.group_name = f"workspace_{self.workspace_id}"
        user = await self._get_user_from_token()
        if not user or not await self._is_member(user):
            await self.close()
            return
        self.scope["user"] = user
        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept()

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(self.group_name, self.channel_name)

    async def receive(self, text_data):
        data = json.loads(text_data)
        if data.get("type") == "pong":
            pass  # heartbeat

    async def task_created(self, event):   await self.send(text_data=json.dumps(event))
    async def task_updated(self, event):   await self.send(text_data=json.dumps(event))
    async def task_deleted(self, event):   await self.send(text_data=json.dumps(event))
    async def project_created(self, event): await self.send(text_data=json.dumps(event))
    async def member_joined(self, event):  await self.send(text_data=json.dumps(event))
    async def ping(self, event):           await self.send(text_data=json.dumps({"type": "ping"}))
```

Authentication: extract JWT from `?token=` query param, validate with `AccessToken`, get user.

Helper to broadcast:
```python
from asgiref.sync import async_to_sync
async_to_sync(channel_layer.group_send)(f"workspace_{ws_id}", {"type": "task.created", "task": data})
```

Call this in TaskViewSet's `perform_create`, `perform_update`, `perform_destroy` (and similarly in ProjectViewSet).

### config/asgi.py
```python
application = ProtocolTypeRouter({
    "http": get_asgi_application(),
    "websocket": AuthMiddlewareStack(URLRouter(ws_urls.ws_urlpatterns)),
})
```

### config/ws_urls.py
```python
ws_urlpatterns = [re_path(r"ws/workspace/(?P<workspace_id>\d+)/$", WorkspaceConsumer.as_asgi())]
```

---

## SETTINGS (config/settings.py)

Critical settings:
```python
INSTALLED_APPS = [
    "daphne",  # MUST be first
    "django.contrib.admin",
    "django.contrib.auth",
    ...
    "rest_framework",
    "rest_framework_simplejwt",
    "channels",
    "django_filters",
    "accounts",
    "workspaces",
    "projects",
    "tasks",
    "notifications",
    "frontend",
]

ASGI_APPLICATION = "config.asgi.application"

CHANNEL_LAYERS = {
    "default": {
        "BACKEND": "channels.layers.InMemoryChannelLayer",
    },
}

REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": ("rest_framework_simplejwt.authentication.JWTAuthentication",),
    "DEFAULT_PERMISSION_CLASSES": ("rest_framework.permissions.IsAuthenticated",),
    "DEFAULT_FILTER_BACKENDS": ("django_filters.rest_framework.DjangoFilterBackend", "rest_framework.filters.OrderingFilter"),
}

from datetime import timedelta
SIMPLE_JWT = {"ACCESS_TOKEN_LIFETIME": timedelta(hours=2), "REFRESH_TOKEN_LIFETIME": timedelta(days=7)}

AUTH_USER_MODEL = "accounts.User"

DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.sqlite3",
        "NAME": BASE_DIR / "db.sqlite3",
        "OPTIONS": {
            "timeout": 20,
            "init_command": "PRAGMA journal_mode=WAL; PRAGMA synchronous=NORMAL; PRAGMA foreign_keys=ON;",
        },
    }
}

TEMPLATES = [{"DIRS": [], "APP_DIRS": True, ...}]
STATIC_URL = "static/"
STATICFILES_DIRS = [BASE_DIR / "frontend" / "static"]

LOGIN_URL = "/login/"
LOGIN_REDIRECT_URL = "/app/"
```

---

## FRONTEND — SINGLE PAGE APP

### frontend/templates/frontend/index.html

A complete self-contained SPA. Structure:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>TeamTodo</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
  <link href="/static/frontend/css/app.css" rel="stylesheet">
</head>
<body class="font-['Inter'] bg-gray-50 text-gray-900 min-h-screen">
  <div id="app"></div>
  <script src="/static/frontend/js/api.js"></script>
  <script src="/static/frontend/js/auth.js"></script>
  <script src="/static/frontend/js/websocket.js"></script>
  <script src="/static/frontend/js/workspace.js"></script>
  <script src="/static/frontend/js/project.js"></script>
  <script src="/static/frontend/js/task.js"></script>
  <script src="/static/frontend/js/comment.js"></script>
  <script src="/static/frontend/js/router.js"></script>
  <script src="/static/frontend/js/app.js"></script>
</body>
</html>
```

### Global State (app.js)

```javascript
const AppState = {
  user: null,
  token: null,
  workspaces: [],
  currentWorkspace: null,
  projects: [],
  currentProject: null,
  tasks: [],
  members: [],
  ws: null,
  page: 'login',
  loading: false,
};

function render(html) {
  document.getElementById('app').innerHTML = html;
}

function $(id) { return document.getElementById(id); }
```

### API Client (api.js)

```javascript
const API = {
  async request(method, url, body = null) {
    const headers = { 'Content-Type': 'application/json' };
    if (AppState.token) headers['Authorization'] = `Bearer ${AppState.token}`;
    const opts = { method, headers };
    if (body) opts.body = JSON.stringify(body);
    const res = await fetch(url, opts);
    if (res.status === 204) return null;
    const data = await res.json();
    if (!res.ok) throw data;
    return data;
  },
  get(url) { return this.request('GET', url); },
  post(url, body) { return this.request('POST', url, body); },
  patch(url, body) { return this.request('PATCH', url, body); },
  delete(url) { return this.request('DELETE', url); },
};
```

### Auth Pages (auth.js)

Functions `renderLogin()`, `renderRegister()` that return HTML strings and attach event listeners.

Login form: username, password, submit. On success, store token in `localStorage`, set `AppState.token`, navigate to `/app`.

Register form: first_name, username, email, password, confirm_password. On success, redirect to login.

### Router Logic (router.js)

```javascript
function navigate(path) {
  history.pushState(null, '', path);
  route();
}

function route() {
  const path = window.location.pathname;
  if (!AppState.token) { renderLogin(); return; }
  if (path === '/login' || path === '/') { renderLogin(); return; }
  if (path === '/register') { renderRegister(); return; }
  if (path === '/app') { renderWorkspaceList(); return; }
  const wsMatch = path.match(/^\/app\/workspace\/(\d+)$/);
  if (wsMatch) { loadWorkspaceDetail(wsMatch[1]); return; }
  const projMatch = path.match(/^\/app\/workspace\/(\d+)\/project\/(\d+)$/);
  if (projMatch) { loadProjectBoard(projMatch[1], projMatch[2]); return; }
  renderNotFound();
}

window.addEventListener('popstate', route);
```

### Workspace List (workspace.js)

`renderWorkspaceList()`: Fetches `GET /api/workspaces/`, displays cards. Each card shows name, description, member count, project count. "New Workspace" button opens inline form or modal. Click navigates to `/app/workspace/{id}`.

### Project List (workspace.js — `loadWorkspaceDetail`)

Fetches `GET /api/workspaces/{id}/` and `GET /api/workspaces/{id}/projects/`. Shows back button, workspace name, member list, project cards in a grid. "New Project" button. Each project card shows name, color bar, task count. Click navigates to `/app/workspace/{wid}/project/{pid}`.

Include a "Members" section with inline list and "Add Member" button (shows email input, calls POST /api/workspaces/{id}/members/).

### Task Board (project.js)

`loadProjectBoard(wid, pid)`: Fetches `GET /api/workspaces/{wid}/projects/{pid}/tasks/`. Renders a 3-column Kanban board (To Do / In Progress / Done).

Each task card shows: title, priority badge (colored), assignee avatar/name, due date. Click opens task detail modal.

On mobile (<768px), render as stacked accordion sections instead of columns.

"Add Task" button opens a modal form with: title, description (textarea), assignee (dropdown of workspace members), priority, due date, status.

### Task Detail Modal (task.js)

Full-screen overlay modal showing:
- Title, status badge, priority badge
- Assignee, due date, created info
- Description (with markdown-like display)
- Edit button (opens same form as create, pre-filled)
- Delete button (with confirmation)
- Comments section
- Close button / click-outside-to-close

### Comments (comment.js)

Inside task detail modal: list of comments with author avatar, name, timestamp, content. Comment input at bottom with Send button. Posts to `POST /api/.../comments/` and appends.

### WebSocket Client (websocket.js)

```javascript
function connectWebSocket(workspaceId) {
  if (AppState.ws) AppState.ws.close();
  const token = AppState.token;
  const wsUrl = `ws://${window.location.host}/ws/workspace/${workspaceId}/?token=${token}`;
  AppState.ws = new WebSocket(wsUrl);
  AppState.ws.onmessage = handleWSMessage;
  AppState.ws.onclose = () => setTimeout(() => connectWebSocket(workspaceId), 3000);
  AppState.ws.onopen = () => {
    AppState.wsConnected = true;
    setInterval(() => {
      if (AppState.ws.readyState === WebSocket.OPEN) AppState.ws.send(JSON.stringify({type: 'pong'}));
    }, 25000);
  };
}

function handleWSMessage(event) {
  const data = JSON.parse(event.data);
  switch (data.type) {
    case 'task.created':
      addTaskToBoard(data.task);
      showToast(`New task: ${data.task.title}`);
      break;
    case 'task.updated':
      updateTaskOnBoard(data.task);
      break;
    case 'task.deleted':
      removeTaskFromBoard(data.task_id);
      break;
    case 'project.created':
      addProjectToList(data.project);
      break;
    case 'ping':
      AppState.ws.send(JSON.stringify({type: 'pong'}));
      break;
  }
}
```

---

## RESPONSIVE DESIGN RULES

Apply these Tailwind classes consistently:

- **Containers**: `max-w-7xl mx-auto px-4 sm:px-6 lg:px-8`
- **Grids**: `grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4`
- **Modals**: `fixed inset-0 z-50 flex items-center justify-center p-4` with inner card `w-full max-w-lg max-h-[90vh] overflow-y-auto`
- **On mobile**: modals become `fixed inset-0 rounded-none` (fullscreen)
- **Kanban**: `flex flex-col md:flex-row gap-4` — columns stack vertically on mobile
- **Navigation**: Top bar `h-16` with hamburger on mobile (`lg:hidden`), sidebar hidden on mobile
- **Tables/Lists**: Stack cards vertically on mobile, grid on desktop

---

## CUSTOM CSS (app.css — minimal)

```css
.task-card { transition: transform 0.15s, box-shadow 0.15s; }
.task-card:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
.priority-high { @apply bg-red-100 text-red-800; }
.priority-urgent { @apply bg-red-200 text-red-900; }
.priority-medium { @apply bg-yellow-100 text-yellow-800; }
.priority-low { @apply bg-green-100 text-green-800; }
.status-todo { @apply border-l-4 border-gray-400; }
.status-in_progress { @apply border-l-4 border-blue-400; }
.status-done { @apply border-l-4 border-green-400; }
.toast { animation: slideUp 0.3s ease-out; }
@keyframes slideUp { from { transform: translateY(100%); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
```

---

## FRONTEND VIEW (Django)

```python
# frontend/views.py
from django.shortcuts import render

def index(request):
    return render(request, "frontend/index.html")
```

```python
# config/urls.py — add at the END of urlpatterns
path("", include("frontend.urls")),
```

```python
# frontend/urls.py
from django.urls import re_path
from . import views
urlpatterns = [
    re_path(r"^(?:app/.*|login|register)?$", views.index, name="app"),
]
```

This catch-all serves the SPA shell for all frontend routes.

---

## BROADCASTING FROM VIEWSETS

Add this helper in a shared module (e.g., `notifications/utils.py`):

```python
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer

def broadcast_to_workspace(workspace_id, event_type, data):
    channel_layer = get_channel_layer()
    async_to_sync(channel_layer.group_send)(
        f"workspace_{workspace_id}",
        {"type": event_type, **data},
    )
```

Call it in TaskViewSet:

```python
def perform_create(self, serializer):
    task = serializer.save(created_by=self.request.user)
    broadcast_to_workspace(
        task.project.workspace_id,
        "task.created",
        {"task": TaskSerializer(task).data},
    )

def perform_update(self, serializer):
    task = serializer.save()
    broadcast_to_workspace(
        task.project.workspace_id,
        "task.updated",
        {"task": TaskSerializer(task).data},
    )

def perform_destroy(self, instance):
    workspace_id = instance.project.workspace_id
    task_id = instance.id
    instance.delete()
    broadcast_to_workspace(workspace_id, "task.deleted", {"task_id": task_id})
```

Same pattern for ProjectViewSet (broadcast `project.created`).

---

## RUNNING THE APP

```bash
cd teamtodo
pip install -r requirements.txt
python manage.py makemigrations
python manage.py migrate
python manage.py runserver
# Opens on http://localhost:8000
# Daphne handles both HTTP and WebSocket on the same port
```

---

## WHAT TO BUILD — COMPLETE CHECKLIST

### Backend (Django)
- [ ] `config/settings.py` — all installed apps, middleware, DRF config, Channels, JWT, DB
- [ ] `config/asgi.py` — ProtocolTypeRouter for HTTP + WebSocket
- [ ] `config/ws_urls.py` — WebSocket URL routing
- [ ] `config/urls.py` — root URL conf
- [ ] `accounts/models.py` — Custom User model
- [ ] `accounts/serializers.py` — RegisterSerializer, UserSerializer
- [ ] `accounts/views.py` — RegisterView (APIView)
- [ ] `accounts/urls.py` — auth routes
- [ ] `workspaces/models.py` — Workspace, WorkspaceMember
- [ ] `workspaces/serializers.py` — WorkspaceSerializer with member/project counts
- [ ] `workspaces/views.py` — WorkspaceViewSet with members sub-actions
- [ ] `workspaces/permissions.py` — IsWorkspaceMember
- [ ] `workspaces/urls.py` — router + nested routes
- [ ] `projects/models.py` — Project model
- [ ] `projects/serializers.py` — ProjectSerializer
- [ ] `projects/views.py` — ProjectViewSet with WS broadcast
- [ ] `projects/urls.py` — nested router
- [ ] `tasks/models.py` — Task, TaskComment
- [ ] `tasks/serializers.py` — TaskSerializer, TaskCommentSerializer
- [ ] `tasks/views.py` — TaskViewSet + TaskCommentViewSet with broadcast
- [ ] `tasks/urls.py` — nested router
- [ ] `tasks/filters.py` — TaskFilter (status, assignee, priority)
- [ ] `notifications/consumers.py` — WorkspaceConsumer
- [ ] `notifications/routing.py` — (or use config/ws_urls.py)
- [ ] `notifications/utils.py` — broadcast_to_workspace helper
- [ ] `frontend/views.py` — SPA index view
- [ ] `frontend/urls.py` — catch-all route pattern

### Frontend (HTML/JS)
- [ ] `frontend/templates/frontend/index.html` — full SPA shell
- [ ] `frontend/static/frontend/css/app.css` — minimal custom styles
- [ ] `frontend/static/frontend/js/api.js` — API client
- [ ] `frontend/static/frontend/js/auth.js` — Login + Register UI
- [ ] `frontend/static/frontend/js/websocket.js` — WS connect + message handler
- [ ] `frontend/static/frontend/js/workspace.js` — Workspace list + detail
- [ ] `frontend/static/frontend/js/project.js` — Project list + Kanban board
- [ ] `frontend/static/frontend/js/task.js` — Task CRUD modals
- [ ] `frontend/static/frontend/js/comment.js` — Comment UI
- [ ] `frontend/static/frontend/js/router.js` — SPA router
- [ ] `frontend/static/frontend/js/app.js` — AppState, render, init

---

## IMPORTANT IMPLEMENTATION NOTES

1. **UUIDs**: Use auto-increment integer PKs for simplicity.
2. **Error handling**: Every API call in frontend JS must `.catch()` and show a toast/snackbar with the error message.
3. **Loading states**: Show `Loading...` text or a spinner (`<div class="animate-pulse">`) while fetching.
4. **Empty states**: When no workspaces/projects/tasks, show a friendly empty state message with a call-to-action button.
5. **Edge cases**: Handle token expiry (401 → redirect to login). Handle WS disconnect → auto-reconnect with exponential backoff (start at 1s, max 30s).
6. **Toast system**: Maintain a simple toast container in the DOM. Toast disappears after 3 seconds.
7. **Drag and drop**: Not required for MVP. Use simple "change status via dropdown/click" instead.
8. **Pagination**: Task list returns max 100 items. No pagination controls needed for MVP.
9. **No admin.py files needed** — but it's fine to include basic admin registrations.
10. **No tests required** for the first codegen, but structure code so tests can be added.

---

Generate EVERY file listed above with complete, working code. Do not skip any file. Do not leave TODOs or placeholders. Every function must be fully implemented.
