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

# 8. Module Implementation Details

## 8.1 PersonaEngine (src/lib/persona-engine.ts)

**Purpose**: Generates realistic client personas from scenario configuration.

**Key Functions**:
- `generatePersona(config: ScenarioConfig)` → `{ persona: PersonaProfile; usedMock: boolean }`

**Implementation Details**:
- Uses `completeJson()` from AI Provider Layer with `personaProfileSchema` validation
- Temperature: 0.9 (high creativity for unique personas)
- Contact type differentiation:
  - `cold_call`: Generic needs, no product knowledge
  - `follow_up`: Familiarity with product from previous contact
  - `inbound_callback`: Proactive client with specific questions
- Returns structured persona with age, location, occupation, motivations, pains, personality traits, briefStory, and callAttitude

## 8.2 ConversationOrchestrator (src/lib/conversation-orchestrator.ts)

**Purpose**: Manages realistic conversation flow between seller and AI client.

**Key Functions**:
- `orchestrateConversation(input: OrchestratorInput)` → `OrchestratorOutput`

**Implementation Details**:
- Loads persona, scenario config, and conversation history
- Generates previous context for `follow_up` and `inbound_callback` on first turn
- Uses dynamic system prompts based on:
  - Contact type (cold_call/follow_up/inbound_callback)
  - Client intensity (difícil/neutro/tranquilo)
  - Realism level (exigente/humano/natural)
  - Product knowledge level (persona-dependent for cold calls)
- Anti-robotic language instructions to prevent AI-like responses
- Extracts client text from JSON history for natural conversation flow
- Returns structured response with `clientText`, `interest` (1-10), `interruption`, and `wantsToEnd` flags
- Temperature: 0.8 (balanced creativity and consistency)
- Stores metadata (interest, interruption, wantsToEnd) in conversation turns

**Emotional Arc**:
- Interest dynamically increases/decreases based on seller performance
- Initial interest varies by contact type (3 for cold_call, 5 for follow_up, 7 for inbound_callback)

## 8.3 AnalysisEngine (src/lib/analysis-engine.ts)

**Purpose**: Post-call evaluation producing actionable feedback.

**Key Functions**:
- `analyzeSession(input: AnalysisInput)` → `AnalysisResult`
- `getAnalysis(sessionId: string)` → `AnalysisResult | null`

**Implementation Details**:
- Loads full conversation with turn IDs for key moment references
- Evaluates 8 dimensions (holistically, not as checklist):
  - Rapport, Descubrimiento, Valor, Manejo de objeciones
  - Avance hacia cierre, Comunicación, Control de la llamada, Uso del tiempo
- Uses `completeJson()` with `analysisOutputSchema` validation
- Temperature: 0.7 (balanced analysis)
- Returns:
  - Score (0-100)
  - Successes (array of strings)
  - Improvements (array of {title, action})
  - Key moments (array of {turnId, quote, insight, recommendation})
- Prevents duplicate analyses per session
- Contextual analysis based on scenario config and persona profile

## 8.4 AudioGateway (src/lib/audio-gateway.ts)

**Purpose**: Speech-to-Text transcription.

**Key Functions**:
- `transcribeAudio(audioBlob: Blob)` → `string`

**Implementation Details**:
- Uses `transcribe()` from AI Provider Layer
- Provider-specific STT:
  - OpenAI → Whisper API
  - Anthropic → AssemblyAI
  - Mock → Mock transcription
- Language: Spanish (es)
- Returns transcribed text

## 8.5 AI Provider Layer (src/lib/ai/)

**Purpose**: Flexible abstraction supporting multiple AI providers.

**Files**:
- `index.ts` - Main entry point with `completeJson()`, `complete()`, `transcribe()`
- `config.ts` - Provider configuration and environment variables
- `providers.ts` - Chat provider initialization (OpenAI/Anthropic/Mock)
- `stt.ts` - STT provider initialization (Whisper/AssemblyAI/Mock)
- `mock.ts` - Mock implementations for testing

**Key Functions**:
- `completeJson<T>(options, schema, mockOptions)` - Structured JSON with Zod validation
- `complete(options, mockOptions)` - Text completion
- `transcribe(audioBlob, options)` - Audio transcription

