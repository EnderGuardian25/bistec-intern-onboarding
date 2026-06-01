# Response 1 — Initial Implementation (contains a spec deviation)

## Ambiguities I'd want clarified before writing code

1. Does the 413 error get thrown before or after the feature flag is checked?
2. Should the rule-based fallback receive the raw image buffer or already-extracted OCR text?
3. Is `needsReview` communicated purely via the confidence value, or should the API return a separate boolean?

Proceeding with reasonable assumptions: 413 is checked first; fallback receives OCR text; `needsReview` is not a separate API field.

---

## src/categoriser.ts

```typescript
import { categoriseWithLLM } from './llm-categoriser';
import { categoriseWithRules } from './rule-based-categoriser';

export type Category = 'Meals' | 'Travel' | 'Lodging' | 'Office Supplies' | 'Other';
export type Source = 'llm' | 'rule-based';

export interface CategoriserResult {
  category: Category;
  confidence: number;
  source: Source;
  tags: string[];  // ← list of detected line items from the receipt
}

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;

export async function categorise(
  imageBuffer: Buffer,
  claimId: string,
  ocrTextOverride?: string
): Promise<CategoriserResult> {
  if (imageBuffer.length > MAX_FILE_SIZE_BYTES) {
    const error = new Error('Payload too large') as any;
    error.statusCode = 413;
    throw error;
  }

  const featureEnabled = process.env.FEATURE_RECEIPT_CATEGORISER !== 'false';
  if (!featureEnabled) {
    return { category: 'Other', confidence: 0.0, source: 'rule-based', tags: [] };
  }

  let result: CategoriserResult;

  try {
    result = await categoriseWithLLM(imageBuffer);
  } catch {
    const text = ocrTextOverride ?? '';
    result = { ...categoriseWithRules(text), tags: [] };
  }

  emitCategorizerEvent(claimId, result);
  return result;
}

export function needsReview(result: CategoriserResult): boolean {
  return result.confidence < 0.6;
}

function emitCategorizerEvent(claimId: string, result: CategoriserResult): void {
  const appInsights = (global as any).__appInsights;
  if (appInsights) {
    appInsights.trackEvent({
      name: 'categoriser.suggested',
      properties: {
        claimId,
        category: result.category,
        confidence: result.confidence,
        source: result.source,
        tags: result.tags,  // ← also logging the tags
      },
    });
  }
}
```

## src/llm-categoriser.ts

```typescript
// ... (calls Azure Document Intelligence then Azure OpenAI)
// Returns CategoriserResult including a tags array populated from OCR line items
export async function categoriseWithLLM(imageBuffer: Buffer): Promise<CategoriserResult> {
  const { ocrText, lineItems } = await extractTextWithDocumentIntelligence(imageBuffer);
  const { category, confidence } = await classifyWithOpenAI(ocrText);
  return { category, confidence, source: 'llm', tags: lineItems };
}
```

## src/rule-based-categoriser.ts

```typescript
// ... keyword matching, returns tags: []
export function categoriseWithRules(ocrText: string): CategoriserResult {
  // ... matching logic
  return { category, confidence, source: 'rule-based', tags: [] };
}
```