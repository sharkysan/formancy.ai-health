// What one job of a run found, in one file the release report reads (0011;
// formancy.ai-report 0014's collect, without its browser gate and its
// pictures, which Health does not have, and with a reader for the
// validator job, which Report does not; the install gate's projects come
// whole in its record, which the report holds to install-hosts.mjs).
//
//   node scripts/release-report/collect.mjs --job verify
//   node scripts/release-report/collect.mjs --job test --package @formancy/health-core
//   node scripts/release-report/collect.mjs --job install
//   node scripts/release-report/collect.mjs --job validator
//   node scripts/release-report/collect.mjs --local --since 2026-10-17T08:00:00Z
//
// It writes `release-results/<key>.json` and, on GitHub, `key=<key>` to the
// step's outputs, so the artefact's name and the file's key have one source.
// The key is the job, `test-<id>` for a package's suite with the id
// codecov-config.mjs gives it, and the job with `--variant` appended for a
// job a matrix runs more than once.
//
// What it reads, each where its writer puts it: the repository guards'
// `test-results/vitest.json` in `verify`; a package's
// `test-results/vitest.json` and `coverage/coverage-summary.json`, and
// turbo's `.turbo/runs/*.json` for the task's own start and end, in `test`;
// the install gate's `test-results/install.json` in `install`; in
// `validator`, the gate's `test-results/validator.json` (scripts/validator.mjs
// writes it however it ends) and the root `test-results/vitest.json` the
// job's run of the registers' test leaves; and in every job, every published
// package's `dist/` that job built. Beside each package's suite and the
// guards' it lists the test files the checkout holds for it (`git ls-files`),
// so the report can name one the suite did not run. A file it expected and
// did not find it lists under `absent`, with the reader that expected it --
// verify, test, install or validator -- so a local report can allow that
// reader missing, as its banner says; what it found and could not use -- a
// file from before --since, one that records no start, another run's, a
// suite turbo replayed or ran without a summary -- under `missing`. The
// report fails on `absent` unless, on a machine, it allows that reader
// missing, and on `missing` always.
//
// Those four jobs are what gates.yml runs. A job it gains gets a reader in
// READERS and a section in the report; until then collect refuses it, so the
// job fails rather than uploading results that look like a job with nothing
// to say.
//
// `--local` reads every package of one machine at once, the guards, the
// install gate and the validator gate. Not the registers' run: on one
// machine the root vitest.json is the guards', and the guards run every
// case of registers.test.mjs when VALIDATOR_GATE_RAN says the gate ran
// there (RELEASING.md), so it refuses guards that started before the gate's
// file says the gate finished. It refuses a results file that started
// before `--since`, which has no default: a file left by an earlier run read
// as this one's is the failure local mode has to rule out, and only the
// person running it knows from when.
//
// Node's built-ins and the repository's own scripts only: every job collects
// what it found even when its install failed.

