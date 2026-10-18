import { FORM_WORDS } from '@formancy/core/words'
import { fromBase64Binary, readJson } from '@formancy/health-core'
import { cleanup, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, test } from 'vitest'
import facts from 'virtual:formancy-health-demo/facts'
import letter from 'virtual:formancy-health-demo/letter'
import sample from 'virtual:formancy-health-demo/sample'
import { Demo } from './demo.js'
import { byFile, FILES, firstOf, PDF_FILE } from './exports.js'
import { LINKS } from './links.js'
import { unnamed, violations } from './test-accessible.js'
import { blobAt } from './test-setup.js'
import { LANGUAGES, WORDS, type Language } from './words/index.js'

/**
 * A visitor's way through the page, by role and accessible name, in jsdom,
 * with the modules the build hands the page: the sample as it starts, an
 * answer changed, a required answer cleared and refused, the sample back,
 * a language switched, the form submitted, and every download. axe and
 * every control's name at each state.
 *
 * Where the accessibility tree cannot answer, it reads the DOM, and says
 * so: a JSON region's bytes are its `data-json`, what writeJson wrote,
 * since its text is laid out for reading; and a link's bytes are the Blob
 * its address names (src/test-setup.ts), as a browser would save them.
 */
const pdf = fromBase64Binary(letter, 'letter')
const first = byFile(firstOf(sample, pdf))
const en = WORDS.en

afterEach(() => {
  cleanup()
  document.documentElement.lang = ''
})

function open(language: Language = 'en') {
  return render(<Demo sample={sample} pdf={pdf} facts={facts} language={language} />)
}

/** The bytes a JSON region holds, by its name: what writeJson wrote. */
const bytesOf = (name: string): string | null => screen.getByRole('region', { name: WORDS.en.resources.asJson(name) }).getAttribute('data-json')

/** The bytes a link downloads, by its name. */
async function downloaded(name: string): Promise<Uint8Array> {
  const link = await screen.findByRole('link', { name })
  const blob = blobAt(link.getAttribute('href') ?? '')
  return new Uint8Array((await blob?.arrayBuffer()) ?? new ArrayBuffer(0))
}

const json = (file: string): string | undefined => {
  const outcome = first.get(file)
  return outcome?.kind === 'made' ? outcome.json : undefined
}

/** axe, and every control named. */
async function audited(): Promise<string[]> {
  return [...(await violations()), ...unnamed()]
}

