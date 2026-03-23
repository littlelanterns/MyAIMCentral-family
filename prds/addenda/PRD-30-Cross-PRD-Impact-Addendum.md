# PRD-30 Cross-PRD Impact Addendum

**Created:** March 21, 2026
**Session:** PRD-30 (Safety Monitoring)
**Purpose:** Documents how PRD-30 decisions affect prior PRDs and establishes new patterns/conventions.

---

## New Patterns Established

### Two-Layer Detection Pipeline
PRD-30 establishes a reusable detection pattern: Layer 1 (cheap, synchronous keyword/phrase matching against a curated reference table) + Layer 2 (async AI classification via Haiku for pattern-level analysis). This pattern could be extended to other content scanning needs (e.g., journal scanning, message scanning post-MVP). The key architectural principle: filter cheaply first, then apply AI selectively.

### Locked Safety Categories
Three safety categories (self_harm, abuse, sexual_predatory) are enforced at High sensitivity regardless of parent configuration. This is an application-layer override — the database may store a different value, but the detection pipeline ignores it for these categories. This establishes the principle that some safety boundaries are non-negotiable even by the primary parent.

### Conversation Starter Generation Pattern
Each safety flag triggers a single Haiku call to generate a brief, personalized "How to Bring This Up" suggestion. This is a lightweight AI integration pattern: one focused call per event, with a narrowly scoped prompt and a 2-3 sentence output. Could apply to other parent-guidance contexts (e.g., meeting preparation suggestions, developmental milestone notes).

### Flag Permanence Convention
Safety flags are never deleted. Status transitions are one-way: new → acknowledged or new → dismissed. This establishes a pattern for "immutable safety records" that protects families and the platform.

---

## Impact on PRD-05 (LiLa Core AI System)

