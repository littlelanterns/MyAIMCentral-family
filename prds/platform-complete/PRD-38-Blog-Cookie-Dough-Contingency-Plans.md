# PRD-38: Cookie Dough & Contingency Plans — Public Blog & Content Hub

**Status:** Not Started
**Dependencies:** PRD-21B (AI Vault admin tab — blog management lives alongside Vault content management), PRD-21C (Engagement system — hearts pattern reused for blog), PRD-03 (Design System — brand colors, typography), PRD-32 (Admin Console — moderation infrastructure extended for blog comments)
**Created:** March 21, 2026
**Last Updated:** March 21, 2026

---

## Overview

"Cookie Dough & Contingency Plans" is the public front porch of AI Magic for Moms — the only content surface visible to the outside world without authentication. It's where moms discover AIMfM through genuinely useful articles, free tools, and founder stories, driven by Pinterest traffic and organic search. The tagline beneath the name: *"Where the good stuff lives — articles, hacks, and free tools for real moms."*

This is not a marketing site that happens to have a blog. It's a content destination that happens to have a really good app behind it. Every article passes two tests before publishing: "They get me" (the reader feels seen, not marketed to) and "That was actually useful" (she walks away with something she can do today, for free, whether or not she ever subscribes). MyAIM is positioned as "the effortless version of what we just taught you to do manually" — never the only way.

The public site lives at `aimagicformoms.com`. The authenticated family app lives at `myaimcentral.com` (with potential future migration to a cleaner domain). Both are served from the same React codebase with domain-based routing, sharing the design system, brand fonts, and component library.

> **Mom experience goal:** Landing on this page should feel like walking into a friend's cozy living room. She's got cookie dough on the counter and a laptop open and she says "oh, sit down — I figured something out and you need to hear this." The content is warm, the design is Pinterest-beautiful, and nothing feels like it's trying to sell her something.

> **Forward note:** The Content Marketing & Pinterest Strategy document (project knowledge) contains 29+ article ideas, Pinterest pin strategy, board structure, and content quality standards. That document is the content playbook — this PRD defines the platform that delivers it.

---

## User Stories

### Public Visitors (Unauthenticated)
- As a mom who clicked a Pinterest pin, I want to land on a beautiful, easy-to-read article that actually helps me so I bookmark the site and come back.
- As a mom browsing the blog, I want to filter articles by category so I can find content relevant to my situation (homeschool, special needs, AI curious, etc.).
- As a reader who found an article helpful, I want to heart it without creating an account so I can show appreciation without friction.
- As a reader, I want to leave a positive comment without signing up so I can share my experience with other moms.
- As a mom exploring the site, I want to try a free tool (like an SDS report generator) so I can get real value before deciding whether to subscribe.
- As a reader, I want to see other moms' reactions and comments so I know this is a real community, not a corporate content mill.

### Subscribers (Authenticated, Visiting Public Site)
- As an existing subscriber, I want to see the blog and share articles with friends who aren't subscribers yet so I can spread the word naturally.
- As a subscriber, I want blog articles that showcase MyAIM features to link directly into the app so I can try the feature being described.

### Admin (Content Management)
- As the founder, I want to create blog posts by pasting content I've written in Claude/Gamma/Docs into a simple form with metadata fields so I can publish without learning a CMS.
- As the founder, I want to see which articles drive the most traffic and reactions so I can write more of what resonates.
- As the founder, I want blog comments auto-moderated so positive ones publish immediately and negative/spam ones are silently held for review.
- As the founder, I want to add free tools to the blog — both embedded interactive tools and downloadable resources.
- As the founder, I want each article to have proper SEO fields so Pinterest pins and Google searches drive organic traffic.

---

## Architecture

### Domain-Based Routing

One React codebase deployed on Vercel. Two domains pointing to the same deployment:

| Domain | Serves | Auth Required |
|--------|--------|---------------|
| `aimagicformoms.com` | Public site: blog, landing page, about, pricing (future) | No |
| `myaimcentral.com` | Authenticated app: family dashboards, AI Vault, admin console, all PRD features | Yes |

> **Decision rationale:** Same codebase means shared design system, shared component library, shared Supabase backend. Domain-based routing is handled at the Vercel configuration level — the app checks `window.location.hostname` at the top-level router and serves different route trees. Public routes never import authenticated components and vice versa, keeping bundle sizes separate via code splitting.

> **Forward note:** The app domain (`myaimcentral.com`) may migrate to a cleaner domain (e.g., `myaim.app`, `myaim.family`) when one is available. The architecture supports domain swaps via Vercel configuration without code changes. The product name is "MyAIM" — "Central" is a legacy working name from v1.

### Route Structure (aimagicformoms.com)

| Route | Page | Notes |
|-------|------|-------|
| `/` | Landing page | Future — not in this PRD scope. Redirects to `/blog` at MVP. |
| `/blog` | Blog home — masonry grid of articles | The "Cookie Dough & Contingency Plans" page |
| `/blog/:slug` | Individual article view | |
| `/blog/category/:category` | Category-filtered grid | |
| `/blog/tools` | Free tools landing page | Embedded tools + downloadable resources |
| `/blog/tools/:slug` | Individual free tool page | |

> **Forward note:** Additional public routes (landing page `/`, about `/about`, pricing `/pricing`) will be added as the marketing site grows. This PRD only covers the blog and free tools surfaces.

---

## Screens

### Screen 1: Blog Home — "Cookie Dough & Contingency Plans"

The main browsing experience. Pinterest-style masonry card grid.

**What the visitor sees:**

```
┌──────────────────────────────────────────────────────────────┐
│  🍪 Cookie Dough & Contingency Plans                        │
│  Where the good stuff lives — articles, hacks, and free     │
│  tools for real moms                                         │
│  ────────────────────────────────────────────────────────── │
│  [All] [Hacks & How-Tos] [AI for Real Life]                │
│  [Homeschool & Education] [Special Needs & Disability]      │
│  [Our Story] [What's New] [Free Tools]                      │
│  ────────────────────────────────────────────────────────── │
│                                                              │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐           │
│  │  [featured  │ │  [featured  │ │  [featured  │           │
│  │   image]    │ │   image]    │ │   image]    │           │
│  │             │ │             │ │             │           │
│  │ HACKS &     │ │ AI FOR      │ │ HOMESCHOOL  │           │
│  │ HOW-TOS     │ │ REAL LIFE   │ │ & EDUCATION │           │
│  │             │ │             │ │             │           │
│  │ The Home-   │ │ I Asked AI  │ │ How to Track│           │
│  │ school Mom's│ │ to Help     │ │ 180 Days    │           │
│  │ Weekly      │ │ With Dinner │ │ Without a   │           │
│  │ Report...   │ │ Then It...  │ │ Spreadsheet │           │
│  │             │ │             │ │             │           │
│  │ Mar 15 ·    │ │ Mar 12 ·    │ │ Mar 10 ·    │           │
│  │ 6 min read  │ │ 4 min read  │ │ 8 min read  │           │
│  │ ♥ 47        │ │ ♥ 23        │ │ ♥ 89        │           │
│  └─────────────┘ └─────────────┘ └─────────────┘           │
│                                                              │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐           │
│  │  (more      │ │  cards in   │ │  masonry    │           │
│  │   cards)    │ │  varying    │ │  layout)    │           │
│  │             │ │  heights    │ │             │           │
│  └─────────────┘ └─────────────┘ └─────────────┘           │
│                                                              │
│  [Load More]                                                 │
│                                                              │
│  ──────────────────────────────────────────────────────────  │
│  ┌────────────────────────────────────────────────────────┐  │
│  │  🍪 Join the Beta — Free Access in Exchange for       │  │
│  │  Feedback · Everything you just read about? The app   │  │
│  │  does it for you.                     [Join Free →]   │  │
│  └────────────────────────────────────────────────────────┘  │
│                                                              │
│  [Footer: About AIMfM · Privacy · © 2026 Three Little       │
│   Lanterns LLC]                                              │
└──────────────────────────────────────────────────────────────┘
```

