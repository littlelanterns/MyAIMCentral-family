# Visual Assets Needed — MyAIM Central v2

Every visual asset referenced across all 52+ PRDs, organized by category. For each asset: which PRD references it, what it should depict, format, and MVP priority.

---

## 1. LiLa Character Images & Expressions

| Asset | PRD | Description | Format | MVP? |
|-------|-----|-------------|--------|------|
| LiLa "Happy to Help" (Help mode) | PRD-04, PRD-05 | Open arms, welcoming pose. Used as circular avatar in the LiLa Help FAB and LiLa Help mode header. Grows slightly on hover. | SVG/PNG, multiple sizes | Yes |
| LiLa "Your Guide" (Assist mode) | PRD-04, PRD-05 | Holding clipboard, guiding pose. Used as circular avatar in the LiLa Assist FAB and Assist mode header. | SVG/PNG, multiple sizes | Yes |
| LiLa "Smart AI" (Optimizer mode) | PRD-04, PRD-05, PRD-05C | Thinking, chin-tap pose. Used in LiLa Optimizer mode header and the Optimizer drawer. | SVG/PNG, multiple sizes | Yes |
| LiLa "Sitting/Resting" (General/Safe Harbor) | PRD-05, PRD-20 | Meditative pose, glowing heart, stars. Used in general chat and as the Safe Harbor LiLa avatar. Warm and grounding. | SVG/PNG, multiple sizes | Yes |
| LiLa Empty State | PRD-05 | LiLa waving or beckoning. Used when no conversations exist. | SVG/PNG | Yes |
| LiLa Loading/Thinking | PRD-05 | Animated thinking state. Used while waiting for AI response. | Animated SVG/Lottie | Yes |
| LiLa Message Avatar | PRD-15 | Distinct LiLa avatar for message bubbles. Appears with subtle background tint in messaging conversations. | SVG/PNG, 40px | Yes |
| LiLa Tool Avatar | PRD-21 | Standard LiLa conversation layout tool avatar. Used on LiLa messages in Communication & Relationship Tools. | SVG/PNG, 40px | Yes |

---

## 2. Brand Assets

| Asset | PRD | Description | Format | MVP? |
|-------|-----|-------------|--------|------|
| MyAIM Central Logo (primary) | Brand doc | Full logo with text. Paper craft aesthetic with dimensional, handcrafted feel. | SVG + PNG (multiple sizes) | Yes |
| MyAIM Central Logo (icon only) | Brand doc | Icon mark without text. For favicon, app icon, and nav header. | SVG + ICO + PNG (16/32/64/128/192/512px) | Yes |
| Favicon | PRD-04 | Small icon for browser tab. Must be legible at 16px. | ICO + PNG (16/32px) | Yes |
| PWA App Icons (5 entry points) | PRD-33 | Distinct icons for 5 PWA entry points: Hub (`/hub`), TV (`/hub/tv`), MyAIM (`/dashboard`), MindSweep (`/sweep`), Feed (`/feed`). TV icons need TV-appropriate sizes with landscape orientation. | PNG 192/512px each | Post-MVP |
| PWA Splash Screens | PRD-33, PRD-14E | Splash screens for PWA install, including TV-specific landscape splash. | PNG (various device sizes) | Post-MVP |
| Open Graph / Social sharing image | PRD-38 | Default OG image for blog posts and link previews. Pinterest-optimized. | PNG 1200x630 | Yes |
| AIMagicforMoms blog logo | PRD-38 | Blog-specific branding for aimagicformoms.com. "Cookie Dough & Contingency Plans" blog identity. Feels like "Pinterest meets scrapbooking meets post-it covered fridge." | SVG + PNG | Yes |

---

## 3. Avatar Options for Family Members

