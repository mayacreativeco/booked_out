import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Script from 'next/script';
import { getClientByToken } from '@/lib/clients';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

// Matches the tailwind.config embedded in each content HTML file
const TAILWIND_CONFIG = `
tailwind.config = {
  theme: {
    extend: {
      fontFamily: {
        display: ['Space Grotesk', 'system-ui', 'sans-serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      colors: {
        cream: '#F5F0E4',
        creamDeep: '#EDE5D2',
        forest: '#1B3A2F',
        forestDeep: '#0F2620',
        forestLight: '#2D5742',
        moss: '#4A7C59',
        ink: '#0A1A12',
        ash: '#4A5C50',
        line: '#D8D0BE',
      },
    },
  },
}`;

export default async function DashboardLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const client = await getClientByToken(token);

  if (!client) {
    notFound();
  }

  return (
    <>
      {/* Tailwind config must run before the CDN script reads it */}
      <Script id="tailwind-config" strategy="beforeInteractive">
        {TAILWIND_CONFIG}
      </Script>
      <Script
        src="https://cdn.tailwindcss.com"
        strategy="beforeInteractive"
      />
      {children}
    </>
  );
}
