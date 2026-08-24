/**
 * PRD-40 Slice 3 — consent disclosure text rendering, shared by the full
 * consent flow (Screens 1–4) and the additional-child acknowledgment
 * modal's expandable review sections (Screen 7).
 *
 * Disclosure text comes EXCLUSIVELY from the `coppa_consent_templates` row
 * (never hardcoded — the versioned template is the legal audit artifact).
 * The template uses the literal token `[Child Name]`; we interpolate the
 * actual child name(s) at render time.
 */

export function joinNames(names: string[]): string {
  if (names.length === 0) return 'your child'
  if (names.length === 1) return names[0]
  if (names.length === 2) return `${names[0]} and ${names[1]}`
  return `${names.slice(0, -1).join(', ')}, and ${names[names.length - 1]}`
}

export function interpolateChildName(text: string, names: string[]): string {
  return text.split('[Child Name]').join(joinNames(names))
}

/**
 * Renders template section text: blank-line-separated paragraphs; lines
 * beginning with "- " become bullet lists. No markdown library — the
 * template text is plain prose + dash bullets by convention.
 */
export function ConsentSectionBody({ text, childNames }: { text: string; childNames: string[] }) {
  const interpolated = interpolateChildName(text, childNames)
  const blocks = interpolated.split(/\n\s*\n/)

  return (
    <div className="space-y-3">
      {blocks.map((block, i) => {
        const lines = block.split('\n').map((l) => l.trim()).filter(Boolean)
        const isBulletBlock = lines.length > 0 && lines.every((l) => l.startsWith('- '))
        if (isBulletBlock) {
          return (
            <ul key={i} className="space-y-2 pl-5" style={{ listStyleType: 'disc' }}>
              {lines.map((l, j) => (
                <li
                  key={j}
                  className="text-sm leading-relaxed"
                  style={{ color: 'var(--color-text-primary)' }}
                >
                  {l.slice(2)}
                </li>
              ))}
            </ul>
          )
        }
        return (
          <p
            key={i}
            className="text-sm leading-relaxed"
            style={{ color: 'var(--color-text-primary)' }}
          >
            {lines.join(' ')}
          </p>
        )
      })}
    </div>
  )
}
