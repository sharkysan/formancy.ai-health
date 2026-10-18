/**
 * formancy's engine for the demo's form, and the words its renderer is
 * given.
 */
import { createFormEngine, type CapabilitySource, type FormEngine } from '@formancy/core'
import type { FormWordsByLocale } from '@formancy/core/words'
import type { FormSchema } from '@formancy/spec'
import { LANGUAGES, WORDS } from './words/index.js'

/**
 * What `now()`, `today()` and `random()` say to the form's rules: fixed,
 * and read by nothing. formancy 0.5.0's `createFormEngine` refuses a form
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
