// The demo's README pictures (0016): the demo scenes of
// scripts/pictures/scenes.json, taken -- or, with --check, walked and their
// text compared -- by scripts/pictures/session.mjs. Its header says the
// arguments; the camera's says what it reads from the DOM and why.
// formancy.ai-report's apps/studio/scripts/pictures.mjs, for this page: the
// built demo, answered from dist/ on an origin nothing resolves, under the
// path formancy.ai serves it at and the headers the deploy writes for that
// address, as the browser gate serves it, over the corpus's synthetic
// referral, which the build carries.
//
// One session, in Chromium (scripts/browsers.mjs's PICTURES_BROWSER): the
// acts run in their table's order, each starting where the last one left
// the page, as a person would go -- the page as it opens; the question for
// the specialist changed and the response's JSON opened; the question
// cleared, which refuses the response; back to the sample's answers, and
// the inputs refused on purpose; and the Questionnaire read out. Elements
// are found by role and accessible name, in English, the language the
// camera's locale opens the page in; the page's sections are regions named
// by their headings.
//
// The width is past every breakpoint the page's stylesheets have, read
// from them as the browser gate reads them (gate-page.mjs), so the form
// stands beside the resources.
//
// `node scripts/pictures.mjs` from the repository's root runs it and then
// writes README.md; `pnpm build` first.

import { createRequire } from 'node:module'
import * as playwright from 'playwright'
import { PICTURES_BROWSER } from '../../../scripts/browsers.mjs'
import { headersFor } from '../../../scripts/demo-headers.mjs'
import { demoBase, readDemoConfig } from '../../../scripts/demo.mjs'
import { pictures, untilSnapshot } from '../../../scripts/pictures/session.mjs'
import { breakpointsOf, dist, FONT_FILE, stylesheets } from './gate-page.mjs'

const ORIGIN = 'http://demo.invalid'

/** How long a step may take to answer: Playwright's default, which the demo's gate's waits run under too. */
const WITHIN = 30_000

/** What the question for the specialist is changed to: synthetic, and short enough to stand on one line of the JSON shown. */
const CHANGED = 'Geänderte synthetische Fragestellung'

/** The status under the form while the answers are the sample's. */
const SAMPLE = 'The sample’s answers, unchanged: every resource shown is an entry of the synthetic corpus that CI’s validator gate judges, byte for byte.'

/** The page's sections, each a region named by its heading. */
function sections(page) {
  const region = (name) => page.getByRole('region', { name, exact: true })
  return {
    Form: region('The form'),
    Questionnaire: region('The Questionnaire'),
    Response: region('The answers, as a QuestionnaireResponse'),
    Document: region('The referral, as a CH ORF document'),
    Refused: region('Refused on purpose'),
  }
}

/**
 * The question for the specialist: its label, and the asterisk Blueprint
 * draws after a required field's as generated content, which the browser's
 * accessible name includes (gate-journey.mjs's `named`).
 */
const question = (page) => page.getByRole('textbox', { name: /^Question for the specialist\*?$/ })

/** `text` as a pattern that matches it literally. */
const literally = (text) => new RegExp(text.replaceAll(/[.*+?^${}()|[\]\\]/g, '\\$&'))

