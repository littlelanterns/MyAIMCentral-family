/**
 * Studio Seed Templates
 * Authoritative seed data from specs/studio-seed-templates.md
 *
 * System templates: is_system_template=true, family_id=NULL
 * Example templates: isExample=true, labeled with badge
 *
 * Template data is READ-ONLY source material — do not hand-edit card copy.
 * All descriptions, taglines, and example_use_cases come from the founder spec.
 *
 * PRD-09A/09B Studio Intelligence Phase 1 — capability_tags added to every
 * template. Tags describe what a template DOES, not what it IS. They are the
 * data foundation for Phase 2's intent-based Studio search. Tag vocabulary is
 * authoritative in
 * `prds/addenda/PRD-09A-09B-Studio-Intelligence-Universal-Creation-Hub-Addendum.md` §1D.
 */

import type { StudioTemplate } from './StudioTemplateCard'

// ─── Task & Chore Templates (blank formats) ───────────────────

export const TASK_TEMPLATES_BLANK: StudioTemplate[] = [
  {
    id: 'sys_task_simple',
    templateType: 'task',
    name: 'Simple Task',
    tagline: 'One-time or recurring task assigned to one or more family members.',
    description:
      'A one-time or recurring task assigned to one or more family members. Add a name, optionally set a due date, reward, and completion approval. The most flexible format.',
    exampleUseCases: [
      'Take out the trash',
      'Return library books',
      'Call the dentist',
      'Help dad with yard work',
    ],
    capability_tags: ['one_time', 'assignable', 'due_date', 'quick_action', 'to_do'],
    isExample: false,
  },
  {
    id: 'sys_task_routine',
    templateType: 'routine',
    name: 'Routine Checklist',
    tagline: 'Multi-step checklist with sections on different schedules. Build once, deploy to any child.',
    description:
      'Multi-step checklist with sections on different schedules — Daily, MWF, Weekly, or custom. Each section has its own frequency. Build once, deploy to any child. Resets fresh each period with no guilt carry-forward.',
    exampleUseCases: [
      'Morning routine',
      'Bedroom clean-up',
      'Kitchen duties',
      'After-school checklist',
      'Bathroom deep clean',
    ],
    capability_tags: [
      'daily_checklist', 'recurring', 'sections', 'different_days',
      'linked_content', 'morning_routine', 'school_routine', 'chore_routine',
    ],
    isExample: false,
  },
  {
    id: 'sys_task_opportunity',
    templateType: 'opportunity_claimable',
    name: 'Opportunity Board',
    tagline: 'Optional jobs kids can browse and earn from. Claimable, repeatable, or capped.',
    description:
      'Optional jobs kids can browse and earn from. Each job has its own reward (dollars, stars, or both). Three sub-types: Claimable (first to claim, locked with timer, auto-releases), Repeatable (do it over and over, optional caps), Capped (limited total completions). Mom selects which family members can see each board.',
    exampleUseCases: [
      'Extra House Jobs board',
      "Ruthie's practice tasks",
      'Bonus school tasks',
      'Summer earning opportunities',
    ],
    howItWorks:
      'Kids tap [Claim] to lock a job. A timer counts down their window. Complete + approved = reward. Lock expires? Job returns to the pool, no penalty.',
    capability_tags: ['bonus_work', 'earn_rewards', 'job_board', 'claim_lock', 'family_economy'],
    isExample: false,
  },
  {
    id: 'sys_task_sequential',
    templateType: 'sequential',
    name: 'Sequential Collection',
    tagline: 'Ordered tasks that feed one at a time. Task N+1 unlocks only when Task N is complete.',
    description:
      'Ordered list of tasks that feeds one at a time. Task N+1 unlocks only when Task N is complete. Reuse year after year by deploying to new student.',
    exampleUseCases: [
      'Math textbook chapters',
      'YouTube tutorial series',
      'Piano lesson progression',
      'Nature study unit',
    ],
    capability_tags: [
      'tracks_progress', 'ordered_steps', 'curriculum', 'mastery', 'practice_count',
      'one_at_a_time', 'drip_feed', 'learning_path', 'skill_building', 'homeschool',
    ],
    isExample: false,
  },
]

// ─── Task & Chore Templates (examples) ───────────────────────

