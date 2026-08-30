# 🛡️ CoverUP — Autonomous AI Revenue Recovery Agent

> **Razorpay Hackathon 2025** | **Track:** AI Revenue Recovery  
> *"Find revenue that's slipping away and win it back."*

[![Next.js 15](https://img.shields.io/badge/Next.js-15-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-green?style=flat-square&logo=supabase)](https://supabase.com/)
[![Gemini 2.5](https://img.shields.io/badge/AI-Gemini%202.5%20Flash-orange?style=flat-square&logo=google)](https://ai.google.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-CSS-38bdf8?style=flat-square&logo=tailwindcss)](https://tailwindcss.com/)

---

## 📌 Executive Summary

When recurring subscription payments fail (insufficient funds, expired cards, bank declines, network errors), businesses silently leak up to **10–15% of ARR**. 

**CoverUP** is an autonomous AI agent that closes the loop:
1. 🔍 **Detects** at-risk subscription revenue and calculates urgency risk scores.
2. 🧠 **Decides** the optimal intervention using **Google Gemini 2.5 Flash** with hard stopping rules.
3. ⚡ **Executes** bounded recovery workflows (smart retry scheduling, customer payment update prompts, multi-channel nudges) with zero customer spam.
4. 📊 **Reports** exact **₹ money recovered** with a complete, immutable **audit trail**.

---

## 🏆 How CoverUP Meets Hackathon Evaluation Criteria

| Evaluation Bar | Requirement | How CoverUP Solves It |
| :--- | :--- | :--- |
| **1. Measured Recovery** | Show actual ₹ money recaptured across batches, not just detection. | Live aggregate metrics: **`₹ Recovered`**, **`Recovery Rate %`**, and interactive Recharts failure breakdown. |
| **2. Compliant Escalation** | Reasonable escalation sequence (gentle reminder $\rightarrow$ firmer nudge $\rightarrow$ update prompt $\rightarrow$ final notice). | Dynamic template selection based on failure count and failure severity. |
| **3. Stopping Rules** | Must know when to stop trying without looping forever. | Max 3 retries, 48-hour anti-spam cooldown, 30-day max failure age, immediate unrecoverable on closed accounts, immediate escalation on suspected fraud. |
| **4. Audit Trail** | Every action must be explainable, timestamped, and logged. | Full ledger with `ai_reasoning`, `ai_confidence`, JSON payloads, and 1-click **CSV Export**. |

---

## 🏗️ Architecture Pipeline

```
┌─────────────────┐     ┌──────────────────┐     ┌──────────────────┐     ┌──────────────────┐
│    1. DETECT    │ ──> │    2. DECIDE     │ ──> │    3. EXECUTE    │ ──> │    4. REPORT     │
│ (Risk Scoring)  │     │ (Safety + Gemini)│     │ (Actions & Audit)│     │ (Live Analytics) │
└─────────────────┘     └──────────────────┘     └──────────────────┘     └──────────────────┘
```

Detailed technical specs can be found in [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

---

## 🚀 Quick Start

### 1. Prerequisites
- Node.js 20+
- A Supabase Project (PostgreSQL)
- A Google Gemini API Key

### 2. Installation
```bash
# Clone the repository
git clone https://github.com/your-username/coverup.git
cd coverup

# Install dependencies
npm install
```

### 3. Environment Variables
Create a `.env.local` file in the root directory:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
GEMINI_API_KEY=your_gemini_api_key
GEMINI_MODEL=gemini-2.5-flash
```

### 4. Database Setup
1. Open your **Supabase Dashboard → SQL Editor**.
2. Copy and paste the contents of `supabase/schema.sql` and click **Run**.

### 5. Run the Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🖥️ Application Features & Walkthrough

1. **Dashboard (`/`)**
   - Click **"Seed Data"** to generate 100 realistic subscriptions (60% active, 40% at risk across 7 payment failure profiles).
   - Click **"Run Recovery"** to trigger the autonomous AI pipeline.
   - Observe real-time recovery metrics and interactive charts.
2. **Subscriptions Explorer (`/subscriptions`)**
   - Filter subscriptions by status (`active`, `past_due`, `failed`, `recovered`, `unrecoverable`).
3. **Recovery Batches (`/recovery`)**
   - View historical batch runs and click **"View Details"** to inspect the per-subscription AI reasoning timeline.
4. **Audit Trail (`/audit`)**
   - Filter by action or outcome, expand rows to inspect raw simulated payloads, and click **"Export CSV"** for compliance records.

---

## 📚 Submission Documentation

- 📄 [Architecture Specification](docs/ARCHITECTURE.md)
- 🎥 [5-Minute Video Pitch Script & Guide](docs/DEMO.md)
- 🛠️ [What Broke During Development & Solutions](docs/WHAT_BROKE.md)

---

## ⚖️ License
MIT License. Built for the Razorpay AI Revenue Recovery Track (2025).
