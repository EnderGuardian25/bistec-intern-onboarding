# ADR 0001: Record Architecture Decisions

## Status
Accepted (date: 2025-01-15)

## Context

- GreenChit is a greenfield internal tool with a small team. Decisions made early — hosting platform, database engine, receipt storage strategy — will be expensive to reverse once payroll integrations and audit trails accumulate real data.
- Without a written record, the reasoning behind decisions evaporates when team members rotate or onboard. Future contributors inherit choices with no explanation, which leads to either cargo-culting the original decision or ignoring it entirely.
- The team is composed of first-year and early-career engineers who are still building the habit of thinking about architectural trade-offs explicitly. A lightweight forcing function is needed.
- We do not yet know how large the team will grow, or how formal the review process needs to become. A heavy process (RFCs, architecture review boards) would be premature.

## Decision

Every decision that affects the structure of the system, the choice of infrastructure, or a constraint that other engineers must work within gets its own numbered Markdown file in the `/adrs` directory of the repository.

Each ADR follows a fixed template: Status, Context, Decision, Consequences, and Alternatives Considered. ADRs are written in active voice and committed alongside the code they affect. Once marked Accepted, an ADR is never edited — if the decision changes, a new ADR is written that supersedes it, and the old one is marked Superseded.

## Consequences

**Easier**
- New team members can read `/adrs` to understand why the system is shaped the way it is, without interrogating senior engineers.
- Disagreements about past decisions have a paper trail. The conversation moves from "why did we do this?" to "should we supersede ADR-000X?"
- Reviewing a pull request that changes infrastructure now includes checking whether an ADR documents the reasoning.

**Harder**
- Engineers must slow down and write before they build. Under deadline pressure this will feel like overhead, and there will be a temptation to skip it.
- There is no enforcement mechanism other than pull request review discipline. If reviewers don't insist on ADRs, the practice will quietly die.
- The ADR format can give a false sense of rigour — a poorly reasoned ADR filed promptly is worse than no ADR, because it buries the real reasoning under confident-sounding prose.

**Different**
- Architecture discussions shift from Slack threads (ephemeral, unsearchable) to committed Markdown (permanent, diffable). The repository becomes the authoritative record of intent, not individual memory.

## Alternatives Considered

**Wiki pages** — A Confluence or Notion page per decision is easier to edit collaboratively, but edits erase history and there is no convention for marking a decision as superseded versus just quietly wrong. Rejected because mutability undermines the purpose.

**No formal record** — Acceptable for a two-day prototype; not acceptable for a system that will process real payroll exports and carry a compliance audit trail. Rejected.

**RFC process with approval gates** — More rigorous, but disproportionate for a team of this size. Can be adopted later if GreenChit grows. Rejected for now.
