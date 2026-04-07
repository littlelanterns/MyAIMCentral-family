/**
 * PRD-18 Phase B: RhythmMetadataContext
 *
 * A lightweight, modal-scoped React context that lets rhythm section
 * components STAGE metadata for the Close My Day commit. Nothing is
 * written to the database mid-flow — the modal collects staged items
 * via this context and, on Close My Day, reads the final staged state
 * and writes rhythm_completions.metadata + any side-effect rows
 * (tasks, list_items, etc.) in one batched commit.
 *
 * Why a ref-backed store instead of useState:
 *   - Section components write into staged state on every debounced
 *     input change. If that triggered re-renders across the whole
 *     modal, the text inputs would lose focus and every other section
 *     would flash.
 *   - The modal only needs to read the final state at commit time, not
 *     re-render when it changes. A useRef is perfect for that.
 *   - Sections that DO need to re-render on their own staged state
 *     (e.g., showing a "3 items staged" count) keep local useState and
 *     mirror it into the ref via stageItems().
 *
 * Phase B stages:
 *   - priority_items — from EveningTomorrowCaptureSection
 *   - (future) mindsweep_items — Phase C
 *
 * Morning rhythms don't use this context — their sections render data
 * but don't stage anything for commit. The context is still provided
 * to morning modals for symmetry; it just stays empty.
 */

import {
  createContext,
  useContext,
  useRef,
  useCallback,
  type ReactNode,
} from 'react'
import type {
  RhythmCompletionMetadata,
  RhythmPriorityItem,
} from '@/types/rhythms'
import type { StagedMindSweepLiteItem } from '@/lib/rhythm/commitMindSweepLite'

interface RhythmMetadataContextValue {
  /**
   * Stage the full priority_items array (called whenever the capture
   * section's in-memory state changes). Replaces prior stage.
   */
  stagePriorityItems: (items: RhythmPriorityItem[]) => void

  /**
   * Stage the MindSweep-Lite items (Phase C Enhancement 2). Called
   * whenever the section's in-memory state changes. Replaces prior
   * stage. These are committed to their classified destinations on
   * Close My Day via `commitMindSweepLite`.
   */
  stageMindSweepItems: (items: StagedMindSweepLiteItem[]) => void

  /**
   * Read the currently staged metadata. Modal calls this at commit time.
   * Returns a plain object — not a proxy — so it's safe to mutate.
   */
  readStagedMetadata: () => RhythmCompletionMetadata

  /**
   * Read the currently staged MindSweep-Lite items (before commit).
   * Used by the modal's handleComplete to pass into commitMindSweepLite.
   */
  readStagedMindSweepItems: () => StagedMindSweepLiteItem[]
}

const RhythmMetadataCtx = createContext<RhythmMetadataContextValue | null>(null)

export function RhythmMetadataProvider({ children }: { children: ReactNode }) {
  // Ref holds the latest staged metadata. Section components write into
  // this via the callbacks below; nothing here causes a re-render.
  const metadataRef = useRef<RhythmCompletionMetadata>({})
  // Phase C: MindSweep-Lite staged items are held separately (with
  // richer per-item fields than RhythmMindSweepItem — the commit
  // utility enriches them on Close My Day).
  const mindSweepRef = useRef<StagedMindSweepLiteItem[]>([])

  const stagePriorityItems = useCallback((items: RhythmPriorityItem[]) => {
    metadataRef.current = {
      ...metadataRef.current,
      priority_items: items,
    }
  }, [])

  const stageMindSweepItems = useCallback((items: StagedMindSweepLiteItem[]) => {
    mindSweepRef.current = items
  }, [])

  const readStagedMetadata = useCallback((): RhythmCompletionMetadata => {
    return { ...metadataRef.current }
  }, [])

  const readStagedMindSweepItems = useCallback((): StagedMindSweepLiteItem[] => {
    return [...mindSweepRef.current]
  }, [])

  const value: RhythmMetadataContextValue = {
    stagePriorityItems,
    stageMindSweepItems,
    readStagedMetadata,
    readStagedMindSweepItems,
  }

  return <RhythmMetadataCtx.Provider value={value}>{children}</RhythmMetadataCtx.Provider>
}

/**
 * Hook for section components that need to stage metadata. Returns the
 * staging API. Safe to call outside a provider — returns no-op functions
 * so a section component can render in the Rhythms Settings preview
 * without a modal wrapping it.
 */
export function useRhythmMetadataStaging(): RhythmMetadataContextValue {
  const ctx = useContext(RhythmMetadataCtx)
  if (ctx) return ctx
  // Outside a provider — return no-ops so section components are still
  // renderable in isolation (e.g., Settings page preview, Storybook).
  return {
    stagePriorityItems: () => {},
    stageMindSweepItems: () => {},
    readStagedMetadata: () => ({}),
    readStagedMindSweepItems: () => [],
  }
}
