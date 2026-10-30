import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, test } from 'vitest'
import YAML from 'yaml'
import { BROWSERS, LAUNCH_OPTIONS, PINNED_AS } from '../browsers.mjs'
import { facts as compatibility } from '../compatibility.mjs'
import { packageKey } from '../validator/registers.mjs'
import { published, setupNodeVersions, testedOn, workspace } from './tested-on.mjs'

/**
 * What the checkout says it is tested with (0011; formancy.ai-report 0014),
 * held to the tree: testedOn() to every dependency a published package
 * declares and every upstream package the workspace reaches, and its tuple
 * to the one the README's compatibility table derives. Runs in
 * `pnpm test:repo`, after `pnpm install`; nothing here needs a build.
 */
const repo = join(dirname(fileURLToPath(import.meta.url)), '..', '..')
const facts = testedOn(repo)

const local = new Set(workspace(repo).map(({ manifest }) => manifest.name))

describe('testedOn()', () => {
  // A runtime dependency added to a published package and missing here would
  // be published as a range the report never names beside a version. None
  // has one today, so the check is that the two lists agree, both empty.
  test('names every runtime dependency of every published package, with the package that declares it', () => {
    const declared = published(repo).flatMap(({ manifest }) =>
      Object.entries(manifest.dependencies ?? {})
        .filter(([name, range]) => !local.has(name) && !String(range).startsWith('workspace:') && !name.startsWith('@formancy/'))
        .map(([name, range]) => ({ package: manifest.name, name, range })),
    )
    expect(facts.runtime.map(({ package: owner, name, range }) => ({ package: owner, name, range }))).toEqual(declared)
    expect(published(repo).map(({ manifest }) => manifest.name)).not.toContain('@formancy/health-corpus')
  })

  // The upstream packages the workspace declares are depended on exactly
  // (0002), so the version loaded is the version declared.
  test('names the upstream packages, each loaded at the version declared', () => {
    const direct = facts.upstream.filter((entry) => entry.direct)
    expect(direct.map((entry) => entry.name)).toEqual(expect.arrayContaining(['@formancy/spec', '@formancy/report-render-pdf']))
    for (const entry of direct) expect(entry.version, entry.name).toBe(entry.declared)
  })

  // An SBOM is held to what a consumer's install of the published packages
  // brings: formancy's spec, which health-questionnaire depends on, and
  // what it brings in turn; never Formancy Report's packages, which only
  // the private health-corpus declares, as test support.
  test('marks shipped the upstream packages a published package installs, and none only health-corpus declares', () => {
    const shipped = facts.upstream.filter((entry) => entry.shipped).map((entry) => entry.name)
    const declaredUpstream = published(repo).flatMap(({ manifest }) =>
      Object.keys(manifest.dependencies ?? {}).filter((name) => name.startsWith('@formancy/') && !local.has(name)),
    )
    expect(declaredUpstream).toEqual(['@formancy/spec'])
    expect(shipped).toEqual(expect.arrayContaining(declaredUpstream))
    for (const name of ['@formancy/report-spec', '@formancy/report-runtime', '@formancy/report-render-pdf'])
      expect(
        facts.upstream.find((entry) => entry.name === name),
        name,
      ).toMatchObject({ direct: true, shipped: false })
  })

  // The report and the README state one tuple: two readings of it could
  // disagree, and nothing would say which a release was judged against.
  test('states the tuple the compatibility table states', () => {
    const record = compatibility(repo)
    expect(facts.fhir).toBe(record.fhir)
    expect(facts.validator).toEqual({
      version: record.validator.version,
      released: record.validator.released,
      sha256: record.validator.sha256,
      java: record.validator.java,
    })
    expect(facts.guides.map((entry) => entry.key)).toEqual(record.packages.map(packageKey))
  })

  // Node is what every workflow sets up and what the workspace declares;
  // the tools are what the root loads, as the catalog declares them.
  test('names the Node every workflow sets up, and the tools as the catalog declares them', () => {
    expect(facts.node.ci).toEqual(setupNodeVersions(repo))
    expect(facts.node.ci.length).toBeGreaterThan(0)
    expect(facts.node.engines).toBe(JSON.parse(readFileSync(join(repo, 'package.json'), 'utf8')).engines.node)
    const catalog = YAML.parse(readFileSync(join(repo, 'pnpm-workspace.yaml'), 'utf8')).catalog
    expect(facts.tooling.map((tool) => [tool.name, tool.declared])).toEqual([
      ['typescript', catalog.typescript],
      ['vitest', catalog.vitest],
    ])
    for (const tool of facts.tooling) expect(tool.version, tool.name).toMatch(/^\d+\.\d+\.\d+/)
    expect(facts.packageManager).toMatchObject({ name: 'pnpm', declared: JSON.parse(readFileSync(join(repo, 'package.json'), 'utf8')).packageManager })
  })

  // The report holds what the demo's browser gate launched to the build the
  // installed Playwright pins for every browser of scripts/browsers.mjs,
  // launched as LAUNCH_OPTIONS says: headless Chromium is the headless
  // shell, pinned beside the full browser at one version, so a pin read
  // from the full browser would pass a launch of either.
  test('names the Playwright the demo’s gate loads, and the build it pins for each browser the gates run in', () => {
    const playwright = JSON.parse(readFileSync(join(repo, 'apps', 'demo', 'node_modules', 'playwright', 'package.json'), 'utf8')).version
    expect(facts.browser.playwright).toBe(playwright)
    expect(facts.browser.pins.map((pin) => [pin.browser, pin.name, pin.headless])).toEqual(
      BROWSERS.map((browser) => [browser, PINNED_AS[browser], LAUNCH_OPTIONS.headless]),
    )
    // Chromium's four parts, Firefox's and WebKit's two (157.0, 27.2): a version, whatever its browser's shape.
    for (const pin of facts.browser.pins) expect(pin.browserVersion, pin.name).toMatch(/^\d+(?:\.\d+)+$/)
  })
})
