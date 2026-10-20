// The report's results (0011; formancy.ai-report 0014): each package's
// suite, the repository's guards, each app's browser gate in each browser
// (the demo's, 0012) and its README pictures' check (0016), the validator
// gate and its job's run of the registers' test, the install gate, and the
// build identity of every published package.
//
// Pure over the run's results. Two times are shown for a suite, each named
// for what it is: the task's wall time from turbo's run summary, and
// vitest's span from the first test's start to the last test's end, which
// leaves out collection, hooks and teardown.
//
// One thing is Health's own. `pnpm test:repo` in `verify` has neither the
// validator's downloads nor its run, so the registers' cases that read them
// skip there (0005), and the `validator` job runs the same file again after
// the gate, where none of them may. A test skipped in one suite is accounted
// for by its pass in the validator job's run, test by test -- never by the
// file's name alone -- and by nothing else; on a machine that did not run
// the validator, a report that allows it missing says so in its banner and
// counts the skips of the files the validator job runs as allowed. Any other
// skip is a test that did not run.
//
// The install gate's record, the browser gates' and the pictures' checks'
// files and the validator's two files are read only from the job that leaves them, or on a machine from its one results file
// (LEAVES); found in another job's results, each is a problem and is not
// read, so a collect that filed one under the wrong job cannot pass it off
// as that job's.

const distinct = (values) => [...new Set(values)]

/** A test's status, as the report counts it: anything but passed or failed is skipped, as vitest's pending and todo are. */
const kind = (status) => (status === 'passed' || status === 'failed' ? status : status === 'todo' ? 'todo' : 'skipped')

/**
 * Which results file may hold each section, by its `job`: the job of
 * gates.yml that leaves it, or `local`, a machine's one file. What it is
 * called in a sentence when another job's results hold it.
 */
const LEAVES = {
  install: { jobs: ['install', 'local'], held: (result) => result.install != null, what: 'the install gate’s record, which only the install job leaves' },
  browser: { jobs: ['browser', 'local'], held: (result) => (result.browserGates ?? []).length > 0, what: 'a browser gate’s results, which only the browser job leaves' },
  pictures: { jobs: ['browser', 'local'], held: (result) => (result.pictures ?? []).length > 0, what: 'a pictures’ check’s results, which only the browser job leaves' },
  gate: { jobs: ['validator', 'local'], held: (result) => result.validator?.gate != null, what: 'the validator gate’s file, which only the validator job leaves' },
  registers: { jobs: ['validator', 'local'], held: (result) => result.validator?.suite != null, what: 'the validator job’s run of the registers’ test, which only the validator job leaves' },
}

/** The results that may hold `section`, a key of LEAVES. */
const leaving = (results, section) => results.filter((result) => LEAVES[section].jobs.includes(result.job))

/** Each section found in a results file of a job that does not leave it, as a sentence naming that file's key. */
export const misplacedSections = (results) =>
  Object.values(LEAVES).flatMap(({ jobs, held, what }) => results.filter((result) => !jobs.includes(result.job) && held(result)).map((result) => `${result.key}: its results hold ${what}`))

/**
 * How a test that did not run in a suite is accounted for: `validator` when
 * the validator job's run of its file passed it, `allowed` when the
 * validator is allowed missing on a machine and `allowedFiles` -- the files
 * the validator job runs, from gates.yml -- holds its file, undefined
 * otherwise. The one place a skip is excused.
 */
export function accountsOf(results, allowedFiles = []) {
  const passed = new Set(
    leaving(results, 'registers').flatMap((result) => (result.validator?.suite?.files ?? []).flatMap((file) => file.tests.filter((test) => test.status === 'passed').map((test) => `${file.file} › ${test.name}`))),
  )
  return (file, name) => (passed.has(`${file} › ${name}`) ? 'validator' : allowedFiles.includes(file) ? 'allowed' : undefined)
}

/**
 * One row per package with a `test:coverage` script, for the repository's
 * guards, or for the validator job's run of the registers' test. A row is
 * held to the test files the checkout holds for it unless `checkout` is
 * false: the validator job runs the files its step names, and no others.
 */
