// What jsdom cannot see in the demo, measured in the browser it is given.
//
// formancy.ai-report's apps/studio/scripts/browser-test.mjs, which is
// formancy.ai-data's, applied to the demo (0012). The suite in src/ runs in
// jsdom, which applies no CSS, resolves no media queries, lays nothing out,
// sends no request and enforces no policy, so these claims the page makes
// could only be checked by hand:
//
//   - nothing scrolls sideways and nothing is past either edge, in every
//     state, from a wide screen down to a 320px phone, with the web fonts
//     and without;
//   - the keyboard path: from the top of the page the first Tab reaches the
//     skip link, on screen, and Enter on it puts the keyboard on <main>,
//     where the next Tab reaches the form's first field; from there every
//     field in its order and the submit control; and where each control
//     the journey presses leaves the keyboard;
//   - axe's default rules and its target-size rule find nothing, and
//     contrast and target size were measured, in each state the journey
//     reaches, in each of the page's languages;
//   - the page opens in the browser's language, says noindex, names the
//     product with no HL7 mark, says once what its data is and what it does
//     with what is typed, carries HL7's and LOINC's notices word for word,
//     first names the standard with its marks, links nowhere but where
//     src/links.ts says, and the notices of what it bundles it links to are
//     the file its build wrote;
//   - the journey (gate-journey.mjs): the resources the browser makes of
//     the sample are the validator gate's corpus entries, byte for byte;
//     the Questionnaire is read out item by item in the page's language,
//     and each item's way to its field puts the keyboard there; a
//     change reaches them and the page says so; a change of language keeps
//     the answers; a required answer cleared is refused; the way back gives
//     the sample's bytes again; and every download is the bytes shown, the
//     letter's PDF the bytes its Bundles carry;
//   - what the page says of what is typed (gate-privacy.mjs): nothing it
//     asked for came from elsewhere, nothing at all was asked for once it
//     had settled, whatever was typed, no cookie was set, nothing was
//     stored and nothing typed reached its address; every file came with
//     the headers scripts/demo-headers.mjs decides, and the policy among
//     them is in force: the browser refused nothing the page did and its
//     console logged no error, the whole journey long;
//   - the page runs React's production build, the build a deploy serves;
//   - the page is in formancy.ai's room (0015): every custom property
//     @formancy/themes' room.css sets, as installed, holds its value on
//     :root -- the workbench's among them, which the room must come after
//     -- in the room's colour scheme, on its ground;
//   - every face the page declares had loaded once it settled, and in the
//     pass that refuses them, none had.
//
// Against the page `vite build` writes, served by `vite preview` on the port
// vite.config.ts fixes, which fails rather than wander when the port is
// taken, under the path the demo on formancy.ai is served at and with the
// headers the deploy writes for it, for the gate's address
// (scripts/demo.mjs, scripts/demo-headers.mjs).
// Asserted as numbers and computed results, never screenshots.
//
// In Chromium, Firefox and WebKit, the browsers scripts/browsers.mjs names,
// each launched by its name, one after the other over the one build served
// once, every check in every browser (0014, as formancy.ai-data's 0058).
// FORMANCY_BROWSERS narrows a run, and CI's legs name one browser each;
// WebKit runs on Linux alone. What the browsers disagree on is that file's
// table, each row held by a check of one name in every browser
// (gate-facts.mjs).
//
// `pnpm --filter @formancy/health-demo test:browser`, after `pnpm build` has
// built the packages the demo imports. Each check is printed and kept in
// test-results/browser-<browser>.json (gate-results.mjs), with the passes
// planned, which the release report reads (collect.mjs --job browser
// --variant <browser>).