export const TASK_TEMPLATES_EXAMPLES: StudioTemplate[] = [
  {
    id: 'ex_morning_routine',
    templateType: 'routine',
    name: 'Morning Routine',
    tagline: 'Every Morning (6 steps), School Days Only (3 steps), Every Sunday (2 steps).',
    description:
      'A ready-to-use morning routine with three sections: Every Morning (6 steps for daily basics), School Days Only (3 steps for school-specific prep), and Every Sunday (2 steps for weekly reset). Customize steps and schedules for your child.',
    exampleUseCases: [
      'Brush teeth & wash face',
      'Make bed',
      'Get dressed',
      'Breakfast',
      'Pack backpack',
    ],
    capability_tags: [
      'daily_checklist', 'recurring', 'sections', 'different_days',
      'morning_routine', 'school_routine',
    ],
    isExample: true,
  },
  {
    id: 'ex_bedroom_cleanup',
    templateType: 'routine',
    name: 'Bedroom Clean-Up',
    tagline: 'Daily (3 steps), Weekly/show until complete (4 steps), Monthly (4 steps).',
    description:
      'A tiered bedroom cleaning routine. Daily tasks keep the basics tidy, weekly deep-clean steps show until complete before rotating to the next day, and monthly tasks tackle the deeper organization.',
    exampleUseCases: [
      'Pick up floor',
      'Make bed',
      'Wipe down surfaces',
      'Vacuum',
      'Organize closet',
    ],
    capability_tags: [
      'daily_checklist', 'recurring', 'sections', 'different_days',
      'chore_routine',
    ],
    isExample: true,
  },
  {
    id: 'ex_extra_house_jobs',
    templateType: 'opportunity_claimable',
    name: 'Extra House Jobs Board',
    tagline: 'Claimable board with 8 chore jobs ($1–$3) and 2 connection items (5 stars each).',
    description:
      'A ready-to-use Claimable Opportunity Board with 8 real chore jobs ($1–$3 per job, 30-min to 3-hr locks) and 2 connection items (5 stars, repeatable, no lock). Mix of quick, medium, big, and connection categories. Shows kids what they can earn and lets them pick what fits their day.',
    exampleUseCases: [
      'Vacuum living room ($1, 30 min)',
      'Deep clean bathroom ($3, 2 hr)',
      'Help with dinner ($1.50)',
      'Write a letter to grandma (5 stars)',
    ],
    howItWorks:
      'Kids tap [Claim] to lock a job. A timer counts down. Complete + approved = reward. Lock expires? Job returns to the pool.',
    capability_tags: ['bonus_work', 'earn_rewards', 'job_board', 'claim_lock', 'family_economy'],
    isExample: true,
  },
  {
    id: 'ex_curriculum_sequence',
    templateType: 'sequential',
    name: 'Curriculum Chapter Sequence',
    tagline: 'Sequential collection with 5 sample chapters, auto-promote, weekdays only.',
    description:
      'A ready-to-use sequential collection with 5 sample chapters demonstrating auto-advance on completion and weekday-only scheduling. Perfect template starting point for any textbook or tutorial series.',
    exampleUseCases: [
      'Math curriculum chapters',
      'History unit lessons',
      'Language arts program',
      'Science textbook sections',
    ],
    capability_tags: [
      'tracks_progress', 'ordered_steps', 'curriculum', 'one_at_a_time',
      'drip_feed', 'learning_path', 'homeschool',
    ],
    isExample: true,
  },
  {
    // Build J (PRD-09A/09B Linked Steps addendum Enhancement D): Reading List
    // template. A sequential collection with mastery + duration tracking +
    // active_count=1 + manual promotion pre-configured. Not a new list type —
    // it's a Studio template that opens SequentialCreatorModal with presets.
    id: 'ex_reading_list',
    templateType: 'sequential',
    name: 'Reading List',
    tagline: 'One book at a time, with mastery approval and reading time tracking.',
    description:
      'A sequential reading list pre-configured for mastery advancement. Each book stays active until the child submits it as finished and mom approves. Practice each day logs reading time (15/30/45/60 minutes). Use it for chapter books, textbooks, classics, or any structured reading program. Deploy to multiple children — each gets independent progress.',
    exampleUseCases: [
      'Chapter books in order',
      'Classics list',
      'Literature curriculum',
      "Biographies for the year",
      'Homeschool reading program',
    ],
    howItWorks:
      'Mom adds book titles. Child opens the current book from their routine, taps "Mark as Read" each day and logs time. When finished, they tap "Submit as Mastered" — mom approves, and the next book activates.',
    capability_tags: [
      'reading', 'books', 'mastery', 'duration_tracking', 'homeschool',
      'curriculum', 'one_at_a_time', 'learning_path', 'tracks_progress',
    ],
    isExample: true,
  },
  {
    id: 'ex_tsg_randomizer',
    templateType: 'randomizer',
    name: 'TSG Extra Jobs Randomizer',
    tagline: '9 chore items (one-time) + 4 connection items (repeatable).',
    description:
      'A Randomizer list with 9 chore items (one-time, quick to medium) and 4 connection items (repeatable). Mix real work with relationship-building moments. Perfect for fair job distribution — spin to see who does what.',
    exampleUseCases: [
      'Fold and put away laundry',
      'Empty dishwasher',
      'Read together',
      'Play a board game',
    ],
    capability_tags: [
      'variety', 'surprise', 'draw_pool', 'no_decision_fatigue',
      'chore_wheel', 'fun',
    ],
    isExample: true,
  },
]

// ─── Guided Forms & Worksheets (blank formats) ────────────────

