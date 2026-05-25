# BookSwap — Observability Plan

**API version:** 1.0.0
**Author:** Damian — Day 3 Observability Assessment
**SLO reference:** `damian-day3-slo-map.md`
**Date:** 25 May 2026

---

## Setup

### Logs — Azure Monitor Logs

**Schema (all structured JSON, written via the Application Insights SDK)**

Every log entry emitted by the BookSwap backend includes the following fields:

```json
{
  "timestamp":     "<ISO-8601 UTC>",
  "traceId":       "<W3C trace-id>",
  "spanId":        "<W3C span-id>",
  "level":         "INFO | WARN | ERROR",
  "service":       "bookswap-api | bookswap-worker | bookswap-upload-proxy",
  "operationId":   "<operationName from OpenAPI>",
  "userId":        "<SHA-256 hash of Entra sub claim — never raw>",
  "bookId":        "<uuid | null>",
  "loanId":        "<uuid | null>",
  "statusCode":    "<HTTP status int>",
  "durationMs":    "<int>",
  "event":         "<auth.failed | loan.requested | listing.created | …>",
  "error":         "<sanitised message — no stack traces in production>"
}
```

**Retention:** Hot tier (interactive query) — 30 days. Cold tier (archive) — 365 days. Aligned to a 30-day SLO-5 privacy window.

**Redaction rules (PII — enforced before any log is emitted):**

| Field | Rule |
|-------|------|
| `userId` | Always SHA-256 hashed. The raw Entra `sub` claim is **never** written to any log stream. |
| `displayName` | **Dropped entirely** from all log payloads. Never written. |
| `borrower.id` | Hashed with the same key as `userId` so cross-log correlation works without exposing UUIDs linked to real identities. |
| `photoUrl` | Truncated to storage-account hostname only (e.g., `bookswap.blob.core.windows.net/…` → `bookswap.blob.core.windows.net`). Full blob paths are not logged. |
| Request/response bodies | **Never logged in full.** Only field names that fail validation are logged (values are dropped). The `sl-violations` header is suppressed at the Azure API Management layer before reaching the backend log pipeline. |
| IP addresses | Anonymised to `/24` subnet prefix (last octet zeroed) before writing to Log Analytics. |

---

### Metrics — Azure Application Insights

Custom metrics are emitted via `TelemetryClient.trackMetric()` in addition to the automatic request/dependency telemetry collected by the Application Insights SDK.

| # | Metric name | Unit | Description | SLO |
|---|-------------|------|-------------|-----|
| M-01 | `search.latency.p95` | ms | 95th-percentile duration of `GET /books` requests | SLO-1 |
| M-02 | `search.request.count` | count/min | Total valid catalogue search requests per minute | SLO-1 |
| M-03 | `listing.creation.success_rate` | % | `201` responses ÷ total `POST /books` attempts × 100 | SLO-2 |
| M-04 | `listing.creation.email_decoupled` | bool/event | Fires `1` when listing succeeds while email worker is marked degraded — confirms async decoupling works | SLO-2 |
| M-05 | `photo.upload.success_rate` | % | Successful Azure Blob Storage writes ÷ valid upload attempts × 100 | SLO-3 |
| M-06 | `photo.db.blob_writes` | count | Number of blob payloads that reached the relational DB (must stay 0) | SLO-3 |
| M-07 | `notification.delivery.latency_p99` | ms | Time from pub/sub publish timestamp to WebSocket delivery confirmation | SLO-4 |
| M-08 | `notification.delivery.success_rate` | % | Delivered within 2 s ÷ total notifications triggered × 100 | SLO-4 |
| M-09 | `privacy.pii_field_exposure` | count | DLP scanner hits on address/phone fields in API responses (must stay 0) | SLO-5 |
| M-10 | `servicebus.email_queue.depth` | count | Pending messages in the email digest Service Bus queue | NFR-4 |
| M-11 | `auth.failure.count` | count/min | 401 responses per minute, grouped by `operationId` | Authn |
| M-12 | `loan.update.forbidden_rate` | % | 403 responses on `PATCH /loans/{loanId}` ÷ total PATCH attempts | Authz/BOLA |

---

### Traces — Application Insights Distributed Tracing

**Sample rate:** 100% for error spans and all spans with `durationMs > 500`; 10% head-based sampling for healthy fast requests. This keeps ingestion cost low while guaranteeing full fidelity on slow or broken requests.

Every trace propagates W3C `traceparent` headers across the following service hops:

| # | Span name | Instruments | What it answers | SLO |
|---|-----------|-------------|-----------------|-----|
| TR-01 | `bookswap.search` → `db.query` | `GET /books` handler + SQL dependency | Which DB query accounts for search latency; index hit vs. scan | SLO-1 |
| TR-02 | `bookswap.search` → `redis.cache` | Cache lookup before DB | Cache hit ratio; is Redis reducing DB load? | SLO-1 |
| TR-03 | `bookswap.listing.create` → `servicebus.publish` | `POST /books` → async email enqueue | Does the listing succeed independently of the email worker span? | SLO-2 |
| TR-04 | `bookswap.listing.create` → `db.insert` | Book insert latency | DB write time isolated from total request time | SLO-2 |
| TR-05 | `bookswap.photo.upload` → `blob.write` | Upload proxy → Azure Blob Storage | End-to-end upload latency; confirms blob write path never touches the relational DB | SLO-3 |
| TR-06 | `bookswap.notification.dispatch` → `websocket.deliver` | Pub/sub broker → client push | Full delivery latency from event fire to WebSocket ACK | SLO-4 |
| TR-07 | `bookswap.loan.patch` → `authz.ownership_check` | PATCH handler BOLA guard | Confirms ownership check executes on every request; latency of the check itself | Authz |
| TR-08 | `bookswap.*.error` (all operations) | Global error handler | Exception type, sanitised message, operation name — no PII in span attributes | All |

---

## Signal Inventory (fulfilling required table)

| # | Signal type | Source | What it answers | Sample query / metric name |
|---|-------------|--------|-----------------|---------------------------|
| 1 | Metric | Application Insights | Search latency p95 — is SLO-1 (≥ 95% of searches ≤ 300 ms) being met? | `requests \| where name == "GET /books" \| summarize percentile(duration, 95) by bin(timestamp, 1m)` |
| 2 | Metric | Application Insights | Listing creation success rate — is SLO-2 (≥ 99.9%) being met even during email worker degradation? | `requests \| where name == "POST /books" \| summarize success_rate = 100.0 * countif(resultCode == "201") / count() by bin(timestamp, 5m)` |
| 3 | Log | Application Insights traces | Auth failures with hashed member ID — spike detection, brute-force, per-operation failure patterns | `traces \| where customDimensions.event == "auth.failed" \| summarize count() by customDimensions.operationId, bin(timestamp, 5m)` |
| 4 | Trace | Application Insights | Slow request breakdown across DB and Redis — isolates which dependency is the bottleneck for search latency | `dependencies \| where operation_Name == "GET /books" and duration > 300 \| project timestamp, type, target, duration, operation_Id` |
| 5 | Metric | Service Bus (Azure Monitor) | Email digest queue depth — leading indicator that the async email worker is falling behind | `AzureMetrics \| where ResourceProvider == "MICROSOFT.SERVICEBUS" and MetricName == "ActiveMessages" \| summarize avg(Total) by bin(TimeGenerated, 5m)` |
| 6 | Metric | Application Insights (custom) | Blob writes that reached the relational DB — must be 0 at all times (SLO-3 compliance check) | `customMetrics \| where name == "photo.db.blob_writes" \| summarize sum(value) by bin(timestamp, 1m)` |
| 7 | Log | Application Insights traces | DLP scanner hits on address/phone fields in API responses — SLO-5 zero-tolerance privacy enforcement | `traces \| where customDimensions.event == "dlp.pii_exposure_detected" \| project timestamp, customDimensions.endpoint, customDimensions.field_type` |
| 8 | Trace | Application Insights | Notification delivery latency — time from pub/sub publish to WebSocket ACK, for SLO-4 (≥ 99% within 2 s) | `dependencies \| where name == "websocket.deliver" \| summarize percentile(duration, 99) by bin(timestamp, 1m)` |
| 9 | Log | Application Insights traces | BOLA / forbidden access attempts — 403 rate on `PATCH /loans/{loanId}` ownership check | `traces \| where customDimensions.event == "authz.ownership_check_failed" \| summarize count() by customDimensions.userId_hash, bin(timestamp, 10m)` |
| 10 | Metric | Application Insights | In-app notification delivery success rate — proportion delivered within 2 s (SLO-4) | `customMetrics \| where name == "notification.delivery.success_rate" \| summarize avg(value) by bin(timestamp, 5m)` |

---

## Results Summary

| Metric | Target | Achieved |
|--------|--------|----------|
| SLOs covered by at least one alert | 100% (5/5) | ✅ 5/5 |
| Alerts with a clear runbook link | 100% | ✅ All 8 alerts include runbook link |
| Dashboards defined | 1 health + 1 business | ✅ Both defined below |
| PII redaction rules documented | Yes | ✅ 6 field rules, all enforced pre-log |
| "Not alerting on" list populated | ≥ 2 items | ✅ 6 items with rationale |

---

## Alert Proposal

All alerts fire into **Azure Monitor Alert Rules** and route via **Action Groups** to the appropriate channel.

