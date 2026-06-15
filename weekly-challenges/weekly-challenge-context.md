# Weekly Challenge Context

Running reference document for the Bistec Hearts Academy — Industry Readiness Programme (IRP).  
Updated each week after watching the video and reading the challenge page.

---

## Week 1 — Spec-First Mindset

**Source:** https://process.bistecglobal.com/academy/external-intership-program/weekly-videos/week-01-spec-first-mindset/  
**Video:** BISTEC Hearts Academy | IRP Week 1 | Production Software Gets Built Spec-First  
**YouTube:** https://www.youtube.com/watch?v=zdGnncaHYkY  
**Phase:** Foundations · Month: 1 · Duration: 12 min · Slides: 14

### What the Video Covers

Sets the mindset for the whole programme. The core message is why Bistec ships spec-first, what a spec actually looks like, and why "AI will code it" is not an excuse to skip the spec. Three things you should leave knowing: why spec-first exists, what a spec looks like in practice, and how it connects to Claude Code.

### Core Concepts

**Classroom code vs production code**  
In a classroom, assignments have an answer key. In production, there are stakeholders, revenue, and incidents. The rules change when real users depend on what you ship.

**Spec-first rewind**  
Rework is cheap in Markdown, expensive in a merged PR. The earlier you catch a misunderstanding, the less it costs to fix.

**BMAD artefacts**  
The four building blocks of a spec: Persona → PRD → Architecture → Stories. Each feeds the next.

**Context engineering primer**  
The spec is the first context you hand Claude Code. The quality of the generated code is a direct reflection of how precise the spec is. Garbage in, garbage out.

**Daily NAITA diary**  
A daily log of what you worked on, for how long, and what you learned. Industrial training auditors use this to verify hours. Write it the same day — reconstructing it later is inaccurate.

### Slide Outline

| # | Slide | One-liner |
|---|-------|-----------|
| 01 | Title | Industry Readiness Program — Week 1 |
| 02 | Opening hook | A real Bistec incident traced to a missing spec |
| 03 | Classroom vs production | Two columns: what changes when users depend on you |
| 04 | The spec-first insight | "Cheapest rework is the rework that happens on paper" |
| 05 | BMAD at a glance | Four-box diagram: persona → PRD → architecture → stories |
| 06 | Persona — who asked for this | What a good persona contains, three anti-patterns |
| 07 | PRD — the problem, not the solution | Template walk-through |
| 08 | Acceptance criteria | Given/When/Then; why checkboxes are not enough |
| 09 | Spec as context | How Claude Code consumes the PRD; why less context wins |
| 10 | What we will build this week | Ticket-triage scaffold, fully spec-first |
| 11 | Dev environment checklist | Claude Code, pnpm, Docker, VS Code setup |
| 12 | NAITA diary | Daily entries, supervisor sign-off, how it maps to hours |
| 13 | This week's deliverables | PRD + ADR + scaffold + CI + 3-min demo |
| 14 | Closing | Preview Week 2 (BMAD + Speckit) |

### Challenge Overview

**Source:** https://process.bistecglobal.com/academy/external-intership-program/training-plan/foundation-track/month-1-spec-driven-foundations/CHALLENGE/  
**Time allocation:** 3 hours (during session) · **Difficulty:** Intermediate  
**Challenge version:** 1.0 · **Last updated:** April 2026

Take a real Bistec internal need — a lightweight ticket triage dashboard used by the PMO — and carry it from a blank page to a deployed scaffold using BMAD Method, GitHub Speckit, and Claude Code. No hand-written code until the scaffold exists.

### Tech Stack

- **Framework:** Next.js 15 App Router, TypeScript strict
- **Data layer:** Prisma + SQLite
- **Styling:** Tailwind CSS
- **Validation:** Zod
- **Testing:** Vitest
- **CI:** GitHub Actions
- **Package manager:** pnpm

### Business Requirements

**Functional:**
- PMO staff can list open tickets from a JSON seed file
- PMO staff can tag tickets with priority (P0/P1/P2) and owner
- Dashboard groups tickets by priority with count badges
- API exposes `GET /tickets`, `PATCH /tickets/:id` with Zod-validated input
- PR passes GitHub Actions lint + build + basic smoke test

**Non-Functional:**
- Initial page render under 1.5s on localhost
- API response p95 under 150ms with seed data
- Zero `any` types in TypeScript
- All commits signed and follow Conventional Commits
- CI pipeline under 3 minutes end-to-end

### Deliverables

| # | Deliverable | File | Points |
|---|-------------|------|--------|
| 1 | PRD + ADR | `damian-month1-spec.md` | 25 |
| 2 | Speckit task plan + scaffold prototype | Repository + `speckit.yaml` | 25 |
| 3 | Context engineering notes | `damian-month1-context-notes.md` | 25 |
| 4 | CI pipeline + demo recording | `damian-month1-ci-report.md` | 25 |

**Passing score:** 75% (75/100)

