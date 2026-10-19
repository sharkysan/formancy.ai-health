# Formancy Health

**Forms and reports, exported to the HL7® FHIR® standard in the formats each country specifies.**

Formancy Health is a paid, [source-available](#licence-in-one-table) module
that exports [formancy](https://github.com/sharkysan/formancy.ai) forms, a
person's answers to them and PDFs, such as those
[Formancy Report](https://github.com/sharkysan/formancy.ai-report) renders,
as FHIR® R4 JSON. The JSON is shaped to the profiles a country publishes,
not to FHIR's base resources alone, starting with Switzerland's. It is for
the vendors of the software that hospitals and practices run: their
application calls the packages, gets the JSON back and sends it itself.

## What it does

- **Exports a formancy form as a Questionnaire** in SDC 4.0.0, HL7's Structured Data Capture guide for forms: one item per field, translated into the languages the host asks for ([0006](./docs/decisions/0006-a-formancy-form-is-an-sdc-questionnaire-refused-whole-where-it-cannot-be-one.md)).
- **Exports a submission as a QuestionnaireResponse** to that Questionnaire, each answer of its item's type ([0007](./docs/decisions/0007-a-formancy-submission-is-a-questionnaireresponse-of-the-same-mapping-refused-whole-where-an-answer-cannot-be-one.md)).
- **Carries a PDF in a DocumentReference**, such as one Formancy Report rendered, by its own bytes, and assembles a document Bundle: the Composition first, then only what it refers to, every reference resolved ([0008](./docs/decisions/0008-a-document-is-a-bundle-of-what-it-refers-to-and-a-pdf-its-own-bytes-never-an-unproved-pdf-a.md)).
- **Writes a Swiss referral as a CH ORF 3.0.2 document**, HL7 Switzerland's Order & Referral by Form: the patient and author in the profiles of CH Core 6.0.0, Switzerland's base guide, the orders in CH ORF's, and the answers to the referral's form. A GLN, GS1's number for a practitioner or an organisation, and an AHV number, the Swiss social-insurance number, are refused when their form or check digit is wrong, where the HL7 FHIR validator only warns ([0009](./docs/decisions/0009-a-ch-orf-document-is-the-hosts-referral-in-ch-core-and-ch-orf-the-questionnaire-by-canonical-and-swiss-identifiers-checked-here.md)).
- **Refuses rather than leaves out**: what a profile cannot say refuses the whole export, with every refusal at once, each naming where and never quoting a value ([0006](./docs/decisions/0006-a-formancy-form-is-an-sdc-questionnaire-refused-whole-where-it-cannot-be-one.md) to [0009](./docs/decisions/0009-a-ch-orf-document-is-the-hosts-referral-in-ch-core-and-ch-orf-the-questionnaire-by-canonical-and-swiss-identifiers-checked-here.md)).
- **Keeps every digit**: a decimal travels as its text, so `70.50` stays `70.50`, never through a JavaScript number, and the same input gives the same bytes ([0004](./docs/decisions/0004-fhir-json-is-written-and-read-exactly-with-primitives-of-its-own.md)).
- **Judged by the HL7 FHIR validator**, in a gate of its own: offline, against pinned guide packages, over what the packages write of a synthetic corpus ([0005](./docs/decisions/0005-a-fhir-resource-is-proved-by-the-hl7-validator-against-pinned-guide-packages.md), [the validator gate](#the-validator-gate)).
- **A demo at https://formancy.ai/health/** fills a synthetic Swiss referral in your browser and shows what the packages make of it ([Try it](#try-it), [0012](./docs/decisions/0012-a-demo-at-formancy-ai-health-fills-a-synthetic-referral-in-the-browser-served-by-a-worker-of-its-own.md)).

Planned and not here: PDF/A, and with it documents for Switzerland's
electronic patient record, the CH EPR, once a gate here proves a producer
of PDF/A; extraction from a QuestionnaireResponse; and the profiles of
Germany and then, only when a customer pays for them, of the United
Kingdom, Austria and Europe, in the order [the formats](#the-formats-it-targets)
give. [Not in 0.1.0](#not-in-010) lists those, and what 0.1.0 refuses.

> **Status, 19 October 2026: 0.1.0, a developer preview, is released.**
> Its packages are on npm, with provenance, and
> [the GitHub release](https://github.com/sharkysan/formancy.ai-health/releases/tag/v0.1.0)
> carries the signed SBOM and release report of the run that published
> them. What 0.1.0 holds is in
> [the changelog](./CHANGELOG.md#010--2026-10-19), and whom it is for
> [below](#what-010-is).

**Start with [the getting-started guide](./docs/getting-started.md)**: from
an empty npm project to a Questionnaire, its response, a document Bundle
carrying a PDF Formancy Report rendered, and a CH ORF referral, under Node,
from synthetic data. The install gate compiles and runs its code against
the packed packages, and holds what it prints to what the guide shows
([0011](./docs/decisions/0011-a-release-report-is-derived-from-the-run-that-gated-it.md)).

## Try it

The demo is online at https://formancy.ai/health/, and runs from a clone
with Node 22.13 or later and corepack:

```bash
git clone https://github.com/sharkysan/formancy.ai-health.git
cd formancy.ai-health
corepack enable pnpm
pnpm install
pnpm demo
```

`pnpm demo` builds the packages and the demo, then serves the built demo at
http://localhost:4395, under the headers the deploy writes, made for that
address. Open it there: its policy admits the page's scripts from that
address alone.

The page holds a synthetic Swiss referral's form, in German (de-CH),
French, Italian or English, and shows what the packages make of it and of
your answers: the Questionnaire, read out item by item above its JSON, the
QuestionnaireResponse, the CH ORF document, and the document Bundle of a
referral letter Formancy Report rendered, with every refusal as the
packages state it. The read-out is no FHIR renderer and validates nothing,
and Formancy Health draws no Questionnaire
([0013](./docs/decisions/0013-the-demo-reads-its-questionnaire-out-from-the-bytes-it-shows-and-renders-no-questionnaire.md)).

Its data is synthetic; a real patient's does not belong in it. It sends
what you type nowhere and keeps none of it. Its policy allows the page no
connection, and its scripts, styles and faces from its own build's files
alone, which [`scripts/demo.test.mjs`](./scripts/demo.test.mjs) holds the
headers to; and the browser gate fails if, in Chromium, Firefox or WebKit,
the page asks for anything more once it has settled, whatever is typed
into it, or stores anything in the browser
([0014](./docs/decisions/0014-the-demos-browser-gate-runs-in-chromium-firefox-and-webkit-and-each-fact-the-browsers-disagree-on-is-named-and-held.md)).

The online demo is `main`'s, deployed on every push to `main`, so it can be
ahead of the latest release. Nothing in this repository checks what the
address serves
([RELEASING.md](./RELEASING.md#the-demo-on-formancyai),
[0012](./docs/decisions/0012-a-demo-at-formancy-ai-health-fills-a-synthetic-referral-in-the-browser-served-by-a-worker-of-its-own.md)).

## What 0.1.0 is

A developer preview, for a vendor to evaluate Formancy Health and build
against it. It is not yet for a production export of a person's record: no
lawyer has read the licence, the [intended purpose](#intended-purpose) or
the trademark position, and the release gates that ask for that reading
are open.

It publishes `@formancy/health-core`, `@formancy/health-questionnaire`,
`@formancy/health-document` and `@formancy/health-ch`, each at 0.1.0 and
under the Formancy Health Source-Available Licence
([0001](./docs/decisions/0001-a-paid-module-in-its-own-repository.md)).
Besides one another they depend on formancy's `@formancy/spec` alone, at
the exact version the [table](#what-it-is-built-and-judged-against) names,
and need no peer dependency. The release gates it is held to, and why each
open one is still open, are in
[`docs/release/gates.json`](./docs/release/gates.json).

### Not in 0.1.0

- **PDF/A, and with it the CH EPR's MHD document.** No gate here proves a producer of PDF/A yet, so every PDF/A declaration is refused ([0008](./docs/decisions/0008-a-document-is-a-bundle-of-what-it-refers-to-and-a-pdf-its-own-bytes-never-an-unproved-pdf-a.md)).
- **Extraction**: no resource is extracted from a QuestionnaireResponse.
- **Germany, the United Kingdom, Austria and Europe.** CH Core and CH ORF are the only national profiles; the [formats](#the-formats-it-targets) say which come next.
- **File, signature, ranking, matrix and rich-text items**, which refuse the form, naming the field ([0006](./docs/decisions/0006-a-formancy-form-is-an-sdc-questionnaire-refused-whole-where-it-cannot-be-one.md)).
- **FHIRPath, FHIR's expression language, anywhere.** A visibility rule beyond a simple comparison refuses the form, and a computed field is exported read-only, never as a calculated item.
- **Parts of CH ORF.** The Questionnaire is not put in the Bundle; the response names it by its url and version. A PDF, the Composition's receivers and contacts, and the rest [0009](./docs/decisions/0009-a-ch-orf-document-is-the-hosts-referral-in-ch-core-and-ch-orf-the-questionnaire-by-canonical-and-swiss-identifiers-checked-here.md) lists are refused.
- **A page, a server, or any transport.** It is a library; a vendor's application sends what it writes. The demo is a page beside the packages, in no release.
- **A claim for browsers.** Every gate that runs the packed packages runs them under Node, so no other engine is claimed; the demo's browser gate runs them as the workspace builds them, not as published.

## Intended purpose

Formancy Health converts what a vendor's application holds -- a formancy
form, a person's answers to it, a PDF, a referral -- into resources of the
HL7® FHIR® standard, and assembles them into documents, for the software
vendors who build it into their products. A vendor's application calls it,
gets FHIR JSON back and sends it itself. It is not an EHR, a FHIR server or
a terminology service, and it is not intended as a medical device.

Nothing it ships computes a clinical result: no template, no fixture and
no generated item computes a score, raises a warning or suggests a
therapy, and no calculated item is written. A customer's own forms are the
customer's, and where a customer's product computes a clinical result
from them, the regulatory duty that brings is that product's. No lawyer
has read these words yet; that reading is owed before the first paid
release ([`docs/release/gates.json`](./docs/release/gates.json)). The
sentence naming a medical device is CLAUDE.md's, word for word, and
`scripts/readme.test.mjs` fails when the two part; that nothing computes
a clinical result is held by review.

## Licence, in one table

Source-available, **not** open source. The formancy packages this module
builds on stay Apache-2.0; this module does not. Its terms are Formancy
Data's and Formancy Report's.

| Use | Terms |
| --- | --- |
| Read the source and fork the repository | Free |
| Evaluate, develop and test — including in companies | Free |
| Run in production, internally or customer-facing | Paid licence |
| Redistribute inside another software product | Separate commercial agreement |
| Customer data, health records and generated FHIR resources | Remain the customer's |

<!-- generated by scripts/licence-status.mjs from LICENSE.md; do not edit -->

[`LICENSE.md`](./LICENSE.md) has the terms. It is Version 1, in force from 16 October 2026, and says at the top that no lawyer has reviewed it. A production licence is requested from [info@formancy.ai](mailto:info@formancy.ai), as its section 9 says.

<!-- end generated -->

Why a paid module exists beside an Apache-2.0 project, on those terms and
before a lawyer has read them, is decision
[0001](./docs/decisions/0001-a-paid-module-in-its-own-repository.md).
Formancy Report's and Formancy Data's packages keep their own licence, on
the same terms: a host that runs them in production beside these needs that
product's production licence as well as this one's.

## The formats it targets

FHIR® R4, as each country's implementation guides profile it, starting in
Switzerland:

| Where | Implementation guides | Published by |
| --- | --- | --- |
| Switzerland | CH Core 6.0.0; CH ORF 3.0.2, Order & Referral by Form; later CH EPR | HL7 Switzerland |
| Germany | the Basisprofile DE; the ISiK Formularmodul | HL7 Deutschland; gematik |
| United Kingdom | UK Core; the NHS Booking and Referral Standard (BaRS) | HL7 UK; NHS England |
| Austria | AT Core, the HL7® Austria FHIR® Core Implementation Guide | HL7 Austria |
| Europe | HL7 Europe Base and Core; the International Patient Summary (IPS) | HL7 Europe; HL7 International |

The order is the order of the work. Each guide's version is decided in the
record that brings it: for Switzerland,
[0009](./docs/decisions/0009-a-ch-orf-document-is-the-hosts-referral-in-ch-core-and-ch-orf-the-questionnaire-by-canonical-and-swiss-identifiers-checked-here.md),
CH ORF 3.0.2 on CH Core 6.0.0, with CH Term 3.3.0, HL7 Switzerland's
terminology guide.

## Packages

| Package | What it is |
| --- | --- |
| [`@formancy/health-core`](./packages/health-core/README.md) | The FHIR version every resource is written for, R4 4.0.1; FHIR R4's primitives, each held to its type; and a writer and a reader of FHIR JSON that keep every digit ([0004](./docs/decisions/0004-fhir-json-is-written-and-read-exactly-with-primitives-of-its-own.md)). |
| [`@formancy/health-questionnaire`](./packages/health-questionnaire/README.md) | A formancy form, read through `@formancy/spec`, as an SDC 4.0.0 Questionnaire, and a submission of it as a QuestionnaireResponse, each refused whole where it cannot be one ([0006](./docs/decisions/0006-a-formancy-form-is-an-sdc-questionnaire-refused-whole-where-it-cannot-be-one.md), [0007](./docs/decisions/0007-a-formancy-submission-is-a-questionnaireresponse-of-the-same-mapping-refused-whole-where-an-answer-cannot-be-one.md)). |
| [`@formancy/health-document`](./packages/health-document/README.md) | A PDF's bytes as a DocumentReference, in its attachment or in a Binary beside it, and a document Bundle of what its Composition refers to ([0008](./docs/decisions/0008-a-document-is-a-bundle-of-what-it-refers-to-and-a-pdf-its-own-bytes-never-an-unproved-pdf-a.md)). |
| [`@formancy/health-ch`](./packages/health-ch/README.md) | Switzerland: a CH ORF 3.0.2 document of a referral, its patient and author in CH Core 6.0.0's profiles, with a GLN and an AHV number held to their check digits ([0009](./docs/decisions/0009-a-ch-orf-document-is-the-hosts-referral-in-ch-core-and-ch-orf-the-questionnaire-by-canonical-and-swiss-identifiers-checked-here.md)). |

None of them has a framework, a Node API or a network call; each package's
README shows a call of it, and what it does not do or prove. Beside them,
`@formancy/health-corpus` is private test support: the referral letter it
renders with Formancy Report 0.1.0, the only place Report is a dependency,
and the documents the validator gate judges. Neither it nor `apps/demo` is
published.

## How it relates to formancy.ai, Formancy Data and Formancy Report

This module **depends on** the released `@formancy/*` packages, at exact
versions, and copies none of their code
([0002](./docs/decisions/0002-depend-on-upstream-never-copy-it.md)). A
form is formancy's form, and a report is Formancy Report's definition and
the PDF Report rendered from it; neither grows to hold what a profile asks
for, since that mapping is this module's. Formancy Report and Formancy Data
are both optional: a host that exports only forms needs neither, and hands
over the form and its submissions itself. Neither depends on this module.

## HL7® and FHIR®

HL7, FHIR and the FHIR [FLAME DESIGN] are the registered trademarks of Health
Level Seven International and their use does not constitute endorsement by
HL7. [`NOTICE`](./NOTICE) says where that sentence comes from, and under what
terms HL7 publishes the specification.

The product's name carries none of those marks
([0003](./docs/decisions/0003-the-product-name-carries-no-hl7-mark.md)).
FHIR is named here only to say which standard this module implements and
which resources it produces. `scripts/trademark.test.mjs` fails when the
sentence above goes missing from this file or from `NOTICE`, or when a
package's name, or the demo's Worker, routes or page title, takes one of
the marks.

## Development

Node 22.13 or later, and pnpm through corepack.

```bash
corepack enable pnpm
pnpm install
pnpm build
pnpm test
```

The demo, `apps/demo`, is developed on Vite's dev server, which sends none
of the deploy's headers. Its browser gate runs in Chromium, Firefox and
WebKit, WebKit on Linux alone. Install the browsers Playwright pins once
per machine; `FORMANCY_BROWSERS`, such as `chromium,firefox`, narrows a run
to the ones it names
([0014](./docs/decisions/0014-the-demos-browser-gate-runs-in-chromium-firefox-and-webkit-and-each-fact-the-browsers-disagree-on-is-named-and-held.md)):

```bash
pnpm --filter @formancy/health-demo dev                                               # Vite's server, after pnpm build
pnpm --filter @formancy/health-demo exec playwright install chromium firefox webkit   # once per machine
pnpm test:browser                                                                     # the demo's browser gate, which builds what it measures
```

CI runs the gates of `.github/workflows/gates.yml` on every pull request,
and a release runs them before it publishes only the tarballs its install
gate ran. Every run ends in a release report of what it found, which fails
the run on anything it lists
([0011](./docs/decisions/0011-a-release-report-is-derived-from-the-run-that-gated-it.md),
[`docs/release/`](./docs/release/README.md)). [`CLAUDE.md`](./CLAUDE.md)
gives each gate's command and the bar a change meets;
[Verification](./docs/architecture/10-verification.md) says what each gate
proves and what it does not.

### The validator gate

The HL7 FHIR validator checks the FHIR JSON the built packages write of a
synthetic corpus, `scripts/validator/corpus.mjs`, against pinned guide
packages, offline
([0005](./docs/decisions/0005-a-fhir-resource-is-proved-by-the-hl7-validator-against-pinned-guide-packages.md)).
The validator and every package it loads are fetched by exact version and
refused unless their SHA-256 is the one
[`docs/release/validator.json`](./docs/release/validator.json) or
[`docs/release/ig-packages.json`](./docs/release/ig-packages.json)
registers, and it runs with no terminology server and no HTTP access. An
error fails the gate, and so does a warning that
`scripts/validator/warnings.json` does not name with its reason; a
resource broken on purpose must be refused for exactly what it breaks.

```bash
pnpm build                                      # the corpus is written by the package as built
node scripts/validator.mjs --java <path to java 17 or later>
```

It downloads into `.fhir-cache/`, which is never committed, and writes
`test-results/validator.json`.

What a pass shows, at the versions the table below names, with no error
and no warning but the registered ones, is that the validator accepts:

- the Questionnaires and responses health-questionnaire makes of the corpus's forms and submissions, against SDC;
- the document Bundles health-document makes of the corpus's PDF, against FHIR R4;
- the CH ORF documents health-ch makes of the corpus's referrals, against CH ORF and CH Core with CH Term.

It does not show that a resource the corpus lacks would pass, nor what
offline leaves unchecked -- a code from LOINC, SNOMED CT or UCUM, a language tag's
registration, a media type -- nor the PDF itself:
[Verification](./docs/architecture/10-verification.md#103-what-a-conformance-claim-covers)
lists what the claim does not cover.

### What it is built and judged against

<!-- generated by scripts/compatibility.mjs; do not edit -->

| | Version | From |
| --- | --- | --- |
| FHIR, the version every resource is written for | 4.0.1 | `FHIR_VERSION`, `packages/health-core/src/version.ts` |
| `hl7.fhir.r4.core`, FHIR itself, for the validator | 4.0.1 | `docs/release/ig-packages.json` |
| `hl7.fhir.uv.sdc`, a guide the corpus is judged against | 4.0.0 | `docs/release/ig-packages.json` |
| `ch.fhir.ig.ch-orf`, a guide the corpus is judged against | 3.0.2 | `docs/release/ig-packages.json` |
| What the validator loads with them | `hl7.fhir.xver-extensions#0.1.0`, `hl7.terminology.r4#6.2.0`, `hl7.fhir.uv.extensions.r4#5.2.0`, `hl7.terminology#7.4.0`, `hl7.fhir.uv.extensions#5.3.0`, `hl7.terminology.r5#7.1.0`, `hl7.fhir.uv.extensions.r5#5.2.0`, `hl7.terminology.r4#7.1.0`, `hl7.fhir.uv.xver-r5.r4#0.1.0`, `hl7.fhir.uv.tools.r4#1.1.2`, `hl7.fhir.r4.examples#4.0.1`, `hl7.fhir.uv.extensions.r4#5.3.0-ballot-tc1`, `hl7.terminology.r4#6.5.0`, `hl7.terminology.r4#7.0.1`, `hl7.terminology.r4#6.3.0`, `ihe.formatcode.fhir#1.4.0`, `ch.fhir.ig.ch-term#3.3.0`, `ch.fhir.ig.ch-core#6.0.0`, `hl7.fhir.uv.sdc#3.0.0` | `docs/release/ig-packages.json` |
| The HL7 FHIR validator | 7.0.2, released 2026-10-15, SHA-256 `e3e50f06b806`… | `docs/release/validator.json` |
| Java, for the validator | 17 or later | `docs/release/validator.json` |
| `@formancy/report-render-pdf` | 0.1.0 | the manifest of `@formancy/health-corpus` |
| `@formancy/report-runtime` | 0.1.0 | the manifest of `@formancy/health-corpus` |
| `@formancy/report-spec` | 0.1.0 | the manifest of `@formancy/health-corpus` |
| `@formancy/spec` | 0.6.0 | the manifest of `@formancy/health-ch`, `@formancy/health-questionnaire` |
| Node | `>=22.13.0`; CI runs 22 | the root `engines`; `.node-version` |
| TypeScript | 6.0.3, declared `~6.0.3` | `pnpm-workspace.yaml` |
| pnpm | 12.4.2, through corepack | the root `packageManager` |

<!-- end generated -->

What a run actually ran -- the Java of the validator job, the packages the
validator loaded, the time it took -- is in that run's
`test-results/validator.json`, uploaded as its `validator-results`.

## Documents

- [`docs/getting-started.md`](./docs/getting-started.md) — from an empty npm project to a CH ORF document, under Node, its code compiled and run by the install gate.
- [`docs/`](./docs/README.md) — the architecture, in arc42's sections, and where each kind of reader starts.
- [Glossary](./docs/architecture/12-glossary.md) — SDC, CH Core, CH ORF, GLN, AHV and the other words used here.
- [`docs/decisions/`](./docs/decisions/README.md) — every decision somebody could helpfully undo, with what verifies it.
- [`docs/release/`](./docs/release/README.md) — the registers the validator gate runs from, the release gates and the known limitations, and what a release report holds and what fails it.
- [`CHANGELOG.md`](./CHANGELOG.md) — what changed and why.
- [`CLAUDE.md`](./CLAUDE.md) — the rules a change is held to, and the gates and guards that hold them.
- [`CONTRIBUTING.md`](./CONTRIBUTING.md) and [`CLA.md`](./CLA.md) — contributions are taken under a CLA, checked on every pull request; [`GOVERNANCE.md`](./GOVERNANCE.md) says who decides.
- [`SECURITY.md`](./SECURITY.md) — how to report a vulnerability, and what this product considers highest risk.
- [`RELEASING.md`](./RELEASING.md) — how a release is cut, with provenance, a signed SBOM and the signed release report.
