import { useState, useEffect, useCallback } from 'react'
import { Tooltip } from '@/components/shared'
import { useEdgeSwipe } from '@/hooks/useSwipeGesture'
import { NavLink, useLocation } from 'react-router-dom'
import { useViewAs } from '@/lib/permissions/ViewAsProvider'
import { useViewAsNav } from '@/features/permissions/ViewAsModal'
import {
  LayoutDashboard, BookOpen, BookHeart, Sun, CheckSquare, Calendar,
  BarChart3, List, Star, Brain, Target, Trophy, Compass, Users, Archive,
  Palette, Lock, Gem, Rss, Library, GraduationCap, MessageCircle, UsersRound,
  ChevronLeft, ChevronRight, Gift, FileText, ShoppingCart, ChefHat,
} from 'lucide-react'
import { useEffectiveShell } from '@/hooks/useEffectiveShell'
import { useEffectiveMember } from '@/hooks/useEffectiveMember'
import { useShowMyRewards } from '@/hooks/useShowMyRewards'
import { useUnreadMessageCount } from '@/hooks/useUnreadMessageCount'
import { useFamilyMember } from '@/hooks/useFamilyMember'
import { useResolvedFeatureAccess } from '@/hooks/useResolvedFeatureAccess'
import { useManagementGrants } from '@/lib/permissions/useManagementGrants'
import { supabase } from '@/lib/supabase/client'
import { useAppearanceError } from '@/components/shells/ShellProvider'
import type { ShellType } from '@/lib/theme'

// `useShell` is intentionally not imported here — Sidebar derives its
// shell exclusively via `useEffectiveShell()` so the View-As modal renders
// the target's nav. ShellProvider still drives shell for the outer
// MomShell/AdultShell/etc. components.

export interface NavItem {
  label: string
  path: string
  featureKey: string
  icon: React.ReactNode
  tooltip: string
  badge?: number
}

export interface NavSection {
  title: string
  items: NavItem[]
  collapsible?: boolean
}

/**
 * Sidebar sections per shell.
 *
 * Mom branch is FROZEN — never touch the items list without explicit
 * founder approval. Mom is the auth user; her sidebar is the source of
 * truth for what the platform offers, period.
 *
 * Non-mom branches are PRIMARY ENFORCEMENT for *mom-only* surfaces per
 * the View As Identity-Scope Architecture (Convention #39, founder Q2
 * locked 2026-05-28). Invisibility-over-blocking applies to **mom-only
 * management surfaces** — Studio, Prize Board (mom-side admin), and
 * RewardRules / Contracts. Those three NEVER appear in non-mom shells.
 *
 * Everything else stays VISIBLE in the non-mom shell. The founder's
 * vision is permissive: each non-mom shell shows the items the role
 * could plausibly use, and the existing layered gating handles whether
 * a given member can actually use a given item right now:
 *
 *   - Layer 1 (tier) — `feature_access_v2` + `useCanAccess()`. Items
 *     not available at the family's tier render with the existing
 *     `tierLocked` Lock icon. Once `useCanAccess` is wired post-beta,
 *     this layer naturally hides/locks items the tier doesn't allow.
 *   - Layer 2 (mom-toggle, sparse) — `member_feature_toggles`.
 *     Per-kid Permission Hub overrides flow through this table. The
 *     authoring UI is a future follow-up build (Follow-Up Build E,
 *     `claude/follow-up-builds/per-member-sidebar-customization.md`).
 *   - Layer 3 (granular) — `member_permissions`. Per-target-child
 *     verb-level access for items mom has toggled on.
 *
 * The sidebar config IS NOT a per-kid customizer. It is the shell-wide
 * default surface for the role. PRD-31 Balanced / Maximum tables are
 * mom's *suggested defaults for member_feature_toggles*, NOT a ceiling
 * the sidebar enforces. Conflating the two is the bug this revision
 * corrects.
 *
 * Specific drops vs prior config (founder Q2 — mom-only):
 *   - Studio — DROPPED from adult + independent. Mom's template
 *     workshop per PRD-09A/09B Convention #149.
 *   - Prize Board — DROPPED. Mom's allowance audit + IOU admin per
 *     Phase 3 Connector Layer. Kid version is the `/my-rewards` stub
 *     (Worker 4).
 *   - RewardRules (`/contracts`) — DROPPED. Mom's automation
 *     switchboard per Phase 3.
 *
 * Items NOT in default non-mom config (left alone; not restored):
 *   - Adult: Archives — Dad does not get Archives by default. Mom can
 *     toggle on via Permission Hub when Follow-Up Build E ships.
 *   - Independent: Archives — same. People — left alone, not in prior
 *     independent config; not adding net-new in this revision.
 *
 * New entries (per founder Q2a, per-child gated):
 *   - "My Rewards" (`/my-rewards`, `my_rewards_page`) — adult,
 *     independent, and guided shells. Gated by per-child preference
 *     `family_members.preferences.show_my_rewards` (default ON since the
 *     2026-06-12 founder ruling; only an explicit false hides it).
 *     When toggle is OFF, entry stays INVISIBLE. Worker 4 builds the
 *     page stub, the toggle UI, and registers the feature key.
 *     PlayShell uses its own bottom nav with the existing "Fun" tab
 *     (→ /rewards → PlayRewards), which already surfaces per-kid
 *     sticker book + earned prizes; no separate My Rewards entry
 *     needed there.
 *
 * Revision history:
 *   - 2026-05-28 (initial Worker 2): over-pruned by treating PRD-31
 *     Balanced as a strict ceiling. Removed Journal, InnerWorkings,
 *     LifeLantern, AI Vault, BookShelf from Adult; Touch Base, Shopping
 *     Mode, InnerWorkings, LifeLantern, AI Vault, BookShelf from
 *     Independent. Tests codified the absences.
 *   - 2026-05-28 (revision pass): founder corrected — the sidebar is
 *     NOT a ceiling; gating is layered. Restored items above. Tests
 *     rewritten to assert presence of restored items + absence of the
 *     three mom-only drops.
 */
