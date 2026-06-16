# S-001 — Prisma Schema for Ticket Entity

**Status:** Ready  
**Linked task:** T1 in speckit.yaml  
**Acceptance criteria from:** FR-1, FR-3, FR-4, FR-5

## Story

As a **PMO coordinator**,  
I want ticket data to be persisted in a database with defined fields,  
So that priority and owner changes survive page refreshes.

## Acceptance Criteria

**Given** the Prisma schema is defined,  
**When** `prisma migrate dev` is run,  
**Then** a `Ticket` table is created with the following fields:
- `id` — auto-incrementing integer primary key
- `title` — non-null string
- `priority` — string, default `"P1"`, accepts `"P0"`, `"P1"`, `"P2"` only
- `owner` — nullable string
- `status` — string, default `"open"`
- `createdAt` — datetime, default now

**Given** the schema,  
**When** `prisma generate` runs,  
**Then** the Prisma client is fully typed with no `any` types.

## Notes

- Priority is stored as a plain `String` in SQLite and validated at the API layer by Zod (see S-003)
- Do not add fields not listed above — schema must match the PRD entity exactly
