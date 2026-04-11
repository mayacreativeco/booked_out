import { NextRequest } from 'next/server';
import { getClientByToken } from '@/lib/clients';
import { getPageHtml } from '@/lib/content';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;
  const client = await getClientByToken(token);

  if (!client) {
    return new Response('Not found', { status: 404 });
  }

  const html = await getPageHtml('', token);
  return new Response(html, {
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  });
}
