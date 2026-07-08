// PRD-30 Safety Monitoring — deterministic corpus tests for the pure
// detection/sensitivity/dedup logic in
// supabase/functions/_shared/safety-classify-match.ts.
//
// KEYWORD_FIXTURE mirrors migration 00000000100289_safety_monitoring_
// foundation.sql's safety_keywords seed 1:1 (same keyword/category/
// base_severity values) so this corpus and the seed are born-calibrated,
// per the SM-A dispatch's "author the >=50-keyword library TOGETHER with
// the vitest corpus" instruction. If the migration seed ever changes, this
// fixture must change with it.
import { describe, it, expect } from 'vitest'
import {
  matchSafetyKeywords,
  resolveDefaultSensitivity,
  effectiveSensitivity,
  passesSensitivityThreshold,
  decideDedup,
  isLockedCategory,
  severityToPriority,
  buildConsolidatedNotificationBody,
  buildContextSnippetFromIndex,
  buildContextSnippetFromIndices,
  CATEGORY_LIST,
  LOCKED_CATEGORIES,
  type SafetyKeywordRow,
  type SafetyCategory,
  type ExistingFlagSummary,
  type SnippetMessage,
} from '../supabase/functions/_shared/safety-classify-match'

// Mirrors the migration seed exactly (86 rows).
const KEYWORD_FIXTURE: SafetyKeywordRow[] = [
  // self_harm
  { keyword: 'suicide', category: 'self_harm', base_severity: 'critical', is_phrase: false },
  { keyword: 'suicidal', category: 'self_harm', base_severity: 'critical', is_phrase: false },
  { keyword: 'kill myself', category: 'self_harm', base_severity: 'critical', is_phrase: true },
  { keyword: 'want to die', category: 'self_harm', base_severity: 'critical', is_phrase: true },
  { keyword: 'wish i was dead', category: 'self_harm', base_severity: 'critical', is_phrase: true },
  { keyword: 'wish i were dead', category: 'self_harm', base_severity: 'critical', is_phrase: true },
  { keyword: "don't want to be alive", category: 'self_harm', base_severity: 'critical', is_phrase: true },
  { keyword: 'do not want to be alive', category: 'self_harm', base_severity: 'critical', is_phrase: true },
  { keyword: "don't want to live", category: 'self_harm', base_severity: 'critical', is_phrase: true },
  { keyword: 'do not want to live', category: 'self_harm', base_severity: 'critical', is_phrase: true },
  { keyword: 'end my life', category: 'self_harm', base_severity: 'critical', is_phrase: true },
  { keyword: 'end it all', category: 'self_harm', base_severity: 'critical', is_phrase: true },
  { keyword: 'better off dead', category: 'self_harm', base_severity: 'critical', is_phrase: true },
  { keyword: 'no reason to live', category: 'self_harm', base_severity: 'critical', is_phrase: true },
  { keyword: "can't go on", category: 'self_harm', base_severity: 'critical', is_phrase: true },
  { keyword: 'cannot go on', category: 'self_harm', base_severity: 'critical', is_phrase: true },
  { keyword: 'take my own life', category: 'self_harm', base_severity: 'critical', is_phrase: true },
  { keyword: 'self-harm', category: 'self_harm', base_severity: 'critical', is_phrase: true },
  { keyword: 'self harm', category: 'self_harm', base_severity: 'critical', is_phrase: true },
  { keyword: 'cutting myself', category: 'self_harm', base_severity: 'critical', is_phrase: true },
  { keyword: 'hurting myself', category: 'self_harm', base_severity: 'critical', is_phrase: true },
  { keyword: 'hurt myself', category: 'self_harm', base_severity: 'critical', is_phrase: true },
  { keyword: 'unalive', category: 'self_harm', base_severity: 'critical', is_phrase: false },
  { keyword: 'unaliving', category: 'self_harm', base_severity: 'critical', is_phrase: false },
  // abuse
  { keyword: 'being abused', category: 'abuse', base_severity: 'critical', is_phrase: true },
  { keyword: 'abusing me', category: 'abuse', base_severity: 'critical', is_phrase: true },
  { keyword: 'hits me', category: 'abuse', base_severity: 'critical', is_phrase: true },
  { keyword: 'hitting me', category: 'abuse', base_severity: 'critical', is_phrase: true },
  { keyword: 'molest', category: 'abuse', base_severity: 'critical', is_phrase: false },
  { keyword: 'molested', category: 'abuse', base_severity: 'critical', is_phrase: false },
  { keyword: 'molesting', category: 'abuse', base_severity: 'critical', is_phrase: false },
  { keyword: 'scared of my dad', category: 'abuse', base_severity: 'warning', is_phrase: true },
  { keyword: 'scared of my mom', category: 'abuse', base_severity: 'warning', is_phrase: true },
  { keyword: 'afraid to go home', category: 'abuse', base_severity: 'critical', is_phrase: true },
  { keyword: 'locks me in my room', category: 'abuse', base_severity: 'warning', is_phrase: true },
  { keyword: 'punches me', category: 'abuse', base_severity: 'critical', is_phrase: true },
  // sexual_predatory
  { keyword: 'send pics', category: 'sexual_predatory', base_severity: 'warning', is_phrase: true },
  { keyword: "don't tell anyone", category: 'sexual_predatory', base_severity: 'warning', is_phrase: true },
  { keyword: 'our secret', category: 'sexual_predatory', base_severity: 'warning', is_phrase: true },
  { keyword: 'inappropriate photo', category: 'sexual_predatory', base_severity: 'critical', is_phrase: true },
  { keyword: 'groomed', category: 'sexual_predatory', base_severity: 'warning', is_phrase: false },
  { keyword: 'grooming', category: 'sexual_predatory', base_severity: 'warning', is_phrase: false },
  { keyword: 'meet in person', category: 'sexual_predatory', base_severity: 'concern', is_phrase: true },
  { keyword: 'how old are you', category: 'sexual_predatory', base_severity: 'concern', is_phrase: true },
  // substance
  { keyword: 'overdose', category: 'substance', base_severity: 'critical', is_phrase: false },
  { keyword: 'getting high', category: 'substance', base_severity: 'warning', is_phrase: true },
  { keyword: 'get drunk', category: 'substance', base_severity: 'concern', is_phrase: true },
  { keyword: 'vaping', category: 'substance', base_severity: 'concern', is_phrase: false },
  { keyword: 'vape', category: 'substance', base_severity: 'concern', is_phrase: false },
  { keyword: 'weed', category: 'substance', base_severity: 'concern', is_phrase: false },
  { keyword: 'drugs at the party', category: 'substance', base_severity: 'warning', is_phrase: true },
  { keyword: 'pressuring me to drink', category: 'substance', base_severity: 'warning', is_phrase: true },
  { keyword: 'pills to get high', category: 'substance', base_severity: 'critical', is_phrase: true },
  // eating_disorder
  { keyword: 'eating disorder', category: 'eating_disorder', base_severity: 'critical', is_phrase: true },
  { keyword: 'starving myself', category: 'eating_disorder', base_severity: 'critical', is_phrase: true },
  { keyword: 'purging', category: 'eating_disorder', base_severity: 'critical', is_phrase: false },
  { keyword: 'pro-ana', category: 'eating_disorder', base_severity: 'critical', is_phrase: false },
  { keyword: "haven't eaten in days", category: 'eating_disorder', base_severity: 'warning', is_phrase: true },
  { keyword: 'counting calories obsessively', category: 'eating_disorder', base_severity: 'warning', is_phrase: true },
  { keyword: 'hate my body', category: 'eating_disorder', base_severity: 'concern', is_phrase: true },
  { keyword: 'binge and purge', category: 'eating_disorder', base_severity: 'critical', is_phrase: true },
  // bullying
  { keyword: 'bullying me', category: 'bullying', base_severity: 'warning', is_phrase: true },
  { keyword: 'everyone hates me at school', category: 'bullying', base_severity: 'warning', is_phrase: true },
  { keyword: 'nobody likes me', category: 'bullying', base_severity: 'concern', is_phrase: true },
  { keyword: 'they made fun of me', category: 'bullying', base_severity: 'concern', is_phrase: true },
  { keyword: 'cyberbullying', category: 'bullying', base_severity: 'warning', is_phrase: false },
  { keyword: 'threatened me online', category: 'bullying', base_severity: 'warning', is_phrase: true },
  { keyword: 'excluded me from the group', category: 'bullying', base_severity: 'concern', is_phrase: true },
  // profanity
  { keyword: 'fuck', category: 'profanity', base_severity: 'concern', is_phrase: false },
  { keyword: 'shit', category: 'profanity', base_severity: 'concern', is_phrase: false },
  { keyword: 'bitch', category: 'profanity', base_severity: 'concern', is_phrase: false },
  { keyword: 'asshole', category: 'profanity', base_severity: 'concern', is_phrase: false },
  { keyword: 'damn it', category: 'profanity', base_severity: 'concern', is_phrase: true },
  // other
  { keyword: 'running away', category: 'other', base_severity: 'warning', is_phrase: true },
  { keyword: 'want to run away', category: 'other', base_severity: 'warning', is_phrase: true },
  { keyword: 'nobody would notice if i was gone', category: 'other', base_severity: 'critical', is_phrase: true },
  { keyword: 'feel so alone', category: 'other', base_severity: 'concern', is_phrase: true },
  { keyword: 'giving up on everything', category: 'other', base_severity: 'warning', is_phrase: true },
  { keyword: 'hate my life', category: 'other', base_severity: 'concern', is_phrase: true },
  { keyword: 'stopped caring about anything', category: 'other', base_severity: 'warning', is_phrase: true },
  { keyword: 'kill him', category: 'other', base_severity: 'critical', is_phrase: true },
  { keyword: 'kill her', category: 'other', base_severity: 'critical', is_phrase: true },
  { keyword: 'kill them', category: 'other', base_severity: 'critical', is_phrase: true },
  { keyword: 'going to kill', category: 'other', base_severity: 'critical', is_phrase: true },
  { keyword: 'want to hurt', category: 'other', base_severity: 'critical', is_phrase: true },
  { keyword: 'going to hurt', category: 'other', base_severity: 'critical', is_phrase: true },
]

