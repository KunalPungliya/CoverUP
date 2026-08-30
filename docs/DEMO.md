# CoverUP — 5-Minute Video Pitch Script & Walkthrough Guide

> **Track:** AI Revenue Recovery (Razorpay Hackathon)  
> **Pitch Video Duration:** ~5 Minutes  
> **Speaker Role:** Founder / Lead Engineer

---

## 🎬 Video Recording Structure

```
0:00 ── 0:45 │ 1. The Hook & The Problem ("Why This Track")
0:45 ── 2:00 │ 2. Live Demo: Dashboard & Triggering Recovery Batch
2:00 ── 3:15 │ 3. Deep Dive: AI Decision Engine, Stopping Rules & Timelines
3:15 ── 4:15 │ 4. The Audit Trail & Measured Numbers (₹ Recovered)
4:15 ── 5:00 │ 5. Architecture, Extensibility & Conclusion
```

---

## 🎙️ Spoken Script & Screen Actions

### **Part 1: The Problem & The Solution (0:00 – 0:45)**
* **Camera on Speaker / Slide:**
  > *"Hi everyone, we are presenting **CoverUP**, an autonomous AI Revenue Recovery Agent built for the Razorpay Hackathon.*  
  >  
  > *In subscription businesses, revenue loss rarely happens all at once. A card expires, an auto-debit bounces due to temporary insufficient funds, or a bank decline occurs. Traditional systems either dumb-retry blindly until the user gets blocked, or spam the customer until they churn.*  
  >  
  > *CoverUP closes the entire loop: it **Detects** at-risk revenue, uses **Gemini 2.5 Flash** to **Decide** the optimal intervention, and **Executes** compliant actions with strict stopping rules and a complete audit trail."*

---

### **Part 2: Live Demo — Dashboard & Batch Execution (0:45 – 2:00)**
* **Screen Recording: Navigate to `http://localhost:3000` (Dashboard)**
  > *"Let's see CoverUP in action.*  
  >  
  > *Here on the dashboard, we have a live subscription portfolio of 100 customers. Currently, 28 subscriptions are flagged at risk, totaling over ₹2,00,000 in threatened revenue.*  
  >  
  > *Let's click **'Run Recovery'**.*  
  >  
  > *In real-time, CoverUP ingests all past-due cases, calculates multi-factor risk scores, and routes each failure through our AI decision engine.*  
  >  
  > *Instantly, our metrics update: **₹54,994 in revenue recaptured**, our recovery rate climbs, and our interactive charts show recovery breakdowns across 7 distinct payment failure reasons — from transient network drops to bank declines."*

---

### **Part 3: Deep Dive — AI Reasoning & Stopping Rules (2:00 – 3:15)**
* **Screen Recording: Click into `Recovery` → Click "View Details" on the latest batch (`/recovery/[batchId]`)**
  > *"Judges asked for compliant escalation and stopping rules — let's look at the per-subscription breakdown.*  
  >  
  > *1. **Card Expired Case:** Notice for expired cards, CoverUP doesn't waste retries against the bank. The AI immediately issues a tokenized 'Update Payment Method' prompt to the customer.*  
  > *2. **Insufficient Funds:** The AI sequences a gentle reminder and schedules a 72-hour retry when accounts typically replenish.*  
  > *3. **Fraud Suspected:** Here is our hard stopping rule in action — CoverUP automatically halts automated recovery and routes the case to human escalation.*  
  > *4. **Account Closed:** Marked unrecoverable immediately to prevent infinite loops.*  
  >  
  > *Every single action has an AI confidence score and clear, plain-English reasoning logged in the system."*

---

### **Part 4: The Audit Trail & Export (3:15 – 4:15)**
* **Screen Recording: Navigate to `Audit Log` (`/audit`) → Filter by action → Expand a row → Click "Export CSV"**
  > *"A core requirement of this track is an immutable audit trail.*  
  >  
  > *On the Audit Log page, compliance officers can filter by action type or outcome. Expanding any entry reveals the exact rendered message template, customer contact details, cooldown checks, and gateway response.*  
  >  
  > *With one click on **'Export CSV'**, teams can download the full auditable dataset for accounting and regulatory review."*

---

### **Part 5: Architecture, What Broke, & Wrap-Up (4:15 – 5:00)**
* **Screen Recording: Show `docs/ARCHITECTURE.md` diagram / GitHub Repo**
  > *"Under the hood, CoverUP is built with Next.js 15, Tailwind CSS, PostgreSQL via Supabase, and Google Gemini 2.5 Flash.*  
  >  
  > *During development, our biggest challenge was preventing LLM hallucinations and latency bottlenecks during batch execution. We solved this by enforcing a strict JSON schema contract with an integrated deterministic fallback engine, guaranteeing zero downtime.*  
  >  
  > *CoverUP transforms revenue recovery from a manual leak into an automated, compliant, and auditable profit center. Thank you!"*

---

## 💡 Top Tips for Your Recording
1. **Resolution:** 1080p (1920x1080) in full screen.
2. **Audio:** Use a clear microphone with minimal background noise.
3. **Data Prep:** Hit "Seed Data" once before starting the video so the numbers and charts look vibrant.
4. **Highlights:** Use your mouse cursor to point at the **"₹ Amount Recovered"** card and the **"AI Reasoning"** purple boxes.