export interface SidebarAccessOptions {
  showMyRewards?: boolean
  /**
   * PERMISSIONS-WIRING (2026-06-09): per-member resolved feature access from
   * useResolvedFeatureAccess — mom's Permission Hub toggles finally drive the
   * sidebar. Items resolving disabled are omitted; fully-empty sections drop.
   * Applied to adult/independent shells only (mom FROZEN; guided/play have
   * purpose-built navs). Convention #16: BottomNav More menu flows from the
   * same options, so mobile parity is automatic.
   */
  isFeatureEnabled?: (featureKey: string) => boolean
  /**
   * Family-wide management grants for additional adults (useManagementGrants).
   * Granted surfaces (Studio / Prize Board / RewardRules) appear in the adult
   * sidebar; ungranted stay invisible — "default to invisible, but permissions
   * available" (founder ruling 2026-06-09).
   */
  managementAccess?: { studio: boolean; prizeBoard: boolean; rewardRules: boolean }
}

export function getSidebarSections(
  shell: ShellType,
  options?: SidebarAccessOptions
): NavSection[] {
  const showMyRewards = options?.showMyRewards ?? false

  /** Apply mom's per-member toggles; drop sections that empty out. */
  const applyAccessFilter = (sections: NavSection[]): NavSection[] => {
    const isEnabled = options?.isFeatureEnabled
    if (!isEnabled) return sections
    return sections
      .map(s => ({ ...s, items: s.items.filter(i => isEnabled(i.featureKey)) }))
      .filter(s => s.items.length > 0)
  }

  // -- Reusable nav items ----------------------------------------------------
  const home: NavSection = {
    title: 'Home',
    collapsible: false,
    items: [
      { label: 'Dashboard', path: '/dashboard', featureKey: 'dashboard', icon: <LayoutDashboard size={20} />, tooltip: 'Your personal space' },
    ],
  }

  const myRewardsItem: NavItem = {
    label: 'My Rewards',
    path: '/my-rewards',
    featureKey: 'my_rewards_page',
    icon: <Gift size={20} />,
    tooltip: 'Your prizes, balance, and earnings',
  }

  // -- Mom-only constants (used only in the mom branch) ----------------------
  const momCapture: NavSection = {
    title: 'Capture & Reflect',
    collapsible: true,
    items: [
      { label: 'Journal', path: '/journal', featureKey: 'journal', icon: <BookOpen size={20} />, tooltip: 'Capture thoughts and reflect' },
      { label: 'Reflections', path: '/reflections', featureKey: 'reflections_basic', icon: <BookHeart size={20} />, tooltip: 'Daily reflection questions' },
      // PRD-18: Rhythm experiences live in the auto-open modal + dashboard card,
      // not as standalone pages. The Settings entry is the one place to configure
      // morning/evening/weekly/monthly/quarterly rhythms per family member.
      { label: 'Rhythms', path: '/rhythms/settings', featureKey: 'rhythms_basic', icon: <Sun size={20} />, tooltip: 'Configure morning, evening, and periodic rhythms' },
    ],
  }

  const momPlan: NavSection = {
    title: 'Plan & Do',
    collapsible: true,
    items: [
      { label: 'Tasks', path: '/tasks', featureKey: 'tasks', icon: <CheckSquare size={20} />, tooltip: 'Tasks, routines, and to-dos' },
      { label: 'Calendar', path: '/calendar', featureKey: 'calendar', icon: <Calendar size={20} />, tooltip: 'Family calendar' },
      { label: 'Touch Base', path: '/meetings', featureKey: 'meetings_basic', icon: <UsersRound size={20} />, tooltip: 'Keep track of things to talk about with family, kids, and contacts' },
      { label: 'KitchenCompass', path: '/meals', featureKey: 'meals_basic', icon: <ChefHat size={20} />, tooltip: 'Recipes, weekly meal plan, and shopping handoff' },
      { label: 'Trackers', path: '/trackers', featureKey: 'widgets_trackers', icon: <BarChart3 size={20} />, tooltip: 'Charts and trackers' },
      { label: 'Lists', path: '/lists', featureKey: 'lists', icon: <List size={20} />, tooltip: 'Lists and templates' },
      { label: 'Shopping Mode', path: '/shopping-mode', featureKey: 'shopping_mode', icon: <ShoppingCart size={20} />, tooltip: 'Cross-list shopping view by store' },
      { label: 'Studio', path: '/studio', featureKey: 'studio', icon: <Palette size={20} />, tooltip: 'Template workshop' },
      { label: 'Prize Board', path: '/prize-board', featureKey: 'gamification_basic', icon: <Gift size={20} />, tooltip: 'Unredeemed prizes and IOUs' },
      { label: 'RewardRules', path: '/contracts', featureKey: 'gamification_basic', icon: <FileText size={20} />, tooltip: 'Reward rules and automation' },
    ],
  }

  const momGrow: NavSection = {
    title: 'Grow',
    collapsible: true,
    items: [
      { label: 'Guiding Stars', path: '/guiding-stars', featureKey: 'guiding_stars', icon: <Star size={20} />, tooltip: 'Your values and direction' },
      { label: 'BestIntentions', path: '/best-intentions', featureKey: 'best_intentions', icon: <Target size={20} />, tooltip: 'Your intentions and iterations' },
      { label: 'InnerWorkings', path: '/inner-workings', featureKey: 'my_foundation', icon: <Brain size={20} />, tooltip: 'Self-knowledge and growth' },
      { label: 'Victories', path: '/victories', featureKey: 'victories', icon: <Trophy size={20} />, tooltip: 'Celebrate your wins' },
      { label: 'LifeLantern', path: '/life-lantern', featureKey: 'lifelantern', icon: <Compass size={20} />, tooltip: 'Life vision and assessment' },
    ],
  }

  const momFamily: NavSection = {
    title: 'Family',
    collapsible: true,
    items: [
      { label: 'Messages', path: '/messages', featureKey: 'messaging_basic', icon: <MessageCircle size={20} />, tooltip: 'Family conversations' },
      { label: 'WishLists', path: '/wishlists', featureKey: 'wishlists_basic', icon: <Gift size={20} />, tooltip: 'Wishlists, gift ideas, and gift planning' },
      { label: 'People', path: '/family-context', featureKey: 'people_relationships', icon: <Users size={20} />, tooltip: 'People and relationships' },
      { label: 'Family Feeds', path: '/feeds', featureKey: 'family_feeds', icon: <Rss size={20} />, tooltip: 'Private family social feed' },
    ],
  }

  const momTools: NavSection = {
    title: 'AI & Tools',
    collapsible: true,
    items: [
      { label: 'AI Vault', path: '/vault', featureKey: 'vault_browse', icon: <Gem size={20} />, tooltip: 'Tutorials, tools, and prompts' },
      { label: 'Archives', path: '/archives', featureKey: 'archives', icon: <Archive size={20} />, tooltip: 'Context and documents' },
    ],
  }

  const momBookshelf: NavSection = {
    title: 'BookShelf',
    collapsible: true,
    items: [
      { label: 'Library', path: '/bookshelf', featureKey: 'bookshelf_basic', icon: <Library size={20} />, tooltip: 'Browse your book library' },
      { label: 'Study Guides', path: '/bookshelf?study_guides=true', featureKey: 'bookshelf_basic', icon: <GraduationCap size={20} />, tooltip: 'Age-adapted book summaries' },
      { label: 'Journal Prompts', path: '/bookshelf/prompts', featureKey: 'bookshelf_basic', icon: <BookOpen size={20} />, tooltip: 'Reflection prompts from books' },
    ],
  }

  switch (shell) {
    case 'mom':
      // FROZEN — do not modify without explicit founder approval.
      return [home, momTools, momBookshelf, momCapture, momPlan, momGrow, momFamily]

    case 'adult': {
      // Adult shell. Mom-only management surfaces dropped (Studio, Prize
      // Board, RewardRules) per founder Q2. Everything else stays
      // VISIBLE; tier + per-kid toggle gating is layered elsewhere.
      const adultCapture: NavSection = {
        title: 'Capture & Reflect',
        collapsible: true,
        items: [
          { label: 'Journal', path: '/journal', featureKey: 'journal', icon: <BookOpen size={20} />, tooltip: 'Capture thoughts and reflect' },
          { label: 'Reflections', path: '/reflections', featureKey: 'reflections_basic', icon: <BookHeart size={20} />, tooltip: 'Daily reflection questions' },
          { label: 'Rhythms', path: '/rhythms/settings', featureKey: 'rhythms_basic', icon: <Sun size={20} />, tooltip: 'Configure morning, evening, and periodic rhythms' },
        ],
      }

      const adultPlanItems: NavItem[] = [
        { label: 'Tasks', path: '/tasks', featureKey: 'tasks', icon: <CheckSquare size={20} />, tooltip: 'Tasks, routines, and to-dos' },
        { label: 'Calendar', path: '/calendar', featureKey: 'calendar', icon: <Calendar size={20} />, tooltip: 'Family calendar' },
        { label: 'Touch Base', path: '/meetings', featureKey: 'meetings_basic', icon: <UsersRound size={20} />, tooltip: 'Keep track of things to talk about with family, kids, and contacts' },
      { label: 'KitchenCompass', path: '/meals', featureKey: 'meals_basic', icon: <ChefHat size={20} />, tooltip: 'Recipes, weekly meal plan, and shopping handoff' },
        { label: 'Trackers', path: '/trackers', featureKey: 'widgets_trackers', icon: <BarChart3 size={20} />, tooltip: 'Charts and trackers' },
        { label: 'Lists', path: '/lists', featureKey: 'lists', icon: <List size={20} />, tooltip: 'Lists and templates' },
        { label: 'Shopping Mode', path: '/shopping-mode', featureKey: 'shopping_mode', icon: <ShoppingCart size={20} />, tooltip: 'Cross-list shopping view by store' },
        // Studio, Prize Board, RewardRules: mom-only BY DEFAULT per Q2.
        // PERMISSIONS-WIRING (2026-06-09): granted adults get them back —
        // same labels/paths/icons as the mom sidebar (Convention #16 parity).
      ]
      const mgmt = options?.managementAccess
      if (mgmt?.studio) {
        adultPlanItems.push({ label: 'Studio', path: '/studio', featureKey: 'studio', icon: <Palette size={20} />, tooltip: 'Template workshop' })
      }
      if (mgmt?.prizeBoard) {
        adultPlanItems.push({ label: 'Prize Board', path: '/prize-board', featureKey: 'gamification_basic', icon: <Gift size={20} />, tooltip: 'Unredeemed prizes and IOUs' })
      }
      if (mgmt?.rewardRules) {
        adultPlanItems.push({ label: 'RewardRules', path: '/contracts', featureKey: 'gamification_basic', icon: <FileText size={20} />, tooltip: 'Reward rules and automation' })
      }
      if (showMyRewards) adultPlanItems.push(myRewardsItem)

      const adultPlan: NavSection = { title: 'Plan & Do', collapsible: true, items: adultPlanItems }

      const adultGrow: NavSection = {
        title: 'Grow',
        collapsible: true,
        items: [
          { label: 'Guiding Stars', path: '/guiding-stars', featureKey: 'guiding_stars', icon: <Star size={20} />, tooltip: 'Your values and direction' },
          { label: 'BestIntentions', path: '/best-intentions', featureKey: 'best_intentions', icon: <Target size={20} />, tooltip: 'Your intentions and iterations' },
          { label: 'InnerWorkings', path: '/inner-workings', featureKey: 'my_foundation', icon: <Brain size={20} />, tooltip: 'Self-knowledge and growth' },
          { label: 'Victories', path: '/victories', featureKey: 'victories', icon: <Trophy size={20} />, tooltip: 'Celebrate your wins' },
          { label: 'LifeLantern', path: '/life-lantern', featureKey: 'lifelantern', icon: <Compass size={20} />, tooltip: 'Life vision and assessment' },
        ],
      }

      const adultFamily: NavSection = {
        title: 'Family',
        collapsible: true,
        items: [
          { label: 'Messages', path: '/messages', featureKey: 'messaging_basic', icon: <MessageCircle size={20} />, tooltip: 'Family conversations' },
          { label: 'WishLists', path: '/wishlists', featureKey: 'wishlists_basic', icon: <Gift size={20} />, tooltip: 'Wishlists, gift ideas, and gift planning' },
          { label: 'People', path: '/family-context', featureKey: 'people_relationships', icon: <Users size={20} />, tooltip: 'People and relationships' },
          { label: 'Family Feeds', path: '/feeds', featureKey: 'family_feeds', icon: <Rss size={20} />, tooltip: 'Private family social feed' },
        ],
      }

      // AI & Tools — AI Vault restored. Archives intentionally NOT
      // included: Dad does not get Archives by default. Mom can add via
      // Permission Hub when Follow-Up Build E ships.
      const adultTools: NavSection = {
        title: 'AI & Tools',
        collapsible: true,
        items: [
          { label: 'AI Vault', path: '/vault', featureKey: 'vault_browse', icon: <Gem size={20} />, tooltip: 'Tutorials, tools, and prompts' },
        ],
      }

      // BookShelf section restored — audience-scoped per PRD-23.
      return applyAccessFilter([home, adultCapture, adultPlan, adultGrow, adultFamily, adultTools, momBookshelf])
    }

    case 'independent': {
      // Independent shell. Mom-only management surfaces dropped
      // (Studio, Prize Board, RewardRules) per founder Q2. Everything
      // else stays VISIBLE; tier + per-kid toggle gating is layered.
      const indCapture: NavSection = {
        title: 'Capture & Reflect',
        collapsible: true,
        items: [
          { label: 'Journal', path: '/journal', featureKey: 'journal', icon: <BookOpen size={20} />, tooltip: 'Capture thoughts and reflect' },
          { label: 'Reflections', path: '/reflections', featureKey: 'reflections_basic', icon: <BookHeart size={20} />, tooltip: 'Daily reflection questions' },
          { label: 'Rhythms', path: '/rhythms/settings', featureKey: 'rhythms_basic', icon: <Sun size={20} />, tooltip: 'Configure morning, evening, and periodic rhythms' },
        ],
      }

      const indPlanItems: NavItem[] = [
        { label: 'Tasks', path: '/tasks', featureKey: 'tasks', icon: <CheckSquare size={20} />, tooltip: 'Tasks, routines, and to-dos' },
        { label: 'Calendar', path: '/calendar', featureKey: 'calendar', icon: <Calendar size={20} />, tooltip: 'Family calendar' },
        { label: 'Touch Base', path: '/meetings', featureKey: 'meetings_basic', icon: <UsersRound size={20} />, tooltip: 'Meeting agenda and things to talk about' },
        { label: 'KitchenCompass', path: '/meals', featureKey: 'meals_basic', icon: <ChefHat size={20} />, tooltip: 'Recipes, weekly meal plan, and shopping handoff' },
        { label: 'Trackers', path: '/trackers', featureKey: 'widgets_trackers', icon: <BarChart3 size={20} />, tooltip: 'Charts and trackers' },
        { label: 'Lists', path: '/lists', featureKey: 'lists', icon: <List size={20} />, tooltip: 'Lists and templates' },
        { label: 'Shopping Mode', path: '/shopping-mode', featureKey: 'shopping_mode', icon: <ShoppingCart size={20} />, tooltip: 'Cross-list shopping view by store' },
        // Studio, Prize Board, RewardRules dropped — mom-only per Q2.
      ]
      if (showMyRewards) indPlanItems.push(myRewardsItem)

      const indPlan: NavSection = { title: 'Plan & Do', collapsible: true, items: indPlanItems }

      const indGrow: NavSection = {
        title: 'Grow',
        collapsible: true,
        items: [
          { label: 'Guiding Stars', path: '/guiding-stars', featureKey: 'guiding_stars', icon: <Star size={20} />, tooltip: 'Your values and direction' },
          { label: 'BestIntentions', path: '/best-intentions', featureKey: 'best_intentions', icon: <Target size={20} />, tooltip: 'Your intentions and iterations' },
          { label: 'InnerWorkings', path: '/inner-workings', featureKey: 'my_foundation', icon: <Brain size={20} />, tooltip: 'Self-knowledge and growth' },
          { label: 'Victories', path: '/victories', featureKey: 'victories', icon: <Trophy size={20} />, tooltip: 'Celebrate your wins' },
          // LifeLantern restored — `life_lantern_teen` feature key
          // exists exactly for this surface.
          { label: 'LifeLantern', path: '/life-lantern', featureKey: 'life_lantern_teen', icon: <Compass size={20} />, tooltip: 'Life vision and assessment' },
        ],
      }

      const indFamily: NavSection = {
        title: 'Family',
        collapsible: true,
        items: [
          { label: 'Messages', path: '/messages', featureKey: 'messaging_basic', icon: <MessageCircle size={20} />, tooltip: 'Family conversations' },
          { label: 'WishLists', path: '/wishlists', featureKey: 'wishlists_basic', icon: <Gift size={20} />, tooltip: 'Your wish list' },
          // Family Feeds — stub / coming-soon entry per PRD-32A demand
          // validation. Renders PlannedExpansionCard until PRD-37 ships.
          { label: 'Family Feeds', path: '/feeds', featureKey: 'family_feeds', icon: <Rss size={20} />, tooltip: 'Private family social feed' },
        ],
      }

      // AI & Tools — AI Vault restored. Archives intentionally NOT
      // included: teens do not get Archives by default.
      const indTools: NavSection = {
        title: 'AI & Tools',
        collapsible: true,
        items: [
          { label: 'AI Vault', path: '/vault', featureKey: 'vault_consume', icon: <Gem size={20} />, tooltip: 'AI tutorials and tools' },
        ],
      }

      // BookShelf section restored — audience-scoped per PRD-23.
      return applyAccessFilter([home, indCapture, indPlan, indGrow, indFamily, indTools, momBookshelf])
    }

    case 'guided': {
      // Guided shell verified against PRD-31 Maximum Guided profile.
      // Existing items (Tasks, Messages, Journal, Reflections, Victories)
      // confirmed reasonable per audit "OK" classification. BookShelf
      // retained — audit didn't flag, audience-scoped per PRD-23 build.
      //
      // GDCX (2026-07): this list is never rendered as an actual Guided menu
      // — GuidedShell owns its own purpose-built header/bottom-nav/More-menu
      // UI. It exists solely to feed the View-As modal's allowedPaths set.
      // The primary bottom-nav "Progress" tab now routes to /my-rewards
      // UNCONDITIONALLY (Convention #124 — Progress is always present,
      // alongside the other unhideable tabs), so /my-rewards must always be
      // allowed here too, regardless of show_my_rewards — MyRewardsPage
      // itself renders the "not set up yet" fallback card when the
      // preference is off, matching what a real Guided kid sees on that tab.
      const guidedMyDayItems: NavItem[] = [
        { label: 'Tasks', path: '/tasks', featureKey: 'tasks', icon: <CheckSquare size={20} />, tooltip: 'Your tasks for today' },
        { label: 'Messages', path: '/messages', featureKey: 'messaging_basic', icon: <MessageCircle size={20} />, tooltip: 'Talk to your family' },
        { label: 'Journal', path: '/journal', featureKey: 'journal', icon: <BookOpen size={20} />, tooltip: 'Write and reflect' },
        { label: 'Reflections', path: '/reflections', featureKey: 'reflections_basic', icon: <BookHeart size={20} />, tooltip: 'Daily reflection questions' },
        { label: 'Victories', path: '/victories', featureKey: 'victories', icon: <Trophy size={20} />, tooltip: 'Your wins' },
        myRewardsItem,
      ]

      return [
        home,
        { title: 'My Day', collapsible: false, items: guidedMyDayItems },
        momBookshelf,
      ]
    }

    case 'play':
      // Play shell has no sidebar — its own bottom nav handles everything.
      // The existing "Fun" tab (→ /rewards → PlayRewards) already surfaces
      // per-kid sticker book + earned prizes, so no separate My Rewards
      // entry is needed here.
      return []
  }
}

