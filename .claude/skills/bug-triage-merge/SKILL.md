---
name: bug-triage-merge
description: "Pull every open bug report from beta_glitch_reports + cross-reference against TRIAGE_WORKSHEET.md. Cluster by feature surface. Returns a prioritized clustered queue the founder can scan to pick the next feature-anchored session. Merges the two-fires problem (in-app bug reports vs audit triage) into one organized queue. Invoke as /bug-triage-merge."
---

# Bug Report Triage + Audit Merge — Claude Code Skill

This skill solves the "two fires" problem: in-app bug reports pile up in `beta_glitch_reports` while the audit triage queue lives in `claude/web-sync/TRIAGE_WORKSHEET.md`. Without merging them, the founder tracks the same feature surfaces in two places and can't tell what to dispatch next. This skill merges the streams: every open bug report gets categorized by feature surface, cross-referenced against the audit worksheet, and clustered with related rows. The output is a single prioritized queue.

## How to Invoke

```
/bug-triage-merge
```

No arguments. The skill pulls from production directly using `.env.local` credentials.

---

## When to Use

Run this skill anytime bug reports feel like they're piling up faster than the audit queue is moving. Could be once a week, could be every couple of weeks. The skill itself is **investigative only** — no code changes. The output is a clustered list you can scan in 5 minutes, after which you pick a cluster and dispatch a feature-anchored session for it.

This skill is the standing move for "I have bug reports piling up." The other standing move is feature-anchored dispatch — you say "Calendar feels off, scope a session" and the orchestrator scopes a single fresh-session prompt that fixes the bugs you flagged + every audit row touching the same surface. This skill produces the prioritized cluster list those feature-anchored sessions get dispatched from.

---

## Standing Rules

- **isolation="worktree"** — work in a worktree, do not mutate main directly
- **No code changes** — triage + doc updates only
- **Convention #257 + #121** still apply (no banned date patterns; tsc -b clean if any code is touched)
- **Do NOT change `beta_glitch_reports.status`** — only `admin_notes`. Status changes are the founder's call after reviewing the cluster output.
- **Do NOT mark audit rows RESOLVED** — only annotate/file new
- **Surface ambiguity** — if a bug report is too vague to categorize, flag it as "needs founder clarification" instead of guessing
- **Regressions are CRITICAL** — any bug report matching a row marked RESOLVED gets surfaced at the top of the report

---

## Phase 1 — Pull Open Bug Reports

Query `beta_glitch_reports` filtering `status NOT IN ('resolved', 'dismissed', 'duplicate')`. For each open report, capture:

- `id`, `created_at`, `family_member_id`, `display_name`
- `shell_type`, `current_route`
- `what_doing` / `what_tried` / `what_happened` / `what_expected`
- `browser_info`, `recent_routes`, `console_errors` snippet
- existing `admin_notes` if any

Also pull recently-resolved (`resolved_at > NOW() - interval '7 days'`) for context — sometimes a "fixed" report relates to a still-open one or a regression.

**Report:** total open count, distribution by `shell_type`, oldest report's age.

---

## Phase 2 — Categorize Each Report by Feature Surface

Use `claude/feature_glossary.md` as the surface map. For each bug report, assign:

- **PRIMARY surface** (e.g., "allowance / PRD-28", "calendar / PRD-14B", "tasks / PRD-09A", "lila / PRD-05", "messaging / PRD-15")
- **SECONDARY surfaces** if it touches multiple
- **Severity** (founder-facing impact, not audit severity): Blocking / High / Medium / Low
- **Beta=Y/N** — does it block real-family use? Y if it affects how the founder's family uses the app today

Categorize from the report content + `current_route` + `recent_routes`. When a report is too vague to categorize, flag as **"needs founder clarification"** and stop categorizing it. Do not guess.

---

## Phase 3 — Cross-Reference Against TRIAGE_WORKSHEET.md

For each categorized report, search the worksheet for existing rows that:

- Match same feature surface AND same symptom direction
- Match same symptom but different surface (cross-cutting)
- Are already RESOLVED (regression check — flag aggressively)

