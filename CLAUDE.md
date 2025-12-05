# CLAUDE.md

Comprehensive guidance for AI assistants (Claude and similar) working on **VENDRA**, a voice-based P2C sales training platform. This document complements `AGENTS.md` with additional context, workflows, and conventions optimized for AI-assisted development.

**Related Documentation:**
- `AGENTS.md` – coding agent-specific instructions
- `Requirements.md` – product goals and functional scope
- `Architecture.md` – system design and component responsibilities
- `Plan.md` – delivery milestones and implementation status
- `Branding.md` & `LandingMockup.md` – visual direction
- `README.md` – getting started guide

---

## 1. Quick Start: Understanding VENDRA

### What is VENDRA?

VENDRA is a Next.js 16 web application that simulates realistic sales calls for P2C (Person-to-Consumer) training in the Peruvian/LatAm market. Core flow:

1. **Salesperson** configures a scenario (product, target profile, simulation parameters)
2. **System** generates a realistic client persona using OpenAI
3. **Salesperson** speaks via microphone (audio → STT via OpenAI Whisper)
4. **AI Client** responds with text (simulated by OpenAI chat models)
5. **System** analyzes the conversation and provides a score (0–100) + actionable feedback

### Key Constraints

- **TypeScript + Next.js only** – No Python or other backend languages
- **OpenAI exclusively** – Only AI provider for MVP
- **Authentication required** – Google OAuth via Better Auth, all sessions tied to users
- **Peruvian/LatAm context** – Personas and scenarios must feel authentic to the region
- **Tailwind + shadcn/ui** – All UI follows established branding in `Branding.md`

---

## 2. Repository Structure

```
vendra/
├── src/
│   ├── app/                      # Next.js App Router pages and API routes
│   │   ├── api/                  # API route handlers
│   │   │   ├── auth/             # Better Auth endpoints
│   │   │   ├── session/          # Session management (create, speak, end, analyze)
│   │   │   └── stt/              # Standalone STT endpoint (debug)
│   │   ├── configuracion/        # Scenario configuration page
│   │   ├── simulacion/[sessionId]/ # Live simulation UI
│   │   ├── resultado/[sessionId]/  # Analysis/results view
│   │   ├── login/                # Google OAuth sign-in page
│   │   └── page.tsx              # Landing/home page
│   ├── components/               # React components
│   │   ├── ui/                   # shadcn/ui primitives (button, card, form, etc.)
│   │   ├── client-card.tsx       # Displays generated persona profile
│   │   ├── chat-messages.tsx     # Conversation history display
│   │   ├── audio-recorder-button.tsx # Voice input control
│   │   ├── simulation-view.tsx   # Main simulation interface
│   │   └── analysis-view.tsx     # Post-call analysis UI
│   ├── lib/                      # Core business logic
│   │   ├── persona-engine.ts     # Generates client persona from scenario
│   │   ├── conversation-orchestrator.ts # Manages turn-by-turn conversation
│   │   ├── analysis-engine.ts    # Post-call analysis and scoring
│   │   ├── audio-gateway.ts      # STT integration (Whisper)
│   │   ├── openai.ts             # OpenAI client wrapper with mock support
│   │   ├── auth-client.ts        # Better Auth client utilities
│   │   └── schemas/              # Zod validation schemas
│   ├── db/                       # Database layer
│   │   ├── schema/
│   │   │   ├── simulation.ts     # Session, persona, turns, analysis tables
│   │   │   ├── auth.ts           # Better Auth tables (user, session, etc.)
│   │   │   └── schema.ts         # Shared schema utilities
│   │   └── index.ts              # Drizzle client instance
│   ├── hooks/                    # Custom React hooks
│   └── styles/                   # Global CSS and Tailwind config
├── tests/                        # Unit and integration tests
│   ├── components/               # Component tests
│   └── flows/                    # E2E flow tests
├── public/                       # Static assets
├── .github/                      # GitHub workflows and config
├── biome.jsonc                   # Biome formatter/linter config
├── lefthook.yml                  # Git hooks (pre-commit, pre-push)
├── tsconfig.json                 # TypeScript configuration (strict mode)
├── drizzle.config.ts             # Drizzle ORM configuration
└── package.json                  # Dependencies and scripts
```

