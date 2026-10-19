# 8. Cross-cutting concepts

Concepts that appear in more than one building block, and that a reader
needs in order to follow any of them.

## 8.1 Exact values

A FHIR number is a `FhirNumber`: its type and its text, made by
`decimal()`, `integer()`, `positiveInt()` or `unsignedInt()` from a string
or a bigint, never from a JavaScript number, and written by `writeJson` from
that text, unquoted. `readJson` makes every number it reads the same way, as
a decimal, since an element's type is not known without its definition
([0004](../decisions/0004-fhir-json-is-written-and-read-exactly-with-primitives-of-its-own.md)).

Where the input is a double, the output is exactly that double:

| Value | Written as | Record |
|---|---|---|
| A number answer formancy holds | the shortest text that reads back as that double, `-0` included; on an integer item, its BigInt, or refused when it is not whole or past 32 bits | [0007](../decisions/0007-a-formancy-submission-is-a-questionnaireresponse-of-the-same-mapping-refused-whole-where-an-answer-cannot-be-one.md) |
| A bound in a form | the same, since `@formancy/spec` types it a number | [0006](../decisions/0006-a-formancy-form-is-an-sdc-questionnaire-refused-whole-where-it-cannot-be-one.md) |
| A literal in a rule's CEL | its digits, and refused past fifteen significant digits, where CEL would compare the double nearest it and R4 the digits | [0006](../decisions/0006-a-formancy-form-is-an-sdc-questionnaire-refused-whole-where-it-cannot-be-one.md) |

Comparing is `compareNumbers`, by value and exactly, for reading what a
number means and never for writing one. Held by health-core's
[`exactness.test.ts`](../../packages/health-core/src/exactness.test.ts),
whose every value is one a double cannot hold, and by
[`scripts/exact-and-reproducible.test.mjs`](../../scripts/exact-and-reproducible.test.mjs),
which reads every published package's syntax tree for `Number` as a value,
`parseFloat`, `parseInt`, `JSON.parse`, the global `isNaN` and `isFinite`
and a unary plus. What it cannot see -- a conversion spelt as arithmetic or a
comparison -- the exactness corpus catches where it loses a digit, and
review where it loses none.

## 8.2 Refusals

Every package refuses with one class, health-core's `Refusal`: a `rule` a
host branches on, a `path` from the input's root (`form.model.fields[2].step`,
`context.entries[2].resource.subject`), a FHIR `type` for a primitive, an
`offset` for text, a `language` for a missing translation, and a message
made of those and fixed words. The rule keys are the contract; the words may
change ([`refusal.ts`](../../packages/health-core/src/refusal.ts)).

