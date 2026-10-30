/**
 * A formancy submission's answers as a QuestionnaireResponse for FHIR R4,
 * answering the Questionnaire `toQuestionnaire` writes of the same form
 * and context, or refused whole (0007).
 *
 * The form is read once, by the mapping both exports share (`mapForm`),
 * and the response is walked from the Questionnaire's own items: each
 * item's linkId, type, options, conditions and nesting are the
 * Questionnaire's, so the two cannot disagree. The answers are formancy's
 * submission, the value its engine holds: a group's answers in an object
 * under its key, a repeater's rows in a list of objects, a page's beside
 * it, since a page scopes no data. Each field's value is its item's
 * answers, or refused (answers.ts).
 *
 * Missing, null and suppressed answers stay three things:
 *
 * - **Missing and null** are no answer, in formancy (`unanswered`) and
 *   here: an item with no answer is not written, nor a group or a page
 *   with nothing answered inside. A response says which by its
 *   Questionnaire: an enabled item it does not answer is unanswered.
 * - **Suppressed** is a value on an item the other answers disable, which
 *   R4 gives no answer, read as the validator reads the Questionnaire's
 *   enableWhen (enablement.ts). On a page a skip rule walks past, formancy
 *   keeps what was typed and neither shows nor validates it: left out. On
 *   an item a visible rule hides, formancy's engine clears the value when
 *   the rule hides it, and an initial value, and a renderer offers nobody
 *   a hidden field; what stays is a value a host set while it was hidden,
 *   or the two readings of the rule disagree: refused as `disabled`, for
 *   omitting it would hide which. A computed field, which formancy fills
 *   while it is hidden, the mapping refuses there (rules.ts).
 * - **Required**: a completed or amended response answers every enabled
 *   required item, as R4 asks and the validator holds; a required repeater
 *   of empty rows, which formancy counts, has none.
 *
 * A submission's name its form does not have is refused as `unknown` at
 * the object that holds it, without the name. Nothing here reads a clock
 * or a random source: the same form, answers and context give the same
 * resource.
 */
import { item as indexed, member, Refusals, uri, type Refusal } from '@formancy/health-core'
import { ROW_ID, type FormSchema } from '@formancy/spec'
import { answersOf, unanswered } from './answers.js'
import { isEnabled } from './enablement.js'
import { mapForm, type Pair } from './questionnaire.js'
import type { Questionnaire, QuestionnaireItem } from './resource.js'
import { checkResponseContext, type ResponseContext, type ResponseElements } from './response-context.js'
import {
  SDC_QUESTIONNAIRE_RESPONSE,
  type QuestionnaireResponse,
  type QuestionnaireResponseAnswer,
  type QuestionnaireResponseItem,
} from './response-resource.js'

export type QuestionnaireResponseExport =
  { readonly ok: true; readonly questionnaireResponse: QuestionnaireResponse } | { readonly ok: false; readonly refusals: readonly Refusal[] }

/** The submission the host handed over, where every answer's path starts. */
export const ANSWERS = 'answers'

/** A submission's object, as JSON holds one: plain data, not an array, not an instance of anything. */
type Holder = Readonly<Record<string, unknown>>

/** What the walk carries: the answers written so far, for the conditions after them; whether required items must be answered; the refusals. */
interface Walk {
  readonly written: Map<string, readonly QuestionnaireResponseAnswer[]>
  readonly complete: boolean
  readonly refusals: Refusals
}

function isHolder(value: unknown): value is Holder {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return false
  const prototype: unknown = Object.getPrototypeOf(value)
  return prototype === Object.prototype || prototype === null
}

/** The value `holder` holds under `name`, its own: an inherited `toString` is no answer. */
const valueAt = (holder: Holder | undefined, name: string): unknown => (holder !== undefined && Object.hasOwn(holder, name) ? holder[name] : undefined)

/** The names answers to `pairs` stand under: each field's key, and a page's fields' in its place. */
function namesOf(pairs: readonly Pair[]): string[] {
  return pairs.flatMap((pair) => (pair.place.field.type === 'page' ? namesOf(pair.children) : [pair.place.field.key]))
}

/** `holder` refused at `path`, once, if it holds a name no answer to `pairs` stands under, or `extra` names. */
function checkNames(holder: Holder, pairs: readonly Pair[], path: string, refusals: Refusals, extra: readonly string[] = []): void {
  const names = new Set([...namesOf(pairs), ...extra])
  if (Object.keys(holder).some((name) => !names.has(name))) refusals.add('unknown', path)
}

/** Whether anything in `value` is an answer: a value, a tick, a row with one. A row's identity is not. */
function holdsAnswer(value: unknown): boolean {
  if (unanswered(value)) return false
  if (Array.isArray(value)) return value.some(holdsAnswer)
  if (isHolder(value)) return Object.entries(value).some(([name, inner]) => name !== ROW_ID && holdsAnswer(inner))
  return true
}

/** The item of a group or a page around `children`; none when nothing inside is answered. */
const around = (item: QuestionnaireItem, children: QuestionnaireResponseItem[]): QuestionnaireResponseItem[] =>
  children.length === 0 ? [] : [{ linkId: item.linkId, item: children }]

/** The response items of `pairs`, whose answers stand in `holder` at `at`. */
function itemsOf(pairs: readonly Pair[], holder: Holder | undefined, at: string, walk: Walk): QuestionnaireResponseItem[] {
  return pairs.flatMap((pair) => itemOf(pair, holder, at, walk))
}

