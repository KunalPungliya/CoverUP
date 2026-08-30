import type { Metadata } from 'next';
import './globals.css';
import Link from 'next/link';
import { Shield } from 'lucide-react';

export const metadata: Metadata = {
  title: 'CoverUP — AI Revenue Recovery',
  description: 'AI-powered subscription revenue recovery agent',
};

const navItems = [
  { href: '/', label: 'Dashboard', icon: '📊' },
  { href: '/subscriptions', label: 'Subscriptions', icon: '💳' },
  { href: '/recovery', label: 'Recovery', icon: '🔄' },
  { href: '/audit', label: 'Audit Log', icon: '📋' },
];

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-gray-50 text-gray-900 antialiased">
        <div className="flex h-screen">
          {/* Sidebar */}
          <aside className="w-64 bg-gray-900 text-white flex flex-col fixed h-full z-10">
            <div className="p-6 border-b border-gray-700">
              <Link href="/" className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-emerald-500 flex items-center justify-center">
                  <Shield className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-lg font-bold tracking-tight">CoverUP</h1>
                  <p className="text-xs text-gray-400">AI Revenue Recovery</p>
                </div>
              </Link>
            </div>
            <nav className="flex-1 p-4 space-y-1">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-gray-300 hover:text-white hover:bg-gray-800 transition-colors"
                >
                  <span className="text-lg">{item.icon}</span>
                  {item.label}
                </Link>
              ))}
            </nav>
            <div className="p-4 border-t border-gray-700">
              <div className="px-4 py-2">
                <p className="text-xs text-gray-500">Razorpay Hackathon 2025</p>
                <p className="text-xs text-gray-600">AI Revenue Recovery Track</p>
              </div>
            </div>
          </aside>

          {/* Main Content */}
          <main className="flex-1 ml-64 overflow-y-auto">
            <div className="max-w-7xl mx-auto p-8">
              {children}
            </div>
          </main>
        </div>
      </body>
    </html>
  );
}
