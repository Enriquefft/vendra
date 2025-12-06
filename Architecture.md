# Architecture.md
**System Architecture for VENDRA — Voice-Based P2C Sales Training Platform**

---

# 1. Overview

The system architecture supports:
- Persona generation (PersonaEngine)
- Voice input (STT)
- Realistic conversation simulation
- Post-call analysis
- Complete web-based experience (Next.js)
- Mandatory Google OAuth login backed by Better Auth and persisted user records.

No Python is used. Entire logic lives in **Node + TypeScript** using **Next.js**.

---

# 2. Tech Stack

Frontend:
- Next.js (App Router)
- React
- TailwindCSS
- shadcn/ui
- Zustand (optional) or React Query
- WebMedia APIs (audio recording)

Backend:
- Next.js Route Handlers + Server Actions
- Node.js + TypeScript
- AI Provider Layer (supports OpenAI, Anthropic, Mock)
- Drizzle ORM + Postgres
- Better Auth (Google OAuth provider)

Deployment:
- Vercel
- Neon/Supabase for Postgres

---

# 2.5. AI Provider Layer

VENDRA uses a flexible AI provider abstraction layer built on **Vercel AI SDK** that supports multiple providers:

**Supported Providers:**
- **OpenAI**: Uses `gpt-4o-mini` for chat completions and `whisper-1` for STT
- **Anthropic**: Uses `claude-3-5-haiku-20241022` for chat completions and AssemblyAI for STT
- **Mock**: For testing without API keys

**Provider Selection:**
Set via `AI_PROVIDER` environment variable ("openai" | "anthropic" | "mock")

**STT Provider Logic:**
- OpenAI → OpenAI Whisper
- Anthropic → AssemblyAI (fully decoupled from OpenAI)
- Mock → Mock transcription

**Implementation:**
- `src/lib/ai/index.ts` - Main entry point
- `src/lib/ai/config.ts` - Provider configuration
- `src/lib/ai/providers.ts` - Chat provider initialization
- `src/lib/ai/stt.ts` - STT provider initialization
- `src/lib/ai/mock.ts` - Mock implementations

**Key Functions:**
- `completeJson<T>(options, schema, mockOptions)` - Structured JSON output
- `complete(options, mockOptions)` - Text completion
- `transcribe(audioBlob, options)` - Audio transcription

**Migration from Legacy:**
The old `src/lib/openai.ts` module is deprecated. All core modules now use the new AI layer.

---

# 3. Architecture Diagram (Textual)
[Vendedor Voz] → [Web Audio] → [AudioGateway → STT] → [ConversationOrchestrator + PersonaEngine] → [AI Provider Layer] → [OpenAI/Anthropic]
↓
[Client Text Reply]
↓
[Frontend Chat Window + ClientCard]

After end:
[AnalysisEngine] → [AI Provider Layer] → [OpenAI/Anthropic] → [Score + Insights]
↓
[DB]
↓
[/resultado sessionId]

---

# 4. Core Backend Modules

## 4.1 PersonaEngine
- Input: ScenarioConfig
- Output: Persona JSON
- Uses AI Provider Layer for chat completions
- Stores persona_snapshot in DB

## 4.2 ConversationOrchestrator
- Input: sellerText + sessionId
- Loads persona + history
- Builds prompt for realistic client simulation
- Uses AI Provider Layer for chat completions
- Output: clientText + meta
- Stores conversation_turn entries
- Allows "client ending call"

## 4.3 AnalysisEngine
- Input: full conversation + persona
- Output: Analysis JSON (score, checklist, moments)
- Uses AI Provider Layer for structured JSON generation
- Must produce well-structured JSON
- Writes to analysis table

## 4.4 AudioGateway
- Transcribe microphone audio
- Returns text (Spanish)
- Uses AI Provider Layer for STT (Whisper/AssemblyAI based on provider)

## 4.5 SessionService
- Creates session
- Appends turns
- Ends session
- Retrieves full data
- Associates every session with the authenticated user id from Better Auth

## 4.6 AuthService
- Relies on Better Auth Google OAuth for sign-in and session cookies
- Exposes helpers to fetch the current user server-side
- Stores user profile data (id, email, name, avatar) in the user table on first login

---

# 5. Database Schema (Drizzle + Postgres)

### Tables:
- **session**
- **persona_snapshot**
- **conversation_turn**
- **analysis**
- **user** (Better Auth-managed user profile with Google identity)
- **session_user** linkage (each simulation session tied to authenticated user)

Described in detail in `Plan.md`.

---

# 6. API Routes

### `/api/session` (POST)
Creates session + persona.

### `/api/session/[id]/speak` (POST)
Handles seller audio → STT → client reply.

### `/api/session/[id]/end` (POST)
Marks session ended by seller.

### `/api/session/[id]/analyze` (POST)
Generates analysis.

### `/api/stt` (POST)
Standalone STT endpoint (debug).

### `/api/auth/*`
Better Auth endpoints for Google OAuth sign-in, callback, session validation, and sign-out.

---

# 7. Frontend Architecture

### Pages:
- `/login` (Better Auth Google sign-in entrypoint; required before accessing app flows)
- `/configuracion` → scenario creation
- `/simulacion/[sessionId]` → voice simulation
- `/resultado/[sessionId]` → analysis

### Components:
- AuthGuard / middleware to redirect unauthenticated users to Google login
- ScenarioForm
- CallView
- AudioRecorderButton
- ChatMessages
- ClientCard
- AnalysisView

---

# 8. Constraints & Rules

- Must use only OpenAI APIs
- Persona must be coherent with business + branding
- Client must act humanly
- Analysis must be actionable and concise
- All modules must log errors → update `bugs.md`
- No hallucinated features allowed
- App routes and APIs are protected: unauthenticated users are redirected to Google login via Better Auth

---
