# Changelog

All notable changes to Formancy Health. Every package moves on one version
number. The versions of the upstream `@formancy/*` packages this repository
depends on are a separate line, and a change to one is called out explicitly.

Loosely [Keep a Changelog](https://keepachangelog.com), with reasons attached —
a line that says only *what* changed is rarely the line you need six months
later.

## Unreleased

**Formancy Health is source-available, on Formancy Data's and Formancy
Report's terms, and the licence is in force before a lawyer has read it**
([0001](docs/decisions/0001-a-paid-module-in-its-own-repository.md)).
Free to read, fork, evaluate, develop and test, including in companies and
without an expiry; a paid licence to run in production; a separate agreement
to redistribute. Customer data, the health records the module is given and
the FHIR resources it generates remain the customer's. `LICENSE.md`
Version 1 is in force from 16 October 2026 and says at the top that no
lawyer has reviewed it. Its terms are Formancy Data's Version 1.1 and
Formancy Report's Version 1, so a Report + Health bundle is one kind of
agreement rather than a compatibility review between licence families. The
whole export is this product, the mapping of a form to the HL7 Structured
Data Capture guide included: a generic core of it in Apache-2.0 formancy was
considered and not taken, so formancy itself exports nothing to FHIR, and
its promise that a self-hoster never hits a paywall is untouched.

**The product is Formancy Health, and no name of it carries an HL7 mark**
([0003](docs/decisions/0003-the-product-name-carries-no-hl7-mark.md)).
It was Formancy FHIR, in `formancy.ai-fhir`, until 16 October 2026, before
the first commit. HL7 forbids its marks in a product's name without its
written consent, grants that consent product by product, and says a name
holding FHIR could never be a registered trademark; the maintainer chose a
name that needs no consent rather than apply for one. The repository, the
`@formancy/health-*` packages, the licence and the README's heading say
Formancy Health. FHIR is named only for the standard the module implements,
and `NOTICE` and the README carry HL7's notice for use without
permission, word for word.

**The repository has Formancy Report's pipeline**
([0002](docs/decisions/0002-depend-on-upstream-never-copy-it.md)), as
Report's first pull request brought it and with what Report has fixed in it
since. It brings:

- **Contributions under a CLA**, checked on every pull request against the
  hash of the text signed.
- **Workflows.** `gates.yml` with a `verify` job, a `test` job per package and
  an `install` job, called by `ci.yml` and by a `release.yml` that publishes
  only the tarballs the install gate ran, pinned by hash, with provenance and
  a signed SBOM. CodeQL and dependency review run in `security.yml`.
- **Guards**, each watched failing first. In `verify`, the licence field and
  files of every package, by `scripts/verify-licenses.mjs`. Under
  `pnpm test:repo`, exact upstream versions, a generated `codecov.yml`, the
  README's licence sentence generated from `LICENSE.md`, the 600-line source
  budget, the test matrix against the workspace, and the workflows' shape.
  And one Report has no need of:
  `scripts/trademark.test.mjs`, which fails when `NOTICE` or the README
  loses HL7's notice, when a tracked file claims a licence from HL7 for its
  marks, and when a package's name, the licence's title or the README's
  first heading holds an HL7 mark.
- **The licences of what a published package needs in production**, read
  in `verify` by `scripts/dependency-licences.mjs` and refused unless
  permissive (formancy.ai-report 0006).

Left out until there is something for them to prove: the HL7 FHIR
validator's gate, Report's release report and its registers, and the
getting-started guide's gate. Left out for good, by 0002: a copy of
formancy.ai's admin colour stylesheet and the palette guard that would hold
it, which Data and Report keep. Version 1 has no page, so there is no
browser gate, no README picture and no demo either.

**`@formancy/health-core` names the FHIR version it emits, and nothing
else yet.** `FHIR_VERSION` is `'4.0.1'`, R4, independent of every package
version. It is the package that proves the pipeline: build, packaging
checks, the licence in the tarball and the install gate all run on it.
Nothing exports a resource yet.
