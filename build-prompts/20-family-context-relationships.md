# Build Prompt 20: Family Context & Relationships

## PRD Reference
- PRD-19: `prds/daily-life/PRD-19-Family-Context-Relationships.md`

## Prerequisites
- Phase 13 (Archives & Context) complete

## Objective
Build the enhanced Archives system with context prioritization for AI interactions, the guided interview flow for structured context gathering, document upload with AI summarization, private notes (mom-only with strict RLS), relationship notes for tracking dynamics between family members, monthly data aggregation (running on billing day), the alias system for alternate names/nicknames, the AI Toolbox page as a hub for AI-powered tools, and the "How to Reach Me" communication preference card per member.

## Database Work
Create tables:
- `member_documents` — Uploaded documents (PDFs, images) with AI-generated summaries, linked to members
- `private_notes` — Mom-only notes about family members, strictly RLS-protected (invisible to all other roles including View As)
- `relationship_notes` — Notes about relationships between two family members (dynamics, communication patterns, concerns)
- `guided_interview_progress` — Tracks progress through structured interview flows for context gathering (sections completed, responses)
- `monthly_data_aggregations` — Monthly rollup data computed on billing day (activity summaries, usage stats, growth metrics per member)
- `generated_reports` — AI-generated monthly/periodic reports from aggregated data

Enable RLS on all tables. Private notes have the strictest RLS: only the creating mom can access. Relationship notes are mom-only.

## Component Work
- Enhanced Archives — Extended archive interface with context prioritization controls (weight, relevance scoring)
- Guided interview — Step-by-step structured interview for gathering member context (personality, preferences, challenges, goals)
- Document upload & summarize — Upload PDFs/images; AI extracts and summarizes key information for context
- Private notes — Mom-only note-taking per family member with strict visibility enforcement
- Relationship notes — Notes on dynamics between any two family members
- Monthly aggregation display — View monthly rollup data with trends and AI-generated insights
- Alias system — Configure alternate names/nicknames per member for AI recognition
- AI Toolbox page — Hub page listing available AI-powered tools across the platform with descriptions and quick-launch
- "How to Reach Me" card — Per-member communication preference card (preferred channels, best times, communication style)

## Edge Function Work
- `summarize-document` — Processes uploaded documents and extracts key context information
- `monthly-aggregation` — Scheduled function (pg_cron on billing day) that computes monthly rollups per member
- `generate-monthly-report` — Produces AI narrative report from aggregated monthly data

## Testing Checklist
- [ ] Guided interview saves progress and produces context items on completion
- [ ] Document upload processes and generates accurate summaries
- [ ] Private notes are completely invisible to all non-mom users including View As
- [ ] Relationship notes save and are accessible only to mom
- [ ] Monthly aggregation runs and produces correct rollup data
- [ ] Alias system allows AI to recognize alternate names in conversations
- [ ] AI Toolbox page lists all available tools with working launch links
- [ ] "How to Reach Me" card displays per member and is editable

## Definition of Done
- All PRD-19 MVP items checked off
- Private notes RLS verified as strictly mom-only (not visible in View As)
- Monthly aggregation pipeline functional
- Document summarization producing useful context entries
- RLS verified per role (update RLS-VERIFICATION.md)
- No hardcoded strings (all text extractable for i18n later)
