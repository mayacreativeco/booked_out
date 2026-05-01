import { Redis } from '@upstash/redis';
import { readFile } from 'fs/promises';
import path from 'path';
import { NextRequest } from 'next/server';

const redis = Redis.fromEnv();

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string; path?: string[] }> },
) {
  const { token, path: pathSegments } = await params;

  const client = await redis.get(`client:${token}`);
  if (!client) {
    return new Response('Not found', { status: 404 });
  }

  const filename =
    !pathSegments || pathSegments.length === 0
      ? 'index.html'
      : pathSegments.join('/');

  if (filename.includes('..') || !filename.endsWith('.html')) {
    return new Response('Not found', { status: 404 });
  }

  let html: string;
  try {
    html = await readFile(
      path.join(process.cwd(), 'content', filename),
      'utf-8',
    );
  } catch {
    return new Response('Not found', { status: 404 });
  }

  const baseFile = filename === 'index.html' ? '' : filename;
  html = html.replace('<head>', `<head>\n<base href="/dashboard/${token}/${baseFile}">`);

  return new Response(html, {
    headers: { 'content-type': 'text/html; charset=utf-8' },
  });
}
