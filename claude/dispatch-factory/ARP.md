# Factory Item — ARP: Attorney Review Package (COPPA / Privacy, Missouri)

> **Factory status: APPROVED (founder amendment to PRD40, 2026-07-04) — dispatch-ready NOW.**
> **Time-sensitive: this is a Fable-session deliverable; the Fable intro pricing window ends
> 2026-07-07.** Item ID: ARP. Parent: PRD40 (its Slice-3 disclosure copy + consent-template
> seeds consume this package's attorney-approved output).
>
> **What it is:** a drafting-preparation package for the founder's LICENSED ATTORNEY, who is
> the sign-off — nothing legal-relying ships without attorney approval. The Fable session
> drafts; the attorney reviews, edits, and approves. Missouri-specific framing (Three Little
> Lanterns LLC's home state) plus federal COPPA requirements.

## Deliverables (four documents, drafted for attorney mark-up)

1. **Privacy Policy draft** — full-platform data practices: what's collected per feature
   (per PRD-40 Screen 1's enumeration + the two-door addendum's auth artifacts), processors
   (Supabase/Vercel/Stripe/OpenRouter/Anthropic/OpenAI), retention windows (PRD-40's per-table
   policy), parental rights (review/export/delete/revoke, 14-day grace), children's-data
   section, Missouri + federal applicability notes, contact/effective-date scaffolding.
2. **COPPA Direct Notice** — the notice-to-parents document (16 C.F.R. §312.4 shape): what
   is collected from under-13 children, how it's used, disclosure practices, the verifiable-
   consent method ($1 charge), revocation rights and effect.
3. **Parental-Consent Flow Copy** — the exact user-facing text of PRD-40 Screens 1–5 (the
   five-section scroll-enforced disclosure) + Screen 7 additional-child acknowledgment +
   revocation-flow copy (Screen 9), each marked with the PRD's `[LAWYER REVIEW REQUIRED]`
   anchors resolved into reviewable draft language.
4. **Data-Practices Summary** — the attorney's technical grounding: per-table inventory of
   children's data (source: live_schema + PRD-40's cascade registry incl. two-door shadow-auth
   artifacts), AI-provider data-flow map (what leaves the platform, no-training clauses),
   embedding handling, retention/deletion mechanics, the dormant-but-built + cohort-scoping
   posture, and an explicit open-questions list FOR the attorney — **which MUST include the
   legacy kid-privacy carve-outs question (founder, 2026-07-04): the shipped private-Journal /
   share_with_mom=false / lila_conversation View-As filtering stands today; the no-hiding
   principle freezes the pattern going forward; counsel advises whether the D-PRD40-3 posture
   (daily-UX privacy + full parental access via the formal COPPA review/export surfaces)
   satisfies parental-rights requirements for under-13 children, and the carve-outs get
   decided ONCE on that advice. Never widen visibility retroactively.**

## Ground rules for the drafting session

- Drafts are PREPARATION, clearly watermarked "DRAFT — FOR ATTORNEY REVIEW — NOT LEGAL ADVICE."
- Source fidelity: every factual claim about data practices traces to the PRD-40 text, the
  live schema, or the codebase — never invented. Unknowns go on the attorney question list,
  never papered over.
- Missouri specifics researched at drafting time (web-capable session) — state privacy/UDAP
  considerations flagged for counsel rather than concluded.
- Output location: `claude/legal-drafts/` (new folder; NOT prds/, NOT dispatch-factory/).
- The PRD-40 build later consumes the ATTORNEY-APPROVED versions; `lawyer_approved_at` stays
  NULL until counsel signs off.

---

## DISPATCH PROMPT (paste into a FRESH session — ideally before 2026-07-07)

```
⚙ STEP 1 (type this first, before pasting anything else): /model claude-fable-5[1m]
⚙ STEP 2: paste the rest of this prompt.

You are drafting the ATTORNEY REVIEW PACKAGE for MyAIM Central's COPPA/privacy compliance
(founder amendment to the PRD40 pack, 2026-07-04). Spec: claude/dispatch-factory/ARP.md (the
four deliverables + ground rules are binding). The founder's licensed attorney is the
sign-off; you are preparing their review materials, not giving legal advice.

READ FIRST: (1) prds/foundation/PRD-40-COPPA-Compliance-Parental-Verification.md — FULL
(Screens 1-9 disclosure copy anchors, retention policy, cascade registry, key decisions);
(2) claude/dispatch-factory/PRD40.md + PRD40-RECON.md (the two-door addendum requirements and
filterKidPrivate ruling that shape the disclosure content); (3) CLAUDE.md's data-practice
conventions (#6/#225/#243/#273) + claude/live_schema.md for the factual data inventory;
(4) prds/addenda/PRD-40-Two-Door-Auth-Addendum.md IF it exists yet (if not, draft against the
PRD40 pack's ruling-2 description of the two-door artifacts and flag the gap for counsel).

RESEARCH (web): current COPPA rule requirements (16 C.F.R. Part 312, incl. any amendments in
force), FTC guidance on verifiable parental consent via payment-card, and Missouri-specific
privacy/consumer-protection considerations for a family-data SaaS operated by a Missouri LLC.
Cite sources in the drafts' margin notes for the attorney.

PRODUCE the four documents into claude/legal-drafts/ (create the folder): privacy-policy-
draft.md, coppa-direct-notice-draft.md, parental-consent-flow-copy-draft.md,
data-practices-summary.md — each watermarked "DRAFT — FOR ATTORNEY REVIEW — NOT LEGAL ADVICE",
each ending with an explicit QUESTIONS FOR COUNSEL section. Factual fidelity rule: every data-
practice claim traces to PRD/schema/code; unknowns are flagged, never invented. Write for a
lawyer's mark-up (clean structure, numbered sections), in the platform's warm-but-plain voice
for the user-facing pieces (consent flow copy especially — a tired mom must actually read it).

Deliver: the four files + a one-page cover memo for the attorney (what the platform is, what's
built vs dormant, the cohort plan, what you need from them and in what order). Tell the founder
exactly what to send and to whom when you finish.
```
