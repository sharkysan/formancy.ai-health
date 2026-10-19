import { writeJson } from '@formancy/health-core'
import type { FieldDef, FormI18n } from '@formancy/spec'
import { describe, expect, test } from 'vitest'
import { HOST, exported, form, refused } from './test-support.js'

const SWISS = { ...HOST, languages: ['de-CH', 'fr', 'it'] }

/** Catalogues in Swiss German, French and Italian, with whatever `more` adds. */
const i18n = (more: Record<string, Record<string, string>> = {}): FormI18n => ({
  defaultLocale: 'de-CH',
  messages: {
    'de-CH': { 'reason.label': 'Grund', 'urgent.label': 'Dringlichkeit', 'urgent.yes': 'Ja', ...more['de-CH'] },
    fr: { 'reason.label': 'Motif', 'urgent.label': 'Urgence', 'urgent.yes': 'Oui', ...more.fr },
    it: { 'reason.label': 'Motivo', 'urgent.label': 'Urgenza', 'urgent.yes': 'Sì', ...more.it },
  },
})

const reason: FieldDef = { key: 'reason', type: 'text', label: { $t: 'reason.label' } }
const urgent: FieldDef = { key: 'urgent', type: 'radio', label: { $t: 'urgent.label' }, options: [{ value: 'yes', label: { $t: 'urgent.yes' } }] }

const translation = (lang: string, content: string) =>
  `{"url":"http://hl7.org/fhir/StructureDefinition/translation","extension":[{"url":"lang","valueCode":"${lang}"},{"url":"content","valueString":"${content}"}]}`

describe('a translated form', () => {
  // The texts are the default catalogue's, in the language the resource
  // says it is in, and each language asked for is R4's translation
  // extension on the text's element. Read against R4's
  // StructureDefinition-translation: `lang` and `content`, both required.
  test('writes each text in its default language, and translated into each language asked for', () => {
    const questionnaire = exported(form([reason, urgent], { i18n: i18n() }), SWISS)
    expect(questionnaire.language).toBe('de-CH')
    const written = writeJson(questionnaire)
    expect(written).toContain(`{"linkId":"reason","text":"Grund","_text":{"extension":[${translation('fr', 'Motif')},${translation('it', 'Motivo')}]},"type":"string"}`)
    expect(written).toContain(`"code":"yes","display":"Ja","_display":{"extension":[${translation('fr', 'Oui')},${translation('it', 'Sì')}]}`)
  })

  // A text missing in a language asked for is refused, never written in
  // the default language among the translated ones: a reader who asked
  // for French and is shown one German question may answer what they did
  // not understand, and nothing in the resource would say so.
  test('refuses a text missing in a language asked for, naming the text and the language', () => {
    const partial = i18n()
    delete (partial.messages.it as Record<string, string>)['urgent.yes']
    expect(refused(form([reason, urgent], { i18n: partial }), SWISS)).toEqual(['missing form.model.fields[1].options[0].label (it)'])
  })

  // An empty translation is no text, and FHIR JSON has no empty string;
  // nor is an empty text in the default language, which formancy's
  // validator lets through.
  test('refuses an empty text as missing, in the default language too', () => {
    expect(refused(form([reason], { i18n: i18n({ fr: { 'reason.label': '' } }) }), SWISS)).toEqual(['missing form.model.fields[0].label (fr)'])
    expect(refused(form([reason], { i18n: i18n({ 'de-CH': { 'reason.label': '' } }) }))).toEqual(['missing form.model.fields[0].label'])
  })

  // A language asked for twice is asked for once: two translations into
  // one language would be two answers to which text its reader sees.
  test('translates into a language asked for twice once', () => {
    const written = writeJson(exported(form([reason], { i18n: i18n() }), { ...HOST, languages: ['fr', 'fr'] }))
    expect(written.split('"valueCode":"fr"')).toHaveLength(2)
  })

  // No region falls back to its language, as in formancy's resolvedLocale:
  // a form with `fr` has no `fr-CH`, and a reader asking for fr-CH gets no
  // French guessed for them.
  test('matches a language by its tag exactly', () => {
    expect(refused(form([reason], { i18n: i18n() }), { ...HOST, languages: ['fr-CH'] })).toEqual(['missing form.model.fields[0].label (fr-CH)'])
  })

  // A plain string is the default language's and has no translation, and
  // a form with no catalogue has none at all: refused once per language,
  // not once per text.
  test('refuses a plain string in another language, and a form with no catalogue once per language', () => {
    const mixed = form([reason, { key: 'note', type: 'static', label: 'Nur Deutsch' }], { i18n: i18n() })
    expect(refused(mixed, SWISS)).toEqual(['missing form.model.fields[1].label (fr)', 'missing form.model.fields[1].label (it)'])
    expect(refused(form([{ key: 'note', type: 'static', label: 'Only English' }]), SWISS)).toEqual(['missing form.i18n (de-CH)', 'missing form.i18n (fr)', 'missing form.i18n (it)'])
  })

  // Asked for nothing beside the default language, the form needs no
  // other catalogue, and a form with none states no language at all.
  test('asks nothing of a form when no other language is asked for', () => {
    expect(exported(form([reason], { i18n: i18n() }), { ...HOST, languages: ['de-CH'] }).item?.[0]).toEqual({ linkId: 'reason', text: 'Grund', type: 'string' })
    expect(exported(form([{ key: 'note', type: 'static', label: 'Plain' }]))).not.toHaveProperty('language')
  })

  // A message id is the author's, and may be `constructor` or
  // `__proto__`: read off an object's prototype, it would be a function
  // where a text belongs.
  test('reads a message only from the catalogue itself', () => {
    const tricky: FieldDef = { key: 'reason', type: 'text', label: { $t: 'constructor' } }
    expect(refused(form([tricky], { i18n: { defaultLocale: 'de-CH', messages: { 'de-CH': { constructor: 'Konstruktor' }, fr: {} } } }), { ...HOST, languages: ['fr'] })).toEqual([
      'missing form.model.fields[0].label (fr)',
    ])
  })

  // The title is a plain string in @formancy/spec 0.6.0, the form's name:
  // written as it is, in the default language, and never refused for a
  // translation formancy cannot hold.
  test('writes the title untranslated', () => {
    expect(exported(form([reason], { i18n: i18n(), title: 'Zuweisung' }), SWISS).title).toBe('Zuweisung')
  })

  // A language tag is a code, and one with a space is not; formancy's
  // defaultLocale is any text of two to thirty-five characters.
  test("refuses a default locale that is not a code, at the form's", () => {
    expect(refused(form([{ key: 'note', type: 'static', label: 'Plain' }], { i18n: { defaultLocale: 'de CH ', messages: { 'de CH ': {} } } }))).toEqual(['grammar form.i18n.defaultLocale'])
  })

  // A catalogue may be named anything formancy's validator takes, two to
  // thirty-five characters, and its name becomes Questionnaire.language.
  // Named `Deutsch` or `de_CH`, or `de-ch`, the HL7 validator refuses the
  // Questionnaire with errors -- not only at its language, but at every
  // code whose display it reads in that language -- where a code alone
  // let each through (measured 17 October 2026, 0006).
  test.each(['Deutsch', 'de_CH', 'de-ch'])("refuses a default locale %s that is no language tag, at the form's", (locale) => {
    expect(refused(form([{ key: 'note', type: 'static', label: { $t: 'n' } }], { i18n: { defaultLocale: locale, messages: { [locale]: { n: 'Hinweis' } } } }))).toEqual(['language-tag form.i18n.defaultLocale'])
  })
})