| Asset | PRD | Description | Format | MVP? |
|-------|-----|-------------|--------|------|
| Default avatar set (Mom/Primary Parent) | PRD-01 | Default avatar options for primary parent. Paper craft style. | SVG/PNG, 128px | Yes |
| Default avatar set (Dad/Additional Adult) | PRD-01 | Default avatar options for additional adults and Special Adults. | SVG/PNG, 128px | Yes |
| Default avatar set (Independent Teen) | PRD-01 | Default avatar options for independent teens. Age-appropriate styling. | SVG/PNG, 128px | Yes |
| Default avatar set (Guided Child) | PRD-01 | Default avatar options for guided/play mode children. Younger, friendlier styling. | SVG/PNG, 128px | Yes |
| Visual password icons | PRD-01 | Set of ~30 simple, distinct icons for visual password grid. Categories: animals, objects, food, nature, etc. Must be easily distinguishable at small sizes. Stored in `visual_password_config` JSONB. | SVG, consistent style, ~64px | Yes |
| Family device hub illustration | PRD-01, PRD-14D | Illustration for tablet/family device hub login screen. Shows family hub concept — welcoming, warm. | SVG/PNG | Yes |

---

## 4. Theme & Vibe Assets

| Asset | PRD | Description | Format | MVP? |
|-------|-----|-------------|--------|------|
| Vibe preview thumbnails (4 vibes) | PRD-03 | Preview cards for: Classic MyAIM, Clean & Modern, Nautical, Cozy Journal. Shown in vibe selector under theme picker. | PNG 300x200 | Yes |
| Theme color swatches (50+ themes) | PRD-03 | Visual swatches for theme picker across 9 theme families. Three-color swatch + name per theme. | Generated CSS (not images) | Yes |
| Gradient preview examples | PRD-03 | Example gradient overlays for gradient toggle preview. Live CSS gradients shown with on/off switch. | CSS gradients | Yes |
| Dark mode preview | PRD-03 | Preview of dark mode appearance for theme preview mode. | PNG 300x200 | Yes |
| EmptyState component illustration style | PRD-03 | Design System EmptyState component requires consistent illustration style definition across all empty states. | Style guide definition | Yes |

---

## 5. Gamification Assets

### 5a. Dashboard Backgrounds (PRD-24A) — 13 Backgrounds

| Asset | PRD | Description | Format | MVP? |
|-------|-----|-------------|--------|------|
| Spring Garden background | PRD-24A | Themed dashboard background — floral garden scene. | PNG/WebP: Desktop 2048x1024, Mobile 1024x2048 | Yes |
| Outer Space background | PRD-24A | Themed dashboard background — cosmic space scene. | PNG/WebP: Desktop 2048x1024, Mobile 1024x2048 | Yes |
| Ocean Deep background | PRD-24A | Themed dashboard background — underwater ocean. | PNG/WebP: Desktop 2048x1024, Mobile 1024x2048 | Yes |
| Enchanted Forest background | PRD-24A | Themed dashboard background — magical forest. | PNG/WebP: Desktop 2048x1024, Mobile 1024x2048 | Yes |
| Steampunk Workshop background | PRD-24A | Themed dashboard background — steampunk workshop. | PNG/WebP: Desktop 2048x1024, Mobile 1024x2048 | Yes |
| Desert Adventure background | PRD-24A | Themed dashboard background — desert landscape. | PNG/WebP: Desktop 2048x1024, Mobile 1024x2048 | Yes |
| Arctic Tundra background | PRD-24A | Themed dashboard background — arctic scene. | PNG/WebP: Desktop 2048x1024, Mobile 1024x2048 | Yes |
| Volcano Isle background | PRD-24A | Themed dashboard background — volcanic island. | PNG/WebP: Desktop 2048x1024, Mobile 1024x2048 | Yes |
| Candy Land background | PRD-24A | Themed dashboard background — candy/sweets world. | PNG/WebP: Desktop 2048x1024, Mobile 1024x2048 | Yes |
| Medieval Kingdom background | PRD-24A | Themed dashboard background — medieval castle scene. | PNG/WebP: Desktop 2048x1024, Mobile 1024x2048 | Yes |
| City Skyline background | PRD-24A | Themed dashboard background — urban skyline. | PNG/WebP: Desktop 2048x1024, Mobile 1024x2048 | Yes |
| Prehistoric Jungle background | PRD-24A | Themed dashboard background — dinosaur-era jungle. | PNG/WebP: Desktop 2048x1024, Mobile 1024x2048 | Yes |
| Enchanted Cottage background | PRD-24A | Themed dashboard background — cozy magical cottage. | PNG/WebP: Desktop 2048x1024, Mobile 1024x2048 | Yes |
| Background selector thumbnails (13) | PRD-24A | Thumbnail versions of all 13 backgrounds for the Settings picker grid. Cropped from desktop versions. | PNG 256x256 | Yes |

