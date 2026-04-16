# CONVERSATION_CONTEXT.md

> **Purpose:** Orient any Claude conversation (web or Code) to the current state of MyAIM Family work and how to work effectively with Tenise.
> **Read this FIRST** in any new conversation, before other files.
> **Status:** Living document. Date-stamped sections may be stale; rules and working-style sections are enduring.

---

## 1. How to use this document

This doc is the front-page for every new conversation about MyAIM Family. It's intentionally short — not a replacement for the gameplan, PRDs, or CLAUDE.md, but a pointer layer that tells you what to read and how to engage.

**When starting a new conversation, read in this order:**
1. This file (CONVERSATION_CONTEXT.md) — orientation
2. MYAIM_GAMEPLAN_v2.2.md — current phase plan
3. CURRENT_BUILD.md — what's actively being built (if anything)
4. Specific PRD + addenda for the task at hand
5. CLAUDE.md — conventions (usually auto-loaded)

**Update triggers for this file:**
- Major gameplan version change (v2.x → v3.x)
- Significant working-style learnings (not every tweak)
- New recurring issues that future conversations need warned about
- Phase completions that meaningfully change the picture

Claude Code updates this file when founder explicitly asks, not automatically.

---

## 2. Current snapshot (as of April 16, 2026)

**Phase:** Just completed Phase 0 of MYAIM_GAMEPLAN_v2.2.md. Phase 0.25 Reconnaissance and Phase 0.35 COPPA PRD session running next, likely in parallel.

**What's done recently:**
- Tool health sweep surfaced and fixed ~5 silent-failure modes (April 16)
- Step 0 hard-gate added to /prebuild skill
- "Looks Fine" failure pattern documented in LESSONS_LEARNED.md
- CLAUDE.md Convention #241 (Tooling Hygiene) added
- Pre-Build-Setup-Checklist.md updated with Install + Verify-Firing steps
- MYAIM_GAMEPLAN_v2.2.md committed to repo root
- Build M formally signed off (42 wired, 12 stubbed, 0 missing)
- PRD-16 formally signed off (114 wired, 13 stubbed, 0 missing)
- CURRENT_BUILD.md cleared to between-builds state

**What's in flight:**
- Phase 0.25 Reconnaissance (Claude Code session)
- Phase 0.35 COPPA PRD-40 authoring (web conversation)

**What's next after both complete:**
- Phase 0.5 — wizard sprint close-out decision (List Wizard only or finish Tally first)
- Phase 1 — Lock Universal Setup Wizards design doc + Lego/Surge Protector CLAUDE.md addition
- Phase 2 — Architectural audit (8 scopes)
- Phases 3+ — per gameplan

**Known active gaps:**
- AURI formally disabled until proper Developer Edition reinstall (F1 in TOOL_HEALTH_REPORT)
- npm/nvm4w PATH broken — pre-commit hook crashes on invocation, markdown commits need --no-verify
- Universal List Wizard committed at 21a47a1 but founder-flagged as not serving intended use case (shared permanent shopping list with husband) — investigation deferred

---

## 3. How Tenise works — context every conversation needs

**Tenise is the founder of AIMagicforMoms™ and MyAIM Family, operating under Three Little Lanterns LLC (Missouri).**

**9 kids.** Works in sprints when she can fit them. Breaks come when kids have needs, not on any predictable schedule. Can run her computer overnight.

**Do NOT manage her pacing, energy, or time.**
- Do not suggest stopping points, breaks, or saving work "for a fresh morning"
- Do not frame sequences around fatigue or time-of-day
- She decides when to stop; you do not
- Work is sequenced by dependency and build-it-right principles, never by guesses about her capacity
- If she wants a break, she takes one

**"Build it right" is the operating principle.**
- No MVP shortcuts
- No tech debt accepted without explicit acknowledgment
- No workarounds without founder approval
- Tests passing ≠ feature serves intended need (known example: Universal List Wizard)

