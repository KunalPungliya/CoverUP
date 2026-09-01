import type { Metadata } from 'next';
import './globals.css';
import { Sidebar } from '@/components/sidebar';

export const metadata: Metadata = {
  title: 'VaultBack — Autonomous AI Revenue Recovery',
  description: 'AI-powered subscription revenue recovery agent for modern SaaS',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-slate-50 text-slate-900 antialiased font-sans">
        <Sidebar>
          {children}
        </Sidebar>
      </body>
    </html>
  );
}

