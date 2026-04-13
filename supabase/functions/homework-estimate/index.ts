// MyAIM Central — Homework Time Estimate Edge Function (PRD-28)
// LiLa homeschool_time_review guided mode: Haiku estimates subject allocation
// from a child's learning description + family's configured subjects.
// Non-streaming, JSON-only output, Human-in-the-Mix on the caller side.

import { z } from 'https://esm.sh/zod@3.23.8'
import { handleCors, jsonHeaders } from '../_shared/cors.ts'
import { logAICost } from '../_shared/cost-logger.ts'

const OPENROUTER_API_KEY = Deno.env.get('OPENROUTER_API_KEY')!
const MODEL = 'anthropic/claude-haiku-4.5'

const SYSTEM_PROMPT = `You are an assistant that helps homeschool families estimate how a learning session breaks down by subject.

Given a description of what a child did and the family's list of subjects, estimate:
1. Which subjects were covered
2. How many minutes should be allocated to each subject
3. Your confidence level for each allocation

Rules:
- Only assign subjects from the provided list — never invent new ones
- If the activity clearly covers one subject, assign all time to it
- If multiple subjects overlap, split the time based on emphasis
- The total minutes across all subjects should equal the total session time
- Use "full" allocation mode: each subject gets the full session time if they overlap (this is the default)
- For "strict" mode: minutes must sum to exactly the total — divide proportionally
- Be generous in your subject matching — reading a science book counts as both Science and Reading
- Explain your reasoning briefly so mom can make an informed decision

Respond with ONLY a valid JSON object. No markdown, no code fences, no explanation outside the JSON.
Format:
{
  "allocations": [
    {
      "subject_id": "uuid",
      "subject_name": "Subject Name",
      "minutes": 30,
      "confidence": 0.9,
      "reasoning": "Brief explanation"
    }
  ],
  "total_minutes_input": 45,
  "notes": "Optional overall note about the estimation"
}`

const SubjectSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
})

const InputSchema = z.object({
  description: z.string().min(1),
  total_minutes: z.number().positive(),
  subjects: z.array(SubjectSchema).min(1),
  allocation_mode: z.enum(['full', 'weighted', 'strict']).default('full'),
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

    const { description, total_minutes, subjects, allocation_mode, family_id, member_id } = parsed.data

    const subjectList = subjects.map(s => `- ${s.name} (id: ${s.id})`).join('\n')
    const userMessage = `A child spent ${total_minutes} minutes on the following activity:

"${description}"

The family's configured subjects are:
${subjectList}

Allocation mode: ${allocation_mode}
${allocation_mode === 'strict' ? 'IMPORTANT: In strict mode, the minutes across all subjects must sum to exactly ' + total_minutes + '.' : ''}
${allocation_mode === 'full' ? 'In full mode, each subject can receive the full session time if it applies.' : ''}

Please estimate the subject allocation.`

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
        max_tokens: 1024,
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

    // Parse JSON — handle markdown fences if Haiku wraps output
    let jsonStr = content
    const fenceMatch = content.match(/```(?:json)?\s*\n?([\s\S]*?)\n?\s*```/)
    if (fenceMatch) jsonStr = fenceMatch[1]

    let estimation
    try {
      estimation = JSON.parse(jsonStr)
    } catch {
      return new Response(
        JSON.stringify({ error: 'Failed to parse AI response', raw: content }),
        { status: 500, headers: jsonHeaders },
      )
    }

    // Log cost (fire and forget)
    const inputTokens = result.usage?.prompt_tokens ?? 0
    const outputTokens = result.usage?.completion_tokens ?? 0
    if (family_id && member_id) {
      logAICost({
        family_id,
        member_id,
        feature_key: 'homeschool_time_review',
        model: MODEL,
        tokens_input: inputTokens,
        tokens_output: outputTokens,
      }).catch(() => { /* fire and forget */ })
    }

    return new Response(
      JSON.stringify({
        ...estimation,
        model: MODEL,
        input_tokens: inputTokens,
        output_tokens: outputTokens,
      }),
      { status: 200, headers: jsonHeaders },
    )

  } catch (err) {
    console.error('homework-estimate error:', err)
    return new Response(
      JSON.stringify({ error: 'Internal error', message: String(err) }),
      { status: 500, headers: jsonHeaders },
    )
  }
})
