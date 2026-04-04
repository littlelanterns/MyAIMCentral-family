/**
 * mindsweep-email-intake — PRD-17B Email Forwarding Intake
 *
 * Receives forwarded emails (via webhook from email service — DNS not yet configured).
 * Validates sender against mindsweep_allowed_senders, extracts text content,
 * and either processes immediately or adds to holding queue based on settings.
 *
 * STUB: This function is code-complete but cannot receive emails until DNS is configured
 * for the family's sweep_email_address domain. The webhook URL would be:
 *   POST https://<project-ref>.supabase.co/functions/v1/mindsweep-email-intake
 *
 * Expected webhook payload (from email service like Resend, Postmark, or SendGrid):
 * {
 *   from: string,        // sender email address
 *   to: string,          // family sweep email address
 *   subject: string,
 *   text: string,        // plain text body
 *   html?: string,       // HTML body (stripped to text if text is empty)
 * }
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

interface EmailPayload {
  from: string
  to: string
  subject: string
  text: string
  html?: string
}

Deno.serve(async (req) => {
  // Only accept POST
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey)

  try {
    const payload: EmailPayload = await req.json()
    const senderEmail = extractEmail(payload.from).toLowerCase()
    const recipientEmail = extractEmail(payload.to).toLowerCase()

    // 1. Find the family by sweep email address
    const { data: family, error: famError } = await supabase
      .from('families')
      .select('id, sweep_email_enabled')
      .eq('sweep_email_address', recipientEmail)
      .single()

    if (famError || !family) {
      return new Response(JSON.stringify({ error: 'Unknown recipient' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    if (!family.sweep_email_enabled) {
      return new Response(JSON.stringify({ error: 'Email forwarding disabled for this family' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // 2. Validate sender against allowed senders list
    const { data: allowedSender } = await supabase
      .from('mindsweep_allowed_senders')
      .select('id')
      .eq('family_id', family.id)
      .eq('email_address', senderEmail)
      .maybeSingle()

    if (!allowedSender) {
      return new Response(JSON.stringify({ error: 'Sender not authorized' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // 3. Extract content — prefer text, fall back to stripping HTML
    const textContent = payload.text?.trim()
      || stripHtml(payload.html || '')
    const content = payload.subject
      ? `${payload.subject}\n\n${textContent}`
      : textContent

    if (!content.trim()) {
      return new Response(JSON.stringify({ error: 'Empty email content' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // 4. Find the primary parent (emails always go to mom's queue)
    const { data: primaryParent } = await supabase
      .from('family_members')
      .select('id')
      .eq('family_id', family.id)
      .eq('role', 'primary_parent')
      .single()

    if (!primaryParent) {
      return new Response(JSON.stringify({ error: 'No primary parent found' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // 5. Check if immediate processing is enabled
    const { data: memberSettings } = await supabase
      .from('mindsweep_settings')
      .select('email_process_immediately')
      .eq('member_id', primaryParent.id)
      .maybeSingle()

    const processImmediately = memberSettings?.email_process_immediately ?? true

    // 6. Add to holding queue
    const { error: insertError } = await supabase
      .from('mindsweep_holding')
      .insert({
        family_id: family.id,
        member_id: primaryParent.id,
        content: content.substring(0, 10000), // Cap at 10K chars
        content_type: 'email',
        source_channel: 'email_forward',
        link_url: null,
      })

    if (insertError) throw insertError

    // 7. If immediate processing, trigger mindsweep-sort
    // STUB: When DNS is configured, uncomment this to auto-process
    // if (processImmediately) {
    //   await supabase.functions.invoke('mindsweep-sort', {
    //     body: {
    //       items: [{ content, content_type: 'email' }],
    //       family_id: family.id,
    //       member_id: primaryParent.id,
    //       aggressiveness: 'always_ask',
    //       always_review_rules: [],
    //       custom_review_rules: [],
    //       source_channel: 'email_forward',
    //       input_type: 'email',
    //       family_member_names: [],
    //     },
    //   })
    // }

    return new Response(JSON.stringify({
      success: true,
      processed_immediately: processImmediately,
      family_id: family.id,
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (err) {
    console.error('Email intake error:', err)
    return new Response(JSON.stringify({ error: 'Internal error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
})

// Extract email address from "Name <email@example.com>" format
function extractEmail(raw: string): string {
  const match = raw.match(/<([^>]+)>/)
  return match ? match[1] : raw.trim()
}

// Basic HTML tag stripping
function stripHtml(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}