export const GUIDED_FORM_TEMPLATES_BLANK: StudioTemplate[] = [
  {
    id: 'sys_guided_form_blank',
    templateType: 'guided_form',
    name: 'Guided Form',
    tagline: 'Structured thinking worksheet mom assigns to a child. Define sections, assign, review.',
    description:
      'Structured thinking worksheet mom assigns to a child. Mom defines sections, fills setup prompt, assigns. Child completes on dashboard. Mom reviews. LiLa assistance configurable (default OFF). Printable as paper worksheet.',
    exampleUseCases: [
      'Custom decision-making exercise',
      'Goal reflection',
      'Pre-trip planning form',
      'Reading response questions',
    ],
    capability_tags: [
      'structured_thinking', 'worksheet', 'reflection', 'assignable',
      'printable', 'teaching_tool',
    ],
    isExample: false,
  },
  {
    id: 'sys_guided_form_sodas',
    templateType: 'guided_form_sodas',
    name: 'SODAS',
    tagline: 'Structured thinking exercise: Situation → Options → Disadvantages → Advantages → Solution.',
    description:
      'A structured thinking exercise that teaches real decision-making. Mom fills in the Situation. Child works through Options (3+) → Disadvantages (each option) → Advantages (each option, including bad choices) → Solution (best and why). More honest than a pros/cons list because it requires acknowledging advantages in every option.',
    exampleUseCases: [
      'Sibling conflict',
      'What to do when angry',
      'Spending birthday money',
      'Friend situation',
    ],
    capability_tags: [
      'decision_making', 'structured_thinking', 'teaching_tool', 'reflection',
      'kids', 'conflict_resolution',
    ],
    sectionStructure: ['Situation', 'Options', 'Disadvantages', 'Advantages', 'Solution'],
    isExample: false,
  },
  {
    id: 'sys_guided_form_what_if',
    templateType: 'guided_form_what_if',
    name: 'What-If Game',
    tagline: 'Lighter, faster version of SODAS for pre-teaching before situations arise.',
    description:
      'Lighter, faster version of SODAS for pre-teaching before situations arise. Mom poses a scenario, child thinks it through before they\'re in the heat of the moment. Practice handling hard situations before they happen. Works for kids as young as Guided shell age.',
    exampleUseCases: [
      'Friend asking to do something wrong',
      'Someone mean at co-op',
      'Finished work early',
      'Feeling angry at sibling',
    ],
    capability_tags: [
      'pre_teaching', 'scenarios', 'role_play', 'teaching_tool', 'kids',
      'structured_thinking',
    ],
    sectionStructure: ['The Scenario', 'My Options', 'What Might Happen', 'What I Would Do', 'What I Learned'],
    isExample: false,
  },
  {
    id: 'sys_guided_form_apology',
    templateType: 'guided_form_apology_reflection',
    name: 'Apology Reflection',
    tagline: 'Deeper than "say sorry." Restorative, not punitive. Mom reviews as springboard for conversation.',
    description:
      'Deeper than "say sorry." Child thinks through what happened, who was affected, why it mattered, what they\'d do differently, how to make it right. Restorative tone, not punitive. Mom reviews and uses as springboard for conversation.',
    exampleUseCases: [
      'After a sibling fight',
      'When a rule was broken',
      'After a hurtful comment',
      'Any conflict needing repair',
    ],
    capability_tags: [
      'restorative', 'reflection', 'conflict_resolution', 'kids',
      'teaching_tool', 'structured_thinking',
    ],
    sectionStructure: [
      'What Happened',
      'Who Was Affected and How',
      'Why It Mattered',
      "What I Wish I'd Done",
      'How I Want to Make It Right',
      'What I Want to Remember',
    ],
    isExample: false,
  },
]

// ─── Guided Form Examples ─────────────────────────────────────

export const GUIDED_FORM_TEMPLATES_EXAMPLES: StudioTemplate[] = [
  {
    id: 'ex_sodas_sibling',
    templateType: 'guided_form_sodas',
    name: 'SODAS Sibling Conflict',
    tagline: 'Pre-filled Situation section with warm framing. Child sections blank.',
    description:
      'A ready-to-assign SODAS worksheet with the Situation section pre-filled ("Yesterday you and your sibling had a disagreement. Let\'s think it through together…"). Child sections are blank for their independent thinking.',
    exampleUseCases: [
      'Sibling argument',
      'Conflict over shared space',
      'Taking each other\'s things',
    ],
    capability_tags: [
      'decision_making', 'conflict_resolution', 'kids', 'reflection',
      'teaching_tool',
    ],
    sectionStructure: ['Situation', 'Options', 'Disadvantages', 'Advantages', 'Solution'],
    isExample: true,
  },
  {
    id: 'ex_what_if_friend_pressure',
    templateType: 'guided_form_what_if',
    name: 'What-If: Friend Pressure',
    tagline: 'Pre-filled scenario about peer pressure. Child sections blank.',
    description:
      'A ready-to-assign What-If Game with a scenario about peer pressure pre-filled ("Imagine a friend dares you to do something you know isn\'t right…"). Child sections are blank for their thinking.',
    exampleUseCases: [
      'Peer pressure discussion',
      'Saying no to friends',
      'Making wise choices',
    ],
    capability_tags: [
      'pre_teaching', 'scenarios', 'role_play', 'kids', 'teaching_tool',
    ],
    sectionStructure: ['The Scenario', 'My Options', 'What Might Happen', 'What I Would Do', 'What I Learned'],
    isExample: true,
  },
  {
    id: 'ex_apology_general',
    templateType: 'guided_form_apology_reflection',
    name: 'Apology Reflection',
    tagline: 'Pre-filled warm intro note. Restorative framing. Child sections blank.',
    description:
      'A ready-to-assign Apology Reflection with a warm intro note from mom pre-filled: "I\'m not asking you to do this as punishment…" Restorative framing that invites reflection rather than shame. Child sections are blank.',
    exampleUseCases: [
      'After any conflict',
      'When trust was broken',
      'After hurtful words',
    ],
    capability_tags: [
      'restorative', 'reflection', 'conflict_resolution', 'kids',
      'teaching_tool',
    ],
    sectionStructure: [
      'What Happened',
      'Who Was Affected and How',
      'Why It Mattered',
      "What I Wish I'd Done",
      'How I Want to Make It Right',
      'What I Want to Remember',
    ],
    isExample: true,
  },
]

// ─── List Templates (blank formats) ──────────────────────────

