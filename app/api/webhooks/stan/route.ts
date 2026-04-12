import { NextRequest } from 'next/server';
import { Resend } from 'resend';
import { createClient } from '@/lib/clients';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const resend = new Resend(process.env.RESEND);
  // Verify shared secret sent by Zapier
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
  if (!email) {
    return new Response('Missing email', { status: 400 });
  }

  const clientName = name ?? email;
  const { url } = await createClient(clientName, {});

  await resend.emails.send({
    from: 'Maya <hello@mayacreativeco.com>',
    to: email,
    subject: 'Your Booked Out Command Center is ready',
    html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#F5F0E4;font-family:'Inter',system-ui,sans-serif;color:#0A1A12;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F5F0E4;padding:48px 24px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;">

        <!-- Logo -->
        <tr><td style="padding-bottom:32px;">
          <span style="font-family:monospace;font-size:11px;color:#4A5C50;">maya_creative_co / booked_out.v1</span>
        </td></tr>

        <!-- Heading -->
        <tr><td style="padding-bottom:8px;">
          <p style="margin:0;font-family:monospace;font-size:11px;color:#4A7C59;">// access_granted</p>
        </td></tr>
        <tr><td style="padding-bottom:24px;">
          <h1 style="margin:0;font-size:36px;font-weight:700;color:#1B3A2F;line-height:1.1;">
            Your Command Center<br>is ready.
          </h1>
        </td></tr>

        <!-- Body -->
        <tr><td style="padding-bottom:32px;">
          <p style="margin:0;font-size:15px;color:#4A5C50;line-height:1.6;">
            Six sections. Every tool, template, script, and resource — unlocked for life.
            Bookmark the link below and open it whenever you have a deal to run.
          </p>
        </td></tr>

        <!-- CTA -->
        <tr><td style="padding-bottom:32px;">
          <a href="${url}" style="display:inline-block;background:#1B3A2F;color:#F5F0E4;font-family:monospace;font-size:13px;padding:14px 28px;text-decoration:none;border-radius:4px;">
            open_command_center →
          </a>
        </td></tr>

        <!-- URL fallback -->
        <tr><td style="padding-bottom:40px;">
          <p style="margin:0;font-family:monospace;font-size:11px;color:#4A5C50;">
            Or copy this link:<br>
            <a href="${url}" style="color:#1B3A2F;">${url}</a>
          </p>
        </td></tr>

        <!-- Note -->
        <tr><td style="border-top:1px solid #D8D0BE;padding-top:24px;">
          <p style="margin:0;font-size:13px;color:#4A5C50;line-height:1.6;">
            This link is unique to you — don't share it. If you ever lose it, reply to this email and I'll resend it.
          </p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>
    `.trim(),
  });

  return new Response('OK', { status: 200 });
}
