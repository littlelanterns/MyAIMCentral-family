-- ============================================================================
-- PRD-40 COPPA Consent Template — v1.1.0 (text revision, mid-ceremony)
-- ============================================================================
-- Founder text rulings, 2026-09-07 (PRIVACY-TEXT+BATCH dispatch):
--   a. Vendor names OUT, categories IN — "our database and storage
--      providers," "our hosting provider," "our AI providers," "our
--      payment processor." (Was: Supabase / Vercel / Anthropic / OpenRouter
--      / OpenAI / Stripe named directly.)
--   b. "Reach a Human" bullet removed entirely — no response-time
--      commitments. A plain contact email remains.
--   c. Founder's home address and phone number removed from all
--      consumer-facing text. Email-only.
--
-- coppa_consent_templates rows are immutable once published (retire, never
-- edit — see the table comment on migration 100305). This migration:
--   1. Retires v1.0.0 (sets retired_at). Mid-flow retirement is explicitly
--      fine per the commit_consented_members RPC (migration 100315,
--      "Template: must exist... Mid-flow retirement is fine — the consent
--      references the version mom actually saw"). Any child already
--      consented under v1.0.0 keeps a valid, permanent consent record
--      referencing that exact retired version — nothing about their
--      consent changes.
--   2. Publishes v1.1.0 with the revised text, lawyer_approved_at NULL —
--      the R-8/OD-4 dormancy gate carries forward unchanged. Only
--      founding families (or, per commit_consented_members, any family
--      once a future version IS lawyer-approved) may consent against an
--      unapproved version.
--
-- Sections 1 (what_we_collect) and 5 (parent_affirmation) contained no
-- vendor names or address/phone references in v1.0.0 and are carried
-- forward byte-identical. Sections 2, 3, and 4 are revised per rulings
-- a/a/b+c respectively.
--
-- Idempotent: safe to re-run (INSERT ... WHERE NOT EXISTS; UPDATE is a
-- no-op if retired_at is already set).
-- ============================================================================

BEGIN;

-- ──────────────────────────────────────────────────────────────────────────
-- 1. Retire v1.0.0.
-- ──────────────────────────────────────────────────────────────────────────

UPDATE public.coppa_consent_templates
SET retired_at = now()
WHERE version = '1.0.0' AND retired_at IS NULL;

-- ──────────────────────────────────────────────────────────────────────────
-- 2. Publish v1.1.0.
-- ──────────────────────────────────────────────────────────────────────────

INSERT INTO public.coppa_consent_templates (
  version, section_what_we_collect, section_how_lila_uses, section_who_sees_it,
  section_your_rights, section_parent_affirmation, lawyer_approved_at, lawyer_name, notes
)
SELECT
  '1.1.0',
$section1$Because [Child Name] is under 13, U.S. federal law (COPPA) requires us to tell you exactly what we'd collect about them, get your consent, and verify you're their parent or legal guardian. Here's the complete list — this is everything:

- Their basics — the name or nickname you give them, their age, and how they fit in your family.
- Their sign-in, if you set one up — a PIN (we store only a scrambled version, never the actual number) or a secret picture they tap to sign in (we store a scrambled code, never a readable record of which picture is theirs). Behind the scenes, we also create a hidden technical login record that makes their sign-in work — it's plumbing, not a profile, and it gets deleted with everything else if you ever revoke.
- An avatar or photo, if you upload one.
- Tasks and routines you assign them, and when they check things off — including a photo of finished work, if you turn that option on.
- What they write or record in features you turn on for them — journal entries (typed or spoken; spoken entries are turned into text), goals, reflections, tracker check-ins, worksheets, and messages with family members.
- Their conversations with LiLa, our AI assistant — only if you give them LiLa access.
- Notes you write about them — like the notes in Archives you might keep about their health, schooling, or preferences.
- Allowance and reward records — points, stickers, earnings, and the like.
- The technical basics any app needs to work on their device (like a session token and the device type). We use no ad trackers and no third-party analytics — for anyone in your family, ever.

That's the whole list. If it's not on it, we don't collect it from [Child Name].$section1$,
$section2$LiLa is our AI assistant. Here's how AI features handle your child's information:

- AI works for your family, not on it. LiLa uses your family's information to answer your questions, personalize suggestions, and support your parenting — never to train AI models.
- Where processing happens. When someone in your family uses LiLa, the conversation — plus family context you've approved — is processed by our AI providers to generate the response. They process it under agreements limiting their use of your data to providing our service.
- Search memory stays home. The "search memory" we build from your family's items (embeddings) is stored only in our own database and is never shared.
- LiLa doesn't fish. LiLa is designed never to ask your child for personal information. What LiLa knows about [Child Name] comes from what you set up and what your child does in features you enabled — not from LiLa quizzing them.
- You hold the off switch. You can turn off LiLa (or any AI feature) for [Child Name] at any time in Settings, and their AI conversations auto-delete after 90 days regardless.$section2$,
$section3$- You see everything. As the verifying parent, you can always see what's collected about [Child Name] — including anything they mark "private" in daily views, through your Privacy & Consent page and data export. (Daily views give kids small private corners to build honest journaling habits; your formal review tools always include everything.)
- Other family members see only what you allow. Your spouse, other trusted adults, and siblings see [Child Name]'s information only as far as the permissions you grant.
- We never sell [Child Name]'s information. Ever.
- No advertisers, no marketers, no data brokers. None of them get your child's information, full stop.
- The only outside companies that touch it are the ones that run the platform for us, under contract: our database and storage providers, our hosting provider, our AI providers (Section 2), and our payment processor (which processes your verification charge — your card details go to them, never to us). They may use your family's data only to provide our service.
- Law enforcement gets information only through valid legal process, and we'll tell you if we're ever required to hand something over unless the law forbids us from telling you.$section3$,
$section4$These aren't buried-in-the-fine-print rights. They're buttons in your Settings:

- See it all. Review everything collected about [Child Name], any time, in their detail view and your Privacy & Consent page.
- Take a copy. Export all of [Child Name]'s data as a readable archive, emailed to you.
- Fix or remove pieces. Edit or delete individual records whenever you like.
- Turn features off. Stop collection for any feature — including LiLa — per child, any time.
- Walk away cleanly. Revoke your consent for [Child Name] entirely. Their data is deleted after a 14-day grace window (in case you tapped by accident), and revoking for one child never touches your other children's data.
- Reach us anytime. Email aimagicformoms@gmail.com with any privacy question or concern about [Child Name].

One more promise: we never require [Child Name] to hand over more information than an activity actually needs in order to participate.$section4$,
$section5$I affirm that I am the parent or legal guardian of [Child Name] and of every child I add to this family, and I consent to the collection, use, and disclosure of their personal information as described in Sections 1-4.

To confirm you're an adult, federal law lets us use a small payment-card charge — so we'll charge your card $1.00, one time. You won't be charged again when you add more children. It will show up on your statement as MYAIM VERIFY, and we'll email you a receipt along with a copy of everything you just read.

By tapping Verify & Continue, you authorize a one-time, non-refundable $1.00 verification charge to the card above.$section5$,
  NULL,
  NULL,
  'DRAFT — pending attorney review. Supersedes v1.0.0 (retired same migration). Founder text rulings 2026-09-07: vendor names replaced with generic service categories (Section 2/3); "Reach a Human" bullet removed, replaced with a plain contact-email line with no response-time commitment (Section 4); founder home address and phone number removed from all consumer-facing text, email-only. Sections 1 and 5 are byte-identical to v1.0.0 (no vendor/address text existed there). This version cannot be shown to any real (non-founder) user for actual consent until lawyer_approved_at is set — see decision file R-8/OD-4 dormant-block behavior. Source: claude/legal-drafts/parental-consent-flow-copy-draft.md v1.1 revision, same date.'
WHERE NOT EXISTS (
  SELECT 1 FROM public.coppa_consent_templates WHERE version = '1.1.0'
);

-- ──────────────────────────────────────────────────────────────────────────
-- 3. Self-verification.
-- ──────────────────────────────────────────────────────────────────────────

DO $$
DECLARE
  v_old_retired  TIMESTAMPTZ;
  v_new_count    INTEGER;
  v_new_approved TIMESTAMPTZ;
BEGIN
  SELECT retired_at INTO v_old_retired FROM public.coppa_consent_templates WHERE version = '1.0.0';
  IF v_old_retired IS NULL THEN
    RAISE EXCEPTION '[100332] v1.0.0 was not retired';
  END IF;

  SELECT COUNT(*), lawyer_approved_at INTO v_new_count, v_new_approved
  FROM public.coppa_consent_templates WHERE version = '1.1.0'
  GROUP BY lawyer_approved_at;
  IF v_new_count IS DISTINCT FROM 1 THEN
    RAISE EXCEPTION '[100332] v1.1.0 not seeded exactly once (found %)', COALESCE(v_new_count, 0);
  END IF;
  IF v_new_approved IS NOT NULL THEN
    RAISE EXCEPTION '[100332] v1.1.0 seeded with a non-NULL lawyer_approved_at — dormancy gate violated';
  END IF;

  RAISE NOTICE '[100332] v1.0.0 retired at %, v1.1.0 published (dormant, lawyer_approved_at NULL)', v_old_retired;
END $$;

COMMIT;
