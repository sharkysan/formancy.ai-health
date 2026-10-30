import { describe, expect, test } from 'vitest'
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
    expect(upstreamDependencyProblems(manifests)).toEqual([])
  })

  // The real pnpm-workspace.yaml against the real lockfile.
  test('exempts from the minimum release age only upstream versions it installs', () => {
    const siblings = new Set(workspaceManifests().map((manifest) => manifest.name))
    expect(releaseAgeExemptionProblems(releaseAgeExemptions(), lockedPackages(), siblings)).toEqual([])
  })
})
