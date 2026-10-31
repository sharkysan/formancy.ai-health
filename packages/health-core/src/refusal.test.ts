import { describe, expect, test } from 'vitest'
import { readJson } from './json-read.js'
import { writeJson } from './json-write.js'
import { decimal, integer } from './numbers.js'
import { Refusal } from './refusal.js'
import { date, dateTime, id } from './strings.js'
import { refusalOf } from './test-support.js'

describe('a refusal', () => {
  // A refusal ends up in a host's log, and every value it could quote may
  // be a person's: a birth date, a weight, an identifier. It names the
  // path and the rule, and the value never, not even in part. Each value
  // here is synthetic and distinctive, so finding it in a message means
  // the message quoted it.
  test.each([
    ['a birth date', () => date('1987-02-29', 'Patient.birthDate'), '1987-02-29'],
    ['a time without its zone', () => dateTime('1987-06-12T07:41:00', 'Observation.effectiveDateTime'), '1987-06-12T07:41:00'],
    ['an identifier', () => id('756.1234.5678.90 ', 'Patient.id'), '756.1234.5678.90'],
    ['a weight with a decimal comma', () => decimal('73,25', 'Observation.valueQuantity.value'), '73,25'],
    ['a count past the range', () => integer('31415926535', 'Observation.valueInteger'), '31415926535'],
    ['a JavaScript number', () => writeJson({ valueQuantity: { value: 73.25 } } as never), '73.25'],
    ['an empty string', () => readJson('{"name":[{"family":"Muster","given":[""]}]}'), 'Muster'],
    ['text that is not JSON', () => readJson('{"family":"Muster" "given":"Erika"}'), 'Erika'],
  ])('about %s names its path and never the value', (_, act, value) => {
    const refusal = refusalOf(act)
    expect(refusal.message).not.toContain(value)
    expect(refusal.message).toContain(refusal.path)
  })

  // A host tells a refusal from a bug by its class and its rule, never by
  // matching a message's words, which may change.
  test('is a Refusal, with a rule and a path a host can branch on', () => {
    const refusal = refusalOf(() => dateTime('2026-10-17T10:00:00', 'Observation.effectiveDateTime'))
    expect(refusal).toBeInstanceOf(Refusal)
    expect(refusal).toBeInstanceOf(Error)
    expect(refusal).toMatchObject({ name: 'Refusal', rule: 'zone', path: 'Observation.effectiveDateTime', offset: undefined })
    expect(refusal.message).toMatch(/^Observation\.effectiveDateTime: not a FHIR R4 dateTime: /)
  })

  // A syntax refusal says where the text stopped being JSON, as an offset
  // a host can find in what it read.
  test('of JSON text names the offset', () => {
    const refusal = refusalOf(() => readJson('{"a":01}'))
    expect(refusal).toMatchObject({ rule: 'syntax', path: '$.a', offset: 6 })
    expect(refusal.message).toBe('$.a: not JSON at offset 6')
  })

  // The packages above this one refuse what an input says and a resource
  // cannot -- a form in a version nothing reads, a field type with no
  // item, a text missing in a language -- and a host branches on those
  // the way it branches on a primitive's: by the rule, from one class. A
  // rule with no words of its own would print "undefined" where the
  // reason belongs.
  test.each([
    ['version', 'form.specVersion'],
    ['invalid', 'form.model.fields[0].key'],
    ['unmapped', 'form.model.fields[2].type'],
    ['missing', 'form.model.fields[1].label'],
  ] as const)('for a mapping, %s, has words of its own and names its path', (rule, path) => {
    const refusal = new Refusal(rule, path)
    expect(refusal).toMatchObject({ rule, path, language: undefined })
    expect(refusal.message.startsWith(`${path}: `)).toBe(true)
    expect(refusal.message).not.toContain('undefined')
  })

  // The answers' export refuses what a submission holds and a response
  // cannot: a value of another type, an option not offered, a value past a
  // bound, a name the form does not have, an answer to a disabled item, a
  // required item unanswered, a reference that is an address. A host
  // branches on each by its rule; one with no words of its own would print
  // "undefined" where the reason belongs (0007).
  test.each([
    ['answer-type', 'answers.weight'],
    ['option', 'answers.topics[1]'],
    ['bound', 'answers.children'],
    ['unknown', 'answers.address'],
    ['disabled', 'answers.canton_detail'],
    ['required', 'answers.contacts'],
    ['reference', 'context.subject.reference'],
  ] as const)('for answers, %s, has words of its own and names its path', (rule, path) => {
    const refusal = new Refusal(rule, path)
    expect(refusal).toMatchObject({ rule, path })
    expect(refusal.message.startsWith(`${path}: `)).toBe(true)
    expect(refusal.message).not.toContain('undefined')
  })

  // A document refuses what its host hands over and a Bundle cannot carry:
  // bytes that are not bytes, or not a PDF; a PDF profile nothing here has
  // proved; something the document needs and was not given; a reference
  // to a resource the Bundle does not hold, an entry the Composition does
  // not reach and two entries of one name; and an attachment that says a
  // size, a hash or a media type its bytes do not have. A host branches on
  // each by its rule; one with no words of its own would print "undefined"
  // where the reason belongs (0008).
  test.each([
    ['not-bytes', 'pdf.bytes'],
    ['not-pdf', 'pdf.bytes'],
    ['unproved', 'pdf.profile'],
    ['absent', 'context.identifier'],
    ['dangling', 'context.entries[1].resource.subject.reference'],
    ['unreferenced', 'context.entries[3]'],
    ['duplicate-entry', 'context.entries[2].fullUrl'],
    ['mismatch', 'context.entries[2].resource.content[0].attachment.hash'],
  ] as const)('for documents, %s, has words of its own and names its path', (rule, path) => {
    const refusal = new Refusal(rule, path)
    expect(refusal).toMatchObject({ rule, path })
    expect(refusal.message.startsWith(`${path}: `)).toBe(true)
    expect(refusal.message).not.toContain('undefined')
  })

  // A country's profiles refuse what its guide asks and a host's input does
  // not hold: an identifier not of its system's form, one whose check
  // digit its other digits do not give, a resource the document carries
  // that is not of the type or the profile its place asks for, and a
  // definition named without the version it was answered against. A host
  // branches on each by its rule; one with no words of its own would print
  // "undefined" where the reason belongs (0009).
  test.each([
    ['identifier', 'context.patient.ahvn13'],
    ['check-digit', 'context.author.practitioner.gln'],
    ['profile', 'context.response.questionnaireResponse.meta.profile'],
    ['unversioned', 'context.response.questionnaireResponse.questionnaire'],
  ] as const)("for a country's profiles, %s, has words of its own and names its path", (rule, path) => {
    const refusal = new Refusal(rule, path)
    expect(refusal).toMatchObject({ rule, path })
    expect(refusal.message.startsWith(`${path}: `)).toBe(true)
    expect(refusal.message).not.toContain('undefined')
  })

  // A text missing in one language is not the same refusal as the same
  // text missing in another: without the language, a host that asked for
  // fr and it would get two refusals it cannot tell apart, and fix one.
  test('names the language a text is missing in', () => {
    const refusal = new Refusal('missing', 'form.model.fields[1].label', { language: 'fr' })
    expect(refusal.language).toBe('fr')
    expect(refusal.message).toBe(
      'form.model.fields[1].label: a text the resource needs of it is absent, and nothing here supplies one or falls back to another language, in fr',
    )
  })
})
