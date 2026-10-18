// A whole green run, made by hand, for report.test.mjs and render.test.mjs:
// the inputs buildReport takes, as small as they can be and still hold every
// part of the report. Test support only, as formancy.ai-report's is. Each
// test copies it and introduces one defect, so a check is seen to fire on
// that defect and on nothing else.
//
// Pure logic over hand-made results; no validator is mocked, because none is
// involved -- what the report reads are files the suites, the install gate
// and the validator gate wrote.

const T0 = Date.parse('2026-10-17T10:00:00Z')

export const DIST = 'sha256:aaaa111122223333444455556666777788889999aaaabbbbccccddddeeeeffff'
/** The validator JAR's SHA-256, as the pin and the gate's file say it. */
export const JAR = 'e3'.repeat(32)
/** The registers' case `verify` skips and the validator job passes. */
export const VALIDATOR_ONLY = 'the package register › is every package in the cache, byte for byte'

const runner = { node: 'v22.20.0', platform: 'linux', arch: 'x64', image: 'ubuntu24', imageVersion: '20261012.1' }
const base = (key, job) => ({
  schema: 1,
  job,
  key,
  runner,
  commit: 'c0ffee',
  run: { id: '42', attempt: '1' },
  collectedAt: new Date(T0 + 3_600_000).toISOString(),
  suites: [],
  browserGates: [],
  install: null,
  validator: null,
  dist: [],
  tarballs: [],
  absent: [],
  missing: [],
})

const test = (name, status = 'passed') => ({ name, status, durationMs: 5 })
const file = (path, tests) => ({ file: path, status: 'passed', startTime: T0 + 1000, endTime: T0 + 2000, tests })
const suite = (name, path, files) => ({
  package: name,
  path,
  success: true,
  numTotalTests: files.reduce((total, entry) => total + entry.tests.length, 0),
  numFailedTestSuites: 0,
  startTime: T0,
  files,
  // Every test file the checkout holds for the suite: the ones it ran.
  testFiles: files.map((entry) => entry.file),
  task: { startTime: T0 - 5000, endTime: T0 + 9000, cache: 'MISS' },
  coverage: { lines: { pct: 91.2 }, branches: { pct: 80 }, functions: { pct: 95 }, statements: { pct: 90.1 } },
})

const PUBLISHED = ['@formancy/health-core', '@formancy/health-document', '@formancy/health-questionnaire']
/** Each job's own record of what it built: new objects every time, so a test that changes one job's changes no other's. */
const dist = (names = PUBLISHED) => names.map((name) => ({ package: name, distHash: DIST }))
/** A suite test job, which builds what its package depends on: health-core, here. */
const testJob = (id, name, path, files) => ({ ...base(`test-${id}`, 'test'), package: name, suites: [suite(name, path, files)], dist: dist(['@formancy/health-core']) })

/** The validator gate's file, as scripts/validator.mjs writes it on a run in which every resource was judged as the corpus expects. */
const gate = () => ({
  gate: 'validator',
  startedAt: new Date(T0 + 200_000).toISOString(),
  finishedAt: new Date(T0 + 380_000).toISOString(),
  validator: { version: '7.0.2', sha256: JAR, reported: '7.0.2', java: '17.0.4' },
  offline: { tx: 'n/a', txCache: 'n/a', httpAccess: false, consoleRefusals: 0 },
  packages: { registered: ['hl7.fhir.r4.core#4.0.1', 'hl7.fhir.uv.sdc#4.0.0'], loaded: ['hl7.fhir.uv.sdc#4.0.0', 'hl7.fhir.r4.core#4.0.1'] },
  resources: [
    { file: 'questionnaire-intake.json', expect: 'accepted', verdict: 'as expected', refusals: [], registeredWarnings: ['TERMINOLOGY_TX_WARNING'], errors: 0, warnings: 1, information: 2 },
    { file: 'questionnaire-intake-status.json', expect: ['error code:value at Questionnaire.status'], verdict: 'as expected', refusals: ['error code:value at Questionnaire.status'], registeredWarnings: [], errors: 1, warnings: 0, information: 0 },
  ],
  seconds: { validator: 24.3, total: 29.1 },
  problems: [],
  passed: true,
})

