import { decimal, Refusal, writeJson, type FhirJsonObject } from '@formancy/health-core'
import { describe, expect, test } from 'vitest'
import type { ChOrfContext } from './context.js'
import { reRooted, toChOrfDocument } from './document.js'
import { answers, author, CLINICAL_DOCUMENT, composition, CONSULTATION, NAMES, patient, referral, refusedAs, serviceRequest } from './test-support.js'

/** The Bundle of `context`, which must not be refused. */
function documented(context: ChOrfContext = referral()) {
  const result = toChOrfDocument(context)
  if (!result.ok) throw new Error(`refused: ${result.refusals.map((refusal) => refusal.message).join('; ')}`)
  return result.bundle
}

/** `referral()` with its composition changed. */
const withComposition = (change: Record<string, unknown>): ChOrfContext => ({
  ...referral(),
  composition: { ...composition(), ...change } as ChOrfContext['composition'],
})

/** The narrative of `referral()`'s Composition as writeJson writes the div: its title and its section's. */
const NARRATIVE = '<div xmlns=\\"http://www.w3.org/1999/xhtml\\"><h1>Zuweisung</h1><h2>Auftrag</h2></div>'

describe('a CH ORF document', () => {
  // The acceptance's document: a Bundle claiming CH ORF's document profile
  // as CH ORF asks it to, unversioned; the host's identifier under the
  // system CH ORF fixes; the Composition first, claiming CH ORF's profile,
  // with the narrative CH ORF requires, the host's type and one category,
  // the patient as its subject, the author's role as its author, and the
  // order-referral section CH ORF requires, coded LOINC 93037-0 as its
  // pattern fixes it, with LOINC's long common name beside the code, as
  // LOINC's licence asks of software that carries one, holding the
  // answers and then the orders; then the
  // patient, the answers, the orders, the role, the practitioner and the
  // organisation, as CH ORF's own example orders them.
  test('is written exactly, the Composition first and its entries in the order CH ORF shows', () => {
    const bundle = documented()
    const written = writeJson(bundle)
    expect(
      written.startsWith(
        '{"resourceType":"Bundle","meta":{"lastUpdated":"2026-10-17T10:05:00+02:00","profile":["http://fhir.ch/ig/ch-orf/StructureDefinition/ch-orf-document"]},' +
          `"identifier":{"system":"urn:ietf:rfc:3986","value":"${NAMES.document}"},"type":"document","timestamp":"2026-10-17T10:05:00+02:00",` +
          `"entry":[{"fullUrl":"${NAMES.composition}","resource":{"resourceType":"Composition","meta":{"profile":["http://fhir.ch/ig/ch-orf/StructureDefinition/ch-orf-composition|3.0.2"]},` +
          `"text":{"status":"generated","div":"${NARRATIVE}"},"status":"final",` +
          '"type":{"coding":[{"system":"http://terminology.hl7.org/CodeSystem/v2-0270","code":"CN","display":"Consultation"}]},' +
          '"category":[{"coding":[{"system":"http://terminology.hl7.org/CodeSystem/v3-ActClass","code":"DOCCLIN","display":"clinical document"}]}],' +
          `"subject":{"reference":"${NAMES.patient}"},"date":"2026-10-17T10:00:00+02:00","author":[{"reference":"${NAMES.role}"}],"title":"Zuweisung",` +
          `"section":[{"title":"Auftrag","code":{"coding":[{"system":"http://loinc.org","code":"93037-0","display":"Portable medical order form"}]},"entry":[{"reference":"${NAMES.response}"},{"reference":"${NAMES.serviceRequest}"}]}]}}`,
      ),
      written.slice(0, 2000),
    ).toBe(true)
    expect(bundle.entry.map((entry) => entry.fullUrl)).toEqual([
      NAMES.composition,
      NAMES.patient,
      NAMES.response,
      NAMES.serviceRequest,
      NAMES.role,
      NAMES.practitioner,
      NAMES.organization,
    ])
    expect(bundle.entry.map((entry) => entry.resource.resourceType)).toEqual([
      'Composition',
      'Patient',
      'QuestionnaireResponse',
      'ServiceRequest',
      'PractitionerRole',
      'Practitioner',
      'Organization',
    ])
  })

  // The answers are the host's, carried as health-questionnaire wrote
  // them, every byte.
  test("carries the host's answers as they were written", () => {
    expect(writeJson(documented().entry[2]?.resource as never)).toBe(writeJson(answers()))
  })

  // Nothing here reads a clock or a random source: the same context gives
  // the same bytes, whatever order its names are in, and a host changing
  // its objects afterwards changes nothing already assembled.
  test('gives the same bytes for the same input, whatever order the names are in', () => {
    const reversed = (value: unknown): unknown =>
      Array.isArray(value)
        ? value.map(reversed)
        : typeof value === 'object' && value !== null
          ? Object.fromEntries(
              Object.entries(value)
                .reverse()
                .map(([name, each]) => [name, name === 'questionnaireResponse' ? each : reversed(each)]),
            )
          : value
    const first = writeJson(documented())
    expect(writeJson(documented(reversed(referral()) as ChOrfContext))).toBe(first)
    const context = referral()
    const bundle = documented(context)
    ;(context.patient.name?.given as string[]).push('Changed')
    expect(writeJson(bundle)).toBe(first)
  })

  // CH ORF makes the answers 0..1, and an organisation is the host's to
  // name: without either, neither is written, nor referred to.
  test('holds no answers and no organisation where the host names neither', () => {
    const { response: _, ...unanswered } = referral()
    const { organization: __, ...alone } = author()
    const bundle = documented({ ...unanswered, author: alone })
    expect(bundle.entry.map((entry) => entry.fullUrl)).toEqual([NAMES.composition, NAMES.patient, NAMES.serviceRequest, NAMES.role, NAMES.practitioner])
    expect(writeJson(bundle.entry[0].resource)).toContain(`"entry":[{"reference":"${NAMES.serviceRequest}"}]`)
  })

  // Every order is written and in the section, in the host's order.
  test('holds every order, in the order the host gives them', () => {
    const bundle = documented({ ...referral(), serviceRequests: [serviceRequest(), serviceRequest(NAMES.secondServiceRequest, NAMES.secondOrder)] })
    expect(bundle.entry.map((entry) => entry.fullUrl).slice(3, 5)).toEqual([NAMES.serviceRequest, NAMES.secondServiceRequest])
    expect(writeJson(bundle.entry[0].resource)).toContain(
      `"entry":[{"reference":"${NAMES.response}"},{"reference":"${NAMES.serviceRequest}"},{"reference":"${NAMES.secondServiceRequest}"}]`,
    )
  })
})

