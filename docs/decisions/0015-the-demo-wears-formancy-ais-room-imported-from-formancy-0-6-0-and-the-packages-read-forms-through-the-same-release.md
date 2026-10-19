# 0015 — Wear formancy.ai's room in the demo, `@formancy/themes`' `room.css` imported after the workbench from formancy 0.6.0, the first release that ships it, with the form on Blueprint's own paper; and read forms through 0.6.0's `@formancy/spec` in the packages too, so the page bundles one

- **Status:** accepted
- **Date:** 2026-10-19
- **Deciders:** Daniel Bacher
- **Verified by:** the demo's suite and its browser gate, every package's
  suite, the validator gate and the install gate, on 18 and 19 October
  2026. Each case was watched failing first, its fault planted once and
  the file put back, its SHA-256 compared before and after:
  - **`apps/demo/src/styles.test.ts`**, in the `test` job -- `src/main.tsx`
    imports `@formancy/themes`' `workbench.css`, then `room.css`, then
    `blueprint.css`, then the faces and the layout; the page's
    stylesheets read only variables those three declare, the room's
    `--ground` among them, and state no colour and declare no variable of
    their own; and the face each of the three's font stacks names first
    is served, under its name or Fontsource's `<Family> Variable`, and no
    other -- so the room's `--display`, which names Archivo first, is
    drawn in Archivo. Failed before `main.tsx` and `fonts.css` changed, on
    the order and on "`--display: Archivo`" unserved, and with the room
    planted before the workbench. Since a review on 19 October 2026, it
    also holds that a variable a theme declares only under a scope --
    Blueprint's `--fm-paper`, under `[data-formancy-theme='blueprint']` --
    is read only in a rule that names the scope, and that the page's
    script, every module of `src/` that is not the suite's, writes no
    style: no `style` prop or props with one, no element's style or
    property set on it, no style attribute or element, no stylesheet made,
    adopted or written into, and no custom property named, which is how a
    script would set the room's own values on `:root` and pass the browser
    gate's check of them. The first failed on `.paper`, which read
    `--fm-paper` without naming Blueprint, so the paper's colour is a rule
    of `.paper[data-formancy-theme='blueprint']`; the second with
    `document.documentElement.style.setProperty('--ground', …)` planted in
    `src/engine.ts`, which the walk of `.tsx` files' `style` props alone
    had passed, and nine of its ten ways of writing a style with that walk.
  - **`apps/demo/src/upstream.test.ts`**, in the same suite -- every
    package the demo's dependencies bring, followed through each one's
    own to its real directory, is one copy of each formancy package: one
    `@formancy/spec`, which formancy's engine, its renderer and
    health-questionnaire each load. Added after the same review, which
    found the page's one copy held by nothing: a release adopted by the
    demo and not the packages passed every gate. Failed with
    health-questionnaire's link to `@formancy/spec` pointed at the store's
    0.5.0, naming both copies and what brought each, and its guard on
    itself, that the walk reaches the spec through the engine, the
    renderer and health-questionnaire, with the walk stopped at the demo's
    own dependencies; the link was put back and read again.
  - **`apps/demo/scripts/gate-page.test.mjs`**, in the same suite -- the
    room is read from `room.css` as installed, each `var()` of its own read
    through, and sets every colour the installed workbench declares; the
    gate's check passes the room however a browser quotes or spaces a
    token list and however a minifier writes a colour, and names a light
    `--wb-bench`, a light colour scheme, another ground and a colour a byte
    of alpha off, on a made-up room whose colours are none of formancy's.
    Each failed its fault: `var()` not read through; the scheme, then the
    ground, not compared; colours compared as written; alpha floored, again
    on the made-up colours; a room without `--wb-caution`.
  - **The browser gate**, `apps/demo/scripts/browser-test.mjs`, in the
    `browser` job's legs -- a check in every pass, in every browser, that
    the page is in formancy.ai's room: every custom property `room.css`
    sets, as installed, holds its value on `:root`, the workbench's
    `--wb-*` among them, `:root` is drawn in the room's colour scheme and
    the page's ground is `--ground`. It failed in all 8 passes in Chromium
    on the page before it wore the room ("25 of the room's 25 not so");
    in its first run on the page in the room, on four colours Vite's
    minifier had written otherwise -- `#111624bd` for `room.css`'s
    `rgb(17 22 36 / 74%)` -- which is why it compares colours by their
    bytes; and with the room imported before the workbench, in all 8
    passes ("11 of the room's 25 not so: --wb-ink is "#17222e", not
    #eef1f8"), when axe's contrast failed too, from the skip link on, 56
    checks in all. axe's contrast, decided in every state the journey
    reaches, holds the page dark as it held it light: with the form's
    paper taken away, Blueprint's ink on the room's glass failed it in
    each of the 5 states of each of the 8 passes, 11 of the form's texts
    at the start. The gate as committed held every check, 617 in its 8
    passes in each browser, on 19 October 2026, on the page as the review
    left it: in Chromium 156.0.8078.4 (36.5 s, as its record times it)
    and Firefox 157.0 (77.8 s) on Windows 11 under Node 24.21.0, and in
    Chromium (32.8 s), Firefox (54.2 s) and WebKit 27.2 (46.7 s) in
    Playwright's Linux image `v1.63.0-noble`, Node 24.20.0, with
    Playwright 1.64.1's builds installed in it, under Docker on that
    machine, the page built there from the same files -- its script and
    stylesheet the bytes the Windows build wrote -- and its letter the
    registered bytes.
  - **The corpus, byte for byte.** The 50 entries the validator gate
    judges, made by the packages as built with `@formancy/spec` 0.6.0 and
    again with every import of it resolved to 0.5.0 in the store, had the
    same SHA-256 each, on 18 October 2026; with the resolution pointed at
    a version the store does not hold, the run stopped, so the second run
    read 0.5.0. The validator gate, 7.0.2 on Java 25 (Zulu 25.0.4.1), on
    19 October 2026, judged the 50 as its corpus expects, 15 accepted and
    35 broken on purpose refused, in 54.5 s, and again after the review,
    in 40.9 s; the files it judged each time were those of the 0.5.0 run,
    byte for byte.
  - **`scripts/compatibility.test.mjs`** and
    **`scripts/getting-started.test.mjs`**, in `pnpm test:repo` -- the
    README's table and the guide's install line name `@formancy/spec`
    0.6.0; both failed until they did. The install gate, the same day,
    type-checked and ran its consumer and the guide's program against the
    packed tarballs, the guide's beside `@formancy/spec` 0.6.0 and
    Report 0.1.0's runtime and renderer.
  - **`scripts/release-report/render.test.mjs`**, in `pnpm test:repo` --
    what a clean install resolved of a package a published package
    depends on is held to the versions the suites ran the published
    packages against, its shipped rows, so Report's 0.5.0 excuses none of
    what a consumer meets; of a package none depends on, Report's
    `@formancy/expressions` among them, to every version a suite loaded;
    each said once, against the versions it is held to. The local report
    of 19 October 2026 had said that a consumer's install resolved
    `@formancy/spec` 0.6.0 "(the suites ran 0.5.0), which no suite ran",
    against the row of Report's copy; the case failed so before
    `render.mjs` changed. The first fix held every version to every row,
    and the review's probe -- a consumer's install handed Report's 0.5.0
    -- was told nothing; the case failed so until the shipped rows alone
    held it, and its case for a package no published package depends on
    failed with the shipped rows holding every package.

  **Not mechanically enforced, and said:** that `room.css` is the room
  formancy.ai's admin wears -- formancy's own test holds that the admin
  imports it and keeps no second copy
  ([formancy.ai 0178](https://github.com/sharkysan/formancy.ai/blob/main/docs/decisions/0178-the-rooms-palette-is-published.md)),
  and nothing here reads `admin.css`; that the page looks like the admin
  and Report's Studio beside it, which a person's eye holds, and no
  picture is taken of it; the second copy of `@formancy/spec` where
  Report is installed, which the install gate's record does not list,
  since it reads the top of a project's `node_modules` -- an npm 11.19.0
  install of what the guide installs beside the packages put 0.5.0 under
  `@formancy/report-spec` and 0.6.0 at the top, on 19 October 2026; and
  that formancy 0.6.0's engine does what the mapping rests on, measured
  below by a script run once on 19 October 2026 and kept nowhere:
  health-questionnaire does not depend on the engine, and no test here
  runs it against the mapping, so a release that changes one of those
  behaviours is found by whoever reads its changelog, as this one was.

## Context

- The maintainer asked why the demo at formancy.ai/health/ looked unlike
  Report's Studio beside it at formancy.ai/report/, and forbade copying
  formancy.ai's admin stylesheet, as Formancy Data and Formancy Report had.
  [0012](0012-a-demo-at-formancy-ai-health-fills-a-synthetic-referral-in-the-browser-served-by-a-worker-of-its-own.md)
  had put the demo in `@formancy/themes` 0.5.0's light workbench and
  Blueprint, since no release shipped the room, and said the room would
  arrive "with the first formancy release whose exports name
  `./room.css`, as one import and an exact version moved".
- **formancy 0.6.0**, released on 18 October 2026, on npm with provenance
  and a signed SBOM, exports `@formancy/themes/room.css`
  ([formancy.ai 0178](https://github.com/sharkysan/formancy.ai/blob/main/docs/decisions/0178-the-rooms-palette-is-published.md)):
  the admin's custom properties at their values -- `--ground`,
  `--glass`, `--text`, `--muted`, `--edge`, `--edge-strong`, `--client`,
  `--server`, `--invalid`, `--ok`, `--warn` and `--display` -- every
  colour of `workbench.css` set to them, and `color-scheme: dark`, and
  nothing else: no rule for an element and no face. It says to import it
  after the workbench, since both declare on `:root`. Its values, read on
  19 October 2026, are those Report's Studio had copied into its own
  stylesheet by hand.
- **The admin draws a form on white paper.** formancy.ai's admin wears
  the room and previews a form in Blueprint on a white sheet, since "an
  admin previews what the people filling the form in will see, not the
  admin" (its `admin.css`). Blueprint sets its own ink and a light colour
  scheme on its subtree, and paints no ground behind the form; it
  declares its paper as `--fm-paper`.
- **One release in the page, or two.** `@formancy/core` and
  `@formancy/react` 0.6.0, which the room comes with, depend on
  `@formancy/spec` 0.6.0 exactly; health-questionnaire depended on 0.5.0
  exactly; the page bundles both. 0.6.0's spec is version 4, as 0.5.0's
  was, and the two read each other's documents: their validators differ
  in their schema's descriptions and the `specVersion` it defaults to,
  which the validator applies to nothing, and 0.6.0 adds
  `acceptRemoteAnswer` and `capRemoteAnswer`, which nothing here calls
  (both read on 18 October 2026).
- **What 0.6.0's engine changed**, in its release notes: only its rule
  writes a computed field, a repeater's `maxItems`, `required` and the
  rules aimed at it are enforced, and a rule hides or disables a group
  with its fields. health-questionnaire's mapping rests on what 0.5.0's
  engine was measured doing (0006, 0007). Measured again on 0.6.0 on
  19 October 2026, each holds: a computed field still fills while a
  visible rule hides it, in a hidden group too; a repeater is still
  topped up to its minimum with empty rows, and a required one counts
  them; a field a visible rule hides is cleared, and one set while
  hidden stays; a page a skip rule walks past keeps what was typed;
  `2.0000001` on a step of one, `42` in a text field, `'abc'` in a number
  field, `'yes'` in a checkbox, `7` in a hidden field, a value under a
  static text and `2026-02-30` in a date field each validate; and CEL's
  comparisons, `w == 0.30000000000000001` for 0.3 and `w == '  '` for two
  spaces among them, are 0.5.0's, with the same `@marcbachmann/cel-js`
  8.0.0. What is new: a value handed in for a computed field is replaced
  by its rule's, a repeater past its `maxItems` no longer validates, and
  a group a visible rule hides loses its fields' values.
- **Formancy Report 0.1.0** depends on `@formancy/spec` 0.5.0 exactly,
  through `@formancy/report-spec`, which imports `schemaHash` from it and
  names none of its types. health-corpus renders the corpus's letter
  with it, and the letter's bytes are registered (0012).

## Decision

- **The room, imported.** `apps/demo/src/main.tsx` imports
  `@formancy/themes`' `workbench.css`, then `room.css`, then
  `blueprint.css`, then the faces and the layout, and the manifest pins
  `@formancy/themes` 0.6.0. The page's stylesheet reads the room's
  names: the dark `--ground` behind everything, `--glass` panels bounded
  by `--edge-strong`, `--text` and `--muted`; `--client`, violet, for
  what a person acts on -- a link, a button, a choice -- and `--server`,
  teal, for what the system did: the focus ring, as the admin draws it,
  and the line that says the packages made the corpus's bytes; `--warn`
  for answers a visitor changed, `--invalid` for a refusal, and
  `--display` for the page's two levels of heading. It still states no
  colour and declares no variable of its own
  ([0002](0002-depend-on-upstream-never-copy-it.md), 0012).
- **The form on its paper.** Blueprint dresses the form, as before, on
  `--fm-paper`, Blueprint's own ground, in a rule of the page's own that
  names Blueprint's scope, `.paper[data-formancy-theme='blueprint']`, since
  Blueprint declares its variables there alone: the form is drawn as the
  person filling it sees it, as the admin previews one, and the
  workbench's `.wb-sheet` is not recoloured.
- **Archivo by its weight axis.** `apps/demo/src/styles/fonts.css`
  imports `@fontsource-variable/archivo/wght.css`, the room's display
  face, and the page asks for its three files with every other face as
  it starts (0012).
- **formancy 0.6.0 throughout, exact.** health-questionnaire depends on
  `@formancy/spec` 0.6.0, health-ch's tests on it, and the demo on
  `@formancy/core`, `@formancy/react`, `@formancy/spec` and
  `@formancy/themes` 0.6.0; `pnpm-workspace.yaml` excuses those and the
  `@formancy/expressions` 0.6.0 core brings, by name, from pnpm's
  minimum release age. The page bundles one `@formancy/spec`, which the
  engine fills the form with and health-questionnaire exports it through,
  and the demo's suite fails when the page's dependencies bring two copies
  of a formancy package. health-corpus keeps Report 0.1.0, and with it
  Report's 0.5.0.
- **The page's script writes no style.** Every colour is a stylesheet's,
  so a copy of the room set from a script, which the gate's check of the
  values would pass, is refused before the gate runs.
- **The gate holds the room**, in every pass, in every browser, as the
  browser computes it: every custom property `room.css` sets, read from
  the package as installed, holds on `:root`, compared as colours where
  they are colours, `:root` is drawn in the room's scheme and the page's
  ground is `--ground`. axe's contrast in every state holds the rest, as
  it did.

## Consequences

**What it buys.**
- The demo is in formancy.ai's room, as the admin and Report's Studio
  beside it, from the palette formancy publishes and not a copy: a
  colour formancy moves reaches the page with the release that moves it,
  and nothing here can drift from it.
- One `@formancy/spec` in the page, so the form the engine fills and the
  form health-questionnaire reads are read by one validator; a release
  adopted by the demo and not the packages fails the demo's suite, where
  the exact pins alone would let it through.
- A page that is not in the room fails the gate in every browser, by the
  property: the import order, which jsdom holds, cannot show what the
  built stylesheet's cascade does.

**What it costs.**
- **The page's weight**, in the build of 19 October 2026 (Vite 8.3.4):
  one chunk of 765.31 kB minified, 226.39 kB gzipped, 8.1 kB more than
  the 757.21 kB of 0.5.0 (0013), read from its source map -- formancy's
  renderer, engine and expressions 108.0 kB, 5.7 kB more, and
  `@formancy/spec` 194.8 kB, 2.3 kB more, one copy of it, 0.6.0's, as
  the map's sources say; the room adds nothing to the script. The
  stylesheet is 91.11 kB, 12.89 kB gzipped, the paper's colour a rule of
  its own, where it was 89.24 kB with 0.6.0 and without the room the same
  day; the notices
  file 82.22 kB, from 77.46 kB, Archivo's licence among them.
  `apps/demo/vite.config.ts` states the same figures, and its warning
  limit moves to 770 kB.
- **Every face at the start**: 31 WOFF2 files, 437,032 bytes, where there
  were 28 and 356,256 -- Archivo's three, 80,776 bytes, for every visitor,
  so that nothing typed later asks for one. Its width axis, which the
  admin and the Studio carry, would have been 130,032 bytes more, for no
  width the page sets.
- **Two copies of `@formancy/spec` wherever Report 0.1.0 is installed.**
  In this workspace health-corpus's Report brings 0.5.0 beside the
  packages' 0.6.0, and so does an application that installs Report 0.1.0
  beside Health 0.1.0 -- the getting-started guide's project among them.
  Report uses its copy only to hash its own definitions, and none of its
  types names one of `@formancy/spec`'s, so nothing one copy makes
  reaches the other; the letter Report renders is the registered bytes,
  as `scripts/validator/letter.test.mjs` and the gate hold. A Report
  release on 0.6.0 leaves one.
- **Two rows of one package in the release report.** Its *Tested on*
  lists `@formancy/spec` twice, 0.6.0 as the packages declare it and 0.5.0
  as Report brings it, and the columns of what a clean install resolved
  are the package's, on both rows: they read the top of each project's
  `node_modules`, where npm puts 0.6.0. Its limitations hold what an
  install resolved there to the 0.6.0 the packages ran against, the
  shipped row, and never to Report's: the top of a project is what the
  published packages load, and a 0.5.0 there would be said.
- **Taken the day it was released.** 0.6.0's minimum release age is
  excused by name, as Report 0.1.0's was the morning after its release.
- **The room is held to `room.css`, not to the admin.** The gate reads
  the package as installed; whether the admin still wears it is
  formancy's to hold.
- **The form is not in the room.** It stands on Blueprint's white paper,
  as a person filling it sees it; a reader who expects a dark form finds
  the admin's choice instead.
- **The room's palette and nothing more of the admin's.** The admin's
  light behind its bench and its sheet's shadow are colours of
  `admin.css`'s own, written there, which this page may not state: the
  page wears the palette without them, and its look beside the Studio's
  is a person's eye, with no picture taken.
- **Measured before the tag.** 0.1.0 was ready to tag on formancy 0.5.0;
  this moves its upstream version, so the runs that made it ready are not
  of the commit a tag would name, and every gate runs again, as the
  README's Status says.

**What it forecloses.** A copy of `admin.css`'s values, in the page or in
a test, and a theme of the page's own for the form.

## Alternatives considered

- **0.6.0 for the demo alone**, the packages staying on 0.5.0 until a
  later release. Rejected: the page would bundle two `@formancy/spec` --
  192.5 kB of 0.5.0's in 0013's measurement, and 0.6.0's beside it --
  and the engine would fill the form through one validator while
  health-questionnaire exported it through the other.
- **Dusk for the form**, formancy's dark theme, so that the form is in
  the room too. Rejected: the admin previews a form in Blueprint on white,
  a person filling the form is not in the admin, and Dusk's face, Space
  Grotesk, would be one more for every visitor.
- **`wdth.css` for Archivo**, as the admin and the Studio import it.
  Rejected: 130,032 bytes more for every visitor, measured from
  Fontsource 5.3.0's files on 18 October 2026, for an axis no rule of the
  page's sets.
- **The workbench's `.wb-sheet`, recoloured with `--fm-paper`.** Rejected:
  a workbench rule overridden for colour, which Report's Studio forbids
  itself
  ([formancy.ai-report's CLAUDE.md](https://github.com/sharkysan/formancy.ai-report/blob/main/CLAUDE.md#the-user-interface-is-formancyais-concept-applied));
  the page's own class carries the paper.
- **The room held in jsdom alone.** Rejected: jsdom applies no cascade
  and computes no custom property, so it can hold the import order and
  not what the page wears.
- **`room.css`'s values compared as written.** Rejected after its first
  run: Vite's minifier writes `rgb(17 22 36 / 74%)` as `#111624bd`, the
  same colour, and the check failed on four of them.

## Older records

Neither is superseded. Each was read again and stamped
(`node scripts/release-report/limitations.mjs --stamp NNNN`), its Status
line naming this record.

- [0002](0002-depend-on-upstream-never-copy-it.md) still gives a page its
  colours from a released formancy package at an exact version and copies
  nothing; the wait 0012 narrowed is over, the room imported from the
  release that ships it.
- [0012](0012-a-demo-at-formancy-ai-health-fills-a-synthetic-referral-in-the-browser-served-by-a-worker-of-its-own.md)
  still decides the page; its "In the stylesheets a formancy release
  ships" is carried out as it said, one import and a version, and its
  cost "Not formancy.ai's room yet" no longer holds -- its line in
  `docs/release/limitations.json` goes, and this record's lines say what
  the room costs. Its renderer is formancy's 0.6.0, its faces and weight
  this record's.