### 5b. Background Celebration Animations (PRD-24A)

| Asset | PRD | Description | Format | MVP? |
|-------|-----|-------------|--------|------|
| Per-background SVG animation elements (39 unique) | PRD-24A | 3 small + 3 medium + 3 large celebration animation elements per background (e.g., fish swimming, rockets launching, butterflies). Simple silhouette SVG shapes animated via CSS keyframes. Theme-color-aware via semantic tokens. | SVG path data + CSS keyframes | Yes |
| Particle/sparkle sprites (4 sets) | PRD-24A | Sparkle/particle effects for milestone celebrations. Sets: ocean, space, nature, fantasy. | SVG/CSS | Yes |

### 5c. Reveal Animations (PRD-24B — 8 types)

| Asset | PRD | Description | Format | MVP? |
|-------|-----|-------------|--------|------|
| Treasure Chest reveal | PRD-24B | Classic chest opens, lid lifts, light spills out. Video-based, passive viewing. | WebM + MP4 (poster frame PNG) | Yes |
| Gift Box reveal | PRD-24B | Ribbon unties, box unwraps, content rises. Video-based. | WebM + MP4 (poster frame PNG) | Yes |
| Cracking Egg reveal | PRD-24B | Egg wobbles, cracks spread, shell breaks apart. Can be flipbook from stacked images. Video-based. | WebM + MP4 (poster frame PNG) | Yes |
| Slot Machine reveal | PRD-24B | Reels spin, decelerate, land on result. Video-based. | WebM + MP4 (poster frame PNG) | Yes |
| Spinner Wheel reveal | PRD-24B | Tap to spin, wheel decelerates to predetermined result. CSS/SVG interactive — user participates. | SVG + CSS animation | Yes |
| Three Doors reveal | PRD-24B | Tap one of three doors, chosen door swings open. CSS/SVG interactive. | SVG + CSS animation | Yes |
| Card Flip reveal | PRD-24B | Tap one of three face-down cards, chosen card flips with 3D transform. CSS interactive. | CSS animation | Yes |
| Scratch-Off reveal | PRD-24B | Drag finger across card to scratch away mask layer. Canvas interactive. | Canvas + PNG texture (4 aesthetic variants) | Yes |
| Reward Card template | PRD-24B | Themed card that slides/fades in after reveal animation. Shows reward name, description, optional image. Accompanied by theme-aware CSS sparkle/confetti overlay. | CSS/SVG | Yes |

### 5d. Themed Reveal Containers (PRD-24A — Per Visual Theme)

