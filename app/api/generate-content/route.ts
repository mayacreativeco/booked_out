import { NextRequest } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const STYLE_GUIDES: Record<string, string> = {
  mid_thought: "starts mid-sentence like you're already deep in the thought. no intro or setup. drops the viewer into the middle of something real. feels like they caught the second half of a conversation.",
  quiet_confession: "soft, private, intimate. like sharing something you've been sitting on. lower energy, not performative. the viewer feels like they're being trusted with something.",
  right_person_address: "talks directly to a specific kind of person. opens with 'if you've ever...' or 'for anyone who...' or 'this is for the person who...'. the viewer should feel personally called out in a good way.",
  pattern_interrupt: "breaks what the viewer expects. contradicts a common belief or flips the frame immediately. starts with tension or a challenge or a correction.",
  rant_hot_take: "opinionated, a little messy, has an edge to it. not polished. has something to say and says it without apology. talking fast, a little frustrated.",
  lived_experience: "story-based and personal. roots itself in a specific moment or timeline. feels like evidence from someone's actual life, not a review.",
  tension_story: "builds tension before the payoff. something almost didn't work. something was almost given up on. there's a turning point the viewer has to stay to hear.",
};

const AGE_CONTEXT: Record<string, {
  label: string; tone: string; deliveryNote: string;
  killer: string[]; settingByMode: Record<string, string>;
}> = {
  genz: {
    label: 'Gen Z (18–24)',
    tone: 'casual, a little all-over-the-place, honest to a fault, self-aware',
    deliveryNote: 'no buildup — start in the middle of the thing. imperfect is better than polished.',
    killer: ['okay but', 'not to be dramatic', 'the way that', 'no fr', 'said what i said', 'bestie'],
    settingByMode: {
      voiceover: 'chaotic bedroom, products scattered on the floor, dim warm lighting — lived-in',
      talking_to_camera: 'phone propped against something messy, lying on bed or sitting on floor leaning against bed',
      hybrid: 'walking outside with headphones in, mid-walk, messy and real',
    },
  },
  youngmil: {
    label: 'Young Millennial / Older Gen Z (24–30)',
    tone: 'relatable and self-aware, trying to figure it out, not performing wellness',
    deliveryNote: 'direct but not cold. feels like someone who has opinions and shares them without trying too hard.',
    killer: ['genuinely', 'okay hear me out', 'the thing nobody says', 'i was skeptical', 'real talk'],
    settingByMode: {
      voiceover: 'morning kitchen, coffee visible, soft natural light — getting ready for the day',
      talking_to_camera: 'sitting on the kitchen floor or counter, casual, feels like a genuine moment',
      hybrid: 'makeup vanity getting ready or walking to the car — lifestyle but not curated',
    },
  },
  oldermil: {
    label: 'Older Millennial (30–40)',
    tone: 'cuts through noise, talks like someone who has tried things and has receipts, dry humor, pragmatic',
    deliveryNote: 'no fluff. earn the recommendation with specifics not enthusiasm. direct eye contact.',
    killer: ['finally', 'nobody tells you', 'i wish someone had told me', 'it actually works', 'the difference was real'],
    settingByMode: {
      voiceover: 'clean counter or vanity, organized chaos — adult who has their life mostly together',
      talking_to_camera: 'sitting at home desk or kitchen table, direct eye contact, zero staging',
      hybrid: 'in the car between errands — real, not performative',
    },
  },
  genx: {
    label: 'Gen X (40–55)',
    tone: 'dry, skeptical by default, no-nonsense, wry, proves value through specifics not vibes',
    deliveryNote: "don't sell. share. build credibility first, product second. they'll smell a pitch from a mile away.",
    killer: ["i was skeptical", "here's what actually happened", 'after [x] weeks', 'the specific thing that changed', 'worth the money'],
    settingByMode: {
      voiceover: 'natural, unfussy — morning light, product in frame, nothing staged',
      talking_to_camera: 'sitting down, direct, no effort to be trendy — just a real person talking',
      hybrid: 'outside walking the dog or doing something real, voiceover explains it',
    },
  },
  boomer: {
    label: 'Boomer (56+)',
    tone: 'warm, trustworthy, straightforward, clear and confident',
    deliveryNote: 'slower pace, clear articulation, warm eye contact. tell them exactly what changed and why.',
    killer: ['what i noticed was', "i've been using it for", 'my doctor mentioned', "here's what surprised me", 'simple to use'],
    settingByMode: {
      voiceover: 'bright, clear space — kitchen or living room, well lit, product clearly visible',
      talking_to_camera: 'comfortable chair or couch, good lighting, no background noise',
      hybrid: 'outdoors in good light — garden, porch, park walk',
    },
  },
};