/** The validator job: the gate's file, and its run of the registers' test after the gate, where none of its cases skipped. */
const validatorJob = () => ({
  ...base('validator', 'validator'),
  validator: {
    gate: gate(),
    suite: { ...suite(null, '.', [file('scripts/validator/registers.test.mjs', [test('the validator pin › holds'), test(VALIDATOR_ONLY)])]), testFiles: undefined, task: null, coverage: null },
  },
  // The job builds the packages the corpus is written by.
  dist: dist(),
})

/**
 * The demo's browser gate's file, as gate-results.mjs writes it on a run
 * in which every check passed: two passes planned and made, each with its
 * checks, in the Chromium Playwright pins.
 */
const browserGate = () => ({
  gate: 'apps/demo',
  asked: 'chromium',
  startedAt: new Date(T0 + 100_000).toISOString(),
  finishedAt: new Date(T0 + 160_000).toISOString(),
  browser: { name: 'chromium', version: '156.0.8078.4', headless: true, platform: 'linux', arch: 'x64' },
  playwright: '1.64.1',
  axe: '4.14.0',
  widths: [320, 360],
  planned: ['reflow, 320, de-CH', 'phone, 360, fr'],
  passes: 2,
  made: [
    { label: 'reflow, 320, de-CH', width: 320, height: 900, checks: ['the first Tab reaches the skip link', 'start: no sideways scroll'], failed: [] },
    { label: 'phone, 360, fr', width: 360, height: 900, checks: ['the first Tab reaches the skip link', 'start: no sideways scroll'], failed: [] },
  ],
  checks: { ok: 4, failed: [] },
  measurements: [],
})

/** The browser job: the demo's gate, after turbo built what the demo imports. */
const browserJob = () => ({ ...base('browser', 'browser'), browserGates: [browserGate()], dist: dist() })

/** What a project of the install gate's records when every step passed: install-test.mjs's entry, `said` its runner's last line. */
const project = (name, { consumer, steps, installed = {}, resolved, guide = null, said = '' }) => ({
  project: name,
  consumer,
  npmInstalled: true,
  installed,
  tools: { '@types/node': '22.18.0', typescript: '6.0.3', tsx: '4.20.6' },
  resolved,
  guide,
  steps: steps.map((step, at) => ({ step, done: true, said: at === steps.length - 1 ? said : '' })),
})

/** What a project of the tarballs resolves of @formancy/*: the published packages, and what they bring. */
const theirs = () => [...PUBLISHED.map((name) => ({ name, version: '0.1.0' })), { name: '@formancy/spec', version: '0.5.0' }]

/** The install gate's two projects: the consumer's, the tarballs alone, and the guide's, beside what its section 1 installs. */
const projects = () => [
  project('node', { consumer: 'consume.ts', steps: ['type-check', 'run'], resolved: theirs() }),
  project('guide', {
    consumer: 'guide-node.ts',
    steps: ['type-check', 'guide: run'],
    installed: { '@formancy/spec': '0.5.0', '@formancy/report-spec': '0.1.0' },
    resolved: [...theirs(), { name: '@formancy/report-spec', version: '0.1.0' }],
    guide: { kind: 'node', files: ['referral.ts'], blocks: [51, 117] },
    said: 'ok: the guide’s program ran and printed the 2 lines the guide shows it printing',
  }),
]

/** The projects scripts/install-hosts.mjs plans, as report.mjs's installPlanOf reads them; report.test.mjs holds this to the real plan. */
export const INSTALL_PLAN = [
  { project: 'node', steps: ['type-check', 'run'], guide: null },
  { project: 'guide', steps: ['type-check', 'guide: run'], guide: 'node' },
]

