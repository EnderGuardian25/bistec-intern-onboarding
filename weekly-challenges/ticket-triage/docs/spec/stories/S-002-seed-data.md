# S-002 — Seed Data for Ticket Table

**Status:** Ready  
**Linked task:** T2 in speckit.yaml  
**Acceptance criteria from:** FR-1, FR-2

## Story

As a **PMO coordinator**,  
I want realistic sample tickets pre-loaded when the app starts fresh,  
So that I can see the dashboard working without manually creating data.

## Acceptance Criteria

**Given** a fresh database after migration,  
**When** `pnpm db:seed` is run,  
**Then** exactly 12 tickets are inserted with no errors.

**Given** the seed data,  
**When** the dashboard loads,  
**Then** tickets are distributed across priorities: at least 3 P0, at least 4 P1, at least 5 P2.

**Given** the seed script,  
**When** it is run a second time,  
**Then** it does not set the `id` field manually — Prisma autoincrement handles it.

## Notes

- Ticket titles should reflect realistic PMO scenarios (CI failures, API issues, backlog tasks)
- `owner` field may be null on some tickets to test the unassigned state
- Running the seed twice will create duplicate titles — acceptable for v1
