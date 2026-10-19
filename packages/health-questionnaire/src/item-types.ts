/**
 * Which Questionnaire item type each formancy field type becomes, decided
 * here and nowhere else (CLAUDE.md, "One decision, one place"): the items
 * read it, and so do the conditions, which write an answer of the type its
 * question has.
 *
 * Read against `@formancy/spec` 0.5.0's field types, which 0.6.0's are,
 * and R4's
 * QuestionnaireItemType (https://hl7.org/fhir/R4/valueset-item-type.html,
 * read on 17 October 2026). A type with no item that says what it
 * collects is `undefined`, and refused.
 */
import { LIST_VALUED_FIELD_TYPES, type FieldDef, type FieldType } from '@formancy/spec'

/** The R4 item types this package writes. */
export type ItemType = 'group' | 'display' | 'boolean' | 'decimal' | 'integer' | 'date' | 'dateTime' | 'time' | 'string' | 'text' | 'choice'

/**
 * Every formancy field type, and its item; `number` is decided by its
 * step (`numberType`). Refused in version 1, and why:
 *
 * - `file`: an attachment item waits for bounds on its size and media
 *   type, measured first (plan 8.1);
 * - `signature`: a drawn mark is not a signature; the document's attester
 *   and the host's signature are;
 * - `ranking` and `matrix`: no SDC item carries an order or one question
 *   asked of several rows without loss;
 * - `richtext`: a formatted answer has no item that keeps its markup and
 *   its meaning both.
 */
const ITEM_TYPES: Readonly<Record<FieldType, ItemType | 'number' | undefined>> = {
  text: 'string',
  textarea: 'text',
  number: 'number',
  checkbox: 'boolean',
  select: 'choice',
  radio: 'choice',
  selectboxes: 'choice',
  ranking: undefined,
  matrix: undefined,
  date: 'date',
  time: 'time',
  datetime: 'dateTime',
  file: undefined,
  richtext: undefined,
  signature: undefined,
  // A hidden value travels with the submission as text: a campaign code,
  // a referral source. The item says it is hidden.
  hidden: 'string',
  static: 'display',
  group: 'group',
  page: 'group',
  repeater: 'group',
}

/**
 * A number field's item: `integer` when every answer its step admits is a
 * whole number -- a step of one, counted from a whole minimum or from
 * zero -- and `decimal` when it has no step. Any other step admits values
 * no SDC element can state (a step of five from two: 2, 7, 12), and is
 * refused: `undefined`.
 *
 * formancy compares a step with a tolerance of a millionth of it, so it
 * accepts 2.0000001 on a step of one; an integer item does not, and an
 * answer like that is refused when the answers are exported, not
 * rounded.
 */
export function numberType(field: FieldDef): 'decimal' | 'integer' | undefined {
  if (field.step === undefined) return 'decimal'
  if (field.step === 1 && (field.min === undefined || Number.isInteger(field.min))) return 'integer'
  return undefined
}

/** The item type of `field`, or undefined when version 1 refuses it. */
export function itemTypeOf(field: FieldDef): ItemType | undefined {
  const type = ITEM_TYPES[field.type]
  return type === 'number' ? numberType(field) : type
}

const LISTS: ReadonlySet<FieldType> = new Set(LIST_VALUED_FIELD_TYPES)

/**
 * Whether a field's answer is a list in formancy, and so its item repeats
 * and a rule reads it with `in`: formancy's own list
 * (`LIST_VALUED_FIELD_TYPES`), so that the items and the conditions cannot
 * disagree with each other or with formancy about which those are.
 */
export function repeats(field: FieldDef): boolean {
  return LISTS.has(field.type)
}