| Asset | PRD | Description | Format | MVP? |
|-------|-----|-------------|--------|------|
| Pets: Pet Carrier (closed/open) | PRD-24A | Pet carrier opens, pet jumps out. Poster frame (idle) + reveal video. | PNG 512x512 + WebM/MP4 | Yes |
| Pets: Mystery Egg (closed/open) | PRD-24A | Egg cracks, creature hatches. | PNG 512x512 + WebM/MP4 | Yes |
| Pets: Paw Print Gift Box (closed/open) | PRD-24A | Gift box unwraps with paw print decorations. | PNG 512x512 + WebM/MP4 | Yes |
| Apothecary: Sealed Potion Crate | PRD-24A | Lid bursts open with magical effects. | PNG 512x512 + WebM/MP4 | Yes |
| Apothecary: Bubbling Cauldron | PRD-24A | Cauldron erupts revealing content. | PNG 512x512 + WebM/MP4 | Yes |
| Apothecary: Mystery Bottle | PRD-24A | Bottle uncorks and glows. | PNG 512x512 + WebM/MP4 | Yes |
| Dragons: Dragon Egg | PRD-24A | Egg cracks, baby dragon emerges. | PNG 512x512 + WebM/MP4 | Yes |
| Dragons: Treasure Hoard | PRD-24A | Gold avalanche reveals reward. | PNG 512x512 + WebM/MP4 | Yes |
| Dragons: Dragon-Wrapped Gift | PRD-24A | Flame-melts ribbon reveal. | PNG 512x512 + WebM/MP4 | Yes |
| Pixel Loot: 8-Bit Treasure Chest | PRD-24A | Classic 8-bit chest opening. | PNG 512x512 + WebM/MP4 | Yes |
| Pixel Loot: Mystery Block | PRD-24A | Hit block, item pops out (Mario-style). | PNG 512x512 + WebM/MP4 | Yes |
| Pixel Loot: Pixel Slot Machine | PRD-24A | 8-bit reels spin and land. | PNG 512x512 + WebM/MP4 | Yes |
| Generic fallback containers (3) | PRD-24A | 3 generic reveal containers for when no overlay is active. | PNG 512x512 + WebM/MP4 | Yes |

### 5e. Overlay Collectible Icons (PRD-24A)

| Asset | PRD | Description | Format | MVP? |
|-------|-----|-------------|--------|------|
| Pet icons (12 animals) | PRD-24A | Cute Pixar-style pet collectible icons (golden retriever, hamster, tabby cat, etc.). Generated as 4x3 grid. | PNG 128x128, transparent background | Yes |
| Apothecary bottle icons (6 types) | PRD-24A | Potion bottle collectibles — different shapes and colors per task category. Generated as 3x2 grid. | PNG 128x128, transparent background | Yes |
| Dragon icons — cute variant (8) | PRD-24A | Cute baby dragon collectible icons. Generated as 4x2 grid. | PNG 128x128, transparent background | Yes |
| Dragon icons — ornate variant (8) | PRD-24A | Ornate, detailed dragon collectible icons. Generated as 4x2 grid. | PNG 128x128, transparent background | Yes |
| Pixel Loot icons (7) | PRD-24A | 8-bit style collectible items: swords, coins, potions, relics. Generated as 4x2 grid. | PNG 128x128, transparent background | Yes |
| Future overlay collectible icons (~80) | PRD-24A | Additional collectible icons for future overlay themes (Mythical Creatures, etc.). | PNG 128x128, transparent background | Post-MVP |

### 5f. Overlay Stage Images (PRD-24A)

| Asset | PRD | Description | Format | MVP? |
|-------|-----|-------------|--------|------|
| Pets: 4 stage evolution images | PRD-24A | Stage 1 (small pet shelter) → Stage 2 → Stage 3 → Stage 4 (grand pet haven). Shows progression of overlay world. | PNG 512x512, transparent background | Yes |
| Apothecary: 4 stage evolution images | PRD-24A | Workshop stages from simple table to grand apothecary lab. | PNG 512x512, transparent background | Yes |
| Dragons cute: 4 stage evolution images | PRD-24A | Dragon lair stages — cute art style. | PNG 512x512, transparent background | Yes |
| Dragons ornate: 4 stage evolution images | PRD-24A | Dragon lair stages — ornate art style. | PNG 512x512, transparent background | Yes |
| Pixel Loot: 4 stage evolution images | PRD-24A | 8-bit game world stages — pixel art style. | PNG 512x512, transparent background | Yes |
| Overlay selector thumbnails (1 per theme) | PRD-24A | Thumbnail for overlay selection UI. Cropped from Stage 2 image. | PNG 256x256 | Yes |
| Future overlay stage images (~30) | PRD-24A | Stage images for future overlay themes. | PNG 512x512, transparent background | Post-MVP |

