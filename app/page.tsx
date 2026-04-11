export default function HomePage() {
  return (
    <main
      style={{ fontFamily: "'Inter', system-ui, sans-serif" }}
      className="min-h-screen flex items-center justify-center bg-[#F5F0E4]"
    >
      <div className="max-w-md px-8 text-center">
        <div
          className="w-10 h-10 mx-auto mb-6"
          style={{
            backgroundImage:
              'linear-gradient(45deg,#1B3A2F 25%,transparent 25%),' +
              'linear-gradient(-45deg,#1B3A2F 25%,transparent 25%),' +
              'linear-gradient(45deg,transparent 75%,#1B3A2F 75%),' +
              'linear-gradient(-45deg,transparent 75%,#1B3A2F 75%)',
            backgroundSize: '8px 8px',
            backgroundPosition: '0 0,0 4px,4px -4px,-4px 0',
            borderRadius: '4px',
          }}
        />
        <h1
          className="text-2xl font-bold text-[#1B3A2F] mb-3"
          style={{ fontFamily: "'Space Grotesk', system-ui, sans-serif", letterSpacing: '-0.02em' }}
        >
          Booked Out
        </h1>
        <p className="text-sm text-[#4A5C50] leading-relaxed">
          This is a private client portal. If you&apos;re a Booked Out client,
          use the unique link you received from Maya to access your dashboard.
        </p>
        <a
          href="mailto:hello@collegarestudio.com"
          className="inline-block mt-6 text-xs text-[#1B3A2F] border border-[#1B3A2F] px-4 py-2"
          style={{ fontFamily: "'JetBrains Mono', monospace", borderRadius: '4px' }}
        >
          contact Maya →
        </a>
      </div>
    </main>
  );
}
