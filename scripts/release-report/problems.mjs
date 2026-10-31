// What fails the report (0011; formancy.ai-report 0014), for what it shows
// of results, the browser gate and the README pictures' check (0016), the
// install gate, the validator gate,
// build identity, the release gates and the limitations: one sentence
// each, written into the report's `problems` and making the job exit 1.
// Both files are still written, so a red run says why.
//
// Pure over a built report. `allowMissing` names what a local, partial
// report may lack (verify, browser, install, validator), each a reader of
// collect.mjs: a file that reader did not find, what rests on its job and,
// for browser, a gate or a pictures' check that left nothing are not
// problems. A file it found
// and refused still is. CI allows none.

import { browserName, FACTS, PICTURES_BROWSER } from '../browsers.mjs'
import { unmeasured, unwalked } from './results.mjs'

const list = (items, most = 5) => (items.length <= most ? items.join('; ') : `${items.slice(0, most).join('; ')}; and ${String(items.length - most)} more`)

/**
 * A suite: present, ran something and every test file the checkout holds
 * for it, every test passed -- or skipped and accounted for by the
 * validator job's run of it (results.mjs) -- every file passed, vitest said
 * success. `name` is how the sentence names it.
 */
function suiteProblems(row, name = row.package ?? 'the repository guards') {
  if (!row.present) return [`${name}: no results from its suite`]
  const problems = []
  if (row.tests === 0) problems.push(`${name}: its suite ran no tests`)
  if (!row.listsTestFiles) problems.push(`${name}: its results do not list the test files the checkout holds, so a file its suite did not run would go unseen`)
  if (row.notRun.length > 0)
    problems.push(`${name}: ${String(row.notRun.length)} test file(s) the checkout holds did not run in its suite: ${list(row.notRun)}`)
  const failed = row.notPassed.filter((test) => test.status === 'failed')
  const skipped = row.notPassed.filter((test) => test.status !== 'failed')
  if (failed.length > 0) problems.push(`${name}: ${String(failed.length)} test(s) failed: ${list(failed.map((test) => `${test.file} › ${test.name}`))}`)
  if (skipped.length > 0) {
    problems.push(
      `${name}: ${String(skipped.length)} test(s) did not run (${[...new Set(skipped.map((test) => test.status))].join(', ')}), no run of the validator job passed them, and a suite that can be skipped is a suite that is skipped: ${list(skipped.map((test) => `${test.file} › ${test.name}`))}`,
    )
  }
  for (const file of row.failedFiles) {
    problems.push(
      file.testsPassed
        ? `${name}: ${file.file} failed though every test in it passed: a collection error, or a hook that threw`
        : `${name}: ${file.file} failed`,
    )
  }
  if (!row.success) problems.push(`${name}: vitest reported the run unsuccessful`)
  if (row.numFailedTestSuites > 0) problems.push(`${name}: vitest counted ${String(row.numFailedTestSuites)} failed suite(s)`)
  return problems
}

/**
 * Every project scripts/install-hosts.mjs plans (`plan`, report.mjs's
 * installPlanOf) has one record and no other project has any; each
 * installed and ran exactly the steps the plan names, every one of them to
 * the end; and the guide's blocks went to the project the plan gives them
 * to, and to no other. The gate's own `passed` is one flag its writer
 * sets, and this does not rest on it -- formancy.ai-report 0014 holds its
 * install hosts the same way.
 */
