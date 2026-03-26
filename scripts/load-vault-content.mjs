/**
 * One-time script to load initial Vault content from the review package.
 * Run: node scripts/load-vault-content.mjs
 */
import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { resolve } from 'path'

const SUPABASE_URL = 'https://vjfbzpliqialqmabfnxs.supabase.co'
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_KEY) {
  console.error('Set SUPABASE_SERVICE_ROLE_KEY env var')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

const STAGING = resolve(process.cwd(), 'content-staging')

// Get primary parent user ID for created_by
async function getAdminUserId() {
  const { data } = await supabase.from('families').select('primary_parent_id').limit(1).single()
  return data?.primary_parent_id
}

// Get category ID by slug
async function getCategoryId(slug) {
  const { data } = await supabase.from('vault_categories').select('id').eq('slug', slug).single()
  return data?.id
}

// Upload file to storage, return public URL
async function uploadToStorage(bucket, path, filePath, contentType) {
  const fileData = readFileSync(filePath)
  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(path, fileData, { contentType, upsert: true })
  if (error) {
    console.error(`Upload failed: ${path}`, error.message)
    // Try creating the bucket first
    await supabase.storage.createBucket(bucket, { public: true })
    const retry = await supabase.storage.from(bucket).upload(path, fileData, { contentType, upsert: true })
    if (retry.error) throw new Error(`Upload failed after bucket create: ${retry.error.message}`)
  }
  const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(path)
  return urlData.publicUrl
}

async function main() {
  const adminUserId = await getAdminUserId()
  if (!adminUserId) { console.error('No admin user found'); process.exit(1) }
  console.log('Admin user:', adminUserId)

  const creativeFunId = await getCategoryId('creative-fun')
  const aiLearningId = await getCategoryId('ai-learning')
  console.log('Categories: creative-fun =', creativeFunId, ', ai-learning =', aiLearningId)

  // ── Ensure storage bucket exists ──
  await supabase.storage.createBucket('vault-content', { public: true }).catch(() => {})

  // ── Tutorial 1: Consistent Characters ──
  console.log('\n--- Tutorial 1: Consistent Characters ---')
  const t1Path = resolve(STAGING, 'Tutorials/Tutorial-1-Consistent-Characters.html')
  const t1Url = await uploadToStorage('vault-content', 'tutorials/tutorial-1-consistent-characters.html', t1Path, 'text/html')
  console.log('Uploaded to:', t1Url)

  const { data: t1, error: t1Err } = await supabase.from('vault_items').insert({
    display_title: 'One Prompt. Hundreds of Matching Images.',
    detail_title: 'Consistent Characters & Styles — The Image Grid Method',
    short_description: 'Learn the Image Grid Method — one AI prompt that generates 16 consistent images at once. Use it for storybook characters, digital avatars, app thumbnails, visual schedules, and more.',
    full_description: 'This tutorial walks you through the complete Image Grid Method — a single AI prompt framework that generates a 4×4 grid of 16 consistent images in one shot. You\'ll learn how to build grid prompts, create reusable style guides, and apply the technique to children\'s books, digital avatars, app thumbnails, and visual schedules. Includes real examples, the exact prompts we used, and a step-by-step breakdown of what makes each element work.',
    content_type: 'tutorial',
    category_id: creativeFunId,
    difficulty: 'beginner',
    tags: ['image-generation', 'consistent-characters', 'grid-method', 'style-guides', 'midjourney', 'dall-e'],
    content_url: t1Url,
    status: 'published',
    is_featured: true,
    teen_visible: true,
    allowed_tiers: ['essential', 'enhanced', 'full_magic', 'creator'],
    estimated_minutes: 20,
    learning_outcomes: [
      'Generate 16 consistent images from a single AI prompt',
      'Build reusable style guide blocks for any visual aesthetic',
      'Apply the grid method to storybooks, avatars, thumbnails, and schedules',
      'Understand what makes each prompt element work (and how to modify them)',
    ],
    display_order: 1,
    created_by: adminUserId,
  }).select('id').single()

  if (t1Err) console.error('Tutorial 1 insert failed:', t1Err.message)
  else console.log('Tutorial 1 created:', t1.id)

  // ── Tutorial 2: Build an App with AI ──
  console.log('\n--- Tutorial 2: Build an App with AI ---')
  const t2Path = resolve(STAGING, 'Tutorials/Tutorial-2-Build-an-App.html')
  const t2Url = await uploadToStorage('vault-content', 'tutorials/tutorial-2-build-an-app.html', t2Path, 'text/html')
  console.log('Uploaded to:', t2Url)

  const { data: t2, error: t2Err } = await supabase.from('vault_items').insert({
    display_title: 'I spent months and real money learning what NOT to do.',
    detail_title: 'How to Build a Real App with AI',
    short_description: 'A seven-phase process for building a real app with AI tools — from defining the problem through deployment. Covers PRDs, auditing, CLAUDE.md, the build cycle, and why most "build in a day" tools fail.',
    full_description: 'Honest lessons from building a real production app with AI assistance. This tutorial covers the complete journey: why most AI-built apps fail, the house analogy for understanding AI\'s role, seven distinct phases from problem definition to deployment, how to add AI features that actually work, and the specific tech stack and patterns that held up under real use. Written by someone who spent months and real money learning the hard way.',
    content_type: 'tutorial',
    category_id: aiLearningId,
    difficulty: 'intermediate',
    tags: ['app-development', 'ai-tools', 'claude-code', 'prds', 'deployment', 'vite', 'react', 'supabase'],
    content_url: t2Url,
    status: 'published',
    is_featured: true,
    teen_visible: false,
    allowed_tiers: ['essential', 'enhanced', 'full_magic', 'creator'],
    estimated_minutes: 30,
    learning_outcomes: [
      'Understand why most "build an app in a day" approaches fail',
      'Follow a seven-phase process from problem definition to deployment',
      'Write effective PRDs and CLAUDE.md files for AI-assisted development',
      'Add real AI features (not demos) to a production application',
    ],
    display_order: 1,
    created_by: adminUserId,
  }).select('id').single()

  if (t2Err) console.error('Tutorial 2 insert failed:', t2Err.message)
  else console.log('Tutorial 2 created:', t2.id)

  // ── Prompt Pack: Image Grid Prompt Pack ──
  console.log('\n--- Prompt Pack: Image Grid Prompt Pack ---')

  // Upload grid master images as example outputs
  const gridAPath = resolve(STAGING, 'Testworth-Family-Portraits/GRID-A-master.png')
  const gridBPath = resolve(STAGING, 'Testworth-Family-Portraits/GRID-B-master.png')
  const gridAUrl = await uploadToStorage('vault-content', 'prompt-pack/grid-a-master.png', gridAPath, 'image/png')
  const gridBUrl = await uploadToStorage('vault-content', 'prompt-pack/grid-b-master.png', gridBPath, 'image/png')
  console.log('Grid images uploaded')

  const { data: pp, error: ppErr } = await supabase.from('vault_items').insert({
    display_title: 'The exact prompts we used — and what made them work.',
    detail_title: 'The MyAIM Image Grid Prompt Pack',
    short_description: 'Complete, unedited prompts from our image grid workflow with breakdowns of what each element does. Four batches: paper-craft thumbnails, children\'s activity cards, homestead chores, and photorealistic avatars.',
    full_description: 'Every prompt that powered the MyAIM visual design system, presented exactly as we used them — complete and unedited. Each batch includes the full prompt text plus a "What Made This Work" breakdown explaining every design decision. Four distinct batches cover paper-craft thumbnails, children\'s watercolor activity cards, gouache homestead chores, and photorealistic digital avatars. Plus a reusable style guide library with six ready-to-use aesthetic blocks you can drop into your own grid prompts.',
    content_type: 'prompt_pack',
    prompt_format: 'image_gen',
    category_id: creativeFunId,
    difficulty: 'beginner',
    tags: ['image-generation', 'grid-method', 'style-guides', 'prompt-engineering', 'midjourney', 'dall-e'],
    status: 'published',
    is_featured: false,
    teen_visible: true,
    allowed_tiers: ['essential', 'enhanced', 'full_magic', 'creator'],
    enable_lila_optimization: true,
    lila_optimization_prompt: 'Help the user personalize these image grid prompts for their family. Replace subject descriptions with their family member details. Adjust style elements to match their preferences. Keep the grid structure and style guide blocks intact.',
    display_order: 2,
    created_by: adminUserId,
  }).select('id').single()

  if (ppErr) { console.error('Prompt pack insert failed:', ppErr.message); return }
  console.log('Prompt pack created:', pp.id)

  // Add prompt entries
  const entries = [
    {
      title: 'Batch A: Vault Thumbnails (Paper-Craft Style)',
      prompt_text: `Create a 4x4 grid of 16 thumbnail images for a family management app called "MyAIM Central." Each image represents a different app feature. Art style: paper-craft aesthetic with layered cut-paper textures, warm brand colors (#F4845F coral, #7B2D8E purple, #2D5F8E blue, #4CAF50 green). Each cell is square with rounded corners and a subtle drop shadow.

The 16 features (one per cell, left to right, top to bottom):
1. Dashboard (house icon made of layered paper)
2. Tasks (checklist with paper checkmarks)
3. Journal (open book with paper pages)
4. Calendar (paper calendar with date circles)
5. AI Vault (treasure chest with paper gems)
6. Guiding Stars (paper stars constellation)
7. Best Intentions (paper target with arrow)
8. Inner Workings (paper gears/cogs)
9. Victory Recorder (paper trophy)
10. Life Lantern (paper lantern glowing)
11. Archives (paper file folders)
12. Studio (paper art palette)
13. Lists (paper scroll unrolling)
14. Messages (paper speech bubbles)
15. Settings (paper gear icon)
16. Family Hub (paper house with family silhouettes)

Style guide: Consistent paper texture across all cells. Warm lighting from upper left. Subtle paper grain visible. Colors desaturated slightly to feel handmade. Each icon centered in its cell with 15% padding. White or cream background per cell.`,
      example_outputs: [gridAUrl],
      sort_order: 1,
      tags: ['paper-craft', 'thumbnails', 'app-icons'],
    },
    {
      title: 'Batch B: Visual Schedule Cards (Arts & Crafts Activities)',
      prompt_text: `Create a 4x4 grid of 16 children's activity cards in a warm watercolor illustration style. Each card depicts a different arts and crafts activity a child might do. Style: soft watercolor washes, children's book illustration quality, warm and inviting colors, simple compositions that a 5-8 year old would find appealing.

The 16 activities (one per cell):
1. Painting at an easel
2. Making friendship bracelets
3. Building with clay/playdough
4. Paper snowflake cutting
5. Finger painting
6. Making a birdhouse
7. Tie-dye t-shirts
8. Rock painting
9. Making a collage
10. Origami animals
11. Sewing a simple pillow
12. Making soap
13. Pressing flowers
14. Making a dream catcher
15. Building a terrarium
16. Decorating a picture frame

Style guide: Watercolor texture throughout. Soft edges, no harsh lines. Color palette: warm yellows, soft pinks, gentle greens, sky blues. Each cell has a subtle cream/paper background. Child-friendly, whimsical, no text. Each illustration centered with breathing room.`,
      example_outputs: [],
      sort_order: 2,
      tags: ['watercolor', 'children', 'activities', 'visual-schedule'],
    },
    {
      title: 'Batch C: Homestead & Chores (Visual Schedule)',
      prompt_text: `Create a 4x4 grid of 16 homestead chore illustrations in a gouache editorial illustration style. Each cell depicts a different household/homestead task. Style: rich gouache textures, editorial illustration quality, warm earth tones with pops of color, slightly vintage feel like a well-loved homemaking book.

The 16 chores (one per cell):
1. Feeding chickens
2. Hanging laundry on a line
3. Baking bread
4. Tending a garden
5. Sweeping the porch
6. Collecting eggs
7. Making the bed
8. Setting the dinner table
9. Watering plants
10. Folding towels
11. Washing dishes
12. Raking leaves
13. Stacking firewood
14. Making preserves/canning
15. Brushing a horse
16. Carrying water buckets

Style guide: Gouache paint texture — visible brushstrokes, slightly imperfect edges. Color palette: warm ochres, sage greens, dusty rose, barn red, cream whites. Each scene includes one or two simple props. Compositions are clean and immediately readable. Nostalgic, warm feeling. No text.`,
      example_outputs: [],
      sort_order: 3,
      tags: ['gouache', 'homestead', 'chores', 'visual-schedule'],
    },
    {
      title: 'Batch D: Digital Avatars (Photorealistic)',
      prompt_text: `Create a 4x4 grid of 16 professional portrait photographs of the same family of 8 people. Each person appears twice in the grid (2 different poses/expressions per person). The family consists of:

Row 1: Sarah (mom, 38, warm brown hair, hazel eyes, kind smile) — pose 1 and pose 2
        Mark (dad, 40, short dark hair, blue eyes, strong jaw) — pose 1 and pose 2
Row 2: Alex (teen boy, 16, sandy brown hair, athletic build) — pose 1 and pose 2
        Casey (teen girl, 14, long auburn hair, freckles) — pose 1 and pose 2
Row 3: Jordan (girl, 10, dark curly hair, big brown eyes) — pose 1 and pose 2
        Ruthie (girl, 7, blonde pigtails, gap-toothed smile) — pose 1 and pose 2
Row 4: Amy (aide/caregiver, 25, black hair in bun, glasses) — pose 1 and pose 2
        Kylie (aide/caregiver, 22, red hair, bright green eyes) — pose 1 and pose 2

Photography style: Professional headshot quality. Natural lighting (golden hour window light). Neutral warm-toned background (cream/light gray gradient). Sharp focus on face. Shallow depth of field. Each portrait framed from chest up. Consistent lighting direction across all 16 cells.

CRITICAL: Each person must look the SAME in both their portraits — same face, same features, same person. Only the expression or slight angle changes between their two shots.`,
      example_outputs: [gridAUrl, gridBUrl],
      sort_order: 4,
      tags: ['photorealistic', 'avatars', 'portraits', 'family'],
    },
  ]

  for (const entry of entries) {
    const { data, error } = await supabase.from('vault_prompt_entries').insert({
      vault_item_id: pp.id,
      title: entry.title,
      prompt_text: entry.prompt_text,
      example_outputs: entry.example_outputs || [],
      reference_images: [],
      tags: entry.tags || [],
      sort_order: entry.sort_order,
      variable_placeholders: [],
    }).select('id').single()

    if (error) console.error(`Entry "${entry.title}" failed:`, error.message)
    else console.log(`  Entry created: ${data.id} — ${entry.title}`)
  }

  console.log('\n✓ All content loaded!')
}

main().catch(console.error)
