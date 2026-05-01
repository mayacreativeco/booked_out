/**
 * Shared Memberstack HTML injection helpers.
 * Used by both the token-based and subscription-based dashboard route handlers.
 */

import { Redis } from '@upstash/redis';

const redis = Redis.fromEnv();

const MS_API = 'https://admin.memberstack.com';
const FOUNDING_CACHE_KEY = 'founding:available';
const FOUNDING_CACHE_TTL = 300; // 5 minutes

export const PROTECTED_PAGES = new Set([
  '01_get-clear.html',
  '02_get-visible.html',
  '03_get-paid.html',
  '04_get-booked.html',
  '05_get-consistent.html',
  '06_scale-up.html',
  '06_bonus.html',
]);

// Plan IDs from env vars
export function getPlanIds() {
  return {
    founding: process.env.MS_PLAN_FOUNDING ?? 'pln_booked-out-kit-founding-annual-qrar03w5',
    annual: process.env.MS_PLAN_ANNUAL ?? 'pln_booked-out-kit-annual-1w3h0ueu',
    monthly: process.env.MS_PLAN_MONTHLY ?? 'pln_booked-out-kit-monthly-t7am03so',
  };
}

/**
 * Checks whether the Founding plan still has capacity (< 100 members).
 * Result is cached in Redis for 5 minutes.
 * Defaults to available=true on any API error to avoid hiding the offer on a blip.
 */
export async function checkFoundingAvailable(): Promise<boolean> {
  try {
    const cached = await redis.get<boolean>(FOUNDING_CACHE_KEY);
    if (cached !== null && cached !== undefined) return cached;

    const planId = getPlanIds().founding;
    const res = await fetch(
      `${MS_API}/members?planId=${encodeURIComponent(planId)}&limit=1`,
      {
        headers: { 'X-API-KEY': process.env.MEMBERSTACK_SECRET_KEY ?? '' },
        signal: AbortSignal.timeout(5000),
      },
    );

    if (!res.ok) return true; // API error — default to available

    const json = await res.json();
    // Memberstack returns meta.total or falls back to data array length
    const total: number = json?.meta?.total ?? (json?.data ?? []).length;
    const available = total < 100;

    await redis.set(FOUNDING_CACHE_KEY, available, { ex: FOUNDING_CACHE_TTL });
    return available;
  } catch {
    return true; // default to available on timeout or any error
  }
}

/**
 * Injects Memberstack script + auth-aware nav + optional gating into an HTML string.
 * @param html              Raw HTML content from the content/ directory
 * @param filename          The content filename (e.g. "01_get-clear.html")
 * @param baseHref          The base href to inject
 * @param foundingAvailable Whether the founding plan still has capacity
 */
export async function injectMemberstack(
  html: string,
  filename: string,
  baseHref: string,
): Promise<string> {
  const appId = process.env.MEMBERSTACK_APP_ID ?? '';
  const isProtected = PROTECTED_PAGES.has(filename);

  const msScript = `<script defer data-memberstack-app="${appId}" src="https://static.memberstack.com/scripts/v1/memberstack.js"></script>`;
  const hideStyle = isProtected ? `<style id="ms-gate-hide">body{visibility:hidden}</style>` : '';

  // Inject into <head>
  html = html.replace('<head>', `<head>\n<base href="${baseHref}">\n${msScript}\n${hideStyle}`);

  // Check founding availability server-side for gate wall
  const foundingAvailable = isProtected ? await checkFoundingAvailable() : false;

  // Build the gate wall HTML (used only on protected pages)
  const gateHtml = isProtected ? buildGateHtml(foundingAvailable) : '';

  // Client-side script: auth check + nav injection
  const navScript = `<script>
(function(){
  var checkMs=setInterval(function(){
    if(!window.$memberstackDom)return;
    clearInterval(checkMs);
    window.$memberstackDom.getCurrentMember().then(function(r){
      var member=r.data;
      ${isProtected ? `if(!member){document.body.innerHTML=${JSON.stringify(gateHtml)};return;}` : ''}
      document.body.style.visibility='visible';
      var support=document.querySelector('a[href="mailto:support@mayaherring.com"]');
      if(!support)return;
      var a=document.createElement('a');
      a.className='hidden sm:inline-block text-xs font-mono text-forest border border-forest px-3 py-1.5 rounded-sharp hover:bg-forest hover:text-cream transition';
      if(member){a.href='/account.html';a.textContent='account';}
      else{a.href='/login.html';a.textContent='log_in \u2192';}
      support.parentNode.insertBefore(a,support);
    });
  },50);
})();
</script>`;

  html = html.replace('</body>', navScript + '\n</body>');
  return html;
}

