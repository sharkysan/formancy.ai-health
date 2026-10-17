# Formancy Health

**Forms and reports, exported to the HL7® FHIR® standard in the formats each country specifies.**

A self-hosted export module for [formancy](https://github.com/sharkysan/formancy.ai)
and [Formancy Report](https://github.com/sharkysan/formancy.ai-report), for
the vendors whose software hospitals and practices run. It exports a formancy form
as a FHIR® R4 `Questionnaire`, a person's answers to it as a
`QuestionnaireResponse`, and a PDF that Formancy Report rendered in the
document resource the receiving side's guide asks for, each shaped to the
profiles a country publishes rather than to FHIR's base resources alone.
What an export cannot say in the profile it targets, it refuses rather than
leaves out.

**Start with [the getting-started guide](./docs/getting-started.md)**: from
an empty npm project to a Questionnaire of a formancy form, a
QuestionnaireResponse of a submission, a document Bundle carrying a PDF
Formancy Report rendered, and a CH ORF referral, under Node, from synthetic
data. The install gate compiles its code against the packed packages, runs
it and holds what it prints to what the guide shows, so its code fails CI
when it stops being true; of its prose, a guard holds its install lines
and its links, and review the rest
([0011](./docs/decisions/0011-a-release-report-is-derived-from-the-run-that-gated-it.md)).

> **Status, 17 October 2026: 0.1.0, a developer preview, is ready to tag
> and not released.** Nothing is on npm and no tag is pushed. The
> packages' manifests say 0.1.0, and a release report built from one
> machine's runs that day -- the guards, every package's suite, the install
> gate and the validator gate -- found no problem, as a partial report:
> it allowed the verify, install and validator jobs' results missing, as a
> machine must, so the gates that rest on a job's result are judged only
> on GitHub ([`RELEASING.md`](./RELEASING.md#the-release-report)). On that
> machine `pnpm check:pkg` stopped before it checked anything, its pnpm
> refused by corepack's; publint and attw, run in each package by hand,
> passed. None of it had run on GitHub that day as 0.1.0 has it: the first
> pull request run is the release report's first there, and a rehearsal
> of the release workflow the first of its SBOM step. What is left is the
> maintainer's -- that run, the secrets the workflows expect, the
> changelog's 0.1.0 heading, dated the tag's day, through a pull request
> before the rehearsal, the rehearsal and the tag
> ([`RELEASING.md`](./RELEASING.md#before-the-first-release)) -- and what
> 0.1.0 holds, and leaves out, is [below](#what-010-is).
>
> Built: the licence, the pipeline that proves the packages, as Formancy
> Report's proves its own, and four packages.
> `@formancy/health-core` names the FHIR version it emits, holds FHIR R4's
> primitives to their types -- a decimal as its digits, never a JavaScript
> number, bytes as canonical base64 -- and writes and reads FHIR JSON that
> keeps every digit. `@formancy/health-questionnaire` exports a formancy
> form as an SDC 4.0.0 Questionnaire, translated into the languages a host
> asks for, and a submission of it as a QuestionnaireResponse to that
> Questionnaire, or refuses either whole. `@formancy/health-document`
> attaches a PDF's bytes to a DocumentReference and assembles a document
> Bundle of what its Composition refers to, every reference resolved, and
> refuses a PDF/A declaration, which nothing here proves yet.
> `@formancy/health-ch` writes a CH ORF 3.0.2 document of a referral, its
> patient, author and orders in CH Core 6.0.0's profiles and the answers
> health-questionnaire wrote, the Questionnaire named by its canonical,
> and holds a GLN and an AHV number to their check digits, which the
> validator only warns of. Beside them, the gate that runs the HL7 FHIR
> validator, offline, against pinned guide packages, over what the
> packages make of synthetic forms, submissions, a referral letter
> Formancy Report 0.1.0 renders, in the private `@formancy/health-corpus`,
> and a referral, and resources built by hand. Every run of the gates ends
> in a release report of what it was tested on and what it found, which a
> release attaches signed beside an SBOM of what a consumer installs.

## What 0.1.0 is

A developer preview, as Formancy Report's 0.1.0 was: for a vendor to
evaluate Formancy Health and build against it -- a CH ORF referral from a
formancy form and a person's answers to it, and a document Bundle that
carries a PDF Formancy Report rendered -- while PDF/A, the EPR and the
other countries are still to come. It is not yet for a production export of a
person's record: no lawyer has read the licence, the
[intended purpose](#intended-purpose) or the trademark position, and the
release gates that ask for that reading are open.

It publishes `@formancy/health-core`, `@formancy/health-questionnaire`,
`@formancy/health-document` and `@formancy/health-ch`, each at 0.1.0 and
under the Formancy Health Source-Available Licence
([0001](./docs/decisions/0001-a-paid-module-in-its-own-repository.md)),
each described [below](#packages). Besides one another they depend on
formancy's `@formancy/spec` alone, at the exact version the
[table](#what-it-is-built-and-judged-against) names, through which
health-questionnaire reads a form, and on what it brings, which a
release's SBOM lists; they take no peer. `@formancy/health-corpus` stays
private.

The gates 0.1.0 is held to are the register's
([`docs/release/gates.json`](./docs/release/gates.json)): reuse and
compatibility, through the install gate over every published package,
which the register keeps open in part -- no gate bundles a package for a
browser, and that no upstream file is copied is review's; conformance,
through the validator gate; exactness; failing closed, of which the
register keeps a part open, for refusals no package has a case for yet;
the dependency licences; HL7's notice and the names; and a clean
rehearsal of the release workflow, which no run of the gates can see.
PDF/A, privacy beyond what the guards hold, customer readiness and the
legal review belong to later releases. The release report of the run
that gates a release says which passed in it, and why each open one is
open.

### Not in 0.1.0

- **PDF/A, and with it the CH EPR's MHD document.** No release of Formancy
  Report writes PDF/A, so health-document refuses every PDF/A declaration
  ([0008](./docs/decisions/0008-a-document-is-a-bundle-of-what-it-refers-to-and-a-pdf-its-own-bytes-never-an-unproved-pdf-a.md)).
- **Extraction**: no resource is extracted from a QuestionnaireResponse.
- **Germany, the United Kingdom, Austria and Europe.** CH Core and CH ORF
  are the only national profiles; the [formats](#the-formats-it-targets)
  say which come next.
- **File, signature, ranking, matrix and rich-text items.** A form that
  holds one is refused whole, naming the field
  ([0006](./docs/decisions/0006-a-formancy-form-is-an-sdc-questionnaire-refused-whole-where-it-cannot-be-one.md)).
- **FHIRPath, anywhere.** A visibility rule beyond a simple comparison
  refuses the form, a computed field is exported read-only and never as a
  calculated item, and the dependency-licence guard refuses `fhirpath`
  today.
- **Of CH ORF**: the Questionnaire inside the Bundle, which the response
  names by its canonical instead; and a PDF, the Composition's receivers
  and contacts, and the rest 0009 lists, each refused rather than left out
  ([0009](./docs/decisions/0009-a-ch-orf-document-is-the-hosts-referral-in-ch-core-and-ch-orf-the-questionnaire-by-canonical-and-swiss-identifiers-checked-here.md)).
- **A page, a server, or any transport.** It is a library; a vendor's
  application sends what it writes.
- **A browser.** Every gate runs the packed packages under Node; none runs
  them in a browser or another engine, so that is not claimed.

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

Why a paid module exists beside an Apache-2.0 project, in a repository of its
own, on Formancy Data's and Formancy Report's terms and before a lawyer has
read them, is decision
[0001](./docs/decisions/0001-a-paid-module-in-its-own-repository.md).

Where a package here depends on Formancy Report's or Formancy Data's
packages, those keep their own licence, on the same terms: a host that runs
it in production needs that product's production licence as well as this
one's.

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

The order is the order of the work. Which version of a guide a package
targets is decided when the package arrives, in the decision record that
comes with it: CH ORF 3.0.2 on CH Core 6.0.0, with the CH Term 3.3.0 CH
Core declares, in [0009](./docs/decisions/0009-a-ch-orf-document-is-the-hosts-referral-in-ch-core-and-ch-orf-the-questionnaire-by-canonical-and-swiss-identifiers-checked-here.md).

## Packages

| Package | What it is |
| --- | --- |
| `@formancy/health-core` | The FHIR version the module emits, R4 4.0.1; FHIR R4's primitives, each checked against its type when made, a number held as its digits and bytes as canonical base64; and a writer and a reader of FHIR JSON that keep every digit, give the same bytes for the same input, and refuse an empty value, a null outside an array, a name given twice and a JavaScript number, naming where and never quoting the value ([0004](./docs/decisions/0004-fhir-json-is-written-and-read-exactly-with-primitives-of-its-own.md)). And the readers every package reads a host's context with: each value its own, an object for the members it names and no others, a list at every index, a text with nothing a resource cannot carry ([0009](./docs/decisions/0009-a-ch-orf-document-is-the-hosts-referral-in-ch-core-and-ch-orf-the-questionnaire-by-canonical-and-swiss-identifiers-checked-here.md)). No framework, no Node, no network. |
| `@formancy/health-questionnaire` | A formancy form, read through `@formancy/spec` 0.5.0, as an SDC 4.0.0 Questionnaire: one item per field with its key as the linkId, under the host's canonical base and formancy's published version, its texts translated into each language the host asks for; a visibility rule as `enableWhen` where it is a simple comparison, a computed field read-only, and no FHIRPath. What an item cannot say as the field says it refuses the whole export, every refusal at once, naming where ([0006](./docs/decisions/0006-a-formancy-form-is-an-sdc-questionnaire-refused-whole-where-it-cannot-be-one.md)). And a formancy submission of the form as a QuestionnaireResponse to that Questionnaire, walked from its own items: each answer of its item's type, a number answer exactly the double formancy holds, no answer where formancy holds none, a value on a page a skip rule walks past left out, the subject and the author by name from the host; a value of another type, an option not offered, a value past a bound, a name the form does not have, an answer to an item the other answers disable or a member the context does not name refuses it whole ([0007](./docs/decisions/0007-a-formancy-submission-is-a-questionnaireresponse-of-the-same-mapping-refused-whole-where-an-answer-cannot-be-one.md)). No framework, no Node, no network. |
| `@formancy/health-document` | A PDF as an R4 DocumentReference by its own bytes, in the attachment or in a Binary beside it, with their size and SHA-1; declared a plain PDF and checked by its first and last lines, or refused declared PDF/A, which no gate here proves yet. And a document Bundle of the host's resources, its identifier and timestamp the host's, the Composition first and then only what it refers to, every reference resolved before output: a dangling one, an entry nothing reaches, two of one name, an attachment whose size, hash or media type are not its bytes', a member of the context it does not name or a hole in a list refuse it whole, every refusal at once, naming where ([0008](./docs/decisions/0008-a-document-is-a-bundle-of-what-it-refers-to-and-a-pdf-its-own-bytes-never-an-unproved-pdf-a.md)). Depends on health-core alone. No framework, no Node, no network. |
| `@formancy/health-ch` | Switzerland: a CH ORF 3.0.2 document of a referral, the Bundle claiming CH ORF's document profile, the Composition with a narrative of its titles, one category and the order-referral section coded LOINC 93037-0, with its LOINC name; the host's patient, author, organisation and orders as CH Core 6.0.0's Patient, PractitionerRole, Practitioner and Organization and CH ORF's ServiceRequest; the host's answers, claiming CH ORF's response profile, about the patient, the Questionnaire by its versioned canonical, copied once and carried as checked. A GLN and an AHV number held to their forms and GS1's check digit, which CH Core only warns of, and a host's own identifier under none of CH Core's systems, in any case; a member the context does not name, a member of the answers health-questionnaire does not write, a status, a gender or a name CH Core does not take refuses it whole, every refusal at once, naming where ([0009](./docs/decisions/0009-a-ch-orf-document-is-the-hosts-referral-in-ch-core-and-ch-orf-the-questionnaire-by-canonical-and-swiss-identifiers-checked-here.md)). Built on health-document, health-questionnaire and health-core. Nothing is sent. No framework, no Node, no network. |

`@formancy/health-corpus` is test support, private and never published:
the referral letter it renders with Formancy Report 0.1.0's released
packages, the only place Report is a dependency, and the documents the
validator gate judges.

What is planned and not here yet is [Not in 0.1.0](#not-in-010), above.

A decimal travels as its text. Build one with `decimal('70.50', path)`
from the text a form or a database gave you, never from a JavaScript
number: 0.10 cannot be recovered from 0.1, and health-core refuses a
number rather than guess.

A document's identifier is the host's, and so is keeping it unique across
documents: the same input gives the same Bundle, identifier included, and
FHIR's documents page says a document's identifier is never re-used,
which nothing here can see across a host's documents
([0008](./docs/decisions/0008-a-document-is-a-bundle-of-what-it-refers-to-and-a-pdf-its-own-bytes-never-an-unproved-pdf-a.md)).

## How it relates to formancy.ai, Formancy Data and Formancy Report

This module **depends on** the released `@formancy/*` packages, at exact
versions, and copies none of their code, stylesheets included
([0002](./docs/decisions/0002-depend-on-upstream-never-copy-it.md)). A guard
refuses a range or a path. A form is formancy's form, read as formancy
defines it; a report is Formancy Report's definition and the PDF Report
rendered from it. Neither the form spec nor the report definition grows to
hold what a profile asks for: that mapping is this module's.

Formancy Report and Formancy Data are both optional. A host that exports only
forms needs neither, and without Data a host hands over the form and its
submissions itself. Neither depends on this module.

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
package's name takes one of the marks.

## Development

Node 22.13 or later, and pnpm through corepack.

```bash
corepack enable pnpm
pnpm install
pnpm build
pnpm test
```

The gates CI runs, from `.github/workflows/gates.yml`: `pnpm build`,
`pnpm typecheck`, `pnpm check:pkg`, `node scripts/verify-licenses.mjs`,
`node scripts/dependency-licences.mjs` and `pnpm test:repo`, which holds the
repository's guards, HL7's notice among them, this README's intended
purpose and links, and the rule that no package converts a value through a
JavaScript number or reads a clock; each package's
`test:coverage` in a job of its own; `pnpm test:e2e:install`, which packs
the packages, installs them into a plain npm project, type-checks it with
`skipLibCheck` off and runs it under Node, and does the same with the
program of the [getting-started guide](./docs/getting-started.md) in a
project of its own; `node scripts/validator.mjs`,
the validator gate below; and the release report, built from what every
other job found, which fails the run on anything it lists
([`docs/release/`](./docs/release/README.md)).
Beside them, every pull request's commit authors are checked against the
CLA, and CodeQL and dependency review run. A release runs the same gates and
publishes only the tarballs the install gate ran, with provenance, a signed
SBOM of what a consumer's install of them brings, and the signed report of
the run that gated it.
[`CLAUDE.md`](./CLAUDE.md) says what each is for and what the bar is.

### The validator gate

The HL7 FHIR validator judges the FHIR JSON the packages write, against
pinned guide packages, offline
([0005](./docs/decisions/0005-a-fhir-resource-is-proved-by-the-hl7-validator-against-pinned-guide-packages.md)).
The release it runs and every package it loads are fetched by exact version
and refused unless their SHA-256 is the one
[`docs/release/validator.json`](./docs/release/validator.json) or
[`docs/release/ig-packages.json`](./docs/release/ig-packages.json)
registers; the validator then runs with no terminology server and no HTTP
access at all. An error fails the gate, and so does a warning that
`scripts/validator/warnings.json` does not name with the reason it is
accepted. Every resource of the corpus, `scripts/validator/corpus.mjs`, is
written by health-core's `writeJson`: the Questionnaires health-questionnaire
makes of the synthetic forms in `scripts/validator/forms.mjs`, which hold
every field type and rule it maps, the QuestionnaireResponses it makes of
the synthetic submissions there, which hold every answer type it writes,
each judged against its Questionnaire; the document Bundles
health-document makes of the referral letter health-corpus renders with
Formancy Report 0.1.0, its PDF in the attachment, in a Binary, and beside
a QuestionnaireResponse; the CH ORF document health-ch makes of a
synthetic referral, `scripts/validator/ch-orf.mjs`; and resources built by
hand where no package builds one. Some are broken on purpose, each for
one thing, and the gate fails unless the validator refuses each for
exactly that.

```bash
pnpm build                                      # the corpus is written by the package as built
node scripts/validator.mjs --java <path to java 17 or later>
```

It downloads into `.fhir-cache/`, which is never committed, and writes
`test-results/validator.json`. Offline, the validator checks codes only
against the code systems the registered packages hold: a code from LOINC,
SNOMED CT or UCUM, and a language tag, are not checked, and the validator
says so in a warning the gate refuses until it is registered; a
translation's language it does not check at all, and a resource's
language only as far as its own reading of a tag goes, which refuses
`de-ch` and `zz`. A code from
a code system nothing knows, a made-up system URI, is only information,
which the gate accepts; the code systems a Questionnaire names for a
form's options are such systems. What the gate shows is that the
Questionnaires health-questionnaire makes of the corpus's forms, and the
responses it makes of the corpus's submissions, against those
Questionnaires, are accepted against SDC 4.0.0 on R4 4.0.1 by the HL7 FHIR
validator 7.0.2, offline, with no error and no warning but the registered
ones, their option codes and the registration of their language tags
unchecked -- health-core holds each tag to its form, nothing to the
registry; and that the documents health-document makes of the corpus's
PDF are accepted against R4 4.0.1 the same way, the size and SHA-1 of the
bytes in an attachment recomputed by the validator, those of the bytes in
a Binary not, and the media type unchecked. Not that a form, a submission
or a document the corpus lacks would be; nothing about a response that is
not complete, which the corpus has none of; and nothing about the PDF
itself, which is no PDF/A and whose pages Report proves. And that the CH
ORF document health-ch makes of the corpus's referral is accepted against
CH ORF 3.0.2 and CH Core 6.0.0, with CH Term 3.3.0, the same way, with no
error and no warning but dom-6 and CH Core's `gln-startswith76`, which the
corpus's GLNs under GS1's prefix 952 raise; offline, nothing checks its
Composition's type and category against CH Term's SNOMED CT value sets, a
made-up SNOMED CT code drawing nothing, nor its LOINC section code beyond
the pattern that fixes it, and a GLN's or an AHV number's form and check
digit only draw warnings, which is why health-ch refuses them; no AHV
number the gate should accept is in the corpus, since a valid one may be
a person's. The corpus's type and category are HL7's own codes, and it
holds no SNOMED CT code: `scripts/terminology.test.mjs` holds every code
system the corpus writes to the terms that admit it, LOINC with its
recorded display name and its notice in [`NOTICE`](./NOTICE), and
`scripts/synthetic-identifiers.test.mjs` fails on an AHV number that
passes its check in any file and on a corpus GLN outside GS1's prefix
for examples.

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
| `@formancy/spec` | 0.5.0 | the manifest of `@formancy/health-ch`, `@formancy/health-questionnaire` |
| Node | `>=22.13.0`; CI runs 22 | the root `engines`; `.node-version` |
| TypeScript | 6.0.3, declared `~6.0.3` | `pnpm-workspace.yaml` |
| pnpm | 12.4.2, through corepack | the root `packageManager` |

<!-- end generated -->

What a run actually ran -- the Java of the validator job, the packages the
validator loaded, the time it took -- is in that run's
`test-results/validator.json`, uploaded as its `validator-results`.

## Documents

- [`docs/getting-started.md`](./docs/getting-started.md) — from an empty npm project to a Questionnaire, a QuestionnaireResponse, a document Bundle carrying a Report PDF, and a CH ORF document, under Node; its code is compiled and run against the packed packages by the install gate.
- [`docs/`](./docs/README.md) — the architecture, as arc42 in formancy.ai's files, whose decisions are the records below, and where to start reading it, by who you are.
- [`docs/decisions/`](./docs/decisions/README.md) — every decision somebody could helpfully undo, with what verifies it.
- [`docs/release/`](./docs/release/README.md) — the registers a conformance claim rests on, the validator the gate runs and every package it loads; the two every release report reads, the release gates and each record's known limitations; and what a release report holds and what fails it.
- [`CHANGELOG.md`](./CHANGELOG.md) — what changed and why.
- [`CLAUDE.md`](./CLAUDE.md) — the rules a change is held to, and the gates and guards that hold them.
- [`CONTRIBUTING.md`](./CONTRIBUTING.md) and [`CLA.md`](./CLA.md) — contributions are taken under a CLA, checked on every pull request; [`GOVERNANCE.md`](./GOVERNANCE.md) says who decides.
- [`SECURITY.md`](./SECURITY.md) — how to report a vulnerability, and what this product considers highest risk.
- [`RELEASING.md`](./RELEASING.md) — releases are cut by the workflow, with provenance, a signed SBOM and the signed release report; what the maintainer sets before the first.
