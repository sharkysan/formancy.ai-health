# Changelog

All notable changes to Formancy Health. Every package moves on one version
number. The versions of the upstream `@formancy/*` packages this repository
depends on are a separate line, and a change to one is called out explicitly.

Loosely [Keep a Changelog](https://keepachangelog.com), with reasons attached —
a line that says only *what* changed is rarely the line you need six months
later.

## Unreleased

**The United Kingdom is among the formats it targets, after Germany and
before Austria**: UK Core and, for England, the NHS Booking and Referral
Standard (BaRS), on the same FHIR R4 4.0.1 as CH Core. After Germany
because a BaRS referral is a message rather than a document and no
released UK Core profiles a Questionnaire; before Austria because BaRS is
a national standard in service. Like Austria's and Europe's, it is built
only when a customer pays for it, and nothing for it is built yet.

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

**`@formancy/health-core` names the FHIR version it emits.**
`FHIR_VERSION` is `'4.0.1'`, R4, independent of every package version. It
is the package that proves the pipeline: build, packaging checks, the
licence in the tarball and the install gate all run on it. Nothing exports
a resource yet.

**`@formancy/health-core` writes and reads FHIR JSON exactly, and holds
R4's primitives to their types**
([0004](docs/decisions/0004-fhir-json-is-written-and-read-exactly-with-primitives-of-its-own.md)).
FHIR says a decimal's precision is part of its value -- 0.010 is not 0.01
-- and a JavaScript number keeps neither a trailing zero nor more than
about seventeen digits. So a number is its text: `decimal()`, `integer()`,
`positiveInt()` and `unsignedInt()` take a string or a bigint, check it
against R4's grammar and, for the integers, their 32-bit range, and refuse
a JavaScript number. `date()`, `dateTime()`, `instant()`, `time()`, `id()`,
`code()`, `uri()` and `uuid()` check the rest; a date and time without its
zone is refused, not guessed, and a day the calendar lacks is refused.
`writeJson()` writes a number's digits unquoted, the names in the order
given, the same bytes for the same input; `readJson()` is a parser of the
package's own, because `JSON.parse` reads every number into a double and
keeps the last of two properties of one name without a word. Both refuse
breaks of FHIR JSON's rules -- an empty value, a null outside an array, a
name given twice, a JavaScript number -- with a `Refusal` that names the path
and the rule and never quotes the value, which may be a person's. The
types are the package's own: `@types/fhir` and `@medplum/fhirtypes` both
type a decimal as a JavaScript number. And a new guard,
`scripts/exact-and-reproducible.test.mjs`, fails when a package's source
converts a value through a number or reads a clock or a random source,
which would make the same input give other bytes or an identity nobody
supplied.

**FHIR resources are judged by the HL7 FHIR validator, offline, against
pinned guide packages**
([0005](docs/decisions/0005-a-fhir-resource-is-proved-by-the-hl7-validator-against-pinned-guide-packages.md)).
A new `validator` job in the gates runs `scripts/validator.mjs`: validator
**7.0.2**, the newest release on 17 October 2026, fetched from its GitHub
release and refused unless its SHA-256 is the one
`docs/release/validator.json` pins, on Java 17, its floor; and FHIR R4
4.0.1 with Structured Data Capture **4.0.0**, together with every package
the validator loads with them, each fetched from packages.fhir.org by exact
version and refused unless its SHA-256 is the one
`docs/release/ig-packages.json` registers. That list was read from the
validator's own load, not from a guide's page: it includes R5 terminology
the validator loads for itself and a ballot SDC 4.0.0 declares. Run by
default, the validator downloads packages, asks a registry for the newest
version of two of them on every run and checks codes on tx.fhir.org, so
its verdict would depend on the day; here it runs with no terminology
server and no HTTP at all, and the same commit gets the same verdict. What
that costs is said where it is measured: codes from LOINC, SNOMED CT or
UCUM, and language tags, are not checked offline, and the validator's
warning that says so refuses a resource until it is registered with a
reason; a code system nothing knows draws only information, online and
offline, which the gate accepts. An error fails the job, and so does any warning
`scripts/validator/warnings.json` does not name. The corpus is written by
health-core's `writeJson`, and the resources broken on purpose in it
are each refused for exactly what they break: a missing required
element, two cardinalities, a code outside a required binding, a decimal
written as a string, an unknown profile and an unchecked external code. No
package builds a resource yet, so the corpus is built by hand, and the gate
shows the pipeline judges health-core's output, not that an export
conforms. Its first run found a rule the first Questionnaire will need:
SDC's sdc-2, a version only with its version algorithm.

**The README says what the packages are built and judged against**, in a
table `scripts/compatibility.mjs` derives from health-core's
`FHIR_VERSION`, the two registers, the workspace's manifests and the
toolchain, and `scripts/compatibility.test.mjs` fails when it is stale --
the plan's compatibility tuple, recorded where a test holds it.

**The dependency-licence guard says that FHIRPath is refused today**, and a
case holds it: `fhirpath` 5.2.1 and the `@lhncbc/ucum-lhc` 7.1.10 it brings
each declare a licence of their own that no allowed identifier names, so a
package that took FHIRPath for an `enableWhenExpression` or for template
extraction fails `verify` until the maintainer admits a version by a
reviewed exception.
