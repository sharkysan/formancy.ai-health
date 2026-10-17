import { describe, expect, test } from 'vitest'
import { derivedLimitations, renderContent, renderReport, renderSummary } from './render.mjs'
import { buildReport } from './report.mjs'
import { copy, greenCiRun, greenRun, job } from './synthetic-run.mjs'

/**
 * The report's derived limitations and its Markdown (0011;
 * formancy.ai-report 0014), over a run made by hand. A limitation the run
 * shows is a fixed sentence with the run's facts in it; each test here
 * fails when its sentence's template is gone, which is how a limitation
 * stops being said without anybody deciding so.
 */
const report = (change = () => {}) => {
  const inputs = copy(greenRun())
  change(inputs)
  return buildReport(inputs)
}

describe('the limitations a run shows', () => {
  // Node is what the jobs ran and what the install gate ran on; no
  // published package says which Node it supports, and the reader is told.
  test('name the Node every job ran, the install gate’s, and that no package declares one', () => {
    expect(derivedLimitations(report())).toContain('The suites ran on Node v22.20.0; the install gate ran on v22.20.0; no published package declares the Node versions it supports.')
  })

  // No published package has a third-party runtime dependency today; one
  // that arrives as a range admits versions no suite ran, and a clean
  // install on the day is the evidence of one.
  test('say there is no runtime dependency, or whether one is exact, and name one a clean install resolved past the suites', () => {
    expect(derivedLimitations(report())).toContain('No published package depends at run time on anything but its siblings and upstream `@formancy/*` packages, each at an exact version.')
    const exact = derivedLimitations(report((inputs) => inputs.facts.runtime.push({ package: '@formancy/health-core', name: 'tslib', range: '2.8.1', loaded: '2.8.1' })))
    expect(exact).toContain('Every runtime dependency is published at an exact version, the one the suites ran.')
    const ranged = derivedLimitations(
      report((inputs) => {
        inputs.facts.runtime.push({ package: '@formancy/health-core', name: 'tslib', range: '^2.8.0', loaded: '2.8.1' })
        job(inputs, 'install').install.consumers[0].resolved.push({ name: 'tslib', version: '2.8.2' })
      }),
    )
    expect(ranged).toContain('`tslib` is published as a range; the suites ran the version *Tested on* names, and an install may resolve another.')
    expect(ranged).toContain('A clean npm install on 2026-10-17 resolved `tslib` 2.8.2 (the suites ran 2.8.1), which no suite ran.')
    expect(derivedLimitations(report()).some((sentence) => sentence.startsWith('A clean npm install'))).toBe(false)
    // What the guide's project resolved beside the tarballs is said as the guide's, never as a consumer's.
    const guide = derivedLimitations(report((inputs) => (job(inputs, 'install').install.consumers[1].resolved.find((entry) => entry.name === '@formancy/report-spec').version = '0.1.1')))
    expect(guide).toContain('A clean npm install on 2026-10-17 resolved `@formancy/report-spec` 0.1.1 in the guide’s project (the suites ran 0.1.0), which no suite ran.')
  })

  // The packed packages ran under Node and nowhere else; with no install
  // gate, nothing ran them at all.
  test('say the packed packages ran under Node alone, or not at all', () => {
    expect(derivedLimitations(report())).toContain('The install gate ran the packed packages under Node v22.20.0 alone; no gate ran them in a browser or another engine.')
    expect(derivedLimitations(report((inputs) => (job(inputs, 'install').install = null)))).toContain('No install gate ran the packed packages in this run, and no gate runs a package in a browser or another engine.')
  })

  // A conformance claim is the validator, the registered packages and the
  // corpus, and nothing more (0005): the run says which, from the gate's
  // own file, and says so when no gate ran.
  test('name the validator the gate ran, on what, and what it judged, or that it did not run', () => {
    expect(derivedLimitations(report())).toContain(
      'The HL7 FHIR validator 7.0.2 ran offline, on Java 17.0.4, against the 2 registered packages, and judged 2 resources of the corpus, 1 of them broken on purpose; a conformance claim is about those resources and no other.',
    )
    expect(derivedLimitations(report((inputs) => (job(inputs, 'validator').validator = null)))).toContain('No validator gate ran in this run: nothing here judged the FHIR the packages write.')
  })

  // Neither the suites' source-not-dist nor which jobs built what npm
  // receives may go unsaid.
  test('say the suites ran the source, and which jobs built the dist/ npm receives', () => {
    const identity = derivedLimitations(report()).find((sentence) => sentence.includes('published dist/'))
    expect(identity).toBe("Each package's own suites ran its source; the published dist/ was run by the install gate, and each package's is byte-identical to its dist/ built in install, validator and verify, and in every other job that built it (*Build identity* names them).")
    expect(derivedLimitations(report((inputs) => (job(inputs, 'install').install = null)))).toContain("Each package's own suites ran its source; no install gate ran the packed dist/ in this run.")
  })
})

