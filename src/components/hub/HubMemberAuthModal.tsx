/**
 * HubMemberAuthModal — PRD-14D Family Hub
 *
 * PIN authentication modal for Hub Member Quick Access.
 * On successful PIN entry, triggers ViewAs for the selected member.
 * Members without a PIN get direct access.
 *
 * Replicates the PIN entry pattern from FamilyLogin.tsx but within a themed
 * modal overlay. Uses verify_member_pin RPC for server-side verification.
 */

import { useState, useRef, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Lock, ArrowLeft, X } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import { useViewAs } from '@/lib/permissions/ViewAsProvider'
import { useFamilyMember } from '@/hooks/useFamilyMember'
import { useFamily } from '@/hooks/useFamily'
import type { FamilyMember } from '@/hooks/useFamilyMember'
import { getMemberColor } from '@/lib/memberColors'

interface PinVerifyResult {
  success: boolean
  reason?: 'not_found' | 'invalid' | 'locked'
  attempts_remaining?: number
  locked_until?: string
  remaining_seconds?: number
}

function formatLockoutTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return m > 0 ? `${m}m ${s}s` : `${s}s`
}

interface HubMemberAuthModalProps {
  member: FamilyMember | null
  isOpen: boolean
  onClose: () => void
}

export function HubMemberAuthModal({ member, isOpen, onClose }: HubMemberAuthModalProps) {
  const navigate = useNavigate()
  const { startViewAs } = useViewAs()
  const { data: currentMember } = useFamilyMember()
  const { data: family } = useFamily()

  const [pin, setPin] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [isLocked, setIsLocked] = useState(false)
  const [lockoutSeconds, setLockoutSeconds] = useState(0)
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Reset state when member changes or modal opens
  useEffect(() => {
    if (isOpen) {
      setPin('')
      setError('')
      setLoading(false)
      setIsLocked(false)
      setLockoutSeconds(0)
      if (countdownRef.current) clearInterval(countdownRef.current)
    }
    return () => {
      if (countdownRef.current) clearInterval(countdownRef.current)
    }
  }, [isOpen, member?.id])

  // Members without auth go directly to ViewAs
  useEffect(() => {
    if (!isOpen || !member || !currentMember || !family) return
    const authMethod = member.auth_method as string | null
    if (!authMethod || authMethod === 'none') {
      ;(async () => {
        await startViewAs(member, currentMember.id, family.id)
        onClose()
        navigate('/dashboard')
      })()
    }
  }, [isOpen, member, currentMember, family, startViewAs, onClose, navigate])

  const startLockoutCountdown = useCallback((seconds: number) => {
    setIsLocked(true)
    setLockoutSeconds(seconds)
    if (countdownRef.current) clearInterval(countdownRef.current)
    countdownRef.current = setInterval(() => {
      setLockoutSeconds((prev) => {
        if (prev <= 1) {
          if (countdownRef.current) clearInterval(countdownRef.current)
          setIsLocked(false)
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }, [])

  const handlePinSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!member || !currentMember || !family || pin.length < 4) return

    setLoading(true)
    setError('')

    try {
      const { data, error: rpcError } = await supabase.rpc('verify_member_pin', {
        p_member_id: member.id,
        p_pin: pin,
      })

      if (rpcError) throw rpcError

      const result = data as unknown as PinVerifyResult

      if (result.success) {
        await startViewAs(member, currentMember.id, family.id)
        onClose()
        navigate('/dashboard')
        return
      }

      if (result.reason === 'locked') {
        startLockoutCountdown(result.remaining_seconds ?? 900)
        setPin('')
        return
      }

      if (result.reason === 'not_found') {
        setError('No PIN set. Ask mom to set one in Settings.')
        return
      }

      // Invalid PIN
      setError(
        result.attempts_remaining
          ? `Incorrect PIN. ${result.attempts_remaining} tries left.`
          : 'Incorrect PIN. Please try again.'
      )
      setPin('')
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen || !member) return null

  const authMethod = member.auth_method as string | null
  if (!authMethod || authMethod === 'none') return null // handled by useEffect above

  const color = member.calendar_color || getMemberColor(member)

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0"
        onClick={onClose}
        style={{ zIndex: 60, backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
      />

      {/* Modal */}
      <div
        className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[90vw] max-w-sm rounded-xl overflow-hidden"
        style={{
          zIndex: 61,
          backgroundColor: 'var(--color-bg-card)',
          border: '1px solid var(--color-border)',
          boxShadow: '0 25px 50px rgba(0, 0, 0, 0.25)',
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-4 py-3"
          style={{ background: 'var(--gradient-primary, var(--color-btn-primary-bg))' }}
        >
          <button
            onClick={onClose}
            className="p-1 rounded"
            style={{ background: 'transparent', color: 'var(--color-text-on-primary)', border: 'none' }}
          >
            <ArrowLeft size={18} />
          </button>
          <span
            className="text-sm font-semibold"
            style={{ color: 'var(--color-text-on-primary)', fontFamily: 'var(--font-heading)' }}
          >
            Enter PIN
          </span>
          <button
            onClick={onClose}
            className="p-1 rounded"
            style={{ background: 'transparent', color: 'var(--color-text-on-primary)', border: 'none' }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          {/* Member avatar + name */}
          <div className="flex flex-col items-center gap-2">
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center text-xl font-bold"
              style={{ backgroundColor: color, color: 'var(--color-text-on-primary, #fff)' }}
            >
              {member.avatar_url ? (
                <img
                  src={member.avatar_url}
                  alt={member.display_name}
                  className="w-16 h-16 rounded-full object-cover"
                />
              ) : (
                member.display_name.charAt(0).toUpperCase()
              )}
            </div>
            <p className="text-base font-semibold" style={{ color: 'var(--color-text-primary)' }}>
              Hi, {member.display_name.split(' ')[0]}!
            </p>
          </div>

          {/* Lockout banner */}
          {isLocked && (
            <div
              className="rounded-lg px-4 py-3 text-sm text-center space-y-1"
              style={{
                backgroundColor: 'color-mix(in srgb, var(--color-warning, #f59e0b) 15%, transparent)',
                border: '1px solid var(--color-warning, #f59e0b)',
                color: 'var(--color-text-primary)',
              }}
            >
              <p className="font-medium">Too many tries!</p>
              <p>
                Try again in{' '}
                <span className="font-semibold tabular-nums">{formatLockoutTime(lockoutSeconds)}</span>
              </p>
            </div>
          )}

          {/* Error */}
          {error && !isLocked && (
            <p className="text-sm text-center" style={{ color: 'var(--color-error, #ef4444)' }}>
              {error}
            </p>
          )}

          {/* PIN form */}
          <form onSubmit={handlePinSubmit} className="space-y-4">
            <div className="relative">
              <Lock
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2"
                style={{ color: 'var(--color-text-secondary)' }}
              />
              <input
                type="password"
                inputMode="numeric"
                maxLength={4}
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                disabled={isLocked}
                className="w-full pl-10 pr-3 py-3 rounded-lg outline-none text-center text-2xl tracking-widest disabled:opacity-40"
                style={{
                  backgroundColor: 'var(--color-bg-secondary)',
                  border: '1px solid var(--color-border)',
                  color: 'var(--color-text-primary)',
                }}
                placeholder="····"
                autoFocus
              />
            </div>

            <button
              type="submit"
              disabled={loading || pin.length < 4 || isLocked}
              className="w-full py-3 rounded-lg font-semibold text-sm disabled:opacity-50"
              style={{
                background: 'var(--gradient-primary, var(--color-btn-primary-bg))',
                color: 'var(--color-btn-primary-text)',
                border: 'none',
                cursor: loading || pin.length < 4 || isLocked ? 'not-allowed' : 'pointer',
              }}
            >
              {loading ? 'Checking...' : 'Open My Space'}
            </button>
          </form>

          <p className="text-xs text-center" style={{ color: 'var(--color-text-secondary)' }}>
            Forgot your PIN? Ask mom to reset it.
          </p>
        </div>
      </div>
    </>
  )
}
