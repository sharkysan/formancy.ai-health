/**
 * Why a value was refused, and where: the one error this package throws.
 *
 * A refusal names the path and the rule, and never the value. Any value
 * here may be a person's -- a weight, a birth date, an identifier -- and a
 * refusal ends up in a host's log, where health data must not
 * (CLAUDE.md, "Health data stays out of everything but the output"). So a
 * message is built from the path, the rule's fixed words and, for JSON
 * text, an offset, and from no value a document held. A path is made of
 * the names a document gives and indices: in FHIR JSON every name is an
 * element's, which FHIR defines and a person does not write. Text that is
 * not FHIR JSON may use anything as a name, and a path repeats the names
 * it passed through; nothing here can tell an element's name from another
 * without the element's definition.
 */

/**
 * Each rule, in the words a message uses. Their keys are what a host
 * branches on; the words may change.
 */
const RULES = {
  grammar: 'its text does not have the form R4 gives the type',
  range: 'it is outside the range R4 gives the type',
  calendar: 'it names a day the calendar does not have',
  zone: 'it has a time of day and no time zone, which R4 requires and nothing here guesses',
  'javascript-number':
    'it is a JavaScript number, whose digits may already be lost; a FHIR number is made from its text by decimal(), integer(), positiveInt() or unsignedInt()',
  'not-json': 'it is not a value FHIR JSON carries: a string, a boolean, a number made here, an array, a plain object, or null as an array item',
  'not-data': 'it is not plain data: a getter, a hole, a hidden or symbol-named property, or an object that throws when read',
  empty: 'it is empty, and FHIR JSON never has an empty object, array or string',
  null: 'it is null outside an array, and FHIR JSON has null nowhere else',
  'digit-name':
    'its name is a whole number, which JavaScript orders before every other name, so the order read would not be the order written; no FHIR element has one',
  'duplicate-name': 'its name is given twice in one object, and FHIR JSON names each property once',
  cycle: 'it contains itself',
  syntax: 'not JSON',
  'language-tag':
    'it is not a BCP 47 language tag of the form written here: a language of two or three letters, then a script, a region and variants, each in its canonical case',
  // What an input says and a resource cannot: the packages that map a
  // form, its answers or a document refuse with these, so that a host
  // branches on one class and one set of rules across every package.
  version: 'it is written in a version of its format that nothing here reads',
  invalid: 'the validator of its own format refuses it, so what it says is not known',
  unmapped: 'nothing in the resource says what it says, and nothing here approximates it',
  missing: 'a text the resource needs of it is absent, and nothing here supplies one or falls back to another language',
} as const

/** What was wrong with a value. */
export type Rule = keyof typeof RULES

/** A FHIR R4 primitive type a value is checked against here. */
export type PrimitiveType =
  | 'decimal'
  | 'integer'
  | 'positiveInt'
  | 'unsignedInt'
  | 'date'
  | 'dateTime'
  | 'instant'
  | 'time'
  | 'id'
  | 'code'
  | 'uri'
  | 'uuid'

/** What a refusal knows beside its rule and path. */
export interface RefusalContext {
  /** The FHIR R4 type the value was checked against, for a primitive. */
  readonly type?: PrimitiveType
  /** Where JSON text stopped being JSON, in UTF-16 code units, as JavaScript indexes a string. */
  readonly offset?: number
  /**
   * The language a text was needed in, as its BCP 47 tag. A tag names a
   * language and never a person, so a message may say it.
   */
  readonly language?: string
}

export class Refusal extends Error {
  readonly rule: Rule
  /**
   * Where the value was: for a primitive, the path its caller named; for
   * FHIR JSON, from `$`, the value handed over, as `$.component[0].valueQuantity.value`.
   */
  readonly path: string
  readonly type: PrimitiveType | undefined
  readonly offset: number | undefined
  readonly language: string | undefined

  constructor(rule: Rule, path: string, context: RefusalContext = {}) {
    const what = context.type === undefined ? '' : `not a FHIR R4 ${context.type}: `
    const where = context.offset === undefined ? '' : ` at offset ${String(context.offset)}`
    const language = context.language === undefined ? '' : `, in ${context.language}`
    super(`${path}: ${what}${RULES[rule]}${where}${language}`)
    this.name = 'Refusal'
    this.rule = rule
    this.path = path
    this.type = context.type
    this.offset = context.offset
    this.language = context.language
  }
}
