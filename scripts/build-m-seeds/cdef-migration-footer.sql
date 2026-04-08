
-- ============================================================================
-- Verification — RAISE NOTICE row counts
-- ============================================================================

DO $$
DECLARE
  v_total_visual_schedule INTEGER;
  v_cdef_count INTEGER;
  v_with_embedding INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_total_visual_schedule
    FROM public.platform_assets
   WHERE category = 'visual_schedule';

  -- Count just the new C/D/E/F rows (by checking for known feature_keys)
  SELECT COUNT(*) INTO v_cdef_count
    FROM public.platform_assets
   WHERE category = 'visual_schedule'
     AND feature_key IN (
       'vs_drink_water_B', 'vs_quiet_time_B', 'vs_prayer_B',
       'vs_take_medicine_B', 'vs_feel_proud_B', 'vs_say_sorry_B',
       'vs_make_bed_B', 'vs_pet_animal_B'
     );

  -- Count rows with embeddings populated (should include all 64 new ones)
  SELECT COUNT(*) INTO v_with_embedding
    FROM public.platform_assets
   WHERE category = 'visual_schedule'
     AND embedding IS NOT NULL;

  RAISE NOTICE '====================================================';
  RAISE NOTICE 'Build M C/D/E/F Icon Seed — Verification';
  RAISE NOTICE '====================================================';
  RAISE NOTICE 'Total visual_schedule rows:       %  (expected: 392 = 328 + 64)', v_total_visual_schedule;
  RAISE NOTICE 'C/D/E/F sample rows present:      %  (expected: 8)', v_cdef_count;
  RAISE NOTICE 'Rows with embeddings populated:   %', v_with_embedding;
  RAISE NOTICE '====================================================';

  IF v_cdef_count <> 8 THEN
    RAISE EXCEPTION 'C/D/E/F sample row count mismatch: got %, expected 8', v_cdef_count;
  END IF;
END $$;

COMMIT;
