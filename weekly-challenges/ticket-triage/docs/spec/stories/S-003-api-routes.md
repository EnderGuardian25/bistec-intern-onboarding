# S-003 — API Route Handlers: GET and PATCH

**Status:** Ready  
**Linked task:** T3 in speckit.yaml  
**Acceptance criteria from:** FR-5

## Story

As a **client application**,  
I want REST endpoints to list and update tickets,  
So that the dashboard UI can read and write ticket data without direct database access.

## Acceptance Criteria

**Given** a valid request to `GET /api/tickets`,  
**When** the endpoint is called,  
**Then** it returns HTTP 200 with a JSON array of all tickets, each containing: `id`, `title`, `priority`, `owner`, `status`, `createdAt`.

**Given** a valid request to `PATCH /api/tickets/:id` with body `{ "priority": "P0" }`,  
**When** the endpoint is called,  
**Then** it returns HTTP 200 with the updated ticket object.

**Given** a request to `PATCH /api/tickets/:id` with an invalid priority (e.g. `"P9"`),  
**When** the Zod validator rejects it,  
**Then** it returns HTTP 422 with a structured `{ errors: [...] }` body.

**Given** a request to `PATCH /api/tickets/:id` with an empty body `{}`,  
**When** the refine check fails (no field provided),  
**Then** it returns HTTP 422.

## Notes

- Use Zod schema from `src/lib/validators/ticket.ts` — do not inline validation
- Catch block must use `unknown`, not `any` — narrow with `instanceof ZodError`
- Import Prisma client from `@/lib/db`, not a new `PrismaClient()` instance
