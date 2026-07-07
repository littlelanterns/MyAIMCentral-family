/**
 * Voice input duplication regression (VOICE-INPUT-REPAIR F1).
 *
 * The Web Speech preview engine used to iterate `event.results` from index 0
 * on every event. With `continuous = true`, `event.results` accumulates across
 * the session, so "A. B. C." compounded into "A A B A B C" — and because
 * recordings under 30s use this preview text as the final result (Whisper is
 * skipped to save cost), the garbled text is what actually landed in the box on
 * Chrome/Edge.
 *
 * reduceSpeechResults now reads only from `event.resultIndex` forward. This test
 * pins that behavior — voice can't be exercised end-to-end (CI has no mic), so
 * this pure-function pin is the drift guard.
 */
import { describe, it, expect } from 'vitest'
import {
  reduceSpeechResults,
  type SpeechResultEventLike,
  type SpeechResultLike,
} from '@/lib/voice/reduceSpeechResults'

// Build a fake SpeechRecognitionEvent-like object from a list of
// [transcript, isFinal] pairs plus the resultIndex the browser would report.
function makeEvent(
  results: Array<[string, boolean]>,
  resultIndex: number,
): SpeechResultEventLike {
  const list: Record<number, SpeechResultLike> & { length: number } = {
    length: results.length,
  }
  results.forEach(([transcript, isFinal], i) => {
    list[i] = { 0: { transcript }, isFinal } as SpeechResultLike
  })
  return { resultIndex, results: list }
}

// Reproduce the hook's accumulation loop over a whole session so we assert on
// the final combined text a consumer would actually receive.
function runSession(events: SpeechResultEventLike[]): { final: string; lastInterim: string } {
  let final = ''
  let lastInterim = ''
  for (const event of events) {
    const { finalChunk, interim } = reduceSpeechResults(event)
    if (finalChunk) final += finalChunk
    lastInterim = interim
  }
  return { final, lastInterim }
}

describe('reduceSpeechResults — no duplication (F1)', () => {
  it('single event: finalizes one phrase exactly once', () => {
    const { finalChunk, interim } = reduceSpeechResults(makeEvent([['hello world', true]], 0))
    expect(finalChunk).toBe('hello world ')
    expect(interim).toBe('')
  })

  it('interim-only event carries no final text', () => {
    const { finalChunk, interim } = reduceSpeechResults(makeEvent([['hel', false]], 0))
    expect(finalChunk).toBe('')
    expect(interim).toBe('hel')
  })

  it('the exact old-bug sequence: three phrases stay three phrases (not compounded)', () => {
    // Chrome fires events where `results` grows and `resultIndex` advances to
    // the newly-changed result. The OLD code iterated from 0 and produced
    // "Get the milk Get the milk And the eggs ..." — this pins the fix.
    const events = [
      makeEvent([['Get the milk', true]], 0),
      makeEvent([['Get the milk', true], ['and the eggs', true]], 1),
      makeEvent([['Get the milk', true], ['and the eggs', true], ['and bread', true]], 2),
    ]
    const { final } = runSession(events)
    expect(final.trim()).toBe('Get the milk and the eggs and bread')
  })

  it('interim then final for the same phrase is not double-counted', () => {
    const events = [
      makeEvent([['Get the', false]], 0),
      makeEvent([['Get the milk', false]], 0),
      makeEvent([['Get the milk', true]], 0),
    ]
    const { final, lastInterim } = runSession(events)
    expect(final.trim()).toBe('Get the milk')
    expect(lastInterim).toBe('')
  })

  it('final phrase followed by a live interim on the next result', () => {
    // Phrase 1 finalized at index 0; index 1 is still in progress.
    const { finalChunk, interim } = reduceSpeechResults(
      makeEvent([['first phrase', true], ['second', false]], 1),
    )
    // resultIndex=1 means phrase 1 was already emitted on a prior event — don't
    // re-append it.
    expect(finalChunk).toBe('')
    expect(interim).toBe('second')
  })

  it('cross-restart accumulation: a fresh session starts its results at 0 again', () => {
    // Chrome silently kills continuous recognition; the hook auto-restarts and
    // a NEW recognition session begins with its own results list at index 0.
    // The reducer only returns the new session's slice; the caller keeps the
    // accumulator. Simulate two sessions.
    const session1 = [makeEvent([['before restart', true]], 0)]
    const session2 = [makeEvent([['after restart', true]], 0)]
    const { final } = runSession([...session1, ...session2])
    expect(final.trim()).toBe('before restart after restart')
  })

  it('missing resultIndex falls back to 0 without throwing', () => {
    const event = { results: makeEvent([['ok', true]], 0).results } as SpeechResultEventLike
    const { finalChunk } = reduceSpeechResults(event)
    expect(finalChunk).toBe('ok ')
  })
})
