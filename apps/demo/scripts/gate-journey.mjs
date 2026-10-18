// A visitor's way through the demo, in the browser (0012): what the jsdom
// journey (src/journey.test.tsx) holds of the page's own logic, here held
// in Chromium, Firefox and WebKit (0014), against the page Vite built and
// the bytes the validator gate's corpus holds, made in Node from the
// packages as built. The
// keyboard through the form, the sample as it starts, the Questionnaire
// read out and each item's way to its field, an answer changed in four
// scripts, a language switched and back, a required answer cleared and
// refused, the form submitted both ways, the sample back, the JSON
// opened, the refusals on purpose, every download, and the letter's Bundle
// with its PDF in a Binary.
//
// Elements are found by role and accessible name, with four reads of the
// DOM and one of text, each because the accessibility tree has no answer:
// a JSON region's bytes are its `data-json`, what writeJson wrote, since
// its text is laid out for reading; a refusal's rule is the `<code>` of its
// list item; where a focused field and its labels stand is their boxes;
// and a JSON is opened by its `<summary>`, found by its words, which the
// tree gives no role a person presses and its group no name.

import { readFileSync } from 'node:fs'
import { isDeepStrictEqual } from 'node:util'
import * as core from '@formancy/health-core'
import * as ch from '@formancy/health-ch'
import * as documents from '@formancy/health-corpus'
import * as questionnaire from '@formancy/health-questionnaire'
import { corpus } from '../../../scripts/validator/corpus.mjs'
import { demoReferral } from '../../../scripts/validator/demo-referral.mjs'
import { registeredLetter } from '../../../scripts/validator/letter.mjs'
import { describeFocus } from './gate-page.mjs'

/**
 * What the visitor types after the sample's question: a word in each range
 * the page's faces are split into beyond the Latin its own text is in --
 * Latin Extended, Vietnamese, Greek, Cyrillic -- so that a face asked for
 * by what is typed, which would tell the server what kind of text was
 * entered, is a request the privacy checks hear.
 */
export const TYPED = ' Geändert: Łódź, Tiếng Việt, Ελληνικά, Кириллица.'

/**
 * The validator gate's corpus as the packages, as built, make it in Node,
 * with the letter its register holds: the bytes of each file, as writeJson
 * writes them, and the PDF.
 */
export async function corpusBytes() {
  const pdf = await registeredLetter(documents.renderReferral)
  const entries = corpus({ core, questionnaire, documents, pdf, ch })
  return { files: Object.fromEntries(entries.map((entry) => [entry.file, core.writeJson(entry.resource)])), pdf }
}

/** The demo form's label `id` in `language`, as the form's own catalogue gives it. */
export const labelOf = (language, id) => demoReferral.i18n.messages[language][id]

/**
 * A field's accessible name in a browser: its label, and the asterisk
 * Blueprint draws after a required field's as generated content, which a
 * browser's name includes and jsdom's, which applies no stylesheet, does
 * not.
 */
const named = (language, id) => new RegExp(`^${labelOf(language, id).replaceAll(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\*?$`)

/** Null once the element `locator` finds has the keyboard's focus, within a second, or where the focus is. */
async function focused(page, locator) {
  const deadline = Date.now() + 1_000
  for (;;) {
    if ((await locator.count()) === 1 && (await locator.evaluate((element) => element === document.activeElement))) return null
    if (Date.now() > deadline) return `the focus is on ${await describeFocus(page)}`
    await page.waitForTimeout(50)
  }
}

/**
 * Tab, until the keyboard leaves the element it is on: a date field takes
 * a Tab for each of its parts, and stays the element with the focus.
 */
async function tabOn(page) {
  const handle = await page.evaluateHandle(() => document.activeElement)
  for (let press = 0; press < 6; press += 1) {
    await page.keyboard.press('Tab')
    if (!(await page.evaluate((before) => before === document.activeElement, handle))) return
  }
}

/** Enter on `pressed`, as a keyboard user presses it. */
async function enter(pressed) {
  await pressed.focus()
  await pressed.press('Enter')
}