describe('the release gates, as a report shows them', () => {
  // A gate with a reason is open whatever its evidence, and the reason is a
  // limitation of every release until the register changes.
  test('say every open gate as a limitation, with its reason, and whether the evidence it has passed', () => {
    const sentences = derivedLimitations(report())
    expect(sentences).toContain('Release gate `G4` is open: Nothing to test yet.')
    expect(sentences).toContain('Release gate `G5` is open: No package reads a guide version to refuse. The evidence it has passed in this run.')
    expect(renderContent(report())).toContain('| G5 | open | `packages/health-questionnaire/src/questionnaire.test.ts`: passed | No package reads a guide version to refuse. |')
  })

  // A document from another commit is stated, with when it last changed and
  // how far behind this commit it is, and never "passed".
  test('show a gate whose only evidence is a document as stated, with its last change, and none as met', () => {
    const built = report()
    const markdown = renderContent(built)
    const gates = markdown.slice(markdown.indexOf('## Release gates'), markdown.indexOf('## Known limitations'))
    expect(gates).toContain('| rehearsal | stated, not exercised by this run | stated in `RELEASING.md`, last changed 2026-10-16 at `1234567`, 3 commit(s) before this one |  |')
    expect(gates).toContain('| G3 | evidence passed in this run | `packages/health-core/src/exactness.test.ts`: passed |  |')
    expect(gates).not.toMatch(/\| [^|]+ \| [^|]*\bmet\b/)
    expect(derivedLimitations(built)).toContain('Release gate `rehearsal` is stated in `RELEASING.md`, last changed 2026-10-16 at `1234567`, 3 commit(s) before this one; not exercised by this run.')
  })

  // On a machine there is no `needs`: a job's evidence is said to have no
  // result there, not to have failed or not run, and in CI it is the job's.
  test('say a job’s evidence has no result outside a gates run, and in CI how the job ended', () => {
    const local = renderContent(report((inputs) => inputs.gatesRegister.gates[1].evidence.push({ job: 'validator' })))
    expect(local).toContain('| G2 | evidence did not pass in this run | `scripts/validator/registers.test.mjs`: passed; `scripts/validator/judge.test.mjs`: passed; the `validator` job: no result outside a gates run |  |')
    expect(renderContent(buildReport(greenCiRun()))).toContain('| G2 | evidence passed in this run | `scripts/validator/registers.test.mjs`: passed; `scripts/validator/judge.test.mjs`: passed; the `validator` job: passed |  |')
  })
})

