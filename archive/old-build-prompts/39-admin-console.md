# Build Prompt 39: Admin Console & Demand Validation

## PRD Reference
- PRD-32: `prds/scale-monetize/PRD-32-Admin-Console.md`
- PRD-32A: `prds/scale-monetize/PRD-32A-Demand-Validation-Engine.md`
- Addendum: `prds/addenda/PRD-32-32A-Cross-PRD-Impact-Addendum.md`

## Prerequisites
- Phase 25 (AI Vault Admin & Content Management) complete
- Phase 34 (Safety Monitoring) complete
- Phase 38 (Subscription Tier System) complete

## Objective
Build the Admin Console with 5 tabs (System, Analytics, Feedback, AI Vault, Moderation), admin user management, users/families browser, safety keyword CRUD, platform overview analytics, intelligence review (12 channels), AI cost monitoring, feedback system (glitch/feature/praise with auto-triage), "Copy for Claude Code" diagnostic block, known issues library, and the demand validation engine (PlannedExpansionCard single-prop component, feature_expansion_registry.ts config file, INSERT-only votes). This is a Large phase.

## Database Work
Create tables:
- `feedback_submissions` — User feedback records with type (glitch, feature, praise), description, auto-triage category, screenshots, resolution status
- `known_issues` — Known issues library with title, description, status (investigating, confirmed, fixing, resolved), affected features, workaround text
- `reported_threats` — Security threat reports with severity, description, investigation status
- `admin_notes` — Internal admin notes attached to users, families, or feedback items
- `ai_usage_log` — AI API usage records with model, tokens, cost, feature, timestamp for cost monitoring
- `platform_usage_log` — Platform-wide usage metrics (DAU, MAU, feature usage counts, session data)
- `feature_demand_responses` — INSERT-only vote records for demand validation (feature_key, family_id, vote_type, timestamp)

Enable RLS: admin tables restricted to admin role. Feedback submissions writable by all authenticated users, readable by admin. Demand responses are INSERT-only (no updates/deletes).

## Component Work
### Admin Console Shell
- 5-tab layout — System, Analytics, Feedback, AI Vault, Moderation tabs
- Admin authentication — Admin role gate on console access

### System Tab
- Admin user management — View, create, modify admin accounts
- Users/families browser — Search and browse all users and families with detail views
- Safety keyword CRUD — Manage safety monitoring keywords (links to Phase 34)
- Known issues library — CRUD for known issues with status tracking and workaround text
- "Copy for Claude Code" — Diagnostic block that compiles system context, user state, and error details into clipboard-ready format for developer debugging

### Analytics Tab
- Platform overview — DAU, MAU, retention, subscription metrics dashboard
- Intelligence review — 12 channels of platform intelligence (usage patterns, AI interactions, engagement, growth, etc.)
- AI cost monitoring — Real-time and historical AI API cost tracking by model, feature, and time period

### Feedback Tab
- Feedback intake — Glitch reports, feature requests, and praise submissions from users
- Auto-triage — Automatic categorization and priority assignment based on feedback type and content
- Feedback resolution workflow — Assign, investigate, resolve, respond pipeline
- Admin notes — Attach internal notes to feedback items

### AI Vault Tab
- Vault administration — Content management, analytics, and moderation for AI Vault (extends Phase 25)

### Moderation Tab
- Safety monitoring dashboard — Overview of safety flags, patterns, and actions (extends Phase 34)
- Content moderation queue — Review and act on flagged content across platform

### Demand Validation Engine
- `PlannedExpansionCard` — Single-prop React component that renders feature expansion voting UI from feature_key
- `feature_expansion_registry.ts` — Config file defining all planned expansion features with metadata
- INSERT-only votes — Users vote on desired features; votes are append-only (no changing votes)
- Demand analytics — Admin view of vote counts, trends, and feature prioritization signals

## Testing Checklist
- [ ] Admin console accessible only to admin role
- [ ] 5 tabs render and navigate correctly
- [ ] User/family browser searches and displays detail views
- [ ] Admin user management CRUD works
- [ ] Safety keyword CRUD creates, updates, and deletes keywords
- [ ] Known issues CRUD with status workflow
- [ ] "Copy for Claude Code" generates correct diagnostic block
- [ ] Platform overview analytics display accurate metrics
- [ ] 12 intelligence channels render with data
- [ ] AI cost monitoring shows accurate cost breakdown by model and feature
- [ ] Feedback submission works for all 3 types (glitch, feature, praise)
- [ ] Auto-triage categorizes feedback correctly
- [ ] Feedback resolution workflow progresses through stages
- [ ] Admin notes attach to feedback items
- [ ] PlannedExpansionCard renders from single feature_key prop
- [ ] feature_expansion_registry.ts config loads correctly
- [ ] Demand votes are INSERT-only (no UPDATE/DELETE)
- [ ] Demand analytics shows vote counts and trends
- [ ] RLS restricts all admin tables to admin role
- [ ] Feedback submissions writable by all authenticated users

## Definition of Done
- All PRD-32 and PRD-32A MVP items checked off
- Admin console operational with all 5 tabs
- User/family browser and admin management working
- Analytics dashboard with AI cost monitoring functional
- Feedback system with auto-triage and resolution workflow operational
- "Copy for Claude Code" diagnostic block generating correct output
- Known issues library with status workflow
- Demand validation engine with PlannedExpansionCard and INSERT-only votes
- RLS verified per role (update RLS-VERIFICATION.md)
- No hardcoded strings (all text extractable for i18n later)
