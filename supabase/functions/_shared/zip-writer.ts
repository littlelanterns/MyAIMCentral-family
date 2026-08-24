/**
 * zip-writer — minimal, dependency-free ZIP archive writer (STORE method,
 * no compression) for Deno Edge Functions.
 *
 * Built by hand rather than pulling an external package: the codebase's own
 * "Silent Tooling Failure Pattern #8" lesson (CLAUDE.md Convention #241 sub-
 * section) is to never hand-type a dependency string from memory without
 * verifying it resolves — and no ZIP library was already in use anywhere in
 * this repo to copy a proven import from. The ZIP format's STORE-method
 * local/central-directory/EOCD structure is small, stable, and well-
 * documented; implementing it directly removes the resolution risk entirely
 * and produces an archive any standard unzip tool opens correctly.
 *
 * Not a general-purpose ZIP writer: no compression (files are stored raw —
 * fine for a data export of JSON text + a modest number of images), no
 * ZIP64 (fine — well under the 4GB/65535-entry limits for a family's export),
 * no directory entries (flat "path/name" entries are enough for this use).
 */

function crc32(data: Uint8Array): number {
  let crc = ~0
  for (let i = 0; i < data.length; i++) {
    crc ^= data[i]
    for (let bit = 0; bit < 8; bit++) {
      const mask = -(crc & 1)
      crc = (crc >>> 1) ^ (0xedb88320 & mask)
    }
  }
  return (~crc) >>> 0
}

function u16le(n: number): Uint8Array {
  return new Uint8Array([n & 0xff, (n >>> 8) & 0xff])
}
function u32le(n: number): Uint8Array {
  return new Uint8Array([n & 0xff, (n >>> 8) & 0xff, (n >>> 16) & 0xff, (n >>> 24) & 0xff])
}

function concat(...parts: Uint8Array[]): Uint8Array {
  const total = parts.reduce((sum, p) => sum + p.length, 0)
  const out = new Uint8Array(total)
  let offset = 0
  for (const p of parts) {
    out.set(p, offset)
    offset += p.length
  }
  return out
}

// DOS date/time for a fixed reasonable timestamp — the file's mtime is not
// meaningful for a freshly-generated export archive, so a fixed value avoids
// any client-vs-server clock discipline concern (Convention #257 spirit).
const DOS_TIME = u16le(0)
const DOS_DATE = u16le((2026 - 1980) << 9 | (1 << 5) | 1)

interface Entry {
  name: Uint8Array
  data: Uint8Array
  crc: number
  offset: number
}

export class ZipWriter {
  private entries: Entry[] = []
  private chunks: Uint8Array[] = []
  private offset = 0

  addFile(name: string, data: Uint8Array): void {
    const nameBytes = new TextEncoder().encode(name)
    const crc = crc32(data)
    const localHeader = concat(
      u32le(0x04034b50),
      u16le(20), // version needed
      u16le(0), // flags
      u16le(0), // method: store
      DOS_TIME,
      DOS_DATE,
      u32le(crc),
      u32le(data.length), // compressed size == uncompressed (store)
      u32le(data.length),
      u16le(nameBytes.length),
      u16le(0), // extra field length
      nameBytes,
    )
    this.entries.push({ name: nameBytes, data, crc, offset: this.offset })
    this.chunks.push(localHeader, data)
    this.offset += localHeader.length + data.length
  }

  addTextFile(name: string, text: string): void {
    this.addFile(name, new TextEncoder().encode(text))
  }

  finalize(): Uint8Array {
    const cdChunks: Uint8Array[] = []
    let cdSize = 0
    const cdStart = this.offset

    for (const e of this.entries) {
      const central = concat(
        u32le(0x02014b50),
        u16le(20), // version made by
        u16le(20), // version needed
        u16le(0), // flags
        u16le(0), // method: store
        DOS_TIME,
        DOS_DATE,
        u32le(e.crc),
        u32le(e.data.length),
        u32le(e.data.length),
        u16le(e.name.length),
        u16le(0), // extra length
        u16le(0), // comment length
        u16le(0), // disk number start
        u16le(0), // internal attrs
        u32le(0), // external attrs
        u32le(e.offset), // local header offset
        e.name,
      )
      cdChunks.push(central)
      cdSize += central.length
    }

    const eocd = concat(
      u32le(0x06054b50),
      u16le(0), // disk number
      u16le(0), // disk with cd
      u16le(this.entries.length),
      u16le(this.entries.length),
      u32le(cdSize),
      u32le(cdStart),
      u16le(0), // comment length
    )

    return concat(...this.chunks, ...cdChunks, eocd)
  }
}
