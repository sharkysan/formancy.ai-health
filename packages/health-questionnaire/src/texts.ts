/**
 * What a person reads: a form's texts in its default language, and their
 * translations into the languages the host asks for.
 *
 * A formancy text is a string or a reference into the form's message
 * catalogues (`{ "$t": "consent.label" }`). The default language's
 * catalogue has every message, which formancy's validator holds; the
 * others "may be partial", and formancy's renderers fall back to the
 * default text, one message at a time, in front of a reader who can see
 * the page change language. A Questionnaire has no such signal: a reader
 * who asked for French and is shown one German question among French ones
 * may answer a question they did not understand, and nothing in the
 * resource says that item was not translated. So **a text missing in a
 * language the host asks for refuses the export**, naming the text and the
 * language, and is never filled from another language. A text that is a
 * plain string has no translation at all.
 *
 * A translation is R4's `translation` extension on the text's element:
 * `"_text": { "extension": [{ "url": ".../translation", "extension":
 * [{ "url": "lang", "valueCode": "fr" }, { "url": "content", "valueString":
 * "..." }] }] }`. Languages are matched by their tag exactly: as in
 * formancy's `resolvedLocale`, no region falls back to its language, so a
 * form with `de` has no `de-CH`.
 *
 * The form's title is a plain string in `@formancy/spec` 0.6.0, so it is
 * written in the default language and never translated: it is the form's
 * name, not a question anybody answers.
 */
import { language as languageTag, member, type FhirCode, type Refusals } from '@formancy/health-core'
import type { FormSchema, Text } from '@formancy/spec'
import { EXTENSION, type Extension, type PrimitiveElement } from './resource.js'
import { FORM } from './refusals.js'

/** A text and its translations, ready to be written as `text` and `_text`, or `display` and `_display`. */
export interface Written {
  readonly text: string
  readonly translations: PrimitiveElement | undefined
}

const own = (record: object, key: string): boolean => Object.hasOwn(record, key)

export class Texts {
  /** The language the form's texts are written in: its default locale, if it has catalogues. */
  readonly language: FhirCode | undefined
  readonly #form: FormSchema
  readonly #languages: readonly string[]
  readonly #refusals: Refusals

  /**
   * The texts of `form`, translated into each of `languages` but the
   * form's default one. A form without catalogues has a translation in
   * none: each language asked for is refused once, at `form.i18n`, rather
   * than once per text.
   */
  constructor(form: FormSchema, languages: readonly FhirCode[], refusals: Refusals) {
    this.#form = form
    this.#refusals = refusals
    const i18n = form.i18n
    // formancy names a catalogue with any text of two to thirty-five
    // characters; as Questionnaire.language it must be a language tag the
    // validator reads, or it refuses every display it reads in it.
    this.language = i18n === undefined ? undefined : refusals.take(() => languageTag(i18n.defaultLocale, member(member(FORM, 'i18n'), 'defaultLocale')))
    const others = languages.filter((language) => language !== i18n?.defaultLocale)
    if (i18n === undefined) {
      for (const language of others) refusals.add('missing', member(FORM, 'i18n'), { language })
      this.#languages = []
    } else this.#languages = others
  }

  /** The text at `path`, in the default language and every language asked for; undefined, refused, where one is missing. */
  of(text: Text, path: string): Written | undefined {
    const base = this.#resolve(text, this.#form.i18n?.defaultLocale)
    if (base === undefined) return this.#refusals.add('missing', path)
    const translations: Extension[] = []
    for (const language of this.#languages) {
      const content = this.#resolve(text, language)
      if (content === undefined) {
        this.#refusals.add('missing', path, { language })
        continue
      }
      translations.push({ url: EXTENSION.translation, extension: [{ url: 'lang', valueCode: language as FhirCode }, { url: 'content', valueString: content }] })
    }
    if (translations.length < this.#languages.length) return undefined
    return { text: base, translations: translations.length === 0 ? undefined : { extension: translations } }
  }

  /**
   * `text` in `locale`'s catalogue, or the string it is; undefined when
   * the catalogue lacks it, or holds it empty, which FHIR JSON cannot
   * carry. A plain string is the default language's, and in no other.
   */
  #resolve(text: Text, locale: string | undefined): string | undefined {
    const i18n = this.#form.i18n
    if (typeof text === 'string') return locale === i18n?.defaultLocale ? text : undefined
    if (i18n === undefined || locale === undefined || !own(i18n.messages, locale)) return undefined
    const catalogue = i18n.messages[locale] as Record<string, string>
    const content = own(catalogue, text.$t) ? catalogue[text.$t] : undefined
    return content === '' ? undefined : content
  }
}
