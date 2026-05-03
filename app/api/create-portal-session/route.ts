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

    // Find the Stripe customer for this email
    const customers = await stripe.customers.list({ email, limit: 1 });
    if (!customers.data.length) {
      return Response.json({ error: 'no_customer' }, { status: 404 });
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: customers.data[0].id,
      return_url: `${SITE_URL}/account.html`,
    });

    return Response.json({ url: session.url });

  } catch (err) {
    console.error('[create-portal-session]', err);
    return Response.json({ error: 'Failed to create portal session' }, { status: 500 });
  }
}
