import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useCallback, useRef, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { sendAIMessage, extractJSON } from '@/lib/ai/send-ai-message'

// ─── Types ───────────────────────────────────────────────────

export interface NotepadTab {
  id: string
  family_id: string
  member_id: string
  title: string
  content: string
  status: 'active' | 'routed' | 'archived'
  routed_to: string | null
  routed_reference_id: string | null
  source_type: 'manual' | 'voice' | 'edit_in_notepad' | 'lila_optimizer' | 'rhythm_capture'
  source_reference_id: string | null
  is_auto_named: boolean
  sort_order: number
  created_at: string
  updated_at: string
  archived_at: string | null
}

export interface NotepadExtractedItem {
  id: string
  family_id: string | null
  tab_id: string
  routing_destination: string
  extracted_content: string
  item_type: string
  suggested_destination: string | null
  actual_destination: string | null
  confidence: number
  status: 'pending' | 'routed' | 'skipped' | 'dismissed'
  routed_reference_id: string | null
  created_at: string
}

export interface NotepadRoutingStat {
  id: string
  family_id: string
  member_id: string
  destination: string
  count: number
  last_routed_at: string | null
}

// ─── Destination Registry ────────────────────────────────────

export const ROUTING_DESTINATIONS = [
  { key: 'calendar', label: 'Calendar', icon: 'Calendar' },
  { key: 'tasks', label: 'Tasks', icon: 'CheckSquare' },
  { key: 'list', label: 'List', icon: 'List' },
  { key: 'journal', label: 'Journal', icon: 'BookOpen' },
  { key: 'guiding_stars', label: 'Guiding Stars', icon: 'Star' },
  { key: 'best_intentions', label: 'Best Intentions', icon: 'Heart' },
  { key: 'victory', label: 'Victory', icon: 'Trophy' },
  { key: 'track', label: 'Track', icon: 'BarChart3' },
  { key: 'message', label: 'Message', icon: 'MessageCircle' },
  { key: 'agenda', label: 'Agenda', icon: 'ListChecks' },
  { key: 'innerworkings', label: 'InnerWorkings', icon: 'Brain' },
  { key: 'optimizer', label: 'Optimizer', icon: 'Wand2' },
  { key: 'quick_note', label: 'Quick Note', icon: 'StickyNote' },
] as const

export type RoutingDestination = typeof ROUTING_DESTINATIONS[number]['key']

// ─── Queries ─────────────────────────────────────────────────

export function useNotepadTabs(memberId: string | undefined) {
  return useQuery({
    queryKey: ['notepad-tabs', memberId],
    queryFn: async () => {
      if (!memberId) return []
      const { data, error } = await supabase
        .from('notepad_tabs')
        .select('*')
        .eq('member_id', memberId)
        .eq('status', 'active')
        .order('sort_order')
        .order('created_at')
      if (error) throw error
      return data as NotepadTab[]
    },
    enabled: !!memberId,
  })
}

export function useNotepadHistory(memberId: string | undefined) {
  return useQuery({
    queryKey: ['notepad-history', memberId],
    queryFn: async () => {
      if (!memberId) return []
      const { data, error } = await supabase
        .from('notepad_tabs')
        .select('*')
        .eq('member_id', memberId)
        .in('status', ['routed', 'archived'])
        .order('updated_at', { ascending: false })
        .limit(50)
      if (error) throw error
      return data as NotepadTab[]
    },
    enabled: !!memberId,
  })
}

export function useRoutingStats(memberId: string | undefined) {
  return useQuery({
    queryKey: ['notepad-routing-stats', memberId],
    queryFn: async () => {
      if (!memberId) return []
      const { data, error } = await supabase
        .from('notepad_routing_stats')
        .select('*')
        .eq('member_id', memberId)
        .order('count', { ascending: false })
      if (error) throw error
      return data as NotepadRoutingStat[]
    },
    enabled: !!memberId,
  })
}

export function useExtractedItems(tabId: string | undefined) {
  return useQuery({
    queryKey: ['extracted-items', tabId],
    queryFn: async () => {
      if (!tabId) return []
      const { data, error } = await supabase
        .from('notepad_extracted_items')
        .select('*')
        .eq('tab_id', tabId)
        .order('created_at')
      if (error) throw error
      return data as NotepadExtractedItem[]
    },
    enabled: !!tabId,
  })
}

