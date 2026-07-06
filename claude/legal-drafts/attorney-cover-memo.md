# Cover Memo for Counsel — MyAIM Central Privacy/COPPA Review Package

> **DRAFT — FOR ATTORNEY REVIEW — NOT LEGAL ADVICE**
> From: Tenise Wertman, Three Little Lanterns LLC (Missouri) · Prepared 2026-07-04
> Re: COPPA and privacy review package for MyAIM Central — four drafts + this memo

## 1. What this is

I run **MyAIM Central** (myaimcentral.com), a subscription family-management platform for
mothers — tasks, journals, calendars, allowance, and a family-context AI assistant ("LiLa").
The account-owning parent administers everything; family members she adds (other adults,
teens, children under 13) use it under her control. **Users will come from every U.S. state**;
Missouri is only my home state. No ads, no data sale, no third-party trackers.

**Current status, honestly:** the platform is live but used only by my own family and test
families. The COPPA consent machinery is fully specified but **not yet built**; it will ship
"dormant" — the consent screens cannot be used by a real parent until your approved text is
loaded and an approval date is recorded in the software (`lawyer_approved_at`). **Your
sign-off is a literal gate in the code.** Beta cohort 1 will contain only families with no
children under 13; cohort 2 (under-13 families) opens only after your review. My own under-13
kids currently use the app on the theory that I'm the consenting parent; I plan to backfill my
family's formal consent records first — please confirm that posture.

## 2. The package (read in this order)

1. **`data-practices-summary.md`** — the technical grounding: full inventory of children's
   data, every third-party processor, AI data flows, retention/deletion mechanics, and the
   14 questions we need ruled on. **Start here.**
2. **`parental-consent-flow-copy-draft.md`** — the consent screens a parent actually reads.
   Your approved version becomes immutable "consent template v1.0.0" and gates cohort 2.
3. **`coppa-direct-notice-draft.md`** — the § 312.4 notice-to-parents document.
4. **`privacy-policy-draft.md`** — the full public policy, written for a nationwide audience.

Timing note: the **amended COPPA Rule** (published Apr. 22, 2025) has been fully enforceable
since **April 22, 2026** — the drafts are written to the amended rule (written retention
policy, written security program, expanded direct-notice content, separate consent for
non-integral third-party disclosures).

## 3. What we need from you, in order

1. **Threshold rulings** (they shape everything else): (a) the kid-privacy carve-outs
   question — Data-Practices Summary §8.3, my one mandatory question; (b) service
   classification under COPPA (child-directed portions vs. mixed-audience vs. actual-
   knowledge); (c) whether our AI providers are "integral" service providers or third-party
   disclosures needing separate consent; (d) whether the $1-charge verification method as
   designed passes muster.
2. **Mark up and approve the consent-flow copy and direct notice** — these unblock the
   under-13 cohort and the build.
3. **Mark up the privacy policy.**
4. **The multi-state questions in §4 below** — which regimes bind now, and the growth
   triggers you want me to watch.
5. Tell me what you need for the **written information security program** the amended rule
   requires (§ 312.8) — template, or shall we draft for your review?

## 4. Multi-state applicability (dedicated section — please rule, don't let me guess)

The drafts never assume a user's state. State law attaches based on the **user's** residence,
not ours. My read of the landscape, laid out as facts + thresholds for you to rule on:

**(a) Regimes that plausibly reach us NOW, at ~100-family scale** *(little or no
size/volume threshold)*:

| Regime | Why it plausibly reaches us now | What I need from you |
|---|---|---|
| **COPPA (federal, amended)** | Applies at any size once we knowingly collect under-13 data | The rulings in §3.1 |
| **FTC Act §5 + state UDAP incl. Missouri MMPA** (Mo. Rev. Stat. §407.020) | Apply at any size; policy over-promises are the classic exposure; MO AG actively uses the MMPA for privacy | Red-line anything we can't fully honor |
| **NY Child Data Protection Act** (eff. 6/20/2025) | Covers under-18 NY minors; triggered by *actual knowledge* a user is a minor (we always know — the parent declares ages); no size threshold I can find | Does our parent-administered model satisfy it, esp. the 13–17 "informed consent" requirement for NY teens? |
| **WA My Health My Data Act / NV SB 370** | No size thresholds; "consumer health data" is broad and we hold parent-recorded health notes and mood tracking; WA has a private right of action | Do these attach now? If yes, we build the separate WA health-data policy + homepage link |
| **TX TDPSA / NE NDPA** | No volume floors; exempt "small businesses" (SBA definition) EXCEPT sensitive-data sale rules | Confirm we sit in the small-business carve-out and that "no sale" keeps us clear |
| **MD Kids Code (AADC)** (eff. 10/1/2024; DPIA deadline 4/1/2026) | Under-18 design-code duties for services "likely to be accessed" by children | Verify its applicability threshold against our size; DPIA needed? |

**(b) Regimes that attach as we GROW** — the ~20 state comprehensive privacy laws (CA, VA,
CO, CT, UT, IA, IN, TN, MT, OR, TX, FL, DE, NJ, NH, KY, MD, MN, NE, RI). Typical floors:
**35,000–100,000 state residents processed per year**, or ~$25M revenue (California), or
revenue-share-from-data-sale tests we'll never meet (we don't sell). Florida's is
effectively $1B+/ad-business only. At ~100 families nationwide we are far under every
volume floor — but several (RI, MD, DE, NH at 35K; MT at 25K) will attach well before the
100K states. Maryland's MODPA is the strictest on minors (data-sale ban, minimized
processing). *Please confirm this framing and tell me which two or three states' rules you
want the product designed to as the "strictest common denominator."*

