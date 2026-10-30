# Changelog

All notable changes to Formancy Health. Every package moves on one version
number. The versions of the upstream `@formancy/*` packages this repository
depends on are a separate line, and a change to one is called out explicitly.

Loosely [Keep a Changelog](https://keepachangelog.com), with reasons attached —
a line that says only *what* changed is rarely the line you need six months
later.

## Unreleased

**CI fails a change that breaks the lint rules or the format** (0017).
Style was held by habit, and a promise nobody awaits or an `any` from
`JSON.parse` by nobody: `verify` now runs `pnpm lint`, typescript-eslint's
type-aware recommended rules at error, JavaScript held to those that need
no types, and `pnpm format:check`, Prettier over every TypeScript and
JavaScript file. The rules and the style are one
module, `scripts/code-style/code-style.mjs`, the first copy of what
formancy.ai will publish as `@formancy/code-style` for all four
repositories, which this repository calls with its own paths and swaps
for the package once it is released. Every file was
formatted in one commit, which `.git-blame-ignore-revs` has blame skip,
and every finding fixed; none was a defect. A test alone is relaxed in
seven rules, `no-explicit-any` among them, because a test types the
untyped body it reads as `any`. `require-await` is off everywhere, because
an `async` function with no `await` is how a synchronous implementation of
an async contract (a test double, a Fastify handler, a test-support port)
keeps its throws as rejections, and the rule cannot tell that from an
`async` a refactor left behind; `no-floating-promises` and
`no-misused-promises` still catch a forgotten `await`. A rejection with a
forwarded `any` or `unknown` is allowed everywhere, as throwing one
already was; a string or object literal is still refused. Both decisions
came from formancy.ai-data's lint fixes, which made each line by line as
disable comments, and a review ruled that they belong in the shared rules. Prettier leaves code
embedded in a string as it is (`embeddedLanguageFormatting: 'off'`),
because formancy.ai's format reflowed Angular templates, whose whitespace
renders, and failed tests; the format commit is identical with it off. The
packages' API is what it was.

**The README shows the demo, in pictures a script takes and the gates
hold to the text they show** (0016). The README said what the demo does
and showed nothing of it, since a picture nothing checks shows a page that
may no longer exist. It now opens with the QuestionnaireResponse the demo
makes again from a changed answer, its JSON shown, and *Try it* shows the
form as it opens, a required answer cleared and refused, the inputs
refused on purpose and the Questionnaire read out: whole sections of
states the page reaches, taken by `node scripts/pictures.mjs` in Chromium
from the built page, on its synthetic referral alone, each caption quoting
only what those sections say. Formancy Report's pipeline, adapted: the
scenes in `scripts/pictures/scenes.json`, each section's accessibility
text in `docs/images/readme/captured.json`, and the README's two regions
rendered from both, which `pnpm test:repo` holds. CI's browser job walks
every scene again in its Chromium leg and fails when a section says
something else, and the release report fails a run whose check did not
walk a scene. What nothing checks is the pixels: a change of colour or
layout alone needs a look, and the pictures weigh 1,012,594 bytes, as taken
on 20 October 2026.

**The README says what Formancy Health does before anything else.** It
opened with a status that restated, package by package, what the packages
and the validator gate do, and its Try it, its package table and its
validator gate ran to paragraphs the decision records, the package READMEs
and the architecture already hold. It now opens with what the module is and
a list of what it does, each line with its decision record and each term
a newcomer meets -- SDC, CH Core, CH ORF, a GLN, an AHV number -- said in a
few words where it first appears, then what is planned and not in 0.1.0,
and a short dated status that links here; its documents list links the
glossary. The detail it dropped is in the decision records, 0.1.0's
section below, the package READMEs, the getting-started guide, the
architecture -- verification's §10.3 for what the validator gate's claim
does not cover -- `RELEASING.md` for how 0.1.0 was rehearsed and
published, and `CLAUDE.md`. The intended purpose, HL7's notice, the
licence table and both generated blocks are as they were, and every
heading another document links to is still there.
`CLAUDE.md`'s map of the packages put a referral's orders in CH Core's
profiles; it now says CH ORF's, which `profiles.ts` names.

**Why a PDF/A declaration is refused is said as 0008 says it: no gate here
proves a producer of PDF/A.** The README, release gate G4, which every
release report prints, the known limitations and the architecture said
instead that no Formancy Report release writes PDF/A, which stopped being
true on 19 October 2026 with Report 0.2.0, which draws the final render of
an e-invoice as a PDF/A-3b (formancy.ai-report 0031). Nothing refused changes:
health-corpus renders with Report 0.1.0, which writes none, and every
PDF/A declaration is refused as before.

**A release's SBOM check reads which version each published package is
given.** It held every copy of a runtime dependency's name to the one
version the suites loaded. Formancy Report's 0.2.0 rehearsal was refused
for that on a correct SBOM: the install held `@noble/hashes` twice,
report-spec's 2.4.0 and the 1.8.0 pdfkit brings (formancy.ai-report
0017). No published package here has a runtime dependency of its own, so
nothing was refused here; the first one added is now held where the
package that declares it is given it, in the SBOM's dependency graph, and
an SBOM that records no such dependency is refused. Upstream packages are
still held by name.

## 0.1.0 — 2026-10-19

**The first release, a developer preview.** It is for a vendor to evaluate
Formancy Health and build against it: a CH ORF referral from a formancy
form and a person's answers to it, and a document Bundle that carries a
PDF Formancy Report rendered. It is not yet for a production export of a
person's record: no lawyer has read the licence, the intended purpose or
the trademark position, and the release gates that ask for that reading
are open ([`docs/release/gates.json`](docs/release/gates.json)).

Published at 0.1.0: `@formancy/health-core`, `health-questionnaire`,
`health-document` and `health-ch`. They are under
the Formancy Health Source-Available Licence, which no lawyer has reviewed
yet ([0001](docs/decisions/0001-a-paid-module-in-its-own-repository.md)).
Besides one another they depend on one package, at an exact version:
formancy's `@formancy/spec`, 0.6.0, the release the README's table names
and the release report's Tested on shows. They take no peer, and run under
Node in every gate and nowhere else. `@formancy/health-corpus`, which
renders its PDF with Formancy Report's released packages, stays private.

Not in this release:
- **PDF/A, and the CH EPR's MHD document**, which waits for a Formancy
  Report release that writes PDF/A; until then health-document refuses
  every PDF/A declaration
  ([0008](docs/decisions/0008-a-document-is-a-bundle-of-what-it-refers-to-and-a-pdf-its-own-bytes-never-an-unproved-pdf-a.md)).
- **Extraction** from a QuestionnaireResponse.
- **Germany, the United Kingdom, Austria and Europe.**
- **File, signature, ranking, matrix and rich-text items**, each refused
  with the form
  ([0006](docs/decisions/0006-a-formancy-form-is-an-sdc-questionnaire-refused-whole-where-it-cannot-be-one.md)),
  and **FHIRPath** anywhere.
- **Of CH ORF**, the Questionnaire inside the Bundle, and a PDF, the
  Composition's receivers and contacts and the rest
  [0009](docs/decisions/0009-a-ch-orf-document-is-the-hosts-referral-in-ch-core-and-ch-orf-the-questionnaire-by-canonical-and-swiss-identifiers-checked-here.md)
  refuses.
