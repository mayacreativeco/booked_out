import { NextRequest } from 'next/server';
import { getClientByToken } from '@/lib/clients';
import { getPageHtml } from '@/lib/content';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string; page: string }> },
) {
  const { token, page } = await params;
  const client = await getClientByToken(token);

  if (!client) {
    return new Response('Not found', { status: 404 });
  }

  const html = await getPageHtml(page, token);
  if (!html) {
    return new Response('Not found', { status: 404 });
  }

  return new Response(html, {
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  });
}
