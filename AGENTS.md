# AGENTS.md

Guidance for coding agents working on **VENDRA**, a voice-based P2C sales training platform built with **Next.js**, **TypeScript**, **Tailwind CSS**, **shadcn/ui**, **Drizzle ORM**, **Postgres**, and **OpenAI APIs**.

This file complements the project docs:

- `Requirements.md`
- `Architecture.md`
- `Plan.md`
- `Branding.md`
- `LandingMockup.md`
- `Business.md`
- `Bugs.md`

If anything in this file conflicts with explicit user instructions in chat, the chat instructions win.

---

## 1. Project Overview

VENDRA is a web app that:

- Lets a **salesperson** configure a sales scenario (product, target, type of call).
- Simulates a **realistic client** using OpenAI (client responds in text).
- Captures the salesperson’s **voice** and transcribes it via OpenAI STT.
- Runs a **post-call analysis** (score 0–100, successes, improvement points, key moments).
- Stores minimal data in Postgres via **Drizzle ORM**.

Key constraints:

- All core logic is **TypeScript** in a **Next.js App Router** project.
- Backend is **Node.js + TS only** (no Python for the MVP).
- OpenAI is the only AI provider.
- UI uses **Tailwind CSS** + **shadcn/ui** and must follow the brand defined in `Branding.md`.

If you need context about features or UX, read `Requirements.md`, `Architecture.md`, and `LandingMockup.md` first.

---

## 2. Setup Commands

Assume a standard Node.js environment with **Bun**.

From the project root:

- Install dependencies:

  ```bash
  bun install
  ```

* Create and populate `.env` with at least:

  ```bash
  OPENAI_API_KEY=your-key
  DATABASE_URL=postgres-connection-string
  ```

* Run database migrations (Drizzle):

  ```bash
  # adjust to the actual drizzle command used in the repo
  npx drizzle-kit migrate
  ```

* Start dev server:

  ```bash
  bun run dev
  ```

---

## 3. Build, Lint & Type-Check

* Type-check (strict TypeScript is expected):

  ```bash
  bun run type
  # or, if not defined:
  bunx tsc --noEmit
  ```

* Lint:

  ```bash
  biome check --fix
  ```

* Build:

  ```bash
  bun run build
  ```

Before pushing any change, ensure all three commands succeed locally (no errors or warnings):

```bash
bun run build
biome check
bun test
```

If a command is unavailable, note it explicitly in your commit/PR message along with the reason.

If any of these commands are missing in `package.json`, either:

* Add a minimal script that matches the architecture described in `Architecture.md`, or
* Note the limitation in your PR/commit message.

---

## 4. Testing Instructions

Tests should eventually live under `tests/` and/or alongside components in `src`. If tests are missing, prefer **adding** them rather than ignoring this section.

Typical commands:

* Run unit/integration tests:

  ```bash
  bun test
  ```

* Run E2E tests (if Playwright/Cypress is configured):

  ```bash
  bun run test:e2e
  ```

Expectations for agents:

1. **Before major refactors or feature changes**, try to run:

   * `bun run lint`
   * `bun run type`
   * `bun test` (or `bun run test:e2e` when relevant)
2. If tests or commands cannot run due to missing deps, network limits, or CI-only scripts:

   * Clearly state this in the commit/PR description.
