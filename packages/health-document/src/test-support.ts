/**
 * What the tests share: bytes from text, the smallest PDF the package
 * attaches, and a synthetic host's inputs.
 *
 * Everything is made up: no person, no clinic, no real code. The codes
 * name code systems the HL7 validator holds offline (0008), a code of the
 * HL7 v2 document type table and of the v3 act classes.
 */
import type { Refusal } from '@formancy/health-core'

/**
 * The bytes of `text`, one per character, each a character code below
 * 256: a PDF's header and trailer are ASCII. A character past that is a
 * test's mistake, and throws.
 */
export function bytesOf(text: string): Uint8Array {
  return new Uint8Array(
    [...text].map((character) => {
      const value = character.charCodeAt(0)
      if (value > 0xff) throw new Error('bytesOf takes characters below 256')
      return value
    }),
  )
}

/** The smallest PDF the package attaches: its header, one line, and its end-of-file marker. */
export const minimalPdf = (header = '%PDF-1.7') => bytesOf(`${header}\n%synthetic\n%%EOF\n`)

/** A refused export's refusals, each as `rule path`; an export that was not refused fails the test. */
export function refusedAs(result: { readonly ok: true } | { readonly ok: false; readonly refusals: readonly Refusal[] }): string[] {
  if (result.ok) throw new Error('expected the export to be refused, and it was not')
  return result.refusals.map((refusal) => `${refusal.rule} ${refusal.path}`)
}

/** The names of a synthetic document's entries: lowercase UUIDs, as the host supplies them. */
export const NAMES = {
  composition: 'urn:uuid:00000000-0000-4000-8000-000000000001',
  patient: 'urn:uuid:00000000-0000-4000-8000-000000000002',
  practitioner: 'urn:uuid:00000000-0000-4000-8000-000000000003',
  documentReference: 'urn:uuid:00000000-0000-4000-8000-000000000004',
  binary: 'urn:uuid:00000000-0000-4000-8000-000000000005',
  document: 'urn:uuid:00000000-0000-4000-8000-000000000006',
} as const

/** A consultation, in the HL7 v2 document type table, which the validator holds offline. */
export const CONSULTATION = { system: 'http://terminology.hl7.org/CodeSystem/v2-0270', code: 'CN', display: 'Consultation' } as const

/** A clinical document, among the HL7 v3 act classes. */
export const CLINICAL_DOCUMENT = { system: 'http://terminology.hl7.org/CodeSystem/v3-ActClass', code: 'DOCCLIN', display: 'clinical document' } as const

/** A synthetic patient, made afresh for each test, so that a test that changes one changes no other. */
export const patient = () => ({ resourceType: 'Patient', name: [{ family: 'Beispiel', given: ['Synthetica'] }] })

/** A synthetic practitioner, made afresh for each test. */
export const practitioner = () => ({ resourceType: 'Practitioner', name: [{ family: 'Muster', given: ['Probus'] }] })
