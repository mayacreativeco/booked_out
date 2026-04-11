import { getGatedPageHtml } from '@/lib/content';

export default async function VaultPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const html = await getGatedPageHtml('05_vault.html', token);

  return <div dangerouslySetInnerHTML={{ __html: html }} />;
}
