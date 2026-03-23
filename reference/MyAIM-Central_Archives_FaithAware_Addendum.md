# MyAIM-Central Archives System - Faith-Aware & Family Intelligence Addendum

**Companion Document to:** MyAIM-Central Complete Requirements & Architecture  
**Date Created:** October 27, 2025  
**Version:** 1.0

---

## Table of Contents

1. [Family Overview Card System](#1-family-overview-card-system)
2. [Faith & Values Integration with Archives](#2-faith-values-integration-with-archives)
3. [Enhanced Context Intelligence](#3-enhanced-context-intelligence)
4. [Ethical Guardrails & Safety](#4-ethical-guardrails-safety)
5. [ThoughtSift Integration with Archives](#5-thoughtsift-integration-with-archives)
6. [Family Intelligence Aggregation](#6-family-intelligence-aggregation)
7. [LiLa Context Enhancement](#7-lila-context-enhancement)
8. [Implementation Specifications](#8-implementation-specifications)

---

## 1. Family Overview Card System

### 1.1 Purpose & Vision

In addition to individual family member context cards, MyAIM-Central needs a **Family Overview Card** that provides holistic family intelligence - the aggregate understanding that makes AI truly family-aware rather than just person-aware.

**The Need:**
- Individual cards know about Jake, Sally, and Mike separately
- But they don't capture **family dynamics**, **collective patterns**, or **household culture**
- A family is more than the sum of its members - there's a "family personality"

### 1.2 Family Overview Card Structure

```
┌────────────────────────────────────────────────────────┐
│  📸 [Family Photo]                                      │
│  The Smith Family                                      │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│                                                        │
│  🏠 Household Overview                                 │
│  Family Size: 5 (2 parents, 3 kids)                   │
│  Ages: 42, 40, 10, 7, 4                               │
│  Household Type: Traditional homeschool family         │
│                                                        │
│  🌟 Family Personality                                 │
│  ☑️ Core Values: Faith, creativity, outdoor time      │
│  ☑️ Communication Style: Direct but warm              │
│  ☑️ Conflict Resolution: Talk it through together      │
│  ☑️ Decision Making: Collaborative                     │
│  ☐ Financial Philosophy: [Not added yet]              │
│                                                        │
│  🔄 Family Dynamics                                    │
│  ☑️ Sibling Relationships: Working on harmony          │
│  ☑️ Parenting Approach: Gentle but structured          │
│  ☑️ Extended Family: Close with grandparents           │
│  ☐ Special Circumstances: [Private]                   │
│                                                        │
│  📅 Rhythms & Routines                                 │
│  ☑️ Morning Flow: Slow start, breakfast together       │
│  ☑️ Bedtime Routine: Stories, prayers, 8pm             │
│  ☑️ Weekend Pattern: Church, family time, rest         │
│  ☑️ Annual Traditions: Christmas, birthdays, vacation  │
│                                                        │
│  🎯 Current Focus                                      │
│  ☑️ Season of Life: Potty training toddler            │
│  ☑️ Big Changes: New baby coming in March              │
│  ☑️ Challenges: Morning chaos, screen time balance     │
│  ☑️ Wins: Kids helping more, bedtime smoother          │
│                                                        │
│  🕊️ Faith & Values                                     │
│  ☑️ Active (Integrated into prompts)                   │
│  [Edit Faith Preferences]                              │
│                                                        │
│  Last updated: 3 days ago                              │
│  Total context items: 18                               │
│                                                        │
│  [Edit Overview] [Add Context] [Export]                │
└────────────────────────────────────────────────────────┘
```

### 1.3 What Makes Family Overview Different

**Individual Cards Focus On:**
- Jake's learning style
- Sally's interests
- Mom's work schedule

**Family Overview Focuses On:**
- How this family operates as a unit
- Shared values and culture
- Collective patterns and dynamics
- The "family personality" that colors everything

### 1.4 How It's Created

**Initial Creation (During Family Setup):**
1. Mom completes family setup walkthrough
2. System auto-generates Family Overview Card with basic info:
   - Family size and ages
   - Household type (selected during setup)
3. System prompts: "Tell me about your family's personality"

**Conversational Building:**
```
┌────────────────────────────────────────────────────────┐
│  Tell Me About Your Family                             │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│                                                        │
│  Let's build a picture of your family as a whole.      │
│                                                        │
│  Choose how to add info:                               │
│  [Answer Questions] [Free Write]                       │
└────────────────────────────────────────────────────────┘
```

**Question Examples:**
- What are your family's core values?
- How would you describe your family's personality?
- What's your approach to conflict resolution?
- What are your family traditions or rhythms?
- What season of life is your family in right now?
- What's working well? What needs attention?

**Free Write Option:**
```
Just tell me about your family - anything that comes 
to mind. I'll organize it for you!

[Large text area for brain dump]
```

**AI Organization (Future LiLa):**
- Reads brain dump
- Categorizes into sections
- Suggests additions to Overview Card
- Mom reviews and approves

### 1.5 How It Updates

**Manual Updates:**
- Mom clicks "Edit Overview"
- Updates any section
- Changes propagate to LiLa context

**Automatic Suggestions (From Family Activity):**
- Monthly aggregation (like Victory Recorder)
- Analyzes family patterns:
  - "Bedtime is consistently smooth now - update?"
  - "Noticed 'screen time' mentioned 12x this month - add to challenges?"
  - "Christmas traditions generated lots of victories - update annual traditions?"

**Seasonal Prompts:**
```
🍂 Fall Check-In

Your Family Overview says you're in "potty training 
season" - is that still current? 

Any new season of life to note?
- School routines settling in?
- New schedules or commitments?
- Changes in family dynamics?

[Update Overview] [Everything's the Same]
```

---

## 2. Faith & Values Integration with Archives

### 2.1 Faith Preference System (From Faith Ethics Framework)

**Location:** Archives > Family Overview Card > Faith & Values Section

**Complete Structure:**

```
┌────────────────────────────────────────────────────────┐
│  🕊️ Faith & Values Preferences                         │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│                                                        │
│  Step 1: Faith Identity (Optional)                     │
│                                                        │
│  Faith Tradition:                                      │
│  [The Church of Jesus Christ of Latter-day Saints ▼]  │
│                                                        │
│  Specific Denomination/Branch:                         │
│  [_______________________________]                     │
│                                                        │
│  Important Observances/Practices:                      │
│  [_______________________________]                     │
│  [_______________________________]                     │
│  "Sabbath day observance, family prayer, scripture     │
│  study, service"                                       │
│                                                        │
│  Sacred Texts or Authorities:                          │
│  [_______________________________]                     │
│  "Bible (KJV), Book of Mormon, D&C, modern prophets"  │
│                                                        │
│  ────────────────────────────────────────────────────  │
│                                                        │
│  Step 2: Response Approach (Mark All That Apply)       │
│                                                        │
│  When AI encounters faith-related topics, I want       │
│  responses that:                                       │
│                                                        │
│  ☑️ Prioritize my faith tradition                     │
│     Answer from our perspective first                  │
│                                                        │
│  ☐ Include comparative views                          │
│     Show how other traditions approach this            │
│                                                        │
│  ☐ Include secular perspectives                       │
│     Show non-religious approaches alongside            │
│     faith-based ones                                   │
│                                                        │
│  ☐ Educational only                                    │
│     Provide information without prescriptive           │
│     guidance                                           │
│                                                        │
│  ────────────────────────────────────────────────────  │
│                                                        │
│  Step 3: Tone & Framing (Mark All That Apply)          │
│                                                        │
│  ☑️ Use our terminology                               │
│     Use language/terms from our tradition when         │
│     relevant                                           │
│                                                        │
│  ☑️ Respect but don't assume                          │
│     Be aware of our background but don't force         │
│     religious framing                                  │
│                                                        │
│  ☑️ Avoid conflicting teachings                       │
│     Don't suggest practices contrary to our beliefs    │
│                                                        │
│  ────────────────────────────────────────────────────  │
│                                                        │
│  Step 4: Internal Diversity (Mark All That Apply)      │
│                                                        │
│  ☐ Acknowledge diverse perspectives                   │
│     Recognize that our tradition has internal          │
│     diversity                                          │
│                                                        │
│  ☐ We hold minority views                             │
│     Our interpretation may differ from the majority    │
│     in our tradition                                   │
│                                                        │
│  ☐ Other: [___________________________]               │
│                                                        │
│  ────────────────────────────────────────────────────  │
│                                                        │
│  Step 5: Special Instructions                          │
│                                                        │
│  Additional guidance for AI about our family's faith:  │
│                                                        │
│  [Large text area]                                     │
│  "We take doctrine seriously but recognize cultural    │
│  practices vs. core teachings. We're open to asking    │
│  hard questions. Please distinguish between official   │
│  Church sources and member opinions."                  │
│                                                        │
│  ────────────────────────────────────────────────────  │
│                                                        │
│  Step 6: Relevance Settings                            │
│                                                        │
│  When should faith context be included?                │
│                                                        │
│  ● Automatic (Recommended)                            │
│    LiLa decides when faith context is relevant         │
│                                                        │
│  ○ Always include                                     │
│    Add faith context to every prompt                   │
│                                                        │
│  ○ Manual only                                        │
│    Only include when I explicitly tell LiLa to         │
│                                                        │
│  [Save Preferences] [Cancel]                           │
└────────────────────────────────────────────────────────┘
```

### 2.2 Faith Context in Family Overview Card

**What Gets Stored:**
```sql
-- In family_overview_intelligence table
{
  "faith_identity": {
    "tradition": "The Church of Jesus Christ of Latter-day Saints",
    "denomination": "",
    "observances": ["Sabbath day observance", "family prayer", "scripture study", "service"],
    "sacred_texts": ["Bible (KJV)", "Book of Mormon", "Doctrine & Covenants", "modern prophets"]
  },
  "response_preferences": {
    "prioritize_tradition": true,
    "include_comparative": false,
    "include_secular": false,
    "educational_only": false
  },
  "tone_framing": {
    "use_our_terminology": true,
    "respect_but_dont_assume": true,
    "avoid_conflicting": true
  },
  "internal_diversity": {
    "acknowledge_diversity": false,
    "minority_views": false,
    "other": ""
  },
  "special_instructions": "We take doctrine seriously but recognize cultural practices vs. core teachings...",
  "relevance_setting": "automatic"
}
```

### 2.3 How LiLa Uses Faith Context

**Automatic Relevance Detection:**

**Faith Context IS Relevant:**
- Query explicitly about religion/spirituality/values/morality
- Query touches on faith-tied practices (dietary, Sabbath, etc.)
- User specifically invokes faith context
- Topics like death, meaning, ethics, parenting dilemmas

**Faith Context NOT Relevant:**
- Purely functional queries (image prompts, scheduling)
- No religious dimension
- Would be forced or awkward

**Examples:**

**Example 1: NOT Relevant**
```
User: "Help me create an image prompt for a dragon"
LiLa: [Does NOT include faith context]
Prompt: "Create a detailed dragon illustration..."
```

**Example 2: HIGHLY Relevant**
```
User: "Help me explain death to my 5-year-old"
LiLa: [Checks faith preferences]
- Family identifies as Latter-day Saint
- Prioritize tradition: TRUE
- Use our terminology: TRUE

Enhanced Prompt: "I need help explaining death to my 
5-year-old daughter. We're members of The Church of 
Jesus Christ of Latter-day Saints, so our explanation 
should align with our belief in the Plan of Salvation - 
that families can be together forever, death is not the 
end, and we'll see loved ones again. Please provide 
age-appropriate language that's comforting and doctrinally 
accurate from an LDS perspective."
```

**Example 3: Conditionally Relevant**
```
User: "Optimize this meal planning prompt"
LiLa: [Checks for dietary restrictions tied to faith]
- Finds: Observes Sabbath (no Sunday meal prep)
- Finds: No alcohol in cooking

Enhanced Prompt: "Plan meals for a family of 5. Note: 
They observe a Sabbath day of rest on Sundays, so meals 
for that day should be simple or prepared ahead. They 
don't use alcohol in cooking."
```

### 2.4 Faith Context Transparency

**When LiLa Shows Generated Prompt:**
```
┌────────────────────────────────────────────────────────┐
│  📋 Your Optimized Prompt                              │
│  🕊️ Faith context included ✓                          │
│                                                        │
│  [Show details] [Edit prompt] [Copy]                   │
└────────────────────────────────────────────────────────┘
```

**Click "Show details":**
```
┌────────────────────────────────────────────────────────┐
│  Context Used                                          │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│                                                        │
│  ✓ Faith tradition (Latter-day Saint)                 │
│  ✓ Prioritize tradition-specific guidance             │
│  ✓ Use proper terminology                             │
│                                                        │
│  Why included: This query about explaining death       │
│  touches on core spiritual beliefs. Your faith         │
│  preferences indicate you want responses prioritizing  │
│  your tradition's perspective.                         │
│                                                        │
│  If this doesn't feel relevant, you can:              │
│  • Edit the prompt directly                            │
│  • Adjust faith relevance settings                     │
│  • Tell me to exclude faith context this time          │
│                                                        │
│  [Understood] [Adjust Settings]                        │
└────────────────────────────────────────────────────────┘
```

### 2.5 Respecting All Traditions (Universal Rules)

**Platform-Wide Guardrails (Non-Negotiable):**

1. **Respectful Self-Definition**
   - Religious traditions define themselves
   - No tradition can define or gatekeep another
   - Use authorized sources from within each tradition

2. **Proper Terminology**
   - Use full names and titles traditions request
   - Example: "The Church of Jesus Christ of Latter-day Saints" (first reference)
   - Update when traditions update preferences

3. **No Disparagement**
   - Never allow one faith to define another negatively
   - Present differences descriptively, not judgmentally
   - Distinguish between official teachings and popular misconceptions

4. **Pluralism-Aware**
   - Acknowledge internal diversity within traditions
   - Respect interfaith families (multiple traditions)
   - Allow for nuanced positions

**Bad Examples (Platform Prevents):**
- ❌ "Mormons aren't really Christians because..."
- ❌ "Catholics worship Mary instead of God..."
- ❌ "Muslims are violent because..."

**Good Approach:**
- ✅ "Members of The Church of Jesus Christ of Latter-day Saints identify as Christians and center their faith on Jesus Christ. Some other Christian denominations have different perspectives on what qualifies as Christian. Here's how each tradition defines itself..."

---

## 3. Enhanced Context Intelligence

### 3.1 Family Intelligence Layers

**Layer 1: Individual Context (Already Specified)**
- Jake's learning style
- Sally's interests
- Mom's schedule

**Layer 2: Relationship Context (NEW)**
- Sibling dynamics (Jake & Sally)
- Parent-child patterns (Mom & Jake)
- Extended family connections (Grandma's role)

**Layer 3: Household Context (Family Overview Card)**
- Family personality
- Communication style
- Decision-making patterns
- Rhythms and traditions

**Layer 4: Temporal Context (NEW)**
- Season of life (potty training, new baby coming)
- Current challenges (morning chaos)
- Recent wins (bedtime smoother)
- Big changes approaching (school starting)

**Layer 5: Values Context (Faith & Best Intentions)**
- Faith tradition and practices
- Family values (from Best Intentions)
- Parenting philosophy
- Priorities and goals

### 3.2 Context Aggregation for LiLa

**When Mom Asks for Help:**

**Simple Request:**
```
"Help Jake with math homework"
```

**LiLa Analyzes Relevant Context:**

```typescript
// Pseudo-code for context selection
const relevantContext = {
  // Layer 1: Individual
  jake_learning_style: "visual learner",
  jake_interests: ["Minecraft", "LEGO"],
  jake_current_challenges: "fractions",
  
  // Layer 2: Relationship
  sibling_dynamics: "working on Jake helping Sally more",
  
  // Layer 3: Household
  parenting_approach: "gentle but structured",
  communication_style: "direct but warm",
  
  // Layer 4: Temporal
  current_focus: "building independence",
  recent_win: "Jake's homework streak (12 days)",
  
  // Layer 5: Values
  best_intention: "foster independent learning",
  best_intention: "make learning fun",
  faith_context: null // Not relevant for math help
};
```

**LiLa-Optimized Prompt:**
```
I need help with a math homework approach for Jake (10 years old, 
5th grade). He's a visual learner who loves Minecraft and LEGO. 
He's been on a great homework streak (12 days!) and we're working 
on building his independence. The current challenge is fractions.

Can you suggest ways to explain fractions using Minecraft or LEGO 
examples? The goal is to help him understand independently - not 
just get answers, but develop problem-solving skills he can use 
on his own. Keep it fun and engaging.
```

### 3.3 Context Weighting System

Not all context is equally important for every request. LiLa uses smart weighting:

**High Weight (Always Include):**
- Directly relevant individual traits (Jake's learning style for homework)
- Active Best Intentions related to request
- Safety considerations (allergies for meal planning)

**Medium Weight (Include If Space):**
- Related relationship dynamics
- Current season of life
- Recent patterns or wins

**Low Weight (Optional):**
- General household personality
- Extended family info
- Non-urgent challenges

**Example - Context Budget:**
```
Available "context budget" for ChatGPT: ~1500 tokens

High Priority (800 tokens):
- Jake's learning style, interests, grade level
- Current challenge: fractions
- Best Intention: Independent learning

Medium Priority (500 tokens):
- Recent homework streak (building on success)
- Parenting approach: gentle encouragement
- Communication style: direct but warm

Low Priority (200 tokens):
- Sibling dynamics (not directly relevant)
- Family traditions (not relevant here)

Faith Context: Not included (not relevant for math)
```

---

## 4. Ethical Guardrails & Safety

### 4.1 Safety-First Context Filtering

**Automatic Exclusions (Never Included Without Explicit Permission):**
- Medical diagnoses
- Mental health concerns
- Financial details (specific amounts, debts)
- Marital conflicts
- Private family issues
- Legal matters

**Example:**
```
Mom's Context Overview includes:
✓ "Working on better sleep routine"
✗ "Struggling with postpartum anxiety" [PRIVATE - medical]

LiLa Will Include:
"Mom is working on improving sleep routines for the family"

LiLa Will NOT Include:
Details about mental health diagnoses
```

### 4.2 Relationship Safety (From Faith Ethics Framework)

**Tier System for Relationship Queries:**

**Tier 1: Normal Processing**
- Typical parenting challenges
- Communication improvements
- Household management

**Tier 2: Discernment Required**
- Significant marital issues
- Major family decisions
- Faith-related uncertainties

**LiLa Response Pattern:**
```
"This sounds like something that would benefit from:
- Prayer and spiritual guidance
- Trusted counsel (clergy, therapist, wise mentor)
- Time for reflection

I can help you think through questions, but big decisions 
like this need more than AI - they need the people who 
know you and divine guidance.

Would you like help identifying good questions to pray 
about or discuss with trusted people?"
```

**Tier 3: Safety Concerns** (Immediate Redirect)
- Fear of partner
- Physical violence/threats
- Control or isolation
- Severe mental health crisis

**LiLa Response:**
```
❗ I'm concerned about your safety.

Please reach out for help right now:
• National Domestic Violence Hotline: 1-800-799-7233
• Crisis Text Line: Text HOME to 741741
• Emergency: 911

You don't have to go through this alone. Please talk 
to someone who can help - a friend, family member, 
therapist, or crisis counselor.

[View Resources] [I'm Safe, Continue]
```

### 4.3 Child Safety Context

**When Children Interact with AI-Generated Content:**

**System Passes Child's Age:**
```typescript
generateTaskSubtasks({
  taskName: "Clean bedroom",
  childAge: 6, // System includes this
  childReadingLevel: "early_reader"
});
```

**Age-Appropriate Output:**
```
Age 6 Output:
✓ "Put toys in toy box"
✓ "Make your bed"
✓ "Put dirty clothes in hamper"

NOT:
✗ "Organize recreational materials by category"
✗ "Systematically arrange textile items"
```

**Victory Celebrations:**
```
Age 6: "Way to go! You're a superstar! 🌟"
Age 13: "Nice work! That's solid effort. 💪"
Age 17: "Well done. Keep up the momentum. ✓"
```

---

## 5. ThoughtSift Integration with Archives

### 5.1 What is ThoughtSift? (From Faith Ethics Framework)

ThoughtSift is MyAIM-Central's conversational processing partner - warm, boundaried AI that helps moms think through life's complexity while maintaining appropriate limits.

**Location:** Inner Oracle Portal (Enhanced Tier)

**Purpose:**
- Process emotions and thoughts
- Think through decisions
- Work through challenges
- NOT a substitute for human connection or divine guidance

### 5.2 How ThoughtSift Uses Archives Context

**When Mom Opens ThoughtSift:**
```
┌────────────────────────────────────────────────────────┐
│  ThoughtSift                                           │
│  Your processing partner                               │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│                                                        │
│  Context Options:                                      │
│  ☑️ Family Archives                                   │
│  ☑️ Faith Preferences                                 │
│  ☐ Personality Profile                                │
│  ☑️ Best Intentions                                   │
│                                                        │
│  Processing Mode:                                      │
│  ● Emotional processing (just listen)                 │
│  ○ Decision making (use frameworks)                   │
│  ○ Problem solving (find solutions)                   │
│  ○ Creative brainstorming (explore ideas)             │
│                                                        │
│  What's on your mind?                                  │
│  [Large text area]                                     │
│                                                        │
│  [Start Processing]                                    │
└────────────────────────────────────────────────────────┘
```

**Example Session:**

**Mom's Input:**
```
"I'm so frustrated with Jake this morning. He refused to 
do his homework again and now we're behind. I don't know 
if I'm being too strict or not strict enough. I feel like 
a failure."
```

**ThoughtSift Response (Using Context):**
```
I hear the frustration and the self-doubt. Let's pause 
and look at this together.

First - you're not a failure. I see in your Best Intentions 
that you're working on "fostering independent learning" 
and "making learning fun." Those are great goals, and 
growth isn't linear.

Looking at Jake's context, you mentioned he'd been on a 
12-day homework streak recently. That's significant! 
This morning's resistance doesn't erase that progress.

Let me ask a few questions to help us think this through:

1. What was different this morning? (Sleep, mood, time 
   pressure?)
2. Was the homework itself the issue, or something else?
3. What's worked well during that 12-day streak?

And given your family's faith, have you had a chance to 
pray about this specifically? Sometimes when we're in 
the frustration, stepping back for spiritual guidance 
brings clarity.

What thoughts come up as you reflect on these questions?
```

**Key Elements:**
- Uses Best Intentions ("fostering independent learning")
- References recent context (12-day streak)
- Asks clarifying questions (not prescriptive advice)
- Redirects to faith resources (prayer)
- Validates emotions while providing perspective
- Appropriately boundaried (doesn't claim to be therapist/friend)

### 5.3 ThoughtSift Boundaries

**What ThoughtSift DOES:**
- Help process thoughts and emotions
- Ask good questions
- Reflect patterns back
- Provide frameworks for thinking
- Redirect to human/divine resources
- Validate feelings

**What ThoughtSift DOESN'T DO:**
- Pretend to be a friend or companion
- Replace human connection
- Replace spiritual guidance
- Give prescriptive advice on major decisions
- Process content that requires professional help

**Boundary Language Examples:**
```
"This sounds like something that would really benefit 
from talking with [husband/trusted friend/clergy]. 
I can help you organize your thoughts before that 
conversation - want to do that?"

"For spiritual questions like this, the most important 
thing is taking it to the Lord. I can help you identify 
good questions to pray about, but the answers need to 
come from Him, not from AI."

"I'm noticing this is touching on some deep relationship 
dynamics. That's the kind of thing that really needs 
a trusted therapist or counselor who can work with you 
over time. I can help you think through how to find 
someone good - want to talk about that?"
```

---

## 6. Family Intelligence Aggregation

### 6.1 How Family Overview Card Grows Over Time

**Initial State (After Setup):**
```json
{
  "family_overview": {
    "basic_info": {
      "family_size": 5,
      "ages": [42, 40, 10, 7, 4],
      "household_type": "traditional_homeschool"
    },
    "sections_populated": ["basic_info"],
    "sections_pending": [
      "family_personality",
      "dynamics",
      "rhythms",
      "current_focus",
      "faith_values"
    ]
  }
}
```

**After 1 Month:**
```json
{
  "family_overview": {
    "basic_info": { ... },
    "family_personality": {
      "core_values": ["faith", "creativity", "outdoor_time"],
      "communication_style": "direct_but_warm",
      "conflict_resolution": "talk_it_through",
      "decision_making": "collaborative"
    },
    "dynamics": {
      "sibling_relationships": "working_on_harmony",
      "parenting_approach": "gentle_but_structured",
      "extended_family": "close_with_grandparents"
    },
    "current_focus": {
      "season": "potty_training_toddler",
      "challenges": ["morning_chaos", "screen_time_balance"],
      "wins": ["bedtime_smoother", "kids_helping_more"]
    },
    "faith_values": {
      "is_active": true,
      "tradition": "latter_day_saint",
      "preferences": { ... }
    }
  }
}
```

### 6.2 Automatic Pattern Recognition

**System Monitors:**
- Repeated phrases in Mom's interactions
- Common themes in ThoughtSift sessions
- Victory Recorder patterns across family
- Task completion patterns
- Best Intentions progress

**Suggestions Trigger:**
```
After detecting pattern in data:

┌────────────────────────────────────────────────────────┐
│  📊 Pattern Detected                                   │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│                                                        │
│  I've noticed "bedtime" mentioned positively 8 times   │
│  this month. Your Family Overview says bedtime was     │
│  a challenge - looks like that's improved!             │
│                                                        │
│  Update Family Overview?                               │
│  Current: "Bedtime is chaotic and stressful"          │
│  Suggested: "Bedtime routine is smoother now -         │
│  stories, prayers, 8pm consistently"                   │
│                                                        │
│  [Update Overview] [Not Yet] [Remind Me Later]         │
└────────────────────────────────────────────────────────┘
```

### 6.3 Cross-Referencing Intelligence

**Example: Homework Help Request**

**LiLa Checks:**
1. **Jake's Individual Context**
   - Learning style: Visual
   - Interests: Minecraft
   - Current challenge: Fractions

2. **Family Overview Context**
   - Parenting approach: Gentle but structured
   - Best Intention: Foster independence
   - Current focus: Building kids' confidence

3. **Faith Context** (If Relevant)
   - [Not relevant for math homework]

4. **Recent Activity Context**
   - Jake had 12-day homework streak
   - Mom's Best Intention: "Make learning fun"
   - ThoughtSift session: Mom stressed about homework battles

**LiLa Synthesis:**
```
"I'll help you with a homework approach that:
- Uses visual/Minecraft examples (Jake's style)
- Builds on his recent homework streak (momentum)
- Encourages independence (your goal)
- Keeps it fun and low-pressure (reduces stress)
- Avoids creating new homework battles (recent pattern)

Here's what I suggest..."
```

---

## 7. LiLa Context Enhancement

### 7.1 Smart Context Selection Algorithm

**Step 1: Analyze User Request**
```typescript
analyzeRequest(userInput: string) {
  const requestType = detectType(userInput);
  // Types: homework, meal_planning, behavior, decision, 
  //        spiritual, schedule, creative, etc.
  
  const mentionedPeople = extractPeople(userInput);
  // ["Jake", "Sally", etc.]
  
  const timeframe = detectTimeframe(userInput);
  // "today", "this week", "upcoming", etc.
  
  return { requestType, mentionedPeople, timeframe };
}
```

**Step 2: Determine Relevant Context Categories**
```typescript
const contextPriorities = {
  homework: {
    high: ["individual_learning_style", "current_academic_challenges", 
           "best_intentions_related_to_learning"],
    medium: ["recent_academic_victories", "parenting_approach"],
    low: ["family_personality", "sibling_dynamics"],
    faith: "conditional" // Only if spiritual/values question
  },
  
  meal_planning: {
    high: ["dietary_restrictions", "food_preferences", "budget"],
    medium: ["family_rhythms", "seasonal_focus"],
    low: ["individual_interests"],
    faith: "conditional" // Only if dietary laws or Sabbath observance
  },
  
  behavior_challenge: {
    high: ["parenting_approach", "child_personality", "family_dynamics"],
    medium: ["best_intentions", "recent_patterns", "current_season"],
    low: ["extended_family"],
    faith: "likely" // Values/guidance questions often relevant
  },
  
  spiritual_question: {
    high: ["faith_preferences", "sacred_texts", "observances"],
    medium: ["best_intentions", "family_values"],
    low: ["practical_schedules"],
    faith: "required" // Always include
  }
};
```

**Step 3: Fetch Context Based on Priorities**
```typescript
async function buildContextPackage(
  requestType: string,
  mentionedPeople: string[],
  familyId: string
) {
  const priorities = contextPriorities[requestType];
  let contextPackage = {};
  
  // High priority (always include)
  for (const category of priorities.high) {
    contextPackage[category] = await fetchContext(category, familyId, mentionedPeople);
  }
  
  // Medium priority (include if space)
  if (remainingTokens > 500) {
    for (const category of priorities.medium) {
      contextPackage[category] = await fetchContext(category, familyId, mentionedPeople);
    }
  }
  
  // Faith context (conditional)
  if (priorities.faith === "required" || 
      (priorities.faith === "likely" && hasFaithPreferences(familyId))) {
    contextPackage.faith = await fetchFaithContext(familyId);
  }
  
  return contextPackage;
}
```

**Step 4: Format for Target Platform**
```typescript
function formatForPlatform(
  contextPackage: any,
  targetPlatform: string
) {
  if (targetPlatform === "chatgpt") {
    return formatChatGPT(contextPackage);
  } else if (targetPlatform === "claude") {
    return formatClaude(contextPackage);
  }
  // etc.
}
```

### 7.2 Context Transparency & Control

**Before Sending to AI:**
```
┌────────────────────────────────────────────────────────┐
│  📋 Ready to Optimize                                  │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│                                                        │
│  Your request: "Help Jake with fractions homework"     │
│                                                        │
│  Context I'll include:                                 │
│  ✓ Jake's learning style (visual)                     │
│  ✓ Jake's interests (Minecraft, LEGO)                 │
│  ✓ Current challenge (fractions)                      │
│  ✓ Best Intention: Foster independence                │
│  ✓ Recent win: 12-day homework streak                 │
│                                                        │
│  Context I'm excluding:                                │
│  ✗ Medical information (not relevant)                 │
│  ✗ Behavior notes (not relevant)                      │
│  ✗ Faith preferences (not relevant for math)          │
│                                                        │
│  [Edit Context] [Optimize Prompt] [Cancel]            │
└────────────────────────────────────────────────────────┘
```

**Click "Edit Context":**
```
┌────────────────────────────────────────────────────────┐
│  Customize Context                                     │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│                                                        │
│  Individual Context (Jake):                            │
│  ☑️ Learning style                                    │
│  ☑️ Interests                                         │
│  ☑️ Current academic challenges                       │
│  ☐ Behavior patterns                                  │
│  ☐ Medical information                                │
│                                                        │
│  Family Context:                                       │
│  ☑️ Parenting approach                                │
│  ☑️ Best Intentions (learning-related)                │
│  ☐ Family dynamics                                    │
│  ☐ Faith preferences                                  │
│                                                        │
│  Recent Activity:                                      │
│  ☑️ Homework streak                                   │
│  ☐ Victory Recorder entries                           │
│                                                        │
│  [Save as Preset] [Apply] [Reset to Defaults]         │
└────────────────────────────────────────────────────────┘
```

### 7.3 Context Presets / Smart Modes

**Mom Can Save Context Configurations:**

```
Preset: "Homework Help"
✓ Individual learning styles
✓ Academic challenges
✓ Best Intentions (learning)
✓ Recent academic victories
✗ Behavior notes
✗ Medical info
✗ Faith context

[Use This Preset]
```

```
Preset: "Spiritual Questions"
✓ Faith preferences (all)
✓ Family values
✓ Best Intentions (faith-related)
✓ Sacred texts / observances
✗ Academic context
✗ Task schedules

[Use This Preset]
```

```
Preset: "Meal Planning"
✓ Dietary restrictions
✓ Food preferences
✓ Budget constraints
✓ Family schedules
✓ Faith-based dietary laws (if applicable)
✗ Academic context
✗ Behavior notes

[Use This Preset]
```

**Quick Access:**
```
LiLa Optimizer Panel:
┌────────────────────────────────────────────────────────┐
│  What do you need help with?                           │
│  [_________________________________________]           │
│                                                        │
│  Context Preset:                                       │
│  [Auto-Detect ▼]                                       │
│  • Auto-Detect (Recommended)                           │
│  • Homework Help                                       │
│  • Spiritual Questions                                 │
│  • Meal Planning                                       │
│  • Behavior Guidance                                   │
│  • Schedule Management                                 │
│  • Custom...                                           │
│                                                        │
│  [Optimize Prompt]                                     │
└────────────────────────────────────────────────────────┘
```

---

## 8. Implementation Specifications

### 8.1 Database Schema Additions

**New Table: `family_overview_intelligence`**
```sql
CREATE TABLE family_overview_intelligence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID REFERENCES families(id) ON DELETE CASCADE,
  
  -- Household Overview
  family_size INTEGER,
  member_ages INTEGER[],
  household_type TEXT,
  
  -- Family Personality (JSONB for flexibility)
  family_personality JSONB,
  /*
  {
    "core_values": ["faith", "creativity", "outdoor_time"],
    "communication_style": "direct_but_warm",
    "conflict_resolution": "talk_it_through",
    "decision_making": "collaborative",
    "financial_philosophy": "..."
  }
  */
  
  -- Dynamics (JSONB)
  family_dynamics JSONB,
  /*
  {
    "sibling_relationships": "working_on_harmony",
    "parenting_approach": "gentle_but_structured",
    "extended_family": "close_with_grandparents",
    "special_circumstances": null // Private
  }
  */
  
  -- Rhythms & Routines (JSONB)
  family_rhythms JSONB,
  /*
  {
    "morning_flow": "slow_start_breakfast_together",
    "bedtime_routine": "stories_prayers_8pm",
    "weekend_pattern": "church_family_time_rest",
    "annual_traditions": ["christmas", "birthdays", "vacation"]
  }
  */
  
  -- Current Focus (JSONB)
  current_focus JSONB,
  /*
  {
    "season_of_life": "potty_training_toddler",
    "big_changes": ["new_baby_march"],
    "challenges": ["morning_chaos", "screen_time_balance"],
    "wins": ["bedtime_smoother", "kids_helping_more"]
  }
  */
  
  -- Faith & Values (JSONB - references faith_preferences table)
  faith_values JSONB,
  /*
  {
    "is_active": true,
    "faith_preference_id": "uuid-reference"
  }
  */
  
  -- Metadata
  cover_photo_url TEXT,
  last_updated TIMESTAMP DEFAULT NOW(),
  auto_update_enabled BOOLEAN DEFAULT true,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

**New Table: `faith_preferences`**
```sql
CREATE TABLE faith_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID REFERENCES families(id) ON DELETE CASCADE,
  
  -- Identity
  faith_tradition TEXT,
  denomination TEXT,
  observances TEXT[],
  sacred_texts TEXT[],
  
  -- Response Preferences
  prioritize_tradition BOOLEAN DEFAULT false,
  include_comparative BOOLEAN DEFAULT false,
  include_secular BOOLEAN DEFAULT false,
  educational_only BOOLEAN DEFAULT false,
  
  -- Tone & Framing
  use_our_terminology BOOLEAN DEFAULT false,
  respect_but_dont_assume BOOLEAN DEFAULT true,
  avoid_conflicting BOOLEAN DEFAULT true,
  
  -- Internal Diversity
  acknowledge_diversity BOOLEAN DEFAULT false,
  minority_views BOOLEAN DEFAULT false,
  diversity_notes TEXT,
  
  -- Special Instructions
  special_instructions TEXT,
  
  -- Relevance Setting
  relevance_setting TEXT DEFAULT 'automatic',
  -- Options: 'automatic', 'always', 'manual'
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(family_id)
);
```

**Updated Table: `folder_overview_cards`**
```sql
-- Add family_overview_type
ALTER TABLE folder_overview_cards
  ADD COLUMN overview_type TEXT DEFAULT 'individual';
  -- Options: 'individual' (person), 'family' (whole family), 
  --          'best_intentions', 'custom'

-- Add aggregate_intelligence for family overview
ALTER TABLE folder_overview_cards
  ADD COLUMN aggregate_intelligence JSONB;
  /*
  For family overview card, stores cross-referenced intelligence:
  {
    "recent_patterns": [...],
    "suggested_updates": [...],
    "cross_references": {
      "best_intentions_referenced": [...],
      "victory_patterns": [...],
      "thoughtsift_themes": [...]
    }
  }
  */
```

**New Table: `context_usage_tracking`**
```sql
CREATE TABLE context_usage_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID REFERENCES families(id) ON DELETE CASCADE,
  
  -- What was used
  context_type TEXT NOT NULL,
  -- 'individual', 'family_overview', 'best_intention', 
  -- 'faith', 'rhythm', etc.
  
  context_item_id UUID, -- Reference to specific context
  
  -- When and why
  used_at TIMESTAMP DEFAULT NOW(),
  request_type TEXT, -- 'homework', 'meal_planning', etc.
  was_helpful BOOLEAN, -- User feedback (optional)
  
  -- For learning
  lila_confidence_score DECIMAL(3,2),
  -- How confident LiLa was this was relevant (0.00-1.00)
  
  user_override BOOLEAN DEFAULT false,
  -- Did user manually exclude/include this?
  
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_context_usage_family ON context_usage_tracking(family_id);
CREATE INDEX idx_context_usage_type ON context_usage_tracking(context_type);
CREATE INDEX idx_context_usage_date ON context_usage_tracking(used_at);
```

### 8.2 API Endpoints

**GET `/api/family-overview/:familyId`**
- Fetches complete family overview intelligence
- Returns: Family personality, dynamics, rhythms, current focus, faith values
- Permissions: Family members only

**POST `/api/family-overview/:familyId`**
- Creates or updates family overview
- Body: Section updates (personality, dynamics, etc.)
- Permissions: Primary parent only

**GET `/api/faith-preferences/:familyId`**
- Fetches faith preferences
- Returns: Complete faith configuration
- Permissions: Family members only

**POST `/api/faith-preferences/:familyId`**
- Creates or updates faith preferences
- Body: Faith identity, response preferences, etc.
- Permissions: Primary parent only

**POST `/api/lila/optimize-with-context`**
- Main LiLa optimization endpoint with full context awareness
- Body: 
  ```json
  {
    "user_request": "Help Jake with fractions",
    "family_id": "uuid",
    "member_ids": ["jake-uuid"],
    "target_platform": "chatgpt",
    "context_preset": "homework_help" // or "auto"
  }
  ```
- Returns:
  ```json
  {
    "optimized_prompt": "Full enhanced prompt...",
    "context_used": [
      {
        "type": "individual_learning_style",
        "source": "Jake's profile",
        "content_summary": "Visual learner"
      },
      {
        "type": "best_intention",
        "source": "Family Best Intentions",
        "content_summary": "Foster independence"
      }
    ],
    "context_excluded": [
      {
        "type": "medical_info",
        "reason": "Not relevant to request"
      }
    ],
    "faith_context_included": false,
    "confidence_score": 0.95
  }
  ```

**GET `/api/context-suggestions/:familyId`**
- Fetches AI-generated suggestions for context updates
- Based on pattern recognition from Victory Recorder, ThoughtSift, etc.
- Returns: Suggested additions to Family Overview

### 8.3 Frontend Components

**New Components:**

1. **`FamilyOverviewCard.tsx`**
   - Displays family-level intelligence
   - Editable sections
   - Checkbox toggles for LiLa access

2. **`FaithPreferencesModal.tsx`**
   - 6-step faith preference configuration
   - Embedded in Family Overview Card

3. **`ContextTransparencyPanel.tsx`**
   - Shows what context will be included/excluded
   - Allows editing before optimization
   - Save as presets

4. **`SmartModeSelector.tsx`**
   - Dropdown for context presets
   - "Homework Help", "Spiritual Questions", etc.

5. **`PatternSuggestionCard.tsx`**
   - Shows AI-detected patterns
   - Suggests updates to Family Overview
   - Approve/reject interface

### 8.4 LiLa Context Integration Flow

**Complete Flow:**
```
1. User enters request in LiLa panel
   ↓
2. Frontend sends to /api/lila/optimize-with-context
   ↓
3. Backend analyzes request type
   ↓
4. Backend fetches relevant context based on priorities
   ↓
5. Backend checks faith preferences (if relevant)
   ↓
6. Backend compiles context package
   ↓
7. Backend formats for target platform
   ↓
8. Backend calls OpenRouter with enhanced prompt
   ↓
9. Backend tracks context usage for learning
   ↓
10. Frontend displays optimized prompt with transparency
   ↓
11. User reviews, edits if needed, and uses
```

---

## 9. Summary: What This Addendum Adds

### Core Additions to Main Requirements Doc:

1. **Family Overview Card**
   - Holistic family intelligence beyond individual members
   - Captures family personality, dynamics, rhythms, values
   - Auto-updates from family activity patterns

2. **Faith & Values System**
   - Comprehensive faith preference configuration
   - Automatic relevance detection
   - Respectful, pluralistic approach
   - Integration with Family Overview

3. **Enhanced Context Intelligence**
   - 5-layer context architecture
   - Smart weighting and selection
   - Cross-referencing across all data sources

4. **Ethical Guardrails**
   - Safety-first filtering
   - Relationship safety tiers
   - Child-appropriate content
   - Appropriate boundaries (ThoughtSift)

5. **ThoughtSift Integration**
   - Conversational processing with Archives access
   - Context-aware but boundaried
   - Redirects to human/divine resources

6. **Family Intelligence Aggregation**
   - Pattern recognition across all systems
   - Automatic update suggestions
   - Temporal context (season of life)

7. **LiLa Context Enhancement**
   - Smart context selection algorithm
   - Context presets / smart modes
   - Full transparency and control

### Integration Points with Main Doc:

**Phase 1 (Foundation):**
- Add Family Overview Card creation during family setup
- Implement basic faith preferences

**Phase 3 (Archives):**
- Complete Family Overview Card with all sections
- Auto-generation from family activity
- Pattern recognition system

**Phase 4 (Best Intentions):**
- Integrate Best Intentions with Family Overview
- Faith values inform Best Intentions

**Phase 5 (Victory Recorder):**
- Feed family patterns into Overview suggestions
- Temporal context updates

**Phase 6 (LiLa Integration):**
- Full context selection algorithm
- Faith-aware prompt enhancement
- Smart modes and presets

**New Phase (Inner Oracle):**
- ThoughtSift with Archives integration
- Context-aware processing sessions
- Appropriate boundaries and redirects

---

## 10. Conclusion

This addendum ensures MyAIM-Central truly understands families **holistically** - not just as collections of individuals, but as living systems with their own personalities, values, and rhythms.

**Key Principles Maintained:**
- ✅ Enhancement, not replacement
- ✅ Human-in-the-mix (always editable)
- ✅ Faith-aware and pluralistic
- ✅ Processing partner, not companion
- ✅ Safety-first approach
- ✅ Transparent AI usage

**What Makes This Unique:**
Most AI systems treat users as isolated individuals. MyAIM-Central understands:
- Family dynamics and relationships
- Collective values and culture
- Temporal context (seasons of life)
- Faith traditions with respect
- Household rhythms and patterns

**This creates AI that feels like it "gets" your family** - because it actually does.

---

**Document Version:** 1.0  
**Date:** October 27, 2025  
**Status:** Complete - Ready for Implementation Alongside Main Requirements Doc
