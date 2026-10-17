import { describe, expect, expectTypeOf, test, vi } from 'vitest'
import { compareNumbers, decimal, integer, isFhirNumber, positiveInt, unsignedInt, type FhirDecimal, type FhirInteger } from './numbers.js'
import { refusalOf } from './test-support.js'

describe('decimal', () => {
  // FHIR R4 regards 0.010 as a different value from 0.01 and says the
  // original precision should be preserved. Each of these loses something
  // through a JavaScript number: the trailing zero, the sign of zero, the
  // exponent's spelling, or every digit past the seventeenth.
  test.each([
    ['0.10', 'a trailing zero'],
    ['-0.0', 'a negative zero, which R4\'s grammar admits'],
    ['1E+2', 'an exponent with its sign and capital E, which R4\'s grammar admits'],
    ['1e-3', 'a small value in exponent form'],
    ['123456789012345678901234567890', 'thirty integer digits'],
    ['0.123456789012345678901234567890', 'thirty fractional digits'],
    ['99999999999999.9999', 'eighteen digits, the plan\'s regression case'],
    ['9007199254740993', '2^53 + 1, which a double rounds to 2^53'],
    ['1E+400', 'a magnitude no double holds'],
  ])('keeps %s as written: %s', (text) => {
    expect(decimal(text, 'value').text).toBe(text)
  })

  // A decimal outside R4's grammar is not a FHIR decimal, and writing it
  // unquoted would not even be JSON. Each of these is something a host's
  // formatting or a locale produces.
  test.each([
    ['', 'nothing'],
    ['.5', 'no digit before the point'],
    ['5.', 'no digit after the point'],
    ['+5', 'a plus sign, which neither R4 nor JSON admits on a decimal'],
    ['05', 'a leading zero'],
    ['1,5', 'a decimal comma'],
    [' 1', 'a space'],
    ['1e', 'an exponent without digits'],
    ['NaN', 'not a number at all'],
    ['Infinity', 'what a double overflows to'],
    ['0x10', 'hexadecimal'],
  ])('refuses %j: %s', (text) => {
    expect(refusalOf(() => decimal(text, 'Observation.valueQuantity.value'))).toMatchObject({ rule: 'grammar', path: 'Observation.valueQuantity.value' })
  })

  // A JavaScript number has already been through a double: 0.10 is 0.1 by
  // the time it arrives, and nothing can tell. Refused, so a host that
  // passes one finds out at the call rather than in a receiver's display.
  test('refuses a JavaScript number, which may already have lost digits', () => {
    expect(refusalOf(() => decimal(0.1 as never, 'value'))).toMatchObject({ rule: 'javascript-number', path: 'value' })
  })

  // Formancy Data hands an integer column over as a bigint when it does not
  // fit a double; as a decimal it keeps every digit.
  test('takes a bigint as its digits', () => {
    expect(decimal(9007199254740993n, 'value').text).toBe('9007199254740993')
  })

  // Something that is neither text nor a bigint has no digits to keep: an
  // object whose toString answers a decimal would be read through code the
  // host never meant to run as a value.
  test('refuses what is neither text nor a bigint', () => {
    expect(refusalOf(() => decimal({ toString: () => '1' } as never, 'value'))).toMatchObject({ rule: 'grammar' })
  })
})

