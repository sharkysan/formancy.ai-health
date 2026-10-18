# 1. Introduction and goals

## What Formancy Health is

A library that exports what formancy and Formancy Report hold to resources
in the HL7® FHIR® standard, shaped to the profiles a country publishes: a
formancy form as an SDC Questionnaire, a person's answers to it as a
QuestionnaireResponse, a PDF as a DocumentReference in a document
Bundle, and a referral as a CH ORF document in Switzerland's profiles. A
vendor's application calls it, gets FHIR JSON back and sends it
itself ([`CLAUDE.md`](../../CLAUDE.md#what-this-is-and-what-it-is-not)).

What it is not: an EHR, a FHIR server or a terminology service, or a
renderer of PDFs or of forms; and it is not intended as a medical device,
as the README's [intended purpose](../../README.md#intended-purpose) says
in CLAUDE.md's words, which no lawyer has read yet
([0011](../decisions/0011-a-release-report-is-derived-from-the-run-that-gated-it.md)).
Version 1's packages have no server, no page and no network. Beside them,
never published, is one page: the demo at formancy.ai/health/, which runs
the packages in a visitor's browser on the corpus's synthetic referral and
is not the product
([0012](../decisions/0012-a-demo-at-formancy-ai-health-fills-a-synthetic-referral-in-the-browser-served-by-a-worker-of-its-own.md)).

It is sold to the vendors whose software hospitals and practices run, to
ship inside their own products, on Formancy Data's and Formancy Report's
source-available terms, in a repository of its own so that formancy's
Apache-2.0 licence stays true without qualification. The whole export is
this product, the generic mapping of a form to the SDC guide included:
formancy itself exports nothing to FHIR
([0001](../decisions/0001-a-paid-module-in-its-own-repository.md)).

## Quality goals

They are not ranked: no record ranks them. Where two have met, the record
says which gave way. [0006](../decisions/0006-a-formancy-form-is-an-sdc-questionnaire-refused-whole-where-it-cannot-be-one.md)
refuses a form with a text missing in a language the host asked for, where
formancy would fall back to its default language: nothing silent over fewer
refusals.

| Goal | What it means concretely | Held by |
|---|---|---|
| **Nothing silent** | What a resource cannot say as the input says it refuses the whole export, with every refusal found, at once, each naming where ([§8.2](08-crosscutting-concepts.md#82-refusals) says what is read before what). Nothing is dropped, approximated or guessed | [0006](../decisions/0006-a-formancy-form-is-an-sdc-questionnaire-refused-whole-where-it-cannot-be-one.md), [0007](../decisions/0007-a-formancy-submission-is-a-questionnaireresponse-of-the-same-mapping-refused-whole-where-an-answer-cannot-be-one.md), [0008](../decisions/0008-a-document-is-a-bundle-of-what-it-refers-to-and-a-pdf-its-own-bytes-never-an-unproved-pdf-a.md), [0009](../decisions/0009-a-ch-orf-document-is-the-hosts-referral-in-ch-core-and-ch-orf-the-questionnaire-by-canonical-and-swiss-identifiers-checked-here.md); each package's tests |
| **Every digit** | A FHIR number is its text from the input to the output; no published package's source converts a value through a JavaScript number | [0004](../decisions/0004-fhir-json-is-written-and-read-exactly-with-primitives-of-its-own.md); [§9](09-quality-requirements.md) |
| **Proved on the output** | A conformance claim is the HL7 FHIR validator's verdict on the JSON a package wrote, offline, against pinned packages, and names the guide, the validator and the corpus, and nothing more | [0005](../decisions/0005-a-fhir-resource-is-proved-by-the-hl7-validator-against-pinned-guide-packages.md); [§10](10-verification.md) |
| **Health data in the output and nowhere else** | A refusal names a rule and a path, never a value; no package logs | [0004](../decisions/0004-fhir-json-is-written-and-read-exactly-with-primitives-of-its-own.md); [§8.3](08-crosscutting-concepts.md#83-health-data-stays-in-the-output) |
| **Identity and time are the host's** | Nothing makes an id or a timestamp, and an identifier is the host's or made of it -- a Questionnaire's url and its options' systems from the host's base and the form's id and keys -- so the same input gives the same bytes | [0004](../decisions/0004-fhir-json-is-written-and-read-exactly-with-primitives-of-its-own.md); [§8.6](08-crosscutting-concepts.md#86-the-same-input-the-same-bytes) |
| **The terms say what they are** | Source-available, never called open source; no HL7 mark in any name of the product | [0001](../decisions/0001-a-paid-module-in-its-own-repository.md), [0003](../decisions/0003-the-product-name-carries-no-hl7-mark.md); [§8.8](08-crosscutting-concepts.md#88-licences-marks-and-terminology) |

## Scope

**Built**, as the [README](../../README.md)'s status says: the FHIR R4
primitives and FHIR JSON, a formancy form as an SDC Questionnaire, a
submission as a QuestionnaireResponse, a PDF as a DocumentReference in a
document Bundle, a referral as a CH ORF document, its patient, author and
orders in CH Core's profiles and its GLN and AHV number held to their check
digits, and the gate that runs the HL7 FHIR validator over what the
packages write; and beside them the demo, which no release publishes,
with its browser gate. 0.1.0, a developer preview of the packages, was ready to tag
and not released on 17 October 2026: the README's [What 0.1.0 is](../../README.md#what-010-is)
says whom it is for, what it publishes and the gates it is held to.

**Not in 0.1.0**, as the README's [list](../../README.md#not-in-010) has
it: PDF/A, and with it the CH EPR's MHD document, which wait for a Report
release that writes PDF/A; extraction from a QuestionnaireResponse;
Germany's, the United Kingdom's, Austria's and HL7 Europe's profiles; file,
signature, ranking, matrix and rich-text items; FHIRPath anywhere; and of
CH ORF the Questionnaire inside the Bundle, a PDF and the Composition's
receivers, contacts and other extensions. Which version of a guide a
package targets is decided in the record that brings it.

**Out of version 1**: a server, a page among the packages, sending
anything, a terminology service, a browser as a host the packed packages
are claimed for -- the demo's gate runs them in Chromium, Firefox and
WebKit as the workspace builds them, not as a consumer installs them -- and
any clinical logic --
a score, a warning, a suggested therapy --
which would make the product a candidate medical device
([`CLAUDE.md`](../../CLAUDE.md#secrets-health-data-and-untrusted-input)).

## Stakeholders

| Stakeholder | What they need from the architecture |
|---|---|
| The vendor's developer, the host | Typed functions that answer a resource or every refusal, by rule and path, and take identity, versions and time from the host |
| The receiving system | Resources that are what they claim, and no claim beyond what a gate showed |
| The person whose record it is | Their data in the output and in no log, error or fixture |
| A form's author | Which part of a form cannot be exported, by its path, before a Questionnaire is sent anywhere |
| A visitor to the demo, deciding whether to build on it | What the packages make of a referral, and what they refuse, in a browser, with nothing they type sent or kept, no claim about the resources it shows beyond what a gate judged, and the licences of what it bundles beside it ([0012](../decisions/0012-a-demo-at-formancy-ai-health-fills-a-synthetic-referral-in-the-browser-served-by-a-worker-of-its-own.md)) |
| The rightsholder and a licensee | Terms that say what they are, no Apache-2.0 code copied into them, and no HL7 mark in a name |
| A contributor | Why the obvious simpler thing was not done: the records |
