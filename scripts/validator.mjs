// The validator gate (0005): the official HL7 FHIR validator, at the release
// docs/release/validator.json pins, against exactly the packages
// docs/release/ig-packages.json registers, offline, over the resources
// health-core writes in scripts/validator/corpus.mjs.
//
//   node scripts/validator.mjs [--java <path>] [--cache <dir>] [--results <file>] [--fresh]
//
// It needs `pnpm build` first, because the corpus is made and written by the
// packages as built, and a Java at least as new as the pin's `java`. In order:
//
// 1. Checks the registers and the corpus, and refuses to run on a wrong one.
// 2. Fetches the JAR and every package into the cache, each refused unless
//    its SHA-256 is the registered one (scripts/validator/cache.mjs), and
//    lays out the validator's package cache with those packages and no
//    others.
// 3. Makes the corpus -- health-questionnaire's Questionnaires and
//    responses of the synthetic forms, health-document's Bundles of the
//    referral letter health-corpus renders with Formancy Report, and the
//    resources built by hand -- and writes it with health-core's writeJson.
// 4. Runs the validator once over every file, offline: `-tx n/a` (no
//    terminology server), `-txCache n/a`, and `-no-http-access`, which
//    refuses every request the validator would make, for a package, a
//    profile or anything else; `-locale en-US` and `-jurisdiction uv`, so
//    the run is the same on every machine.
// 5. Judges what it said (scripts/validator/judge.mjs), writes the results
//    to `test-results/validator.json` -- the corpus it judged, the
//    validator's own output and its console beside them in
//    `test-results/validator/` -- and exits 1 on any problem.
//
// Run by the `validator` job in gates.yml, and by hand the same way.

