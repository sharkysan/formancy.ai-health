/**
 * The corpus's documents: what a synthetic host says of the referral
 * letter's PDF, and the document Bundles health-document makes of it, as
 * the validator gate judges them (0008).
 *
 * The host's resources and codes are made up: an invented patient and
 * practitioner, and codes from code systems the HL7 validator holds
 * offline -- a consultation in HL7 v2's document type table, a clinical
 * document among HL7 v3's act classes -- so that the gate checks each
 * code, and no LOINC content is carried (plan 15.3). Every name is a
 * lowercase `urn:uuid:` fixed here, as a host supplies them, so the same
 * PDF gives the same Bundle.
 */
import type { FhirJsonObject } from '@formancy/health-core'
import {
  toDocumentBundle,
  toDocumentReference,
  type DocumentBundleExport,
  type DocumentContext,
  type DocumentReferenceContext,
  type DocumentReferenceExport,
} from '@formancy/health-document'

/** Each entry's name in the corpus's documents, and each document's identifier. */
export const NAMES = {
  composition: 'urn:uuid:2b0e6f3c-5d1a-4e8b-9c7f-1a2b3c4d5e01',
  patient: 'urn:uuid:2b0e6f3c-5d1a-4e8b-9c7f-1a2b3c4d5e02',
  practitioner: 'urn:uuid:2b0e6f3c-5d1a-4e8b-9c7f-1a2b3c4d5e03',
  documentReference: 'urn:uuid:2b0e6f3c-5d1a-4e8b-9c7f-1a2b3c4d5e04',
  binary: 'urn:uuid:2b0e6f3c-5d1a-4e8b-9c7f-1a2b3c4d5e05',
  response: 'urn:uuid:2b0e6f3c-5d1a-4e8b-9c7f-1a2b3c4d5e06',
  // A document's identifier "is never re-used": one per document the corpus makes.
  dataDocument: 'urn:uuid:2b0e6f3c-5d1a-4e8b-9c7f-1a2b3c4d5e10',
  binaryDocument: 'urn:uuid:2b0e6f3c-5d1a-4e8b-9c7f-1a2b3c4d5e11',
  responseDocument: 'urn:uuid:2b0e6f3c-5d1a-4e8b-9c7f-1a2b3c4d5e12',
} as const

/** A consultation, in HL7 v2's document type table (table 0270), as the HL7 terminology package holds it. */
export const CONSULTATION = { system: 'http://terminology.hl7.org/CodeSystem/v2-0270', code: 'CN', display: 'Consultation' } as const

/** A clinical document, among HL7 v3's act classes. */
export const CLINICAL_DOCUMENT = { system: 'http://terminology.hl7.org/CodeSystem/v3-ActClass', code: 'DOCCLIN', display: 'clinical document' } as const

/** The invented patient the letter is about. */
export const PATIENT = { resourceType: 'Patient', name: [{ family: 'Beispiel', given: ['Synthetica'] }], birthDate: '1980-02-29' } satisfies FhirJsonObject

/** The invented practitioner who writes it. */
export const PRACTITIONER = { resourceType: 'Practitioner', name: [{ family: 'Muster', given: ['Probus'], prefix: ['Dr. med.'] }] } satisfies FhirJsonObject

/** Where the PDF's bytes go: into the DocumentReference's attachment, or into a Binary beside it. */
export type Placement = 'data' | 'binary'

/** What the host says of the letter's PDF, with its bytes put where `placement` says. */
export function referralContext(placement: Placement): DocumentReferenceContext {
  return {
    status: 'current',
    type: CONSULTATION,
    category: [CLINICAL_DOCUMENT],
    subject: { reference: NAMES.patient },
    date: '2026-10-17T10:00:00+02:00',
    author: [{ reference: NAMES.practitioner }],
    title: 'Zuweisung',
    ...(placement === 'binary' ? { binary: { fullUrl: NAMES.binary } } : {}),
  }
}

/** The letter's PDF as a DocumentReference, declared a plain PDF, and its Binary where `placement` puts the bytes in one. */
export const referralDocumentReference = (pdf: Uint8Array, placement: Placement): DocumentReferenceExport =>
  toDocumentReference({ bytes: pdf, profile: 'PDF' }, referralContext(placement))

/** What a document of the letter holds besides its PDF. */
export interface ReferralDocument {
  readonly pdf: Uint8Array
  readonly placement: Placement
  /**
   * A QuestionnaireResponse the letter carries beside the PDF, under
   * `NAMES.response`, in a section of its own: its subject must be
   * `NAMES.patient`, and its author, where it has one, `NAMES.practitioner`.
   */
  readonly response?: FhirJsonObject
}

/**
 * What the host says of the document: its identifier and the time it was
 * assembled, the Composition, and the entries -- the patient, the author,
 * the PDF's DocumentReference, its Binary, and the response -- each by
 * name. Throws if health-document refuses the DocumentReference, which
 * the corpus's PDF and context must not be.
 */
export function referralDocumentContext({ pdf, placement, response }: ReferralDocument): DocumentContext {
  const attached = referralDocumentReference(pdf, placement)
  if (!attached.ok) throw new Error(`health-document refused the corpus's DocumentReference: ${attached.refusals.map((refusal) => refusal.message).join('; ')}`)
  const identifier = response !== undefined ? NAMES.responseDocument : placement === 'binary' ? NAMES.binaryDocument : NAMES.dataDocument
  const entry = (fullUrl: string, resource: FhirJsonObject) => ({ fullUrl, resource })
  return {
    identifier: { system: 'urn:ietf:rfc:3986', value: identifier },
    timestamp: '2026-10-17T10:05:00+02:00',
    composition: {
      fullUrl: NAMES.composition,
      status: 'final',
      type: CONSULTATION,
      category: [CLINICAL_DOCUMENT],
      subject: { reference: NAMES.patient },
      date: '2026-10-17T10:00:00+02:00',
      author: [{ reference: NAMES.practitioner }],
      title: 'Zuweisung',
      section: [
        { title: 'Zuweisung', entry: [{ reference: NAMES.documentReference }] },
        ...(response === undefined ? [] : [{ title: 'Formular', entry: [{ reference: NAMES.response }] }]),
      ],
    },
    entries: [
      entry(NAMES.patient, PATIENT),
      entry(NAMES.practitioner, PRACTITIONER),
      entry(NAMES.documentReference, attached.documentReference),
      ...(attached.binary === undefined ? [] : [entry(NAMES.binary, attached.binary)]),
      ...(response === undefined ? [] : [entry(NAMES.response, response)]),
    ],
  }
}

/** The letter as a document Bundle, as health-document makes it of the corpus's PDF. */
export const referralDocument = (document: ReferralDocument): DocumentBundleExport => toDocumentBundle(referralDocumentContext(document))
