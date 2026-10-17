/**
 * One field's value in a formancy submission as the answers of its item
 * (0007): of the item's type, as the Questionnaire states it, or refused.
 *
 * What formancy holds, read on `@formancy/core` 0.5.0 on 17 October 2026.
 * `@formancy/spec` 0.5.0 types no submission: an answer is whatever the
 * engine's value holds at the field's data path. The engine checks less
 * than the types its own expression checker assumes (text a string,
 * number a double, checkbox a bool, hidden a string): a number field
 * without a bound or a step validates `'abc'`, a text field `42`, a
 * checkbox `'yes'`, a hidden field `7`, a static text any value, a date
 * `2026-02-30`, and a step of one `2.0000001` and `3e9`. Each of those is
 * refused here, where the Questionnaire's item could not hold it:
 *
 * - `answer-type`, a value of another type than the item's, or a value on
 *   an item that takes none (a display item);
 * - a primitive's rule, from health-core: `grammar` for a date, a time or
 *   a date and time not in formancy's shape and for a fraction on an
 *   integer item, `calendar` for a day the calendar lacks, `range` for a
 *   whole number past R4's 32 bits;
 * - `option`, a choice's value no option has, or a tick given twice;
 * - `bound`, past a bound the item states: `min`, `max`, `earliest`,
 *   `latest`, `minLength`, `maxLength`, `minItems`, `maxItems`, compared
 *   as formancy compares them -- the same doubles and fixed-width texts,
 *   and a text's length in UTF-16 units, as both formancy and the
 *   validator count it.
 *
 * "No answer" is formancy's own (`unanswered` in `@formancy/core` 0.5.0):
 * absent, null, a text of nothing but whitespace, an empty list. R4 has no
 * null answer and no empty list, so each is an item with no answer. A
 * checkbox left false is answered false, as it is formancy's value.
 */
import { item as indexed, Refusal, type Refusals } from '@formancy/health-core'
import type { FieldDef } from '@formancy/spec'
import type { ItemType } from './item-types.js'
import type { QuestionnaireItem } from './resource.js'
import type { QuestionnaireResponseAnswer, ResponseCoding } from './response-resource.js'
import { dateOf, dateTimeOf, decimalOf, integerOf, timeOf } from './values.js'

/** Whether formancy holds no answer in `value`, as `@formancy/core` 0.5.0's `unanswered` reads one -- but a checkbox's false, which is an answer. */
export function unanswered(value: unknown): boolean {
  if (value === undefined || value === null) return true
  if (typeof value === 'string') return value.trim() === ''
  return Array.isArray(value) && value.length === 0
}

/** Refused as a bound unless `value` is within `lowest` and `highest`, either of which may be absent. */
function within<T extends number | string>(value: T, lowest: T | undefined, highest: T | undefined, path: string): void {
  if ((lowest !== undefined && value < lowest) || (highest !== undefined && value > highest)) throw new Refusal('bound', path)
}

/** A value of `type`, or refused as of another. */
function typed<T>(value: unknown, type: 'string' | 'number' | 'boolean', path: string): T {
  if (typeof value !== type) throw new Refusal('answer-type', path)
  return value as T
}

type Write = (field: FieldDef, value: unknown, path: string) => QuestionnaireResponseAnswer

const text: Write = (field, value, path) => {
  const written = typed<string>(value, 'string', path)
  within(written.length, field.minLength, field.maxLength, path)
  return { valueString: written }
}

/** The one-answer item types, each from its formancy value. */
const SCALARS: Partial<Record<ItemType, Write>> = {
  string: text,
  text,
  boolean: (_, value, path) => ({ valueBoolean: typed<boolean>(value, 'boolean', path) }),
  integer: (field, value, path) => {
    const answer = integerOf(typed<number>(value, 'number', path), path)
    within(value as number, field.min, field.max, path)
    return { valueInteger: answer }
  },
  decimal: (field, value, path) => {
    const answer = decimalOf(typed<number>(value, 'number', path), path)
    within(value as number, field.min, field.max, path)
    return { valueDecimal: answer }
  },
  date: (field, value, path) => {
    const answer = dateOf(typed<string>(value, 'string', path), path)
    within(value as string, field.earliest, field.latest, path)
    return { valueDate: answer }
  },
  time: (field, value, path) => {
    const answer = timeOf(typed<string>(value, 'string', path), path)
    within(value as string, field.earliest, field.latest, path)
    return { valueTime: answer }
  },
  dateTime: (field, value, path) => {
    const answer = dateTimeOf(typed<string>(value, 'string', path), path)
    within(value as string, field.earliest, field.latest, path)
    return { valueDateTime: answer }
  },
}

/** The coding of the option `value` names, as the Questionnaire's own answerOption has it; refused where none has it. */
function codingOf(item: QuestionnaireItem, value: unknown, path: string): ResponseCoding {
  const chosen = typed<string>(value, 'string', path)
  const offered = item.answerOption?.find((option) => option.valueCoding.code === chosen)?.valueCoding
  if (offered === undefined) throw new Refusal('option', path)
  // The display without its translations: the Questionnaire's option
  // carries those, and a response is not the place for a second copy.
  const { _display: _, ...coding } = offered
  return coding
}

/** Checkboxes' ticks as an answer each, in formancy's order; every one refused at once where it is wrong, and the count held to the field's bounds. */
function ticksOf(field: FieldDef, item: QuestionnaireItem, value: unknown, path: string, refusals: Refusals): QuestionnaireResponseAnswer[] | undefined {
  if (!Array.isArray(value)) return refusals.add('answer-type', path)
  const before = refusals.count
  const seen = new Set<unknown>()
  const answers: QuestionnaireResponseAnswer[] = []
  for (const [index, tick] of value.entries()) {
    const at = indexed(path, index)
    const coding = refusals.take(() => {
      if (seen.has(tick)) throw new Refusal('option', at)
      return codingOf(item, tick, at)
    })
    seen.add(tick)
    if (coding !== undefined) answers.push({ valueCoding: coding })
  }
  if (refusals.count > before) return undefined
  refusals.take(() => within(answers.length, field.minItems, field.maxItems, path))
  return refusals.count > before ? undefined : answers
}

/**
 * The answers `value` gives the question `item` that `field` became, at
 * `path`: none when formancy holds no answer, one, or a tick each; or
 * undefined, with what is wrong in `refusals`.
 */
export function answersOf(field: FieldDef, item: QuestionnaireItem, value: unknown, path: string, refusals: Refusals): QuestionnaireResponseAnswer[] | undefined {
  if (unanswered(value)) return []
  if (item.type === 'choice' && item.repeats === true) return ticksOf(field, item, value, path, refusals)
  const write: Write | undefined = item.type === 'choice' ? (_, chosen, at) => ({ valueCoding: codingOf(item, chosen, at) }) : SCALARS[item.type as ItemType]
  // A display item takes no answer, and a static text holds none in
  // formancy; one handed over is refused rather than dropped.
  if (write === undefined) return refusals.add('answer-type', path)
  const answer = refusals.take(() => write(field, value, path))
  return answer === undefined ? undefined : [answer]
}