3. When you add new code paths (especially around:

   * Persona generation
   * Conversation orchestration
   * Analysis
   * DB access
     …add at least one focused test covering the new behavior.

---

## 5. Repository Structure

Use and preserve this structure when adding new files:

* `src/app` – Next.js routes and pages using the App Router:

  * `/configuracion` – scenario configuration.
  * `/simulacion/[sessionId]` – simulation UI (voice input + text chat).
  * `/resultado/[sessionId]` – analysis view.
* `src/components` – shared React components:

  * `ClientCard`, `ScenarioForm`, `CallView`, `AudioRecorderButton`, `ChatMessages`, `AnalysisView`, etc.
  * Reusable UI primitives (shadcn/ui-based) in `src/components/ui`.
* `src/lib` – application logic and service layers:

  * `persona` (PersonaEngine)
  * `conversation` (ConversationOrchestrator)
  * `analysis` (AnalysisEngine)
  * `audio` (AudioGateway)
  * `session` (SessionService)
* `src/db` – Drizzle schemas and database utilities:

  * `session`, `persona_snapshot`, `conversation_turn`, `analysis` tables as in `Architecture.md` and `Plan.md`.
* `src/styles` – global CSS and Tailwind config.
* `tests` – unit/e2e tests (Playwright/Cypress/Jest/Vitest; choose one consistent approach).
* `docs` – documentation:

  * `Requirements.md`
  * `Architecture.md`
  * `Plan.md`
  * `Branding.md`
  * `LandingMockup.md`
  * `Business.md`
  * `Bugs.md`

If you introduce new folders, keep them consistent with this mental model.

---

## 6. Code Style & Conventions

### Language & Framework

* TypeScript everywhere (no loose `any` unless justified).
* Next.js App Router (no new Pages Router code).
* React functional components only (no class components).

### UI

* Use **Tailwind CSS** for styling.
* Use **shadcn/ui** components as the base for UI primitives.
* Follow the branding in `Branding.md`:

  * Colors: primary blue `#1C4E89`, green `#2DAA6E`, yellow `#F2C044`, light gray `#F5F7FA`.
  * Typography: Inter + Source Sans Pro patterns.
* Keep layouts clean, with generous whitespace. Use the patterns in `LandingMockup.md`.

### Naming

* Components & types: **PascalCase** (e.g., `ClientCard`, `AnalysisResult`).
* Variables & functions: **camelCase** (e.g., `generatePersona`, `getClientReply`).
* File names: **kebab-case** (e.g., `client-card.tsx`, `persona-engine.ts`).
* Database tables and columns: keep them aligned with Drizzle schema defined in `Plan.md` / `Architecture.md`.

### General style

* Keep lines under ~100 characters when possible.
* Prefer pure functions and simple, explicit control flow.
* Avoid global mutable state; use React context or local state where needed.
* Do not introduce Python or other backend languages for core app logic.

---

## 7. Domain Rules (Very Important)

When interacting with or modifying domain logic, respect the product definition:

* **PersonaEngine**:

  * Takes a seller-provided ScenarioConfig.
  * Generates a *single* realistic persona per session.
  * Uses OpenAI chat with clear JSON outputs validated via zod.
  * Must reflect Peruvian/LatAm P2C context where appropriate.

* **ConversationOrchestrator**:

  * Receives the seller’s utterance (from STT) plus session ID.
  * Loads persona + conversation history from DB.
  * Calls OpenAI to generate a client response + meta data:

    * Interest level
    * Whether the client wants to end the call
  * Always writes turns (seller/client) into `conversation_turn`.

* **AnalysisEngine**:

  * Runs only after the call ends.
  * Uses full conversation + persona to compute:

    * Score 0–100
    * Successes
    * Improvements (with concrete suggestions)
    * Key moments (with quotes and turn references)
  * Must remain consistent with `Requirements.md` and examples in `Plan.md` / `LandingMockup.md`.

* **AudioGateway**:

  * Responsible only for STT (voice → text).
  * Uses OpenAI Whisper/audio APIs.
  * Does not decide business logic.

If you change any of these behaviors, cross-check with:

* `Requirements.md`
* `Architecture.md`
* `Plan.md`
  and update them if necessary.

---

## 8. Bug Tracking

All bugs must be logged in **`Bugs.md`** using the template defined there.

Agent expectations:

* When you **discover** a defect (logic, UX, performance, integration, etc.):

  * Add an entry to `Bugs.md` under “Known Bugs”.
* When you **start** working on a fix:

  * Update status to “En progreso”.
* When you **finish** a fix:

  * Set status to “Resuelto”, add date and short “Resolution” description.
  * If relevant, reference commits or PR IDs.

Do **not** delete old bug entries; they form part of the project history.

---

## 9. Commit & PR Guidelines

Even if you’re not literally opening a GitHub PR, follow these practices:

* Keep changesets small and focused.
* Prefix commit/PR titles with:

  * `feat:` for new features
  * `fix:` for bug fixes
  * `refactor:` for internal changes
  * `chore:` for tooling/doc updates
* In the description, summarize:

  * What changed
  * Which files were touched
* Any commands you ran (`bun run lint`, `bun test`, etc.)
  * Any remaining TODOs or limitations

* Keep `Plan.md` current: when you complete and test a section, mark it as done in the plan so future agents can see progress at a glance.

---

## 9.1. Keeping Plan.md Up to Date

`Plan.md` uses status markers to track implementation progress. When working on features:

### Status Legend

* **✅** = Implemented & Tested (code merged, tests pass, feature verified)
* **🚧** = In Progress (actively being worked on)
* **⬚** = Not Started (pending implementation)

### Update Rules

1. **Before starting work** on a step:
   * Change the step's marker from ⬚ to 🚧
   * Add 🚧 markers to the specific sub-items you're working on

2. **After completing and testing** a step:
   * Change the step's marker from 🚧 to ✅
   * Change all sub-items to ✅
   * Ensure tests pass (`bun test`) and the feature is verified

3. **When committing changes**:
   * Include `Plan.md` updates in the same commit as the feature code
   * Reference the step number in your commit message (e.g., "feat: implement Step 4 — AudioGateway")

4. **Partial progress**:
   * If you complete some sub-items but not all, mark individual sub-items accordingly
   * The parent step remains 🚧 until all sub-items are ✅

### Example

Before:
```md
### Step 4 — AudioGateway (STT) ⬚
- ⬚ Implement audio recording + Whisper API
- ⬚ Create `/api/stt`
```

In progress:
```md
### Step 4 — AudioGateway (STT) 🚧
- 🚧 Implement audio recording + Whisper API
- ⬚ Create `/api/stt`
```

Completed:
```md
### Step 4 — AudioGateway (STT) ✅
- ✅ Implement audio recording + Whisper API
- ✅ Create `/api/stt`
```

Example PR description:

> feat: add analysis page layout
>
> * Implemented `/resultado/[sessionId]` page
> * New components: `AnalysisView`, `ScoreBadge`
> * Ran `bun run lint` and `bun run type` (both passed)
> * No tests added yet, to be done in a follow-up PR

---

## 10. Security & Safety Considerations

* Never hardcode API keys (OpenAI, DB, etc.).
* All secrets must come from environment variables.
* When logging, do **not** log:

  * Full conversation contents in production (unless explicitly allowed).
  * API keys or access tokens.
* If you detect a potential privacy or data retention issue:

  * Log it as a bug in `Bugs.md` with **Impact: Alto**.

---

## 11. AGENTS.md Inheritance

These instructions apply to the entire repo by default.

If subdirectories later define their own `AGENTS.md`, **those files override** these rules for files within those directories. Do not add nested AGENTS.md unless the subproject genuinely needs different build/test/style instructions.

---

By following this AGENTS.md and keeping `Requirements.md`, `Architecture.md`, `Plan.md`, `Branding.md`, `LandingMockup.md`, `Business.md`, and `Bugs.md` in sync with your changes, you help ensure VENDRA remains coherent, testable, and easy for both humans and agents to work on.
