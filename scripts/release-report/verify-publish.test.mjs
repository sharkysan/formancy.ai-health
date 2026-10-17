import { createHash } from 'node:crypto'
import { describe, expect, test } from 'vitest'
import { packageTarball } from '../release/test-archive.mjs'
import { BODY_LIMIT } from '../release-notes.mjs'
import { installedTarballProblems, lockedPackages, notesProblems, npmPurl, reportFilesProblems, reportProblems, sbomInstallProblems, sbomReportProblems } from './verify-publish.mjs'

/**
 * What a release refuses of the report before anything permanent happens
 * (0011; formancy.ai-report 0014): the report itself, the tarballs against
 * the install gate's record in it, the body it built, and the SBOM against
 * what it says a consumer's install brings (formancy.ai-report 0017). Over
 * a release made by hand -- two packages, tarballs packed here -- with one
 * defect introduced at a time.
 */
const sha256 = (bytes) => createHash('sha256').update(bytes).digest('hex')
const NAMES = ['@formancy/health-core', '@formancy/health-document']
const fileOf = (name) => `${name.slice(1).replace('/', '-')}-0.1.0.tgz`
const RUN = { release: 'v0.1.0', version: '0.1.0', commit: 'c0ffee', runId: '42' }

/**
 * A release in which everything holds: the report, the tarballs as
 * pins.mjs's `describe` gives them, and the SBOM of a consumer's install of
 * them -- the packages at the release's version, @formancy/spec, which
 * health-questionnaire depends on, and what spec brings, ajv among it.
 * Formancy Report's packages, which only the private health-corpus
 * declares, are in the report's upstream list and not shipped.
 */
function green() {
  const tarballs = NAMES.map((name) => {
    const bytes = packageTarball({ name, version: '0.1.0' })
    return { file: fileOf(name), name, sha256: sha256(bytes) }
  })
  return {
    report: {
      problems: [],
      subject: { version: '0.1.0', release: 'v0.1.0', commit: 'c0ffee', run: { id: '42' } },
      results: {
        buildIdentity: NAMES.map((name) => ({ package: name })),
        install: { tarballs: tarballs.map(({ file, name, sha256: hash }) => ({ name, file, sha256: hash })) },
      },
      testedOn: {
        runtime: [],
        upstream: [
          { name: '@formancy/expressions', version: '0.5.0', direct: false, shipped: false },
          { name: '@formancy/report-runtime', version: '0.1.0', direct: true, shipped: false },
          { name: '@formancy/spec', version: '0.5.0', direct: true, shipped: true },
        ],
      },
    },
    tarballs,
    sbom: {
      components: ['pkg:npm/%40formancy/health-core@0.1.0', 'pkg:npm/%40formancy/health-document@0.1.0', 'pkg:npm/%40formancy/spec@0.5.0', 'pkg:npm/ajv@8.20.0', 'pkg:npm/%40noble/hashes@2.4.0'].map((purl) => ({ purl })),
    },
  }
}

describe('the report', () => {
  // A refusal on good input is a release nobody can cut.
  test('is refused nothing when it is this run’s, green and whole', () => {
    expect(reportProblems(green().report, RUN)).toEqual([])
  })

  // A report of another commit, run, release or version is evidence about
  // something else, however green.
  test('is refused when it is of another commit, run, release or version', () => {
    const { report } = green()
    expect(reportProblems(report, { ...RUN, commit: 'decaf' })).toEqual(['the report is of commit c0ffee, not decaf'])
    expect(reportProblems(report, { ...RUN, runId: '43' })).toEqual(['the report is of run 42, not this run, 43'])
    expect(reportProblems(report, { ...RUN, release: 'dry-run' })).toEqual(['the report is of the release v0.1.0, not dry-run'])
    expect(reportProblems(report, { ...RUN, version: '0.2.0' })).toEqual(['the report is of version 0.1.0, not 0.2.0'])
  })

  // A report that failed, or one made on a machine with parts allowed
  // missing, did not gate this release; one with no list of problems at all
  // is no report this repository wrote.
  test('is refused when it has problems, is partial or local, or lists none at all', () => {
    const with_ = (change) => reportProblems({ ...green().report, ...change }, RUN)
    expect(with_({ problems: ['the validator gate left no results'] })).toEqual(['the report has 1 problem(s), the first: the validator gate left no results'])
    expect(with_({ partial: ['validator'] })).toEqual(['the report is partial: validator allowed missing'])
    expect(with_({ local: true })).toEqual(['the report is a local one, and a release reads only the report its own gates built'])
    expect(with_({ problems: undefined })).toEqual(['the report lists no problems at all, not even none'])
  })

  // The report's directory is pinned whole and handed to publish; a file
  // in it the report job never writes -- a tarball, say -- would be pinned
  // without any check of what it is.
  test('is refused when its directory holds anything but the report and the body', () => {
    expect(reportFilesProblems(['RELEASE_NOTES.md', 'release-report.json', 'release-report.md'])).toEqual([])
    expect(reportFilesProblems(['RELEASE_NOTES.md', 'release-report.json', 'release-report.md', 'formancy-health-core-0.1.0.tgz'])).toEqual(['release-report/formancy-health-core-0.1.0.tgz is no file the report job writes'])
    // The body's absence is notesProblems' to say, once.
    expect(reportFilesProblems(['release-report.md'])).toEqual(['release-report/release-report.json is missing'])
  })
})

