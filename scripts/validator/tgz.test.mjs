import { existsSync, mkdtempSync, readdirSync, readFileSync, realpathSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { gzipSync } from 'node:zlib'
import { afterAll, describe, expect, test } from 'vitest'
import { entries, MAX_UNPACKED, unpack } from './tgz.mjs'

/**
 * A guide package's tarball is untrusted data even once its hash matched
 * (0005), so the reader that unpacks it writes regular files and
 * directories under the destination and refuses everything else. Proved on
 * archives built here, header by header, so that each refusal has the one
 * fault it refuses; that it reads the real packages is shown by every run
 * of the validator gate, which unpacks all of them.
 */

const made = []
afterAll(() => {
  for (const directory of made) rmSync(directory, { recursive: true, force: true })
})
const scratch = () => {
  const directory = realpathSync.native(mkdtempSync(join(tmpdir(), 'tgz-')))
  made.push(directory)
  return directory
}

/** A ustar header for `name` of `size` bytes and `type`, its checksum computed unless `checksum` is given. */
function header(name, size, type = '0', { prefix = '', checksum, sizeField } = {}) {
  const block = Buffer.alloc(512)
  block.write(name, 0, 100, 'utf8')
  block.write('0000644\0', 100, 'latin1')
  block.write('0000000\0', 108, 'latin1')
  block.write('0000000\0', 116, 'latin1')
  if (sizeField === undefined) block.write(`${size.toString(8).padStart(11, '0')}\0`, 124, 'latin1')
  else sizeField.copy(block, 124)
  block.write('00000000000\0', 136, 'latin1')
  block.write(type, 156, 'latin1')
  block.write('ustar\0', 257, 'latin1')
  block.write('00', 263, 'latin1')
  block.write(prefix, 345, 155, 'utf8')
  block.fill(0x20, 148, 156)
  const sum = checksum ?? block.reduce((total, byte) => total + byte, 0)
  block.write(`${sum.toString(8).padStart(6, '0')}\0 `, 148, 'latin1')
  return block
}

/** An entry's header and its data, padded to a whole block. */
const record = (name, data = '', type = '0', options = {}) => {
  const bytes = Buffer.from(data)
  return Buffer.concat([header(name, bytes.length, type, options), bytes, Buffer.alloc((512 - (bytes.length % 512)) % 512)])
}

/** A pax extended header whose records are `fields`. */
const pax = (fields) => {
  const body = Object.entries(fields)
    .map(([key, value]) => {
      const line = ` ${key}=${value}\n`
      let length = line.length + 1
      while (String(length).length + line.length !== length) length = String(length).length + line.length
      return `${String(length)}${line}`
    })
    .join('')
  return record('PaxHeader', body, 'x')
}

const END = Buffer.alloc(1024)
const archive = (...parts) => gzipSync(Buffer.concat([...parts, END]))

describe('entries', () => {
  // The shapes the registered packages use: a directory, files under
  // `package/`, a name too long for ustar's 100 bytes given by a pax
  // record, one given by ustar's prefix field, and one by a GNU long name.
  // Read wrong, a file lands under another name and the validator never
  // finds the profile it holds.
  test('reads directories, files, pax paths, ustar prefixes and GNU long names', () => {
    const long = `package/${'x'.repeat(120)}.json`
    const found = entries(
      archive(
        record('package/', '', '5'),
        record('package/package.json', '{"name":"a"}'),
        pax({ path: long }),
        record('ignored-by-pax', 'long'),
        record('StructureDefinition-a.json', 'prefixed', '0', { prefix: 'package/deep' }),
        record('././@LongLink', 'package/gnu-long-name.json', 'L'),
        record('ignored-by-gnu', 'gnu'),
      ),
    )
    expect(found.map(({ path, type, data }) => [path, type, data.toString('utf8')])).toEqual([
      ['package', 'directory', ''],
      ['package/package.json', 'file', '{"name":"a"}'],
      [long, 'file', 'long'],
      ['package/deep/StructureDefinition-a.json', 'file', 'prefixed'],
      ['package/gnu-long-name.json', 'file', 'gnu'],
    ])
  })

  // A link could point anywhere on the machine, and a device is not data.
  // Followed, a package could write through a symlink outside the cache.
  test('refuses a symbolic link, a hard link and a device', () => {
    for (const type of ['2', '1', '3', '4', '6']) expect(() => entries(archive(record('package/a', '', type)))).toThrow(/neither a file nor a directory/)
  })

  // Each is a way out of the destination, or onto another machine's path
  // rules: written as given, `../x` lands beside the cache.
  test('refuses a path that is absolute, a drive, a backslash, or holds an empty, . or .. segment', () => {
    for (const name of ['/etc/passwd', '/', 'C:/x', 'package\\x', '']) expect(() => entries(archive(record(name, 'x'))), name).toThrow(/not a relative path/)
    for (const name of ['../x', 'package/../../x', 'package/./x', 'package//x']) expect(() => entries(archive(record(name, 'x'))), name).toThrow(/an empty, \. or \.\. segment/)
    expect(() => entries(archive(pax({ path: '../outside' }), record('fine', 'x')))).toThrow(/refused the entry "\.\.\/outside"/)
  })

  // Two entries of one name: the second would silently replace the first,
  // and which one the validator reads would depend on the order.
  test('refuses a name given twice', () => {
    expect(() => entries(archive(record('package/a', '1'), record('package/a', '2')))).toThrow(/gives it twice/)
  })

  // A header whose checksum is wrong is a damaged or a crafted archive.
  test('refuses a header whose checksum is wrong', () => {
    expect(() => entries(archive(record('package/a', 'x', '0', { checksum: 1 })))).toThrow(/wrong checksum/)
  })

  // Read as the end, a truncated archive would unpack as a package missing
  // files, which the validator would load without a word.
  test('refuses an archive that does not end with two empty blocks, or ends inside an entry', () => {
    expect(() => entries(gzipSync(record('package/a', 'x')))).toThrow(/ends without/)
    expect(() => entries(gzipSync(Buffer.concat([record('package/a', 'x'), Buffer.alloc(512)])))).toThrow(/one empty block/)
    expect(() => entries(gzipSync(header('package/a', 4096)))).toThrow(/larger than the archive|cut short/)
  })

  // Base-256 sizes are for files past 8 GiB, which no package has; a size
  // that is not octal digits is not tar.
  test('refuses a size in base-256 or not in octal', () => {
    const base256 = Buffer.alloc(12)
    base256[0] = 0x80
    expect(() => entries(archive(Buffer.concat([header('package/a', 0, '0', { sizeField: base256 })])))).toThrow(/base-256/)
    expect(() => entries(archive(Buffer.concat([header('package/a', 0, '0', { sizeField: Buffer.from('99999999999\0') })])))).toThrow(/not an octal number/)
  })

  // The bound is the measured largest package with room to spare; past it,
  // the archive is refused rather than read into memory without end.
  test('refuses an archive that unpacks past its limit, which is past the largest package measured', () => {
    expect(MAX_UNPACKED).toBeGreaterThan(192_847_360)
    const package_ = archive(record('package/a', 'x'.repeat(4096)))
    expect(entries(package_, 8192)).toHaveLength(1)
    expect(() => entries(package_, 4096)).toThrow(/larger than 4096/)
  })
})

describe('unpack', () => {
  // What the validator reads: the files, where the archive says, and the
  // count, so a caller can tell an empty archive from a package.
  test('writes every file under the destination', () => {
    const to = join(scratch(), 'hl7.fhir.uv.sdc#4.0.0')
    expect(unpack(archive(record('package/', '', '5'), record('package/package.json', '{"name":"hl7.fhir.uv.sdc"}'), record('package/other/a.json', '{}')), to)).toBe(2)
    expect(readFileSync(join(to, 'package', 'package.json'), 'utf8')).toBe('{"name":"hl7.fhir.uv.sdc"}')
    expect(readFileSync(join(to, 'package', 'other', 'a.json'), 'utf8')).toBe('{}')
  })

  // Half a package is worse than none: the validator would load what is
  // there. The whole archive is read and checked before the first write.
  test('writes nothing when any entry is refused, however late', () => {
    const root = scratch()
    expect(() => unpack(archive(record('package/package.json', '{}'), record('../escape', 'x')), join(root, 'p'))).toThrow(/refused the entry/)
    expect(existsSync(join(root, 'p'))).toBe(false)
    expect(readdirSync(root)).toEqual([])
  })
})
