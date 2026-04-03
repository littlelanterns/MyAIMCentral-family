import { useState, useRef, useCallback, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'

/**
 * useVoiceInput — Whisper-primary voice transcription with Web Speech API fallback.
 *
 * Flow:
 * 1. User taps mic → start recording (MediaRecorder) + Web Speech API (interim preview)
 * 2. User taps mic again → stop recording
 * 3. Send audio blob to whisper-transcribe Edge Function (primary)
 * 4. If Whisper fails, fall back to accumulated Web Speech API text
 */

type VoiceState = 'idle' | 'recording' | 'transcribing'

interface UseVoiceInputReturn {
  state: VoiceState
  duration: number
  interimText: string
  startRecording: () => Promise<void>
  stopRecording: () => Promise<string>
  cancelRecording: () => void
  isSupported: boolean
}

export function useVoiceInput(): UseVoiceInputReturn {
  const [state, setState] = useState<VoiceState>('idle')
  const [duration, setDuration] = useState(0)
  const [interimText, setInterimText] = useState('')

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const speechRecognitionRef = useRef<any>(null)
  const webSpeechFinalRef = useRef<string>('')
  const webSpeechInterimRef = useRef<string>('')
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const timerRef = useRef<any>(undefined)
  const startTimeRef = useRef<number>(0)
  const streamRef = useRef<MediaStream | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const stoppedRef = useRef(false)

  const isSupported = typeof navigator !== 'undefined' && !!navigator.mediaDevices?.getUserMedia

  const cleanup = useCallback(() => {
    stoppedRef.current = true
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = undefined
    }
    if (speechRecognitionRef.current) {
      try { speechRecognitionRef.current.abort() } catch { /* ignore */ }
      speechRecognitionRef.current = null
    }
    if (audioContextRef.current) {
      try { audioContextRef.current.close() } catch { /* ignore */ }
      audioContextRef.current = null
      analyserRef.current = null
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop())
      streamRef.current = null
    }
    mediaRecorderRef.current = null
    audioChunksRef.current = []
    webSpeechFinalRef.current = ''
    webSpeechInterimRef.current = ''
    setInterimText('')
    setDuration(0)
  }, [])

  const startRecording = useCallback(async () => {
    if (state !== 'idle') return
    cleanup()
    stoppedRef.current = false

    try {
      // Request audio with minimal constraints — let the browser pick the best mic
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream

      // Log which mic we got
      const audioTrack = stream.getAudioTracks()[0]
      console.log(`[Voice] Mic: "${audioTrack.label}", enabled=${audioTrack.enabled}, muted=${audioTrack.muted}`)
      console.log(`[Voice] Track settings:`, audioTrack.getSettings())

      // Set up audio level monitoring to verify the mic is working
      const audioCtx = new AudioContext()
      audioContextRef.current = audioCtx
      const source = audioCtx.createMediaStreamSource(stream)
      const analyser = audioCtx.createAnalyser()
      analyser.fftSize = 256
      source.connect(analyser)
      analyserRef.current = analyser

      // Determine best audio format — prefer webm (Whisper accepts it)
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : MediaRecorder.isTypeSupported('audio/webm')
          ? 'audio/webm'
          : 'audio/mp4'

      const recorder = new MediaRecorder(stream, {
        mimeType,
        audioBitsPerSecond: 128000, // 128kbps — good quality for speech
      })
      mediaRecorderRef.current = recorder
      audioChunksRef.current = []

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data)
        }
      }

      recorder.start(1000) // Collect data every second
      setState('recording')
      startTimeRef.current = Date.now()

      // Duration timer + audio level check
      let levelCheckCount = 0
      timerRef.current = window.setInterval(() => {
        setDuration(Math.floor((Date.now() - startTimeRef.current) / 1000))

        // Log audio level every 3 seconds to verify mic is capturing
        levelCheckCount++
        if (levelCheckCount % 6 === 0 && analyserRef.current) {
          const data = new Uint8Array(analyserRef.current.frequencyBinCount)
          analyserRef.current.getByteFrequencyData(data)
          const avg = data.reduce((sum, v) => sum + v, 0) / data.length
          const max = Math.max(...data)
          const totalSize = audioChunksRef.current.reduce((s, c) => s + c.size, 0)
          console.log(`[Voice] Level: avg=${avg.toFixed(1)}, max=${max}, chunks=${audioChunksRef.current.length}, totalKB=${(totalSize/1024).toFixed(1)}`)
          if (avg < 1 && levelCheckCount > 6) {
            console.warn('[Voice] ⚠️ Mic appears silent — check your microphone input')
          }
        }
      }, 500)

      // Start Web Speech API for live preview text
      startWebSpeech()

    } catch (err) {
      cleanup()
      setState('idle')
      throw new Error('Microphone access denied')
    }
  }, [state, cleanup])

  // Web Speech API — handles auto-restart on Chrome's silent kills
  function startWebSpeech() {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SpeechRecognition) return

    const recognition = new SpeechRecognition()
    recognition.continuous = true
    recognition.interimResults = true
    recognition.lang = 'en-US'

    recognition.onresult = (event: any) => {
      let sessionFinal = ''
      let interim = ''
      for (let i = 0; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript
        if (event.results[i].isFinal) {
          sessionFinal += transcript + ' '
        } else {
          interim += transcript
        }
      }
      // Accumulate finalized text across recognition restarts
      webSpeechInterimRef.current = interim
      if (sessionFinal.trim()) {
        // Only update if we got new final text (avoid duplicates on restart)
        const combined = webSpeechFinalRef.current + sessionFinal
        webSpeechFinalRef.current = combined
      }
      setInterimText((webSpeechFinalRef.current + interim).trim())
    }

    // Chrome kills continuous recognition silently — auto-restart
    recognition.onend = () => {
      if (!stoppedRef.current) {
        // Restart recognition to keep capturing
        try {
          recognition.start()
        } catch {
          // Can't restart — that's fine, Whisper is the primary path
        }
      }
    }

    recognition.onerror = (event: any) => {
      // 'no-speech' and 'aborted' are normal during pauses — ignore
      if (event.error !== 'no-speech' && event.error !== 'aborted') {
        console.warn('Web Speech API error:', event.error)
      }
    }

    try {
      recognition.start()
    } catch {
      // Browser doesn't support — that's fine
    }
    speechRecognitionRef.current = recognition
  }

  const stopRecording = useCallback(async (): Promise<string> => {
    if (state !== 'recording' || !mediaRecorderRef.current) {
      return ''
    }

    // Mark as stopped so Web Speech doesn't auto-restart
    stoppedRef.current = true

    const recorder = mediaRecorderRef.current
    const mimeType = recorder.mimeType

    // Grab Web Speech text before anything gets cleaned up
    const webSpeechText = (webSpeechFinalRef.current + webSpeechInterimRef.current).trim()

    // Stop Web Speech
    if (speechRecognitionRef.current) {
      try { speechRecognitionRef.current.abort() } catch { /* ignore */ }
      speechRecognitionRef.current = null
    }

    // Stop duration timer
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = undefined
    }

    // Wait for MediaRecorder to finish and collect all audio data
    const audioBlob = await new Promise<Blob>((resolve) => {
      recorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: mimeType })
        console.log(`[Voice] Audio blob: ${(blob.size / 1024).toFixed(1)}KB, ${audioChunksRef.current.length} chunks, type=${mimeType}`)
        resolve(blob)
      }
      // Request any remaining buffered data before stopping
      try { recorder.requestData() } catch { /* not all browsers support this */ }
      recorder.stop()
    })

    // Release microphone
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop())
      streamRef.current = null
    }

    setState('transcribing')

    // Primary: Whisper transcription
    try {
      console.log('[Voice] Sending to Whisper...')
      const text = await transcribeWithWhisper(audioBlob, mimeType)
      console.log(`[Voice] Whisper result: "${text.slice(0, 100)}..."`)

      // Reset refs
      audioChunksRef.current = []
      mediaRecorderRef.current = null
      webSpeechFinalRef.current = ''
      webSpeechInterimRef.current = ''
      setInterimText('')
      setDuration(0)
      setState('idle')
      return text
    } catch (whisperError) {
      console.warn('[Voice] Whisper failed, using Web Speech fallback:', whisperError)
      console.log(`[Voice] Web Speech fallback text: "${webSpeechText.slice(0, 100)}..."`)

      // Reset refs
      audioChunksRef.current = []
      mediaRecorderRef.current = null
      webSpeechFinalRef.current = ''
      webSpeechInterimRef.current = ''
      setInterimText('')
      setDuration(0)
      setState('idle')
      return webSpeechText
    }
  }, [state])

  const cancelRecording = useCallback(() => {
    stoppedRef.current = true
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try { mediaRecorderRef.current.stop() } catch { /* ignore */ }
    }
    cleanup()
    setState('idle')
  }, [cleanup])

  // Clean up mic stream, timers, and speech recognition on unmount
  useEffect(() => {
    return () => {
      stoppedRef.current = true
      cleanup()
    }
  }, [cleanup])

  return {
    state,
    duration,
    interimText,
    startRecording,
    stopRecording,
    cancelRecording,
    isSupported,
  }
}

