// MyAIM Central — Shared OpenRouter Client
//
// The single entry point for every OpenRouter request in the platform.
// Injects `provider: { data_collection: "deny" }` on every request so
// OpenRouter routes ONLY to upstream providers that do not retain or train
// on the request — the structural hardening described in
// claude/legal-drafts/no-training-verification.md condition 3 (the
// no-training claim in the parental-consent copy draft). Before this file
// existed, ~45 call sites across ~30 Edge Functions each built their own
// fetch() call with no `provider` field at all, relying solely on
// account-level dashboard defaults that the application code could not see
// or guarantee.
//
// Do not construct an OpenRouter fetch() call outside this file — every
// call site must import OPENROUTER_URL / openRouterHeaders / withNoTraining
// (or callOpenRouter) from here. The regression pin in
// tests/e2e/features/notrain-harden.spec.ts fails the build if a new call
// site hardcodes the OpenRouter URL or ships a request body that was never
// passed through withNoTraining().

export const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions'

export interface OpenRouterRequestBody {
  model: string
  // Message shapes vary widely across call sites (plain {role,content} pairs,
  // vision content arrays, etc.) — left as unknown[] since this module never
  // inspects message contents, only forwards them.
  messages: unknown[]
  provider?: Record<string, unknown>
  [key: string]: unknown
}

/**
 * Forces `provider.data_collection: "deny"` onto a request body, merging
 * with (and overriding) any `provider` field the caller already set. This
 * is the ONLY place in the codebase that should set this field — do not
 * set `data_collection` at a call site.
 */
export function withNoTraining(body: OpenRouterRequestBody): OpenRouterRequestBody {
  return {
    ...body,
    provider: { ...(body.provider ?? {}), data_collection: 'deny' },
  }
}

/**
 * Standard OpenRouter request headers. `title` overrides the default
 * X-Title (several tools identify themselves individually in OpenRouter's
 * dashboard); Authorization, Content-Type, and HTTP-Referer are fixed
 * platform-wide.
 */
export function openRouterHeaders(apiKey: string, title = 'MyAIM Central'): Record<string, string> {
  return {
    'Authorization': `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
    'HTTP-Referer': 'https://myaimcentral.com',
    'X-Title': title,
  }
}

/**
 * The standard OpenRouter call — covers the overwhelming majority of call
 * sites (a single fetch, streaming or not, no retry wrapper). Callers that
 * need retry-on-transient-error behavior (BookShelf's extraction pipeline)
 * keep their own generic fetchWithRetry() but must still build the request
 * via openRouterHeaders() + withNoTraining() from this module.
 */
export async function callOpenRouter(
  apiKey: string,
  body: OpenRouterRequestBody,
  opts?: { title?: string },
): Promise<Response> {
  return fetch(OPENROUTER_URL, {
    method: 'POST',
    headers: openRouterHeaders(apiKey, opts?.title),
    body: JSON.stringify(withNoTraining(body)),
  })
}
