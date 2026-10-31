// What this checkout is tested with, as far as the tree itself can say (0011;
// formancy.ai-report 0014's tested-on, without its peers, which Health does
// not have): every runtime dependency a published package declares and the
// version the suites load, the upstream @formancy/* packages, Node, pnpm,
// Playwright and the build it pins for each browser the gates run in, and
// the tools, and the tuple the README's
// compatibility table states -- the FHIR version health-core writes, the
// validator the gate pins and the guide packages it loads -- read through
// scripts/compatibility.mjs, so the README and the report cannot say two
// things of it.
//
// Static facts, derived from the manifests, the registers and what is
// installed; nothing here is typed but the list of tools. What a run
// actually ran -- the Node of each job, what a clean install resolved, the
// browser the gate launched, the validator the gate reported and the Java
// it ran on -- comes from that run's results, in the report (versions.mjs).
//
// Run after `pnpm install`. Nothing here needs a build.

import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import YAML from 'yaml'
import { BROWSERS, LAUNCH_OPTIONS, PINNED_AS } from '../browsers.mjs'
import { facts as compatibility } from '../compatibility.mjs'
import { mustBeInstalled } from '../release/installed.mjs'
import { packageKey } from '../validator/registers.mjs'
import { appsWith } from './collect.mjs'

const repo = join(dirname(fileURLToPath(import.meta.url)), '..', '..')

/**
 * What the report calls tooling, each resolved from the workspace root. The
 * one typed list; tested-on.test.mjs fails when an entry names nothing
 * installed.
 */
const TOOLING = ['typescript', 'vitest']

const FIELDS = ['dependencies', 'devDependencies', 'peerDependencies', 'optionalDependencies']
const readJson = (file) => JSON.parse(readFileSync(file, 'utf8'))

/** Every workspace package: `{ dir, manifest }`, dir repository-relative, in path order. */
export function workspace(root = repo) {
  const folder = join(root, 'packages')
  if (!existsSync(folder)) return []
  return readdirSync(folder)
    .sort()
    .filter((name) => existsSync(join(folder, name, 'package.json')))
    .map((name) => ({ dir: `packages/${name}`, manifest: readJson(join(folder, name, 'package.json')) }))
}

/** The packages a release publishes: every workspace package that is not private. */
export function published(root = repo) {
  return workspace(root).filter(({ manifest }) => manifest.private !== true)
}

/** A package that is no workspace sibling, no `workspace:` link and no upstream @formancy/* package: somebody else's. */
const thirdParty =
  (local) =>
  ([name, range]) =>
    !local.has(name) && !String(range).startsWith('workspace:') && !name.startsWith('@formancy/')

/** Every runtime dependency of every published package that is somebody else's: the range it is published with and the version its suites load. */
function runtime(root, packages, local) {
  return [...packages]
    .sort((a, b) => a.manifest.name.localeCompare(b.manifest.name))
    .flatMap(({ dir, manifest }) =>
      Object.entries(manifest.dependencies ?? {})
        .filter(thirdParty(local))
        .map(([name, range]) => ({ package: manifest.name, name, range, loaded: mustBeInstalled(join(root, dir), name).version })),
    )
}

/**
 * Every upstream @formancy/* package a workspace manifest names, and theirs,
 * recursively; each as Node loads it. `direct` when a workspace manifest
 * names it, in any field, the private health-corpus's included; `shipped`
 * when a consumer's install of the published packages brings it: a
 * published package's `dependencies` name it, or a shipped package's own
 * do. Formancy Report's packages, which only health-corpus depends on, are
 * direct and not shipped.
 */
function upstream(root, packages, local) {
  const seen = new Map()
  const visit = (fromDir, name, declared, direct, shipped) => {
    const found = mustBeInstalled(fromDir, name)
    const key = `${name}@${found.version}`
    const known = seen.get(key)
    const entry = known ?? { name, version: found.version, declared: null, direct: false, shipped: false }
    if (declared !== null) entry.declared = declared
    entry.direct ||= direct
    // Walked again only when this visit ships what an earlier one did not,
    // so that what it brings is marked shipped too.
    if (known !== undefined && (known.shipped || !shipped)) return
    entry.shipped ||= shipped
    seen.set(key, entry)
    for (const [inner] of Object.entries(readJson(join(found.dir, 'package.json')).dependencies ?? {})) {
      if (inner.startsWith('@formancy/')) visit(found.dir, inner, null, false, entry.shipped)
    }
  }
  const publishing = new Set(published(root).map(({ manifest }) => manifest.name))
  for (const { dir, manifest } of packages) {
    for (const field of FIELDS) {
      for (const [name, spec] of Object.entries(manifest[field] ?? {})) {
        if (name.startsWith('@formancy/') && !local.has(name))
          visit(join(root, dir), name, String(spec), true, field === 'dependencies' && publishing.has(manifest.name))
      }
    }
  }
  return [...seen.values()].sort((a, b) => a.name.localeCompare(b.name) || a.version.localeCompare(b.version))
}

