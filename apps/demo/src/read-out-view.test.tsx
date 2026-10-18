import { toQuestionnaire } from '@formancy/health-questionnaire'
import type { FormSchema } from '@formancy/spec'
import { cleanup, render, screen, within } from '@testing-library/react'
import { afterEach, describe, expect, test } from 'vitest'
import { intake, intakeContext, minimal, minimalContext } from '../../../scripts/validator/forms.mjs'
import { attempt } from './exports.js'
import { ReadOutView } from './read-out-view.js'
import { unnamed, violations } from './test-accessible.js'
import { WORDS } from './words/index.js'

/**
 * The read-out as the page draws it, of Questionnaires the demo's own does
 * not reach: the corpus's intake, whose items nest and whose conditions
 * hold every operator R4 has, and which has no English; and the minimal
 * form's, which names no language. By role and accessible name, with axe;
 * a text in another language than the page's is known by its `lang`, and
 * a quotation by its `<q>`, which the accessibility tree does not give.
 */
const en = WORDS.en

const json = (form: unknown, context: unknown): string => {
  // The corpus's forms are plain JavaScript, typed by inference.
  const made = attempt(
    () => toQuestionnaire(form as FormSchema, context as Parameters<typeof toQuestionnaire>[1]),
    ({ questionnaire }) => questionnaire,
  ).outcome
  if (made.kind !== 'made') throw new Error(`the package did not make the corpus's Questionnaire: ${made.kind}`)
  return made.json
}

afterEach(cleanup)

/**
 * The facts of the item named `name`, a leaf, by term: its description
 * list's terms and their definitions, as the accessibility tree gives
 * them.
 */
function facts(name: string): Record<string, string | null> {
  const item = screen.getByRole('listitem', { name })
  const definitions = within(item).getAllByRole('definition')
  return Object.fromEntries(within(item).getAllByRole('term').map((term, index) => [term.textContent ?? '', definitions[index]?.textContent ?? null]))
}

/** The texts of the conditions that show the item named `name`. */
const conditions = (name: string): (string | null)[] =>
  within(within(screen.getByRole('listitem', { name })).getByRole('list', { name: en.readOut.shownWhen }))
    .getAllByRole('listitem')
    .map((each) => each.textContent)

