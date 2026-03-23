# PRD-24B Content Pipeline — Tool Decisions & Research Tasks

**Purpose:** Consolidates all tool decisions already made across the PRD-24 family for PRD-24B-relevant assets, and flags open research tasks to resolve before the build phase. This saves Tenise from carrying these details in her head.

---

## Already Decided (from PRD-24A Content Creation Pipeline)

### Image Generation

| Asset Category | Tool | Decision Source | Notes |
|---------------|------|----------------|-------|
| Theme 8×8 grids (collectibles, stages, reveals, bosses, evolution, stamps) | **Nano Banana Pro** (primary) or ChatGPT image gen (backup) | PRD-24A, Content Pipeline Step 2 | One grid per theme. Grid approach = consistent style across all 64 cells. |
| Dashboard backgrounds (13 backgrounds × 3 sizes) | **Nano Banana Pro / Midjourney** | PRD-24A, Visual Asset Manifest | Individual prompts, not grid. Higher resolution (2048×1024 desktop, 1024×2048 mobile). |
| Achievement badges (31 at launch) | **Nano Banana grid → Image Cutter** | PRD-24A, Visual Asset Manifest | Small grids (3×2, etc.) sliced into 64×64 icons. |
| Color-Reveal source images (20+ at launch) | **Nano Banana / Midjourney** | PRD-24A, Visual Asset Manifest | 1024×1024 PNG. Individual prompts for quality. |
| Scratch-off textures (4 at launch) | **Nano Banana** | PRD-24A, Visual Asset Manifest | Tileable pattern PNGs — gold foil, aged parchment, metallic pixel, sparkle frost. |

### Image Slicing

| Task | Tool | Decision Source |
|------|------|----------------|
| Slice 8×8 grids into 64 individual images | **Hugging Face Image Cutter** (`airabbitX/image-cutter`) | PRD-24A, Content Pipeline Step 2 |

### Video Generation

| Asset Category | Tool | Decision Source | Notes |
|---------------|------|----------------|-------|
| Reveal container animations (treasure chest open, egg crack, gift box unwrap, slot machine spin) | **AI video generation via Manus** | PRD-24A, Content Pipeline Step 3 | Poster frame (from grid) as starting frame → 3-5 second reveal video → WebM + MP4 output. |