function projectProblems(projects, plan) {
  const recorded = projects.map((project) => project.project)
  const problems = plan
    .filter((meant) => !recorded.includes(meant.project))
    .map((meant) => `the install gate has no record of its ${meant.project} project, which scripts/install-hosts.mjs plans`)
  const seen = new Set()
  for (const project of projects) {
    const meant = plan.find((entry) => entry.project === project.project)
    if (meant === undefined) {
      problems.push(`the install gate recorded a ${String(project.project)} project, which scripts/install-hosts.mjs does not plan`)
      continue
    }
    if (seen.has(project.project)) {
      problems.push(
        `the install gate recorded its ${project.project} project ${String(recorded.filter((name) => name === project.project).length)} times, where it runs each once`,
      )
      continue
    }
    seen.add(project.project)
    if (project.steps.join('\n') !== meant.steps.join('\n'))
      problems.push(
        `the install gate’s ${project.project} project ran ${project.steps.join(', ') || 'no step'}, where scripts/install-hosts.mjs plans ${meant.steps.join(', ')}`,
      )
    else if (project.unfinished.length > 0) problems.push(`the install gate’s ${project.project} project did not finish: ${project.unfinished.join(', ')}`)
    if (meant.guide !== null && (project.guide?.kind !== meant.guide || project.guide.blocks === 0)) {
      problems.push(
        `the install gate gave its ${project.project} project none of docs/getting-started.md’s ${meant.guide} blocks, which scripts/install-hosts.mjs plans it to build`,
      )
    }
    if (meant.guide === null && project.guide !== null) {
      problems.push(
        `the install gate gave its ${project.project} project docs/getting-started.md’s ${String(project.guide.kind)} blocks, which scripts/install-hosts.mjs plans no project but the guide’s to build`,
      )
    }
  }
  return problems
}

/**
 * The install gate passed, ran every project its plan names (above), and
 * packed one tarball per published package, each at the version every
 * package is at.
 */
function installProblems(report, published, allowMissing, plan) {
  const { install } = report.results
  if (install === null) return allowMissing.includes('install') ? [] : ['the install gate left no results']
  const problems = []
  if (!install.passed) problems.push(`the install gate did not pass: ${install.error ?? 'no error was recorded'}`)
  problems.push(...projectProblems(install.projects, plan))
  const packed = install.tarballs.map((tarball) => tarball.name).sort()
  if (packed.join() !== [...published].sort().join())
    problems.push(
      `the install gate packed ${packed.join(', ') || 'nothing'}, where every published package needs exactly one tarball: ${[...published].sort().join(', ')}`,
    )
  // One number for every package, the root manifest's (bump.mjs), so a
  // tarball at another is found on the pull request rather than at the tag.
  for (const tarball of install.tarballs) {
    if (tarball.version !== report.subject.version)
      problems.push(
        `the install gate packed ${tarball.name} ${String(tarball.version)}, where every published package is at the root manifest’s version, ${report.subject.version}`,
      )
  }
  return problems
}

const mode = (headless) => (headless ? 'headless' : 'headed')

/**
 * What `which` launched, against the build Playwright pins for that browser
 * (testedOn's `browser`): one Playwright does not pin, another version,
 * launched otherwise than scripts/browsers.mjs launches it -- Chromium's
 * headless shell and its full browser are pinned at one version, so only
 * how it was launched says which build ran -- or another Playwright than the
 * checkout installs.
 */
function launchProblems(which, launched, ranPlaywright, { playwright, pins }, browsers) {
  const problems = []
  const pin = pins.find((entry) => entry.browser === launched.name)
  if (pin === undefined)
    problems.push(`${which} launched ${launched.name} ${launched.version}, which no gate here runs: the gates run ${browsers.map(browserName).join(', ')}`)
  else {
    if (launched.version !== pin.browserVersion)
      problems.push(`${which} launched ${launched.name} ${launched.version}, not the ${pin.name} ${pin.browserVersion} Playwright ${playwright} pins`)
    if (typeof launched.headless !== 'boolean')
      problems.push(
        `${which} did not record whether it launched ${launched.name} headless, so whether it ran the ${pin.name} Playwright ${playwright} pins is unknown`,
      )
    else if (launched.headless !== pin.headless)
      problems.push(
        `${which} launched ${launched.name} ${mode(launched.headless)}, where scripts/browsers.mjs launches it ${mode(pin.headless)}: another build than the ${pin.name} Playwright ${playwright} pins`,
      )
  }
  if (ranPlaywright !== null && ranPlaywright !== playwright)
    problems.push(`${which} ran Playwright ${ranPlaywright}, where the checkout installs ${playwright}`)
  return problems
}

const NOBODY_CHECKED = 'a check made in one browser and not another is a claim made for that browser by nobody'
const NOBODY_MEASURED = 'a pass made in one browser and not another is a width measured for that browser by nobody'
const passName = (label) => (label === null ? '(before any pass)' : `"${label}"`)
const times = (count) => `${String(count)} ${count === 1 ? 'time' : 'times'}`

