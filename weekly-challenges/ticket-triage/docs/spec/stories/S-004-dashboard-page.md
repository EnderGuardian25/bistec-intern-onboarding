# S-004 — Ticket Dashboard Page (Server Component)

**Status:** Ready  
**Linked task:** T4 in speckit.yaml  
**Acceptance criteria from:** FR-1, FR-2

## Story

As a **PMO coordinator**,  
I want to open the dashboard and immediately see all tickets grouped by priority,  
So that I can identify critical issues at a glance without any filtering.

## Acceptance Criteria

**Given** the dashboard loads at `/tickets`,  
**When** the page renders,  
**Then** all tickets from the database are displayed, each showing: ID, title, priority, owner, and status.

**Given** tickets are loaded,  
**When** the PMO coordinator views the page,  
**Then** tickets are grouped under three sections: P0, P1, and P2, each with a count badge showing the number of tickets in that group.

**Given** a priority group has no tickets,  
**When** it renders,  
**Then** it shows an empty state message rather than an empty section.

**Given** the page is a Next.js server component,  
**When** it fetches data,  
**Then** it queries Prisma directly — it does NOT use `fetch()` to call `/api/tickets`.

## Notes

- This is a server component — no `"use client"` directive
- Data fetching must go through `db` imported from `@/lib/db`
- Each ticket row should be rendered using the `TicketRow` client component (S-005)
- Initial page render must be under 1.5s on localhost (NFR-1)
