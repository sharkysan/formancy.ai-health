# 11. Risks and technical debt

Written so that a reader can tell what is known and accepted from what is
merely not done yet.

## 11.1 Where the accepted costs are written

Each record's **What it costs** paragraph says what it costs; the
limitations register, [`limitations.json`](../release/limitations.json),
says in one sentence each what of it a host, an integrator or an operator
of a release meets, held to the records by hash, and every release report
prints it after the limitations its own run shows
([0011](../decisions/0011-a-release-report-is-derived-from-the-run-that-gated-it.md),
as [formancy.ai-report 0014](https://github.com/sharkysan/formancy.ai-report/blob/main/docs/decisions/0014-a-release-report-is-derived-from-the-run-that-gated-it.md)).
A record edited, its Status line included, fails `pnpm test:repo` until it
is read again and stamped; whether a line is a fair summary of its record
is review's. This section names the larger costs without restating them.

## 11.2 The larger accepted risks

| Risk | Why it is accepted | Record |
|---|---|---|
| **The licence is in force before a lawyer has read it** | It states the terms carefully and says at the top that nobody reviewed it; a customer's production agreement governs, and the first paid release waits for the review | [0001](../decisions/0001-a-paid-module-in-its-own-repository.md) |
| **The intended purpose is worded before a lawyer has read it** | The plan asks for it in the README before 0.1.0, and for a lawyer's reading before the paid release; the README holds CLAUDE.md's sentence word for word, so the two cannot part unnoticed, and says no lawyer has read it. Under the MDR and the MepV a purpose is all a maker says of a product, and the guard holds one paragraph of it | [0011](../decisions/0011-a-release-report-is-derived-from-the-run-that-gated-it.md) |
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
| **The verify job skips the registers' cases that read the validator's downloads** | `verify` has neither the downloads nor a Java; the validator job runs the file again after the gate, and the release report accounts for each skip by that job's pass of the same test, by name, failing the run on any skip it cannot account for | [0005](../decisions/0005-a-fhir-resource-is-proved-by-the-hl7-validator-against-pinned-guide-packages.md), [0011](../decisions/0011-a-release-report-is-derived-from-the-run-that-gated-it.md) |
| **The publish job had run once by 19 October 2026, and never over versions npm already holds** | 0.1.0's run published every package and created the release, every step succeeding; a release whose GitHub release fails is recovered by running `publish` again, which skips what npm holds with the same bytes, and that path is held by the workflows test's shape and `publish.test.mjs`'s decisions alone. Run before the registry answers for a version just published -- 0.1.0's took minutes -- `publish.mjs` reads the 404 as a version npm does not hold and calls `npm publish` for it again, with an answer not seen by that day, so [`RELEASING.md`](../../RELEASING.md#if-a-step-after-npm-fails) waits for `npm view` to answer first | [0011](../decisions/0011-a-release-report-is-derived-from-the-run-that-gated-it.md) |
| **The guide's program is run, not judged** | The install gate compiles and runs it against the packed packages and holds its output to the guide's; that its resources conform is no gate's claim -- the validator judges the corpus, made by the same packages of other synthetic input | [0011](../decisions/0011-a-release-report-is-derived-from-the-run-that-gated-it.md) |
| **The guide's project and the SBOM resolve on the day** | The guide's Report packages and what they bring, and the SBOM's closure beyond the report's packages, are what npm resolved during the run, unlocked, as the tools are; the report and the SBOM check hold the packages they name to the versions the suites loaded, and the SBOM to npm's lockfile of the install it was read from, which says what was resolved that day and not on another | [0011](../decisions/0011-a-release-report-is-derived-from-the-run-that-gated-it.md) |
| **The demo is main's, deployed before CI has run on it** | Cloudflare deploys every push to `main`, and no check is required to merge, so a pull request merged red is served; the alternative, a deploy from CI, would put a zone token in GitHub. Nothing checks what the address serves, which `RELEASING.md` checks by hand | [0012](../decisions/0012-a-demo-at-formancy-ai-health-fills-a-synthetic-referral-in-the-browser-served-by-a-worker-of-its-own.md) |
| **The demo's letter is rendered on Cloudflare's machine** | Its Node, 22.23.2 by Cloudflare's documentation on 18 October 2026, was never measured rendering it; the letter's bytes were, under 22.23.3 and 24.21.0. A Node that renders other bytes stops the build, and the last deployment keeps serving | [0012](../decisions/0012-a-demo-at-formancy-ai-health-fills-a-synthetic-referral-in-the-browser-served-by-a-worker-of-its-own.md) |
| **The demo says nothing of cookies or tracking, and nothing checks the zone** | By the maintainer's decision: the page says only what it does with what is typed, which its policy and gate hold. What Cloudflare sets or measures on formancy.ai's zone no gate sees; a script it injected, inline or under `/cdn-cgi/`, the policy refuses to run | [0012](../decisions/0012-a-demo-at-formancy-ai-health-fills-a-synthetic-referral-in-the-browser-served-by-a-worker-of-its-own.md) |
| **The demo's room is held to `@formancy/themes/room.css`, not to formancy.ai's admin** | The browser gate holds every variable the installed stylesheet sets; whether the admin still wears it is formancy's test's, and nothing here reads the admin's own stylesheet, nor takes a picture to compare the page with the Studio beside it | [0015](../decisions/0015-the-demo-wears-formancy-ais-room-imported-from-formancy-0-6-0-and-the-packages-read-forms-through-the-same-release.md) |
| **Two copies of `@formancy/spec` where Report 0.1.0 is installed** | Report 0.1.0 depends on 0.5.0 exactly and the packages on 0.6.0, so health-corpus holds both, and an application that installs Report beside the packages does; Report only hashes its own definitions with its copy. A Report release on 0.6.0 removes it | [0015](../decisions/0015-the-demo-wears-formancy-ais-room-imported-from-formancy-0-6-0-and-the-packages-read-forms-through-the-same-release.md) |
| **The demo's read-out has no way to a radio group or to tick boxes**, nor to a ranking, a matrix, a file or a signature | formancy's React renderer, 0.6.0's as 0.5.0's, draws a radio group's and tick boxes' options with ids of its own making and no element of the id its engine mints, a ranking's and a matrix's fieldset with that id and no focus, and a file or a signature with no control of it that takes the keyboard, so the page offers no way rather than guess; a renderer release that changes which do fails `engine.test.ts`, and the way follows. The demo's form has only the radio group | [0013](../decisions/0013-the-demo-reads-its-questionnaire-out-from-the-bytes-it-shows-and-renders-no-questionnaire.md) |
| **A visitor can paste a real patient's data into the demo** | The page says it does not belong there, and sends and keeps nothing; the browser's own services and extensions are beyond it | [0012](../decisions/0012-a-demo-at-formancy-ai-health-fills-a-synthetic-referral-in-the-browser-served-by-a-worker-of-its-own.md) |

## 11.3 Known debt

- **The licence does not say a customer's regulatory duty.** Plan 15.2
  asks both the licence and the README to say that a customer's product
  computing a clinical result from its own forms carries the regulatory
  duty that brings; the README says it, and `LICENSE.md`, Version 1 in
  force, does not. Changing the licence is the maintainer's, and the
  legal gate's reason names it
  ([0011](../decisions/0011-a-release-report-is-derived-from-the-run-that-gated-it.md)).
- **The guide's reading has no Markdown parser.** It refuses an HTML
  comment and a line indented as code, which it cannot tell from a list's
  paragraph, and reads a fence in a list item to its closing fence
  ([`scripts/markdown.mjs`](../../scripts/markdown.mjs)); the guide is
  written around both.
- **Open release gates**: the gates [`gates.json`](../release/gates.json)
  keeps open, some partly evidenced, each for the reason it gives, which
  every report prints with the evidence each has
  ([0011](../decisions/0011-a-release-report-is-derived-from-the-run-that-gated-it.md)).
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
  deleted by the merge, `main`'s ruleset, the `npm` environment's policy of
  `v*` tags alone, which keeps the npm token from any other ref, and the
  two secrets a run reads, both of them set on 19 October 2026.
  [`.github/REPO-METADATA.md`](../../.github/REPO-METADATA.md) records
  them, [`RELEASING.md`](../../RELEASING.md#before-the-first-release) says
  what was read with `gh api` that day, and review holds them.
- **Held by review alone**: that nothing calls the product open source; that
  no prose uses FHIR as a brand; that the README's intended purpose is what
  the packages do, and that no page claims a clinical purpose; that the
  README's Status, which is one day's, is still true; that no fixture holds a real person's data;
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
- **The demo's browser gate runs Chromium, Firefox and WebKit**, WebKit as
  its Linux port, not Safari, and no screen reader; a browser added to
  [`scripts/browsers.mjs`](../../scripts/browsers.mjs) is a leg of the
  `browser` job and one the report then expects results in. In WebKit
  27.2 the page's console logs an error for each select, WebKit refusing
  a style of its own under the page's policy, which is not loosened for
  it; and in WebKit, where a face's woff2 file does not arrive, text
  later typed in that face's range asks for its woff, which says what
  kind of text was typed. Each is a row of the browsers' table, held by
  its check; the second is not fixed: `@fontsource` declares woff2 then
  woff, and faces of the page's own, woff2 alone, or a second load of
  each face that failed, would be a change of their own ([0014](../decisions/0014-the-demos-browser-gate-runs-in-chromium-firefox-and-webkit-and-each-fact-the-browsers-disagree-on-is-named-and-held.md)).
  Nothing it measures is what formancy.ai serves,
  which [`RELEASING.md`](../../RELEASING.md#the-demo-on-formancyai) checks
  by hand after a deploy ([0012](../decisions/0012-a-demo-at-formancy-ai-health-fills-a-synthetic-referral-in-the-browser-served-by-a-worker-of-its-own.md)).
- **The demo's notices miss what Vite folds as text**: a package
  stylesheet a stylesheet @imports, a file under the inline limit, a
  constant copied into its user
  ([formancy.ai-data 0046](https://github.com/sharkysan/formancy.ai-data/blob/main/docs/decisions/0046-a-built-app-carries-the-licence-and-notice-texts-of-everything-it-bundles.md)).
  The page held none on 18 October 2026, and
  [`third-party-notices.test.mjs`](../../scripts/third-party-notices.test.mjs)
  fails the day Vite starts reporting one
  ([0012](../decisions/0012-a-demo-at-formancy-ai-health-fills-a-synthetic-referral-in-the-browser-served-by-a-worker-of-its-own.md)).
- **What the demo's zone does at the edge** -- a cookie Cloudflare sets,
  a measurement it makes -- no gate sees; a script it injected, the
  page's policy refuses, which the gate watches on one it injects itself
  ([0012](../decisions/0012-a-demo-at-formancy-ai-health-fills-a-synthetic-referral-in-the-browser-served-by-a-worker-of-its-own.md)).
- **The demo's own source is held by its suite, not by the repository's
  guards that read the packages**: the exactness guard's clock and random
  rule, and the identifiers guard over its build, which no commit holds. A
  search of `apps/demo/src` found no clock, random source or storage on
  18 October 2026, and the build is made from a corpus that holds no valid
  AHV number ([0012](../decisions/0012-a-demo-at-formancy-ai-health-fills-a-synthetic-referral-in-the-browser-served-by-a-worker-of-its-own.md)).
- **No time budget for the gate**: each run of the `validator` job writes
  its own time, and nothing reads the time or fails on it; the job's
  timeout is the only bound ([§9.3](09-quality-requirements.md#93-budgets)).
  With the Swiss guides loaded, the runs 0009 measured on one machine
  spread widely, unexplained, and no CI runner has been measured with them
  ([0009](../decisions/0009-a-ch-orf-document-is-the-hosts-referral-in-ch-core-and-ch-orf-the-questionnaire-by-canonical-and-swiss-identifiers-checked-here.md)).

## 11.4 Open, and planned

What the README lists as [not in 0.1.0](../../README.md#not-in-010):
PDF/A once Report writes it, and the MHD provide Bundle and CH EPR with it;
extraction from a QuestionnaireResponse; Germany's, the United Kingdom's,
Austria's and HL7 Europe's profiles; file, signature, ranking, matrix and
rich-text items; FHIRPath; of CH ORF the Questionnaire inside the Bundle, a
PDF and the Composition's receivers, contacts and other extensions. Each
comes, when it does, with the record that decides it -- a guide's version,
what a package may import. A package not named in [§5](05-building-blocks.md), or a record linked from no section, fails
[`scripts/architecture.test.mjs`](../../scripts/architecture.test.mjs)
([0010](../decisions/0010-the-architecture-is-documented-in-arc42s-sections-held-to-the-repository-by-a-guard.md));
that the record is linked from the section it changes is review's.

Open for the demo ([0012](../decisions/0012-a-demo-at-formancy-ai-health-fills-a-synthetic-referral-in-the-browser-served-by-a-worker-of-its-own.md)): formancy.ai's room, with the first formancy
release whose exports name it; the French and Italian words, for a native
reader; the name Cloudflare's dashboard gave the Worker, which must be the
config's; a link from Formancy Report's healthcare pages, which is
Report's change to make; whether formancy.ai/health/ owes a legal notice
or a privacy statement, for visitors in Switzerland, Germany, France and
Italy whose address Cloudflare sees, which is the lawyer's question and
the rightsholder's to decide, the page linking neither and formancy.ai
having neither page on 18 October 2026; and whether `main` should
require the gates' checks and a pull request, which would keep a red
gate from being served, since Cloudflare deploys every push.

Open, and the maintainer's to ask ([0009](../decisions/0009-a-ch-orf-document-is-the-hosts-referral-in-ch-core-and-ch-orf-the-questionnaire-by-canonical-and-swiss-identifiers-checked-here.md)):

- **Numbers to test with.** Whether the ZAS names AHV numbers for software
  vendors to test with. Until it does, the corpus holds none the gate
  should accept. The ordinance's text, AHVV Art. 133, was not read for
  0009.
- **SNOMED CT.** Whether a SNOMED CT constant in this repository needs an
  affiliate licence is eHealth Suisse's question, to be asked before H10,
  as the plan has it. Until it is answered, no package writes one and the
  corpus holds none.
