'use client';

import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  ArrowRight, 
  Search, 
  Brain, 
  Zap,
  ShieldAlert,
  Database,
  LineChart,
  ShieldCheck,
  CreditCard,
  Layers
} from 'lucide-react';

export default function DemoPage() {
  return (
    <div className="space-y-12 pb-12 max-w-5xl mx-auto">
      {/* Section 1: Hero */}
      <div className="text-center space-y-6 py-12">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-sm font-medium border border-blue-100 mb-4">
          <span className="flex h-2 w-2 rounded-full bg-blue-600"></span>
          Built for Razorpay Hackathon 2025 · AI Revenue Recovery Track
        </div>
        <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight">
          CoverUP — <span className="text-blue-600">AI-Powered Revenue Recovery</span>
        </h1>
        <p className="text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed">
          Autonomous agent that detects failing subscriptions, reasons about the best recovery action, and executes it — all powered by Google Gemini.
        </p>
        <div className="flex justify-center gap-4 pt-4">
          <Link href="/">
            <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white h-12 px-8 text-base shadow-lg shadow-blue-200">
              Start Demo
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </div>

      {/* Section 2: How It Works */}
      <div className="space-y-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-slate-900">How It Works</h2>
          <p className="text-slate-500 mt-2">The autonomous 3-stage recovery pipeline</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 relative">
          {/* Connector Line (visible on md+) */}
          <div className="hidden md:block absolute top-1/2 left-0 right-0 h-0.5 bg-blue-100 -z-10 -translate-y-1/2"></div>

          {/* Stage 1 */}
          <Card className="relative overflow-hidden border-blue-100 shadow-md">
            <div className="absolute top-0 left-0 w-full h-1 bg-amber-500"></div>
            <CardContent className="pt-6">
              <div className="h-12 w-12 rounded-xl bg-amber-50 flex items-center justify-center mb-4 border border-amber-100">
                <Search className="h-6 w-6 text-amber-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3 flex items-center gap-2">
                Stage 1: DETECT
              </h3>
              <ul className="space-y-2 text-slate-600 text-sm">
                <li className="flex items-start gap-2">
                  <div className="mt-1 h-1.5 w-1.5 rounded-full bg-slate-400 shrink-0"></div>
                  <span>Scans all subscriptions for failed/past_due status</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="mt-1 h-1.5 w-1.5 rounded-full bg-slate-400 shrink-0"></div>
                  <span>Fetches payment attempt history</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="mt-1 h-1.5 w-1.5 rounded-full bg-slate-400 shrink-0"></div>
                  <span>Calculates risk score based on amount, days overdue, failure count, and severity</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="mt-1 h-1.5 w-1.5 rounded-full bg-slate-400 shrink-0"></div>
                  <span>Sorts by urgency (highest risk first)</span>
                </li>
              </ul>
            </CardContent>
          </Card>

          {/* Stage 2 */}
          <Card className="relative overflow-hidden border-blue-100 shadow-md transform md:-translate-y-4">
            <div className="absolute top-0 left-0 w-full h-1 bg-blue-600"></div>
            <CardContent className="pt-6">
              <div className="h-12 w-12 rounded-xl bg-blue-50 flex items-center justify-center mb-4 border border-blue-100 shadow-sm shadow-blue-100">
                <Brain className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3 flex items-center gap-2">
                Stage 2: DECIDE
              </h3>
              <ul className="space-y-2 text-slate-600 text-sm">
                <li className="flex items-start gap-2">
                  <div className="mt-1 h-1.5 w-1.5 rounded-full bg-blue-400 shrink-0"></div>
                  <span>Applies stopping rules (cooldown, max retries)</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="mt-1 h-1.5 w-1.5 rounded-full bg-blue-400 shrink-0"></div>
                  <span className="font-medium text-slate-900">Sends context to Google Gemini AI</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="mt-1 h-1.5 w-1.5 rounded-full bg-blue-400 shrink-0"></div>
                  <span>AI analyzes failure reason, customer history, payment method, and previous actions</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="mt-1 h-1.5 w-1.5 rounded-full bg-blue-400 shrink-0"></div>
                  <span>Returns recommended action + confidence score + reasoning</span>
                </li>
              </ul>
            </CardContent>
          </Card>

          {/* Stage 3 */}
          <Card className="relative overflow-hidden border-blue-100 shadow-md">
            <div className="absolute top-0 left-0 w-full h-1 bg-emerald-500"></div>
            <CardContent className="pt-6">
              <div className="h-12 w-12 rounded-xl bg-emerald-50 flex items-center justify-center mb-4 border border-emerald-100">
                <Zap className="h-6 w-6 text-emerald-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3 flex items-center gap-2">
                Stage 3: EXECUTE
              </h3>
              <ul className="space-y-2 text-slate-600 text-sm">
                <li className="flex items-start gap-2">
                  <div className="mt-1 h-1.5 w-1.5 rounded-full bg-slate-400 shrink-0"></div>
                  <span>Simulates the chosen action (retry, email, SMS, escalate)</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="mt-1 h-1.5 w-1.5 rounded-full bg-slate-400 shrink-0"></div>
                  <span>Records outcome in audit trail</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="mt-1 h-1.5 w-1.5 rounded-full bg-slate-400 shrink-0"></div>
                  <span>Updates subscription status</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="mt-1 h-1.5 w-1.5 rounded-full bg-slate-400 shrink-0"></div>
                  <span>Tracks amount recovered</span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Section 3: Key Features */}
      <div className="space-y-8 pt-8">
        <h2 className="text-3xl font-bold text-slate-900 text-center">Key Features</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          <FeatureCard 
            icon={<Brain className="h-6 w-6 text-indigo-600" />}
            title="AI-Powered Decisions"
            description="Gemini analyzes each case individually to determine the optimal recovery strategy based on historical patterns."
            bg="bg-indigo-50"
          />
          <FeatureCard 
            icon={<ShieldAlert className="h-6 w-6 text-red-600" />}
            title="Smart Stopping Rules"
            description="Prevents over-contacting customers with cooldown periods and max retry limits before escalation."
            bg="bg-red-50"
          />
          <FeatureCard 
            icon={<Database className="h-6 w-6 text-slate-600" />}
            title="Full Audit Trail"
            description="Every AI decision is logged with detailed reasoning, confidence scores, and context for complete transparency."
            bg="bg-slate-100"
          />
          <FeatureCard 
            icon={<LineChart className="h-6 w-6 text-emerald-600" />}
            title="Analytics Dashboard"
            description="Track recovery rates, total recovered revenue, action distribution, and recovery trends over time."
            bg="bg-emerald-50"
          />
          <FeatureCard 
            icon={<CreditCard className="h-6 w-6 text-blue-600" />}
            title="Multi-Payment Support"
            description="Handles various failure modes across Cards, UPI, and e-Mandates gracefully."
            bg="bg-blue-50"
          />
          <FeatureCard 
            icon={<Layers className="h-6 w-6 text-purple-600" />}
            title="Batch Processing"
            description="Process all at-risk subscriptions at once autonomously, saving manual review time."
            bg="bg-purple-50"
          />
        </div>
      </div>

      {/* Section 4: Tech Stack */}
      <div className="bg-slate-50 rounded-2xl p-8 border border-slate-100 text-center space-y-6">
        <h2 className="text-2xl font-bold text-slate-900">Tech Stack</h2>
        <div className="flex flex-wrap justify-center gap-3">
          <TechBadge>Next.js 15</TechBadge>
          <TechBadge>React 19</TechBadge>
          <TechBadge>TypeScript</TechBadge>
          <TechBadge>Tailwind CSS 4</TechBadge>
          <TechBadge>Supabase (PostgreSQL)</TechBadge>
          <TechBadge className="bg-blue-100 text-blue-800 border-blue-200">Google Gemini AI</TechBadge>
          <TechBadge>Recharts</TechBadge>
          <TechBadge>Razorpay Concepts</TechBadge>
        </div>
      </div>

      {/* Section 5: Try It CTA */}
      <div className="bg-white rounded-2xl p-8 md:p-12 border border-slate-200 shadow-sm text-center space-y-6">
        <ShieldCheck className="h-16 w-16 text-blue-600 mx-auto" />
        <h2 className="text-3xl font-bold text-slate-900">Ready to see it in action?</h2>
        <p className="text-slate-600 max-w-2xl mx-auto">
          Explore the dashboard to see metrics, view the audit log for AI reasoning, or analyze recovery trends.
        </p>
        <div className="flex flex-col sm:flex-row justify-center gap-4 pt-4">
          <Link href="/">
            <Button size="lg" className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700">
              Go to Dashboard
            </Button>
          </Link>
          <Link href="/analytics">
            <Button size="lg" variant="outline" className="w-full sm:w-auto">
              View Analytics
            </Button>
          </Link>
          <Link href="/audit">
            <Button size="lg" variant="outline" className="w-full sm:w-auto">
              See Audit Trail
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

function FeatureCard({ icon, title, description, bg }: { icon: React.ReactNode, title: string, description: string, bg: string }) {
  return (
    <Card className="border-slate-100 shadow-sm hover:shadow-md transition-shadow">
      <CardContent className="pt-6">
        <div className={`h-12 w-12 rounded-lg ${bg} flex items-center justify-center mb-4`}>
          {icon}
        </div>
        <h3 className="text-lg font-bold text-slate-900 mb-2">{title}</h3>
        <p className="text-sm text-slate-600 leading-relaxed">{description}</p>
      </CardContent>
    </Card>
  );
}

function TechBadge({ children, className = "bg-white text-slate-700 border-slate-200" }: { children: React.ReactNode, className?: string }) {
  return (
    <span className={`px-4 py-2 rounded-full border text-sm font-medium shadow-sm ${className}`}>
      {children}
    </span>
  );
}
