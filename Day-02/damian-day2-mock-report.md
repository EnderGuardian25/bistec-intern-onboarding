# BookSwap — Mock Smoke Test Report

## Setup
* **Prism Command Used:** `npx @stoplight/prism-cli mock openapi.yaml -p 4010`
* **Testing Client:** Bruno Collection

## Results Summary

| Metric | Target | Achieved | Status |
| :--- | :--- | :--- | :--- |
| **Tests Run** | 5 | 5 | PASS |
| **Tests Passing Against the Mock** | 5 | 5 | PASS |
| **Endpoints with Explicit Error Responses** | 4+ | 4 | PASS |

### Test Matrix Breakdown
1. `GET /books` — **200 OK** (Successfully returned mock structural paginated collection envelope).
2. `POST /books` — **201 Created** (Successfully generated mock book payload ID).
3. `POST /books (Invalid Payload)` — **400 Bad Request** (Prism correctly blocked missing required fields).
4. `POST /books/{id}/loans` — **202 Accepted** (Confirmed receipt of async process payload tracker).
5. `PATCH /loans/{id}` — **200 OK** (Successfully simulated state transition to 'Active').

---

## Findings

### What did the mock reveal that the OpenAPI document on its own did not?
* **Regex Strictness:** The ISBN pattern regex (`'^(97(8|9))?\d{9}(\d|X)$'`) is incredibly sensitive to input spacing and dashes. Mocking revealed that standard hyphenated ISBN inputs from real-world book lookups fail validation instantly unless stripped down to raw alphanumeric strings before being transmitted to the API layer.
* **Array Wrapping Complexity:** In the `GET /books` collection endpoint, combining the base envelope schema with the inner array fields using `allOf` requires strict key configuration patterns. The mock server effectively illustrated exactly how the nested arrays would render over wire transmission to frontend developers.

### Which endpoints feel awkward to call?
* **`PATCH /loans/{loanId}`**
  The update endpoint accepts a global schema enum (`LoanStatus`). During mocking, it felt architecturally awkward that a user can accidentally pass status changes like `Overdue` or `Requested` in a client request payload. In production business logic, `Overdue` must be driven automatically by database cron triggers, and `Requested` is an immutable default state. The input schema feels too loose for client-facing patch requests.

---

## Spec Changes You Would Make

1. **Refactor the `PATCH /loans/{loanId}` Payload Schema**
   Isolate client-allowable input states by replacing the generic `$ref: '#/components/schemas/LoanStatus'` in the request body with a restricted inline enum containing only `[Active, Declined, Returned]`. This prevents clients from manually trying to flag items as overdue.

2. **Sanitize or Standardize the ISBN Input Schema**
   Modify the pattern regex or add a data format description in the spec clarifying that the API expects stripped, un-hyphenated 10 or 13-digit strings, minimizing configuration friction on client-side book scanner inputs.