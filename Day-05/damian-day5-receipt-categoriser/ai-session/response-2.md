# Response 2 — Corrected Implementation

Understood. `tags` has been removed from all types, return values, and the Application Insights event. The rule-based fallback now explicitly returns `confidence: 0.0` when the OCR text is empty.

---

## Changes made

### src/categoriser.ts
- Removed `tags` from `CategoriserResult` interface
- Removed `tags` from the feature-flag-disabled fallback return
- Removed `tags` from the `emitCategorizerEvent` properties

### src/llm-categoriser.ts
- `categoriseWithLLM` now returns only `{ category, confidence, source: 'llm' }` — no `tags`
- `extractTextWithDocumentIntelligence` still extracts OCR text internally but does not return `lineItems`

### src/rule-based-categoriser.ts
- Added guard: if `ocrText.trim() === ''`, return `{ category: 'Other', confidence: 0.0, source: 'rule-based' }` immediately (covers AC-04)

---

## Final output shape (matches spec exactly)

```typescript
export interface CategoriserResult {
  category: Category;   // 'Meals' | 'Travel' | 'Lodging' | 'Office Supplies' | 'Other'
  confidence: number;   // 0.0 – 1.0
  source: Source;       // 'llm' | 'rule-based'
}
```

No additional fields. The Application Insights event payload is:
```json
{
  "claimId": "<string>",
  "category": "<Category>",
  "confidence": "<number>",
  "source": "<Source>"
}
```

No PII, no card data, no line items.

---

## Confirmation against acceptance criteria

| AC | Status | Notes |
|----|--------|-------|
| AC-01 | ✅ | LLM returns Meals ≥ 0.7 |
| AC-02 | ✅ | confidence < 0.6 triggers needsReview() |
| AC-03 | ✅ | LLM 503 → rule-based, confidence ≤ 0.5 |
| AC-04 | ✅ | Empty OCR text → Other, confidence 0.0 |
| AC-05 | ✅ | > 10 MB → 413, no event emitted |
| AC-06 | ✅ | Event payload has no PII fields |
