# 5. Building blocks

## Level 1 — the layers

Dependencies point downward only. Every package below the line marked
*private* is published, and none of them has a framework, Node or the
network ([§2](02-constraints.md#technical-constraints)).

```
    apps/demo                      private, never published: the demo at
                                   formancy.ai/health/, the packages run on
                                   the corpus's synthetic referral in a
                                   browser
    health-corpus                  private test support, never published:
                                   the referral letter Report renders, and
                                   the documents the validator gate judges
─────────────────────────────────────────────────────────── private ──
L2  health-ch                      a referral → a CH ORF document: its
                                   people and orders in CH Core, the
                                   answers, the Swiss identifiers checked
─────────────────────────────────────────────────────────────────────
L1  health-questionnaire           health-document
    a form → Questionnaire         a PDF → DocumentReference, Binary
    its answers → Response         resources → a document Bundle,
                                   its Composition's narrative
─────────────────────────────────────────────────────────────────────
L0  health-core                    primitives · FHIR JSON · Refusal ·
                                   base64Binary · references by name ·
                                   the readers of a host's context ·
                                   XHTML text

    beside them, depended on by no package:
    scripts/validator.mjs, scripts/validator/    the validator gate
    docs/release/                                the registers it runs on,
                                                 and the release report's
    scripts/install-test.mjs                     the install gate
    docs/getting-started.md                      the guide it compiles and runs
    scripts/release-report/                      the release report
    apps/demo/scripts/, scripts/browsers.mjs     the demo's browser gate
```

| Package | Published | May import | Record |
|---|---|---|---|
| `@formancy/health-core` | yes | nothing, in production | [0004](../decisions/0004-fhir-json-is-written-and-read-exactly-with-primitives-of-its-own.md), [0008](../decisions/0008-a-document-is-a-bundle-of-what-it-refers-to-and-a-pdf-its-own-bytes-never-an-unproved-pdf-a.md) |
| `@formancy/health-questionnaire` | yes | health-core, and `@formancy/spec` at exactly the release it reads forms through | [0006](../decisions/0006-a-formancy-form-is-an-sdc-questionnaire-refused-whole-where-it-cannot-be-one.md), [0007](../decisions/0007-a-formancy-submission-is-a-questionnaireresponse-of-the-same-mapping-refused-whole-where-an-answer-cannot-be-one.md) |
| `@formancy/health-document` | yes | health-core alone, and no renderer: the PDF is the host's | [0008](../decisions/0008-a-document-is-a-bundle-of-what-it-refers-to-and-a-pdf-its-own-bytes-never-an-unproved-pdf-a.md) |
| `@formancy/health-ch` | yes | health-core, health-document and health-questionnaire; `@formancy/spec` only as a devDependency, for the forms its tests answer | [0009](../decisions/0009-a-ch-orf-document-is-the-hosts-referral-in-ch-core-and-ch-orf-the-questionnaire-by-canonical-and-swiss-identifiers-checked-here.md) |
| `@formancy/health-corpus` | no, private | health-core, health-document, and Formancy Report's `report-spec`, `report-runtime` and `report-render-pdf`, each at the exact release the README's [table](../../README.md#what-it-is-built-and-judged-against) names: the only place Report is a dependency | [0008](../decisions/0008-a-document-is-a-bundle-of-what-it-refers-to-and-a-pdf-its-own-bytes-never-an-unproved-pdf-a.md), [0002](../decisions/0002-depend-on-upstream-never-copy-it.md) |
| `@formancy/health-demo` | no, private, served at formancy.ai/health/ | health-core, health-questionnaire, health-document and health-ch; formancy's `@formancy/core`, `@formancy/react`, `@formancy/spec` and `@formancy/themes`, each at the exact release its manifest pins, its stylesheets imported and none copied; React, and the faces from Fontsource; at build, health-corpus, whose letter the build renders and whose `@formancy/health-corpus/documents` the page bundles. Never Formancy Report in the page | [0012](../decisions/0012-a-demo-at-formancy-ai-health-fills-a-synthetic-referral-in-the-browser-served-by-a-worker-of-its-own.md), [0002](../decisions/0002-depend-on-upstream-never-copy-it.md), [0008](../decisions/0008-a-document-is-a-bundle-of-what-it-refers-to-and-a-pdf-its-own-bytes-never-an-unproved-pdf-a.md) |

The *May import* column restates the records and the package path in
[`CLAUDE.md`](../../CLAUDE.md#how-the-pieces-fit), and nothing compares
them, so a change to one is made to the others in the same pull request,
and review holds that. That every package is named here, and every module
and script named as code is a file git would commit, the architecture's
guard holds ([0010](../decisions/0010-the-architecture-is-documented-in-arc42s-sections-held-to-the-repository-by-a-guard.md)).

**One app, the demo.** `apps/demo` is a page, not the product
([0012](../decisions/0012-a-demo-at-formancy-ai-health-fills-a-synthetic-referral-in-the-browser-served-by-a-worker-of-its-own.md)): the
corpus's synthetic referral filled with formancy's React renderer, and
what the packages make of it, in the visitor's browser. Its colours are
`@formancy/themes`' as the release its manifest pins ships them, the
workbench and Blueprint at 0.5.0, imported, and its own stylesheet states
none and declares no variable
([0002](../decisions/0002-depend-on-upstream-never-copy-it.md)); its build
holds the resources it shows first to the validator gate's corpus, byte
for byte, and carries the letter only as the bytes
[`docs/release/letter.json`](../release/letter.json) registers. It asks
for every face its stylesheets declare as it starts
([`faces.ts`](../../apps/demo/src/faces.ts)), so that nothing shown or
typed later asks the server for one, and what jsdom cannot see of it its
browser gate measures in Chromium
([`browser-test.mjs`](../../apps/demo/scripts/browser-test.mjs),
[§10](10-verification.md#102-the-gates)). The packages still have no page
and no network.

The packages the plan proposes next, each depending only on those before
it, are in [`CLAUDE.md`](../../CLAUDE.md#how-the-pieces-fit); each arrives
with the record that says what it may import.

### What holds the layers

- **A package resolves only what its manifest declares.**
  [`.npmrc`](../../.npmrc) sets `node-linker=isolated`, so an import of a
  package the manifest does not name is a compile error in
  `pnpm typecheck`. Watched on 17 October 2026, each of these imports
  planted and refused:
  - `@formancy/spec` in health-document;
  - health-questionnaire in health-core;
  - Report's renderer in health-core;
  - Report's renderer in health-questionnaire.
- **Nothing from `node_modules` is inlined.** Each package's
  [`tsdown.config.ts`](../../packages/health-ch/tsdown.config.ts) bundles
  no package, so tsdown refuses one the manifest does not declare as a
  production or peer dependency, and `pnpm build` fails: a devDependency,
  such as health-ch's `@formancy/spec`, cannot reach a published package's
  code. Watched on 17 October 2026, a re-export of one of
  `@formancy/spec`'s values planted in health-ch's index, refused, and the
  file put back.
- **What a manifest may declare.** An upstream `@formancy/*` package only
  at an exact released version
  ([`scripts/upstream-deps.mjs`](../../scripts/upstream-deps.mjs),
  [0002](../decisions/0002-depend-on-upstream-never-copy-it.md)); in a
  published package, nothing whose licence is not permissive, which refuses
  Report's and Data's source-available packages there
  ([`scripts/dependency-licences.mjs`](../../scripts/dependency-licences.mjs)).
- **No Node, no DOM.** The published packages compile without
  `@types/node` and against the ECMAScript library alone, as
  [formancy.ai 0008](https://github.com/sharkysan/formancy.ai/blob/main/docs/decisions/0008-layered-packages.md)
  holds its core packages; [§2](02-constraints.md#technical-constraints)
  says what was planted to watch it.
- **What nothing holds.** That health-core takes no sibling,
  health-document no health-questionnaire, and neither of them health-ch,
  is the manifests' and review's:
  the licence guard walks through a sibling as this repository's own, so a
  manifest that added one, or a third-party package under a permissive
  licence that no record admits, would fail no gate.

## Level 2 — inside each package

### `@formancy/health-core` (L0)

The primitives every resource is made of, FHIR JSON, and the readers
every package reads a host's context with. No production dependency
([0004](../decisions/0004-fhir-json-is-written-and-read-exactly-with-primitives-of-its-own.md),
[0009](../decisions/0009-a-ch-orf-document-is-the-hosts-referral-in-ch-core-and-ch-orf-the-questionnaire-by-canonical-and-swiss-identifiers-checked-here.md)).

| Module | Responsibility |
|---|---|
| [`version.ts`](../../packages/health-core/src/version.ts) | `FHIR_VERSION`, the release every resource is written for, typed as its literal; independent of the npm version |
| [`numbers.ts`](../../packages/health-core/src/numbers.ts) | decimal, integer, positiveInt and unsignedInt as a `FhirNumber`: the text, checked once, told apart by a private field; a JavaScript number refused. `compareNumbers`, by value and exactly, for reading what a number means and never for writing one |
| [`strings.ts`](../../packages/health-core/src/strings.ts) | date, dateTime, instant, time, id, code, uri, uuid and `language` as checked strings, branded with their type; nothing completed or normalised |
| [`base64.ts`](../../packages/health-core/src/base64.ts) | base64Binary in RFC 4648's one canonical spelling, written, checked and read back, character by character ([0008](../decisions/0008-a-document-is-a-bundle-of-what-it-refers-to-and-a-pdf-its-own-bytes-never-an-unproved-pdf-a.md)) |
| [`references.ts`](../../packages/health-core/src/references.ts) | `reference()`: a resource type and an id, or a `urn:uuid:`, of the types R4 allows where it stands; an address refused |
| [`host.ts`](../../packages/health-core/src/host.ts) | The readers of a host's context, moved here from health-document so that every package refuses alike ([0009](../decisions/0009-a-ch-orf-document-is-the-hosts-referral-in-ch-core-and-ch-orf-the-questionnaire-by-canonical-and-swiss-identifiers-checked-here.md)): `valueAt`, a value the object holds as its own; `needed` and `optional`, a value a primitive makes, or `absent`, a null handed to the primitive; `text`, a string with something but whitespace in it and nothing a resource cannot carry; `codeOf`, a code of a required binding; `known` and `objectAt`, an object read for the members its context names, one more refused as `unmapped` without its name; `readItems`, a list read at every index, a hole's too |
| [`characters.ts`](../../packages/health-core/src/characters.ts) | Which characters a resource can carry, XML 1.0's: no control character but the tab and the line breaks, no surrogate alone, no U+FFFE or U+FFFF. `text` and `xhtmlText` hold this one rule |
| [`xhtml.ts`](../../packages/health-core/src/xhtml.ts) | `xhtmlText`: a text as XHTML element content, `&`, `<` and `>` escaped and nothing else changed, refused where XML cannot carry it; no XHTML is read |
| [`json.ts`](../../packages/health-core/src/json.ts), [`json-write.ts`](../../packages/health-core/src/json-write.ts), [`json-read.ts`](../../packages/health-core/src/json-read.ts) | FHIR JSON as values and the path writers `member` and `item`; `writeJson`, names in the order given and no whitespace; `readJson`, a parser of its own with its own stack, every number kept as its text |
| [`refusal.ts`](../../packages/health-core/src/refusal.ts), [`refusals.ts`](../../packages/health-core/src/refusals.ts) | `Refusal`, the one error every package refuses with -- a rule, a path, and never a value -- and `Refusals`, which collects one export's, so that each answers with all of them or with the resource |

### `@formancy/health-questionnaire` (L1)

A formancy form as an SDC Questionnaire, and a submission of it as a
QuestionnaireResponse, both from one mapping
([0006](../decisions/0006-a-formancy-form-is-an-sdc-questionnaire-refused-whole-where-it-cannot-be-one.md),
[0007](../decisions/0007-a-formancy-submission-is-a-questionnaireresponse-of-the-same-mapping-refused-whole-where-an-answer-cannot-be-one.md)).
The form is read through `@formancy/spec`'s own validator, never its engine,
which is no dependency.

| Module | Responsibility |
|---|---|
| [`questionnaire.ts`](../../packages/health-questionnaire/src/questionnaire.ts) | `toQuestionnaire`, and `mapForm`, the mapping both exports walk: the spec version first, then formancy's `validateSchema`, then every field, rule and text |
| [`items.ts`](../../packages/health-questionnaire/src/items.ts), [`item-types.ts`](../../packages/health-questionnaire/src/item-types.ts), [`options.ts`](../../packages/health-questionnaire/src/options.ts), [`values.ts`](../../packages/health-questionnaire/src/values.ts) | One item per field, its key the linkId; which item type each field type becomes, decided in one table that the conditions read too; options as codings of a code system under the Questionnaire's url; a formancy value as the FHIR value of its item's type, decided once for a bound, a condition's literal and an answer |
| [`places.ts`](../../packages/health-questionnaire/src/places.ts) | Where each field stands: its path in the form, its data path -- formancy's identity of an answer, which a page does not scope -- the page it is on, and what holds it |
| [`rules.ts`](../../packages/health-questionnaire/src/rules.ts), [`cel.ts`](../../packages/health-questionnaire/src/cel.ts), [`conditions.ts`](../../packages/health-questionnaire/src/conditions.ts) | The few rules that are simple comparisons, read from their CEL without evaluating it: a visible rule as `enableWhen`, a skip rule as its page's, negated, a computed field read-only; every other rule refused |
| [`texts.ts`](../../packages/health-questionnaire/src/texts.ts) | The default language's texts, and a `translation` for each language the host asks for; one missing is refused |
| [`response.ts`](../../packages/health-questionnaire/src/response.ts), [`answers.ts`](../../packages/health-questionnaire/src/answers.ts), [`enablement.ts`](../../packages/health-questionnaire/src/enablement.ts) | `toQuestionnaireResponse`, walked from `mapForm`'s items in their order; each value as its item's answers; whether an item is enabled, read as the HL7 FHIR validator reads `enableWhen` |
| [`context.ts`](../../packages/health-questionnaire/src/context.ts), [`response-context.ts`](../../packages/health-questionnaire/src/response-context.ts) | What the host supplies, checked, a member neither names refused; `ResponseContext.profiles`, the host's claims, written after SDC's in the one place a response's meta is written ([0009](../decisions/0009-a-ch-orf-document-is-the-hosts-referral-in-ch-core-and-ch-orf-the-questionnaire-by-canonical-and-swiss-identifiers-checked-here.md)) |
| [`resource.ts`](../../packages/health-questionnaire/src/resource.ts), [`response-resource.ts`](../../packages/health-questionnaire/src/response-resource.ts), [`refusals.ts`](../../packages/health-questionnaire/src/refusals.ts) | The resources written, typed with health-core's primitives; where a refusal of a form's export points |

### `@formancy/health-document` (L1)

A PDF by its own bytes, and a document Bundle of what its Composition
refers to, every reference resolved
([0008](../decisions/0008-a-document-is-a-bundle-of-what-it-refers-to-and-a-pdf-its-own-bytes-never-an-unproved-pdf-a.md));
the Composition's narrative, and the profiles the host names for the
Bundle and the Composition to claim ([0009](../decisions/0009-a-ch-orf-document-is-the-hosts-referral-in-ch-core-and-ch-orf-the-questionnaire-by-canonical-and-swiss-identifiers-checked-here.md)).

| Module | Responsibility |
|---|---|
| [`pdf.ts`](../../packages/health-document/src/pdf.ts) | The bytes and the profile the host declares; `PROVED_PDF_PROFILES`, what is attached; a plain PDF by its first and last lines, PDF/A refused as unproved |
| [`sha1.ts`](../../packages/health-document/src/sha1.ts) | SHA-1 for an attachment's hash, as FIPS 180-4 gives it, because nothing this package may use computes it: Node's is Node's, and the platform's is asynchronous and reached through `crypto`, which the exactness guard refuses |
| [`document-reference.ts`](../../packages/health-document/src/document-reference.ts) | `toDocumentReference`: the bytes copied once, by calling nothing they bring, and written in the attachment or in a Binary it names |
| [`bundle.ts`](../../packages/health-document/src/bundle.ts), [`composition.ts`](../../packages/health-document/src/composition.ts), [`entries.ts`](../../packages/health-document/src/entries.ts) | `toDocumentBundle`, the Bundle claiming `DocumentContext.profile` where the host names one; the Composition from what the host says, claiming `CompositionContext.profile`, with its narrative, `generated`, of its title and its sections' titles as headings, escaped by health-core's `xhtmlText` and never taken from a host; the host's entries, each written and read back by health-core, so the Bundle shares nothing with the host's objects |
| [`links.ts`](../../packages/health-document/src/links.ts), [`targets.ts`](../../packages/health-document/src/targets.ts) | Every reference in a resource, at any depth; the types R4 allows each element to name, in one table |
| [`attachments.ts`](../../packages/health-document/src/attachments.ts) | Each attachment held to the bytes it carries or names: size, hash, media type |
| [`context.ts`](../../packages/health-document/src/context.ts), [`resource.ts`](../../packages/health-document/src/resource.ts) | The datatypes this package reads of a host's context -- a coding, a reference, an identifier -- with health-core's readers; the resources written, typed with health-core's primitives, `Narrative` and `Claims` among them |

### `@formancy/health-ch` (L2)

Switzerland: a CH ORF document of the host's referral, its patient, author
and orders in CH Core's profiles and the answers health-questionnaire
wrote, the Questionnaire named by its versioned canonical and not carried,
assembled by health-document; nothing is sent ([0009](../decisions/0009-a-ch-orf-document-is-the-hosts-referral-in-ch-core-and-ch-orf-the-questionnaire-by-canonical-and-swiss-identifiers-checked-here.md)). It writes only what
CH Core and CH ORF add -- the people, the orders, the identifiers, the
claims -- and decides nothing of a Composition again
([§4](04-solution-strategy.md#6-a-country-is-a-package-on-the-generic-ones)).

| Module | Responsibility |
|---|---|
| [`document.ts`](../../packages/health-ch/src/document.ts) | `toChOrfDocument`: health-ch's own reading of the context first, every refusal at once, then health-document asked to assemble what passed; health-document's refusals of the host's values given at the host's paths, and one of anything health-ch wrote thrown as a bug; the entries in the order of CH ORF's own example ([§6.4](06-runtime-view.md#64-a-referral-becomes-a-ch-orf-document)) |
| [`context.ts`](../../packages/health-ch/src/context.ts) | What the host says of a referral, each object read for the members it names: the Composition's values, the patient, the author with their practitioner and organisation, the orders, the answers; R4's codes for an order, and the genders CH Core takes |
| [`people.ts`](../../packages/health-ch/src/people.ts) | The Patient, Practitioner, Organization and PractitionerRole as CH Core profiles them, ch-pat-1's and ch-pat-2's warnings and ch-pract-1's error held as refusals |
| [`service-request.ts`](../../packages/health-ch/src/service-request.ts) | Each order as CH ORF's ServiceRequest: the placer's number typed PLAC, R4's status, intent and priority, the patient, the author's role as requester |
| [`response.ts`](../../packages/health-ch/src/response.ts) | The host's answers, copied once by health-core's writer and reader and held as copied: CH ORF's claim, the patient as subject, an author and a source among the document's entries, the Questionnaire by a versioned canonical, and no member toQuestionnaireResponse does not write |
| [`identifiers.ts`](../../packages/health-ch/src/identifiers.ts) | `gln()` and `ahvn13()`: a GLN's thirteen digits and GS1's check digit; an AHV number's 756, nine digits and GS1's check digit, without points; a host's own identifier under none of CH Core's Swiss systems, `CH_SYSTEMS`, in any case ([§8.5](08-crosscutting-concepts.md#85-identity-is-the-hosts-and-a-name-is-never-an-address)) |
| [`profiles.ts`](../../packages/health-ch/src/profiles.ts) | The releases of CH ORF and CH Core the document is written for; the profile each resource claims, with its guide's version but for the Bundle's, unversioned as CH ORF's Submit Bundle asks; and the codes those profiles fix, LOINC 93037-0 with its long common name |
| [`resource.ts`](../../packages/health-ch/src/resource.ts) | The resources written, typed with health-core's primitives; the Composition and the Bundle are health-document's, the response health-questionnaire's |
| [`test-support.ts`](../../packages/health-ch/src/test-support.ts) | The tests' synthetic host: local numbers under ITU-T's example arc, GLNs under GS1's prefix for examples, no AHV number that passes its check, and HL7's own codes |

### `@formancy/health-corpus` (private)

Test support, never published
([0008](../decisions/0008-a-document-is-a-bundle-of-what-it-refers-to-and-a-pdf-its-own-bytes-never-an-unproved-pdf-a.md)).
The guards that read every package walk it -- the trademark, size, test
matrix and codecov guards -- and those that read only what is published do
not: the exactness guard, the licence checks and the install gate.

| Module | Responsibility |
|---|---|
| [`referral.ts`](../../packages/health-corpus/src/referral.ts) | A synthetic referral letter in Swiss German, as a Formancy Report definition and its data; nothing in it computes, scores or suggests |
| [`pdf.ts`](../../packages/health-corpus/src/pdf.ts) | `renderReferral()`: the letter resolved and drawn by Report's released packages, its creation date fixed, so the same bytes each time |
| [`documents.ts`](../../packages/health-corpus/src/documents.ts) | What a synthetic host says of the letter, and the DocumentReferences and documents health-document makes of it; an entry of its own as well, `@formancy/health-corpus/documents`, without the letter's renderer, which the demo bundles: the module the index re-exports, reaching health-core and health-document alone, as built, which [`corpus-documents.test.mjs`](../../scripts/corpus-documents.test.mjs) holds |

### `@formancy/health-demo` (private, the demo)

A page, never packed
([0012](../decisions/0012-a-demo-at-formancy-ai-health-fills-a-synthetic-referral-in-the-browser-served-by-a-worker-of-its-own.md)).
The guards that read every workspace package walk it -- the trademark,
size, test matrix and codecov guards -- and those that read only what is
published do not: the exactness guard, the licence checks and the install
gate. Its own suite and its browser gate hold it instead.

| Module | Responsibility |
|---|---|
| [`src/build/plugin.ts`](../../apps/demo/src/build/plugin.ts) | The build's three modules, read in Node: the corpus's demo referral, the letter's PDF taken through `registeredLetter`, and the facts the page states -- the registers' releases, the notices, CLAUDE.md's sentence -- after holding the page's first resources to the corpus's entries, byte for byte, or stopping the build |
| [`src/exports.ts`](../../apps/demo/src/exports.ts), [`on-purpose.ts`](../../apps/demo/src/on-purpose.ts) | The one place the page calls the packages, the same in the build: what the sample and the answers make, every resource written by `writeJson`, and the fixed inputs each refused for one thing |
| [`src/engine.ts`](../../apps/demo/src/engine.ts) | formancy's engine for the form, with a capability source of constants, and formancy's words the page gives its renderer |
| [`src/demo.tsx`](../../apps/demo/src/demo.tsx), [`form-step.tsx`](../../apps/demo/src/form-step.tsx), [`resource.tsx`](../../apps/demo/src/resource.tsx), [`letter-step.tsx`](../../apps/demo/src/letter-step.tsx), [`refused-step.tsx`](../../apps/demo/src/refused-step.tsx), [`notices.tsx`](../../apps/demo/src/notices.tsx) | The page: the form beside the resources, each with its maker and its corpus file, the letter, the refusals, and what the page says of itself; the answers live in the engine for as long as the page is open |
| [`src/download.tsx`](../../apps/demo/src/download.tsx), [`pretty.ts`](../../apps/demo/src/pretty.ts) | A download of bytes the page holds, from a Blob, revoked when they change; the JSON laid out for reading, the bytes downloaded as `writeJson` wrote them |
| [`src/faces.ts`](../../apps/demo/src/faces.ts), [`styles/fonts.css`](../../apps/demo/src/styles/fonts.css), [`styles/demo.css`](../../apps/demo/src/styles/demo.css) | Every face asked for as the page starts; the faces from the build; the layout, with no colour or variable of its own |
| [`src/words/index.ts`](../../apps/demo/src/words/index.ts) | The page's words in de-CH, fr, it and en, and the language it opens in |
| [`scripts/demo-headers.mjs`](../../scripts/demo-headers.mjs) | The headers every response carries, decided once as a function of the address the page is served at: the deploy writes them for formancy.ai, `vite preview` and the gate serve them for their own |
| [`scripts/third-party-notices.mjs`](../../scripts/third-party-notices.mjs) | The build's `THIRD-PARTY-NOTICES.txt`, which the footer links: every package the bundle holds with the licence and notice files it ships, each held to [`dependency-licences.mjs`](../../scripts/dependency-licences.mjs)' policy, or the build stops |
| [`scripts/demo.mjs`](../../scripts/demo.mjs) | The deploy Workers Builds runs: the config and the build checked, the build staged under `/health/` with `_headers`, the pinned Wrangler run |
| [`scripts/notices.mjs`](../../scripts/notices.mjs), [`purpose.mjs`](../../scripts/purpose.mjs) | HL7's and LOINC's notices and HL7's marks in a name, and the reading of CLAUDE.md's sentence of what the product is not: one text each, which the guards hold the files to and the build hands the page |
| [`apps/demo/scripts/browser-test.mjs`](../../apps/demo/scripts/browser-test.mjs), [`gate-page.mjs`](../../apps/demo/scripts/gate-page.mjs), [`gate-journey.mjs`](../../apps/demo/scripts/gate-journey.mjs), [`gate-privacy.mjs`](../../apps/demo/scripts/gate-privacy.mjs), [`gate-results.mjs`](../../apps/demo/scripts/gate-results.mjs) | The browser gate: its plan from the stylesheets' breakpoints, the journey, what the page asked for and kept, and the results file the release report reads ([§6.7](06-runtime-view.md#67-the-demos-browser-gate-walks-the-page)) |

### Beside the packages: the gates' own code

The validator's runner, its corpus and its registers stay outside
health-corpus: the synthetic forms need `@formancy/spec` and
health-questionnaire, which health-corpus does not depend on, and the
workflow runs the gate by its path
([0008](../decisions/0008-a-document-is-a-bundle-of-what-it-refers-to-and-a-pdf-its-own-bytes-never-an-unproved-pdf-a.md),
[0005](../decisions/0005-a-fhir-resource-is-proved-by-the-hl7-validator-against-pinned-guide-packages.md)).

| File | Responsibility |
|---|---|
| [`scripts/validator.mjs`](../../scripts/validator.mjs) | The gate: checks the registers, fetches, writes the corpus, runs the validator offline, judges, and writes the verdict at the gitignored path its `RESULTS` names |
| [`scripts/validator/cache.mjs`](../../scripts/validator/cache.mjs), [`tgz.mjs`](../../scripts/validator/tgz.mjs) | Downloads refused unless their SHA-256 is registered; a package's tarball unpacked by a reader of this repository's, which writes regular files and directories and refuses everything else |
| [`scripts/validator/corpus.mjs`](../../scripts/validator/corpus.mjs), [`forms.mjs`](../../scripts/validator/forms.mjs), [`ch-orf.mjs`](../../scripts/validator/ch-orf.mjs), [`demo-referral.mjs`](../../scripts/validator/demo-referral.mjs) | The corpus: what the packages as built make of synthetic forms, submissions, the referral letter and the CH ORF documents of synthetic referrals, the demo's among them, whose data the demo's build hands to its page; resources built by hand where no package builds one, and the resources broken on purpose |
| [`scripts/validator/letter.mjs`](../../scripts/validator/letter.mjs), [`docs/release/letter.json`](../release/letter.json) | The letter's PDF, refused unless it is the bytes the register names by size and SHA-256, for the gate and the demo's build alike |
| [`scripts/validator/judge.mjs`](../../scripts/validator/judge.mjs), [`outcome.mjs`](../../scripts/validator/outcome.mjs), [`registers.mjs`](../../scripts/validator/registers.mjs), [`warnings.json`](../../scripts/validator/warnings.json) | The verdict; the validator's output, read; the registers' shape, and `ADMITTED_LICENCES`, the licence a decision admits for one entry alone ([0009](../decisions/0009-a-ch-orf-document-is-the-hosts-referral-in-ch-core-and-ch-orf-the-questionnaire-by-canonical-and-swiss-identifiers-checked-here.md)); each warning accepted, by its message id, with its reason |
| [`docs/release/validator.json`](../release/validator.json), [`ig-packages.json`](../release/ig-packages.json) | The validator release and every package it loads, each pinned by SHA-256 ([`docs/release/README.md`](../release/README.md)) |
| [`scripts/install-test.mjs`](../../scripts/install-test.mjs), [`install-hosts.mjs`](../../scripts/install-hosts.mjs), [`scripts/install-fixture/consume.ts`](../../scripts/install-fixture/consume.ts), [`guide-node.ts`](../../scripts/install-fixture/guide-node.ts) | The install gate; its two projects, the consumer's, holding the tarballs alone, and the guide's, holding them beside what the guide installs, each read from the workspace's manifests, under one strict tsconfig; the consumer that knows nothing of the workspace; and the runner that holds the guide's program to the output the guide shows ([0011](../decisions/0011-a-release-report-is-derived-from-the-run-that-gated-it.md)) |
| [`docs/getting-started.md`](../getting-started.md), [`scripts/getting-started.mjs`](../../scripts/getting-started.mjs) | The guide, from an empty npm project to a CH ORF document, and its one reading, which the install gate and [`getting-started.test.mjs`](../../scripts/getting-started.test.mjs) share: every block of code handed to the gate or refused with its line |
| [`scripts/markdown.mjs`](../../scripts/markdown.mjs) | Markdown as GitHub shows it -- where a fence or a comment is, a link, a heading's anchor -- read once for the architecture's guard, the guide's and the README's, [`readme.test.mjs`](../../scripts/readme.test.mjs), which holds the README's intended purpose to CLAUDE.md's sentence and its links to what exists ([0011](../decisions/0011-a-release-report-is-derived-from-the-run-that-gated-it.md)) |
| [`scripts/sync-licenses.mjs`](../../scripts/sync-licenses.mjs) | Run by `pnpm build`: copies `LICENSE.md` and `NOTICE` into each published package, where they are gitignored, so that its tarball carries them |
| [`scripts/release/pins.mjs`](../../scripts/release/pins.mjs), [`publish.mjs`](../../scripts/release/publish.mjs) | A release's checks on the report and the tarballs it would publish, pinned by SHA-256, and publishing exactly those |
| [`scripts/release-report/collect.mjs`](../../scripts/release-report/collect.mjs) | What one job of the gates found, in one results file: a suite and the test files the checkout holds for it, the install gate's record, the validator gate's file and its job's run of the registers' test, and every published package's built `dist` ([0011](../decisions/0011-a-release-report-is-derived-from-the-run-that-gated-it.md)); Node's built-ins only |
| [`report.mjs`](../../scripts/release-report/report.mjs), [`results.mjs`](../../scripts/release-report/results.mjs), [`problems.mjs`](../../scripts/release-report/problems.mjs), [`artefacts.mjs`](../../scripts/release-report/artefacts.mjs) | The report from every job's results, and what fails the run: a skip only the validator job's pass of the same test accounts for, the install gate held to the projects `install-hosts.mjs` plans, which `report.mjs` imports, the validator gate held to the registers and each row to its own counts, each section read from the job that leaves it, build identity, the artefacts of one run |
| [`tested-on.mjs`](../../scripts/release-report/tested-on.mjs), [`versions.mjs`](../../scripts/release-report/versions.mjs), [`render.mjs`](../../scripts/release-report/render.mjs) | What the checkout is tested with, the tuple read through `scripts/compatibility.mjs`, what the run ran -- a consumer's clean install apart from the guide's project -- and the report as Markdown with the limitations the run shows |
| [`gates.mjs`](../../scripts/release-report/gates.mjs), [`limitations.mjs`](../../scripts/release-report/limitations.mjs), [`verify-publish.mjs`](../../scripts/release-report/verify-publish.mjs) | The two registers, [`docs/release/gates.json`](../release/gates.json) and [`limitations.json`](../release/limitations.json), held to the repository and the records; and what a release refuses of the report, and of the SBOM against it and against npm's lockfile of the install it describes |
