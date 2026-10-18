import { readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, test } from 'vitest'
import { namedPackages } from './release-report/collect.mjs'
import { collectStep, expectedKeys, gateJobs, readWorkflow, validatorTestFiles } from './workflows.mjs'

/**
 * The shape of the workflows a release depends on, parsed with `yaml`, as
 * formancy.ai-report and formancy.ai-data hold their own (0011;
 * formancy.ai-report 0014): CI and the release run one gates workflow, whose
 * every job collects what it found and whose last job builds the release
 * report from it; the release decides once whether it publishes; every check
 * on what it would publish -- the report among them -- runs in a job that
 * holds `contents: read` and no secret, and pins what it checked; and
 * everything permanent is in one job behind one condition, which publishes
 * only what was pinned, with npm, which nothing can undo, as late as it can
 * be. This holds the shape, not the behaviour: the publish job has never run
 * here, and a rehearsal exercises
 * everything else.
 */
const gates = readWorkflow(undefined, '.github/workflows/gates.yml')
const ci = readWorkflow(undefined, '.github/workflows/ci.yml')
const release = readWorkflow(undefined, '.github/workflows/release.yml')

const PUBLISHING = "${{ github.event_name == 'push' && startsWith(github.ref, 'refs/tags/v') }}"
const ONLY_WHEN_PUBLISHING = "needs.tag.outputs.publishing == 'true'"

/** Every step of every job of a workflow, with its job's id. */
const steps = (workflow) => Object.entries(workflow.jobs).flatMap(([job, definition]) => (definition.steps ?? []).map((step) => ({ job, step })))

/** Every string a step hands to the runner: its run, each `with` and each `env` value. */
const handed = (step) => [step.run, ...Object.values(step.with ?? {}), ...Object.values(step.env ?? {})].filter((value) => typeof value === 'string')

