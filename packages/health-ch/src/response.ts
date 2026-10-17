/**
 * What a CH ORF document holds the host's answers to (0009).
 *
 * The response is the host's, made by health-questionnaire's
 * toQuestionnaireResponse from the form and its submission (0007). It is
 * copied here once, written and read back by health-core, which refuses
 * what FHIR JSON cannot carry; that copy is what is checked and what the
 * Bundle carries, so that a host's object that reads one way and copies
 * another -- a getter, a Proxy -- cannot be checked as one response and
 * carried as another. health-document then resolves every reference in
 * it. What CH ORF 3.0.2 asks of it is held here (StructureDefinition
 * `ch-orf-questionnaireresponse`, read from the ch.fhir.ig.ch-orf 3.0.2
 * package on 17 October 2026):
 *
 * - **What toQuestionnaireResponse writes, and nothing else.** The profile
 *   types every reference a response can hold: `basedOn` a
 *   ch-orf-servicerequest, `encounter` a ch-core-encounter, `partOf` R4's
 *   Observation or Procedure. health-questionnaire writes none of them,
 *   and nothing here holds them to the profile; a member it does not
 *   write -- those, an id, a narrative -- is refused as `unmapped` at the
 *   response, its name not repeated.
 * - **The claim.** The profile requires nothing R4 does not; it types the
 *   references. The validator holds a response to it only when the
 *   response claims it: measured the same day, a response whose subject
 *   was the practitioner was refused claiming the profile and accepted
 *   without the claim, since the document's slices for a response are
 *   0..1 and one that is not CH ORF's matches none. So the claim is
 *   required, with CH ORF's version, which the host passes to
 *   toQuestionnaireResponse as its `profiles` (0007 as 0009 narrows it).
 * - **The subject** is the document's patient: the profile types it
 *   ch-core-patient, and the document holds one.
 * - **The author and the source** name entries of this document, of the
 *   types the profile allows that a CH ORF document of this package
 *   holds: the author the role, the practitioner, the organisation or the
 *   patient; the source the patient, the role or the practitioner.
 * - **The Questionnaire by its canonical, with its version.** The
 *   document does not carry the Questionnaire; the host publishes it, and
 *   the response must name the version it answers.
 *
 * Each is refused where it stands in the host's context, and the subject,
 * the author and the source are checked here, though the validator would
 * check them against the claim, so that the refusal names the cause
 * rather than a cascade of slices. A refusal of what the copy found below
 * the response's own members gives the path health-core gives, and that
 * path repeats the names the answers hold, which are FHIR's where
 * toQuestionnaireResponse wrote them (0004).
 */
import { known, member, needed, readJson, Refusals, uuid, valueAt, writeJson, type FhirJson, type FhirJsonObject } from '@formancy/health-core'
import { CONTEXT } from './context.js'
import type { Written } from './people.js'
import { PROFILES } from './profiles.js'

/** Where the response stands in what the host handed over. */
export const RESPONSE = member(CONTEXT, 'response')

/** Where the response's resource stands. */
export const RESPONSE_RESOURCE = member(RESPONSE, 'questionnaireResponse')

/** The members toQuestionnaireResponse writes of a response (health-questionnaire's response.ts), and the only ones a document here carries. */
const RESPONSE_MEMBERS: readonly string[] = ['resourceType', 'meta', 'questionnaire', 'status', 'subject', 'authored', 'author', 'source', 'item']

/** The types ch-orf-questionnaireresponse allows its author, of those a document here holds. */
const AUTHORS: readonly string[] = ['Patient', 'PractitionerRole', 'Practitioner', 'Organization']

/** The types it allows its source, of those a document here holds: never an organisation. */
const SOURCES: readonly string[] = ['Patient', 'PractitionerRole', 'Practitioner']

/**
 * The reference `response` holds under `name`, held to name an entry of
 * `entries` of one of `types`: refused as `dangling` where it names
 * nothing the document holds, as `reference` where it is no reference by
 * name or names an entry of another type.
 */
