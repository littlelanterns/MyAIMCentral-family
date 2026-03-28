# Workflow: Pull Condensed Intelligence from StewardShip

## When to Use This

Before building any feature that needs extracted book wisdom to inform LiLa's prompts, system design, or coaching patterns. This was used successfully for BigPlans (PRD-29) and ThoughtSift (PRD-34) — the results are in `reference/bigplans_condensed_intelligence.md` and `reference/thoughtsift_condensed_intelligence.md`.

## Features That Need This

| Feature | PRD | What to Search For |
|---------|-----|-------------------|
| **Gamification** | PRD-24, 24A, 24B | Motivation psychology, intrinsic vs extrinsic rewards, habit loops, celebration, play, dopamine, flow states, autonomy/mastery/purpose |
| **Safe Harbor** | PRD-20 | Emotional regulation, crisis support, IFS parts work, de-escalation, grounding techniques, trauma-informed care, stress response |
| **LiLa Optimizer** | PRD-05C | Coaching patterns, question frameworks, meal planning systems, household optimization, decision fatigue, simplification |
| **Rhythms & Reflections** | PRD-18 | Morning/evening routines, reflection practices, mindfulness, gratitude, daily check-in patterns, keystone habits |
| **MindSweep** | PRD-17B | Brain dump methodology, GTD capture/process/organize, cognitive load, worry management, processing workflows |
| **Communication Tools** | PRD-21 | NVC (Nonviolent Communication), active listening, conflict resolution, Coaching Habit question patterns, empathy, boundaries |
| **Guiding Stars** | PRD-06 | Values clarification, identity-based goals, north star thinking, personal mission, life compass |
| **LifeLantern** | PRD-12A | Life assessment, wheel of life, satisfaction scoring, growth areas, self-awareness |
| **BookShelf Discussions** | PRD-23 | (Uses all extractions — this is the RAG system itself) |

## How to Run It

### Step 1: Connect to StewardShip Database

```bash
# Using the Supabase REST API
curl "${STEWARDSHIP_SUPABASE_URL}/rest/v1/manifest_items?select=id,title,author,extraction_status" \
  -H "apikey: ${STEWARDSHIP_SUPABASE_ANON_KEY}" \
  -H "Authorization: Bearer ${STEWARDSHIP_SUPABASE_ANON_KEY}"
```

Or via direct SQL if you have the DATABASE_URL:
```sql
SELECT id, title, author, extraction_status FROM manifest_items WHERE user_id = 'YOUR_USER_ID';
```

### Step 2: Run Semantic Searches

For each feature, run semantic similarity searches across the extraction tables:
- `ai_framework_principles` — frameworks and methodologies
- `ai_book_summaries` — chapter and book summaries
- `ai_action_steps` — practical action items
- `ai_questions` — coaching and reflection questions
- `ai_declarations` — identity statements and affirmations

Search query pattern:
```sql
SELECT 
  e.content,
  e.extraction_type,
  e.section_title,
  m.title as book_title,
  m.author
FROM ai_framework_principles e
JOIN manifest_items m ON e.manifest_item_id = m.id
WHERE e.embedding <=> embedding('text-embedding-3-small', 'YOUR SEARCH CONCEPT HERE')::vector < 0.3
ORDER BY e.embedding <=> embedding('text-embedding-3-small', 'YOUR SEARCH CONCEPT HERE')::vector
LIMIT 50;
```

### Step 3: Condense and Organize

Take the raw search results and condense them:
1. Remove duplicates (many books say similar things)
2. Keep the best articulation of each concept
3. Note the book title in parentheses for attribution
4. Organize by CONCEPT CLUSTER, not by book
5. Apply the quality bar: "Would knowing this change how I design a screen, write a LiLa prompt, structure a conversation flow, or diagnose a friction point?"

### Step 4: Save Output

Save to `reference/{feature-name}_condensed_intelligence.md`

This file then gets referenced in the build prompt for that feature, so Opus has the extracted wisdom available when writing LiLa's system prompts and coaching patterns.

## Already Completed

- [x] BigPlans (PRD-29) → `reference/bigplans_condensed_intelligence.md`
- [x] ThoughtSift (PRD-34) → `reference/thoughtsift_condensed_intelligence.md`
- [ ] Gamification (PRD-24)
- [ ] Safe Harbor (PRD-20)
- [ ] LiLa Optimizer (PRD-05C)
- [ ] Rhythms & Reflections (PRD-18)
- [ ] MindSweep (PRD-17B)
- [ ] Communication Tools (PRD-21)
- [ ] Guiding Stars (PRD-06)
- [ ] LifeLantern (PRD-12A)
