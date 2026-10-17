// The report as Markdown (0011; formancy.ai-report 0014), from the built
// report, and the summary a release body carries.
//
// Every value is the report's; the only text written here is the fixed
// sentences of the derived limitations, each with only facts inserted, so a
// limitation the run shows cannot be left out by somebody forgetting it, and
// the line per section saying where it comes from.

const code = (text) => `\`${text}\``
const cell = (text) => String(text ?? '').replaceAll('|', '\\|').replaceAll('\n', ' ')
const table = (head, rows) => [`| ${head.join(' | ')} |`, `| ${head.map(() => '---').join(' | ')} |`, ...rows.map((row) => `| ${row.map(cell).join(' | ')} |`)].join('\n')
const prose = (items) => (items.length <= 1 ? (items[0] ?? '') : `${items.slice(0, -1).join(', ')} and ${items.at(-1)}`)
const seconds = (ms) => (ms === null || ms === undefined || Number.isNaN(ms) ? '' : `${(ms / 1000).toFixed(1)} s`)
const distinct = (values) => [...new Set(values)]

/** Every version a clean install resolved for a package. */
const freshCell = (fresh) => fresh.map((entry) => entry.version).join('; ')

/** The limitations this run shows, each a fixed sentence with only its facts inserted. */
export function derivedLimitations(report) {
  const { testedOn, results } = report
  const sentences = []

  const declared = testedOn.node.declared.length === 0 ? 'no published package declares the Node versions it supports' : prose(testedOn.node.declared.map((entry) => `${code(entry.package)} declares Node ${code(entry.node)}`))
  sentences.push(`The suites ran on Node ${prose(testedOn.node.ran) || 'that no job recorded'}${testedOn.node.install === null ? '' : `; the install gate ran on ${testedOn.node.install}`}; ${declared}.`)

  const ranged = testedOn.runtime.filter((entry) => !/^\d+\.\d+\.\d+(-[0-9A-Za-z.-]+)?$/.test(String(entry.range)))
  if (testedOn.runtime.length === 0) sentences.push('No published package depends at run time on anything but its siblings and upstream `@formancy/*` packages, each at an exact version.')
  else if (ranged.length === 0) sentences.push('Every runtime dependency is published at an exact version, the one the suites ran.')
  else sentences.push(`${prose(ranged.map((entry) => code(entry.name)))} ${ranged.length === 1 ? 'is' : 'are'} published as a range; the suites ran the version${ranged.length === 1 ? '' : 's'} *Tested on* names, and an install may resolve another.`)
  // Every version a clean install resolved that the suites did not load: a
  // consumer's, then the guide's project's, said as the guide's.
  const past = (entry, fresh, where) => fresh.filter((version) => version.version !== (entry.loaded ?? entry.version)).map((version) => `${code(entry.name)} ${version.version}${where} (the suites ran ${entry.loaded ?? entry.version})`)
  const moved = [
    ...[...testedOn.runtime, ...testedOn.upstream].flatMap((entry) => past(entry, entry.fresh, '')),
    ...testedOn.upstream.flatMap((entry) => past(entry, entry.guide ?? [], ' in the guide’s project')),
  ]
  if (moved.length > 0) sentences.push(`A clean npm install on ${String(testedOn.installedAt).slice(0, 10)} resolved ${prose(moved)}, which no suite ran.`)

  // Where the packed packages ran: Node alone, since Health has no page.
  sentences.push(
    results.install === null
      ? 'No install gate ran the packed packages in this run, and no gate runs a package in a browser or another engine.'
      : `The install gate ran the packed packages under Node ${String(results.install.node)} alone; no gate ran them in a browser or another engine.`,
  )

  // What the validator gate judged, and on what.
  const gate = results.validator.gate
  if (gate === null) sentences.push('No validator gate ran in this run: nothing here judged the FHIR the packages write.')
  else {
    sentences.push(
      `The HL7 FHIR validator ${String(gate.reported)} ran offline, on Java ${String(gate.java ?? 'that it did not report')}, against the ${String(gate.registered.length)} registered packages, and judged ${String(gate.resources)} resources of the corpus, ${String(gate.broken)} of them broken on purpose; a conformance claim is about those resources and no other.`,
    )
  }

  const identity = results.buildIdentity
  if (results.install === null) sentences.push("Each package's own suites ran its source; no install gate ran the packed dist/ in this run.")
  else if (identity.length > 0 && identity.every((entry) => entry.identical && entry.tarball !== null && entry.builds.length > 0)) {
    // Only the jobs that built every published package are named: a test
    // job builds what its package depends on, not the rest, and the table
    // says which built what.
    const everywhere = identity.map((entry) => new Set(entry.builds.map((build) => build.job))).reduce((all, jobs) => new Set([...all].filter((job) => jobs.has(job))))
    const named = [...everywhere].sort()
    sentences.push(
      `Each package's own suites ran its source; the published dist/ was run by the install gate, and each package's is byte-identical to ${named.length === 0 ? 'the dist/ every job that built it built' : `its dist/ built in ${prose(named)}, and in every other job that built it`} (*Build identity* names them).`,
    )
  } else sentences.push("Each package's own suites ran its source; the published dist/ was run by the install gate, and is not shown byte-identical to every job's build (see *Build identity*).")

  for (const entry of report.gates ?? []) {
    if (entry.state === 'open') sentences.push(`Release gate ${code(entry.gate)} is open: ${entry.open}${entry.evidence.some((item) => item.kind !== 'document') ? ' The evidence it has passed in this run.' : ''}`)
    if (entry.state === 'stated') sentences.push(`Release gate ${code(entry.gate)} is ${prose(entry.evidence.map(stated))}; not exercised by this run.`)
  }
  return sentences
}