### Deliverable 1 — PRD + ADR Evaluation Criteria
- Persona is concrete and tied to a Bistec role (5 pts)
- Problem statement is measurable, not aspirational (5 pts)
- Acceptance criteria in Given/When/Then form (5 pts)
- NFRs are numeric, not adjectives (5 pts)
- ADRs include at least one rejected alternative each (5 pts)

### Deliverable 2 — Scaffold Evaluation Criteria
- Speckit tasks are granular (≤ 30 min each) (5 pts)
- Scaffold builds without manual edits (5 pts)
- Schema matches PRD entities exactly (5 pts)
- API surface matches FR list 1:1 (5 pts)
- README enables a stranger to regenerate in under 10 minutes (5 pts)

### Deliverable 3 — Context Notes Evaluation Criteria
- Failure modes are specific, not generic (5 pts)
- Re-prompts include the agent's exact failing output (5 pts)
- Context choices are justified in one sentence each (5 pts)
- Includes a measurable improvement (tokens, time, or correctness) (5 pts)
- Demonstrates reduction of context in at least one case (5 pts)

### Deliverable 4 — CI Report Evaluation Criteria
- CI file uses caching for pnpm + Next build (5 pts)
- Demo recording is under 3:30 (5 pts)
- Failures documented honestly with root cause (5 pts)
- Recording quality: audio clear, screen readable (5 pts)
- All four checks pass on main branch (5 pts)

### Repository Structure (end state after Claude Code runs)

```
ticket-triage/
├── docs/
│   └── spec/
│       ├── prd.md
│       ├── adr-001-framework.md
│       ├── adr-002-data-layer.md
│       ├── adr-003-validation.md
│       ├── adr-004-css.md
│       ├── adr-005-testing.md
│       ├── adr-006-state-management.md
│       ├── adr-007-api-style.md
│       ├── adr-008-package-manager.md
│       └── stories/
├── src/
│   ├── app/
│   │   └── tickets/
│   ├── lib/
│   │   └── db.ts
│   └── server/
│       └── routes/
├── prisma/
│   └── schema.prisma
├── tests/
├── speckit.yaml
└── README.md
```

### Submission File Naming

```
damian-month1-spec.md
damian-month1-context-notes.md
damian-month1-ci-report.md
damian-month1-ticket-triage/  (zipped repository)
```

### Scoring Guide

| Grade | Score | Description |
|-------|-------|-------------|
| Exceptional | 90–100 | Ship-ready scaffold, zero manual edits, exemplary context discipline |
| Proficient | 75–89 | Runs end-to-end, minor spec gaps, solid CI |
| Developing | 60–74 | Spec + scaffold present, missing one check, needs rework |
| Beginning | < 60 | Spec thin, scaffold broken, CI red |

### Offline Milestones (Before Month 2)

- [ ] Add authentication scaffold (NextAuth with email magic link) via spec-first flow
- [ ] Write an ADR rejecting Redux for this app
- [ ] Add a second entity (Comment) driven entirely by a new story and Claude Code
- [ ] Configure Dependabot and fix its first PR
- [ ] Record a 5-minute explainer on "what changed in my prompting this week"
- [ ] Pair-review a peer's spec and file ≥ 3 actionable comments

### Required Viewing Before Session

- Bistec Handbook — chapter 1 (What We Build)
- "Why Spec-First" — programme lead talking head (5 min, linked from LMS)

### Resources Referenced on Page

- `docs/academy/external-intership-program/training-plan/foundation-track/month-1-spec-driven-foundations/SESSION.md`
- `docs/academy/external-intership-program/training-plan/foundation-track/month-1-spec-driven-foundations/CHALLENGE.md`
- BMAD Method handbook (internal)

### Week 1 Files Created

| File | Location | Purpose |
|------|----------|---------|
| `damian-month1-spec.md` | `W1/` | Full PRD + 8 ADRs (master reference) |
| `speckit.yaml` | `W1/` | 7-task agent-executable plan |
| `damian-month1-context-notes.md` | `W1/` | Context engineering journal |
| `damian-month1-ci-report.md` | `W1/` | CI pipeline report template |
| `prd.md` | `W1/docs/spec/` | PRD only — drop into repo |
| `adr-001-framework.md` | `W1/docs/spec/` | Next.js decision |
| `adr-002-data-layer.md` | `W1/docs/spec/` | Prisma + SQLite decision |
| `adr-003-validation.md` | `W1/docs/spec/` | Zod decision |
| `adr-004-css.md` | `W1/docs/spec/` | Tailwind decision |
| `adr-005-testing.md` | `W1/docs/spec/` | Vitest decision |
| `adr-006-state-management.md` | `W1/docs/spec/` | No Redux/Zustand decision |
| `adr-007-api-style.md` | `W1/docs/spec/` | REST over tRPC decision |
| `adr-008-package-manager.md` | `W1/docs/spec/` | pnpm decision |

---

## Week 2 — BMAD & Speckit

> _Add notes here after watching the Week 2 video._

---

## Week 3 — Claude Code Deep Dive

> _Add notes here after watching the Week 3 video._

---

## Week 4 — First Deploy CI/CD

> _Add notes here after watching the Week 4 video._
