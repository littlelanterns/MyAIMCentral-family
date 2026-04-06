// MyAIM Central — Task Breaker Edge Function (PRD-09A)
// Non-streaming utility AI call that decomposes a task into subtasks.
// Three detail levels: quick (3-5), detailed (5-10), granular (10-20).
// Uses Haiku for lightweight structured JSON generation.

import { z } from 'https://esm.sh/zod@3.23.8'
import { handleCors, jsonHeaders } from '../_shared/cors.ts'
import { logAICost } from '../_shared/cost-logger.ts'

const OPENROUTER_API_KEY = Deno.env.get('OPENROUTER_API_KEY')!

const MODEL = 'anthropic/claude-haiku-4.5'

const SYSTEM_PROMPT = `You are a task decomposition assistant for a family management app. Break down the given task into practical, action-oriented subtasks.

Rules:
- Generate steps appropriate to the detail level:
  - "quick": 3-5 high-level steps
  - "detailed": 5-10 steps with brief descriptions
  - "granular": 10-20 micro-steps with very specific actions
- For family tasks with multiple members, suggest which family member should handle each step based on their capabilities:
  - "play" dashboard_mode = young children (ages 3-7), simple physical tasks only
  - "guided" dashboard_mode = older children (ages 8-12), can follow multi-step instructions
  - "independent" dashboard_mode = teens (ages 13+), can handle complex and solo tasks
  - "adult" dashboard_mode = parents, can handle anything
- Consider each member's current active task count to avoid overloading anyone
- Keep language encouraging and action-oriented, never condescending
- Do not use emoji anywhere in your output
- Each step should be a concrete action someone can complete and check off

Respond with ONLY a valid JSON object. No markdown, no code fences, no explanation.
Format: {"subtasks": [{"title": "...", "description": "...", "suggested_assignee_id": "...", "sort_order": 1}]}
- title (string, required): short action-oriented step name
- description (string, optional): brief clarification, only for "detailed" and "granular" levels
- suggested_assignee_id (string, optional): family member ID if suggesting an assignee
- sort_order (number, required): sequential order starting at 1`

const FamilyMemberSchema = z.object({
  id: z.string().uuid(),
  display_name: z.string(),
  dashboard_mode: z.string().nullable(),
})

const InputSchema = z.object({
  task_title: z.string().min(1),
  task_description: z.string().optional(),
  detail_level: z.enum(['quick', 'detailed', 'granular']),
  family_members: z.array(FamilyMemberSchema).optional(),
  life_area_tag: z.string().optional(),
  active_task_count_by_member: z.record(z.string(), z.number()).optional(),
  family_id: z.string().uuid().optional(),
  member_id: z.string().uuid().optional(),
})

Deno.serve(async (req) => {
  const cors = handleCors(req)
  if (cors) return cors

  try {
    const body = await req.json()
    const parsed = InputSchema.safeParse(body)
    if (!parsed.success) {
      return new Response(
        JSON.stringify({ error: 'Invalid input', details: parsed.error.issues }),
        { status: 400, headers: jsonHeaders },
      )
    }

    const {
      task_title, task_description, detail_level,
      family_members, life_area_tag, active_task_count_by_member,
      family_id, member_id,
    } = parsed.data

    // Build user message with all context
    const parts: string[] = [
      `Task: ${task_title}`,
    ]
    if (task_description) {
      parts.push(`Description: ${task_description}`)
    }
    parts.push(`Detail level: ${detail_level}`)

    if (life_area_tag) {
      parts.push(`Life area: ${life_area_tag}`)
    }

    if (family_members && family_members.length > 0) {
      const memberLines = family_members.map(m => {
        const taskCount = active_task_count_by_member?.[m.id]
        const countStr = taskCount != null ? ` (${taskCount} active tasks)` : ''
        return `  - ${m.display_name} [${m.dashboard_mode || 'adult'}]${countStr}`
      })
      parts.push(`\nFamily members:\n${memberLines.join('\n')}`)
    }

    const userMessage = parts.join('\n')

    const aiResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://myaimcentral.com',
        'X-Title': 'MyAIM Central',
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: userMessage },
        ],
        max_tokens: 2048,
      }),
    })

    if (!aiResponse.ok) {
      const errText = await aiResponse.text()
      console.error('OpenRouter error:', aiResponse.status, errText)
      return new Response(
        JSON.stringify({ error: 'AI service error', details: errText }),
        { status: 502, headers: jsonHeaders },
      )
    }

    const result = await aiResponse.json()
    const content = (result.choices?.[0]?.message?.content || '').trim()
    const inputTokens = result.usage?.prompt_tokens || 0
    const outputTokens = result.usage?.completion_tokens || 0

    // Parse JSON response — handle potential markdown fencing
    let subtasks: unknown[] = []
    try {
      const cleaned = content.replace(/^```(?:json)?\s*/, '').replace(/\s*```$/, '')
      const parsed = JSON.parse(cleaned)
      subtasks = Array.isArray(parsed.subtasks) ? parsed.subtasks : []
    } catch {
      console.error('Failed to parse AI JSON response:', content)
      return new Response(
        JSON.stringify({ error: 'Failed to parse AI response', raw: content }),
        { status: 502, headers: jsonHeaders },
      )
    }

    if (family_id && member_id) {
      logAICost({
        familyId: family_id,
        memberId: member_id,
        featureKey: 'tasks_task_breaker_text',
        model: MODEL,
        inputTokens,
        outputTokens,
      })
    }

    return new Response(
      JSON.stringify({ subtasks, input_tokens: inputTokens, output_tokens: outputTokens }),
      { headers: jsonHeaders },
    )
  } catch (err) {
    console.error('task-breaker error:', err)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: jsonHeaders },
    )
  }
})
