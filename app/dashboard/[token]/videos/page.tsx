import { getGatedPageHtml } from '@/lib/content';

export default async function VideosPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const html = await getGatedPageHtml('04_videos.html', token);

  return <div dangerouslySetInnerHTML={{ __html: html }} />;
}
