# Ticket Triage Tool — PRD

## 1. Persona

**Name:** Maya — PMO Coordinator  
**Role:** Project Management Office staff at Bistec Global  
**Context:** Maya manages 3–5 active internal projects simultaneously. She receives tickets from multiple engineering teams via Slack, email, and GitHub Issues. Each morning she spends 20–30 minutes manually sorting through a shared spreadsheet to figure out what is blocked, what is urgent, and who owns what.  
**Pain Point:** There is no single view of open tickets ranked by priority. Tickets sit in a spreadsheet with no ownership enforcement and no badge summary. Maya often escalates the wrong issue first because severity is not visible at a glance.  
**Technical comfort:** Non-technical. Uses browser-based tools only.

---

## 2. Problem Statement

**What breaks today:** PMO staff have no lightweight, always-current view of open tickets grouped by priority. The shared spreadsheet is updated manually and goes stale within hours.  
**Who is affected:** Maya and 2 other PMO coordinators who run daily standups. Engineers are indirectly affected when the wrong tickets get escalated.  
**Why now:** The team is growing from 8 to 15 engineers in Q3 2026. The spreadsheet approach will not scale. A read/write dashboard is needed before headcount doubles.  
**Measurable gap:** PMO coordinators spend an estimated 25 minutes per day on ticket sorting that a filtered dashboard would reduce to under 5 minutes.

---

## 3. Goals & Non-Goals

### Goals
- G-1: PMO staff can view all open tickets in under 2 seconds on localhost
- G-2: Tickets are grouped by priority (P0 / P1 / P2) with count badges visible without scrolling
- G-3: Any PMO staff member can update a ticket's priority and owner in under 3 clicks
- G-4: An API layer allows future integration with GitHub Issues via webhook

### Non-Goals
- NG-1: This tool does not replace GitHub Issues or Jira — it reads from a seed file only in v1
- NG-2: No authentication in v1 — internal network access only
- NG-3: No real-time push updates — polling or manual refresh is acceptable in v1
- NG-4: No mobile-specific layout in v1

---

## 4. Functional Requirements

**FR-1 — List open tickets**  
*Given* a PMO coordinator opens the dashboard,  
*When* the page loads,  
*Then* all tickets from the seed data are displayed, each showing: ID, title, priority, owner, and status.

**FR-2 — Group by priority with count badges**  
*Given* tickets are loaded,  
*When* the PMO coordinator views the dashboard,  
*Then* tickets are visually grouped under P0, P1, and P2 headers, each header showing the count of tickets in that group.

**FR-3 — Tag ticket priority**  
*Given* a PMO coordinator clicks a priority badge on a ticket,  
*When* they select a new priority (P0 / P1 / P2),  
*Then* the ticket's priority updates immediately in the UI and persists via `PATCH /tickets/:id`.

**FR-4 — Assign ticket owner**  
*Given* a PMO coordinator clicks the owner field on a ticket,  
*When* they type a name and confirm,  
*Then* the ticket's owner field updates and persists via `PATCH /tickets/:id`.

**FR-5 — API surface**  
*Given* a client calls `GET /tickets`,  
*When* the request is valid,  
*Then* the response is a JSON array of all tickets with fields: `id`, `title`, `priority`, `owner`, `status`.  
*Given* a client calls `PATCH /tickets/:id` with a valid body,  
*When* the payload passes Zod validation,  
*Then* the updated ticket object is returned with HTTP 200.  
*When* the payload fails Zod validation,  
*Then* a structured error is returned with HTTP 422.

---

## 5. Non-Functional Requirements

| # | Requirement | Target | Measurement |
|---|-------------|--------|-------------|
| NFR-1 | Initial page render | < 1.5s on localhost | Measured with Chrome DevTools Network throttling off |
| NFR-2 | API response p95 | < 150ms with seed data (≤ 50 tickets) | Measured with `autocannon` or Vitest timing |
| NFR-3 | TypeScript strictness | Zero `any` types | `tsc --noEmit` passes with `strict: true` |
| NFR-4 | Commit hygiene | All commits follow Conventional Commits | Enforced via `commitlint` in CI |
| NFR-5 | CI pipeline duration | < 3 minutes end-to-end | GitHub Actions run time |
| NFR-6 | Accessibility | No critical axe violations | Checked with `@axe-core/react` in dev |

---

## 6. Architecture Decision Records

### ADR-001: Framework Choice — Next.js 15 App Router

**Date:** June 2026  
**Status:** Accepted

**Context:**  
We need a full-stack TypeScript framework that can serve both the dashboard UI and the REST API from a single repository. Options considered: Next.js 15, Remix 2, plain Express + React SPA.

**Decision:**  
Use **Next.js 15 App Router** with TypeScript strict mode.

**Reasoning:**  
Next.js provides co-located API routes (Route Handlers) and server components in the same project. The Bistec stack already uses Next.js on other internal tools, so onboarding friction is low. The App Router's server components reduce client-side JavaScript for the list view, helping hit the < 1.5s render target.

