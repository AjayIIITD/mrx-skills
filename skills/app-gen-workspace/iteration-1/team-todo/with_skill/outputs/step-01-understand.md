# Step 1: Understand the Idea

## User Prompt
"Ek team-based todo app banao. Features: workspaces, multiple projects per workspace, tasks with assignees and due dates, real-time updates via WebSockets. Mobile responsive web app. Backend mein Django use karna hai with SQLite for now."

## Clarification
- **Problem**: Teams need a collaborative task management tool with workspace isolation.
- **Users**: Team members working across multiple projects within shared workspaces.
- **Platform**: Web app, mobile-responsive.
- **Tech Stack** (user-specified):
  - Backend: Django + SQLite
  - Frontend: Not specified — will pick React + Tailwind CSS (best mobile-responsive SPA experience with Django REST)
  - Real-time: Django Channels (native WebSocket support in Django ecosystem)
- **Key Features**:
  1. User authentication & team membership
  2. Workspaces (isolated team spaces)
  3. Multiple projects per workspace
  4. Tasks with assignees and due dates
  5. Real-time updates via WebSockets
  6. Mobile responsive design

## Assumptions
- Use Django REST Framework for API layer
- Use Django Channels for WebSocket consumers
- JWT-based auth via djangorestframework-simplejwt
- SQLite for MVP (easy setup, no external DB server needed)
- React SPA frontend served separately (or via Django serving static files)
