# ADR-006: State Management — No Client Store (Reject Redux / Zustand)

**Date:** June 2026  
**Status:** Accepted

## Context

The dashboard updates ticket priority and owner via PATCH (FR-3, FR-4). A client-side state management library could centralise this state. Options considered: Redux Toolkit, Zustand, React built-in state only.

## Decision

Use **React `useState` and optimistic updates only** — no global client store.

## Reasoning

The dashboard has two interactions: update priority, update owner. Both are isolated to a single `TicketRow` component. There is no shared derived state, no cross-component synchronisation, and no undo/redo requirement. Adding a global store for two local state values violates YAGNI. Server components handle the initial data load; client state handles only the optimistic update lifecycle.

## Rejected Alternatives

**Redux Toolkit:**  
Redux introduces a store, actions, reducers, and selectors for what is ultimately two PATCH calls. The boilerplate-to-value ratio is extremely high for this scope. Redux also conflicts with Next.js server components, which cannot be wrapped in a `Provider`.

**Zustand:**  
Zustand is lighter than Redux but still unnecessary. A shared store implies shared mutable state across components — there is no such requirement here. `useState` inside `TicketRow` is sufficient and easier to reason about.

## Consequences

- **Positive:** No store to initialise, no Provider to wrap, no actions to dispatch — the component tree stays simple.
- **Negative:** If a future requirement adds cross-row state (e.g. bulk select), local state will need to be lifted. That is the correct time to introduce Zustand, driven by a new story.
