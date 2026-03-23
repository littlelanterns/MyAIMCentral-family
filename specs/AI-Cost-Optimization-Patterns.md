# MyAIM Family: AI Cost Optimization Patterns
## Feature-by-Feature AI Call Inventory and Optimization Strategies

**Purpose:** Comprehensive reference mapping every AI API call in the platform, the optimization patterns that reduce cost and improve user experience for each, and implementation guidance. Companion document to the Semantic Context Infrastructure Addendum.

**Principle:** Every optimization listed here must either improve or be invisible to mom's experience. We never trade user convenience for cost savings. Where an optimization is purely cost-neutral to the user, it's marked as such. Where it actively improves her experience, that's noted.

**Referenced by:** All PRDs containing AI integration, Pre-Build Setup Checklist, AI-COST-TRACKER.md, CLAUDE.md

---

## Optimization Patterns Reference

These patterns are referenced throughout the document by number. Each feature section notes which patterns apply.

| # | Pattern | What It Does | Infrastructure Needed |
|---|---------|-------------|----------------------|
| P1 | **Semantic Context Assembly** | Similarity search finds relevant context instead of loading by category | pgvector (Semantic Context Addendum) |
| P2 | **Embedding-Based Classification** | Replaces Haiku classification/tagging calls with Postgres similarity queries | Reference embeddings table + pgvector |
| P3 | **Embedding Delta Detection** | Only triggers AI scans when genuinely new information is detected | Comparison query against existing embeddings |
| P4 | **Smart Regeneration** | Skips AI regeneration when content hasn't materially changed | Context fingerprint comparison |
| P5 | **On-Demand Secondary Output** | Generates explainers/extras only when user requests them via action chips | Structured response + action chip UI |
| P6 | **Prompt Pattern Caching** | Caches successful prompt structures for reuse with fresh context | `prompt_pattern_cache` table |
| P7 | **Per-Member Context Caching** | Pre-assembles frequently-needed context bundles per member per tool type | `member_context_cache` table with TTL |
| P8 | **Shared Persona Library** | Generates character/personality profiles once, reuses across all users | `board_personas` table with community sharing |
| P9 | **Per-Turn Context Refresh** | Refreshes semantic context at each conversation turn instead of loading everything at start | pgvector query per turn |

---

## Feature-by-Feature AI Call Inventory

---

### 1. LiLa Optimizer (PRD-05C)

**Current AI calls:**
- Sonnet: Complex/novel prompt optimization (~20% of requests)
- Haiku: Request type detection and context preset selection
- Haiku: Context learning detection (scan every mom message for new family info)
- Haiku: "What did I add?" explainer generation (on every prompt card)

**Optimization patterns that apply:**

**P1 — Semantic Context Assembly:**
Auto-detect mode uses pgvector similarity search instead of category-based preset matching. Mom's request is embedded, top 15 most relevant context items returned from all tables. Presets remain as manual overrides.
- *Cost impact:* Eliminates Haiku classification call (~$0.001/request)
- *UX impact:* Better context = better prompts. Invisible to mom — she just gets better results.

**P3 — Embedding Delta Detection for Context Learning:**
Before calling Haiku to scan for new info, compare mom's message embedding against existing Archives. If max similarity > threshold, the message is about known topics — skip the Haiku scan. Only call Haiku when something genuinely new is detected.
- *Cost impact:* Eliminates ~85% of context learning Haiku calls (~$0.085/family/month at 100 messages)
- *UX impact:* Fewer false "Want me to save this?" interruptions. Mom only gets the offer when it's actually useful.

**P5 — On-Demand Secondary Output:**
The current spec generates the optimized prompt + "What did I add?" explainer + platform suggestions in one Sonnet call. Redesign: generate ONLY the prompt card. Below it, offer action chips: "Explain what I added," "Why this structure?", "Suggest alternatives." Each chip triggers a small focused call only if mom taps it.
- *Cost impact:* If 60% of the time mom copies the prompt without tapping, eliminates ~60% of explainer output tokens. At Sonnet output pricing ($15/1M tokens), significant.
- *UX impact:* **Faster.** Mom gets her prompt sooner because LiLa isn't generating text she didn't ask for. When she wants the explainer, she gets it on demand — feels responsive, not bloated.

**P6 — Prompt Pattern Caching:**
When a Sonnet call produces a prompt, hash the structural pattern (prompt type + optimization approach). Cache it. Next time the same pattern appears with different family context, JavaScript assembles the prompt using the cached structure — no Sonnet call.
- *Cost impact:* If 30% of the "20% that hits Sonnet" is a pattern repeat, eliminates ~6% of total Optimizer requests from needing Sonnet.
- *UX impact:* **Faster.** Cached patterns resolve in milliseconds vs. 3-5 second Sonnet round-trip.

