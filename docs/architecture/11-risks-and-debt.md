# 11. Risks and technical debt

Written so that a reader can tell what is known and accepted from what is
merely not done yet.

## 11.1 Where the accepted costs are written

There is no limitations register here. Formancy Report keeps
[one](https://github.com/sharkysan/formancy.ai-report/blob/main/docs/release/limitations.json)
beside its release report, which reads it
([formancy.ai-report 0014](https://github.com/sharkysan/formancy.ai-report/blob/main/docs/decisions/0014-a-release-report-is-derived-from-the-run-that-gated-it.md));
this repository has neither yet. Until it does, each record's **What it
costs** paragraph is the register of what a host, an integrator or an
operator meets, and this section names the larger costs without restating
them.

## 11.2 The larger accepted risks

| Risk | Why it is accepted | Record |
|---|---|---|
| **The licence is in force before a lawyer has read it** | It states the terms carefully and says at the top that nobody reviewed it; a customer's production agreement governs, and the first paid release waits for the review | [0001](../decisions/0001-a-paid-module-in-its-own-repository.md) |
| **The trademark position is the maintainer's reading of HL7's pages** | Its conditions could not all be read, and whether the marks are protected in Switzerland was not checked; a trademark lawyer's review is owed before the first paid release | [0003](../decisions/0003-the-product-name-carries-no-hl7-mark.md) |
| **Codes outside the registered packages are not checked** | Offline is what makes a verdict the same on every machine and sends nobody's record to a public server. Once a terminology's warning is registered, every such code passes, a made-up one too | [0005](../decisions/0005-a-fhir-resource-is-proved-by-the-hl7-validator-against-pinned-guide-packages.md) |
| **The validator's formats are not a contract, and a ballot is pinned** | Message ids, the `Package Summary` line and the outcome's extensions are what the gate reads; a release that changes one fails the gate loudly. SDC declares a ballot of the R4 extensions, so the register holds it | [0005](../decisions/0005-a-fhir-resource-is-proved-by-the-hl7-validator-against-pinned-guide-packages.md) |
| **Forms and submissions formancy accepts are refused here** | A pattern, a mask, a step other than one, a rule beyond a simple comparison; a value formancy's engine stored of another type. Exporting them would say less than the form, which nothing downstream could see | [0006](../decisions/0006-a-formancy-form-is-an-sdc-questionnaire-refused-whole-where-it-cannot-be-one.md), [0007](../decisions/0007-a-formancy-submission-is-a-questionnaireresponse-of-the-same-mapping-refused-whole-where-an-answer-cannot-be-one.md) |
| **formancy's meaning is read twice** | The form through its validator and not its engine, so a form the engine would refuse can be exported; and its `unanswered` restated here, so nothing fails when formancy's next release changes it. The next adoption of `@formancy/*` must read both again | [0006](../decisions/0006-a-formancy-form-is-an-sdc-questionnaire-refused-whole-where-it-cannot-be-one.md), [0007](../decisions/0007-a-formancy-submission-is-a-questionnaireresponse-of-the-same-mapping-refused-whole-where-an-answer-cannot-be-one.md) |
| **The exactness of an answer is the double's** | formancy stores a number answer as a JSON number; the response is exactly what formancy stored, and not what a person typed | [0007](../decisions/0007-a-formancy-submission-is-a-questionnaireresponse-of-the-same-mapping-refused-whole-where-an-answer-cannot-be-one.md) |
| **A plain PDF is not proved to be one, and there is no PDF/A** | The first and last lines tell a PDF from an error page or a cut download, and nothing more; parsing untrusted PDFs is attack surface the package does not need | [0008](../decisions/0008-a-document-is-a-bundle-of-what-it-refers-to-and-a-pdf-its-own-bytes-never-an-unproved-pdf-a.md) |
| **Code a platform would have provided is maintained here** | A parser and a writer of FHIR JSON, the resource types, SHA-1 and base64. SHA-1 is held to FIPS's examples and Node's digests, and base64 to RFC 4648's vectors and Node's decoding; the parser and the writer to their own tests and the exactness corpus; the resource types to tsc and, where tsc cannot see, to the validator gate alone | [0004](../decisions/0004-fhir-json-is-written-and-read-exactly-with-primitives-of-its-own.md), [0008](../decisions/0008-a-document-is-a-bundle-of-what-it-refers-to-and-a-pdf-its-own-bytes-never-an-unproved-pdf-a.md) |
| **The Questionnaire is not in a CH ORF document, against two of CH ORF's SHALLs** | Its profile allows the Bundle without it; the response names it by its versioned canonical, which the host publishes, and a receiver that follows the prose resolves it there. Carrying it is possible later | [0009](../decisions/0009-a-ch-orf-document-is-the-hosts-referral-in-ch-core-and-ch-orf-the-questionnaire-by-canonical-and-swiss-identifiers-checked-here.md) |
| **A narrative of titles, short of R4's definition of one** | CH ORF requires a Composition's narrative, and one made of a person's values would be a second rendering nothing checks against them; a host's XHTML would need a reader of R4's markup. A viewer that shows only the narrative shows a title and a section's | [0009](../decisions/0009-a-ch-orf-document-is-the-hosts-referral-in-ch-core-and-ch-orf-the-questionnaire-by-canonical-and-swiss-identifiers-checked-here.md) |
| **A CC-BY-4.0 package in the gate** | There is no CH Core without IHE's formatCode package; the gate downloads it and no package carries it. A new version of it, or another CC-BY package, is a decision again | [0009](../decisions/0009-a-ch-orf-document-is-the-hosts-referral-in-ch-core-and-ch-orf-the-questionnaire-by-canonical-and-swiss-identifiers-checked-here.md) |
| **No AHV number the gate should accept, and no valid one in any file** | One that passes its check may be a person's, and none is reserved for tests, so that a valid number is held to its system rests on health-ch's tests | [0009](../decisions/0009-a-ch-orf-document-is-the-hosts-referral-in-ch-core-and-ch-orf-the-questionnaire-by-canonical-and-swiss-identifiers-checked-here.md) |
| **`gln-startswith76` is accepted by its id everywhere** | As every registered warning is; the corpus's GLNs are under GS1's prefix for examples, and a GLN under a Swiss prefix in the corpus would never be refused for it | [0009](../decisions/0009-a-ch-orf-document-is-the-hosts-referral-in-ch-core-and-ch-orf-the-questionnaire-by-canonical-and-swiss-identifiers-checked-here.md) |
| **Hosts the generic packages took are refused where they were not** | health-questionnaire and health-document now refuse a member of their context they do not name, a context that is no object, and a hole in a list: a host whose value was dropped is now told | [0009](../decisions/0009-a-ch-orf-document-is-the-hosts-referral-in-ch-core-and-ch-orf-the-questionnaire-by-canonical-and-swiss-identifiers-checked-here.md) |
| **Much of CH ORF is not offered** | Receivers, contacts, a PDF, addresses, telecoms and the rest 0009 lists are refused, not left out, so a host that has one cannot send it yet | [0009](../decisions/0009-a-ch-orf-document-is-the-hosts-referral-in-ch-core-and-ch-orf-the-questionnaire-by-canonical-and-swiss-identifiers-checked-here.md) |
| **A host's text is held stricter than R4** | health-core's `text` refuses characters R4 says only that a string SHOULD not hold, which no XML form of a resource carries; a receiver may take a name health-ch refuses | [0009](../decisions/0009-a-ch-orf-document-is-the-hosts-referral-in-ch-core-and-ch-orf-the-questionnaire-by-canonical-and-swiss-identifiers-checked-here.md) |
| **CH Term at the release CH Core's range answers** | The validator cannot load CH Core otherwise; a receiver with a newer CH Term may judge a host's codes otherwise | [0009](../decisions/0009-a-ch-orf-document-is-the-hosts-referral-in-ch-core-and-ch-orf-the-questionnaire-by-canonical-and-swiss-identifiers-checked-here.md) |
| **One maintainer, and no required status check** | Stated in [`GOVERNANCE.md`](../../GOVERNANCE.md): a red check is stopped by a maintainer reading it, not by the ruleset | -- |

## 11.3 Known debt

- **No release report**, which [`RELEASING.md`](../../RELEASING.md) says
  arrives before the first release with the gates it reports on; **and no
  limitations register**, above, which nothing here plans yet.
- **The SBOM is made from the workspace**, by cdxgen reading the checkout,
  where Formancy Report makes its own from the pinned tarballs installed
  outside the checkout; [`release.yml`](../../.github/workflows/release.yml)
  says that change arrives with the first release.
- **The validator's runner, corpus and registers live in `scripts/` and
  `docs/release/`**, where 0005 and 0006 expected health-corpus to hold them;
  the move is not clean, and 0008 says why it is not made.
- **Actions taken by tag, not by commit**: `security.yml`'s, CodeQL's among
  them, and GitHub's own, of its `actions` organisation, in `gates.yml` and
  `release.yml`, but for the validator job's `setup-java`.
  [`workflows.test.mjs`](../../scripts/workflows.test.mjs) holds the
  third-party pins of `gates.yml` and `release.yml` alone, since no release
  runs `security.yml` ([`CLAUDE.md`](../../CLAUDE.md#checks-before-pushing)).
- **Settings nothing in the repository can read**: that a merged branch is
  deleted by the merge, `main`'s ruleset, and the `npm` environment's
  policy of `v*` tags alone, which keeps the npm token from any other ref.
  [`.github/REPO-METADATA.md`](../../.github/REPO-METADATA.md) records
  them, and review holds them.
- **Held by review alone**: that nothing calls the product open source; that
  no prose uses FHIR as a brand; that no fixture holds a real person's data;
  that no test mocks the validator; that no item computes a clinical result;
  that an AHV number a test computes in memory, and a GLN written outside
  the corpus, are nobody's.
- **Two passes for two kinds of fault.** health-document is asked only of a
  context health-ch accepts, so a context wrong in both ways is refused for
  each on a different attempt, and a name given to two entries is looked
  for only once every part was read
  ([§6.4](06-runtime-view.md#64-a-referral-becomes-a-ch-orf-document),
  [0009](../decisions/0009-a-ch-orf-document-is-the-hosts-referral-in-ch-core-and-ch-orf-the-questionnaire-by-canonical-and-swiss-identifiers-checked-here.md)).
- **Not judged by the gate for a Swiss host**: the codes it sends at a
  Composition's type and category, and an AHV number it should accept
  ([§10.3](10-verification.md#103-what-a-conformance-claim-covers)).
- **Not checked in FHIR JSON yet**: a lone surrogate, a string past R4's
  1 MB, a null in an array that lines nothing up, and a uri beyond its
  permissive regex
  ([0004](../decisions/0004-fhir-json-is-written-and-read-exactly-with-primitives-of-its-own.md)).
- **No time budget for the gate**: each run of the `validator` job writes
  its own time, and nothing reads the time or fails on it; the job's
  timeout is the only bound ([§9.3](09-quality-requirements.md#93-budgets)).
  With the Swiss guides loaded, the runs 0009 measured on one machine
  spread widely, unexplained, and no CI runner has been measured with them
  ([0009](../decisions/0009-a-ch-orf-document-is-the-hosts-referral-in-ch-core-and-ch-orf-the-questionnaire-by-canonical-and-swiss-identifiers-checked-here.md)).

## 11.4 Open, and planned

What the README lists as planned and not here: extraction from a
QuestionnaireResponse, PDF/A once Report writes it, the MHD provide Bundle
and CH EPR, and of CH ORF the Questionnaire inside the Bundle, a PDF and
the Composition's receivers, contacts and other extensions; then Germany's,
the United Kingdom's, Austria's and HL7 Europe's. Each comes with the
record that decides its guide's version and what its package may import.
A package not named in [§5](05-building-blocks.md), or a record linked from no section, fails
[`scripts/architecture.test.mjs`](../../scripts/architecture.test.mjs)
([0010](../decisions/0010-the-architecture-is-documented-in-arc42s-sections-held-to-the-repository-by-a-guard.md));
that the record is linked from the section it changes is review's.

Open, and the maintainer's to ask ([0009](../decisions/0009-a-ch-orf-document-is-the-hosts-referral-in-ch-core-and-ch-orf-the-questionnaire-by-canonical-and-swiss-identifiers-checked-here.md)):

- **Numbers to test with.** Whether the ZAS names AHV numbers for software
  vendors to test with. Until it does, the corpus holds none the gate
  should accept. The ordinance's text, AHVV Art. 133, was not read for
  0009.
- **SNOMED CT.** Whether a SNOMED CT constant in this repository needs an
  affiliate licence is eHealth Suisse's question, to be asked before H10,
  as the plan has it. Until it is answered, no package writes one and the
  corpus holds none.
