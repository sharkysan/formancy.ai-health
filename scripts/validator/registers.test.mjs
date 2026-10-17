import { existsSync, readFileSync, statSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, test } from 'vitest'
import { fhirVersionIn } from '../compatibility.mjs'
import { layout, sha256File } from './cache.mjs'
import { packageKey, packageProblems, pinProblems, readRegisters } from './registers.mjs'

/**
 * The registers a conformance claim rests on (0005): the validator the gate
 * runs, docs/release/validator.json, and every package it loads,
 * docs/release/ig-packages.json. Held three ways:
 *
 * - **Their shape**, always: every field, an exact version, packages.fhir.org's
 *   address for it, a hash that is one, a licence the dependency policy
 *   allows, one FHIR core, and the core FHIR's version health-core writes.
 * - **The files they name**, where this machine has downloaded them into
 *   `.fhir-cache/` (the validator job always has, and runs this file after
 *   the gate): each hash is the bytes', and each package's own manifest says
 *   the id, version, canonical, licence and dependencies the register says.
 * - **The validator's own load**, where the gate has run here and left
 *   test-results/validator.json: what it loaded is exactly what is
 *   registered. The gate refuses a run otherwise too; this says so of the
 *   last one in the suite's own words.
 *
 * The second and third are skipped, and say so, on a machine that has not
 * run the gate: `pnpm test:repo` in the `verify` job is one. The `validator`
 * job runs them, and sets `VALIDATOR_GATE_RAN`, under which none may skip.
 */
const repo = join(dirname(fileURLToPath(import.meta.url)), '..', '..')
const { pin, packages } = readRegisters(repo)
const where = layout(join(repo, '.fhir-cache'))
const RESULTS = join(repo, 'test-results', 'validator.json')

/**
 * The bound on hashing the cache, past vitest's 5 s default, which made the
 * two cases that hash it a coin toss on a busy machine. Hashing the 204 MB
 * JAR took 1.0 and 1.2 s alone in Node and 2.7 s inside the whole of
 * `pnpm test:repo`, and missed the 5 s default twice in the minute after the
 * validator gate finished, on a desktop on 17 October 2026 (Windows 11,
 * Node 24). The bound is for a machine having a bad day, not for the work.
 */
const HASHING = 60_000

/** Whether every registered tarball is in the cache. */
const cached = packages.every((item) => existsSync(where.tgz(item)))

/** Whether the gate's package cache holds every registered package, unpacked from the registered hash. */
const unpacked = (() => {
  try {
    const record = JSON.parse(readFileSync(where.unpacked, 'utf8'))
    return packages.every((item) => record.packages?.[packageKey(item)] === item.sha256)
  } catch {
    return false
  }
})()

// The validator job runs this file after the gate for the cases below that
// read the downloads and the run. Were the cache's layout to move, or the
// gate to stop leaving its results, each would skip and the step would pass
// having checked nothing. So where the job says the gate ran, the files
// they read must all be there.
test.runIf(process.env.VALIDATOR_GATE_RAN === 'true')('skips nothing where the validator gate has run', () => {
  expect({ jar: existsSync(where.jar(pin)), tarballs: cached, unpacked, results: existsSync(RESULTS) }).toEqual({ jar: true, tarballs: true, unpacked: true, results: true })
})

/** A register entry, valid, for fixtures to break one field of. */
const entry = (fields = {}) => ({
  id: 'hl7.fhir.uv.sdc',
  version: '4.0.0',
  loadedAs: 'ig',
  declaredBy: [],
  canonical: 'http://hl7.org/fhir/uv/sdc',
  licence: 'CC0-1.0',
  url: 'https://packages.fhir.org/hl7.fhir.uv.sdc/4.0.0',
  sha256: 'd785be8474c7ec7988e32e326430d9ca4aeb2cac4a1f195022e4d6f7dc5c5291',
  bytes: 1196457,
  ...fields,
})
const CORE = entry({ id: 'hl7.fhir.r4.core', version: '4.0.1', loadedAs: 'core', canonical: 'http://hl7.org/fhir', url: 'https://packages.fhir.org/hl7.fhir.r4.core/4.0.1' })

