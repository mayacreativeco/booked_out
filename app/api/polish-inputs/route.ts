import { NextRequest } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  let body: { fields: Record<string, string> };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: 'Bad request' }, { status: 400 });
  }

  const { fields } = body;

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    // No key configured — return inputs unchanged (graceful degradation)
    return Response.json({ fields });
  }

  const fieldLines = Object.entries(fields)
    .filter(([, v]) => v && v.trim())
    .map(([k, v]) => `${k}: "${v}"`)
    .join('\n');

  if (!fieldLines) {
    return Response.json({ fields });
  }

  const prompt = `These short phrases will be embedded directly into social media video scripts and hooks. Fix ONLY grammar errors, verb conjugation, articles, and phrasing that doesn't make sense. Do not add new information, do not change meaning, do not expand or elaborate. Make minimal corrections so each phrase reads naturally when spoken aloud.

Examples of the kind of fixes needed:
- "I loving apples" → "I love apples"
- "skin become brighter" → "skin becoming brighter"
- "woman in 30s hormonal acne" → "women in their 30s with hormonal acne"
- "serum good for skin" → "a serum that's good for your skin"
- "acne wont clear no matter what" → "acne that won't clear no matter what"
- "feeling tire all time" → "feeling tired all the time"

If a phrase is already correct, return it unchanged.

Return a JSON object with the same keys and corrected values. Return ONLY valid JSON — no explanation, no markdown, no code blocks.

${fieldLines}`;

  try {
    const resp = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 512,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (!resp.ok) {
      return Response.json({ fields });
    }

    const data = await resp.json();
    const text: string = data.content?.[0]?.text ?? '';

    // Strip any accidental markdown code fences
    const stripped = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();

    let cleaned: Record<string, string>;
    try {
      cleaned = JSON.parse(stripped);
    } catch {
      // Claude returned something unparseable — use original inputs
      return Response.json({ fields });
    }

    // Merge: keep originals for any key Claude dropped
    const merged = { ...fields, ...cleaned };
    return Response.json({ fields: merged });

  } catch {
    // Network error or timeout — graceful degradation
    return Response.json({ fields });
  }
}
