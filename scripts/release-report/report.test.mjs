import { describe, expect, test } from 'vitest'
import { HOSTS } from '../install-hosts.mjs'
import { buildReport, installPlanOf } from './report.mjs'
import { ciJob, copy, DIST, greenCiRun, greenRun, INSTALL_PLAN, job, VALIDATOR_ONLY } from './synthetic-run.mjs'

/**
 * What fails a run (0011; formancy.ai-report 0014), for what the report
 * shows of results, the install gate, the validator gate, build identity,
 * the release gates and the limitations: a run made by hand in which
 * everything passed, and each defect introduced into a copy of it once,
 * giving exactly its sentence. Pure logic over hand-made results files.
 */
const problemsOf = (inputs) => buildReport(inputs).problems

/** `greenRun()` with `change` applied to a copy. */
function withDefect(change) {
  const inputs = copy(greenRun())
  change(inputs)
  return problemsOf(inputs)
}

const registers = 'scripts/validator/registers.test.mjs'
/** The test of `file` named `name` in `suite`. */
const testOf = (suite, file, name) => suite.files.find((entry) => entry.file === file).tests.find((entry) => entry.name === name)

describe('a green run', () => {
  // A check that is red on good input is noise, and gets switched off.
  test('has no problems', () => {
    expect(problemsOf(greenRun())).toEqual([])
  })
})

describe('a package’s suite', () => {
  // A package whose job left nothing would be a package nobody tested, in a
  // report that said nothing about it.
  test('with no results fails the run', () => {
    expect(withDefect((inputs) => (inputs.results = inputs.results.filter((result) => result.key !== 'test-health-corpus')))).toEqual(['@formancy/health-corpus: no results from its suite'])
  })

  // CLAUDE.md: a suite that can be skipped is a suite that is skipped.
  test('with a skipped test fails the run', () => {
    expect(
      withDefect((inputs) => {
        job(inputs, 'test-health-core').suites[0].files[0].tests[0].status = 'skipped'
      }),
    ).toEqual([
      '@formancy/health-core: 1 test(s) did not run (skipped), no run of the validator job passed them, and a suite that can be skipped is a suite that is skipped: packages/health-core/src/exactness.test.ts › keeps 0.10 digit for digit',
      // G3 rests on that file: a skipped case is not a passed one there either.
      'gate G3: its evidence did not pass in this run: packages/health-core/src/exactness.test.ts did not pass',
    ])
  })

  test('with a failed test fails the run', () => {
    expect(
      withDefect((inputs) => {
        const file = job(inputs, 'test-health-core').suites[0].files[1]
        file.tests[0].status = 'failed'
        file.status = 'failed'
        job(inputs, 'test-health-core').suites[0].success = false
      }),
    ).toEqual([
      '@formancy/health-core: 1 test(s) failed: packages/health-core/src/numbers.test.ts › refuses an integer past 32 bits',
      '@formancy/health-core: packages/health-core/src/numbers.test.ts failed',
      '@formancy/health-core: vitest reported the run unsuccessful',
      '0004\'s "A host must keep a number’s text." is held by packages/health-core/src/numbers.test.ts, which did not pass in this run',
    ])
  })

  // An afterAll that threw, or a file that failed to collect, leaves every
  // test it reached passed and the file failed: green counts over a red file.
  test('with a failed file whose tests all passed fails the run', () => {
    expect(
      withDefect((inputs) => {
        job(inputs, 'test-health-document').suites[0].files[0].status = 'failed'
      }),
    ).toEqual(['@formancy/health-document: packages/health-document/src/bundle.test.ts failed though every test in it passed: a collection error, or a hook that threw'])
  })

  test('that vitest called unsuccessful, or that ran nothing, fails the run', () => {
    expect(withDefect((inputs) => (job(inputs, 'test-health-document').suites[0].success = false))).toEqual(['@formancy/health-document: vitest reported the run unsuccessful'])
    // A package with no test file at all, whose suite passes empty.
    expect(withDefect((inputs) => Object.assign(job(inputs, 'test-health-corpus').suites[0], { files: [], testFiles: [] }))).toEqual(['@formancy/health-corpus: its suite ran no tests'])
  })

  // A suite that ran part of its files passes every test it ran: a file
  // renamed past its package's vitest include, an include narrowed, or one
  // file run after the whole suite. What it is held to is every test file
  // the checkout holds for it, the include's misses among them.
  test('that did not run a test file the checkout holds fails the run', () => {
    expect(withDefect((inputs) => job(inputs, 'test-health-document').suites[0].testFiles.push('packages/health-document/src/pdf.test.ts'))).toEqual([
      '@formancy/health-document: 1 test file(s) the checkout holds did not run in its suite: packages/health-document/src/pdf.test.ts',
    ])
    expect(withDefect((inputs) => job(inputs, 'verify').suites[0].testFiles.push('scripts/release-report/stray.test.mjs'))).toEqual([
      'the repository guards: 1 test file(s) the checkout holds did not run in its suite: scripts/release-report/stray.test.mjs',
    ])
  })

  // Results that do not say what the checkout holds -- written by a collect
  // from before it listed them -- cannot show a file missing.
  test('whose results do not list the checkout’s test files fails the run', () => {
    expect(withDefect((inputs) => delete job(inputs, 'test-health-document').suites[0].testFiles)).toEqual([
      '@formancy/health-document: its results do not list the test files the checkout holds, so a file its suite did not run would go unseen',
    ])
  })

  // What collect expected and did not find, or found and could not use --
  // a turbo summary, a stale result in local mode -- is not results at all.
  test('whose job missed a file fails the run', () => {
    expect(withDefect((inputs) => job(inputs, 'test-health-document').absent.push({ reader: 'test', file: 'packages/health-document/test-results/vitest.json' }))).toEqual([
      'test-health-document: expected and not found: packages/health-document/test-results/vitest.json',
    ])
    expect(withDefect((inputs) => job(inputs, 'test-health-document').missing.push('a fresh run of @formancy/health-document#test:coverage: turbo replayed it from its cache'))).toEqual([
      'test-health-document: expected and not found: a fresh run of @formancy/health-document#test:coverage: turbo replayed it from its cache',
    ])
  })
})