function suiteRow(suites, { name, path, published }, { accounted = () => undefined, checkout = true } = {}) {
  if (suites.length === 0) return { package: name, path, published, present: false }
  const files = suites.flatMap((suite) => suite.files)
  const tests = files.flatMap((file) => file.tests.map((test) => ({ ...test, file: file.file })))
  const count = (wanted) => tests.filter((test) => kind(test.status) === wanted).length
  // Only a skip is accounted for: a failed test is a failure wherever else it passed.
  const elsewhere = (test) => (kind(test.status) === 'skipped' ? accounted(test.file, test.name) : undefined)
  const tasks = suites.map((suite) => suite.task).filter((task) => task != null && task.endTime != null)
  const starts = files.map((file) => file.startTime).filter(Number.isFinite)
  const ends = files.map((file) => file.endTime).filter(Number.isFinite)
  const coverage = suites.find((suite) => suite.coverage != null)?.coverage ?? null
  const pct = (metric) => (coverage?.[metric]?.pct === undefined ? null : coverage[metric].pct)
  const ran = new Set(files.map((file) => file.file))
  return {
    package: name,
    path,
    published,
    present: true,
    jobs: distinct(suites.map((suite) => suite.job)),
    files: files.length,
    tests: tests.length,
    passed: count('passed'),
    failed: count('failed'),
    skipped: count('skipped'),
    todo: count('todo'),
    // Skips the validator job's run passed, and skips allowed on a machine
    // that did not run the validator, which the banner names.
    ranInValidator: tests.filter((test) => elsewhere(test) === 'validator').length,
    allowed: tests.filter((test) => elsewhere(test) === 'allowed').length,
    notPassed: tests.filter((test) => test.status !== 'passed' && elsewhere(test) === undefined).map((test) => ({ file: test.file, name: test.name, status: test.status })),
    failedFiles: files.filter((file) => file.status === 'failed').map((file) => ({ file: file.file, testsPassed: file.tests.every((test) => test.status === 'passed') })),
    // Whether every results file listed the test files the checkout holds,
    // and those its suite did not run: the include's misses, or a subset run.
    listsTestFiles: !checkout || suites.every((suite) => Array.isArray(suite.testFiles)),
    notRun: checkout
      ? distinct(suites.flatMap((suite) => suite.testFiles ?? []))
          .filter((file) => !ran.has(file))
          .sort()
      : [],
    success: suites.every((suite) => suite.success === true),
    numFailedTestSuites: suites.reduce((total, suite) => total + (suite.numFailedTestSuites ?? 0), 0),
    wallMs: tasks.length === 0 ? null : tasks.reduce((total, task) => total + (task.endTime - task.startTime), 0),
    spanMs: starts.length === 0 || ends.length === 0 ? null : Math.max(...ends) - Math.min(...starts),
    coverage: coverage === null ? null : { lines: pct('lines'), branches: pct('branches'), functions: pct('functions'), statements: pct('statements') },
  }
}

/** The suites of the run, each with the key of the results file it came in. */
const suitesOf = (results) => results.flatMap((result) => (result.suites ?? []).map((suite) => ({ ...suite, job: result.key })))

/** The validator job's runs of the registers' test, each with its key. */
const validatorSuitesOf = (results) => leaving(results, 'registers').flatMap((result) => (result.validator?.suite == null ? [] : [{ ...result.validator.suite, job: result.key }]))

/** The install gate's record in the run, from the job that leaves it: the first such file that holds one, or null. */
export const installOf = (results) => leaving(results, 'install').map((result) => result.install).find((entry) => entry != null) ?? null

/** Every browser gate's file in the run, from the job that leaves them, each with the key it came in. */
export const browserGatesOf = (results) => leaving(results, 'browser').flatMap((result) => (result.browserGates ?? []).map((gate) => ({ gate, job: result.key })))

/** Every pictures' check's file in the run, from the job that leaves them, each with the key it came in. */
export const picturesOf = (results) => leaving(results, 'pictures').flatMap((result) => (result.pictures ?? []).map((check) => ({ check, job: result.key })))

