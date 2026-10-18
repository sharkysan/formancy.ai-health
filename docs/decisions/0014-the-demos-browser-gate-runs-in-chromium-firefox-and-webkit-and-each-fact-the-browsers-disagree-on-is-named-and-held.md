# 0014 — Run the demo's browser gate in Chromium, Firefox and WebKit, a leg each, every check in every browser and every console error the page causes a failure; name and hold each fact the browsers disagree on, WebKit's own refusal of a style on every select among them, and loosen the policy for none

- **Status:** accepted
- **Date:** 2026-10-18
- **Deciders:** Daniel Bacher
- **Verified by:** the repository's guards, the release report's tests, the
  demo's suite and the browser gate itself, on 18 October 2026. Each case
  was watched failing first, its fault planted once and the file put back,
  its SHA-256 compared before and after:
  - **`scripts/browsers.test.mjs`** (`pnpm test:repo`) -- `BROWSERS` is the
    `browser` job's `matrix.browser`, in its order, and turbo hands
    `FORMANCY_BROWSERS` to `test:browser` (both failing until the matrix
    and turbo.json said so); `PINNED_AS` is the build each launch starts;
    `gateBrowsers` runs every browser that runs on the platform when the
    variable is unset, those it names otherwise, refuses an unknown name,
    an empty list and a repeat, and refuses WebKit on `darwin` and
    `win32`, naming the command that runs the rest; every row of `FACTS`
    has a value, a source and a dated measurement for every browser, is
    held by checks of an app whose `test:browser` is its gate, with no
    browser's name in a check's; and the select's row says exactly the
    report and the console line WebKit gives.
  - **`scripts/workflows.test.mjs`** -- the browser job is a leg per
    browser, `fail-fast` off; each leg installs its browser, WebKit's
    alone its system libraries, runs the gate with `FORMANCY_BROWSERS` its
    browser, collects with `--variant` its browser, caches its download
    under a key of its browser and keeps the gate's file as an artefact of
    its own; the report expects `browser-chromium`, `browser-firefox` and
    `browser-webkit`. Failed before gates.yml changed.
  - **`scripts/release-report/collect.test.mjs`** -- a leg's results hold
    its browser's file alone, under its key; a browser job that names no
    browser, or one the gates do not run in, is refused; a machine's
    collect expects every browser, whatever `FORMANCY_BROWSERS` said.
    Three cases failed before collect.mjs read the variant.
  - **`scripts/release-report/report.test.mjs`** -- a WebKit gate that
    lacks one of Chromium's checks in one pass and makes it twice in
    another, so that the totals are equal, fails the run with a sentence
    for each, naming the check, the pass and both browsers; a pass made
    in one browser and not another fails it; a gate that ended in an
    error is left out of the comparison; the passes are compared in their
    order, so one browser's made the other way round fails it; and a
    row's check made in no pass of any browser fails it once per browser.
    Both failed before problems.mjs compared the browsers, and the order's
    case with the passes compared as sorted lists.
  - **`scripts/release-report/render.test.mjs`** -- every row of the table,
    with each browser's answer and the checks that hold it, in the
    report's Browser section, and the summary naming the browsers the gate
    passed or failed in. Failed before render.mjs printed them.
    **`tested-on.test.mjs`** -- a pin for every browser, failing while it
    took every version for Chromium's four parts.
  - **`apps/demo/scripts/gate-facts.test.mjs`** (the demo's suite) -- of the
    reports, console lines and late requests a browser gives, what the
    page did: WebKit's own refusal at a select, one report of each select
    and each line matched to one report, left out in WebKit alone, and a
    style of the page's own on a select, another element, another
    directive, another sample, a second report at one select or a line
    more kept; the errors that name a font file the gate refused left
    out, wherever the browser names it; a late request of a refused font
    file left out in WebKit alone; each row's check failing where the
    browser answers otherwise than the row, and the select's row's line
    waited for where it comes late, and only so long; the probe page's
    policy the demo's with samples asked for; and the page's selects all
    at `clip`. Each of six faults planted in gate-facts.mjs failed its
    case, and three more since: every report at one select left out, the
    line read after a fixed wait, and the wait without a bound.
  - **The browser gate**, `apps/demo/scripts/browser-test.mjs`, in each
    browser: every check of every pass, the same in each; the browser
    refused nothing the page did and its console logged no error, the
    journey long, but what a row names; and each row's check. Before the
    rows, in Playwright's Linux image `v1.63.0-noble` with Playwright
    1.64.1's builds, WebKit 27.2 failed 24 of 584 checks: "the page did
    nothing its policy refused" in all 8 passes ("style-src-attr refused
    inline at SELECT, http://localhost:4395/health/assets/index-*.js:10",
    four times and more), the console check in all 8, "every face the
    page declares had loaded" in the 7 that serve the web fonts ("19 of 28
    faces did not load"), and, in the pass that refuses them, "once it
    had settled, the page asked for nothing more" (the woff of four of
    IBM Plex Sans's faces); Chromium 156.0.8078.4 and Firefox 157.0 one
    each, the console check in that pass, naming the font files the gate
    itself refused. With every row's values turned over, each row's check
    failed in every pass it is made in -- in Chromium on Windows 11, 8, 7
    and 1 times, and in WebKit in that image the same, with the checks
    the rows excuse failing beside them, 33 of 609 -- and the table put
    back, SHA-256 compared. A style the page set on a select and took off
    before the report came was excused in WebKit while the row excused
    every report of its shape: planted in the built demo, under its
    headers and with the gate's own listener and filter, it passed in
    WebKit on Windows 11 and failed in Chromium; with one report of each
    select excused, it fails in WebKit too.

  **Measured** on 18 October 2026, the gate as committed, twice in each
  place: all 609 checks of its 8 passes held each time, in Chromium
  156.0.8078.4 (72.9 and 46.1 s as its record times it) and Firefox 157.0
  (77.4 and 104.5 s) on Windows 11 under Node 24.21.0, and in Chromium
  (38.8 and 38.8 s), Firefox (59.7 and 55.4 s) and WebKit 27.2 (45.5 and
  46.8 s) in Playwright's Linux image `v1.63.0-noble`, Ubuntu 24.04.4,
  under Docker on that machine, Node 24.20.0, with Playwright 1.64.1's
  builds installed in it; and the release report's problems, over the
  synthetic green run with its three legs' gate files replaced by either
  of that image's runs, were none. The select's row's probe reads its
  reports once a task queued after the probe page's load has run: in 30
  runs of the select alone and 30 with a `<p style>` of the page's beside
  it, in each browser, on Windows 11 and in that image, every refusal had
  been reported by then -- Chromium's and Firefox's before the load in
  all but one run, WebKit's after it -- and WebKit's console line had
  reached the gate before the load in 40 of 40 runs in each. Through
  turbo, as a leg runs it, `FORMANCY_BROWSERS=chromium` ran Chromium alone; with `passThroughEnv`
  taken out of turbo.json, `FORMANCY_BROWSERS=opera` reached the gate as
  unset.

  **Not mechanically enforced:** that each row says what its browser's
  code does at the release Playwright builds it from -- no row's source
  was found in that code, and each is what was measured; that a WebKit
  pass says anything of Safari, which it does not; and every figure for
  CI, which no run had made when this was written.

