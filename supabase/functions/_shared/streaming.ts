// Shared SSE streaming utilities for lila-* Edge Functions.
// Encapsulates the ReadableStream + TextEncoder boilerplate.

import { sseHeaders } from './cors.ts'

/**
 * Create an SSE streaming Response.
 * The handler receives a controller and encoder; it should enqueue chunks
 * and close the controller when done.
 *
 * Usage:
 *   return createSSEStream(async (enqueue) => {
 *     enqueue({ type: 'chunk', content: 'hello' })
 *     enqueue('[DONE]')
 *   })
 */
export function createSSEStream(
  handler: (enqueue: SSEEnqueue) => Promise<void>,
): Response {
  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    async start(controller) {
      const enqueue: SSEEnqueue = (data) => {
        if (data === '[DONE]') {
          controller.enqueue(encoder.encode('data: [DONE]\n\n'))
        } else {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`))
        }
      }

      try {
        await handler(enqueue)
      } finally {
        controller.close()
      }
    },
  })

  return new Response(stream, { headers: sseHeaders })
}

export type SSEEnqueue = (data: Record<string, unknown> | '[DONE]') => void

/**
 * Process an OpenRouter streaming response body, accumulating the full text
 * and forwarding chunks to the SSE enqueue function.
 *
 * Returns { fullText, inputTokens, outputTokens }.
 */
export async function processOpenRouterStream(
  body: ReadableStream<Uint8Array>,
  enqueue: SSEEnqueue,
): Promise<{ fullText: string; inputTokens: number; outputTokens: number }> {
  const reader = body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  let fullText = ''
  let inputTokens = 0
  let outputTokens = 0

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split('\n')
    buffer = lines.pop() || ''

    for (const line of lines) {
      if (!line.startsWith('data: ')) continue
      const data = line.slice(6).trim()
      if (data === '[DONE]') {
        enqueue('[DONE]')
        continue
      }
      try {
        const parsed = JSON.parse(data)
        const chunk = parsed.choices?.[0]?.delta?.content || ''
        if (chunk) {
          fullText += chunk
          enqueue({ type: 'chunk', content: chunk })
        }
        if (parsed.usage) {
          inputTokens = parsed.usage.prompt_tokens || 0
          outputTokens = parsed.usage.completion_tokens || 0
        }
      } catch {
        // skip malformed SSE lines
      }
    }
  }

  return { fullText, inputTokens, outputTokens }
}
