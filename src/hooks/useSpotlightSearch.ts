/**
 * useSpotlightSearch — search logic hook for Spotlight Search (Cmd+K).
 *
 * Fans out to multiple data sources: features (instant, static),
 * tasks, lists, calendar events, journal, vault, victories, family members.
 * Feature search is instant (0ms). DB searches debounce at 200ms.
 *
 * Spec: specs/Remaining-Implementation-Specs.md → Spec 2
 */

import { useState, useCallback, useRef, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useFamily } from './useFamily'
import type { LucideIcon } from 'lucide-react'
import {
  LayoutDashboard, CheckSquare, Calendar, List, BookOpen, Trophy, Star,
  Palette, Archive, BarChart3, Library, Target, Brain, Sparkles,
  Users, Layers, Compass,
} from 'lucide-react'

// ─── Feature definitions (static, instant search) ────────────

export interface FeatureResult {
  type: 'feature'
  key: string
  name: string
  description: string
  icon: LucideIcon
  route: string
}

const FEATURES: FeatureResult[] = [
  { type: 'feature', key: 'dashboard', name: 'Dashboard', description: 'Personal dashboard overview', icon: LayoutDashboard, route: '/dashboard' },
  { type: 'feature', key: 'tasks', name: 'Tasks', description: 'Manage tasks and routines', icon: CheckSquare, route: '/tasks' },
  { type: 'feature', key: 'calendar', name: 'Calendar', description: 'Events and schedule', icon: Calendar, route: '/calendar' },
  { type: 'feature', key: 'lists', name: 'Lists', description: 'Shopping, wishlists, and more', icon: List, route: '/lists' },
  { type: 'feature', key: 'journal', name: 'Journal', description: 'Reflections and entries', icon: BookOpen, route: '/journal' },
  { type: 'feature', key: 'victories', name: 'Victories', description: 'Celebrate accomplishments', icon: Trophy, route: '/victories' },
  { type: 'feature', key: 'guiding-stars', name: 'Guiding Stars', description: 'Values and principles', icon: Star, route: '/guiding-stars' },
  { type: 'feature', key: 'best-intentions', name: 'Best Intentions', description: 'Goals and intentions', icon: Target, route: '/best-intentions' },
  { type: 'feature', key: 'inner-workings', name: 'InnerWorkings', description: 'Self-knowledge and personality', icon: Layers, route: '/inner-workings' },
  { type: 'feature', key: 'studio', name: 'Studio', description: 'Templates and customization', icon: Palette, route: '/studio' },
  { type: 'feature', key: 'vault', name: 'AI Vault', description: 'Tools, tutorials, and prompts', icon: Library, route: '/vault' },
  { type: 'feature', key: 'archives', name: 'Archives', description: 'Family context and knowledge', icon: Archive, route: '/archives' },
  { type: 'feature', key: 'trackers', name: 'Trackers', description: 'Widgets and tracking', icon: BarChart3, route: '/trackers' },
  { type: 'feature', key: 'sweep', name: 'MindSweep', description: 'Quick capture and sorting', icon: Brain, route: '/sweep' },
  { type: 'feature', key: 'lanterns-path', name: "Lantern's Path", description: 'Getting started guide', icon: Compass, route: '/lanterns-path' },
  { type: 'feature', key: 'family-context', name: 'People', description: 'Family member profiles', icon: Users, route: '/family-context' },
  { type: 'feature', key: 'optimizer', name: 'LiLa Optimizer', description: 'Craft better prompts', icon: Sparkles, route: '/optimizer' },
]

// ─── Search result types ─────────────────────────────────────

export interface TaskResult {
  type: 'task'
  id: string
  title: string
  assignee_id: string | null
  due_date: string | null
  status: string
}

export interface ListResult {
  type: 'list'
  id: string
  title: string
  item_count: number
}

export interface CalendarEventResult {
  type: 'calendar_event'
  id: string
  title: string
  event_date: string
  start_time: string | null
}

export interface VictoryResult {
  type: 'victory'
  id: string
  title: string
  created_at: string
}

export interface MemberResult {
  type: 'member'
  id: string
  display_name: string
  role: string
}

export type SearchResult = FeatureResult | TaskResult | ListResult | CalendarEventResult | VictoryResult | MemberResult

