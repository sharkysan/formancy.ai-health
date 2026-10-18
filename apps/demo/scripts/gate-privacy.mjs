// What the demo's page asks of the network and of the browser, held to
// what it says of itself (0012): it sends what a visitor types nowhere and
// keeps none of it. The page says nothing about cookies, tracking or
// analytics, and these checks make no such claim for it either: they hold
// what the page does with what is typed, and that the policy it is served
// under (scripts/demo-headers.mjs) is the one in force.
//
// A request is heard by Playwright, from the browser, and a `blob:` or
// `data:` address is left out of every set below: neither leaves the
// browser -- the downloads are blobs of bytes the page holds, the icon is
// `data:,`. A connection hint opens a connection with no request to hear,
// and a connection gives the host the address all the same
// (formancy.ai 0154), so the page's hints are read from the page.
//
// What the page stores is read through the browser's own interfaces, in
// the page; whether the policy is in force is shown by planting what it
// refuses -- a string handed to innerHTML, a fetch, and what Cloudflare's
// features inject into a page as it is served -- after the journey, and
// watching the browser refuse each and say so.
//
// What a browser does of its own, which 0014's table names -- a style
// refused, a font file asked for late -- is told apart from the page's by
// gate-facts.mjs, and each row held there by a check of its own; the
// faces WebKit forgets are gate-page.mjs's fontProblem's.

import { heldNextFile, heldSelectStyle, lateOfItsOwn, selectsDrawTheSame, thePagesOwn } from './gate-facts.mjs'

/**
 * Installed before any script of the page runs: every report of the
 * policy, kept in the page's memory for the gate to read. Not in any
 * storage, which the checks below hold empty. Beside the directive and what
 * it blocked, the element it was reported at, by its name -- the document,
 * where the element was never in it -- and by the order in which elements
 * were first reported, so that two reports at one element are told from
 * one at each of two; whether that element holds a style attribute of the
 * page's own, the sample a policy with 'report-sample' asks for, and where
 * the browser says it happened: what tells a refusal of the page's from
 * one of the browser's own (0014).
 */
export function recordViolations() {
  window.__gateViolations = []
  const elements = new WeakMap()
  let next = 0
  document.addEventListener('securitypolicyviolation', (event) => {
    const element = event.target instanceof Element ? event.target : null
    if (element !== null && !elements.has(element)) {
      elements.set(element, next)
      next += 1
    }
    window.__gateViolations.push({
      directive: event.effectiveDirective,
      blocked: event.blockedURI,
      target: event.target?.nodeName ?? null,
      element: element === null ? null : elements.get(element),
      ownStyle: element !== null && element.hasAttribute('style'),
      sample: event.sample,
      at: `${event.sourceFile || 'the page'}:${String(event.lineNumber)}`,
    })
  })
}

/** A report as a failure names it. */
export const saidOf = (entry) => `${entry.directive} refused ${entry.blocked}${entry.target === null ? '' : ` at ${entry.target}`}${entry.sample ? ` (${entry.sample})` : ''}, ${entry.at}`

/**
 * Every error `page` logs to its console from now on, as its text and the
 * address the console says it came from: what a person with the console
 * open sees go wrong, the browser's own refusals among it, which a check
 * reads before anything is planted.
 */
export function consoleErrors(page) {
  const errors = []
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push({ text: message.text(), url: message.location().url ?? '' })
  })
  return errors
}

const leavesTheBrowser = (address) => !/^(?:blob|data):/.test(address)

/**
 * Every request `page` makes, and every response it is given, from now on,
 * each marked by whether the page had settled when it was made: loaded,
 * its faces ready, nothing in flight. `url` is the built demo's address.
 */
export function watch(page, url) {
  const requests = []
  const responses = []
  const inFlight = new Set()
  let phase = 'loading'
  page.on('request', (request) => {
    if (!leavesTheBrowser(request.url())) return
    inFlight.add(request)
    requests.push({ address: request.url(), method: request.method(), body: request.postData() !== null, phase })
  })
  const done = (request) => inFlight.delete(request)
  page.on('requestfinished', done)
  page.on('requestfailed', done)
  page.on('response', (response) => {
    if (response.url().startsWith(url)) responses.push({ address: response.url(), status: response.status(), headers: response.headers() })
  })
  return {
    requests,
    responses,
    /**
     * Until the page has settled: its load event, every face it asked for
     * loaded or refused, and no request in flight for 300 ms. From then on
     * every request is one made after it settled.
     */
    async settle({ within = 30_000 } = {}) {
      await page.waitForLoadState('load')
      const deadline = Date.now() + within
      let quiet = 0
      while (quiet < 3) {
        if (Date.now() > deadline) throw new Error(`the page never settled: ${String(inFlight.size)} request(s) still in flight after ${String(within)} ms`)
        await page.evaluate(() => document.fonts.ready.then(() => undefined))
        await page.waitForTimeout(100)
        quiet = inFlight.size === 0 ? quiet + 1 : 0
      }
      phase = 'settled'
    },
  }
}

