import { useState, useEffect, useRef, useMemo } from 'react'
import { supabase } from '@/lib/supabase/client'

/**
 * PicturePasswordGrid — the single-picture password gate (Founder Decision 13).
 *
 * The kid's ONE secret picture appears among 8 decoys. The decoy SET is fixed
 * per member (composed server-side); only the display order shuffles here.
 * The correct answer never reaches the browser — every tap is verified
 * server-side with the same 5-try/15-minute lockout as PINs.
 *
 * Two modes:
 *  - 'session'  (FamilyLogin / personal devices): a correct tap mints a real
 *    Supabase session via the picture_login Edge Function action
 *    (server-derived shadow password — the picture is never the password).
 *  - 'verify'   (Hub dip-in): a correct tap verifies only; the caller opens
 *    the member_session View As. No session swap.
 */

interface GridImage {
  id: string
  display_name: string | null
  url: string | null
}

interface PicturePasswordGridProps {
  memberId: string
  mode: 'session' | 'verify'
  onSuccess: () => void | Promise<void>
  /** Session mode only: member is linked to a real email account, so a
   *  picture session can't be minted — route them to email sign-in. */
  onEmailLoginRequired?: () => void
}

function shuffleForDisplay<T>(items: T[]): T[] {
  const arr = [...items]
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

function formatLockoutTime(seconds: number): string {
  if (seconds >= 60) {
    const mins = Math.ceil(seconds / 60)
    return `${mins} minute${mins !== 1 ? 's' : ''}`
  }
  return `${seconds} second${seconds !== 1 ? 's' : ''}`
}

export function PicturePasswordGrid({ memberId, mode, onSuccess, onEmailLoginRequired }: PicturePasswordGridProps) {
  const [images, setImages] = useState<GridImage[] | null>(null)
  const [loadError, setLoadError] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [isLocked, setIsLocked] = useState(false)
  const [lockoutSeconds, setLockoutSeconds] = useState(0)
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    let cancelled = false
    setImages(null)
    setLoadError('')
    supabase.functions
      .invoke('family-auth-admin', {
        body: { action: 'get_picture_grid', member_id: memberId },
      })
      .then(({ data, error: fnError }) => {
        if (cancelled) return
        if (fnError || !data?.success || !data.images) {
          setLoadError('Picture login is not set up yet. Ask mom to set it up for you.')
          return
        }
        setImages(data.images as GridImage[])
      })
    return () => {
      cancelled = true
    }
  }, [memberId])

  useEffect(() => {
    return () => {
      if (countdownRef.current) clearInterval(countdownRef.current)
    }
  }, [])

  // Display order shuffles per mount; the underlying SET is fixed server-side
  const displayImages = useMemo(() => (images ? shuffleForDisplay(images) : null), [images])

  function startLockout(seconds: number) {
    if (countdownRef.current) clearInterval(countdownRef.current)
    setIsLocked(true)
    setLockoutSeconds(seconds)
    countdownRef.current = setInterval(() => {
      setLockoutSeconds((prev) => {
        if (prev <= 1) {
          if (countdownRef.current) clearInterval(countdownRef.current)
          countdownRef.current = null
          setIsLocked(false)
          setError('')
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }

  async function handleTap(assetId: string) {
    if (busy || isLocked) return
    setBusy(true)
    setError('')

    try {
      if (mode === 'session') {
        const { data, error: fnError } = await supabase.functions.invoke('family-auth-admin', {
          body: { action: 'picture_login', member_id: memberId, asset_id: assetId },
        })
        if (fnError) {
          setError('Something went wrong. Please try again.')
          return
        }
        if (data?.success && data.requires_email_login) {
          if (onEmailLoginRequired) onEmailLoginRequired()
          else setError('You sign in with your email on this device.')
          return
        }
        if (data?.success && data.access_token && data.refresh_token) {
          const { error: sessionError } = await supabase.auth.setSession({
            access_token: data.access_token,
            refresh_token: data.refresh_token,
          })
          if (sessionError) {
            setError('Something went wrong. Please try again.')
            return
          }
          await onSuccess()
          return
        }
        handleFailure(data)
      } else {
        const { data, error: rpcError } = await supabase.rpc('verify_member_picture_password', {
          p_member_id: memberId,
          p_asset_id: assetId,
        })
        if (rpcError) {
          setError('Something went wrong. Please try again.')
          return
        }
        if (data?.success) {
          await onSuccess()
          return
        }
        handleFailure(data)
      }
    } finally {
      setBusy(false)
    }
  }

  function handleFailure(data: { reason?: string; remaining_seconds?: number; attempts_remaining?: number } | null) {
    if (data?.reason === 'locked') {
      startLockout(data.remaining_seconds ?? 900)
      return
    }
    if (data?.reason === 'not_found') {
      setError('Picture login is not set up yet. Ask mom to set it up for you.')
      return
    }
    setError("That wasn't your picture. Try again!")
  }

  if (loadError) {
    return (
      <p className="text-center text-sm py-4" style={{ color: 'var(--color-text-secondary, #888)' }}>
        {loadError}
      </p>
    )
  }

  if (!displayImages) {
    return (
      <p className="text-center text-sm py-4" style={{ color: 'var(--color-text-secondary, #888)' }}>
        Loading pictures...
      </p>
    )
  }

  return (
    <div className="space-y-3">
      <p className="text-center text-sm" style={{ color: 'var(--color-text-secondary, #888)' }}>
        Tap your picture
      </p>

      {isLocked && (
        <div
          className="rounded-lg px-4 py-3 text-sm text-center space-y-1"
          style={{
            backgroundColor: 'color-mix(in srgb, var(--color-warning, #f59e0b) 15%, transparent)',
            border: '1px solid var(--color-warning, #f59e0b)',
            color: 'var(--color-text-primary, #444)',
          }}
        >
          <p className="font-medium">Too many tries!</p>
          <p>
            Try again in{' '}
            <span className="font-semibold tabular-nums">{formatLockoutTime(lockoutSeconds)}</span>.
          </p>
          <p className="text-xs" style={{ opacity: 0.75 }}>
            Ask mom for help getting in.
          </p>
        </div>
      )}

      {error && !isLocked && (
        <p className="text-sm text-center" style={{ color: 'var(--color-error, #b25a58)' }}>
          {error}
        </p>
      )}

      <div className="grid grid-cols-3 gap-3">
        {displayImages.map((img) => (
          <button
            key={img.id}
            onClick={() => handleTap(img.id)}
            disabled={busy || isLocked}
            className="aspect-square rounded-xl overflow-hidden transition-transform active:scale-95 disabled:opacity-40"
            style={{
              border: '2px solid var(--color-border, #ddd)',
              backgroundColor: 'var(--color-bg-card, #fff)',
            }}
          >
            {img.url ? (
              <img src={img.url} alt={img.display_name ?? 'Picture'} className="w-full h-full object-cover" />
            ) : (
              <span className="text-xs" style={{ color: 'var(--color-text-secondary, #888)' }}>
                {img.display_name}
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  )
}