export interface SearchResults {
  features: FeatureResult[]
  tasks: TaskResult[]
  lists: ListResult[]
  calendarEvents: CalendarEventResult[]
  victories: VictoryResult[]
  members: MemberResult[]
  isLoading: boolean
}

// ─── Hook ────────────────────────────────────────────────────

export function useSpotlightSearch() {
  const { data: family } = useFamily()
  const familyId = family?.id

  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResults>({
    features: [],
    tasks: [],
    lists: [],
    calendarEvents: [],
    victories: [],
    members: [],
    isLoading: false,
  })

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Feature search — instant, no debounce
  const searchFeatures = useCallback((q: string): FeatureResult[] => {
    if (!q.trim()) return []
    const lower = q.toLowerCase()
    return FEATURES.filter(f =>
      f.name.toLowerCase().includes(lower) ||
      f.description.toLowerCase().includes(lower) ||
      f.key.includes(lower)
    )
  }, [])

  // Database searches — debounced
  const searchDatabase = useCallback(async (q: string) => {
    if (!q.trim() || !familyId) {
      setResults(prev => ({ ...prev, tasks: [], lists: [], calendarEvents: [], victories: [], members: [], isLoading: false }))
      return
    }

    setResults(prev => ({ ...prev, isLoading: true }))

    const searchPattern = `%${q}%`

    try {
      const [tasksRes, listsRes, eventsRes, victoriesRes, membersRes] = await Promise.all([
        // Tasks
        supabase
          .from('tasks')
          .select('id, title, assignee_id, due_date, status')
          .eq('family_id', familyId)
          .is('archived_at', null)
          .ilike('title', searchPattern)
          .order('created_at', { ascending: false })
          .limit(10),

        // Lists
        supabase
          .from('lists')
          .select('id, title, list_items(count)')
          .eq('family_id', familyId)
          .is('archived_at', null)
          .ilike('title', searchPattern)
          .limit(10),

        // Calendar events
        supabase
          .from('calendar_events')
          .select('id, title, event_date, start_time')
          .eq('family_id', familyId)
          .ilike('title', searchPattern)
          .in('status', ['approved', 'pending_approval'])
          .order('event_date', { ascending: true })
          .limit(10),

        // Victories
        supabase
          .from('victories')
          .select('id, title, created_at')
          .eq('family_id', familyId)
          .ilike('title', searchPattern)
          .order('created_at', { ascending: false })
          .limit(10),

        // Family members
        supabase
          .from('family_members')
          .select('id, display_name, role')
          .eq('family_id', familyId)
          .eq('is_active', true)
          .ilike('display_name', searchPattern)
          .limit(10),
      ])

      setResults(prev => ({
        ...prev,
        tasks: (tasksRes.data ?? []).map(t => ({ type: 'task' as const, ...t })),
        lists: (listsRes.data ?? []).map(l => ({
          type: 'list' as const,
          id: l.id,
          title: l.title,
          item_count: Array.isArray(l.list_items) ? l.list_items.length : 0,
        })),
        calendarEvents: (eventsRes.data ?? []).map(e => ({ type: 'calendar_event' as const, ...e })),
        victories: (victoriesRes.data ?? []).map(v => ({ type: 'victory' as const, ...v })),
        members: (membersRes.data ?? []).map(m => ({ type: 'member' as const, ...m })),
        isLoading: false,
      }))
    } catch {
      setResults(prev => ({ ...prev, isLoading: false }))
    }
  }, [familyId])

  // Debounced search trigger
  const search = useCallback((q: string) => {
    setQuery(q)

    // Feature search is instant
    const features = searchFeatures(q)
    setResults(prev => ({ ...prev, features }))

    // Database search is debounced
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (q.trim()) {
      setResults(prev => ({ ...prev, isLoading: true }))
      debounceRef.current = setTimeout(() => searchDatabase(q), 200)
    } else {
      setResults(prev => ({ ...prev, tasks: [], lists: [], calendarEvents: [], victories: [], members: [], isLoading: false }))
    }
  }, [searchFeatures, searchDatabase])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [])

  const hasResults = results.features.length > 0 ||
    results.tasks.length > 0 ||
    results.lists.length > 0 ||
    results.calendarEvents.length > 0 ||
    results.victories.length > 0 ||
    results.members.length > 0

  return {
    query,
    search,
    results,
    hasResults,
    clearQuery: () => search(''),
  }
}
