# 12. Glossary

Terms that mean something specific here, and that a reader will otherwise
reasonably misread.

| Term | Meaning in Formancy Health |
|---|---|
| **AHV number**, **AHVN13** | The Swiss social-insurance number, under CH Core's system `urn:oid:2.16.756.5.32`: 756, nine digits and GS1's check digit, written without points. No file here holds one that passes its check ([0009](../decisions/0009-a-ch-orf-document-is-the-hosts-referral-in-ch-core-and-ch-orf-the-questionnaire-by-canonical-and-swiss-identifiers-checked-here.md)) |
| **Answer** | A value a person gave a formancy field, as formancy's engine holds it; in a response, its item's `answer[x]`. A checkbox's false is an answer, and a text of nothing but whitespace is none ([0007](../decisions/0007-a-formancy-submission-is-a-questionnaireresponse-of-the-same-mapping-refused-whole-where-an-answer-cannot-be-one.md)) |
| **Broken on purpose** | A corpus resource with one thing taken out or put back, which the validator must refuse for exactly that thing, or the gate fails ([0005](../decisions/0005-a-fhir-resource-is-proved-by-the-hl7-validator-against-pinned-guide-packages.md)) |
| **Canonical** | A definition's url and version, `url\|version`. An identifier, never fetched |
| **CH Core** | HL7 Switzerland's guide of the base profiles for Switzerland -- the Patient, Practitioner, Organization and PractitionerRole a CH ORF document holds among them -- and of the Swiss identifier systems, whose constraints on a GLN and an AHV number are warnings ([0009](../decisions/0009-a-ch-orf-document-is-the-hosts-referral-in-ch-core-and-ch-orf-the-questionnaire-by-canonical-and-swiss-identifiers-checked-here.md)) |
| **CH ORF** | HL7 Switzerland's Order & Referral by Form: a referral as a document Bundle of its Composition, the patient, the author's role, the orders and the answers to a form, whose Questionnaire is named here by its canonical ([0009](../decisions/0009-a-ch-orf-document-is-the-hosts-referral-in-ch-core-and-ch-orf-the-questionnaire-by-canonical-and-swiss-identifiers-checked-here.md)) |
| **CH Term** | HL7 Switzerland's terminology guide, which CH Core declares by a range; CH Core and CH ORF bind codes to its value sets, a Composition's type and category among them |
| **Corpus** | What the validator gate judges: the packages' output of synthetic forms, submissions, a referral letter and synthetic referrals' CH ORF documents, the demo's among them, resources built by hand where no package builds one, and the resources broken on purpose. A conformance claim is about these resources and no other |
| **Demo** | `apps/demo`, the one page of this repository's, at formancy.ai/health/: the sample filled in a visitor's browser and what the packages make of it there. Not the product, and in no release ([0012](../decisions/0012-a-demo-at-formancy-ai-health-fills-a-synthetic-referral-in-the-browser-served-by-a-worker-of-its-own.md)) |
| **Developer preview** | What 0.1.0 is: the packages published for a vendor to evaluate and build against, before the legal review and the gates a production export waits for ([README](../../README.md#what-010-is)) |
| **Document** | A Bundle of type `document`: the Composition first, then only what it refers to, every reference resolved ([0008](../decisions/0008-a-document-is-a-bundle-of-what-it-refers-to-and-a-pdf-its-own-bytes-never-an-unproved-pdf-a.md)) |
| **enableWhen** | R4's condition on a Questionnaire item, which a formancy visible or skip rule becomes where the two say the same thing, and which the response reads as the HL7 FHIR validator reads it |
| **FhirNumber** | A FHIR decimal or integer type held as its type and its text, never as a JavaScript number ([0004](../decisions/0004-fhir-json-is-written-and-read-exactly-with-primitives-of-its-own.md)) |
| **Gate** | A job in `gates.yml`: what CI runs on a pull request and a release before it publishes. A guard that is not in one is a comment |
| **GLN** | GS1's Global Location Number, under CH Core's system `urn:oid:2.51.1.3`: thirteen digits, the last GS1's check digit. A Swiss one starts 76; the corpus's are under GS1's prefix 952, for examples ([0009](../decisions/0009-a-ch-orf-document-is-the-hosts-referral-in-ch-core-and-ch-orf-the-questionnaire-by-canonical-and-swiss-identifiers-checked-here.md)) |
| **Guard** | A test of the repository rather than of a package, in `pnpm test:repo` |
| **Host** | The vendor's application that calls the packages: its composition root supplies identity, names, versions and time, and it sends what it gets back |
| **Implementation guide** | A publication that profiles FHIR for a use or a country -- SDC, CH Core, CH ORF -- loaded by the validator as a package |
| **Intended purpose** | What its maker says a product is for, by which the MDR and the MepV judge whether it is a medical device; here the README's [section](../../README.md#intended-purpose), holding CLAUDE.md's sentence that the product is not intended as one, which no lawyer has read yet ([0011](../decisions/0011-a-release-report-is-derived-from-the-run-that-gated-it.md)) |
| **linkId** | A Questionnaire item's identity, here the formancy field's key ([0006](../decisions/0006-a-formancy-form-is-an-sdc-questionnaire-refused-whole-where-it-cannot-be-one.md)) |
| **LOINC** | Regenstrief's code system, of which health-ch writes 93037-0, which CH ORF fixes for the order-referral section, with its long common name; its licence asks that name and its notice ([0009](../decisions/0009-a-ch-orf-document-is-the-hosts-referral-in-ch-core-and-ch-orf-the-questionnaire-by-canonical-and-swiss-identifiers-checked-here.md)) |
| **Narrative** | A resource's `text`, R4's XHTML for a person to read. Only a document's Composition carries one here, `generated`, of its title and its sections' titles, made here and never taken from a host ([0009](../decisions/0009-a-ch-orf-document-is-the-hosts-referral-in-ch-core-and-ch-orf-the-questionnaire-by-canonical-and-swiss-identifiers-checked-here.md)) |
| **Nominative** | Naming FHIR to refer to the standard itself, which HL7 allows; naming a product with it is not ([0003](../decisions/0003-the-product-name-carries-no-hl7-mark.md)) |
| **Offline** | The validator run with no terminology server and no HTTP at all: `-tx n/a -txCache n/a -no-http-access` |
| **Path** | Where a refusal points, from the input's root: `form.model.fields[2].step`, `answers.contact.phone`, `context.entries[2].resource.subject` |
| **Profile** | What a resource claims to conform to, in `meta.profile`; for a PDF, what the host declares it to be -- `PDF`, or a PDF/A level, which is refused |
| **Proved** | Of a PDF profile: shown by a gate to be what a producer makes. Nothing here proves PDF/A ([0008](../decisions/0008-a-document-is-a-bundle-of-what-it-refers-to-and-a-pdf-its-own-bytes-never-an-unproved-pdf-a.md)) |
| **Read-out** | The demo's reading of its Questionnaire, above its JSON: each item's text in the page's language, its linkId, type, options and conditions, read from the resource's own bytes and never from the form; not a renderer, and it validates nothing ([0013](../decisions/0013-the-demo-reads-its-questionnaire-out-from-the-bytes-it-shows-and-renders-no-questionnaire.md)) |
| **Refusal** | health-core's one error: a rule, a path, and never a value. An export answers with every refusal it found, at once, or with the resource |
| **Register** | A file in `docs/release/`: the two the validator gate runs on, which pin by SHA-256 the validator release and every package it loads; and the two the release report reads, the release gates and the known limitations, held to the records by hash |
| **Release report** | What a run of the gates was tested on and found, its release gates and its limitations, built by the `report` job from every other job's results and failing the run on its problems; attached, signed, to a release ([0011](../decisions/0011-a-release-report-is-derived-from-the-run-that-gated-it.md)) |
| **Room**, **workbench** | formancy.ai's admin colours, which no formancy release ships yet, and the bench formancy's tools sit on, which `@formancy/themes` 0.5.0 ships as its workbench stylesheet: the demo wears the workbench, with Blueprint, until a release ships the room ([0012](../decisions/0012-a-demo-at-formancy-ai-health-fills-a-synthetic-referral-in-the-browser-served-by-a-worker-of-its-own.md)) |
| **Sample** | The demo's synthetic referral, `scripts/validator/demo-referral.mjs`: the form, its answers and the referral, judged by the validator gate as corpus entries, which every build of the demo holds its first resources to, byte for byte ([0012](../decisions/0012-a-demo-at-formancy-ai-health-fills-a-synthetic-referral-in-the-browser-served-by-a-worker-of-its-own.md)) |
| **SDC** | HL7's Structured Data Capture guide, which profiles Questionnaire and QuestionnaireResponse |
| **Skip rule**, **visible rule**, **computed rule** | formancy's rule kinds that map: a page walked past, a field shown or hidden, a field's value from an expression. Every other kind is refused |
| **Unanswered** | formancy's "no answer": absent, null, a text that trims to nothing, an empty list, and for a checkbox anything but a tick. A response follows it, except that a checkbox's false is written as an answer. Restated here, since formancy's engine is no dependency ([0007](../decisions/0007-a-formancy-submission-is-a-questionnaireresponse-of-the-same-mapping-refused-whole-where-an-answer-cannot-be-one.md)) |

## Collisions worth flagging

**"Validator"** names formancy's `validateSchema`, which decides what a
form means before it is mapped, and the HL7 FHIR validator, which judges
what the packages wrote. Neither is the other, and the documents say which.

**"Version"** names a form's spec version, which says what its document
format means; the number formancy published a form as, which becomes the
Questionnaire's version; the FHIR release a resource is written for,
health-core's `FHIR_VERSION`; and the packages' npm version, one number
across them, which changes independently of the others.
