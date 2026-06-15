# S-005 — TicketRow Client Component with Optimistic Updates

**Status:** Ready  
**Linked task:** T5 in speckit.yaml  
**Acceptance criteria from:** FR-3, FR-4

## Story

As a **PMO coordinator**,  
I want to update a ticket's priority and owner directly from the dashboard row,  
So that I can triage tickets without leaving the page or opening a separate form.

## Acceptance Criteria

**Given** a ticket row is displayed,  
**When** the PMO coordinator selects a new priority from the dropdown,  
**Then** the UI updates immediately (optimistic) and `PATCH /api/tickets/:id` is called with the new priority.

**Given** a ticket row is displayed,  
**When** the PMO coordinator edits the owner field and clicks away (blur),  
**Then** `PATCH /api/tickets/:id` is called with the new owner value.

**Given** a PATCH request is in flight,  
**When** the component is saving,  
**Then** the row shows a visual saving state (reduced opacity or similar).

**Given** the component,  
**When** TypeScript checks it,  
**Then** there are zero `any` types.

## Notes

- This is a client component — must have `"use client"` at the top
- Use `useState` for local optimistic state — no external store (see ADR-006)
- Only call PATCH on owner blur if the value actually changed
- Priority dropdown options: P0, P1, P2 only
