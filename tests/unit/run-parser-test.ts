import { parseSmartList } from '../../src/lib/tasks/parseSmartList'

let r: ReturnType<typeof parseSmartList>
let pass = 0
let fail = 0

function assert(condition: boolean, label: string) {
  if (condition) { pass++ }
  else { fail++; console.error(`FAIL: ${label}`) }
}

// Test 1: Plain lines
r = parseSmartList('Abraham 3\nMoses 1:1-11\nGenesis 1:1-2')
assert(r.length === 3, 'plain: count')
assert(r[0].title === 'Abraham 3', `plain: title=${r[0].title}`)

// Test 2: Numbered
r = parseSmartList('1. Abraham 3\n2. Moses 1:1-11')
assert(r[0].title === 'Abraham 3', `numbered: title=${r[0].title}`)

// Test 3: Numbered with parens
r = parseSmartList('1) Chapter One\n2) Chapter Two')
assert(r[0].title === 'Chapter One', `parens: title=${r[0].title}`)

// Test 4: Bullets
r = parseSmartList('- Chapter One\n- Chapter Two\n* Chapter Three')
assert(r.length === 3, 'bullets: count')
assert(r[0].title === 'Chapter One', `bullets: title=${r[0].title}`)

// Test 5: Simple pipe
r = parseSmartList('Abraham 3 | Missed 1/8\nMoses 1:1-11 | Missed 1/9')
assert(r[0].title === 'Abraham 3', `pipe: title=${r[0].title}`)
assert(r[0].description === 'Missed 1/8', `pipe: desc=${r[0].description}`)

// Test 6: Markdown table (seminary)
r = parseSmartList(`| # | Date Missed | Assignment |
|---|---|---|
| 1 | 1/8 | Abraham 3 |
| 2 | 1/9 | Moses 1:1-11 |
| 3 | 1/13 | Genesis 1:1-2 |`)
assert(r.length === 3, `md: count=${r.length}`)
assert(r[0].title === 'Abraham 3', `md: title=${r[0].title}`)
assert(r[0].description === 'Missed 1/8', `md: desc=${r[0].description}`)

// Test 7: Tab-delimited
r = parseSmartList('1\t1/8\tAbraham 3\n2\t1/9\tMoses 1:1-11')
assert(r.length === 2, `tab: count=${r.length}`)
assert(r[0].title === 'Abraham 3', `tab: title=${r[0].title}`)
assert(r[0].description === 'Missed 1/8', `tab: desc=${r[0].description}`)

// Test 8: Tab with header
r = parseSmartList('#\tDate\tAssignment\n1\t1/8\tAbraham 3')
assert(r.length === 1, `tab-header: count=${r.length}`)
assert(r[0].title === 'Abraham 3', `tab-header: title=${r[0].title}`)

// Test 9: CSV
r = parseSmartList('1,1/8,Abraham 3\n2,1/9,Moses 1:1-11')
assert(r.length === 2, `csv: count=${r.length}`)
assert(r[0].title === 'Abraham 3', `csv: title=${r[0].title}`)

// Test 10: Two-column markdown
r = parseSmartList(`| Assignment | Notes |
|---|---|
| Read chapter 5 | Focus on vocabulary |
| Write essay | Due Friday |`)
assert(r.length === 2, `2col: count=${r.length}`)
assert(r[0].title === 'Read chapter 5', `2col: title=${r[0].title}`)
assert(r[0].description === 'Focus on vocabulary', `2col: desc=${r[0].description}`)

// Test 11: Blank lines ignored
r = parseSmartList('Chapter 1\n\n  \nChapter 2\n\nChapter 3')
assert(r.length === 3, `blanks: count=${r.length}`)

// Test 12: URLs
r = parseSmartList('https://youtube.com/watch?v=abc\nhttps://example.com/lesson2')
assert(r.length === 2, `urls: count=${r.length}`)
assert(r[0].resource_url === 'https://youtube.com/watch?v=abc', `urls: url=${r[0].resource_url}`)

// Test 13: Full 32-row seminary table
r = parseSmartList(`| # | Date Missed | Assignment |
|---|---|---|
| 1 | 1/8 | Abraham 3 |
| 2 | 1/9 | Moses 1:1-11 |
| 3 | 1/13 | Genesis 1:1-2 |
| 4 | 1/20 | Moses 4:1-4 |
| 5 | 1/21 | Moses 4:1-4 |
| 6 | 1/22 | Moses 4:5-32 |
| 7 | 1/23 | Moses 5:1-15 |
| 8 | 1/29 | Moses 6:1-9 |
| 9 | 1/30 | Moses 6:47-68 |
| 10 | 2/10 | Moses 8 |
| 11 | 2/11 | Genesis 6 |
| 12 | 2/17 | Abraham 1 |
| 13 | 2/19 | Genesis 12-17 |
| 14 | 2/24 | Genesis 15 |
| 15 | 2/27 | Genesis 22 |
| 16 | 3/4 | Genesis 25-27 |
| 17 | 3/5 | Genesis 28 |
| 18 | 3/9 | Genesis 37 |
| 19 | 3/10 | Genesis 39 |
| 20 | 3/17 | Lesson 177 |
| 21 | 3/19 | JST Genesis 50 |
| 22 | 3/24 | Assess Your Learning |
| 23 | 3/25 | Exodus 1 |
| 24 | 3/26 | Exodus 2-4 |
| 25 | 3/30 | Easter Prep |
| 26 | 4/1 | Matthew 26 |
| 27 | 4/14 | Exodus 14 |
| 28 | 4/15 | Exodus 16 |
| 29 | 4/17 | Lesson 200 — Obey |
| 30 | 4/21 | Exodus 19 |
| 31 | 4/23 | Exodus 20:12-17 |
| 32 | 4/24 | Exodus 24, Moses 1 |`)
assert(r.length === 32, `full: count=${r.length}`)
assert(r[0].title === 'Abraham 3', `full[0]: title=${r[0].title}`)
assert(r[0].description === 'Missed 1/8', `full[0]: desc=${r[0].description}`)
assert(r[14].title === 'Genesis 22', `full[14]: title=${r[14].title}`)
assert(r[14].description === 'Missed 2/27', `full[14]: desc=${r[14].description}`)
assert(r[28].title === 'Lesson 200 — Obey', `full[28]: title=${r[28].title}`)
assert(r[31].title === 'Exodus 24, Moses 1', `full[31]: title=${r[31].title}`)
assert(r[31].description === 'Missed 4/24', `full[31]: desc=${r[31].description}`)

// Test 14: Mixed text-only (no dates, no numbers) in multi-column
r = parseSmartList(`| Lesson | Topic | Notes |
|---|---|---|
| Intro | Photosynthesis | Review diagrams |
| Lab 1 | Cell division | Lab prep needed |`)
assert(r.length === 2, `mixed: count=${r.length}`)

console.log(`\n${pass} passed, ${fail} failed`)
if (fail > 0) process.exit(1)