### Key Directories to Know

- **`src/lib/`** – All domain logic lives here. Start here when adding features.
- **`src/db/schema/`** – Database schema definitions. Changes here require migrations.
- **`src/components/ui/`** – shadcn/ui components. DO NOT lint/format these (excluded in biome.jsonc).
- **`tests/`** – Tests using Bun test + Happy DOM + Testing Library.

---

## 3. Development Setup

### Prerequisites

- **Bun** (preferred) or compatible Node.js runtime
- **PostgreSQL** database (local or hosted, e.g., Neon/Supabase)
- **Google OAuth credentials** (required for authentication)
- **OpenAI API key**

### Environment Configuration

Copy `.env.example` to `.env.local` and configure:

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_PROJECT_NAME` | Yes | Display name (default: "vendra") |
| `DRIZZLE_DATABASE_URL` | Yes | Postgres connection string |
| `GOOGLE_CLIENT_ID` | Yes | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | Yes | Google OAuth client secret |
| `BETTER_AUTH_URL` | Optional | Base URL for auth (defaults to `NEXT_PUBLIC_APP_URL`) |
| `BETTER_AUTH_SECRET` | Yes | Secret for Better Auth sessions |
| `OPENAI_API_KEY` | Yes | OpenAI API key (starts with `sk-`) |
| `NEXT_PUBLIC_APP_URL` | Optional | Base URL (defaults to Vercel URL or localhost) |

### Install and Run

```bash
# Install dependencies
bun install

# Push database schema (creates tables)
bun run db:push

# Start dev server
bun dev
```

Visit [http://localhost:3000](http://localhost:3000) to see the app.

### Common Scripts

```bash
bun dev              # Start Next.js dev server
bun run build        # Production build
bun start            # Run production server
bun test             # Run unit tests (Happy DOM)
bun run format       # Format with Biome
bun run lint         # Lint with Biome
bunx tsc --noEmit    # Type-check TypeScript (strict mode)
bun run db:push      # Push schema changes to database
bun run db:studio    # Open Drizzle Studio (GUI for DB)
bun run check:deps   # Check for unused dependencies (knip)
```

### Pre-commit Hooks (Lefthook)

The repository uses **Lefthook** for automated checks:

- **pre-commit**: Runs Biome lint/format on staged files + type-check
- **pre-push**: Runs full build + tests
- **commit-msg**: Validates commit message format

These hooks run automatically. If they fail, fix the issues before committing/pushing.

---

## 4. Code Style & Conventions

### TypeScript

- **Strict mode enabled** – `tsconfig.json` has all strict flags on
- **No `any` types** – Use proper types or `unknown` with type guards
- **Zod for runtime validation** – All external inputs (API, DB) validated with Zod schemas
- **Prefer type inference** – Explicit types only when necessary for clarity

### Naming Conventions

| Element | Convention | Example |
|---------|-----------|---------|
| Components & Types | PascalCase | `ClientCard`, `PersonaProfile` |
| Functions & Variables | camelCase | `generatePersona`, `clientResponse` |
| Files | kebab-case | `client-card.tsx`, `persona-engine.ts` |
| Constants | UPPER_SNAKE_CASE | `MAX_DURATION_MINUTES` |
| Database tables | snake_case | `simulation_session`, `conversation_turn` |

### File Organization

- **One component per file** (except tightly coupled components)
- **Colocate helpers** – Keep helper functions near where they're used
- **Export from index** – Use barrel exports (`index.ts`) for lib modules
- **Tests alongside code** – Component tests in `tests/components/`, logic tests in `tests/`

### React Patterns

- **Functional components only** – No class components
- **Server components by default** – Use `'use client'` only when needed (interactivity, hooks)
- **Hooks for state** – Prefer built-in hooks (useState, useEffect, etc.) over external state
- **Avoid prop drilling** – Use React Context or composition patterns for deep props

### Styling

- **Tailwind utility-first** – Use Tailwind classes directly in JSX
- **shadcn/ui components** – Use shadcn/ui for all UI primitives (don't reinvent the wheel)
- **Follow branding** – Colors and typography defined in `Branding.md`:
  - Primary blue: `#1C4E89`
  - Green: `#2DAA6E`
  - Yellow: `#F2C044`
  - Light gray: `#F5F7FA`
  - Fonts: Inter + Source Sans Pro