/** The name and bytes of the download `link` gives, read from the file the browser saved. */
async function downloaded(page, link) {
  const saved = page.waitForEvent('download')
  await enter(link)
  const download = await saved
  return { name: download.suggestedFilename(), bytes: new Uint8Array(readFileSync(await download.path())) }
}

const text = (bytes) => new TextDecoder().decode(bytes)
const sameBytes = (a, b) => Buffer.from(a).equals(Buffer.from(b))

/** The rules a list of refusals shows, each its item's `<code>`. */
const rulesIn = (region) => region.getByRole('listitem').evaluateAll((items) => items.map((item) => item.querySelector('code')?.textContent))

/** The PDF `bundle`'s JSON carries where `placement` puts it, decoded. */
function carried(bundle, placement) {
  const entries = JSON.parse(bundle ?? '{"entry":[]}').entry.map(({ resource }) => resource)
  const data = placement === 'data' ? entries.find((resource) => resource.resourceType === 'DocumentReference')?.content?.[0]?.attachment?.data : entries.find((resource) => resource.resourceType === 'Binary')?.data
  return core.fromBase64Binary(data ?? '', 'data')
}

/** What every step reads the page with, in the pass's language. */
function on(page, { language, words, languages, files, pdfFile, expected }) {
  const w = words[language]
  const button = (name) => page.getByRole('button', { name, exact: true })
  return {
    page,
    language,
    words,
    languages,
    files,
    pdfFile,
    expected,
    w,
    // Null at once for a resource not made, rather than a wait for a region that will not come.
    bytesOf: async (heading, those = w) => {
      const json = page.getByRole('region', { name: those.resources.asJson(heading), exact: true, includeHidden: true })
      return (await json.count()) === 1 ? json.getAttribute('data-json') : null
    },
    region: (heading) => page.getByRole('region', { name: heading, exact: true }),
    question: (tag = language) => page.getByRole('textbox', { name: named(tag, 'question.label') }),
    submit: button(String(w.formancy['form.submit'])),
    reset: button(w.form.reset),
    link: (file) => page.getByRole('link', { name: w.resources.download(file), exact: true }),
    // The resources shown before anything is changed, by heading, with the corpus file each is.
    shown: [
      [w.questionnaire.heading, files.questionnaire],
      [w.response.heading, files.response],
      [w.document.heading, files.document],
      [w.letter.heading, files.letter.data],
    ],
  }
}

/**
 * The role each field of the demo's form is drawn with, by its key: what a
 * way from the read-out lands on. The radio group has no way to it, since
 * formancy's renderer draws no element of the id its engine mints for it
 * (src/engine.ts, which engine.test.ts measures).
 */
const ROLES = { question: 'textbox', specialty: 'combobox', language: 'radio', interpreter: 'checkbox', interpreter_language: 'textbox', available_from: 'textbox', contact_phone: 'textbox' }

/**
 * Null where the element with the keyboard's focus and every label of it
 * stand whole inside the window, its layout viewport, or which do not and
 * where.
 */
const inTheWindow = (page) =>
  page.evaluate(() => {
    const control = document.activeElement
    const labels = [...(control?.labels ?? [])]
    if (control === null || labels.length === 0) return 'the control has no label'
    const { clientWidth: width, clientHeight: height } = document.documentElement
    const out = [control, ...labels].flatMap((part) => {
      const { top, bottom, left, right } = part.getBoundingClientRect()
      const name = part === control ? 'the control' : 'its label'
      return top < 0 || bottom > height || left < 0 || right > width ? [`${name} at ${Math.round(left)},${Math.round(top)} to ${Math.round(right)},${Math.round(bottom)} of ${width} by ${height}`] : []
    })
    return out.length === 0 ? null : out.join(', ')
  })

