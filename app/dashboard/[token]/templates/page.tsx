import { getGatedPageHtml } from '@/lib/content';

export default async function TemplatesPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const html = await getGatedPageHtml('02_templates.html', token);

  return <div dangerouslySetInnerHTML={{ __html: html }} />;
}