export const LIST_TEMPLATES_BLANK: StudioTemplate[] = [
  {
    id: 'sys_list_shopping',
    templateType: 'list_shopping',
    name: 'Shopping List',
    tagline: 'Quantity, unit, store section, notes per item. Share with spouse or older kids.',
    description:
      'Quantity, unit, store section, and notes per item. Share with spouse or older kids. AI Bulk Add parses recipes and brain dumps into structured list items automatically.',
    exampleUseCases: [
      'Weekly groceries',
      'Costco run',
      'Hardware store list',
      'Pharmacy pickup',
    ],
    capability_tags: [
      'ongoing', 'store_sections', 'purchase_tracking', 'family_shared', 'bulk_add',
    ],
    isExample: false,
  },
  {
    id: 'sys_list_wishlist',
    templateType: 'list_wishlist',
    name: 'Wishlist',
    tagline: 'URL, estimated price, size/color notes, who it\'s for. Calculates total.',
    description:
      'URL, estimated price, size/color notes, who it\'s for. Individual per child for gift-givers. Calculates total estimated spend. Perfect for birthdays and holidays.',
    exampleUseCases: [
      "Jake's birthday list",
      'Holiday gifts',
      'Back-to-school supplies',
      'Mom\'s reading list with links',
    ],
    capability_tags: ['gift_ideas', 'urls', 'prices', 'occasions', 'shared'],
    isExample: false,
  },
  {
    id: 'sys_list_packing',
    templateType: 'list_packing',
    name: 'Packing List',
    tagline: 'Categorized sections (Clothing, Toiletries, Gear). Progress bar. Share with family.',
    description:
      'Categorized sections (Clothing, Toiletries, Gear, Documents) with checkboxes and progress bar. Share with the whole family. Save as template per trip type for reuse.',
    exampleUseCases: [
      'Road trip',
      'Beach vacation',
      'Camping weekend',
      'Overnight at grandma\'s',
    ],
    capability_tags: [
      'trip_planning', 'sections', 'progress_bar', 'reusable', 'family_shared',
    ],
    isExample: false,
  },
  {
    id: 'sys_list_expenses',
    templateType: 'list_expenses',
    name: 'Expense Tracker',
    tagline: 'Amount, category, date, notes. Running total. Quick shareable tally.',
    description:
      'Amount, category, date, and notes per entry. Running total calculated automatically. Not full accounting — a quick, shareable tally for trips, events, or seasonal spending.',
    exampleUseCases: [
      'Vacation spending',
      'Homeschool curriculum budget',
      'Birthday party costs',
      'School activity fees',
    ],
    capability_tags: [
      'spending_tracking', 'categories', 'running_total', 'budget',
    ],
    isExample: false,
  },
  {
    id: 'sys_list_todo',
    templateType: 'list_todo',
    name: 'To-Do List',
    tagline: 'Simple checkable list. One-tap [→ Tasks] promote button per item.',
    description:
      'Simple checkable list. One-tap [→ Tasks] promote button per item sends it to the Task Creation Queue. Great for brain dumps before things become real tasks.',
    exampleUseCases: [
      'Brain dump list',
      'Weekly errands',
      'Phone calls to make',
      'Quick project checklist',
    ],
    capability_tags: [
      'quick_capture', 'promote_to_task', 'lightweight', 'scratchpad',
    ],
    isExample: false,
  },
  {
    id: 'sys_list_custom',
    templateType: 'list_custom',
    name: 'Custom List',
    tagline: 'Blank canvas. Any items, optional notes, optional URLs.',
    description:
      'Blank canvas for any purpose. Any items, optional notes, optional URLs. You define what each item means. Maximum flexibility for anything that doesn\'t fit another type.',
    exampleUseCases: [
      'Book recommendations',
      'Gift ideas (any person)',
      'Ideas list',
      'Resource collection',
    ],
    capability_tags: ['flexible', 'any_fields', 'sections', 'general_purpose'],
    isExample: false,
  },
]

// ─── List Template Examples ───────────────────────────────────

export const LIST_TEMPLATES_EXAMPLES: StudioTemplate[] = [
  {
    id: 'ex_weekly_grocery',
    templateType: 'list_shopping',
    name: 'Weekly Grocery List',
    tagline: 'Shopping list with 7 sections (Produce, Dairy, Meat, Pantry…). Pre-filled items.',
    description:
      'A ready-to-use shopping list with 7 category sections: Produce, Dairy, Meat, Pantry, Frozen, Household, and Other. Pre-filled with common items to get you started. Customize sections and items for your family\'s habits.',
    exampleUseCases: ['Weekly grocery run', 'Costco trip', 'Farmer\'s market'],
    capability_tags: [
      'ongoing', 'store_sections', 'purchase_tracking', 'family_shared',
    ],
    isExample: true,
  },
  {
    id: 'ex_road_trip_packing',
    templateType: 'list_packing',
    name: 'Family Road Trip Packing',
    tagline: 'Packing list with 5 categories. Pre-filled items per category.',
    description:
      'A ready-to-use road trip packing list with 5 categories: Clothing, Toiletries, Electronics, Snacks & Drinks, and Entertainment. Pre-filled with common items. Share with the whole family before departure.',
    exampleUseCases: ['Road trip', 'Vacation prep', 'Long weekend'],
    capability_tags: [
      'trip_planning', 'sections', 'progress_bar', 'reusable', 'family_shared',
    ],
    isExample: true,
  },
  {
    id: 'ex_birthday_wishlist',
    templateType: 'list_wishlist',
    name: 'Birthday Wishlist (Child)',
    tagline: 'Wishlist with 5 sample items showing links, prices, notes, sizes.',
    description:
      'A ready-to-use birthday wishlist with 5 sample items demonstrating URLs, estimated prices, size/color notes, and gift priority. Shows your child how to fill in a wishlist that actually helps gift-givers.',
    exampleUseCases: ['Birthday', 'Holiday wishlist', 'Gift ideas for grandparents'],
    capability_tags: ['gift_ideas', 'urls', 'prices', 'occasions'],
    isExample: true,
  },
  {
    id: 'ex_homeschool_budget',
    templateType: 'list_expenses',
    name: 'Homeschool Curriculum Budget',
    tagline: 'Expense tracker with 5 sample purchases, running total.',
    description:
      'A ready-to-use expense tracker with 5 sample curriculum purchases showing amount, category, vendor, and notes. Running total helps stay on budget for the school year.',
    exampleUseCases: ['Curriculum purchases', 'School year budget', 'ESA tracking'],
    capability_tags: [
      'spending_tracking', 'categories', 'running_total', 'budget', 'homeschool',
    ],
    isExample: true,
  },
]

