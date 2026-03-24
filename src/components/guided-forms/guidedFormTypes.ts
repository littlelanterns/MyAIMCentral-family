/**
 * Guided Form type definitions (PRD-09B, specs/studio-seed-templates.md)
 *
 * Guided Forms are task_templates with template_type='guided_form'.
 * Four subtypes: sodas | what_if | apology_reflection | custom
 */

import type { GuidedFormSection } from './GuidedFormSectionEditor'

export type GuidedFormSubtype = 'sodas' | 'what_if' | 'apology_reflection' | 'custom'

// ─── Section Definitions per Subtype ─────────────────────────────

export const SODAS_SECTIONS: GuidedFormSection[] = [
  {
    key: 'situation',
    label: 'S — Situation',
    prompt: 'Describe what happened or the decision that needs to be made. Be specific and neutral.',
    filledBy: 'mom',
    required: true,
  },
  {
    key: 'options',
    label: 'O — Options',
    prompt: 'List at least 3 possible choices or responses (one per line).',
    filledBy: 'child',
    required: true,
    multiItem: true,
  },
  {
    key: 'disadvantages',
    label: 'D — Disadvantages',
    prompt: 'For each option above, what are the downsides? What could go wrong?',
    filledBy: 'child',
    required: true,
  },
  {
    key: 'advantages',
    label: 'A — Advantages',
    prompt: 'For each option above — even the bad ones — what are some benefits or positives?',
    filledBy: 'child',
    required: true,
  },
  {
    key: 'solution',
    label: 'S — Solution',
    prompt: 'Which option is best? Why? What will you actually do?',
    filledBy: 'child',
    required: true,
  },
]

export const WHAT_IF_SECTIONS: GuidedFormSection[] = [
  {
    key: 'scenario',
    label: 'The Scenario',
    prompt: 'Describe the "what if" situation. Make it realistic and specific.',
    filledBy: 'mom',
    required: true,
  },
  {
    key: 'options',
    label: 'My Options',
    prompt: 'What are all the things you could do in this situation? List each one.',
    filledBy: 'child',
    required: true,
    multiItem: true,
  },
  {
    key: 'what_might_happen',
    label: 'What Might Happen',
    prompt: 'For each option, what do you think would happen next?',
    filledBy: 'child',
    required: true,
  },
  {
    key: 'what_i_would_do',
    label: 'What I Would Do',
    prompt: 'Which option would you choose? Why?',
    filledBy: 'child',
    required: true,
  },
  {
    key: 'what_i_learned',
    label: 'What I Learned',
    prompt: 'What is one thing you want to remember from thinking through this?',
    filledBy: 'child',
    required: false,
  },
]

export const APOLOGY_REFLECTION_SECTIONS: GuidedFormSection[] = [
  {
    key: 'intro_note',
    label: 'A Note from Mom',
    prompt: 'Optional: Write a warm introduction to help your child approach this thoughtfully, not defensively.',
    filledBy: 'mom',
    required: false,
  },
  {
    key: 'what_happened',
    label: 'What Happened',
    prompt: 'In your own words, what happened? Describe what you did.',
    filledBy: 'child',
    required: true,
  },
  {
    key: 'who_was_affected',
    label: 'Who Was Affected and How',
    prompt: 'Who was hurt or affected by what happened? How do you think they felt?',
    filledBy: 'child',
    required: true,
  },
  {
    key: 'why_it_mattered',
    label: 'Why It Mattered',
    prompt: 'Why did this matter? What value or rule did it touch on?',
    filledBy: 'child',
    required: true,
  },
  {
    key: 'what_i_wish',
    label: 'What I Wish I Had Done Instead',
    prompt: 'Looking back, what would a better choice have looked like?',
    filledBy: 'child',
    required: true,
  },
  {
    key: 'make_it_right',
    label: 'How I Want to Make It Right',
    prompt: 'Is there something you can do to repair the relationship or fix the situation?',
    filledBy: 'child',
    required: false,
  },
  {
    key: 'remember',
    label: 'What I Want to Remember',
    prompt: 'One thing you want to carry with you from thinking through this.',
    filledBy: 'child',
    required: false,
  },
]

export function getSectionsForSubtype(subtype: GuidedFormSubtype): GuidedFormSection[] {
  switch (subtype) {
    case 'sodas': return SODAS_SECTIONS
    case 'what_if': return WHAT_IF_SECTIONS
    case 'apology_reflection': return APOLOGY_REFLECTION_SECTIONS
    case 'custom': return [] // custom forms use sections from the template's stored config
  }
}

export function getSubtypeLabel(subtype: GuidedFormSubtype): string {
  switch (subtype) {
    case 'sodas': return 'SODAS'
    case 'what_if': return 'What-If Game'
    case 'apology_reflection': return 'Apology Reflection'
    case 'custom': return 'Custom Form'
  }
}

// ─── DB Record Shapes ─────────────────────────────────────────────

export interface GuidedFormTemplate {
  id: string
  family_id: string | null
  created_by: string | null
  title: string
  description: string | null
  template_type: 'guided_form'
  guided_form_subtype: GuidedFormSubtype
  /** For 'custom' subtype: stored section definitions */
  config: {
    sections?: GuidedFormSection[]
    example_use_cases?: string[]
    intro_note?: string
  } | null
  is_system: boolean
  created_at: string
  updated_at: string
}

export interface GuidedFormResponse {
  id: string
  task_id: string
  family_member_id: string
  section_key: string
  section_content: string
  filled_by: 'mom' | 'child'
  completed_at: string | null
  created_at: string
  updated_at: string
}

/** Keyed by section_key for easy lookup */
export type GuidedFormResponseMap = Record<string, GuidedFormResponse>