// Violation corpus — must hit with the RIGHT category.
const VIOLATION_CORPUS: { text: string; category: SafetyCategory }[] = [
  { text: 'I just want to die, nothing matters anymore', category: 'self_harm' },
  { text: 'Sometimes I just want to end it all', category: 'self_harm' },
  { text: 'honestly I feel like I want to unalive myself', category: 'self_harm' },
  { text: 'my dad hits me when he gets angry', category: 'abuse' },
  { text: 'he told me this is our secret and not to tell anyone', category: 'sexual_predatory' },
  { text: 'we were vaping behind the school today', category: 'substance' },
  { text: "I haven't eaten in days, I just can't", category: 'eating_disorder' },
  { text: 'everyone hates me at school and I have no friends', category: 'bullying' },
  { text: 'this homework is such bullshit, fuck it', category: 'profanity' },
  { text: 'I feel so alone and nobody understands', category: 'other' },
  { text: 'my brother said he is going to kill me if I tell mom', category: 'other' },
  // Negation still triggers (Key PRD Decision #5)
  { text: "I don't want to die but I can't stop thinking about it", category: 'self_harm' },
]

// Benign contrast set — must NOT hit ANY category.
const BENIGN_CORPUS: string[] = [
  'Can you help me with my math homework tonight?',
  'What should I make for dinner this week?',
  'My favorite subject in school is science.',
  'I had a really good day today, we went to the park.',
  'How do I ask my mom if I can go to the sleepover?',
  'What is a fun activity to do with my little sister?',
  'I finished reading a great book about dragons.',
  'Can you help me write a thank-you note to my grandma?',
]

