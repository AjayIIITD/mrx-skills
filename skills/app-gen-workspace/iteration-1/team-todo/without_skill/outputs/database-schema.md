# TeamTodo — Database Schema

## ER Diagram (Text)

```
User ──< WorkspaceMember >── Workspace
                                │
                           Project ──< Task >── TaskComment
```

## Models

### 1. User (extends Django's AbstractUser)

| Field       | Type                     | Notes                        |
|-------------|--------------------------|------------------------------|
| id          | AutoField (PK)           |                              |
| username    | CharField(150, unique)   | From AbstractUser            |
| email       | EmailField(254, unique)  | Required for registration    |
| password    | CharField(128)           | Hashed via Django            |
| first_name  | CharField(150)           | Display name                 |
| last_name   | CharField(150)           |                              |
| date_joined | DateTimeField            | auto_now_add                 |
| is_active   | BooleanField             | Default True                 |

### 2. Workspace

| Field       | Type                     | Notes                        |
|-------------|--------------------------|------------------------------|
| id          | AutoField (PK)           |                              |
| name        | CharField(255)           | Required                     |
| description | TextField(blank=True)    |                              |
| created_by  | ForeignKey(User)         | Creator (owner)              |
| created_at  | DateTimeField            | auto_now_add                 |
| updated_at  | DateTimeField            | auto_now                     |

### 3. WorkspaceMember

| Field       | Type                     | Notes                        |
|-------------|--------------------------|------------------------------|
| id          | AutoField (PK)           |                              |
| workspace   | ForeignKey(Workspace)    | CASCADE on delete            |
| user        | ForeignKey(User)         | CASCADE on delete            |
| role        | CharField(10)            | Choices: 'owner', 'admin', 'member' |
| joined_at   | DateTimeField            | auto_now_add                 |

**Unique**: `(workspace, user)` — a user can only be a member once.

### 4. Project

| Field       | Type                     | Notes                        |
|-------------|--------------------------|------------------------------|
| id          | AutoField (PK)           |                              |
| workspace   | ForeignKey(Workspace)    | CASCADE on delete            |
| name        | CharField(255)           | Required                     |
| description | TextField(blank=True)    |                              |
| color       | CharField(7)             | Hex color (#6366f1 default)  |
| created_by  | ForeignKey(User)         |                              |
| created_at  | DateTimeField            | auto_now_add                 |
| updated_at  | DateTimeField            | auto_now                     |

### 5. Task

| Field       | Type                     | Notes                        |
|-------------|--------------------------|------------------------------|
| id          | AutoField (PK)           |                              |
| project     | ForeignKey(Project)      | CASCADE on delete            |
| title       | CharField(500)           | Required                     |
| description | TextField(blank=True)    | Markdown-ish                 |
| status      | CharField(20)            | Choices: 'todo', 'in_progress', 'done' |
| priority    | CharField(10)            | Choices: 'low', 'medium', 'high', 'urgent' |
| assignee    | ForeignKey(User, null)   | SET_NULL on user delete      |
| due_date    | DateField(null, blank)   |                              |
| created_by  | ForeignKey(User)         |                              |
| created_at  | DateTimeField            | auto_now_add                 |
| updated_at  | DateTimeField            | auto_now                     |
| order       | PositiveIntegerField(0)  | For drag-reordering (future) |

**Indexes**: `(project, status)`, `(assignee)`, `(due_date)`

### 6. TaskComment

| Field       | Type                     | Notes                        |
|-------------|--------------------------|------------------------------|
| id          | AutoField (PK)           |                              |
| task        | ForeignKey(Task)         | CASCADE on delete            |
| author      | ForeignKey(User)         |                              |
| content     | TextField()              | Required                     |
| created_at  | DateTimeField            | auto_now_add                 |
| updated_at  | DateTimeField            | auto_now                     |

## SQLite Configuration

```python
# In settings.py
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': BASE_DIR / 'db.sqlite3',
        'OPTIONS': {
            'timeout': 20,
            'init_command': 'PRAGMA journal_mode=WAL;'
                           'PRAGMA synchronous=NORMAL;'
                           'PRAGMA foreign_keys=ON;',
        }
    }
}
```

WAL mode allows concurrent reads while a write is in progress — critical for WebSocket-backed apps.
