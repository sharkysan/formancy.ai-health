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
    ['an identifier', () => id('756.1234.5678.97 ', 'Patient.id'), '756.1234.5678.97'],
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
})
