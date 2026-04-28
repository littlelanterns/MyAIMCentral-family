-- Migration: Register Daily Progress Marking feature keys.
-- All Essential tier, all role groups. All return true during beta (placeholder).

INSERT INTO public.feature_key_registry (feature_key, display_name, description, prd_source)
VALUES
  ('task_progress_tracking', 'Task Progress Tracking', 'Enable track_progress on tasks for daily multi-day progress marking', 'PRD-09A Addendum'),
  ('task_duration_tracking', 'Task Duration Tracking', 'Enable track_duration on tasks for time-spent capture on completion or daily progress', 'PRD-09A Addendum'),
  ('task_session_history', 'Task Session History', 'Aggregation display and session history detail on track-progress tasks', 'PRD-09A Addendum'),
  ('task_soft_claim', 'Task Soft Claim', 'Soft-claim attribution and completion gating on track-progress tasks', 'PRD-09A Addendum')
ON CONFLICT DO NOTHING;

INSERT INTO public.feature_access_v2 (feature_key, role_group, minimum_tier_id, is_enabled)
SELECT fk.feature_key, fk.role_group, st.id, true
FROM (VALUES
  ('task_progress_tracking', 'mom'),
  ('task_progress_tracking', 'dad_adults'),
  ('task_progress_tracking', 'independent_teens'),
  ('task_progress_tracking', 'guided_kids'),
  ('task_progress_tracking', 'play_kids'),
  ('task_duration_tracking', 'mom'),
  ('task_duration_tracking', 'dad_adults'),
  ('task_duration_tracking', 'independent_teens'),
  ('task_duration_tracking', 'guided_kids'),
  ('task_duration_tracking', 'play_kids'),
  ('task_session_history', 'mom'),
  ('task_session_history', 'dad_adults'),
  ('task_session_history', 'independent_teens'),
  ('task_session_history', 'guided_kids'),
  ('task_session_history', 'play_kids'),
  ('task_soft_claim', 'mom'),
  ('task_soft_claim', 'dad_adults'),
  ('task_soft_claim', 'independent_teens'),
  ('task_soft_claim', 'guided_kids'),
  ('task_soft_claim', 'play_kids')
) AS fk(feature_key, role_group)
CROSS JOIN LATERAL (
  SELECT id FROM public.subscription_tiers WHERE slug = 'essential'
) AS st(id)
ON CONFLICT DO NOTHING;
