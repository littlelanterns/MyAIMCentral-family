# Build Prompt 32: Tracking, Allowance & Compliance

## PRD Reference
- PRD-28: `prds/platform-complete/PRD-28-Tracking-Allowance-Financial.md`
- PRD-28B: `prds/platform-complete/PRD-28B-Compliance-Progress-Reporting.md`
- Addendum: `prds/addenda/PRD-37-PRD-28B-Cross-PRD-Impact-Addendum.md`

## Prerequisites
- Phase 05 (Universal Scheduler & Timer) complete
- Phase 10 (Tasks, Lists, Studio & Templates) complete
- Phase 11 (Widgets, Trackers & Dashboard Layout) complete

## Objective
Build the allowance system (fixed/task-based/hybrid modes), financial transaction tracking, homeschool time tracking (manual/timer/task/widget sources), compliance reporting engine (template-based), education standards library (system-level), evidence linking (auto from tasks + manual), ESA invoicing with sequential numbering, and SDS/disability reports (ISP goals + personal goals merge). This is a Very Large phase — consider splitting into 32A (allowance + financial) and 32B (homeschool + compliance + reporting).

## Database Work
Create tables:
### Allowance & Financial
- `allowance_configs` — Per-child allowance configuration (mode: fixed/task-based/hybrid, amount, frequency, rules)
- `financial_transactions` — Ledger of all financial events (earned, spent, saved, gifted) per child with running balance
- `allowance_periods` — Period tracking for allowance payouts (weekly/biweekly/monthly) with completion status

### Homeschool & Compliance
- `homeschool_subjects` — Subject definitions per family with grade level and standards mapping
- `homeschool_configs` — Family-level homeschool configuration (state, reporting requirements, year boundaries)
- `homeschool_time_logs` — Time tracking entries with source (manual, timer, task, widget) and subject linkage
- `homeschool_family_config` — Extended family config for homeschool year, enrollment, and compliance settings
- `homeschool_student_config` — Per-student homeschool settings (grade level, accommodations, goals)
- `education_standards` — System-level education standards library (state standards, Common Core, etc.)
- `standard_evidence` — Evidence items linked to standards (auto-generated from task completions + manual entries)
- `report_templates` — Template definitions for compliance reports (attendance, progress, quarterly, annual)
- `esa_invoices` — ESA (Education Savings Account) invoice records with sequential numbering and line items

### Loans (if applicable per PRD-28)
- `loans` — Child loan records with terms, balance, and repayment schedule

Enable RLS on all tables. Children see their own financial data. Mom manages all configurations. Education standards are system-level read-only for families.

## Component Work
### Allowance System
- Allowance configuration — Mom sets mode (fixed/task-based/hybrid), amount, frequency per child
- Financial transaction log — Record and display earnings, spending, savings, gifts
- Balance display — Current balance with breakdown (earned, available, saved)
- Allowance payout — Automatic or manual payout processing per period

### Homeschool Time Tracking
- Manual time entry — Log time spent on subjects with date, duration, notes
- Timer integration — Link UniversalTimer sessions to subjects for automatic time capture
- Task-based tracking — Auto-log time from task completions tagged to subjects
- Widget source — Dashboard widget for quick time logging
- Time summary views — Daily, weekly, monthly time totals by subject

### Compliance Reporting
- Report template engine — Template-based report generation (attendance, progress, quarterly, annual)
- Education standards library — Browse and link system-level standards to subjects and evidence
- Evidence linking — Auto-link task completions as evidence; manual evidence attachment
- Report generation — Generate compliance reports from templates with evidence and time data
- ESA invoicing — Generate invoices with sequential numbering, line items, and export (PDF)

### SDS/Disability Reports
- ISP goals integration — Import/define ISP (Individualized Service Plan) goals
- Personal goals merge — Combine ISP goals with personal goals for unified reporting
- Progress tracking — Track progress against ISP and personal goals with evidence

## Testing Checklist
- [ ] Allowance config saves for fixed, task-based, and hybrid modes
- [ ] Financial transactions record correctly and update balance
- [ ] Allowance payout processes per configured frequency
- [ ] Manual time entry logs to correct subject
- [ ] Timer sessions link to subjects and auto-log time
- [ ] Task completions with subject tags generate time entries
- [ ] Time summary views show correct totals by subject and period
- [ ] Report template engine generates reports from templates
- [ ] Education standards library loads and is browsable
- [ ] Evidence auto-links from task completions
- [ ] Manual evidence attachment works
- [ ] ESA invoices generate with sequential numbering
- [ ] ESA invoices export to PDF
- [ ] ISP goals import and merge with personal goals
- [ ] RLS restricts financial data to owning child and mom

## Definition of Done
- All PRD-28 and PRD-28B MVP items checked off
- Allowance system operational in all 3 modes
- Homeschool time tracking functional from all 4 sources
- Compliance reporting engine generating template-based reports
- Education standards library seeded and browsable
- Evidence linking (auto + manual) verified
- ESA invoicing with sequential numbering working
- RLS verified per role (update RLS-VERIFICATION.md)
- No hardcoded strings (all text extractable for i18n later)