/** The page's connection hints, as addresses. */
const hintsOf = (page) => page.evaluate(() => [...document.querySelectorAll('link')].filter((link) => ['preconnect', 'dns-prefetch', 'prefetch', 'prerender'].some((rel) => link.relList.contains(rel))).map((link) => link.href))

const said = (list) => list.slice(0, 4).join(', ')

/**
 * What the page asked for and kept: nothing outside the built demo, its
 * faces included; nothing at all once it had settled, through every step
 * the journey took and every script it typed; nothing but GETs without a
 * body; no cookie; and nothing in any of the browser's stores.
 */
export async function privacyChecks(gate, { context, page, watcher, url, browser, refused = null }) {
  const { check } = gate
  const elsewhere = watcher.requests.filter((request) => !request.address.startsWith(url)).map((request) => request.address)
  for (const address of await hintsOf(page)) if (!address.startsWith(url)) elsewhere.push(`${address} (a hint)`)
  check('the page fetched nothing and hinted no connection outside the built demo, its faces included', elsewhere.length === 0 ? null : said(elsewhere))
  // In the pass that refuses the web fonts, the font files 0014's table
  // says this browser asks for of its own once text in a face's range is
  // drawn, each refused by the gate, so that none left the browser; that
  // row is held beside this check, and everything else asked for late is
  // the page's.
  const settled = watcher.requests.filter((request) => request.phase === 'settled')
  const addresses = settled.map((request) => request.address)
  const pages = refused === null ? addresses : lateOfItsOwn(browser, { late: addresses, refused }).page
  const late = settled.filter((request) => pages.includes(request.address)).map((request) => `${request.method} ${request.address.replace(url, '')}`)
  check('once it had settled, the page asked for nothing more, whatever was typed into it, changed, shown or downloaded', late.length === 0 ? null : `it asked for ${said(late)}${late.length > 4 ? ` and ${String(late.length - 4)} more` : ''}`)
  if (refused !== null) heldNextFile(gate, { browser, late: addresses, refused })
  const sent = watcher.requests.filter((request) => request.method !== 'GET' || request.body).map((request) => `${request.method} ${request.address}`)
  check('and nothing it asked for carried a body or was other than a GET', sent.length === 0 ? null : said(sent))
  check('the page set no cookie', (await context.cookies()).length === 0 && (await page.evaluate(() => document.cookie)) === '' ? null : `cookies: ${(await context.cookies()).map((cookie) => cookie.name).join(', ') || await page.evaluate(() => document.cookie)}`)
  const stored = await page.evaluate(async () => {
    const found = []
    if (localStorage.length > 0) found.push(`${String(localStorage.length)} in localStorage`)
    if (sessionStorage.length > 0) found.push(`${String(sessionStorage.length)} in sessionStorage`)
    const databases = await indexedDB.databases()
    if (databases.length > 0) found.push(`IndexedDB ${databases.map((database) => database.name).join(', ')}`)
    const caches = await window.caches.keys()
    if (caches.length > 0) found.push(`caches ${caches.join(', ')}`)
    const workers = await navigator.serviceWorker.getRegistrations()
    if (workers.length > 0) found.push(`${String(workers.length)} service worker(s)`)
    return found
  })
  check('and stored nothing in the browser: no local or session storage, no IndexedDB database, no cache, no service worker', stored.length === 0 ? null : stored.join('; '))
  // The skip link's fragment is the one change the page makes to its
  // address, and it is no answer.
  const address = page.url()
  check('and nothing typed reached its address: it is the page’s, with at most the skip link’s #demo', [url, `${url}#demo`].includes(address) ? null : `the address is ${address}`)
}

/** The headers a response carries other than `expected` says, or not at all. */
function headerProblems(expected, headers) {
  return Object.entries(expected).flatMap(([name, value]) => (headers[name.toLowerCase()] === value ? [] : [`${name}: ${headers[name.toLowerCase()] === undefined ? 'absent' : JSON.stringify(headers[name.toLowerCase()])}`]))
}

/**
 * Where Cloudflare serves the scripts of the features it injects into a
 * page it may transform -- Rocket Loader, email obfuscation, its challenge
 * -- on the page's own origin; a script the gate injects there, as such a
 * feature would.
 */
const CDN_CGI = '/cdn-cgi/scripts/gate/injected.js'

/**
 * The page served again, in a page of its own in `context`, with what such
 * a feature adds to its HTML added: an inline script, and a script under
 * /cdn-cgi/ of its origin, which is answered as Cloudflare would answer it.
 * Which of them ran, and what the policy reported.
 */
