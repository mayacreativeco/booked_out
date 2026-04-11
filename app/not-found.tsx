export default function NotFound() {
  return (
    <main
      style={{ fontFamily: "'Inter', system-ui, sans-serif" }}
      className="min-h-screen flex items-center justify-center bg-[#F5F0E4]"
    >
      <div className="max-w-md px-8 text-center">
        <p
          className="font-mono text-xs text-[#4A7C59] mb-4 tracking-wide"
          style={{ fontFamily: "'JetBrains Mono', monospace" }}
        >
          // error_404
        </p>
        <h1
          className="text-3xl font-bold text-[#1B3A2F] mb-4"
          style={{ fontFamily: "'Space Grotesk', system-ui, sans-serif", letterSpacing: '-0.02em' }}
        >
          This link isn&apos;t valid.
        </h1>
        <p className="text-sm text-[#4A5C50] leading-relaxed mb-6">
          That dashboard link doesn&apos;t match any active client account.
          Double-check the URL you were sent, or reach out to Maya and
          she&apos;ll get you sorted.
        </p>
        <a
          href="mailto:hello@collegarestudio.com"
          className="inline-block text-xs font-mono text-[#1B3A2F] border border-[#1B3A2F] px-4 py-2"
          style={{ borderRadius: '4px' }}
        >
          contact Maya →
        </a>
      </div>
    </main>
  );
}