describe('a published package', () => {
  // One with no test:coverage script has no suite, so no row, no job and no
  // artefact the report expects -- and it ships all the same.
  test('with no suite fails the run', () => {
    expect(
      withDefect((inputs) => {
        inputs.covered = inputs.covered.filter((entry) => entry.name !== '@formancy/health-document')
        inputs.results = inputs.results.filter((result) => result.key !== 'test-health-document')
      }),
    ).toEqual(['@formancy/health-document is published and has no suite: it has no test:coverage script, so no job runs its tests'])
  })
})

describe('the repository’s guards', () => {
  // The verify job's suite is the repository's guards; one that left
  // nothing is a run whose guards nobody ran -- unless a local report says
  // it allowed verify missing. As collect leaves it: no suite, and its file
  // not found under the reader that expected it.
  test('fail the run when they left no results, unless verify is allowed missing', () => {
    const without = (allowMissing) =>
      withDefect((inputs) => {
        Object.assign(job(inputs, 'verify'), { suites: [], absent: [{ reader: 'verify', file: 'test-results/vitest.json' }] })
        inputs.gatesRegister.gates = inputs.gatesRegister.gates.map((entry) => (entry.evidence?.some((item) => item.file?.startsWith('scripts/')) ? { gate: entry.gate, open: 'Nothing.' } : entry))
        inputs.allowMissing = allowMissing
      })
    expect(without([])).toEqual(['verify: expected and not found: test-results/vitest.json', 'the repository guards: no results from its suite'])
    expect(without(['verify'])).toEqual([])
  })
})