### 5g. Achievement & Reward Assets

| Asset | PRD | Description | Format | MVP? |
|-------|-----|-------------|--------|------|
| Streak milestone badges (7/14/21/30/60/90) | PRD-24, PRD-24A | Distinct badge designs for each streak milestone. Generated as 3x2 grid. | PNG 64x64 | Yes |
| Task milestone badges (10/50/100/500/1000) | PRD-24, PRD-24A | Badges for cumulative task completion milestones. Generated as 3x2 grid. | PNG 64x64 | Yes |
| Perfect week/month badges (2) | PRD-24A | Badges for perfect completion streaks. | PNG 64x64 | Yes |
| Overlay stage completion badges (8 at launch) | PRD-24A | 4 per overlay, marking each stage completion. | PNG 64x64 | Yes |
| Level-up badges (levels 1-10) | PRD-24A | Distinct badge for each gamification level. | PNG 64x64 | Yes |
| Level-up celebration animation | PRD-24 | Animation played on level advancement. | Lottie/CSS | Yes |
| Points/currency icon (Star) | PRD-24 | Default points currency icon. | SVG | Yes |
| Confetti celebration animation | PRD-06, PRD-11, PRD-24 | Confetti burst for celebrations (intention iteration, task completion, daily celebration). Reused across multiple features. | Lottie/CSS | Yes |
| SparkleOverlay celebration | PRD-24B | Theme-aware sparkle/confetti overlay that accompanies reward reveals and major completions. | CSS animation | Yes |

### 5h. Treasure Box Widget Assets (PRD-24B)

| Asset | PRD | Description | Format | MVP? |
|-------|-----|-------------|--------|------|
| Treasure box locked idle animation | PRD-24B | Gentle breathing pulse with progress ring. Shows how close child is to unlocking. | CSS animation | Yes |
| Treasure box unlocked bounce animation | PRD-24B | Bounce effect with gold ring when ready to open. | CSS animation | Yes |
| Treasure box state transition animation | PRD-24B | Animation between locked and unlocked states. | CSS animation | Yes |

---

## 6. Vault & Content Assets

| Asset | PRD | Description | Format | MVP? |
|-------|-----|-------------|--------|------|
| Vault category icons (6+ categories) | PRD-21A | Icons for each vault content category. Should match Lucide icon style. | SVG (Lucide-compatible) | Yes |
| Default vault item thumbnail | PRD-21A | Placeholder thumbnail for content without custom image. Paper craft style. | PNG 400x300 | Yes |
| Content type badges (6 types) | PRD-21A | Small badges for: tutorial, ai_tool, prompt_pack, curation, workflow, skill. | SVG | Yes |
| "NEW" badge | PRD-21A | Visual indicator for unseen/new content. | SVG/CSS | Yes |
| BookShelf empty state | PRD-23 | Illustration for empty BookShelf library. Warm, encouraging. | SVG/PNG | Yes |
| Book processing spinner | PRD-23 | Animation during book extraction/processing by LiLa. | Lottie/CSS | Yes |
| ThoughtSift thumbnail images (5) | PRD-34 | Style-consistent illustrations for the 5 ThoughtSift tools in the Vault. Must match MyAIM brand board (teal/gold palette, warm, inviting, non-generic). | PNG/SVG | Yes |

---

## 7. Widget & Tracker Assets

