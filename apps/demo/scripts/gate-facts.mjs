// What the demo's browser gate holds of what the browsers disagree on
// (0014): scripts/browsers.mjs's FACTS, each row held by a check of the
// same name in every browser, and what the gate itself causes kept apart
// from what the page does.
//
// The gate fails on anything the page's policy refuses, on any error the
// page logs and on anything it asks for once it has settled
// (gate-privacy.mjs), in every browser. What is not the page's is named
// here rather than skipped: what a row of FACTS says the browser does of
// its own -- WebKit 27.2 refuses a style attribute of its own on every
// <select> under a policy that admits no inline style, once for each, and
// reports and logs it as the page's; and, in the pass that refuses the web fonts, asks
// for a face's next file once text in its range is drawn -- and what the
// gate itself caused: in that pass, the errors that name a font file it
// refused. Each row is held by its check here, in every browser, so a
// browser that stops doing what its row says fails by name. Everything
// else is the page's. The row of the faces WebKit forgets is held by the
// fonts check (gate-page.mjs's fontProblem).

import { isDeepStrictEqual } from 'node:util'
import { FACTS } from '../../../scripts/browsers.mjs'
import { FONT_FILE } from './gate-page.mjs'

/** The rows of FACTS that are a refusal the browser makes of its own, with what it reports and logs. */
const refusals = () => Object.entries(FACTS).filter(([, fact]) => fact.report !== undefined)

/**
 * Whether `entry`, a report as gate-privacy.mjs's listener keeps it, is
 * `fact`'s: its directive, what it blocked, the element it is reported at,
 * an element with no style attribute of the page's own, and the sample
 * where the policy asked for one. A style attribute the page put on a
 * select stays on the element, and is the page's.
 */
const isFacts = (fact, entry) =>
  entry.directive === fact.report.directive &&
  entry.blocked === fact.report.blocked &&
  entry.target === fact.report.target &&
  entry.ownStyle === false &&
  (entry.sample === '' || entry.sample === fact.report.sample)

