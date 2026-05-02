export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function describe(val: string | undefined) {
  if (!val) return { set: false, prefix: null, length: 0 };
  return { set: true, prefix: val.slice(0, 4), length: val.length };
}

export async function GET() {
  return Response.json({
    MS_PRICE_FOUNDING:      describe(process.env.MS_PRICE_FOUNDING),
    MS_PRICE_MONTHLY:       describe(process.env.MS_PRICE_MONTHLY),
    MS_PRICE_ANNUAL:        describe(process.env.MS_PRICE_ANNUAL),
    MEMBERSTACK_PUBLIC_KEY: describe(process.env.MEMBERSTACK_PUBLIC_KEY),
    MEMBERSTACK_APP_ID:     describe(process.env.MEMBERSTACK_APP_ID),
    MEMBERSTACK_SECRET_KEY: describe(process.env.MEMBERSTACK_SECRET_KEY),
  });
}
