/**
 * What the host says of a CH ORF document: the referral's Composition,
 * the patient, the author and their organisation, the orders, and the
 * answers to the form (0009).
 *
 * Every value is the host's -- its identifiers, its names, its codes, its
 * clock's instants, each entry's `urn:uuid:` -- and none is made here.
 * Names mirror R4's where a member stands for an element. Each object is
 * read for the members it names and no others: a member this context does
 * not name -- an address, a telecom, a second category -- is a value the
 * host meant to send, which the document would leave out without a word,
 * so it is refused as `unmapped`, at the object that holds it, and the
 * member's name is not repeated: health-core's `known`, as health-document
 * and health-questionnaire read their own contexts.
 */
import type { Coded } from '@formancy/health-document'
import type { QuestionnaireResponse } from '@formancy/health-questionnaire'

/** Where a refusal of the host's context points. */
export const CONTEXT = 'context'

/** R4's RequestStatus, the codes `ServiceRequest.status` is bound to, required (hl7.fhir.r4.core 4.0.1, CodeSystem request-status). */
export const REQUEST_STATUSES = ['draft', 'active', 'on-hold', 'revoked', 'completed', 'entered-in-error', 'unknown'] as const

/** R4's RequestIntent, the codes `ServiceRequest.intent` is bound to, required. */
export const REQUEST_INTENTS = ['proposal', 'plan', 'directive', 'order', 'original-order', 'reflex-order', 'filler-order', 'instance-order', 'option'] as const

/** R4's RequestPriority, the codes `ServiceRequest.priority` is bound to, required. */
export const REQUEST_PRIORITIES = ['routine', 'urgent', 'asap', 'stat'] as const

/**
 * R4's AdministrativeGender without `unknown`, which CH Core's ch-pat-2
 * says "is currently not used in Switzerland": a host that does not know
 * a patient's gender leaves it out.
 */
export const GENDERS = ['male', 'female', 'other'] as const

/** An identifier the host gives under its own system: a patient's number in its records, an order's. */
export interface LocalIdentifier {
  readonly system: string
  readonly value: string
}

/** The referral's Composition: what CH ORF leaves to the host, each part by R4's name. */
export interface ChOrfComposition {
  readonly fullUrl: string
  readonly status: 'preliminary' | 'final' | 'amended' | 'entered-in-error'
  /**
   * What kind of document it is. ch-orf-composition binds
   * `Composition.type`, preferred, to CH Term's ValueSet
   * `DocumentEntry.typeCode`, whose codes are SNOMED CT's
   * (`StructureDefinition-ch-orf-composition.json` in ch.fhir.ig.ch-orf
   * 3.0.2, `ValueSet-DocumentEntry.typeCode.json` in ch.fhir.ig.ch-term
   * 3.3.0, read on 17 October 2026): the host's, under its own licence.
   */
  readonly type: Coded
  /**
   * Exactly one, as ch-orf-composition makes `Composition.category` 1..1,
   * bound, preferred, to CH Term's `DocumentEntry.classCode`, SNOMED CT's
   * codes too (the same files).
   */
  readonly category: Coded
  /** When the author last changed it, a dateTime with its zone. */
  readonly date: string
  readonly title: string
  /** The title of the order-referral section, in the document's language. */
  readonly sectionTitle: string
}

/** Whom the referral is about: a CH Core Patient. */
export interface ChOrfPatient {
  readonly fullUrl: string
  /** The AHV number, 756 and ten digits, without points: checked here, under its system. */
  readonly ahvn13?: string
  /** Numbers in the host's own records, each a medical record number under the host's system, never one of CH Core's. */
  readonly identifier?: readonly LocalIdentifier[]
  /** Both parts, as CH Core's ch-pat-1 asks of a name. */
  readonly name?: { readonly family: string; readonly given: readonly string[] }
  readonly gender?: (typeof GENDERS)[number]
  readonly birthDate?: string
}

/** Who writes the referral: a CH Core Practitioner. */
export interface ChOrfPractitioner {
  readonly fullUrl: string
  /** The practitioner's GLN, thirteen digits: checked here, under its system. */
  readonly gln?: string
  /** A family name at least, as CH Core's ch-pract-1 requires of a name. */
  readonly name: { readonly family: string; readonly given?: readonly string[]; readonly prefix?: readonly string[] }
}

/** Where the author works: a CH Core Organization. */
export interface ChOrfOrganization {
  readonly fullUrl: string
  readonly gln?: string
  readonly name: string
}

/** The author, CH ORF's only kind: a PractitionerRole of the practitioner, at the organisation where the host names one. */
export interface ChOrfAuthor {
  readonly fullUrl: string
  readonly practitioner: ChOrfPractitioner
  readonly organization?: ChOrfOrganization
}

/** An order the referral carries: a CH ORF ServiceRequest. */
export interface ChOrfServiceRequest {
  readonly fullUrl: string
  /** The placer's order number, under the host's system: CH ORF's placerOrderIdentifier, 1..1. */
  readonly placer: LocalIdentifier
  readonly status: (typeof REQUEST_STATUSES)[number]
  readonly intent: (typeof REQUEST_INTENTS)[number]
  readonly priority?: (typeof REQUEST_PRIORITIES)[number]
  /** When it was ordered, a dateTime with its zone. */
  readonly authoredOn?: string
}

/**
 * The answers to the form, as health-questionnaire's toQuestionnaireResponse
 * made them: about the patient, by the author's role or the patient, and
 * claiming CH ORF's response profile, which the host passes as its
 * `profiles`. The Questionnaire is not carried: the response names it by
 * its versioned canonical, which the host publishes.
 */
export interface ChOrfResponse {
  readonly fullUrl: string
  readonly questionnaireResponse: QuestionnaireResponse
}

/** What the host says of a CH ORF document. */
export interface ChOrfContext {
  /** The document's identifier, a `urn:uuid:` never re-used: written with the system urn:ietf:rfc:3986, as CH ORF fixes it. */
  readonly identifier: string
  /** When the document was assembled, an instant with its zone. */
  readonly timestamp: string
  readonly composition: ChOrfComposition
  readonly patient: ChOrfPatient
  readonly author: ChOrfAuthor
  /** At least one, as CH ORF's document and its section ask. */
  readonly serviceRequests: readonly ChOrfServiceRequest[]
  readonly response?: ChOrfResponse
}