/**
 * Hook to persist sidebar collapsed state to family_members.layout_preferences.
 * Loads initial state from Supabase, saves on change.
 *
 * Writes route through the update_member_appearance RPC (FDWA, 2026-07-09)
 * rather than a raw UPDATE — no self-update RLS policy on family_members has
 * ever existed, so this silently no-op'd for every non-mom session (not just
 * family devices). Failures report via useAppearanceError() (rendered by
 * ShellProvider, an ancestor of every shell regardless of whether
 * RoutingToastProvider happens to be mounted below it).
 */
function useSidebarPersistence(memberId: string | null) {
  const [collapsed, setCollapsedState] = useState(false)
  const [loaded, setLoaded] = useState(false)
  const { reportError } = useAppearanceError()

  // Load from Supabase on mount
  useEffect(() => {
    if (!memberId) return
    supabase
      .from('family_members')
      .select('layout_preferences')
      .eq('id', memberId)
      .single()
      .then(({ data }) => {
        if (data?.layout_preferences?.sidebar_open === false) {
          setCollapsedState(true)
        }
        setLoaded(true)
      })
  }, [memberId])

  const setCollapsed = useCallback((next: boolean) => {
    setCollapsedState(next)
    if (memberId) {
      supabase
        .from('family_members')
        .select('layout_preferences')
        .eq('id', memberId)
        .single()
        .then(async ({ data }) => {
          const prefs = (data?.layout_preferences as Record<string, unknown>) || {}
          const { data: rpcData, error } = await supabase.rpc('update_member_appearance', {
            p_member_id: memberId,
            p_theme_preferences: null,
            p_layout_preferences: { ...prefs, sidebar_open: !next },
          })
          const status = (rpcData as { status?: string } | null)?.status
          if (error || status !== 'ok') {
            console.error('[Sidebar] failed to save sidebar layout preference:', error ?? status)
            reportError('Your sidebar setting might not be saved. Check your connection and try again.')
          }
        })
    }
  }, [memberId, reportError])

  return { collapsed, setCollapsed, loaded }
}

