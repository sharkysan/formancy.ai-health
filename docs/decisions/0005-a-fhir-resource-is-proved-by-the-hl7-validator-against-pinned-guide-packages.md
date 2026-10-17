# 0005 — Prove a FHIR resource with the HL7 FHIR validator, against pinned guide packages, offline, on the JSON a package wrote

- **Status:** accepted; its corpus and registers stay in `scripts/validator/` and `docs/release/` beside the `health-corpus` it expected to hold them, by [0008](0008-a-document-is-a-bundle-of-what-it-refers-to-and-a-pdf-its-own-bytes-never-an-unproved-pdf-a.md); its register admits a licence the dependency policy refuses for the one package a decision names, CC-BY-4.0 for `ihe.formatcode.fhir#1.4.0`, by [0009](0009-a-ch-orf-document-is-the-hosts-referral-in-ch-core-and-ch-orf-the-questionnaire-by-canonical-and-swiss-identifiers-checked-here.md); its results file says when its run started and ended, and records the offline options, the JAR's hash and the packages laid out as the run used them, for the release report that holds it to the registers and accounts for the cases `verify` skips, by [0011](0011-a-release-report-is-derived-from-the-run-that-gated-it.md)
- **Date:** 2026-10-17
- **Deciders:** Daniel Bacher
- **Verified by:** the `validator` job of `gates.yml`, which CI runs on every
  pull request and a release before it publishes, and guards in
  `pnpm test:repo`:
  - **The gate**: `node scripts/validator.mjs`. It fetches the validator
    release [`docs/release/validator.json`](../release/validator.json) pins
    and every package [`docs/release/ig-packages.json`](../release/ig-packages.json)
    registers, refuses each unless its SHA-256 is the registered one, runs
    the validator offline over the corpus health-core writes
    (`scripts/validator/corpus.mjs`), and fails on an error; on a warning
    `scripts/validator/warnings.json` does not name; on a broken resource
    the gate accepted, or refused for something it is not broken for; on an
    outcome another validator wrote; on a registered warning nothing raised;
    and on a package the validator loaded that is not registered, or one
    registered that it did not load. The job then runs
    `scripts/validator/registers.test.mjs` against what it downloaded and
    the run it made, where none of its cases may skip.
  - **The rules**, on fixtures: `scripts/validator/judge.test.mjs` the
    verdict, `outcome.test.mjs` the reading of the validator's output,
    `cache.test.mjs` the refusal of bytes that are not registered, when
    fetched and again when unpacked, and a package cache that holds
    nothing else, `tgz.test.mjs` the unpacking of
    an untrusted tarball, `registers.test.mjs` the registers' shape, and
    `scripts/validator.test.mjs` the options that make the run offline and
    the same on every machine. `scripts/workflows.test.mjs` holds the job:
    the build before the gate, `actions/setup-java` pinned to a commit at
    the Java the pin needs, the registers checked after the gate with no
    case skipped, a
    download cache in CI alone, and the results uploaded however it ends.
  - **The compatibility record**: `scripts/compatibility.test.mjs` fails
    when the README's table is not what the registers, health-core's
    `FHIR_VERSION` and the toolchain say.

  On 17 October 2026 each was watched failing. The validator refused each
  broken resource of the corpus for what it breaks. With two breaks undone
  -- Questionnaire.status left in, the decimal handed over as a
  `FhirNumber` -- the gate said of each that it "is broken for …, and the
  gate accepted it: nothing is watching that". With dom-6 unregistered,
  every resource was refused. With `hl7.fhir.uv.tools.r4` dropped from the
  register, the validator tried to fetch it, was told "Access to the
  internet is not allowed by local security policy", and stopped: "Unable
  to resolve package id hl7.fhir.uv.tools.r4#1.1.2". With one hex digit of
  SDC's registered hash changed, the download was refused. And every check
  of the scripts was removed in turn and its test watched failing: each
  refusal of the tarball reader, each rule of the verdict, each field of
  the registers, each offline option, each rule of the job. That a corpus
  resource is what a package produced is **not mechanically enforced**:
  until a package builds one (H04), the corpus builds them by hand, and
  says so. That no test mocks the validator is held by review.

## Context

