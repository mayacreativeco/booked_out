import Stripe from 'stripe';

export const dynamic = 'force-dynamic';

interface Props {
  searchParams: Promise<{ session_id?: string }>;
}

export default async function WelcomePage({ searchParams }: Props) {
  const { session_id } = await searchParams;
  let email = '';

  if (session_id) {
    try {
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
      const session = await stripe.checkout.sessions.retrieve(session_id);
      email = session.customer_details?.email ?? '';
    } catch {
      // non-fatal — show generic copy
    }
  }

  const checkerboard = {
    backgroundImage:
      'linear-gradient(45deg,#1B3A2F 25%,transparent 25%),' +
      'linear-gradient(-45deg,#1B3A2F 25%,transparent 25%),' +
      'linear-gradient(45deg,transparent 75%,#1B3A2F 75%),' +
      'linear-gradient(-45deg,transparent 75%,#1B3A2F 75%)',
    backgroundSize: '8px 8px',
    backgroundPosition: '0 0,0 4px,4px -4px,-4px 0',
    borderRadius: '4px',
  };

  const checkerboardCream = {
    backgroundImage:
      'linear-gradient(45deg,#F5F0E4 25%,transparent 25%),' +
      'linear-gradient(-45deg,#F5F0E4 25%,transparent 25%),' +
      'linear-gradient(45deg,transparent 75%,#F5F0E4 75%),' +
      'linear-gradient(-45deg,transparent 75%,#F5F0E4 75%)',
    backgroundSize: '12px 12px',
    backgroundPosition: '0 0,0 6px,6px -6px,-6px 0',
    borderRadius: '4px',
  };

  return (
    <>
      <style>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #F5F0E4; color: #0A1A12; font-family: 'Inter', system-ui, sans-serif; }
        .f-display { font-family: 'Space Grotesk', system-ui, sans-serif; letter-spacing: -0.02em; }
        .f-mono { font-family: 'JetBrains Mono', monospace; }
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@700&family=Inter:wght@400;500&family=JetBrains+Mono:wght@400;600&display=swap');
      `}</style>

      {/* Top bar */}
      <div style={{ background: '#0F2620', borderBottom: '1px solid #1B3A2F', padding: '10px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span className="f-mono" style={{ fontSize: '12px', color: '#F5F0E4' }}>
          <span style={{ color: '#4A7C59', marginRight: '12px' }}>●</span>Maya_Creative_Co / booked_out
        </span>
        <span className="f-mono" style={{ fontSize: '12px', color: 'rgba(245,240,228,0.5)' }}>session: payment_received</span>
      </div>

      {/* Header */}
      <header style={{ borderBottom: '1px solid #D8D0BE', background: '#F5F0E4', padding: '14px 24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{ width: '32px', height: '32px', flexShrink: 0, ...checkerboard }} />
        <div style={{ lineHeight: 1.2 }}>
          <div className="f-display" style={{ fontWeight: 700, color: '#1B3A2F', fontSize: '16px' }}>Booked Out</div>
          <div className="f-mono" style={{ fontSize: '10px', color: '#4A5C50' }}>command_center</div>
        </div>
      </header>

      {/* Main */}
      <main style={{ minHeight: 'calc(100vh - 120px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '48px 24px' }}>
        <div style={{ maxWidth: '480px', width: '100%' }}>

          <p className="f-mono" style={{ fontSize: '11px', color: '#4A7C59', marginBottom: '16px' }}>// payment_received</p>

          <h1 className="f-display" style={{ fontSize: 'clamp(40px,6vw,64px)', fontWeight: 700, color: '#1B3A2F', marginBottom: '20px', lineHeight: 1.05 }}>
            You&rsquo;re in.
          </h1>

          <div style={{ background: '#EDE5D2', border: '2px solid #1B3A2F', borderRadius: '4px', padding: '24px 28px', marginBottom: '20px' }}>
            <p className="f-mono" style={{ fontSize: '10px', color: '#4A7C59', marginBottom: '12px' }}>// next_steps</p>
            <p style={{ fontSize: '15px', color: '#0A1A12', lineHeight: 1.65, marginBottom: '12px' }}>
              Check your inbox — a link to set your password and access the command center is on its way.
              {email && (
                <span style={{ display: 'block', marginTop: '8px', fontFamily: 'JetBrains Mono, monospace', fontSize: '12px', color: '#4A5C50' }}>
                  Sent to: {email}
                </span>
              )}
            </p>
            <p style={{ fontSize: '13px', color: '#4A5C50', lineHeight: 1.6 }}>
              Should arrive within a minute. If it doesn&rsquo;t show up, check your spam folder or{' '}
              <a href="mailto:support@mayaherring.com" style={{ color: '#1B3A2F', textDecoration: 'underline' }}>
                email support
              </a>.
            </p>
          </div>

          <div style={{ borderLeft: '2px solid #D8D0BE', paddingLeft: '16px' }}>
            <p className="f-mono" style={{ fontSize: '10px', color: '#4A5C50', marginBottom: '8px' }}>// what_happens_next</p>
            <ol style={{ fontSize: '13px', color: '#4A5C50', lineHeight: 1.8, paddingLeft: '16px' }}>
              <li>Open the email from Booked Out</li>
              <li>Click "Set your password" → enter your email</li>
              <li>Check inbox again for the magic login link</li>
              <li>Click it → set password → you&rsquo;re in the dashboard</li>
            </ol>
          </div>

        </div>
      </main>

      {/* Footer */}
      <footer style={{ background: '#0F2620', borderTop: '1px solid #1B3A2F', padding: '24px' }}>
        <div style={{ maxWidth: '1152px', margin: '0 auto', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '22px', height: '22px', flexShrink: 0, ...checkerboardCream }} />
            <span className="f-mono" style={{ fontSize: '12px', color: 'rgba(245,240,228,0.7)' }}>maya_creative_co / booked_out</span>
          </div>
          <span className="f-mono" style={{ fontSize: '11px', color: 'rgba(245,240,228,0.5)' }}>© 2026 Maya Creative Co · command center · built for UGC operators</span>
        </div>
      </footer>
    </>
  );
}
