/**
 * calendar-extract Edge Function (RR-DEPLOY-SCOPING follow-up, 2026-06-10)
 *
 * Dedicated single-item event parser: takes one piece of text already
 * classified as a calendar item ("Meeting at 4 today with Maritza...") and
 * extracts structured event details so EventCreationModal opens pre-filled —
 * date, time, title, location — instead of blank fields the user retypes.
 *
 * Founder request: "if it says meeting today at 4, it should automatically
 * have that date/time; if it's wrong, the user can edit."
 *
 * Why dedicated (not a reuse of mindsweep-sort): the "each AI tool gets its
 * own Edge Function" convention (CLAUDE.md #165 precedent). mindsweep-sort is
 * a multi-item brain-dump classifier; this is a single-item detail extractor.
 * The OUTPUT SHAPE deliberately matches mindsweep-sort's flat calendar
 * destination_detail (calendar_subtype, event_title, events[], start_date,
 * end_date, ...) so SortTab's queueItemToCalendarEvent and CalendarTab render
 * it with zero new client mapping. Unlike mindsweep-sort, this function
 * injects TODAY'S DATE so relative phrases ("today at 4", "tomorrow",
 * "Friday") resolve to real dates.
 *
 * Callers:
 *   - NotepadReviewRoute: at routing time when destination='calendar' —
 *     the queue row lands WITH content_details (fire-and-forget enrichment)
 *   - SortTab handleConfigure: on-demand when a calendar queue row has no
 *     usable details (legacy rows, enrichment failures)
 *
 * Haiku via OpenRouter. Cost logged to ai_usage_tracking (fire-and-forget).
 */
import { handleCors, jsonHeaders } from '../_shared/cors.ts'
import { authenticateRequest } from '../_shared/auth.ts'
import { detectCrisis, CRISIS_RESPONSE } from '../_shared/crisis-detection.ts'
import { logAICost } from '../_shared/cost-logger.ts'

const OPENROUTER_API_KEY = Deno.env.get('OPENROUTER_API_KEY')!
const HAIKU_MODEL = 'anthropic/claude-haiku-4.5'

interface RequestBody {
  content?: string
  /** Caller's local date YYYY-MM-DD — anchors "today"/"tomorrow"/weekday names. */
  today?: string
  family_id?: string
  member_id?: string
}

