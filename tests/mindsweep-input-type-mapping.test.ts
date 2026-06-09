/**
 * NEW-QQQ regression test (bug 16e94c3b, worksheet row 223).
 *
 * Repro that motivated this: mom scanned an image on /sweep, saved the OCR
 * text "for later" (mindsweep_holding row with content_type='scan_extracted'),
 * then hit "Sweep All" — the client passed the holding content_type straight
 * through as the Edge Function's input_type, which is NOT in mindsweep-sort's
 * Zod input_type enum → 400 → silent catch → "Something went wrong."
 * Fixed in f317d18 (2026-04-06) by mapContentTypeToInputType().
 *
 * This test pins the contract so the failure class stays closed:
 * every content_type a holding row (or capture path) can carry MUST map to
 * a value inside the Edge Function's input_type enum.
 *
 * If the Edge Function enum changes
 * (supabase/functions/mindsweep-sort/index.ts InputSchema.input_type),
 * update EDGE_FUNCTION_INPUT_TYPES in contentTypeMapping.ts to match.
 */
import { describe, it, expect } from 'vitest'
import {
  mapContentTypeToInputType,
  HOLDING_CONTENT_TYPES,
  EDGE_FUNCTION_INPUT_TYPES,
} from '@/lib/mindsweep/contentTypeMapping'

const EDGE_ENUM = new Set<string>(EDGE_FUNCTION_INPUT_TYPES)

describe('MindSweep content_type → input_type mapping (NEW-QQQ guard)', () => {
  it.each([...HOLDING_CONTENT_TYPES])(
    'maps holding content_type %s into the Edge Function enum',
    (contentType) => {
      const mapped = mapContentTypeToInputType(contentType)
      expect(EDGE_ENUM.has(mapped)).toBe(true)
    },
  )

  it('maps the exact NEW-QQQ repro type (scan_extracted → image)', () => {
    expect(mapContentTypeToInputType('scan_extracted')).toBe('image')
  })

  it('never passes scan_extracted through unmapped (the original bug)', () => {
    expect(mapContentTypeToInputType('scan_extracted')).not.toBe('scan_extracted')
  })

  it('maps calendar_file to text (calendar_file is NOT in the Edge enum)', () => {
    expect(EDGE_ENUM.has('calendar_file')).toBe(false)
    expect(mapContentTypeToInputType('calendar_file')).toBe('text')
  })

  it('falls back to text for unknown future content types', () => {
    expect(mapContentTypeToInputType('some_future_type')).toBe('text')
    expect(EDGE_ENUM.has(mapContentTypeToInputType('some_future_type'))).toBe(true)
  })
})
