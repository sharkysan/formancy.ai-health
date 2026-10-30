#!/usr/bin/env node
/**
 * Install the packed packages into projects that know nothing about this
 * repository, and run them.
 *
 * **Why no other gate can see this.** `pnpm build`, `typecheck`, `test:coverage`
 * and `check:pkg` all run inside the workspace, against the tree they were
 * built from. A workspace sibling resolves a package through a symlink to its
 * source directory, so an `exports` map that is wrong for a real consumer can
 * be right for every test in the repository. formancy.ai shipped a package with
 * no `exports` at all for four releases that way, while ninety-five tests and
 * `publint` said nothing.
 *
 * **What this proves, and only this.** The tarballs `pnpm pack` produces
 * install into plain npm projects, each holding only what its host would
 * (`install-hosts.mjs` says what, and why apart); every entry point
 * resolves; the types resolve with `skipLibCheck` off, so a declaration file
 * that imports a type its consumer does not have is found here rather than
 * by a customer; and the code runs under Node. One kind of host, Node's,
 * because every package here is a library a host calls from Node;
 * formancy.ai-report's gate plans a project per kind of host, and that
 * arrives here with a package a browser imports, if one ever does.
 *
 * **The guide's code too** (0011; formancy.ai-report 0015).
 * docs/getting-started.md's blocks are read once, by getting-started.mjs,
 * before anything is packed -- a block the gate would not run fails it
 * there -- and written into the `guide/` directory of the project that
 * builds them, where its type-check covers them and `guide-node.ts` runs
 * them and holds them to the output the guide shows.
 *
 * It does **not** talk to npm about these packages, so it says nothing about
 * the registry copy; the tools, and what the guide installs beside the
 * tarballs, come from the registry.
 *
 * **What it leaves behind.** `test-results/install.json` at the root, written
 * however the gate ends: whether it passed, the Node and npm it ran under,
 * each tarball's name, sha256, npm integrity and the hash of its `dist/`,
 * and, per project, every `@formancy/*` package its clean `npm install`
 * resolved, what it installed beside the tarballs, the tools that checked
 * it, the guide's blocks it was given and the line each opens on, how far
 * it got and what each step said -- what the release report reads and
 * holds to install-hosts.mjs's plan (0011; formancy.ai-report 0014), which
 * shows a consumer's project's resolutions apart from the guide's. With
 * `--keep-tarballs <dir>` the tarballs are copied there before the work
 * directory goes, so the release publishes exactly these.
 */
