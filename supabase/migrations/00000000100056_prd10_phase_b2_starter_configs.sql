-- ============================================================
-- Migration 100056: PRD-10 Phase B-2 — Expand widget starter configs to 35+
-- Authoritative source: specs/studio-seed-templates.md Section 3
-- ============================================================
-- Adds 25 new starter configurations across 8 life-area categories.
-- 10 configs already exist from migration 100032 — those inserts are
-- repeated here so the full catalog is readable in one place, but they
-- all land on ON CONFLICT (config_name) DO NOTHING so re-runs are safe.
--
-- Categories covered:
--   Daily Life & Routines  (6)
--   Learning & School      (5)
--   Chores & Responsibility(4)
--   Money & Allowance      (3)
--   Goals & Milestones     (4)
--   Health & Wellness      (4)
--   Family & Multiplayer   (4)
--   Special Needs & Therapy(4)
--   Achievement & Recognition (3)   [partial overlap with Goals]
--
-- Total net-new rows: 25 (10 existing skip via ON CONFLICT)
-- Idempotent: safe to re-run at any time.
-- ============================================================

-- ============================================================
-- DAILY LIFE & ROUTINES
-- ============================================================

-- ── 1. Morning Routine Streak (already exists — skips cleanly) ─

INSERT INTO public.widget_starter_configs (
  id, tracker_type, visual_variant, config_name, description,
  category, default_config, is_example, sort_order
) VALUES (
  md5('widget_starter::Morning Routine Streak')::uuid,
  'streak',
  'flame_counter',
  'Morning Routine Streak',
  'Tracks consecutive days the morning routine is completed. Current streak shown as a flame counter with milestone celebrations. Longest streak stored. Connects to morning routine task completion automatically.',
  'Daily Life & Routines',
  '{
    "title": "[Name]''s Morning Streak",
    "auto_track_source": "linked_routine",
    "grace_period": 0,
    "celebration_at_milestones": [7, 14, 30, 60, 100],
    "assigned_to": null
  }'::jsonb,
  false,
  10
) ON CONFLICT (config_name) DO NOTHING;

-- ── 2. Daily Habit Grid (already exists — skips cleanly) ────────

INSERT INTO public.widget_starter_configs (
  id, tracker_type, visual_variant, config_name, description,
  category, default_config, is_example, sort_order
) VALUES (
  md5('widget_starter::Daily Habit Grid')::uuid,
  'multi_habit_grid',
  'bujo_monthly_grid',
  'Daily Habit Grid',
  'A classic bullet-journal-style monthly grid. Each row is a habit, each column is a day. Tap a cell to mark it done. Builds a beautiful visual record over time. Perfect for tracking daily yes/no habits across a month.',
  'Daily Life & Routines',
  '{
    "title": "[Name]''s Habit Grid",
    "grid_size": "monthly",
    "default_habits": ["Make bed", "Read 20 min", "Exercise", "Kind deed"],
    "visual_style": "artistic",
    "reset_period": "monthly"
  }'::jsonb,
  false,
  20
) ON CONFLICT (config_name) DO NOTHING;

-- ── 3. Daily Check-In ───────────────────────────────────────────

INSERT INTO public.widget_starter_configs (
  id, tracker_type, visual_variant, config_name, description,
  category, default_config, is_example, sort_order
) VALUES (
  md5('widget_starter::Daily Check-In')::uuid,
  'boolean_checkin',
  'simple_toggle',
  'Daily Check-In',
  'A single yes/no tap for the day. Did it happen? Great for binary habits like taking a vitamin, drinking enough water, or completing a daily reading goal. Simple, fast, no friction. Shows a calendar-style history of your yes/no streak.',
  'Daily Life & Routines',
  '{
    "title": "[Habit Name]",
    "prompt_text": "Did you do it today?",
    "show_streak": true,
    "show_history_calendar": true,
    "reset_period": "daily",
    "assigned_to": null
  }'::jsonb,
  false,
  30
) ON CONFLICT (config_name) DO NOTHING;

-- ── 4. Evening Checklist ────────────────────────────────────────

INSERT INTO public.widget_starter_configs (
  id, tracker_type, visual_variant, config_name, description,
  category, default_config, is_example, sort_order
) VALUES (
  md5('widget_starter::Evening Checklist')::uuid,
  'checklist',
  'standard_checklist',
  'Evening Checklist',
  'A simple evening wind-down checklist. Tap each step as it is done. Resets fresh each night. Works for any age — from mom''s end-of-day review to a child''s before-bed routine. Connect to a linked routine task for auto-tracking, or fill in manually.',
  'Daily Life & Routines',
  '{
    "title": "Evening Routine",
    "default_steps": ["Pack bag for tomorrow", "Tidy room", "Brush teeth", "Lights out by 9pm"],
    "reset_period": "daily",
    "auto_track_source": "linked_routine",
    "assigned_to": null
  }'::jsonb,
  false,
  40
) ON CONFLICT (config_name) DO NOTHING;

