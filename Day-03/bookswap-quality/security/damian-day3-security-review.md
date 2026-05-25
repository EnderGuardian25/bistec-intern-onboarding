# BookSwap API – Security Review

**API version:** 1.0.0  
**OpenAPI spec:** `damian-day2-bookswap-openapi.yaml`  
**ZAP baseline scan:** `damian-day3-zap-baseline-report.html` (ZAP 2.17.0, run 25 May 2026)  
**Reviewer:** Damian – Day 3 Security Assessment  

---

## Minimum Findings Checklist

- [x] At least one Broken Object Level Authorization (BOLA) scenario described  
- [x] At least one PII leak via logs or telemetry identified  
- [x] At least one missing rate-limit on a sensitive endpoint  
- [x] OWASP ZAP baseline scan attached and a finding from it discussed  
- [x] `threats.csv` lists each finding with category, severity, and mitigation owner  

---

## Security Review Table

| # | Category | Question | Finding | Severity | Mitigation |
|---|----------|----------|---------|----------|------------|
| 1 | **Authn** | Is every non-public endpoint protected by JWT? | All 5 endpoints declare `bearerAuth` (Microsoft Entra External ID JWT) in the global `security` block. However, the spec does **not** define any truly public endpoint, so every route must enforce the token. The ZAP scan confirms the Prism mock returns `401` when no token is supplied — correct behaviour. The risk is that a future developer overrides the global security block with `security: []` at the operation level (a valid OpenAPI construct), silently removing protection. There is no automated gate (e.g., a CI lint rule) preventing this. | **Medium** | Add an `oas-security-defined` spectral rule to CI that fails the pipeline if any operation carries `security: []`. In Azure API Management, additionally configure a *validate-jwt* policy at the gateway product level as a defence-in-depth fallback independent of the spec. |
| 2 | **Authz** | Does every `/{id}`-shaped endpoint check object ownership? | **BOLA identified.** `PATCH /loans/{loanId}` accepts any authenticated user who knows a `loanId`. The spec defines that the status can be updated by *"owner or borrower"*, but there is no ownership check modelled in the API — the backend must enforce it. A concrete attack: user A borrows a book (loanId = `f47ac10b-58cc-4372-a567-0e02b2c3d479`). User B, authenticated with a valid JWT, sends `PATCH /loans/f47ac10b-58cc-4372-a567-0e02b2c3d479` with `{"status": "Returned"}`, falsely marking the loan as returned without ever holding the book. Similarly, `GET /books/{bookId}/loans/history` exposes the borrowing history of a book to any authenticated neighbour, leaking which users have borrowed which titles. | **High** | In the loan update handler, resolve the calling user's ID from the JWT sub claim and verify it matches either `loan.borrower.id` or `book.owner.id` before applying the status change. Return `403 Forbidden` (not `404`) on mismatch. For loan history, restrict the response to the book owner only, or redact the `borrower.displayName` / `borrower.id` fields for non-owners. Add an integration test that asserts user B cannot mutate user A's loan. |
| 3 | **Injection** | Are all DB queries parameterised? | The OpenAPI spec itself cannot guarantee parameterisation — that is a backend implementation concern. However, the `GET /books` endpoint accepts a free-text `q` parameter (title, author, or ISBN search) that, if concatenated directly into a SQL `LIKE` or `ILIKE` clause, is a classic SQL injection vector. The ISBN field has a regex pattern (`^(97(8|9))?\d{9}(\d|X)$`) enforced at the API layer, which limits one injection surface. The `q` parameter has no such constraint. | **Medium** | Enforce parameterised queries (prepared statements or ORM query builders) for all database interactions — never string-concatenate user input into SQL. Add an input-length cap on `q` (e.g., `maxLength: 200`) to the OpenAPI schema to reject oversized payloads at the gateway before they reach the DB. Run SAST (e.g., SonarQube with its injection rules) in CI against the backend codebase. |
| 4 | **Secrets** | Where are connection strings stored? | The spec references Azure Blob Storage URIs in `photoUrl` fields and implies a backend database. No secret management approach is declared in the spec or visible in the ZAP headers. The ZAP response headers from the Prism mock expose an `sl-violations` header that echoes back validation error details (field names, failed patterns) — a low-grade information disclosure that would also appear in production if a real API gateway forwards Prism-style error payloads. | **Medium** | Store all connection strings, storage account keys, and Entra client secrets in **Azure Key Vault**, accessed at runtime via a managed identity — never in environment variables committed to source control. Remove or suppress the `sl-violations` header from production responses; replace with a generic `400 Bad Request` body (`{"error": "Invalid request"}`). Enforce secret scanning in CI (e.g., `git-secrets` or GitHub Advanced Security). |
| 5 | **Transport** | Is TLS enforced at Front Door? | **ZAP finding: HTTP Only Site (Medium, CWE-311).** ZAP detected that `http://localhost:4010` serves the API over plain HTTP. When ZAP attempted to upgrade to HTTPS (`https://localhost:4010/books/bookId/loans`), the connection failed — meaning TLS was not running on the mock at all. In production this maps to: if Azure Front Door is not configured to redirect HTTP→HTTPS and enforce a minimum TLS version, JWTs and book photo URLs travel in cleartext. The ZAP alert references OWASP 2025 A04 Cryptographic Failures (CWE-311). | **High** | In Azure Front Door, set the routing rule to **HTTPS redirect** (HTTP → 301 → HTTPS) and configure the origin to accept HTTPS only. Set `minimumTlsVersion: TLS12` on the Front Door endpoint. Add an HSTS header (`Strict-Transport-Security: max-age=63072000; includeSubDomains`) in the API response policy. Update the OpenAPI `servers` URL to `https://` before any production deployment. |
| 6 | **Rate limit** | Are auth and write endpoints rate-limited? | No rate-limiting is defined in the spec or visible in any response header in the ZAP scan. Three endpoints are sensitive: `POST /books/bookId/loans` (loan requests — a neighbour could spam borrow requests against every book), `POST /books` (book listing — bulk pollution of the catalog), and `PATCH /loans/{loanId}` (status churn). There is no `Retry-After` or `X-RateLimit-*` header in any ZAP response. | **High** | In Azure API Management, add a `rate-limit-by-key` policy scoped to the JWT `sub` claim: allow max **10 requests/minute** on `POST /books/{bookId}/loans` and **5 requests/minute** on `POST /books` per user. Return `429 Too Many Requests` with a `Retry-After` header on breach. For `PATCH /loans/{loanId}`, apply a **20 requests/minute** per-user limit. Document these limits in the OpenAPI spec using `x-ratelimit` extensions. |
| 7 | **PII** | What PII appears in responses, logs, or queues? | Two PII exposures identified. (a) **Response leak:** `UserPublic` (returned in `Loan.borrower`, `Book.owner`, and the `POST /books/{bookId}/loans` 202 response) exposes `id` (UUID) and `displayName` to any authenticated caller. The loan history endpoint (`GET /books/{bookId}/loans/history`) returns the full borrowing history including borrower display names — any neighbour who knows a `bookId` can enumerate who borrowed what book, when. (b) **Log/telemetry leak:** The ZAP scan shows the Prism mock echoes request body field values in the `sl-violations` response header (e.g., `isbn` and `photoUrl` values). If this header is forwarded to Application Insights or a logging pipeline, PII (display names, UUIDs linked to Entra identities) will appear in log streams accessible to ops staff without data-access controls. | **High** | (a) Restrict `GET /books/{bookId}/loans/history` to the book owner only (enforce in middleware, not just docs). For non-owners, return only aggregate counts, not individual borrower records. Consider removing `borrower.id` from public-facing responses and using an opaque reference instead. (b) Configure Application Insights with a telemetry processor that redacts or hashes `displayName` and `borrower.id` fields before ingestion. Remove `sl-violations` from production response headers. Apply Azure role-based access control (RBAC) so only the `Log Analytics Reader` role can query raw logs. |

