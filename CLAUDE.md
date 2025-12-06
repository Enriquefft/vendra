# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

VENDRA is a voice-based P2C sales training simulator. Salespeople configure scenarios, practice calls with AI-driven personas via voice input, and receive post-call analysis with scores and feedback.

**Tech Stack:** Next.js 16 (App Router), TypeScript, Tailwind CSS, shadcn/ui, Drizzle ORM, PostgreSQL, Better Auth (Google OAuth), OpenAI APIs.

## Common Commands

```bash
# Install dependencies
bun install

# Development server
bun dev

# Build
bun run build

# Type check
bun run type

# Lint & format
bun run lint          # Biome check
bun run format        # Biome format with fix

# Tests
bun test              # Unit tests (Happy DOM + Testing Library)
bun run e2e           # Playwright E2E tests

# Database
bun run db:push       # Run Drizzle migrations
bun run db:studio     # Open Drizzle Studio

# Before pushing changes, run:
bun run build && bun run lint && bun test
```

## Architecture

### Core Backend Modules (src/lib/)

- **PersonaEngine** (`persona-engine.ts`): Generates realistic client personas from scenario config using OpenAI
- **ConversationOrchestrator** (`conversation-orchestrator.ts`): Manages conversation flow, loads persona + history, generates client responses
- **AnalysisEngine** (`analysis-engine.ts`): Post-call analysis producing scores (0-100), successes, improvements, key moments
- **AudioGateway** (`audio-gateway.ts`): STT via OpenAI Whisper
- **OpenAI client** (`openai.ts`): Shared OpenAI SDK instance

### API Routes (src/app/api/)

- `POST /api/session` — Create session + persona
- `POST /api/session/[id]/speak` — Process seller audio → STT → client reply
- `POST /api/session/[id]/end` — Mark session ended
- `POST /api/session/[id]/analyze` — Generate analysis
- `POST /api/stt` — Standalone STT endpoint
- `/api/auth/*` — Better Auth Google OAuth

### Frontend Pages (src/app/)

- `/login` — Google sign-in
- `/configuracion` — Scenario configuration
- `/simulacion/[sessionId]` — Voice simulation UI
- `/resultado/[sessionId]` — Analysis view

### Database Schema (src/db/schema/)

- `auth.ts` — Better Auth user tables
- `simulation.ts` — session, persona_snapshot, conversation_turn, analysis tables

## Code Conventions

- **TypeScript everywhere** — No loose `any` unless justified
- **Next.js App Router** — No Pages Router
- **Naming:** PascalCase for components/types, camelCase for functions/variables, kebab-case for files
- **Branding colors:** Primary blue #1C4E89, green #2DAA6E, yellow #F2C044, light gray #F5F7FA

## Key Documentation

Read these files for detailed context:
- `Requirements.md` — Product goals and functional scope
- `Architecture.md` — System design and component responsibilities
- `Plan.md` — Delivery milestones (uses status markers: ✅ done, 🚧 in progress, ⬚ pending)
- `Branding.md` — Visual direction and colors
- `Bugs.md` — Known issues (log bugs here when discovered)

## Important Rules

- **OpenAI is the only AI provider** — No other AI services
- **No Python** — All backend logic in TypeScript/Node.js
- **Update Plan.md** when completing features (change ⬚ → 🚧 → ✅)
- **Log bugs in Bugs.md** with severity and status
- All routes are protected — unauthenticated users redirect to Google login