// ─── Mutations ───────────────────────────────────────────────

export function useCreateNotepadTab() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (tab: {
      family_id: string
      member_id: string
      title?: string
      content?: string
      source_type?: NotepadTab['source_type']
      source_reference_id?: string
    }) => {
      const { data, error } = await supabase
        .from('notepad_tabs')
        .insert({
          family_id: tab.family_id,
          member_id: tab.member_id,
          title: tab.title || 'New Tab',
          content: tab.content || '',
          source_type: tab.source_type || 'manual',
          source_reference_id: tab.source_reference_id || null,
          is_auto_named: !tab.title,
        })
        .select()
        .single()
      if (error) throw error
      return data as NotepadTab
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['notepad-tabs', data.member_id] })
    },
  })
}

export function useUpdateNotepadTab() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, memberId, ...updates }: {
      id: string
      memberId: string
      title?: string
      content?: string
      is_auto_named?: boolean
      status?: NotepadTab['status']
      routed_to?: string
      routed_reference_id?: string
      archived_at?: string
    }) => {
      const { data, error } = await supabase
        .from('notepad_tabs')
        .update(updates)
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return { ...data, memberId } as NotepadTab & { memberId: string }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['notepad-tabs', data.memberId] })
      queryClient.invalidateQueries({ queryKey: ['notepad-history', data.memberId] })
    },
  })
}

export function useDeleteNotepadTab() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, memberId }: { id: string; memberId: string }) => {
      const { error } = await supabase
        .from('notepad_tabs')
        .delete()
        .eq('id', id)
      if (error) throw error
      return memberId
    },
    onSuccess: (memberId) => {
      queryClient.invalidateQueries({ queryKey: ['notepad-tabs', memberId] })
      queryClient.invalidateQueries({ queryKey: ['notepad-history', memberId] })
    },
  })
}

export function useRouteExtractedItem() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, status, actual_destination, routed_reference_id }: {
      id: string
      status: 'routed' | 'skipped' | 'dismissed'
      actual_destination?: string
      routed_reference_id?: string
    }) => {
      const { data, error } = await supabase
        .from('notepad_extracted_items')
        .update({ status, actual_destination, routed_reference_id })
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data as NotepadExtractedItem
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['extracted-items', data.tab_id] })
    },
  })
}

export function useUpdateRoutingStat() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ familyId, memberId, destination }: {
      familyId: string
      memberId: string
      destination: string
    }) => {
      // Upsert: increment count or create new stat
      const { data: existing } = await supabase
        .from('notepad_routing_stats')
        .select('id, count')
        .eq('member_id', memberId)
        .eq('destination', destination)
        .maybeSingle()

      if (existing) {
        const { error } = await supabase
          .from('notepad_routing_stats')
          .update({ count: existing.count + 1, last_routed_at: new Date().toISOString() })
          .eq('id', existing.id)
        if (error) throw error
      } else {
        const { error } = await supabase
          .from('notepad_routing_stats')
          .insert({
            family_id: familyId,
            member_id: memberId,
            destination,
            count: 1,
            last_routed_at: new Date().toISOString(),
          })
        if (error) throw error
      }
      return { memberId }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['notepad-routing-stats', data.memberId] })
    },
  })
}

// ─── AI Auto-Title ───────────────────────────────────────────