/**
 * SidebarNavItem — renders either a real NavLink (normal mode)
 * or a button that uses ViewAsNav (when inside View As modal).
 */
function SidebarNavItem({
  path, icon, label, tierLocked, collapsed, onNavigate, badge,
}: {
  path: string; icon: React.ReactNode; label: string
  tierLocked: boolean; collapsed: boolean; onNavigate: () => void; badge?: number
}) {
  const { isViewingAs } = useViewAs()
  const { currentPath, navigate: viewAsNav } = useViewAsNav()
  const location = useLocation()

  // Determine active state based on context
  const isActive = isViewingAs ? currentPath === path : location.pathname === path

  if (isViewingAs) {
    // In View As: use state-based navigation, not real router
    return (
      <button
        onClick={() => {
          if (tierLocked) return
          viewAsNav(path)
          onNavigate()
        }}
        className={`flex items-center gap-3 px-4 py-2 mx-2 rounded-lg text-sm transition-colors w-full text-left ${isActive && !tierLocked ? 'font-medium' : ''}`}
        style={{
          backgroundColor: isActive && !tierLocked ? 'var(--surface-primary, var(--color-bg-secondary))' : 'transparent',
          color: tierLocked ? 'var(--color-text-secondary)' : isActive ? 'var(--color-text-heading)' : 'var(--color-text-primary)',
          borderRight: isActive && !tierLocked ? '3px solid var(--surface-primary, var(--color-btn-primary-bg))' : '3px solid transparent',
          opacity: tierLocked ? 0.45 : 1,
          cursor: tierLocked ? 'not-allowed' : 'pointer',
        }}
      >
        {icon}
        {!collapsed && (
          <>
            <span>{label}</span>
            {tierLocked && <Lock size={12} className="ml-auto shrink-0" />}
          </>
        )}
      </button>
    )
  }

  // Normal mode: real NavLink
  return (
    <NavLink
      to={tierLocked ? '#' : path}
      onClick={(e) => {
        if (tierLocked) { e.preventDefault(); return }
        onNavigate()
      }}
      className={({ isActive: active }) =>
        `flex items-center gap-3 px-4 py-2 mx-2 rounded-lg text-sm transition-colors ${active && !tierLocked ? 'font-medium' : ''}`
      }
      style={({ isActive: active }) => ({
        backgroundColor: active && !tierLocked ? 'var(--surface-primary, var(--color-bg-secondary))' : 'transparent',
        color: tierLocked ? 'var(--color-text-secondary)' : active ? 'var(--color-text-heading)' : 'var(--color-text-primary)',
        borderRight: active && !tierLocked ? '3px solid var(--surface-primary, var(--color-btn-primary-bg))' : '3px solid transparent',
        opacity: tierLocked ? 0.45 : 1,
        filter: tierLocked ? 'blur(0.5px)' : 'none',
        cursor: tierLocked ? 'not-allowed' : 'pointer',
      })}
    >
      {icon}
      {!collapsed && (
        <>
          <span>{label}</span>
          {badge != null && badge > 0 && (
            <span
              style={{
                marginLeft: 'auto',
                minWidth: 18,
                height: 18,
                borderRadius: 9,
                backgroundColor: 'var(--color-btn-primary-bg)',
                color: 'var(--color-text-on-primary, #fff)',
                fontSize: '0.625rem',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '0 4px',
                flexShrink: 0,
              }}
            >
              {badge > 99 ? '99+' : badge}
            </span>
          )}
          {tierLocked && <Lock size={12} className="ml-auto shrink-0" />}
        </>
      )}
    </NavLink>
  )
}

