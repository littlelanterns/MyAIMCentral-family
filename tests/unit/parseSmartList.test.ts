import { parseSmartList } from '../../src/lib/tasks/parseSmartList'

describe('parseSmartList', () => {
  test('plain lines — one item per line', () => {
    const result = parseSmartList('Abraham 3\nMoses 1:1-11\nGenesis 1:1-2')
    expect(result).toEqual([
      { title: 'Abraham 3' },
      { title: 'Moses 1:1-11' },
      { title: 'Genesis 1:1-2' },
    ])
  })

  test('numbered list — strips prefixes', () => {
    const result = parseSmartList('1. Abraham 3\n2. Moses 1:1-11\n3. Genesis 1:1-2')
    expect(result).toEqual([
      { title: 'Abraham 3' },
      { title: 'Moses 1:1-11' },
      { title: 'Genesis 1:1-2' },
    ])
  })

  test('numbered with parens', () => {
    const result = parseSmartList('1) Chapter One\n2) Chapter Two')
    expect(result).toEqual([
      { title: 'Chapter One' },
      { title: 'Chapter Two' },
    ])
  })

  test('bulleted list', () => {
    const result = parseSmartList('- Chapter One\n- Chapter Two\n* Chapter Three')
    expect(result).toEqual([
      { title: 'Chapter One' },
      { title: 'Chapter Two' },
      { title: 'Chapter Three' },
    ])
  })

  test('simple pipe — title | notes', () => {
    const result = parseSmartList('Abraham 3 | Missed 1/8\nMoses 1:1-11 | Missed 1/9')
    expect(result).toEqual([
      { title: 'Abraham 3', description: 'Missed 1/8' },
      { title: 'Moses 1:1-11', description: 'Missed 1/9' },
    ])
  })

  test('markdown table with headers — Tenise seminary format', () => {
    const input = `| # | Date Missed | Assignment |
|---|---|---|
| 1 | 1/8 | Abraham 3 |
| 2 | 1/9 | Moses 1:1-11 |
| 3 | 1/13 | Genesis 1:1-2 |
| 4 | 1/20 | Moses 4:1-4 |`

    const result = parseSmartList(input)
    expect(result.length).toBe(4)
    expect(result[0].title).toBe('Abraham 3')
    expect(result[0].description).toBe('Missed 1/8')
    expect(result[1].title).toBe('Moses 1:1-11')
    expect(result[1].description).toBe('Missed 1/9')
    expect(result[3].title).toBe('Moses 4:1-4')
    expect(result[3].description).toBe('Missed 1/20')
  })

  test('tab-delimited — spreadsheet copy', () => {
    const input = '1\t1/8\tAbraham 3\n2\t1/9\tMoses 1:1-11\n3\t1/13\tGenesis 1:1-2'
    const result = parseSmartList(input)
    expect(result.length).toBe(3)
    expect(result[0].title).toBe('Abraham 3')
    expect(result[0].description).toBe('Missed 1/8')
    expect(result[1].title).toBe('Moses 1:1-11')
  })

  test('tab-delimited with header row', () => {
    const input = '#\tDate\tAssignment\n1\t1/8\tAbraham 3\n2\t1/9\tMoses 1:1-11'
    const result = parseSmartList(input)
    expect(result.length).toBe(2)
    expect(result[0].title).toBe('Abraham 3')
  })

  test('CSV', () => {
    const input = '1,1/8,Abraham 3\n2,1/9,Moses 1:1-11'
    const result = parseSmartList(input)
    expect(result.length).toBe(2)
    expect(result[0].title).toBe('Abraham 3')
    expect(result[0].description).toBe('Missed 1/8')
  })

  test('two-column markdown — just title and notes', () => {
    const input = `| Assignment | Notes |
|---|---|
| Read chapter 5 | Focus on vocabulary |
| Write essay | Due Friday |
| Study guide | Review before test |`

    const result = parseSmartList(input)
    expect(result.length).toBe(3)
    expect(result[0].title).toBe('Read chapter 5')
    expect(result[0].description).toBe('Focus on vocabulary')
    expect(result[1].title).toBe('Write essay')
    expect(result[1].description).toBe('Due Friday')
  })

  test('single-column markdown — just titles', () => {
    const input = `| Chapter |
|---|
| Introduction |
| Place Value |
| Addition |`

    const result = parseSmartList(input)
    expect(result.length).toBe(3)
    expect(result[0].title).toBe('Introduction')
  })

  test('blank lines and whitespace are ignored', () => {
    const result = parseSmartList('Chapter 1\n\n  \nChapter 2\n\nChapter 3')
    expect(result.length).toBe(3)
  })

  test('URLs detected as resource_url', () => {
    const result = parseSmartList('https://youtube.com/watch?v=abc123\nhttps://example.com/lesson2')
    expect(result.length).toBe(2)
    expect(result[0].resource_url).toBe('https://youtube.com/watch?v=abc123')
    expect(result[0].title).toBe('https://youtube.com/watch?v=abc123')
  })

  test('mixed text with description columns that are not dates', () => {
    const input = `| Lesson | Topic | Notes |
|---|---|---|
| 1 | Photosynthesis | Review diagrams |
| 2 | Cell division | Lab prep needed |`

    const result = parseSmartList(input)
    expect(result.length).toBe(2)
    // Longest non-number column should be title
    expect(result[0].title).toBe('Photosynthesis')
    expect(result[0].description).toContain('Review diagrams')
  })

  test('handles Tenise full 32-row seminary table', () => {
    const input = `| # | Date Missed | Assignment |
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
| 32 | 4/24 | Exodus 24, Moses 1 |`

    const result = parseSmartList(input)
    expect(result.length).toBe(32)
    expect(result[0].title).toBe('Abraham 3')
    expect(result[0].description).toBe('Missed 1/8')
    expect(result[14].title).toBe('Genesis 22')
    expect(result[14].description).toBe('Missed 2/27')
    expect(result[28].title).toBe('Lesson 200 — Obey')
    expect(result[28].description).toBe('Missed 4/17')
    expect(result[31].title).toBe('Exodus 24, Moses 1')
    expect(result[31].description).toBe('Missed 4/24')
  })
})
