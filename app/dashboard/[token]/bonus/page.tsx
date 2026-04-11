import { getGatedPageHtml } from '@/lib/content';

export default async function BonusPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const html = await getGatedPageHtml('06_bonus.html', token);

  return <div dangerouslySetInnerHTML={{ __html: html }} />;
}
