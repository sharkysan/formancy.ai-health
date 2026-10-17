// The validator and its packages, fetched by exact version, checked against
// their registered SHA-256, and laid out where the validator reads them
// (0005). Everything is under one directory, `.fhir-cache/` by default,
// which .gitignore names: nothing downloaded is ever committed.
//
//   validator/<version>/validator_cli.jar     the JAR, as docs/release/validator.json pins it
//   packages/<id>#<version>.tgz               each package, as docs/release/ig-packages.json pins it
//   home/.fhir/packages/<id>#<version>/       each package unpacked: the validator's package cache
//   home/unpacked.json                        which packages home holds, by hash, for which validator
//
// `home` is the `user.home` the validator runs with, so its package cache,
// and the fhir-settings.json it would read from a person's own home, are
// this directory's and nobody's machine-wide ones. It holds exactly the
// registered packages: anything else in it is removed before a run, since
// the validator resolves "the newest it can find" for some packages
// (hl7.terminology, hl7.fhir.uv.extensions), and offline the newest it can
// find is the newest in this directory.

import { createHash } from 'node:crypto'
import { createReadStream, createWriteStream, existsSync, mkdirSync, readdirSync, readFileSync, renameSync, rmSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { Readable } from 'node:stream'
import { pipeline } from 'node:stream/promises'
import { packageKey } from './registers.mjs'
import { unpack } from './tgz.mjs'

/** Where each thing lives under `cache`. */
export function layout(cache) {
  return {
    jar: (pin) => join(cache, 'validator', pin.version, 'validator_cli.jar'),
    tgz: (entry) => join(cache, 'packages', `${packageKey(entry)}.tgz`),
    home: join(cache, 'home'),
    packages: join(cache, 'home', '.fhir', 'packages'),
    unpacked: join(cache, 'home', 'unpacked.json'),
  }
}

/** The SHA-256 of a file, read as a stream. */
export async function sha256File(path) {
  const hash = createHash('sha256')
  await pipeline(createReadStream(path), hash)
  return hash.digest('hex')
}

/**
 * `path`, holding the bytes whose SHA-256 is `sha256`: the file already
 * there when it holds them, else what `url` serves, written beside it and
 * moved into place only once its hash is the registered one. Refuses,
 * deleting what it fetched, when it is not; a cached file that is not those
 * bytes is deleted and fetched again. Returns whether it fetched.
 */
export async function fetchVerified({ url, path, sha256 }, { fetch = globalThis.fetch } = {}) {
  if (existsSync(path)) {
    if ((await sha256File(path)) === sha256) return false
    rmSync(path)
  }
  mkdirSync(dirname(path), { recursive: true })
  const part = `${path}.part`
  const response = await fetch(url, { redirect: 'follow' })
  // What a server sent -- its status, the hash of its bytes -- is printed
  // and never carried in the error: the error reaches the gate's results
  // file, and nothing a server sends is written there.
  if (!response.ok || response.body === null) {
    console.error(`${url} answered ${String(response.status)}`)
    throw new Error(`${url} did not serve the file`)
  }
  const hash = createHash('sha256')
  const body = Readable.fromWeb(response.body)
  body.on('data', (chunk) => hash.update(chunk))
  await pipeline(body, createWriteStream(part))
  const got = hash.digest('hex')
  if (got !== sha256) {
    rmSync(part, { force: true })
    console.error(`${url} served bytes whose SHA-256 is ${got}`)
    throw new Error(`refused what ${url} served: its SHA-256 is not ${sha256}, the one the register says`)
  }
  renameSync(part, path)
  return true
}

/**
 * Lays out the validator's package cache under `where` (a `layout`): every
 * registered package unpacked from its tarball, refused unless the bytes
 * read are the registered SHA-256's, and nothing else. A
 * package unpacked by an earlier run is kept when that run unpacked the
 * same hash for the same validator, which `unpacked.json` records, unless
 * `fresh`; the validator writes its indexes beside a package's files, and
 * rebuilding them is most of a first run's time. Returns
 * `{ removed, unpacked, kept }`, each a list of names.
 */
export function prepareHome(where, packages, validator, { fresh = false } = {}) {
  mkdirSync(where.packages, { recursive: true })
  let record = { validator, packages: {} }
  try {
    const read = JSON.parse(readFileSync(where.unpacked, 'utf8'))
    if (read.validator === validator && !fresh) record = { validator, packages: read.packages ?? {} }
  } catch {
    // No record: nothing is kept.
  }
  const wanted = new Map(packages.map((entry) => [packageKey(entry), entry]))
  const removed = []
  // The validator writes packages.ini when it is missing, and keeps the
  // packages beside it (measured with 7.0.2 on 17 October 2026).
  for (const name of readdirSync(where.packages)) {
    if (name === 'packages.ini' || wanted.has(name)) continue
    rmSync(join(where.packages, name), { recursive: true, force: true })
    removed.push(name)
  }
  const unpacked = []
  const kept = []
  for (const [key, entry] of wanted) {
    const directory = join(where.packages, key)
    if (record.packages[key] === entry.sha256 && existsSync(join(directory, 'package', 'package.json'))) {
      kept.push(key)
      continue
    }
    // Hashed again on the bytes about to be unpacked, so that what the
    // validator reads is checked where it is used, not only where it was
    // fetched.
    const bytes = readFileSync(where.tgz(entry))
    const got = createHash('sha256').update(bytes).digest('hex')
    if (got !== entry.sha256) throw new Error(`refused to unpack ${key}: its tarball's SHA-256 is ${got}, where the register says ${entry.sha256}`)
    delete record.packages[key]
    writeFileSync(where.unpacked, `${JSON.stringify(record, null, 2)}\n`)
    rmSync(directory, { recursive: true, force: true })
    unpack(bytes, directory)
    record.packages[key] = entry.sha256
    writeFileSync(where.unpacked, `${JSON.stringify(record, null, 2)}\n`)
    unpacked.push(key)
  }
  for (const key of Object.keys(record.packages)) if (!wanted.has(key)) delete record.packages[key]
  writeFileSync(where.unpacked, `${JSON.stringify(record, null, 2)}\n`)
  return { removed, unpacked, kept }
}
