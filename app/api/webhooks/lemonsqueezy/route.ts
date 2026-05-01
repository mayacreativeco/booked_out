import { NextRequest } from 'next/server';
import { Redis } from '@upstash/redis';
import { Resend } from 'resend';
import { readFile } from 'fs/promises';
import path from 'path';
import { createHmac, timingSafeEqual } from 'crypto';

const redis = Redis.fromEnv();

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 30;

// ---------------------------------------------------------------------------
// Memberstack API helpers
// ---------------------------------------------------------------------------

const MS_API = 'https://admin.memberstack.com';

async function msRequest(method: string, endpoint: string, body?: object) {
  const res = await fetch(`${MS_API}${endpoint}`, {
    method,
    headers: {
      'X-API-KEY': process.env.MEMBERSTACK_SECRET_KEY ?? '',
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Memberstack ${res.status} ${endpoint}: ${text}`);
  }
  return res.json();
}

async function getMemberByEmail(email: string): Promise<{ id: string; planConnections: { id: string; planId: string }[] } | null> {
  const res = await msRequest('GET', `/members?email=${encodeURIComponent(email)}`);
  const members = res.data ?? [];
  return members.length > 0 ? members[0] : null;
}

async function createMember(email: string, planId: string, meta: Record<string, string>) {
  return msRequest('POST', '/members', {
    email,
    plans: [{ planId }],
    metaData: meta,
  });
}

async function addPlanConnection(memberId: string, planId: string) {
  return msRequest('POST', `/members/${memberId}/connections`, { planId });
}

async function removePlanConnection(memberId: string, connectionId: string) {
  return msRequest('DELETE', `/members/${memberId}/connections/${connectionId}`);
}

async function updateMemberMeta(memberId: string, metaData: Record<string, string>) {
  return msRequest('PATCH', `/members/${memberId}`, { metaData });
}

async function sendMagicLink(memberId: string, redirect = 'https://booked-out.mayacreativeco.com/dashboard/') {
  // Sends a "set your password / magic login" email via Memberstack
  return msRequest('POST', `/members/${memberId}/send-magic-link`, { redirect });
}

// ---------------------------------------------------------------------------
// LemonSqueezy variant ID → Memberstack plan ID mapping
// Set these env vars in Vercel once you have both sets of IDs
// ---------------------------------------------------------------------------
function getPlanId(lsVariantId: string | number): string | null {
  const map: Record<string, string> = {
    [process.env.LS_VARIANT_MONTHLY ?? '']: process.env.MS_PLAN_MONTHLY ?? '',
    [process.env.LS_VARIANT_ANNUAL ?? '']: process.env.MS_PLAN_ANNUAL ?? '',
    [process.env.LS_VARIANT_FOUNDING ?? '']: process.env.MS_PLAN_FOUNDING ?? '',
  };
  return map[String(lsVariantId)] ?? null;
}

function getPlanType(lsVariantId: string | number): string {
  if (String(lsVariantId) === process.env.LS_VARIANT_MONTHLY) return 'monthly';
  if (String(lsVariantId) === process.env.LS_VARIANT_ANNUAL) return 'annual';
  if (String(lsVariantId) === process.env.LS_VARIANT_FOUNDING) return 'founding';
  return 'monthly';
}

// ---------------------------------------------------------------------------
// Signature verification
// ---------------------------------------------------------------------------
function verifySignature(rawBody: string, signature: string, secret: string): boolean {
  const expected = createHmac('sha256', secret).update(rawBody).digest('hex');
  try {
    const sigBuf = Buffer.from(signature, 'hex');
    const expBuf = Buffer.from(expected, 'hex');
    return sigBuf.length === expBuf.length && timingSafeEqual(sigBuf, expBuf);
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------------------
// Welcome email (fallback — Memberstack's magic link email is primary)
// ---------------------------------------------------------------------------
async function sendWelcomeEmail(email: string, name: string) {
  try {
    const template = await readFile(
      path.join(process.cwd(), 'content', 'welcome-email.html'),
      'utf-8',
    );
    const html = template
      .replaceAll('{{DASHBOARD_URL}}', 'https://booked-out.mayacreativeco.com/login.html')
      .replaceAll('{{NAME}}', name.split(' ')[0]);
    const resend = new Resend(process.env.RESEND_API_KEY);
    await resend.emails.send({
      from: 'Maya <hello@mayaherring.com>',
      to: email,
      subject: 'Your Booked Out command center is ready',
      html,
    });
  } catch (e) {
    console.error('[ls-webhook] welcome email failed:', e);
  }
}

// ---------------------------------------------------------------------------
// Route handler
// ---------------------------------------------------------------------------
export async function POST(req: NextRequest) {
  const secret = process.env.LEMONSQUEEZY_WEBHOOK_SECRET;
  if (!secret) {
    console.error('[ls-webhook] LEMONSQUEEZY_WEBHOOK_SECRET not set');
    return new Response('Server misconfigured', { status: 500 });
  }

  const rawBody = await req.text();
  const signature = req.headers.get('x-signature') ?? '';

  if (!verifySignature(rawBody, signature, secret)) {
    return new Response('Invalid signature', { status: 401 });
  }

  let payload: Record<string, unknown>;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return new Response('Bad request', { status: 400 });
  }

  const event = (payload.meta as Record<string, string>)?.event_name;
  const data = (payload.data as Record<string, unknown>) ?? {};
  const attrs = (data.attributes as Record<string, unknown>) ?? {};

  console.log(`[ls-webhook] event: ${event}`);

  try {
    switch (event) {

      // -----------------------------------------------------------------
      // New subscription — create Memberstack user + send login link
      // -----------------------------------------------------------------
      case 'subscription_created': {
        const email = String(attrs.user_email ?? '');
        const name = String(attrs.user_name ?? 'Operator');
        const variantId = String(attrs.variant_id ?? '');
        const subscriptionId = String(data.id ?? '');
        const renewsAt = String(attrs.renews_at ?? '');

        if (!email) break;

        const planId = getPlanId(variantId);
        const planType = getPlanType(variantId);
        const meta = {
          planType,
          lsSubscriptionId: subscriptionId,
          nextBillingDate: renewsAt,
          status: 'active',
        };

        let member = await getMemberByEmail(email);

        if (member) {
          // Existing member (e.g. rejoining) — add plan + update meta
          if (planId) await addPlanConnection(member.id, planId);
          await updateMemberMeta(member.id, meta);
          await sendMagicLink(member.id);
        } else {
          // New member — create account + send magic link
          if (!planId) {
            console.error(`[ls-webhook] No Memberstack plan ID for LS variant ${variantId}`);
            break;
          }
          const created = await createMember(email, planId, meta);
          const newMemberId = created?.data?.id;
          if (newMemberId) {
            await sendMagicLink(newMemberId);
          }
          // Also send branded welcome email
          await sendWelcomeEmail(email, name);
        }

        // Store token in Redis for audit trail (not used for access control)
        const token = crypto.randomUUID();
        await redis.set(`sub:${subscriptionId}`, { email, token, createdAt: new Date().toISOString() });
        break;
      }

      // -----------------------------------------------------------------
      // Subscription changed plan or renewed
      // -----------------------------------------------------------------
      case 'subscription_updated': {
        const email = String(attrs.user_email ?? '');
        const variantId = String(attrs.variant_id ?? '');
        const renewsAt = String(attrs.renews_at ?? '');
        const lsStatus = String(attrs.status ?? 'active');

        if (!email) break;

        const member = await getMemberByEmail(email);
        if (!member) break;

        const planType = getPlanType(variantId);
        const status = lsStatus === 'active' ? 'active' : lsStatus;

        await updateMemberMeta(member.id, {
          planType,
          nextBillingDate: renewsAt,
          status,
        });

        // If variant changed, swap plan connection
        const newPlanId = getPlanId(variantId);
        if (newPlanId) {
          // Remove old connections and add new one
          for (const conn of member.planConnections ?? []) {
            if (conn.planId !== newPlanId) {
              await removePlanConnection(member.id, conn.id);
            }
          }
          const hasPlan = member.planConnections?.some(c => c.planId === newPlanId);
          if (!hasPlan) await addPlanConnection(member.id, newPlanId);
        }
        break;
      }

      // -----------------------------------------------------------------
      // Subscription cancelled — member keeps access until period ends
      // -----------------------------------------------------------------
      case 'subscription_cancelled': {
        const email = String(attrs.user_email ?? '');
        const endsAt = String(attrs.ends_at ?? '');
        if (!email) break;

        const member = await getMemberByEmail(email);
        if (!member) break;

        await updateMemberMeta(member.id, {
          status: 'cancelled',
          accessUntil: endsAt,
        });
        break;
      }

      // -----------------------------------------------------------------
      // Subscription expired — revoke Memberstack plan access
      // -----------------------------------------------------------------
      case 'subscription_expired': {
        const email = String(attrs.user_email ?? '');
        if (!email) break;

        const member = await getMemberByEmail(email);
        if (!member) break;

        // Remove all plan connections
        for (const conn of member.planConnections ?? []) {
          await removePlanConnection(member.id, conn.id);
        }
        await updateMemberMeta(member.id, { status: 'expired' });
        break;
      }

      // -----------------------------------------------------------------
      // Payment failed — flag as past_due, notify Maya
      // -----------------------------------------------------------------
      case 'subscription_payment_failed': {
        const email = String(attrs.user_email ?? '');
        const subscriptionId = String(data.id ?? '');
        if (!email) break;

        const member = await getMemberByEmail(email);
        if (member) await updateMemberMeta(member.id, { status: 'past_due' });

        // Notify Maya
        try {
          const resend = new Resend(process.env.RESEND_API_KEY);
          await resend.emails.send({
            from: 'Booked Out System <hello@mayaherring.com>',
            to: 'hello@mayaherring.com',
            subject: `[Action needed] Payment failed — ${email}`,
            html: `<p>Payment failed for subscriber <strong>${email}</strong> (subscription ${subscriptionId}). LemonSqueezy will retry. Their Memberstack account is flagged as past_due.</p>`,
          });
        } catch (e) {
          console.error('[ls-webhook] failed to send payment-failed notification:', e);
        }
        break;
      }

      // -----------------------------------------------------------------
      // Payment succeeded (recovery after failure)
      // -----------------------------------------------------------------
      case 'subscription_payment_success': {
        const email = String(attrs.user_email ?? '');
        const renewsAt = String(attrs.renews_at ?? '');
        if (!email) break;

        const member = await getMemberByEmail(email);
        if (!member) break;

        await updateMemberMeta(member.id, { status: 'active', nextBillingDate: renewsAt });
        break;
      }

      default:
        // Unhandled event — log and return 200 so LS doesn't retry
        console.log(`[ls-webhook] unhandled event: ${event}`);
    }
  } catch (err) {
    console.error(`[ls-webhook] error processing ${event}:`, err);
    return Response.json({ ok: false, error: String(err) }, { status: 500 });
  }

  return Response.json({ ok: true, event });
}