describe('the registers’ cases verify skips', () => {
  // The registers' cases that read the validator's downloads and run skip
  // in verify, by design (0005), and the validator job runs them after the
  // gate. A skip is accounted for by that job's pass of the same test, and
  // by nothing else: were the validator job to skip it too, or fail it, the
  // case ran nowhere, and both suites say so.
  test('are accounted for by the validator job’s pass of each, and by nothing else', () => {
    const report = buildReport(greenRun())
    expect(report.results.repository).toMatchObject({ skipped: 1, ranInValidator: 1, allowed: 0, notPassed: [] })
    expect(
      withDefect((inputs) => {
        testOf(job(inputs, 'validator').validator.suite, registers, VALIDATOR_ONLY).status = 'skipped'
      }),
    ).toEqual([
      `the repository guards: 1 test(s) did not run (skipped), no run of the validator job passed them, and a suite that can be skipped is a suite that is skipped: ${registers} › ${VALIDATOR_ONLY}`,
      `the validator job’s run of the registers’ test: 1 test(s) did not run (skipped), no run of the validator job passed them, and a suite that can be skipped is a suite that is skipped: ${registers} › ${VALIDATOR_ONLY}`,
      `gate G2: its evidence did not pass in this run: ${registers} did not pass`,
    ])
  })

  // Accounting is by test, never by file: another case of the same file
  // skipped in verify, which the validator job did not pass, is a skip.
  test('excuse no other case of the file, and no failure', () => {
    expect(
      withDefect((inputs) => {
        testOf(job(inputs, 'verify').suites[0], registers, 'the validator pin › holds').status = 'skipped'
      }),
    ).toEqual([])
    expect(
      withDefect((inputs) => {
        const verify = job(inputs, 'verify').suites[0].files.find((entry) => entry.file === registers)
        verify.tests.push({ name: 'the package register › a case nothing else runs', status: 'skipped', durationMs: 0 })
      }),
    ).toEqual([
      `the repository guards: 1 test(s) did not run (skipped), no run of the validator job passed them, and a suite that can be skipped is a suite that is skipped: ${registers} › the package register › a case nothing else runs`,
      `gate G2: its evidence did not pass in this run: ${registers} did not pass`,
    ])
    expect(
      withDefect((inputs) => {
        const verify = job(inputs, 'verify').suites[0].files.find((entry) => entry.file === registers)
        verify.tests.find((entry) => entry.name === VALIDATOR_ONLY).status = 'failed'
        verify.status = 'failed'
      }),
    ).toEqual([
      `the repository guards: 1 test(s) failed: ${registers} › ${VALIDATOR_ONLY}`,
      `the repository guards: ${registers} failed`,
      `gate G2: its evidence did not pass in this run: ${registers} did not pass`,
    ])
  })

  // A skip in a file the validator job does not run is a skip, however
  // the validator job fares.
  test('excuse no skip in a file the validator job does not run', () => {
    expect(
      withDefect((inputs) => {
        job(inputs, 'verify').suites[0].files[0].tests[0].status = 'skipped'
      }),
    ).toEqual([
      'the repository guards: 1 test(s) did not run (skipped), no run of the validator job passed them, and a suite that can be skipped is a suite that is skipped: scripts/upstream-deps.test.mjs › depends on upstream only at exact released versions',
      'gate G1: its evidence did not pass in this run: scripts/upstream-deps.test.mjs did not pass',
    ])
  })

  // On a machine that did not run the validator, a report may allow it
  // missing; the skips of the files the validator job runs are then allowed,
  // as its banner says, and no other.
  test('are allowed on a machine that allows the validator missing, and only in the files the validator job runs', () => {
    const local = (allowMissing, change = () => {}) =>
      withDefect((inputs) => {
        Object.assign(job(inputs, 'validator'), { validator: null, absent: [{ reader: 'validator', file: 'test-results/validator.json' }] })
        inputs.allowMissing = allowMissing
        change(inputs)
      })
    expect(local([])).toEqual([
      'validator: expected and not found: test-results/validator.json',
      `the repository guards: 1 test(s) did not run (skipped), no run of the validator job passed them, and a suite that can be skipped is a suite that is skipped: ${registers} › ${VALIDATOR_ONLY}`,
      'the validator gate left no results',
      `gate G2: its evidence did not pass in this run: ${registers} did not pass`,
    ])
    expect(local(['validator'])).toEqual([])
    expect(local(['validator'], (inputs) => (job(inputs, 'verify').suites[0].files[0].tests[0].status = 'skipped'))).toEqual([
      'the repository guards: 1 test(s) did not run (skipped), no run of the validator job passed them, and a suite that can be skipped is a suite that is skipped: scripts/upstream-deps.test.mjs › depends on upstream only at exact released versions',
      'gate G1: its evidence did not pass in this run: scripts/upstream-deps.test.mjs did not pass',
    ])
  })
})