/** A document as evidence: where it is stated and when it last changed. */
function stated(item) {
  const history = item.history
  if (history === null || history === undefined) return `stated in ${code(item.value)}, whose history this checkout does not have`
  return `stated in ${code(item.value)}, last changed ${history.date.slice(0, 10)} at ${code(history.sha.slice(0, 7))}, ${String(history.behind)} commit(s) before this one`
}

/** How one evidence item stood in the run. */
function evidenceCell(item) {
  if (item.kind === 'document') return stated(item)
  const what = item.kind === 'job' ? `the ${code(item.value)} job` : code(item.value)
  if (item.local === true) return `${what}: no result outside a gates run`
  return `${what}: ${item.outcome === 'absent' ? 'did not run' : item.kind === 'job' && item.outcome === 'failed' ? `ended ${String(item.result)}` : item.outcome}`
}

const GATE_STATE = { passed: 'evidence passed in this run', failed: 'evidence did not pass in this run', stated: 'stated, not exercised by this run', open: 'open' }

/** Each release gate, as this run leaves it; never "met". */
function gatesSection({ gates }) {
  return [
    '## Release gates',
    '',
    'The delivery plan’s gates by id (`docs/release/gates.json`). A document is stated evidence, never passed in a run; a gate with a reason is open, whatever its evidence; and no gate is called met.',
    '',
    table(['Gate', 'State', 'Evidence', 'Open because'], (gates ?? []).map((entry) => [entry.gate, GATE_STATE[entry.state], entry.evidence.map(evidenceCell).join('; ') || 'none', entry.open ?? ''])),
  ].join('\n')
}

/** Where each section comes from, one line each. */
const METHOD = [
  ['Subject', 'the GitHub run’s environment (`GITHUB_SHA`, `GITHUB_RUN_ID`), the report job’s `needs`, the root `package.json`’s version, and each job’s results file'],
  [
    'Tested on',
    '`scripts/release-report/tested-on.mjs` over the checkout -- the published manifests, what is installed, `pnpm-workspace.yaml`’s catalog, every workflow’s `setup-node`, and the tuple `scripts/compatibility.mjs` reads for the README -- the install gate’s `test-results/install.json` for what each project’s clean install resolved, a consumer’s apart from the guide’s, and the validator gate’s `test-results/validator.json` for the validator and the Java it ran',
  ],
  ['Results', 'each package’s `test-results/vitest.json` and `coverage/coverage-summary.json`, turbo’s run summary (`--summarize`), the repository guards’ `test-results/vitest.json`, and the install gate’s `test-results/install.json`, held to the projects `scripts/install-hosts.mjs` plans'],
  ['Validator', 'the gate’s `test-results/validator.json`, which `scripts/validator.mjs` writes however it ends, held to `docs/release/validator.json` and `docs/release/ig-packages.json`; and the validator job’s `test-results/vitest.json` of the registers’ test, whose passes account for the cases `verify` skips'],
  ['Build identity', '`scripts/release/dist-hash.mjs` over every published package’s `dist/` in every job, and over each tarball’s built files'],
  ['Release gates', '`docs/release/gates.json`, the report job’s `needs`, and `git log` for a document’s last change'],
  ['Known limitations', 'the fixed sentences of `scripts/release-report/render.mjs` with this run’s facts, then `docs/release/limitations.json`, held to the decision records by hash'],
  ['Problems', '`scripts/release-report/problems.mjs`, `artefacts.mjs`, `gates.mjs` and `limitations.mjs`, and the release body from `scripts/release-notes.mjs`'],
]

