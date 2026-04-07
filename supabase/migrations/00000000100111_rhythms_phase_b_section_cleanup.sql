-- ============================================================
-- Migration 00000000100111: PRD-18 Rhythms Phase B section cleanup
--
-- Founder approved 2026-04-07. Tightens the morning rhythm section
-- defaults to follow the "front door OR genuinely helpful" rule:
-- a section earns its place in a rhythm modal only if it's a front
-- door to engagement with another part of the app, OR if it's
-- genuinely helpful in a way no other surface delivers.
--
-- What this migration does:
--
--   1. Drops `task_preview` from the default adult/independent
--      morning rhythm seed. Reason: it's a duplicate of the dashboard
--      Active Tasks section. Mom already sees today's tasks on her
--      dashboard 5 seconds before opening the rhythm modal. Showing
--      them again inside the modal is filler that dilutes the
--      identity-and-intent sections (Guiding Star, Best Intentions,
--      On the Horizon, Brain Dump).
--
--      Adult morning becomes 7 sections (was 8):
--        1. Guiding Star Rotation
--        2. Morning Priorities Recall
--        3. Best Intentions Focus
--        4. Calendar Preview                  ← was order 5
--        5. On the Horizon                    ← was order 6
--        6. Brain Dump                        ← was order 7
--        7. Periodic Cards Slot               ← was order 8
--
--      Calendar Preview KEEPS the family-wide scope for adults — mom
--      needs to see the whole family's day at a glance. No config
--      change for adult morning calendar_preview.
--
--   2. Replaces the Guided morning rhythm seed entirely. Reason:
--      Phase A seeded `encouraging_message` + `routine_checklist` +
--      `task_preview` — three sections that all duplicate the kid's
--      Guided dashboard (Active Tasks already shows routines AND
--      one-off tasks; the dashboard already greets the kid).
--      `routine_checklist` was never wired to a real renderer.
--      `encouraging_message` only got wired in Phase B by this build.
--
--      Guided morning becomes 3 sections (was 3 different):
--        1. Encouraging Message     (warm one-liner — the only
--                                    front door to "good morning")
--        2. Best Intentions Focus   (tap-to-celebrate the kid's
--                                    practices — auto-hides if none)
--        3. Calendar Preview        (config.scope='member' — only
--                                    events the kid attends; auto-
--                                    hides if none)
--
--      With all auto-hide rules, a Guided kid with no active
--      intentions and nothing on the calendar today sees just the
--      Encouraging Message and the Start My Day button — a 5-second
--      warm hello, perfect for an 8-year-old.
--
--   3. NO changes to the evening rhythm seed. Closing Thought and
--      From Your Library both stay enabled. Closing Thought now
--      auto-hides at the COMPONENT level when the member has fewer
--      than 5 active Guiding Stars (founder threshold rule —
--      reading the same 1-3 stars at bedtime that they saw in the
--      morning rotation feels redundant; with 5+ the rotation
--      pool is deep enough that bedtime feels like rediscovery).
--      No DB-level change needed for that — it's a render guard
--      in src/components/rhythms/sections/ClosingThoughtSection.tsx.
--
--   4. NO changes to the Play, adult evening, weekly review, monthly
--      review, or quarterly inventory seeds. They were already
--      correct after migration 100110.
-- ============================================================


-- ============================================================
-- 1. Replace auto_provision_member_resources() with the new
--    section sequences. Preserves all prior logic from migration
--    100110 EXCEPT:
--      - adult/independent morning: drops task_preview, renumbers
--      - guided morning: replaces 3 sections with new 3 sections
-- ============================================================
CREATE OR REPLACE FUNCTION public.auto_provision_member_resources()
RETURNS TRIGGER AS $$
DECLARE
  dash_type TEXT;
