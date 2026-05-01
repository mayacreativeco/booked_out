import { checkFoundingAvailable, getPlanIds } from '../../../lib/memberstack-html';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const available = await checkFoundingAvailable();
  const ids = getPlanIds();

  return Response.json({
    available,
    planIds: {
      founding: ids.founding,
      annual: ids.annual,
      monthly: ids.monthly,
    },
  });
}
