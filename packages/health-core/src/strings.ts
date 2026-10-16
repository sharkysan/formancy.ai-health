/**
 * FHIR R4's primitives that JSON writes as a string, checked against their
 * type: date, dateTime, instant and time; id, code, uri and uuid.
 *
 * Each is a string a host can print, compare and store as it is, branded
 * with the check it passed, so that a bare string, or a date where a
 * dateTime is expected, does not compile. Checked once, when made; no
 * function here converts, normalises or completes a value. A time zone,
 * the case of a UUID, a missing day: each is the host's to supply, and a
 * value that lacks one is refused, never guessed.
 *
 * R4 says its regexes "are informative, not normative" and "may allow a
 * broader set of values than are actually valid (e.g. leap years)"
 * (https://hl7.org/fhir/R4/datatypes.html, read on 17 October 2026). So
 * each type is its regex, anchored, where the regex says what the type's
 * words say; the words, where they say more; and the calendar, which R4
 * asks for in "Dates SHALL be valid dates".
 */
import { Refusal, type PrimitiveType } from './refusal.js'

/** The FHIR R4 types written as a JSON string and checked here. */
export type StringType = Extract<PrimitiveType, 'date' | 'dateTime' | 'instant' | 'time' | 'id' | 'code' | 'uri' | 'uuid'>

declare const checked: unique symbol

/** A string that passed the check of FHIR R4 type `T`, and is still a string. */
type Checked<T extends StringType> = string & { readonly [checked]: T }

export type FhirDate = Checked<'date'>
export type FhirDateTime = Checked<'dateTime'>
export type FhirInstant = Checked<'instant'>
export type FhirTime = Checked<'time'>
export type FhirId = Checked<'id'>
export type FhirCode = Checked<'code'>
export type FhirUri = Checked<'uri'>
export type FhirUuid = Checked<'uuid'>

/** R4's time zone: Z, or an offset from -13:59 to +14:00. */
const ZONE = String.raw`(Z|(\+|-)((0[0-9]|1[0-3]):[0-5][0-9]|14:00))`

/**
 * Each type's form. The four dates and times are R4's regexes as
 * datatypes.html prints them, character for character. For the others:
 *
 * - **code** is R4's words, "no leading or trailing whitespace, and ... no
 *   whitespace other than single spaces in the contents". R4's regex,
 *   `[^\s]+(\s[^\s]+)*`, admits a tab between words, which the words do not.
 * - **uri** is R4's regex, `\S*`, which R4 calls "very permissive", with
 *   `+` for `*`: FHIR JSON never carries an empty string. Nothing more of
 *   RFC 3986 is checked.
 * - **uuid** has no regex in R4: "A UUID (aka GUID) represented as a URI",
 *   and "UUIDs in URIs SHALL also be represented in lowercase". Uppercase is
 *   refused, not lowercased.
 *
 * JavaScript's `\s` is Unicode's whitespace, a no-break space included.
 */
const R4: Readonly<Record<StringType, string>> = {
  date: String.raw`([0-9]([0-9]([0-9][1-9]|[1-9]0)|[1-9]00)|[1-9]000)(-(0[1-9]|1[0-2])(-(0[1-9]|[1-2][0-9]|3[0-1]))?)?`,
  dateTime: String.raw`([0-9]([0-9]([0-9][1-9]|[1-9]0)|[1-9]00)|[1-9]000)(-(0[1-9]|1[0-2])(-(0[1-9]|[1-2][0-9]|3[0-1])(T([01][0-9]|2[0-3]):[0-5][0-9]:([0-5][0-9]|60)(\.[0-9]+)?(Z|(\+|-)((0[0-9]|1[0-3]):[0-5][0-9]|14:00)))?)?)?`,
  instant: String.raw`([0-9]([0-9]([0-9][1-9]|[1-9]0)|[1-9]00)|[1-9]000)-(0[1-9]|1[0-2])-(0[1-9]|[1-2][0-9]|3[0-1])T([01][0-9]|2[0-3]):[0-5][0-9]:([0-5][0-9]|60)(\.[0-9]+)?(Z|(\+|-)((0[0-9]|1[0-3]):[0-5][0-9]|14:00))`,
  time: String.raw`([01][0-9]|2[0-3]):[0-5][0-9]:([0-5][0-9]|60)(\.[0-9]+)?`,
  id: String.raw`[A-Za-z0-9\-\.]{1,64}`,
  code: String.raw`[^\s]+( [^\s]+)*`,
  uri: String.raw`\S+`,
  uuid: String.raw`urn:uuid:[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}`,
}