/** How often each check was made in one pass: name -> count. */
const tally = (checks) => checks.reduce((counts, name) => counts.set(name, (counts.get(name) ?? 0) + 1), new Map())

/**
 * One app's gates, one per browser in the order the gates run in, compared
 * with the first (0014, as formancy.ai-data's 0058): the same passes, by
 * label and in order, and in each pass the same checks by name, as often.
 * A check's name carries no value of its run, so the names alone say
 * whether two browsers were asked the same questions; a difference in an
 * answer is a failed check, never a missing one.
 */
function sameChecks(app, ran) {
  const [first, ...others] = ran
  const problems = []
  for (const other of others) {
    const [a, b] = [first, other].map((gate) => gate.made.map((entry) => entry.label))
    const [one, two] = [browserName(first.asked), browserName(other.asked)]
    if (a.join('\0') !== b.join('\0')) {
      problems.push(
        `the browser gate of ${app} made its passes as ${a.map(passName).join(', ')} in ${one} and as ${b.map(passName).join(', ')} in ${two}: ${NOBODY_MEASURED}`,
      )
      continue
    }
    for (const [at, entry] of first.made.entries()) {
      const [counts, theirs] = [tally(entry.checks), tally(other.made[at].checks)]
      for (const name of new Set([...counts.keys(), ...theirs.keys()])) {
        const [x, y] = [counts.get(name) ?? 0, theirs.get(name) ?? 0]
        if (x === y) continue
        const where = `"${name}" at ${passName(entry.label)}`
        const said =
          y === 0
            ? `${where} in ${one} and not in ${two}`
            : x === 0
              ? `${where} in ${two} and not in ${one}`
              : `${where} ${times(x)} in ${one} and ${times(y)} in ${two}`
        problems.push(`the browser gate of ${app} made ${said}: ${NOBODY_CHECKED}`)
      }
    }
  }
  return problems
}

/**
 * Each row of 0014's FACTS whose `heldBy` names `app`'s gate, against that
 * gate's run in each browser (`ran`, none in an error): every check the row
 * names, made in some pass. sameChecks compares the browsers with each
 * other, so a check taken out of the gate in every browser at once is no
 * difference there; here it is a row nobody holds.
 */
function unheldFacts(app, ran) {
  const problems = []
  for (const [id, fact] of Object.entries(FACTS)) {
    if (fact.heldBy.gate !== app) continue
    for (const gate of ran) {
      const made = new Set(gate.made.flatMap((entry) => entry.checks))
      for (const name of fact.heldBy.checks) {
        if (!made.has(name))
          problems.push(
            `the browser gate of ${app} in ${browserName(gate.asked)} never made "${name}", which holds 0014’s ${id}: a row no check holds is a sentence nobody measured`,
          )
      }
    }
  }
  return problems
}

/**
 * Every app with a `test:browser` script has its gate in every browser the
 * gates run in (`browsers`): present, no error, no failed check, every pass
 * it planned made with a check in it, and the browser it launched the build
 * Playwright pins for that browser; and its gates in every browser asked
 * the same checks, and every row of 0014's table held. A check that never
 * ran is skipped, and skipped is not passed, as in a suite.
 */
function gateProblems(report, { browserApps, browsers, allowMissing }) {
  const problems = []
  const gates = report.results.browserGates
  for (const app of browserApps) {
    for (const browser of browsers) {
      if (!allowMissing.includes('browser') && !gates.some((gate) => gate.gate === app && gate.asked === browser))
        problems.push(`the browser gate of ${app} left no results in ${browserName(browser)}`)
    }
  }
  for (const gate of gates) {
    const which = `the browser gate of ${gate.gate} in ${browserName(gate.asked)}`
    if (gate.error !== null) problems.push(`${which} ended with an error: ${gate.error}`)
    if (gate.failed.length > 0) problems.push(`${which} failed ${String(gate.failed.length)} check(s): ${list(gate.failed)}`)
    // One that ended in an error stopped where it stopped, for the reason it gives.
    if (gate.error === null) for (const what of unmeasured(gate)) problems.push(`${which} ${what}`)
    if (gate.browser === null) {
      if (gate.error === null) problems.push(`${which} says no browser was launched`)
      continue
    }
    problems.push(...launchProblems(which, gate.browser, gate.playwright, report.testedOn.browser, browsers))
  }
  for (const app of browserApps) {
    // Gates that ended in an error stopped where they stopped; their error is already a problem.
    const ran = browsers.flatMap((browser) => gates.filter((gate) => gate.gate === app && gate.asked === browser && gate.error === null))
    problems.push(...sameChecks(app, ran), ...unheldFacts(app, ran))
  }
  return problems
}

