// The compatibility record: the tuple the packages are built and judged
// against (plan 12.5; 0005), derived and never typed, as
// formancy.ai-report's README derives what it is tested with
// (formancy.ai-report 0014, its scripts/release-report/readme.mjs).
//
// One table in README.md, in scripts/generated-block.mjs's grammar, each
// row read from where the fact lives:
//
// - the FHIR version from health-core's `FHIR_VERSION`, read from its
//   source as TypeScript parses it, so no build is needed and a comment
//   naming another version is not read;
// - the guide packages from docs/release/ig-packages.json, and the
//   validator and the Java it needs from docs/release/validator.json;
// - upstream @formancy/* packages from every manifest under packages/, at
//   the version each pins -- the packages and their test support, never
//   an app: the demo's formancy renderer and themes (apps/demo, 0012) are
//   what a page is drawn with, not what the packages are built against;
// - Node from the root's `engines` and .node-version, which CI runs
//   (scripts/workflows.test.mjs holds the workflows to it);
// - TypeScript as the catalog declares it and as the workspace loads it;
// - pnpm from the root's `packageManager`.
//
// `node scripts/compatibility.mjs --write` rewrites the block; without
// `--write` it exits 1 when the block is stale. compatibility.test.mjs
// fails until they match, naming the command. What a run actually ran --
// the Java of the validator job, the packages the validator loaded -- is in
// that run's results, test-results/validator.json, not here.

import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import ts from 'typescript'
import YAML from 'yaml'
import { readBlock, replaceBlock } from './generated-block.mjs'
import { mustBeInstalled } from './release/installed.mjs'
import { IG_PACKAGES, packageKey, VALIDATOR_PIN } from './validator/registers.mjs'

const repo = join(dirname(fileURLToPath(import.meta.url)), '..')

export const GENERATOR = 'scripts/compatibility.mjs'
const VERSION_SOURCE = 'packages/health-core/src/version.ts'
const readJson = (root, file) => JSON.parse(readFileSync(join(root, file), 'utf8'))

/**
 * The string `FHIR_VERSION` is exported as in `source`, health-core's
 * version.ts as text: an exported `const` whose initialiser is a string
 * literal, `as const` or not. Throws when there is none, or more than one.
 */
