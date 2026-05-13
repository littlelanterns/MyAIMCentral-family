/**
 * Smart list parser for sequential collection creation.
 *
 * Handles many paste formats:
 *   - Plain lines: "Abraham 3"
 *   - Simple pipe: "Abraham 3 | Missed 1/8"
 *   - Markdown tables: "| 1 | 1/8 | Abraham 3 |"
 *   - Tab-delimited (spreadsheet copy): "1\t1/8\tAbraham 3"
 *   - CSV: "1,1/8,Abraham 3"
 *   - Numbered lists: "1. Abraham 3" or "1) Abraham 3"
 *   - Bulleted lists: "- Abraham 3" or "* Abraham 3"
 *   - Mixed: handles header rows, separator rows, blank lines
 *
 * Heuristic for multi-column data: the longest non-numeric, non-date
 * column is the title. Short columns that look like dates become
 * "Missed [date]" in the description. Pure-number columns (row indices)
 * are dropped.
 */

interface ParsedItem {
  title: string
  description?: string | null
  resource_url?: string | null
}

const SEPARATOR_ROW = /^[\s|:+\-=]+$/
const HEADER_WORDS = new Set([
  '#', 'num', 'no', 'no.', 'number', 'date', 'assignment', 'title',
  'name', 'lesson', 'chapter', 'task', 'item', 'description', 'note',
  'notes', 'missed', 'topic', 'subject', 'due', 'status', 'week',
  'day', 'unit', 'page', 'pages', 'reading', 'section',
])
const DATE_PATTERN = /^\d{1,2}\/\d{1,2}(\/\d{2,4})?$/
const NUMBER_ONLY = /^\d+\.?$/
const NUMBERED_PREFIX = /^\d+[\.\)]\s+/
const BULLET_PREFIX = /^[-*•]\s+/
const URL_PATTERN = /^https?:\/\//i

function isHeaderCell(cell: string): boolean {
  return cell.split(/\s+/).every(word => HEADER_WORDS.has(word.toLowerCase().replace(/[.,;:]/g, '')))
}

function isHeaderRow(cells: string[]): boolean {
  const nonEmpty = cells.filter(c => c.length > 0)
  if (nonEmpty.length === 0) return false
  return nonEmpty.every(isHeaderCell)
}

function looksLikeDate(s: string): boolean {
  return DATE_PATTERN.test(s)
}

function looksLikeNumber(s: string): boolean {
  return NUMBER_ONLY.test(s)
}

function looksLikeUrl(s: string): boolean {
  return URL_PATTERN.test(s)
}

function detectDelimiter(lines: string[]): 'pipe' | 'tab' | 'comma' | 'none' {
  const contentLines = lines.filter(l => !SEPARATOR_ROW.test(l))
  const sample = contentLines.slice(0, Math.min(5, contentLines.length))
  if (sample.length === 0) return 'none'

  const pipeCount = sample.filter(l => (l.match(/\|/g) || []).length >= 2).length
  if (pipeCount >= sample.length * 0.5) return 'pipe'

  const tabCount = sample.filter(l => l.includes('\t')).length
  if (tabCount >= sample.length * 0.5) return 'tab'

  const commaCount = sample.filter(l => {
    const commas = (l.match(/,/g) || []).length
    return commas >= 1 && commas <= 10
  }).length
  if (commaCount >= sample.length * 0.5) return 'comma'

  return 'none'
}

function splitPipeRow(line: string): string[] {
  return line.split('|').map(c => c.trim()).filter(c => c.length > 0)
}

function splitRow(line: string, delimiter: 'pipe' | 'tab' | 'comma'): string[] {
  switch (delimiter) {
    case 'pipe': return splitPipeRow(line)
    case 'tab': return line.split('\t').map(c => c.trim())
    case 'comma': return line.split(',').map(c => c.trim())
  }
}

