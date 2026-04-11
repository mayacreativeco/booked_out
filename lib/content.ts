import { readFile } from 'fs/promises';
import { join } from 'path';

/**
 * Rewrites internal .html file links to the Next.js route equivalents,
 * preserving any hash anchors (e.g. 01_tools.html#rate-calculator → /dashboard/{token}/tools#rate-calculator).
 */
function rewriteLinks(html: string, token: string): string {
  const base = `/dashboard/${token}`;
  const pages: Array<[string, string]> = [
    ['index\\.html', ''],
    ['01_tools\\.html', '/tools'],
    ['02_templates\\.html', '/templates'],
    ['03_scripts\\.html', '/scripts'],
    ['04_videos\\.html', '/videos'],
    ['05_vault\\.html', '/vault'],
    ['06_bonus\\.html', '/bonus'],
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

/**
 * Reads an HTML file from content/, rewrites internal links, then returns
 * the <style> blocks from the <head> plus the full <body> inner HTML,
 * combined into a single string suitable for dangerouslySetInnerHTML.
 */
export async function getGatedPageHtml(
  filename: string,
  token: string,
): Promise<string> {
  const raw = await readFile(join(process.cwd(), 'content', filename), 'utf-8');
  const linked = rewriteLinks(raw, token);

  // Pull <style> blocks out of <head> so custom CSS classes are preserved
  const headSection = linked.match(/<head[^>]*>([\s\S]*?)<\/head>/i)?.[1] ?? '';
  const styleBlocks = Array.from(
    headSection.matchAll(/<style[^>]*>[\s\S]*?<\/style>/gi),
  )
    .map((m) => m[0])
    .join('\n');

  const bodyContent =
    linked.match(/<body[^>]*>([\s\S]*?)<\/body>/i)?.[1] ?? '';

  return styleBlocks + '\n' + bodyContent;
}
