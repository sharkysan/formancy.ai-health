/**
 * The Questionnaire the page shows, read out as a person reads a form: its
 * items in their order and nesting, each its text in the page's language,
 * its type, whether it is required or repeats, its options and the
 * conditions that show it (0013).
 *
 * Read from the bytes `writeJson` wrote -- the JSON shown below the
 * read-out and downloaded -- by health-core's `readJson`, and never from
 * the formancy form they were made of: a read-out of the form would agree
 * with the Questionnaire only while health-questionnaire maps the form
 * faithfully, and nobody would find out the day it did not. A number stays
 * its digits, as the resource writes them (0004).
 *
 * It reads what health-questionnaire writes, as R4 says it
 * (https://hl7.org/fhir/R4/questionnaire.html, read on 18 October 2026),
 * and refuses the rest whole: a member or an extension it does not know,
 * an item type the package does not write, an operator R4 does not have,
 * an answer of no type an operator takes or that is no option of its
 * question, or a shape that is not the resource's stops the reading at its
 * path, and the page shows the JSON alone rather than part of a form. What
 * it knows and does not read -- the resource's canonical, version, status,
 * profile and version algorithm, and an item's length, bounds, read-only
 * and hidden flags and how often it may be answered -- the page's words
 * leave to the JSON. It holds the bytes to no profile, which is the
 * validator's (0005): it is a reading, not a FHIR renderer.
 */
import { isFhirNumber, item, member, readJson, type FhirJson, type FhirJsonObject } from '@formancy/health-core'

/** The item types health-questionnaire writes, R4's codes for them. */
export const ITEM_TYPES = ['group', 'display', 'boolean', 'decimal', 'integer', 'date', 'dateTime', 'time', 'string', 'text', 'choice'] as const
export type ItemType = (typeof ITEM_TYPES)[number]

/** R4's enableWhen operators, every one. */
export const OPERATORS = ['exists', '=', '!=', '>', '<', '>=', '<='] as const
export type Operator = (typeof OPERATORS)[number]

/** A text as the read-out gives it, in the page's language or standing in for it. */
export interface Wording {
  readonly text: string
  /** The language it is in, as the resource names it; undefined where the resource names none. */
  readonly lang: string | undefined
  /** Whether the resource has no text in the language asked for, so that this is its own. */
  readonly untranslated: boolean
}

/** An option: its code system and code, which the response writes, and its display. */
export interface ReadOption {
  readonly system: string | undefined
  readonly code: string
  readonly display: Wording | undefined
}

/**
 * A condition's answer, by what it is: yes or no; a number, a moment or a
 * text, each as the resource writes it; an option of its question.
 */
export type ReadAnswer =
  | { readonly kind: 'boolean'; readonly value: boolean }
  | { readonly kind: 'number' | 'moment' | 'string'; readonly value: string }
  | { readonly kind: 'option'; readonly code: string; readonly display: Wording | undefined }

export interface ReadCondition {
  /** The linkId of the item it asks about. */
  readonly question: string
  /** That item's text; undefined where it has none, as a hidden field has none. */
  readonly questionText: Wording | undefined
  readonly operator: Operator
  readonly answer: ReadAnswer
}

export interface ReadItem {
  readonly linkId: string
  readonly text: Wording | undefined
  readonly type: ItemType
  readonly required: boolean
  readonly repeats: boolean
  readonly options: readonly ReadOption[]
  readonly conditions: readonly ReadCondition[]
  /** How several conditions join, as R4's enableBehavior says it; undefined for one or none. */
  readonly behaviour: 'all' | 'any' | undefined
  readonly items: readonly ReadItem[]
}

export type ReadOut =
  | { readonly ok: true; readonly title: Wording | undefined; readonly items: readonly ReadItem[] }
  /** Where the reading stopped. */
  | { readonly ok: false; readonly at: string }

/** A condition's answers, by R4's member for each, and what each is read as. */
const ANSWERS = {
  answerBoolean: 'boolean',
  answerDecimal: 'number',
  answerInteger: 'number',
  answerDate: 'moment',
  answerDateTime: 'moment',
  answerTime: 'moment',
  answerString: 'string',
  answerCoding: 'option',
} as const satisfies Readonly<Record<string, ReadAnswer['kind']>>

