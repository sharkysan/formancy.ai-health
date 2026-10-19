import { execFileSync, spawnSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { afterEach, describe, expect, test } from 'vitest'
import { LICENSE_FIELD } from '../verify-licenses.mjs'
import { pinProblems, pinsOf, sbomProblems, sha256, tarballProblems } from './pins.mjs'
import { packageTarball } from './test-archive.mjs'

/**
 * What release.yml's `check` job checks of the report, the tarballs and the
 * SBOM, and what its `publish` job refuses: anything downloaded that is not,
 * byte for byte, what `check` pinned, and a report that is not this run's,
 * green and whole (0011; formancy.ai-report 0014). Every job of a run can
 * write to its artefacts, so the job that holds the npm token takes
 * nobody's word for what it was handed. The functions pure; the command
 * line run as the release runs it, on files this file writes. 0.1.0's
 * rehearsal and its release have run them, and they refused nothing.
 */
const CORE = { name: '@formancy/health-core', version: '0.1.0', license: LICENSE_FIELD }
const tarball = (manifest = CORE, options) => ({ path: 'release-tarballs/formancy-health-core-0.1.0.tgz', bytes: packageTarball(manifest, options) })

describe('tarballProblems', () => {
  // The tarball the install gate packed, at the version the tag names, under
  // the source-available terms, carrying them: what npm may receive.
  test('accepts a tarball at the release version that declares and carries its licence', () => {
    expect(tarballProblems(tarball(), '0.1.0')).toEqual([])
  })

  // A tag that says one version over a tarball of another would publish the
  // wrong bytes under the right name, which nothing can take back.
  test('refuses a tarball of another version', () => {
    expect(tarballProblems(tarball(), '0.2.0')).toEqual(['release-tarballs/formancy-health-core-0.1.0.tgz is @formancy/health-core@0.1.0, not at the release version 0.2.0'])
  })

  // A package under the @formancy scope with no terms inside, or declaring
  // Apache-2.0, would be read as the scope's Apache-2.0 packages are.
  test('refuses a tarball that declares other terms, or leaves the licence files out', () => {
    expect(tarballProblems(tarball({ ...CORE, license: 'Apache-2.0' }), '0.1.0')).toEqual([`release-tarballs/formancy-health-core-0.1.0.tgz declares the licence Apache-2.0, not "${LICENSE_FIELD}"`])
    expect(tarballProblems(tarball(CORE, { without: ['LICENSE.md', 'NOTICE'] }), '0.1.0')).toEqual([
      'release-tarballs/formancy-health-core-0.1.0.tgz carries no LICENSE.md',
      'release-tarballs/formancy-health-core-0.1.0.tgz carries no NOTICE',
    ])
  })
})

describe('pinProblems', () => {
  const files = [tarball(), { path: 'release-report/release-report.json', bytes: Buffer.from('{"problems":[]}') }]

  // A pin is the file's path, as both jobs download it, and the sha256 of
  // its bytes; the same files pinned and downloaded agree.
  test('accepts exactly the files that were pinned', () => {
    const pinned = pinsOf(files)
    expect(pinned['release-tarballs/formancy-health-core-0.1.0.tgz']).toBe(sha256(files[0].bytes))
    expect(pinProblems(JSON.stringify(pinned), files)).toEqual([])
  })

  // Swapped bytes under the pinned name, a file nobody pinned, a pinned
  // file that did not arrive, and a pinned file that arrived somewhere
  // else: each would publish or sign something `check` never saw, or less
  // than it passed.
  test('refuses changed bytes, an unpinned file, a missing one and one moved', () => {
    const pinned = JSON.stringify(pinsOf(files))
    const swapped = [{ ...files[0], bytes: packageTarball({ ...CORE, description: 'other' }) }, files[1]]
    expect(pinProblems(pinned, swapped)).toEqual(['release-tarballs/formancy-health-core-0.1.0.tgz is not the file the check job checked'])
    expect(pinProblems(pinned, [...files, { path: 'release-tarballs/extra-0.1.0.tgz', bytes: Buffer.from('x') }])).toEqual(['release-tarballs/extra-0.1.0.tgz was not checked by the check job'])
    expect(pinProblems(pinned, [files[1]])).toEqual(['release-tarballs/formancy-health-core-0.1.0.tgz was checked but did not arrive'])
    expect(pinProblems(pinned, [{ ...files[0], path: 'release-report/formancy-health-core-0.1.0.tgz' }, files[1]])).toEqual([
      'release-report/formancy-health-core-0.1.0.tgz was not checked by the check job',
      'release-tarballs/formancy-health-core-0.1.0.tgz was checked but did not arrive',
    ])
  })

  // An output that never arrived is '', and must not read as "nothing to check".
  test('refuses when the check job pinned nothing', () => {
    expect(pinProblems('', files)).toEqual(['the check job pinned no file'])
    expect(pinProblems('{}', files)).toEqual(['the check job pinned no file'])
  })
})

describe('sbomProblems', () => {
  // A file that is not a CycloneDX document would be signed and attached to
  // the release as its bill of materials.
  test('accepts a CycloneDX document and refuses anything else', () => {
    expect(sbomProblems(Buffer.from('{"bomFormat":"CycloneDX","components":[]}'))).toEqual([])
    expect(sbomProblems(Buffer.from('{"bomFormat":"SPDX"}'))).toEqual(['the SBOM is not a CycloneDX document'])
    expect(sbomProblems(Buffer.from('not json'))).toEqual(['the SBOM is not JSON'])
  })
})

describe('the command line, as the release runs it', () => {
  const script = join(dirname(fileURLToPath(import.meta.url)), 'pins.mjs')
  let dirs = []
  afterEach(() => {
    for (const dir of dirs) rmSync(dir, { recursive: true, force: true })
    dirs = []
  })

  /** A release's downloads in a directory of their own: the report job's directory, the install gate's tarball and an SBOM. */
  function release() {
    const dir = mkdtempSync(join(tmpdir(), 'formancy-health-pins-'))
    dirs.push(dir)
    const bytes = packageTarball(CORE)
    const report = {
      problems: [],
      subject: { version: '0.1.0', release: 'v0.1.0', commit: 'c0ffee', run: { id: '42' } },
      results: { buildIdentity: [{ package: CORE.name }], install: { tarballs: [{ name: CORE.name, file: 'formancy-health-core-0.1.0.tgz', sha256: createHash('sha256').update(bytes).digest('hex') }] } },
      testedOn: { runtime: [], upstream: [{ name: '@formancy/spec', version: '0.5.0', direct: true, shipped: true }] },
    }
    mkdirSync(join(dir, 'release-report'))
    mkdirSync(join(dir, 'release-tarballs'))
    writeFileSync(join(dir, 'release-report', 'release-report.json'), JSON.stringify(report))
    writeFileSync(join(dir, 'release-report', 'release-report.md'), '# Release report\n')
    writeFileSync(join(dir, 'release-report', 'RELEASE_NOTES.md'), '## 0.1.0\n\nThe first.\n')
    writeFileSync(join(dir, 'release-tarballs', 'formancy-health-core-0.1.0.tgz'), bytes)
    writeFileSync(join(dir, 'sbom.cdx.json'), JSON.stringify({ bomFormat: 'CycloneDX', components: [{ purl: 'pkg:npm/%40formancy/health-core@0.1.0' }, { purl: 'pkg:npm/%40formancy/spec@0.5.0' }] }))
    // npm's lockfile of the project the SBOM step installed the tarballs into.
    mkdirSync(join(dir, 'sbom-project'))
    writeFileSync(join(dir, 'sbom-project', 'package-lock.json'), JSON.stringify({ packages: { '': { name: 'formancy-health' }, 'node_modules/@formancy/health-core': { version: '0.1.0' }, 'node_modules/@formancy/spec': { version: '0.5.0' } } }))
    return dir
  }
  const RUN = { GITHUB_SHA: 'c0ffee', GITHUB_RUN_ID: '42' }
  const { GITHUB_OUTPUT: _, ...inherited } = process.env
  const run = (dir, args, env = {}) => spawnSync(process.execPath, [script, ...args], { cwd: dir, encoding: 'utf8', env: { ...inherited, ...RUN, ...env } })
  const CHECK = ['check', '--release', 'v0.1.0', '--version', '0.1.0', '--report', 'release-report', 'release-tarballs']
  const checked = (dir) => /^checked=(.+)$/m.exec(execFileSync(process.execPath, [script, ...CHECK], { cwd: dir, encoding: 'utf8', env: { ...inherited, ...RUN } }))[1]
  const SBOM = ['sbom', '--report', 'release-report', '--installed', 'sbom-project/package-lock.json', 'sbom.cdx.json']
  const sbomPin = (dir) => /^checked=(.+)$/m.exec(execFileSync(process.execPath, [script, ...SBOM], { cwd: dir, encoding: 'utf8', env: { ...inherited, ...RUN } }))[1]

  // check pins the report's directory and the tarballs, each by its path;
  // the SBOM stage pins the SBOM once it names what the report says a
  // consumer installs.
  test('pins the report, the body and the tarballs, then the SBOM', () => {
    const dir = release()
    expect(Object.keys(JSON.parse(checked(dir))).sort()).toEqual(['release-report/RELEASE_NOTES.md', 'release-report/release-report.json', 'release-report/release-report.md', 'release-tarballs/formancy-health-core-0.1.0.tgz'])
    expect(Object.keys(JSON.parse(sbomPin(dir)))).toEqual(['sbom.cdx.json'])
  })

  // The check job refuses, pinning nothing, a report of another run -- a
  // rehearsal's, or an earlier attempt's -- a tarball the install gate did
  // not record, and a report directory without the body.
  test('refuses, at check, a report of another run, a tarball the install gate did not install, and no body', () => {
    const dir = release()
    const otherRun = run(dir, CHECK, { GITHUB_RUN_ID: '43' })
    expect(otherRun.status).toBe(1)
    expect(otherRun.stdout).not.toContain('checked=')
    expect(otherRun.stderr).toContain('the report is of run 42, not this run, 43')
    writeFileSync(join(dir, 'release-tarballs', 'formancy-health-core-0.1.0.tgz'), packageTarball({ ...CORE, description: 'not installed' }))
    const swapped = run(dir, CHECK)
    expect(swapped.status).toBe(1)
    expect(swapped.stderr).toMatch(/formancy-health-core-0\.1\.0\.tgz has sha256 [0-9a-f]{64}, not that of the formancy-health-core-0\.1\.0\.tgz the install gate installed and ran/)
    rmSync(join(release(), 'release-report', 'RELEASE_NOTES.md'))
    const bodiless = run(dirs.at(-1), CHECK)
    expect(bodiless.status).toBe(1)
    expect(bodiless.stderr).toContain('the report job wrote no release body')
  })

  // The SBOM stage holds the SBOM to the report and pins nothing it
  // refuses: one that leaves out a package this release publishes, or an
  // upstream package a consumer's install brings, would be signed and
  // attached as the release's bill of materials (formancy.ai-report 0017).
  // Without the report there is nothing to hold it to, and it says so.
  test('refuses, at the SBOM stage, an SBOM that is not this release’s, and one with no report to hold it to', () => {
    const dir = release()
    writeFileSync(join(dir, 'sbom.cdx.json'), JSON.stringify({ bomFormat: 'CycloneDX', components: [{ purl: 'pkg:npm/%40formancy/spec@0.5.0' }] }))
    const missing = run(dir, SBOM)
    expect(missing.status).toBe(1)
    expect(missing.stdout).not.toContain('checked=')
    expect(missing.stderr).toContain('the SBOM names no @formancy/health-core 0.1.0, which this release publishes')
    const unheld = run(dir, ['sbom', 'sbom.cdx.json'])
    expect(unheld.status).toBe(1)
    expect(unheld.stdout).not.toContain('checked=')
    expect(unheld.stderr).toContain('pins.mjs sbom needs --report')
  })

  // An SBOM that names what the report asks of it can still name what no
  // consumer installs -- a tool, the workspace's closure -- which the
  // report never asks about. The SBOM stage holds it to npm's lockfile of
  // the install it describes, pins nothing it refuses, and without the
  // lockfile has nothing to hold it to, and says so.
  test('refuses, at the SBOM stage, a component the install it describes does not hold, and an SBOM with no install to hold it to', () => {
    const dir = release()
    writeFileSync(join(dir, 'sbom.cdx.json'), JSON.stringify({ bomFormat: 'CycloneDX', components: [{ purl: 'pkg:npm/%40formancy/health-core@0.1.0' }, { purl: 'pkg:npm/%40formancy/spec@0.5.0' }, { purl: 'pkg:npm/vitest@5.0.5' }] }))
    const extra = run(dir, SBOM)
    expect(extra.status).toBe(1)
    expect(extra.stdout).not.toContain('checked=')
    expect(extra.stderr).toContain('the SBOM names vitest 5.0.5, which the install it describes does not hold')
    const uninstalled = run(dir, ['sbom', '--report', 'release-report', 'sbom.cdx.json'])
    expect(uninstalled.status).toBe(1)
    expect(uninstalled.stdout).not.toContain('checked=')
    expect(uninstalled.stderr).toContain('pins.mjs sbom needs --installed')
  })

  // publish refuses, before it signs anything, a download that is not what
  // check pinned -- the body swapped after check read it -- and passes the
  // same downloads untouched.
  test('passes, at publish, exactly what check pinned, and refuses a file changed since', () => {
    const dir = release()
    const env = { CHECKED: checked(dir), CHECKED_SBOM: sbomPin(dir) }
    const args = ['downloads', '--release', 'v0.1.0', '--version', '0.1.0', '--report', 'release-report', 'release-tarballs', 'sbom.cdx.json']
    expect(run(dir, args, env).status).toBe(0)
    writeFileSync(join(dir, 'release-report', 'RELEASE_NOTES.md'), '## 0.1.0\n\nSomething else.\n')
    const changed = run(dir, args, env)
    expect(changed.status).toBe(1)
    expect(changed.stderr).toContain('release-report/RELEASE_NOTES.md is not the file the check job checked')
  })
})