-- ── 5. Bedtime Routine ──────────────────────────────────────────

INSERT INTO public.widget_starter_configs (
  id, tracker_type, visual_variant, config_name, description,
  category, default_config, is_example, sort_order
) VALUES (
  md5('widget_starter::Bedtime Routine')::uuid,
  'checklist',
  'card_stack',
  'Bedtime Routine',
  'A card-stack style bedtime checklist designed for younger children. Each step is a large, tappable card they flip through one at a time. Satisfying completion animation. Mom can see at a glance whether it was done. Perfect for Guided and Play shell children.',
  'Daily Life & Routines',
  '{
    "title": "Bedtime Routine",
    "default_steps": ["PJs on", "Brush teeth", "Pick up toys", "Story time", "Lights out"],
    "card_style": "big_touch",
    "animation": "flip",
    "reset_period": "daily",
    "celebration_type": "sparkle",
    "assigned_to": null
  }'::jsonb,
  false,
  50
) ON CONFLICT (config_name) DO NOTHING;

-- ── 6. Daily Mood Check-In (already exists — skips cleanly) ─────

INSERT INTO public.widget_starter_configs (
  id, tracker_type, visual_variant, config_name, description,
  category, default_config, is_example, sort_order
) VALUES (
  md5('widget_starter::Daily Mood Check-In')::uuid,
  'mood_rating',
  'emoji_row_trend',
  'Daily Mood Check-In',
  'Tap an emoji face to record today''s mood. A rolling trend line shows the last 30 days at a glance. Not shared by default — this one is personal. Great for mom tracking her own rhythms, or for older kids building emotional self-awareness.',
  'Daily Life & Routines',
  '{
    "title": "My Daily Check-In",
    "scale_type": "emoji_5",
    "scale_labels": ["Rough", "Low", "Okay", "Good", "Great"],
    "show_trend_line": true,
    "sharing_enabled": false,
    "notes_enabled": true,
    "reset_period": "daily",
    "assigned_to": null
  }'::jsonb,
  false,
  60
) ON CONFLICT (config_name) DO NOTHING;

-- ============================================================
-- LEARNING & SCHOOL
-- ============================================================

-- ── 7. Reading Log (already exists as "Reading Log (Books)") ────
--    New entry uses the user-spec name; existing record is untouched.

INSERT INTO public.widget_starter_configs (
  id, tracker_type, visual_variant, config_name, description,
  category, default_config, is_example, sort_order
) VALUES (
  md5('widget_starter::Reading Log')::uuid,
  'tally',
  'star_chart',
  'Reading Log',
  'Counts books finished. Each completion adds a star to the chart. Set a reading goal for the year and watch it fill up. Turn on multiplayer mode to race siblings to the finish. Tap any star to log a title and date.',
  'Learning & School',
  '{
    "title": "[Name]''s Reading Goal",
    "measurement_unit": "books",
    "target_number": 20,
    "reset_period": "yearly",
    "multiplayer_compatible": true,
    "log_titles": true,
    "celebration_type": "confetti"
  }'::jsonb,
  false,
  110
) ON CONFLICT (config_name) DO NOTHING;

-- ── 8. Homeschool Hours by Subject (already exists — skips cleanly)

INSERT INTO public.widget_starter_configs (
  id, tracker_type, visual_variant, config_name, description,
  category, default_config, is_example, sort_order
) VALUES (
  md5('widget_starter::Homeschool Hours by Subject')::uuid,
  'timer_duration',
  'time_bar_chart',
  'Homeschool Hours by Subject',
  'Tracks time spent on each subject per week. Each bar represents a subject. Mom sees total hours at a glance. Perfect for ESA documentation and for making sure subjects aren''t getting squeezed. Links to task completion timers automatically.',
  'Learning & School',
  '{
    "title": "[Name]''s School Hours",
    "measurement_unit": "hours",
    "subjects": ["Math", "Language Arts", "Science", "History", "Read-Aloud", "Other"],
    "time_range": "weekly",
    "show_total": true,
    "show_average": true,
    "auto_track_source": "focus_timer"
  }'::jsonb,
  false,
  120
) ON CONFLICT (config_name) DO NOTHING;

-- ── 9. Math Practice Streak ─────────────────────────────────────

