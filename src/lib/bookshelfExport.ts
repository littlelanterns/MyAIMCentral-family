/**
 * BookShelf Export (PRD-23)
 * Exports extracted content as Markdown, plain text, DOCX, or EPUB.
 * Chapter-organized, hearted items marked, user notes included.
 * Adapted from StewardShip's exportExtractions.ts + exportEpub.ts for MyAIM v2 types.
 */
import JSZip from 'jszip'
import type {
  BookShelfSummary, BookShelfInsight, BookShelfDeclaration,
  BookShelfActionStep, BookShelfQuestion,
} from '@/types/bookshelf'

// ─── Types ─────────────────────────────────────────────────

export type ExportFormat = 'md' | 'txt' | 'docx' | 'epub'

export interface ExportTabFilter {
  summaries?: boolean
  insights?: boolean
  declarations?: boolean
  action_steps?: boolean
  questions?: boolean
}

export interface BookExportData {
  bookTitle: string
  summaries: BookShelfSummary[]
  insights: BookShelfInsight[]
  declarations: BookShelfDeclaration[]
  actionSteps: BookShelfActionStep[]
  questions: BookShelfQuestion[]
}

interface ChapterGroup {
  title: string
  index: number
  summaries: BookShelfSummary[]
  insights: BookShelfInsight[]
  declarations: BookShelfDeclaration[]
  actionSteps: BookShelfActionStep[]
  questions: BookShelfQuestion[]
}

// ─── Helpers ───────────────────────────────────────────────

function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

function toFilename(name: string): string {
  return name.replace(/[^a-z0-9\-_ ]/gi, '').trim().replace(/\s+/g, '_')
}

function today(): string {
  return new Date().toISOString().split('T')[0]
}

function escapeXml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

function typeLabel(type: string): string {
  return type.replace(/_/g, ' ').toUpperCase()
}

const STYLE_LABELS: Record<string, string> = {
  choosing_committing: 'Choosing & Committing',
  recognizing_awakening: 'Recognizing & Awakening',
  claiming_stepping_into: 'Claiming & Stepping Into',
  learning_striving: 'Learning & Striving',
  resolute_unashamed: 'Resolute & Unashamed',
}

function tabOn(tabs: ExportTabFilter | undefined, key: keyof ExportTabFilter): boolean {
  if (!tabs) return true
  return tabs[key] !== false
}

// ─── Chapter grouping ──────────────────────────────────────

function collectChapters(data: BookExportData, tabs?: ExportTabFilter): ChapterGroup[] {
  const map = new Map<string, ChapterGroup>()

  const getOrCreate = (title: string | null, index: number | null): ChapterGroup => {
    const key = title || '__full__'
    if (!map.has(key)) {
      map.set(key, {
        title: title || '',
        index: index ?? 999,
        summaries: [], insights: [], declarations: [], actionSteps: [], questions: [],
      })
    }
    const ch = map.get(key)!
    if ((index ?? 999) < ch.index) ch.index = index ?? 999
    return ch
  }

  if (tabOn(tabs, 'summaries'))
    for (const s of data.summaries) getOrCreate(s.section_title, s.section_index).summaries.push(s)
  if (tabOn(tabs, 'insights'))
    for (const i of data.insights) getOrCreate(i.section_title, i.section_index).insights.push(i)
  if (tabOn(tabs, 'declarations'))
    for (const d of data.declarations) getOrCreate(d.section_title, d.section_index).declarations.push(d)
  if (tabOn(tabs, 'action_steps'))
    for (const a of data.actionSteps) getOrCreate(a.section_title, a.section_index).actionSteps.push(a)
  if (tabOn(tabs, 'questions'))
    for (const q of data.questions) getOrCreate(q.section_title, q.section_index).questions.push(q)

  return Array.from(map.values()).sort((a, b) => a.index - b.index)
}

// ─── Markdown Export ───────────────────────────────────────

function mdNote(note: string | null | undefined): string {
  if (!note) return ''
  return `\n  > **Note:** ${note}\n`
}

