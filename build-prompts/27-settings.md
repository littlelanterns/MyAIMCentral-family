# Build Prompt 27: Settings

## PRD Reference
- PRD-22: `prds/ai-vault/PRD-22-Settings.md`
- Addendum: `prds/addenda/PRD-22-Cross-PRD-Impact-Addendum.md`
- Embeds: PRD-03 (appearance/themes), PRD-15 (notifications), PRD-02 (privacy/permissions), PRD-14B (calendar settings)

## Prerequisites
- Phase 04 (Shell, Routing & Layouts) complete
- Phase 16 (Meetings) complete

## Objective
Build the Settings overlay with 10 categories and role-based visibility. Includes account management (display name, avatar, multi-email), family management (mom only), appearance (embed PRD-03 theme settings), notifications (embed PRD-15 preferences), privacy and permissions (embed PRD-02 controls), LiLa preferences (tone, response length, retention), calendar settings (embed PRD-14B), subscription stub for PRD-31, data export (ZIP with 24-hour expiry), and account deletion with 30-day grace period. This is a Medium phase.

## Database Work
Create tables:
- `member_emails` — Multi-email support per member with primary flag and verification status
- `lila_member_preferences` — Per-member LiLa preferences for tone, response length, and conversation retention settings
- `data_exports` — Export request records with ZIP file URL, creation timestamp, and 24-hour expiry
- `account_deletions` — Deletion request records with 30-day grace period, cancellation support, and final purge timestamp

Enable RLS on all tables. Members access only their own records. Mom role can view family management settings.

## Component Work
- Settings overlay — Full-screen overlay with 10 category navigation, role-based category visibility
- Account settings — Display name editor, avatar upload/crop, multi-email management (add, verify, set primary, remove)
- Family management — Mom-only section for family configuration, member roles, invitations
- Appearance settings — Embeds PRD-03 theme selection (light/dark/auto, color themes, font size)
- Notification settings — Embeds PRD-15 notification preferences (channels, frequency, DND schedule)
- Privacy & permissions — Embeds PRD-02 permission controls (visibility, data sharing, role-based access)
- LiLa preferences — Tone selector (warm, direct, playful, professional), response length (brief, standard, detailed), conversation retention toggle
- Calendar settings — Embeds PRD-14B calendar configuration (default view, week start, time format)
- Subscription stub — Placeholder section for PRD-31 subscription management (renders "Coming Soon" or links to Phase 38)
- Data export — Request ZIP export of all personal data, download link with 24-hour TTL
- Account deletion — Initiate deletion with confirmation flow, 30-day grace period with cancel option

## Testing Checklist
- [ ] Settings overlay opens and closes correctly from shell
- [ ] 10 categories render with correct role-based visibility
- [ ] Display name and avatar update persist
- [ ] Multi-email: add, verify, set primary, remove all work
- [ ] Family management section visible only to mom role
- [ ] Appearance theme changes apply immediately
- [ ] Notification preferences save and affect delivery
- [ ] Privacy/permission changes propagate to affected features
- [ ] LiLa preferences (tone, length, retention) save and affect AI responses
- [ ] Calendar settings persist and affect calendar views
- [ ] Data export generates ZIP and provides download link
- [ ] Data export link expires after 24 hours
- [ ] Account deletion initiates 30-day grace period
- [ ] Account deletion can be cancelled within grace period
- [ ] RLS prevents cross-member settings access

## Definition of Done
- All PRD-22 MVP settings categories implemented
- Role-based visibility working for all 10 categories
- Data export pipeline functional with 24-hour expiry
- Account deletion with 30-day grace period operational
- Embedded settings from PRD-03, PRD-15, PRD-02, PRD-14B integrated
- RLS verified per role (update RLS-VERIFICATION.md)
- No hardcoded strings (all text extractable for i18n later)