describe('the Markdown', () => {
  // A blank cell reads as nothing to report; a wall time or a coverage no
  // file of this run gave is said to be not measured.
  test('says a wall time or a coverage this run has no file for is not measured', () => {
    const markdown = renderContent(
      report((inputs) => {
        const suite = job(inputs, 'test-health-core').suites[0]
        suite.task = null
        suite.coverage = null
      }),
    )
    const row = markdown.split('\n').find((line) => line.startsWith('| @formancy/health-core |'))
    expect(row).toMatch(/\| not measured \| [\d.]+ s \| not measured \|$/)
  })

  // The guards' skips are shown with how many of them the validator job's
  // run passed, so a reader sees why a skip did not fail the run; and on a
  // machine that allowed the validator missing, how many were allowed.
  test('shows the guards’ skips with those the validator job passed, or a machine allowed', () => {
    expect(renderContent(report())).toContain("The repository's guards (`pnpm test:repo`): 5 of 6 passed in 5 files; skipped: 1 (1 passed by the validator job).")
    const allowed = renderContent(
      report((inputs) => {
        job(inputs, 'validator').validator = null
        inputs.allowMissing = ['validator']
      }),
    )
    expect(allowed).toContain("5 of 6 passed in 5 files; skipped: 1 (1 allowed, the validator missing).")
  })

  // Tested on names the upstream packages, which of them a consumer
  // installs, the tuple, and the tools. A consumer's clean install is the
  // project that holds the tarballs alone: what the guide's project
  // installs beside them -- Formancy Report's packages -- is shown as the
  // guide's, so the column a consumer reads never names what the tarballs
  // do not bring, which the SBOM leaves out too.
  test('shows the upstream packages, what ships, the tuple and the tools', () => {
    const markdown = renderContent(report())
    expect(markdown).toContain('No published package has a runtime dependency of somebody else’s.')
    expect(markdown).toContain('| Upstream | Declared as | Loaded | Shipped | A consumer’s clean install | The guide’s project |')
    expect(markdown).toContain('| `@formancy/spec` | 0.5.0 | 0.5.0 | yes | 0.5.0 | 0.5.0 |')
    expect(markdown).toContain('| `@formancy/report-spec` | 0.1.0 | 0.1.0 | no: no published package depends on it | not installed by a consumer | 0.1.0 |')
    expect(markdown).toContain('FHIR 4.0.1, as health-core writes it. The validator gate pins the HL7 FHIR validator 7.0.2 (released 2026-10-15, Java 17 or later), and ran 7.0.2 on Java 17.0.4, which loaded 2 packages; the register holds `hl7.fhir.r4.core#4.0.1` and `hl7.fhir.uv.sdc#4.0.0`, and 0 packages they bring.')
    expect(markdown).toContain('pnpm 12.4.2, through corepack (`pnpm@12.4.2`). Tools, as the workspace loads them: typescript 6.0.3 (`~6.0.3`).')
  })

  // The install gate ran a project per host install-hosts.mjs plans; the
  // report says which, what each installed beside the tarballs, whether it
  // ran the guide's blocks, and what the guide's runner said when it held
  // the program's output to the guide's -- never a count typed here.
  test('shows each project of the install gate, and what the guide’s run said', () => {
    const markdown = renderContent(report())
    const results = markdown.slice(markdown.indexOf('## Results'), markdown.indexOf('## Validator'))
    expect(results).toContain('The install gate passed with npm 10.9.0 on Node v22.20.0, in the 2 plain npm projects `scripts/install-hosts.mjs` plans:')
    expect(results).toContain('| node | `consume.ts`: type-check, run | the tarballs alone | none | yes |')
    expect(results).toContain('| guide | `guide-node.ts`: type-check, guide: run | @formancy/spec 0.5.0, @formancy/report-spec 0.1.0 | node, 2 blocks | yes |')
    expect(results).toContain('The last step of the `guide` project, which builds the guide, said: ok: the guide’s program ran and printed the 2 lines the guide shows it printing')
    expect(results).not.toContain('one plain npm project')
  })

  // The Validator section is the gate's own record, held to the register:
  // what it judged, how it came out, and its job's run of the registers.
  test('shows the validator gate’s verdict and its job’s run of the registers', () => {
    const markdown = renderContent(report())
    const section = markdown.slice(markdown.indexOf('## Validator'), markdown.indexOf('## Build identity'))
    expect(section).toContain('| yes | 7.0.2 | 17.0.4 | 2 / 2 | 2 | 1 | 1 | 0 | 1 / 1 / 2 | TERMINOLOGY_TX_WARNING | 24.3 s |')
    expect(section).toContain("The validator job's run of the registers' test: 2 of 2 passed in 1 file(s)")
    expect(renderContent(report((inputs) => (job(inputs, 'validator').validator = null)))).toContain('The validator gate left no results in this run.')
  })

  // Every register line names the record that states it, and a held line
  // says its test passed in this run.
  test('prints a stated limitation with its record, its status and its test', () => {
    // A Status line's relative link to a later record is made absolute: from a report, a relative one goes nowhere.
    const narrowed = renderContent(report((inputs) => (inputs.records[0].status = 'accepted; narrowed by [0009](0009-a-ch-orf-document.md)')))
    expect(narrowed).toContain('(accepted; narrowed by [0009](https://github.com/sharkysan/formancy.ai-health/blob/c0ffee/docs/decisions/0009-a-ch-orf-document.md))')
    expect(renderContent(report())).toContain(
      '- A host must keep a number’s text. — stated by [0004 Write and read FHIR JSON exactly](https://github.com/sharkysan/formancy.ai-health/blob/c0ffee/docs/decisions/0004-fhir-json-is-written-and-read-exactly.md#consequences) (accepted); held by `packages/health-core/src/numbers.test.ts`, passed in this run',
    )
    expect(renderContent(report())).toContain('None: nothing here fails the run.')
  })

  // Every section names where it comes from, so a reader can check one.
  test('says how each section was made', () => {
    const markdown = renderContent(report())
    const method = markdown.slice(markdown.indexOf('## How this report was made'), markdown.indexOf('## Problems'))
    for (const section of ['Subject', 'Tested on', 'Results', 'Validator', 'Build identity', 'Release gates', 'Known limitations', 'Problems']) expect(method).toContain(`- **${section}:**`)
  })
})