export function Sidebar() {
  // Effective shell — inside View-As scope this is the target member's
  // shell; outside, it's the auth user's. Single source of truth in
  // `useEffectiveShell()`; do NOT re-derive `dashboard_mode → shell` here.
  // Convention #39 (View As Identity-Scope Architecture).
  const shell = useEffectiveShell()
  const location = useLocation()
  // `member` here is the AUTH user, used to persist mom's sidebar
  // collapsed/expanded preferences regardless of who is being viewed.
  // Sidebar layout preferences are mom-owned, not target-owned.
  const { data: member } = useFamilyMember()

  // Effective member drives the per-child My Rewards visibility toggle.
  // Inside View-As mom-viewing: target's preference governs (so mom sees
  // the same sidebar shape the kid would see). Inside hub member-session:
  // same. Outside View-As: auth user's preference (mom never sees My
  // Rewards because her mom-branch shell is FROZEN to ignore it).
  const { member: effectiveMember } = useEffectiveMember()
  const showMyRewards = useShowMyRewards(effectiveMember?.id ?? null)

  // PERMISSIONS-WIRING (2026-06-09): mom's per-member toggles + family-wide
  // management grants drive the effective member's sidebar.
  const { isEnabled } = useResolvedFeatureAccess(effectiveMember)
  const grants = useManagementGrants(effectiveMember)
  const managementAccess =
    effectiveMember?.role === 'additional_adult'
      ? {
          studio: grants.studioLevel !== 'none',
          prizeBoard: grants.financeMaxLevel !== 'none',
          rewardRules: grants.rewardRulesLevel !== 'none',
        }
      : undefined

  const { collapsed, setCollapsed } = useSidebarPersistence(member?.id ?? null)
  const [mobileOpen, setMobileOpen] = useState(false)

  // Left-edge swipe to open sidebar on mobile/tablet (PRD-04)
  useEdgeSwipe({
    onSwipeFromEdge: () => setMobileOpen(true),
    enabled: shell !== 'play',
  })

  // In /preview mode, prefix all sidebar paths with /preview
  const isPreview = location.pathname.startsWith('/preview')
  const pathPrefix = isPreview ? '/preview' : ''

  const rawSections = getSidebarSections(shell, { showMyRewards, isFeatureEnabled: isEnabled, managementAccess })
  const sections = rawSections.map(section => ({
    ...section,
    items: section.items.map(item => ({
      ...item,
      path: pathPrefix + item.path,
    })),
  }))

  if (shell === 'play' || sections.length === 0) return null

  return <SidebarInner sections={sections} collapsed={collapsed} setCollapsed={setCollapsed} mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} shell={shell} isPreview={isPreview} />
}