describe('what a CH ORF document refuses of its context', () => {
  // health-ch's own refusals come at once, from every part of the context,
  // naming where in it, and quoting nothing: no name, no number, no code.
  test('are every one of its own at once, quoting no value', () => {
    const context = {
      ...referral(),
      identifier: 'Beispiel-0001',
      composition: { ...composition(), category: undefined },
      patient: { ...patient(), gender: 'unknown' },
      author: { ...author(), practitioner: { ...author().practitioner, gln: '9520000000012' } },
      serviceRequests: [{ ...serviceRequest(), intent: 'referral' }],
      response: { fullUrl: NAMES.response, questionnaireResponse: answers({ profiles: undefined }) },
      encounter: { reference: 'Encounter/1' },
    } as unknown as ChOrfContext
    const result = toChOrfDocument(context)
    expect(refusedAs(result)).toEqual([
      'unmapped context',
      'grammar context.identifier',
      'absent context.composition.category',
      'unmapped context.patient.gender',
      'check-digit context.author.practitioner.gln',
      'unmapped context.serviceRequests[0].intent',
      'profile context.response.questionnaireResponse.meta.profile',
    ])
    for (const refusal of result.ok ? [] : result.refusals) for (const value of ['Beispiel', '952', 'Encounter']) expect(refusal.message).not.toContain(value)
  })

  // One name, one entry: references are written from the names, so two
  // parts of one name would make one reference to two resources. The later
  // is refused, where it stands.
  test('refuses a name given twice, at the later of the two', () => {
    const { response: _, ...unanswered } = referral()
    expect(refusedAs(toChOrfDocument({ ...unanswered, patient: { ...patient(), fullUrl: NAMES.composition } }))).toEqual([
      'duplicate-entry context.patient.fullUrl',
    ])
    const twice = { ...referral(), serviceRequests: [serviceRequest(), serviceRequest(NAMES.serviceRequest, NAMES.secondOrder)] }
    expect(refusedAs(toChOrfDocument(twice))).toEqual(['duplicate-entry context.serviceRequests[1].fullUrl'])
    expect(refusedAs(toChOrfDocument({ ...unanswered, author: { ...author(), fullUrl: NAMES.practitioner } }))).toEqual([
      'duplicate-entry context.author.practitioner.fullUrl',
    ])
    expect(refusedAs(toChOrfDocument({ ...referral(), response: { fullUrl: NAMES.patient, questionnaireResponse: answers() } }))).toEqual([
      'duplicate-entry context.response.fullUrl',
    ])
  })

  // CH ORF's document asks a patient, an author and an order (its
  // Composition's subject and author 1..1, its section's ServiceRequest
  // 1..*); a context without one is refused where it is missing.
  test('refuses a context that is no object', () => {
    expect(refusedAs(toChOrfDocument('referral' as never))).toEqual(['absent context'])
  })

  test.each(['identifier', 'composition', 'patient', 'author', 'serviceRequests'] as const)('refuses a context without its %s', (name) => {
    const { [name]: _, ...rest } = referral()
    expect(refusedAs(toChOrfDocument(rest as ChOrfContext))).toContain(`absent context.${name}`)
  })

  test.each([
    ['a category given as a list', { category: [CLINICAL_DOCUMENT] }, 'unmapped context.composition.category'],
    ['a type with a member it does not write', { type: { ...CONSULTATION, version: '2.9' } }, 'unmapped context.composition.type'],
    ['a member it does not write', { identifier: { system: 'urn:ietf:rfc:3986', value: NAMES.document } }, 'unmapped context.composition'],
    ['no fullUrl', { fullUrl: undefined }, 'absent context.composition.fullUrl'],
  ])('refuses a Composition with %s', (_, change, refusal) => {
    expect(refusedAs(toChOrfDocument(withComposition(change)))).toEqual([refusal])
  })

  // What health-document decides of a Composition -- a status of R4's, a
  // type that is a coding, a date with its zone, a title of words, one the
  // narrative can carry -- and of a document's timestamp is decided there
  // and nowhere else; its refusals are given here at the host's own
  // paths, the section's title at sectionTitle and the one category at
  // category.
  test.each([
    ['a status R4 does not have', { status: 'current' }, 'unmapped context.composition.status'],
    ['no type', { type: undefined }, 'absent context.composition.type'],
    ['a type without its system', { type: { code: 'CN' } }, 'absent context.composition.type.system'],
    ['a category without its code', { category: { system: CLINICAL_DOCUMENT.system } }, 'absent context.composition.category.code'],
    ['a category that is a string', { category: 'DOCCLIN' }, 'absent context.composition.category'],
    ['a date without its zone', { date: '2026-10-17T10:00:00' }, 'zone context.composition.date'],
    ['a title of spaces', { title: '  ' }, 'absent context.composition.title'],
    ['a title the narrative cannot carry', { title: 'Zuweisung\u0001' }, 'grammar context.composition.title'],
    ['no section title', { sectionTitle: undefined }, 'absent context.composition.sectionTitle'],
    ['a section title the narrative cannot carry', { sectionTitle: 'Auftrag\u0000' }, 'grammar context.composition.sectionTitle'],
  ])('refuses a Composition with %s, at its own path', (_, change, refusal) => {
    const given = Object.fromEntries(Object.entries({ ...composition(), ...change }).filter(([, value]) => value !== undefined))
    expect(refusedAs(toChOrfDocument({ ...referral(), composition: given as never }))).toEqual([refusal])
  })

  test('refuses a timestamp that is no instant, at its own path', () => {
    expect(refusedAs(toChOrfDocument({ ...referral(), timestamp: '2026-10-17' }))).toEqual(['grammar context.timestamp'])
    // And where the document holds no answers, whose entry would stand
    // where an order's does.
    const { response: _, ...unanswered } = referral()
    expect(refusedAs(toChOrfDocument({ ...unanswered, timestamp: '2026-10-17' }))).toEqual(['grammar context.timestamp'])
  })

  // The host's answers are copied by health-core, which refuses what FHIR
  // JSON cannot carry, and their references resolved by health-document,
  // which refuses any the document does not hold; each refusal of them is
  // given at the answers' own path.
  test("refuses the host's answers where health-document refuses them, at their own path", () => {
    const withNumber = { ...answers(), item: [{ linkId: 'reason', answer: [{ valueInteger: 7 }] }] } as unknown as FhirJsonObject
    expect(refusedAs(toChOrfDocument({ ...referral(), response: { fullUrl: NAMES.response, questionnaireResponse: withNumber as never } }))).toEqual([
      'javascript-number context.response.questionnaireResponse.item[0].answer[0].valueInteger',
    ])
    const referring = {
      ...answers(),
      item: [{ linkId: 'reason', answer: [{ valueReference: { reference: 'urn:uuid:5c3e9a10-7b2d-4f61-9e8a-0d1c2b3a4fff' } }] }],
    }
    expect(refusedAs(toChOrfDocument({ ...referral(), response: { fullUrl: NAMES.response, questionnaireResponse: referring as never } }))).toEqual([
      'dangling context.response.questionnaireResponse.item[0].answer[0].valueReference.reference',
    ])
    // A decimal the host wrote keeps its digits through the document.
    const decimals = { ...answers(), item: [{ linkId: 'reason', answer: [{ valueDecimal: decimal('70.50', 'probe') }] }] }
    expect(writeJson(documented({ ...referral(), response: { fullUrl: NAMES.response, questionnaireResponse: decimals as never } }))).toContain(
      '"valueDecimal":70.50',
    )
  })

  // The cost of one decision in one place: health-document is asked only
  // of a context health-ch accepts, so a context wrong in both ways is
  // refused for health-ch's reasons first, and for the Composition's on
  // the next attempt (0009).
  test("answers health-ch's own refusals before health-document's", () => {
    const context = { ...withComposition({ status: 'current' }), patient: { ...patient(), gender: 'unknown' } } as unknown as ChOrfContext
    expect(refusedAs(toChOrfDocument(context))).toEqual(['unmapped context.patient.gender'])
  })
})

