import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, test } from 'vitest'
import { facts, fhirVersionIn, render, stale } from './compatibility.mjs'

/**
 * The compatibility record (plan 12.5; 0005): the README's table of what
 * the packages are built and judged against, derived from where each fact
 * lives -- health-core's FHIR_VERSION, the two registers, the workspace's
 * manifests and the toolchain -- and never typed. A version bumped in any of
 * them and not here fails this until the table is rendered again.
 */
const repo = join(dirname(fileURLToPath(import.meta.url)), '..')

describe('the compatibility record', () => {
  // The failure it exists for: a register or a manifest moved, and the
  // README still names the old tuple.
  test('is what the checkout says (run node scripts/compatibility.mjs --write)', () => {
    expect(stale(repo)?.next).toBeUndefined()
  })

  // Every row comes from a source; a source dropped would leave a row
  // that renders "undefined" and still be current.
  test('names FHIR, every guide and the core, the validator and its Java, Node, TypeScript and pnpm', () => {
    const known = facts(repo)
    const table = render(known)
    expect(table).toContain(`| ${known.fhir} |`)
    for (const entry of known.packages) expect(table).toContain(entry.loadedAs === 'dependency' ? `\`${entry.id}#${entry.version}\`` : `| ${entry.version} |`)
    expect(table).toContain(`| ${known.validator.version}, released ${known.validator.released},`)
    expect(table).toContain(`| ${String(known.validator.java)} or later |`)
    expect(table).not.toMatch(/undefined|null/)
  })

  // An upstream dependency arriving is a row of its own, at the version
  // its manifest pins, and the "none yet" row goes.
  test('lists an upstream @formancy/* package at the version a manifest pins', () => {
    const known = facts(repo)
    const table = render({ ...known, upstream: [{ name: '@formancy/spec', version: '0.5.0', by: ['@formancy/health-questionnaire'] }] })
    expect(table).toContain('| `@formancy/spec` | 0.5.0 | the manifest of `@formancy/health-questionnaire` |')
    expect(table).not.toContain('none yet')
  })

  // The table says what the packages are built against. The demo draws its
  // form with formancy's renderer and wears formancy's themes (0012):
  // listed here, they would read as what the packages need, and a bump of
  // the demo's alone as a change to the packages' tuple.
  test('lists no upstream package only the demo depends on', () => {
    const manifest = (path) => JSON.parse(readFileSync(join(repo, path), 'utf8'))
    const of = (pkg) => Object.keys({ ...pkg.dependencies, ...pkg.devDependencies })
    const packages = readdirSync(join(repo, 'packages')).flatMap((name) => (existsSync(join(repo, 'packages', name, 'package.json')) ? of(manifest(`packages/${name}/package.json`)) : []))
    const demoOnly = of(manifest('apps/demo/package.json')).filter((name) => name.startsWith('@formancy/') && !name.startsWith('@formancy/health-') && !packages.includes(name))
    expect(demoOnly).toContain('@formancy/react')
    expect(facts(repo).upstream.filter(({ name }) => demoOnly.includes(name))).toEqual([])
  })
})

describe('fhirVersionIn', () => {
  // Read as TypeScript parses the source, so the value is the one the
  // package exports, `as const` or not, and never a version a comment or
  // another constant names.
  test('reads the exported FHIR_VERSION, and nothing a comment or another constant says', () => {
    expect(fhirVersionIn(readFileSync(join(repo, 'packages', 'health-core', 'src', 'version.ts'), 'utf8'))).toBe('4.0.1')
    expect(fhirVersionIn("// FHIR_VERSION = '5.0.0'\nexport const FHIR_RELEASE = 'R4'\nexport const FHIR_VERSION = '4.0.1'\n")).toBe('4.0.1')
    expect(fhirVersionIn("export const FHIR_VERSION = ('4.3.0' as const)\n")).toBe('4.3.0')
  })

  test('refuses a FHIR_VERSION that is not a string, absent or given twice', () => {
    expect(() => fhirVersionIn('export const FHIR_VERSION = version()\n')).toThrow(/not a string literal/)
    expect(() => fhirVersionIn("const FHIR_VERSION = '4.0.1'\n")).toThrow(/0 times/)
    expect(() => fhirVersionIn("export const FHIR_VERSION = '4.0.1'\nexport const FHIR_VERSION = '4.0.1'\n")).toThrow(/2 times/)
  })
})
