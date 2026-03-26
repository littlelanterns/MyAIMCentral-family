import { useState, useRef } from 'react'
import { Copy, Check } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'

interface Props {
  text: string
  memberId: string | null
  vaultItemId: string
  promptEntryId?: string | null
  /** Label next to icon */
  label?: string
  size?: 'sm' | 'md'
}

/**
 * Single-tap copy with toast confirmation + copy event logging (PRD-21A).
 * Rate limiting: soft — after 20 copies/60min shows a gentle message, copy still works.
 */

// Module-level rate tracking
const copyTimestamps: number[] = []
const RATE_LIMIT = 20
const RATE_WINDOW_MS = 60 * 60 * 1000

export function CopyPromptButton({ text, memberId, vaultItemId, promptEntryId, label = 'Copy', size = 'sm' }: Props) {
  const [copied, setCopied] = useState(false)
  const [rateLimitMsg, setRateLimitMsg] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout>>()

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation()

    // Copy to clipboard
    try {
      await navigator.clipboard.writeText(text)
    } catch {
      const textarea = document.createElement('textarea')
      textarea.value = text
      textarea.style.position = 'fixed'
      textarea.style.opacity = '0'
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand('copy')
      document.body.removeChild(textarea)
    }

    // Show copied state
    setCopied(true)
    clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => setCopied(false), 2000)

    // Log copy event
    if (memberId) {
      supabase.from('vault_copy_events').insert({
        user_id: memberId,
        vault_item_id: vaultItemId,
        prompt_entry_id: promptEntryId || null,
      }).then(() => {})
    }

    // Rate limit check (soft)
    const now = Date.now()
    copyTimestamps.push(now)
    // Clean old timestamps
    while (copyTimestamps.length > 0 && copyTimestamps[0] < now - RATE_WINDOW_MS) {
      copyTimestamps.shift()
    }
    if (copyTimestamps.length >= RATE_LIMIT && !rateLimitMsg) {
      setRateLimitMsg(true)
      setTimeout(() => setRateLimitMsg(false), 5000)
    }
  }

  const iconSize = size === 'sm' ? 12 : 14
  const padding = size === 'sm' ? 'px-2 py-1' : 'px-3 py-1.5'
  const textSize = size === 'sm' ? 'text-xs' : 'text-sm'

  return (
    <div className="relative inline-block">
      <button
        onClick={handleCopy}
        className={`flex items-center gap-1 ${padding} rounded ${textSize} font-medium transition-colors`}
        style={{
          backgroundColor: copied ? 'var(--color-success, #22c55e)' : 'var(--color-bg-secondary)',
          color: copied ? '#fff' : 'var(--color-text-primary)',
        }}
      >
        {copied ? <Check size={iconSize} /> : <Copy size={iconSize} />}
        {copied ? 'Copied!' : label}
      </button>

      {/* Soft rate limit message */}
      {rateLimitMsg && (
        <div
          className="absolute bottom-full left-0 mb-2 p-2 rounded-lg text-xs w-56 shadow-lg z-50"
          style={{
            backgroundColor: 'var(--color-bg-card)',
            border: '1px solid var(--color-border)',
            color: 'var(--color-text-secondary)',
          }}
        >
          You're saving a lot of prompts! Remember you can bookmark packs and come back anytime — they're always here for you.
        </div>
      )}
    </div>
  )
}
