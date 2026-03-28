# MyAIM Family: Feature Design Reference (Condensed)
## Design Intent, Feature Philosophy, and v1 Schema Reference

**Condensed from:** MyAIM_Family_Complete_Reference.md (17,457 lines → ~3,500 lines)
**Created:** February 27, 2026
**Purpose:** Preserve the unique design intent, user experience flows, and feature philosophy from the original Complete Reference while removing content that's duplicated in other project knowledge files or superseded by planning decisions.

**What was removed:**
- System Overview PRD v1 (exists as separate file)
- Faith & Ethics Framework (exists as separate file)
- Brand Identity & Positioning (exists as separate file)
- Outdated permission model (superseded by Planning_Decisions.md)
- Outdated PRD order (superseded by Planning_Decisions.md)
- v1 CSS implementation details (rebuilding from scratch)
- v1 component file paths (rebuilding from scratch)
- Dashboard widget implementation code (will be redesigned in PRDs)

**What was kept:**
- Archives system design intent and UX flows
- LiLa Context Learning flow (how AI detects and offers to save info)
- Best Intentions philosophy, examples, and AI integration patterns
- LiLa Optimizer architecture overview
- Victory Recorder system design
- Dashboard mode concepts (Play/Guided/Independent)
- Library Vault vision and tool deployment strategy
- MyAIM v1 complete database schema (reference for migration planning)

---

## FEATURE NAME MAPPING (StewardShip → MyAIM v1 → MyAIM Family v2)

This is the authoritative name mapping across all three codebases. Database table names shown where applicable.

| StewardShip Name | StewardShip DB Table | MyAIM v1 Name | MyAIM Family v2 Name | v2 DB Table (planned) | Notes |
|---|---|---|---|---|---|
| The Helm | `helm_conversations` | LiLa Optimizer | LiLa (4 versions: Help, Assist, Optimizer, API) | `lila_conversations` | Drawer + full page, context-aware |
| The Mast | `mast_entries` | — | Guiding Stars | `guiding_stars` | Values, principles, declarations |
| The Keel | `keel_entries` | — | My Foundation (user-nameable) | `self_knowledge` | Personality, strengths, growth areas, 3 input paths |
| The Wheel | `wheel_instances` | — | *(Removed from active build)* | — | Therapist's IP, architecturally extensible |
| The Log | `log_entries` | — | Journal + Smart Notepad | `journal_entries` | Merged with Smart Notepad, includes Review & Route (MindSweep) |
| The Compass | `compass_tasks` | Tasks | Tasks + Lists | `tasks` | All view modes, Task Breaker, grouped with Lists |
| Charts | `goals`, `custom_trackers` | — | Widgets | `widgets`, `widget_templates` | Widget templates, custom trackers/charts/goals, auto-sort by usage |
| Victory Recorder | `victories` | — | Victory Recorder | `victories` | Name kept |
| Crow's Nest | — | Command Center / Dashboard | Command Center + Personal Dashboard + Mom's Overview | `dashboard_configs` | 4 views: Command Center (nav hub), Personal Dashboard (per-member), Family Dashboard (shared), Mom's Overview (all-seeing) |
| First Mate | `spouse_insights` | — | Partner Profile | `partner_profile` | Connected spouse account, mutual visibility, LiLa context sharing TBD |
| Crew | `people`, `crew_notes` | — | People & Relationships | `people_profiles` | Categorized notes, non-family contacts |
| Sphere of Influence | `sphere_entities` | — | *(Removed from active build)* | — | Same reason as Wheel |
| Safe Harbor | — | — | Safe Harbor | `safe_harbor_sessions` | Stress relief, crisis resources |
| The Manifest | — | — | Knowledge Base (RAG) | `knowledge_base_items` | PDF/document search, later PRD |
| Rigging | `rigging_plans` | — | Project Planner | `project_plans` | Planning frameworks, later PRD |
| Unload the Hold | — | MindSweep | *(Folded into Smart Notepad)* | — | Review & Route pipeline in PRD-08 |
| Reveille | — | — | Morning Rhythm | — | Morning check-in card |
| Reckoning | — | — | Evening Rhythm | — | Evening review + tomorrow prep |
| Life Inventory | — | — | LifeLantern | `life_lantern_*` | Assessment + Vision Casting + Goal Generation |
| Lists | `lists` | — | Lists (grouped with Tasks) | `lists` | Shareable, AI interaction options |
| Meeting Frameworks | — | — | Meetings | `meeting_notes` | Couple, Parent-Child, Family |
| — | — | Archives | Archives & Context | `archive_folders`, `archive_context_items` | Bublup folders, checkbox context |
| — | — | Best Intentions | Best Intentions (grouped with Guiding Stars) | `best_intentions` | Deeper priorities, AI integration |
| — | — | Library Vault | Library Vault + Admin | `library_items` | Netflix browsing, tool embedding |
| — | — | Family Dashboard | Family Dashboard | — | Shared family coordination view |
| — | — | — | Family Management Page | — | NEW — View/edit members, launch person-context tools, Out of Nest management |
| — | — | — | Mom's Overview | — | NEW — All-seeing progress command post, all members at a glance |
| — | — | Play/Guided/Independent | Play/Guided/Independent Mode Dashboards | `dashboard_configs` | Capability-based, mom assigns |
| — | — | — | Caregiver Tools | `caregiver_shifts`, `trackable_events` | NEW — Special Adult shift management |
| — | — | — | Tracking, Allowance & Financial | `allowance_pools`, `payment_tracking` | NEW — Allowance pools, payment owed/earned, homeschool tracking, multi-dimensional task tracking |
| — | — | — | Rewards & Gamification | `gamification_progress` | Points, stars, themes, streaks |