// ─── Seeded List Wizards (pre-configured entry points) ───────

export const LIST_WIZARD_SEEDED: StudioTemplate[] = [
  {
    id: 'seed_shared_shopping',
    templateType: 'list_wizard',
    name: 'Shared Family Shopping List',
    tagline: 'A permanent grocery list the whole family adds to — always there, never done.',
    description:
      'A permanent grocery list the whole family adds to. Always-on — checked items fade, new items flow in. Use Shopping Mode at the store to see everything in one view. Pre-filled with common grocery items across 8 store sections. Share with your spouse or older kids so anyone can add what they notice is running low.',
    exampleUseCases: [
      'Weekly family groceries shared with your spouse',
      'Store-organized list with sections for each aisle',
      'Items from Notepad, MindSweep, and LiLa all land here automatically',
    ],
    capability_tags: [
      'ongoing', 'store_sections', 'purchase_tracking', 'family_shared',
      'bulk_add', 'shopping_mode', 'always_on', 'setup_wizard',
    ],
    isExample: true,
  },
]

// ─── Randomizer ───────────────────────────────────────────────

export const RANDOMIZER_TEMPLATE_BLANK: StudioTemplate = {
  id: 'sys_randomizer',
  templateType: 'randomizer',
  name: 'Randomizer / Draw List',
  tagline: 'Curated grab bag. Tap [Draw] for spinner animation that reveals the selection.',
  description:
    'Curated grab bag. Tap [Draw] for spinner animation that reveals selection. Items can be repeatable (return to pool) or one-time (removed after draw). Works for extra jobs, name drawing, activity picking, reward spins.',
  exampleUseCases: [
    'TSG Extra Jobs',
    'Who picks the movie tonight',
    'Dinner activity picker',
    'Reward spinner',
  ],
  capability_tags: [
    'variety', 'surprise', 'draw_pool', 'mastery', 'practice',
    'no_decision_fatigue', 'enrichment', 'chore_wheel', 'fun',
  ],
  isExample: false,
}

// ─── Gamification & Rewards (real features, not stubs) ──────

export const GAMIFICATION_TEMPLATES: StudioTemplate[] = [
  {
    id: 'studio_gamification_setup',
    templateType: 'gamification_setup',
    name: 'Gamification Setup',
    tagline: 'Enable points, streaks, and sticker book creature collecting for a child.',
    description:
      'Turn on the gamification system for a child. Choose how they earn creatures (every task, every N tasks, segment complete, or perfect day). Configure the sticker book, set points per task, and pick earning modes. The foundation for all reward and motivation features.',
    exampleUseCases: [
      'Set up sticker book for youngest',
      'Enable point tracking for chores',
      'Configure creature earning',
      'Set up streaks and rewards',
    ],
    capability_tags: [
      'gamification', 'sticker_book', 'creatures', 'points',
      'streaks', 'earning_modes', 'motivation', 'setup_wizard',
    ],
    isExample: false,
  },
  {
    id: 'studio_day_segments',
    templateType: 'gamification_segments',
    name: 'Day Segments',
    tagline: 'Organize tasks into Morning, School, Jobs, Evening sections on the dashboard.',
    description:
      'Break the day into named segments (Morning, School Time, Afternoon Jobs, Evening). Each segment groups tasks on the child\'s dashboard with progress bars. Optionally trigger creature earning when a whole segment is completed. Day-of-week filters let you have different segments on weekdays vs weekends.',
    exampleUseCases: [
      'Morning / Afternoon / Evening split',
      'School days vs weekend chores',
      'Sunday special tasks',
      'Segment-based creature rewards',
    ],
    capability_tags: [
      'gamification', 'day_organization', 'segments', 'progress_bars',
      'dashboard_layout', 'setup_wizard',
    ],
    isExample: false,
  },
  {
    id: 'studio_coloring_reveal',
    templateType: 'gamification_coloring',
    name: 'Coloring Page Reveal',
    tagline: 'Link a task to a coloring page. Each completion reveals more color.',
    description:
      'Pick from 32 beautiful Woodland Felt coloring pages (20 animals + 12 scenes). Link it to any repeating task — each time the child completes that task, one zone of the image transitions from grayscale to full color. Choose 5, 10, 15, 20, 30, or 50 steps to full reveal. Print the finished image as a reward.',
    exampleUseCases: [
      'Potty chart with picture reveal',
      'Piano practice progress',
      'Reading milestones',
      'Chore completion art',
    ],
    capability_tags: [
      'gamification', 'coloring', 'visual_progress', 'art',
      'task_linked', 'printable', 'motivation', 'setup_wizard',
    ],
    isExample: false,
  },
  {
    id: 'studio_reward_reveal',
    templateType: 'reward_reveal',
    name: 'Reward Reveal',
    tagline: 'Celebrate completions with card flips, door reveals, spinners, or scratch-offs.',
    description:
      'Create a celebration that plays when a child completes a task, reaches a widget milestone, or finishes a list. Choose from 4 reveal animations (card flip, three doors, spinner wheel, scratch-off), set the prize (text message, surprise image, random draw from a list, or celebration-only), and attach it to anything completable.',
    exampleUseCases: [
      'Treasure box every 5th chore',
      'Mystery door after routine completion',
      'Spin the reward wheel on Fridays',
      'Scratch-off prize for homework streak',
    ],
    capability_tags: [
      'rewards', 'celebration', 'reveal_animation', 'surprise',
      'card_flip', 'doors', 'spinner', 'scratch_off', 'setup_wizard',
    ],
    isExample: false,
  },
  {
    id: 'studio_star_chart',
    templateType: 'widget_tally',
    name: 'Star / Sticker Chart',
    tagline: 'Classic star chart. Earn a star for each completion. Celebrate milestones.',
    description:
      'The classic star chart, digitized. Add a star (or any icon) each time a child does the target behavior. Set milestone thresholds that trigger celebrations. Attach a Reward Reveal for every Nth star to keep things exciting. Works for potty training, homework, chores, or any repeating behavior.',
    exampleUseCases: [
      'Potty training chart',
      'Homework completion stars',
      'Good behavior stickers',
      'Chore tracking with rewards',
    ],
    capability_tags: [
      'tracking', 'stars', 'stickers', 'milestones',
      'potty_training', 'rewards', 'visual_progress', 'setup_wizard',
    ],
    isExample: false,
  },
  {
    id: 'studio_reward_spinner',
    templateType: 'widget_randomizer_spinner',
    name: 'Reward Spinner',
    tagline: 'Spin the wheel to pick a random reward, activity, or consequence.',
    description:
      'A colorful spinner wheel linked to a randomizer list. Tap to spin — the wheel decelerates and lands on a random item. Use it as a reward wheel (spin after completing chores), activity picker (what should we do this afternoon?), or consequence spinner (what\'s the logical consequence?). Create the list of options first, then connect it.',
    exampleUseCases: [
      'Weekend reward wheel',
      'Activity picker for free time',
      'Consequence spinner',
      'Family game night picker',
    ],
    capability_tags: [
      'randomizer', 'spinner', 'rewards', 'fun', 'surprise',
      'decision_making', 'setup_wizard',
    ],
    isExample: false,
  },
]

