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

// Stage-specific paywall copy
const STAGE_PAYWALL: Record<string, { label: string; title: string; body: string }> = {
  '01_get-clear.html': {
    label: '01 · Get Clear',
    title: 'Get Clear is for active members.',
    body: 'The Niche Selector, Beginner Roadmap, Portfolio Checklist, and Offer Positioning tools unlock with a Booked Out subscription.',
  },
  '02_get-visible.html': {
    label: '02 · Get Visible',
    title: 'Get Visible is for active members.',
    body: 'The Hook Generator, UGC Script Builder, and Content Prompts unlock with a Booked Out subscription.',
  },
  '03_get-paid.html': {
    label: '03 · Get Paid',
    title: 'Get Paid is for active members.',
    body: 'The Rate Calculator, Negotiation Playbook, and real market benchmarks unlock with a Booked Out subscription.',
  },
  '04_get-booked.html': {
    label: '04 · Get Booked',
    title: 'Get Booked is for active members.',
    body: 'The Pitch Generator, Outreach Scripts, Follow-up Sequences, and Brand Contacts unlock with a Booked Out subscription.',
  },
  '05_get-consistent.html': {
    label: '05 · Get Consistent',
    title: 'Get Consistent is for active members.',
    body: 'The Proposal Template, Client CRM, Onboarding Workflow, and Bookkeeping Stack unlock with a Booked Out subscription.',
  },
  '06_scale-up.html': {
    label: '06 · Scale Up',
    title: 'Scale Up is for active members.',
    body: 'The Raise Your Rates Framework, Retainers Roadmap, and Brand Psychology tools unlock with a Booked Out subscription.',
  },
  '06_bonus.html': {
    label: 'bonus · Workshop Replay',
    title: 'The Workshop Replay is for active members.',
    body: 'The full $4K deal walkthrough unlocks with a Booked Out subscription.',
  },
};

// Plan IDs from env vars (hardcoded fallbacks for safety)
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
 * Defaults to available=true on any API error.
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

    if (!res.ok) return true;

    const json = await res.json();
    const total: number = json?.meta?.total ?? (json?.data ?? []).length;
    const available = total < 100;

    await redis.set(FOUNDING_CACHE_KEY, available, { ex: FOUNDING_CACHE_TTL });
    return available;
  } catch {
    return true;
  }
}

/**
 * Injects Memberstack script + auth-aware UI into an HTML string.
 * - Protected pages (01-06): body hidden until auth check; non-members see page-specific paywall
 * - Hub (index.html): always visible; non-members see lock icons + subscribe CTA
 * - Free pages (00_start.html etc.): always visible; session indicator reflects auth state
 */
