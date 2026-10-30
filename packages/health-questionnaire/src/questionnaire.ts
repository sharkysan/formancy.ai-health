/**
 * A formancy form as an SDC Questionnaire for FHIR R4, or refused whole
 * (0006).
 *
 * The form is read through `@formancy/spec` 0.6.0, as formancy defines it:
 * a version this package does not read is refused before anything else,
 * since nothing is known about what it means, and a form formancy's own
 * validator refuses is refused with each of its errors' paths. Then every
 * field, rule and text is mapped or refused, and the Questionnaire is
 * answered only when nothing was: never a part of one.
 *
 * Its identity is the host's (context.ts): the url is the host's base,
 * `/Questionnaire/` and the form's id, which formancy calls "the form's
 * stable identifier"; the version, the number formancy published it as,
 * with the `integer` version algorithm SDC's sdc-2 asks for beside one.
 * Each item's linkId is its field's key. Nothing here reads a clock or a
 * random source, so the same form and context give the same resource, and
 * `writeJson` the same bytes.
 */
import { code, member, Refusals, uri, type Refusal } from '@formancy/health-core'
import type { FormSchema } from '@formancy/spec'
import { validateSchema } from '@formancy/spec/validate'
import { checkContext, type CheckedContext, type QuestionnaireContext } from './context.js'
import { itemsOf } from './items.js'
import { placesOf, type Place } from './places.js'
import { EXTENSION, SDC_QUESTIONNAIRE, VERSION_ALGORITHM, type Extension, type Questionnaire, type QuestionnaireItem } from './resource.js'
import { FORM, fromPointer } from './refusals.js'
import { ruleEffects } from './rules.js'
import { Texts } from './texts.js'

/**
 * The form spec versions this package maps: those `@formancy/spec` 0.6.0
 * reads, each a superset of the one before (its `SPEC_VERSIONS`). Listed
 * here rather than read from the spec, so that a spec release that reads
 * another fails this package's test until somebody has decided what it
 * means for the mapping.
 */
export const SPEC_VERSIONS_MAPPED = ['1', '2', '3', '4'] as const

export type QuestionnaireExport = { readonly ok: true; readonly questionnaire: Questionnaire } | { readonly ok: false; readonly refusals: readonly Refusal[] }

const MAPPED: ReadonlySet<unknown> = new Set(SPEC_VERSIONS_MAPPED)

/** `form`, if it is a form of a version mapped here that formancy's validator accepts; refused otherwise. */
function readForm(form: unknown, refusals: Refusals): FormSchema | undefined {
  const version = typeof form === 'object' && form !== null ? (form as { readonly specVersion?: unknown }).specVersion : undefined
  if (!MAPPED.has(version)) return refusals.add('version', member(FORM, 'specVersion'))
  const result = validateSchema(form)
  if (result.valid) return result.schema
  for (const error of result.errors) refusals.add('invalid', fromPointer(error.path))
  return undefined
}

/** The Questionnaire's own elements, around its items. */
function questionnaireOf(form: FormSchema, context: CheckedContext, url: string, texts: Texts, items: readonly QuestionnaireItem[]): Questionnaire {
  // Constants, checked as what they are written as: the paths name where they stand.
  const at = 'Questionnaire.extension.valueCoding'
  const versionAlgorithm: Extension = {
    url: EXTENSION.versionAlgorithm,
    valueCoding: { system: uri(VERSION_ALGORITHM, `${at}.system`), code: code('integer', `${at}.code`) },
  }
  return {
    resourceType: 'Questionnaire',
    meta: { profile: [SDC_QUESTIONNAIRE] },
    ...(texts.language === undefined ? {} : { language: texts.language }),
    ...(context.version === undefined ? {} : { extension: [versionAlgorithm] }),
    url: uri(url, member(FORM, 'id')),
    ...(context.version === undefined ? {} : { version: context.version.text }),
    title: form.title,
    status: context.status,
    ...(items.length === 0 ? {} : { item: items }),
  }
}

/** A field's place in the form beside the item it became, and its fields' the same: what the answers' export walks (response.ts). */
export interface Pair {
  readonly place: Place
  readonly item: QuestionnaireItem
  readonly children: readonly Pair[]
}

/** A form mapped: its Questionnaire, and each of its fields beside its item, in the Questionnaire's order. */
export interface Mapped {
  readonly questionnaire: Questionnaire
  readonly pairs: readonly Pair[]
}

/**
 * The places beside the items made of them. itemsOf makes one item per
 * place, in order, when nothing is refused, and a container's of its
 * fields: anything else is a bug here, and thrown as one.
 */
export function pairsOf(places: readonly Place[], items: readonly QuestionnaireItem[]): Pair[] {
  if (places.length !== items.length) throw new Error('the items are not one per field')
  return places.map((place, index) => {
    const item = items[index] as QuestionnaireItem
    if (item.linkId !== place.field.key) throw new Error('an item is not its field')
    return { place, item, children: pairsOf(place.children, item.item ?? []) }
  })
}

/**
 * `form` mapped with `context`, already checked; or undefined, with every
 * reason it cannot be in `refusals`. The one reading of a form both
 * exports share: the Questionnaire's items, and the response's walk of
 * them, come from here, so the two cannot disagree on an item, a linkId,
 * a type or a condition.
 */
export function mapForm(form: FormSchema, context: CheckedContext | undefined, refusals: Refusals): Mapped | undefined {
  const before = refusals.count
  const read = readForm(form, refusals)
  if (read === undefined || context === undefined) return undefined
  const url = `${context.base}/Questionnaire/${read.id}`
  const places = placesOf(read)
  const texts = new Texts(read, context.languages, refusals)
  const effects = ruleEffects(read, places, url, refusals)
  const items = itemsOf(places.roots, { places, effects, texts, url, refusals })
  if (refusals.count > before) return undefined
  return { questionnaire: questionnaireOf(read, context, url, texts, items), pairs: pairsOf(places.roots, items) }
}

/**
 * `form` as a Questionnaire, with what `context` says of it; or every
 * reason it cannot be one, each naming where in the form or the context
 * it is, and never a value.
 */
export function toQuestionnaire(form: FormSchema, context: QuestionnaireContext): QuestionnaireExport {
  const refusals = new Refusals()
  const mapped = mapForm(form, checkContext(context, refusals), refusals)
  return mapped === undefined ? { ok: false, refusals: refusals.list } : { ok: true, questionnaire: mapped.questionnaire }
}
