/**
 * Where each field of a form stands: its path in the document, its data
 * path, the page it is on, and what holds it.
 *
 * The data path is formancy's identity of an answer, and the walk is the
 * one `@formancy/spec`'s `modelDataPaths` and diffSchemas make: a group
 * scopes its children (`address.city`), a repeater its rows
 * (`items[].qty`), and a page scopes nothing, so a field on a page has the
 * data path it would have without it. A rule names its target by data
 * path, and a skip rule names a page by its key.
 */
import { item, member } from '@formancy/health-core'
import type { FieldDef, FormSchema } from '@formancy/spec'
import { FORM } from './refusals.js'

export interface Place {
  readonly field: FieldDef
  /** Where the field is in the form: `form.model.fields[0].fields[2]`. */
  readonly path: string
  /** Its data path; undefined for a page, which holds no answer. */
  readonly dataPath: string | undefined
  /** The key of the page it is on, if it is on one. */
  readonly page: string | undefined
  /** The containers it is inside, outermost first. */
  readonly within: readonly Place[]
  /** The fields it holds, placed, in the model's order. */
  readonly children: readonly Place[]
  /** Where it comes in the form, read top to bottom, its fields after it: the order its item has in the Questionnaire. */
  readonly order: number
}

export interface Places {
  /** Every field, in document order. */
  readonly all: readonly Place[]
  readonly byField: ReadonlyMap<FieldDef, Place>
  readonly byDataPath: ReadonlyMap<string, Place>
  /** Pages by key: what a skip rule names. */
  readonly pages: ReadonlyMap<string, Place>
}

/** What a container's children are scoped by: a group's data path and a dot, a repeater's and `[].`, and a page by nothing. */
const SCOPES: Partial<Record<FieldDef['type'], (dataPath: string) => string>> = {
  group: (dataPath) => `${dataPath}.`,
  repeater: (dataPath) => `${dataPath}[].`,
}

/** Every field of `form`, placed, and the top-level ones as the roots. */
export function placesOf(form: FormSchema): Places & { readonly roots: readonly Place[] } {
  const all: Place[] = []
  const walk = (fields: readonly FieldDef[], at: string, prefix: string, page: string | undefined, within: readonly Place[]): Place[] =>
    fields.map((field, index) => {
      const path = item(at, index)
      const isPage = field.type === 'page'
      const dataPath = `${prefix}${field.key}`
      const children: Place[] = []
      const place: Place = { field, path, dataPath: isPage ? undefined : dataPath, page: isPage ? field.key : page, within, children, order: all.length }
      all.push(place)
      const scope = SCOPES[field.type]?.(dataPath) ?? prefix
      children.push(...walk(field.fields ?? [], member(path, 'fields'), scope, place.page, [...within, place]))
      return place
    })
  const roots = walk(form.model.fields, member(member(FORM, 'model'), 'fields'), '', undefined, [])
  return {
    roots,
    all,
    byField: new Map(all.map((place) => [place.field, place])),
    byDataPath: new Map(all.flatMap((place) => (place.dataPath === undefined ? [] : [[place.dataPath, place] as const]))),
    pages: new Map(all.flatMap((place) => (place.field.type === 'page' ? [[place.field.key, place] as const] : []))),
  }
}

/** Whether a field's answer stands at the top of the submission: no group or repeater above it. */
export function isTopLevel(place: Place): boolean {
  return place.dataPath === place.field.key
}
