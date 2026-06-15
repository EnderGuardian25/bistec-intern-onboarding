# ADR-008: Package Manager — pnpm

**Date:** June 2026  
**Status:** Accepted

## Context

The project needs a package manager for local development and CI. Options considered: pnpm, npm, Yarn.

## Decision

Use **pnpm** with a `pnpm-lock.yaml` lockfile.

## Reasoning

pnpm uses a content-addressable store that hard-links packages rather than copying them, significantly reducing `node_modules` disk usage. Its strict `node_modules` layout prevents packages from importing undeclared dependencies — a common source of "works on my machine" CI failures. The GitHub Actions CI starter provided by the challenge uses `pnpm/action-setup@v4`, confirming it is the expected package manager for this programme.

## Rejected Alternatives

**npm:**  
npm copies all packages into a flat `node_modules` structure, which allows implicit imports of unlisted transitive dependencies. This masks missing `package.json` entries until CI runs on a clean install.

**Yarn:**  
Yarn Berry (v2+) uses Plug'n'Play, which requires editor and tooling support configuration that adds setup overhead. Yarn Classic (v1) has no advantages over pnpm at this scale.

## Consequences

- **Positive:** `pnpm install --frozen-lockfile` in CI is deterministic and fast due to the global cache.
- **Negative:** Team members must have pnpm installed globally (`npm i -g pnpm`). Mitigated by documenting this in the README.
