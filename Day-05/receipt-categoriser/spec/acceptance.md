# Receipt Categoriser — Acceptance Criteria

---

## AC-01 Happy path: clear meal receipt

**Given** a valid JPEG of a restaurant bill totalling LKR 2,400

**When** the claimant uploads it via `POST /claims/{id}/receipts/categorise`

**Then** the response is `200 OK` with:
```json
{ "category": "Meals", "confidence": >= 0.7, "source": "llm" }
```
**And** an Application Insights `customEvent` named `categoriser.suggested` is emitted within 5 seconds of the request

---

## AC-02 Ambiguous receipt

**Given** a receipt image containing both food items and stationery items

**When** the claimant uploads it via `POST /claims/{id}/receipts/categorise`

**Then** the response is `200 OK` with `confidence` below 0.6

**And** the UI displays the suggestion labelled as "Needs review"

---

## AC-03 LLM unavailable — fallback to rule-based

**Given** Azure OpenAI is returning `503`

**When** the claimant uploads any valid receipt image

**Then** the response is `200 OK` with:
```json
{ "source": "rule-based", "confidence": <= 0.5 }
```
**And** a category is still returned (not an error)

---

## AC-04 OCR failure

**Given** an image that Azure Document Intelligence cannot parse (e.g. corrupt or unreadable file)

**When** the claimant uploads it via `POST /claims/{id}/receipts/categorise`

**Then** the response is `200 OK` with:
```json
{ "category": "Other", "confidence": 0.0, "source": "rule-based" }
```
**And** the UI displays the message: "We couldn't read your receipt. Please check the category and continue."

---

## AC-05 Oversized payload

**Given** an image file larger than 10 MB

**When** the claimant uploads it via `POST /claims/{id}/receipts/categorise`

**Then** the response is `413 Payload Too Large`

**And** no Application Insights event is emitted for this request

---

## AC-06 PII boundary

**Given** a receipt image that contains a customer name and the last 4 digits of a credit card

**When** the request is processed and the `categoriser.suggested` Application Insights event is emitted

**Then** the event payload contains no customer name and no card digits

**And** the raw receipt image is not included in any outbound request that leaves the BISTEC Azure tenant
