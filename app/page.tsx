import { checkFoundingAvailable, getPlanIds } from '../lib/memberstack-html';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const foundingAvailable = await checkFoundingAvailable();
  const ids = getPlanIds();

  const checkerboard: React.CSSProperties = {
    backgroundImage:
      'linear-gradient(45deg,#1B3A2F 25%,transparent 25%),' +
      'linear-gradient(-45deg,#1B3A2F 25%,transparent 25%),' +
      'linear-gradient(45deg,transparent 75%,#1B3A2F 75%),' +
      'linear-gradient(-45deg,transparent 75%,#1B3A2F 75%)',
    backgroundSize: '8px 8px',
    backgroundPosition: '0 0,0 4px,4px -4px,-4px 0',
    borderRadius: '4px',
  };

  const checkerboardCream: React.CSSProperties = {
    backgroundImage:
      'linear-gradient(45deg,#F5F0E4 25%,transparent 25%),' +
      'linear-gradient(-45deg,#F5F0E4 25%,transparent 25%),' +
      'linear-gradient(45deg,transparent 75%,#F5F0E4 75%),' +
      'linear-gradient(-45deg,transparent 75%,#F5F0E4 75%)',
    backgroundSize: '12px 12px',
    backgroundPosition: '0 0,0 6px,6px -6px,-6px 0',
    borderRadius: '4px',
  };

  // Inline client script: Memberstack init, auth redirect, checkout wiring, typewriter
  const clientScript = `
(function() {
  // Memberstack init + auth redirect
  var s = document.createElement('script');
  s.type = 'module';
  s.textContent = [
    "import memberstackDOM from 'https://esm.sh/@memberstack/dom';",
    "window.memberstack = memberstackDOM.init({ domain: 'https://memberstack-client.mayacreativeco.com', publicKey: 'pk_c06d36f5d1fa05e0db79' });",
    "var t = setInterval(function() {",
    "  if (!window.memberstack) return;",
    "  clearInterval(t);",
    "  window.memberstack.getCurrentMember().then(function(r) {",
    "    if (r && r.data) window.location.href = '/dashboard/';",
    "  });",
    "}, 50);"
  ].join('');
  document.head.appendChild(s);

  // Wire checkout buttons
  document.addEventListener('click', function(e) {
    var btn = e.target.closest('[data-plan-id]');
    if (!btn) return;
    var planId = btn.getAttribute('data-plan-id');
    if (!planId) return;
    var ms = window.memberstack;
    if (!ms) { alert('Loading — try again in a moment.'); return; }
    ms.purchasePlansWithCheckout({ planId: planId });
  });

  // Typewriter on brand wordmark — types out, resets after 60s, loops
  function startTypewriter() {
    var full = 'Booked Out';
    var el = document.getElementById('brand-wordmark');
    if (!el) return;
    function type(i) {
      el.textContent = full.slice(0, i);
      if (i < full.length) {
        setTimeout(function() { type(i + 1); }, 75);
      } else {
        setTimeout(function() { type(0); }, 60000);
      }
    }
    el.textContent = '';
    type(0);
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', startTypewriter);
  } else {
    startTypewriter();
  }
})();
`;

  // Primary card shared styles
  const primaryCard: React.CSSProperties = {
    position: 'relative',
    background: '#EDE5D2',
    border: '2px solid #1B3A2F',
    borderRadius: '4px',
    padding: '36px 28px 32px',
    marginBottom: '12px',
    boxShadow: '0 4px 20px rgba(27,58,47,0.13)',
  };

  // Secondary card shared styles
  const secondaryCard: React.CSSProperties = {
    background: '#EDE5D2',
    border: '1.5px solid #C8C0AE',
    borderRadius: '4px',
    padding: '20px 22px 18px',
    marginBottom: '12px',
    boxShadow: '0 1px 6px rgba(27,58,47,0.06)',
  };

  return (
    <>
      <style>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #F5F0E4; color: #0A1A12; font-family: 'Inter', system-ui, sans-serif; }
        .f-display { font-family: 'Space Grotesk', system-ui, sans-serif; letter-spacing: -0.02em; }
        .f-mono { font-family: 'JetBrains Mono', monospace; }
        .btn { cursor: pointer; border: none; font-family: 'JetBrains Mono', monospace; transition: opacity 0.15s, background 0.15s, color 0.15s; }
        .btn-forest { background: #1B3A2F; color: #F5F0E4; }
        .btn-forest:hover { background: #0F2620; }
        .btn-ghost { background: transparent; color: #1B3A2F; border: 1px solid #1B3A2F !important; }
        .btn-ghost:hover { background: #1B3A2F; color: #F5F0E4; }
        .btn-muted { background: transparent; color: #4A5C50; border: 1px solid #C8C0AE !important; }
        .btn-muted:hover { border-color: #1B3A2F !important; color: #1B3A2F; }
        #brand-wordmark { min-width: 1ch; display: inline-block; }
      `}</style>

      {/* Top bar */}
      <div style={{ background: '#0F2620', borderBottom: '1px solid #1B3A2F', padding: '10px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span className="f-mono" style={{ fontSize: '12px', color: '#F5F0E4' }}>
          <span style={{ color: '#4A7C59', marginRight: '12px' }}>●</span>Maya_Creative_Co / booked_out
        </span>
        <span className="f-mono" style={{ fontSize: '12px', color: 'rgba(245,240,228,0.5)' }}>session: guest</span>
      </div>

      {/* Header */}
      <header style={{ borderBottom: '1px solid #D8D0BE', background: '#F5F0E4', padding: '14px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '32px', height: '32px', flexShrink: 0, ...checkerboard }} />
          <div style={{ lineHeight: 1.2 }}>
            <div className="f-display" style={{ fontWeight: 700, color: '#1B3A2F', fontSize: '16px' }}>
              <span id="brand-wordmark">Booked Out</span>
            </div>
            <div className="f-mono" style={{ fontSize: '10px', color: '#4A5C50' }}>command_center</div>
          </div>
        </div>
        <a
          href="/login.html"
          className="f-mono btn btn-ghost"
          style={{ fontSize: '12px', padding: '6px 14px', borderRadius: '4px', textDecoration: 'none' }}
        >
          log in →
        </a>
      </header>

      {/* Main */}
      <main style={{ minHeight: 'calc(100vh - 168px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '48px 24px' }}>
        <div style={{ maxWidth: '540px', width: '100%' }}>

          {/* Heading */}
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <p className="f-mono" style={{ fontSize: '11px', color: '#4A7C59', marginBottom: '16px' }}>// subscriber_only</p>
            <h1 className="f-display" style={{ fontSize: 'clamp(40px,6vw,72px)', fontWeight: 700, color: '#1B3A2F', marginBottom: '16px', lineHeight: 1.05 }}>
              Get booked out.
            </h1>
            <p style={{ fontSize: '15px', color: '#4A5C50', lineHeight: 1.6, marginBottom: '18px' }}>
              The command center for UGC operators who want to stop chasing leads and start filling their calendar.
            </p>
            {/* Trust signal */}
            <p className="f-mono" style={{ fontSize: '10px', color: '#4A5C50', letterSpacing: '0.03em', marginBottom: '10px', opacity: 0.8 }}>
              390+ ad creatives shipped · 5+ yrs building for DTC · 267 brand clients
            </p>
            <p style={{ fontSize: '14px', color: '#4A5C50' }}>
              Already subscribed?{' '}
              <a href="/login.html" style={{ color: '#1B3A2F', textDecoration: 'underline' }}>Log in here.</a>
            </p>
          </div>

          {/* Plan cards */}
          {foundingAvailable ? (
            <>
              {/* Founding Annual — PRIMARY (top, large) */}
              <div style={primaryCard}>
                <div className="f-mono" style={{ position: 'absolute', top: '-1px', right: '16px', background: '#1B3A2F', color: '#F5F0E4', fontSize: '10px', fontWeight: 600, padding: '4px 10px', borderRadius: '0 0 4px 4px', letterSpacing: '0.04em' }}>
                  LIMITED: FIRST 100 MEMBERS
                </div>
                <p className="f-mono" style={{ fontSize: '10px', color: '#4A7C59', marginBottom: '10px' }}>// founding_annual</p>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px', marginBottom: '12px', flexWrap: 'wrap' }}>
                  <div className="f-display" style={{ fontSize: '44px', fontWeight: 700, color: '#1B3A2F', lineHeight: 1 }}>
                    $197<span style={{ fontSize: '20px', fontWeight: 400 }}>/yr</span>
                  </div>
                  <span className="f-mono" style={{ fontSize: '11px', color: '#4A5C50', opacity: 0.75 }}>(usually $397/yr)</span>
                </div>
                <p style={{ fontSize: '14px', color: '#4A5C50', lineHeight: 1.65, marginBottom: '24px' }}>
                  First 100 creators only. Locked in at $197 for as long as you stay subscribed. After 100 members, this offer disappears and standard pricing ($397/yr) takes over.
                </p>
                <button
                  className="btn btn-forest"
                  data-plan-id={ids.founding}
                  style={{ fontSize: '14px', fontWeight: 600, padding: '15px 28px', borderRadius: '4px', width: '100%', letterSpacing: '0.01em' }}
                >
                  → Claim founding spot
                </button>
              </div>

              {/* Monthly — SECONDARY (below, smaller) */}
              <div style={secondaryCard}>
                <p className="f-mono" style={{ fontSize: '10px', color: '#4A5C50', marginBottom: '6px' }}>// monthly</p>
                <div className="f-display" style={{ fontSize: '26px', fontWeight: 700, color: '#1B3A2F', marginBottom: '6px' }}>
                  $49<span style={{ fontSize: '14px', fontWeight: 400 }}>/mo</span>
                </div>
                <p style={{ fontSize: '13px', color: '#4A5C50', lineHeight: 1.6, marginBottom: '14px' }}>
                  Flexible monthly billing. Cancel anytime. No founding lock-in.
                </p>
                <button
                  className="btn btn-muted"
                  data-plan-id={ids.monthly}
                  style={{ fontSize: '12px', fontWeight: 600, padding: '11px 24px', borderRadius: '4px', width: '100%' }}
                >
                  → Subscribe monthly
                </button>
              </div>
            </>
          ) : (
            <>
              {/* Founding sold out — Annual $397 PRIMARY */}
              <div style={primaryCard}>
                <p className="f-mono" style={{ fontSize: '10px', color: '#4A5C50', marginBottom: '10px' }}>// annual</p>
                <div className="f-display" style={{ fontSize: '44px', fontWeight: 700, color: '#1B3A2F', lineHeight: 1, marginBottom: '12px' }}>
                  $397<span style={{ fontSize: '20px', fontWeight: 400 }}>/yr</span>
                </div>
                <p style={{ fontSize: '14px', color: '#4A5C50', lineHeight: 1.65, marginBottom: '24px' }}>
                  Full access to every stage, tool, template, and script. Billed annually.
                </p>
                <button
                  className="btn btn-forest"
                  data-plan-id={ids.annual}
                  style={{ fontSize: '14px', fontWeight: 600, padding: '15px 28px', borderRadius: '4px', width: '100%', letterSpacing: '0.01em' }}
                >
                  → Subscribe annually
                </button>
              </div>

              {/* Monthly — SECONDARY */}
              <div style={secondaryCard}>
                <p className="f-mono" style={{ fontSize: '10px', color: '#4A5C50', marginBottom: '6px' }}>// monthly</p>
                <div className="f-display" style={{ fontSize: '26px', fontWeight: 700, color: '#1B3A2F', marginBottom: '6px' }}>
                  $49<span style={{ fontSize: '14px', fontWeight: 400 }}>/mo</span>
                </div>
                <p style={{ fontSize: '13px', color: '#4A5C50', lineHeight: 1.6, marginBottom: '14px' }}>
                  Flexible monthly billing. Cancel anytime.
                </p>
                <button
                  className="btn btn-muted"
                  data-plan-id={ids.monthly}
                  style={{ fontSize: '12px', fontWeight: 600, padding: '11px 24px', borderRadius: '4px', width: '100%' }}
                >
                  → Subscribe monthly
                </button>
              </div>
            </>
          )}

          <div style={{ textAlign: 'center', marginTop: '20px' }}>
            <a href="/dashboard/00_start.html" className="f-mono" style={{ fontSize: '11px', color: '#4A7C59', textDecoration: 'none' }}>
              or access the free start guide →
            </a>
          </div>

        </div>
      </main>

      {/* Footer */}
      <footer style={{ background: '#0F2620', borderTop: '1px solid #1B3A2F', padding: '28px 24px' }}>
        <div style={{ maxWidth: '1152px', margin: '0 auto', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '24px', height: '24px', flexShrink: 0, ...checkerboardCream }} />
            <span className="f-mono" style={{ fontSize: '12px', color: 'rgba(245,240,228,0.7)' }}>maya_creative_co / booked_out</span>
          </div>
          <span className="f-mono" style={{ fontSize: '11px', color: 'rgba(245,240,228,0.5)' }}>© 2026 Maya Creative Co · command center · built for UGC operators</span>
        </div>
      </footer>

      <script dangerouslySetInnerHTML={{ __html: clientScript }} />
    </>
  );
}