export function useAutoTitle() {
  const updateTab = useUpdateNotepadTab()
  const pendingTitles = useRef<Set<string>>(new Set())

  const generateTitle = useCallback(async (tab: NotepadTab) => {
    if (!tab.is_auto_named) return
    if (pendingTitles.current.has(tab.id)) return
    if ((tab.content || '').length < 30) return

    pendingTitles.current.add(tab.id)
    try {
      const response = await sendAIMessage(
        'Generate a concise 3-6 word title for this notepad content. Return ONLY the title text, nothing else.',
        [{ role: 'user', content: tab.content || '' }],
        50,
        'haiku',
      )
      const title = response.trim().replace(/^["']|["']$/g, '')
      if (title && title.length > 0 && title.length < 60) {
        updateTab.mutate({ id: tab.id, memberId: tab.member_id, title })
      }
    } catch {
      // Non-critical — tab keeps default title
    } finally {
      pendingTitles.current.delete(tab.id)
    }
  }, [updateTab])

  return generateTitle
}

// ─── AI Extraction ───────────────────────────────────────────

interface ExtractedItemRaw {
  text: string
  type: string
  destination: string
  confidence: number
}

export function useExtractContent() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ tabId, familyId, content }: {
      tabId: string
      familyId: string
      content: string
    }) => {
      const systemPrompt = `You are an AI extraction assistant for a family management app. Analyze the user's text and extract discrete actionable items.

For each item, return a JSON array of objects with:
- "text": the extracted text (clean, complete sentence)
- "type": one of: action_item, reflection, revelation, value, victory, trackable, meeting_followup, list_item, general
- "destination": suggested routing destination, one of: tasks, journal, best_intentions, victory, calendar, innerworkings, guiding_stars, quick_note, list, track, agenda, message, optimizer
- "confidence": number 0.00-1.00 indicating how certain you are

Rules:
- Extract MORE items rather than fewer — let the user skip what's irrelevant
- If uncertain about categorization, default destination to "journal"
- Action items → tasks, emotional insights → journal, personal revelations → innerworkings
- Goals/commitments → best_intentions, accomplishments → victory
- Shopping/needs → list, dates/events → calendar, data points → track

Return ONLY a JSON array. No other text.`

      const response = await sendAIMessage(
        systemPrompt,
        [{ role: 'user', content }],
        2048,
        'haiku',
      )

      const items = extractJSON<ExtractedItemRaw[]>(response)
      if (!items || !Array.isArray(items) || items.length === 0) {
        return []
      }

      // Insert extracted items into database
      const records = items.map(item => ({
        tab_id: tabId,
        family_id: familyId,
        routing_destination: item.destination || 'journal',
        extracted_content: item.text,
        item_type: item.type || 'general',
        suggested_destination: item.destination || 'journal',
        confidence: Math.min(1, Math.max(0, item.confidence || 0.5)),
        status: 'pending' as const,
      }))

      const { data, error } = await supabase
        .from('notepad_extracted_items')
        .insert(records)
        .select()

      if (error) throw error
      return data as NotepadExtractedItem[]
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['extracted-items', variables.tabId] })
    },
  })
}

// ─── Autosave Hook ───────────────────────────────────────────

export function useAutosave(tab: NotepadTab | null) {
  const updateTab = useUpdateNotepadTab()
  const autoTitle = useAutoTitle()
  const saveTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const titleTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const lastSavedContent = useRef<string>('')

  useEffect(() => {
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current)
      if (titleTimer.current) clearTimeout(titleTimer.current)
    }
  }, [])

  const save = useCallback((content: string) => {
    if (!tab) return
    if (content === lastSavedContent.current) return

    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => {
      lastSavedContent.current = content
      updateTab.mutate({ id: tab.id, memberId: tab.member_id, content })
    }, 500)

    // Auto-title after 30+ chars, 2s delay, only once (when is_auto_named)
    if (tab.is_auto_named && content.length >= 30) {
      if (titleTimer.current) clearTimeout(titleTimer.current)
      titleTimer.current = setTimeout(() => {
        autoTitle({ ...tab, content })
      }, 2000)
    }
  }, [tab, updateTab, autoTitle])

  // Track the initial content to avoid unnecessary saves
  useEffect(() => {
    if (tab) lastSavedContent.current = tab.content || ''
  }, [tab?.id])

  return save
}

// ─── Route Content to Destination ────────────────────────────