import { existsSync, readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { join } from 'node:path'
import * as playwright from 'playwright'
import { build, preview, resolveConfig, runnerImport } from 'vite'
import { browserName, FACTS, gateBrowsers, installCommand, LAUNCH_OPTIONS, prose, ranIn } from '../../../scripts/browsers.mjs'
import { headersFor } from '../../../scripts/demo-headers.mjs'
import { demoBase, readDemoConfig } from '../../../scripts/demo.mjs'
import { HL7_NOTICE, LOINC_NOTICE, MARK } from '../../../scripts/notices.mjs'
import { NOTICES_FILE } from '../../../scripts/third-party-notices.mjs'
import { corpusBytes, journey } from './gate-journey.mjs'
import { app, audit, describeFocus, dist, FONT_FILE, fontProblem, measureWidth, passes, reactProblem, recordReact, roomProblem } from './gate-page.mjs'
import { consoleErrors, policyChecks, privacyChecks, recordViolations, watch } from './gate-privacy.mjs'
import { gateRecorder } from './gate-results.mjs'

/** How long a state may take to come: Playwright's default, which every wait below runs under. */
const WITHIN = 30_000

/** One of the page's own modules, as Vite resolves and transforms it: its words, its file names, its links. */
const pageModule = async (file) => (await runnerImport(join(app, 'src', file), { root: app, configFile: false, logLevel: 'error' })).module

/** The layout, the colours and the targets of the state the page is in, said under `state`. */
async function measured(gate, page, state) {
  const { check } = gate
  const width = await measureWidth(page)
  check(`${state}: no sideways scroll`, width.overflow > 0 ? `${String(width.overflow)}px of horizontal overflow` : null)
  check(`${state}: nothing past either edge`, width.past.length === 0 ? null : width.past.join('; '))
  await page.evaluate(() => (document.activeElement instanceof HTMLElement ? document.activeElement.blur() : undefined))
  const result = await audit(page)
  gate.axe(result.axe)
  check(`${state}: axe's default rules and target size find nothing`, result.violations.length === 0 ? null : result.violations.join('; '))
  check(`${state}: contrast and target size measured, over something`, result.measured.length === 2 ? null : `only ${result.measured.join(', ') || 'nothing'}`)
  check(`${state}: the contrast of every text in view decided`, result.undecided.length === 0 ? null : `undecided: ${result.undecided.join('; ')}`)
  gate.measure({
    name: `${state}: texts whose contrast axe could not decide because their region had scrolled them out of view`,
    value: result.hidden,
    unit: 'texts',
  })
}

/**
 * What the page says of itself before anyone touches it: its language,
 * that search engines are to leave it out, its name without HL7's marks,
 * its banner once, the marks on its first naming of the standard, the two
 * notices word for word and in English, links to nowhere but
 * src/links.ts's addresses, the skip link's target and the downloads of
 * bytes it holds, and the notices of what it bundles, served as the build
 * wrote them -- asked for by the gate, outside the page, whose policy
 * would refuse the page the request.
 */
async function head(gate, page, { language, w, links }) {
  const { check } = gate
  const said = await page.evaluate(() => ({
    lang: document.documentElement.lang,
    title: document.title,
    robots: document.querySelector('meta[name="robots"]')?.getAttribute('content') ?? null,
    text: document.body.innerText,
  }))
  check(
    'the page opens in the browser’s language: <html lang> and its title',
    said.lang === language && said.title === w.title ? null : `<html lang="${said.lang}">, "${said.title}"`,
  )
  check('the page says noindex', said.robots === 'noindex' ? null : `its robots meta is ${JSON.stringify(said.robots)}`)
  const heading = await page.getByRole('heading', { level: 1 }).textContent()
  check('its title and its heading hold no HL7 mark', !MARK.test(said.title) && !MARK.test(heading ?? '') ? null : `"${said.title}", "${heading}"`)
  const banners = await page.getByText(w.banner, { exact: true }).count()
  check(
    'it says once that its data is synthetic, that a real patient’s does not belong in it, and that it sends what is typed nowhere and keeps none of it',
    banners === 1 ? null : `its banner is on the page ${String(banners)} times`,
  )
  const first = [...said.text.matchAll(/\b(HL7|FHIR)(®?)/g)]
  const unmarked = ['HL7', 'FHIR'].filter((mark) => first.find((match) => match[1] === mark)?.[2] !== '®')
  check(
    'the first time it names the standard, it names the HL7® FHIR® standard',
    unmarked.length === 0 ? null : `the first ${unmarked.join(' and ')} ${unmarked.length === 1 ? 'has' : 'have'} no ®`,
  )
  const foot = page.getByRole('contentinfo')
  const notices = []
  for (const notice of [HL7_NOTICE, LOINC_NOTICE]) {
    const found = foot.getByText(notice, { exact: true })
    if ((await found.count()) !== 1 || (await found.getAttribute('lang')) !== 'en') notices.push(notice.slice(0, 40))
  }
  check('HL7’s notice and LOINC’s stand in the foot of the page, word for word, marked English', notices.length === 0 ? null : `not so: ${notices.join('; ')}`)
  const hrefs = await page.getByRole('link').evaluateAll((anchors) => anchors.map((anchor) => anchor.getAttribute('href') ?? ''))
  const strays = hrefs.filter((href) => href !== '#demo' && !href.startsWith('blob:') && !Object.values(links).includes(href))
  check(
    'every link is one src/links.ts names, the skip link’s, or a download of bytes the page holds',
    hrefs.length > 0 && strays.length === 0 ? null : strays.join(', ') || 'the page holds no link',
  )
  const linked = (await foot.getByRole('link', { name: w.footer.notices, exact: true }).getAttribute('href')) ?? ''
  const bundled = await page.context().request.get(new URL(linked, page.url()).href)
  const served = bundled.ok() ? await bundled.body() : null
  const type = bundled.headers()['content-type'] ?? 'no type'
  check(
    'the notices its foot links to are the THIRD-PARTY-NOTICES.txt its build wrote, served as text',
    linked === NOTICES_FILE && served?.equals(readFileSync(join(dist, NOTICES_FILE))) === true && /^text\/plain\b/.test(type)
      ? null
      : `${linked}: ${String(bundled.status())}, ${type}${served === null ? '' : ', other bytes than the build wrote'}`,
  )
}

/**
 * From the top of the page: the skip link, on screen, then <main>, then its
 * first control. Run on a page just loaded, which nothing has focused, so
 * the first Tab is a person's first: formancy.ai-data's harness clicks the
 * page's corner to start from the top, and here the corner is the language
 * bar, which comes after the skip link.
 */
async function keyboard(gate, page, w) {
  const { check } = gate
  await page.keyboard.press('Tab')
  const skip = page.getByRole('link', { name: w.skip, exact: true })
  const shown = await skip.evaluate((link) => {
    const box = link.getBoundingClientRect()
    return { focused: link === document.activeElement, onScreen: box.top >= 0 && box.left >= 0 && box.right <= document.documentElement.clientWidth }
  })
  check('the first Tab reaches the skip link', shown.focused ? null : `focus went to ${await describeFocus(page)} first`)
  check('which is on screen while it has focus', shown.onScreen ? null : 'it stayed off screen')
  const skipAudit = await audit(page, skip)
  check('the skip link, shown: axe finds nothing', skipAudit.violations.length === 0 ? null : skipAudit.violations.join('; '))
  await page.keyboard.press('Enter')
  const main = page.getByRole('main')
  check(
    'Enter on it puts the keyboard on <main>',
    (await main.evaluate((element) => element === document.activeElement)) ? null : `the focus is on ${await describeFocus(page)}`,
  )
  await page.keyboard.press('Tab')
  const into = await main.evaluate((element) => {
    const tabbable = [...element.querySelectorAll('*')].filter((each) => each.tabIndex >= 0 && !each.disabled && each.getClientRects().length > 0)
    return tabbable[0] === document.activeElement
  })
  check('and the next Tab reaches the first control in it', into ? null : `the focus is on ${await describeFocus(page)}`)
}

/**
 * One pass: the whole journey at one viewport, in one language, from a
 * context of its own, so nothing one pass left reaches the next, in the
 * browser `name` names.
 */
async function pass(gate, { browser, name }, { url, headers }, { label, width, height, language, refuseFonts = false }, modules) {
  gate.pass({ label, width, height })
  const context = await browser.newContext({ locale: language, viewport: { width, height } })
  await context.addInitScript(recordViolations)
  await context.addInitScript(recordReact)
  const page = await context.newPage()
  page.setDefaultTimeout(WITHIN)
  const thrown = []
  page.on('pageerror', (error) => thrown.push(error.message))
  const errors = consoleErrors(page)
  const watcher = watch(page, url)
  // The fallback stack's pass: every font file refused, wherever it is
  // from, each kept by its address, so that what the browser says of it
  // is told from what the page does.
  const refused = refuseFonts ? new Set() : null
  if (refused !== null) {
    await page.route(FONT_FILE, (route) => {
      refused.add(route.request().url())
      return route.abort()
    })
  }
  try {
    await page.goto(url, { waitUntil: 'load' })
    await watcher.settle({ within: WITHIN })
    gate.check('the page runs React’s production build, the one a deploy serves', await reactProblem(page))
    gate.check(
      'the page is in formancy.ai’s room: every variable room.css sets holds on :root, the workbench’s among them, drawn dark on the room’s ground',
      await roomProblem(page),
    )
    const w = modules.words.WORDS[language]
    await head(gate, page, { language, w, links: modules.links.LINKS })
    await keyboard(gate, page, w)
    await journey(gate, page, {
      language,
      words: modules.words.WORDS,
      languages: modules.words.LANGUAGES,
      files: modules.exports.FILES,
      pdfFile: modules.exports.PDF_FILE,
      expected: modules.expected,
      measured: (state) => measured(gate, page, state),
    })
    const faces = FACTS.forgetsLoadedFaces
    gate.check(
      refuseFonts ? 'with the web fonts refused, none loaded' : faces.heldBy.checks[0],
      await fontProblem(page, { refused: refuseFonts, forgets: faces.values[name] === true }),
    )
    gate.check('the page threw nothing', thrown.length === 0 ? null : thrown.slice(0, 3).join('; '))
    await privacyChecks(gate, { context, page, watcher, url, browser: name, refused })
    await policyChecks(gate, { context, page, watcher, url, headers, errors, browser: name, refusedFonts: refused ?? new Set() })
  } finally {
    await context.close()
  }
}

/** The Playwright that launches every browser: the report holds each launch to the build it pins. */
const PLAYWRIGHT = createRequire(import.meta.url)('playwright/package.json').version

/** `name` launched by name, or an error that says how to download the build Playwright pins for it. */
async function launch(name, options) {
  try {
    return await playwright[name].launch(options)
  } catch (error) {
    const first = (error instanceof Error ? error.message : String(error)).split('\n')[0]
    throw new Error(`${browserName(name)} did not launch (${first}); \`${installCommand(name)}\` downloads the build Playwright ${PLAYWRIGHT} pins for it`, {
      cause: error,
    })
  }
}

/**
 * The page as every pass measures it, made once for every browser: the
 * build first, as `vite build` makes it, then its own modules, the passes,
 * the corpus, and the build served. Vite sets NODE_ENV for the first config
 * it resolves when nothing has, and keeps it: the serve config pageModule
 * resolves, resolved first, made it `development`, and the build after it
 * bundled React's development build, which no deploy serves (found on 18
 * October 2026; reactProblem holds it).
 */
async function prepare() {
  await build({ root: app, logLevel: 'warn' })
  if (!existsSync(join(dist, 'index.html'))) throw new Error('vite build wrote no apps/demo/dist/index.html')
  const modules = { words: await pageModule('words/index.ts'), exports: await pageModule('exports.ts'), links: await pageModule('links.ts') }
  const list = passes(modules.words.LANGUAGES)
  modules.expected = await corpusBytes()
  // Under the path formancy.ai serves the demo at, with the headers the
  // deploy writes for it, for this address (0012), so every check below
  // is of the build as the demo is served: a file asked for by an
  // absolute path is outside it, and the check on what the page fetched
  // names it; a file from outside the build's assets is refused.
  const base = demoBase(readDemoConfig())
  const { port } = (await resolveConfig({ root: app, logLevel: 'error' }, 'serve', 'production', 'production', true)).preview
  const url = `http://localhost:${String(port)}${base}`
  const headers = headersFor(url)
  const server = await preview({ root: app, base, preview: { headers }, logLevel: 'warn' })
  const served = server.resolvedUrls?.local ?? []
  if (!served.includes(url)) {
    await server.close()
    throw new Error(`vite preview serves the demo at ${served.join(', ') || 'no local address'}, not at ${url}, the address its policy is written for`)
  }
  console.log(`the built demo, served by vite preview at ${url}`)
  return { modules, list, url, headers, server }
}

/**
 * Every pass in one browser, launched by its name, with a record of its
 * own, written however the run ends: `test-results/browser-<name>.json`.
 * Null when every check held; otherwise what failed, as a sentence.
 */
async function inBrowser(name, { modules, list, url, headers }) {
  const gate = gateRecorder('apps/demo', { browser: name, playwright: PLAYWRIGHT })
  let browser
  try {
    gate.plan(list)
    const options = { ...LAUNCH_OPTIONS }
    console.log(`\n== ${browserName(name)}`)
    browser = await launch(name, options)
    gate.launched(browser, options)
    for (const each of list) await pass(gate, { browser, name }, { url, headers }, each, modules)
    const failures = gate.failures()
    if (failures.length > 0) return `${String(failures.length)} check(s) failed in ${browserName(name)}:\n  ${failures.join('\n  ')}`
    console.log(
      `\n${browserName(name)}: the demo's whole journey in ${String(list.length)} passes, in ${String(new Set(list.map((each) => each.language)).size)} languages, from ${String(Math.min(...list.map((each) => each.width)))} to ${String(Math.max(...list.map((each) => each.width)))}px wide, every check held`,
    )
    return null
  } catch (error) {
    gate.error(error)
    return `${browserName(name)} stopped: ${error instanceof Error ? error.message : String(error)}`
  } finally {
    await browser?.close()
    gate.write(app)
  }
}

/**
 * The gate in every browser FORMANCY_BROWSERS chooses (scripts/browsers.mjs),
 * one after the other, over one build served once. A page that could not be
 * made or served is each browser's error, in its own record, so the report
 * reads why rather than finding nothing.
 */
async function main() {
  const chosen = gateBrowsers()
  console.log(ranIn(chosen))
  let prepared
  try {
    prepared = await prepare()
  } catch (error) {
    for (const name of chosen) {
      const gate = gateRecorder('apps/demo', { browser: name, playwright: PLAYWRIGHT })
      gate.error(error)
      gate.write(app)
    }
    throw error
  }
  const failed = []
  try {
    for (const name of chosen) {
      const problem = await inBrowser(name, prepared)
      if (problem !== null) failed.push(problem)
    }
  } finally {
    await prepared.server.close()
  }
  if (failed.length > 0) throw new Error(failed.join('\n'))
  console.log(`\nbrowser checks passed in ${prose(chosen.map(browserName))}, for the layout, focus, colour, request and policy facts jsdom cannot represent`)
}

try {
  await main()
} catch (error) {
  console.error(`\nthe demo's browser gate failed: ${error instanceof Error ? error.message : String(error)}`)
  process.exitCode = 1
}
