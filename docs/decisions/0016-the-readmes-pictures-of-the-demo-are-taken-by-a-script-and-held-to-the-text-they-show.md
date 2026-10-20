# 0016 — Picture the demo in the README by a script, in Chromium alone: whole sections of states the page reaches, each caption held to the text those sections hold, by the guards, by a check in CI's browser job and by the release report

- **Status:** accepted
- **Date:** 2026-10-20
- **Deciders:** Daniel Bacher
- **Verified by:** the repository's guards, the pictures' check and the
  release report's tests, on 20 October 2026. Each was watched failing
  first, its fault planted once and the file put back, its SHA-256
  compared before and after:
  - **`scripts/pictures/readme.test.mjs`** (`pnpm test:repo`) -- the
    README's two regions are what `scenes.json` and `captured.json`
    render; every scene has its record and a picture of the record's bytes
    and digest, and the directory holds nothing else; every caption and
    alt quotes only what a part it names says, in one decoded name or
    value; one look; every link and picture lands; one hero, an app script
    for every scene's app and a scene for every app script; and the line
    each region ends with names commands and a CI step that exist. Failed
    with the README's regions not yet written and the check not yet in
    `gates.yml`, and with a caption reworded and a quote changed in
    `scenes.json` without a retake (`record.test.mjs` failing beside it);
    each check of the file also fails on its own fault, made to a small
    repository the test builds.
  - **The pictures' check**, `node scripts/pictures.mjs --check`: walks
    every scene of `scenes.json` in the built demo, compares each part's
    accessibility text with the record, and holds every caption to it.
    Failed with one line of `captured.json` changed, and with the sentence
    the refused scene quotes changed in the built page's script, naming
    the scene, the part, a line diff and the caption's quote; both put
    back, the check green again.
  - **`scripts/browsers.test.mjs`** and **`scripts/workflows.test.mjs`** --
    `PICTURES_BROWSER` is one of `BROWSERS`, and the browser job runs the
    check once, after the gate and before the collect step, in that
    browser's leg alone and when the gate failed too. Both failed before
    `browsers.mjs` named it and `gates.yml` ran it.
  - **`scripts/release-report/collect.test.mjs`** -- the check's file is
    read in the pictures' browser's leg and no other, listed when absent,
    refused from before `--since`. Three cases failed before `collect.mjs`
    read it. **`report.test.mjs`** -- a check that left nothing, ended in
    an error, found a picture no longer showing the page, did not walk a
    scene `scenes.json` gives its app, walked one it does not give, had
    none to walk, launched another browser or another build than
    Playwright pins, or was filed under another job, fails the run. Six
    cases failed before `problems.mjs` read it. What the check found is
    counted as problems, not pictures, since one stale picture gives two:
    failed while the report counted pictures. The apps and the scenes the
    report holds the check to are read from this checkout by `loadInputs`:
    failed with `pictureApps` left out of it, and with `scenesOf` matching
    a scene's app to the app's path as it stands. **`render.test.mjs`** --
    the report's Browser section shows the check, the scenes it walked of
    `scenes.json`'s, those it did not, and the problems it found. Failed
    before `render.mjs` printed it, and while its column counted pictures;
    the browser gate's sentence among the derived limitations
    failed when the pictures' launch was first counted as a gate's, and
    names the gates' launches alone.
  - **`scripts/pictures/record.test.mjs`, `session.test.mjs`,
    `camera.test.mjs`, `faces.test.mjs`, `aria-text.test.mjs`** and
    **`scripts/pictures.test.mjs`** -- what a capture may write and what
    the check compares, the arguments, the browser refused before it is
    launched, the widths, the page served under its path and headers and
    nothing outside them, the faces' versions; each failed before its
    module was written.

  **Measured** on 20 October 2026: the five pictures taken by
  `node scripts/pictures.mjs` on a Windows 11 desktop, Node 24.21.0,
  Playwright 1.64.1, Chromium 156.0.8078.4's headless shell, in 6.5 s for
  the whole walk, each settled in two shots, at quality 0.9 and twice the
  CSS size: `demo-form` 608 by 1076 CSS pixels, 133,928 bytes;
  `demo-refused` 840 by 505, 117,592; `demo-on-purpose` 1440 by 753,
  300,824; `demo-read-out` 840 by 2011, 340,686; and `demo-changed`,
  retaken the same day on the same machine with its response's section
  alone for the hero, 840 by 855, 119,564 -- 1,012,594 bytes of WebP in
  all. The check walked the five as first taken in 1.1 s by its own
  record there, and, with the files it reads copied into Playwright's
  Linux image `v1.63.0-noble` (Ubuntu 24.04.4, Node 24.20.0) with
  Playwright 1.64.1 and its Chromium installed in it, passed twice, the
  second in 1.0 s by its record: the text recorded on Windows is the text
  the page says on Linux, with the web fonts refused. The retaken
  `demo-changed` records its response's text byte for byte as the first
  did, compared after the retake, and the check walked all five again in
  1.2 s on Windows. None was measured on a runner.

  **Not mechanically enforced:** whether a picture still looks like the
  page -- the check reads text, never pixels -- and whether a caption's
  quote is painted in the picture rather than scrolled out of a region; a
  look at each picture, which review owes on every retake.