/** The inputs of a run in which everything passed. */
export function greenRun() {
  const verify = {
    ...base('verify', 'verify'),
    suites: [
      suite(null, '.', [
        file('scripts/upstream-deps.test.mjs', [test('depends on upstream only at exact released versions')]),
        file('scripts/dependency-licences.test.mjs', [test('refuses fhirpath')]),
        file('scripts/trademark.test.mjs', [test('NOTICE carries HL7’s notice word for word')]),
        // verify has neither the downloads nor a run: its validator-only case skips, and the validator job passes it.
        file('scripts/validator/registers.test.mjs', [test('the validator pin › holds'), test(VALIDATOR_ONLY, 'skipped')]),
        file('scripts/validator/judge.test.mjs', [test('refuses a broken resource the gate accepted')]),
      ]),
    ],
    dist: dist(),
  }
  const core = testJob('health-core', '@formancy/health-core', 'packages/health-core', [
    file('packages/health-core/src/exactness.test.ts', [test('keeps 0.10 digit for digit')]),
    file('packages/health-core/src/numbers.test.ts', [test('refuses an integer past 32 bits')]),
  ])
  const questionnaire = testJob('health-questionnaire', '@formancy/health-questionnaire', 'packages/health-questionnaire', [file('packages/health-questionnaire/src/questionnaire.test.ts', [test('refuses an unknown spec version')])])
  const document = testJob('health-document', '@formancy/health-document', 'packages/health-document', [file('packages/health-document/src/bundle.test.ts', [test('refuses a dangling reference')])])
  const corpus = { ...testJob('health-corpus', '@formancy/health-corpus', 'packages/health-corpus', [file('packages/health-corpus/src/documents.test.ts', [test('attaches every byte Report rendered')])]), dist: [] }
  const install = {
    ...base('install', 'install'),
    install: {
      startedAt: new Date(T0).toISOString(),
      finishedAt: new Date(T0 + 120_000).toISOString(),
      passed: true,
      node: 'v22.20.0',
      npm: '10.9.0',
      tarballs: PUBLISHED.map((name) => ({ name, version: '0.1.0', file: `${name.slice(1).replace('/', '-')}-0.1.0.tgz`, sha256: 'ab'.repeat(32), integrity: 'sha512-x', distHash: DIST })),
      consumers: projects(),
    },
    dist: dist(),
  }
  return {
    results: [verify, core, questionnaire, document, corpus, browserJob(), install, validatorJob()],
    facts: {
      runtime: [],
      upstream: [
        { name: '@formancy/report-spec', version: '0.1.0', declared: '0.1.0', direct: true, shipped: false },
        { name: '@formancy/spec', version: '0.5.0', declared: '0.5.0', direct: true, shipped: true },
      ],
      node: { engines: '>=22.13.0', nodeVersion: '22', ci: [{ workflow: 'gates.yml', job: 'verify', version: '22' }], declared: [] },
      packageManager: { name: 'pnpm', version: '12.4.2', declared: 'pnpm@12.4.2' },
      browser: { playwright: '1.64.1', pins: [{ browser: 'chromium', name: 'chromium-headless-shell', revision: '1248', browserVersion: '156.0.8078.4', headless: true }] },
      tooling: [{ name: 'typescript', declared: '~6.0.3', version: '6.0.3' }],
      fhir: '4.0.1',
      validator: { version: '7.0.2', released: '2026-10-15', sha256: JAR, java: 17 },
      guides: [
        { key: 'hl7.fhir.r4.core#4.0.1', loadedAs: 'core', licence: 'CC0-1.0' },
        { key: 'hl7.fhir.uv.sdc#4.0.0', loadedAs: 'ig', licence: 'CC0-1.0' },
      ],
    },
    covered: [
      { path: 'packages/health-core', id: 'health-core', name: '@formancy/health-core' },
      { path: 'packages/health-corpus', id: 'health-corpus', name: '@formancy/health-corpus' },
      { path: 'packages/health-document', id: 'health-document', name: '@formancy/health-document' },
      { path: 'packages/health-questionnaire', id: 'health-questionnaire', name: '@formancy/health-questionnaire' },
    ],
    published: [...PUBLISHED],
    installPlan: structuredClone(INSTALL_PLAN),
    validatorFiles: ['scripts/validator/registers.test.mjs'],
    browserApps: ['apps/demo'],
    browsers: ['chromium'],
    pin: { version: '7.0.2', sha256: JAR, java: 17 },
    registered: ['hl7.fhir.r4.core#4.0.1', 'hl7.fhir.uv.sdc#4.0.0'],
    register: {
      records: {
        '0004': {
          reviewed: 'sha256:04',
          limitations: [{ area: 'json', says: 'A host must keep a number’s text.', heldBy: 'packages/health-core/src/numbers.test.ts' }],
        },
      },
    },
    records: [{ number: '0004', file: '0004-fhir-json-is-written-and-read-exactly.md', title: 'Write and read FHIR JSON exactly', status: 'accepted', hash: 'sha256:04' }],
    jobs: [...JOBS],
    // Evidence no other test's defect touches, so each defect still gives
    // exactly its own sentence; gates.test.mjs and the gate tests here change it.
    gatesRegister: { gates: GATE_IDS.map((id) => ({ gate: id, ...structuredClone(EVIDENCE[id]) })) },
    documents: { [DOCUMENT]: { sha: '1234567890abcdef1234567890abcdef12345678', date: '2026-10-16T12:00:00+02:00', behind: 3 } },
    exists: () => true,
    repository: 'https://github.com/sharkysan/formancy.ai-health',
    commit: 'c0ffee',
    version: '0.1.0',
    release: '',
    changelog: ['# Changelog', '', '## Unreleased', '', 'Something changed.', '', '## 0.2.0', '', 'Ahead of the manifests.', '', '## 0.1.0', '', 'The first.', ''].join('\n'),
    generatedAt: new Date(T0 + 3_700_000).toISOString(),
  }
}

