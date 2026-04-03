/**
 * VoiceInputButton — Shared voice dictation button for textarea-style inputs.
 *
 * Wraps useVoiceInput hook with toggle logic, mic button, and interim preview.
 * Appends transcribed text via onTranscript callback.
 *
 * For chat-style inputs (LiLa Drawer/Modal), the inline pattern with Tooltips
 * and separate status bars is used instead.
 */

import { useCallback } from 'react'
import { Mic, MicOff } from 'lucide-react'
import { useVoiceInput, formatDuration } from '@/hooks/useVoiceInput'

interface VoiceInputButtonProps {
  /** Called with transcribed text when recording stops */
  onTranscript: (text: string) => void
  /** Additional disabled state (e.g. while AI is parsing) */
  disabled?: boolean
  /** Icon size in px */
  size?: number
  /** Button label when idle. false = icon only */
  label?: string | false
  /** Label shown when recording stops and transcription is in progress */
  recordingLabel?: string
  /** Minimum touch target height */
  minHeight?: number | string
  /** Extra className on the outer wrapper */
  className?: string
  /** Extra className on the button itself */
  buttonClassName?: string
  /** Show interim transcription preview below the button */
  showInterim?: boolean
}

export function VoiceInputButton({
  onTranscript,
  disabled = false,
  size = 14,
  label = 'Dictate',
  recordingLabel,
  minHeight = 'unset',
  className = '',
  buttonClassName = 'px-3 py-1.5 text-sm',
  showInterim = true,
}: VoiceInputButtonProps) {
  const voice = useVoiceInput()

  const handleToggle = useCallback(async () => {
    if (voice.state === 'recording') {
      const text = await voice.stopRecording()
      if (text) onTranscript(text)
    } else if (voice.state === 'idle') {
      await voice.startRecording()
    }
  }, [voice, onTranscript])

  if (!voice.isSupported) return null

  return (
    <div className={className}>
      {showInterim && voice.state === 'recording' && voice.interimText && (
        <p className="text-xs italic px-1 mb-1" style={{ color: 'var(--color-text-tertiary)' }}>
          {voice.interimText}
        </p>
      )}
      <button
        type="button"
        onClick={handleToggle}
        disabled={voice.state === 'transcribing' || disabled}
        className={`flex items-center gap-1.5 rounded-lg font-medium disabled:opacity-50 ${buttonClassName}`}
        style={{
          backgroundColor: voice.state === 'recording'
            ? 'color-mix(in srgb, var(--color-error, #c44) 15%, transparent)'
            : 'var(--color-bg-secondary)',
          color: voice.state === 'recording'
            ? 'var(--color-error, #c44)'
            : 'var(--color-text-secondary)',
          minHeight: typeof minHeight === 'number' ? `${minHeight}px` : minHeight,
        }}
      >
        {voice.state === 'recording' ? <MicOff size={size} /> : <Mic size={size} />}
        {voice.state === 'recording'
          ? (recordingLabel ?? formatDuration(voice.duration))
          : voice.state === 'transcribing'
            ? 'Transcribing...'
            : (label || null)}
      </button>
    </div>
  )
}