- **No inline styles** – Use Tailwind or CSS modules (if absolutely necessary)
- **Responsive by default** – Use Tailwind responsive prefixes (`sm:`, `md:`, `lg:`)

### Code Formatting

- **Biome** handles all formatting (not Prettier/ESLint)
- **Tabs for indentation** (set in biome.jsonc)
- **Double quotes** for strings (except where single quotes avoid escaping)
- **100-character line limit** (soft guideline, not enforced)
- **Organized imports** – Biome auto-sorts and removes unused imports

Run `bun run format` before committing to ensure consistent formatting.

---

## 5. Domain Logic: Core Engines

VENDRA's business logic is encapsulated in four main "engines" in `src/lib/`:

### 5.1 PersonaEngine (`persona-engine.ts`)

**Purpose:** Generates a realistic client persona based on scenario configuration.

**Input:** `ScenarioConfig` (product, target profile, simulation preferences)
**Output:** `PersonaProfile` (name, age, occupation, motivations, pains, personality traits, etc.)

**Key Responsibilities:**
- Calls OpenAI with structured prompts to generate JSON persona
- Validates output with Zod schema (`personaProfileSchema`)
- Ensures persona feels authentic to Peruvian/LatAm context
- Includes "micro-contradictions" and human imperfections for realism

**Example Usage:**
```typescript
import { generatePersona } from '@/lib/persona-engine';

const { persona, usedMock } = await generatePersona(scenarioConfig);
// persona: { name: "María", age: 32, occupation: "Contadora", ... }
```

**Important Notes:**
- Persona is generated **once per session** and stored in `persona_snapshot` table
- Mock mode available (returns hardcoded persona when OpenAI unavailable)
- Temperature = 0.9 for variability

### 5.2 ConversationOrchestrator (`conversation-orchestrator.ts`)

**Purpose:** Manages turn-by-turn conversation between salesperson and AI client.

**Input:** `{ sellerText: string, sessionId: string }`
**Output:** `{ clientResponse: ClientResponse, sellerTurnId: string, clientTurnId: string }`

**Key Responsibilities:**
- Loads persona + scenario + conversation history from DB
- Builds system prompt with persona details and simulation parameters
- Calls OpenAI to generate client response (text + metadata)
- Inserts both seller and client turns into `conversation_turn` table
- Tracks metadata: interest level (1-10), interruptions, wants to end call

**Example Usage:**
```typescript
import { orchestrateConversation } from '@/lib/conversation-orchestrator';

const result = await orchestrateConversation({
  sessionId: 'uuid-here',
  sellerText: 'Hola, ¿cómo está?',
});
// result.clientResponse.clientText: "Hola, bien gracias. ¿En qué puedo ayudarte?"
// result.clientResponse.interest: 5
// result.clientResponse.wantsToEnd: false
```

**Important Notes:**
- Client intensity (`tranquilo` | `neutro` | `dificil`) affects AI behavior
- Realism level (`natural` | `humano` | `exigente`) controls imperfections
- Client can autonomously decide to end call if frustrated (if `allowHangups: true`)
- Mock mode available for testing without OpenAI

### 5.3 AnalysisEngine (`analysis-engine.ts`)

**Purpose:** Analyzes completed conversation and generates actionable feedback.

**Input:** Full conversation history + persona + scenario config
**Output:** `{ score: number (0-100), successes: string[], improvements: ImprovementItem[], keyMoments: KeyMoment[] }`

**Key Responsibilities:**
- Evaluates performance across 8 dimensions (rapport, discovery, value, objections, etc.)
- Generates overall score (0–100)
- Lists successes (what went well)
- Lists improvements (title + concrete action)
- Identifies 3–5 key moments (quote + insight + recommendation)