**"Providing value for them also benefits us, but err on the side of providing value."**
- Discovery nudges and AI prompts must be genuinely helpful, not engagement-driven
- Celebrations are user-triggered, never automatic
- The platform is FOR moms and families — their wellbeing is the primary concern

**Communication style:**
- Direct, audit-style format
- Corrects assumptions efficiently with brief updates
- Expects push-back, not compliance
- Expects Claude to flag incomplete implementations, scope creep, and workarounds proactively
- Prefers building things right immediately over deferring improvements
- When she says "I don't know" to a technical question, translate jargon plainly
- When unsure which path she wants, ASK — don't guess

**What she's building:**
A unified family intelligence and transformation platform (MyAIM Family) featuring LiLa (the AI assistant), with role-based shells (Mom, Dad/Adult, Independent Teen, Guided, Play), comprehensive family management, gamification, communication tools, personal growth features, compliance reporting, and an AI Vault content library. Her own large family are primary users already running real logins at myaimcentral.com.

---

## 4. How to work with MyAIM projects — enduring rules

### Rule: Verify Before Assuming Current

**The problem this solves:** Project knowledge here syncs from GitHub manually (via "Sync now" button), not automatically. Even with GitHub sync configured, files may be fresh or weeks stale with no visible indicator. Not everything lives in project knowledge — capacity limits and relevance mean most files stay in the codebase only. When a conversation touches code state, truth lives in the repo (accessible to Claude Code), not here.

**Before giving advice that depends on current state, choose one:**

1. **Search project_knowledge** — use `project_knowledge_search` tool for the specific file/topic. If synced and relevant, it will appear.

2. **Acknowledge the assumption** — if about to give advice based on "we have X already" or "Y is still working the way we specced," flag it explicitly: "This assumes X is still in the state we discussed — worth confirming before acting."

3. **Offer a Claude Code handoff** — when the question genuinely needs fresh repo state, suggest: "I'd want to work from current repo state. Can you ask Claude Code [specific question] and paste the answer back?"

**Claude should NEVER:**
- Confabulate current state from training data when `project_knowledge_search` is available
- Answer "is X built yet?" without searching or asking
- Give confident advice based on specs assumed to still match the code
- Treat "I remember we decided X" as equivalent to "X is true today"

**When unsure which path:** Default to asking. "Before I answer, can you confirm X is still [expected state]?" is almost always better than a confident-wrong answer.

### Rule: The "Looks Fine" Pattern Applies to Features, Not Just Tools

Tools fail in layers. Each layer's status check can pass while the next layer down is broken: Registered → Connected → Functioning → Fresh. This pattern has been documented in LESSONS_LEARNED.md with tool examples.

**The pattern extends to features.** "Tests pass" doesn't mean "feature serves its intended need." "Committed" doesn't mean "works as specified." "Verified" doesn't mean "founder can actually use it." The Universal List Wizard is the canonical feature-level example: passing tests but not matching the founder's intended shared-permanent-shopping-list use case.

**When declaring something complete, probe the deepest layer that matters:**
- Features: founder uses it for its real purpose, not just unit-test scenarios
- Security tools: actual scan output, not just "connected"
- Code indexes: freshness against recent commits, not just "authenticated"
- Compliance: legal review by a human lawyer, not just internal checkboxes

### Rule: PRD Session Decisions Supersede Planning Documents

When planning documents (like MyAIM_Family_Planning_Decisions.md) conflict with decisions made during a specific PRD session, **the PRD session wins.** Planning docs are jumping-off points, not locked authorities. Feature names, PRD order, section lists, and details evolve during PRD sessions.

### Rule: Addenda Supersede Original PRD Text

PRDs have addenda. Addenda contain binding decisions that supersede original PRD text. When building from a PRD, Claude Code must read: PRD + its addenda + grep for all addenda mentioning that PRD.

---

## 5. Recent learnings worth knowing

**Silent tool drift is a real, frequent issue.** April 16 surfaced multiple tool failures that had been invisible for weeks:
- AURI MCP "connected" but not scanning anything
- mgrep auth expired silently
- codegraph locked since March 28
- mgrep index stale
- Pre-commit hook crashing silently due to npm/nvm4w PATH issue

