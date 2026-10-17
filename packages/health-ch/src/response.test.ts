import { Refusals } from '@formancy/health-core'
import { describe, expect, test } from 'vitest'
import { responseOf } from './response.js'
import { answers, NAMES } from './test-support.js'

/** The document's entries by name, as the document reads them: what a response may name. */
const ENTRIES: ReadonlyMap<string, string> = new Map([
  [NAMES.composition, 'Composition'],
  [NAMES.patient, 'Patient'],
  [NAMES.response, 'QuestionnaireResponse'],
  [NAMES.serviceRequest, 'ServiceRequest'],
  [NAMES.role, 'PractitionerRole'],
  [NAMES.practitioner, 'Practitioner'],
  [NAMES.organization, 'Organization'],
])

/** What `responseOf` makes of `response` as the host's context holds it, and the refusals as `rule path`. */
function reading(response: unknown) {
  const refusals = new Refusals()
  const made = responseOf({ response }, ENTRIES, refusals)
  return { made, refused: refusals.list.map((refusal) => `${refusal.rule} ${refusal.path}`) }
}

/** The host's response, its resource changed by `change`: a member `change` gives as undefined is taken out, not left holding undefined. */
const changed = (change: Record<string, unknown>) => ({
  fullUrl: NAMES.response,
  questionnaireResponse: Object.fromEntries(Object.entries({ ...answers(), ...change }).filter(([, value]) => value !== undefined)),
})

const AT = 'context.response.questionnaireResponse'