/**
 * The members of each object the read-out reads, as health-questionnaire's
 * `resource.ts` types them, which types only what the package writes, and
 * no others: a member it passed over could change what an item asks -- the
 * answers it takes, when it is shown, what it starts with -- and the
 * read-out would say otherwise without a word.
 */
const MEMBERS: Readonly<Record<'questionnaire' | 'item' | 'condition' | 'option' | 'coding' | 'text' | 'translation', readonly string[]>> = {
  questionnaire: ['resourceType', 'meta', 'language', 'extension', 'url', 'version', 'title', 'status', 'item'],
  item: ['extension', 'linkId', 'text', '_text', 'type', 'enableWhen', 'enableBehavior', 'required', 'repeats', 'readOnly', 'maxLength', 'answerOption', 'item'],
  condition: ['question', 'operator', ...Object.keys(ANSWERS)],
  option: ['valueCoding'],
  coding: ['system', 'code', 'display', '_display'],
  /** A text's element, `_text` or `_display`: its translations. */
  text: ['extension'],
  translation: ['url', 'extension'],
}

/** R4's core extensions, by their canonicals: identifiers, never fetched. */
const R4 = 'http://hl7.org/fhir/StructureDefinition/'
const TRANSLATION = `${R4}translation`

/**
 * The extensions health-questionnaire writes on the resource and on an
 * item (its `resource.ts`'s EXTENSION), none of which the read-out reads:
 * what they say is in the JSON alone, as the page's words say.
 */
const EXTENSIONS: Readonly<Record<'questionnaire' | 'item', readonly string[]>> = {
  questionnaire: [`${R4}artifact-versionAlgorithm`],
  item: ['questionnaire-hidden', 'questionnaire-minOccurs', 'questionnaire-maxOccurs', 'minLength', 'minValue', 'maxValue'].map((name) => `${R4}${name}`),
}

/** A translation's two parts, each with the member its value is in. */
const PARTS: ReadonlyMap<string, string> = new Map([
  ['lang', 'valueCode'],
  ['content', 'valueString'],
])

/** Thrown where the reading stops, and caught by `readOut` alone. */
class Unread extends Error {
  readonly at: string

  constructor(at: string) {
    super(`the read-out cannot read ${at}`)
    this.at = at
  }
}

const isObject = (value: FhirJson | undefined): value is FhirJsonObject => typeof value === 'object' && value !== null && !Array.isArray(value) && !isFhirNumber(value)

function objectAt(value: FhirJson | undefined, at: string): FhirJsonObject {
  if (!isObject(value)) throw new Unread(at)
  return value
}

/** `value` as an object of `names` and no other member: the reading stops at `at` for no object, at the first other member's path. */
function known(value: FhirJson | undefined, names: readonly string[], at: string): FhirJsonObject {
  const object = objectAt(value, at)
  const other = Object.keys(object).find((name) => !names.includes(name))
  if (other !== undefined) throw new Unread(member(at, other))
  return object
}

/** `holder`'s member `name`, as `is` takes it, or undefined where it is absent. */
function optional<T>(holder: FhirJsonObject, name: string, at: string, is: (value: FhirJson) => value is FhirJson & T): T | undefined {
  const value = holder[name]
  if (value === undefined) return undefined
  if (!is(value)) throw new Unread(member(at, name))
  return value
}

const isString = (value: FhirJson): value is string => typeof value === 'string'
const isBoolean = (value: FhirJson): value is boolean => typeof value === 'boolean'
const isList = (value: FhirJson): value is readonly FhirJson[] => Array.isArray(value)
const isItemType = (value: string): value is ItemType => (ITEM_TYPES as readonly string[]).includes(value)
const isOperator = (value: string): value is Operator => (OPERATORS as readonly string[]).includes(value)
const isAnswer = (name: string): name is keyof typeof ANSWERS => Object.hasOwn(ANSWERS, name)

function needed(holder: FhirJsonObject, name: string, at: string): string {
  const value = optional(holder, name, at, isString)
  if (value === undefined) throw new Unread(member(at, name))
  return value
}

const listAt = (holder: FhirJsonObject, name: string, at: string): readonly FhirJson[] => optional(holder, name, at, isList) ?? []

/** That every extension of `holder` is one of `urls`, which the read-out knows and leaves to the JSON. */
function extensionsOf(holder: FhirJsonObject, at: string, urls: readonly string[]): void {
  for (const [index, each] of listAt(holder, 'extension', at).entries()) {
    const path = item(member(at, 'extension'), index)
    const { url } = objectAt(each, path)
    if (typeof url !== 'string' || !urls.includes(url)) throw new Unread(path)
  }
}

