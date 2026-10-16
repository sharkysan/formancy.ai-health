import { describe, expect, test } from 'vitest'
import { readJson } from './json-read.js'
import { writeJson } from './json-write.js'
import { decimal, integer } from './numbers.js'
import { refusalOf } from './test-support.js'

/**
 * Release gate G3's evidence: the decimal and integer corpus round-trips
 * digit for digit, and the same input gives byte-identical output.
 *
 * Each value here is one a double cannot hold as written. So a reader, a
 * writer or a primitive that sent a value through a JavaScript number --
 * Number(), parseFloat, JSON.parse, a unary plus -- fails one of them,
 * whichever spelling the conversion had. scripts/exact-and-reproducible.test.mjs
 * refuses the spellings it can see in the source; this is what fails for
 * the ones it cannot.
 */
const DECIMALS = [
  '0.10',
  '-0.0',
  '1E+2',
  '1e-3',
  '99999999999999.9999',
  '9007199254740993',
  '123456789012345678901234567890',
  '-123456789012345678901234567890.123456789012345678901234567890',
  '0.000000000000000000000000000001',
  '1E+400',
  '-1e-400',
] as const

describe('exact values', () => {
  // A trailing zero, a negative zero, an exponent's spelling and every
  // digit past the seventeenth, through the reader and the writer and
  // back: what a receiver gets is what the host's text said.
  test.each(DECIMALS)('%s survives a read and a write, digit for digit', (text) => {
    const json = `{"resourceType":"Observation","valueQuantity":{"value":${text}},"component":[{"valueDecimal":${text}}]}`
    expect(writeJson(readJson(json))).toBe(json)
  })

  // And through the primitive, as a host builds a resource rather than
  // reading one.
  test.each(DECIMALS)('%s survives decimal() and a write', (text) => {
    expect(writeJson({ value: decimal(text, 'value') })).toBe(`{"value":${text}}`)
  })

  // Formancy Data's 2^53 + 1 is a decimal and never an R4 integer: kept as
  // one, refused as the other, and never rounded to 2^53 in between.
  test('2^53 + 1 is kept as a decimal and refused as an integer', () => {
    expect(writeJson({ value: decimal(9007199254740993n, 'value') })).toBe('{"value":9007199254740993}')
    expect(refusalOf(() => integer(9007199254740993n, 'value'))).toMatchObject({ rule: 'range' })
  })
})

describe('reproducible output', () => {
  // The same input gives the same bytes: no clock, no random source, no
  // order but the one given. Two resources built apart, from the same
  // values, are written identically, and a resource written, read and
  // written again is the bytes it was.
  test('the same input gives byte-identical JSON', () => {
    const build = () => ({
      resourceType: 'Observation',
      id: 'a',
      valueQuantity: { value: decimal('70.50', 'value') },
      component: [{ valueInteger: integer('7', 'value') }],
    })
    const first = writeJson(build())
    expect(writeJson(build())).toBe(first)
    expect(writeJson(readJson(first))).toBe(first)
  })
})

describe('the reader and the writer', () => {
  // One rule held in two places: if the writer accepted what the reader
  // refuses, a host's own output would fail to read back, and the other
  // way round. Each of FHIR JSON's rules both of them hold, given once as
  // text and once as the value that text would be.
  test.each([
    ['{"a":{}}', { a: {} }, 'empty'],
    ['{"a":[]}', { a: [] }, 'empty'],
    ['{"a":""}', { a: '' }, 'empty'],
    ['{"a":null}', { a: null }, 'null'],
    ['{"1":"x"}', { 1: 'x' }, 'digit-name'],
  ])('both refuse %s', (text, value, rule) => {
    expect(refusalOf(() => readJson(text)).rule).toBe(rule)
    expect(refusalOf(() => writeJson(value as never)).rule).toBe(rule)
  })
})
