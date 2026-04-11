import { getGatedPageHtml } from '@/lib/content';

export default async function ToolsPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const html = await getGatedPageHtml('01_tools.html', token);

  return <div dangerouslySetInnerHTML={{ __html: html }} />;
}