---

## ZAP Baseline Scan – Discussion

The ZAP 2.17.0 baseline scan (run against the Prism mock at `http://localhost:4010` and `https://localhost:4010`) raised **2 medium-confidence, medium-risk alerts** across the two sites.

### Alert 1 – HTTP Only Site (Medium / CWE-311)

Triggered on `POST https://localhost:4010/books/bookId/loans`. ZAP confirmed the server does not respond on HTTPS — the connection was refused. This is a direct Cryptographic Failures finding (OWASP 2025 A04). In a production deployment where the Azure Front Door HTTPS redirect is absent or misconfigured, bearer tokens and book metadata would traverse the network in plaintext, making them trivially interceptable on any shared network (e.g., the apartment block's Wi-Fi). This finding directly reinforces the Transport row above and is rated **High** in the production context (ZAP rates it Medium against the mock, which has no real users or data).

### Alert 2 – Cross-Domain Misconfiguration / Overly Permissive CORS (Medium / CWE-264)

Triggered on `POST http://localhost:4010/books`. The Prism mock responded with:

```
Access-Control-Allow-Origin: *
Access-Control-Allow-Headers: *
Access-Control-Allow-Credentials: true
```

The combination of `Access-Control-Allow-Origin: *` with `Access-Control-Allow-Credentials: true` is a well-known CORS misconfiguration (browsers reject credentialed requests to wildcard origins per the CORS spec, but the header is still wrong and some non-browser clients do not enforce this). If this config is carried forward to production, a malicious website could attempt cross-origin requests to the BookSwap API using a victim neighbour's session. The fix is to set `Access-Control-Allow-Origin` to the exact production front-end origin (e.g., `https://bookswap.apartments.com`) and remove the wildcard. This should be configured in the Azure API Management CORS policy, not in the backend application code.

---

## BOLA Scenario – Concrete Example

**Endpoint:** `PATCH /loans/{loanId}`

**Preconditions:**
- User A (Alice, `sub: alice-uuid`) has a loan `loanId = f47ac10b-58cc-4372-a567-0e02b2c3d479` with status `Active`.
- User B (Bob, `sub: bob-uuid`) has a valid JWT but is neither the borrower nor the book owner for this loan.

**Attack request (Bob's token):**

```http
PATCH http://localhost:4010/loans/f47ac10b-58cc-4372-a567-0e02b2c3d479 HTTP/1.1
Authorization: Bearer <bob-valid-jwt>
Content-Type: application/json

{"status": "Returned"}
```

**Expected (secure) response:** `403 Forbidden`  
**Vulnerable response (no ownership check):** `200 OK` with the loan now marked `Returned`

**Impact:** Bob falsely closes Alice's loan, allowing Alice to borrow a second copy of the same book; the book owner never receives confirmation the book was returned; loan history is corrupted. In a broader scan, Bob could iterate UUIDs or obtain `loanId` values from the loan history endpoint and mass-close all active loans in the building.

---

*End of report.*
