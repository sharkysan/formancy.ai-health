# Working in this repository

## What this is, and what it is not

Formancy Health is a **paid, source-available** module that exports
formancy forms, a person's answers to them and the PDFs that Formancy Report
renders, to the HL7® FHIR® standard, shaped to each country's profiles. It
builds on the Apache-2.0 [formancy](https://github.com/sharkysan/formancy.ai)
packages and, optionally, on
[Formancy Report](https://github.com/sharkysan/formancy.ai-report). It lives
in its own repository, on Formancy Data's and Formancy Report's licence
terms, so that formancy's licence and its promise -- a self-hoster never hits
a paywall -- stay true without qualification
([0001](docs/decisions/0001-a-paid-module-in-its-own-repository.md)). The
whole export is this product, the generic mapping of a form to the SDC
guide included; formancy itself exports nothing to FHIR.

It is a library. Version 1 has no server, no page and no network: a vendor's
application calls it, gets FHIR JSON back and sends it itself. It is not an
EHR, a FHIR server or a terminology service, and it is not intended as a
medical device. The README's *Intended purpose* holds that sentence word
for word, and `scripts/readme.test.mjs` fails when the two part (0011): a
change to it here is a change there, in the same pull request, and no
lawyer has read either yet.

Four things follow, and three of them have a guard:

- **Depend on upstream, never copy it.** `@formancy/*` packages --
  formancy's, Formancy Report's and Formancy Data's -- are dependencies at
  **exact** released versions; `scripts/upstream-deps.mjs` refuses a range,
  a `workspace:` link or a path
  ([0002](docs/decisions/0002-depend-on-upstream-never-copy-it.md)). Nothing
  is copied, stylesheets included: formancy.ai's admin colours are not
  copied here, though Data and Report copy them, and a page, if Health ever
  has one, waits for a formancy release that carries them. A generic
  improvement goes upstream through that repository's own contribution
  rules, not into a patched copy here.
- **Every package declares the source-available licence**, never Apache-2.0.
  `scripts/verify-licenses.mjs` refuses a manifest that says otherwise and a
  tarball without `LICENSE.md` and `NOTICE`. The realistic mistake is a
  manifest copied from upstream.
- **Never call it open source.** Not in a README, a package description, a
  commit message or a landing page. "Source-available" is the phrase, and the
  licence table in `README.md` is the explanation. This one is review's:
  nothing searches the prose for the phrase.
- **HL7's marks never name anything of this product's**
  ([0003](docs/decisions/0003-the-product-name-carries-no-hl7-mark.md)).
  Not the product, a package, the licence, a domain or a page. FHIR is named
  only for the standard the packages implement -- "the HL7® FHIR® standard",
  "FHIR R4", "FHIR resources", the HL7 FHIR validator, a guide's own name --
  and HL7's notice for use without permission stands in `NOTICE` and the
  README, word for word. No notice HL7 reserves for its licensees appears
  anywhere: this product holds no licence from HL7. `scripts/trademark.test.mjs`
  holds the notice and the names; review holds the prose.

A dependency must allow both public source and licensed production use:
permissive licences only, no GPL or AGPL, no source-available or
non-commercial licence. Formancy Report's packages are on this repository's
terms from the same rightsholder, and enter only where a decision record
admits them, at an exact version. A commercial component needs written
redistribution rights. An implementation guide package or a terminology
keeps its own terms: HL7's specifications are referenced, not redistributed,
and no SNOMED CT or LOINC content is bundled.
`scripts/dependency-licences.mjs` holds the rule for the production
dependencies of every publishable package, as formancy.ai-report 0006 holds
it there, and refuses what it cannot read; FHIRPath (`fhirpath` and the
`@lhncbc/ucum-lhc` it brings) is refused by it today, and a case says so.
Guide packages are no package's dependency: the validator gate loads them in
CI, and their register records each one's licence as its package.json
states it and refuses one the dependency policy would refuse (0005), unless
a decision admits it for that one entry, as
[0009](docs/decisions/0009-a-ch-orf-document-is-the-hosts-referral-in-ch-core-and-ch-orf-the-questionnaire-by-canonical-and-swiss-identifiers-checked-here.md)
admits IHE's CC-BY-4.0 formatCode package, which CH Core needs. Terminology
is held by `scripts/terminology.test.mjs`: every code system the corpus
writes is HL7's own, a host's under a domain reserved for examples, LOINC
with each code recorded, written with the name it is recorded with, and its
notice in `NOTICE`, or SNOMED CT with each
code recorded in a decision, which none is (0009). Review holds a code no
corpus resource holds, and what a licence identifier cannot say about a
licence's terms.

## How the pieces fit

Little is built. `@formancy/health-core` names the FHIR version it emits,
holds R4's primitives as checked text -- a number as its digits, never a
JavaScript number -- writes and reads FHIR JSON exactly, by a writer and a
parser of its own, and holds the one `Refusal` every package refuses with
([0004](docs/decisions/0004-fhir-json-is-written-and-read-exactly-with-primitives-of-its-own.md)).
`@formancy/health-questionnaire` exports a formancy form, read through
`@formancy/spec` 0.5.0, as an SDC 4.0.0 Questionnaire, or refuses it whole
([0006](docs/decisions/0006-a-formancy-form-is-an-sdc-questionnaire-refused-whole-where-it-cannot-be-one.md)),
and a submission of it as a QuestionnaireResponse walked from that
Questionnaire's own mapping
([0007](docs/decisions/0007-a-formancy-submission-is-a-questionnaireresponse-of-the-same-mapping-refused-whole-where-an-answer-cannot-be-one.md)).
`@formancy/health-document` attaches a PDF's bytes to a DocumentReference,
in the attachment or a Binary, and assembles a document Bundle of what its
Composition refers to, every reference resolved, refusing a PDF/A
declaration nothing has proved ([0008](docs/decisions/0008-a-document-is-a-bundle-of-what-it-refers-to-and-a-pdf-its-own-bytes-never-an-unproved-pdf-a.md)).
`@formancy/health-ch` writes a CH ORF 3.0.2 document of the host's
referral, its patient, author and orders in CH Core 6.0.0's profiles and
the answers health-questionnaire wrote, the Questionnaire by its
canonical, assembled by health-document, and holds a GLN and an AHV
number to their check digits, which the validator only warns of
([0009](docs/decisions/0009-a-ch-orf-document-is-the-hosts-referral-in-ch-core-and-ch-orf-the-questionnaire-by-canonical-and-swiss-identifiers-checked-here.md)).
That is all the product code there is. Beside them, and not product code,
the validator gate judges what the packages write
([0005](docs/decisions/0005-a-fhir-resource-is-proved-by-the-hl7-validator-against-pinned-guide-packages.md)):
`scripts/validator.mjs`, its modules, corpus and synthetic forms in
`scripts/validator/`, and the registers of what it runs in `docs/release/`;
and `@formancy/health-corpus`, private test support, renders the PDF the
documents carry with Formancy Report 0.1.0 (0008). The package path the
plan proposes, each package depending only on those before it, and split
further only where a part has its own reason to change:

1. `health-core` -- FHIR R4 JSON with exact decimals, primitives held to
   their ranges, identity and references from the host, canonicals and
   profiles, and the refusal of a version it does not know. No framework, no
   Node, no network, no formancy or Report dependency.
2. `health-questionnaire` -- a formancy form to an SDC Questionnaire
   (0006), and answers to a QuestionnaireResponse (0007); extraction later. It
   reads forms through `@formancy/spec` at an exact version, and depends on
   nothing else but health-core.
3. `health-document` -- the document Bundle and its Composition, and a
   DocumentReference and a Binary for a PDF's bytes (0008); later the MHD
   provide Bundle, built and never sent. It depends on health-core alone,
   and on no renderer: the PDF is the host's.
4. `health-ch` -- CH Core and CH ORF, later CH EPR: profiles, identifier
   systems, codes and the CH ORF document (0009). It depends on the three
   above, and on `@formancy/spec` only for its tests.
5. `health-de`, `health-uk`, `health-at`, `health-eu` -- the same for
   Germany's Basisprofile DE and ISiK Formular; UK Core and, for England,
   the BaRS referral message, built and never sent; AT Core; and HL7 Europe
   and IPS. Each when its phase comes; the United Kingdom's, Austria's and
   Europe's only when a customer pays.
6. `health-report`, optional and later -- one call from a Report definition
   and its data to a document Bundle with its PDF. The only package that may
   take a production dependency on Formancy Report, at an exact released
   version, as `report-data-provider` alone may take Data's
   (formancy.ai-report 0016).
7. `health-corpus` -- test support, private and never published: the
   referral letter it renders with Formancy Report's released packages at
   exactly 0.1.0, the only place Report is a dependency, and the documents
   health-document makes of it, which the validator gate judges (0008).
   The validator's runner, corpus and synthetic forms stay in
   `scripts/validator/` and the registers in `docs/release/`: the forms
   need `@formancy/spec` and health-questionnaire, which it does not depend
   on, and the runner is the gate the workflow runs by its path (0008).

A package arrives with the decision record that says what it may import. When
this map goes stale, the rename is the edit to make here, and in the
building blocks' table (`docs/architecture/05-building-blocks.md`).

## Every change keeps the documentation true

A change is not done until the documents that describe it say so. Update them
in the same pull request as the code, not in a follow-up:

- **`README.md`** when behaviour, a package or a command changes — including
  the *Status* paragraph, which describes one point in time and no other.
- **`CHANGELOG.md`** — a line under *Unreleased* for anything a user or
  integrator would notice, with the reason attached, not only the what. A bump
  of an upstream `@formancy/*` version is always noticed, and so is one of
  the validator or a guide package, which the registers pin (0005).
- **Decision records** (`docs/decisions/`) — a new record for every decision
  someone could helpfully undo, in the format `docs/decisions/README.md`
  describes: next free number, the cost paragraph, the alternatives, and a
  **Verified by** line naming the test or gate that fails if it is violated.
  Add it to the index. A decision that changes an old one marks the old record
  `superseded by NNNN` or `reversed` rather than editing it away. A decision
  that depends on another repository's record cites it as `formancy.ai 0003`,
  `formancy.ai-data 0008` or `formancy.ai-report 0003`.
- **Architecture** (`docs/architecture/`, entered from `docs/README.md`:
  arc42 in formancy.ai's files, whose section on decisions is the records
  above) — the section the change touches: building blocks for a new
  package or module and what it may import, the runtime view for a new
  flow, deployment for what is published or what a host must supply,
  cross-cutting concepts, quality requirements, verification for a new gate
  or check, and risks and debt for anything accepted rather than fixed. The
  building blocks' *May import* column restates the package path above and
  the records, and nothing compares them, so a change to one is made to
  the others in the same pull request. A new package not named in the
  building blocks, a new record linked from no section, or a file the
  sections link or name as code renamed without them, fails
  `scripts/architecture.test.mjs` (0010); that a record is linked from the
  section it changes is review's.

Keep the voice of the existing documents: say what it costs and what it does
not do, and never claim more than a test shows.

## A claim in prose is backed by something that fails

Documentation drifts silently, because prose does not break. So where a document
states a fact about the repository, something fails when it stops being true,
and the document says what. Three shapes, in order of preference:

1. **Derive it.** `codecov.yml` is generated from the workspace by
   `scripts/codecov-config.mjs`; the README's licence sentence is generated
   from `LICENSE.md` by `scripts/licence-status.mjs`; its compatibility
   table, the tuple the packages are built and judged against, from the
   registers, health-core's `FHIR_VERSION` and the toolchain by
   `scripts/compatibility.mjs`.
2. **Check it.** `scripts/codecov-config.test.mjs` fails when the committed
   file is not what the generator produces; `scripts/check-cla.test.mjs` fails
   when `CLA.md` changes under a signature; `scripts/upstream-deps.test.mjs`
   fails on an inexact upstream version; `scripts/trademark.test.mjs` fails
   when HL7's notice goes missing or a name takes its mark;
   `scripts/exact-and-reproducible.test.mjs` fails when a package's source
   converts a value through a JavaScript number or reads a clock or a random
   source; `scripts/compatibility.test.mjs` fails when the compatibility
   table is stale; `scripts/validator/corpus.test.mjs` fails when the
   questionnaire package maps or writes something no corpus form or
   submission holds, or a package writes a resource type -- or
   health-document a PDF's bytes in a place -- that no resource the gate
   accepts holds;
   `scripts/validator/registers.test.mjs` fails when a
   register is malformed or, where the validator job has run, says other
   than the bytes and the validator's own load;
   `scripts/terminology.test.mjs` fails when the corpus holds a code system
   no register of its terms admits, a LOINC code unrecorded, written
   without its recorded name or without LOINC's notice in `NOTICE`, or an
   unrecorded SNOMED CT code; `scripts/synthetic-identifiers.test.mjs`
   fails on a valid AHV number in any file git holds, however its digits
   are separated;
   `scripts/architecture.test.mjs` fails when a section of the architecture
   or `docs/README.md` is missing, a workspace package or app is not named
   in the building blocks, a decision record is linked from no section, a
   relative link in the architecture, or the heading it points at, no
   longer exists, or a path written there as code names no file git would
   commit; `scripts/release-report/limitations.test.mjs` fails when a
   decision record has no entry in `docs/release/limitations.json`, or
   changed since its entry was read, and `gates.test.mjs` beside it when
   `docs/release/gates.json` names evidence no run can pass (0011);
   `scripts/getting-started.test.mjs` fails when a block of code in
   `docs/getting-started.md` names no host, a file is not named in the
   prose before its block, the program imports what section 1 does not
   install, section 1 installs other than the install gate installs or at
   another version, or a link or an anchor no longer resolves (0011);
   `scripts/readme.test.mjs` fails when the README's *Intended purpose*
   stops holding the sentence above that says what the product is not,
   word for word, or a relative link of the README, or the heading it
   names, no longer lands (0011). The architecture's guard, the guide's and
   the README's read Markdown through one module, `scripts/markdown.mjs`.
   All of them run as `pnpm test:repo`, and CI runs that — **a guard that
   is not a gate is a comment.**
3. **Measure it.** Below.

Counts written into prose go stale. **Prefer wording without a number.** Where a
number is the point, derive it; where that is impossible, date it.

**When you write a guard, make it fail first.** Revert the thing it guards,
watch it fail, put it back. A test that has never failed has not been shown to
test anything. And derive the fact from the code or the data, never from
wording: a check that matches a phrase passes for the wrong reason the moment
the phrase appears somewhere else.

## Measure before you write a number

Numbers here are measured, not estimated. The plan this repository started
from estimates its effort in person-weeks; those are a plan's numbers and they
belong in the plan. A number in this repository — a bound on items, nesting
or Bundle entries, an attachment's size, a timeout, a validator's run time —
comes with how it was measured, on what, and when. A version a national
guide is said to require comes with where the guide says so.

## An export is proved on the resources it produced

Decision [0005](docs/decisions/0005-a-fhir-resource-is-proved-by-the-hl7-validator-against-pinned-guide-packages.md),
held as Formancy Report holds its rule about PDFs (formancy.ai-report
0003). The validator gate, `scripts/validator.mjs` and the `validator` job,
is the tool for it.

- A claim that an export conforms is checked by the official **HL7 FHIR
  validator**, against **pinned implementation guide packages**, on the JSON
  the packages produced. Not on the builder's input, not on hand-written
  JSON, and not through a mocked validator. The corpus
  (`scripts/validator/corpus.mjs`) holds what health-questionnaire, as
  built, makes of the synthetic forms and submissions in
  `scripts/validator/forms.mjs`, each response judged against its
  Questionnaire, what health-document makes of the PDF health-corpus
  renders with Report, and the CH ORF document health-ch makes of a
  synthetic referral (`scripts/validator/ch-orf.mjs`), and builds by hand
  only what no package builds, written by health-core's `writeJson`;
  `scripts/validator/corpus.test.mjs` fails when a field type, item type
  or rule the package maps is in no
  corpus form, an answer type it writes in no corpus response, or a
  resource type a package writes in no resource the gate accepts. A
  conformance claim is about those resources and no other.
- The validator and every guide package are fetched by exact version,
  refused unless their hash is the one `docs/release/validator.json` or
  `docs/release/ig-packages.json` registers, and run offline: no
  terminology server, no HTTP at all. Which packages the register holds is
  the validator's own load, read from its `Package Summary`, never a
  guide's page. What offline leaves unchecked -- a code from a code system
  no registered package holds, LOINC, SNOMED CT and UCUM among them, and a
  language tag -- is said where a conformance claim is made, as 0005
  measured it.
- Nothing silent. An error fails the gate; a warning is registered by its
  message id in `scripts/validator/warnings.json`, with the reason it is
  accepted, or fixed. A resource broken on purpose is refused for exactly
  what it breaks, or the gate fails: that is how a check is watched
  failing here.
- A conformance claim names the guide and its version, the validator and its
  version, and the corpus, and nothing more. Never HL7's endorsement.
- **Never silently drop, approximate or guess.** What an export cannot say in
  the profile it targets, it refuses, naming the field. A PDF is declared
  PDF/A only when a gate has proved its producer.
- Exact values -- decimals, large integers -- travel as strings with their
  type and are never converted through JavaScript `Number`, as in Formancy
  Data and Report (formancy.ai-data 0008, formancy.ai-report 0010). FHIR
  JSON writes a decimal as a number whose digits matter, a trailing zero
  included. Here a number is a `FhirNumber`, made from its text by
  health-core's `decimal()` and its integer types, and written and read by
  its `writeJson` and `readJson`, never by `JSON.stringify` or `JSON.parse`
  (0004).

## Secrets, health data and untrusted input

- **Nothing in a package reads configuration** or an environment variable.
  The composition root is the host's.
- **Health data stays out of everything but the output.** No package logs. A
  diagnostic names the field and the rule, never the value. A name, an
  identifier, an answer or any other value of a person's in a log line, an
  error message, a diagnostic, a test fixture or a snapshot is a defect.
  Fixtures are synthetic, and no AHV number in them passes its check
  digit: a test that needs a valid one computes it in memory (0009).
- **Forms, answers, questionnaires, profiles, guide packages, PDFs and the
  resources a host hands over are untrusted**, even when an administrator
  wrote them. Nothing a document carries runs as code, and parsing is
  bounded.
- **No network.** No package fetches a guide package, calls a terminology
  server, dereferences a canonical or sends a Bundle. A canonical and a
  system URI are identifiers, never addresses.
- **Identity comes from the host, verified.** A patient, an organisation, a
  practitioner or a tenant supplied by a browser is never a decision's input.
- **Fail closed.** An unknown FHIR, SDC or guide version, profile, item type,
  code system or reference refuses the whole resource or Bundle with a typed
  diagnostic, never half exported. Upstream's
  [0022](https://github.com/sharkysan/formancy.ai/blob/main/docs/decisions/0022-fail-open-fail-closed.md)
  is the rule and this repository inherits it.
- **No clinical logic in anything this repository ships.** No template, no
  fixture, no generated item computes a score, raises a warning or suggests
  a therapy: that would make it a candidate medical device (MDR Rule 11, the
  Swiss MepV). Held by review.

## There is no page

Version 1 has no user interface, so there is no room, no palette, no browser
gate and no README picture. If Health ever has a page, it is formancy.ai's
concept applied, as Data's and Report's apps are, with its colours from a
released formancy package at an exact version (0002), and it arrives with the
gates that hold it.

## Branch names

Name a branch after what it changes, with a prefix for the kind of change:
`feat/health-core-decimals`, `fix/bundle-dangling-reference`,
`docs/licence-faq`. Not a generated name: the branch is what a reviewer sees
first.

## Branch from `main`, and target `main`

No stacked pull requests. Branch from `main`, target `main`, and where a branch
replaces another say "supersedes #N" in the description rather than stacking.

**A merged branch is deleted by the merge.** GitHub deletes the head branch
when the pull request merges, a repository setting that nothing here can
check (formancy.ai-data 0036; `.github/REPO-METADATA.md`). Never delete a
remote branch by hand. Remove the local branch and its worktree once
`gh pr view N --json state` says `MERGED`, and not before.

**Commit as `Daniel Bacher <dbacher@gmail.com>`**, never
`daniel.bacher@ergon.ch`. The CLA record names that address, and the check
reads commit authors. This repository's local git config sets it; the global
one does not.

**No tool attribution.** No "Generated with Claude Code" line or session link
in pull request descriptions, and no `Co-Authored-By: Claude` or
`Claude-Session` trailers in commits. The author is the person above.

## Tests, and what the bar actually is

**Coverage is reported, not gated.** There is no threshold in
`vitest.coverage.ts` and none is wanted. The bar is this:

- **New behaviour arrives with a test that fails without it.** Test-first, and
  the failure observed.
- **Every case says which failure it prevents**, in a comment, in the same
  voice as the code. "tests the happy path" is not that; "a decimal written
  through `Number` would lose its trailing zero, and the resource would say
  0.1 where the form said 0.10" is.
- **A code path no test reaches is a claim nobody checked.** If it is hard to
  reach, that is usually the design saying something.
- **A suite cannot pass empty.** No `passWithNoTests`: a package with a
  `test:coverage` script has tests.
- Run `pnpm test:coverage` for what you changed and read the report. A file
  whose number dropped is the question, not the failure.

### When the test is wrong and the code is right

It happens. When a test disagrees with the code, work out which is wrong before
changing either. Match the whole property, not the shape it usually has.

## The code reads as though a senior wrote both halves

The standard is not "it works". It is that a senior engineer who knows FHIR,
its profiling and TypeScript recognises the shape immediately and finds
nothing to explain away.

**One decision, one place.** How a formancy field becomes a Questionnaire item
is decided once, in `health-questionnaire`, never again in a country pack;
how a decimal is written is decided once, in `health-core`. The question is
never "is this repeated" but **"if these two ever disagree, would anybody
find out?"**

**No interface with one implementation**, no layer that only forwards, no
abstract base class for two concrete cases. Version 1 emits one FHIR version;
it is a constant and a refusal, not a plugin system.

**Duplication is cheaper than the wrong abstraction.** Each country pack is
written against its own guide; what they share is written once, below them.

### Size is a signal

**600 lines** for a source file, tests excluded; `scripts/source-size.test.mjs`
fails past it. Split by **the reason to change**, never by line count. The
same applies below the file, held by review: a function past about 60 lines, a
`switch` growing a case per item type or per country, a class whose name needs
"and" to describe it.

## Running one thing

Packages import each other through `dist/`: every `exports` map points there
and nothing aliases a workspace package to its source. A change in one package
is invisible to another's tests until it is built again, so either run
`pnpm build` or let turbo build the dependencies first:

```bash
pnpm exec turbo run test --filter=@formancy/health-core                    # dependencies built, then that suite
pnpm --filter @formancy/health-core test                                   # that suite, against dist/ as it stands
pnpm --filter @formancy/health-core exec vitest run src/<file>.test.ts     # one file
pnpm --filter @formancy/health-core exec vitest run -t "a test's name"     # one case
```

## Checks before pushing

The gates are `.github/workflows/gates.yml`, which `ci.yml` calls on every
pull request and `release.yml` calls before it publishes, so a release passes
exactly what CI does:

- **`verify`** runs `pnpm build`, `pnpm typecheck`, `pnpm check:pkg`,
  `node scripts/verify-licenses.mjs`, `node scripts/dependency-licences.mjs`
  and `pnpm test:repo` in one job.
- **`test`** runs each package's `test:coverage` in a job of its own.
  `scripts/ci-test-jobs.test.mjs` fails when that list and the workspace
  disagree.
- **`install`** runs `pnpm test:e2e:install`.
- **`validator`** runs `pnpm build`, then `node scripts/validator.mjs` on
  the Java 17 `actions/setup-java` installs, then
  `scripts/validator/registers.test.mjs` against what the gate downloaded
  and ran, and uploads `test-results/validator.json` and the corpus,
  outcomes and console beside it. Locally: `pnpm build`, then
  `node scripts/validator.mjs --java <path to java>`, which downloads into
  the gitignored `.fhir-cache/`.
- **`report`** builds the release report from what every other job's
  collect step uploaded
  ([0011](docs/decisions/0011-a-release-report-is-derived-from-the-run-that-gated-it.md),
  [`docs/release/`](docs/release/README.md)). It fails the run when:
  - a job ended other than success or left no results;
  - a published package has no suite;
  - a test or a file was skipped or failed -- a test `verify` skipped passes
    only where the validator job's run of the registers passed that same
    test, by name;
  - a test file the checkout holds did not run in its suite -- a test file
    is known by its name, not by the suite's include;
  - the install gate failed, or packed other than one tarball per published
    package at the version;
  - the validator gate failed, or, though it says it passed, judged nothing
    or a resource otherwise than the corpus expects, ran another validator
    or JAR or another register than `docs/release/` pins, loaded anything
    else, or did not run offline;
  - two builds of one package differ, or a tarball's built files are not
    every job's;
  - a release gate's evidence or a limitation's `heldBy` test did not pass.

  A job added to gates.yml needs a collect step and an upload, which the
  workflows test holds, and a reader in `scripts/release-report/collect.mjs`,
  which refuses a job it has none for.

`cla.yml` checks every pull request's commit authors against the CLA record,
and `security.yml` runs CodeQL and dependency review.

`scripts/workflows.test.mjs` holds the workflows to their shape:
- every third-party action in `gates.yml` and `release.yml` is pinned to a
  commit (`security.yml`'s CodeQL actions are not, and no release runs
  them);
- no `${{ }}` appears inside a script;
- a release restores no cache;
- every gates job collects and uploads under its own key, and the report
  waits for all of them;
- `release.yml` checks the report before it pins, pins what its `check` job
  checked before the SBOM is made, publishes nothing else, and signs and
  attaches the report beside the SBOM;
- `check` installs no workspace, and makes the SBOM from the tarballs it
  pinned, installed by npm outside the checkout with no lifecycle script,
  and holds it to the report before pinning it (formancy.ai-report 0017);
  the scripts it and `publish` run import only Node's built-ins;
- in `publish`, only the npm step holds the token or runs npm, and it comes
  after both signatures;
- nothing in a workflow a release runs sets `continue-on-error`, or runs a
  command inside an `echo`, where bash would lose its failure;
- the `validator` job runs the gate after the build, on the Java its pin
  needs from a `setup-java` pinned to a commit, holds the registers after
  the gate with none of their cases skipped, collects after that, caches
  only downloads and only in CI, fetches and runs nothing
  but through the script, and uploads its results however it ends.

Locally, run the same commands for what you changed.

`pnpm test:repo` also fails until these are done:
- After `LICENSE.md` changes, run `node scripts/licence-status.mjs --write`.
- After `CLA.md` changes, every signatory signs again: the record holds the
  hash of the text signed.
- After a package is added, run `node scripts/codecov-config.mjs --write`, and
  add the package to the `test` job's matrix.
- After a register, health-core's `FHIR_VERSION`, Node, TypeScript or pnpm
  changes, run `node scripts/compatibility.mjs --write`.
- A new validator release or guide version changes its register and goes
  through the gate: the packages registered are exactly those its
  `Package Summary` names, each hash is read from the bytes
  packages.fhir.org serves, and `declaredBy`, `canonical` and `licence`
  from the packages themselves, which the validator job's run of the
  registers' test checks.
- After the sentence of *What this is, and what it is not* that names a
  medical device changes, the README's *Intended purpose* says the same,
  word for word; that section of CLAUDE.md names a medical device in that
  one sentence and no other, or the guard cannot tell which it holds.
- After a file the README links is renamed, or a heading it names reworded,
  the README's link follows it.
- A new decision record needs its entry in `docs/release/limitations.json`:
  the costs a user, integrator or operator meets, or why it has none. An
  edited one needs a re-read and
  `node scripts/release-report/limitations.mjs --stamp NNNN`, and that
  includes a Status line naming a later record.

`test:e2e:install` is the only gate that looks at the packages from outside:
- it packs them;
- installs the tarballs into plain npm projects, each holding only what its
  host has (`scripts/install-hosts.mjs`): the consumer's, the tarballs
  alone, and the guide's, the tarballs beside what the guide's section 1
  installs;
- type-checks each with `skipLibCheck` **off**, strictly, against Node's
  types;
- runs each under Node;
- compiles and runs `docs/getting-started.md` (0011, as
  formancy.ai-report 0015): every block of code in the guide names its host
  in its fence (`ts guide=node`), and the gate writes the blocks into the
  guide's project, type-checks them, and runs the program, which must print
  exactly the lines the guide's output blocks show.
  `scripts/getting-started.test.mjs` fails when a block names no host, a
  file is not named in the prose before its block, an install line names
  what the gate does not install, or a link or anchor no longer resolves.

That matters because every other gate resolves a package through a symlink to
its source, so an `exports` map that is wrong for a consumer can be right for
the whole suite. It needs `pnpm build` first.
`scripts/install-fixture/consume.ts` is the consumer; a package's public entry
points belong in it. A change to a package that the guide shows -- an
option, a context member, a refusal's message -- changes the guide in the
same pull request.

## Conventions that live upstream

Do not restate these here; go and read them in formancy.ai, Formancy Data and
Formancy Report.

- **Layering: what may import what**, and why a core package has no
  `@types/node` — [formancy.ai 0008](https://github.com/sharkysan/formancy.ai/blob/main/docs/decisions/0008-layered-packages.md).
- **A name and never an address** for anything a document names —
  [formancy.ai 0077](https://github.com/sharkysan/formancy.ai/blob/main/docs/decisions/0077-options-may-come-from-a-named-source.md).
  A profile, a guide package or a PDF to attach is a named reference the host
  resolves.
- **TypeScript is pinned to `~6.0.3`** for the reason the workspace catalog
  gives.
- **Releasing, provenance and signing** — [`RELEASING.md`](RELEASING.md).
- **Reporting a vulnerability** — [`SECURITY.md`](SECURITY.md).