**Key elements:**
- **Header:** Blog name "Cookie Dough & Contingency Plans" with the hover/subtitle descriptor. Styled with The Seasons font (brand serif) for the name, HK Grotesk for the descriptor.
- **Category filter bar:** Horizontal scrollable pill buttons. "All" selected by default. Tapping a category filters the grid. URL updates to `/blog/category/:category` for direct linking and SEO.
- **Article cards (masonry grid):** Pinterest-style variable-height cards in a responsive grid (3 columns desktop, 2 columns tablet, 1 column mobile). Each card shows:
  - Featured image (top, fills card width)
  - Category tag (small colored pill — each category has a brand color)
  - Article title (The Seasons font, 2-3 lines max)
  - Publication date + estimated read time
  - Heart count (♥ 47)
- **Load More button:** Loads next batch of 12 articles. Infinite scroll is a post-MVP option.
- **End-of-page CTA block:** Prominent beta signup CTA. Always present at the bottom of the grid.

**Optional sticky banner (configurable):**
```
┌──────────────────────────────────────────────────────────┐
│ 🍪 Free beta access — the app behind these articles      │
│                                          [Join Free →] × │
└──────────────────────────────────────────────────────────┘
```
- Appears at bottom of viewport, above the footer.
- Dismissible (×). Once dismissed, stays dismissed for the session (cookie-based, no account needed).
- Controlled by `is_blog_cta_banner_active` app configuration flag — can be toggled independently of the end-of-page CTA.

> **Decision rationale:** The sticky banner is configurable rather than always-on because the right level of CTA prominence depends on what feels natural once real articles are live. Too pushy and it violates the "cozy living room" experience goal. The flag lets you experiment without code changes.

