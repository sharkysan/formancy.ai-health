/**
 * Whether an item is enabled, given the answers written before it: the
 * Questionnaire's own enableWhen, read as the HL7 validator reads it, so
 * that the response never answers an item the validator would call
 * disabled, nor leaves out one it would call enabled.
 *
 * The validator's reading, measured with 7.0.2 on responses on 17 October
 * 2026 (0007): `exists` asks whether there is an answer; every other
 * operator asks whether some answer meets it, so with no answer it is
 * false -- `!=` included, which R5 words "no answer is equal" and which the
 * mapping therefore always writes beside its unanswered case
 * (conditions.ts). Numbers compare by value (`= 2.50` holds for 2.5),
 * which health-core's `compareNumbers` does exactly; a date, a time and a
 * date and time are written here in formancy's fixed width on both sides,
 * in which text orders as the calendar and the clock do; a coding is its
 * system and its code.
 *
 * The conditions read only answers at the top of the submission written
 * before the item (conditions.ts holds a question to that), and a disabled
 * question has none written, so R4's rule that a disabled question counts
 * as unanswered holds by the order the items are walked in.
 */
import { compareNumbers } from '@formancy/health-core'
import type { EnableWhen, QuestionnaireItem } from './resource.js'
import type { QuestionnaireResponseAnswer } from './response-resource.js'

/** The answers written so far, by the linkId of the question they answer. */
export type Written = ReadonlyMap<string, readonly QuestionnaireResponseAnswer[]>

/** What a comparison makes of an order: less than, equal to, greater than the condition's value. */
const OPERATORS: Readonly<Record<string, (order: number) => boolean>> = {
  '=': (order) => order === 0,
  '!=': (order) => order !== 0,
  '<': (order) => order < 0,
  '<=': (order) => order <= 0,
  '>': (order) => order > 0,
  '>=': (order) => order >= 0,
}

/** -1, 0 or 1 as text `a` orders before, with or after `b`; for equality alone, 0 or 1. */
const orderOfText = (a: string, b: string) => (a === b ? 0 : a < b ? -1 : 1)

/** How `answer` orders against the value of `condition`, or a throw where their types differ: a bug in the mapping, which writes both of one type. */
function orderOf(answer: QuestionnaireResponseAnswer, condition: EnableWhen): number {
  const expected = condition.answerDecimal ?? condition.answerInteger
  const given = answer.valueDecimal ?? answer.valueInteger
  if (expected !== undefined && given !== undefined) return compareNumbers(given, expected)
  if (condition.answerCoding !== undefined && answer.valueCoding !== undefined) {
    return answer.valueCoding.system === condition.answerCoding.system && answer.valueCoding.code === condition.answerCoding.code ? 0 : 1
  }
  if (condition.answerBoolean !== undefined && answer.valueBoolean !== undefined) return answer.valueBoolean === condition.answerBoolean ? 0 : 1
  const pairs: readonly [string | undefined, string | undefined][] = [
    [answer.valueString, condition.answerString],
    [answer.valueDate, condition.answerDate],
    [answer.valueTime, condition.answerTime],
    [answer.valueDateTime, condition.answerDateTime],
  ]
  for (const [given, expected] of pairs) if (given !== undefined && expected !== undefined) return orderOfText(given, expected)
  throw new Error(`an enableWhen on ${condition.question} and its answer have different types`)
}

/** Whether one condition holds for its question's `answers`. */
function holds(condition: EnableWhen, answers: readonly QuestionnaireResponseAnswer[]): boolean {
  if (condition.operator === 'exists') return (answers.length > 0) === condition.answerBoolean
  const meets = OPERATORS[condition.operator]
  if (meets === undefined) throw new Error(`no enableWhen operator ${condition.operator} is written here`)
  return answers.some((answer) => meets(orderOf(answer, condition)))
}

/** Whether `item` is enabled by the answers `written` before it. */
export function isEnabled(item: QuestionnaireItem, written: Written): boolean {
  if (item.enableWhen === undefined) return true
  const results = item.enableWhen.map((condition) => holds(condition, written.get(condition.question) ?? []))
  return item.enableBehavior === 'all' ? results.every(Boolean) : results.some(Boolean)
}
