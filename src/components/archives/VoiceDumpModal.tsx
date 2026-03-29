/**
 * VoiceDumpModal — PRD-13B
 * Voice recording that auto-populates the BulkAddSortModal.
 * Uses the same useVoiceInput hook as Smart Notepad and LiLa.
 * Flow: Record → Transcribe → Auto-open Bulk Add with transcript.
 */

import { useCallback } from 'react'
import { Mic, Square, Loader } from 'lucide-react'
import { ModalV2 } from '@/components/shared'
import { useVoiceInput } from '@/hooks/useVoiceInput'

interface VoiceDumpModalProps {
  open: boolean
  onClose: () => void
  /** Called with transcript text when recording finishes */
  onTranscriptReady: (text: string) => void
}

export function VoiceDumpModal({ open, onClose, onTranscriptReady }: VoiceDumpModalProps) {
  const voice = useVoiceInput()

  const handleToggleRecording = useCallback(async () => {
    if (voice.state === 'recording') {
      const transcript = await voice.stopRecording()
      if (transcript && transcript.trim()) {
        onTranscriptReady(transcript.trim())
        onClose()
      }
    } else {
      await voice.startRecording()
    }
  }, [voice, onTranscriptReady, onClose])

  const handleStop = useCallback(async () => {
    const transcript = await voice.stopRecording()
    if (transcript && transcript.trim()) {
      onTranscriptReady(transcript.trim())
      onClose()
    }
  }, [voice, onTranscriptReady, onClose])

  const handleClose = useCallback(() => {
    if (voice.state === 'recording') {
      voice.stopRecording()
    }
    onClose()
  }, [voice, onClose])

  const formatDuration = (seconds: number) => {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  return (
    <ModalV2 id="archive-voice-dump" isOpen={open} onClose={handleClose} type="transient" title="Voice Dump" size="sm">
      <div className="py-6 flex flex-col items-center gap-5">
        {/* Subtitle */}
        <p className="text-sm text-center px-4" style={{ color: 'var(--color-text-secondary)' }}>
          Just talk about your family. LiLa will sort everything to the right people.
        </p>

        {/* Mic button */}
        {voice.state === 'transcribing' ? (
          <div className="flex flex-col items-center gap-3">
            <div
              className="w-20 h-20 rounded-full flex items-center justify-center"
              style={{ backgroundColor: 'var(--color-bg-secondary)' }}
            >
              <Loader size={32} className="animate-spin" style={{ color: 'var(--color-text-secondary)' }} />
            </div>
            <p className="text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>
              Sorting your voice note...
            </p>
          </div>
        ) : voice.state === 'recording' ? (
          <div className="flex flex-col items-center gap-3">
            {/* Pulsing red mic */}
            <button
              onClick={handleStop}
              className="w-20 h-20 rounded-full flex items-center justify-center animate-pulse transition-colors"
              style={{ backgroundColor: 'var(--color-error, #ef4444)' }}
              aria-label="Stop recording"
            >
              <Square size={28} fill="currentColor" color="currentColor" style={{ color: 'var(--color-btn-primary-text, #fff)' }} />
            </button>

            {/* Duration */}
            <p className="text-sm font-mono font-medium" style={{ color: 'var(--color-text-primary)' }}>
              {formatDuration(voice.duration)}
            </p>

            {/* Interim transcript preview */}
            {voice.interimText && (
              <div
                className="w-full max-h-32 overflow-y-auto rounded-lg p-3 text-sm"
                style={{
                  backgroundColor: 'var(--color-bg-secondary)',
                  color: 'var(--color-text-primary)',
                  border: '1px solid var(--color-border)',
                }}
              >
                {voice.interimText}
              </div>
            )}

            <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
              Tap to stop recording
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3">
            <button
              onClick={handleToggleRecording}
              disabled={!voice.isSupported}
              className="w-20 h-20 rounded-full flex items-center justify-center transition-transform hover:scale-105 active:scale-95"
              style={{
                background: 'var(--surface-primary, var(--color-btn-primary-bg))',
                color: 'var(--color-btn-primary-text)',
                opacity: voice.isSupported ? 1 : 0.5,
              }}
              aria-label="Start recording"
            >
              <Mic size={32} />
            </button>

            {!voice.isSupported && (
              <p className="text-xs" style={{ color: 'var(--color-error, #ef4444)' }}>
                Voice recording is not supported in this browser.
              </p>
            )}

            <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
              Tap to start
            </p>
          </div>
        )}
      </div>
    </ModalV2>
  )
}
