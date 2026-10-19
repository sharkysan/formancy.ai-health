/**
 * A visibility rule as `enableWhen`, where the two say the same thing in
 * every state of the form, and nowhere else.
 *
 * What formancy's engine does, measured on `@formancy/core` 0.5.0 with
 * `@marcbachmann/cel-js` 8.0.0 on 17 October 2026, and on 0.6.0, with the
 * same cel-js, on 19 October: an unanswered field is
 * null; `x == 'a'` is then false, as R4's `=` is with no answer, and
 * `x != 'a'` true. R4's own words for `!=` are garbled; R5's are "no
 * answer is equal", which is true with no answer too; but the HL7
 * validator reads it as an answer that differs, and with no answer
 * disables the item and refuses what a person typed into it (measured with
 * 7.0.2 on a response, 0007). An ordering, `x >= 18`, is an error on null,
 * and a visibility rule that errors **shows** its field -- formancy fails
 * open there, so as not to hide what somebody typed -- where R4's `>=`
 * with no answer is false and hides it. So a `!=` and an ordering are each
 * written with their unanswered case: `x >= 18`, or `x` has no answer
 * (`exists` false), any of them; every reading then agrees with
 * formancy's. Under any, that case is one more condition; under all,
 * "this, and that or unanswered" is a nesting enableWhen has not, and the
 * rule is refused. A `!=` on a repeating question is "some answer
 * differs" to the validator and "none is equal" to R5, which disagree on
 * two ticks, so a list not holding a value is refused. A field inside a
 * group is read through a map that may lack it, which is an error too,
 * and is not read here.
 *
 * A skip rule walks past a page while it holds; the page is enabled while
 * it does not, so its comparisons are negated, `&&` becomes any and `||`
 * all; a skip rule that errors does not skip, so an ordering keeps its
 * unanswered case there too, and so does a negated equality.
 *
 * An answer is of its question's item type: a coding of the option's
 * system for a choice, and a literal checked by the same primitives as a
 * bound (values.ts). A question is a field at the top of the submission
 * that nothing hides while its value stays behind: on a page a skip rule
 * walks past, formancy keeps the value and still reads it, where R4 reads
 * a disabled question as unanswered. And a question comes before the
 * item it enables, as the validator asks of enableWhen ("The target of
 * this enableWhen rule ... comes after the question itself", a warning
 * with no message id the gate could register): a renderer that walks the
 * items in order has not reached an answer that comes after. formancy's
 * rules have no order, so such a rule is refused, and the form's author
 * moves the field.
 */
import { code, integer, type FhirCode, type Refusals } from '@formancy/health-core'
import { unanswered } from './answers.js'
import type { Comparison, Condition, Literal, Operator } from './cel.js'
import { itemTypeOf, repeats, type ItemType } from './item-types.js'
import { optionCoding } from './options.js'
import { isTopLevel, type Place, type Places } from './places.js'
import type { EnableWhen } from './resource.js'
import { dateOf, dateTimeOf, decimalLiteralOf, timeOf } from './values.js'

/** What enables an item: its conditions, and how they join when there are several. */
export interface Enabling {
  readonly enableWhen: readonly EnableWhen[]
  readonly enableBehavior: FhirCode | undefined
}

/** What a condition needs of the rest of the form. */
export interface ConditionScope {
  readonly places: Places
  /** The Questionnaire's url, under which an option's system is named. */
  readonly url: string
  /** The keys of the pages a skip rule walks past. */
  readonly skipped: ReadonlySet<string>
  readonly refusals: Refusals
}

const NEGATED: Readonly<Record<Operator | 'in', Operator | 'not in'>> = {
  '==': '!=',
  '!=': '==',
  '<': '>=',
  '<=': '>',
  '>': '<=',
  '>=': '<',
  in: 'not in',
}

/** R4's operator for each; a list holding a value is `=`, and one not holding it `!=`. */
const R4_OPERATOR: Readonly<Record<Operator | 'in' | 'not in', string>> = {
  '==': '=',
  '!=': '!=',
  '<': '<',
  '<=': '<=',
  '>': '>',
  '>=': '>=',
  in: '=',
  'not in': '!=',
}

const EQUALITY: ReadonlySet<string> = new Set(['==', '!='])
const ORDERED: ReadonlySet<ItemType> = new Set(['decimal', 'integer', 'date', 'time', 'dateTime'])