**Step 0 hard-gate now catches most of this class at session start.** See /prebuild skill and CLAUDE.md Convention #241.

**Documentation auto-update convention has been failing.** The "update BUILD_STATUS, CLAUDE.md, STUB_REGISTRY after every git push" convention hasn't been firing reliably. Phase 0.25 Reconnaissance includes a doc-accuracy reconciliation pass to catch up.

**Windows npm ecosystem is fragile.** The nvm4w + npm + PATH layering on Tenise's machine has broken multiple tools (AURI install, pre-commit hook, mgrep plugin hook). A proper ecosystem fix is queued for Phase 0.25 with a careful backup-diagnose-fix-verify sequence.

**COPPA compliance decisions exist but weren't formalized.** Earlier conversations established: per-parent verification (not per-child), payment as verification method, coppa_consents + parent_verifications tables, trigger on first under-13 child. PRD-40 (in progress during Phase 0.35) formalizes these.

**Beta Readiness Gate added to pipeline.** New gate between Gate 3 (Video Library) and Gate 4 (LiLa Training) requires compliance infrastructure verification AND human lawyer review before beta user exposure.

---

## 6. Pointers to other key files

**Master orientation:**
- MYAIM_GAMEPLAN_v2.2.md — the plan, phases, gates, audit scopes

**Living state:**
- CURRENT_BUILD.md — active build (IDLE when nothing in flight)
- BUILD_STATUS.md — phase completion log
- STUB_REGISTRY.md — all stubs, wired status, target phases

**Conventions & lessons:**
- CLAUDE.md — conventions (growing list; #241 is Tooling Hygiene, latest)
- LESSONS_LEARNED.md — documented failure patterns; "Looks Fine" pattern is the latest named one
- Pre-Build-Setup-Checklist.md — install + verify-firing steps for all tools

**Infrastructure:**
- TOOL_HEALTH_REPORT_2026-04-16.md — April 16 sweep findings + 17 followups (F1-F17)
- DATABASE_SCHEMA.md — current schema snapshot
- .claude/skills/prebuild/SKILL.md — Step 0 hard-gate

**Templates:**
- MyAIM_Family_PRD_Template.md — PRD structure
- Build_Prompt_Template.md — build session structure

**Reference / background:**
- AIMfM_Heart_and_Mission.docx — product vision
- Brand_Identity_Voice_and_Strategy.md — brand
- AIMfM_Faith_Ethics_Framework_Complete.md — ethics foundation
- LiLa_Versions_Guide.docx — LiLa assistant design

**Condensed intelligence (pre-PRD reference):**
- bigplans_condensed_intelligence.md — PRD-29 reference
- thoughtsift_condensed_intelligence.md — PRD-34 reference
- communication_tools_condensed_intelligence.md — PRD-21 reference
- safe_harbor_condensed_intelligence.md — PRD-20 reference
- innerworkings_condensed_intelligence.md — PRD-07 reference

---

## 7. Infrastructure quick reference

**Repo:** github.com/littlelanterns/MyAIMCentral-family
**Domains:** myaimcentral.com (authenticated app, Vercel), aimagicformoms.com (marketing)
**Tech stack:** Vite + React 19 + TypeScript + Tailwind v4 + Supabase + Vercel
**MyAIM Supabase:** vjfbzpliqialqmabfnxs.supabase.co
**StewardShip Supabase:** dkcyaklyqxhkhcnpdtwf.supabase.co
**AI routing:** OpenRouter (Sonnet/Haiku via Edge Functions)
**Dev tools:** Claude Code (VS Code extension, Opus 4.7), codegraph MCP, mgrep (Scale tier), AURI Developer Edition (reinstall pending)

**Cost targets:** ~$0.20/family/month AI cost goal

**Icon system:** Lucide icons only outside Play shell. No emoji in UI or AI output anywhere in platform.

---

*Last updated: April 16, 2026 — post-Phase 0 completion.*
*Next expected update: after Phase 0.25 Reconnaissance findings, to reflect verified state.*