**P7 — Per-Member Context Caching for AIVault Templates:**
When a tool from the AIVault/Toolbox is launched (e.g., Meal Planning), pre-assemble a context bundle for the relevant members: food preferences, dietary restrictions, favorite meals, recipes, scheduling constraints. Cache this per member with a TTL (invalidate when relevant Archives items change). Next time that tool is launched for those members, the context is instant — no assembly queries.
- *Cost impact:* Reduces context assembly time (not direct AI cost, but reduces input tokens by being pre-filtered).
- *UX impact:* **Instant launch.** AIVault tools feel snappy because the context is already ready. Mom opens Meal Planner and her family's dietary info is already loaded.

> **Decision rationale for P5:** This is a UX improvement disguised as a cost optimization. Moms are busy. They want the prompt, not a lecture about the prompt. The explainer is there when they want to learn — it's an opt-in teaching moment, not a forced delay.

---

### 2. LiLa General Chat (PRD-05)

**Current AI calls:**
- Sonnet: Every conversation message (emotional intelligence, complex reasoning)
- Context assembly at conversation start (loads from Archives, Guiding Stars, InnerWorkings, etc.)

**Optimization patterns that apply:**

**P1 + P9 — Per-Turn Semantic Context Refresh:**
Instead of loading all context at conversation start and carrying it through, embed each user message and do a fresh semantic search. Early messages about "dinner planning" pull food context. When the conversation shifts to "but I'm stressed about Jake's school situation," the next turn pulls Jake's academic context, her stress-related InnerWorkings, and relevant Best Intentions — without mom switching modes or telling LiLa to load different context.
- *Cost impact:* Tighter context per turn = fewer input tokens per Sonnet call. Estimated 30-40% reduction in context tokens across a multi-turn conversation.
- *UX impact:* **Dramatically better.** LiLa feels like it actually follows the conversation instead of being stuck with whatever context was loaded at the start. This is the single biggest "LiLa feels smart" improvement.

**P5 — On-Demand Depth:**
When LiLa provides advice or suggestions, keep the initial response concise and actionable. Offer action chips: "Tell me more," "Give me examples," "What's the research?" Only generate deeper content if mom asks.
- *Cost impact:* Reduces average output tokens per turn.
- *UX impact:* **Respectful of mom's time.** She gets the answer, not a wall of text. Depth is available when she wants it.

---

### 3. Guided Mode: Cyrano Me (PRD-21)

**What it does:** Crafts personalized compliments, encouragements, love notes for a specific person.

**Current AI calls:**
- Sonnet: Generates the compliment/note with relationship and personality context

**Optimization patterns that apply:**

**P1 — Semantic Context Assembly:**
When mom selects the recipient, semantic search finds the most relevant personality traits, recent victories, relationship dynamics, and love language preferences — across InnerWorkings, Archives, and recent journal entries. Much richer context than category-based loading.
- *Cost impact:* Smaller, more relevant context window.
- *UX impact:* **Better compliments.** Instead of generic "you're great," Cyrano references specific things about the person that make the note feel deeply personal.

**P7 — Per-Member Relationship Context Cache:**
The first time mom uses Cyrano for a specific person, assemble and cache their relationship context bundle (personality, love language, recent interactions, things they appreciate). Subsequent Cyrano uses for the same person are instant context load.
- *Cost impact:* Negligible direct AI savings (Cyrano is a single call), but faster response time.
- *UX impact:* **Faster.** Second use for the same person is noticeably quicker.

---

### 4. Guided Mode: Higgins — Say/Navigate (PRD-21)

**What it does:** Coaches mom on talking points (Say) or navigating difficult conversations (Navigate) with a specific person.

**Current AI calls:**
- Sonnet: Generates talking points or navigation strategy with full relationship context

**Optimization patterns that apply:**

**P1 — Semantic Context Assembly:**
When mom describes the situation ("I need to talk to Jake about his screen time"), semantic search surfaces: Jake's recent behavior patterns, relevant Best Intentions, past successful conversations on similar topics (from journal entries), Jake's personality and communication preferences, and faith-based guidance approach. All found by meaning, not by folder.
- *Cost impact:* Tighter context = cheaper Sonnet call.
- *UX impact:* **Much better talking points.** Higgins knows the history and can reference what worked before.

**P5 — On-Demand Depth:**
Initial Higgins response: 3-5 key talking points, concise. Action chips: "Explain the approach," "What if they react badly?", "Practice this conversation," "Softer version," "More direct version."
- *Cost impact:* Shorter initial response. Follow-up calls only when needed.
- *UX impact:* **Actionable first.** Mom might just need the talking points. If she wants coaching, it's one tap away.

---

### 5. Guided Mode: Love Language Toolboxes (Quality Time, Gifts, Observe & Serve, Words of Affirmation, Gratitude) (PRD-21)

**What they do:** Mode-specific relationship tools — each one helps mom express love in a specific love language style, personalized to the recipient.