**Example Usage:**
```typescript
import { analyzeConversation } from '@/lib/analysis-engine';

const analysis = await analyzeConversation({
  sessionId: 'uuid-here',
});
// analysis.score: 72
// analysis.successes: ["Buen rapport inicial", "Manejo de objeciones efectivo"]
// analysis.improvements: [{ title: "Descubrimiento", action: "Hacer más preguntas abiertas" }]
// analysis.keyMoments: [{ turnId: "...", quote: "...", insight: "...", recommendation: "..." }]
```

**Important Notes:**
- Only runs **after** call ends
- Must produce **at least 1 improvement** and **1 key moment** (validated by schema)
- Stores result in `analysis` table (one per session, unique constraint)
- Mock mode available

### 5.4 AudioGateway (`audio-gateway.ts`)

**Purpose:** Converts voice audio to text using OpenAI Whisper.

**Input:** Audio file (File or Blob)
**Output:** Transcribed text (Spanish)

**Key Responsibilities:**
- Accepts audio from browser MediaRecorder
- Sends to OpenAI Whisper API
- Returns transcribed text
- No business logic – pure STT

**Example Usage:**
```typescript
import { transcribeAudio } from '@/lib/audio-gateway';

const text = await transcribeAudio(audioFile);
// text: "Hola, me interesa conocer más sobre el producto"
```

**Important Notes:**
- Expects Spanish audio (language hint in API call)
- Mock mode available (returns dummy text)
- Typically called from `/api/stt` or `/api/session/[id]/speak`

---

## 6. Database Schema (Drizzle + Postgres)

VENDRA uses **Drizzle ORM** with PostgreSQL. Schema definitions in `src/db/schema/`.

### Core Tables

#### `simulation_session`
Stores each simulation session.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `userId` | TEXT | Foreign key to `user.id` (Better Auth) |
| `scenarioConfig` | JSONB | Full scenario configuration |
| `status` | ENUM | `pending_persona` | `active` | `completed` |
| `createdAt` | TIMESTAMP | Session creation time |
| `endedAt` | TIMESTAMP | Session end time (null if active) |

#### `persona_snapshot`
Stores generated persona for each session (one-to-one with session).

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `sessionId` | UUID | Foreign key to `simulation_session.id` |
| `persona` | JSONB | Full `PersonaProfile` object |
| `createdAt` | TIMESTAMP | Persona generation time |

#### `conversation_turn`
Stores each message in the conversation (seller and client).

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `sessionId` | UUID | Foreign key to `simulation_session.id` |
| `role` | ENUM | `seller` | `client` |
| `content` | TEXT | Message text |
| `turnIndex` | INTEGER | Sequential turn number (0, 1, 2...) |
| `meta` | JSONB | Metadata (interest, interruptions, wantsToEnd) |
| `createdAt` | TIMESTAMP | Turn creation time |

#### `analysis`
Stores post-call analysis (one-to-one with session).

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `sessionId` | UUID | Foreign key to `simulation_session.id` (UNIQUE) |
| `score` | INTEGER | Overall score (0–100) |
| `successes` | JSONB | Array of success strings |
| `improvements` | JSONB | Array of `{ title, action }` |
| `keyMoments` | JSONB | Array of `{ turnId, quote, insight, recommendation }` |
| `createdAt` | TIMESTAMP | Analysis creation time |

#### `user` (Better Auth)
Stores authenticated users.

| Column | Type | Description |
|--------|------|-------------|
| `id` | TEXT | Primary key (Better Auth user ID) |
| `email` | TEXT | User email (from Google) |
| `name` | TEXT | User display name |
| `image` | TEXT | Profile image URL |
| `createdAt` | TIMESTAMP | User creation time |

### Schema Migrations

- Use **`bun run db:push`** to push schema changes (development)
- For production, use **`drizzle-kit generate`** + **`drizzle-kit migrate`**
- Never manually edit database tables – always change `src/db/schema/*.ts` files

### Querying Patterns

