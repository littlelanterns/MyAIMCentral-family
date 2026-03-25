# Feature Decision File: PRD-13 — Archives & Context

> **Created:** 2026-03-25
> **PRD:** `prds/personal-growth/PRD-13-Archives-Context.md`
> **Addenda read:**
>   - `prds/addenda/PRD-Audit-Readiness-Addendum.md`
>   - `prds/addenda/PRD-Template-and-Audit-Updates.md`
>   - `prds/addenda/PRD-31-Permission-Matrix-Addendum.md`
>   - `prds/addenda/PRD-07-Session-Addendum.md`
> **Faith/Ethics documents read:**
>   - `reference/AIMfM_Faith_Ethics_Framework_Complete.md`
>   - `reference/MyAIM-Central_Archives_FaithAware_Addendum.md`
> **Condensed intelligence read:**
>   - `Additional Docs/innerworkings_condensed_intelligence.md`
>   - `Additional Docs/safe_harbor_condensed_intelligence.md`
>   - `Additional Docs/communication_tools_condensed_intelligence.md`
> **StewardShip references read:**
>   - `contextLoader.ts` (context assembly engine, shouldLoad*, name detection, parallel fetching)
>   - `systemPrompt.ts` (format functions, token budgets, section ordering)
>   - `types.ts` (CREW_NOTE_CATEGORY_LABELS, SpouseInsight, CrewNote, Person)
>   - `PersonCard.tsx`, `PersonDetail.tsx`, `CrewNoteCard.tsx`, `AddCrewNoteModal.tsx`
>   - `useFirstMate.ts`, `InsightCard.tsx`, `InsightCategorySection.tsx`
> **Founder approved:** *(pending)*

---

## What Is Being Built

Archives is the platform's context management engine — the central place where everything LiLa knows about a family is organized, controlled, and made visible. Mom browses Archives to see, curate, and toggle all context across all family members. Archives never stores copies of data from other features — it surfaces live references through query-time aggregation ("checked somewhere, checked everywhere"). Three audiences: Mom (curates context), LiLa (reads context through assembly pipeline), Optimizer (pulls context through presets). This build includes 7 screens, the three-tier toggle system, faith preferences, privacy filtered management, context export, context learning save dialog, and the full context assembly integration.

---

## Screens & Components

| Screen / Component | Notes |
|---|---|
| **Screen 1: Archives Main Page** | Family Overview Card + member Archive cards + OON section + Privacy Filtered section + FAB "Add Context" |
| **Screen 2: Member Archive Detail** | Auto-generated overview card + context folders + aggregated source sections + folder CRUD |
| **Screen 3: Family Overview Card Detail** | 4 expandable sections + aggregated family context + Build with LiLa + Export |
| **Screen 4: Faith Preferences Modal** | 6 scrollable sections, saves to `faith_preferences`, UPSERT |
| **Screen 5: Privacy Filtered Management** | Grouped by member, lock icon, move to Archive action |
| **Screen 6: Context Export** | Scope selector + Markdown preview + Copy/Download/Open in Notepad |
| **Screen 7: Context Learning Save Dialog** | Inline in LiLa conversations — Save/Edit/Skip flow |
| **ArchivesMemberCard** | Summary card on main page per member — name, avatar, role, insight counts, person-level heart |
| **FamilyOverviewCard** | Top card on main page — family name, section previews, summary indicator |
| **ContextFolderGroup** | Expandable folder with category heart, item count, item list |
| **ContextItemCard** | Individual context item with heart toggle, inline edit, archive/move actions |
| **AggregatedSourceSection** | Labeled section for InnerWorkings/GuidingStars/etc with "View in [Feature]" link |
| **ArchiveOverviewCard** | Haiku-generated "baseball card" summary per member |
| **AddContextModal** | Member picker → folder picker → item entry form |
| **FolderManagementUI** | Create, rename, reorder, delete (custom only), nest up to 3 levels |
| **OutOfNestSection** | Collapsible section with OON badge, same card format |
| **ShareWithArchiveToggle** | Toggle on lists, member/folder picker |
| **FeatureGuide** | On Archives main page (`featureKey="archives"`) |
| **Empty states** | Warm invitations for: no context items, no member data, no faith preferences, empty family overview |