describe('the install gate', () => {
  // The install gate is the only gate that runs the packed packages; a run
  // without its record has not shown that anything published works.
  test('fails the run when it left no results, or did not pass', () => {
    expect(withDefect((inputs) => Object.assign(job(inputs, 'install'), { install: null, absent: [{ reader: 'install', file: 'test-results/install.json' }] }))).toEqual([
      'install: expected and not found: test-results/install.json',
      'the install gate left no results',
    ])
    expect(withDefect((inputs) => Object.assign(job(inputs, 'install').install, { passed: false, error: 'tsc --noEmit -p tsconfig.json failed' }))).toEqual(['the install gate did not pass: tsc --noEmit -p tsconfig.json failed'])
  })

  // A local report may say it did not run the install gate; it says so in
  // its banner, and a release refuses a partial report.
  test('is allowed missing locally, and only when the report says so', () => {
    expect(
      withDefect((inputs) => {
        Object.assign(job(inputs, 'install'), { install: null, absent: [{ reader: 'install', file: 'test-results/install.json' }] })
        inputs.allowMissing = ['install']
      }),
    ).toEqual([])
  })

  // One tarball per published package is what a release publishes; one
  // missing is a package left behind, one too many a package nobody meant to.
  test('fails the run when it packed other than one tarball per published package', () => {
    expect(withDefect((inputs) => job(inputs, 'install').install.tarballs.pop())).toEqual([
      'the install gate packed @formancy/health-core, @formancy/health-document, where every published package needs exactly one tarball: @formancy/health-core, @formancy/health-document, @formancy/health-questionnaire',
    ])
  })

  // One number for every package is what a release publishes (bump.mjs); a
  // tarball at another is found on the pull request, not at the tag.
  test('fails the run when a tarball’s version is not the version every package is at', () => {
    expect(withDefect((inputs) => (job(inputs, 'install').install.tarballs[1].version = '0.2.0'))).toEqual([
      'the install gate packed @formancy/health-document 0.2.0, where every published package is at the root manifest’s version, 0.1.0',
    ])
  })

  // The gate's `passed` is one flag its writer sets. Held to it alone, a
  // gate that dropped the guide's project -- the program formancy.ai-report
  // 0015 has the gate compile and run -- or never ran a step of one would
  // leave the report green. Each project scripts/install-hosts.mjs plans
  // must have a record, and none it does not plan; the `passed` beside each
  // defect below stays true.
  test('fails the run when a project the plan names has no record, or one it does not name has', () => {
    const consumers = (inputs) => job(inputs, 'install').install.consumers
    expect(withDefect((inputs) => consumers(inputs).pop())).toEqual(['the install gate has no record of its guide project, which scripts/install-hosts.mjs plans'])
    expect(withDefect((inputs) => (job(inputs, 'install').install.consumers = []))).toEqual([
      'the install gate has no record of its node project, which scripts/install-hosts.mjs plans',
      'the install gate has no record of its guide project, which scripts/install-hosts.mjs plans',
    ])
    expect(withDefect((inputs) => consumers(inputs).push({ ...structuredClone(consumers(inputs)[0]), project: 'browser' }))).toEqual(['the install gate recorded a browser project, which scripts/install-hosts.mjs does not plan'])
    expect(withDefect((inputs) => consumers(inputs).push(structuredClone(consumers(inputs)[0])))).toEqual(['the install gate recorded its node project 2 times, where it runs each once'])
  })

  // A project that stopped before npm finished, or before a step, ran
  // nothing it says; one that recorded other steps than the plan's ran
  // something else, and "every step done" over no steps is no step done.
  test('fails the run when a project did not finish, or ran other steps than the plan', () => {
    const guide = (inputs) => job(inputs, 'install').install.consumers[1]
    expect(withDefect((inputs) => (guide(inputs).npmInstalled = false))).toEqual(['the install gate’s guide project did not finish: npm install'])
    expect(withDefect((inputs) => (guide(inputs).steps[1].done = false))).toEqual(['the install gate’s guide project did not finish: guide: run'])
    expect(withDefect((inputs) => (guide(inputs).steps = []))).toEqual(['the install gate’s guide project ran no step, where scripts/install-hosts.mjs plans type-check, guide: run'])
  })

  // The guide is built by the project the plan gives it, and by no other: a
  // guide project handed no block runs an empty program and passes, and a
  // consumer handed the guide resolves what its section 1 installs.
  test('fails the run when the guide’s blocks are not where the plan puts them', () => {
    const consumers = (inputs) => job(inputs, 'install').install.consumers
    expect(withDefect((inputs) => (consumers(inputs)[1].guide = null))).toEqual(['the install gate gave its guide project none of docs/getting-started.md’s node blocks, which scripts/install-hosts.mjs plans it to build'])
    expect(withDefect((inputs) => (consumers(inputs)[1].guide.blocks = []))).toEqual(['the install gate gave its guide project none of docs/getting-started.md’s node blocks, which scripts/install-hosts.mjs plans it to build'])
    expect(withDefect((inputs) => (consumers(inputs)[0].guide = structuredClone(consumers(inputs)[1].guide)))).toEqual([
      'the install gate gave its node project docs/getting-started.md’s node blocks, which scripts/install-hosts.mjs plans no project but the guide’s to build',
    ])
  })

  // The plan the report holds the gate to is install-hosts.mjs's, read by
  // the same function loadInputs reads it with; the synthetic run's is held
  // to it here, so a project added there is a project every test above sees.
  test('is held to the projects scripts/install-hosts.mjs plans', () => {
    expect(installPlanOf(HOSTS)).toEqual(INSTALL_PLAN)
  })
})