/** The gates workflow's jobs that leave results, as greenCiRun() runs them. */
const JOBS = ['verify', 'test', 'browser', 'install', 'validator']
/** The register's gates, in its order. */
const GATE_IDS = ['G1', 'G2', 'G3', 'G4', 'G5', 'G6', 'G7', 'licences', 'trademark', 'rehearsal', 'legal']
/** A committed document, as a gate's stated evidence would be. */
export const DOCUMENT = 'RELEASING.md'
export const OPEN = 'Nothing to test yet.'
const EVIDENCE = {
  G1: { evidence: [{ file: 'scripts/upstream-deps.test.mjs' }], open: 'No gate bundles a package for a browser.' },
  G2: { evidence: [{ file: 'scripts/validator/registers.test.mjs' }, { file: 'scripts/validator/judge.test.mjs' }] },
  G3: { evidence: [{ file: 'packages/health-core/src/exactness.test.ts' }] },
  G4: { open: OPEN },
  G5: { evidence: [{ file: 'packages/health-questionnaire/src/questionnaire.test.ts' }], open: 'No package reads a guide version to refuse.' },
  G6: { open: OPEN },
  G7: { open: OPEN },
  licences: { evidence: [{ file: 'scripts/dependency-licences.test.mjs' }] },
  trademark: { evidence: [{ file: 'scripts/trademark.test.mjs' }] },
  rehearsal: { evidence: [{ document: DOCUMENT }] },
  legal: { open: 'Needs a lawyer.' },
}

/**
 * greenRun() as the report job sees it in CI: every job's results in an
 * artefact of its own name, every job's result in `needs` a success, this
 * run's id, and G1 resting on the install job and G2 on the validator job
 * as well.
 */
export function greenCiRun() {
  const { results, ...inputs } = greenRun()
  inputs.gatesRegister.gates[0].evidence.push({ job: 'install' })
  inputs.gatesRegister.gates[1].evidence.push({ job: 'validator' })
  return {
    ...inputs,
    mode: 'ci',
    artefacts: results.map((result) => ({ name: `release-results-${result.key}`, files: [{ file: `${result.key}.json`, result }] })),
    expected: results.map(({ key, job }) => ({ key, job })),
    needs: Object.fromEntries(JOBS.map((name) => [name, { result: 'success', outputs: {} }])),
    run: { id: '42', attempt: '1', workflow: 'CI', url: 'https://github.com/sharkysan/formancy.ai-health/actions/runs/42' },
  }
}

/** The results file of `key` in a CI run's artefacts. */
export const ciJob = (inputs, key) => inputs.artefacts.flatMap((artefact) => artefact.files).find((entry) => entry.result?.key === key)?.result

/** A deep copy of a run's inputs, for a test to change one thing in; `exists` is a function, and kept. */
export const copy = ({ exists, ...rest }) => ({ ...structuredClone(rest), exists })

/** The results file of `key` in `inputs`. */
export const job = (inputs, key) => inputs.results.find((result) => result.key === key)
