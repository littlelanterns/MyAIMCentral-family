/**
 * List Wizard Presets — Suggested starting points for the Universal List Wizard.
 *
 * Each preset provides default configuration (list type, suggested sections,
 * AI parse prompt, tags, warm framing text) for the wizard steps.
 * Mom can also type anything in free text — AI detects the type.
 */

import type { ListType } from '@/types/lists'

export interface ListPreset {
  key: string
  label: string
  description: string
  listType: ListType
  suggestedSections?: string[]
  parsePrompt: string
  defaultTags: string[]
  /** Fields shown per item in the "Organize" step */
  itemFields: ('price' | 'quantity' | 'url' | 'priority' | 'notes' | 'category')[]
  /** Context-specific extras shown in step 5 */
  extras: ListWizardExtra[]
}

export interface ListWizardExtra {
  key: string
  label: string
  description: string
  defaultChecked: boolean
}

export const LIST_PRESETS: ListPreset[] = [
  {
    key: 'todo',
    label: 'Things to get done',
    description: 'A shared or personal to-do list for tasks, errands, and projects.',
    listType: 'todo',
    parsePrompt:
      'Parse these items into a to-do list. Each item is an action to complete. If an item has a priority hint (urgent, important, soon, eventually), extract it. Return JSON array: [{text, priority?, notes?}]. Priority values: "urgent", "high", "medium", "low". If no priority is clear, omit it.',
    defaultTags: ['to_do', 'tasks'],
    itemFields: ['priority', 'notes'],
    extras: [
      { key: 'promote_tasks', label: 'Any of these should become real tasks?', description: 'Promoted items get due dates, assignees, and show on the Tasks page.', defaultChecked: false },
      { key: 'flag_big_projects', label: 'Flag bigger projects?', description: 'Items that seem complex will be tagged for BigPlans follow-up.', defaultChecked: false },
    ],
  },
  {
    key: 'shopping',
    label: 'Shopping / groceries',
    description: 'A grocery or shopping trip list with quantities and store sections.',
    listType: 'shopping',
    suggestedSections: ['Produce', 'Dairy', 'Meat', 'Pantry', 'Frozen', 'Household', 'Other'],
    parsePrompt:
      'Parse these into a shopping list. Each item is something to buy. Extract quantity and unit if mentioned (e.g., "2 lbs chicken" → quantity: "2 lbs"). Suggest a store section/category for each item from: Produce, Dairy, Meat, Pantry, Frozen, Household, Other. Return JSON array: [{text, quantity?, section?, notes?}].',
    defaultTags: ['shopping', 'groceries'],
    itemFields: ['quantity', 'notes', 'category'],
    extras: [
      { key: 'auto_sort', label: 'Auto-sort items into store sections?', description: 'Items will be grouped by section so you can shop aisle by aisle.', defaultChecked: true },
      { key: 'victory_on_complete', label: 'Victory when the list is all checked off?', description: 'Checking off every item records a small win.', defaultChecked: false },
    ],
  },
  {
    key: 'expenses',
    label: 'Things to buy eventually',
    description: 'Track upcoming expenses your family needs to plan for.',
    listType: 'expenses',
    suggestedSections: ['Home', 'School', 'Medical', 'Activities', 'Clothing', 'Big Purchases', 'Other'],
    parsePrompt:
      'Parse these into an expense tracking list. Each item is something the family needs or wants to buy. Extract estimated price if mentioned (e.g., "$50" or "about 200"). Suggest a category from: Home, School, Medical, Activities, Clothing, Big Purchases, Other. Return JSON array: [{text, price?, category?, priority?, notes?}]. Priority: "need_soon", "can_wait", "nice_to_have".',
    defaultTags: ['budget', 'expenses', 'planning'],
    itemFields: ['price', 'priority', 'category', 'notes'],
    extras: [
      { key: 'budget_cap', label: 'Set a monthly budget cap?', description: 'Get a gentle alert when your total exceeds a target amount.', defaultChecked: false },
    ],
  },
  {
    key: 'packing',
    label: 'Packing for a trip',
    description: 'A categorized packing checklist you can reuse for future trips.',
    listType: 'packing',
    suggestedSections: ['Clothing', 'Toiletries', 'Gear', 'Documents', 'Snacks', 'Entertainment'],
    parsePrompt:
      'Parse these into a packing list. Each item is something to pack. Suggest a category from: Clothing, Toiletries, Gear, Documents, Snacks, Entertainment, Other. Return JSON array: [{text, section?, quantity?, notes?}].',
    defaultTags: ['packing', 'travel'],
    itemFields: ['quantity', 'notes', 'category'],
    extras: [
      { key: 'save_template', label: 'Save as a template for future trips?', description: 'Reuse this packing list next time without starting from scratch.', defaultChecked: true },
    ],
  },
  {
    key: 'wishlist',
    label: 'Gift ideas / wishlist',
    description: 'Track gift ideas with links, prices, and sizes.',
    listType: 'wishlist',
    parsePrompt:
      'Parse these into a wishlist. Each item is a gift idea or something wanted. Extract price if mentioned, URL if present, and any size/color notes. Return JSON array: [{text, price?, url?, notes?}].',
    defaultTags: ['wishlist', 'gifts'],
    itemFields: ['price', 'url', 'notes'],
    extras: [
      { key: 'share_gift_givers', label: 'Share with gift-givers?', description: 'Family and friends can see the list without spoiling surprises.', defaultChecked: false },
      { key: 'show_total', label: 'Show estimated total?', description: 'A running total of all items on the list.', defaultChecked: true },
    ],
  },
  {
    key: 'school_expenses',
    label: 'School expenses',
    description: 'Track school-related costs by child, program, or activity.',
    listType: 'expenses',
    suggestedSections: ['Tuition', 'Materials', 'Activities', 'Field Trips', 'Sports', 'Music', 'Other'],
    parsePrompt:
      'Parse these into a school expense list. Each item is a school-related cost. Extract price if mentioned. Suggest a category from: Tuition, Materials, Activities, Field Trips, Sports, Music, Other. Return JSON array: [{text, price?, category?, notes?}].',
    defaultTags: ['school', 'expenses', 'homeschool'],
    itemFields: ['price', 'category', 'notes'],
    extras: [
      { key: 'budget_cap', label: 'Set a budget cap?', description: 'Track spending against a target amount.', defaultChecked: false },
    ],
  },
  {
    key: 'ideas',
    label: 'Ideas and planning',
    description: 'A reference list for brainstorming, research, or future plans.',
    listType: 'custom',
    parsePrompt:
      'Parse these into an idea/reference list. Each item is a note, idea, or reference. Return JSON array: [{text, notes?}].',
    defaultTags: ['ideas', 'planning'],
    itemFields: ['notes', 'url'],
    extras: [],
  },
  {
    key: 'prayer',
    label: 'Prayer / intentions',
    description: 'A quiet space to hold what matters.',
    listType: 'prayer',
    parsePrompt:
      'Parse these into a prayer/intentions list. Each item is a name, intention, or prayer need. Return JSON array: [{text, notes?}].',
    defaultTags: ['prayer', 'faith'],
    itemFields: ['notes'],
    extras: [
      { key: 'include_lila', label: 'Include in LiLa context?', description: 'LiLa can draw on these when you ask for encouragement or guidance.', defaultChecked: false },
    ],
  },
  {
    key: 'custom',
    label: 'Something else',
    description: 'A flexible list for anything you need to track.',
    listType: 'custom',
    parsePrompt:
      'Parse these into a list. Each line is one item. Extract any notes or details after a dash or in parentheses. Return JSON array: [{text, notes?}].',
    defaultTags: [],
    itemFields: ['notes'],
    extras: [],
  },
]

/**
 * AI prompt for detecting list type from free text description.
 * Used in step 1 when mom types a description instead of picking a preset.
 */
export const LIST_TYPE_DETECTION_PROMPT = `Given this description of a list someone wants to create, determine the best list type.

Available types:
- "todo" — things to get done, tasks, errands, projects
- "shopping" — groceries, store trips, things to buy now
- "expenses" — budgeting, tracking costs, things to buy eventually
- "packing" — trip packing, travel preparation
- "wishlist" — gift ideas, want lists, birthday lists
- "prayer" — prayer lists, intentions, spiritual
- "custom" — anything else, ideas, references, notes

Return ONLY a JSON object: {"listType": "one_of_the_types_above", "confidence": 0.0_to_1.0}

Description: `