INSERT INTO public.widget_starter_configs (
  id, tracker_type, visual_variant, config_name, description,
  category, default_config, is_example, sort_order
) VALUES (
  md5('widget_starter::Math Practice Streak')::uuid,
  'streak',
  'chain_links',
  'Math Practice Streak',
  'A chain-link streak tracker for daily math practice. Each day a math task is completed, another link is added to the chain. Breaking the chain is visually clear — great motivation to keep it going. Milestone celebrations at 7, 14, 30, and 100 days.',
  'Learning & School',
  '{
    "title": "[Name]''s Math Streak",
    "auto_track_source": "linked_task",
    "grace_period": 0,
    "show_longest_streak": true,
    "celebration_at_milestones": [7, 14, 30, 100],
    "assigned_to": null
  }'::jsonb,
  false,
  130
) ON CONFLICT (config_name) DO NOTHING;

-- ── 10. Curriculum Progress ─────────────────────────────────────

INSERT INTO public.widget_starter_configs (
  id, tracker_type, visual_variant, config_name, description,
  category, default_config, is_example, sort_order
) VALUES (
  md5('widget_starter::Curriculum Progress')::uuid,
  'sequential_path',
  'staircase',
  'Curriculum Progress',
  'An ordered set of curriculum units or chapters that unlock one at a time. Each step represents a lesson, chapter, or unit. When one is complete, the next step lights up. Reusable across school years by re-deploying the same template. Perfect for sequential courses and textbook-based learning.',
  'Learning & School',
  '{
    "title": "[Course Name] Progress",
    "steps": [],
    "completion_condition": "linked_task",
    "show_percentage": true,
    "reset_on_redeploy": true,
    "assigned_to": null
  }'::jsonb,
  false,
  140
) ON CONFLICT (config_name) DO NOTHING;

-- ── 11. Typing Speed Progress ────────────────────────────────────

INSERT INTO public.widget_starter_configs (
  id, tracker_type, visual_variant, config_name, description,
  category, default_config, is_example, sort_order
) VALUES (
  md5('widget_starter::Typing Speed Progress')::uuid,
  'snapshot_comparison',
  'trend_line',
  'Typing Speed Progress',
  'Log a WPM score each time a typing test is taken. The trend line shows improvement over time. Perfect motivation for kids working through a typing curriculum. Mom or child logs the score manually after each practice session. Connects to homeschool time logs for documentation.',
  'Learning & School',
  '{
    "title": "[Name]''s Typing Progress",
    "measurement_unit": "wpm",
    "measurement_label": "words per minute",
    "show_trend_line": true,
    "show_personal_best": true,
    "target_wpm": null,
    "notes_enabled": true
  }'::jsonb,
  false,
  150
) ON CONFLICT (config_name) DO NOTHING;

-- ============================================================
-- CHORES & RESPONSIBILITY
-- ============================================================

-- ── 12. Weekly Chore Completion (already exists — skips cleanly) ─

INSERT INTO public.widget_starter_configs (
  id, tracker_type, visual_variant, config_name, description,
  category, default_config, is_example, sort_order
) VALUES (
  md5('widget_starter::Weekly Chore Completion')::uuid,
  'percentage',
  'donut_ring',
  'Weekly Chore Completion',
  'Shows what percentage of assigned chores were completed this week. Auto-calculates from linked routine tasks — mom doesn''t enter anything. Great for connecting to allowance: "You completed 80% of your chores, so you earned 80% of your allowance." Links directly to the Allowance Calculator.',
  'Chores & Responsibility',
  '{
    "title": "[Name]''s Chores This Week",
    "calculation_source": "linked_routines",
    "goal_percentage": 100,
    "reset_period": "weekly",
    "connect_to_allowance": true,
    "visual_style": "modern"
  }'::jsonb,
  false,
  210
) ON CONFLICT (config_name) DO NOTHING;

-- ── 13. Chore Points Board ───────────────────────────────────────

INSERT INTO public.widget_starter_configs (
  id, tracker_type, visual_variant, config_name, description,
  category, default_config, is_example, sort_order
) VALUES (
  md5('widget_starter::Chore Points Board')::uuid,
  'tally',
  'progress_bar',
  'Chore Points Board',
  'Assigns point values to completed chores and shows cumulative progress toward a prize or reward. Each chore completion from the Opportunity Board adds its points automatically. Set a goal total and a prize description. Great for kids who are motivated by earning toward something specific.',
  'Chores & Responsibility',
  '{
    "title": "[Name]''s Points",
    "measurement_unit": "points",
    "target_number": 100,
    "auto_track_source": "opportunity_board",
    "reset_period": "never",
    "prize_description": null,
    "show_current_and_goal": true
  }'::jsonb,
  false,
  220
) ON CONFLICT (config_name) DO NOTHING;