describe('PRD-30 safety-classify-match — keyword corpus', () => {
  it('every violation-corpus item matches the RIGHT category', () => {
    const failures: string[] = []
    for (const item of VIOLATION_CORPUS) {
      const matches = matchSafetyKeywords(item.text, KEYWORD_FIXTURE)
      const categories = matches.map(m => m.category)
      if (!categories.includes(item.category)) {
        failures.push(`MISS [${item.category}]: "${item.text}" -> matched categories: ${categories.join(',') || 'none'}`)
      }
    }
    expect(failures, failures.join('\n')).toEqual([])
  })

  it('ZERO benign-corpus items match any category', () => {
    const failures: string[] = []
    for (const text of BENIGN_CORPUS) {
      const matches = matchSafetyKeywords(text, KEYWORD_FIXTURE)
      if (matches.length > 0) {
        failures.push(`FALSE POSITIVE: "${text}" -> matched: ${matches.map(m => `${m.keyword}(${m.category})`).join(',')}`)
      }
    }
    expect(failures, failures.join('\n')).toEqual([])
  })

  it('negation does NOT suppress a match (Key PRD Decision #5)', () => {
    const matches = matchSafetyKeywords("I don't want to die anymore", KEYWORD_FIXTURE)
    expect(matches.some(m => m.keyword === 'want to die')).toBe(true)
  })

  it('word-boundary matching does not false-match inside compound words', () => {
    // "weed" should not match inside "weeding" or "weeds" as a substring
    // without a boundary — but with a plural it DOES share a boundary
    // (we -> weed|s, the trailing 's' is not a word char boundary issue for
    // \b since \b requires a transition; "weeds" contains "weed" followed by
    // a word char 's', so \bweed\b will NOT match "weeds" — verify that.)
    const matches = matchSafetyKeywords('I was weeding the garden today', KEYWORD_FIXTURE)
    expect(matches.some(m => m.keyword === 'weed')).toBe(false)
  })

  it('CATEGORY_LIST has exactly 8 categories and LOCKED_CATEGORIES has exactly 3', () => {
    expect(CATEGORY_LIST).toHaveLength(8)
    expect(LOCKED_CATEGORIES).toHaveLength(3)
    expect(LOCKED_CATEGORIES.sort()).toEqual(['abuse', 'self_harm', 'sexual_predatory'].sort())
  })

  it('the migration seed has >= 50 rows (mirrors the DB verification block)', () => {
    expect(KEYWORD_FIXTURE.length).toBeGreaterThanOrEqual(50)
  })
})