/** What the run was tested on: dependencies, upstream, Node, pnpm, the tools and the tuple. */
function testedOnSection({ testedOn }) {
  const ci = distinct(testedOn.node.ci.map((entry) => entry.version))
  const { pinned, ran } = testedOn.validator
  return [
    '## Tested on',
    '',
    testedOn.runtime.length === 0
      ? 'No published package has a runtime dependency of somebody else’s.'
      : table(['Dependency', 'Declared by', 'Published as', 'Loaded by the suites', 'A consumer’s clean install'], testedOn.runtime.map((entry) => [code(entry.name), entry.package, entry.range, entry.loaded, entry.fresh.length === 0 ? 'not reported' : freshCell(entry.fresh)])),
    '',
    table(
      ['Upstream', 'Declared as', 'Loaded', 'Shipped', 'A consumer’s clean install', 'The guide’s project'],
      testedOn.upstream.map((entry) => [
        `${code(entry.name)}${entry.direct ? '' : ' (transitive)'}`,
        entry.declared ?? '',
        entry.version,
        entry.shipped ? 'yes' : 'no: no published package depends on it',
        entry.fresh.length === 0 ? 'not installed by a consumer' : freshCell(entry.fresh),
        (entry.guide ?? []).length === 0 ? 'not installed' : freshCell(entry.guide),
      ]),
    ),
    '',
    `FHIR ${testedOn.fhir}, as health-core writes it. The validator gate pins the HL7 FHIR validator ${pinned.version} (released ${String(pinned.released)}, Java ${String(pinned.java)} or later)${ran === null ? ', and did not run here' : `, and ran ${String(ran.reported)} on Java ${String(ran.java)}, which loaded ${String(ran.loaded)} packages`}; the register holds ${prose(testedOn.guides.filter((entry) => entry.loadedAs !== 'dependency').map((entry) => code(entry.key)))}, and ${String(testedOn.guides.filter((entry) => entry.loadedAs === 'dependency').length)} packages they bring.`,
    '',
    `Node: the workspace declares ${testedOn.node.engines === null ? 'nothing' : code(testedOn.node.engines)} and \`.node-version\` ${String(testedOn.node.nodeVersion)}; CI sets up ${prose(ci) || 'nothing'}; this run's jobs ran ${prose(testedOn.node.ran) || 'nothing recorded'}${testedOn.node.install === null ? '' : `, and the install gate ran on ${testedOn.node.install} with npm ${String(testedOn.npm)}`}.`,
    '',
    `${testedOn.packageManager.name} ${testedOn.packageManager.version}, through corepack (${code(testedOn.packageManager.declared)}). Tools, as the workspace loads them: ${testedOn.tooling.map((tool) => `${tool.name} ${tool.version}${tool.declared === null ? '' : ` (${code(tool.declared)})`}`).join(', ')}.`,
  ].join('\n')
}

const pct = (coverage) => (coverage === null ? '' : ['lines', 'branches', 'functions', 'statements'].map((metric) => (coverage[metric] === null ? '-' : String(coverage[metric]))).join(' / '))
const yesNo = (value) => (value ? 'yes' : 'no')
/** A row's skips, with those the validator job's run passed and those a machine allowed. */
const skippedCell = (row) => `${String(row.skipped + row.todo)}${row.ranInValidator === 0 ? '' : ` (${String(row.ranInValidator)} passed by the validator job)`}${row.allowed === 0 ? '' : ` (${String(row.allowed)} allowed, the validator missing)`}`

/** What a project of the install gate installed beside the tarballs. */
const besideCell = (installed) => Object.entries(installed).map(([name, version]) => `${name} ${String(version)}`).join(', ') || 'the tarballs alone'

