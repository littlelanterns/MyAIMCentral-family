# PRD-37: Family Feeds

**Status:** Not Started
**Dependencies:** PRD-01 (Auth & Family Setup), PRD-02 (Permissions & Access Control), PRD-03 (Design System & Themes), PRD-04 (Shell Routing & Layouts), PRD-05 (LiLa Core AI System), PRD-08 (Journal + Smart Notepad), PRD-10 (Widgets, Trackers & Dashboard Layout), PRD-11 (Victory Recorder + Daily Celebration), PRD-14D (Family Hub), PRD-15 (Messages, Requests & Notifications), PRD-17 (Universal Queue & Routing System), PRD-17B (MindSweep), PRD-28 (Tracking, Allowance & Financial)
**Created:** March 18, 2026
**Last Updated:** March 18, 2026

---

## Overview

PRD-37 defines Family Feeds — a private, social-media-style feed system where families capture and share moments, memories, and learning experiences in a scrollable, visual timeline. There are no algorithms, no ads, no strangers, and no comparison traps. This is the family's own social network, entirely within MyAIM.

The Feeds page uses a tab architecture. Every family gets the **Family Life Feed** tab — shared memories, everyday moments, funny things, milestones. Families who activate homeschool tracking (PRD-28) additionally unlock the **Homeschool Portfolio Feed** tab — a filtered view showing only education-tagged content that doubles as visual compliance documentation. Future tab types (e.g., Individual Reporting Portfolios for disability/progress tracking) are stubbed in the architecture but not built at MVP.

Content flows in one direction by default: **portfolio content stays in its portfolio unless someone deliberately shares it to the Family Feed.** Family Feed content can be pulled into a portfolio by tagging. This prevents homeschool worksheets and daily math assignments from cluttering the family's shared memory space while allowing genuinely share-worthy learning moments — science experiments, art projects, field trip photos — to appear in both views.

Beyond documentation, the Family Feed serves as a **social media training ground**. Kids and teens learn to post, comment, react, and share in a safe family environment before they ever encounter public social media. Mom can coach communication habits in a context where the stakes are low and the audience is family.

> **Mom experience goal:** I open the Family Feed and see what my family has been up to — a photo my teen posted, a voice-transcribed note from my 6-year-old about her drawing, a family dinner snapshot. When I switch to the Homeschool Portfolio tab, I see a clean timeline of learning evidence organized by student and subject. I didn't file a single report — I just captured moments, and the system organized them. When my adult son who moved out last year opens the app, he sees the family feed and feels connected to his siblings' daily lives.

---

## Key Design Principles

1. **Capture, not paperwork.** Posting to a feed should feel like sharing a moment on social media, not filing a compliance report. The system handles organization and tagging.
2. **Portfolio content is private by default.** Homeschool entries stay in the portfolio unless mom or the contributor explicitly shares to the Family Feed. No clutter.
3. **Family Feed content is opt-in for portfolios.** A fun field trip photo on the Family Feed can be tagged as learning evidence and pulled into the Homeschool Portfolio, but nothing flows there automatically.
4. **The Log Learning widget is the everyday workhorse.** Kids capture learning through the same widget on their dashboard. The portfolio feed is a *view* of captured data, not a separate capture surface.
5. **Voice is an input method, not a stored format.** Voice recordings are transcribed via Whisper. The transcription persists as post text. Audio is temporarily stored for 30 days with a download button, then auto-deleted.
6. **Out of Nest members are first-class participants.** Adult children who've left home can view, react, comment, and (with mom's permission) post to the Family Feed. This is their primary app entry point.

---

## User Stories

### Family Life Feed
- As any family member, I want to post photos, text, and voice-transcribed notes to a shared family feed so we can capture and relive everyday moments together.
- As a mom, I want to scroll through our family's recent moments chronologically so I can see what everyone has been up to.
- As a teen, I want to post things to the family feed from my phone so my family sees what I'm doing without me having to text everyone individually.
- As a guided child, I want to share a photo or voice note about something cool I did so my family can see it.
- As an Out of Nest adult child, I want to see my family's daily life and share photos of my own life back so we stay connected across distance.
- As any family member, I want to react to posts with hearts so people know I saw and appreciated what they shared.

### Homeschool Portfolio Feed
- As a homeschool mom, I want a separate scrollable feed showing only education-tagged content so I can browse our learning evidence without family life posts mixed in.
- As a homeschool mom, I want to tag a Family Feed post as learning evidence so genuinely educational family moments also count in our portfolio.
- As a homeschool kid, I want to see my own homeschool portfolio so I can feel proud of what I've accomplished and add my own learning experiences.
- As a homeschool mom, I want LiLa to auto-tag subjects and suggest standards alignment on portfolio entries so I don't have to manually categorize everything.
- As a homeschool mom, I want to flag portfolio entries as "Portfolio Highlights" so the best work stands out in exports.

### Mom's Bulk Summary
- As a homeschool mom, I want to do a quick voice dump summarizing what all my kids did this week and have LiLa sort it into individual portfolio entries per child so I can document a whole week in two minutes.
- As a mom, I want LiLa to estimate time per activity and suggest subject tags based on my description so I don't have to think about categorization.
- As a mom, I want to review, edit, and approve everything LiLa sorts before it saves so I stay in control.

### Social Media Training
- As a parent, I want my kids to practice posting, commenting, and reacting in our private family feed so they develop healthy social media habits before encountering public platforms.
- As a mom, I want the option to turn on post approval for specific children so I can review what they share before it goes live.

### Out of Nest
- As an Out of Nest family member, I want the Family Feed to be my primary app experience with a message indicator so I can quickly check family moments and messages.
- As an Out of Nest family member, I want to post photos and text back to the family feed (if mom has given me permission) so my younger siblings can see what I'm up to.
- As a mom, I want to control per Out of Nest member whether they can see all posts or a filtered set, and whether they can post or only view and react.

---

## Screens

### Screen 1: Feeds Page — Tab Navigation

> **Depends on:** PRD-04 (Shell Routing) for top-level navigation slot. PRD-14D (Family Hub) for the widget/link integration.

**What the user sees:**

A full-page view accessible from the main navigation sidebar. At the top: tabs for the available feed views.

```
┌──────────────────────────────────────────────┐
│  Feeds                                       │
│  ─────────────────────────────────────────── │
│  [Family] [Homeschool Portfolio]             │
│  ─────────────────────────────────────────── │
│                                              │
│  (Selected feed content below — see          │
│   Screens 2 and 3)                           │
│                                              │
│  ┌──────────────────────────────────────┐   │
│  │            [+ New Post]              │   │
│  └──────────────────────────────────────┘   │
└──────────────────────────────────────────────┘
```

**Tab visibility rules:**
- **Family** tab: Always visible for all families.
- **Homeschool Portfolio** tab: Visible only when the family has configured homeschool subjects (PRD-28 `homeschool_subjects` table has records). Mom sees per-student sub-filters within the tab.
- **Future tabs** (e.g., Progress Portfolio): Architecture supports additional tabs activated by configuration. Stubbed, not built at MVP.

