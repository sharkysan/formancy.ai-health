/**
 * What the host says about the answers it exports: which Questionnaire
 * they answer, how far they are, when they were last changed, and whose
 * they are. None of it is in the submission, and none of it is made here:
 * no clock, no identifier (CLAUDE.md, "Identity comes from the host").
 */
import { code, dateTime, item, known, member, reference, uri, type FhirCode, type FhirDateTime, type FhirUri, type Refusals } from '@formancy/health-core'
import { checkContext, type CheckedContext, type QuestionnaireContext } from './context.js'
import type { Reference } from './response-resource.js'
import { CONTEXT } from './refusals.js'

/** R4's QuestionnaireResponseStatus, the codes `QuestionnaireResponse.status` is bound to, required. */
export const RESPONSE_STATUSES = ['in-progress', 'completed', 'amended', 'entered-in-error', 'stopped'] as const

/**
 * The statuses whose response must answer every enabled required item:
 * R4's required is "present in a 'completed' QuestionnaireResponse", and
 * the validator refuses a completed or an amended one without, and only
 * warns of the others (measured 17 October 2026, 0007).
 */
const COMPLETE: ReadonlySet<string> = new Set(['completed', 'amended'])

/** The resource types R4 allows as `QuestionnaireResponse.author`. */
export const AUTHORS = ['Device', 'Practitioner', 'PractitionerRole', 'Patient', 'RelatedPerson', 'Organization'] as const

/** The resource types R4 allows as `QuestionnaireResponse.source`. */
export const SOURCES = ['Patient', 'Practitioner', 'PractitionerRole', 'RelatedPerson'] as const

export interface ResponseContext {
  /**
   * What the host exports the Questionnaire these answers answer with,
   * as `toQuestionnaire` takes it: the response names that
   * Questionnaire's url and version, exactly as it writes them.
   */
  readonly questionnaire: QuestionnaireContext
  /** The response's status: one of R4's QuestionnaireResponseStatus codes. */
  readonly status: (typeof RESPONSE_STATUSES)[number]
  /** When the answers were last changed, as a FHIR dateTime with its zone: the host's clock, never read here. */
  readonly authored: string
  /** Whose answers they are, by name: `Patient/<id>`, or a `urn:uuid:` in the Bundle that carries both. Never an address. */
  readonly subject?: { readonly reference: string }
  /** Who wrote them down, by name: one of R4's author types. */
  readonly author?: { readonly reference: string }
  /** Who gave them, by name: one of R4's source types. */
  readonly source?: { readonly reference: string }
  /**
   * The profiles the response claims beside SDC's, canonicals the host
   * names with their version: a country's response profile, such as CH
   * ORF's, whose rules the validator holds a response to only when it
   * claims it (0009). Never fetched.
   */
  readonly profiles?: readonly string[]
}

/** The response's own elements, each of the type it is written as. */
export interface ResponseElements {
  readonly status: FhirCode
  readonly authored: FhirDateTime
  readonly subject: Reference | undefined
  readonly author: Reference | undefined
  readonly source: Reference | undefined
  /** The host's claims, each once, in the order given. */
  readonly profiles: readonly FhirUri[]
}

/**
 * The context, checked: the Questionnaire's, undefined where it was
 * refused, and the response's own elements, undefined where its status or
 * its time was -- so that the form and the answers are still read where
 * they can be, and every refusal is given at once. A reference refused is
 * left out of the elements; a refusal of any kind refuses the response.
 */
export interface CheckedResponseContext {
  readonly questionnaire: CheckedContext | undefined
  /** Whether every enabled required item must have its answer. */
  readonly complete: boolean
  readonly elements: ResponseElements | undefined
}

const KNOWN_STATUS: ReadonlySet<string> = new Set(RESPONSE_STATUSES)

/** The members of the context, and no others. */
const MEMBERS = ['questionnaire', 'status', 'authored', 'subject', 'author', 'source', 'profiles']

/** The reference at `name` in the context, checked, of one of `types` where R4 allows only those. */
function referenceAt(context: ResponseContext, name: 'subject' | 'author' | 'source', refusals: Refusals, types?: readonly string[]): Reference | undefined {
  const given: unknown = context[name]
  if (given === undefined) return undefined
  // A reference by name and nothing else: a display beside it is the
  // host's text, and would be left out without a word.
  if (typeof given === 'object' && given !== null && !Array.isArray(given)) known(given, ['reference'], member(CONTEXT, name), refusals)
  const text = typeof given === 'object' && given !== null ? (given as { readonly reference?: unknown }).reference : undefined
  const checked = refusals.take(() => reference(text as string, member(member(CONTEXT, name), 'reference'), types))
  return checked === undefined ? undefined : { reference: checked }
}

/**
 * The host's profile claims, checked: each a uri, each once. An empty
 * list, or anything that is no list, is refused as absent: FHIR JSON has
 * no empty array, and nothing else is a list of claims.
 */
function profilesAt(context: ResponseContext, refusals: Refusals): FhirUri[] {
  const given: unknown = context.profiles
  if (given === undefined) return []
  const at = member(CONTEXT, 'profiles')
  if (!Array.isArray(given) || given.length === 0) {
    refusals.add('absent', at)
    return []
  }
  const profiles: FhirUri[] = []
  for (const [index, each] of (given as readonly string[]).entries()) {
    const profile = refusals.take(() => uri(each, item(at, index)))
    if (profile !== undefined && !profiles.includes(profile)) profiles.push(profile)
  }
  return profiles
}

/**
 * The context checked, with each thing wrong with it in `refusals`: a
 * member it does not name -- an encounter, a basedOn, which the response
 * does not write -- as `unmapped`, and a context that is no object as
 * `absent` (health-core's `known`).
 */
export function checkResponseContext(context: ResponseContext, refusals: Refusals): CheckedResponseContext {
  if (!known(context, MEMBERS, CONTEXT, refusals)) return { questionnaire: undefined, complete: false, elements: undefined }
  const questionnaire = checkContext(context.questionnaire, refusals, member(CONTEXT, 'questionnaire'))
  const given = refusals.take(() => code(context.status, member(CONTEXT, 'status')))
  const status = given !== undefined && KNOWN_STATUS.has(given) ? given : undefined
  if (given !== undefined && status === undefined) refusals.add('unmapped', member(CONTEXT, 'status'))
  const authored = refusals.take(() => dateTime(context.authored, member(CONTEXT, 'authored')))
  const subject = referenceAt(context, 'subject', refusals)
  const author = referenceAt(context, 'author', refusals, AUTHORS)
  const source = referenceAt(context, 'source', refusals, SOURCES)
  const profiles = profilesAt(context, refusals)
  const complete = status !== undefined && COMPLETE.has(status)
  if (status === undefined || authored === undefined) return { questionnaire, complete, elements: undefined }
  return { questionnaire, complete, elements: { status, authored, subject, author, source, profiles } }
}