import { spawnSync } from 'node:child_process'
import { closeSync, existsSync, fstatSync, mkdirSync, openSync, readFileSync, readSync, rmSync, writeFileSync } from 'node:fs'
import { dirname, join, relative, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { fetchVerified, layout, prepareHome } from './validator/cache.mjs'
import { corpus as buildCorpus } from './validator/corpus.mjs'
import { corpusProblems, judge } from './validator/judge.mjs'
import { readConsole, readOutcomes } from './validator/outcome.mjs'
import { packageKey, packageProblems, pinProblems, readRegisters, warningProblems } from './validator/registers.mjs'

const repo = join(dirname(fileURLToPath(import.meta.url)), '..')

/** Where the gate writes, under the repository. */
export const RESULTS = 'test-results/validator.json'
const WORK = 'test-results/validator'
const HEALTH_CORE = 'packages/health-core/dist/index.mjs'
const HEALTH_QUESTIONNAIRE = 'packages/health-questionnaire/dist/index.mjs'
const HEALTH_CORPUS = 'packages/health-corpus/dist/index.mjs'

/**
 * The validator's command line, all of it but `java` itself: the one place
 * the gate's options are decided. `files` are validated; `definitions` are
 * loaded too, so a QuestionnaireResponse is checked against its
 * Questionnaire.
 */
export function validatorArguments({ jar, home, files, packages, definitions, output }) {
  const core = packages.find((entry) => entry.loadedAs === 'core')
  return [
    // The validator says Windows' default encoding "may cause unexpected
    // results"; and its package cache, and any fhir-settings.json, are
    // read from this home and from nobody's own.
    '-Dfile.encoding=UTF-8',
    `-Duser.home=${home}`,
    '-jar',
    jar,
    ...files,
    '-version',
    core.version,
    ...packages.filter((entry) => entry.loadedAs === 'ig').flatMap((entry) => ['-ig', packageKey(entry)]),
    ...definitions.flatMap((file) => ['-ig', file]),
    '-questionnaire',
    'check',
    '-tx',
    'n/a',
    '-txCache',
    'n/a',
    '-no-http-access',
    '-locale',
    'en-US',
    '-jurisdiction',
    'uv',
    '-output',
    output,
  ]
}

/** The major version `java -version` reports: `openjdk version "17.0.4"` is 17, `"1.8.0_402"` is 8. */
export function javaMajor(text) {
  const match = /version "(\d+)(?:\.(\d+))?/.exec(String(text))
  if (match === null) return undefined
  return match[1] === '1' ? Number.parseInt(match[2], 10) : Number.parseInt(match[1], 10)
}

/** The options of the command line. */
function options(argv) {
  const value = (name) => {
    const at = argv.indexOf(name)
    return at === -1 ? undefined : argv[at + 1]
  }
  return { java: value('--java') ?? 'java', cache: resolve(repo, value('--cache') ?? '.fhir-cache'), results: resolve(repo, value('--results') ?? RESULTS), fresh: argv.includes('--fresh') }
}

const seconds = (since) => Math.round((performance.now() - since) / 100) / 10
const local = (path) => relative(repo, path).replaceAll('\\', '/')

/** Everything written to the open file `fd`, read from its start. */
function written(fd) {
  const bytes = Buffer.alloc(fstatSync(fd).size)
  for (let at = 0; at < bytes.length; ) {
    const read = readSync(fd, bytes, at, bytes.length - at, at)
    if (read === 0) break
    at += read
  }
  return bytes.toString('utf8')
}

/** The file at `path` as text, or undefined when there is none: read, not checked and then read. */
function readIfThere(path) {
  try {
    return readFileSync(path, 'utf8')
  } catch (error) {
    if (error?.code === 'ENOENT') return undefined
    throw error
  }
}

async function main(argv) {
  const started = performance.now()
  const { java, cache, results, fresh } = options(argv)
  const { pin, packages, warnings } = readRegisters(repo)
  const wrong = [...pinProblems(pin), ...packageProblems(packages), ...warningProblems(warnings)]
  if (wrong.length > 0) throw new Error(`the registers do not hold:\n  - ${wrong.join('\n  - ')}`)

  const version = spawnSync(java, ['-version'], { encoding: 'utf8' })
  if (version.error !== undefined) throw new Error(`cannot run ${java}: ${version.error.message}; pass --java <path to java>`)
  const major = javaMajor(`${version.stderr}${version.stdout}`)
  if (major === undefined || major < pin.java) throw new Error(`${java} is Java ${String(major)}, and validator ${pin.version} needs ${String(pin.java)} or later`)

  const where = layout(cache)
  const fetched = []
  if (await fetchVerified({ url: pin.url, path: where.jar(pin), sha256: pin.sha256 })) fetched.push(`validator_cli.jar ${pin.version}`)
  for (const entry of packages) if (await fetchVerified({ url: entry.url, path: where.tgz(entry), sha256: entry.sha256 })) fetched.push(packageKey(entry))
  const home = prepareHome(where, packages, pin.version, { fresh })
  console.log(`validator: ${pin.version} and ${String(packages.length)} packages checked against their registered SHA-256; fetched ${fetched.length === 0 ? 'nothing' : fetched.join(', ')}`)
  console.log(`validator: package cache ${local(where.packages)}: ${String(home.unpacked.length)} unpacked, ${String(home.kept.length)} kept${home.removed.length === 0 ? '' : `, removed ${home.removed.join(', ')}`}`)

  const built = async (path) => {
    if (!existsSync(join(repo, path))) throw new Error(`${path} is missing: run pnpm build first, since the corpus is made by the packages as built`)
    return import(pathToFileURL(join(repo, path)).href)
  }
  const core = await built(HEALTH_CORE)
  // The documents' PDF, rendered by Report's renderer as health-corpus
  // depends on it, once per run: the same report and data give the same bytes.
  const documents = await built(HEALTH_CORPUS)
  const entries = buildCorpus({ core, questionnaire: await built(HEALTH_QUESTIONNAIRE), documents, pdf: await documents.renderReferral() })
  const corpusWrong = corpusProblems(entries)
  if (corpusWrong.length > 0) throw new Error(`the corpus does not hold:\n  - ${corpusWrong.join('\n  - ')}`)
  const work = join(repo, WORK)
  rmSync(work, { recursive: true, force: true })
  mkdirSync(join(work, 'corpus'), { recursive: true })
  for (const entry of entries) writeFileSync(join(work, 'corpus', entry.file), core.writeJson(entry.resource))

  const output = join(work, 'outcome.json')
  const consoleFile = join(work, 'console.log')
  const files = entries.map((entry) => join(work, 'corpus', entry.file))
  const definitions = entries.filter((entry) => entry.definition === true).map((entry) => join(work, 'corpus', entry.file))
  const log = openSync(consoleFile, 'w+')
  const ran = performance.now()
  const run = spawnSync(java, validatorArguments({ jar: where.jar(pin), home: where.home, files, packages, definitions, output }), { stdio: ['ignore', log, log] })
  const validatorSeconds = seconds(ran)
  // Read back through the descriptor the validator wrote to, not by its
  // path a second time, so what is judged is what it wrote.
  const said = readConsole(written(log))
  closeSync(log)

  const problems = []
  if (run.error !== undefined) problems.push(`the validator did not run: ${run.error.message}`)
  else if (run.status !== 0) problems.push(`the validator exited ${String(run.status)}; its console is ${local(consoleFile)}`)
  if (said.version !== pin.version) problems.push(`the validator says it is ${String(said.version)}, not ${pin.version}`)
  let verdict = { resources: [], problems: [] }
  const outcome = readIfThere(output)
  if (outcome !== undefined) {
    verdict = judge({ corpus: entries, outcomes: readOutcomes(outcome), warnings, pinned: pin.version, registered: packages.map(packageKey), loaded: said.packages })
  } else problems.push(`the validator wrote no ${local(output)}`)
  problems.push(...verdict.problems)

  const report = {
    gate: 'validator',
    validator: { version: pin.version, sha256: pin.sha256, reported: said.version, java: said.java ?? null },
    // Refusals the console printed: its package lookups. A refused fetch of
    // a profile is printed nowhere but in that resource's outcome.
    offline: { tx: 'n/a', txCache: 'n/a', httpAccess: false, consoleRefusals: said.refused },
    packages: { registered: packages.map(packageKey), loaded: said.packages ?? null },
    corpus: local(join(work, 'corpus')),
    outcome: local(output),
    console: local(consoleFile),
    resources: verdict.resources,
    seconds: { validator: validatorSeconds, total: seconds(started) },
    validatorTimes: said.times ?? null,
    problems,
    passed: problems.length === 0,
  }
  mkdirSync(dirname(results), { recursive: true })
  writeFileSync(results, `${JSON.stringify(report, null, 2)}\n`)

  const accepted = verdict.resources.filter((row) => row.expect === 'accepted').length
  console.log(`validator: ${String(verdict.resources.length)} resources judged in ${String(validatorSeconds)} s, ${String(accepted)} to accept and ${String(verdict.resources.length - accepted)} broken to refuse; its console printed ${String(said.refused)} refused requests; results in ${local(results)}`)
  if (problems.length > 0) {
    console.error('Validator gate failed:')
    for (const problem of problems) console.error(`  - ${problem}`)
    return 1
  }
  console.log('validator: every resource judged as the corpus expects')
  return 0
}

// `node scripts/validator.mjs [--java <path>] [--cache <dir>] [--results <file>] [--fresh]`
if (process.argv[1]?.replaceAll('\\', '/').endsWith('scripts/validator.mjs')) {
  const argv = process.argv.slice(2)
  main(argv).then(
    (code) => {
      process.exitCode = code
    },
    (error) => {
      // A run that stopped still leaves results, so that whatever reads
      // them finds a failure and not an absence.
      const { results } = options(argv)
      mkdirSync(dirname(results), { recursive: true })
      writeFileSync(results, `${JSON.stringify({ gate: 'validator', problems: [error.message], passed: false }, null, 2)}\n`)
      console.error(`Validator gate failed: ${error.message}`)
      process.exitCode = 1
    },
  )
}
