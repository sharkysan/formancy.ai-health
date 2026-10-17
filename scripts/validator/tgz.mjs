// A guide package's tarball, unpacked into the package cache the HL7 FHIR
// validator reads, with Node's built-ins and nothing else (0005).
//
// A package is untrusted data even after its SHA-256 has matched the
// register: the register says these are the bytes packages.fhir.org served
// when somebody read them, not that what they hold is harmless. So this reads
// the tar format itself rather than handing the archive to a `tar` binary,
// whose rules differ between GNU's, bsdtar and Windows' copy, and it writes
// only what a package is: regular files and directories, each under the
// destination. A link, a device, an absolute path, a `..`, a name given twice,
// a header whose checksum is wrong and an archive that does not end where tar
// says it ends are each refused, and nothing is left half written: the
// archive is read whole before the first file is written.
//
// What it reads: ustar headers, their `prefix` field, pax `path` records and
// GNU long names, which are how the packages registered on 17 October 2026
// spell their names (scripts/validator/tgz.test.mjs). What it refuses: every
// other entry type, and a size in tar's base-256 form, which no file below
// 8 GiB needs.

import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { gunzipSync } from 'node:zlib'

const BLOCK = 512

/**
 * The most a package's tarball may unpack to, in bytes. The largest the
 * register held on 17 October 2026 was `hl7.fhir.r4.examples` 4.0.1, whose
 * tar is 192,847,360 bytes, measured with `gzip -dc | wc -c`; this is a
 * little under three times that. A package past it is refused before
 * anything is written, rather than read into memory without end.
 */
export const MAX_UNPACKED = 512 * 1024 * 1024

/** A field of a header: the bytes up to its first NUL, as text. */
function field(header, start, length) {
  const bytes = header.subarray(start, start + length)
  const end = bytes.indexOf(0)
  return bytes.subarray(0, end === -1 ? length : end).toString('utf8')
}

/** An octal number field. A base-256 one, or anything that is not octal digits, is refused. */
function octal(header, start, length, what) {
  if ((header[start] & 0x80) !== 0) throw new Error(`${what} is in tar's base-256 form, which this reader refuses`)
  const text = field(header, start, length).trim()
  if (!/^[0-7]+$/.test(text)) throw new Error(`${what} is not an octal number`)
  return BigInt(`0o${text}`)
}

/** Whether a header's checksum is the sum of its bytes, the checksum field read as spaces. */
function checksumHolds(header) {
  let sum = 0n
  for (let index = 0; index < BLOCK; index += 1) sum += BigInt(index >= 148 && index < 156 ? 0x20 : header[index])
  return sum === octal(header, 148, 8, 'a header checksum')
}

/** The records of a pax extended header: `length key=value\n`, each length counting its own line. */
function paxRecords(data) {
  const records = {}
  let at = 0
  while (at < data.length) {
    const space = data.indexOf(0x20, at)
    if (space === -1) throw new Error('a pax record has no length')
    const length = Number.parseInt(data.subarray(at, space).toString('latin1'), 10)
    if (!Number.isSafeInteger(length) || length <= space - at || at + length > data.length) throw new Error('a pax record overruns its header')
    const record = data.subarray(space + 1, at + length - 1).toString('utf8')
    const equals = record.indexOf('=')
    if (equals === -1) throw new Error('a pax record has no key')
    records[record.slice(0, equals)] = record.slice(equals + 1)
    at += length
  }
  return records
}

/**
 * `name` as a path under the destination, or a refusal: no absolute path, no
 * drive, no backslash, no empty or `.` or `..` segment, nothing outside the
 * destination after resolving.
 */
function safePath(name) {
  const trimmed = name.endsWith('/') ? name.slice(0, -1) : name
  if (trimmed === '' || trimmed.startsWith('/') || /^[A-Za-z]:/.test(trimmed) || trimmed.includes('\\') || trimmed.includes('\0')) throw new Error(`refused the entry ${JSON.stringify(name)}: not a relative path`)
  const segments = trimmed.split('/')
  if (segments.some((segment) => segment === '' || segment === '.' || segment === '..')) throw new Error(`refused the entry ${JSON.stringify(name)}: an empty, . or .. segment`)
  return segments.join('/')
}

/**
 * The entries of a gzipped tarball, `{ path, type: 'file' | 'directory', data }`,
 * in archive order. Throws, naming the entry, on anything the module header
 * says is refused, and on an archive that unpacks past `limit` bytes.
 */
export function entries(gzipped, limit = MAX_UNPACKED) {
  const tar = gunzipSync(gzipped, { maxOutputLength: limit })
  const found = []
  const seen = new Set()
  let at = 0
  let longName
  let pax = {}
  for (;;) {
    if (at + BLOCK > tar.length) throw new Error('the archive ends without its two empty blocks')
    const header = tar.subarray(at, at + BLOCK)
    if (header.every((byte) => byte === 0)) {
      const next = tar.subarray(at + BLOCK, at + 2 * BLOCK)
      if (next.length !== BLOCK || !next.every((byte) => byte === 0)) throw new Error('the archive has one empty block where tar ends with two')
      break
    }
    if (!checksumHolds(header)) throw new Error(`the header at byte ${String(at)} has a wrong checksum`)
    const size = octal(header, 124, 12, `the size at byte ${String(at)}`)
    if (size > BigInt(tar.length)) throw new Error(`the entry at byte ${String(at)} says it is larger than the archive`)
    const length = Number(size)
    const data = tar.subarray(at + BLOCK, at + BLOCK + length)
    if (data.length !== length) throw new Error(`the entry at byte ${String(at)} is cut short`)
    at += BLOCK + Math.ceil(length / BLOCK) * BLOCK
    const type = String.fromCharCode(header[156] || 0x30)
    if (type === 'x') {
      pax = paxRecords(data)
      continue
    }
    if (type === 'g') continue
    if (type === 'L') {
      longName = field(data, 0, data.length)
      continue
    }
    const prefix = field(header, 257, 6) === 'ustar' ? field(header, 345, 155) : ''
    const name = pax.path ?? longName ?? (prefix === '' ? field(header, 0, 100) : `${prefix}/${field(header, 0, 100)}`)
    pax = {}
    longName = undefined
    if (type !== '0' && type !== '5') throw new Error(`refused the entry ${JSON.stringify(name)}: its type ${JSON.stringify(type)} is neither a file nor a directory`)
    const path = safePath(name)
    if (seen.has(path)) throw new Error(`refused the entry ${JSON.stringify(name)}: the archive gives it twice`)
    seen.add(path)
    found.push({ path, type: type === '5' ? 'directory' : 'file', data })
  }
  return found
}

/**
 * Unpacks `gzipped` into `destination`, which is created; returns how many
 * files it wrote. Everything is read and checked first, so a refused
 * archive writes nothing.
 */
export function unpack(gzipped, destination, limit = MAX_UNPACKED) {
  const root = resolve(destination)
  // Every path is relative, of named segments and none of them `..`
  // (safePath), so each lands under root; and nothing is written over.
  const all = entries(gzipped, limit)
  mkdirSync(root, { recursive: true })
  let files = 0
  for (const entry of all) {
    const target = join(root, ...entry.path.split('/'))
    if (entry.type === 'directory') {
      mkdirSync(target, { recursive: true })
      continue
    }
    mkdirSync(dirname(target), { recursive: true })
    writeFileSync(target, entry.data, { flag: 'wx' })
    files += 1
  }
  return files
}
