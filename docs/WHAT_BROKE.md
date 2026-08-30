# What Broke During Development & How We Solved It

> **Hackathon Requirement:** Detailed documentation of engineering challenges, edge case failures, and architecture solutions encountered during the build.

---

## 1. Database Schema DDL Enum Collisions in PostgreSQL
* **The Problem:** When testing rapid schema updates in Supabase/PostgreSQL, re-running DDL migrations failed with `ERROR: 42710: type "subscription_status" already exists`.
* **The Root Cause:** Standard PostgreSQL enum types (`CREATE TYPE ... AS ENUM`) are not dropped automatically when tables are modified or re-declared, causing migration blocks.
* **How We Solved It:** Created a clean, cascading teardown script (`DROP TYPE IF EXISTS ... CASCADE`) that drops foreign keys, tables, and enum definitions in proper dependency order before recreating them, ensuring 100% idempotent migrations.

---

## 2. LLM Latency & Potential Output Malformations in Batch Pipelines
* **The Problem:** Running AI decisions sequentially over dozens of at-risk subscriptions could cause HTTP request timeouts (Next.js default 15s limit) or crash the pipeline if an LLM returns unexpected markdown formatting or unregistered action strings.
* **The Root Cause:** LLMs occasionally hallucinate non-standard action names or take $> 2\text{ seconds}$ per query under network jitter.
* **How We Solved It:**
  1. **Schema Guardrails:** Configured Gemini with `responseMimeType: "application/json"` and strict `generationConfig` with low temperature (`0.3`).
  2. **Action Validator:** Added defensive runtime validation in `src/lib/gemini.ts` that safely falls back to `'escalate'` if an unrecognized action type is received.
  3. **Deterministic Fallback Engine:** Built an exhaustive, rule-based fallback decision engine (`getFallbackDecision`) that catches any API exception or network timeout, guaranteeing the batch finishes successfully with 0 downtime.
  4. **Timeout Extension:** Configured `export const maxDuration = 60;` on the API route handler.

---

## 3. Customer Spam Prevention & Cooldown Logic
* **The Problem:** Repeatedly running recovery batches would re-trigger customer reminders on every cycle, causing customer fatigue and violating anti-spam policies.
* **The Root Cause:** Without persistent interaction state, batch processors treat every past-due subscription as a brand-new candidate.
* **How We Solved It:**
  * Implemented an **Anti-Spam Cooldown Rule** in `src/lib/pipeline/decide.ts` that inspects `previousActions`. If any outreach occurred within the last 48 hours, the action is flagged as `outcome: 'skipped'` with the reason `Cooldown: X.X hours < 48 hours` logged directly in the audit trail.

---

## 4. Infinite Retry Loops on Unrecoverable Cards & Closed Accounts
* **The Problem:** Recurring subscriptions with permanently closed accounts or suspected fraud were being repeatedly retried against the simulated gateway, burning unnecessary compute and violating compliance.
* **How We Solved It:**
  * Enforced **Hard Stopping Rules** prior to invoking the AI:
    * `fraud_suspected` $\rightarrow$ Immediate human escalation; automated retries permanently disabled.
    * `account_closed` $\rightarrow$ Immediate transition to `unrecoverable`.
    * Hard retry ceiling of **Max 3 Retries** across the lifetime of the incident.