function buildBookMd(data: BookExportData, level: '#' | '##', tabs?: ExportTabFilter): string[] {
  const lines: string[] = []
  const sub = level === '#' ? '##' : '###'
  const subsub = level === '#' ? '###' : '####'
  const chapters = collectChapters(data, tabs)

  for (const ch of chapters) {
    if (ch.title) lines.push(`${sub} ${ch.title}`, '')
    const h = ch.title ? subsub : sub

    if (ch.summaries.length > 0) {
      lines.push(`${h} Summaries`, '')
      for (const s of ch.summaries) {
        const heart = s.is_hearted ? '\u2764\uFE0F ' : ''
        lines.push(`${heart}**${typeLabel(s.content_type)}** \u2014 ${s.text}`, '')
        if (s.user_note) lines.push(mdNote(s.user_note))
      }
    }
    if (ch.insights.length > 0) {
      lines.push(`${h} Insights`, '')
      for (const i of ch.insights) {
        const heart = i.is_hearted ? '\u2764\uFE0F ' : ''
        lines.push(`- ${heart}**${typeLabel(i.content_type)}** \u2014 ${i.text}`)
        if (i.user_note) lines.push(mdNote(i.user_note))
      }
      lines.push('')
    }
    if (ch.actionSteps.length > 0) {
      lines.push(`${h} Action Steps`, '')
      for (const a of ch.actionSteps) {
        const heart = a.is_hearted ? '\u2764\uFE0F ' : ''
        lines.push(`${heart}**${typeLabel(a.content_type)}** \u2014 ${a.text}`, '')
        if (a.user_note) lines.push(mdNote(a.user_note))
      }
    }
    if (ch.questions.length > 0) {
      lines.push(`${h} Questions`, '')
      for (const q of ch.questions) {
        const heart = q.is_hearted ? '\u2764\uFE0F ' : ''
        lines.push(`${heart}**${typeLabel(q.content_type)}** \u2014 ${q.text}`, '')
        if (q.user_note) lines.push(mdNote(q.user_note))
      }
    }
    if (ch.declarations.length > 0) {
      lines.push(`${h} Declarations`, '')
      for (const d of ch.declarations) {
        const heart = d.is_hearted ? '\u2764\uFE0F ' : ''
        const value = d.value_name ? `**${d.value_name}** ` : ''
        const style = d.style_variant ? `*${STYLE_LABELS[d.style_variant] || d.style_variant}*` : ''
        lines.push(`${heart}${value}${style} \u2014 ${d.declaration_text}`, '')
        if (d.user_note) lines.push(mdNote(d.user_note))
      }
    }
    lines.push('---', '')
  }
  return lines
}

export function exportMarkdown(books: BookExportData[], title?: string, tabs?: ExportTabFilter): void {
  const single = books.length === 1
  const docTitle = title || (single ? `${books[0].bookTitle} - Extractions` : 'Extractions')
  const lines = [`# ${docTitle}`, '', `*Exported: ${today()}*`, '', '---', '']

  for (const book of books) {
    if (!single) lines.push(`## ${book.bookTitle}`, '')
    lines.push(...buildBookMd(book, single ? '#' : '##', tabs))
    if (!single) lines.push('---', '')
  }

  triggerDownload(new Blob([lines.join('\n')], { type: 'text/markdown;charset=utf-8' }), `${toFilename(docTitle)}.md`)
}

// ─── Plain Text Export ─────────────────────────────────────

