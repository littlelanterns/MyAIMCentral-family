-- Seed Woodland Felt theme row + 2 reveal video URLs
-- Source: assets/gamification/woodland-felt/reveals-manifest.csv (corrected per Build M decision)
INSERT INTO public.gamification_themes
  (theme_slug, display_name, description, creature_reveal_video_url, page_reveal_video_url, is_active, sort_order)
VALUES (
  'woodland_felt',
  'Woodland Felt',
  'Cozy paper-craft woodland creatures and seasonal scene backgrounds. The first gamification theme; default for all members.',
  'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/gamification-assets/woodland-felt/reveals/Mossy_Chest_Reveal_Video_Ready.mp4',
  'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/gamification-assets/woodland-felt/reveals/Fairy_Door_Opens_Magical_Light.mp4',
  true,
  1
)
ON CONFLICT (theme_slug) DO NOTHING;