describe('the validator gate', () => {
  const gate = (inputs) => job(inputs, 'validator').validator.gate

  // The gate is the only proof of conformance (0005); a run without its
  // file judged nothing the packages write.
  test('fails the run when it left no results', () => {
    expect(withDefect((inputs) => Object.assign(job(inputs, 'validator'), { validator: null, absent: [{ reader: 'validator', file: 'test-results/validator.json' }] }))).toEqual([
      'validator: expected and not found: test-results/validator.json',
      `the repository guards: 1 test(s) did not run (skipped), no run of the validator job passed them, and a suite that can be skipped is a suite that is skipped: ${registers} › ${VALIDATOR_ONLY}`,
      'the validator gate left no results',
      `gate G2: its evidence did not pass in this run: ${registers} did not pass`,
    ])
  })

  // A gate that failed says why in its own problems, and stopped where it
  // stopped: what it then did not do is not said again.
  test('fails the run with its own problems when it did not pass', () => {
    expect(withDefect((inputs) => Object.assign(gate(inputs), { passed: false, resources: [], problems: ['questionnaire-intake.json is refused: error sdc-2 at Questionnaire'] }))).toEqual([
      'the validator gate did not pass: questionnaire-intake.json is refused: error sdc-2 at Questionnaire',
    ])
    expect(withDefect((inputs) => Object.assign(gate(inputs), { passed: false, problems: [] }))).toEqual(['the validator gate did not pass: no problem was recorded'])
  })

  // Its `passed` is one flag its writer sets; the verdict is read again
  // from the rows: a resource not judged as the corpus expects, a gate that
  // judged nothing, or one that says it passed with problems is not a pass.
  test('fails the run when it says it passed and its rows or problems say otherwise', () => {
    expect(withDefect((inputs) => (gate(inputs).resources[1].verdict = 'not as expected'))).toEqual([
      'the validator gate judged 1 resource(s) otherwise than the corpus expects: questionnaire-intake-status.json (not as expected)',
    ])
    expect(withDefect((inputs) => (gate(inputs).resources = []))).toEqual(['the validator gate judged no resource, so it passed with nothing to check'])
    expect(withDefect((inputs) => (gate(inputs).problems = ['the registered warning sdc-3 was raised by no resource of the corpus']))).toEqual([
      'the validator gate says it passed, and records 1 problem(s): the registered warning sdc-3 was raised by no resource of the corpus',
    ])
  })

  // A row's `verdict` is a string the gate wrote beside the row's own
  // counts; read alone, it is the gate's word again. Each row is judged
  // again from what it records: an accepted resource refused for nothing,
  // with no error and no warning but the registered ones; a broken one
  // refused for exactly what the corpus expects; and its refusals the count
  // of its errors and its unregistered warnings.
  test('fails the run when a row marked as expected says otherwise in its own counts', () => {
    const rows = (inputs) => gate(inputs).resources
    expect(withDefect((inputs) => Object.assign(rows(inputs)[0], { errors: 3 }))).toEqual([
      'the validator gate judged 1 resource(s) otherwise than the corpus expects: questionnaire-intake.json (marked as expected, and it counts 3 error(s) and 0 unregistered warning(s) beside 0 refusal(s))',
    ])
    expect(withDefect((inputs) => Object.assign(rows(inputs)[0], { errors: 1, refusals: ['error code:value at Questionnaire.status'] }))).toEqual([
      'the validator gate judged 1 resource(s) otherwise than the corpus expects: questionnaire-intake.json (marked as expected, and refused: error code:value at Questionnaire.status)',
    ])
    expect(withDefect((inputs) => Object.assign(rows(inputs)[0], { warnings: 2 }))).toEqual([
      'the validator gate judged 1 resource(s) otherwise than the corpus expects: questionnaire-intake.json (marked as expected, and it counts 0 error(s) and 1 unregistered warning(s) beside 0 refusal(s))',
    ])
    expect(withDefect((inputs) => Object.assign(rows(inputs)[1], { refusals: ['error code:required at Questionnaire.status'] }))).toEqual([
      'the validator gate judged 1 resource(s) otherwise than the corpus expects: questionnaire-intake-status.json (marked as expected, and refused for error code:required at Questionnaire.status, where the corpus expects error code:value at Questionnaire.status)',
    ])
  })

  // The gate is held to the registers this checkout holds, not to its own
  // record of them: a verdict of another validator, another JAR, another
  // register or another load is a verdict about something else.
  test('fails the run when it ran another validator, JAR or register than the checkout pins, or loaded otherwise', () => {
    expect(withDefect((inputs) => (gate(inputs).validator.reported = '7.0.1'))).toEqual(['the validator gate ran validator 7.0.1, where docs/release/validator.json pins 7.0.2'])
    expect(withDefect((inputs) => (gate(inputs).validator.sha256 = 'f'.repeat(64)))).toEqual([`the validator gate ran a JAR it records as ${'f'.repeat(64)}, not the ${'e3'.repeat(32)} docs/release/validator.json registers`])
    expect(withDefect((inputs) => inputs.registered.push('ch.fhir.ig.ch-orf#3.0.2'))).toEqual([
      'the validator gate ran against a register of hl7.fhir.r4.core#4.0.1, hl7.fhir.uv.sdc#4.0.0, where docs/release/ig-packages.json registers ch.fhir.ig.ch-orf#3.0.2, hl7.fhir.r4.core#4.0.1, hl7.fhir.uv.sdc#4.0.0',
      'the validator loaded hl7.fhir.r4.core#4.0.1, hl7.fhir.uv.sdc#4.0.0, where docs/release/ig-packages.json registers ch.fhir.ig.ch-orf#3.0.2, hl7.fhir.r4.core#4.0.1, hl7.fhir.uv.sdc#4.0.0',
    ])
    expect(withDefect((inputs) => gate(inputs).packages.loaded.push('hl7.terminology.r4#7.1.0'))).toEqual([
      'the validator loaded hl7.fhir.r4.core#4.0.1, hl7.fhir.uv.sdc#4.0.0, hl7.terminology.r4#7.1.0, where docs/release/ig-packages.json registers hl7.fhir.r4.core#4.0.1, hl7.fhir.uv.sdc#4.0.0',
    ])
    expect(withDefect((inputs) => (gate(inputs).packages.loaded = null))).toEqual(['the validator gate recorded nothing the validator loaded, so whether it loaded the register cannot be told'])
  })

  // A verdict reached online depends on what a registry and a terminology
  // server said that day (0005). The gate records the options it ran the
  // validator with, read from the command line it spawned
  // (validator.mjs's offlineOf), so a command line that lost
  // `-no-http-access` records HTTP access, and this fails.
  test('fails the run when it records no offline run', () => {
    expect(withDefect((inputs) => (gate(inputs).offline.httpAccess = true))).toEqual(['the validator gate records no run without a terminology server and HTTP access: {"tx":"n/a","txCache":"n/a","httpAccess":true,"consoleRefusals":0}'])
  })

  // The registers' run is a suite like any other: a failure there is a
  // register that no longer says what the bytes or the load say.
  test('fails the run when its job’s run of the registers’ test failed', () => {
    expect(
      withDefect((inputs) => {
        const suite = job(inputs, 'validator').validator.suite
        testOf(suite, registers, 'the validator pin › holds').status = 'failed'
        suite.files[0].status = 'failed'
      }),
    ).toEqual([`the validator job’s run of the registers’ test: 1 test(s) failed: ${registers} › the validator pin › holds`, `the validator job’s run of the registers’ test: ${registers} failed`, `gate G2: its evidence did not pass in this run: ${registers} did not pass`])
  })
})

