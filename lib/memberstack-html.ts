/**
 * Shared Memberstack HTML injection helpers.
 * Used by both the token-based and subscription-based dashboard route handlers.
 */

export const PROTECTED_PAGES = new Set([
  '01_get-clear.html',
  '02_get-visible.html',
  '03_get-paid.html',
  '04_get-booked.html',
  '05_get-consistent.html',
  '06_scale-up.html',
  '06_bonus.html',
]);

/**
 * Injects Memberstack script + auth-aware nav + optional gating into an HTML string.
 * @param html      Raw HTML content from the content/ directory
 * @param filename  The content filename (e.g. "01_get-clear.html")
 * @param baseHref  The base href to inject (e.g. "/dashboard/" or "/dashboard/TOKEN/")
 */
export function injectMemberstack(html: string, filename: string, baseHref: string): string {
  const appId = process.env.MEMBERSTACK_APP_ID ?? '';
  const isProtected = PROTECTED_PAGES.has(filename);

  const msScript = `<script defer data-memberstack-app="${appId}" src="https://static.memberstack.com/scripts/v1/memberstack.js"></script>`;
  const hideStyle = isProtected ? `<style id="ms-gate-hide">body{visibility:hidden}</style>` : '';

  // Inject into <head>
  html = html.replace('<head>', `<head>\n<base href="${baseHref}">\n${msScript}\n${hideStyle}`);

  // Build the gate wall HTML (used only on protected pages)
  const gateHtml = isProtected ? buildGateHtml() : '';

  // Client-side script: auth check + nav injection
  // setInterval polls for Memberstack SDK load (it's deferred, DOM may not have it yet)
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

function buildGateHtml(): string {
  return `<div style="min-height:100vh;display:flex;flex-direction:column;background:#F5F0E4;font-family:'Inter',system-ui,sans-serif;">
<div style="background:#0F2620;color:#F5F0E4;padding:10px 24px;display:flex;align-items:center;justify-content:space-between;font-family:'JetBrains Mono',monospace;font-size:12px;border-bottom:1px solid #1B3A2F;">
  <span>Maya_Creative_Co / booked_out</span><span style="color:rgba(245,240,228,0.5)">session: guest</span>
</div>
<div style="flex:1;display:flex;align-items:center;justify-content:center;padding:48px 24px;">
  <div style="max-width:480px;width:100%;text-align:center;">
    <div style="font-family:'JetBrains Mono',monospace;font-size:11px;color:#4A7C59;margin-bottom:16px;">// subscriber_only</div>
    <h2 style="font-family:'Space Grotesk',system-ui,sans-serif;font-size:32px;font-weight:700;color:#1B3A2F;margin:0 0 12px;letter-spacing:-0.02em;">This stage is for subscribers.</h2>
    <p style="font-size:15px;color:#4A5C50;margin:0 0 10px;">Stage 00 (Start Here) is free for everyone. Stages 01–06 require an active Booked Out subscription.</p>
    <p style="font-size:14px;color:#4A5C50;margin:0 0 32px;">Already subscribed? Log in below.</p>
    <div style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap;">
      <a href="/login.html" style="font-family:'JetBrains Mono',monospace;font-size:12px;font-weight:600;color:#F5F0E4;background:#1B3A2F;padding:11px 22px;border-radius:4px;text-decoration:none;display:inline-block;">&#8594; log_in</a>
      <a href="https://CHECKOUT_URL_PLACEHOLDER" style="font-family:'JetBrains Mono',monospace;font-size:12px;color:#1B3A2F;border:1px solid #1B3A2F;padding:11px 22px;border-radius:4px;text-decoration:none;display:inline-block;">subscribe &middot; $29/mo</a>
    </div>
    <div style="margin-top:24px;"><a href="/dashboard/00_start.html" style="font-family:'JetBrains Mono',monospace;font-size:11px;color:#4A7C59;text-decoration:none;">or access the free start guide &#8594;</a></div>
  </div>
</div>
</div>`;
}