**Design notes:**
- Background: warm cream (#FFF4EC)
- Card backgrounds: white with subtle shadow
- Category pill colors: each category gets a brand palette color (Sage Teal for Hacks, Golden Honey for AI, Deep Ocean for Homeschool, Dusty Rose for Special Needs, Warm Earth for Our Story, Soft Sage for What's New, Soft Gold for Free Tools)
- Card hover: gentle scale-up (1.02) and shadow increase
- The overall feel: "Pinterest meets scrapbooking meets post-it covered fridge" — warm, beautiful, AI-generated imagery with brand colors

**Interactions:**
- Tap category pill → filters grid, updates URL
- Tap article card → navigates to `/blog/:slug`
- Tap heart on card → increments heart count (anonymous, device-capped — see engagement section)
- Load More → appends next 12 articles
- Dismiss banner → hides for session

**Data read:**
- `blog_posts` table filtered by status = 'published', ordered by `published_at` DESC
- Heart counts from `blog_engagement` table

---

### Screen 2: Individual Article View

The reading experience for a single article.

**What the visitor sees:**

```
┌──────────────────────────────────────────────────────────────┐
│  🍪 Cookie Dough & Contingency Plans           [← Back]     │
│  ────────────────────────────────────────────────────────── │
│                                                              │
│  HACKS & HOW-TOS                                            │
│                                                              │
│  The Homeschool Mom's Weekly Report                         │
│  Nightmare (And How to Make It Disappear)                   │
│                                                              │
│  March 15, 2026 · 6 min read · ♥ 47                        │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │                                                        │ │
│  │              [Hero / Featured Image]                   │ │
│  │                                                        │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
│  (Article body — rendered HTML content)                      │
│                                                              │
│  Every Tuesday night, I'm staring at a blank compliance     │
│  form while my 4-year-old asks for water for the sixth     │
│  time. Sound familiar? Here's the thing — you're already   │
│  tracking everything you need for that report. You just     │
│  don't have it in one place yet...                          │
│                                                              │
│  ... (full article content) ...                              │
│                                                              │
│  ────────────────────────────────────────────────────────── │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  ♥ Did this help?                                      │ │
│  │  [♥ Yes, this helped! (47)]                            │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
│  ────────────────────────────────────────────────────────── │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  🍪 MyAIM does this for you.                           │ │
│  │                                                        │ │
│  │  Everything in this article — the tracking, the        │ │
│  │  reporting, the compliance — MyAIM handles it          │ │
│  │  automatically from activities you already log.        │ │
│  │                                                        │ │
│  │  [Join the Beta Free →]                                │ │
│  │                                                        │ │
│  │  "Built by a mom of nine who was tired of              │ │
│  │   Tuesday night report panic."                         │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
│  ────────────────────────────────────────────────────────── │
│                                                              │
│  COMMENTS                                                    │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ "This is EXACTLY what I needed. I've been doing the   │ │
│  │  spreadsheet thing for two years and I'm so done."    │ │
│  │                                                        │ │
│  │  — A mom from Tulsa, OK                               │ │
│  │    or someone who loves one · Mar 16                  │ │
│  ├────────────────────────────────────────────────────────┤ │
│  │ "The tip about using daily task completions as your   │ │
│  │  attendance log just saved me hours. Thank you!"      │ │
│  │                                                        │ │
│  │  — A mom from Portland, OR                            │ │
│  │    or someone who loves one · Mar 15                  │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  Leave a comment                                       │ │
│  │  ┌──────────────────────────────────────────────────┐  │ │
│  │  │                                                  │  │ │
│  │  │  (text area)                                     │  │ │
│  │  │                                                  │  │ │
│  │  └──────────────────────────────────────────────────┘  │ │
│  │                                                        │ │
│  │  [Post Comment]                                        │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
│  ────────────────────────────────────────────────────────── │
│  MORE FROM COOKIE DOUGH & CONTINGENCY PLANS                 │
│                                                              │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐                    │
│  │ Related  │ │ Related  │ │ Related  │                    │
│  │ Article  │ │ Article  │ │ Article  │                    │
│  │ Card     │ │ Card     │ │ Card     │                    │
│  └──────────┘ └──────────┘ └──────────┘                    │
│                                                              │
│  [Footer]                                                    │
└──────────────────────────────────────────────────────────────┘
```

**Key elements:**
- **Article header:** Category tag, title (The Seasons font, large), date + read time + heart count, hero image.
- **Article body:** Rendered HTML content. Styled with HK Grotesk body text, The Seasons for subheadings within the article. Comfortable reading width (max 720px, centered). Images within articles are full-width within the content column.
- **Heart reaction bar:** Below the article body. "Did this help?" with a heart button showing the count. Tapping toggles the heart (anonymous, device-based).
- **CTA block:** Below the heart bar. Contextual to the article — if the article has a `showcase_feature` link, the CTA text references that specific feature. If not, it uses the generic beta CTA. Warm, not salesy. Includes a short founder voice quote.
- **Comments section:** Approved comments displayed in chronological order. Each shows the comment text and the geo-based attribution line. Comment form at the bottom — just a text area and a Post button. No signup, no name field, no email field.
- **Related articles:** 3 article cards from the same category (or mixed if insufficient).

**SEO elements (in page `<head>`):**
- `<title>`: Article title + " | Cookie Dough & Contingency Plans"
- `<meta name="description">`: Article excerpt (admin-written)
- `<meta property="og:image">`: Featured image (doubles as Pinterest pin image)
- `<meta property="og:type">`: "article"
- `<link rel="canonical">`: Full article URL
- Structured data: Article schema (JSON-LD) with headline, datePublished, author, image

**Interactions:**
- Back button → returns to blog grid (preserves scroll position and filters)
- Heart → toggles anonymous heart (see Engagement section)
- Post Comment → submits to auto-moderation pipeline (see Comments section)
- Related article cards → navigate to that article
- CTA "Join Free" → links to signup page on myaimcentral.com

**Data read/written:**
- `blog_posts` by slug
- `blog_engagement` for heart count and user's heart state
- `blog_comments` for approved comments
- `blog_comments` INSERT on comment submission

---

### Screen 3: Free Tools Landing Page

The browsing page for community gift tools and downloadable resources.

**What the visitor sees:**

```
┌──────────────────────────────────────────────────────────────┐
│  🍪 Cookie Dough & Contingency Plans           [← Blog]     │
│  ────────────────────────────────────────────────────────── │
│                                                              │
│  Free Tools & Resources                                      │
│  Real help, no strings attached.                             │
│  ────────────────────────────────────────────────────────── │
│                                                              │
│  ┌─────────────────────────────┐ ┌─────────────────────────┐│
│  │  🛠️ SDS Monthly Report      │ │  📋 Homeschool Hours    ││
│  │     Generator               │ │     Tracker Template    ││
│  │                             │ │                         ││
│  │  Generate Missouri SDS      │ │  Free printable PDF     ││
│  │  monthly reports in 20      │ │  for tracking 180       ││
│  │  minutes instead of 3       │ │  days — works for any   ││
│  │  hours.                     │ │  state.                 ││
│  │                             │ │                         ││
│  │  [Interactive Tool]         │ │  [Download PDF]         ││
│  │  ♥ 134                      │ │  ♥ 89                   ││
│  └─────────────────────────────┘ └─────────────────────────┘│
│                                                              │
│  (more tool cards)                                           │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

**Key elements:**
- **Tool cards:** Title, description, type badge ([Interactive Tool] or [Download PDF] or [Prompt Template]), heart count.
- **Interactive tools** link to `/blog/tools/:slug` which hosts an embedded tool (iframe or native component).
- **Downloadable resources** trigger a download directly (PDF, template file) or link to a tool page with a download button and usage instructions.

> **Decision rationale:** Free tools live under the blog route (`/blog/tools`) rather than a separate top-level route because they're part of the same content ecosystem. A mom browsing articles might discover tools, and vice versa. Keeping them under the same umbrella reinforces that this is all one generous content destination.

---

### Screen 4: Blog Admin — Content Management

> **Depends on:** PRD-21B Admin Console Shell and AI Vault tab. Blog management is a sub-section of the AI Vault admin tab.

**What the admin sees:**

The AI Vault admin tab gains a sub-navigation:

```
┌──────────────────────────────────────────────────────────┐
│  AI Vault                                                │
│  ──────────────────────────────────────────────────────  │
│  [Vault Content] [Blog Posts] [Categories] [...]         │
│  ──────────────────────────────────────────────────────  │
│                                                          │
│  Blog Posts                               [+ New Post]   │
│  ──────────────────────────────────────────────────────  │
│  [All] [Published] [Drafts] [Archived]   🔍 Search       │
│                                                          │
│  ┌────────────────────────────────────────────────────┐  │
│  │ The Homeschool Mom's Weekly Report Nightmare...    │  │
│  │ Hacks & How-Tos · Published · Mar 15 · ♥ 47       │  │
│  │                                        [Edit] [⋮]  │  │
│  ├────────────────────────────────────────────────────┤  │
│  │ I Asked AI to Help With Dinner...                  │  │
│  │ AI for Real Life · Draft · —                       │  │
│  │                                        [Edit] [⋮]  │  │
│  └────────────────────────────────────────────────────┘  │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

**"+ New Post" opens the blog post editor form:**

```
┌──────────────────────────────────────────────────────────┐
│  New Blog Post                                    [Save] │
│  ──────────────────────────────────────────────────────  │
│                                                          │
│  Title:                                                  │
│  ┌────────────────────────────────────────────────────┐  │
│  │ The Homeschool Mom's Weekly Report Nightmare...    │  │
│  └────────────────────────────────────────────────────┘  │
│                                                          │
│  Slug: (auto-generated from title, editable)             │
│  ┌────────────────────────────────────────────────────┐  │
│  │ homeschool-mom-weekly-report-nightmare              │  │
│  └────────────────────────────────────────────────────┘  │
│                                                          │
│  Category: [Hacks & How-Tos ▾]                           │
│                                                          │
│  Excerpt (shown on cards and in meta description):       │
│  ┌────────────────────────────────────────────────────┐  │
│  │ Compliance reporting doesn't have to eat your      │  │
│  │ Tuesday nights. Here's how to make it disappear.   │  │
│  └────────────────────────────────────────────────────┘  │
│                                                          │
│  Featured Image:                                         │
│  [Upload] [Current: report-nightmare-hero.jpg]           │
│                                                          │
│  Article Body (paste HTML or Markdown):                   │
│  ┌────────────────────────────────────────────────────┐  │
│  │                                                    │  │
│  │  (large text area — paste content from              │  │
│  │   Claude/Docs/Gamma here)                          │  │
│  │                                                    │  │
│  └────────────────────────────────────────────────────┘  │
│  Format: [HTML ○ / Markdown ○]                           │
│                                                          │
│  ── SEO ──────────────────────────────────────────────   │
│  Meta Title (overrides article title if set):            │
│  ┌────────────────────────────────────────────────────┐  │
│  │                                                    │  │
│  └────────────────────────────────────────────────────┘  │
│  Meta Description (overrides excerpt if set):            │
│  ┌────────────────────────────────────────────────────┐  │
│  │                                                    │  │
│  └────────────────────────────────────────────────────┘  │
│  Pinterest Pin Image (overrides featured image if set):  │
│  [Upload] [Same as featured image ☑]                     │
│                                                          │
│  ── Showcase ─────────────────────────────────────────   │
│  Showcase Feature (optional):                            │
│  Links article CTA to a specific MyAIM feature.          │
│  [None ▾ / Meal Planner / Report Generator / ...]        │
│                                                          │
│  Custom CTA Text (optional, overrides default):          │
│  ┌────────────────────────────────────────────────────┐  │
│  │ MyAIM generates this report automatically from     │  │
│  │ activities you already track.                      │  │
│  └────────────────────────────────────────────────────┘  │
│                                                          │
│  ── Publishing ───────────────────────────────────────   │
│  Status: [Draft ▾ / Published / Archived]                │
│  Publish Date: [Mar 15, 2026] (for scheduling)           │
│                                                          │
│  [Save Draft]                      [Publish / Schedule]  │
└──────────────────────────────────────────────────────────┘
```

**Key elements:**
- **Title + auto-slug:** Slug auto-generates from title (kebab-case), editable for SEO optimization.
- **Category dropdown:** The 7 defined categories.
- **Excerpt:** Used for card display, meta description, and Pinterest pin text. Max 200 characters.
- **Featured image:** Uploaded to Supabase Storage `blog-images` bucket. Used for card thumbnails, hero images, and Open Graph.
- **Article body:** Large text area accepting HTML or Markdown. A format toggle switches between the two. Markdown is converted to HTML on save. No WYSIWYG — the admin pastes finished content.
- **SEO section:** Optional overrides for meta title, meta description, and a separate Pinterest pin image (defaults to featured image).
- **Showcase section:** Optional link to a MyAIM feature. When set, the end-of-article CTA contextualizes to that feature. A dropdown populated from a simple config list of showcase-able features.
- **Custom CTA text:** Optional override for the CTA block text. If blank, uses the generic beta CTA.
- **Publishing controls:** Draft/Published/Archived status. Publish date for scheduling (posts with a future publish date are in "Scheduled" state and auto-publish via a scheduled Edge Function).

> **Decision rationale:** The admin form is deliberately simple — metadata fields + a paste area for content. The founder writes content in tools she's already comfortable with (Claude for drafting, Gamma for formatting, Google Docs for editing). The admin console is for publishing and managing, not for writing. A full WYSIWYG editor would add significant engineering complexity for a workflow that isn't needed.

**Blog-specific admin actions (⋮ menu per post):**
- Edit
- View on Site (opens the public URL in a new tab)
- Duplicate (creates a copy as a draft — useful for templated content)
- Archive
- Delete (with confirmation)

**Data created/updated:**
- `blog_posts` CRUD
- `blog-images` Supabase Storage bucket

---

### Screen 5: Blog Admin — Free Tools Management

A sub-section for managing the free tools and downloadable resources.

```
┌──────────────────────────────────────────────────────────┐
│  AI Vault                                                │
│  ──────────────────────────────────────────────────────  │
│  [Vault Content] [Blog Posts] [Free Tools] [...]         │
│  ──────────────────────────────────────────────────────  │
│                                                          │
│  Free Tools                              [+ New Tool]    │
│  ──────────────────────────────────────────────────────  │
│                                                          │
│  ┌────────────────────────────────────────────────────┐  │
│  │ SDS Monthly Report Generator · Interactive · Live  │  │
│  │ ♥ 134                                 [Edit] [⋮]  │  │
│  ├────────────────────────────────────────────────────┤  │
│  │ Homeschool Hours Tracker · Download · Live         │  │
│  │ ♥ 89                                  [Edit] [⋮]  │  │
│  └────────────────────────────────────────────────────┘  │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

**Tool types:**
- **Interactive:** Embedded tool hosted on the blog. Admin provides the component path or iframe URL.
- **Download:** File uploaded to Supabase Storage. Admin provides the file + a description page.
- **Prompt Template:** A copyable prompt with instructions. Renders as a styled card with a "Copy Prompt" button.

**Data created/updated:**
- `blog_free_tools` CRUD
- `blog-tool-files` Supabase Storage bucket (for downloadable resources)

---

## Comments System

### How Comments Work

**Submission flow:**
1. Visitor types a comment and taps "Post Comment."
2. The visitor's IP is captured server-side. A geo-lookup resolves city + state/country. The display line is formatted as: *"A mom from [City], [State/Country] — or someone who loves one"*
3. If geo-lookup fails (VPN, private IP, service unavailable), the fallback display is: *"A mom from somewhere wonderful — or someone who loves one"*
4. The comment text + geo-display are sent to an Edge Function.
5. The Edge Function runs a Haiku classification call: Is this comment positive/neutral, negative, or spam?
6. **Positive/neutral:** Comment is saved with `moderation_status = 'approved'` and appears immediately. The visitor sees their comment in the thread.
7. **Negative/spam:** Comment is saved with `moderation_status = 'held'`. The visitor sees: "Thanks! Your comment is being reviewed." They don't know it was flagged.
8. Held comments appear in the Admin Console Moderation tab (PRD-21C) under a "Blog Comments" filter for admin review. Admin can approve (makes it visible) or delete.

> **Decision rationale:** Positive auto-publish creates an immediately rewarding experience for commenters while keeping the tone warm and safe. The "being reviewed" message for held comments is a white lie that avoids confrontation and keeps the experience positive even for people whose comments don't make the cut. No commenter ever knows their comment was rejected.

**Classification prompt for Haiku:**
The Edge Function sends the comment text to Haiku with a system prompt:
- Classify as `positive` (encouraging, grateful, helpful, sharing experience), `neutral` (question, factual, on-topic but not emotional), `negative` (critical, rude, hostile, shaming, off-topic attack), or `spam` (promotional, irrelevant links, gibberish).
- Only `positive` and `neutral` auto-approve. Everything else holds.

**Cost:** Haiku classification per comment is negligible (~$0.001 per comment). Blog comment volume will be low — likely single digits per day even at scale.

### Comment Display

```
"This is EXACTLY what I needed. I've been doing the
 spreadsheet thing for two years and I'm so done."

 — A mom from Tulsa, OK
   or someone who loves one · Mar 16
```

- Comment text in quotation marks, styled with a slight indent.
- Attribution line in muted text below: geo-display + relative date.
- No threading (flat comments only at MVP).
- No editing or deletion by the commenter (they're anonymous — no account to authenticate against).
- Comments ordered chronologically (oldest first — reads like a conversation).

### Geo-Lookup Implementation

- **Service:** IP geolocation via a lightweight Edge Function that calls a free/cheap geo API (ip-api.com for development, MaxMind GeoLite2 for production — free tier supports 1000 lookups/day, more than sufficient).
- **Data stored:** City and state/region only. NOT the raw IP address. The IP is used for the lookup and then discarded. No IP addresses are stored in the database.
- **Privacy:** The geo-display is coarse (city-level, not street-level). No personally identifiable information is collected or stored. The commenter is fully anonymous.

> **Decision rationale:** Discarding the IP after geo-lookup (rather than storing it) is a privacy-first choice. We don't need IPs for anything — the geo-display is the only purpose. Storing IPs would create a data liability with no benefit.

---

## Engagement System

### Hearts on Blog Posts

Matching the AI Vault engagement pattern from PRD-21C, adapted for anonymous visitors:

- **Anonymous hearts:** No account required. Hearts are tracked via a device fingerprint (combination of `localStorage` key + a lightweight browser fingerprint hash). One heart per device per article.
- **Toggling:** Tapping the heart button adds a heart. Tapping again removes it. The count updates optimistically.
- **Display threshold:** Heart counts are shown on cards and articles regardless of count (no minimum threshold — even "♥ 1" is displayed, unlike the Vault where counts below 5 are hidden). Early blog content benefits from showing any engagement.

> **Decision rationale:** Anonymous hearts reduce friction to zero — no signup, no account, no barrier. Device-based deduplication prevents the worst spam without requiring authentication. A determined attacker could clear localStorage to re-heart, but the attack surface is low (blog heart counts are vanity metrics, not financial instruments) and the cost/benefit of more sophisticated protection isn't justified.

**Data schema:** See `blog_engagement` table below.

---

## Visibility & Permissions

### Public Pages (aimagicformoms.com)

| Role | Access | Notes |
|------|--------|-------|
| Unauthenticated visitor | Full read access | Can browse articles, read comments, heart, leave comments, use free tools, download resources. |
| Authenticated subscriber (visiting public site) | Full read access + their hearts persist across devices | If signed in, hearts are linked to their user_id instead of device fingerprint. |
| Admin | Full read access + "Edit" quick-link on articles | A subtle pencil icon appears on articles when an admin is viewing the public site, linking directly to the admin editor. |

### Admin (myaimcentral.com)

Blog management lives in the AI Vault admin tab. Requires `vault_admin` or `super_admin` permission. No new permission type needed — blog content is managed alongside Vault content.

> **Decision rationale:** Blog content management uses the existing `vault_admin` permission rather than a new `blog_admin` type because the workflow is similar (create content, manage images, publish) and the same person (Tenise) manages both. If blog management is later delegated to someone who shouldn't access the Vault, a `blog_admin` permission type can be added at that point.

### Shell Behavior

The blog is a public website, not part of any family member shell. It exists outside the authenticated app entirely. The only connection points are:

- **CTA links** from blog to signup/login on the app domain.
- **"Visit the Blog" link** in the app's footer or About section (accessible to all authenticated users).
- **Admin edit link** visible to admins when viewing the public blog.

---

## Data Schema

### Table: `blog_posts`

All blog articles.

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NOT NULL | PK |
| title | TEXT | | NOT NULL | Article title |
| slug | TEXT | | NOT NULL | URL slug. UNIQUE. |
| category | TEXT | | NOT NULL | CHECK: 'hacks_howtos', 'ai_real_life', 'homeschool_education', 'special_needs_disability', 'our_story', 'whats_new', 'free_tools' |
| excerpt | TEXT | | NOT NULL | Card description and meta description. Max 200 chars recommended. |
| body_html | TEXT | | NOT NULL | Article body as rendered HTML. |
| body_format | TEXT | 'html' | NOT NULL | CHECK: 'html', 'markdown'. If markdown, converted to HTML on save. |
| featured_image_url | TEXT | | NULL | Supabase Storage URL for the featured/hero image. |
| pinterest_image_url | TEXT | | NULL | Optional separate Pinterest pin image. Falls back to featured_image_url. |
| meta_title | TEXT | | NULL | SEO title override. Falls back to title. |
| meta_description | TEXT | | NULL | SEO description override. Falls back to excerpt. |
| showcase_feature | TEXT | | NULL | Optional feature key for contextual CTA. E.g., 'report_generator', 'meal_planner'. |
| custom_cta_text | TEXT | | NULL | Optional CTA text override for the end-of-article block. |
| status | TEXT | 'draft' | NOT NULL | CHECK: 'draft', 'published', 'scheduled', 'archived' |
| published_at | TIMESTAMPTZ | | NULL | When the post was/will be published. Set on publish. Used for scheduled publishing. |
| heart_count | INTEGER | 0 | NOT NULL | Denormalized count from blog_engagement. Updated by trigger. |
| comment_count | INTEGER | 0 | NOT NULL | Denormalized count of approved comments. Updated by trigger. |
| read_time_minutes | INTEGER | | NULL | Estimated read time. Auto-calculated from body word count on save (~200 words/minute). |
| created_by | UUID | | NOT NULL | FK → auth.users (admin who created) |
| created_at | TIMESTAMPTZ | now() | NOT NULL | |
| updated_at | TIMESTAMPTZ | now() | NOT NULL | Auto-trigger |

**RLS Policy:** Public READ for posts where `status = 'published'` and `published_at <= now()`. Admin CRUD for all posts.

**Indexes:**
- `(slug)` UNIQUE
- `(status, published_at DESC)` — "published posts, newest first" (primary blog query)
- `(category, status, published_at DESC)` — "published posts by category"

---

### Table: `blog_engagement`

Heart reactions on blog posts. Supports both anonymous and authenticated hearts.

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NOT NULL | PK |
| blog_post_id | UUID | | NOT NULL | FK → blog_posts |
| user_id | UUID | | NULL | FK → auth.users. Set if the user is authenticated. NULL for anonymous. |
| device_fingerprint | TEXT | | NULL | Browser fingerprint hash for anonymous deduplication. NULL if authenticated. |
| created_at | TIMESTAMPTZ | now() | NOT NULL | |

**RLS Policy:** Public INSERT and DELETE (for heart toggle). Public READ for aggregate counts. Individual records are not exposed — only the count matters.

**Indexes:**
- `(blog_post_id, user_id)` UNIQUE WHERE user_id IS NOT NULL — one heart per authenticated user per post
- `(blog_post_id, device_fingerprint)` UNIQUE WHERE device_fingerprint IS NOT NULL — one heart per device per post
- `(blog_post_id)` — count queries

**Trigger:** On INSERT/DELETE, update `blog_posts.heart_count` via database trigger (not application-level increment, avoiding race conditions).

---

### Table: `blog_comments`

All blog comments (approved and held).

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NOT NULL | PK |
| blog_post_id | UUID | | NOT NULL | FK → blog_posts |
| comment_text | TEXT | | NOT NULL | The comment body. Max 1000 characters. |
| geo_display | TEXT | | NOT NULL | Formatted display: "A mom from Tulsa, OK — or someone who loves one" |
| geo_city | TEXT | | NULL | Resolved city name (for admin filtering). |
| geo_region | TEXT | | NULL | Resolved state/province/country. |
| moderation_status | TEXT | 'pending' | NOT NULL | CHECK: 'pending', 'approved', 'held', 'deleted' |
| moderation_reason | TEXT | | NULL | AI classification result: 'positive', 'neutral', 'negative', 'spam' |
| created_at | TIMESTAMPTZ | now() | NOT NULL | |

**RLS Policy:** Public READ for comments where `moderation_status = 'approved'`. Public INSERT (creates with `moderation_status = 'pending'` — Edge Function immediately updates to 'approved' or 'held'). Admin READ all, UPDATE moderation_status.

> **Decision rationale:** No IP addresses stored. No user identification stored. The `geo_display` is the only location reference, and it's a coarse city-level string that the commenter effectively consented to by posting on a public blog. This is the same level of location disclosure as any "Posted from [city]" feature.

**Indexes:**
- `(blog_post_id, moderation_status, created_at)` — "approved comments for this post, chronological"
- `(moderation_status)` — admin moderation queue

**Trigger:** On INSERT where `moderation_status = 'approved'`, increment `blog_posts.comment_count`. On UPDATE from 'approved' to other status, decrement.

---

### Table: `blog_free_tools`

Free tools and downloadable resources.

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NOT NULL | PK |
| title | TEXT | | NOT NULL | Tool name |
| slug | TEXT | | NOT NULL | URL slug. UNIQUE. |
| description | TEXT | | NOT NULL | Card description |
| tool_type | TEXT | | NOT NULL | CHECK: 'interactive', 'download', 'prompt_template' |
| content_html | TEXT | | NULL | Description/instructions page body (HTML) |
| embed_url | TEXT | | NULL | For interactive tools: iframe URL or component identifier |
| download_url | TEXT | | NULL | For downloads: Supabase Storage URL |
| prompt_text | TEXT | | NULL | For prompt templates: the copyable prompt |
| featured_image_url | TEXT | | NULL | Card thumbnail |
| heart_count | INTEGER | 0 | NOT NULL | Denormalized from blog_engagement |
| status | TEXT | 'draft' | NOT NULL | CHECK: 'draft', 'published', 'archived' |
| display_order | INTEGER | 0 | NOT NULL | Sort order on the tools page |
| created_by | UUID | | NOT NULL | FK → auth.users |
| created_at | TIMESTAMPTZ | now() | NOT NULL | |
| updated_at | TIMESTAMPTZ | now() | NOT NULL | Auto-trigger |

**RLS Policy:** Public READ where `status = 'published'`. Admin CRUD.

**Indexes:**
- `(slug)` UNIQUE
- `(status, display_order)` — "published tools, sorted"

---

### Table: `blog_categories`

Category definitions with display metadata.

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| key | TEXT | | NOT NULL | PK. Machine key: 'hacks_howtos', 'ai_real_life', etc. |
| display_name | TEXT | | NOT NULL | "Hacks & How-Tos", "AI for Real Life", etc. |
| description | TEXT | | NULL | Short category description (for future category landing pages) |
| color | TEXT | | NOT NULL | Brand color hex for category pills |
| display_order | INTEGER | 0 | NOT NULL | Sort order in the filter bar |
| is_active | BOOLEAN | true | NOT NULL | |

**RLS Policy:** Public READ. Admin CRUD.

**Seeded data:**

| key | display_name | color |
|-----|-------------|-------|
| hacks_howtos | Hacks & How-Tos | #68A395 (Sage Teal) |
| ai_real_life | AI for Real Life | #D6A461 (Golden Honey) |
| homeschool_education | Homeschool & Education | #2C5D60 (Deep Ocean) |
| special_needs_disability | Special Needs & Disability | #D69A84 (Dusty Rose) |
| our_story | Our Story | #5A4033 (Warm Earth) |
| whats_new | What's New | #D4E3D9 (Soft Sage) |
| free_tools | Free Tools | #F4DCB7 (Soft Gold) |

---

### Supabase Storage Buckets

| Bucket | Contents | Access |
|--------|----------|--------|
| `blog-images` | Featured images, hero images, Pinterest pin images, in-article images | Admin write. Public read. |
| `blog-tool-files` | Downloadable resource files (PDFs, templates) | Admin write. Public read (signed URLs for download tracking). |

---

## Flows

### Incoming Flows

| Source | How It Works |
|--------|-------------|
| **Admin Console (AI Vault tab)** | Blog posts and free tools created and managed via admin forms. |
| **Pinterest** | Pins link to `/blog/:slug` articles. Pinterest pin images sourced from `pinterest_image_url` or `featured_image_url`. |
| **Google Search** | SEO-optimized articles rank for homeschool, ESA, and family management keywords. |
| **Existing subscribers sharing** | Subscribers share article URLs with non-subscriber friends. |

### Outgoing Flows

| Destination | How It Works |
|-------------|-------------|
| **Signup / Beta registration** | CTA links from articles to the signup page on myaimcentral.com. |
| **PRD-21C Moderation tab** | Held blog comments appear in the admin Moderation tab for review. |
| **Pinterest** | Published articles generate shareable pin URLs. Pin images optimized for Pinterest (2:3 ratio). |
| **Content Marketing Pipeline** | Article performance data (hearts, comments, traffic) informs future content decisions. |

---

## AI Integration

### Comment Auto-Moderation

**Model:** Haiku (fast, cheap — perfect for short text classification)

**Edge Function:** `blog-comment-moderate`

**Flow:**
1. Comment submitted via public API endpoint
2. Edge Function receives comment text
3. Geo-lookup on commenter's IP → formats display line → discards IP
4. Sends comment text to Haiku with classification prompt
5. If `positive` or `neutral` → saves with `moderation_status = 'approved'`
6. If `negative` or `spam` → saves with `moderation_status = 'held'`
7. Returns response to frontend: approved → show comment, held → show "being reviewed" message

**System prompt (condensed):**
```
Classify this blog comment as one of: positive, neutral, negative, spam.

positive: encouraging, grateful, sharing experience, affirming
neutral: question, factual, on-topic discussion
negative: critical, rude, hostile, shaming, off-topic attack, discouraging
spam: promotional, irrelevant links, gibberish, AI-generated filler

Blog context: This is a family-focused blog for moms about AI, homeschooling, 
and family management. The community tone is warm and supportive.

Respond with only the classification word.
```

**Cost:** ~$0.001 per comment. Negligible even at scale.

### Scheduled Publishing

An Edge Function (`blog-publish-scheduled`) runs on a cron schedule (every 15 minutes) and checks for posts where `status = 'scheduled'` and `published_at <= now()`. Matching posts are updated to `status = 'published'`.

---

## Edge Cases

### Comment Spam Floods
- Rate limiting: max 3 comments per IP per 10-minute window (enforced at the Edge Function level using IP, before the IP is discarded). Excess submissions return a friendly "You're on a roll! Give it a few minutes and try again."
- The IP is used ONLY for rate limiting and geo-lookup, then discarded. Not stored.

### Geo-Lookup Service Unavailable
- If the geo-lookup API fails or times out (2-second timeout), the comment proceeds with the fallback display: "A mom from somewhere wonderful — or someone who loves one."
- No comment is blocked due to geo-lookup failure.

### Article With No Comments (Empty State)
- Comment section shows: "Be the first to share your thoughts! 💛"

### Article With No Hearts
- Heart count shows "♥ 0" — or optionally hides the count and just shows the heart icon. Admin-configurable.

### Very Long Article Body
- No technical limit on body_html length (TEXT column). Rendering uses standard HTML — browser handles scroll and pagination.
- Read time auto-calculates from word count at save time.

### Duplicate Slugs
- UNIQUE constraint on slug column. If a title generates a duplicate slug, the admin is prompted to edit the slug before saving.

### Scheduled Post Editing
- A scheduled post can be edited before its publish time. Editing does not change the scheduled publish date.
- If the admin changes status from 'scheduled' back to 'draft', the post is de-scheduled.

### Anonymous Heart Manipulation
- Device fingerprint provides reasonable deduplication. Clearing localStorage allows re-hearting — this is an accepted trade-off. Blog heart counts are community signals, not financial metrics.
- If this becomes a problem, a post-MVP enhancement can add IP-based deduplication (without storing IPs — hash-based comparison at Edge Function level).

### Content Injection / XSS in Comments
- Comment text is sanitized on save (HTML tags stripped). Comments are rendered as plain text, not HTML.
- Article body HTML is admin-authored only (not user-generated) and rendered as-is. Admin is trusted.

### Blog Accessed From App Domain
- If someone navigates to `myaimcentral.com/blog`, the router redirects to `aimagicformoms.com/blog`. The blog only lives on the public domain.

---

## Tier Gating

No tier gating. The blog is a public, unauthenticated surface. All content is free to read, heart, and comment on. Free tools are free.

> **Tier rationale:** The blog IS the marketing funnel. Gating any part of it would defeat its purpose. Every piece of content should be accessible to anyone, anywhere. The blog's job is to demonstrate value so compelling that subscribing feels like a natural next step, not a requirement.

---

## Stubs

### Stubs Created by This PRD

| Stub | Wires To | Future PRD |
|------|----------|------------|
| Landing page at aimagicformoms.com `/` | Full marketing landing page with hero, features, pricing, testimonials | Future Marketing PRD |
| About page at `/about` | Founder story, mission, team | Future Marketing PRD |
| Pricing page at `/pricing` | Subscription tiers, feature comparison, signup | PRD-31 (Subscription Tier System) |
| Blog comment threading | Reply-to-comment functionality | Post-MVP enhancement |
| Blog search | Full-text search across articles | Post-MVP enhancement |
| Blog RSS feed | RSS/Atom feed for subscribers who use feed readers | Post-MVP enhancement |
| Blog email newsletter | Email digest of new articles for subscribers | Post-MVP enhancement |
| Pinterest auto-pin | Auto-create Pinterest pins when articles are published | Post-MVP automation |
| Blog analytics in admin | Per-article traffic, referral sources, conversion tracking | Post-MVP (supplements PRD-32 Platform Overview) |
| Rich text editor for blog | Full WYSIWYG in the admin console for blog post creation | Post-MVP enhancement |

### Existing Stubs Wired by This PRD

| Stub | Created By | How It's Wired |
|------|-----------|----------------|
| Strategies & Snippets blog management | PRD-32 (Stub) | Fully defined: blog post management as a sub-section of the AI Vault admin tab. The name "Strategies & Snippets" is replaced by "Cookie Dough & Contingency Plans." |
| Dual-publish toggle infrastructure | PRD-32 (Stub) | Replaced by the "Showcase Feature" pattern: blog articles can reference MyAIM features via the `showcase_feature` field, creating a contextual CTA bridge without duplicating content. |
| Blog comments moderation | PRD-21C (Moderation tab) | Blog comments with `moderation_status = 'held'` appear in the existing Moderation tab under a "Blog Comments" filter. |

---

## What "Done" Looks Like

### MVP (Must Have)

**Public Site — Blog:**
- [ ] Domain-based routing configured: aimagicformoms.com serves public routes, myaimcentral.com serves authenticated app
- [ ] Blog home page (`/blog`) with Pinterest-style masonry card grid
- [ ] 7 category filter pills functional with URL updates
- [ ] Article cards showing featured image, category tag, title, date, read time, heart count
- [ ] Responsive grid: 3 columns desktop, 2 tablet, 1 mobile
- [ ] Load More pagination (12 articles per batch)
- [ ] Individual article view (`/blog/:slug`) with hero image, body rendering, heart reaction, CTA block, comments, related articles
- [ ] SEO: page titles, meta descriptions, Open Graph images, canonical URLs, Article JSON-LD structured data
- [ ] End-of-article CTA block with generic beta text and showcase-feature-aware variant
- [ ] Optional sticky bottom banner controlled by `is_blog_cta_banner_active` flag
- [ ] Blog footer with About AIMfM, Privacy links, copyright

**Public Site — Comments:**
- [ ] Comment form on article pages (text area + Post button, no signup)
- [ ] Geo-lookup on comment submission with "A mom from [City], [State] — or someone who loves one" format
- [ ] Fallback geo display: "A mom from somewhere wonderful — or someone who loves one"
- [ ] Haiku auto-moderation: positive/neutral auto-approve, negative/spam silently held
- [ ] Approved comments display immediately for the commenter
- [ ] Held comments show "Thanks! Your comment is being reviewed" message
- [ ] Comment text sanitized (no HTML)
- [ ] Rate limiting: 3 comments per IP per 10 minutes
- [ ] IP discarded after geo-lookup and rate check — not stored

**Public Site — Engagement:**
- [ ] Anonymous heart reactions on articles (device-fingerprint-based deduplication)
- [ ] Heart toggle (add/remove) with optimistic UI
- [ ] Heart counts displayed on cards and article pages
- [ ] Denormalized heart_count maintained by database trigger

**Public Site — Free Tools:**
- [ ] Free tools landing page (`/blog/tools`)
- [ ] Tool cards with type badges (Interactive, Download, Prompt Template)
- [ ] Individual tool pages (`/blog/tools/:slug`)
- [ ] Interactive tool embedding (iframe)
- [ ] Download delivery (signed Supabase Storage URLs)
- [ ] Prompt template display with "Copy Prompt" button

**Admin — Blog Management:**
- [ ] Blog Posts sub-section in AI Vault admin tab
- [ ] Blog post list with status tabs (All, Published, Drafts, Archived) and search
- [ ] Blog post editor form: title, auto-slug, category, excerpt, featured image, body (HTML/Markdown), SEO fields, showcase feature, custom CTA, publish controls
- [ ] Markdown → HTML conversion on save
- [ ] Read time auto-calculation from word count
- [ ] Scheduled publishing via Edge Function (15-minute cron)
- [ ] Free tools management sub-section with CRUD
- [ ] `blog_posts` table created with RLS policies
- [ ] `blog_engagement` table created with RLS policies
- [ ] `blog_comments` table created with RLS policies
- [ ] `blog_free_tools` table created with RLS policies
- [ ] `blog_categories` table created and seeded with 7 categories
- [ ] `blog-images` and `blog-tool-files` Supabase Storage buckets created
- [ ] Blog comment moderation integrated into PRD-21C Moderation tab with "Blog Comments" filter
- [ ] `blog-comment-moderate` Edge Function deployed
- [ ] `blog-publish-scheduled` Edge Function deployed (15-minute cron)

### MVP When Dependency Is Ready
- [ ] Authenticated users' hearts linked to user_id instead of device fingerprint (when auth is available on the public domain via shared session)

### Post-MVP
- [ ] Landing page at aimagicformoms.com `/`
- [ ] About and Pricing pages
- [ ] Blog search
- [ ] Comment threading
- [ ] RSS feed
- [ ] Email newsletter digest
- [ ] Pinterest auto-pin on publish
- [ ] Per-article traffic analytics in admin
- [ ] Rich text editor for blog post creation
- [ ] Pin image auto-generation (featured image + title overlay using a Canva-style template)

---

## CLAUDE.md Additions from This PRD

- [ ] Convention: The public site (aimagicformoms.com) and the authenticated app (myaimcentral.com) are served from the same codebase via domain-based routing. Public routes never import authenticated components. Code splitting keeps bundles separate.
- [ ] Convention: Blog comment IPs are used for geo-lookup and rate limiting only, then discarded. No IP addresses are ever stored in the database.
- [ ] Convention: Blog comments are auto-moderated by Haiku. Positive/neutral auto-approve. Negative/spam are silently held. The commenter is never told their comment was rejected — they see "being reviewed."
- [ ] Convention: Blog post `body_html` is admin-authored only (not user-generated) and rendered as-is. Comment text is sanitized (HTML stripped) and rendered as plain text.
- [ ] Convention: Blog heart deduplication uses device fingerprint for anonymous users and user_id for authenticated users. Both constraints are enforced at the database level via conditional UNIQUE indexes.
- [ ] Convention: Blog categories are seeded data in the `blog_categories` table. Adding a new category is a data insert, not a code change.

---

## DATABASE_SCHEMA.md Additions from This PRD

Tables defined: `blog_posts`, `blog_engagement`, `blog_comments`, `blog_free_tools`, `blog_categories`
Enums updated: None
Triggers added: `heart_count` trigger on `blog_engagement` INSERT/DELETE, `comment_count` trigger on `blog_comments` INSERT/UPDATE
Storage buckets: `blog-images`, `blog-tool-files`
Edge Functions: `blog-comment-moderate`, `blog-publish-scheduled`

---

## Decisions Made This Session

### Decided

| # | Decision | Rationale |
|---|----------|-----------|
| 1 | Name: "Cookie Dough & Contingency Plans" with hover "Where the good stuff lives — articles, hacks, and free tools for real moms" | Directly from the brand voice doc. Memorable, warm, perfectly on-brand. No other EdTech company would name their blog this. |
| 2 | Same codebase, domain-based routing (aimagicformoms.com + myaimcentral.com) | Shared design system and component library. One deploy. Domain routing handled by Vercel configuration. |
| 3 | 7 blog categories: Hacks & How-Tos, AI for Real Life, Homeschool & Education, Special Needs & Disability, Our Story, What's New, Free Tools | Maps cleanly to the 29+ article ideas in the Content Marketing doc. Covers all content types including the homeschool marketing priority. |
| 4 | Simple metadata form for content creation (not WYSIWYG) | Founder writes in Claude/Gamma/Docs. Admin console is for publishing and managing, not writing. Avoids significant engineering complexity. |
| 5 | Anonymous comments with AI auto-moderation | Positive/neutral auto-publish. Negative/spam silently held. Zero friction for commenters. Warm community tone enforced automatically. |
| 6 | Geo-based display: "A mom from [City], [State] — or someone who loves one" | On-brand, warm, inclusive (covers moms, dads, grandparents, anyone). IP discarded after lookup — privacy-first. |
| 7 | Anonymous hearts (device-fingerprint-based) | Zero friction. One heart per device per article. Accepted trade-off that sophisticated users could re-heart. |
| 8 | Blog admin lives in AI Vault tab (not a new admin tab) | Similar workflow to Vault content management. Same person manages both. Uses existing `vault_admin` permission. |
| 9 | Showcase Feature pattern instead of dual-publish | Blog articles reference MyAIM features via a link, creating contextual CTAs. Content lives in one place, not duplicated. |
| 10 | Mix of embedded and downloadable free tools | Different tools suit different formats. SDS generator is interactive. Hours tracker template is a PDF download. Prompt templates are copyable text. |
| 11 | CTA banner is configurable (flag-controlled) | Right level of CTA prominence depends on how it feels with real content. Flag allows experimentation without code changes. |

### Deferred

| # | What's Deferred | Resolution Path |
|---|----------------|----------------|
| 1 | Landing page, About page, Pricing page | Future Marketing PRD |
| 2 | Blog search | Post-MVP |
| 3 | Comment threading | Post-MVP |
| 4 | RSS feed | Post-MVP |
| 5 | Email newsletter | Post-MVP |
| 6 | Pinterest auto-pin | Post-MVP automation |
| 7 | Per-article traffic analytics | Post-MVP |
| 8 | Rich text editor | Post-MVP |
| 9 | Pin image auto-generation | Post-MVP |
| 10 | Exact CTA placement decision (banner + end-of-article vs. end-of-article only) | Configurable — decided at content time via flag |

### Cross-PRD Impact

| PRD Affected | What Changed | Action Needed |
|-------------|-------------|---------------|
| PRD-21B (AI Vault Admin) | AI Vault admin tab gains Blog Posts and Free Tools sub-sections alongside existing Vault Content. | Add sub-navigation to AI Vault admin tab. |
| PRD-21C (Moderation) | Moderation tab gains a "Blog Comments" filter for held blog comments. Same approve/delete actions as Vault comment moderation. | Add blog_comments as a moderation source in the Moderation tab. |
| PRD-03 (Design System) | Blog uses the brand design system (colors, typography) on a public-facing surface. This is the first public use of the design system outside the authenticated app. | Ensure design system tokens are available to public route components. |
| PRD-04 (Shell Routing) | Domain-based routing added. Top-level router checks hostname to determine route tree (public vs. authenticated). | Add domain-check logic to root router. Configure Vercel for both domains. |
| PRD-32 (Admin Console) | "Strategies & Snippets blog management" stub is resolved. "Dual-publish toggle infrastructure" stub is replaced by the Showcase Feature pattern. | Update stub status in PRD-32. |
| Content Marketing & Pinterest Strategy doc | Pipeline is now buildable — the blog platform exists. Article ideas map to categories. Pin strategy has a destination. | Begin content production pipeline after blog is deployed. |
| Build Order Source of Truth | PRD-38 completed. Blog/public site is a new platform surface. | Add to completed PRDs. Note domain configuration as a pre-build setup step. |

---

*End of PRD-38*
