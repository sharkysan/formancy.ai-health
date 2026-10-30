// @vitest-environment node
import { toQuestionnaire } from '@formancy/health-questionnaire'
import type { FormSchema } from '@formancy/spec'
import { describe, expect, test } from 'vitest'
import { intake, intakeContext, minimal, minimalContext } from '../../../scripts/validator/forms.mjs'
import { sampleOf } from './build/plugin.js'
import { attempt, questionnaireOf } from './exports.js'
import { ITEM_TYPES, OPERATORS, readOut, type ReadItem, type ReadOut, type Wording } from './read-out.js'

/**
 * The Questionnaire read out, as the page shows it beside its JSON: a pure
 * reading of the bytes health-questionnaire wrote, in one of the page's
 * languages. Read here from the Questionnaires the package, as built,
 * makes of the corpus's forms -- the demo's referral; the intake, whose
 * items nest, whose conditions hold every operator R4 has and which has no
 * English; and the minimal form, which names no language -- and from
 * copies of their bytes changed in one place, each for what it breaks.
 */
const json = (form: unknown, context: unknown): string => {
  // The corpus's forms are plain JavaScript, typed by inference; the
  // package reads them as formancy's spec types them, as the gate does.
  const made = attempt(
    () => toQuestionnaire(form as FormSchema, context as Parameters<typeof toQuestionnaire>[1]),
    ({ questionnaire }) => questionnaire,
  ).outcome
  if (made.kind !== 'made') throw new Error(`the package did not make the corpus's Questionnaire: ${made.kind}`)
  return made.json
}

const demo = ((): string => {
  const made = questionnaireOf(sampleOf())
  if (made.kind !== 'made') throw new Error('the package did not make the demo’s Questionnaire')
  return made.json
})()
const intakeJson = json(intake, intakeContext)
const minimalJson = json(minimal, minimalContext)

/** What was read, or the test fails saying where the reading stopped. */
function read(bytes: string, language: string): Extract<ReadOut, { ok: true }> {
  const out = readOut(bytes, language)
  if (!out.ok) throw new Error(`the read-out stopped at ${out.at}`)
  return out
}

/** Every item, depth first, in document order. */
const flat = (items: readonly ReadItem[]): ReadItem[] => items.flatMap((each) => [each, ...flat(each.items)])

/** The item of `linkId`. */
function itemOf(out: Extract<ReadOut, { ok: true }>, linkId: string): ReadItem {
  const found = flat(out.items).find((each) => each.linkId === linkId)
  if (found === undefined) throw new Error(`no item ${linkId} was read out`)
  return found
}

/** An outline: each item's linkId, its nesting as indentation. */
const outline = (items: readonly ReadItem[], depth = 0): string[] =>
  items.flatMap((each) => [`${'  '.repeat(depth)}${each.linkId}`, ...outline(each.items, depth + 1)])

const translated = (text: string, lang: string): Wording => ({ text, lang, untranslated: false })

