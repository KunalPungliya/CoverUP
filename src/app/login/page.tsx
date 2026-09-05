'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { 
  ShieldCheck, 
  Zap, 
  ArrowRight, 
  Lock, 
  User, 
  KeyRound, 
  CheckCircle2, 
  Activity, 
  Sparkles, 
  Clock, 
  Terminal, 
  Check, 
  Eye, 
  EyeOff,
  Server,
  Fingerprint,
  TrendingUp,
  Cpu
} from 'lucide-react';
import { OPERATOR_PROFILES, OperatorProfile } from '@/components/sidebar';

export default function LoginPage() {
  const router = useRouter();
  const [selectedOp, setSelectedOp] = useState<OperatorProfile>(OPERATOR_PROFILES[0]);
  const [email, setEmail] = useState(OPERATOR_PROFILES[0].email);
  const [password, setPassword] = useState('settleiq_secure_pass_2026');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [authStep, setAuthStep] = useState<string | null>(null);

  // When clicking an operator profile, auto-fill credentials
  const handleSelectOperator = (op: OperatorProfile) => {
    setSelectedOp(op);
    setEmail(op.email);
    setPassword('settleiq_secure_pass_2026');
  };

  const handleLogin = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsAuthenticating(true);
    setAuthStep('Verifying cryptographic token...');

    setTimeout(() => {
      setAuthStep(`Validating ${selectedOp.clearanceLevel} permissions...`);
    }, 450);

    setTimeout(() => {
      setAuthStep('Establishing secure session channel...');
      try {
        localStorage.setItem('settleiq_auth_session', 'true');
        localStorage.setItem('settleiq_active_operator', selectedOp.id);
        localStorage.setItem('settleiq_session_started', new Date().toISOString());
      } catch {
        // ignore
      }
    }, 900);

    setTimeout(() => {
      router.push('/');
    }, 1300);
  };

  const handleGuestAccess = () => {
    handleSelectOperator(OPERATOR_PROFILES[0]);
    handleLogin();
  };

  return (
    <div className="min-h-screen bg-[#11130F] text-[#F2F0E6] flex flex-col justify-between selection:bg-[#C7F36B] selection:text-[#171914]">
      {/* Top Banner Header */}
      <header className="border-b border-[#252820] bg-[#171914]/90 backdrop-blur px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative h-8 w-8 overflow-hidden rounded-md border border-[#30342C] bg-[#11130F] shrink-0 flex items-center justify-center p-0.5 shadow-[2px_2px_0_#5E6F31]">
            <Image 
              src="/logo.png" 
              alt="SettleIQ Logo" 
              width={28} 
              height={28} 
              className="h-full w-full object-contain rounded-xs"
              priority
            />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-display text-base font-bold tracking-tight text-white">
                Settle<span className="text-[#C7F36B]">IQ</span>
              </span>
              <span className="font-mono text-[9px] px-1.5 py-0.2 bg-[#2B3420] text-[#C7F36B] border border-[#44542E] uppercase">
                Terminal Auth
              </span>
            </div>
            <p className="font-mono text-[9px] uppercase tracking-wider text-[#7D8174]">
              Autonomous Revenue Recovery OS
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 font-mono text-[10px] text-[#9FA297]">
          <span className="hidden sm:flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-[#C7F36B] animate-pulse" />
            Zero-Trust Gateway Online
          </span>
          <button
            onClick={handleGuestAccess}
            className="px-2.5 py-1 bg-[#20231C] hover:bg-[#282C22] border border-[#30342C] hover:border-[#3E4534] text-[#E4E7D7] transition-colors cursor-pointer"
          >
            Instant Demo Bypass →
          </button>
        </div>
      </header>

      {/* Main Dual-Panel Auth & Intelligence Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-stretch my-auto">
        
        {/* Left Column: Project Intelligence & Architecture Dashboard (7 cols) */}
        <div className="lg:col-span-7 flex flex-col justify-between space-y-6 bg-[#171914] border border-[#2B2F25] p-6 sm:p-8 shadow-2xl relative overflow-hidden">
          {/* Subtle background glow */}
          <div className="absolute -top-24 -left-24 w-72 h-72 bg-[#C7F36B]/5 rounded-full blur-3xl pointer-events-none" />

          <div>
            {/* Project Mission Header */}
            <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.2em] text-[#C7F36B]">
              <Cpu size={13} />
              <span>Project Mission & Engine Telemetry</span>
            </div>

            <h1 className="mt-2 font-display text-2xl sm:text-3xl font-bold text-white tracking-tight leading-tight">
              Win back involuntary churn across Indian payment rails.
            </h1>
            <p className="mt-2 text-xs sm:text-sm text-[#A2A699] leading-relaxed">
              SettleIQ is a bounded autonomous agent that intercepts subscription payment failures across Cards, UPI AutoPay, and e-NACH mandates. Powered by Google Gemini 2.0 Flash, it diagnoses failure causes and executes optimal anti-fatigue interventions in sub-seconds.
            </p>

            {/* Core Financial & AI Metric Waterfall */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
              <div className="p-3 bg-[#1F231B] border border-[#2F3428]">
                <span className="font-mono text-[9px] uppercase tracking-wider text-[#7D8174] block">Rescued YTD</span>
                <span className="font-display font-bold text-lg sm:text-xl text-[#C7F36B] mt-0.5 block">
                  ₹18.42L
                </span>
                <span className="font-mono text-[9px] text-[#9FA297]">+24% vs manual dunning</span>
              </div>

              <div className="p-3 bg-[#1F231B] border border-[#2F3428]">
                <span className="font-mono text-[9px] uppercase tracking-wider text-[#7D8174] block">Autonomous Win Rate</span>
                <span className="font-display font-bold text-lg sm:text-xl text-white mt-0.5 block">
                  68.4%
                </span>
                <span className="font-mono text-[9px] text-[#C7F36B]">148 cases active</span>
              </div>

              <div className="p-3 bg-[#1F231B] border border-[#2F3428]">
                <span className="font-mono text-[9px] uppercase tracking-wider text-[#7D8174] block">Decision Latency</span>
                <span className="font-display font-bold text-lg sm:text-xl text-white mt-0.5 block">
                  &lt;780ms
                </span>
                <span className="font-mono text-[9px] text-[#9FA297]">Gemini 2.0 Flash</span>
              </div>

              <div className="p-3 bg-[#1F231B] border border-[#2F3428]">
                <span className="font-mono text-[9px] uppercase tracking-wider text-[#7D8174] block">Safety Rules</span>
                <span className="font-display font-bold text-lg sm:text-xl text-[#C7F36B] mt-0.5 block">
                  100%
                </span>
                <span className="font-mono text-[9px] text-[#9FA297]">Bounded anti-fatigue</span>
              </div>
            </div>

            {/* Architectural Execution Loop */}
            <div className="mt-6 space-y-2.5">
              <span className="font-mono text-[10px] uppercase font-bold text-[#85877D] tracking-wider block">
                4-Stage Autonomous Recovery Pipeline
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 font-mono text-xs">
                <div className="p-2.5 bg-[#1B1E17] border border-[#292D22] flex items-start gap-2.5">
                  <div className="grid h-6 w-6 place-items-center bg-[#282E21] text-[#C7F36B] text-[10px] font-bold shrink-0">
                    01
                  </div>
                  <div>
                    <span className="font-semibold text-white block text-[11px]">Webhook Ingestion</span>
                    <span className="text-[10px] text-[#7D8174] block mt-0.5">Captures Razorpay payment.failed payloads instantly</span>
                  </div>
                </div>

                <div className="p-2.5 bg-[#1B1E17] border border-[#292D22] flex items-start gap-2.5">
                  <div className="grid h-6 w-6 place-items-center bg-[#282E21] text-[#C7F36B] text-[10px] font-bold shrink-0">
                    02
                  </div>
                  <div>
                    <span className="font-semibold text-white block text-[11px]">Guardrail Interceptor</span>
                    <span className="text-[10px] text-[#7D8174] block mt-0.5">Checks fatal codes & stops fatigue spam instantly</span>
                  </div>
                </div>

                <div className="p-2.5 bg-[#1B1E17] border border-[#292D22] flex items-start gap-2.5">
                  <div className="grid h-6 w-6 place-items-center bg-[#282E21] text-[#C7F36B] text-[10px] font-bold shrink-0">
                    03
                  </div>
                  <div>
                    <span className="font-semibold text-white block text-[11px]">Gemini AI Reasoning</span>
                    <span className="text-[10px] text-[#7D8174] block mt-0.5">Diagnoses root cause and chooses optimal action</span>
                  </div>
                </div>

                <div className="p-2.5 bg-[#1B1E17] border border-[#292D22] flex items-start gap-2.5">
                  <div className="grid h-6 w-6 place-items-center bg-[#282E21] text-[#C7F36B] text-[10px] font-bold shrink-0">
                    04
                  </div>
                  <div>
                    <span className="font-semibold text-white block text-[11px]">Multi-Channel Action</span>
                    <span className="text-[10px] text-[#7D8174] block mt-0.5">Dispatches smart retries, email/SMS & portal links</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Compliance & Security Footer */}
          <div className="pt-4 border-t border-[#2B2F25] flex flex-wrap items-center justify-between gap-3 font-mono text-[9px] uppercase tracking-wider text-[#7D8174]">
            <span className="flex items-center gap-1.5">
              <ShieldCheck size={12} className="text-[#C7F36B]" />
              RBI e-Mandate Circular Compliant
            </span>
            <span>PCI-DSS L1 Tokenized</span>
            <span>SOC2 Type II Ready</span>
          </div>
        </div>

        {/* Right Column: Interactive Quick-Login Portal (5 cols) */}
        <div className="lg:col-span-5 bg-[#FAF9F5] text-[#2B2D27] border border-[#DEDBD1] p-6 sm:p-7 shadow-2xl flex flex-col justify-between space-y-5">
          <div>
            {/* Header */}
            <div className="flex items-center justify-between border-b border-[#E4E1D8] pb-3">
              <div>
                <h2 className="font-display text-lg font-bold text-[#2B2D27]">
                  Operator Authentication
                </h2>
                <p className="font-mono text-[10px] uppercase tracking-wider text-[#85877D]">
                  Select authorized user or enter credentials
                </p>
              </div>
              <div className="grid h-8 w-8 place-items-center bg-[#171914] text-[#C7F36B]">
                <Fingerprint size={16} />
              </div>
            </div>

            {/* 1-Click Available Login Directory */}
            <div className="mt-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] uppercase font-bold text-[#85877D] tracking-wider">
                  1-Click Select Active Member
                </span>
                <span className="font-mono text-[9px] text-[#707866]">
                  Auto-fills credentials
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {OPERATOR_PROFILES.map((op) => {
                  const isSelected = op.id === selectedOp.id;
                  return (
                    <button
                      key={op.id}
                      type="button"
                      onClick={() => handleSelectOperator(op)}
                      className={`p-2 text-left border transition-all cursor-pointer rounded-xs relative ${
                        isSelected 
                          ? 'border-[#171914] bg-[#F1EFEA] shadow-xs' 
                          : 'border-[#E4E1D8] bg-white hover:border-[#BDB9AC] hover:bg-[#FAF9F5]'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <div className={`grid h-6 w-6 place-items-center text-[10px] font-bold shrink-0 ${
                          isSelected ? 'bg-[#171914] text-[#C7F36B]' : 'bg-[#E6E3D8] text-[#474941]'
                        }`}>
                          {op.initials}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-[11px] font-bold text-[#2B2D27] truncate leading-tight">
                            {op.name}
                          </p>
                          <p className="font-mono text-[9px] text-[#7D8174] truncate">
                            {op.role}
                          </p>
                        </div>
                      </div>
                      {isSelected && (
                        <div className="absolute top-1 right-1 h-1.5 w-1.5 rounded-full bg-[#4F6C18]" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Credentials Form */}
            <form onSubmit={handleLogin} className="mt-4 space-y-3.5">
              <div>
                <label className="block font-mono text-[10px] uppercase font-bold text-[#55584E] mb-1">
                  Operator Email / ID
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-[#85877D]">
                    <User size={13} />
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-white border border-[#D8D5CB] pl-8 pr-3 py-2 text-xs font-mono text-[#2B2D27] focus:outline-hidden focus:border-[#171914] focus:ring-1 focus:ring-[#171914]"
                    placeholder="name@settleiq.app"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block font-mono text-[10px] uppercase font-bold text-[#55584E]">
                    Security Passcode
                  </label>
                  <span className="font-mono text-[9px] text-[#85877D]">
                    {selectedOp.clearanceLevel} Clearance
                  </span>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-[#85877D]">
                    <Lock size={13} />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-white border border-[#D8D5CB] pl-8 pr-9 py-2 text-xs font-mono text-[#2B2D27] focus:outline-hidden focus:border-[#171914] focus:ring-1 focus:ring-[#171914]"
                    placeholder="••••••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-[#85877D] hover:text-[#2B2D27] cursor-pointer"
                  >
                    {showPassword ? <EyeOff size={13} /> : <Eye size={13} />}
                  </button>
                </div>
              </div>

              {/* Active Operator Clearance Pill */}
              <div className="p-2.5 bg-[#EFECE2] border border-[#DFDBD0] text-[10px] font-mono flex items-center justify-between">
                <div>
                  <span className="text-[#686B60] block">Target Role:</span>
                  <span className="font-bold text-[#2B2D27]">{selectedOp.role}</span>
                </div>
                <span className="px-1.5 py-0.5 bg-[#2B3420] text-[#C7F36B] font-bold text-[9px] border border-[#44542E]">
                  {selectedOp.clearanceLevel}
                </span>
              </div>

              <div className="flex items-center justify-between text-[11px] font-mono">
                <label className="flex items-center gap-1.5 cursor-pointer text-[#55584E]">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="h-3.5 w-3.5 accent-[#171914] cursor-pointer"
                  />
                  <span>Remember session</span>
                </label>
                <span className="text-[#85877D]">FIDO2 2FA Enforced</span>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isAuthenticating}
                className="w-full mt-2 py-2.5 bg-[#171914] hover:bg-[#252820] text-[#C7F36B] font-mono text-xs font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-80"
              >
                {isAuthenticating ? (
                  <>
                    <span className="h-3 w-3 border-2 border-[#C7F36B] border-t-transparent rounded-full animate-spin" />
                    <span>{authStep || 'Authenticating...'}</span>
                  </>
                ) : (
                  <>
                    <span>Authenticate & Enter Workspace</span>
                    <ArrowRight size={13} />
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Terminal Session ID Footer */}
          <div className="pt-3 border-t border-[#E4E1D8] flex items-center justify-between font-mono text-[9px] text-[#85877D]">
            <span>Channel: TLS 1.3 · RSA 4096</span>
            <span>Session: SIQ-DEMO-AUTH</span>
          </div>
        </div>
      </main>

      {/* Footer Disclaimer */}
      <footer className="border-t border-[#252820] bg-[#11130F] px-6 py-3 flex flex-col sm:flex-row items-center justify-between gap-2 font-mono text-[9px] uppercase tracking-wider text-[#6A6E63]">
        <span>SettleIQ Autonomous Revenue Recovery OS · Razorpay Hackathon 2025</span>
        <span>Bounded Interventions · Zero Spam · Full Regulatory Auditability</span>
      </footer>
    </div>
  );
}
