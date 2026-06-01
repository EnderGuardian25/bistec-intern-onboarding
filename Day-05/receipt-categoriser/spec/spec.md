# Receipt Categoriser - Feature Spec

## 1. Why

Claimants currently pick an expense category manually when submitting a claim. This is error-prone and slows down approvals when the wrong category is chosen.

This feature reads the uploaded receipt and suggests the correct category automatically, reducing miscategorisation and speeding up the submission flow.

**Metric:** Reduction in claims returned by managers due to wrong category.

---

## 2. Scope

**In scope:**
- Suggest a category when a claimant uploads a receipt during claim submission
- Show the suggestion with a confidence score; claimant can accept or override
- Fall back to a rule-based suggestion if Azure OpenAI is unavailable

**Affects:** GreenChit Claims API (existing service from Day 4). No other containers are changed.

---

## 3. Contract

### Endpoint
`POST /claims/{id}/receipts/categorise`

### Inputs
- Receipt image (JPEG or PNG, max 10 MB)
- `claim_id` from the URL path
- JWT in the `Authorization` header (existing auth)

### Outputs
```json
{
  "category": "Meals | Travel | Lodging | Office Supplies | Other",
  "confidence": 0.0–1.0,
  "source": "llm | rule-based"
}
```
Confidence below 0.6 must be shown to the claimant as "Needs review".

### Errors
| Code | Meaning |
|------|---------|
| 400 | Missing or invalid input (wrong file type, no image) |
| 413 | File exceeds 10 MB |
| 502 | Azure Document Intelligence or Azure OpenAI unavailable and rule-based fallback also failed |

### Side Effects
- An Application Insights `customEvent` named `categoriser.suggested` is emitted for every request (successful or fallback). It must not contain PII or card numbers.
- The suggestion and whether the claimant accepted or overrode it is stored for future model evaluation.

---

## 4. Acceptance Criteria

See `acceptance.md`.

---

## 5. Examples

**Happy path — clear meal receipt**
- Input: JPEG of a restaurant bill, LKR 2,400
- Output: `{ "category": "Meals", "confidence": 0.85, "source": "llm" }`

**Ambiguous receipt — mixed items**
- Input: Receipt with both food and stationery items
- Output: `{ "category": "Other", "confidence": 0.52, "source": "llm" }` — shown as "Needs review"

**OCR failure**
- Input: Blurry or corrupt image that Document Intelligence cannot parse
- Output: `{ "category": "Other", "confidence": 0.0, "source": "rule-based" }` with a user-facing message: "We couldn't read your receipt. Please check the category and continue."

---

## 6. Out of Scope

- Uploading multiple receipts in a single categorise request (batch)
- Auto-submitting the claim without the claimant confirming the category
- Learning from claimant overrides in v1 (active learning deferred)
- Extracting or storing individual line items from the receipt
- Supporting file formats other than JPEG and PNG (e.g. PDF, HEIC)

---

## 7. Open Questions

- Should the 0.6 confidence threshold for "Needs review" be configurable per category, or is one global threshold enough?
- Should claimant override decisions be fed back to improve the model in a future version, and if so, who owns that pipeline?
