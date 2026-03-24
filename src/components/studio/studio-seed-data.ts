/**
 * Studio Seed Templates
 * Authoritative seed data from specs/studio-seed-templates.md
 *
 * System templates: is_system_template=true, family_id=NULL
 * Example templates: isExample=true, labeled with badge
 *
 * Template data is READ-ONLY source material — do not hand-edit card copy.
 * All descriptions, taglines, and example_use_cases come from the founder spec.
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
  isExample: false,
}
