// @vitest-environment node
import { existsSync, readFileSync, realpathSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, test } from 'vitest'

/**
 * formancy's packages as the page is built from them (0015). formancy's
 * engine and renderer fill the form through the `@formancy/spec` they
 * depend on, and health-questionnaire writes the Questionnaire and the
 * response through its own: two copies in the page would read one form
 * through two validators, and nothing else would say so -- each manifest
 * is exact, which is all `scripts/upstream-deps.mjs` asks, and the chunk's
 * size limit only warns.
 *
 * Read from what pnpm installed, as Node finds a package: every package
 * the demo's dependencies bring, and theirs, by its real directory. The
 * demo's devDependencies are its suite's and its build's; the one entry of
 * them the page bundles, health-corpus's documents, reaches workspace
 * packages alone (scripts/corpus-documents.test.mjs), so it brings no
 * copy of anything formancy's.
 */
const app = join(dirname(fileURLToPath(import.meta.url)), '..')

interface Manifest {
  readonly name: string
  readonly version: string
  readonly dependencies?: Record<string, string>
  readonly peerDependencies?: Record<string, string>
  readonly peerDependenciesMeta?: Record<string, { readonly optional?: boolean }>
}

const manifestOf = (directory: string): Manifest => JSON.parse(readFileSync(join(directory, 'package.json'), 'utf8')) as Manifest

/** The directory Node loads `name` from for a module in `from`: the nearest node_modules above it that holds it, by its real path. */
function installed(from: string, name: string): string | undefined {
  for (let directory = from; ; directory = dirname(directory)) {
    const candidate = join(directory, 'node_modules', name)
    if (existsSync(join(candidate, 'package.json'))) return realpathSync(candidate)
    if (dirname(directory) === directory) return undefined
  }
}

/** One package installed in one directory, and the packages whose manifests brought it there. */
interface Copy {
  readonly name: string
  readonly version: string
  readonly by: Set<string>
}

/**
 * Every package the dependencies and peers of the package in `root` bring,
 * followed through each one's own, each once by its real directory. A
 * dependency that is not installed is a broken install and throws; an
 * optional peer may be absent.
 */
function brought(root: string): Map<string, Copy> {
  const copies = new Map<string, Copy>()
  const visit = (directory: string): void => {
    const manifest = manifestOf(directory)
    const optional = (name: string): boolean => manifest.peerDependenciesMeta?.[name]?.optional === true
    for (const name of [...Object.keys(manifest.dependencies ?? {}), ...Object.keys(manifest.peerDependencies ?? {})]) {
      const found = installed(directory, name)
      if (found === undefined) {
        if (optional(name)) continue
        throw new Error(`${manifest.name} depends on ${name}, which is not installed where Node would load it from`)
      }
      const known = copies.get(found)
      if (known !== undefined) {
        known.by.add(manifest.name)
        continue
      }
      const { version } = manifestOf(found)
      copies.set(found, { name, version, by: new Set([manifest.name]) })
      visit(found)
    }
  }
  visit(realpathSync(root))
  return copies
}

/** The names `copies` holds in more than one directory, each with its versions and who brought each. */
const twice = (copies: Map<string, Copy>, scope: string): string[] => {
  const byName = new Map<string, Copy[]>()
  for (const copy of copies.values()) if (copy.name.startsWith(scope)) byName.set(copy.name, [...(byName.get(copy.name) ?? []), copy])
  return [...byName]
    .filter(([, found]) => found.length > 1)
    .map(([name, found]) => `${name}: ${found.map((copy) => `${copy.version} for ${[...copy.by].sort().join(', ')}`).join('; ')}`)
}

describe("formancy's packages, as the page is built from them", () => {
  // A guard on the guard: the walk goes through the workspace's packages
  // and into pnpm's store, so the spec it finds is the one formancy's
  // engine, its renderer and health-questionnaire each load, and not only
  // the demo's own.
  test("reach @formancy/spec through formancy's engine and renderer, and health-questionnaire", () => {
    const spec = [...brought(app).values()].filter((copy) => copy.name === '@formancy/spec')
    expect(spec.flatMap((copy) => [...copy.by])).toEqual(
      expect.arrayContaining(['@formancy/core', '@formancy/react', '@formancy/health-questionnaire', '@formancy/health-demo']),
    )
  })

  // A release adopted by the demo and not by the packages -- or the other
  // way round -- puts two copies of one formancy package in the page: two
  // validators reading one form, and two engines' expressions. Each copy is
  // named with what brought it.
  test('are one copy each: one @formancy/spec for the engine and for the export', () => {
    expect(twice(brought(app), '@formancy/')).toEqual([])
  })
})