describe('the subject and the summary', () => {
  // A report that does not say which run, commit and release it is of
  // cannot be told apart from another one.
  test('name the version, the release, the commit and the run', () => {
    const inputs = copy(greenCiRun())
    inputs.release = 'dry-run'
    const markdown = renderReport(buildReport(inputs))
    expect(markdown).toContain('Formancy Health 0.1.0, a rehearsal (`dry-run`); nothing is published from it. Commit `c0ffee`. Run [42](https://github.com/sharkysan/formancy.ai-health/actions/runs/42) of CI, attempt 1.')
    expect(markdown).toContain('| validator | 1 | ubuntu24 20261012.1 | v22.20.0 | linux x64 |')
    expect(renderReport(report(), { local: true, partial: ['validator'] })).toContain('local: no NEEDS, no artefacts; partial: validator allowed missing.')
    // A local run of a tree with uncommitted changes did not run that commit.
    expect(renderReport(report((inputs) => (inputs.results[0].dirty = true)), { local: true })).toContain('Commit `c0ffee`, with uncommitted changes.')
    expect(renderReport(report(), { local: true })).toContain('Commit `c0ffee`. Generated')
  })

  // The body says where the whole report is and which changelog section it
  // opens with; a release reader otherwise cannot find either.
  test('carries the link to the full report, the section the notes are from, and the counts', () => {
    const summary = renderSummary(report(), { section: 'Unreleased', link: 'https://example.invalid/report.md' })
    expect(summary).toContain('The full report of the run that gated this: https://example.invalid/report.md')
    expect(summary).toContain('The notes above are CHANGELOG.md’s `Unreleased` section.')
    expect(summary).toContain('5 of 5 tests passed across 4 packages; the install gate passed; the validator gate passed, 2 resources judged as the corpus expects.')
  })
})