export async function injectMemberstack(
  html: string,
  filename: string,
  baseHref: string,
): Promise<string> {
  const publicKey = process.env.MEMBERSTACK_PUBLIC_KEY ?? 'pk_c06d36f5d1fa05e0db79';
  const isProtected = PROTECTED_PAGES.has(filename);
  const isHub = filename === 'index.html';

  const msScript = `<script type="module">import memberstackDOM from 'https://esm.sh/@memberstack/dom';window.memberstack=memberstackDOM.init({domain:'https://memberstack-client.mayacreativeco.com',publicKey:'${publicKey}'});</script>`;
  const hideStyle = isProtected ? `<style id="ms-gate-hide">body{visibility:hidden}</style>` : '';

  html = html.replace('<head>', `<head>\n<base href="${baseHref}">\n${msScript}\n${hideStyle}`);

  // Server-side founding check for hub CTA only
  const foundingAvailable = isHub ? await checkFoundingAvailable() : false;

  const ids = getPlanIds();

  // Build page-specific paywall HTML (stringified for safe inline injection)
  const paywallHtml = isProtected ? buildStagePaywall(filename) : '';
  const paywallJson = isProtected ? JSON.stringify(paywallHtml) : 'null';

  const navScript = `<script>
(function(){
  var t=setInterval(function(){
    if(!window.memberstack)return;
    clearInterval(t);
    window.memberstack.getCurrentMember().then(function(r){
      var member=r&&r.data;

      // ---------- Protected page gating ----------
      ${isProtected ? `
      var hideEl=document.getElementById('ms-gate-hide');
      if(hideEl)hideEl.remove();
      document.body.style.visibility='visible';
      if(!member){
        var pw=${paywallJson};
        if(pw){document.body.innerHTML=pw;}
        return;
      }
      ` : ''}

      // ---------- Session indicator ----------
      document.querySelectorAll('span').forEach(function(s){
        var txt=s.textContent.trim();
        if(txt==='session: active'||txt==='session: free_guide'){
          s.textContent=member?'session: active':'session: free_guide';
        }
        if(txt==='access: active'||txt==='access: free'){
          s.textContent=member?'access: active':'access: free';
        }
      });

      // ---------- Auth-aware nav (login / account button) ----------
      var support=document.querySelector('a[href="mailto:support@mayaherring.com"]');
      if(support&&!document.getElementById('ms-nav-btn')){
        var a=document.createElement('a');
        a.id='ms-nav-btn';
        a.className='hidden sm:inline-block text-xs font-mono text-forest border border-forest px-3 py-1.5 rounded-sharp hover:bg-forest hover:text-cream transition';
        if(member){a.href='/account.html';a.textContent='account';}
        else{a.href='/login.html';a.textContent='log_in \u2192';}
        support.parentNode.insertBefore(a,support);
      }

      // ---------- Hub: subscribe CTA for non-members ----------
      ${isHub ? `
      if(!member&&!document.getElementById('ms-hub-cta')){
        var bonusTile=document.querySelector('a[href="06_bonus.html"]');
        if(bonusTile){
          var grid=bonusTile.closest('.grid');
          if(grid){
            var cta=document.createElement('div');
            cta.id='ms-hub-cta';
            cta.style.cssText='margin-top:24px;border:2px solid #1B3A2F;border-radius:4px;background:#EDE5D2;padding:20px 24px;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:16px;';
            cta.innerHTML='<div><p style="font-family:JetBrains Mono,monospace;font-size:11px;color:#4A7C59;margin:0 0 6px;">// unlock_everything</p><p style="font-family:Space Grotesk,system-ui,sans-serif;font-size:18px;font-weight:700;color:#1B3A2F;margin:0 0 4px;">Stages 01\u201306 require a subscription.</p><p style="font-size:13px;color:#4A5C50;margin:0;">Subscribe to unlock every stage, tool, and template.</p></div><a href="/" style="font-family:JetBrains Mono,monospace;font-size:12px;font-weight:600;color:#F5F0E4;background:#1B3A2F;padding:12px 24px;border-radius:4px;text-decoration:none;white-space:nowrap;flex-shrink:0;">subscribe to unlock all stages \u2192</a>';
            grid.parentNode.insertBefore(cta,grid.nextSibling);
          }
        }
      }
      ` : ''}

    });
  },50);
})();
</script>`;

  html = html.replace('</body>', navScript + '\n</body>');
  return html;
}

// ---------------------------------------------------------------------------
// Stage-specific paywall
// ---------------------------------------------------------------------------