```typescript
// ✅ Good: Use Drizzle query builder
const session = await db.query.simulationSessions.findFirst({
  where: eq(simulationSessions.id, sessionId),
  with: {
    personaSnapshot: true,
    turns: {
      orderBy: [asc(conversationTurns.turnIndex)],
    },
  },
});

// ❌ Bad: Raw SQL (avoid unless absolutely necessary)
const session = await db.execute(sql`SELECT * FROM simulation_session WHERE id = ${sessionId}`);
```

---

## 7. API Routes

All API routes in `src/app/api/`. Use **Next.js Route Handlers** (not Pages Router API routes).

### `/api/session` (POST)
Creates a new simulation session.

**Request Body:**
```typescript
{
  scenarioConfig: ScenarioConfig
}
```

**Response:**
```typescript
{
  sessionId: string,
  persona: PersonaProfile,
  usedMock: boolean
}
```

**Auth:** Required (checks Better Auth session)

### `/api/session/[id]/speak` (POST)
Handles voice input (STT + conversation orchestration).

**Request Body:**
```typescript
{
  audio: File // Audio blob from browser
}
```

**Response:**
```typescript
{
  clientResponse: ClientResponse,
  sellerTurnId: string,
  clientTurnId: string,
  usedMock: boolean
}
```

**Auth:** Required + session ownership check

### `/api/session/[id]/end` (POST)
Marks session as completed (seller-initiated).

**Request Body:** None

**Response:**
```typescript
{
  success: boolean
}
```

**Auth:** Required + session ownership check

### `/api/session/[id]/analyze` (POST)
Generates post-call analysis.

**Request Body:** None

**Response:**
```typescript
{
  analysis: Analysis,
  usedMock: boolean
}
```

**Auth:** Required + session ownership check

### `/api/stt` (POST)
Standalone STT endpoint (debugging/testing).

**Request Body:**
```typescript
{
  audio: File
}
```

**Response:**
```typescript
{
  text: string,
  usedMock: boolean
}
```

**Auth:** Required

### `/api/auth/*` (Better Auth)
Handled by Better Auth library. Routes:
- `/api/auth/signin/google` – Initiates Google OAuth
- `/api/auth/callback/google` – OAuth callback
- `/api/auth/session` – Get current session
- `/api/auth/signout` – Sign out

**Implementation:** See `src/app/api/auth/[...all]/route.ts`

---

## 8. Testing

VENDRA uses **Bun test** + **Happy DOM** + **Testing Library** for testing.

### Test Structure

```
tests/
├── components/          # Component tests (React Testing Library)
│   └── button.test.tsx
├── flows/               # E2E flow tests (simulated user journeys)
│   └── user-flows.test.tsx
├── analysis-engine.test.ts      # Unit tests for analysis schemas
├── conversation-orchestrator.test.ts  # Unit tests for conversation logic
└── debounce.test.ts    # Utility function tests
```

### Running Tests

```bash
bun test                 # Run all tests
bun test <file>          # Run specific test file
bun test --watch         # Watch mode
```

### Writing Tests

**Example: Schema validation test**
```typescript
import { describe, expect, test } from 'bun:test';
import { personaProfileSchema } from '@/lib/schemas/session';

describe('personaProfileSchema', () => {
  test('validates a valid persona', () => {
    const validPersona = {
      name: 'María',
      age: 32,
      location: 'Lima, Perú',
      // ... other fields
    };

    const result = personaProfileSchema.safeParse(validPersona);
    expect(result.success).toBe(true);
  });

  test('rejects persona with invalid age', () => {
    const invalidPersona = {
      name: 'María',
      age: -5, // Invalid
      // ...
    };

    const result = personaProfileSchema.safeParse(invalidPersona);
    expect(result.success).toBe(false);
  });
});
```

**Example: Component test**
```typescript
import { render, screen } from '@testing-library/react';
import { describe, expect, test } from 'bun:test';
import { Button } from '@/components/ui/button';

describe('Button', () => {
  test('renders with text', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText('Click me')).toBeDefined();
  });
});
```

### Test Coverage Expectations

