import { Redis } from '@upstash/redis';
import { readFile } from 'fs/promises';
import path from 'path';
import { NextRequest } from 'next/server';
import { injectMemberstack } from '../../../../lib/memberstack-html';

const redis = Redis.fromEnv();

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string; path?: string[] }> },
) {
  const { token, path: pathSegments } = await params;

  // Try token-based lookup first (backward compat for existing customers)
  const client = await redis.get(`client:${token}`);

  let filename: string;
  let baseHref: string;

  if (client) {
    // Legacy token-based access
    baseHref = `/dashboard/${token}/`;
    filename = !pathSegments || pathSegments.length === 0
      ? 'index.html'
      : pathSegments.join('/');
  } else {
    // Subscription-based access — "token" slot is actually the first path segment
    baseHref = `/dashboard/`;
    const allParts = [token, ...(pathSegments ?? [])].filter(Boolean);
    filename = allParts.length > 0 ? allParts.join('/') : 'index.html';
  }

  if (filename.includes('..') || !filename.endsWith('.html')) {
    return new Response('Not found', { status: 404 });
  }

  let html: string;
  try {
    html = await readFile(path.join(process.cwd(), 'content', filename), 'utf-8');
  } catch {
    return new Response('Not found', { status: 404 });
  }

  html = injectMemberstack(html, filename, baseHref);

  return new Response(html, {
    headers: { 'content-type': 'text/html; charset=utf-8' },
  });
}