export function useRouteContent() {
  const queryClient = useQueryClient()
  const updateStat = useUpdateRoutingStat()

  return useMutation({
    mutationFn: async ({ tab, destination, subType, familyId }: {
      tab: NotepadTab
      destination: RoutingDestination
      subType?: string
      familyId: string
    }) => {
      let referenceId: string | null = null
      const content = tab.content || ''

      // Route to the appropriate table based on destination
      switch (destination) {
        case 'journal': {
          const entryType = subType || 'journal_entry'
          const { data, error } = await supabase
            .from('journal_entries')
            .insert({
              family_id: familyId,
              member_id: tab.member_id,
              entry_type: entryType,
              content,
              visibility: 'private',
              tags: [],
            })
            .select('id')
            .single()
          if (error) throw error
          referenceId = data.id
          break
        }
        case 'quick_note': {
          // Quick Note → journal_entries with entry_type = 'quick_note' (PRD-08 #9)
          const { data, error } = await supabase
            .from('journal_entries')
            .insert({
              family_id: familyId,
              member_id: tab.member_id,
              entry_type: 'quick_note',
              content,
              visibility: 'private',
              tags: [],
            })
            .select('id')
            .single()
          if (error) throw error
          referenceId = data.id
          break
        }
        case 'best_intentions': {
          const { data, error } = await supabase
            .from('best_intentions')
            .insert({
              family_id: familyId,
              member_id: tab.member_id,
              statement: content,
              source: 'manual',
            })
            .select('id')
            .single()
          if (error) throw error
          referenceId = data.id
          break
        }
        case 'victory': {
          const { data, error } = await supabase
            .from('victories')
            .insert({
              family_id: familyId,
              family_member_id: tab.member_id,
              description: content,
              source: 'notepad_routed',
              member_type: 'adult',
              importance: 'standard',
            })
            .select('id')
            .single()
          if (error) throw error
          referenceId = data.id
          break
        }
        case 'guiding_stars': {
          const { data, error } = await supabase
            .from('guiding_stars')
            .insert({
              family_id: familyId,
              member_id: tab.member_id,
              content,
              source: 'manual',
            })
            .select('id')
            .single()
          if (error) throw error
          referenceId = data.id
          break
        }
        case 'innerworkings': {
          const category = subType || 'personal_growth'
          const { data, error } = await supabase
            .from('self_knowledge')
            .insert({
              family_id: familyId,
              member_id: tab.member_id,
              category,
              content,
              source_type: 'manual',
            })
            .select('id')
            .single()
          if (error) throw error
          referenceId = data.id
          break
        }
        case 'tasks':
        case 'list': {
          // Deposit into studio_queue
          const { data, error } = await supabase
            .from('studio_queue')
            .insert({
              family_id: familyId,
              owner_id: tab.member_id,
              destination: destination === 'tasks' ? 'task' : 'list',
              content,
              source: 'notepad',
              source_reference_id: tab.id,
              structure_flag: subType || null,
            })
            .select('id')
            .single()
          if (error) throw error
          referenceId = data.id
          break
        }
        default: {
          // For calendar, track, agenda, message, optimizer — deposit to studio_queue
          const { data, error } = await supabase
            .from('studio_queue')
            .insert({
              family_id: familyId,
              owner_id: tab.member_id,
              destination,
              content,
              source: 'notepad',
              source_reference_id: tab.id,
            })
            .select('id')
            .single()
          if (error) throw error
          referenceId = data.id
          break
        }
      }

      // Mark tab as routed
      await supabase
        .from('notepad_tabs')
        .update({
          status: 'routed',
          routed_to: destination,
          routed_reference_id: referenceId,
        })
        .eq('id', tab.id)

      // Update routing stats
      updateStat.mutate({ familyId, memberId: tab.member_id, destination })

      return { tabId: tab.id, memberId: tab.member_id, referenceId, destination }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['notepad-tabs', data.memberId] })
      queryClient.invalidateQueries({ queryKey: ['notepad-history', data.memberId] })
    },
  })
}

// ─── Undo Route ──────────────────────────────────────────────

export function useUndoRoute() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ tab, destination, referenceId }: {
      tab: NotepadTab
      destination: string
      referenceId: string | null
    }) => {
      // Restore tab to active
      await supabase
        .from('notepad_tabs')
        .update({ status: 'active', routed_to: null, routed_reference_id: null })
        .eq('id', tab.id)

      // Delete the created record at the destination
      if (referenceId) {
        const tableMap: Record<string, string> = {
          journal: 'journal_entries',
          quick_note: 'journal_entries',
          best_intentions: 'best_intentions',
          victory: 'victories',
          guiding_stars: 'guiding_stars',
          innerworkings: 'self_knowledge',
          tasks: 'studio_queue',
          list: 'studio_queue',
          calendar: 'studio_queue',
          track: 'studio_queue',
          agenda: 'studio_queue',
          message: 'studio_queue',
          request: 'family_requests',
          optimizer: 'studio_queue',
        }
        const table = tableMap[destination]
        if (table) {
          await supabase.from(table).delete().eq('id', referenceId)
        }
      }

      return { memberId: tab.member_id }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['notepad-tabs', data.memberId] })
      queryClient.invalidateQueries({ queryKey: ['notepad-history', data.memberId] })
    },
  })
}
