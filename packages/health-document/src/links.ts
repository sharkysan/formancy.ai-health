/**
 * Where a resource refers to another: every Reference in it, at any depth,
 * and a DocumentReference's attachment url.
 *
 * Found without the resources' definitions, by the one name R4 gives a
 * Reference's text: `reference`, a string, in an object. R4 has three
 * other strings of that name, each a uri and no Reference -- an
 * Expression's, a DetectedIssue's and an Immunization's education's --
 * and they are told apart: the first by the `language` every Expression
 * has and no Reference does, the other two by their element (read from
 * the R4 4.0.1 package's StructureDefinitions on 17 October 2026). An
 * Attachment's url is a link only in a DocumentReference's content, which
 * this package writes; anywhere else -- a Patient's photo -- it is not
 * followed (0008).
 *
 * The walk keeps its own stack, as health-core's reader does: a host's
 * resource nested deeper than a call stack is read, not a crash.
 */
import { isFhirNumber, item, member, type FhirJson, type FhirJsonObject } from '@formancy/health-core'

export interface Link {
  /** Where the link's text is, as the host handed it over: `context.entries[2].resource.subject.reference`. */
  readonly path: string
  /** R4's element the link stands at, without indices: `DocumentReference.author`. */
  readonly element: string
  /** What it names: a reference's text, or an attachment's url. */
  readonly target: string
  /** The type a Reference says it names, in its own `type`, when it says one. */
  readonly declared: string | undefined
  /** Whether it is an attachment's url rather than a Reference. */
  readonly attachment: boolean
}

/** Strings R4 calls reference that are uris, by element. */
const URI_REFERENCES: ReadonlySet<string> = new Set(['DetectedIssue.reference', 'Immunization.education.reference'])

/** The element a DocumentReference names its bytes' Binary at. */
const ATTACHMENT_URL = 'DocumentReference.content.attachment.url'

/** Whether `value` is a FHIR JSON object: no array, no number, no null. */
export const isObject = (value: FhirJson | undefined): value is FhirJsonObject =>
  typeof value === 'object' && value !== null && !Array.isArray(value) && !isFhirNumber(value)

/** One link `holder`'s `name` makes, or undefined when it is none. */
function linkAt(holder: FhirJsonObject, name: string, text: string, path: string, element: string): Link | undefined {
  const child = `${element}.${name}`
  if (child === ATTACHMENT_URL) return { path, element: child, target: text, declared: undefined, attachment: true }
  if (name !== 'reference' || URI_REFERENCES.has(child) || Object.hasOwn(holder, 'language')) return undefined
  const declared = holder['type']
  return { path, element, target: text, declared: typeof declared === 'string' ? declared : undefined, attachment: false }
}

/** Every link in `resource`, in the order the resource holds them; paths start at `path`, where the resource stands. */
export function linksOf(resource: FhirJsonObject, path: string): Link[] {
  const found: Link[] = []
  const resourceType = resource['resourceType']
  const stack: { readonly value: FhirJson; readonly path: string; readonly element: string }[] = [
    { value: resource, path, element: typeof resourceType === 'string' ? resourceType : '' },
  ]
  for (let next = stack.pop(); next !== undefined; next = stack.pop()) {
    const { value, element } = next
    const inner: { readonly value: FhirJson; readonly path: string; readonly element: string }[] = []
    if (Array.isArray(value)) value.forEach((each: FhirJson, index: number) => inner.push({ value: each, path: item(next.path, index), element }))
    else if (isObject(value)) {
      for (const [name, each] of Object.entries(value)) {
        const at = member(next.path, name)
        if (typeof each !== 'string') inner.push({ value: each, path: at, element: `${element}.${name}` })
        else {
          const link = linkAt(value, name, each, at, element)
          if (link !== undefined) found.push(link)
        }
      }
    }
    // Pushed in reverse, so that the stack gives them back in order.
    for (let index = inner.length - 1; index >= 0; index -= 1) stack.push(inner[index] as (typeof inner)[number])
  }
  return found
}
