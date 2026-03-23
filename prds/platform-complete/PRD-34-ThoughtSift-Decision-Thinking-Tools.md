# PRD-34: ThoughtSift — Decision & Thinking Tools

**Status:** Not Started
**Dependencies:** PRD-01 (Auth & Family Setup), PRD-02 (Permissions & Access Control), PRD-03 (Design System & Themes), PRD-04 (Shell Routing & Layouts — sidebar, modals), PRD-05 (LiLa Core AI System — guided mode registry, conversation engine, context assembly, conversation modals), PRD-07 (InnerWorkings — personality data for Perspective Shifter family-context lenses), PRD-13 (Archives & Context — person context, family context, relationship notes), PRD-19 (Family Context & Relationships — relationship_mediation guided mode superseded, relationship notes, name resolution), PRD-21 (Communication & Relationship Tools — AI Toolbox sidebar pattern, `lila_tool_permissions`), PRD-21A (AI Vault — browse, launch, "+Add to AI Toolbox" pattern), PRD-23 (BookShelf — extracted content enriches Board of Directors personas), PRD-30 (Safety Monitoring — all conversations pass through safety pipeline)
**Created:** March 22, 2026
**Last Updated:** March 22, 2026

---

## Overview

ThoughtSift is a suite of five AI-powered thinking tools that help family members process decisions, shift perspectives, resolve conflicts, and communicate more effectively. Each tool is a distinct LiLa guided conversation mode, accessed through the AI Vault and assignable to family members via the AI Toolbox.

The five tools are: **Board of Directors** (multi-persona advisory panel), **Perspective Shifter** (framework-based reframing with family-context lenses), **Decision Guide** (structured decision-making with 15 frameworks), **Mediator** (conflict resolution for any interpersonal situation), and **Translator** (fun text rewriting for different audiences and tones). Each tool registers as a separate guided mode in the LiLa registry, with its own system prompt, model tier, context sources, and conversation UI.

ThoughtSift tools live in the AI Vault as 5 separate browsable items. Mom discovers them in the Vault, launches them directly, and can assign individual tools to specific family members via "+Add to AI Toolbox." Assigned tools appear in the member's AI Toolbox sidebar section. All tools start parked in the Vault with no default assignments — mom controls who gets what.

> **Mom experience goal:** When I'm stuck on a decision, caught in a conflict, or just need to think something through from a different angle, I want to open a tool that's smarter than a blank chat window. I want it to know frameworks I don't know, ask questions I wouldn't think to ask, and help me see things I'm too close to see — while always leaving me in the driver's seat.

---

## User Stories

### Board of Directors
- As a mom, I want to assemble a panel of advisors who each give me their unique perspective on my situation so I can hear diverse viewpoints without needing five real people available.
- As a mom, I want to search for a historical figure or literary character and have AI create a faithful persona so the advice feels authentic to that person's known philosophy.
- As a mom, I want to save personas I've used so I can quickly reassemble my favorite board for future decisions.
- As a mom, I want LiLa to suggest relevant board members after hearing my situation so I don't have to think of who to pick.
- As a mom, I want to create a persona of someone personal to me (my grandmother, my pastor) so I can hear their voice on a problem even when they're not available.
- As a teen, I want to talk to Gandalf or Atticus Finch about my problem so thinking tools feel engaging, not boring.

### Perspective Shifter
- As a mom, I want to describe my situation and then see it through different psychological frameworks so I can understand what's really going on beneath the surface.
- As a mom, I want to switch between lenses mid-conversation so I can explore the same problem from multiple angles without starting over.
- As a mom, I want a "How would [husband/child] see this?" lens that uses real data about my family members so the perspective shift is specific to my family, not generic.
- As a dad, I want to use the Perspective Shifter on my own situations so I can process without needing to involve my wife in every internal struggle.

### Decision Guide
- As a mom, I want to describe my decision and have LiLa suggest the best framework for my situation type so I don't need to know decision science to make better decisions.
- As a mom, I want to pick from a list of decision frameworks when I already know which approach I want so I'm never forced into LiLa's suggestion.
- As a mom, I want LiLa to check my decision against my Guiding Stars and Best Intentions so I can see whether this choice aligns with who I said I want to be.
- As a teen, I want help thinking through a decision in a structured way so I can build decision-making skills for independence.

### Mediator
- As a mom, I want to dump a conflict situation and have LiLa walk me through it using real conflict resolution frameworks so I can find clarity before I re-engage with the other person.
- As a mom, I want the Mediator to know the difference between a married-couple conflict and a parent-child conflict so the guidance is age-appropriate and relationship-appropriate.
- As a dad, I want to process a work conflict through the Mediator so I can show up better at work tomorrow.
- As a teen, I want help figuring out how to handle a problem with a friend so I can learn to navigate conflict on my own.

### Translator
- As a mom, I want to paste a message and have it rewritten in pirate speak so my kids laugh at dinner.
- As a mom, I want to take a harsh email I wrote and soften the tone so I don't send something I'll regret.
- As a teen, I want to rewrite my history essay in Gen Z speak just to see what happens.
- As a guided-age child, I want to make my story sound like a fairy tale narrator wrote it because that's fun.

---

## Screens

### Screen 1: Board of Directors — Main Conversation

> **Depends on:** LiLa conversation modal — defined in PRD-05. Guided mode registry — defined in PRD-05, Guided Mode Registry section.

The Board of Directors conversation looks like a group chat with attributed responses.

**What the user sees:**

```
┌──────────────────────────────────────────────────────────┐
│  Board of Directors                              [×]     │
│  ──────────────────────────────────────────────────────  │
│  Your Board: Benjamin Franklin · Abigail Adams · [+ Add] │
│  ──────────────────────────────────────────────────────  │
│                                                          │
│  You:                                                    │
│  I'm thinking about pulling my daughter out of public    │
│  school to homeschool. My husband thinks it's too much   │
│  work and we can't afford the curriculum.                │
│                                                          │
│  🎩 Benjamin Franklin:                                   │
│  Let us examine this as I would any venture — what is    │
│  the true cost of the current path versus the proposed   │
│  one? You speak of curriculum expense, but what is the   │
│  cost of an education that fails to serve this           │
│  particular child? I kept careful accounts all my life.  │
│  Let us do the same here...                              │
│                                                          │
│  📜 Abigail Adams:                                       │
│  I educated my children at home during a revolution,     │
│  with no curriculum at all. The question is not whether  │
│  you can afford it — it is whether you can bear the      │
│  weight of watching your daughter dimmed by a system     │
│  that does not see her. Your husband's concern about     │
│  work is practical and worthy of respect. How might      │
│  you share this labor?                                   │
│                                                          │
│  ──────────────────────────────────────────────────────  │
│  💬 What's your response? Or ask a new question...       │
│  [🎤]                                       [Send]       │
└──────────────────────────────────────────────────────────┘
```

**Board assembly bar (top):**
- Shows current board members as name chips with small icons
- [+ Add] button opens the persona selector (Screen 2)
- Tapping an existing chip shows a remove option
- Default: 3 seats. Max: 5. Minimum: 1 (single advisor mode)
- LiLa appears after the user's first message to suggest board composition if no members are seated yet

**Conversation area:**
- User messages appear left-aligned (standard chat)
- Each advisor's response is attributed with their name and a small emoji/icon identifier
- Responses appear sequentially — each advisor can reference what prior advisors said
- Visual dividers between advisor responses for scannability

**LiLa interjections:**
- LiLa can interject between advisor rounds: "Your board has weighed in. Want to capture any decisions or next steps before we continue?" or "I notice your board is split — would it help to hear from a different perspective?"
- LiLa also delivers the coin flip insight when she detects extended indecision: "Before we go further — if I flipped a coin right now and it landed on [Option A], what's your gut reaction? Relief or dread? That reaction is data."