/** Every `node-version` an `actions/setup-node` step of a workflow sets, with where. */
export function setupNodeVersions(root = repo) {
  const dir = join(root, '.github', 'workflows')
  const found = []
  for (const file of readdirSync(dir)
    .filter((name) => /\.ya?ml$/.test(name))
    .sort()) {
    const workflow = YAML.parse(readFileSync(join(dir, file), 'utf8'))
    for (const [job, definition] of Object.entries(workflow?.jobs ?? {})) {
      for (const step of definition?.steps ?? []) {
        if (String(step.uses ?? '').startsWith('actions/setup-node') && step.with?.['node-version'] !== undefined) {
          found.push({ workflow: file, job, version: String(step.with['node-version']) })
        }
      }
    }
  }
  return found
}

/** How the root declares a tool: its manifest's range, or the catalog's for `catalog:`. */
function declaredRange(root, name) {
  const owner = readJson(join(root, 'package.json'))
  const spec = FIELDS.map((field) => owner?.[field]?.[name]).find((value) => value !== undefined) ?? null
  if (spec !== 'catalog:') return spec
  return YAML.parse(readFileSync(join(root, 'pnpm-workspace.yaml'), 'utf8')).catalog?.[name] ?? null
}

/**
 * Playwright as every app with a `test:browser` script loads it -- the
 * apps collect.mjs's appsWith finds, which are the ones whose gates the
 * report reads, so the two cannot name different apps -- and the
 * build it pins for each browser of BROWSERS -- the one PINNED_AS names,
 * which for Chromium launched headless is the headless shell -- read from
 * playwright-core's browsers.json, which is what `playwright install`
 * downloads -- and `headless`, how LAUNCH_OPTIONS starts it, since the
 * headless shell and the full browser are pinned at one version. Throws
 * when no app has a gate, when the apps load two Playwrights, or when
 * Playwright pins no such build.
 */
function browser(root) {
  const apps = appsWith(root, 'test:browser')
  if (apps.length === 0) throw new Error('no app has a test:browser script, so no Playwright drives a browser gate')
  const loaded = apps.map((dir) => ({ dir, found: mustBeInstalled(join(root, dir), 'playwright') }))
  const versions = [...new Set(loaded.map((entry) => entry.found.version))]
  if (versions.length > 1)
    throw new Error(
      `the browser gates load ${loaded.map((entry) => `Playwright ${entry.found.version} (${entry.dir})`).join(', ')}, and one Playwright pins one build of each browser`,
    )
  const core = mustBeInstalled(loaded[0].found.dir, 'playwright-core')
  const builds = readJson(join(core.dir, 'browsers.json')).browsers
  const pins = BROWSERS.map((name) => {
    const build = builds.find((entry) => entry.name === PINNED_AS[name])
    if (build === undefined)
      throw new Error(`playwright-core ${core.version} pins no ${String(PINNED_AS[name])}, the build scripts/browsers.mjs says ${name} launches`)
    return { browser: name, name: build.name, revision: build.revision, browserVersion: build.browserVersion, headless: LAUNCH_OPTIONS.headless }
  })
  return { playwright: versions[0], pins }
}

/** The package manager corepack runs, from the root's `packageManager`: `pnpm@12.4.2` is pnpm 12.4.2, a `+sha…` suffix dropped. */
function packageManager(manifest) {
  const declared = manifest.packageManager
  const match = /^(@?[^@]+)@([^+]+)/.exec(String(declared ?? ''))
  if (match === null) throw new Error('the root package.json declares no packageManager, which corepack runs')
  return { name: match[1], version: match[2], declared }
}

/** Everything above, for `root`. Throws, naming the package, when a lookup finds nothing. */
export function testedOn(root = repo) {
  const packages = workspace(root)
  const local = new Set(packages.map(({ manifest }) => manifest.name))
  const rootManifest = readJson(join(root, 'package.json'))
  const record = compatibility(root)
  return {
    runtime: runtime(root, published(root), local),
    upstream: upstream(root, packages, local),
    node: {
      engines: rootManifest.engines?.node ?? null,
      nodeVersion: record.node.ci,
      ci: setupNodeVersions(root),
      declared: published(root)
        .filter(({ manifest }) => manifest.engines?.node !== undefined)
        .map(({ manifest }) => ({ package: manifest.name, node: manifest.engines.node })),
    },
    packageManager: packageManager(rootManifest),
    browser: browser(root),
    tooling: TOOLING.map((name) => ({ name, declared: declaredRange(root, name), version: mustBeInstalled(root, name).version })),
    fhir: record.fhir,
    validator: { version: record.validator.version, released: record.validator.released, sha256: record.validator.sha256, java: record.validator.java },
    guides: record.packages.map((entry) => ({ key: packageKey(entry), loadedAs: entry.loadedAs, licence: entry.licence })),
  }
}
