/**
 * The resource types R4 allows a reference this package writes to name,
 * by element, where R4 does not allow any resource
 * (https://hl7.org/fhir/R4/composition.html and documentreference.html,
 * read on 17 October 2026). Composition.subject and a section's entries
 * name any resource, and are not here.
 *
 * Read twice and decided once: a DocumentReference checks a `Type/id` it
 * is given against its element's list, and a Bundle checks the entry a
 * `urn:uuid:` resolves to against the same list, so the two cannot allow
 * different types.
 */
export const TARGETS: ReadonlyMap<string, readonly string[]> = new Map([
  ['Composition.author', ['Practitioner', 'PractitionerRole', 'Device', 'Patient', 'RelatedPerson', 'Organization']],
  ['DocumentReference.subject', ['Patient', 'Practitioner', 'Group', 'Device']],
  ['DocumentReference.author', ['Practitioner', 'PractitionerRole', 'Organization', 'Device', 'Patient', 'RelatedPerson']],
  // Not a Reference but a url: the Binary of the same Bundle that holds the
  // attachment's bytes (0008).
  ['DocumentReference.content.attachment.url', ['Binary']],
])

/** The types R4 allows at `element`, or undefined where it allows any. */
export const targetsOf = (element: string): readonly string[] | undefined => TARGETS.get(element)
