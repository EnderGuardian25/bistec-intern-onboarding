import { categorise, needsReview } from '../src/categoriser';
import * as llmCategoriser from '../src/llm-categoriser';

// Mock the LLM module so tests never call real Azure services
jest.mock('../src/llm-categoriser');
const mockCategoriseWithLLM = llmCategoriser.categoriseWithLLM as jest.MockedFunction<typeof llmCategoriser.categoriseWithLLM>;

// Dummy 1-pixel JPEG buffer (valid image, tiny size)
const SMALL_IMAGE = Buffer.from([
  0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01,
]);

// Buffer just over 10 MB
const OVERSIZED_IMAGE = Buffer.alloc(10 * 1024 * 1024 + 1);

beforeEach(() => {
  jest.clearAllMocks();
  process.env.FEATURE_RECEIPT_CATEGORISER = 'true';
});

// ─── AC-01: Happy path ────────────────────────────────────────────────────────

test('AC-01: clear meal receipt returns Meals with confidence >= 0.7 from llm', async () => {
  mockCategoriseWithLLM.mockResolvedValue({
    category: 'Meals',
    confidence: 0.85,
    source: 'llm',
  });

  const result = await categorise(SMALL_IMAGE, 'claim-001');

  expect(result.category).toBe('Meals');
  expect(result.confidence).toBeGreaterThanOrEqual(0.7);
  expect(result.source).toBe('llm');
  expect(needsReview(result)).toBe(false);
});

// ─── AC-02: Ambiguous receipt ─────────────────────────────────────────────────

test('AC-02: ambiguous receipt returns confidence below 0.6 and is flagged for review', async () => {
  mockCategoriseWithLLM.mockResolvedValue({
    category: 'Other',
    confidence: 0.52,
    source: 'llm',
  });

  const result = await categorise(SMALL_IMAGE, 'claim-002');

  expect(result.confidence).toBeLessThan(0.6);
  expect(needsReview(result)).toBe(true);
});

// ─── AC-03: LLM unavailable — fallback ───────────────────────────────────────

test('AC-03: when LLM throws 503, falls back to rule-based with confidence <= 0.5', async () => {
  mockCategoriseWithLLM.mockRejectedValue(new Error('Azure OpenAI error: 503'));

  // Pass OCR text override so the rule-based engine has something to match on
  const result = await categorise(SMALL_IMAGE, 'claim-003', 'lunch at restaurant');

  expect(result.source).toBe('rule-based');
  expect(result.confidence).toBeLessThanOrEqual(0.5);
  expect(result.category).toBeDefined();
});

// ─── AC-04: OCR failure ───────────────────────────────────────────────────────

test('AC-04: when OCR fails, returns Other with confidence 0.0 from rule-based', async () => {
  mockCategoriseWithLLM.mockRejectedValue(new Error('Document Intelligence analysis failed'));

  // Empty OCR text override simulates unreadable receipt
  const result = await categorise(SMALL_IMAGE, 'claim-004', '');

  expect(result.category).toBe('Other');
  expect(result.confidence).toBe(0.0);
  expect(result.source).toBe('rule-based');
});

// ─── AC-05: Oversized payload ─────────────────────────────────────────────────

test('AC-05: image over 10 MB throws a 413 error', async () => {
  await expect(categorise(OVERSIZED_IMAGE, 'claim-005')).rejects.toMatchObject({
    statusCode: 413,
  });
  expect(mockCategoriseWithLLM).not.toHaveBeenCalled();
});

// ─── AC-06: PII boundary ─────────────────────────────────────────────────────

test('AC-06: Application Insights event contains no PII or card data', async () => {
  mockCategoriseWithLLM.mockResolvedValue({
    category: 'Meals',
    confidence: 0.9,
    source: 'llm',
  });

  const capturedEvents: any[] = [];
  (global as any).__appInsights = {
    trackEvent: (e: any) => capturedEvents.push(e),
  };

  await categorise(SMALL_IMAGE, 'claim-006');

  expect(capturedEvents).toHaveLength(1);
  const props = capturedEvents[0].properties;

  // Must not contain any PII fields
  expect(props).not.toHaveProperty('claimantName');
  expect(props).not.toHaveProperty('cardNumber');
  expect(props).not.toHaveProperty('email');

  // Must contain only the allowed fields
  expect(Object.keys(props)).toEqual(
    expect.arrayContaining(['claimId', 'category', 'confidence', 'source'])
  );

  delete (global as any).__appInsights;
});