-- ── 14. Responsibility Gauge ─────────────────────────────────────

INSERT INTO public.widget_starter_configs (
  id, tracker_type, visual_variant, config_name, description,
  category, default_config, is_example, sort_order
) VALUES (
  md5('widget_starter::Responsibility Gauge')::uuid,
  'percentage',
  'responsibility_gauge',
  'Responsibility Gauge',
  'A visual gauge showing how responsible a child is being with their assigned tasks this week. Fills from 0 to 100% based on completion rate. Great for kids who respond to visual feedback. Mom can add a note to any weekly record. Resets every Sunday.',
  'Chores & Responsibility',
  '{
    "title": "[Name]''s Responsibility",
    "calculation_source": "linked_tasks",
    "reset_period": "weekly",
    "show_label": true,
    "notes_enabled": true,
    "assigned_to": null
  }'::jsonb,
  false,
  230
) ON CONFLICT (config_name) DO NOTHING;

-- ── 15. Extra Jobs Completion ────────────────────────────────────

INSERT INTO public.widget_starter_configs (
  id, tracker_type, visual_variant, config_name, description,
  category, default_config, is_example, sort_order
) VALUES (
  md5('widget_starter::Extra Jobs Completion')::uuid,
  'tally',
  'coin_jar',
  'Extra Jobs Completion',
  'A coin jar that fills as extra opportunity board jobs are completed. Each completed job drops a coin with a satisfying animation. Set a target (empty the jar!) and a prize. Perfect visual motivation for kids who do extra jobs to earn. Connects to the Opportunity Board automatically.',
  'Chores & Responsibility',
  '{
    "title": "[Name]''s Coin Jar",
    "measurement_unit": "jobs",
    "target_number": 20,
    "auto_track_source": "opportunity_board",
    "reset_period": "never",
    "prize_description": null,
    "celebration_type": "coin_burst"
  }'::jsonb,
  false,
  240
) ON CONFLICT (config_name) DO NOTHING;

-- ============================================================
-- MONEY & ALLOWANCE
-- ============================================================

-- ── 16. Weekly Allowance Calculator ─────────────────────────────

INSERT INTO public.widget_starter_configs (
  id, tracker_type, visual_variant, config_name, description,
  category, default_config, is_example, sort_order
) VALUES (
  md5('widget_starter::Weekly Allowance Calculator')::uuid,
  'allowance_calculator',
  'summary_card',
  'Weekly Allowance Calculator',
  'Calculates this week''s allowance based on chore completion percentage. Set a base amount and the widget multiplies it by the chore completion rate. "You completed 75% of your chores, so you earned $7.50 of your $10 allowance." Connects to the Weekly Chore Completion tracker and links to the Allowance feature.',
  'Money & Allowance',
  '{
    "title": "[Name]''s Allowance",
    "base_amount": 10.00,
    "calculation_method": "percentage_of_chores",
    "period": "weekly",
    "currency_symbol": "$",
    "connect_to_chore_tracker": true,
    "show_this_week_and_ytd": true
  }'::jsonb,
  false,
  310
) ON CONFLICT (config_name) DO NOTHING;

-- ── 17. Savings Goal ─────────────────────────────────────────────

INSERT INTO public.widget_starter_configs (
  id, tracker_type, visual_variant, config_name, description,
  category, default_config, is_example, sort_order
) VALUES (
  md5('widget_starter::Savings Goal')::uuid,
  'tally',
  'thermometer',
  'Savings Goal',
  'A thermometer filling toward a savings target. Each deposit makes it rise. Set the goal amount and a description of what you''re saving for. Mom or child logs each addition manually. Celebrate when it reaches the top! Great for teaching kids that big things are built one step at a time.',
  'Money & Allowance',
  '{
    "title": "Saving for [Goal]",
    "measurement_unit": "dollars",
    "currency_symbol": "$",
    "target_number": 100,
    "reset_period": "never",
    "goal_description": null,
    "celebration_type": "confetti",
    "show_remaining": true
  }'::jsonb,
  false,
  320
) ON CONFLICT (config_name) DO NOTHING;

-- ── 18. Chore Earnings Tracker ───────────────────────────────────