/** An item a condition can ask about, with the path it stands at. */
interface Asked {
  readonly holder: FhirJsonObject
  readonly at: string
}

/** What every reading needs: the language asked for, the resource's own, and every item by its linkId. */
interface Scope {
  readonly language: string
  readonly own: string | undefined
  readonly byLinkId: ReadonlyMap<string, Asked>
}

/**
 * The translations `holder`'s `_name` carries, by language, or undefined
 * where it has no `_name`. Every one is read, whatever the page's
 * language, so that bytes refused in one language are refused in all; a
 * second into one language says two things, and stops the reading.
 */
function translationsOf(holder: FhirJsonObject, name: string, at: string): ReadonlyMap<string, string> | undefined {
  const element = holder[`_${name}`]
  if (element === undefined) return undefined
  const path = member(at, `_${name}`)
  const found = new Map<string, string>()
  for (const [index, each] of listAt(known(element, MEMBERS.text, path), 'extension', path).entries()) {
    const at = item(member(path, 'extension'), index)
    // An extension is what its url says it is: another than a translation is one the read-out does not know.
    if (objectAt(each, at).url !== TRANSLATION) throw new Unread(at)
    const extension = known(each, MEMBERS.translation, at)
    const parts = new Map<string, string>()
    for (const [n, part] of listAt(extension, 'extension', at).entries()) {
      const partAt = item(member(at, 'extension'), n)
      const { url } = objectAt(part, partAt)
      const value = typeof url === 'string' ? PARTS.get(url) : undefined
      if (typeof url !== 'string' || value === undefined || parts.has(url)) throw new Unread(partAt)
      parts.set(url, needed(known(part, ['url', value], partAt), value, partAt))
    }
    const [lang, content] = [parts.get('lang'), parts.get('content')]
    if (lang === undefined || content === undefined || found.has(lang)) throw new Unread(at)
    found.set(lang, content)
  }
  return found
}

/** `holder`'s text `name` in the language asked for: its own where that is the resource's, else a translation's, else its own, said to be. */
function wordingOf(holder: FhirJsonObject, name: string, at: string, scope: Scope): Wording | undefined {
  const own = optional(holder, name, at, isString)
  const translations = translationsOf(holder, name, at)
  if (own === undefined) {
    // A translation of no text: the resource's own, which a reader in its language is given, is not there.
    if (translations !== undefined) throw new Unread(member(at, `_${name}`))
    return undefined
  }
  if (scope.own !== undefined && scope.own === scope.language) return { text: own, lang: scope.own, untranslated: false }
  const translated = translations?.get(scope.language)
  return translated === undefined ? { text: own, lang: scope.own, untranslated: true } : { text: translated, lang: scope.language, untranslated: false }
}

function optionsOf(holder: FhirJsonObject, at: string, scope: Scope): ReadOption[] {
  return listAt(holder, 'answerOption', at).map((each, index) => {
    const option = item(member(at, 'answerOption'), index)
    const path = member(option, 'valueCoding')
    const coding = known(known(each, MEMBERS.option, option).valueCoding, MEMBERS.coding, path)
    return { system: optional(coding, 'system', path, isString), code: needed(coding, 'code', path), display: wordingOf(coding, 'display', path, scope) }
  })
}

/**
 * A condition's one answer, read as what its member names; an option as
 * one of its question's, by code system and code, as R4 matches a Coding,
 * and by that option's display.
 */
function answerOf(when: FhirJsonObject, at: string, question: Asked, scope: Scope): ReadAnswer {
  const names = Object.keys(when).filter(isAnswer)
  const [name] = names
  if (name === undefined || names.length > 1) throw new Unread(at)
  const value = when[name]
  const path = member(at, name)
  const kind = ANSWERS[name]
  if (kind === 'boolean' && typeof value === 'boolean') return { kind, value }
  if (kind === 'number' && isFhirNumber(value)) return { kind, value: value.text }
  if ((kind === 'moment' || kind === 'string') && typeof value === 'string') return { kind, value }
  if (kind !== 'option') throw new Unread(path)
  const coding = known(value, MEMBERS.coding, path)
  const [system, code] = [optional(coding, 'system', path, isString), needed(coding, 'code', path)]
  const option = optionsOf(question.holder, question.at, scope).find((each) => each.system === system && each.code === code)
  if (option === undefined) throw new Unread(path)
  return { kind, code, display: option.display }
}