| # | Alert name | Condition (KQL / threshold) | Severity | Notification channel | SLO protected | Runbook |
|---|------------|-----------------------------|----------|----------------------|---------------|---------|
| A-01 | **Search SLO burn rate** | `search.latency.p95 > 300 ms` sustained for 5 min **OR** error-budget burn rate > 5× (fast-burn: 2% budget in 1 h) | Sev2 | PagerDuty + Teams `#bookswap-oncall` | SLO-1 | `reliability/runbooks.md#search-latency` |
| A-02 | **Listing creation failure spike** | `listing.creation.success_rate < 99.9%` over any 5-min window | Sev1 | PagerDuty (immediate page) + Teams `#bookswap-oncall` | SLO-2 | `reliability/runbooks.md#listing-creation` |
| A-03 | **Photo blob write to DB** | `photo.db.blob_writes > 0` in any 1-min window (single event sufficient) | Sev1 | PagerDuty + email to Lead Engineer + CISO | SLO-3 | `reliability/runbooks.md#photo-pipeline` |
| A-04 | **Notification delivery degraded** | `notification.delivery.success_rate < 99.0%` over 10-min window | Sev2 | Teams `#bookswap-oncall` + PagerDuty if sustained > 30 min | SLO-4 | `reliability/runbooks.md#notifications` |
| A-05 | **PII exposure detected** | `privacy.pii_field_exposure > 0` (any single DLP scanner hit) | Sev1 (Critical) | PagerDuty (immediate) + email to CISO + PM + Lead Engineer; endpoint auto-suspended via runbook webhook | SLO-5 | `reliability/runbooks.md#pii-breach` |
| A-06 | **Auth failure spike** | `auth.failure.count > 50/min` on any single `operationId` for 3 consecutive minutes | Sev2 | Teams `#bookswap-security` + PagerDuty | Authn | `reliability/runbooks.md#auth-failures` |
| A-07 | **BOLA attempt spike** | `loan.update.forbidden_rate > 5%` over 10-min window (ownership check failures) | Sev2 | Teams `#bookswap-security` + PagerDuty | Authz | `reliability/runbooks.md#bola-detection` |
| A-08 | **Email queue depth high** | `servicebus.email_queue.depth > 500 messages` for 15 min | Sev3 | Teams `#bookswap-oncall` (no page — business hours only) | NFR-4 | `reliability/runbooks.md#email-queue` |

### Alert Severity Key

| Severity | Meaning | Response |
|----------|---------|----------|
| Sev1 | Service is broken or data is leaking | Immediate page, 24/7, 15-min response SLA |
| Sev2 | SLO is actively burning | Page during business hours; on-call overnight |
| Sev3 | Leading indicator / informational | Teams message only; next business day |

---

## Dashboards

### Dashboard 1 — Operational Health

Purpose: Real-time view for the on-call engineer.

**Panels:**
1. Search p95 latency (line chart, 1-min bins) — threshold line at 300 ms
2. Listing creation success rate (% gauge, 5-min rolling) — threshold at 99.9%
3. In-app notification delivery rate (% gauge, 5-min rolling) — threshold at 99%
4. Active error budget remaining per SLO (burn-down bars, 28-day window)
5. Auth failure count by operationId (bar chart, 5-min bins)
6. Email Service Bus queue depth (area chart, 5-min bins)
7. Current active alerts panel (live feed from Azure Monitor)

### Dashboard 2 — Business & Privacy Health

Purpose: Daily review by PM and CISO.

**Panels:**
1. Books listed this week vs. last week (count trend)
2. Loans requested and completed (funnel: Requested → Active → Returned)
3. Photo uploads — success rate and average size (last 7 days)
4. PII exposure events — rolling 30-day count (should always show 0)
5. DLP scanner query coverage — % of API responses scanned
6. Error budget status per SLO (traffic-light RAG status)
7. BOLA / forbidden-access attempt trend (last 7 days)

---

## What We Are Deliberately NOT Alerting On

These signals are collected and visible on dashboards but do not generate pages or notifications. Alerting on them would create noise, cause alert fatigue, and dilute the response to real incidents.

1. **Individual slow requests (single outliers above 300 ms).** A single request over threshold is not a SLO breach — SLO-1 allows 5% of requests to exceed 300 ms by design. Alerting on individual slow requests would fire constantly on normal tail-latency variance. We alert only on the p95 burn rate, not on point anomalies.

2. **404 Not Found responses.** These are expected when clients probe for books or loans that do not exist (e.g., a bookId that was just deleted). A spike in 404s is visible on the health dashboard but does not indicate a service failure. We track them as a metric for debugging, not as an alert condition.

3. **Email digest delivery latency / failures.** NFR-4 explicitly marks email as best-effort. SLO-4 protects only in-app notifications. Email queue depth (A-08) is a Sev3 Teams message, not a page, and email delivery failures are never a wake-up call.

4. **Informational Application Insights traces for successful fast requests.** Requests completing in under 100 ms with a 2xx status code are sampled at 10% and logged but never trigger any alert. Alerting on healthy traffic is a form of toil with no reliability benefit.

5. **Redis cache misses below a 30% miss rate.** Cache misses are normal during cache warm-up, after a deployment, or for novel search queries. We track the miss rate as a leading indicator for search latency, but a miss itself is not an error — the request falls through to the DB and still returns a correct response. We only alert if the miss rate causes the p95 latency SLO to burn.

6. **Service Bus dead-letter queue depth for individual failed email messages.** Individual email delivery failures (a neighbour's inbox is full, the email address bounced) are expected at low volume. We monitor the total dead-letter count on the business dashboard and review it weekly, but a single dead-lettered message is not actionable in real time and must not page anyone.

---

*End of observability plan.*
