# Ticket Triage Dashboard

A lightweight PMO ticket triage tool built spec-first using BMAD Method, GitHub Speckit, and Claude Code.

**Stack:** Next.js 15 · TypeScript strict · Prisma + SQLite · Tailwind CSS · Vitest · GitHub Actions

---

## Prerequisites

- Node.js 20+
- pnpm (`npm i -g pnpm`)

---

## Local Setup

```bash
# 1. Install dependencies (also runs prisma generate via postinstall)
pnpm install

# 2. Create the database and run migrations
pnpm db:migrate

# 3. Seed with 12 sample tickets
pnpm db:seed

# 4. Start the dev server
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) — the dashboard is at `/tickets`.

---

## Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start development server |
| `pnpm build` | Production build |
| `pnpm lint` | ESLint strict check |
| `pnpm typecheck` | TypeScript strict check (`tsc --noEmit`) |
| `pnpm test` | Vitest smoke tests |
| `pnpm db:migrate` | Run Prisma migrations |
| `pnpm db:seed` | Insert 12 seed tickets |
| `pnpm db:studio` | Open Prisma Studio |

---

## Regenerating the Scaffold with Claude Code

To regenerate all code from the spec (no manual edits):

```bash
claude "Read docs/spec/prd.md, docs/spec/adr-001-framework.md, and \
docs/spec/adr-002-data-layer.md. Execute all tasks in speckit.yaml \
in order. Do not add any field, file, or dependency not referenced \
in the PRD or ADRs."
```

---

## Project Structure

```
ticket-triage/
├── docs/spec/          # PRD + 8 ADRs — the spec layer
├── src/
│   ├── app/
│   │   ├── api/tickets/         # GET /api/tickets
│   │   │   └── [id]/            # PATCH /api/tickets/:id
│   │   └── tickets/             # Dashboard UI
│   └── lib/
│       ├── db.ts                # Prisma client singleton
│       └── validators/ticket.ts # Zod schemas
├── prisma/
│   ├── schema.prisma
│   └── seed.ts
├── tests/
│   └── tickets.smoke.test.ts
├── speckit.yaml
└── .github/workflows/ci.yml
```

---

## Spec Documents

All architecture decisions are documented in `docs/spec/`:

- `prd.md` — Product Requirements Document
- `adr-001-framework.md` — Next.js 15 App Router
- `adr-002-data-layer.md` — Prisma + SQLite
- `adr-003-validation.md` — Zod
- `adr-004-css.md` — Tailwind CSS
- `adr-005-testing.md` — Vitest
- `adr-006-state-management.md` — No Redux/Zustand
- `adr-007-api-style.md` — REST over tRPC
- `adr-008-package-manager.md` — pnpm
