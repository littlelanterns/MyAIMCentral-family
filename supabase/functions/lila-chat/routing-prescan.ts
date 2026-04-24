// Layer 1 keyword pre-scan for LiLa Assist routing-concierge behavior.
// Per PRD-05 Drawer Default and Routing Concierge Addendum sec 4a/4b/4c/4d.
//
// Runs ONLY when modeKey === 'assist' and AFTER crisis detection (Convention #7).
// On a category hit, returns a routing intent the handler uses to short-circuit
// the OpenRouter call and emit a three-part handoff (reflect + name+purpose + chips).
// On a miss, returns { kind: 'none' } and the handler falls through to the Haiku
// Assist call where Layer 2 (system-prompt instruction) handles nuanced cases.

export type RoutingTargetKey =
  | 'higgins_say'
  | 'higgins_navigate'
  | 'cyrano'
  | 'optimizer'
  | 'decision_guide'
  | 'perspective_shifter'
  | 'mediator'
  | 'translator'
  | 'board_of_directors'

export type RoutingTarget = {
  tool: RoutingTargetKey
  label: string   // Chip label — "Switch to Higgins" | "Open Decision Guide" etc.
  purpose: string // Plain-English purpose used in the handoff response body.
  verb: 'switch' | 'open' // Drawer mode vs modal tool.
}

export type RoutingIntent =
  | { kind: 'none' }
  | { kind: 'help'; reflection: string }
  | { kind: 'tool'; targets: RoutingTarget[]; reflection: string; category: string }

// Helper — case-insensitive regex test.
function matches(text: string, patterns: RegExp[]): boolean {
  return patterns.some(p => p.test(text))
}