**Persona disclaimer (shown once per session):**
When the first non-personal persona responds, a subtle inline notice appears:
> *This is an AI interpretation of [Name] based on publicly available writings and known positions. Not endorsed by or affiliated with [Name]. For the real thing, read their actual work.*

This shows once, not on every message. Does not appear for personal custom personas.

**Interactions:**
- User types message → each seated advisor generates a Sonnet response in sequence
- User can respond to a specific advisor ("@Franklin, what do you mean by...") or address the whole board
- User can add/remove advisors mid-conversation
- Action chips on each advisor message: Copy, Save to Notepad
- Action chip on LiLa wrap-up messages: Capture Decision, Route to BigPlans, Save to Notepad

**Data created/updated:**
- `lila_conversations`: one conversation record with `guided_mode = 'board_of_directors'`
- `lila_messages`: one per user message, one per advisor response (attributed via `metadata.persona_id`)
- `board_sessions`: links conversation to seated personas (see Data Schema)
- `board_session_personas`: tracks which personas were active in this session

### Screen 2: Persona Selector

**What the user sees:**

```
┌──────────────────────────────────────────────────────────┐
│  Add to Your Board                               [×]     │
│  ──────────────────────────────────────────────────────  │
│  🔍 Search for a person, character, or archetype...      │
│  ──────────────────────────────────────────────────────  │
│                                                          │
│  ⭐ Your Favorites                                       │
│  [Benjamin Franklin] [Grandma Rose] [Gandalf]            │
│                                                          │
│  🕐 Recently Used                                        │
│  [Abigail Adams] [C.S. Lewis] [Charlotte Mason]         │
│                                                          │
│  🌟 Suggested for This Situation                         │
│  [🎓 An education expert — like Charlotte Mason]         │
│  [💰 A financial pragmatist — like Dave Ramsey]          │
│  [🙏 A faith perspective — like Corrie ten Boom]         │
│                                                          │
│  📚 Platform Library                                     │
│  [Browse all →]                                          │
│                                                          │
│  ✨ Create Custom Person                                 │
│  [Create someone personal to you →]                      │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

**Sections:**
1. **Search** — free text search across all persona tiers. If the person isn't found, offer to generate them.
2. **Favorites** — personas the user has starred. Persisted per user.
3. **Recently Used** — last 10 personas used by this user.
4. **Suggested for This Situation** — LiLa suggests 2-3 personas by role-with-name-example based on the situation already described. Only appears when a situation has been entered before opening the selector.
5. **Platform Library** — browse all system-preloaded and community-approved personas. Filterable by category (Historical, Literary, Faith Leaders, Thinkers, Business, Parenting).
6. **Create Custom Person** — opens the custom persona creation flow (Screen 3).

**When user searches for someone not in the library:**
- "We don't have [Name] yet. Want me to create them?" → [Yes, create] button
- Sonnet generates the persona profile. User gets it immediately.
- If `persona_type` would be `community_generated`, it queues for moderation review before becoming public.
- If the name triggers the content policy gate (deity, blocked figure), the appropriate redirect fires (Prayer Seat or block message).

**Interactions:**
- Tap any persona → seats them on the board, returns to conversation
- Long-press → preview card showing personality summary, communication style, source references
- Star icon on each persona → toggle favorite
- Tap "Browse all" → expands to a full browsable grid with categories and search

### Screen 3: Custom Persona Creation

**What the user sees:**

```
┌──────────────────────────────────────────────────────────┐
│  Create a Personal Advisor                       [×]     │
│  ──────────────────────────────────────────────────────  │
│                                                          │
│  Name: [________________________]                        │
│                                                          │
│  Who is this person to you?                              │
│  [My grandmother] [A mentor] [A pastor/spiritual leader] │
│  [A friend] [A fictional character I'm writing] [Other]  │
│                                                          │
│  Describe them — how do they think, talk, and give       │
│  advice? What matters most to them?                      │
│  [                                                    ]  │
│  [                                                    ]  │
│  [                                                    ]  │
│                                                          │
│  [Create Advisor]                                        │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

After tapping [Create Advisor], LiLa asks one follow-up:
> "One more thing — when [Name] gives advice, are they more direct and blunt, or warm and gentle? Do they lead with logic or with stories?"

Then the persona is generated and seated on the board.

**Content safety gate:**
- Haiku pre-screens the name and description for content policy violations
- Deity names → redirect to Prayer Seat: "We don't create AI voices for [deity]. Instead, I can create a Prayer Seat — a set of reflection questions you could take to [deity] in prayer. Would you like that?"
- Blocked figures → "I'm not able to create a persona for [name]. Is there someone else you'd like at your table?"
- Descriptions containing sexual, violent, or harmful trait language → "I notice some elements in your description that don't fit our platform's values. Could you adjust the description to focus on how this person thinks and gives advice?"

**Data created:**
- `board_personas`: new record with `persona_type = 'personal_custom'`, `created_by = current_user`
- Personal custom personas NEVER enter the platform intelligence pipeline

### Screen 4: Prayer Seat

When a user selects a deity for their board, instead of creating a speaking persona, LiLa generates a Prayer Seat.

**What the user sees:**

```
┌──────────────────────────────────────────────────────────┐
│  🕊️ Prayer Seat                                         │
│  ──────────────────────────────────────────────────────  │
│                                                          │
│  We believe that the voice of [God/the Divine] is too    │
│  sacred for AI to speak on behalf of. Instead, here      │
│  are some questions you might bring to prayer or         │
│  meditation about your situation:                        │
│                                                          │
│  • What do I sense is the right thing to do when I'm     │
│    quiet enough to hear?                                 │
│  • What would love — not fear — choose here?             │
│  • What am I being invited to learn through this?        │
│  • If I trusted that I would be guided, what would I     │
│    do first?                                             │
│  • What does peace feel like in this decision? Which     │
│    option carries more peace?                            │
│                                                          │
│  [Save to Journal]  [Add to Board as Reflection Seat]    │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

**"Add to Board as Reflection Seat"** creates a special board seat that doesn't generate AI responses. Instead, after each round of advisor responses, the Reflection Seat inserts the saved prayer questions as a contemplative pause. It's a visual reminder to consult the sacred alongside the intellectual.

> **Decision rationale:** The Prayer Seat pattern respects the sacred across all faith traditions while giving the user genuine value. It's not a refusal — it's a redirect to something more appropriate. The questions are generated fresh each time based on the user's specific situation, not canned.

### Screen 5: Perspective Shifter — Main Conversation

**What the user sees:**

```
┌──────────────────────────────────────────────────────────┐
│  Perspective Shifter                             [×]     │
│  ──────────────────────────────────────────────────────  │
│  Active Lens: [IFS Parts ▾]                              │
│  ──────────────────────────────────────────────────────  │
│                                                          │
│  You:                                                    │
│  I keep snapping at my husband over small things and I   │
│  don't know why. He left a dish in the sink and I       │
│  completely lost it.                                     │
│                                                          │
│  🔮 Through the IFS Parts lens:                          │
│  Let's get curious about what happened there. When you   │
│  saw that dish, something activated in you — fast and    │
│  hot. That's a Firefighter part. It's not really about   │
│  the dish, is it? What does that dish represent to       │
│  the part of you that reacted? "He doesn't see me."     │
│  "I'm doing everything alone." "Nobody cares."           │
│  Which of those lands closest?                           │
│                                                          │
│  ── Switched to: Empowerment Dynamic ──────────────────  │
│                                                          │
│  🔮 Through the Empowerment Dynamic lens:                │
│  Interesting. Now let's look at the same moment through  │
│  a different lens. When you snapped — were you in        │
│  Creator mode (choosing how to respond) or Victim mode   │
│  (reacting to what was done to you)? No judgment —       │
│  just noticing. And your husband in that moment — did    │
│  he feel like a Persecutor to you, or was he just a      │
│  person who left a dish?                                 │
│                                                          │
│  ──────────────────────────────────────────────────────  │
│  Lenses: [IFS Parts] [Empowerment] [Outward Mindset]    │
│  [Enneagram] [Hero's Journey] [Growth Mindset]           │
│  [Meaning-Making] [How would David see this?] [+ More]   │
│  ──────────────────────────────────────────────────────  │
│  💬 Type your response...                                │
│  [🎤]                                       [Send]       │
└──────────────────────────────────────────────────────────┘
```

**Lens selector (bottom chips):**
- Scrollable horizontal chip row above the input
- Active lens highlighted
- Tapping a different lens inserts a visual divider in the conversation and LiLa's next response comes through the new framework
- Conversation history is preserved — each new lens has full context of everything said so far
- Family-context lenses ("How would [Name] see this?") appear with the member's name and pull real InnerWorkings/Archives data
- [+ More] expands to the full lens library including custom lenses

**Lens categories in the full library:**

**Simple Angle Shifts:**
- The Optimist, The Realist, Devil's Advocate, The Compassionate Observer, The Future Self, The Child's Eyes

**Named Framework Lenses:**
- IFS Parts Check-In, Empowerment Dynamic, Inward/Outward Mindset, Enneagram Lens, Hero's Journey, Growth vs. Fixed Mindset, Consciousness/Energy Mapping, Meaning-Making/Existential

**Family-Context Lenses:**
- "How would [spouse] see this?" — loads partner InnerWorkings + Archives
- "How would [child] see this?" — loads child's age, developmental stage, personality
- "How would [family member] see this?" — any archived family member

**Custom lenses:**
- User can describe a lens ("Show me this through the lens of a business strategist") → LiLa creates and caches for reuse
- Community-generated lenses enter the library after moderation review (same three-tier pattern as BoD personas)

> **Decision rationale:** Lens chips at the bottom rather than a dropdown keeps lens switching fast and visible. Users can see their options without an extra tap. The family-context lenses are the killer differentiator — no other tool on the market can say "based on what I know about your actual husband, here's how he'd probably perceive this."

**Person selector for family-context lenses:**
- When user taps a family-context lens chip, a person pill selector appears (same pattern as PRD-21's Higgins tools)
- LiLa also detects family member names in conversation via PRD-19's name resolution table and offers: "You mentioned David — would you like to see this from his perspective?"
- Context loaded: InnerWorkings entries (`personality_type`, `traits`, `strengths`, `growth_areas`), Archive context items (`preferences`, `schedule`, `interests`), relationship notes from PRD-19
- Privacy Filtered items always excluded
- Non-mom users only see context mom has granted for that tool + person combination per `lila_tool_permissions.context_person_ids`

### Screen 6: Decision Guide — Main Conversation

**What the user sees:**

```
┌──────────────────────────────────────────────────────────┐
│  Decision Guide                                  [×]     │
│  ──────────────────────────────────────────────────────  │
│                                                          │
│  You:                                                    │
│  I need to decide whether to go back to work part-time   │
│  or start a side business from home.                     │
│                                                          │
│  LiLa:                                                   │
│  That's a big one — it touches your time, your finances, │
│  your family's rhythm, and your sense of purpose. I have │
│  a few ways to think through this.                       │
│                                                          │
│  Want me to suggest the best approach for your           │
│  situation, or would you like to pick your own?          │
│                                                          │
│  [Suggest for me]  [I'll pick my own]                    │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

**If user taps "Suggest for me":**
LiLa recommends 1-2 frameworks with a one-line explanation:
> "For a life decision with financial and identity dimensions, I'd recommend the **Weighted Criteria Matrix** to get clarity on what matters most, paired with the **Identity-Based Decision** to check which option aligns with who you want to become. Want to start there?"

**If user taps "I'll pick my own":**
Scrollable list of all 15 frameworks:

| # | Framework | One-Line Description |
|---|-----------|---------------------|
| 1 | Simple Pros & Cons | List advantages and disadvantages. Classic and fast. |
| 2 | Weighted Criteria Matrix | Score options against named criteria with importance weights. |
| 3 | Values Alignment Test | Check the decision against your Guiding Stars and Best Intentions. |
| 4 | Identity-Based Decision | "What would the person I want to become do?" |
| 5 | Essentialism Filter | "If I could only do ONE of these, which?" |
| 6 | Best Friend Test | "What would you tell your best friend to do?" |
| 7 | Tiny Experiment | Design a small reversible test instead of deciding forever. |
| 8 | Ripple Map | Map who this decision affects and how. |
| 9 | Principles-Based Test | "What type of situation is this? What principle applies?" |
| 10 | Capacity-Honest Check | "Given my ACTUAL capacity right now, can I take this on?" |
| 11 | Long Game Filter | "What does this look like in 5 years? 10 years?" |
| 12 | Believability-Weighted Input | "Whose advice should carry the most weight on THIS topic?" |
| 13 | Both/And Reframe | "Is this really either/or, or is there a third option?" |
| 14 | Fear vs. Faith Sort | "Am I running toward something or away from something?" |
| 15 | Gut Check / Body Scan | "Sit with each option for 60 seconds. What does your body tell you?" |

User taps one → LiLa walks them through it conversationally.

**Framework switching:**
- At any point, user can say "This isn't working — let me try a different approach" or tap a [Switch Framework] button
- New framework inherits full conversation context (same as Perspective Shifter lens switching)
- Visual divider in conversation: "── Switching to: Essentialism Filter ──"

**Coin flip insight (LiLa interjection):**
When LiLa detects extended indecision (3+ turns of going back and forth without progress), she offers:
> "Before we go further — if I flipped a coin right now and it landed on going back to work, what's your gut reaction? Relief or dread? That reaction is data worth paying attention to."

**Values alignment integration:**
- For any framework, LiLa can pull the user's Guiding Stars and Best Intentions to check alignment
- "You have a Guiding Star about [being present for your kids' childhood]. How does each option sit with that?"
- This is not a separate framework — it's a check that LiLa can weave into any framework conversation

**Interactions:**
- Standard LiLa conversation modal with guided framework overlay
- Action chips: Save Decision, Route to BigPlans, Save to Notepad, Share with [person]
- Framework list persists as a reference — user can revisit it anytime

### Screen 7: Mediator — Main Conversation

> **Depends on:** Supersedes `relationship_mediation` guided mode from PRD-19.

**What the user sees:**

```
┌──────────────────────────────────────────────────────────┐
│  Mediator                                        [×]     │
│  ──────────────────────────────────────────────────────  │
│  Context: [Solo — just me processing]  ▾                 │
│  ──────────────────────────────────────────────────────  │
│                                                          │
│  You:                                                    │
│  My 14-year-old slammed the door and said I never listen │
│  to him. We were arguing about screen time limits.       │
│                                                          │
│  LiLa:                                                   │
│  That sounds really frustrating — both the door and      │
│  the words. Those hit hard, especially when you're       │
│  trying to protect him.                                  │
│                                                          │
│  Before we look at what to do, let me ask: when he       │
│  said "you never listen to me," what did that feel       │
│  like? Not what you thought — what you felt.             │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

**Context selector (top):**
A dropdown that sets the conflict type, which adjusts LiLa's system prompt:

| Context | What Changes |
|---------|-------------|
| Solo — just me processing | LiLa helps the user work through the conflict alone. No assumption the other person will see this. Focus on clarity, self-reflection, preparation. |
| Me and my spouse/partner | Loads partner context (InnerWorkings, Archives, "How to Reach Me" card). Person pill selector for the partner. Marriage-specific frameworks (NVC, 80/80 equity, repair). |
| Me and my child | Person pill selector for the child. Age-appropriate guidance. Loads child's developmental stage, personality, relationship notes. |
| Me and a teen | Teen-specific communication strategies. Loads teen's InnerWorkings if shared. Respects teen dignity and capability. |
| Between my children | Sibling mediation mode. Two-person selector. Loads both kids' context. Fairness-aware guidance. |
| Workplace / non-family | No platform context loaded. General conflict resolution frameworks. NVC, boundary setting, self-deception awareness. |
| Man vs. Self | Internal conflict. Uses IFS-informed approach — which parts of you are in tension? What does each part need? |
| Full Picture (Mom only) | PRD-19's relationship_mediation mode. Loads ALL relationship notes from ALL authors for the selected pair. LiLa synthesizes without revealing sources. |

> **Decision rationale:** The context selector replaces the need for multiple guided modes. One mode key (`mediator`), multiple conversation contexts. LiLa's system prompt adjusts based on selection. "Man vs. Self" is a natural extension — internal conflicts are real conflicts. "Full Picture" preserves PRD-19's powerful mediation capability within the Mediator tool.

**Conversational arc (all contexts follow this pattern):**
1. **Validate first** — acknowledge feelings as real and legitimate
2. **Invite curiosity** — ask what THEY think might be happening
3. **Offer a gentle reframe** — only if natural, only as a possibility
4. **Empower with ownership** — move to action and agency

**NVC structure available in all contexts:**
LiLa can guide the user through: Observation (what happened, without judgment) → Feeling (what you felt) → Need (what you needed that wasn't met) → Request (what you'd like going forward). This is a conversational guide, not a rigid form.

**Age-specific scripts:**
When the conflict involves a child (any age), LiLa draws from the condensed intelligence to suggest actual language:
- **Young child (Guided shell age):** "When [child] says [behavior], they may be communicating [need]. You might try: '[script]'"
- **Teen:** "At [teen]'s age, [developmental context]. Rather than [common mistake], try: '[script]'"
- **Between siblings:** "When siblings fight about fairness, the underlying issue is usually [pattern]. One approach: [script]"

**Safety exception (inherited from PRD-19):**
If the conversation reveals language suggesting unhealthy or unsafe dynamics — fear, physical harm, coercive control, isolation, threats — LiLa does NOT invite curiosity about the other person's perspective. Instead: paint a picture of what healthy looks like, acknowledge the gap without labeling, guide toward safe humans and real support. For immediate danger: Tier 3 crisis resources per PRD-05. Suggest Safe Harbor (PRD-20) for ongoing processing.

### Screen 8: Translator — Main Interface

```
┌──────────────────────────────────────────────────────────┐
│  Translator                                      [×]     │
│  ──────────────────────────────────────────────────────  │
│                                                          │
│  Paste or type your text:                                │
│  ┌────────────────────────────────────────────────────┐  │
│  │ I need you to clean your room before dinner or     │  │
│  │ you're going to lose screen time tonight.          │  │
│  └────────────────────────────────────────────────────┘  │
│                                                          │
│  Rewrite as:                                             │
│  [🏴‍☠️ Pirate] [🏰 Medieval] [📱 Gen Z] [👔 Formal]       │
│  [🧸 For a 5yo] [🤝 Softer tone] [🎭 Shakespeare]        │
│  [🤠 Southern] [🇬🇧 British] [📢 Sports announcer]       │
│  [🧚 Fairy tale] [💪 Motivational] [✍️ Custom...]        │
│                                                          │
│  ──────────────────────────────────────────────────────  │
│  Result:                                                 │
│  ┌────────────────────────────────────────────────────┐  │
│  │ 🏴‍☠️ Arrr, ye scallywag! Swab yer quarters afore    │  │
│  │ the evenin' grub be served, or ye'll be walkin'    │  │
│  │ the plank to no-screen-island, savvy?              │  │
│  └────────────────────────────────────────────────────┘  │
│                                                          │
│  [Copy] [Try another tone] [Edit input]                  │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

**Preset tones (12):**
Pirate, Medieval, Gen Z, Formal/Business, Explain to a 5-year-old, Soften the tone, Shakespeare, Southern, British, Sports announcer, Fairy tale narrator, Motivational speaker

**Custom tone:**
Tapping [✍️ Custom...] opens a text field: "Rewrite as: ___________"
User can type anything: "my passive-aggressive aunt," "a nature documentary narrator," "Yoda," etc.

**Interactions:**
- User enters text, taps a tone → Haiku generates the rewrite instantly
- [Copy] → clipboard
- [Try another tone] → keeps the input, lets user pick a different tone
- [Edit input] → returns cursor to the input box
- Multiple rewrites can stack — user can try several tones on the same input and compare

> **Decision rationale:** The Translator is the only tool that's NOT a conversation. It's a single-turn transform: input text → select tone → output rewrite. No back-and-forth needed. This makes it faster, cheaper (one Haiku call), and more fun as a toy. If someone wants to have a conversation about communication styles, that's the Perspective Shifter or Mediator.

---

## Visibility & Permissions

### Shell Behavior

| Shell | Access | How |
|-------|--------|-----|
| Mom | All 5 tools available via Vault browse and personal AI Toolbox | Direct access — no gating beyond subscription tier |
| Dad / Additional Adult | Tools mom has granted via `lila_tool_permissions` | Conversation modals only. No Vault browse unless mom has granted Vault access. Tools appear in AI Toolbox sidebar if assigned. |
| Independent (Teen) | Tools mom has granted | Same modal pattern as Dad. Tools appear in AI Toolbox sidebar. Age-appropriate system prompt adjustments on all tools. |
| Guided | Decision Guide, Mediator, and Translator if mom has granted | Simplified launch from AI Toolbox or bottom nav. Conversations visible to mom by default. Simplified framework lists. Age-appropriate language throughout. |
| Play | No ThoughtSift access | No LiLa access of any kind per PRD-04. |
| Special Adult | No ThoughtSift access | No LiLa access per PRD-04. |

### Tier Gating

```
Feature: Board of Directors
                    Essential  Enhanced  Full Magic  Creator
Mom:                   ○          ○          ●          ●
Dad/Adults:            ○          ○          ●          ●
Special Adults:        ○          ○          ○          ○   ← Never
Independent Teens:     ○          ○          ●          ●
Guided Kids:           ○          ○          ○          ○   ← Never
Play Kids:             ○          ○          ○          ○   ← Never

Feature: Perspective Shifter
                    Essential  Enhanced  Full Magic  Creator
Mom:                   ○          ○          ●          ●
Dad/Adults:            ○          ○          ●          ●
Special Adults:        ○          ○          ○          ○   ← Never
Independent Teens:     ○          ○          ●          ●
Guided Kids:           ○          ○          ○          ○   ← Never
Play Kids:             ○          ○          ○          ○   ← Never

Feature: Decision Guide
                    Essential  Enhanced  Full Magic  Creator
Mom:                   ○          ●          ●          ●
Dad/Adults:            ○          ●          ●          ●
Special Adults:        ○          ○          ○          ○   ← Never
Independent Teens:     ○          ●          ●          ●
Guided Kids:           ○          ○          ●          ●
Play Kids:             ○          ○          ○          ○   ← Never

Feature: Mediator
                    Essential  Enhanced  Full Magic  Creator
Mom:                   ○          ●          ●          ●
Dad/Adults:            ○          ●          ●          ●
Special Adults:        ○          ○          ○          ○   ← Never
Independent Teens:     ○          ●          ●          ●
Guided Kids:           ○          ○          ●          ●
Play Kids:             ○          ○          ○          ○   ← Never

Feature: Translator
                    Essential  Enhanced  Full Magic  Creator
Mom:                   ○          ●          ●          ●
Dad/Adults:            ○          ●          ●          ●
Special Adults:        ○          ○          ○          ○   ← Never
Independent Teens:     ○          ●          ●          ●
Guided Kids:           ○          ●          ●          ●
Play Kids:             ○          ○          ○          ○   ← Never
```

> **Tier rationale:** Board of Directors and Perspective Shifter are Full Magic only — they're the most AI-intensive (BoD runs multiple Sonnet calls per turn) and the most sophisticated tools. They're "wow" differentiators that pull users to Full Magic. Decision Guide, Mediator, and Translator are deeply practical tools available at Enhanced — gating "help me make this decision" behind Full Magic would feel punitive. Translator uses Haiku and is the lightest tool. Guided Kids get Decision Guide and Mediator at Full Magic (age-appropriate simplified versions) and Translator at Enhanced (it's just fun).

---

## AI Integration

### Guided Mode Registrations

| Field | Board of Directors | Perspective Shifter | Decision Guide | Mediator | Translator |
|-------|-------------------|--------------------|--------------------|----------|------------|
| `mode_key` | `board_of_directors` | `perspective_shifter` | `decision_guide` | `mediator` | `translator` |
| `display_name` | Board of Directors | Perspective Shifter | Decision Guide | Mediator | Translator |
| `parent_mode` | `inner_wisdom` | `inner_wisdom` | `inner_wisdom` | `inner_wisdom` | `inner_wisdom` |
| `avatar_key` | `sitting` | `sitting` | `sitting` | `sitting` | `sitting` |
| `model_tier` | `sonnet` | `sonnet` | `sonnet` | `sonnet` | `haiku` |
| `context_sources` | `['guiding_stars', 'best_intentions', 'self_knowledge']` | `['self_knowledge', 'archive_context', 'relationship_notes', 'guiding_stars', 'best_intentions']` | `['guiding_stars', 'best_intentions', 'self_knowledge']` | `['self_knowledge', 'archive_context', 'relationship_notes', 'how_to_reach_me']` | `[]` (no context needed) |
| `person_selector` | `false` | `true` (for family-context lenses) | `false` | `true` (for conflict involving specific people) | `false` |
| `opening_messages` | 3+ rotating variants (see below) | 3+ rotating variants | 3+ rotating variants | 3+ rotating variants | N/A (not conversational) |
| `available_to_roles` | `['mom', 'additional_adult', 'independent']` | `['mom', 'additional_adult', 'independent']` | `['mom', 'additional_adult', 'independent', 'guided']` | `['mom', 'additional_adult', 'independent', 'guided']` | `['mom', 'additional_adult', 'independent', 'guided']` |
| `requires_feature_key` | `thoughtsift_board_of_directors` | `thoughtsift_perspective_shifter` | `thoughtsift_decision_guide` | `thoughtsift_mediator` | `thoughtsift_translator` |

### Opening Messages (Rotating Variants)

**Board of Directors:**
- "Who do you want thinking about this with you? Describe your situation, and I'll help you assemble the right table."
- "Welcome to your board. Tell me what's on your mind, and we'll figure out who should be in the room."
- "Every big decision deserves more than one perspective. What are we working through?"

**Perspective Shifter:**
- "Tell me what's on your mind, and then we'll look at it from different angles. You might be surprised what shifts."
- "Same situation, different glasses. Describe what's happening, and pick a lens — or let me suggest one."
- "What's the thing you can't quite see clearly? Let's turn it a few degrees."

**Decision Guide:**
- "What's the decision? I've got 15 different ways to think through it — or you can just tell me and I'll pick the right one."
- "Stuck between options? Let's figure out what's actually making this hard."
- "Big decision or small one? Either way, let's make sure you're thinking about it the right way."

**Mediator:**
- "Tell me what happened. I'm here to help you figure this out, not to judge anyone."
- "Conflict is information — it's telling you something. Let's figure out what."
- "Whether you're processing this on your own or getting ready for a conversation, let's start with what happened."

### System Prompt Behavioral Rules (All 5 Tools)

**Universal rules (all ThoughtSift tools):**
- Follow the validate → invite curiosity → gentle reframe → empower with ownership conversational arc
- Never give directives — present possibilities, preserve autonomy
- Never label relationships as abusive/toxic based on one side of the story — paint healthy pictures, acknowledge gaps
- Avoid "why" questions (trigger defensiveness) — use "what" questions instead
- If detecting crisis indicators (self-harm language, immediate danger, abuse), pause all frameworks and follow PRD-05 Tier 3 crisis protocol
- Reference Guiding Stars and Best Intentions when naturally relevant, never mechanically
- Faith-aware: reference faith context when entries exist AND topic connects naturally. Never force.
- Synthesized wisdom: LiLa applies universal principles from the condensed intelligence library. Never cites a single book source. If asked where an insight comes from: "This shows up across several books" + titles as further reading.

**Board of Directors specific:**
- Each advisor responds in character — their communication style, reasoning patterns, characteristic language
- Advisors can explicitly disagree with each other
- LiLa (as moderator) can interject to summarize, highlight disagreements, or suggest the user respond to a specific advisor
- If a BoardShelf-extracted book exists for a persona's author, enrich the persona with extracted frameworks and communication patterns
- Persona disclaimer shows once per session for non-personal personas
- 3 advisors default, 5 max

**Perspective Shifter specific:**
- Each lens response should include: the framework's core reframe (1-2 sentences), a probing question that applies the framework to the user's specific situation, and an invitation to explore further or switch lenses
- Family-context lenses must NEVER reveal private context items — LiLa synthesizes, never quotes
- When switching lenses, explicitly acknowledge what the previous lens revealed before applying the new one

**Decision Guide specific:**
- When suggesting a framework, explain WHY this framework fits this decision type (one sentence)
- Walk through frameworks conversationally — not as a form, not as a checklist
- The coin flip insight can be offered during any framework, not just at the start
- Values alignment check can be woven into any framework when Guiding Stars/Best Intentions exist
- After reaching a conclusion, offer to capture the decision and any action steps

**Mediator specific:**
- Adjust language and frameworks based on the conflict context (spouse vs. child vs. coworker vs. self)
- For child conflicts: always consider developmental stage. What looks like defiance in a 5-year-old is often inability, not unwillingness.
- For teen conflicts: talk UP. Respect their intelligence and agency. Never condescend.
- For Full Picture mode: follow the exact system prompt from PRD-19's relationship_mediation section
- Offer specific language scripts when appropriate: "You might try saying: '...'"
- Always end mediator sessions with an empowerment question: "How do you want to show up when you re-engage?"

**Translator specific:**
- Single-turn transform — no conversation needed
- Match the requested tone/register as faithfully as possible
- For "soften the tone" — preserve the meaning while reducing sharpness
- For "explain to a child" — use concrete examples, short sentences, no abstractions
- For fun tones (pirate, medieval, etc.) — commit fully to the bit. Be entertaining.

### AI Cost Estimates

| Tool | Model | Calls per Turn | Est. Cost per Session |
|------|-------|---------------|----------------------|
| Board of Directors | Sonnet | 3-5 per user message (one per advisor) | $0.03-$0.10 |
| Perspective Shifter | Sonnet | 1 per user message | $0.01-$0.02 |
| Decision Guide | Sonnet | 1 per user message | $0.01-$0.02 |
| Mediator | Sonnet | 1 per user message | $0.01-$0.02 |
| Translator | Haiku | 1 per rewrite | <$0.001 |
| Persona Generation | Sonnet | 1 per new persona | $0.02-$0.03 (amortized across all future users) |

Board of Directors is the most expensive tool. A 5-advisor, 10-turn conversation = ~50 Sonnet calls = ~$0.50. The 3-advisor default and 5-max limit are cost guardrails. Persona caching (P8 pattern) ensures generation costs are one-time.

---

## Data Schema

### Table: `board_personas`

Lives in `platform_intelligence` schema (for system + community tiers) and `public` schema (for personal customs).

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NOT NULL | PK |
| persona_name | TEXT | | NOT NULL | Display name |
| persona_type | TEXT | | NOT NULL | CHECK: 'system_preloaded', 'community_generated', 'personal_custom' |
| personality_profile | JSONB | | NOT NULL | Traits, philosophies, communication style, reasoning patterns, characteristic language |
| source_references | TEXT[] | '{}' | NOT NULL | Verifiable writings/speeches used to build the persona |
| bookshelf_enriched | BOOLEAN | false | NOT NULL | Whether BookShelf extracted content was used to build this persona |
| category | TEXT | null | NULL | 'historical', 'literary', 'faith_leader', 'thinker', 'business', 'parenting', 'custom' |
| icon_emoji | TEXT | null | NULL | Small emoji identifier for conversation attribution |
| content_policy_status | TEXT | 'approved' | NOT NULL | CHECK: 'approved', 'pending_review', 'blocked' |
| is_public | BOOLEAN | false | NOT NULL | Whether this persona is available to all users |
| created_by | UUID | null | NULL | FK → family_members. NULL for system preloaded. |
| family_id | UUID | null | NULL | FK → families. Only set for personal_custom. |
| usage_count | INTEGER | 0 | NOT NULL | How many times this persona has been used (platform-wide for public, per-user for custom) |
| embedding | vector(768) | null | NULL | halfvec for semantic search when browsing/searching personas |
| created_at | TIMESTAMPTZ | now() | NOT NULL | |
| updated_at | TIMESTAMPTZ | now() | NOT NULL | Auto-trigger |

**RLS Policy:**
- System preloaded and approved community personas: readable by all authenticated users
- Personal custom: readable only by creator (`created_by = current_user`) and family primary parent
- Write: system preloaded = admin only; community_generated = admin for approval; personal_custom = creator only
- Personal custom personas NEVER enter the platform intelligence pipeline

**Indexes:**
- `persona_name` (text search)
- `persona_type, is_public, content_policy_status` (filtered browse)
- `created_by` (my personas)
- `embedding` HNSW (semantic search)

### Table: `board_sessions`

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NOT NULL | PK |
| conversation_id | UUID | | NOT NULL | FK → lila_conversations |
| family_id | UUID | | NOT NULL | FK → families |
| member_id | UUID | | NOT NULL | FK → family_members |
| created_at | TIMESTAMPTZ | now() | NOT NULL | |

**RLS Policy:** Inherits from parent conversation's RLS.

### Table: `board_session_personas`

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NOT NULL | PK |
| board_session_id | UUID | | NOT NULL | FK → board_sessions |
| persona_id | UUID | | NOT NULL | FK → board_personas |
| seat_order | INTEGER | | NOT NULL | Order on the board (1-5) |
| is_prayer_seat | BOOLEAN | false | NOT NULL | Whether this is a Prayer Seat (no AI responses, reflection questions only) |
| seated_at | TIMESTAMPTZ | now() | NOT NULL | |
| removed_at | TIMESTAMPTZ | null | NULL | NULL if still active |

**RLS Policy:** Inherits from parent board_session's RLS.

### Table: `persona_favorites`

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NOT NULL | PK |
| member_id | UUID | | NOT NULL | FK → family_members |
| persona_id | UUID | | NOT NULL | FK → board_personas |
| created_at | TIMESTAMPTZ | now() | NOT NULL | |

**RLS Policy:** Member can CRUD their own favorites.
**Unique constraint:** `(member_id, persona_id)`

### Table: `perspective_lenses`

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NOT NULL | PK |
| lens_key | TEXT | | NOT NULL | UNIQUE. Identifier (e.g., 'ifs_parts', 'empowerment_dynamic', 'custom_123') |
| display_name | TEXT | | NOT NULL | User-facing name |
| description | TEXT | | NOT NULL | One-line description shown in lens selector |
| lens_type | TEXT | | NOT NULL | CHECK: 'simple_shift', 'named_framework', 'family_context', 'custom' |
| system_prompt_addition | TEXT | | NOT NULL | Framework-specific instructions appended to the Perspective Shifter system prompt when this lens is active |
| icon_emoji | TEXT | null | NULL | Small emoji for the lens chip |
| is_system | BOOLEAN | false | NOT NULL | True for platform-provided lenses |
| is_public | BOOLEAN | false | NOT NULL | True for community-approved lenses |
| created_by | UUID | null | NULL | FK → family_members. NULL for system lenses. |
| sort_order | INTEGER | 0 | NOT NULL | Display order in the lens selector |
| is_active | BOOLEAN | true | NOT NULL | |
| created_at | TIMESTAMPTZ | now() | NOT NULL | |

**RLS Policy:** System and public lenses readable by all authenticated users. Custom lenses readable by creator only.

### Table: `decision_frameworks`

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NOT NULL | PK |
| framework_key | TEXT | | NOT NULL | UNIQUE. Identifier (e.g., 'weighted_matrix', 'best_friend_test') |
| display_name | TEXT | | NOT NULL | User-facing name |
| description | TEXT | | NOT NULL | One-line description shown in framework selector |
| best_for | TEXT | | NOT NULL | One-line "best for" hint (e.g., "Big decisions with multiple options") |
| system_prompt_addition | TEXT | | NOT NULL | Framework-specific instructions appended to Decision Guide system prompt |
| sort_order | INTEGER | 0 | NOT NULL | Display order in the framework list |
| is_active | BOOLEAN | true | NOT NULL | |
| created_at | TIMESTAMPTZ | now() | NOT NULL | |

**RLS Policy:** Read-only for all authenticated users. Write access admin-only.
**Seed data:** 15 frameworks as defined in the Decision Guide section above.

### Enum/Type Updates

New feature keys for `feature_access`:
- `thoughtsift_board_of_directors`
- `thoughtsift_perspective_shifter`
- `thoughtsift_decision_guide`
- `thoughtsift_mediator`
- `thoughtsift_translator`

### Metadata on `lila_messages`

Board of Directors advisor responses use the existing `metadata` JSONB column on `lila_messages`:
```json
{
  "persona_id": "uuid",
  "persona_name": "Benjamin Franklin",
  "is_prayer_seat_reflection": false
}
```

Perspective Shifter lens switches are tracked:
```json
{
  "active_lens": "ifs_parts",
  "lens_display_name": "IFS Parts Check-In"
}
```

Decision Guide framework tracking:
```json
{
  "active_framework": "weighted_matrix",
  "framework_display_name": "Weighted Criteria Matrix"
}
```

Mediator context tracking:
```json
{
  "mediation_context": "parent_child",
  "person_ids": ["uuid1"]
}
```

---

## Edge Cases

- **User tries to seat more than 5 advisors:** Soft limit enforced. LiLa: "Five voices is plenty — more than that and the table gets noisy. Want to swap someone out?"
- **User addresses a specific advisor by name:** LiLa routes the next response to that advisor only, not the full panel. Other advisors stay silent unless the user re-addresses the group.
- **Persona generation for ambiguous names:** If the name could be multiple people (e.g., "John Adams"), LiLa asks: "There are a few John Adams in history — which one? President John Adams, his son John Quincy Adams, or someone else?"
- **Family-context lens with no data:** If a family member has no InnerWorkings or Archives data, LiLa says: "I don't have much context about [Name] yet. I can offer a general perspective based on their age and what you've told me in this conversation, or you can add more context about them in Archives."
- **Safety flag during BoD conversation:** If a board advisor's response would normally trigger a safety flag (e.g., advisor discusses a sensitive topic in character), the safety pipeline evaluates the full conversation context, not just the individual message. A historical figure discussing war in character is not a safety violation.
- **Personal custom persona with same name as public figure:** The persona is created as personal_custom regardless. It uses the user's description, not public knowledge. No confusion with the community library version.
- **User requests blocked figure:** "I'm not able to create a persona for [name]. Some figures are not appropriate for our advisory panels. Is there someone else you'd like at your table?"
- **Translator with empty input:** Disabled state on tone buttons until input has content.
- **Translator with very long input:** Haiku handles up to ~4000 tokens of input. For longer text, LiLa suggests breaking it into sections.
- **Decision Guide coin flip insight declined:** User says "No thanks" — LiLa drops it and continues with the framework. Never pushes.
- **Mediator detects both parties in crisis:** Pause frameworks, provide resources, suggest professional help. Never play therapist.

---

## Stubs

### Created by This PRD

| Stub | What It Stubs | Resolution |
|------|--------------|------------|
| Community persona moderation queue | Admin review UI for community-generated personas | PRD-32 (Admin Console) — add ThoughtSift moderation tab |
| Community lens moderation queue | Admin review UI for community-generated lenses | PRD-32 (Admin Console) |
| Persona library browse page | Full browsable grid of all platform personas with categories | Post-MVP enhancement — simple search + recent + favorites sufficient for MVP |
| LiLa proactive tool suggestion | LiLa detects a decision/conflict/perspective need in general chat and suggests a ThoughtSift tool | Post-MVP — requires smart routing pattern |
| Translator language support | Non-English source text translation | Post-MVP |
| Board of Directors: Export board session | Export the full board conversation as a shareable document | Post-MVP |

### Prior Stubs Wired by This PRD

| Stub | Created By | How It's Wired |
|------|-----------|----------------|
| ThoughtSift guided modes | PRD-05 (Post-MVP list) | 5 guided modes registered with full specs |
| `relationship_mediation` guided mode | PRD-19 | Superseded by `mediator` mode with "Full Picture" context option. All PRD-19 system prompt rules and privacy boundaries preserved within the Mediator tool. |
| Board of Directors persona library | Platform Intelligence Pipeline v2, Channel D | Persona schema defined, three-tier library operational, content policy enforced |
| Library Vault guided mode tools (Mediator, Decision Guide, Fun Translator) | PRD-05 (Post-MVP list) | Fully specified as ThoughtSift tools |

---

## Vault Listing Details

Each tool is a separate `vault_items` record with `content_type = 'ai_tool'` and `delivery_method = 'native'`:

| Vault Item | Category | Thumbnail Needed | Description |
|-----------|----------|-----------------|-------------|
| Board of Directors | ThoughtSift / Thinking Tools | Yes — visual of diverse figures at a table | Assemble a panel of advisors who each give you their perspective. Historical figures, literary characters, or people personal to you. |
| Perspective Shifter | ThoughtSift / Thinking Tools | Yes — visual of looking through different colored lenses or prisms | See your situation through different psychological and philosophical frameworks. Switch lenses mid-conversation. |
| Decision Guide | ThoughtSift / Thinking Tools | Yes — visual of a crossroads or forking path | 15 structured decision frameworks to help you think clearly. LiLa matches the right approach to your decision type. |
| Mediator | ThoughtSift / Thinking Tools | Yes — visual of two figures with a bridge or connection between them | Work through any conflict — marriage, parenting, work, friendships, or internal. Solo processing or guided resolution. |
| Translator | ThoughtSift / Thinking Tools | Yes — visual of playful speech bubbles in different styles | Rewrite any text in pirate, medieval, Gen Z, Shakespeare, or 8 other fun tones. Also practical: soften, formalize, or simplify. |

> **Forward note:** The 5 thumbnail images will be specified in the pre-build visual asset audit. Each needs a style-consistent illustration that matches the MyAIM brand board (teal/gold palette, warm, inviting, non-generic).

---

## What "Done" Looks Like

### MVP (Must Have)
- [ ] 5 guided modes registered in `lila_guided_modes` with full specs
- [ ] Board of Directors: conversation modal with group-chat-style attributed responses, 3-5 advisor limit
- [ ] Board of Directors: persona selector with search, favorites, recently used, and suggested
- [ ] Board of Directors: custom persona creation with one-question follow-up
- [ ] Board of Directors: content policy gate (deity → Prayer Seat, evil figures → block)
- [ ] Board of Directors: Prayer Seat generation with reflection questions
- [ ] Board of Directors: persona disclaimer on first non-personal advisor response
- [ ] Board of Directors: starter pack of system-preloaded personas seeded
- [ ] Perspective Shifter: conversation modal with lens chip selector
- [ ] Perspective Shifter: all Simple Angle Shifts and Named Framework Lenses functional
- [ ] Perspective Shifter: lens switching with visual divider and context preservation
- [ ] Perspective Shifter: family-context lenses pulling real InnerWorkings + Archives data
- [ ] Perspective Shifter: person pill selector for family-context lenses
- [ ] Decision Guide: conversation modal with framework suggestion and pick-your-own list
- [ ] Decision Guide: all 15 frameworks functional with conversational walkthroughs
- [ ] Decision Guide: framework switching with context preservation
- [ ] Decision Guide: coin flip insight interjection when indecision detected
- [ ] Decision Guide: values alignment check against Guiding Stars / Best Intentions
- [ ] Mediator: conversation modal with conflict context selector
- [ ] Mediator: all 8 context modes functional (solo, spouse, child, teen, siblings, workplace, man vs self, full picture)
- [ ] Mediator: Full Picture mode preserves all PRD-19 privacy rules
- [ ] Mediator: safety exception for abuse/harm detection
- [ ] Mediator: validate → curiosity → reframe → empower conversational arc
- [ ] Translator: single-turn rewrite interface (not conversational)
- [ ] Translator: 12 preset tones + custom text field
- [ ] Translator: Haiku model (all others Sonnet)
- [ ] All 5 tools listed as separate items in AI Vault
- [ ] All 5 tools assignable to family members via "+Add to AI Toolbox"
- [ ] All tools pass through PRD-30 safety monitoring pipeline
- [ ] RLS policies enforce member-scoped conversation access
- [ ] `board_personas`, `board_sessions`, `board_session_personas`, `persona_favorites`, `perspective_lenses`, `decision_frameworks` tables created and seeded
- [ ] Feature keys registered for tier gating

### MVP When Dependency Is Ready
- [ ] BookShelf-extracted content enriches BoD personas when books by that author are in the platform library
- [ ] Community persona moderation queue in Admin Console (PRD-32)
- [ ] Community lens moderation queue in Admin Console (PRD-32)

### Post-MVP
- [ ] Full persona library browse page with categories and filtering
- [ ] LiLa proactive ThoughtSift tool suggestions from general chat
- [ ] Board of Directors session export
- [ ] Translator non-English language support
- [ ] Custom lens sharing to community library
- [ ] Decision Guide: user-created custom frameworks
- [ ] Guided-shell simplified versions of Decision Guide and Mediator

---

## CLAUDE.md Additions from This PRD

- [ ] ThoughtSift = 5 separate tools, NOT one tool with sub-modes. Each has its own guided mode key, system prompt, model tier, and Vault listing.
- [ ] Board of Directors: group-chat-style conversation with attributed advisor responses. 3 default, 5 max. Each advisor = one Sonnet call per turn.
- [ ] Board of Directors persona library: three-tier (system preloaded, community generated, personal custom). Personal custom NEVER enters platform intelligence pipeline. Content policy: deity → Prayer Seat, evil figures → blocked, contemporary public figures → allowed with disclaimer.
- [ ] Persona disclaimer: shown once per session for non-personal personas. "AI interpretation... not endorsed... read their actual work."
- [ ] Perspective Shifter: lens chips above conversation input. Switching preserves context. Family-context lenses pull InnerWorkings + Archives data via person pill selector.
- [ ] Decision Guide: 15 named frameworks in `decision_frameworks` table. LiLa suggests based on decision type or user picks from list. Coin flip insight = LiLa interjection during indecision, not a standalone framework.
- [ ] Mediator supersedes PRD-19's `relationship_mediation`. One mode key (`mediator`), 8 context modes via dropdown. Full Picture mode preserves all PRD-19 privacy rules.
- [ ] Translator: Haiku model, NOT Sonnet. Single-turn transform, not conversational. 12 presets + custom text field.
- [ ] All ThoughtSift conversations pass through PRD-30 safety monitoring pipeline. No new safety infrastructure needed.
- [ ] ThoughtSift tools live in AI Vault as 5 separate items. No default family member assignments. Mom assigns via "+Add to AI Toolbox."

---

## DATABASE_SCHEMA.md Additions

Tables defined: `board_personas`, `board_sessions`, `board_session_personas`, `persona_favorites`, `perspective_lenses`, `decision_frameworks`
Feature keys added: `thoughtsift_board_of_directors`, `thoughtsift_perspective_shifter`, `thoughtsift_decision_guide`, `thoughtsift_mediator`, `thoughtsift_translator`
Metadata conventions: persona attribution on `lila_messages.metadata`, lens tracking, framework tracking, mediation context tracking

---

## Decisions Made This Session

### Decided

| # | Decision | Rationale |
|---|----------|-----------|
| 1 | **5 separate guided mode keys, not one ThoughtSift mode** | Each tool has distinct system prompts, model tiers, context sources, and person selector behavior. One mode with sub-routing adds complexity without benefit. |
| 2 | **Haiku for Translator, Sonnet for other 4** | Translator is a straightforward text transformation. Sonnet's reasoning depth is wasted on rewriting text in pirate speak. |
| 3 | **3 default advisors, 5 max on Board of Directors** | Enough voices for tension, few enough for clarity. Cost scales linearly with advisor count. |
| 4 | **Sequential advisor responses in a thread, not simultaneous panel** | Group-chat pattern is familiar, easier to build, and allows advisors to explicitly respond to each other. |
| 5 | **Lens chips above conversation input for Perspective Shifter** | Keeps lens switching fast and visible. Users see their options without an extra tap. |
| 6 | **Persona disclaimer (not name alteration) for contemporary figures** | Honest, legally cleaner, consistent with platform transparency values. Disclaimer shows once per session. |
| 7 | **15 decision frameworks (dropped Enough Test)** | Full library covers all user avatar decision types. Users can browse the full list or let LiLa suggest. |
| 8 | **Coin flip insight is a LiLa interjection, not a standalone framework** | It's a moment of insight that can appear within any framework conversation, not its own methodology. |
| 9 | **Mediator supersedes PRD-19's relationship_mediation mode** | One tool handles all conflict types via context selector. No need for two overlapping modes. Full Picture mode preserves all PRD-19 privacy rules. |
| 10 | **Translator is single-turn transform, not conversational** | Faster, cheaper (one Haiku call), more fun as a toy. If someone wants conversation about communication, use Perspective Shifter or Mediator. |
| 11 | **5 separate Vault listings (not 1 collection)** | Looks better stocked. Allows individual tool assignment to family members. |
| 12 | **BoD personas use real names with disclaimer, not altered names** | "Dave AImsay" risks drawing more legal attention than honest use. Disclaimer is transparent and on-brand. |
| 13 | **Simple persona creation for personal people (name + description + one follow-up)** | Deep character building is a Creator tier teaching opportunity via AI Vault tutorials, not a BoD feature. |
| 14 | **On-demand persona generation with three-tier caching** | User requests "Malala" → Sonnet generates → user gets it immediately → queued for moderation → available to all future users. One-time cost per persona. |
| 15 | **Custom lenses follow same three-tier pattern as personas** | Platform-provided, community-generated, personal custom. Consistent architecture across both tools. |
| 16 | **All ThoughtSift tools start parked in Vault, no default assignments** | Mom controls who gets what. No assumptions about family member readiness. |
| 17 | **8 Mediator context modes via dropdown selector** | Covers solo processing, all family relationship types, workplace, internal conflict, and Full Picture mode. One mode key, adaptive system prompts. |
| 18 | **Board of Directors: historical/literary starter pack, no contemporary figures suggested** | Starter pack uses only public domain historical figures and literary characters. Contemporary figures grow organically as users request them. |
| 19 | **If BookShelf has a book by a board persona's real-world author, the persona is enriched with extracted content** | Makes persona responses noticeably more faithful. Quiet competitive advantage that improves over time. |

### Deferred

| # | What's Deferred | Resolution Path |
|---|----------------|----------------|
| 1 | Full persona library browse page with categories/filtering | Post-MVP enhancement. Search + favorites + recently used sufficient for MVP. |
| 2 | Community persona and lens moderation queues | PRD-32 (Admin Console) — add ThoughtSift moderation tabs |
| 3 | LiLa proactive ThoughtSift tool suggestions | Post-MVP. Requires smart routing pattern in general chat. |
| 4 | Board of Directors session export | Post-MVP. |
| 5 | Translator non-English language support | Post-MVP. |
| 6 | Guided-shell simplified tool versions | Post-MVP. Full versions for Mom/Dad/Teen first. Simplified Guided versions designed after real usage testing. |
| 7 | Visual asset specifications for 5 Vault thumbnails | Pre-build visual asset audit pass. |
| 8 | Tier split finalization | PRD-31 (Subscription Tier System). Current tier assignments are design intent; final splits after real usage testing. |
| 9 | Creator tier: deep character builder for book authors | AI Vault tutorial. Not a BoD feature. |

### Cross-PRD Impact

| PRD Affected | What Changed | Action Needed |
|-------------|-------------|---------------|
| PRD-05 (LiLa Core) | 5 new guided modes registered. `thoughtsift` single mode in existing registry replaced by 5 individual mode keys. | Update guided mode registry table with 5 new rows. Remove single `thoughtsift` placeholder row. |
| PRD-19 (Family Context) | `relationship_mediation` guided mode superseded by `mediator`. All system prompt rules, privacy boundaries, and Full Picture behavior preserved within the Mediator tool. | Mark `relationship_mediation` mode as superseded by PRD-34. Note that the feature_key `archives_relationship_mediation` maps to the Mediator's Full Picture context. |
| PRD-21 (Communication Tools) | AI Toolbox gains 5 new assignable tools. Same `lila_tool_permissions` pattern. | No schema changes needed. Note 5 new tool registrations. |
| PRD-21A (AI Vault) | 5 new `vault_items` records needed with `content_type = 'ai_tool'`, `delivery_method = 'native'`. New "ThoughtSift / Thinking Tools" category. | Add category and 5 vault items to seed data. |
| PRD-30 (Safety Monitoring) | All ThoughtSift conversations pass through existing safety pipeline. BoD adds persona creation content gate. No new tables needed. | Note ThoughtSift as an additional conversation source for safety scanning. |
| PRD-32 (Admin Console) | Community persona moderation queue and community lens moderation queue needed. | Add ThoughtSift moderation tabs to System section. |
| Platform Intelligence Pipeline v2 | Channel D (Board of Directors Personas) fully wired. Three-tier persona library operational. Content policy enforced. | Mark Channel D as wired by PRD-34. |
| Build Order Source of Truth | PRD-34 completed. 6 new tables. 5 new feature keys. 5 new guided mode registrations. Supersedes one existing guided mode. | Update completed PRD list. Add tables and feature keys. |
| AI Cost Optimization Patterns | Board of Directors is the most AI-expensive tool (~$0.03-$0.10 per session for 3 advisors). Persona caching (P8 pattern) reduces generation costs. | Add ThoughtSift cost line items to the optimization doc. |
| Pre-Build Setup Checklist | Visual asset audit pass needed for 5 Vault thumbnail images. | Add ThoughtSift thumbnail creation to the visual asset audit task. |

---

*End of PRD-34*
