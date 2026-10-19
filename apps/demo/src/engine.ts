/**
 * formancy's engine for the demo's form, the words its renderer is given,
 * and where a Questionnaire item's field is on the page.
 */
import { createFormEngine, parsePath, type CapabilitySource, type FormEngine } from '@formancy/core'
import type { FormWordsByLocale } from '@formancy/core/words'
import type { FormSchema } from '@formancy/spec'
import { LANGUAGES, WORDS } from './words/index.js'

/**
 * What `now()`, `today()` and `random()` say to the form's rules: fixed,
 * and read by nothing. formancy 0.6.0's `createFormEngine` refuses a form
 * with logic rules and no capability source -- the engine never reads an
 * ambient clock, so that a server can replay a submission -- and the demo's
 * form has one rule, `interpreter == true`, which reads none of them. The
 * page reads no clock and no random source (0012): these are literals, the
 * instant the corpus's documents were created, 2026-10-17T08:00:00Z, its
 * day, and zero, each of the shape the engine checks every pass.
 */
export const FIXED_CAPABILITIES: CapabilitySource = Object.freeze({
  now: () => 1_792_224_000_000,
  today: () => '2026-10-17',
  random: () => 0,
})

/**
 * An engine over `form` in `locale`, starting from `answers`. Its locale is
 * fixed for its lifetime, so a change of language is a new engine, started
 * from the answers the old one holds.
 */
export function engineFor(form: FormSchema, locale: string, answers: unknown): FormEngine {
  return createFormEngine({ schema: form, locale, initialValue: answers, capabilities: FIXED_CAPABILITIES })
}

/**
 * The words formancy's renderer takes from the page, by language: one
 * constant, as a context value must be, or every control below it would
 * see a new language on every render.
 */
export const FORMANCY_WORDS: FormWordsByLocale = Object.freeze(Object.fromEntries(LANGUAGES.map((language) => [language, WORDS[language].formancy])))

/** Where the keyboard goes for an item of the Questionnaire: the control the form drew for its field. */
export interface FieldTarget {
  /** The id formancy's engine mints for the field's control, which its renderer draws the control with. */
  readonly id: string
  /** Whether the form shows the field now: one a rule hides is not drawn. */
  readonly shown: boolean
}

/**
 * The field types, and the types with a widget, as `type/widget`, that
 * formancy 0.6.0's React renderer draws as a control of the id its engine
 * mints which takes the keyboard's focus: measured on the DOM it draws of
 * every field type and widget formancy's spec has (engine.test.ts). No
 * other has one to lead to: a radio group's and a set of tick boxes'
 * options take ids of the renderer's own making; a ranking's and a
 * matrix's fieldset has the id and takes no focus; a file, a signature, a
 * hidden field and a static text draw none that does. A way to one would
 * lead nowhere, or be a guess.
 */
const DRAWN: ReadonlySet<string> = new Set([
  'text',
  'textarea',
  'number',
  'checkbox',
  'select',
  'date',
  'time',
  'datetime',
  'richtext',
  'checkbox/toggle',
  'select/typeahead',
  'selectboxes/tagpicker',
  'text/scanner',
  'number/rating',
  'number/slider',
])

/**
 * The field the item of `linkId` came from, as formancy's engine names it:
 * the one input field whose key the linkId is (0006), outside any
 * repeater's rows. Undefined where there is no such field to lead to
 * without guessing -- none, or two keyed alike under two groups -- or the
 * renderer draws it with no control of the engine's id to lead to. The id
 * is the engine's, deterministic, the one formancy's own submit and error
 * summary move the keyboard by.
 */
export function targetOf(engine: FormEngine, linkId: string): FieldTarget | undefined {
  const paths = engine
    .fieldPaths()
    .map(parsePath)
    .filter((path) => path.at(-1) === linkId && path.every((segment) => typeof segment === 'string'))
  const [path] = paths
  if (path === undefined || paths.length > 1) return undefined
  const field = engine.getFieldSnapshot(path)
  const kind = field.def.widget === undefined ? field.type : `${field.type}/${field.def.widget}`
  return DRAWN.has(kind) ? { id: field.ids.control, shown: field.visible } : undefined
}