/**
 * Every app with README pictures has its pictures' check (0016): present,
 * no error, every scene scenes.json gives the app walked and no other,
 * nothing found -- a part that says something else than its picture, or a
 * caption that quotes what its parts do not say -- and the browser it
 * walked in the one the pictures are taken in, the build Playwright pins
 * for it. The scenes are scenes.json's, read by the report (results.mjs's
 * `planned`), not the check's word for them.
 */
function picturesProblems(report, { pictureApps, browsers, allowMissing }) {
  const problems = []
  const checks = report.results.pictures
  for (const app of pictureApps) {
    if (!allowMissing.includes('browser') && !checks.some((check) => check.app === app)) problems.push(`the pictures’ check of ${app} left no results`)
  }
  for (const check of checks) {
    const which = `the pictures’ check of ${check.app}`
    if (check.error !== null) problems.push(`${which} ended with an error: ${check.error}`)
    // Problems, not pictures: one stale picture gives its part's diff and its caption's misquote.
    if (check.problems.length > 0)
      problems.push(`${which} found ${String(check.problems.length)} problem(s) with the README’s pictures: ${list(check.problems)}`)
    // One that ended in an error stopped where it stopped, for the reason it gives.
    const skipped = unwalked(check)
    if (check.error === null && skipped.length > 0)
      problems.push(
        `${which} did not walk ${skipped.join(', ')}, which scripts/pictures/scenes.json pictures, so nothing held ${skipped.length === 1 ? 'that picture' : 'those pictures'}`,
      )
    const strays = check.walked.filter((id) => !check.planned.includes(id))
    if (strays.length > 0)
      problems.push(`${which} walked ${strays.join(', ')}, which scripts/pictures/scenes.json does not give ${check.app}: it walked another checkout’s scenes`)
    if (check.planned.length === 0) problems.push(`${which} had no scene to walk: scripts/pictures/scenes.json gives ${check.app} none`)
    if (check.browser === null) continue
    if (check.browser.name !== PICTURES_BROWSER)
      problems.push(`${which} launched ${check.browser.name}, where the README’s pictures are taken in ${PICTURES_BROWSER} alone (scripts/browsers.mjs)`)
    else problems.push(...launchProblems(which, check.browser, check.playwright, report.testedOn.browser, browsers))
  }
  return problems
}

const sorted = (keys) => [...keys].sort().join(', ')

/**
 * The validator gate (0005), from the file it writes however it ends: one
 * that did not pass says why in its own problems; one that says it passed is
 * held again here -- it judged something, every resource as the corpus
 * expects (results.mjs reads each row's counts as well as its verdict), the
 * validator the checkout pins by version and by the hash of the JAR that
 * ran, against the register the checkout holds as the gate laid it out,
 * which is exactly what the validator loaded, offline by the command line
 * it spawned (validator.mjs measures each) -- and its job's run of the registers' test is a suite
 * like any other. `pin` is docs/release/validator.json, `registered` the
 * `id#version` of every package docs/release/ig-packages.json names.
 */
