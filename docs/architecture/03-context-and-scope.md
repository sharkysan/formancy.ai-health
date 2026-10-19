# 3. Context and scope

## Business context

```
                         the vendor's application: the host
   ┌──────────────────────────────────────────────────────────────────┐
   │  a formancy form ─────┐                                          │
   │  a submission ────────┤                                          │
   │  a referral's people, │                                          │
   │  orders, answers ─────┤                                          │
   │  a PDF's bytes ───────┼──▶  Formancy Health  ──▶  FHIR JSON  ────┼──▶ receiving
   │  names, identity,     │     health-core            or every      │    system,
   │  versions, the clock ─┘     health-questionnaire   refusal, by   │    by the host's
   │                             health-document        rule and path │    own transport
   │                             health-ch                            │
   └──────────────────────────────────────────────────────────────────┘
          ▲ @formancy/spec, exact           ▲ a PDF from Formancy Report,
          │ reads the form                  │ or from anywhere
```

| Party | Exchanges |
|---|---|
| **The host** | Calls the packages in its own process. Hands over a form, a submission, a PDF's bytes and the context: a canonical base, the version formancy published, a status, the languages, references by name, dates with their zone. Receives a resource, or every refusal. Sends, stores and signs what it receives, and verifies the identity it names ([`CLAUDE.md`](../../CLAUDE.md#secrets-health-data-and-untrusted-input)) |
| **formancy** | Defines the form: `@formancy/spec`, at an exact released version, its types and its own validator, which decides what a form means before anything here maps it ([0002](../decisions/0002-depend-on-upstream-never-copy-it.md), [0006](../decisions/0006-a-formancy-form-is-an-sdc-questionnaire-refused-whole-where-it-cannot-be-one.md)). A submission is formancy's engine's value, read as data: `@formancy/core` is no package's dependency ([0007](../decisions/0007-a-formancy-submission-is-a-questionnaireresponse-of-the-same-mapping-refused-whole-where-an-answer-cannot-be-one.md)); the demo's page alone draws a form with `@formancy/core` and `@formancy/react`, and wears `@formancy/themes`, each at an exact release (below) |
| **Formancy Report** | Renders the PDFs a document carries. No published package depends on it; the private health-corpus renders the corpus's PDF with its released packages ([0008](../decisions/0008-a-document-is-a-bundle-of-what-it-refers-to-and-a-pdf-its-own-bytes-never-an-unproved-pdf-a.md)). A host may attach a PDF from anywhere |
| **Formancy Data** | None. Its records reach Health through a host, or through a report Report rendered from them ([0002](../decisions/0002-depend-on-upstream-never-copy-it.md)) |
| **The receiving system** | Receives what the host sends. Nothing here sends anything, or knows who receives it |
| **HL7 Switzerland's guides** | CH Core, CH ORF and CH Term, which health-ch writes for and the gate loads, at the releases the README's [table](../../README.md#what-it-is-built-and-judged-against) names. CH Core declares CH Term by a range, so the gate loads the release that range answers and not a newer one; CH ORF is built on an earlier SDC release than the corpus's Questionnaires claim, and both load ([0009](../decisions/0009-a-ch-orf-document-is-the-hosts-referral-in-ch-core-and-ch-orf-the-questionnaire-by-canonical-and-swiss-identifiers-checked-here.md)) |
| **IHE** | Its formatCode package, which CH Term declares: under CC-BY-4.0, a licence the dependency policy refuses, admitted to the gate's register for that one entry, downloaded by the gate and carried by no package ([0009](../decisions/0009-a-ch-orf-document-is-the-hosts-referral-in-ch-core-and-ch-orf-the-questionnaire-by-canonical-and-swiss-identifiers-checked-here.md)) |
| **GS1, for the GLN** | Thirteen digits, the last GS1's check digit of the others, which health-ch computes, refusing a GLN whose last digit is another. GS1's prefix 952 is for examples, and the corpus's GLNs are under it, so that nobody holds them |
| **The ZAS, for the AHV number** | The AHVN13: 756, nine digits and GS1's check digit, written without points, as CH Term's NamingSystem has it. The BSV calls the numbers random and names no range for tests, so no file here holds one that passes its check; whether the ZAS names numbers for software vendors is an open question ([§11](11-risks-and-debt.md#114-open-and-planned)) |
| **Regenstrief, for LOINC** | health-ch writes LOINC's 93037-0, which CH ORF fixes for the order-referral section, with its LOINC long common name; LOINC's licence asks that, and its notice, which `NOTICE` and health-ch's README carry ([0009](../decisions/0009-a-ch-orf-document-is-the-hosts-referral-in-ch-core-and-ch-orf-the-questionnaire-by-canonical-and-swiss-identifiers-checked-here.md)) |
| **SNOMED CT** | None is written. A Composition's type and category are the host's, which CH Term binds to SNOMED CT value sets, sent under the host's own licence; whether a constant here would need an affiliate licence is eHealth Suisse's question ([0009](../decisions/0009-a-ch-orf-document-is-the-hosts-referral-in-ch-core-and-ch-orf-the-questionnaire-by-canonical-and-swiss-identifiers-checked-here.md)) |
| **HL7, and the guides' publishers** | Publish the standard and the implementation guides. Their packages are referenced and loaded by the gate, never redistributed; HL7's marks name the standard only ([0003](../decisions/0003-the-product-name-carries-no-hl7-mark.md), [0005](../decisions/0005-a-fhir-resource-is-proved-by-the-hl7-validator-against-pinned-guide-packages.md)) |

## Technical context

| Interface | Protocol | Notes |
|---|---|---|
| Packages → host | ESM imports, typed, synchronous calls. An export of health-questionnaire, health-document or health-ch answers `{ ok: true, … }` or `{ ok: false, refusals }`; health-core's primitives, `writeJson` and `readJson` throw a `Refusal` | Never both, and never a part of a resource |
| A form in | a formancy form document, of a spec version `@formancy/spec` reads | A version the mapping does not map is the form's only refusal; the host's context, checked first, is refused beside it ([0006](../decisions/0006-a-formancy-form-is-an-sdc-questionnaire-refused-whole-where-it-cannot-be-one.md), [§8.2](08-crosscutting-concepts.md#82-refusals)) |
| A referral in | the host's `ChOrfContext`: the Composition's values, the patient, the author with their practitioner and organisation, the orders, and the answers `toQuestionnaireResponse` wrote, claiming CH ORF's response profile; each entry named by the host's `urn:uuid:` | A member it does not name is refused, never left out; health-document is asked only of a context health-ch accepted ([0009](../decisions/0009-a-ch-orf-document-is-the-hosts-referral-in-ch-core-and-ch-orf-the-questionnaire-by-canonical-and-swiss-identifiers-checked-here.md), [§6.4](06-runtime-view.md#64-a-referral-becomes-a-ch-orf-document)) |
| Bytes in | a `Uint8Array` | Anything else is refused as `not-bytes`, a PDF's text included ([0008](../decisions/0008-a-document-is-a-bundle-of-what-it-refers-to-and-a-pdf-its-own-bytes-never-an-unproved-pdf-a.md)) |
| FHIR JSON out, and back in | text, by health-core's `writeJson` and `readJson` | Never `JSON.stringify` or `JSON.parse`, which lose digits and a name given twice ([0004](../decisions/0004-fhir-json-is-written-and-read-exactly-with-primitives-of-its-own.md)) |
| The gate → GitHub's releases and packages.fhir.org | HTTPS downloads by exact version, refused unless the SHA-256 is the registered one | In CI and by hand only; never from a package ([0005](../decisions/0005-a-fhir-resource-is-proved-by-the-hl7-validator-against-pinned-guide-packages.md)) |
| The validator → anything | none: `-tx n/a -txCache n/a -no-http-access` | No terminology server and no HTTP at all. A request the validator tries is refused, and the gate fails on a package it could not load ([0005](../decisions/0005-a-fhir-resource-is-proved-by-the-hl7-validator-against-pinned-guide-packages.md)) |

## The demo's context

The demo is a page beside the product, not a host of it
([0012](../decisions/0012-a-demo-at-formancy-ai-health-fills-a-synthetic-referral-in-the-browser-served-by-a-worker-of-its-own.md)):

```
   a visitor's browser                                    Cloudflare, formancy.ai's zone
   ┌───────────────────────────────────────────────┐     ┌──────────────────────────────┐
   │  the corpus's synthetic referral, from the    │ GET │  the demo's Worker: static   │
   │  build ──▶ formancy's React renderer 0.6.0 ──▶│◀────│  files, no code, at /health/ │
   │  engine.value() ──▶ health-questionnaire,     │     │  and /health, its headers    │
   │  health-ch, health-document ──▶ FHIR JSON,    │     │  from scripts/demo-headers   │
   │  shown and downloaded from memory             │     └──────────────────────────────┘
   │  the letter's PDF: bytes of the build         │       ▲ Workers Builds, from main
   └───────────────────────────────────────────────┘
          nothing typed goes anywhere: the policy allows the page no connection
```

| Party | Exchanges |
|---|---|
| **A visitor** | Opens the page, changes the sample's answers, downloads what the packages made. Sends nothing back: the page has no form that posts and no connection to make, and keeps nothing once it is closed |
| **Cloudflare** | Serves the build from a Worker of its own on formancy.ai's zone, beside formancy.ai's site and Formancy Report's Studio, and builds and deploys it from `main` with the settings `.github/REPO-METADATA.md` records. Sees each request, as any host of a page does; what the zone sets or measures on it, nothing here reads |
| **formancy** | Draws the form: `@formancy/core` and `@formancy/react` 0.6.0, and the workbench, formancy.ai's room and Blueprint of `@formancy/themes` 0.6.0, imported ([0015](../decisions/0015-the-demo-wears-formancy-ais-room-imported-from-formancy-0-6-0-and-the-packages-read-forms-through-the-same-release.md)) |
| **Formancy Report** | Renders the letter once, when the page is built, through health-corpus; its code is not in the page, and the page carries only the bytes `docs/release/letter.json` registers |

## What is deliberately outside the boundary

- **Sending, storing, signing.** A resource is built and handed back. The
  MHD provide Bundle, when it comes, is built and never sent (CLAUDE.md's
  package path), and a CH ORF document's Submit Bundle is the host's to
  make.
- **Identity.** A patient, a practitioner, an organisation and a tenant are
  the host's, named by reference; the host verifies them, and nothing from
  a browser decides anything here. A GLN and an AHV number are checked for
  their form and check digit, and never looked up.
- **Terminology.** No terminology server is called, and no SNOMED CT code
  is written. The LOINC code health-ch writes is the one CH ORF fixes, with
  its LOINC name and LOINC's notice; every other code is HL7's own, the host's
  or the form's, which
  [`scripts/terminology.test.mjs`](../../scripts/terminology.test.mjs)
  holds of the corpus ([0009](../decisions/0009-a-ch-orf-document-is-the-hosts-referral-in-ch-core-and-ch-orf-the-questionnaire-by-canonical-and-swiss-identifiers-checked-here.md)).
- **Rendering.** The PDF is the host's, and what its pages say is Report's
  to prove on the PDF ([formancy.ai-report 0003](https://github.com/sharkysan/formancy.ai-report/blob/main/docs/decisions/0003-a-rendered-report-is-proved-on-the-pdf-it-produced.md)).
  How a Questionnaire is drawn is its renderer's: widgets and layouts are
  not carried ([0006](../decisions/0006-a-formancy-form-is-an-sdc-questionnaire-refused-whole-where-it-cannot-be-one.md)).
- **Clinical meaning.** No item computes, warns or suggests. A customer's
  form is the customer's, and nothing here checks that it computes no
  clinical result.
- **A server for the demo.** The demo has none: it serves files and
  receives nothing a visitor types. A patient's real data has no place in
  it, which the page says, and it runs no validator on what is typed, which
  it says too. What Cloudflare's zone does with a request -- a cookie, a
  measurement, a script it adds -- is the zone's, and the page says nothing
  about it ([0012](../decisions/0012-a-demo-at-formancy-ai-health-fills-a-synthetic-referral-in-the-browser-served-by-a-worker-of-its-own.md)).