## Context

- Asked of the demo as it went live, and answered by the lead on
  18 October 2026: the live page drew its form in Chromium, Firefox and
  WebKit at 1280 and 390 pixels, and WebKit 27.2, Playwright's
  `webkit-2370`, logged twice "Refused to apply a stylesheet because its
  hash, its nonce, or 'unsafe-inline' does not appear in the style-src
  directive of the Content Security Policy." Chromium and Firefox logged
  nothing. The demo's browser gate ran in Chromium alone
  ([0012](0012-a-demo-at-formancy-ai-health-fills-a-synthetic-referral-in-the-browser-served-by-a-worker-of-its-own.md),
  as formancy.ai-report's Studio gate does), so nothing had seen it.
- **What WebKit refuses.** Served by the gate's server under the headers
  `scripts/demo-headers.mjs` decides, WebKit reported, once for each of
  the page's two selects -- the language bar's and the form's specialty --
  a `securitypolicyviolation` of `style-src-attr`, blocked `inline`, at
  the select, from the bundle's line 10 at the column of React's
  `document.createElement('select')`. The page puts no style attribute on
  a select and holds none; its stylesheet is the one file `<link>`ed. A
  page of one `<select>` and no script, under a policy whose `style-src`
  admits no inline style, gave the same report, its sample, asked for
  with `'report-sample'`, `text-overflow:inherit`; so did a select made by
  a script, and one made and never inserted, reported at the document. No
  other control did. WebKit 26.6, Playwright 1.63.0's, reported nothing;
  WebKit 27.2 did on Windows 11 and in Playwright's Linux image alike;
  Chromium 156.0.8078.4 and Firefox 157.0 never. The style is WebKit's
  own: not in what WebKit at Playwright 1.64.1's base, `56453fd`, has in
  `HTMLSelectElement.cpp`, its select's shadow elements or `html.css`,
  where it was looked for, nor in Playwright's patches.
- **What the refusal costs the page.** A select drawn in WebKit 27.2 with
  its own declaration refused and with it admitted gave the same pixels;
  with `text-overflow: ellipsis` on the select, other pixels: the
  declaration passes a select's text-overflow to the text inside it. No
  stylesheet of the demo states a text-overflow.
- **Allowing it.** A hash admits a style attribute only beside
  `'unsafe-hashes'`, and the bytes are WebKit's, which no build of the
  page writes and none can derive. Chromium, Firefox and WebKit 26.6 need
  no allowance.
- [formancy.ai-data 0058](https://github.com/sharkysan/formancy.ai-data/blob/main/docs/decisions/0058-the-browser-gates-run-in-chromium-firefox-and-webkit-and-each-fact-the-browsers-disagree-on-is-named-and-held.md)
  runs every gate in the three, a leg each,
  names what the browsers disagree on in a table, `FACTS`, each row held
  by a check of one name in every browser, refuses WebKit off Linux, and
  has the report compare the browsers' checks by pass and name. Its gates
  ran Chromium alone on a machine with the variable unset, for the
  PostgreSQL its host gate starts per browser.
- **What else the three disagree on, here.** Run in all three before
  anything was named: in WebKit, a face the page had loaded as it started
  (its `load()` fulfilled "loaded", in 32 to 172 ms) was "unloaded" again
  once the page had drawn, 19 to 23 of 28, unless the page drew with it,
  and loaded again in 0 ms asking for nothing; and with every font file
  refused, WebKit's `load()` asked for each face's woff2 and for five
  faces' woff, and then asked for the woff of each face whose range the
  journey typed into, after the page had settled -- where Chromium and
  Firefox asked for all 28 woff as it started and nothing after. With the
  files served, typing asked for nothing in any. And WebKit's Windows
  port took the first Tab past the skip link to the language bar's
  select, where its Linux port, Chromium and Firefox reached the skip
  link: on that port a link is no stop of Tab.

## Decision

- **Every check of the demo's gate in Chromium, Firefox and WebKit**,
  headless, in the builds Playwright pins, against the one build served
  once, one browser after another, each with a record of its own, and
  none skipped, loosened or given a threshold of its own for a browser.
  The gate's one parameter is the browser, launched by its name.
- **The policy and the console, in every browser.** The gate fails on any
  report of the page's policy and any error its console logs, the whole
  journey long, in every pass, read before the gate plants what the
  policy must refuse. What is not the page's is named, never skipped:
  what a row of the table says the browser does of its own, as often as
  the row says it does it, and in the pass that refuses the web fonts the
  errors that name a file the gate refused.
- **What the browsers disagree on is a table**, `FACTS` in
  `scripts/browsers.mjs`, each row a value for each browser, where it was
  read, how and when it was measured, and the checks of one name that
  hold it in every browser:
  - `refusesItsOwnSelectStyle`: under a policy whose `style-src` admits
    no inline style, every select has a style of the browser's own
    refused, `text-overflow:inherit`, reported as the page's and logged --
    WebKit, and neither of the others. Held in every pass on a page of
    one select served in the demo's directory under the demo's headers,
    its policy asking for samples: the one report and the one line in
    WebKit, nothing in the others, the reports read once a task queued
    after the page's load has run, by which every refusal of the page's
    elements had been reported in every run measured, and the line waited
    for, within a second. On the demo's page a report is WebKit's only
    with the row's directive, `inline`, at a select with no style
    attribute of the page's, one report of each select, each line matched
    to one report: a second at one select is a style the page set and
    took off, and the page's; and in every browser the gate checks that no
    select of the page has a text-overflow but `clip`, so the refused
    declaration changes nothing it draws.
  - `forgetsLoadedFaces`: a face the page loaded as it started is
    "unloaded" again once it has drawn, and loads again from what the
    browser holds -- WebKit. The fonts check holds it: every face loaded
    in the others; in WebKit every face loaded or "unloaded", one at
    least, and each loads again, the privacy checks after it holding that
    nothing was asked for.
  - `asksForTheNextFileLater`: when a face's woff2 does not arrive, its
    woff is asked for only once text in its range is drawn -- WebKit.
    Held in the pass that refuses the web fonts: in WebKit at least one
    font file asked for after the page settled, each one the gate
    refused, so none left the browser; in the others none.
- **The policy is loosened for none of it.** No hash, no
  `'unsafe-hashes'`, no `'unsafe-inline'`: the page writes no inline
  style, and the one WebKit refuses changes nothing it draws.
- **`FORMANCY_BROWSERS`** narrows a run: unset, the gate runs every
  browser that runs on the machine's platform, a comma list runs those,
  and CI names each leg's. WebKit runs on Linux alone, as Data's: its
  Windows port tabs otherwise, and CI's is Linux's. What keeps the
  variable from being a skip is the report, which expects every browser.
- **The report holds each browser** (0011): a leg's collect reads its
  browser's file alone, under `browser-<browser>`; each launch is held to
  its pin; every browser's gate must leave results; the browsers' gates
  must have asked the same checks, by pass and name; each row's checks
  must have been made in every browser; and the Browser section prints
  the table.
- **CI: one leg of the `browser` job per browser**, on `ubuntu-24.04`,
  `fail-fast` off; only WebKit's leg runs `playwright install-deps
  webkit`; each leg caches its own download and keeps the gate's file
  under its own name.

## Consequences

**What this buys.** The layout down to 320 pixels, the keyboard, axe's
contrast and target size, the journey and the page's promise about what is
typed, held in three engines, not one. A console error any visitor's
browser logs on the page is a red leg, and the one WebKit logs of its own
is said, held and dated. Each difference is a red leg the day a browser
release changes it, by the name of its check.

**What it costs.**

- **WebKit's console keeps two errors on the live page**, one for each
  select, from WebKit 27.2 on. Whether Safari's WebKit does the same was
  not measured; WebKit 26.6 did not.
- **In WebKit, a face whose woff2 does not arrive tells what was typed.**
  The page asks for every face as it starts, so that what a visitor types
  asks the server for nothing (0012); in WebKit, where a face's woff2
  file fails -- the network, an extension -- text later typed in that
  face's range asks for its woff, and which file is asked for says what
  kind of text was typed. With the files served it asks for nothing in
  any browser the gate runs. Not fixed here: the faces are
  `@fontsource`'s, woff2 then woff, as its stylesheets declare them, and
  a page that declared its own woff2-only faces, or asked again for each
  face whose load failed, would be a change of its own (§11).
- **CI.** Three legs where there was one, each installing and building;
  WebKit's runs apt-get, in every release too, which restores no cache:
  formancy.ai's nineteen-minute hang is back in reach, bounded by the
  step's five minutes, the remedy a rerun. Three legs a green run needs
  are three times the exposure to a flaky check.
- **Locally.** A run of the three takes each browser's time in turn: on
  the machine above, under Docker, 39 to 60 seconds each, after the
  build. On Windows and macOS WebKit is refused, and a machine runs
  Chromium and Firefox; WebKit is CI's leg, or Playwright's Linux image,
  as this record's runs were made.
- **Upgrades.** A Playwright release that moves a browser can turn a leg
  red with no change to the page, and the table's row is read again.
- **What is not covered.** WebKit here is its Linux port, not Safari;
  nothing runs on a phone or with a screen reader; no gate runs the
  packed packages in a browser, as before.

**What it forecloses.** A check made in one browser only without a named
fact, and an allowance in the policy for what a browser does of its own.

## Alternatives considered

- **Excusing every report of the row's shape**, as this record first did.
  A style the page set on a select and took off before WebKit reported
  it is a report of that shape at that select, and passed in WebKit; one
  report of each select is what WebKit makes of its own.
- **A fixed wait for the probe page's report and line**, as this record
  first had, 100 ms. WebKit's report reached the gate 4 to 24 ms after
  the gate saw the probe page's load on Windows 11, and 3 to 5 ms in the
  Linux image, 40 runs each, so a slower machine could fail the row by
  chance; and in Chromium and Firefox "nothing after 100 ms" was a wait
  that ran out, not the browser's answer.

- **Chromium alone, as formancy.ai-report's Studio gate runs.** It is how
  the console errors reached the live page: the claims were measured in
  one engine and made of every visitor's.
- **A WebKit smoke test only**: the page loaded in WebKit and its console
  read. It would have seen these two errors and nothing of the layout,
  the keyboard, contrast or the journey in WebKit or Firefox, and the
  faces it does not draw with would have gone unseen.
- **Allowing WebKit's style by its hash**, in `style-src-attr` beside
  `'unsafe-hashes'`. The bytes are WebKit's, which no build writes, so no
  test could derive the hash from them; it admits, on every element, a
  style attribute of that text, which no other browser needs; and it
  changes nothing drawn. A named difference costs the policy nothing.
- **No `<select>` on the page.** The language bar's could be radio
  buttons; the form's specialty is formancy's renderer's to draw. The
  form would change for a browser's sake, and another browser's own
  refusal of another element would not.
- **Skipping the checks a browser disagrees on**, or a per-browser
  expectation in each. The first hides the difference; the second repeats
  one fact in every state. One check per fact holds it.
- **Chromium alone on a machine when the variable is unset**, as Data's.
  Its reason is a PostgreSQL per browser; the demo's gate starts none, and
  a machine that ran Chromium alone would have left this record's errors
  to CI.
- **WebKit on Windows and macOS too.** Its Windows port took Tab past the
  skip link where its Linux port did not: a run there would hold another
  browser to the table than CI's.
- **Playwright Test's projects**, or **one job running all three in
  turn**: formancy.ai-data 0058's reasons -- the runner's retries would turn a
  failing check into "flaky", and one job's wall time is the sum, its red
  naming no browser.

## Older records

- [0012](0012-a-demo-at-formancy-ai-health-fills-a-synthetic-referral-in-the-browser-served-by-a-worker-of-its-own.md)
  still decides the page and its policy; its gate's "Chromium alone"
  cost no longer holds, its gate runs in the three, and its limitation in
  `docs/release/limitations.json` says so. Read again and stamped
  (`node scripts/release-report/limitations.mjs --stamp 0012`), its
  Status line naming this record.
