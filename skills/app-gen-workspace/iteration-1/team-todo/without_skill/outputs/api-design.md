# TeamTodo — API Design

## Base URL: `/api/`

All responses are JSON. Authentication via JWT Bearer token in `Authorization` header.

---

## 1. Authentication

### POST /api/auth/register/
```
Request:  { "username": "ajay", "email": "ajay@example.com", "password": "...", "first_name": "Ajay" }
Response: { "id": 1, "username": "ajay", "email": "ajay@example.com", "first_name": "Ajay" }
Status:   201
```

### POST /api/auth/login/
```
Request:  { "username": "ajay", "password": "..." }
Response: { "refresh": "...", "access": "..." }
Status:   200
```

### POST /api/auth/refresh/
```
Request:  { "refresh": "..." }
Response: { "access": "..." }
Status:   200
```

---

## 2. Workspaces

### GET /api/workspaces/
List workspaces the current user is a member of.

```
Response: [
  { "id": 1, "name": "Design Team", "description": "...", "member_count": 5, "project_count": 3, "created_at": "..." },
  ...
]
Status: 200
```

### POST /api/workspaces/
```
Request:  { "name": "Design Team", "description": "..." }
Response: { "id": 1, "name": "Design Team", "description": "...", "member_count": 1, "created_at": "..." }
Status:   201
```
Auto-adds creator as `owner`.

### GET /api/workspaces/{id}/
```
Response: { "id": 1, "name": "Design Team", "description": "...", "members": [...], "created_at": "..." }
Status:   200 / 404
```

### PUT /api/workspaces/{id}/
```
Request:  { "name": "Design Team v2" }
Response: { "id": 1, "name": "Design Team v2", ... }
Status:   200
```

### DELETE /api/workspaces/{id}/
```
Status: 204
```

### GET /api/workspaces/{id}/members/
```
Response: [
  { "id": 1, "user": { "id": 1, "username": "ajay", "email": "..." }, "role": "owner" },
  ...
]
Status: 200
```

### POST /api/workspaces/{id}/members/
```
Request:  { "user_id": 3, "role": "member" }
Response: { "id": 2, "user": { ... }, "role": "member" }
Status:   201
```

### DELETE /api/workspaces/{id}/members/{member_id}/
```
Status: 204
```

---

## 3. Projects (nested under workspace)

### GET /api/workspaces/{wid}/projects/
```
Response: [
  { "id": 1, "name": "UI Design", "description": "...", "color": "#6366f1", "task_count": 12, "created_at": "..." },
  ...
]
Status: 200
```

### POST /api/workspaces/{wid}/projects/
```
Request:  { "name": "UI Design", "description": "...", "color": "#6366f1" }
Response: { "id": 1, "name": "UI Design", "description": "...", "color": "#6366f1", "task_count": 0, "created_at": "..." }
Status:   201
```

### GET /api/workspaces/{wid}/projects/{id}/
```
Response: { "id": 1, "name": "UI Design", ... }
Status: 200
```

### PUT /api/workspaces/{wid}/projects/{id}/
```
Request:  { "name": "UI Design v2" }
Response: { ... updated ... }
Status: 200
```

### DELETE /api/workspaces/{wid}/projects/{id}/
```
Status: 204
```

---

## 4. Tasks (nested under project)

### GET /api/workspaces/{wid}/projects/{pid}/tasks/
Query params: `?status=todo&assignee=1&priority=high&ordering=-created_at`

```
Response: [
  {
    "id": 1,
    "title": "Fix navbar",
    "description": "...",
    "status": "todo",
    "priority": "high",
    "assignee": { "id": 1, "username": "ajay", "first_name": "Ajay" },
    "due_date": "2026-05-20",
    "comment_count": 3,
    "created_by": { "id": 1, "username": "ajay" },
    "created_at": "...",
    "updated_at": "..."
  },
  ...
]
Status: 200
```

### POST /api/workspaces/{wid}/projects/{pid}/tasks/
```
Request:  { "title": "Fix navbar", "description": "...", "status": "todo", "priority": "high", "assignee_id": 1, "due_date": "2026-05-20" }
Response: { ... full task object ... }
Status:   201
```
On success, broadcasts `task.created` to workspace WS group.

### PATCH /api/workspaces/{wid}/projects/{pid}/tasks/{id}/
```
Request:  { "status": "in_progress", "assignee_id": 3 }
Response: { ... updated task ... }
Status:   200
```
On success, broadcasts `task.updated` to workspace WS group.

### DELETE /api/workspaces/{wid}/projects/{pid}/tasks/{id}/
```
Status: 204
```
Broadcasts `task.deleted`.

---

## 5. Comments (nested under task)

### GET /api/workspaces/{wid}/projects/{pid}/tasks/{tid}/comments/
```
Response: [
  { "id": 1, "content": "I can take this", "author": { "id": 2, "username": "rani" }, "created_at": "..." },
  ...
]
Status: 200
```

### POST /api/workspaces/{wid}/projects/{pid}/tasks/{tid}/comments/
```
Request:  { "content": "I can take this" }
Response: { ... full comment ... }
Status:   201
```

---

## 6. WebSocket

### Connect
```
ws://localhost:8000/ws/workspace/{workspace_id}/?token={jwt_access_token}
```

### Server → Client messages
```json
{ "type": "task.created", "task": { ... } }
{ "type": "task.updated", "task": { ... } }
{ "type": "task.deleted", "task_id": 1 }
{ "type": "project.created", "project": { ... } }
{ "type": "member.joined", "member": { ... } }
{ "type": "ping" }   // heartbeat every 30s
```

### Client → Server messages
```json
{ "type": "ping" }
{ "type": "pong" }
```

---

## 7. Status Codes

| Code | Meaning                          |
|------|----------------------------------|
| 200  | Success (GET, PUT, PATCH)        |
| 201  | Created (POST)                   |
| 204  | Deleted (DELETE)                 |
| 400  | Validation error                 |
| 401  | Unauthenticated                  |
| 403  | Forbidden (not a member)         |
| 404  | Not found                        |
| 409  | Conflict (duplicate membership)  |

---

## 8. Error Response Format

```json
{
  "error": "Validation error",
  "details": { "title": ["This field is required."] }
}
```