describe('the tarballs against the report', () => {
  // One byte different is a tarball no gate installed or ran.
  test('are refused when one is not, byte for byte, the install gate’s', () => {
    const { report, tarballs } = green()
    expect(installedTarballProblems(report, tarballs)).toEqual([])
    tarballs[1] = { ...tarballs[1], sha256: 'f'.repeat(64) }
    expect(installedTarballProblems(report, tarballs)).toEqual([`formancy-health-document-0.1.0.tgz has sha256 ${'f'.repeat(64)}, not that of the formancy-health-document-0.1.0.tgz the install gate installed and ran, ${green().tarballs[1].sha256}`])
  })

  // A package without a tarball is a release that leaves it behind; a
  // tarball of something else is one that publishes what no gate meant to.
  test('are refused when one is missing, or one is no published package’s', () => {
    const { report, tarballs } = green()
    expect(installedTarballProblems(report, tarballs.slice(0, 1))).toEqual(['@formancy/health-document: 0 tarballs, where a release publishes exactly one'])
    expect(installedTarballProblems(report, [...tarballs, { file: 'formancy-health-corpus-0.1.0.tgz', name: '@formancy/health-corpus', sha256: 'a'.repeat(64) }])).toEqual([
      'formancy-health-corpus-0.1.0.tgz is @formancy/health-corpus, which is no published package',
    ])
  })
})

describe('the release body', () => {
  // The GitHub release is the last step, after npm; a body it would refuse
  // must be found before.
  test('is refused when the report job wrote none, or one longer than GitHub accepts', () => {
    expect(notesProblems('## 0.1.0\n\nThe first.\n')).toEqual([])
    expect(notesProblems(null)).toEqual(['the report job wrote no release body'])
    expect(notesProblems('x'.repeat(BODY_LIMIT + 1))).toEqual([`the release body is ${String(BODY_LIMIT + 1)} characters, over the ${String(BODY_LIMIT)} GitHub accepts`])
  })
})