**Rejected alternative — Remix 2:**  
Remix has excellent data loading patterns but the team has no existing Remix projects. Switching would require a new deployment profile and more onboarding time.

**Rejected alternative — Express + React SPA:**  
Separating the API server and the frontend into two packages increases CI complexity and deployment surface without adding value at this scale.

**Consequences:**  
- Positive: Single `pnpm dev` starts everything; Claude Code can scaffold routes and pages in one pass.  
- Negative: App Router has a learning curve for junior developers unfamiliar with RSC. Mitigated by keeping data fetching in server components only.

---

### ADR-002: Data Layer — Prisma + SQLite

**Date:** June 2026  
**Status:** Accepted

**Context:**  
The dashboard needs persistent storage for ticket state (priority, owner). Options considered: Prisma + SQLite, Prisma + PostgreSQL, plain JSON file store.

**Decision:**  
Use **Prisma ORM with SQLite** for v1.

**Reasoning:**  
SQLite requires zero infrastructure setup — the database is a file in the repo. Prisma provides type-safe queries that align with the TypeScript strict requirement (NFR-3). The seed data volume (≤ 50 tickets) will never stress SQLite. This removes Docker and a database server from the local dev setup, keeping the CHALLENGE scope to one `pnpm install && pnpm dev`.

**Rejected alternative — Prisma + PostgreSQL:**  
PostgreSQL is the right choice at scale but requires a running database server. Adding Docker Compose to this challenge adds setup friction and widens the scope beyond what the CI pipeline needs to verify.

**Rejected alternative — Plain JSON file store:**  
A JSON file store is simple but not type-safe. Concurrent PATCH requests would require locking logic. Using Prisma provides the query type safety needed for NFR-3 for free.

**Consequences:**  
- Positive: `prisma migrate dev` sets up the database in one command; seed script is trivial.  
- Negative: SQLite does not support concurrent writes well. Acceptable for a single-user PMO tool in v1. Migration to PostgreSQL in v2 requires only a connection string change when using Prisma.

---

### ADR-003: Validation Library — Zod

**Date:** June 2026  
**Status:** Accepted

**Context:**  
The PATCH `/tickets/:id` endpoint must validate incoming request bodies and return structured errors on failure (FR-5). Options considered: Zod, Yup, Joi.

**Decision:**  
Use **Zod** for runtime input validation.

**Reasoning:**  
Zod is TypeScript-first — schemas double as type definitions, so the validated output is automatically typed without a separate `z.infer<>` cast in most cases. This directly supports NFR-3 (zero `any` types). Zod is also the standard in the Next.js ecosystem and pairs naturally with the App Router's Route Handlers.

**Rejected alternative — Yup:**  
Yup predates TypeScript and its type inference is bolted on. Schema definitions and TypeScript types must be kept in sync manually, which is error-prone under strict mode.

**Rejected alternative — Joi:**  
Joi is battle-tested but JavaScript-native. It has no first-class TypeScript inference and carries a larger bundle size. Not appropriate for a strict TypeScript codebase.

**Consequences:**  
- Positive: Single source of truth — one Zod schema generates both the runtime validator and the TypeScript type.  
- Negative: Zod v3 error messages are verbose by default. Mitigated by mapping `e.errors` to a clean response shape in the catch block.

---

### ADR-004: CSS Approach — Tailwind CSS

**Date:** June 2026  
**Status:** Accepted

**Context:**  
The dashboard needs a consistent, maintainable styling approach. Options considered: Tailwind CSS, CSS Modules, styled-components.

**Decision:**  
Use **Tailwind CSS** utility classes.

**Reasoning:**  
Tailwind co-locates styles with markup, which reduces context-switching when Claude Code generates components. There are no separate `.module.css` files to generate and keep in sync. Tailwind's constraint-based scale (spacing, colour, typography) produces consistent UI without a design token system. The Bistec internal tooling already uses Tailwind, so no new conventions to learn.

**Rejected alternative — CSS Modules:**  
CSS Modules are scoped and zero-runtime but require a parallel file per component. Claude Code would need to generate and maintain two files per component, doubling the surface area for errors.

**Rejected alternative — styled-components:**  
styled-components is a runtime CSS-in-JS library. It adds bundle weight and conflicts with Next.js server components, which cannot use React context (which styled-components relies on for theming).

**Consequences:**  
- Positive: Styling is self-contained in JSX — easier for Claude Code to generate correct output in one pass.  
- Negative: Long `className` strings can reduce readability. Mitigated by extracting repeated patterns into small components.

---

### ADR-005: Testing Framework — Vitest

**Date:** June 2026  
**Status:** Accepted

**Context:**  
The CI pipeline requires at least one passing smoke test (NFR check). Options considered: Vitest, Jest.

**Decision:**  
Use **Vitest** as the test runner.

