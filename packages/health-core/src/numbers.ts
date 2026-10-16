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
    if (type !== 'decimal' && !within(text, RANGE[type as Exclude<NumberType, 'decimal'>])) throw new Refusal('range', path, { type })
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
export const isFhirNumber: (value: unknown) => value is FhirNumber = FhirNumber.is

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