## Context

The README said what the demo does, and showed nothing of it: CLAUDE.md
said "no README picture", since none had a way to be held. The user asked,
on 20 October 2026, while the READMEs were simplified, for Health's README
to show the demo as Formancy Report's shows its Studio: "A script-taken
picture pipeline for Health's README, like Report's: pictures of the demo
held to the text they show."

Report's pipeline is formancy.ai-data 0038's
([formancy.ai-report 0013](https://github.com/sharkysan/formancy.ai-report/blob/main/docs/decisions/0013-the-studio-is-the-same-room-and-its-pictures-are-taken-by-a-script.md)):
`scenes.json` names each scene, its caption and what it quotes; the app's
script walks the built page through its controls and pictures whole parts
of the states it reaches; `captured.json` records each part's accessibility
text; a check walks them again and fails when a part says something else;
the guard renders the README from the two files. Health's demo is one page,
in Chromium, Firefox and WebKit (0014), served under its path and a policy
that allows it no connection (0012), on synthetic data (0009, 0012).

## Decision

- **Report's pipeline, ported and adapted, not shared.** The modules are
  copies under `scripts/pictures/`, each saying whose it is: there is no
  package to share them through, and a copy here changes with this page.
  What differs: the page is served from `dist/` on an origin nothing
  resolves under `/health/` with the headers the deploy writes for that
  address (`scripts/demo-headers.mjs`), as the browser gate serves it; no
  canvas is waited for, since the demo draws none; the breakpoints and the
  stylesheets are the demo script's to read, through the browser gate's
  `gate-page.mjs`, so the two read them one way; and the stylesheet digest
  is of every stylesheet the page wears, the themes as installed among
  them.
- **Five scenes, each whole sections of a state the page reaches,** at
  1440 pixels, past every breakpoint, in English: the form as the page
  opens; the question changed and the response made again, its JSON
  shown, the hero, since FHIR JSON is what the packages give a vendor's
  application; the question cleared, the response refused and the
  document not made; the inputs refused on purpose; and the Questionnaire
  read out, folded under "More" for its height. The CH ORF document's
  JSON is never opened, and every value in a picture is the corpus's
  synthetic one or typed by the act.
- **Chromium alone.** `scripts/browsers.mjs` names `PICTURES_BROWSER`,
  Chromium, whose canvas encodes the WebP; the session refuses another
  before it launches anything; the check runs in the Chromium leg of the
  `browser` job, after the gate and when it failed too.
- **Found by its file, run from the root.** An app has pictures when it has
  `apps/<app>/scripts/pictures.mjs`; the check is
  `node scripts/pictures.mjs --check`, with no package script, and the
  release report finds the apps the same way.
- **The release report reads the check** from the Chromium leg's results,
  holds it to every scene `scenes.json` gives the app, read by the report,
  and fails the run on a check that left nothing, stopped, found a picture
  no longer showing the page, did not walk a scene or walked another's, or
  ran in another browser or build than Playwright pins.

## Consequences

**What it buys.** A README that shows the demo, from the FHIR JSON it
makes of a changed answer to a refusal naming an AHV number's path and
never its digits, and cannot go on quoting
a sentence the page no longer says: a reworded refusal fails the next
pull request's browser job, and the release report fails the run in which
any scene went unwalked. A retake is a command, and the record says on
what it was taken.

**What it costs.**
- **A megabyte in the repository,** 1,012,594 bytes of pictures as
  measured above, and more with every retake git keeps.
- **Pixels unchecked.** A change of colour or layout alone, a theme
  release among them, leaves every text equal; the check prints a notice
  when the stylesheets' digest moved, and a person must look.
- **One look.** Every picture is taken on one machine's look: its
  platform, Playwright, Chromium and each face's version in its Fontsource
  package, which `docs/images/readme/captured.json` records with each
  picture. A retake on another look -- another platform, or after a
  Playwright, Chromium or face release -- refuses to write even one
  picture until `node scripts/pictures.mjs --all` retakes all of them.
- **Playwright's text.** What the check compares is Playwright's
  accessibility snapshot, so a Playwright release that prints it another
  way fails the check for every scene, in CI's browser job, until every
  picture is retaken.
- **A wording change is a retake.** Any change to a section a picture
  holds -- an intro sentence, a refusal's message -- fails the check until
  `node scripts/pictures.mjs` retakes it, and the retake's pictures need
  a look before they are committed.
- **Chromium's view alone.** Firefox and WebKit draw the page too (0014);
  no picture is of them.
- **The refusals on purpose shown smaller than taken.** Their section is
  the page's width, 1440 pixels, wider than GitHub's README column, which
  scales the picture down and its refusals' type with it.
- **A copy of Report's modules,** which a fix there does not reach here,
  and nothing compares.

**What it forecloses.** A hand-taken picture of the demo, a caption
quoting what no picture holds, and a picture of anything but the
synthetic referral.

## Alternatives considered

**Pictures taken by hand.** Rejected by the user's request: nothing would
check them, and the README would show a page that may no longer exist.

**A picture of the whole page.** One long picture of everything. Rejected:
5,190 pixels tall at 1440 -- `document.documentElement.scrollHeight`,
measured on 20 October 2026 in Chromium 156.0.8078.4 under Playwright
1.64.1 and Node 24.21.0 on the Windows desktop above, the built page
served as the camera serves it and its faces arrived -- mostly text the
README says anyway, and a caption held to every word of it would fail on
any change.

**Report's modules taken from Report.** They are scripts of its
repository, published in no package, so there is no release to depend on
at an exact version (0002); the demo's browser gate is Report's adapted the
same way, each file saying whose it is.

**Every browser of the gate.** Three looks of one page, three times the
weight, and three records of what is one text. Rejected: the check of one
browser's text holds the captions, and the gate holds the page in all
three.

**One card of the refusals on purpose.** The AHV number's card alone,
an article the page names, would be shown at its own size. Not taken: a
picture is whole sections of a state, here and in CLAUDE.md, and a card is
part of one; changing that is the maintainer's.

**A `test:pictures` script in the demo's manifest, as Report's Studio
has.** Not taken in this change, and not for a reason of its own: the
change was made without leave to edit a package manifest, so the check
is run by its path and the report finds the app by its script file,
which need none. Report's shape is one script line in
`apps/demo/package.json`, the workflow step and the report finding the
app by that script, as it finds the browser gate's by `test:browser`;
whether to take it is the maintainer's.