const SIDEBAR_SECTIONS_KEY = 'myaim-sidebar-sections'

/** Track expanded sections — persisted to localStorage so choices survive across sessions */
function useSectionCollapse(sections: NavSection[], currentPath: string) {
  // Find which section contains the active route
  const activeSectionTitle = sections.find(s =>
    s.items.some(item => currentPath === item.path || currentPath.startsWith(item.path + '/'))
  )?.title

  const [expandedSections, setExpandedSections] = useState<Set<string>>(() => {
    // Restore from localStorage if available
    try {
      const stored = localStorage.getItem(SIDEBAR_SECTIONS_KEY)
      if (stored) {
        const parsed = JSON.parse(stored) as string[]
        const restored = new Set(parsed)
        // Also include the active section so you always see where you are
        if (activeSectionTitle) restored.add(activeSectionTitle)
        return restored
      }
    } catch { /* ignore malformed storage */ }
    // First visit: show everything open so the user can see the full nav map
    return new Set(sections.map(s => s.title))
  })

  // When route changes, auto-expand the section containing the new route
  useEffect(() => {
    if (activeSectionTitle && !expandedSections.has(activeSectionTitle)) {
      setExpandedSections(prev => {
        const next = new Set([...prev, activeSectionTitle])
        localStorage.setItem(SIDEBAR_SECTIONS_KEY, JSON.stringify([...next]))
        return next
      })
    }
  }, [currentPath, activeSectionTitle])

  const toggleSection = useCallback((title: string) => {
    setExpandedSections(prev => {
      const next = new Set(prev)
      if (next.has(title)) next.delete(title)
      else next.add(title)
      localStorage.setItem(SIDEBAR_SECTIONS_KEY, JSON.stringify([...next]))
      return next
    })
  }, [])

  const isSectionExpanded = useCallback((title: string) => expandedSections.has(title), [expandedSections])

  return { isSectionExpanded, toggleSection }
}

