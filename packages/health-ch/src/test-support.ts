/**
 * What the tests share: a synthetic host's CH ORF context, and the answers
 * to a synthetic form.
 *
 * Everything is made up, and the identifiers are nobody's, as can be
 * shown: the local numbers under ITU-T's example arc 2.999, which nobody
 * is assigned; the GLNs under GS1's prefix 952, "used for demonstrations
 * and examples of the GS1 system" (GS1 General Specifications 26.0, Table
 * 1-4), with GS1's check digit; every name a `urn:uuid:` fixed here. No
 * valid AHV number appears: none is reserved for tests, and one that
 * passes its check may be a person's (0009; scripts/synthetic-identifiers.test.mjs
 * fails on one in any file). The codes are HL7's own, from code systems
 * the validator holds offline: no SNOMED CT, and LOINC only where CH ORF
 * fixes it.
 */
import type { Refusal } from '@formancy/health-core'
import type { FormSchema } from '@formancy/spec'
import { toQuestionnaireResponse, type QuestionnaireResponse } from '@formancy/health-questionnaire'
import type { ChOrfContext } from './context.js'
import { PROFILES } from './profiles.js'

/** The names of a synthetic document's entries, and its identifier: lowercase UUIDs, as a host supplies them. */
export const NAMES = {
  document: 'urn:uuid:5c3e9a10-7b2d-4f61-9e8a-0d1c2b3a4f00',
  composition: 'urn:uuid:5c3e9a10-7b2d-4f61-9e8a-0d1c2b3a4f01',
  patient: 'urn:uuid:5c3e9a10-7b2d-4f61-9e8a-0d1c2b3a4f02',
  response: 'urn:uuid:5c3e9a10-7b2d-4f61-9e8a-0d1c2b3a4f03',
  serviceRequest: 'urn:uuid:5c3e9a10-7b2d-4f61-9e8a-0d1c2b3a4f04',
  secondServiceRequest: 'urn:uuid:5c3e9a10-7b2d-4f61-9e8a-0d1c2b3a4f05',
  role: 'urn:uuid:5c3e9a10-7b2d-4f61-9e8a-0d1c2b3a4f06',
  practitioner: 'urn:uuid:5c3e9a10-7b2d-4f61-9e8a-0d1c2b3a4f07',
  organization: 'urn:uuid:5c3e9a10-7b2d-4f61-9e8a-0d1c2b3a4f08',
  order: 'urn:uuid:5c3e9a10-7b2d-4f61-9e8a-0d1c2b3a4f10',
  secondOrder: 'urn:uuid:5c3e9a10-7b2d-4f61-9e8a-0d1c2b3a4f11',
} as const

/** A consultation, in HL7 v2's document type table: a type the validator checks offline, in place of CH Term's SNOMED CT ones. */
export const CONSULTATION = { system: 'http://terminology.hl7.org/CodeSystem/v2-0270', code: 'CN', display: 'Consultation' } as const

/** A clinical document, among HL7 v3's act classes, in place of CH Term's SNOMED CT classes. */
export const CLINICAL_DOCUMENT = { system: 'http://terminology.hl7.org/CodeSystem/v3-ActClass', code: 'DOCCLIN', display: 'clinical document' } as const

/** A synthetic patient, made afresh for each test. */
export const patient = () => ({
  fullUrl: NAMES.patient,
  identifier: [{ system: 'urn:oid:2.999.756.1', value: 'P-0001' }],
  name: { family: 'Beispiel', given: ['Synthetica'] },
  gender: 'female' as const,
  birthDate: '1980-02-29',
})

/** A synthetic author: a practitioner's role at a practice, each with a GLN nobody holds. */
export const author = () => ({
  fullUrl: NAMES.role,
  practitioner: { fullUrl: NAMES.practitioner, gln: '9520000000011', name: { family: 'Muster', given: ['Probus'], prefix: ['Dr. med.'] } },
  organization: { fullUrl: NAMES.organization, gln: '9520000000028', name: 'Praxis Synthetica' },
})

/** A synthetic order, its placer's number a urn:uuid. */
export const serviceRequest = (fullUrl: string = NAMES.serviceRequest, order: string = NAMES.order) => ({
  fullUrl,
  placer: { system: 'urn:ietf:rfc:3986', value: order },
  status: 'active' as const,
  intent: 'order' as const,
  priority: 'routine' as const,
  authoredOn: '2026-10-17T10:00:00+02:00',
})

/** The referral's Composition, as the host says it. */
export const composition = () => ({
  fullUrl: NAMES.composition,
  status: 'final' as const,
  type: CONSULTATION,
  category: CLINICAL_DOCUMENT,
  date: '2026-10-17T10:00:00+02:00',
  title: 'Zuweisung',
  sectionTitle: 'Auftrag',
})

/** A synthetic referral form of one question, in formancy's spec. */
export const FORM: FormSchema = {
  specVersion: '4',
  id: 'referral',
  title: 'Zuweisung',
  model: { fields: [{ key: 'reason', type: 'text', label: 'Grund der Zuweisung', required: true }] },
}

/**
 * The answers to `FORM` as health-questionnaire writes them for a CH ORF
 * document: of the patient, written down by the author's role, given by
 * the patient, to the form's version 1, claiming CH ORF's profile.
 */
export function answers(more: Record<string, unknown> = {}): QuestionnaireResponse {
  const result = toQuestionnaireResponse(
    FORM,
    { reason: 'Synthetischer Grund' },
    {
      questionnaire: { base: 'https://forms.synthetic.invalid', version: '1', status: 'active' },
      status: 'completed',
      authored: '2026-10-17T10:00:00+02:00',
      subject: { reference: NAMES.patient },
      author: { reference: NAMES.role },
      source: { reference: NAMES.patient },
      profiles: [PROFILES.questionnaireResponse],
      ...more,
    },
  )
  if (!result.ok) throw new Error(`the synthetic answers were refused: ${result.refusals.map((refusal) => refusal.message).join('; ')}`)
  return result.questionnaireResponse
}

/** A whole synthetic CH ORF context, made afresh for each test. */
export const referral = (): ChOrfContext => ({
  identifier: NAMES.document,
  timestamp: '2026-10-17T10:05:00+02:00',
  composition: composition(),
  patient: patient(),
  author: author(),
  serviceRequests: [serviceRequest()],
  response: { fullUrl: NAMES.response, questionnaireResponse: answers() },
})

/** A refused export's refusals, each as `rule path`; an export that was not refused fails the test. */
export function refusedAs(result: { readonly ok: true } | { readonly ok: false; readonly refusals: readonly Refusal[] }): string[] {
  if (result.ok) throw new Error('expected the export to be refused, and it was not')
  return result.refusals.map((refusal) => `${refusal.rule} ${refusal.path}`)
}
