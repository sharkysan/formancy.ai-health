// The browsers this repository's gates run in, how a gate is told which,
// and what the browsers disagree on (0014): formancy.ai-data's
// scripts/browsers.mjs and its 0058, applied to the demo's gate.
//
// One list, BROWSERS, read by the demo's gate (apps/demo/scripts/
// browser-test.mjs), by collect.mjs for the file a leg of the `browser`
// job leaves, and by tested-on.mjs for the build of each that Playwright
// pins, which the report holds every launched browser to: its version,
// and the build LAUNCH_OPTIONS starts (PINNED_AS). The browser job of
// .github/workflows/gates.yml runs one leg per browser of it, and
// browsers.test.mjs fails when the two lists differ.
//
// FORMANCY_BROWSERS chooses for a run: unset, the gate runs in every
// browser of BROWSERS, one after the other; a comma list runs those, and
// CI names each leg's. Data's runs Chromium alone when it is unset, for
// the PostgreSQL its host gate starts per browser; the demo's gate starts
// nothing but the page's server, once. What keeps the variable from being
// a skip is the report, which fails a run in which the gate left no
// results in one of BROWSERS, and collect.mjs --local, which expects
// every one.
//
// FACTS is the table of what the browsers disagree on, Data's 0058 table
// for this page: each row a value per browser, where it was read, how it
// was measured, and the checks that hold it, which the gate makes in
// every browser under one name, so a browser that changes fails a check
// by name rather than its check going missing; and the report fails a run
// in which the gate did not make one of them in a browser
// (release-report/problems.mjs), so a check taken out of the gate in
// every browser at once is missed too.
//
// It imports nothing: collect.mjs imports it, and collect runs in every job
// of the gates, whatever that job's install did (workflows.test.mjs follows
// the imports).

/** Every browser the gates run in, by Playwright's name for it, in the order the legs and the report list them. */
export const BROWSERS = Object.freeze(['chromium', 'firefox', 'webkit'])

/**
 * The one browser the README's pictures of the demo are taken in, and
 * checked in by CI's browser job, in this browser's leg alone (0016):
 * Chromium, whose canvas encodes the WebP the README shows, as
 * formancy.ai-report's and formancy.ai-data's pictures are taken. collect.mjs
 * reads the pictures' check in this leg, and the report holds its launch to
 * this browser's pin.
 */
export const PICTURES_BROWSER = 'chromium'

/** The variable the gate reads, and turbo.json passes to test:browser (browsers.test.mjs holds the two). */
export const VARIABLE = 'FORMANCY_BROWSERS'

/** Each browser as a reader knows it; one without a name here is shown by its own. */
const NAMES = Object.freeze({ chromium: 'Chromium', firefox: 'Firefox', webkit: 'WebKit' })

export const browserName = (browser) => NAMES[browser] ?? String(browser)

/** `a`, `a and b`, `a, b and c`. */
export const prose = (items) => (items.length <= 1 ? (items[0] ?? '') : `${items.slice(0, -1).join(', ')} and ${items.at(-1)}`)

/** The options the browser gate launches a browser with. */
export const LAUNCH_OPTIONS = Object.freeze({ headless: true })

/**
 * The build of Playwright's browsers.json each browser of BROWSERS starts
 * with LAUNCH_OPTIONS. Chromium launched headless starts the headless shell,
 * which Playwright pins beside the full browser at the same version, so the
 * version alone does not tell the two apart (formancy.ai-data's
 * launchedBuild, which reads Playwright's choice of executable): the report
 * holds a launch to `headless` as well. Firefox and WebKit have one build
 * each, headless or not.
 */
export const PINNED_AS = Object.freeze(
  Object.fromEntries(BROWSERS.map((browser) => [browser, browser === 'chromium' && LAUNCH_OPTIONS.headless ? 'chromium-headless-shell' : browser])),
)

/**
 * What a gate records of the browser it launched with `options`: the name and
 * version the browser gives, and whether it ran headless, which is
 * Playwright's default when `options` does not say.
 */
export const launchedAs = (instance, options) => ({ name: instance.browserType().name(), version: instance.version(), headless: options.headless ?? true })

/**
 * The platforms each browser's gate runs on; one not named runs on any.
 * WebKit on Linux alone, as formancy.ai-data's 0058 runs it: Playwright's
 * WebKit on Windows and macOS is another port, and the one CI's leg runs
 * is Linux's. Measured here too, on 18 October 2026: in WebKit 27.2 on
 * Windows 11 the demo's first Tab went past the skip link to the language
 * select, a link being no stop of that port's Tab, where the same build
 * in Playwright's Linux image reached the skip link first, as Chromium and
 * Firefox do.
 */
const ONLY_ON = Object.freeze({ webkit: 'linux' })

/** The browsers of `browsers` that run on `platform`. */
const runOn = (browsers, platform) => browsers.filter((browser) => ONLY_ON[browser] === undefined || ONLY_ON[browser] === platform)

