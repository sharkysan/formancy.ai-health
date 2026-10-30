// @vitest-environment node
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { dirname, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { fromBase64Binary, FHIR_VERSION } from '@formancy/health-core'
import { CH_CORE_VERSION, CH_ORF_VERSION } from '@formancy/health-ch'
import ts from 'typescript'
import { describe, expect, test } from 'vitest'
import {
  DEMO_NAMES,
  demoChOrfContext,
  demoReferral,
  demoReferralAnswers,
  demoReferralContext,
  demoResponseContext,
} from '../../../../scripts/validator/demo-referral.mjs'
import { NOTICES_FILE } from '../../../../scripts/third-party-notices.mjs'
import { readLetter, sha256 } from '../../../../scripts/validator/letter.mjs'
import type { Outcome } from '../exports.js'
import { LINKS } from '../links.js'
import {
  corpusFiles,
  DEMO_MODULES,
  demoModules,
  factsOf,
  FACTS_IMPORT,
  LETTER_IMPORT,
  letterOf,
  outsideReads,
  pinned,
  SAMPLE_IMPORT,
  sampleOf,
  sampleProblems,
  type CorpusEntry,
} from './plugin.js'

/**
 * The build's plugin: the modules it hands the page, what it refuses, and
 * the files outside the app it reads, which apps/demo/turbo.json must name
 * for a turbo cache to see them. Run in Node against the packages as
 * built, as the build runs it.
 */
const app = join(dirname(fileURLToPath(import.meta.url)), '..', '..')
const repo = join(app, '..', '..')

/** A module's source as the plugin loads it, with what it asked the dev server to watch. */
async function load(id: string): Promise<{ readonly source: string | undefined; readonly watched: readonly string[] }> {
  const watched: string[] = []
  const plugin = demoModules()
  const hook = plugin.load as (this: { addWatchFile(file: string): void }, id: string) => Promise<string | undefined>
  const source = await hook.call({ addWatchFile: (file) => watched.push(relative(repo, file).replaceAll('\\', '/')) }, id)
  return { source, watched }
}

/** A module's default export, as the page receives it. */
const exported = (source: string | undefined): unknown => JSON.parse((source ?? '').replace(/^export default /, ''))

describe("the plugin's modules", () => {
  // The page imports them by these names; another name, or one resolved
  // without its `\0`, would be a file nobody wrote or a module another
  // plugin rewrites.
  test('resolve each import the page names, and nothing else', () => {
    const resolve = demoModules().resolveId as (id: string) => string | undefined
    expect([SAMPLE_IMPORT, LETTER_IMPORT, FACTS_IMPORT].map((id) => resolve(id))).toEqual(DEMO_MODULES)
    expect(resolve('virtual:formancy-health-demo/other')).toBeUndefined()
  })

  // The page starts from the sample and the corpus is made of
  // demo-referral.mjs: a value JSON cannot carry -- an undefined, a
  // function, a bigint -- would be dropped or refused on the way, and the
  // page would start from other data than the gate judged.
  test('hand the page the corpus demo referral, every value as demo-referral.mjs holds it', async () => {
    const original = {
      form: demoReferral,
      questionnaireContext: demoReferralContext,
      responseContext: demoResponseContext,
      chOrfContext: demoChOrfContext,
      answers: demoReferralAnswers,
      names: { response: DEMO_NAMES.response },
    }
    expect(sampleOf()).toStrictEqual(original)
    expect(exported((await load(DEMO_MODULES[0] ?? '')).source)).toStrictEqual(original)
  })

  // The letter the page carries is the one the validator gate judged: the
  // bytes docs/release/letter.json registers, by their size and hash, and
  // the module the page decodes them from is those bytes.
  test('hand the page the letter as the bytes the register holds', async () => {
    const pdf = await letterOf()
    const register = readLetter()
    expect([pdf.length, sha256(pdf)]).toEqual([register.bytes, register.sha256])
    const { source, watched } = await load(DEMO_MODULES[1] ?? '')
    expect(fromBase64Binary(exported(source) as string, 'letter')).toEqual(new Uint8Array(pdf))
    expect(watched).toContain('docs/release/letter.json')
  })

  // The page names the releases its resources claim. A register that
  // pinned another CH ORF than health-ch writes, or another FHIR than
  // health-core emits, would make the page name a version the resources
  // do not claim; read from the packages, the two must agree.
  test("hand the page the facts it states, the guides' versions as the packages claim them", async () => {
    const facts = await factsOf()
    expect(facts.versions).toMatchObject({ r4: FHIR_VERSION, chOrf: CH_ORF_VERSION, chCore: CH_CORE_VERSION })
    expect(facts.formancy).toBe(JSON.parse(readFileSync(join(app, 'package.json'), 'utf8')).dependencies['@formancy/react'])
    expect(facts.report).toBe(readLetter().renderedBy['@formancy/report-render-pdf'])
    expect(facts.purpose).toMatch(/medical device/)
    expect(facts.corpus).toEqual([
      'questionnaire-demo-referral.json',
      'questionnaireresponse-demo-referral.json',
      'bundle-ch-orf-demo-referral.json',
      'bundle-document-pdf-as-data.json',
      'bundle-document-pdf-in-binary.json',
    ])
    const { source } = await load(DEMO_MODULES[2] ?? '')
    expect(exported(source)).toStrictEqual(JSON.parse(JSON.stringify(facts)))
  })

  // Vite asks every plugin to load every module. A plugin that answered
  // for one not its own would hand the page its JSON in place of a file
  // of the app's, and the page would run what nobody wrote.
  test('load nothing for a module that is not theirs', async () => {
    expect((await load('/src/main.tsx')).source).toBeUndefined()
  })
})

describe('the notices the page links to', () => {
  // The footer's link is relative and names a file of the build, which
  // the notices plugin writes beside index.html under its own name. The
  // two named apart, a rename of either would leave the footer linking a
  // 404 on every page, with every build green.
  test('are the file the build writes, by its name', () => {
    expect(LINKS.notices).toBe(NOTICES_FILE)
  })
})

describe('the first resources the build holds to the corpus', () => {
  const made = (json: string): Outcome => ({ kind: 'made', json })
  const entry = (file: string, resource: unknown, expect: unknown = 'accepted'): CorpusEntry => ({ file, expect, resource })
  const files = [
    'questionnaire-demo-referral.json',
    'questionnaireresponse-demo-referral.json',
    'bundle-ch-orf-demo-referral.json',
    'bundle-document-pdf-as-data.json',
    'bundle-document-pdf-in-binary.json',
  ]
  const resource = (file: string) => ({ resourceType: 'Basic', id: file.replace('.json', '') })
  const json = (file: string) => `{"resourceType":"Basic","id":"${file.replace('.json', '')}"}`
  const page = new Map(files.map((file) => [file, made(json(file))]))
  const entries = files.map((file) => entry(file, resource(file)))

  // Each is a way the page's claim -- these are the gate's entries --
  // would be false and the build would still have shipped it.
  test('refuses a resource of other bytes, one the corpus lacks or refuses, and one the page does not make', () => {
    expect(sampleProblems(page, entries)).toEqual([])
    const [first = '', second = '', third = '', fourth = ''] = files
    expect(sampleProblems(new Map([...page, [first, made(json(first).replace('Basic', 'Basics'))]]), entries)).toEqual([
      `${first}: the page makes other bytes of the sample than the corpus's entry`,
    ])
    expect(
      sampleProblems(
        page,
        entries.filter((each) => each.file !== second),
      ),
    ).toEqual([`${second}: the corpus has no entry of that name`])
    expect(
      sampleProblems(
        page,
        entries.map((each) => (each.file === third ? entry(third, resource(third), [{ severity: 'error' }]) : each)),
      ),
    ).toEqual([`${third}: the corpus's entry of that name is one the gate refuses`])
    expect(sampleProblems(new Map([...page].filter(([file]) => file !== fourth)), entries)).toEqual([
      `${fourth}: the page does not make it of the sample (not made)`,
    ])
    expect(sampleProblems(new Map([...page, [fourth, { kind: 'failed' } as const]]), entries)).toEqual([
      `${fourth}: the page does not make it of the sample (failed)`,
    ])
  })

  // The build, Cloudflare's included, stops rather than ship a page whose
  // claim is false; and lists the files the page then says are entries.
  test('stop the build with every problem, or are listed as corpus entries', () => {
    expect(corpusFiles(page, entries)).toEqual(files)
    expect(() => corpusFiles(page, entries.slice(1))).toThrow(
      /not the validator corpus's[\s\S]*questionnaire-demo-referral\.json: the corpus has no entry of that name/,
    )
  })
})

describe('the versions the page names', () => {
  // SDC is loaded twice, 4.0.0 as the guide and 3.0.0 as CH ORF's
  // dependency: a version picked from two would be a guess.
  test('are the one register entry of each package, or the build stops', () => {
    const packages = [
      { id: 'hl7.fhir.uv.sdc', version: '4.0.0', loadedAs: 'ig' },
      { id: 'hl7.fhir.uv.sdc', version: '3.0.0', loadedAs: 'dependency' },
    ]
    expect(pinned(packages, 'hl7.fhir.uv.sdc', 'ig')).toBe('4.0.0')
    expect(() => pinned(packages, 'hl7.fhir.uv.sdc')).toThrow(/registers 2 packages hl7.fhir.uv.sdc, and the page names exactly one/)
    expect(() => pinned(packages, 'ch.fhir.ig.ch-orf')).toThrow(/registers 0 packages/)
    expect(() => pinned(packages, 'hl7.fhir.uv.sdc', 'core')).toThrow(/registers 0 packages hl7.fhir.uv.sdc loaded as core/)
  })
})

/** Every file outside the app `file` reaches through what it imports, transitively, from the repository's root, by TypeScript's own reading of its imports. */
function reachedOutside(file: string, found = new Set<string>(), seen = new Set<string>()): Set<string> {
  if (seen.has(file)) return found
  seen.add(file)
  for (const { fileName } of ts.preProcessFile(readFileSync(file, 'utf8'), true, true).importedFiles) {
    if (!fileName.startsWith('.')) continue
    const target = [fileName, fileName.replace(/\.js$/, '.ts'), fileName.replace(/\.js$/, '.tsx'), `${fileName}.ts`]
      .map((name) => resolve(dirname(file), name))
      .find((candidate) => existsSync(candidate) && !candidate.endsWith('.d.ts'))
    if (target === undefined) throw new Error(`${relative(repo, file)} imports ${fileName}, which is no file here`)
    const path = relative(repo, target).replaceAll('\\', '/')
    if (!path.startsWith('apps/demo/')) found.add(path)
    reachedOutside(target, found, seen)
  }
  return found
}

/**
 * The suite's own test files: every file under src/ and scripts/ that its
 * include, in vitest.config.ts, names. The include is read as written, so
 * a pattern added there fails the case below until this walks it too.
 */
function suiteFiles(): string[] {
  const include = /\binclude: (\[[^\]]*\]),\n\s*environment:/.exec(readFileSync(join(app, 'vitest.config.ts'), 'utf8'))?.[1]
  if (include !== "['src/**/*.test.{ts,tsx}', 'scripts/**/*.test.mjs']")
    throw new Error(`the suite's include is ${String(include)}, which suiteFiles() does not walk`)
  const tests = (directory: string, name: RegExp): string[] =>
    readdirSync(join(app, directory), { recursive: true, withFileTypes: true })
      .filter((entry) => entry.isFile() && name.test(entry.name))
      .map((entry) => join(entry.parentPath, entry.name))
  return [...tests('src', /\.test\.tsx?$/), ...tests('scripts', /\.test\.mjs$/)]
}

