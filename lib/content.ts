import { readFile } from 'fs/promises';
import { join } from 'path';

const PAGE_MAP: Record<string, string> = {
  '':          'index.html',
  'tools':     '01_tools.html',
  'templates': '02_templates.html',
  'scripts':   '03_scripts.html',
  'videos':    '04_videos.html',
  'vault':     '05_vault.html',
  'bonus':     '06_bonus.html',
};

function rewriteLinks(html: string, token: string): string {
  const base = `/dashboard/${token}`;
  const pages: Array<[string, string]> = [
    ['index\\.html',       ''],
    ['01_tools\\.html',    '/tools'],
    ['02_templates\\.html','/templates'],
    ['03_scripts\\.html',  '/scripts'],
    ['04_videos\\.html',   '/videos'],
    ['05_vault\\.html',    '/vault'],
    ['06_bonus\\.html',    '/bonus'],
  ];

  let result = html;
  for (const [pattern, path] of pages) {
    result = result.replace(
      new RegExp(`href="${pattern}(#[^"]*)?"`,'g'),
      (_match, anchor) => `href="${base}${path}${anchor ?? ''}"`,
    );
  }
  return result;
}

export async function getPageHtml(page: string, token: string): Promise<string | null> {
  const filename = PAGE_MAP[page];
  if (!filename) return null;

  const raw = await readFile(join(process.cwd(), 'content', filename), 'utf-8');
  return rewriteLinks(raw, token);
}
