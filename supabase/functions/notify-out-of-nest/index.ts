/**
 * notify-out-of-nest — PRD-15 Phase E
 *
 * Stub Edge Function for email notifications to Out of Nest family members.
 * Receives a message event, looks up the Out of Nest member's email,
 * formats the notification body, and logs the intent.
 *
 * Actual email delivery is deferred — requires Supabase email service
 * or external provider wiring. This function is ready to extend.
 */

import { handleCors, jsonHeaders } from '../_shared/cors.ts'
import { authenticateRequest } from '../_shared/auth.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const serviceClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

interface NotifyRequest {
  message_id: string
  thread_id: string
  out_of_nest_member_id: string
}

Deno.serve(async (req: Request) => {
  const cors = handleCors(req)
  if (cors) return cors

  try {
    // ── Auth (service-level or authenticated user) ──
    const auth = await authenticateRequest(req)
    if (auth instanceof Response) return auth

    // ── Input ──
    const { message_id, thread_id, out_of_nest_member_id } =
      (await req.json()) as NotifyRequest

    if (!message_id || !thread_id || !out_of_nest_member_id) {
      return new Response(
        JSON.stringify({ error: 'message_id, thread_id, and out_of_nest_member_id required' }),
        { status: 400, headers: jsonHeaders },
      )
    }

    // ── Look up Out of Nest member ──
    const { data: oonMember, error: oonErr } = await serviceClient
      .from('out_of_nest_members')
      .select('id, name, email, family_id')
      .eq('id', out_of_nest_member_id)
      .single()

    if (oonErr || !oonMember) {
      return new Response(
        JSON.stringify({ error: 'Out of Nest member not found' }),
        { status: 404, headers: jsonHeaders },
      )
    }

    if (!oonMember.email) {
      return new Response(
        JSON.stringify({ sent: false, reason: 'No email on file' }),
        { headers: jsonHeaders },
      )
    }

    // ── Load the message ──
    const { data: message } = await serviceClient
      .from('messages')
      .select(`
        content, message_type, created_at,
        family_members!messages_sender_member_id_fkey (display_name)
      `)
      .eq('id', message_id)
      .single()

    if (!message) {
      return new Response(
        JSON.stringify({ error: 'Message not found' }),
        { status: 404, headers: jsonHeaders },
      )
    }

    const senderName = (message.family_members as any)?.display_name || 'A family member'

    // ── Load thread title ──
    const { data: thread } = await serviceClient
      .from('conversation_threads')
      .select('title')
      .eq('id', thread_id)
      .single()

    // ── Format notification ──
    const emailSubject = `New message from ${senderName} in MyAIM Family`
    const emailBody = [
      `Hi ${oonMember.name},`,
      '',
      `${senderName} sent a message${thread?.title ? ` in "${thread.title}"` : ''}:`,
      '',
      `"${message.content.slice(0, 500)}${message.content.length > 500 ? '...' : ''}"`,
      '',
      'Log in to MyAIM Central to reply.',
      '',
      '— MyAIM Family',
    ].join('\n')

    // ── Log the notification intent (STUB — no actual sending) ──
    console.log('[notify-out-of-nest] Email notification prepared (not sent):')
    console.log(`  To: ${oonMember.email}`)
    console.log(`  Subject: ${emailSubject}`)
    console.log(`  Body length: ${emailBody.length} chars`)

    // Create notification record for tracking
    await serviceClient.from('notifications').insert({
      family_id: oonMember.family_id,
      recipient_member_id: out_of_nest_member_id,
      notification_type: 'new_message',
      category: 'messages',
      title: emailSubject,
      body: `${senderName}: ${message.content.slice(0, 200)}`,
      source_type: 'messages',
      source_reference_id: message_id,
      action_url: `/messages/thread/${thread_id}`,
      delivery_method: 'email',
      // email_sent_at left NULL — will be set when actual delivery is wired
    }).catch((err: Error) => {
      // Fire-and-forget notification record
      console.error('[notify-out-of-nest] Failed to create notification record:', err)
    })

    return new Response(
      JSON.stringify({
        sent: false,
        reason: 'Email delivery not yet wired — notification logged',
        email: oonMember.email,
        subject: emailSubject,
      }),
      { headers: jsonHeaders },
    )
  } catch (err) {
    console.error('[notify-out-of-nest] Error:', err)
    return new Response(JSON.stringify({ error: 'Internal error' }), {
      status: 500, headers: jsonHeaders,
    })
  }
})
