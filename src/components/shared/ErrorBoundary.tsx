import { Component, type ErrorInfo, type ReactNode } from 'react'
import { AlertTriangle } from 'lucide-react'

interface ErrorBoundaryProps {
  children: ReactNode
  /** Optional custom fallback. When omitted, a friendly default card renders. */
  fallback?: ReactNode
  /** Optional warm headline for the default fallback. */
  title?: string
  /** Optional warm body copy for the default fallback. */
  message?: string
  /** Optional action button (e.g. "Exit View As") rendered under the message. */
  action?: ReactNode
  /** Fired when the boundary catches an error (for logging). */
  onError?: (error: Error, info: ErrorInfo) => void
}

interface ErrorBoundaryState {
  hasError: boolean
}

/**
 * Minimal reusable React error boundary. React error boundaries MUST be class
 * components — there is no hook equivalent. Catches render-time throws in its
 * subtree and degrades to a small theme-tokened fallback instead of crashing
 * the whole app. No hardcoded colors, no emoji (Lucide icon).
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // Surface in dev/prod console so the underlying bug stays diagnosable even
    // though the user sees a graceful fallback.
    console.error('ErrorBoundary caught:', error, info)
    this.props.onError?.(error, info)
  }

  render() {
    if (!this.state.hasError) return this.props.children

    if (this.props.fallback) return this.props.fallback

    const title = this.props.title ?? "We couldn't load this view"
    const message =
      this.props.message ??
      'Something went wrong rendering this view. You can exit and try again.'

    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4 px-6 text-center">
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center"
          style={{ backgroundColor: 'color-mix(in srgb, var(--color-btn-primary-bg) 15%, transparent)' }}
        >
          <AlertTriangle size={28} style={{ color: 'var(--color-btn-primary-bg)' }} />
        </div>
        <h2 className="text-lg font-bold" style={{ color: 'var(--color-text-primary)' }}>
          {title}
        </h2>
        <p className="text-sm max-w-sm" style={{ color: 'var(--color-text-secondary)' }}>
          {message}
        </p>
        {this.props.action}
      </div>
    )
  }
}
