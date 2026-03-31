-- PRD-10 Enhancement: Widget starter configs for Hub-friendly widgets
-- Registers countdown, today_is, hub_menu, hub_job_board as starter configs

INSERT INTO widget_starter_configs (
  id, tracker_type, visual_variant, config_name, description, category, default_config, is_example, sort_order
) VALUES
  -- Countdown widget starter config
  (
    'a0000000-0000-0000-0000-000000000061',
    'countdown',
    'big_number',
    'Countdown',
    'Count down to a special date — birthdays, vacations, holidays, and more.',
    'goal_pursuit',
    '{"target_date": "", "emoji": "", "recurring_annually": false, "show_on_target_day": true, "title_at_zero": "Today is the day!"}',
    false,
    100
  )
ON CONFLICT (id) DO NOTHING;