async function injected(context, url) {
  const served = await context.newPage()
  try {
    await served.route(new URL(CDN_CGI, url).href, (route) => route.fulfill({ contentType: 'text/javascript', body: 'window.__injected = [...(window.__injected ?? []), "cdn-cgi"]' }))
    await served.route(url, async (route) => {
      const response = await route.fetch()
      const html = await response.text()
      await route.fulfill({ response, body: html.replace('</head>', `<script>window.__injected = [...(window.__injected ?? []), "inline"]</script><script src="${CDN_CGI}"></script></head>`) })
    })
    await served.goto(url, { waitUntil: 'load' })
    await served.waitForTimeout(100)
    return await served.evaluate(() => ({ ran: window.__injected ?? [], reported: window.__gateViolations ?? [] }))
  } finally {
    await served.close()
  }
}

/** The violations the page has reported so far. */
const violations = (page) => page.evaluate(() => window.__gateViolations ?? null)

/**
 * The policy, in force: every file of the build was served with
 * `headers`, what scripts/demo-headers.mjs decides for the address the
 * gate serves it at; nothing the page did was refused, and its console
 * logged no error, the whole journey long, but what a row of 0014's table
 * says `browser` does of its own and, in the pass that refuses the web
 * fonts, what names a font file the gate refused (`refusedFonts`); that row
 * held on a page of its own; and what the policy refuses, planted after
 * the journey, is refused, each with the browser's report of it -- a
 * string handed to innerHTML, which Trusted Types refuses, a fetch to the
 * page's own origin, and, in the page served again with them in its HTML,
 * an inline script and a script under /cdn-cgi/ of its origin, neither of
 * which runs. Last in a pass, since what it plants is the gate's and not
 * the page's.
 */
export async function policyChecks(gate, { context, page, watcher, url, headers, errors, browser, refusedFonts }) {
  const { check } = gate
  const unheaded = watcher.responses.filter((response) => response.status === 200).flatMap((response) => headerProblems(headers, response.headers).map((problem) => `${response.address}: ${problem}`))
  check('every file of the build came with every header scripts/demo-headers.mjs decides for its address', watcher.responses.length > 0 && unheaded.length === 0 ? null : said(unheaded) || 'no response of the built demo was heard')
  const before = await violations(page)
  const pages = thePagesOwn(browser, { reports: before ?? [], errors, refused: refusedFonts })
  check('the page did nothing its policy refused, but what 0014’s table says this browser refuses of its own', before !== null && pages.reports.length === 0 ? null : before === null ? 'no listener was installed before the page ran' : said(pages.reports.map(saidOf)))
  check('and its console logged no error, the whole journey long, but that browser’s own and the font files this pass refused', pages.errors.length === 0 ? null : said(pages.errors.map((error) => error.text)))
  await selectsDrawTheSame(gate, page)
  await heldSelectStyle(gate, { context, url, headers, browser })
  const parsed = await page.evaluate(() => {
    try {
      document.createElement('div').innerHTML = '<b>planted</b>'
      return true
    } catch {
      return false
    }
  })
  const fetched = await page.evaluate((address) => fetch(address).then(() => 'fetched', () => 'refused'), new URL('index.html', page.url()).href)
  await page.waitForTimeout(100)
  const after = ((await violations(page)) ?? []).slice(before?.length ?? 0).map((entry) => entry.directive)
  check('its policy refused a string handed to innerHTML after the journey, and said so', !parsed && after.includes('require-trusted-types-for') ? null : parsed ? 'the string was parsed as markup' : `the browser reported ${after.join(', ') || 'nothing'}`)
  check('and a fetch to its own origin, and said so', fetched === 'refused' && after.includes('connect-src') ? null : fetched === 'fetched' ? 'the fetch was answered' : `the browser reported ${after.join(', ') || 'nothing'}`)
  const { ran, reported } = await injected(context, url)
  const reports = said(reported.map((entry) => `${entry.directive} ${entry.blocked}`)) || 'nothing'
  const refused = (blocked) => reported.some((entry) => entry.directive === 'script-src-elem' && blocked(String(entry.blocked)))
  check('served with an inline script injected into its HTML, the script did not run, and the policy said so', !ran.includes('inline') && refused((blocked) => blocked === 'inline') ? null : ran.includes('inline') ? 'the injected script ran' : `the browser reported ${reports}`)
  check('nor did a script of its own origin from outside the build’s assets, under /cdn-cgi/, where Cloudflare serves the scripts it injects', !ran.includes('cdn-cgi') && refused((blocked) => blocked.includes(CDN_CGI)) ? null : ran.includes('cdn-cgi') ? 'the /cdn-cgi/ script ran' : `the browser reported ${reports}`)
}
