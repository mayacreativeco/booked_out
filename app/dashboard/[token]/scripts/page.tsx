import { getGatedPageHtml } from '@/lib/content';

export default async function ScriptsPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const html = await getGatedPageHtml('03_scripts.html', token);

  return <div dangerouslySetInnerHTML={{ __html: html }} />;
}
