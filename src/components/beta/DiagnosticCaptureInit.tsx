/**
 * DiagnosticCaptureInit — Initializes diagnostic capture service
 *
 * Feature-flagged. Renders nothing.
 * Attaches error/route listeners on mount, cleans up on unmount.
 */

import { useEffect } from 'react'
import { FEATURE_FLAGS } from '@/config/featureFlags'
import { initDiagnosticCapture } from '@/services/diagnosticCapture'

export function DiagnosticCaptureInit() {
  useEffect(() => {
    if (!FEATURE_FLAGS.ENABLE_BETA_FEEDBACK) return
    const cleanup = initDiagnosticCapture()
    return cleanup
  }, [])

  return null
}