/** The answer a comparison of a question of `type` with `literal` compares, as its enableWhen property. */
function answerOf(type: ItemType, place: Place, literal: Literal, scope: ConditionScope, path: string): Partial<EnableWhen> | undefined {
  if (literal.kind === 'boolean') return type === 'boolean' ? { answerBoolean: literal.value } : undefined
  // FHIR JSON has no empty string, and an empty option value is none. A
  // text of nothing but whitespace is no answer to formancy's
  // `unanswered`, and so in no response (answers.ts): `x == '  '` shows
  // its field in formancy for an answer R4's `=` would never see.
  if (unanswered(literal.text)) return undefined
  const write = (literal.kind === 'number' ? NUMBER_ANSWERS : TEXT_ANSWERS)[type]
  if (write !== undefined) return write(literal.text, path)
  if (type !== 'choice' || literal.kind !== 'string') return undefined
  const offered = (place.field.options ?? []).some((option) => option.value === literal.text)
  return offered ? { answerCoding: optionCoding(scope.url, place.field.key, literal.text, path) } : undefined
}

type Answer = (text: string, path: string) => Partial<EnableWhen>

/** A number literal's answer, for the questions that take one. */
const NUMBER_ANSWERS: Partial<Record<ItemType, Answer>> = {
  decimal: (text, path) => ({ answerDecimal: decimalLiteralOf(text, path) }),
  integer: (text, path) => ({ answerInteger: integer(text, path) }),
}

/** A text literal's answer, for the questions that take one; a choice's is its option's coding. */
const TEXT_ANSWERS: Partial<Record<ItemType, Answer>> = {
  string: (text) => ({ answerString: text }),
  text: (text) => ({ answerString: text }),
  date: (text, path) => ({ answerDate: dateOf(text, path) }),
  time: (text, path) => ({ answerTime: timeOf(text, path) }),
  dateTime: (text, path) => ({ answerDateTime: dateTimeOf(text, path) }),
}

/** The question a comparison reads, or undefined when its answer is not read the same in both. */
function questionOf(key: string, target: Place, scope: ConditionScope): { place: Place; type: ItemType } | undefined {
  const place = scope.places.byDataPath.get(key)
  if (place === undefined || place.order >= target.order || !isTopLevel(place)) return undefined
  if (place.page !== undefined && scope.skipped.has(place.page)) return undefined
  const type = itemTypeOf(place.field)
  if (type === undefined || type === 'group' || type === 'display') return undefined
  return { place, type }
}

/** One comparison, as written or negated, as its enableWhen; undefined when it says something enableWhen does not. */
function enableWhenOf(comparison: Comparison, negate: boolean, target: Place, scope: ConditionScope, path: string): EnableWhen | undefined {
  const question = questionOf(comparison.key, target, scope)
  if (question === undefined) return undefined
  if (repeats(question.place.field) !== (comparison.operator === 'in')) return undefined
  if (comparison.operator !== 'in' && !EQUALITY.has(comparison.operator) && !ORDERED.has(question.type)) return undefined
  const answer = answerOf(question.type, question.place, comparison.literal, scope, path)
  if (answer === undefined) return undefined
  const operator = negate ? NEGATED[comparison.operator] : comparison.operator
  // A list not holding a value is no R4 operator: `!=` on a repeating
  // question is "some answer differs" to the validator.
  if (operator === 'not in') return undefined
  return { question: question.place.field.key, operator: code(R4_OPERATOR[operator], path), ...answer }
}

/**
 * `condition`, read for `target`, as what enables it -- negated for a
 * skip rule -- or undefined, with the rule refused at `path`, when it is
 * not one enableWhen says exactly.
 */
export function enablingOf(condition: Condition, negate: boolean, target: Place, scope: ConditionScope, path: string): Enabling | undefined {
  const refuse = () => scope.refusals.add('unmapped', path)
  const ordering = condition.comparisons.some((comparison) => comparison.operator !== 'in' && !EQUALITY.has(comparison.operator))
  // An ordering errors on an unanswered field, and an error inside && or
  // || is absorbed or not by what the other side says: only alone does it
  // mean one thing.
  if (ordering && condition.comparisons.length > 1) return refuse()
  const enableWhen: EnableWhen[] = []
  for (const comparison of condition.comparisons) {
    // A literal a primitive refuses -- 3000000000 for an integer question
    // -- is refused as that, and once.
    const before = scope.refusals.count
    const written = scope.refusals.take(() => enableWhenOf(comparison, negate, target, scope, path))
    if (written === undefined) return scope.refusals.count > before ? undefined : refuse()
    enableWhen.push(written)
  }
  // Every operator but `=` holds in formancy for an unanswered question
  // and not in R4: a `!=` because null differs, an ordering because its
  // error shows the field. Each needs its question's unanswered case
  // beside it, once per question, which only an any can hold.
  const all = enableWhen.length > 1 && (condition.join === '&&') !== negate
  const open = [...new Set(enableWhen.filter((written) => written.operator !== '=').map((written) => written.question))]
  if (open.length > 0 && all) return refuse()
  const unanswered = open.map((question): EnableWhen => ({ question, operator: code('exists', path), answerBoolean: false }))
  const conditions = [...enableWhen, ...unanswered]
  if (conditions.length === 1) return { enableWhen: conditions, enableBehavior: undefined }
  return { enableWhen: conditions, enableBehavior: code(all ? 'all' : 'any', path) }
}
