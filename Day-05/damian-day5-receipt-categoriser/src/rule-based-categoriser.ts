import { Category, CategoriserResult } from './categoriser';

const KEYWORD_MAP: Record<Category, string[]> = {
  Meals: ['restaurant', 'food', 'meal', 'lunch', 'dinner', 'breakfast', 'cafe', 'coffee', 'beverage', 'bistro', 'hotel dining'],
  Travel: ['taxi', 'uber', 'pickup', 'fuel', 'petrol', 'flight', 'airline', 'bus', 'train', 'transport', 'toll', 'parking'],
  Lodging: ['hotel', 'accommodation', 'hostel', 'motel', 'room', 'inn', 'suites', 'resort'],
  'Office Supplies': ['stationery', 'pen', 'paper', 'printer', 'cartridge', 'desk', 'supplies', 'office', 'folder', 'binder'],
  Other: [],
};

/**
 * Fallback categoriser using keyword matching on OCR text.
 * Used when Azure OpenAI is unavailable.
 * Confidence is always <= 0.5 to signal it is a fallback (per AC-03).
 */
export function categoriseWithRules(ocrText: string): CategoriserResult {
  const lower = ocrText.toLowerCase();
  const scores: Record<Category, number> = {
    Meals: 0,
    Travel: 0,
    Lodging: 0,
    'Office Supplies': 0,
    Other: 0,
  };

  for (const [category, keywords] of Object.entries(KEYWORD_MAP) as [Category, string[]][]) {
    for (const kw of keywords) {
      if (lower.includes(kw)) {
        scores[category]++;
      }
    }
  }

  const topCategory = (Object.entries(scores) as [Category, number][])
    .sort((a, b) => b[1] - a[1])[0];

  const hasMatch = topCategory[1] > 0;

  return {
    category: hasMatch ? topCategory[0] : 'Other',
    confidence: hasMatch ? Math.min(0.5, topCategory[1] * 0.15) : 0.0,
    source: 'rule-based',
  };
}