import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { basename, dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { readGuide } from './getting-started.mjs'
import { GUIDE_HOSTS, HOSTS } from './install-hosts.mjs'
import { distHash, distOfTarball } from './release/dist-hash.mjs'
import { installed } from './release/installed.mjs'
import { integrityOf } from './release/publish.mjs'
import { readTarball } from './release/tarball.mjs'

const here = dirname(fileURLToPath(import.meta.url))
const repo = resolve(here, '..')

/** Every publishable package, as a name and the directory to pack from. */
function publishable() {
  const root = join(repo, 'packages')
  return readdirSync(root, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .flatMap((entry) => {
      const file = join(root, entry.name, 'package.json')
      let manifest
      try {
        manifest = JSON.parse(readFileSync(file, 'utf8'))
      } catch {
        return []
      }
      if (manifest.private === true || manifest.name === undefined) return []
      return [{ name: manifest.name, dir: join(root, entry.name) }]
    })
}

/**
 * Run a program, on either platform, and answer what it printed.
 *
 * `pnpm`, `npm` and `npx` are `.cmd` shims on Windows, so the bare name is
 * `spawnSync ENOENT` there -- and Node 20 and later refuse to spawn a `.cmd` at
 * all without a shell, which is `EINVAL`. So Windows gets a shell, given one
 * command line with every argument quoted, and everywhere else gets the
 * executable directly, which is the safer of the two and is what CI runs.
 * One command line rather than arguments beside `shell`, which Node would
 * concatenate unescaped all the same, and warns about (DEP0190).
 *
 * NODE_ENV is the step's to set and nobody else's: inherited as
 * `production`, it would make `npm install` leave out the tools the
 * consumer is checked with.
 */
const WINDOWS = process.platform === 'win32'

function run(command, args, cwd) {
  const { NODE_ENV: _ignored, ...inherited } = process.env
  const options = { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], maxBuffer: 64 * 1024 * 1024, env: inherited }
  try {
    if (!WINDOWS) return execFileSync(command, args, options)
    const quoted = args.map((arg) => (/[\s"]/.test(arg) ? `"${arg.replaceAll('"', '\\"')}"` : arg))
    return execFileSync([`${command}.cmd`, ...quoted].join(' '), { ...options, shell: true })
  } catch (error) {
    // Said once: the command, then what it printed, which is where tsc and
    // the consumer say what is wrong.
    const said = `${error.stdout ?? ''}${error.stderr ?? ''}`.trim()
    throw new Error(`${[command, ...args].join(' ')} failed${said === '' ? `: ${error.message}` : `:\n${said.slice(0, 6000)}`}`)
  }
}

/**
 * A program installed in the project. `--no`, so a binary missing from the
 * project fails here: without it npx fetches whatever package on the
 * registry has that name, and `tsc` is the name of an unrelated package
 * there.
 */
const inProject = (command, cwd) => run('npx', ['--no', '--', ...command], cwd)

/**
 * Every `@formancy/*` package a project's `npm install` resolved, this
 * repository's and upstream's, by version. Read right after the install,
 * because the project is deleted at the end. formancy.ai-report also records
 * each third-party runtime dependency its report's *Tested on* names; no
 * published package here has one, and the report says one added later is
 * "not reported" until this records it (0011).
 */
function resolvedIn(project) {
  const scope = join(project, 'node_modules', '@formancy')
  if (!existsSync(scope)) return []
  return readdirSync(scope)
    .map((name) => `@formancy/${name}`)
    .flatMap((name) => {
      const found = installed(project, name)
      return found === undefined ? [] : [{ name, version: found.version }]
    })
    .sort((a, b) => a.name.localeCompare(b.name))
}

/** What the report and the release need of a tarball: its bytes' hashes and what its dist/ holds. */
function describeTarball(name, file) {
  const bytes = readFileSync(file)
  const manifest = JSON.parse(readTarball(bytes).get('package/package.json')?.toString('utf8') ?? '{}')
  return {
    name,
    version: manifest.version ?? null,
    file: basename(file),
    sha256: createHash('sha256').update(bytes).digest('hex'),
    // What npm records as the tarball's integrity, and the registry as its dist.integrity.
    integrity: integrityOf(bytes),
    distHash: distHash(distOfTarball(readTarball(bytes))),
  }
}

const json = (value) => `${JSON.stringify(value, null, 2)}\n`

/**
 * Writes what the guide gives `host`'s kind into `dir`'s `guide/`
 * directory: its module, and the lines its program is shown printing.
 * Answers what install.json records of it.
 */
function writeGuide(host, dir, guide) {
  const given = guide.get(host.kind)
  mkdirSync(join(dir, 'guide'))
  writeFileSync(join(dir, 'guide', host.entry), `${given.code}\n`)
  if (given.output !== null) writeFileSync(join(dir, 'guide', 'output.txt'), `${given.output}\n`)
  return { kind: host.kind, files: [host.entry], blocks: given.blocks }
}

/**
 * Installs the project `name` in a directory of its own under `work` --
 * the tarballs, what its host installs beside them and its tools -- and
 * runs its steps in order, filling `entry` in as each passes. Answers what
 * to print.
 */
function check(name, host, entry, tarballs, guide) {
  const dir = join(work, name)
  mkdirSync(dir, { recursive: true })
  // The fixture is copied rather than generated: TypeScript inside a template
  // literal inside a script is the shape that cost upstream two broken attempts.
  cpSync(join(here, 'install-fixture'), dir, { recursive: true })
  if (host.guide !== undefined) entry.guide = writeGuide(host.guide, dir, guide)
  writeFileSync(
    join(dir, 'package.json'),
    json({
      name: `formancy-health-install-${name}`,
      private: true,
      type: 'module',
      dependencies: { ...Object.fromEntries([...tarballs].map(([package_, file]) => [package_, `file:${file}`])), ...host.with },
      devDependencies: host.tools,
    }),
  )
  writeFileSync(join(dir, 'tsconfig.json'), json(host.tsconfig))

  // npm rather than pnpm, deliberately: pnpm in a directory under a workspace
  // can still find the workspace, and resolving through it is the thing this
  // test exists to avoid.
  run('npm', ['install', '--no-audit', '--no-fund', '--loglevel', 'error'], dir)
  entry.npmInstalled = true
  entry.resolved = resolvedIn(dir)
  entry.installed = Object.fromEntries(Object.keys(host.with).map((package_) => [package_, installed(dir, package_)?.version ?? null]))
  entry.tools = Object.fromEntries(Object.keys(host.tools).map((tool) => [tool, installed(dir, tool)?.version ?? null]))

  const beside = Object.entries(entry.installed)
    .map(([package_, version]) => `${package_} ${String(version)}`)
    .join(', ')
  const lines = [`\n${name}: ${host.consumer}, ${beside === '' ? 'the tarballs alone' : `the tarballs beside ${beside}`}`]
  if (entry.guide !== null)
    lines.push(
      `  the guide's ${entry.guide.kind} blocks, from lines ${entry.guide.blocks.join(', ')} of docs/getting-started.md, in guide/${entry.guide.files.join(', guide/')}`,
    )
  for (const [at, step] of host.steps.entries()) {
    const said = inProject(step.command, dir).trim()
    entry.steps[at].done = true
    entry.steps[at].said = said
    lines.push(`  ${step.name}: ${said === '' ? 'passed' : said.replaceAll('\n', '\n    ')}`)
  }
  return lines.join('\n')
}

const keepAt = process.argv.indexOf('--keep-tarballs')
const keep = keepAt === -1 ? undefined : resolve(process.argv[keepAt + 1] ?? '')
if (keepAt !== -1 && process.argv[keepAt + 1] === undefined) throw new Error('--keep-tarballs needs a directory')

const work = mkdtempSync(join(tmpdir(), 'formancy-health-install-'))
const record = { startedAt: new Date().toISOString(), node: process.version, npm: null, tarballs: [], consumers: [] }
let failure

try {
  // Read before anything is packed: a guide block the gate would not run
  // fails here, without waiting for npm.
  const guide = readGuide(readFileSync(join(repo, 'docs', 'getting-started.md'), 'utf8'), GUIDE_HOSTS)

  const packages = publishable()
  // @formancy/health-core, @formancy/health-questionnaire,
  // @formancy/health-document and @formancy/health-ch today; health-corpus
  // is private and never packed. A walk that finds none has gone wrong,
  // and a test over zero packages passes by having nothing to check.
  if (packages.length < 1) {
    throw new Error(`only found ${String(packages.length)} publishable packages; the walk is wrong`)
  }

  const tarballs = new Map()
  for (const { name, dir } of packages) {
    const out = run('pnpm', ['pack', '--pack-destination', work], dir)
    const file = out.trim().split('\n').at(-1)
    if (file === undefined || !file.endsWith('.tgz')) {
      throw new Error(`pnpm pack said something unexpected for ${name}: ${out}`)
    }
    tarballs.set(name, file.startsWith(work) ? file : join(work, file))
  }
  console.log(`packed ${String(tarballs.size)} packages`)
  record.tarballs = [...tarballs].map(([name, file]) => describeTarball(name, file))
  if (keep !== undefined) {
    mkdirSync(keep, { recursive: true })
    for (const file of tarballs.values()) cpSync(file, join(keep, basename(file)))
  }
  record.npm = run('npm', ['--version'], work).trim()

  const projects = Object.entries(HOSTS)
  record.consumers = projects.map(([name, host]) => ({
    project: name,
    consumer: host.consumer,
    npmInstalled: false,
    installed: {},
    tools: {},
    resolved: [],
    guide: null,
    steps: host.steps.map((step) => ({ step: step.name, done: false, said: null })),
  }))
  console.log(`installing the tarballs into ${String(projects.length)} plain npm projects, each with what its host has, and checking each…`)
  // Each project's clean install resolved what its own entry records: the
  // report reads a consumer's apart from the guide's, which installs
  // Report's packages beside the tarballs (versions.mjs), so no list here
  // merges the two.
  for (const [at, [name, host]] of projects.entries()) console.log(check(name, host, record.consumers[at], tarballs, guide))

  console.log('\ninstall test passed: the packed tarballs, and the guide, work in projects that are not this one')
} catch (error) {
  failure = error
  console.error('\ninstall test FAILED')
  console.error(String(error?.message ?? error))
} finally {
  rmSync(work, { recursive: true, force: true })
  mkdirSync(join(repo, 'test-results'), { recursive: true })
  const result = {
    ...record,
    finishedAt: new Date().toISOString(),
    passed: failure === undefined,
    ...(failure === undefined ? {} : { error: String(failure?.message ?? failure) }),
  }
  writeFileSync(join(repo, 'test-results', 'install.json'), json(result), 'utf8')
}

process.exit(failure === undefined ? 0 : 1)