---

## Key PRD Decisions (Easy to Miss)

1. **"Checked somewhere, checked everywhere"** — toggling `is_included_in_ai` on an aggregated item (e.g., InnerWorkings entry shown in Archives) writes BACK to the source table (`self_knowledge`), not to an Archives copy. No intermediate tables for aggregation state.

2. **Three-tier toggle system** — Person level (archive_member_settings.is_included_in_ai), Category level (archive_folders.is_included_in_ai), Item level (source table's is_included_in_ai OR archive_context_items.is_included_in_ai). ALL THREE must be true for an item to reach LiLa.

3. **Privacy Filtered is NOT a toggle** — it is a hard system constraint. `is_privacy_filtered = true` items NEVER appear in non-mom context regardless of any toggle state. Enforced in context assembly, not UI.

4. **Auto-generated overview cards** — Haiku-generated, debounced max once per hour, stored in `archive_member_settings.overview_card_content`. Each fact line has its own checkbox.

5. **Context learning detection runs only on mom's conversations** — not on other family members.

6. **Faith preferences are one per family (UPSERT), not per member.** Accessible from Family Overview AND Settings.

7. **Relevance setting controls when faith context appears in LiLa**: automatic (recommended, LiLa evaluates), always (every conversation), manual (only when explicitly requested).

8. **7 auto-created system folders per member**: Preferences, Schedule & Activities, Personality & Traits, Interests & Hobbies, School & Learning, Health & Medical, General. Plus wishlist folder. System folders cannot be deleted (is_system = true), can be renamed.

9. **Family Overview folder auto-created on family creation** with 4 subfolders: Family Personality, Rhythms & Routines, Current Focus, Faith & Values.

10. **Out of Nest members** get full folder structure but are in a separate collapsible section. They are descendants + spouses, not grandparents.

11. **Share with Archive**: any list can be shared. Adds 3 columns to `lists`: `is_shared_to_archive`, `archive_member_id`, `archive_folder_id`. List appears as live reference on Archive card.

12. **Context export is Markdown only at MVP.** Generated on demand, no persistent data.

13. **Folder nesting max 3 levels** in UI. System folders first, then user-created.

14. **Usage tracking**: increment `usage_count` and `last_used_at` on archive_context_items when LiLa references them. Internal data — no visible analytics surface yet.

15. **Context learning folder auto-suggestion rules**: Food→Preferences, Schedule→Schedule & Activities, Personality→Personality & Traits, Interest→Interests & Hobbies, School→School & Learning, Health→Health & Medical, Everything else→General. Sensitive content auto-routes to Privacy Filtered.

16. **No guided mode registered for Archives** — it's organizational, not conversational. "Build with LiLa" opens a pre-primed general conversation.

17. **PRD-13 schema is authoritative over database_schema.md** where they conflict. PRD-13 adds richer columns to archive_folders (icon, color_hex, description, is_system, is_included_in_ai) and archive_context_items (context_type, is_privacy_filtered, source, usage_count, etc.).

18. **Faith Preferences schema**: PRD-13 uses individual boolean columns (prioritize_tradition, include_comparative, etc.), NOT the JSONB tone_settings from database_schema.md. PRD wins.

---

## Addendum Rulings

### From PRD-07-Session-Addendum.md:
- **"Checked somewhere, checked everywhere"** convention — Archives surfaces live references, never copies. Toggle changes propagate to source tables.
- InnerWorkings is always self-authored; mom's observations about family members go in Archives as standalone `archive_context_items`, NOT in `self_knowledge`.
- Five InnerWorkings categories: Personality Types, Traits & Tendencies, Strengths, Growth Areas, General. These should be reflected in Archive aggregation grouping.

### From PRD-31-Permission-Matrix-Addendum.md:
- Three permission layers: Platform Tier → Family Toggle → Granular permissions.
- Archives feature keys: `archives_browse`, `archives_dad_access`, etc. All TBD tier, all return true during beta.
- Dad access is through Layer 2 toggle (`archives_dad_access` feature key). Read-only. No Privacy Filtered, no faith preferences, no export.
- `useCanAccess()` returns `{ allowed, blockedBy, upgradeTier? }` — updated return type.

### From PRD-Audit-Readiness-Addendum.md:
- Process document — PRD-13 already follows all conventions (decision rationale tags, depends-on tags, shell behavior table). No code impact.

### From PRD-Template-and-Audit-Updates.md:
- Process document — no code impact. PRD-13 includes "Decisions Made This Session" section.

### From AIMfM Faith Ethics Framework:
- Faith Preference System is a 6-step configuration with specific tradition dropdown values (Catholic, Protestant, Orthodox, LDS, Jewish, Muslim, Hindu, Buddhist, Non-religious, Spiritual but not religious, Prefer not to specify, Other).
- Automatic Relevance Detection is the recommended default — faith context included only when queries involve religion/spirituality/values/morality or faith-tied practices.
- Source prioritization: prioritize official/authorized sources from within the tradition.
- 7 Universal Rules for faith handling apply to all LiLa behavior.

### From Archives FaithAware Addendum:
- 5-Layer Context Architecture: Individual, Relationship, Household (Family Overview), Temporal, Values (faith + Best Intentions).
- Context weighting: High (always include) = directly relevant traits, active intentions, safety info. Medium (include if space) = relationship dynamics, season of life. Low (optional) = general household personality. Faith = conditional.
- Safety-First Context Filtering: Medical diagnoses, mental health concerns, financial details, marital conflicts, private family issues auto-excluded unless explicitly permitted.

---

## Database Changes Required

### New Tables

**`archive_context_items`** (PRD-13 authoritative schema):
- id UUID PK, family_id UUID FK families, folder_id UUID FK archive_folders, member_id UUID nullable (NULL for family items), context_field TEXT, context_value TEXT NOT NULL, context_type TEXT CHECK ('preference','schedule','personality','interest','academic','medical','wishlist_item','family_personality','family_rhythm','family_focus','faith_context','meeting_note','general'), is_included_in_ai BOOLEAN DEFAULT true, is_privacy_filtered BOOLEAN DEFAULT false, source TEXT CHECK ('manual','lila_detected','review_route','list_shared'), source_conversation_id UUID nullable, source_reference_id UUID nullable, added_by UUID FK family_members, usage_count INTEGER DEFAULT 0, last_used_at TIMESTAMPTZ nullable, link_url TEXT nullable, price_range TEXT nullable, archived_at TIMESTAMPTZ nullable, created_at TIMESTAMPTZ DEFAULT now(), updated_at TIMESTAMPTZ DEFAULT now()
- RLS: Mom full access, dad read if archives_dad_access granted, other roles no access
- Indexes: idx_aci_folder, idx_aci_member, idx_aci_family, idx_aci_source, idx_aci_privacy, idx_aci_included
- Trigger: trg_aci_updated_at

**`archive_member_settings`** (PRD-13 authoritative schema):
- id UUID PK, family_id UUID FK families, member_id UUID FK family_members UNIQUE(family_id, member_id), is_included_in_ai BOOLEAN DEFAULT true (person-level master toggle), overview_card_content TEXT nullable, overview_card_updated_at TIMESTAMPTZ nullable, created_at TIMESTAMPTZ DEFAULT now(), updated_at TIMESTAMPTZ DEFAULT now()
- RLS: Mom can manage all, member can read own
- Indexes: idx_ams_family_member UNIQUE
- Trigger: trg_ams_updated_at

**`faith_preferences`** (PRD-13 authoritative schema):
- id UUID PK, family_id UUID FK families UNIQUE, faith_tradition TEXT nullable, denomination TEXT nullable, observances TEXT[] DEFAULT '{}', sacred_texts TEXT[] DEFAULT '{}', prioritize_tradition BOOLEAN DEFAULT false, include_comparative BOOLEAN DEFAULT false, include_secular BOOLEAN DEFAULT false, educational_only BOOLEAN DEFAULT false, use_our_terminology BOOLEAN DEFAULT false, respect_but_dont_assume BOOLEAN DEFAULT true, avoid_conflicting BOOLEAN DEFAULT true, acknowledge_diversity BOOLEAN DEFAULT false, minority_views BOOLEAN DEFAULT false, diversity_notes TEXT nullable, special_instructions TEXT nullable, relevance_setting TEXT DEFAULT 'automatic' CHECK ('automatic','always','manual'), is_included_in_ai BOOLEAN DEFAULT true, created_at TIMESTAMPTZ DEFAULT now(), updated_at TIMESTAMPTZ DEFAULT now()
- RLS: Mom can manage, adults can read
- Indexes: idx_fp_family UNIQUE
- Trigger: trg_fp_updated_at

**`context_learning_dismissals`** (PRD-13 schema):
- id UUID PK, family_id UUID FK families, content_hash TEXT NOT NULL, conversation_id UUID nullable FK lila_conversations, dismissed_at TIMESTAMPTZ DEFAULT now()
- RLS: Mom can manage
- Indexes: idx_cld_family, idx_cld_hash

### Modified Tables

**`archive_folders`** — add columns:
- icon TEXT nullable
- color_hex TEXT nullable
- description TEXT nullable
- is_system BOOLEAN DEFAULT false
- is_included_in_ai BOOLEAN DEFAULT true
- Update folder_type CHECK to include: 'member_root','family_overview','system_category','wishlist','custom'

**`lists`** — add columns:
- is_shared_to_archive BOOLEAN DEFAULT false
- archive_member_id UUID nullable FK family_members
- archive_folder_id UUID nullable FK archive_folders

### Auto-Creation Functions

**`auto_provision_archive_folders()`** — Trigger on family_members INSERT:
- Create member_root folder
- Create 7 system category subfolders (Preferences, Schedule & Activities, Personality & Traits, Interests & Hobbies, School & Learning, Health & Medical, General)
- Create wishlist folder
- Create archive_member_settings record

**`auto_provision_family_overview()`** — Trigger on families INSERT:
- Create Family Overview folder (folder_type = 'family_overview')
- Create 4 section subfolders (Family Personality, Rhythms & Routines, Current Focus, Faith & Values)

### Migrations
- Single migration file: `YYYYMMDDHHMMSS_prd13_archives_context.sql`
- Idempotent where possible (IF NOT EXISTS, DO $$ blocks)
- Run archive_folders ALTER first, then create new tables, then triggers, then backfill existing members

---

## Feature Keys

| Feature Key | Minimum Tier | Role Groups | Notes |
|---|---|---|---|
| archives_browse | TBD (true during beta) | mom | Main Archives page access |
| archives_member_folders | TBD | mom | Member-level folder browsing |
| archives_family_overview | TBD | mom | Family Overview Card access |
| archives_faith_preferences | TBD | mom | Faith Preferences editing |
| archives_context_learning | TBD | mom | Context Learning detection + save |
| archives_overview_cards | TBD | mom | Haiku auto-generated overview cards |
| archives_context_export | TBD | mom | Context export functionality |
| archives_privacy_filtered | TBD | mom | Privacy Filtered section access |
| archives_dad_access | TBD | dad_adults | Dad read-only access when granted |
| archives_share_list | TBD | mom | Share with Archive toggle on lists |

---

## Stubs — Do NOT Build This Phase

- [ ] LifeLantern aggregation — `life_lantern_areas` / `personal_vision_statements` tables may not exist. Show "LifeLantern — coming soon" section.
- [ ] Family Vision Statement aggregation — `family_vision_statements` may not exist. Stub section in Family Overview.
- [ ] Family Meeting Notes structured routing — manual add works, routing from Meetings PRD is stub.
- [ ] Partner Profile aggregation — stub section.
- [ ] My Circle folder type — future People & Relationships PRD.
- [ ] Monthly victory auto-archive — PRD-11 enhancement.
- [ ] Seasonal Family Overview prompts — Morning/Evening Rhythm PRD.
- [ ] Platform-specific export formatting — Markdown only at MVP.
- [ ] Archive search (full-text) — post-MVP.
- [ ] Dad edit access — read-only for dad at MVP.
- [ ] Context staleness indicators — post-MVP.
- [ ] Usage count display in UI — wire DB increment, no visible analytics.
- [ ] Bulk context import — post-MVP.
- [ ] Context presets / smart modes — PRD-05C enhancement.
- [ ] Journal entries aggregation — verify tables exist, stub if needed.

---

## Cross-Feature Connections

| This feature... | Direction | Connected to... | Via |
|---|---|---|---|
| Archives | ← reads from | InnerWorkings (PRD-07) | `self_knowledge` table query-time |
| Archives | ← reads from | Guiding Stars (PRD-06) | `guiding_stars` table query-time |
| Archives | ← reads from | Best Intentions (PRD-06) | `best_intentions` table query-time |
| Archives | ← reads from | Lists (PRD-09B) | `lists` where `is_shared_to_archive = true` |
| Archives | → writes to | self_knowledge | Toggle is_included_in_ai (checked everywhere) |
| Archives | → writes to | guiding_stars | Toggle is_included_in_ai (checked everywhere) |
| Archives | → writes to | best_intentions | Toggle is_included_in_ai (checked everywhere) |
| Archives | → feeds | LiLa Context Assembly (PRD-05) | `loadArchiveContext()` in context-assembly.ts |
| Archives | → feeds | Faith context in LiLa | faith_preferences + relevance_setting |
| Archives | ← receives from | LiLa context learning (PRD-05C) | Context Learning Save Dialog |
| Archives | → sends to | Smart Notepad (PRD-08) | "Open in Notepad" from Context Export |
| Archives | ← auto-created by | Family Setup (PRD-01) | Auto-provision triggers on member/family insert |

---

## Things That Connect Back to This Feature Later

- **PRD-12A (LifeLantern):** Will wire personal_vision_statements + life_lantern_areas into Archive aggregation
- **PRD-12B (Family Vision Quest):** Will wire family_vision_statements into Family Overview
- **PRD-16 (Meetings):** Will route meeting notes to Family Overview
- **PRD-19 (Family Context):** Will wire relationship_notes, partner profiles, guided interviews
- **PRD-11 (Victory Recorder):** Monthly victory auto-archive
- **PRD-05C (Optimizer):** Context presets that pull from Archives
- **PRD-08 (Journal):** Journal entries already aggregated; may need "View in Archives" link later
- **PRD-21 (Communication Tools):** Cyrano/Higgins use partner context from Archives

---

## Founder Confirmation (Pre-Build)

- [ ] Pre-build summary reviewed and accurate
- [ ] All addenda captured above
- [ ] Stubs confirmed — nothing extra will be built
- [ ] Schema changes correct
- [ ] Feature keys identified
- [ ] **Approved to build**

---

## Post-Build PRD Verification

*(To be completed after build)*

| Requirement | Source | Status | Notes |
|---|---|---|---|
| | PRD §/ Addendum | Wired / Stubbed / Missing | |

---

## Founder Sign-Off (Post-Build)

- [ ] Verification table reviewed
- [ ] All stubs are acceptable for this phase and in STUB_REGISTRY.md
- [ ] Zero Missing items confirmed
- [ ] **Phase approved as complete**
- **Completion date:**