describe('the integer types', () => {
  const MAKE = { integer, positiveInt, unsignedInt }

  // R4's integer is 32-bit, and nothing here wraps or truncates: a value
  // one past either end is refused, the ends themselves are not.
  test.each([
    ['integer', '-2147483648', true],
    ['integer', '2147483647', true],
    ['integer', '-2147483649', false],
    ['integer', '2147483648', false],
    ['positiveInt', '1', true],
    ['positiveInt', '2147483647', true],
    ['positiveInt', '2147483648', false],
    ['unsignedInt', '0', true],
    ['unsignedInt', '2147483647', true],
    ['unsignedInt', '2147483648', false],
  ] as const)('%s of %s is accepted: %s', (type, text, accepted) => {
    if (accepted) expect(MAKE[type](text, 'value').text).toBe(text)
    else expect(refusalOf(() => MAKE[type](text, 'value'))).toMatchObject({ rule: 'range', path: 'value' })
  })

  // Formancy Data's 2^53 + 1 is a decimal and never an R4 integer: refused
  // by its range, never by a double that rounded it first.
  test('refuses 2^53 + 1 by its range', () => {
    expect(refusalOf(() => integer('9007199254740993', 'value'))).toMatchObject({ rule: 'range' })
    expect(refusalOf(() => integer(9007199254740993n, 'value'))).toMatchObject({ rule: 'range' })
  })

  // BigInt reads a long text in time that grows faster than the text: a
  // million digits in about 100 ms, four million in about 530, on Node
  // 24.21.0 on 17 October 2026. A host's megabyte of digits must not cost
  // that, so a text longer than any value in range is refused by its
  // length, and BigInt never reads it.
  test('refuses a text longer than any value in range without reading it as a BigInt', () => {
    const read = vi.spyOn(globalThis, 'BigInt')
    try {
      expect(refusalOf(() => unsignedInt('9'.repeat(12), 'value'))).toMatchObject({ rule: 'range' })
      expect(read).not.toHaveBeenCalled()
      expect(refusalOf(() => unsignedInt('9'.repeat(11), 'value'))).toMatchObject({ rule: 'range' })
      expect(read).toHaveBeenCalled()
    } finally {
      read.mockRestore()
    }
  })

  // An integer is written as a JSON number, and must be R4's integer as
  // well. R4's informative regex admits a leading '+', which JSON's number
  // cannot carry; JSON admits '-0' and an exponent, which R4's integer
  // does not. Each is refused rather than rewritten: dropping a sign is
  // still changing what the host gave. A positiveInt of 0 is outside R4's
  // form, `+?[1-9][0-9]*`, before it is outside its range.
  test.each([
    ['integer', '+5'],
    ['integer', '-0'],
    ['integer', '1E+2'],
    ['integer', '1.0'],
    ['integer', '007'],
    ['positiveInt', '+1'],
    ['positiveInt', '0'],
    ['positiveInt', '-1'],
    ['unsignedInt', '-1'],
    ['unsignedInt', '00'],
  ] as const)('%s refuses %j by its form', (type, text) => {
    expect(refusalOf(() => MAKE[type](text, 'value'))).toMatchObject({ rule: 'grammar' })
  })

  // 23 as a double is exact, but a host that passes doubles passes 0.1 the
  // same way; the rule is the type, not the luck of the value.
  test('refuses a JavaScript number even when it happens to be whole', () => {
    expect(refusalOf(() => integer(23 as never, 'value'))).toMatchObject({ rule: 'javascript-number' })
  })

  // Formancy Data hands an integer column over as a bigint: one within
  // the range is an integer, written from its own digits and its sign,
  // not refused for not being text.
  test('takes a bigint within the range', () => {
    expect(integer(-2147483648n, 'value').text).toBe('-2147483648')
  })
})

