// @vitest-environment node
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, test } from 'vitest'
import { sampleOf } from './build/plugin.js'
import { firstLanguage, LANGUAGES, WORDS, type Language, type Versions } from './words/index.js'

/**
 * The page's words in its four languages, read as the page renders them:
 * every value, a function called with the arguments the page gives it.
 * TypeScript's `satisfies Words` holds that no word is missing; this holds
 * what is said. It reads index.html too, the one text the page has outside
 * them, and says which.
 */
const VERSIONS: Versions = { validator: '7.0.2', r4: '4.0.1', sdc: '4.0.0', chOrf: '3.0.2', chCore: '6.0.0', chTerm: '3.3.0' }

/** Every text of `words`, as rendered. */
function texts(words: unknown): string[] {
  if (typeof words === 'string') return [words]
  if (typeof words === 'function') return [String((words as (argument: unknown) => unknown)(VERSIONS))]
  if (typeof words === 'object' && words !== null) return Object.values(words).flatMap(texts)
  return [String(words)]
}

const html = readFileSync(join(dirname(fileURLToPath(import.meta.url)), '..', 'index.html'), 'utf8')

/**
 * Each "open source" in `text`, however it is spelt -- with a space, a
 * no-break space, a hyphen or none, in any case -- that no negation stands
 * shortly before, in any of the page's languages.
 */
function unnegatedOpenSource(text: string): string[] {
  const negation = /(?:^|[\s(’'])(?:not|nicht|kein\w*|pas|non|né)\s[^.]{0,20}$/i
  return [...text.matchAll(/open[\s ‑-]*source/gi)].filter((found) => !negation.test(text.slice(0, found.index))).map((found) => found[0])
}

/**
 * What a statement about cookies, tracking, analytics or measurement looks
 * like in the page's languages: the words, and the stems of the words, a
 * translation of such a statement would use.
 */
const TRACKING = /cookie|track|traceur|tra[cç]age|tracciament|suivi|verfolg|reichweit|datenerheb|pistage|mesure d.audience|misurazion|telemetr|analy[st]|analisi|statisti/i

describe("the page's words", () => {
  // An empty word renders as nothing: a button with no name, a heading
  // that says nothing, and TypeScript is satisfied by ''.
  test('are none of them empty, in any language', () => {
    for (const language of LANGUAGES) expect(texts(WORDS[language]).filter((text) => text.trim() === ''), language).toEqual([])
  })

  // HL7 asks a prominent first mention of its marks with ®; the lead is
  // where the page first names the standard, in every language.
  test('name the HL7® FHIR® standard in the lead, in every language', () => {
    for (const language of LANGUAGES) expect(WORDS[language].lead, language).toMatch(/HL7® FHIR®/)
  })

  // "Never call it open source" (CLAUDE.md): the phrase may stand only
  // where the page says it is not, as NOTICE does.
  test('say "open source" only after a negation', () => {
    for (const language of LANGUAGES) expect(texts(WORDS[language]).flatMap((text) => unnegatedOpenSource(text).map((found) => `${found}: ${text}`)), language).toEqual([])
  })

  // The reading itself, on the spellings a translation would use: German
  // writes "Open-Source", English "opensource" or with a no-break space,
  // and each language negates in its own words.
  test.each([
    ['Es ist Open-Source-Software.', ['Open-Source']],
    ['It is opensource.', ['opensource']],
    ['It is open source.', ['open source']],
    ['Formancy Health is open source.', ['open source']],
    ['Es ist nicht Open Source.', []],
    ['Es ist keine Open-Source-Software.', []],
    ['Ce n’est pas de l’open source.', []],
    ['Non è né gratuito né open source.', []],
  ])('find an unnegated "open source" in "%s": %j', (text, found) => {
    expect(unnegatedOpenSource(text)).toEqual(found)
  })

  // The rightsholder's decision: the page says what it does with what is
  // typed, which its policy and the browser gate hold, and makes no
  // statement about cookies, tracking or analytics, which rest on the
  // zone's settings and no gate of this repository's.
  test('say nothing of cookies, tracking or analytics, in any language or in index.html', () => {
    for (const language of LANGUAGES) expect(texts(WORDS[language]).filter((text) => TRACKING.test(text)), language).toEqual([])
    expect(html).not.toMatch(TRACKING)
  })

  // The reading itself, on the statement each language would make.
  test.each([
    ['de-CH', 'Es gibt keine Nachverfolgung und keine Reichweitenmessung.'],
    ['fr', 'Sans pistage ni mesure d’audience.'],
    ['it', 'Nessuna misurazione del pubblico.'],
    ['en', 'No telemetry is sent.'],
  ])('would find such a statement in %s: "%s"', (_language, statement) => {
    expect(statement).toMatch(TRACKING)
  })

  // The banner is the page's statement of what its data is and what it
  // does with what is typed, reviewed in each language for its three
  // parts: the data is synthetic, a real patient's does not belong in it,
  // and the page sends what is typed nowhere and keeps none of it. A
  // translation that dropped one would still be a banner, and say less.
  const BANNER: Readonly<Record<Language, readonly string[]>> = {
    'de-CH': ['erfundenen Daten', 'echte Patientendaten gehören nicht hinein', 'sendet es nirgendwohin', 'behält nichts davon'],
    fr: ['données fictives', 'données réelles de patients n’y ont pas leur place', 'ne l’envoie nulle part', 'n’en conserve rien'],
    it: ['dati fittizi', 'dati reali dei pazienti non vanno inseriti', 'non lo invia da nessuna parte', 'non ne conserva nulla'],
    en: ['synthetic data', 'real patient data does not belong in it', 'sends it nowhere', 'keeps none of it'],
  }
  test.each(LANGUAGES)("hold the banner's three statements, in %s", (language) => {
    expect(BANNER[language].filter((part) => !WORDS[language].banner.includes(part))).toEqual([])
  })

  // After a change the Questionnaire and the letter's Bundles are still the
  // corpus's, and say so beside them: the status line names the two
  // resources the answers make, and no other, in every language.
  test('say, once the answers are changed, that the response and the CH ORF document changed, and nothing else', () => {
    for (const language of LANGUAGES) {
      const { changed } = WORDS[language].form
      expect(changed, language).toContain('QuestionnaireResponse')
      expect(changed, language).toMatch(/CH.ORF/)
      expect(changed, language).not.toMatch(/Bundle|Questionnaire(?!Response)/)
    }
  })

  // The page's language is the form's: a language the page offers and the
  // form's catalogue lacks would draw the form in its default language
  // under another page's words, and the Questionnaire would lack it.
  test("are the form's languages, which the Questionnaire carries", () => {
    const sample = sampleOf()
    expect(Object.keys(sample.form.i18n?.messages ?? {})).toEqual([...LANGUAGES])
    expect(sample.questionnaireContext.languages).toEqual([...LANGUAGES])
  })
})

describe('the language the page opens in', () => {
  // A Swiss visitor's browser says de-CH, fr-CH or it-CH, an Austrian's
  // de-AT: each reads the page in its language, and anyone else in
  // English, never in the first language of the list.
  test("is the first the browser prefers that the page has, by its language, and English otherwise", () => {
    expect(firstLanguage(['de-AT', 'en'])).toBe('de-CH')
    expect(firstLanguage(['fr-CH'])).toBe('fr')
    expect(firstLanguage(['es-ES', 'IT'])).toBe('it')
    expect(firstLanguage(['en-GB', 'de'])).toBe('en')
    expect(firstLanguage(['es'])).toBe('en')
    expect(firstLanguage([])).toBe('en')
  })
})