**Reasoning:**  
Vitest uses the same config as the project's build tooling and has native ESM support. It runs faster than Jest on a cold start due to Vite's transformation pipeline. The API is Jest-compatible (`describe`, `it`, `expect`, `vi.mock`) so there is no learning curve switching between them.

**Rejected alternative — Jest:**  
Jest requires separate Babel or ts-jest configuration to handle TypeScript and ESM. Configuring Jest correctly with Next.js App Router adds friction and is a common source of CI failures for junior developers. Vitest works with zero additional config in a Next.js 15 project.

**Consequences:**  
- Positive: Zero extra config; `vitest` can be added to `pnpm test` immediately.  
- Negative: Some Jest-specific utilities (e.g. `jest-environment-jsdom` config options) differ slightly. Not a concern for smoke tests that mock the DB layer.

---

### ADR-006: State Management — No Client Store (Reject Redux / Zustand)

**Date:** June 2026  
**Status:** Accepted

**Context:**  
The dashboard updates ticket priority and owner via PATCH (FR-3, FR-4). A client-side state management library could centralise this state. Options considered: Redux Toolkit, Zustand, React built-in state only.

**Decision:**  
Use **React `useState` and optimistic updates only** — no global client store.

**Reasoning:**  
The dashboard has two interactions: update priority, update owner. Both are isolated to a single `TicketRow` component. There is no shared derived state, no cross-component synchronisation, and no undo/redo requirement. Adding a global store for two local state values violates YAGNI. Server components handle the initial data load; client state handles only the optimistic update lifecycle.

**Rejected alternative — Redux Toolkit:**  
Redux introduces a store, actions, reducers, and selectors for what is ultimately two PATCH calls. The boilerplate-to-value ratio is extremely high for this scope. Redux also conflicts with Next.js server components, which cannot be wrapped in a `Provider`.

**Rejected alternative — Zustand:**  
Zustand is lighter than Redux but still unnecessary. A shared store implies shared mutable state across components — there is no such requirement here. `useState` inside `TicketRow` is sufficient and easier to reason about.

**Consequences:**  
- Positive: No store to initialise, no Provider to wrap, no actions to dispatch — the component tree stays simple.  
- Negative: If a future requirement adds cross-row state (e.g. bulk select), local state will need to be lifted. That is the correct time to introduce Zustand, driven by a new story.

---

### ADR-007: API Style — REST Route Handlers (Reject tRPC)

**Date:** June 2026  
**Status:** Accepted

**Context:**  
The dashboard needs two API endpoints: `GET /tickets` and `PATCH /tickets/:id` (FR-5). Options considered: Next.js REST Route Handlers, tRPC.

**Decision:**  
Use **Next.js REST Route Handlers** with plain JSON responses.

**Reasoning:**  
The API surface is two endpoints with a well-defined contract in the PRD. REST is universally understood, requires no client library, and the endpoint shape is directly testable with `curl` or any HTTP client. The challenge also explicitly states the API must expose `GET /tickets` and `PATCH /tickets/:id` — named REST routes, not tRPC procedures.

**Rejected alternative — tRPC:**  
tRPC provides end-to-end type safety by generating a typed client from the server router. This is valuable for larger APIs but adds a runtime dependency, a tRPC client setup on the frontend, and a non-standard request shape (POST for all mutations). For two endpoints, the overhead exceeds the benefit. The type safety goal is already met by Zod + TypeScript strict mode.

**Consequences:**  
- Positive: Endpoints are self-describing, easy to test manually, and match the PRD contract exactly.  
- Negative: Type sharing between API response and client requires manual `export` of Zod-inferred types. Acceptable at this scale.

---

### ADR-008: Package Manager — pnpm

**Date:** June 2026  
**Status:** Accepted

**Context:**  
The project needs a package manager for local development and CI. Options considered: pnpm, npm, Yarn.

**Decision:**  
Use **pnpm** with a `pnpm-lock.yaml` lockfile.

**Reasoning:**  
pnpm uses a content-addressable store that hard-links packages rather than copying them, significantly reducing `node_modules` disk usage. Its strict `node_modules` layout prevents packages from importing undeclared dependencies — a common source of "works on my machine" CI failures. The GitHub Actions CI starter provided by the challenge uses `pnpm/action-setup@v4`, confirming it is the expected package manager for this programme.

**Rejected alternative — npm:**  
npm copies all packages into a flat `node_modules` structure, which allows implicit imports of unlisted transitive dependencies. This masks missing `package.json` entries until CI runs on a clean install.

**Rejected alternative — Yarn:**  
Yarn Berry (v2+) uses Plug'n'Play, which requires editor and tooling support configuration that adds setup overhead. Yarn Classic (v1) has no advantages over pnpm at this scale.

**Consequences:**  
- Positive: `pnpm install --frozen-lockfile` in CI is deterministic and fast due to the global cache.  
- Negative: Team members must have pnpm installed globally (`npm i -g pnpm`). Mitigated by documenting this in the README.
