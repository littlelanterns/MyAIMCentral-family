/**
 * LiLa Assist Context — Route-Aware Help
 *
 * Provides contextual help text for LiLa Assist mode based on the current route.
 * When a user asks "What can I do here?" or "Help me with this page," LiLa
 * uses this context to give specific, actionable guidance.
 */

import { getFeatureByKey, getAllFeatures, JOURNEY_STAGES, type JourneyFeature } from './lanterns-path-data'

interface AssistContext {
  featureKey: string
  pageName: string
  whatThisPageDoes: string
  suggestionsToTry: string[]
}

const ROUTE_CONTEXT: Record<string, AssistContext> = {
  '/dashboard': {
    featureKey: 'dashboard',
    pageName: 'Personal Dashboard',
    whatThisPageDoes: 'Your personalized command center showing tasks, events, trackers, victories, and Guiding Stars. Drag sections to reorder. The QuickTasks strip at the top gives one-tap access to common actions.',
    suggestionsToTry: [
      'Try the QuickTasks strip — tap "Add Task" or "Quick Note" for instant action',
      'Drag sections to reorder your dashboard view',
      'Open the LiLa drawer at the bottom to start a conversation',
    ],
  },
  '/guiding-stars': {
    featureKey: 'guiding_stars',
    pageName: 'Guiding Stars',
    whatThisPageDoes: 'Your values and declarations — the anchor for everything LiLa does. Start with "I choose..." or "I am learning to..." These aren\'t goals. They\'re statements about who you\'re becoming.',
    suggestionsToTry: [
      'Write your first Guiding Star: "I choose to be fully present with my kids"',
      'Try "Craft with LiLa" to get AI help writing a declaration',
      'Heart the stars you want LiLa to reference in conversations',
    ],
  },
  '/best-intentions': {
    featureKey: 'best_intentions',
    pageName: 'Best Intentions',
    whatThisPageDoes: 'Daily commitments you celebrate when honored — never shame when missed. Tap to celebrate each iteration. Streaks show patterns. Fresh Reset means each period starts clean.',
    suggestionsToTry: [
      'Set one intention for this week',
      'Tap the celebrate button each time you honor an intention',
      'Watch your iteration count grow — it\'s your ta-da list for habits',
    ],
  },
  '/inner-workings': {
    featureKey: 'innerworkings',
    pageName: 'InnerWorkings — My Foundation',
    whatThisPageDoes: 'Your self-knowledge library. Personality types, strengths, growth areas, and the patterns that make you uniquely you. Everything here feeds LiLa\'s understanding of how you think and communicate.',
    suggestionsToTry: [
      'Add a personality insight — Enneagram, MBTI, StrengthsFinder, or anything',
      'Start a guided self-discovery conversation with LiLa',
      'Upload assessment results for LiLa to extract insights',
    ],
  },
  '/journal': {
    featureKey: 'journal',
    pageName: 'Journal',
    whatThisPageDoes: 'Your private reflection space. Eleven entry types — gratitude, kid quips, meeting notes, brain dumps, and more. Write via the Smart Notepad (tap +). Filter by type to review themes.',
    suggestionsToTry: [
      'Tap + to open the Smart Notepad and write something',
      'Filter by entry type to see just your gratitude entries',
      'Toggle AI inclusion to control what LiLa can reference',
    ],
  },
  '/tasks': {
    featureKey: 'tasks',
    pageName: 'Tasks',
    whatThisPageDoes: 'Your family\'s complete task system. Simple tasks, routines with step-by-step tracking, opportunity boards, sequential collections, and 13 prioritization views.',
    suggestionsToTry: [
      'Create a task and try Task Breaker to split it into steps',
      'Switch between prioritization views to see tasks through different lenses',
      'Visit Studio to create routine templates for your kids',
    ],
  },
  '/lists': {
    featureKey: 'lists',
    pageName: 'Lists',
    whatThisPageDoes: 'Ten list types — shopping, wishlist, packing, expenses, to-do, prayer, ideas, backburner, custom, and randomizer. Share with family. Promote items to tasks.',
    suggestionsToTry: [
      'Create a shopping list with quantities and store sections',
      'Try the randomizer — great for "who picks dinner tonight?"',
      'Share a list with a family member for real-time collaboration',
    ],
  },
  '/studio': {
    featureKey: 'studio',
    pageName: 'Studio',
    whatThisPageDoes: 'Your template workshop. Browse blank formats for tasks, routines, opportunity boards, guided forms, and lists. Customize for your family, then deploy to members.',
    suggestionsToTry: [
      'Browse a category and tap [Customize] on a blank format',
      'Check the Examples tab for fully-built template inspiration',
      'Visit My Customized to deploy or edit your templates',
    ],
  },
  '/archives': {
    featureKey: 'archives',
    pageName: 'Archives',
    whatThisPageDoes: 'The knowledge engine behind LiLa. Context about every family member organized in folders — preferences, schedules, personality, interests, health, and more.',
    suggestionsToTry: [
      'Click a family member to explore their context folders',
      'Add a preference or personality trait to a member\'s archive',
      'Toggle the heart icon to control what LiLa can reference',
    ],
  },
  '/vault': {
    featureKey: 'vault_browse',
    pageName: 'AI Vault',
    whatThisPageDoes: 'A curated library of AI tutorials, prompt packs, tools, and skill-building content. Learn to create with AI. Some tools run inside MyAIM, others guide you through external platforms.',
    suggestionsToTry: [
      'Browse by category to find content that interests you',
      'Bookmark items you want to return to later',
      'Try a prompt pack — copy a prompt and use it in your favorite AI tool',
    ],
  },
  '/lanterns-path': {
    featureKey: 'lanterns_path',
    pageName: 'The Lantern\'s Path',
    whatThisPageDoes: 'Your guide to every feature in MyAIM, organized in the order that makes the journey meaningful. See what\'s working now, what\'s coming next, and how everything connects.',
    suggestionsToTry: [
      'Toggle between "Full Map" and "What\'s Working Now"',
      'Click "Go there now" to jump to any built feature',
      'Read the stage narratives to understand how features connect',
    ],
  },
  '/settings': {
    featureKey: 'settings',
    pageName: 'Settings',
    whatThisPageDoes: 'Manage your profile, customize your theme, manage family members and PINs, and access The Lantern\'s Path guide.',
    suggestionsToTry: [
      'Try changing your theme to see the design system in action',
      'Toggle dark mode or gradients',
      'Visit The Lantern\'s Path for a full feature guide',
    ],
  },
}