describe('build identity', () => {
  // Two jobs with different bytes for one package mean the dist/ a
  // dependent's suite ran is not the one npm receives.
  test('fails the run when two jobs built different dist/ bytes', () => {
    const other = `sha256:${'b'.repeat(64)}`
    expect(withDefect((inputs) => (job(inputs, 'test-health-document').dist[0].distHash = other))).toEqual([
      `@formancy/health-core: two jobs built different dist/ bytes: verify, test-health-core, test-health-questionnaire, install, validator built ${DIST.slice(0, 19)}; test-health-document built ${other.slice(0, 19)}`,
    ])
  })

  // A tarball whose package no job recorded building is compared with
  // nothing, and an identity rule that passes on nothing says the published
  // dist/ is a build no job made.
  test('fails the run when no job recorded a published package’s dist/', () => {
    expect(
      withDefect((inputs) => {
        for (const result of inputs.results) result.dist = result.dist.filter((entry) => entry.package !== '@formancy/health-questionnaire')
      }),
    ).toEqual(['@formancy/health-questionnaire: no job recorded its dist/, so the dist/ in its tarball is compared with nothing'])
  })

  // The tarball is what npm receives; its dist/ must be every job's.
  test('fails the run when a tarball’s dist/ differs from the jobs’', () => {
    expect(withDefect((inputs) => (job(inputs, 'install').install.tarballs[1].distHash = `sha256:${'c'.repeat(64)}`))).toEqual([
      '@formancy/health-document: the dist/ in its tarball differs from the dist/ built in verify, install, validator',
    ])
  })
})

describe('the limitations', () => {
  // A line held by a test is printed with "passed in this run"; when that
  // test did not run, the line may no longer hold, and the run says so.
  test('fail the run when the test a line is held by did not run', () => {
    expect(withDefect((inputs) => (inputs.register.records['0004'].limitations[0].heldBy = 'packages/health-core/src/strings.test.ts'))).toEqual([
      '0004\'s "A host must keep a number’s text." is held by packages/health-core/src/strings.test.ts, which did not run in this run',
    ])
  })

  // The register is read every run; one that does not hold is a report of
  // limitations nobody can trust.
  test('fail the run when the register does not hold', () => {
    expect(withDefect((inputs) => (inputs.records[0].hash = 'sha256:12'))).toEqual([
      'docs/release/limitations.json: 0004 changed since it was read: read it again, then run node scripts/release-report/limitations.mjs --stamp 0004',
    ])
  })
})

describe('a section in another job’s results', () => {
  // The install gate's record and the validator's files are read from the
  // job that leaves them, and nowhere else: a collect that filed the gate
  // under verify, and left the validator job's empty, would otherwise read
  // as the validator job's verdict, from a job that never ran the gate.
  test('is not read, and fails the run', () => {
    expect(
      ciDefect((inputs) => {
        ciJob(inputs, 'verify').validator = { gate: ciJob(inputs, 'validator').validator.gate, suite: null }
        ciJob(inputs, 'validator').validator.gate = null
      }),
    ).toEqual(['verify: its results hold the validator gate’s file, which only the validator job leaves', 'the validator gate left no results'])
    expect(
      ciDefect((inputs) => {
        ciJob(inputs, 'verify').install = ciJob(inputs, 'install').install
        ciJob(inputs, 'install').install = null
      }),
    ).toEqual(['verify: its results hold the install gate’s record, which only the install job leaves', 'the install gate left no results'])
    // The registers' run accounts for verify's skips only from the job that ran it after the gate.
    expect(
      ciDefect((inputs) => {
        ciJob(inputs, 'test-health-core').validator = { gate: null, suite: ciJob(inputs, 'validator').validator.suite }
        ciJob(inputs, 'validator').validator.suite = null
      }),
    ).toEqual([
      'test-health-core: its results hold the validator job’s run of the registers’ test, which only the validator job leaves',
      `the repository guards: 1 test(s) did not run (skipped), no run of the validator job passed them, and a suite that can be skipped is a suite that is skipped: ${registers} › ${VALIDATOR_ONLY}`,
      `gate G2: its evidence did not pass in this run: ${registers} did not pass`,
    ])
  })
})

