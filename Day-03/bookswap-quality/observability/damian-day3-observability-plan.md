# BookSwap — Observability Plan

## Setup

- **Logs: Azure Monitor Logs**
  - Schema: Every log entry is structured JSON with fields: `timestamp`, `traceId`, `level` (INFO/WARN/ERROR), `service`, `operationId`, `userId` (hashed — never raw), `bookId`, `loanId`, `statusCode`, `durationMs`, `event`, `error` (sanitised message only).
  - Retention: 30 days hot tier (interactive query), 365 days cold archive.
  - Redaction rules: `userId` is SHA-256 hashed before writing. `displayName` is dropped entirely. Request/response bodies are never logged in full — only field names that fail validation are recorded, not their values. IP addresses are anonymised to `/24` prefix.

- **Metrics: Azure Application Insights**
  - Request metrics: HTTP request count, success rate, and duration collected automatically by the App Insights SDK for every endpoint.
  - Dependency metrics: Latency and failure rate for outbound calls to the SQL database, Redis cache, Azure Blob Storage, and Service Bus — all tracked as dependency telemetry.
  - Custom metrics: `search.latency.p95`, `listing.creation.success_rate`, `photo.db.blob_writes` (must stay 0), `notification.delivery.success_rate`, `privacy.pii_field_exposure` (must stay 0), `servicebus.email_queue.depth`.

- **Traces: Application Insights distributed tracing**
  - Sample rate: 100% for any span with an error or duration > 500 ms. 10% head-based sampling for healthy fast requests to keep ingestion costs low.
  - W3C `traceparent` headers are propagated across all service hops so a single `traceId` links the API gateway → backend → database → blob storage into one end-to-end trace.

---

## Signal table

| # | Signal type | Source | What it answers | Sample query / metric name |
|---|-------------|--------|-----------------|---------------------------|
| 1 | Metric | Application Insights | Search latency p95 — is SLO-1 (≥ 95% of searches ≤ 300 ms) being met? | `requests \| where name == "GET /books" \| summarize percentile(duration, 95) by bin(timestamp, 1m)` |
| 2 | Metric | Application Insights | Listing creation success rate — is SLO-2 (≥ 99.9%) holding even when the email worker is down? | `requests \| where name == "POST /books" \| summarize success_rate = 100.0 * countif(resultCode == "201") / count() by bin(timestamp, 5m)` |
| 3 | Log | Application Insights traces | Auth failures with hashed member ID — detect spikes, brute-force, per-operation patterns | `traces \| where customDimensions.event == "auth.failed" \| summarize count() by customDimensions.operationId, bin(timestamp, 5m)` |
| 4 | Trace | Application Insights | Slow request breakdown across DB and Redis — which dependency is the bottleneck for search? | `dependencies \| where operation_Name == "GET /books" and duration > 300 \| project timestamp, type, target, duration, operation_Id` |
| 5 | Metric | Service Bus | Email digest queue depth — leading indicator that the async email worker is falling behind | `AzureMetrics \| where ResourceProvider == "MICROSOFT.SERVICEBUS" and MetricName == "ActiveMessages" \| summarize avg(Total) by bin(TimeGenerated, 5m)` |
| 6 | Metric | Application Insights (custom) | Blob writes that hit the relational DB — must always be 0 (SLO-3 data governance check) | `customMetrics \| where name == "photo.db.blob_writes" \| summarize sum(value) by bin(timestamp, 1m)` |
| 7 | Log | Application Insights traces | PII exposure detected in API response — SLO-5 zero-tolerance privacy enforcement | `traces \| where customDimensions.event == "dlp.pii_exposure_detected" \| project timestamp, customDimensions.endpoint, customDimensions.field_type` |
| 8 | Trace | Application Insights | In-app notification delivery latency — time from pub/sub publish to WebSocket ACK (SLO-4) | `dependencies \| where name == "websocket.deliver" \| summarize percentile(duration, 99) by bin(timestamp, 1m)` |

---

## Results Summary

| Metric | Target | Achieved |
|--------|--------|----------|
| SLOs covered by an alert | 100% | ✅ 5/5 (SLO-1 through SLO-5 each have a dedicated alert below) |
| Alerts with a clear runbook link | 100% | ✅ All 7 alerts include a runbook link |
| Dashboards for ops | 1 health, 1 business | ✅ Both defined in the alert proposal notes below |

---

## Alert Proposal

| Alert | Condition | Severity | Notification | Runbook |
|-------|-----------|----------|--------------|---------|
| Search SLO burn (SLO-1) | `search.latency.p95 > 300 ms` for 5 min, or error budget burning at > 5× normal rate | Sev2 | Pager + Teams `#bookswap-oncall` | `reliability/runbook.md#search` |
| Listing creation failure (SLO-2) | `listing.creation.success_rate < 99.9%` over any 5-min window | Sev1 | Pager + Teams `#bookswap-oncall` | `reliability/runbook.md#listing-creation` |
| Photo routed to DB (SLO-3) | `photo.db.blob_writes > 0` in any 1-min window | Sev1 | Pager + email to Lead Engineer | `reliability/runbook.md#photo-pipeline` |
| Notification delivery degraded (SLO-4) | `notification.delivery.success_rate < 99%` over 10-min window | Sev2 | Pager + Teams `#bookswap-oncall` | `reliability/runbook.md#notifications` |
| PII field exposed in response (SLO-5) | `privacy.pii_field_exposure > 0` — any single DLP scanner hit | Sev1 | Pager + email to CISO + PM | `reliability/runbook.md#pii-breach` |
| Auth failure spike | `auth.failure.count > 50/min` on any single endpoint for 3 consecutive minutes | Sev2 | Pager + Teams `#bookswap-security` | `reliability/runbook.md#auth-failures` |
| Email queue backed up | `servicebus.email_queue.depth > 500` for 15 min | Sev3 | Teams `#bookswap-oncall` only (no page) | `reliability/runbook.md#email-queue` |

**Ops health dashboard** — live panels for: search p95 latency, listing success rate, notification delivery rate, error budget burn per SLO, auth failure count, email queue depth.

**Business dashboard** — daily review panels for: books listed vs. last week, loan funnel (Requested → Active → Returned), PII exposure rolling 30-day count (always 0), error budget RAG status per SLO.

---

## What We Are Deliberately NOT Alerting On

1. **Individual slow requests (single outliers above 300 ms).** SLO-1 allows 5% of requests to exceed 300 ms by design. One slow request is normal tail latency, not an incident. We alert only when the p95 burn rate breaches the threshold, not on point anomalies.
2. **404 Not Found responses.** Expected when a client references a `bookId` or `loanId` that no longer exists. A 404 spike shows up on the health dashboard for debugging but never triggers a page because no SLO is tied to it.
3. **Email digest delivery failures.** NFR-4 explicitly marks email as best-effort. Individual bounced emails (full inbox, bad address) are reviewed weekly on the business dashboard — they must never wake anyone up at night.
4. **Redis cache misses below 30%.** A cache miss is not an error — the request falls through to the DB and returns a correct response. We only care if the miss rate causes the p95 latency SLO (A-01) to start burning.
5. **Successful requests under 100 ms.** Healthy fast traffic is sampled at 10% and stored for debugging. Alerting on green signals is pure noise and trains engineers to ignore alerts.
6. **Service Bus dead-letter queue for individual failed emails.** Low-volume dead-letters are expected and reviewed on a weekly schedule. A single dead-lettered message is not actionable in real time and must not generate a notification.