/** The validator gate's own results file in the run, from the job that leaves it, with the key it came in: the first such file that holds one, or null. */
export function validatorOf(results) {
  const found = leaving(results, 'gate').find((result) => result.validator?.gate != null)
  return found === undefined ? null : { gate: found.validator.gate, job: found.key }
}

const wall = (entry) => Date.parse(entry.finishedAt) - Date.parse(entry.startedAt)

/** One browser gate's run in one browser, as the report shows and judges it. */
function gateRow(gate, job) {
  return {
    gate: gate.gate,
    asked: gate.asked ?? null,
    job,
    ok: gate.checks?.ok ?? 0,
    failed: gate.checks?.failed ?? [],
    error: gate.error ?? null,
    widths: gate.widths ?? [],
    planned: gate.planned ?? [],
    passes: gate.passes ?? 0,
    made: (gate.made ?? []).map((entry) => ({ label: entry.label, width: entry.width, checks: entry.checks ?? [] })),
    browser: gate.browser ?? null,
    playwright: gate.playwright ?? null,
    axe: gate.axe ?? null,
    wallMs: wall(gate),
  }
}

/**
 * One app's README pictures' check (0016), as the report shows and judges
 * it: `planned` is every scene scripts/pictures/scenes.json gives the app,
 * which the report reads itself rather than take the check's word for.
 */
function picturesRow({ check, job }, planned) {
  return {
    app: check.app,
    job,
    planned: [...planned],
    walked: check.walked ?? [],
    problems: check.problems ?? [],
    error: check.error ?? null,
    browser: check.browser ?? null,
    playwright: check.playwright ?? null,
    wallMs: wall(check),
  }
}

/** The scenes of scenes.json a pictures' check was to walk and did not: each a picture held by nobody in this run. */
export const unwalked = (row) => row.planned.filter((id) => !row.walked.includes(id))

/**
 * What a browser gate's row says it did not do, which a gate that measured
 * everything it set out to does: make a check, make one in a pass at a
 * viewport width, make every pass it planned, and make a check in each pass
 * it made. The gate walks one journey at every width, so a planned pass not
 * made, or made with nothing checked in it, is every check of that width
 * skipped. Each a phrase; none for a gate that did all four. What the gate
 * planned is its own word: its passes come from the app's stylesheets and
 * languages, read by the app's gate, and only it can say them.
 */
export function unmeasured(row) {
  const made = new Set(row.made.map((entry) => entry.label))
  const skipped = row.planned.filter((label) => !made.has(label))
  const empty = row.made.filter((entry) => entry.width !== null && entry.checks.length === 0).map((entry) => `"${String(entry.label)}"`)
  return [
    ...(row.ok + row.failed.length === 0 ? ['made no check'] : []),
    ...(row.passes === 0 ? ['made no pass at a viewport width'] : []),
    ...(row.planned.length === 0 ? ['planned no pass'] : []),
    ...(skipped.length === 0 ? [] : [`did not make ${String(skipped.length)} of the ${String(row.planned.length)} passes it planned: ${skipped.map((label) => `"${label}"`).join(', ')}`]),
    ...(empty.length === 0 ? [] : [`made no check in ${empty.length === 1 ? 'the pass' : 'the passes'} ${empty.join(', ')}`]),
  ]
}

const sortedText = (values) => [...new Set(values)].sort().join('; ')

/**
 * What a row's own record says of it, as words to put beside its file, or
 * undefined when it says what "as expected" says: its refusals are its
 * errors and its warnings no register names (judge.mjs's `refusals`); an
 * accepted resource is refused for nothing; a broken one is refused for
 * exactly the issues the corpus expects of it, each once (judge.mjs
 * compares them as sets).
 */
function rowSays(row) {
  const count = (field) => (Number.isInteger(row[field]) ? row[field] : 0)
  const refusals = Array.isArray(row.refusals) ? row.refusals : []
  const unregistered = count('warnings') - (Array.isArray(row.registeredWarnings) ? row.registeredWarnings.length : 0)
  if (refusals.length !== count('errors') + unregistered) return `it counts ${String(count('errors'))} error(s) and ${String(unregistered)} unregistered warning(s) beside ${String(refusals.length)} refusal(s)`
  if (row.expect === 'accepted') return refusals.length === 0 ? undefined : `refused: ${sortedText(refusals)}`
  const expected = Array.isArray(row.expect) ? row.expect : []
  return refusals.length > 0 && sortedText(refusals) === sortedText(expected) ? undefined : `refused for ${sortedText(refusals) || 'nothing'}, where the corpus expects ${sortedText(expected) || 'nothing'}`
}

