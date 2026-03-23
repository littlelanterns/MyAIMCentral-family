# PRD-20 Cross-PRD Impact Addendum

**Created:** March 13, 2026
**Session:** PRD-20 (Safe Harbor)
**Purpose:** Documents how PRD-20 decisions affect prior PRDs and establishes new patterns/conventions.

---

## New Patterns Established

### Safety Concern Protocol (Replaces "Abuse Exception")
PRD-20 refines the PRD-19 "abuse exception" into a non-diagnostic "safety concern protocol." LiLa never labels situations as abuse, never diagnoses, and never assigns blame based on one person's perspective. Instead, LiLa paints a picture of what healthy looks like, acknowledges gaps without labeling, and guides the person toward safe humans. Direct crisis resources are provided only for immediate danger (Tier 3). This protocol applies system-wide, not just in Safe Harbor.

### Values-Aware Processing Convention
When LiLa is processing topics where a person's feelings or experiences may diverge from the family's established faith and values framework, LiLa validates the feelings (not the conclusion), explores what's underneath, acknowledges the family context without weaponizing it, and redirects to trusted humans within the family's framework. LiLa never affirms conclusions that contradict the family's values, and never defaults to culturally mainstream positions when they conflict with the family's established framework. This convention applies to Safe Harbor and should inform all LiLa relationship and emotional processing interactions.

### Prerequisite-Gated Access Pattern
PRD-20 establishes a new pattern for features that require informed consent before access: a multi-step gate where (1) a parent completes an orientation experience, (2) the parent accepts a liability agreement, and (3) the minor completes a literacy/preparedness module — all tracked in the database as prerequisites before the feature toggle becomes active. This pattern could apply to future sensitive features.

### Safe Harbor Data Exclusion Convention
Safe Harbor conversations are tagged with `is_safe_harbor = true` and explicitly excluded from all data aggregation, monthly review, context freshness review, reports, and Archives compilation. The only exception is the global crisis safety flag system. This establishes a pattern for "sanctuary data" that should never be compiled or summarized.

### Spousal Transparency Exception
Safe Harbor introduces the first explicit exception to mom's transparency access over dad's LiLa conversations. Even when mom has configured full transparency for dad's other conversations, Safe Harbor conversations are excluded. This establishes the principle that vulnerability-focused features may require stronger privacy boundaries than standard features.

### Separated Conversation History
Safe Harbor conversations are stored in the standard `lila_conversations` table but filtered out of the regular history view and into a dedicated Safe Harbor History view. The `is_safe_harbor` flag enables this separation. This pattern could apply to other features that need isolated history (e.g., future sensitive guided modes).

---

## Impact on PRD-02 (Permissions & Access Control)

**What changed:**
- New transparency exception: Safe Harbor conversations are exempt from spousal transparency access. Even with full transparency enabled for dad, Safe Harbor is excluded.
- New prerequisite-gated access pattern for teen Safe Harbor: three database-tracked prerequisites (orientation, consent, literacy) must all exist before the teen's access toggle becomes active.
- New feature keys registered: `safe_harbor`, `safe_harbor_guided`.

**Action needed:**
- Add Safe Harbor to the transparency exception documentation. Note that this is the first feature to override spousal transparency.
- Document the three-prerequisite pattern in the permission architecture as a reusable pattern for sensitive features.
- Register `safe_harbor` and `safe_harbor_guided` in the Feature Key Registry.

---

## Impact on PRD-05 (LiLa Core AI System)

**What changed:**
- Four new guided modes registered: `safe_harbor`, `safe_harbor_guided`, `safe_harbor_orientation`, `safe_harbor_literacy`.
- `is_safe_harbor` boolean column added to `lila_conversations`.
- Safe Harbor conversations must be excluded from standard conversation history queries.
- Global crisis override reiterated as applying to ALL conversations — PRD-20 specifies the full behavioral implementation.
- Light-touch auto-detection convention: in non-Safe-Harbor conversations, LiLa can mention Safe Harbor once when detecting significant distress.
- Follow-up care convention: LiLa checks in during the next regular conversation (mom/dad only).