describe('PRD-30 safety-classify-match — locked category floor', () => {
  it('locked categories are ALWAYS high sensitivity regardless of shell/dashboard mode', () => {
    for (const category of LOCKED_CATEGORIES) {
      expect(resolveDefaultSensitivity(category, 'independent')).toBe('high')
      expect(resolveDefaultSensitivity(category, null)).toBe('high')
      expect(resolveDefaultSensitivity(category, 'play')).toBe('high')
    }
  })

  it('locked categories ignore an explicit stored sensitivity value (tampered-row floor)', () => {
    for (const category of LOCKED_CATEGORIES) {
      // Even if a 'low' row somehow exists in the DB, the pipeline must
      // still resolve 'high' — this is the enforcement the PRD calls out
      // as an application-layer override, not a DB constraint.
      expect(effectiveSensitivity(category, 'independent', 'low')).toBe('high')
      expect(effectiveSensitivity(category, 'independent', 'medium')).toBe('high')
    }
  })

  it('isLockedCategory correctly classifies all 8 categories', () => {
    expect(isLockedCategory('self_harm')).toBe(true)
    expect(isLockedCategory('abuse')).toBe(true)
    expect(isLockedCategory('sexual_predatory')).toBe(true)
    expect(isLockedCategory('substance')).toBe(false)
    expect(isLockedCategory('eating_disorder')).toBe(false)
    expect(isLockedCategory('bullying')).toBe(false)
    expect(isLockedCategory('profanity')).toBe(false)
    expect(isLockedCategory('other')).toBe(false)
  })
})

describe('PRD-30 safety-classify-match — sensitivity defaults (Screen 2 shell matrix)', () => {
  it('Play/Guided default every adjustable category to high', () => {
    for (const mode of ['play', 'guided']) {
      expect(resolveDefaultSensitivity('substance', mode)).toBe('high')
      expect(resolveDefaultSensitivity('profanity', mode)).toBe('high')
      expect(resolveDefaultSensitivity('other', mode)).toBe('high')
    }
  })

  it('Independent teens and opted-in adults default adjustable categories to medium, profanity to low', () => {
    for (const mode of ['independent', null]) {
      expect(resolveDefaultSensitivity('substance', mode)).toBe('medium')
      expect(resolveDefaultSensitivity('bullying', mode)).toBe('medium')
      expect(resolveDefaultSensitivity('other', mode)).toBe('medium')
      expect(resolveDefaultSensitivity('eating_disorder', mode)).toBe('medium')
      expect(resolveDefaultSensitivity('profanity', mode)).toBe('low')
    }
  })

  it('an explicit sensitivity row overrides the shell default for adjustable categories', () => {
    expect(effectiveSensitivity('substance', 'independent', 'high')).toBe('high')
    expect(effectiveSensitivity('substance', 'independent', null)).toBe('medium')
  })
})