INSERT INTO public.widget_starter_configs (
  id, tracker_type, visual_variant, config_name, description,
  category, default_config, is_example, sort_order
) VALUES (
  md5('widget_starter::Chore Earnings Tracker')::uuid,
  'tally',
  'coin_jar',
  'Chore Earnings Tracker',
  'Tracks dollar earnings from completed opportunity board jobs. Each completed job adds its dollar value to the jar. Shows cumulative earnings for the current period. Connects to Opportunity Board job rewards automatically. Great visual for kids who are motivated by seeing money pile up.',
  'Money & Allowance',
  '{
    "title": "[Name]''s Earnings",
    "measurement_unit": "dollars",
    "currency_symbol": "$",
    "auto_track_source": "opportunity_board_rewards",
    "reset_period": "monthly",
    "show_running_total": true,
    "celebration_type": "coin_burst"
  }'::jsonb,
  false,
  330
) ON CONFLICT (config_name) DO NOTHING;

-- ============================================================
-- GOALS & MILESTONES
-- ============================================================

-- ── 19. Custom Goal Card ─────────────────────────────────────────

INSERT INTO public.widget_starter_configs (
  id, tracker_type, visual_variant, config_name, description,
  category, default_config, is_example, sort_order
) VALUES (
  md5('widget_starter::Custom Goal Card')::uuid,
  'tally',
  'progress_bar',
  'Custom Goal Card',
  'A flexible progress bar for any goal you can count. Set a title, a target number, and a unit. Log each increment manually or connect it to a task. Works for anything: miles run, pages written, days of practice, volunteer hours. The most versatile tracker in the collection.',
  'Goals & Milestones',
  '{
    "title": "[Goal Name]",
    "measurement_unit": "times",
    "target_number": 30,
    "reset_period": "never",
    "auto_track_source": null,
    "notes_enabled": true,
    "celebration_type": "confetti",
    "assigned_to": null
  }'::jsonb,
  false,
  410
) ON CONFLICT (config_name) DO NOTHING;

-- ── 20. Skill Mastery Path ───────────────────────────────────────

INSERT INTO public.widget_starter_configs (
  id, tracker_type, visual_variant, config_name, description,
  category, default_config, is_example, sort_order
) VALUES (
  md5('widget_starter::Skill Mastery Path')::uuid,
  'sequential_path',
  'mastery_path',
  'Skill Mastery Path',
  'An ordered sequence of skill levels that unlock one at a time. Define the skill and its levels (Beginner, Developing, Practicing, Proficient, Mastered). Mom marks each level complete when the child demonstrates it. Great for any skill built over time — music, art, sport, or life skill.',
  'Goals & Milestones',
  '{
    "title": "[Skill Name] Mastery",
    "default_levels": ["Beginner", "Developing", "Practicing", "Proficient", "Mastered"],
    "completion_condition": "manual",
    "show_current_level_label": true,
    "celebration_at_mastery": true,
    "assigned_to": null
  }'::jsonb,
  false,
  420
) ON CONFLICT (config_name) DO NOTHING;

-- ── 21. Badge Collection ─────────────────────────────────────────

INSERT INTO public.widget_starter_configs (
  id, tracker_type, visual_variant, config_name, description,
  category, default_config, is_example, sort_order
) VALUES (
  md5('widget_starter::Badge Collection')::uuid,
  'achievement_badge',
  'badge_wall',
  'Badge Collection',
  'A wall of achievement badges that mom awards for special milestones. Not automatic — mom decides when a badge is earned. Each badge has a name, icon, and award date. Great for custom milestones that don''t fit standard tracking (first solo recipe, finished a whole book series, mastered cursive).',
  'Goals & Milestones',
  '{
    "title": "[Name]''s Badges",
    "award_method": "manual",
    "badge_style": "shield",
    "show_award_date": true,
    "show_empty_slots": true,
    "assigned_to": null
  }'::jsonb,
  false,
  430
) ON CONFLICT (config_name) DO NOTHING;

-- ── 22. XP & Level Up ────────────────────────────────────────────

INSERT INTO public.widget_starter_configs (
  id, tracker_type, visual_variant, config_name, description,
  category, default_config, is_example, sort_order
) VALUES (
  md5('widget_starter::XP & Level Up')::uuid,
  'xp_level',
  'shield_bar',
  'XP & Level Up',
  'A role-playing style XP bar that fills toward the next level. Each task or habit completion awards XP points. Define the level thresholds and what each level is called. Level-up triggers a celebration animation. Perfect for gamification-loving families who want to add a game layer on top of daily tasks.',
  'Goals & Milestones',
  '{
    "title": "[Name]''s Level",
    "level_thresholds": [100, 250, 500, 1000],
    "level_names": ["Apprentice", "Journeyman", "Expert", "Master"],
    "xp_per_task": 10,
    "auto_track_source": "task_completions",
    "celebration_on_level_up": true,
    "show_current_xp_and_next": true
  }'::jsonb,
  false,
  440
) ON CONFLICT (config_name) DO NOTHING;