function SidebarInner({
  sections, collapsed, setCollapsed, mobileOpen: _mobileOpen, setMobileOpen, shell, isPreview: _isPreview,
}: {
  sections: NavSection[]
  collapsed: boolean
  setCollapsed: (v: boolean) => void
  mobileOpen: boolean
  setMobileOpen: (v: boolean) => void
  shell: ShellType
  isPreview: boolean
}) {
  const location = useLocation()
  const { isSectionExpanded, toggleSection } = useSectionCollapse(sections, location.pathname)
  const { data: unreadMsgCount } = useUnreadMessageCount()

  // Inject unread badge into Messages nav item
  const enrichedSections = sections.map(section => ({
    ...section,
    items: section.items.map(item =>
      item.featureKey === 'messaging_basic'
        ? { ...item, badge: unreadMsgCount ?? 0 }
        : item
    ),
  }))

  const sidebarContent = (
    <nav className="flex-1 flex flex-col overflow-y-auto py-4 scrollbar-card">
      {enrichedSections.map((section) => {
        const isCollapsible = section.collapsible && !collapsed
        const isExpanded = !isCollapsible || isSectionExpanded(section.title)

        return (
        <div key={section.title} className="mb-1">
          {!collapsed && (
            isCollapsible ? (
              <button
                onClick={() => toggleSection(section.title)}
                className="flex items-center justify-between w-full text-xs font-semibold uppercase"
                style={{
                  color: 'var(--color-text-secondary)',
                  background: 'transparent',
                  border: 'none',
                  minHeight: 'unset',
                  padding: '0.375rem 0.75rem',
                  cursor: 'pointer',
                  letterSpacing: '0.05em',
                  fontSize: 'var(--font-size-xs, 0.7rem)',
                  fontFamily: 'var(--font-heading)',
                }}
              >
                <span>{section.title}</span>
                <ChevronRight
                  size={12}
                  style={{
                    transform: isExpanded ? 'rotate(90deg)' : 'rotate(0)',
                    transition: 'transform 200ms ease',
                    color: 'var(--color-text-secondary)',
                  }}
                />
              </button>
            ) : (
              <p
                className="text-xs font-semibold uppercase"
                style={{
                  color: 'var(--color-text-secondary)',
                  padding: '0.375rem 0.75rem',
                  letterSpacing: '0.05em',
                  fontSize: 'var(--font-size-xs, 0.7rem)',
                  fontFamily: 'var(--font-heading)',
                }}
              >
                {section.title}
              </p>
            )
          )}
          <div
            style={{
              overflow: 'hidden',
              maxHeight: isExpanded ? '500px' : '0',
              transition: 'max-height 200ms ease',
            }}
          >
          {section.items.map((item) => {
            // Tier-locking: during beta useCanAccess returns true for all.
            const tierLocked = false // Will be: !useCanAccess(item.featureKey)
            const isMom = shell === 'mom'

            if (tierLocked && !isMom) return null

            return (
              <Tooltip content={collapsed ? `${item.label} — ${item.tooltip}` : item.tooltip} key={item.path}>
              <SidebarNavItem
                path={item.path}
                icon={item.icon}
                label={item.label}
                tierLocked={tierLocked}
                collapsed={collapsed}
                onNavigate={() => setMobileOpen(false)}
                badge={item.badge}
              />
              </Tooltip>
            )
          })}
          </div>
        </div>
        )
      })}

      {/* AI Toolbox removed — tools accessible via LiLa guided mode switcher */}
    </nav>
  )

  return (
    <>
      {/* Mobile sidebar overlay — opens via left-edge swipe gesture */}
      {_mobileOpen && (
        <>
          <div
            onClick={() => setMobileOpen(false)}
            className="fixed inset-0 z-40 md:hidden"
            style={{ backgroundColor: 'rgba(0, 0, 0, 0.4)' }}
            aria-hidden="true"
          />
          <aside
            className="fixed inset-y-0 left-0 z-50 flex flex-col md:hidden animate-slideRight"
            style={{
              width: '260px',
              backgroundColor: 'var(--color-bg-card)',
              borderRight: '1px solid var(--color-border)',
              boxShadow: '4px 0 20px rgba(0, 0, 0, 0.15)',
            }}
          >
            <div className="flex items-center justify-between p-3 border-b" style={{ borderColor: 'var(--color-border)' }}>
              <span className="text-sm font-semibold" style={{ color: 'var(--color-text-heading)' }}>Menu</span>
              <button
                onClick={() => setMobileOpen(false)}
                className="p-1 rounded"
                style={{ color: 'var(--color-text-secondary)', background: 'transparent', minHeight: 'unset' }}
              >
                <ChevronLeft size={16} />
              </button>
            </div>
            {sidebarContent}
            {/* View As removed from sidebar — lives in Family Overview only */}
          </aside>
          <style>{`
            @keyframes slideRight {
              from { transform: translateX(-100%); }
              to { transform: translateX(0); }
            }
            .animate-slideRight {
              animation: slideRight 0.2s ease-out;
            }
            @media (prefers-reduced-motion: reduce) {
              .animate-slideRight { animation: none; }
            }
          `}</style>
        </>
      )}

      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col border-r shrink-0 h-svh sticky top-0"
        style={{
          width: collapsed ? '56px' : '220px',
          backgroundColor: 'var(--color-bg-card)',
          borderColor: 'var(--color-border)',
          transition: 'width var(--vibe-transition, 200ms ease)',
        }}
      >
        <div className="flex items-center justify-end p-2">
          <Tooltip content={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}>
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-1 rounded"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
          </Tooltip>
        </div>
        {sidebarContent}
        {/* View As removed from sidebar — lives in Family Overview only */}
      </aside>
    </>
  )
}

