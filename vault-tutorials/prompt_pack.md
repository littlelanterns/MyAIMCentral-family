# The MyAIM Image Grid Prompt Pack

**The exact prompts we used — and what made them work.**

This document contains the complete, unedited prompts from our image grid workflow, along with notes on what each element does and why it's there. Use these as starting points, not scripts. The best prompt is always the one you've customized for your specific project.

---

## How to Use This Document

Each prompt is followed by a breakdown of its key elements. When you're writing your own prompt, you don't need to copy ours word for word — you need to understand the structure and fill it with your own content.

The four-part framework that underlies every prompt:

1. **Grid structure** — tells the AI what format to produce
2. **Style guide** — establishes visual consistency across all 16 cells
3. **Cell descriptions** — specifies what goes in each cell
4. **Filler instruction** — handles empty cells gracefully

---

## Batch A: Vault Thumbnails (Paper-Craft Style)

### The Prompt

```
A precise 4x4 grid of 16 square paper-craft style illustrations, each cell exactly equal size with a thin warm cream border between cells. All 16 illustrations share the same visual style: hand-crafted paper and fabric textures, soft warm lighting from above, muted earth tones with accents of sage green (#7A9E7E), honey gold (#C8864A), and warm cream (#FAF7F2). Slight depth and shadow as if physically constructed. No text, no letters, no numbers anywhere in any cell.

Row 1 (top):
Cell 1: A round wooden table with four chairs arranged around it, seen from slightly above, warm afternoon light.
Cell 2: Vintage-style reading glasses resting on an open book with a small potted succulent beside it.
Cell 3: A compass rose made of layered paper, pointing north, surrounded by small map fragments.
Cell 4: A geometric crystal or gem shape, faceted, catching light from above.

Row 2:
Cell 5: A small house with a pitched roof and a single lit window, surrounded by tiny trees.
Cell 6: A balance scale with two equal pans, slightly ornate, centered on a wooden surface.
Cell 7: Two figures standing on a small bridge, facing each other, silhouetted.
Cell 8: An open hand with a small glowing lantern resting in the palm.

Row 3:
Cell 9: A cozy armchair with a side table and small lamp, warm and inviting.
Cell 10: A speech bubble and a thought bubble overlapping, both empty, suggesting conversation.
Cell 11: A wardrobe or armoire with one door slightly open, revealing a soft glow inside.
Cell 12: An envelope with a small heart seal, slightly open as if just received.

Row 4 (bottom):
Cell 13: A stack of three books with a small plant growing from the top.
Cell 14: A clock face showing 3:00, surrounded by small hourly markers, no hands visible.
Cell 15: A small treasure chest, slightly open, with a warm light spilling out.
Cell 16: A simple key with an ornate bow, resting on a wooden surface.
```

### What Made This Work

**Style specificity:** "Hand-crafted paper and fabric textures, soft warm lighting from above, muted earth tones" — this level of detail is what creates consistency. Vague style guides produce inconsistent results.

**Hex codes:** Including `#7A9E7E`, `#C8864A`, and `#FAF7F2` gave the AI precise color targets. Without them, "sage green" and "honey gold" can mean very different things to different models.

**No text instruction:** "No text, no letters, no numbers anywhere in any cell" — AI image models love to add labels, signs, and text to images. This stops it.

**Row-by-row structure:** Organizing cells by row ("Row 1 (top): Cell 1:...") helps the AI understand the spatial layout. It reads the prompt linearly and fills cells in order.

**Lighting consistency:** "Soft warm lighting from above" appears in the style guide and is implied in individual cell descriptions. Consistent lighting direction is what makes a grid feel cohesive.

---

## Batch B: Visual Schedule Cards (Arts & Crafts Activities)

### The Prompt