// ─── Growth & Self-Knowledge Templates ──────────────────────

export const WIZARD_TEMPLATES: StudioTemplate[] = [
  {
    id: 'studio_meeting_setup',
    templateType: 'meeting_setup_wizard',
    name: 'Family Meeting Setup',
    tagline: 'Schedule family council, 1:1 time with each kid, and couple check-ins in minutes.',
    description:
      'A guided walkthrough that sets up your entire family meeting calendar. We\'ll suggest smart scheduling based on your kids\' birthdays, let you pick who has 1:1 time (just you, alternate with your partner, or both), and create everything on your calendar in one tap. Family council, parent-child dates, couple check-ins — all in a few minutes.',
    exampleUseCases: [
      'Monthly 1:1 dates with each child',
      'Weekly family council on Sundays',
      'Couple check-in every Saturday',
      'Alternate parent dates (mom one month, dad the next)',
    ],
    capability_tags: [
      'meetings', 'scheduling', 'family', 'connection', 'recurring',
      'calendar', 'onboarding', 'setup_wizard', 'bulk_create',
    ],
    isExample: false,
  },
  {
    id: 'studio_routine_builder',
    templateType: 'routine_builder_wizard',
    name: 'Routine Builder (AI)',
    tagline: 'Describe a routine in your own words — AI organizes it into sections and steps.',
    description:
      'Just describe the routine the way you\'d explain it to your kids. "Every morning make the bed, brush teeth, get dressed. On school days also pack lunch." AI parses it into structured sections with the right schedule for each part. Review, tweak, assign, and deploy.',
    exampleUseCases: [
      'Morning routine from scratch',
      'Chore chart with different daily tasks',
      'After-school checklist',
      'Bedtime routine with weekday/weekend split',
    ],
    capability_tags: [
      'ai_powered', 'routine', 'brain_dump', 'natural_language',
      'auto_organize', 'sections', 'frequency', 'setup_wizard',
    ],
    isExample: false,
  },
  {
    id: 'studio_universal_list',
    templateType: 'list_wizard',
    name: 'Create a List',
    tagline: 'Shopping, to-do, expenses, wishlists, and more — AI organizes it for you.',
    description:
      'Describe what you need or pick from suggested starting points. Brain dump your items and AI sorts them into the right sections. Share with family, add tags, and deploy. Works for shopping lists, to-do lists, expense tracking, wishlists, packing lists, prayer lists, and anything else.',
    exampleUseCases: [
      'Weekly grocery list shared with husband',
      'House to-do list',
      'School expenses by child',
      'Family trip packing list',
      'Birthday wishlist with links and prices',
    ],
    capability_tags: [
      'list', 'ai_powered', 'brain_dump', 'auto_organize', 'shared',
      'shopping', 'todo', 'expenses', 'wishlist', 'packing', 'prayer',
      'setup_wizard', 'bulk_create',
    ],
    isExample: false,
  },
]

