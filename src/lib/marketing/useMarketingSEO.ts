import { useEffect } from 'react'

interface MarketingSEOOptions {
  title: string
  description: string
  ogImage?: string
  path?: string
}

const OG_IMAGE_DEFAULT = 'https://aimagicformoms.com/aimfm-logo-transparent.png'
const SITE_NAME = 'a.i.magic for moms'

function upsertMeta(attr: 'name' | 'property', key: string, content: string) {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`)
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute(attr, key)
    document.head.appendChild(el)
  }
  el.setAttribute('content', content)
}

/**
 * Lightweight, dependency-free per-route SEO. No react-helmet in this
 * codebase — this hook imperatively sets document.title and upserts the
 * meta/og tags a marketing page needs, and restores them on unmount so a
 * client-side navigation away from a marketing page doesn't leak stale
 * tags into whatever renders next.
 */
export function useMarketingSEO({ title, description, ogImage, path }: MarketingSEOOptions) {
  useEffect(() => {
    const prevTitle = document.title
    document.title = title

    upsertMeta('name', 'description', description)
    upsertMeta('property', 'og:title', title)
    upsertMeta('property', 'og:description', description)
    upsertMeta('property', 'og:type', 'website')
    upsertMeta('property', 'og:site_name', SITE_NAME)
    upsertMeta('property', 'og:image', ogImage ?? OG_IMAGE_DEFAULT)
    if (path) {
      upsertMeta('property', 'og:url', `https://aimagicformoms.com${path}`)
    }
    upsertMeta('name', 'twitter:card', 'summary_large_image')
    upsertMeta('name', 'twitter:title', title)
    upsertMeta('name', 'twitter:description', description)

    return () => {
      document.title = prevTitle
    }
  }, [title, description, ogImage, path])
}
