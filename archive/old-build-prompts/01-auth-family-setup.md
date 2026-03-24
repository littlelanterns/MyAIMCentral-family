# Build Prompt 01: Auth & Family Setup

## PRD Reference
- PRD-01: `prds/foundation/PRD-01-Auth-Family-Setup.md`

## Prerequisites
- Phase 00 (Project Setup) complete
- Supabase project created with auth enabled
- Vite + React project scaffolded

## Objective
Build the complete authentication and family setup system. Account creation (mom-first), family member management, PIN/visual password auth, tablet hub, member invitations.

## Database Work
Create tables:
- `families` — Core family record with login name, timezone, tablet config
- `family_members` — Individual members with role, avatar, PIN, visual password
- `special_adult_assignments` — Maps caregivers to children
- Auto-create Backburner list per member (list_type = 'backburner')

Enable RLS on all tables. Mom (primary_parent) has full CRUD within family.

## Component Work
- Welcome/Landing page
- Create Account flow (mom only, Supabase Auth)
- Sign In page (email/password)
- Family Member Login (PIN flow with family login name)
- Visual Password grid (30 icons)
- Family Setup - Natural Trigger (first time mom needs family features)
- Family Setup - Bulk Add (AI parses natural language descriptions)
- Family Login Name Setup (unique, case-insensitive)
- Forgot Password flow
- Tablet / Family Device Hub (unauthenticated display)
- Member Invitations (email, QR/link, direct PIN setup)

## Service/Edge Function Work
- None (uses Supabase Auth directly)

## Testing Checklist
- [ ] Mom can create account and land on dashboard
- [ ] Family login name is unique and case-insensitive
- [ ] PIN authentication works for family members
- [ ] Visual password authentication works
- [ ] Bulk add parses "Mom, Dad (John), 2 kids (Emma 8, Liam 5)" correctly
- [ ] Tablet hub shows family members when unauthenticated
- [ ] RLS prevents cross-family data access

## Definition of Done
- All PRD-01 MVP items checked off
- RLS verified per role (update RLS-VERIFICATION.md)
- No hardcoded strings (all text extractable for i18n later)
