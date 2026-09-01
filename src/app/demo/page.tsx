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
    <div className="space-y-10 pb-12 max-w-5xl mx-auto">
      {/* Hero */}
      <div className="text-center space-y-4 py-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-semibold border border-indigo-100 mb-2">
          <span className="flex h-2 w-2 rounded-full bg-indigo-600"></span>
          Autonomous AI Revenue Protection
        </div>
        <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 tracking-tight">
          CoverUP — <span className="text-indigo-600">Autonomous Dunning & Revenue Recovery</span>
        </h1>
        <p className="text-sm md:text-base text-gray-600 max-w-2xl mx-auto leading-relaxed">
          Self-operating intelligence that detects failing subscriptions, reasons about optimal recovery actions, and executes workflows powered by Google Gemini.
        </p>
        <div className="flex justify-center gap-3 pt-2">
          <Link href="/">
            <Button size="lg" variant="default" className="gap-2 shadow-xs">
              Open Dashboard
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>

      {/* 3-Stage Pipeline */}
      <div className="space-y-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900">How CoverUP Operates</h2>
          <p className="text-xs text-gray-500 mt-1">The autonomous 3-stage revenue recovery loop</p>
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          {/* Stage 1 */}
          <Card className="hover:border-gray-300 transition-all">
            <CardContent className="pt-6 space-y-3">
              <div className="h-10 w-10 rounded-lg bg-amber-50 flex items-center justify-center border border-amber-200">
                <Search className="h-5 w-5 text-amber-600" />
              </div>
              <h3 className="text-base font-bold text-gray-900">
                Stage 1: DETECT
              </h3>
              <ul className="space-y-1.5 text-gray-600 text-xs leading-relaxed">
                <li>• Scans subscriptions with past_due or failed status</li>
                <li>• Analyzes payment attempt history and gateway error codes</li>
                <li>• Computes multidimensional risk score</li>
                <li>• Sorts queue by urgency and revenue at risk</li>
              </ul>
            </CardContent>
          </Card>

          {/* Stage 2 */}
          <Card className="border-indigo-200 bg-indigo-50/20 hover:border-indigo-300 transition-all">
            <CardContent className="pt-6 space-y-3">
              <div className="h-10 w-10 rounded-lg bg-indigo-50 flex items-center justify-center border border-indigo-200">
                <Brain className="h-5 w-5 text-indigo-600" />
              </div>
              <h3 className="text-base font-bold text-indigo-950">
                Stage 2: DECIDE
              </h3>
              <ul className="space-y-1.5 text-indigo-900 text-xs leading-relaxed">
                <li>• Evaluates instant stopping guardrails (0ms)</li>
                <li>• Dispatches context to Google Gemini AI agent</li>
                <li>• AI synthesizes failure root cause, customer profile & retry history</li>
                <li>• Returns structured strategy, confidence score & justification</li>
              </ul>
            </CardContent>
          </Card>

          {/* Stage 3 */}
          <Card className="hover:border-gray-300 transition-all">
            <CardContent className="pt-6 space-y-3">
              <div className="h-10 w-10 rounded-lg bg-emerald-50 flex items-center justify-center border border-emerald-200">
                <Zap className="h-5 w-5 text-emerald-600" />
              </div>
              <h3 className="text-base font-bold text-gray-900">
                Stage 3: EXECUTE
              </h3>
              <ul className="space-y-1.5 text-gray-600 text-xs leading-relaxed">
                <li>• Executes targeted intervention (Auto-retry, SMS, Email, Escalation)</li>
                <li>• Dispatches personalized checkout links</li>
                <li>• Captures recaptured revenue and records full audit trail</li>
                <li>• Automatically transitions subscription back to active status</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Key Features */}
      <div className="space-y-6 pt-4">
        <h2 className="text-2xl font-bold text-gray-900 text-center">Core Capabilities</h2>
        <div className="grid md:grid-cols-3 gap-4">
          <FeatureCard 
            icon={<Brain className="h-5 w-5 text-indigo-600" />}
            title="AI-Powered Decisioning"
            description="Gemini inspects error codes and history to tailor recovery tactics to customer profiles."
            bg="bg-indigo-50 border border-indigo-100"
          />
          <FeatureCard 
            icon={<ShieldAlert className="h-5 w-5 text-rose-600" />}
            title="Calibrated Stopping Rules"
            description="Enforces strict cooldown periods and max retry bounds to protect user experience."
            bg="bg-rose-50 border border-rose-100"
          />
          <FeatureCard 
            icon={<Database className="h-5 w-5 text-gray-600" />}
            title="Complete Audit Trail"
            description="Every agent decision is permanently preserved with confidence scores and reasoning."
            bg="bg-gray-50 border border-gray-200"
          />
          <FeatureCard 
            icon={<LineChart className="h-5 w-5 text-emerald-600" />}
            title="Real-Time Analytics"
            description="Monitor recovery conversion, revenue saved, and failure distributions."
            bg="bg-emerald-50 border border-emerald-100"
          />
          <FeatureCard 
            icon={<CreditCard className="h-5 w-5 text-indigo-600" />}
            title="Multi-Rail Payments"
            description="Handles Cards (tokenized), UPI Mandates, and e-NACH recurring rails."
            bg="bg-indigo-50 border border-indigo-100"
          />
          <FeatureCard 
            icon={<Layers className="h-5 w-5 text-gray-700" />}
            title="High-Speed Batch Recovery"
            description="Recovers entire at-risk portfolios in ~2 seconds with parallel workers."
            bg="bg-gray-50 border border-gray-200"
          />
        </div>
      </div>

      {/* Bottom CTA */}
      <div className="bg-gray-50/70 rounded-2xl p-8 border border-gray-200 text-center space-y-4">
        <ShieldCheck className="h-10 w-10 text-indigo-600 mx-auto" />
        <h2 className="text-xl font-bold text-gray-900">Experience Autonomous Revenue Protection</h2>
        <p className="text-xs text-gray-500 max-w-lg mx-auto">
          Explore the dashboard to view metrics, test the webhook simulator, or review AI audit logs.
        </p>
        <div className="flex flex-wrap justify-center gap-3 pt-2">
          <Link href="/">
            <Button size="sm" variant="default">
              Go to Dashboard
            </Button>
          </Link>
          <Link href="/analytics">
            <Button size="sm" variant="outline">
              View Analytics & ROI
            </Button>
          </Link>
          <Link href="/simulator">
            <Button size="sm" variant="outline">
              Webhook Simulator
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

function FeatureCard({ icon, title, description, bg }: { icon: React.ReactNode; title: string; description: string; bg: string }) {
  return (
    <Card className="hover:border-gray-300 transition-all">
      <CardContent className="pt-5 space-y-2">
        <div className={`h-9 w-9 rounded-lg ${bg} flex items-center justify-center`}>
          {icon}
        </div>
        <h3 className="text-sm font-bold text-gray-900">{title}</h3>
        <p className="text-xs text-gray-500 leading-relaxed">{description}</p>
      </CardContent>
    </Card>
  );
}