**Current AI calls:**
- Sonnet: Each conversation turn uses relationship + personality context

**Optimization patterns that apply:**

**P1 — Semantic Context Assembly:**
Each toolbox benefits from semantic search finding the *specific* context relevant to that love language. Quality Time tool surfaces: the person's interests, available schedule blocks, past successful quality time activities (from journal entries). Gifts tool surfaces: wishlists, preferences, price sensitivities, past gift reactions. Each toolbox gets exactly the context it needs.
- *Cost impact:* Smaller context windows per toolbox.
- *UX impact:* **Hyper-personalized suggestions.** The Gifts tool knows that Jake loved the Lego set but was lukewarm about the book. Quality Time knows that Gideon opens up most during car rides.

**P7 — Per-Member Love Language Cache:**
Assemble love-language-specific context per member and cache it. When mom opens the Quality Time tool for a specific child, the child's interests/availability/past activities are pre-loaded.
- *Cost impact:* Faster assembly, slightly reduced context tokens.
- *UX impact:* **Instant personalization.** Tool feels like it already knows the person.

---

### 6. Guided Mode: ThoughtSift (PRD future — Inner Wisdom)

**What it does:** Deep personal processing — decisions, emotions, problem-solving, vision casting, daily processing. Multi-turn Sonnet conversations with full personal context.

**Current AI calls:**
- Sonnet: Every conversation turn (complex emotional reasoning)
- Context assembly pulls InnerWorkings, Guiding Stars, Best Intentions, recent journal entries, LifeLantern areas

**Optimization patterns that apply:**

**P1 + P9 — Per-Turn Semantic Context Refresh:**
ThoughtSift conversations often shift topics organically. Mom starts talking about a work decision, then connects it to family impact, then to her personal values. Per-turn semantic search ensures each response draws from the most relevant context for *that specific turn*.
- *Cost impact:* 30-40% reduction in context tokens across multi-turn conversations.
- *UX impact:* **LiLa feels genuinely insightful.** Instead of carrying stale context from the conversation start, every response is informed by exactly the right personal data for what's being discussed right now.

**P8 — Shared Persona Library (Board of Directors):**
ThoughtSift's Board of Directors tool lets mom assemble a panel of advisors to examine a situation from multiple perspectives. Personas fall into three tiers:

**System Preloaded:** Curated starter set of well-known figures with carefully built personality profiles based on verifiable writings and speeches. Ready at launch, zero AI cost per use. Examples: Brené Brown (vulnerability/courage lens), Dave Ramsey (financial wisdom lens), C.S. Lewis (faith + logic lens).

**Community Generated:** When a user picks someone not yet in the library (e.g., Malala, Ben Carson), a Sonnet call generates the persona based on publicly available speeches, writings, and known philosophies. The user gets it immediately. After moderation review (verifying accuracy against real sources, checking content policies), it's flagged `is_public = true` and becomes available to all future users. Users help build the product for everyone.

**Personal Custom:** Mom's actual grandmother, a specific pastor, a personal mentor. Sonnet generates a persona from mom's description. Stored only for that user (`is_public = false`). Never shared — this is personal, possibly containing private family details.

**Content policy (reference — full rules in ThoughtSift PRD):**
- **Blocked as speaking personas:** Deities (God, Jesus, Allah, etc.) — not appropriate for AI to speak as divine beings. Instead, selecting a deity generates a "Prayer Seat" on the board: a set of reflection questions the user could take to prayer/meditation. Respects the sacred across all faith traditions.
- **Blocked entirely:** Historical figures associated with atrocity or evil (Hitler, etc.), fictional embodiments of evil (Satan, etc.)
- **Allowed with verifiable sources:** Religious leaders (Dallin H. Oaks, Russell M. Nelson, Pope Francis, etc.) — persona built from their published talks, books, and public addresses. Must include `source_references` citing specific verifiable material.
- **Allowed as fictional/literary:** Characters like Screwtape (C.S. Lewis) — clearly literary, used for the pedagogical perspective Lewis intended.

**Persona table structure:**

| Column | Type | Notes |
|--------|------|-------|
| id | UUID | PK |
| persona_name | TEXT | Display name |
| persona_type | TEXT | 'system_preloaded', 'community_generated', 'personal_custom' |
| personality_profile | JSONB | Traits, philosophies, communication style, decision-making approach, known positions, response tendencies |
| source_references | JSONB | Array of verifiable sources (book titles, speech URLs, publication dates) |
| embedding | halfvec(1536) | For semantic search ("someone who thinks about education reform") |
| content_category | TEXT | 'public_figure', 'religious_leader', 'fictional_character', 'personal', 'prayer_seat' |
| is_public | BOOLEAN | Community-shared vs. personal |
| is_verified | BOOLEAN | Moderation-reviewed for accuracy |
| created_by_family_id | UUID | Who generated it (NULL for system preloaded) |
| usage_count | INTEGER | Times selected across all users (for popularity sorting) |
| moderation_status | TEXT | 'approved', 'pending_review', 'rejected' |

