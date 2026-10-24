# MANDATORY DIRECTIVE FOR ALL AI AGENTS & PAIR PROGRAMMERS

> [!IMPORTANT]
> **READ BEFORE TOUCHING ANY CODE:**
> You MUST read [AGENTS.md](file:///c:/Users/ARTSY/Desktop/ARTSY%20WEB/AGENTS.md) in its entirety before analyzing, modifying, or creating any code in this repository.
>
> All architectural patterns, database schemas, strict dual-credential authentication, guest checkout ban, 32-status project lifecycle, creator onboarding invariants (Migration 014: hardware config, 3 samples, permanent NDA signature), dynamic pricing engine, mobile-first responsive standards, and the 7-check No-Regression Firewall (`scripts/regression-guard`) are strictly defined in `AGENTS.md`.
>
> **MANDATORY EXECUTION PROTOCOL FOR EVERY TASK:**
> 1. Read `AGENTS.md`.
> 2. Implement cleanly without bypassing state machines or RLS rules.
> 3. Verify TypeScript (`npx tsc --noEmit`) and production build (`npm run build`).
> 4. Run `node scripts/regression-guard` to verify 0 regressions across all checks.
> 5. Never use `git add -A`; stage only specific modified files.