-- ============================================================
-- HEALTH & WELLNESS
-- ============================================================

-- ── 23. Water Intake ─────────────────────────────────────────────

INSERT INTO public.widget_starter_configs (
  id, tracker_type, visual_variant, config_name, description,
  category, default_config, is_example, sort_order
) VALUES (
  md5('widget_starter::Water Intake')::uuid,
  'tally',
  'thermometer',
  'Water Intake',
  'A simple tap-to-log water tracker. Each tap adds one glass. The thermometer fills toward the daily goal. Resets at midnight. Quick enough for kids to use independently — one tap per glass. Works for any age from Guided shell up.',
  'Health & Wellness',
  '{
    "title": "[Name]''s Water Today",
    "measurement_unit": "glasses",
    "target_number": 8,
    "reset_period": "daily",
    "one_tap_logging": true,
    "celebration_type": "sparkle",
    "show_remaining": true
  }'::jsonb,
  false,
  510
) ON CONFLICT (config_name) DO NOTHING;

-- ── 24. Exercise Streak ──────────────────────────────────────────

INSERT INTO public.widget_starter_configs (
  id, tracker_type, visual_variant, config_name, description,
  category, default_config, is_example, sort_order
) VALUES (
  md5('widget_starter::Exercise Streak')::uuid,
  'streak',
  'mountain_climb',
  'Exercise Streak',
  'Tracks consecutive days of exercise. The mountain-climb visual shows progress toward the peak — the longer the streak, the higher on the mountain. Milestone celebrations at 7, 30, and 100 days. Connects to a linked exercise task automatically, or log manually. Works for mom or any family member building a movement habit.',
  'Health & Wellness',
  '{
    "title": "[Name]''s Exercise Streak",
    "auto_track_source": "linked_task",
    "grace_period": 0,
    "show_longest_streak": true,
    "celebration_at_milestones": [7, 30, 100],
    "assigned_to": null
  }'::jsonb,
  false,
  520
) ON CONFLICT (config_name) DO NOTHING;

-- ── 25. Sleep Check-In ───────────────────────────────────────────

INSERT INTO public.widget_starter_configs (
  id, tracker_type, visual_variant, config_name, description,
  category, default_config, is_example, sort_order
) VALUES (
  md5('widget_starter::Sleep Check-In')::uuid,
  'boolean_checkin',
  'calendar_dots',
  'Sleep Check-In',
  'A yes/no daily check-in for whether you went to bed on time. Each day shows as a colored dot on the calendar — green for yes, grey for no. At a glance, you can see patterns across the month. Great for kids and teens building healthy sleep habits. Also useful for mom tracking her own rest.',
  'Health & Wellness',
  '{
    "title": "Bedtime on Time",
    "prompt_text": "Did you go to bed on time?",
    "show_monthly_calendar": true,
    "color_yes": "green",
    "color_no": "grey",
    "reset_period": "daily",
    "notes_enabled": false,
    "assigned_to": null
  }'::jsonb,
  false,
  530
) ON CONFLICT (config_name) DO NOTHING;

-- ── 26. Mood Tracker ─────────────────────────────────────────────

INSERT INTO public.widget_starter_configs (
  id, tracker_type, visual_variant, config_name, description,
  category, default_config, is_example, sort_order
) VALUES (
  md5('widget_starter::Mood Tracker')::uuid,
  'mood_rating',
  'color_gradient',
  'Mood Tracker',
  'A daily mood rating displayed as a color gradient. Higher moods are warmer colors, lower moods are cooler. Over time, a color-field pattern emerges that reveals seasonal rhythms and energy patterns. More subtle and personal than emoji faces. Great for mom''s own self-awareness or for teens. Not shared by default.',
  'Health & Wellness',
  '{
    "title": "Mood Patterns",
    "scale_type": "1-7",
    "scale_labels": ["Very Low", "Low", "Below Average", "Neutral", "Good", "Great", "Excellent"],
    "visual_style": "color_gradient",
    "sharing_enabled": false,
    "notes_enabled": true,
    "show_monthly_grid": true,
    "assigned_to": null
  }'::jsonb,
  false,
  540
) ON CONFLICT (config_name) DO NOTHING;

-- ============================================================
-- FAMILY & MULTIPLAYER
-- ============================================================

-- ── 27. Family Reading Race (already exists — skips cleanly) ─────