/** Every address an error names: where the console says it came from, and each address in its text. */
const addressesOf = (error) => [error.url, ...(error.text.match(/https?:\/\/[^\s"'<>]+/g) ?? [])].filter((address) => address !== '')

/**
 * What the page did, of `reports` -- every report of its policy -- and
 * `errors` -- every error its console logged, `{ text, url }` -- in
 * `browser`: all of them but those a row of FACTS says the browser makes
 * of its own, one report of each element it is reported at, as the browser
 * refuses its own style once for each select, each of its lines matched to
 * one of those reports; and the errors that name an address of `refused`,
 * the font files the gate refused. A second report at one element, of the
 * row's shape, is the page's: a style it set and took off before the
 * report came. `own` counts what was the browser's, by row.
 */
export function thePagesOwn(browser, { reports, errors, refused = new Set() }) {
  const own = {}
  let left = [...reports]
  let unmatched = errors.filter((error) => !addressesOf(error).some((address) => refused.has(address)))
  for (const [id, fact] of refusals()) {
    if (fact.values[browser] !== true) continue
    const excused = new Set()
    const its = left.filter((entry) => {
      if (!isFacts(fact, entry) || excused.has(entry.element)) return false
      excused.add(entry.element)
      return true
    })
    left = left.filter((entry) => !its.includes(entry))
    let lines = its.length
    unmatched = unmatched.filter((error) => {
      if (lines === 0 || error.text !== fact.console) return true
      lines -= 1
      return false
    })
    own[id] = its.length
  }
  return { reports: left, errors: unmatched, own }
}

/**
 * Of `late` -- every request made once the page had settled, by address --
 * those 0014's asksForTheNextFileLater says `browser` makes of its own in
 * the pass that refuses the web fonts: a font file the gate refused
 * (`refused`), which never left the browser, asked for because text in its
 * face's range was drawn after the face's first file did not arrive. The
 * rest are the page's.
 */
export function lateOfItsOwn(browser, { late, refused }) {
  const its = FACTS.asksForTheNextFileLater.values[browser] === true
  return { own: late.filter((address) => its && refused.has(address)), page: late.filter((address) => !(its && refused.has(address))) }
}

/**
 * asksForTheNextFileLater, held in the pass that refuses the web fonts: in
 * a browser the row says asks later, at least one font file was asked for
 * once the page had settled, each one the gate refused; in any other, none
 * was. One name in every browser.
 */
export function heldNextFile(gate, { browser, late, refused }) {
  const fact = FACTS.asksForTheNextFileLater
  const fonts = late.filter((address) => FONT_FILE.test(address))
  const its = fact.values[browser] === true
  const holds = its ? fonts.length > 0 && fonts.every((address) => refused.has(address)) : fonts.length === 0
  gate.check(
    fact.heldBy.checks[0],
    holds
      ? null
      : `the table says ${String(its)}, and once the page had settled it asked for ${
          fonts.length === 0
            ? 'no font file'
            : fonts
                .map((address) => `${address.split('/').pop()}${refused.has(address) ? '' : ' (not refused)'}`)
                .slice(0, 4)
                .join(', ')
        }`,
  )
}

/** The page's policy with 'report-sample' in its style-src, so that a report of a refused style says what it was. */
export function withSamples(policy) {
  if (!/(?:^|; )style-src [^;]+/.test(policy)) throw new Error(`the page's policy has no style-src to ask for samples in: ${policy}`)
  return policy.replace(/((?:^|; )style-src [^;]+)/, "$1 'report-sample'")
}

/** The page the row below is measured on: one <select>, no script, no style, the icon index.html names so that nothing else is asked for. */
const SELECT_PAGE =
  '<!doctype html><html lang="en"><head><meta charset="utf-8"><title>One select</title><link rel="icon" href="data:,"></head><body><select><option>one</option><option>two</option></select></body></html>'

/** Where the gate serves it: in the demo's directory, so that the policy written for the demo's address governs it as it governs the demo. */
const SELECT_PATH = 'gate/one-select.html'

/**
 * How the console's line is waited for: up to this many waits of
 * LINE_WAIT ms, a second, as focused() in gate-journey.mjs waits for the
 * keyboard. A bound, not a measure: WebKit 27.2's line reached the gate
 * before the probe page's load did in each of 40 runs on Windows 11 and
 * 40 in Playwright's Linux image, measured on 18 October 2026 (0014).
 */
const LINE_WAITS = 20
const LINE_WAIT = 50

/**
 * refusesItsOwnSelectStyle, held: a page of one <select> and nothing else,
 * served in the demo's directory under the demo's headers, its policy with
 * 'report-sample' added, in a page of its own in `context`, whose init
 * scripts installed the listener. In a browser the row says refuses, the
 * one report the row names, with its sample, and the one line; in any
 * other, no report and no error. One name in every browser: a browser that
 * changes fails it by name.
 *
 * The reports are read once a task queued after the page's load has run:
 * a refusal of an element the page was parsed with had reached the
 * listener by then in every run measured, in each browser -- Chromium 156
 * and Firefox 157 before the load in all but one run, WebKit 27.2 after
 * it, and each before that task: 30 runs of the select alone and 30 of the select with
 * a <p style> of the page's beside it, in each browser, on Windows 11 and
 * in Playwright's Linux image, on 18 October 2026 (0014) -- so that no
 * report there is the browser's answer, not a wait that ran out. The
 * console's line comes by another way, and is waited for until there are
 * as many as the row says, within LINE_WAITS.
 */
export async function heldSelectStyle(gate, { context, url, headers, browser }) {
  const fact = FACTS.refusesItsOwnSelectStyle
  const address = new URL(SELECT_PATH, url).href
  const page = await context.newPage()
  try {
    const errors = []
    page.on('console', (message) => {
      if (message.type() === 'error') errors.push(message.text())
    })
    await page.route(address, (route) =>
      route.fulfill({
        status: 200,
        headers: { ...headers, 'Content-Type': 'text/html; charset=utf-8', 'Content-Security-Policy': withSamples(headers['Content-Security-Policy']) },
        body: SELECT_PAGE,
      }),
    )
    await page.goto(address, { waitUntil: 'load' })
    const reported = (await page.evaluate(() => new Promise((resolve) => setTimeout(() => resolve(window.__gateViolations ?? null), 0)))) ?? null
    const expected = fact.values[browser] === true ? { reports: [{ ...fact.report, ownStyle: false }], errors: [fact.console] } : { reports: [], errors: [] }
    for (let wait = 0; errors.length < expected.errors.length && wait < LINE_WAITS; wait += 1) await page.waitForTimeout(LINE_WAIT)
    const got = {
      reports: (reported ?? []).map(({ directive, blocked, target, sample, ownStyle }) => ({ directive, blocked, target, sample, ownStyle })),
      errors,
    }
    const same = reported !== null && isDeepStrictEqual(got, expected)
    gate.check(
      fact.heldBy.checks[0],
      same
        ? null
        : reported === null
          ? 'no listener was installed before the page ran'
          : `the table says ${String(fact.values[browser])}, and the page of one select reported ${JSON.stringify(got.reports)} and logged ${JSON.stringify(got.errors)}`,
    )
  } finally {
    await page.close()
  }
}

/**
 * Why the row costs the page nothing, held in every browser: the style
 * WebKit refuses is `text-overflow:inherit`, which passes a select's own
 * text-overflow to the text inside it, and no select of the page has one
 * but `clip`, the initial value, which that text has without it. Measured
 * once by hand: in WebKit 27.2 a select drawn with it refused and with it
 * admitted gave the same pixels, and with `text-overflow: ellipsis` on the
 * select, other pixels (0014).
 */
export async function selectsDrawTheSame(gate, page) {
  const overflows = await page.evaluate(() => [...document.querySelectorAll('select')].map((select) => getComputedStyle(select).textOverflow))
  const other = overflows.filter((value) => value !== 'clip')
  gate.check(
    'no <select> of the page has a text-overflow but clip, so the text-overflow:inherit 0014’s table names changes nothing it draws where it is refused',
    overflows.length > 0 && other.length === 0
      ? null
      : overflows.length === 0
        ? 'the page holds no select, so the row measures nothing of it'
        : `selects with ${other.join(', ')}`,
  )
}