/** A package manager on a command line: npm, npx, pnpm or yarn as a word of its own. */
const PACKAGE_MANAGER = /(?:^|[\s;&|(`])(?:npm|npx|pnpm|yarn)(?:\s|$)/m

/**
 * The steps of the publish job that could reach npm, by id: those handed a
 * secret, and those that run a package manager themselves; and the job's
 * own env, when it hands one to every step.
 */
function npmReach(workflow) {
  const publish = workflow.jobs.publish
  const jobEnv = Object.values(publish.env ?? {}).some((value) => String(value).includes('secrets.')) ? ['(the job’s env)'] : []
  const reaching = publish.steps.filter((step) => handed(step).some((value) => value.includes('secrets.')) || PACKAGE_MANAGER.test(String(step.run ?? '')))
  return [...jobEnv, ...reaching.map((step) => step.id ?? step.name)]
}

/** Every job and step of `workflows` (`{ file: parsed }`) that sets continue-on-error, by file, job and step. */
function continuing(workflows) {
  return Object.entries(workflows).flatMap(([file, workflow]) =>
    Object.entries(workflow.jobs ?? {}).flatMap(([id, job]) => [
      ...(job['continue-on-error'] === undefined ? [] : [`${file}: ${id}`]),
      ...(job.steps ?? []).filter((step) => step['continue-on-error'] !== undefined).map((step) => `${file}: ${id}: ${String(step.id ?? step.name ?? step.run ?? step.uses)}`),
    ]),
  )
}

const repo = join(dirname(fileURLToPath(import.meta.url)), '..')

/** What a module imports by name, statically or with a literal `import()`, outside the files of the repository: `node:` built-ins and packages. */
function foreignImports(file, seen = new Set()) {
  if (seen.has(file)) return []
  seen.add(file)
  const text = readFileSync(file, 'utf8')
  const specifiers = [...text.matchAll(/^\s*(?:import|export)\s[^'"]*?from\s+['"]([^'"]+)['"]|^\s*import\s+['"]([^'"]+)['"]|\bimport\(\s*['"]([^'"]+)['"]\s*\)/gm)].map((match) => match[1] ?? match[2] ?? match[3])
  return specifiers.flatMap((specifier) => (specifier.startsWith('.') ? foreignImports(resolve(dirname(file), specifier), seen) : specifier.startsWith('node:') ? [] : [`${file.slice(repo.length + 1).replaceAll('\\', '/')} imports ${specifier}`]))
}

/**
 * Whether a step installs the workspace: pnpm's install, or npm's in the
 * checkout. The SBOM's npm install is of the tarballs, in a directory of
 * its own under RUNNER_TEMP that the step changes into first, and installs
 * nothing a script of the checkout resolves.
 */
function installsWorkspace(step) {
  const lines = String(step.run ?? '').split('\n').map((line) => line.trim())
  const away = lines.findIndex((line) => /^cd "\$\{RUNNER_TEMP\}\//.test(line))
  return lines.some((line, at) => /\bpnpm (?:install|i|add)\b|\bnpm ci\b/.test(line) || (/\bnpm install\b/.test(line) && (away === -1 || at < away)))
}

describe('the scripts that run without an install', () => {
  // The release's check and publish jobs run with Node and the workspace not
  // installed: a script of theirs that imported a package would fail there
  // and nowhere else -- at the first rehearsal or tag. And every gates job
  // collects what it found even when its install failed, so the report says
  // what failed rather than that nothing came. Each such script, and
  // everything it imports from the repository, imports only Node's
  // built-ins.
  test('import nothing but Node’s built-ins', () => {
    const scripts = []
    for (const [id, job] of Object.entries(release.jobs)) {
      if (job.steps === undefined || job.steps.some(installsWorkspace)) continue
      for (const step of job.steps) for (const [, script] of String(step.run ?? '').matchAll(/\bnode (scripts\/\S+\.mjs)/g)) scripts.push({ id, script })
    }
    expect(scripts.map(({ id, script }) => `${id}: ${script}`)).toEqual(['check: scripts/release/pins.mjs', 'check: scripts/release/pins.mjs', 'publish: scripts/release/pins.mjs', 'publish: scripts/release/publish.mjs'])
    expect([...scripts.map(({ script }) => script), 'scripts/release-report/collect.mjs'].flatMap((script) => foreignImports(join(repo, script)))).toEqual([])
  })

  // A step is read as installing the workspace by pnpm, or by npm in the
  // checkout; the SBOM's npm install, after its step changes into a
  // directory under RUNNER_TEMP, is not, so the check job's scripts are
  // held to Node's built-ins and not excused.
  test('reads which steps install the workspace', () => {
    expect(installsWorkspace({ run: 'pnpm install --frozen-lockfile' })).toBe(true)
    expect(installsWorkspace({ run: 'npm ci' })).toBe(true)
    expect(installsWorkspace({ run: 'npm install' })).toBe(true)
    expect(installsWorkspace({ run: 'npm install --ignore-scripts x.tgz\ncd "${RUNNER_TEMP}/sbom"' })).toBe(true)
    expect(installsWorkspace({ run: 'cd "${RUNNER_TEMP}/sbom"\nnpm install --ignore-scripts x.tgz' })).toBe(false)
    expect(installsWorkspace({ run: 'node scripts/release/pins.mjs check' })).toBe(false)
  })
})

describe('the Node the workflows run', () => {
  // .node-version is what a contributor's version manager reads, and every
  // workflow sets up Node for itself. Were they to name different majors, a
  // change could pass on a laptop and fail in CI, or the other way round,
  // with nothing saying why; and a floor in `engines` above the major would
  // refuse the Node the gates run.
  test('is the major .node-version names, in every workflow, and the floor engines declares', () => {
    const major = readFileSync(join(repo, '.node-version'), 'utf8').trim()
    const workflows = { 'gates.yml': gates, 'ci.yml': ci, 'release.yml': release, 'cla.yml': readWorkflow(undefined, '.github/workflows/cla.yml') }
    const setups = Object.entries(workflows).flatMap(([file, workflow]) =>
      steps(workflow)
        .filter(({ step }) => String(step.uses).startsWith('actions/setup-node@'))
        .map(({ job, step }) => ({ where: `${file}: ${job}`, version: String(step.with?.['node-version']) })),
    )
    expect(setups.length).toBeGreaterThan(0)
    expect(setups.filter(({ version }) => version !== major).map(({ where, version }) => `${where}: ${version}`)).toEqual([])
    expect(JSON.parse(readFileSync(join(repo, 'package.json'), 'utf8')).engines.node).toMatch(new RegExp(`^>=${major}\\.`))
  })
})

describe('ci.yml', () => {
  // CI and the release must run the same gates; two copies of them drift.
  // A secret is handed over by name: `secrets: inherit` would give the gates
  // every secret the repository holds.
  test('is one job that runs gates.yml with the coverage token and nothing else', () => {
    expect(Object.keys(ci.jobs)).toEqual(['gates'])
    expect(ci.jobs.gates.uses).toBe('./.github/workflows/gates.yml')
    expect(ci.jobs.gates.secrets).toEqual({ CODECOV_TOKEN: '${{ secrets.CODECOV_TOKEN }}' })
  })
})

describe('release.yml', () => {
  // A job added beside these would run with whatever it is given, outside
  // the order this file is about.
  test('has exactly its five jobs, on a version tag and on a dispatch', () => {
    expect(Object.keys(release.jobs)).toEqual(['tag', 'npm-token', 'gates', 'check', 'publish'])
    expect(release.on.push.tags).toEqual(['v*'])
    expect(Object.keys(release.on)).toEqual(['push', 'workflow_dispatch'])
    expect(release.permissions).toEqual({ contents: 'read' })
  })

  // The condition written twice is two conditions, one day different; a
  // dispatch must never satisfy it, and a missing output must not either.
  test('decides once, in the tag job, whether this run publishes', () => {
    const mode = release.jobs.tag.steps.find((step) => step.id === 'mode')
    expect(mode.env.PUBLISHING).toBe(PUBLISHING)
    expect(mode.run).toContain('publishing=$PUBLISHING')
    expect(Object.keys(release.jobs.tag.outputs).sort()).toEqual(['publishing', 'release', 'version'])
    expect(JSON.stringify(release).split('startsWith(github.ref').length - 1).toBe(1)
  })

  // The tag is held to the version of a package that publishes, as
  // formancy.ai-data holds its own to data-core's. Read from a manifest no
  // tarball carries, it could agree with a tag while every tarball said
  // another version; pins.mjs would refuse them, but only after the gates had
  // run for a release that could never publish.
  test('holds the tag to health-core’s version, a manifest that publishes', () => {
    const version = release.jobs.tag.steps.find((step) => step.id === 'version')
    expect(version.run).toContain("require('./packages/health-core/package.json').version")
    expect(JSON.parse(readFileSync(join(repo, 'packages', 'health-core', 'package.json'), 'utf8')).private).not.toBe(true)
  })

  // The token is checked beside the gates, and read by no job but the two
  // that run only on a tag's push.
  test('reads NPM_TOKEN only in the npm-token and publish jobs, each behind the one condition', () => {
    expect(release.jobs['npm-token'].if).toBe(ONLY_WHEN_PUBLISHING)
    expect(release.jobs.publish.if).toBe(ONLY_WHEN_PUBLISHING)
    const reading = Object.entries(release.jobs).filter(([, job]) => JSON.stringify(job).includes('secrets.NPM_TOKEN')).map(([id]) => id)
    expect(reading).toEqual(['npm-token', 'publish'])
  })

  // A repository secret is readable by a workflow on any branch a
  // collaborator pushes; one in an environment whose deployment policy
  // admits only `v*` tags is not. The policy is a repository setting no test
  // here can see (REPO-METADATA.md); that the two jobs ask for it is held here.
  test('reads the npm token from the npm environment, in the two jobs that need it and no other', () => {
    expect(Object.entries(release.jobs).filter(([, job]) => job.environment !== undefined).map(([id, job]) => `${id}: ${String(job.environment)}`)).toEqual(['npm-token: npm', 'publish: npm'])
  })

  // The job that installs and builds holds nothing it could misuse; only the
  // job behind the condition may write or sign. No image, so no
  // `packages: write`.
  test('gives publish, and only publish, more than reading the repository', () => {
    for (const [id, job] of Object.entries(release.jobs)) {
      if (id === 'publish' || id === 'gates') continue
      expect(job.permissions ?? { contents: 'read' }, id).toEqual({ contents: 'read' })
    }
    expect(release.jobs.publish.permissions).toEqual({ contents: 'write', 'id-token': 'write' })
  })

  // A release passes no secret to the gates, so the coverage upload never
  // runs in one, and its gates are CI's with the release named.
  test('runs the gates with the release named and no secret', () => {
    expect(release.jobs.gates.uses).toBe('./.github/workflows/gates.yml')
    expect(release.jobs.gates.with).toEqual({ release: '${{ needs.tag.outputs.release }}' })
    expect(release.jobs.gates).not.toHaveProperty('secrets')
  })

  // Every check on the content -- the gates, the report, the tarballs, the
  // SBOM, the body -- runs before the first permanent step, and npm, whose
  // versions nothing can delete, comes after the signatures and before only
  // the GitHub release, which can be edited.
  test('publishes after every check, in one job, with npm second to last', () => {
    const publish = release.jobs.publish
    expect(publish.needs).toEqual(expect.arrayContaining(['tag', 'npm-token', 'gates', 'check']))
    expect(publish.steps.filter((step) => step.if !== undefined).map((step) => step.id ?? step.name)).toEqual([])
    const ids = publish.steps.map((step) => step.id)
    const order = ['downloads-checked', 'sign-sbom', 'sign-report', 'npm-publish', 'github-release']
    expect(ids.filter((id) => order.includes(id))).toEqual(order)
  })

  // npm's versions cannot be taken back, so the token reaches one step: the
  // one after every check and both signatures. Another step of the publish
  // job holding a secret, or running npm itself, could publish before the
  // signatures, or publish what no check passed; the order of the steps by
  // id alone does not see it.
  test('hands the npm token to the npm step alone, and runs no package manager in publish', () => {
    expect(npmReach(release)).toEqual(['npm-publish'])
    const early = structuredClone(release)
    const cosign = early.jobs.publish.steps.findIndex((step) => step.id === 'cosign')
    early.jobs.publish.steps.splice(cosign, 0, { name: 'early', env: { NODE_AUTH_TOKEN: '${{ secrets.NPM_TOKEN }}' }, run: 'for f in release-tarballs/*.tgz; do npm publish "$f" --access public; done' })
    expect(npmReach(early)).toEqual(['early', 'npm-publish'])
    early.jobs.publish.steps[cosign].env = {}
    expect(npmReach(early)).toEqual(['early', 'npm-publish'])
    early.jobs.publish.steps.splice(cosign, 1)
    early.jobs.publish.env.NODE_AUTH_TOKEN = '${{ secrets.NPM_TOKEN }}'
    expect(npmReach(early)).toEqual(['(the job’s env)', 'npm-publish'])
  })

  // Every job of a run can write to its artefacts, `check` included, and
  // cdxgen, which `check` runs, has dependencies nothing locks. So `check`
  // holds the report to this run and pins it and the tarballs before cdxgen
  // runs, and the SBOM after, and `publish` refuses, before it signs
  // anything and again before npm, whatever it downloads that is not what
  // was pinned, or a report that is not this run's, green and whole.
  test('pins the report and the tarballs before cdxgen runs, and publishes nothing else', () => {
    const check = release.jobs.check
    expect(check.outputs).toEqual({ checked: '${{ steps.report-checked.outputs.checked }}', sbom: '${{ steps.sbom-checked.outputs.checked }}' })
    const ids = check.steps.map((step) => step.id)
    expect(ids.filter((id) => ['report-checked', 'sbom', 'sbom-checked'].includes(id))).toEqual(['report-checked', 'sbom', 'sbom-checked'])
    expect(check.steps.slice(0, ids.indexOf('report-checked')).filter((step) => /cdxgen|npx/.test(String(step.run)))).toEqual([])
    expect(check.steps.slice(0, ids.indexOf('report-checked')).filter((step) => String(step.uses).startsWith('actions/download-artifact')).map((step) => step.with.name)).toEqual(['release-report', 'release-tarballs'])
    expect(check.steps.find((step) => step.id === 'report-checked').run).toBe('node scripts/release/pins.mjs check --release "${RELEASE}" --version "${VERSION}" --report release-report release-tarballs >> "$GITHUB_OUTPUT"')
    expect(check.steps.find((step) => step.id === 'sbom-checked').run).toContain('node scripts/release/pins.mjs sbom --report release-report ')
    const publish = release.jobs.publish
    expect(publish.env).toMatchObject({ CHECKED: '${{ needs.check.outputs.checked }}', CHECKED_SBOM: '${{ needs.check.outputs.sbom }}', RELEASE: '${{ needs.tag.outputs.release }}', VERSION: '${{ needs.tag.outputs.version }}' })
    const downloads = publish.steps.findIndex((step) => step.id === 'downloads-checked')
    expect(publish.steps.slice(0, downloads).filter((step) => String(step.uses).startsWith('actions/download-artifact')).map((step) => step.with.name)).toEqual(['release-report', 'release-tarballs', 'release-sbom'])
    expect(publish.steps[downloads].run).toContain('node scripts/release/pins.mjs downloads --release "${RELEASE}" --version "${VERSION}" --report release-report release-tarballs ')
    expect(publish.steps.slice(downloads + 1).filter((step) => String(step.uses).startsWith('actions/download-artifact'))).toEqual([])
    expect(publish.steps.find((step) => step.id === 'npm-publish').run).toBe('node scripts/release/publish.mjs --tarballs release-tarballs --report release-report')
  })

  // cdxgen reading the workspace names the workspace's test tools as
  // required and the packages being published as links, not packages:
  // formancy.ai-report's v0.1.0 tag was refused for an SBOM made that way
  // (its 0017). The SBOM describes what a consumer installs: the tarballs
  // `check` pinned, installed by npm in a project outside the checkout,
  // with no lifecycle script run and the peers left to the host, under the
  // product's name and the release's version; and the workspace is not
  // installed in `check` at all, so nothing can read it by mistake.
  test('makes the SBOM from the pinned tarballs, installed by npm outside the checkout', () => {
    const check = release.jobs.check
    const lines = String(check.steps.find((step) => step.id === 'sbom').run)
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line !== '')
    const at = (pattern) => lines.findIndex((line) => pattern.test(line))
    expect(lines.filter((line) => line.startsWith('npm install'))).toEqual(['npm install --ignore-scripts --legacy-peer-deps --no-audit --no-fund "${GITHUB_WORKSPACE}"/release-tarballs/*.tgz'])
    expect(at(/^cd "\$\{RUNNER_TEMP\}\//)).toBeGreaterThanOrEqual(0)
    expect(at(/^cd "\$\{RUNNER_TEMP\}\//)).toBeLessThan(at(/^printf .*"name": "formancy-health"/))
    expect(at(/^printf .*"name": "formancy-health"/)).toBeLessThan(at(/^npm install /))
    expect(at(/^npm install /)).toBeLessThan(at(/cdxgen@/))
    expect(lines).toContain('--required-only \\')
    expect(lines).toContain('--output "${GITHUB_WORKSPACE}/formancy-health-${RELEASE}-sbom.cdx.json" \\')
    expect(lines.at(-1)).toBe('.')
    expect(check.steps.filter((step) => /\bpnpm\b/.test(String(step.run))).map((step) => step.id ?? step.name ?? step.run)).toEqual([])
    expect(check.steps.filter(installsWorkspace)).toEqual([])
    // The SBOM is held to the install it was read from: npm's lockfile of
    // the directory the step installed the tarballs into, and no other, so
    // a component that install does not hold, or one it holds and the SBOM
    // leaves out, is refused before the SBOM is pinned.
    const project = /^cd "(\$\{RUNNER_TEMP\}\/[^"]+)"$/.exec(lines[at(/^cd "\$\{RUNNER_TEMP\}\//)])[1]
    expect(check.steps.find((step) => step.id === 'sbom-checked').run).toContain(`--installed "${project}/package-lock.json" `)
  })

  // The body is the report job's, built and measured from the changelog and
  // the report's summary before anything was published; a second body
  // built in check could say something the report never did.
  test('builds no release body of its own, and gives the GitHub release the report job’s', () => {
    expect(steps(release).filter(({ step }) => String(step.run ?? '').includes('release-notes.mjs')).map(({ job }) => job)).toEqual([])
    expect(steps(release).filter(({ step }) => step.with?.name === 'release-notes').map(({ job }) => job)).toEqual([])
    expect(release.jobs.publish.steps.find((entry) => entry.id === 'github-release').with.body_path).toBe('release-report/RELEASE_NOTES.md')
  })

  // The release carries the report it was gated by, signed by the identity
  // that signs the SBOM, beside it, and the SBOM's signature. A file missing
  // is a release without it, so a missing match fails.
  test('signs the report and attaches it, the SBOM and their signatures to the GitHub release', () => {
    const publish = release.jobs.publish
    const sign = publish.steps.find((entry) => entry.id === 'sign-report')
    for (const kind of ['md', 'json']) expect(sign.run).toContain(`release-report/release-report.\${kind}`)
    expect(sign.run).toContain('cosign sign-blob --yes')
    const step = publish.steps.find((entry) => entry.id === 'github-release')
    expect(step.with.files.split('\n').map((line) => line.trim()).filter(Boolean)).toEqual([
      'formancy-health-*-sbom.cdx.json',
      'formancy-health-*-sbom.cdx.json.sigstore',
      'formancy-health-*-release-report.md',
      'formancy-health-*-release-report.md.sigstore',
      'formancy-health-*-release-report.json',
      'formancy-health-*-release-report.json.sigstore',
    ])
    expect(step.with.fail_on_unmatched_files).toBe(true)
  })

  // A file named from a ref is a path a dispatch from `feat/x` gives a `/`;
  // every name comes from the tag job's `release` instead.
  test('names nothing from a ref outside the tag job’s mode step', () => {
    const ref = /GITHUB_REF(?:_NAME)?\b|github\.ref(?:_name)?\b/
    const naming = steps(release)
      .filter(({ job, step }) => !(job === 'tag' && step.id === 'mode'))
      .filter(({ step }) => handed(step).some((value) => ref.test(value)))
      .map(({ job, step }) => `${job}: ${step.id ?? step.name ?? step.uses}`)
    expect(naming).toEqual([])
    expect(Object.values(release.jobs).filter((job) => Object.values(job.env ?? {}).some((value) => ref.test(String(value))))).toEqual([])
  })
})

describe('gates.yml', () => {
  // CI and a release both call this, and only this, so a job added beside
  // these five is one both run; it is added here in the same change, with
  // whatever it proves, a collect step and a reader in collect.mjs. Called
  // with the release named, taking the coverage token alone, and only
  // reading.
  test('is its five jobs and the report, called with the release named, the coverage token its one secret, reading only', () => {
    expect(Object.keys(gates.jobs)).toEqual(['verify', 'test', 'browser', 'install', 'validator', 'report'])
    expect(gateJobs(gates)).toEqual(['verify', 'test', 'browser', 'install', 'validator'])
    expect(gates.on.workflow_call.inputs.release).toMatchObject({ type: 'string', default: '' })
    expect(gates.on.workflow_call.secrets).toEqual({ CODECOV_TOKEN: { required: false } })
    expect(gates.permissions).toEqual({ contents: 'read' })
  })

  // A job whose results the report never waits for is a job whose failure
  // it cannot see; one that is cancelled must still leave the report to run.
  test('ends in a report that waits for every other job and runs unless cancelled', () => {
    expect([...gates.jobs.report.needs].sort()).toEqual(gateJobs(gates).sort())
    expect(gates.jobs.report.if).toContain('!cancelled()')
  })

  // The report fails the run on its problems; a report step that ran with
  // another command, or not on what every job uploaded, would pass a run it
  // never read.
  test('builds the report from every job’s results, with the run’s needs and the release named', () => {
    const report = gates.jobs.report.steps.find((step) => String(step.run).includes('scripts/release-report/report.mjs'))
    expect(report.run).toBe('node scripts/release-report/report.mjs --results release-results --out release-report')
    expect(report.env).toEqual({ NEEDS: '${{ toJSON(needs) }}', RELEASE: '${{ inputs.release }}' })
    expect(gates.jobs.report.steps.find((step) => step.with?.name === 'release-report')?.with).toEqual({ name: 'release-report', path: 'release-report/', 'if-no-files-found': 'error', overwrite: true })
  })

  // Merged, two jobs that wrote one key would overwrite each other before
  // the report could see there were two.
  test('downloads every job’s results into a directory of its own', () => {
    const download = gates.jobs.report.steps.find((step) => String(step.uses).startsWith('actions/download-artifact'))
    expect(download.with).toEqual({ pattern: 'release-results-*', path: 'release-results' })
  })

  // A job that collects nothing, or uploads under a name the report cannot
  // match, leaves the report reading nothing for it; and a red job must
  // still say what it found.
  test('has every job collect what it found and upload it under the key collect gives', () => {
    for (const id of gateJobs(gates)) {
      const jobSteps = gates.jobs[id].steps
      const collect = collectStep(gates.jobs[id])
      expect(collect?.run, id).toMatch(new RegExp(`^node scripts/release-report/collect\\.mjs --job ${id}\\b`))
      expect(collect.if, id).toContain('!cancelled()')
      const upload = jobSteps[jobSteps.indexOf(collect) + 1]
      expect(upload.uses, id).toMatch(/^actions\/upload-artifact@/)
      expect(upload.if, id).toContain('!cancelled()')
      expect(upload.with, id).toEqual({ name: 'release-results-${{ steps.collect.outputs.key }}', path: 'release-results/', 'if-no-files-found': 'error', overwrite: true })
    }
  })

  // Every artefact the report expects is derived from this file; the test
  // job gives one per package. No two share a key: the uploads overwrite,
  // so that a job run again replaces its own earlier attempt, and a key two
  // jobs wrote would leave only one of them.
  test('gives the report one key per job and package, and no key twice', () => {
    const keys = expectedKeys(gates, namedPackages()).map((entry) => entry.key)
    expect(new Set(keys).size).toBe(keys.length)
    expect(keys).toEqual(expect.arrayContaining(['verify', 'install', 'validator']))
    expect(keys).not.toContain('test')
    // One per leg of the browser job, keyed by its browser (0014).
    expect(keys.filter((key) => key.startsWith('browser'))).toEqual(['browser-chromium', 'browser-firefox', 'browser-webkit'])
    expect(keys.filter((key) => key.startsWith('test-')).sort()).toEqual(namedPackages().map((entry) => `test-${entry.id}`).sort())
  })

  // A job without a collect step, or one that collects under another job's
  // name, is one the report cannot expect, and so cannot miss.
  test('refuses a job the report could not expect', () => {
    const changed = (change) => {
      const workflow = structuredClone(gates)
      change(workflow)
      return () => expectedKeys(workflow, namedPackages())
    }
    expect(changed((workflow) => (workflow.jobs.validator.steps = workflow.jobs.validator.steps.filter((step) => step.id !== 'collect')))).toThrow('.github/workflows/gates.yml: the validator job has no step with id collect, so it leaves nothing for the report')
    expect(changed((workflow) => (collectStep(workflow.jobs.install).run = 'node scripts/release-report/collect.mjs --job verify'))).toThrow('.github/workflows/gates.yml: the install job collects as --job verify, not as itself')
  })

  // One leg of the browser job per browser (0014). Each leg's results are
  // the file the demo's gate writes in its browser, so the gate runs before
  // the collect step, through turbo, which builds what the demo imports
  // first, never replays the gate and hands it FORMANCY_BROWSERS
  // (turbo.json); the browser it runs in is the build the installed
  // Playwright pins, installed before it, with WebKit's system libraries in
  // WebKit's leg alone; the collect step and the gate's own file are keyed
  // by the leg's browser, so no leg's upload replaces another's; and every
  // leg reports, rather than the first red one cancelling the rest.
  test('runs the demo’s gate in each browser’s leg, after installing that browser, before it collects, and keeps its file', () => {
    const job = gates.jobs.browser
    const browser = job.steps
    const at = (command) => browser.findIndex((step) => step.run === command)
    expect(job.strategy).toEqual({ 'fail-fast': false, matrix: { browser: ['chromium', 'firefox', 'webkit'] } })
    expect(job.name).toBe('browser (${{ matrix.browser }})')
    const install = at('pnpm --filter @formancy/health-demo exec playwright install "$BROWSER"')
    expect(browser[install].env).toEqual({ BROWSER: '${{ matrix.browser }}' })
    const deps = browser.findIndex((step) => step.run === 'pnpm --filter @formancy/health-demo exec playwright install-deps webkit')
    expect(browser[deps].if).toBe("matrix.browser == 'webkit'")
    expect(browser.filter((step) => /install-deps|--with-deps|apt-get/.test(String(step.run))).length).toBe(1)
    const gate = at('pnpm exec turbo run test:browser --filter=@formancy/health-demo')
    expect(browser[gate].env).toEqual({ FORMANCY_BROWSERS: '${{ matrix.browser }}' })
    expect(install).toBeGreaterThan(at('pnpm install --frozen-lockfile'))
    expect(deps).toBeGreaterThan(install)
    expect(gate).toBeGreaterThan(deps)
    const collect = collectStep(job)
    expect(browser.indexOf(collect)).toBeGreaterThan(gate)
    expect(collect.run).toBe('node scripts/release-report/collect.mjs --job browser --variant "$BROWSER"')
    expect(collect.env).toEqual({ BROWSER: '${{ matrix.browser }}' })
    const download = browser.find((step) => String(step.uses).startsWith('actions/cache@') && step.with?.path === '~/.cache/ms-playwright')
    expect(download.with.key).toBe("playwright-${{ runner.os }}-${{ matrix.browser }}-${{ hashFiles('pnpm-lock.yaml') }}")
    expect(browser.find((step) => String(step.with?.name).startsWith('browser-results'))?.with).toEqual({ name: 'browser-results-${{ matrix.browser }}', path: 'apps/demo/test-results/', 'if-no-files-found': 'error', overwrite: true })
    expect(job['runs-on']).toMatch(/^ubuntu-\d+\.\d+$/)
    const demo = JSON.parse(readFileSync(join(repo, 'apps', 'demo', 'package.json'), 'utf8'))
    expect(demo.scripts['test:browser']).toBe('node scripts/browser-test.mjs')
    expect(JSON.parse(readFileSync(join(repo, 'turbo.json'), 'utf8')).tasks['test:browser']).toEqual({ dependsOn: ['build'], passThroughEnv: ['FORMANCY_BROWSERS'], cache: false })
  })

  // Without --force a suite's results could be a cached replay of another
  // commit's; without --summarize nothing records its own start and end.
  test('runs each package fresh, with its own timing, the package from the environment', () => {
    const run = gates.jobs.test.steps.find((step) => String(step.run).includes('turbo run test:coverage'))
    expect(run.run).toBe('pnpm exec turbo run test:coverage --filter="$PACKAGE" --force --summarize')
    expect(run.env).toEqual({ PACKAGE: '${{ matrix.package }}' })
  })

  // continue-on-error turns a failed step green. On a gate, a check the
  // report cannot see -- typecheck, check:pkg, the licences -- fails and the
  // job succeeds; on a signature, npm publishes unsigned and the GitHub
  // release then fails on the missing bundle, after npm holds the version.
  // A job's result is what the report and the release read, so nothing a
  // release runs may set it.
  test('lets no job or step continue on error, here, in CI or in the release', () => {
    expect(continuing({ 'gates.yml': gates, 'ci.yml': ci, 'release.yml': release })).toEqual([])
    const lenient = structuredClone({ 'gates.yml': gates, 'release.yml': release })
    lenient['gates.yml'].jobs.verify.steps.find((step) => step.run === 'pnpm typecheck')['continue-on-error'] = true
    lenient['release.yml'].jobs.publish.steps.find((step) => step.id === 'sign-report')['continue-on-error'] = true
    lenient['release.yml'].jobs.check['continue-on-error'] = true
    expect(continuing(lenient)).toEqual(['gates.yml: verify: pnpm typecheck', 'release.yml: check', 'release.yml: publish: sign-report'])
  })

  // An expression inside a script is text a matrix value or a tag name can
  // write shell into; through `env` it is only ever a value.
  test('puts no expression inside a script, here or in the release', () => {
    for (const workflow of [gates, release]) {
      expect(steps(workflow).filter(({ step }) => String(step.run ?? '').includes('${{')).map(({ job, step }) => `${job}: ${step.name ?? step.run}`)).toEqual([])
    }
  })

  // bash -e stops for a command that fails on a line of its own or in an
  // assignment, never for one inside another command's argument: `echo
  // "path=$(pnpm store path)"` succeeds with an empty output when pnpm
  // fails, and a later step fails for a reason that is not the cause.
  // formancy.ai-report's CI on 2026-10-16 said "Input required and not
  // supplied: path" in the cache step where corepack had timed out
  // downloading pnpm.
  test('runs no command inside an echo, here or in the release, where its failure would be lost', () => {
    for (const workflow of [gates, release]) {
      const hidden = steps(workflow).filter(({ step }) => /^\s*echo\b[^\n]*\$\(/m.test(String(step.run ?? '')))
      expect(hidden.map(({ job, step }) => `${job}: ${step.name ?? step.run}`)).toEqual([])
    }
  })

  // gates.yml is code a release runs with its permissions, and a tag is a
  // pointer whoever owns the action can move.
  test('pins every third-party action to a commit, here and in the release', () => {
    for (const workflow of [gates, release]) {
      const loose = steps(workflow)
        .map(({ step }) => step.uses)
        .filter((uses) => typeof uses === 'string' && !uses.startsWith('actions/') && !uses.startsWith('./'))
        .filter((uses) => !/@[0-9a-f]{40}$/.test(uses))
      expect(loose).toEqual([])
    }
  })

  // A tag's run may restore a cache a main-branch run saved, and a cache is
  // what any code that ran in that job left in the store: a dependency the
  // tests execute could reach the dist/ npm receives through it. CI keeps
  // its caches; a release or a rehearsal installs from the registry against
  // the lockfile.
  test('restores no cache in a release or a rehearsal', () => {
    const caches = steps(gates).filter(({ step }) => String(step.uses).startsWith('actions/cache'))
    expect(caches.length).toBeGreaterThan(0)
    expect(caches.filter(({ step }) => step.if !== "inputs.release == ''").map(({ job, step }) => `${job}: ${step.name ?? step.with?.path}`)).toEqual([])
    expect(steps(release).filter(({ step }) => String(step.uses).startsWith('actions/cache')).map(({ job }) => job)).toEqual([])
  })

  // The tarballs a release publishes are the ones this job installed and ran.
  test('keeps the tarballs the install gate packed, installed and ran', () => {
    const install = gates.jobs.install.steps
    expect(install.map((step) => step.run).filter(Boolean)).toContain('node scripts/install-test.mjs --keep-tarballs release-tarballs')
    expect(install.find((step) => step.with?.name === 'release-tarballs')?.with).toEqual({ name: 'release-tarballs', path: 'release-tarballs/', 'if-no-files-found': 'error', overwrite: true })
  })
})

describe('the validator job', () => {
  const job = gates.jobs.validator
  const runs = job.steps.map((step) => step.run).filter(Boolean)
  const at = (predicate) => job.steps.findIndex(predicate)
  const pin = JSON.parse(readFileSync(join(repo, 'docs', 'release', 'validator.json'), 'utf8'))

  // 0005's gate: the script that fetches, checks, runs and judges, on the
  // corpus health-core writes as built, with the Java setup-java put on the
  // runner -- so the build comes first, and Java before the script.
  test('runs the gate after the build, with the Java it set up', () => {
    const gate = at((step) => step.run === 'node scripts/validator.mjs --java "$JAVA_HOME/bin/java"')
    expect(gate).toBeGreaterThan(at((step) => step.run === 'pnpm build'))
    expect(gate).toBeGreaterThan(at((step) => String(step.uses).startsWith('actions/setup-java@')))
    expect(at((step) => step.run === 'pnpm build')).toBeGreaterThan(-1)
  })

  // setup-java is GitHub's, but the Java it installs runs the validator
  // over everything the job judges; pinned to a commit as a third party's
  // action is, at the Java the pin says the JAR needs, read from the pin.
  test('sets up the Java the validator’s pin needs, from an action pinned to a commit', () => {
    const java = job.steps.find((step) => String(step.uses).startsWith('actions/setup-java@'))
    expect(java.uses).toMatch(/^actions\/setup-java@[0-9a-f]{40}$/)
    expect(java.with).toEqual({ distribution: 'temurin', 'java-version': String(pin.java) })
  })

  // What `pnpm test:repo` cannot see without the downloads and the run --
  // each hash against the bytes, each package's own manifest, the
  // validator's own load -- is checked here, after the gate made them; and
  // told the gate ran, so that a case which found nothing to read fails
  // rather than skipping and passing.
  test('holds the registers against what it downloaded and ran, after the gate, skipping nothing', () => {
    const registers = at((step) => step.run === 'pnpm exec vitest run --config vitest.repo.config.mts scripts/validator/registers.test.mjs')
    expect(registers).toBeGreaterThan(at((step) => String(step.run).startsWith('node scripts/validator.mjs')))
    expect(job.steps[registers].env).toEqual({ VALIDATOR_GATE_RAN: 'true' })
    // What the report reads as the files whose verify skips this run accounts for.
    expect(validatorTestFiles(gates)).toEqual(['scripts/validator/registers.test.mjs'])
  })

  // The report reads the gate's file and the registers' run from this job's
  // checkout: collected before the registers ran, the root vitest.json would
  // be nobody's, and every skip in verify would go unaccounted for. Collected
  // whatever the gate found, so a red gate says why.
  test('collects after the registers’ run, whatever the gate found', () => {
    const collect = job.steps.indexOf(collectStep(job))
    expect(collect).toBeGreaterThan(at((step) => String(step.run).includes('scripts/validator/registers.test.mjs')))
    expect(collectStep(job).run).toBe('node scripts/release-report/collect.mjs --job validator')
  })

  // A download cache would only ever save a download: what is restored is
  // used once its hash is the registered one. It holds the downloads and
  // never the unpacked package cache, which the validator writes into.
  test('caches the downloads alone, keyed on the registers', () => {
    const cache = job.steps.find((step) => String(step.uses).startsWith('actions/cache@') && String(step.with?.path).includes('.fhir-cache'))
    expect(cache.with.path.split('\n').map((line) => line.trim()).filter(Boolean)).toEqual(['.fhir-cache/validator', '.fhir-cache/packages'])
    expect(cache.with.key).toBe("fhir-cache-${{ hashFiles('docs/release/validator.json', 'docs/release/ig-packages.json') }}")
  })

  // The results are the evidence a conformance claim cites, and a failed
  // run's are the ones somebody needs; a run that left none fails here.
  test('uploads its results whatever the run found', () => {
    const upload = job.steps.find((step) => step.with?.name === 'validator-results')
    expect(upload.if).toBe('always()')
    expect(upload.with['if-no-files-found']).toBe('error')
    expect(upload.with.path.split('\n').map((line) => line.trim()).filter(Boolean)).toEqual(['test-results/validator.json', 'test-results/validator/'])
  })

  // A download in a step of its own, or a JAR run by hand, would be one the
  // script never hashed. Everything the job fetches or runs goes through
  // it.
  test('fetches nothing and runs no Java but through the script', () => {
    // A command by its path or quoted counts too: `"$JAVA_HOME/bin/java" -jar`
    // is a Java run by hand. The gate's own step names a Java to the script.
    const command = /(?:^|[\s;&|("'/])(?:curl|wget|java)["']?(?:\s|$)/m
    const gate = 'node scripts/validator.mjs --java "$JAVA_HOME/bin/java"'
    expect(runs.filter((run) => run !== gate && command.test(run))).toEqual([])
    expect(command.test('curl -sSL -o v.jar https://example.org/v.jar')).toBe(true)
    expect(command.test('java -jar v.jar')).toBe(true)
    expect(command.test('"$JAVA_HOME/bin/java" -jar v.jar')).toBe(true)
    expect(command.test('/usr/bin/wget https://example.org/p.tgz')).toBe(true)
    expect(command.test('pnpm exec vitest run scripts/validator/registers.test.mjs')).toBe(false)
  })
})