/**
 * The browsers a gate runs in, from FORMANCY_BROWSERS in `env`, on
 * `platform`: every one of `browsers` that runs there when it is unset,
 * else those it names, in its order. Throws, with the sentence a person
 * acts on, for a browser not in `browsers`, a value that names none -- a
 * leg whose matrix value went missing, which must not quietly run every
 * browser -- a repeat, which would run one browser twice and overwrite its
 * own results, and WebKit off Linux, naming what runs there.
 */
export function gateBrowsers({ env = process.env, browsers = BROWSERS, platform = process.platform } = {}) {
  const value = env[VARIABLE]
  if (value === undefined) return runOn(browsers, platform)
  const named = value
    .split(',')
    .map((entry) => entry.trim())
    .filter((entry) => entry !== '')
  if (named.length === 0)
    throw new Error(`${VARIABLE} is set and names no browser: unset it for every browser the gates run in here, or name some of ${browsers.join(', ')}`)
  for (const [at, browser] of named.entries()) {
    if (!browsers.includes(browser)) throw new Error(`${VARIABLE} names ${browser}, which is no browser the gates run in: ${browsers.join(', ')}`)
    if (named.indexOf(browser) !== at) throw new Error(`${VARIABLE} names ${browser} twice`)
  }
  const refused = named.find((browser) => !runOn([browser], platform).includes(browser))
  if (refused !== undefined) {
    throw new Error(
      `${VARIABLE} names ${browserName(refused)}, which the gate runs on Linux only: Playwright's ${browserName(refused)} on ${platform} is another port than the one CI runs, and the gate holds 0014's table on Linux's. Here, ${VARIABLE}=${runOn(browsers, platform).join(',')} pnpm test:browser`,
    )
  }
  return named
}

/** The line the gate prints first: which browsers it measures in, and which it leaves to another machine or another run. */
export function ranIn(chosen, { env = process.env, browsers = BROWSERS, platform = process.platform } = {}) {
  const names = prose(chosen.map(browserName))
  const rest = browsers.filter((browser) => !chosen.includes(browser))
  const left = rest.length === 0 ? '' : `; not in ${prose(rest.map(browserName))}, which the release report expects results from too`
  if (env[VARIABLE] === undefined)
    return `In ${names}: ${VARIABLE} is unset, which runs every browser the gate runs on ${platform}${left}${rest.some((browser) => ONLY_ON[browser] !== undefined) ? ', and which runs on Linux only' : ''}.`
  return `In ${names}, as ${VARIABLE}=${env[VARIABLE]} asks${left}.`
}

/** The command that downloads `browser` for the gate, from anywhere in the workspace: what a failed launch names. */
export const installCommand = (browser) => `pnpm --filter @formancy/health-demo exec playwright install ${browser}`

/** The demo's gate, which holds every row below. */
const DEMO = 'apps/demo'

/** Nothing in the browser's code was read for this row: it is what was measured. */
const NOT_READ = 'nothing read in its code: the row is what was measured'

/**
 * The committed gate's runs that measured every row below, and watched each
 * row's check fail with the table's values turned over.
 */
const GATE =
  'the committed gate, every check of its 8 passes held in each browser -- in Chromium 156.0.8078.4 and Firefox 157.0 on Windows 11, and in all three in Playwright’s Linux image v1.63.0-noble with Playwright 1.64.1’s builds installed in it -- and, with every row’s values turned over, each row’s check failed in every pass it is made in, in Chromium on Windows 11 and in WebKit in that image'

/** How refusesItsOwnSelectStyle was measured: the gate, and before it the probes that found the row, not committed. */
const SELECT_PROBE = Object.freeze({
  on: '2026-10-18',
  by: `${GATE}; before it, pages of one element each under a policy whose style-src admits no inline style, served by Node: a <select> written in the HTML with no script, one created by a script and inserted, one created and never inserted, each with one option, several or a size, reported once each in WebKit 27.2 and never in Chromium 156.0.8078.4 or Firefox 157.0, on Windows 11 and in Playwright’s Linux image v1.63.0-noble with Playwright 1.64.1’s builds installed in it; text, date, number, checkbox, radio, range, colour and file inputs, a textarea, a datalist, details, progress and meter reported nothing in any; and WebKit 26.6, Playwright 1.63.0’s, reported nothing for a select either`,
})

/**
 * What the browsers disagree on, each row held by the checks `heldBy`
 * names, which its gate makes in every browser under one name (0014).
 * `values` is each browser's answer, `source` where it was read, and
 * `measured` how: `{ on, by }`.
 */