- *Cost impact:* **Massive.** A popular persona like Brené Brown might be selected by 1,000 users. Without caching: 1,000 Sonnet calls × ~$0.03 = $30. With shared library: 1 Sonnet call + 999 database reads = $0.03. That's a 99.97% reduction.
- *UX impact:* **Instant board assembly.** Preloaded and community personas load in milliseconds. The Board of Directors feels like choosing from a roster, not waiting for AI to think. Custom personas still take a few seconds (one-time generation), then they're instant forever after.

> **Forward note for ThoughtSift PRD:** The persona library architecture, content policy, moderation workflow, and Board of Directors interaction design belong in the ThoughtSift PRD. This document captures the cost optimization pattern and data structure. The PRD defines the full user experience.

---

### 7. Guided Mode: Safe Harbor (PRD-20)

**What it does:** Stress processing and crisis support. Sensitive, emotionally intelligent conversations when someone is in a vulnerable state.

**Current AI calls:**
- Sonnet: Every conversation turn (maximum empathy and reasoning required)
- Context assembly loads: recent stress patterns, coping preferences, faith approach, relationship context, crisis history

**Optimization patterns that apply:**

**P1 + P9 — Per-Turn Semantic Context Refresh:**
This is where semantic search matters most. When someone comes to Safe Harbor, they may not articulate clearly what's wrong — they might say "everything is falling apart" or "I can't do this anymore." Semantic search against that finds: recent journal entries about stress, Best Intentions that reflect what matters to them (grounding them in purpose), InnerWorkings entries about how they process difficulty, faith-based coping approaches, and relevant relationship context.

As the conversation progresses and the user reveals more ("it's really about the situation with my mother-in-law"), context refreshes to surface that specific relationship history — without the user having to explain the background.
- *Cost impact:* Tighter, more relevant context per turn. Safe Harbor conversations tend to be long (5-15 turns), so cumulative savings are meaningful.
- *UX impact:* **Critical.** In a vulnerable moment, LiLa feeling like it *understands* without being told is the difference between "this AI gets me" and "this AI is useless when it matters." Better context = better emotional support.

**P5 — On-Demand Depth (carefully applied):**
Safe Harbor is the one mode where P5 must be applied with extreme care. The initial response should always be warm and complete — never make someone in crisis tap a button to get the full response. However, for follow-up resources ("Want me to suggest some coping strategies?", "Would a breathing exercise help right now?", "Want to explore what's underneath this?"), on-demand action chips are appropriate and respectful of the user's pace.
- *Cost impact:* Modest.
- *UX impact:* **User-paced.** The person controls the depth, which is therapeutically appropriate — never forcing content on someone in a fragile state.

---

### 8. Guided Modes: LifeLantern Assessment + Family Vision Quest (PRD-12A, PRD-12B)

**What they do:** Multi-step guided conversations for personal life assessment (LifeLantern) and collaborative family vision building (Family Vision Quest).

**Current AI calls:**
- Sonnet: Each assessment step/question uses personal context
- Sonnet: Discussion facilitation (Family Vision Quest — synthesizing family member answers)
- Haiku: Transcript chunking for long voice recordings

**Optimization patterns that apply:**

**P1 + P9 — Per-Turn Semantic Context:**
LifeLantern walks through multiple life areas (health, career, relationships, faith, etc.). At each step, semantic search surfaces the most relevant existing context for THAT specific life area — not all context for all areas.
- *Cost impact:* If the assessment has 8 life areas and each currently loads all context, per-turn semantic search reduces context by ~80% per step.
- *UX impact:* **Better questions.** When LifeLantern asks about career, it already knows from semantic search that mom recently journaled about a job change, has a Best Intention about work-life balance, and her InnerWorkings notes say she's an introvert who needs quiet time to recharge.

**P6 — Pattern Caching for Vision Quest Synthesis:**
Family Vision Quest synthesizes member answers per section. The synthesis pattern (how to weave multiple perspectives into a unified statement) is structurally similar across sections and across families. Cache the synthesis approach; only call Sonnet for the actual content assembly.
- *Cost impact:* Modest — synthesis calls aren't frequent.
- *UX impact:* Faster synthesis delivery during family sessions.

---

### 9. Review & Route Extraction (PRD-08)

**What it does:** AI scans notepad content, meeting transcripts, or conversation text and extracts actionable items (tasks, reflections, values, victories, calendar items, etc.)

**Current AI calls:**
- Haiku: Structured extraction — takes content text + context (active trackers, upcoming meetings, Guiding Stars, InnerWorkings categories, people names), returns categorized extracted items

**Optimization patterns that apply:**