**Action needed:**
- Register all four guided modes in the guided mode registry (Section 9 of Build Order).
- Add `is_safe_harbor` column to `lila_conversations` schema.
- Update standard conversation list queries to filter with `WHERE is_safe_harbor = false`.
- Add light-touch auto-detection to the global system prompt.
- Add follow-up care to post-conversation processing logic.

---

## Impact on PRD-08 (Journal + Smart Notepad)

**What changed:**
- Safe Harbor conversations can route content to Journal or Smart Notepad via standard post-conversation options.
- Important: once content is routed from Safe Harbor to Journal, it becomes journal content and does NOT carry the Safe Harbor data exclusion. The exclusion applies to the conversation itself, not to content the user deliberately saves elsewhere.

**Action needed:**
- No schema changes needed — uses existing routing patterns.
- Note the data boundary in documentation: Safe Harbor exclusion applies to conversations, not to user-initiated saves to other features.

---

## Impact on PRD-13 (Archives & Context)

**What changed:**
- Safe Harbor conversations explicitly excluded from any Archives aggregation queries.

**Action needed:**
- Add `is_safe_harbor = false` filter to any aggregation query that scans `lila_conversations`.

---

## Impact on PRD-19 (Family Context & Relationships)

**What changed:**
- The "abuse exception" in the Validate → Curiosity → Empower arc is refined into the "safety concern protocol." The behavioral change: instead of "what you're describing is not okay" (which labels and diagnoses), LiLa paints a picture of healthy, acknowledges the gap, and bridges to safe humans. The term "abuse exception" should be updated to "safety concern protocol" in PRD-19 references.
- Safe Harbor is the handoff destination when relationship interactions surface safety concerns. Handoff is a gentle suggestion with a link, never an auto-redirect.
- Safe Harbor conversations excluded from monthly data aggregation (`monthly_data_aggregations`) and context freshness review.
- Values-aware processing convention established — affects how LiLa handles relationship coaching when topics intersect with family values.

**Action needed:**
- Update PRD-19's "abuse exception" language to reference "safety concern protocol (see PRD-20)." Specifically, in the **Relationship Context Ethical Framework** section, the current text reading: *"Validation becomes stronger ('what you're describing is not okay'). Curiosity is NOT invited about the abuser's perspective... LiLa activates safety protocols per PRD-05."* should be updated to: *"Safety concern protocol activates (see PRD-20). LiLa paints a picture of what healthy looks like, acknowledges the gap without labeling or diagnosing, and guides toward safe humans. For immediate danger, Tier 3 crisis resources are provided directly. LiLa never labels a situation as 'abuse' based on one person's perspective."* The rest of the arc (validate → curiosity → empower) and the structural exception (curiosity about the other person's perspective is not invited when safety concerns are present) remain intact.
- Note Safe Harbor as the handoff destination from relationship mediation and Higgins/Cyrano coaching.
- Add `is_safe_harbor = false` filter to monthly aggregation queries and context freshness review.

---

## Impact on Build Order Source of Truth

**What changed:**
- PRD-20 completed. Titled "Safe Harbor."
- Safe Harbor moves from Section 5 (flexible numbers) to Section 2 (completed PRDs).
- ThoughtSift reconsidered: not a standalone feature. Original scope absorbed by Safe Harbor (emotional processing) and External Tool Generation Context Update Loop (decision-making, brainstorming, problem-solving). ThoughtSift name may be repurposed for the external tool suite — decision deferred to AI Vault PRD session.
- New tables: `safe_harbor_orientation_completions`, `safe_harbor_literacy_completions`, `safe_harbor_consent_records`.
- New column: `lila_conversations.is_safe_harbor`.
- Four new guided modes registered.

**Action needed:**
- Update Section 2 with PRD-20 completion.
- Move Safe Harbor from Section 5 to Section 2.
- Add four guided modes to Section 9.
- Note ThoughtSift decision in Section 5 or Section 12 (Known Inconsistencies).
- Update the StewardShip → MyAIM v2 name map: Safe Harbor → Safe Harbor (confirmed, name kept).

---

*End of PRD-20 Cross-PRD Impact Addendum*
