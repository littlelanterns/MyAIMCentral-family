/**
 * AuthPageLayout — Shared wrapper for all auth/sign-on pages.
 * Forces classic MyAIM light theme colors regardless of system dark mode.
 * Brand colors are used directly so these pages always look warm and inviting.
 */
import { brand } from '@/lib/theme/tokens'

const AUTH_COLORS = {
  bg: brand.warmCream,          // #fff4ec
  bgSecondary: brand.softSage,  // #d4e3d9
  card: '#ffffff',
  text: brand.warmEarth,        // #5a4033
  textMuted: '#7a6a5f',
  border: '#c4d4cc',
  primary: brand.sageTeal,      // #68a395
  primaryHover: brand.deepOcean, // #2c5d60
  accent: brand.goldenHoney,    // #d6a461
  error: '#b25a58',
  warning: '#b99c34',
  success: '#4b7c66',
} as const

export { AUTH_COLORS }

export function AuthPageLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="min-h-svh flex items-center justify-center p-8"
      style={{
        background: `linear-gradient(135deg, ${AUTH_COLORS.bg} 0%, ${AUTH_COLORS.bgSecondary} 100%)`,
      }}
    >
      {children}
    </div>
  )
}
