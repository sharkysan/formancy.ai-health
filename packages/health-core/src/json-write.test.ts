import { describe, expect, test } from 'vitest'
import { writeJson } from './json-write.js'
import { decimal, integer, unsignedInt } from './numbers.js'
import { dateTime } from './strings.js'
import { refusalOf } from './test-support.js'

/** A value as a JavaScript caller could hand it over, past what the types admit. */
const untyped = (value: unknown) => value as never

describe('writeJson', () => {
  // The digits a decimal was made from are the digits written, unquoted:
  // a JSON number where FHIR's decimal is one, and its trailing zero kept.
  // Through JSON.stringify the same resource says 70.5 and 1, and the
  // receiver shows a precision nobody measured.
  test('writes numbers from their digits, unquoted', () => {
    const observation = {
      resourceType: 'Observation',
      valueQuantity: { value: decimal('70.50', 'value'), unit: 'kg' },
      component: [{ valueInteger: integer('-2147483648', 'value') }, { valueInteger: unsignedInt('0', 'value') }],
      effectiveDateTime: dateTime('2026-10-17T10:00:00+02:00', 'value'),
      status: 'final',
      _status: { extension: [{ url: 'http://example.org/note', valueBoolean: true }, { url: 'http://example.org/flag', valueBoolean: false }] },
    }
    expect(writeJson(observation)).toBe(
      '{"resourceType":"Observation","valueQuantity":{"value":70.50,"unit":"kg"},"component":[{"valueInteger":-2147483648},{"valueInteger":0}],' +
        '"effectiveDateTime":"2026-10-17T10:00:00+02:00","status":"final",' +
        '"_status":{"extension":[{"url":"http://example.org/note","valueBoolean":true},{"url":"http://example.org/flag","valueBoolean":false}]}}',
    )
  })

  // Order is the order given, not sorted: a host that builds resourceType
  // first gets it first. And a repeating primitive's _ array keeps its
  // nulls, which R4 uses to line extensions up with values.
  test('keeps the order given, and a null that lines up a repeating primitive', () => {
    expect(writeJson({ b: 'x', a: 'y' })).toBe('{"b":"x","a":"y"}')
    expect(writeJson({ given: ['A', 'B'], _given: [null, { id: 'b' }] })).toBe('{"given":["A","B"],"_given":[null,{"id":"b"}]}')
  })

  // Strings are JSON strings, escaped as JSON.stringify escapes them, so a
  // quote or a line break in an answer cannot end the string early.
  test('escapes strings', () => {
    expect(writeJson({ text: 'a "b"\n\\c\u0001' })).toBe('{"text":"a \\"b\\"\\n\\\\c\\u0001"}')
  })

  // A JavaScript number is a decimal that already lost its digits, or an
  // integer nobody checked against its range. Refused wherever it is, with
  // the path, so the host finds which element it built from a double.
  test.each<[string, unknown, string]>([
    ['the value of a quantity', { valueQuantity: { value: 70.5 } }, '$.valueQuantity.value'],
    ['the member of an item', { component: [{ valueInteger: 1 }] }, '$.component[0].valueInteger'],
    ['NaN', { value: Number.NaN }, '$.value'],
    ['Infinity', { value: Number.POSITIVE_INFINITY }, '$.value'],
    ['a member whose name needs quotes', { 'a b': 1 }, '$["a b"]'],
    ['the value itself', 7, '$'],
  ])('refuses a JavaScript number as %s, at its path', (_, value, path) => {
    expect(refusalOf(() => writeJson(untyped(value)))).toMatchObject({ rule: 'javascript-number', path })
  })

  // What JSON.stringify drops or turns into something else without a word:
  // undefined and a function vanish, a Date becomes an instant in UTC that
  // nobody chose for a date, a Map becomes {}, and a bigint, which
  // JSON.stringify throws on, has no FHIR type yet.
  test.each<[string, unknown]>([
    ['undefined', undefined],
    ['a function', () => 1],
    ['a symbol', Symbol('s')],
    ['a bigint', 1n],
    ['a Date', new Date(0)],
    ['a Map', new Map([['a', 'b']])],
    ['a class instance', new (class Thing {})()],
  ])('refuses %s', (_, value) => {
    expect(refusalOf(() => writeJson(untyped({ value })))).toMatchObject({ rule: 'not-json', path: '$.value' })
  })

  // R4: objects and arrays are never empty, string values never empty,
  // and properties never null. A resource with any of them is not FHIR
  // JSON, and a receiver would refuse what the host thought it sent.
  test.each([
    [{ value: {} }, 'empty', '$.value'],
    [{ value: [] }, 'empty', '$.value'],
    [{ value: '' }, 'empty', '$.value'],
    [{ value: [''] }, 'empty', '$.value[0]'],
    [{ value: null }, 'null', '$.value'],
    [null, 'null', '$'],
  ])('refuses %j', (value, rule, path) => {
    expect(refusalOf(() => writeJson(untyped(value)))).toMatchObject({ rule, path })
  })

  // JavaScript puts a name that is a whole number before every other name
  // of an object, whatever order it was given in, so readJson could not
  // keep its place. No FHIR element is named that way; refused on both
  // sides, so what one writes the other reads back.
  test('refuses a name that is a whole number', () => {
    expect(refusalOf(() => writeJson({ a: 'x', 1: 'y' }))).toMatchObject({ rule: 'digit-name', path: '$["1"]' })
  })

  // A host's object is read as data and never run: a getter could answer
  // one thing to a check and another to the write, a proxy's trap could
  // throw, a hidden or symbol-named property or a named property on an
  // array would be dropped without a word, and a proxy may describe an
  // array's length as anything, which the loop over its items would run to.
  test('reads a host\'s objects as data, without running them', () => {
    let ran = false
    const getter = Object.defineProperty({}, 'value', {
      enumerable: true,
      get: () => {
        ran = true
        return 'x'
      },
    })
    const hidden = Object.defineProperty({ a: 'x' }, 'value', { value: 'y', enumerable: false })
    const symbol = { a: 'x', [Symbol('s')]: 'y' }
    const named = Object.assign(['x'], { extra: 'y' })
    const throwing = new Proxy({}, { ownKeys: () => { throw new Error('trap') } })
    const revoked = Proxy.revocable([], {})
    revoked.revoke()
    const lengthOf = (length: unknown) =>
      new Proxy([], {
        getOwnPropertyDescriptor: (target, key) =>
          key === 'length' ? { value: length, writable: true, enumerable: false, configurable: false } : Reflect.getOwnPropertyDescriptor(target, key),
      })
    const cases: [unknown, string][] = [
      [getter, '$.value.value'],
      [hidden, '$.value.value'],
      [symbol, '$.value'],
      [named, '$.value'],
      [throwing, '$.value'],
      [revoked.proxy, '$.value'],
      [['x', , 'y'], '$.value[1]'],
      [lengthOf('many'), '$.value'],
      [lengthOf(1.5), '$.value'],
      [lengthOf(-1), '$.value'],
    ]
    for (const [value, path] of cases) {
      expect(refusalOf(() => writeJson({ value: untyped(value) }))).toMatchObject({ rule: 'not-data', path })
    }
    expect(ran).toBe(false)
  })

  // A value that contains itself has no JSON, and walking it would never
  // end. The same object twice, side by side, is two copies, as JSON has.
  test('refuses a value that contains itself, and writes one shared twice', () => {
    const loop: Record<string, unknown> = { a: 'x' }
    loop.self = { again: loop }
    expect(refusalOf(() => writeJson(untyped(loop)))).toMatchObject({ rule: 'cycle', path: '$.self.again' })
    const coding = { code: 'a' }
    expect(writeJson({ coding: [coding, coding] })).toBe('{"coding":[{"code":"a"},{"code":"a"}]}')
  })

  // Built objects with no prototype, as some hosts make maps of, are plain
  // data and are written.
  test('writes an object with no prototype', () => {
    const value = Object.assign(Object.create(null) as Record<string, string>, { a: 'x' })
    expect(writeJson(value)).toBe('{"a":"x"}')
  })

  // Nesting costs memory, not the call stack: a writer that recursed would
  // throw a RangeError at this depth, as one did on Node 24.21.0 on 17
  // October 2026, and this one writes it.
  test('writes a value nested deeper than a call stack', () => {
    let deep: unknown = 'x'
    for (let level = 0; level < 100_000; level++) deep = [deep]
    expect(writeJson(untyped(deep))).toBe(`${'['.repeat(100_000)}"x"${']'.repeat(100_000)}`)
  })
})