function buildStagePaywall(filename: string): string {
  const info = STAGE_PAYWALL[filename] ?? {
    label: 'members only',
    title: 'This stage is for active members.',
    body: 'Subscribe to unlock full access.',
  };

  const checkerboard = `background-image:linear-gradient(45deg,#1B3A2F 25%,transparent 25%),linear-gradient(-45deg,#1B3A2F 25%,transparent 25%),linear-gradient(45deg,transparent 75%,#1B3A2F 75%),linear-gradient(-45deg,transparent 75%,#1B3A2F 75%);background-size:8px 8px;background-position:0 0,0 4px,4px -4px,-4px 0`;
  const checkerboardCream = `background-image:linear-gradient(45deg,#F5F0E4 25%,transparent 25%),linear-gradient(-45deg,#F5F0E4 25%,transparent 25%),linear-gradient(45deg,transparent 75%,#F5F0E4 75%),linear-gradient(-45deg,transparent 75%,#F5F0E4 75%);background-size:12px 12px;background-position:0 0,0 6px,6px -6px,-6px 0`;

  return `<div style="min-height:100vh;display:flex;flex-direction:column;background:#F5F0E4;font-family:'Inter',system-ui,sans-serif;">

<div style="background:#0F2620;color:#F5F0E4;padding:10px 24px;display:flex;align-items:center;justify-content:space-between;font-family:'JetBrains Mono',monospace;font-size:12px;border-bottom:1px solid #1B3A2F;">
  <span><span style="color:#4A7C59;margin-right:10px">●</span>Maya_Creative_Co / booked_out</span>
  <span style="color:rgba(245,240,228,0.5)">session: free_guide · ${info.label}</span>
</div>

<header style="border-bottom:1px solid #D8D0BE;background:#F5F0E4;padding:14px 24px;display:flex;align-items:center;justify-content:space-between;">
  <a href="/dashboard/" style="display:flex;align-items:center;gap:12px;text-decoration:none;">
    <div style="width:32px;height:32px;border-radius:4px;flex-shrink:0;${checkerboard}"></div>
    <div>
      <div style="font-family:'Space Grotesk',system-ui,sans-serif;font-weight:700;color:#1B3A2F;font-size:16px;letter-spacing:-0.02em;line-height:1.2;">Booked Out</div>
      <div style="font-family:'JetBrains Mono',monospace;font-size:10px;color:#4A5C50;">command_center</div>
    </div>
  </a>
  <a href="/login.html" style="font-family:'JetBrains Mono',monospace;font-size:12px;color:#1B3A2F;border:1px solid #1B3A2F;padding:6px 14px;border-radius:4px;text-decoration:none;">log in →</a>
</header>

<main style="flex:1;display:flex;align-items:center;justify-content:center;padding:48px 24px;">
  <div style="max-width:480px;width:100%;text-align:center;">

    <p style="font-family:'JetBrains Mono',monospace;font-size:11px;color:#4A7C59;margin:0 0 14px;">// ${info.label.toLowerCase().replace(/ /g,'_').replace(/·/g,'·')}</p>
    <h2 style="font-family:'Space Grotesk',system-ui,sans-serif;font-size:clamp(24px,4vw,30px);font-weight:700;color:#1B3A2F;margin:0 0 12px;letter-spacing:-0.02em;">${info.title}</h2>
    <p style="font-size:14px;color:#4A5C50;line-height:1.6;margin:0 0 28px;">${info.body}</p>

    <div style="background:#EDE5D2;border:2px solid #1B3A2F;border-radius:4px;padding:20px 24px;margin-bottom:16px;">
      <p style="font-family:'JetBrains Mono',monospace;font-size:11px;color:#4A5C50;margin:0 0 16px;">// you're on the free tier</p>
      <a href="/" style="display:block;font-family:'JetBrains Mono',monospace;font-size:13px;font-weight:600;color:#F5F0E4;background:#1B3A2F;padding:13px 24px;border-radius:4px;text-decoration:none;">→ subscribe for access</a>
      <p style="font-size:12px;color:#4A5C50;margin:14px 0 0;">Already subscribed? <a href="/login.html" style="color:#1B3A2F;text-decoration:underline;">Log in here.</a></p>
    </div>

    <a href="/dashboard/" style="font-family:'JetBrains Mono',monospace;font-size:11px;color:#4A7C59;text-decoration:none;">← back to hub</a>

  </div>
</main>

<footer style="background:#0F2620;border-top:1px solid #1B3A2F;padding:24px;">
  <div style="max-width:1152px;margin:0 auto;display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:12px;">
    <div style="display:flex;align-items:center;gap:10px;">
      <div style="width:22px;height:22px;border-radius:4px;flex-shrink:0;${checkerboardCream}"></div>
      <span style="font-family:'JetBrains Mono',monospace;font-size:12px;color:rgba(245,240,228,0.7);">maya_creative_co / booked_out</span>
    </div>
    <span style="font-family:'JetBrains Mono',monospace;font-size:11px;color:rgba(245,240,228,0.5);">© 2026 Maya Creative Co · command center · built for UGC operators</span>
  </div>
</footer>

</div>`;
}