```
A precise 4x4 grid of 16 square illustrated activity cards for children, each cell exactly equal size with a thin white border between cells. All 16 illustrations share the same visual style: bright, cheerful watercolor and colored pencil aesthetic, clean white backgrounds, bold outlines, child-friendly proportions. Colors are saturated but not harsh: coral (#E8735A), sky blue (#5BA4CF), sunshine yellow (#F5C842), grass green (#6BBF59), and soft lavender (#B8A9D9). No text, no letters, no numbers anywhere in any cell.

Row 1 (top):
Cell 1: Paintbrushes in a jar with colorful paint splatters around them.
Cell 2: Safety scissors cutting a piece of colored paper, paper curls visible.
Cell 3: A glue stick and construction paper shapes (stars, circles, triangles) ready to be assembled.
Cell 4: Crayons in a box, several standing upright, bright colors visible.

Row 2:
Cell 5: A simple loom with colorful yarn being woven through it.
Cell 6: Air-dry clay being shaped into a small bowl, hands visible from above.
Cell 7: Watercolor paints in a tray with a wet brush and a painted flower on paper.
Cell 8: A needle and embroidery hoop with a simple flower pattern being stitched.

Row 3:
Cell 9: Origami paper being folded into a crane, mid-fold.
Cell 10: A potato stamp and ink pad, with stamped shapes on paper.
Cell 11: Colored sand in small bottles, being poured into a design.
Cell 12: Pipe cleaners twisted into a butterfly shape, bright colors.

Row 4 (bottom):
Cell 13: A simple birdhouse being painted, brush in hand.
Cell 14: Beads being strung on a cord to make a bracelet.
Cell 15: A nature journal open to a page with pressed flowers and leaves.
Cell 16: Fill with a soft white background, no illustration.
```

### What Made This Work

**Audience-specific style:** "Child-friendly proportions" and "bright, cheerful" set a very different tone from the vault thumbnails. The AI adjusts its aesthetic based on these cues.

**Filler instruction:** Cell 16 uses "Fill with a soft white background, no illustration" — this is cleaner than leaving it undefined, which can cause the AI to invent something that doesn't fit.

**Activity specificity:** Each cell describes a specific moment in an activity, not just the activity name. "Safety scissors cutting a piece of colored paper, paper curls visible" is more useful than "scissors."

---

## Batch C: Homestead & Chores (Visual Schedule)

### The Prompt

```
A precise 4x4 grid of 16 square illustrated household activity cards, each cell exactly equal size with a thin warm white border between cells. All 16 illustrations share the same visual style: warm, cozy editorial illustration style, slightly textured as if painted in gouache, muted but cheerful palette. Colors: warm cream (#FFF8F0), dusty rose (#D4847A), sage green (#8BAF8B), warm tan (#C4A882), and soft blue (#8BA8C4). No text, no letters, no numbers anywhere in any cell.

Row 1 (top):
Cell 1: A broom sweeping a wooden floor, dust particles visible in a shaft of light.
Cell 2: Dishes being washed in a soapy sink, bubbles floating up.
Cell 3: Laundry being folded on a bed, neat stacks of clothes.
Cell 4: A vacuum cleaner moving across a rug, seen from slightly above.

Row 2:
Cell 5: A watering can pouring water onto a small vegetable garden.
Cell 6: Eggs being collected from a nesting box, hands visible.
Cell 7: A compost bin with vegetable scraps being added to it.
Cell 8: Firewood being stacked neatly beside a stone fireplace.

Row 3:
Cell 9: Bread dough being kneaded on a floured surface.
Cell 10: Jars of jam being sealed and labeled on a kitchen counter.
Cell 11: A sewing machine with fabric being guided through it.
Cell 12: A child's hands planting a small seedling in a pot of soil.

Row 4 (bottom):
Cell 13: A mop and bucket on a clean kitchen floor, sunlight through a window.
Cell 14: Grocery bags being unpacked onto a kitchen counter.
Cell 15: A calendar on a wall with dates circled, a hand reaching to add a note.
Cell 16: A cozy reading nook with a lamp, a blanket, and a stack of books.
```

### What Made This Work

**Gouache texture:** Specifying "slightly textured as if painted in gouache" produces a warmer, more handmade feel than standard illustration. Material references give the AI a specific aesthetic target.

**Lighting details:** "Dust particles visible in a shaft of light" and "sunlight through a window" add atmosphere and make images feel lived-in rather than clinical.

**Variety within theme:** The 16 cells cover a range of activities (indoor cleaning, outdoor chores, cooking, crafts) while staying within one thematic family. This variety makes the set more useful.

---

## Batch D: Digital Avatars (Photorealistic)

### The Prompt