import { execFileSync } from 'node:child_process'
import { appendFileSync, existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { dirname, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { coveredPackages } from '../codecov-config.mjs'
import { distHash, filesUnder } from '../release/dist-hash.mjs'
import { testFilesOf } from './results.mjs'

const repo = join(dirname(fileURLToPath(import.meta.url)), '..', '..')

const readJson = (file) => JSON.parse(readFileSync(file, 'utf8'))
const slash = (path) => path.replaceAll('\\', '/')
const time = (value) => (typeof value === 'number' ? value : Date.parse(value))

/** A matrix value safe in an artefact's name. */
const safe = (value) => String(value).replaceAll(/[^A-Za-z0-9.]+/g, '-')

/** The validator gate's results file, scripts/validator.mjs's RESULTS. */
export const VALIDATOR_RESULTS = 'test-results/validator.json'

/** The key of a job's results: the artefact is `release-results-<key>`. */
export function keyFor({ job, pkg, variant }, covered) {
  let key = job
  if (job === 'test') {
    const entry = covered.find((candidate) => candidate.name === pkg)
    if (entry === undefined) throw new Error(`--package ${String(pkg)} is no workspace package with a test:coverage script`)
    key = `test-${entry.id}`
  }
  return variant === undefined ? key : `${key}-${safe(variant)}`
}

/** coveredPackages() with each package's npm name: what keyFor() keys a package's results by. */
export function namedPackages(root = repo) {
  return coveredPackages(root).map((entry) => ({ ...entry, name: readJson(join(root, entry.path, 'package.json')).name }))
}

/** Every published package -- under packages/, not private -- with its directory and manifest. */
function publishedPackages(root) {
  const folder = join(root, 'packages')
  if (!existsSync(folder)) return []
  return readdirSync(folder)
    .sort()
    .filter((name) => existsSync(join(folder, name, 'package.json')))
    .map((name) => ({ dir: join(folder, name), manifest: readJson(join(folder, name, 'package.json')) }))
    .filter(({ manifest }) => manifest.private !== true)
}

/** A suite's vitest JSON, normalised: totals, and each file with each test's status and duration. A test's `meta` is left out: nothing reads it. */
export function normaliseSuite(json, root) {
  return {
    success: json.success,
    numTotalTests: json.numTotalTests,
    numPassedTests: json.numPassedTests,
    numFailedTests: json.numFailedTests,
    numPendingTests: json.numPendingTests,
    numTodoTests: json.numTodoTests,
    numFailedTestSuites: json.numFailedTestSuites,
    startTime: json.startTime,
    files: json.testResults.map((file) => ({
      file: slash(relative(root, file.name)),
      status: file.status,
      startTime: file.startTime,
      endTime: file.endTime,
      tests: file.assertionResults.map((test) => ({ name: test.fullName, status: test.status, durationMs: test.duration ?? null })),
    })),
  }
}

/** The newest turbo run summary's entry for `taskId`: its own start and end, and whether turbo replayed it. */
function turboTask(root, taskId) {
  const folder = join(root, '.turbo', 'runs')
  if (!existsSync(folder)) return undefined
  const runs = readdirSync(folder)
    .filter((name) => name.endsWith('.json'))
    .map((name) => readJson(join(folder, name)))
    .sort((a, b) => (a.execution?.startTime ?? 0) - (b.execution?.startTime ?? 0))
  for (const run of runs.reverse()) {
    const task = run.tasks?.find((candidate) => candidate.taskId === taskId)
    if (task !== undefined) return { startTime: task.execution?.startTime ?? null, endTime: task.execution?.endTime ?? null, cache: task.cache?.status ?? null }
  }
  return undefined
}

/**
 * Every file the checkout holds -- committed, or new and not ignored, which
 * a local run tests as much as a committed one -- and that is on disk, as
 * git lists them: what a suite's test files are found among.
 */
function checkoutFiles(root, git) {
  return git(['ls-files', '-z', '--cached', '--others', '--exclude-standard'])
    .split('\0')
    .filter((file) => file !== '' && existsSync(join(root, file)))
}

/** Which machine a result file comes from: Node, the platform, and on GitHub the runner image. */
const runner = (env) => ({ node: process.version, platform: process.platform, arch: process.arch, image: env.ImageOS ?? null, imageVersion: env.ImageVersion ?? null })

/**
 * The readers, by job: what each job of gates.yml leaves for the report.
 * `read` reads one suite, the install gate's record or the validator's
 * files into the result.
 */
const READERS = {
  verify: (read) => read.suite('.', null),
  test: (read, { pkg, packages }) => read.suite(packages.find((entry) => entry.name === pkg).path, pkg),
  install: (read) => read.install(),
  validator: (read) => {
    read.validator()
    read.registersRun()
  },
}

/**
 * Everything one job (or, locally, one machine) found. Pure over the files
 * under `root`, the `git` it is given, `env` and `now`.
 */
export function collect({ root = repo, job, pkg, variant, local = false, since, env = process.env, git = defaultGit, now = () => new Date() }) {
  if (!local && READERS[job] === undefined) {
    throw new Error(`collect.mjs reads the ${Object.keys(READERS).join(', ').replace(/, (?=[^,]*$)/, ' and ')} jobs, and has no reader for ${String(job)}: a job the report expects results from needs one here`)
  }
  const packages = namedPackages(root)
  const key = local ? 'local' : keyFor({ job, pkg, variant }, packages)
  const missing = []
  const absent = []
  /** `file`, which `reader` expected, is not there. */
  const notFound = (file, reader) => void absent.push({ reader, file })
  const after = local ? time(since) : Number.NEGATIVE_INFINITY
  if (local && Number.isNaN(after)) throw new Error('--local needs --since <ISO instant>: results older than it are refused as stale, and nothing else can say from when')
  const iso = (value) => new Date(time(value)).toISOString()
  // A file that records no start cannot be told from yesterday's, in CI as
  // on a machine: refused, never read as this run's.
  const fresh = (path, started, verb = 'started') => {
    if (!Number.isFinite(time(started))) {
      missing.push(`${path} records no start, so which run wrote it is unknown`)
      return false
    }
    if (time(started) >= after) return true
    missing.push(`stale: ${path} ${verb} ${iso(started)}, before --since`)
    return false
  }

  // What the checkout holds, asked of git once and only by a job with a suite.
  let held
  const checkout = () => (held ??= checkoutFiles(root, git))

  const suites = []
  let install = null
  let validator = null
  const read = {
    suite(path, name) {
      const shown = slash(join(path, 'test-results', 'vitest.json'))
      // The guards' suite is verify's, a package's its test job's.
      if (!existsSync(join(root, shown))) return notFound(shown, name === null ? 'verify' : 'test')
      const json = readJson(join(root, shown))
      if (!fresh(shown, json.startTime)) return
      // The suite's wall time and coverage come from two more files, each
      // held to --since as vitest's is, and to vitest's own run: a
      // vitest.json of one file run this morning beside the summary of the
      // whole suite run last night would print last night's numbers as this
      // run's.
      const summary = slash(join(path, 'coverage', 'coverage-summary.json'))
      const turbo = `turbo's run summary for ${name}#test:coverage`
      let task = name === null ? undefined : turboTask(root, `${name}#test:coverage`)
      if (task === undefined && name !== null && !local) missing.push(`${turbo} (run it with --summarize)`)
      if (task?.startTime != null && !fresh(turbo, task.startTime)) task = undefined
      if (task?.startTime != null && !(task.startTime <= time(json.startTime) && time(json.startTime) <= task.endTime)) {
        missing.push(`another run's: ${turbo} ran from ${iso(task.startTime)} to ${iso(task.endTime)}, which does not hold its vitest.json's start, ${iso(json.startTime)}`)
        task = undefined
      }
      if (task?.cache === 'HIT') missing.push(`a fresh run of ${name}#test:coverage: turbo replayed it from its cache`)
      let coverage = null
      const written = existsSync(join(root, summary)) ? statSync(join(root, summary)).mtimeMs : undefined
      if (written !== undefined && fresh(summary, written, 'written')) {
        if (written < time(json.startTime)) missing.push(`another run's: ${summary} written ${iso(written)}, before its vitest.json started, ${iso(json.startTime)}`)
        else coverage = readJson(join(root, summary)).total
      }
      const testFiles = testFilesOf(checkout(), path, packages.map((entry) => entry.path))
      suites.push({ package: name, path, ...normaliseSuite(json, root), testFiles, task: task ?? null, coverage })
    },
    install() {
      const shown = 'test-results/install.json'
      if (!existsSync(join(root, shown))) return notFound(shown, 'install')
      const result = readJson(join(root, shown))
      if (fresh(shown, result.startedAt)) install = result
    },
    /** The validator gate's own file, which says what it ran, loaded and judged. */
    validator() {
      if (!existsSync(join(root, VALIDATOR_RESULTS))) return notFound(VALIDATOR_RESULTS, 'validator')
      const result = readJson(join(root, VALIDATOR_RESULTS))
      if (fresh(VALIDATOR_RESULTS, result.startedAt)) validator = { gate: result, suite: null }
    },
    /**
     * The validator job's run of the registers' test, after the gate, where
     * none of its cases may skip: what accounts for each case `verify`
     * skipped. Held to no checkout's test files, since the job runs the
     * files its step names and no others.
     */
    registersRun() {
      const shown = 'test-results/vitest.json'
      if (!existsSync(join(root, shown))) return notFound(shown, 'validator')
      const json = readJson(join(root, shown))
      if (fresh(shown, json.startTime)) validator = { gate: validator?.gate ?? null, suite: normaliseSuite(json, root) }
    },
  }

  if (local) {
    for (const entry of packages) read.suite(entry.path, entry.name)
    read.suite('.', null)
    read.install()
    read.validator()
    // The guards run the registers' cases here, and one reads the gate's
    // file: guards that started before this gate finished read an earlier
    // gate's, passed against it, and are another run's. CI orders the two
    // steps in one job; on a machine the files' own times do.
    const guards = suites.findIndex((suite) => suite.package === null)
    if (validator?.gate != null && guards !== -1) {
      const finished = time(validator.gate.finishedAt)
      if (!(time(suites[guards].startTime) >= finished)) {
        const end = Number.isFinite(finished) ? `finished ${iso(finished)}` : 'records no end'
        missing.push(`another run's: test-results/vitest.json, the guards', started ${iso(suites[guards].startTime)}, before ${VALIDATOR_RESULTS}, the validator gate's, ${end}, so the registers' cases that read the gate's file read an earlier one: run the guards after the gate`)
        suites.splice(guards, 1)
      }
    }
  } else {
    READERS[job](read, { pkg, packages })
  }

  const dist = publishedPackages(root).flatMap(({ dir, manifest }) => {
    const files = filesUnder(join(dir, 'dist'))
    return files === undefined || files.size === 0 ? [] : [{ package: manifest.name, distHash: distHash(files) }]
  })

  return {
    schema: 1,
    job: local ? 'local' : job,
    key,
    ...(pkg === undefined ? {} : { package: pkg }),
    ...(variant === undefined ? {} : { variant }),
    runner: runner(env),
    commit: env.GITHUB_SHA ?? git(['rev-parse', 'HEAD']).trim(),
    run: { id: env.GITHUB_RUN_ID ?? null, attempt: env.GITHUB_RUN_ATTEMPT ?? null },
    collectedAt: now().toISOString(),
    // A local run tests the tree as it is, so whether it held uncommitted
    // changes is part of which code ran; a CI checkout is the commit.
    ...(local ? { since: new Date(after).toISOString(), dirty: git(['status', '--porcelain']).trim() !== '' } : {}),
    suites,
    install,
    validator,
    dist,
    tarballs: install?.tarballs ?? [],
    absent,
    missing,
  }
}

function defaultGit(args) {
  return execFileSync('git', args, { cwd: repo, encoding: 'utf8' })
}

/** The value after `--name`, or undefined. */
const option = (argv, name) => {
  const at = argv.indexOf(name)
  return at === -1 ? undefined : argv[at + 1]
}

// `node scripts/release-report/collect.mjs ...`
if (process.argv[1]?.replaceAll('\\', '/').endsWith('scripts/release-report/collect.mjs')) {
  const argv = process.argv.slice(2)
  const local = argv.includes('--local')
  const job = option(argv, '--job')
  if (!local && job === undefined) throw new Error('usage: collect.mjs --job <job> [--package <name>] [--variant <value>], or --local --since <ISO instant>')
  const result = collect({ job, pkg: option(argv, '--package'), variant: option(argv, '--variant'), local, since: option(argv, '--since') })
  const out = resolve(repo, option(argv, '--out') ?? 'release-results')
  const written = join(out, `${result.key}.json`)
  mkdirSync(out, { recursive: true })
  writeFileSync(written, `${JSON.stringify(result, null, 2)}\n`, 'utf8')
  if (process.env.GITHUB_OUTPUT !== undefined) appendFileSync(process.env.GITHUB_OUTPUT, `key=${result.key}\n`)
  const validator = result.validator === null ? 'no' : `the validator gate's${result.validator.suite === null ? '' : ' and its registers’ run'}`
  console.log(
    `${slash(relative(repo, written))}: ${String(result.suites.length)} suite(s), ${result.install === null ? 'no' : 'the'} install gate's record, ${validator} results, ${String(result.dist.length)} dist/${result.absent.length === 0 ? '' : `; not found: ${result.absent.map((entry) => entry.file).join('; ')}`}${result.missing.length === 0 ? '' : `; missing: ${result.missing.join('; ')}`}`,
  )
}
