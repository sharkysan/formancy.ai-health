import { existsSync, readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import ts from 'typescript'
import { describe, expect, test } from 'vitest'

/**
 * `@formancy/health-corpus/documents`, as built: the corpus's documents
 * without the renderer of its letter, which the demo bundles into its page
 * (0012). What a page relies on, read from the files tsdown wrote:
 *
 * - **It resolves**, by the package's own name through its manifest's
 *   `exports`, as a bundler resolves it, to a module and its types.
 * - **It is the code the gate ran**: each of its exports is the very
 *   function or constant the package's index exports, one module and not a
 *   copy, so the Bundles a page assembles are made by what made the
 *   validator's.
 * - **It reaches workspace packages alone**, through every file it imports,
 *   transitively: no upstream package -- Formancy Report's renderer least
 *   of all, which 0008 admits as test support and not into a page -- and no
 *   module of Node's, which a browser does not have.
 *
 * Imports are read by TypeScript's own scanner of a file's imports, every
 * `import`, `export ... from` and `import()`, never matched by a pattern of
 * ours. It reads `packages/health-corpus/dist`, so it needs `pnpm build`, as
 * the corpus guard does.
 */
const repo = join(dirname(fileURLToPath(import.meta.url)), '..')
const PACKAGE = join(repo, 'packages', 'health-corpus')
const manifest = JSON.parse(readFileSync(join(PACKAGE, 'package.json'), 'utf8'))
if (!existsSync(join(PACKAGE, 'dist', 'index.mjs'))) throw new Error('scripts/corpus-documents.test.mjs reads health-corpus as built: run pnpm build first')

/** The file `specifier` resolves to from inside health-corpus: its own name resolves through its own `exports`. */
const resolved = (specifier) => createRequire(join(PACKAGE, 'package.json')).resolve(specifier)

/** Every package `file` reaches, through each file it imports, by the specifier it is imported as. */
function reached(file, packages = new Set(), seen = new Set()) {
  if (seen.has(file)) return packages
  seen.add(file)
  for (const { fileName } of ts.preProcessFile(readFileSync(file, 'utf8'), true, true).importedFiles) {
    if (fileName.startsWith('.')) reached(resolve(dirname(file), fileName), packages, seen)
    else packages.add(fileName)
  }
  return packages
}

/** The packages health-corpus depends on from the workspace: health-core and health-document, which a page may bundle. */
const WORKSPACE = Object.entries(manifest.dependencies)
  .filter(([, version]) => version.startsWith('workspace:'))
  .map(([name]) => name)

describe("health-corpus's documents entry, as built", () => {
  // The demo's build imports it by this name: an `exports` entry that
  // names a file tsdown does not write would stop that build, and types it
  // does not write its type-check.
  test('resolves through the manifest to the module and the types tsdown wrote', () => {
    const entry = manifest.exports['./documents']
    expect(resolved('@formancy/health-corpus/documents')).toBe(join(PACKAGE, 'dist', 'documents.mjs'))
    expect(existsSync(join(PACKAGE, entry.types))).toBe(true)
  })

  // A copy of documents.ts inside the index would let the page run code
  // the gate never ran: the corpus's Bundles are made through the index.
  test('is the module the index re-exports, not a copy of it', async () => {
    const documents = await import(pathToFileURL(resolved('@formancy/health-corpus/documents')).href)
    const index = await import(pathToFileURL(resolved('@formancy/health-corpus')).href)
    const names = Object.keys(documents)
    expect(names).toEqual(expect.arrayContaining(['referralDocument', 'referralContext', 'NAMES']))
    expect(names.filter((name) => index[name] !== documents[name])).toEqual([])
  })

  // What the page bundles of it is what it reaches: Formancy Report's
  // renderer reached through it would ship Report's code in a page, under
  // Report's licence, and a module of Node's would break it in a browser.
  test('reaches workspace packages alone, so a page bundles no Report and nothing of Node', () => {
    expect(WORKSPACE).toEqual(expect.arrayContaining(['@formancy/health-core', '@formancy/health-document']))
    const outside = [...reached(resolved('@formancy/health-corpus/documents'))].filter((name) => !WORKSPACE.includes(name))
    expect(outside, 'the documents entry reaches a package a page must not bundle').toEqual([])
  })

  // A guard on the guard: a walk that read no import, or followed no file
  // the entry imports, would find nothing outside the workspace in any
  // entry. The index reaches Report through its own imports, and the
  // documents entry through it.
  test("finds what the package's index reaches, Report's renderer among it", () => {
    expect([...reached(resolved('@formancy/health-corpus'))]).toEqual(
      expect.arrayContaining(['@formancy/health-document', '@formancy/report-render-pdf', '@formancy/report-runtime']),
    )
  })
})
