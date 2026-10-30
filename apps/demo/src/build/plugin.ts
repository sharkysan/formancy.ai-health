/**
 * The Vite plugin that hands the page what only the build can read, as
 * three modules (0012): the corpus's demo referral, the letter's PDF, and
 * the facts the page states. It runs in Node, where the validator corpus
 * and health-corpus's renderer do; nothing the page loads imports this
 * file, and the page never fetches: the policy it is served under allows
 * no connection at all (scripts/demo-headers.mjs).
 *
 * - **The sample** is scripts/validator/demo-referral.mjs's data, as JSON:
 *   the form, its answers and what the synthetic host says of them, which
 *   the validator gate judges.
 * - **The letter** is the PDF health-corpus renders with Formancy Report,
 *   taken through `registeredLetter`, which refuses other bytes than
 *   docs/release/letter.json registers -- the bytes the gate judged -- so a
 *   machine that renders it otherwise stops the build rather than ship a
 *   PDF nobody judged.
 * - **The facts**: the releases the page names, read from the registers
 *   and the manifest; HL7's and LOINC's notices and CLAUDE.md's sentence of
 *   what the product is not, through the modules the repository's guards
 *   read them with; and the corpus files the page's first resources are.
 *   Before it says so, the build makes those resources as the page does
 *   (src/exports.ts) and holds each to the corpus's entry of its name,
 *   byte for byte, and stops when one differs: the page's claim that what
 *   it shows before anything is changed is what the gate judged is held by
 *   every build, the one Cloudflare runs included, and not only by a test.
 *
 * Each module's id is `\0`-prefixed, so no other plugin transforms it.
 * Every file outside the app it reads goes through `readOutside`, which
 * the dev server watches and apps/demo/turbo.json lists, so a turbo cache
 * never replays a build made from an older corpus (plugin.test.ts holds the
 * two the same).
 */
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import * as core from '@formancy/health-core'
import * as ch from '@formancy/health-ch'
import * as documents from '@formancy/health-corpus'
import * as questionnaire from '@formancy/health-questionnaire'
import type { Plugin } from 'vite'
import { HL7_NOTICE, LOINC_NOTICE } from '../../../../scripts/notices.mjs'
import { intendedPurpose } from '../../../../scripts/purpose.mjs'
import { corpus } from '../../../../scripts/validator/corpus.mjs'
import {
  DEMO_NAMES,
  demoChOrfContext,
  demoReferral,
  demoReferralAnswers,
  demoReferralContext,
  demoResponseContext,
} from '../../../../scripts/validator/demo-referral.mjs'
import { LETTER, registeredLetter } from '../../../../scripts/validator/letter.mjs'
import { IG_PACKAGES, VALIDATOR_PIN } from '../../../../scripts/validator/registers.mjs'
import { byFile, FILES, firstOf, type Outcome, type Sample } from '../exports.js'
import type { Facts } from '../facts.js'

/** The repository, and the app, whatever directory the build runs in. */
const repo = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..', '..')
const app = join(repo, 'apps', 'demo')

/** What the page imports. */
export const SAMPLE_IMPORT = 'virtual:formancy-health-demo/sample'
export const LETTER_IMPORT = 'virtual:formancy-health-demo/letter'
export const FACTS_IMPORT = 'virtual:formancy-health-demo/facts'
const IMPORTS = [SAMPLE_IMPORT, LETTER_IMPORT, FACTS_IMPORT]

/** The modules once resolved, which no file holds. */
export const DEMO_MODULES = IMPORTS.map((id) => `\0${id}`)

/** Every file outside the app the build has read, from the repository's root, with forward slashes. */
const read = new Set<string>()

/** `file`, from the repository's root, read as text, and remembered as read. */
function readOutside(file: string): string {
  read.add(file)
  return readFileSync(join(repo, file), 'utf8')
}

/** The files outside the app the build has read so far, sorted. */
export const outsideReads = (): readonly string[] => [...read].sort()

/**
 * The sample, as the page receives it: demo-referral.mjs's data through
 * JSON, which is how the module carries it.
 */
export function sampleOf(): Sample {
  const sample = {
    form: demoReferral,
    questionnaireContext: demoReferralContext,
    responseContext: demoResponseContext,
    chOrfContext: demoChOrfContext,
    answers: demoReferralAnswers,
    names: { response: DEMO_NAMES.response },
  }
  return JSON.parse(JSON.stringify(sample)) as Sample
}

let letter: Promise<Uint8Array> | undefined

/** The letter's PDF: rendered once a build, and only as the bytes the register holds. */
export function letterOf(): Promise<Uint8Array> {
  letter ??= registeredLetter(documents.renderReferral, JSON.parse(readOutside(LETTER)))
  return letter
}

/** One accepted or broken resource of the validator gate's corpus, as scripts/validator/corpus.mjs makes it. */
export interface CorpusEntry {
  readonly file: string
  readonly expect: unknown
  readonly resource: unknown
}

