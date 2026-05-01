/**
 * Serves the dashboard hub (index.html) at /dashboard/
 * for subscription-based (Memberstack) access.
 */
import { readFile } from 'fs/promises';
import path from 'path';
import { injectMemberstack } from '../../lib/memberstack-html';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  let html: string;
  try {
    html = await readFile(path.join(process.cwd(), 'content', 'index.html'), 'utf-8');
  } catch {
    return new Response('Not found', { status: 404 });
  }

  html = injectMemberstack(html, 'index.html', '/dashboard/');
  return new Response(html, { headers: { 'content-type': 'text/html; charset=utf-8' } });
}
