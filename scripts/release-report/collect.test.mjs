import { execFileSync } from 'node:child_process'
import { existsSync, mkdirSync, mkdtempSync, rmSync, utimesSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'
import { afterEach, describe, expect, test } from 'vitest'
import { collect, keyFor } from './collect.mjs'

/**
 * collect.mjs over a workspace this file writes in a temporary directory:
 * two packages, one published and one private, and the files each suite,
 * the install gate and the validator gate leave, and the demo with its
 * browser gate's where a test adds it. git is a function that
 * answers what a machine would -- collect asks it for the commit, nothing a
 * test here is about.
 */
let roots = []
afterEach(() => {
  for (const root of roots) rmSync(root, { recursive: true, force: true })
  roots = []
})

const T0 = Date.parse('2026-10-17T10:00:00Z')
const at = (minutes) => new Date(T0 + minutes * 60_000).toISOString()

function put(root, path, value) {
  mkdirSync(dirname(join(root, path)), { recursive: true })
  writeFileSync(join(root, path), typeof value === 'string' ? value : JSON.stringify(value))
}

/** A vitest JSON report of `tests` in `file` (one passing test by default), started at `start`. */
const vitest = (root, file, { start = T0, tests = [{ fullName: 'reads a decimal', status: 'passed', duration: 1000, meta: { anything: 'a test chose' } }] } = {}) => ({
  success: true,
  numTotalTests: tests.length,
  numPassedTests: tests.filter((entry) => entry.status === 'passed').length,
  numFailedTests: 0,
  numPendingTests: tests.filter((entry) => entry.status === 'skipped').length,
  numTodoTests: 0,
  numFailedTestSuites: 0,
  startTime: start,
  testResults: [{ name: join(root, file), status: 'passed', startTime: start + 1000, endTime: start + 2000, assertionResults: tests }],
  coverageMap: { 'packages/health-core/src/numbers.ts': { s: { 0: 1 } } },
})

/** The validator gate's file as scripts/validator.mjs writes it on a run that passed. */
const gate = (start = at(40)) => ({
  gate: 'validator',
  startedAt: start,
  finishedAt: at(43),
  validator: { version: '7.0.2', sha256: 'e3'.repeat(32), reported: '7.0.2', java: '17.0.4' },
  offline: { tx: 'n/a', txCache: 'n/a', httpAccess: false, consoleRefusals: 0 },
  packages: { registered: ['hl7.fhir.r4.core#4.0.1'], loaded: ['hl7.fhir.r4.core#4.0.1'] },
  resources: [{ file: 'questionnaire-intake.json', expect: 'accepted', verdict: 'as expected', refusals: [], registeredWarnings: [], errors: 0, warnings: 0, information: 0 }],
  problems: [],
  passed: true,
})

/** A workspace: health-core (published) and health-corpus (private), with what a run of each left. */
function workspace() {
  const root = mkdtempSync(join(tmpdir(), 'formancy-health-collect-'))
  roots.push(root)
  put(root, 'packages/health-core/package.json', { name: '@formancy/health-core', scripts: { 'test:coverage': 'vitest run --coverage' } })
  put(root, 'packages/health-core/dist/index.mjs', 'export {}\n')
  put(root, 'packages/health-core/test-results/vitest.json', vitest(root, 'packages/health-core/src/numbers.test.ts'))
  put(root, 'packages/health-core/coverage/coverage-summary.json', { total: { lines: { pct: 100 } }, 'src/numbers.ts': {} })
  // Written as the suite ends, whatever this machine's clock says today.
  utimesSync(join(root, 'packages/health-core/coverage/coverage-summary.json'), new Date(T0 + 3000), new Date(T0 + 3000))
  put(root, 'packages/health-corpus/package.json', { name: '@formancy/health-corpus', private: true, scripts: { 'test:coverage': 'vitest run --coverage' } })
  put(root, 'packages/health-corpus/dist/index.mjs', 'export {}\n')
  put(root, 'test-results/vitest.json', vitest(root, 'scripts/check-cla.test.mjs'))
  put(root, 'test-results/install.json', { startedAt: at(20), finishedAt: at(25), passed: true, node: 'v22.20.0', npm: '10.9.0', resolved: [], tarballs: [] })
  put(root, '.turbo/runs/one.json', { execution: { startTime: T0 - 5000 }, tasks: [{ taskId: '@formancy/health-core#test:coverage', execution: { startTime: T0 - 4000, endTime: T0 + 9000 }, cache: { status: 'MISS' } }] })
  return root
}

/** The validator job's checkout: the gate's file, and the registers' run it made after it. */
function validatorJob(root = workspace()) {
  put(root, 'test-results/validator.json', gate())
  put(root, 'test-results/vitest.json', vitest(root, 'scripts/validator/registers.test.mjs', { start: T0 + 44 * 60_000, tests: [{ fullName: 'the package register › is every package in the cache, byte for byte', status: 'passed', duration: 9 }] }))
  return root
}

const machine = {
  env: { GITHUB_SHA: 'abc123', GITHUB_RUN_ID: '42', GITHUB_RUN_ATTEMPT: '1', ImageOS: 'ubuntu24', ImageVersion: '20261012.1' },
  git: () => 'abc123\n',
  now: () => new Date(T0 + 50 * 60_000),
}

describe('a job’s key', () => {
  // The artefact is named release-results-<key>, and the report expects one
  // per package with a suite, keyed as codecov-config.mjs keys it. A name
  // the report cannot match is a missing package to it.
  test('is test-<id> for a package’s suite, and carries a matrix value', () => {
    const covered = [{ path: 'packages/health-core', id: 'health-core', name: '@formancy/health-core' }]
    expect(keyFor({ job: 'test', pkg: '@formancy/health-core' }, covered)).toBe('test-health-core')
    expect(keyFor({ job: 'validator', variant: 'java 17' }, covered)).toBe('validator-java-17')
    expect(keyFor({ job: 'verify' }, covered)).toBe('verify')
    expect(() => keyFor({ job: 'test', pkg: '@formancy/nothing' }, covered)).toThrow(/no workspace package/)
  })
})

describe('a test job’s results', () => {
  // The report counts what the suite ran. The coverage map is megabytes
  // nobody reads, and a test's meta is whatever a test chose to put there:
  // neither belongs in an artefact the report reads.
  test('keep the suite, its task and its coverage, and drop the coverage map and the meta', () => {
    const result = collect({ root: workspace(), job: 'test', pkg: '@formancy/health-core', ...machine })
    expect(result).toMatchObject({ schema: 1, job: 'test', key: 'test-health-core', package: '@formancy/health-core', commit: 'abc123', run: { id: '42', attempt: '1' }, missing: [] })
    expect(result.runner).toMatchObject({ image: 'ubuntu24', imageVersion: '20261012.1' })
    const [suite] = result.suites
    expect(suite).not.toHaveProperty('coverageMap')
    expect(suite.files).toEqual([{ file: 'packages/health-core/src/numbers.test.ts', status: 'passed', startTime: T0 + 1000, endTime: T0 + 2000, tests: [{ name: 'reads a decimal', status: 'passed', durationMs: 1000 }] }])
    expect(suite.task).toEqual({ startTime: T0 - 4000, endTime: T0 + 9000, cache: 'MISS' })
    expect(suite.coverage).toEqual({ lines: { pct: 100 } })
  })

  // Every published package's dist/ the job built, so the report can hold
  // the tarball npm receives to every build; a private package is nobody's
  // tarball, and a change to a built file is a different build.
  test('record the dist/ of every published package, and of no private one', () => {
    const root = workspace()
    const before = collect({ root, job: 'verify', ...machine }).dist
    expect(before.map((entry) => entry.package)).toEqual(['@formancy/health-core'])
    put(root, 'packages/health-core/dist/index.mjs', 'export const a = 1\n')
    expect(collect({ root, job: 'verify', ...machine }).dist[0].distHash).not.toBe(before[0].distHash)
  })

  // A suite replayed from turbo's cache ran on another commit, or nowhere;
  // one without a summary has no wall time.
  test('list a task turbo replayed, and a run summary that is not there', () => {
    const root = workspace()
    put(root, '.turbo/runs/one.json', { execution: { startTime: T0 }, tasks: [{ taskId: '@formancy/health-core#test:coverage', execution: { startTime: T0, endTime: T0 + 10 }, cache: { status: 'HIT' } }] })
    expect(collect({ root, job: 'test', pkg: '@formancy/health-core', ...machine }).missing).toEqual(['a fresh run of @formancy/health-core#test:coverage: turbo replayed it from its cache'])
    rmSync(join(root, '.turbo'), { recursive: true })
    expect(collect({ root, job: 'test', pkg: '@formancy/health-core', ...machine }).missing).toEqual(["turbo's run summary for @formancy/health-core#test:coverage (run it with --summarize)"])
  })

  // The report can only say a file did not run if it knows the file is
  // there. A file renamed past its package's vitest include, an include
  // narrowed, or one file run after the whole suite would otherwise leave a
  // suite that ran part of its tests reported as whole. So each suite
  // carries the test files the checkout holds for it, by name and not by
  // its include, which is what is on trial: everything git has, committed
  // or new, under the package -- the rest belongs to the guards.
  test('carry every test file the checkout holds for the suite, whatever its include matches', () => {
    const root = workspace()
    const files = [
      'packages/health-core/src/numbers.test.ts',
      'packages/health-core/src/json.spec.ts',
      'packages/health-core/src/numbers.ts',
      'packages/health-corpus/src/pdf.test.ts',
      'scripts/check-cla.test.mjs',
      'scripts/validator/registers.test.mjs',
      'packages/health-core/src/deleted.test.ts',
    ]
    for (const file of files.filter((entry) => !entry.includes('deleted'))) put(root, file, '')
    const git = (args) => (args[0] === 'ls-files' ? `${files.join('\0')}\0` : 'abc123\n')
    expect(collect({ root, job: 'test', pkg: '@formancy/health-core', ...machine, git }).suites[0].testFiles).toEqual(['packages/health-core/src/json.spec.ts', 'packages/health-core/src/numbers.test.ts'])
    expect(collect({ root, job: 'verify', ...machine, git }).suites[0].testFiles).toEqual(['scripts/check-cla.test.mjs', 'scripts/validator/registers.test.mjs'])
  })

  // In CI as on a machine, a suite's row is one run's: coverage written
  // before its vitest.json started, or a turbo task that ended before it or
  // began after it, is another run's -- yesterday's full suite beside
  // today's one file -- and its numbers would be printed as this run's.
  test('refuse a coverage summary or a turbo task from another run than its vitest.json', () => {
    const root = workspace()
    utimesSync(join(root, 'packages/health-core/coverage/coverage-summary.json'), new Date(T0 - 1000), new Date(T0 - 1000))
    put(root, '.turbo/runs/one.json', { execution: { startTime: T0 + 500 }, tasks: [{ taskId: '@formancy/health-core#test:coverage', execution: { startTime: T0 + 500, endTime: T0 + 9000 }, cache: { status: 'MISS' } }] })
    const result = collect({ root, job: 'test', pkg: '@formancy/health-core', ...machine })
    expect(result.suites.map((suite) => [suite.task, suite.coverage])).toEqual([[null, null]])
    expect(result.missing).toEqual([
      `another run's: turbo's run summary for @formancy/health-core#test:coverage ran from ${new Date(T0 + 500).toISOString()} to ${new Date(T0 + 9000).toISOString()}, which does not hold its vitest.json's start, ${at(0)}`,
      `another run's: packages/health-core/coverage/coverage-summary.json written ${new Date(T0 - 1000).toISOString()}, before its vitest.json started, ${at(0)}`,
    ])
  })

  // A suite that never wrote its file -- the install failed, the suite
  // crashed -- is listed, so the report says what is missing rather than
  // that the package has no tests.
  test('list a suite that left no results', () => {
    const root = workspace()
    rmSync(join(root, 'packages/health-core/test-results'), { recursive: true })
    expect(collect({ root, job: 'test', pkg: '@formancy/health-core', ...machine })).toMatchObject({ suites: [], absent: [{ reader: 'test', file: 'packages/health-core/test-results/vitest.json' }], missing: [] })
  })
})

describe('the verify and install jobs’ results', () => {
  // verify runs the repository's guards, whose suite is the root's; the
  // install gate leaves its record and the tarballs it packed.
  test('keep the repository guards’ suite, and the install gate’s record', () => {
    const root = workspace()
    expect(collect({ root, job: 'verify', ...machine }).suites.map((suite) => [suite.package, suite.path, suite.files[0].file])).toEqual([[null, '.', 'scripts/check-cla.test.mjs']])
    const install = collect({ root, job: 'install', ...machine })
    expect(install).toMatchObject({ key: 'install', suites: [], install: { passed: true, npm: '10.9.0' }, validator: null, tarballs: [], absent: [], missing: [] })
    rmSync(join(root, 'test-results/install.json'))
    expect(collect({ root, job: 'install', ...machine })).toMatchObject({ install: null, absent: [{ reader: 'install', file: 'test-results/install.json' }], missing: [] })
  })

  // A job gates.yml gains needs a reader here before it can say anything;
  // collecting nothing for it would upload results that look like a job
  // with nothing to report.
  test('refuse a job it has no reader for', () => {
    expect(() => collect({ root: workspace(), job: 'container', ...machine })).toThrow(
      'collect.mjs reads the verify, test, browser, install and validator jobs, and has no reader for container: a job the report expects results from needs one here',
    )
  })
})

/** The demo, with a browser gate, and the file its gate wrote in each of `browsers`. */
function withDemo(root, browsers = ['chromium']) {
  put(root, 'apps/demo/package.json', { name: '@formancy/health-demo', private: true, scripts: { 'test:browser': 'node scripts/browser-test.mjs' } })
  const versions = { chromium: '156.0.8078.4', firefox: '157.0', webkit: '27.2' }
  for (const browser of browsers) {
    const gate = { gate: 'apps/demo', asked: browser, startedAt: at(30), finishedAt: at(33), browser: { name: browser, version: versions[browser], headless: true }, playwright: '1.64.1', planned: ['phone, 360, fr'], passes: 1, made: [], checks: { ok: 3, failed: [] } }
    put(root, `apps/demo/test-results/browser-${browser}.json`, gate)
  }
  return root
}

describe('the browser job’s results', () => {
  // Each leg of the browser job runs the gate in its one browser (0014);
  // the report judges each from the file it wrote, so a leg's results carry
  // that browser's file alone, under the key `browser-<browser>`, which
  // gates.yml's collect step gives with --variant. Another browser's file
  // left on the runner is not this leg's to report.
  test('keep each app’s gate in the browser the leg ran, under that browser’s key', () => {
    const root = withDemo(workspace(), ['chromium', 'webkit'])
    const result = collect({ root, job: 'browser', variant: 'webkit', ...machine })
    expect(result).toMatchObject({ key: 'browser-webkit', job: 'browser', variant: 'webkit', suites: [], install: null, validator: null, absent: [], missing: [] })
    expect(result.browserGates.map((gate) => [gate.gate, gate.asked, gate.browser.version, gate.planned])).toEqual([['apps/demo', 'webkit', '27.2', ['phone, 360, fr']]])
    // The job builds what the demo imports, so its dist/ is held to every other job's.
    expect(result.dist.map((entry) => entry.package)).toEqual(['@formancy/health-core'])
  })

  // A leg that names no browser, or one the gates do not run in, would
  // upload a key the report does not expect, or read another leg's file.
  test('refuse a browser job that names no browser, or one the gates do not run in', () => {
    const root = withDemo(workspace())
    expect(() => collect({ root, job: 'browser', ...machine })).toThrow('--job browser needs --variant <browser>, the browser its leg ran: one of chromium, firefox, webkit')
    expect(() => collect({ root, job: 'browser', variant: 'opera', ...machine })).toThrow('--job browser --variant opera: opera is no browser the gates run in (chromium, firefox, webkit)')
  })

  // A gate that left nothing -- the build failed before it wrote, or its
  // leg ran it in another browser than its own -- is listed, so the
  // report says what is missing rather than that the app has no gate.
  test('list a gate in a browser that left no results', () => {
    const root = withDemo(workspace())
    expect(collect({ root, job: 'browser', variant: 'firefox', ...machine })).toMatchObject({ browserGates: [], absent: [{ reader: 'browser', file: 'apps/demo/test-results/browser-firefox.json' }] })
    rmSync(join(root, 'apps/demo/test-results'), { recursive: true })
    expect(collect({ root, job: 'browser', variant: 'chromium', ...machine })).toMatchObject({ browserGates: [], absent: [{ reader: 'browser', file: 'apps/demo/test-results/browser-chromium.json' }] })
  })

  // A file filed under one browser and written by another browser's run, or
  // by a run that launched another, would be that browser's checks reported
  // as this one's.
  test('refuse a gate’s file whose browser, asked for or launched, is not the one it is filed under', () => {
    const root = withDemo(workspace())
    const file = 'apps/demo/test-results/browser-chromium.json'
    put(root, file, { gate: 'apps/demo', asked: 'firefox', startedAt: at(30), browser: null })
    expect(collect({ root, job: 'browser', variant: 'chromium', ...machine })).toMatchObject({ browserGates: [], missing: [`apps/demo’s gate asked for firefox in its chromium file: ${file}`] })
    put(root, file, { gate: 'apps/demo', asked: 'chromium', startedAt: at(30), browser: { name: 'webkit', version: '27.2' } })
    expect(collect({ root, job: 'browser', variant: 'chromium', ...machine })).toMatchObject({ browserGates: [], missing: [`apps/demo’s gate launched webkit in its chromium file: ${file}`] })
  })

  // On a machine every browser of scripts/browsers.mjs is expected, whatever
  // FORMANCY_BROWSERS said on the way: a run narrowed to one browser is a
  // report that says the others are missing, never one that passes them.
  test('expect every browser on a machine', () => {
    const local = collect({ root: withDemo(workspace(), ['chromium', 'firefox']), local: true, since: at(-1), ...machine, env: {} })
    expect(local.browserGates.map((gate) => gate.asked)).toEqual(['chromium', 'firefox'])
    expect(local.absent).toEqual(expect.arrayContaining([{ reader: 'browser', file: 'apps/demo/test-results/browser-webkit.json' }]))
  })

  // On a machine, the gate's file is whatever its last run left: yesterday's
  // green gate read as today's would report checks nobody made.
  test('are read on a machine too, and refused from before --since', () => {
    expect(collect({ root: withDemo(workspace()), local: true, since: at(-1), ...machine, env: {} }).browserGates).toHaveLength(1)
    const stale = collect({ root: withDemo(workspace()), local: true, since: at(31), ...machine, env: {} })
    expect(stale.browserGates).toEqual([])
    expect(stale.missing).toEqual(expect.arrayContaining([`stale: apps/demo/test-results/browser-chromium.json started ${at(30)}, before --since`]))
  })
})

describe('the validator job’s results', () => {
  // The validator job leaves two things the report reads: the gate's own
  // file, which says what it ran, loaded and judged, and the run of the
  // registers' test after it, whose passes account for the cases verify
  // skipped. That run is held to no checkout's test files: it runs what its
  // step names, and no guards' suite is read here.
  test('keep the gate’s file and the registers’ run, and no suite of the guards', () => {
    const result = collect({ root: validatorJob(), job: 'validator', ...machine })
    expect(result).toMatchObject({ key: 'validator', job: 'validator', suites: [], install: null, absent: [], missing: [] })
    expect(result.validator.gate).toMatchObject({ passed: true, validator: { reported: '7.0.2' }, packages: { loaded: ['hl7.fhir.r4.core#4.0.1'] } })
    expect(result.validator.suite.files.map((file) => [file.file, file.tests.map((entry) => entry.status)])).toEqual([['scripts/validator/registers.test.mjs', ['passed']]])
    expect(result.validator.suite).not.toHaveProperty('testFiles')
    // The job builds the packages the corpus is written by, so its dist/ is
    // held to every other job's.
    expect(result.dist.map((entry) => entry.package)).toEqual(['@formancy/health-core'])
  })

  // A gate that stopped before it wrote, or a job whose registers' step
  // never ran, is listed under the validator reader, so the report says
  // what is missing rather than that the validator had nothing to say.
  test('list the gate’s file, or the registers’ run, that it did not find', () => {
    const root = validatorJob()
    rmSync(join(root, 'test-results/validator.json'))
    expect(collect({ root, job: 'validator', ...machine })).toMatchObject({ absent: [{ reader: 'validator', file: 'test-results/validator.json' }] })
    rmSync(join(root, 'test-results/vitest.json'))
    expect(collect({ root, job: 'validator', ...machine }).absent).toEqual([
      { reader: 'validator', file: 'test-results/validator.json' },
      { reader: 'validator', file: 'test-results/vitest.json' },
    ])
  })

  // collect reads the gate's file where the gate writes it. The path is
  // written twice -- collect imports nothing that brings the corpus's
  // packages, and the gate's module does -- so the two are held equal
  // here: a gate that moved its file would otherwise leave every report
  // saying the validator left no results.
  test('reads the file where the gate writes it', async () => {
    const { RESULTS } = await import('../validator.mjs')
    const { VALIDATOR_RESULTS } = await import('./collect.mjs')
    expect(VALIDATOR_RESULTS).toBe(RESULTS)
  })

  // A results file that records no start cannot be told from another
  // run's, in CI as on a machine: one written before the gate kept its
  // start would be read as this run's verdict.
  test('refuse a gate’s file that records no start', () => {
    const root = validatorJob()
    const { startedAt: _, ...unstarted } = gate()
    put(root, 'test-results/validator.json', unstarted)
    expect(collect({ root, job: 'validator', ...machine })).toMatchObject({ missing: ['test-results/validator.json records no start, so which run wrote it is unknown'] })
    expect(collect({ root, job: 'validator', ...machine }).validator.gate).toBeNull()
  })
})

describe('local results', () => {
  // On one machine every file is whatever the last run left. A suite from
  // yesterday read as today's would report tests nobody ran.
  test('refuse a file that started before --since, and say so', () => {
    const root = validatorJob()
    put(root, 'test-results/vitest.json', vitest(root, 'scripts/check-cla.test.mjs'))
    const result = collect({ root, local: true, since: at(10), ...machine, env: {} })
    expect(result.suites).toEqual([])
    expect(result.install).toMatchObject({ passed: true })
    expect(result.validator.gate).toMatchObject({ passed: true })
    expect(result.missing).toEqual(expect.arrayContaining([`stale: packages/health-core/test-results/vitest.json started ${at(0)}, before --since`, `stale: test-results/vitest.json started ${at(0)}, before --since`]))
    const later = collect({ root, local: true, since: at(41), ...machine, env: {} })
    expect(later.missing).toEqual(expect.arrayContaining([`stale: test-results/install.json started ${at(20)}, before --since`, `stale: test-results/validator.json started ${at(40)}, before --since`]))
    expect(later.validator).toBeNull()
  })

  // On a machine the registers' cases run in the guards' suite, and one of
  // them reads the gate's file: guards that started before the gate
  // finished read an earlier gate's file -- yesterday's, after --since was
  // set -- and passed against it. CI orders the two steps in one job
  // (workflows.test.mjs); here, the files' own times are what order them,
  // and guards run before the gate are refused as another run's.
  test('refuse the guards’ results when they started before the validator gate finished', () => {
    const root = validatorJob()
    put(root, 'test-results/vitest.json', vitest(root, 'scripts/validator/registers.test.mjs', { start: T0 + 42 * 60_000 }))
    const result = collect({ root, local: true, since: at(-1), ...machine, env: {} })
    expect(result.missing).toEqual([
      `another run's: test-results/vitest.json, the guards', started ${at(42)}, before test-results/validator.json, the validator gate's, finished ${at(43)}, so the registers' cases that read the gate's file read an earlier one: run the guards after the gate`,
    ])
    expect(result.suites.map((suite) => suite.path)).toEqual(['packages/health-core'])
    // Guards that started once the gate had finished are this run's.
    put(root, 'test-results/vitest.json', vitest(root, 'scripts/validator/registers.test.mjs', { start: T0 + 43 * 60_000 }))
    expect(collect({ root, local: true, since: at(-1), ...machine, env: {} }).missing).toEqual([])
  })

  // Every package with a suite is expected, so a suite not run is named;
  // the root's vitest.json is the guards', since on one machine the guards
  // run the registers' every case once the gate has run there.
  test('expect every package with a suite, the repository’s guards, the install gate and the validator gate', () => {
    const result = collect({ root: workspace(), local: true, since: at(-1), ...machine, env: {} })
    expect(result.suites.map((suite) => suite.path)).toEqual(['packages/health-core', '.'])
    expect(result.absent).toEqual([
      { reader: 'test', file: 'packages/health-corpus/test-results/vitest.json' },
      { reader: 'validator', file: 'test-results/validator.json' },
    ])
    const ran = collect({ root: validatorJob(), local: true, since: at(-1), ...machine, env: {} })
    expect(ran.validator).toMatchObject({ gate: { passed: true }, suite: null })
    expect(ran.suites.at(-1).files[0].file).toBe('scripts/validator/registers.test.mjs')
  })

  // A local report may allow verify, install or validator missing, as its
  // banner says; it can only tell which file is whose when each is filed
  // under the reader that expected it. A file of an allowed reader that is
  // there but stale is still refused.
  test('file each file not found under the reader that expected it, and refuse a stale one however it is allowed', () => {
    const root = workspace()
    for (const file of ['test-results/vitest.json', 'test-results/install.json']) rmSync(join(root, file))
    const result = collect({ root, local: true, since: at(-1), ...machine, env: {} })
    expect(result.absent).toEqual([
      { reader: 'test', file: 'packages/health-corpus/test-results/vitest.json' },
      { reader: 'verify', file: 'test-results/vitest.json' },
      { reader: 'install', file: 'test-results/install.json' },
      { reader: 'validator', file: 'test-results/validator.json' },
    ])
    expect(result.missing).toEqual([])
  })

  // A fresh vitest.json beside yesterday's turbo summary and coverage would
  // print yesterday's wall time and coverage as this run's: every file a
  // suite's row is built from is held to --since, not only the first.
  test('refuse a turbo summary or a coverage summary from before --since, and say so', () => {
    const root = workspace()
    const yesterday = T0 - 86_400_000
    put(root, '.turbo/runs/one.json', { execution: { startTime: yesterday }, tasks: [{ taskId: '@formancy/health-core#test:coverage', execution: { startTime: yesterday, endTime: yesterday + 600_000 }, cache: { status: 'MISS' } }] })
    utimesSync(join(root, 'packages/health-core/coverage/coverage-summary.json'), new Date(yesterday), new Date(yesterday))
    const result = collect({ root, local: true, since: at(-1), ...machine, env: {} })
    expect(result.suites.filter((suite) => suite.path === 'packages/health-core').map((suite) => [suite.task, suite.coverage])).toEqual([[null, null]])
    expect(result.missing).toEqual(
      expect.arrayContaining([
        `stale: turbo's run summary for @formancy/health-core#test:coverage started ${new Date(yesterday).toISOString()}, before --since`,
        `stale: packages/health-core/coverage/coverage-summary.json written ${new Date(yesterday).toISOString()}, before --since`,
      ]),
    )
  })

  // A local run tests whatever the tree holds, committed or not; naming
  // HEAD alone would name code that did not run.
  test('record whether the tree had uncommitted changes', () => {
    const git = (status) => (args) => (args[0] === 'status' ? status : 'abc123\n')
    expect(collect({ root: workspace(), local: true, since: at(-1), ...machine, env: {}, git: git(' M README.md\n') })).toMatchObject({ commit: 'abc123', dirty: true })
    expect(collect({ root: workspace(), local: true, since: at(-1), ...machine, env: {}, git: git('') })).toMatchObject({ commit: 'abc123', dirty: false })
  })

  // Without a time, local mode would have no way to tell a stale file from a fresh one.
  test('need --since', () => {
    expect(() => collect({ root: workspace(), local: true, ...machine })).toThrow(/needs --since/)
  })
})

describe('the command line', () => {
  // `--out` names where the results go. Joined to the checkout rather than
  // resolved against it, an absolute directory would become a directory of
  // that name inside the checkout, a stray tree no ignore rule covers. Run
  // as the jobs run it, on this checkout; the install job reads a file a run
  // may or may not have left, so it writes either way.
  test('writes into an absolute --out, and names the file it wrote', () => {
    const repo = join(dirname(fileURLToPath(import.meta.url)), '..', '..')
    const out = mkdtempSync(join(tmpdir(), 'formancy-health-collect-out-'))
    roots.push(out)
    // A step's outputs are the workflow's; this run is not a step of one.
    const { GITHUB_OUTPUT: _, ...env } = process.env
    const printed = execFileSync(process.execPath, [join(repo, 'scripts', 'release-report', 'collect.mjs'), '--job', 'install', '--out', out], { cwd: repo, encoding: 'utf8', env })
    expect(existsSync(join(out, 'install.json'))).toBe(true)
    expect(existsSync(join(repo, out))).toBe(false)
    expect(printed.startsWith(`${relative(repo, join(out, 'install.json')).replaceAll('\\', '/')}: `)).toBe(true)
  })
})
