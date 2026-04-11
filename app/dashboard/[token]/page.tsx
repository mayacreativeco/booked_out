import { getGatedPageHtml } from '@/lib/content';

export default async function DashboardHomePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const html = await getGatedPageHtml('index.html', token);

  return <div dangerouslySetInnerHTML={{ __html: html }} />;
}
