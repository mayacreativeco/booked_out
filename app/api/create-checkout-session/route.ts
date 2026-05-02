import Stripe from 'stripe';
import { NextRequest } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

  const STRIPE_PRICE_MAP: Record<string, string | undefined> = {
    monthly:  process.env.STRIPE_PRICE_MONTHLY,
    annual:   process.env.STRIPE_PRICE_ANNUAL,
    founding: process.env.STRIPE_PRICE_FOUNDING,
  };

  try {
    const { planType } = (await req.json()) as { planType: string };

    if (!planType || !STRIPE_PRICE_MAP[planType]) {
      return Response.json({ error: 'Invalid plan type' }, { status: 400 });
    }

    const priceId = STRIPE_PRICE_MAP[planType];
    if (!priceId) {
      return Response.json(
        { error: `No Stripe price configured for plan: ${planType}` },
        { status: 500 },
      );
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      success_url:
        'https://booked-out.mayacreativeco.com/welcome?session_id={CHECKOUT_SESSION_ID}',
      cancel_url: 'https://booked-out.mayacreativeco.com/',
      allow_promotion_codes: true,
      metadata: { plan_type: planType },
    });

    return Response.json({ url: session.url });
  } catch (err) {
    console.error('[create-checkout-session]', err);
    return Response.json({ error: 'Failed to create checkout session' }, { status: 500 });
  }
}
