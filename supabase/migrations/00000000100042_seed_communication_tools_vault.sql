-- ============================================================================
-- PRD-21: Seed Communication Tools as AI Vault Items
-- Makes Cyrano, Higgins Say, and Higgins Navigate accessible from the Vault
-- while the AI Toolbox sidebar (Phase 21-B) is being built.
-- ============================================================================

-- Add a "Communication & Connection" category if not present
INSERT INTO public.vault_categories (slug, display_name, description, icon, sort_order)
VALUES ('communication-connection', 'Communication & Connection', 'AI-powered relationship and communication coaching tools', 'MessageCircle', 6)
ON CONFLICT (slug) DO NOTHING;

-- Seed: Cyrano
INSERT INTO public.vault_items (
  display_title, detail_title, short_description, full_description,
  content_type, delivery_method, guided_mode_key,
  category_id, difficulty, tags, status, is_featured, teen_visible,
  portal_description, portal_tips,
  created_by
) SELECT
  'The Perfect Words', -- hook title (visible to everyone)
  'Cyrano — Spouse Message Crafting', -- detail title (tier-gated)
  'Craft messages to your partner that sound like you, only better.',
  'Cyrano helps you say what you mean to your spouse or partner in a way they''ll actually hear. It drafts messages in YOUR voice — not a greeting card voice — using what it knows about your partner''s love language, communication style, and preferences. Along the way, it teaches you one communication skill per conversation so you eventually don''t need it anymore.',
  'ai_tool', 'native', 'cyrano',
  (SELECT id FROM public.vault_categories WHERE slug = 'communication-connection'),
  'beginner',
  ARRAY['communication', 'marriage', 'spouse', 'message-crafting', 'love-languages'],
  'published', true, false,
  'Tell Cyrano what you want to say to your partner — the honest, unpolished version. It will craft a message that preserves your voice while adapting to how your partner receives communication best. Each time, it teaches you one skill to help you get better on your own.',
  ARRAY[
    'Think about what you actually want to say — the raw version is the best starting point',
    'The more context in your partner''s Archives profile, the better Cyrano''s suggestions',
    'Cyrano will teach you one communication skill per conversation — pay attention to those'
  ],
  (SELECT id FROM auth.users LIMIT 1)
WHERE NOT EXISTS (SELECT 1 FROM public.vault_items WHERE guided_mode_key = 'cyrano');

-- Seed: Higgins Say
INSERT INTO public.vault_items (
  display_title, detail_title, short_description, full_description,
  content_type, delivery_method, guided_mode_key,
  category_id, difficulty, tags, status, is_featured, teen_visible,
  portal_description, portal_tips,
  created_by
) SELECT
  'Find the Right Words', -- hook title
  'Higgins — Help Me Say Something', -- detail title
  'Craft the right message for any family relationship — kids, teens, parents, anyone.',
  'Higgins Say helps you craft messages for any family member — children, teens, young adults, parents, or peers. It automatically adapts its coaching to the specific relationship dynamic. For a 7-year-old, it uses simple, concrete language. For a teen, it respects autonomy and talks UP. For a young adult, it shifts from authority to consultant. Each interaction teaches one communication skill.',
  'ai_tool', 'native', 'higgins_say',
  (SELECT id FROM public.vault_categories WHERE slug = 'communication-connection'),
  'beginner',
  ARRAY['communication', 'parenting', 'teens', 'relationships', 'message-crafting'],
  'published', true, true,
  'Tell Higgins who you''re trying to talk to and what you want to say. It will adapt to the relationship — parent to child, child to parent, peer to peer — and help you find words that are both direct and kind.',
  ARRAY[
    'Select the person you''re writing to — Higgins adapts its coaching to the relationship',
    'Give the honest version first — Higgins works best with the real thing, not the polished version',
    'If you''re not sure what to say yet, try Higgins Navigate first to think it through'
  ],
  (SELECT id FROM auth.users LIMIT 1)
WHERE NOT EXISTS (SELECT 1 FROM public.vault_items WHERE guided_mode_key = 'higgins_say');

-- Seed: Higgins Navigate
INSERT INTO public.vault_items (
  display_title, detail_title, short_description, full_description,
  content_type, delivery_method, guided_mode_key,
  category_id, difficulty, tags, status, is_featured, teen_visible,
  portal_description, portal_tips,
  created_by
) SELECT
  'Think It Through', -- hook title
  'Higgins — Help Me Navigate This', -- detail title
  'Process a difficult situation and find your own best path forward.',
  'Higgins Navigate is not a message-crafting tool — it''s a thinking partner for hard relational situations. It follows a five-phase process: Listen (really listen, asking "what else?" until you''ve said everything), Validate (make you feel genuinely heard), explore with Curiosity (ask the question that changes everything), present Options (with honest tradeoffs), and Empower (return the decision to you). When you''re ready to act, it can hand off to Higgins Say to help you draft what you want to say.',
  'ai_tool', 'native', 'higgins_navigate',
  (SELECT id FROM public.vault_categories WHERE slug = 'communication-connection'),
  'beginner',
  ARRAY['communication', 'relationships', 'conflict-resolution', 'emotional-processing', 'coaching'],
  'published', true, true,
  'Describe the situation you''re navigating. Higgins will listen — really listen — before offering options. It won''t jump to solutions. When you''re ready, it helps you find your own next step.',
  ARRAY[
    'Take your time describing the situation — Higgins won''t rush you',
    'You can select multiple people if the situation involves more than one person',
    'When you''re ready to craft what you want to say, Higgins can switch to "Say Something" mode'
  ],
  (SELECT id FROM auth.users LIMIT 1)
WHERE NOT EXISTS (SELECT 1 FROM public.vault_items WHERE guided_mode_key = 'higgins_navigate');

-- ============================================================================
-- END Seed
-- ============================================================================