/**
 * The Questionnaire read out, as the corpus holds it: every item, by the
 * text the form gives its field in the pass's language, in the corpus
 * Questionnaire's order, under the Questionnaire's heading; and each
 * item's way to its field, pressed from the keyboard, putting the keyboard
 * on that field, and the field and its label in the window. The items are
 * read from the corpus's bytes, by health-core's readJson, and the texts
 * from the form's catalogue: the page's read-out is held to both, and
 * computed from neither.
 */
async function readsOut({ check }, at) {
  const { page, language, w, files, expected } = at
  const items = core.readJson(expected.files[files.questionnaire]).item ?? []
  const labels = items.map(({ linkId }) => labelOf(language, `${linkId}.label`))
  const list = at.region(w.questionnaire.heading).getByRole('list', { name: w.readOut.heading, exact: true })
  const headings = await list.getByRole('heading').allTextContents()
  check('the Questionnaire is read out: every item of the corpus’s, in its order, by the text the form gives its field in the page’s language', items.length > 0 && isDeepStrictEqual(headings, labels) ? null : `the read-out names ${headings.join(', ') || 'nothing'}`)
  const astray = []
  const unseen = []
  for (const [index, { linkId }] of items.entries()) {
    const way = page.getByRole('button', { name: w.readOut.toFieldOf(labels[index]), exact: true })
    const role = ROLES[linkId]
    if (role === undefined) astray.push(`${linkId}: no field of the form the gate knows`)
    else if (role === 'radio') {
      if ((await way.count()) !== 0) astray.push(`${linkId}: a way to a radio group, which no element of the engine's id stands for`)
    } else {
      await enter(way)
      const problem = await focused(page, page.getByRole(role, { name: named(language, `${linkId}.label`) }))
      const out = problem === null ? await inTheWindow(page) : null
      if (problem !== null) astray.push(`${linkId}: ${problem}`)
      if (out !== null) unseen.push(`${linkId}: ${out}`)
    }
  }
  check('and each item’s way to its field, pressed from the keyboard, puts the keyboard on the field the form drew for it', astray.length === 0 ? null : astray.join('; '))
  check('and the field and its label whole inside the window', astray.length === 0 && unseen.length === 0 ? null : unseen.length === 0 ? 'not every way reached its field' : unseen.join('; '))
}

/** From the form's first field, which has the keyboard, through every field in its order to its submit control. */
async function throughTheForm({ check }, at) {
  const { page, language } = at
  const stops = [
    at.question(),
    page.getByRole('combobox', { name: named(language, 'specialty.label') }),
    // A group of radios is one stop, on the one checked: the sample's French.
    page.getByRole('radio', { name: named(language, 'language.fr') }),
    page.getByRole('checkbox', { name: named(language, 'interpreter.label') }),
    page.getByRole('textbox', { name: named(language, 'interpreter_language.label') }),
    page.getByRole('textbox', { name: named(language, 'available_from.label') }),
    page.getByRole('textbox', { name: named(language, 'contact_phone.label') }),
    at.submit,
  ]
  let astray = null
  for (let stop = 0; astray === null && stop < stops.length; stop += 1) {
    if (stop > 0) await tabOn(page)
    const problem = await focused(page, stops[stop])
    if (problem !== null) astray = `at stop ${String(stop + 1)} of ${String(stops.length)}: ${problem}`
  }
  check('the keyboard goes through the form’s fields in their order, and on to its submit control', astray)
}

/** The sample, as the page opens: every resource the corpus's, and the page saying so. */
async function fromTheSample({ check }, at) {
  const { page, w, files, expected } = at
  const differing = []
  for (const [heading, file] of at.shown) if ((await at.bytesOf(heading)) !== expected.files[file]) differing.push(file)
  check('the page starts from the sample: every resource is the corpus entry of its name, byte for byte', differing.length === 0 ? null : `not the corpus's: ${differing.join(', ')}`)
  const said = (await page.getByText(w.form.sample, { exact: true }).count()) === 1 && (await page.getByText(w.resources.corpus(files.response), { exact: false }).count()) === 1
  check('and the page says so, and offers no way back to where it already is', said && (await at.reset.count()) === 0 ? null : 'the status, the corpus sentence or the reset button says otherwise')
}