- **A page, a server or any transport**, in the packages: the demo below
  is a page beside them, never published.

The release report of the run that gates this release lists, under "Known
limitations", what each decision record says a user will meet.

**formancy 0.6.0: the packages read forms through it, and the demo wears
formancy.ai's room** ([0015](docs/decisions/0015-the-demo-wears-formancy-ais-room-imported-from-formancy-0-6-0-and-the-packages-read-forms-through-the-same-release.md)).
formancy 0.6.0, released on 18 October 2026, publishes formancy.ai's
admin palette as `@formancy/themes/room.css`, which 0012 said the demo
would wear the day a release shipped it, and the maintainer asked why the
demo looked unlike Report's Studio beside it. The demo now imports the room
after the workbench, as its header asks, where it wore 0.5.0's light
workbench and Blueprint: the dark ground, glass panels, violet for what a
visitor acts on and teal for what the packages did, Archivo for its
headings, and still no colour of its own. The form stays in Blueprint, on
Blueprint's own white paper, as formancy.ai's admin previews a form. Its
browser gate now checks, in every pass and every browser, that each
variable `room.css` sets holds on the page, compared as colours; and axe's
contrast, decided in every state the journey reaches, held the dark page
in Chromium, Firefox and WebKit, the read-out, the refusals on purpose,
the downloads and the notices among it. Its suite now holds that the
page's script writes no style, since a copy of the room's values set from
a script would pass the gate's check of them, and that Blueprint's
variables are read only inside Blueprint's scope. The packages move with it:
health-questionnaire depends on `@formancy/spec` 0.6.0, exactly, since the
demo bundles it beside formancy's engine, which depends on 0.6.0, and two
copies of the form's spec in one page would read one form twice; the
demo's suite now fails when the page's dependencies bring two copies of a
formancy package, which no exact pin could see. So a
consumer meets `@formancy/spec` 0.6.0. Its spec version is 4, as 0.5.0's
was, and its validator decides as 0.5.0's did -- the corpus's 50
resources are the same bytes made with either, and the validator gate
judged them as its corpus expects. formancy 0.6.0's engine writes a
computed field only by its rule, enforces a repeater's bounds and clears
the fields of a group a rule hides; every behaviour of its engine the
mapping rests on was measured again on 0.6.0 and is as 0.5.0 had it.
Formancy Report 0.1.0 depends on `@formancy/spec` 0.5.0, exactly: so
health-corpus, private, keeps that copy beside the packages', and so does
an application that installs Report 0.1.0 beside Health 0.1.0, as the
getting-started guide's project does. Report only hashes its own
definitions with its copy and names none of its types, so nothing one
copy makes reaches the other, and the letter it renders is the registered
bytes. The release report, which lists the package at both versions,
now holds what a clean install resolved of a package the published
packages depend on to the versions the suites ran them against, so
Report's 0.5.0 excuses nothing a consumer meets, and what it resolved of
one they do not depend on to any version a suite loaded: it had said
that no suite ran the 0.6.0 every suite of the packages loads. In the
build of 19 October 2026 the page is 765.31 kB, 226.39 kB
gzipped, 8.1 kB more for 0.6.0, and asks for 31 faces, 437 kB, as it
starts, Archivo's three among them.

**A demo at https://formancy.ai/health/ shows the packages at work**
([0012](docs/decisions/0012-a-demo-at-formancy-ai-health-fills-a-synthetic-referral-in-the-browser-served-by-a-worker-of-its-own.md)),
so that a vendor can try the export without installing anything.
`apps/demo`, private and never published, is a page in Swiss German,
French, Italian and English that fills a synthetic Swiss referral with
formancy's React renderer and shows what the packages make of it in the
visitor's browser -- the SDC Questionnaire, the QuestionnaireResponse,
the CH ORF document and the letter's document Bundles -- beside fixed
inputs each refused for one thing, every refusal as the package states
it, in English.
What it shows before anything is changed is the validator gate's corpus,
byte for byte, which every build checks; what a visitor changes is
validated by nothing, and the page says so. It says it sends what is
typed nowhere and keeps none of it, which its policy and its gate hold,
and nothing about cookies or tracking, which formancy.ai's zone decides
and nothing here reads. Of conformance it says what CI's validator gate
judges and that the sample is in its corpus, not that the gate passed on
the commit the page was built from, since Cloudflare deploys before CI
runs and `main` requires no check. It takes formancy's `@formancy/core`,
`@formancy/react` and `@formancy/themes` at exactly 0.6.0, beside the
`@formancy/spec` 0.6.0 the packages read, for the demo alone, and wears
formancy.ai's room as 0.6.0 ships it, imported and stating no colour of
its own (above). The README's table of what the packages are built and
judged against stays theirs. No HL7 mark names its
Worker, its routes or its title, which `scripts/trademark.test.mjs` now
reads as it reads the packages' names
([0003](docs/decisions/0003-the-product-name-carries-no-hl7-mark.md));
and the costs a visitor or an operator meets are the release report's
known limitations under an area of their own, `demo`.

**The validator corpus holds the demo's referral, and the letter's PDF is
registered by its bytes** ([0012](docs/decisions/0012-a-demo-at-formancy-ai-health-fills-a-synthetic-referral-in-the-browser-served-by-a-worker-of-its-own.md)). The demo at formancy.ai/health/ starts
from a synthetic referral, `scripts/validator/demo-referral.mjs`, in Swiss
German, French, Italian and English, about and by the corpus's own
synthetic people, with no AHV number and no SNOMED CT code; the gate judges
the Questionnaire, the QuestionnaireResponse and the CH ORF document the
packages make of it, and accepted all three on 17 October 2026 with no
warning but the registered ones, so that what the page shows before
anything is changed is what the gate judged. `docs/release/letter.json`
registers the referral letter's PDF by its size and SHA-256, and the gate
now refuses to run on a render of other bytes, as the demo's build refuses
to ship one: the PDF is rendered by Report's renderer and the zlib of each
machine's Node, health-corpus's tests prove the same bytes only within one
process, and CI's validator job, under Node 22.23.3 on Linux, and a
desktop, under Node 24.21.0 on Windows, rendered the same 18,938 bytes,
measured the same day. `@formancy/health-corpus/documents` is the
documents without the letter's renderer, which the demo bundles; a guard
fails when, as built, it is not the module the index re-exports or reaches
anything but health-core and health-document.

