import { NextRequest } from 'next/server';
import { Redis } from '@upstash/redis';
import { Resend } from 'resend';
import { readFile } from 'fs/promises';
import path from 'path';
import { createHmac, timingSafeEqual } from 'crypto';

const redis = Redis.fromEnv();

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const secret = process.env.LEMONSQUEEZY_WEBHOOK_SECRET;
  if (!secret) {
    console.error('[lemonsqueezy] LEMONSQUEEZY_WEBHOOK_SECRET not set');
    return new Response('Server misconfigured', { status: 500 });
  }

  // LemonSqueezy signs the raw body with HMAC-SHA256
  const rawBody = await req.text();
  const signature = req.headers.get('x-signature');

  if (!signature) {
    return new Response('Missing signature', { status: 401 });
  }

  const expected = createHmac('sha256', secret).update(rawBody).digest('hex');
  const sigBuffer = Buffer.from(signature, 'hex');
  const expBuffer = Buffer.from(expected, 'hex');

  if (sigBuffer.length !== expBuffer.length || !timingSafeEqual(sigBuffer, expBuffer)) {
    return new Response('Invalid signature', { status: 401 });
  }

  let payload: {
    meta?: { event_name?: string };
    data?: {
      attributes?: {
        user_name?: string;
        user_email?: string;
        first_order_item?: { product_name?: string };
      };
    };
  };

  try {
    payload = JSON.parse(rawBody);
  } catch {
    return new Response('Bad request', { status: 400 });
  }

  // Only process new completed orders
  const event = payload.meta?.event_name;
  if (event !== 'order_created') {
    return Response.json({ ok: true, skipped: true });
  }

  const name = payload.data?.attributes?.user_name;
  const email = payload.data?.attributes?.user_email;

  if (!email || !name) {
    return new Response('Missing name or email in payload', { status: 400 });
  }

  const token = crypto.randomUUID();
  await redis.set(`client:${token}`, {
    name,
    email,
    createdAt: new Date().toISOString(),
  });

  const dashboardUrl = `https://booked-out.mayacreativeco.com/dashboard/${token}/`;
  const firstName = name.split(' ')[0];

  const template = await readFile(
    path.join(process.cwd(), 'content', 'welcome-email.html'),
    'utf-8',
  );
  const html = template
    .replaceAll('{{DASHBOARD_URL}}', dashboardUrl)
    .replaceAll('{{NAME}}', firstName);

  const resend = new Resend(process.env.RESEND_API_KEY);
  await resend.emails.send({
    from: 'Maya <hello@mayaherring.com>',
    to: email,
    subject: 'Your Booked Out Command Center is ready',
    html,
  });

  console.log(`[lemonsqueezy] Created client for ${email} → ${token}`);
  return Response.json({ ok: true, token }, { status: 200 });
}