/**
 * What is wrong with the page's first resources against the corpus, one
 * sentence each: a resource of the page's the page does not make, that no
 * corpus entry of its name holds, or one the gate does not accept, or that
 * is made of other bytes.
 */
export function sampleProblems(first: ReadonlyMap<string, Outcome>, entries: readonly CorpusEntry[]): string[] {
  const files = [FILES.questionnaire, FILES.response, FILES.document, FILES.letter.data, FILES.letter.binary]
  return files.flatMap((file) => {
    const made = first.get(file)
    const entry = entries.find((candidate) => candidate.file === file)
    if (made?.kind !== 'made') return [`${file}: the page does not make it of the sample (${made?.kind ?? 'not made'})`]
    if (entry === undefined) return [`${file}: the corpus has no entry of that name`]
    if (entry.expect !== 'accepted') return [`${file}: the corpus's entry of that name is one the gate refuses`]
    return made.json === core.writeJson(entry.resource as core.FhirJson) ? [] : [`${file}: the page makes other bytes of the sample than the corpus's entry`]
  })
}

/**
 * The files of the page's first resources, once each is shown to be the
 * corpus's entry of its name; the build stops, with every problem, when
 * one is not.
 */
export function corpusFiles(first: ReadonlyMap<string, Outcome>, entries: readonly CorpusEntry[]): string[] {
  const problems = sampleProblems(first, entries)
  if (problems.length > 0)
    throw new Error(
      `the demo's first resources are not the validator corpus's, so the page would claim what the gate never judged:\n  - ${problems.join('\n  - ')}`,
    )
  return [...first.keys()]
}

/** One package the implementation guides' register lists. */
interface Registered {
  readonly id: string
  readonly version: string
  readonly loadedAs: string
}

/** The one register entry of `id`, of `loadedAs` where a package is loaded twice, at the version it pins. */
export function pinned(packages: readonly Registered[], id: string, loadedAs?: string): string {
  const found = packages.filter((entry) => entry.id === id && (loadedAs === undefined || entry.loadedAs === loadedAs))
  const [only, ...more] = found
  if (only === undefined || more.length > 0)
    throw new Error(
      `${IG_PACKAGES} registers ${String(found.length)} packages ${id}${loadedAs === undefined ? '' : ` loaded as ${loadedAs}`}, and the page names exactly one`,
    )
  return only.version
}

/** What the page states, read where the repository holds it, after its first resources are shown to be the corpus's. */
export async function factsOf(): Promise<Facts> {
  const pdf = await letterOf()
  const entries = corpus({ core, questionnaire, documents, pdf, ch }) as readonly CorpusEntry[]
  const files = corpusFiles(byFile(firstOf(sampleOf(), pdf)), entries)
  const { packages } = JSON.parse(readOutside(IG_PACKAGES)) as { readonly packages: readonly Registered[] }
  const manifest = JSON.parse(readFileSync(join(app, 'package.json'), 'utf8')) as { readonly dependencies: { readonly '@formancy/react': string } }
  const registered = JSON.parse(readOutside(LETTER)) as { readonly renderedBy: { readonly '@formancy/report-render-pdf': string } }
  return {
    versions: {
      validator: (JSON.parse(readOutside(VALIDATOR_PIN)) as { readonly version: string }).version,
      r4: pinned(packages, 'hl7.fhir.r4.core', 'core'),
      sdc: pinned(packages, 'hl7.fhir.uv.sdc', 'ig'),
      chOrf: pinned(packages, 'ch.fhir.ig.ch-orf'),
      chCore: pinned(packages, 'ch.fhir.ig.ch-core'),
      chTerm: pinned(packages, 'ch.fhir.ig.ch-term'),
    },
    formancy: manifest.dependencies['@formancy/react'],
    report: registered.renderedBy['@formancy/report-render-pdf'],
    notices: { hl7: HL7_NOTICE, loinc: LOINC_NOTICE },
    purpose: intendedPurpose(readOutside('CLAUDE.md')),
    corpus: files,
  }
}

/** A module whose default export is `value`, as JSON. */
const exporting = (value: unknown): string => `export default ${JSON.stringify(value)}\n`

/** Each module's source, by its resolved id. */
const SOURCES: Readonly<Record<string, () => Promise<string>>> = {
  [`\0${SAMPLE_IMPORT}`]: () => Promise.resolve(exporting(sampleOf())),
  // The PDF as canonical base64, which the page decodes with health-core.
  [`\0${LETTER_IMPORT}`]: async () => exporting(core.toBase64Binary(await letterOf(), 'letter')),
  [`\0${FACTS_IMPORT}`]: async () => exporting(await factsOf()),
}

export function demoModules(): Plugin {
  return {
    name: 'formancy-health:demo-modules',
    resolveId: (id) => (IMPORTS.includes(id) ? `\0${id}` : undefined),
    async load(id) {
      const source = SOURCES[id]
      if (source === undefined) return undefined
      const text = await source()
      for (const file of outsideReads()) this.addWatchFile(join(repo, file))
      return text
    },
  }
}
