# Parental-Consent Flow Copy — DRAFT (PRD-40 Screens 1–9)

> **DRAFT — FOR ATTORNEY REVIEW — NOT LEGAL ADVICE**
>
> Prepared 2026-07-04. This document resolves every `[LAWYER REVIEW REQUIRED]` anchor in
> PRD-40 into reviewable draft language. The text counsel approves here becomes, verbatim,
> **consent template version 1.0.0** in the platform's versioned-consent system
> (`coppa_consent_templates`): five stored sections — *what_we_collect*, *how_lila_uses*,
> *who_sees_it*, *your_rights*, *parent_affirmation* — plus the surrounding flow copy. The
> software will not allow any real parent to consent until counsel's approval date is
> recorded against this version (`lawyer_approved_at`).
>
> **Voice:** deliberately warm and plain. The reader is a tired mom adding her kids at
> 9:40pm. The five-section, checkbox-per-section, scroll-enforced design is the evidentiary
> backbone (each section must be scrolled through before its checkbox activates); the words
> must earn actually being read. Please preserve readability in edits where you can.
>
> **Mechanics counsel should know:** nothing is saved and nothing is charged until Screen 5
> completes. Cancel at any point = no child profile, no data, no charge. The exact text
> version shown is stored with each consent, so we can always prove what a parent saw.
> Dynamic tokens: `[Child Name]`, `[Date]`, `[mom's email]`.

---

## SCREEN 1 of 5 — "What We Collect" *(template section: `what_we_collect`)*

**Header:** Protecting [Child Name]'s Privacy — Section 1 of 5

Because [Child Name] is under 13, U.S. federal law (COPPA) requires us to tell you exactly
what we'd collect about them, get your consent, and verify you're their parent or legal
guardian. Here's the complete list — this is everything:

- **Their basics** — the name or nickname you give them, their age, and how they fit in your
  family.
- **Their sign-in, if you set one up** — a PIN (we store only a scrambled version, never the
  actual number) or a secret picture they tap to sign in (we store a scrambled code, never a
  readable record of which picture is theirs). Behind the scenes, we also create a hidden
  technical login record that makes their sign-in work — it's plumbing, not a profile, and it
  gets deleted with everything else if you ever revoke.
- **An avatar or photo**, if you upload one.
- **Tasks and routines** you assign them, and when they check things off — including a photo
  of finished work, if you turn that option on.
- **What they write or record in features you turn on for them** — journal entries (typed or
  spoken; spoken entries are turned into text), goals, reflections, tracker check-ins,
  worksheets, and messages with family members.
- **Their conversations with LiLa**, our AI assistant — only if you give them LiLa access.
- **Notes you write about them** — like the notes in Archives you might keep about their
  health, schooling, or preferences.
- **Allowance and reward records** — points, stickers, earnings, and the like.
- **The technical basics** any app needs to work on their device (like a session token and
  the device type). We use no ad trackers and no third-party analytics — for anyone in your
  family, ever.

That's the whole list. If it's not on it, we don't collect it from [Child Name].

**Checkbox:** ☐ I've read what will be collected about [Child Name].

> **[PRD anchor resolved: Screen 1 `[LAWYER REVIEW REQUIRED — final enumeration of collected
> data must be confirmed by attorney against actual platform behavior at beta launch]`.
> Counsel note: the enumeration above matches the Data-Practices Summary §3 inventory,
> including the two-door sign-in artifacts (added per the 2026-07-04 ruling; the internal
> spec addendum documenting them is still being papered — see Data-Practices Summary §7.2).
> A final conform-check against the schema is a stated build-exit step.]**

---

## SCREEN 2 of 5 — "How LiLa Uses This" *(template section: `how_lila_uses`)*

**Header:** Protecting [Child Name]'s Privacy — Section 2 of 5

LiLa is our AI assistant. Here's how AI features handle your child's information:

- **AI works for your family, not on it.** LiLa uses your family's information to answer your
  questions, personalize suggestions, and support your parenting — **never to train AI
  models.**
- **Where processing happens.** When someone in your family uses LiLa, the conversation —
  plus family context you've approved — is processed by our AI service providers (Anthropic,
  via a routing service called OpenRouter, and OpenAI for voice-to-text and search
  relevance). They process it to generate the response and are bound by agreements limiting
  their use of your data to providing our service. *(They may not use your family's content
  to train their models. — see counsel note below.)*
- **Search memory stays home.** The "search memory" we build from your family's items
  (embeddings) is stored only in our own database and is never shared.
- **LiLa doesn't fish.** LiLa is designed never to ask your child for personal information.
  What LiLa knows about [Child Name] comes from what *you* set up and what your child does in
  features you enabled — not from LiLa quizzing them.
- **You hold the off switch.** You can turn off LiLa (or any AI feature) for [Child Name] at
  any time in Settings, and their AI conversations auto-delete after 90 days regardless.

**Checkbox:** ☐ I understand how LiLa and AI features use [Child Name]'s information.