/** The install gate, and each of its projects, as install.json recorded them. */
function installLines(install) {
  if (install === null) return ['The install gate left no results.']
  const { projects } = install
  const said = projects.filter((project) => project.guide !== null && project.said !== null && project.said !== '')
  return [
    `The install gate ${install.passed ? 'passed' : 'failed'} with npm ${String(install.npm)} on Node ${String(install.node)}, in the ${String(projects.length)} plain npm projects \`scripts/install-hosts.mjs\` plans:`,
    '',
    table(
      ['Project', 'Checks', 'Installed beside the tarballs', 'The guide’s blocks', 'Every step passed'],
      projects.map((project) => [project.project, `${code(String(project.consumer))}: ${project.steps.join(', ')}`, besideCell(project.installed), project.guide === null ? 'none' : `${String(project.guide.kind)}, ${String(project.guide.blocks)} blocks`, yesNo(project.passed)]),
    ),
    ...said.flatMap((project) => ['', `The last step of the ${code(String(project.project))} project, which builds the guide, said: ${String(project.said)}`]),
  ]
}

/** Results per package, the repository's guards and the install gate. */
function resultsSection({ results }) {
  const rows = results.packages.map((row) =>
    row.present
      ? [row.package, yesNo(row.published), row.files, row.tests, row.passed, row.failed, skippedCell(row), row.failedFiles.length, seconds(row.wallMs) || 'not measured', seconds(row.spanMs), pct(row.coverage) || 'not measured']
      : [row.package, yesNo(row.published), 'no results', '', '', '', '', '', '', '', ''],
  )
  const { repository, install } = results
  return [
    '## Results',
    '',
    table(['Package', 'Published', 'Files', 'Tests', 'Passed', 'Failed', 'Skipped or todo', 'Failed files', "Task's wall time (turbo)", 'First test start to last test end (vitest)', 'Coverage, lines / branches / functions / statements (reported, never gated)'], rows),
    '',
    repository.present
      ? `The repository's guards (\`pnpm test:repo\`): ${String(repository.passed)} of ${String(repository.tests)} passed in ${String(repository.files)} files; skipped: ${skippedCell(repository)}.`
      : "The repository's guards left no results.",
    '',
    ...installLines(install),
  ].join('\n')
}

/** The validator gate, and its job's run of the registers' test. */
function validatorSection({ results }) {
  const { gate, suite } = results.validator
  if (gate === null) return ['## Validator', '', 'The validator gate left no results in this run.'].join('\n')
  return [
    '## Validator',
    '',
    "The HL7 FHIR validator's verdict on the corpus (0005), from the gate's own file, held to the registers the checkout holds. A resource not judged as the corpus expects, another validator, another register, a package loaded that is not registered or a run that was not offline fails the run.",
    '',
    table(
      ['Passed', 'Validator', 'Java', 'Packages registered / loaded', 'Resources', 'To accept', 'Broken to refuse', 'Not as expected', 'Errors / warnings / information', 'Warnings accepted by id', 'Validator time'],
      [
        [
          yesNo(gate.passed),
          String(gate.reported),
          String(gate.java ?? 'not recorded'),
          `${String(gate.registered.length)} / ${gate.loaded === null ? 'not recorded' : String(gate.loaded.length)}`,
          gate.resources,
          gate.accepted,
          gate.broken,
          gate.notAsExpected.length,
          `${String(gate.issues.errors)} / ${String(gate.issues.warnings)} / ${String(gate.issues.information)}`,
          gate.registeredWarnings.join(', ') || 'none',
          gate.seconds?.validator === undefined ? 'not measured' : `${String(gate.seconds.validator)} s`,
        ],
      ],
    ),
    '',
    suite.present
      ? `The validator job's run of the registers' test: ${String(suite.passed)} of ${String(suite.tests)} passed in ${String(suite.files)} file(s), every case the gate's downloads and run let it read.`
      : "The validator job's run of the registers' test left no results here; on a machine, the guards run its every case once the gate has run there.",
  ].join('\n')
}

/** Build identity: each tarball and the jobs whose dist/ it holds. */
function identitySection({ results }) {
  return [
    '## Build identity',
    '',
    table(
      ['Package', 'Tarball', 'Tarball sha256', 'Its dist/', 'Jobs that built the same dist/'],
      results.buildIdentity.map((entry) => [entry.package, entry.tarball?.file ?? 'none', entry.tarball?.sha256 ?? '', entry.tarball?.distHash ?? '', entry.builds.filter((build) => build.distHash === entry.tarball?.distHash).map((build) => build.job).join(', ')]),
    ),
  ].join('\n')
}

