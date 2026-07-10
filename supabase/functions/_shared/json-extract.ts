// Robust JSON-object extraction for LLM classifier responses.
//
// Zero imports (mirrors crisis-detection.ts / ethics-guard.ts) so the
// red-team vitest can import it directly via a plain relative path without a
// Deno runtime.
//
// WHY THIS EXISTS (found live 2026-07-09, Phase-4 Step-0 check): the old
// fence-only cleanup `text.replace(/^```(?:json)?\s*/,'').replace(/\s*```$/,'')`
// only strips a closing ``` when it is the very LAST thing in the string.
// Haiku (esp. at a generous max_tokens) frequently returns valid JSON in a
// ```json fence AND appends an explanatory paragraph after the closing fence:
//
//   ```json
//   {"concerns": []}
//   ```
//
//   This conversation shows a straightforward, appropriate interaction...
//
// The trailing prose left the closing ``` un-stripped, so JSON.parse() hit
// the leftover backticks, threw, and the caller treated the throw as
// "classification failed" (null). In safety-classify that left 12 monitored-
// kid conversations permanently unscanned by Layer 2 (deterministic at
// temperature 0) — and would silently drop a REAL concern's classification
// the same way. validate-ai-output's tier2Confirm had the identical regex.
//
// Fix: grab the substring from the first '{' to the last '}' and let the
// caller JSON.parse() that. This tolerates a leading/trailing fence and
// leading/trailing prose. Assumes a single top-level JSON object (which both
// the PRD-30 classification prompt and the PRD-41 Tier-2 prompt produce); the
// caller still handles JSON.parse failure, so a pathological response degrades
// to the same null the caller already handles — never worse than before.

export function extractJsonObject(text: string): string | null {
  if (!text) return null
  const start = text.indexOf('{')
  const end = text.lastIndexOf('}')
  if (start === -1 || end === -1 || end < start) return null
  return text.slice(start, end + 1)
}