// ============================================================
// Category 1 — LiLa Help (auto-switch)
// ============================================================
const HELP_PATTERNS: RegExp[] = [
  /\bnot working\b/i,
  /\bisn'?t working\b/i,
  /\bdoesn'?t work\b/i,
  /\bbroken\b/i,
  /\bbug\b/i,
  /\bglitch\b/i,
  /\bcan'?t (log ?in|sign ?in|login|access)\b/i,
  /\b(my )?password\b.*\b(doesn'?t|won'?t|isn'?t)\b/i,
  /\bforgot (my )?password\b/i,
  /\breset (my )?password\b/i,
  /\b(got |was )?charged (twice|again|wrong)\b/i,
  /\bbilling (issue|problem|question)\b/i,
  /\bsubscription\b.*\b(cancel|problem|issue|wrong)\b/i,
  /\berror (message|code|screen)?\b/i,
  /\bcrashed?\b/i,
  /\bwon'?t load\b/i,
  /\bfreezing\b/i,
  /\bstuck (loading|on)\b/i,
]

// ============================================================
// Category 2 — Higgins (ask, may offer two tools w/ Cyrano)
// ============================================================
const HIGGINS_NAVIGATE_PATTERNS: RegExp[] = [
  /\b(how|what) do I (tell|say to|talk to)\b/i,
  /\bdon'?t know how to (tell|say|talk)\b/i,
  /\bhard conversation\b/i,
  /\btough conversation\b/i,
  /\bdifficult (talk|conversation)\b/i,
  /\bnavigate (this|a conversation|this situation)\b/i,
  /\bhow (do|should) I (approach|handle) (talking|the conversation)\b/i,
]

const HIGGINS_SAY_PATTERNS: RegExp[] = [
  /\bwhat (do|should) I say\b/i,
  /\bhelp me (figure out what|know what) to say\b/i,
  /\bfind the words\b/i,
  /\bnot sure what to say\b/i,
]

// ============================================================
// Category 3 — Cyrano (ask, word-crafting)
// ============================================================
const CYRANO_PATTERNS: RegExp[] = [
  /\b(write|craft|draft) (something (nice|meaningful|sweet|thoughtful)|a (note|letter|message))\b/i,
  /\bhelp me write\b/i,
  /\blove note\b/i,
  /\blove letter\b/i,
  /\banniversary (card|note|message|gift note)\b/i,
  /\bbirthday (card|note|message) for (my|him|her)\b/i,
  /\b(write|craft) (an )?affirmation\b/i,
  /\bword[s]? of (affirmation|encouragement|gratitude) for\b/i,
  /\btell (my|him|her|them) how much\b/i,
  /\bfind the (right|perfect) words to (tell|say to)\b/i,
]

// ============================================================
// Category 4 — LiLa Optimizer (ask, prompt crafting)
// ============================================================
const OPTIMIZER_PATTERNS: RegExp[] = [
  /\bprompt for (chat ?gpt|claude|gemini|midjourney|dall[- ]?e|copilot)\b/i,
  /\b(write|craft|make|turn this into) (a |an )?prompt\b/i,
  /\bask (chat ?gpt|claude|gemini) (about|to)\b/i,
  /\bbetter prompt\b/i,
  /\boptimize (my |this )?prompt\b/i,
  /\bprompt engineering\b/i,
]

// ============================================================
// Category 5 — ThoughtSift sub-tools (ask, name specific sub-tool)
// ============================================================
const DECISION_GUIDE_PATTERNS: RegExp[] = [
  /\bcan'?t decide\b/i,
  /\bdecide between\b/i,
  /\bstuck on (a |this )?decision\b/i,
  /\bgoing in circles\b/i,
  /\bhelp me decide\b/i,
  /\b(weighing|torn between) (the )?options\b/i,
  /\bdecision (making|framework)\b/i,
]

const PERSPECTIVE_SHIFTER_PATTERNS: RegExp[] = [
  /\bfrom (another|a different|his|her|their) (angle|perspective|point of view)\b/i,
  /\bdifferent perspective\b/i,
  /\breframe\b/i,
  /\blook at this (in a new way|differently)\b/i,
  /\bsee it from\b/i,
]

const MEDIATOR_PATTERNS: RegExp[] = [
  /\bkeep (disagreeing|fighting|arguing)\b/i,
  /\bconflict with\b/i,
  /\bcan'?t agree (about|on)\b/i,
  /\bfight(ing)? about\b/i,
  /\b(my husband|my wife|my spouse|my partner) and I (keep|can'?t)\b/i,
  /\bstuck in (a |the )?disagreement\b/i,
]

const TRANSLATOR_PATTERNS: RegExp[] = [
  /\brewrite (this|that) (to sound|in a)\b/i,
  /\bmake (this|it) sound (more|less)\b/i,
  /\b(soften|firm up|warm up) (the|this) (tone|message|wording)\b/i,
  /\bchange the tone\b/i,
]

// ============================================================
// Category 6 — Board of Directors (ask, persona-shaped)
// ============================================================
const BOARD_PATTERNS: RegExp[] = [
  /\bwhat would \w+( \w+)? (say|think|do)\b/i,
  /\bif \w+( \w+)? (were|was) here\b/i,
  /\bhow would \w+( \w+)? (handle|approach)\b/i,
  /\bI wish I could ask \w+\b/i,
  /\badvice from \w+\b/i,
]

// ============================================================
// Target metadata (label + purpose per §4d handoff pattern)
// ============================================================
const TARGETS: Record<RoutingTargetKey, Omit<RoutingTarget, 'tool'>> = {
  higgins_navigate: {
    label: 'Switch to Higgins',
    purpose: 'could help you sort through what you want to say and how to say it',
    verb: 'switch',
  },
  higgins_say: {
    label: 'Switch to Higgins',
    purpose: 'could help you figure out exactly what to say',
    verb: 'switch',
  },
  cyrano: {
    label: 'Switch to Cyrano',
    purpose: 'could help you craft the actual words once you know what you want to say',
    verb: 'switch',
  },
  optimizer: {
    label: 'Switch to Optimizer',
    purpose: 'could help you craft a stronger prompt that weaves in your family context',
    verb: 'switch',
  },
  decision_guide: {
    label: 'Open Decision Guide',
    purpose: 'walks you through 15 different thinking frameworks to help you sort decisions like this',
    verb: 'open',
  },
  perspective_shifter: {
    label: 'Open Perspective Shifter',
    purpose: 'helps you look at a situation through different lenses',
    verb: 'open',
  },
  mediator: {
    label: 'Open Mediator',
    purpose: 'helps you work through a disagreement by holding both perspectives at once',
    verb: 'open',
  },
  translator: {
    label: 'Open Translator',
    purpose: 'rewrites text to sound warmer, firmer, or any tone you want',
    verb: 'open',
  },
  board_of_directors: {
    label: 'Open Board of Directors',
    purpose: 'lets you assemble a table of advisors (real people, historical figures, or people personal to you) and ask them one at a time',
    verb: 'open',
  },
}

function makeTarget(key: RoutingTargetKey): RoutingTarget {
  return { tool: key, ...TARGETS[key] }
}

// ============================================================
// Main entry — detect routing intent from the user's message
// ============================================================
export function detectRoutingIntent(userMessage: string): RoutingIntent {
  const text = userMessage.trim()
  if (!text) return { kind: 'none' }

  // Category 1 — Help (auto-switch)
  if (matches(text, HELP_PATTERNS)) {
    return {
      kind: 'help',
      reflection: "Sounds like something's broken — let me get you over to LiLa Help.",
    }
  }

  // Category 2 — Higgins navigate (ask) — may dual-offer with Cyrano
  const isHigginsNavigate = matches(text, HIGGINS_NAVIGATE_PATTERNS)
  const isHigginsSay = matches(text, HIGGINS_SAY_PATTERNS)
  const isCyrano = matches(text, CYRANO_PATTERNS)

  if (isHigginsNavigate || isHigginsSay) {
    const targets: RoutingTarget[] = []
    targets.push(makeTarget(isHigginsSay && !isHigginsNavigate ? 'higgins_say' : 'higgins_navigate'))
    if (isCyrano) targets.push(makeTarget('cyrano'))
    return {
      kind: 'tool',
      category: 'higgins',
      targets,
      reflection: isCyrano
        ? 'Based on what I\'m hearing — you want to figure out what to say and how to say it well'
        : 'Based on what I\'m hearing — you want help figuring out how to have this conversation',
    }
  }

  // Category 3 — Cyrano alone (word-crafting without navigation signal)
  if (isCyrano) {
    return {
      kind: 'tool',
      category: 'cyrano',
      targets: [makeTarget('cyrano')],
      reflection: 'Based on what I\'m hearing — you want to write something meaningful',
    }
  }

  // Category 4 — Optimizer
  if (matches(text, OPTIMIZER_PATTERNS)) {
    return {
      kind: 'tool',
      category: 'optimizer',
      targets: [makeTarget('optimizer')],
      reflection: 'Based on what I\'m hearing — you\'re working on a prompt for another AI tool',
    }
  }

  // Category 5 — ThoughtSift sub-tools (named individually per §4b)
  if (matches(text, DECISION_GUIDE_PATTERNS)) {
    return {
      kind: 'tool',
      category: 'decision_guide',
      targets: [makeTarget('decision_guide')],
      reflection: 'Based on what I\'m hearing — you\'re trying to work through a decision and keep going in circles',
    }
  }
  if (matches(text, MEDIATOR_PATTERNS)) {
    return {
      kind: 'tool',
      category: 'mediator',
      targets: [makeTarget('mediator')],
      reflection: 'Based on what I\'m hearing — there\'s a disagreement you\'re trying to work through',
    }
  }
  if (matches(text, PERSPECTIVE_SHIFTER_PATTERNS)) {
    return {
      kind: 'tool',
      category: 'perspective_shifter',
      targets: [makeTarget('perspective_shifter')],
      reflection: 'Based on what I\'m hearing — you want to look at this from a different angle',
    }
  }
  if (matches(text, TRANSLATOR_PATTERNS)) {
    return {
      kind: 'tool',
      category: 'translator',
      targets: [makeTarget('translator')],
      reflection: 'Based on what I\'m hearing — you want to rework the tone of something you\'ve already written',
    }
  }

  // Category 6 — Board of Directors (persona-shaped)
  // NOTE: deity/sacred-figure handling is Board of Directors' own content-policy
  // gate per Conventions #100-#102. Assist does not pre-filter — just routes.
  if (matches(text, BOARD_PATTERNS)) {
    return {
      kind: 'tool',
      category: 'board_of_directors',
      targets: [makeTarget('board_of_directors')],
      reflection: 'Based on what I\'m hearing — you want to think through this from the perspective of someone whose wisdom you trust',
    }
  }

  // No routing intent detected — fall through to Layer 2 (system prompt).
  return { kind: 'none' }
}

// ============================================================
// Handoff response body builder (three-part pattern per §4d)
// ============================================================
export function buildHandoffResponseBody(intent: RoutingIntent): string {
  if (intent.kind === 'none') return ''
  if (intent.kind === 'help') return intent.reflection

  // tool handoff — three-part pattern: reflect + name+purpose + chips
  // (chips render client-side from metadata.targets; body text does Parts 1 + 2)
  const parts: string[] = [intent.reflection]

  if (intent.targets.length === 1) {
    const t = intent.targets[0]
    const toolName = friendlyToolName(t.tool)
    parts[0] = `${parts[0]} — ${toolName} ${t.purpose}. Want to ${t.verb} over?`
  } else {
    // Two-tool offer (Higgins + Cyrano)
    const firstName = friendlyToolName(intent.targets[0].tool)
    const secondName = friendlyToolName(intent.targets[1].tool)
    parts[0] = `${parts[0]} — ${firstName} ${intent.targets[0].purpose}, or ${secondName} ${intent.targets[1].purpose}. Which feels right?`
  }

  return parts.join('\n\n')
}

function friendlyToolName(key: RoutingTargetKey): string {
  switch (key) {
    case 'higgins_say':
    case 'higgins_navigate': return 'Higgins'
    case 'cyrano': return 'Cyrano'
    case 'optimizer': return 'LiLa Optimizer'
    case 'decision_guide': return 'Decision Guide'
    case 'perspective_shifter': return 'Perspective Shifter'
    case 'mediator': return 'Mediator'
    case 'translator': return 'Translator'
    case 'board_of_directors': return 'Board of Directors'
  }
}
