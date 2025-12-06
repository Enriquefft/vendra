# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

VENDRA is a voice-based P2C sales training simulator. Salespeople configure scenarios, practice calls with AI-driven personas via voice input, and receive post-call analysis with scores and feedback.

**Tech Stack:** Next.js 16 (App Router), TypeScript, Tailwind CSS, shadcn/ui, Drizzle ORM, PostgreSQL, Better Auth (Google OAuth), AI Provider Layer (OpenAI/Anthropic/Mock via Vercel AI SDK).

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

- **AI Provider Layer** (`ai/`): Flexible abstraction supporting OpenAI, Anthropic, and Mock providers via Vercel AI SDK
- **PersonaEngine** (`persona-engine.ts`): Generates realistic client personas from scenario config using AI Provider Layer
- **ConversationOrchestrator** (`conversation-orchestrator.ts`): Manages conversation flow, loads persona + history, generates client responses
- **AnalysisEngine** (`analysis-engine.ts`): Post-call analysis producing scores (0-100), successes, improvements, key moments
- **AudioGateway** (`audio-gateway.ts`): STT via AI Provider Layer (OpenAI Whisper or AssemblyAI based on provider)
- **OpenAI client** (`openai.ts`): **DEPRECATED** - Use `ai/` instead

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

- **AI Provider Layer** — Supports OpenAI, Anthropic, and Mock providers. Configure via `AI_PROVIDER` environment variable.
- **No Python** — All backend logic in TypeScript/Node.js
- **Update Plan.md** when completing features (change ⬚ → 🚧 → ✅)
- **Log bugs in Bugs.md** with severity and status
- All routes are protected — unauthenticated users redirect to Google login

## AI Provider Configuration

The system uses a flexible AI provider abstraction layer:

**Environment Variables:**
- `AI_PROVIDER` - Choose provider: "openai" (default), "anthropic", or "mock"
- `AI_CHAT_MODEL` - Optional: Override default chat model
- `AI_STT_MODEL` - Optional: Override default STT model
- `OPENAI_API_KEY` - Required for OpenAI provider
- `ANTHROPIC_API_KEY` - Required for Anthropic provider
- `ASSEMBLYAI_API_KEY` - Required for STT when using Anthropic

**Provider Behavior:**
- OpenAI: Uses gpt-4o-mini for chat, Whisper for STT
- Anthropic: Uses claude-3-5-haiku-20241022 for chat, AssemblyAI for STT
- Mock: For testing without API keys

**Key Functions** (from `src/lib/ai/`):
- `completeJson<T>(options, schema, mockOptions)` - Structured JSON output
- `complete(options, mockOptions)` - Text completion
- `transcribe(audioBlob, options)` - Audio transcription
