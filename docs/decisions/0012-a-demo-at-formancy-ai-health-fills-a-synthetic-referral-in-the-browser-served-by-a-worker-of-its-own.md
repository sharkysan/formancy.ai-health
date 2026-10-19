# 0012 — Show the packages at work in a demo at formancy.ai/health/: a synthetic referral filled in the browser, the resources it starts from the validator gate's corpus byte for byte, nothing typed sent or kept, served by a Worker of its own that Cloudflare deploys from main, in the stylesheets a formancy release ships

- **Status:** accepted; its Questionnaire read out from the bytes it shows, each item leading to its field, and the page's weight measured again with it, by [0013](0013-the-demo-reads-its-questionnaire-out-from-the-bytes-it-shows-and-renders-no-questionnaire.md); its browser gate run in Chromium, Firefox and WebKit, a leg each, every console error failing it, and what the browsers disagree on named and held -- WebKit 27.2's own refusal of a style on every select, under a policy loosened for none of it, among them -- by [0014](0014-the-demos-browser-gate-runs-in-chromium-firefox-and-webkit-and-each-fact-the-browsers-disagree-on-is-named-and-held.md); in formancy.ai's room, `@formancy/themes`' `room.css` imported after the workbench from formancy 0.6.0, its form on Blueprint's paper, its renderer, engine and spec 0.6.0's, and its faces and weight measured again, by [0015](0015-the-demo-wears-formancy-ais-room-imported-from-formancy-0-6-0-and-the-packages-read-forms-through-the-same-release.md)
- **Date:** 2026-10-18
- **Deciders:** Daniel Bacher
- **Verified by:** the demo's suite and its browser gate, the validator
  gate, and guards in `pnpm test:repo`, which CI runs on every pull
  request. Each case was watched failing first on 17 or 18 October 2026,
  its fault planted once and every file put back byte for byte, its
  SHA-256 compared before and after:
  - **`apps/demo`'s suite**, in the `test` job, in jsdom:
    - `src/exports.test.ts`, and the build itself -- the page's first
      resources are the validator corpus's accepted entries of their
      names, byte for byte, and `vite build` stops when one is not; a
      changed answer remakes the response and the CH ORF document; a
      required answer cleared refuses the response for it, and no
      document is made. Failed with the response's CH ORF profile
      dropped, in the test and in the build ("the demo's first resources
      are not the validator corpus's…").
    - `src/build/plugin.test.ts` -- the build hands the page the corpus's
      demo referral, the letter as the bytes the register holds, and the
      facts it states, read from the registers, `scripts/notices.mjs` and
      `scripts/purpose.mjs`; every file outside the app the build reads is
      an input `apps/demo/turbo.json` names, and every one the suite's own
      test files import an input of the suite's; the footer links the
      notices file by the name the build writes it under. Failed with SDC
      read without its register entry, with an input dropped from
      `turbo.json`, and, after review, on the `scripts/browsers.mjs` the
      gate's checks import, which `turbo.json` did not name, and on the
      link under another name.
    - `src/on-purpose.test.ts` -- each fixed input is refused by its
      package for exactly its one rule, at its path, and no refusal says
      an identifier's digits. Failed with the GLN's check digit put right.
    - `src/styles.test.ts` -- the page's stylesheets state no colour and
      declare no custom property, read only variables the themes they wear
      declare, and no element carries a `style` prop; `src/main.tsx`
      imports `@formancy/themes`' `workbench.css`, then `blueprint.css`,
      then the faces and the layout. Failed on a hex colour, a named
      colour, a variable of the page's own, one no theme declares, a
      `style` prop, the two themes swapped, a face no theme names, and,
      after review, a relative colour and a `color-mix()` made from the
      themes' variables, which hold no literal.
    - `src/words.test.ts` -- in every language, the lead names the HL7®
      FHIR® standard; "open source", however it is spelt, comes only after
      a negation; nothing is said of cookies, tracking, analytics or
      measurement, in the words or in `index.html`; the banner holds its
      three statements; and the line a change brings names the response
      and the CH ORF document and no other resource. Failed on the French
      lead without ®, a cookie sentence, "Open Source" with no negation
      before it, and, after review, on "Open-Source-Software" in German,
      "opensource" in English, a German and a French sentence about
      tracking, a clause dropped from the German banner and the old line
      that said every resource shown had changed.
    - `src/journey.test.tsx`, with axe, and `src/engine.test.ts`,
      `src/pretty.test.ts`, `src/faces.test.ts` and `src/failure.test.tsx`
      -- the journey's keyboard, words, notices and downloads, the banner
      once before the form and the link to the third-party notices in
      every language, the Questionnaire and the letter still the corpus's
      after a change, formancy's words in Italian, the engine's fixed
      capabilities, the JSON laid out for reading saying what its bytes
      say, every face asked for at once, and a throw said in place of what
      it stopped. Each failed its planted fault, the banner and the link
      dropped from the page among them.
  - **The browser gate, `apps/demo/scripts/browser-test.mjs`**, in CI's
    `browser` job, read by the release report
    ([0011](0011-a-release-report-is-derived-from-the-run-that-gated-it.md),
    extended here). The page is built first, as `vite build` builds it,
    and served under `/health/` with the headers `scripts/demo-headers.mjs`
    decides for the gate's address, in headless Chromium at the build the
    installed Playwright pins, at every width its stylesheets' breakpoints
    give from 320 pixels to a wide screen, each in one of its four
    languages: React's production build, by its renderer's own report; no
    sideways scroll and nothing past an edge; axe's rules, contrast and
    target size decided in every state the journey reaches; the banner
    once; the skip link and the keyboard's way through the form; the
    resources the browser makes of the sample the corpus's bytes, a change,
    a language switched, a refusal and the way back, every download the
    bytes shown; the notices the foot links to the file the build wrote;
    and, once the page has settled, nothing more asked for whatever is
    typed in whatever script, no cookie set, nothing stored and nothing
    typed in the address, every header on every file, nothing its policy
    refused, and the policy refusing a string handed to `innerHTML`, a
    fetch, and an inline script and a script under `/cdn-cgi/` injected
    into the page as it is served. It made 560 checks in 8 passes on
    18 October 2026, on Windows 11 under Node 24.21.0, in Chromium
    156.0.8078.4 with Playwright 1.64.1 and axe-core 4.14.0. Each of 33
    faults planted in the page, its headers or the gate failed its check,
    and each of 22 more -- in the release report's reading of it, the
    workflows, the gate's plan and its results file, and the faces --
    failed its case. After review, 8 more failed their checks: the gate's
    old order, which built React's development build; `'self'` in
    `script-src` again; Trusted Types dropped; a `dangerouslySetInnerHTML`
    in the page, which then rendered nothing; a markup sink used and the
    error swallowed; the answers written into the address; the banner
    dropped; and the notices linked under another name.
  - **`scripts/demo.test.mjs`**, in `pnpm test:repo` --
    `apps/demo/wrangler.json` routes `formancy.ai/health/*` and
    `formancy.ai/health` on formancy.ai's zone, with no workers.dev and no
    preview address, and answers a missing file with nothing;
    `scripts/demo.mjs` stages the build under `/health/` with `_headers`
    at its root, one rule, which the test reads back as Cloudflare reads
    it, and refuses a build that holds a `_headers` or `_redirects` of its
    own; the policy allows no connection, no form action, no inline script
    or style and no eval, scripts, styles and faces from the build's
    assets at the page's address alone, images from `data:` alone, and
    Trusted Types required with no policy, beside `no-transform` and
    `noindex`; the policies for formancy.ai, `vite preview` and the gate
    differ in their address alone, and a policy for an address that is no
    directory is refused; and the README's *Try it*, the Worker's settings
    in `.github/REPO-METADATA.md`, `RELEASING.md`'s Wrangler and the Node
    Cloudflare reads are the deploy's. Each of 28 faults planted failed
    its case, as did, after review, `'self'` in `script-src` or `img-src`,
    the page's directory in place of its assets, Trusted Types dropped or
    a policy of them allowed, and a header of its own for `localhost`;
    and `node scripts/demo.mjs --dry-run` refused a Worker on workers.dev,
    a build moved aside and a page asking for a file by an absolute path.
  - **`scripts/third-party-notices.test.mjs`**, in `pnpm test:repo` -- in
    real Vite builds over projects made for each case: every licence and
    notice file a bundled package ships, each package once, a vendored
    licence from its directory, a face a stylesheet @imports listed by
    its file; a package with no licence text, a licence the repository's
    policy refuses or none refused, naming it, Formancy Report's packages
    among them; the repository's own modules, the demo's plugin's
    included, left out; a module from nowhere, a worker and a file of no
    source refused; and the demo's config running the plugin. formancy.ai-
    report's cases, which were watched failing there, and this
    repository's own, watched failing with the policy dropped from the
    plugin and with the plugin dropped from the config.
  - **The validator gate**, in the `validator` job: the demo's
    Questionnaire, its response and its CH ORF document are entries it
    accepts, and it refuses to run on a letter that is not the bytes
    `docs/release/letter.json` registers, which
    `scripts/validator/letter.test.mjs` holds in `pnpm test:repo` by
    rendering the letter on its own machine. Failed with the register's
    hash a digit off, and with the check skipped where the gate takes the
    letter. `scripts/corpus-documents.test.mjs` fails when
    `@formancy/health-corpus/documents`, as built, reaches anything but
    health-core and health-document; it failed with the entry re-exporting
    the renderer. That entry is what the page imports, but what keeps
    Report's code out of the page is the build: a page that imported the
    corpus's index instead was the same bytes, tree-shaken, as a review
    found, and a Report package that reached the bundle would stop it,
    since the notices plugin refuses its licence.
  - **`scripts/trademark.test.mjs`** -- no HL7 mark in the Worker's name,
    its routes or the title `apps/demo/index.html` is served with. Failed
    with the Worker named `formancy-fhir-demo`, a route under `/fhir/`, the
    title "Formancy FHIR – Demo", a second title and no routes read.
  - **`scripts/compatibility.test.mjs`** -- the README's table of what the
    packages are built and judged against is read from `packages/` alone.
    Failed with `apps/` read again.

  **Not mechanically enforced, and said:** what formancy.ai/health/
  serves, and that a deploy happened, which `RELEASING.md` checks by hand
  after one, its build's log among it; the Worker's settings in
  Cloudflare's dashboard, which `.github/REPO-METADATA.md` records and
  nothing reads, among them that the dashboard's Worker bears the
  config's name; what the zone sets or measures at the edge -- a
  cookie, a measurement -- and whether it injects a script, which the
  policy refuses to run but nothing sees it try; what the notices cannot
  see, which Vite folds into a chunk or a stylesheet as text, as
  [formancy.ai-data 0046](https://github.com/sharkysan/formancy.ai-data/blob/main/docs/decisions/0046-a-built-app-carries-the-licence-and-notice-texts-of-everything-it-bundles.md)
  says and `scripts/third-party-notices.test.mjs` measures, none of it in
  the page on 18 October 2026; that a resource's "byte for byte" label
  is the corpus's, which the page decides against what it made of the
  sample when it opened, which the build held to the corpus in Node and
  the gate in Chromium, and no other browser; that the page's own source
  reads no clock and no random source, which the exactness guard holds
  of the packages alone (a search of `apps/demo/src` found none on
  18 October 2026); that the built page holds no valid AHV number, which
  the identifiers guard holds of the files git would commit, and the
  page's build is not one (it is made from
  `scripts/validator/demo-referral.mjs`, which holds none); every
  statement's wording, and the French and Italian ones, which no native
  reader has read; and whether the position is right in law, which only
  the lawyer's review [0003](0003-the-product-name-carries-no-hl7-mark.md)
  and 0011 owe can say.

## Context

- Health is a library. Its packages have no page, no server and no
  network, and a vendor deciding whether to build on it had the README,
  the [getting-started guide](../getting-started.md) and the validator's
  verdict on a corpus, and nothing to try. The maintainer asked for a demo
  served by Cloudflare, as Formancy Report's Studio is.
- [formancy.ai-report 0018](https://github.com/sharkysan/formancy.ai-report/blob/main/docs/decisions/0018-the-studio-demo-is-served-at-formancy-ai-report.md)
  serves Report's Studio at formancy.ai/report/ from a Worker of its own,
  static assets and no code, deployed by Cloudflare's Workers Builds from
  main; a route under formancy.ai's zone takes precedence over the site's
  own Worker.
  [formancy.ai-report 0023](https://github.com/sharkysan/formancy.ai-report/blob/main/docs/decisions/0023-the-studio-and-the-pages-serve-their-own-faces-and-ask-no-other-site-for-anything.md)
  serves the Studio's faces from its own build and asks no other site for
  anything.
- Every published package compiles against the ECMAScript library alone
  and names no Node or DOM API
  ([§2](../architecture/02-constraints.md#technical-constraints)). No gate
  had run one in a browser.
- formancy 0.5.0's `@formancy/react` fills a form, and its engine's value
  is the answers health-questionnaire's `toQuestionnaireResponse` takes
  ([0007](0007-a-formancy-submission-is-a-questionnaireresponse-of-the-same-mapping-refused-whole-where-an-answer-cannot-be-one.md)).
  Its `createFormEngine` will not start a form that holds a rule without a
  capability source -- a clock, a day and a random source -- whether or
  not any expression asks for one. It ships words in German and French,
  and English otherwise.
- [0002](0002-depend-on-upstream-never-copy-it.md) copies nothing of
  formancy's, its admin stylesheet included, and gives a page its colours
  from a released formancy package at an exact version. `@formancy/themes`
  0.5.0, its latest release on 18 October 2026, exports Pop, Dusk, Paper,
  Blueprint and the workbench, and not formancy.ai's room: an upstream
  pull request adds `room.css`, and no release ships it.
- health-corpus renders the corpus's letter with Report 0.1.0's Node
  renderer, as test support
  ([0008](0008-a-document-is-a-bundle-of-what-it-refers-to-and-a-pdf-its-own-bytes-never-an-unproved-pdf-a.md)).
  Its tests prove the same bytes within one process, and nothing proved
  them across machines, though the PDF goes through each machine's Node
  and its zlib. Report's browser entry renders the same letter in other
  bytes than the Node entry the gate judged (found on 17 October 2026,
  before this record), and would bring Report's renderer into a page.
- A browser asks for a face that `unicode-range` splits only when text in
  its range is first drawn. The gate's first run found what that means
  here: Greek typed into the form, or a JSON opened, asked the server for
  a face after the page had loaded, which told it what kind of text was
  there.

## Decision

- **A page beside the packages, not the product.** `apps/demo`,
  `@formancy/health-demo`, private and never packed, at
  https://formancy.ai/health/: a synthetic Swiss referral filled with
  formancy's React renderer 0.5.0; the SDC Questionnaire, the
  QuestionnaireResponse and the CH ORF document the packages make of its
  answers; the letter's two document Bundles, its PDF in the attachment
  and in a Binary; and five fixed inputs, each refused by its package for
  one thing -- a spec version nothing here reads, a rule the mapping
  cannot say, an AHV number's and a GLN's check digit, and an unproved
  PDF/A declaration -- every refusal as the package states it, in English.
  Nothing computes, scores or suggests.
- **The sample is the corpus's.** The form, its answers and the referral
  are `scripts/validator/demo-referral.mjs`, which the validator gate
  judges. The build makes the page's first resources as the page does,
  holds each to the corpus entry of its name, byte for byte, and stops
  when one differs, Cloudflare's build included. The page names each
  resource's corpus file, and says that what a visitor changes is
  validated by nothing.
- **Fixed, so the same bytes.** The engine starts with a capability source
  of constants -- the corpus's instant, its day and nought -- which the
  form never asks for. Every identifier and instant is the corpus's, and
  no field asks for an identifier. The page reads no clock, no random
  source and no storage, and puts nothing typed in its address, which
  the gate checks; the skip link's fragment is the one change it makes
  there.
- **The letter is made at build.** The build's plugin renders it in Node
  through health-corpus and takes it through `registeredLetter`
  (`scripts/validator/letter.mjs`), which refuses other bytes than
  `docs/release/letter.json` registers: 18,938 bytes, the PDF CI's
  validator job judged and a desktop rendered the same day. The gate takes
  its letter through the same function. The page receives the bytes as a
  module of the build, and health-document assembles the letter's Bundles
  in the page through health-corpus's new `./documents` entry. No code of
  Report's is in the page; health-corpus stays a devDependency, and
  Report's admission is 0008's.
- **Nothing typed leaves the page.** One function,
  `headersFor` in `scripts/demo-headers.mjs`, decides the headers the
  deploy writes for https://formancy.ai/health/, and `pnpm demo` and the
  gate serve for their own addresses: a policy of `default-src 'none'`
  with scripts, styles and faces from the build's assets directory at
  that address alone -- not `'self'`, which admits what Cloudflare serves
  under `/cdn-cgi/` of the same origin -- images from `data:` alone,
  nothing inline, `connect-src 'none'` and `form-action 'none'`, and
  Trusted Types required with no policy allowed, so no string becomes
  markup or code; `no-referrer`, `nosniff`, `noindex`; a
  Permissions-Policy that grants no camera, microphone or location; and
  `no-transform`. The page asks for every face its stylesheets declare as
  it starts (`apps/demo/src/faces.ts`), so that nothing typed or shown
  later asks the server for one.
- **The notices travel with it.** The build writes
  `THIRD-PARTY-NOTICES.txt` beside the page, and the page's foot links
  it: every package the bundle holds, by name and version, with every
  licence and notice file it ships, by
  `scripts/third-party-notices.mjs`, formancy.ai-data 0046's plugin as
  Report's Studio brought it. Every package listed is held to the
  licence policy `scripts/dependency-licences.mjs` holds the published
  packages to, so a package with no licence text, under a licence that
  policy refuses or none stops the build, Formancy Report's own among
  them. The letter's PDF embeds a subset of Roboto, as every PDF Report
  0.1.0 renders does; that is a document made with the face, which its
  OFL-1.1 leaves outside its terms, and no notice is owed for it.
- **What it says of itself, and no more.** That its data is synthetic and
  a real patient's does not belong in it; that it sends what is typed
  nowhere and keeps none of it, which the policy and the gate hold; that
  it is for evaluating the software and not for patient care, beside
  CLAUDE.md's sentence of what the product is not, in English, as
  `scripts/purpose.mjs` reads it at build; conformance said per resource,
  as an entry of the corpus CI's validator gate judges, against the guides
  and releases the registers name; and HL7's and LOINC's notices word for
  word from `scripts/notices.mjs`, marked English. **Nothing about
  cookies, tracking or analytics**, by the maintainer's decision: what
  formancy.ai's zone sets or measures is
  Cloudflare's settings, which nothing here reads, and the page says only
  what it does with what is typed. It links the repository, the licence
  and the register of accepted warnings, and nothing else.
- **Four languages**, de-CH, fr, it and en, the page's and the form's, the
  first the browser prefers, English otherwise. The page gives formancy's
  renderer the submit control's word in every language, and in Italian,
  which 0.5.0 ships none of, the required hint too.
- **Served as Report's Studio is** (formancy.ai-report 0018): a Worker
  named in `apps/demo/wrangler.json`, static assets and no code, routed at
  `formancy.ai/health/*` and `formancy.ai/health`, with no workers.dev and
  no preview address, a missing file answered with nothing, and a build
  with a relative base. Workers Builds builds `main` with `pnpm build` and
  deploys with `node scripts/demo.mjs`, which refuses a checkout with
  changes, a config that is not this one, a missing build, a page that
  asks for a file by an absolute path and a build with a `_headers` of its
  own; writes `_headers` as one rule at the root of what it uploads; and
  runs Wrangler 4.146.0, the version Report's deploy runs, with its
  telemetry off. `node scripts/demo.mjs --dry-run` does all of it but the
  upload.
- **In the stylesheets a formancy release ships.** `@formancy/themes`
  0.5.0's `workbench.css`, then its `blueprint.css`, imported; the page's
  own stylesheet states no colour, declares no variable and reads only the
  themes'. formancy.ai's room arrives with the first formancy release
  whose exports name `./room.css`, as one import and an exact version
  moved, and nothing is copied meanwhile. The faces are IBM Plex Sans and
  Mono from Fontsource 5.3.0, built into the page, as formancy.ai-report
  0023 builds the Studio's.
- **A browser gate of its own**, in a `browser` job whose results the
  release report reads, prints and fails a run on, measuring the page as
  `vite build` builds it, React's production build, before anything
  else resolves a Vite config. No release gate rests on it: the page
  bundles the packages as the workspace builds them, never their
  tarballs.
- **The README's table is the packages'.** `scripts/compatibility.mjs`
  reads `packages/` alone, so the demo's formancy releases are not said to
  be what the packages are built against.

## Consequences

**What it buys.**
- A vendor tries the export in their own browser, with nothing installed
  and nothing sent.
- The packages run in a browser under a gate for the first time, as the
  demo bundles them.
- The page's claim that what it shows before anything is changed is the
  corpus is held by every build, the one Cloudflare runs included, and not
  by its wording.
- The letter's bytes are registered. The gate, which judged whatever its
  runner rendered, now refuses another render too.
- No colour is copied, so nothing can drift from upstream's: the gap
  formancy.ai-data's and Report's palette guards name does not exist
  here.
- Every package the page bundles is held to the policy the published
  packages are, and its licence and notices are served beside it.

**What it costs.**
- **Main's demo, not a release's.** Cloudflare deploys every push to
  `main`, before CI has run on it, and the ruleset requires no check
  ([`.github/REPO-METADATA.md`](../../.github/REPO-METADATA.md#settings)),
  so a pull request merged with a gate red is served. Nothing checks what
  the address serves; [`RELEASING.md`](../../RELEASING.md#the-demo-on-formancyai)
  says what to check by hand. The page's sentence on conformance says
  what the validator gate does, and that the sample is in its corpus;
  it does not say that the gate passed on the commit it was built from.
  Whether `main` should require the gates' checks and a pull request,
  which would make a red gate unmergeable, is the rightsholder's open
  question ([§11](../architecture/11-risks-and-debt.md#114-open-and-planned)).
- **Settings outside the repository.** The Worker's build settings are in
  Cloudflare's dashboard; REPO-METADATA records them, and
  `scripts/demo.test.mjs` holds the record to the deploy, not to the
  dashboard. A failed deploy is seen in Cloudflare's log alone, and the
  last deployment keeps serving. The name the dashboard gave the Worker
  was not confirmed on 18 October 2026, and must be the config's.
- **Another machine renders the letter.** Cloudflare's build runs the
  Node `.node-version` names, a major, which its documentation, read on
  18 October 2026, gives as its preinstalled 22.23.2; the letter's bytes
  were measured under 22.23.3 and 24.21.0, and no gate runs on
  Cloudflare's machine, so its build is the first render there. A Node
  that renders other bytes stops that build, by design, and the address
  serves nothing new until the register or the Node moves; RELEASING.md's
  check of a deploy reads the build's log for that refusal.
- **Not formancy.ai's room yet.** The page wears the workbench and
  Blueprint as formancy 0.5.0 ships them, where Report's Studio beside it
  wears the room's colours, copied there; it changes colour only with a
  release it adopts.
- **Every face at the start**: 28 WOFF2 files, 356,256 bytes in the build
  of 18 October 2026, most of them for scripts a visitor never types, so that
  none is asked for later.
- **The page's weight**: one chunk of 739.08 kB minified and 217.90 kB
  gzipped, as `vite build` (Vite 8.3.4) reported it on 18 October 2026, of
  which, read from its source map that day, react-dom is 207.0 kB,
  `@formancy/spec` 192.2 kB, the CEL interpreter 82.1 kB, formancy's
  renderer, engine and expressions 102.2 kB, the four packages and
  health-corpus's documents 61.6 kB, and the page's own 70.8 kB, the
  letter's PDF as base64 among it; and a notices file of 77.46 kB beside
  it. `apps/demo/vite.config.ts` states the same figures.
- **`pnpm demo` at one address.** Its policy names
  http://localhost:4395/, the address `vite preview` serves it at, and
  the page opened under another name of the same machine -- 127.0.0.1 --
  runs no script.
- **What a visitor types is validated by nothing**, and the letter does
  not change with the answers. The page says both.
- **A visitor can still paste real data.** The page asks them not to,
  keeps nothing and sends nothing, and cannot stop the browser's own
  services -- a spelling service, a translation, autofill -- or an
  extension from reading what is typed.
- **Nothing said of cookies or tracking, and nothing checked of the
  zone.** The gate sees the page as `vite preview` serves it. What
  Cloudflare's zone sets or measures at the edge -- a security cookie,
  analytics -- no gate sees. A script it injected, inline or under
  `/cdn-cgi/`, the policy refuses to run, which the gate watches on one
  it injects itself; `no-transform` asks Cloudflare to inject none.
- **No legal notice and no privacy statement.** The page goes live on
  formancy.ai for visitors in Switzerland, Germany, France and Italy,
  and Cloudflare, which serves it, sees each visitor's address. Whether
  the address owes a legal notice or a privacy statement, and whose, is
  the lawyer's question, not decided here, and the page links neither;
  formancy.ai had neither page on 18 October 2026
  ([§11](../architecture/11-risks-and-debt.md#114-open-and-planned)).
- **The notices miss what Vite folds as text**: a package stylesheet a
  stylesheet @imports, a file under the inline limit, a constant copied
  into its user, as formancy.ai-data 0046 measured. The page held none
  on 18 October 2026: the themes are imported from its script, and the
  faces are listed by the files the build writes from them.
- **Chromium alone**, where formancy.ai-data's gate runs Firefox and
  WebKit too, and no screen reader.
- **English refusals, and translated words.** The packages refuse in
  English. The French and Italian words were translated, and no native
  reader has read them; the whole page joins the lawyer's review 0003 and
  0011 owe before the first paid release.
- **No page to find.** The demo says `noindex`, and Health has no product
  page: a search finds the repository.
- **Dependencies of its own**: React, Vite, formancy's core, React
  renderer and themes at 0.5.0, and Fontsource's faces, in a private
  manifest the dependency-licence guard does not walk, since it walks the
  published packages; what of them the page bundles the notices plugin
  holds to the same policy, and what it does not bundle, Vite and the
  test tools, nothing does. React and Vite are ranges, so a build may
  bundle a release nobody here has read, and the plugin judges what it
  bundles. `@fontsource-variable/archivo`, the room's display face, is
  declared and imported by nothing until the room arrives.

**What it forecloses.**
- A server, a fetch, an upload, analytics or error reporting on the page:
  the policy refuses each, and the gate fails on it.
- A typed identifier, and a valid AHV number computed on the page.
- A colour of the page's own, and a copy of formancy's.
- Report's code in the page, and any package under a licence the
  repository's policy refuses.

## Alternatives considered

- **GitHub Pages.** Rejected: an address on another site, which sets no
  headers of the page's own, so neither the policy nor `no-transform`
  could be held, and the demo would not stand beside formancy.ai's and
  Report's.
- **A subdomain, `health.formancy.ai`.** Rejected, as formancy.ai-report
  0018 rejected `report.formancy.ai`: a DNS record and a certificate more,
  for a page that is one path of the site its vendors already visit.
- **A page in Report's site.** Rejected: Report's Worker, gates and
  releases would carry Health's packages, notices and claims, and Report
  would depend on Health's workspace.
- **Copying it into formancy.ai's build.** Rejected, as 0018 rejected it
  for the Studio: source-available code in an Apache-2.0 site's build
  would blur the line
  [0001](0001-a-paid-module-in-its-own-repository.md) keeps, and Health's
  gates would not run on it.
- **A deploy from CI, with a Cloudflare token in GitHub**, which would
  deploy only what passed CI on `main`. Rejected, as 0018 rejected it: a
  zone token in GitHub, to win a deploy that waits for CI.
- **The corpus's intake form as the sample.** Rejected: it exists to cover
  every construct the mapping takes, shows a field when a weight passes a
  threshold, and has no English.
- **Rendering the letter in the page.** Rejected: Report's browser entry
  renders other bytes than the gate judged, and would bring Report's
  renderer and its fonts into the page.
- **Waiting for formancy.ai's room**, as this record's design proposed, so
  that the page wore the admin's colours from its first day. Not taken: no
  release ships the room, and a page that waits for one ships nothing; the
  demo wears what formancy has released, and the room is one import and a
  version when a release ships it. Copying admin.css's variables meanwhile
  is 0002's rejected alternative.
- **A banner saying the page sets no cookie and runs no analytics.**
  Rejected by the maintainer: the policy and the gate
  hold what the page does with what is typed, neither sees what
  Cloudflare's zone sets or measures, and the sentence would be a claim
  nothing checks.
- **`'self'` for scripts, styles, faces and images**, one constant for
  every address, as this record first decided. Rejected after review: it
  admits whatever the origin serves, and a review measured on 18 October
  2026 that a script placed under `/cdn-cgi/`, where Cloudflare serves
  the scripts of the features it injects, sent what was typed to the
  origin through an image and a face. The policy names the address
  instead, so the three places it is served from write three policies,
  which differ in that address alone.
- **Vite's own `build.license`** for the notices. Rejected, as
  formancy.ai-data 0046 rejected it: it reads one licence file per
  package and never a NOTICE, which Apache-2.0 asks to travel with the
  work, and judges no licence.
- **Faces asked for as text needs them**, the browser's way. Rejected:
  what is typed would choose what the server is asked for.
- **Angular's renderer, or both.** Rejected: Angular Material as peers,
  and no builder whose parity two frameworks must hold.
- **A Worker with code that sets the headers.** Rejected: code to deploy
  and to gate, where a `_headers` file does it with none.
- **The purpose in the page's own words, in four languages.** Rejected: a
  second statement of what CLAUDE.md states once, and one nobody compared
  with it; the page shows CLAUDE.md's sentence as its build reads it.

## Older records

None is superseded. Each below was read again and stamped
(`node scripts/release-report/limitations.mjs --stamp NNNN`), its Status
line naming this record.

- [0002](0002-depend-on-upstream-never-copy-it.md) still gives a page its
  colours from a released formancy package at an exact version, and still
  copies nothing. What changes is its cost "A page waits for formancy": the
  page waits for no stylesheet that has not been released, and wears what
  0.5.0 ships until the room is released. Its rule that nothing published
  takes Report before a record admits it now holds of the page's bundle
  too, by the same policy.
- [0003](0003-the-product-name-carries-no-hl7-mark.md)'s names now include
  a page and an address, which `scripts/trademark.test.mjs` reads -- the
  Worker, its routes and the page's title -- and the browser gate, the
  title and heading in each language.
- [0005](0005-a-fhir-resource-is-proved-by-the-hl7-validator-against-pinned-guide-packages.md)'s
  corpus holds the demo's referral, and its gate refuses a letter that is
  not the bytes the register names.
- [0008](0008-a-document-is-a-bundle-of-what-it-refers-to-and-a-pdf-its-own-bytes-never-an-unproved-pdf-a.md)'s
  health-corpus gains `./documents`, which the page bundles, and its
  letter is registered by its bytes and carried into the page by the
  demo's build. Report remains test support, run at build, and in no
  page.
- [0010](0010-the-architecture-is-documented-in-arc42s-sections-held-to-the-repository-by-a-guard.md)'s
  guard reads paths of the demo's kinds, `.css`, `.html` and `.tsx`,
  written as code, and holds the demo's row in the building blocks.
- [0011](0011-a-release-report-is-derived-from-the-run-that-gated-it.md)'s
  report reads a fifth job, `browser`, and fails a run on its problems,
  with a Browser section and a limitation derived from it; its register's
  areas gain `demo`. Its sentences that Health has no page are of their
  day.