describe("the demo's Questionnaire, read out", () => {
  // The read-out stands for the resource below it: an item left out, or
  // put in another order, would be a form the Questionnaire does not say.
  test('lists every item in its order, by its linkId, as the resource holds them', () => {
    expect(outline(read(demo, 'en').items)).toEqual([
      'question',
      'specialty',
      'language',
      'interpreter',
      'interpreter_language',
      'available_from',
      'contact_phone',
    ])
  })

  // The page reads in four languages, and so does the Questionnaire: the
  // resource's own text where the page is in the resource's language, a
  // translation extension's in every other.
  test.each([
    ['de-CH', 'Fragestellung an die Fachperson', 'Dolmetschen nötig'],
    ['fr', 'Question au spécialiste', 'Interprète nécessaire'],
    ['it', 'Quesito per lo specialista', 'Interprete necessario'],
    ['en', 'Question for the specialist', 'An interpreter is needed'],
  ])("gives each item's text in %s, from the resource", (language, question, interpreter) => {
    const out = read(demo, language)
    expect(itemOf(out, 'question').text).toEqual(translated(question, language))
    expect(itemOf(out, 'interpreter').text).toEqual(translated(interpreter, language))
  })

  // Each fact the read-out states is the resource's: a type in its R4
  // code, required and repeats as the resource says them, absent read as
  // false, as R4 reads them.
  test('states each item’s type, and whether it is required or repeats', () => {
    const out = read(demo, 'en')
    expect(
      flat(out.items).map(({ linkId, type, required, repeats }) => `${linkId}: ${type}${required ? ', required' : ''}${repeats ? ', repeats' : ''}`),
    ).toEqual([
      'question: text, required',
      'specialty: choice, required',
      'language: choice',
      'interpreter: boolean',
      'interpreter_language: string',
      'available_from: date',
      'contact_phone: string',
    ])
  })

  // An option is what a person picks: its display in the page's
  // language, beside its code system and code, the answer the response
  // writes and a condition names it by.
  test("reads each option's display in the page's language, beside its code", () => {
    const system = 'https://forms.synthetic.invalid/Questionnaire/demo-referral/specialty'
    expect(itemOf(read(demo, 'it'), 'specialty').options).toEqual([
      { system, code: 'dermatology', display: translated('Dermatologia', 'it') },
      { system, code: 'cardiology', display: translated('Cardiologia', 'it') },
      { system, code: 'orthopaedics', display: translated('Ortopedia', 'it') },
      { system, code: 'ophthalmology', display: translated('Oftalmologia', 'it') },
    ])
  })

  // The one rule of the demo's form, as the resource says it: shown when
  // the box is ticked, the question named by its text in the page's
  // language and by its linkId.
  test('reads its condition: the question, by its text and linkId, the operator and the answer', () => {
    const item = itemOf(read(demo, 'fr'), 'interpreter_language')
    expect(item.conditions).toEqual([
      { question: 'interpreter', questionText: translated('Interprète nécessaire', 'fr'), operator: '=', answer: { kind: 'boolean', value: true } },
    ])
    expect(item.behaviour).toBeUndefined()
  })

  // The title is a plain string in formancy's spec 0.6.0, written
  // untranslated (0006): read in French, it is the resource's own German,
  // and said to be, in the resource's language; in Swiss German it is no
  // stand-in for anything.
  test('gives the untranslated title as the resource’s own, in its language, and says so', () => {
    expect(read(demo, 'fr').title).toEqual({ text: 'Zuweisung', lang: 'de-CH', untranslated: true })
    expect(read(demo, 'de-CH').title).toEqual(translated('Zuweisung', 'de-CH'))
  })
})

describe('the read-out reads the resource, and nothing else', () => {
  // A read-out of the form would agree with the Questionnaire only while
  // the package maps the form faithfully, and nobody would find out the
  // day it did not. These bytes are the package's, changed in one text:
  // the read-out says what the bytes say.
  test('says what the bytes say, where they differ from the form', () => {
    const changed = demo.replace('"valueString":"Question au spécialiste"', '"valueString":"Une autre question"')
    expect(changed).not.toBe(demo)
    expect(itemOf(read(changed, 'fr'), 'question').text).toEqual(translated('Une autre question', 'fr'))
  })

  // A text missing in one language is that text's: the read-out falls
  // back for it alone, says so, and names the language it shows instead,
  // so the page can mark it.
  test('falls back to the resource’s own text for a text it holds no translation of, and for that text alone', () => {
    const italian =
      '{"url":"http://hl7.org/fhir/StructureDefinition/translation","extension":[{"url":"lang","valueCode":"it"},{"url":"content","valueString":"Quesito per lo specialista"}]},'
    const changed = demo.replace(italian, '')
    expect(changed).not.toBe(demo)
    const out = read(changed, 'it')
    expect(itemOf(out, 'question').text).toEqual({ text: 'Fragestellung an die Fachperson', lang: 'de-CH', untranslated: true })
    expect(itemOf(out, 'specialty').text).toEqual(translated('Specialità', 'it'))
  })

  // A decimal in a condition is its digits as the resource writes them,
  // never a JavaScript number, which would say 150 where it says 150.0
  // (0004).
  test('keeps a decimal answer’s digits as written', () => {
    const changed = intakeJson.replace('"answerDecimal":150', '"answerDecimal":150.0')
    expect(changed).not.toBe(intakeJson)
    expect(itemOf(read(changed, 'de-CH'), 'weight_note').conditions[0]?.answer).toEqual({ kind: 'number', value: '150.0' })
  })
})

