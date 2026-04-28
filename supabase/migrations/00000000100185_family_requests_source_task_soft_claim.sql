-- Migration: Extend family_requests.source CHECK to include task_soft_claim.
-- Used when a kid taps "Ask Mom" on a soft-claimed task's Done-blocked modal.

ALTER TABLE public.family_requests DROP CONSTRAINT IF EXISTS family_requests_source_check;
ALTER TABLE public.family_requests ADD CONSTRAINT family_requests_source_check
  CHECK (source IN ('quick_request', 'notepad_route', 'mindsweep_auto', 'homeschool_child_report', 'financial_approval', 'task_soft_claim'));
