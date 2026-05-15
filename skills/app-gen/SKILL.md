---
name: app-gen
description: >
  Multi-agent app generation pipeline — takes a raw app idea and runs it through
  specialist agents (architect, UI, backend, database) to produce a final codegen
  prompt. Use this skill whenever the user says they want to "build", "create",
  "make", "generate", "banao", "banana hai" an app, website, service, MVP,
  project, feature, or product. Also trigger when they share an idea and ask for
  architecture, planning, or implementation help — even if they don't explicitly
  say "app". This skill handles the full planning-to-codegen pipeline.
---

# App Gen Pipeline

A multi-agent orchestration system that transforms raw app ideas into detailed,
actionable code generation prompts.

## Pipeline Overview

```
Raw Idea → Orchestrator → [Architect, UI, Backend, Database] → Reviewer → Codegen Prompt
```

## Workflow

### Step 1: Understand the Idea

Read the user's idea carefully. Ask clarifying questions if needed:
- What problem does this app solve?
- Who are the users?
- What platform? (web, mobile, desktop?)
- Any preferred tech stack? (If not specified, pick sensible defaults)
- Any specific features they mentioned?

### Step 2: Run the Orchestrator

Break the idea into concrete features and assign each to the right specialist
agent. Create an orchestration plan with this structure:

```json
{
  "app_name": "SafeRoam",
  "description": "Women safety app for Delhi",
  "platform": "web",
  "tech_stack": {"frontend": "React", "backend": "Node.js/Express", "database": "PostgreSQL"},
  "features": [
    {"id": "f1", "name": "User Auth", "agent": "backend,database"},
    {"id": "f2", "name": "SOS Alert", "agent": "architect,backend"},
    {"id": "f3", "name": "Route Tracking", "agent": "architect,backend,ui"},
    {"id": "f4", "name": "Dashboard UI", "agent": "ui"}
  ],
  "agent_tasks": {
    "architect": ["Define system architecture", "Choose tech stack", "Design API contracts"],
    "ui": ["Design page layouts", "Define navigation flow", "UI tokens"],
    "backend": ["Define API routes", "Business logic services", "Auth flow"],
    "database": ["Design schema", "Define relationships", "Indexes"]
  }
}
```

### Step 3: Spawn Specialist Agents

Read the relevant reference file for each agent, then execute each one's task.
Do them **sequentially** (not parallel) — each agent builds on the previous.

#### 3a: Architect Agent
Read `references/architect.md`. Output:
- System architecture diagram (ASCII/description)
- Tech stack decisions
- High-level component breakdown
- API contracts (endpoints, request/response shapes)

#### 3b: UI Agent
Read `references/ui.md`. Output:
- Page list with purpose
- Navigation flow
- UI component tokens (buttons, forms, cards, modals)
- Wireframe descriptions for key screens

#### 3c: Backend Agent
Read `references/backend.md`. Output:
- All API routes (method, path, auth, description)
- Service layer breakdown
- Middleware/security plan
- File structure

#### 3d: Database Agent
Read `references/database.md`. Output:
- All collections/tables with fields and types
- Relationships (foreign keys, references)
- Indexes for performance
- Seed data suggestions

### Step 4: Review & Merge

Read all agent outputs and merge them into a unified plan. Resolve any
conflicts (e.g., if architect says React and backend says Express, that's
consistent; if architect says MongoDB and database says SQL — resolve by
aligning with tech stack).

Output the merged plan in this format:

```markdown
# {App Name} — Build Plan

## Overview
{2-3 sentence description}

## Tech Stack
- Frontend: {framework}
- Backend: {framework}
- Database: {database}
- Auth: {approach}

## Pages
| Route | Page | Purpose |
|-------|------|---------|
| / | Dashboard | Main view |

## API Routes
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | /api/items | Required | List items |

## Database Schema
[Collection/Table definitions]

## File Structure
```
src/
├── components/
├── pages/
├── api/
└── db/
```
```

### Step 5: Generate Final Codegen Prompt

Take the merged plan and produce a single, detailed prompt that an LLM can
follow to generate the full codebase. The prompt should be:

- **Self-contained** — includes all context, schema, routes, and UI specs
- **Step-by-step** — clear ordering of what to build first
- **Action-oriented** — tells the LLM exactly what files to create and what
  each should contain

Wrap the codegen prompt in a code block so the user can copy it easily.

## Output

Deliver to the user:
1. The **merged plan** (markdown table format)
2. The **final codegen prompt** (ready to paste into any LLM)
3. Ask: "Want me to run this prompt and actually build the project?"

## Design Principles

- **Be opinionated.** If the user doesn't specify a tech stack, pick one that
  makes sense and explain why.
- **Don't over-engineer.** Start simple. The first version should be buildable
  in a few hours.
- **Explain tradeoffs.** When you make a decision, briefly note why and what
  alternatives exist.
- **Prefer convention over config.** Use standard project structures so the
  generated code is familiar and maintainable.