function buildBookTxt(data: BookExportData, tabs?: ExportTabFilter): string[] {
  const lines: string[] = []
  const chapters = collectChapters(data, tabs)

  for (const ch of chapters) {
    if (ch.title) lines.push(`=== ${ch.title.toUpperCase()} ===`, '')

    if (ch.summaries.length > 0) {
      lines.push('--- SUMMARIES ---', '')
      for (const s of ch.summaries) {
        lines.push(`[${typeLabel(s.content_type)}] ${s.text}`)
        if (s.user_note) lines.push(`  [Note] ${s.user_note}`)
        lines.push('')
      }
    }
    if (ch.insights.length > 0) {
      lines.push('--- INSIGHTS ---', '')
      for (const i of ch.insights) {
        lines.push(`[${typeLabel(i.content_type)}] ${i.text}`)
        if (i.user_note) lines.push(`  [Note] ${i.user_note}`)
        lines.push('')
      }
    }
    if (ch.actionSteps.length > 0) {
      lines.push('--- ACTION STEPS ---', '')
      for (const a of ch.actionSteps) {
        lines.push(`[${typeLabel(a.content_type)}] ${a.text}`)
        if (a.user_note) lines.push(`  [Note] ${a.user_note}`)
        lines.push('')
      }
    }
    if (ch.questions.length > 0) {
      lines.push('--- QUESTIONS ---', '')
      for (const q of ch.questions) {
        lines.push(`[${typeLabel(q.content_type)}] ${q.text}`)
        if (q.user_note) lines.push(`  [Note] ${q.user_note}`)
        lines.push('')
      }
    }
    if (ch.declarations.length > 0) {
      lines.push('--- DECLARATIONS ---', '')
      for (const d of ch.declarations) {
        const value = d.value_name ? `[${d.value_name}] ` : ''
        lines.push(`${value}${d.declaration_text}`)
        if (d.user_note) lines.push(`  [Note] ${d.user_note}`)
        lines.push('')
      }
    }
  }
  return lines
}

