# Receipt Categoriser

A feature of the GreenChit Claims API that suggests an expense category from an uploaded receipt image.

## How to run the tests

```bash
npm install
npx jest tests/acceptance.test.ts
```

Tests use mocks — no Azure connection required.

---

## AI Implementation Review

| # | What I asked the AI | What it produced | Did it match the spec? | Fix applied |
|---|---|---|---|---|
| 1 | First implementation pass — paste full spec and AC, ask for categoriser, LLM, and rule-based files | Working implementation, but added a `tags` field (list of detected line items) to `CategoriserResult` and the App Insights event — not in the spec contract | No — `tags` is an invented field outside the defined output shape | Prompted to remove `tags` from all types, return values, and event payload |
| 2 | Remove `tags`, confirm output matches spec exactly, fix rule-based to return `confidence: 0.0` on empty OCR text | Corrected implementation with exact spec output shape; empty OCR guard added to rule-based-categoriser | Yes — all 6 AC confirmed against final code | None needed |
