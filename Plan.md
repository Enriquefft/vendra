# Plan.md
**Implementation Roadmap — MVP → Full Product**

---

# 1. Purpose

This document defines the step-by-step plan to build VENDRA, from MVP to a complete product.

It references:
- Requirements.md
- Architecture.md
- Branding.md
- LandingMockup.md
- Business.md
- Agents.md
- Bugs.md

---

# 2. Phase 0 — Preparation

### Step 0.1 — Setup
- Initialize Next.js + TS + Tailwind + shadcn/ui
- Setup repo structure
- Configure Drizzle + Postgres
- Install OpenAI SDK
- Create `.env`

### Validation:
- App runs via `npm run dev`

---

# 3. Phase 1 — MVP

### Step 1 — Database & Models
- Implement session, persona_snapshot, conversation_turn, analysis tables.
- Migrate using Drizzle.
- Smoke test DB.

---

### Step 2 — PersonaEngine
- Implement `generatePersona()`
- Add prompt rules
- Validate with zod
- Integrate with `POST /api/session`

---

### Step 3 — Configuration Page
- Implement `/configuracion`
- ScenarioForm with all inputs
- Server action → create session

---

### Step 4 — AudioGateway (STT)
- Implement audio recording + Whisper API
- Create `/api/stt`

---

### Step 5 — ConversationOrchestrator
- Load persona + history
- Build prompt
- Insert seller + client turns
- Handle client-ending logic
- Route: `/api/session/[id]/speak`

---

### Step 6 — Simulation Page
- `/simulacion/[sessionId]`
- Chat interface
- Audio recorder
- ClientCard with hide/minimize options

---

### Step 7 — AnalysisEngine
- Implement scoring + checklists + key moments
- Endpoint `/api/session/[id]/analyze`

---

### Step 8 — Results Page
- `/resultado/[sessionId]`
- Score visualization
- Aciertos / mejoras / momentos clave
- Persona summary

---

# 4. Phase 2 — Product Completion

### Step 9 — UX Improvements
- Better chat flow
- Status indicators
- Error handling

---

### Step 10 — Prompt Tuning & Realism
- Reinforce natural behavior
- Reduce robotic patterns

---

### Step 11 — E2E Tests
- Playwright/Cypress
- Full simulation tests

---

### Step 12 — Data Privacy Options
- “Delete conversation after analysis” mode

---

### Step 13 — Documentation & Refactor
- Create ARCHITECTURE.md
- Update Agents.md
- Ensure bugs.md is consistent

---

# 5. Future Roadmap (Post-MVP)
- TTS for client voice
- Teams dashboards
- CRM integration
- More advanced psychology modeling

---
