# Ticket Triage Tool — PRD

## 1. Persona

**Name:** Maya — PMO Coordinator  
**Role:** Project Management Office staff at Bistec Global  
**Context:** Maya manages 3–5 active internal projects simultaneously. She receives tickets from multiple engineering teams via Slack, email, and GitHub Issues. Each morning she spends 20–30 minutes manually sorting through a shared spreadsheet to figure out what is blocked, what is urgent, and who owns what.  
**Pain Point:** There is no single view of open tickets ranked by priority. Tickets sit in a spreadsheet with no ownership enforcement and no badge summary. Maya often escalates the wrong issue first because severity is not visible at a glance.  
**Technical comfort:** Non-technical. Uses browser-based tools only.

---

## 2. Problem Statement

**What breaks today:** PMO staff have no lightweight, always-current view of open tickets grouped by priority. The shared spreadsheet is updated manually and goes stale within hours.  
**Who is affected:** Maya and 2 other PMO coordinators who run daily standups. Engineers are indirectly affected when the wrong tickets get escalated.  
**Why now:** The team is growing from 8 to 15 engineers in Q3 2026. The spreadsheet approach will not scale. A read/write dashboard is needed before headcount doubles.  
**Measurable gap:** PMO coordinators spend an estimated 25 minutes per day on ticket sorting that a filtered dashboard would reduce to under 5 minutes.

---

## 3. Goals & Non-Goals

### Goals
- G-1: PMO staff can view all open tickets in under 2 seconds on localhost
- G-2: Tickets are grouped by priority (P0 / P1 / P2) with count badges visible without scrolling
- G-3: Any PMO staff member can update a ticket's priority and owner in under 3 clicks
- G-4: An API layer allows future integration with GitHub Issues via webhook

### Non-Goals
- NG-1: This tool does not replace GitHub Issues or Jira — it reads from a seed file only in v1
- NG-2: No authentication in v1 — internal network access only
- NG-3: No real-time push updates — polling or manual refresh is acceptable in v1
- NG-4: No mobile-specific layout in v1

---

## 4. Functional Requirements

**FR-1 — List open tickets**  
*Given* a PMO coordinator opens the dashboard,  
*When* the page loads,  
*Then* all tickets from the seed data are displayed, each showing: ID, title, priority, owner, and status.

**FR-2 — Group by priority with count badges**  
*Given* tickets are loaded,  
*When* the PMO coordinator views the dashboard,  
*Then* tickets are visually grouped under P0, P1, and P2 headers, each header showing the count of tickets in that group.

**FR-3 — Tag ticket priority**  
*Given* a PMO coordinator clicks a priority badge on a ticket,  
*When* they select a new priority (P0 / P1 / P2),  
*Then* the ticket's priority updates immediately in the UI and persists via `PATCH /tickets/:id`.

**FR-4 — Assign ticket owner**  
*Given* a PMO coordinator clicks the owner field on a ticket,  
*When* they type a name and confirm,  
*Then* the ticket's owner field updates and persists via `PATCH /tickets/:id`.

**FR-5 — API surface**  
*Given* a client calls `GET /tickets`,  
*When* the request is valid,  
*Then* the response is a JSON array of all tickets with fields: `id`, `title`, `priority`, `owner`, `status`.  
*Given* a client calls `PATCH /tickets/:id` with a valid body,  
*When* the payload passes Zod validation,  
*Then* the updated ticket object is returned with HTTP 200.  
*When* the payload fails Zod validation,  
*Then* a structured error is returned with HTTP 422.

---

## 5. Non-Functional Requirements

| # | Requirement | Target | Measurement |
|---|-------------|--------|-------------|
| NFR-1 | Initial page render | < 1.5s on localhost | Measured with Chrome DevTools Network throttling off |
| NFR-2 | API response p95 | < 150ms with seed data (≤ 50 tickets) | Measured with `autocannon` or Vitest timing |
| NFR-3 | TypeScript strictness | Zero `any` types | `tsc --noEmit` passes with `strict: true` |
| NFR-4 | Commit hygiene | All commits follow Conventional Commits | Enforced via `commitlint` in CI |
| NFR-5 | CI pipeline duration | < 3 minutes end-to-end | GitHub Actions run time |
| NFR-6 | Accessibility | No critical axe violations | Checked with `@axe-core/react` in dev |
