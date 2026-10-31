import { mkdirSync, mkdtempSync, realpathSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, test } from 'vitest'
import { lockedPackages, releaseAgeExemptionProblems, releaseAgeExemptions, upstreamDependencyProblems, workspaceManifests } from './upstream-deps.mjs'

describe('upstreamDependencyProblems', () => {
  const questionnaire = { name: '@formancy/health-questionnaire', dependencies: { '@formancy/spec': '0.5.0' } }

  // The case 0002 exists for: a range lets upstream move under this repository
  // without a commit saying so, and a protocol resolves it from a checkout.
  // Formancy Report's packages are upstream here as formancy's are: a range
  // on the renderer would move the PDF a Bundle attaches with no commit here.
  test('refuses a range, a workspace link and a path to an upstream package', () => {
    const problems = upstreamDependencyProblems([
      { name: '@formancy/health-questionnaire', dependencies: { '@formancy/spec': '^0.5.0' } },
      { name: '@formancy/health-document', devDependencies: { '@formancy/core': 'workspace:*' } },
      { name: '@formancy/health-report', peerDependencies: { '@formancy/report-render-pdf': 'link:../../../formancy.ai-report/packages/report-render-pdf' } },
      { name: '@formancy/health-report', dependencies: { '@formancy/report-render-pdf': '~0.1.0' } },
    ])
    expect(problems).toHaveLength(4)
    expect(problems[0]).toMatch(/@formancy\/spec@\^0\.5\.0/)
    expect(problems[1]).toMatch(/workspace:\*/)
    expect(problems[2]).toMatch(/link:/)
    expect(problems[3]).toMatch(/@formancy\/report-render-pdf@~0\.1\.0/)
  })

  // A sibling in this workspace is not upstream; `workspace:*` is right for it.
  test('accepts an exact upstream version and a workspace sibling', () => {
    expect(
      upstreamDependencyProblems([
        questionnaire,
        { name: '@formancy/health-core' },
        { name: '@formancy/health-document', dependencies: { '@formancy/health-core': 'workspace:*', '@formancy/report-render-pdf': '0.1.0' } },
      ]),
    ).toEqual([])
  })

  // A pre-release is still a release somebody chose.
  test('accepts an exact pre-release', () => {
    expect(upstreamDependencyProblems([{ name: 'x', dependencies: { '@formancy/core': '0.6.0-rc.1' } }])).toEqual([])
  })
})

describe('workspaceManifests', () => {
  const made = []
  afterEach(() => {
    for (const dir of made.splice(0)) rmSync(dir, { recursive: true, force: true })
  })

  /** A repository of its own under the system's temporary directory, with the manifests it is handed. */
  function repository(rootManifest, packages = {}) {
    const dir = realpathSync(mkdtempSync(join(tmpdir(), 'upstream-deps-')))
    made.push(dir)
    writeFileSync(join(dir, 'package.json'), JSON.stringify(rootManifest))
    for (const [name, manifest] of Object.entries(packages)) {
      mkdirSync(join(dir, 'packages', name), { recursive: true })
      writeFileSync(join(dir, 'packages', name, 'package.json'), JSON.stringify(manifest))
    }
    return dir
  }

  // 0017 pins @formancy/code-style as a root devDependency, which is where
  // the lint and format rules come from: a guard that read only packages/ and
  // apps/ would let ^0.12.0 move the rules under this repository with no
  // commit saying so, and a link: would take them from whatever checkout
  // happened to be on one machine.
  test('reads the root manifest, so a range or a link on the shared lint rules is refused', () => {
    for (const spec of ['^0.12.0', 'workspace:*', 'link:../formancy.ai/packages/code-style']) {
      const dir = repository({ name: 'formancy-health', devDependencies: { '@formancy/code-style': spec } }, { core: { name: '@formancy/health-core' } })
      const manifests = workspaceManifests(dir)
      expect(manifests.map((manifest) => manifest.name)).toEqual(['formancy-health', '@formancy/health-core'])
      expect(upstreamDependencyProblems(manifests)).toEqual([`formancy-health: devDependencies @formancy/code-style@${spec} is not an exact released version`])
    }
  })

  // The pin 0017 makes, and the other half of the case above: reading the
  // root must not refuse what the repository does right.
  test('accepts the shared lint rules pinned exactly at the root', () => {
    const dir = repository({ name: 'formancy-health', devDependencies: { '@formancy/code-style': '0.12.0' } })
    expect(upstreamDependencyProblems(workspaceManifests(dir))).toEqual([])
  })
})

describe('releaseAgeExemptionProblems', () => {
  const siblings = new Set(['@formancy/health-core'])
  const locked = new Set(['@formancy/spec@0.5.0', '@formancy/expressions@0.5.0', 'ajv@8.20.0'])

  // What pnpm writes when a release younger than its minimum age is pinned,
  // and the only thing the exemption is for: upstream, by exact version,
  // installed now -- the transitive `@formancy/expressions` included.
  test('accepts an upstream package at a version the lockfile installs', () => {
    expect(releaseAgeExemptionProblems(['@formancy/spec@0.5.0', '@formancy/expressions@0.5.0'], locked, siblings)).toEqual([])
  })

  // The policy exists for packages nobody here reviews: a third-party package
  // admitted on its first day would be the compromise it guards against.
  test('refuses a package outside the upstream scope, and a sibling', () => {
    const problems = releaseAgeExemptionProblems(['ajv@8.20.0', '@formancy/health-core@0.1.0'], locked, siblings)
    expect(problems).toHaveLength(2)
    expect(problems[0]).toMatch(/ajv@8\.20\.0/)
    expect(problems[1]).toMatch(/@formancy\/health-core@0\.1\.0/)
  })

  // A name alone, or a pattern, admits every later release on its first day,
  // which is a range by another route (0002).
  test('refuses a name without a version, a pattern and a range', () => {
    const problems = releaseAgeExemptionProblems(['@formancy/spec', '@formancy/*', '@formancy/spec@^0.5.0'], locked, siblings)
    expect(problems).toHaveLength(3)
  })

  // An exemption for a version nothing installs any more admits nothing, and
  // left behind it reads as if that version were still in use.
  test('refuses an upstream version the lockfile no longer installs', () => {
    const problems = releaseAgeExemptionProblems(['@formancy/spec@0.4.0'], locked, siblings)
    expect(problems).toHaveLength(1)
    expect(problems[0]).toMatch(/@formancy\/spec@0\.4\.0/)
  })
})

describe('this workspace', () => {
  // The real tree, so the guard is a gate and not an example.
  test('depends on upstream only at exact released versions', () => {
    const manifests = workspaceManifests()
    // health-core today: a walk that found nothing has lost a directory, and
    // would pass by checking nothing.
    expect(manifests.map((manifest) => manifest.name)).toContain('@formancy/health-core')
    // The root manifest, where the lint rules' package is pinned (0017).
    expect(manifests.map((manifest) => manifest.name)).toContain('formancy-health')
    expect(upstreamDependencyProblems(manifests)).toEqual([])
  })

  // The real pnpm-workspace.yaml against the real lockfile.
  test('exempts from the minimum release age only upstream versions it installs', () => {
    const siblings = new Set(workspaceManifests().map((manifest) => manifest.name))
    expect(releaseAgeExemptionProblems(releaseAgeExemptions(), lockedPackages(), siblings)).toEqual([])
  })
})