| Asset | PRD | Description | Format | MVP? |
|-------|-----|-------------|--------|------|
| Color-Reveal source images (20+ minimum) | PRD-10, PRD-24B | Full-color source images for Color-Reveal tracker. Categories: nature, animals, patterns, seasonal. Each needs matching zone map JSON and printable line art version. Generated via Nano Banana/Midjourney. | PNG 1024x1024 | Yes |
| Color-Reveal zone maps (20+) | PRD-24B | SVG path-based zone maps defining colorable regions for each Color-Reveal image. Complexity levels 1-5 (5 zones to 100 zones). | JSON (SVG path data) | Yes |
| Color-Reveal line art versions (20+) | PRD-24B | Printable line art versions for completed images. Individual export + batch PDF. | PNG 1024x1024 | Yes |
| Widget template preview icons (19 types) | PRD-10 | Preview icons for all 19 tracker/widget types in the template picker. | SVG | Yes |
| Star Chart backgrounds | PRD-10, PRD-24B | Background images/patterns for Star Chart tracker grids. | PNG/SVG | Yes |
| Star Chart star generation animation | PRD-24B | Star generated on task completion, flies from button to grid slot, settles with bounce. The animation IS the primary reward for young children. | CSS/SVG animation | Yes |
| Star Chart completion celebration | PRD-24B | Full SparkleOverlay celebration when all slots filled, plus gallery save. | CSS animation | Yes |
| Coloring Gallery Widget layout | PRD-24B | Display layout for completed Color-Reveal images with print export button. | CSS/Component | Yes |

---

## 8. Play Mode Visual Timer Styles (PRD-36)

| Asset | PRD | Description | Format | MVP? |
|-------|-----|-------------|--------|------|
| Sand Timer visual | PRD-36 | Animated sand timer countdown. Object-oriented style. Default Play mode timer. SVG/CSS consuming theme color tokens. | SVG + CSS animation | Yes |
| Hourglass visual | PRD-36 | Animated hourglass countdown. Object-oriented style. | SVG + CSS animation | Yes |
| Thermometer visual | PRD-36 | Filling thermometer timer. Abstract/metric-oriented style. | SVG + CSS animation | Yes |
| Arc (progress ring) visual | PRD-36 | Circular arc countdown. Abstract/metric-oriented style. | SVG + CSS animation | Yes |
| Filling Jar visual | PRD-36 | Jar filling with liquid countdown. Playful style. | SVG + CSS animation | Yes |

> **Note:** All 5 visual timer styles are implemented as SVG/CSS animations consuming theme color tokens. They render identically across all themes — only colors change. No pre-rendered video assets needed.

---

## 9. Shell-Specific Assets

| Asset | PRD | Description | Format | MVP? |
|-------|-----|-------------|--------|------|
| Guided shell "Help Me Talk to Someone" entry point | PRD-20, PRD-04 | Age-appropriate, warm entry point illustration. NOT labeled "Safe Harbor." Accessible from a prominent but age-appropriate location in the guided shell layout. | SVG/PNG | Yes |
| Play shell sticker set (basic) | PRD-26 | Basic sticker set for Play mode celebrations and task completion feedback. Large, visual, tappable. | PNG/SVG, 64-128px | Yes |
| Play shell custom emoji set | PRD-26 | Custom emoji set for Play mode interfaces. | SVG | Post-MVP |
| Tablet hub background/wallpaper | PRD-01, PRD-14D, PRD-14E | Background/wallpaper for family device hub mode. Used on shared family tablet login screen. | PNG 1920x1080 | Yes |
| TV Mode splash/background | PRD-14E | TV-specific background for Family Hub TV mode. Landscape orientation, optimized for large displays. | PNG 1920x1080 | Yes |

---

## 10. Empty States & Illustrations

