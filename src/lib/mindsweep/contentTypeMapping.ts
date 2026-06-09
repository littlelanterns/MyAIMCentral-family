/**
 * MindSweep content_type → Edge Function input_type mapping (pure module).
 *
 * Holding-queue rows use fine-grained content types (voice_short,
 * scan_extracted, ...) but the mindsweep-sort Edge Function's Zod schema
 * accepts only coarse input_type categories. Passing a holding content_type
 * straight through as input_type caused a Zod 400 on every "Sweep All" that
 * included a saved-for-later image (bug 16e94c3b / NEW-QQQ, fixed f317d18).
 *
 * This module is the contract that keeps that failure class closed —
 * tests/mindsweep-input-type-mapping.test.ts pins every mapping output to
 * the Edge Function enum. If you change the Edge Function's input_type enum
 * in supabase/functions/mindsweep-sort/index.ts, update
 * EDGE_FUNCTION_INPUT_TYPES below to match, and the test will tell you if
 * any mapping output falls outside it.
 */

import type { SweepInputType } from '@/types/mindsweep'

/** Every content_type value the mindsweep_holding CHECK constraint allows,
 *  plus 'calendar_file' which only ever arrives via direct capture paths. */
export const HOLDING_CONTENT_TYPES = [
  'voice_short',
  'voice_long',
  'text',
  'scan_extracted',
  'link',
  'email',
  'calendar_file',
] as const

/** Mirror of the mindsweep-sort Edge Function InputSchema input_type enum.
 *  (Note: the Edge enum does NOT include 'calendar_file' — that is exactly
 *  why calendar_file content must map to 'text'.) */
export const EDGE_FUNCTION_INPUT_TYPES = [
  'voice',
  'text',
  'image',
  'link',
  'email',
  'mixed',
] as const

/** Map holding-queue content_type → Edge Function input_type. */
export function mapContentTypeToInputType(contentType: string): SweepInputType {
  switch (contentType) {
    case 'voice_short':
    case 'voice_long':
      return 'voice'
    case 'scan_extracted':
      return 'image'
    case 'link':
      return 'link'
    case 'email':
      return 'email'
    case 'calendar_file':
      return 'text'
    default:
      return 'text'
  }
}