/** Which answers an operator takes: `exists` a yes or no, an ordering a number or a moment, the rest any. */
const TAKES: Readonly<Partial<Record<Operator, readonly ReadAnswer['kind'][]>>> = {
  exists: ['boolean'],
  '>': ['number', 'moment'],
  '<': ['number', 'moment'],
  '>=': ['number', 'moment'],
  '<=': ['number', 'moment'],
}

function conditionOf(each: FhirJson, at: string, scope: Scope): ReadCondition {
  const when = known(each, MEMBERS.condition, at)
  const question = needed(when, 'question', at)
  const operator = needed(when, 'operator', at)
  if (!isOperator(operator)) throw new Unread(member(at, 'operator'))
  // A condition on a question the resource does not hold says nothing a reader could follow.
  const asked = scope.byLinkId.get(question)
  if (asked === undefined) throw new Unread(member(at, 'question'))
  const answer = answerOf(when, at, asked, scope)
  if (TAKES[operator]?.includes(answer.kind) === false) throw new Unread(at)
  return { question, questionText: wordingOf(asked.holder, 'text', asked.at, scope), operator, answer }
}

function itemOf(each: FhirJson, at: string, scope: Scope): ReadItem {
  const holder = known(each, MEMBERS.item, at)
  extensionsOf(holder, at, EXTENSIONS.item)
  const type = needed(holder, 'type', at)
  if (!isItemType(type)) throw new Unread(member(at, 'type'))
  const conditions = listAt(holder, 'enableWhen', at).map((when, index) => conditionOf(when, item(member(at, 'enableWhen'), index), scope))
  const behaviour = optional(holder, 'enableBehavior', at, isString)
  // R4's que-12: more than one condition says how they join, and only then.
  if ((conditions.length > 1) !== (behaviour !== undefined) || (behaviour !== undefined && behaviour !== 'all' && behaviour !== 'any')) throw new Unread(at)
  return {
    linkId: needed(holder, 'linkId', at),
    text: wordingOf(holder, 'text', at, scope),
    type,
    required: optional(holder, 'required', at, isBoolean) ?? false,
    repeats: optional(holder, 'repeats', at, isBoolean) ?? false,
    options: optionsOf(holder, at, scope),
    conditions,
    behaviour,
    items: itemsOf(holder, at, scope),
  }
}

const itemsOf = (holder: FhirJsonObject, at: string, scope: Scope): ReadItem[] => listAt(holder, 'item', at).map((each, index) => itemOf(each, item(member(at, 'item'), index), scope))

/** Every item of `holder`, nested or not, by its linkId, which R4 holds unique (que-2): a second of one names no item a condition could mean. */
function linkIds(holder: FhirJsonObject, at: string, found = new Map<string, Asked>()): Map<string, Asked> {
  for (const [index, each] of listAt(holder, 'item', at).entries()) {
    const path = item(member(at, 'item'), index)
    const child = objectAt(each, path)
    const linkId = needed(child, 'linkId', path)
    if (found.has(linkId)) throw new Unread(path)
    found.set(linkId, { holder: child, at: path })
    linkIds(child, path, found)
  }
  return found
}

/**
 * The Questionnaire `json` holds, read out in `language`, a BCP 47 tag in
 * its canonical case, as the resource's own and its translations' are
 * written; or where the reading stopped.
 */
export function readOut(json: string, language: string): ReadOut {
  try {
    const resource = objectAt(readJson(json), '$')
    if (resource.resourceType !== 'Questionnaire') throw new Unread(member('$', 'resourceType'))
    const root = known(resource, MEMBERS.questionnaire, '$')
    extensionsOf(root, '$', EXTENSIONS.questionnaire)
    const scope: Scope = { language, own: optional(root, 'language', '$', isString), byLinkId: linkIds(root, '$') }
    return { ok: true, title: wordingOf(root, 'title', '$', scope), items: itemsOf(root, '$', scope) }
  } catch (error) {
    // Where the reading stopped. Whatever else stops it stops it at the
    // root: bytes readJson refuses, and items nested deeper than this
    // reading's recursion goes, which readJson reads with a stack of its
    // own. The page then shows the JSON alone, as for any refusal, rather
    // than stop the demo.
    return { ok: false, at: error instanceof Unread ? error.at : '$' }
  }
}
