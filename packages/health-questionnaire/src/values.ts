/**
 * A formancy value as the FHIR value of an item's type: a bound of a
 * field, the literal a condition compares an answer with, or an answer.
 * Decided once, here, for all three (0006, 0007).
 *
 * - **A number** in a formancy form is a JavaScript number: `min`, `max`
 *   and `step` are typed `number` by `@formancy/spec` 0.5.0, and an answer
 *   is a JSON number. So a bound or an answer reaches this package as a
 *   double, and its text is the shortest that reads back as that double,
 *   which is the value formancy holds and compares: `0.10` in the form's
 *   JSON, or typed by a person, is 0.1 by the time anything here sees it,
 *   and nothing can tell. -0 is `-0`, since `0` reads back as another
 *   double. A whole number is written from its BigInt, exactly, and held to
 *   R4's 32-bit range, never wrapped. A literal in a rule is text, and
 *   keeps its digits, where they are digits a double keeps: CEL compares
 *   an answer with the double nearest the literal, and R4 with the
 *   literal's digits, which say the same only up to fifteen significant
 *   digits, in a double's normal range.
 * - **A date** is `YYYY-MM-DD` and a **date and time** is
 *   `YYYY-MM-DDTHH:MM:SSZ`, always in UTC (`TEMPORAL_SHAPES`), which R4's
 *   date and dateTime take as they are. A formancy datetime always has
 *   its zone, so the refusal of a dateTime without one never fires on a
 *   form's value.
 * - **A time** is `HH:MM`, with no seconds and no zone, and R4's time is
 *   `hh:mm:ss`. A formancy time names a minute, so `09:30` is `09:30:00`
 *   exactly: the seconds are written, and nothing is rounded.
 *
 * Each is checked by health-core's primitive, so a value that is not one
 * is refused at the path it was given.
 */
import { TEMPORAL_SHAPES } from '@formancy/spec'
import { Refusal, date, dateTime, decimal, integer, time, type FhirDate, type FhirDateTime, type FhirDecimal, type FhirInteger, type FhirTime } from '@formancy/health-core'

/**
 * A formancy number, a bound or an answer, as a FHIR decimal: the
 * shortest text that reads back as its double, which ECMAScript's number
 * to string is for every double but -0, which it writes `0`. NaN and the
 * infinities have no such text, and are refused as not a decimal.
 */
export function decimalOf(value: number, path: string): FhirDecimal {
  return decimal(Object.is(value, -0) ? '-0' : String(value), path)
}

/**
 * A formancy number, a bound or an answer, as a FHIR integer: from its
 * BigInt when it is whole, which is exact for every whole double, so a
 * value past 32 bits is refused as outside R4's range; a fraction --
 * 2.0000001, which formancy's step of one admits within its tolerance --
 * is refused as not an integer, never rounded.
 */
export function integerOf(value: number, path: string): FhirInteger {
  return integer(Number.isInteger(value) ? BigInt(value) : String(value), path)
}

/**
 * A rule's decimal literal, as the text it is written as, when every
 * double compares with it in CEL as its digits compare in R4. CEL reads
 * `0.30000000000000001` as the double nearest it, 0.3, so formancy shows a
 * field `weight == 0.30000000000000001` enables for an answer of 0.3, where
 * R4, comparing digits, would not. A decimal of at most fifteen
 * significant digits is the shortest text of the double nearest it --
 * fifteen is as many as every double keeps, IEEE 754's binary64 -- and an
 * answer is written as its double's shortest text, so the two then agree,
 * for an ordering too. Past the 307th place after the point a double is
 * subnormal and keeps fewer. A literal beyond either is refused, at the
 * rule: the cel tokenizer has already refused an exponent.
 */
export function decimalLiteralOf(text: string, path: string): FhirDecimal {
  const [whole = '', fraction = ''] = text.replace(/^-/, '').split('.')
  const significant = `${whole}${fraction}`.replace(/^0+/, '')
  const leading = whole.replace(/^0+/, '') === '' ? fraction.length - fraction.replace(/^0+/, '').length : 0
  if (significant.length > 15 || leading >= 307) throw new Refusal('unmapped', path)
  return decimal(text, path)
}

const DATE = new RegExp(TEMPORAL_SHAPES.date)
const TIME = new RegExp(TEMPORAL_SHAPES.time)
const DATETIME = new RegExp(TEMPORAL_SHAPES.datetime)

/**
 * A formancy date as a FHIR date. Held to formancy's shape first: a string
 * compares with a date's answer as a date only in that shape, so a rule
 * comparing with another means something else in formancy than here, and
 * is refused as not of the form its type has.
 */
export function dateOf(value: string, path: string): FhirDate {
  if (!DATE.test(value)) throw new Refusal('grammar', path, { type: 'date' })
  return date(value, path)
}

/** A formancy time, `HH:MM`, as the FHIR time of that minute, `HH:MM:00`. */
export function timeOf(value: string, path: string): FhirTime {
  if (!TIME.test(value)) throw new Refusal('grammar', path, { type: 'time' })
  return time(`${value}:00`, path)
}

/** A formancy date and time, in UTC, as a FHIR dateTime. */
export function dateTimeOf(value: string, path: string): FhirDateTime {
  if (!DATETIME.test(value)) throw new Refusal('grammar', path, { type: 'dateTime' })
  return dateTime(value, path)
}
