# MyAIM Family: Platform Intelligence Pipeline v2
## How Every Family's Usage Makes the Platform Smarter for All Families

**Purpose:** Architecture for a self-improving product where normal usage generates intelligence that benefits the entire platform — while maintaining absolute privacy boundaries. Nothing personal ever crosses the wall. Only structural patterns, anonymized signals, community-generated resources, and synthesized knowledge flow into the shared intelligence layer.

**The flywheel:** More families use tools → system captures what works → admin reviews and promotes → all families get smarter defaults, richer templates, better personas, synthesized wisdom → tools work better → more families use them.

**Companion documents:**
- Semantic Context Infrastructure Addendum (pgvector foundation)
- AI Cost Optimization Patterns (feature-level optimizations that consume intelligence)

**Supersedes:** Platform Intelligence Pipeline v1 (March 15, 2026)

---

## Privacy Architecture: The Hard Wall

### What NEVER crosses into platform intelligence:
- Personal names (family members, children, friends, anyone)
- Specific life details (addresses, schools, churches, medical conditions)
- Journal content, conversation text, or notepad content
- Archives context items or their values
- Any content that could identify a specific family
- Relationship details, faith specifics beyond general tradition labels, or any sensitive personal data
- Custom/personal Board of Directors personas (mom's actual grandma, etc.)

### What CAN cross (after anonymization + admin review):
- **Structural prompt patterns** — skeletons with typed placeholders
- **Context assembly signals** — which context *types* (not values) were most useful for which tool types
- **Anonymized usage patterns** — aggregate statistics, never individual usage
- **Generated personas** — AI-built personality profiles for public figures from verifiable sources
- **Book extractions** — summaries, frameworks, principles, declarations from uploaded books (the book's content, not the user's annotations or personal notes)
- **Synthesized wisdom principles** — universal truths that multiple book sources converge on
- **Structural patterns** — meeting section templates, declaration structures, routine configurations, widget configs, question phrasings

### Architecture: Separate schema

Platform intelligence lives in a dedicated `platform_intelligence` schema. User data in `public` has family-scoped RLS. Platform intelligence has admin-only write and platform-wide read.

```sql
CREATE SCHEMA IF NOT EXISTS platform_intelligence;
```

All tables in this schema have no `family_id` column, no user-identifiable data, admin-only write, and platform-wide read.

---

## The Three-Stage Pipeline

### Stage 1: Capture
During normal feature usage, the system detects potentially valuable patterns and queues them for review. Users never see it, never interact with it, and are never interrupted.

### Stage 2: Queue
All captured items land in a review queue with priority scoring. Nothing becomes platform intelligence without admin approval.

### Stage 3: Promote
Admin reviews, refines, and approves. Approved items become platform-wide improvements.

---

## All Twelve Capture Channels

---

### Channel A: Successful Prompt Patterns

**Source features:** LiLa Optimizer (PRD-05C), AIVault tools (PRD-21A)

**Trigger:** User copies an optimized prompt (taps "Copy" on a prompt card).

**What's captured:**
- Prompt type (meal_planning, homework, behavior, etc.)
- The structural skeleton — prompt text with all personal content replaced by typed placeholders
- Context types that were included
- Whether the user edited before copying (structural changes only, not content)

**Anonymization:** Stripping function replaces all personal names, foods, locations, dates, medical conditions, etc. with typed placeholders. Similarity check deduplicates against existing patterns (embedding similarity > 0.85 increments `seen_count` instead of creating duplicate).

**When it doesn't capture:**
- Walk Me Through It mode (too conversational)
- Prompts not copied (didn't work well enough)
- Under 50 characters after anonymization (too short)

---

### Channel B: Context Assembly Effectiveness Signals

**Source features:** All LiLa modes, Optimizer, guided modes

**Trigger:** After any AI-assisted session, log which context types were loaded and the outcome signal.

**What's captured:**
- Tool/mode type
- Context types included (labels only — 'self_knowledge.personality_type', 'best_intentions', 'archive.schedule' — never actual values)
- Context types available but not included
- Outcome signal: copied, saved, acted_on, regenerated (weak), abandoned (negative)

**Aggregation:** Accumulates as anonymous statistics. After N data points per tool type, informs default context preset optimization. "For Homework Help, including `learning_style` has 85% positive outcome vs. 60% without."

---

### Channel C: Edge Case Usage Patterns

**Source features:** AIVault tools, Optimizer

**Trigger:** Request type classification doesn't match the tool type (e.g., "travel planning" request in Meal Planner tool).

**What's captured:**
- Source tool type
- Detected actual request type
- Anonymized structural prompt
- Outcome signal (handled well vs. abandoned)

**Value:** Reveals unserved use cases. 50 families using Meal Planner for road trip snacks = signal to create a travel planning variant.

---

### Channel D: Board of Directors Personas (ThoughtSift)

**Source features:** ThoughtSift Board of Directors (future PRD)

**Trigger:** User requests a persona not in the shared library. AI generates it for the user; simultaneously queues for review.

**What's captured:**
- Persona name, personality profile, source references, content category
- The requesting user is NOT captured

**Privacy boundary:** `persona_type = 'personal_custom'` (mom's actual grandma, personal mentor) NEVER enters this channel. Only public/historical/fictional figures.

**Three persona tiers:**
1. **System preloaded** — curated starter set, ready at launch
2. **Community generated** — user-triggered, AI-built, moderation-reviewed before public
3. **Personal custom** — user-only, never shared

**Content policy (full rules in ThoughtSift PRD):**
- **Blocked as speaking personas:** Deities (God, Jesus, Allah, etc.) → redirect to "Prayer Seat" generating reflection questions for prayer/meditation
- **Blocked entirely:** Figures associated with atrocity or evil
- **Allowed with verifiable sources:** Religious leaders, public figures — persona built from published talks, books, public addresses. Must include `source_references`.
- **Allowed as literary:** Fictional characters (Screwtape, etc.) used for their pedagogical perspective

---

### Channel E: Book Knowledge Library

**Source features:** Knowledge Base / Manifest (future PRD)

This channel has two distinct flows: **extraction caching** (saves AI costs) and **framework curation** (trains LiLa's advisory knowledge).

#### Flow 1: Book Extraction Caching

**How it works:**

When a user uploads a book and the system identifies it (title + author match against the platform library):

1. System generates the chapter list from the book
2. User selects which chapters to extract (checkmark selection)
3. For chapters that have already been extracted by a previous user, the cached extractions are cloned to this user's account — no AI extraction cost
4. For new chapters (appendix, introduction, etc. that previous users skipped), fresh AI extraction runs
5. The fresh extractions are simultaneously saved to the user's account AND queued for the platform cache

**Key rules:**
- **Upload required.** Users must upload their own copy of the book. There is no "browse all extracted books" library. This respects the value of the content and prevents the platform from becoming a free summary service.
- **User doesn't know it's cached.** The experience is identical whether the content is freshly extracted or served from cache. It's still unique to them — their copy, their library, their annotations.
- **Re-extract always available.** Users can re-extract or go deeper on any chapter at any time. The cached version is a starting point, not a limitation.
- **Personal annotations never cached.** User's hearts, notes, personal connections to principles, and any edits to extracted content stay in their account. Only the base extraction enters the platform cache.

**Cost impact:** A book that's been uploaded by 10 families costs the platform one Sonnet extraction (~$0.50-$2.00 depending on length). Without caching, it costs 10 × that amount. At scale with popular books, this is one of the largest single cost savings in the platform.

**Book identification:** Title + author fuzzy matching (embedding similarity on the title+author string). If the system isn't confident it's the same book (similarity < 0.9), it extracts fresh rather than serving a potentially wrong cache.

#### Flow 2: Framework Curation for LiLa Training

**How it works:**

After book frameworks/principles are extracted and cached, they enter a three-layer ethics and quality filter before being considered for LiLa's advisory knowledge:

**Layer 1: Pre-Screening Gate (Haiku — ~$0.005/book)**
When a new book enters the platform cache, Haiku scans the book's metadata + table of contents + sample extract against ethics criteria. This catches obviously problematic books (coercion-based parenting, manipulation tactics, cult content, authoritarian control frameworks) before any frameworks are extracted for the training library. Books that fail are auto-rejected from the LiLa training pipeline. The user still gets their personal extractions — this only blocks the content from becoming LiLa training material.

> **Decision rationale:** Both Haiku pre-filter AND Sonnet principle scan, not either/or. Haiku gate prevents wasting Sonnet tokens on obviously problematic books (~$0.005/book to stop at the door). Sonnet handles the nuanced principle-level review for books that pass (~$0.03/book). Total ~$0.035/book. At 100 books/month = $3.50/month. The confidence that LiLa will never suggest manipulative approaches is worth far more than the cost.

**Layer 2: Framework-Level Ethics Scan (Sonnet — ~$0.03/book)**
For books that pass Layer 1, Sonnet reviews each extracted framework/principle against the platform's ethics criteria:

Ethics filter criteria:
- **Auto-reject:** Frameworks teaching force, coercion, manipulation, withholding affection, shame-based control, authoritarian submission, fear-based motivation, gaslighting techniques, or any approach that undermines autonomy and dignity
- **Flag for review:** Frameworks where the line is nuanced — firm boundaries vs. controlling behavior, natural consequences vs. punitive consequences, structure vs. rigidity
- **Auto-approve:** Frameworks aligned with platform values — empowerment, agency, growth mindset, compassion, healthy boundaries, collaborative problem-solving, faith-respecting approaches

Output per principle: `approved`, `flagged_for_review`, or `auto_rejected` with a reason.

**Layer 3: Admin Review (your weekly review)**
Only the `flagged_for_review` items land in your queue. `approved` items pass through. `auto_rejected` items are excluded with a logged reason (reviewable if you choose, but you don't have to).

**Admin review screen for books** shows:
- Per-book view: book title, author, chapter list, overall pass/flag/reject counts
- Drill into chapters: see individual frameworks and their AI classification
- Drill into individual principles: read the full text, see the AI's reasoning for the classification
- Bulk approve all `approved` items for a book
- Review each `flagged_for_review` item individually
- Override any AI classification (approve a flagged item, reject an approved one)

**After admin approval, approved frameworks enter the LiLa training knowledge as synthesized principles (see below).**

#### Synthesized Wisdom: How LiLa Uses Book Knowledge

Approved frameworks are NOT stored as "this came from Book X." They're synthesized into universal principles that LiLa applies naturally in conversation.

**How synthesis works:**
When a new framework is approved, the system checks for existing principles in the synthesized knowledge base that are semantically similar (embedding similarity > 0.8). If a match exists, the new framework strengthens the existing principle — adding another source reference and potentially refining the language. If no match, a new synthesized principle is created.

**Example:**
- "Atomic Habits" framework: "Link a new habit to an existing habit (habit stacking)"
- "Tiny Habits" framework: "Anchor new behaviors to existing routines"
- "Better Than Before" framework: "Strategy of Pairing — link a habit with an enjoyment"

All three converge on the same universal principle. Stored as: **"Linking new behaviors to existing routines or enjoyable activities dramatically increases adoption. This is one of the most well-supported principles in behavior change research."** With source_references pointing to all three books.

**In LiLa conversation:**
LiLa applies principles naturally without attribution. If a user asks "where can I learn more about this?", LiLa responds: "This principle shows up in several excellent books — Atomic Habits, Tiny Habits, and Better Than Before all explore it from different angles. Each one takes a slightly different approach to the same core insight."

> **Decision rationale:** Synthesized attribution rather than book citation because: (1) LiLa speaks with earned authority, not as a book report; (2) multiple sources converging on the same principle IS the authority; (3) avoids copyright concerns about reproducing or summarizing specific copyrighted content; (4) when attribution is requested, offering multiple convergent sources is more valuable than citing one.

---

### Channel F: Meeting Section Effectiveness

**Source features:** Meetings (PRD-16)

**Trigger:** When a meeting type's section usage is recorded — which default sections were used, which were archived, which custom sections were added.

**What's captured (anonymized):**
- Meeting type (couple, family_council, parent_child, etc.)
- Default sections: used/archived percentages across all families
- Custom section patterns: anonymized section titles + prompt text with personal details stripped
- Frequency: which sections are used every meeting vs. skipped frequently

**Value:** If 200 families add a "Financial Check-In" section to their couple meeting, that's a signal to make it a default. If 60% of families archive "Dreams & Goals" from weekly couple meetings, maybe it belongs in monthly reviews instead. Meeting templates evolve based on what actually works for families.

**Privacy note:** Only structural section data is captured — never what was discussed, never meeting notes or action items.

---

### Channel G: Guiding Star & Declaration Patterns

**Source features:** Guiding Stars (PRD-06), Best Intentions (PRD-06)

**Trigger:** When a user creates a new Guiding Star or Best Intention, the structural pattern is captured.

**What's captured (anonymized):**
- Declaration structure (e.g., "I choose to [ACTION] rather than [OLD_PATTERN]")
- Entry type (belief, value, principle, declaration, commitment, identity, affirmation)
- Category patterns (which topics are most common — patience, presence, faith, health, etc.)

**Anonymization:** All personal details stripped. "I choose to respond calmly to Jake's tantrums instead of yelling" becomes "I choose to [RESPOND_CALMLY] to [CHILD_BEHAVIOR] instead of [OLD_PATTERN]."

**Value:** Seeds a "Starter Declarations" library for new users who stare at a blank Guiding Stars page. "Here are patterns other moms have found meaningful..." with anonymized structural examples they can customize. Reduces the blank-page problem for a feature that's deeply personal but structurally patterned.

**Privacy note:** Only structure is captured, never the specific content of anyone's declarations. Users never see that their declarations inspired a starter template.

---

### Channel H: Routine & Task Template Effectiveness

**Source features:** Tasks & Routines (PRD-09A), Studio Templates (PRD-09B)

**Trigger:** When a routine has been active for 30+ days with >70% average completion rate, it's flagged as a "proven routine."

**What's captured (anonymized):**
- Routine structure: number of steps, approximate time per step, time of day, frequency
- Step categories (not specific task names): [WAKE_UP_ACTIVITY], [HYGIENE], [BREAKFAST], [TRANSITION_TO_SCHOOL], etc.
- Completion patterns: average completion rate, which steps get skipped most, average total time
- Age range appropriateness (based on the member role — Play, Guided, Independent, Adult)

**Value:** Families struggling to build routines get proven structures from families who figured it out. "Morning routine for elementary-age kids: 7 steps, starts with [WAKE_UP], ends with [TRANSITION], avg 25 minutes, 85% completion rate across 50+ families." Available as Studio templates.

**Privacy note:** No specific task names, no family details. Only structural patterns and aggregate success metrics.

---

### Channel I: Safe Harbor Conversation Structure Patterns

**Source features:** Safe Harbor (PRD-20)

**EXTREME CAUTION required.** This channel captures the least data and has the strictest privacy rules of any channel.

**Trigger:** When a Safe Harbor conversation reaches a positive resolution signal (user explicitly says they feel better, uses a coping strategy, makes a plan, or ends on a constructive note).

**What's captured (absolutely NO content):**
- Conversation structure only: sequence of LiLa approaches used (validation → exploration → grounding → action, or validation → framework → resource referral, etc.)
- Number of turns before positive resolution
- Which approach category was in play (stress processing, relationship distress, overwhelm, faith-related struggle — broad categories only)

**What is NEVER captured:**
- Any user message content
- Any specific details about the situation
- Any identifiable information whatsoever
- Any conversations that don't reach a positive resolution

**Value:** Over time, structural patterns reveal which conversation flows work best for which types of distress. LiLa's Safe Harbor mode becomes a better first responder by learning which approach sequences lead to positive outcomes most often.

**Admin review for Channel I:** Every item is manually reviewed. No bulk approve. Extra verification checkbox: "Confirmed: this item contains no identifiable content and no conversation content."

---

### Channel J: Victory Celebration Voice Effectiveness

**Source features:** Victory Recorder (PRD-11)

**Trigger:** After celebration text is generated and user saves it (positive signal) vs. edits it substantially or regenerates (weak/negative signal).

**What's captured:**
- Voice personality used
- Victory type/life area tag
- Outcome: saved as-is, lightly edited, substantially edited, regenerated
- User's faith_tradition broad category (if celebration had faith elements)

**Value:** Which voices resonate for which victory types? If families with active faith preferences consistently prefer Voice C for spiritual victories but Voice A for academic ones, the system can auto-suggest voice selection based on victory type and family context.

**Privacy note:** No victory content, no personal details. Only voice + type + outcome signal.

---

### Channel K: Widget & Tracker Configurations

**Source features:** Widgets (PRD-10), Widget Template Catalog

**Trigger:** When a custom-configured widget has been active for 30+ days with regular data entry.

**What's captured:**
- Tracker type + visual variant
- Configuration parameters: goal amount, unit, reset period, multiplayer mode
- Size preference (S/M/L)
- Life area category
- Whether it was created from a starter template or from scratch
- Active duration and interaction frequency

**Value:** If 100 families independently create essentially the same water intake tracker (tally type, 8-glass goal, daily reset, coin jar visual), it should become a one-tap starter configuration. The Widget Template Catalog grows organically from real usage, not from guessing what people might want to track.

**Deduplication:** Embedding similarity on the configuration parameters. Near-identical configs increment `seen_count`.

---

### Channel L: Question Phrasings That Produce Rich Responses

**Source features:** All guided modes — ThoughtSift, LifeLantern, Family Vision Quest, Meetings, Self-Discovery

**Trigger:** After each guided mode question is answered, log the response engagement signal.

**What's captured:**
- The LiLa question phrasing (this is our content, not user content — safe to capture)
- Guided mode and section context
- Response engagement signal: response length (words), response time (how long user spent), whether the response led to a routing action (saved to journal, created a task, etc.)

**What is NEVER captured:**
- The user's actual response content

**Value:** Some question phrasings consistently produce rich, engaged responses. Others get one-word answers. Over time, the system learns which phrasings unlock deeper reflection. "What happened this week?" gets shorter answers than "What moment this week surprised you?" These signals refine LiLa's question repertoire across all guided modes.

**Privacy note:** Only our question phrasings and engagement metrics are captured. Never user responses.

---

## Promoted Intelligence Tables

### Table: `platform_intelligence.prompt_patterns`

| Column | Type | Notes |
|--------|------|-------|
| id | UUID | PK |
| tool_type | TEXT | Which tool/mode this pattern serves |
| pattern_name | TEXT | Admin-assigned name |
| template_structure | TEXT | Anonymized prompt skeleton with typed placeholders |
| placeholder_types | JSONB | Placeholder definitions |
| context_types_needed | TEXT[] | Context types for this pattern |
| effectiveness_score | FLOAT | From outcome signals |
| embedding | halfvec(1536) | For semantic matching |
| seen_count | INTEGER | From the queue |
| is_active | BOOLEAN | |
| created_at | TIMESTAMPTZ | |

### Table: `platform_intelligence.context_effectiveness`

| Column | Type | Notes |
|--------|------|-------|
| id | UUID | PK |
| tool_type | TEXT | |
| context_type | TEXT | Specific context type label |
| inclusion_count | INTEGER | |
| positive_outcome_count | INTEGER | |
| effectiveness_ratio | FLOAT | Generated |
| sample_size_sufficient | BOOLEAN | Generated: count > threshold |
| last_updated | TIMESTAMPTZ | |

### Table: `platform_intelligence.edge_case_registry`

| Column | Type | Notes |
|--------|------|-------|
| id | UUID | PK |
| source_tool_type | TEXT | Tool they were using |
| detected_use_case | TEXT | What they were actually doing |
| anonymized_example | TEXT | Representative prompt |
| occurrence_count | INTEGER | |
| admin_assessment | TEXT | Admin notes |
| action_taken | TEXT | 'new_tool_created', 'variant_added', 'noted_for_future', 'dismissed' |
| embedding | halfvec(1536) | |
| created_at | TIMESTAMPTZ | |

### Table: `platform_intelligence.board_personas`

| Column | Type | Notes |
|--------|------|-------|
| id | UUID | PK |
| persona_name | TEXT | |
| persona_type | TEXT | 'system_preloaded', 'community_generated' |
| personality_profile | JSONB | Traits, philosophies, communication style, response tendencies |
| source_references | JSONB | Verifiable sources |
| embedding | halfvec(1536) | For semantic search |
| content_category | TEXT | 'public_figure', 'religious_leader', 'fictional_character', 'prayer_seat' |
| moderation_status | TEXT | 'approved', 'pending_review', 'rejected' |
| usage_count | INTEGER | Platform-wide |
| is_active | BOOLEAN | |
| created_at | TIMESTAMPTZ | |

### Table: `platform_intelligence.book_cache`

The platform-level book registry and extraction cache.

| Column | Type | Notes |
|--------|------|-------|
| id | UUID | PK |
| title | TEXT | Book title |
| author | TEXT | Book author |
| title_author_embedding | halfvec(1536) | For fuzzy matching when users upload |
| isbn | TEXT | NULL | Optional, for precise matching |
| chapter_list | JSONB | Array of chapter titles/sections discovered |
| total_upload_count | INTEGER | Times this book has been uploaded across all users |
| ethics_gate_status | TEXT | 'passed', 'failed', 'pending' — Layer 1 result |
| ethics_gate_notes | TEXT | Haiku's reasoning for pass/fail |
| created_at | TIMESTAMPTZ | |

### Table: `platform_intelligence.book_extraction_cache`

Cached extractions per chapter, linked to book_cache.

| Column | Type | Notes |
|--------|------|-------|
| id | UUID | PK |
| book_cache_id | UUID | FK → book_cache |
| chapter_key | TEXT | Chapter identifier (title or index) |
| extraction_type | TEXT | 'summary', 'declaration', 'framework', 'action_step' |
| extracted_content | JSONB | The extraction data (matches manifest extraction format) |
| extraction_model | TEXT | Which model generated this ('sonnet_4.6', etc.) |
| quality_score | FLOAT | NULL | Admin-assigned quality rating after review |
| created_at | TIMESTAMPTZ | |

### Table: `platform_intelligence.synthesized_principles`

Universal wisdom principles synthesized from multiple book sources. This is what LiLa actually uses in conversations.

| Column | Type | Notes |
|--------|------|-------|
| id | UUID | PK |
| principle_text | TEXT | The universal principle in LiLa's voice |
| topic_tags | TEXT[] | Topics this principle applies to ('habit_building', 'parenting_patience', 'decision_making', etc.) |
| source_book_ids | UUID[] | FK[] → book_cache. All books that converge on this principle |
| source_count | INTEGER | How many independent sources support this principle |
| embedding | halfvec(1536) | For semantic matching when LiLa needs relevant wisdom |
| application_context | JSONB | When/how to apply this principle: situations, conversation types, emotional contexts |
| ethics_status | TEXT | 'approved' — only approved principles exist here |
| strength_score | FLOAT | Higher = more sources, more usage, more positive outcomes |
| is_active | BOOLEAN | |
| created_at | TIMESTAMPTZ | |
| updated_at | TIMESTAMPTZ | |

### Table: `platform_intelligence.framework_ethics_log`

Audit trail for the three-layer ethics filter.

| Column | Type | Notes |
|--------|------|-------|
| id | UUID | PK |
| book_cache_id | UUID | FK → book_cache |
| extraction_cache_id | UUID | NULL | FK → book_extraction_cache (NULL for Layer 1 book-level scan) |
| filter_layer | INTEGER | 1, 2, or 3 |
| model_used | TEXT | 'haiku_4.5' or 'sonnet_4.6' |
| classification | TEXT | 'approved', 'flagged_for_review', 'auto_rejected' |
| reasoning | TEXT | AI's explanation |
| admin_override | TEXT | NULL | If admin overrode: 'approved', 'rejected' |
| admin_notes | TEXT | NULL | |
| created_at | TIMESTAMPTZ | |

### Table: `platform_intelligence.meeting_section_patterns`

| Column | Type | Notes |
|--------|------|-------|
| id | UUID | PK |
| meeting_type | TEXT | couple, family_council, parent_child, etc. |
| section_name_pattern | TEXT | Anonymized section name |
| section_prompt_pattern | TEXT | Anonymized prompt text |
| is_custom | BOOLEAN | Was this a user-created section (not a default)? |
| usage_count | INTEGER | Families using this pattern |
| archive_rate | FLOAT | % of families that archive this section |
| effectiveness_signal | FLOAT | Derived from usage patterns |
| embedding | halfvec(1536) | |
| created_at | TIMESTAMPTZ | |

### Table: `platform_intelligence.declaration_patterns`

| Column | Type | Notes |
|--------|------|-------|
| id | UUID | PK |
| entry_type | TEXT | belief, value, principle, declaration, commitment, identity, affirmation |
| structural_pattern | TEXT | Anonymized structure: "I choose to [ACTION] rather than [OLD_PATTERN]" |
| topic_category | TEXT | patience, presence, faith, health, relationships, etc. |
| seen_count | INTEGER | |
| embedding | halfvec(1536) | |
| created_at | TIMESTAMPTZ | |

### Table: `platform_intelligence.routine_patterns`

| Column | Type | Notes |
|--------|------|-------|
| id | UUID | PK |
| routine_type | TEXT | morning, bedtime, chore, homework, etc. |
| age_range | TEXT | play, guided, independent, adult |
| step_count | INTEGER | |
| step_categories | TEXT[] | Anonymized step types |
| avg_completion_rate | FLOAT | |
| avg_duration_minutes | INTEGER | |
| active_family_count | INTEGER | |
| embedding | halfvec(1536) | |
| created_at | TIMESTAMPTZ | |

### Table: `platform_intelligence.widget_configurations`

| Column | Type | Notes |
|--------|------|-------|
| id | UUID | PK |
| tracker_type | TEXT | tally, boolean_checkin, streak, etc. |
| visual_variant | TEXT | coin_jar, flame_counter, etc. |
| config_params | JSONB | Anonymized configuration (goal, unit, reset period) |
| life_area | TEXT | |
| seen_count | INTEGER | |
| avg_active_days | FLOAT | |
| avg_interaction_frequency | FLOAT | |
| embedding | halfvec(1536) | |
| created_at | TIMESTAMPTZ | |

### Table: `platform_intelligence.question_effectiveness`

| Column | Type | Notes |
|--------|------|-------|
| id | UUID | PK |
| guided_mode | TEXT | thoughtsift, life_lantern, family_vision_quest, etc. |
| section_context | TEXT | Which part of the guided flow |
| question_phrasing | TEXT | Our question text (not user content) |
| avg_response_length | FLOAT | Words |
| avg_response_time_seconds | FLOAT | |
| routing_action_rate | FLOAT | % of responses that led to a routing action |
| sample_size | INTEGER | |
| effectiveness_score | FLOAT | Composite of length + time + routing signals |
| created_at | TIMESTAMPTZ | |
| updated_at | TIMESTAMPTZ | |

---

## The Review Queue

### Table: `platform_intelligence.review_queue`

| Column | Type | Notes |
|--------|------|-------|
| id | UUID | PK |
| channel | TEXT | 'prompt_pattern', 'context_signal', 'edge_case', 'persona', 'book_framework', 'meeting_section', 'declaration_pattern', 'routine_pattern', 'safe_harbor_structure', 'celebration_voice', 'widget_config', 'question_phrasing' |
| status | TEXT | 'pending', 'approved', 'refined', 'rejected', 'deferred' |
| priority_score | FLOAT | Auto-calculated from seen_count + outcome signals |
| content | JSONB | Captured data (varies by channel) |
| anonymization_verified | BOOLEAN | Human-verified no personal data? |
| admin_notes | TEXT | |
| seen_count | INTEGER | |
| first_seen_at | TIMESTAMPTZ | |
| last_seen_at | TIMESTAMPTZ | |
| reviewed_at | TIMESTAMPTZ | |
| promoted_to_id | UUID | FK to promoted table |
| created_at | TIMESTAMPTZ | |

---

## Admin Review Workflow

### The Review Screen

**Header:** "Platform Intelligence Review" with counts: "24 pending · 5 high-priority"

**Filter bar:** Channel filter (All + each channel) | Sort (Priority / Newest / Most Seen) | Bulk mode toggle

**Item cards:** Channel icon, priority indicator, seen count badge, preview, quick-action buttons: ✅ Approve | ✏️ Refine | 🗑️ Reject | ⏸️ Defer

**Tapping a card expands inline** — full content, source statistics, admin notes field, anonymization verification checkbox.

**Bulk mode:** Checkboxes → "Approve Selected" / "Reject Selected" bottom bar.

**Special view: Books**
Separate tab or filter for Channel E book content. Shows books in a list with:
- Title, author, upload count, ethics gate status
- Expand to see chapters → frameworks → individual principles
- Per-book bulk approve/reject
- Drill into flagged items for individual review

**Special view: Safe Harbor (Channel I)**
Every item reviewed individually. No bulk approve. Extra verification: "Confirmed: contains no identifiable content and no conversation content."

**Weekly digest notification:** "28 new items. 7 high-priority. 3 new books for framework review. Estimated time: 15 minutes."

---

## How the Platform Consumes Intelligence

### Optimizer Template Matching
Searches `prompt_patterns` by embedding similarity. High-confidence match → template assembly (free). No match → Sonnet call → new capture candidate. **Flywheel: 80/20 split gradually shifts toward 95/5.**

### Context Preset Optimization
`context_effectiveness` data adjusts default context type inclusion/ordering per tool type. Soft signal, not hard rules.

### Edge Case → New Tool Pipeline
High-occurrence edge cases auto-prioritize in admin queue. Admin decides: new tool, variant, note, or dismiss.

### LiLa Advisory Knowledge
`synthesized_principles` are loaded into LiLa's context when semantically relevant to the conversation topic. LiLa applies principles naturally. Multiple convergent sources strengthen confidence. Attribution offered only when requested, framed as "this principle appears across several books" with specific titles as further reading.

### Book Extraction Caching
New uploads checked against `book_cache` by title/author embedding. Match → clone cached chapters. No match → fresh extraction → new cache entry.

### Meeting Template Refinement
High-usage custom sections suggested as new defaults. High-archive defaults reconsidered for timing or placement.

### Starter Declarations Library
Popular declaration patterns available to new users as inspiration on the Guiding Stars page.

### Routine Template Library
Proven routines available in Studio as starter configurations, tagged by age range and routine type.

### Widget Template Growth
Popular custom configurations added to the Widget Template Catalog as new starter configs.

### Question Phrasing Refinement
High-effectiveness question phrasings replace low-effectiveness ones in guided mode scripts.

### Victory Voice Auto-Suggestion
Voice personality suggestion based on victory type + family context patterns.

---

## Anonymization Pipeline

The anonymization Edge Function runs on all captured content before it enters the queue.

**Process:**
1. Load the family's member names (first names, nicknames)
2. Replace all names → `[FAMILY_MEMBER_N]`
3. Replace locations → `[LOCATION]`, `[SCHOOL]`, `[FAITH_COMMUNITY]`
4. Replace personal details → `[AGE]`, `[DATE]`, `[MEDICAL_CONDITION]`, `[FOOD_ITEM]`
5. Structural preservation check — verify anonymized version still makes sense
6. Re-identification risk check — flag for manual review if unusual combinations could identify a family
7. Output → review queue

**Admin verification:** Every item has "Anonymization verified?" checkbox before approval.

---

## Self-Improving Metrics

| Metric | What It Measures |
|--------|-----------------|
| Template hit rate | % of Optimizer requests served by cached patterns (trending upward = flywheel working) |
| Context precision score | Average effectiveness ratio across tool types |
| Persona library size | Total approved community personas |
| Book library size | Total cached books + total synthesized principles |
| Edge case conversion rate | % of edge cases → new tools/variants |
| Routine template adoption | % of new routines created from platform templates vs. from scratch |
| Declaration starter usage | % of new Guiding Stars inspired by platform patterns |
| Question effectiveness trend | Average engagement score across guided modes over time |
| Cost per family trend | Monthly AI cost per family, trending over time |

---

## Build Timing

| Phase | What's Built | Channels Wired |
|-------|-------------|----------------|
| With pgvector infrastructure | `platform_intelligence` schema, `review_queue` table, all promoted tables, anonymization Edge Function | Infrastructure only — no captures yet |
| With Optimizer (PRD-05C) | Prompt pattern capture, context signal capture, template matching consumption | A, B |
| With Guiding Stars (PRD-06) | Declaration pattern capture | G |
| With Journal/Notepad (PRD-08) | (Auto-tagging uses embedding — no new channel, but context signals flow through B) | B enriched |
| With Tasks/Routines (PRD-09A/B) | Routine pattern capture after 30-day threshold | H |
| With Widgets (PRD-10) | Widget config capture after 30-day threshold | K |
| With Victory Recorder (PRD-11) | Celebration voice effectiveness capture | J |
| With Meetings (PRD-16) | Meeting section effectiveness capture | F |
| With Safe Harbor (PRD-20) | Safe Harbor structure capture (with extreme caution) | I |
| With AIVault (PRD-21A) | Edge case detection, per-member context caching | C |
| With ThoughtSift (future) | Persona library capture + consumption | D |
| With Knowledge Base (future) | Book extraction caching, framework curation, synthesized principles | E |
| With Guided Modes (various) | Question phrasing effectiveness capture | L |
| Admin Console | Review UI with all 12 channel views + book review + Safe Harbor special handling | All |

---

## CLAUDE.md Additions from This Addendum

- [ ] Platform intelligence lives in the `platform_intelligence` schema. Never write family-identifiable data to this schema.
- [ ] Twelve capture channels (A-L). Each feature PRD notes which channels it wires during build.
- [ ] All captured data passes through the anonymization Edge Function before entering the review queue. Never bypass anonymization.
- [ ] Admin review is Human-in-the-Mix: nothing becomes platform intelligence without admin approval.
- [ ] Book extraction caching: check `platform_intelligence.book_cache` before running Sonnet extraction. Clone cached chapters; extract only new ones.
- [ ] Three-layer ethics filter on book frameworks: Haiku pre-screen → Sonnet principle scan → admin review. Auto-reject coercion, force, manipulation, shame-based frameworks.
- [ ] Synthesized principles: LiLa never cites a single source in conversation. Principles are applied as universal wisdom. Attribution on request: "this shows up across several books" + titles as further reading.
- [ ] Personal custom personas NEVER enter the platform intelligence pipeline.
- [ ] Safe Harbor channel (I) captures ONLY structural conversation flow patterns, NEVER content. Every item manually reviewed.
- [ ] Board of Directors: deities → prayer seat (reflection questions, not AI speaking as God). Blocked figures: those associated with atrocity/evil.

---

## Cross-PRD Impact

| PRD Affected | What Changes |
|-------------|-------------|
| PRD-05C (LiLa Optimizer) | Channels A, B. Template matching against prompt_patterns. Context signals capture. On-copy prompt pattern capture. |
| PRD-06 (Guiding Stars) | Channel G. Declaration pattern capture on creation. Starter declarations library consumption. |
| PRD-08 (Journal + Notepad) | Channel B enrichment. Context effectiveness signals from all routing actions. |
| PRD-09A/B (Tasks/Routines/Studio) | Channel H. Routine pattern capture at 30-day threshold. Template consumption in Studio. |
| PRD-10 (Widgets) | Channel K. Widget config capture at 30-day threshold. Template catalog growth. |
| PRD-11 (Victory Recorder) | Channel J. Voice effectiveness signals. |
| PRD-16 (Meetings) | Channel F. Section usage tracking. Template refinement. |
| PRD-20 (Safe Harbor) | Channel I. Structure-only capture with extreme caution. |
| PRD-21A (AIVault) | Channel C. Edge case detection. Per-member context caching. |
| Future: ThoughtSift | Channel D. Persona library. Content policy enforcement. |
| Future: Knowledge Base | Channel E. Book caching, framework curation, synthesized principles, three-layer ethics filter. |
| All guided modes | Channel L. Question effectiveness tracking. |
| Admin Console | Review UI for all 12 channels. Book review screen. Safe Harbor special handling. |
| Pre-Build Setup | Create `platform_intelligence` schema during scaffolding. |

---

## Decisions Made

| # | Decision | Rationale |
|---|----------|-----------|
| 1 | **Separate `platform_intelligence` schema** | Clean separation of user data (family-scoped) and platform intelligence (platform-wide). Different RLS, different access patterns, different retention. |
| 2 | **Twelve capture channels wired from day one** | Since no code exists yet, building capture triggers into each feature as it's coded is trivial. Retrofitting later would require touching every feature. |
| 3 | **Synthesized wisdom over book attribution** | LiLa speaks with earned authority. Multiple sources converging IS the authority. Avoids copyright concerns. Attribution available on request as "further reading." |
| 4 | **Upload required for book access** | Prevents platform from becoming a free summary service. Respects content value. Users still get the full experience — caching is invisible to them. |
| 5 | **Three-layer ethics filter: Haiku gate → Sonnet scan → admin review** | Haiku catches obvious problems cheaply. Sonnet handles nuance. Admin makes final call on edge cases. Total cost ~$3.35/month for 100 books. |
| 6 | **Auto-reject coercion/manipulation/force frameworks** | Non-negotiable platform value. LiLa will never suggest manipulative approaches, regardless of which books teach them. |
| 7 | **Channel I (Safe Harbor) captures structure only, never content** | Safety and trust are paramount. Users in vulnerable states must trust that their conversations are private. Structural patterns improve LiLa's approach without ever exposing what anyone said. |
| 8 | **Per-book admin review with chapter/principle drill-down** | Gives admin the right level of granularity: quick bulk approve at book level, detailed review when needed at principle level. |
| 9 | **Deduplication via embedding similarity across all channels** | Prevents duplicate review items. High seen_count naturally surfaces the most valuable patterns. |
| 10 | **Priority scoring based on seen_count + outcome signals** | Admin time is finite. Prioritization ensures the highest-impact items get reviewed first. |

---

*Document version: 2.0*
*Created: March 15, 2026*
*Supersedes: Platform Intelligence Pipeline v1*
*Companion to: Semantic Context Infrastructure Addendum, AI Cost Optimization Patterns*
