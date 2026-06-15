# Context Engineering Journal — Month 1

## Overview

This journal documents how I used Claude Code to scaffold the ticket triage dashboard spec-first. It captures which files I attached to each task, why, what went wrong, and how I fixed it through re-prompting.

---

## Prompt Strategy

### T1 — Prisma Schema Generation
**Files attached:** `docs/spec/prd.md`  
**Why:** The PRD contains the exact entity fields and acceptance criteria for FR-1 to FR-5. No other file was needed at this stage — the schema should be derived purely from the spec, not from any framework boilerplate.  
**Result:** Claude generated the schema correctly on the first attempt.

---

### T2 — Seed Script
**Files attached:** `docs/spec/prd.md`, `prisma/schema.prisma`  
**Why:** I attached the schema so Claude wouldn't invent field names that don't exist. Attaching the PRD ensured the seed data matched realistic PMO scenarios (ticket titles and priorities that make sense in context).

---

### T3 — API Route Handlers
**Files attached:** `docs/spec/prd.md` (FR-5 section only), `prisma/schema.prisma`  
**Why:** I deliberately attached only the FR-5 section rather than the full PRD to reduce noise. The schema was needed so the Zod validator types matched the Prisma model exactly. Attaching less context here actually produced cleaner output — Claude stayed focused on the API contract.

---

### T4 — Dashboard Page
**Files attached:** `docs/spec/prd.md` (FR-1, FR-2), `src/server/routes/tickets.ts`  
**Why:** The route file showed Claude the exact shape of the API response, so the page component could type the fetch result correctly without guessing.

---

### T5 — TicketRow Client Component
**Files attached:** `src/app/tickets/page.tsx`, `src/server/routes/tickets.ts`, `docs/spec/prd.md` (FR-3, FR-4)  
**Why:** Both the page and the route handler were needed so Claude understood the full data flow — where the ticket object came from and what the PATCH endpoint expected.

---

### T6 — Smoke Tests
**Files attached:** `src/server/routes/tickets.ts`, `src/app/tickets/TicketRow.tsx`  
**Why:** These are the two units being tested. I did not attach the PRD here — at test-writing time, the spec is already encoded in the implementation. Adding the PRD would have added tokens without adding useful information.

---

### T7 — CI + README
**Files attached:** All generated files (full repo context)  
**Why:** The CI file needs to know the actual scripts (`pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build`) and the README needs to describe the real file structure. This is the one place where broad context was justified.

---

## Failure Modes

### Failure 1 — `any` type slipping through in route handler
**Task:** T3  
**What happened:** Claude generated the Zod error handler with `catch (e: any)` in the try/catch block, which violated NFR-3.  
**Missing context:** The prompt said "zero any types" but didn't explicitly include the `tsconfig.json` to show `strict: true` was enforced at the compiler level.  
**Fix:** Re-prompted with the tsconfig attached and "do not use `any` in catch blocks — use `unknown` and narrow the type."

---

### Failure 2 — Seed data had duplicate IDs
**Task:** T2  
**What happened:** The generated seed script used hardcoded `id` values starting from 1, which conflicted with Prisma's autoincrement. Running `pnpm db:seed` twice threw a unique constraint error.  
**Missing context:** I didn't mention that the `id` field was autoincrement. The PRD says it but I didn't highlight it in the prompt.  
**Fix:** Added "Do not set the `id` field — it is autoincrement and Prisma will assign it" to the prompt.

---

### Failure 3 — Dashboard page used `fetch` with a hardcoded localhost URL
**Task:** T4  
**What happened:** Claude generated `fetch('http://localhost:3000/api/tickets')` in the server component. This works locally but breaks in CI and production.  
**Missing context:** I didn't explain that in a Next.js App Router server component, you call the Prisma client directly — you don't HTTP-fetch your own API route.  
**Fix:** Re-prompted with: "This is a Next.js server component. Do not use fetch to call /api/tickets. Import the Prisma client directly from src/lib/db.ts and query the database."

