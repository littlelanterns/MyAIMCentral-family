# Build Prompt 36: Family Feeds

## PRD Reference
- PRD-37: `prds/platform-complete/PRD-37-Family-Feeds.md`
- Addendum: `prds/addenda/PRD-37-PRD-28B-Cross-PRD-Impact-Addendum.md`

## Prerequisites
- Phase 09 (Journal & Smart Notepad) complete
- Phase 15 (Messages, Requests & Notifications) complete
- Phase 16 (Meetings) complete

## Objective
Build the Family Feed with tag-based filtering (family_life, homeschool), portfolio tagging, media uploads (photo compress to 2048px WebP/JPEG, voice clips with 30-day TTL, documents), Out of Nest access for extended family, bulk summary mode (LiLa parses voice/text into structured updates), Log Learning widget, post approval (defaults OFF), heart reactions, and comments. This is a Medium phase.

## Database Work
Create tables:
- `family_moments` — Feed posts with content, tags (family_life, homeschool), portfolio flag, author, media references, approval status
- `moment_media` — Media attachments for moments (photos compressed to 2048px WebP/JPEG, voice clips with 30-day TTL, documents)
- `moment_reactions` — Heart reactions on moments (one per member per moment)
- `moment_comments` — Comments on moments with author and timestamp
- `out_of_nest_feed_settings` — Configuration for Out of Nest access (which extended family members, what tags they see)
- `feed_approval_settings` — Family-level approval settings (defaults OFF; when ON, posts require mom approval before display)

Enable RLS on all tables. Family members see family moments. Out of Nest members see only configured tags. Approval-pending posts visible only to author and mom.

## Component Work
### Feed Core
- Family feed view — Scrollable feed of family moments with tag-based filtering
- Tag filtering — Filter by family_life, homeschool, or all tags
- Portfolio tagging — Flag moments as portfolio items for curated collection
- Post creation — Create moments with text, media, tags, and portfolio flag

### Media
- Photo upload — Compress to 2048px max dimension, convert to WebP/JPEG
- Voice clip upload — Record or upload voice clips with 30-day TTL auto-cleanup
- Document upload — Attach documents to moments

### Engagement
- Heart reactions — One heart per member per moment with count display
- Comments — Add comments to moments; view threaded below moment

### Special Features
- Out of Nest access — Extended family members access feed via configured settings (tag-scoped view)
- Bulk summary mode — LiLa parses voice or text input and generates structured update posts from content
- Log Learning widget — Dashboard widget for quick learning moment capture that posts to feed
- Post approval — When enabled (defaults OFF), posts from children require mom approval before appearing in feed

## Edge Function Work
- `feed-bulk-summary` — LiLa parses voice/text input and generates structured feed updates

## Testing Checklist
- [ ] Feed renders moments in reverse chronological order
- [ ] Tag filtering works for family_life and homeschool tags
- [ ] Portfolio tagging flags moments correctly
- [ ] Photo upload compresses to 2048px and converts to WebP/JPEG
- [ ] Voice clips upload with 30-day TTL metadata
- [ ] Document attachments upload and display
- [ ] Heart reactions toggle with count update
- [ ] Comments add and display below moments
- [ ] Out of Nest access shows only configured tags to extended family
- [ ] Bulk summary mode generates structured posts from voice/text
- [ ] Log Learning widget posts to feed from dashboard
- [ ] Post approval flow: child posts → mom reviews → approve/reject
- [ ] Post approval defaults to OFF for new families
- [ ] Approval-pending posts visible only to author and mom
- [ ] RLS enforces family boundary and Out of Nest scoping

## Definition of Done
- All PRD-37 MVP items checked off
- Family feed with tag filtering and portfolio tagging operational
- Media uploads working with correct compression and TTL
- Out of Nest access scoped to configured tags
- Bulk summary mode generating structured updates
- Post approval flow functional (defaults OFF)
- Heart reactions and comments working
- RLS verified per role (update RLS-VERIFICATION.md)
- No hardcoded strings (all text extractable for i18n later)
