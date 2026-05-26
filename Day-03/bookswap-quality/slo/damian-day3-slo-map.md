# BookSwap — SLI/SLO Map

## 1. NFR Inventory

An **NFR (Non-Functional Requirement)** describes *how well* the system should work (speed, reliability, security), rather than *what* it does.

| # | NFR (from Day 2) | User-visible behaviour |
|---|------------------|------------------------|
| **NFR-1** | Catalogue search response time: under 300 ms p95 for a building with up to 5,000 books | Users experience snappy, near-instantaneous search results when browsing available books within their local building. |
| **NFR-2** | Listing creation: must succeed even if the email service is down (do not block the user) | Users can list their books for swapping without experiencing hangs, errors, or delays, regardless of background email service outages. |
| **NFR-3** | Photo uploads: up to 5 MB JPEG/PNG; never stored in the application database | Users can seamlessly attach high-quality photos of their books, while system performance remains unburdened by heavy binary data storage in the main DB. |
| **NFR-4** | Notifications: in-app must arrive within 2 seconds; email digest is best-effort | Users receive immediate, real-time alerts within the app when someone requests a swap, while summarized email digests arrive non-urgently. |
| **NFR-5** | Privacy: addresses and phone numbers are never returned in API responses (members only) | Users trust that their highly sensitive personal contact information is secure and never leaked to unauthenticated users or standard public endpoints. |

## 2. SLI / SLO Table

**Quick definitions:**
- **SLI (Service Level Indicator)** — a specific measurement that tells you how the system is performing (e.g. "what % of searches responded in under 300 ms?").
- **SLO (Service Level Objective)** — the target you want that measurement to hit (e.g. "at least 95% of searches must be fast").
- **Error Budget** — the small amount of failure you're allowed before it becomes a problem. If the SLO target is 95%, the error budget is the remaining 5%.

| # | SLI definition | Measurement source | SLO target | Window | Error budget |
|---|----------------|---------------------|------------|--------|--------------|
| **SLO-1** | The proportion of valid catalogue search API requests (for buildings with ≤ 5,000 books) that return a response in ≤ 300 ms. | API Gateway / Application Performance Monitoring (APM) HTTP request logs. | ≥ 95.0% | Rolling 28 days | 5.0% of valid search requests can take > 300 ms or fail. |
| **SLO-2** | The proportion of book listing creation requests that return a `201 Created` success status code to the user. | Backend service application logs / API Gateway metrics. | ≥ 99.9% | Rolling 28 days | 0.1% of listing attempts can fail (ensures email service failures cause 0% user-facing impact). |
| **SLO-3** | The proportion of valid book photo upload requests (≤ 5 MB JPEG/PNG) that are successfully stored in Object Storage and return a `200/201` response without touching the primary relational DB. | Object Storage proxy logs / Database query audit logs (for zero-blob violations). | ≥ 99.99% | Rolling 28 days | 0.01% of upload operations can fail or improperly route data. |
| **SLO-4** | The proportion of generated in-app notifications that are successfully delivered to the user's active client interface within ≤ 2.0 seconds of the triggering event. | Pub/Sub message broker timestamp logs (Publish time to WebSocket delivery confirmation). | ≥ 99.0% | Rolling 28 days | 1.0% of in-app notifications can be delayed beyond 2 seconds or dropped. |
| **SLO-5** | The proportion of public/non-member API response payloads for user profiles/listings that contain exactly 0 instances of phone numbers or physical address fields. | API Gateway Data Loss Prevention (DLP) scanner logs / Automated API contract test suites. | 100.0% (Zero-Tolerance) | Rolling 30 days | 0.0% (Any single exposure constitutes a total budget breach requiring immediate remediation). |

## 3. Error Budget Policy

### What the team stops doing when the budget is exhausted

* **For Performance/Availability Breaches (SLO-1, SLO-2, SLO-4):** The engineering team halts all feature development and shifts 100% of capacity to stability, performance tuning, architectural decoupling (e.g., strengthening asynchronous message queues for listings/emails), and optimizing database indexes or search queries.
* **For Data Governance/Privacy Breaches (SLO-3, SLO-5):** Immediate emergency deployment procedures are activated. The specific vulnerable API endpoint or upload pipeline is taken offline or placed into a read-only maintenance mode. No new code deployments are permitted until an automated compliance sweep, schema patch, or payload scrubbing mechanism is verified in production.

### Who owns the decision

* The **Product Manager (PM)** and the **Lead Reliability/Software Engineer** jointly own the decision to freeze feature branches and execute the budget policy. The **Chief Information Security Officer (CISO)** or Designated Privacy Officer has unilateral authority to halt services in the event of an SLO-5 privacy breach.

## 4. Out of Budget Right Now
