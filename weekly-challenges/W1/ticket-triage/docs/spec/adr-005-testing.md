# ADR-005: Testing Framework — Vitest

**Date:** June 2026  
**Status:** Accepted

## Context

The CI pipeline requires at least one passing smoke test (NFR check). Options considered: Vitest, Jest.

## Decision

Use **Vitest** as the test runner.

## Reasoning

Vitest uses the same config as the project's build tooling and has native ESM support. It runs faster than Jest on a cold start due to Vite's transformation pipeline. The API is Jest-compatible (`describe`, `it`, `expect`, `vi.mock`) so there is no learning curve switching between them.

## Rejected Alternatives

**Jest:**  
Jest requires separate Babel or ts-jest configuration to handle TypeScript and ESM. Configuring Jest correctly with Next.js App Router adds friction and is a common source of CI failures for junior developers. Vitest works with zero additional config in a Next.js 15 project.

## Consequences

- **Positive:** Zero extra config; `vitest` can be added to `pnpm test` immediately.
- **Negative:** Some Jest-specific utilities differ slightly in config. Not a concern for smoke tests that mock the DB layer.