**Alternative noted in PRD-24A:** Human animator (one of Tenise's kids) can hand-animate from the closed/open state key frames for higher quality.

### Orchestration

| Task | Tool | Decision Source |
|------|------|----------------|
| Batch execution of grid gen → slice → name → organize → video gen | **Manus** | PRD-24A, Content Pipeline Steps 2-4 |
| Generate structured JSON manifest per theme (what goes in each grid cell) | **Claude** (during PRD/build sessions) | PRD-24A, Content Pipeline Step 1 |
| Upload packaged assets to VS Code project | **Claude Code** | PRD-24A, Content Pipeline Step 4 |

### Total Pipeline Time Estimate

~4 hours for all image assets across all themes (from PRD-24A). Video generation is additional time on top.

---

## Available Tools (Tenise's Toolkit)

| Tool | What It Does |
|------|-------------|
| **Claude Code (Opus 4.6)** | Primary builder — all application code, CSS/SVG animations, component architecture |
| **Manus** | Batch orchestration, multi-step workflows, asset pipeline execution |
| **Gemini** | Google's AI — image understanding, multimodal analysis |
| **ChatGPT** | OpenAI — image generation (DALL-E), general AI tasks |
| **Midjourney** | High-quality image generation, best for hero/showcase images |
| **Veo** | Google's video generation AI |
| **Nano Banana (Pro)** | Image generation, grid-based batch generation (proven for this pipeline) |
| **Kling** | Video generation AI |

---

## Open Research Tasks (Resolve Before Build Phase)

These are questions where the best tool hasn't been decided yet. Claude should research and recommend before the build phase begins.

### 1. Reveal Container Video Generation — Which Video AI Tool?

**What's needed:** Poster frame (static PNG) → 3-5 second reveal animation video (WebM + MP4)
**Candidates to evaluate:** Veo, Kling, other video generation tools accessible via Manus
**Key criteria:** 
- Can it take a specific starting frame (the poster PNG) and animate FROM it?
- Quality of object animation (chest opening, egg cracking)
- Output format support (WebM with alpha transparency ideal, MP4 as fallback)
- Consistency across 12+ videos (all reveal containers should feel cohesive)
- Cost per generation

**Already noted:** PRD-24A says "AI video generation via Manus" but doesn't specify which video AI. This was validated with 7 treasure box templates during PRD-24 development — need to confirm which tool was used then.

### 2. Color-Reveal Zone Map Generation — How to Produce SVG Paths from Color Images?

**What's needed:** Take a 1024×1024 color image → produce a zone map JSON with SVG path boundaries for each distinct color region
**Candidates to evaluate:**
- **Claude (Opus) vision** — Can I analyze the image and write SVG paths? Probably imprecise for complex boundaries.
- **Gemini vision** — Same question, possibly better at spatial analysis.
- **SAM (Segment Anything Model)** — Meta's image segmentation. Could auto-detect color regions and export boundaries. Available on Hugging Face.
- **Semi-automated approach** — AI generates approximate rectangular/elliptical zones, human refines. Simpler zones for v1.
- **Color quantization + contour detection** — Python script (OpenCV) that quantizes the image to N colors and extracts contour paths as SVG. Claude Code could build this tool.

**Recommendation to research:** The OpenCV approach is probably the most reliable and repeatable. Claude Code builds a Python tool that takes a color image + target zone count → outputs zone map JSON with SVG paths. Manus orchestrates batch processing. Research whether this is feasible and accurate enough.

### 3. Color-Reveal Line Art Generation — How to Produce Clean Printable Line Art?

**What's needed:** Take a 1024×1024 color image → produce a clean black-and-white line art version suitable for printing as a coloring page
**Candidates to evaluate:**
- **Generate separately** — When creating the color image in Nano Banana/Midjourney, also generate a companion "coloring book line art version" prompt. Two separate generations ensures clean line art, but requires prompt engineering to match.
- **AI style transfer** — Feed the color image to an AI and request "convert to coloring book line art." Gemini or ChatGPT could do this.
- **Edge detection** — Python script (OpenCV Canny edge detection + cleanup). Produces accurate outlines but may be messy.
- **Dedicated tool** — There may be specialized coloring book generation tools.

**Key concern Tenise raised:** AI-generated color and line art versions of the "same" image often have differences. Generating them separately risks mismatched versions. Best approach might be: generate the line art FIRST, then colorize it (so the line art is the source of truth).

### 4. Cracking Egg Flipbook Frames — How Many Frames, Generated How?

**What's needed:** 8-15 PNG frames showing an egg progressively cracking and opening, for CSS flipbook animation
**Candidates to evaluate:**
- **Grid generation** — Generate all frames in a single Nano Banana grid (e.g., 4×4 grid = 16 frames of an egg cracking sequence). Slice into individual frames.
- **Video → frame extraction** — Generate a short egg-cracking video (Veo/Kling), then extract frames at fixed intervals.
- **Manual/hybrid** — Generate key frames (closed, first crack, half open, fully open) and interpolate.

**Recommendation to research:** Grid generation is probably most consistent with the existing pipeline. One 4×4 grid prompt describing the cracking sequence, sliced into 16 frames.

---

## Not Needing Research (Claude Code Builds These Directly)

These PRD-24B deliverables are pure code — no external tools needed:

| Deliverable | Implementation |
|-------------|---------------|
| All CSS/SVG interactive reveals (spinner, doors, cards, scratch-off canvas) | React components with CSS animations |
| Shared reward card component | React component with theme tokens |
| CSS sparkle overlay (particle system) | CSS-animated divs, no canvas/WebGL |
| Star Chart animation (flight, landing, completion) | CSS transforms + absolute positioning |
| Color-Reveal bloom animation | CSS filter transitions + SVG clip-paths |
| Micro-celebrations (points popup, streak fire, level-up) | CSS animations, positioned overlays |
| Background celebration SVG silhouettes | Hand-authored SVG paths + CSS keyframes |
| Dashboard readability gradient | CSS pseudo-element with linear-gradient |
| Treasure box widget idle animations | CSS keyframe animations |
| Evolution flipbook | CSS animation with steps() timing |
| Reveal Type Picker UI | React modal component |
| All reduced-motion fallbacks | CSS `prefers-reduced-motion` media queries |

---

*This document should be uploaded to project knowledge alongside PRD-24B so it's available during pre-build audit and build phase planning.*
