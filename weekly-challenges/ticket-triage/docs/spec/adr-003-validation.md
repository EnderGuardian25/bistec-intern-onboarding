# ADR-003: Validation Library — Zod

**Date:** June 2026  
**Status:** Accepted

## Context

The PATCH `/tickets/:id` endpoint must validate incoming request bodies and return structured errors on failure (FR-5). Options considered: Zod, Yup, Joi.

## Decision

Use **Zod** for runtime input validation.

## Reasoning

Zod is TypeScript-first — schemas double as type definitions, so the validated output is automatically typed without a separate cast in most cases. This directly supports NFR-3 (zero `any` types). Zod is also the standard in the Next.js ecosystem and pairs naturally with the App Router's Route Handlers.

## Rejected Alternatives

**Yup:**  
Yup predates TypeScript and its type inference is bolted on. Schema definitions and TypeScript types must be kept in sync manually, which is error-prone under strict mode.

**Joi:**  
Joi is battle-tested but JavaScript-native. It has no first-class TypeScript inference and carries a larger bundle size. Not appropriate for a strict TypeScript codebase.

## Consequences

- **Positive:** Single source of truth — one Zod schema generates both the runtime validator and the TypeScript type.
- **Negative:** Zod v3 error messages are verbose by default. Mitigated by mapping `e.errors` to a clean response shape in the catch block.
