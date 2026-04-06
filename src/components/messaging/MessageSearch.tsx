/**
 * MessageSearch — PRD-15
 *
 * Full-text search overlay across all conversations the member has access to.
 * Shows message snippets with conversation context.
 */

import { useState, useCallback, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { X, Search, Loader2, MessageCircle } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import { useFamilyMember } from '@/hooks/useFamilyMember'

interface MessageSearchProps {
  isOpen: boolean
  onClose: () => void
}

interface SearchResult {
  id: string
  thread_id: string
  content: string
  sender_display_name: string | null
  created_at: string
  thread_title: string | null
  space_name: string | null
}

export function MessageSearch({ isOpen, onClose }: MessageSearchProps) {
  const navigate = useNavigate()
  const { data: currentMember } = useFamilyMember()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [searching, setSearching] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (isOpen) inputRef.current?.focus()
  }, [isOpen])

  const performSearch = useCallback(async (searchQuery: string) => {
    if (!currentMember?.id || searchQuery.length < 2) {
      setResults([])
      return
    }

    setSearching(true)
    try {
      // Get spaces this member belongs to
      const { data: memberships } = await supabase
        .from('conversation_space_members')
        .select('space_id')
        .eq('family_member_id', currentMember.id)

      if (!memberships?.length) {
        setResults([])
        return
      }

      const spaceIds = memberships.map(m => m.space_id)

      // Get threads in those spaces
      const { data: threads } = await supabase
        .from('conversation_threads')
        .select('id, title, space_id, conversation_spaces!inner(name)')
        .in('space_id', spaceIds)

      if (!threads?.length) {
        setResults([])
        return
      }

      const threadIds = threads.map(t => t.id)
      const threadMap = new Map(threads.map(t => {
        const space = t.conversation_spaces as unknown as { name: string | null }
        return [t.id, { title: t.title, space_name: space?.name }]
      }))

      // Search messages by content (case-insensitive ILIKE)
      const { data: messages } = await supabase
        .from('messages')
        .select(`
          id, thread_id, content, created_at, sender_member_id,
          family_members!messages_sender_member_id_fkey ( display_name )
        `)
        .in('thread_id', threadIds)
        .ilike('content', `%${searchQuery}%`)
        .order('created_at', { ascending: false })
        .limit(20)

      const searchResults: SearchResult[] = (messages ?? []).map(msg => {
        const sender = msg.family_members as unknown as { display_name: string } | null
        const threadInfo = threadMap.get(msg.thread_id)
        return {
          id: msg.id,
          thread_id: msg.thread_id,
          content: msg.content,
          sender_display_name: sender?.display_name ?? null,
          created_at: msg.created_at,
          thread_title: threadInfo?.title ?? null,
          space_name: threadInfo?.space_name ?? null,
        }
      })

      setResults(searchResults)
    } catch (err) {
      console.error('[MessageSearch] Error:', err)
    } finally {
      setSearching(false)
    }
  }, [currentMember?.id])

  const handleChange = useCallback((value: string) => {
    setQuery(value)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => performSearch(value), 300)
  }, [performSearch])

  const handleResultClick = useCallback((threadId: string) => {
    onClose()
    navigate(`/messages/thread/${threadId}`)
  }, [navigate, onClose])

  if (!isOpen) return null

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 50,
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: 'var(--color-bg-primary)',
      }}
    >
      {/* Search header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          padding: '0.75rem 1rem',
          borderBottom: '1px solid var(--color-border)',
        }}
      >
        <Search size={18} style={{ color: 'var(--color-text-muted)', flexShrink: 0 }} />
        <input
          ref={inputRef}
          value={query}
          onChange={e => handleChange(e.target.value)}
          placeholder="Search messages..."
          style={{
            flex: 1,
            border: 'none',
            outline: 'none',
            fontSize: '0.9375rem',
            color: 'var(--color-text-primary)',
            backgroundColor: 'transparent',
            fontFamily: 'inherit',
          }}
        />
        <button
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: 'var(--color-text-muted)',
            padding: '0.25rem',
            display: 'flex',
          }}
          aria-label="Close search"
        >
          <X size={20} />
        </button>
      </div>

      {/* Results */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {searching && (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>
            <Loader2 size={20} className="animate-spin" style={{ display: 'inline-block' }} />
          </div>
        )}

        {!searching && query.length >= 2 && results.length === 0 && (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
            No messages found for "{query}"
          </div>
        )}

        {!searching && query.length < 2 && (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
            Type at least 2 characters to search
          </div>
        )}

        {results.map(result => (
          <button
            key={result.id}
            onClick={() => handleResultClick(result.thread_id)}
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '0.75rem',
              width: '100%',
              padding: '0.75rem 1rem',
              border: 'none',
              borderBottom: '1px solid var(--color-border)',
              background: 'transparent',
              cursor: 'pointer',
              textAlign: 'left',
            }}
          >
            <MessageCircle size={16} style={{ color: 'var(--color-text-muted)', marginTop: '0.125rem', flexShrink: 0 }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: '0.5rem' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                  {result.sender_display_name ?? 'Unknown'} in {result.space_name ?? result.thread_title ?? 'Thread'}
                </span>
                <span style={{ fontSize: '0.6875rem', color: 'var(--color-text-muted)', flexShrink: 0 }}>
                  {new Date(result.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                </span>
              </div>
              <p
                style={{
                  margin: '0.125rem 0 0',
                  fontSize: '0.8125rem',
                  color: 'var(--color-text-primary)',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {result.content}
              </p>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
