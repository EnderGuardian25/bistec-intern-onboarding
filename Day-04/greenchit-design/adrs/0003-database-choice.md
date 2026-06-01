# ADR 0003: Database — Azure SQL over Cosmos DB

## Status
Accepted (date: 2026-05-28)

## Context

- GreenChit needs to persist: expense claims (with status, amounts, category codes), audit log rows (every state transition, immutable), user/role data, and receipt metadata (blob keys, MIME types, hashes).
- The data is inherently relational. A claim belongs to a claimant, is approved by a manager, and is exported by a finance user. Audit rows reference claim IDs. Role assignments reference user IDs. 
- The team has prior experience with SQL. Nobody on the current team has operated a Cosmos DB collection in production.
- BISTEC's finance exports must produce deterministic, consistent snapshots: the payroll batch export cannot tolerate eventual consistency windows where an "Approved" claim is briefly invisible to the export query.
- The audit log is the most sensitive table: it must be append-only, and queries against it (e.g. "show all state changes for claim X") are simple range scans by claim ID and timestamp — a workload SQL handles natively.
- We do not yet know the exact volume of claims per month. Estimates suggest fewer than 500 claims/month for the initial BISTEC rollout.
- Two realistic Azure options: **Azure SQL** and **Azure Cosmos DB**

## Decision

We use **Azure SQL (General Purpose, 2 vCores)** as the sole persistent store for all structured data in GreenChit. Entity Framework Core with migrations manages the schema. The audit log table carries a database-level `CHECK` constraint preventing `UPDATE` and `DELETE` operations, enforcing immutability at the storage layer rather than relying on application-layer discipline.

Cosmos DB is not used. If GreenChit eventually requires globally distributed reads across multiple Azure regions, this decision will be revisited.

## Consequences

**Easier**
- The relational schema can enforce referential integrity between claims, users, and audit rows at the database level. Orphaned audit rows or claims referencing deleted users are structurally prevented.
- Finance export queries are standard SQL aggregations with `WHERE status = 'Approved' AND exported_at IS NULL` — straightforward, testable, and explainable to a finance auditor who asks how the export works.
- Entity Framework Core migrations give the team a code-first schema history that is version-controlled alongside application code.
- ACID transactions mean the claim state update and the audit log insert always succeed or fail together. There is no application logic needed to compensate for partial writes.

**Harder**
- Azure SQL does not scale to zero. The database incurs cost even when idle, just like App Service. Combined, these two choices commit us to a minimum monthly bill even for zero usage.
- Schema migrations require downtime planning as the data volume grows. Adding a column to the claims table at 500 rows is instant; at 500,000 rows with active payroll exports running, it requires a migration strategy. We are accepting this future operational cost.
- If requirements emerge for flexible, schema-less claim metadata like different expense categories requiring different custom fields per category, a relational schema will require a migration for each new field. A document store would handle this more gracefully.

**Different**
- Querying is done in T-SQL, which every team member already knows. Code reviews for database queries are accessible to the whole team, not just a specialist.

## Alternatives Considered

**Azure Cosmos DB (Core API)** — Globally distributed, schema-flexible, and scales to zero on the serverless tier. However, the claims data is naturally relational, the team has no Cosmos DB experience, and strong consistency (required for audit log correctness) costs additional RU budget that is difficult to estimate. The document model would require denormalising claims with embedded approval history, making the payroll export query non-trivial. Rejected.