**Provider Configuration**:
- `AI_PROVIDER` env var: "openai" | "anthropic" | "mock"
- `AI_CHAT_MODEL` (optional): Override default chat model
- `AI_STT_MODEL` (optional): Override default STT model

**Provider Mappings**:
- OpenAI: `gpt-4o-mini` (chat), `whisper-1` (STT)
- Anthropic: `claude-3-5-haiku-20241022` (chat), AssemblyAI (STT)
- Mock: Mock responses for testing

---

# 9. API Route Details

## 9.1 POST /api/session (src/app/api/session/route.ts)

**Purpose**: Creates new simulation session with persona.

**Flow**:
1. Validate authenticated user (Better Auth)
2. Parse and validate scenario config
3. Generate persona via PersonaEngine
4. Insert session record
5. Insert persona snapshot
6. Return sessionId

**Response**: `{ sessionId: string }`

## 9.2 POST /api/session/[id]/speak (src/app/api/session/[id]/speak/route.ts)

**Purpose**: Processes seller audio and generates client response.

**Flow**:
1. Validate session ownership
2. Transcribe audio via AudioGateway
3. Orchestrate conversation via ConversationOrchestrator
4. Return client response

**Request**: Audio blob (multipart/form-data)

**Response**: `{ clientText: string, interest: number, interruption: boolean, wantsToEnd: boolean }`

## 9.3 POST /api/session/[id]/end (src/app/api/session/[id]/end/route.ts)

**Purpose**: Marks session as ended by seller.

**Flow**:
1. Validate session ownership
2. Update session status to "ended"
3. Optionally delete conversation turns if privacy mode enabled

**Response**: `{ success: boolean }`

## 9.4 POST /api/session/[id]/analyze (src/app/api/session/[id]/analyze/route.ts)

**Purpose**: Generates post-call analysis.

**Flow**:
1. Validate session ownership
2. Check session is ended
3. Analyze via AnalysisEngine
4. Return analysis result

**Response**: `{ score: number, successes: string[], improvements: ImprovementItem[], keyMoments: KeyMoment[] }`

## 9.5 POST /api/stt (src/app/api/stt/route.ts)

**Purpose**: Standalone STT endpoint for debugging.

**Flow**:
1. Transcribe audio via AudioGateway
2. Return transcribed text

**Request**: Audio blob (multipart/form-data)

**Response**: `{ text: string }`

---

# 10. Database Schema Details

## Tables

### simulationSessions
- `id` (uuid, PK)
- `userId` (text, FK → user.id)
- `scenarioConfig` (jsonb)
- `status` (text: "active" | "ended")
- `createdAt` (timestamp)
- `endedAt` (timestamp, nullable)

### personaSnapshots
- `id` (uuid, PK)
- `sessionId` (uuid, FK → simulationSessions.id)
- `persona` (jsonb: PersonaProfile)
- `createdAt` (timestamp)

### conversationTurns
- `id` (uuid, PK)
- `sessionId` (uuid, FK → simulationSessions.id)
- `turnIndex` (integer) - Can be negative for simulated previous context
- `role` (text: "seller" | "client")
- `content` (text)
- `meta` (jsonb: { interest?, interruptions?, clientWantsToEnd? })
- `createdAt` (timestamp)

### analyses
- `id` (uuid, PK)
- `sessionId` (uuid, FK → simulationSessions.id, unique)
- `score` (integer: 0-100)
- `successes` (jsonb: string[])
- `improvements` (jsonb: ImprovementItem[])
- `keyMoments` (jsonb: KeyMoment[])
- `createdAt` (timestamp)

### user (Better Auth)
- `id` (text, PK)
- `email` (text)
- `name` (text)
- `image` (text, nullable)
- `emailVerified` (boolean)
- `createdAt` (timestamp)
- `updatedAt` (timestamp)

---

# 11. Constraints & Rules

- AI Provider Layer supports OpenAI, Anthropic, and Mock providers
- Persona must be coherent with business + branding
- Client must act humanly (anti-robotic language enforcement)
- Analysis must be actionable and concise
- All modules must log errors → update `bugs.md`
- No hallucinated features allowed
- App routes and APIs are protected: unauthenticated users are redirected to Google login via Better Auth
- Cold calls must not reveal product knowledge (BUG-001 mitigation)
- Contact type (cold_call/follow_up/inbound_callback) determines initial client behavior
- Conversation history stores client text only (not full JSON) for natural flow

---