/** An answer changed, typed as a person types it; the response's bytes it made. */
async function change({ check }, at) {
  const { page, w, files, expected } = at
  await at.question().focus()
  await page.keyboard.press('Control+End')
  await page.keyboard.type(TYPED)
  await at.reset.waitFor()
  const changed = await at.bytesOf(w.response.heading)
  const answered = changed !== null && JSON.stringify(JSON.parse(changed)).includes(TYPED.trim())
  const remade = changed !== expected.files[files.response] && (await at.bytesOf(w.document.heading)) !== expected.files[files.document]
  check('a change remade the response from what was typed, and the CH ORF document with it', answered && remade ? null : answered ? 'the response or the document is still the sample’s' : 'the response does not hold what was typed')
  const said = (await page.getByText(w.form.changed, { exact: true }).count()) === 1 && (await page.getByText(w.resources.corpus(files.response), { exact: false }).count()) === 0
  check('and the page says the answers are changed, and no longer the corpus’s', said ? null : 'the status or the corpus sentence says otherwise')
  return changed
}

/** Another language and back: a new engine each time, from the answers held, which are `changed`. */
async function anotherLanguage({ check }, at, changed) {
  const { page, w, words, language, languages } = at
  const other = languages[(languages.indexOf(language) + 1) % languages.length]
  await page.getByRole('combobox', { name: w.language, exact: true }).selectOption(other)
  await at.question(other).waitFor()
  const there = await at.bytesOf(words[other].response.heading, words[other])
  const lang = await page.evaluate(() => document.documentElement.lang)
  await page.getByRole('combobox', { name: words[other].language, exact: true }).selectOption(language)
  await at.question().waitFor()
  const back = await at.bytesOf(w.response.heading)
  const kept = there === changed && back === changed && lang === other
  check(`a change of language keeps the answers: in ${other}, and back in ${language}, the response is the same bytes`, kept ? null : `in ${other} (<html lang="${lang}">) ${there === changed ? 'the same' : 'other'} bytes, back ${back === changed ? 'the same' : 'other'} bytes`)
}

/** A required answer cleared: refused for it, said to a screen reader, and the form's submit leaving the keyboard on it. */
async function clear(gate, at, measured) {
  const { check } = gate
  const { page, w, language } = at
  await at.question().focus()
  await page.keyboard.press('Control+A')
  await page.keyboard.press('Backspace')
  const response = at.region(w.response.heading)
  await response.getByText(w.resources.refusedBy('@formancy/health-questionnaire'), { exact: true }).waitFor()
  const rules = await rulesIn(response)
  const unmade = (await at.region(w.document.heading).getByText(w.document.notMade, { exact: true }).count()) === 1
  check('a required answer cleared is refused for it, and the CH ORF document is not made', rules.join() === 'required' && unmade ? null : `the response lists ${rules.join(', ') || 'nothing'}`)
  const live = await page.getByRole('status').textContent()
  check('and the page says so once, politely, to a screen reader', live === w.form.refused(new Intl.NumberFormat(language).format(1)) ? null : `the status says ${JSON.stringify(live)}`)
  await measured('refused')
  await enter(at.submit)
  check('submitted with that answer missing, the keyboard is on it', await focused(page, at.question()))
}

/** The way back to the sample, and the submit of complete answers. */
async function backToTheSample({ check }, at) {
  const { page, w, files, expected } = at
  await enter(at.reset)
  await at.reset.waitFor({ state: 'detached' })
  const sample = (await at.bytesOf(w.response.heading)) === expected.files[files.response] && (await at.bytesOf(w.document.heading)) === expected.files[files.document]
  check('back to the sample, byte for byte, with no way back offered', sample ? null : 'the response or the document is not the corpus’s')
  check('and the keyboard on the line that says so', await focused(page, page.getByText(w.form.sample, { exact: true })))
  await enter(at.submit)
  check('submitted complete, the keyboard is on the response', await focused(page, page.getByRole('heading', { name: w.response.heading, exact: true })))
}