/** R4 says to anchor its regexes; an alternation must be grouped first. */
const anchored = (source: string) => new RegExp(`^(?:${source})$`)

const FORM = Object.fromEntries(Object.entries(R4).map(([type, source]) => [type, anchored(source)])) as Readonly<Record<StringType, RegExp>>

/**
 * A dateTime's and an instant's form without the zone. A text that has
 * this form and not R4's lacks its zone and nothing else, and is refused
 * for that, by name: the plan's regression case is a date and time
 * without a zone refused, not guessed.
 */
const ZONELESS: Readonly<Partial<Record<StringType, RegExp>>> = {
  dateTime: anchored(R4.dateTime.replace(ZONE, '')),
  instant: anchored(R4.instant.replace(ZONE, '')),
}

/** Months of 31 days; February is decided by its year. */
const LONG_MONTHS = new Set(['01', '03', '05', '07', '08', '10', '12'])

/**
 * Whether a text R4's form admits names a real day. The form fixes where
 * each field stands: YYYY-MM-DD, then whatever follows. A year, or a year
 * and a month, has no day to check. Days compare as two-digit text, which
 * orders as the numbers do; the year is a BigInt, never a double.
 */
function onTheCalendar(text: string): boolean {
  if (text.length < 10) return true
  const month = text.slice(5, 7)
  const day = text.slice(8, 10)
  if (month !== '02') return day <= (LONG_MONTHS.has(month) ? '31' : '30')
  const year = BigInt(text.slice(0, 4))
  const leap = year % 4n === 0n && (year % 100n !== 0n || year % 400n === 0n)
  return day <= (leap ? '29' : '28')
}

const HAS_A_DAY: ReadonlySet<StringType> = new Set(['date', 'dateTime', 'instant'])

function check<T extends StringType>(type: T, value: string, path: string): Checked<T> {
  // Asked of text only: a regex converts anything else to a string first,
  // through code the value brings, a Date's toString or worse.
  if (typeof value !== 'string') throw new Refusal('grammar', path, { type })
  if (!FORM[type].test(value)) throw new Refusal(ZONELESS[type]?.test(value) === true ? 'zone' : 'grammar', path, { type })
  if (HAS_A_DAY.has(type) && !onTheCalendar(value)) throw new Refusal('calendar', path, { type })
  return value as Checked<T>
}

/** A FHIR date: YYYY, YYYY-MM or YYYY-MM-DD, a real day, no time and no zone. `path` is what a refusal names. */
export function date(value: string, path: string): FhirDate {
  return check('date', value, path)
}

/** A FHIR dateTime: a date, or a date and a time to the second with its zone. */
export function dateTime(value: string, path: string): FhirDateTime {
  return check('dateTime', value, path)
}

/** A FHIR instant: a date and a time to the second, with its zone. */
export function instant(value: string, path: string): FhirInstant {
  return check('instant', value, path)
}

/** A FHIR time of day, hh:mm:ss, without a zone. */
export function time(value: string, path: string): FhirTime {
  return check('time', value, path)
}

/** A FHIR id, a Resource.id among them: letters, digits, '-' and '.', 1 to 64 of them. */
export function id(value: string, path: string): FhirId {
  return check('id', value, path)
}

/** A FHIR code: words separated by single spaces. Whether it is in a value set is not checked here. */
export function code(value: string, path: string): FhirCode {
  return check('code', value, path)
}

/** A FHIR uri: any text without whitespace. Never fetched: a uri is an identifier, not an address. */
export function uri(value: string, path: string): FhirUri {
  return check('uri', value, path)
}

/** A FHIR uuid: `urn:uuid:` and a lowercase UUID, as a Bundle entry's fullUrl is written. */
export function uuid(value: string, path: string): FhirUuid {
  return check('uuid', value, path)
}
