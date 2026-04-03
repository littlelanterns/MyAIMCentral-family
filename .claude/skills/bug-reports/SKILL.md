---
name: bug-reports
description: "View, search, and manage beta bug reports submitted by family members via the in-app Glitch Reporter. Use when the user asks about bugs, glitches, feedback, or beta reports — or when you need to check if a bug has already been reported."
---

# Beta Bug Reports — Query Skill

The MyAIM Family platform has a **Beta Glitch Reporter** — a draggable Bug icon FAB that appears on every page for all logged-in users. Family members can tap it to submit bug reports with:

- Four optional text fields: what they were doing, what they tried, what happened, what they expected
- Auto-captured screenshot (via dom-to-image-more)
- Optional manual image attachment (uploaded to `beta-glitch-images` storage bucket)
- Auto-captured diagnostics: console errors (last 5), route history (last 10), browser info

Reports are stored in the `beta_glitch_reports` table on the remote Supabase database. There is no admin UI yet (that's PRD-32). Query reports using the Supabase CLI.

## Default Behavior — What to Do When This Skill Runs

When the user asks to "run bug reports" or "check bugs", follow this workflow:

1. **Query only `new` reports** — skip fixed/reviewed/wont_fix/cannot_reproduce
2. **Present a summary table** with: who, route, issue description, report date
3. **For empty reports** (no text in any field): check if they have screenshots or console errors. If neither, recommend closing as `cannot_reproduce` with note "No description or diagnostics provided"
4. **For actionable reports**: describe the bug clearly and ask the user what to do

### After Fixing or Triaging

When the user says a bug is fixed, addressed, or should be closed:
- **Mark as `fixed`** with `admin_notes` describing what was done and `resolved_at = now()`
- **Mark as `wont_fix`** if it's intentional behavior, with explanation in `admin_notes`
- **Mark as `cannot_reproduce`** if there's not enough info to act on
- **Mark as `reviewed`** if it's acknowledged but not yet fixed (keeping it open)

Always update the status so it doesn't resurface in future queries.

## How to Query Reports

All queries use `npx supabase db query --linked "<SQL>"`. Always include `--linked` to hit the remote database.

### See all new (unreviewed) reports — DEFAULT QUERY

```bash
npx supabase db query --linked "SELECT id, display_name, shell_type, current_route, what_doing, what_tried, what_happened, what_expected, console_errors, screenshot_data_url IS NOT NULL as has_screenshot, user_image_url, created_at FROM beta_glitch_reports WHERE status = 'new' ORDER BY created_at DESC;"
```

### See open reports (new + reviewed)

```bash
npx supabase db query --linked "SELECT id, display_name, status, current_route, what_doing, what_happened, admin_notes, created_at FROM beta_glitch_reports WHERE status IN ('new', 'reviewed') ORDER BY created_at DESC;"
```

### See all reports (any status)

```bash
npx supabase db query --linked "SELECT id, display_name, status, current_route, what_doing, what_happened, created_at FROM beta_glitch_reports ORDER BY created_at DESC;"
```

### See reports with console errors

```bash
npx supabase db query --linked "SELECT display_name, current_route, what_happened, console_errors FROM beta_glitch_reports WHERE console_errors IS NOT NULL AND console_errors::text != '[]' ORDER BY created_at DESC;"
```

### See a specific report with full diagnostics

```bash
npx supabase db query --linked "SELECT * FROM beta_glitch_reports WHERE id = 'REPORT-UUID-HERE';"
```

### See reports for a specific route

```bash
npx supabase db query --linked "SELECT display_name, what_doing, what_happened, created_at FROM beta_glitch_reports WHERE current_route LIKE '%/archives%' ORDER BY created_at DESC;"
```

### Count reports by status

```bash
npx supabase db query --linked "SELECT status, count(*) FROM beta_glitch_reports GROUP BY status;"
```

### Mark a report as reviewed

```bash
npx supabase db query --linked "UPDATE beta_glitch_reports SET status = 'reviewed', admin_notes = 'Fixed in commit abc123' WHERE id = 'REPORT-UUID-HERE';"
```

### Mark a report as fixed

```bash
npx supabase db query --linked "UPDATE beta_glitch_reports SET status = 'fixed', admin_notes = 'Description of fix', resolved_at = now() WHERE id = 'REPORT-UUID-HERE';"
```

### Bulk-close empty reports (no description, no console errors)

```bash
npx supabase db query --linked "UPDATE beta_glitch_reports SET status = 'cannot_reproduce', admin_notes = 'No description or diagnostics provided — cannot act on this report', resolved_at = now() WHERE status = 'new' AND (what_doing IS NULL OR what_doing = '') AND (what_happened IS NULL OR what_happened = '') AND (console_errors IS NULL OR console_errors::text = '[]') RETURNING id, display_name, current_route;"
```

### Mark a reviewed report as fixed (upgrade from reviewed → fixed)

```bash
npx supabase db query --linked "UPDATE beta_glitch_reports SET status = 'fixed', admin_notes = 'Description of fix', resolved_at = now() WHERE id = 'REPORT-UUID-HERE' AND status = 'reviewed';"
```

## Table Schema

```
beta_glitch_reports
├── id UUID (PK)
├── created_at TIMESTAMPTZ
├── user_id UUID (FK auth.users)
├── family_id UUID (FK families)
├── family_member_id UUID (FK family_members)
├── shell_type TEXT ('mom', 'adult', 'independent', 'guided', 'play')
├── display_name TEXT
├── what_doing TEXT
├── what_tried TEXT
├── what_happened TEXT
├── what_expected TEXT
├── user_image_url TEXT (from beta-glitch-images bucket)
├── screenshot_data_url TEXT (base64 PNG — can be large)
├── current_route TEXT
├── browser_info JSONB
├── console_errors JSONB (array of last 5 errors)
├── recent_routes JSONB (array of last 10 route changes)
├── status TEXT ('new', 'reviewed', 'fixed', 'wont_fix', 'cannot_reproduce')
├── admin_notes TEXT
└── resolved_at TIMESTAMPTZ
```

## Status Values

| Status | Meaning |
|--------|---------|
| `new` | Unreviewed (default) |
| `reviewed` | Seen, not yet fixed |
| `fixed` | Bug has been fixed |
| `wont_fix` | Intentional behavior or out of scope |
| `cannot_reproduce` | Unable to reproduce the issue |

## Feature Flag

The Glitch Reporter is controlled by `FEATURE_FLAGS.ENABLE_BETA_FEEDBACK` in `src/config/featureFlags.ts`. Set to `false` to hide the FAB from all users. The table and data persist regardless.

## Source Code

- FAB: `src/components/beta/GlitchReporterFAB.tsx`
- Modal: `src/components/beta/GlitchReportModal.tsx`
- Math Gate (Guided/Play): `src/components/beta/MathGate.tsx`
- Diagnostic capture: `src/services/diagnosticCapture.ts`
- Feature flag: `src/config/featureFlags.ts` → `ENABLE_BETA_FEEDBACK`
- Migration: `supabase/migrations/00000000100083_beta_glitch_reporter.sql`
- Storage bucket: `beta-glitch-images`
