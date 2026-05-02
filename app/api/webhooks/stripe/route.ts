import Stripe from 'stripe';
import { NextRequest } from 'next/server';
import { Redis } from '@upstash/redis';
import { Resend } from 'resend';
import { randomUUID } from 'crypto';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MS_API = 'https://admin.memberstack.com';
const MS_KEY = process.env.MEMBERSTACK_SECRET_KEY ?? '';
const SUPPORT_EMAIL = process.env.SUPPORT_EMAIL ?? 'support@mayaherring.com';
const SITE_URL = 'https://booked-out.mayacreativeco.com';

// Maps planType → Memberstack plan ID (MS_PRICE_* vars contain pln_* IDs despite the name)
const MS_PLAN_MAP: Record<string, string | undefined> = {
  monthly:  process.env.MS_PRICE_MONTHLY,
  annual:   process.env.MS_PRICE_ANNUAL,
  founding: process.env.MS_PRICE_FOUNDING,
};

// Maps Stripe price ID → planType (for subscription.deleted lookup)
function stripePriceToMsPlanId(stripePriceId: string): string | undefined {
  const map: Record<string, string | undefined> = {
    [process.env.STRIPE_PRICE_MONTHLY  ?? '']: process.env.MS_PRICE_MONTHLY,
    [process.env.STRIPE_PRICE_ANNUAL   ?? '']: process.env.MS_PRICE_ANNUAL,
    [process.env.STRIPE_PRICE_FOUNDING ?? '']: process.env.MS_PRICE_FOUNDING,
  };
  return map[stripePriceId];
}

// ---------------------------------------------------------------------------
// Memberstack Admin API helpers
// ---------------------------------------------------------------------------

async function msRequest(method: string, path: string, body?: unknown) {
  const res = await fetch(`${MS_API}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': MS_KEY,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Memberstack ${method} ${path} → ${res.status}: ${text}`);
  }
  return res.json();
}

async function getMsMemberByEmail(email: string): Promise<{ id: string } | null> {
  try {
    const data = await msRequest('GET', `/members/${encodeURIComponent(email)}`);
    return data?.data ?? null;
  } catch (err: unknown) {
    // 404 = member doesn't exist
    if (err instanceof Error && err.message.includes('404')) return null;
    throw err;
  }
}

async function createMsMember(email: string, planId: string): Promise<{ id: string }> {
  const data = await msRequest('POST', '/members', {
    email,
    password: randomUUID(), // random password — member sets their own via forgot-password flow
    plans: [{ planId }],
  });
  return data?.data;
}

async function addMsPlan(memberId: string, planId: string): Promise<void> {
  await msRequest('POST', `/members/${memberId}/add-plan`, { planId });
}

async function removeMsPlan(memberId: string, planId: string): Promise<void> {
  await msRequest('POST', `/members/${memberId}/remove-plan`, { planId });
}

// ---------------------------------------------------------------------------
// Email helpers
// ---------------------------------------------------------------------------

async function sendWelcomeEmail(resend: Resend, email: string): Promise<void> {
  await resend.emails.send({
    from: `Booked Out <${SUPPORT_EMAIL}>`,
    to: email,
    subject: "You're in — set your password to access Booked Out",
    html: `
      <div style="font-family:'Inter',system-ui,sans-serif;max-width:520px;margin:0 auto;color:#0A1A12;padding:32px 24px;">
        <div style="font-family:'Courier New',monospace;font-size:11px;color:#4A7C59;margin-bottom:16px;">// welcome_to_booked_out</div>
        <h1 style="font-family:Georgia,serif;font-size:28px;font-weight:700;color:#1B3A2F;margin:0 0 16px;">You're in.</h1>
        <p style="font-size:15px;line-height:1.6;color:#4A5C50;margin:0 0 24px;">
          Your Booked Out subscription is active. One last step: set your password so you can log in to the command center.
        </p>
        <a href="${SITE_URL}/forgot-password.html"
           style="display:inline-block;background:#1B3A2F;color:#F5F0E4;font-family:'Courier New',monospace;font-size:13px;font-weight:600;padding:14px 28px;border-radius:4px;text-decoration:none;">
          → Set your password
        </a>
        <p style="font-size:13px;color:#4A5C50;margin:24px 0 0;line-height:1.6;">
          On that page, enter <strong>${email}</strong> and Booked Out will email you a magic link to set your password and open the dashboard.
        </p>
        <hr style="border:none;border-top:1px solid #D8D0BE;margin:32px 0;">
        <p style="font-size:11px;color:#4A5C50;font-family:'Courier New',monospace;">
          maya_creative_co / booked_out · Questions? Reply to this email or visit <a href="${SITE_URL}" style="color:#1B3A2F;">${SITE_URL}</a>
        </p>
      </div>
    `,
  });
}

async function sendSupportAlert(resend: Resend, subject: string, body: string): Promise<void> {
  try {
    await resend.emails.send({
      from: `Booked Out Alerts <${SUPPORT_EMAIL}>`,
      to: SUPPORT_EMAIL,
      subject,
      html: `<pre style="font-family:monospace;font-size:13px;white-space:pre-wrap;">${body}</pre>`,
    });
  } catch (err) {
    console.error('[stripe-webhook] failed to send support alert:', err);
  }
}

