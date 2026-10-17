/**
 * A reference to another resource, as the host supplies one: by name, and
 * never by address (formancy.ai 0077; plan section 10).
 *
 * R4's Reference.reference is "a relative reference, in which case it is
 * relative to the service base URL, or an absolute URL that resolves to the
 * location where the resource is found", and inside a Bundle a `urn:uuid:`
 * its entries are named by (https://hl7.org/fhir/R4/references.html, read
 * on 17 October 2026). Two of those name a resource that the receiver
 * resolves: `Patient/123`, against the receiver's own base, and a
 * `urn:uuid:` within the Bundle that carries both. An absolute URL is where
 * to fetch a person's record, which is the host's to decide and never
 * this module's, so it is refused; so is a version-specific reference, a
 * contained one, and anything else that is not one of the two.
 *
 * The resource type is held to the form of one -- a capital and letters --
 * and, where R4 allows only some types, to those; that it names a type R4
 * has at all, where it allows any, is not checked here. The id is R4's id.
 */
import { Refusal } from './refusal.js'

declare const named: unique symbol

/** A reference's text that passed the check, and is still a string. */
export type FhirReference = string & { readonly [named]: 'reference' }

/** `Type/id`: a resource type's form, and R4's id. */
const RELATIVE = /^([A-Z][A-Za-z]*)\/[A-Za-z0-9\-.]{1,64}$/

/** A Bundle entry's name: `urn:uuid:` and a UUID in lowercase, as R4 requires of one in a URI. */
const UUID = /^urn:uuid:[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/

/**
 * `value` as a reference by name, at `path`: `Type/id`, of one of `types`
 * when they are given, or a `urn:uuid:`, whose type is the Bundle's to
 * resolve and check. Refused as `reference` otherwise, never quoting it.
 */
export function reference(value: string, path: string, types?: readonly string[]): FhirReference {
  // Asked of text only, as every check here is: a regex would convert
  // anything else to a string through code the value brings.
  if (typeof value !== 'string') throw new Refusal('reference', path)
  if (UUID.test(value)) return value as FhirReference
  const type = RELATIVE.exec(value)?.[1]
  if (type === undefined || (types !== undefined && !types.includes(type))) throw new Refusal('reference', path)
  return value as FhirReference
}
