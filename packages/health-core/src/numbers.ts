/**
 * FHIR R4's numbers -- decimal, integer, positiveInt, unsignedInt -- held as
 * the text they are written in, and never as a JavaScript number.
 *
 * R4 on decimal: "The precision of the decimal value has significance: e.g.
 * 0.010 is regarded as different to 0.01, and the original precision should
 * be preserved" (https://hl7.org/fhir/R4/datatypes.html, read on 17 October
 * 2026). A double keeps neither a trailing zero nor more than about
 * seventeen significant digits, so a value that passes through one is a
 * different value, and nothing afterwards can tell. Here a number is its
 * text, checked against its type once, when it is made; writeJson writes
 * that text, and readJson reads it, unchanged. Formancy Data and Report
 * carry exact values the same way (formancy.ai-data 0008,
 * formancy.ai-report 0010).
 *
 * The integers' ranges are checked as BigInt, which is exact, and never
 * through a double.
 */
import { Refusal } from './refusal.js'

/** The FHIR R4 types written as a JSON number. */
export type NumberType = 'decimal' | 'integer' | 'positiveInt' | 'unsignedInt'

/**
 * R4's decimal regex, as datatypes.html prints it. It is also, character
 * for character, JSON's number grammar (RFC 8259, section 6), which is why
 * readJson lexes a number with it and why every JSON number is a decimal's
 * text. It admits '-0.0' and '1E+2', so they are kept as written.
 */
export const DECIMAL = String.raw`-?(0|[1-9][0-9]*)(\.[0-9]+)?([eE][+-]?[0-9]+)?`

/**
 * Each type's text, anchored, as R4 says its informative regexes must be.
 * An integer type must be both R4's and a JSON number: R4's regexes admit
 * a leading '+' (`[0]|[-+]?[1-9][0-9]*`, `+?[1-9][0-9]*`), which JSON's
 * number cannot carry, and JSON admits '-0' and exponents, which R4's do
 * not. What both admit is below; a '+' is refused rather than dropped.
 */
const FORM: Readonly<Record<NumberType, RegExp>> = {
  decimal: new RegExp(`^(?:${DECIMAL})$`),
  integer: /^(?:0|-?[1-9][0-9]*)$/,
  positiveInt: /^[1-9][0-9]*$/,
  unsignedInt: /^(?:0|[1-9][0-9]*)$/,
}

/** R4's ranges: 32-bit, "for larger values, use decimal". */
const RANGE: Readonly<Record<Exclude<NumberType, 'decimal'>, readonly [bigint, bigint]>> = {
  integer: [-2147483648n, 2147483647n],
  positiveInt: [1n, 2147483647n],
  unsignedInt: [0n, 2147483647n],
}

/**
 * The most characters a value in any of the ranges has: '-2147483648'. A
 * longer text is outside them without being read as a BigInt, so a
 * megabyte of digits costs a length check.
 */
const LONGEST = 11

/** Whether an integer type's text, already of its form, is within `range`: by its length, then as a BigInt. */
function within(text: string, [lowest, highest]: readonly [bigint, bigint]): boolean {
  if (text.length > LONGEST) return false
  const value = BigInt(text)
  return value >= lowest && value <= highest
}

/**
 * A FHIR number: its type, and its text exactly as checked. Made only by
 * decimal(), integer(), positiveInt() and unsignedInt() -- readJson makes
 * each number it reads with decimal() -- and frozen once made. The class
 * is not exported, and isFhirNumber tells one from an object of the same
 * shape by a private field no other object can have.
 */
class FhirNumber<T extends NumberType = NumberType> {
  readonly type: T
  readonly #text: string

  constructor(type: T, value: string | bigint, path: string) {
    if (typeof value === 'number') throw new Refusal('javascript-number', path, { type })
    const text = typeof value === 'bigint' ? value.toString() : value
    if (typeof text !== 'string' || !FORM[type].test(text)) throw new Refusal('grammar', path, { type })
    const kind: NumberType = type
    if (kind !== 'decimal' && !within(text, RANGE[kind])) throw new Refusal('range', path, { type })
    this.type = type
    this.#text = text
    Object.freeze(this)
  }

  /** The number as FHIR JSON writes it: '0.10', '-0.0', '1E+2', thirty digits. */
  get text(): string {
    return this.#text
  }

  /**
   * JSON.stringify would write a FHIR number as `{"type":"decimal"}`, an
   * object where the resource has a number. It refuses instead, and says
   * what writes one.
   */
  toJSON(): never {
    throw new TypeError(`a FHIR ${this.type} is written by writeJson, which keeps its digits; JSON.stringify cannot`)
  }