Three buckets per report:

**A. ALREADY-COVERED** — existing worksheet row covers this. Annotate the existing row's Notes column with the `bug_report_id` + brief excerpt so the audit row gets linked to a real-world reproduction.

**B. NEW-ROW-NEEDED** — no existing row. File as new `NEW-XX` row in the worksheet with full report context, severity, beta status, and the cross-references. Reuse next-available `NEW-XX` letter pair (consult the worksheet header to find the highest existing pair).

**C. REGRESSION** — matches a row marked RESOLVED. CRITICAL flag. File new row pointing at the resolved row + report. Founder must review immediately.

---

## Phase 4 — Cluster the Merged Queue

Cluster bug reports + matching audit rows together by feature surface. For each cluster, output:

```
[SURFACE NAME — e.g. "Allowance / PRD-28"]
- N total items in cluster (X bug reports + Y audit rows)
- Severity breakdown: B blocking / H high / M medium / L low
- Beta=Y count (real-family-blocking)
- Top 3 most impactful items in the cluster (one-line each)
- Suggested feature-anchored session scope: "single worker, ships
  everything in this cluster; estimated migration count, frontend
  scope, RPC scope"
- Any items NOT bundleable (e.g., conflicts with cluster, blocked
  by external dependency) — call them out separately
```

**Sort clusters by:** `(Beta=Y count) DESC`, then `(total severity weight) DESC`. Founder will pick top cluster to dispatch as the next feature-anchored session.

---

## Phase 5 — Doc Updates

- Append new `NEW-XX` rows from bucket B to `claude/web-sync/TRIAGE_WORKSHEET.md`
- Annotate existing rows from bucket A with `bug_report_id` links
- File regression rows from bucket C with REGRESSION flag at the top
- Update worksheet header counts (total rows, beta blockers)
- Bump `claude/web-sync/FIX_NOW_SEQUENCE.md` to next version with a `bug-triage-merge landed YYYY-MM-DD` changelog entry summarizing N reports triaged, M new rows filed, K linked to existing rows, J regressions flagged
- Update `beta_glitch_reports.admin_notes` for each report processed, format:
  ```
  Triaged YYYY-MM-DD → [bucket A: existing row #X / bucket B: new row NEW-XX / bucket C: regression of row #X]
  ```
  Direct UPDATE via service role is fine. **Do NOT change `status`** — that's the founder's call after reviewing.

**Commit pattern:**
- Single commit: `triage: bug-report-merge YYYY-MM-DD — N reports triaged, M new rows + K linked + J regressions flagged`
- Push NOT required, orchestrator merges.

---

## Output to Founder

Return a single report containing:

1. **Phase 1 totals** — open count, distribution by shell, oldest age
2. **Phase 2 categorization breakdown** — count per surface
3. **Phase 3 bucket counts** — A/B/C totals
4. **Phase 4 clustered queue** — THE main deliverable, sorted as specified
5. **Phase 5 commit SHA + worktree path + branch**
6. **Reports flagged "needs founder clarification"** (Phase 2 fallout) — listed with `bug_report_id` + the specific ambiguity
7. **Regressions (Phase 3 bucket C)** — top of report, never buried

Founder picks the top cluster from Phase 4 and dispatches a feature-anchored session against it. The orchestrator writes that session prompt; this skill does not.

---

## What This Skill Does NOT Do

- Does not write code
- Does not change `beta_glitch_reports.status`
- Does not mark audit rows RESOLVED
- Does not dispatch feature-anchored sessions (that's the orchestrator's next move based on this skill's output)
- Does not invent interpretations for vague reports — surfaces them as "needs founder clarification"

---

## Why This Skill Exists

Without it, bug reports and audit rows are two parallel queues with no merge point. Founder tracks the same feature surfaces in two places. Every new bug report adds anxiety because it's invisible until someone manually correlates it against the audit. This skill removes the manual correlation: every bug report becomes a labeled, grouped, prioritized item inside the same queue the founder already manages. The "two fires" feeling collapses into one organized list sorted by what's blocking real-family use.