BEGIN
  -- 1. Create personal archive folder
  INSERT INTO public.archive_folders (family_id, member_id, folder_name, folder_type)
  VALUES (NEW.family_id, NEW.id, NEW.display_name || '''s Archives', 'family_member')
  ON CONFLICT DO NOTHING;

  -- 2. Create dashboard_config if member has a dashboard
  IF NEW.dashboard_enabled IS NOT false THEN
    IF NEW.dashboard_mode = 'play' THEN
      dash_type := 'play';
    ELSIF NEW.dashboard_mode = 'guided' THEN
      dash_type := 'guided';
    ELSE
      dash_type := 'personal';
    END IF;

    INSERT INTO public.dashboard_configs (family_id, family_member_id, dashboard_type)
    VALUES (NEW.family_id, NEW.id, dash_type)
    ON CONFLICT DO NOTHING;
  END IF;

  -- 3. Create Backburner & Ideas lists for non-Guided/Play members
  IF NEW.dashboard_mode IS NULL OR NEW.dashboard_mode NOT IN ('guided', 'play') THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.lists
      WHERE family_id = NEW.family_id
        AND owner_id = NEW.id
        AND list_type = 'backburner'
        AND archived_at IS NULL
    ) THEN
      INSERT INTO public.lists (family_id, owner_id, title, list_type)
      VALUES (NEW.family_id, NEW.id, 'Backburner', 'backburner');
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM public.lists
      WHERE family_id = NEW.family_id
        AND owner_id = NEW.id
        AND list_type = 'ideas'
        AND archived_at IS NULL
    ) THEN
      INSERT INTO public.lists (family_id, owner_id, title, list_type)
      VALUES (NEW.family_id, NEW.id, 'Ideas', 'ideas');
    END IF;
  END IF;

  -- 4. Seed default rhythm_configs based on role / dashboard_mode
  IF NEW.dashboard_mode = 'play' THEN
    -- Play: morning only (simplified sections)
    INSERT INTO public.rhythm_configs
      (family_id, member_id, rhythm_key, display_name, rhythm_type, enabled, sections, timing)
    VALUES (
      NEW.family_id, NEW.id,
      'morning', 'Morning', 'default', true,
      '[
        {"section_type":"encouraging_message","enabled":true,"order":1,"config":{}},
        {"section_type":"routine_checklist","enabled":true,"order":2,"config":{}}
      ]'::jsonb,
      '{"start_hour":5,"end_hour":12,"trigger_type":"time_window"}'::jsonb
    )
    ON CONFLICT (family_id, member_id, rhythm_key) DO NOTHING;

  ELSIF NEW.dashboard_mode = 'guided' THEN
    -- Guided: morning rhythm — 3 sections, all front-door or genuinely helpful
    INSERT INTO public.rhythm_configs
      (family_id, member_id, rhythm_key, display_name, rhythm_type, enabled, sections, timing)
    VALUES (
      NEW.family_id, NEW.id,
      'morning', 'Morning', 'default', true,
      '[
        {"section_type":"encouraging_message","enabled":true,"order":1,"config":{}},
        {"section_type":"best_intentions_focus","enabled":true,"order":2,"config":{}},
        {"section_type":"calendar_preview","enabled":true,"order":3,"config":{"scope":"member"}}
      ]'::jsonb,
      '{"start_hour":5,"end_hour":12,"trigger_type":"time_window"}'::jsonb
    )
    ON CONFLICT (family_id, member_id, rhythm_key) DO NOTHING;

    -- Guided: mini evening rhythm (5 sections — preserved from 100106)
    INSERT INTO public.rhythm_configs
      (family_id, member_id, rhythm_key, display_name, rhythm_type, enabled,
       section_order_locked, sections, timing)
    VALUES (
      NEW.family_id, NEW.id,
      'evening', 'Evening', 'default', true, true,
      '[
        {"section_type":"guided_day_highlights","enabled":true,"order":1,"config":{}},
        {"section_type":"guided_pride_reflection","enabled":true,"order":2,"config":{}},
        {"section_type":"guided_reflections","enabled":true,"order":3,"config":{}},
        {"section_type":"guided_tomorrow_lookahead","enabled":true,"order":4,"config":{}},
        {"section_type":"close_my_day","enabled":true,"order":5,"config":{}}
      ]'::jsonb,
      '{"start_hour":18,"end_hour":24,"trigger_type":"time_window"}'::jsonb
    )
    ON CONFLICT (family_id, member_id, rhythm_key) DO NOTHING;

  ELSE
    -- Adult (dashboard_mode IS NULL or 'personal') and Independent teen
    -- ('independent'). Teen framing language wires Phase D.

    -- Morning (enabled) — 7 sections, drops task_preview vs migration 100110
    INSERT INTO public.rhythm_configs
      (family_id, member_id, rhythm_key, display_name, rhythm_type, enabled, sections, timing)
    VALUES (
      NEW.family_id, NEW.id,
      'morning', 'Morning Rhythm', 'default', true,
      '[
        {"section_type":"guiding_star_rotation","enabled":true,"order":1,"config":{}},
        {"section_type":"morning_priorities_recall","enabled":true,"order":2,"config":{}},
        {"section_type":"best_intentions_focus","enabled":true,"order":3,"config":{}},
        {"section_type":"calendar_preview","enabled":true,"order":4,"config":{}},
        {"section_type":"on_the_horizon","enabled":true,"order":5,"config":{"lookahead_days":7,"max_items":5}},
        {"section_type":"brain_dump","enabled":true,"order":6,"config":{}},
        {"section_type":"periodic_cards_slot","enabled":true,"order":7,"config":{}}
      ]'::jsonb,
      '{"start_hour":5,"end_hour":12,"trigger_type":"time_window"}'::jsonb
    )
    ON CONFLICT (family_id, member_id, rhythm_key) DO NOTHING;

    -- Evening (enabled, section_order_locked=true — fixed narrative arc)
    -- carry_forward is off by default per PRD-18 Enhancement 5
    INSERT INTO public.rhythm_configs
      (family_id, member_id, rhythm_key, display_name, rhythm_type, enabled,
       section_order_locked, sections, timing)
    VALUES (
      NEW.family_id, NEW.id,
      'evening', 'Evening Rhythm', 'default', true, true,
      '[
        {"section_type":"evening_greeting","enabled":true,"order":1,"config":{}},
        {"section_type":"accomplishments_victories","enabled":true,"order":2,"config":{}},
        {"section_type":"completed_meetings","enabled":true,"order":3,"config":{}},
        {"section_type":"milestone_celebrations","enabled":true,"order":4,"config":{}},
        {"section_type":"carry_forward","enabled":false,"order":5,"config":{}},
        {"section_type":"evening_tomorrow_capture","enabled":true,"order":6,"config":{}},
        {"section_type":"mindsweep_lite","enabled":true,"order":7,"config":{"collapsed_by_default":true}},
        {"section_type":"closing_thought","enabled":true,"order":8,"config":{}},
        {"section_type":"from_your_library","enabled":true,"order":9,"config":{}},
        {"section_type":"before_close_the_day","enabled":true,"order":10,"config":{}},
        {"section_type":"reflections","enabled":true,"order":11,"config":{}},
        {"section_type":"rhythm_tracker_prompts","enabled":true,"order":12,"config":{}},
        {"section_type":"close_my_day","enabled":true,"order":13,"config":{}}
      ]'::jsonb,
      '{"start_hour":18,"end_hour":24,"trigger_type":"time_window"}'::jsonb
    )
    ON CONFLICT (family_id, member_id, rhythm_key) DO NOTHING;

    -- Weekly Review (enabled, triggers Friday by default)
    INSERT INTO public.rhythm_configs
      (family_id, member_id, rhythm_key, display_name, rhythm_type, enabled, sections, timing)
    VALUES (
      NEW.family_id, NEW.id,
      'weekly_review', 'Weekly Review', 'default', true,
      '[
        {"section_type":"weekly_stats","enabled":true,"order":1,"config":{}},
        {"section_type":"top_victories","enabled":true,"order":2,"config":{}},
        {"section_type":"next_week_preview","enabled":true,"order":3,"config":{}},
        {"section_type":"weekly_reflection_prompt","enabled":true,"order":4,"config":{}},
        {"section_type":"weekly_review_deep_dive","enabled":true,"order":5,"config":{}}
      ]'::jsonb,
      '{"trigger_type":"weekly","day_of_week":5}'::jsonb
    )
    ON CONFLICT (family_id, member_id, rhythm_key) DO NOTHING;

    -- Monthly Review (disabled by default — user opts in)
    INSERT INTO public.rhythm_configs
      (family_id, member_id, rhythm_key, display_name, rhythm_type, enabled, sections, timing)
    VALUES (
      NEW.family_id, NEW.id,
      'monthly_review', 'Monthly Review', 'default', false,
      '[
        {"section_type":"month_at_a_glance","enabled":true,"order":1,"config":{}},
        {"section_type":"highlight_reel","enabled":true,"order":2,"config":{}},
        {"section_type":"reports_link","enabled":true,"order":3,"config":{}},
        {"section_type":"monthly_review_deep_dive","enabled":true,"order":4,"config":{}}
      ]'::jsonb,
      '{"trigger_type":"monthly","day_of_month":1}'::jsonb
    )
    ON CONFLICT (family_id, member_id, rhythm_key) DO NOTHING;

    -- Quarterly Inventory (disabled by default — triggers at ~90-day LifeLantern staleness)
    INSERT INTO public.rhythm_configs
      (family_id, member_id, rhythm_key, display_name, rhythm_type, enabled, sections, timing)
    VALUES (
      NEW.family_id, NEW.id,
      'quarterly_inventory', 'Quarterly Inventory', 'default', false,
      '[
        {"section_type":"stale_areas","enabled":true,"order":1,"config":{}},
        {"section_type":"quick_win_suggestion","enabled":true,"order":2,"config":{}},
        {"section_type":"lifelantern_launch_link","enabled":true,"order":3,"config":{}}
      ]'::jsonb,
      '{"trigger_type":"lifelantern_staleness","interval_days":90}'::jsonb
    )
    ON CONFLICT (family_id, member_id, rhythm_key) DO NOTHING;

  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ============================================================
-- 2. Backfill: replace adult/independent morning rhythm sections.
--    Drops task_preview, renumbers downstream. Idempotent — only
--    updates rows that still contain task_preview.
-- ============================================================
UPDATE public.rhythm_configs rc
SET sections = '[
  {"section_type":"guiding_star_rotation","enabled":true,"order":1,"config":{}},
  {"section_type":"morning_priorities_recall","enabled":true,"order":2,"config":{}},
  {"section_type":"best_intentions_focus","enabled":true,"order":3,"config":{}},
  {"section_type":"calendar_preview","enabled":true,"order":4,"config":{}},
  {"section_type":"on_the_horizon","enabled":true,"order":5,"config":{"lookahead_days":7,"max_items":5}},
  {"section_type":"brain_dump","enabled":true,"order":6,"config":{}},
  {"section_type":"periodic_cards_slot","enabled":true,"order":7,"config":{}}
]'::jsonb
FROM public.family_members fm
WHERE rc.member_id = fm.id
  AND fm.is_active = true
  AND (fm.dashboard_mode IS NULL OR fm.dashboard_mode NOT IN ('guided', 'play'))
  AND rc.rhythm_key = 'morning'
  AND (rc.sections @> '[{"section_type":"task_preview"}]'::jsonb);


-- ============================================================
-- 3. Backfill: replace existing Guided morning rhythm sections.
--    Drops routine_checklist + task_preview, adds the new 3-section
--    sequence (encouraging_message, best_intentions_focus,
--    calendar_preview member-scoped). Idempotent — only updates
--    rows that still contain task_preview OR routine_checklist.
-- ============================================================
UPDATE public.rhythm_configs rc
SET sections = '[
  {"section_type":"encouraging_message","enabled":true,"order":1,"config":{}},
  {"section_type":"best_intentions_focus","enabled":true,"order":2,"config":{}},
  {"section_type":"calendar_preview","enabled":true,"order":3,"config":{"scope":"member"}}
]'::jsonb
FROM public.family_members fm
WHERE rc.member_id = fm.id
  AND fm.dashboard_mode = 'guided'
  AND fm.is_active = true
  AND rc.rhythm_key = 'morning'
  AND (
    rc.sections @> '[{"section_type":"task_preview"}]'::jsonb
    OR rc.sections @> '[{"section_type":"routine_checklist"}]'::jsonb
  );
