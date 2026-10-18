# @formancy/health-corpus

Formancy Health's test support, private and never published: a synthetic
referral letter as a Formancy Report definition, the PDF Report 0.1.0
renders of it, and the document Bundles `@formancy/health-document` makes
of that PDF, as the validator gate judges them. Decision
[0008](../../docs/decisions/0008-a-document-is-a-bundle-of-what-it-refers-to-and-a-pdf-its-own-bytes-never-an-unproved-pdf-a.md)
says why it exists and what it may import.

It depends on Report's released packages at exactly 0.1.0 --
`@formancy/report-spec`, `@formancy/report-runtime` and
`@formancy/report-render-pdf`, whose Node entry draws the PDF with pdfmake
-- and on health-core and health-document. No published package depends
on it or on Report; the dependency-licence guard walks published packages
alone, and the install gate never packs this one.

```ts
import { referralDocument, renderReferral } from '@formancy/health-corpus'

const pdf = await renderReferral() // the same bytes every time
const result = referralDocument({ pdf, placement: 'binary' }) // or 'data', and a response beside it
```

`@formancy/health-corpus/documents` is the documents alone, without the
letter's renderer: what the demo bundles into its page, which assembles
the letter's Bundles in the browser around the PDF its build rendered. It
is the module the index re-exports, not a copy, and reaches health-core
and health-document and nothing else, no Report and nothing of Node's;
`scripts/corpus-documents.test.mjs` reads both from the built `dist/` and
fails otherwise.

## What it holds

- **The letter.** `REFERRAL_REPORT`, a report-spec 0 definition in Swiss
  German -- a header, the patient and the question, a table of what the
  letter says under each heading, a closing line, page numbers -- and
  `REFERRAL_DATA`, its data. The patient, the practitioner and the clinic
  are invented, and the text says it means nothing; nothing computes,
  scores or suggests. `renderReferral()` resolves it with
  `resolveReport` and draws it with `renderPdf`, its creation date fixed,
  so the same report and data give the same bytes.
- **The documents.** `referralDocumentReference(pdf, placement)` and
  `referralDocument({ pdf, placement, response? })`, with what a synthetic
  host says of them: the names, the patient and practitioner, and codes
  from code systems the HL7 validator holds offline. A response, where
  given, is a QuestionnaireResponse the caller made -- the gate's is
  health-questionnaire's answers to the intake -- in a section of its own.

What `scripts/validator/corpus.mjs` takes from the built `dist/`:
`renderReferral`, `referralDocument`, `referralContext`,
`referralDocumentContext`, `NAMES` and `PRACTITIONER`. The gate takes the
PDF through `scripts/validator/letter.mjs`, which refuses a render that is
not the bytes `docs/release/letter.json` registers by size and SHA-256:
the tests here prove the same bytes within one process, and the register
holds them across the machines that render them.

## What its tests prove

That the definition is one Report's validator accepts; that the PDF
renders, as a PDF by its first and last lines, to the same bytes each
time; that health-document attaches it as a plain PDF and refuses it
declared PDF/A; and that in both places the bytes go, read back from the
JSON text with Node's own base64, they are every byte Report rendered,
with the size and Node's SHA-1 of them -- and that health-document's SHA-1
is Node's for every length across the first block boundaries. The same
input gives byte-identical JSON, and a document without the patient it
refers to is refused for each dangling reference. Data Report refuses, or a
PDF health-document refuses, stops the corpus, naming where and no value.

What the PDF's pages say is Report's to prove, on the PDF, with PDF.js
(formancy.ai-report 0003): not here.

## What is not here yet

The validator's runner, its synthetic forms and submissions, and the
registers stay where 0005 and 0006 put them, in `scripts/validator/` and
`docs/release/`. Moving the forms would need `@formancy/spec` and
health-questionnaire, which this package does not depend on; the runner
is a repository gate the `validator` job and its workflow guard run by
path; and the registers are what a conformance claim and the release
report cite (0008). veraPDF's runner arrives with H09.

Source-available, not open source: see [`LICENSE.md`](../../LICENSE.md).
