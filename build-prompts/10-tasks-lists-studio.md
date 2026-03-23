# Build Prompt 10: Tasks, Lists, Studio & Templates

## PRD References
- PRD-09A: `prds/personal-growth/PRD-09A-Tasks-Routines-Opportunities.md`
- PRD-09B: `prds/personal-growth/PRD-09B-Lists-Studio-Templates.md`

## Prerequisites
- Phase 05 (Universal Scheduler & Timer) complete
- Phase 09 (Journal & Smart Notepad) complete

## Objective
Build the complete task engine (14 views), routines, opportunities, Task Breaker AI, Studio template workshop, Lists page. This is a Very Large phase — consider splitting into 10A (data layer + core UI) and 10B (AI integration + advanced features).

## Database Work
Create tables:
- `task_templates`, `task_template_sections`, `task_template_steps`
- `tasks` — Core task record with type, status, priority, recurrence
- `task_assignments`, `task_completions`, `routine_step_completions`
- `sequential_collections`, `task_claims`, `task_rewards`
- `lists`, `list_items`, `list_shares`, `list_templates`
- `studio_queue` — PRD-17 authoritative definition (create now, PRD-17 will extend)

## Component Work
### Tasks
- Task Creation Modal (7 collapsible sections)
- 14 prioritization views (Simple List, Now/Next/Optional, By Category, etc.)
- Routine templates with sectioned checklists
- Opportunity tasks / job board
- Task Breaker AI (text and image modes)
- Focus Timer integration (links to UniversalTimer from Phase 05)
- Task approval workflows
- Rotating assignments
- Sequential collections
- Task queue / Studio Queue integration

### Lists
- Lists page with type-based sections
- Simple, checklist, reference, randomizer, backburner list types
- Sharing/visibility controls

### Studio
- Studio as template workshop
- Blank templates for tasks, lists, trackers, widgets
- Template customization and deployment

## Testing Checklist
- [ ] Task CRUD with all 4 types (task, routine, opportunity, habit)
- [ ] 14 view modes render correctly
- [ ] Routine sections and steps work
- [ ] Task Breaker AI generates sub-tasks
- [ ] Approval workflow: submit → approve/reject
- [ ] Focus Timer attaches to task
- [ ] Lists CRUD with sharing
- [ ] Studio deploys templates
- [ ] studio_queue receives items from Notepad routing

## Definition of Done
- Full task engine operational
- Lists page functional
- Studio template workshop working
- Integration with UniversalScheduler for recurrence
