# Build Prompt 37: Blog (Cookie Dough)

## PRD Reference
- PRD-38: `prds/platform-complete/PRD-38-Blog-Cookie-Dough-Contingency-Plans.md`
- Addendum: `prds/addenda/PRD-35-Cross-PRD-Impact-Addendum.md`

## Prerequisites
- Phase 03 (Design System & Themes) complete
- Phase 26 (AI Vault Engagement & Community) complete

## Objective
Build the public blog on aimagicformoms.com (domain-based routing), with 7 categories, anonymous commenting with geo-display, Haiku auto-moderation (positive/neutral comments auto-approve), hearts (anonymous via device fingerprint + authenticated), free tools/downloads, Showcase Feature pattern (articles reference MyAIM features with contextual CTAs), scheduled publishing, blog admin in AI Vault tab, and IP discarded after geo+rate-limit processing. This is a Medium phase.

## Database Work
Create tables:
- `blog_posts` — Blog post records with title, slug, content (rich text), category, status (draft/scheduled/published), publish_at timestamp, author, featured image, SEO metadata
- `blog_engagement` — Heart records for posts (anonymous via device fingerprint hash + authenticated user hearts)
- `blog_comments` — Comments on blog posts with display name, geo-display (city/region), moderation status, anonymous flag
- `blog_free_tools` — Free tools and downloadable resources linked to blog posts
- `blog_categories` — 7 blog category definitions with slug, name, description, display order

Enable RLS: blog posts with status=published are publicly readable. Draft/scheduled posts restricted to admin. Comments are publicly readable once approved. Blog admin restricted to admin/mom roles.

## Edge Function Work
- `blog-comment-moderate` — Haiku-based comment moderation; positive/neutral auto-approve, negative/spam flagged for review
- `blog-publish-scheduled` — Cron function (runs every 15 minutes) that publishes posts with publish_at <= now

## Component Work
### Public Blog
- Blog listing page — Category-filtered post listing on aimagicformoms.com with domain-based routing
- Blog post page — Full post display with rich text, featured image, category, author, date
- 7 categories — Category navigation and filtering
- Anonymous commenting — Comment without account; display name + geo-display (city/region derived from IP, IP then discarded)
- Haiku auto-moderation — Positive/neutral comments auto-approve; negative/spam held for review
- Hearts — Anonymous hearts via device fingerprint hash; authenticated hearts via user ID; combined count display
- Free tools/downloads — Downloadable resources linked to posts
- Showcase Feature pattern — Articles reference MyAIM platform features with contextual CTAs driving sign-up/trial

### Blog Admin (in AI Vault tab)
- Post editor — Rich text editor with image upload, category selection, SEO fields
- Scheduled publishing — Set publish_at date/time; cron publishes on schedule
- Comment moderation — Review flagged comments, approve/reject
- Analytics overview — Post views, hearts, comments, engagement metrics
- IP handling — IP used only for geo-lookup and rate-limiting, then discarded (not stored)

## Testing Checklist
- [ ] Blog listing page renders on aimagicformoms.com domain
- [ ] Domain-based routing correctly serves blog vs. app
- [ ] All 7 categories display and filter correctly
- [ ] Blog post page renders rich text content with featured image
- [ ] Anonymous commenting works without account
- [ ] Geo-display shows city/region on comments
- [ ] IP is discarded after geo-lookup and rate-limit check
- [ ] Haiku auto-moderation approves positive/neutral comments automatically
- [ ] Haiku auto-moderation flags negative/spam comments for review
- [ ] Anonymous hearts via device fingerprint work (one per device per post)
- [ ] Authenticated hearts work (one per user per post)
- [ ] Free tools/downloads link correctly to posts
- [ ] Showcase Feature CTAs render within post content
- [ ] Scheduled publishing publishes posts at correct time (within 15-minute cron window)
- [ ] Blog admin accessible in AI Vault tab
- [ ] Post CRUD works in admin editor
- [ ] Comment moderation (approve/reject) works in admin
- [ ] RLS allows public read of published posts and approved comments

## Definition of Done
- All PRD-38 MVP items checked off
- Public blog rendering on aimagicformoms.com with domain-based routing
- 7 categories with filtering operational
- Anonymous commenting with geo-display and Haiku moderation working
- Hearts (anonymous + authenticated) functional
- Scheduled publishing cron operational
- Showcase Feature pattern with contextual CTAs implemented
- Blog admin integrated into AI Vault tab
- IP privacy: discarded after geo+rate-limit processing
- RLS verified per role (update RLS-VERIFICATION.md)
- No hardcoded strings (all text extractable for i18n later)