/** A row judged otherwise than the corpus expects, by the gate's verdict or by its own record; undefined when neither says so. */
function notAsExpected(row) {
  if (row.verdict !== 'as expected') return `${String(row.file)} (${String(row.verdict)})`
  const said = rowSays(row)
  return said === undefined ? undefined : `${String(row.file)} (marked as expected, and ${said})`
}

/**
 * The validator gate as the report shows and judges it, read from the file
 * scripts/validator.mjs writes however it ends: whether it passed and what
 * it said, the validator it ran and the one it was meant to, how it ran,
 * what it loaded against what it was given, and each resource's verdict --
 * the gate's, and judged again from the row's own record, never from its
 * `passed` alone.
 */
function validatorRow({ gate, job }) {
  const rows = Array.isArray(gate.resources) ? gate.resources : []
  const total = (field) => rows.reduce((sum, row) => sum + (Number.isInteger(row[field]) ? row[field] : 0), 0)
  return {
    job,
    passed: gate.passed === true,
    problems: Array.isArray(gate.problems) ? gate.problems : [],
    version: gate.validator?.version ?? null,
    sha256: gate.validator?.sha256 ?? null,
    reported: gate.validator?.reported ?? null,
    java: gate.validator?.java ?? null,
    offline: gate.offline ?? null,
    registered: gate.packages?.registered ?? [],
    loaded: gate.packages?.loaded ?? null,
    resources: rows.length,
    accepted: rows.filter((row) => row.expect === 'accepted').length,
    broken: rows.filter((row) => row.expect !== 'accepted').length,
    notAsExpected: rows.map(notAsExpected).filter((said) => said !== undefined),
    issues: { errors: total('errors'), warnings: total('warnings'), information: total('information') },
    registeredWarnings: distinct(rows.flatMap((row) => row.registeredWarnings ?? [])).sort(),
    seconds: gate.seconds ?? null,
    wallMs: gate.startedAt === undefined || gate.finishedAt === undefined ? null : wall(gate),
  }
}

/**
 * One project of the install gate, from its entry in install.json: what it
 * checked, what it installed beside the tarballs, the guide's blocks it was
 * given, what it did not finish -- npm's install, or each step not done --
 * and what its last step said once every step passed.
 */
function projectOf(consumer) {
  const steps = Array.isArray(consumer.steps) ? consumer.steps : []
  const unfinished = consumer.npmInstalled === true ? steps.filter((step) => step.done !== true).map((step) => String(step.step)) : ['npm install']
  const blocks = Array.isArray(consumer.guide?.blocks) ? consumer.guide.blocks.length : 0
  return {
    project: consumer.project ?? null,
    consumer: consumer.consumer ?? null,
    installed: consumer.installed ?? {},
    steps: steps.map((step) => String(step.step)),
    guide: consumer.guide == null ? null : { kind: consumer.guide.kind ?? null, blocks },
    unfinished,
    passed: unfinished.length === 0,
    said: unfinished.length === 0 && steps.length > 0 ? (steps.at(-1).said ?? null) : null,
  }
}

/**
 * Every package's row, the repository's guards, the browser gates, the
 * pictures' checks -- each held to `scenes`, scenes.json's scene ids by app
 * path -- the validator gate and its job's run of the registers' test, the
 * install gate with each of its projects, what collect did not find
 * (`absent`, by the reader that expected it) or found and refused
 * (`missing`), a section in a job that does not leave it (`misplaced`), and
 * build identity. `accounted` is accountsOf()'s.
 */