async function callClaude(prompt: string, apiKey: string, maxTokens = 1024): Promise<string> {
  const resp = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: maxTokens,
      system: `You are an expert UGC (user-generated content) scriptwriter for TikTok and Instagram Reels. You write hooks and scripts that feel personal, specific, and genuinely human — never like marketing copy or a template being filled in.

STRICT writing rules you always follow:
- ALL LOWERCASE — no capital letters anywhere except proper nouns and brand names
- NO em dashes (—) — use commas, periods, ellipses, or line breaks instead
- First person only ("i", "my", "me")
- Diary-tone: sounds like someone talking to a close friend, not to an audience
- Make it specific and personal to the product and pain — never generic filler phrases
- Zero marketing speak: never write "revolutionary", "game-changing", "transform your", "amazing results", "life-changing", "incredible"
- Integrate the product naturally — don't announce it like a brand placement
- Write as if you're the creator describing their own real experience`,
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  if (!resp.ok) {
    const err = await resp.text();
    throw new Error(`Anthropic ${resp.status}: ${err}`);
  }
  const data = await resp.json();
  return data.content?.[0]?.text ?? '';
}

export async function POST(req: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return Response.json({ error: true, reason: 'no_key' });
  }

  let body: Record<string, string>;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: true }, { status: 400 });
  }

  const { type } = body;

  try {
    // ─── HOOK GENERATION ─────────────────────────────────────────────
    if (type === 'hooks') {
      const { product, pain, demo, style, creatorAgeKey } = body;
      const age = AGE_CONTEXT[creatorAgeKey] ?? AGE_CONTEXT.oldermil;
      const styleGuide = STYLE_GUIDES[style] ?? STYLE_GUIDES.mid_thought;

      const prompt = `Write 5 unique hooks for a UGC video.

HOOK STYLE: ${style.replace(/_/g, ' ')}
What this style sounds like: ${styleGuide}

CREATOR VOICE — write from this person's perspective:
- Who they are: ${age.label}
- How they talk: ${age.tone}
- How they deliver: ${age.deliveryNote}
- Phrases natural to their voice (weave in 1-2 naturally, don't force all of them): ${age.killer.join(', ')}

WHAT THE VIDEO IS ABOUT:
- Product: ${product}
- The problem it solves: ${pain}
- Who it's for: ${demo || 'general adult audience'}

Write 5 hooks. Each one should feel like something this specific creator would actually say about this specific product and pain point. No generic filler. No announcer voice. Each hook should be 1-3 sentences.

Return exactly this JSON — nothing else, no explanation, no markdown:
{"hooks":["hook one full text","hook two full text","hook three full text","hook four full text","hook five full text"]}`;

      const text = await callClaude(prompt, apiKey, 800);
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error('no JSON in response');
      const parsed = JSON.parse(jsonMatch[0]);
      if (!Array.isArray(parsed.hooks) || parsed.hooks.length === 0) throw new Error('empty hooks array');
      return Response.json({ hooks: parsed.hooks });

    // ─── SCRIPT GENERATION ───────────────────────────────────────────
    } else if (type === 'script') {
      const { product, audience, pain, result, cta, mode, contentType, creatorAgeKey } = body;
      const age = AGE_CONTEXT[creatorAgeKey] ?? AGE_CONTEXT.oldermil;
      const setting = age.settingByMode[mode] ?? age.settingByMode.voiceover;
      const isPaid = contentType === 'paid';

      const formatSpec = {
        voiceover: isPaid
          ? 'VOICEOVER / PAID AD — narrate over tight b-roll and product shots. result-first, fast, zero fluff. 15-20 seconds. every line earns its place. hard CTA at the end.'
          : 'VOICEOVER / ORGANIC — narrate over lifestyle b-roll and product shots. storytelling-forward, ambient, personal. 40-50 seconds. soft warm close.',
        talking_to_camera: isPaid
          ? 'TALKING TO CAMERA / PAID AD — straight to the result in frame one, no buildup. punchy, short, direct. 15-25 seconds. hard CTA at the end.'
          : 'TALKING TO CAMERA / ORGANIC — diary-feel, direct address, you are the content. 35-50 seconds. real story arc, soft close. feels like a conversation not a pitch.',
        hybrid: isPaid
          ? 'HYBRID / PAID AD — hook on camera, proof via b-roll cuts, close back on camera. tight, high attention retention. 20-30 seconds.'
          : 'HYBRID / ORGANIC — direct camera moments for trust, b-roll for proof and texture. best of both. 40-50 seconds.',
      }[mode] ?? 'TALKING TO CAMERA / ORGANIC — diary-feel, 35-50 seconds.';

      const prompt = `Write a complete UGC video script.

FORMAT: ${formatSpec}
VISUAL SETTING: ${setting}

CREATOR VOICE — write the entire script from this person's perspective:
- Who they are: ${age.label}
- How they talk: ${age.tone}
- How they should deliver it: ${age.deliveryNote}
- Phrases natural to their voice (weave in 1-2 naturally): ${age.killer.join(', ')}

WHAT THE VIDEO IS ABOUT:
- Product: ${product}
- Target audience: ${audience || 'general adult audience'}
- Pain point: ${pain}
- The transformation / key result: ${result}
- CTA: ${cta}

Write the full script following this structure:

1. THREE hook options at the top — label them HOOK A:, HOOK B:, HOOK C:. Each hook should take a different angle or entry point (one could be mid-thought, one could be right-person address, one could be a quiet confession). All three should feel genuinely different, not just reworded versions of each other.

2. A divider: ─────────────────────────

3. The full script body with:
   - [visual direction in brackets] at each beat — specific, actionable, not vague
   - Timing markers like [0:00–0:05] at each section
   - The actual words the creator says written out in full — not placeholders, not bullets, full sentences
   - One line left as "[your specific honest detail — what was the first real thing you noticed?]" — this is the most important line and the creator fills it in with something true from their own experience

The script should sell the transformation (${result}), not the features of ${product}. The product is the reason, not the story. Write it like this creator is genuinely telling a friend, not selling to a camera.`;

      const script = await callClaude(prompt, apiKey, 1600);
      if (!script.trim()) throw new Error('empty script');
      return Response.json({ script });

    // ─── PITCH GENERATION ────────────────────────────────────────────
    } else if (type === 'pitch') {
      const { brandName, contactName, yourName, product, hook, contentIdea, quarter, deliverable, tone } = body;

      const QUARTER_CONTEXT: Record<string, string> = {
        Q1: 'Q1 (Jan–Mar): New Year/new goals energy, Valentine\'s Day, winter-to-spring transition, "new year new me" campaigns',
        Q2: 'Q2 (Apr–Jun): Spring/summer launch season, Mother\'s Day, Memorial Day, graduation gifts',
        Q3: 'Q3 (Jul–Sep): Summer peak, back-to-school, Labor Day, pre-holiday content build',
        Q4: 'Q4 (Oct–Dec): Halloween, Black Friday / Cyber Monday, holiday gifting, Christmas, year-end urgency',
      };

      const TONE_GUIDE: Record<string, string> = {
        warm: 'warm and personal — feels like you genuinely know and care about the brand. conversational but intentional. not fangirl-ish.',
        direct: 'direct and professional — short sentences, clear value prop, no fluff. respects their inbox.',
        confident: 'confident and results-forward — leads with what you can produce for them, not with compliments.',
      };

      const quarterCtx = QUARTER_CONTEXT[quarter] ?? '';
      const toneGuide = TONE_GUIDE[tone] ?? TONE_GUIDE.warm;

      const prompt = `Write a cold outreach pitch email from a UGC creator to a brand.

BRAND DETAILS:
- Brand: ${brandName}
- Contact first name: ${contactName}
- Product or launch: ${product}
- Why the creator genuinely loves it: ${hook}
- Quarter they're pitching for: ${quarter} — ${quarterCtx}
- Content concept / angle they want to pitch: ${contentIdea}
- Proposed deliverable: ${deliverable}
- Creator's first name: ${yourName}

EMAIL TONE: ${toneGuide}

NON-NEGOTIABLE RULES — break any of these and the output is wrong:
1. ZERO rates, prices, dollar amounts, or budget language anywhere in the email. None. The purpose of this email is to open a conversation and earn a reply, not to quote.
2. The CTA must be soft and low-pressure — always portfolio or concept focused. Examples: "Would you be open to seeing a couple of concepts for ${quarter}?" / "Can I send my portfolio over?" / "I'd love to share 2–3 creative directions built around [product/quarter] — want me to send them over?"
3. Tie the content idea and quarter context together naturally — make it feel timely and specific to this brand, not generic.
4. Keep the body under 130 words. Short is more likely to get a reply.
5. The subject line should be specific and curiosity-driving — never generic like "UGC collaboration" or "partnership opportunity."
6. Write it like a real person wrote it — no template-ese.

Return ONLY this JSON, nothing else:
{"subject": "subject line here", "body": "full email body here — use \\n for line breaks"}`;

      const text = await callClaude(prompt, apiKey, 600);
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error('no JSON in pitch response');
      const parsed = JSON.parse(jsonMatch[0]);
      if (!parsed.subject || !parsed.body) throw new Error('incomplete pitch response');
      return Response.json({ subject: parsed.subject, body: parsed.body });

    } else {
      return Response.json({ error: true }, { status: 400 });
    }

  } catch (err) {
    console.error('[generate-content]', err);
    return Response.json({ error: true });
  }
}