- **Core engines** (persona, conversation, analysis) – 80%+ coverage
- **API routes** – Integration tests for happy path + error cases
- **Components** – Smoke tests (renders without crashing) + key interactions
- **Utilities** – 100% coverage for pure functions

---

## 9. Common Tasks & Workflows

### Task: Add a New Field to Persona

1. Update `PersonaProfile` type in `src/db/schema/simulation.ts`
2. Update `personaProfileSchema` in `src/lib/schemas/session.ts`
3. Update persona generation prompt in `src/lib/persona-engine.ts`
4. Update mock persona builder (if exists)
5. Run `bun run db:push` to sync schema
6. Update `ClientCard` component to display new field (if needed)
7. Add tests for new field validation
8. Update `Requirements.md` or `Architecture.md` if semantically significant

### Task: Add a New Analysis Dimension

1. Update analysis prompt in `src/lib/analysis-engine.ts` to mention new dimension
2. Update `ImprovementItem` or `KeyMoment` schema if needed (in `src/db/schema/simulation.ts`)
3. Update `AnalysisView` component to display new dimension
4. Add tests for new schema fields
5. Update `Requirements.md` to document new dimension

### Task: Debug OpenAI Integration

1. Check environment variables (`OPENAI_API_KEY` set correctly?)
2. Look for `usedMock: true` in API responses (indicates OpenAI wasn't called)
3. Check `src/lib/openai.ts` for error handling
4. Use `/api/stt` endpoint to test STT in isolation
5. Add console logs in engine files (`persona-engine.ts`, etc.) if needed
6. Check OpenAI API dashboard for quota/billing issues

### Task: Fix a Type Error

1. Run `bunx tsc --noEmit` to see all type errors
2. Read error message carefully (TypeScript errors are usually precise)
3. Common fixes:
   - Add type annotation to function parameter
   - Use type guard (e.g., `if (foo !== null)`) to narrow type
   - Add `!` non-null assertion (only if you're 100% sure)
   - Update Zod schema if runtime type changed
4. Re-run `bunx tsc --noEmit` to verify fix
5. Run `bun test` to ensure no tests broke

### Task: Update Branding Colors

1. Edit `Branding.md` to document new colors
2. Update Tailwind config (`tailwind.config.ts` or `src/styles/globals.css`)
3. Update components using old colors (search for hex codes or Tailwind classes)
4. Test in browser (check light/dark mode if applicable)
5. Run `bun run format` to ensure consistent formatting

### Task: Add Authentication Check to Route

1. Import `auth` from `src/lib/auth` (Better Auth server-side utility)
2. Call `await auth()` at start of route handler
3. Check `session?.user?.id` exists, otherwise return 401
4. For session ownership checks, query `simulationSessions` and verify `userId` matches
5. Example:
   ```typescript
   import { auth } from '@/lib/auth';

   export async function POST(req: Request) {
     const session = await auth();
     if (!session?.user?.id) {
       return new Response('Unauthorized', { status: 401 });
     }
     // ... rest of handler
   }
   ```

---

## 10. What NOT to Do

### ❌ Don't Add Python Dependencies

VENDRA is **TypeScript-only** for the MVP. Do not add:
- Python scripts
- Flask/FastAPI servers
- Python-based AI tools

If a feature seems to require Python, explore TypeScript alternatives (e.g., OpenAI SDK for Node.js).

### ❌ Don't Use Multiple AI Providers

Stick to **OpenAI exclusively** for the MVP. Do not add:
- Anthropic Claude
- Google Gemini
- Local LLMs (Ollama, llama.cpp)
- Hugging Face models

This may change post-MVP, but for now, OpenAI only.

### ❌ Don't Bypass Authentication

All routes (except `/login` and `/api/auth/*`) require authentication. Do not:
- Skip Better Auth checks
- Create public-facing simulation routes
- Store sessions without `userId`

### ❌ Don't Break Strict TypeScript

The project has strict TypeScript enabled. Do not:
- Use `any` types (use `unknown` + type guards)
- Use `@ts-ignore` or `@ts-expect-error` (fix the actual issue)
- Disable strict mode in `tsconfig.json`

### ❌ Don't Manually Edit Database

Use Drizzle migrations for schema changes. Do not:
- Run raw SQL DDL (CREATE TABLE, ALTER TABLE) manually
- Edit production database directly
- Skip `db:push` or migrations

### ❌ Don't Add CSS-in-JS Libraries

Stick to **Tailwind CSS** + **shadcn/ui**. Do not add:
- styled-components
- Emotion
- CSS Modules (use Tailwind instead)

### ❌ Don't Over-Engineer

Keep solutions **simple and focused**. Do not:
- Add abstractions for single-use code
- Create elaborate state management (use React built-ins)
- Add feature flags or backwards-compat for non-existent legacy code
- Add error handling for impossible scenarios

### ❌ Don't Ignore Biome/Lefthook

Formatting and linting are enforced. Do not:
- Commit without running `bun run format`
- Skip pre-commit hooks (they catch issues early)
- Disable Biome rules without justification

---

## 11. Git Workflow & Commit Conventions

### Branching

- **Development branch pattern:** `claude/add-<feature-name>-<session-id>`
- Always develop on the designated branch (provided in task context)
- Never push directly to `main` or `master`

### Commit Message Format

Use **conventional commits** format:

```
<type>: <description>

[optional body]

[optional footer]
```

**Types:**
- `feat:` – New feature
- `fix:` – Bug fix
- `refactor:` – Code refactoring (no behavior change)
- `chore:` – Tooling, dependencies, config
- `docs:` – Documentation updates
- `test:` – Adding or updating tests
- `style:` – Formatting changes (not CSS)

**Examples:**
```
feat: add voice recording to simulation page

fix: correct persona generation prompt for age range

refactor: simplify conversation orchestrator query logic

chore: update OpenAI SDK to latest version

docs: update CLAUDE.md with testing section

test: add unit tests for analysis engine schemas
```

### Before Committing

Run these commands locally (Lefthook does this automatically):

```bash
bun run format       # Format code
bunx tsc --noEmit    # Type-check
bun test             # Run tests
bun run build        # Ensure build succeeds
```

If any fail, fix before committing.

### Pushing to Remote

```bash
# Push to designated branch
git push -u origin claude/add-feature-name-session-id

# If network fails, retry with exponential backoff (2s, 4s, 8s, 16s)
```

**IMPORTANT:** Branch name must start with `claude/` and end with session ID (required by webhook).

### Creating Pull Requests

When ready for review:

1. Ensure all commits are pushed
2. Run full test suite locally (`bun test`)
3. Verify build succeeds (`bun run build`)
4. Use `gh pr create` (if GitHub CLI available) or manual PR creation
5. Fill in PR template:
   ```markdown
   ## Summary
   - [Brief description of changes]

   ## Test Plan
   - [ ] Ran `bun test` locally (all passed)
   - [ ] Ran `bun run build` (successful)
   - [ ] Tested feature in browser
   - [ ] Verified authentication still works

   ## Related Issues
   Closes #<issue-number> (if applicable)
   ```

---

## 12. Debugging Tips

### OpenAI API Issues

**Symptom:** `usedMock: true` in responses
**Cause:** OpenAI API key missing or invalid
**Fix:** Check `.env.local` has `OPENAI_API_KEY=sk-...`

**Symptom:** "Rate limit exceeded" errors
**Cause:** Too many API calls
**Fix:** Check OpenAI dashboard for quota, consider adding rate limiting

### Authentication Issues

**Symptom:** Redirected to `/login` on every page
**Cause:** Better Auth session not persisting
**Fix:**
- Check `BETTER_AUTH_SECRET` is set
- Verify Google OAuth credentials are correct
- Clear browser cookies and retry

**Symptom:** 401 errors on API routes
**Cause:** Session not found or expired
**Fix:**
- Check `auth()` is called correctly in route handler
- Verify session cookie is being sent (check browser DevTools)

### Database Issues

**Symptom:** "relation does not exist" errors
**Cause:** Tables not created
**Fix:** Run `bun run db:push`

**Symptom:** Type errors on Drizzle queries
**Cause:** Schema out of sync
**Fix:** Restart dev server (Next.js caches types)

### Build/Type Errors

**Symptom:** Build succeeds but types fail
**Cause:** TypeScript strict mode catching issues
**Fix:** Run `bunx tsc --noEmit` to see all errors, fix one by one

**Symptom:** "Module not found" errors
**Cause:** Import path incorrect
**Fix:** Use `@/` alias for absolute imports (e.g., `import { db } from '@/db'`)

---

## 13. Key Files Reference

| File | Purpose | When to Edit |
|------|---------|--------------|
| `AGENTS.md` | Coding agent instructions | When workflows or domain rules change |
| `CLAUDE.md` | This file – AI assistant guide | When adding conventions or common tasks |
| `Requirements.md` | Product requirements | When features or scope change |
| `Architecture.md` | System architecture | When adding major components or changing tech stack |
| `Plan.md` | Implementation plan + status | When completing tasks or adding new milestones |
| `Branding.md` | Visual design guide | When brand colors/fonts change |
| `package.json` | Dependencies + scripts | When adding packages or scripts |
| `tsconfig.json` | TypeScript config | Rarely (strict mode is locked) |
| `biome.jsonc` | Formatter/linter config | When adjusting code style rules |
| `lefthook.yml` | Git hooks | When changing pre-commit/pre-push checks |
| `drizzle.config.ts` | Drizzle ORM config | When changing database connection |
| `.env.example` | Environment template | When adding new env variables |

---

## 14. Additional Resources

### Documentation to Read First

When working on a new feature, read these in order:

1. **`Requirements.md`** – Understand what the feature should do
2. **`Architecture.md`** – Understand how it fits into the system
3. **`Plan.md`** – Check if it's already planned or in progress
4. **This file (CLAUDE.md)** – Understand conventions and workflows

### External Documentation

- [Next.js 14+ Docs](https://nextjs.org/docs) – App Router, Server Components, Route Handlers
- [Drizzle ORM Docs](https://orm.drizzle.team/docs/overview) – Queries, migrations, relations
- [Better Auth Docs](https://better-auth.com/docs) – Authentication, session management
- [OpenAI API Docs](https://platform.openai.com/docs) – Chat completions, Whisper, error handling
- [shadcn/ui Docs](https://ui.shadcn.com) – Component usage and customization
- [Tailwind CSS Docs](https://tailwindcss.com/docs) – Utility classes, responsive design
- [Zod Docs](https://zod.dev) – Schema validation, type inference

### Getting Help

If stuck on a task:

1. **Check existing code** – Look for similar patterns in the codebase
2. **Read error messages** – TypeScript/Biome errors are usually precise
3. **Search docs** – Use the external docs linked above
4. **Ask the user** – If requirements are unclear, ask clarifying questions
5. **Simplify** – Break down complex tasks into smaller steps

---

## 15. Success Checklist

Before marking a task as complete, verify:

- [ ] Code compiles without errors (`bunx tsc --noEmit`)
- [ ] Code is formatted (`bun run format`)
- [ ] Code is linted (`bun run lint`)
- [ ] Tests pass (`bun test`)
- [ ] Build succeeds (`bun run build`)
- [ ] Feature works in browser (manual testing)
- [ ] Authentication still works (if touching auth-related code)
- [ ] Database schema is synced (`bun run db:push`)
- [ ] Relevant docs updated (`AGENTS.md`, `Architecture.md`, etc.)
- [ ] Commit messages follow conventions
- [ ] Changes pushed to correct branch

---

## 16. Final Notes

VENDRA is a **production-ready MVP** in active development. Code quality, type safety, and user experience are paramount. When in doubt:

- **Prefer simplicity** over complexity
- **Validate with Zod** for all external inputs
- **Test your changes** before committing
- **Follow existing patterns** in the codebase
- **Ask questions** if requirements are unclear

By following this guide, you'll contribute high-quality code that aligns with VENDRA's architecture, conventions, and goals.

Happy coding! 🚀
