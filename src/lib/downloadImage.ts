/**
 * downloadImage — KIDS-REWARDS-PAGE Slice 3 (founder gate Q4).
 *
 * Triggers a file download of a cross-origin image (Supabase public bucket).
 * A bare `<a download>` is ignored for cross-origin navigations, so we fetch
 * the bytes into a Blob and download via an object URL. If the fetch fails
 * (offline, CORS), fall back to opening the image in a new tab so the user can
 * still save it manually — never a dead end.
 */
export async function downloadImage(url: string, filename: string): Promise<void> {
  try {
    const res = await fetch(url, { mode: 'cors' })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const blob = await res.blob()
    const objectUrl = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = objectUrl
    a.download = filename
    document.body.appendChild(a)
    a.click()
    a.remove()
    // Give the browser a tick to start the download before revoking.
    setTimeout(() => URL.revokeObjectURL(objectUrl), 2000)
  } catch (err) {
    console.warn('downloadImage fell back to new-tab open:', err)
    window.open(url, '_blank', 'noopener')
  }
}

/** Safe filename fragment from a display name (lowercase, alnum + dashes). */
export function safeFilenameSlug(name: string): string {
  return (
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 60) || 'image'
  )
}