  static is(value: unknown): value is FhirNumber {
    return typeof value === 'object' && value !== null && #text in value
  }
}

export type { FhirNumber }
export type FhirDecimal = FhirNumber<'decimal'>
export type FhirInteger = FhirNumber<'integer'>
export type FhirPositiveInt = FhirNumber<'positiveInt'>
export type FhirUnsignedInt = FhirNumber<'unsignedInt'>

/**
 * Whether `value` is a FHIR number made here. An object with a `type` and
 * a `text` is not one: a Questionnaire item has both.
 */
export const isFhirNumber: (value: unknown) => value is FhirNumber = (value) => FhirNumber.is(value)

/**
 * A FHIR decimal from its text, or from a bigint's digits. `path` is where
 * it will stand, and what a refusal names.
 */
export function decimal(value: string | bigint, path: string): FhirDecimal {
  return new FhirNumber('decimal', value, path)
}

/** A FHIR integer, -2147483648 to 2147483647, from its text or a bigint. */
export function integer(value: string | bigint, path: string): FhirInteger {
  return new FhirNumber('integer', value, path)
}

/** A FHIR positiveInt, 1 to 2147483647, from its text or a bigint. */
export function positiveInt(value: string | bigint, path: string): FhirPositiveInt {
  return new FhirNumber('positiveInt', value, path)
}

/** A FHIR unsignedInt, 0 to 2147483647, from its text or a bigint. */
export function unsignedInt(value: string | bigint, path: string): FhirUnsignedInt {
  return new FhirNumber('unsignedInt', value, path)
}

/** A number's value as its sign, its significant digits without a trailing zero, and the power of ten of the last of them; zero has no digits. */
interface Value {
  readonly negative: boolean
  readonly digits: string
  readonly exponent: bigint
}

/** R4's decimal grammar in parts: the sign, the whole digits, the fraction's and the exponent. */
const PARTS = /^(-?)([0-9]+)(?:\.([0-9]+))?(?:[eE]([+-]?[0-9]+))?$/

/** A FHIR number's text, already of R4's grammar, as its value: read from its digits, never through a double. */
function valueOf(text: string): Value {
  // Every FHIR number's text was checked against R4's grammar when it was
  // made, which these parts are, so it matches.
  const [, sign, whole, fraction = '', power = '0'] = PARTS.exec(text) as RegExpExecArray
  const significant = `${whole as string}${fraction}`.replace(/^0+/, '')
  // The trailing zeros counted from the end, not matched by a pattern,
  // which an unanchored `0+$` would try from every zero of an inner run.
  let end = significant.length
  while (end > 0 && significant[end - 1] === '0') end -= 1
  const digits = significant.slice(0, end)
  const exponent = BigInt(power) - BigInt(fraction.length) + BigInt(significant.length - digits.length)
  return { negative: sign === '-' && digits !== '', digits, exponent }
}

/** -1, 0 or 1 as `a`'s magnitude is less than, equal to or greater than `b`'s. */
function compareMagnitudes(a: Value, b: Value): -1 | 0 | 1 {
  if (a.digits === '' || b.digits === '') return a.digits === b.digits ? 0 : a.digits === '' ? -1 : 1
  // The power of ten just above each one's leading digit decides, unless
  // they share it; then their digits, read from the left, do.
  const above = (value: Value) => value.exponent + BigInt(value.digits.length)
  if (above(a) !== above(b)) return above(a) < above(b) ? -1 : 1
  const width = Math.max(a.digits.length, b.digits.length)
  const [left, right] = [a.digits.padEnd(width, '0'), b.digits.padEnd(width, '0')]
  return left === right ? 0 : left < right ? -1 : 1
}

/**
 * -1, 0 or 1 as `a`'s value is less than, equal to or greater than `b`'s,
 * compared as R4 compares numbers, by value and exactly: 2.5 and 2.50 are
 * equal, -0 and 0 too, and 2^53 + 1 is greater than 2^53, which a double
 * cannot tell. An integer compares with a decimal by its value. For what
 * reads a FHIR number's meaning rather than its digits -- an enableWhen
 * and the answer it compares (0007) -- and never for writing one, which
 * keeps its text.
 */
export function compareNumbers(a: FhirNumber, b: FhirNumber): -1 | 0 | 1 {
  if (!isFhirNumber(a) || !isFhirNumber(b))
    throw new TypeError('compareNumbers compares FHIR numbers made by decimal(), integer(), positiveInt() or unsignedInt()')
  const [left, right] = [valueOf(a.text), valueOf(b.text)]
  if (left.negative !== right.negative) return left.negative ? -1 : 1
  const order = compareMagnitudes(left, right)
  if (!left.negative || order === 0) return order
  return order === 1 ? -1 : 1
}
