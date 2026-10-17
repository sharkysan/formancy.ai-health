/**
 * What the host says about the form it exports: where its definitions are
 * named, which published version this is, its status, and the languages
 * the Questionnaire must carry. None of it is in the form, and none of it
 * is made here (CLAUDE.md, "Identity comes from the host").
 */
import { code, item, known, language, member, positiveInt, uri, type FhirCode, type FhirPositiveInt, type FhirUri, type Refusals } from '@formancy/health-core'
import { CONTEXT } from './refusals.js'

/** R4's PublicationStatus, the codes `Questionnaire.status` is bound to, required. */
export const STATUSES = ['draft', 'active', 'retired', 'unknown'] as const

export interface QuestionnaireContext {
  /**
   * The canonical base the host names its definitions under, such as
   * `https://forms.example.ch/fhir`. A name and never an address
   * (formancy.ai 0077): nothing fetches it. The Questionnaire's url is
   * this, `/Questionnaire/` and the form's id.
   */
  readonly base: string
  /**
   * The number formancy published this version of the form as -- its
   * server's `form_versions.version`, which counts from one for each form
   * -- as text or a bigint, never a JavaScript number. Absent for a form
   * that has not been published, which then has no version.
   */
  readonly version?: string | bigint
  /** The Questionnaire's status: one of R4's PublicationStatus codes. */
  readonly status: (typeof STATUSES)[number]
  /**
   * The languages the Questionnaire must carry beside the form's default
   * one, as BCP 47 tags in their canonical case: `['de-CH', 'fr', 'it']`,
   * never `de-ch` or `de_CH`. Every text is written in
   * each, or the export is refused; the form's default language needs no
   * translation, and naming it here asks for nothing more.
   */
  readonly languages?: readonly string[]
}

/** The context, checked: every value of the type it is written as. */
export interface CheckedContext {
  readonly base: FhirUri
  readonly version: FhirPositiveInt | undefined
  readonly status: FhirCode
  readonly languages: readonly FhirCode[]
}

const KNOWN_STATUS: ReadonlySet<string> = new Set(STATUSES)

/** The members of the context, and no others. */
const MEMBERS = ['base', 'version', 'status', 'languages']

/**
 * The context checked, or undefined with each thing wrong with it in
 * `refusals`, at paths from `at`: `context`, or where a response's context
 * holds it. A member it does not name is refused as `unmapped`, and a
 * context that is no object as `absent` (health-core's `known`).
 */
export function checkContext(context: QuestionnaireContext, refusals: Refusals, at: string = CONTEXT): CheckedContext | undefined {
  const before = refusals.count
  if (!known(context, MEMBERS, at, refusals)) return undefined
  const base = refusals.take(() => uri(context.base, member(at, 'base')))
  const version = context.version === undefined ? undefined : refusals.take(() => positiveInt(context.version as string | bigint, member(at, 'version')))
  const status = refusals.take(() => code(context.status, member(at, 'status')))
  if (status !== undefined && !KNOWN_STATUS.has(status)) refusals.add('unmapped', member(at, 'status'))
  const languages: FhirCode[] = []
  for (const [index, asked] of (context.languages ?? []).entries()) {
    // A tag in its canonical case, as health-core's language() holds one:
    // the validator checks no translation's lang offline, so this is all
    // that does, and a refusal of a text missing in it names it.
    const tag = refusals.take(() => language(asked, item(member(at, 'languages'), index)))
    // Asked twice is asked once: a second translation into one language
    // would be two answers to which text a reader of it sees.
    if (tag !== undefined && !languages.includes(tag)) languages.push(tag)
  }
  if (refusals.count > before || base === undefined || status === undefined) return undefined
  return { base, version, status, languages }
}