function validatorProblems(report, { pin, registered, allowMissing }) {
  const { gate, suite } = report.results.validator
  const problems = []
  if (gate === null) {
    if (!allowMissing.includes('validator')) problems.push('the validator gate left no results')
  } else if (!gate.passed) {
    // One that stopped stopped where it stopped, for the reasons it gives.
    problems.push(`the validator gate did not pass: ${gate.problems.length === 0 ? 'no problem was recorded' : list(gate.problems)}`)
  } else {
    if (gate.problems.length > 0)
      problems.push(`the validator gate says it passed, and records ${String(gate.problems.length)} problem(s): ${list(gate.problems)}`)
    if (gate.resources === 0) problems.push('the validator gate judged no resource, so it passed with nothing to check')
    if (gate.notAsExpected.length > 0)
      problems.push(`the validator gate judged ${String(gate.notAsExpected.length)} resource(s) otherwise than the corpus expects: ${list(gate.notAsExpected)}`)
    if (gate.reported !== pin.version)
      problems.push(`the validator gate ran validator ${String(gate.reported)}, where docs/release/validator.json pins ${pin.version}`)
    if (gate.sha256 !== pin.sha256)
      problems.push(`the validator gate ran a JAR it records as ${String(gate.sha256)}, not the ${pin.sha256} docs/release/validator.json registers`)
    if (sorted(gate.registered) !== sorted(registered))
      problems.push(
        `the validator gate ran against a register of ${sorted(gate.registered) || 'nothing'}, where docs/release/ig-packages.json registers ${sorted(registered)}`,
      )
    if (gate.loaded === null) problems.push('the validator gate recorded nothing the validator loaded, so whether it loaded the register cannot be told')
    else if (sorted(gate.loaded) !== sorted(registered))
      problems.push(`the validator loaded ${sorted(gate.loaded) || 'nothing'}, where docs/release/ig-packages.json registers ${sorted(registered)}`)
    const offline = gate.offline
    if (offline?.tx !== 'n/a' || offline?.txCache !== 'n/a' || offline?.httpAccess !== false)
      problems.push(`the validator gate records no run without a terminology server and HTTP access: ${JSON.stringify(offline)}`)
  }
  if (suite.present) problems.push(...suiteProblems(suite, 'the validator job’s run of the registers’ test'))
  return problems
}

/** One `dist/` per published package, whichever job built it and in the tarball npm receives. */
function identityProblems(report) {
  const problems = []
  for (const entry of report.results.buildIdentity) {
    // One hash among none is identical to itself: a tarball no job's build
    // is recorded beside is compared with nothing, and says nothing of it.
    if (entry.tarball !== null && entry.builds.length === 0)
      problems.push(`${entry.package}: no job recorded its dist/, so the dist/ in its tarball is compared with nothing`)
    if (entry.identical) continue
    const byHash = new Map()
    for (const build of entry.builds) byHash.set(build.distHash, [...(byHash.get(build.distHash) ?? []), build.job])
    const tarball = entry.tarball?.distHash
    if (tarball !== undefined && !byHash.has(tarball)) {
      problems.push(`${entry.package}: the dist/ in its tarball differs from the dist/ built in ${entry.builds.map((build) => build.job).join(', ')}`)
    }
    if (byHash.size > 1)
      problems.push(
        `${entry.package}: two jobs built different dist/ bytes: ${[...byHash].map(([hash, jobs]) => `${jobs.join(', ')} built ${hash.slice(0, 19)}`).join('; ')}`,
      )
  }
  return problems
}

/** A limitation held by a test that did not pass, and a register that does not hold. */
function limitationProblems(report) {
  const problems = report.limitations.registerProblems.map((problem) => `docs/release/limitations.json: ${problem}`)
  for (const group of report.limitations.stated) {
    for (const line of group.lines) {
      if (line.heldBy !== undefined && line.held !== 'passed')
        problems.push(`${line.number}'s "${line.says}" is held by ${line.heldBy}, which ${line.held === 'absent' ? 'did not run' : 'did not pass'} in this run`)
    }
  }
  return problems
}

/**
 * A local report's results are of one commit and one run, each key once.
 * On a machine the results directory holds whatever was put there -- a
 * collect of another commit, a CI run's artefacts beside this machine's --
 * and nothing else holds them together; in CI, artefacts.mjs holds every
 * artefact to the run.
 */
