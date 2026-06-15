# ADR-002: Data Layer — Prisma + SQLite

**Date:** June 2026  
**Status:** Accepted

## Context

The dashboard needs persistent storage for ticket state (priority, owner). Options considered: Prisma + SQLite, Prisma + PostgreSQL, plain JSON file store.

## Decision

Use **Prisma ORM with SQLite** for v1.

## Reasoning

SQLite requires zero infrastructure setup — the database is a file in the repo. Prisma provides type-safe queries that align with the TypeScript strict requirement (NFR-3). The seed data volume (≤ 50 tickets) will never stress SQLite. This removes Docker and a database server from the local dev setup, keeping the challenge scope to one `pnpm install && pnpm dev`.

## Rejected Alternatives

**Prisma + PostgreSQL:**  
PostgreSQL is the right choice at scale but requires a running database server. Adding Docker Compose to this challenge adds setup friction and widens the scope beyond what the CI pipeline needs to verify.

**Plain JSON file store:**  
A JSON file store is simple but not type-safe. Concurrent PATCH requests would require locking logic. Using Prisma provides the query type safety needed for NFR-3 for free.

## Consequences

- **Positive:** `prisma migrate dev` sets up the database in one command; seed script is trivial.
- **Negative:** SQLite does not support concurrent writes well. Acceptable for a single-user PMO tool in v1. Migration to PostgreSQL in v2 requires only a connection string change when using Prisma.
