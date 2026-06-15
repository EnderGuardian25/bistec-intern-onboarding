# ADR-001: Framework Choice — Next.js 15 App Router

**Date:** June 2026  
**Status:** Accepted

## Context

We need a full-stack TypeScript framework that can serve both the dashboard UI and the REST API from a single repository. Options considered: Next.js 15, Remix 2, plain Express + React SPA.

## Decision

Use **Next.js 15 App Router** with TypeScript strict mode.

## Reasoning

Next.js provides co-located API routes (Route Handlers) and server components in the same project. The Bistec stack already uses Next.js on other internal tools, so onboarding friction is low. The App Router's server components reduce client-side JavaScript for the list view, helping hit the < 1.5s render target.

## Rejected Alternatives

**Remix 2:**  
Remix has excellent data loading patterns but the team has no existing Remix projects. Switching would require a new deployment profile and more onboarding time.

**Express + React SPA:**  
Separating the API server and the frontend into two packages increases CI complexity and deployment surface without adding value at this scale.

## Consequences

- **Positive:** Single `pnpm dev` starts everything; Claude Code can scaffold routes and pages in one pass.
- **Negative:** App Router has a learning curve for junior developers unfamiliar with RSC. Mitigated by keeping data fetching in server components only.
