# Prompt 2 — Fix Spec Deviation + Confirm Final Implementation

The `tags` field you added to the output is not in the spec. The contract section defines exactly three fields: `category`, `confidence`, and `source`.

1. Remove `tags` from `CategoriserResult`, from all return values, and from the Application Insights event payload
2. Confirm the final implementation matches the spec output shape exactly
3. Make sure the rule-based fallback returns `confidence: 0.0` specifically when OCR text is empty (AC-04), not just a low score

No other changes, do not add new fields or behaviour.
