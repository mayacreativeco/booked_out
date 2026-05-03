import Stripe from 'stripe';
import { NextRequest } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const SITE_URL = 'https://booked-out.mayacreativeco.com';

export async function POST(req: NextRequest) {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

  try {
    const { email } = (await req.json()) as { email?: string };

    if (!email) {
      return Response.json({ error: 'email required' }, { status: 400 });
    }

    // Find the customer that actually has a subscription — handles the
    // duplicate-customer problem where Memberstack creates an empty second customer.
    const customers = await stripe.customers.list({ email, limit: 5 });

    let billingCustomerId: string | null = null;

    for (const customer of customers.data) {
      const subs = await stripe.subscriptions.list({
        customer: customer.id,
        limit: 1,
        status: 'all',
      });
      if (subs.data.length > 0) {
        billingCustomerId = customer.id;
        console.log(`[create-portal-session] using customer ${customer.id} (has subscription)`);
        break;
      }
    }

    // Fallback: use first customer if none have a subscription record yet
    if (!billingCustomerId && customers.data.length > 0) {
      billingCustomerId = customers.data[0].id;
      console.log(`[create-portal-session] fallback to first customer ${billingCustomerId}`);
    }

    if (!billingCustomerId) {
      return Response.json({ error: 'no_customer' }, { status: 404 });
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: billingCustomerId,
      return_url: `${SITE_URL}/account.html`,
    });

    return Response.json({ url: session.url });

  } catch (err) {
    console.error('[create-portal-session]', err);
    return Response.json({ error: 'Failed to create portal session' }, { status: 500 });
  }
}
