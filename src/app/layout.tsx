import type { Metadata } from 'next';
import { Space_Grotesk, DM_Sans, IBM_Plex_Mono } from 'next/font/google';
import './globals.css';
import { Sidebar } from '@/components/sidebar';

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
});

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-body',
  display: 'swap',
});

const ibmPlexMono = IBM_Plex_Mono({
  weight: ['400', '500', '600'],
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'SettleIQ — Autonomous Revenue Recovery OS',
  description: 'A bounded autonomous revenue operations agent for finance and growth teams that recovers involuntary churn across Indian payment rails.',
  icons: {
    icon: '/logo.png',
    shortcut: '/logo.png',
    apple: '/logo.png',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${spaceGrotesk.variable} ${dmSans.variable} ${ibmPlexMono.variable}`}>
      <body className="bg-[#171914] text-[#F2F0E6] antialiased selection:bg-[#C7F36B] selection:text-[#1C2016] font-body min-h-screen">
        <Sidebar>
          {children}
        </Sidebar>
      </body>
    </html>
  );
}


