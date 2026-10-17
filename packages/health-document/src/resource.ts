/**
 * The resources this package writes, typed with health-core's primitives
 * (0004: resources are typed by the packages that build them): a
 * DocumentReference and a Binary for a PDF's bytes, and a document Bundle
 * with its Composition.
 *
 * Only what the package writes is here, in the order R4 lists each
 * element, which is the order it is written in
 * (https://hl7.org/fhir/R4/documentreference.html, binary.html,
 * composition.html and bundle.html, read on 17 October 2026). The
 * resources a host hands over to stand beside the Composition -- a
 * Patient, a Practitioner, a QuestionnaireResponse -- are the host's, and
 * are FHIR JSON here, read and written as they were given.
 */
import type {
  FhirBase64Binary,
  FhirCode,
  FhirDateTime,
  FhirId,
  FhirInstant,
  FhirJsonObject,
  FhirReference,
  FhirUnsignedInt,
  FhirUri,
  FhirUuid,
} from '@formancy/health-core'

export type Coding = {
  readonly system: FhirUri
  readonly code: FhirCode
  readonly display?: string
}

/** A concept by one coding, as the host names it: no text of its own beside the coding's display. */
export type CodeableConcept = {
  readonly coding: readonly [Coding]
}

/** An identifier with its system and its value, as R4's bdl-9 asks of a document's. */
export type Identifier = {
  readonly system: FhirUri
  readonly value: string
}

/** A reference by name, as the host supplies it (health-core's `reference`). */
export type Reference = {
  readonly reference: FhirReference
}

/**
 * A PDF's bytes, or where they are, with what R4's Attachment says of
 * them: their media type, their number and their SHA-1, both of the bytes
 * themselves, and a title. `data` and `url` are never both: the bytes are
 * in the attachment, or in a Binary of the same Bundle, which `url` names.
 */
export type Attachment = {
  readonly contentType: FhirCode
  readonly data?: FhirBase64Binary
  readonly url?: FhirUuid
  readonly size: FhirUnsignedInt
  readonly hash: FhirBase64Binary
  readonly title: string
}

export type DocumentReference = {
  readonly resourceType: 'DocumentReference'
  readonly id?: FhirId
  readonly status: FhirCode
  readonly type: CodeableConcept
  readonly category?: readonly CodeableConcept[]
  readonly subject: Reference
  readonly date: FhirInstant
  readonly author?: readonly Reference[]
  readonly content: readonly [{ readonly attachment: Attachment }]
}

/** A PDF's bytes as a resource of their own, for a Bundle whose DocumentReference names them by `url`. */
export type Binary = {
  readonly resourceType: 'Binary'
  readonly id?: FhirId
  readonly contentType: FhirCode
  readonly data: FhirBase64Binary
}

/** A section: its title, its code when the host gives one, and the entries it holds. No narrative (0008). */
export type CompositionSection = {
  readonly title: string
  readonly code?: CodeableConcept
  readonly entry: readonly Reference[]
}

export type Composition = {
  readonly resourceType: 'Composition'
  readonly id?: FhirId
  readonly identifier?: Identifier
  readonly status: FhirCode
  readonly type: CodeableConcept
  readonly category?: readonly CodeableConcept[]
  readonly subject: Reference
  readonly date: FhirDateTime
  readonly author: readonly Reference[]
  readonly title: string
  readonly section: readonly CompositionSection[]
}

/** An entry: its name in the Bundle, a `urn:uuid:` the host gave, and its resource. */
export type BundleEntry<R> = {
  readonly fullUrl: FhirUuid
  readonly resource: R
}

/**
 * A document: R4's Bundle of type `document`, its identifier and its
 * timestamp the host's, the Composition first and then only what it
 * refers to (R4's bdl-9, bdl-10 and bdl-11, and documents.html).
 */
export type Bundle = {
  readonly resourceType: 'Bundle'
  readonly id?: FhirId
  readonly meta: { readonly lastUpdated: FhirInstant }
  readonly identifier: Identifier
  readonly type: FhirCode
  readonly timestamp: FhirInstant
  readonly entry: readonly [BundleEntry<Composition>, ...BundleEntry<FhirJsonObject>[]]
}
