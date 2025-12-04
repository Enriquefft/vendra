# VENDRA

VENDRA is a voice-based P2C sales training simulator that lets reps practice calls with an AI-driven persona, capture their speech, and receive actionable feedback immediately after each session. The product is built with Next.js (App Router) and TypeScript, uses Tailwind + shadcn/ui for the interface, and stores data in Postgres via Drizzle ORM.

## Documentation
- [Requirements](Requirements.md) – product goals and functional scope
- [Architecture](Architecture.md) – system design and component responsibilities
- [Plan](Plan.md) – delivery milestones and UX references
- [Branding](Branding.md) & [Landing mockup](LandingMockup.md) – visual direction
- [Bugs](Bugs.md) – known issues and fixes

## Tech Stack
- Next.js 16 (App Router) with TypeScript
- Tailwind CSS + shadcn/ui components
- Drizzle ORM with PostgreSQL
- Authentication via Better Auth (Google OAuth)
- Polar for billing, PostHog for analytics
- Biome for formatting/linting; Happy DOM + Testing Library for tests

## Getting Started
1. Install [Bun](https://bun.sh/) (preferred) or use a compatible Node.js runtime.
2. Install dependencies:
   ```bash
   bun install
   ```
3. Copy `.env.local` (provided with placeholders) and fill in your secrets. See the environment variable table below.
4. Run database migrations:
   ```bash
   bun run db:push
   ```
5. Start the development server:
   ```bash
   bun dev
   ```
   Visit <http://localhost:3000> to load the app.

## Environment Variables
VENDRA uses [`@t3-oss/env-nextjs`](https://github.com/t3-oss/t3-env) for runtime validation. Configure the following keys in `.env.local`:

| Variable | Required | Description |
| --- | --- | --- |
| `NEXT_PUBLIC_PROJECT_NAME` | Yes | Display name used across the UI and database schema. |
| `DRIZZLE_DATABASE_URL` | Yes | Postgres connection string for Drizzle ORM. |
| `GOOGLE_CLIENT_ID` | Yes | OAuth client ID for Better Auth (Google). |
| `GOOGLE_CLIENT_SECRET` | Yes | OAuth client secret for Better Auth (Google). |
| `NEXT_PUBLIC_POSTHOG_KEY` | Yes | PostHog public API key used by the client SDK. |
| `POLAR_ACCESS_TOKEN` | Yes | Polar API access token for billing. |
| `POLAR_MODE` | Yes | Polar environment (`sandbox` or `production`). |
| `NEXT_PUBLIC_APP_URL` | Optional | Explicit base URL for client-side links (defaults to Vercel/localhost). |
| `BETTER_AUTH_URL` | Optional | Base URL for Better Auth callbacks (defaults to `NEXT_PUBLIC_APP_URL`). |

A template `.env.local` with placeholders is included for convenience; keep real secrets out of version control.

## Available Scripts
- `bun dev` – start the Next.js dev server
- `bun run build` – create a production build
- `bun start` – run the production server
- `bun test` – execute unit tests (Happy DOM)
- `bun run format` – format with Biome
- `bun run lint` – run Next.js lint
- `bunx tsc --noEmit` – type-check the project
- `bun run db:push` – run Drizzle migrations
- `bun run db:studio` – open Drizzle Studio

## Contributing
Keep commits focused and descriptive. Before opening a PR, ensure formatting, type checks, and tests pass:

```bash
bun run format
bunx tsc --noEmit
bun test
```

## License
This project is available under the MIT License (see `LICENSE-MIT` for details). Additional private license terms may apply (see `LICENSE-PRIVATE`).