**P2 — Embedding-Based Pre-Filtering:**
Before calling Haiku for extraction, use the content's embedding to determine which context is actually relevant to load for the extraction call. If the notepad content is about meal planning, don't load meeting context or InnerWorkings categories — load food/schedule context only. Smaller input = cheaper Haiku call.
- *Cost impact:* Reduces Haiku input tokens by ~40-50% per extraction call.
- *UX impact:* **Faster extraction.** Less context to process = faster Haiku response.

**P2 — Embedding-Based Item Type Classification:**
After Haiku extracts items, the current spec has each item typed (action_item, reflection, value, victory, etc.). This classification could be done via embedding similarity against reference type embeddings instead of relying on Haiku to classify. Haiku focuses on extraction; embedding handles classification.
- *Cost impact:* Small — classification is a tiny part of the Haiku call.
- *UX impact:* Neutral.

---

### 10. Auto-Tagging: Life Area Tags (PRD-08, PRD-09A, PRD-11)

**What it does:** When content is saved (journal entries, tasks, victories), AI applies `life_area_tags` — topical tags like 'spiritual', 'family', 'health_physical', 'homeschool', etc.

**Current AI calls:**
- Haiku: Called after every journal save, task creation, and victory recording to classify content into life areas

**Optimization patterns that apply:**

**P2 — Embedding-Based Classification (replaces Haiku entirely):**
Pre-compute a reference embedding for each life area tag. When content is saved, its embedding (already generated for semantic search) is compared against the reference tag embeddings. Top 2-3 matches become the auto-tags.

Implementation: A `life_area_reference_embeddings` table with ~16 rows (one per life area tag), each storing a pre-computed embedding of the tag name + representative phrases. A Postgres function compares and returns top matches.
- *Cost impact:* **Eliminates ALL auto-tagging Haiku calls.** At 10-20 content saves per day per active user, that's 300-600 Haiku calls per month per family eliminated. At ~$0.001/call = **$0.30-$0.60/family/month saved.**
- *UX impact:* **Faster.** Tags appear instantly on save instead of after a 1-2 second Haiku round-trip. Same or better quality — embeddings understand meaning just as well as Haiku does for simple topical classification.

> **Decision rationale:** This is the single highest-volume AI call in the platform (fires on every save across three major features) and the easiest to replace with embedding comparison. Implementing this from day one prevents ever having the Haiku call pattern established.

---

### 11. Auto-Titling: Notepad Tabs (PRD-08)

**What it does:** Generates a 3-6 word descriptive title for notepad tabs after content reaches 30+ characters.

**Current AI calls:**
- Haiku: One call per new tab (after 2-second debounce)

**Optimization patterns that apply:**

**P2 — Embedding-Based Title Generation (partial replacement):**
For content that clearly matches a known pattern ("grocery list," "meeting notes for [date]," "letter to [person]"), a JavaScript heuristic can generate the title without any AI call. Embedding comparison against common notepad content patterns can determine if the content fits a known template. Only call Haiku for genuinely novel/complex content where a heuristic title would be poor.
- *Cost impact:* Maybe eliminates 40-50% of auto-title calls.
- *UX impact:* **Faster titles** for common patterns. Same quality for novel content.

> **Note:** This optimization has lower ROI than auto-tagging because auto-title fires once per tab (not per save) and the Haiku call is cheap. Implement if easy, but don't prioritize over P2 for tagging.

---

### 12. Victory Celebration Text (PRD-11)

**What it does:** When a victory is recorded or "Celebrate This!" is tapped, LiLa generates an identity-based celebration narrative.

**Current AI calls:**
- Sonnet (individual): Generates celebration text per victory with Guiding Stars connections, voice personality
- Sonnet (collection): "Celebrate This!" weaves multiple victories into a narrative

**Optimization patterns that apply:**

**P1 — Semantic Context for Celebration:**
When generating celebration text, semantic search against the victory description surfaces the most relevant Guiding Stars, Best Intentions, and recent victories for threading into the narrative. Better connections = more meaningful celebrations.
- *Cost impact:* Smaller context window (only relevant stars/intentions, not all of them).
- *UX impact:* **Celebration feels more personal.** Instead of generic "great job," the narrative connects the victory to what actually matters to this person.

**P6 — Celebration Pattern Caching:**
Victory celebrations follow structural patterns: individual praise → Guiding Stars connection → identity reinforcement → encouragement. Cache the structural pattern; Sonnet only generates the specific content fill.
- *Cost impact:* Could reduce some repeat celebrations to template assembly.
- *UX impact:* Neutral if done well. Must ensure celebrations don't feel formulaic — variety matters here.

> **Caution:** Don't over-optimize celebrations. These are emotional moments. A slightly more expensive Sonnet call that produces a genuinely moving celebration is worth more than a cached template that feels robotic. Apply P6 conservatively here.

---

### 13. Overview Card Generation (PRD-13)

**What it does:** Auto-generates a summary paragraph per family member based on their Archives context.

