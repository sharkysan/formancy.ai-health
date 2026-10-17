/**
 * A PDF as an R4 DocumentReference, "for general references to
 * pre-existing documents", its bytes in the attachment or in a Binary the
 * Bundle carries (0008).
 *
 * The attachment says what R4's Attachment says of the bytes, and every
 * part of it is of the bytes themselves: `application/pdf`; the bytes as
 * base64 in `data`, or `url`, the `urn:uuid:` of the Binary that holds
 * them; `size`, their number; `hash`, their SHA-1, base64, as R4 asks;
 * and the host's title. Nothing of a PDF's own -- its title, its dates,
 * its language -- is read out of it: the host says what the document is.
 * What the host says is its status, its type and categories, by codes it
 * names, its subject and authors, by name, and when the reference was
 * made, an instant from the host's clock. None of it is made here, and
 * the same PDF and context give the same resource.
 */
import { code, codeOf, id, instant, known, member, needed, optional, Refusals, text, toBase64Binary, unsignedInt, uuid, valueAt, type FhirCode, type FhirId, type FhirInstant, type FhirUuid, type Refusal } from '@formancy/health-core'
import { conceptAt, conceptsAt, CONTEXT, referenceAt, referencesAt, type ByName, type Coded } from './context.js'
import { checkPdf, PDF, type Pdf } from './pdf.js'
import type { Attachment, Binary, CodeableConcept, DocumentReference, Reference } from './resource.js'
import { sha1 } from './sha1.js'
import { targetsOf } from './targets.js'

/** R4's DocumentReferenceStatus, the codes `DocumentReference.status` is bound to, required. */
export const DOCUMENT_REFERENCE_STATUSES = ['current', 'superseded', 'entered-in-error'] as const

/** What the host says of the PDF it attaches. */
export interface DocumentReferenceContext {
  /** The DocumentReference's id, when the host names it: R4's id. */
  readonly id?: string
  readonly status: (typeof DOCUMENT_REFERENCE_STATUSES)[number]
  /** What kind of document it is, by a code the host names. */
  readonly type: Coded
  readonly category?: readonly Coded[]
  /** Whose document it is, by name: `Patient/<id>`, or the `urn:uuid:` of an entry. Never an address. */
  readonly subject: ByName
  /** When the DocumentReference was made, an instant with its zone: the host's clock, never read here. */
  readonly date: string
  readonly author?: readonly ByName[]
  /** The title a receiver lists the document under: the attachment's. */
  readonly title: string
  /**
   * Where the bytes go: given, into a Binary the Bundle carries under this
   * `urn:uuid:`, which the attachment's url names; absent, into the
   * attachment's data.
   */
  readonly binary?: { readonly fullUrl: string; readonly id?: string }
}

export type DocumentReferenceExport =
  | { readonly ok: true; readonly documentReference: DocumentReference; readonly binary: Binary | undefined }
  | { readonly ok: false; readonly refusals: readonly Refusal[] }

/** The PDF's media type, the one this package attaches. */
const PDF_MEDIA_TYPE = 'application/pdf'

/** The context's elements, each checked; undefined where one was refused. */
interface Elements {
  readonly id: FhirId | undefined
  readonly status: FhirCode | undefined
  readonly type: CodeableConcept | undefined
  readonly category: CodeableConcept[] | undefined
  readonly subject: Reference | undefined
  readonly date: FhirInstant | undefined
  readonly author: Reference[] | undefined
  readonly title: string | undefined
  readonly binary: { readonly fullUrl: FhirUuid; readonly id: FhirId | undefined } | undefined
}

/** Where the bytes go, checked: the Binary's name and id, or undefined when they go into the attachment, or were refused. */
function binaryAt(context: DocumentReferenceContext, refusals: Refusals): Elements['binary'] {
  const given = valueAt(context, 'binary')
  if (given === undefined) return undefined
  const at = member(CONTEXT, 'binary')
  if (!known(given, ['fullUrl', 'id'], at, refusals)) return undefined
  const fullUrl = needed(given, 'fullUrl', member(at, 'fullUrl'), refusals, uuid)
  const binaryId = optional(given, 'id', member(at, 'id'), refusals, id)
  return fullUrl === undefined ? undefined : { fullUrl, id: binaryId }
}

/** The members of what the host says of the PDF it attaches, and no others. */
const CONTEXT_MEMBERS = ['id', 'status', 'type', 'category', 'subject', 'date', 'author', 'title', 'binary']

/** Nothing read, for a context that is no object. */
const UNREAD: Elements = { id: undefined, status: undefined, type: undefined, category: undefined, subject: undefined, date: undefined, author: undefined, title: undefined, binary: undefined }

function elementsOf(context: DocumentReferenceContext, refusals: Refusals): Elements {
  if (!known(context, CONTEXT_MEMBERS, CONTEXT, refusals)) return UNREAD
  const at = (name: string) => member(CONTEXT, name)
  return {
    id: optional(context, 'id', at('id'), refusals, id),
    status: needed(context, 'status', at('status'), refusals, codeOf(DOCUMENT_REFERENCE_STATUSES)),
    type: conceptAt(context, 'type', at('type'), refusals),
    category: conceptsAt(context, 'category', at('category'), refusals),
    subject: referenceAt(context, 'subject', at('subject'), refusals, targetsOf('DocumentReference.subject')),
    date: needed(context, 'date', at('date'), refusals, instant),
    author: valueAt(context, 'author') === undefined ? undefined : referencesAt(context, 'author', at('author'), refusals, targetsOf('DocumentReference.author')),
    title: needed(context, 'title', at('title'), refusals, text),
    binary: binaryAt(context, refusals),
  }
}

/**
 * `pdf` as a DocumentReference, with what `context` says of it, and the
 * Binary that holds its bytes when the context puts them in one; or every
 * reason it cannot be, each naming where in the PDF or the context, and
 * never a value.
 */
export function toDocumentReference(pdf: Pdf, context: DocumentReferenceContext): DocumentReferenceExport {
  const refusals = new Refusals()
  const bytes = checkPdf(pdf, refusals)
  // R4's size is an unsignedInt: bytes past 2^31 - 1 cannot be counted in one.
  const size = bytes === undefined ? undefined : refusals.take(() => unsignedInt(BigInt(bytes.length), member(PDF, 'bytes')))
  const elements = elementsOf(context, refusals)
  const { status, type, subject, date, title } = elements
  if (refusals.count > 0 || bytes === undefined || size === undefined || status === undefined || type === undefined || subject === undefined || date === undefined || title === undefined) {
    return { ok: false, refusals: refusals.list }
  }
  const contentType = code(PDF_MEDIA_TYPE, 'DocumentReference.content.attachment.contentType')
  const data = toBase64Binary(bytes, 'DocumentReference.content.attachment.data')
  const hash = toBase64Binary(sha1(bytes), 'DocumentReference.content.attachment.hash')
  const where = elements.binary === undefined ? { data } : { url: elements.binary.fullUrl }
  const attachment: Attachment = { contentType, ...where, size, hash, title }
  const documentReference: DocumentReference = {
    resourceType: 'DocumentReference',
    ...(elements.id === undefined ? {} : { id: elements.id }),
    status,
    type,
    ...(elements.category === undefined ? {} : { category: elements.category }),
    subject,
    date,
    ...(elements.author === undefined ? {} : { author: elements.author }),
    content: [{ attachment }],
  }
  const binary: Binary | undefined =
    elements.binary === undefined ? undefined : { resourceType: 'Binary', ...(elements.binary.id === undefined ? {} : { id: elements.binary.id }), contentType, data }
  return { ok: true, documentReference, binary }
}
