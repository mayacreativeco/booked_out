import Stripe from 'stripe';
import { NextRequest } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const PLAN_LABELS: Record<string, string> = {
  [process.env.STRIPE_PRICE_FOUNDING ?? '__none__']: 'Founding Member · $197/yr',
  [process.env.STRIPE_PRICE_ANNUAL   ?? '__none__']: 'Annual · $397/yr',
  [process.env.STRIPE_PRICE_MONTHLY  ?? '__none__']: 'Monthly · $49/mo',
};

function fmtDate(ts: number): string {
  return new Date(ts * 1000).toLocaleDateString('en-US', {
    month: 'long', day: 'numeric', year: 'numeric',
  });
}

export async function GET(req: NextRequest) {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
  const email = req.nextUrl.searchParams.get('email');

  if (!email) {
    return Response.json({ error: 'email required' }, { status: 400 });
  }

  try {
    // Find Stripe customer by email
    const customers = await stripe.customers.list({ email, limit: 1 });
    if (!customers.data.length) {
      return Response.json({ error: 'no_customer' }, { status: 404 });
    }

    const customerId = customers.data[0].id;

    // Get their most recent subscription (active or cancelled)
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      limit: 1,
      status: 'all',
    });

    if (!subscriptions.data.length) {
      return Response.json({ error: 'no_subscription' }, { status: 404 });
    }

    const sub = subscriptions.data[0];
    const item = sub.items.data[0];
    const priceId = item?.price?.id ?? '';
    const planLabel = PLAN_LABELS[priceId] ?? 'Unknown plan';
    const isCancelled = sub.cancel_at_period_end || sub.status === 'canceled';
    // current_period_end lives on the SubscriptionItem in this Stripe SDK version
    const periodEnd: number = (item as typeof item & { current_period_end?: number }).current_period_end
      ?? (sub as typeof sub & { current_period_end?: number }).current_period_end
      ?? 0;

    let status: 'active' | 'cancelled' | 'past_due';
    if (sub.status === 'past_due') {
      status = 'past_due';
    } else if (isCancelled) {
      status = 'cancelled';
    } else {
      status = 'active';
    }

    return Response.json({
      planLabel,
      status,
      // next_billing shows next charge date for active subs; access_ends shows last day for cancelled
      nextBilling:   isCancelled ? null : fmtDate(periodEnd),
      accessEnds:    isCancelled ? fmtDate(periodEnd) : null,
      customerId,
    });

  } catch (err) {
    console.error('[subscription-status]', err);
    return Response.json({ error: 'lookup_failed' }, { status: 500 });
  }
}