export const FACTS = Object.freeze({
  refusesItsOwnSelectStyle: Object.freeze({
    says: 'under a policy whose style-src admits no inline style, every <select> has a style attribute of the browser’s own refused, text-overflow:inherit, which it reports as the page’s -- a securitypolicyviolation of style-src-attr, blocked "inline", at the select -- and logs as an error',
    heldBy: Object.freeze({
      gate: DEMO,
      checks: Object.freeze(['a <select> under the page’s policy: the browser refuses a style of its own as 0014’s table says of this browser']),
    }),
    /**
     * What the browser reports and logs, once for each select: the report
     * as the gate's listener keeps it (gate-privacy.mjs) -- its `sample`
     * given only where the policy asks for one with 'report-sample', which
     * the demo's does not -- and the console's line, word for word.
     */
    report: Object.freeze({ directive: 'style-src-attr', blocked: 'inline', target: 'SELECT', sample: 'text-overflow:inherit' }),
    console:
      "Refused to apply a stylesheet because its hash, its nonce, or 'unsafe-inline' does not appear in the style-src directive of the Content Security Policy.",
    values: Object.freeze({ chromium: false, firefox: false, webkit: true }),
    source: Object.freeze({
      chromium: NOT_READ,
      firefox: NOT_READ,
      webkit: `${NOT_READ}; not found where it was looked for at WebKit 56453fd, the base Playwright 1.64.1’s browser_patches/webkit/UPSTREAM_CONFIG.sh names: Source/WebCore/html/HTMLSelectElement.cpp, shadow/SelectFallbackButtonElement.cpp and shadow/SelectPopoverElement.cpp, HTMLOptionElement.cpp, css/html.css, nor in Playwright’s patches/bootstrap.diff`,
    }),
    measured: Object.freeze({ chromium: SELECT_PROBE, firefox: SELECT_PROBE, webkit: SELECT_PROBE }),
  }),
  forgetsLoadedFaces: Object.freeze({
    says: 'a face the page loaded as it started (src/faces.ts) and does not draw with is "unloaded" again in document.fonts once the page has drawn, and loads again, from what the browser already holds, when it is next asked for',
    heldBy: Object.freeze({
      gate: DEMO,
      checks: Object.freeze(['every face the page declares loaded as it started, and is loaded still or loads again, as 0014’s table says of this browser']),
    }),
    values: Object.freeze({ chromium: false, firefox: false, webkit: true }),
    source: Object.freeze({ chromium: NOT_READ, firefox: NOT_READ, webkit: NOT_READ }),
    measured: Object.freeze({
      chromium: Object.freeze({
        on: '2026-10-18',
        by: `${GATE}; before it, a probe of the built demo under its headers on Windows 11, Playwright 1.64.1: 28 faces, 28 calls of load() as the page started, 28 files asked for, and 28 faces loaded once it had settled`,
      }),
      firefox: Object.freeze({ on: '2026-10-18', by: `${GATE}; before it, the same probe: 28 faces, 28 calls, 28 files, 28 loaded` }),
      webkit: Object.freeze({
        on: '2026-10-18',
        by: `${GATE}; before it, the same probe, in WebKit’s Windows port: every one of the 28 calls fulfilled "loaded", in 32 to 172 ms, and 1.5 s later 23 faces were "unloaded"; load() again fulfilled "loaded" for each, in 0 ms, and asked for no file; nor did typing Latin Extended, Vietnamese, Greek and Cyrillic text ask for one`,
      }),
    }),
  }),
  asksForTheNextFileLater: Object.freeze({
    says: 'when a face’s first file, its woff2, does not arrive, the page’s load() as it started (src/faces.ts) does not go on to its next file, its woff: the browser asks for that only when text in the face’s range is first drawn, which can be after the page settled -- what was typed, told by which file is asked for',
    heldBy: Object.freeze({
      gate: DEMO,
      checks: Object.freeze([
        'with the web fonts refused, a face’s next file is asked for only once text in its range is drawn, as 0014’s table says of this browser',
      ]),
    }),
    values: Object.freeze({ chromium: false, firefox: false, webkit: true }),
    source: Object.freeze({ chromium: NOT_READ, firefox: NOT_READ, webkit: NOT_READ }),
    measured: Object.freeze({
      chromium: Object.freeze({
        on: '2026-10-18',
        by: `${GATE}; before it, a probe of the built demo under its headers, every font file refused, on Windows 11, Playwright 1.64.1: 28 woff2 and 28 woff asked for as the page started, and nothing once Latin Extended, Vietnamese, Greek and Cyrillic text was typed`,
      }),
      firefox: Object.freeze({ on: '2026-10-18', by: `${GATE}; before it, the same probe: 28 woff2 and 28 woff as it started, nothing once typed` }),
      webkit: Object.freeze({
        on: '2026-10-18',
        by: `${GATE}; before it, the same probe, in WebKit’s Windows port: 28 woff2 and 5 woff as the page started, every face "unloaded" after, and the latin-ext, vietnamese, greek and cyrillic woff of IBM Plex Sans 400 once that text was typed; with the files served, typing asked for nothing`,
      }),
    }),
  }),
})