// ---------------------------------------------------------------------------
// Webhook handler
// ---------------------------------------------------------------------------

export async function POST(req: NextRequest) {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
  const redis = Redis.fromEnv();
  const resend = new Resend(process.env.RESEND_API_KEY);

  const rawBody = await req.text();
  const sig = req.headers.get('stripe-signature');

  if (!sig) {
    return new Response('Missing stripe-signature', { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      rawBody,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!,
    );
  } catch (err) {
    console.error('[stripe-webhook] signature verification failed:', err);
    return new Response(`Webhook signature error: ${err}`, { status: 400 });
  }

  // Idempotency — skip events already processed
  const eventKey = `stripe_event:${event.id}`;
  const alreadyProcessed = await redis.get(eventKey);
  if (alreadyProcessed) {
    console.log(`[stripe-webhook] skipping duplicate event ${event.id}`);
    return Response.json({ received: true, skipped: true });
  }

  console.log(`[stripe-webhook] processing ${event.type} (${event.id})`);

  try {
    switch (event.type) {

      // ------------------------------------------------------------------
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const email = session.customer_details?.email;
        const planType = session.metadata?.plan_type;

        if (!email || !planType) {
          throw new Error(`Missing email (${email}) or plan_type (${planType}) in session ${session.id}`);
        }

        const msPlanId = MS_PLAN_MAP[planType];
        if (!msPlanId) {
          throw new Error(`No Memberstack plan ID for planType "${planType}"`);
        }

        let member = await getMsMemberByEmail(email);

        if (member) {
          console.log(`[stripe-webhook] adding plan ${msPlanId} to existing member ${member.id}`);
          await addMsPlan(member.id, msPlanId);
        } else {
          console.log(`[stripe-webhook] creating new member for ${email} with plan ${msPlanId}`);
          member = await createMsMember(email, msPlanId);
        }

        // Send welcome email with password-set instructions
        await sendWelcomeEmail(resend, email);
        console.log(`[stripe-webhook] welcome email sent to ${email}`);
        break;
      }

      // ------------------------------------------------------------------
      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription;
        const customerId = sub.customer as string;

        // Get email from Stripe customer record
        const customer = await stripe.customers.retrieve(customerId);
        const email = (customer as Stripe.Customer).email;

        if (!email) {
          console.error(`[stripe-webhook] no email for Stripe customer ${customerId}`);
          break;
        }

        const member = await getMsMemberByEmail(email);
        if (!member) {
          console.log(`[stripe-webhook] no Memberstack member found for ${email} on subscription delete`);
          break;
        }

        // Map the Stripe price back to the Memberstack plan ID
        const stripePriceId = sub.items?.data?.[0]?.price?.id;
        const msPlanId = stripePriceId ? stripePriceToMsPlanId(stripePriceId) : undefined;

        if (msPlanId) {
          console.log(`[stripe-webhook] removing plan ${msPlanId} from member ${member.id}`);
          await removeMsPlan(member.id, msPlanId);
        } else {
          console.error(`[stripe-webhook] could not map Stripe price ${stripePriceId} to a Memberstack plan`);
        }
        break;
      }

      // ------------------------------------------------------------------
      case 'customer.subscription.updated': {
        // Log for visibility — full plan-change handling can be added here
        const sub = event.data.object as Stripe.Subscription;
        console.log(`[stripe-webhook] subscription updated: ${sub.id} status=${sub.status}`);
        break;
      }

      // ------------------------------------------------------------------
      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        const email = invoice.customer_email ?? 'unknown';
        console.error(`[stripe-webhook] payment failed for ${email}, invoice ${invoice.id}`);
        await sendSupportAlert(
          resend,
          `Payment failed for ${email}`,
          `Invoice: ${invoice.id}\nCustomer email: ${email}\nAmount: ${invoice.amount_due}\nStripe event: ${event.id}`,
        );
        break;
      }

      // ------------------------------------------------------------------
      case 'invoice.payment_succeeded': {
        // Defensive sync — plan should already be active via checkout.session.completed
        const invoice = event.data.object as Stripe.Invoice;
        console.log(`[stripe-webhook] payment succeeded for invoice ${invoice.id}`);
        break;
      }

      default:
        console.log(`[stripe-webhook] unhandled event type: ${event.type}`);
    }

    // Mark event as processed (24-hour TTL for idempotency window)
    await redis.set(eventKey, '1', { ex: 86400 });
    return Response.json({ received: true });

  } catch (err) {
    const errMsg = err instanceof Error ? err.message : String(err);
    const session = event.type === 'checkout.session.completed'
      ? (event.data.object as Stripe.Checkout.Session)
      : null;
    const email = session?.customer_details?.email ?? 'unknown';

    console.error(`[stripe-webhook] FATAL error processing ${event.type} (${event.id}):`, err);

    await sendSupportAlert(
      resend,
      `URGENT: Booked Out webhook failed for ${email}`,
      `Event type: ${event.type}\nEvent ID: ${event.id}\nEmail: ${email}\nPlan type: ${session?.metadata?.plan_type ?? 'unknown'}\n\nError: ${errMsg}\n\nAction needed: manually create/update member in Memberstack dashboard.`,
    );

    // Return 200 so Stripe doesn't retry (we've already alerted support)
    return Response.json({ received: true, error: errMsg }, { status: 200 });
  }
}
