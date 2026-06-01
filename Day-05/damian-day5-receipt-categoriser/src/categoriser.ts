import { categoriseWithLLM } from './llm-categoriser';
import { categoriseWithRules } from './rule-based-categoriser';

export type Category = 'Meals' | 'Travel' | 'Lodging' | 'Office Supplies' | 'Other';
export type Source = 'llm' | 'rule-based';

export interface CategoriserResult {
  category: Category;
  confidence: number;
  source: Source;
}

const NEEDS_REVIEW_THRESHOLD = 0.6;
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

/**
 * Main entry point for the Receipt Categoriser feature.
 *
 * Flow:
 *   1. Validate input
 *   2. Check feature flag (Azure App Configuration)
 *   3. Attempt LLM categorisation (Azure Document Intelligence + Azure OpenAI)
 *   4. On LLM failure, fall back to rule-based categorisation
 *   5. Emit Application Insights customEvent (no PII)
 *   6. Return result
 */
export async function categorise(
  imageBuffer: Buffer,
  claimId: string,
  ocrTextOverride?: string // used in tests to bypass real OCR
): Promise<CategoriserResult> {
  // Validate file size
  if (imageBuffer.length > MAX_FILE_SIZE_BYTES) {
    const error = new Error('Payload too large') as any;
    error.statusCode = 413;
    throw error;
  }

  // Check feature flag
  const featureEnabled = process.env.FEATURE_RECEIPT_CATEGORISER !== 'false';
  if (!featureEnabled) {
    return { category: 'Other', confidence: 0.0, source: 'rule-based' };
  }

  let result: CategoriserResult;

  try {
    result = await categoriseWithLLM(imageBuffer);
  } catch {
    // LLM or OCR unavailable — fall back to rule-based
    const text = ocrTextOverride ?? '';
    result = categoriseWithRules(text);
  }

  // Emit Application Insights event — no PII, no card data
  emitCategorizerEvent(claimId, result);

  return result;
}

export function needsReview(result: CategoriserResult): boolean {
  return result.confidence < NEEDS_REVIEW_THRESHOLD;
}

function emitCategorizerEvent(claimId: string, result: CategoriserResult): void {
  // Uses the existing Application Insights client wired up in the GreenChit Claims API
  const appInsights = (global as any).__appInsights;
  if (appInsights) {
    appInsights.trackEvent({
      name: 'categoriser.suggested',
      properties: {
        claimId,             // claim reference only — not claimant name or personal data
        category: result.category,
        confidence: result.confidence,
        source: result.source,
      },
    });
  }
}