describe('the page, as it opens', () => {
  // What the page claims before anything is changed rests on the bytes it
  // shows being the corpus's: the sample's status, each resource said to
  // be its corpus entry, and the very bytes in each region.
  test('starts from the sample: its status, and every resource the corpus entry of its name', async () => {
    open()
    expect(screen.getByText(en.form.sample)).toBeDefined()
    expect(screen.queryByRole('button', { name: en.form.reset })).toBeNull()
    for (const file of [FILES.questionnaire, FILES.response, FILES.document, FILES.letter.data]) expect(screen.getByText(en.resources.corpus(file), { exact: false })).toBeDefined()
    expect(bytesOf(en.response.heading)).toBe(json(FILES.response))
    expect(bytesOf(en.document.heading)).toBe(json(FILES.document))
    expect(bytesOf(en.questionnaire.heading)).toBe(json(FILES.questionnaire))
    expect(await audited()).toEqual([])
  })

  // Every refusal the page shows on purpose is there, as its package
  // stated it, in English, marked so on a page in another language.
  test('shows each refusal on purpose as the package states it, in English', () => {
    open('de-CH')
    const refused = screen.getByRole('region', { name: WORDS['de-CH'].refused.heading })
    const rules = within(refused)
      .getAllByRole('listitem')
      .map((item) => item.querySelector('code')?.textContent)
    expect(rules).toEqual(['version', 'unmapped', 'check-digit', 'check-digit', 'unproved'])
    for (const list of within(refused).getAllByRole('list')) expect(list.getAttribute('lang')).toBe('en')
  })

  // HL7's and LOINC's notices are theirs, word for word, and the sentence
  // of what the product is not is CLAUDE.md's: each stands in English on
  // every page, and is marked English for a reader that speaks it.
  test("carries HL7's and LOINC's notices and the product's purpose, word for word and in English, in every language", () => {
    open('fr')
    for (const text of [facts.notices.hl7, facts.notices.loinc, facts.purpose]) expect(screen.getByText(text).closest('[lang]')?.getAttribute('lang')).toBe('en')
    expect(document.documentElement.lang).toBe('fr')
    expect(document.title).toBe(WORDS.fr.title)
  })

  // The banner is the page's one statement of what its data is and what it
  // does with what is typed: synthetic, no place for a real patient's, sent
  // nowhere and kept nowhere. Said once, before the form a visitor types
  // into, in every language; dropped, nothing else on the page says it.
  test.each(LANGUAGES)('says what its data is and what it does with what is typed, once, before the form, in %s', (language) => {
    open(language)
    // As written: French sets a no-break space before its colon, which the
    // default normalizer would read as a space in the page and not in the words.
    const banners = screen.getAllByText(WORDS[language].banner, { normalizer: (text) => text })
    expect(banners).toHaveLength(1)
    const form = screen.getByRole('region', { name: WORDS[language].form.heading })
    expect((banners[0]?.compareDocumentPosition(form) ?? 0) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
  })

  // The notices of what the page bundles travel with it as a file of its
  // build, linked from the foot of every page, in its language: the
  // licences of React, formancy and the faces ask for no less.
  test.each(LANGUAGES)('links the notices of the code and faces it bundles from its foot, in %s', (language) => {
    open(language)
    const link = within(screen.getByRole('contentinfo')).getByRole('link', { name: WORDS[language].footer.notices })
    expect(link.getAttribute('href')).toBe(LINKS.notices)
  })
})

describe('a visitor changing the answers', () => {
  // A change must reach the resources beside the form, say they are no
  // longer the sample's, and offer the way back; going back must give the
  // sample's bytes again, and leave the keyboard on the line that says so.
  test('remakes the response, says so, and goes back to the sample byte for byte', async () => {
    const user = userEvent.setup()
    open()
    await user.type(screen.getByRole('textbox', { name: 'Question for the specialist' }), ' Geändert.')
    expect(screen.getByText(en.form.changed)).toBeDefined()
    expect(bytesOf(en.response.heading)).not.toBe(json(FILES.response))
    expect(screen.queryByText(en.resources.corpus(FILES.response), { exact: false })).toBeNull()
    // The Questionnaire and the letter's Bundle do not depend on the
    // answers, and still say they are the corpus's: the status line beside
    // them names the response and the document, not every resource shown.
    for (const file of [FILES.questionnaire, FILES.letter.data]) expect(screen.getByText(en.resources.corpus(file), { exact: false })).toBeDefined()
    expect(await audited()).toEqual([])
    await user.click(screen.getByRole('button', { name: en.form.reset }))
    expect(bytesOf(en.response.heading)).toBe(json(FILES.response))
    expect(screen.queryByRole('button', { name: en.form.reset })).toBeNull()
    await waitFor(() => expect(document.activeElement?.textContent).toBe(en.form.sample))
  })

  // The refusal a visitor can make by hand, said where the response stands
  // and once, politely, to a screen reader; and the document that would
  // carry the refused answers is not made.
  test('clearing a required answer is refused, and the CH ORF document is not made', async () => {
    const user = userEvent.setup()
    open()
    await user.clear(screen.getByRole('textbox', { name: 'Question for the specialist' }))
    const response = screen.getByRole('region', { name: en.response.heading })
    expect(within(response).getByText('required').textContent).toBe('required')
    expect(within(response).getByText(/answers\.question/)).toBeDefined()
    expect(screen.getByText(en.document.notMade)).toBeDefined()
    expect(screen.getByRole('status').textContent).toBe(en.form.refused('1'))
    expect(await audited()).toEqual([])
  })

  // The engine's language is fixed for its life, so a switch is a new
  // engine: started from anything but the answers held, it would lose
  // what the visitor typed.
  test('keeps the answers across a change of language', async () => {
    const user = userEvent.setup()
    open()
    await user.type(screen.getByRole('textbox', { name: 'Question for the specialist' }), ' Geändert.')
    const changed = bytesOf(en.response.heading)
    await user.selectOptions(screen.getByRole('combobox', { name: en.language }), 'fr')
    expect(screen.getByRole('textbox', { name: 'Question au spécialiste' })).toBeDefined()
    expect(screen.getByRole('region', { name: WORDS.fr.resources.asJson(WORDS.fr.response.heading) }).getAttribute('data-json')).toBe(changed)
    expect(document.documentElement.lang).toBe('fr')
  })

  // The submit control moves the keyboard to the response it made, so a
  // keyboard user is not left at the foot of the form.
  test('submitting complete answers takes the keyboard to the response', async () => {
    const user = userEvent.setup()
    open()
    await user.click(screen.getByRole('button', { name: String(en.formancy['form.submit']) }))
    expect(document.activeElement).toBe(screen.getByRole('heading', { name: en.response.heading }))
  })

  // An incomplete form keeps the keyboard where formancy puts it, on the
  // first answer missing: taken to the response, it would leave a
  // keyboard user far from what is to be fixed.
  test('submitting with a required answer missing leaves the keyboard on it', async () => {
    const user = userEvent.setup()
    open()
    const question = screen.getByRole('textbox', { name: 'Question for the specialist' })
    await user.clear(question)
    await user.click(screen.getByRole('button', { name: String(en.formancy['form.submit']) }))
    expect(document.activeElement).toBe(question)
  })
})

describe('the page in Italian', () => {
  // formancy 0.5.0 ships no Italian: what its renderer draws would fall
  // back to English under an Italian page -- its own English, or the
  // English the page gives it -- unless the page gives it Italian.
  test("draws none of formancy's words in English", () => {
    open('it')
    const form = screen.getByRole('region', { name: WORDS.it.form.heading })
    const english = [...Object.values(FORM_WORDS), ...Object.values(en.formancy)].flatMap((word): string[] => (typeof word === 'string' && !word.includes('{') ? [word] : []))
    expect(english).toContain(String(en.formancy['form.submit']))
    // Each text the form draws, on its own: the form's whole textContent
    // runs a label into the next, and a word at the seam has no boundary.
    const drawn: string[] = []
    const walker = document.createTreeWalker(form, NodeFilter.SHOW_TEXT)
    while (walker.nextNode()) drawn.push(walker.currentNode.textContent ?? '')
    const found = (word: string): boolean => drawn.some((text) => new RegExp(`(^|\\W)${word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(\\W|$)`).test(text))
    // A guard on the guard: the reading finds a text the form draws.
    expect(found(WORDS.it.form.heading)).toBe(true)
    expect(english.filter(found)).toEqual([])
  })
})

describe('the downloads', () => {
  // A download is the bytes shown, not a copy laid out for reading or one
  // made again; and the letter's PDF is the bytes its Bundles carry, in the
  // attachment and in the Binary.
  test('are the bytes each resource holds, and the PDF the bytes its Bundles carry', async () => {
    const user = userEvent.setup()
    open()
    const response = new TextDecoder().decode(await downloaded(en.resources.download(FILES.response)))
    expect(response).toBe(json(FILES.response))
    const letterPdf = await downloaded(en.resources.download(PDF_FILE))
    expect(letterPdf).toEqual(new Uint8Array(pdf))
    expect(new TextDecoder().decode(letterPdf.subarray(0, 5))).toBe('%PDF-')
    const attached = readJson(bytesOf(en.letter.heading) ?? '') as { entry: { resource: { resourceType: string; content?: { attachment: { data?: string } }[]; data?: string } }[] }
    const data = attached.entry.find(({ resource }) => resource.resourceType === 'DocumentReference')?.resource.content?.[0]?.attachment.data ?? ''
    expect(fromBase64Binary(data, 'data')).toEqual(letterPdf)
    await user.click(screen.getByRole('radio', { name: en.letter.binary }))
    expect(bytesOf(en.letter.heading)).toBe(json(FILES.letter.binary))
    const inBinary = readJson(bytesOf(en.letter.heading) ?? '') as typeof attached
    expect(fromBase64Binary(inBinary.entry.find(({ resource }) => resource.resourceType === 'Binary')?.resource.data ?? '', 'data')).toEqual(letterPdf)
    expect(new TextDecoder().decode(await downloaded(en.resources.download(FILES.letter.binary)))).toBe(json(FILES.letter.binary))
  })
})
