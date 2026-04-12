import { NextRequest } from 'next/server';
import { kv } from '@vercel/kv';
import { Resend } from 'resend';
import { readFile } from 'fs/promises';
import path from 'path';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const secret = req.headers.get('x-webhook-secret');
  if (!secret || secret !== process.env.STAN_WEBHOOK_SECRET) {
    return new Response('Unauthorized', { status: 401 });
  }

  let body: { name?: string; email?: string };
  try {
    body = await req.json();
  } catch {
    return new Response('Bad request', { status: 400 });
  }

  const { name, email } = body;
  if (!email || !name) {
    return new Response('Missing name or email', { status: 400 });
  }

  const token = crypto.randomUUID();
  await kv.set(`client:${token}`, {
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
    from: 'Maya <hello@mayacreativeco.com>',
    to: email,
    subject: 'Your Booked Out Command Center is ready',
    html,
  });

  return Response.json({ ok: true, token }, { status: 200 });
}