describe('a local report', () => {
  // On a machine the results directory holds whatever was put there: a
  // collect of another commit, or a CI run's artefacts left beside this
  // machine's. Results of two commits or two runs describe neither.
  test('fails when its results are of more than one commit or run, or hold one key twice', () => {
    expect(withDefect((inputs) => (job(inputs, 'install').commit = 'decaf'))).toEqual([
      'the results are of 2 commits, where a report is of one: c0ffee (verify, test-health-core, test-health-questionnaire, test-health-document, test-health-corpus, validator); decaf (install)',
    ])
    expect(withDefect((inputs) => (job(inputs, 'install').run.id = null))).toEqual([
      'the results are of 2 runs, where a report is of one: run 42 (verify, test-health-core, test-health-questionnaire, test-health-document, test-health-corpus, validator); a machine (install)',
    ])
    expect(withDefect((inputs) => inputs.results.push(structuredClone(job(inputs, 'verify'))))).toEqual(['the results hold verify 2 times, where a run leaves each key once'])
  })
})

/** A CI run's problems after `change` to a copy of greenCiRun(). */
function ciDefect(change) {
  const inputs = copy(greenCiRun())
  change(inputs)
  return problemsOf(inputs)
}

describe('a green CI run', () => {
  // Every job's artefact, every need a success: a check red here is noise.
  test('has no problems, and its subject is that run', () => {
    const report = buildReport(greenCiRun())
    expect(report.problems).toEqual([])
    expect(report.subject).toMatchObject({ version: '0.1.0', release: null, commit: 'c0ffee', run: { id: '42' } })
    expect(report.subject.jobs.map((entry) => entry.key)).toEqual(['verify', 'test-health-core', 'test-health-questionnaire', 'test-health-document', 'test-health-corpus', 'install', 'validator'])
  })
})

describe('the run', () => {
  // A job that failed or was cancelled may still have uploaded results that
  // look green; the job's own result is the last word.
  test('fails when a job of the gates ended other than success', () => {
    expect(ciDefect((inputs) => (inputs.needs.verify.result = 'failure'))).toEqual(['the verify job ended failure'])
  })

  // The validator job is a job of the run like any other: when it left no
  // artefact, the report says so, and says what it then has no record of.
  test('fails when the validator job left no artefact, naming what it has no record of', () => {
    expect(ciDefect((inputs) => (inputs.artefacts = inputs.artefacts.filter((entry) => entry.name !== 'release-results-validator')))).toEqual([
      'validator: its job left no artefact release-results-validator',
      `the repository guards: 1 test(s) did not run (skipped), no run of the validator job passed them, and a suite that can be skipped is a suite that is skipped: ${registers} › ${VALIDATOR_ONLY}`,
      'the validator gate left no results',
      `gate G2: its evidence did not pass in this run: ${registers} did not pass`,
    ])
  })

  // A job missing from the report's needs is one whose end it never waited for.
  test('fails when the report’s needs do not name a job', () => {
    expect(ciDefect((inputs) => delete inputs.needs.test)).toEqual(["the report's needs do not name the test job, so how it ended is unknown"])
  })

  // An artefact uploaded twice under one name -- a job re-run that kept both
  // -- would be two answers for one job, one of them read.
  test('fails an artefact that appears twice', () => {
    expect(ciDefect((inputs) => inputs.artefacts.push(structuredClone(inputs.artefacts.find((entry) => entry.name === 'release-results-verify'))))).toEqual(['release-results-verify appears 2 times, where one job leaves it once'])
  })

  // A name the workflow does not give is results the report would read as
  // nobody's, and the job it should have been is then missing.
  test('fails an artefact no job leaves, and names the job whose artefact is then missing', () => {
    expect(ciDefect((inputs) => (inputs.artefacts.find((entry) => entry.name === 'release-results-test-health-corpus').name = 'release-results-test-health-corpse'))).toEqual([
      'test-health-corpus: its job left no artefact release-results-test-health-corpus',
      'release-results-test-health-corpse is no artefact a job of .github/workflows/gates.yml leaves',
    ])
  })

  // A directory holding another key's file is a job reported under the
  // wrong name.
  test('fails an artefact whose results are another job’s', () => {
    expect(ciDefect((inputs) => (inputs.artefacts.find((entry) => entry.name === 'release-results-verify').files[0].result.job = 'install'))).toEqual([
      'release-results-verify holds verify.json, the results of key verify from job install, where it holds verify.json from job verify',
    ])
  })

  // Results from another run -- a re-run's leftovers, or another commit's --
  // describe a run that is not this one.
  test('fails results from another run or another commit', () => {
    expect(ciDefect((inputs) => (ciJob(inputs, 'test-health-core').run.id = '41'))).toEqual(["release-results-test-health-core is from run 41, not this run's 42"])
    expect(ciDefect((inputs) => (ciJob(inputs, 'validator').commit = 'decaf'))).toEqual(["release-results-validator is from commit decaf, not this run's c0ffee"])
  })
})