/** Limitations, the method and the problems. */
function closingSection(report) {
  const statedLines = report.limitations.stated.flatMap((group) => [
    '',
    `### ${group.area}`,
    '',
    ...group.lines.map((line) => `- ${line.says} — stated by [${line.number} ${line.title}](${line.link}) (${line.status})${line.heldBy === undefined ? '' : `; held by ${code(line.heldBy)}, ${line.held === 'passed' ? 'passed in this run' : line.held === 'absent' ? 'which did not run' : 'which did not pass'}`}`),
  ])
  return [
    '## Known limitations',
    '',
    'Shown by this run:',
    '',
    ...derivedLimitations(report).map((sentence) => `- ${sentence}`),
    '',
    'Stated in the decision records, as each record states it:',
    ...statedLines,
    '',
    '## How this report was made',
    '',
    ...METHOD.map(([section, source]) => `- **${section}:** ${source}.`),
    '',
    '## Problems',
    '',
    report.problems.length === 0 ? 'None: nothing here fails the run.' : report.problems.map((problem) => `- ${problem}`).join('\n'),
  ].join('\n')
}

/** Every section after the subject. */
export function renderContent(report) {
  return [testedOnSection(report), resultsSection(report), validatorSection(report), identitySection(report), gatesSection(report), closingSection(report)].join('\n\n')
}

/** What is being released, as the subject's first line says it. */
function releaseName(subject) {
  if (subject.release === null) return subject.run === null ? 'a local run' : 'a CI run; nothing is released from it'
  return subject.release === 'dry-run' ? 'a rehearsal (`dry-run`); nothing is published from it' : `the release ${code(subject.release)}`
}

/** Which version, release, commit and run this is, and each job's machine. */
function subjectSection({ subject }) {
  const run = subject.run === null ? '' : ` Run [${String(subject.run.id)}](${subject.run.url}) of ${subject.run.workflow ?? 'the gates workflow'}, attempt ${String(subject.run.attempt ?? '?')}.`
  return [
    `Formancy Health ${subject.version}, ${releaseName(subject)}. Commit ${code(subject.commit)}${subject.dirty === true ? ', with uncommitted changes' : ''}.${run} Generated ${subject.generatedAt}.`,
    '',
    table(
      ['Job', 'Attempt', 'Runner image', 'Node', 'Platform'],
      subject.jobs.map((entry) => [entry.key, entry.attempt ?? '', [entry.runner?.image, entry.runner?.imageVersion].filter((value) => value != null).join(' '), entry.runner?.node ?? '', entry.runner ? `${entry.runner.platform} ${entry.runner.arch}` : '']),
    ),
  ].join('\n')
}

/** The whole report as Markdown: the title, a local run's banner, the subject and every section. */
export function renderReport(report, { local = false, partial = [] } = {}) {
  const banner = local ? [`local: no NEEDS, no artefacts${partial.length === 0 ? '' : `; partial: ${partial.join(', ')} allowed missing`}.`, ''] : []
  return `${['# Release report', '', ...banner, subjectSection(report), '', renderContent(report)].join('\n')}\n`
}

/**
 * What a release body carries of the report, after the changelog's
 * `section`: where the full report is (`link`), the counts and the derived
 * limitations.
 */
export function renderSummary(report, { section = null, link = null } = {}) {
  const packages = report.results.packages.filter((row) => row.present)
  const passed = packages.reduce((total, row) => total + row.passed, 0)
  const tests = packages.reduce((total, row) => total + row.tests, 0)
  const { install } = report.results
  const gate = report.results.validator.gate
  return [
    ...(link === null ? [] : [`The full report of the run that gated this: ${link}`, '']),
    ...(section === null ? [] : [`The notes above are CHANGELOG.md’s ${code(section)} section.`, '']),
    `${String(passed)} of ${String(tests)} tests passed across ${String(packages.length)} packages; the install gate ${install === null ? 'left no results' : install.passed ? 'passed' : 'failed'}; the validator gate ${gate === null ? 'left no results' : gate.passed ? `passed, ${String(gate.resources)} resources judged as the corpus expects` : 'failed'}.`,
    '',
    ...derivedLimitations(report).map((sentence) => `- ${sentence}`),
  ].join('\n')
}
