/**
 * Diagnostic Capture Service — Beta Glitch Reporter
 *
 * Passively captures console errors and route changes in-memory.
 * Purely in-memory — no localStorage, sessionStorage, or cookies.
 * Initializes only when ENABLE_BETA_FEEDBACK feature flag is on.
 */

interface CapturedError {
  message: string
  source?: string
  lineno?: number
  colno?: number
  timestamp: string
}

interface RouteChange {
  route: string
  timestamp: string
}

interface BrowserInfo {
  userAgent: string
  language: string
  platform: string
  screenWidth: number
  screenHeight: number
  viewportWidth: number
  viewportHeight: number
  devicePixelRatio: number
  online: boolean
}

const MAX_ERRORS = 5
const MAX_ROUTES = 10

const errorBuffer: CapturedError[] = []
const routeBuffer: RouteChange[] = []

let initialized = false

function pushError(entry: CapturedError) {
  errorBuffer.push(entry)
  if (errorBuffer.length > MAX_ERRORS) {
    errorBuffer.shift()
  }
}

function pushRoute(entry: RouteChange) {
  routeBuffer.push(entry)
  if (routeBuffer.length > MAX_ROUTES) {
    routeBuffer.shift()
  }
}

export function initDiagnosticCapture(): () => void {
  if (initialized) return () => {}
  initialized = true

  // Capture initial route
  pushRoute({
    route: window.location.pathname + window.location.search,
    timestamp: new Date().toISOString(),
  })

  // Console error listener
  const handleError = (event: ErrorEvent) => {
    pushError({
      message: event.message || 'Unknown error',
      source: event.filename,
      lineno: event.lineno,
      colno: event.colno,
      timestamp: new Date().toISOString(),
    })
  }

  // Unhandled promise rejection listener
  const handleRejection = (event: PromiseRejectionEvent) => {
    const message = event.reason instanceof Error
      ? event.reason.message
      : String(event.reason)
    pushError({
      message: `Unhandled Promise: ${message}`,
      timestamp: new Date().toISOString(),
    })
  }

  // Route change listener via popstate + pushState/replaceState patching
  const handlePopState = () => {
    pushRoute({
      route: window.location.pathname + window.location.search,
      timestamp: new Date().toISOString(),
    })
  }

  const originalPushState = history.pushState.bind(history)
  const originalReplaceState = history.replaceState.bind(history)

  history.pushState = function (...args: Parameters<typeof history.pushState>) {
    originalPushState(...args)
    pushRoute({
      route: window.location.pathname + window.location.search,
      timestamp: new Date().toISOString(),
    })
  }

  history.replaceState = function (...args: Parameters<typeof history.replaceState>) {
    originalReplaceState(...args)
    pushRoute({
      route: window.location.pathname + window.location.search,
      timestamp: new Date().toISOString(),
    })
  }

  window.addEventListener('error', handleError)
  window.addEventListener('unhandledrejection', handleRejection)
  window.addEventListener('popstate', handlePopState)

  // Cleanup function
  return () => {
    window.removeEventListener('error', handleError)
    window.removeEventListener('unhandledrejection', handleRejection)
    window.removeEventListener('popstate', handlePopState)
    history.pushState = originalPushState
    history.replaceState = originalReplaceState
    initialized = false
  }
}

export function getRecentErrors(): CapturedError[] {
  return [...errorBuffer]
}

export function getRecentRoutes(): RouteChange[] {
  return [...routeBuffer]
}

export function getBrowserInfo(): BrowserInfo {
  return {
    userAgent: navigator.userAgent,
    language: navigator.language,
    platform: navigator.platform,
    screenWidth: screen.width,
    screenHeight: screen.height,
    viewportWidth: window.innerWidth,
    viewportHeight: window.innerHeight,
    devicePixelRatio: window.devicePixelRatio,
    online: navigator.onLine,
  }
}
