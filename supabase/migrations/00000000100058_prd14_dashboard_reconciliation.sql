-- PRD-14 Personal Dashboard Reconciliation
-- 1. Seed default section configs into dashboard_configs.layout for existing rows
-- 2. Add acted_by columns for View As attribution (PRD-02/14 item 8)

-- ─── 1. Seed default sections ────────────────────────────────

-- Update existing dashboard_configs rows that have no sections array
UPDATE public.dashboard_configs
SET layout = COALESCE(layout, '{}'::jsonb) || jsonb_build_object(
  'sections', '[
    {"key": "greeting", "order": 0, "visible": true, "collapsed": false},
    {"key": "calendar", "order": 1, "visible": true, "collapsed": false},
    {"key": "active_tasks", "order": 2, "visible": true, "collapsed": false},
    {"key": "widget_grid", "order": 3, "visible": true, "collapsed": false}
  ]'::jsonb
)
WHERE layout IS NULL
   OR layout = '{}'::jsonb
   OR NOT (layout ? 'sections');

-- ─── 2. Add acted_by columns for View As attribution ─────────

-- task_completions: who actually performed the action (mom acting in View As)
ALTER TABLE public.task_completions
  ADD COLUMN IF NOT EXISTS acted_by UUID REFERENCES public.family_members(id);

-- intention_iterations: who logged the tally in View As
ALTER TABLE public.intention_iterations
  ADD COLUMN IF NOT EXISTS acted_by UUID REFERENCES public.family_members(id);

-- calendar_events: who created/edited the event in View As
ALTER TABLE public.calendar_events
  ADD COLUMN IF NOT EXISTS acted_by UUID REFERENCES public.family_members(id);
