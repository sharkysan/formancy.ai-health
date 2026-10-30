import { Refusals, writeJson } from '@formancy/health-core'
import { describe, expect, test } from 'vitest'
import { gs1CheckDigit } from './identifiers.js'
import { authorOf, patientOf } from './people.js'
import { author, NAMES, patient } from './test-support.js'

/** What `read` makes of `given`, and its refusals as `rule path`. */
function reading<T>(read: (given: unknown, refusals: Refusals) => T, given: unknown): { made: T; refused: string[] } {
  const refusals = new Refusals()
  const made = read(given, refusals)
  return { made, refused: refusals.list.map((refusal) => `${refusal.rule} ${refusal.path}`) }
}

const readPatient = (given: unknown) => reading(patientOf, given)
const readAuthor = (given: unknown) => reading(authorOf, given)

/** A list of `first` and `third` with a hole between them, as a host's array may have and JSON never does. */
function holed<T>(first: T, third: T): T[] {
  const list: T[] = [first]
  list[2] = third
  return list
}

describe('the patient', () => {
  // CH Core's Patient, claimed with its version, so that the validator
  // holds it to CH Core and names the cause when it is not one; the host's
  // number under its own system as CH Core's LocalPid, typed MR as the
  // slice's pattern fixes it; the name, the gender and the birth date as
  // given. Written in R4's order, whatever order the host's names are in.
  test('is a CH Core Patient, written exactly', () => {
    const { made, refused } = readPatient(patient())
    expect(refused).toEqual([])
    expect(made?.fullUrl).toBe(NAMES.patient)
    expect(writeJson(made?.resource as never)).toBe(
      '{"resourceType":"Patient","meta":{"profile":["http://fhir.ch/ig/ch-core/StructureDefinition/ch-core-patient|6.0.0"]},' +
        '"identifier":[{"type":{"coding":[{"system":"http://terminology.hl7.org/CodeSystem/v2-0203","code":"MR"}]},"system":"urn:oid:2.999.756.1","value":"P-0001"}],' +
        '"name":[{"family":"Beispiel","given":["Synthetica"]}],"gender":"female","birthDate":"1980-02-29"}',
    )
    const reversed = Object.fromEntries(Object.entries(patient()).reverse())
    expect(writeJson(readPatient(reversed).made?.resource as never)).toBe(writeJson(made?.resource as never))
  })

  // The AHV number stands under its own system, which is written here,
  // never the host's: no other number can pass under it. A valid one may
  // be a person's, so it is computed in memory and only its place is
  // asserted, never its digits in a message.
  test('carries the AHV number under its system, before the host numbers', () => {
    const stem = '756000000001'
    const valid = `${stem}${String(gs1CheckDigit(stem))}`
    const written = writeJson(readPatient({ ...patient(), ahvn13: valid }).made?.resource as never)
    expect(written.includes(`"identifier":[{"system":"urn:oid:2.16.756.5.32","value":"${valid}"},{"type"`)).toBe(true)
  })

  // Nothing of CH Core's Patient is required: a patient known by a number
  // alone is written with it alone.
  test('writes only what the host gives', () => {
    expect(writeJson(readPatient({ fullUrl: NAMES.patient, identifier: patient().identifier }).made?.resource as never)).toBe(
      '{"resourceType":"Patient","meta":{"profile":["http://fhir.ch/ig/ch-core/StructureDefinition/ch-core-patient|6.0.0"]},' +
        '"identifier":[{"type":{"coding":[{"system":"http://terminology.hl7.org/CodeSystem/v2-0203","code":"MR"}]},"system":"urn:oid:2.999.756.1","value":"P-0001"}]}',
    )
  })

  // Each refused where it stands, and every one at once:
  // - an AHV number with a wrong check digit, which the validator only warns of;
  // - a local number under the AHV system, which would pass unchecked;
  // - a name without its given name, which CH Core's ch-pat-1 only warns of;
  // - gender unknown, which CH Core's ch-pat-2 says Switzerland does not use;
  // - a birth date with a time;
  // - an address, which this document does not write and would leave out.
  test('is refused for each thing wrong with it, at once, naming where', () => {
    const wrong = {
      ...patient(),
      ahvn13: '7561234567890',
      identifier: [{ system: 'urn:oid:2.16.756.5.32', value: '7561234567890' }],
      name: { family: 'Beispiel', given: [] },
      gender: 'unknown',
      birthDate: '1980-02-29T08:00:00Z',
      address: [{ city: 'Synthetisch' }],
    }
    const { made, refused } = readPatient(wrong)
    expect(made).toBeUndefined()
    expect(refused).toEqual([
      'unmapped context.patient',
      'check-digit context.patient.ahvn13',
      'identifier context.patient.identifier[0].system',
      'absent context.patient.name.given',
      'unmapped context.patient.gender',
      'grammar context.patient.birthDate',
    ])
  })

  test.each([
    ['no fullUrl', { name: patient().name }, 'absent context.patient.fullUrl'],
    ['a fullUrl that is an address', { fullUrl: 'https://records.synthetic.invalid/Patient/1' }, 'grammar context.patient.fullUrl'],
    ['no list of identifiers', { fullUrl: NAMES.patient, identifier: patient().identifier[0] }, 'absent context.patient.identifier'],
    ['an empty list of identifiers', { fullUrl: NAMES.patient, identifier: [] }, 'absent context.patient.identifier'],
    ['a name without its family', { fullUrl: NAMES.patient, name: { given: ['Synthetica'] } }, 'absent context.patient.name.family'],
    // ch-pat-1 asks a family and a given name of one name at least, and
    // the patient has one: without its given names it is only a warning
    // to the validator, and refused here.
    ['a name without its given names', { fullUrl: NAMES.patient, name: { family: 'Beispiel' } }, 'absent context.patient.name.given'],
    ['a given name of spaces', { fullUrl: NAMES.patient, name: { family: 'Beispiel', given: [' '] } }, 'absent context.patient.name.given[0]'],
    ['a name that is a string', { fullUrl: NAMES.patient, name: 'Synthetica Beispiel' }, 'absent context.patient.name'],
    [
      'a name with a prefix it does not write',
      { fullUrl: NAMES.patient, name: { family: 'Beispiel', given: ['Synthetica'], prefix: ['Dr.'] } },
      'unmapped context.patient.name',
    ],
    ['a gender R4 does not have', { fullUrl: NAMES.patient, gender: 'f' }, 'unmapped context.patient.gender'],
    ['no object at all', 'Beispiel', 'absent context.patient'],
    [
      'a family name a resource cannot carry',
      { fullUrl: NAMES.patient, name: { family: 'Beispiel\u0007', given: ['Synthetica'] } },
      'grammar context.patient.name.family',
    ],
  ])('is refused with %s', (_, given, refusal) => {
    expect(readPatient(given).refused).toEqual([refusal])
  })

  // A host's array may have a hole, which JSON never has. Walked past, a
  // hole among the given names reached health-document as a gap it
  // refused as health-ch's own bug, and one among the identifiers was
  // dropped without a word. Each is refused where it stands.
  test('is refused for a hole in a list, at its index', () => {
    expect(readPatient({ fullUrl: NAMES.patient, name: { family: 'Beispiel', given: holed('Synthetica', 'Secunda') } }).refused).toEqual([
      'absent context.patient.name.given[1]',
    ])
    expect(readPatient({ fullUrl: NAMES.patient, identifier: holed(patient().identifier[0], patient().identifier[0]) }).refused).toEqual([
      'absent context.patient.identifier[1]',
    ])
  })
})

