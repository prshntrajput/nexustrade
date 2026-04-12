import type { Metadata } from 'next';
import { Geist } from 'next/font/google';
import './globals.css';
import Providers from './providers';

const geist = Geist({
  variable: '--font-geist',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'NexusTrade — AI Stock Research Terminal',
  description:
    'Real-time stock monitoring, technical indicators, and AI-powered analysis.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      // ← Fixes "Detected scroll-behavior: smooth on <html> element" warning
      data-scroll-behavior="smooth"
    >
      <body
        className={`${geist.variable} font-sans antialiased`}
        // ← Suppresses browser extension attribute injection (e.g. ColorZilla
        //   adds cz-shortcut-listen="true" which causes hydration mismatch)
        suppressHydrationWarning
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}