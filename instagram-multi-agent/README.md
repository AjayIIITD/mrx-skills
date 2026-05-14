# Instagram Multi-Agent System

Multi-agent architecture for automated Instagram growth.

## Architecture

```
⏱ Cron Scheduler
   → 🧠 Orchestrator (main)
      → 📊 Analyser (Groq Llama 3.1 70B)
      → 🔍 Trend Scout (Groq Llama 3.1 70B)
      → 📅 Content Planner (Groq Llama 3.1 70B)
      → ✍️ Caption Writer (Groq Llama 3.1 70B)
   → 🔥 Firebase
   → 🚀 Publisher → 📸 Instagram Graph API
   → 🔄 Feedback loop
```

## Setup

1. Clone and install:
```bash
cd instagram-multi-agent
npm install
```

2. Copy `.env.example` to `.env` and fill in API keys:
```bash
cp .env.example .env
```

3. Run once:
```bash
npm run orchestrate
```

4. Or start the cron scheduler:
```bash
npm start
```

## API Keys Needed
- **Groq API** — free at console.groq.com
- **Firebase** — Firestore database
- **Instagram Graph API** — Facebook app + Instagram Business account
