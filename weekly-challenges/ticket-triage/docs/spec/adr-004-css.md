# ADR-004: CSS Approach — Tailwind CSS

**Date:** June 2026  
**Status:** Accepted

## Context

The dashboard needs a consistent, maintainable styling approach. Options considered: Tailwind CSS, CSS Modules, styled-components.

## Decision

Use **Tailwind CSS** utility classes.

## Reasoning

Tailwind co-locates styles with markup, which reduces context-switching when Claude Code generates components. There are no separate `.module.css` files to generate and keep in sync. Tailwind's constraint-based scale (spacing, colour, typography) produces consistent UI without a design token system. The Bistec internal tooling already uses Tailwind, so no new conventions to learn.

## Rejected Alternatives

**CSS Modules:**  
CSS Modules are scoped and zero-runtime but require a parallel file per component. Claude Code would need to generate and maintain two files per component, doubling the surface area for errors.

**styled-components:**  
styled-components is a runtime CSS-in-JS library. It adds bundle weight and conflicts with Next.js server components, which cannot use React context (which styled-components relies on for theming).

## Consequences

- **Positive:** Styling is self-contained in JSX — easier for Claude Code to generate correct output in one pass.
- **Negative:** Long `className` strings can reduce readability. Mitigated by extracting repeated patterns into small components.
