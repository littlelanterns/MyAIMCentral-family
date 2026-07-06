# Pre-Dispatch Pack — PRD21C: AI Vault Engagement & Community

> **Factory status:** synthesized → decisions-pending (2 decisions, batch 9)
> Produced: 2026-07-04 (dispatch factory, Fable 5). Item ID: PRD21C. Priority: P5.
> Evidence: `claude/dispatch-factory/VAULT-RECON.md` (21C section; corroborated by the
> 2026-04-21 Opus evidence pass).
> Headline: 0% built; the vault_items engagement counters have sat in production hardcoded to
> zero since the Vault shipped (no source tables exist to feed them). Its admin screens have no
> host until the PRD32 pack's console expansion lands — which is exactly why it sequences after.

## Reconciliation rulings (newer wins — named explicitly)

1. **Sequence: after PRD32.** Screens 8-10 (Moderation tab, Content Policy, Engagement
   Analytics) attach to the console + Moderation tab the PRD32 pack builds; 21C EXTENDS that
   Moderation tab with the vault-comment queue (the PRD32 pack deliberately left engagement
   moderation to 21C). Unblocks PRD38's comment drain alongside.
2. **Discussions are mom-only** (PRD visibility table, consistent with the Permission Matrix) —
   dad/teen see heart counts + own progress passively. RLS-enforced, not display-layer.
3. **UGC moderation gets its own governance line** (recorded at close-out): Haiku
   comment-gating is a FOURTH thing — not Convention #258's three-tier promotion, not LiLa's
   #247 layers, not PRD-41 output validation. Approve/flag/reject per the PRD; auto-hide at 3
   reports; reporter identity admin-only.
4. **The dead pre-seeded columns come alive here:** counter triggers from the new tables feed
   `vault_items.heart_count/comment_count/satisfaction_*`; `user_saved_prompts.
   shared_with_member_id` + `lila_tool_permissions.saved_prompt_id` get their writers (Share
   sheet). Until this build, they stay documented-dead (no cleanup — they're correct schema).
5. **Recommendation rows are rule-based only** (the PRD's own no-ML stance) — 4 sub-rows from
   existing signals (vault_first_sightings, progress, hearts). The 5-heart display threshold
   honored. Victory-on-completion fires through the connector, celebration-only.
6. **Keys register in-build** (`vault_engagement`, `vault_share_external`,
   `vault_share_toolbox`) through the tier chart (#256); `moderation_admin` finally gets granted
   semantics via the PRD32 staff model.

## Slice plan (single Sonnet worker)
| Slice | Scope | Routing |
|---|---|---|
| 1 | Schema: 6 tables + counter triggers + RLS (mom-only comment read/write; passive member reads) + keys | Sonnet xhigh + rls-verifier |
| 2 | Member surfaces: engagement overlay on cards/detail, satisfaction prompt (≥60s/once), discussion threads (depth 3) + report modal, Share sheet (Toolbox add, My-Prompts share, external copy), My Vault Activity, recommendation rows | Sonnet xhigh |
| 3 | Moderation: Haiku comment-gate Edge Function (dedicated, cost-logged), PRD32 Moderation-tab extension (Flagged/Hidden/Reported/History sub-tabs), Content Policy config, Engagement Analytics; victory wiring | Sonnet xhigh |
| 4 | E2E (`tests/e2e/features/vault-engagement.spec.ts`: mom-only comment RLS probes — teen/dad reads blocked; heart threshold display; auto-hide at 3 reports; satisfaction once-per-user; share round trips incl. saved_prompt_id toolbox path; counter-trigger correctness) + verification | Sonnet xhigh |
| Gates | Checkpoint 5 | **Fable if available, else Opus** |

## Founder decisions — ✅ RESOLVED (2026-07-04, batch 9 — approved per recommendations)
| # | Decision | Ruling |
|---|---|---|
| D-21C-1 | Sequence after PRD32 (console host / Moderation drain) | **YES** |
| D-21C-2 | Comments mom-only at launch | **YES** |

## DISPATCH PROMPT (paste into a FRESH session — after batch-9 decisions + PRD32 close-out)
```
⚙ STEP 1 (type this first, before pasting anything else): /model claude-sonnet-5[1m]
⚙ STEP 2: paste the rest of this prompt.

You are the implementation worker for PRD-21C — AI Vault Engagement & Community. Pack:
claude/dispatch-factory/PRD21C.md (6 rulings). Evidence: claude/dispatch-factory/VAULT-RECON.md
(21C section). Decisions RESOLVED per recommendations unless the founder noted otherwise.

FRESHNESS PREAMBLE: pack produced 2026-07-04. git log --since=2026-07-04; VERIFY the PRD32
build landed (its Moderation tab + staff model are your host — if absent, STOP and tell the
founder); re-verify the dead pre-seeded columns are still writerless; next free migration
number before every push.

READ FIRST: (1) prds/ai-vault/PRD-21C-AI-Vault-Engagement-Community.md — FULL, every word;
(2) prds/addenda/PRD-21C-Cross-PRD-Impact-Addendum.md (note: its "completed" claim is FALSE —
the factory recon corrected it); (3) the PRD32 build's feature-decision file (the console you
extend); (4) the pack + recon. Create .claude/rules/current-builds/PRD-21C-vault-engagement.md
(no YAML frontmatter), pre-build summary, founder approval BEFORE code.

HARD RULES: comment visibility is mom-only at the RLS layer (the teen/dad blocked-read probes
are load-bearing); moderation = dedicated Haiku EF, cost-logged, approve/flag/reject +
silent-hold semantics per the PRD; reporter identity never reaches users; counters update via
triggers only (no client-side counting); recommendation rows rule-based (no ML, no new
pipelines); victories via the connector, celebration-only; content-protection conventions
(#85) untouched; Convention #257 dates; zero hardcoded colors + density.

PROOF: the new spec + tsc -b + lint + leak-pass pin. Ask before shared-fixture suites. NOTHING
COMMITS until green + founder eyes-on. Selective staging; founder confirms before push.
Close-out: Checkpoint 5, STUB sweep (21C rows + the addendum's false completed claim noted),
governance line for UGC moderation recorded, live_schema regen, archive build file.
```