**The demo is deployed to https://formancy.ai/health/, by a Worker of its
own** ([0012](docs/decisions/0012-a-demo-at-formancy-ai-health-fills-a-synthetic-referral-in-the-browser-served-by-a-worker-of-its-own.md)), as formancy.ai-report 0018 serves Report's Studio at
`/report/`. Cloudflare's Workers Builds builds `main` on every push and
runs `node scripts/demo.mjs`, which stages the built demo under `/health/`
and deploys it with Wrangler 4.146.0, the version Report's deploy runs;
so the address is main's demo, which can be ahead of a release, and
nothing here checks what it serves. The deploy writes for every file the
headers `scripts/demo-headers.mjs` decides for https://formancy.ai/health/,
which `pnpm demo` and the gate are served with too, each written for its
own address: a policy that allows the page no connection and no form
action, so that what a visitor types is sent nowhere; scripts, styles and
faces from the build's own assets at that address and nowhere else, not
the whole origin, since a review measured that a script Cloudflare serves
under `/cdn-cgi/` of the same origin, admitted, could send what was typed
there; images from `data:` alone; Trusted Types, so that no string a
script hands to `innerHTML` becomes markup; `noindex`; and
`no-transform`, which asks Cloudflare to add no script of its own. So
`pnpm demo` is to be opened at http://localhost:4395, the address its
policy names. The deploy refuses a checkout with changes, a Worker
config that would serve the demo anywhere but that path or answer a
missing file with a page, a page that asks for a file by an absolute path,
and a build with a `_headers` of its own, which would be served as a file
and read as nothing.