describe("the corpus's intake, read out", () => {
  // Groups, pages and repeaters are items holding items: flattened, a
  // reader could not tell which questions a repeating group asks again.
  test('nests its items as the resource nests them', () => {
    const lines = outline(read(intakeJson, 'de-CH').items)
    expect(lines.slice(0, 3)).toEqual(['about', '  given_name', '  family_name'])
    expect(lines).toContain('  address')
    expect(lines).toContain('    city')
    expect(lines.slice(-2)).toEqual(['contact_page', '  contact_phone'])
    expect(itemOf(read(intakeJson, 'de-CH'), 'contacts')).toMatchObject({
      type: 'group',
      required: true,
      repeats: true,
      items: [{ linkId: 'contact_name' }, { linkId: 'contact_calls' }],
    })
  })

  // The intake has no English: read in English, every text is the
  // resource's own Swiss German, each said to be.
  test('falls back to the resource’s own text, in its language, where the resource has no translation into the page’s', () => {
    const texts = flat(read(intakeJson, 'en').items).flatMap(({ text }) => (text === undefined ? [] : [text]))
    expect(texts.length).toBeGreaterThan(20)
    expect(texts.filter(({ lang, untranslated }) => lang !== 'de-CH' || !untranslated)).toEqual([])
    expect(itemOf(read(intakeJson, 'en'), 'about').text).toEqual({ text: 'Angaben', lang: 'de-CH', untranslated: true })
  })

  // A hidden field has no text, and an item need not have one: it is read
  // out by its linkId alone, never given a text it does not have.
  test('reads an item with no text as having none', () => {
    expect(itemOf(read(intakeJson, 'fr'), 'campaign').text).toBeUndefined()
  })

  // Every operator R4 has, as the intake's conditions write them: each with
  // the answer of its question's type, an option by its display in the
  // page's language, and how several join.
  test('reads every operator R4 has, each with the answer of its type', () => {
    const out = read(intakeJson, 'it')
    const said = (linkId: string) => ({
      behaviour: itemOf(out, linkId).behaviour,
      conditions: itemOf(out, linkId).conditions.map(({ question, operator, answer }) => ({ question, operator, answer })),
    })
    const unanswered = (question: string) => ({ question, operator: 'exists', answer: { kind: 'boolean', value: false } })
    expect(said('weight_note')).toEqual({
      behaviour: 'any',
      conditions: [{ question: 'weight', operator: '>=', answer: { kind: 'number', value: '150' } }, unanswered('weight')],
    })
    expect(said('canton_detail')).toEqual({
      behaviour: undefined,
      conditions: [{ question: 'canton', operator: '=', answer: { kind: 'option', code: 'TI', display: translated('Ticino', 'it') } }],
    })
    expect(said('consent_detail')).toEqual({
      behaviour: 'all',
      conditions: [
        { question: 'consent', operator: '=', answer: { kind: 'boolean', value: true } },
        { question: 'canton', operator: '=', answer: { kind: 'option', code: 'BE', display: translated('Berna', 'it') } },
      ],
    })
    expect(said('history_detail').conditions[0]).toEqual({ question: 'history', operator: '!=', answer: { kind: 'string', value: 'keine' } })
    expect(said('children_detail').conditions[0]).toEqual({ question: 'children', operator: '>', answer: { kind: 'number', value: '2' } })
    expect(said('guardian').conditions[0]).toEqual({ question: 'born', operator: '>', answer: { kind: 'moment', value: '2008-10-17' } })
    expect(said('early_arrival').conditions[0]).toEqual({ question: 'arrival', operator: '<=', answer: { kind: 'moment', value: '07:30:00' } })
    expect(said('seen_detail').conditions[0]).toEqual({ question: 'seen', operator: '<', answer: { kind: 'moment', value: '2026-06-01T00:00:00Z' } })
    expect(new Set(flat(out.items).flatMap(({ conditions }) => conditions.map(({ operator }) => operator)))).toEqual(new Set(OPERATORS))
  })

  // A condition names its question by the question's text, wherever the
  // question stands: the contact page's names a question inside the page
  // before it.
  test('names a question by its text, wherever in the resource it stands', () => {
    expect(itemOf(read(intakeJson, 'fr'), 'contact_page').conditions[0]?.questionText).toEqual(translated('Urgence', 'fr'))
  })

  // The page words every item type the read-out reads, and reads every
  // type the package writes: the intake holds every field type version 1
  // maps (scripts/validator/forms.mjs), so a type the package came to
  // write would stop its read-out, and a word for a type it never writes
  // would show here.
  test('holds every item type the read-out reads, and no other', () => {
    expect(new Set(flat(read(intakeJson, 'de-CH').items).map(({ type }) => type))).toEqual(new Set(ITEM_TYPES))
  })
})

