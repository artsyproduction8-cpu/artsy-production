# MANDATORY DIRECTIVE FOR ALL AI AGENTS & PAIR PROGRAMMERS

> [!IMPORTANT]
> **READ BEFORE TOUCHING ANY CODE:**
> You MUST read [AGENTS.md](file:///c:/Users/ARTSY/Desktop/ARTSY%20WEB/AGENTS.md) in its entirety before analyzing, modifying, or creating any code in this repository.
>
> All architectural patterns, database schemas, strict dual-credential authentication, guest checkout ban, 32-status project lifecycle, creator onboarding invariants (Migration 014: hardware config, 3 samples, permanent NDA signature), dynamic pricing engine, mobile-first responsive standards, and the 7-check No-Regression Firewall (`scripts/regression-guard`) are strictly defined in `AGENTS.md`.

---

## MANDATORY AUTONOMOUS MULTI-AGENT EXECUTION & CONTINUOUS AUDITING LOOP

Whenever any AI agent works on any user prompt, it MUST adhere strictly to the following 6-step lifecycle without exception:

```mermaid
flowchart TD
    Step1([1. User Prompt Received]) --> Step2[2. Lead Orchestration & Multi-Agent Delegation<br/>Decompose task & spawn parallel subagents if needed]
    Step2 --> Step3[3. Build & Implementation Phase<br/>Clean code adhering strictly to AGENTS.md]
    Step3 --> Step4[4. Audit & Verification By Actual Use<br/>Test against original prompt, verify in browser/APIs/mobile]
    Step4 --> Decision{Meets Goal & High Standard?}
    Decision -- No / Improvements Needed --> Step5[5. Autonomous Improver Loop<br/>Analyze issues, elevate quality, iterate until perfect]
    Step5 --> Step4
    Decision -- Yes (0 Gaps & Verified) --> Step6[6. Record in Memory Bank (AGENTS.md)<br/>Commit documentation & produce detailed user report]
```

### 1. Prompt Ingestion & Task Decomposition
- Read the user prompt in detail. Identify explicit requirements, implicit constraints, security invariants, and edge cases.
- **Multi-Agent Orchestration:** The lead agent is empowered and encouraged to spawn specialized subagent teams (e.g., builder agents, QA/security auditors, browser verification agents) to execute tasks in parallel for superior quality, velocity, and thoroughness.

### 2. Implementation Phase (The Builder)
- Implement changes cleanly and minimally.
- Strictly adhere to RLS zero-trust rules, dual-credential authentication, guest checkout bans, dynamic pricing integer math, and mobile-first responsive standards.
- Compile and type-check (`npx tsc --noEmit`) and ensure production builds succeed (`npm run build`).

### 3. Adversarial Audit & Verification by Actual Use (The Auditor)
- Do NOT declare completion immediately after writing code.
- **Audit Against Original Prompt:** Verify every requirement in the prompt line by line.
- **Verify by Actual Use:** Actively test and interact with the application using browser tools, subagents, or automated test runners:
  - Verify on mobile viewport (< 768px) and desktop viewport (>= 1024px).
  - Verify that visual styling feels premium and polished, not basic.
  - Verify API endpoints, authentication flows, error states, and database mutations.

### 4. Autonomous Improver Loop (The Improver)
- If any defect, discrepancy, clumsy layout, performance bottleneck, or unaddressed requirement is detected:
  1. Diagnose root cause and state specifically why it is not working properly.
  2. Formulate concrete enhancements to make the solution impressive and robust.
  3. Implement the fixes and re-verify.
  4. Repeat autonomously until the main goal is completely met to production-grade standard.

### 5. Memory Bank Synchronization
- Record all architectural additions, schema modifications, responsive standards, and invariant changes in the Master Memory Bank (`AGENTS.md`).
- Ensure both root `AGENTS.md` and `artsy-next/AGENTS.md` remain in sync.

### 6. Detailed Final Report
- Deliver a comprehensive, transparent report to the user summarizing:
  - What was implemented.
  - How it was audited and verified (including browser testing and mobile/desktop checks).
  - What autonomous improvements were made.
  - What was logged in the Memory Bank.
  - Git commit hashes and live deployment IDs.

---

### Core Execution Invariants
1. Read `AGENTS.md` before analyzing or typing code.
2. Implement cleanly without bypassing state machines or RLS rules.
3. Verify TypeScript (`npx tsc --noEmit`) and production build (`npm run build`).
4. Run `node scripts/regression-guard` to verify 0 regressions across all checks.
5. Never use `git add -A`; stage only specific modified files.
