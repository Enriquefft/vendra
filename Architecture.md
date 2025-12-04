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
- OpenAI SDK (chat + audio)
- Drizzle ORM + Postgres

Deployment:
- Vercel
- Neon/Supabase for Postgres

---

# 3. Architecture Diagram (Textual)
[Vendedor Voz] → [Web Audio] → [AudioGateway → STT] → [ConversationOrchestrator + PersonaEngine] → [OpenAI Chat Models]
↓
[Client Text Reply]
↓
[Frontend Chat Window + ClientCard]

After end:
[AnalysisEngine] → [OpenAI Chat] → [Score + Insights]
↓
[DB]
↓
[/resultado sessionId]

---

# 4. Core Backend Modules

## 4.1 PersonaEngine
- Input: ScenarioConfig
- Output: Persona JSON
- Uses OpenAI chat
- Stores persona_snapshot in DB

## 4.2 ConversationOrchestrator
- Input: sellerText + sessionId
- Loads persona + history
- Builds prompt for realistic client simulation
- Output: clientText + meta
- Stores conversation_turn entries
- Allows “client ending call”

## 4.3 AnalysisEngine
- Input: full conversation + persona
- Output: Analysis JSON (score, checklist, moments)
- Must produce well-structured JSON
- Writes to analysis table

## 4.4 AudioGateway
- Transcribe microphone audio
- Returns text (Spanish)
- Uses Whisper/OpenAI STT

## 4.5 SessionService
- Creates session
- Appends turns
- Ends session
- Retrieves full data

---

# 5. Database Schema (Drizzle + Postgres)

### Tables:
- **session**
- **persona_snapshot**
- **conversation_turn**
- **analysis**

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

---

# 7. Frontend Architecture

### Pages:
- `/configuracion` → scenario creation
- `/simulacion/[sessionId]` → voice simulation
- `/resultado/[sessionId]` → analysis

### Components:
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

---