describe('the SBOM', () => {
  // An SBOM made of the workspace, as cdxgen read it before this, names
  // the workspace's tools as required and the packages being published as
  // links, not packages (formancy.ai-report 0017): an inventory of a
  // release names what the release publishes, at its version, first.
  test('is refused without each published package, at the version this release publishes', () => {
    const { report, sbom } = green()
    expect(sbomReportProblems(report, sbom)).toEqual([])
    expect(sbomReportProblems(report, { components: sbom.components.filter((component) => !component.purl.includes('health-document')) })).toEqual(['the SBOM names no @formancy/health-document 0.1.0, which this release publishes'])
    const older = { components: sbom.components.map((component) => (component.purl.includes('health-core') ? { purl: 'pkg:npm/%40formancy/health-core@0.0.9' } : component)) }
    expect(sbomReportProblems(report, older)).toEqual(['the SBOM names no @formancy/health-core 0.1.0, which this release publishes'])
  })

  // An inventory that leaves out the formancy spec health-questionnaire
  // reads forms through omits what every consumer installs; one that names
  // another release of it describes an install nobody tested.
  test('is refused without an upstream package a consumer installs, or with another version than the suites loaded', () => {
    const { report, sbom } = green()
    expect(sbomReportProblems(report, { components: sbom.components.filter((component) => !component.purl.includes('spec@')) })).toEqual(['the SBOM names no @formancy/spec, which a published package depends on'])
    const other = { components: sbom.components.map((component) => (component.purl.includes('spec@') ? { purl: 'pkg:npm/%40formancy/spec@0.4.0' } : component)) }
    expect(sbomReportProblems(report, other)).toEqual(['the SBOM names @formancy/spec 0.4.0, where the suites loaded 0.5.0'])
  })

  // No published package has a runtime dependency of its own today; the
  // first one added is refused when the SBOM leaves it out, or names
  // another version than the suites loaded, as Report's pdfmake is.
  test('is refused without a runtime dependency, or with another version of one', () => {
    const { report, sbom } = green()
    const depending = { ...report, testedOn: { ...report.testedOn, runtime: [{ name: 'left-pad', loaded: '1.3.0' }] } }
    expect(sbomReportProblems(depending, sbom)).toEqual(['the SBOM names no left-pad, which a published package depends on'])
    expect(sbomReportProblems(depending, { components: [...sbom.components, { purl: 'pkg:npm/left-pad@1.2.0' }] })).toEqual(['the SBOM names left-pad 1.2.0, where the suites loaded 1.3.0'])
    expect(sbomReportProblems(depending, { components: [...sbom.components, { purl: 'pkg:npm/left-pad@1.3.0' }] })).toEqual([])
  })

  // Report's v0.1.0 tag was refused for an SBOM that left out what only the
  // private Studio declares: a check that asks for what no consumer
  // installs fails every SBOM that is right. Formancy Report's packages,
  // which only health-corpus declares, are not asked for.
  test('is not asked for an upstream package no published package installs', () => {
    const { report, sbom } = green()
    expect(sbom.components.some((component) => component.purl.includes('report-'))).toBe(false)
    expect(sbomReportProblems(report, sbom)).toEqual([])
  })

  // An SBOM with no components holds nothing: it is refused for each thing
  // it lacks, never passed for having nothing wrong in it.
  test('is refused when it names nothing', () => {
    const { report } = green()
    expect(sbomReportProblems(report, {})).toEqual([
      'the SBOM names no @formancy/spec, which a published package depends on',
      'the SBOM names no @formancy/health-core 0.1.0, which this release publishes',
      'the SBOM names no @formancy/health-document 0.1.0, which this release publishes',
    ])
  })

  // The report holds what the SBOM must name, never what it must not:
  // cdxgen reading the wrong directory, or a closure that brought a tool,
  // would pass it with the workbench in the inventory -- the defect behind
  // formancy.ai-report 0017. So every component is held to the install the
  // SBOM describes, npm's lockfile of the project `check` installed the
  // tarballs into: none it does not hold, and none it holds left out.
  test('is refused for a component the install it describes does not hold, and for one it holds and leaves out', () => {
    const { sbom } = green()
    const lockfile = {
      packages: {
        '': { name: 'formancy-health', version: '0.1.0' },
        ...Object.fromEntries(sbom.components.map(({ purl }) => npmPurl(purl)).map(({ name, version }) => [`node_modules/${name}`, { version }])),
        // A second copy, nested, is a package the install holds too.
        'node_modules/ajv/node_modules/fast-uri': { version: '3.1.8' },
      },
    }
    const whole = { components: [...sbom.components, { purl: 'pkg:npm/fast-uri@3.1.8' }] }
    expect(sbomInstallProblems(whole, lockfile)).toEqual([])
    expect(sbomInstallProblems({ components: [...whole.components, { purl: 'pkg:npm/vitest@5.0.5' }] }, lockfile)).toEqual(['the SBOM names vitest 5.0.5, which the install it describes does not hold'])
    expect(sbomInstallProblems({ components: whole.components.filter(({ purl }) => !purl.includes('ajv')) }, lockfile)).toEqual(['the SBOM leaves out ajv 8.20.0, which the install it describes holds'])
    expect(sbomInstallProblems({ components: [...whole.components, { name: 'a-file', type: 'file' }] }, lockfile)).toEqual(['the SBOM names a-file, a component with no npm package URL, in an inventory of an npm install'])
    // An install that holds nothing holds the SBOM to nothing, and is no install of the tarballs.
    expect(sbomInstallProblems(whole, { packages: { '': { name: 'formancy-health' } } })).toEqual(['the install the SBOM describes holds no package, so nothing it names can be held to it'])
  })

  // The lockfile's own entry is the project, a link is a path and a dev
  // dependency is no consumer's; each package is named as npm installed it,
  // nested or not.
  test('reads the packages an install holds from npm’s lockfile', () => {
    expect(
      lockedPackages({
        packages: {
          '': { name: 'formancy-health', version: '0.1.0' },
          'node_modules/@formancy/spec': { version: '0.5.0' },
          'node_modules/ajv/node_modules/fast-uri': { version: '3.1.8' },
          'node_modules/tool': { version: '1.0.0', dev: true },
          'node_modules/linked': { resolved: '../linked', link: true },
        },
      }),
    ).toEqual([
      { name: '@formancy/spec', version: '0.5.0' },
      { name: 'fast-uri', version: '3.1.8' },
    ])
  })

  // Both spellings a package URL gives a scoped name, and one with a
  // qualifier; a component without an npm package URL is none.
  test('reads a scoped package URL, encoded or not', () => {
    expect(npmPurl('pkg:npm/%40formancy/spec@0.5.0')).toEqual({ name: '@formancy/spec', version: '0.5.0' })
    expect(npmPurl('pkg:npm/@formancy/spec@0.5.0?vcs_url=x')).toEqual({ name: '@formancy/spec', version: '0.5.0' })
    expect(npmPurl('pkg:npm/ajv@8.20.0')).toEqual({ name: 'ajv', version: '8.20.0' })
    expect(npmPurl('pkg:maven/x/y@1')).toBeUndefined()
    expect(npmPurl(undefined)).toBeUndefined()
  })
})
