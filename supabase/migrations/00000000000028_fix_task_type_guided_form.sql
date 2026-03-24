-- Add 'guided_form' to tasks.task_type CHECK constraint
ALTER TABLE public.tasks DROP CONSTRAINT IF EXISTS tasks_task_type_check;
ALTER TABLE public.tasks
  ADD CONSTRAINT tasks_task_type_check
  CHECK (task_type IN ('task','routine','opportunity_repeatable','opportunity_claimable','opportunity_capped','sequential','habit','guided_form'));

-- Also add 'guided_form_assignment' to tasks.source CHECK if it exists
ALTER TABLE public.tasks DROP CONSTRAINT IF EXISTS tasks_source_check;
ALTER TABLE public.tasks
  ADD CONSTRAINT tasks_source_check
  CHECK (source IN ('manual','template_deployed','lila_conversation','notepad_routed','review_route','meeting_action','goal_decomposition','project_planner','member_request','sequential_promoted','recurring_generated','guided_form_assignment'));
