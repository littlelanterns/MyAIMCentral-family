-- ============================================================================
-- PRD-21 Phase 21-B: Seed 5 Love Language tools as AI Vault items
-- ============================================================================

-- Quality Time
INSERT INTO public.vault_items (
  display_title, detail_title, short_description, full_description,
  content_type, delivery_method, guided_mode_key,
  category_id, difficulty, tags, status, is_featured, teen_visible,
  portal_description, portal_tips, created_by
) SELECT
  'Plan Connection Time',
  'Quality Time — Meaningful Activity Planner',
  'Get personalized activity suggestions that match who they actually are.',
  'Quality Time helps you plan meaningful connection with any family member. It looks at what it knows about the person — their interests, personality, love language, and age — and suggests specific activities with practical details and a connection prompt to create depth during the activity. Not generic "go on a walk" suggestions — real ideas grounded in who they actually are.',
  'ai_tool', 'native', 'quality_time',
  (SELECT id FROM public.vault_categories WHERE slug = 'communication-connection'),
  'beginner', ARRAY['quality-time', 'connection', 'activities', 'love-languages'],
  'published', false, true,
  'Tell LiLa who you want to connect with. She''ll suggest activities based on their interests, age, and personality — with a question or moment to deepen the connection during the activity.',
  ARRAY['Select the person first — personalized suggestions are much better than generic ones', 'The more you''ve added to their Archives profile, the better the suggestions get'],
  (SELECT id FROM auth.users LIMIT 1)
WHERE NOT EXISTS (SELECT 1 FROM public.vault_items WHERE guided_mode_key = 'quality_time');

-- Gifts
INSERT INTO public.vault_items (
  display_title, detail_title, short_description, full_description,
  content_type, delivery_method, guided_mode_key,
  category_id, difficulty, tags, status, is_featured, teen_visible,
  portal_description, portal_tips, created_by
) SELECT
  'The Gift That Lands',
  'Gifts — Personalized Gift Finder',
  'Find gifts that say "I was thinking about you" — not generic suggestions.',
  'The Gifts tool helps you find something that communicates real attention. It pulls from the person''s wishlist, interests, personality, and context to suggest specific items — not categories. It remembers what they don''t like so it never suggests the same vetoed item twice. Every suggestion explains why it works for this specific person.',
  'ai_tool', 'native', 'gifts',
  (SELECT id FROM public.vault_categories WHERE slug = 'communication-connection'),
  'beginner', ARRAY['gifts', 'shopping', 'love-languages', 'personalization'],
  'published', false, true,
  'Tell LiLa who you''re shopping for. She''ll check their wishlist and what she knows about them, then suggest specific gifts with price ranges and explanations of why each one fits.',
  ARRAY['If the person has a wishlist in Lists, LiLa will surface those items first', 'Mention if there''s an occasion or budget — LiLa adapts accordingly'],
  (SELECT id FROM auth.users LIMIT 1)
WHERE NOT EXISTS (SELECT 1 FROM public.vault_items WHERE guided_mode_key = 'gifts');

-- Observe & Serve
INSERT INTO public.vault_items (
  display_title, detail_title, short_description, full_description,
  content_type, delivery_method, guided_mode_key,
  category_id, difficulty, tags, status, is_featured, teen_visible,
  portal_description, portal_tips, created_by
) SELECT
  'See What They Need',
  'Observe & Serve — Hidden Need Detector',
  'Surface needs they''d never ask for and find specific ways to serve.',
  'Observe & Serve helps you see what someone actually needs — not what you think they need. It reads their context, private notes, and patterns to surface hidden frustrations, unmet needs, and overlooked opportunities for service. Every suggestion is specific enough to act on today, framed as a freely chosen act rather than an obligation.',
  'ai_tool', 'native', 'observe_serve',
  (SELECT id FROM public.vault_categories WHERE slug = 'communication-connection'),
  'beginner', ARRAY['service', 'acts-of-service', 'love-languages', 'hidden-needs'],
  'published', false, false,
  'Tell LiLa who you''re thinking about. She''ll look at what she knows about them and suggest specific acts of service — the kind they''d never ask for but would mean the world.',
  ARRAY['The more context you''ve added about this person, the more specific the suggestions', 'LiLa will never frame service as obligation — only as chosen acts of love'],
  (SELECT id FROM auth.users LIMIT 1)
WHERE NOT EXISTS (SELECT 1 FROM public.vault_items WHERE guided_mode_key = 'observe_serve');

-- Words of Affirmation
INSERT INTO public.vault_items (
  display_title, detail_title, short_description, full_description,
  content_type, delivery_method, guided_mode_key,
  category_id, difficulty, tags, status, is_featured, teen_visible,
  portal_description, portal_tips, created_by
) SELECT
  'Words That Actually Land',
  'Words of Affirmation — Specific Encouragement Crafter',
  'Craft genuine, specific affirmations rooted in what you''ve actually noticed.',
  'Words of Affirmation helps you say something real and specific — not "you''re amazing" but the kind of observation that proves you were paying attention. It calibrates to the four subtypes (affection, praise, encouragement, positive guidance) based on who the person is and what they respond to. For children, it uses age-appropriate identity-building language.',
  'ai_tool', 'native', 'words_affirmation',
  (SELECT id FROM public.vault_categories WHERE slug = 'communication-connection'),
  'beginner', ARRAY['affirmation', 'encouragement', 'love-languages', 'communication'],
  'published', false, true,
  'Tell LiLa who you want to encourage and what you''ve noticed about them. She''ll craft specific, evidence-based affirmations calibrated to how that person best receives words of encouragement.',
  ARRAY['The best affirmations reference something specific you observed — tell LiLa what you noticed', 'For children, LiLa uses identity-building language appropriate to their age'],
  (SELECT id FROM auth.users LIMIT 1)
WHERE NOT EXISTS (SELECT 1 FROM public.vault_items WHERE guided_mode_key = 'words_affirmation');

-- Gratitude
INSERT INTO public.vault_items (
  display_title, detail_title, short_description, full_description,
  content_type, delivery_method, guided_mode_key,
  category_id, difficulty, tags, status, is_featured, teen_visible,
  portal_description, portal_tips, created_by
) SELECT
  'Name What Matters',
  'Gratitude — Deepen Your Thankfulness',
  'Move grateful thoughts from inside to outside — specific, concrete, and real.',
  'Gratitude helps you practice intentional thankfulness — either for a specific person or as a general practice. It goes deeper than surface gratitude, helping you articulate why something mattered, what need it met, and what it says about the person. You can save reflections to your journal or share them directly with the person who inspired them.',
  'ai_tool', 'native', 'gratitude',
  (SELECT id FROM public.vault_categories WHERE slug = 'communication-connection'),
  'beginner', ARRAY['gratitude', 'journal', 'reflection', 'love-languages'],
  'published', false, true,
  'Share what you''re grateful for — a person, a moment, anything. LiLa will help you deepen it, articulate why it matters, and save it to your journal or share it directly.',
  ARRAY['You can use this with or without selecting a specific person', 'Quick capture is available — just jot a thought and LiLa saves it'],
  (SELECT id FROM auth.users LIMIT 1)
WHERE NOT EXISTS (SELECT 1 FROM public.vault_items WHERE guided_mode_key = 'gratitude');