An export collects its refusals with `Refusals` and answers with all of
them or with the resource, never with both and never with a part
([0006](../decisions/0006-a-formancy-form-is-an-sdc-questionnaire-refused-whole-where-it-cannot-be-one.md),
[0008](../decisions/0008-a-document-is-a-bundle-of-what-it-refers-to-and-a-pdf-its-own-bytes-never-an-unproved-pdf-a.md)).
That is fail closed, upstream's rule for validation
([formancy.ai 0022](https://github.com/sharkysan/formancy.ai/blob/main/docs/decisions/0022-fail-open-fail-closed.md)),
applied to everything an export says.

A member a context does not name is a value the host meant to send, which
the resource would leave out without a word, so it is refused as
`unmapped`, at the object that holds it and without its name; and a hole
in a host's list -- which JSON never has, and `map` walks past -- is
refused at its index. Every package reads its context with health-core's
`known`, `objectAt` and `readItems`, so both are refused alike wherever a
host meets them ([0009](../decisions/0009-a-ch-orf-document-is-the-hosts-referral-in-ch-core-and-ch-orf-the-questionnaire-by-canonical-and-swiss-identifiers-checked-here.md)).

What is read before what is fixed, and it decides which refusals come
together. The host's context is checked first, and its refusals come first.
A form of a spec version the mapping does not read is then refused at
`form.specVersion` and nothing else of it is read, since nothing else about
it can be known; its only refusal stands beside the context's. A context
refused leaves every field unmapped, since an item's options, and a
condition on one, are named under the Questionnaire's url, which the host's
base makes: the form's version and formancy's validator are still read,
and the fields' refusals come once the context is right
([`questionnaire.ts`](../../packages/health-questionnaire/src/questionnaire.ts),
whose test holds both; [`response.ts`](../../packages/health-questionnaire/src/response.ts)
checks its context first the same way). A CH ORF document is refused for
health-ch's reasons first, and health-document is asked only of a context
health-ch accepted
([§6.4](06-runtime-view.md#64-a-referral-becomes-a-ch-orf-document)).

## 8.3 Health data stays in the output

Any value a refusal could quote may be a person's, so none does: the tests
of each export refuse synthetic values that a message would otherwise
carry, and find none of them in it
([`refusal.test.ts`](../../packages/health-core/src/refusal.test.ts),
[`questionnaire.test.ts`](../../packages/health-questionnaire/src/questionnaire.test.ts),
[`response.test.ts`](../../packages/health-questionnaire/src/response.test.ts),
[`bundle.test.ts`](../../packages/health-document/src/bundle.test.ts),
[`document-reference.test.ts`](../../packages/health-document/src/document-reference.test.ts),
health-ch's [`document.test.ts`](../../packages/health-ch/src/document.test.ts)).
A refusal of a GLN or an AHV number says what is wrong with its form or its
check digit, and never a digit. A submission's name its form does not have
is refused at the object that holds it, without the name
([0007](../decisions/0007-a-formancy-submission-is-a-questionnaireresponse-of-the-same-mapping-refused-whole-where-an-answer-cannot-be-one.md)).

No package logs: `console` is no name a published package compiles against
([§2](02-constraints.md#technical-constraints)). Fixtures and the corpus are
synthetic; that the corpus holds no real person's data is review's
([0008](../decisions/0008-a-document-is-a-bundle-of-what-it-refers-to-and-a-pdf-its-own-bytes-never-an-unproved-pdf-a.md)).
That its Swiss identifiers are nobody's is shown where it can be. No AHV
number in any file passes its check digit: none is reserved for tests, and
one that passes may be a person's, so a test that needs a valid one
computes it in memory. The corpus's GLNs are under GS1's prefix for
examples.
[`scripts/synthetic-identifiers.test.mjs`](../../scripts/synthetic-identifiers.test.mjs)
fails on an AHV number that passes its check in any file git holds or would
add, however its digits are separated, and on a corpus GLN under another
prefix that passes its check; a number a test computes, and a GLN written
outside the corpus, are review's ([0009](../decisions/0009-a-ch-orf-document-is-the-hosts-referral-in-ch-core-and-ch-orf-the-questionnaire-by-canonical-and-swiss-identifiers-checked-here.md)).
What leaks anyway, and is accepted: a path repeats the names of the text it
passed through, and text that is not FHIR JSON may use anything as a name
([0004](../decisions/0004-fhir-json-is-written-and-read-exactly-with-primitives-of-its-own.md));
so a refusal inside the host's answers to a CH ORF document, below their
own members, spells a name the host chose there ([0009](../decisions/0009-a-ch-orf-document-is-the-hosts-referral-in-ch-core-and-ch-orf-the-questionnaire-by-canonical-and-swiss-identifiers-checked-here.md)).

The demo is the one place a person types into anything of this
repository's, so it holds the same line from the other side
([0012](../decisions/0012-a-demo-at-formancy-ai-health-fills-a-synthetic-referral-in-the-browser-served-by-a-worker-of-its-own.md)).
Its sample is the corpus's, its people synthetic and its identifiers fixed,
and no field asks for one; the page says that a real patient's data does
not belong in it, and keeps and sends nothing of what is typed. Its
refusals on purpose say no digit of the identifiers they refuse
([`on-purpose.test.ts`](../../apps/demo/src/on-purpose.test.ts)), and an
error the page catches is said on the page and logged nowhere, since it
may quote what was typed. What a visitor pastes anyway is theirs, and the
browser's own services and extensions are beyond the page.

## 8.4 Untrusted input

Forms, answers, PDFs and the resources a host hands over are untrusted,
even when an administrator wrote them
([`CLAUDE.md`](../../CLAUDE.md#secrets-health-data-and-untrusted-input)).

- **Nothing a document carries runs.** A rule's CEL is read for the few
  shapes `enableWhen` can say, and never evaluated; no FHIRPath is written
  ([0006](../decisions/0006-a-formancy-form-is-an-sdc-questionnaire-refused-whole-where-it-cannot-be-one.md)).
- **Reading is bounded by the text, not by the stack.** `readJson` and
  `writeJson` walk with their own stack, so nesting costs memory and never
  throws a RangeError; a getter is refused unrun, and a proxy that throws is
  refused ([0004](../decisions/0004-fhir-json-is-written-and-read-exactly-with-primitives-of-its-own.md)).
- **What the host hands over is copied.** A PDF's bytes are copied once,
  by calling nothing they bring, so a Node Buffer the host reuses changes
  nothing attached; a document's entries are written and read back, so the
  Bundle shares nothing with the host's objects
  ([0008](../decisions/0008-a-document-is-a-bundle-of-what-it-refers-to-and-a-pdf-its-own-bytes-never-an-unproved-pdf-a.md)).
- **What is checked is what is carried.** health-ch copies the host's
  answers once, by health-core's writer and reader, and checks the copy,
  so an object that reads one way and copies another -- a getter, a Proxy
  -- cannot be checked as one response and carried as another ([0009](../decisions/0009-a-ch-orf-document-is-the-hosts-referral-in-ch-core-and-ch-orf-the-questionnaire-by-canonical-and-swiss-identifiers-checked-here.md)).
- **A host's text holds only what a resource can carry.** health-core's
  `text` refuses a control character but the tab and the line breaks, a
  surrogate alone, U+FFFE and U+FFFF, stricter than R4, which says only
  that a string SHOULD not hold them, by the one rule a narrative's text is
  held to too ([`characters.ts`](../../packages/health-core/src/characters.ts)).
  A narrative is made here, never taken from a host, its titles escaped,
  since a host's XHTML would need a reader of R4's allowed markup ([0009](../decisions/0009-a-ch-orf-document-is-the-hosts-referral-in-ch-core-and-ch-orf-the-questionnaire-by-canonical-and-swiss-identifiers-checked-here.md)).
- **What is not bounded**: a PDF's size, which nothing has measured a bound
  for ([0008](../decisions/0008-a-document-is-a-bundle-of-what-it-refers-to-and-a-pdf-its-own-bytes-never-an-unproved-pdf-a.md)),
  and the length of a text, which is the only bound on reading it.
- **The gate's downloads are untrusted too.** Each is refused unless its
  hash is the registered one, and a package's tarball is unpacked by a
  reader that writes regular files and directories under its destination
  and refuses everything else, held by
  [`tgz.test.mjs`](../../scripts/validator/tgz.test.mjs)
  ([0005](../decisions/0005-a-fhir-resource-is-proved-by-the-hl7-validator-against-pinned-guide-packages.md)).

## 8.5 Identity is the host's, and a name is never an address

A canonical base, a Questionnaire's version, a status, a subject, an
author, a document's identifier and timestamp, every `fullUrl`: the host's.
A reference is by name -- a resource type and an id, or a `urn:uuid:`
inside the Bundle -- and an absolute URL is refused, as `reference()` holds
([`references.ts`](../../packages/health-core/src/references.ts)). A
canonical and a system URI are identifiers, never fetched, as formancy names
a source and never an address
([formancy.ai 0077](https://github.com/sharkysan/formancy.ai/blob/main/docs/decisions/0077-options-may-come-from-a-named-source.md)).
What the host's word is not checked against: that the version it gives is
the one formancy published
([0006](../decisions/0006-a-formancy-form-is-an-sdc-questionnaire-refused-whole-where-it-cannot-be-one.md)).

**The Swiss identifiers are checked here**, since CH Core's constraints on
them are warnings, which the validator raises without an error. A GLN is
thirteen digits and GS1's check digit; an AHV number is 756, nine digits
and GS1's check digit, without points, its printed form refused rather
than read. Each is refused as `identifier` or `check-digit`, naming no
digit. A GLN that does not start 76 is a GLN all the same, and kept. A
host's own identifier may stand under none of CH Core's Swiss systems, in
any case, so that one checked here by its name cannot pass unchecked under
its system ([`identifiers.ts`](../../packages/health-ch/src/identifiers.ts),
[0009](../decisions/0009-a-ch-orf-document-is-the-hosts-referral-in-ch-core-and-ch-orf-the-questionnaire-by-canonical-and-swiss-identifiers-checked-here.md)).
Neither is looked up: whether a number is the person's it is given for is
the host's to know.

## 8.6 The same input, the same bytes

No published package's source reads a clock or a random source -- `Date`,
`performance`, `crypto`, `Math.random`, `Temporal.Now` -- which
[`scripts/exact-and-reproducible.test.mjs`](../../scripts/exact-and-reproducible.test.mjs)
refuses by name. `writeJson` writes names in the order an object gives
them, never sorted, with no whitespace. A document is the same bytes
whatever order its context names things in, and the corpus's PDF renders to
the same bytes twice, with its creation date fixed; and a CH ORF document
is the host's values alone, no identifier, name or instant made here
([0004](../decisions/0004-fhir-json-is-written-and-read-exactly-with-primitives-of-its-own.md),
[0008](../decisions/0008-a-document-is-a-bundle-of-what-it-refers-to-and-a-pdf-its-own-bytes-never-an-unproved-pdf-a.md),
[0009](../decisions/0009-a-ch-orf-document-is-the-hosts-referral-in-ch-core-and-ch-orf-the-questionnaire-by-canonical-and-swiss-identifiers-checked-here.md)).
The gate is the same on every machine: the same JAR, the same packages,
`-locale en-US -jurisdiction uv`, no terminology server
([0005](../decisions/0005-a-fhir-resource-is-proved-by-the-hl7-validator-against-pinned-guide-packages.md)).

## 8.7 No network

No package fetches a guide package, calls a terminology server,
dereferences a canonical or sends a Bundle. `fetch` is no name a published
package compiles against ([§2](02-constraints.md#technical-constraints)),
which is what holds it, beside review of a global reached some other way.
The gate's validator runs with no HTTP at all; a package it would have
fetched stops it
([0005](../decisions/0005-a-fhir-resource-is-proved-by-the-hl7-validator-against-pinned-guide-packages.md)).

The demo's page sends what a visitor types nowhere ([0012](../decisions/0012-a-demo-at-formancy-ai-health-fills-a-synthetic-referral-in-the-browser-served-by-a-worker-of-its-own.md)). The policy it is
served under allows it no connection and no form action, scripts,
styles and faces from the build's assets at its own address alone -- not
from the rest of its origin, where Cloudflare serves the scripts it
injects -- and no string to become markup or code, by Trusted Types
([`demo-headers.mjs`](../../scripts/demo-headers.mjs)), and it asks for
every face its stylesheets declare as it starts
([`faces.ts`](../../apps/demo/src/faces.ts)): a browser asks for a face
split by `unicode-range` when text in its range is first drawn, so a face
asked for later would tell the server what kind of text was typed. Its
browser gate watches the page, served under those headers, ask for nothing
once it has settled, whatever it is given to type, and the policy refuse
a string handed to `innerHTML` and a fetch planted in it, and an inline
script and a `/cdn-cgi/` script injected into its HTML as it is served
([`gate-privacy.mjs`](../../apps/demo/scripts/gate-privacy.mjs)).

## 8.8 Licences, marks and terminology

- **The product's own.** Every package declares `SEE LICENSE IN LICENSE.md`
  and carries `LICENSE.md` and `NOTICE`
  ([0001](../decisions/0001-a-paid-module-in-its-own-repository.md);
  [`scripts/verify-licenses.mjs`](../../scripts/verify-licenses.mjs)). The
  README's licence sentence is generated from `LICENSE.md` by
  [`scripts/licence-status.mjs`](../../scripts/licence-status.mjs).
  "Source-available" is the word; that nothing calls it open source is
  review's.
- **What it depends on.** A published package's production dependencies
  under a permissive licence only, read from what is installed, as
  [formancy.ai-report 0006](https://github.com/sharkysan/formancy.ai-report/blob/main/docs/decisions/0006-dependencies-and-fonts-allow-public-source-and-licensed-production.md)
  holds it there ([`scripts/dependency-licences.mjs`](../../scripts/dependency-licences.mjs)).
  FHIRPath's engine is refused by it today. A guide package is no
  package's dependency; its register records the licence its own manifest
  states ([0005](../decisions/0005-a-fhir-resource-is-proved-by-the-hl7-validator-against-pinned-guide-packages.md)),
  and a licence the policy refuses is admitted only by a decision, for one
  entry at its exact version: 0009 admits CC-BY-4.0 for IHE's formatCode
  package, which CH Core needs and the gate only downloads
  (`ADMITTED_LICENCES` in
  [`registers.mjs`](../../scripts/validator/registers.mjs), [0009](../decisions/0009-a-ch-orf-document-is-the-hosts-referral-in-ch-core-and-ch-orf-the-questionnaire-by-canonical-and-swiss-identifiers-checked-here.md)).
- **HL7's marks.** FHIR names the standard and nothing of the product's;
  `NOTICE`, the README and every published package's README, the page npm
  shows of it, carry HL7's notice for use without permission, word for
  word; and no file claims HL7's permission
  ([0003](../decisions/0003-the-product-name-carries-no-hl7-mark.md),
  [0009](../decisions/0009-a-ch-orf-document-is-the-hosts-referral-in-ch-core-and-ch-orf-the-questionnaire-by-canonical-and-swiss-identifiers-checked-here.md);
  [`scripts/trademark.test.mjs`](../../scripts/trademark.test.mjs)). A
  conformance claim names the guide, the validator and the corpus, and never
  HL7's endorsement.
- **Terminology.** health-ch writes LOINC's 93037-0, which CH ORF fixes,
  with its LOINC long common name, and `NOTICE` and health-ch's README
  carry LOINC's notice, as its licence asks of software that carries
  LOINC content; it writes no SNOMED CT code ([0009](../decisions/0009-a-ch-orf-document-is-the-hosts-referral-in-ch-core-and-ch-orf-the-questionnaire-by-canonical-and-swiss-identifiers-checked-here.md)).
  [`scripts/terminology.test.mjs`](../../scripts/terminology.test.mjs)
  derives every Coding of the corpus and fails on a system no register of
  its terms admits: HL7's own, LOINC with each code recorded and written
  with its recorded name while `NOTICE` carries the notice, SNOMED CT with
  each code recorded in a decision, which none is, and a host's under a
  domain reserved for examples. A code no corpus resource holds is
  review's.
- **The demo's page.** It carries HL7's and LOINC's notices word for word,
  from [`scripts/notices.mjs`](../../scripts/notices.mjs), the one text of
  each the guards hold `NOTICE` and the READMEs to; names the HL7® FHIR®
  standard in full where it first names it, in every language; and takes
  no mark into its Worker's name, its routes or its title, which
  `scripts/trademark.test.mjs` reads
  ([0012](../decisions/0012-a-demo-at-formancy-ai-health-fills-a-synthetic-referral-in-the-browser-served-by-a-worker-of-its-own.md)).
  What it bundles is held to the policy the dependency-licence guard
  holds the published packages to, by the build itself:
  [`third-party-notices.mjs`](../../scripts/third-party-notices.mjs)
  writes `THIRD-PARTY-NOTICES.txt` beside the page, which its foot links,
  with every licence and notice file of every package the bundle holds --
  on 18 October 2026 React, react-dom and scheduler, the CEL interpreter,
  ajv and uqr under MIT, formancy's core, expressions, React renderer,
  spec and themes under Apache-2.0 with their NOTICE, and the two IBM
  Plex faces under OFL-1.1 -- and stops the build on a package with no
  licence text or under a licence the policy refuses, Formancy Report's
  among them
  ([formancy.ai-data 0046](https://github.com/sharkysan/formancy.ai-data/blob/main/docs/decisions/0046-a-built-app-carries-the-licence-and-notice-texts-of-everything-it-bundles.md)).
  What Vite folds into the bundle as text it cannot see
  ([§11](11-risks-and-debt.md#113-known-debt)).

## 8.9 Languages

A Questionnaire's texts are the form's default language's, with R4's
`translation` extension for each language the host asks for, and a text
missing in one of them refuses the export rather than show a reader one
question in another language. Every language is a BCP 47 tag in its
canonical case, `de-CH` and never `de-ch`, because the HL7 FHIR validator
refuses the second as a resource's language; whether a subtag is registered
is not checked ([0006](../decisions/0006-a-formancy-form-is-an-sdc-questionnaire-refused-whole-where-it-cannot-be-one.md)).
The form's title is untranslated, since `@formancy/spec` holds it as one
string. A refusal's words are English and may change; its rule, which a
host branches on, is the part to say in another language.

The demo speaks de-CH, fr, it and en, opening in the first the browser
prefers, and its form's Questionnaire carries the same four. The packages'
refusals stay in English there, as they state them, and so do HL7's and
LOINC's notices and CLAUDE.md's sentence of what the product is not, each
marked `lang="en"`. The page gives formancy's renderer the submit
control's word in every language, and, since formancy 0.6.0 ships no
Italian words, as 0.5.0 shipped none, the required hint too in Italian;
under a field the renderer shows its error's code, such
as `required`, in every language, which is upstream's to word. The
page's French and Italian were translated, and no native reader has read
them yet
([0012](../decisions/0012-a-demo-at-formancy-ai-health-fills-a-synthetic-referral-in-the-browser-served-by-a-worker-of-its-own.md)).

## 8.10 The user interface, and accessibility

The packages have none: version 1 has no page of theirs
([`CLAUDE.md`](../../CLAUDE.md#the-demo-is-the-one-page)). What reaches a person
is a Questionnaire some other renderer draws, from its items' texts and
translations; widgets, layouts and the screens of a paged form are not
carried, so how it is laid out, and how accessible that is, is the
renderer's ([0006](../decisions/0006-a-formancy-form-is-an-sdc-questionnaire-refused-whole-where-it-cannot-be-one.md)).

The demo is a page, beside the packages and never published, and
formancy.ai's concept applied as a formancy release ships it: the room,
`@formancy/themes/room.css`, imported after its workbench, a dark
ground and glass panels, violet for what a person acts on and teal for
what the system did, Archivo for the headings, and the form in Blueprint
on Blueprint's own paper, as formancy.ai's admin previews one
([0012](../decisions/0012-a-demo-at-formancy-ai-health-fills-a-synthetic-referral-in-the-browser-served-by-a-worker-of-its-own.md), [0015](../decisions/0015-the-demo-wears-formancy-ais-room-imported-from-formancy-0-6-0-and-the-packages-read-forms-through-the-same-release.md)).
Its own stylesheet states no colour: every one is a variable a theme it
wears declares, read where the theme declares it, and its script writes
no style. It arrived with the gates that hold it: its jsdom suite,
with axe and every
control's name, and its browser gate in Chromium, Firefox and WebKit,
which measures what jsdom cannot -- the room, every variable
`@formancy/themes/room.css` sets as the browser computes it, reflow down
to 320 pixels, contrast,
target size, the keyboard's path through the form and where each control
it presses leaves it -- in each of the page's languages, every check in
every browser, what they disagree on named and held, never skipped
([`browser-test.mjs`](../../apps/demo/scripts/browser-test.mjs), [0014](../decisions/0014-the-demos-browser-gate-runs-in-chromium-firefox-and-webkit-and-each-fact-the-browsers-disagree-on-is-named-and-held.md)). A
screen reader and a person's eye on the layout are review's.

The demo draws no Questionnaire: it reads its own out, as headings,
named lists and description lists, from the resource's bytes, each text
in the page's language or marked with the language it stands in, and each
item a button to its field, which moves the keyboard and writes nothing in
the address. A way is offered only where formancy's renderer draws the
field with the id its engine mints, never guessed at
([0013](../decisions/0013-the-demo-reads-its-questionnaire-out-from-the-bytes-it-shows-and-renders-no-questionnaire.md)).

## 8.11 No clinical logic

No template, fixture or generated item computes a score, raises a warning or
suggests a therapy: no calculated item and no FHIRPath is written
([0006](../decisions/0006-a-formancy-form-is-an-sdc-questionnaire-refused-whole-where-it-cannot-be-one.md)),
and the corpus's letter says it means nothing. That nothing does is
review's; a customer's form is the customer's, and so is the duty of a
product that computes a clinical result from one. The README's
[intended purpose](../../README.md#intended-purpose) says so, with
CLAUDE.md's sentence that the product is not intended as a medical device,
which [`readme.test.mjs`](../../scripts/readme.test.mjs) holds word for
word in both; no lawyer has read the words yet
([0011](../decisions/0011-a-release-report-is-derived-from-the-run-that-gated-it.md)).
