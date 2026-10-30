import { createHash } from 'node:crypto'
import { existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, realpathSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { gzipSync } from 'node:zlib'
import { afterAll, describe, expect, test, vi } from 'vitest'
import { fetchVerified, layout, prepareHome, sha256File } from './cache.mjs'

/**
 * Downloads are untrusted data (0005): the validator and every package are
 * written into place only once their hash is the registered one, and the
 * validator's package cache holds the registered packages and nothing
 * else. Proved with a fetch that serves bytes from memory, so no case
 * reaches the network.
 */

const made = []
afterAll(() => {
  for (const directory of made) rmSync(directory, { recursive: true, force: true })
})
const scratch = () => {
  const directory = realpathSync.native(mkdtempSync(join(tmpdir(), 'fhir-cache-')))
  made.push(directory)
  return directory
}

const sha = (bytes) => createHash('sha256').update(bytes).digest('hex')

/** A fetch that answers every call with `status` and `bytes`, as a server sends an error page with its 404, counting the calls. */
function serving(bytes, status = 200) {
  const calls = []
  const fetch = async (url) => {
    calls.push(url)
    return new Response(bytes, { status })
  }
  return { fetch, calls }
}

describe('fetchVerified', () => {
  const BYTES = Buffer.from('the validator, as registered')

  // The ordinary case: fetched, checked and moved into place.
  test('fetches, checks and keeps what matches the registered hash', async () => {
    const path = join(scratch(), 'validator', '7.0.2', 'validator_cli.jar')
    const { fetch, calls } = serving(BYTES)
    expect(await fetchVerified({ url: 'https://example.org/v.jar', path, sha256: sha(BYTES) }, { fetch })).toBe(true)
    expect(readFileSync(path).equals(BYTES)).toBe(true)
    expect(calls).toEqual(['https://example.org/v.jar'])
  })

  // The failure this exists for: bytes other than the registered ones are
  // refused before anything runs them, and nothing of them is left where a
  // later run would find it.
  test('refuses, and leaves nothing, when the bytes served are not the registered ones', async () => {
    const directory = scratch()
    const path = join(directory, 'p.tgz')
    const printed = vi.spyOn(console, 'error').mockImplementation(() => {})
    await expect(fetchVerified({ url: 'https://example.org/p.tgz', path, sha256: sha(Buffer.from('other')) }, serving(BYTES))).rejects.toThrow(
      /^refused what https:\/\/example.org\/p.tgz served: its SHA-256 is not [0-9a-f]{64}, the one the register says$/,
    )
    // What was served is printed, and never carried into the results file.
    expect(printed).toHaveBeenCalledWith(`https://example.org/p.tgz served bytes whose SHA-256 is ${sha(BYTES)}`)
    printed.mockRestore()
    expect(readdirSync(directory)).toEqual([])
  })

  // A file already in the cache is used only when it is still those bytes;
  // one that is not is fetched again, and a server that fails says so.
  test('reuses a cached file that matches, fetches again one that does not, and refuses a failed answer', async () => {
    const path = join(scratch(), 'p.tgz')
    writeFileSync(path, BYTES)
    const unused = serving(BYTES)
    expect(await fetchVerified({ url: 'https://example.org/p.tgz', path, sha256: sha(BYTES) }, unused)).toBe(false)
    expect(unused.calls).toEqual([])
    writeFileSync(path, 'tampered')
    expect(await fetchVerified({ url: 'https://example.org/p.tgz', path, sha256: sha(BYTES) }, serving(BYTES))).toBe(true)
    expect(await sha256File(path)).toBe(sha(BYTES))
    rmSync(path)
    const printed = vi.spyOn(console, 'error').mockImplementation(() => {})
    await expect(fetchVerified({ url: 'https://example.org/p.tgz', path, sha256: sha(BYTES) }, serving(BYTES, 404))).rejects.toThrow(
      /^https:\/\/example.org\/p.tgz did not serve the file$/,
    )
    expect(printed).toHaveBeenCalledWith('https://example.org/p.tgz answered 404')
    printed.mockRestore()
  })
})

describe('prepareHome', () => {
  /** A one-file package tarball whose package.json names `id`. */
  const tarball = (id) => {
    const body = Buffer.from(JSON.stringify({ name: id }))
    const header = Buffer.alloc(512)
    header.write('package/package.json', 0, 'utf8')
    header.write('0000644\0', 100)
    header.write('0000000\0', 108)
    header.write('0000000\0', 116)
    header.write(`${body.length.toString(8).padStart(11, '0')}\0`, 124)
    header.write('00000000000\0', 136)
    header.write('0', 156)
    header.write('ustar\0', 257)
    header.write('00', 263)
    header.fill(0x20, 148, 156)
    header.write(
      `${header
        .reduce((sum, byte) => sum + byte, 0)
        .toString(8)
        .padStart(6, '0')}\0 `,
      148,
    )
    return gzipSync(Buffer.concat([header, body, Buffer.alloc(512 - body.length), Buffer.alloc(1024)]))
  }

  /** A cache with each of `ids` downloaded, and its layout and register entries. */
  function cache(ids) {
    const where = layout(scratch())
    const packages = ids.map((id) => {
      const bytes = tarball(id)
      const entry = { id, version: '1.0.0', sha256: sha(bytes) }
      mkdirSync(join(where.tgz(entry), '..'), { recursive: true })
      writeFileSync(where.tgz(entry), bytes)
      return entry
    })
    return { where, packages }
  }

  // The validator takes "the newest it can find" of some packages, and
  // offline the newest it can find is the newest in its cache: a package
  // left there from another register, a lock or a half-installed folder
  // would be judged by. Only the registered ones stay.
  test('unpacks every registered package and removes everything else', () => {
    const { where, packages } = cache(['hl7.a', 'hl7.b'])
    mkdirSync(join(where.packages, 'hl7.terminology#9.9.9', 'package'), { recursive: true })
    writeFileSync(join(where.packages, 'hl7.c#1.0.0.lock'), '')
    writeFileSync(join(where.packages, 'packages.ini'), '[cache]\nversion = 4\n')
    const done = prepareHome(where, packages, '7.0.2')
    expect(done.removed.sort()).toEqual(['hl7.c#1.0.0.lock', 'hl7.terminology#9.9.9'])
    expect(done.unpacked).toEqual(['hl7.a#1.0.0', 'hl7.b#1.0.0'])
    expect(readdirSync(where.packages).sort()).toEqual(['hl7.a#1.0.0', 'hl7.b#1.0.0', 'packages.ini'])
    expect(JSON.parse(readFileSync(join(where.packages, 'hl7.a#1.0.0', 'package', 'package.json'), 'utf8'))).toEqual({ name: 'hl7.a' })
  })

  // Unpacking is most of a first run's time on Windows, so an earlier
  // run's package is kept -- only when that run unpacked the same hash for
  // the same validator, whose indexes it holds; `fresh` keeps nothing.
  test('keeps what an earlier run unpacked from the same hash for the same validator, and nothing else', () => {
    const { where, packages } = cache(['hl7.a'])
    prepareHome(where, packages, '7.0.2')
    expect(prepareHome(where, packages, '7.0.2').kept).toEqual(['hl7.a#1.0.0'])
    expect(prepareHome(where, packages, '7.0.3').unpacked).toEqual(['hl7.a#1.0.0'])
    expect(prepareHome(where, packages, '7.0.3', { fresh: true }).unpacked).toEqual(['hl7.a#1.0.0'])
    // A register whose hash moved keeps nothing, and the tarball on disk,
    // which is the old hash's bytes, is not unpacked under the new one.
    const changed = [{ ...packages[0], sha256: 'f'.repeat(64) }]
    expect(() => prepareHome(where, changed, '7.0.3')).toThrow(
      /^refused to unpack hl7\.a#1\.0\.0: its tarball's SHA-256 is [0-9a-f]{64}, where the register says f{64}$/,
    )
    expect(existsSync(where.unpacked)).toBe(true)
  })

  // fetchVerified checked the tarball when it was fetched; what is unpacked
  // is what is read afterwards, so a tarball changed in between -- by
  // another process, or by a caller that never fetched -- would reach the
  // validator unchecked. Refused, and nothing of it unpacked.
  test('refuses to unpack a tarball that is not the registered bytes when it is read', () => {
    const { where, packages } = cache(['hl7.a'])
    writeFileSync(where.tgz(packages[0]), tarball('hl7.other'))
    expect(() => prepareHome(where, packages, '7.0.2')).toThrow(/^refused to unpack hl7\.a#1\.0\.0: its tarball's SHA-256 is /)
    expect(readdirSync(where.packages)).toEqual([])
  })
})