describe('a FHIR number', () => {
  // writeJson tells a number from a string by this, and nothing else: a
  // Questionnaire item is { type: 'decimal', text: '...' } too, and must
  // be written as the object it is.
  test('is told apart from an object of the same shape', () => {
    expect(isFhirNumber(decimal('1', 'value'))).toBe(true)
    expect(isFhirNumber({ type: 'decimal', text: '1' })).toBe(false)
    expect(isFhirNumber(Object.create(Object.getPrototypeOf(decimal('1', 'value')) as object))).toBe(false)
    expect(isFhirNumber(null)).toBe(false)
    expect(isFhirNumber('1')).toBe(false)
  })

  // A number checked once must stay what was checked.
  test('cannot be changed after it was checked', () => {
    const value = decimal('0.10', 'value')
    expect(() => {
      ;(value as { type: string }).type = 'integer'
    }).toThrow(TypeError)
    expect(value.type).toBe('decimal')
  })

  // JSON.stringify would write a decimal as an object where the resource
  // has a number. It refuses, rather than write a resource no receiver
  // reads, and says what writes it.
  test('refuses to be written by JSON.stringify', () => {
    expect(() => JSON.stringify({ value: decimal('0.10', 'value') })).toThrow(/writeJson/)
  })

  // Assigning an integer where a decimal is expected compiles nowhere: the
  // type says which FHIR type was checked. tsc holds it, through
  // `pnpm typecheck`; expectTypeOf does nothing at run time.
  test('carries the type that was checked in its own type', () => {
    expectTypeOf(decimal('1', 'value')).toEqualTypeOf<FhirDecimal>()
    expectTypeOf(integer('1', 'value')).toEqualTypeOf<FhirInteger>()
    expectTypeOf<FhirInteger>().not.toMatchTypeOf<FhirDecimal>()
  })
})

describe('compareNumbers', () => {
  // An enableWhen compares an answer with a value, and R4 compares the
  // values, not their spellings: the HL7 validator enables an item on
  // `= 2.50` for an answer of 2.5 (measured 17 October 2026, 0007), and
  // formancy's CEL agrees. A comparison of the texts, or through a double,
  // would get one of these wrong: a trailing zero, the sign of zero, an
  // exponent, a digit past the seventeenth, a magnitude no double holds.
  test.each([
    ['2.5', '2.50', 0],
    ['-0', '0', 0],
    ['-0.0', '0.000', 0],
    ['1E+2', '100', 0],
    ['1e-3', '0.001', 0],
    ['100', '1E+2', 0],
    ['0.1', '0.10000000000000001', -1],
    ['9007199254740993', '9007199254740992', 1],
    ['-1', '1', -1],
    ['1', '-1', 1],
    ['-2', '-10', 1],
    ['-10', '-2', -1],
    ['0', '-0.5', 1],
    ['-0.5', '0', -1],
    ['0', '0.5', -1],
    ['0.5', '0', 1],
    ['1E+400', '1E+399', 1],
    ['123456789012345678901234567890', '123456789012345678901234567891', -1],
    ['0.5', '0.49999999999999999999', 1],
    ['150', '149.99', 1],
    ['99.5', '100', -1],
  ] as const)('%s against %s is %i', (a, b, order) => {
    expect(compareNumbers(decimal(a, 'a'), decimal(b, 'b'))).toBe(order)
  })

  // An integer item's answer is compared with an integer's value, and an
  // integer is a number as a decimal is: 3 and 3.0 are one value.
  test('compares an integer with a decimal by their values', () => {
    expect(compareNumbers(integer('3', 'a'), decimal('3.0', 'b'))).toBe(0)
    expect(compareNumbers(integer('-2147483648', 'a'), integer('2147483647', 'b'))).toBe(-1)
  })

  // A number's text has no length R4 bounds, and an answer is a person's
  // input: its trailing zeros were stripped by a pattern that, tried from
  // every zero of a long run that a digit then ends, took time in the
  // square of the run (0.3 s for 20 000 zeros, 2.7 s for 60 000, measured
  // on 17 October 2026). It is read in time linear in its length.
  test('reads a long run of inner zeros in time linear in its length', () => {
    const long = decimal(`1${'0'.repeat(200_000)}1`, 'a')
    const started = Date.now()
    expect(compareNumbers(long, decimal('1', 'b'))).toBe(1)
    expect(Date.now() - started).toBeLessThan(1000)
  })

  // Only a number made here has a checked text; anything else handed
  // over is a bug in the caller, and answering for it would compare a
  // text nobody checked.
  test('throws on what is not a FHIR number', () => {
    expect(() => compareNumbers({ type: 'decimal', text: '1' } as never, decimal('1', 'b'))).toThrow(TypeError)
  })
})