/** apps/demo/turbo.json's inputs outside the app, for each task that names any, as paths from the repository's root. */
function turboInputs(): Record<string, string[]> {
  // turbo.json is JSON with comments: a line that is one is dropped.
  const text = readFileSync(join(app, 'turbo.json'), 'utf8')
    .split('\n')
    .filter((line) => !line.trim().startsWith('//'))
    .join('\n')
  const tasks: Record<string, { inputs?: string[] }> = JSON.parse(text).tasks
  return Object.fromEntries(
    Object.entries(tasks).map(([task, { inputs = [] }]) => [
      task,
      inputs
        .filter((input) => input.startsWith('$TURBO_ROOT$/'))
        .map((input) => input.slice('$TURBO_ROOT$/'.length))
        .sort(),
    ]),
  )
}

describe("the build's inputs outside the app", () => {
  // turbo hashes a package's own files and its dependencies' builds. The
  // corpus's referral, the registers, the notices and CLAUDE.md are none
  // of those: a turbo cache would replay a page built from an older
  // corpus, or one that names an older validator, and the suite's run of
  // it, unless turbo.json names each. Derived from the build itself --
  // the files it read, and every module its configs reach -- and, for the
  // suite, from every module its own test files reach as well, the browser
  // gate's checks of its plan and results among them, so a new import or a
  // new read fails here until turbo.json names it.
  test('are every file the build reads or imports, and turbo.json names exactly those for the build, and those and what the suite imports for the suite', async () => {
    await factsOf()
    await load(DEMO_MODULES[1] ?? '')
    const built = new Set([...reachedOutside(join(app, 'vite.config.ts')), ...reachedOutside(join(app, 'vitest.config.ts')), ...outsideReads()])
    expect(built).toContain('scripts/validator/demo-referral.mjs')
    expect(built).toContain('docs/release/letter.json')
    expect(built).toContain('scripts/third-party-notices.mjs')
    const suite = new Set([...built, ...suiteFiles().flatMap((file) => [...reachedOutside(file)])])
    expect(suite).toContain('scripts/browsers.mjs')
    expect(turboInputs()).toEqual({ build: [...built].sort(), test: [...suite].sort(), 'test:coverage': [...suite].sort() })
  })
})