function classifyColumns(rows: string[][]): { titleCol: number; notesCols: number[]; urlCol: number } {
  if (rows.length === 0 || rows[0].length <= 1) {
    return { titleCol: 0, notesCols: [], urlCol: -1 }
  }

  const colCount = Math.max(...rows.map(r => r.length))
  const colStats: Array<{ avgLen: number; numberRate: number; dateRate: number; urlRate: number }> = []

  for (let c = 0; c < colCount; c++) {
    const values = rows.map(r => r[c] ?? '').filter(v => v.length > 0)
    if (values.length === 0) {
      colStats.push({ avgLen: 0, numberRate: 1, dateRate: 0, urlRate: 0 })
      continue
    }
    const avgLen = values.reduce((sum, v) => sum + v.length, 0) / values.length
    const numberRate = values.filter(looksLikeNumber).length / values.length
    const dateRate = values.filter(looksLikeDate).length / values.length
    const urlRate = values.filter(looksLikeUrl).length / values.length
    colStats.push({ avgLen, numberRate, dateRate, urlRate })
  }

  const urlCol = colStats.findIndex(s => s.urlRate > 0.5)

  let titleCol = 0
  let bestScore = -1
  for (let c = 0; c < colCount; c++) {
    if (c === urlCol) continue
    const s = colStats[c]
    if (s.numberRate > 0.7) continue
    if (s.dateRate > 0.7) continue
    const score = s.avgLen * (1 - s.numberRate) * (1 - s.dateRate)
    const needsClearWin = bestScore > 0 && c > titleCol
    if (needsClearWin ? score > bestScore * 1.5 : score > bestScore) {
      bestScore = score
      titleCol = c
    }
  }

  const notesCols: number[] = []
  for (let c = 0; c < colCount; c++) {
    if (c === titleCol || c === urlCol) continue
    if (colStats[c].numberRate > 0.7) continue
    notesCols.push(c)
  }

  return { titleCol, notesCols, urlCol }
}

function buildDescription(row: string[], notesCols: number[]): string | null {
  const parts: string[] = []
  for (const c of notesCols) {
    const val = row[c]?.trim()
    if (!val) continue
    if (looksLikeNumber(val)) continue
    if (looksLikeDate(val)) {
      parts.push(`Missed ${val}`)
    } else {
      parts.push(val)
    }
  }
  return parts.length > 0 ? parts.join(' — ') : null
}

export function parseSmartList(rawText: string): ParsedItem[] {
  const lines = rawText.split('\n').map(l => l.trim()).filter(Boolean)
  if (lines.length === 0) return []

  const delimiter = detectDelimiter(lines)

  if (delimiter === 'none') {
    return lines.map(line => {
      const clean = line.replace(NUMBERED_PREFIX, '').replace(BULLET_PREFIX, '').trim()
      const simplePipeIdx = clean.indexOf('|')
      if (simplePipeIdx > 0 && (clean.match(/\|/g) || []).length === 1) {
        return {
          title: clean.slice(0, simplePipeIdx).trim(),
          description: clean.slice(simplePipeIdx + 1).trim() || null,
        }
      }
      if (looksLikeUrl(clean)) {
        return { title: clean, resource_url: clean }
      }
      return { title: clean }
    }).filter(item => item.title.length > 0)
  }

  const allRows = lines
    .filter(l => !SEPARATOR_ROW.test(l))
    .map(l => splitRow(l, delimiter))

  if (allRows.length === 0) return []

  let dataRows = allRows
  if (allRows.length > 1 && isHeaderRow(allRows[0])) {
    dataRows = allRows.slice(1)
  }

  dataRows = dataRows.filter(row =>
    row.length > 0 && !row.every(c => c === '' || SEPARATOR_ROW.test(c))
  )

  if (dataRows.length === 0) return []

  const { titleCol, notesCols, urlCol } = classifyColumns(dataRows)

  const results: ParsedItem[] = []
  for (const row of dataRows) {
    const title = (row[titleCol] ?? '').replace(NUMBERED_PREFIX, '').replace(BULLET_PREFIX, '').trim()
    if (!title) continue
    const description = buildDescription(row, notesCols)
    const url = urlCol >= 0 ? row[urlCol]?.trim() : undefined
    results.push({
      title,
      description,
      resource_url: url && looksLikeUrl(url) ? url : null,
    })
  }
  return results
}