---

## Re-Prompt Examples

### Example 1 — Fixing `any` in catch block

**Failing prompt:**
```
Read docs/spec/prd.md FR-5 and prisma/schema.prisma.
Generate src/server/routes/tickets.ts with GET and PATCH handlers.
Use strict TypeScript. Zero any types.
```

**Failing output (relevant snippet):**
```typescript
} catch (e: any) {
  return NextResponse.json({ error: e.message }, { status: 500 });
}
```

**Re-prompt:**
```
The catch block uses `e: any` which violates strict TypeScript.
Change it to `catch (e: unknown)` and narrow the type:
  if (e instanceof Error) return the error message, otherwise return "Unknown error".
Do not use `any` anywhere in the file.
```

**Result:** Claude replaced the catch with a proper `unknown` narrowing pattern. No `any` in the output.  
**Learning:** Saying "zero any types" in the task prompt is not enough. I need to give Claude an explicit example of the pattern to use for `unknown` in catch blocks.

---

### Example 2 — Removing hardcoded localhost URL

**Failing prompt:**
```
Read docs/spec/prd.md FR-1 and FR-2. Read src/server/routes/tickets.ts.
Generate src/app/tickets/page.tsx as a Next.js server component.
Fetch all tickets and group them by priority.
```

**Failing output (relevant snippet):**
```typescript
const res = await fetch('http://localhost:3000/api/tickets');
const tickets = await res.json();
```

**Re-prompt:**
```
This is a Next.js App Router server component — it runs on the server,
not in the browser. Do not use fetch to call your own API route.
Instead, import the Prisma client from '@/lib/db' and query directly:
  const tickets = await db.ticket.findMany({ orderBy: { priority: 'asc' } })
Remove the fetch call entirely.
```

**Result:** The page component now imports `db` and queries Prisma directly. Cleaner, faster, no network round-trip.  
**Learning:** Claude defaults to the fetch pattern because it's the most common example on the web. Server component data fetching via Prisma needs to be stated explicitly.

---

### Example 3 — Less context produced better output

**Original prompt for T6 (smoke tests):**
```
Read src/server/routes/tickets.ts, src/app/tickets/TicketRow.tsx,
prisma/schema.prisma, and docs/spec/prd.md.
Generate tests/tickets.smoke.test.ts using Vitest with at least 3 tests.
```

**Problem:** With 4 files attached, Claude generated 12 tests — many testing implementation details of the Prisma mock rather than the API contract. The test file was 280 lines and took 45 seconds to run.

**Slimmed prompt (fewer files):**
```
Read src/server/routes/tickets.ts only.
Generate tests/tickets.smoke.test.ts using Vitest.
Write exactly 3 tests that verify the public API contract (not Prisma internals):
1. GET /api/tickets returns an array.
2. PATCH /api/tickets/:id with valid body returns 200.
3. PATCH /api/tickets/:id with invalid priority returns 422.
Mock Prisma with vi.mock('@/lib/db').
```

**Result:** 3 focused tests, 65 lines, runs in under 2 seconds.  
**Measurable improvement:** Test file size reduced from 280 lines to 65 lines. CI test step time reduced from ~45s to ~4s. Fewer files = tighter scope = less hallucinated coverage.

---

## Key Takeaways

1. **Attach only what the task needs.** More files is not always better. Every extra file is noise Claude has to filter.
2. **Quote the exact pattern you want.** "Zero any types" is a rule. `catch (e: unknown)` is the pattern. Give both.
3. **Name the framework pattern explicitly.** Claude knows dozens of ways to fetch data in Next.js. Tell it which one: server component + Prisma direct query vs. Route Handler + fetch.
4. **Less context can produce more focused tests.** The spec is already encoded in the implementation by test time — re-attaching the PRD dilutes the signal.