/**
 * Get contextual help for a route.
 * Returns the help text + enriched feature data from lanterns-path-data.
 */
export function getContextualHelpForRoute(route: string): (AssistContext & { feature?: JourneyFeature }) | null {
  // Exact match first
  if (ROUTE_CONTEXT[route]) {
    const ctx = ROUTE_CONTEXT[route]
    return { ...ctx, feature: getFeatureByKey(ctx.featureKey) }
  }

  // Prefix match (e.g., /journal/reflections matches /journal)
  const prefix = Object.keys(ROUTE_CONTEXT)
    .filter(r => route.startsWith(r) && r !== '/')
    .sort((a, b) => b.length - a.length)[0]

  if (prefix) {
    const ctx = ROUTE_CONTEXT[prefix]
    return { ...ctx, feature: getFeatureByKey(ctx.featureKey) }
  }

  return null
}

/**
 * Build a system prompt addition for LiLa Assist mode.
 * Includes current page context PLUS full platform knowledge.
 */
export function buildAssistSystemPrompt(route: string): string {
  let prompt = ''

  // Current page context
  const ctx = getContextualHelpForRoute(route)
  if (ctx) {
    prompt += `The user is currently on the ${ctx.pageName} page.\n`
    prompt += `This page: ${ctx.whatThisPageDoes}\n`

    if (ctx.feature?.connections) {
      prompt += `Connections: ${ctx.feature.connections}\n`
    }

    prompt += `\nSuggestions you can offer:\n`
    ctx.suggestionsToTry.forEach(s => {
      prompt += `- ${s}\n`
    })
    prompt += '\n'
  }

  // Full platform knowledge — LiLa Assist knows about ALL features
  prompt += buildPlatformKnowledgePrompt()

  return prompt
}

/**
 * Build a comprehensive platform knowledge prompt from all Lantern's Path data.
 * This gives LiLa Assist full knowledge of every feature — built and in-production.
 */
export function buildPlatformKnowledgePrompt(): string {
  let prompt = '--- FULL PLATFORM KNOWLEDGE ---\n'
  prompt += 'You know about every feature in MyAIM Family. When users ask about any feature, you can describe it enthusiastically and explain how it connects to other features.\n\n'

  for (const stage of JOURNEY_STAGES) {
    prompt += `## Stage ${stage.number}: ${stage.title} — ${stage.subtitle}\n`

    for (const f of stage.features) {
      const statusLabel = f.status === 'built' ? '[AVAILABLE NOW]' : '[IN PRODUCTION]'
      prompt += `\n### ${f.name} ${statusLabel}\n`
      prompt += `${f.description}\n`
      prompt += `Connections: ${f.connections}\n`

      if (f.status === 'built' && f.route) {
        prompt += `Route: ${f.route}\n`
      }

      if (f.miniPrompts && f.miniPrompts.length > 0) {
        prompt += `Try: ${f.miniPrompts.join(' | ')}\n`
      }

      if (f.subTools && f.subTools.length > 0) {
        prompt += `Sub-tools: ${f.subTools.map(t => `${t.name} (${t.brief})`).join(', ')}\n`
      }

      if (f.lookForward) {
        prompt += `Coming soon: ${f.lookForward}\n`
      }
    }
    prompt += '\n'
  }

  return prompt
}