describe('the validator pin', () => {
  test('holds', () => {
    expect(pinProblems(pin)).toEqual([])
  })

  // An inexact version is a validator nobody chose; an address that is not
  // the release's asset is a JAR from somewhere else under its name; a
  // hash that is not one checks nothing.
  test('refuses an inexact version, another address, a malformed hash and a Java that is no version', () => {
    expect(pinProblems({ ...pin, version: 'latest' })).toEqual(['docs/release/validator.json: version is not an exact release'])
    expect(pinProblems({ ...pin, url: 'https://example.org/validator_cli.jar' })).toEqual([`docs/release/validator.json: url is not the validator_cli.jar asset of release ${pin.version} of hapifhir/org.hl7.fhir.core`])
    expect(pinProblems({ ...pin, sha256: pin.sha256.toUpperCase() })).toEqual(['docs/release/validator.json: sha256 is not 64 lowercase hex digits'])
    expect(pinProblems({ ...pin, java: '17' })).toEqual(['docs/release/validator.json: java is not a Java major version'])
  })

  // The compatibility table prints the release date and the size the
  // download is held to; the licence is the validator's own, which runs in
  // CI with every pull request.
  test('refuses a release date that is not a date, a size that is not one, and a licence the policy refuses', () => {
    expect(pinProblems({ ...pin, released: '15 October 2026' })).toEqual(['docs/release/validator.json: released is not a date'])
    expect(pinProblems({ ...pin, bytes: -1 })).toEqual(['docs/release/validator.json: bytes is not a size'])
    expect(pinProblems({ ...pin, licence: 'GPL-3.0-only' })).toEqual(['docs/release/validator.json: licence is not one dependency-licences.mjs allows'])
  })

  // The bytes the gate ran are the bytes registered: checked on whatever
  // this machine downloaded.
  test.skipIf(!existsSync(where.jar(pin)))('is the JAR in the cache, byte for byte', async () => {
    expect(await sha256File(where.jar(pin))).toBe(pin.sha256)
    expect(statSync(where.jar(pin)).size).toBe(pin.bytes)
  }, HASHING)
})