const acts = {
  'demo-form': async (page) => {
    const { Form } = sections(page)
    await untilSnapshot(Form, literally(SAMPLE), { within: WITHIN, what: 'the sample’s status under the form' })
    return { parts: { Form } }
  },

  'demo-changed': async (page) => {
    const { Response, Document } = sections(page)
    const field = question(page)
    await field.fill(CHANGED)
    await field.press('Tab')
    // The caption: made again from the answers, no longer the corpus's entry.
    await untilSnapshot(Response, /- paragraph: Made by @formancy\/health-questionnaire\.$/m, {
      within: WITHIN,
      what: 'the response made of the changed answers',
    })
    // The document too, though not pictured: it is made of the same answers,
    // and a page still making it would be pictured in one moment of it.
    await untilSnapshot(Document, /- paragraph: Made by @formancy\/health-ch\.$/m, { within: WITHIN, what: 'the CH ORF document made of the changed answers' })
    await Response.getByText('Show the JSON', { exact: true }).click()
    const json = Response.getByRole('region', { name: 'The answers, as a QuestionnaireResponse as JSON', exact: true })
    await untilSnapshot(json, literally(CHANGED), { within: WITHIN, what: 'the changed answer in the response’s JSON' })
    // The response alone, the README's hero: the JSON a vendor's application gets back.
    return { parts: { Response } }
  },

  'demo-refused': async (page) => {
    const { Response, Document } = sections(page)
    const field = question(page)
    await field.fill('')
    await field.press('Tab')
    await untilSnapshot(Response, /- paragraph: "Refused by @formancy\/health-questionnaire:"$/m, { within: WITHIN, what: 'the response refused' })
    // The state, not its words: a sentence reworded is the comparison's to say, with its diff.
    await untilSnapshot(Document, /- paragraph: "Not made: /, { within: WITHIN, what: 'the CH ORF document not made' })
    return { parts: { Response, Document } }
  },

  'demo-on-purpose': async (page) => {
    const { Form, Refused } = sections(page)
    // Back to the sample, as a person leaves the demo: the cases refused on
    // purpose are fixed inputs, and do not change with the answers.
    await Form.getByRole('button', { name: 'Back to the sample answers', exact: true }).click()
    await untilSnapshot(Form, literally(SAMPLE), { within: WITHIN, what: 'the sample’s answers again' })
    await untilSnapshot(Refused, /context\.patient\.ahvn13: its check digit/, { within: WITHIN, what: 'the AHV number refused' })
    return { parts: { Refused } }
  },

  'demo-read-out': async (page) => {
    const { Questionnaire } = sections(page)
    await Questionnaire.getByRole('list', { name: 'What the Questionnaire says', exact: true }).waitFor()
    return { parts: { Questionnaire } }
  },
}

/**
 * The widest and the narrowest breakpoint of every stylesheet the page
 * wears, the themes as installed among them, read as the browser gate
 * reads them: a min-width counts towards the widest, since a wide picture
 * past it is of the layout both sides of it agree on.
 */
function layoutOf(sheets) {
  const max = sheets.flatMap(({ css }) => breakpointsOf(css).max)
  const min = sheets.flatMap(({ css }) => breakpointsOf(css).min)
  if (max.length === 0)
    throw new Error("found no max-width breakpoint in the page's stylesheets, so no width can be shown to be past them all, or below them all")
  return { widest: Math.max(...max, ...min), narrowest: Math.min(...max) }
}

try {
  const sheets = stylesheets()
  const base = demoBase(readDemoConfig())
  await pictures({
    app: 'demo',
    browserType: playwright[PICTURES_BROWSER],
    playwright: createRequire(import.meta.url)('playwright/package.json').version,
    // Past every breakpoint (layoutOf), which the camera holds it to: the
    // form beside the resources. A laptop's width, which the gate measures
    // too.
    width: 1440,
    layout: layoutOf(sheets),
    stylesheet: {
      css: sheets.map(({ path, css }) => `/* ${path} */\n${css}`).join('\n'),
      of: 'the stylesheets src/main.tsx imports, the themes as installed among them',
    },
    origin: ORIGIN,
    base,
    dist,
    headers: headersFor(`${ORIGIN}${base}`),
    fontFile: FONT_FILE,
    within: WITHIN,
    data: 'the corpus’s synthetic demo referral, as the demo’s build carries it',
    open: async (page) => {
      await page.goto(`${ORIGIN}${base}`)
      await page.getByRole('heading', { level: 1 }).waitFor()
    },
    acts,
  })
} catch (error) {
  console.error(`demo pictures: ${error instanceof Error ? error.message : String(error)}`)
  process.exitCode = 1
}