// ---------------------------------------------------------------------------
// Gate wall HTML
// ---------------------------------------------------------------------------

function checkoutBtn(planId: string, label: string, style: string): string {
  const escaped = planId.replace(/'/g, "\\'");
  return `<button onclick="(function(){var ms=window.$memberstackDom;if(!ms){alert('Loading \u2014 try again in a moment.');return;}ms.purchasePlansWithCheckout({planId:'${escaped}'});})()" style="${style}">${label}</button>`;
}

function buildGateHtml(foundingAvailable: boolean): string {
  const ids = getPlanIds();

  const sharedWrap = `min-height:100vh;display:flex;flex-direction:column;background:#F5F0E4;font-family:'Inter',system-ui,sans-serif;`;
  const topbar = `<div style="background:#0F2620;color:#F5F0E4;padding:10px 24px;display:flex;align-items:center;justify-content:space-between;font-family:'JetBrains Mono',monospace;font-size:12px;border-bottom:1px solid #1B3A2F;"><span>Maya_Creative_Co / booked_out</span><span style="color:rgba(245,240,228,0.5)">session: guest</span></div>`;
  const msScript = `<script defer data-memberstack-app="app_cmoncg0gk00310swu5tew967f" src="https://static.memberstack.com/scripts/v1/memberstack.js"></script>`;

  const header = `
    <div style="font-family:'JetBrains Mono',monospace;font-size:11px;color:#4A7C59;margin-bottom:16px;">// subscriber_only</div>
    <h2 style="font-family:'Space Grotesk',system-ui,sans-serif;font-size:32px;font-weight:700;color:#1B3A2F;margin:0 0 12px;letter-spacing:-0.02em;">This stage is for subscribers.</h2>
    <p style="font-size:15px;color:#4A5C50;margin:0 0 8px;">Stage 00 (Start Here) is free for everyone. Stages 01–06 require an active Booked Out subscription.</p>
    <p style="font-size:14px;color:#4A5C50;margin:0 0 28px;">Already subscribed? <a href="/login.html" style="color:#1B3A2F;text-decoration:underline;">Log in here.</a></p>`;

  const footer = `<div style="margin-top:16px;"><a href="/dashboard/00_start.html" style="font-family:'JetBrains Mono',monospace;font-size:11px;color:#4A7C59;text-decoration:none;">or access the free start guide &#8594;</a></div>`;

  let plans: string;

  if (foundingAvailable) {
    // FOUNDING PRIMARY · ANNUAL SECONDARY · MONTHLY TERTIARY
    const foundingCard = `
      <div style="position:relative;background:#EDE5D2;border:2px solid #1B3A2F;border-radius:4px;padding:28px 24px 24px;margin-bottom:12px;box-shadow:0 2px 8px rgba(27,58,47,0.10);">
        <div style="position:absolute;top:-1px;right:16px;background:#1B3A2F;color:#F5F0E4;font-family:'JetBrains Mono',monospace;font-size:10px;font-weight:600;padding:4px 10px;border-radius:0 0 4px 4px;letter-spacing:0.04em;">LIMITED: FIRST 100 MEMBERS</div>
        <div style="font-family:'JetBrains Mono',monospace;font-size:10px;color:#4A7C59;margin-bottom:6px;">// founding_annual</div>
        <div style="font-family:'Space Grotesk',system-ui,sans-serif;font-size:28px;font-weight:700;color:#1B3A2F;margin-bottom:6px;">$197<span style="font-size:15px;font-weight:400">/yr</span></div>
        <p style="font-size:13px;color:#4A5C50;margin:0 0 16px;line-height:1.5;">Locked-in pricing for as long as you stay subscribed.<br>First 100 creators only — once filled, this offer disappears.</p>
        ${checkoutBtn(ids.founding, '&#8594; Claim founding spot', 'font-family:\'JetBrains Mono\',monospace;font-size:13px;font-weight:600;color:#F5F0E4;background:#1B3A2F;padding:13px 28px;border-radius:4px;border:none;cursor:pointer;width:100%;')}
      </div>`;

    const annualCard = `
      <div style="background:#F5F0E4;border:1px solid #D8D0BE;border-radius:4px;padding:18px 20px;margin-bottom:10px;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px;">
        <div>
          <div style="font-family:'JetBrains Mono',monospace;font-size:10px;color:#4A5C50;margin-bottom:4px;">annual</div>
          <div style="font-family:'Space Grotesk',system-ui,sans-serif;font-size:20px;font-weight:700;color:#1B3A2F;">$397<span style="font-size:12px;font-weight:400">/yr</span></div>
          <div style="font-size:12px;color:#4A5C50;margin-top:2px;">Save $191 vs. monthly. Standard pricing after the founding window closes.</div>
        </div>
        ${checkoutBtn(ids.annual, 'Subscribe annually', 'font-family:\'JetBrains Mono\',monospace;font-size:11px;color:#1B3A2F;background:transparent;border:1px solid #1B3A2F;padding:9px 18px;border-radius:4px;cursor:pointer;white-space:nowrap;')}
      </div>`;

    const monthlyRow = `
      <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px;padding:10px 4px;">
        <div style="font-family:'JetBrains Mono',monospace;font-size:11px;color:#4A5C50;">monthly &nbsp;<span style="font-weight:600;color:#1B3A2F;">$49/mo</span> &nbsp;· flexible billing</div>
        ${checkoutBtn(ids.monthly, 'Subscribe monthly', 'font-family:\'JetBrains Mono\',monospace;font-size:11px;color:#4A5C50;background:transparent;border:1px solid #D8D0BE;padding:7px 14px;border-radius:4px;cursor:pointer;')}
      </div>`;

    plans = foundingCard + annualCard + monthlyRow;
  } else {
    // FOUNDING FULL — ANNUAL PRIMARY · MONTHLY SECONDARY
    const annualCard = `
      <div style="background:#EDE5D2;border:2px solid #1B3A2F;border-radius:4px;padding:28px 24px 24px;margin-bottom:12px;box-shadow:0 2px 8px rgba(27,58,47,0.10);">
        <div style="font-family:'JetBrains Mono',monospace;font-size:10px;color:#4A7C59;margin-bottom:6px;">// annual</div>
        <div style="font-family:'Space Grotesk',system-ui,sans-serif;font-size:28px;font-weight:700;color:#1B3A2F;margin-bottom:6px;">$397<span style="font-size:15px;font-weight:400">/yr</span></div>
        <p style="font-size:13px;color:#4A5C50;margin:0 0 16px;">Save $191 vs. monthly billing.</p>
        ${checkoutBtn(ids.annual, '&#8594; Subscribe annually', 'font-family:\'JetBrains Mono\',monospace;font-size:13px;font-weight:600;color:#F5F0E4;background:#1B3A2F;padding:13px 28px;border-radius:4px;border:none;cursor:pointer;width:100%;')}
      </div>`;

    const monthlyRow = `
      <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px;padding:10px 4px;">
        <div style="font-family:'JetBrains Mono',monospace;font-size:11px;color:#4A5C50;">monthly &nbsp;<span style="font-weight:600;color:#1B3A2F;">$49/mo</span> &nbsp;· flexible billing</div>
        ${checkoutBtn(ids.monthly, 'Subscribe monthly', 'font-family:\'JetBrains Mono\',monospace;font-size:11px;color:#4A5C50;background:transparent;border:1px solid #D8D0BE;padding:7px 14px;border-radius:4px;cursor:pointer;')}
      </div>`;

    plans = annualCard + monthlyRow;
  }

  return `<div style="${sharedWrap}">
${topbar}
${msScript}
<div style="flex:1;display:flex;align-items:center;justify-content:center;padding:48px 24px;">
  <div style="max-width:520px;width:100%;">
    <div style="text-align:center;">${header}</div>
    ${plans}
    <div style="text-align:center;">${footer}</div>
  </div>
</div>
</div>`;
}
