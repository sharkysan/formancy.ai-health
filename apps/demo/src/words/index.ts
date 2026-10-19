/**
 * The page's words, in its four languages (0012): Swiss German first, then
 * French and Italian, and English, the languages the demo's form is
 * written in and Formancy Report's pages are in.
 *
 * One file per language, each `satisfies Words`, so a word missing from
 * one fails the typecheck rather than showing another language's. What is
 * not here is English in every language, as its owner wrote it: HL7's and
 * LOINC's notices, the sentence of CLAUDE.md that says what the product
 * is not, and the packages' refusals, which the page shows as they are.
 * Every number and version a sentence names is handed in, from the
 * registers the build reads, and never typed here.
 *
 * The German and English notices follow the wording the design read for
 * them; the French and Italian are translations, which the rightsholder
 * reads before they ship.
 */
import type { FormWords } from '@formancy/core/words'
import type { ItemType } from '../read-out.js'
import { de } from './de.js'
import { en } from './en.js'
import { fr } from './fr.js'
import { it } from './it.js'

/** The page's languages, as BCP 47 tags in their canonical case, its default first. */
export const LANGUAGES = ['de-CH', 'fr', 'it', 'en'] as const

export type Language = (typeof LANGUAGES)[number]

/** The releases a conformance sentence names: the validator and each guide, as the registers pin them. */
export interface Versions {
  readonly validator: string
  readonly r4: string
  readonly sdc: string
  readonly chOrf: string
  readonly chCore: string
  readonly chTerm: string
}

/** R4's orderings, said in words of a number or of a moment. */
export type Ordering = '>' | '<' | '>=' | '<='

/** The five inputs the page has refused on purpose. */
export type OnPurpose = 'version' | 'unmapped' | 'ahv' | 'gln' | 'unproved'

export interface Words {
  /** The language's name in itself, as the language select offers it. */
  readonly name: string
  /** The language select's label. */
  readonly language: string
  readonly skip: string
  readonly title: string
  /** The first mention of the standard, with HL7's marks, as HL7 asks of a prominent one. */
  readonly lead: string
  readonly banner: string
  /**
   * The words formancy's renderer draws that the page gives it: the
   * submit control's, and in Italian, which formancy 0.6.0 does not ship,
   * every word a form of the demo's field types reaches.
   */
  readonly formancy: FormWords
  readonly form: {
    readonly heading: string
    readonly intro: (formancy: string) => string
    readonly sample: string
    readonly changed: string
    readonly reset: string
    readonly made: string
    readonly refused: (count: string) => string
  }
  readonly resources: {
    readonly intro: string
    readonly show: string
    readonly asJson: (resource: string) => string
    readonly download: (file: string) => string
    readonly madeBy: (maker: string) => string
    readonly corpus: (file: string) => string
    readonly refusedBy: (maker: string) => string
    readonly failed: string
  }
  readonly questionnaire: { readonly heading: string; readonly intro: string }
  /** The Questionnaire read out from its JSON, item by item (0013). */
  readonly readOut: {
    readonly heading: string
    /** What it is read from, and what it is not. */
    readonly intro: string
    readonly title: string
    readonly type: string
    /** Each item type the read-out reads, in words. */
    readonly types: Readonly<Record<ItemType, string>>
    readonly required: string
    readonly repeats: string
    readonly yes: string
    readonly no: string
    readonly options: string
    readonly shownWhen: string
    /** How several conditions join: R4's enableBehavior `all` and `any`. */
    readonly joined: { readonly all: string; readonly any: string }
    readonly is: string
    readonly isNot: string
    readonly answered: string
    readonly unanswered: string
    /** An ordering of a number. */
    readonly numbers: Readonly<Record<Ordering, string>>
    /** An ordering of a date, a time, or both. */
    readonly moments: Readonly<Record<Ordering, string>>
    /** The heading of an item with no text, which a hidden field is. */
    readonly noText: string
    /** Said of a text the resource holds no translation of into the page's language: its own, in `language`. */
    readonly untranslated: (language: string) => string
    /** The same, where the resource names no language. */
    readonly unnamedLanguage: string
    readonly toField: string
    /** The way to a field's name: its visible words, then the field's. */
    readonly toFieldOf: (field: string) => string
    readonly notShown: string
    /** What the page says where the read-out stopped: the JSON alone stands. */
    readonly unread: string
  }
  readonly response: { readonly heading: string; readonly intro: string }
  readonly document: { readonly heading: string; readonly intro: string; readonly notMade: string }
  readonly letter: {
    readonly heading: string
    readonly intro: (report: string) => string
    readonly placement: string
    readonly data: string
    readonly binary: string
  }
  readonly refused: {
    readonly heading: string
    readonly intro: string
    readonly cases: { readonly [Case in OnPurpose]: { readonly heading: string; readonly what: string } }
  }
  readonly about: {
    readonly heading: string
    readonly evaluation: string
    readonly purpose: string
    readonly conformance: (versions: Versions) => string
    readonly register: string
    readonly affiliation: string
    readonly licence: string
  }
  /** The footer's links: the repository, its licence, and the notices of what the page bundles. */
  readonly footer: { readonly repository: string; readonly licence: string; readonly notices: string }
  /** What the page says when something throws that no package refuses with. */
  readonly broken: string
}

export const WORDS: Readonly<Record<Language, Words>> = { 'de-CH': de, fr, it, en }

/**
 * The page's language for a browser that prefers `preferred`, in its
 * order: the first whose language is one of the page's, by its primary
 * subtag, so `de-AT` reads the Swiss German page and `fr-CH` the French;
 * English when none is.
 */
export function firstLanguage(preferred: readonly string[]): Language {
  for (const tag of preferred) {
    const primary = tag.split('-')[0]?.toLowerCase()
    const found = LANGUAGES.find((language) => language.split('-')[0] === primary)
    if (found !== undefined) return found
  }
  return 'en'
}