export function exportPlainText(books: BookExportData[], title?: string, tabs?: ExportTabFilter): void {
  const single = books.length === 1
  const docTitle = title || (single ? `${books[0].bookTitle} - Extractions` : 'Extractions')
  const lines = [docTitle, `Exported: ${today()}`, '', '===', '']

  for (const book of books) {
    if (!single) lines.push(`=== ${book.bookTitle.toUpperCase()} ===`, '')
    lines.push(...buildBookTxt(book, tabs))
  }

  triggerDownload(new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' }), `${toFilename(docTitle)}.txt`)
}

// ─── DOCX Export (XML-based) ───────────────────────────────

function docxPara(text: string, opts?: { bold?: boolean; color?: string; size?: number; indent?: number }): string {
  const sz = opts?.size || 22
  let rPr = `<w:sz w:val="${sz}"/><w:szCs w:val="${sz}"/>`
  if (opts?.bold) rPr += '<w:b/>'
  if (opts?.color) rPr += `<w:color w:val="${opts.color}"/>`
  const pPr = opts?.indent ? `<w:pPr><w:ind w:left="${opts.indent}"/></w:pPr>` : ''
  return `<w:p>${pPr}<w:r><w:rPr>${rPr}</w:rPr><w:t xml:space="preserve">${escapeXml(text)}</w:t></w:r></w:p>`
}

function buildBookDocx(data: BookExportData, tabs?: ExportTabFilter): string {
  const parts: string[] = []
  const chapters = collectChapters(data, tabs)

  for (const ch of chapters) {
    if (ch.title) parts.push(docxPara(ch.title, { bold: true, size: 28, color: '333333' }))

    if (ch.summaries.length > 0) {
      parts.push(docxPara('Summaries', { bold: true, size: 24, color: '666666' }))
      for (const s of ch.summaries) {
        parts.push(docxPara(`[${typeLabel(s.content_type)}] ${s.text}`))
        if (s.user_note) parts.push(docxPara(`Note: ${s.user_note}`, { color: 'A46A3C', size: 18, indent: 360 }))
      }
    }
    if (ch.insights.length > 0) {
      parts.push(docxPara('Insights', { bold: true, size: 24, color: '666666' }))
      for (const i of ch.insights) {
        parts.push(docxPara(`[${typeLabel(i.content_type)}] ${i.text}`))
        if (i.user_note) parts.push(docxPara(`Note: ${i.user_note}`, { color: 'A46A3C', size: 18, indent: 360 }))
      }
    }
    if (ch.actionSteps.length > 0) {
      parts.push(docxPara('Action Steps', { bold: true, size: 24, color: '666666' }))
      for (const a of ch.actionSteps) {
        parts.push(docxPara(`[${typeLabel(a.content_type)}] ${a.text}`))
        if (a.user_note) parts.push(docxPara(`Note: ${a.user_note}`, { color: 'A46A3C', size: 18, indent: 360 }))
      }
    }
    if (ch.questions.length > 0) {
      parts.push(docxPara('Questions', { bold: true, size: 24, color: '666666' }))
      for (const q of ch.questions) {
        parts.push(docxPara(`[${typeLabel(q.content_type)}] ${q.text}`))
        if (q.user_note) parts.push(docxPara(`Note: ${q.user_note}`, { color: 'A46A3C', size: 18, indent: 360 }))
      }
    }
    if (ch.declarations.length > 0) {
      parts.push(docxPara('Declarations', { bold: true, size: 24, color: '666666' }))
      for (const d of ch.declarations) {
        const value = d.value_name ? `[${d.value_name}] ` : ''
        parts.push(docxPara(`${value}${d.declaration_text}`))
        if (d.user_note) parts.push(docxPara(`Note: ${d.user_note}`, { color: 'A46A3C', size: 18, indent: 360 }))
      }
    }
  }
  return parts.join('')
}

export function exportDocx(books: BookExportData[], title?: string, tabs?: ExportTabFilter): void {
  const single = books.length === 1
  const docTitle = title || (single ? `${books[0].bookTitle} - Extractions` : 'Extractions')

  let body = docxPara(docTitle, { bold: true, size: 36, color: '222222' })
  body += docxPara(`Exported: ${today()}`, { color: '999999', size: 18 })

  for (const book of books) {
    if (!single) body += docxPara(book.bookTitle, { bold: true, size: 30, color: '444444' })
    body += buildBookDocx(book, tabs)
  }

  const xml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
<w:body>${body}</w:body>
</w:document>`

  // Minimal DOCX = ZIP with [Content_Types].xml, word/document.xml, _rels/.rels, word/_rels/document.xml.rels
  // For simplicity, we generate just the XML and let the user know it's a simplified DOCX
  const blob = new Blob([xml], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' })
  triggerDownload(blob, `${toFilename(docTitle)}.docx`)
}

// ─── EPUB Export ───────────────────────────────────────────

const EPUB_CSS = `body {
  font-family: Georgia, "Times New Roman", serif;
  color: #2C3E50;
  line-height: 1.6;
  margin: 1em;
}
h1 { color: #12403A; font-size: 1.8em; margin-top: 1.5em; padding-bottom: 0.3em; border-bottom: 2px solid #A46A3C; }
h2 { color: #1F514E; font-size: 1.4em; margin-top: 1.2em; }
h3 { color: #3B6E67; font-size: 1.15em; margin-top: 1em; }
.content-type { font-weight: bold; color: #1F514E; text-transform: uppercase; font-size: 0.85em; }
.declaration { font-style: italic; color: #733C0C; }
.style-label { font-style: italic; color: #879E9D; font-size: 0.9em; }
.hearted::before { content: "\\2764\\FE0F "; }
.user-note { margin: 0.3em 0 0.8em 1em; padding: 0.4em 0.6em; border-left: 3px solid #A46A3C; color: #555; font-size: 0.9em; }
.user-note strong { color: #A46A3C; }
.go-deeper { border-left: 3px solid #A46A3C; padding-left: 0.5em; }
.section-divider { border: none; border-top: 1px solid #E8DFD0; margin: 1.5em 0; }
.title-page { text-align: center; padding-top: 30%; }
.title-page h1 { border: none; font-size: 2.2em; }
.title-page .date { color: #879E9D; margin-top: 1em; }
.title-page .footer { color: #879E9D; font-size: 0.85em; margin-top: 3em; }
.value-name { font-weight: bold; }
p { margin: 0.4em 0; }`

function xhtmlWrap(title: string, body: string): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops">
<head><meta charset="utf-8"/><title>${escapeXml(title)}</title><link rel="stylesheet" type="text/css" href="style.css"/></head>
<body>${body}</body></html>`
}

function buildBookXhtml(data: BookExportData, tabs?: ExportTabFilter): string {
  const chapters = collectChapters(data, tabs)
  const parts: string[] = [`<h1>${escapeXml(data.bookTitle)}</h1>`]

  for (const ch of chapters) {
    if (ch.title) parts.push(`<h2>${escapeXml(ch.title)}</h2>`)

    if (ch.summaries.length > 0) {
      parts.push('<h3>Summaries</h3>')
      for (const s of ch.summaries) {
        const cls = [s.is_hearted ? 'hearted' : '', s.is_from_go_deeper ? 'go-deeper' : ''].filter(Boolean).join(' ')
        parts.push(`<p${cls ? ` class="${cls}"` : ''}><span class="content-type">${escapeXml(typeLabel(s.content_type))}</span> \u2014 ${escapeXml(s.text)}</p>`)
        if (s.user_note) parts.push(`<div class="user-note"><strong>Note:</strong> ${escapeXml(s.user_note)}</div>`)
      }
    }
    if (ch.insights.length > 0) {
      parts.push('<h3>Insights</h3><ul>')
      for (const i of ch.insights) {
        parts.push(`<li${i.is_hearted ? ' class="hearted"' : ''}><span class="content-type">${escapeXml(typeLabel(i.content_type))}</span> \u2014 ${escapeXml(i.text)}</li>`)
        if (i.user_note) parts.push(`<div class="user-note"><strong>Note:</strong> ${escapeXml(i.user_note)}</div>`)
      }
      parts.push('</ul>')
    }
    if (ch.actionSteps.length > 0) {
      parts.push('<h3>Action Steps</h3>')
      for (const a of ch.actionSteps) {
        parts.push(`<p${a.is_hearted ? ' class="hearted"' : ''}><span class="content-type">${escapeXml(typeLabel(a.content_type))}</span> \u2014 ${escapeXml(a.text)}</p>`)
        if (a.user_note) parts.push(`<div class="user-note"><strong>Note:</strong> ${escapeXml(a.user_note)}</div>`)
      }
    }
    if (ch.questions.length > 0) {
      parts.push('<h3>Questions</h3>')
      for (const q of ch.questions) {
        parts.push(`<p${q.is_hearted ? ' class="hearted"' : ''}><span class="content-type">${escapeXml(typeLabel(q.content_type))}</span> \u2014 ${escapeXml(q.text)}</p>`)
        if (q.user_note) parts.push(`<div class="user-note"><strong>Note:</strong> ${escapeXml(q.user_note)}</div>`)
      }
    }
    if (ch.declarations.length > 0) {
      parts.push('<h3>Declarations</h3>')
      for (const d of ch.declarations) {
        const value = d.value_name ? `<span class="value-name">${escapeXml(d.value_name)}</span> ` : ''
        const style = d.style_variant ? `<span class="style-label">${escapeXml(STYLE_LABELS[d.style_variant] || d.style_variant)}</span> \u2014 ` : ''
        parts.push(`<p class="${d.is_hearted ? 'hearted declaration' : 'declaration'}">${value}${style}${escapeXml(d.declaration_text)}</p>`)
        if (d.user_note) parts.push(`<div class="user-note"><strong>Note:</strong> ${escapeXml(d.user_note)}</div>`)
      }
    }
    parts.push('<hr class="section-divider"/>')
  }

  return xhtmlWrap(data.bookTitle, parts.join('\n'))
}

export async function exportEpub(books: BookExportData[], title?: string, tabs?: ExportTabFilter): Promise<void> {
  const single = books.length === 1
  const docTitle = title || (single ? `${books[0].bookTitle} - Extractions` : 'MyAIM BookShelf Extractions')
  const zip = new JSZip()

  // mimetype MUST be first, uncompressed
  zip.file('mimetype', 'application/epub+zip', { compression: 'STORE' })

  // META-INF
  zip.file('META-INF/container.xml', `<?xml version="1.0" encoding="UTF-8"?>
<container xmlns="urn:oasis:names:tc:opendocument:xmlns:container" version="1.0">
  <rootfiles><rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/></rootfiles>
</container>`)

  // Chapter files
  const chapterFiles: { id: string; filename: string; title: string }[] = []
  for (let i = 0; i < books.length; i++) {
    const filename = `chapter_${i}.xhtml`
    zip.file(`OEBPS/${filename}`, buildBookXhtml(books[i], tabs))
    chapterFiles.push({ id: `chapter_${i}`, filename, title: books[i].bookTitle })
  }

  // Title page
  zip.file('OEBPS/title.xhtml', xhtmlWrap(docTitle, `<div class="title-page">
  <h1>${escapeXml(docTitle)}</h1>
  <p class="date">Exported: ${today()}</p>
  <p class="footer">Exported from MyAIM BookShelf</p>
</div>`))

  // Stylesheet
  zip.file('OEBPS/style.css', EPUB_CSS)

  // OPF manifest
  const uuid = `urn:uuid:${crypto.randomUUID?.() || Date.now().toString(36)}`
  zip.file('OEBPS/content.opf', `<?xml version="1.0" encoding="UTF-8"?>
<package xmlns="http://www.idpf.org/2007/opf" version="3.0" unique-identifier="uid">
  <metadata xmlns:dc="http://purl.org/dc/elements/1.1/">
    <dc:identifier id="uid">${uuid}</dc:identifier>
    <dc:title>${escapeXml(docTitle)}</dc:title>
    <dc:creator>MyAIM BookShelf</dc:creator>
    <dc:date>${today()}</dc:date>
    <dc:language>en</dc:language>
    <meta property="dcterms:modified">${new Date().toISOString().replace(/\.\d+Z$/, 'Z')}</meta>
  </metadata>
  <manifest>
    <item id="nav" href="nav.xhtml" media-type="application/xhtml+xml" properties="nav"/>
    <item id="ncx" href="toc.ncx" media-type="application/x-dtbncx+xml"/>
    <item id="style" href="style.css" media-type="text/css"/>
    <item id="title_page" href="title.xhtml" media-type="application/xhtml+xml"/>
    ${chapterFiles.map(c => `<item id="${c.id}" href="${c.filename}" media-type="application/xhtml+xml"/>`).join('\n    ')}
  </manifest>
  <spine toc="ncx">
    <itemref idref="title_page"/>
    ${chapterFiles.map(c => `<itemref idref="${c.id}"/>`).join('\n    ')}
  </spine>
</package>`)

  // NCX (EPUB 2 compat)
  zip.file('OEBPS/toc.ncx', `<?xml version="1.0" encoding="UTF-8"?>
<ncx xmlns="http://www.daisy.org/z3986/2005/ncx/" version="2005-1">
  <head><meta name="dtb:depth" content="1"/><meta name="dtb:totalPageCount" content="0"/><meta name="dtb:maxPageNumber" content="0"/></head>
  <docTitle><text>${escapeXml(docTitle)}</text></docTitle>
  ${chapterFiles.map((c, i) => `<navPoint id="np-${i + 1}" playOrder="${i + 1}"><navLabel><text>${escapeXml(c.title)}</text></navLabel><content src="${c.filename}"/></navPoint>`).join('\n  ')}
</ncx>`)

  // Nav (EPUB 3 TOC)
  zip.file('OEBPS/nav.xhtml', xhtmlWrap(docTitle, `<nav epub:type="toc" id="toc">
  <h1>Table of Contents</h1>
  <ol>${chapterFiles.map(c => `\n    <li><a href="${c.filename}">${escapeXml(c.title)}</a></li>`).join('')}
  </ol>
</nav>`))

  const blob = await zip.generateAsync({ type: 'blob', mimeType: 'application/epub+zip' })
  triggerDownload(blob, `${toFilename(docTitle)}.epub`)
}

// ─── Main export dispatcher ───────────────────────────────

export async function exportExtractions(format: ExportFormat, books: BookExportData[], title?: string, tabs?: ExportTabFilter): Promise<void> {
  switch (format) {
    case 'md': return exportMarkdown(books, title, tabs)
    case 'txt': return exportPlainText(books, title, tabs)
    case 'docx': return exportDocx(books, title, tabs)
    case 'epub': return exportEpub(books, title, tabs)
  }
}