export function resultsInRun({ results, covered, published, accounted = accountsOf(results), scenes = {} }) {
  const suites = suitesOf(results)
  const install = installOf(results)
  const validator = validatorOf(results)
  return {
    packages: covered.map((entry) => suiteRow(suites.filter((suite) => suite.package === entry.name), { ...entry, published: published.includes(entry.name) }, { accounted })),
    repository: suiteRow(suites.filter((suite) => suite.package === null), { name: null, path: '.', published: false }, { accounted }),
    browserGates: browserGatesOf(results).map(({ gate, job }) => gateRow(gate, job)),
    pictures: picturesOf(results).map((found) => picturesRow(found, scenes[found.check.app] ?? [])),
    validator: {
      gate: validator === null ? null : validatorRow(validator),
      suite: suiteRow(validatorSuitesOf(results), { name: null, path: '.', published: false }, { checkout: false }),
    },
    install:
      install === null
        ? null
        : {
            passed: install.passed === true,
            error: install.error ?? null,
            node: install.node ?? null,
            npm: install.npm ?? null,
            tarballs: install.tarballs ?? [],
            projects: (install.consumers ?? []).map(projectOf),
            startedAt: install.startedAt ?? null,
          },
    absent: results.flatMap((result) => (result.absent ?? []).map(({ reader, file }) => ({ job: result.key, reader, file }))),
    missing: results.flatMap((result) => (result.missing ?? []).map((what) => ({ job: result.key, what }))),
    misplaced: misplacedSections(results),
    buildIdentity: published.map((name) => {
      const builds = results.flatMap((result) => (result.dist ?? []).filter((entry) => entry.package === name).map((entry) => ({ job: result.key, distHash: entry.distHash })))
      const tarball = (install?.tarballs ?? []).find((entry) => entry.name === name) ?? null
      const hashes = distinct([...builds.map((build) => build.distHash), ...(tarball === null ? [] : [tarball.distHash])])
      return { package: name, tarball: tarball === null ? null : { file: tarball.file, sha256: tarball.sha256, distHash: tarball.distHash }, builds, identical: hashes.length <= 1 }
    }),
  }
}

/**
 * What the run says of one test file: `passed` when it appears with at least
 * one test, the file passed and every test passed or was skipped and is
 * accounted for (accountsOf); `absent` when it does not appear; `failed`
 * otherwise. How a gate's file evidence and a limitation's `heldBy` are
 * judged, so that registers.test.mjs, whose validator-only cases skip in
 * `verify`, passes only where the validator job passed them.
 */
export function fileOutcome(results, file, accounted = accountsOf(results)) {
  const found = [...suitesOf(results), ...validatorSuitesOf(results)].flatMap((suite) => suite.files.filter((entry) => entry.file === file))
  if (found.length === 0) return 'absent'
  const held = (test) => test.status === 'passed' || (kind(test.status) === 'skipped' && accounted(file, test.name) !== undefined)
  const passed = found.every((entry) => entry.status === 'passed' && entry.tests.length > 0 && entry.tests.every(held))
  return passed ? 'passed' : 'failed'
}

/**
 * A test file, by its name, as vitest's default include names one. Not any
 * suite's own include, which is what this is held against: a file this
 * names that its suite did not run is a problem of the run, whether the
 * include missed it or the run was a subset.
 */
export const TEST_FILE = /\.(?:test|spec)\.[cm]?[jt]sx?$/

/** The suite that runs `file`: the path of the package with a suite it is in (`covered` holds their paths), or '.', the repository's guards. */
export const suiteOwning = (file, covered) => covered.find((path) => file.startsWith(`${path}/`)) ?? '.'

/** The test files among `files` -- repository paths, as git lists them -- that the suite at `path` must run, sorted. */
export const testFilesOf = (files, path, covered) => files.filter((file) => TEST_FILE.test(file) && suiteOwning(file, covered) === path).sort()

/**
 * Whether `file` is a test a run can report on: a test file of a package
 * with a suite, or of the repository's guards, which live in `scripts/`
 * (vitest.repo.config.mts), and a file this checkout has (`exists`). What a
 * gate's file evidence and a limitation's `heldBy` may name. That its
 * suite's include matches it is held by every run, which fails on a test
 * file its suite did not run.
 */
export const isRunTest = (file, { covered, exists }) => TEST_FILE.test(file) && (suiteOwning(file, covered) !== '.' || file.startsWith('scripts/')) && exists(file)