What an export promises is that its JSON conforms to the profiles it
declares, and that is a fact about the JSON, decided by the validator's
reading of every profile, invariant and binding the guides define. It is
not visible in the builder's input, and a mocked validator is a
transcription of what its author believed: the reason
[formancy.ai-report 0003](https://github.com/sharkysan/formancy.ai-report/blob/main/docs/decisions/0003-a-rendered-report-is-proved-on-the-pdf-it-produced.md)
proves a report on the PDF and never on the engine's input, and
[formancy.ai-data 0003](https://github.com/sharkysan/formancy.ai-data/blob/main/docs/decisions/0003-real-databases-in-every-test-run.md)
refuses a mocked driver. The plan names the official HL7 FHIR validator
(`hapifhir/org.hl7.fhir.core`, Apache-2.0) for it.

Read and measured on 17 October 2026, on an Intel Core i9-10900K with 32
GB under Windows 11, with Zulu's Java 17.0.4 and 25.0.4.1:

- **The release.** 7.0.2, published 15 October 2026, was the newest. Its
  `validator_cli.jar` is 204,412,235 bytes; the SHA-256 of the download and
  GitHub's digest of the asset agreed. Its manifest says `Build-Jdk-Spec:
  17` and its classes are version 61, so Java 17 is its floor. Since 7.0.0
  every OperationOutcome it writes names the validator that wrote it.
- **By default it is online.** With an empty cache, `-version 4.0.1 -ig
  hl7.fhir.uv.sdc#4.0.0` downloaded packages from packages2.fhir.org into
  `~/.fhir/packages`, used tx.fhir.org, and on every run asked the
  registries for "the latest version" of `hl7.terminology` and
  `hl7.fhir.uv.extensions`. A verdict reached that way depends on what two
  registries and a terminology server said that day.
- **What it loads.** For SDC 4.0.0 on R4 it loaded fifteen packages, which
  its console lists in a `Package Summary` line: the R4 core, SDC, the R4
  examples, SDC's declared dependencies, two it loads with every R4 run,
  and R5 terminology and extensions it loads for itself. One of SDC's
  dependencies is a ballot, `hl7.fhir.uv.extensions.r4`
  5.3.0-ballot-tc1. Every one of the fifteen says `CC0-1.0` in its
  package.json. No guide's page lists this set.
- **One package, two sets of bytes.** packages.fhir.org and
  packages2.fhir.org served the same bytes for thirteen of the fifteen, and
  different tarballs for `hl7.fhir.r4.core` 4.0.1 and
  `hl7.fhir.r4.examples` 4.0.1; packages.fhir.org's matched the SHA-1 its
  own index gives. "The same package" means the same bytes only when a
  hash says so.
- **Offline is one option.** `-no-http-access` refuses every request the
  validator makes. A refused package lookup is printed on its console; a
  profile it could not fetch is reported only in that resource's outcome,
  as a warning. Run through a logging HTTP proxy, which the validator's
  client was first seen to use when online, a whole gate run made no
  connection. Offline, it took the newest
  `hl7.terminology` and `hl7.fhir.uv.extensions` its cache held. Pointed
  at a cache unpacked by hand, with no `packages.ini`, it wrote one and
  used the packages; on first load it writes `.index.json` and `.index.db`
  beside each package's files.
- **What `-tx n/a` changes.** The same variants of one Questionnaire and
  QuestionnaireResponse, validated against tx.fhir.org and then offline:

  | In the resource | tx.fhir.org | `-tx n/a` |
  | --- | --- | --- |
  | A code from a code system the packages hold (Questionnaire.status `finished`; item type `number`) | error | the same error |
  | A made-up LOINC or SNOMED CT code; a made-up UCUM unit | error, `Unknown_Code_in_Version` | warning, `Error_validating_code_running_without_terminology_services`; the same for a real UCUM unit |
  | `de-CH` as a resource's language | nothing | warning, `TERMINOLOGY_TX_WARNING`: not validated |
  | A media type in Attachment.contentType, real or made up | nothing | information, `Terminology_TX_NoValid_15`: not validated |
  | A code system no package holds | information, `UNKNOWN_CODESYSTEM` | the same |

  Offline, a code is checked only against the code systems the registered
  packages carry.
- **Its output.** Each issue carries a message id, which its messages are
  keyed by, except a JSON parser's (a decimal written as a string, an array
  where one value belongs), which carries only its issue type. With the
  machine's German locale the messages were German and the jurisdiction
  Germany.
- **It found something on its first run.** The corpus's Questionnaire had a
  version and no version algorithm, and SDC 4.0.0's sdc-2 refuses that:
  "If version is present, versionAlgorithm must be present".

## Decision

A claim that FHIR JSON conforms is checked by the HL7 FHIR validator, at a
release pinned by SHA-256, against exactly the guide packages a register
pins by SHA-256 -- the set read from the validator's own load -- offline,
on the JSON health-core's `writeJson` wrote. The gate runs in CI and by
hand, never in a package.

- **Pinned and checked.** `docs/release/validator.json` pins the release:
  its version, the address of its asset, its SHA-256, its size and its
  Java. `docs/release/ig-packages.json` registers every package, each with
  its exact version, packages.fhir.org's address for it, its SHA-256, its
  canonical and its licence as its package.json states them, which
  registered packages declare it, and whether it is FHIR itself, a guide
  the gate asks for, or a dependency the validator loaded. Both live in
  `docs/release/` because a conformance claim and the release report to
  come (formancy.ai-report 0014) cite them, and the guards, the gate and
  the compatibility record all read them; the plan's `health-corpus`
  package would hold them, and arrives with the first package output it
  holds.
- **Downloaded, then trusted.** Everything is fetched into `.fhir-cache/`,
  which git ignores, and written into place only once its hash is the
  registered one; a file already there is hashed again before each run,
  and a tarball again on the bytes it is unpacked from. A package
  unpacked by an earlier run on the same machine is kept on the strength
  of the gate's record of the hash it was unpacked from; CI never keeps
  one. A package's tarball is unpacked by a reader of this
  repository's, which writes regular files and directories under the
  destination and refuses everything else. The validator's package cache
  holds the registered packages and nothing else, under a `user.home` of
  the gate's own, so no machine's own cache or settings take part.
- **Offline, and the same everywhere.** `-tx n/a -txCache n/a
  -no-http-access`, and `-locale en-US -jurisdiction uv`; `-version` from
  the register's core, `-ig` for each registered guide, and the corpus's
  Questionnaire loaded as a definition with `-questionnaire check`.
- **Nothing silent.** An error refuses a resource; so does a warning,
  unless `scripts/validator/warnings.json` names its message id with the
  reason it is accepted; a warning with no id cannot be registered.
  Information refuses nothing and is counted. Every resource broken on
  purpose must be refused for exactly what it breaks, matched by severity,
  message id -- or, where the validator gives none, issue type -- and
  expression. A registered warning nothing raised, and a package registered
  and not loaded, fail the gate until they go.
- **Results.** `test-results/validator.json`, with the corpus as written,
  the validator's own outcomes and its console beside it, uploaded as the
  run's `validator-results`.
- **What a claim says.** The guide and its version, the validator and its
  version, and the corpus, and nothing more; never HL7's endorsement. The
  README's compatibility table, derived by `scripts/compatibility.mjs`,
  says what the packages are built and judged against.

## Consequences

**What it buys.**
- **One verdict per commit.** The same commit gives the same validator, the
  same packages and the same verdict, whatever a registry or a terminology
  server says that day; a new release of either is a diff somebody reads.
- **A gate that has been seen to see.** Every check the corpus names was
  shown failing on a resource broken for it, and the gate fails the day one
  of them stops.
- **Supply-chain checks for what runs.** The JAR and the packages run in
  CI beside every pull request's code; none runs unless it is the bytes
  that were read.
- **Findings before the first export.** sdc-2 is now known to H04: a
  Questionnaire with a version needs its version algorithm.

**What it costs.**
- **Codes are not checked against terminologies the packages do not
  hold.** LOINC, SNOMED CT and UCUM codes and language tags pass offline
  with a warning; the gate refuses them until that warning is registered,
  and once it is, every such code passes unchecked, a made-up one too.
  That is what a conformance claim must say until a local check of each
  emitted code against the expansions the packages hold arrives (plan
  section 13). A media type is not checked either way.
- **A code system nobody knows passes.** A code whose system no package
  and no terminology holds -- a system URI made up or misspelt, such as
  `urn:oid:2.999.4711` -- is information, `UNKNOWN_CODESYSTEM`, online and
  offline, and information refuses nothing, so the gate accepts it
  (measured on 17 October 2026; a system under `http://example.org` is an
  error instead, `TYPE_SPECIFIC_CHECKS_DT_URL_EXAMPLE`). Which systems an
  export may emit is the packages' to refuse.
- **Time and bytes.** A run with an empty cache downloads the JAR and
  every registered package, 282,018,041 bytes by the registers' `bytes` on
  17 October 2026, and unpacks the packages into the validator's package
  cache. On the machine above, a run that unpacked every package took 2
  minutes 20 seconds, and 2 minutes 31 seconds when timed again, on Java
  17, and 2 minutes 12 seconds on Java 25, most of it unpacking; with the
  package cache kept, the whole gate took 25 seconds on Java 25 and 29 on Java 17, of
  which the validator spent 19 and 24 seconds loading and about 2
  validating the corpus. One kept run took 69 seconds, cause unknown. A CI
  runner has not been measured; its first run will say.
- **The validator's formats are not a contract.** Message ids, the
  `Package Summary` line and the outcome's extensions are what the gate
  reads; a release that changes one fails the gate loudly, and moving the
  pin means reading what changed.
- **A ballot is pinned.** SDC 4.0.0 declares
  `hl7.fhir.uv.extensions.r4` 5.3.0-ballot-tc1, so the register holds a
  version the plan's rule would never choose. It is there because a
  released guide depends on it, and it moves when the guide does; the
  register's check refuses a prerelease asked for with `-ig`, and one no
  registered package declares.
- **The validator chooses two packages for itself.** It asks for the newest
  `hl7.terminology` and `hl7.fhir.uv.extensions`, so the cache must hold
  exactly one of each; a new validator release may ask for others, and the
  gate says so by failing.
- **The corpus is built by hand.** It shows that health-core's output is
  judged, not that an export conforms. No resource carries a narrative, so
  dom-6 is registered, for that reason.
- **An issue without a message id is matched by its issue type and
  expression**, which a second issue of the same type at the same place
  would also match.
- **Some cases skip.** `pnpm test:repo` in `verify` has neither the
  downloads nor a run, and skips the registers' cases that read them; the
  `validator` job runs them, and sets `VALIDATOR_GATE_RAN`, under which a
  case that finds nothing to read fails instead of skipping.
- **What it does not prove**: that a receiving system accepts a resource,
  that a code is in its value set where the packages do not hold its
  system, or anything about a PDF.

**What it forecloses.** A validator inside a published package, a mocked
validator, a guide loaded by "latest" or by a range, and a verdict that
depends on a network.

## Alternatives considered

**The validator as it runs by default**, downloading packages and using
tx.fhir.org. It checks codes this gate cannot. Rejected: the verdict
depends on the day, the run needs the network, and every resource judged
is sent to a public server -- synthetic today, a person's record the day a
host runs it the same way.

**Letting the validator download the packages, and hashing its cache
afterwards.** Rejected: the packages are read before they are checked, and
an unpacked cache, which the validator writes indexes into, has no hash to
compare with.

**Each package as `-ig <file.tgz>`.** Rejected: the validator still
resolves FHIR itself, and every dependency a package declares, through its
cache and the network.

**A `tar` binary to unpack.** Rejected: GNU tar, bsdtar and Windows' copy
differ in what they do with a link, an absolute path or `..`, and none of
them is this repository's to hold.

**The register typed from the guides' pages.** Rejected: the validator
loads packages no guide names -- the R5 terminology and extensions, the
cross-version extensions -- and only its own load says which.

**Issues matched by their text.** Rejected: the text is the locale's and
the release's; the message id is what the validator's messages are keyed
by.

**A TypeScript validator** (`@medplum/core`'s, or a wrapper such as
`fhir-validator-wrapper`). Rejected: neither is the validator the plan
names, and what Medplum's covers was not verified.

**A `health-corpus` package now.** Rejected for now: it would have no
package output to hold, and a new workspace package changes the lockfile
for a corpus that needs no dependency. It arrives with H04.