describe('the author', () => {
  // CH ORF's only author is a CH Core PractitionerRole (ch-orf-composition,
  // Composition.author), and CH ORF says a person or an organisation "is
  // defined by the PractitionerRole resource. The Practitioner and/or the
  // Organization resource can then be referenced from the PractitionerRole
  // resource" (index.html, Volume 3, read on 17 October 2026). Each
  // claims its CH Core profile, each GLN stands under its system, and the
  // role names the two by their urn:uuid.
  test('is a PractitionerRole of a Practitioner at an Organization, each written exactly', () => {
    const { made, refused } = readAuthor(author())
    expect(refused).toEqual([])
    expect([made?.role.fullUrl, made?.practitioner.fullUrl, made?.organization?.fullUrl]).toEqual([NAMES.role, NAMES.practitioner, NAMES.organization])
    expect(writeJson(made?.role.resource as never)).toBe(
      '{"resourceType":"PractitionerRole","meta":{"profile":["http://fhir.ch/ig/ch-core/StructureDefinition/ch-core-practitionerrole|6.0.0"]},' +
        `"practitioner":{"reference":"${NAMES.practitioner}"},"organization":{"reference":"${NAMES.organization}"}}`,
    )
    expect(writeJson(made?.practitioner.resource as never)).toBe(
      '{"resourceType":"Practitioner","meta":{"profile":["http://fhir.ch/ig/ch-core/StructureDefinition/ch-core-practitioner|6.0.0"]},' +
        '"identifier":[{"system":"urn:oid:2.51.1.3","value":"9520000000011"}],"name":[{"family":"Muster","given":["Probus"],"prefix":["Dr. med."]}]}',
    )
    expect(writeJson(made?.organization?.resource as never)).toBe(
      '{"resourceType":"Organization","meta":{"profile":["http://fhir.ch/ig/ch-core/StructureDefinition/ch-core-organization|6.0.0"]},' +
        '"identifier":[{"system":"urn:oid:2.51.1.3","value":"9520000000028"}],"name":"Praxis Synthetica"}',
    )
  })

  // An author without an organisation, or without a GLN, is one: CH Core
  // requires neither, and the role names only what there is.
  test('is a practitioner alone where the host names no organisation, and needs no GLN', () => {
    const { organization: _, ...alone } = author()
    const { gln: __, ...practitioner } = alone.practitioner
    const { made, refused } = readAuthor({ ...alone, practitioner: { ...practitioner, name: { family: 'Muster' } } })
    expect(refused).toEqual([])
    expect(made?.organization).toBeUndefined()
    expect(writeJson(made?.role.resource as never)).not.toContain('organization')
    expect(writeJson(made?.practitioner.resource as never)).toBe(
      '{"resourceType":"Practitioner","meta":{"profile":["http://fhir.ch/ig/ch-core/StructureDefinition/ch-core-practitioner|6.0.0"]},"name":[{"family":"Muster"}]}',
    )
  })

  // ch-pract-1, an error in CH Core: "If a HumanName is provided, at least
  // one HumanName must have a family name". A GLN with a wrong check
  // digit, which CH Core's gln-modulus-10 only warns of; an organisation
  // without its name, which org-1 asks for where there is no identifier
  // and a receiver shows; and members neither writes.
  test('is refused for each thing wrong with it, at once, naming where', () => {
    const wrong = {
      ...author(),
      practitioner: { fullUrl: NAMES.practitioner, gln: '9520000000012', name: { given: ['Probus'] }, telecom: [] },
      organization: { fullUrl: NAMES.organization, gln: '952000000002' },
    }
    expect(readAuthor(wrong)).toEqual({
      made: undefined,
      refused: [
        'unmapped context.author.practitioner',
        'check-digit context.author.practitioner.gln',
        'absent context.author.practitioner.name.family',
        'identifier context.author.organization.gln',
        'absent context.author.organization.name',
      ],
    })
  })

  test.each([
    ['no practitioner', { fullUrl: NAMES.role }, 'absent context.author.practitioner'],
    ['no fullUrl of its own', { practitioner: author().practitioner }, 'absent context.author.fullUrl'],
    ['a practitioner without a name', { ...author(), practitioner: { fullUrl: NAMES.practitioner } }, 'absent context.author.practitioner.name'],
    [
      'a practitioner whose name is a string',
      { ...author(), practitioner: { fullUrl: NAMES.practitioner, name: 'Muster' } },
      'absent context.author.practitioner.name',
    ],
    ['an organisation that is a string', { ...author(), organization: 'Praxis' }, 'absent context.author.organization'],
    ['a specialty it does not write', { ...author(), specialty: 'Allgemeinmedizin' }, 'unmapped context.author'],
    [
      'a hole among the prefixes',
      { ...author(), practitioner: { ...author().practitioner, name: { family: 'Muster', prefix: holed('Dr.', 'med.') } } },
      'absent context.author.practitioner.name.prefix[1]',
    ],
    [
      'an organisation name a resource cannot carry',
      { ...author(), organization: { ...author().organization, name: 'Praxis\u0000' } },
      'grammar context.author.organization.name',
    ],
  ])('is refused with %s', (_, given, refusal) => {
    expect(readAuthor(given).refused).toEqual([refusal])
  })
})
