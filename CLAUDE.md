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
medical device.

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
it there, and refuses what it cannot read. Guide packages and terminology
join it when the first of them arrives; until then review holds them, and
what a licence identifier cannot say about a licence's terms.

## How the pieces fit

Almost nothing is built. `@formancy/health-core` names the FHIR version it
emits; that is all the product code there is. The package path the plan
proposes, each package depending only on those before it, and split further
only where a part has its own reason to change:

1. `health-core` -- FHIR R4 JSON with exact decimals, primitives held to
   their ranges, identity and references from the host, canonicals and
   profiles, and the refusal of a version it does not know. No framework, no
   Node, no network, no formancy or Report dependency.
2. `health-questionnaire` -- a formancy form to an SDC Questionnaire, and
   answers to a QuestionnaireResponse; extraction later. It reads forms
   through `@formancy/spec` at an exact version.
3. `health-document` -- the document Bundle and its Composition; a
   DocumentReference and a Binary for a PDF's bytes; the MHD provide Bundle,
   built and never sent.
4. `health-ch` -- CH Core and CH ORF, later CH EPR: profiles, identifier
   systems, codes and the CH ORF document.
5. `health-de`, `health-at`, `health-eu` -- the same for Germany's
   Basisprofile DE and ISiK Formular, AT Core, and HL7 Europe and IPS, each
   when its phase comes, Austria's and Europe's only when a customer pays.
6. `health-report`, optional and later -- one call from a Report definition
   and its data to a document Bundle with its PDF. The only package that may
   take a production dependency on Formancy Report, at an exact released
   version, as `report-data-provider` alone may take Data's
   (formancy.ai-report 0016).
7. `health-corpus` -- test support, never published: synthetic forms and
   answers, the exact-value and identity fixtures, the guide package
   register, the validator's runner, and PDFs Report rendered.

A package arrives with the decision record that says what it may import. When
this map goes stale, the rename is the edit to make here.

## Every change keeps the documentation true

A change is not done until the documents that describe it say so. Update them
in the same pull request as the code, not in a follow-up:

- **`README.md`** when behaviour, a package or a command changes — including
  the *Status* paragraph, which describes one point in time and no other.
- **`CHANGELOG.md`** — a line under *Unreleased* for anything a user or
  integrator would notice, with the reason attached, not only the what. A bump
  of an upstream `@formancy/*` version is always noticed, and so, once they
  are pinned, is a guide package's or the validator's.
- **Decision records** (`docs/decisions/`) — a new record for every decision
  someone could helpfully undo, in the format `docs/decisions/README.md`
  describes: next free number, the cost paragraph, the alternatives, and a
  **Verified by** line naming the test or gate that fails if it is violated.
  Add it to the index. A decision that changes an old one marks the old record
  `superseded by NNNN` or `reversed` rather than editing it away. A decision
  that depends on another repository's record cites it as `formancy.ai 0003`,
  `formancy.ai-data 0008` or `formancy.ai-report 0003`.

Keep the voice of the existing documents: say what it costs and what it does
not do, and never claim more than a test shows.

## A claim in prose is backed by something that fails

Documentation drifts silently, because prose does not break. So where a document
states a fact about the repository, something fails when it stops being true,
and the document says what. Three shapes, in order of preference:

1. **Derive it.** `codecov.yml` is generated from the workspace by
   `scripts/codecov-config.mjs`; the README's licence sentence is generated
   from `LICENSE.md` by `scripts/licence-status.mjs`.
2. **Check it.** `scripts/codecov-config.test.mjs` fails when the committed
   file is not what the generator produces; `scripts/check-cla.test.mjs` fails
   when `CLA.md` changes under a signature; `scripts/upstream-deps.test.mjs`
   fails on an inexact upstream version; `scripts/trademark.test.mjs` fails
   when HL7's notice goes missing or a name takes its mark. All of them run
   as `pnpm test:repo`, and CI runs that — **a guard that is not a gate is a
   comment.**
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

The rule this repository will hold once there is a resource to prove, as
Formancy Report holds its rule about PDFs (formancy.ai-report 0003). It
becomes decision 0004 with the validator gate.

- A claim that an export conforms is checked by the official **HL7 FHIR
  validator**, against **pinned implementation guide packages**, on the JSON
  the packages produced. Not on the builder's input, not on hand-written
  JSON, and not through a mocked validator.
- The validator and every guide package are fetched by exact version,
  checked against a hash in a committed register, and run offline. What
  that leaves unchecked -- codes against their value sets -- is said where
  a conformance claim is made.
- Nothing silent. An error fails the gate; a warning is registered with the
  reason it is accepted, or fixed.
- A conformance claim names the guide and its version, the validator and its
  version, and the corpus, and nothing more. Never HL7's endorsement.
- **Never silently drop, approximate or guess.** What an export cannot say in
  the profile it targets, it refuses, naming the field. A PDF is declared
  PDF/A only when a gate has proved its producer.
- Exact values -- decimals, large integers -- travel as strings with their
  type and are never converted through JavaScript `Number`, as in Formancy
  Data and Report (formancy.ai-data 0008, formancy.ai-report 0010). FHIR
  JSON writes a decimal as a number whose digits matter, a trailing zero
  included.

## Secrets, health data and untrusted input

- **Nothing in a package reads configuration** or an environment variable.
  The composition root is the host's.
- **Health data stays out of everything but the output.** No package logs. A
  diagnostic names the field and the rule, never the value. A name, an
  identifier, an answer or any other value of a person's in a log line, an
  error message, a diagnostic, a test fixture or a snapshot is a defect.
  Fixtures are synthetic.
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

`cla.yml` checks every pull request's commit authors against the CLA record,
and `security.yml` runs CodeQL and dependency review.

`scripts/workflows.test.mjs` holds the workflows to their shape:
- every third-party action in `gates.yml` and `release.yml` is pinned to a
  commit (`security.yml`'s CodeQL actions are not, and no release runs
  them);
- no `${{ }}` appears inside a script;
- a release restores no cache;
- `release.yml` pins what its `check` job checked before the SBOM is made,
  and publishes nothing else;
- in `publish`, only the npm step holds the token or runs npm, and it comes
  after the signature;
- nothing in a workflow a release runs sets `continue-on-error`, or runs a
  command inside an `echo`, where bash would lose its failure.

Locally, run the same commands for what you changed.

`pnpm test:repo` also fails until these are done:
- After `LICENSE.md` changes, run `node scripts/licence-status.mjs --write`.
- After `CLA.md` changes, every signatory signs again: the record holds the
  hash of the text signed.
- After a package is added, run `node scripts/codecov-config.mjs --write`, and
  add the package to the `test` job's matrix.

`test:e2e:install` is the only gate that looks at the packages from outside:
- it packs them;
- installs the tarballs into a plain npm project;
- type-checks it with `skipLibCheck` **off**;
- runs it under Node.

That matters because every other gate resolves a package through a symlink to
its source, so an `exports` map that is wrong for a consumer can be right for
the whole suite. It needs `pnpm build` first.
`scripts/install-fixture/consume.ts` is the consumer; a package's public entry
points belong in it.

Not here yet, each arriving with what it proves: the HL7 FHIR validator's
gate, and the release report of the run that gated a release
(formancy.ai-report 0014).

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