export function fhirVersionIn(source) {
  const file = ts.createSourceFile('version.ts', source, ts.ScriptTarget.Latest, true)
  const found = []
  for (const statement of file.statements) {
    if (!ts.isVariableStatement(statement) || !statement.modifiers?.some((modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword)) continue
    for (const declaration of statement.declarationList.declarations) {
      if (!ts.isIdentifier(declaration.name) || declaration.name.text !== 'FHIR_VERSION') continue
      let value = declaration.initializer
      while (value !== undefined && (ts.isAsExpression(value) || ts.isParenthesizedExpression(value))) value = value.expression
      if (value === undefined || !ts.isStringLiteral(value)) throw new Error(`${VERSION_SOURCE}: FHIR_VERSION is not a string literal`)
      found.push(value.text)
    }
  }
  if (found.length !== 1) throw new Error(`${VERSION_SOURCE} exports FHIR_VERSION ${String(found.length)} times, where it should once`)
  return found[0]
}

/** Every @formancy/* package a manifest under packages/ depends on that is no package of this workspace, with the version pinned. */
function upstream(root) {
  const read = (group) =>
    existsSync(join(root, group))
      ? readdirSync(join(root, group))
          .sort()
          .flatMap((name) =>
            existsSync(join(root, group, name, 'package.json')) ? [JSON.parse(readFileSync(join(root, group, name, 'package.json'), 'utf8'))] : [],
          )
      : []
  const manifests = read('packages')
  // An app is no upstream dependency of anything, but it is of this
  // workspace: a package depending on one is not upstream either.
  const local = new Set([...manifests, ...read('apps')].map((manifest) => manifest.name))
  const found = new Map()
  for (const manifest of manifests) {
    for (const field of ['dependencies', 'devDependencies', 'peerDependencies', 'optionalDependencies']) {
      for (const [name, version] of Object.entries(manifest[field] ?? {})) {
        if (name.startsWith('@formancy/') && !local.has(name))
          found.set(`${name}@${String(version)}`, {
            name,
            version: String(version),
            by: [...(found.get(`${name}@${String(version)}`)?.by ?? []), manifest.name],
          })
      }
    }
  }
  return [...found.values()].sort((a, b) => a.name.localeCompare(b.name))
}

/** Every fact the record holds, read from the checkout at `root`. */
export function facts(root = repo) {
  const rootManifest = readJson(root, 'package.json')
  const catalog = YAML.parse(readFileSync(join(root, 'pnpm-workspace.yaml'), 'utf8')).catalog ?? {}
  const manager = /^([^@]+)@([^+]+)/.exec(String(rootManifest.packageManager ?? ''))
  if (manager === null) throw new Error('the root package.json declares no packageManager')
  return {
    fhir: fhirVersionIn(readFileSync(join(root, VERSION_SOURCE), 'utf8')),
    packages: readJson(root, IG_PACKAGES).packages,
    validator: readJson(root, VALIDATOR_PIN),
    upstream: upstream(root),
    node: { engines: rootManifest.engines?.node ?? null, ci: readFileSync(join(root, '.node-version'), 'utf8').trim() },
    typescript: { declared: catalog.typescript ?? rootManifest.devDependencies?.typescript ?? null, loaded: mustBeInstalled(root, 'typescript').version },
    pnpm: { name: manager[1], version: manager[2] },
  }
}

const code = (text) => `\`${text}\``

/** README.md's block: one table, every row derived. */
export function render(facts) {
  const core = facts.packages.filter((entry) => entry.loadedAs === 'core')
  const guides = facts.packages.filter((entry) => entry.loadedAs === 'ig')
  const loadedWith = facts.packages.filter((entry) => entry.loadedAs === 'dependency').map((entry) => code(packageKey(entry)))
  const rows = [
    ['FHIR, the version every resource is written for', facts.fhir, `${code('FHIR_VERSION')}, \`${VERSION_SOURCE}\``],
    ...core.map((entry) => [`${code(entry.id)}, FHIR itself, for the validator`, entry.version, code(IG_PACKAGES)]),
    ...guides.map((entry) => [`${code(entry.id)}, a guide the corpus is judged against`, entry.version, code(IG_PACKAGES)]),
    ['What the validator loads with them', loadedWith.join(', '), code(IG_PACKAGES)],
    [
      'The HL7 FHIR validator',
      `${facts.validator.version}, released ${facts.validator.released}, SHA-256 ${code(facts.validator.sha256.slice(0, 12))}…`,
      code(VALIDATOR_PIN),
    ],
    ['Java, for the validator', `${String(facts.validator.java)} or later`, code(VALIDATOR_PIN)],
    ...(facts.upstream.length === 0
      ? [['`@formancy/*` upstream', 'none yet: no package depends on formancy, Formancy Report or Formancy Data', 'the workspace manifests']]
      : facts.upstream.map((entry) => [code(entry.name), entry.version, `the manifest of ${entry.by.map(code).join(', ')}`])),
    ['Node', `${code(String(facts.node.engines))}; CI runs ${facts.node.ci}`, `the root ${code('engines')}; ${code('.node-version')}`],
    ['TypeScript', `${facts.typescript.loaded}, declared ${code(String(facts.typescript.declared))}`, code('pnpm-workspace.yaml')],
    [facts.pnpm.name, `${facts.pnpm.version}, through corepack`, `the root ${code('packageManager')}`],
  ]
  const cell = (text) => String(text).replaceAll('|', '\\|')
  return ['| | Version | From |', '| --- | --- | --- |', ...rows.map((row) => `| ${row.map(cell).join(' | ')} |`)].join('\n')
}

/** README.md when its block is stale, `{ current, next }`; undefined when it is current. */
export function stale(root = repo) {
  const current = readFileSync(join(root, 'README.md'), 'utf8')
  const body = render(facts(root))
  return readBlock(current, GENERATOR) === body ? undefined : { current, next: replaceBlock(current, GENERATOR, body) }
}

// `node scripts/compatibility.mjs [--write]`
if (process.argv[1]?.replaceAll('\\', '/').endsWith(GENERATOR)) {
  const differing = stale(repo)
  if (process.argv.includes('--write')) {
    if (differing !== undefined) writeFileSync(join(repo, 'README.md'), differing.next, 'utf8')
    console.log(differing === undefined ? 'the compatibility record is current' : 'rewrote README.md')
  } else if (differing !== undefined) {
    console.error('stale: README.md; run node scripts/compatibility.mjs --write')
    process.exitCode = 1
  } else {
    console.log('the compatibility record is current')
  }
}