/** The response's JSON, opened from the keyboard: the bytes, laid out. */
async function openTheJson({ check }, at) {
  const { page, w, files, expected } = at
  await enter(at.region(w.response.heading).getByText(w.resources.show, { exact: true }))
  const pre = page.getByRole('region', { name: w.resources.asJson(w.response.heading), exact: true })
  await pre.waitFor()
  const laidOut = await pre.innerText()
  check('the JSON opened is the bytes, laid out for reading', isDeepStrictEqual(JSON.parse(laidOut), JSON.parse(expected.files[files.response])) && laidOut.includes('\n') ? null : 'its text is not the response’s JSON, or is not laid out')
}

/** Every download of a resource shown, then the letter's PDF, whose bytes it answers. */
async function downloads({ check }, at) {
  const { page, files, expected } = at
  const wrong = []
  for (const [heading, file] of at.shown) {
    const got = await downloaded(page, at.link(file))
    if (got.name !== file || text(got.bytes) !== (await at.bytesOf(heading)) || text(got.bytes) !== expected.files[file]) wrong.push(file)
  }
  check('every resource downloads as the file of its name, holding the bytes shown, which are the corpus’s', wrong.length === 0 ? null : `not so: ${wrong.join(', ')}`)
  const letter = await downloaded(page, at.link(at.pdfFile))
  const isPdf = text(letter.bytes.subarray(0, 5)) === '%PDF-' && sameBytes(letter.bytes, expected.pdf)
  check('the letter downloads as the PDF the register holds, the bytes its Bundle carries in the attachment', isPdf && sameBytes(carried(expected.files[files.letter.data], 'data'), letter.bytes) ? null : isPdf ? 'the attachment holds other bytes' : 'it is not the registered PDF')
  return letter.bytes
}

/** The letter's PDF in a Binary beside the DocumentReference, chosen from the keyboard; `pdf` the bytes the letter downloaded as. */
async function inABinary({ check }, at, pdf) {
  const { page, w, files, expected } = at
  await page.getByRole('radio', { name: w.letter.data, exact: true }).focus()
  await page.keyboard.press('ArrowDown')
  await page.getByRole('radio', { name: w.letter.binary, exact: true, checked: true }).waitFor()
  const binary = await at.bytesOf(w.letter.heading)
  const saved = await downloaded(page, at.link(files.letter.binary))
  const held = binary === expected.files[files.letter.binary] && sameBytes(carried(binary, 'binary'), pdf) && text(saved.bytes) === binary
  check('in a Binary, the letter’s Bundle is the corpus entry, carries the PDF, and downloads as itself', held ? null : 'the Bundle, its Binary or its download is not so')
}

/**
 * The journey, in the page's `language`, held to `expected` (corpusBytes()).
 * `page` has the keyboard on the first control of <main>, the form's first
 * field. `words` are the page's (src/words), `files` and `pdfFile` the
 * names src/exports.ts downloads them as, `measured` the layout and axe of
 * a state, said under its name.
 */
export async function journey(gate, page, { measured, ...options }) {
  const at = on(page, options)
  await throughTheForm(gate, at)
  await fromTheSample(gate, at)
  await measured('start')
  await readsOut(gate, at)
  const changed = await change(gate, at)
  await measured('changed')
  await anotherLanguage(gate, at, changed)
  await clear(gate, at, measured)
  await backToTheSample(gate, at)
  await openTheJson(gate, at)
  await measured('JSON open')
  const onPurpose = await rulesIn(at.region(at.w.refused.heading))
  gate.check('each input refused on purpose is refused by its package, for its rule', onPurpose.join() === 'version,unmapped,check-digit,check-digit,unproved' ? null : `the rules shown are ${onPurpose.join(', ')}`)
  const pdf = await downloads(gate, at)
  await inABinary(gate, at, pdf)
  await measured('letter in a Binary')
}