Deno.serve(async (req) => {
  const cors = handleCors(req)
  if (cors) return cors

  try {
    const auth = await authenticateRequest(req)
    if (auth instanceof Response) return auth

    const body = (await req.json()) as RequestBody
    const content = body.content?.trim()
    if (!content) {
      return new Response(JSON.stringify({ error: 'content is required' }), {
        status: 400,
        headers: jsonHeaders,
      })
    }
    const today = /^\d{4}-\d{2}-\d{2}$/.test(body.today ?? '') ? body.today : null

    // Convention #7 — crisis override is global. Gate before the model call.
    if (detectCrisis(content)) {
      return new Response(
        JSON.stringify({ crisis: true, response: CRISIS_RESPONSE }),
        { headers: jsonHeaders },
      )
    }

    const truncated = content.slice(0, 2000)

    const systemPrompt = `You extract structured calendar event details from one piece of text.
${today ? `Today's date is ${today}. Resolve relative dates against it: "today" = ${today}; "tomorrow" = the day after; weekday names ("Friday") = the NEXT occurrence of that weekday on or after today.` : ''}

Determine the calendar_subtype:
- "single" — one event, one date/time (appointment, game, class, meeting)
- "multi_day" — one event spanning multiple days (conference May 14-16, camp)
- "options" — one event with multiple available dates/times to pick from
- "recurring" — repeating schedule (every Tuesday, MWF at 2pm)
- "series" — multiple distinct scheduled events with different details per date

Respond with ONLY this JSON object (no explanation, no markdown):
{
  "calendar_subtype": "single" | "multi_day" | "options" | "recurring" | "series",
  "event_title": "short clean title (e.g. 'Meeting with Maritza' — drop times/dates from the title)",
  "event_location": "..." or null,
  "event_description": "remaining useful detail not captured elsewhere" or null,
  "events": [{"date": "YYYY-MM-DD", "start_time": "HH:MM" or null, "end_time": "HH:MM" or null, "notes": "..." or null}],
  "start_date": "YYYY-MM-DD" or null,
  "end_date": "YYYY-MM-DD" or null,
  "recurrence_days": ["monday", ...] or [],
  "attendee_names": ["..."] or [],
  "driver_name": "..." or null
}

Rules:
- Times are 24-hour HH:MM. "at 4" in a daytime work/school/meeting context means 16:00 unless the text clearly says morning.
- Always include at least one entry in "events" when a date can be determined. If NO date is determinable, use "events": [] — never invent a date.
- Only set driver_name if the text states it explicitly.
- If people are named as participants, list them in attendee_names exactly as written.`

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://myaimcentral.com',
        'X-Title': 'MyAIM Central',
      },
      body: JSON.stringify({
        model: HAIKU_MODEL,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: truncated },
        ],
        temperature: 0,
        max_tokens: 800,
      }),
    })

    if (!response.ok) {
      const errText = await response.text()
      console.error('calendar-extract OpenRouter error:', errText)
      return new Response(JSON.stringify({ error: 'AI extraction failed' }), {
        status: 502,
        headers: jsonHeaders,
      })
    }

    const data = await response.json()
    const raw = data.choices?.[0]?.message?.content as string | undefined
    if (!raw) {
      return new Response(JSON.stringify({ error: 'Empty AI response' }), {
        status: 502,
        headers: jsonHeaders,
      })
    }

    // Parse the model's JSON (strip accidental code fences defensively)
    let detail: Record<string, unknown>
    try {
      detail = JSON.parse(raw.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, ''))
    } catch {
      console.error('calendar-extract unparseable model output:', raw.slice(0, 300))
      return new Response(JSON.stringify({ error: 'Unparseable AI response' }), {
        status: 502,
        headers: jsonHeaders,
      })
    }

    // Minimal shape validation — never return a detail that would blank-crash
    // the client mapping. events must be an array of {date,...} objects.
    const events = Array.isArray(detail.events)
      ? (detail.events as Record<string, unknown>[]).filter(
          (e) => typeof e?.date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(e.date as string),
        )
      : []
    const destination_detail = {
      calendar_subtype: typeof detail.calendar_subtype === 'string' ? detail.calendar_subtype : 'single',
      event_title: typeof detail.event_title === 'string' && detail.event_title.trim() ? detail.event_title : truncated.slice(0, 120),
      event_location: typeof detail.event_location === 'string' ? detail.event_location : null,
      event_description: typeof detail.event_description === 'string' ? detail.event_description : null,
      events,
      start_date: typeof detail.start_date === 'string' ? detail.start_date : null,
      end_date: typeof detail.end_date === 'string' ? detail.end_date : null,
      recurrence_days: Array.isArray(detail.recurrence_days) ? detail.recurrence_days : [],
      attendee_names: Array.isArray(detail.attendee_names) ? detail.attendee_names : [],
      driver_name: typeof detail.driver_name === 'string' ? detail.driver_name : null,
      extracted_by: 'calendar-extract',
    }

    if (body.family_id && body.member_id) {
      logAICost({
        familyId: body.family_id,
        memberId: body.member_id,
        featureKey: 'calendar_extract',
        model: HAIKU_MODEL,
        inputTokens: data.usage?.prompt_tokens ?? Math.ceil(truncated.length / 4),
        outputTokens: data.usage?.completion_tokens ?? 200,
      })
    }

    return new Response(JSON.stringify({ destination_detail }), { headers: jsonHeaders })
  } catch (err) {
    console.error('calendar-extract error:', err)
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: jsonHeaders,
    })
  }
})
