# ADR-007: API Style — REST Route Handlers (Reject tRPC)

**Date:** June 2026  
**Status:** Accepted

## Context

The dashboard needs two API endpoints: `GET /tickets` and `PATCH /tickets/:id` (FR-5). Options considered: Next.js REST Route Handlers, tRPC.

## Decision

Use **Next.js REST Route Handlers** with plain JSON responses.

## Reasoning

The API surface is two endpoints with a well-defined contract in the PRD. REST is universally understood, requires no client library, and the endpoint shape is directly testable with `curl` or any HTTP client. The challenge also explicitly states the API must expose `GET /tickets` and `PATCH /tickets/:id` — named REST routes, not tRPC procedures.

## Rejected Alternatives

**tRPC:**  
tRPC provides end-to-end type safety by generating a typed client from the server router. This is valuable for larger APIs but adds a runtime dependency, a tRPC client setup on the frontend, and a non-standard request shape (POST for all mutations). For two endpoints, the overhead exceeds the benefit. The type safety goal is already met by Zod + TypeScript strict mode.

## Consequences

- **Positive:** Endpoints are self-describing, easy to test manually, and match the PRD contract exactly.
- **Negative:** Type sharing between API response and client requires manual `export` of Zod-inferred types. Acceptable at this scale.
