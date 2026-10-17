/**
 * The resources a host hands over to stand beside the Composition, each
 * under the `urn:uuid:` it names it by.
 *
 * Each resource is the host's, and is not typed here: a Patient, a
 * Practitioner, a QuestionnaireResponse, the DocumentReference and Binary
 * this package made. What is held of each is what any document's entry
 * must be: FHIR JSON, as health-core writes and reads it, with a resource
 * type and, where it has one, an id of R4's grammar. It is written by
 * health-core's `writeJson` and read back by its `readJson` once, here:
 * that refuses what FHIR JSON cannot carry -- a JavaScript number, an
 * empty string, a getter -- at the path health-core finds it, under the
 * entry's; and the Bundle holds that copy, which shares nothing with the
 * host's objects, so that a document once assembled does not change
 * (documents.html: "its content can never be changed").
 */
import { id, known, member, needed, optional, readItems, readJson, Refusal, uuid, valueAt, writeJson, type FhirJson, type FhirJsonObject, type FhirUuid, type Refusals } from '@formancy/health-core'
import { CONTEXT } from './context.js'

/** A resource the host hands over, under the name it gives it in the Bundle. */
export interface DocumentEntry {
  /** The entry's name: a `urn:uuid:` the host gives, lowercase. */
  readonly fullUrl: string
  readonly resource: FhirJsonObject
}

/** An entry as read: its path, its name, and its resource and type, undefined where the resource was refused. */
export interface Entry {
  readonly path: string
  readonly fullUrl: FhirUuid | undefined
  readonly resource: FhirJsonObject | undefined
  readonly type: string | undefined
}

/** Where the entries stand in what the host handed over. */
export const ENTRIES = member(CONTEXT, 'entries')

/** A resource type's form: a capital and letters, as R4 names every one. */
const RESOURCE_TYPE = /^[A-Z][A-Za-z]*$/

/** `resource` written and read back by health-core: a copy, or refused at `path` and below, where health-core found it. */
function copyOf(resource: unknown, path: string): FhirJson {
  try {
    return readJson(writeJson(resource as FhirJson))
  } catch (error) {
    // health-core's paths start at `$`, the value it was handed: here, the
    // entry's resource. writeJson refuses with a rule and a path alone, and
    // readJson holds FHIR JSON's rules as writeJson does (health-core's
    // exactness.test.ts), so it refuses nothing writeJson wrote: a rule and
    // a path are all there is to carry over. Anything else thrown is a
    // bug, and thrown on.
    throw error instanceof Refusal ? new Refusal(error.rule, `${path}${error.path.slice(1)}`) : error
  }
}

function entryAt(entries: readonly unknown[], index: string, path: string, refusals: Refusals): Entry {
  const given = valueAt(entries, index)
  if (!known(given, ['fullUrl', 'resource'], path, refusals)) return { path, fullUrl: undefined, resource: undefined, type: undefined }
  const fullUrl = needed(given, 'fullUrl', member(path, 'fullUrl'), refusals, uuid)
  const at = member(path, 'resource')
  const resource = valueAt(given, 'resource')
  if (resource === undefined) {
    refusals.add('absent', at)
    return { path, fullUrl, resource: undefined, type: undefined }
  }
  const before = refusals.count
  const copy = refusals.take(() => copyOf(resource, at))
  if (copy === undefined) return { path, fullUrl, resource: undefined, type: undefined }
  if (typeof copy !== 'object' || copy === null || Array.isArray(copy)) {
    refusals.add('absent', at)
    return { path, fullUrl, resource: undefined, type: undefined }
  }
  const type = needed(copy, 'resourceType', member(at, 'resourceType'), refusals, (value, where) => {
    if (typeof value !== 'string' || !RESOURCE_TYPE.test(value)) throw new Refusal('grammar', where)
    return value
  })
  optional(copy, 'id', member(at, 'id'), refusals, id)
  return refusals.count > before ? { path, fullUrl, resource: undefined, type: undefined } : { path, fullUrl, resource: copy as FhirJsonObject, type }
}

/** The entries `given` holds, each read; undefined, refused, when there is no list of them. */
export function entriesOf(given: unknown, refusals: Refusals): Entry[] | undefined {
  if (!Array.isArray(given)) return refusals.add('absent', ENTRIES)
  return readItems(given, ENTRIES, (index, path) => entryAt(given, index, path, refusals))
}
