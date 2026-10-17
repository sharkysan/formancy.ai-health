# 2. Constraints

Constraints, unlike decisions, were not chosen. They are recorded because
several records in [`../decisions/`](../decisions/README.md) look arbitrary
without them.

## Technical constraints

| Constraint | Consequence |
|---|---|
| **FHIR JSON's numbers keep their digits; JavaScript's do not** | R4 says 0.010 and 0.01 differ, and `JSON.parse` and a double keep neither a trailing zero nor more than about seventeen digits. So health-core has a writer and a parser of its own, and a FHIR number is its text ([0004](../decisions/0004-fhir-json-is-written-and-read-exactly-with-primitives-of-its-own.md)) |
| **formancy holds numbers as doubles** | `@formancy/spec` types a bound as a JSON number, and formancy's engine holds a number answer as a double -- the spec types no submission -- so `70.50` typed is 70.5 before anything here sees it. A response holds exactly the double formancy stored, and no digit more ([0006](../decisions/0006-a-formancy-form-is-an-sdc-questionnaire-refused-whole-where-it-cannot-be-one.md), [0007](../decisions/0007-a-formancy-submission-is-a-questionnaireresponse-of-the-same-mapping-refused-whole-where-an-answer-cannot-be-one.md)) |
| **formancy's rules are CEL; R4's conditions are `enableWhen`** | Only a simple comparison means the same in both, so a visible or a skip rule is mapped only where it is one, a computed rule only as its field made read-only, and every other rule is refused; no FHIRPath is written ([0006](../decisions/0006-a-formancy-form-is-an-sdc-questionnaire-refused-whole-where-it-cannot-be-one.md)) |
| **The HL7 FHIR validator reads `enableWhen` its own way** | `!=` with its question unanswered disables an item there, and a repeating group's minimum is counted against each row's answers. The mapping is written so the validator's reading and formancy's agree, or refuses ([0007](../decisions/0007-a-formancy-submission-is-a-questionnaireresponse-of-the-same-mapping-refused-whole-where-an-answer-cannot-be-one.md)) |
| **Formancy Report, at the release health-corpus renders with, writes no PDF/A** | Every PDF/A declaration is refused, and so no CH EPR or ePA document, which ask for one, nor CH ORF's original representation of a referral, a PDF/A, can be built yet ([0008](../decisions/0008-a-document-is-a-bundle-of-what-it-refers-to-and-a-pdf-its-own-bytes-never-an-unproved-pdf-a.md), [0002](../decisions/0002-depend-on-upstream-never-copy-it.md)) |
| **HL7 owns FHIR's name** | HL7 lets anybody name the standard and nobody name a product with its marks without a Product License, which was not sought. The product is Formancy Health, and FHIR names only the standard ([0003](../decisions/0003-the-product-name-carries-no-hl7-mark.md)) |
| **The HL7 FHIR validator is a Java program, online by default** | The gate runs it in CI and by hand, never in a package, on a Java at least as new as its register asks, offline, against packages fetched by registered hash ([0005](../decisions/0005-a-fhir-resource-is-proved-by-the-hl7-validator-against-pinned-guide-packages.md)) |
| **Offline, a code is checked only against the code systems the registered packages hold** | A LOINC, SNOMED CT or UCUM code and a language tag pass the gate unchecked once their warning is registered, and a conformance claim says so ([0005](../decisions/0005-a-fhir-resource-is-proved-by-the-hl7-validator-against-pinned-guide-packages.md)); a made-up SNOMED CT code at a CH ORF Composition's type and category draws nothing at all ([0009](../decisions/0009-a-ch-orf-document-is-the-hosts-referral-in-ch-core-and-ch-orf-the-questionnaire-by-canonical-and-swiss-identifiers-checked-here.md)) |
| **CH Core's constraints on a GLN and an AHV number are warnings** | The validator raises a warning for a wrong form or check digit and no error, so a document with one would reach a receiver that routes or matches by it. health-ch refuses each itself ([0009](../decisions/0009-a-ch-orf-document-is-the-hosts-referral-in-ch-core-and-ch-orf-the-questionnaire-by-canonical-and-swiss-identifiers-checked-here.md)) |
| **CH Core declares CH Term by a range, and needs a package under CC-BY-4.0** | The gate loads the CH Term release that range answers, and not a newer one; and IHE's formatCode package, under a licence the dependency policy refuses, is admitted to the register for that one entry ([0009](../decisions/0009-a-ch-orf-document-is-the-hosts-referral-in-ch-core-and-ch-orf-the-questionnaire-by-canonical-and-swiss-identifiers-checked-here.md)) |
| **No AHV number is reserved for tests** | Any number that passes its check may be a person's, so no file holds one, the gate judges none it should accept, and a test that needs one computes it in memory ([0009](../decisions/0009-a-ch-orf-document-is-the-hosts-referral-in-ch-core-and-ch-orf-the-questionnaire-by-canonical-and-swiss-identifiers-checked-here.md)) |
| **LOINC's licence asks a code's name and its notice, and whether SNOMED CT's needs an affiliate licence here is unanswered** | The LOINC code health-ch writes, the one CH ORF fixes, carries its long common name, and `NOTICE` the notice; no SNOMED CT code is written ([0009](../decisions/0009-a-ch-orf-document-is-the-hosts-referral-in-ch-core-and-ch-orf-the-questionnaire-by-canonical-and-swiss-identifiers-checked-here.md)) |
| **A package names no Node or DOM API** | The published packages compile against the ECMAScript library alone, and no `@types/node` ([`tsconfig.base.json`](../../tsconfig.base.json)); health-corpus alone is given Node's. A `Buffer`, `process`, `document`, `fetch`, `console` or `setTimeout` named in one is a compile error in `pnpm typecheck`: each was planted in each published package and refused on 17 October 2026. A global reached by a cast through `globalThis` is not seen, and is review's. So SHA-1 and base64 are written here, not taken from Node or the browser ([0008](../decisions/0008-a-document-is-a-bundle-of-what-it-refers-to-and-a-pdf-its-own-bytes-never-an-unproved-pdf-a.md)). The packages are run under Node alone, by the install gate; that they run in a browser, or in another engine, is not claimed ([§7](07-deployment-view.md#where-it-runs-inside-the-host)). The rule is formancy's ([formancy.ai 0008](https://github.com/sharkysan/formancy.ai/blob/main/docs/decisions/0008-layered-packages.md)) |
| **TypeScript is pinned to the line formancy.ai compiles under** | So one version spans the repositories. The version is in the README's [table](../../README.md#what-it-is-built-and-judged-against), derived from [`pnpm-workspace.yaml`](../../pnpm-workspace.yaml)'s catalog, whose comment gives the reason |

## Organisational constraints

| Constraint | Consequence |
|---|---|
| **One maintainer, who is the rightsholder** | Said plainly in [`GOVERNANCE.md`](../../GOVERNANCE.md), which also says that `main`'s ruleset requires no status check: what stops a red one being merged is a maintainer reading it |
| **Paid, source-available, in its own repository** | Production use needs a licence; contributions come under a CLA; the dependencies a published package may take are narrowed to permissive licences ([0001](../decisions/0001-a-paid-module-in-its-own-repository.md)) |
| **The licence and the name rest on no lawyer's review yet** | The licence is in force and says so at the top; the trademark position is the maintainer's reading of HL7's pages. Both reviews are owed before the first paid release ([0001](../decisions/0001-a-paid-module-in-its-own-repository.md), [0003](../decisions/0003-the-product-name-carries-no-hl7-mark.md)) |
| **The upstream repositories, depended on and never copied** | An improvement to formancy or Report goes through that repository and waits for its release, a stylesheet included ([0002](../decisions/0002-depend-on-upstream-never-copy-it.md)) |

## Conventions

- ESM only, with `NodeNext` resolution; `check:pkg` runs `attw` with its
  `esm-only` profile on each published package.
- `strict`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes` and
  `erasableSyntaxOnly`, from [`tsconfig.base.json`](../../tsconfig.base.json).
- One version number across the packages, moved by
  [`scripts/bump.mjs`](../../scripts/bump.mjs). The FHIR release the
  resources are written for is a separate line, health-core's
  `FHIR_VERSION`, and changing it is a breaking change.
- [`.npmrc`](../../.npmrc) installs with `node-linker=isolated`: a package
  resolves only what its manifest declares, which is what
  [§5](05-building-blocks.md#what-holds-the-layers) rests the layers on.
