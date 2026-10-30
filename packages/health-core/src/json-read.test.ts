import { describe, expect, test } from 'vitest'
import { readJson } from './json-read.js'
import { isFhirNumber } from './numbers.js'
import { refusalOf } from './test-support.js'

describe('readJson', () => {
  // Every number keeps its source text: JSON.parse would hand over 0.1
  // for 0.10 and 9007199254740992 for 9007199254740993, before any code
  // here could look. A number is read as a decimal, the only FHIR type a
  // reader without the element's definition can know: JSON's number
  // grammar is R4's decimal grammar, character for character.
  test('keeps each number as written, as a decimal', () => {
    const read = readJson('{"value":0.10,"count":9007199254740993,"tiny":1E-400}') as Record<string, unknown>
    for (const [name, text] of [
      ['value', '0.10'],
      ['count', '9007199254740993'],
      ['tiny', '1E-400'],
    ] as const) {
      const value = read[name]
      expect(isFhirNumber(value), name).toBe(true)
      expect(value, name).toMatchObject({ type: 'decimal', text })
    }
  })

  // The rest of JSON reads as JSON: escapes decoded, a \u escape's hex
  // digits in either case, surrogate pairs joined, whitespace between
  // tokens ignored, names in the order given. A reader that knew only
  // lowercase hex would read É as another character, and a string in
  // a resource would change without a word.
  test('reads strings, booleans, nulls in arrays and names in order', () => {
    const read = readJson(' {\n\t"b" : "a\\"\\\\\\/\\b\\f\\n\\r\\t\\u00e9\\u00C9\\ud83d\\ude00" , "a" : [true, false, null, {"x": "y"}] }\r\n')
    expect(read).toEqual({ b: 'a"\\/\b\f\n\r\téÉ😀', a: [true, false, null, { x: 'y' }] })
    expect(Object.keys(read as object)).toEqual(['b', 'a'])
  })

  // A name a JavaScript object treats specially is still only a name: read
  // as JSON.parse reads it, an own property, and never the object's
  // prototype.
  test('reads __proto__ as a name and nothing more', () => {
    const read = readJson('{"__proto__":{"polluted":"yes"}}') as Record<string, unknown>
    expect(Object.getPrototypeOf(read)).toBe(Object.prototype)
    expect(Object.hasOwn(read, '__proto__')).toBe(true)
    expect(({} as Record<string, unknown>).polluted).toBeUndefined()
  })

  // R4: "Property names SHALL be unique". JSON.parse keeps the last of two
  // without a word, so a resource with two birthDates would be read as
  // whichever came second. Refused, naming the second.
  test('refuses a name given twice in one object', () => {
    expect(refusalOf(() => readJson('{"a":{"birthDate":"2000","birthDate":"2001"}}'))).toMatchObject({ rule: 'duplicate-name', path: '$.a.birthDate' })
  })

  // FHIR JSON's own rules over JSON's, as the writer holds them: no empty
  // object, array or string, no null but an array's item, and no name
  // JavaScript would reorder.
  test.each([
    ['{"a":{}}', 'empty', '$.a'],
    ['{"a":[]}', 'empty', '$.a'],
    ['{"a":""}', 'empty', '$.a'],
    ['{"a":null}', 'null', '$.a'],
    ['null', 'null', '$'],
    ['{"a":"x","1":"y"}', 'digit-name', '$["1"]'],
  ])('refuses %s', (text, rule, path) => {
    expect(refusalOf(() => readJson(text))).toMatchObject({ rule, path })
  })

  // Text that is not JSON is refused with where it stopped, and never with
  // what it held: the offset, not the text around it.
  test.each([
    ['', 0],
    ['{', 1],
    ['{"a":1,}', 7],
    ['{"a" 1}', 5],
    ['{"a":01}', 6],
    ['{"a":.5}', 5],
    ['{"a":1.}', 6],
    ['{"a":+1}', 5],
    ['{"a":NaN}', 5],
    ['{"a":tru}', 5],
    ['["a" "b"]', 5],
    ['{"a":"x"}x', 9],
    ['{"a":"\u0001"}', 6],
    ['{"a":"\\x"}', 7],
    ['{"a":"\\', 7],
    ['{"a":"\\u12g4"}', 7],
    ['{"a":"x', 7],
    ['{a:"x"}', 1],
    ['﻿{"a":"x"}', 0],
    ['{"a":"x"]', 8],
  ])('refuses %j at offset %i', (text, offset) => {
    expect(refusalOf(() => readJson(text))).toMatchObject({ rule: 'syntax', offset })
  })

  // Nesting costs memory, not the call stack. JSON.parse with a reviver,
  // which reading a number's source text needs, throws a RangeError at
  // this depth on Node 24.21.0 (17 October 2026), though JSON.parse alone
  // does not: an error no host expects from a parser. The bound on a
  // document is its length.
  test('reads a value nested deeper than a call stack', () => {
    let read = readJson(`${'['.repeat(100_000)}"x"${']'.repeat(100_000)}`)
    for (let level = 0; level < 100_000; level++) read = (read as readonly unknown[])[0] as never
    expect(read).toBe('x')
  })
})
