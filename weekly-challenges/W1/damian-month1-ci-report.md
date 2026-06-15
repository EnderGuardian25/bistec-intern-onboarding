# CI Report — Month 1

**Repository:** `damian-month1-ticket-triage`

---

## Pipeline Setup

**File:** `.github/workflows/ci.yml`  
**Trigger:** `pull_request` targeting `main`  
**Runner:** `ubuntu-latest`

**Jobs:**

| Step | Command | Purpose |
|------|---------|---------|
| Checkout | `actions/checkout@v4` | Pull repo at PR head |
| Setup pnpm | `pnpm/action-setup@v4` | Install pnpm (version from `packageManager` field) |
| Setup Node | `actions/setup-node@v4` (Node 20, cache: pnpm) | Install Node and restore pnpm store cache |
| Install | `pnpm install --frozen-lockfile` | Deterministic dependency install |
| Lint | `pnpm lint` | ESLint strict — zero errors required |
| Type check | `pnpm typecheck` | `tsc --noEmit` with `strict: true` |
| Test | `pnpm test` | Vitest smoke tests |
| Build | `pnpm build` | `next build` — must exit 0 |

**Caching strategy:**  
- pnpm store cached via `actions/setup-node` built-in cache (`cache: 'pnpm'`)  
- Next.js build cache cached via `actions/cache` on `.next/cache`

---

## Results Summary

| Metric | Target | Achieved |
|--------|--------|----------|
| End-to-end duration | < 3 min | TBD — fill after first CI run |
| Lint errors | 0 | TBD |
| Type errors | 0 | TBD |
| Test pass rate | 100% | TBD |

> **Note:** Update this table after your first successful CI run on the training org. Paste the GitHub Actions run URL here.

---

## Failures and Fixes

### Failure 1 — ESLint `no-unused-vars` on Prisma import

**Error message:**
```
src/lib/db.ts
  1:8  error  'PrismaClient' is defined but never used  no-unused-vars
```

**Root cause:** The db.ts file imported `PrismaClient` as a named import for the type, but ESLint flagged it because the variable was only used as a type annotation (not at runtime).

**Fix:** Changed to a type-only import:
```typescript
// Before
import { PrismaClient } from '@prisma/client';

// After
import type { PrismaClient } from '@prisma/client';
```

**Fix commit:** `fix: use type-only import for PrismaClient in db.ts`

---

### Failure 2 — `tsc --noEmit` failing on `unknown` in Zod error handler

**Error message:**
```
src/server/routes/tickets.ts:34:28 - error TS2339:
Property 'errors' does not exist on type 'unknown'.
```

**Root cause:** The Zod validation error was caught as `unknown` (correct) but then accessed as `e.errors` without narrowing to `ZodError` first.

**Fix:**
```typescript
// Before
} catch (e: unknown) {
  return NextResponse.json({ errors: e.errors }, { status: 422 });
}

// After
} catch (e: unknown) {
  if (e instanceof ZodError) {
    return NextResponse.json({ errors: e.errors }, { status: 422 });
  }
  return NextResponse.json({ error: 'Unknown error' }, { status: 500 });
}
```

**Fix commit:** `fix: narrow ZodError in PATCH handler catch block`

---

### Failure 3 — Next build failing due to missing Prisma client generation

**Error message:**
```
Error: @prisma/client did not initialize yet. Please run "prisma generate"
```

**Root cause:** The CI pipeline ran `pnpm build` without first running `prisma generate`. The generated Prisma client wasn't committed to the repo (correctly, it's in `.gitignore`), so it didn't exist in the CI environment.

**Fix:** Added a `postinstall` script to `package.json`:
```json
"scripts": {
  "postinstall": "prisma generate"
}
```

This means `pnpm install --frozen-lockfile` automatically generates the Prisma client in CI without an extra step.

**Fix commit:** `fix: add postinstall script to run prisma generate in CI`

---

## Demo Recording

**Link:** _(Add your Loom / YouTube unlisted link here after recording)_

**Coverage checklist (must hit all three in under 3:30):**

- [ ] **PRD walkthrough (0:00–1:00)** — Open `damian-month1-spec.md`, walk through the persona, problem statement, and two ADRs. Explain one rejected alternative in your own words.
- [ ] **Scaffold generation (1:00–2:00)** — Show the speckit.yaml, then run the Claude Code command below. Show the generated files appearing in the repo. Do not edit any file manually.
- [ ] **Passing CI (2:00–3:00)** — Show the GitHub Actions run on main with all four checks green. Point out the pipeline duration.

**Claude Code regeneration command (for README and demo):**
```bash
claude "Read docs/spec/prd.md, docs/spec/adr-001-framework.md, and \
docs/spec/adr-002-data-layer.md. Execute all tasks in speckit.yaml \
in order. Do not add any field, file, or dependency not referenced \
in the PRD or ADRs."
```

---

## Offline Milestones Checklist (Before Month 2)

- [ ] Add authentication scaffold (NextAuth with email magic link) via spec-first flow
- [ ] Write an ADR rejecting Redux for this app
- [ ] Add a second entity (Comment) driven entirely by a new story and Claude Code
- [ ] Configure Dependabot and fix its first PR
- [ ] Record a 5-minute explainer on "what changed in my prompting this week"
- [ ] Pair-review a peer's spec and file ≥ 3 actionable comments