function checkReference(response: FhirJsonObject, name: string, types: readonly string[], entries: ReadonlyMap<string, string>, refusals: Refusals): void {
  const at = member(member(RESPONSE_RESOURCE, name), 'reference')
  const target = valueAt(valueAt(response, name), 'reference')
  if (typeof target !== 'string') {
    refusals.add('reference', at)
    return
  }
  const type = entries.get(target)
  if (type === undefined) refusals.add('dangling', at)
  else if (!types.includes(type)) refusals.add('reference', at)
}

/** Whether `canonical` names a version: something after its `|`. */
const versioned = (canonical: string) => /\|./.test(canonical)

/**
 * The host's response written and read back by health-core: plain FHIR
 * JSON that shares nothing with the host's object. Refused where it is
 * none, at its own path: health-core's paths start at `$`, the value it
 * was handed, and writeJson refuses with a rule and a path alone.
 * Anything else it throws is a bug, which `take` throws on.
 */
function copyOf(response: object, refusals: Refusals): FhirJsonObject | undefined {
  const copied = new Refusals()
  const copy = copied.take(() => readJson(writeJson(response as FhirJson)) as FhirJsonObject)
  for (const refusal of copied.list) refusals.add(refusal.rule, `${RESPONSE_RESOURCE}${refusal.path.slice(1)}`)
  return copy
}

/** What CH ORF asks of the copied response, each refused where it stands. */
function checkResponse(response: FhirJsonObject, entries: ReadonlyMap<string, string>, refusals: Refusals): void {
  if (valueAt(response, 'resourceType') !== 'QuestionnaireResponse') refusals.add('profile', member(RESPONSE_RESOURCE, 'resourceType'))
  const claims = valueAt(valueAt(response, 'meta'), 'profile')
  if (!Array.isArray(claims) || !claims.includes(PROFILES.questionnaireResponse)) refusals.add('profile', member(member(RESPONSE_RESOURCE, 'meta'), 'profile'))
  const questionnaire = valueAt(response, 'questionnaire')
  if (questionnaire === undefined) refusals.add('absent', member(RESPONSE_RESOURCE, 'questionnaire'))
  else if (typeof questionnaire !== 'string' || !versioned(questionnaire)) refusals.add('unversioned', member(RESPONSE_RESOURCE, 'questionnaire'))
  if (valueAt(response, 'subject') === undefined) refusals.add('absent', member(RESPONSE_RESOURCE, 'subject'))
  else checkReference(response, 'subject', ['Patient'], entries, refusals)
  if (valueAt(response, 'author') !== undefined) checkReference(response, 'author', AUTHORS, entries, refusals)
  if (valueAt(response, 'source') !== undefined) checkReference(response, 'source', SOURCES, entries, refusals)
}

/**
 * The host's response, held to what CH ORF asks of it, naming entries of
 * `entries`, the document's names and each one's resource type, the one
 * Patient among them; undefined where the host gives none, or with every
 * reason in `refusals` where it is refused.
 */
export function responseOf(holder: unknown, entries: ReadonlyMap<string, string>, refusals: Refusals): Written<FhirJsonObject> | undefined {
  const given = valueAt(holder, 'response')
  if (given === undefined) return undefined
  const before = refusals.count
  if (!known(given, ['fullUrl', 'questionnaireResponse'], RESPONSE, refusals)) return undefined
  const fullUrl = needed(given, 'fullUrl', member(RESPONSE, 'fullUrl'), refusals, uuid)
  // Its members are read on the host's object first, so that one it should
  // not hold is refused without its name, never quoted where the copy
  // refuses what it holds; and on the copy again, which is what is carried.
  const members = refusals.count
  const response = valueAt(given, 'questionnaireResponse')
  if (!known(response, RESPONSE_MEMBERS, RESPONSE_RESOURCE, refusals) || refusals.count > members) return undefined
  const copy = copyOf(response, refusals)
  if (copy === undefined || !known(copy, RESPONSE_MEMBERS, RESPONSE_RESOURCE, refusals)) return undefined
  checkResponse(copy, entries, refusals)
  if (refusals.count > before || fullUrl === undefined) return undefined
  return { fullUrl, resource: copy }
}