**The demo has a browser gate, in a job of its own** ([0012](docs/decisions/0012-a-demo-at-formancy-ai-health-fills-a-synthetic-referral-in-the-browser-served-by-a-worker-of-its-own.md)), as
formancy.ai-report's Studio has: `pnpm --filter @formancy/health-demo
test:browser` builds the page first, as `vite build` does, serves it
under `/health/` with the headers the deploy writes for formancy.ai,
written for its own address, and walks it in Chromium, at the build the
installed Playwright pins, at every width its stylesheets' breakpoints
give, from 320 pixels to a wide screen, each in one of its four
languages: no sideways scroll, axe's rules, contrast and target size in
every state, the keyboard's way in and through the form, the resources
the browser makes of the sample held to the validator gate's corpus byte
for byte, a change, a language switch, a refusal and the way back, every
download the bytes shown, and what the page asks of the network and the
browser. jsdom applies no stylesheet, sends no request and enforces no
policy, so each of these was until now a claim nobody had checked. Its
first run found one that did not hold: a browser asks for a face split by
`unicode-range` only when text in its range is first drawn, so text typed
in Greek, Cyrillic or Vietnamese, or a JSON opened, asked the server for
a face after the page had loaded, which tells it what kind of text was
entered. The page now asks for every face its stylesheets declare as it
starts -- 28 WOFF2 files, 356 kB in all, in the build of 18 October
2026, and 31, 437 kB, since the room's Archivo joined them (above) -- so
that once it has settled it asks
for nothing more, whatever is typed, and the gate fails if it does. The
release report gains a Browser section and the job it reads, and fails a
run on a check failed, a pass planned and not made, or a browser other
than the build Playwright pins; no release gate rests on it, since the
page bundles the packages as the workspace builds them, never the
tarballs, which a limitation of every report says. A review then found
the gate had measured another page than Cloudflare serves: Vite sets
`NODE_ENV` for the first config it resolves, and the gate resolved its
page's modules before it built, so it built and walked React's
development build. It builds first now, and checks, by React's own
report of itself, that the page runs React's production build; and it
checks that the banner is there once, that nothing typed reaches the
address, that the notices the foot links to are the file the build
wrote, and that the policy refuses an inline script and a `/cdn-cgi/`
script injected into the page as it is served.

**The demo carries the licences and notices of what it bundles**
([0012](docs/decisions/0012-a-demo-at-formancy-ai-health-fills-a-synthetic-referral-in-the-browser-served-by-a-worker-of-its-own.md)),
since React's, formancy's and the faces' licences ask their texts to
travel with every copy and the bundle keeps none. Its build writes
`THIRD-PARTY-NOTICES.txt` beside the page, which the page's foot links:
every package the bundle holds, by name and version, with every licence
and notice file it ships, by `scripts/third-party-notices.mjs`,
formancy.ai-data 0046's plugin as Report's Studio carries it. Every
package it lists is held to the licence policy the published packages
are, so a package with no licence text, or under a licence that policy
refuses -- Formancy Report's own among them -- stops the build, naming it.

**The demo's words say no more than holds**
([0012](docs/decisions/0012-a-demo-at-formancy-ai-health-fills-a-synthetic-referral-in-the-browser-served-by-a-worker-of-its-own.md)),
as a review read them: a change names the two resources it remakes,
where it said every resource shown had changed; the lead says the
profiles so far are Switzerland's; the conformance sentence names every
profile the response is judged against, and what an offline validator
does not check, as the README does. Its guards read "open source"
however a language spells it, and a statement about tracking in each
language's words, and hold each language's banner to its three
statements.

**The demo reads its Questionnaire out as the form it is**
([0013](docs/decisions/0013-the-demo-reads-its-questionnaire-out-from-the-bytes-it-shows-and-renders-no-questionnaire.md)),
since a reader saw the form drawn and, beside it, a Questionnaire that
showed only a button for its JSON and a download, and asked whether the
Questionnaire was a form at all. Above its JSON the page now reads it out
item by item, in its order and nesting: each item's text in the page's
language -- the resource's own, marked with its language and said to be,
where the resource has no translation into the page's -- its linkId, its
type, whether it is required or repeats, its options, and the conditions
that show it, in words. It reads the bytes it shows, by health-core's
`readJson`, and never the form, so it says what the resource says; a
Questionnaire it cannot read whole it does not read out at all, and that
includes one with a member or an extension health-questionnaire does not
write, since an item read out with what changes it passed over -- answers
from a value set, an expression that shows it -- would be a form the
resource does not say. A condition names an option by its code system and
code, as R4 matches it. What it does not read, a read-only or a hidden
item's flag among it, the page says is in the JSON alone. Each item
leads by a button to the field the form drew for it, scrolled to the
middle of the window, since a field's own focus left its label above the
window, in WebKit at every width; only where formancy's renderer draws a
control of the id its engine mints that takes the keyboard -- not the
radio group, whose options take ids of the renderer's own -- and it says
so where the form does not show the field. The form's step says that the
form becomes the Questionnaire, its keys the items' linkIds, and the
Questionnaire's that its title, unlike its items, is in one language; the
read-out says it is no FHIR renderer and validates nothing, and that
Formancy Health draws no Questionnaire. The browser gate holds the
read-out to the corpus's Questionnaire in every pass, and each way to its
field, with the field and its label in the window. The page's chunk grows
to 757.21 kB, 224.00 kB gzipped, in the build of 18 October 2026.

**The demo's browser gate runs in Chromium, Firefox and WebKit, and fails
on a console error the page causes**
([0014](docs/decisions/0014-the-demos-browser-gate-runs-in-chromium-firefox-and-webkit-and-each-fact-the-browsers-disagree-on-is-named-and-held.md)),
since WebKit logged two errors on the live page that the gate, in
Chromium alone, could not see: "Refused to apply a stylesheet because its
hash, its nonce, or 'unsafe-inline' does not appear in the style-src
directive". They are WebKit 27.2's own: under a policy that admits no
inline style it refuses a style attribute of its own,
`text-overflow:inherit`, on every `<select>`, the page's language bar's
and the form's, and reports it as the page's -- a page of one select and
no script does the same, WebKit 26.6 did not, and Chromium and Firefox
never. The page draws the same without it, and the policy is loosened
for none of it: no hash, no `'unsafe-hashes'`. The gate now runs every
check in each of the three, a leg of CI's `browser` job each, WebKit on
Linux alone; fails on every report of the page's policy and every console
error, the whole journey long, but those a row of the table names, as
often as it names them, and, in the pass that refuses the web fonts, the
errors that name a file the gate itself refused; and names what the
browsers disagree on in `scripts/browsers.mjs`'s table, each row held by
a check of one name in every browser: WebKit's own refusal at a select,
one report of each, so that a style the page sets on a select and takes
off again is the page's in WebKit too; WebKit forgetting that
the faces the page loaded and does not draw with are loaded; and, where a
face's woff2 does not arrive, WebKit asking for its woff only once text
in its range is drawn, which tells the server what kind of text was
typed -- a cost the page does not fix yet, said in the README and the
risks. The select's row is held on a page of one select, whose reports
are read once a task queued after its load has run, by which every
browser had given them in every run measured, and not after a fixed wait
that a slower machine could outrun. The release report reads each leg
under its browser's key, compares the browsers' checks by pass, in their
order, and by name, fails a row no check held, and prints the table.

**The demo's download links are never pointed at bytes they no longer
hold.** A link whose bytes changed -- the letter's Bundle, when the PDF
moves into a Binary -- showed the new file's name over the old bytes'
address for a moment, an address revoked as the new one was made, and
Chromium cancelled a download pressed then, as CI's browser gate did on
18 October 2026. The link now goes when its bytes change and comes back
with their own address; `download.test.tsx` holds that no link's address
changes in place.

**The README says what 0.1.0 is, what is not in it, and what it is for**
([0011](docs/decisions/0011-a-release-report-is-derived-from-the-run-that-gated-it.md)):
its Status says, on 17 October 2026, that 0.1.0 is ready to tag and not
released, what has not run on GitHub yet and what is the maintainer's; a
section says what 0.1.0 publishes and the gates it is held to, a list what
is not in it, and a section its intended purpose -- a converter of what a
vendor's application holds into FHIR resources, and an assembler of
documents of them, for software vendors -- with CLAUDE.md's sentence that
it is not an EHR, a FHIR server or a terminology service and not intended
as a medical device, word for word; and the getting-started guide is the
first thing it sends a developer to. A vendor deciding whether to build a
health product on this one reads first what it is for and what is missing,
and until now the README said only what was built; the purpose a device is
judged by is what its maker says it is for, so a README that worded it
otherwise than the rule every change is held to would be a second purpose
nobody compared. `scripts/readme.test.mjs`, in `pnpm test:repo`, fails when
the README's Intended purpose section stops holding CLAUDE.md's sentence,
read from CLAUDE.md, and when a relative link of the README, or the
heading it names, no longer lands, and failed on the README's link to a
section of RELEASING.md before that section was written. RELEASING.md now
says what the maintainer sets before the first release, as read with
`gh api` on 17 October 2026: the `npm` environment's policy is set, and
neither `NPM_TOKEN` nor `CODECOV_TOKEN` is. The README's opening names one
audience, the vendors whose software hospitals and practices run, as its
intended purpose does, since a device's purpose is what its maker says of
it anywhere; and it says that keeping a document's identifier unique
across documents is the host's.

**Every run of the gates ends in a release report, and a release attaches
it signed** ([0011](docs/decisions/0011-a-release-report-is-derived-from-the-run-that-gated-it.md),
[`docs/release/`](docs/release/README.md)), as Formancy Report's does
(formancy.ai-report 0014): until now nothing said what a release was tested
on or which gates it had passed, and the install and validator gates wrote
results nobody read. Each job of the gates collects what it found and
uploads it; a last job, `report`, builds the report of that run -- what it
was tested on, from the published manifests, what is installed and the
README's compatibility tuple, beside what each job ran; each package's
results, held to every test file the checkout holds for it; the install
gate; the validator gate's verdict, read again from its rows and held to the
validator and the packages `docs/release/` pins; each tarball's built files
against every job's `dist/`; the release gates; and the known limitations --
and fails the run on any problem it lists. The registers' cases `verify`
skips, by design, are accounted for one by one by the validator job's pass
of the same case, and a skip nothing accounts for fails the run, as a
failure does. Two registers arrive with it: `docs/release/gates.json`, the
plan's gates G1 to G7, 0.1.0's dependency-licence guard, trademark guard and
rehearsal, and the legal review, each with its evidence or the reason it is
open -- G1 among the open ones, in part, since no gate bundles a package's
tarball for a browser and that no upstream file is copied is review's, so no
report prints it passed -- and `docs/release/limitations.json`, what each decision record's
costs mean to a user, integrator or operator, held to the records by hash,
so an edited record fails `pnpm test:repo` until it is read again and
stamped. A release's `check` job now refuses a report that is not that
run's, green and whole, and a tarball that is not the one the report says
the install gate ran, and pins the report beside the tarballs; `publish`
signs the report beside the SBOM and attaches both; the release body is the
changelog section and the report's summary, built by the report job, which
replaces the body `check` built. The validator gate's results now say when
its run started and ended, which the report holds them to, and record
what the run used, measured as it ran -- the offline options from the
command line it spawned, the JAR's SHA-256, the packages laid out in the
validator's cache -- where they were copied from the registers the report
then compared them with, so the comparison could not fail. The report
holds the install gate to the projects `scripts/install-hosts.mjs` plans,
not to the gate's own `passed`, so a gate that dropped the guide's
project fails the run; judges each resource again from its row's counts,
not only from the gate's verdict; reads the install gate's record and the
validator's files only from the job that leaves them; and, on a machine,
refuses guards that ran before the gate they read. Each was a hole
review found in the report's first build the same day. By 17 October
2026 the report had not run on GitHub: the first pull request run is the
first that shows the artefacts arrive as it reads them.

**A getting-started guide, whose code the install gate compiles and runs**
([`docs/getting-started.md`](docs/getting-started.md),
[0011](docs/decisions/0011-a-release-report-is-derived-from-the-run-that-gated-it.md)),
as Formancy Report's is (formancy.ai-report 0015): there was no guide, and
the package READMEs' examples are fragments nothing compiles. It takes a
Node application from an empty npm project to a Questionnaire of a formancy
form, a QuestionnaireResponse of a submission, a document Bundle carrying a
PDF Formancy Report rendered, and a CH ORF document, from synthetic data,
showing what each refuses. Every block of code names its host in its fence,
and `pnpm test:e2e:install` writes the blocks into a project of their own --
the tarballs, beside what the guide's section 1 installs: `@formancy/spec`
and Report's runtime and renderer, each at the release a manifest here
declares -- type-checks them with `skipLibCheck` off, runs the program and
fails unless it prints exactly what the guide shows. The consumer's
project keeps the tarballs alone, so that a package's import of what it
never declared still fails there, and the release report's Tested on
shows a consumer's clean install from that project, the guide's apart; both projects
are now checked with exact optional properties and checked indices too.
`scripts/getting-started.test.mjs`, in `pnpm test:repo`, fails when a block
escapes the gate, when the program imports what section 1 does not install,
when section 1 installs other than the gate or at another version, or saves
it as a range -- npm's default, under which a reader's next install takes
another `@formancy/spec` beside health-questionnaire's -- and when
a link or an anchor no longer lands; it reads Markdown through
`scripts/markdown.mjs`, the architecture's guard's reading, which now finds
a fence in a quote or a list as GitHub does. The install gate takes longer:
on one machine, npm's cache warm, about 11 s before and 24 to 39 s after,
once 114 s and later that day 207 s, the registry's waits varying.

**The SBOM describes what a consumer installs** (0011, as
formancy.ai-report 0017): `release.yml`'s `check` job no longer installs the
workspace. It installs the tarballs it pinned with npm, in a project outside
the checkout, no lifecycle script run, and cdxgen reads that install; the
SBOM is then held to the release report -- every published package at the
release's version, `@formancy/spec` and every other upstream package a
consumer's install brings at the version the suites loaded -- before it is
pinned and signed, and to npm's lockfile of the install it was read from,
so that it names nothing that install does not hold, a tool among it, and
leaves out nothing it holds: the report says what an SBOM must name and not
what it must not, and the defect behind Report's 0017 was a tool named.
cdxgen's reading of the workspace, run on this checkout,
named none of the four packages a release publishes, named vitest and two
TypeScripts as required and Formancy Report's packages, which only the
private health-corpus uses, and left out ajv, which every consumer installs
with `@formancy/spec`; the new step, run by hand on the install gate's
tarballs, names the four packages, `@formancy/spec` and its closure, and
nothing else. It had not run on a runner by 17 October 2026: the first
rehearsal is its first.

**The architecture is documented, as arc42 in formancy.ai's files**
([`docs/README.md`](docs/README.md), [0010](docs/decisions/0010-the-architecture-is-documented-in-arc42s-sections-held-to-the-repository-by-a-guard.md)): introduction and goals, constraints,
context, solution strategy, building blocks, the runtime and deployment
views, cross-cutting concepts, quality requirements, verification, risks
and debt, and a glossary, about this product. arc42's own section on
decisions is the records in `docs/decisions/`, MADR-shaped ADRs, as in
formancy.ai, whose verification section arc42 does not have. Each statement
of design is linked to the record behind it, each claim a test or gate
holds is linked to it, and the rest is said to be review's. The
rightsholder asked that every change be
documented, and the architecture had no document beyond the decision
records, which say why one thing is as it is and not how the pieces fit.
`scripts/architecture.test.mjs`, in `pnpm test:repo`, keeps it from going
stale in silence: it fails when a section or the entry is missing, when a
workspace package is not named in the building blocks, when a decision
record is linked from no section -- so a new package or record is placed in
the architecture by the pull request that brings it -- when a relative
link, or the heading it points at, no longer exists, and when a path
written there as code names no file git would commit, so that a test, a
module or a script renamed fails until the sentence naming it is changed.
CLAUDE.md names the architecture among the documents a change keeps true.
The sections describe `main` as of H07, the CH ORF document of
[0009](docs/decisions/0009-a-ch-orf-document-is-the-hosts-referral-in-ch-core-and-ch-orf-the-questionnaire-by-canonical-and-swiss-identifiers-checked-here.md)
included: rebased onto it, the guard failed until health-ch was in the
building blocks and 0009 linked from a section, as it is meant to.

**A referral by form is a CH ORF document, in CH Core's and CH ORF's
profiles** ([0009](docs/decisions/0009-a-ch-orf-document-is-the-hosts-referral-in-ch-core-and-ch-orf-the-questionnaire-by-canonical-and-swiss-identifiers-checked-here.md)):
`@formancy/health-ch`, new. `toChOrfDocument(context)` writes a CH ORF
3.0.2 document Bundle of what the host says of a referral -- its patient,
its author as a PractitionerRole of a Practitioner at an Organization,
its orders as ServiceRequests, and the answers health-questionnaire wrote
of the form -- each resource claiming its CH ORF or CH Core 6.0.0
profile with the guide's version, and the Bundle claiming
`ch-orf-document` unversioned, because CH ORF's Submit Bundle says the
Bundle "shall include" that value and a receiver matching it would not
find it with a version after it. The Questionnaire is named by its
versioned canonical and not carried, as the plan's acceptance has it: the
host publishes it, and a response that names it without a version is
refused. That leaves two of CH ORF's SHALLs unmet -- its Submit Bundle's
"one Questionnaire resource" and its document's "Other resources that
these referenced resources refer to shall also be included" -- which the
profile, `entry:Questionnaire` 0..1, does not hold, so a receiver that
follows the prose resolves the canonical itself. The answers must claim CH ORF's response profile, which the
host passes to `toQuestionnaireResponse` as `profiles`, because the
validator holds a response to CH ORF only when it claims it -- measured,
answers whose subject was the Practitioner were accepted unclaimed -- and
they must be the patient's, written down and given by entries of the
document, and hold nothing `toQuestionnaireResponse` does not write -- a
`basedOn`, an `encounter`, a `partOf`, which CH ORF types and nothing
here would check. The answers are copied once by health-core, and the
copy is what is checked and carried, so that a host's object that reads
one way and copies another cannot pass as one response and arrive as
another. A member of the context it does not name -- an address, a
telecom, a second category -- is refused rather than left out, and so is
a hole in a list of it. Nothing is sent: CH ORF's Submit Bundle is the
host's to make.

**A GLN and an AHV number are held to their systems and check digits
here**, because every one of CH Core's checks of them is a warning, which
the validator raises and nothing else refuses: `gln()` takes thirteen
digits and GS1's check digit, a GLN that does not start 76 included, and
`ahvn13()` 756, nine digits and GS1's check digit, without points -- the
printed form is refused, not read. Each writes its own system, and a
host's own identifier under one of CH Core's seven Swiss systems, in
any case -- `URN:OID:2.51.1.3` is the GLN's system to a receiver that
normalises it, as RFC 8141 lets it -- is refused, so that an identifier
checked here by name cannot pass unchecked under its system. A refusal
of one never names a digit.

**A document's Composition has a narrative, and a document and its
Composition claim the profiles a host names**, because CH ORF requires
`Composition.text` and the Bundle's claim: health-document writes a
`generated` narrative of the Composition's title and its sections'
titles, escaped by health-core, refusing a title XML cannot carry, and
`DocumentContext.profile` and `CompositionContext.profile`. Every
document's bytes change, H06's included. 0008 decided no narrative; 0009
narrows it to every resource but the Composition. The narrative is
headings: it meets CH ORF's 1..1 and not R4's definition, a narrative
"clinically safe" for a human to read alone, which 0009 records.

**health-document and health-questionnaire refuse a member of their
context they do not name, and a hole in a list**, where they left the
member out without a word or walked past the hole into a gap: a
Composition's confidentiality, a coding's version, a section's mode, an
entry's search, a reference's display, a PDF's file name, a response
context's encounter or basedOn, each refused as `unmapped` at the
object that holds it, its name not repeated; a hole in the authors, the
categories, the sections or the entries refused at its index, where one
among the entries threw a TypeError. A context that is no object is
refused as `absent`, where health-questionnaire threw. A host that
passed one of these and had it dropped is refused now (0006, 0007 and
0008 narrowed by 0009).

**A QuestionnaireResponse claims the profiles a host names beside SDC's**:
`ResponseContext.profiles` in health-questionnaire, written once each in
the one place a response's meta is written (0007 narrowed).

**health-core reads a host's context for every package, and escapes a
narrative's text**: `valueAt`, `needed`, `optional`, `text` and `codeOf`
move from health-document, which reads its context with them as
health-ch does, and `known`, `objectAt` and `readItems` are new, the one
place an object is read for its members and a list at every index;
`xhtmlText` escapes `&`, `<` and `>` and refuses what XML 1.0 cannot
carry, and `text` now refuses the same characters -- a control character
but the tab and the line breaks, a surrogate alone, U+FFFE, U+FFFF -- as
a string's `grammar`, because a family name with a bell in it was
written into a Patient while the same title was refused in a narrative.
R4 says only that a string "SHOULD not" hold the control characters. Four rules are new -- `identifier`, `check-digit`,
`profile`, `unversioned` -- and `reference` covers a type the guide does
not allow, as well as R4.

**The validator gate judges CH ORF documents, and loads seven more
packages**: CH ORF 3.0.2, CH Core 6.0.0, SDC 3.0.0, which CH ORF is built
on, HL7 Terminology 7.0.1 and 6.3.0, IHE's formatCode 1.4.0 and CH Term
**3.3.0**, not the plan's 3.4.0, because CH Core declares `3.3.x` and the
validator cannot load it with 3.4.0 alone. IHE's package says CC-BY-4.0,
which the dependency policy refuses; the register admits it for that
package at that version alone, because there is no CH Core without it,
the gate only downloads it, and no package of this product carries it.
The corpus's CH ORF document is accepted with no error and no warning but
dom-6 and `gln-startswith76`, registered because the corpus's GLNs are
under GS1's prefix 952, kept for examples; eleven documents broken from
it are refused for their reasons, among them a GLN's and an AHV number's
wrong check digits, whose warnings are not registered.

**LOINC's notice stands in NOTICE, LOINC's name beside its code, and a
guard holds the code systems the packages write**, because health-ch
writes the repository's first code of a third party's terminology, LOINC
93037-0, which CH ORF fixes. LOINC's licence asks a program that carries
LOINC content to carry the code's display name with it, so 93037-0 is
written with its long common name, "Portable medical order form", in the
source and in the Bundle, as CH ORF's own StructureMap writes it.
`scripts/terminology.test.mjs` fails on a code system that is not HL7's
own or a host's under a domain reserved for examples, a LOINC code not
recorded, without its recorded name or without the notice, and any
SNOMED CT code, which none is.

**No file holds an AHV number that passes its check, and a guard holds
it**, because health-ch's tests, its README and the install fixture
held the AHV number printed as an example in many places, whose check
digit is valid -- as four older tests of health-core and
health-questionnaire did -- while their texts said no valid AHV number
was written. Each is now a number whose check digit is wrong. `scripts/synthetic-identifiers.test.mjs` fails on a valid AHV
number in any file, however its digits are separated, and on a GLN of
the validator's corpus that is under another prefix than GS1's 952 for
examples.

**A PDF is attached to a document Bundle by its own bytes, and a PDF/A
declaration is refused** ([0008](docs/decisions/0008-a-document-is-a-bundle-of-what-it-refers-to-and-a-pdf-its-own-bytes-never-an-unproved-pdf-a.md)):
`@formancy/health-document`, new. `toDocumentReference(pdf, context)`
writes an R4 DocumentReference of a PDF whose `application/pdf`
attachment carries the bytes as base64, or names a Binary that holds
them, with their size and their SHA-1 -- computed here, since a hash a
host gave and nothing checked would be a claim nobody made, and the HL7
validator recomputes both from the data. The host declares what the PDF
is: a plain PDF is attached when its first line is a PDF header and its
last `%%EOF`, which is all that can be read without a parser; every PDF/A
level is refused as unproved, because nothing here proves that a
producer makes PDF/A until veraPDF arrives on a Report release that
writes it, and a receiver archives a document as PDF/A on its sender's
word. `toDocumentBundle(context)` writes a document of the host's
resources: its identifier and timestamp the host's, the timestamp as
`meta.lastUpdated` too, which documents.html calls the document date and
makes mandatory, the Composition first, then only what it refers to;
every reference is resolved before output, and a dangling one, an entry
the Composition does not reach and two entries of one name each refuse
it whole, every refusal at once, because a document "SHALL include only"
what it refers to and a receiver cannot show one whose reference names
nothing. That is stricter than R4 in two ways a host meets: a reference
from an entry -- a DocumentReference's author by `Practitioner/<id>` --
must resolve inside the document too, where R4 lets it point outside;
and a DocumentReference's status, type, subject, date and title, and a
Composition's subject and sections, are required where R4 makes them
optional, since none is made up here. Every DocumentReference's
attachment in a document is held to its bytes: a size, a hash or a media
type that its data or the Binary it names does not have refuses the
document as `mismatch`, because a host can pair a DocumentReference with
another PDF's Binary and the HL7 validator does not look inside a Binary
an attachment names; it costs about 0.1 s a megabyte, measured. The
PDF's bytes are copied when checked by calling nothing they bring, so a
Node Buffer reused after it was handed over changes nothing attached.

**health-core writes bytes, and holds every package's refusals**:
`toBase64Binary`, `base64Binary` and `fromBase64Binary` write, check and
read R4's base64Binary in RFC 4648's one canonical spelling -- R4's own
regex leaves `/` out -- because a PDF's bytes and their hash are
base64Binary and the next package to write one should not write it
again. `Refusals`, `member` and `item`, health-questionnaire's collector
and path writers, move to health-core, so every package names where in
one form; health-questionnaire writes what it wrote. Eight rules are
new: `not-bytes`, `not-pdf`, `unproved`, `absent`, `dangling`,
`unreferenced`, `duplicate-entry`, `mismatch`. `base64Binary` and
`fromBase64Binary` read the text once, character by character, because
a regex of repeated quanta ran out of stack on the base64 of a 4 MB PDF
and threw a RangeError instead of answering.

**`@formancy/health-corpus`, private and never published, takes
`@formancy/report-spec`, `@formancy/report-runtime` and
`@formancy/report-render-pdf` at exactly 0.1.0**, Formancy Report's first
release, to render a synthetic referral letter's PDF with Report's own
renderer, so that the acceptance -- Report's bytes attached and read back
unchanged -- is shown on Report's output and not on a hand-made PDF. No
published package depends on Report. The validator gate now judges three
documents of that PDF and nine broken ones, and its corpus guard fails
when a resource type the packages write stands in no resource it accepts.
The validator's runner and synthetic forms stay in `scripts/validator/`:
moving them would need dependencies health-corpus does not have.

**A formancy submission is exported as a QuestionnaireResponse, or refused
whole**
([0007](docs/decisions/0007-a-formancy-submission-is-a-questionnaireresponse-of-the-same-mapping-refused-whole-where-an-answer-cannot-be-one.md)):
`toQuestionnaireResponse(form, answers, context)` in
`@formancy/health-questionnaire`, walked from the Questionnaire
`toQuestionnaire` writes of the same form and context, so that the two
cannot disagree on an item, a type, an option or a condition. The answers
are formancy's submission, the value its engine holds; the response names
the Questionnaire's url and version, and takes its status, its time and
its subject, author and source from the host, by name. A number answer is
written as the shortest text that reads back as the double formancy holds,
because formancy stores a JSON number and the text a person typed is gone
before any export sees it; an integer item's answer is refused when it is
not whole -- formancy's step admits 2.0000001 -- or past 32 bits, never
rounded or wrapped. No answer is formancy's own, absent, null, blank or an
empty list, and is not written; a value on a page a skip rule walks past,
which formancy keeps, is left out, since R4 gives a disabled item no
answer; a value on an item a visible rule hides, which formancy's engine
clears when the rule hides it, is refused, because one there was set while
the item was hidden, which no form a person fills does, or the two readings
of the rule disagree. A value of another
type than the field's, which formancy's engine accepts in a field with no
bound, an option not offered, a value past a bound, a name the form does
not have, a required item a completed response leaves unanswered, and a
subject given as an address, each refuse the whole export, every refusal
at once, quoting no answer. The SDC response profile is claimed only with
a subject and a versioned Questionnaire, where it validates.

**A `!=` in a Questionnaire is written with its unanswered case**, and is
refused under `&&`, as is a skip rule of `||` or of a list holding a
value; the Questionnaires of forms with a `!=` change. Because the HL7
validator, judging the first responses, reads R4's `!=` as "an answer that
differs" and disables an item whose question is unanswered, where formancy
shows it: an answer a person gave there was refused
(`Questionnaire_QR_Item_NotEnabled2`). With the unanswered case beside it,
the validator's reading and R5's agree with formancy's (0007 supersedes
0006 in this).

**A computed field a visible rule can hide is refused in a
Questionnaire**, and so is a rule comparing with a text of nothing but
whitespace; forms with either, which 0006 exported, are refused. Because
formancy computes the field while the rule hides it and keeps the value,
which R4 gives a disabled item no answer for, so that every response to
such a form would be refused; and because formancy holds a text of spaces
and shows what a rule comparing with it enables, where the response,
reading formancy's own "no answer", writes none (0007, found in review).

**A repeater's `minItems` is no longer `questionnaire-minOccurs`**: one,
on a required repeater, is what `required` says already, and one above is
refused. Because the validator counts a repeating group's minimum against
the answers of each row, which a group never has, so that no response to
such a Questionnaire validated (0007).

**health-core compares numbers and holds references**: `compareNumbers(a,
b)`, exact and by value, for reading an enableWhen against an answer;
`reference(value, path, types?)`, a reference by name, `Type/id` or a
`urn:uuid:`, never an address; and the rules `answer-type`, `option`,
`bound`, `unknown`, `disabled`, `required` and `reference`, so that a host
branches on the answers' refusals as on every other.

**A formancy form is exported as an SDC Questionnaire, or refused whole**
([0006](docs/decisions/0006-a-formancy-form-is-an-sdc-questionnaire-refused-whole-where-it-cannot-be-one.md)):
`@formancy/health-questionnaire` and its `toQuestionnaire(form, context)`,
the first package that writes a resource. One item per field, its key as
the linkId, since formancy's key is the answer's identity, unique across
the form and changed only by a declared rename; the url from the host's
canonical base and the form's id; the version formancy published, with
the `integer` version algorithm SDC's sdc-2 asks for, since formancy
numbers its versions and semver would claim meanings they lack; texts in
the form's default language with R4's translation extension for each
language the host asks for. Because a Questionnaire that admits what the
form refuses, or shows one German question to a reader who asked for
French, would be wrong without saying so, the whole export is refused,
with every reason at once, for a field type version 1 does not map
(signature, ranking, matrix, richtext, file), a constraint SDC cannot
state (a pattern, a format, a mask, a step other than one, a sourced
option list, a required checkbox), a rule beyond a simple comparison, and
a text missing in a language asked for. A visibility rule is `enableWhen`
only where both say the same on an untouched form; a computed field is
read-only, never a calculated item; no FHIRPath is written.

**The first upstream dependency: `@formancy/spec`, exact** -- 0.5.0
when it arrived, 0.6.0 in this release (above)
([0002](docs/decisions/0002-depend-on-upstream-never-copy-it.md)) -- for
health-questionnaire alone: a form means what formancy's own types and
validator say, so it is read through them and never re-implemented. It
brings `ajv` and `@noble/hashes`, MIT both, which the dependency-licence
guard now walks and admits.

**health-core's `Refusal` refuses mappings too**: the rules `version`,
`invalid`, `unmapped` and `missing`, and the `language` a text is missing
in, so that a host branches on one class across every package rather than
on a second diagnostic type with the same rule and path.

**A language is a BCP 47 tag in its canonical case**: health-core's
`language(value, path)`, refusing as `language-tag`, and every language
the Questionnaire names -- the form's default locale, and each a host asks
for -- is held by it. formancy names a catalogue with any text, and as
`Questionnaire.language` the HL7 validator refuses `Deutsch`, `de_CH` and
even `de-ch` with errors, while a translation's language it does not check
offline at all; held only as a FHIR code, each was exported as if it
conformed. Whether a subtag is registered is still not checked: `zz` has
the form, is exported, and the validator refuses it.

**A rule's decimal literal of more than fifteen significant digits is
refused**, because CEL compares an answer with the double nearest it and
R4 with its digits: `weight == 0.30000000000000001` shows its field for
0.3 in formancy, and would hide it in a Questionnaire.

**The validator gate judges package output.** Its corpus holds the
Questionnaires health-questionnaire makes of synthetic forms, between them
every field type, rule, enableWhen operator and answer type it maps --
`scripts/validator/corpus.test.mjs` derives that set from the package and
fails when a form lacks one -- and
four of its Questionnaires each broken for one thing 0006 leaves out, so
the gate shows why. Two warnings are registered, each with its reason:
`TERMINOLOGY_TX_WARNING`, since offline the validator cannot validate
`Questionnaire.language` in full, and SDC's sdc-3, which prefers semver. A registered warning is
accepted wherever the corpus raises it, which 0006 counts as a cost.

**The United Kingdom is among the formats it targets, after Germany and
before Austria**: UK Core and, for England, the NHS Booking and Referral
Standard (BaRS), on the same FHIR R4 4.0.1 as CH Core. After Germany
because a BaRS referral is a message rather than a document and no
released UK Core profiles a Questionnaire; before Austria because BaRS is
a national standard in service. Like Austria's and Europe's, it is built
only when a customer pays for it, and nothing for it is built yet.

**Formancy Health is source-available, on Formancy Data's and Formancy
Report's terms, and the licence is in force before a lawyer has read it**
([0001](docs/decisions/0001-a-paid-module-in-its-own-repository.md)).
Free to read, fork, evaluate, develop and test, including in companies and
without an expiry; a paid licence to run in production; a separate agreement
to redistribute. Customer data, the health records the module is given and
the FHIR resources it generates remain the customer's. `LICENSE.md`
Version 1 is in force from 16 October 2026 and says at the top that no
lawyer has reviewed it. Its terms are Formancy Data's Version 1.1 and
Formancy Report's Version 1, so a Report + Health bundle is one kind of
agreement rather than a compatibility review between licence families. The
whole export is this product, the mapping of a form to the HL7 Structured
Data Capture guide included: a generic core of it in Apache-2.0 formancy was
considered and not taken, so formancy itself exports nothing to FHIR, and
its promise that a self-hoster never hits a paywall is untouched.

**The product is Formancy Health, and no name of it carries an HL7 mark**
([0003](docs/decisions/0003-the-product-name-carries-no-hl7-mark.md)).
It was Formancy FHIR, in `formancy.ai-fhir`, until 16 October 2026, before
the first commit. HL7 forbids its marks in a product's name without its
written consent, grants that consent product by product, and says a name
holding FHIR could never be a registered trademark; the maintainer chose a
name that needs no consent rather than apply for one. The repository, the
`@formancy/health-*` packages, the licence and the README's heading say
Formancy Health. FHIR is named only for the standard the module implements,
and `NOTICE` and the README carry HL7's notice for use without
permission, word for word.

**The repository has Formancy Report's pipeline**
([0002](docs/decisions/0002-depend-on-upstream-never-copy-it.md)), as
Report's first pull request brought it and with what Report has fixed in it
since. It brings:

- **Contributions under a CLA**, checked on every pull request against the
  hash of the text signed.
- **Workflows.** `gates.yml` with a `verify` job, a `test` job per package and
  an `install` job, called by `ci.yml` and by a `release.yml` that publishes
  only the tarballs the install gate ran, pinned by hash, with provenance and
  a signed SBOM. CodeQL and dependency review run in `security.yml`.
- **Guards**, each watched failing first. In `verify`, the licence field and
  files of every package, by `scripts/verify-licenses.mjs`. Under
  `pnpm test:repo`, exact upstream versions, a generated `codecov.yml`, the
  README's licence sentence generated from `LICENSE.md`, the 600-line source
  budget, the test matrix against the workspace, and the workflows' shape.
  And one Report has no need of:
  `scripts/trademark.test.mjs`, which fails when `NOTICE` or the README
  loses HL7's notice, when a tracked file claims a licence from HL7 for its
  marks, and when a package's name, the licence's title or the README's
  first heading holds an HL7 mark.
- **The licences of what a published package needs in production**, read
  in `verify` by `scripts/dependency-licences.mjs` and refused unless
  permissive (formancy.ai-report 0006).

Left out until there is something for them to prove: the HL7 FHIR
validator's gate, Report's release report and its registers, and the
getting-started guide's gate. Left out for good, by 0002: a copy of
formancy.ai's admin colour stylesheet and the palette guard that would hold
it, which Data and Report keep. Version 1 has no page, so there is no
browser gate, no README picture and no demo either.

**`@formancy/health-core` names the FHIR version it emits.**
`FHIR_VERSION` is `'4.0.1'`, R4, independent of every package version. It
is the package that proves the pipeline: build, packaging checks, the
licence in the tarball and the install gate all run on it. Nothing exports
a resource yet.

**`@formancy/health-core` writes and reads FHIR JSON exactly, and holds
R4's primitives to their types**
([0004](docs/decisions/0004-fhir-json-is-written-and-read-exactly-with-primitives-of-its-own.md)).
FHIR says a decimal's precision is part of its value -- 0.010 is not 0.01
-- and a JavaScript number keeps neither a trailing zero nor more than
about seventeen digits. So a number is its text: `decimal()`, `integer()`,
`positiveInt()` and `unsignedInt()` take a string or a bigint, check it
against R4's grammar and, for the integers, their 32-bit range, and refuse
a JavaScript number. `date()`, `dateTime()`, `instant()`, `time()`, `id()`,
`code()`, `uri()` and `uuid()` check the rest; a date and time without its
zone is refused, not guessed, and a day the calendar lacks is refused.
`writeJson()` writes a number's digits unquoted, the names in the order
given, the same bytes for the same input; `readJson()` is a parser of the
package's own, because `JSON.parse` reads every number into a double and
keeps the last of two properties of one name without a word. Both refuse
breaks of FHIR JSON's rules -- an empty value, a null outside an array, a
name given twice, a JavaScript number -- with a `Refusal` that names the path
and the rule and never quotes the value, which may be a person's. The
types are the package's own: `@types/fhir` and `@medplum/fhirtypes` both
type a decimal as a JavaScript number. And a new guard,
`scripts/exact-and-reproducible.test.mjs`, fails when a package's source
converts a value through a number or reads a clock or a random source,
which would make the same input give other bytes or an identity nobody
supplied.

**FHIR resources are judged by the HL7 FHIR validator, offline, against
pinned guide packages**
([0005](docs/decisions/0005-a-fhir-resource-is-proved-by-the-hl7-validator-against-pinned-guide-packages.md)).
A new `validator` job in the gates runs `scripts/validator.mjs`: validator
**7.0.2**, the newest release on 17 October 2026, fetched from its GitHub
release and refused unless its SHA-256 is the one
`docs/release/validator.json` pins, on Java 17, its floor; and FHIR R4
4.0.1 with Structured Data Capture **4.0.0**, together with every package
the validator loads with them, each fetched from packages.fhir.org by exact
version and refused unless its SHA-256 is the one
`docs/release/ig-packages.json` registers. That list was read from the
validator's own load, not from a guide's page: it includes R5 terminology
the validator loads for itself and a ballot SDC 4.0.0 declares. Run by
default, the validator downloads packages, asks a registry for the newest
version of two of them on every run and checks codes on tx.fhir.org, so
its verdict would depend on the day; here it runs with no terminology
server and no HTTP at all, and the same commit gets the same verdict. What
that costs is said where it is measured: codes from LOINC, SNOMED CT or
UCUM, and language tags, are not checked offline, and the validator's
warning that says so refuses a resource until it is registered with a
reason; a code system nothing knows draws only information, online and
offline, which the gate accepts. An error fails the job, and so does any warning
`scripts/validator/warnings.json` does not name. The corpus is written by
health-core's `writeJson`, and the resources broken on purpose in it
are each refused for exactly what they break: a missing required
element, two cardinalities, a code outside a required binding, a decimal
written as a string, an unknown profile and an unchecked external code. No
package builds a resource yet, so the corpus is built by hand, and the gate
shows the pipeline judges health-core's output, not that an export
conforms. Its first run found a rule the first Questionnaire will need:
SDC's sdc-2, a version only with its version algorithm.

**The README says what the packages are built and judged against**, in a
table `scripts/compatibility.mjs` derives from health-core's
`FHIR_VERSION`, the two registers, the workspace's manifests and the
toolchain, and `scripts/compatibility.test.mjs` fails when it is stale --
the plan's compatibility tuple, recorded where a test holds it.

**The dependency-licence guard says that FHIRPath is refused today**, and a
case holds it: `fhirpath` 5.2.1 and the `@lhncbc/ucum-lhc` 7.1.10 it brings
each declare a licence of their own that no allowed identifier names, so a
package that took FHIRPath for an `enableWhenExpression` or for template
extraction fails `verify` until the maintainer admits a version by a
reviewed exception.