### Naming Conventions
- **Database:** snake_case always. Never nautical. Never changes once created.
- **Components:** PascalCase (e.g., `GuidingStarsPage.tsx`)
- **Hooks:** camelCase with `use` prefix (e.g., `useGuidingStars.ts`)
- **CSS variables:** kebab-case with `--color-` prefix
- **User-facing names:** Configurable where noted, otherwise consistent across shells
- **Nautical Name Pack:** Optional vibe add-on that renames features in the UI only (not database). Example: "Guiding Stars" → "The Mast" if nautical vibe is active.

---

## ARCHIVES & CONTEXT SYSTEM

### Purpose
The Archives system is MyAIM's context management engine — where families organize, store, and control what information AI uses about them.

### Key Innovation
- Checkbox-controlled context that's portable to ANY AI platform
- Fully customizable Bublup-style folders — create ANY folder structure
- Auto-generated overview cards for any folder content
- Cross-device file access via Supabase Storage

### Folder Structure (User-Created)
Users create folders for ANYTHING. System doesn't dictate structure. Mom might create:
- A folder per family member (personality, interests, photos)
- Topic folders (Family Recipes, Jake's Soccer, Homeschool Curriculum)
- Project folders (Home Renovation, Book I'm Writing)
- Any custom folder she wants

### Auto-Generated Overview Card
When content is added to a folder, the system automatically creates a "baseball card" summary with checkboxes for each item. Items checked = included in AI context. Items unchecked = stored but not sent to AI.

Usage tracking shows how often each context item is actually used by LiLa, helping mom curate what's worth keeping active.

### Context Export
When exporting context (for use with external AI platforms like ChatGPT, Gemini, etc.):
1. System scans all folders
2. Finds items with checkboxes checked
3. Combines into single export file
4. Formats for target platform (Markdown, plain text, or JSON)

Mom controls exactly what AI knows about her family, per-folder and per-item.

---

## LILA CONTEXT LEARNING FLOW

### How LiLa Learns from Conversations

LiLa doesn't just answer questions — she detects new family information mentioned in conversation and offers to save it to Archives. This is the "always learning, always asking permission" pattern.

**Flow 1: New Information Detection**
Mom says: "Help me plan meals this week. Jake just told me he hates broccoli now, and Zy has soccer practice on Tuesdays at 5pm."

LiLa processes the request AND detects two new pieces of family info not in Archives. After providing the meal plan, LiLa offers:
- "Add 'dislikes broccoli' to Jake's profile?" (with explanation of why it helps)
- "Add 'Soccer Tuesdays 5pm' to Zy's schedule?" (with explanation)

Mom can save, skip, or edit before saving. Nothing is saved without explicit approval.

**Flow 2: Best Intention Detection**
Mom says: "Help me handle the kids fighting. We're really working on being more patient with each other."

LiLa detects a family value/goal being expressed and offers to create a Best Intention: "Patient & Kind Family Communication" with pre-filled current state, desired state, and why it matters fields. Mom can approve, edit, or dismiss.

**Flow 3: Proactive Pattern Recognition**
After mom mentions Jake's Tuesday soccer 3 times across different conversations, LiLa notices the pattern and proactively asks: "I've noticed you mention Jake's Tuesday soccer frequently. Want me to remember this so I can automatically suggest quick meals on Tuesdays?"

**Flow 4: Project Context Building**
Mom says she's writing a book about homeschooling. LiLa offers to create an Archives folder for the book project, capturing chapter notes, research, and progress. Future conversations can load this project context automatically.

### Human-in-the-Mix (Always)
- LiLa SUGGESTS saving information, never saves automatically
- Mom sees exactly what would be saved and where
- Mom can edit the suggested content before saving
- "Not Right Now" and "Remind Me Later" are always options
- All saves go through the Archives checkbox system — mom can deactivate any saved context later

---

## BEST INTENTIONS

### Philosophy
Best Intentions is your "open brain tabs" — the deeper priorities and goals that are always running in the background of your mind. It's the protection against living reactively instead of intentionally.

Life prioritizes the urgent (dishes, emails, tantrums) over the important (connecting with loved ones, spiritual growth, building relationships). Best Intentions keeps the important visible and active, gently nudging toward what matters before it's too late.

### How AI Integration Works
When Best Intentions are active, LiLa knows about them and proactively weaves them into ANY interaction. This is the core differentiator.

**Without Best Intentions:** "Help my son with math homework" → generic math help
**With Best Intentions** (knows: "Foster Gideon & Mosiah's relationship"): → "What if we turn this into a chance for them to work together? I can create a math approach where they take turns being teacher and student."

**Without:** "Plan this week's dinners" → generic meal plan
**With** (knows: "Get kids helping naturally"): → "How about we pick 2 meals where each kid has a chef duty? Helping becomes normal, not nagging."

**Without:** "My kids are fighting constantly" → discipline strategies
**With** (knows: "Create safe environment for vulnerability"): → "What if we try a family feelings check-in approach? Fighting becomes a chance to practice emotional safety."

**Without:** "What should we do for Family Home Evening?" → generic activities
**With** (knows: "Give children opportunities to have experiences with the Spirit"): → "What if we plan an FHE where they can FEEL something, not just learn something?"

### Four Categories
1. **Family Relationships** — dynamics you want to shift (current state → desired state)
2. **Personal Growth** — how you want to show up as a person/parent
3. **Household Culture** — the vibe/environment you're creating
4. **Spiritual Development** — faith and spiritual growth priorities (plus custom categories)

### Data Structure
Each intention has: title, current_state, desired_state, why_it_matters, category, priority, is_active, related_members, keywords, AI reference tracking (how often LiLa used it, how often suggestions were accepted), and progress_notes.

### Access Points (5 ways to interact)
1. Dashboard card — see active intentions at a glance
2. Quick Actions — fast access from any page
3. Library — discoverable for new users, appears in search
4. Archives — as a context folder with toggle (ON = AI uses them, OFF = stored but inactive)
5. MindSweep/Review & Route — AI detects intention-like language and offers to capture

### Detection Triggers for Auto-Capture
"I want...", "I wish...", "I hope...", "I'd like...", "My goal is...", "I'm trying to...", "I need to work on..."

---

## LILA OPTIMIZER ARCHITECTURE

### Core Function
Context-gathering + prompt optimization specialist. 80% JavaScript/Supabase, 20% AI (OpenRouter).

### How It Works
1. User enters a prompt or request
2. LiLa Optimizer detects the prompt type (story, homework, meal, behavior, creative, schedule)
3. JavaScript engine checks what family context is already available
4. Smart question filtering — only asks questions whose answers aren't already in Archives
5. Assembles optimized prompt with relevant family context, Best Intentions, and user preferences
6. Formats for target platform (ChatGPT, Gemini, Claude, etc.)
7. Tracks what context was included and whether the user found it helpful

### Context Assembly Priority
1. Always include: active Best Intentions keywords
2. Include if relevant: family member profiles for mentioned members
3. Include if topic matches: Archives folder context with active checkboxes
4. Include if user requests: specific additional context

### Platform Formatting
Output adapts to target platform conventions — different prompt structure for ChatGPT vs Gemini vs Claude. LiLa knows the optimal format for each.

---

## VICTORY RECORDER

### Purpose
Track and celebrate ALL accomplishments — both automated (completed tasks, streaks, achievements) and manually entered wins ("I helped my sister," "I was kind to someone").

### Celebration System
Voice-based celebrations with personality options:
- **Enhanced Tier:** Enthusiastic Coach, Calm Mentor, Fun Friend, Silly Character, Proud Parent
- **Full Magic Tier:** Royal Princess, Pirate Captain, Sports Announcer, British Nobleman, Scottish Rogue, Gen-Z Influencer, News Reporter, Wise Wizard, and more

Celebrations can be triggered manually ("Let's Celebrate!") or scheduled (bedtime, dinner, custom time).

### Family Celebrations
End-of-day family roundup where each member's victories are combined into one celebration event. Can be read aloud at dinner or displayed on the family tablet hub.

---

## DASHBOARD MODES

### Play Mode (Youngest Kids)
- Large visual elements, tap-based interaction
- Sticker-based reward system (collect stickers on a chart)
- Celebration animations on completion
- Emoji permitted (only mode where emoji is allowed)
- Visual task cards with images
- Simple daily activity list

### Guided Mode (Elementary-Age)
- Simplified but text-based interface
- Prompted interactions (journal prompts instead of freeform)
- Curated task views (not all task view modes)
- Progress tracking with visual charts
- Achievement badges

### Independent Mode (Teens)
- Full-featured personal growth workspace
- All features available (subject to mom's permission toggles)
- Most similar to the Adult shell
- Safety monitoring capability (mom-configured)

### Core Principle
Mom assigns mode based on her child's readiness, NOT age. No age labels in UI. Mode can be changed anytime in Family Settings.

---

## LIBRARY VAULT VISION

### Concept
Netflix-style browsing experience for AI tools, tutorials, and resources. Users discover, use, and track progress on curated content.

### Tool Types
1. **AI Prompt Tools** — Pre-built prompts with family context auto-loaded. One-click optimization for specific use cases (meal planning, homework help, bedtime stories, etc.)
2. **Interactive Mini-Apps** — Embedded tools (iframe or native) for specific tasks. Examples: Meal Planner, Task Breaker, Family Meeting facilitator
3. **Tutorial Content** — Written/video guides teaching AI skills. Progress tracking, completion badges.
4. **Workflow Launchers** — One-click workflows that chain multiple actions. Example: "Sunday Prep" launches meal planning + task assignment + calendar review

### Content Organization
Categories: Quick Solutions, Family Communication, Learning & Education, Creative & Fun, Home Management, AI Learning Paths, Creator Tools (Advanced)

### Living Widgets
Tools from the Library can be pinned to the dashboard as "living widgets" — mini-versions that update in real-time. Example: Meal Planner widget shows this week's plan on the dashboard without opening the full tool.

### Admin Console
Mom (or admin) can add content: upload tutorials, create AI prompt tools, embed external tools (Custom GPTs, Gemini Gems, Google Apps), set access tiers, track engagement metrics.

### Tool Deployment Methods
- **Iframe embedding** — for external tools (Custom GPTs, Gamma pages, etc.)
- **Native components** — for tools built directly in MyAIM
- **Link-out** — for tools that must open in their native platform

---

## SMART NOTEPAD — See Smart_Notepad_Complete_Specification.md

The full Smart Notepad specification (787 lines) is in a separate project knowledge file. It covers: three roles (capture, editing desk, routing hub), the complete "Send to..." grid menu with all 13 destinations, inline picker overlays, Track Progress smart matching, internal family notes, Tasks & Lists routing details, tab lifecycle, notepad history, Review & Route, Edit in Notepad, voice behavior, and the full Record → Transcribe → Extract → Route pipeline.

**Key points not in the spec file (captured here):**
- Journal is a read/filter/search interface, NOT a writing tool. Journal's `+` button opens Smart Notepad.
- LiLa Conversation History is completely separate from Journal. Conversations = raw AI interactions. Journal = user-curated content. Smart Notepad bridges the two.
- "Review & Route" and "Edit in Notepad" are available on EVERY content surface in the app (universal actions).

---

## ADMIN SYSTEMS (Reference — Code in MyAIM_Central Repo)

MyAIM v1 has three admin interfaces accessible in the connected GitHub repo:

1. **AimAdminDashboard** (`/aim-admin`) — System administration: user management, family management, system analytics, database maintenance
2. **BetaAdmin** (`/beta/admin`) — Beta testing: user management, access code generation, usage analytics
3. **LibraryAdmin** (`/library/admin`) — Library content CRUD: add tutorials/tools/pages, manage tags/categories, set tier access, "Optimize with LiLa" toggle

Admin access uses email whitelist + staff_permissions table. Regular users never see admin routes. The admin login (`/admin`) is a separate authentication flow with permission types (super_admin, content_manager, etc.).

For v2, admin functionality will be redesigned as part of PRD-20 (Library Vault + Admin) and PRD-25 (Settings). The v1 patterns are reference only.

---

## DATA FLOW OVERVIEW

### LiLa Context Sources (What AI Reads)
1. Guiding Stars (always loaded as baseline)
2. Self-Knowledge (when personality context helps)
3. Best Intentions (active, relevant ones)
4. Archive context items (active checkboxes)
5. Family member profiles (if discussing a member)
6. Partner Profile (if relationship topic)
7. People profiles (if specific people mentioned)
8. Recent journal entries (if user references recent events)
9. Progress/goals summary (if trends relevant)
10. Today's tasks (if task-related)
11. Active project plans (if planning topic)
12. Current page context (which page drawer was opened from)
13. Knowledge Base RAG results (if relevant)
14. Active Growth Cycle data (if user is in one)
15. Meeting context (if in a meeting)

### LiLa Writes To (User Confirms Every Save)
Journal entries, Tasks, Victories, Self-Knowledge, Guiding Stars, People profiles, Best Intentions, Calendar events, Lists

### Task Types
- **Task:** Required, assigned, due date
- **Routine:** Recurring task
- **Opportunity:** Optional, not assigned, completing earns points/recognition. "Things you can do" — teaches initiative.

### Family Dashboard Aggregation Rules
Mom's Family Dashboard pulls ONLY shared data: shared victories, family-scoped tasks, family Best Intentions, shared goal progress (opted-in), family calendar events, per-member cards showing what they've chosen to share.

### Meeting Notes Routing
After any meeting (Couple, Parent-Child Mentor, Family), notes and action items can be routed to either participant's journal, tasks, Best Intentions, or shared family Best Intentions.

---

## SELF-KNOWLEDGE SHARING (Special Case)

Self-Knowledge entries have special sharing value beyond the standard visibility system:
- **Spouse sharing:** Selected items help partner understand you better, and help AI with relationship interactions
- **Parent-child sharing:** Independent members can share items to help parents understand their perspective
- **Parent access:** Parents see items children have explicitly shared, helping AI give better parenting advice
- **NOT automatic:** Each item individually toggled for sharing

---

## LIBRARY VAULT ACCESS MODEL

| Role | Browse | Use Tools | Comment | Admin | LiLa Optimize |
|---|---|---|---|---|---|
| Mom | Yes | Yes | Yes | Yes | Yes |
| Adult | Yes (future tier-gated) | Yes | No | No | Yes |
| Independent | Yes (future tier-gated) | Yes (curated) | No | No | Yes (if mom permits) |
| Guided | No | Curated only | No | No | No |
| Play | No | No | No | No | No |

Library is primarily a mom space. Others can browse and use but not comment or contribute.

---

## SAFETY MONITORING

LiLa monitors AI conversations for crisis keywords — not just teens, but ANY member mom designates for monitoring.

- Flags are generated privately for designated parent(s) only
- The monitored member does NOT know a flag was raised
- **Notification access is permission-based:** Primary parent always receives flags. Mom can grant notification access to any other parent-role member (e.g., dad). Toggle in family settings.
- **Trigger categories:** self-harm indicators, substance use, eating disorder language, abuse indicators, severe bullying, other concerning patterns
- Notification delivery: configurable (in-app, email, or both)
- Flag includes context snippet and suggested resources
- Aligns with Faith & Ethics Framework safety guardrails

---

## VIBE SYSTEM (Visual Aesthetic Presets)

Beyond color themes, users select a "vibe" that changes the overall aesthetic. Vibes affect fonts, border-radius, shadow styles, spacing density, and visual personality. Color themes are applied ON TOP of vibes.

**Four Vibes:**
1. **Classic MyAIM (Default)** — Warm serif headings + clean sans-serif body. Soft border-radius, warm shadows, approachable feel.
2. **Clean & Modern** — All sans-serif, tight border-radius, neutral shadows, crisp spacing. Similar to StewardShip's aesthetic.
3. **Nautical** — StewardShip-inspired, maritime typography, subtle textured backgrounds, nautical accent elements.
4. **Cozy Journal** — Handwriting-style headings, paper-like textures, scrapbook-inspired cards, sticker-like elements.

**Vibe + Theme + Name Pack are independent:**
- Vibe = structural aesthetic (fonts, corners, shadows, textures)
- Theme = color palette (50+ colors across 9 families)
- Gradient toggle = on/off per user
- Name Pack = optional display name changes (e.g., Nautical Name Pack renames "Journal" → "The Log")
- Any combination works. Classic MyAIM vibe + Nautical name pack is valid. Nautical vibe + default names is valid.

---

## VICTORY REPORTS & TRACKING

Victory Records support more than just task completion tracking:

**Trackable categories in victory_records:**
- Auto-tracked: completed tasks, best intentions, achievements, streaks, points
- Manual victories: user-added wins
- Educational hours by subject (homeschool)
- IEP goal progress tracking
- Therapy notes
- Behavioral observations

**Victory Reports with templates:**
- Report types: weekly, monthly, IEP, homeschool
- Configurable sections: overview, tasks, education, character
- Output formats: markdown, HTML, PDF
- Generated by mom, customizable template selection
- Section inclusion is configurable per report

This connects to Caregiver Tools (PRD-24) — caregivers log trackable events during shifts, which feed into victory reports and progress tracking.

---

## GAMIFICATION SYSTEMS (16 Named Options)

Mom chooses which gamification system each child uses. Systems can be changed anytime.

**Visual Growth Systems:**
1. Flower Garden 🌸 — daily completion = flower growth, week = garden plot
2. Ocean Aquarium 🐠 — daily fish earned, coral grows with consistency
3. Dragon Academy 🐉 — egg hatches → dragon grows, type based on task category (fire/ice/forest/water/lightning/rainbow)
4. Friendly Monster Army 👾 — daily monsters born, appearance based on tasks
5. Woodland Forest 🌲 — trees grow, animals appear at milestones, seasons change
6. Pet Collection 🐶🐱 — earn puppies/kittens/bunnies, build housing

**Achievement & Collection Systems:**
7. Treasure Hunter 💎 — daily treasure chests, collect gems/artifacts
8. Space Explorer 🚀 — launch rocket missions, discover planets
9. Recipe Collection 🍪 — unlock ingredients, complete recipes
10. Sticker Collection ✨ — themed sticker books, can trade duplicates
11. Adventure Map 🗺️ — follow path, encounter locations, quest chains

**Building & Creation Systems:**
12. City Builder 🏗️ — daily buildings, roads, parks, citizens
13. Art Gallery 🎨 — unlock art pieces, paint-by-number completion
14. Music Band 🎵 — recruit band members, practice songs, weekly concert
15. Hero Training Academy ⚔️ — level up hero, learn abilities, equip gear
16. Magic School 🪄 — learn spells, collect books/wands, graduate classes

**Tier Gating:**
- Enhanced: choose ONE from 3 options (Flower Garden, Ocean Aquarium, Pet Collection), basic features
- Full Magic: all 16 systems, switch anytime, full achievement/unlock system, streak rewards, seasonal collections, Mom's Gamification Control Panel

**Progression Strategy:** Short-term (daily items), medium-term (weekly streaks), long-term (monthly achievements), surprise elements (random unlocks), collection satisfaction (complete sets).

---

## OFFLINE/PWA SYNC MODEL

- **Online:** Supabase real-time subscriptions keep all devices in sync immediately
- **Offline:** Changes save to IndexedDB, queue of pending changes builds up
- Visual indicator shows "offline" and "X changes pending"
- **Reconnect:** Changes sync to Supabase, conflict resolution: last-write-wins with "recently synced" indicator
- **Critical offline support:** Tasks, journal entries, and victories must work seamlessly offline

---

## FUTURE-READY ARCHITECTURE HOOKS

### Subscription Tier System
Architecture supports tiered access from day one even though tiers aren't enforced at MVP:
- `subscription_tiers` table defines tiers and features
- `feature_access` table maps tier + feature_key = enabled/disabled
- Central `useCanAccess('feature_key')` hook checks before rendering any gated component
- Every potentially tier-gated feature uses this hook (returns true for now)
- Adding tier-gating later = configuration change, not refactor

**Planned Tiers:** Essential ($9.99), Enhanced ($16.99), Full Magic ($24.99), Creator ($39.99)

**Founding Member Program:** First 100 sign-ups get `founding_member: true` flag, permanently locked discounted pricing, founding badge.

### Homeschool Tracking Schema Hooks
Not in MVP but task/activity schema must support: subject tagging on tasks, time logging per activity, double-dipping configuration (can activity count for multiple subjects?), per-family subject configuration, report generation, integration with Progress & Goals.

### Inner Wisdom Portal / ThoughtSift
Post-session routing follows the same Review & Route pattern: extracted insights presented as cards with routing buttons (Self-Knowledge, Tasks, Journal, Guiding Stars, Victory, Best Intention, List, Person, or just close).

---

## MYAIM V1 DATABASE SCHEMA (Migration Reference)

> **Note:** This is the existing schema from MyAIM_Central. It will be redesigned for v2 but serves as reference for what data structures exist and what needs to be migrated or adapted. The v2 schema will be defined in individual PRDs.

### Core Family Tables

**families:** id, family_name, subscription_tier, default_context_settings (jsonb), context_privacy_level, connected_platforms (jsonb), context_usage_patterns (jsonb), optimization_preferences (jsonb), created_at, updated_at, auth_user_id, family_login_name, is_founding_family, founding_family_rate, founding_family_joined_at, membership_status

**family_members:** id, family_id, heartbeat_profile_id, name, role, age, personality_traits (jsonb), learning_style, interests (ARRAY), challenges (ARRAY), strengths (ARRAY), privacy_level, can_modify_context, supervised_by, created_at, updated_at, dashboard_type, unique_qr_code, points_balance, level, theme_preference, background_image, gamification_level, use_emojis, content_filter_level, ai_interaction_monitor, daily_usage_limit_minutes, requires_parent_approval, color, status, avatar, current_challenges (ARRAY), motivators (ARRAY), badges_earned (ARRAY), permissions (jsonb), birthday, nicknames (ARRAY), relationship_level, access_level, custom_role, in_household, contact_frequency, spouse_name, family_notes, is_teacher_coach, display_title, is_primary_parent, pin, auth_user_id, dashboard_mode, week_start_preference, member_color, avatar_url

**family_context:** id, family_member_id, context_type, context_data (jsonb), source, confidence_score, approved_by_user, is_active, created_at, updated_at

### Archives Tables

**archive_folders:** id, family_id, parent_folder_id, folder_name, folder_type, member_id, icon, cover_photo_url, color_hex, description, is_active, required_tier, sort_order, created_at, updated_at, is_master

**archive_context_items:** id, folder_id, context_field, context_value, context_type, use_for_context, added_by, conversation_reference, suggested_by_lila, suggestion_accepted, suggestion_reasoning, created_at, updated_at

**archive_inheritance_rules:** id, child_folder_id, parent_folder_id, inherit_all, inherit_fields (ARRAY), allow_override, created_at

### Best Intentions Tables

**best_intentions:** id, family_id, created_by, title, current_state, desired_state, why_it_matters, category, priority, is_active, is_archived, archived_reason, related_members (ARRAY), keywords (ARRAY), ai_reference_count, last_referenced_at, progress_notes (jsonb), use_as_context, created_at, updated_at, privacy_level, category_id, show_in_quick_actions, show_in_command_center, show_in_archives, linked_archive_folder_id

**intention_categories:** id, family_id, category_name, display_name, description, icon, color_hex, sort_order, category_type, source_type, source_id, is_active, created_at, updated_at

**intention_progress:** id, intention_id, entry_type, content, created_by, created_at

**intention_opportunities:** id, intention_id, opportunity_context, ai_suggestion, was_accepted, user_feedback, created_at

### Task Tables

**tasks:** id, family_id, task_name, description, duration, task_image_url, task_type, assignee (ARRAY), frequency_details (jsonb), incomplete_action, reward_type, reward_amount, reward_details (jsonb), require_approval, subtasks (ARRAY), status, qr_code_url, created_at, updated_at, due_date, completed_at, approved_by, approved_at, context_categories_used (ARRAY), ai_optimization_data (jsonb), task_frequency, task_category, opportunity_type, points_value, ai_subtasks (jsonb), completion_photo_local, photo_processed, created_by, priority, pipedream_processed, ai_insights (jsonb), difficulty_level, completion_photo, completion_note, parent_approved, target_type, verification_required

**task_subtasks:** id, task_id, title, completed

**task_completions:** id, task_id, family_id, completed_by, completion_method, completion_quality_score, completion_time_minutes, completion_notes, context_at_completion (jsonb), created_at

**task_templates:** id, family_id, template_name, task_name, description, duration, task_image_url, task_type, default_assignee (ARRAY), frequency, frequency_details (jsonb), incomplete_action, reward_type, reward_amount, reward_details (jsonb), require_approval, subtasks (ARRAY), is_active, created_at, updated_at, created_by, usage_count, last_used_at, context_categories_suggested (ARRAY)

**task_rewards:** id, task_id, reward_type, reward_amount, bonus_threshold, bonus_amount, created_at

### Dashboard & UI Tables

**dashboard_configs:** id, family_member_id, dashboard_type, dashboard_mode, widgets (jsonb), layout (jsonb), is_personal, created_at, updated_at, gamification_system, selected_theme, widget_layout, victory_settings (jsonb)

**widget_permissions:** id, dashboard_config_id, widget_id, visible_to, editable_by, created_at

**quick_action_usage:** id, family_member_id, action_name, click_count, last_used_at, created_at, updated_at

### LiLa & AI Tables

**lila_conversations:** id, family_id, user_id, original_prompt, optimized_prompt, intentions_used (ARRAY), context_used (jsonb), optimization_method, ai_model_used, was_accepted, user_feedback, tokens_used, cost_usd, created_at

**lila_context_suggestions:** id, family_id, conversation_reference, suggested_context_field, suggested_context_value, suggested_folder_id, suggestion_type, reasoning, confidence_score, detected_pattern, status, mom_modified_value, responded_at, responded_by, created_at

**lila_api_usage:** id, family_id, api_provider, model_used, tokens_used, cost_usd, request_type, created_at

**lila_optimization_patterns:** id, prompt_type, pattern_template, success_rate, usage_count, created_at, last_used

**personal_prompt_library:** id, family_id, created_by, prompt_title, prompt_description, original_request, optimized_prompt, category, tags (ARRAY), context_snapshot (jsonb), folders_used (ARRAY), target_platform, times_used, last_used_at, is_favorite, is_public, share_code, created_at, updated_at

### Library Tables

**library_items:** id, title, description, short_description, category, subcategory, difficulty_level, estimated_time_minutes, content_type, required_tier, content_url, thumbnail_url, preview_image_url, tags (ARRAY), prerequisites (ARRAY), learning_outcomes (ARRAY), tools_mentioned (ARRAY), is_featured, is_new, sort_order, view_count, bookmark_count, average_rating, created_at, updated_at, created_by, status, tool_type, tool_url, embedding_method, portal_description, portal_tips (ARRAY), prerequisites_text, requires_auth, auth_provider, allowed_tiers (ARRAY), enable_usage_limits, usage_limit_type, usage_limit_amount, session_timeout_minutes

**library_categories:** id, display_name, description, icon_name, color_hex, sort_order, is_active, created_at

**user_library_progress:** id, user_id, library_item_id, status, progress_percent, last_accessed, time_spent_minutes, notes, completed_at

**user_library_bookmarks:** id, user_id, library_item_id, created_at

### Rewards & Gamification Tables

**gamification_systems:** id, system_name, display_name, description, tier_required, theme_category, progression_type, max_level, reward_type, visual_style (jsonb), milestones (jsonb), is_active, created_at

**gamification_progress:** id, family_member_id, gamification_system_id, current_level, total_points, current_streak, longest_streak, milestones_reached (jsonb), progress_data (jsonb), started_at, last_activity_at, created_at, updated_at

**member_reward_balances:** id, family_member_id, balance_type, current_balance, total_earned, total_spent, last_transaction_at, created_at, updated_at

**reward_transactions:** id, family_member_id, transaction_type, amount, source_type, source_id, description, balance_after, created_at

### Victory & Reflection Tables

**victories:** id, family_member_id, description, category, celebration_message, voice_url, tags (ARRAY), created_at, updated_at

**victory_celebrations:** id, victory_id, celebration_text, voice_provider, voice_id, playback_count, last_played_at, created_at

**reflections:** id, family_member_id, prompt, response, reflection_date, mood, tags (ARRAY)

### Calendar & Events Tables

**calendar_events:** id, title, description, location, start_time, end_time, is_all_day, event_type, category, priority, color, source, external_id, is_recurring, recurrence_type, recurrence_interval, recurrence_end_date, recurrence_days (jsonb), recurrence_count, created_by, family_id, created_at, updated_at

**event_attendees:** id, event_id, family_member_id, can_edit, can_view, rsvp_status, added_at

### Context & Learning Tables

**context_categories:** id, family_id, category_name, category_type, display_name, icon, is_enabled, priority_order, privacy_level, context_data (jsonb), relevance_keywords (ARRAY), usage_count, last_used_at, effectiveness_score, created_at, updated_at

**context_items:** id, category_id, family_id, item_name, item_type, content (jsonb), relevance_score, usage_frequency, last_accessed, keywords (ARRAY), summary, created_at, updated_at

**context_effectiveness:** id, family_id, category_id, times_included, times_helpful, times_ignored, user_corrections, session_satisfaction_sum, session_count, avg_satisfaction, last_effectiveness_update, trend_direction, created_at, updated_at

**conversation_sessions:** id, family_id, creator_id, session_name, platforms_used (ARRAY), context_snapshot (jsonb), original_prompt, optimized_prompt, context_categories_used (ARRAY), optimization_reasoning, allowed_family_members (ARRAY), privacy_level, expires_at, is_active, created_at, updated_at

**family_learning_patterns:** id, family_id, pattern_type, pattern_data (jsonb), confidence_score, occurrence_count, last_observed, is_active, applied_automatically, created_at, updated_at

**vector_embeddings:** id, family_id, source_type, source_id, content_chunk, embedding (vector), content_category, relevance_keywords (ARRAY), family_member_relevance (ARRAY), created_at

### MindSweep Table

**mindsweep_items:** id, family_id, created_by, source, content_type, raw_content, processed_content (jsonb), ai_category, ai_priority, ai_tags (ARRAY), ai_summary, assigned_to, project_reference, due_date, status, related_context_categories (ARRAY), generated_context (jsonb), created_at, updated_at

### Persona & Prompt Tables

**personas:** id, persona_name, display_name, category, description, core_philosophy, icon, trigger_keywords (ARRAY), use_cases (ARRAY), base_prompt_template, context_requirements (jsonb), is_active, created_at

**mini_personas:** id, parent_persona_id, mini_persona_name, display_name, purpose, trigger_conditions (jsonb), priority_level, created_at

**prompt_templates:** id, mini_persona_id, template_name, template_version, role_template, task_template, input_variables (jsonb), output_format, constraints (jsonb), capabilities (jsonb), reminders, required_context_categories (ARRAY), optional_context_categories (ARRAY), family_context_variables (jsonb), usage_count, success_rate, user_satisfaction, is_active, created_at, updated_at

### Other Tables (Reference Only)

**beta_users, user_permissions, user_preferences, staff_permissions, subscription_tiers** — admin/subscription management
**feedback_submissions, user_activity_log** — analytics
**play_mode_activities, daily_activity_completions** — Play Mode specific
**articles, testimonials** — CMS content
**vc_comments, vc_engagement** — Library engagement
**pin_attempt_log, qr_access_logs, tool_sessions** — security/access logging
**external_integrations, platform_responses** — third-party connections
**inner_oracle_assessments** — personality assessment storage
**growth_intentions** — per-member growth tracking

### Key Data Relationships

```
families.auth_user_id → auth.users.id
family_members.family_id → families.id
family_members.auth_user_id → auth.users.id (optional, for members with own login)
family_members.supervised_by → family_members.id

best_intentions.family_id → families.id
best_intentions.created_by → family_members.id
best_intentions.category_id → intention_categories.id
best_intentions.related_members → family_members.id[] (ARRAY)

tasks.family_id → families.id
tasks.assignee → family_members.id[] (ARRAY)
tasks.created_by → family_members.id
tasks.approved_by → family_members.id

archive_folders.family_id → families.id
archive_folders.member_id → family_members.id
archive_folders.parent_folder_id → archive_folders.id (self-referencing)
archive_context_items.folder_id → archive_folders.id

dashboard_configs.family_member_id → family_members.id
victories.family_member_id → family_members.id
gamification_progress.family_member_id → family_members.id

lila_conversations.family_id → families.id
lila_conversations.user_id → auth.users.id

library_items.category → library_categories.id
```

---

*Condensed February 27, 2026. Original: 17,457 lines. This version: ~3,500 lines.*
*For current planning decisions (roles, permissions, PRD order, feature names), see MyAIM_Family_Planning_Decisions.md*