describe('a Questionnaire that names no language', () => {
  // Without `language` the resource does not say what its texts are in:
  // shown in any language, each is its own, in a language it does not
  // name, never claimed to be the page's.
  test('gives every text as its own, in no language it names', () => {
    const out = read(minimalJson, 'en')
    expect(out.title).toEqual({ text: 'Minimal', lang: undefined, untranslated: true })
    expect(itemOf(out, 'reason').text).toEqual({ text: 'Reason', lang: undefined, untranslated: true })
    expect(outline(out.items).slice(-6)).toEqual(['box', '  inside', 'rows', '  row_note', 'last', '  remarks'])
    expect(itemOf(out, 'rows').repeats).toBe(true)
  })
})

describe('what the read-out cannot read', () => {
  // Fail closed: a read-out that skipped what it cannot read would show a
  // form the resource does not say. Each is refused whole, at the path
  // where the reading stopped, and the page shows its JSON alone.
  test.each([
    ['bytes that are no JSON', demo, demo.slice(0, 1), '$'],
    ['a resource that is no Questionnaire', demo, demo.replace('"resourceType":"Questionnaire"', '"resourceType":"Patient"'), '$.resourceType'],
    ['an item type the package does not write', demo, demo.replace('"type":"string"', '"type":"url"'), '$.item[4].type'],
    ['an ordering on a yes or no', demo, demo.replace('"operator":"="', '"operator":">"'), '$.item[4].enableWhen[0]'],
    ['an operator R4 does not have', demo, demo.replace('"operator":"="', '"operator":"~"'), '$.item[4].enableWhen[0].operator'],
    ['several conditions with no word for how they join', intakeJson, intakeJson.replace(',"enableBehavior":"all"', ''), '$.item[0].item[10]'],
    [
      'a condition on a question the resource does not hold',
      demo,
      demo.replace('"question":"interpreter"', '"question":"nobody"'),
      '$.item[4].enableWhen[0].question',
    ],
    ['two items of one linkId, which R4 forbids (que-2)', demo, demo.replace('"linkId":"contact_phone"', '"linkId":"question"'), '$.item[6]'],
  ])('refuses %s, where it stops', (_name, source, bytes, at) => {
    refused(source, bytes, at)
  })

  // An answer is read as the type its member names, and an operator takes
  // only the answers R4 gives it a meaning for: a yes or no read where the
  // bytes hold a text, an ordering of a yes or no, or a second answer
  // passed over, would be a condition the resource does not state.
  test.each([
    [
      '`exists` with an answer other than a yes or no',
      intakeJson,
      intakeJson.replace('{"question":"weight","operator":"exists","answerBoolean":false}', '{"question":"weight","operator":"exists","answerString":"x"}'),
      '$.item[0].item[5].enableWhen[1]',
    ],
    ['`<` on a yes or no', demo, demo.replace('"operator":"="', '"operator":"<"'), '$.item[4].enableWhen[0]'],
    ['`>=` on a yes or no', demo, demo.replace('"operator":"="', '"operator":">="'), '$.item[4].enableWhen[0]'],
    ['`<=` on a yes or no', demo, demo.replace('"operator":"="', '"operator":"<="'), '$.item[4].enableWhen[0]'],
    ['an `answerBoolean` that is no yes or no', demo, demo.replace('"answerBoolean":true', '"answerBoolean":"true"'), '$.item[4].enableWhen[0].answerBoolean'],
    [
      'an `answerString` that is no text',
      intakeJson,
      intakeJson.replace('"answerString":"keine"', '"answerString":true'),
      '$.item[0].item[21].enableWhen[0].answerString',
    ],
    [
      'an `answerDate` that is no text',
      intakeJson,
      intakeJson.replace('"answerDate":"2008-10-17"', '"answerDate":20081017'),
      '$.item[0].item[23].enableWhen[0].answerDate',
    ],
    [
      'an `answerDecimal` that is no number',
      intakeJson,
      intakeJson.replace('"answerDecimal":150', '"answerDecimal":"150"'),
      '$.item[0].item[5].enableWhen[0].answerDecimal',
    ],
    ['a condition with two answers', demo, demo.replace('"answerBoolean":true', '"answerBoolean":true,"answerString":"x"'), '$.item[4].enableWhen[0]'],
    ['a condition with no answer', demo, demo.replace(',"answerBoolean":true', ''), '$.item[4].enableWhen[0]'],
    ['a way of joining conditions R4 does not have', intakeJson, intakeJson.replace('"enableBehavior":"all"', '"enableBehavior":"some"'), '$.item[0].item[10]'],
    [
      'a way of joining one condition, which R4 gives only several (que-12)',
      demo,
      demo.replace('"answerBoolean":true}]', '"answerBoolean":true}],"enableBehavior":"all"'),
      '$.item[4]',
    ],
    ['a `required` that is no yes or no', demo, demo.replace('"required":true', '"required":"true"'), '$.item[0].required'],
    ['a `repeats` that is no yes or no', intakeJson, intakeJson.replace('"repeats":true', '"repeats":1'), '$.item[0].item[12].repeats'],
  ])('refuses %s, where it stops', (_name, source, bytes, at) => {
    refused(source, bytes, at)
  })

  // A condition on an option names it by its code system and its code, as
  // R4 matches a Coding: by the code alone, the read-out would show an
  // answer the question cannot be given as one of its options, and say the
  // item is shown by a condition that never holds. One its question does
  // not offer is no option to name.
  test.each([
    ['an option of another code system than its question’s', intakeJson.replace('/referral-intake/canton","code":"TI"', '/other","code":"TI"')],
    ['an option its question does not offer', intakeJson.replace('/referral-intake/canton","code":"TI"', '/referral-intake/canton","code":"ZH"')],
  ])('refuses a condition on %s', (_name, bytes) => {
    refused(intakeJson, bytes, '$.item[0].item[9].enableWhen[0].answerCoding')
  })

  // What the read-out does not know it does not pass over: a member or an
  // extension it reads nothing of could change what an item asks -- the
  // answers it takes, when it is shown, what it starts with -- and the
  // read-out would say otherwise without a word. It knows what
  // health-questionnaire writes, and leaves to the JSON, as the page's
  // words say, what of that it does not read; another maker's
  // Questionnaire stops it where it first meets the rest.
  test.each([
    [
      'a member of the Questionnaire it does not know',
      demo,
      demo.replace('"status":"active",', '"status":"active","subjectType":["Patient"],'),
      '$.subjectType',
    ],
    [
      'an extension of the Questionnaire it does not know',
      demo,
      demo.replace('StructureDefinition/artifact-versionAlgorithm', 'StructureDefinition/artifact-copyrightLabel'),
      '$.extension[0]',
    ],
    [
      'answers from a value set',
      demo,
      demo.replace('"linkId":"specialty",', '"linkId":"specialty","answerValueSet":"https://example.invalid/ValueSet/specialty",'),
      '$.item[1].answerValueSet',
    ],
    ['an initial answer', demo, demo.replace('"maxLength":40', '"maxLength":40,"initial":[{"valueString":"x"}]'), '$.item[6].initial'],
    [
      'a modifier extension',
      demo,
      demo.replace(
        '"linkId":"question",',
        '"modifierExtension":[{"url":"https://example.invalid/StructureDefinition/x","valueBoolean":true}],"linkId":"question",',
      ),
      '$.item[0].modifierExtension',
    ],
    [
      'an item’s extension it does not know, an expression that shows the item',
      demo,
      demo.replace(
        '"valueDate":"2026-01-01"}',
        '"valueDate":"2026-01-01"},{"url":"http://hl7.org/fhir/uv/sdc/StructureDefinition/sdc-questionnaire-enableWhenExpression","valueExpression":{"language":"text/fhirpath","expression":"false"}}',
      ),
      '$.item[5].extension[1]',
    ],
    [
      'a member of a condition it does not know',
      demo,
      demo.replace('"answerBoolean":true}', '"answerBoolean":true,"answerQuantity":{"value":1}}'),
      '$.item[4].enableWhen[0].answerQuantity',
    ],
    [
      'a member of an option it does not know',
      demo,
      demo.replace(
        '{"valueCoding":{"system":"https://forms.synthetic.invalid/Questionnaire/demo-referral/specialty","code":"dermatology"',
        '{"initialSelected":true,"valueCoding":{"system":"https://forms.synthetic.invalid/Questionnaire/demo-referral/specialty","code":"dermatology"',
      ),
      '$.item[1].answerOption[0].initialSelected',
    ],
    [
      'a member of an option’s coding it does not know',
      demo,
      demo.replace('"code":"dermatology",', '"code":"dermatology","version":"1",'),
      '$.item[1].answerOption[0].valueCoding.version',
    ],
    [
      'an extension of a text other than a translation',
      demo,
      demo.replace(
        '"_text":{"extension":[',
        '"_text":{"extension":[{"url":"http://hl7.org/fhir/StructureDefinition/rendering-xhtml","valueString":"<b>x</b>"},',
      ),
      '$.item[0]._text.extension[0]',
    ],
    [
      'a part of a translation other than its language and its text',
      demo,
      demo.replace(
        '{"url":"content","valueString":"Question au spécialiste"}',
        '{"url":"content","valueString":"Question au spécialiste"},{"url":"note","valueString":"x"}',
      ),
      '$.item[0]._text.extension[0].extension[2]',
    ],
    ['a translation of a text the item does not have', demo, demo.replace('"text":"Fragestellung an die Fachperson",', ''), '$.item[0]._text'],
  ])('refuses %s, where it stops', (_name, source, bytes, at) => {
    refused(source, bytes, at)
  })

  // Shapes that are not the resource's, each read in English though what
  // is broken is a French translation or the resource's own: a reading
  // that checked only what the page's language asks for would read the
  // same bytes in one language and refuse them in another.
  test.each([
    ['an item that is no object', demo, `${demo.slice(0, demo.indexOf('{"linkId":"contact_phone"'))}1]}`, '$.item[6]'],
    ['a translation with no text', demo, demo.replace(',{"url":"content","valueString":"Question au spécialiste"}', ''), '$.item[0]._text.extension[0]'],
    [
      'a part of a translation with no url',
      demo,
      demo.replace('{"url":"lang","valueCode":"fr"}', '{"valueCode":"fr"}'),
      '$.item[0]._text.extension[0].extension[0]',
    ],
    [
      'a translation that names its language twice',
      demo,
      demo.replace('{"url":"lang","valueCode":"fr"},', '{"url":"lang","valueCode":"fr"},{"url":"lang","valueCode":"it"},'),
      '$.item[0]._text.extension[0].extension[1]',
    ],
    [
      'two translations into one language',
      demo,
      demo.replace(
        '{"url":"lang","valueCode":"fr"},{"url":"content","valueString":"Question au spécialiste"}',
        '{"url":"lang","valueCode":"it"},{"url":"content","valueString":"Question au spécialiste"}',
      ),
      '$.item[0]._text.extension[1]',
    ],
    ['an option with no code', demo, demo.replace('"code":"dermatology",', ''), '$.item[1].answerOption[0].valueCoding.code'],
  ])('refuses %s, where it stops', (_name, source, bytes, at) => {
    refused(source, bytes, at)
  })

  // readJson reads a document nested deeper than a call stack, with a
  // stack of its own (0004), and the read-out's reading of the items
  // recurses: thrown, its error would stop the whole demo where the JSON
  // alone should stand. It stops at the root instead.
  test('stops at the root where the items nest deeper than its reading goes, and reads the same shape shallow', () => {
    const nested = (depth: number): string =>
      `{"resourceType":"Questionnaire","status":"active","item":[${Array.from({ length: depth }, (_, level) => `{"linkId":"g${String(level)}","type":"group","item":[`).join('')}{"linkId":"leaf","type":"display","text":"x"}${']}'.repeat(depth)}]}`
    expect(readOut(nested(5), 'en').ok).toBe(true)
    expect(readOut(nested(100_000), 'en')).toEqual({ ok: false, at: '$' })
  })
})

/** That `bytes`, `source` changed in one place, are refused at `at` in English, and `source` is not. */
function refused(source: string, bytes: string, at: string): void {
  // A guard on the guard: the bytes are changed, and the source was read.
  expect(bytes).not.toBe(source)
  expect(readOut(source, 'en').ok).toBe(true)
  expect(readOut(bytes, 'en')).toEqual({ ok: false, at })
}