INSERT INTO public.widget_starter_configs (
  id, tracker_type, visual_variant, config_name, description,
  category, default_config, is_example, sort_order
) VALUES (
  md5('widget_starter::Family Reading Race')::uuid,
  'tally',
  'colored_bars_competitive',
  'Family Reading Race',
  'A multiplayer reading tracker where every family member has their own colored bar racing toward the same goal. Who finishes 20 books first? Each person logs their own books. Mom sees everyone''s progress at a glance on the Family Overview.',
  'Family & Multiplayer',
  '{
    "title": "Family Reading Race",
    "measurement_unit": "books",
    "target_number": 20,
    "multiplayer_mode": "competitive",
    "members": [],
    "reset_period": "yearly",
    "celebration_type": "confetti",
    "show_on_family_overview": true
  }'::jsonb,
  false,
  610
) ON CONFLICT (config_name) DO NOTHING;

-- ── 28. Family Leaderboard ───────────────────────────────────────

INSERT INTO public.widget_starter_configs (
  id, tracker_type, visual_variant, config_name, description,
  category, default_config, is_example, sort_order
) VALUES (
  md5('widget_starter::Family Leaderboard')::uuid,
  'leaderboard',
  'classic_leaderboard',
  'Family Leaderboard',
  'A ranked leaderboard showing points earned by each family member for any tracked category — chores, reading, exercise, or custom. Rankings update in real time. Optional: mom can choose whether positions are visible to all members or only to mom. Brings healthy competition to family life.',
  'Family & Multiplayer',
  '{
    "title": "Family Leaderboard",
    "scoring_source": "task_completions",
    "reset_period": "weekly",
    "members": [],
    "show_points": true,
    "rankings_visible_to_members": true,
    "show_on_family_overview": true
  }'::jsonb,
  false,
  620
) ON CONFLICT (config_name) DO NOTHING;

-- ── 29. Countdown to Event ───────────────────────────────────────

INSERT INTO public.widget_starter_configs (
  id, tracker_type, visual_variant, config_name, description,
  category, default_config, is_example, sort_order
) VALUES (
  md5('widget_starter::Countdown to Event')::uuid,
  'countdown',
  'big_number',
  'Countdown to Event',
  'A large, friendly countdown showing days (and optionally hours) until a named event. Set a title, a date, and an optional emoji icon. Great for building anticipation before birthdays, holidays, trips, or big family milestones. The big number shrinks every day — kids will check it every morning.',
  'Family & Multiplayer',
  '{
    "title": "[Event Name]",
    "target_date": null,
    "show_hours": false,
    "emoji_icon": null,
    "celebration_on_zero": true,
    "visible_to_all_members": true
  }'::jsonb,
  false,
  630
) ON CONFLICT (config_name) DO NOTHING;

-- ── 30. Family Chore Race ────────────────────────────────────────

INSERT INTO public.widget_starter_configs (
  id, tracker_type, visual_variant, config_name, description,
  category, default_config, is_example, sort_order
) VALUES (
  md5('widget_starter::Family Chore Race')::uuid,
  'percentage',
  'donut_ring',
  'Family Chore Race',
  'Each family member has their own completion donut racing toward 100%. Who finishes all their chores first this week? Each donut is the member''s assigned color. Great motivation for kids who respond to sibling competition. Resets every week.',
  'Family & Multiplayer',
  '{
    "title": "Chore Race",
    "calculation_source": "linked_routines",
    "multiplayer_mode": "competitive",
    "reset_period": "weekly",
    "members": [],
    "show_on_family_overview": true,
    "celebration_type": "confetti"
  }'::jsonb,
  false,
  640
) ON CONFLICT (config_name) DO NOTHING;

-- ============================================================
-- SPECIAL NEEDS & THERAPY
-- ============================================================

-- ── 31. IEP Goal Progress (already exists — skips cleanly) ───────

INSERT INTO public.widget_starter_configs (
  id, tracker_type, visual_variant, config_name, description,
  category, default_config, is_example, sort_order
) VALUES (
  md5('widget_starter::IEP / ISP Goal Progress')::uuid,
  'tally',
  'progress_bar_multi',
  'IEP / ISP Goal Progress',
  'One progress bar per goal. Track measurable IEP or ISP goals alongside daily life — not buried in a folder. Mom updates progress; therapists and aides can log during sessions. Pulls into monthly SDS/disability reports automatically. Create one instance per active goal.',
  'Special Needs & Therapy',
  '{
    "title": "[Goal Name]",
    "measurement_unit": "trials",
    "target_number": null,
    "show_percent": true,
    "notes_enabled": true,
    "auto_include_in_reports": true,
    "reset_period": "never"
  }'::jsonb,
  false,
  710
) ON CONFLICT (config_name) DO NOTHING;

