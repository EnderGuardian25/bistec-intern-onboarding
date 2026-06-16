# S-006 — Vitest Smoke Tests for API Routes

**Status:** Ready  
**Linked task:** T6 in speckit.yaml  
**Acceptance criteria from:** NFR-5 (CI must pass)

## Story

As a **developer**,  
I want automated smoke tests that verify the API contract,  
So that CI can catch regressions before they reach main.

## Acceptance Criteria

**Given** the test suite runs with `pnpm test`,  
**When** all tests pass,  
**Then** the exit code is 0 and the CI step is green.

**Given** the smoke tests,  
**When** they run,  
**Then** at minimum these three cases are covered:
1. `GET /api/tickets` returns an array with the correct shape
2. `PATCH /api/tickets/:id` with a valid body returns HTTP 200
3. `PATCH /api/tickets/:id` with an invalid priority returns HTTP 422

**Given** the tests,  
**When** Prisma is called,  
**Then** it is mocked with `vi.mock('@/lib/db')` — no real database calls in tests.

## Notes

- Use Vitest (`vitest`) — not Jest
- Keep tests focused on the public API contract, not Prisma internals
- Fewer, focused tests run faster and catch more signal — target under 5 seconds total
- Reference ADR-005 for the rationale behind Vitest over Jest
