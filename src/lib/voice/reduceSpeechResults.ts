/**
 * reduceSpeechResults — pure reducer for a Web Speech API `onresult` event.
 *
 * Extracted from useVoiceInput so it can be unit-tested without a microphone
 * (CI has no audio device). This is the drift guard for the duplication bug:
 * the previous implementation iterated `event.results` from index 0 on every
 * event and re-appended ALL prior finalized phrases, so "A. B. C." accumulated
 * into "A A B A B C". With `continuous = true`, `event.results` grows across
 * the session, so index-0 iteration double-counts everything.
 *
 * The fix: only read results from `event.resultIndex` forward — the index of
 * the first result that changed in this event — so each finalized phrase is
 * emitted exactly once. Accumulation across Chrome's silent auto-restarts is
 * handled by the caller (a ref that persists between recognition sessions),
 * NOT here — each fresh recognition session starts its own `results` list at
 * index 0, and this reducer only ever returns the newly-changed slice.
 */

export interface SpeechAlternativeLike {
  transcript: string
}

export interface SpeechResultLike {
  isFinal: boolean
  0: SpeechAlternativeLike
  [index: number]: SpeechAlternativeLike
}

export interface SpeechResultsLike {
  length: number
  [index: number]: SpeechResultLike
}

export interface SpeechResultEventLike {
  resultIndex: number
  results: SpeechResultsLike
}

/**
 * Returns the newly-finalized text (to be appended to the accumulator) and the
 * current interim (in-progress) text (to be shown live, never accumulated).
 */
export function reduceSpeechResults(event: SpeechResultEventLike): {
  finalChunk: string
  interim: string
} {
  let finalChunk = ''
  let interim = ''
  const start = typeof event.resultIndex === 'number' ? event.resultIndex : 0
  for (let i = start; i < event.results.length; i++) {
    const result = event.results[i]
    const transcript = result?.[0]?.transcript ?? ''
    if (result?.isFinal) {
      finalChunk += transcript + ' '
    } else {
      interim += transcript
    }
  }
  return { finalChunk, interim }
}
