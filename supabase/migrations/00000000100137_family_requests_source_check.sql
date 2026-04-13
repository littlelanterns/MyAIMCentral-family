-- Migration: 00000000100137_family_requests_source_check.sql
-- PRD-28: Extend family_requests.source CHECK to include homeschool + financial sources
-- Rebuild-enum pattern: DROP old constraint, ADD new one with all values

ALTER TABLE public.family_requests DROP CONSTRAINT IF EXISTS family_requests_source_check;
ALTER TABLE public.family_requests ADD CONSTRAINT family_requests_source_check
  CHECK (source IN ('quick_request', 'notepad_route', 'mindsweep_auto', 'homeschool_child_report', 'financial_approval'));