> **[Counsel notes: (1) The italicized no-training sentence must not ship until the operative
> Anthropic/OpenAI/OpenRouter terms and routing settings are verified (Data-Practices Summary
> §5.4, Q3). (2) "LiLa doesn't fish" is a design commitment enforced today at the
> system-prompt layer; deterministic runtime output-validation is a named prerequisite
> (PRD-41) for under-13 access and is not yet built — confirm you're comfortable with this
> phrasing given that enforcement posture, or soften to "LiLa is instructed never to
> ask…".]**

---

## SCREEN 3 of 5 — "Who Sees It" *(template section: `who_sees_it`)*

**Header:** Protecting [Child Name]'s Privacy — Section 3 of 5

- **You see everything.** As the verifying parent, you can always see what's collected about
  [Child Name] — including anything they mark "private" in daily views, through your Privacy
  & Consent page and data export. (Daily views give kids small private corners to build
  honest journaling habits; your formal review tools always include everything.)
- **Other family members see only what you allow.** Your spouse, other trusted adults, and
  siblings see [Child Name]'s information only as far as the permissions you grant.
- **We never sell [Child Name]'s information. Ever.**
- **No advertisers, no marketers, no data brokers.** None of them get your child's
  information, full stop.
- **The only outside companies that touch it** are the ones that run the platform for us,
  under contract: Supabase (database and storage), Vercel (hosting), the AI providers from
  Section 2, and Stripe (which processes your verification charge — your card details go to
  Stripe, never to us). They may use your family's data only to provide our service.
- **Law enforcement** gets information only through valid legal process, and we'll tell you
  if we're ever required to hand something over unless the law forbids us from telling you.

**Checkbox:** ☐ I understand who can see [Child Name]'s information.

> **[Counsel note: bullet 1's parenthetical implements ruling D-PRD40-3 (kid-private
> daily-UX carve-outs + full formal parental access). It is contingent on your answer to the
> carve-outs question — Data-Practices Summary §8.3/Q1. If your advice changes the posture,
> this bullet changes.]**

---

## SCREEN 4 of 5 — "Your Rights" *(template section: `your_rights`)*

**Header:** Protecting [Child Name]'s Privacy — Section 4 of 5

These aren't buried-in-the-fine-print rights. They're buttons in your Settings:

- **See it all.** Review everything collected about [Child Name], any time, in their detail
  view and your Privacy & Consent page.
- **Take a copy.** Export all of [Child Name]'s data as a readable archive, emailed to you.
- **Fix or remove pieces.** Edit or delete individual records whenever you like.
- **Turn features off.** Stop collection for any feature — including LiLa — per child, any
  time.
- **Walk away cleanly.** Revoke your consent for [Child Name] entirely. Their data is deleted
  after a 14-day grace window (in case you tapped by accident), and revoking for one child
  never touches your other children's data.
- **Reach a human.** Contact Three Little Lanterns LLC directly about any privacy concern:
  [privacy email — FOUNDER INPUT NEEDED], [phone — FOUNDER INPUT NEEDED], [mailing address —
  FOUNDER INPUT NEEDED].

One more promise: we never require [Child Name] to hand over more information than an
activity actually needs in order to participate.

**Checkbox:** ☐ I understand my rights regarding [Child Name]'s information.

---

## SCREEN 5 of 5 — "Verify You're the Parent" *(template section: `parent_affirmation`)*

**Header:** Protecting [Child Name]'s Privacy — Section 5 of 5

**Affirmation checkbox:**

☐ I affirm that I am the parent or legal guardian of [Child Name] and of every child I add
to this family, and I consent to the collection, use, and disclosure of their personal
information as described in Sections 1–4.

**Verification explainer (below the affirmation):**

To confirm you're an adult, federal law lets us use a small payment-card charge — so we'll
charge your card **$1.00, one time**. You won't be charged again when you add more children.
It will show up on your statement as **MYAIM VERIFY**, and we'll email you a receipt along
with a copy of everything you just read.

*(Stripe payment form appears here. Card details go directly to Stripe — we never see them.)*

**Authorization line (above the button):**

By tapping **Verify & Continue**, you authorize a one-time, non-refundable $1.00 verification
charge to the card above.

**Error state (charge fails):** "We couldn't process that verification charge. Please check
your card details and try again, or use a different card. Nothing has been saved or charged."

> **[PRD anchor resolved: Screen 5 `[LAWYER REVIEW REQUIRED — final language of the
> affirmation statement and the verification authorization]`. Counsel notes: (1) the
> affirmation covers "every child I add" because verification is per-parent while consent
> records are per-child — each later child still gets its own acknowledged consent record
> (Screen 7); confirm the affirmation may be drafted family-forward like this, or narrow it
> to [Child Name] only. (2) We added "and disclosure" to the consent verb list so the consent
> captures the service-provider disclosures in Section 3 — confirm. (3) Confirm
> "non-refundable" is acceptable consumer-facing framing (MMPA/UDAP check).]**

---

## SCREEN 6 — Verification Success

**✓ Verified!**

Thank you for taking the time to protect your family's privacy. Consent records for the
following children have been saved:

- [Child Name 1] …

You can review, export, or revoke any of this anytime in **Settings → Privacy & Consent**.
The $1.00 verification charge will appear on your statement as **MYAIM VERIFY**. A copy of
this consent record — including the exact text you read — has been emailed to [mom's email].

**[Continue to Family Setup →]**

---

## SCREEN 7 — Adding Another Child (acknowledgment, no charge)

**Adding [Child Name] (under 13)**

You verified your parental consent on [Date]. Adding [Child Name] means the same data
practices apply to them.

[Review what's collected →] [Review how LiLa uses it →] [Review who sees it →]
*(each expands the full Screen 1–3 text, read-only)*

☐ I acknowledge and consent to the collection, use, and disclosure of [Child Name]'s
information as described.

**[← Cancel] [Acknowledge & Continue →]**

> **[Counsel note: confirm this lightweight per-child re-acknowledgment (no new charge, links
> to full disclosures, consent verb list matched to Screen 5) is sufficient for children
> added after verification.]**

---

## SCREEN 9 — Revocation Flow (3 steps)

**Step 1 — what happens:**

**Revoke Consent for [Child Name]**

If you revoke consent for [Child Name]:

- Their profile will be removed from your family in 14 days.
- **Everything** we've collected about them will be permanently deleted: tasks, journal
  entries and recordings, LiLa conversations, notes about them, photos, sign-in records, and
  all the rest of what you consented to in Section 1.
- Your consent record itself is kept (marked revoked) — it's the legal proof of what you
  agreed to and when.
- Your other children's data is not affected.

You have 14 days to change your mind. After that, deletion is permanent and cannot be undone.

One honest footnote: if a sibling wrote about [Child Name] in their own journal, that stays —
it's the sibling's own writing. You can always edit or remove those entries yourself.

**[← I'd like to keep things as they are] [Continue to Revoke →]**

**Step 2 — confirm:** Type [Child Name] to confirm. *(optional reason checkboxes)*

**Step 3 — confirmation:**

**✓ Consent Revoked.** [Child Name]'s data will be permanently deleted on [Date + 14 days].
Until then: their profile is hidden, nothing new is collected about them, and you can undo
this any time in Settings → Privacy & Consent. A confirmation has been emailed to you.

> **[Counsel notes: (1) the sibling-journal footnote surfaces the cascade's
> sibling-preservation rule to the parent at the moment of revocation — we'd rather disclose
> it than have a parent discover it later; confirm. (2) Confirm the 14-day grace framing is
> consistent with the duty to delete promptly on revocation.]**

---

## EMAILS (transactional copy)

**E1 — Verification receipt (sent at Screen 6):**
Subject: *Your consent record for [Child Name(s)] — MyAIM Central*
Body: thank-you line; children covered; date/time; verification method ($1.00 card charge,
statement descriptor MYAIM VERIFY); **the full text of Sections 1–5 as acknowledged
(version-stamped)**; how to review/export/revoke (Settings → Privacy & Consent); our contact
block. *(Doubles as the emailed direct notice — see Direct Notice draft, Q2.)*

**E2 — Revocation confirmation:** revocation date; scheduled deletion date; what happens
during the window; one-tap "Undo Revocation" link; contact block.

**E3 — Deletion reminders (7 days / 1 day before):** date; undo link; "after this date,
deletion is permanent."

**E4 — Deletion completed:** "As you requested, [Child Name]'s information has been deleted."
Note that the consent record itself is retained as legal evidence; contact block.

**E5 — Age transition:** "[Child Name] turns 13 today — COPPA consent no longer governs their
data going forward; their data is kept and nothing changes unless you change it; here's what
that means…" **[Counsel: light review — this one is informational.]**

---

## QUESTIONS FOR COUNSEL (consent flow)

1. **Template lock-in:** the five section texts above become immutable consent-template
   version 1.0.0 on your approval. Any change you anticipate wanting later means a new
   version and (where material) fresh consent — please review with that weight in mind.
2. **Affirmation scope (Screen 5, note 1):** family-forward affirmation vs. per-child-only?
3. **Consent verbs:** we standardized on "collection, use, and disclosure" across Screens 5
   and 7 — confirm.
4. **Evidentiary design:** scroll-past enforcement + per-section checkboxes + versioned text
   + IP/user-agent capture at verification — anything you'd add to strengthen the record?
5. **The two counsel-contingent passages:** Screen 2's no-training sentence and Screen 3's /
   Screen 2's kid-private and "LiLa doesn't fish" language (see inline notes) — your rulings
   propagate to the privacy policy and direct notice.
6. **Sibling-preservation disclosure (Screen 9):** keep, move, or strengthen?
7. **Missing-anchor sweep:** PRD-40 marks all disclosure strings `[LAWYER REVIEW REQUIRED]`;
   we believe every anchor is resolved in this document (Screens 1, 2, 3, 4, 5, 7, 9 +
   emails). If you spot consent-relevant copy we haven't drafted (e.g., the under-13 blocked-
   write message other family members see), flag it and we'll add it to the package.