**Current AI calls:**
- Haiku: Generates/regenerates the overview text, debounced to max once per hour

**Optimization patterns that apply:**

**P4 — Smart Regeneration via Embedding Fingerprint:**
Track a rolling average embedding of all active context items per member. When context changes, compare the new average to the stored fingerprint. Only regenerate the overview card if the cosine distance exceeds a threshold (meaning context has materially changed).
- *Cost impact:* Eliminates ~60-70% of regeneration calls. At 8 members × 3 regenerations/week = 96/month, cutting to ~30 saves ~66 Haiku calls = ~$0.07/month.
- *UX impact:* **Fewer unnecessary loading states.** Mom toggles one small item and the overview card doesn't flicker/reload for a barely-changed summary.

---

### 14. Context Learning Detection (PRD-05C, all LiLa modes)

**What it does:** Scans every mom message in any LiLa conversation for new family information that could be saved to Archives.

**Current AI calls:**
- Haiku: Scans every message for new-information patterns

**Optimization patterns that apply:**

**P3 — Embedding Delta Detection:**
After generating the embedding for mom's message (already happening for P9 per-turn context), run a max-similarity query against all existing Archives items. If max similarity > 0.5 (tunable), the message is about known topics — skip Haiku scan. Only trigger Haiku when the embedding suggests genuinely novel content.
- *Cost impact:* ~85-90% of messages are about known topics. At ~$0.001/Haiku call and ~200 messages/month per active family, saves ~$0.17/month.
- *UX impact:* **Fewer false positive "save this?" offers.** Mom only gets the offer when it's genuinely new info. Feels smarter, less nagging.

---

### 15. Meeting Action Item Extraction (PRD-16)

**What it does:** After a meeting (couple, family, parent-child), AI extracts action items, commitments, calendar dates, and follow-ups from the transcript.

**Current AI calls:**
- Haiku: Structured extraction from transcript (similar to Review & Route)
- Whisper: Voice transcription (if recorded)

**Optimization patterns that apply:**

**P1 — Semantic Context for Smarter Extraction:**
Load meeting participant context via semantic search so extraction is contextually aware. If the couple meeting mentions "the thing with Jake's school," Haiku doesn't just extract a vague action item — it knows from context that Jake has a specific school situation and can label the action item appropriately.
- *Cost impact:* Modest (slightly better Haiku outputs = fewer follow-up clarifications).
- *UX impact:* **Smarter extraction.** Action items come out labeled and contextualized, not generic.

---

### 16. Manifest / Knowledge Base Extraction (Future PRD)

**What it does:** When a book is uploaded, AI extracts summaries, declarations, principles, and action steps.

**Current AI calls (from StewardShip patterns):**
- Haiku: Section discovery (scan book for section boundaries)
- Sonnet: Framework/principle extraction per section
- Sonnet: Declaration and action step generation

**Optimization patterns that apply:**

**P1 — Semantic Search Across Books:**
After books are embedded (per the Semantic Context Addendum), cross-book search is automatic. "What do my parenting books say about screen time?" searches all book chunks by meaning. No per-book selection needed.
- *Cost impact:* Eliminates the need to load entire book context into conversation calls. Instead, load only the relevant chunks.
- *UX impact:* **Cross-book intelligence.** Mom doesn't have to remember which book discussed screen time — the system finds it.

**P8 — Shared Extraction Templates:**
If multiple users upload the same popular book (e.g., "The Whole-Brain Child"), the extraction could be cached and offered to subsequent uploaders. This is more complex (requires book identification) and may be post-MVP.
- *Cost impact:* Could be significant for popular books.
- *UX impact:* Instant extraction results for known books.

---

### 17. AIVault / Toolbox Prompt Templates (PRD-21A)

**What it does:** Pre-built prompt tools in the Library Vault (Meal Planner, Homework Helper, Story Generator, etc.) that auto-fill with family context.

**Current AI calls:**
- Sonnet: When template has complex context fill or the user's request requires novel adaptation beyond template
- JavaScript: Template assembly for well-matched patterns (80% case)

**Optimization patterns that apply:**

**P7 — Per-Member Context Caching (the biggest win here):**
Each AIVault tool type has predictable context needs. Pre-assemble and cache context bundles per member per tool type:

| Tool Type | Cached Context Per Member |
|-----------|--------------------------|
| Meal Planning | Food preferences, dietary restrictions, allergies, favorite meals, recent meal history, budget |
| Homework Help | Grade level, subjects, learning style, current challenges, school schedule |
| Bedtime Stories | Age, interests, favorite characters, themes enjoyed, reading level |
| Behavior Guidance | Personality, recent behavior patterns, relevant Best Intentions, faith approach to discipline |
| Schedule Management | Activities, recurring events, transportation needs, energy patterns |
| Creative & Fun | Interests, age-appropriate activities, past successful ideas |