describe('the package register', () => {
  test('holds', () => {
    expect(packageProblems(packages)).toEqual([])
  })

  // The core the validator loads must be the FHIR the packages write: a
  // register on R4B or R5 would judge R4 resources against another
  // specification and say nothing.
  test('loads as its core the FHIR version health-core writes', () => {
    const fhir = fhirVersionIn(readFileSync(join(repo, 'packages', 'health-core', 'src', 'version.ts'), 'utf8'))
    expect(packages.filter((item) => item.loadedAs === 'core').map(packageKey)).toEqual([`hl7.fhir.r4.core#${fhir}`])
  })

  // Each field a conformance claim or the gate reads, broken one at a
  // time.
  test('refuses an entry missing or breaking each field', () => {
    expect(packageProblems([CORE, entry()])).toEqual([])
    const broken = (fields) => packageProblems([CORE, entry(fields)])
    expect(broken({ version: '4.0.x' })).toContain('docs/release/ig-packages.json: hl7.fhir.uv.sdc#4.0.x: version is not an exact release')
    expect(broken({ version: 'current' })).toContain('docs/release/ig-packages.json: hl7.fhir.uv.sdc#current: version is not an exact release')
    expect(broken({ url: 'https://packages.simplifier.net/hl7.fhir.uv.sdc/4.0.0' })).toEqual(['docs/release/ig-packages.json: hl7.fhir.uv.sdc#4.0.0: url is not packages.fhir.org’s for this exact version'])
    expect(broken({ sha256: 'd785' })).toEqual(['docs/release/ig-packages.json: hl7.fhir.uv.sdc#4.0.0: sha256 is not 64 lowercase hex digits'])
    expect(broken({ licence: 'CC-BY-NC-4.0' })).toEqual(['docs/release/ig-packages.json: hl7.fhir.uv.sdc#4.0.0: licence is not one dependency-licences.mjs allows'])
    expect(broken({ licence: undefined })).toEqual(['docs/release/ig-packages.json: hl7.fhir.uv.sdc#4.0.0: licence is not one dependency-licences.mjs allows'])
    expect(broken({ loadedAs: 'optional' })).toEqual(['docs/release/ig-packages.json: hl7.fhir.uv.sdc#4.0.0: loadedAs is not one of core, ig, dependency'])
    expect(broken({ canonical: 'hl7.org/fhir/uv/sdc' })).toEqual(['docs/release/ig-packages.json: hl7.fhir.uv.sdc#4.0.0: canonical is not an http(s) URL'])
    expect(broken({ bytes: 0 })).toEqual(['docs/release/ig-packages.json: hl7.fhir.uv.sdc#4.0.0: bytes is not a size'])
    expect(broken({ declaredBy: ['hl7.fhir.uv.ips#2.0.1'] })).toEqual(['docs/release/ig-packages.json: hl7.fhir.uv.sdc#4.0.0: declaredBy names hl7.fhir.uv.ips#2.0.1, which is not registered'])
    expect(broken({ loadedAs: 'dependency' })).toEqual(['docs/release/ig-packages.json: hl7.fhir.uv.sdc#4.0.0: no registered package declares it, and no note says why the validator loads it'])
  })

  // Two entries for one package are two hashes for one set of bytes; no
  // core, or two, is no FHIR version or two.
  test('refuses a package twice and anything but one core', () => {
    expect(packageProblems([CORE, entry(), entry()])).toEqual(['docs/release/ig-packages.json: hl7.fhir.uv.sdc#4.0.0: registered twice'])
    expect(packageProblems([entry()])).toEqual(['docs/release/ig-packages.json: 0 packages are loadedAs core, where FHIR is one'])
    expect(packageProblems([])).toEqual(['docs/release/ig-packages.json: packages is not a list of packages'])
  })

  // A guide in ballot is never chosen; a ballot is registered only because
  // a registered package declares it, as SDC 4.0.0 declares the R4
  // extensions' 5.3.0-ballot-tc1. Without this the rule would be prose: a
  // ballot asked for with -ig, or one nothing declares, would pass.
  test('refuses a prerelease the gate asks for, or one no registered package declares', () => {
    const ballot = { version: '4.0.0-ballot', url: 'https://packages.fhir.org/hl7.fhir.uv.sdc/4.0.0-ballot' }
    expect(packageProblems([CORE, entry(ballot)])).toEqual(['docs/release/ig-packages.json: hl7.fhir.uv.sdc#4.0.0-ballot: a prerelease, which the gate never asks for'])
    expect(packageProblems([CORE, entry({ ...ballot, loadedAs: 'dependency', note: 'loaded by the validator' })])).toEqual(['docs/release/ig-packages.json: hl7.fhir.uv.sdc#4.0.0-ballot: a prerelease that no registered package declares'])
    const declared = entry({ id: 'hl7.fhir.uv.extensions.r4', version: '5.3.0-ballot-tc1', url: 'https://packages.fhir.org/hl7.fhir.uv.extensions.r4/5.3.0-ballot-tc1', loadedAs: 'dependency', declaredBy: ['hl7.fhir.uv.sdc#4.0.0'] })
    expect(packageProblems([CORE, entry(), declared])).toEqual([])
  })

  // CH Term, which CH Core 6.0.0 declares, declares IHE's formatCode
  // package, whose package.json says CC-BY-4.0: attribution, which the
  // dependency policy does not allow a consumer to install. Everybody who
  // runs the gate downloads it, and no package of this product carries it;
  // 0009 admits it for the register, for that package at that version
  // alone, so that another CC-BY package, or this one moved, is a decision
  // again and never a field's to admit.
  test('admits a licence the policy refuses only for the package and version a decision names', () => {
    const formatCode = (fields) =>
      entry({ id: 'ihe.formatcode.fhir', version: '1.4.0', url: 'https://packages.fhir.org/ihe.formatcode.fhir/1.4.0', loadedAs: 'dependency', declaredBy: [], note: 'declared by CH Term', licence: 'CC-BY-4.0', ...fields })
    expect(packageProblems([CORE, formatCode()])).toEqual([])
    expect(packageProblems([CORE, formatCode({ version: '1.5.0', url: 'https://packages.fhir.org/ihe.formatcode.fhir/1.5.0' })])).toEqual(['docs/release/ig-packages.json: ihe.formatcode.fhir#1.5.0: licence is not one dependency-licences.mjs allows'])
    expect(packageProblems([CORE, formatCode({ licence: 'CC-BY-SA-4.0' })])).toEqual(['docs/release/ig-packages.json: ihe.formatcode.fhir#1.4.0: licence is not one dependency-licences.mjs allows'])
    expect(packageProblems([CORE, entry({ licence: 'CC-BY-4.0' })])).toEqual(['docs/release/ig-packages.json: hl7.fhir.uv.sdc#4.0.0: licence is not one dependency-licences.mjs allows'])
  })

  // The bytes the gate unpacked are the bytes registered.
  test.skipIf(!cached)('is every package in the cache, byte for byte', async () => {
    for (const item of packages) {
      expect(await sha256File(where.tgz(item)), packageKey(item)).toBe(item.sha256)
      expect(statSync(where.tgz(item)).size, packageKey(item)).toBe(item.bytes)
    }
  }, HASHING)

  // What the register says of a package is what the package says of
  // itself, read from the manifest the gate unpacked from those bytes:
  // its id and version, its canonical and licence, and which registered
  // packages declare it, both ways.
  test.skipIf(!unpacked)('says of every package what its own package.json says', () => {
    const manifests = new Map(packages.map((item) => [packageKey(item), JSON.parse(readFileSync(join(where.packages, packageKey(item), 'package', 'package.json'), 'utf8'))]))
    for (const item of packages) {
      const manifest = manifests.get(packageKey(item))
      expect({ id: manifest.name, version: manifest.version, canonical: manifest.canonical, licence: manifest.license }, packageKey(item)).toEqual({ id: item.id, version: item.version, canonical: item.canonical, licence: item.licence })
      const declaring = [...manifests].filter(([, other]) => other.dependencies?.[item.id] === item.version).map(([key]) => key).sort()
      expect(item.declaredBy, packageKey(item)).toEqual(declaring)
    }
  })

  // A manifest may declare a range where the register pins a version: CH
  // Core 6.0.0 declares ch.fhir.ig.ch-term 3.3.x, which the validator
  // resolves to the newest 3.3 release it can find, offline the one the
  // cache holds. So the register holds exactly one release the range
  // admits, which no manifest declares exactly, and a note says why it is
  // loaded; a second would leave which one runs to the validator. A range
  // of another shape fails until this reads it.
  test.skipIf(!unpacked)('pins one release, with a note, for every range a manifest declares', () => {
    const exact = /^\d+\.\d+\.\d+(-[0-9A-Za-z.-]+)?$/
    const ranges = packages.flatMap((item) => {
      const manifest = JSON.parse(readFileSync(join(where.packages, packageKey(item), 'package', 'package.json'), 'utf8'))
      return Object.entries(manifest.dependencies ?? {}).filter(([, version]) => !exact.test(version)).map(([id, range]) => ({ by: packageKey(item), id, range }))
    })
    for (const { by, id, range } of ranges) {
      const minor = /^(\d+\.\d+)\.x$/.exec(range)
      expect(minor, `${by} declares ${id} ${range}, a range this test does not read`).not.toBeNull()
      const admitted = packages.filter((item) => item.id === id && item.version.startsWith(`${minor[1]}.`))
      expect(admitted.map(packageKey), `${by} declares ${id} ${range}`).toHaveLength(1)
      expect(admitted[0].note, `${packageKey(admitted[0])} is loaded for a range, and no note says so`).toMatch(new RegExp(range.replaceAll('.', String.raw`\.`)))
    }
  })

  // Read from the gate's own results: what the validator loaded in the last
  // run, by its Package Summary, is exactly the register.
  test.skipIf(!existsSync(RESULTS))('is what the validator loaded in the last run', () => {
    const results = JSON.parse(readFileSync(RESULTS, 'utf8'))
    expect(results.packages?.loaded, 'the last run recorded no Package Summary').toBeInstanceOf(Array)
    expect([...results.packages.loaded].sort()).toEqual(packages.map(packageKey).sort())
  })
})