// ─── Whisper Edge Function Call ──────────────────────────────

async function transcribeWithWhisper(audioBlob: Blob, mimeType: string): Promise<string> {
  if (audioBlob.size < 1000) {
    throw new Error('Audio too short or empty')
  }

  const { data: { session } } = await supabase.auth.getSession()
  if (!session) throw new Error('Not authenticated')

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

  // Determine file extension from MIME type
  const extMap: Record<string, string> = {
    'audio/webm': 'webm',
    'audio/webm;codecs=opus': 'webm',
    'audio/mp4': 'mp4',
    'audio/ogg': 'ogg',
    'audio/wav': 'wav',
  }
  const ext = extMap[mimeType] || 'webm'

  const formData = new FormData()
  formData.append('audio', audioBlob, `recording.${ext}`)

  const response = await fetch(`${supabaseUrl}/functions/v1/whisper-transcribe`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${session.access_token}`,
      'apikey': supabaseAnonKey,
    },
    body: formData,
  })

  if (!response.ok) {
    const errText = await response.text()
    throw new Error(`Whisper API failed (${response.status}): ${errText}`)
  }

  const data = await response.json()
  if (data.error) throw new Error(data.error)

  return data.text || ''
}

// ─── Duration Formatter ──────────────────────────────────────

export function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}
