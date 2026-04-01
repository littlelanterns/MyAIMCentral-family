/**
 * useBookDiscussions (PRD-23)
 * CRUD + message send/receive for book discussions.
 * Discussion records live in bookshelf_discussions / bookshelf_discussion_messages.
 * AI responses come from the bookshelf-discuss Edge Function.
 */
import { useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useFamilyMember } from './useFamilyMember'
import type {
  BookShelfDiscussion,
  BookShelfDiscussionMessage,
  DiscussionType,
  DiscussionAudience,
} from '@/types/bookshelf'

export function useBookDiscussions() {
  const { data: member } = useFamilyMember()
  const [discussions, setDiscussions] = useState<BookShelfDiscussion[]>([])
  const [activeDiscussion, setActiveDiscussion] = useState<BookShelfDiscussion | null>(null)
  const [messages, setMessages] = useState<BookShelfDiscussionMessage[]>([])
  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // --- Fetch all discussions for this member ---
  const fetchDiscussions = useCallback(async () => {
    if (!member) return
    setLoading(true)
    try {
      const { data, error: fetchErr } = await supabase
        .from('bookshelf_discussions')
        .select('*')
        .eq('family_member_id', member.id)
        .order('updated_at', { ascending: false })

      if (fetchErr) {
        setError(fetchErr.message)
        return
      }
      setDiscussions(data || [])
    } finally {
      setLoading(false)
    }
  }, [member])

  // --- Start a new discussion ---
  const startDiscussion = useCallback(async (
    bookshelfItemIds: string[],
    discussionType: DiscussionType,
    audience: DiscussionAudience,
  ): Promise<BookShelfDiscussion | null> => {
    if (!member) return null
    setSending(true)
    setError(null)

    try {
      // Create the discussion record
      const { data: discussion, error: createErr } = await supabase
        .from('bookshelf_discussions')
        .insert({
          family_id: member.family_id,
          family_member_id: member.id,
          bookshelf_item_ids: bookshelfItemIds,
          discussion_type: discussionType,
          audience,
        })
        .select('*')
        .single()

      if (createErr || !discussion) {
        setError(createErr?.message || 'Failed to create discussion')
        return null
      }

      setActiveDiscussion(discussion)
      setMessages([])

      // Call Edge Function for AI opening
      const { data: aiResponse, error: aiErr } = await supabase.functions.invoke('bookshelf-discuss', {
        body: {
          bookshelf_item_ids: bookshelfItemIds,
          discussion_type: discussionType,
          audience,
          message: '',
          conversation_history: [],
          family_id: member.family_id,
          member_id: member.id,
        },
      })

      if (aiErr || aiResponse?.error) {
        setError(aiErr?.message || aiResponse?.error || 'AI response failed')
        return discussion
      }

      const aiContent = aiResponse?.content || ''
      if (aiContent) {
        // Save AI opening message
        const { data: aiMsg } = await supabase
          .from('bookshelf_discussion_messages')
          .insert({
            discussion_id: discussion.id,
            role: 'assistant',
            content: aiContent,
            metadata: {},
          })
          .select('*')
          .single()

        if (aiMsg) setMessages([aiMsg])

        // Auto-generate title
        const snippet = aiContent.substring(0, 80).replace(/\n/g, ' ').trim()
        const autoTitle = snippet.length >= 80 ? snippet.substring(0, 77) + '...' : snippet

        await supabase
          .from('bookshelf_discussions')
          .update({ title: autoTitle })
          .eq('id', discussion.id)

        discussion.title = autoTitle
        setActiveDiscussion({ ...discussion, title: autoTitle })
      }

      return discussion
    } catch (err) {
      setError((err as Error).message)
      return null
    } finally {
      setSending(false)
    }
  }, [member])

  // --- Send a message in an active discussion ---
  const sendMessage = useCallback(async (
    discussionId: string,
    content: string,
  ): Promise<BookShelfDiscussionMessage | null> => {
    if (!member || !content.trim()) return null
    setSending(true)
    setError(null)

    try {
      // Save user message
      const { data: userMsg, error: userErr } = await supabase
        .from('bookshelf_discussion_messages')
        .insert({
          discussion_id: discussionId,
          role: 'user',
          content: content.trim(),
          metadata: {},
        })
        .select('*')
        .single()

      if (userErr || !userMsg) {
        setError(userErr?.message || 'Failed to save message')
        return null
      }

      // Optimistic: add user message immediately
      setMessages(prev => [...prev, userMsg])

      // Find discussion details
      const discussion = activeDiscussion?.id === discussionId
        ? activeDiscussion
        : discussions.find(d => d.id === discussionId)

      if (!discussion) {
        setError('Discussion not found')
        return userMsg
      }

      // Build conversation history
      const currentMessages = [...messages, userMsg]
      const conversationHistory = currentMessages.map(m => ({
        role: m.role,
        content: m.content,
      }))

      // Call AI
      const { data: aiResponse, error: aiErr } = await supabase.functions.invoke('bookshelf-discuss', {
        body: {
          bookshelf_item_ids: discussion.bookshelf_item_ids,
          discussion_type: discussion.discussion_type,
          audience: discussion.audience,
          message: content.trim(),
          conversation_history: conversationHistory.slice(0, -1),
          family_id: member.family_id,
          member_id: member.id,
        },
      })

      if (aiErr || aiResponse?.error) {
        setError(aiErr?.message || aiResponse?.error || 'AI response failed')
        return userMsg
      }

      const aiContent = aiResponse?.content || ''
      if (aiContent) {
        const { data: aiMsg } = await supabase
          .from('bookshelf_discussion_messages')
          .insert({
            discussion_id: discussionId,
            role: 'assistant',
            content: aiContent,
            metadata: {},
          })
          .select('*')
          .single()

        if (aiMsg) setMessages(prev => [...prev, aiMsg])
      }

      // Update discussion timestamp
      await supabase
        .from('bookshelf_discussions')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', discussionId)

      return userMsg
    } catch (err) {
      setError((err as Error).message)
      return null
    } finally {
      setSending(false)
    }
  }, [member, activeDiscussion, discussions, messages])

  // --- Continue an existing discussion ---
  const continueDiscussion = useCallback(async (
    discussionId: string,
  ): Promise<BookShelfDiscussion | null> => {
    if (!member) return null
    setLoading(true)
    setError(null)

    try {
      const { data: discussion, error: discErr } = await supabase
        .from('bookshelf_discussions')
        .select('*')
        .eq('id', discussionId)
        .eq('family_member_id', member.id)
        .single()

      if (discErr || !discussion) {
        setError(discErr?.message || 'Discussion not found')
        return null
      }

      const { data: msgs, error: msgsErr } = await supabase
        .from('bookshelf_discussion_messages')
        .select('*')
        .eq('discussion_id', discussionId)
        .order('created_at', { ascending: true })

      if (msgsErr) {
        setError(msgsErr.message)
        return null
      }

      setActiveDiscussion(discussion)
      setMessages(msgs || [])
      return discussion
    } catch (err) {
      setError((err as Error).message)
      return null
    } finally {
      setLoading(false)
    }
  }, [member])

  // --- Update audience mid-conversation ---
  const updateAudience = useCallback(async (
    discussionId: string,
    audience: DiscussionAudience,
  ) => {
    if (!member) return
    const { error: updateErr } = await supabase
      .from('bookshelf_discussions')
      .update({ audience })
      .eq('id', discussionId)
      .eq('family_member_id', member.id)

    if (updateErr) {
      setError(updateErr.message)
      return
    }

    setActiveDiscussion(prev => prev ? { ...prev, audience } : null)
    setDiscussions(prev =>
      prev.map(d => d.id === discussionId ? { ...d, audience } : d)
    )
  }, [member])

  // --- Copy conversation to clipboard ---
  const copyToClipboard = useCallback(async () => {
    const text = messages.map(m => {
      const label = m.role === 'user' ? 'You' : 'LiLa'
      return `${label}:\n${m.content}`
    }).join('\n\n---\n\n')

    await navigator.clipboard.writeText(text)
  }, [messages])

  // --- Delete a discussion ---
  const deleteDiscussion = useCallback(async (discussionId: string) => {
    if (!member) return

    // Messages cascade on delete via FK
    await supabase
      .from('bookshelf_discussions')
      .delete()
      .eq('id', discussionId)
      .eq('family_member_id', member.id)

    setDiscussions(prev => prev.filter(d => d.id !== discussionId))

    if (activeDiscussion?.id === discussionId) {
      setActiveDiscussion(null)
      setMessages([])
    }
  }, [member, activeDiscussion])

  // --- Close active discussion (clear local state) ---
  const closeDiscussion = useCallback(() => {
    setActiveDiscussion(null)
    setMessages([])
    setError(null)
  }, [])

  return {
    discussions,
    activeDiscussion,
    messages,
    loading,
    sending,
    error,
    fetchDiscussions,
    startDiscussion,
    sendMessage,
    continueDiscussion,
    updateAudience,
    copyToClipboard,
    deleteDiscussion,
    closeDiscussion,
  }
}