describe("the host's response", () => {
  // The answers are the host's, made by health-questionnaire: carried as
  // they are, under the host's name, for health-document to copy.
  test('is carried as it is, under its name', () => {
    const { made, refused } = reading({ fullUrl: NAMES.response, questionnaireResponse: answers() })
    expect(refused).toEqual([])
    expect(made).toEqual({ fullUrl: NAMES.response, resource: answers() })
  })

  // CH ORF makes the response 0..1 (ch-orf-document,
  // Bundle.entry:QuestionnaireResponse): a document without one has none.
  test('is none where the host gives none', () => {
    expect(reading(undefined)).toEqual({ made: undefined, refused: [] })
  })

  // A response that does not claim CH ORF's profile is held to nothing of
  // it: measured on 17 October 2026, one whose subject was the
  // practitioner was refused claiming ch-orf-questionnaireresponse and
  // accepted without the claim, since the document's slices for it are
  // 0..1. The host passes PROFILES.questionnaireResponse to
  // toQuestionnaireResponse as its profiles; a response without the claim,
  // or that is no response at all, is refused.
  test('is refused when it does not claim the profile, or is no QuestionnaireResponse', () => {
    const { meta: _, ...unclaimed } = answers()
    expect(reading({ fullUrl: NAMES.response, questionnaireResponse: unclaimed }).refused).toEqual([`profile ${AT}.meta.profile`])
    expect(reading(changed({ meta: { profile: ['http://hl7.org/fhir/uv/sdc/StructureDefinition/sdc-questionnaireresponse|4.0.0'] } })).refused).toEqual([`profile ${AT}.meta.profile`])
    expect(reading(changed({ meta: { profile: 'http://fhir.ch/ig/ch-orf/StructureDefinition/ch-orf-questionnaireresponse|3.0.2' } })).refused).toEqual([`profile ${AT}.meta.profile`])
    expect(reading(changed({ resourceType: 'Questionnaire' })).refused).toEqual([`profile ${AT}.resourceType`])
  })

  // The document carries the Questionnaire by its canonical, which the
  // host publishes; one without its version names whichever version a
  // receiver resolves, not the one answered. SDC asks the same: its
  // questionnaire "SHALL be the version-specific URL of the form".
  test('is refused when it names its Questionnaire without the version', () => {
    expect(reading(changed({ questionnaire: 'https://forms.synthetic.invalid/Questionnaire/referral' })).refused).toEqual([`unversioned ${AT}.questionnaire`])
    expect(reading(changed({ questionnaire: 'https://forms.synthetic.invalid/Questionnaire/referral|' })).refused).toEqual([`unversioned ${AT}.questionnaire`])
    expect(reading(changed({ questionnaire: undefined })).refused).toEqual([`absent ${AT}.questionnaire`])
  })

  // Answers in a referral are the patient's: ch-orf-questionnaireresponse
  // types its subject ch-core-patient, and the document has one patient.
  // A response of another subject, or of none, is refused here, since the
  // validator holds it only through the claim.
  test.each([
    ['of nobody', { subject: undefined }, `absent ${AT}.subject`],
    ['of the practitioner', { subject: { reference: NAMES.practitioner } }, `reference ${AT}.subject.reference`],
    ['of a patient the document does not hold', { subject: { reference: 'urn:uuid:5c3e9a10-7b2d-4f61-9e8a-0d1c2b3a4fff' } }, `dangling ${AT}.subject.reference`],
    ['of a patient on the receiver server', { subject: { reference: 'Patient/synthetic-1' } }, `dangling ${AT}.subject.reference`],
  ])('is refused when it is %s', (_, change, refusal) => {
    expect(reading(changed(change)).refused).toEqual([refusal])
  })

  // Its author and its source name entries of the document, of the types
  // CH ORF's profile allows: an author is the role, the practitioner, the
  // organisation or the patient; a source the patient, the role or the
  // practitioner, never an organisation.
  test('takes an author and a source of the types CH ORF allows', () => {
    for (const author of [NAMES.patient, NAMES.role, NAMES.practitioner, NAMES.organization]) expect(reading(changed({ author: { reference: author } })).refused).toEqual([])
    for (const source of [NAMES.patient, NAMES.role, NAMES.practitioner]) expect(reading(changed({ source: { reference: source } })).refused).toEqual([])
    expect(reading(changed({ author: undefined, source: undefined })).refused).toEqual([])
  })

  test.each([
    ['an author that is an order', { author: { reference: NAMES.serviceRequest } }, `reference ${AT}.author.reference`],
    ['a source that is the organisation', { source: { reference: NAMES.organization } }, `reference ${AT}.source.reference`],
    ['an author the document does not hold', { author: { reference: 'urn:uuid:5c3e9a10-7b2d-4f61-9e8a-0d1c2b3a4fff' } }, `dangling ${AT}.author.reference`],
    ['a source that is no reference', { source: 'Patient' }, `reference ${AT}.source.reference`],
  ])('is refused with %s', (_, change, refusal) => {
    expect(reading(changed(change)).refused).toEqual([refusal])
  })

  test.each([
    ['no fullUrl', { questionnaireResponse: answers() }, 'absent context.response.fullUrl'],
    ['no resource', { fullUrl: NAMES.response }, `absent ${AT}`],
    ['answers that are a string, not an entry', 'answers', 'absent context.response'],
    ['a resource that is a string', { fullUrl: NAMES.response, questionnaireResponse: 'answers' }, `absent ${AT}`],
    ['a member it does not read', { fullUrl: NAMES.response, questionnaireResponse: answers(), questionnaire: {} }, 'unmapped context.response'],
  ])('is refused with %s', (_, given, refusal) => {
    expect(reading(given).refused).toEqual([refusal])
  })

  // ch-orf-questionnaireresponse types basedOn a ch-orf-servicerequest,
  // encounter a ch-core-encounter, and R4 partOf an Observation or a
  // Procedure (package/StructureDefinition-ch-orf-questionnaireresponse.json,
  // read on 17 October 2026). health-questionnaire writes none of them, nor
  // an id or a text, and nothing here holds them to the profile: a
  // response naming the patient as its basedOn reached the Bundle, for
  // the validator to refuse. A member toQuestionnaireResponse does not
  // write is refused at the response, its name not repeated.
  test.each([
    ['based on the patient', { basedOn: [{ reference: NAMES.patient }] }],
    ['in an encounter that is the patient', { encounter: { reference: NAMES.patient } }],
    ['part of the order', { partOf: [{ reference: NAMES.serviceRequest }] }],
    ['an id of its own', { id: 'answers-1' }],
    ['a narrative', { text: { status: 'generated', div: '<div xmlns="http://www.w3.org/1999/xhtml">Antworten</div>' } }],
  ])('is refused %s, which health-questionnaire does not write', (_, change) => {
    expect(reading(changed(change)).refused).toEqual([`unmapped ${AT}`])
  })

  // A member of the host's own naming is refused before the response is
  // copied: copied, a value under it FHIR JSON cannot carry would be
  // refused at a path that spells the host's name, and a name is the
  // host's to choose -- a number, a person's.
  test("is refused for a member of the host's naming without quoting the name", () => {
    const result = reading(changed({ 'Synthetica-7561234567890': 7 }))
    expect(result.refused).toEqual([`unmapped ${AT}`])
  })

  // What is checked is what is carried: a host's object that answers one
  // subject when read and another when copied -- a getter, a Proxy -- was
  // checked as the patient's and carried as the practitioner's. The
  // response is copied first, by health-core, and the copy is checked and
  // carried.
  test('is checked as it is copied, and the copy carried', () => {
    const given = answers()
    const twoFaced = new Proxy(given, {
      get: (target, name) => (name === 'subject' ? { reference: NAMES.patient } : Reflect.get(target, name)),
      getOwnPropertyDescriptor: (target, name) => (name === 'subject' ? { value: { reference: NAMES.practitioner }, writable: true, enumerable: true, configurable: true } : Reflect.getOwnPropertyDescriptor(target, name)),
    })
    expect(reading({ fullUrl: NAMES.response, questionnaireResponse: twoFaced }).refused).toEqual([`reference ${AT}.subject.reference`])
    const { made } = reading({ fullUrl: NAMES.response, questionnaireResponse: given })
    expect(made?.resource).toEqual(given)
    expect(made?.resource).not.toBe(given)
  })

  // What FHIR JSON cannot carry is refused where it stands in the host's
  // answers, by health-core's writer.
  test('is refused where FHIR JSON cannot carry it, at its own path', () => {
    expect(reading(changed({ item: [{ linkId: 'reason', answer: [{ valueInteger: 7 }] }] })).refused).toEqual([`javascript-number ${AT}.item[0].answer[0].valueInteger`])
  })
})