**What changed:**
- The LiLa message pipeline now has a safety scanning hook point. After each message from a monitored member is saved to `lila_messages`, Layer 1 keyword scanning executes synchronously before the next conversation turn.
- `lila_messages` gains a `safety_scanned` BOOLEAN column (default false) to prevent double-processing.
- Layer 2 classification runs asynchronously at conversation end (close or 30-minute inactivity).
- The global crisis override (PRD-05's existing Tier 3 behavior) remains unchanged. PRD-30 adds the invisible parent notification layer on top of it — they are complementary, not overlapping. LiLa still provides crisis resources in real-time; PRD-30 additionally alerts parents.

**Action needed:**
- Add `safety_scanned` BOOLEAN DEFAULT false NOT NULL to `lila_messages` table schema.
- Note the message pipeline hook point in the conversation engine documentation.
- Note that conversation completion (close or inactivity timeout) triggers Layer 2 classification for monitored members.

---

## Impact on PRD-15 (Messages, Requests & Notifications)

**What changed:**
- The "Safety flag alert notifications" item in PRD-15's "MVP When Dependency Is Ready" checklist is now wired by PRD-30.
- Safety flags create `notifications` records with `category = 'safety'` and `priority = 'high'`.
- Notification content includes: severity indicator, flagged member name, trigger category, and a "Review" deep link to the flag detail view.
- Multiple categories from the same conversation are consolidated into a single notification.
- Safety alert notifications respect the existing PRD-15 behavior: bypass DND, locked ON in notification preferences (cannot be disabled).

**Action needed:**
- Move "Safety flag alert notifications" from "MVP When Dependency Is Ready" to wired/completed.
- Add `notification_type = 'safety_flag'` to the notification_type enum if not already extensible.
- Confirm notification tap-through routing to safety flag detail view (Screen 3).

---

## Impact on PRD-14C (Family Overview)

**What changed:**
- Safety Monitoring is registered as an extensible section with key `safety_monitoring`.
- The section shows a per-child summary: member name, flag status (new flags with severity, or "no flags" with checkmark), and quick links to review or full history.
- Visible only to mom and dad (if dad has safety notification access).
- Section is collapsible. If no members are monitored, shows "Safety Monitoring is available in Settings."

**Action needed:**
- Add `safety_monitoring` to the section extensibility registry.
- Note visibility constraint: only shown to safety notification recipients.

---

## Impact on PRD-22 (Settings)

**What changed:**
- "Safety Monitoring" configuration section added to Settings.
- Contains: notification recipient toggles, per-member monitoring toggles with per-member sensitivity gear icons, notification delivery channel toggles, weekly digest toggle, and a link to flag history.
- Section visible only to primary parent.

**Action needed:**
- Add "Safety Monitoring" to the Settings section registry.
- Note that this section is primary-parent-only (not visible to dad even if he has flag notification access — he receives flags but cannot configure monitoring).

---

## Impact on PRD-01 (Auth & Family Setup)

**What changed:**
- When a new child member is added to the family (any shell type: Play, Guided, Independent), a `safety_monitoring_configs` record should be auto-created with `is_active = true`.
- When a new adult member (dad/additional adult) is added, a `safety_monitoring_configs` record should be auto-created with `is_active = false`.
- The primary parent should also be auto-created as a `safety_notification_recipients` record with `is_active = true`.

**Action needed:**
- Add safety monitoring record creation to the family member creation flow.
- Add safety notification recipient creation for primary parent during family setup.

---

## Impact on PRD-20 (Safe Harbor)

**What changed:**
- No changes needed. PRD-20 already correctly states that Safe Harbor conversations are subject to the safety flag system, and the Teen AI Literacy Module (Area 4) transparently discloses this to teens.
- PRD-30 is now the authoritative reference for how the system PRD-20 describes actually works.

**Action needed:**
- None. PRD-20's references to safety monitoring are already correct.

---

## Impact on AI Cost Optimization Patterns

**What changed:**
- Layer 1 detection (keyword matching) has zero AI cost — it's a database query.
- Layer 2 detection (Haiku classification) costs ~$0.002 per conversation. Estimated 5-20 conversations/member/month for monitored members = $0.01-$0.04/member/month.
- Conversation starter generation costs ~$0.001 per flag. Most families will generate very few flags.
- Pattern summary narrative costs ~$0.001 per member per week.
- Total estimated safety monitoring AI cost: <$0.05/family/month for typical usage.
- This fits comfortably within the $0.20/family/month total AI budget.

**Action needed:**
- Add safety monitoring to the AI Cost Optimization Patterns document as a new cost line item.

---

## Impact on Build Order Source of Truth v2

**What changed:**
- PRD-30 (Safety Monitoring) is now written.
- 7 new tables: `safety_monitoring_configs`, `safety_sensitivity_configs`, `safety_notification_recipients`, `safety_flags`, `safety_keywords`, `safety_resources`, `safety_pattern_summaries`.
- 1 column addition: `lila_messages.safety_scanned`.
- Build dependency: requires PRD-05 (LiLa conversation engine) and PRD-15 (notification delivery) to be built first.

**Action needed:**
- Move PRD-30 from "Remaining PRDs" to "Completed PRDs" section.
- Update remaining PRD count.
- Note build dependency chain: PRD-05 → PRD-15 → PRD-30.

---

## New Tables Summary

| Table | PRD | Purpose |
|-------|-----|---------|
| `safety_monitoring_configs` | PRD-30 | Per-member monitoring toggle |
| `safety_sensitivity_configs` | PRD-30 | Per-member, per-category sensitivity thresholds |
| `safety_notification_recipients` | PRD-30 | Which parent-role members receive flag notifications |
| `safety_flags` | PRD-30 | Individual safety flag records |
| `safety_keywords` | PRD-30 | Curated keyword/phrase library (platform-level) |
| `safety_resources` | PRD-30 | Curated support resources (platform-level) |
| `safety_pattern_summaries` | PRD-30 | Weekly digest data per monitored member |

**Total new tables: 7**
**Columns added: 1** (`lila_messages.safety_scanned`)

---

## New Feature Keys

| Key | PRD | Tier |
|-----|-----|------|
| `safety_monitoring_basic` | PRD-30 | Enhanced |
| `safety_monitoring_ai` | PRD-30 | Full Magic |

---

## Starter Prompt for Next Session (PRD-34: ThoughtSift — Decision & Thinking Tools)

```
We're writing PRD-34: ThoughtSift — Decision & Thinking Tools. This is a medium-large PRD covering 5 AI-powered thinking tools that live in the AI Vault / Library Vault.

Read these documents first:
- PRD-34 entry in MyAIM_Remaining_PRDs_Ordered.md — scope overview (Board of Directors persona panel, Perspective Shifter, Decision Guide, Mediator, Translator)
- PRD-05-LiLa-Core-AI-System.md — guided mode registry, model routing, context assembly
- PRD-21A-AI-Vault-Browse-Content-Delivery.md — how tools are browsed and launched from the Vault
- PRD-21B-AI-Vault-Admin-Content-Management.md — how tools are managed
- Platform-Intelligence-Pipeline-v2.md — persona library infrastructure (referenced for Board of Directors shared persona library)
- PRD-19-Family-Context-Relationships.md — relationship_mediation guided mode (Mediator expands this beyond family)
- PRD-07-InnerWorkings.md — InnerWorkings data (Perspective Shifter uses real personality data for family-context lenses)
- External-Tool-Generation-Context-Update-Loop.md — the external tool generation pattern (ThoughtSift tools may use this)
- AIMfM_Faith_Ethics_Framework_Complete.md — ethics constraints (Board of Directors persona panel has specific deity/faith rules)
- MyAIM_Family_PRD_Template.md — PRD structure

Key decisions already made:
- 5 tools: Board of Directors (persona panel + shared 3-tier persona library), Perspective Shifter (archetypal + family-context lenses using real InnerWorkings data), Decision Guide (SODAS, pros/cons, coin flip insight, weighted matrix), Mediator (expands PRD-19's relationship_mediation beyond family), Translator (fun rewrite: formal, pirate, gen z, medieval, etc.)
- Board of Directors: deities are blocked as speaking personas → Prayer Seat pattern instead (user reflection, not AI-as-deity)
- Persona library is three-tier: platform-provided (admin-curated), community-shared (user-created, moderated), personal (private to the user)
- Persona library infrastructure is already designed in Platform Intelligence Pipeline v2

What this PRD needs to cover:
- Each tool's guided mode registration, system prompt behavioral rules, context sources, and model tier
- Board of Directors: persona creation, persona library browsing (3 tiers), panel composition, conversation UI, Prayer Seat implementation
- Perspective Shifter: archetypal lenses (Devil's Advocate, Optimist, etc.) + family-context lenses (using InnerWorkings data for "How would [spouse] see this?")
- Decision Guide: 4 decision frameworks as guided conversation modes
- Mediator: expand beyond family mediation to any interpersonal conflict
- Translator: fun rewrite tool with tone presets
- Data model for personas, persona library, and tool-specific settings
- How these tools integrate with the AI Vault browsing and launch experience
- Tier gating considerations

Session approach: This is 5 tools bundled into one PRD. Each tool is relatively self-contained — treat them as sub-sections with their own screens, AI integration, and data schema contributions. The unifying element is the ThoughtSift brand and the shared persona library infrastructure.
```

---

*End of PRD-30 Cross-PRD Impact Addendum*