| Asset | PRD | Description | Format | MVP? |
|-------|-----|-------------|--------|------|
| No tasks empty state | PRD-09A | Encouraging illustration when task list is empty. Warm, inviting. | SVG/PNG | Yes |
| No victories empty state | PRD-11 | Warm illustration encouraging first victory capture. "Record a Victory" button prominent. | SVG/PNG | Yes |
| No messages empty state | PRD-15 | Illustration for empty inbox/messaging space. | SVG/PNG | Yes |
| No calendar events empty state | PRD-14B | Illustration for empty calendar. "All caught up! No events waiting for approval." | SVG/PNG | Yes |
| Safe Harbor landing illustration | PRD-20 | Calming, minimal illustration for Safe Harbor landing page. Uses design system's softest palette. Generous whitespace. No visual noise. | SVG/PNG | Yes |
| Onboarding welcome illustration | PRD-01, PRD-31 | Welcome illustration for new account creation. Warm, inviting, sets the tone. | SVG/PNG | Yes |
| Subscription upgrade illustration | PRD-31 | Illustration for tier comparison/upgrade page. | SVG/PNG | Yes |
| Guiding Stars empty state | PRD-06 | Warm illustration or icon with onboarding invitation to create first Guiding Star. | SVG/PNG | Yes |
| Best Intentions empty state | PRD-06 | Warm illustration or icon with invitation to set first intention. | SVG/PNG | Yes |
| InnerWorkings empty state | PRD-07 | Warm illustration or icon with invitation and three entry path buttons. | SVG/PNG | Yes |
| BigPlans empty state | PRD-29 | Illustration for no plans yet. Shown on BigPlans page. | SVG/PNG | Yes |
| Family Feed empty state | PRD-37 | "Your family's story starts here! Share your first moment." Warm illustration with prominent [+ New Post] button. | SVG/PNG | Yes |
| "All Caught Up!" global empty state | PRD-17 | Celebratory illustration for Universal Queue when all tabs are clear. A rare, satisfying moment. Uses The Seasons serif font for heading. | SVG/PNG | Yes |
| Per-tab queue empty states (4+) | PRD-17 | Lucide icon + message + subtitle for each empty queue tab (Sort, Calendar, Studio, etc.). | Lucide icons + CSS | Yes |
| LifeLantern empty state | PRD-12A | Warm empty state with LiLa invitation. "Start wherever feels right." | SVG/PNG | Yes |
| Family Vision Quest empty state | PRD-12B | Warm illustration with "Start Your Family's Vision" button and brief Quest description. | SVG/PNG | Yes |
| Family Celebration empty state | PRD-11B | "No victories recorded for this period yet. That doesn't mean nothing good happened — it just means nobody wrote it down." | SVG/PNG | Yes |
| Permissions settings empty state | PRD-02 | Friendly message for when no additional adults/teens exist yet, with link to add members. | Lucide icon + CSS | Yes |
| Data export complete illustration | PRD-22 | Illustration shown when data export ZIP is ready for download. | SVG/PNG | Post-MVP |

---

## 11. Blog Assets (PRD-38)

| Asset | PRD | Description | Format | MVP? |
|-------|-----|-------------|--------|------|
| Blog category hero images (7 categories) | PRD-38 | Default hero images for each blog category. Pinterest-beautiful style. AI-generated imagery with brand colors. | PNG/WebP 1200x600 | Yes |
| Author avatar (Tenise) | PRD-38 | Founder photo/avatar for blog bylines. Used as `vault_admin`/blog author identity. | PNG 200x200 | Yes |
| Free tools download icons | PRD-38 | Icons for downloadable free resources/tools offered on the blog. | SVG | Yes |
| Pinterest pin image templates | PRD-38 | Separate Pinterest pin images (2:3 ratio) for blog articles. Falls back to featured image if not set. | PNG 1000x1500 | Post-MVP |
| Blog card placeholder thumbnail | PRD-38 | Default card image for masonry grid when no featured image is set. | PNG 400x300 | Yes |

---

## 12. Micro-Interaction & Ambient Animations (PRD-24B)

