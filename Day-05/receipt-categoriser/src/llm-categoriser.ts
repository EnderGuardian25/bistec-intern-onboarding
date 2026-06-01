import { Category, CategoriserResult } from './categoriser';

const VALID_CATEGORIES: Category[] = ['Meals', 'Travel', 'Lodging', 'Office Supplies', 'Other'];

/**
 * Calls Azure Document Intelligence to extract text from the receipt image,
 * then calls Azure OpenAI (gpt-4.1) to suggest an expense category.
 *
 * Both services run inside the BISTEC Azure tenant — no data leaves the tenant.
 *
 * Throws if either service is unavailable (caller handles fallback).
 */
export async function categoriseWithLLM(imageBuffer: Buffer): Promise<CategoriserResult> {
  const ocrText = await extractTextWithDocumentIntelligence(imageBuffer);
  return await classifyWithOpenAI(ocrText);
}

async function extractTextWithDocumentIntelligence(imageBuffer: Buffer): Promise<string> {
  const endpoint = process.env.AZURE_DOC_INTELLIGENCE_ENDPOINT!;
  const key = process.env.AZURE_DOC_INTELLIGENCE_KEY!;

  const response = await fetch(`${endpoint}/documentintelligence/documentModels/prebuilt-receipt:analyze?api-version=2024-02-29-preview`, {
    method: 'POST',
    headers: {
      'Ocp-Apim-Subscription-Key': key,
      'Content-Type': 'application/octet-stream',
    },
    body: imageBuffer,
  });

  if (!response.ok) {
    throw new Error(`Document Intelligence error: ${response.status}`);
  }

  // Poll for the result
  const operationLocation = response.headers.get('Operation-Location')!;
  return await pollForResult(operationLocation, key);
}

async function pollForResult(operationUrl: string, key: string): Promise<string> {
  const maxAttempts = 10;
  for (let i = 0; i < maxAttempts; i++) {
    await new Promise(r => setTimeout(r, 1000));
    const res = await fetch(operationUrl, {
      headers: { 'Ocp-Apim-Subscription-Key': key },
    });
    const body = await res.json();
    if (body.status === 'succeeded') {
      return body.analyzeResult?.content ?? '';
    }
    if (body.status === 'failed') {
      throw new Error('Document Intelligence analysis failed');
    }
  }
  throw new Error('Document Intelligence timed out');
}

async function classifyWithOpenAI(ocrText: string): Promise<CategoriserResult> {
  const endpoint = process.env.AZURE_OPENAI_ENDPOINT!;
  const key = process.env.AZURE_OPENAI_KEY!;
  const deployment = process.env.AZURE_OPENAI_DEPLOYMENT ?? 'gpt-4.1';

  const prompt = `You are a finance assistant. Given the following receipt text, classify it into exactly one of these expense categories: Meals, Travel, Lodging, Office Supplies, Other.

Respond with a JSON object only — no explanation:
{ "category": "<one of the five categories>", "confidence": <float between 0.0 and 1.0> }

Receipt text:
${ocrText}`;

  const response = await fetch(`${endpoint}/openai/deployments/${deployment}/chat/completions?api-version=2024-02-01`, {
    method: 'POST',
    headers: {
      'api-key': key,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      messages: [{ role: 'user', content: prompt }],
      temperature: 0,
      max_tokens: 100,
    }),
  });

  if (!response.ok) {
    throw new Error(`Azure OpenAI error: ${response.status}`);
  }

  const body = await response.json();
  const content = body.choices[0].message.content as string;
  const parsed = JSON.parse(content);

  const category: Category = VALID_CATEGORIES.includes(parsed.category)
    ? parsed.category
    : 'Other';

  return {
    category,
    confidence: Math.min(1.0, Math.max(0.0, Number(parsed.confidence))),
    source: 'llm',
  };
}
