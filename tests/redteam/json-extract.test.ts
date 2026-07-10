// Regression pin for the Phase-4 Step-0 finding (2026-07-09): LLM classifier
// responses that wrap valid JSON in a ```json fence AND append an explanatory
// paragraph after the closing fence broke the old fence-only cleanup regex,
// so JSON.parse threw and the caller treated it as "classification failed"
// (null). In safety-classify (PRD-30 Layer 2) this silently left monitored-
// kid conversations unscanned forever; the identical regex in
// validate-ai-output (PRD-41 Tier 2) would silently skip a real violation.
//
// Feeds the EXACT live-observed failure shapes through the shared extractor +
// JSON.parse (the two functions' parse path) and pins that both functions
// import the extractor and no longer carry the brittle fence-only strip.
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'fs'
import path from 'path'
import { extractJsonObject } from '../../supabase/functions/_shared/json-extract'

const FN_DIR = path.resolve(__dirname, '..', '..', 'supabase', 'functions')

/** Mirrors what classifyTranscript / tier2Confirm do after extraction. */
function parseViaExtractor(text: string): unknown | null {
  const candidate = extractJsonObject(text)
  if (candidate === null) return null
  try {
    return JSON.parse(candidate)
  } catch {
    return null
  }
}

describe('json-extract — fenced JSON + trailing prose (Phase-4 Step-0 regression)', () => {
  it('safety-classify shape: fenced {"concerns": []} + trailing paragraph parses', () => {
    // The literal response captured live from Haiku for a benign transcript.
    const live = '```json\n{"concerns": []}\n```\n\nThis conversation shows a straightforward, appropriate educational interaction. There are no indicators of any safety concerns across the evaluated categories.'
    expect(parseViaExtractor(live)).toEqual({ concerns: [] })
  })

  it('tier2 shape: fenced verdict object + trailing paragraph parses', () => {
    const live = '```json\n{"verdict": "clean", "confidence": 0.92, "reasoning": "benign coaching"}\n```\n\nThe conversation shows a normal, healthy exchange with no facilitation of any harmful pattern.'
    expect(parseViaExtractor(live)).toEqual({ verdict: 'clean', confidence: 0.92, reasoning: 'benign coaching' })
  })

  it('non-empty concerns with trailing prose still parses (a REAL concern must not be dropped)', () => {
    const live = '```json\n{"concerns": [{"category": "self_harm", "severity": "critical", "key_message_indices": [0], "reasoning": "explicit ideation"}]}\n```\n\nThis is a serious safety concern requiring immediate attention.'
    expect(parseViaExtractor(live)).toEqual({
      concerns: [{ category: 'self_harm', severity: 'critical', key_message_indices: [0], reasoning: 'explicit ideation' }],
    })
  })

  it('leading prose + fenced JSON parses', () => {
    expect(parseViaExtractor('Here is the result:\n```json\n{"concerns": []}\n```')).toEqual({ concerns: [] })
  })

  it('plain fenced JSON (no prose) still parses — no regression on the happy path', () => {
    expect(parseViaExtractor('```json\n{"concerns": []}\n```')).toEqual({ concerns: [] })
  })

  it('bare JSON (no fence, no prose) still parses', () => {
    expect(parseViaExtractor('{"concerns": []}')).toEqual({ concerns: [] })
  })

  it('extractJsonObject returns null on no object (caller then returns null, same as before)', () => {
    expect(extractJsonObject('')).toBeNull()
    expect(extractJsonObject('no json here at all')).toBeNull()
    expect(extractJsonObject('} out of order {')).toBeNull()
  })
})

describe('json-extract — static drift pins (both parse paths hardened)', () => {
  it('safety-classify imports + uses extractJsonObject and NO LONGER carries the brittle fence-only strip', () => {
    const src = readFileSync(path.join(FN_DIR, 'safety-classify', 'index.ts'), 'utf-8')
    expect(src).toContain("from '../_shared/json-extract.ts'")
    expect(src).toContain('extractJsonObject(')
    expect(src).not.toContain("replace(/\\s*```$/")
  })

  it('validate-ai-output imports + uses extractJsonObject and NO LONGER carries the brittle fence-only strip', () => {
    const src = readFileSync(path.join(FN_DIR, 'validate-ai-output', 'index.ts'), 'utf-8')
    expect(src).toContain("from '../_shared/json-extract.ts'")
    expect(src).toContain('extractJsonObject(')
    expect(src).not.toContain("replace(/\\s*```$/")
  })

  it('neither classifier cost-logs the zero-UUID sentinel any longer (FK-violation fix)', () => {
    const sc = readFileSync(path.join(FN_DIR, 'safety-classify', 'index.ts'), 'utf-8')
    const vao = readFileSync(path.join(FN_DIR, 'validate-ai-output', 'index.ts'), 'utf-8')
    // The sentinel may still appear in a NOTE comment; assert it is not passed
    // as a memberId/familyId value in a logAICost call.
    expect(/memberId:\s*'00000000-0000-0000-0000-000000000000'/.test(sc)).toBe(false)
    expect(/familyId:\s*'00000000-0000-0000-0000-000000000000'/.test(vao)).toBe(false)
    expect(/memberId:\s*'00000000-0000-0000-0000-000000000000'/.test(vao)).toBe(false)
  })
})