**(c) Growth triggers I should watch and report to you** *(proposed standing instruction —
edit freely)*:
- Any single state's active families approaching **~25,000 residents** (first volume floors);
- Annual revenue approaching **$25M** (CCPA);
- Any product change adding: targeted advertising (never planned), sale/sharing of data
  (never planned), biometric processing (IL BIPA/TX CUBI territory), precise geolocation,
  video features (VPPA), or international users (GDPR/UK AADC);
- California AADC litigation (NetChoice v. Bonta): the Ninth Circuit's March 2026 ruling
  revived parts of the design code (age-estimation, default settings) and it's back at the
  district court — CA-specific duties may crystallize while we grow;
- Missouri enacting its own comprehensive law (bills have repeatedly died; none in force).

## 5. Ground rules I've followed

Every factual claim in these drafts traces to our specs, database schema, or a direct code
check; unknowns are marked, never invented (the honest gaps: AI-provider contract terms not
yet verified; transactional email provider not yet chosen; two internal spec addenda still
being papered). Each document ends with its own QUESTIONS FOR COUNSEL list. Nothing
user-facing ships until you approve it.

## 6. Deliverables I'm asking you for

1. Approved **consent template v1.0.0** (the five sections + affirmation).
2. Approved **direct notice**.
3. Approved **privacy policy**.
4. A short **multi-state posture memo** (what binds now; the watchlist).
5. Your requirements for the **written information security program**.
6. Answers to each draft's QUESTIONS FOR COUNSEL — the carve-outs question first.

Bill/scope note: if any of this sits outside your practice area (COPPA is specialized), I'd
welcome a referral or co-counsel recommendation rather than a stretch — the FTC's current
enforcement posture on children's privacy makes this the wrong corner to cut.

— Tenise Wertman, Three Little Lanterns LLC · [email] · [phone]

---

### Sources cited across the package (for your convenience)

[Amended COPPA Rule — Federal Register, Apr. 22, 2025](https://www.federalregister.gov/documents/2025/04/22/2025-05904/childrens-online-privacy-protection-rule) ·
[16 C.F.R. Part 312 (eCFR)](https://www.ecfr.gov/current/title-16/chapter-I/subchapter-C/part-312/section-312.4) ·
[FTC COPPA FAQ](https://www.ftc.gov/business-guidance/resources/complying-coppa-frequently-asked-questions) ·
[Davis Polk — FTC prioritizes COPPA enforcement as new obligations take effect](https://www.davispolk.com/insights/client-update/ftc-prioritizes-coppa-enforcement-new-compliance-obligations-take-effect) ·
[Hunton — COPPA amendment compliance deadline](https://www.hunton.com/privacy-and-cybersecurity-law-blog/coppa-rule-amendment-compliance-deadline-approaches) ·
[Fenwick — amended COPPA rule & data retention](https://www.fenwick.com/insights/publications/what-the-amended-coppa-rule-means-for-data-retention-practices) ·
[MO AG statutory guide](https://ago.mo.gov/get-help/programs-services-from-a-z/identity-theft-data-security/statutory-guide/) ·
[Chambers — Data Protection & Privacy 2026, USA-Missouri](https://practiceguides.chambers.com/practice-guides/data-protection-privacy-2026/usa-missouri/trends-and-developments) ·
[MultiState — 20 state privacy laws in effect 2026](https://www.multistate.us/insider/2026/2/4/all-of-the-comprehensive-privacy-laws-that-take-effect-in-2026) ·
[IAPP US State Privacy Legislation Tracker](https://iapp.org/resources/article/us-state-privacy-legislation-tracker) ·
[Foley — U.S. state comprehensive privacy law comparison chart (Jan. 2026)](https://www.foley.com/wp-content/uploads/2026/01/U.S.-State-Comprehensive-Consumer-Privacy-Law-Comparison-Chart_V16.pdf) ·
[MoFo — NY Child Data Protection Act](https://www.mofo.com/resources/insights/250701-the-new-york-child-data-protection-act) ·
[Goodwin — NY CDPA now in effect](https://www.goodwinlaw.com/en/insights/publications/2025/06/alerts-practices-dpc-new-yorks-child-data-protection-act-now-effect) ·
[Freshfields — updated COPPA Rule and Maryland Kids Code](https://www.freshfields.com/en/our-thinking/blogs/a-fresh-take/a-new-era-for-child-online-privacy-updated-coppa-rule-and-maryland-kids-code-imp-102mop1) ·
[DWT — WA MHMD & Nevada twin in effect](https://www.dwt.com/blogs/privacy--security-law-blog/2024/04/my-health-my-data-act-washington-nevada) ·
[Holland & Knight — Ninth Circuit's mixed CAADCA ruling (Mar. 2026)](https://www.hklaw.com/en/insights/publications/2026/03/ninth-circuit-issues-mixed-ruling-on-california-age-appropriate-design) ·
[Cooley — NetChoice v. Bonta injunction narrowed](https://www.cooley.com/news/insight/2026/2026-03-30-netchoice-v-bonta-ninth-circuit-narrows-injunction-against-californias-ageappropriate-design-code-act) ·
[Keller & Heckman — state kids' privacy 2025 review / 2026 outlook](https://www.khlaw.com/insights/kids-and-teens-privacy-2025-look-back-and-2026-predictions-part-ii-state-privacy-patchwork) ·
[Mayer Brown — tracking children's privacy legislation (Jan. 2026)](https://www.mayerbrown.com/en/insights/publications/2026/01/little-users-big-rules-tracking-childrens-privacy-legislation)