export const GROWTH_TEMPLATES: StudioTemplate[] = [
  {
    id: 'studio_get_to_know',
    templateType: 'self_knowledge_wizard',
    name: 'Get to Know Your Family',
    tagline: 'Walk through gift ideas, love languages, comfort needs, and more for each person.',
    description:
      'A guided walkthrough of 6 connection categories for any family member: Gift Ideas, Meaningful Words, Helpful Actions, Quality Time Ideas, Sensitivities, and Comfort Needs. Answer a few prompts per category and LiLa learns what matters to each person. Makes every AI suggestion more personal.',
    exampleUseCases: [
      'New family member onboarding',
      'Deepen connection with spouse',
      'Help LiLa understand your kids',
      'Update preferences as kids grow',
    ],
    capability_tags: [
      'self_knowledge', 'connection', 'family', 'onboarding',
      'personalization', 'ai_context', 'setup_wizard',
    ],
    isExample: false,
  },
  {
    id: 'studio_best_intentions',
    templateType: 'best_intentions_wizard',
    name: 'Best Intentions Starter',
    tagline: 'Set up 3-5 daily intentions you want to practice — track without pressure.',
    description:
      'Best Intentions are things you want to practice being, not tasks to check off. "Be patient when the kids are loud." "Put my phone down during dinner." This wizard helps you create 3-5 starter intentions across family, personal growth, health, and relationships. Tap to celebrate each time you practice one — no guilt when you don\'t.',
    exampleUseCases: [
      'Start a daily intention practice',
      'Create family-wide intentions',
      'Set growth goals for the quarter',
      'Track relationship intentions',
    ],
    capability_tags: [
      'intentions', 'daily_practice', 'growth', 'reflection',
      'celebration', 'no_guilt', 'setup_wizard',
    ],
    isExample: false,
  },
]

// ─── Phase 3.7 Wizard Templates (blank "Create Your Own") ───────

export const PHASE37_WIZARD_TEMPLATES: StudioTemplate[] = [
  {
    id: 'wizard_rewards_list',
    templateType: 'rewards_list_wizard',
    name: 'Create a Rewards List',
    tagline: 'Build a list of prizes for treasure boxes, spinners, and milestone charts.',
    description:
      'Create a list of rewards your kids can earn. Use it with treasure box reveals, spinner wheels, milestone charts, or any reward contract. Add items one at a time or bulk-paste a brain dump and let AI sort them.',
    exampleUseCases: [
      'Treasure box prize options',
      'Spinner wheel rewards',
      'Milestone chart prizes',
      'Consequence list for spinners',
    ],
    capability_tags: [
      'rewards', 'prizes', 'treasure_box', 'spinner', 'milestone',
      'family_economy', 'setup_wizard', 'bulk_add',
    ],
    isExample: false,
  },
  {
    id: 'wizard_repeated_action_chart',
    templateType: 'repeated_action_chart_wizard',
    name: 'Set Up a Progress Chart',
    tagline: 'Star charts, potty charts, coloring reveals — track a repeated action with visual rewards.',
    description:
      'Pick an action your child is practicing (potty trips, piano practice, reading chapters). Choose how to display progress (star chart, coloring reveal, or both). Set milestone rewards that trigger at thresholds you choose. Assign to one or more kids and deploy.',
    exampleUseCases: [
      'Potty training chart',
      'Piano practice tracker',
      'Reading milestone chart',
      'Good behavior star chart',
    ],
    capability_tags: [
      'tracking', 'stars', 'coloring', 'milestones', 'potty_training',
      'visual_progress', 'rewards', 'setup_wizard', 'repeated_action',
    ],
    isExample: false,
  },
  {
    id: 'wizard_list_reveal_assignment',
    templateType: 'list_reveal_assignment_wizard',
    name: 'Extra Earning or Consequence Spinner',
    tagline: 'Opportunity boards with reveals, or consequence spinners — pick a flavor and customize.',
    description:
      'Two flavors in one wizard. Opportunity: create an earning board where kids claim jobs for rewards, with optional reveal animations on completion. Draw: create a consequence or activity spinner that picks randomly from your list. Both compose contracts under the hood for automatic reward delivery.',
    exampleUseCases: [
      'Extra earning opportunities board',
      'Consequence spinner',
      'Activity picker wheel',
      'Bonus chore board with reveals',
    ],
    capability_tags: [
      'opportunities', 'consequences', 'spinner', 'earning',
      'randomizer', 'reveal_animation', 'setup_wizard', 'family_economy',
    ],
    isExample: false,
  },
]

// ─── Phase 3.7 Seeded Templates (pre-filled examples) ───────────

