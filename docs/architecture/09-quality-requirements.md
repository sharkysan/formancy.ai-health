# 9. Quality requirements

Each requirement here is stated so that it can fail, and names what fails.
A quality goal nothing can fail is a preference.

## 9.1 Quality tree

```
Formancy Health
├── Faithful
│   ├── nothing dropped, approximated or guessed       ← nothing silent
│   ├── a response cannot disagree with its Questionnaire
│   ├── a Swiss identifier held to its check digit
│   └── every digit, both ways                          ← every digit
├── Proved
│   ├── the validator judges what a package wrote       ← proved on the output
│   └── a check that never fails is found out
├── Private
│   ├── no value in a refusal                           ← health data in the output
│   ├── no valid AHV number in any file
│   └── no log, no network
├── Reproducible
│   └── the same input, the same bytes                  ← the host's identity and time
└── Honest about itself
    ├── its licence, in every tarball                   ← the terms say what they are
    ├── no HL7 mark in a name
    ├── a code only of a terminology whose terms allow it
    └── its architecture's names and links, true of the repository
```

## 9.2 Scenarios, with what holds each

| # | Scenario | Measure | Held by |
|---|---|---|---|
| Q1 | A decimal `0.10`, `-0.0` or a thirty-digit value goes through `decimal()` or `readJson`, then `writeJson` | The same digits come out, and the same input gives byte-identical JSON | [`exactness.test.ts`](../../packages/health-core/src/exactness.test.ts) |
| Q2 | A published package's source gains `Number(text)`, a unary plus, `Date.now()` or `Math.random()` | `pnpm test:repo` fails, naming the file | [`exact-and-reproducible.test.mjs`](../../scripts/exact-and-reproducible.test.mjs) |
| Q3 | A form holds a field type, a constraint or a rule an item cannot say, or lacks a translation asked for | No Questionnaire; every refusal at once, each at its path | [`items.test.ts`](../../packages/health-questionnaire/src/items.test.ts), [`conditions.test.ts`](../../packages/health-questionnaire/src/conditions.test.ts), [`texts.test.ts`](../../packages/health-questionnaire/src/texts.test.ts) |
| Q4 | A form of a spec version the package does not map, under a context that is right or wrong | Refused at `form.specVersion`, the form's only refusal; a wrong context's refusals before it | [`questionnaire.test.ts`](../../packages/health-questionnaire/src/questionnaire.test.ts) |
| Q5 | A submission holds a value of another type, an option not offered, or a value on an item a visible rule hides | No response; `answer-type`, `option` or `disabled` at its path | [`answers.test.ts`](../../packages/health-questionnaire/src/answers.test.ts), [`response.test.ts`](../../packages/health-questionnaire/src/response.test.ts) |
| Q6 | A document holds a reference to nothing, an entry nothing reaches, or an attachment whose size or hash is another PDF's | No Bundle; `dangling`, `unreferenced` or `mismatch` | [`bundle.test.ts`](../../packages/health-document/src/bundle.test.ts), health-corpus's [`documents.test.ts`](../../packages/health-corpus/src/documents.test.ts) |
| Q7 | A PDF is declared PDF/A | Refused, `unproved`: nothing writes a PDF/A claim | health-document's [`pdf.test.ts`](../../packages/health-document/src/pdf.test.ts), health-corpus's [`pdf.test.ts`](../../packages/health-corpus/src/pdf.test.ts), the install gate |
| Q8 | The PDF Report renders is attached, written, and read back from the JSON text | Every byte, by Node's own base64, with Node's SHA-1 and size | [`documents.test.ts`](../../packages/health-corpus/src/documents.test.ts) |
| Q9 | Any refusal, over synthetic values a message could carry | No value in its message | [`refusal.test.ts`](../../packages/health-core/src/refusal.test.ts) and each export's tests ([§8.3](08-crosscutting-concepts.md#83-health-data-stays-in-the-output)) |
| Q10 | What a package writes of the corpus is judged by the HL7 FHIR validator | No error, and no warning that is not registered with its reason | the `validator` job ([0005](../decisions/0005-a-fhir-resource-is-proved-by-the-hl7-validator-against-pinned-guide-packages.md)) |
| Q11 | A resource broken on purpose is accepted, or refused for something else | The gate fails: nothing would be watching that rule | the `validator` job; [`judge.test.mjs`](../../scripts/validator/judge.test.mjs) |
| Q12 | A field type, item type, answer type or resource type a package writes stands in no corpus resource | `pnpm test:repo` fails, naming it | [`corpus.test.mjs`](../../scripts/validator/corpus.test.mjs) |
| Q13 | A validator JAR or a guide package whose bytes are not the registered ones | Refused before anything runs it | [`cache.test.mjs`](../../scripts/validator/cache.test.mjs); the `validator` job |
| Q14 | The validator tries to reach the network | Refused; the run stops on a package it could not load | the options [`validator.test.mjs`](../../scripts/validator.test.mjs) holds; observed in [0005](../decisions/0005-a-fhir-resource-is-proved-by-the-hl7-validator-against-pinned-guide-packages.md) |
| Q15 | A published package's exports map is wrong for a consumer, or its declarations admit a JavaScript number as FHIR JSON | The install gate fails, type-checking with `skipLibCheck` off | `pnpm test:e2e:install`, [`consume.ts`](../../scripts/install-fixture/consume.ts) |
| Q16 | A published package names a Node or DOM global, or imports what its manifest does not declare | `pnpm typecheck` fails | [§2](02-constraints.md#technical-constraints), [§5](05-building-blocks.md#what-holds-the-layers) |
| Q17 | A manifest declares Apache-2.0, or a tarball lacks `LICENSE.md` or `NOTICE` | Refused | [`verify-licenses.mjs`](../../scripts/verify-licenses.mjs) |
| Q18 | A package's name, the licence's title or the README's heading takes `fhir` or `hl7`; HL7's notice loses a word in `NOTICE`, the README or a published package's README | `pnpm test:repo` fails | [`trademark.test.mjs`](../../scripts/trademark.test.mjs) |
| Q19 | An upstream `@formancy/*` dependency is a range or a link | `pnpm test:repo` fails | [`upstream-deps.test.mjs`](../../scripts/upstream-deps.test.mjs) |
| Q20 | A source file passes 600 lines | `pnpm test:repo` fails, naming it | [`source-size.test.mjs`](../../scripts/source-size.test.mjs) |
| Q21 | A package is added, or a record written, that this architecture does not place; a link here, or a file it names as code, goes stale | `pnpm test:repo` fails | [`architecture.test.mjs`](../../scripts/architecture.test.mjs) |
| Q22 | A GLN or an AHV number with a wrong check digit, an AHV number with points, or a host's own number under one of CH Core's Swiss systems | No document; `check-digit` or `identifier`, naming no digit | health-ch's [`identifiers.test.ts`](../../packages/health-ch/src/identifiers.test.ts), [`people.test.ts`](../../packages/health-ch/src/people.test.ts) |
| Q23 | A host's context holds a member its package does not name, or a list with a hole | Refused: `unmapped` at the object that holds it, without the member's name, or `absent` at the index | health-core's [`host.test.ts`](../../packages/health-core/src/host.test.ts), health-document's [`bundle.test.ts`](../../packages/health-document/src/bundle.test.ts), health-questionnaire's [`response.test.ts`](../../packages/health-questionnaire/src/response.test.ts), health-ch's [`people.test.ts`](../../packages/health-ch/src/people.test.ts) |
| Q24 | The host's answers to a CH ORF document do not claim CH ORF's response profile, are not the patient's, or name their Questionnaire without its version | No document; `profile`, `reference` or `unversioned` | health-ch's [`response.test.ts`](../../packages/health-ch/src/response.test.ts) |
| Q25 | A file git holds or would add holds an AHV number that passes its check, however its digits are separated | `pnpm test:repo` fails | [`synthetic-identifiers.test.mjs`](../../scripts/synthetic-identifiers.test.mjs) |
| Q26 | The corpus writes a code under a system no register of its terms admits, a LOINC code unrecorded or without its recorded name, or a SNOMED CT code | `pnpm test:repo` fails | [`terminology.test.mjs`](../../scripts/terminology.test.mjs) |

## 9.3 Budgets

None is gated. Where a time is the point, the record that met it says how
it was measured, on what and when: the gate's run, with and without its
package cache, on the machine 0005 names, in [0005](../decisions/0005-a-fhir-resource-is-proved-by-the-hl7-validator-against-pinned-guide-packages.md)
to [0008](../decisions/0008-a-document-is-a-bundle-of-what-it-refers-to-and-a-pdf-its-own-bytes-never-an-unproved-pdf-a.md),
and the cost of holding a document's attachments to their bytes in 0008.
No record states a CI runner's time: each run of the `validator` job
writes its own into the verdict it uploads, at the path
[`scripts/validator.mjs`](../../scripts/validator.mjs)'s `RESULTS` names,
which the [README](../../README.md#what-it-is-built-and-judged-against)
says where to find, and nothing reads the time or fails on it. The job's timeout is a
bound for a bad day, and its comment says what it was set from.