describe("the corpus's intake, drawn", () => {
  // Nested items drawn flat would hide which questions a group, or a
  // repeating group, asks; a heading level per depth, and a list inside
  // its group's item, say it.
  test('nests each group’s items inside its own, a heading level deeper', async () => {
    render(<ReadOutView json={json(intake, intakeContext)} language="en" words={en} targetOf={() => undefined} />)
    const address = screen.getByRole('listitem', { name: 'Adresse' })
    expect(within(address).getByRole('listitem', { name: 'Ort' })).toBeDefined()
    expect(screen.getByRole('heading', { name: 'Angaben' }).tagName).toBe('H4')
    expect(screen.getByRole('heading', { name: 'Adresse' }).tagName).toBe('H5')
    expect(screen.getByRole('heading', { name: 'Ort' }).tagName).toBe('H6')
    expect([...(await violations()), ...unnamed()]).toEqual([])
  })

  // Every operator in words, with the answer of its type: an ordering of
  // a number said as one, of a date as one, an option by its display, and
  // how several conditions join. Said otherwise, a reader would take the
  // condition for another.
  test('says each condition in words, with how several join', () => {
    render(<ReadOutView json={json(intake, intakeContext)} language="en" words={en} targetOf={() => undefined} />)
    const weight = 'Gewicht in Kilogramm (weight)'
    expect(conditions('Bemerkung zum Gewicht')).toEqual([`${weight} ${en.readOut.numbers['>=']} 150`, `${weight} ${en.readOut.unanswered}`])
    expect(within(screen.getByRole('listitem', { name: 'Bemerkung zum Gewicht' })).getByText(en.readOut.joined.any)).toBeDefined()
    expect(within(screen.getByRole('listitem', { name: 'Einzelheiten' })).getByText(en.readOut.joined.all)).toBeDefined()
    expect(conditions('Einzelheiten')).toEqual([`Einverstanden (consent) ${en.readOut.is} ${en.readOut.yes}`, `Kanton (canton) ${en.readOut.is} Bern`])
    expect(conditions('Einzelheiten zur Vorgeschichte')[0]).toBe(`Vorgeschichte (history) ${en.readOut.isNot} keine`)
    expect(conditions('Angaben zu den Kindern')[0]).toBe(`Anzahl Kinder (children) ${en.readOut.numbers['>']} 2`)
    expect(conditions('Gesetzliche Vertretung')[0]).toBe(`Geburtsdatum (born) ${en.readOut.moments['>']} 2008-10-17`)
    expect(conditions('Grund der frühen Ankunft')[0]).toBe(`Ankunftszeit (arrival) ${en.readOut.moments['<=']} 07:30:00`)
    expect(conditions('Bemerkung zum Datum')[0]).toBe(`Gesehen am (seen) ${en.readOut.moments['<']} 2026-06-01T00:00:00Z`)
  })

  // What no corpus Questionnaire says, in the package's bytes changed in
  // three places: a question answered, a no, and an option with no
  // display, which is read out by its code, never given a display.
  test('says a question answered, a no, and an option with no display by its code', () => {
    // The consent's yes made a no first: the answered question's yes would
    // otherwise be the first one. Bern's display goes with its
    // translations, up to the `}]}]}` that closes them: a translation of
    // no display is refused (read-out.test.ts).
    const changed = json(intake, intakeContext)
      .replace('"answerBoolean":true}', '"answerBoolean":false}')
      .replace('"operator":"exists","answerBoolean":false', '"operator":"exists","answerBoolean":true')
      .replace(/"code":"BE","display":"Bern","_display":\{.*?\}\]\}\]\}/, '"code":"BE"')
    render(<ReadOutView json={changed} language="en" words={en} targetOf={() => undefined} />)
    expect(conditions('Bemerkung zum Gewicht')[1]).toBe(`Gewicht in Kilogramm (weight) ${en.readOut.answered}`)
    expect(conditions('Einzelheiten')).toEqual([`Einverstanden (consent) ${en.readOut.is} ${en.readOut.no}`, `Kanton (canton) ${en.readOut.is} BE`])
    const options = within(screen.getByRole('listitem', { name: 'Kanton' })).getByRole('list', { name: en.readOut.options })
    expect(within(options).getAllByRole('listitem')[0]?.textContent).toBe('BE')
  })

  // The intake has no English: each text stands in its own Swiss German,
  // marked so for a screen reader, and said to be; an item with no text is
  // headed as having none, never by a text it does not have.
  test('marks each untranslated text with its language and says so, and heads an item with no text as having none', () => {
    render(<ReadOutView json={json(intake, intakeContext)} language="en" words={en} targetOf={() => undefined} />)
    expect(screen.getByRole('heading', { name: 'Kanton' }).querySelector('[lang]')?.getAttribute('lang')).toBe('de-CH')
    expect(within(screen.getByRole('listitem', { name: 'Kanton' })).getAllByText(`(${en.readOut.untranslated('de-CH')})`)).toHaveLength(4)
    expect(screen.getByRole('heading', { name: en.readOut.noText })).toBeDefined()
  })

  // Each fact the read-out states is drawn as it is read: a type in words
  // beside its R4 code, and a yes or a no for whether it is required and
  // whether it repeats. Drawn as a no for every item, or without the code,
  // the page would say less than the resource, or other than it.
  test("states each item's type in words beside its R4 code, and whether it is required and whether it repeats", () => {
    render(<ReadOutView json={json(intake, intakeContext)} language="en" words={en} targetOf={() => undefined} />)
    const w = en.readOut
    expect(facts('Themen')).toMatchObject({ linkId: 'topics', [w.type]: `${w.types.choice} (choice)`, [w.required]: w.yes, [w.repeats]: w.yes })
    expect(facts('Ort')).toMatchObject({ linkId: 'city', [w.type]: `${w.types.string} (string)`, [w.required]: w.no, [w.repeats]: w.no })
    expect(within(screen.getByRole('listitem', { name: 'Themen' })).getByText('choice').tagName).toBe('CODE')
  })

  // A condition's question and the option it names are the resource's
  // texts, untranslated on the English page as the item's own are: each
  // marked with its language inside its quotation, for a screen reader to
  // read it in.
  test("marks the language of a condition's question and of the option it names", () => {
    render(<ReadOutView json={json(intake, intakeContext)} language="en" words={en} targetOf={() => undefined} />)
    const [, canton] = within(within(screen.getByRole('listitem', { name: 'Einzelheiten' })).getByRole('list', { name: en.readOut.shownWhen })).getAllByRole('listitem')
    expect([...(canton?.querySelectorAll('q [lang]') ?? [])].map((each) => [each.textContent, each.getAttribute('lang')])).toEqual([
      ['Kanton', 'de-CH'],
      ['Bern', 'de-CH'],
    ])
  })
})

describe('what a Questionnaire may leave out, drawn', () => {
  // A title is the resource's to give: one it does not have is not drawn,
  // not even as an empty one, and its items are drawn all the same.
  test('draws no title where the resource has none', () => {
    const bytes = json(minimal, minimalContext).replace('"title":"Minimal",', '')
    render(<ReadOutView json={bytes} language="en" words={en} targetOf={() => undefined} />)
    expect(screen.queryByText(en.readOut.title)).toBeNull()
    expect(screen.getByRole('heading', { name: 'Reason' })).toBeDefined()
  })

  // A condition on a question with no text, as a hidden field has none,
  // names the question by its linkId alone, never by a text or a quotation
  // it does not have.
  test("names a condition's question with no text by its linkId alone", () => {
    const bytes = json(intake, intakeContext).replace('"question":"history","operator":"!="', '"question":"campaign","operator":"!="')
    render(<ReadOutView json={bytes} language="en" words={en} targetOf={() => undefined} />)
    expect(conditions('Einzelheiten zur Vorgeschichte')[0]).toBe(`(campaign) ${en.readOut.isNot} keine`)
    // The one quotation is the answer's.
    const [campaign] = within(within(screen.getByRole('listitem', { name: 'Einzelheiten zur Vorgeschichte' })).getByRole('list', { name: en.readOut.shownWhen })).getAllByRole('listitem')
    expect([...(campaign?.querySelectorAll('q') ?? [])].map((each) => each.textContent)).toEqual(['keine'])
  })
})

describe("a Questionnaire that names no language, drawn", () => {
  // Without `language` the resource says nothing of what its texts are in:
  // marked as of no known language, never as the page's.
  test('marks its texts as in a language it does not name, and says so', () => {
    render(<ReadOutView json={json(minimal, minimalContext)} language="fr" words={WORDS.fr} targetOf={() => undefined} />)
    expect(screen.getByRole('heading', { name: 'Reason' }).querySelector('[lang]')?.getAttribute('lang')).toBe('')
    expect(screen.getAllByText(`(${WORDS.fr.readOut.unnamedLanguage})`, { normalizer: (text) => text }).length).toBeGreaterThan(1)
  })
})