describe('PRD-30 safety-classify-match — sensitivity threshold filtering (Key PRD Decision #9)', () => {
  it('Low sensitivity suppresses Concern severity but not Warning/Critical', () => {
    expect(passesSensitivityThreshold('concern', 'low')).toBe(false)
    expect(passesSensitivityThreshold('warning', 'low')).toBe(true)
    expect(passesSensitivityThreshold('critical', 'low')).toBe(true)
  })

  it('Medium and High both generate flags from any severity including Concern', () => {
    for (const sensitivity of ['medium', 'high'] as const) {
      expect(passesSensitivityThreshold('concern', sensitivity)).toBe(true)
      expect(passesSensitivityThreshold('warning', sensitivity)).toBe(true)
      expect(passesSensitivityThreshold('critical', sensitivity)).toBe(true)
    }
  })
})

describe('PRD-30 safety-classify-match — dedup + alert-fatigue consolidation (Key PRD Decisions #6/#7)', () => {
  const now = new Date().toISOString()

  it('no existing flag -> insert', () => {
    expect(decideDedup('warning', [])).toEqual({ action: 'insert' })
  })

  it('same-or-lower severity than the most recent existing flag -> update_context', () => {
    const existing: ExistingFlagSummary[] = [{ id: 'flag-1', severity: 'warning', created_at: now }]
    expect(decideDedup('concern', existing)).toEqual({ action: 'update_context', targetId: 'flag-1' })
    expect(decideDedup('warning', existing)).toEqual({ action: 'update_context', targetId: 'flag-1' })
  })

  it('higher severity than the most recent existing flag -> insert_escalation', () => {
    const existing: ExistingFlagSummary[] = [{ id: 'flag-1', severity: 'concern', created_at: now }]
    expect(decideDedup('critical', existing)).toEqual({ action: 'insert_escalation', supersedes: 'flag-1' })
  })

  it('>= 5 existing flags in the window -> consolidate onto the most recent', () => {
    const existing: ExistingFlagSummary[] = Array.from({ length: 5 }, (_, i) => ({
      id: `flag-${i}`,
      severity: 'concern' as const,
      created_at: now,
    }))
    expect(decideDedup('critical', existing)).toEqual({ action: 'consolidate', targetId: 'flag-0' })
  })
})

describe('PRD-30 safety-classify-match — notification consolidation (D3 severity -> priority)', () => {
  it('Critical and Warning bypass DND (priority high); Concern-only respects DND (priority normal)', () => {
    expect(severityToPriority('critical')).toBe('high')
    expect(severityToPriority('warning')).toBe('high')
    expect(severityToPriority('concern')).toBe('normal')
  })

  it('builds a consolidated notification listing every category at its severity', () => {
    const result = buildConsolidatedNotificationBody('Jake', [
      { category: 'substance', severity: 'warning' },
      { category: 'bullying', severity: 'concern' },
    ])
    expect(result.highestSeverity).toBe('warning')
    expect(result.body).toContain('Substance Use (Warning)')
    expect(result.body).toContain('Bullying (Concern)')
    expect(result.title).toBe('Safety alert for Jake')
  })
})

describe('PRD-30 safety-classify-match — context snippet construction (Screen 3, max 5 messages)', () => {
  const messages: SnippetMessage[] = Array.from({ length: 10 }, (_, i) => ({
    role: i % 2 === 0 ? 'user' : 'assistant',
    content: `message ${i}`,
    message_id: `msg-${i}`,
  }))

  it('Layer 1 default: flagged message + up to 2 before it, never exceeding 5', () => {
    const snippet = buildContextSnippetFromIndex(messages, 5)
    expect(snippet.length).toBeLessThanOrEqual(5)
    expect(snippet[snippet.length - 1].message_id).toBe('msg-5')
    expect(snippet[0].message_id).toBe('msg-3')
  })

  it('Layer 1 at the start of the conversation does not go negative', () => {
    const snippet = buildContextSnippetFromIndex(messages, 0)
    expect(snippet[0].message_id).toBe('msg-0')
  })

  it('Layer 2 spans the key indices plus leading context, capped at 5', () => {
    const snippet = buildContextSnippetFromIndices(messages, [4, 5, 6])
    expect(snippet.length).toBeLessThanOrEqual(5)
    expect(snippet.map(s => s.message_id)).toContain('msg-4')
    expect(snippet.map(s => s.message_id)).toContain('msg-6')
  })

  it('Layer 2 with no key indices returns an empty snippet', () => {
    expect(buildContextSnippetFromIndices(messages, [])).toEqual([])
  })
})