export function localResultsProblems(results) {
  const by = (value) => {
    const groups = new Map()
    for (const result of results) groups.set(value(result), [...(groups.get(value(result)) ?? []), result.key])
    return groups
  }
  const problems = []
  const commits = by((result) => String(result.commit))
  if (commits.size > 1)
    problems.push(
      `the results are of ${String(commits.size)} commits, where a report is of one: ${[...commits].map(([commit, keys]) => `${commit} (${keys.join(', ')})`).join('; ')}`,
    )
  const runs = by((result) => result.run?.id ?? null)
  if (runs.size > 1)
    problems.push(
      `the results are of ${String(runs.size)} runs, where a report is of one: ${[...runs].map(([id, keys]) => `${id === null ? 'a machine' : `run ${String(id)}`} (${keys.join(', ')})`).join('; ')}`,
    )
  for (const [key, keys] of by((result) => result.key))
    if (keys.length > 1) problems.push(`the results hold ${key} ${String(keys.length)} times, where a run leaves each key once`)
  return problems
}

/** Every job of the gates workflow that leaves results, as the report's `needs` say it ended: anything but success fails the run. */
export function needsProblems(needs, jobs) {
  return jobs.flatMap((job) => {
    const result = needs?.[job]?.result
    if (result === undefined) return [`the report's needs do not name the ${job} job, so how it ended is unknown`]
    return result === 'success' ? [] : [`the ${job} job ended ${String(result)}`]
  })
}

/** How an evidence item that did not pass is said. */
const unpassed = (item) => {
  const what = item.kind === 'job' ? `the ${item.value} job` : item.value
  if (item.local === true) return `${what} has no result outside a gates run`
  return `${what} ${item.outcome === 'absent' ? 'did not run' : item.kind === 'job' ? `ended ${String(item.result)}` : 'did not pass'}`
}

/**
 * Each gate whose evidence did not pass in this run. Locally, where there is
 * no `needs`, a job's evidence cannot pass: what `allowMissing` names is
 * left out, as the partial banner says.
 */
export function releaseGateProblems(gates, allowMissing = []) {
  return gates
    .filter((gate) => gate.state === 'failed')
    .flatMap((gate) => {
      const allowed = (item) => item.outcome === 'absent' && item.kind === 'job' && allowMissing.includes(item.value)
      const items = gate.evidence.filter((item) => item.kind !== 'document' && item.outcome !== 'passed' && !allowed(item))
      return items.length === 0 ? [] : [`gate ${String(gate.gate)}: its evidence did not pass in this run: ${list(items.map(unpassed))}`]
    })
}

/**
 * Every problem of what the run shows: what collect did not find or
 * refused, a section in a job that does not leave it, the suites, the
 * browser gate of each of `browserApps` in each of `browsers`, the
 * pictures' check of each of `pictureApps`, the install gate against
 * `installPlan`, the validator gate and its job's run of the
 * registers' test against `pin` and `registered`, build identity and the
 * limitations.
 */
export function contentProblems(report, { published, installPlan, pin, registered, browserApps = [], browsers = [], pictureApps = [], allowMissing = [] }) {
  return [
    // A file its reader expected and did not find; on a machine, not a
    // problem for a reader the report allows missing, as its banner says.
    // What was found and refused -- stale, another run's, unstarted -- stays
    // one whatever is allowed: it is a file this run did not write.
    ...report.results.absent.filter(({ reader }) => !allowMissing.includes(reader)).map(({ job, file }) => `${job}: expected and not found: ${file}`),
    ...report.results.missing.map(({ job, what }) => `${job}: expected and not found: ${what}`),
    ...report.results.misplaced,
    // A published package with no test:coverage script has no row at all.
    ...published
      .filter((name) => !report.results.packages.some((row) => row.package === name))
      .map((name) => `${name} is published and has no suite: it has no test:coverage script, so no job runs its tests`),
    ...report.results.packages.flatMap((row) => suiteProblems(row)),
    ...(report.results.repository.present || !allowMissing.includes('verify') ? suiteProblems(report.results.repository) : []),
    ...gateProblems(report, { browserApps, browsers, allowMissing }),
    ...picturesProblems(report, { pictureApps, browsers, allowMissing }),
    ...installProblems(report, published, allowMissing, installPlan),
    ...validatorProblems(report, { pin, registered, allowMissing }),
    ...identityProblems(report),
    ...limitationProblems(report),
  ]
}