describe("where health-document's refusals are given", () => {
  // Each place the host's own value stands in the document health-ch
  // hands health-document, back at the host's path; the type and the
  // offset a refusal knows kept with it.
  test.each([
    ['context.timestamp', 'context.timestamp'],
    ['context.composition.status', 'context.composition.status'],
    ['context.composition.type.coding', 'context.composition.type.coding'],
    ['context.composition.category[0].system', 'context.composition.category.system'],
    ['context.composition.section[0].title', 'context.composition.sectionTitle'],
    ['context.entries[1].resource.item[0]', 'context.response.questionnaireResponse.item[0]'],
  ])('gives %s at %s', (from, to) => {
    const refusal = reRooted(new Refusal('grammar', from, { type: 'dateTime' }), 1)
    expect(refusal).toMatchObject({ rule: 'grammar', path: to, type: 'dateTime' })
  })

  test('keeps the offset and the language a refusal knows', () => {
    expect(reRooted(new Refusal('syntax', 'context.entries[1].resource', { offset: 7 }), 1)).toMatchObject({
      path: 'context.response.questionnaireResponse',
      offset: 7,
    })
    expect(reRooted(new Refusal('missing', 'context.composition.title', { language: 'fr' }), 1)).toMatchObject({
      path: 'context.composition.title',
      language: 'fr',
    })
  })

  // Anything else health-document refuses is something health-ch wrote:
  // a reference it made, an entry it named, a constant. That is a bug, and
  // is thrown as one rather than handed to the host as its mistake; so is
  // an entry's refusal where the document holds no answers.
  test.each([
    ['context.composition.subject.reference', 1],
    ['context.composition.sectionTitle', 1],
    ['context.composition.titles', 1],
    ['context.entries[2].resource.subject.reference', 1],
    ['context.entries[1].resource.item[0]', undefined],
    ['context.identifier.value', 1],
  ] as const)('throws on %s, which health-ch wrote', (path, responseAt) => {
    expect(() => reRooted(new Refusal('dangling', path), responseAt)).toThrow(/health-ch wrote/)
  })
})