| Asset | PRD | Description | Format | MVP? |
|-------|-----|-------------|--------|------|
| Points popup floating animation | PRD-24B | "+5 points" text that floats upward and fades after task completion. | CSS animation | Yes |
| Background celebration micro-animations | PRD-24A, PRD-24B | Small themed SVG elements (fish, dolphin, whale, shooting star, rocket, butterfly) that animate across dashboard on task completion. Simple SVG path silhouettes, not detailed illustrations. Theme-color-aware via `--color-accent` tokens. | SVG + CSS keyframes | Yes |
| Milestone celebration large animations | PRD-24A, PRD-24B | Bigger, more dramatic versions of celebration animations for streak milestones and level-ups. | SVG + CSS keyframes | Yes |
| DailyCelebration Step 4 — collectible reveal | PRD-11, PRD-24A | Reveal of today's earned collectibles during daily celebration sequence. Animated reveal of new pets/bottles/loot. | Lottie/CSS | Yes |
| DailyCelebration stage evolution animation | PRD-24A | Animated transition when overlay world evolves to next stage during daily celebration. | Lottie/CSS | Yes |
| Breathing glow indicator | PRD-17 | Subtle breathing glow on QuickTasks Review Queue button when pending items exist. Static when all empty. | CSS animation | Yes |

---

## Summary

| Category | MVP Assets | Post-MVP Assets | Total |
|----------|-----------|----------------|-------|
| LiLa Character | 8 | 0 | 8 |
| Brand | 5 | 2 | 7 |
| Avatars & Auth | 6 | 0 | 6 |
| Theme/Vibe | 5 | 0 | 5 |
| Dashboard Backgrounds | 14 | 0 | 14 |
| Background Celebrations | 2 (43 defs) | 0 | 2 (43 defs) |
| Reveal Animations (8 types) | 9 | 0 | 9 |
| Themed Reveal Containers | 15 | 0 | 15 |
| Overlay Collectible Icons | 41 | ~80 | ~121 |
| Overlay Stage Images | 25 | ~30 | ~55 |
| Achievement & Reward | 40+ | 0 | 40+ |
| Treasure Box Widget | 3 | 0 | 3 |
| Vault/Content | 7 | 0 | 7 |
| Widgets/Trackers | 65+ | 0 | 65+ |
| Play Timer | 5 | 0 | 5 |
| Shell-Specific | 4 | 1 | 5 |
| Empty States | 18 | 1 | 19 |
| Blog | 4 | 1 | 5 |
| Micro-Interactions | 6 | 0 | 6 |
| **Total** | **~280** | **~115** | **~395** |

> **Note:** The gamification Visual Asset Manifest in PRD-24A provides the authoritative grand total: ~455 images + ~18 videos + ~125 CSS/animation definitions at launch. The pipeline estimate is ~4 hours using the 8x8 grid batch generation approach.

---

## Art Style Guidelines

All custom assets should follow the brand's **paper craft aesthetic**:
- Dimensional, handcrafted feel
- Soft pastels with warm undertones
- Cozy felt, subtle watercolor, craft paper textures
- Authentic "real life" touches (ripped paper, paperclips, washi tape, post-it notes)
- Never overly polished or corporate
- Mom life meets subtle magic
- Consistent with color palette: Warm Cream, Sage Teal, Golden Honey, Dusty Rose
- Reveal animations should feel "elegant and pristine — like opening a beautifully wrapped gift, not a cheap carnival game"

**Color Palette:**
- Base: #fff4ec (Warm Cream)
- Ground: #5a4033 (Warm Earth)
- Calm: #68a395 (Sage Teal)
- Growth: #d4e3d9 (Soft Sage)
- Success: #d6a461 (Golden Honey)
- Nurture: #d69a84 (Dusty Rose)
- Warmth: #f4dcb7 (Soft Gold)
- Depth: #2c5d60 (Deep Ocean)

**Typography:**
- Headers: The Seasons (serif)
- Body: HK Grotesk (sans-serif)

**Icons:**
- Lucide React icon library for all UI icons
- Custom SVG for gamification/overlay elements

**Content Creation Pipeline (PRD-24A):**
- One 8x8 grid per visual theme for batch generation consistency
- Tools: Nano Banana Pro / Midjourney for image generation
- Image Cutter (Hugging Face) for grid slicing
- AI video generation from poster frames for reveal videos
- Claude generates 64-image JSON manifests per theme
- Manus orchestrates: grid gen → Image Cutter slice → naming → video gen → folder organization
- Estimated pipeline time: ~4 hours for all launch image assets