-- ── 32. Independence Skills Path (already exists — skips cleanly) ─

INSERT INTO public.widget_starter_configs (
  id, tracker_type, visual_variant, config_name, description,
  category, default_config, is_example, sort_order
) VALUES (
  md5('widget_starter::Independence Skills Path')::uuid,
  'sequential_path',
  'staircase',
  'Independence Skills Path',
  'An ordered set of skills that unlock one at a time. Each step represents a milestone on the way to independence — getting dressed alone, making a simple meal, doing laundry. When one skill is mastered, the next step lights up. Perfect for special needs families and any child building independence over time.',
  'Special Needs & Therapy',
  '{
    "title": "[Name]''s Independence Path",
    "visual_variant": "staircase",
    "steps": [],
    "completion_condition": "manual",
    "prize_at_end": null,
    "multiplayer_compatible": false
  }'::jsonb,
  false,
  720
) ON CONFLICT (config_name) DO NOTHING;

-- ── 33. Sensory Regulation Check-In ─────────────────────────────

INSERT INTO public.widget_starter_configs (
  id, tracker_type, visual_variant, config_name, description,
  category, default_config, is_example, sort_order
) VALUES (
  md5('widget_starter::Sensory Regulation Check-In')::uuid,
  'mood_rating',
  'number_scale',
  'Sensory Regulation Check-In',
  'A numbered scale (1–5 or 1–10) for logging sensory regulation throughout the day. Not just mood — this is designed for children who track their sensory state, with labels calibrated for sensory language (Calm and Ready, Slightly Alert, Starting to Spin Up, Dysregulated, Full Meltdown). Logs pull into monthly reports. Private by default.',
  'Special Needs & Therapy',
  '{
    "title": "[Name]''s Regulation Check-In",
    "scale_type": "1-5",
    "scale_labels": ["Calm & Ready", "Slightly Alert", "Starting to Spin Up", "Dysregulated", "Full Meltdown"],
    "log_frequency": "as_needed",
    "notes_enabled": true,
    "auto_include_in_reports": true,
    "sharing_enabled": false,
    "assigned_to": null
  }'::jsonb,
  false,
  730
) ON CONFLICT (config_name) DO NOTHING;

-- ── 34. Therapy Practice Streak ─────────────────────────────────

INSERT INTO public.widget_starter_configs (
  id, tracker_type, visual_variant, config_name, description,
  category, default_config, is_example, sort_order
) VALUES (
  md5('widget_starter::Therapy Practice Streak')::uuid,
  'streak',
  'growing_tree',
  'Therapy Practice Streak',
  'A growing-tree streak tracker for daily therapy home practice. Each consecutive day of practice adds a new branch and leaf to the tree. The visual growth over time is motivating and gentle — there is no punishing graphic when a day is missed, just a new small tree starting again. Great for speech, OT, PT, or any at-home practice program.',
  'Special Needs & Therapy',
  '{
    "title": "[Name]''s Practice Streak",
    "auto_track_source": "linked_task",
    "grace_period": 1,
    "show_longest_streak": true,
    "celebration_at_milestones": [7, 14, 30],
    "gentle_reset": true,
    "assigned_to": null
  }'::jsonb,
  false,
  740
) ON CONFLICT (config_name) DO NOTHING;

-- ============================================================
-- ACHIEVEMENT & RECOGNITION
-- ============================================================

-- ── 35. Weekly Celebration ───────────────────────────────────────

INSERT INTO public.widget_starter_configs (
  id, tracker_type, visual_variant, config_name, description,
  category, default_config, is_example, sort_order
) VALUES (
  md5('widget_starter::Weekly Celebration')::uuid,
  'tally',
  'star_chart',
  'Weekly Celebration',
  'Counts wins and celebrations over the week. Each victory — big or small — adds a star to the chart. No tasks attached, no auto-tracking. Mom or the child taps the star manually when something worth celebrating happens. A pure celebration board with no failure state. Resets every Sunday ready for a fresh week.',
  'Achievement & Recognition',
  '{
    "title": "[Name]''s Wins This Week",
    "measurement_unit": "victories",
    "target_number": null,
    "reset_period": "weekly",
    "manual_logging_only": true,
    "notes_enabled": true,
    "celebration_type": "confetti",
    "assigned_to": null
  }'::jsonb,
  false,
  810
) ON CONFLICT (config_name) DO NOTHING;

-- ============================================================
-- VERIFY (run manually after applying):
-- SELECT category, count(*) FROM public.widget_starter_configs
--   GROUP BY category ORDER BY category;
-- ============================================================