/** A group's item: its answers are an object's, or there are none. */
function groupOf(pair: Pair, value: unknown, path: string, walk: Walk): QuestionnaireResponseItem[] {
  if (unanswered(value)) return around(pair.item, itemsOf(pair.children, undefined, path, walk))
  if (!isHolder(value)) {
    walk.refusals.add('answer-type', path)
    return []
  }
  checkNames(value, pair.children, path, walk.refusals)
  return around(pair.item, itemsOf(pair.children, value, path, walk))
}

/** A repeater's rows, an item each, as R4 writes a repeating group; an empty row, which formancy pads a repeater with and counts, has none. */
function rowsOf(pair: Pair, value: unknown, path: string, walk: Walk): QuestionnaireResponseItem[] {
  if (!unanswered(value) && !Array.isArray(value)) {
    walk.refusals.add('answer-type', path)
    return []
  }
  const rows: QuestionnaireResponseItem[] = []
  for (const [index, row] of (Array.isArray(value) ? value : []).entries()) {
    const at = indexed(path, index)
    if (!isHolder(row)) {
      walk.refusals.add('answer-type', at)
      continue
    }
    checkNames(row, pair.children, at, walk.refusals, [ROW_ID])
    if (holdsAnswer(row)) rows.push(...around(pair.item, itemsOf(pair.children, row, at, walk)))
  }
  const { field } = pair.place
  if (field.maxItems !== undefined && rows.length > field.maxItems) walk.refusals.add('bound', path)
  if (rows.length === 0 && pair.item.required === true && walk.complete) walk.refusals.add('required', path)
  return rows
}

/** The response items of one field's pair: its own, a container's, or none. */
function itemOf(pair: Pair, holder: Holder | undefined, at: string, walk: Walk): QuestionnaireResponseItem[] {
  const { item } = pair
  const { field } = pair.place
  const enabled = isEnabled(item, walk.written)
  // A page scopes nothing: its fields' answers stand beside it. One a skip
  // rule walks past is left out whole -- formancy keeps what it holds, and
  // R4 gives it no answer.
  if (field.type === 'page') return enabled ? around(item, itemsOf(pair.children, holder, at, walk)) : []
  const path = member(at, field.key)
  const value = valueAt(holder, field.key)
  if (!enabled) {
    if (holdsAnswer(value)) walk.refusals.add('disabled', path)
    return []
  }
  if (field.type === 'repeater') return rowsOf(pair, value, path, walk)
  if (field.type === 'group') return groupOf(pair, value, path, walk)
  const answers = answersOf(field, item, value, path, walk.refusals)
  if (answers === undefined) return []
  if (answers.length === 0) {
    if (item.required === true && walk.complete) walk.refusals.add('required', path)
    return []
  }
  // A row's answers are recorded too, the last row's standing for all,
  // and never read: no condition's question is in a repeater
  // (conditions.ts), and a key names one field across the form.
  walk.written.set(item.linkId, answers)
  return [{ linkId: item.linkId, answer: answers }]
}

/**
 * The response's own elements, around its items, in R4's order. SDC's
 * profile is claimed where it validates, and the host's claims after it,
 * each once: the one place a response's meta is written.
 */
function responseOf(questionnaire: Questionnaire, elements: ResponseElements, items: readonly QuestionnaireResponseItem[]): QuestionnaireResponse {
  const { status, authored, subject, author, source } = elements
  const versioned = questionnaire.version !== undefined
  const canonical = versioned ? uri(`${questionnaire.url}|${questionnaire.version as string}`, 'QuestionnaireResponse.questionnaire') : questionnaire.url
  const sdc: readonly string[] = subject !== undefined && versioned ? [SDC_QUESTIONNAIRE_RESPONSE] : []
  const profile = [...sdc, ...elements.profiles.filter((claim) => !sdc.includes(claim))]
  return {
    resourceType: 'QuestionnaireResponse',
    ...(profile.length === 0 ? {} : { meta: { profile } }),
    questionnaire: canonical,
    status,
    ...(subject === undefined ? {} : { subject }),
    authored,
    ...(author === undefined ? {} : { author }),
    ...(source === undefined ? {} : { source }),
    ...(items.length === 0 ? {} : { item: items }),
  }
}

/**
 * `answers`, a formancy submission of `form`, as a QuestionnaireResponse
 * with what `context` says of it; or every reason it cannot be one, each
 * naming where in the form, the answers or the context it is, and never a
 * value.
 */
export function toQuestionnaireResponse(form: FormSchema, answers: unknown, context: ResponseContext): QuestionnaireResponseExport {
  const refusals = new Refusals()
  const checked = checkResponseContext(context, refusals)
  const mapped = mapForm(form, checked.questionnaire, refusals)
  if (mapped === undefined) return { ok: false, refusals: refusals.list }
  const walk: Walk = { written: new Map(), complete: checked.complete, refusals }
  let items: QuestionnaireResponseItem[] = []
  if (!isHolder(answers)) refusals.add('answer-type', ANSWERS)
  else {
    checkNames(answers, mapped.pairs, ANSWERS, refusals)
    items = itemsOf(mapped.pairs, answers, ANSWERS, walk)
  }
  if (checked.elements === undefined || refusals.count > 0) return { ok: false, refusals: refusals.list }
  return { ok: true, questionnaireResponse: responseOf(mapped.questionnaire, checked.elements, items) }
}
