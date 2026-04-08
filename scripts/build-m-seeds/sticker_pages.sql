-- Seed 26 Woodland Felt sticker book pages (background scenes)
-- Source: assets/gamification/woodland-felt/backgrounds-manifest.csv
DO $$
DECLARE
  v_theme_id UUID;
BEGIN
  SELECT id INTO v_theme_id FROM public.gamification_themes WHERE theme_slug = 'woodland_felt';
  IF v_theme_id IS NULL THEN
    RAISE EXCEPTION 'gamification_themes row for woodland_felt missing — must be inserted before sticker pages';
  END IF;

  INSERT INTO public.gamification_sticker_pages
    (theme_id, slug, display_name, scene, season, image_url, sort_order)
  VALUES
  (v_theme_id, 'woodland_bg_cherry_blossom_01', 'Cherry Blossom', 'cherry blossom', 'spring', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/gamification-assets/woodland-felt/backgrounds/woodland_bg_cherry_blossom_01.png', 1),
  (v_theme_id, 'woodland_bg_christmas_01', 'Christmas', 'christmas', 'winter', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/gamification-assets/woodland-felt/backgrounds/woodland_bg_christmas_01.png', 2),
  (v_theme_id, 'woodland_bg_christmas_02', 'Christmas 2', 'christmas', 'winter', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/gamification-assets/woodland-felt/backgrounds/woodland_bg_christmas_02.png', 3),
  (v_theme_id, 'woodland_bg_christmas_03', 'Christmas 3', 'christmas', 'winter', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/gamification-assets/woodland-felt/backgrounds/woodland_bg_christmas_03.png', 4),
  (v_theme_id, 'woodland_bg_fall_golden_hour_01', 'Fall Golden Hour', 'fall golden hour', 'autumn', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/gamification-assets/woodland-felt/backgrounds/woodland_bg_fall_golden_hour_01.png', 5),
  (v_theme_id, 'woodland_bg_fall_golden_hour_02', 'Fall Golden Hour 2', 'fall golden hour', 'autumn', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/gamification-assets/woodland-felt/backgrounds/woodland_bg_fall_golden_hour_02.png', 6),
  (v_theme_id, 'woodland_bg_fall_golden_hour_03', 'Fall Golden Hour 3', 'fall golden hour', 'autumn', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/gamification-assets/woodland-felt/backgrounds/woodland_bg_fall_golden_hour_03.png', 7),
  (v_theme_id, 'woodland_bg_fall_golden_hour_04', 'Fall Golden Hour 4', 'fall golden hour', 'autumn', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/gamification-assets/woodland-felt/backgrounds/woodland_bg_fall_golden_hour_04.png', 8),
  (v_theme_id, 'woodland_bg_firefly_dusk_01', 'Firefly Dusk', 'firefly dusk', 'summer', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/gamification-assets/woodland-felt/backgrounds/woodland_bg_firefly_dusk_01.png', 9),
  (v_theme_id, 'woodland_bg_harvest_festival_01', 'Harvest Festival', 'harvest festival', 'autumn', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/gamification-assets/woodland-felt/backgrounds/woodland_bg_harvest_festival_01.png', 10),
  (v_theme_id, 'woodland_bg_harvest_festival_02', 'Harvest Festival 2', 'harvest festival', 'autumn', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/gamification-assets/woodland-felt/backgrounds/woodland_bg_harvest_festival_02.png', 11),
  (v_theme_id, 'woodland_bg_harvest_festival_03', 'Harvest Festival 3', 'harvest festival', 'autumn', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/gamification-assets/woodland-felt/backgrounds/woodland_bg_harvest_festival_03.png', 12),
  (v_theme_id, 'woodland_bg_harvest_festival_04', 'Harvest Festival 4', 'harvest festival', 'autumn', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/gamification-assets/woodland-felt/backgrounds/woodland_bg_harvest_festival_04.png', 13),
  (v_theme_id, 'woodland_bg_moonlit_night_01', 'Moonlit Night', 'moonlit night', 'night', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/gamification-assets/woodland-felt/backgrounds/woodland_bg_moonlit_night_01.png', 14),
  (v_theme_id, 'woodland_bg_moonlit_night_02', 'Moonlit Night 2', 'moonlit night', 'night', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/gamification-assets/woodland-felt/backgrounds/woodland_bg_moonlit_night_02.png', 15),
  (v_theme_id, 'woodland_bg_rainy_day_01', 'Rainy Day', 'rainy day', 'spring', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/gamification-assets/woodland-felt/backgrounds/woodland_bg_rainy_day_01.png', 16),
  (v_theme_id, 'woodland_bg_rainy_day_02', 'Rainy Day 2', 'rainy day', 'spring', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/gamification-assets/woodland-felt/backgrounds/woodland_bg_rainy_day_02.png', 17),
  (v_theme_id, 'woodland_bg_rainy_day_03', 'Rainy Day 3', 'rainy day', 'spring', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/gamification-assets/woodland-felt/backgrounds/woodland_bg_rainy_day_03.png', 18),
  (v_theme_id, 'woodland_bg_spring_meadow_01', 'Spring Meadow', 'spring meadow', 'spring', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/gamification-assets/woodland-felt/backgrounds/woodland_bg_spring_meadow_01.png', 19),
  (v_theme_id, 'woodland_bg_spring_meadow_02', 'Spring Meadow 2', 'spring meadow', 'spring', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/gamification-assets/woodland-felt/backgrounds/woodland_bg_spring_meadow_02.png', 20),
  (v_theme_id, 'woodland_bg_spring_meadow_03', 'Spring Meadow 3', 'spring meadow', 'spring', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/gamification-assets/woodland-felt/backgrounds/woodland_bg_spring_meadow_03.png', 21),
  (v_theme_id, 'woodland_bg_summer_sunrise_01', 'Summer Sunrise', 'summer sunrise', 'summer', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/gamification-assets/woodland-felt/backgrounds/woodland_bg_summer_sunrise_01.png', 22),
  (v_theme_id, 'woodland_bg_summer_sunrise_02', 'Summer Sunrise 2', 'summer sunrise', 'summer', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/gamification-assets/woodland-felt/backgrounds/woodland_bg_summer_sunrise_02.png', 23),
  (v_theme_id, 'woodland_bg_summer_sunrise_03', 'Summer Sunrise 3', 'summer sunrise', 'summer', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/gamification-assets/woodland-felt/backgrounds/woodland_bg_summer_sunrise_03.png', 24),
  (v_theme_id, 'woodland_bg_summer_sunrise_04', 'Summer Sunrise 4', 'summer sunrise', 'summer', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/gamification-assets/woodland-felt/backgrounds/woodland_bg_summer_sunrise_04.png', 25),
  (v_theme_id, 'woodland_bg_winter_wonderland_01', 'Winter Wonderland', 'winter wonderland', 'winter', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/gamification-assets/woodland-felt/backgrounds/woodland_bg_winter_wonderland_01.png', 26)
  ON CONFLICT (theme_id, slug) DO NOTHING;
END $$;