```
A precise 4x4 grid of 16 square photorealistic portrait photographs of the same woman, each cell exactly equal size with a thin white border between cells. The woman has: warm medium-brown hair (shoulder length, natural waves), light olive skin tone, dark brown eyes, approximately 35 years old, natural makeup, friendly and approachable expression. Professional but warm — not corporate. Studio-quality lighting throughout. No text, no graphics, no overlays anywhere.

Row 1 (top):
Cell 1: Front-facing, neutral expression, slight smile, direct eye contact.
Cell 2: Front-facing, warm genuine smile, eyes slightly crinkled.
Cell 3: Slight left turn (her left), looking toward camera, thoughtful expression.
Cell 4: Slight right turn (her right), looking toward camera, soft smile.

Row 2:
Cell 5: Looking slightly upward, as if thinking or listening, gentle expression.
Cell 6: Looking slightly downward, as if reading or reflecting.
Cell 7: Laughing naturally, head tilted slightly back, genuine.
Cell 8: Serious and focused, direct eye contact, composed.

Row 3:
Cell 9: Profile view from left side, looking forward.
Cell 10: Profile view from right side, looking forward.
Cell 11: Three-quarter view from left, warm smile.
Cell 12: Three-quarter view from right, neutral expression.

Row 4 (bottom):
Cell 13: Front-facing, surprised expression, eyebrows raised slightly.
Cell 14: Front-facing, warm and encouraging expression, slight head tilt.
Cell 15: Front-facing, thoughtful expression, lips slightly pursed.
Cell 16: Front-facing, confident expression, direct eye contact, no smile.
```

### What Made This Work

**Consistent physical description:** Every detail of the character's appearance is specified in the style guide and applies to all 16 cells. The AI holds this description as a constant while varying the expression and angle.

**Angle variety:** The grid covers front, profile, three-quarter, and angled views — exactly what avatar training tools need to build a convincing 3D model.

**Expression vocabulary:** Specific expression descriptions ("eyes slightly crinkled," "head tilted slightly back") produce more consistent results than single-word emotions like "happy."

**No makeup/styling variation:** Keeping hair, makeup, and clothing consistent across all cells ensures the avatar training tool recognizes the same person in every image.

---

## The Style Guide Library

These are reusable style guide blocks. Copy the one that fits your project and drop it into the style guide section of any grid prompt.

### Paper Craft (Warm, Textured)
```
Hand-crafted paper and fabric textures, soft warm lighting from above, muted earth tones with accents of sage green (#7A9E7E), honey gold (#C8864A), and warm cream (#FAF7F2). Slight depth and shadow as if physically constructed. No text, no letters, no numbers.
```

### Watercolor Children's (Bright, Cheerful)
```
Bright, cheerful watercolor and colored pencil aesthetic, clean white backgrounds, bold outlines, child-friendly proportions. Colors are saturated but not harsh: coral (#E8735A), sky blue (#5BA4CF), sunshine yellow (#F5C842), grass green (#6BBF59). No text, no letters, no numbers.
```

### Gouache Editorial (Warm, Cozy)
```
Warm, cozy editorial illustration style, slightly textured as if painted in gouache, muted but cheerful palette. Warm cream (#FFF8F0), dusty rose (#D4847A), sage green (#8BAF8B), warm tan (#C4A882). No text, no letters, no numbers.
```

### Flat Vector (Clean, Modern)
```
Clean flat vector illustration style, minimal detail, bold geometric shapes, no gradients, no textures, solid color fills only. Primary palette: [your brand colors]. White or light gray backgrounds. No text, no letters, no numbers.
```

### Photorealistic Portrait (Avatar Training)
```
Photorealistic portrait photography, studio-quality lighting, consistent subject appearance throughout: [physical description]. Professional but warm. No text, no graphics, no overlays.
```

### Botanical Line Art (Elegant, Minimal)
```
Fine-line botanical illustration style, black ink on cream paper, delicate detail, no color fills, occasional light watercolor wash in sage and dusty rose. Clean, elegant, timeless. No text, no letters, no numbers.
```

---

## Slicing Your Grid

Once you have your grid image, you need to slice it into individual files. Here are your options:

**Option 1 — Manus (recommended for batches)**
Use the image-grid-slice skill. It slices the grid, names each file according to your naming convention, and can output multiple sizes simultaneously. Try Manus free: [https://manus.im/invitation/F0KVQFJNF28T1L](https://manus.im/invitation/F0KVQFJNF28T1L)

**Option 2 — Any AI assistant + Python**
Ask any AI assistant: "Write a Python script that takes a [dimensions] image, slices it into a 4x4 grid of 16 equal tiles, and saves each tile as a separate PNG named [your naming convention]."

**Option 3 — Free online tools**
Search "image grid splitter" — several free web tools let you upload, specify rows and columns, and download a zip of sliced tiles.

---

*This prompt pack is part of the MyAIM Vault tutorial series. For the full tutorial with visual examples, see "Consistent Characters & Styles" in the Vault.*