describe('the release gates', () => {
  // Evidence that did not run is not evidence that passed.
  test('fail the run when a gate’s evidence file did not run', () => {
    expect(
      ciDefect((inputs) => {
        const suite = ciJob(inputs, 'test-health-core').suites[0]
        suite.files = suite.files.filter((entry) => !entry.file.endsWith('exactness.test.ts'))
      }),
    ).toEqual(['@formancy/health-core: 1 test file(s) the checkout holds did not run in its suite: packages/health-core/src/exactness.test.ts', 'gate G3: its evidence did not pass in this run: packages/health-core/src/exactness.test.ts did not run'])
  })

  // G2 rests on the validator job as well; a red job is a gate not passed.
  test('fail the run when a gate’s job did not succeed', () => {
    expect(ciDefect((inputs) => (inputs.needs.validator.result = 'failure'))).toEqual(['the validator job ended failure', 'gate G2: its evidence did not pass in this run: the validator job ended failure'])
  })

  // Locally there is no `needs`, so a job's evidence did not run: a local
  // report says so, unless it allowed that job missing, as its banner says.
  test('fail a local run whose gate rests on a job, unless that job is allowed missing', () => {
    const local = (allowMissing) =>
      withDefect((inputs) => {
        inputs.gatesRegister.gates[0].evidence.push({ job: 'install' })
        inputs.allowMissing = allowMissing
      })
    expect(local([])).toEqual(['gate G1: its evidence did not pass in this run: the install job has no result outside a gates run'])
    expect(local(['install'])).toEqual([])
  })

  // A gate partly evidenced -- G5, whose refusals of a guide version
  // nothing has to refuse -- stays open; its evidence still has to pass.
  test('keep a gate with a reason open, and fail it when the evidence it has did not pass', () => {
    const report = buildReport(greenCiRun())
    expect(report.gates.find((entry) => entry.gate === 'G5')).toMatchObject({ state: 'open', evidence: [{ kind: 'file', outcome: 'passed' }] })
    expect(
      ciDefect((inputs) => {
        const file = ciJob(inputs, 'test-health-questionnaire').suites[0].files[0]
        file.status = 'failed'
        file.tests[0].status = 'failed'
      }),
    ).toEqual([
      '@formancy/health-questionnaire: 1 test(s) failed: packages/health-questionnaire/src/questionnaire.test.ts › refuses an unknown spec version',
      '@formancy/health-questionnaire: packages/health-questionnaire/src/questionnaire.test.ts failed',
      'gate G5: its evidence did not pass in this run: packages/health-questionnaire/src/questionnaire.test.ts did not pass',
    ])
  })

  // The register is read every run; one that does not hold is a report of
  // gates nobody can judge.
  test('fail the run when the register does not hold', () => {
    expect(ciDefect((inputs) => inputs.gatesRegister.gates.splice(4, 1))).toEqual([
      'docs/release/gates.json: the gates are G1, G2, G3, G4, G6, G7, licences, trademark, rehearsal, legal, where the plan has G1, G2, G3, G4, G5, G6, G7, licences, trademark, rehearsal and legal, each once and in order',
    ])
  })

  // A document is stated, and a stated gate is a limitation, not a failure.
  test('show a gate whose evidence is a document as stated, without failing the run', () => {
    const report = buildReport(greenCiRun())
    expect(report.gates.find((entry) => entry.gate === 'rehearsal').state).toBe('stated')
    expect(report.problems).toEqual([])
  })
})

describe('a release', () => {
  // A tag that disagrees with the manifests would publish the wrong version
  // under the right name; found here, before anything is published.
  test('fails when its tag is not the version every package is at', () => {
    expect(ciDefect((inputs) => (inputs.release = 'v0.2.0'))).toEqual(['the release v0.2.0 is not v0.1.0, the version every package is at'])
  })

  // A tag whose version has no section would be released with no notes.
  test('fails when the changelog has no section for its version', () => {
    expect(
      ciDefect((inputs) => {
        inputs.release = 'v0.1.0'
        inputs.changelog = inputs.changelog.replace('## 0.1.0', '## 0.0.9')
      }),
    ).toEqual(['CHANGELOG.md has no section for 0.1.0'])
  })

  // A rehearsal renders the body that would be released: the version's
  // section when it has one, Unreleased otherwise, and with neither it fails.
  test('rehearses with the version’s section, then Unreleased, and fails with neither', () => {
    const rehearsal = (change = () => {}) => {
      const inputs = copy(greenCiRun())
      inputs.release = 'dry-run'
      change(inputs)
      return buildReport(inputs)
    }
    expect(rehearsal().release).toMatchObject({ release: 'dry-run', section: '0.1.0' })
    expect(rehearsal((inputs) => (inputs.changelog = inputs.changelog.replace('## 0.1.0', '## 0.0.9'))).release.section).toBe('Unreleased')
    expect(rehearsal((inputs) => (inputs.changelog = '# Changelog\n\n## 0.0.9\n\nOld.\n')).problems).toEqual(['CHANGELOG.md has no section for Unreleased'])
  })

  // GitHub refuses a body over 125,000 characters, after npm already holds
  // the version; the report refuses it first.
  test('fails a body longer than GitHub accepts, and CI only measures it', () => {
    const long = (release) =>
      ciDefect((inputs) => {
        inputs.release = release
        inputs.changelog = inputs.changelog.replace('The first.', 'x'.repeat(125_000))
      })
    expect(long('v0.1.0')).toEqual([expect.stringMatching(/^the release body is \d+ characters, over the 125000 GitHub accepts$/)])
    expect(long('')).toEqual([])
  })
})
