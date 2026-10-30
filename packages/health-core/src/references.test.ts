import { describe, expect, expectTypeOf, test } from 'vitest'
import { reference, type FhirReference } from './references.js'
import { refusalOf } from './test-support.js'

describe('reference', () => {
  // A reference names a resource the receiver resolves -- relative to its
  // own base, or inside the Bundle that carries both -- and the host
  // supplies it (plan section 10). Each of these is one, kept as written.
  test.each(['Patient/synthetic-1', 'Practitioner/a.b-c', 'Patient/' + 'x'.repeat(64), 'urn:uuid:8c1e5a52-3f43-4c2a-9a52-6b0e1b1f6a01'])('keeps %s', (text) => {
    expect(reference(text, 'QuestionnaireResponse.subject.reference')).toBe(text)
  })

  // An absolute URL is an address: a resource written with one tells a
  // receiver where to fetch a person's record, which is the host's to
  // decide and never this module's (formancy.ai 0077). The rest are no
  // reference R4 reads by name: an id past 64 characters or with a
  // character R4's id does not have, a type that is no resource type's
  // form, a version-specific or contained reference, an uppercase UUID.
  test.each([
    'https://ehr.synthetic.invalid/fhir/Patient/synthetic-1',
    'http://ehr.synthetic.invalid/Patient/1',
    'Patient/' + 'x'.repeat(65),
    'Patient/synthetic_1',
    'patient/1',
    'Patient',
    'Patient/',
    '/Patient/1',
    'Patient/1/_history/2',
    '#contained',
    'urn:uuid:8C1E5A52-3F43-4C2A-9A52-6B0E1B1F6A01',
    'urn:oid:2.999.1',
    '',
  ])('refuses %j', (text) => {
    expect(refusalOf(() => reference(text, 'QuestionnaireResponse.subject.reference'))).toMatchObject({
      rule: 'reference',
      path: 'QuestionnaireResponse.subject.reference',
    })
  })

  // Where R4 allows a reference to only some resource types -- an author is
  // a Practitioner, a Patient or one of four others, never an Observation
  // -- a reference to another is refused, as the validator would refuse it
  // in a profile that is checked and accept it in a Bundle where it is not.
  // A urn:uuid says no type, and is the Bundle's to resolve and check
  // (H06).
  test('refuses a type R4 does not allow there, and keeps a urn:uuid', () => {
    const types = ['Patient', 'Practitioner']
    expect(reference('Practitioner/p-1', 'QuestionnaireResponse.author.reference', types)).toBe('Practitioner/p-1')
    expect(refusalOf(() => reference('Observation/o-1', 'QuestionnaireResponse.author.reference', types))).toMatchObject({ rule: 'reference' })
    expect(reference('urn:uuid:8c1e5a52-3f43-4c2a-9a52-6b0e1b1f6a01', 'QuestionnaireResponse.author.reference', types)).toBe(
      'urn:uuid:8c1e5a52-3f43-4c2a-9a52-6b0e1b1f6a01',
    )
  })

  // A refusal ends up in a host's log, and a reference names a person's
  // record: the id, synthetic here, is never quoted.
  test('never quotes the reference it refuses', () => {
    const refusal = refusalOf(() => reference('https://ehr.synthetic.invalid/Patient/756.1234.5678.90', 'QuestionnaireResponse.subject.reference'))
    expect(refusal.message).not.toContain('756.1234')
    expect(refusal.message).not.toContain('synthetic.invalid')
  })

  // Something that is not text names nothing; an object whose toString
  // answers a reference would be read through code the host never meant
  // to run as a value.
  test('refuses what is not text', () => {
    expect(refusalOf(() => reference({ toString: () => 'Patient/1' } as never, 'QuestionnaireResponse.subject.reference'))).toMatchObject({ rule: 'reference' })
  })

  // A checked reference is still a string a host can print and store, and
  // a bare string is not one: the type says it was checked.
  test('is a string typed as checked', () => {
    expectTypeOf(reference('Patient/1', 'path')).toEqualTypeOf<FhirReference>()
    expectTypeOf<string>().not.toMatchTypeOf<FhirReference>()
  })
})