export const PHASE37_SEEDED_TEMPLATES: StudioTemplate[] = [
  {
    id: 'seed_potty_chart',
    templateType: 'repeated_action_chart_wizard',
    name: 'Potty Chart',
    tagline: 'Classic potty training chart with coloring reveal and milestone celebrations.',
    description:
      'A ready-to-deploy potty training chart. The action is "Used the potty!" — each success adds a star and reveals a zone on a coloring page. Set up milestone rewards (every 5 trips, every 10, at completion). Customize the coloring image, step count, and prize list. Deploy to your child in under a minute.',
    exampleUseCases: [
      'Potty training for toddlers',
      'Bathroom independence chart',
      'Toilet training with visual rewards',
    ],
    capability_tags: [
      'potty_training', 'coloring', 'milestones', 'visual_progress',
      'rewards', 'setup_wizard', 'repeated_action', 'toddler',
    ],
    isExample: true,
  },
  {
    id: 'seed_consequence_spinner',
    templateType: 'list_reveal_assignment_wizard',
    name: 'Consequence Spinner',
    tagline: 'Fair, pre-decided consequences. Spin the wheel — no arguing in the moment.',
    description:
      'A consequence spinner the whole family agrees on ahead of time. When a rule is broken, spin the wheel instead of deciding in the heat of the moment. Pre-filled with 8 age-appropriate consequences (extra chores, earlier bedtime, loss of screen time, writing reflection, etc.). Customize for your family values. The spinner reveal animation makes even consequences feel fair.',
    exampleUseCases: [
      'Rule-breaking consequences',
      'Fair discipline decisions',
      'Pre-agreed consequence list',
      'No-argument discipline tool',
    ],
    capability_tags: [
      'consequences', 'spinner', 'discipline', 'fairness',
      'setup_wizard', 'randomizer', 'pre_teaching',
    ],
    isExample: true,
  },
  {
    id: 'seed_extra_earning',
    templateType: 'list_reveal_assignment_wizard',
    name: 'Extra Earning Opportunities',
    tagline: 'Bonus jobs kids can claim for money or prizes, with optional celebration reveals.',
    description:
      'A ready-to-deploy opportunity board with 6 household jobs ranging from $1 to $5. Kids browse available jobs, claim one, and complete it within the lock window. Mom approves and the reward (money, points, or a reveal animation) fires automatically. Pre-filled with common household tasks — customize amounts, add your own jobs, and pick which kids can see the board.',
    exampleUseCases: [
      'Extra chore earning board',
      'Summer job opportunities',
      'Weekend bonus tasks',
      'Allowance supplement jobs',
    ],
    capability_tags: [
      'earning', 'opportunities', 'job_board', 'claim_lock',
      'family_economy', 'setup_wizard', 'rewards', 'bonus_work',
    ],
    isExample: true,
  },
]

// ─── Phase 3.8 Wizard Templates ─────────────────────────────────

export const PHASE38_WIZARD_TEMPLATES: StudioTemplate[] = [
  {
    id: 'wizard_activity_list',
    templateType: 'activity_list_wizard',
    name: 'Set Up Subject Activities',
    tagline: 'Create a subject-based activity list with daily requirements and rewards.',
    description:
      'Build an activity list for any subject — reading, math, PE, art, or anything else. Set a daily floor (first N required, extras count as extra credit), configure reward thresholds, and deploy to kids. Supports Random draw, Browse, or Sequential-with-browse modes. Auto-creates icon launcher tiles on Play dashboard.',
    exampleUseCases: [
      'Reading activities',
      'Homeschool subject variety',
      'PE / outdoor activities',
      'Art & music activities',
    ],
    capability_tags: [
      'activity', 'subject', 'daily_floor', 'kids',
      'randomizer', 'browse', 'setup_wizard', 'icon_launcher',
    ],
    isExample: false,
  },
  {
    id: 'wizard_shared_task_list',
    templateType: 'shared_task_list_wizard',
    name: 'Create a Shared To-Do',
    tagline: 'A shared list where family members claim and complete items.',
    description:
      'Create a shared to-do list for household projects and tasks. Members claim items from the pool, optionally promoting them to personal tasks. Completion writes back to the shared list so everyone sees progress. Great for honey-do lists, home improvement projects, and shared chores between adults.',
    exampleUseCases: [
      'Honey-do list',
      'Home improvement projects',
      'Shared household tasks',
      'Vacation prep checklist',
    ],
    capability_tags: [
      'shared', 'claim', 'household', 'adults',
      'todo', 'setup_wizard', 'collaboration', 'task_promotion',
    ],
    isExample: false,
  },
]

export const PHASE38_SEEDED_TEMPLATES: StudioTemplate[] = [
  {
    id: 'seed_reading_fun',
    templateType: 'activity_list_wizard',
    name: 'Reading Fun Activities',
    tagline: 'A ready-to-go reading activity list with 8 activities for any reader.',
    description:
      'Pre-filled activity list with reading-focused activities: chapter books, audiobooks, read-alouds, library visits, and more. Random draw mode with 1 activity per day required. Library visits set to weekly recurrence.',
    exampleUseCases: [
      'Daily reading variety',
      'Summer reading program',
      'Homeschool reading block',
    ],
    capability_tags: [
      'activity', 'reading', 'kids', 'pre_filled',
      'randomizer', 'setup_wizard',
    ],
    isExample: true,
  },
  {
    id: 'seed_homeschool_variety',
    templateType: 'activity_list_wizard',
    name: 'Homeschool Variety Pack',
    tagline: 'Multi-subject activity sampler — math, science, art, PE, and more.',
    description:
      'Pre-filled with 10 activities across multiple subjects. Browse mode lets the kid pick what they want to work on. 2 activities per day required. Great for homeschool families who want daily variety without rigid scheduling.',
    exampleUseCases: [
      'Homeschool daily activities',
      'Multi-subject rotation',
      'Summer learning variety',
    ],
    capability_tags: [
      'activity', 'homeschool', 'multi_subject', 'kids',
      'browse', 'pre_filled', 'setup_wizard',
    ],
    isExample: true,
  },
  {
    id: 'seed_honey_do_list',
    templateType: 'shared_task_list_wizard',
    name: 'Honey-Do List',
    tagline: 'Common household projects and fix-it tasks to share between partners.',
    description:
      'A ready-to-deploy shared to-do list with 8 common household tasks. Partners claim items and they appear on their personal task list. Completing a claimed task checks it off the shared list. Big jobs get a "Break it down" button for Task Breaker. Customize the items for your home.',
    exampleUseCases: [
      'Partner task sharing',
      'Weekend projects',
      'Home maintenance list',
      'Fix-it tasks',
    ],
    capability_tags: [
      'shared', 'claim', 'household', 'adults',
      'honey_do', 'setup_wizard', 'pre_filled', 'task_promotion',
    ],
    isExample: true,
  },
]
