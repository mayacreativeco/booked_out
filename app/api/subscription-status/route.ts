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

// Find the Stripe customer that actually has a subscription — handles the
// duplicate-customer problem where Memberstack creates an empty second customer.
async function findCustomerWithSubscription(
  stripe: Stripe,
  email: string,
): Promise<{ customerId: string; sub: Stripe.Subscription } | null> {
  // Fetch up to 5 customers with this email (handles duplicates)
  const customers = await stripe.customers.list({ email, limit: 5 });

  for (const customer of customers.data) {
    const subs = await stripe.subscriptions.list({
      customer: customer.id,
      limit: 1,
      status: 'all',
    });
    if (subs.data.length > 0) {
      console.log(`[subscription-status] found customer with subscription: ${customer.id} (${customer.email})`);
      return { customerId: customer.id, sub: subs.data[0] };
    }
  }

  console.log(`[subscription-status] no customer with subscription found for ${email} among ${customers.data.length} customer(s)`);
  return null;
}

export async function GET(req: NextRequest) {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
  const email = req.nextUrl.searchParams.get('email');

  if (!email) {
    return Response.json({ error: 'email required' }, { status: 400 });
  }

  try {
    const result = await findCustomerWithSubscription(stripe, email);

    if (!result) {
      return Response.json({ error: 'no_subscription' }, { status: 404 });
    }

    const { customerId, sub } = result;
    const item = sub.items.data[0];
    const priceId = item?.price?.id ?? '';
    const planLabel = PLAN_LABELS[priceId] ?? 'Unknown plan';
    const isCancelled = sub.cancel_at_period_end || sub.status === 'canceled';

    // current_period_end lives on the SubscriptionItem in this Stripe SDK version
    const periodEnd: number =
      (item as typeof item & { current_period_end?: number }).current_period_end ??
      (sub as typeof sub & { current_period_end?: number }).current_period_end ??
      0;

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
      nextBilling: isCancelled ? null : fmtDate(periodEnd),
      accessEnds:  isCancelled ? fmtDate(periodEnd) : null,
      customerId,
    });

  } catch (err) {
    console.error('[subscription-status]', err);
    return Response.json({ error: 'lookup_failed' }, { status: 500 });
  }
}
