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

  // Inline client script: Memberstack init, auth redirect, checkout button wiring
  const clientScript = `
(function() {
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
})();
`;

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
        .btn-subtle { background: transparent; color: #4A5C50; border: 1px solid #D8D0BE !important; }
        .btn-subtle:hover { border-color: #1B3A2F !important; color: #1B3A2F; }
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
            <div className="f-display" style={{ fontWeight: 700, color: '#1B3A2F', fontSize: '16px' }}>Booked Out</div>
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
        <div style={{ maxWidth: '520px', width: '100%' }}>

          {/* Heading */}
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <p className="f-mono" style={{ fontSize: '11px', color: '#4A7C59', marginBottom: '14px' }}>// subscriber_only</p>
            <h1 className="f-display" style={{ fontSize: 'clamp(28px,5vw,38px)', fontWeight: 700, color: '#1B3A2F', marginBottom: '14px' }}>
              Get booked out.
            </h1>
            <p style={{ fontSize: '15px', color: '#4A5C50', lineHeight: 1.6, marginBottom: '10px' }}>
              The command center for UGC operators who want to stop chasing leads and start filling their calendar.
            </p>
            <p style={{ fontSize: '14px', color: '#4A5C50' }}>
              Already subscribed?{' '}
              <a href="/login.html" style={{ color: '#1B3A2F', textDecoration: 'underline' }}>Log in here.</a>
            </p>
          </div>

          {/* Plan cards */}
          {/* Monthly — PRIMARY (top) */}
          <div style={{ background: '#EDE5D2', border: '2px solid #1B3A2F', borderRadius: '4px', padding: '24px', marginBottom: '12px', boxShadow: '0 2px 12px rgba(27,58,47,0.10)' }}>
            <p className="f-mono" style={{ fontSize: '10px', color: '#4A5C50', marginBottom: '6px' }}>// monthly</p>
            <div className="f-display" style={{ fontSize: '30px', fontWeight: 700, color: '#1B3A2F', marginBottom: '6px' }}>
              $49<span style={{ fontSize: '16px', fontWeight: 400 }}>/mo</span>
            </div>
            <p style={{ fontSize: '13px', color: '#4A5C50', lineHeight: 1.6, marginBottom: '18px' }}>
              Flexible monthly billing. Cancel anytime.
            </p>
            <button
              className="btn btn-forest"
              data-plan-id={ids.monthly}
              style={{ fontSize: '13px', fontWeight: 600, padding: '13px 28px', borderRadius: '4px', width: '100%' }}
            >
              → Subscribe monthly
            </button>
          </div>

          {foundingAvailable && (
            /* Founding Annual — PRIMARY (below monthly, limited offer) */
            <div style={{ position: 'relative', background: '#EDE5D2', border: '2px solid #1B3A2F', borderRadius: '4px', padding: '28px 24px 24px', marginBottom: '12px', boxShadow: '0 2px 12px rgba(27,58,47,0.10)' }}>
              <div className="f-mono" style={{ position: 'absolute', top: '-1px', right: '16px', background: '#1B3A2F', color: '#F5F0E4', fontSize: '10px', fontWeight: 600, padding: '4px 10px', borderRadius: '0 0 4px 4px', letterSpacing: '0.04em' }}>
                LIMITED: FIRST 100 MEMBERS
              </div>
              <p className="f-mono" style={{ fontSize: '10px', color: '#4A7C59', marginBottom: '6px' }}>// founding_annual</p>
              <div className="f-display" style={{ fontSize: '30px', fontWeight: 700, color: '#1B3A2F', marginBottom: '6px' }}>
                $197<span style={{ fontSize: '16px', fontWeight: 400 }}>/yr</span>
              </div>
              <p style={{ fontSize: '13px', color: '#4A5C50', lineHeight: 1.6, marginBottom: '18px' }}>
                Locked-in pricing for as long as you stay subscribed.<br />
                First 100 creators only — once filled, this offer disappears.
              </p>
              <button
                className="btn btn-forest"
                data-plan-id={ids.founding}
                style={{ fontSize: '13px', fontWeight: 600, padding: '13px 28px', borderRadius: '4px', width: '100%' }}
              >
                → Claim founding spot
              </button>
            </div>
          )}

          <div style={{ textAlign: 'center', marginTop: '24px' }}>
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