Cache invalidation: Bust the cache when any relevant Archives item changes (use the same embedding trigger — if a context item's embedding updates and it's in the cached bundle's source set, invalidate).
- *Cost impact:* Tool launches go from "assemble context from 5+ tables" to "read one cached JSONB blob." Not direct AI savings, but reduces context assembly latency which affects every tool use.
- *UX impact:* **Tools feel instant.** Mom opens Meal Planner and it already knows about the peanut allergy, the dairy-free month, and that Tuesdays are busy. No waiting for context to load.

**P6 — Prompt Pattern Caching:**
The same Meal Planner prompt structure works every week with different context variables. Cache the pattern; only call Sonnet when the user's request deviates from the template significantly.
- *Cost impact:* Converts most AIVault tool uses from potential Sonnet calls to JavaScript template assembly.
- *UX impact:* **Faster results.** Cached patterns return in milliseconds.

---

### 18. Voice Transcription (Platform-wide)

**What it does:** Converts speech to text via Whisper API (or Web Speech API fallback).

**Current AI calls:**
- Whisper: Per-minute audio transcription
- Web Speech API (fallback): Free but less accurate

**Optimization patterns that apply:**

**No embedding-based optimizations apply here** — transcription is a fundamentally different type of AI call (audio → text, not text → text).

**Potential optimization:** Chunked transcription (already designed in PRD-12B for long recordings) prevents timeout failures and allows partial results to display while recording continues. This isn't a cost optimization — it's a reliability improvement.

> **Note:** Voice costs are usage-dependent and hard to optimize. The best cost strategy is making voice feel valuable enough that users choose it (saving typing time) rather than limiting it. Per PRD-08: 15-minute voice note ~$0.09, which is a good value for the user's time saved.

---

### 19. Self-Discovery Guided Mode (PRD-07)

**What it does:** LiLa guides the user through personality exploration and self-knowledge building.

**Current AI calls:**
- Sonnet: Conversation turns with personality framework knowledge
- Haiku: Extract insights from the conversation for saving to InnerWorkings

**Optimization patterns that apply:**

**P1 — Semantic Context for Personality Unpacking:**
When the user mentions "I'm an Enneagram Type 1," semantic search can surface any existing InnerWorkings entries about their personality, past self-discovery conversation insights, and relevant Guiding Stars — giving LiLa the full picture of what the user already knows about themselves.
- *Cost impact:* Smaller context window.
- *UX impact:* **LiLa doesn't repeat what the user already knows.** The conversation picks up from their current self-understanding rather than starting from scratch.

**P8 — Framework Knowledge Caching:**
Personality framework descriptions (Enneagram types, MBTI profiles, Gretchen Rubin tendencies, etc.) are static reference content. Cache detailed framework profiles rather than relying on Sonnet's training knowledge, which may be imprecise.
- *Cost impact:* Reduces Sonnet's need to "remember" framework details — they're injected as cached context.
- *UX impact:* **More accurate personality unpacking.** Cached profiles are curated for accuracy; Sonnet's training data may have errors on niche frameworks.

---

### 20. Task Breaker (PRD-09A)

**What it does:** Takes a big task and breaks it into manageable steps, optionally with time estimates and assignment suggestions.

**Current AI calls:**
- Sonnet: Generates the breakdown with family context (who's available, age-appropriate assignments)

**Optimization patterns that apply:**

**P6 — Breakdown Pattern Caching:**
Common task types (meal prep, room cleaning, party planning, homework project) have structural breakdown patterns that repeat. Cache successful patterns; Sonnet only generates novel breakdowns.
- *Cost impact:* Could reduce 30-40% of Task Breaker calls to template assembly.
- *UX impact:* **Faster breakdowns** for common tasks. Same quality for novel ones.

**P1 — Semantic Context for Assignment:**
When suggesting who should do what, semantic search finds each family member's current workload, capabilities, and preferences — better assignment suggestions.
- *UX impact:* Smarter suggestions that account for what each person is already doing.

---

## Implementation Priority

Ordered by (cost savings × ease of implementation × UX improvement):

| Priority | Pattern | Primary Features Affected | Est. Savings/Family/Month | Build Effort | UX Impact |
|----------|---------|--------------------------|--------------------------|-------------|-----------|
| 1 | **P1 — Semantic Context Assembly** | All LiLa modes, Optimizer, all guided modes | $0.21 | Already specced (Addendum) | Major improvement |
| 2 | **P2 — Embedding-Based Auto-Tagging** | Journal, Tasks, Victories | $0.45 | Very low (reference table + query) | Faster tags |
| 3 | **P5 — On-Demand Secondary Output** | Optimizer, General Chat, Higgins, all guided modes | $0.15 | Low (action chip UI pattern) | Faster responses, user-paced |
| 4 | **P9 — Per-Turn Context Refresh** | General Chat, ThoughtSift, Safe Harbor, LifeLantern | $0.12 | Low (query per turn) | Dramatically better conversations |
| 5 | **P3 — Embedding Delta Detection** | Context Learning (all modes) | $0.17 | Minimal (one comparison query) | Fewer false positives |
| 6 | **P7 — Per-Member Context Caching** | AIVault tools, Cyrano, Love Languages | $0.05 | Low (cache table + invalidation) | Instant tool launch |
| 7 | **P8 — Shared Persona Library** | ThoughtSift Board of Directors | Variable (massive at scale) | Medium (table + moderation) | Instant persona selection |
| 8 | **P6 — Prompt Pattern Caching** | Optimizer, AIVault, Task Breaker, Victory | $0.08 | Low (hash + cache table) | Faster repeat patterns |
| 9 | **P4 — Smart Regeneration** | Overview Cards | $0.07 | Low (fingerprint comparison) | Fewer loading flickers |
| **Total estimated savings** | | | **~$1.30/family/month** | | |

At the $1.50/family/month AI cost target, these optimizations collectively bring the actual AI cost down to approximately **$0.20/family/month** — giving you a 7.5:1 ratio between your subscription revenue and your AI costs at even the Essential tier ($9.99). That's a very healthy margin that can absorb power users, model price fluctuations, and feature expansion without stress.

---

## Infrastructure Dependencies

All patterns P1-P4 and P9 depend on the Semantic Context Infrastructure Addendum being implemented. They are free follow-on benefits of that same pgvector investment.

P5 (On-Demand Output) is a UI/UX pattern — no infrastructure dependency.

P6 (Pattern Caching) requires one new table: `prompt_pattern_cache`.

P7 (Per-Member Context Caching) requires one new table: `member_context_cache`.

P8 (Shared Persona Library) requires the `board_personas` table defined above, plus a moderation workflow.

---

## CLAUDE.md Additions from This Document

- [ ] Life area auto-tagging uses embedding comparison, not Haiku calls. The `life_area_reference_embeddings` table contains pre-computed reference embeddings per tag. Auto-tag function: compare entry embedding → top 2-3 matches → apply as tags.
- [ ] Context learning detection uses embedding delta: compare message embedding against Archives. Only trigger Haiku scan when max similarity < threshold (genuinely new info).
- [ ] On-demand secondary output pattern: AI generates the primary deliverable only. Supplementary content (explainers, alternatives, deeper analysis) is generated on-demand via action chips. Never generate content the user didn't ask for.
- [ ] Per-turn semantic context refresh: For multi-turn guided conversations (ThoughtSift, Safe Harbor, LifeLantern, General Chat), refresh context via semantic search at each turn — don't carry stale startup context through the whole conversation.
- [ ] Shared persona library: `board_personas` table with three tiers (system_preloaded, community_generated, personal_custom). Community personas require moderation review before `is_public = true`. Blocked categories: deities as speaking personas (redirect to prayer seat), figures associated with atrocity.
- [ ] AIVault per-member context caching: Pre-assembled context bundles per member per tool type, invalidated when source Archives items change. Tools should feel instant on launch.
- [ ] Pattern caching is supplementary, not primary: Always fall back to a live AI call if no cached pattern matches. Never serve a stale cached response when the request is genuinely novel.

---

## Cross-PRD Impact

| PRD Affected | What Changes | Action Needed |
|-------------|-------------|---------------|
| PRD-05 (LiLa Core) | Per-turn semantic context refresh for all multi-turn modes. On-demand output pattern for General Chat. | Forward note in context assembly section. |
| PRD-05C (LiLa Optimizer) | On-demand explainers, prompt pattern caching, embedding delta for context learning, semantic context assembly. | Forward notes in optimization pipeline and context learning sections. |
| PRD-08 (Journal + Smart Notepad) | Embedding-based auto-tagging replaces Haiku tagging calls. Embedding-based pre-filtering for Review & Route. | Forward note in AI Integration section. |
| PRD-09A (Tasks) | Embedding-based auto-tagging on task creation. | Same pattern as journal tagging. |
| PRD-11 (Victory Recorder) | Embedding-based auto-tagging on victory recording. Semantic context for celebration text. | Forward notes in auto-tagging and AI Integration sections. |
| PRD-13 (Archives) | Smart regeneration for overview cards via embedding fingerprint. | Forward note in overview card generation section. |
| PRD-21A (AIVault) | Per-member context caching for tool types. Prompt pattern caching for templates. | Forward note when PRD is written. |
| Future: ThoughtSift PRD | Shared persona library architecture, content policy, Board of Directors design. | This document provides the data structure and cost patterns; PRD defines the full UX. |

---

*Document version: 1.0*
*Created: March 15, 2026*
*Companion to: Semantic Context Infrastructure Addendum*
*References: PRD-05, PRD-05C, PRD-08, PRD-09A, PRD-11, PRD-13, PRD-16, PRD-20, PRD-21, Faith & Ethics Framework*