**Interactions:**
- Tapping a tab switches the feed view below. Tab selection persists for the session.
- [+ New Post] FAB opens the post creation modal (Screen 4).
- Scroll is infinite with lazy loading (newest first).

**Shell behavior:**
- **Mom Shell:** All tabs visible (based on family config). Full post/edit/delete/tag capabilities on all content. Filter controls for per-member views.
- **Dad / Additional Adult Shell:** Family tab always visible. Homeschool Portfolio tab if permitted. Can post, react, comment. Cannot delete others' posts.
- **Independent (Teen) Shell:** Family tab visible. Their individual Homeschool Portfolio visible (own content + family content they're tagged in). Can post, react, comment. Posts go live immediately unless mom has enabled approval.
- **Guided Shell:** Family tab visible (shared family content + their own posts). Individual Homeschool Portfolio visible if Log Learning widget is assigned. Simplified post creation (photo + voice note + sticker). Posts go to approval queue if mom has enabled approval.
- **Play Shell:** Family tab visible as a read-only scrollable view. Can react with stickers/emojis. Cannot create posts (mom posts on their behalf). Individual Homeschool Portfolio not visible.
- **Special Adult Shell:** Not present. Feeds are not accessible during caregiver shifts.
- **Out of Nest Shell:** Family tab visible (filtered per mom's default setting for that member). Can react and comment. Can post if mom has granted posting permission. No access to portfolio tabs.

---

### Screen 2: Family Life Feed

**What the user sees:**

A scrollable, social-media-style timeline of family moments. Newest first. Each post is a card showing:

```
┌──────────────────────────────────────────────┐
│  [Avatar] Emma · 2 hours ago                 │
│  ─────────────────────────────────────────── │
│  ┌──────────────────────────────────────┐   │
│  │                                      │   │
│  │         (Photo / Image)              │   │
│  │                                      │   │
│  └──────────────────────────────────────┘   │
│                                              │
│  "Look at the frog we found at the creek!"   │
│                                              │
│  🔊 Listen (27 days left)    📥 Download     │
│                                              │
│  ♡ 4   💬 2                                  │
│  ─────────────────────────────────────────── │
│  Dad: That's awesome!                        │
│  Zy: so cool                                 │
│  [Add comment...]                            │
└──────────────────────────────────────────────┘
```

**Post card elements:**
- **Contributor avatar + name + relative timestamp**
- **Media:** Photo(s), document thumbnail, or none (text-only post)
- **Text content:** The post body. For voice-transcribed posts, this is the Whisper transcription.
- **Audio indicator** (if voice recording exists within 30-day window): "🔊 Listen" with playback + "📥 Download" button. After 30 days, this row disappears.
- **Reactions:** Heart count. Tapping the heart toggles your reaction.
- **Comments:** Count shown. Expandable inline comment thread.
- **Tagged members:** If specific family members are tagged (not whole-family), shows "[Emma, Zy]" as a subtle tag line.

**Filter bar** (visible to mom, dad, and independent teens):
- **Whole Family** (default): All posts.
- **Individual member filter:** Dropdown or horizontal scroll of member avatars. Selecting a member shows posts by that member OR posts where that member is tagged.

**Interactions:**
- Scroll loads more posts (infinite scroll, paginated query).
- Tap a photo to view full-screen.
- Tap heart to toggle reaction.
- Tap comment count to expand/collapse comment thread.
- Long-press a post (or tap ⋮ menu) for options: Edit (own posts only), Delete (own posts or mom can delete any), Tag as Homeschool (mom only — adds to portfolio), Celebrate This (creates a victory record), Share to Out of Nest (if Out of Nest is filtered).
- Mom-only actions via ⋮ menu: Edit tags, Remove post, Flag for portfolio.

**Data created/updated:**
- `family_moments` records (posts)
- `moment_reactions` records (hearts)
- `moment_comments` records (comments)

---

### Screen 3: Homeschool Portfolio Feed

> **Depends on:** PRD-28 (Tracking, Allowance & Financial) for `homeschool_subjects`, `homeschool_configs`, and `homeschool_time_logs`. Homeschool Portfolio tab only appears when `homeschool_subjects` has records for this family.

**What the user sees:**

Same scrollable card layout as the Family Life Feed, but filtered to only show moments tagged with `homeschool` or any subject tag. Additional metadata displayed per card:

```
┌──────────────────────────────────────────────┐
│  [Avatar] Zy · Yesterday                     │
│  ─────────────────────────────────────────── │
│  ┌──────────────────────────────────────┐   │
│  │                                      │   │
│  │    (Photo of t-shirt design)         │   │
│  │                                      │   │
│  └──────────────────────────────────────┘   │
│                                              │
│  "Designed a t-shirt in Canva — learned      │
│   about color theory and layout"             │
│                                              │
│  📚 Art, Technology · ⏱ 45 min              │
│  🔗 Standard: VA.3.CR.1 (Create artwork)    │
│  ⭐ Portfolio Highlight                      │
│                                              │
│  ♡ 2   💬 1                                  │
└──────────────────────────────────────────────┘
```

**Additional portfolio metadata on each card:**
- **Subject tags:** Displayed as colored chips (Art, Technology, Reading, etc.)
- **Time logged:** Minutes from the linked `homeschool_time_logs` entry.
- **Standards linkage** (if assigned): Which standard(s) this entry evidences.
- **Portfolio Highlight badge** (if flagged by mom): Visual indicator for export inclusion.
- **Student attribution:** Who did this work.

**Sub-filters (top of feed, below tab bar):**
- **All Students** (default): Combined portfolio view across all homeschool children.
- **Individual student filter:** Horizontal scroll of homeschool student avatars. Selecting one shows only that student's portfolio.
- **Subject filter:** Dropdown to filter by a specific subject.
- **Date range filter:** Quick picks (This Week, This Month, This Quarter, Custom).
- **Highlights Only toggle:** Shows only entries flagged as Portfolio Highlights.

**The Log Learning widget appears at the top of this view** (same widget as on the student's dashboard per PRD-28), providing quick entry without navigating elsewhere.

**Interactions:**
- All Family Life Feed interactions plus:
- Tap subject chips to filter by that subject.
- Tap standards linkage to view the standard in the Standards Portfolio (PRD-28B).
- Mom can tap any entry to: edit subject tags, edit time logged, link/unlink standards, toggle Portfolio Highlight, or add to Family Feed.
- [Export Portfolio] button in the filter bar → triggers portfolio export flow (defined in PRD-28B).

**Data created/updated:**
- Same `family_moments` records, filtered by tags.
- Portfolio-specific metadata stored on the moment record (subject_tags, time_minutes, standards_links, is_highlight).

---

### Screen 4: New Post Creation Modal

**What the user sees:**

A modal or full-screen overlay for creating a new post. Layout adapts to the contributor's shell.

**Mom / Dad / Independent Teen version:**

```
┌──────────────────────────────────────────────┐
│  New Post                                ✕   │
│  ─────────────────────────────────────────── │
│  Posting to: [Family Feed ▼]                 │
│                                              │
│  ┌──────────────────────────────────────┐   │
│  │ What's happening?                    │   │
│  │                                      │   │
│  │                                      │   │
│  └──────────────────────────────────────┘   │
│                                              │
│  [📷 Photo] [📄 Document] [🎤 Voice]       │
│                                              │
│  Tag family members: [+ Add]                 │
│                                              │
│  ☐ Also add to Homeschool Portfolio          │
│    └ Student: [picker]                       │
│    └ Subject(s): [picker]                    │
│                                              │
│  ☐ Also celebrate this! (Victory)            │
│                                              │
│              [Post]  [Cancel]                │
└──────────────────────────────────────────────┘
```

**"Posting to" dropdown options:**
- **Family Feed** (default when on Family tab)
- **Homeschool Portfolio** (default when on Portfolio tab — does NOT auto-share to Family Feed)
- **Both** (appears in both feeds)

**When posting to Homeschool Portfolio (or checking "Also add to Homeschool Portfolio"):**
- Student picker appears (which child is this about?)
- Subject picker appears (which subjects? Multi-select from family's `homeschool_subjects`)
- Time field appears (minutes — optional, LiLa can estimate)
- Standards linkage (optional — searchable from imported standards list)

**Media options:**
- **📷 Photo:** Camera or gallery pick. Multiple photos supported. Auto-compressed on upload.
- **📄 Document:** File picker for PDFs, images of worksheets, etc. Stored in Supabase Storage.
- **🎤 Voice:** Records audio → Whisper transcribes → transcription becomes post text. Audio stored for 30 days with download option, then auto-deleted. Mom can edit transcription (especially useful for younger kids whose speech Whisper can't parse well).

**Guided Child version:**
- Simplified: Large photo button, large voice button, sticker/emoji selector.
- Text field is optional (voice transcription fills it).
- No "Posting to" dropdown — posts go to Family Feed. If Log Learning widget is assigned, a separate "Add Learning" button routes through the widget flow instead.
- Posts route to mom's approval queue if approval is enabled (see Screen 6).

**Play Child version:**
- Not available. Mom posts on behalf of Play children.

**Interactions:**
- [Post] validates that at least text or media is present, then creates the moment record.
- If posting to portfolio: creates `family_moments` record with appropriate tags AND creates/links `homeschool_time_logs` record if time is entered.
- If "Also celebrate this!" is checked: creates a `victory_records` entry via PRD-11.
- If approval is enabled for this contributor: moment is created with `status = 'pending_approval'` and routes to PRD-17 Universal Queue.

**Data created:**
- `family_moments` record
- `moment_media` records (for each attached photo/document/audio)
- Optionally: `homeschool_time_logs` record (if portfolio with time)
- Optionally: `victory_records` record (if celebrated)
- Optionally: `universal_queue_items` record (if approval required)

---

### Screen 5: Mom's Bulk Summary (Homeschool)

> **Mom experience goal:** I sit down Sunday evening, hit record, and talk for two minutes about what everyone did this week. LiLa turns that into organized portfolio entries for each kid. I review, tweak, and approve. Done.

**What the user sees:**

Accessible from: Homeschool Portfolio tab → [+ Bulk Add] button, or from any input surface that supports the universal bulk add pattern (MindSweep, Smart Notepad "Send to... → Homeschool Portfolio").

**Step 1: Input**
```
┌──────────────────────────────────────────────┐
│  Bulk Add to Portfolio                   ✕   │
│  ─────────────────────────────────────────── │
│  Summarize what your family learned this     │
│  week. Mention names, activities, and        │
│  subjects — LiLa will sort it all out.       │
│                                              │
│  [🎤 Record]  or  type below:               │
│                                              │
│  ┌──────────────────────────────────────┐   │
│  │ This week Zy read 3 Great Battles   │   │
│  │ for Boys books, designed a t-shirt   │   │
│  │ in Canva, did a drawing of the      │   │
│  │ mouse from Despereaux and learned    │   │
│  │ about shading...                     │   │
│  └──────────────────────────────────────┘   │
│                                              │
│              [Let LiLa Sort This]            │
└──────────────────────────────────────────────┘
```

**Step 2: LiLa Review (Human-in-the-Mix)**

LiLa parses the input, identifies children mentioned, breaks content into individual learning entries, estimates time per activity, and suggests subject tags. Presents everything in an organized, editable view:

```
┌──────────────────────────────────────────────┐
│  LiLa sorted your summary into 6 entries:    │
│  ─────────────────────────────────────────── │
│                                              │
│  📘 Zy                                       │
│  ┌────────────────────────────────────┐     │
│  │ Read 3 Great Battles for Boys      │     │
│  │ 📚 Reading · ⏱ ~90 min            │     │
│  │ [Edit] [Remove]                    │     │
│  ├────────────────────────────────────┤     │
│  │ Designed a t-shirt in Canva        │     │
│  │ 📚 Art, Technology · ⏱ ~45 min    │     │
│  │ [Edit] [Remove]                    │     │
│  ├────────────────────────────────────┤     │
│  │ Drawing of mouse from Despereaux   │     │
│  │ (learned about shading, wrapping   │     │
│  │ paper tightly to make stubs)       │     │
│  │ 📚 Art · ⏱ ~30 min               │     │
│  │ [Edit] [Remove]                    │     │
│  ├────────────────────────────────────┤     │
│  │ Synthesis math assignments (daily) │     │
│  │ 📚 Math · ⏱ ~150 min (5 days)    │     │
│  │ [Edit] [Remove]                    │     │
│  ├────────────────────────────────────┤     │
│  │ Around the World in 80 Days class  │     │
│  │ 📚 Geography, Literature · ⏱ ~60m │     │
│  │ [Edit] [Remove]                    │     │
│  ├────────────────────────────────────┤     │
│  │ Art class                          │     │
│  │ 📚 Art · ⏱ ~60 min               │     │
│  │ [Edit] [Remove]                    │     │
│  └────────────────────────────────────┘     │
│                                              │
│  💬 LiLa: "Roughly how long were the        │
│  Around the World class and art class?"      │
│                                              │
│  ☐ Also share summaries to Family Feed       │
│  ☐ Also celebrate these as victories         │
│                                              │
│        [Approve All]  [Edit Individual]      │
└──────────────────────────────────────────────┘
```

**LiLa's behavior:**
- Identifies children by name from the family's member list.
- Breaks activities into individual entries (one per distinct learning event).
- Suggests subjects from the family's configured `homeschool_subjects`.
- Estimates time based on activity type (reading = ~30 min/book for children, class = ~60 min, daily assignments = ~30 min/day × days mentioned).
- Asks at most 1-2 simple clarifying questions — never an interrogation. Questions appear inline as a LiLa message, not a form.
- If multiple children are mentioned, entries are grouped by child.
- If a child mentioned is not recognized, LiLa asks: "I don't recognize [name] — which family member is this?"

**Interactions:**
- [Edit] on any entry opens an inline editor: change text, subjects, time, or student attribution.
- [Remove] deletes an entry from the batch.
- [Approve All] creates `family_moments` records (homeschool-tagged) and linked `homeschool_time_logs` records for all entries.
- [Edit Individual] lets mom work through entries one at a time.
- Checkboxes for optional Family Feed sharing and victory creation apply to all entries in the batch.

**Data created:**
- Multiple `family_moments` records (one per entry, tagged `homeschool` + subjects)
- Multiple `homeschool_time_logs` records (one per entry per subject)
- Optionally: `victory_records` entries
- Optionally: duplicate/linked `family_moments` entries visible on Family Feed

> **Decision rationale:** The bulk summary feature uses the same MindSweep intelligence pattern (PRD-17B) — context-aware parsing and routing from unstructured input. The difference is that MindSweep routes across the whole platform, while this is specifically scoped to homeschool portfolio entries. The implementation shares the same embedding-first classification approach.

---

### Screen 6: Post Approval Queue

> **Depends on:** PRD-17 (Universal Queue) for the approval routing infrastructure.

**What the user sees:**

When mom has enabled post approval for a child, that child's posts arrive in mom's Universal Queue Requests tab with `source = 'family_feed_post'`.

```
┌──────────────────────────────────────────────┐
│  📋 Requests                                 │
│  ─────────────────────────────────────────── │
│  Family Feed Post — Emma (3 min ago)         │
│  ┌────────────────────────────────────┐     │
│  │ (Photo preview)                    │     │
│  │ "Look at the frog we found!"       │     │
│  └────────────────────────────────────┘     │
│  [Approve] [Edit & Approve] [Reject]         │
└──────────────────────────────────────────────┘
```

**Interactions:**
- [Approve] sets moment status to `published` and it appears in the feed.
- [Edit & Approve] opens the post in edit mode — mom can change text, tags, or remove media before approving.
- [Reject] deletes the moment. A gentle notification goes to the child: "Your post wasn't shared this time."

> **Decision rationale:** Post approval is opt-in per child, not a system default. The default is posts go live immediately. Mom enables approval in Settings (PRD-22) on a per-member basis. Most families won't need this — it exists for families who want to coach social media habits with a review step.

---

### Screen 7: Out of Nest Family Feed View

> **Depends on:** PRD-15 (Messages, Requests & Notifications) for the `out_of_nest_members` table and auth flow.

**What the user sees:**

Out of Nest members see a lightweight shell optimized for the Family Feed as their primary experience:

```
┌──────────────────────────────────────────────┐
│  [Family Name] Family Feed    ✉️ 3   🔔 1   │
│  ─────────────────────────────────────────── │
│                                              │
│  (Scrollable Family Feed — same as Screen 2  │
│   but filtered per mom's visibility setting   │
│   for this Out of Nest member)               │
│                                              │
│  [+ New Post]  (if posting permission ON)    │
│                                              │
└──────────────────────────────────────────────┘
```

**Header elements:**
- Family name
- ✉️ envelope icon with unread message count → tapping opens Messages (PRD-15)
- 🔔 notification bell with unread count → tapping opens notification tray
- Profile/settings icon

**This is the recommended PWA entry point for Out of Nest members.** When saved to their phone's home screen, it opens directly to this view — a dedicated family social app.

**Visibility settings (configured by mom in PRD-22 Settings per Out of Nest member):**
- **See All:** Every Family Feed post is visible.
- **Filtered:** Mom selects which post tags or member types are visible. For example, mom might filter out certain posts but include posts by/about specific family members.

**Posting permissions (configured by mom per Out of Nest member):**
- **View & React Only:** Can see posts, react with hearts, comment. Cannot create new posts.
- **Can Post:** Full posting capability — photo, text, voice-transcribed. Posts go live immediately (no approval queue for adults).

> **Forward note:** Extended family access (grandparents, aunts, etc.) is a future enhancement. The architecture supports additional access tiers beyond Out of Nest. Stubbed as a configuration option in the Out of Nest permissions — not built at MVP.

---

### Screen 8: Family Feed Widget on Family Hub

> **Depends on:** PRD-14D (Family Hub) for the widget grid and shared family display surface.

**What the user sees:**

A "Recent Moments" widget on the Family Hub showing the 3-5 most recent Family Feed posts in a compact card format:

```
┌──────────────────────────────────────────────┐
│  Recent Moments                    [See All] │
│  ─────────────────────────────────────────── │
│  📸 Emma · 2h ago                            │
│  "Look at the frog we found!"  ♡ 4           │
│  ─────────────────────────────────────────── │
│  📝 Zy · 5h ago                              │
│  "Finished my book report!"  ♡ 2             │
│  ─────────────────────────────────────────── │
│  📸 Dad · Yesterday                          │
│  "Saturday morning pancakes"  ♡ 6            │
└──────────────────────────────────────────────┘
```

**Interactions:**
- [See All] navigates to the Feeds page (Family tab).
- Tapping any moment card opens it in context on the Feeds page.
- Hearts are display-only on the widget — full interaction on the Feeds page.

---

## Visibility & Permissions

| Role | Access | Notes |
|------|--------|-------|
| Mom / Primary Parent | Full access | All tabs. Post, edit, delete any post. Configure approval, Out of Nest visibility, portfolio tagging. Filter by any member. |
| Dad / Additional Adult | Family Feed: full participation. Portfolio: view if mom grants access. | Can post, react, comment. Cannot delete others' posts. Cannot configure approval or Out of Nest settings. |
| Special Adult | Not present | Feeds are not accessible during caregiver shifts. |
| Independent (Teen) | Family Feed: full participation. Own Homeschool Portfolio: view and contribute via Log Learning widget. | Posts go live immediately unless mom enables approval. Can react, comment on all visible posts. |
| Guided | Family Feed: view + simplified posting. Own Homeschool Portfolio: view only (contribute via Log Learning widget on dashboard). | Simplified post creation. Approval optional per mom's setting. |
| Play | Family Feed: read-only with sticker reactions. No portfolio access. | Cannot create posts. Mom posts on their behalf. |
| Out of Nest | Family Feed only: view/react/comment + post (if permitted). No portfolio access. | Visibility and posting controlled per member by mom. |

### Privacy & Transparency
- Portfolio feeds are never visible to Out of Nest members — compliance documentation stays within the household.
- Play children see the Family Feed but cannot see portfolio tabs or any compliance metadata.
- All financial data from PRD-28 is excluded from feed displays — subject hours appear, but dollar amounts never do.
- Teens can see their own portfolio entries but not siblings' portfolio entries (unless siblings' entries are also on the Family Feed).

---

## Data Schema

### Table: `family_moments`

The core table for all feed content. Every post is a moment.

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NOT NULL | PK |
| family_id | UUID | | NOT NULL | FK → families |
| contributor_id | UUID | | NOT NULL | FK → family_members (who created this post) |
| contributor_type | TEXT | 'family_member' | NOT NULL | 'family_member' or 'out_of_nest'. Determines FK target. |
| out_of_nest_contributor_id | UUID | | NULL | FK → out_of_nest_members. Set when contributor_type = 'out_of_nest'. |
| content_text | TEXT | | NULL | Post body text. NULL for media-only posts. |
| voice_transcription_source | BOOLEAN | false | NOT NULL | Whether content_text came from Whisper transcription. |
| status | TEXT | 'published' | NOT NULL | Enum: 'published', 'pending_approval', 'rejected', 'archived' |
| feed_visibility | TEXT[] | '{family_life}' | NOT NULL | Array: 'family_life', 'homeschool'. Determines which tabs show this moment. |
| tagged_members | UUID[] | '{}' | NOT NULL | Family members this post is about (for filtering). Empty = whole family. |
| subject_tags | TEXT[] | '{}' | NOT NULL | Homeschool subject names when feed_visibility includes 'homeschool'. |
| time_minutes | INTEGER | | NULL | Logged time for portfolio entries. NULL for non-educational posts. |
| standards_links | UUID[] | '{}' | NOT NULL | FK → education_standards (defined in PRD-28B). |
| is_portfolio_highlight | BOOLEAN | false | NOT NULL | Flagged for portfolio export inclusion. |
| is_victory | BOOLEAN | false | NOT NULL | Whether this moment was also shared as a victory. |
| victory_id | UUID | | NULL | FK → victory_records if is_victory = true. |
| homeschool_time_log_id | UUID | | NULL | FK → homeschool_time_logs if linked to a time log entry. |
| source | TEXT | 'direct' | NOT NULL | 'direct' (posted in feed), 'log_learning' (from widget), 'bulk_summary' (from mom's bulk add), 'mindsweep' (routed from MindSweep), 'task_completed' (auto-generated from task) |
| source_reference_id | UUID | | NULL | FK to source record (task_id, log_learning entry, etc.) |
| metadata | JSONB | '{}' | NOT NULL | Flexible field for future extensions. |
| created_at | TIMESTAMPTZ | now() | NOT NULL | |
| updated_at | TIMESTAMPTZ | now() | NOT NULL | Auto-trigger |

**RLS Policy:** Family-scoped. Mom reads all, writes all, deletes all. Members read moments matching their visibility scope (family_life for most; homeschool filtered to own entries for teens). Out of Nest reads moments matching their configured visibility. Contributors can update/delete own moments.

**Indexes:**
- `(family_id, created_at DESC)` — main feed query (newest first)
- `(family_id, feed_visibility, created_at DESC)` — tab-filtered feed queries (GIN on feed_visibility)
- `(family_id, contributor_id, created_at DESC)` — per-member filtered view
- `(family_id, status)` — pending approval queue
- `(family_id, tagged_members)` — member-tagged queries (GIN)
- `(family_id, subject_tags, created_at DESC)` — subject-filtered portfolio (GIN)
- `(family_id, is_portfolio_highlight, created_at DESC)` — highlights-only view

---

### Table: `moment_media`

Media attachments for moments. One moment can have multiple media items.

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NOT NULL | PK |
| moment_id | UUID | | NOT NULL | FK → family_moments |
| family_id | UUID | | NOT NULL | FK → families (for RLS) |
| media_type | TEXT | | NOT NULL | Enum: 'photo', 'document', 'voice_recording' |
| storage_url | TEXT | | NOT NULL | Supabase Storage URL |
| thumbnail_url | TEXT | | NULL | Compressed thumbnail for feed display (photos) |
| original_filename | TEXT | | NULL | For documents: original filename |
| file_size_bytes | INTEGER | | NULL | For monitoring storage usage |
| mime_type | TEXT | | NULL | e.g., 'image/jpeg', 'application/pdf', 'audio/webm' |
| voice_expires_at | TIMESTAMPTZ | | NULL | For voice_recording type: 30 days from upload. NULL for other types. |
| sort_order | INTEGER | 0 | NOT NULL | Display order within the moment |
| created_at | TIMESTAMPTZ | now() | NOT NULL | |

**RLS Policy:** Follows parent `family_moments` record's visibility.

**Indexes:**
- `(moment_id, sort_order)` — ordered media for a moment
- `(media_type, voice_expires_at)` — voice recording cleanup cron query

> **Decision rationale:** Voice recordings stored with a 30-day TTL (`voice_expires_at`). A scheduled Supabase Edge Function runs daily, deleting `moment_media` records where `media_type = 'voice_recording' AND voice_expires_at < now()` and removing the corresponding file from Supabase Storage. The transcription on the parent `family_moments.content_text` is permanent.

---

### Table: `moment_reactions`

Heart reactions on moments.

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NOT NULL | PK |
| moment_id | UUID | | NOT NULL | FK → family_moments |
| family_id | UUID | | NOT NULL | FK → families (for RLS) |
| reactor_id | UUID | | NOT NULL | FK → family_members or out_of_nest_members |
| reactor_type | TEXT | 'family_member' | NOT NULL | 'family_member' or 'out_of_nest' |
| reaction_type | TEXT | 'heart' | NOT NULL | MVP: 'heart' only. Future: additional reaction types. |
| created_at | TIMESTAMPTZ | now() | NOT NULL | |

**RLS Policy:** Family-scoped. All members with feed access can create/delete own reactions. Read follows moment visibility.

**Indexes:**
- `(moment_id, reactor_id)` UNIQUE — one reaction per person per moment
- `(moment_id)` — reaction count query

---

### Table: `moment_comments`

Comments on moments.

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NOT NULL | PK |
| moment_id | UUID | | NOT NULL | FK → family_moments |
| family_id | UUID | | NOT NULL | FK → families (for RLS) |
| author_id | UUID | | NOT NULL | FK → family_members or out_of_nest_members |
| author_type | TEXT | 'family_member' | NOT NULL | 'family_member' or 'out_of_nest' |
| content_text | TEXT | | NOT NULL | Comment body |
| created_at | TIMESTAMPTZ | now() | NOT NULL | |
| updated_at | TIMESTAMPTZ | now() | NOT NULL | Auto-trigger |

**RLS Policy:** Family-scoped. All members with feed access can create comments. Authors can update/delete own. Mom can delete any.

**Indexes:**
- `(moment_id, created_at ASC)` — chronological comment thread
- `(author_id)` — comments by a specific person

---

### Table: `out_of_nest_feed_settings`

Per-Out-of-Nest-member feed configuration. Extends the `out_of_nest_members` table from PRD-15.

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NOT NULL | PK |
| family_id | UUID | | NOT NULL | FK → families |
| out_of_nest_member_id | UUID | | NOT NULL | FK → out_of_nest_members (UNIQUE) |
| visibility_mode | TEXT | 'see_all' | NOT NULL | 'see_all' or 'filtered' |
| visibility_filter | JSONB | '{}' | NOT NULL | When mode = 'filtered': filter rules (tag-based, member-based, etc.) |
| can_post | BOOLEAN | true | NOT NULL | Whether this member can create new posts. |
| created_at | TIMESTAMPTZ | now() | NOT NULL | |
| updated_at | TIMESTAMPTZ | now() | NOT NULL | Auto-trigger |

**RLS Policy:** Mom full CRUD. Out of Nest member reads own settings.

**Indexes:**
- `(out_of_nest_member_id)` UNIQUE — one settings record per Out of Nest member

---

### Table: `feed_approval_settings`

Per-member feed post approval configuration.

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NOT NULL | PK |
| family_id | UUID | | NOT NULL | FK → families |
| family_member_id | UUID | | NOT NULL | FK → family_members (UNIQUE) |
| requires_approval | BOOLEAN | false | NOT NULL | Default: false. Posts go live immediately. |
| created_at | TIMESTAMPTZ | now() | NOT NULL | |
| updated_at | TIMESTAMPTZ | now() | NOT NULL | Auto-trigger |

**RLS Policy:** Mom full CRUD. Member reads own (for transparency).

**Indexes:**
- `(family_member_id)` UNIQUE — one setting per member

> **Decision rationale:** Post approval defaults to OFF. Most families won't need it. Mom enables it per child when she wants to coach social media habits with a review step. This keeps the default experience frictionless — kids post freely, family engages naturally.

---

### Enum/Type Updates

```sql
-- New enums for Family Feeds
CREATE TYPE moment_status AS ENUM ('published', 'pending_approval', 'rejected', 'archived');
CREATE TYPE moment_media_type AS ENUM ('photo', 'document', 'voice_recording');
CREATE TYPE moment_source AS ENUM ('direct', 'log_learning', 'bulk_summary', 'mindsweep', 'task_completed');
CREATE TYPE feed_visibility_type AS ENUM ('family_life', 'homeschool');
-- Note: feed_visibility_type is used for documentation; the column uses TEXT[] for flexibility to add future types.

-- Update Universal Queue source enum (PRD-17)
-- Add: 'family_feed_post' to universal_queue_items.source
```

---

## Flows

### Incoming Flows (How Data Gets INTO This Feature)

| Source | How It Works |
|--------|-------------|
| Direct posting (Screen 4) | User creates a post directly in the feed. Creates `family_moments` + optional `moment_media` records. |
| Log Learning widget (PRD-28) | When a child submits a Log Learning entry, the system optionally auto-generates a `family_moments` record tagged 'homeschool' with the entry's description, subjects, and time. |
| Task completion (PRD-09A) | When a homeschool-tagged task in a Sequential Collection is completed, the system can auto-generate a portfolio entry: "[Student] completed [Task Name]." Mom configurable. |
| Bulk Summary (Screen 5) | Mom's voice/text dump → LiLa parses → creates multiple `family_moments` records with appropriate tags and linked `homeschool_time_logs`. |
| MindSweep (PRD-17B) | MindSweep capture can route to feeds: "This sounds like a family memory — add to Family Feed?" or "This sounds like a homeschool moment — add to portfolio?" Classified via embedding-first pattern. |
| Smart Notepad (PRD-08) | "Send to..." routing grid includes "Family Feed" and "Homeschool Portfolio" as destinations. Creates a `family_moments` record from the notepad content. |
| Journal promotion (PRD-08) | A journal entry can be promoted to either feed: "Share this to Family Feed?" Creates a new `family_moments` record (not a link — the journal entry and moment are independent copies). |

### Outgoing Flows (How This Feature Feeds Others)

| Destination | How It Works |
|-------------|-------------|
| Victory Recorder (PRD-11) | "Celebrate This!" option on any moment creates a `victory_records` entry with `source = 'family_feed'`. |
| PRD-28B (Compliance Reporting) | Portfolio-tagged `family_moments` with photos/documents become evidence items in Standards Portfolio living view. Weekly/narrative reports pull from both `homeschool_time_logs` AND portfolio feed entries. |
| Archives (PRD-13) | All moments flow into Archives as family context. LiLa can reference feed content when assembling context for conversations. |
| PRD-19 (Monthly Aggregation) | Feed activity metrics (post counts, reaction counts, photo counts) included in `monthly_data_aggregations` for family summary reports. |
| Report Templates (PRD-28B) | "Generate Family Newsletter" template pulls highlights from Family Feed for a given date range. |

---

## AI Integration

### Guided Mode: `homeschool_bulk_summary`

- **Guided mode name:** `homeschool_bulk_summary`
- **Context loaded:** Family's homeschool subjects, family member list (names and roles), recent homeschool activity summary, family's time allocation mode (PRD-28).
- **AI behavior:** Parses unstructured voice/text input, identifies mentioned children by matching against family member names, breaks activities into individual entries, suggests subject tags from the family's configured list, estimates time per activity. Asks at most 1-2 simple clarifying questions. Presents organized results for review.
- **Human-in-the-Mix:** All parsed entries go through Edit/Approve/Reject before any data is saved.

### Feed Content Auto-Tagging (Full Magic)

When a moment is posted to any feed, LiLa can:
- **Auto-suggest subject tags:** "This looks like a science project — tag as Science?" Based on content text and image analysis (future: image classification).
- **Auto-suggest standards alignment:** "This art project could evidence VA.3.CR.1 (Create artwork)." Based on the family's imported standards list and the entry description.
- **Auto-suggest Family Feed sharing:** When posting to portfolio: "This looks share-worthy — also add to Family Feed?" Based on content type (photos of projects are more shareable than worksheet completions).
- **Auto-suggest member tagging:** Identifies family members mentioned in the post text.

> **Decision rationale:** All auto-suggestions are just that — suggestions. Mom or the contributor sees them as toggle-able chips and can accept or dismiss any suggestion. LiLa never auto-applies tags without confirmation. This is consistent with the Human-in-the-Mix principle.

### System Prompt Notes

- LiLa should be generous with subject tagging suggestions (if an activity plausibly touches a subject, suggest it) — mom can remove.
- LiLa's time estimates should err toward the higher end (giving mom credit rather than undercounting) — mom can reduce.
- LiLa never references financial data in feed contexts.
- When parsing bulk summaries, LiLa should match child names using fuzzy matching against the family member list (nicknames, shortened names).
- LiLa should not interrogate mom for details. If information is missing, estimate reasonably and let mom correct during review.

---

## Edge Cases

### Voice Transcription Failures
- If Whisper produces an unintelligible transcription, the post is created with the garbled text and mom sees an "Edit transcription" button prominently displayed. The audio remains available for 30 days for manual transcription.
- If audio recording fails entirely, the post creation modal shows an error and suggests text input instead.

### 30-Day Voice Expiry
- A daily cron job (Supabase Edge Function) queries `moment_media WHERE media_type = 'voice_recording' AND voice_expires_at < now()`, deletes the storage file, and updates the record. The parent moment's `content_text` (transcription) is unaffected.
- If a user tries to play an expired voice recording (race condition during deletion), they see: "This recording has expired. The text version is saved above."

### Out of Nest Member Posts While Permissions Change
- If mom revokes posting permission while an Out of Nest member is composing a post, the submission fails gracefully: "Posting permissions have changed. Please contact [mom's name]."
- Existing posts by an Out of Nest member are NOT retroactively removed when posting permission is revoked. Only new posts are blocked.

### Bulk Summary With Unrecognized Names
- If LiLa can't match a name to a family member, it flags the entry with "Unknown student" and asks mom to assign it during review. The entry is not silently dropped.

### Photo Compression Failures
- If image compression fails on upload, the original (uncompressed) file is stored and a background job retries compression. Feed display uses the original until compressed version is available.

### Empty Feed State
- New families see a warm empty state: "Your family's story starts here! Share your first moment." with a prominent [+ New Post] button.
- Empty Homeschool Portfolio shows: "Learning moments will appear here as you and your kids capture them. Try the Log Learning widget or post directly!"

### Approval Queue Overflow
- If mom has approval enabled and the queue grows large (10+ pending posts), a gentle nudge appears: "You have [N] posts waiting for your review."
- Posts older than 7 days in pending status get a visual indicator but are NOT auto-approved or auto-rejected.

---

## Tier Gating

| Feature Key | Description | Tier (Future) |
|-------------|-------------|---------------|
| `family_feed_basic` | Family Life Feed — view, post, react, comment | Essential |
| `family_feed_portfolio` | Homeschool Portfolio Feed tab — filtered view + portfolio metadata | Enhanced |
| `family_feed_bulk_summary` | Mom's Bulk Summary with LiLa parsing | Full Magic |
| `family_feed_auto_tagging` | LiLa auto-suggesting subjects, standards, sharing | Full Magic |
| `family_feed_out_of_nest` | Out of Nest member access to Family Feed | Enhanced |
| `family_feed_approval` | Post approval queue per child | Essential |
| `family_feed_export` | Portfolio export as PDF (defined in PRD-28B) | Enhanced (basic) / Full Magic (AI-enhanced) |

> **Tier rationale:** The Family Life Feed is Essential — every family should have a private social space. Portfolio and Out of Nest are Enhanced — they serve families with specific needs (homeschool, adult children). AI-powered features (bulk summary, auto-tagging) are Full Magic — they represent the intelligence layer.

---

## Stubs

### Stubs Created by This PRD

| Stub | Wires To | Future PRD |
|------|----------|------------|
| Individual Reporting Portfolio tabs (disability/progress) | Future portfolio tab types activated by configuration | Post-MVP — architecture supports via `feed_visibility` array |
| Extended family access (grandparents, aunts) | Lighter-weight family circle access tier | Post-MVP — separate from Out of Nest |
| Standards linkage on portfolio entries | `education_standards` table and Standards Portfolio living view | PRD-28B |
| Portfolio export button | Export flow for portfolio as formatted PDF | PRD-28B |
| Family Newsletter report template | "Generate Newsletter" consuming feed data | PRD-28B |
| Image classification for auto-tagging | AI analysis of photos for subject suggestion | Post-MVP enhancement |

### Existing Stubs Wired by This PRD

| Stub | Created By | How It's Wired |
|------|-----------|----------------|
| "Send to..." routing destinations | PRD-08 (Smart Notepad) | "Family Feed" and "Homeschool Portfolio" added as routing destinations |
| MindSweep feed routing | PRD-17B | MindSweep classification can route captures to Family Feed or Homeschool Portfolio |
| Family Hub "Recent Moments" widget slot | PRD-14D (Family Hub) | Widget displays 3-5 most recent Family Feed posts |
| Out of Nest expanded access | PRD-15 | Out of Nest members gain feed access beyond messaging |
| Slideshow Frame photo source | PRD-14D (Family Hub) | Family Feed photos can serve as slideshow frame content source |
| Victory source: family_feed | PRD-11 (Victory Recorder) | "Celebrate This!" on moments creates victory records with source = 'family_feed' |

---

## What "Done" Looks Like

### MVP (Must Have)
- [ ] Feeds page with tab navigation (Family + Homeschool Portfolio tabs)
- [ ] Family Life Feed: scrollable timeline, newest first, infinite scroll
- [ ] Post creation modal: text, photo (compressed), document attachment, voice-to-text (Whisper transcription)
- [ ] Voice recording: 30-day cloud storage with audio player and download button, auto-delete cron
- [ ] Moment cards: contributor, timestamp, text, media, reactions (heart), comments
- [ ] Member filter on Family Feed (Whole Family or individual)
- [ ] Homeschool Portfolio Feed: filtered view with subject tags, time, standards linkage display
- [ ] Portfolio sub-filters: per-student, per-subject, date range, highlights only
- [ ] Log Learning widget rendered at top of Portfolio Feed view
- [ ] Mom's Bulk Summary: voice/text input → LiLa parsing → organized review → approve
- [ ] Post approval queue: opt-in per child, routes through PRD-17 Universal Queue
- [ ] Out of Nest member feed access: visibility settings, posting permissions
- [ ] Out of Nest lightweight shell: feed-first view with message and notification indicators
- [ ] Family Hub "Recent Moments" widget
- [ ] `family_moments`, `moment_media`, `moment_reactions`, `moment_comments`, `out_of_nest_feed_settings`, `feed_approval_settings` tables created with RLS
- [ ] RLS verified: Out of Nest members see only moments matching their visibility setting
- [ ] RLS verified: Teens see own portfolio entries but not siblings' portfolio entries
- [ ] RLS verified: Play children see Family Feed read-only, no portfolio access
- [ ] RLS verified: Special Adults have no feed access during shifts
- [ ] Photo auto-compression on upload (resize to max 2048px, 80% quality WebP/JPEG)
- [ ] PWA entry point for Out of Nest: Family Feed as home screen

### MVP When Dependency Is Ready
- [ ] Portfolio export as PDF (requires PRD-28B)
- [ ] Standards linkage display and search (requires PRD-28B `education_standards` table)
- [ ] Auto-generated portfolio entries from Sequential Collection task completions (requires PRD-09A + PRD-28 integration)
- [ ] Timer session data flowing to portfolio time_minutes (requires PRD-36)

### Post-MVP
- [ ] Individual Reporting Portfolio tabs (disability/progress) — stubbed in architecture
- [ ] Extended family circle access (beyond Out of Nest)
- [ ] Image classification for auto-subject-tagging
- [ ] Additional reaction types beyond heart
- [ ] Portfolio entry direct-to-print formatting
- [ ] Custom portfolio views (saved filter configurations — user-created tabs)
- [ ] Feed search (full-text search across moment content)

---

## CLAUDE.md Additions from This PRD

- [ ] `family_moments` is the core table for all feed content. Tag-based filtering (`feed_visibility` TEXT[] array) determines which tab(s) display each moment. New feed types are added by extending this array — no new tables needed.
- [ ] Voice recordings use a 30-day TTL pattern: store with `voice_expires_at`, daily cron deletes expired files from Storage. Transcription is permanent.
- [ ] Photo uploads auto-compress on upload (max 2048px, 80% quality). No video uploads. No stored audio beyond 30-day window.
- [ ] Out of Nest members have a lightweight feed-first shell separate from in-household member shells. Their feed access is controlled by `out_of_nest_feed_settings`.
- [ ] Post approval is opt-in per child via `feed_approval_settings`. Default is OFF (posts go live immediately).
- [ ] Portfolio content defaults to portfolio-only. Sharing to Family Feed is an explicit opt-in. Family Feed content can be tagged for portfolio inclusion.
- [ ] The Bulk Summary feature uses the `homeschool_bulk_summary` guided mode. LiLa parses unstructured input, identifies children, suggests subjects/time, and presents organized entries for Human-in-the-Mix review. Max 1-2 clarifying questions.
- [ ] PWA entry points: Dashboard (most members), MindSweep (mom), Family Hub (family tablet), Family Feed (Out of Nest primary, teen secondary option).

---

## DATABASE_SCHEMA.md Additions from This PRD

Tables defined: `family_moments`, `moment_media`, `moment_reactions`, `moment_comments`, `out_of_nest_feed_settings`, `feed_approval_settings`

Enums created: `moment_status`, `moment_media_type`, `moment_source`, `feed_visibility_type`

Triggers added:
- `updated_at` auto-trigger on `family_moments`, `moment_comments`, `out_of_nest_feed_settings`, `feed_approval_settings`
- Voice recording expiry cron (daily Edge Function): deletes `moment_media` where `media_type = 'voice_recording' AND voice_expires_at < now()`

---

## Decisions Made This Session

### Decided

| # | Decision | Rationale |
|---|----------|-----------|
| 1 | **PRD-28B is a universal Compliance & Progress Reporting engine, not homeschool-only** | Same report generation pattern serves homeschool compliance, SDS/disability monthly summaries, and future report types. One engine, multiple template families. |
| 2 | **Feed tabs are opt-in: Family (always), Homeschool Portfolio (when subjects configured), future types (stubbed)** | Families who don't homeschool never see the portfolio tab. No clutter. Architecture supports future tab types without schema changes. |
| 3 | **Portfolio content defaults to portfolio-only; opt-in to share to Family Feed** | Prevents math worksheets and daily assignments from cluttering the family memory space. Share-worthy items (art, experiments, field trips) can be explicitly shared to both. |
| 4 | **Family Feed content can be pulled into portfolios by tagging** | A field trip photo on the Family Feed can become portfolio evidence with a tag — no need to post it twice. |
| 5 | **No video uploads. No stored audio. Voice is transcribed then discarded after 30 days.** | Eliminates the largest storage cost driver. Photos compress to ~1MB each; storage costs become negligible at scale. 30-day voice window lets mom download adorable recordings. |
| 6 | **Post approval is opt-in per child, NOT default** | Most families want friction-free posting. Approval exists for families who want to coach social media habits. Default is posts go live immediately. |
| 7 | **Out of Nest members see the Family Feed as their primary app experience** | Their lightweight shell is a family social app — feed-first with message indicator. PWA home screen entry point. |
| 8 | **Out of Nest posting permission is per-member, controlled by mom** | Adult children can post photos of their life back into the family feed (default: can post). Mom can restrict to view/react/comment only per individual. |
| 9 | **Out of Nest visibility is per-member: see all or filtered** | Mom can give trusted adult children full visibility while restricting others. Filter mechanism is tag/member-based. |
| 10 | **Mom's Bulk Summary uses MindSweep intelligence pattern** | Unstructured voice/text → LiLa parsing → organized entries → Human-in-the-Mix review. Same embedding-first classification approach. Max 1-2 clarifying questions. |
| 11 | **Journal and portfolio are completely separate** | Journal is personal and private. Portfolio is educational compliance. No cross-pollination by default. Journal entries can be promoted to feeds as explicit action; portfolio never pulls from journal. |
| 12 | **Family Feed is both a top-level nav item AND a widget on Family Hub** | Important enough for its own nav slot. Also naturally belongs on the family coordination surface as a "Recent Moments" widget. |
| 13 | **Log Learning widget appears on both kid's dashboard AND portfolio view** | Same widget, two surfaces. Kid doesn't need to navigate to a special place to log learning. |
| 14 | **Family Feed serves as social media training ground** | Private family social network where kids learn posting, commenting, reacting before encountering public social media. Key value proposition for safety-conscious parents. |
| 15 | **Family Newsletter is a report template in PRD-28B** | Mom picks a date range, LiLa pulls Family Feed highlights, assembles a newsletter with photos and summaries. Another template type in the universal reporting engine. |
| 16 | **Build order: PRD-37 (Feeds) first, PRD-28B (Reporting) second** | Capture surface before export engine. The feeds provide the data that the reporting engine formats. |
| 17 | **Out of Nest = adult children who've left home (+ their spouses/kids). NOT extended family.** | Extended family access (grandparents, aunts) is a future feature. Stubbed but not built at MVP. |
| 18 | **Bulk summary input works from any input surface that supports it** | Not just the portfolio tab — also MindSweep, Smart Notepad "Send to..." routing. LiLa sorts into the correct context (homeschool, disability, family) based on content. |

### Deferred

| # | What's Deferred | Resolution Path |
|---|----------------|----------------|
| 1 | Individual Reporting Portfolio tabs (disability/progress) | Post-MVP. Architecture supports via `feed_visibility` array. Activates when disability tracking configuration exists. |
| 2 | Extended family circle access (grandparents, aunts) | Post-MVP. Separate from Out of Nest. Likely view/react only. |
| 3 | Custom portfolio views (user-created tab configurations) | Post-MVP. Saved filter configs — name, tag filter, member filter. |
| 4 | Image classification for auto-tagging | Post-MVP AI enhancement. |
| 5 | Feed search | Post-MVP. Full-text search across moment content_text. |
| 6 | Additional reaction types | Post-MVP. Architecture supports via reaction_type column. |
| 7 | IEP/document understanding and advocacy guided mode | Separate future PRD. Distinct from the feed/reporting system. |

### Cross-PRD Impact

| PRD Affected | What Changed | Action Needed |
|-------------|-------------|---------------|
| PRD-04 (Shell Routing) | Feeds added as top-level navigation item. Out of Nest lightweight shell defined. | Add Feeds to sidebar nav. Define Out of Nest shell layout (feed-first, message indicator, notification bell, profile). |
| PRD-08 (Smart Notepad) | "Family Feed" and "Homeschool Portfolio" added as "Send to..." routing destinations. | Add routing destinations to Send to... grid. |
| PRD-11 (Victory Recorder) | New victory source: `source = 'family_feed'` from "Celebrate This!" on moments. | Add source value to victories.source enum. |
| PRD-14D (Family Hub) | "Recent Moments" widget added to Hub widget registry. | Add widget type to Family Hub's available widgets. |
| PRD-15 (Messages) | Out of Nest members gain Family Feed access beyond messaging. `out_of_nest_feed_settings` table extends the Out of Nest member model. PWA entry point updated. | Note expanded Out of Nest experience scope. Add feed settings to Out of Nest management screens. |
| PRD-17 (Universal Queue) | `family_feed_post` added as a queue source for post approval routing. | Add source value to queue source enum. |
| PRD-17B (MindSweep) | Feed routing added to MindSweep classification: captures can route to Family Feed or Homeschool Portfolio. | Add feed destinations to MindSweep routing logic. |
| PRD-22 (Settings) | Feed approval settings per child. Out of Nest feed visibility/posting settings. | Add Feed Settings section to Settings category navigation. |
| PRD-28 (Tracking) | Log Learning widget entries can auto-generate portfolio feed moments. Portfolio feed consumes `homeschool_time_logs` data for display. Deferred item #3 (compliance reporting) now addressed by PRD-28B. | Note portfolio feed as a consumer of homeschool tracking data. |

---

*End of PRD-37*
